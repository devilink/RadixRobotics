// Pure helpers for spreadsheet imports: CSV parsing, Google Sheets links,
// header matching and cell normalisation. No I/O here (see spreadsheet-source.ts).

export type Cell = string | number | boolean | Date | null | undefined;

export const MAX_IMPORT_ROWS = 2000;

/**
 * Guess the delimiter from the first non-blank line: Excel saves "CSV" with
 * semicolons in many regions, and "Text (Tab delimited)" uses tabs.
 */
export function detectDelimiter(text: string): Delimiter {
  const line = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const unquoted = line.replace(/"[^"]*"/g, "");
  const count = (ch: string) => unquoted.split(ch).length - 1;
  const best = ([",", ";", "\t"] as const).reduce((a, b) => (count(b) > count(a) ? b : a));
  return count(best) > 0 ? best : ",";
}

type Delimiter = "," | ";" | "\t";

/** RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF/LF, BOM). Delimiter is detected unless given. */
export function parseCsv(text: string, delimiter?: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const sep = delimiter ?? detectDelimiter(s);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === sep) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * CSV export URL for a Google Sheets link, or null if it is not one.
 * Works for normal share links (…/spreadsheets/d/<id>/edit#gid=<tab>) and
 * "Publish to web" links (…/spreadsheets/d/e/<id>/pub…).
 */
export function googleSheetCsvUrl(link: string): string | null {
  let url: URL;
  try { url = new URL(link.trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") return null;
  const gid = /(?:[#&?]gid=)(\d+)/.exec(url.hash + url.search)?.[1];
  const published = /^\/spreadsheets\/d\/e\/([A-Za-z0-9_-]{20,})\/pub/.exec(url.pathname);
  if (published) {
    return `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=csv${gid ? `&gid=${gid}` : ""}`;
  }
  const id = /^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/.exec(url.pathname)?.[1];
  if (!id) return null;
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid ? `&gid=${gid}` : ""}`;
}

/** Lower-case, punctuation-free form of a header for matching ("Roll No." → "roll no"). */
export function normalizeHeader(h: Cell): string {
  return cellText(h).replace(/\s*\*$/, "").toLowerCase().replace(/&/g, " and ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Cell → trimmed text. Dates become YYYY-MM-DD; whole numbers lose ".0". */
export function cellText(c: Cell): string {
  if (c === null || c === undefined) return "";
  if (c instanceof Date) return Number.isNaN(c.getTime()) ? "" : c.toISOString().slice(0, 10);
  if (typeof c === "number") return Number.isInteger(c) ? c.toFixed(0) : String(c);
  return String(c).trim();
}

/**
 * Normalise a date cell to YYYY-MM-DD. Accepts real Excel dates, ISO dates and
 * day-first dates (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY), as used in India.
 * Returns "" for blank and null for something that is not a valid date.
 */
export function normalizeDate(c: Cell): string | null {
  if (c instanceof Date) return cellText(c) || null;
  const s = cellText(c);
  if (!s) return "";
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s))) {
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (y < 100) y += 2000;
  } else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

/** "₹1,250.50" → "1250.50"; returns the text unchanged if it is not money-like. */
export function cleanNumber(c: Cell): string {
  if (typeof c === "number") return String(c);
  return cellText(c).replace(/^(₹|rs\.?|inr)\s*/i, "").replace(/,/g, "");
}

export type ColumnSpec<K extends string> = { key: K; label: string; aliases: string[]; required?: boolean };

export type MappedTable<K extends string> = {
  /** Spreadsheet row number (1-based, as shown in Excel) and cells keyed by column. */
  records: { row: number; cells: Partial<Record<K, Cell>>; headers: Partial<Record<K, string>> }[];
  matched: K[];
  missing: string[];
  ignored: string[];
  /** Header row as written in the sheet (for error messages). */
  found: string[];
};

/**
 * Find the header row, match its columns to the spec by name or alias, and
 * return the data rows below it. Blank rows are dropped.
 */
export function mapTable<K extends string>(table: Cell[][], spec: ColumnSpec<K>[]): MappedTable<K> {
  const lookup = new Map<string, K>();
  for (const s of spec) for (const a of [s.key.replace(/_/g, " "), s.label, ...s.aliases]) lookup.set(normalizeHeader(a), s.key);

  // The header row is the one (among the first 10 non-blank rows) that matches
  // the most known column names, so a title or notes row above it is skipped.
  const nonBlank = table.map((r, i) => [r, i] as const).filter(([r]) => r.some((c) => cellText(c) !== "")).slice(0, 10);
  if (nonBlank.length === 0) return { records: [], matched: [], missing: spec.filter((s) => s.required).map((s) => s.label), ignored: [], found: [] };
  const score = (r: Cell[]) => new Set(r.map((c) => lookup.get(normalizeHeader(c))).filter(Boolean)).size;
  const [header, headerIndex] = nonBlank.reduce((best, cur) => (score(cur[0]) > score(best[0]) ? cur : best));

  const columns = new Map<K, number>();
  const headerText = new Map<K, string>();
  const ignored: string[] = [];
  header.forEach((h, i) => {
    const n = normalizeHeader(h);
    if (!n) return;
    const key = lookup.get(n);
    if (key && !columns.has(key)) { columns.set(key, i); headerText.set(key, n); }
    else ignored.push(cellText(h));
  });

  const records: MappedTable<K>["records"] = [];
  for (let r = headerIndex + 1; r < table.length; r++) {
    const row = table[r];
    if (!row.some((c) => cellText(c) !== "")) continue;
    const cells: Partial<Record<K, Cell>> = {};
    const headers: Partial<Record<K, string>> = {};
    for (const [key, i] of columns) { cells[key] = row[i]; headers[key] = headerText.get(key); }
    records.push({ row: r + 1, cells, headers });
  }
  return {
    records,
    matched: [...columns.keys()],
    missing: spec.filter((s) => s.required && !columns.has(s.key)).map((s) => s.label),
    ignored,
    found: header.map(cellText).filter(Boolean),
  };
}

/** Header row for a downloadable template. */
export function templateCsv(headers: string[], example: string[][]): string {
  const q = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [headers, ...example].map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";
}
