-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "earningsCheckedAt",
DROP COLUMN "nextEarningsDate",
DROP COLUMN "watchForEarnings",
ADD COLUMN     "nextAnalysisDate" TIMESTAMP(3);
