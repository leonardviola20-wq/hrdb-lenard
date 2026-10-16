import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { checkRateLimit, getClientIp, resetRateLimiter } from "./rateLimit";

describe("rate limiter", () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it("allows attempts up to the limit, then blocks within the window", () => {
    const key = "login:ip";
    const now = 1_000_000;
    assert.equal(checkRateLimit(key, 3, 60_000, now).allowed, true);
    assert.equal(checkRateLimit(key, 3, 60_000, now + 1).allowed, true);
    assert.equal(checkRateLimit(key, 3, 60_000, now + 2).allowed, true);
    const blocked = checkRateLimit(key, 3, 60_000, now + 3);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSeconds >= 1);
  });

  it("resets the window once it expires", () => {
    const key = "login:ip2";
    const now = 0;
    checkRateLimit(key, 2, 1_000, now);
    checkRateLimit(key, 2, 1_000, now + 1);
    assert.equal(checkRateLimit(key, 2, 1_000, now + 2).allowed, false);
    // window has now passed
    assert.equal(checkRateLimit(key, 2, 1_000, now + 1_001).allowed, true);
  });

  it("isolates buckets by key", () => {
    const now = 500;
    checkRateLimit("a", 1, 60_000, now);
    assert.equal(checkRateLimit("a", 1, 60_000, now).allowed, false);
    assert.equal(checkRateLimit("b", 1, 60_000, now).allowed, true);
  });

  it("extracts the first hop of x-forwarded-for, then x-real-ip, else unknown", () => {
    assert.equal(getClientIp({ headers: new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }) }), "1.1.1.1");
    assert.equal(getClientIp({ headers: new Headers({ "x-real-ip": "3.3.3.3" }) }), "3.3.3.3");
    assert.equal(getClientIp({ headers: new Headers() }), "unknown");
  });
});
