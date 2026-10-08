import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEmployeeServiceSummary } from "./employeeServiceDuration";

const localDate = (value: string) => new Date(`${value}T12:00:00`);

describe("getEmployeeServiceSummary", () => {
  it("formats active service as zero-padded years, months, and days", () => {
    const summary = getEmployeeServiceSummary("Trainee", "2024-01-01", null, localDate("2024-01-02"));
    assert.deepEqual(summary, {
      duration: "00 years 00 months 01 day",
      durationState: "in-service",
      expiryDaysRemaining: null,
    });
  });

  it("uses today for active contractual service and reports days until expiry", () => {
    const summary = getEmployeeServiceSummary("Contractual", "2024-02-01", "2024-04-01", localDate("2024-03-01"));
    assert.deepEqual(summary, {
      duration: "00 years 01 month 00 days",
      durationState: "in-service",
      expiryDaysRemaining: 31,
    });
  });

  it("caps expired contractual service at the end date and reports days expired", () => {
    const summary = getEmployeeServiceSummary("Contractual", "2024-01-01", "2024-02-01", localDate("2024-02-05"));
    assert.deepEqual(summary, {
      duration: "00 years 01 month 00 days",
      durationState: "in-service",
      expiryDaysRemaining: -4,
    });
  });

  it("calculates completed service through the end date for inactive employees", () => {
    const summary = getEmployeeServiceSummary("Resigned", "2020-03-10", "2022-06-15", localDate("2024-01-01"));
    assert.deepEqual(summary, {
      duration: "02 years 03 months 05 days",
      durationState: "in-service",
      expiryDaysRemaining: null,
    });
  });

  it("handles month ends and leap years without negative day values", () => {
    assert.equal(
      getEmployeeServiceSummary("Regular", "2024-01-31", null, localDate("2024-03-01")).duration,
      "00 years 01 month 01 day",
    );
    assert.equal(
      getEmployeeServiceSummary("Regular", "2020-02-29", null, localDate("2021-02-28")).duration,
      "01 year 00 months 00 days",
    );
  });

  it("reports a contract that expires today as zero days remaining", () => {
    const summary = getEmployeeServiceSummary("Contractual", "2024-01-01", "2024-03-01", localDate("2024-03-01"));
    assert.equal(summary.expiryDaysRemaining, 0);
  });

  it("distinguishes missing dates, active employees without a start date, and invalid ranges", () => {
    assert.equal(getEmployeeServiceSummary("Regular", null, null, localDate("2024-01-01")).durationState, "not-set");
    assert.equal(getEmployeeServiceSummary("Resigned", "2020-01-01", null, localDate("2024-01-01")).durationState, "not-active");
    assert.equal(getEmployeeServiceSummary("Regular", "2024-02-01", null, localDate("2024-01-01")).durationState, "invalid-range");
  });
});
