#!/usr/bin/env node
/**
 * Puebla (o actualiza) la seccion BANNER_GRID del home con imagenes reales del
 * catalogo importado (categoria "jerseys"), para el nuevo banner-slider
 * diagonal de HomeSectionRenderer (Fase 1 del rediseno del storefront).
 *
 * - Si ya existe una seccion BANNER_GRID publicada y visible, reemplaza su
 *   `configuration.banners` por productos reales (no toca titulo/sortOrder).
 * - Si no existe ninguna, crea una nueva, publicada y visible, justo despues
 *   del HERO_BANNER publicado (o al principio si no hay hero).
 * - Cada banner enlaza a `/products/:slug` del producto elegido.
 *
 * Uso:
 *   node tools/populate-banner-grid.mjs --dry-run   # solo muestra que haria
 *   node tools/populate-banner-grid.mjs             # aplica los cambios
 *   node tools/populate-banner-grid.mjs --count 8   # cuantos banners (default 6)
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const apiDir = path.resolve(repoRoot, 'apps/api');
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);
// Antes 6 (para el slider de una sola fila) -- ahora que HomeSectionRenderer muestra "Destacados"
// como cuadrícula de 2/4 columnas en vez de tira horizontal, hacen falta más productos reales
// para que se vea igual de lleno que la cuadrícula de bartjerseys.com.
const bannerCount = Number(args.count ?? 12);
// Mismo criterio que populate-explore-banners.mjs: nunca elegir un MediaAsset que quedo apuntando
// al disco efimero de Railway en vez de a R2 (ver tools/migrate-images-to-r2.mjs).
const R2_PUBLIC_URL = (loadEnvFile(path.join(apiDir, '.env')).R2_PUBLIC_URL ?? '').replace(/\/$/, '');

const EXCLUDE_SLUG_PATTERNS = [/secret-jersey/, /^custom-/, /borradorretro/, /^product-\d+$/, /-demo$/];
const EXCLUDE_NAME_PATTERNS = [/\(demo\)/i, /producto de prueba/i];

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const category = await prisma.category.findUnique({ where: { slug: 'jerseys' } });
  if (!category) {
    fail('No existe la categoria "jerseys". Corre primero tools/import-legacy-jerseys.mjs.');
  }

  const candidates = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      categories: { some: { categoryId: category.id } },
    },
    orderBy: { name: 'asc' },
    take: 80,
    select: {
      id: true,
      slug: true,
      name: true,
      variants: {
        where: { status: 'ACTIVE' },
        orderBy: { price: 'asc' },
        take: 1,
        select: { imageId: true },
      },
      // La galería (ProductMedia) es la fuente PRIMARIA de imagen en este catálogo legacy --
      // variant.imageId es solo un override opcional que el import nunca pobló. Mirar solo
      // variant.imageId (como hacía este script antes) deja `withImage` en 0 casi siempre, que
      // es exactamente por lo que BANNER_GRID nunca se poblaba en producción.
      media: { orderBy: { sortOrder: 'asc' }, take: 1, select: { mediaId: true } },
    },
  });

  const candidatesWithImage = candidates
    .filter((product) => !EXCLUDE_SLUG_PATTERNS.some((pattern) => pattern.test(product.slug)))
    .filter((product) => !EXCLUDE_NAME_PATTERNS.some((pattern) => pattern.test(product.name)))
    .map((product) => ({
      ...product,
      imageMediaId: product.variants[0]?.imageId ?? product.media[0]?.mediaId ?? null,
    }))
    .filter((product) => Boolean(product.imageMediaId));

  if (candidatesWithImage.length === 0) {
    fail(
      'Ningun producto de "jerseys" tiene imagen (ni en su variante ni en su galeria) -- revisa que el import de imagenes haya corrido bien.',
    );
  }

  const withImage = [];
  for (const product of candidatesWithImage) {
    if (R2_PUBLIC_URL) {
      const asset = await prisma.mediaAsset.findUnique({
        where: { id: product.imageMediaId },
        select: { url: true },
      });
      if (!asset || !asset.url.startsWith(R2_PUBLIC_URL)) {
        console.log(
          `  - saltando "${product.name}": imagen rota/no migrada a R2 (${asset?.url ?? 'sin asset'}).`,
        );
        continue;
      }
    }
    withImage.push(product);
    if (withImage.length >= bannerCount) break;
  }

  if (withImage.length === 0) {
    fail('Ningun producto de "jerseys" tiene una imagen valida en R2.');
  }

  const chosen = withImage.slice(0, bannerCount);
  console.log(`Banners elegidos (${chosen.length} de ${withImage.length} elegibles):`);
  for (const product of chosen) {
    console.log(`  - ${product.name} (${product.slug})`);
  }

  const banners = chosen.map((product) => ({
    imageMediaId: product.imageMediaId,
    title: product.name,
    linkUrl: `/products/${product.slug}`,
  }));

  const existing = await prisma.homeSection.findFirst({
    where: { type: 'BANNER_GRID', status: 'PUBLISHED', isVisible: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (existing) {
    const beforeCount = Array.isArray(existing.configuration?.banners)
      ? existing.configuration.banners.length
      : 0;
    console.log(
      `[BANNER_GRID] "${existing.title}": ${beforeCount} banner(s) actual(es) -> ${banners.length} banner(s) reales`,
    );
    if (!dryRun) {
      await prisma.homeSection.update({
        where: { id: existing.id },
        data: { configuration: { banners } },
      });
    }
  } else {
    const hero = await prisma.homeSection.findFirst({
      where: { type: 'HERO_BANNER', status: 'PUBLISHED', isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });
    const sortOrder = hero ? hero.sortOrder + 1 : 1;
    console.log(
      `[BANNER_GRID] No habia ninguna seccion BANNER_GRID publicada/visible -- se crea una nueva (sortOrder ${sortOrder}) con ${banners.length} banner(s) reales.`,
    );
    if (!dryRun) {
      await prisma.homeSection.create({
        data: {
          type: 'BANNER_GRID',
          title: 'Destacados',
          configuration: { banners },
          sortOrder,
          status: 'PUBLISHED',
          isVisible: true,
        },
      });
    }
  }

  console.log('');
  console.log(
    dryRun
      ? 'Dry run terminado. No se escribio nada en la base.'
      : 'Listo. El home lee HomeSection sin cache, asi que el cambio es inmediato (sujeto al ISR de 60s de Next.js).',
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
