#!/usr/bin/env node
/**
 * Llena el home con MAS filas reales de producto (fase 3 del rediseno del storefront) --
 * el pedido explicito fue "llenar de playeras todo el home" como bartjerseys.com, que muestra
 * varias tiras de producto (mas vendidos, favoritos, por liga), no solo una.
 *
 * Todo lo que crea este script es 100% real, nunca inventado:
 *
 * 1. "Mas vendidos" -- suma real de OrderItem.quantity por producto, SOLO contando ordenes
 *    pagadas (paymentStatus = 'PAID'). Si hay menos de MIN_BESTSELLERS_TO_CLAIM productos con
 *    al menos una venta real, esta seccion NO se crea (no hay base para reclamar "mas vendido"
 *    todavia) -- en su lugar se crea "Recien agregados" (orden por fecha de creacion, siempre
 *    honesto sin importar cuantas ventas haya).
 * 2. Una fila por cada una de las N categorias de liga con mas productos reales (creadas por
 *    tools/categorize-by-league.mjs), titulada "Jerseys de {Liga}" -- NO dice "mas vendidos"
 *    a nivel liga porque normalmente no hay suficientes ventas reales para desglosarlo asi.
 *
 * Cada seccion se identifica por su `title` (unico) -- volver a correr el script actualiza los
 * productIds en vez de duplicar secciones.
 *
 * Uso:
 *   node tools/fill-home-product-rows.mjs --dry-run
 *   node tools/fill-home-product-rows.mjs
 *   node tools/fill-home-product-rows.mjs --leagues 3   # cuantas ligas destacar (default 3)
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);
const leagueCount = Number(args.leagues ?? 3);

const EXCLUDE_SLUG_PATTERNS = [/secret-jersey/, /^custom-/, /borradorretro/, /^product-\d+$/, /-demo$/];
// Productos de prueba insertados a mano (ej. "Jersey Local - Equipo Águilas (Demo)") -- sus
// imágenes apuntan al disco local efímero de Railway (/uploads/...), nunca migradas a R2, así
// que siempre se ven rotas en producción. Se excluyen por nombre además de por slug porque no
// siguen ningún patrón de slug consistente.
const EXCLUDE_NAME_PATTERNS = [/\(demo\)/i, /producto de prueba/i];
const MIN_BESTSELLERS_TO_CLAIM = 4;
// bartjerseys.com no muestra sus secciones de home como una sola tira de ~10 productos --
// muestra cuadrículas densas de varias filas (confirmado en su captura completa de home, donde
// "Los favoritos de nuestros clientes" sigue mostrando productos varias pantallas después de
// donde empieza). Subido de 10 a 20 para que la cuadrícula de HomeSectionRenderer (ahora de
// 4-5 columnas, no un slider) se vea igual de llena, siempre limitado a productos reales
// disponibles -- si hay menos de 20 elegibles simplemente se muestran los que haya.
const ROW_SIZE = 20;

function isExcludedProduct(product) {
  return (
    EXCLUDE_SLUG_PATTERNS.some((re) => re.test(product.slug)) ||
    EXCLUDE_NAME_PATTERNS.some((re) => re.test(product.name))
  );
}

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const category = await prisma.category.findUnique({ where: { slug: 'jerseys' } });
  if (!category) {
    fail('No existe la categoria "jerseys". Corre primero tools/import-legacy-jerseys.mjs.');
  }

  await fillBestsellersOrNewArrivals(prisma, dryRun);
  await fillLeagueRows(prisma, category, leagueCount, dryRun);

  console.log('');
  console.log(
    dryRun
      ? 'Dry run terminado. No se escribio nada en la base.'
      : 'Listo. El home lee HomeSection sin cache (sujeto al ISR de 60s de Next.js).',
  );
} finally {
  await prisma.$disconnect();
}

async function fillBestsellersOrNewArrivals(prisma, dryRun) {
  const sales = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: { paymentStatus: 'PAID' } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: ROW_SIZE,
  });

  if (sales.length >= MIN_BESTSELLERS_TO_CLAIM) {
    const productIds = sales.map((s) => s.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE', visibility: 'PUBLIC' },
      select: { id: true, slug: true, name: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const ordered = productIds.filter((id) => byId.has(id) && !isExcludedProduct(byId.get(id)));

    console.log(`[MAS VENDIDOS] ${ordered.length} producto(s) con ventas reales pagadas:`);
    for (const id of ordered) {
      const sale = sales.find((s) => s.productId === id);
      console.log(`  - ${byId.get(id).name} (${sale._sum.quantity} vendidos)`);
    }
    await upsertProductsSection(prisma, 'Mas vendidos', 'Los favoritos de nuestros clientes', ordered, dryRun);
    return;
  }

  console.log(
    `[MAS VENDIDOS] Solo ${sales.length} producto(s) con ventas pagadas reales (se necesitan ${MIN_BESTSELLERS_TO_CLAIM}) -- ` +
      'no hay base todavia para reclamar "mas vendidos". Se crea "Recien agregados" en su lugar (siempre honesto).',
  );

  const recent = await prisma.product.findMany({
    where: { status: 'ACTIVE', visibility: 'PUBLIC', media: { some: {} } },
    orderBy: { createdAt: 'desc' },
    take: ROW_SIZE * 2,
    select: { id: true, slug: true, name: true },
  });
  const filtered = recent.filter((p) => !isExcludedProduct(p)).slice(0, ROW_SIZE);
  console.log(`[RECIEN AGREGADOS] ${filtered.length} producto(s):`);
  for (const p of filtered) console.log(`  - ${p.name}`);
  await upsertProductsSection(
    prisma,
    'Recien agregados',
    'Recien agregados',
    filtered.map((p) => p.id),
    dryRun,
  );
}

async function fillLeagueRows(prisma, jerseysCategory, leagueCount, dryRun) {
  const leagues = await prisma.category.findMany({
    where: { parentId: jerseysCategory.id },
    select: {
      id: true,
      slug: true,
      name: true,
      _count: { select: { products: true } },
    },
  });

  if (leagues.length === 0) {
    console.log('\n[LIGAS] No hay categorias de liga (correr tools/categorize-by-league.mjs primero) -- se omite.');
    return;
  }

  const topLeagues = leagues
    .filter((l) => l._count.products > 0)
    .sort((a, b) => b._count.products - a._count.products)
    .slice(0, leagueCount);

  console.log(`\n[LIGAS] Top ${topLeagues.length} liga(s) por cantidad de productos reales:`);

  for (const league of topLeagues) {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        categories: { some: { categoryId: league.id } },
        media: { some: {} },
      },
      orderBy: { createdAt: 'desc' },
      take: ROW_SIZE,
      select: { id: true, slug: true, name: true },
    });
    const filtered = products.filter((p) => !isExcludedProduct(p));
    if (filtered.length === 0) {
      console.log(`  - ${league.name}: 0 producto(s) elegibles, se omite.`);
      continue;
    }
    console.log(`  - ${league.name}: ${filtered.length} producto(s) elegibles`);
    await upsertProductsSection(
      prisma,
      `Liga: ${league.name}`,
      `Jerseys de ${league.name}`,
      filtered.map((p) => p.id),
      dryRun,
    );
  }
}

async function upsertProductsSection(prisma, uniqueTitle, heading, productIds, dryRun) {
  if (productIds.length === 0) return;
  const existing = await prisma.homeSection.findFirst({
    where: { type: 'FEATURED_PRODUCTS', title: uniqueTitle },
  });

  if (existing) {
    console.log(`  [HOME] "${uniqueTitle}" ya existe -- se actualizan sus productos.`);
    if (!dryRun) {
      await prisma.homeSection.update({
        where: { id: existing.id },
        data: { configuration: { heading, productIds } },
      });
    }
    return;
  }

  const lastSection = await prisma.homeSection.findFirst({
    where: { status: 'PUBLISHED', isVisible: true },
    orderBy: { sortOrder: 'desc' },
  });
  const sortOrder = (lastSection?.sortOrder ?? 0) + 1;
  console.log(`  [HOME] Se crea "${uniqueTitle}" (sortOrder ${sortOrder}), publicada y visible.`);
  if (!dryRun) {
    await prisma.homeSection.create({
      data: {
        type: 'FEATURED_PRODUCTS',
        title: uniqueTitle,
        configuration: { heading, productIds },
        sortOrder,
        status: 'PUBLISHED',
        isVisible: true,
      },
    });
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function loadPrismaClient() {
  const apiPackageJson = path.resolve(repoRoot, 'apps/api/package.json');
  const requireFromApi = createRequire(apiPackageJson);
  return requireFromApi('@prisma/client').PrismaClient;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
