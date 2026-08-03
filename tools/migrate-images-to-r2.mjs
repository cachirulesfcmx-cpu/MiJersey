#!/usr/bin/env node
/**
 * Sube todos los MediaAsset guardados en disco local (apps/api/uploads/) a Cloudflare R2, y
 * actualiza `url`/`thumbnailUrl` en la base para que apunten a R2 en vez de al disco efimero
 * del contenedor de Railway (causa raiz confirmada de "las imagenes no cargan en produccion").
 *
 * No borra los archivos locales ni cambia `storageKey` -- sube cada archivo bajo la MISMA key
 * que ya tiene, asi que es re-corrible sin duplicar objetos en el bucket.
 *
 * Requisitos en apps/api/.env antes de correr esto:
 *   - R2_BUCKET / R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY (ya deberian estar)
 *   - R2_PUBLIC_URL (dominio pub-xxxx.r2.dev de "Allow Public Access", o tu dominio propio)
 *   - Corre esto ANTES o DESPUES de poner STORAGE_DRIVER=r2 -- da igual, este script no lee
 *     STORAGE_DRIVER, solo necesita las variables R2_* para hablarle a R2 directamente.
 *
 * Uso:
 *   node tools/migrate-images-to-r2.mjs --dry-run
 *   node tools/migrate-images-to-r2.mjs
 *   node tools/migrate-images-to-r2.mjs --concurrency 8
 */
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const apiDir = path.resolve(repoRoot, 'apps/api');
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);
const concurrency = Number(args.concurrency ?? 4);

const requireFromApi = createRequire(path.resolve(apiDir, 'package.json'));

const env = loadEnvFile(path.join(apiDir, '.env'));
const R2_BUCKET = env.R2_BUCKET;
const R2_ENDPOINT = env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = (env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
const UPLOADS_DIR = path.resolve(apiDir, env.MEDIA_UPLOADS_DIR || 'uploads');
const PUBLIC_API_URL = (env.PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const UPLOADS_URL_PREFIX = `${PUBLIC_API_URL}/uploads/`;

if (!R2_BUCKET || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  fail(
    'Faltan variables R2_* en apps/api/.env (R2_BUCKET / R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY).',
  );
}
if (!R2_PUBLIC_URL) {
  fail(
    'Falta R2_PUBLIC_URL en apps/api/.env -- activa "Allow Public Access" en el bucket desde el ' +
      'dashboard de Cloudflare (Settings del bucket) o conecta un dominio propio, y pon esa URL ' +
      'ahi antes de correr esta migracion. Sin esto las imagenes se subirian pero nada las serviria.',
  );
}

const CONTENT_TYPE_BY_EXTENSION = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

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
  const assets = await prisma.mediaAsset.findMany({
    select: { id: true, storageKey: true, url: true, thumbnailUrl: true },
  });
  console.log(`MediaAsset en la base: ${assets.length}`);
  console.log(`Carpeta local: ${UPLOADS_DIR}`);
  console.log(`Destino: bucket "${R2_BUCKET}" -> ${R2_PUBLIC_URL}`);
  console.log('');

  const counters = { uploaded: 0, skipped: 0, missing: 0, failed: 0 };

  await mapWithConcurrency(assets, concurrency, (asset) => migrateAsset(asset, counters));

  console.log('');
  console.log(
    `Subidos: ${counters.uploaded} | Ya migrados: ${counters.skipped} | Faltantes en disco: ${counters.missing} | Fallidos: ${counters.failed}`,
  );
  console.log(dryRun ? 'Dry run -- no se subio ni actualizo nada.' : 'Listo.');
} finally {
  await prisma.$disconnect();
}

async function migrateAsset(asset, counters) {
  try {
    if (R2_PUBLIC_URL && asset.url.startsWith(R2_PUBLIC_URL)) {
      counters.skipped += 1;
      return;
    }

    const localPath = path.join(UPLOADS_DIR, asset.storageKey);
    const buffer = await readFile(localPath).catch(() => null);
    if (!buffer) {
      counters.missing += 1;
      console.warn(`  [FALTA] ${asset.storageKey} no existe en "${UPLOADS_DIR}" -- se deja como esta.`);
      return;
    }

    if (!dryRun) {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: asset.storageKey,
          Body: buffer,
          ContentType: CONTENT_TYPE_BY_EXTENSION[path.extname(asset.storageKey)] ?? 'application/octet-stream',
        }),
      );
    }
    const newUrl = `${R2_PUBLIC_URL}/${asset.storageKey}`;

    let newThumbnailUrl = asset.thumbnailUrl;
    if (asset.thumbnailUrl && asset.thumbnailUrl.startsWith(UPLOADS_URL_PREFIX)) {
      const thumbKey = asset.thumbnailUrl.slice(UPLOADS_URL_PREFIX.length);
      const thumbBuffer = await readFile(path.join(UPLOADS_DIR, thumbKey)).catch(() => null);
      if (thumbBuffer) {
        if (!dryRun) {
          await s3.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: thumbKey,
              Body: thumbBuffer,
              ContentType: 'image/webp',
            }),
          );
        }
        newThumbnailUrl = `${R2_PUBLIC_URL}/${thumbKey}`;
      } else {
        console.warn(`  [FALTA THUMB] ${thumbKey} no existe en disco -- se deja el thumbnailUrl anterior.`);
      }
    }

    if (!dryRun) {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { url: newUrl, thumbnailUrl: newThumbnailUrl },
      });
    }
    counters.uploaded += 1;
  } catch (err) {
    counters.failed += 1;
    console.error(`  [ERROR] ${asset.storageKey}: ${err instanceof Error ? err.message : err}`);
  }
}

async function mapWithConcurrency(items, limit, worker) {
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
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
