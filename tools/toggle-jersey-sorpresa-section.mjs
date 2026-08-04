#!/usr/bin/env node
/**
 * Oculta o vuelve a mostrar la seccion "Jersey sorpresa" del home (IMAGE_TEXT) sin borrarla --
 * util mientras se resuelve que la foto actual del producto "Secret Jersey Actual" es la propia
 * foto promocional de Bartjerseys (logo "BART JERSEYS MX" + "@bartjerseys.com" + banner "ENVIO
 * EXPRESS" quemados en la imagen). No toca el producto ni su catalogo, solo la visibilidad de
 * la seccion en el home.
 *
 * Uso:
 *   node tools/toggle-jersey-sorpresa-section.mjs --hide     # oculta la seccion
 *   node tools/toggle-jersey-sorpresa-section.mjs --show     # la vuelve a mostrar
 *   node tools/toggle-jersey-sorpresa-section.mjs --dry-run --hide
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);
const hide = Boolean(args.hide);
const show = Boolean(args.show);

if (hide === show) {
  fail('Especifica exactamente una accion: --hide o --show.');
}

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const section = await prisma.homeSection.findFirst({
    where: { type: 'IMAGE_TEXT', title: 'Jersey sorpresa' },
  });

  if (!section) {
    fail('No existe ninguna seccion "Jersey sorpresa" -- nada que hacer.');
  }

  const nextVisible = hide ? false : true;
  console.log(
    `[HOME] "Jersey sorpresa": isVisible ${section.isVisible} -> ${nextVisible}${dryRun ? ' (dry run)' : ''}`,
  );
  if (!dryRun) {
    await prisma.homeSection.update({ where: { id: section.id }, data: { isVisible: nextVisible } });
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
