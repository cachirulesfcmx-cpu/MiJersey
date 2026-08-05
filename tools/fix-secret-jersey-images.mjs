#!/usr/bin/env node
/**
 * Las fotos de los productos "secret-jersey-*" (Jersey Sorpresa) resultaron ser piezas de
 * marketing REALES de Bartjerseys -- una trae su logo "BART JERSEYS MX" y el ribbon rojo "ENVIO
 * EXPRESS" quemados en la imagen, la otra es literalmente un infografico con su URL
 * (bartjerseys.com), su slogan ("CALIDAD - AUTENTICIDAD - PASION") y la cifra "+17,000 clientes
 * satisfechos". Esto llego con el dump legacy (ver legacy/jerseys_catalog.sql) y quedo sin
 * detectar porque tecnicamente SI tenian imagen (no dispararon el filtro de "sin foto"). No es
 * un problema de estilo -- es literalmente el material de marketing de un competidor mostrandose
 * en MiJersey, asi que se quita sin importar el resto del rediseno "1:1".
 *
 * Este script:
 * 1. Quita (no borra el MediaAsset, solo el vinculo ProductMedia) las fotos de marketing de
 *    Bartjerseys de cada producto "secret-jersey-*".
 * 2. Les asigna en su lugar una foto REAL de un jersey del catalogo (ya con el fondo azul de
 *    tools/restyle-product-images.mjs) -- una por tema: retro usa una foto de "retro-otros",
 *    selecciones usa una de "selecciones", y actual/doble usan la mas reciente en general.
 *
 * Uso:
 *   node tools/fix-secret-jersey-images.mjs --dry-run
 *   node tools/fix-secret-jersey-images.mjs
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const apiDir = path.resolve(repoRoot, 'apps/api');
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

const R2_PUBLIC_URL = (loadEnvFile(path.join(apiDir, '.env')).R2_PUBLIC_URL ?? '').replace(/\/$/, '');

// slug del producto "secret-jersey-*" -> slug de categoria real de donde tomarle una foto de reemplazo.
// "actual" y "doble" no tienen una categoria tematica obvia -- usan la foto real mas reciente del
// catalogo en general (cualquier jersey "actual" sirve como representativo).
const REPLACEMENT_CATEGORY_BY_PRODUCT_SLUG = {
  'secret-jersey-retro': 'retro-otros',
  'secret-jersey-selecciones': 'selecciones',
  'secret-jersey-actual': null,
  'secret-jersey-doble': null,
};

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const products = await prisma.product.findMany({
    where: { slug: { startsWith: 'secret-jersey' }, status: 'ACTIVE', visibility: 'PUBLIC' },
    select: { id: true, slug: true, name: true },
  });

  if (products.length === 0) {
    fail('No se encontro ningun producto "secret-jersey-*".');
  }
  console.log(`Productos "Jersey sorpresa" encontrados: ${products.length}`);

  for (const product of products) {
    // OJO: ProductMedia.mediaId es una columna plana (sin @relation en el schema hacia
    // MediaAsset) -- no existe ningun campo de include llamado "media" en este modelo. El
    // include original tronaba con "Unknown field `media`". Si se necesitara la URL real
    // habria que resolverla aparte con prisma.mediaAsset.findUnique({ where: { id: mediaId } }).
    const currentMedia = await prisma.productMedia.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: 'asc' },
    });

    // Se quitan TODAS las fotos actuales de estos productos (no solo las que fallen el chequeo de
    // R2) -- confirmado a mano que ambas fotos de cada "secret-jersey-*" son material de
    // marketing de Bartjerseys (logo, ribbon "ENVIO EXPRESS", infografico con su URL/slogan), no
    // fotos de producto real.
    console.log(`\n[${product.name}] (${product.slug})`);
    console.log(`  Fotos actuales a quitar: ${currentMedia.length}`);

    const categorySlug = REPLACEMENT_CATEGORY_BY_PRODUCT_SLUG[product.slug];
    const replacement = await findReplacementImage(prisma, categorySlug);
    if (!replacement) {
      console.log(
        `  OMITIDO: no se encontro ninguna foto real de reemplazo (categoria "${categorySlug ?? 'cualquiera'}").`,
      );
      continue;
    }
    console.log(`  Reemplazo: MediaAsset ${replacement.mediaId} (de "${replacement.fromProductName}")`);

    if (!dryRun) {
      await prisma.productMedia.deleteMany({ where: { productId: product.id } });
      await prisma.productMedia.create({
        data: { productId: product.id, mediaId: replacement.mediaId, sortOrder: 0 },
      });
    }
  }

  console.log('');
  console.log(dryRun ? 'Dry run terminado. No se escribio nada en la base.' : 'Listo.');
} finally {
  await prisma.$disconnect();
}

async function findReplacementImage(prisma, categorySlug) {
  const where = {
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    slug: { not: { startsWith: 'secret-jersey' } },
    ...(categorySlug ? { categories: { some: { category: { slug: categorySlug } } } } : {}),
  };

  const candidates = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      name: true,
      variants: {
        where: { status: 'ACTIVE' },
        orderBy: { price: 'asc' },
        take: 1,
        select: { imageId: true },
      },
      media: { orderBy: { sortOrder: 'asc' }, take: 1, select: { mediaId: true } },
    },
  });

  for (const candidate of candidates) {
    const mediaId = candidate.variants[0]?.imageId ?? candidate.media[0]?.mediaId ?? null;
    if (!mediaId) continue;
    if (R2_PUBLIC_URL) {
      const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaId }, select: { url: true } });
      if (!asset || !asset.url.startsWith(R2_PUBLIC_URL)) continue;
    }
    return { mediaId, fromProductName: candidate.name };
  }
  return null;
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
