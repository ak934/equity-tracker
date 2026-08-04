-- Re-adds the target price alert field, now set from the analysis page
-- rather than inline in the watchlist.
ALTER TABLE "Stock" ADD COLUMN "targetPrice" DOUBLE PRECISION;
