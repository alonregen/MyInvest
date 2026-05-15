import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const demoPath = path.join(root, "assets/savings-dashboard-demo.xlsx");
const EXPECTED_HEADERS = ["מוצר", "מסלול", "סכום", "איפה", "אצל מי"];

function readSheetValue(worksheet, address) {
  const cell = worksheet[address];
  if (!cell) return null;
  return cell.v ?? cell.w ?? null;
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function normalizeDateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "YYYY-MM-DD") return null;
    const parsedDate = new Date(trimmed);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().slice(0, 10);
    }
  }
  return null;
}

function parseDemoWorkbook(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const worksheet = workbook.Sheets.sheet1;
  assert.ok(worksheet, "sheet1 must exist");

  const actualHeaders = EXPECTED_HEADERS.map((_, columnIndex) => {
    const address = XLSX.utils.encode_cell({ r: 3, c: columnIndex });
    return String(readSheetValue(worksheet, address) || "").trim();
  });
  assert.deepEqual(actualHeaders, EXPECTED_HEADERS);

  const declaredTotal = toNumber(readSheetValue(worksheet, "P5"));
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const records = [];

  for (let rowIndex = 4; rowIndex <= range.e.r; rowIndex += 1) {
    const values = [];
    for (let columnIndex = 0; columnIndex < 5; columnIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      values.push(readSheetValue(worksheet, address));
    }
    if (values.every(isBlank)) continue;
    const [product, track, rawAmount, institution, owner] = values;
    const amount = toNumber(rawAmount);
    if (!product || !track || !institution || !owner || !Number.isFinite(amount)) continue;
    records.push({ product, track, amount, institution, owner });
  }

  assert.ok(records.length >= 12, `expected at least 12 holdings, got ${records.length}`);

  const computedTotal = records.reduce((sum, record) => sum + record.amount, 0);
  assert.ok(
    Number.isFinite(declaredTotal) && Math.abs(declaredTotal - computedTotal) <= 0.1,
    `declared total ${declaredTotal} must match computed ${computedTotal}`
  );

  const history = [];
  for (let rowIndex = 13; rowIndex < 80; rowIndex += 1) {
    const dateValue = normalizeDateValue(readSheetValue(worksheet, `O${rowIndex + 1}`));
    const totalValue = toNumber(readSheetValue(worksheet, `P${rowIndex + 1}`));
    if (!dateValue || !Number.isFinite(totalValue)) continue;
    history.push({ date: dateValue, total: totalValue });
  }

  assert.ok(history.length >= 6, `expected history points, got ${history.length}`);

  return { records, declaredTotal, computedTotal, history };
}

const fileBuffer = fs.readFileSync(demoPath);
const parsed = parseDemoWorkbook(fileBuffer);

console.log(
  JSON.stringify(
    {
      ok: true,
      records: parsed.records.length,
      declaredTotal: parsed.declaredTotal,
      historyPoints: parsed.history.length,
    },
    null,
    2
  )
);
