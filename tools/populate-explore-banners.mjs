#!/usr/bin/env node
/**
 * Puebla (o actualiza) la seccion BANNER_GRID "Explora" -- el slider lateral de categorias
 * reales que faltaba en el home (equivalente honesto al slider de promociones de
 * bartjerseys.com: ahi enlazan a "rebajas de verano", "custom shirts", "tee shirts", "mundial
 * 2026", etc., pero esas secciones no existen en nuestro catalogo real. En vez de inventarlas,
 * este script enlaza a las categorias que SI existen (Retro/Otros, Selecciones, ligas...), cada
 * una con una foto real de un producto de esa categoria. HomeSectionRenderer distingue esta
 * seccion por su titulo ("Explora") y le aplica el tratamiento visual en blanco y negro.
 *
 * No agrega ningun badge de descuento -- no hay ninguna promocion real a nivel categoria
 * todavia. Si en el futuro se crea una (ver modulo de Promotion), se puede pasar con --badges.
 *
 * Uso:
 *   node tools/populate-explore-banners.mjs --dry-run
 *   node tools/populate-explore-banners.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

const SECTION_TITLE = 'Explora';
// Categorias reales a destacar, en este orden. Si alguna no tiene ningun producto con imagen se
// omite silenciosamente (se loggea) en vez de fallar -- por eso ya se pueden incluir aqui las 4
// categorias nuevas (tools/create-explore-categories.mjs) aunque todavia esten vacias: en cuanto
// se les asigne un producto con foto desde /admin, apareceran solas la proxima vez que se corra
// este script, sin tener que tocar esta lista de nuevo.
const CATEGORY_SLUGS = [
  'retro-otros',
  'selecciones',
  'liga-mx',
  'premier-league',
  'la-liga',
  'custom-shirts',
  'tee-shirts',
  'mundial-2026',
  'temporada-26-27',
];

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const banners = [];

  for (const slug of CATEGORY_SLUGS) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      console.log(`  - OMITIDO: categoria "${slug}" no existe.`);
      continue;
    }

    const product = await prisma.product.findFirst({
      where: {
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        categories: { some: { categoryId: category.id } },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        variants: {
          where: { status: 'ACTIVE' },
          orderBy: { price: 'asc' },
          take: 1,
          select: { imageId: true },
        },
        media: { orderBy: { sortOrder: 'asc' }, take: 1, select: { mediaId: true } },
      },
    });

    const imageMediaId = product?.variants[0]?.imageId ?? product?.media[0]?.mediaId ?? null;
    if (!imageMediaId) {
      console.log(`  - OMITIDO: categoria "${category.name}" no tiene ningun producto con imagen.`);
      continue;
    }

    console.log(`  - OK: "${category.name}" (${slug})`);
    banners.push({
      imageMediaId,
      title: category.name,
      linkUrl: `/categories/${category.slug}`,
      badge: null,
    });
  }

  console.log(`\nBanners de "Explora" encontrados: ${banners.length}`);
  if (banners.length === 0) {
    fail('Ninguna categoria tiene producto con imagen -- no se crea la seccion.');
  }

  const existing = await prisma.homeSection.findFirst({
    where: { type: 'BANNER_GRID', title: SECTION_TITLE },
  });

  if (existing) {
    console.log(`[HOME] Ya existe "${SECTION_TITLE}" -- se actualiza con ${banners.length} banner(s).`);
    if (!dryRun) {
      await prisma.homeSection.update({ where: { id: existing.id }, data: { configuration: { banners } } });
    }
  } else {
    const lastSection = await prisma.homeSection.findFirst({
      where: { status: 'PUBLISHED', isVisible: true },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = (lastSection?.sortOrder ?? 0) + 1;
    console.log(`[HOME] Se crea "${SECTION_TITLE}" (sortOrder ${sortOrder}) con ${banners.length} banner(s).`);
    if (!dryRun) {
      await prisma.homeSection.create({
        data: {
          type: 'BANNER_GRID',
          title: SECTION_TITLE,
          configuration: { banners },
          sortOrder,
          status: 'PUBLISHED',
          isVisible: true,
        },
      });
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
