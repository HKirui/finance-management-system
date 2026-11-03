/*
  Warnings:

  - A unique constraint covering the columns `[reversalTransactionId]` on the table `InvoicePayment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "InvoicePayment" ADD COLUMN     "reversalTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InvoicePayment_reversalTransactionId_key" ON "InvoicePayment"("reversalTransactionId");

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_reversalTransactionId_fkey" FOREIGN KEY ("reversalTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
