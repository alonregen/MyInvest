import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, "..", "demo-xlsx-20260509");
const outputPath = path.join(outputDir, "savings-dashboard-demo.xlsx");
const assetsPath = path.resolve(__dirname, "..", "..", "assets", "savings-dashboard-demo.xlsx");

const holdings = [
  ["פנסיה", "מניות", 182000, "הראל", "אלון", 6500],
  ["פנסיה", "S&P 500", 158000, "מנורה מבטחים", "נועה", 5400],
  ["קרן השתלמות", "כללי", 94000, "מיטב", "אלון", 3200],
  ["קרן השתלמות", "מחקה מדד", 118000, "אלטשולר שחם", "נועה", 4100],
  ["קופת גמל להשקעה", 'אג"ח', 76000, "הפניקס", "משפחתי", 2200],
  ["קופת גמל", 'מניות חו"ל', 69000, "מור", "אלון", 1800],
  ["חיסכון לכל ילד", "מסלול בסיכון מוגבר", 28400, "הראל", "דניאל", 900],
  ["חיסכון לכל ילד", "מסלול הלכה", 27100, "מנורה מבטחים", "יעל", 900],
  ["תיק השקעות", "מניות ישראל", 123000, "IBI", "אלון", 5000],
  ["תיק השקעות", 'אג"ח כללי', 88000, "פסגות", "משפחתי", 2500],
  ["פיקדון", "קצר מועד", 45000, "בנק לאומי", "משפחתי", 10000],
  ["קופת גמל להשקעה", 'עוקב נאסד"ק', 81000, "אנליסט", "נועה", 2700],
];

const history = [
  ["2025-12-31", 910000],
  ["2026-01-31", 934500],
  ["2026-02-28", 962000],
  ["2026-03-31", 1001500],
  ["2026-04-30", 1054000],
  ["2026-05-09", 1089500],
];

const currentTotal = holdings.reduce((sum, row) => sum + row[2], 0);
const previousTotal = history.at(-2)?.[1] ?? 0;
const netChange = currentTotal - previousTotal;
const percentChange = previousTotal ? currentTotal / previousTotal - 1 : 0;
const totalDeposits = holdings.reduce((sum, row) => sum + (row[5] ?? 0), 0);
const depositPercent = previousTotal ? totalDeposits / previousTotal : 0;

const fill = (hex) => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: hex.startsWith("FF") ? hex : `FF${hex.replace("#", "")}` },
});

await fs.mkdir(outputDir, { recursive: true });

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("sheet1");
const guide = workbook.addWorksheet("Guide");

buildImportSheet(sheet);
buildGuideSheet(guide);

const buffer = await workbook.xlsx.writeBuffer();
await fs.writeFile(outputPath, buffer);
await fs.copyFile(outputPath, assetsPath);

console.log(JSON.stringify({ outputPath, assetsPath }, null, 2));

function buildImportSheet(ws) {
  ws.mergeCells("A1:F1");
  const t1 = ws.getCell("A1");
  t1.value = "Savings Dashboard Demo / קובץ דוגמה למרכז החסכונות";
  t1.font = { bold: true, color: { argb: "FFFFFFFF" } };
  t1.fill = fill("163147");
  t1.alignment = { vertical: "middle", horizontal: "center", readingOrder: "rtl" };
  ws.getRow(1).height = 28;

  ws.mergeCells("A2:F2");
  const t2 = ws.getCell("A2");
  t2.value =
    "Upload-ready example: rows 5-16 contain holdings, and columns O:P contain the update and growth story.";
  t2.fill = fill("EAF1F5");
  t2.font = { color: { argb: "FF163147" } };
  t2.alignment = { vertical: "middle", wrapText: true };
  ws.getRow(2).height = 22;

  const headerRow = ws.getRow(4);
  headerRow.values = [null, null, null, null, null, null];
  headerRow.getCell(1).value = "מוצר";
  headerRow.getCell(2).value = "מסלול";
  headerRow.getCell(3).value = "סכום";
  headerRow.getCell(4).value = "איפה";
  headerRow.getCell(5).value = "אצל מי";
  headerRow.getCell(6).value = "הפקדות בתקופה";
  for (let c = 1; c <= 6; c++) {
    headerRow.getCell(c).font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.getCell(c).fill = fill("198C83");
  }

  holdings.forEach((row, i) => {
    const r = ws.getRow(5 + i);
    row.forEach((val, j) => {
      r.getCell(j + 1).value = val;
    });
    r.getCell(3).numFmt = '₪#,##0';
    r.getCell(6).numFmt = '₪#,##0';
  });

  const notes = [
    "A:E are the required dashboard fields.",
    "F is optional example data for deposits during the period.",
    "P5 is calculated from the holding amounts automatically.",
    "O15:P20 store the historical totals used by the growth chart.",
  ];

  ws.mergeCells("H4:M4");
  const h4 = ws.getCell("H4");
  h4.value = "How To Use / איך משתמשים";
  h4.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h4.fill = fill("D39A39");
  h4.alignment = { horizontal: "center" };

  notes.forEach((note, index) => {
    const rowNum = 5 + index;
    ws.mergeCells(`H${rowNum}:M${rowNum}`);
    const cell = ws.getCell(`H${rowNum}`);
    cell.value = note;
    cell.fill = fill(index % 2 === 0 ? "F7F4EC" : "FCFAF4");
    cell.font = { color: { argb: "FF3C4A57" } };
    cell.alignment = { wrapText: true };
  });

  const oLabels = [
    "תאריך עדכון",
    'סה"כ',
    null,
    "סכום קודם",
    "אחוז עליה נטו",
    "נטו עליה",
    "כולל הפקדות",
    "אחוז עליה הפקדות",
  ];
  oLabels.forEach((text, i) => {
    const row = ws.getRow(4 + i);
    const c = row.getCell(15);
    if (text !== null) {
      c.value = text;
      c.font = { bold: true, color: { argb: "FF163147" } };
      c.fill = fill("EAF1F5");
    }
  });

  ws.getCell("P4").value = new Date("2026-05-09T12:00:00");
  ws.getCell("P4").numFmt = "yyyy-mm-dd";
  // Cached `result` values let SheetJS read totals on upload (formulas alone are not enough).
  ws.getCell("P5").value = { formula: "SUM(C5:C16)", result: currentTotal };
  ws.getCell("P7").value = { formula: "P19", result: previousTotal };
  ws.getCell("P8").value = { formula: "IFERROR(P5/P7-1,0)", result: percentChange };
  ws.getCell("P9").value = { formula: "P5-P7", result: netChange };
  ws.getCell("P10").value = { formula: "SUM(F5:F16)", result: totalDeposits };
  ws.getCell("P11").value = { formula: "IFERROR(P10/P7,0)", result: depositPercent };
  ws.getCell("P5").numFmt = '₪#,##0';
  ws.getCell("P7").numFmt = '₪#,##0';
  ws.getCell("P8").numFmt = "0.0%";
  ws.getCell("P9").numFmt = '₪#,##0';
  ws.getCell("P10").numFmt = '₪#,##0';
  ws.getCell("P11").numFmt = "0.0%";

  ws.getCell("O13").value = "חודשים קודמים";
  ws.getCell("P13").value = null;
  ws.getCell("O14").value = "YYYY-MM-DD";
  ws.getCell("P14").value = "סכום";
  for (const addr of ["O13", "P13", "O14", "P14"]) {
    const cell = ws.getCell(addr);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = fill("163147");
  }

  history.forEach(([d, total], i) => {
    const r = 15 + i;
    ws.getCell(`O${r}`).value = d;
    ws.getCell(`P${r}`).value = total;
    ws.getCell(`P${r}`).numFmt = '₪#,##0';
  });

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];

  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 18;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 14;
  for (let c = 8; c <= 13; c++) {
    ws.getColumn(c).width = 13;
  }
  ws.getColumn(15).width = 16;
  ws.getColumn(16).width = 14;
}

function buildGuideSheet(ws) {
  ws.mergeCells("A1:H1");
  const a1 = ws.getCell("A1");
  a1.value = "Demo Workbook Guide / מדריך קצר לקובץ הדוגמה";
  a1.font = { bold: true, color: { argb: "FFFFFFFF" } };
  a1.fill = fill("163147");
  a1.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 28;

  ws.mergeCells("A2:H2");
  const a2 = ws.getCell("A2");
  a2.value =
    "Use sheet1 for upload. This Guide sheet summarizes the sample portfolio and explains the file structure.";
  a2.fill = fill("EAF1F5");
  a2.font = { color: { argb: "FF163147" } };
  a2.alignment = { vertical: "middle", wrapText: true };

  ws.getCell("A4").value = "Metric";
  ws.getCell("B4").value = "Value";
  ws.getCell("A5").value = "Current total";
  ws.getCell("A6").value = "Previous total";
  ws.getCell("A7").value = "Net change";
  ws.getCell("A8").value = "Growth";
  for (const addr of ["A4", "B4"]) {
    const c = ws.getCell(addr);
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = fill("198C83");
  }
  ws.getCell("B5").value = { formula: "sheet1!P5", result: currentTotal };
  ws.getCell("B6").value = { formula: "sheet1!P7", result: previousTotal };
  ws.getCell("B7").value = { formula: "sheet1!P9", result: netChange };
  ws.getCell("B8").value = { formula: "sheet1!P8", result: percentChange };
  ws.getCell("B5").numFmt = '₪#,##0';
  ws.getCell("B6").numFmt = '₪#,##0';
  ws.getCell("B7").numFmt = '₪#,##0';
  ws.getCell("B8").numFmt = "0.0%";

  const guideNotes = [
    "1. Keep the sheet name exactly as sheet1.",
    "2. Row 4 headers must stay in Hebrew as they appear in the template.",
    "3. Rows 5 and below contain one holding per row.",
    "4. Columns O:P are optional but power the growth story in the app.",
  ];

  ws.mergeCells("D4:H4");
  const d4 = ws.getCell("D4");
  d4.value = "File Notes / הערות למבנה הקובץ";
  d4.font = { bold: true, color: { argb: "FFFFFFFF" } };
  d4.fill = fill("D39A39");
  d4.alignment = { horizontal: "center" };

  guideNotes.forEach((note, index) => {
    const rowNum = 5 + index;
    ws.mergeCells(`D${rowNum}:H${rowNum}`);
    const cell = ws.getCell(`D${rowNum}`);
    cell.value = note;
    cell.fill = fill(index % 2 === 0 ? "F7F4EC" : "FCFAF4");
    cell.font = { color: { argb: "FF3C4A57" } };
    cell.alignment = { wrapText: true };
  });

  ws.getCell("A10").value = "Date";
  ws.getCell("B10").value = "Total";
  for (const addr of ["A10", "B10"]) {
    const c = ws.getCell(addr);
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = fill("163147");
  }

  history.forEach(([d, total], i) => {
    const r = 11 + i;
    ws.getCell(`A${r}`).value = d;
    ws.getCell(`B${r}`).value = total;
    ws.getCell(`B${r}`).numFmt = '₪#,##0';
  });

  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 14;
  for (let c = 4; c <= 8; c++) {
    ws.getColumn(c).width = 16;
  }
}
