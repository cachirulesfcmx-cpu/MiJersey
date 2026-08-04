#!/usr/bin/env node
/**
 * Crea 4 categorias reales nuevas bajo "Jerseys" -- "Custom Shirts", "Tee Shirts",
 * "Mundial 2026" y "Temporada 26/27" -- pedidas explicitamente para que el usuario les asigne
 * productos a mano desde /admin despues. El script solo crea las categorias vacias (idempotente:
 * si el slug ya existe, no lo duplica); no les asigna ningun producto ni imagen.
 *
 * Uso:
 *   node tools/create-explore-categories.mjs --dry-run
 *   node tools/create-explore-categories.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

const NEW_CATEGORIES = [
  { slug: 'custom-shirts', name: 'Custom Shirts', sortOrder: 9 },
  { slug: 'tee-shirts', name: 'Tee Shirts', sortOrder: 10 },
  { slug: 'mundial-2026', name: 'Mundial 2026', sortOrder: 11 },
  { slug: 'temporada-26-27', name: 'Temporada 26/27', sortOrder: 12 },
];

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const parent = await prisma.category.findUnique({ where: { slug: 'jerseys' } });
  if (!parent) {
    fail('No existe la categoria "jerseys" -- corre primero tools/import-legacy-jerseys.mjs.');
  }

  for (const cat of NEW_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      console.log(`  - YA EXISTE: "${cat.name}" (${cat.slug}) -- no se toca.`);
      continue;
    }
    console.log(`  - SE CREA: "${cat.name}" (${cat.slug}), vacia, dentro de "Jerseys".`);
    if (!dryRun) {
      await prisma.category.create({
        data: {
          slug: cat.slug,
          name: cat.name,
          description: null,
          parentId: parent.id,
          sortOrder: cat.sortOrder,
          status: 'ACTIVE',
        },
      });
    }
  }

  console.log('');
  console.log(
    dryRun
      ? 'Dry run terminado. No se escribio nada en la base.'
      : 'Listo. Ahora asigna productos a cada categoria desde /admin. Cuando alguna tenga al ' +
          'menos un producto con foto, agrega su slug a CATEGORY_SLUGS en ' +
          'tools/populate-explore-banners.mjs y vuelve a correrlo para que aparezca en "Explora".',
  );
} finally {
  await prisma.$disconnect();
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
