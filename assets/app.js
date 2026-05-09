const EXPECTED_HEADERS = ["מוצר", "מסלול", "סכום", "איפה", "אצל מי"];
const FILTER_KEYS = {
  owners: "owner",
  institutions: "institution",
  products: "product",
  tracks: "track",
};
const FILTER_LABELS = {
  owners: "אצל מי",
  institutions: "איפה",
  products: "מוצר",
  tracks: "מסלול",
};
const FILTER_SECTION_KEYS = ["quick", "owners", "institutions"];
const CHART_COLORS = ["#163147", "#198C83", "#D39A39", "#DE7655", "#7D90A5", "#4F6D7A", "#B56348", "#9DB8B4"];
const SIDEBAR_COLLAPSED_STORAGE_KEY = "myinvest-sidebar-collapsed";

function readSidebarCollapsedPref() {
  try {
    return sessionStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const collator = new Intl.Collator("he-IL", {
  sensitivity: "base",
  numeric: true,
});

const currencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("he-IL", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("he-IL", {
  style: "percent",
  maximumFractionDigits: 1,
});

const shortDateFormatter = new Intl.DateTimeFormat("he-IL", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const shortMonthFormatter = new Intl.DateTimeFormat("he-IL", {
  month: "short",
  year: "2-digit",
});
const chartDateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
});
const DEFAULT_DOCUMENT_TITLE = "מרכז החסכונות";

function getDefaultChartDisplay() {
  return {
    owner: "value-desc",
    institution: "value-desc",
    topHoldings: "amount-desc",
    growth: "time-asc",
    hero: "value-desc",
  };
}

const state = {
  meta: null,
  records: [],
  filteredRecords: [],
  warnings: [],
  filters: getDefaultFilters(),
  chartDisplay: getDefaultChartDisplay(),
  /** Filter key: owners | institutions | products | tracks — drives hero pie dimension */
  heroBreakdown: "tracks",
  sort: {
    key: "amount",
    direction: "desc",
  },
  charts: {},
  ui: {
    mobileFiltersOpen: false,
    sidebarCollapsed: readSidebarCollapsedPref(),
    collapsedSections: {
      quick: false,
      owners: true,
      institutions: true,
    },
  },
};

const dom = {
  fileInput: document.getElementById("file-input"),
  uploadTrigger: document.getElementById("upload-trigger"),
  downloadTemplate: document.getElementById("download-template"),
  dropZone: document.getElementById("drop-zone"),
  filtersCard: document.getElementById("filters-card"),
  filtersCollapsedRail: document.getElementById("filters-collapsed-rail"),
  filtersExpandedStack: document.getElementById("filters-expanded-stack"),
  sidebarCollapseToggle: document.getElementById("sidebar-collapse-toggle"),
  sidebarExpandButton: document.getElementById("sidebar-expand-button"),
  sidebarRailBadge: document.getElementById("sidebar-rail-badge"),
  filtersActiveSummary: document.getElementById("filters-active-summary"),
  fileName: document.getElementById("file-name"),
  updateDate: document.getElementById("update-date"),
  dashboardShell: document.getElementById("dashboard-shell"),
  mobileFilterBackdrop: document.getElementById("mobile-filter-backdrop"),
  mobileFilterToggle: document.getElementById("mobile-filter-toggle"),
  mobileFilterClose: document.getElementById("mobile-filter-close"),
  mobileFilterCount: document.getElementById("mobile-filter-count"),
  mobileResultsSummary: document.getElementById("mobile-results-summary"),
  jumpToTable: document.getElementById("jump-to-table"),
  errorBanner: document.getElementById("error-banner"),
  warningBanner: document.getElementById("warning-banner"),
  successBanner: document.getElementById("success-banner"),
  clearFilters: document.getElementById("clear-filters"),
  quickSection: document.getElementById("quick-section"),
  quickSectionToggle: document.getElementById("quick-section-toggle"),
  quickSectionPanel: document.getElementById("quick-section-panel"),
  quickSectionCount: document.getElementById("quick-section-count"),
  ownersSection: document.getElementById("owners-section"),
  ownersSectionToggle: document.getElementById("owners-section-toggle"),
  ownersSectionPanel: document.getElementById("owners-section-panel"),
  institutionsSection: document.getElementById("institutions-section"),
  institutionsSectionToggle: document.getElementById("institutions-section-toggle"),
  institutionsSectionPanel: document.getElementById("institutions-section-panel"),
  ownersFilter: document.getElementById("owners-filter"),
  institutionsFilter: document.getElementById("institutions-filter"),
  productsTopFilter: document.getElementById("products-top-filter"),
  tracksTopFilter: document.getElementById("tracks-top-filter"),
  ownersCount: document.getElementById("owners-count"),
  institutionsCount: document.getElementById("institutions-count"),
  productsTopCount: document.getElementById("products-top-count"),
  tracksTopCount: document.getElementById("tracks-top-count"),
  activeFilterChips: document.getElementById("active-filter-chips"),
  kpiScopeBanner: document.getElementById("kpi-scope-banner"),
  kpiScopeText: document.getElementById("kpi-scope-text"),
  presetClearProductTrack: document.getElementById("preset-clear-product-track"),
  tableBody: document.getElementById("table-body"),
  tableSummary: document.getElementById("table-summary"),
  exportCsv: document.getElementById("export-csv"),
  growthChart: document.getElementById("growth-chart"),
  growthPeriodLabel: document.getElementById("growth-period-label"),
  growthCurrentTotal: document.getElementById("growth-current-total"),
  growthCurrentDate: document.getElementById("growth-current-date"),
  growthNetChange: document.getElementById("growth-net-change"),
  growthNetChangeLabel: document.getElementById("growth-net-change-label"),
  growthPercentChange: document.getElementById("growth-percent-change"),
  growthPercentChangeLabel: document.getElementById("growth-percent-change-label"),
  ownerChart: document.getElementById("owner-chart"),
  institutionChart: document.getElementById("institution-chart"),
  topHoldingsChart: document.getElementById("top-holdings-chart"),
  detailsSection: document.getElementById("details-section"),
  kpiTotal: document.getElementById("kpi-total"),
  kpiHoldings: document.getElementById("kpi-holdings"),
  kpiInstitutions: document.getElementById("kpi-institutions"),
  kpiLargest: document.getElementById("kpi-largest"),
  kpiLargestLabel: document.getElementById("kpi-largest-label"),
  kpiOwnerShare: document.getElementById("kpi-owner-share"),
  kpiOwnerShareLabel: document.getElementById("kpi-owner-share-label"),
  chartSortGrowth: document.getElementById("chart-sort-growth"),
  chartSortOwner: document.getElementById("chart-sort-owner"),
  chartSortInstitution: document.getElementById("chart-sort-institution"),
  chartSortTopHoldings: document.getElementById("chart-sort-top-holdings"),
  stripOwnersFilter: document.getElementById("strip-owners-filter"),
  stripInstitutionsFilter: document.getElementById("strip-institutions-filter"),
  stripProductsFilter: document.getElementById("strip-products-filter"),
  stripTracksFilter: document.getElementById("strip-tracks-filter"),
  stripOwnersCount: document.getElementById("strip-owners-count"),
  stripInstitutionsCount: document.getElementById("strip-institutions-count"),
  stripProductsCount: document.getElementById("strip-products-count"),
  stripTracksCount: document.getElementById("strip-tracks-count"),
  heroChart: document.getElementById("hero-chart"),
  heroToolbar: document.getElementById("hero-toolbar"),
  heroResetButton: document.getElementById("hero-reset-button"),
  heroBreakdownTableBody: document.getElementById("hero-breakdown-table-body"),
  heroBreakdownTotal: document.getElementById("hero-breakdown-total"),
};

let lastViewportCompact = null;
let lastViewportPhone = null;

const handleViewportResize = debounce(() => {
  const compact = isCompactChartLayout();
  const phone = isPhoneLayout();
  const tierChanged =
    lastViewportCompact !== null &&
    lastViewportPhone !== null &&
    (lastViewportCompact !== compact || lastViewportPhone !== phone);

  lastViewportCompact = compact;
  lastViewportPhone = phone;

  if (!isMobileLayout()) {
    closeMobileFilters();
  }

  syncSidebarCollapsedUi();
  resizeCharts();
  syncMobileFilterUi();

  if (tierChanged) {
    renderDashboard();
  }
}, 120);

bootstrap();

function bootstrap() {
  dom.uploadTrigger.addEventListener("click", () => dom.fileInput.click());
  dom.dropZone.addEventListener("click", (event) => {
    if (event.target.closest("button, .upload-actions")) {
      return;
    }

    dom.fileInput.click();
  });
  dom.dropZone.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    dom.fileInput.click();
  });
  dom.fileInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];

    if (file) {
      await handleFile(file);
    }

    dom.fileInput.value = "";
  });
  dom.downloadTemplate.addEventListener("click", () => {
    downloadTemplateWorkbook();
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dom.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dom.dropZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    dom.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dom.dropZone.classList.remove("is-dragging");
    });
  });

  dom.dropZone.addEventListener("drop", async (event) => {
    const [file] = event.dataTransfer?.files || [];

    if (file) {
      await handleFile(file);
    }
  });

  dom.clearFilters.addEventListener("click", () => {
    resetFilters();
    renderFilterControls();
    renderDashboard();
  });

  dom.presetClearProductTrack?.addEventListener("click", () => {
    applyPresetClearProductAndTrack();
  });

  dom.tableBody?.addEventListener("click", (event) => {
    const row = event.target.closest("tr[data-owner]");

    if (!row) {
      return;
    }

    applyTableRowAsFilters(row);
  });

  dom.tableBody?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const row = event.target.closest("tr[data-owner]");

    if (!row) {
      return;
    }

    event.preventDefault();
    applyTableRowAsFilters(row);
  });

  FILTER_SECTION_KEYS.forEach((sectionKey) => {
    const toggle = dom[`${sectionKey}SectionToggle`];

    if (!toggle) {
      return;
    }

    toggle.addEventListener("click", () => {
      toggleFilterSection(sectionKey);
    });
  });

  dom.mobileFilterToggle.addEventListener("click", () => {
    if (!state.records.length) {
      return;
    }

    if (state.ui.mobileFiltersOpen) {
      closeMobileFilters();
    } else {
      openMobileFilters();
    }
  });

  dom.mobileFilterClose.addEventListener("click", () => {
    closeMobileFilters();
  });

  dom.sidebarCollapseToggle?.addEventListener("click", () => {
    setSidebarCollapsed(true);
  });

  dom.sidebarExpandButton?.addEventListener("click", () => {
    setSidebarCollapsed(false);
  });

  dom.mobileFilterBackdrop.addEventListener("click", () => {
    closeMobileFilters();
  });

  dom.jumpToTable.addEventListener("click", () => {
    closeMobileFilters();

    if (dom.detailsSection?.scrollIntoView) {
      dom.detailsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });

  dom.exportCsv.addEventListener("click", () => {
    if (!state.filteredRecords.length) {
      return;
    }

    exportFilteredCsv();
  });

  document.querySelectorAll(".sort-button").forEach((button) => {
    button.addEventListener("click", () => setSort(button.dataset.sortKey));
  });

  dom.activeFilterChips.addEventListener("click", (event) => {
    const removeButton = event.target.closest("button[data-remove-filter]");

    if (!removeButton) {
      return;
    }

    removeFilterChip(removeButton.dataset.removeFilter, removeButton.dataset.removeValue);
    renderDashboard();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileFilters();
    }
  });

  window.addEventListener("resize", handleViewportResize);

  if (window.visualViewport?.addEventListener) {
    window.visualViewport.addEventListener("resize", handleViewportResize);
  }

  renderFilterControls();
  renderDashboard();
  syncSidebarCollapsedUi();
  syncMobileFilterUi();
  wireChartSortControls();
  wireHeroToolbar();

  lastViewportCompact = isCompactChartLayout();
  lastViewportPhone = isPhoneLayout();

  const heroBreakdownTable = document.getElementById("hero-breakdown-table");

  if (heroBreakdownTable && heroBreakdownTable.dataset.heroTableWired !== "true") {
    heroBreakdownTable.dataset.heroTableWired = "true";
    heroBreakdownTable.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-hero-value]");

      if (!row) {
        return;
      }

      playHeroTableRowTapFeedback(row);
    });
  }
}

function wireHeroToolbar() {
  if (!dom.heroToolbar || dom.heroToolbar.dataset.heroToolbarWired === "true") {
    return;
  }

  dom.heroToolbar.dataset.heroToolbarWired = "true";

  dom.heroToolbar.addEventListener("click", (event) => {
    const breakdownBtn = event.target.closest("[data-hero-breakdown]");

    if (breakdownBtn?.dataset.heroBreakdown) {
      const next = breakdownBtn.dataset.heroBreakdown;

      if (state.heroBreakdown !== next) {
        state.heroBreakdown = next;
        renderDashboard();
      }

      return;
    }

    const sortBtn = event.target.closest("[data-hero-sort]");

    if (sortBtn?.dataset.heroSort) {
      const next = sortBtn.dataset.heroSort;

      if (state.chartDisplay.hero !== next) {
        state.chartDisplay.hero = next;
        refreshChartsOnly();
      }
    }
  });

  if (dom.heroResetButton && dom.heroResetButton.dataset.heroResetWired !== "true") {
    dom.heroResetButton.dataset.heroResetWired = "true";
    dom.heroResetButton.addEventListener("click", () => {
      resetHeroExplorationView();
    });
  }
}

function wireChartSortControls() {
  const bindings = [
    [dom.chartSortGrowth, "growth"],
    [dom.chartSortOwner, "owner"],
    [dom.chartSortInstitution, "institution"],
    [dom.chartSortTopHoldings, "topHoldings"],
  ];

  bindings.forEach(([element, chartKey]) => {
    if (!element || element.dataset.chartSortWired === "true") {
      return;
    }

    element.dataset.chartSortWired = "true";
    element.addEventListener("change", (event) => {
      const value = event.target.value;

      if (state.chartDisplay[chartKey] === value) {
        return;
      }

      state.chartDisplay[chartKey] = value;
      refreshChartsOnly();
    });
  });
}

function refreshChartsOnly() {
  if (!state.records.length) {
    return;
  }

  const filteredRecords = applyFilters(state.records, state.filters);
  const viewModel = deriveViewModel(filteredRecords);
  renderCharts(viewModel);
  syncHeroToolbarButtons();
}

function syncChartSortControls() {
  if (dom.chartSortGrowth) {
    dom.chartSortGrowth.value = state.chartDisplay.growth;
    dom.chartSortGrowth.disabled = !state.records.length;
  }

  if (dom.chartSortOwner) {
    dom.chartSortOwner.value = state.chartDisplay.owner;
    dom.chartSortOwner.disabled = !state.records.length;
  }

  if (dom.chartSortInstitution) {
    dom.chartSortInstitution.value = state.chartDisplay.institution;
    dom.chartSortInstitution.disabled = !state.records.length;
  }

  if (dom.chartSortTopHoldings) {
    dom.chartSortTopHoldings.value = state.chartDisplay.topHoldings;
    dom.chartSortTopHoldings.disabled = !state.records.length;
  }

  syncHeroToolbarButtons();
}

function syncHeroToolbarButtons() {
  const disabled = !state.records.length;

  document.querySelectorAll("[data-hero-breakdown]").forEach((button) => {
    button.disabled = disabled;
    button.setAttribute("aria-pressed", button.dataset.heroBreakdown === state.heroBreakdown ? "true" : "false");
  });

  document.querySelectorAll("[data-hero-sort]").forEach((button) => {
    button.disabled = disabled;
    button.setAttribute("aria-pressed", button.dataset.heroSort === state.chartDisplay.hero ? "true" : "false");
  });

  if (dom.heroResetButton) {
    dom.heroResetButton.disabled = disabled;
  }
}

function resetHeroExplorationView() {
  if (!state.records.length) {
    return;
  }

  state.filters.products = [];
  state.filters.tracks = [];
  state.heroBreakdown = "tracks";
  state.chartDisplay.hero = getDefaultChartDisplay().hero;
  renderFilterControls();
  renderDashboard();
}

async function handleFile(file) {
  try {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      throw new Error("ניתן להעלות רק קובצי XLSX.");
    }

    if (!window.XLSX || !window.echarts) {
      throw new Error("חסרות ספריות הדשבורד המקומיות. רעננו את הדף ונסו שוב.");
    }

    clearBanner(dom.errorBanner);
    setBanner(dom.successBanner, "קורא את הקובץ המקומי ומכין את הדשבורד...", "success");

    const arrayBuffer = await file.arrayBuffer();
    const parsed = parseWorkbook(arrayBuffer, file.name);

    state.meta = parsed.meta;
    state.records = parsed.records;
    state.warnings = parsed.warnings;
    state.sort = { key: "amount", direction: "desc" };
    state.chartDisplay = getDefaultChartDisplay();
    state.heroBreakdown = "tracks";
    resetFilters();
    closeMobileFilters();

    renderFileMeta();
    renderFilterControls();
    renderDashboard();

    if (isDesktopTwoColumnLayout()) {
      setSidebarCollapsed(true);
    }

    setBanner(
      dom.successBanner,
      `נטענו ${numberFormatter.format(state.records.length)} רשומות מ־sheet1. הנתונים נשארים בדפדפן בלבד.`,
      "success"
    );

    if (state.warnings.length) {
      setBanner(dom.warningBanner, state.warnings.join(" | "), "warning");
    } else {
      clearBanner(dom.warningBanner);
    }
  } catch (error) {
    state.meta = null;
    state.records = [];
    state.filteredRecords = [];
    state.warnings = [];
    state.chartDisplay = getDefaultChartDisplay();
    state.heroBreakdown = "tracks";
    resetFilters();
    closeMobileFilters();
    renderFileMeta();
    renderFilterControls();
    renderDashboard();
    setBanner(dom.errorBanner, error.message || "אירעה שגיאה בטעינת הקובץ.", "error");
    clearBanner(dom.warningBanner);
    setBanner(dom.successBanner, "הדשבורד מוכן להעלאה מקומית חדשה.", "success");
  }
}

function parseWorkbook(fileBuffer, sourceFileName) {
  const workbook = XLSX.read(fileBuffer, {
    type: "array",
  });

  const worksheet = workbook.Sheets.sheet1;

  if (!worksheet) {
    throw new Error("לא נמצא גיליון בשם sheet1 באותיות קטנות.");
  }

  validateHeaders(worksheet);

  const updateDate = normalizeDateValue(readSheetValue(worksheet, "P4"));
  const declaredTotal = toNumber(readSheetValue(worksheet, "P5"));
  const growth = parseGrowthMeta(worksheet, updateDate, declaredTotal);
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const warnings = [];
  const records = [];

  for (let rowIndex = 4; rowIndex <= range.e.r; rowIndex += 1) {
    const values = [];

    for (let columnIndex = 0; columnIndex < 5; columnIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      values.push(readSheetValue(worksheet, address));
    }

    if (values.every(isBlank)) {
      continue;
    }

    const [product, track, rawAmount, institution, owner] = values;
    const rawAmountNum = toNumber(rawAmount);

    if (!product || !track || !institution || !owner || !Number.isFinite(rawAmountNum)) {
      warnings.push(`שורה ${rowIndex + 1} דולגה כי היא לא תקינה בפורמט הנתונים.`);
      continue;
    }

    const amount = sanitizeAmount(rawAmountNum);

    records.push({
      id: `row-${rowIndex + 1}`,
      product: String(product).trim(),
      track: String(track).trim(),
      amount,
      institution: String(institution).trim(),
      owner: String(owner).trim(),
    });
  }

  if (!records.length) {
    throw new Error("לא נמצאו רשומות נתונים תקינות בגיליון sheet1.");
  }

  const computedTotal = records.reduce((sum, record) => sum + record.amount, 0);

  if (Number.isFinite(declaredTotal) && Math.abs(declaredTotal - computedTotal) > 0.1) {
    warnings.push(
      `הסכום המחושב (${formatCurrency(computedTotal)}) שונה מהסכום המדווח (${formatCurrency(declaredTotal)}).`
    );
  }

  return {
    meta: {
      sheetName: "sheet1",
      sourceFileName,
      updateDate,
      declaredTotal,
      computedTotal,
      growth,
    },
    records,
    warnings,
  };
}

function parseGrowthMeta(worksheet, updateDate, declaredTotal) {
  const previousTotalCell = toNumber(readSheetValue(worksheet, "P7"));
  const percentChangeCell = toNumber(readSheetValue(worksheet, "P8"));
  const netChangeCell = toNumber(readSheetValue(worksheet, "P9"));
  const history = [];
  let emptyStreak = 0;

  for (let rowIndex = 13; rowIndex < 80; rowIndex += 1) {
    const dateValue = normalizeDateValue(readSheetValue(worksheet, `O${rowIndex + 1}`));
    const totalValue = toNumber(readSheetValue(worksheet, `P${rowIndex + 1}`));

    if (!dateValue && !Number.isFinite(totalValue)) {
      emptyStreak += 1;

      if (emptyStreak >= 3 && history.length) {
        break;
      }

      continue;
    }

    emptyStreak = 0;

    if (!dateValue || !Number.isFinite(totalValue)) {
      continue;
    }

    history.push({
      date: dateValue,
      total: totalValue,
      source: "history",
    });
  }

  if (updateDate && Number.isFinite(declaredTotal)) {
    const lastPoint = history[history.length - 1];

    if (!lastPoint || lastPoint.date !== updateDate || Math.abs(lastPoint.total - declaredTotal) > 0.1) {
      history.push({
        date: updateDate,
        total: declaredTotal,
        source: "current",
      });
    }
  }

  history.sort((left, right) => left.date.localeCompare(right.date));

  const distinctHistory = history.filter((point, index) => {
    if (index === 0) {
      return true;
    }

    const previous = history[index - 1];
    return previous.date !== point.date || Math.abs(previous.total - point.total) > 0.1;
  });

  const previousTotal = Number.isFinite(previousTotalCell)
    ? previousTotalCell
    : distinctHistory.length > 1
      ? distinctHistory[distinctHistory.length - 2].total
      : NaN;
  const currentTotal = Number.isFinite(declaredTotal)
    ? declaredTotal
    : distinctHistory.length
      ? distinctHistory[distinctHistory.length - 1].total
      : NaN;
  const netChange = Number.isFinite(netChangeCell)
    ? netChangeCell
    : Number.isFinite(previousTotal) && Number.isFinite(currentTotal)
      ? currentTotal - previousTotal
      : NaN;
  const percentChange = Number.isFinite(percentChangeCell)
    ? percentChangeCell
    : Number.isFinite(previousTotal) && previousTotal !== 0 && Number.isFinite(currentTotal)
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : NaN;

  return {
    history: distinctHistory,
    currentDate: updateDate,
    currentTotal,
    previousTotal,
    netChange,
    percentChange,
  };
}

function validateHeaders(worksheet) {
  const actualHeaders = [];

  for (let columnIndex = 0; columnIndex < EXPECTED_HEADERS.length; columnIndex += 1) {
    const address = XLSX.utils.encode_cell({ r: 3, c: columnIndex });
    actualHeaders.push(String(readSheetValue(worksheet, address) || "").trim());
  }

  const matches = EXPECTED_HEADERS.every((expected, index) => expected === actualHeaders[index]);

  if (!matches) {
    throw new Error(
      `כותרות שורה 4 אינן תואמות. צפוי: ${EXPECTED_HEADERS.join(" | ")}. בפועל: ${actualHeaders.join(" | ")}.`
    );
  }
}

function readSheetValue(worksheet, address) {
  const cell = worksheet[address];

  if (!cell) {
    return null;
  }

  if (cell.v !== undefined && cell.v !== null) {
    return cell.v;
  }

  if (cell.w !== undefined) {
    return cell.w;
  }

  return null;
}

function normalizeDateValue(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return null;
    }

    return formatLocalDateParts(parsed.y, parsed.m, parsed.d);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsedDate = new Date(trimmed);

    if (!Number.isNaN(parsedDate.getTime())) {
      return formatLocalDateParts(
        parsedDate.getFullYear(),
        parsedDate.getMonth() + 1,
        parsedDate.getDate()
      );
    }
  }

  return null;
}

function renderDashboard() {
  const hasData = Boolean(state.records.length);

  dom.dashboardShell.classList.toggle("is-disabled", !hasData);
  dom.clearFilters.disabled = !hasData || !hasActiveFilters();
  dom.jumpToTable.disabled = !hasData;
  dom.mobileFilterToggle.disabled = !hasData;

  if (!hasData) {
    state.filteredRecords = [];
    dom.exportCsv.disabled = true;
    dom.tableSummary.textContent = "0 רשומות מוצגות";
    dom.kpiTotal.textContent = formatCurrency(0);
    dom.kpiHoldings.textContent = "0";
    dom.kpiInstitutions.textContent = "0";
    dom.kpiLargest.textContent = formatCurrency(0);
    dom.kpiLargestLabel.textContent = "מעלים קובץ כדי להתחיל";
    dom.kpiOwnerShare.textContent = "0%";
    dom.kpiOwnerShareLabel.textContent = "ממתין לטעינה";
    dom.kpiScopeBanner?.classList.add("hidden");
    dom.kpiScopeBanner?.setAttribute("aria-hidden", "true");
    renderGrowthStory(null);
    renderTable([]);
    renderFilterChips();
    renderHeroSummaryEmpty();
    renderEmptyCharts();
    updateSortButtons();
    syncChartSortControls();
    updateMobileUtilityBar(0);
    syncMobileFilterUi();
    updatePresetButtons();
    return;
  }

  const portfolioTotals = derivePortfolioTotals(state.records);
  const filteredRecords = applyFilters(state.records, state.filters);
  const sortedRecords = sortRecords(filteredRecords, state.sort);
  const viewModel = deriveViewModel(filteredRecords);

  state.filteredRecords = sortedRecords;

  renderScopeBanner(viewModel, portfolioTotals);
  renderKpis(viewModel);
  renderGrowthStory(state.meta?.growth || null);
  renderFilterChips();
  renderTable(sortedRecords);
  renderCharts(viewModel);
  updateSortButtons();
  syncChartSortControls();

  dom.exportCsv.disabled = !sortedRecords.length;
  dom.tableSummary.textContent = `${numberFormatter.format(sortedRecords.length)} רשומות מוצגות מתוך ${numberFormatter.format(state.records.length)}`;
  updateMobileUtilityBar(sortedRecords.length);
  syncMobileFilterUi();
  updatePresetButtons();
}

function renderFileMeta() {
  if (!state.meta) {
    dom.fileName.textContent = "עדיין לא נבחר קובץ";
    dom.updateDate.textContent = "ממתין לטעינה";
    syncDocumentTitle();
    return;
  }

  dom.fileName.textContent = state.meta.sourceFileName || "קובץ XLSX מקומי";
  dom.updateDate.textContent = state.meta.updateDate ? formatDisplayDate(state.meta.updateDate) : "לא זוהה";
  syncDocumentTitle();
}

function renderFilterControls() {
  const options = {
    owners: getUniqueValues(state.records, "owner"),
    institutions: getUniqueValues(state.records, "institution"),
    products: getUniqueValues(state.records, "product"),
    tracks: getUniqueValues(state.records, "track"),
  };

  const ownersMeta = renderFilterPills("owners", options.owners, dom.ownersFilter, dom.ownersCount);
  const institutionsMeta = renderFilterPills(
    "institutions",
    options.institutions,
    dom.institutionsFilter,
    dom.institutionsCount
  );
  const productsMeta = renderQuickFilterRail("products", options.products, dom.productsTopFilter, dom.productsTopCount);
  const tracksMeta = renderQuickFilterRail("tracks", options.tracks, dom.tracksTopFilter, dom.tracksTopCount);

  if (dom.stripOwnersFilter && dom.stripOwnersCount) {
    renderFilterPills("owners", options.owners, dom.stripOwnersFilter, dom.stripOwnersCount);
  }

  if (dom.stripInstitutionsFilter && dom.stripInstitutionsCount) {
    renderFilterPills("institutions", options.institutions, dom.stripInstitutionsFilter, dom.stripInstitutionsCount);
  }

  if (dom.stripProductsFilter && dom.stripProductsCount) {
    renderFilterPills("products", options.products, dom.stripProductsFilter, dom.stripProductsCount);
  }

  if (dom.stripTracksFilter && dom.stripTracksCount) {
    renderFilterPills("tracks", options.tracks, dom.stripTracksFilter, dom.stripTracksCount);
  }

  renderFilterSectionSummary({
    owners: ownersMeta,
    institutions: institutionsMeta,
    products: productsMeta,
    tracks: tracksMeta,
  });
  syncFilterSectionState();
  syncMobileFilterUi();
}

function renderFilterPills(filterKey, options, container, counterElement) {
  if (!container || !counterElement) {
    return {
      selectedCount: 0,
      totalCount: 0,
    };
  }

  container.textContent = "";
  const selectedCount = getSelectedOptionCount(filterKey, options);
  setGroupCount(counterElement, selectedCount, options.length);

  if (!options.length) {
    const empty = document.createElement("span");
    empty.className = "group-meta";
    empty.textContent = "אין נתונים";
    container.appendChild(empty);
    return {
      selectedCount: 0,
      totalCount: 0,
    };
  }

  const fragment = document.createDocumentFragment();
  const selectedValues = state.filters[filterKey];

  options.forEach((optionValue) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-pill";
    button.dataset.filterKey = filterKey;
    button.dataset.filterValue = optionValue;
    button.setAttribute("aria-pressed", selectedValues.includes(optionValue) ? "true" : "false");

    if (selectedValues.includes(optionValue)) {
      button.classList.add("is-selected");
    }

    button.addEventListener("click", () => {
      toggleArrayFilter(filterKey, optionValue);
      renderFilterControls();
      renderDashboard();
    });

    const textNode = document.createElement("span");
    textNode.textContent = optionValue;
    button.appendChild(textNode);

    const detailNode = document.createElement("small");
    detailNode.textContent = `${numberFormatter.format(countFacetedRecords(filterKey, optionValue))}`;
    button.appendChild(detailNode);

    fragment.appendChild(button);
  });

  container.appendChild(fragment);

  return {
    selectedCount,
    totalCount: options.length,
  };
}

function renderQuickFilterRail(filterKey, options, container, counterElement) {
  if (!container || !counterElement) {
    return {
      selectedCount: 0,
      totalCount: 0,
    };
  }

  container.textContent = "";
  const selectedCount = getSelectedOptionCount(filterKey, options);
  setGroupCount(counterElement, selectedCount, options.length);

  if (!options.length) {
    const empty = document.createElement("span");
    empty.className = "group-meta";
    empty.textContent = "אין נתונים";
    container.appendChild(empty);
    return {
      selectedCount: 0,
      totalCount: 0,
    };
  }

  const fragment = document.createDocumentFragment();
  const selectedValues = state.filters[filterKey];

  options.forEach((optionValue) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-filter-chip";
    button.dataset.filterKey = filterKey;
    button.dataset.filterValue = optionValue;
    button.setAttribute("aria-pressed", selectedValues.includes(optionValue) ? "true" : "false");

    if (selectedValues.includes(optionValue)) {
      button.classList.add("is-selected");
    }

    button.addEventListener("click", () => {
      toggleArrayFilter(filterKey, optionValue);
      renderFilterControls();
      renderDashboard();
    });

    const nameNode = document.createElement("span");
    nameNode.className = "quick-filter-chip-name";
    nameNode.textContent = optionValue;
    button.appendChild(nameNode);

    const countNode = document.createElement("span");
    countNode.className = "quick-filter-chip-count";
    countNode.textContent = `${numberFormatter.format(countFacetedRecords(filterKey, optionValue))}`;
    button.appendChild(countNode);

    fragment.appendChild(button);
  });

  container.appendChild(fragment);

  return {
    selectedCount,
    totalCount: options.length,
  };
}

function renderFilterChips() {
  dom.activeFilterChips.textContent = "";
  const chips = buildActiveFilterChips();

  if (!chips.length) {
    const emptyChip = document.createElement("span");
    emptyChip.className = "group-meta";
    emptyChip.textContent = "אין מסננים פעילים";
    dom.activeFilterChips.appendChild(emptyChip);
    return;
  }

  const fragment = document.createDocumentFragment();

  chips.forEach((chipConfig) => {
    const chip = document.createElement("span");
    chip.className = "chip";

    const text = document.createElement("span");
    text.textContent = chipConfig.label;
    chip.appendChild(text);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.removeFilter = chipConfig.key;
    remove.dataset.removeValue = chipConfig.value ?? "";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `הסרת ${chipConfig.label}`);
    chip.appendChild(remove);

    fragment.appendChild(chip);
  });

  dom.activeFilterChips.appendChild(fragment);
}

function buildActiveFilterChips() {
  const chips = [];

  Object.keys(FILTER_KEYS).forEach((filterKey) => {
    state.filters[filterKey].forEach((value) => {
      chips.push({
        key: filterKey,
        value,
        label: `${FILTER_LABELS[filterKey]}: ${value}`,
      });
    });
  });

  return chips;
}

function derivePortfolioTotals(records) {
  const totalAmount = records.reduce((sum, record) => sum + sanitizeAmount(record.amount), 0);

  return {
    totalAmount,
    holdingsCount: records.length,
  };
}

function renderScopeBanner(filteredViewModel, portfolioTotals) {
  if (!dom.kpiScopeBanner || !dom.kpiScopeText) {
    return;
  }

  if (!hasActiveFilters()) {
    dom.kpiScopeBanner.classList.add("hidden");
    dom.kpiScopeBanner.setAttribute("aria-hidden", "true");
    return;
  }

  dom.kpiScopeBanner.classList.remove("hidden");
  dom.kpiScopeBanner.setAttribute("aria-hidden", "false");

  const portfolioTotal = portfolioTotals.totalAmount;
  const shareOfPortfolio =
    portfolioTotal > 0 ? percentFormatter.format(filteredViewModel.totalAmount / portfolioTotal) : "0%";

  dom.kpiScopeText.textContent = `מציגים ${formatCurrency(filteredViewModel.totalAmount)} מתוך ${formatCurrency(portfolioTotal)} בשווי · ${numberFormatter.format(filteredViewModel.holdingsCount)} מתוך ${numberFormatter.format(portfolioTotals.holdingsCount)} רשומות (${shareOfPortfolio} מהפורטפוליו)`;
}

function renderKpis(viewModel) {
  dom.kpiTotal.textContent = formatCurrency(viewModel.totalAmount);
  dom.kpiHoldings.textContent = numberFormatter.format(viewModel.holdingsCount);
  dom.kpiInstitutions.textContent = numberFormatter.format(viewModel.institutionsCount);
  dom.kpiLargest.textContent = formatCurrency(viewModel.largestHolding.amount);
  dom.kpiLargestLabel.textContent = viewModel.largestHolding.label;
  dom.kpiOwnerShare.textContent = percentFormatter.format(viewModel.biggestOwnerShare.share);
  dom.kpiOwnerShareLabel.textContent = viewModel.biggestOwnerShare.label;
}

function updatePresetButtons() {
  const enabled = Boolean(state.records.length);

  if (dom.presetClearProductTrack) {
    dom.presetClearProductTrack.disabled = !enabled;
  }
}

function applyPresetClearProductAndTrack() {
  state.filters.products = [];
  state.filters.tracks = [];
  renderFilterControls();
  renderDashboard();
}

function renderCharts(viewModel) {
  ensureCharts();
  renderGrowthChart(state.meta?.growth || null);
  const filteredTotal = viewModel.totalAmount;
  renderOwnerChart(viewModel.ownerBreakdown);
  renderInstitutionChart(viewModel.institutionBreakdown, filteredTotal);
  renderTopHoldingsChart(viewModel.topHoldings, filteredTotal);
  renderHeroPie(viewModel);
  renderHeroSummaryTable(viewModel);
  resizeCharts();
}

function renderEmptyCharts() {
  ensureCharts();
  const emptyOption = {
    textStyle: {
      fontFamily: "Avenir Next, Noto Sans Hebrew, Segoe UI, sans-serif",
      color: "#4A6171",
    },
    title: {
      left: "center",
      top: "middle",
      text: "מעלים קובץ כדי לראות ויזואליזציה",
      textStyle: {
        fontSize: 15,
        fontWeight: 600,
        color: "#4A6171",
      },
    },
  };

  const heroTitleTop = isCompactChartLayout() ? "54%" : "middle";
  const heroEmptyOption = {
    textStyle: emptyOption.textStyle,
    title: {
      ...emptyOption.title,
      top: heroTitleTop,
    },
  };

  Object.entries(state.charts).forEach(([key, chart]) => {
    if (!chart) {
      return;
    }

    chart.clear();
    chart.setOption(key === "hero" ? heroEmptyOption : emptyOption, true);
  });
}

function ensureCharts() {
  if (!state.charts.owner) {
    state.charts.growth = echarts.init(dom.growthChart);
    state.charts.owner = echarts.init(dom.ownerChart);
    state.charts.institution = echarts.init(dom.institutionChart);
    state.charts.topHoldings = echarts.init(dom.topHoldingsChart);
    if (dom.heroChart) {
      state.charts.hero = echarts.init(dom.heroChart);
    }

    state.charts.owner.on("click", (params) => {
      if (params?.data?.filterValue) {
        toggleArrayFilter("owners", params.data.filterValue);
        renderFilterControls();
        renderDashboard();
      }
    });

    state.charts.institution.on("click", (params) => {
      if (params?.data?.filterValue) {
        toggleArrayFilter("institutions", params.data.filterValue);
        renderFilterControls();
        renderDashboard();
      }
    });

    state.charts.topHoldings.on("click", (params) => {
      const record = params?.data?.record;

      if (!record) {
        return;
      }

      ensureValueSelected("owners", record.owner);
      ensureValueSelected("institutions", record.institution);
      ensureValueSelected("products", record.product);
      ensureValueSelected("tracks", record.track);
      renderFilterControls();
      renderDashboard();
    });

  }
}

function renderGrowthStory(growth) {
  if (!growth || !growth.history.length) {
    dom.growthPeriodLabel.textContent = "מעלים קובץ כדי לראות את קו הצמיחה לאורך הזמן.";
    dom.growthCurrentTotal.textContent = formatCurrency(0);
    dom.growthCurrentDate.textContent = "ממתין לטעינה";
    dom.growthNetChange.textContent = formatCurrency(0);
    dom.growthNetChangeLabel.textContent = "לעומת הנתון הקודם";
    dom.growthPercentChange.textContent = "0%";
    dom.growthPercentChangeLabel.textContent = "שינוי מצטבר בין התקופות";
    return;
  }

  const firstPoint = growth.history[0];
  const lastPoint = growth.history[growth.history.length - 1];
  const comparisonDate = Number.isFinite(growth.previousTotal) && growth.history.length > 1
    ? growth.history[growth.history.length - 2]?.date
    : null;

  dom.growthPeriodLabel.textContent = `מהלך צמיחה מ-${formatMonthLabel(firstPoint.date)} עד ${formatMonthLabel(lastPoint.date)}.`;
  dom.growthCurrentTotal.textContent = formatCurrency(growth.currentTotal);
  dom.growthCurrentDate.textContent = growth.currentDate ? `נכון ל־${formatDisplayDate(growth.currentDate)}` : "מעדכון אחרון";
  dom.growthNetChange.textContent = formatSignedCurrency(growth.netChange);
  dom.growthNetChangeLabel.textContent = comparisonDate
    ? `לעומת ${formatMonthLabel(comparisonDate)}`
    : "לעומת הנתון הקודם";
  dom.growthPercentChange.textContent = formatGrowthPercent(growth.percentChange);
  dom.growthPercentChangeLabel.textContent = Number.isFinite(growth.previousTotal)
    ? `מול בסיס של ${formatCurrency(growth.previousTotal)}`
    : "שינוי מצטבר בין התקופות";
}

function sortBreakdownItems(items, mode) {
  const copy = [...items];

  if (mode === "value-desc") {
    copy.sort((a, b) => b.value - a.value || collator.compare(a.name, b.name));
  } else if (mode === "value-asc") {
    copy.sort((a, b) => a.value - b.value || collator.compare(a.name, b.name));
  } else if (mode === "name-asc") {
    copy.sort((a, b) => collator.compare(a.name, b.name));
  } else {
    copy.sort((a, b) => b.value - a.value || collator.compare(a.name, b.name));
  }

  return copy;
}

function getHeroBreakdownItems(viewModel, heroBreakdown) {
  switch (heroBreakdown) {
    case "owners":
      return viewModel.ownerBreakdown;
    case "institutions":
      return viewModel.institutionBreakdown;
    case "products":
      return viewModel.productBreakdown;
    case "tracks":
      return viewModel.trackBreakdown;
    default:
      return viewModel.trackBreakdown;
  }
}

function getSortedHeroItems(viewModel) {
  const raw = getHeroBreakdownItems(viewModel, state.heroBreakdown);
  return sortBreakdownItems(raw, state.chartDisplay.hero);
}

function orderTopHoldingsDisplay(topHoldings, mode) {
  const items = [...topHoldings];

  if (mode === "amount-desc") {
    items.sort((a, b) => b.record.amount - a.record.amount);
  } else if (mode === "amount-asc") {
    items.sort((a, b) => a.record.amount - b.record.amount);
  } else if (mode === "label-asc") {
    items.sort((a, b) => collator.compare(a.axisLabel, b.axisLabel));
  } else {
    items.sort((a, b) => b.record.amount - a.record.amount);
  }

  return items;
}

/** Break long y-axis category labels to two lines; prefers a " / " segment boundary */
function formatHorizontalBarCategoryLabel(value, maxCharsPerLine) {
  const s = String(value ?? "").trim();
  if (!s) {
    return "";
  }
  const sep = " / ";
  const slashIdx = s.indexOf(sep);
  if (slashIdx > 0 && slashIdx < s.length - sep.length) {
    return `${s.slice(0, slashIdx)}\n${s.slice(slashIdx + sep.length)}`;
  }
  const limit = Math.max(8, maxCharsPerLine || 16);
  if (s.length <= limit) {
    return s;
  }
  return `${s.slice(0, limit)}\n${s.slice(limit)}`;
}

function renderGrowthChart(growth) {
  const compactLayout = isCompactChartLayout();
  const phoneLayout = isPhoneLayout();
  const history = growth?.history || [];
  const mode = state.chartDisplay.growth;
  const seriesData =
    mode === "time-desc" && history.length ? [...history].reverse() : [...history];
  const chronologicalLast = history.length ? history[history.length - 1] : null;
  let highlightIndex = -1;

  if (chronologicalLast && seriesData.length) {
    highlightIndex = seriesData.findIndex(
      (p) => p.date === chronologicalLast.date && Math.abs(p.total - chronologicalLast.total) <= 0.1
    );

    if (highlightIndex < 0) {
      highlightIndex = seriesData.length - 1;
    }
  }

  const dateTickCount = seriesData.length;
  const rotateCategoryLabels = dateTickCount > 6 ? (compactLayout ? 42 : 30) : 0;
  const growthGridBottom =
    (compactLayout ? 30 : 42) + (rotateCategoryLabels ? (compactLayout ? 26 : 22) : dateTickCount > 12 ? 14 : 0);

  state.charts.growth.setOption(
    {
      animationDuration: 650,
      color: ["#198C83"],
      grid: {
        top: 24,
        right: compactLayout ? 10 : 18,
        bottom: growthGridBottom,
        left: compactLayout ? (phoneLayout ? 48 : 54) : 70,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: {
            color: "rgba(25, 140, 131, 0.28)",
            width: 2,
          },
        },
        formatter: (params) => {
          const item = params[0];
          const point = item?.data?.point;

          if (!point) {
            return "";
          }

          const lines = [
            `${formatDisplayDate(point.date)}`,
            `${formatCurrency(point.total)}`,
          ];

          if (Number.isFinite(point.change)) {
            lines.push(`שינוי: ${formatSignedCurrency(point.change)}`);
          }

          return lines.join("<br>");
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: seriesData.map((point) => formatChartAxisDate(point.date)),
        axisTick: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: "rgba(16, 37, 55, 0.14)",
          },
        },
        axisLabel: {
          color: "#4A6171",
          fontSize: compactLayout ? 10 : 11,
          rotate: rotateCategoryLabels,
          hideOverlap: true,
          margin: 10,
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: { color: "rgba(15, 36, 52, 0.08)" },
        },
        axisLabel: {
          color: "#4A6171",
          formatter: (value) => formatCompactCurrency(value),
          hideOverlap: true,
          margin: 8,
        },
      },
      series: [
        {
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: compactLayout ? 8 : 10,
          lineStyle: {
            width: 4,
            shadowBlur: 14,
            shadowColor: "rgba(25, 140, 131, 0.18)",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(25, 140, 131, 0.34)" },
              { offset: 1, color: "rgba(25, 140, 131, 0.03)" },
            ]),
          },
          emphasis: {
            focus: "series",
          },
          label: {
            show: !compactLayout && seriesData.length > 0 && highlightIndex >= 0,
            position: "top",
            color: "#163147",
            fontWeight: 700,
            formatter: (params) => (params.dataIndex === highlightIndex ? formatCurrency(params.value) : ""),
          },
          data: seriesData.map((point, index) => {
            const prev = index > 0 ? seriesData[index - 1] : null;
            const change = prev ? point.total - prev.total : NaN;

            return {
              value: point.total,
              point: {
                ...point,
                change,
              },
              itemStyle: {
                color: index === highlightIndex ? "#D39A39" : "#198C83",
                borderColor: "#ffffff",
                borderWidth: 2,
              },
            };
          }),
          markPoint:
            seriesData.length && chronologicalLast
              ? {
                  symbol: "roundRect",
                  symbolSize: compactLayout ? (phoneLayout ? [88, 32] : [92, 34]) : [118, 38],
                  itemStyle: {
                    color: "#163147",
                    borderRadius: 18,
                    shadowBlur: 16,
                    shadowColor: "rgba(16, 39, 57, 0.2)",
                  },
                  label: {
                    color: "#F9F6EF",
                    fontWeight: 800,
                    formatter: `כעת ${formatCurrency(chronologicalLast.total)}`,
                  },
                  data: [
                    {
                      coord: [formatChartAxisDate(chronologicalLast.date), chronologicalLast.total],
                      value: chronologicalLast.total,
                    },
                  ],
                }
              : undefined,
        },
      ],
      graphic: !seriesData.length
        ? [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: {
                text: "לא נמצאו נתוני צמיחה בקובץ",
                fill: "#4A6171",
                fontSize: 15,
                fontWeight: 600,
              },
            },
          ]
        : [],
    },
    true
  );
}

function renderOwnerChart(ownerBreakdown) {
  const ordered = sortBreakdownItems(ownerBreakdown, state.chartDisplay.owner);
  const hasData = ordered.length > 0;
  const compactLayout = isCompactChartLayout();
  const phoneLayout = isPhoneLayout();

  state.charts.owner.setOption(
    {
      animationDuration: 500,
      color: CHART_COLORS,
      tooltip: {
        trigger: "item",
        formatter: ({ name, value, percent }) =>
          `${name}<br>${formatCurrency(value)}<br>${percentFormatter.format(percent / 100)} מהשווי בתצוגה המסוננת`,
      },
      legend: {
        bottom: 0,
        type: "scroll",
        icon: "circle",
        textStyle: {
          color: "#4A6171",
          fontSize: compactLayout ? (phoneLayout ? 10 : 11) : 12,
        },
      },
      graphic: !hasData
        ? [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: {
                text: "אין נתונים לאחר הסינון",
                fill: "#4A6171",
                fontSize: 15,
                fontWeight: 600,
              },
            },
          ]
        : [],
      series: [
        {
          type: "pie",
          radius: compactLayout ? (phoneLayout ? ["42%", "64%"] : ["44%", "68%"]) : ["48%", "72%"],
          center: ["50%", compactLayout ? (phoneLayout ? "40%" : "42%") : "44%"],
          avoidLabelOverlap: !compactLayout,
          label: {
            show: !compactLayout,
            formatter: ({ name, percent }) => `${name}\n${percentFormatter.format(percent / 100)}`,
            color: "#163147",
          },
          data: ordered.map((item) => ({
            name: item.name,
            value: item.value,
            filterValue: item.name,
          })),
        },
      ],
    },
    true
  );
}

function renderHeroPie(viewModel) {
  if (!state.charts.hero) {
    return;
  }

  const ordered = getSortedHeroItems(viewModel);
  const hasData = ordered.length > 0;
  const compactLayout = isCompactChartLayout();
  const phoneLayout = isPhoneLayout();
  const dimLabel = FILTER_LABELS[state.heroBreakdown] || "";

  state.charts.hero.setOption(
    {
      animationDuration: 500,
      color: CHART_COLORS,
      tooltip: {
        trigger: "item",
        triggerOn: compactLayout ? "mousemove|click" : "mousemove",
        confine: true,
        formatter: ({ name, percent }) =>
          `${name}<br>${percentFormatter.format(percent / 100)}`,
      },
      title: {
        text: dimLabel ? `פיזור לפי ${dimLabel}` : "",
        left: "center",
        top: compactLayout ? (phoneLayout ? 4 : 6) : 8,
        textStyle: {
          color: "#163147",
          fontSize: compactLayout ? (phoneLayout ? 13 : 14) : 15,
          fontWeight: 700,
        },
      },
      legend: {
        bottom: compactLayout ? (phoneLayout ? 2 : 4) : 0,
        type: "scroll",
        selectedMode: false,
        icon: "circle",
        itemWidth: compactLayout ? 10 : 12,
        itemGap: compactLayout ? 6 : 10,
        pageIconSize: compactLayout ? 11 : 12,
        textStyle: {
          color: "#4A6171",
          fontSize: compactLayout ? (phoneLayout ? 10 : 11) : 12,
        },
      },
      graphic: [
        ...(hasData
          ? [
              {
                type: "text",
                left: compactLayout ? "center" : "5%",
                top: compactLayout ? (phoneLayout ? 30 : 28) : "14%",
                style: {
                  text: `סה״כ ${formatCurrency(viewModel.totalAmount)}`,
                  fill: "#163147",
                  fontSize: compactLayout ? (phoneLayout ? 12 : 13) : 14,
                  fontWeight: 700,
                  textAlign: compactLayout ? "center" : "right",
                },
              },
            ]
          : [
              {
                type: "text",
                left: "center",
                top: "middle",
                style: {
                  text: "אין נתונים לאחר הסינון",
                  fill: "#4A6171",
                  fontSize: 15,
                  fontWeight: 600,
                },
              },
            ]),
      ],
      series: [
        {
          type: "pie",
          selectedMode: false,
          radius: compactLayout
            ? phoneLayout
              ? ["34%", "54%"]
              : ["36%", "58%"]
            : ["44%", "68%"],
          center: compactLayout ? ["50%", phoneLayout ? "42%" : "44%"] : ["50%", "48%"],
          avoidLabelOverlap: !compactLayout,
          label: {
            show: !compactLayout,
            formatter: ({ name, percent }) => `${name}\n${percentFormatter.format(percent / 100)}`,
            color: "#163147",
          },
          data: ordered.map((item) => ({
            name: item.name,
            value: item.value,
            filterValue: item.name,
          })),
        },
      ],
    },
    true
  );
}

function renderHeroSummaryTable(viewModel) {
  if (!dom.heroBreakdownTableBody || !dom.heroBreakdownTotal) {
    return;
  }

  dom.heroBreakdownTableBody.textContent = "";
  const ordered = getSortedHeroItems(viewModel);
  const total = viewModel.totalAmount;

  dom.heroBreakdownTotal.textContent = formatCurrency(total);

  if (!ordered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "אין נתונים לאחר הסינון";
    td.className = "hero-table-empty";
    tr.appendChild(td);
    dom.heroBreakdownTableBody.appendChild(tr);
    return;
  }

  ordered.forEach((item) => {
    const tr = document.createElement("tr");
    tr.dataset.heroValue = item.name;
    const share = total > 0 ? item.value / total : 0;

    const nameCell = document.createElement("td");
    nameCell.textContent = item.name;

    const valueCell = document.createElement("td");
    valueCell.className = "hero-table-num";
    valueCell.textContent = formatCurrency(item.value);

    const pctCell = document.createElement("td");
    pctCell.className = "hero-table-num";
    pctCell.textContent = percentFormatter.format(share);

    tr.append(nameCell, valueCell, pctCell);
    dom.heroBreakdownTableBody.appendChild(tr);
  });
}

function renderInstitutionChart(institutionBreakdown, filteredTotal) {
  const ordered = sortBreakdownItems(institutionBreakdown, state.chartDisplay.institution);
  const labels = ordered.map((item) => item.name);
  const compactLayout = isCompactChartLayout();
  const phoneLayout = isPhoneLayout();
  const maxValue = ordered.reduce((max, item) => Math.max(max, sanitizeAmount(item.value)), 0);
  const showBarValueLabels = !compactLayout;
  const gridRight = computeBarChartGridRight(maxValue, compactLayout, showBarValueLabels);
  const labelBreakChars = phoneLayout ? 14 : compactLayout ? 18 : 34;

  state.charts.institution.setOption(
    {
      animationDuration: 500,
      color: ["#198C83"],
      grid: {
        top: 10,
        right: gridRight,
        bottom: compactLayout ? (phoneLayout ? 16 : 18) : 22,
        left: compactLayout ? (phoneLayout ? 4 : 8) : 24,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const item = params[0];
          const raw = sanitizeAmount(item.value);
          const shareLine =
            filteredTotal > 0 ? `<br>${percentFormatter.format(raw / filteredTotal)} מהשווי בתצוגה המסוננת` : "";

          return `${item.name}<br>${formatCurrency(item.value)}${shareLine}`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: maxValue > 0 ? maxValue * 1.08 : undefined,
        splitNumber: 5,
        axisLabel: {
          color: "#4A6171",
          fontSize: compactLayout ? 10 : 11,
          formatter: (value) => formatCompactCurrency(value),
          hideOverlap: true,
          margin: 10,
        },
        splitLine: {
          lineStyle: { color: "rgba(15, 36, 52, 0.08)" },
        },
      },
      yAxis: {
        type: "category",
        data: labels,
        inverse: true,
        axisLabel: {
          color: "#163147",
          fontSize: compactLayout ? 10 : 11,
          lineHeight: 15,
          formatter: (value) => formatHorizontalBarCategoryLabel(value, labelBreakChars),
          overflow: "break",
          width: phoneLayout ? 88 : compactLayout ? 108 : 148,
          interval: 0,
        },
      },
      series: [
        {
          type: "bar",
          barWidth: compactLayout ? (phoneLayout ? 15 : 17) : 20,
          data: ordered.map((item) => ({
            value: sanitizeAmount(item.value),
            name: item.name,
            filterValue: item.name,
            itemStyle: {
              borderRadius: [10, 10, 10, 10],
            },
          })),
          label: {
            show: showBarValueLabels,
            position: "right",
            color: "#163147",
            formatter: ({ value, dataIndex }) => (dataIndex < 3 ? formatCurrency(value) : ""),
          },
        },
      ],
      graphic: !ordered.length
        ? [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: {
                text: "אין נתונים לאחר הסינון",
                fill: "#4A6171",
                fontSize: 15,
                fontWeight: 600,
              },
            },
          ]
        : [],
    },
    true
  );
}

function renderTopHoldingsChart(topHoldings, filteredTotal) {
  const compactLayout = isCompactChartLayout();
  const phoneLayout = isPhoneLayout();
  const ordered = orderTopHoldingsDisplay(topHoldings, state.chartDisplay.topHoldings);
  const chartItems = ordered.map((item) => ({
    axisLabel: item.axisLabel,
    record: item.record,
  }));
  const maxAmount = chartItems.reduce((max, item) => Math.max(max, sanitizeAmount(item.record.amount)), 0);
  const showBarValueLabels = !compactLayout;
  const gridRight = computeBarChartGridRight(maxAmount, compactLayout, showBarValueLabels);
  const labelBreakChars = phoneLayout ? 14 : compactLayout ? 18 : 30;

  state.charts.topHoldings.setOption(
    {
      animationDuration: 500,
      color: ["#D39A39"],
      grid: {
        top: 10,
        right: gridRight,
        bottom: compactLayout ? (phoneLayout ? 16 : 18) : 22,
        left: compactLayout ? (phoneLayout ? 4 : 8) : 28,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const item = params[0];
          const record = item.data.record;
          const amt = sanitizeAmount(record.amount);
          const shareLine =
            filteredTotal > 0 ? `<br>${percentFormatter.format(amt / filteredTotal)} מהשווי בתצוגה המסוננת` : "";

          return `${record.product} / ${record.track}<br>${record.owner} · ${record.institution}<br>${formatCurrency(record.amount)}${shareLine}`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: maxAmount > 0 ? maxAmount * 1.08 : undefined,
        splitNumber: 5,
        axisLabel: {
          color: "#4A6171",
          fontSize: compactLayout ? 10 : 11,
          formatter: (value) => formatCompactCurrency(value),
          hideOverlap: true,
          margin: 10,
        },
        splitLine: {
          lineStyle: { color: "rgba(15, 36, 52, 0.08)" },
        },
      },
      yAxis: {
        type: "category",
        data: chartItems.map((item) => item.axisLabel),
        inverse: true,
        axisLabel: {
          color: "#163147",
          fontSize: compactLayout ? 10 : 11,
          lineHeight: 15,
          formatter: (value) => formatHorizontalBarCategoryLabel(value, labelBreakChars),
          overflow: "break",
          width: phoneLayout ? 92 : compactLayout ? 112 : 162,
          interval: 0,
        },
      },
      series: [
        {
          type: "bar",
          barWidth: compactLayout ? (phoneLayout ? 13 : 15) : 18,
          data: chartItems.map((item) => ({
            value: sanitizeAmount(item.record.amount),
            name: item.axisLabel,
            record: item.record,
            itemStyle: {
              borderRadius: [10, 10, 10, 10],
            },
          })),
          label: {
            show: showBarValueLabels,
            position: "right",
            color: "#163147",
            formatter: ({ value, dataIndex }) => (dataIndex < 3 ? formatCurrency(value) : ""),
          },
        },
      ],
      graphic: !topHoldings.length
        ? [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: {
                text: "אין נתונים לאחר הסינון",
                fill: "#4A6171",
                fontSize: 15,
                fontWeight: 600,
              },
            },
          ]
        : [],
    },
    true
  );
}

function deriveViewModel(records) {
  const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
  const institutionSet = new Set(records.map((record) => record.institution));
  const largestHoldingRecord = [...records].sort((left, right) => right.amount - left.amount)[0] || null;
  const ownerBreakdown = buildBreakdown(records, "owners");
  const institutionBreakdown = buildBreakdown(records, "institutions");
  const productBreakdown = buildBreakdown(records, "products");
  const trackBreakdown = buildBreakdown(records, "tracks");
  const biggestOwner = ownerBreakdown[0];
  const topHoldings = [...records]
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 8)
    .map((record) => ({
      axisLabel: `${record.product} / ${record.track}`,
      record,
    }));

  return {
    totalAmount,
    holdingsCount: records.length,
    institutionsCount: institutionSet.size,
    largestHolding: largestHoldingRecord
      ? {
          amount: largestHoldingRecord.amount,
          label: `${largestHoldingRecord.product} / ${largestHoldingRecord.track}`,
        }
      : {
          amount: 0,
          label: "אין נתונים",
        },
    biggestOwnerShare: biggestOwner
      ? {
          share: totalAmount > 0 ? biggestOwner.value / totalAmount : 0,
          label: `${biggestOwner.name} מוביל בתצוגה הנוכחית`,
        }
      : {
          share: 0,
          label: "אין נתונים",
        },
    ownerBreakdown,
    institutionBreakdown,
    productBreakdown,
    trackBreakdown,
    topHoldings,
  };
}

function buildBreakdown(records, filterKey) {
  if (!Object.hasOwn(FILTER_KEYS, filterKey)) {
    return [];
  }

  const field = FILTER_KEYS[filterKey];
  const grouped = new Map();

  records.forEach((record) => {
    const bucket = record[field];
    const add = sanitizeAmount(record.amount);
    grouped.set(bucket, (grouped.get(bucket) || 0) + add);
  });

  return [...grouped.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value || collator.compare(left.name, right.name));
}

function renderHeroSummaryEmpty() {
  if (!dom.heroBreakdownTableBody || !dom.heroBreakdownTotal) {
    return;
  }

  dom.heroBreakdownTableBody.textContent = "";
  dom.heroBreakdownTotal.textContent = formatCurrency(0);

  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 3;
  td.textContent = "מעלים קובץ כדי לראות סיכום";
  td.className = "hero-table-empty";
  tr.appendChild(td);
  dom.heroBreakdownTableBody.appendChild(tr);
}

function playHeroTableRowTapFeedback(row) {
  if (!row?.dataset?.heroValue) {
    return;
  }

  row.classList.remove("hero-row-tap");
  // Re-trigger animation if the row is tapped repeatedly.
  void row.offsetWidth;
  row.classList.add("hero-row-tap");

  const done = () => {
    row.classList.remove("hero-row-tap");
  };

  row.addEventListener("animationend", done, { once: true });
  window.setTimeout(done, 500);
}

function applyTableRowAsFilters(row) {
  if (!row || row.classList.contains("empty-row")) {
    return;
  }

  const { owner, institution, product, track } = row.dataset;

  if (!owner || !institution || !product || !track) {
    return;
  }

  ensureValueSelected("owners", owner);
  ensureValueSelected("institutions", institution);
  ensureValueSelected("products", product);
  ensureValueSelected("tracks", track);
  renderFilterControls();
  renderDashboard();
}

function renderTable(records) {
  dom.tableBody.textContent = "";

  if (!records.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = state.records.length ? "אין תוצאות עבור הסינון הנוכחי." : "מעלים קובץ כדי להציג נתונים.";
    row.appendChild(cell);
    dom.tableBody.appendChild(row);
    return;
  }

  const fragment = document.createDocumentFragment();

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.classList.add("detail-table-row");
    row.tabIndex = 0;
    row.title = "לחיצה מוסיפה סינון לפי השורה (כמו בתרשים המובילים)";
    row.dataset.owner = record.owner;
    row.dataset.institution = record.institution;
    row.dataset.product = record.product;
    row.dataset.track = record.track;

    appendTableCell(row, record.product);
    appendTableCell(row, record.track);
    appendTableCell(row, formatCurrency(record.amount), "numeric-cell");
    appendTableCell(row, record.institution);
    appendTableCell(row, record.owner);

    fragment.appendChild(row);
  });

  dom.tableBody.appendChild(fragment);
}

function appendTableCell(row, text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text;

  if (className) {
    cell.className = className;
  }

  row.appendChild(cell);
}

function setSort(key) {
  if (state.sort.key === key) {
    state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
  } else {
    state.sort.key = key;
    state.sort.direction = key === "amount" ? "desc" : "asc";
  }

  renderDashboard();
}

function updateSortButtons() {
  document.querySelectorAll(".sort-button").forEach((button) => {
    const isActive = button.dataset.sortKey === state.sort.key;
    button.classList.toggle("is-active", isActive);
    button.textContent = buildSortLabel(button.dataset.sortKey, isActive ? state.sort.direction : null);
  });
}

function buildSortLabel(key, direction) {
  const labels = {
    product: "מוצר",
    track: "מסלול",
    amount: "סכום",
    institution: "איפה",
    owner: "אצל מי",
  };

  if (!direction) {
    return labels[key];
  }

  return `${labels[key]} ${direction === "asc" ? "↑" : "↓"}`;
}

function applyFilters(records, filters) {
  return records.filter((record) => {
    if (filters.owners.length && !filters.owners.includes(record.owner)) {
      return false;
    }

    if (filters.institutions.length && !filters.institutions.includes(record.institution)) {
      return false;
    }

    if (filters.products.length && !filters.products.includes(record.product)) {
      return false;
    }

    if (filters.tracks.length && !filters.tracks.includes(record.track)) {
      return false;
    }

    return true;
  });
}

function sortRecords(records, sortState) {
  const sorted = [...records];

  sorted.sort((left, right) => {
    if (sortState.key === "amount") {
      const amountCompare = left.amount - right.amount;
      if (amountCompare !== 0) {
        return sortState.direction === "asc" ? amountCompare : -amountCompare;
      }
      return collator.compare(left.product, right.product);
    }

    const leftValue = left[sortState.key];
    const rightValue = right[sortState.key];
    const stringCompare = collator.compare(leftValue, rightValue);

    return sortState.direction === "asc" ? stringCompare : -stringCompare;
  });

  return sorted;
}

function exportFilteredCsv() {
  const rows = [
    ["מוצר", "מסלול", "סכום", "איפה", "אצל מי"],
    ...state.filteredRecords.map((record) => [
      record.product,
      record.track,
      String(record.amount),
      record.institution,
      record.owner,
    ]),
  ];

  const csvContent = rows
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeFileName = sanitizeFileName(state.meta?.sourceFileName || "dashboard-export");
  link.href = url;
  link.download = `${safeFileName.replace(/\.xlsx$/i, "")}-filtered.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadTemplateWorkbook() {
  try {
    if (!window.XLSX) {
      throw new Error("ספריית Excel המקומית לא זמינה כרגע. רעננו את הדף ונסו שוב.");
    }

    const workbook = buildTemplateWorkbook();
    XLSX.writeFile(workbook, "savings-dashboard-template.xlsx", {
      compression: true,
    });

    clearBanner(dom.errorBanner);
    setBanner(
      dom.successBanner,
      "תבנית XLSX ירדה בהצלחה. אפשר למלא, לשמור ולהעלות אותה חזרה לדשבורד.",
      "success"
    );
  } catch (error) {
    setBanner(dom.errorBanner, error.message || "לא ניתן היה ליצור את תבנית ה־XLSX.", "error");
  }
}

function buildTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([["תיק השקעות"]]);

  setSheetTextCell(worksheet, "A4", "מוצר");
  setSheetTextCell(worksheet, "B4", "מסלול");
  setSheetTextCell(worksheet, "C4", "סכום");
  setSheetTextCell(worksheet, "D4", "איפה");
  setSheetTextCell(worksheet, "E4", "אצל מי");
  setSheetTextCell(worksheet, "F4", "הפקדות בתקופה");

  setSheetTextCell(worksheet, "O4", "תאריך עדכון");
  setSheetTextCell(worksheet, "O5", 'סה"כ');
  setSheetTextCell(worksheet, "O7", "סכום קודם");
  setSheetTextCell(worksheet, "O8", "אחוז עליה");
  setSheetTextCell(worksheet, "O9", "נטו עליה");
  setSheetTextCell(worksheet, "O13", "חודשים קודמים");
  setSheetTextCell(worksheet, "O14", "YYYY-MM-DD");
  setSheetTextCell(worksheet, "P14", "סכום");
  setSheetTextCell(worksheet, "O15", "YYYY-MM-DD");
  setSheetTextCell(worksheet, "P15", "סכום");

  worksheet["!cols"] = [
    { wch: 23 },
    { wch: 21 },
    { wch: 14 },
    { wch: 18 },
    { wch: 15 },
    { wch: 16 },
    { wch: 5 },
    { wch: 5 },
    { wch: 5 },
    { wch: 5 },
    { wch: 5 },
    { wch: 5 },
    { wch: 5 },
    { wch: 5 },
    { wch: 16 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "sheet1");
  return workbook;
}

function setSheetTextCell(worksheet, address, value) {
  XLSX.utils.sheet_add_aoa(worksheet, [[value]], {
    origin: address,
  });
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function removeFilterChip(filterKey, value) {
  if (Object.hasOwn(FILTER_KEYS, filterKey)) {
    state.filters[filterKey] = state.filters[filterKey].filter((item) => item !== value);
    renderFilterControls();
    return;
  }
}

function toggleArrayFilter(filterKey, value) {
  const selectedValues = state.filters[filterKey];

  if (selectedValues.includes(value)) {
    state.filters[filterKey] = selectedValues.filter((item) => item !== value);
  } else {
    state.filters[filterKey] = [...selectedValues, value].sort(collator.compare);
  }
}

function ensureValueSelected(filterKey, value) {
  if (!state.filters[filterKey].includes(value)) {
    state.filters[filterKey] = [...state.filters[filterKey], value].sort(collator.compare);
  }
}

function hasActiveFilters() {
  return Object.keys(FILTER_KEYS).some((filterKey) => state.filters[filterKey].length > 0);
}

function passesFiltersExcept(record, excludeFilterKey) {
  if (excludeFilterKey !== "owners" && state.filters.owners.length && !state.filters.owners.includes(record.owner)) {
    return false;
  }

  if (
    excludeFilterKey !== "institutions" &&
    state.filters.institutions.length &&
    !state.filters.institutions.includes(record.institution)
  ) {
    return false;
  }

  if (excludeFilterKey !== "products" && state.filters.products.length && !state.filters.products.includes(record.product)) {
    return false;
  }

  if (excludeFilterKey !== "tracks" && state.filters.tracks.length && !state.filters.tracks.includes(record.track)) {
    return false;
  }

  return true;
}

function countFacetedRecords(filterKey, optionValue) {
  const recordKey = FILTER_KEYS[filterKey];
  return state.records.filter(
    (record) => record[recordKey] === optionValue && passesFiltersExcept(record, filterKey)
  ).length;
}

function getUniqueValues(records, property) {
  return [...new Set(records.map((record) => record[property]))].sort(collator.compare);
}

function getDefaultFilters() {
  return {
    owners: [],
    institutions: [],
    products: [],
    tracks: [],
  };
}

function resetFilters() {
  state.filters = getDefaultFilters();
}

function setGroupCount(element, selectedCount, totalCount) {
  if (!element) {
    return;
  }

  if (!totalCount) {
    element.textContent = "אין נתונים";
    element.classList.add("is-empty");
    return;
  }

  element.textContent = `${numberFormatter.format(selectedCount)}/${numberFormatter.format(totalCount)}`;
  element.classList.remove("is-empty");
}

function getSelectedOptionCount(filterKey, options) {
  if (!Array.isArray(options) || !options.length) {
    return 0;
  }

  return state.filters[filterKey].filter((value) => options.includes(value)).length;
}

function renderFilterSectionSummary(summary) {
  const quickSelectedCount = summary.products.selectedCount + summary.tracks.selectedCount;
  const quickTotalCount = summary.products.totalCount + summary.tracks.totalCount;
  const activeFilterCount = getActiveFilterCount();

  setGroupCount(dom.quickSectionCount, quickSelectedCount, quickTotalCount);

  if (!dom.filtersActiveSummary) {
    return;
  }

  dom.filtersActiveSummary.textContent = `${numberFormatter.format(activeFilterCount)} פעילים`;
  dom.filtersActiveSummary.classList.toggle("is-empty", !activeFilterCount);

  updateSidebarRailBadge();
}

function updateMobileUtilityBar(filteredCount) {
  const activeFilterCount = getActiveFilterCount();
  dom.mobileFilterCount.textContent = numberFormatter.format(activeFilterCount);

  if (!state.records.length) {
    dom.mobileResultsSummary.textContent = "מעלים קובץ כדי להתחיל";
    return;
  }

  dom.mobileResultsSummary.textContent = `${numberFormatter.format(filteredCount)} מתוך ${numberFormatter.format(state.records.length)} רשומות`;
}

function formatCurrency(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatSignedCurrency(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue > 0 ? "+" : safeValue < 0 ? "-" : ""}${formatCurrency(Math.abs(safeValue))}`;
}

function formatCompactCurrency(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  if (Math.abs(safeValue) >= 1_000_000) {
    return `₪${new Intl.NumberFormat("he-IL", {
      maximumFractionDigits: 2,
    }).format(safeValue / 1_000_000)}מ'`;
  }

  if (Math.abs(safeValue) >= 1_000) {
    return `₪${new Intl.NumberFormat("he-IL", {
      maximumFractionDigits: 0,
    }).format(safeValue / 1_000)}K`;
  }

  return formatCurrency(safeValue);
}

function formatGrowthPercent(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue > 0 ? "+" : safeValue < 0 ? "-" : ""}${new Intl.NumberFormat("he-IL", {
    maximumFractionDigits: 2,
  }).format(Math.abs(safeValue))}%`;
}

function formatDisplayDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return `${shortDateFormatter.format(date)} · ${isoDate}`;
}

function formatLocalDateParts(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatMonthLabel(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return shortMonthFormatter.format(date);
}

function formatChartAxisDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return chartDateFormatter.format(date);
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^\p{Letter}\p{Number}._-]+/gu, "-");
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();

    if (!normalized) {
      return NaN;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  return NaN;
}

/** Finite non-negative amount capped for JS Number safety (charts / aggregations). */
function sanitizeAmount(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.min(n, Number.MAX_SAFE_INTEGER);
}

function computeBarChartGridRight(maxAmount, compactLayout, showValueLabels) {
  if (!showValueLabels) {
    return compactLayout ? 36 : 52;
  }

  const label = formatCurrency(sanitizeAmount(maxAmount));
  const unit = compactLayout ? 7 : 8;
  const padded = Math.ceil(label.length * unit + 24);
  return Math.min(144, Math.max(compactLayout ? 48 : 68, padded));
}

function isCompactChartLayout() {
  return isMobileLayout();
}

function isBlank(value) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function setBanner(element, message, type) {
  element.textContent = message;
  element.classList.remove("hidden", "banner-success", "banner-warning", "banner-error");
  element.classList.add(`banner-${type}`);
}

function clearBanner(element) {
  element.textContent = "";
  element.classList.add("hidden");
}

function resizeCharts() {
  Object.values(state.charts).forEach((chart) => chart.resize());
}

function isMobileLayout() {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(max-width: 920px)").matches;
  }

  return window.innerWidth <= 920;
}

function isPhoneLayout() {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(max-width: 640px)").matches;
  }

  return window.innerWidth <= 640;
}

function getActiveFilterCount() {
  let count = 0;

  Object.keys(FILTER_KEYS).forEach((filterKey) => {
    count += state.filters[filterKey].length;
  });

  return count;
}

function writeSidebarCollapsedPref(collapsed) {
  try {
    if (collapsed) {
      sessionStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, "1");
    } else {
      sessionStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function isDesktopTwoColumnLayout() {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(min-width: 1081px)").matches;
  }

  return window.innerWidth > 1080;
}

function scheduleResizeCharts() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resizeCharts();
    });
  });
}

function setSidebarCollapsed(collapsed) {
  if (!isDesktopTwoColumnLayout()) {
    return;
  }

  state.ui.sidebarCollapsed = collapsed;
  writeSidebarCollapsedPref(collapsed);
  syncSidebarCollapsedUi();
  scheduleResizeCharts();
}

function syncSidebarCollapsedUi() {
  const railVisible = state.ui.sidebarCollapsed && isDesktopTwoColumnLayout();

  dom.dashboardShell?.classList.toggle("is-sidebar-collapsed", railVisible);

  if (dom.sidebarCollapseToggle) {
    dom.sidebarCollapseToggle.setAttribute("aria-expanded", String(!railVisible));
  }

  if (dom.sidebarExpandButton) {
    dom.sidebarExpandButton.setAttribute("aria-expanded", String(!railVisible));
    dom.sidebarExpandButton.setAttribute("aria-controls", "filters-expanded-stack");
  }

  if (dom.filtersCollapsedRail) {
    dom.filtersCollapsedRail.setAttribute("aria-hidden", String(!railVisible));
  }

  dom.filtersExpandedStack?.setAttribute("aria-hidden", String(railVisible));

  updateSidebarRailBadge();
}

function updateSidebarRailBadge() {
  if (!dom.sidebarRailBadge) {
    return;
  }

  const activeFilterCount = getActiveFilterCount();

  dom.sidebarRailBadge.textContent = numberFormatter.format(activeFilterCount);
  dom.sidebarRailBadge.classList.toggle("is-empty", !activeFilterCount);
}

function toggleFilterSection(sectionKey) {
  if (!Object.hasOwn(state.ui.collapsedSections, sectionKey)) {
    return;
  }

  state.ui.collapsedSections[sectionKey] = !state.ui.collapsedSections[sectionKey];
  syncFilterSectionState();
}

function syncFilterSectionState() {
  FILTER_SECTION_KEYS.forEach((sectionKey) => {
    const collapsed = state.ui.collapsedSections[sectionKey];
    const section = dom[`${sectionKey}Section`];
    const toggle = dom[`${sectionKey}SectionToggle`];
    const panel = dom[`${sectionKey}SectionPanel`];

    if (!section || !toggle || !panel) {
      return;
    }

    section.classList.toggle("is-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    panel.hidden = collapsed;
    panel.setAttribute("aria-hidden", String(collapsed));
  });
}

function openMobileFilters() {
  if (!isMobileLayout()) {
    return;
  }

  state.ui.mobileFiltersOpen = true;
  syncMobileFilterUi();
}

function closeMobileFilters() {
  if (!state.ui.mobileFiltersOpen) {
    syncMobileFilterUi();
    return;
  }

  state.ui.mobileFiltersOpen = false;
  syncMobileFilterUi();
}

function syncDocumentTitle() {
  if (!state.meta?.sourceFileName) {
    document.title = DEFAULT_DOCUMENT_TITLE;
    return;
  }

  document.title = `${DEFAULT_DOCUMENT_TITLE} · ${state.meta.sourceFileName}`;
}

function syncMobileFilterUi() {
  const isOpen = isMobileLayout() && state.ui.mobileFiltersOpen;

  dom.dashboardShell.classList.toggle("filters-open", isOpen);
  document.body.classList.toggle("filter-sheet-open", isOpen);
  dom.mobileFilterToggle.setAttribute("aria-expanded", String(isOpen));
  dom.mobileFilterClose.setAttribute("aria-hidden", String(!isOpen));
  dom.mobileFilterBackdrop.setAttribute("aria-hidden", String(!isOpen));
}

function truncateText(text, maxLength) {
  const value = String(text || "");

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(1, maxLength - 1))}…`;
}

function debounce(callback, waitMs) {
  let timeoutId = null;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), waitMs);
  };
}
