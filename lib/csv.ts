const CSV_QUOTE_PATTERN = /[",\r\n]/;

/**
 * Parse CSV text into an array of rows.
 * Handles quoted fields, escaped quotes ("") and CRLF/LF line endings.
 * A leading UTF-8 BOM (added by Excel) is stripped.
 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (inQuotes) {
      if (char === "\"") {
        if (source[index + 1] === "\"") {
          field += "\"";
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      index += 1;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      index += 1;
      continue;
    }
    if (char === "\r" || char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      index += char === "\r" && source[index + 1] === "\n" ? 2 : 1;
      continue;
    }
    field += char;
    index += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Serialize rows into CSV text (CRLF line endings, quotes only when needed). */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = value === null || value === undefined ? "" : String(value);
          return CSV_QUOTE_PATTERN.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
        })
        .join(",")
    )
    .join("\r\n");
}
