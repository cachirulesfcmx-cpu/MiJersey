#!/usr/bin/env node
/**
 * Oculta los productos de semilla/demo (SKU que empieza con "DEMO-") que quedaron visibles y
 * publicos en la tienda real por error -- ej. "Jersey Local - Equipo Aguilas (Demo)". Los pone en
 * visibility: HIDDEN (no los borra, por si se quieren revisar despues).
 *
 * Uso:
 *   node tools/hide-demo-products.mjs --dry-run
 *   node tools/hide-demo-products.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const products = await prisma.product.findMany({
    where: { sku: { startsWith: 'DEMO-' } },
    select: { id: true, name: true, sku: true, visibility: true },
  });

  console.log(`Productos DEMO encontrados: ${products.length}`);
  for (const p of products) {
    console.log(`  - ${p.name} (${p.sku}) -- visibility actual: ${p.visibility}`);
  }

  const toHide = products.filter((p) => p.visibility !== 'HIDDEN');
  console.log(`\nA ocultar: ${toHide.length}`);
  if (!dryRun) {
    for (const p of toHide) {
      await prisma.product.update({ where: { id: p.id }, data: { visibility: 'HIDDEN' } });
    }
  }

  console.log('');
  console.log(dryRun ? 'Dry run terminado. No se escribio nada en la base.' : 'Listo.');
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
