#!/usr/bin/env node
/**
 * Sube los logos de liga (tools/league-logo-assets/*.webp, nombrados por slug de categoria) a
 * Cloudflare R2, crea su MediaAsset (type IMAGE), y asigna la URL resultante como `image` de la
 * categoria correspondiente (ver Category.image en el schema).
 *
 * ADVERTENCIA: estos son los logos OFICIALES de cada liga (marcas registradas de terceros, no de
 * MiJersey ni de Bartjerseys). Usarlos en una tienda que revende jerseys sin licencia de esas
 * ligas es un riesgo real de infraccion de marca. Este script existe porque el usuario decidio
 * explicitamente asumir ese riesgo -- si en algun momento se quiere revertir, basta con poner
 * `image: null` en las categorias listadas abajo (o correr este mismo script apuntando a
 * versiones sin logo).
 *
 * Uso:
 *   node tools/upload-league-logos.mjs --dry-run
 *   node tools/upload-league-logos.mjs
 */
import { createHash, randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const apiDir = path.resolve(repoRoot, 'apps/api');
const assetsDir = path.resolve(repoRoot, 'tools/league-logo-assets');
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

const requireFromApi = createRequire(path.resolve(apiDir, 'package.json'));

const env = loadEnvFile(path.join(apiDir, '.env'));
const R2_BUCKET = env.R2_BUCKET;
const R2_ENDPOINT = env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = (env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

if (!R2_BUCKET || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
  fail('Faltan variables R2_* en apps/api/.env (mismas que usan los otros scripts de R2).');
}

const { S3Client, PutObjectCommand } = requireFromApi('@aws-sdk/client-s3');
const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const PrismaClient = requireFromApi('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

try {
  const files = readdirSync(assetsDir)
    .filter((f) => f.toLowerCase().endsWith('.webp'))
    .sort();

  if (files.length === 0) {
    fail(`No hay archivos .webp en ${assetsDir}.`);
  }
  console.log(`Logos locales encontrados: ${files.length} (${files.join(', ')})`);

  let updated = 0;
  for (const file of files) {
    const slug = file.replace(/\.webp$/i, '');
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      console.log(`  - OMITIDO: "${file}" -- no existe la categoria "${slug}".`);
      continue;
    }

    const localPath = path.join(assetsDir, file);
    const buffer = await readFile(localPath);
    const contentHash = createHash('sha256').update(buffer).digest('hex');

    let asset = await prisma.mediaAsset.findUnique({ where: { contentHash } });
    if (asset) {
      console.log(`  - "${category.name}": logo ya existe como MediaAsset ${asset.id} -- se reusa.`);
    } else {
      const storageKey = `${randomUUID()}.webp`;
      console.log(
        `  - "${category.name}": subiendo "${file}" a R2 como ${storageKey} (${(buffer.length / 1024).toFixed(0)} KB)`,
      );
      if (!dryRun) {
        await s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: storageKey,
            Body: buffer,
            ContentType: 'image/webp',
          }),
        );
        asset = await prisma.mediaAsset.create({
          data: {
            filename: storageKey,
            originalName: file,
            mimeType: 'image/webp',
            type: 'IMAGE',
            size: buffer.length,
            status: 'ACTIVE',
            contentHash,
            storageKey,
            url: `${R2_PUBLIC_URL}/${storageKey}`,
          },
        });
      }
    }

    if (!dryRun && asset) {
      await prisma.category.update({ where: { id: category.id }, data: { image: asset.url } });
    }
    console.log(`    -> asignado como imagen de la categoria "${category.name}".`);
    updated += 1;
  }

  console.log('');
  console.log(`Categorias actualizadas: ${updated} de ${files.length}.`);
  console.log(
    dryRun
      ? 'Dry run terminado. No se escribio nada en la base ni en R2.'
      : 'Listo. El home lee category.image en cada request (sin cache propio, sujeto al ISR de ' +
          '60s de Next.js) -- no hace falta ningun paso extra para que el slider "Compra por ' +
          'liga" muestre los logos.',
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
