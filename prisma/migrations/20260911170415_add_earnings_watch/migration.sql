-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "earningsCheckedAt" TIMESTAMP(3),
ADD COLUMN     "nextEarningsDate" TIMESTAMP(3),
ADD COLUMN     "watchForEarnings" BOOLEAN NOT NULL DEFAULT false;
