import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPageAccess } from "./pageAccess";

describe("page access", () => {
  it("allows the Reports dashboard when a Reports subpage is granted", () => {
    assert.equal(hasPageAccess("/reports", ["/reports/sss"]), true);
  });

  it("does not allow the Reports dashboard without a Reports subpage grant", () => {
    assert.equal(hasPageAccess("/reports", ["/employees"]), false);
  });

  it("continues to allow routes beneath an explicitly granted page", () => {
    assert.equal(hasPageAccess("/reports/sss", ["/reports/sss"]), true);
  });
});