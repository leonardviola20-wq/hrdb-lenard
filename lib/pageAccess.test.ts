import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canViewPage, hasPageAccess } from "./pageAccess";

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

  it("allows Chat for any signed-in user regardless of page permissions", () => {
    assert.equal(hasPageAccess("/chat", []), true);
    assert.equal(hasPageAccess("/chat/settings", []), true);
    assert.equal(canViewPage({ role: "USER", accessiblePages: ["/tasks"] }, "/chat"), true);
    assert.equal(canViewPage(null, "/chat"), false);
  });
});