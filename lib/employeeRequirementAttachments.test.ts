import assert from "node:assert/strict";
import test from "node:test";
import {
  employeeRequirementAttachmentMaxBytes,
  employeeRequirementAttachmentMimeTypes,
  hasSupportedEmployeeRequirementAttachmentSignature,
  isEmployeeRequirementAttachmentMimeType,
} from "./employeeRequirementAttachments";

test("employee requirement attachments are limited to PDF, JPEG, and PNG up to 10 MB", () => {
  assert.deepEqual(employeeRequirementAttachmentMimeTypes, [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ]);
  assert.equal(employeeRequirementAttachmentMaxBytes, 10 * 1024 * 1024);
  assert.equal(isEmployeeRequirementAttachmentMimeType("application/pdf"), true);
  assert.equal(isEmployeeRequirementAttachmentMimeType("text/html"), false);
});

test("validates file signatures against the declared attachment type", () => {
  assert.equal(hasSupportedEmployeeRequirementAttachmentSignature("application/pdf", Buffer.from("%PDF-1.7")), true);
  assert.equal(hasSupportedEmployeeRequirementAttachmentSignature("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0])), true);
  assert.equal(hasSupportedEmployeeRequirementAttachmentSignature("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(hasSupportedEmployeeRequirementAttachmentSignature("image/png", Buffer.from("%PDF-1.7")), false);
  assert.equal(hasSupportedEmployeeRequirementAttachmentSignature("text/html", Buffer.from("<script>")), false);
});
