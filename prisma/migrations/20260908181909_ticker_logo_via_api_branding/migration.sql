-- Replaced by the API's own company-logo image instead of a guessed
-- favicon domain; disposable cache data, safe to drop and recreate.
DROP TABLE "TickerDomain";

CREATE TABLE "TickerLogo" (
    "ticker" TEXT NOT NULL,
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickerLogo_pkey" PRIMARY KEY ("ticker")
);
