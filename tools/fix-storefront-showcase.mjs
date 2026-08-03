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
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

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
    },
    orderBy: { name: 'asc' },
    take: 60,
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
