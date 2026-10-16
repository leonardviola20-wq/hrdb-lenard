import assert from "node:assert/strict";
import test from "node:test";
import { calculateSssLoanOutstandingBalanceCents, calculateSssLoanPaymentAmountCents, getSssLoanFirstAmortizationDate, getSssLoanReportCategory, getSssLoanReportTiming, getSssLoanStartDate, isSssLoanEligibleForStartDateThroughMonthReport, parseSssLoanDateFromApi, parseSssLoanDateOnly } from "./sssLoanBalance";

test("loan date parser rejects an overlong or invalid year without throwing", () => {
  assert.equal(parseSssLoanDateOnly("10000-01-01"), null);
  assert.equal(parseSssLoanDateOnly("0000-01-01"), null);
  assert.equal(parseSssLoanDateOnly("2026-02-30"), null);
  assert.equal(parseSssLoanDateOnly("2026-02-28")?.toISOString(), "2026-02-28T00:00:00.000Z");
});

test("loan list date parser accepts API-serialized ISO dates without weakening form date validation", () => {
  assert.equal(parseSssLoanDateFromApi("2026-05-20T00:00:00.000Z")?.toISOString(), "2026-05-20T00:00:00.000Z");
  assert.equal(parseSssLoanDateFromApi("2026-05-20")?.toISOString(), "2026-05-20T00:00:00.000Z");
  assert.equal(parseSssLoanDateFromApi("2026-02-30T00:00:00.000Z"), null);
  assert.equal(parseSssLoanDateFromApi("2026-05-20T00:00:00"), null);
  assert.equal(parseSssLoanDateOnly("2026-05-20T00:00:00.000Z"), null);
});

test("loan balance only changes when actual employee payments are recorded", () => {
  assert.equal(
    calculateSssLoanOutstandingBalanceCents(10_000_00),
    10_000_00,
  );
  assert.equal(
    calculateSssLoanOutstandingBalanceCents(10_000_00, 2_500_00),
    7_500_00,
  );
});

test("loan balance is unknown when approved principal is unavailable", () => {
  assert.equal(
    calculateSssLoanOutstandingBalanceCents(null),
    null,
  );
});

test("actual loan payments cannot reduce the balance below zero", () => {
  assert.equal(
    calculateSssLoanOutstandingBalanceCents(5_000_00, 7_500_00),
    0,
  );
});

test("first amortization date is the first day of the second month after the loan date", () => {
  assert.equal(
    getSssLoanFirstAmortizationDate(new Date("2026-12-20T00:00:00.000Z")).toISOString(),
    "2027-02-01T00:00:00.000Z",
  );
});

test("salary and calamity loan start dates preserve the loan day two months later", () => {
  assert.equal(getSssLoanStartDate(new Date("2026-05-20T00:00:00.000Z"), "S").toISOString(), "2026-07-20T00:00:00.000Z");
  assert.equal(getSssLoanStartDate(new Date("2026-05-20T00:00:00.000Z"), "C").toISOString(), "2026-07-20T00:00:00.000Z");
});

test("emergency loan start date preserves the loan day seven months later", () => {
  assert.equal(getSssLoanStartDate(new Date("2026-05-20T00:00:00.000Z"), "R").toISOString(), "2026-12-20T00:00:00.000Z");
});

test("loan start dates clamp month-end dates and cross year boundaries", () => {
  assert.equal(getSssLoanStartDate(new Date("2026-12-31T00:00:00.000Z"), "S").toISOString(), "2027-02-28T00:00:00.000Z");
  assert.equal(getSssLoanStartDate(new Date("2024-12-31T00:00:00.000Z"), "C").toISOString(), "2025-02-28T00:00:00.000Z");
  assert.equal(getSssLoanStartDate(new Date("2023-12-31T00:00:00.000Z"), "S").toISOString(), "2024-02-29T00:00:00.000Z");
  assert.equal(getSssLoanStartDate(new Date("2023-07-31T00:00:00.000Z"), "R").toISOString(), "2024-02-29T00:00:00.000Z");
  assert.equal(getSssLoanStartDate(new Date("2024-07-31T00:00:00.000Z"), "R").toISOString(), "2025-02-28T00:00:00.000Z");
  assert.equal(getSssLoanStartDate(new Date("2024-08-31T00:00:00.000Z"), "R").toISOString(), "2025-03-31T00:00:00.000Z");
  assert.equal(getSssLoanStartDate(new Date("2024-12-31T00:00:00.000Z"), "R").toISOString(), "2025-07-31T00:00:00.000Z");
});

test("monthly loan payment is due starting the second month after the loan date", () => {
  const loanDate = new Date("2026-05-28T00:00:00.000Z");
  assert.equal(calculateSssLoanPaymentAmountCents(2_500_00, loanDate, new Date("2026-05-01T00:00:00.000Z")), 0);
  assert.equal(calculateSssLoanPaymentAmountCents(2_500_00, loanDate, new Date("2026-06-01T00:00:00.000Z")), 0);
  assert.equal(calculateSssLoanPaymentAmountCents(2_500_00, loanDate, new Date("2026-07-01T00:00:00.000Z")), 2_500_00);
});

test("monthly loan due remains available after the principal amount is amortized", () => {
  assert.equal(
    calculateSssLoanPaymentAmountCents(2_500_00, new Date("2026-01-01T00:00:00.000Z"), new Date("2026-04-01T00:00:00.000Z")),
    2_500_00,
  );
});

test("current-month loan reports distinguish due, overdue, and incoming loans", () => {
  const salaryLoan = {
    status: "ACTIVE",
    employeeStatus: "Regular",
    loanDate: new Date("2026-08-18T00:00:00.000Z"),
    loanType: "S" as const,
  };

  assert.equal(getSssLoanReportTiming(salaryLoan, new Date("2026-10-01T00:00:00.000Z")), "DUE");
  assert.equal(getSssLoanReportTiming(salaryLoan, new Date("2026-11-01T00:00:00.000Z")), "OVERDUE");
  assert.equal(getSssLoanReportTiming(salaryLoan, new Date("2026-09-01T00:00:00.000Z")), null);
});

test("current-month loan report excludes inactive loans and inactive employees", () => {
  const applicableDate = new Date("2026-10-01T00:00:00.000Z");
  const eligibleLoan = {
    status: "ACTIVE",
    employeeStatus: "Regular",
    loanDate: new Date("2026-08-18T00:00:00.000Z"),
    loanType: "S" as const,
  };

  assert.equal(getSssLoanReportTiming(eligibleLoan, applicableDate), "DUE");
  assert.equal(getSssLoanReportTiming({ ...eligibleLoan, status: "PAID" }, applicableDate), null);
  assert.equal(getSssLoanReportTiming({ ...eligibleLoan, employeeStatus: "Resigned" }, applicableDate), null);
});

test("loan Start Date report includes active employee loans starting on or before the applicable month", () => {
  const activeLinkedLoan = {
    status: "ACTIVE",
    employeeId: 42,
    employeeStatus: "Regular",
    loanDate: new Date("2026-08-18T00:00:00.000Z"),
    loanType: "S" as const,
  };
  const currentMonth = new Date("2026-10-01T00:00:00.000Z");

  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport(activeLinkedLoan, currentMonth), true);
  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport({ ...activeLinkedLoan, loanDate: new Date("2026-07-18T00:00:00.000Z") }, currentMonth), true);
  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport({ ...activeLinkedLoan, loanDate: new Date("2026-09-18T00:00:00.000Z") }, currentMonth), false);
  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport({ ...activeLinkedLoan, status: "PAID" }, currentMonth), false);
  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport({ ...activeLinkedLoan, employeeStatus: "Resigned" }, currentMonth), false);
  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport({ ...activeLinkedLoan, employeeId: null }, currentMonth), false);
});

test("loan Start Date report applies the seven-month offset to Emergency loans", () => {
  const emergencyLoan = {
    status: "ACTIVE",
    employeeId: 42,
    employeeStatus: "Trainee",
    loanDate: new Date("2026-01-10T00:00:00.000Z"),
    loanType: "R" as const,
  };

  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport(emergencyLoan, new Date("2026-07-01T00:00:00.000Z")), false);
  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport(emergencyLoan, new Date("2026-08-01T00:00:00.000Z")), true);
  assert.equal(isSssLoanEligibleForStartDateThroughMonthReport(emergencyLoan, new Date("2026-10-01T00:00:00.000Z")), true);
});

test("loan report categories split active, upcoming, and inactive loans", () => {
  const applicableDate = new Date("2026-10-01T00:00:00.000Z");
  const activeEmployeeLoan = {
    status: "ACTIVE",
    employeeId: 42,
    employeeStatus: "Regular",
    loanDate: new Date("2026-08-18T00:00:00.000Z"),
    loanType: "S" as const,
  };

  assert.equal(getSssLoanReportCategory(activeEmployeeLoan, applicableDate), "ACTIVE");
  assert.equal(getSssLoanReportCategory({ ...activeEmployeeLoan, loanDate: new Date("2026-09-18T00:00:00.000Z") }, applicableDate), "UPCOMING");
  assert.equal(getSssLoanReportCategory({ ...activeEmployeeLoan, status: "ON_HOLD" }, applicableDate), "INACTIVE");
  assert.equal(getSssLoanReportCategory({ ...activeEmployeeLoan, employeeStatus: "Resigned" }, applicableDate), null);
  assert.equal(getSssLoanReportCategory({ ...activeEmployeeLoan, employeeId: null }, applicableDate), null);
});

test("current-month loan report includes active loans whose first payment was due in an earlier month", () => {
  const ongoingLoan = {
    status: "ACTIVE",
    employeeStatus: "Regular",
    loanDate: new Date("2026-03-18T00:00:00.000Z"),
    loanType: "S" as const,
  };

  assert.equal(getSssLoanReportTiming(ongoingLoan, new Date("2026-10-01T00:00:00.000Z")), "OVERDUE");
  assert.ok(getSssLoanReportTiming(ongoingLoan, new Date("2026-10-01T00:00:00.000Z")));
  assert.equal(
    calculateSssLoanPaymentAmountCents(2_500_00, ongoingLoan.loanDate, new Date("2026-10-01T00:00:00.000Z"), ongoingLoan.loanType),
    2_500_00,
  );
});

test("emergency loan report eligibility starts seven months after the loan date", () => {
  const emergencyLoan = {
    status: "ACTIVE",
    employeeStatus: "Trainee",
    loanDate: new Date("2026-03-10T00:00:00.000Z"),
    loanType: "R" as const,
  };

  assert.equal(getSssLoanReportTiming(emergencyLoan, new Date("2026-09-01T00:00:00.000Z")), null);
  assert.equal(getSssLoanReportTiming(emergencyLoan, new Date("2026-10-01T00:00:00.000Z")), "DUE");
});
