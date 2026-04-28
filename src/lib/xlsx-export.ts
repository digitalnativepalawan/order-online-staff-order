// Branded XLSX export engine for JayCee Trading & Services reports.
// Uses ExcelJS to produce styled workbooks matching brand colors and layout.
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { formatPeriod, formatGeneratedAt, type DateRangeLike } from "./csv-export";

// ----- Brand constants -----
const BRAND = {
  orange: "FFF97316",
  navy: "FF0F172A",
  white: "FFFFFFFF",
  lightGray: "FFF9FAFB",
  borderGray: "FFE5E7EB",
  orangeTint: "FFFED7AA",
  green: "FFD1FAE5",
  red: "FFFEE2E2",
  textDark: "FF1F2937",
  textGray: "FF4B5563",
  textMuted: "FF6B7280",
  navyText: "FF0F172A",
  subtotalAmber: "FFFEF3C7",
};

const BUSINESS_NAME = "JayCee Trading & Services";
const BUSINESS_CONTACT =
  "Zone 2 Abanico Rd, Puerto Princesa City, Palawan  |  +63977 116 7555  |  tradingjaycee@gmail.com";

const MONEY_FMT = '"₱"#,##0.00';
const MARGIN_FMT = '0.0"%"';
const DATE_FMT = "yyyy-mm-dd";
const COUNT_FMT = "0";

export type ColType = "money" | "margin" | "date" | "count" | "id" | "text";

export type SectionRowStyle = "data" | "subtotal" | "grand_total" | "totals";

export type Section =
  | { type: "spacer" }
  | { type: "banner"; text: string }
  | { type: "subheader"; headers: string[] }
  | { type: "row"; cells: any[]; style: SectionRowStyle; columnTypes?: ColType[] };

export interface BuildBrandedWorkbookOptions {
  sheetName: string;
  tabColor: string; // hex without # (e.g. "F97316")
  reportName: string;
  range: DateRangeLike;
  headers: string[];
  rows: Record<string, any>[];
  totalsRow?: Record<string, any>;
  extraSections?: Section[];
  columnTypes?: Record<string, ColType>;
  generatedAt?: Date;
}

// ----- Helpers -----
function fillSolid(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function thinBorder(argb = BRAND.borderGray): Partial<ExcelJS.Borders> {
  return {
    top: { style: "thin", color: { argb } },
    left: { style: "thin", color: { argb } },
    bottom: { style: "thin", color: { argb } },
    right: { style: "thin", color: { argb } },
  };
}

function colLetter(index1: number): string {
  // 1-indexed → A, B, ... AA, AB
  let n = index1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function applyMoney(cell: ExcelJS.Cell, val: any) {
  const n = typeof val === "number" ? val : parseFloat(String(val ?? "").replace(/,/g, ""));
  cell.value = isFinite(n) ? n : null;
  cell.numFmt = MONEY_FMT;
  cell.alignment = { ...(cell.alignment ?? {}), horizontal: "right", vertical: "middle" };
}

function applyMargin(cell: ExcelJS.Cell, val: any) {
  const n = typeof val === "number" ? val : parseFloat(String(val ?? ""));
  cell.value = isFinite(n) ? n : null;
  cell.numFmt = MARGIN_FMT;
  cell.alignment = { ...(cell.alignment ?? {}), horizontal: "right", vertical: "middle" };
  if (isFinite(n)) {
    if (n >= 30) cell.fill = fillSolid(BRAND.green);
    else if (n < 20) cell.fill = fillSolid(BRAND.red);
  }
}

function applyCount(cell: ExcelJS.Cell, val: any) {
  const n = typeof val === "number" ? val : parseInt(String(val ?? ""), 10);
  cell.value = isFinite(n) ? n : null;
  cell.numFmt = COUNT_FMT;
  cell.alignment = { ...(cell.alignment ?? {}), horizontal: "right", vertical: "middle" };
}

function applyDate(cell: ExcelJS.Cell, val: any) {
  if (!val) {
    cell.value = "";
    return;
  }
  // Accept Date, ISO string, or yyyy-MM-dd; store as Date for proper Excel date.
  let d: Date | null = null;
  if (val instanceof Date) d = val;
  else if (typeof val === "string") {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (d) {
    cell.value = d;
    cell.numFmt = DATE_FMT;
  } else {
    cell.value = String(val);
  }
  cell.alignment = { ...(cell.alignment ?? {}), horizontal: "left", vertical: "middle" };
}

function applyId(cell: ExcelJS.Cell, val: any) {
  cell.value = val ?? "";
  cell.font = { name: "Courier New", size: 9, color: { argb: BRAND.textDark } };
  cell.alignment = { ...(cell.alignment ?? {}), horizontal: "left", vertical: "middle" };
}

function applyText(cell: ExcelJS.Cell, val: any) {
  cell.value = val == null ? "" : val;
  cell.alignment = { ...(cell.alignment ?? {}), horizontal: "left", vertical: "middle", wrapText: false };
}

function applyByType(cell: ExcelJS.Cell, type: ColType | undefined, val: any) {
  switch (type) {
    case "money": return applyMoney(cell, val);
    case "margin": return applyMargin(cell, val);
    case "date": return applyDate(cell, val);
    case "count": return applyCount(cell, val);
    case "id": return applyId(cell, val);
    case "text":
    default: return applyText(cell, val);
  }
}

function prettyHeader(key: string): string {
  return key
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Compute auto column widths (clamped 10..35), force 22 for id columns
function computeWidths(
  headers: string[],
  rows: Record<string, any>[],
  columnTypes?: Record<string, ColType>,
): number[] {
  return headers.map(h => {
    if (columnTypes?.[h] === "id") return 22;
    let max = prettyHeader(h).length;
    for (const r of rows) {
      const v = r[h];
      const s = v == null ? "" : String(v);
      if (s.length > max) max = s.length;
      if (max >= 35) break;
    }
    return Math.max(10, Math.min(35, max + 2));
  });
}

async function tryLoadLogoBuffer(): Promise<{ buffer: ArrayBuffer; ext: "png" | "jpeg" } | null> {
  const candidates: Array<[string, "png" | "jpeg"]> = [
    ["/jaycee-logo.png", "png"],
    ["/jaycee-logo.jpg", "jpeg"],
    ["/jaycee-logo.jpeg", "jpeg"],
  ];
  for (const [path, ext] of candidates) {
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) {
        console.warn(`[xlsx-export] Logo fetch ${path} → ${res.status}`);
        continue;
      }
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength === 0) {
        console.warn(`[xlsx-export] Logo at ${path} is empty`);
        continue;
      }
      console.info(`[xlsx-export] Loaded logo from ${path} (${buffer.byteLength} bytes)`);
      return { buffer, ext };
    } catch (e) {
      console.warn(`[xlsx-export] Logo fetch ${path} threw`, e);
    }
  }
  console.warn("[xlsx-export] Logo not found at any candidate path");
  return null;
}

// ----- Main builder -----
export async function buildBrandedWorkbook(opts: BuildBrandedWorkbookOptions): Promise<ExcelJS.Workbook> {
  const {
    sheetName, tabColor, reportName, range, headers, rows,
    totalsRow, extraSections, columnTypes, generatedAt,
  } = opts;

  const wb = new ExcelJS.Workbook();
  wb.creator = "JayCee Trading & Services";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, {
    properties: { tabColor: { argb: "FF" + tabColor.replace(/^#/, "").toUpperCase() } },
    views: [{ state: "frozen", ySplit: 7 }],
  });

  const colCount = headers.length;
  const lastColLetter = colLetter(colCount);

  // Column widths
  const widths = computeWidths(headers, rows, columnTypes);
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // ---- Header block (rows 1-6) ----
  // Row 1: Business name on orange
  ws.mergeCells(`A1:${lastColLetter}1`);
  const r1 = ws.getCell("A1");
  r1.value = BUSINESS_NAME;
  r1.font = { bold: true, size: 18, color: { argb: BRAND.white } };
  r1.fill = fillSolid(BRAND.orange);
  r1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 40;

  // Row 2: Report name on navy
  ws.mergeCells(`A2:${lastColLetter}2`);
  const r2 = ws.getCell("A2");
  r2.value = reportName;
  r2.font = { bold: true, size: 14, color: { argb: BRAND.white } };
  r2.fill = fillSolid(BRAND.navy);
  r2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(2).height = 32;

  // Row 3: Period
  ws.mergeCells(`A3:${lastColLetter}3`);
  const r3 = ws.getCell("A3");
  r3.value = `Period: ${formatPeriod(range)}`;
  r3.font = { italic: true, size: 11, color: { argb: BRAND.textGray } };
  r3.fill = fillSolid(BRAND.lightGray);
  r3.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(3).height = 22;

  // Row 4: Generated
  ws.mergeCells(`A4:${lastColLetter}4`);
  const r4 = ws.getCell("A4");
  r4.value = `Generated: ${formatGeneratedAt(generatedAt)}`;
  r4.font = { italic: true, size: 11, color: { argb: BRAND.textGray } };
  r4.fill = fillSolid(BRAND.lightGray);
  r4.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(4).height = 22;

  // Row 5: Contact
  ws.mergeCells(`A5:${lastColLetter}5`);
  const r5 = ws.getCell("A5");
  r5.value = BUSINESS_CONTACT;
  r5.font = { size: 10, color: { argb: BRAND.textMuted } };
  r5.fill = fillSolid(BRAND.lightGray);
  r5.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(5).height = 22;

  // Row 6: spacer (white)
  ws.mergeCells(`A6:${lastColLetter}6`);
  const r6 = ws.getCell("A6");
  r6.fill = fillSolid(BRAND.white);
  ws.getRow(6).height = 10;

  // ---- Logo (top-right, fixed pixel size for cross-app compatibility) ----
  const logo = await tryLoadLogoBuffer();
  if (logo && colCount >= 2) {
    try {
      // ExcelJS expects a Uint8Array/Buffer for `buffer`. ArrayBuffer alone
      // can be silently dropped by some readers (notably Google Sheets).
      const imgId = wb.addImage({
        buffer: new Uint8Array(logo.buffer) as any,
        extension: logo.ext,
      });
      // Anchor top-right using ext (pixel dims) — most reliable across Excel,
      // LibreOffice, and Google Sheets. ~110px wide x 90px tall.
      const anchorCol = Math.max(0, colCount - 2); // 0-indexed
      ws.addImage(imgId, {
        tl: { col: anchorCol, row: 0 } as any,
        ext: { width: 110, height: 90 },
        editAs: "oneCell",
      });
      console.info("[xlsx-export] Logo embedded at column", anchorCol + 1);
    } catch (e) {
      console.warn("[xlsx-export] Failed to embed logo:", e);
    }
  }

  // ---- Row 7: Column headers ----
  const headerRow = ws.getRow(7);
  headerRow.height = 28;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = prettyHeader(h);
    cell.font = { bold: true, size: 11, color: { argb: BRAND.white } };
    cell.fill = fillSolid(BRAND.navy);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: BRAND.white } },
      left: { style: "thin", color: { argb: BRAND.white } },
      bottom: { style: "thin", color: { argb: BRAND.white } },
      right: { style: "thin", color: { argb: BRAND.white } },
    };
  });

  // ---- Data rows (row 8+) ----
  let nextRow = 8;
  rows.forEach((r, idx) => {
    const row = ws.getRow(nextRow++);
    row.height = 22;
    const altFill = idx % 2 === 0 ? BRAND.white : BRAND.lightGray;
    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      const type = columnTypes?.[h];
      cell.font = { name: "Calibri", size: 10, color: { argb: BRAND.textDark } };
      cell.fill = fillSolid(altFill);
      cell.border = thinBorder();
      applyByType(cell, type, r[h]);
    });
  });

  // ---- TOTALS row ----
  if (totalsRow) {
    const row = ws.getRow(nextRow++);
    row.height = 28;
    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      const type = columnTypes?.[h];
      cell.font = { bold: true, size: 11, color: { argb: BRAND.navyText } };
      cell.fill = fillSolid(BRAND.orangeTint);
      cell.border = {
        ...thinBorder(),
        top: { style: "medium", color: { argb: BRAND.orange } },
      };
      const val = i === 0 && (totalsRow[h] == null || totalsRow[h] === "")
        ? "TOTALS"
        : totalsRow[h];
      if (type === "money") {
        applyMoney(cell, val);
        cell.fill = fillSolid(BRAND.orangeTint);
      } else if (type === "margin") {
        applyCount(cell, val);
        cell.numFmt = MARGIN_FMT;
        cell.fill = fillSolid(BRAND.orangeTint);
      } else if (type === "count") {
        applyCount(cell, val);
        cell.fill = fillSolid(BRAND.orangeTint);
      } else if (type === "date") {
        cell.value = val ?? "";
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else if (type === "id") {
        cell.value = val ?? "";
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.value = val ?? "";
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
      cell.font = { bold: true, size: 11, color: { argb: BRAND.navyText } };
    });
  }

  // ---- Extra sections ----
  if (extraSections) {
    for (const sec of extraSections) {
      if (sec.type === "spacer") {
        const row = ws.getRow(nextRow++);
        row.height = 10;
        for (let i = 1; i <= colCount; i++) {
          row.getCell(i).fill = fillSolid(BRAND.white);
        }
      } else if (sec.type === "banner") {
        const row = ws.getRow(nextRow);
        row.height = 28;
        ws.mergeCells(`A${nextRow}:${lastColLetter}${nextRow}`);
        const cell = ws.getCell(`A${nextRow}`);
        cell.value = sec.text;
        cell.font = { bold: true, size: 12, color: { argb: BRAND.white } };
        cell.fill = fillSolid(BRAND.navy);
        cell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
        nextRow++;
      } else if (sec.type === "subheader") {
        const row = ws.getRow(nextRow++);
        row.height = 24;
        sec.headers.forEach((h, i) => {
          const cell = row.getCell(i + 1);
          cell.value = h;
          cell.font = { bold: true, size: 10, color: { argb: BRAND.white } };
          cell.fill = fillSolid(BRAND.navy);
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = thinBorder(BRAND.white);
        });
      } else if (sec.type === "row") {
        const row = ws.getRow(nextRow++);
        const styleType = sec.style;
        let bg = BRAND.white;
        let fontBold = false;
        let fontSize = 10;
        let fontColor = BRAND.textDark;
        let topBorder: ExcelJS.Border | undefined;
        if (styleType === "subtotal") {
          bg = BRAND.subtotalAmber;
          fontBold = true;
          fontSize = 10;
          row.height = 24;
        } else if (styleType === "grand_total" || styleType === "totals") {
          bg = BRAND.orangeTint;
          fontBold = true;
          fontSize = 11;
          fontColor = BRAND.navyText;
          topBorder = { style: "medium", color: { argb: BRAND.orange } };
          row.height = 28;
        } else {
          row.height = 22;
        }
        sec.cells.forEach((val, i) => {
          const cell = row.getCell(i + 1);
          const type = sec.columnTypes?.[i];
          cell.fill = fillSolid(bg);
          cell.border = topBorder ? { ...thinBorder(), top: topBorder } : thinBorder();
          applyByType(cell, type, val);
          cell.font = { bold: fontBold, size: fontSize, color: { argb: fontColor } };
        });
      }
    }
  }

  return wb;
}

// ----- Download helper -----
export async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function brandedXlsxFilename(type: string, now: Date = new Date()): string {
  const month = format(now, "MMM").toUpperCase();
  const year = format(now, "yyyy");
  const time = format(now, "HHmm");
  return `jaycee_${type}_${month}${year}_${time}.xlsx`;
}
