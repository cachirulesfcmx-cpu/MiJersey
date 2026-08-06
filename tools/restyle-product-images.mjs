#!/usr/bin/env node
/**
 * Reestiliza las fotos reales de producto: les quita el fondo blanco/gris liso que traen del
 * catalogo legacy y las recompone sobre un fondo azul (el mismo azul de marca del sitio,
 * --tf-accent-h:217 en theme-framework.css) con mas espacio alrededor del jersey (menos "zoom"),
 * para que todas las fotos se vean consistentes entre si -- igual que bartjerseys.com, donde cada
 * foto de producto usa la misma composicion de estudio (fondo liso + mucho aire alrededor).
 *
 * No inventa fotos nuevas: parte siempre de la foto real que ya existe en R2 para cada
 * producto/variante, solo le cambia el fondo y el encuadre. Las fotos originales NO se borran --
 * quedan en R2/MediaAsset por si hay que revertir. El mapeo asset-viejo -> asset-nuevo se guarda
 * en tools/.image-restyle-manifest.json.
 *
 * Requisitos: los mismos R2_* de apps/api/.env que usan los otros scripts de R2, y `sharp`
 * (ya es dependencia de apps/api).
 *
 * Uso:
 *   node tools/restyle-product-images.mjs --dry-run          # solo cuenta, no descarga ni escribe
 *   node tools/restyle-product-images.mjs --limit 10          # prueba con 10 imagenes reales
 *   node tools/restyle-product-images.mjs                     # catalogo completo
 */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const apiDir = path.resolve(repoRoot, 'apps/api');
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);
const limit = args.limit ? Number(args.limit) : Infinity;
const manifestPath = path.resolve(repoRoot, 'tools/.image-restyle-manifest.json');

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

const sharp = requireFromApi('sharp');
// CRITICAL: sharp/libvips cachea internamente operaciones repetidas (por defecto hasta 100
// operaciones/50MB/20 archivos). Al procesar ~2000 SVGs de fondo con la MISMA estructura y solo
// el color distinto, esa cache puede devolver el resultado de un color YA renderizado en vez de
// re-renderizar el nuevo -- confirmado: pruebas chicas (3-8 imagenes) siempre daban el color
// correcto, pero la corrida completa (1938 imagenes) termino con TODAS en azul. Desactivar la
// cache fuerza a renderizar cada SVG desde cero.
sharp.cache(false);
const PrismaClient = requireFromApi('@prisma/client').PrismaClient;
const prisma = new PrismaClient();

// Antes: un solo azul fijo para TODAS las fotos. bartjerseys.com varía el color de fondo real
// por foto (violeta, celeste, negro, amarillo, verde...), no usa un único tono -- confirmado
// viendo su captura completa de home lado a lado. Se elige un color determinista por asset (hash
// de su id) de esta paleta, para que cada producto quede siempre con el mismo fondo entre
// corridas (no "parpadea" de color si se vuelve a correr el script).
const BG_PALETTE = [
  { center: { r: 60, g: 131, b: 246 }, edge: { r: 8, g: 18, b: 48 } }, // azul
  { center: { r: 124, g: 58, b: 237 }, edge: { r: 20, g: 8, b: 48 } }, // violeta
  { center: { r: 236, g: 72, b: 153 }, edge: { r: 48, g: 8, b: 28 } }, // rosa/magenta
  { center: { r: 34, g: 197, b: 94 }, edge: { r: 6, g: 40, b: 20 } }, // verde
  { center: { r: 250, g: 204, b: 21 }, edge: { r: 48, g: 36, b: 4 } }, // amarillo
  { center: { r: 40, g: 40, b: 46 }, edge: { r: 4, g: 4, b: 6 } }, // negro/gris carbón
  { center: { r: 251, g: 146, b: 60 }, edge: { r: 48, g: 24, b: 4 } }, // naranja
  { center: { r: 56, g: 189, b: 248 }, edge: { r: 6, g: 30, b: 44 } }, // celeste
];

function paletteForAsset(assetId) {
  let hash = 0;
  for (let i = 0; i < assetId.length; i += 1) hash = (hash * 31 + assetId.charCodeAt(i)) >>> 0;
  return BG_PALETTE[hash % BG_PALETTE.length];
}

const CANVAS_SIZE = 1200;
const SUBJECT_FILL = 0.62; // el jersey ocupa ~62% del canvas -- deja mucho aire (mas "alejado")
const BG_MATCH_TOLERANCE = 18; // distancia de color para considerar "fondo" (fondo liso real)
const BG_FEATHER = 22; // ancho de la transicion suave del recorte

try {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', visibility: 'PUBLIC', deletedAt: null },
    select: {
      id: true,
      variants: { select: { id: true, imageId: true } },
      media: { select: { mediaId: true, sortOrder: true } },
    },
  });

  const assetIdsInUse = new Set();
  for (const p of products) {
    for (const v of p.variants) if (v.imageId) assetIdsInUse.add(v.imageId);
    for (const m of p.media) assetIdsInUse.add(m.mediaId);
  }

  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: [...assetIdsInUse] }, type: 'IMAGE' },
    select: { id: true, url: true, filename: true },
  });
  console.log(`Imagenes reales unicas en uso por el catalogo: ${assets.length}`);

  const toProcess = assets.slice(0, limit);
  console.log(`A procesar en esta corrida: ${toProcess.length}${limit !== Infinity ? ` (--limit ${limit})` : ''}`);

  if (dryRun) {
    console.log('\nDry run terminado. No se descargo ni escribio nada.');
    process.exit(0);
  }

  const mapping = {}; // oldAssetId -> newAssetId
  let ok = 0;
  let failed = 0;
  const startedAt = Date.now();

  for (const [index, asset] of toProcess.entries()) {
    try {
      const res = await fetch(asset.url);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const originalBuffer = Buffer.from(await res.arrayBuffer());

      const backdropBuffer = Buffer.from(buildBackdropSvg(paletteForAsset(asset.id)));
      const processedBuffer = await restyleImage(originalBuffer, backdropBuffer);
      const contentHash = createHash('sha256').update(processedBuffer).digest('hex');

      let newAsset = await prisma.mediaAsset.findUnique({ where: { contentHash } });
      if (!newAsset) {
        const storageKey = `${randomUUID()}.webp`;
        await s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: storageKey,
            Body: processedBuffer,
            ContentType: 'image/webp',
          }),
        );
        newAsset = await prisma.mediaAsset.create({
          data: {
            filename: storageKey,
            originalName: `restyled-${asset.filename}`,
            mimeType: 'image/webp',
            type: 'IMAGE',
            size: processedBuffer.length,
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            status: 'ACTIVE',
            contentHash,
            storageKey,
            url: `${R2_PUBLIC_URL}/${storageKey}`,
          },
        });
      }

      mapping[asset.id] = newAsset.id;
      ok += 1;
    } catch (error) {
      failed += 1;
      console.log(`  [ERROR] asset ${asset.id} (${asset.filename}): ${error.message}`);
    }

    if ((index + 1) % 25 === 0 || index + 1 === toProcess.length) {
      const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`  ...${index + 1}/${toProcess.length} (ok: ${ok}, error: ${failed}, ${elapsedS}s)`);
    }
  }

  writeFileSync(manifestPath, JSON.stringify(mapping, null, 2));
  console.log(`\nManifiesto guardado en ${manifestPath} (${Object.keys(mapping).length} entradas).`);

  console.log('\nActualizando referencias (variantes y galeria) a las imagenes nuevas...');
  let variantsUpdated = 0;
  let mediaUpdated = 0;
  for (const p of products) {
    for (const v of p.variants) {
      if (v.imageId && mapping[v.imageId]) {
        await prisma.productVariant.update({ where: { id: v.id }, data: { imageId: mapping[v.imageId] } });
        variantsUpdated += 1;
      }
    }
    for (const m of p.media) {
      if (mapping[m.mediaId]) {
        await prisma.productMedia.delete({
          where: { productId_mediaId: { productId: p.id, mediaId: m.mediaId } },
        });
        await prisma.productMedia.create({
          data: { productId: p.id, mediaId: mapping[m.mediaId], sortOrder: m.sortOrder },
        });
        mediaUpdated += 1;
      }
    }
  }

  console.log(`Variantes actualizadas: ${variantsUpdated}`);
  console.log(`Entradas de galeria actualizadas: ${mediaUpdated}`);
  console.log(`\nListo. ${ok} imagenes reestilizadas, ${failed} con error (ver log arriba).`);
  console.log(
    'Las imagenes originales siguen en R2/MediaAsset sin tocar -- si algo se ve mal, se puede',
  );
  console.log('revertir producto por producto usando el manifiesto (id nuevo -> buscar id viejo).');
} finally {
  await prisma.$disconnect();
}

/**
 * Quita el fondo liso real de la foto (chroma-key por distancia de color a las esquinas),
 * recorta al bounding box del jersey, lo reduce para dejar aire alrededor, y lo compone sobre
 * el fondo azul de marca.
 */
async function restyleImage(originalBuffer, backdropBuffer) {
  const image = sharp(originalBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const bg = sampleCornerColor(data, width, height, channels);

  // Alfa por distancia de color al fondo muestreado -- transicion suave entre BG_MATCH_TOLERANCE
  // y BG_MATCH_TOLERANCE + BG_FEATHER para evitar bordes duros/dentados.
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * channels;
      const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], bg);
      let alpha;
      if (dist <= BG_MATCH_TOLERANCE) alpha = 0;
      else if (dist >= BG_MATCH_TOLERANCE + BG_FEATHER) alpha = 255;
      else alpha = Math.round(((dist - BG_MATCH_TOLERANCE) / BG_FEATHER) * 255);

      // Descontaminacion de color: los pixeles semi-transparentes del borde (alpha entre 0 y 255)
      // todavia traen mezclado el color del fondo original (blanco/gris), lo que se veia como un
      // halo palido alrededor del jersey al componer sobre el azul. Se "empuja" su color lejos del
      // fondo muestreado en proporcion inversa al alpha para recuperar el color real de la tela.
      if (alpha > 0 && alpha < 255) {
        const a = alpha / 255;
        data[idx] = clampByte(bg.r + (data[idx] - bg.r) / a);
        data[idx + 1] = clampByte(bg.g + (data[idx + 1] - bg.g) / a);
        data[idx + 2] = clampByte(bg.b + (data[idx + 2] - bg.b) / a);
      }

      data[idx + 3] = alpha;
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    // No se detecto sujeto (foto ya sin fondo uniforme) -- usar el encuadre completo.
    minX = 0;
    minY = 0;
    maxX = width - 1;
    maxY = height - 1;
  }

  const cutout = sharp(data, { raw: { width, height, channels } }).extract({
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  });

  const subjectW = maxX - minX + 1;
  const subjectH = maxY - minY + 1;
  const targetLongSide = Math.round(CANVAS_SIZE * SUBJECT_FILL);
  const scale = targetLongSide / Math.max(subjectW, subjectH);
  const resizedW = Math.round(subjectW * scale);
  const resizedH = Math.round(subjectH * scale);

  const resizedSubject = await cutout
    .resize(resizedW, resizedH, { fit: 'fill' })
    .png()
    .toBuffer();

  const backdrop = sharp(backdropBuffer).resize(CANVAS_SIZE, CANVAS_SIZE);

  return backdrop
    .composite([
      {
        input: resizedSubject,
        left: Math.round((CANVAS_SIZE - resizedW) / 2),
        top: Math.round((CANVAS_SIZE - resizedH) / 2),
      },
    ])
    .webp({ quality: 88 })
    .toBuffer();
}

function sampleCornerColor(data, width, height, channels) {
  const patch = 6;
  const points = [];
  for (let y = 0; y < patch; y += 1) {
    for (let x = 0; x < patch; x += 1) {
      points.push([x, y]);
      points.push([width - 1 - x, y]);
      points.push([x, height - 1 - y]);
      points.push([width - 1 - x, height - 1 - y]);
    }
  }
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of points) {
    const idx = (y * width + x) * channels;
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
  }
  const n = points.length;
  return { r: r / n, g: g / n, b: b / n };
}

function colorDistance(r, g, b, bg) {
  return Math.sqrt((r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2);
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function buildBackdropSvg(palette) {
  const { center, edge } = palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">
    <defs>
      <radialGradient id="g" cx="50%" cy="42%" r="65%">
        <stop offset="0%" stop-color="rgb(${center.r},${center.g},${center.b})" />
        <stop offset="100%" stop-color="rgb(${edge.r},${edge.g},${edge.b})" />
      </radialGradient>
    </defs>
    <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#g)" />
  </svg>`;
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
