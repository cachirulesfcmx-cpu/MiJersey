#!/usr/bin/env node
/**
 * Corrige dos nombres que quedaron mal desde la importacion del catalogo legacy
 * (tools/import-legacy-jerseys.mjs, ver legacy/jerseys_catalog.sql):
 *
 * 1. La Brand se llama "Bart Jerseys" (DEFAULT_BRAND del importador) -- se renombra a "MiJersey"
 *    y su slug de "bart-jerseys" a "mijersey" (con un Redirect permanente del slug viejo al nuevo).
 * 2. El SEO (metaTitle/ogTitle) de cada producto y de la propia marca termina en
 *    "| Go Center Suplementos" -- se reemplaza por "| MiJersey".
 *
 * Uso:
 *   node tools/fix-brand-and-seo-naming.mjs --dry-run
 *   node tools/fix-brand-and-seo-naming.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const OLD_BRAND_NAME = 'Bart Jerseys';
const OLD_BRAND_SLUG = 'bart-jerseys';
const NEW_BRAND_NAME = 'MiJersey';
const NEW_BRAND_SLUG = 'mijersey';
const OLD_SEO_SUFFIX = 'Go Center Suplementos';
const NEW_SEO_SUFFIX = 'MiJersey';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  // 1. Brand
  const brand = await prisma.brand.findUnique({ where: { slug: OLD_BRAND_SLUG } });
  if (!brand) {
    console.log(`No se encontro la marca "${OLD_BRAND_NAME}" (slug ${OLD_BRAND_SLUG}) -- nada que hacer aqui.`);
  } else {
    console.log(`Marca encontrada: "${brand.name}" (slug ${brand.slug}, id ${brand.id})`);
    console.log(`  -> se renombrara a "${NEW_BRAND_NAME}" (slug ${NEW_BRAND_SLUG})`);
    if (!dryRun) {
      await prisma.brand.update({
        where: { id: brand.id },
        data: { name: NEW_BRAND_NAME, slug: NEW_BRAND_SLUG },
      });
      const existingRedirect = await prisma.redirect.findUnique({
        where: { fromPath: `/brands/${OLD_BRAND_SLUG}` },
      });
      if (!existingRedirect) {
        await prisma.redirect.create({
          data: { fromPath: `/brands/${OLD_BRAND_SLUG}`, toPath: `/brands/${NEW_BRAND_SLUG}` },
        });
        console.log('  -> redirect permanente creado: /brands/bart-jerseys -> /brands/mijersey');
      }
    }
  }

  // 2. SEO de la marca (si tiene registro propio)
  if (brand) {
    const brandSeo = await prisma.seoMetadata.findUnique({
      where: { entityType_entityId: { entityType: 'BRAND', entityId: brand.id } },
    });
    if (brandSeo) {
      const patch = buildSeoPatch(brandSeo);
      if (Object.keys(patch).length > 0) {
        console.log(`SEO de marca -- metaTitle: "${brandSeo.metaTitle}" -> "${patch.metaTitle ?? brandSeo.metaTitle}"`);
        if (!dryRun) {
          await prisma.seoMetadata.update({ where: { id: brandSeo.id }, data: patch });
        }
      }
    }
  }

  // 3. SEO de todos los productos con el sufijo viejo
  const productSeoRows = await prisma.seoMetadata.findMany({
    where: {
      entityType: 'PRODUCT',
      OR: [
        { metaTitle: { contains: OLD_SEO_SUFFIX } },
        { ogTitle: { contains: OLD_SEO_SUFFIX } },
      ],
    },
  });

  console.log(`\nProductos con SEO a corregir: ${productSeoRows.length}`);
  let updated = 0;
  for (const row of productSeoRows) {
    const patch = buildSeoPatch(row);
    if (Object.keys(patch).length === 0) continue;
    if (!dryRun) {
      await prisma.seoMetadata.update({ where: { id: row.id }, data: patch });
    }
    updated += 1;
  }
  console.log(`${dryRun ? 'Se corregirian' : 'Corregidos'}: ${updated}`);

  console.log('');
  console.log(dryRun ? 'Dry run terminado. No se escribio nada en la base.' : 'Listo.');
} finally {
  await prisma.$disconnect();
}

function buildSeoPatch(row) {
  const patch = {};
  if (row.metaTitle?.includes(OLD_SEO_SUFFIX)) {
    patch.metaTitle = row.metaTitle.replaceAll(OLD_SEO_SUFFIX, NEW_SEO_SUFFIX);
  }
  if (row.ogTitle?.includes(OLD_SEO_SUFFIX)) {
    patch.ogTitle = row.ogTitle.replaceAll(OLD_SEO_SUFFIX, NEW_SEO_SUFFIX);
  }
  // Tambien corrige si el nombre de marca viejo quedo embebido literal en el titulo/descripcion SEO.
  if (row.metaTitle?.includes(OLD_BRAND_NAME)) {
    patch.metaTitle = (patch.metaTitle ?? row.metaTitle).replaceAll(OLD_BRAND_NAME, NEW_BRAND_NAME);
  }
  if (row.ogTitle?.includes(OLD_BRAND_NAME)) {
    patch.ogTitle = (patch.ogTitle ?? row.ogTitle).replaceAll(OLD_BRAND_NAME, NEW_BRAND_NAME);
  }
  return patch;
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
