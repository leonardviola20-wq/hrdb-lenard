import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAssignedByLabel, parseAssignedByUserId } from "./assignedBy";

describe("assigned-by account labels", () => {
  it("parses only positive safe integer account IDs", () => {
    assert.equal(parseAssignedByUserId("42"), 42);
    assert.equal(parseAssignedByUserId("0"), null);
    assert.equal(parseAssignedByUserId("-3"), null);
    assert.equal(parseAssignedByUserId("someone@example.com"), null);
    assert.equal(parseAssignedByUserId("9007199254740992"), null);
  });

  it("prefers account name, then username, then email", () => {
    assert.equal(
      getAssignedByLabel("1", new Map([[1, { name: "Alex Example", username: "alex", email: "alex@example.com" }]])),
      "Alex Example",
    );
    assert.equal(
      getAssignedByLabel("2", new Map([[2, { name: null, username: "alex", email: "alex@example.com" }]])),
      "alex",
    );
    assert.equal(
      getAssignedByLabel("3", new Map([[3, { name: null, username: null, email: "alex@example.com" }]])),
      "alex@example.com",
    );
  });

  it("preserves legacy account strings and labels the admin fallback", () => {
    assert.equal(getAssignedByLabel("legacy@example.com", new Map()), "legacy@example.com");
    assert.equal(getAssignedByLabel("ADMIN", new Map()), "Admin");
    assert.equal(getAssignedByLabel(null, new Map()), null);
  });

  it("makes missing account references explicit instead of showing a bare ID", () => {
    assert.equal(getAssignedByLabel("42", new Map()), "Unknown account (ID: 42)");
  });
});
