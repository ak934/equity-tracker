-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualityScore" INTEGER NOT NULL,
    "valuationScore" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_ticker_idx" ON "Analysis"("ticker");
