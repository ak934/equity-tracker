-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "clerkUserId" TEXT;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "clerkUserId" TEXT;

-- AlterTable
ALTER TABLE "Watchlist" ADD COLUMN     "clerkUserId" TEXT;

-- CreateIndex
CREATE INDEX "Analysis_clerkUserId_idx" ON "Analysis"("clerkUserId");

-- CreateIndex
CREATE INDEX "Stock_clerkUserId_idx" ON "Stock"("clerkUserId");

-- CreateIndex
CREATE INDEX "Watchlist_clerkUserId_idx" ON "Watchlist"("clerkUserId");
