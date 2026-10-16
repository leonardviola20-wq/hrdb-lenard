const maxImageBytes = 2 * 1024 * 1024;
const contactImagePattern = /^data:image\/(?:png|jpeg|webp|gif);base64,((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$/;

export function contactImageError(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return "Contact image must be an encoded image file.";

  const match = contactImagePattern.exec(value);
  if (!match) return "Contact image must be a PNG, JPEG, WebP, or GIF image.";

  const payload = match[1];
  if (payload.length === 0) return "Contact image must be a PNG, JPEG, WebP, or GIF image.";
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  const decodedBytes = Math.floor(payload.length * 3 / 4) - padding;
  if (decodedBytes > maxImageBytes) return "Contact image must be 2 MB or smaller.";

  return null;
}
