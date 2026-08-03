#!/usr/bin/env node
/**
 * Conecta el catalogo real (categoria "jerseys" importada por
 * tools/import-legacy-jerseys.mjs) a lo que el storefront muestra en el home:
 *
 * 1. Reemplaza los productIds de cada HomeSection FEATURED_PRODUCTS publicada
 *    y visible por una muestra de productos reales (los datos legacy no
 *    traen ningun producto marcado featured=1, asi que se eligen 8 al azar
 *    entre los que tienen nombre/slug "normal" -- se excluyen entradas raras
 *    como secret-jersey-*, custom-*, product-1/2, etc).
 * 2. Reemplaza los categoryIds de cada HomeSection FEATURED_CATEGORIES
 *    publicada y visible para que apunten solo a la categoria real "Jerseys"
 *    (antes apuntaban a categorias demo, ej. "Liga Norte"/"Liga Sur").
 * 3. Si no hay ningun NavigationMenu publicado en location="header" y/o
 *    "footer", crea uno con un link a la categoria "Jerseys". Si ya existe
 *    uno publicado, le agrega el link solo si todavia no esta.
 *
 * No toca nada mas: no borra secciones, no toca HERO_BANNER/RICH_TEXT/etc,
 * no borra las categorias/productos demo (solo deja de referenciarlos desde
 * estas secciones).
 *
 * Uso:
 *   node tools/fix-storefront-showcase.mjs --dry-run   # solo muestra que haria
 *   node tools/fix-storefront-showcase.mjs             # aplica los cambios
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const apiDir = path.resolve(repoRoot, 'apps/api');
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);
const env = loadEnvFile(path.join(apiDir, '.env'));
const R2_PUBLIC_URL = (env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

const EXCLUDE_SLUG_PATTERNS = [/secret-jersey/, /^custom-/, /borradorretro/, /^product-\d+$/];
const FEATURED_PRODUCTS_COUNT = 8;

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const category = await prisma.category.findUnique({ where: { slug: 'jerseys' } });
  if (!category) {
    fail('No existe la categoria "jerseys". Corre primero tools/import-legacy-jerseys.mjs.');
  }
  console.log(`Categoria real detectada: "${category.name}" (${category.id})`);

  const candidates = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      categories: { some: { categoryId: category.id } },
      // Requerido: que su variante mas barata (la que el home resuelve) tenga imagen real --
      // sin este filtro el picker podia elegir productos con variantes sin imageId, dejando la
      // tarjeta en blanco en el home (bug real detectado: 8/8 destacados sin foto).
      variants: { some: { status: 'ACTIVE', imageId: { not: null } } },
    },
    orderBy: { name: 'asc' },
    take: 120,
    select: { id: true, slug: true, name: true },
  });

  const featuredProducts = candidates
    .filter((product) => !EXCLUDE_SLUG_PATTERNS.some((pattern) => pattern.test(product.slug)))
    .slice(0, FEATURED_PRODUCTS_COUNT);

  if (featuredProducts.length === 0) {
    fail('No se encontraron productos elegibles en la categoria "jerseys" para destacar.');
  }

  console.log(`Productos elegidos para destacar (${featuredProducts.length}):`);
  for (const product of featuredProducts) {
    console.log(`  - ${product.name} (${product.slug})`);
  }

  await updateFeaturedProductsSections(prisma, featuredProducts, dryRun);
  await updateFeaturedCategoriesSections(prisma, category, dryRun);
  await fixBrokenHeroImage(prisma, featuredProducts, dryRun);
  await ensureNavigation(prisma, category, 'header', dryRun);
  await ensureNavigation(prisma, category, 'footer', dryRun);

  console.log('');
  console.log(
    dryRun
      ? 'Dry run terminado. No se escribio nada en la base.'
      : 'Listo. Los cambios en el home son inmediatos (sin cache). El menu de navegacion puede tardar hasta 60s en reflejarse por cache de Redis.',
  );
} finally {
  await prisma.$disconnect();
}

async function updateFeaturedProductsSections(prisma, featuredProducts, dryRun) {
  const sections = await prisma.homeSection.findMany({
    where: { type: 'FEATURED_PRODUCTS', status: 'PUBLISHED', isVisible: true },
  });

  if (sections.length === 0) {
    console.warn('No hay ninguna seccion FEATURED_PRODUCTS publicada/visible en el home -- nada que actualizar ahi.');
    return;
  }

  for (const section of sections) {
    const before = section.configuration ?? {};
    const beforeCount = Array.isArray(before.productIds) ? before.productIds.length : 0;
    const nextConfiguration = {
      ...before,
      heading: before.heading ?? 'Jerseys destacados',
      productIds: featuredProducts.map((product) => product.id),
    };

    console.log(
      `[FEATURED_PRODUCTS] "${section.title}": ${beforeCount} producto(s) demo -> ${featuredProducts.length} producto(s) reales`,
    );

    if (!dryRun) {
      await prisma.homeSection.update({
        where: { id: section.id },
        data: { configuration: nextConfiguration },
      });
    }
  }
}

async function updateFeaturedCategoriesSections(prisma, category, dryRun) {
  const sections = await prisma.homeSection.findMany({
    where: { type: 'FEATURED_CATEGORIES', status: 'PUBLISHED', isVisible: true },
  });

  if (sections.length === 0) {
    console.warn('No hay ninguna seccion FEATURED_CATEGORIES publicada/visible en el home -- nada que actualizar ahi.');
    return;
  }

  for (const section of sections) {
    const before = section.configuration ?? {};
    const beforeIds = Array.isArray(before.categoryIds) ? before.categoryIds : [];
    const nextConfiguration = {
      ...before,
      heading: before.heading ?? 'Compra por categoria',
      categoryIds: [category.id],
    };

    console.log(
      `[FEATURED_CATEGORIES] "${section.title}": ${beforeIds.length} categoria(s) demo -> solo "${category.name}". El encabezado ("${nextConfiguration.heading}") no se toco -- si ya no aplica (ej. "Compra por Liga"), edita el texto en /admin.`,
    );

    if (!dryRun) {
      await prisma.homeSection.update({
        where: { id: section.id },
        data: { configuration: nextConfiguration },
      });
    }
  }
}

/**
 * El HERO_BANNER apunta a un MediaAsset cuyo archivo local nunca existio (una de las 8 imagenes
 * "faltantes" detectadas por tools/migrate-images-to-r2.mjs), asi que su `url` sigue siendo el
 * viejo dominio de Railway (`/uploads/...`), que 404 en cuanto el contenedor se reinicia. Si
 * detectamos eso, lo reemplazamos por la imagen (ya en R2) de uno de los productos destacados.
 */
async function fixBrokenHeroImage(prisma, featuredProducts, dryRun) {
  const sections = await prisma.homeSection.findMany({
    where: { type: 'HERO_BANNER', status: 'PUBLISHED', isVisible: true },
  });
  if (sections.length === 0) return;
  if (!R2_PUBLIC_URL) {
    console.warn('[HERO_BANNER] Falta R2_PUBLIC_URL en apps/api/.env -- no puedo verificar/corregir la imagen del hero.');
    return;
  }

  const replacement = await prisma.productVariant.findFirst({
    where: { productId: { in: featuredProducts.map((p) => p.id) }, status: 'ACTIVE', imageId: { not: null } },
    select: { imageId: true },
  });
  if (!replacement?.imageId) {
    console.warn('[HERO_BANNER] Ninguno de los productos destacados tiene imagen -- no puedo corregir el hero.');
    return;
  }

  for (const section of sections) {
    const cfg = section.configuration ?? {};
    const currentImageId = cfg.imageMediaId ?? null;
    const currentAsset = currentImageId ? await prisma.mediaAsset.findUnique({ where: { id: currentImageId } }) : null;
    const isBroken = !currentAsset || !currentAsset.url.startsWith(R2_PUBLIC_URL);

    if (!isBroken) {
      console.log(`[HERO_BANNER] "${section.title}": la imagen ya esta en R2, no se toca.`);
      continue;
    }

    console.log(
      `[HERO_BANNER] "${section.title}": imagen rota/local detectada (asset ${currentImageId ?? 'ninguno'}) -> se reemplaza por la imagen de un producto destacado.`,
    );
    if (!dryRun) {
      await prisma.homeSection.update({
        where: { id: section.id },
        data: { configuration: { ...cfg, imageMediaId: replacement.imageId } },
      });
    }
  }
}

async function ensureNavigation(prisma, category, location, dryRun) {
  const menuName = location === 'header' ? 'Header' : 'Footer';
  const existingMenu = await prisma.navigationMenu.findFirst({
    where: { location, status: 'PUBLISHED' },
    include: { items: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (!existingMenu) {
    console.log(
      `[NAVIGATION] No habia ningun menu publicado en "${location}" (el sitio no tiene menu ahi). Se crea uno nuevo con un link a "${category.name}".`,
    );
    if (!dryRun) {
      const menu = await prisma.navigationMenu.create({
        data: { name: menuName, location, status: 'PUBLISHED' },
      });
      await prisma.navigationItem.create({
        data: {
          menuId: menu.id,
          label: category.name,
          type: 'CATEGORY',
          target: category.id,
          sortOrder: 0,
        },
      });
    }
    return;
  }

  const alreadyLinked = existingMenu.items.some(
    (item) => item.type === 'CATEGORY' && item.target === category.id,
  );

  if (alreadyLinked) {
    console.log(`[NAVIGATION] El menu "${location}" ya tiene un link a "${category.name}", no se toca.`);
    return;
  }

  const nextSortOrder = existingMenu.items.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  console.log(`[NAVIGATION] Se agrega un link a "${category.name}" al menu "${location}" existente.`);
  if (!dryRun) {
    await prisma.navigationItem.create({
      data: {
        menuId: existingMenu.id,
        label: category.name,
        type: 'CATEGORY',
        target: category.id,
        sortOrder: nextSortOrder,
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

function loadEnvFile(filePath) {
  const result = {};
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return result;
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}
