const assert = require("assert");
const path = require("path");
const esbuild = require("esbuild");

console.log("========================================================================");
console.log("  VERIFICATION SUITE: SMART LONG-TAIL AGGREGATOR & QUALITATIVE ANALYZER ");
console.log("========================================================================\n");

// 1. Compile TypeScript source modules via esbuild in memory
console.log("[Setup] Compiling TypeScript modules in memory via esbuild...");

const srcCoreDir = path.resolve(__dirname, "../src/core");
const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from "${srcCoreDir.replace(/\\/g, "/")}/profiler/longTailAggregator";
      export * from "${srcCoreDir.replace(/\\/g, "/")}/profiler/keywordExtractor";
      export * from "${srcCoreDir.replace(/\\/g, "/")}/profiler/questionClassifier";
      export * from "${srcCoreDir.replace(/\\/g, "/")}/profiler/statistics";
      export * from "${srcCoreDir.replace(/\\/g, "/")}/theming/echartsOptions";
      export * from "${srcCoreDir.replace(/\\/g, "/")}/theming/palettes";
      export * from "${srcCoreDir.replace(/\\/g, "/")}/parser/csvParser";
      export { DEMO_SURVEY_1_HEADERS, DEMO_SURVEY_1_ROWS } from "${path.resolve(__dirname, "../src/data/demoSurvey1").replace(/\\/g, "/")}";
    `,
    resolveDir: __dirname,
    loader: "ts",
  },
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  jsx: "transform",
});

const moduleExports = {};
const runnerFn = new Function("module", "exports", "require", bundleResult.outputFiles[0].text);
runnerFn(moduleExports, (moduleExports.exports = {}), require);

const {
  canCollapseLongTail,
  collapseLongTail,
  extractKeywordsAndThemes,
  INDONESIAN_STOPWORDS,
  generateEChartsOption,
  INSTITUTIONAL_PALETTES,
  profileDataset,
  DEMO_SURVEY_1_HEADERS,
  DEMO_SURVEY_1_ROWS,
} = moduleExports.exports;

console.log("✓ Modules compiled successfully.\n");

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log("  ✓ PASS: " + name);
    passedTests++;
  } catch (err) {
    console.error("  ✗ FAIL: " + name);
    console.error("    Error: " + err.message);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Smart Pareto Long-Tail Aggregator Unit Tests
// -----------------------------------------------------------------------------
console.log("--- Section 1: Smart Pareto Long-Tail Aggregator ---");

runTest("canCollapseLongTail: rejects when <= 7 items", () => {
  const items = [
    { name: "A", value: 10 },
    { name: "B", value: 8 },
    { name: "C", value: 1 },
    { name: "D", value: 1 },
  ];
  assert.strictEqual(canCollapseLongTail(items, 1), false);
});

runTest("canCollapseLongTail: rejects when fewer than 2 minor items", () => {
  const items = [
    { name: "A", value: 50 },
    { name: "B", value: 40 },
    { name: "C", value: 30 },
    { name: "D", value: 20 },
    { name: "E", value: 15 },
    { name: "F", value: 10 },
    { name: "G", value: 8 },
    { name: "H", value: 1 },
  ];
  assert.strictEqual(canCollapseLongTail(items, 1), false);
});

runTest("canCollapseLongTail: approves when > 7 items and >= 2 minor items", () => {
  const items = [
    { name: "Tuntutan akademik", value: 65 },
    { name: "Manajemen waktu", value: 48 },
    { name: "Komunikasi", value: 30 },
    { name: "Koordinasi tim", value: 25 },
    { name: "Motivasi", value: 18 },
    { name: "Beban kerja", value: 14 },
    { name: "Tekanan atasan", value: 7 },
    { name: "Latihan Atletik", value: 1 },
    { name: "staff demot", value: 1 },
  ];
  assert.strictEqual(canCollapseLongTail(items, 1), true);
});

runTest("collapseLongTail: combines minor items into Lainnya (X opsi) with sum", () => {
  const items = [
    { name: "Tuntutan akademik", value: 65 },
    { name: "Manajemen waktu", value: 48 },
    { name: "Komunikasi", value: 30 },
    { name: "Koordinasi tim", value: 25 },
    { name: "Motivasi", value: 18 },
    { name: "Beban kerja", value: 14 },
    { name: "Tekanan atasan", value: 7 },
    { name: "Latihan Atletik", value: 1 },
    { name: "staff demot", value: 1 },
    { name: "masalah personal", value: 1 },
  ];

  const result = collapseLongTail(items, true, 1);
  assert.strictEqual(result.hasCollapsed, true);
  assert.strictEqual(result.collapsedCount, 3);
  assert.strictEqual(result.totalCollapsedValue, 3);
  assert.strictEqual(result.items.length, 8);

  const aggregatedItem = result.items.find((i) => i.isAggregated);
  assert.ok(aggregatedItem, "Aggregated item must exist");
  assert.strictEqual(aggregatedItem.name, "Lainnya (3 opsi)");
  assert.strictEqual(aggregatedItem.value, 3);
  assert.deepStrictEqual(aggregatedItem.subItems, [
    "Latihan Atletik",
    "staff demot",
    "masalah personal",
  ]);
});

runTest("collapseLongTail: disabled flag preserves all original items", () => {
  const items = [
    { name: "A", value: 50 },
    { name: "B", value: 40 },
    { name: "C", value: 30 },
    { name: "D", value: 20 },
    { name: "E", value: 15 },
    { name: "F", value: 10 },
    { name: "G", value: 8 },
    { name: "H", value: 1 },
    { name: "I", value: 1 },
  ];
  const result = collapseLongTail(items, false, 1);
  assert.strictEqual(result.hasCollapsed, false);
  assert.strictEqual(result.items.length, 9);
});

// -----------------------------------------------------------------------------
// SECTION 2: Open-Ended Keyword & Topic Extractor Unit Tests
// -----------------------------------------------------------------------------
console.log("\n--- Section 2: Open-Ended Keyword & Topic Extractor ---");

runTest("extractKeywordsAndThemes: extracts compound topic phrases", () => {
  const responses = [
    "Materi manajemen stres sangat dibutuhkan fungsionaris baru.",
    "Perlu ada pelatihan manajemen stres dan regulasi emosi.",
    "Beban kerja terlalu banyak sehingga butuh manajemen waktu.",
    "Semoga upgrading ada materi manajemen stres dan studi kasus.",
  ];

  const result = extractKeywordsAndThemes(responses);
  assert.strictEqual(result.totalResponses, 4);
  assert.strictEqual(result.meaningfulResponses, 4);

  const topTopics = result.topKeywords.map((k) => k.keyword.toLowerCase());
  assert.ok(topTopics.includes("manajemen stres"), "Must extract compound topic 'manajemen stres'");

  const stressTopic = result.topKeywords.find((k) => k.keyword.toLowerCase() === "manajemen stres");
  assert.strictEqual(stressTopic.count, 3);
  assert.strictEqual(stressTopic.percentage, 75);
  assert.strictEqual(stressTopic.sampleQuotes.length, 3);
});

runTest("extractKeywordsAndThemes: filters Indonesian stopwords cleanly", () => {
  assert.ok(INDONESIAN_STOPWORDS.has("yang"));
  assert.ok(INDONESIAN_STOPWORDS.has("dan"));
  assert.ok(INDONESIAN_STOPWORDS.has("upgrading"));
  assert.ok(INDONESIAN_STOPWORDS.has("tidak"));
  assert.ok(INDONESIAN_STOPWORDS.has("bisa"));

  const responses = [
    "Yang ini dan itu bisa sangat baik agar upgrading sukses.",
  ];
  const result = extractKeywordsAndThemes(responses);
  const keywords = result.topKeywords.map((k) => k.keyword.toLowerCase());
  assert.ok(!keywords.includes("yang"));
  assert.ok(!keywords.includes("dan"));
  assert.ok(!keywords.includes("upgrading"));
});

runTest("extractKeywordsAndThemes: deduplicates keywords per respondent", () => {
  const responses = [
    "Konflik harus diselesaikan secara damai, karena konflik merusak tim dan konflik bikin stres.",
    "Saya tidak pernah mengalami masalah konflik.",
  ];
  const result = extractKeywordsAndThemes(responses);
  const conflictKw = result.topKeywords.find((k) => k.keyword.toLowerCase().includes("konflik"));
  assert.ok(conflictKw);
  assert.strictEqual(conflictKw.count, 2);
});

runTest("extractKeywordsAndThemes: handles empty or placeholder responses", () => {
  const responses = ["", "   ", "-", "tidak ada", "none", "."];
  const result = extractKeywordsAndThemes(responses);
  assert.strictEqual(result.meaningfulResponses, 0);
  assert.strictEqual(result.topKeywords.length, 0);
});

// -----------------------------------------------------------------------------
// SECTION 3: End-to-End Real World UPGRADING BEM UNDIP Dataset Tests
// -----------------------------------------------------------------------------
console.log("\n--- Section 3: Real-World UPGRADING BEM UNDIP 2026 Ingestion ---");

const dataset = profileDataset(
  DEMO_SURVEY_1_HEADERS,
  DEMO_SURVEY_1_ROWS,
  "Survei UPGRADING BEM UNDIP 2026",
  "survey_sample_1.csv"
);

runTest("Dataset profiling successfully parsed all 27 columns", () => {
  assert.strictEqual(dataset.columns.length, 27);
  assert.strictEqual(dataset.rowCount, DEMO_SURVEY_1_ROWS.length);
});

runTest("Q13 (Stress Factors) qualifies for long-tail collapse and collapses 1-count write-ins", () => {
  const q13 = dataset.columns.find((c) => c.columnIndex === 13);
  assert.ok(q13, "Q13 column must be found");
  assert.strictEqual(q13.type, "MULTI_SELECT_CHECKBOX");

  const tokenItems = q13.multiSelect.tokenFrequencies.map((tf) => ({
    name: tf.token,
    value: tf.count,
  }));

  assert.ok(tokenItems.length > 7, "Expected > 7 categories");
  assert.strictEqual(canCollapseLongTail(tokenItems, 1), true);

  const collapsed = collapseLongTail(tokenItems, true, 1);
  assert.strictEqual(collapsed.hasCollapsed, true);
  assert.ok(collapsed.collapsedCount >= 2, "Must collapse at least 2 write-ins");

  const lainnya = collapsed.items.find((i) => i.isAggregated);
  assert.ok(lainnya, "Lainnya aggregated item must exist in collapsed result");
  assert.ok(lainnya.name.startsWith("Lainnya"));
});

runTest("Q13 Horizontal Bar ECharts option renders Lainnya at the bottom and produces rich tooltip", () => {
  const q13 = dataset.columns.find((c) => c.columnIndex === 13);
  const theme = {
    fontFamily: "Plus Jakarta Sans",
    titleFontSize: 20,
    labelFontSize: 12,
    activePalette: INSTITUTIONAL_PALETTES.undip_navy_gold.colors,
    activePaletteId: "undip_navy_gold",
    globalDimensionality: "2d",
    showWatermark: true,
    watermarkText: "Biro Statistika BEM Universitas Diponegoro",
  };

  const option = generateEChartsOption(q13, theme, "2d");
  assert.strictEqual(option.series[0].type, "bar");

  const categories = option.yAxis.data;
  assert.ok(categories[0].startsWith("Lainnya"), "Lainnya should appear at index 0 of reversed array (bottom bar)");

  const seriesData = option.series[0].data;
  const bottomItem = seriesData[0];
  assert.strictEqual(bottomItem.isAggregated, true);
  assert.ok(Array.isArray(bottomItem.subItems));

  const tooltipFn = option.tooltip.formatter;
  const dummyParam = [{
    name: bottomItem.name || "Lainnya (3 opsi)",
    value: bottomItem.value,
    data: bottomItem,
  }];
  const tooltipHtml = tooltipFn(dummyParam);
  assert.ok(tooltipHtml.includes("Mencakup:"), "Tooltip must list sub-items for aggregated entry");
});

runTest("Q26 (Harapan Upgrading) classifies as OPEN_ENDED_TEXT and extracts qualitative keywords", () => {
  const q26 = dataset.columns.find((c) => c.columnIndex === 25);
  assert.ok(q26, "Q26 column must be found");
  assert.strictEqual(q26.type, "OPEN_ENDED_TEXT");
  assert.ok(q26.qualitativeSummary, "qualitativeSummary must be computed");
  assert.ok(q26.qualitativeSummary.meaningfulResponses > 50, "Should have > 50 meaningful responses");
  assert.ok(q26.qualitativeSummary.topKeywords.length > 0, "Should extract top keywords");
  assert.ok(q26.offlineSummary.includes("Topik utama yang paling sering diaspirasikan"));
});

runTest("Q26 ECharts Option renders Ranked Horizontal Bar instead of colliding vertical bar", () => {
  const q26 = dataset.columns.find((c) => c.columnIndex === 25);
  const theme = {
    fontFamily: "Plus Jakarta Sans",
    titleFontSize: 20,
    labelFontSize: 12,
    activePalette: INSTITUTIONAL_PALETTES.undip_navy_gold.colors,
    activePaletteId: "undip_navy_gold",
    globalDimensionality: "2d",
    showWatermark: true,
    watermarkText: "Biro Statistika BEM Universitas Diponegoro",
  };

  const option = generateEChartsOption(q26, theme, "2d");
  assert.strictEqual(option.series[0].type, "bar");

  assert.strictEqual(option.yAxis.type, "category");
  assert.strictEqual(option.xAxis.type, "value");

  const categories = option.yAxis.data;
  assert.ok(categories.length <= 8, "Expected <= 8 top topics");
  for (const cat of categories) {
    assert.ok(cat.length < 50, "Category label should be a concise topic");
  }

  const tooltipFn = option.tooltip.formatter;
  const dummyParam = [{
    name: categories[0],
    value: 12,
    data: { percentage: 25.5 },
  }];
  const tooltipHtml = tooltipFn(dummyParam);
  assert.ok(tooltipHtml.includes("Topik Aspirasi:"));
  assert.ok(tooltipHtml.includes("12"));
});

console.log("\n========================================================================");
console.log("  ALL " + passedTests + " / " + totalTests + " TESTS PASSED CLEANLY (exit code 0) ");
console.log("========================================================================\n");
