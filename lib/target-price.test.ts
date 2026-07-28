import { describe, it, expect } from "vitest"
import { hasHitTargetPrice } from "./target-price"

describe("hasHitTargetPrice", () => {
    it("returns false when price is above the target", () => {
        expect(hasHitTargetPrice({ price: 130, targetPrice: 120 })).toBe(false);
    });
    it("returns true when price is below the target", () => {
        expect(hasHitTargetPrice({ price: 90, targetPrice: 120 })).toBe(true);
    });
    it("treats the target price itself as hit", () => {
        expect(hasHitTargetPrice({ price: 120, targetPrice: 120 })).toBe(true);
    });
    it("returns false when the price is missing", () => {
        expect(hasHitTargetPrice({ price: null, targetPrice: 120 })).toBe(false);
    });
    it("returns false when the target price is missing", () => {
        expect(hasHitTargetPrice({ price: 90, targetPrice: null })).toBe(false);
    });
});
