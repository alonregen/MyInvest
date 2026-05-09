import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs", "demo-xlsx-20260509");
const outputPath = path.join(outputDir, "savings-dashboard-demo.xlsx");
const sheet1PreviewPath = path.join(outputDir, "sheet1-preview.png");
const guidePreviewPath = path.join(outputDir, "guide-preview.png");

const holdings = [
  ["פנסיה", "מניות", 182000, "הראל", "אלון", 6500],
  ["פנסיה", "S&P 500", 158000, "מנורה מבטחים", "נועה", 5400],
  ["קרן השתלמות", "כללי", 94000, "מיטב", "אלון", 3200],
  ["קרן השתלמות", "מחקה מדד", 118000, "אלטשולר שחם", "נועה", 4100],
  ["קופת גמל להשקעה", "אג\"ח", 76000, "הפניקס", "משפחתי", 2200],
  ["קופת גמל", "מניות חו\"ל", 69000, "מור", "אלון", 1800],
  ["חיסכון לכל ילד", "מסלול בסיכון מוגבר", 28400, "הראל", "דניאל", 900],
  ["חיסכון לכל ילד", "מסלול הלכה", 27100, "מנורה מבטחים", "יעל", 900],
  ["תיק השקעות", "מניות ישראל", 123000, "IBI", "אלון", 5000],
  ["תיק השקעות", "אג\"ח כללי", 88000, "פסגות", "משפחתי", 2500],
  ["פיקדון", "קצר מועד", 45000, "בנק לאומי", "משפחתי", 10000],
  ["קופת גמל להשקעה", "עוקב נאסד\"ק", 81000, "אנליסט", "נועה", 2700],
];

const history = [
  ["2025-12-31", 910000],
  ["2026-01-31", 934500],
  ["2026-02-28", 962000],
  ["2026-03-31", 1001500],
  ["2026-04-30", 1054000],
  ["2026-05-09", 1089500],
];

await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("sheet1");
const guide = workbook.worksheets.add("Guide");

buildImportSheet(sheet);
buildGuideSheet(guide);

const dataCheck = await workbook.inspect({
  kind: "table",
  range: "sheet1!A4:F16",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 8,
});
console.log(dataCheck.ndjson);

const summaryCheck = await workbook.inspect({
  kind: "table",
  range: "sheet1!O4:P20",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 4,
});
console.log(summaryCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const sheetPreview = await workbook.render({
  sheetName: "sheet1",
  autoCrop: "all",
  scale: 1,
  format: "png",
});
await fs.writeFile(sheet1PreviewPath, new Uint8Array(await sheetPreview.arrayBuffer()));

const guidePreview = await workbook.render({
  sheetName: "Guide",
  autoCrop: "all",
  scale: 1,
  format: "png",
});
await fs.writeFile(guidePreviewPath, new Uint8Array(await guidePreview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);

console.log(JSON.stringify({ outputPath, sheet1PreviewPath, guidePreviewPath }, null, 2));

function buildImportSheet(sheet) {
  sheet.getRange("A1:F1").merge();
  sheet.getRange("A1:F1").values = [["Savings Dashboard Demo / קובץ דוגמה למרכז החסכונות"]];
  sheet.getRange("A1:F1").format = {
    fill: "#163147",
    font: { bold: true, color: "#FFFFFF" },
  };
  sheet.getRange("A1:F1").format.rowHeight = 28;

  sheet.getRange("A2:F2").merge();
  sheet.getRange("A2:F2").values = [[
    "Upload-ready example: rows 5-16 contain holdings, and columns O:P contain the update and growth story.",
  ]];
  sheet.getRange("A2:F2").format = {
    fill: "#EAF1F5",
    font: { color: "#163147" },
  };
  sheet.getRange("A2:F2").format.rowHeight = 22;

  sheet.getRange("A4:F16").values = [
    ["מוצר", "מסלול", "סכום", "איפה", "אצל מי", "הפקדות בתקופה"],
    ...holdings,
  ];
  sheet.getRange("A4:F4").format = {
    fill: "#198C83",
    font: { bold: true, color: "#FFFFFF" },
  };

  sheet.getRange("C5:C16").format.numberFormat = "₪#,##0";
  sheet.getRange("F5:F16").format.numberFormat = "₪#,##0";

  const notes = [
    "A:E are the required dashboard fields.",
    "F is optional example data for deposits during the period.",
    "P5 is calculated from the holding amounts automatically.",
    "O15:P20 store the historical totals used by the growth chart.",
  ];

  sheet.getRange("H4:M4").merge();
  sheet.getRange("H4:M4").values = [["How To Use / איך משתמשים"]];
  sheet.getRange("H4:M4").format = {
    fill: "#D39A39",
    font: { bold: true, color: "#FFFFFF" },
  };

  notes.forEach((note, index) => {
    const row = 5 + index;
    const range = sheet.getRange(`H${row}:M${row}`);
    range.merge();
    range.values = [[note]];
    range.format = {
      fill: index % 2 === 0 ? "#F7F4EC" : "#FCFAF4",
      font: { color: "#3C4A57" },
    };
  });

  sheet.getRange("O4:O9").values = [
    ["תאריך עדכון"],
    ["סה\"כ"],
    [null],
    ["סכום קודם"],
    ["אחוז עליה"],
    ["נטו עליה"],
  ];
  sheet.getRange("O4:O9").format = {
    fill: "#EAF1F5",
    font: { bold: true, color: "#163147" },
  };
  sheet.getRange("P4").values = [[new Date("2026-05-09T00:00:00")]];
  sheet.getRange("P4").format.numberFormat = "yyyy-mm-dd";
  sheet.getRange("P5").formulas = [["=SUM(C5:C16)"]];
  sheet.getRange("P7").formulas = [["=P19"]];
  sheet.getRange("P8").formulas = [["=IFERROR(P5/P7-1,0)"]];
  sheet.getRange("P9").formulas = [["=P5-P7"]];
  sheet.getRange("P5:P7").format.numberFormat = "₪#,##0";
  sheet.getRange("P8").format.numberFormat = "0.0%";
  sheet.getRange("P9").format.numberFormat = "₪#,##0";

  sheet.getRange("O13:P20").values = [
    ["חודשים קודמים", null],
    ["YYYY-MM-DD", "סכום"],
    ...history,
  ];
  sheet.getRange("O13:P14").format = {
    fill: "#163147",
    font: { bold: true, color: "#FFFFFF" },
  };
  sheet.getRange("P15:P20").format.numberFormat = "₪#,##0";

  sheet.freezePanes.freezeRows(4);

  setImportSheetWidths(sheet);
}

function buildGuideSheet(guide) {
  guide.getRange("A1:H1").merge();
  guide.getRange("A1:H1").values = [["Demo Workbook Guide / מדריך קצר לקובץ הדוגמה"]];
  guide.getRange("A1:H1").format = {
    fill: "#163147",
    font: { bold: true, color: "#FFFFFF" },
  };
  guide.getRange("A1:H1").format.rowHeight = 28;

  guide.getRange("A2:H2").merge();
  guide.getRange("A2:H2").values = [[
    "Use sheet1 for upload. This Guide sheet summarizes the sample portfolio and explains the file structure.",
  ]];
  guide.getRange("A2:H2").format = {
    fill: "#EAF1F5",
    font: { color: "#163147" },
  };

  guide.getRange("A4:B8").values = [
    ["Metric", "Value"],
    ["Current total", null],
    ["Previous total", null],
    ["Net change", null],
    ["Growth", null],
  ];
  guide.getRange("A4:B4").format = {
    fill: "#198C83",
    font: { bold: true, color: "#FFFFFF" },
  };
  guide.getRange("B5").formulas = [["=sheet1!P5"]];
  guide.getRange("B6").formulas = [["=sheet1!P7"]];
  guide.getRange("B7").formulas = [["=sheet1!P9"]];
  guide.getRange("B8").formulas = [["=sheet1!P8"]];
  guide.getRange("B5:B7").format.numberFormat = "₪#,##0";
  guide.getRange("B8").format.numberFormat = "0.0%";

  const guideNotes = [
    "1. Keep the sheet name exactly as sheet1.",
    "2. Row 4 headers must stay in Hebrew as they appear in the template.",
    "3. Rows 5 and below contain one holding per row.",
    "4. Columns O:P are optional but power the growth story in the app.",
  ];

  guide.getRange("D4:H4").merge();
  guide.getRange("D4:H4").values = [["File Notes / הערות למבנה הקובץ"]];
  guide.getRange("D4:H4").format = {
    fill: "#D39A39",
    font: { bold: true, color: "#FFFFFF" },
  };

  guideNotes.forEach((note, index) => {
    const row = 5 + index;
    const range = guide.getRange(`D${row}:H${row}`);
    range.merge();
    range.values = [[note]];
    range.format = {
      fill: index % 2 === 0 ? "#F7F4EC" : "#FCFAF4",
      font: { color: "#3C4A57" },
    };
  });

  guide.getRange("A10:B16").values = [
    ["Date", "Total"],
    ...history,
  ];
  guide.getRange("A10:B10").format = {
    fill: "#163147",
    font: { bold: true, color: "#FFFFFF" },
  };
  guide.getRange("B11:B16").format.numberFormat = "₪#,##0";

  const chart = guide.charts.add("line", guide.getRange("A10:B16"));
  chart.title = "Growth Example";
  chart.hasLegend = false;
  chart.xAxis = { axisType: "textAxis" };
  chart.yAxis = { numberFormatCode: "₪#,##0" };
  chart.setPosition("D10", "K24");

  setGuideSheetWidths(guide);
}

function setImportSheetWidths(sheet) {
  sheet.getRange("A:A").format.columnWidth = 18;
  sheet.getRange("B:B").format.columnWidth = 22;
  sheet.getRange("C:C").format.columnWidth = 12;
  sheet.getRange("D:D").format.columnWidth = 18;
  sheet.getRange("E:E").format.columnWidth = 14;
  sheet.getRange("F:F").format.columnWidth = 14;
  sheet.getRange("H:M").format.columnWidth = 13;
  sheet.getRange("O:O").format.columnWidth = 16;
  sheet.getRange("P:P").format.columnWidth = 14;
}

function setGuideSheetWidths(guide) {
  guide.getRange("A:A").format.columnWidth = 14;
  guide.getRange("B:B").format.columnWidth = 14;
  guide.getRange("D:H").format.columnWidth = 16;
}
