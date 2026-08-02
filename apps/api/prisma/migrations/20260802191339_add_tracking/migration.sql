-- CreateEnum
CREATE TYPE "TrackingProviderType" AS ENUM ('GOOGLE_ANALYTICS_4', 'GOOGLE_TAG_MANAGER', 'META_PIXEL', 'TIKTOK_PIXEL', 'CONVERSION_API');

-- CreateEnum
CREATE TYPE "TrackingProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "tracking_providers" (
    "id" TEXT NOT NULL,
    "provider" "TrackingProviderType" NOT NULL,
    "status" "TrackingProviderStatus" NOT NULL DEFAULT 'INACTIVE',
    "configuration" JSONB NOT NULL,
    "consentCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "consentRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracking_providers_provider_key" ON "tracking_providers"("provider");

-- CreateIndex
CREATE INDEX "tracking_events_eventName_createdAt_idx" ON "tracking_events"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "tracking_events_source_idx" ON "tracking_events"("source");
