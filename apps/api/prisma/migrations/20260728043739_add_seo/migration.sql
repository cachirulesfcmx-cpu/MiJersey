-- CreateEnum
CREATE TYPE "seo_entity_type" AS ENUM ('PRODUCT', 'CATEGORY', 'COLLECTION', 'BRAND');

-- CreateEnum
CREATE TYPE "seo_robots_directive" AS ENUM ('INDEX_FOLLOW', 'NOINDEX_FOLLOW', 'INDEX_NOFOLLOW', 'NOINDEX_NOFOLLOW');

-- CreateEnum
CREATE TYPE "seo_twitter_card_type" AS ENUM ('SUMMARY', 'SUMMARY_LARGE_IMAGE');

-- CreateTable
CREATE TABLE "seo_metadata" (
    "id" TEXT NOT NULL,
    "entityType" "seo_entity_type" NOT NULL,
    "entityId" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "canonicalUrl" TEXT,
    "robots" "seo_robots_directive" NOT NULL DEFAULT 'INDEX_FOLLOW',
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageMediaId" TEXT,
    "twitterCard" "seo_twitter_card_type" NOT NULL DEFAULT 'SUMMARY_LARGE_IMAGE',
    "structuredData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirects" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seo_metadata_entityType_entityId_key" ON "seo_metadata"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "redirects_fromPath_key" ON "redirects"("fromPath");
