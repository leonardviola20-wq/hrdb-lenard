import { describe, expect, it } from "vitest";
import { calculateAge, formatDigits, formatMobile } from "./utils";

describe("formatDigits", () => {
  it("groups digits with dashes", () => {
    expect(formatDigits("1234567890", [2, 7, 1])).toBe("12-3456789-0");
  });

  it("strips non-digits and caps length at the group total", () => {
    expect(formatDigits("abc-12x34y56z78901", [3, 3, 3])).toBe("123-456-789");
  });

  it("omits empty trailing groups", () => {
    expect(formatDigits("123", [3, 3, 3, 5])).toBe("123");
  });
});

describe("formatMobile", () => {
  it("formats as 0000 000 0000", () => {
    expect(formatMobile("09123456789")).toBe("0912 345 6789");
  });

  it("caps at 11 digits", () => {
    expect(formatMobile("091234567890123")).toBe("0912 345 6789");
  });

  it("returns partial groups while typing", () => {
    expect(formatMobile("09123")).toBe("0912 3");
  });
});

describe("calculateAge", () => {
  it("returns null for empty input", () => {
    expect(calculateAge("")).toBeNull();
  });

  it("returns null for invalid dates", () => {
    expect(calculateAge("not-a-date")).toBeNull();
  });

  it("computes age from an ISO date", () => {
    const today = new Date();
    const yearsAgo = `${today.getFullYear() - 30}-01-01`;
    expect(calculateAge(yearsAgo)).toBe(30);
  });

  it("returns 0 for a birth date in the future", () => {
    const future = `${new Date().getFullYear() + 1}-01-01`;
    expect(calculateAge(future)).toBe(0);
  });
});
