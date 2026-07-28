-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "targetPrice" DOUBLE PRECISION;

-- Backfill: preserve the existing buy-zone low bound as the initial target price
UPDATE "Stock" SET "targetPrice" = "buyZoneLow" WHERE "buyZoneLow" IS NOT NULL;

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "buyZoneHigh",
DROP COLUMN "buyZoneLow";
