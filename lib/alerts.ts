import { hasHitTargetPrice } from "./target-price";

export interface TargetPriceStockInput {
  ticker: string;
  price: number | null | undefined;
  targetPrice: number | null | undefined;
}

export interface TargetPriceHit {
  ticker: string;
  name: string;
  price: number | null | undefined;
  targetPrice: number | null | undefined;
}

// Diffs a before/after price snapshot so a hit only fires once, right when
// it's crossed — a stock that's been sitting at/below its target since the
// last refresh (beforeHit already true) doesn't re-trigger every cycle.
export function findNewTargetPriceHits<T extends TargetPriceStockInput>(
  stocksBefore: T[],
  stocksAfter: T[]
): T[] {
  const beforeByTicker = new Map(stocksBefore.map((s) => [s.ticker, s]));

  return stocksAfter.filter((after) => {
    const before = beforeByTicker.get(after.ticker);
    // no prior snapshot to compare against, so we can't call this "new"
    if (!before) return false;

    const beforeHit = hasHitTargetPrice({
      price: before.price,
      targetPrice: before.targetPrice,
    });
    const afterHit = hasHitTargetPrice({
      price: after.price,
      targetPrice: after.targetPrice,
    });

    return !beforeHit && afterHit;
  });
}

export function buildTargetPriceHitEmailHtml(hits: TargetPriceHit[]): string {
  return `
    <div>
      <ul>
        ${hits
          .map(
            (h) =>
              `<li>${h.ticker} Stock has hit the $${h.targetPrice}. Buy now!</li>`
          )
          .join("\n")}
      </ul>
    </div>
  `;
}
