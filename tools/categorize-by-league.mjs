#!/usr/bin/env node
/**
 * El catálogo real solo tiene UNA categoría ("jerseys") -- no hay forma de mostrar un grid de
 * ligas real (LaLiga, Serie A, Liga MX, etc.) sin datos reales que lo respalden. Este script:
 *
 * 1. Crea categorías-liga como hijas de "jerseys" (LaLiga, Serie A, Premier League, Bundesliga,
 *    Ligue 1, Liga MX, Selecciones, Retro/Otros) si no existen ya.
 * 2. Para cada producto de "jerseys", detecta el equipo/selección en su NOMBRE (no hay campo de
 *    equipo separado en el catálogo importado) contra un diccionario de clubes/selecciones y lo
 *    asigna (ademas de "jerseys", no en vez de) a la categoría-liga que corresponda.
 * 3. Actualiza la(s) sección(es) FEATURED_CATEGORIES publicadas del home para que listen las
 *    ligas que sí tienen productos asignados (en vez de solo "jerseys").
 *
 * Los productos que no matchean ningún club/selección conocido caen en "Retro/Otros" y se listan
 * en la consola para revisión manual -- el diccionario es un punto de partida razonable, no
 * exhaustivo, dado que este script no tiene forma de ver el catálogo real de antemano.
 *
 * Uso:
 *   node tools/categorize-by-league.mjs --dry-run
 *   node tools/categorize-by-league.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

/**
 * Orden importa: se evalúan de arriba a abajo y gana el primer match, así que las entradas más
 * específicas (clubes) van antes que las genéricas (selecciones) para evitar falsos positivos
 * como que "Real Madrid" caiga en una selección por compartir una palabra.
 */
const LEAGUES = [
  {
    slug: 'la-liga',
    name: 'LaLiga',
    keywords: [
      'real madrid',
      'barcelona',
      'atletico de madrid',
      'atletico madrid',
      'sevilla',
      'valencia',
      'real betis',
      'athletic bilbao',
      'real sociedad',
      'villarreal',
      'girona',
    ],
  },
  {
    slug: 'serie-a',
    name: 'Serie A',
    keywords: [
      'ac milan',
      'inter de milan',
      'inter milan',
      'juventus',
      'napoli',
      'roma',
      'lazio',
      'atalanta',
      'fiorentina',
      'torino',
    ],
  },
  {
    slug: 'premier-league',
    name: 'Premier League',
    keywords: [
      'manchester united',
      'man united',
      'man utd',
      'manchester city',
      'man city',
      'liverpool',
      'chelsea',
      'arsenal',
      'tottenham',
      'newcastle',
      'west ham',
      'aston villa',
      'everton',
    ],
  },
  {
    slug: 'bundesliga',
    name: 'Bundesliga',
    keywords: ['bayern munich', 'bayern', 'borussia dortmund', 'dortmund', 'leipzig', 'leverkusen', 'schalke'],
  },
  {
    slug: 'ligue-1',
    name: 'Ligue 1',
    keywords: ['psg', 'paris saint', 'marseille', 'marsella', 'lyon', 'monaco'],
  },
  {
    slug: 'eredivisie',
    name: 'Eredivisie',
    keywords: ['ajax', 'psv', 'feyenoord'],
  },
  {
    slug: 'liga-mx',
    name: 'Liga MX',
    keywords: [
      'chivas',
      'america',
      'cruz azul',
      'pumas',
      'tigres',
      'monterrey',
      'toluca',
      'leon',
      'santos laguna',
      'santos',
      'necaxa',
      'atlas',
      'pachuca',
      'xolos',
      'tijuana',
      'puebla',
      'queretaro',
      'mazatlan',
      'juarez',
    ],
  },
  {
    slug: 'selecciones',
    name: 'Selecciones',
    keywords: [
      'mexico',
      'noruega',
      'norway',
      'colombia',
      'argentina',
      'brasil',
      'brazil',
      'espana',
      'spain',
      'alemania',
      'germany',
      'portugal',
      'francia',
      'france',
      'inglaterra',
      'england',
      'italia',
      'uruguay',
      'chile',
      'japon',
      'japan',
      'corea',
      'korea',
      'estados unidos',
      'usa',
      'canada',
      'croacia',
      'holanda',
      'netherlands',
      'belgica',
      'belgium',
    ],
  },
];

const FALLBACK = { slug: 'retro-otros', name: 'Retro / Otros' };

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const parent = await prisma.category.findUnique({ where: { slug: 'jerseys' } });
  if (!parent) {
    fail('No existe la categoria "jerseys". Corre primero tools/import-legacy-jerseys.mjs.');
  }

  const allDefs = [...LEAGUES, FALLBACK];
  const categoryBySlug = new Map();
  let sortOrder = 0;
  for (const def of allDefs) {
    let category = await prisma.category.findUnique({ where: { slug: def.slug } });
    if (!category) {
      console.log(`[CATEGORIA] Creando "${def.name}" (${def.slug})`);
      if (!dryRun) {
        category = await prisma.category.create({
          data: {
            slug: def.slug,
            name: def.name,
            parentId: parent.id,
            sortOrder: sortOrder,
            status: 'ACTIVE',
          },
        });
      }
    } else {
      console.log(`[CATEGORIA] "${def.name}" ya existe, no se toca.`);
    }
    if (category) categoryBySlug.set(def.slug, category);
    sortOrder += 1;
  }

  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      categories: { some: { categoryId: parent.id } },
    },
    select: { id: true, name: true, slug: true },
  });
  console.log(`\nProductos en "jerseys": ${products.length}`);

  const counts = new Map();
  const unmatched = [];
  const assignments = [];

  for (const product of products) {
    const haystack = normalize(product.name);
    const match = LEAGUES.find((league) =>
      league.keywords.some((kw) => haystack.includes(normalize(kw))),
    );
    const targetSlug = match ? match.slug : FALLBACK.slug;
    if (!match) unmatched.push(product.name);
    counts.set(targetSlug, (counts.get(targetSlug) ?? 0) + 1);
    assignments.push({ productId: product.id, categorySlug: targetSlug });
  }

  console.log('\nDistribución por liga:');
  for (const def of allDefs) {
    console.log(`  ${def.name}: ${counts.get(def.slug) ?? 0}`);
  }

  if (!dryRun) {
    for (const { productId, categorySlug } of assignments) {
      const category = categoryBySlug.get(categorySlug);
      if (!category) continue;
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId, categoryId: category.id } },
        create: { productId, categoryId: category.id },
        update: {},
      });
    }
  }

  const withProducts = allDefs.filter((def) => (counts.get(def.slug) ?? 0) > 0);
  await updateFeaturedCategoriesSections(prisma, categoryBySlug, withProducts, dryRun);

  if (unmatched.length > 0) {
    console.log(`\n${unmatched.length} producto(s) sin club/selección reconocido (cayeron en "Retro / Otros"):`);
    for (const name of unmatched.slice(0, 40)) console.log(`  - ${name}`);
    if (unmatched.length > 40) console.log(`  ... y ${unmatched.length - 40} más.`);
  }

  console.log('');
  console.log(dryRun ? 'Dry run terminado. No se escribió nada en la base.' : 'Listo.');
} finally {
  await prisma.$disconnect();
}

async function updateFeaturedCategoriesSections(prisma, categoryBySlug, withProducts, dryRun) {
  const sections = await prisma.homeSection.findMany({
    where: { type: 'FEATURED_CATEGORIES', status: 'PUBLISHED', isVisible: true },
  });
  if (sections.length === 0) {
    console.warn('\nNo hay ninguna seccion FEATURED_CATEGORIES publicada/visible -- nada que actualizar ahi.');
    return;
  }

  const categoryIds = withProducts
    .map((def) => categoryBySlug.get(def.slug)?.id)
    .filter((id) => !!id);

  for (const section of sections) {
    const before = section.configuration ?? {};
    console.log(
      `\n[FEATURED_CATEGORIES] "${section.title}": ${Array.isArray(before.categoryIds) ? before.categoryIds.length : 0} -> ${categoryIds.length} categorias (ligas con productos reales)`,
    );
    if (!dryRun) {
      await prisma.homeSection.update({
        where: { id: section.id },
        data: {
          configuration: { ...before, heading: before.heading ?? 'Compra por Liga', categoryIds },
        },
      });
    }
  }
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
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
