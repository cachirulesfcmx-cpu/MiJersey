-- CreateEnum
CREATE TYPE "search_result_type" AS ENUM ('PRODUCT', 'CATEGORY', 'BRAND', 'COLLECTION');

-- CreateTable
CREATE TABLE "search_query_logs" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "normalizedTerm" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL,
    "sessionId" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_click_logs" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "entityType" "search_result_type" NOT NULL,
    "entityId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_click_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_synonyms" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "synonyms" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_query_logs_normalizedTerm_idx" ON "search_query_logs"("normalizedTerm");

-- CreateIndex
CREATE INDEX "search_query_logs_createdAt_idx" ON "search_query_logs"("createdAt");

-- CreateIndex
CREATE INDEX "search_query_logs_resultsCount_idx" ON "search_query_logs"("resultsCount");

-- CreateIndex
CREATE INDEX "search_click_logs_term_idx" ON "search_click_logs"("term");

-- CreateIndex
CREATE UNIQUE INDEX "search_synonyms_term_key" ON "search_synonyms"("term");

-- Tolerancia a errores tipográficos (016 §3): pg_trgm habilita similarity() y búsquedas por trigramas.
-- No modelable en schema.prisma (no hay soporte nativo para extensiones/índices GIN), por eso se agrega a mano en esta migración.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "categories_name_trgm_idx" ON "categories" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "brands_name_trgm_idx" ON "brands" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "collections_name_trgm_idx" ON "collections" USING GIN ("name" gin_trgm_ops);
