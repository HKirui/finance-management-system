/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `InvoicePayment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `InvoicePayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `InvoicePayment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InvoicePayment" ADD COLUMN     "accountId" TEXT NOT NULL,
ADD COLUMN     "transactionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InvoicePayment_transactionId_key" ON "InvoicePayment"("transactionId");

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
