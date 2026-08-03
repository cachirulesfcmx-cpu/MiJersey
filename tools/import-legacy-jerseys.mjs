#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_BRAND = 'Bart Jerseys';
const DEFAULT_WAREHOUSE_CODE = 'LEGACY';
const DEFAULT_WAREHOUSE_NAME = 'Legacy Jerseys';
const MEDIA_PREFIX = 'legacy-jerseys/products';

const args = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const sqlPath = path.resolve(repoRoot, args.sql ?? 'legacy/jerseys_catalog.sql');
const assetsRoot = path.resolve(repoRoot, args.assets ?? 'legacy/public/assets');
const uploadsDir = path.resolve(repoRoot, 'apps/api/uploads');
const dryRun = Boolean(args['dry-run']);

if (!existsSync(sqlPath)) {
  fail(`No existe el SQL: ${sqlPath}`);
}

if (!existsSync(assetsRoot)) {
  fail(`No existe la carpeta de assets: ${assetsRoot}`);
}

const sql = await readFile(sqlPath, 'utf8');
const tables = parseMysqlInserts(sql);

const categories = tables.categories ?? [];
const products = tables.products ?? [];
const images = tables.product_images ?? [];
const variants = tables.product_variants ?? [];

console.log(`Legacy SQL: ${sqlPath}`);
console.log(`Categorias: ${categories.length}`);
console.log(`Productos: ${products.length}`);
console.log(`Imagenes: ${images.length}`);
console.log(`Variantes: ${variants.length}`);

const variantsByProduct = groupBy(variants, 'product_id');
const imagesByProduct = groupBy(images, 'product_id');

if (dryRun) {
  const missingImages = await countMissingImages(images);
  console.log(`Imagenes faltantes en disco: ${missingImages}`);
  console.log('Dry run terminado. No se escribio en PostgreSQL.');
  process.exit(0);
}

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

try {
  const category = await upsertCategory(prisma, categories[0]);
  const brand = await upsertBrand(prisma, DEFAULT_BRAND);
  const warehouse = await upsertWarehouse(prisma);

  let productCount = 0;
  let imageCount = 0;
  let variantCount = 0;

  for (const legacyProduct of products) {
    const product = await upsertProduct(prisma, legacyProduct, category.id, brand.id);
    await upsertProductSeo(prisma, product.id, legacyProduct);

    const productImages = imagesByProduct.get(legacyProduct.id) ?? [];
    for (const legacyImage of productImages) {
      const mediaAsset = await upsertMediaAsset(prisma, legacyImage, product.id);
      await prisma.productMedia.upsert({
        where: { productId_mediaId: { productId: product.id, mediaId: mediaAsset.id } },
        create: {
          productId: product.id,
          mediaId: mediaAsset.id,
          sortOrder: numberOrZero(legacyImage.sort_order),
        },
        update: { sortOrder: numberOrZero(legacyImage.sort_order) },
      });
      imageCount += 1;
    }

    const productVariants = variantsByProduct.get(legacyProduct.id) ?? [];
    const optionValueCache = await ensureOptions(prisma, product.id, productVariants);

    for (const legacyVariant of productVariants) {
      const optionValueIds = getVariantOptionValueIds(optionValueCache, legacyVariant);
      const combinationKey = optionValueIds.slice().sort().join(':') || `legacy:${legacyVariant.id}`;
      const variant = await prisma.productVariant.upsert({
        where: { sku: legacyVariant.sku },
        create: {
          productId: product.id,
          sku: legacyVariant.sku,
          slug: `${product.slug}-${legacyVariant.id}`,
          title: buildVariantTitle(legacyVariant),
          price: decimalAdd(legacyProduct.price, legacyVariant.price_modifier),
          compareAtPrice: nullableDecimal(legacyProduct.compare_at_price),
          status: legacyVariant.active === '1' ? 'ACTIVE' : 'ARCHIVED',
          combinationKey,
          createdAt: dateOrNow(legacyVariant.created_at),
          updatedAt: dateOrNow(legacyVariant.updated_at),
        },
        update: {
          title: buildVariantTitle(legacyVariant),
          price: decimalAdd(legacyProduct.price, legacyVariant.price_modifier),
          compareAtPrice: nullableDecimal(legacyProduct.compare_at_price),
          status: legacyVariant.active === '1' ? 'ACTIVE' : 'ARCHIVED',
          combinationKey,
          updatedAt: dateOrNow(legacyVariant.updated_at),
        },
      });

      for (const optionValueId of optionValueIds) {
        await prisma.productVariantOptionValue.upsert({
          where: { variantId_optionValueId: { variantId: variant.id, optionValueId } },
          create: { variantId: variant.id, optionValueId },
          update: {},
        });
      }

      await prisma.inventoryItem.upsert({
        where: { variantId_warehouseId: { variantId: variant.id, warehouseId: warehouse.id } },
        create: {
          variantId: variant.id,
          warehouseId: warehouse.id,
          availableQuantity: numberOrZero(legacyVariant.stock),
        },
        update: {
          availableQuantity: numberOrZero(legacyVariant.stock),
        },
      });

      variantCount += 1;
    }

    productCount += 1;
    if (productCount % 50 === 0) {
      console.log(`Importados ${productCount}/${products.length} productos...`);
    }
  }

  console.log('Importacion terminada.');
  console.log(`Productos procesados: ${productCount}`);
  console.log(`Imagenes procesadas: ${imageCount}`);
  console.log(`Variantes procesadas: ${variantCount}`);
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

function parseMysqlInserts(input) {
  const tables = {};
  const insertRegex = /INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*([\s\S]*?);/g;
  let match;
  while ((match = insertRegex.exec(input)) !== null) {
    const [, table, columnsRaw, valuesRaw] = match;
    const columns = [...columnsRaw.matchAll(/`([^`]+)`/g)].map((columnMatch) => columnMatch[1]);
    const rows = parseTuples(valuesRaw).map((values) => Object.fromEntries(columns.map((column, i) => [column, values[i] ?? null])));
    tables[table] ??= [];
    tables[table].push(...rows);
  }
  return tables;
}

function parseTuples(valuesRaw) {
  const rows = [];
  let row = null;
  let value = '';
  let inString = false;
  let escaped = false;

  for (const char of valuesRaw) {
    if (row === null) {
      if (char === '(') {
        row = [];
        value = '';
      }
      continue;
    }

    if (escaped) {
      value += unescapeMysqlChar(char);
      escaped = false;
      continue;
    }

    if (inString && char === '\\') {
      escaped = true;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      continue;
    }

    if (!inString && char === ',') {
      row.push(cleanSqlValue(value));
      value = '';
      continue;
    }

    if (!inString && char === ')') {
      row.push(cleanSqlValue(value));
      rows.push(row);
      row = null;
      value = '';
      continue;
    }

    value += char;
  }

  return rows;
}

function unescapeMysqlChar(char) {
  switch (char) {
    case '0':
      return '\0';
    case 'b':
      return '\b';
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    case 'Z':
      return '\u001a';
    default:
      return char;
  }
}

function cleanSqlValue(value) {
  const trimmed = value.trim();
  if (trimmed.toUpperCase() === 'NULL') return null;
  return trimmed;
}

async function upsertCategory(prisma, legacyCategory) {
  return prisma.category.upsert({
    where: { slug: legacyCategory?.slug ?? 'jerseys' },
    create: {
      name: legacyCategory?.name ?? 'Jerseys',
      slug: legacyCategory?.slug ?? 'jerseys',
      description: legacyCategory?.description,
      status: legacyCategory?.active === '0' ? 'HIDDEN' : 'ACTIVE',
      sortOrder: numberOrZero(legacyCategory?.sort_order),
      createdAt: dateOrNow(legacyCategory?.created_at),
      updatedAt: dateOrNow(legacyCategory?.updated_at),
    },
    update: {
      name: legacyCategory?.name ?? 'Jerseys',
      description: legacyCategory?.description,
      status: legacyCategory?.active === '0' ? 'HIDDEN' : 'ACTIVE',
      sortOrder: numberOrZero(legacyCategory?.sort_order),
      updatedAt: dateOrNow(legacyCategory?.updated_at),
    },
  });
}

async function upsertBrand(prisma, name) {
  return prisma.brand.upsert({
    where: { name },
    create: { name, slug: slugify(name), status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  });
}

async function upsertWarehouse(prisma) {
  return prisma.warehouse.upsert({
    where: { code: DEFAULT_WAREHOUSE_CODE },
    create: { code: DEFAULT_WAREHOUSE_CODE, name: DEFAULT_WAREHOUSE_NAME, status: 'ACTIVE' },
    update: { name: DEFAULT_WAREHOUSE_NAME, status: 'ACTIVE' },
  });
}

async function upsertProduct(prisma, legacyProduct, categoryId, brandId) {
  const product = await prisma.product.upsert({
    where: { sku: legacyProduct.sku },
    create: {
      sku: legacyProduct.sku,
      slug: legacyProduct.slug,
      name: legacyProduct.name,
      description: legacyProduct.description,
      status: legacyProduct.active === '1' ? 'ACTIVE' : 'DRAFT',
      visibility: legacyProduct.active === '1' ? 'PUBLIC' : 'HIDDEN',
      type: 'PHYSICAL',
      brandId,
      createdAt: dateOrNow(legacyProduct.created_at),
      updatedAt: dateOrNow(legacyProduct.updated_at),
    },
    update: {
      slug: legacyProduct.slug,
      name: legacyProduct.name,
      description: legacyProduct.description,
      status: legacyProduct.active === '1' ? 'ACTIVE' : 'DRAFT',
      visibility: legacyProduct.active === '1' ? 'PUBLIC' : 'HIDDEN',
      brandId,
      updatedAt: dateOrNow(legacyProduct.updated_at),
    },
  });

  await prisma.productCategory.upsert({
    where: { productId_categoryId: { productId: product.id, categoryId } },
    create: { productId: product.id, categoryId },
    update: {},
  });

  return product;
}

async function upsertProductSeo(prisma, productId, legacyProduct) {
  await prisma.seoMetadata.upsert({
    where: { entityType_entityId: { entityType: 'PRODUCT', entityId: productId } },
    create: {
      entityType: 'PRODUCT',
      entityId: productId,
      metaTitle: legacyProduct.meta_title,
      metaDescription: legacyProduct.meta_description,
    },
    update: {
      metaTitle: legacyProduct.meta_title,
      metaDescription: legacyProduct.meta_description,
    },
  });
}

async function upsertMediaAsset(prisma, legacyImage, productId) {
  const relativePath = legacyImage.path.replace(/^\/+/, '').replaceAll('\\', '/');
  const source = path.resolve(assetsRoot, relativePath.replace(/^assets\//, ''));
  if (!existsSync(source)) {
    console.warn(`Imagen no encontrada: ${source}`);
    return prisma.mediaAsset.upsert({
      where: { contentHash: `missing:${legacyImage.id}` },
      create: {
        filename: `missing-${legacyImage.id}.webp`,
        originalName: path.basename(relativePath),
        mimeType: 'image/webp',
        type: 'IMAGE',
        size: 0,
        altText: legacyImage.alt,
        title: legacyImage.alt,
        contentHash: `missing:${legacyImage.id}`,
        storageKey: `${MEDIA_PREFIX}/missing-${legacyImage.id}.webp`,
        url: `/uploads/${MEDIA_PREFIX}/missing-${legacyImage.id}.webp`,
      },
      update: {},
    });
  }

  const buffer = await readFile(source);
  const contentHash = createHash('sha256').update(buffer).digest('hex');
  const filename = path.basename(source);
  const storageKey = `${MEDIA_PREFIX}/${filename}`;
  const destination = path.resolve(uploadsDir, storageKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
  const fileStat = await stat(destination);

  const mediaAsset = await prisma.mediaAsset.upsert({
    where: { contentHash },
    create: {
      filename,
      originalName: filename,
      mimeType: 'image/webp',
      type: 'IMAGE',
      size: fileStat.size,
      altText: legacyImage.alt,
      title: legacyImage.alt,
      contentHash,
      storageKey,
      url: `/uploads/${storageKey}`,
    },
    update: {
      altText: legacyImage.alt,
      title: legacyImage.alt,
      storageKey,
      url: `/uploads/${storageKey}`,
    },
  });

  await prisma.mediaAssetUsage.upsert({
    where: {
      mediaAssetId_referenceType_referenceId: {
        mediaAssetId: mediaAsset.id,
        referenceType: 'PRODUCT',
        referenceId: productId,
      },
    },
    create: {
      mediaAssetId: mediaAsset.id,
      referenceType: 'PRODUCT',
      referenceId: productId,
    },
    update: {},
  });

  return mediaAsset;
}

async function ensureOptions(prisma, productId, legacyVariants) {
  const optionDefinitions = [
    ['Talla', 'size'],
    ['Dorsal', 'color'],
    ['Version', 'presentation'],
  ];
  const cache = new Map();

  for (const [optionName, legacyField] of optionDefinitions) {
    const values = unique(legacyVariants.map((variant) => variant[legacyField]).filter(Boolean));
    if (values.length === 0) continue;

    const option = await prisma.productOption.upsert({
      where: { productId_name: { productId, name: optionName } },
      create: { productId, name: optionName, position: optionDefinitions.findIndex(([name]) => name === optionName) },
      update: { position: optionDefinitions.findIndex(([name]) => name === optionName) },
    });

    for (const [position, value] of values.entries()) {
      const optionValue = await prisma.productOptionValue.upsert({
        where: { optionId_value: { optionId: option.id, value } },
        create: { optionId: option.id, value, position },
        update: { position },
      });
      cache.set(`${legacyField}:${value}`, optionValue.id);
    }
  }

  return cache;
}

function getVariantOptionValueIds(cache, legacyVariant) {
  return [
    cache.get(`size:${legacyVariant.size}`),
    cache.get(`color:${legacyVariant.color}`),
    cache.get(`presentation:${legacyVariant.presentation}`),
  ].filter(Boolean);
}

function buildVariantTitle(legacyVariant) {
  return [legacyVariant.presentation, legacyVariant.size, legacyVariant.color].filter(Boolean).join(' / ') || legacyVariant.sku;
}

async function countMissingImages(legacyImages) {
  let missing = 0;
  for (const image of legacyImages) {
    const relativePath = image.path.replace(/^\/+/, '').replaceAll('\\', '/');
    const source = path.resolve(assetsRoot, relativePath.replace(/^assets\//, ''));
    if (!existsSync(source)) missing += 1;
  }
  return missing;
}

function groupBy(items, key) {
  const grouped = new Map();
  for (const item of items) {
    const value = item[key];
    if (!grouped.has(value)) grouped.set(value, []);
    grouped.get(value).push(item);
  }
  return grouped;
}

function unique(values) {
  return [...new Set(values)];
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function nullableDecimal(value) {
  return value === null || value === undefined || value === '' ? null : value;
}

function decimalAdd(base, modifier) {
  const total = Number(base ?? 0) + Number(modifier ?? 0);
  return total.toFixed(2);
}

function dateOrNow(value) {
  if (!value) return new Date();
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
