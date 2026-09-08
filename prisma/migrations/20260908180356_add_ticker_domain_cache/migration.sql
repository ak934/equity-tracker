-- CreateTable
CREATE TABLE "TickerDomain" (
    "ticker" TEXT NOT NULL,
    "domain" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickerDomain_pkey" PRIMARY KEY ("ticker")
);
