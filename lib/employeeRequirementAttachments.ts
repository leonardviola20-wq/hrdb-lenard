export const employeeRequirementAttachmentMaxBytes = 10 * 1024 * 1024;

export const employeeRequirementAttachmentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export function isEmployeeRequirementAttachmentMimeType(
  mimeType: string,
): mimeType is (typeof employeeRequirementAttachmentMimeTypes)[number] {
  return employeeRequirementAttachmentMimeTypes.some((supportedType) => supportedType === mimeType);
}

export function hasSupportedEmployeeRequirementAttachmentSignature(
  mimeType: string,
  bytes: Uint8Array,
) {
  if (mimeType === "application/pdf") {
    return bytes.length >= 5
      && bytes[0] === 0x25
      && bytes[1] === 0x50
      && bytes[2] === 0x44
      && bytes[3] === 0x46
      && bytes[4] === 0x2d;
  }
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return bytes.length >= 8
      && bytes[0] === 0x89
      && bytes[1] === 0x50
      && bytes[2] === 0x4e
      && bytes[3] === 0x47
      && bytes[4] === 0x0d
      && bytes[5] === 0x0a
      && bytes[6] === 0x1a
      && bytes[7] === 0x0a;
  }
  return false;
}
