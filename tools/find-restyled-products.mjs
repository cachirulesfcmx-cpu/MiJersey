#!/usr/bin/env node
/**
 * Lee tools/.image-restyle-manifest.json (generado por restyle-product-images.mjs) e imprime los
 * slugs de los productos afectados, para poder revisarlos rapido en el sitio.
 *
 * Uso:
 *   node tools/find-restyled-products.mjs
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const manifestPath = path.resolve(repoRoot, 'tools/.image-restyle-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
// Los productos ya quedaron apuntando a los ids NUEVOS (el script de reestilizado actualiza las
// referencias) -- buscamos por esos, no por los viejos.
const newIds = new Set(Object.values(manifest));

const requireFromApi = createRequire(path.resolve(repoRoot, 'apps/api/package.json'));
const PrismaClient = requireFromApi('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

try {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { variants: { some: { imageId: { in: [...newIds] } } } },
        { media: { some: { mediaId: { in: [...newIds] } } } },
      ],
    },
    select: { name: true, slug: true },
    take: 30,
  });
  console.log(`Productos afectados por el ultimo run: ${products.length}\n`);
  for (const p of products) {
    console.log(`  https://mijersey-web.vercel.app/products/${p.slug}  (${p.name})`);
  }
} finally {
  await prisma.$disconnect();
}
