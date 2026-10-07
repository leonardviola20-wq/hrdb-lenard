import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getNextOccurrence,
  getRecurrenceAnchor,
  isTaskRecurrence,
  isValidRepeatDay,
} from "./taskRecurrence";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const utc = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe("isTaskRecurrence", () => {
  it("accepts every supported option", () => {
    for (const option of ["NONE", "DAILY", "WEEKLY", "SEMI_MONTHLY", "MONTHLY", "YEARLY"]) {
      assert.equal(isTaskRecurrence(option), true);
    }
  });

  it("rejects unknown and non-string values", () => {
    for (const value of ["", "daily", "HOURLY", null, undefined, 7, {}]) {
      assert.equal(isTaskRecurrence(value), false);
    }
  });
});

describe("isValidRepeatDay", () => {
  it("accepts real calendar dates", () => {
    assert.equal(isValidRepeatDay(1, 31), true);
    assert.equal(isValidRepeatDay(2, 29), true);
    assert.equal(isValidRepeatDay(4, 30), true);
    assert.equal(isValidRepeatDay(12, 31), true);
  });

  it("rejects days that do not exist in the month", () => {
    assert.equal(isValidRepeatDay(2, 30), false);
    assert.equal(isValidRepeatDay(4, 31), false);
    assert.equal(isValidRepeatDay(6, 31), false);
  });

  it("rejects out-of-range months and days", () => {
    assert.equal(isValidRepeatDay(0, 1), false);
    assert.equal(isValidRepeatDay(13, 1), false);
    assert.equal(isValidRepeatDay(1, 0), false);
    assert.equal(isValidRepeatDay(3.5, 10), false);
    assert.equal(isValidRepeatDay(3, Number.NaN), false);
  });
});

describe("getRecurrenceAnchor", () => {
  it("returns null for NONE and for a missing due date", () => {
    assert.equal(getRecurrenceAnchor("NONE", utc("2024-05-04")), null);
    assert.equal(getRecurrenceAnchor("DAILY", null), null);
  });

  it("anchors monthly repeats on the requested day of the month", () => {
    assert.equal(iso(getRecurrenceAnchor("MONTHLY", utc("2024-05-04"), 31)!), "2000-01-31");
  });

  it("anchors yearly repeats on the requested month and day", () => {
    assert.equal(iso(getRecurrenceAnchor("YEARLY", utc("2024-05-04"), 29, 2)!), "2000-02-29");
  });

  it("falls back to the due date for daily and weekly repeats", () => {
    assert.equal(iso(getRecurrenceAnchor("DAILY", utc("2024-05-04"))!), "2024-05-04");
    assert.equal(iso(getRecurrenceAnchor("WEEKLY", utc("2024-05-04"))!), "2024-05-04");
  });
});

describe("getNextOccurrence - daily", () => {
  it("advances one day", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-05-04"), "DAILY")), "2024-05-05");
  });

  it("rolls over month and year boundaries", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-01-31"), "DAILY")), "2024-02-01");
    assert.equal(iso(getNextOccurrence(utc("2024-12-31"), "DAILY")), "2025-01-01");
  });
});

describe("getNextOccurrence - weekly", () => {
  it("advances seven days when no anchor is given", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-05-04"), "WEEKLY")), "2024-05-11");
  });

  it("targets the anchor weekday", () => {
    // 2024-05-04 is a Saturday; anchor 2024-05-06 is a Monday.
    assert.equal(iso(getNextOccurrence(utc("2024-05-04"), "WEEKLY", utc("2024-05-06"))), "2024-05-06");
  });

  it("skips a full week when the date already matches the anchor weekday", () => {
    const anchor = utc("2024-05-06");
    assert.equal(iso(getNextOccurrence(anchor, "WEEKLY", anchor)), "2024-05-13");
  });
});

describe("getNextOccurrence - semi monthly", () => {
  it("moves to the 15th from the first half of the month", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-05-01"), "SEMI_MONTHLY")), "2024-05-15");
  });

  it("moves to the last day from the second half of the month", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-05-16"), "SEMI_MONTHLY")), "2024-05-31");
    assert.equal(iso(getNextOccurrence(utc("2024-02-16"), "SEMI_MONTHLY")), "2024-02-29");
  });

  it("moves to the 15th of the next month from the last day", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-05-31"), "SEMI_MONTHLY")), "2024-06-15");
  });
});

describe("getNextOccurrence - monthly", () => {
  it("advances one month while preserving the day", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-05-04"), "MONTHLY")), "2024-06-04");
  });

  it("clamps to the last day of a shorter month", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-01-31"), "MONTHLY")), "2024-02-29");
    assert.equal(iso(getNextOccurrence(utc("2023-01-31"), "MONTHLY")), "2023-02-28");
  });

  it("keeps the anchor day when the current date has drifted", () => {
    // Anchor on the 31st; a February date must still land on the 31st in March.
    assert.equal(iso(getNextOccurrence(utc("2024-02-29"), "MONTHLY", utc("2000-01-31"))), "2024-03-31");
  });
});

describe("getNextOccurrence - yearly", () => {
  it("advances one year while preserving month and day", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-05-04"), "YEARLY")), "2025-05-04");
  });

  it("clamps a February 29 anchor to February 28 in non-leap years", () => {
    assert.equal(iso(getNextOccurrence(utc("2024-02-29"), "YEARLY")), "2025-02-28");
  });

  it("always returns a date after the input date", () => {
    const cases: [string, "DAILY" | "WEEKLY" | "SEMI_MONTHLY" | "MONTHLY" | "YEARLY"][] = [
      ["2024-05-04", "DAILY"],
      ["2024-05-04", "WEEKLY"],
      ["2024-05-04", "SEMI_MONTHLY"],
      ["2024-05-04", "MONTHLY"],
      ["2024-02-29", "YEARLY"],
    ];
    for (const [value, recurrence] of cases) {
      const input = utc(value);
      assert.ok(getNextOccurrence(input, recurrence).getTime() > input.getTime(), `${recurrence} from ${value}`);
    }
  });
});
