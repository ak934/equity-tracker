-- DropIndex
DROP INDEX "Analysis_clerkUserId_idx";

-- DropIndex
DROP INDEX "Analysis_ticker_idx";

-- DropIndex
DROP INDEX "Stock_ticker_key";

-- AlterTable
ALTER TABLE "Analysis" ALTER COLUMN "clerkUserId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Stock" ALTER COLUMN "clerkUserId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Watchlist" ALTER COLUMN "clerkUserId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Analysis_clerkUserId_ticker_idx" ON "Analysis"("clerkUserId", "ticker");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_clerkUserId_ticker_key" ON "Stock"("clerkUserId", "ticker");
