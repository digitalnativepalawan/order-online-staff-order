// CSV export utilities with Excel-compatible UTF-8 BOM + JayCee branding helpers
import { format } from "date-fns";

export type DateRangeLike = { from: Date | null; to: Date | null };

const BUSINESS_NAME = "JAYCEE TRADING & SERVICES";
const BUSINESS_CONTACT =
  "Zone 2 Abanico Rd, Puerto Princesa City, Palawan | +63977 116 7555 | tradingjaycee@gmail.com";

function escapeCell(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(rows: Record<string, any>[], headers?: string[]): string {
  if (!rows.length) return headers ? headers.join(",") : "";
  const keys = headers ?? Object.keys(rows[0]);
  const headerLine = keys.join(",");
  const lines = rows.map(r => keys.map(k => escapeCell(r[k])).join(","));
  return [headerLine, ...lines].join("\r\n");
}

export function downloadCSV(filename: string, csv: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatPeriod(range: DateRangeLike): string {
  const { from, to } = range;
  if (!from && !to) return "All Time";
  if (from && to) return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
  if (from && !to) return `From ${format(from, "MMM d, yyyy")}`;
  if (!from && to) return `Through ${format(to, "MMM d, yyyy")}`;
  return "All Time";
}

export function formatGeneratedAt(now: Date = new Date()): string {
  return format(now, "MMM d, yyyy HH:mm");
}

export function brandedFilename(type: string, now: Date = new Date()): string {
  const month = format(now, "MMM").toUpperCase();
  const year = format(now, "yyyy");
  const time = format(now, "HHmm");
  return `jaycee_${type}_${month}${year}_${time}.csv`;
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  gcash: "GCash",
  cash_on_delivery: "Cash on Delivery",
  cod: "Cash on Delivery",
  cash_on_pickup: "Cash on Pickup",
  cop: "Cash on Pickup",
  bank_transfer: "Bank Transfer",
  bank: "Bank Transfer",
  phqr: "PayQR",
  payqr: "PayQR",
};

export function normalizePaymentMethod(raw: any): string {
  if (raw === null || raw === undefined || raw === "") return "Unknown";
  const key = String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (PAYMENT_METHOD_MAP[key]) return PAYMENT_METHOD_MAP[key];
  // Title case fallback
  return String(raw)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export interface BrandedCSVOptions {
  reportName: string;
  range: DateRangeLike;
  headers: string[];
  rows: Record<string, any>[];
  /** Extra rows appended after data, each as an array of cells aligned with headers (or arbitrary). */
  footerRows?: any[][];
  generatedAt?: Date;
}

export function buildBrandedCSV(opts: BrandedCSVOptions): string {
  const { reportName, range, headers, rows, footerRows, generatedAt } = opts;
  const lines: string[] = [];

  // Preamble (6 rows: title, report name, period, generated, contact, blank)
  lines.push(escapeCell(BUSINESS_NAME));
  lines.push(escapeCell(reportName));
  lines.push(escapeCell(`Period: ${formatPeriod(range)}`));
  lines.push(escapeCell(`Generated: ${formatGeneratedAt(generatedAt)}`));
  lines.push(escapeCell(BUSINESS_CONTACT));
  lines.push("");

  // Headers
  lines.push(headers.map(escapeCell).join(","));

  // Data rows
  for (const r of rows) {
    lines.push(headers.map(h => escapeCell(r[h])).join(","));
  }

  // Footer rows (free-form arrays)
  if (footerRows && footerRows.length) {
    for (const fr of footerRows) {
      lines.push(fr.map(escapeCell).join(","));
    }
  }

  return lines.join("\r\n");
}
