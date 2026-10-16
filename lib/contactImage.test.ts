import assert from "node:assert/strict";
import test from "node:test";
import { contactImageError } from "./contactImage";

test("contact images allow an empty value and supported data URLs", () => {
  assert.equal(contactImageError(null), null);
  assert.equal(contactImageError(""), null);
  assert.equal(contactImageError("data:image/png;base64,aGVsbG8="), null);
});

test("contact images reject unsupported formats and non-image values", () => {
  assert.notEqual(contactImageError(42), null);
  assert.notEqual(contactImageError("https://example.com/logo.svg"), null);
  assert.notEqual(contactImageError("data:image/svg+xml;base64,PHN2Zz4="), null);
  assert.notEqual(contactImageError("data:image/png;base64,"), null);
});

test("contact images enforce a 2 MB decoded file limit", () => {
  const withinLimit = `data:image/png;base64,${Buffer.alloc(2 * 1024 * 1024).toString("base64")}`;
  const overLimit = `data:image/png;base64,${Buffer.alloc((2 * 1024 * 1024) + 1).toString("base64")}`;
  assert.equal(contactImageError(withinLimit), null);
  assert.equal(contactImageError(overLimit), "Contact image must be 2 MB or smaller.");
});
