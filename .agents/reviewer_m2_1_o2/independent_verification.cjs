const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  INDEPENDENT ADVERSARIAL VERIFICATION: REVIEWER_M2_1');
console.log('========================================================================\n');

// Compile source TypeScript modules in memory via esbuild
const rootDir = path.resolve(__dirname, '..', '..');
const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from './src/core/recommender/prohibitedRules';
      export * from './src/core/recommender/chartHeuristics';
      export * from './src/services/geminiService';
      export * from './src/core/profiler/statistics';
      export * from './src/core/parser/csvParser';
      export * from './src/core/parser/excelParser';
      export * from './src/services/demoDataService';
    `,
    resolveDir: rootDir,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});

const moduleExports = {};
new Function('module', 'exports', 'require', bundleResult.outputFiles[0].text)(
  moduleExports,
  (moduleExports.exports = {}),
  require
);

const {
  PROHIBITED_CHARTS,
  isChartTypeProhibited,
  getProhibitionReason,
  validateChartSelection,
  getAllowedPublicChartTypes,
  determineRecommendedChart,
  getRecommendationRationale,
  getCompatibleChartAlternatives,
  overrideChartType,
  updateColumnTitle,
  toggleColumnExclusion,
  reorderColumns,
  parseCSVString,
  parseExcelBuffer,
  loadDemoSurvey1,
  loadDemoSurvey2,
} = moduleExports.exports;

let testsPassed = 0;
let testsFailed = 0;

function verify(name, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    testsFailed++;
    console.error(`  ✗ FAIL: ${name} -> ${err.message}`);
    throw err;
  }
}

async function verifyAsync(name, fn) {
  try {
    await fn();
    testsPassed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    testsFailed++;
    console.error(`  ✗ FAIL: ${name} -> ${err.message}`);
    throw err;
  }
}

(async () => {
  console.log('--- 1. Prohibited Charts Enforcement Verification ---');

  const expectedProhibited = [
    'radar',
    'spider',
    '3d_pie_wedge',
    '3d_pie',
    'dual_y_axis',
    'bubble',
    '3d_surface',
  ];

  verify('PROHIBITED_CHARTS contains exactly the 7 expected forbidden charts', () => {
    assert.strictEqual(PROHIBITED_CHARTS.length, 7);
    for (const chart of expectedProhibited) {
      assert.ok(PROHIBITED_CHARTS.includes(chart), `Missing prohibited chart: ${chart}`);
    }
  });

  verify('isChartTypeProhibited detects all prohibited charts and casing/whitespace variants', () => {
    for (const chart of expectedProhibited) {
      assert.strictEqual(isChartTypeProhibited(chart), true, `Failed on: ${chart}`);
      assert.strictEqual(isChartTypeProhibited(chart.toUpperCase()), true, `Failed on uppercase: ${chart}`);
      assert.strictEqual(isChartTypeProhibited(`  ${chart}  `), true, `Failed on padded: ${chart}`);
      assert.strictEqual(isChartTypeProhibited(`\t${chart}\n`), true, `Failed on whitespace: ${chart}`);
    }
  });

  verify('isChartTypeProhibited safely returns false for null/undefined/empty/valid charts', () => {
    assert.strictEqual(isChartTypeProhibited(null), false);
    assert.strictEqual(isChartTypeProhibited(undefined), false);
    assert.strictEqual(isChartTypeProhibited(''), false);
    assert.strictEqual(isChartTypeProhibited('   '), false);
    assert.strictEqual(isChartTypeProhibited('donut'), false);
    assert.strictEqual(isChartTypeProhibited('vertical_bar'), false);
    assert.strictEqual(isChartTypeProhibited('horizontal_bar'), false);
    assert.strictEqual(isChartTypeProhibited('ranked_bar'), false);
    assert.strictEqual(isChartTypeProhibited('ordered_likert'), false);
    assert.strictEqual(isChartTypeProhibited('text_feed'), false);
    assert.strictEqual(isChartTypeProhibited('none'), false);
  });

  verify('validateChartSelection returns invalid and clear reason for all prohibited charts', () => {
    for (const chart of expectedProhibited) {
      const res = validateChartSelection(chart);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error && res.error.includes(chart));
      assert.ok(res.reason && res.reason.length > 10);
    }
  });

  verify('validateChartSelection returns valid for all allowed public charts', () => {
    const allowed = ['donut', 'vertical_bar', 'horizontal_bar', 'ranked_bar', 'ordered_likert', 'text_feed', 'none'];
    for (const chart of allowed) {
      const res = validateChartSelection(chart);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.error, undefined);
    }
  });

  const dummyColumn = {
    id: 'col_1_test',
    columnIndex: 0,
    rawName: 'Pertanyaan Uji',
    cleanName: 'Pertanyaan Uji',
    displayTitle: 'Pertanyaan Uji',
    type: 'NOMINAL_DEMOGRAPHIC',
    isPII: false,
    isExcluded: false,
    recommendedChart: 'horizontal_bar',
    selectedChart: 'horizontal_bar',
    totalResponses: 50,
    validResponses: 50,
    missingResponses: 0,
    uniqueValuesCount: 5,
    distribution: { A: 10, B: 10, C: 10, D: 10, E: 10 },
    offlineSummary: 'Ringkasan uji.',
  };

  verify('overrideChartType throws Error for each of the 7 prohibited charts and variants', () => {
    for (const chart of expectedProhibited) {
      assert.throws(
        () => overrideChartType(dummyColumn, chart),
        /strictly prohibited/i,
        `Did not throw for prohibited chart: ${chart}`
      );
      assert.throws(
        () => overrideChartType(dummyColumn, chart.toUpperCase()),
        /strictly prohibited/i,
        `Did not throw for uppercase prohibited chart: ${chart}`
      );
    }
  });

  verify('overrideChartType immutably updates column for valid charts and synchronizes isExcluded for none', () => {
    const updatedDonut = overrideChartType(dummyColumn, 'donut');
    assert.strictEqual(updatedDonut.selectedChart, 'donut');
    assert.strictEqual(updatedDonut.isExcluded, false);
    assert.strictEqual(dummyColumn.selectedChart, 'horizontal_bar'); // immutability

    const updatedNone = overrideChartType(dummyColumn, 'none');
    assert.strictEqual(updatedNone.selectedChart, 'none');
    assert.strictEqual(updatedNone.isExcluded, true);
  });

  console.log('\n--- 2. Recommendation Engine Heuristics Verification ---');

  verify('DICHOTOMOUS_BINARY recommends donut', () => {
    assert.strictEqual(determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 5), 'donut');
    assert.strictEqual(determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 50), 'donut');
  });

  verify('LIKERT_SCALE recommends ordered_likert', () => {
    assert.strictEqual(determineRecommendedChart('LIKERT_SCALE', 4, 10), 'ordered_likert');
    assert.strictEqual(determineRecommendedChart('LIKERT_SCALE', 5, 20), 'ordered_likert');
  });

  verify('MULTI_SELECT_CHECKBOX recommends ranked_bar', () => {
    assert.strictEqual(determineRecommendedChart('MULTI_SELECT_CHECKBOX', 8, 25), 'ranked_bar');
  });

  verify('OPEN_ENDED_TEXT recommends text_feed', () => {
    assert.strictEqual(determineRecommendedChart('OPEN_ENDED_TEXT', 100, 150), 'text_feed');
  });

  verify('METADATA_PII recommends none', () => {
    assert.strictEqual(determineRecommendedChart('METADATA_PII', 134, 30), 'none');
  });

  verify('NOMINAL_DEMOGRAPHIC boundaries (donut, vertical_bar, horizontal_bar)', () => {
    // 2-3 categories & short labels (<=15 chars) -> donut
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 1, 5), 'donut');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 2, 10), 'donut');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 15), 'donut');

    // 3 categories with long label (>15 chars) -> horizontal_bar
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 16), 'horizontal_bar');

    // 4-6 categories with short labels (<=12 chars) -> vertical_bar
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 4, 10), 'vertical_bar');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 5, 12), 'vertical_bar');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 6, 12), 'vertical_bar');

    // 4-6 categories with longer labels (>12 chars) -> horizontal_bar
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 4, 13), 'horizontal_bar');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 6, 15), 'horizontal_bar');

    // >6 categories -> horizontal_bar regardless of label length
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 7, 5), 'horizontal_bar');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 15, 20), 'horizontal_bar');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 50, 10), 'horizontal_bar');
  });

  console.log('\n--- 3. Real Dataset Integration Verification ---');

  await verifyAsync('Raw CSV File 1 (survey_sample_1.csv) recommendation integrity', async () => {
    const sample1Path = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
    const content = fs.readFileSync(sample1Path, 'utf8');
    const ds = await parseCSVString(content, 'survey_sample_1.csv');
    assert.strictEqual(ds.rowCount, 134);
    assert.strictEqual(ds.columns.length, 27);

    for (const col of ds.columns) {
      assert.strictEqual(isChartTypeProhibited(col.recommendedChart), false);
      assert.strictEqual(isChartTypeProhibited(col.selectedChart), false);
      if (col.isPII) {
        assert.strictEqual(col.recommendedChart, 'none');
        assert.strictEqual(col.isExcluded, true);
      }
      if (col.type === 'LIKERT_SCALE') {
        assert.strictEqual(col.recommendedChart, 'ordered_likert');
      }
      if (col.type === 'MULTI_SELECT_CHECKBOX') {
        assert.strictEqual(col.recommendedChart, 'ranked_bar');
      }
    }
  });

  await verifyAsync('Raw CSV File 2 (survey_sample_2.csv) recommendation integrity', async () => {
    const sample2Path = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_2.csv';
    const content = fs.readFileSync(sample2Path, 'utf8');
    const ds = await parseCSVString(content, 'survey_sample_2.csv');
    assert.strictEqual(ds.rowCount, 197);
    assert.strictEqual(ds.columns.length, 15);

    for (const col of ds.columns) {
      assert.strictEqual(isChartTypeProhibited(col.recommendedChart), false);
      assert.strictEqual(isChartTypeProhibited(col.selectedChart), false);
      if (col.isPII) {
        assert.strictEqual(col.recommendedChart, 'none');
        assert.strictEqual(col.isExcluded, true);
      }
      if (col.type === 'DICHOTOMOUS_BINARY') {
        assert.strictEqual(col.recommendedChart, 'donut');
      }
      if (col.type === 'LIKERT_SCALE') {
        assert.strictEqual(col.recommendedChart, 'ordered_likert');
      }
    }
  });

  verify('Excel Workbook (KTR.xlsx) recommendation integrity', () => {
    const excelPath = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx';
    const buffer = fs.readFileSync(excelPath);
    const ds = parseExcelBuffer(buffer, 'KTR.xlsx');
    assert.strictEqual(ds.rowCount, 265);
    assert.strictEqual(ds.columns.length, 19);

    for (const col of ds.columns) {
      assert.strictEqual(isChartTypeProhibited(col.recommendedChart), false);
      assert.strictEqual(isChartTypeProhibited(col.selectedChart), false);
      if (col.isPII) {
        assert.strictEqual(col.recommendedChart, 'none');
        assert.strictEqual(col.isExcluded, true);
      }
      if (col.type === 'DICHOTOMOUS_BINARY') {
        assert.strictEqual(col.recommendedChart, 'donut');
      }
    }
  });

  console.log('\n========================================================================');
  console.log(`  ALL INDEPENDENT VERIFICATIONS PASSED: ${testsPassed}/${testsPassed + testsFailed}`);
  console.log('========================================================================\n');
})();
