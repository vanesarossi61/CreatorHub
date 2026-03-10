// CreatorHub — Stripe Utility Tests
// Tests for money helpers and fee calculations.
// Note: Actual Stripe API calls are not tested here (integration tests).

import { describe, it, expect } from "vitest";
import {
  toCents,
  toDollars,
  calculateFees,
  PLATFORM_FEE_RATE,
  MIN_PAYOUT_CENTS,
  SUPPORTED_CURRENCIES,
} from "@/lib/stripe";

// =============================
// Constants
// =============================

describe("Stripe constants", () => {
  it("PLATFORM_FEE_RATE defaults to 12%", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.12);
  });

  it("MIN_PAYOUT_CENTS is $5.00", () => {
    expect(MIN_PAYOUT_CENTS).toBe(500);
  });

  it("supports expected currencies", () => {
    expect(SUPPORTED_CURRENCIES).toContain("usd");
    expect(SUPPORTED_CURRENCIES).toContain("eur");
    expect(SUPPORTED_CURRENCIES).toContain("ars");
  });
});

// =============================
// Money Conversion
// =============================

describe("toCents", () => {
  it("converts dollars to cents", () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(0.99)).toBe(99);
    expect(toCents(100)).toBe(10000);
  });

  it("rounds to nearest cent", () => {
    expect(toCents(10.999)).toBe(1100);
    expect(toCents(10.994)).toBe(1099);
  });

  it("handles zero", () => {
    expect(toCents(0)).toBe(0);
  });
});

describe("toDollars", () => {
  it("converts cents to dollars", () => {
    expect(toDollars(1000)).toBe(10);
    expect(toDollars(99)).toBe(0.99);
    expect(toDollars(10000)).toBe(100);
  });

  it("handles zero", () => {
    expect(toDollars(0)).toBe(0);
  });
});

// =============================
// Fee Calculation
// =============================

describe("calculateFees", () => {
  it("calculates 12% platform fee", () => {
    const fees = calculateFees(10000); // $100.00
    expect(fees.platformFee).toBe(1200); // $12.00
    expect(fees.netAmount).toBe(8800); // $88.00
    expect(fees.totalCharge).toBe(10000);
  });

  it("rounds platform fee to nearest cent", () => {
    const fees = calculateFees(1001); // $10.01
    // 1001 * 0.12 = 120.12 -> rounds to 120
    expect(fees.platformFee).toBe(120);
    expect(fees.netAmount).toBe(881);
  });

  it("handles small amounts", () => {
    const fees = calculateFees(100); // $1.00
    expect(fees.platformFee).toBe(12);
    expect(fees.netAmount).toBe(88);
  });

  it("handles zero", () => {
    const fees = calculateFees(0);
    expect(fees.platformFee).toBe(0);
    expect(fees.netAmount).toBe(0);
    expect(fees.totalCharge).toBe(0);
  });

  it("platform fee + net amount = total charge", () => {
    // Property-based check for various amounts
    const amounts = [500, 1000, 2500, 5000, 10000, 50000, 100000];
    for (const amount of amounts) {
      const fees = calculateFees(amount);
      expect(fees.platformFee + fees.netAmount).toBe(fees.totalCharge);
    }
  });

  it("large amounts maintain correct ratios", () => {
    const fees = calculateFees(1000000); // $10,000.00
    expect(fees.platformFee).toBe(120000); // $1,200.00
    expect(fees.netAmount).toBe(880000); // $8,800.00
  });
});
