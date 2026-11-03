/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `InvoicePayment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "InvoicePayment" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InvoicePayment_idempotencyKey_key" ON "InvoicePayment"("idempotencyKey");
