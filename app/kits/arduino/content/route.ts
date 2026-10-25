import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves the standalone Arduino lab (docs/arduino.html) for the /kits/arduino iframe.
// Access is gated by the proxy: /kits is a protected route.
export async function GET() {
  const html = await readFile(path.join(process.cwd(), "docs", "arduino.html"), "utf8");
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
