import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { prisma } from "../lib/prisma";

const ZONE_MARGIN = 10;
const FAKE_BEFORE_OFFSET = 50;

async function main() {
  console.log("Using DATABASE_URL host:", new URL(process.env.DATABASE_URL!).host);

  const ticker = process.argv[2];

  if (!ticker) {
    console.error("Usage: npx tsx scripts/force-buy-zone-test.ts <TICKER>");
    process.exit(1);
  }

  const stock = await prisma.stock.findUnique({ where: { ticker } });

  if (!stock) {
    console.error(`No stock found with ticker "${ticker}"`);
    process.exit(1);
  }

  if (stock.lastPrice == null) {
    console.error(
      `"${ticker}" has no lastPrice set yet — refresh it once before running this script.`
    );
    process.exit(1);
  }

  const currentPrice = stock.lastPrice;
  const buyZoneLow = currentPrice - ZONE_MARGIN;
  const buyZoneHigh = currentPrice + ZONE_MARGIN;
  const fakeBeforePrice = currentPrice - FAKE_BEFORE_OFFSET;

  const updated = await prisma.stock.update({
    where: { ticker },
    data: {
      buyZoneLow,
      buyZoneHigh,
      lastPrice: fakeBeforePrice,
      priceAsOf: null,
    },
  });

  console.log(`"${ticker}" set up for a forced buy-zone test:`);
  console.log(`  buyZoneLow:  ${updated.buyZoneLow}`);
  console.log(`  buyZoneHigh: ${updated.buyZoneHigh}`);
  console.log(`  lastPrice:   ${updated.lastPrice}  (faked "before" state, was ${currentPrice})`);
  console.log(`  priceAsOf:   ${updated.priceAsOf}  (cleared, so refreshAllPrices won't skip it)`);
  console.log(
    `\nNow trigger the cron route — the live price it fetches should land inside [${buyZoneLow}, ${buyZoneHigh}], producing a real before→after buy-zone entry.`
  );
}

main()
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
