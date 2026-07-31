-- CreateEnum
CREATE TYPE "ticket_category" AS ENUM ('GENERAL', 'ORDER_ISSUE', 'RETURN_REFUND', 'SHIPPING', 'PRODUCT', 'BILLING');

-- CreateEnum
CREATE TYPE "ticket_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ticket_message_author_type" AS ENUM ('CUSTOMER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "rma_status" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "subject" TEXT NOT NULL,
    "category" "ticket_category" NOT NULL DEFAULT 'GENERAL',
    "priority" "ticket_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ticket_status" NOT NULL DEFAULT 'OPEN',
    "assignedAgentId" TEXT,
    "firstResponseDueAt" TIMESTAMP(3) NOT NULL,
    "resolutionDueAt" TIMESTAMP(3) NOT NULL,
    "firstRespondedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorType" "ticket_message_author_type" NOT NULL,
    "authorId" TEXT,
    "message" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rma_requests" (
    "id" TEXT NOT NULL,
    "rmaNumber" TEXT NOT NULL,
    "ticketId" TEXT,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "itemsDescription" TEXT NOT NULL,
    "status" "rma_status" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rma_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticketNumber_key" ON "tickets"("ticketNumber");

-- CreateIndex
CREATE INDEX "tickets_customerId_idx" ON "tickets"("customerId");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_assignedAgentId_idx" ON "tickets"("assignedAgentId");

-- CreateIndex
CREATE INDEX "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "rma_requests_rmaNumber_key" ON "rma_requests"("rmaNumber");

-- CreateIndex
CREATE INDEX "rma_requests_orderId_idx" ON "rma_requests"("orderId");

-- CreateIndex
CREATE INDEX "rma_requests_customerId_idx" ON "rma_requests"("customerId");

-- CreateIndex
CREATE INDEX "rma_requests_status_idx" ON "rma_requests"("status");

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_requests" ADD CONSTRAINT "rma_requests_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
