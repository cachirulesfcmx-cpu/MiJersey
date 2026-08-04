#!/usr/bin/env node
/**
 * "Jersey sorpresa" (fase 2 del rediseno del storefront, ahora con soporte multi-variante).
 *
 * Antes esta seccion vivia como un solo bloque IMAGE_TEXT con UN producto elegido. Bartjerseys.com
 * muestra hasta 3 variantes reales ("Secret Jersey Actual", "Secret Jersey Retro", "Secret Jersey
 * Selecciones") en tarjetas de producto normales. Este script ahora:
 *
 * 1. Localiza TODOS los productos "secret-jersey-*" ACTIVE+PUBLIC en la categoria "jerseys" con
 *    imagen real (variante o galeria) -- no solo el primero.
 * 2. A cada uno le agrega la descripcion del mecanismo de sorpresa si todavia no la tiene.
 * 3. Oculta (no borra) cualquier seccion IMAGE_TEXT vieja titulada "Jersey sorpresa" -- el formato
 *    viejo no soporta mas de un producto.
 * 4. Crea o actualiza una seccion FEATURED_PRODUCTS titulada "Jersey sorpresa" con los productIds
 *    de TODOS los candidatos encontrados (1 si solo existe "Actual", hasta N si se agregan mas
 *    variantes en /admin). HomeSectionRenderer detecta este titulo y le aplica el tratamiento
 *    especial (heading neon, banner "Envio express").
 *
 * Uso:
 *   node tools/enable-secret-jersey.mjs --dry-run
 *   node tools/enable-secret-jersey.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

const SECTION_TITLE = 'Jersey sorpresa';
const MYSTERY_BLURB =
  'Jersey sorpresa: no sabras cual equipo te llega hasta que lo recibas. Lo elegimos al azar ' +
  'de nuestro catalogo real -- misma calidad, precio especial por la sorpresa.';

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
      slug: { contains: 'secret-jersey' },
      categories: { some: { categoryId: category.id } },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      variants: {
        where: { status: 'ACTIVE' },
        orderBy: { price: 'asc' },
        take: 1,
        select: { price: true, imageId: true },
      },
      media: { orderBy: { sortOrder: 'asc' }, take: 1, select: { mediaId: true } },
    },
  });

  if (candidates.length === 0) {
    fail(
      'No se encontro ningun producto "secret-jersey-*" ACTIVE+PUBLIC en la categoria "jerseys". ' +
        'Crea las variantes que quieras (ej. "Secret Jersey Retro", "Secret Jersey Selecciones") ' +
        'en /admin con su propio inventario/foto y vuelve a correr este script.',
    );
  }

  const withImage = candidates
    .map((product) => ({
      ...product,
      imageMediaId: product.variants[0]?.imageId ?? product.media[0]?.mediaId ?? null,
    }))
    .filter((product) => Boolean(product.imageMediaId));

  const withoutImage = candidates.filter(
    (product) => !product.variants[0]?.imageId && !product.media[0]?.mediaId,
  );

  console.log(`Candidatos "secret-jersey-*" encontrados: ${candidates.length}`);
  for (const product of withImage) {
    console.log(`  - OK: "${product.name}" (${product.slug})`);
  }
  for (const product of withoutImage) {
    console.log(`  - OMITIDO (sin imagen en variante ni galeria): "${product.name}" (${product.slug})`);
  }

  if (withImage.length === 0) {
    fail('Ningun candidato tiene imagen -- sube al menos una foto a la galeria del producto en /admin.');
  }

  for (const product of withImage) {
    const alreadyHasBlurb = (product.description ?? '').includes('Jersey sorpresa');
    if (alreadyHasBlurb) {
      console.log(`[PRODUCTO] "${product.name}" ya tiene la descripcion -- no se toca.`);
      continue;
    }
    const nextDescription = product.description
      ? `${MYSTERY_BLURB}\n\n${product.description}`
      : MYSTERY_BLURB;
    console.log(`[PRODUCTO] "${product.name}": se antepone la descripcion del mecanismo de sorpresa.`);
    if (!dryRun) {
      await prisma.product.update({ where: { id: product.id }, data: { description: nextDescription } });
    }
  }

  // El formato viejo (IMAGE_TEXT, un solo producto) no aplica mas -- se oculta en vez de borrar
  // por si se quiere volver a consultar despues.
  const oldSection = await prisma.homeSection.findFirst({
    where: { type: 'IMAGE_TEXT', title: SECTION_TITLE },
  });
  if (oldSection) {
    console.log(
      `[HOME] Se encontro la seccion vieja IMAGE_TEXT "${SECTION_TITLE}" -- se oculta (el formato nuevo usa FEATURED_PRODUCTS).`,
    );
    if (!dryRun) {
      await prisma.homeSection.update({ where: { id: oldSection.id }, data: { isVisible: false } });
    }
  }

  const productIds = withImage.map((p) => p.id);
  const configuration = {
    heading: '¿Te atreves con el jersey sorpresa?',
    productIds,
  };

  const existingSection = await prisma.homeSection.findFirst({
    where: { type: 'FEATURED_PRODUCTS', title: SECTION_TITLE },
  });

  if (existingSection) {
    console.log(
      `[HOME] Ya existe la seccion FEATURED_PRODUCTS "${SECTION_TITLE}" -- se actualiza con ${productIds.length} producto(s).`,
    );
    if (!dryRun) {
      await prisma.homeSection.update({ where: { id: existingSection.id }, data: { configuration } });
    }
  } else {
    const lastSection = await prisma.homeSection.findFirst({
      where: { status: 'PUBLISHED', isVisible: true },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = (lastSection?.sortOrder ?? 0) + 1;
    console.log(
      `[HOME] Se crea la seccion FEATURED_PRODUCTS "${SECTION_TITLE}" (sortOrder ${sortOrder}) con ${productIds.length} producto(s), publicada y visible.`,
    );
    if (!dryRun) {
      await prisma.homeSection.create({
        data: {
          type: 'FEATURED_PRODUCTS',
          title: SECTION_TITLE,
          configuration,
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
