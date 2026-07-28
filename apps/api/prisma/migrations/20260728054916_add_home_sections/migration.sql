-- CreateEnum
CREATE TYPE "home_section_type" AS ENUM ('HERO_BANNER', 'BANNER_GRID', 'FEATURED_PRODUCTS', 'FEATURED_CATEGORIES', 'FEATURED_COLLECTIONS', 'FEATURED_BRANDS', 'PROMOTION_BANNER', 'RICH_TEXT', 'IMAGE_TEXT', 'VIDEO_BANNER', 'NEWSLETTER');

-- CreateEnum
CREATE TYPE "home_section_status" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "home_sections" (
    "id" TEXT NOT NULL,
    "type" "home_section_type" NOT NULL,
    "title" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "home_section_status" NOT NULL DEFAULT 'DRAFT',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "home_sections_status_isVisible_sortOrder_idx" ON "home_sections"("status", "isVisible", "sortOrder");
