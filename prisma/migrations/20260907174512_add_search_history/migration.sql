-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchHistory_clerkUserId_idx" ON "SearchHistory"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchHistory_clerkUserId_ticker_key" ON "SearchHistory"("clerkUserId", "ticker");
