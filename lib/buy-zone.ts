export type BuyZoneStatus = "below" | "in" | "above" | "unknown";
export interface BuyZoneInput {
    price: number | null | undefined;
    low: number | null | undefined;
    high: number | null | undefined;
}

export function getBuyZoneStatus({ price, low, high}: BuyZoneInput): BuyZoneStatus{
    if (price == null || low == null || high == null){
        return "unknown"
    }

    if (price < low) return "below"
    if (price > high) return "above"
    return "in";
}

