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
  searchText: "חיפוש",
  minAmount: "מינימום",
  maxAmount: "מקסימום",
};
const CHART_COLORS = ["#163147", "#198C83", "#D39A39", "#DE7655", "#7D90A5", "#4F6D7A", "#B56348", "#9DB8B4"];

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

const state = {
  meta: null,
  records: [],
  filteredRecords: [],
  warnings: [],
  filters: getDefaultFilters(),
  sort: {
    key: "amount",
    direction: "desc",
  },
  charts: {},
  ui: {
    mobileFiltersOpen: false,
  },
};

const dom = {
  fileInput: document.getElementById("file-input"),
  uploadTrigger: document.getElementById("upload-trigger"),
  dropZone: document.getElementById("drop-zone"),
  filtersCard: document.getElementById("filters-card"),
  fileName: document.getElementById("file-name"),
  updateDate: document.getElementById("update-date"),
  declaredTotal: document.getElementById("declared-total"),
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
  searchInput: document.getElementById("search-input"),
  minAmount: document.getElementById("min-amount"),
  maxAmount: document.getElementById("max-amount"),
  ownersFilter: document.getElementById("owners-filter"),
  institutionsFilter: document.getElementById("institutions-filter"),
  productsFilter: document.getElementById("products-filter"),
  tracksFilter: document.getElementById("tracks-filter"),
  ownersCount: document.getElementById("owners-count"),
  institutionsCount: document.getElementById("institutions-count"),
  productsCount: document.getElementById("products-count"),
  tracksCount: document.getElementById("tracks-count"),
  activeFilterChips: document.getElementById("active-filter-chips"),
  tableBody: document.getElementById("table-body"),
  tableSummary: document.getElementById("table-summary"),
  exportCsv: document.getElementById("export-csv"),
  ownerChart: document.getElementById("owner-chart"),
  institutionChart: document.getElementById("institution-chart"),
  treemapChart: document.getElementById("treemap-chart"),
  topHoldingsChart: document.getElementById("top-holdings-chart"),
  detailsSection: document.getElementById("details-section"),
  kpiTotal: document.getElementById("kpi-total"),
  kpiHoldings: document.getElementById("kpi-holdings"),
  kpiInstitutions: document.getElementById("kpi-institutions"),
  kpiLargest: document.getElementById("kpi-largest"),
  kpiLargestLabel: document.getElementById("kpi-largest-label"),
  kpiOwnerShare: document.getElementById("kpi-owner-share"),
  kpiOwnerShareLabel: document.getElementById("kpi-owner-share-label"),
};

const handleViewportResize = debounce(() => {
  if (!isMobileLayout()) {
    closeMobileFilters();
  }

  resizeCharts();
  syncMobileFilterUi();
}, 120);

bootstrap();

function bootstrap() {
  dom.uploadTrigger.addEventListener("click", () => dom.fileInput.click());
  dom.dropZone.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    dom.fileInput.click();
  });
  dom.fileInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];

    if (file) {
      await handleFile(file);
    }

    dom.fileInput.value = "";
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

  dom.searchInput.addEventListener("input", (event) => {
    state.filters.searchText = event.target.value.trim();
    renderDashboard();
  });

  dom.minAmount.addEventListener("input", (event) => {
    state.filters.minAmount = event.target.value;
    renderDashboard();
  });

  dom.maxAmount.addEventListener("input", (event) => {
    state.filters.maxAmount = event.target.value;
    renderDashboard();
  });

  dom.clearFilters.addEventListener("click", () => {
    resetFilters();
    renderDashboard();
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
  syncMobileFilterUi();
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
    resetFilters();
    closeMobileFilters();

    renderFileMeta();
    renderFilterControls();
    renderDashboard();

    setBanner(
      dom.successBanner,
      `נטענו ${numberFormatter.format(state.records.length)} רשומות מתוך sheet1. הנתונים נשארים בדפדפן בלבד.`,
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
    const amount = toNumber(rawAmount);

    if (!product || !track || !institution || !owner || !Number.isFinite(amount)) {
      warnings.push(`שורה ${rowIndex + 1} דולגה כי היא לא תקינה בפורמט הנתונים.`);
      continue;
    }

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
    },
    records,
    warnings,
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
    renderTable([]);
    renderFilterChips();
    renderEmptyCharts();
    updateSortButtons();
    updateMobileUtilityBar(0);
    syncMobileFilterUi();
    return;
  }

  const filteredRecords = applyFilters(state.records, state.filters);
  const sortedRecords = sortRecords(filteredRecords, state.sort);
  const viewModel = deriveViewModel(filteredRecords, state.meta);

  state.filteredRecords = sortedRecords;

  renderKpis(viewModel);
  renderFilterChips();
  renderTable(sortedRecords);
  renderCharts(viewModel);
  updateSortButtons();

  dom.exportCsv.disabled = !sortedRecords.length;
  dom.tableSummary.textContent = `${numberFormatter.format(sortedRecords.length)} רשומות מוצגות מתוך ${numberFormatter.format(state.records.length)}`;
  updateMobileUtilityBar(sortedRecords.length);
  syncMobileFilterUi();
}

function renderFileMeta() {
  if (!state.meta) {
    dom.fileName.textContent = "עדיין לא נבחר קובץ";
    dom.updateDate.textContent = "ממתין לטעינה";
    dom.declaredTotal.textContent = "ממתין לטעינה";
    return;
  }

  dom.fileName.textContent = state.meta.sourceFileName || "קובץ XLSX מקומי";
  dom.updateDate.textContent = state.meta.updateDate ? formatDisplayDate(state.meta.updateDate) : "לא זוהה";
  dom.declaredTotal.textContent = Number.isFinite(state.meta.declaredTotal)
    ? formatCurrency(state.meta.declaredTotal)
    : "לא זוהה";
}

function renderFilterControls() {
  const options = {
    owners: getUniqueValues(state.records, "owner"),
    institutions: getUniqueValues(state.records, "institution"),
    products: getUniqueValues(state.records, "product"),
    tracks: getUniqueValues(state.records, "track"),
  };

  renderFilterPills("owners", options.owners, dom.ownersFilter, dom.ownersCount);
  renderFilterPills("institutions", options.institutions, dom.institutionsFilter, dom.institutionsCount);
  renderFilterPills("products", options.products, dom.productsFilter, dom.productsCount);
  renderFilterPills("tracks", options.tracks, dom.tracksFilter, dom.tracksCount);

  dom.searchInput.value = state.filters.searchText;
  dom.minAmount.value = state.filters.minAmount;
  dom.maxAmount.value = state.filters.maxAmount;
  syncMobileFilterUi();
}

function renderFilterPills(filterKey, options, container, counterElement) {
  container.textContent = "";
  counterElement.textContent = `${numberFormatter.format(options.length)} אפשרויות`;

  if (!options.length) {
    const empty = document.createElement("span");
    empty.className = "group-meta";
    empty.textContent = "אין נתונים";
    container.appendChild(empty);
    return;
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
    detailNode.textContent = `${numberFormatter.format(countMatchingRecords(FILTER_KEYS[filterKey], optionValue))}`;
    button.appendChild(detailNode);

    fragment.appendChild(button);
  });

  container.appendChild(fragment);
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

  if (state.filters.searchText) {
    chips.push({
      key: "searchText",
      value: "",
      label: `${FILTER_LABELS.searchText}: ${state.filters.searchText}`,
    });
  }

  if (state.filters.minAmount !== "") {
    chips.push({
      key: "minAmount",
      value: "",
      label: `${FILTER_LABELS.minAmount}: ${formatCurrency(Number(state.filters.minAmount || 0))}`,
    });
  }

  if (state.filters.maxAmount !== "") {
    chips.push({
      key: "maxAmount",
      value: "",
      label: `${FILTER_LABELS.maxAmount}: ${formatCurrency(Number(state.filters.maxAmount || 0))}`,
    });
  }

  return chips;
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

function renderCharts(viewModel) {
  ensureCharts();
  renderOwnerChart(viewModel.ownerBreakdown);
  renderInstitutionChart(viewModel.institutionBreakdown);
  renderTreemapChart(viewModel.productTreemap);
  renderTopHoldingsChart(viewModel.topHoldings);
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

  Object.values(state.charts).forEach((chart) => {
    chart.clear();
    chart.setOption(emptyOption, true);
  });
}

function ensureCharts() {
  if (!state.charts.owner) {
    state.charts.owner = echarts.init(dom.ownerChart);
    state.charts.institution = echarts.init(dom.institutionChart);
    state.charts.treemap = echarts.init(dom.treemapChart);
    state.charts.topHoldings = echarts.init(dom.topHoldingsChart);

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

    state.charts.treemap.on("click", (params) => {
      const data = params?.data;

      if (!data) {
        return;
      }

      if (data.product) {
        ensureValueSelected("products", data.product);
      }

      if (data.track) {
        ensureValueSelected("tracks", data.track);
      }

      renderFilterControls();
      renderDashboard();
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

function renderOwnerChart(ownerBreakdown) {
  const hasData = ownerBreakdown.length > 0;
  const phoneLayout = isPhoneLayout();

  state.charts.owner.setOption(
    {
      animationDuration: 500,
      color: CHART_COLORS,
      tooltip: {
        trigger: "item",
        formatter: ({ name, value, percent }) =>
          `${name}<br>${formatCurrency(value)}<br>${percentFormatter.format(percent / 100)}`,
      },
      legend: {
        bottom: 0,
        type: "scroll",
        icon: "circle",
        textStyle: {
          color: "#4A6171",
          fontSize: phoneLayout ? 11 : 12,
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
          radius: phoneLayout ? ["42%", "64%"] : ["48%", "72%"],
          center: ["50%", phoneLayout ? "40%" : "44%"],
          avoidLabelOverlap: !phoneLayout,
          label: {
            show: !phoneLayout,
            formatter: ({ name, percent }) => `${name}\n${percentFormatter.format(percent / 100)}`,
            color: "#163147",
          },
          data: ownerBreakdown.map((item) => ({
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

function renderInstitutionChart(institutionBreakdown) {
  const labels = institutionBreakdown.map((item) => item.name);
  const phoneLayout = isPhoneLayout();

  state.charts.institution.setOption(
    {
      animationDuration: 500,
      color: ["#198C83"],
      grid: {
        top: 10,
        right: phoneLayout ? 6 : 12,
        bottom: 12,
        left: phoneLayout ? 84 : 110,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const item = params[0];
          return `${item.name}<br>${formatCurrency(item.value)}`;
        },
      },
      xAxis: {
        type: "value",
        axisLabel: {
          color: "#4A6171",
          formatter: (value) => numberFormatter.format(value),
        },
        splitLine: {
          lineStyle: { color: "rgba(15, 36, 52, 0.08)" },
        },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          color: "#163147",
          width: phoneLayout ? 72 : 120,
          overflow: "truncate",
        },
      },
      series: [
        {
          type: "bar",
          barWidth: phoneLayout ? 16 : 20,
          data: institutionBreakdown.map((item) => ({
            value: item.value,
            name: item.name,
            filterValue: item.name,
            itemStyle: {
              borderRadius: [10, 10, 10, 10],
            },
          })),
          label: {
            show: !phoneLayout,
            position: "right",
            color: "#163147",
            formatter: ({ value }) => formatCurrency(value),
          },
        },
      ],
      graphic: !institutionBreakdown.length
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

function renderTreemapChart(productTreemap) {
  const phoneLayout = isPhoneLayout();

  state.charts.treemap.setOption(
    {
      animationDuration: 500,
      color: CHART_COLORS,
      tooltip: {
        formatter: ({ data }) => {
          const title = data.track ? `${data.product} / ${data.track}` : data.name;
          return `${title}<br>${formatCurrency(data.value || 0)}`;
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            color: "#163147",
            formatter: ({ data }) => {
              const label = truncateText(data.track || data.name, phoneLayout ? 12 : 22);
              return `${label}\n${formatCurrency(data.value || 0)}`;
            },
          },
          upperLabel: {
            show: true,
            height: 26,
            color: "#163147",
            formatter: ({ data }) => truncateText(data.name, phoneLayout ? 12 : 20),
          },
          itemStyle: {
            borderColor: "#fdfaf3",
            borderWidth: 3,
            gapWidth: 3,
          },
          levels: [
            {
              itemStyle: {
                borderColor: "#fdfaf3",
                borderWidth: 3,
                gapWidth: 4,
              },
              upperLabel: {
                show: true,
                color: "#163147",
                fontWeight: 700,
                fontSize: phoneLayout ? 11 : 12,
              },
            },
            {
              colorSaturation: [0.24, 0.7],
              itemStyle: {
                borderColorSaturation: 0.2,
                gapWidth: 2,
                borderWidth: 2,
              },
            },
          ],
          data: productTreemap,
        },
      ],
      graphic: !productTreemap.length
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

function renderTopHoldingsChart(topHoldings) {
  const phoneLayout = isPhoneLayout();
  const chartItems = topHoldings.map((item) => ({
    axisLabel: truncateText(item.axisLabel, phoneLayout ? 16 : 28),
    record: item.record,
  }));

  state.charts.topHoldings.setOption(
    {
      animationDuration: 500,
      color: ["#D39A39"],
      grid: {
        top: 10,
        right: phoneLayout ? 8 : 18,
        bottom: 12,
        left: phoneLayout ? 118 : 160,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const item = params[0];
          const record = item.data.record;
          return `${record.product} / ${record.track}<br>${record.owner} · ${record.institution}<br>${formatCurrency(record.amount)}`;
        },
      },
      xAxis: {
        type: "value",
        axisLabel: {
          color: "#4A6171",
          formatter: (value) => numberFormatter.format(value),
        },
        splitLine: {
          lineStyle: { color: "rgba(15, 36, 52, 0.08)" },
        },
      },
      yAxis: {
        type: "category",
        data: chartItems.map((item) => item.axisLabel),
        axisLabel: {
          color: "#163147",
          width: phoneLayout ? 110 : 150,
          overflow: "truncate",
        },
      },
      series: [
        {
          type: "bar",
          barWidth: phoneLayout ? 14 : 18,
          data: chartItems.map((item) => ({
            value: item.record.amount,
            name: item.axisLabel,
            record: item.record,
            itemStyle: {
              borderRadius: [10, 10, 10, 10],
            },
          })),
          label: {
            show: !phoneLayout,
            position: "right",
            color: "#163147",
            formatter: ({ value }) => formatCurrency(value),
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
  const ownerBreakdown = buildBreakdown(records, "owner");
  const institutionBreakdown = buildBreakdown(records, "institution");
  const productTreemap = buildProductTreemap(records);
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
    productTreemap,
    topHoldings,
  };
}

function buildBreakdown(records, key) {
  const grouped = new Map();

  records.forEach((record) => {
    grouped.set(key === "owner" ? record.owner : record.institution, (grouped.get(key === "owner" ? record.owner : record.institution) || 0) + record.amount);
  });

  return [...grouped.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value || collator.compare(left.name, right.name));
}

function buildProductTreemap(records) {
  const productMap = new Map();

  records.forEach((record) => {
    if (!productMap.has(record.product)) {
      productMap.set(record.product, new Map());
    }

    const trackMap = productMap.get(record.product);
    trackMap.set(record.track, (trackMap.get(record.track) || 0) + record.amount);
  });

  return [...productMap.entries()]
    .map(([product, trackMap]) => {
      const children = [...trackMap.entries()]
        .map(([track, value]) => ({
          name: track,
          value,
          product,
          track,
        }))
        .sort((left, right) => right.value - left.value || collator.compare(left.name, right.name));

      return {
        name: product,
        value: children.reduce((sum, child) => sum + child.value, 0),
        product,
        children,
      };
    })
    .sort((left, right) => right.value - left.value || collator.compare(left.name, right.name));
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
  const searchTerm = normalizeText(filters.searchText);
  const minAmount = filters.minAmount === "" ? null : Number(filters.minAmount);
  const maxAmount = filters.maxAmount === "" ? null : Number(filters.maxAmount);

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

    if (Number.isFinite(minAmount) && record.amount < minAmount) {
      return false;
    }

    if (Number.isFinite(maxAmount) && record.amount > maxAmount) {
      return false;
    }

    if (searchTerm) {
      const haystack = normalizeText([record.product, record.track, record.institution, record.owner].join(" "));
      if (!haystack.includes(searchTerm)) {
        return false;
      }
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

  if (filterKey === "searchText") {
    state.filters.searchText = "";
    dom.searchInput.value = "";
    return;
  }

  if (filterKey === "minAmount") {
    state.filters.minAmount = "";
    dom.minAmount.value = "";
    return;
  }

  if (filterKey === "maxAmount") {
    state.filters.maxAmount = "";
    dom.maxAmount.value = "";
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
  return (
    Object.keys(FILTER_KEYS).some((filterKey) => state.filters[filterKey].length > 0) ||
    Boolean(state.filters.searchText) ||
    state.filters.minAmount !== "" ||
    state.filters.maxAmount !== ""
  );
}

function countMatchingRecords(key, value) {
  return state.records.filter((record) => record[key] === value).length;
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
    searchText: "",
    minAmount: "",
    maxAmount: "",
  };
}

function resetFilters() {
  state.filters = getDefaultFilters();
  dom.searchInput.value = "";
  dom.minAmount.value = "";
  dom.maxAmount.value = "";
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

function normalizeText(value) {
  return String(value || "").trim().toLocaleLowerCase("he-IL");
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

  if (state.filters.searchText) {
    count += 1;
  }

  if (state.filters.minAmount !== "") {
    count += 1;
  }

  if (state.filters.maxAmount !== "") {
    count += 1;
  }

  return count;
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
