-- CreateEnum
CREATE TYPE "theme_section_key" AS ENUM ('HEADER', 'FOOTER', 'BANNER', 'LAYOUT');

-- CreateTable
CREATE TABLE "theme_settings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "logo" TEXT,
    "favicon" TEXT,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "typography" TEXT NOT NULL,
    "borderRadius" TEXT NOT NULL,
    "spacingScale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_sections" (
    "id" TEXT NOT NULL,
    "section" "theme_section_key" NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_versions" (
    "id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "theme_sections_section_key" ON "theme_sections"("section");

-- CreateIndex
CREATE UNIQUE INDEX "theme_versions_versionNumber_key" ON "theme_versions"("versionNumber");
