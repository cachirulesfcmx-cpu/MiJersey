#!/usr/bin/env node
/**
 * Sube los videos del hero (tools/hero-video-assets/*.mp4 -- ya transcodificados a mp4 sin
 * audio, 960x960, listos para loop) a Cloudflare R2, crea su MediaAsset (type VIDEO), y los
 * asigna como `videoMediaId` a las secciones HERO_BANNER publicadas existentes, en orden
 * (sortOrder), sin tocar imageMediaId/headline/etc -- el video se reproduce en loop ENCIMA de
 * la imagen (que queda de poster/fallback) en vez de reemplazarla.
 *
 * Si hay mas videos que hero-slides existentes, los sobrantes se suben a R2/MediaAsset (quedan
 * disponibles en /admin) pero no se asignan a ningun slide -- correr esto no crea slides nuevos.
 * Si hay mas slides que videos, los slides sin video se quedan como estaban (solo imagen).
 *
 * Requisitos: los mismos R2_* de apps/api/.env que usa tools/migrate-images-to-r2.mjs.
 *
 * Uso:
 *   node tools/upload-hero-videos.mjs --dry-run
 *   node tools/upload-hero-videos.mjs
 */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const apiDir = path.resolve(repoRoot, 'apps/api');
const assetsDir = path.resolve(repoRoot, 'tools/hero-video-assets');
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
  fail(
    'Faltan variables R2_* en apps/api/.env (R2_BUCKET / R2_ENDPOINT / R2_ACCESS_KEY_ID / ' +
      'R2_SECRET_ACCESS_KEY / R2_PUBLIC_URL) -- son las mismas que usa migrate-images-to-r2.mjs.',
  );
}

// 960x960, transcodificados sin audio con ffmpeg -- ver tools/hero-video-assets/. Duracion real
// medida con ffprobe al momento de generarlos.
const KNOWN_DIMENSIONS = { width: 960, height: 960, duration: 5 };

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
    .filter((f) => f.toLowerCase().endsWith('.mp4'))
    .sort();

  if (files.length === 0) {
    fail(`No hay archivos .mp4 en ${assetsDir}.`);
  }
  console.log(`Videos locales encontrados: ${files.length} (${files.join(', ')})`);

  const heroSections = await prisma.homeSection.findMany({
    where: { type: 'HERO_BANNER', status: 'PUBLISHED', isVisible: true },
    orderBy: { sortOrder: 'asc' },
  });
  console.log(`Hero slides publicados existentes: ${heroSections.length}`);
  if (heroSections.length === 0) {
    console.log(
      '  (Ninguno -- los videos se subiran a R2/MediaAsset pero no se asignaran a ningun slide. ' +
        'Crea/publica un HERO_BANNER en /admin primero si quieres que el video se use.)',
    );
  }

  let assigned = 0;
  for (const [index, file] of files.entries()) {
    const localPath = path.join(assetsDir, file);
    const buffer = await readFile(localPath);
    const contentHash = createHash('sha256').update(buffer).digest('hex');

    let asset = await prisma.mediaAsset.findUnique({ where: { contentHash } });
    if (asset) {
      console.log(`[MEDIA] "${file}" ya existe como MediaAsset ${asset.id} (mismo contenido) -- se reusa.`);
    } else {
      const storageKey = `${randomUUID()}.mp4`;
      console.log(`[MEDIA] "${file}" -> subiendo a R2 como ${storageKey} (${(buffer.length / 1024).toFixed(0)} KB)`);
      if (!dryRun) {
        await s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: storageKey,
            Body: buffer,
            ContentType: 'video/mp4',
          }),
        );
        asset = await prisma.mediaAsset.create({
          data: {
            filename: storageKey,
            originalName: file,
            mimeType: 'video/mp4',
            type: 'VIDEO',
            size: buffer.length,
            width: KNOWN_DIMENSIONS.width,
            height: KNOWN_DIMENSIONS.height,
            duration: KNOWN_DIMENSIONS.duration,
            status: 'ACTIVE',
            contentHash,
            storageKey,
            url: `${R2_PUBLIC_URL}/${storageKey}`,
          },
        });
      }
    }

    const targetSection = heroSections[index];
    if (!targetSection) {
      console.log(`  -> no hay hero slide #${index + 1} para asignarlo; queda solo en MediaAsset.`);
      continue;
    }
    if (!asset) {
      console.log('  -> dry-run: se asignaria a', targetSection.title ?? targetSection.id);
      assigned += 1;
      continue;
    }
    console.log(`  -> asignado como videoMediaId de hero slide "${targetSection.title ?? targetSection.id}"`);
    if (!dryRun) {
      const configuration = { ...targetSection.configuration, videoMediaId: asset.id };
      await prisma.homeSection.update({ where: { id: targetSection.id }, data: { configuration } });
    }
    assigned += 1;
  }

  console.log('');
  console.log(`Videos asignados a hero slides: ${assigned} de ${files.length}.`);
  console.log(
    dryRun
      ? 'Dry run terminado. No se escribio nada en la base ni en R2.'
      : 'Listo. El home lee HomeSection sin cache (sujeto al ISR de 60s de Next.js).',
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
