-- CreateEnum
CREATE TYPE "media_asset_status" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "asset_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" "media_type" NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DOUBLE PRECISION,
    "altText" TEXT,
    "title" TEXT,
    "status" "media_asset_status" NOT NULL DEFAULT 'ACTIVE',
    "contentHash" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset_tags" (
    "mediaAssetId" TEXT NOT NULL,
    "assetTagId" TEXT NOT NULL,

    CONSTRAINT "media_asset_tags_pkey" PRIMARY KEY ("mediaAssetId","assetTagId")
);

-- CreateTable
CREATE TABLE "media_asset_usages" (
    "id" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folders_slug_key" ON "folders"("slug");

-- CreateIndex
CREATE INDEX "folders_parentId_idx" ON "folders"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_tags_name_key" ON "asset_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_tags_slug_key" ON "asset_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_filename_key" ON "media_assets"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_contentHash_key" ON "media_assets"("contentHash");

-- CreateIndex
CREATE INDEX "media_assets_folderId_idx" ON "media_assets"("folderId");

-- CreateIndex
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");

-- CreateIndex
CREATE INDEX "media_assets_type_idx" ON "media_assets"("type");

-- CreateIndex
CREATE INDEX "media_asset_tags_assetTagId_idx" ON "media_asset_tags"("assetTagId");

-- CreateIndex
CREATE INDEX "media_asset_usages_mediaAssetId_idx" ON "media_asset_usages"("mediaAssetId");

-- CreateIndex
CREATE INDEX "media_asset_usages_referenceType_referenceId_idx" ON "media_asset_usages"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_usages_mediaAssetId_referenceType_referenceId_key" ON "media_asset_usages"("mediaAssetId", "referenceType", "referenceId");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset_tags" ADD CONSTRAINT "media_asset_tags_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset_tags" ADD CONSTRAINT "media_asset_tags_assetTagId_fkey" FOREIGN KEY ("assetTagId") REFERENCES "asset_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset_usages" ADD CONSTRAINT "media_asset_usages_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
