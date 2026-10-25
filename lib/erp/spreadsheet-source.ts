import "server-only";
import { readSheet } from "read-excel-file/node";
import { googleSheetCsvUrl, parseCsv, type Cell } from "./spreadsheet";

// Reads the table behind an import: an uploaded .xlsx/.csv file, or a Google
// Sheet shared as "Anyone with the link". Only the first sheet (or the tab in
// the link) is read.

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export class ImportSourceError extends Error {}

export async function readImportSource(fd: FormData): Promise<Cell[][]> {
  const file = fd.get("file");
  const link = String(fd.get("sheet_url") ?? "").trim();
  if (file instanceof File && file.size > 0) return readUpload(file);
  if (link) return readGoogleSheet(link);
  throw new ImportSourceError("Choose a file or paste a Google Sheets link.");
}

async function readUpload(file: File): Promise<Cell[][]> {
  if (file.size > MAX_UPLOAD_BYTES) throw new ImportSourceError("The file is larger than 5 MB. Split it into smaller files.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt") || name.endsWith(".tsv")) return parseCsv(decodeText(await file.arrayBuffer()));
  if (name.endsWith(".xls")) {
    throw new ImportSourceError("Old .xls files are not supported. In Excel, use File → Save As → Excel Workbook (.xlsx).");
  }
  if (!name.endsWith(".xlsx")) throw new ImportSourceError("Upload an Excel (.xlsx) or CSV file.");
  try {
    return (await readSheet(Buffer.from(await file.arrayBuffer()))) as Cell[][];
  } catch {
    throw new ImportSourceError("The Excel file could not be read. Check that it is a valid .xlsx file.");
  }
}

/** Text from a CSV upload: UTF-8 normally, UTF-16 for Excel's "Unicode Text" export. */
function decodeText(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(b);
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(b);
  return new TextDecoder("utf-8").decode(b);
}

async function readGoogleSheet(link: string): Promise<Cell[][]> {
  const url = googleSheetCsvUrl(link);
  if (!url) throw new ImportSourceError("That is not a Google Sheets link. Copy the link from the sheet's Share button.");
  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new ImportSourceError("Google Sheets could not be reached. Try again, or download the sheet as .xlsx and upload it.");
  }
  // Google only redirects to its own content hosts; refuse anything else.
  const finalHost = new URL(res.url || url).hostname;
  const fromGoogle = finalHost === "docs.google.com" || finalHost.endsWith(".googleusercontent.com");
  const type = res.headers.get("content-type") ?? "";
  if (!fromGoogle || !res.ok || !/text\/(csv|plain)/.test(type)) {
    throw new ImportSourceError(
      "The sheet is not shared publicly. In Google Sheets click Share → General access → “Anyone with the link” (Viewer), then try again."
    );
  }
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES) throw new ImportSourceError("The sheet is too large. Split it into smaller sheets.");
  const text = await res.text();
  if (text.length > MAX_UPLOAD_BYTES) throw new ImportSourceError("The sheet is too large. Split it into smaller sheets.");
  return parseCsv(text);
}
