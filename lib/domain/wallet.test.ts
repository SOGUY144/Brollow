import { describe, expect, it } from "vitest";

export function validateDeposit(amountSatang: number): string | null {
  if (amountSatang <= 0) return "Deposit amount must be greater than zero.";
  if (amountSatang > 100_000_00) return "Deposit amount exceeds limit (฿100,000).";
  return null;
}

export function validateWithdrawal(amountSatang: number, currentBalanceSatang: number): string | null {
  if (amountSatang <= 0) return "Withdrawal amount must be greater than zero.";
  if (amountSatang > currentBalanceSatang) return "Insufficient wallet balance.";
  return null;
}

describe("Wallet domain validations", () => {
  it("validates deposit amount correctly", () => {
    expect(validateDeposit(1000_00)).toBeNull();
    expect(validateDeposit(0)).toMatch(/greater than zero/);
    expect(validateDeposit(-500_00)).toMatch(/greater than zero/);
    expect(validateDeposit(200_000_00)).toMatch(/exceeds limit/);
  });

  it("validates withdrawal amounts against available balance", () => {
    const balance = 5000_00; // ฿5,000
    expect(validateWithdrawal(2000_00, balance)).toBeNull();
    expect(validateWithdrawal(5000_00, balance)).toBeNull();
    expect(validateWithdrawal(6000_00, balance)).toMatch(/Insufficient wallet balance/);
    expect(validateWithdrawal(0, balance)).toMatch(/greater than zero/);
  });
});
