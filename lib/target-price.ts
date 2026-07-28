export interface TargetPriceInput {
  price: number | null | undefined;
  targetPrice: number | null | undefined;
}

export function hasHitTargetPrice({ price, targetPrice }: TargetPriceInput): boolean {
  if (price == null || targetPrice == null) return false;
  return price <= targetPrice;
}
