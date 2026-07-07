/*
  Warnings:

  - You are about to drop the column `lastPriceAt` on the `Stock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "lastPriceAt",
ADD COLUMN     "buyZoneHigh" DOUBLE PRECISION,
ADD COLUMN     "buyZoneLow" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "priceAsOf" TIMESTAMP(3),
ALTER COLUMN "status" DROP DEFAULT;
