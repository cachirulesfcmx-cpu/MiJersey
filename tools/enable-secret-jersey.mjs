#!/usr/bin/env node
/**
 * "Jersey sorpresa" (fase 2 del rediseno del storefront).
 *
 * Los productos demo "secret-jersey-*" del catalogo legacy YA estan ACTIVE+PUBLIC y dentro de
 * la categoria "jerseys" (por eso fix-storefront-showcase.mjs tuvo que EXCLUIRLOS de lo
 * destacado, no porque estuvieran ocultos). Es decir: ya son comprables hoy, solo que nadie los
 * encuentra porque no aparecen en ningun lado destacado. Este script:
 *
 * 1. Los localiza y elige el mejor candidato (con imagen real en su variante mas barata).
 * 2. Le agrega una descripcion clara explicando el mecanismo ("no sabras que jersey es hasta
 *    que te llegue, elegido al azar del catalogo") -- sin tocar el nombre/precio real.
 * 3. Crea (o actualiza) una seccion IMAGE_TEXT en el home que lo enlaza directo -- una forma de
 *    darle visibilidad sin mezclarlo con los productos "normales" destacados por
 *    fix-storefront-showcase.mjs.
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
    },
  });

  if (candidates.length === 0) {
    fail(
      'No se encontro ningun producto "secret-jersey-*" ACTIVE+PUBLIC en la categoria "jerseys". ' +
        'No se creo ninguno nuevo (requeriria inventario/variantes desde cero) -- si quieres uno, ' +
        'creelo manualmente en /admin y vuelve a correr este script para agregarle la seccion del home.',
    );
  }

  const withImage = candidates.filter((product) => product.variants[0]?.imageId);
  const chosen = withImage[0] ?? candidates[0];
  console.log(`Candidatos "secret-jersey-*" encontrados: ${candidates.length}`);
  console.log(`Elegido para destacar: "${chosen.name}" (${chosen.slug})${withImage[0] ? '' : ' -- sin imagen en su variante mas barata'}`);

  const alreadyHasBlurb = (chosen.description ?? '').includes('Jersey sorpresa');
  if (alreadyHasBlurb) {
    console.log('[PRODUCTO] Ya tiene la descripcion de "jersey sorpresa" -- no se toca.');
  } else {
    const nextDescription = chosen.description
      ? `${MYSTERY_BLURB}\n\n${chosen.description}`
      : MYSTERY_BLURB;
    console.log('[PRODUCTO] Se antepone la descripcion del mecanismo de sorpresa.');
    if (!dryRun) {
      await prisma.product.update({ where: { id: chosen.id }, data: { description: nextDescription } });
    }
  }

  const existingSection = await prisma.homeSection.findFirst({
    where: { type: 'IMAGE_TEXT', title: 'Jersey sorpresa' },
  });
  const imageMediaId = chosen.variants[0]?.imageId ?? null;
  const configuration = {
    imageMediaId,
    title: '¿Te atreves con el jersey sorpresa?',
    body: 'Un jersey real de nuestro catalogo, elegido al azar. La emocion de no saber cual te toca.',
    ctaLabel: 'Ver jersey sorpresa',
    ctaUrl: `/products/${chosen.slug}`,
    imagePosition: 'left',
  };

  if (existingSection) {
    console.log('[HOME] Ya existe la seccion "Jersey sorpresa" -- se actualiza para apuntar al producto elegido.');
    if (!dryRun) {
      await prisma.homeSection.update({ where: { id: existingSection.id }, data: { configuration } });
    }
  } else {
    const lastSection = await prisma.homeSection.findFirst({
      where: { status: 'PUBLISHED', isVisible: true },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = (lastSection?.sortOrder ?? 0) + 1;
    console.log(`[HOME] Se crea la seccion "Jersey sorpresa" (sortOrder ${sortOrder}), publicada y visible.`);
    if (!dryRun) {
      await prisma.homeSection.create({
        data: {
          type: 'IMAGE_TEXT',
          title: 'Jersey sorpresa',
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
