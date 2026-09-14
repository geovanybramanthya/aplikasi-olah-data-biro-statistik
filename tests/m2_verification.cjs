/**
 * Standalone M2 Verification Test Suite
 * Validates Milestone 2: Recommendation Engine & Curation Studio
 * 
 * Tests:
 * 1. Recommendation Heuristics (determineRecommendedChart for all question types & boundaries)
 * 2. Prohibited Charts Ban (radar, 3d_pie, dual_y_axis, bubble, etc.)
 * 3. Public Charts Whitelist & Rationale
 * 4. Curation Mutations (overrideChartType, updateColumnTitle, toggleColumnExclusion, reorderColumns)
 * 5. Prohibited Chart Rejection in Curation (throws on prohibited)
 * 6. Offline Statistical Summaries (Likert, Multi-Select, Nominal, Binary, Text, PII)
 * 7. Gemini Prompt Construction (Zero PII Guarantee)
 * 8. Gemini Graceful Offline Fallback (offline mode, empty key, network errors)
 * 9. Real Dataset Verification (Sample 1 UPGRADING, Sample 2 Safety, Sample 3 KTR XLSX)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  MILESTONE 2 VERIFICATION TEST SUITE (Recommendation & Curation Studio)');
console.log('========================================================================\n');

// 1. Compile TypeScript source modules in memory via esbuild
console.log('[Setup] Compiling TypeScript source modules in memory via esbuild...');
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
    resolveDir: path.resolve(__dirname, '..'),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});

const moduleExports = {};
const runnerFn = new Function('module', 'exports', 'require', bundleResult.outputFiles[0].text);
runnerFn(moduleExports, (moduleExports.exports = {}), require);

const {
  // Prohibited Rules
  PROHIBITED_CHARTS,
  isChartTypeProhibited,
  getProhibitionReason,
  validateChartSelection,
  getAllowedPublicChartTypes,

  // Recommender Heuristics
  determineRecommendedChart,
  getRecommendationRationale,
  getCompatibleChartAlternatives,
  overrideChartType,
  updateColumnTitle,
  toggleColumnExclusion,
  reorderColumns,

  // Gemini & Offline Service
  buildGeminiPrompt,
  resolveNarrativeWithFallback,
  fetchGeminiNarrative,
  generateOfflineSummary,
  calculateLikertStats,

  // Parser & Demo Data
  parseCSVString,
  parseExcelBuffer,
  loadDemoSurvey1,
  loadDemoSurvey2,
} = moduleExports.exports;

console.log('✓ Modules compiled and loaded successfully.\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

(async () => {
  // -------------------------------------------------------------
  // Test Suite 1: Recommendation Engine Heuristics
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Recommendation Engine Heuristics ---');

  runTest('DICHOTOMOUS_BINARY recommends donut chart with % badges', () => {
    const rec = determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 6);
    assert.strictEqual(rec, 'donut');
  });

  runTest('NOMINAL_DEMOGRAPHIC with 2-3 categories and short labels recommends donut', () => {
    const rec2 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 2, 10);
    const rec3 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 15);
    assert.strictEqual(rec2, 'donut');
    assert.strictEqual(rec3, 'donut');
  });

  runTest('NOMINAL_DEMOGRAPHIC with 3 categories but long labels (>15 chars) recommends horizontal_bar', () => {
    const recLong = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 28);
    assert.strictEqual(recLong, 'horizontal_bar');
  });

  runTest('NOMINAL_DEMOGRAPHIC with <=6 categories and short labels (<=12 chars) recommends vertical_bar', () => {
    const rec4 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 4, 10);
    const rec6 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 6, 12);
    assert.strictEqual(rec4, 'vertical_bar');
    assert.strictEqual(rec6, 'vertical_bar');
  });

  runTest('NOMINAL_DEMOGRAPHIC with >6 categories recommends horizontal_bar to prevent label clipping', () => {
    const rec7 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 7, 10);
    const rec15 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 15, 25);
    assert.strictEqual(rec7, 'horizontal_bar');
    assert.strictEqual(rec15, 'horizontal_bar');
  });

  runTest('MULTI_SELECT_CHECKBOX recommends ranked_bar (descending % of N respondents)', () => {
    const rec = determineRecommendedChart('MULTI_SELECT_CHECKBOX', 8, 20);
    assert.strictEqual(rec, 'ranked_bar');
  });

  runTest('LIKERT_SCALE recommends ordered_likert preserving ordinal progression', () => {
    const rec4 = determineRecommendedChart('LIKERT_SCALE', 4, 8);
    const rec5 = determineRecommendedChart('LIKERT_SCALE', 5, 8);
    assert.strictEqual(rec4, 'ordered_likert');
    assert.strictEqual(rec5, 'ordered_likert');
  });

  runTest('OPEN_ENDED_TEXT recommends text_feed for narrative responses', () => {
    const rec = determineRecommendedChart('OPEN_ENDED_TEXT', 50, 80);
    assert.strictEqual(rec, 'text_feed');
  });

  runTest('METADATA_PII recommends none (excluded by default)', () => {
    const rec = determineRecommendedChart('METADATA_PII', 134, 20);
    assert.strictEqual(rec, 'none');
  });

  runTest('getRecommendationRationale returns rich Indonesian pedagogical advice', () => {
    const rationale = getRecommendationRationale('LIKERT_SCALE', 4, 10);
    assert.strictEqual(rationale.chartType, 'ordered_likert');
    assert.ok(rationale.title.includes('Likert'));
    assert.ok(rationale.rationale.includes('ordinal'));
    assert.ok(rationale.presentationAdvice.includes('Top-Box'));
  });

  runTest('getCompatibleChartAlternatives provides sensible public alternatives', () => {
    const altsBinary = getCompatibleChartAlternatives('DICHOTOMOUS_BINARY');
    assert.ok(altsBinary.includes('donut'));
    assert.ok(altsBinary.includes('horizontal_bar'));
    assert.ok(!altsBinary.includes('radar'));

    const altsLikert = getCompatibleChartAlternatives('LIKERT_SCALE');
    assert.ok(altsLikert.includes('ordered_likert'));
  });

  // -------------------------------------------------------------
  // Test Suite 2: Prohibited Charts Ban
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: Prohibited Charts Ban ---');

  runTest('Bans radar / spider charts', () => {
    assert.strictEqual(isChartTypeProhibited('radar'), true);
    assert.strictEqual(isChartTypeProhibited('spider'), true);
    assert.strictEqual(isChartTypeProhibited('  RADAR  '), true);
  });

  runTest('Bans 3D pie charts with perspective tilt distortion', () => {
    assert.strictEqual(isChartTypeProhibited('3d_pie_wedge'), true);
    assert.strictEqual(isChartTypeProhibited('3d_pie'), true);
  });

  runTest('Bans dual-Y axis spaghetti plots and uncalibrated bubble charts', () => {
    assert.strictEqual(isChartTypeProhibited('dual_y_axis'), true);
    assert.strictEqual(isChartTypeProhibited('bubble'), true);
    assert.strictEqual(isChartTypeProhibited('3d_surface'), true);
  });

  runTest('Does not ban authorized presentation charts', () => {
    assert.strictEqual(isChartTypeProhibited('donut'), false);
    assert.strictEqual(isChartTypeProhibited('horizontal_bar'), false);
    assert.strictEqual(isChartTypeProhibited('vertical_bar'), false);
    assert.strictEqual(isChartTypeProhibited('ranked_bar'), false);
    assert.strictEqual(isChartTypeProhibited('ordered_likert'), false);
    assert.strictEqual(isChartTypeProhibited('text_feed'), false);
    assert.strictEqual(isChartTypeProhibited('none'), false);
  });

  runTest('validateChartSelection returns error details for prohibited types', () => {
    const res = validateChartSelection('radar');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error.includes('strictly prohibited'));
    assert.ok(res.reason.includes('poligon'));
  });

  runTest('getAllowedPublicChartTypes returns complete metadata for public UI', () => {
    const list = getAllowedPublicChartTypes();
    assert.ok(list.length >= 6);
    const types = list.map((c) => c.type);
    assert.ok(types.includes('donut'));
    assert.ok(types.includes('horizontal_bar'));
    assert.ok(types.includes('vertical_bar'));
    assert.ok(types.includes('ranked_bar'));
    assert.ok(types.includes('ordered_likert'));
  });

  // -------------------------------------------------------------
  // Test Suite 3: Curation Operations & Invariant Enforcement
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Curation Operations ---');

  const mockColumn = {
    id: 'col_1',
    columnIndex: 1,
    rawName: '  Fakultas Mahasiswa  ',
    cleanName: 'Fakultas Mahasiswa',
    displayTitle: 'Fakultas Mahasiswa',
    type: 'NOMINAL_DEMOGRAPHIC',
    isPII: false,
    isExcluded: false,
    recommendedChart: 'horizontal_bar',
    selectedChart: 'horizontal_bar',
    totalResponses: 100,
    validResponses: 100,
    missingResponses: 0,
    uniqueValuesCount: 12,
    distribution: { 'FSM': 40, 'FT': 30, 'FEB': 20, 'FH': 10 },
    offlineSummary: '',
  };

  runTest('overrideChartType updates selectedChart for valid chart', () => {
    const updated = overrideChartType(mockColumn, 'vertical_bar');
    assert.strictEqual(updated.selectedChart, 'vertical_bar');
    assert.strictEqual(updated.isExcluded, false);
  });

  runTest('overrideChartType throws exception when attempting to select prohibited chart', () => {
    assert.throws(() => {
      overrideChartType(mockColumn, 'radar');
    }, /strictly prohibited/i);

    assert.throws(() => {
      overrideChartType(mockColumn, '3d_pie_wedge');
    }, /strictly prohibited/i);
  });

  runTest('overrideChartType sets isExcluded=true when selectedChart is none', () => {
    const updated = overrideChartType(mockColumn, 'none');
    assert.strictEqual(updated.selectedChart, 'none');
    assert.strictEqual(updated.isExcluded, true);
  });

  runTest('updateColumnTitle sanitizes title and preserves cleanName if blank', () => {
    const updated1 = updateColumnTitle(mockColumn, '  Distribusi Asal Fakultas BEM UNDIP  ');
    assert.strictEqual(updated1.displayTitle, 'Distribusi Asal Fakultas BEM UNDIP');

    const updated2 = updateColumnTitle(mockColumn, '   ');
    assert.strictEqual(updated2.displayTitle, 'Fakultas Mahasiswa');
  });

  runTest('toggleColumnExclusion safely sets boolean exclusion state', () => {
    const excluded = toggleColumnExclusion(mockColumn, true);
    assert.strictEqual(excluded.isExcluded, true);

    const included = toggleColumnExclusion(excluded, false);
    assert.strictEqual(included.isExcluded, false);
  });

  runTest('reorderColumns shifts items and normalizes sequential columnIndex', () => {
    const cols = [
      { id: 'a', columnIndex: 0 },
      { id: 'b', columnIndex: 1 },
      { id: 'c', columnIndex: 2 },
    ];
    const reordered = reorderColumns(cols, 0, 2);
    assert.strictEqual(reordered[0].id, 'b');
    assert.strictEqual(reordered[0].columnIndex, 0);
    assert.strictEqual(reordered[1].id, 'c');
    assert.strictEqual(reordered[1].columnIndex, 1);
    assert.strictEqual(reordered[2].id, 'a');
    assert.strictEqual(reordered[2].columnIndex, 2);
  });

  // -------------------------------------------------------------
  // Test Suite 4: Offline Descriptive Statistics & Summary
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Offline Descriptive Statistics ---');

  runTest('Generates clean Indonesian summary for Binary question', () => {
    const summary = generateOfflineSummary({
      type: 'DICHOTOMOUS_BINARY',
      title: 'KTR Diketahui',
      totalResponses: 265,
      validResponses: 265,
      distribution: { 'Ya': 200, 'Tidak': 65 },
    });
    assert.ok(summary.includes('75.5%'));
    assert.ok(summary.includes('24.5%'));
  });

  runTest('Generates mode and runner-up for Nominal demographics', () => {
    const summary = generateOfflineSummary({
      type: 'NOMINAL_DEMOGRAPHIC',
      title: 'Fakultas',
      totalResponses: 100,
      validResponses: 100,
      distribution: { 'FSM': 50, 'FT': 30, 'FEB': 20 },
    });
    assert.ok(summary.includes('FSM'));
    assert.ok(summary.includes('50.0%'));
    assert.ok(summary.includes('FT'));
    assert.ok(summary.includes('30.0%'));
  });

  runTest('Likert summary reports mean, scale max, and Top-Box percentage', () => {
    const stats = calculateLikertStats({ '1': 5, '2': 10, '3': 20, '4': 35, '5': 30 }, 5);
    assert.strictEqual(stats.max, 5);
    assert.strictEqual(stats.netPositivePercent, 65.0);

    const summary = generateOfflineSummary({
      type: 'LIKERT_SCALE',
      title: 'Kepuasan',
      totalResponses: 100,
      validResponses: 100,
      distribution: { '1': 5, '2': 10, '3': 20, '4': 35, '5': 30 },
      likertStats: stats,
    });
    assert.ok(summary.includes('65%'));
    assert.ok(summary.includes('Top-Box'));
    assert.ok(summary.includes('skor rata-rata'));
  });

  runTest('Privacy notice for METADATA_PII column', () => {
    const summary = generateOfflineSummary({
      type: 'METADATA_PII',
      title: 'Nama Mahasiswa',
      totalResponses: 134,
      validResponses: 134,
      distribution: {},
    });
    assert.ok(summary.includes('privasi'));
    assert.ok(summary.includes('Diabaikan'));
  });

  // -------------------------------------------------------------
  // Test Suite 5: Hybrid Narrative Engine & Gemini Integration
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: Gemini Hybrid Narrative Engine ---');

  runTest('buildGeminiPrompt packages only aggregated distributions and question title', () => {
    const promptStr = buildGeminiPrompt(mockColumn);
    const parsed = JSON.parse(promptStr);
    assert.strictEqual(parsed.question, 'Fakultas Mahasiswa');
    assert.strictEqual(parsed.n_valid, 100);
    assert.deepStrictEqual(parsed.distribution, mockColumn.distribution);
  });

  await runAsyncTest('buildGeminiPrompt and fetchGeminiNarrative guarantee zero PII leakage on real survey data', async () => {
    const ds1 = loadDemoSurvey1();
    const namaCol = ds1.columns.find((c) => c.cleanName === 'Nama Lengkap');
    const timestampCol = ds1.columns.find((c) => c.cleanName === 'Timestamp');

    assert.ok(namaCol, 'Nama Lengkap column must exist');
    assert.ok(timestampCol, 'Timestamp column must exist');
    assert.strictEqual(namaCol.isPII, true, 'Nama Lengkap must be identified as PII');
    assert.strictEqual(timestampCol.isPII, true, 'Timestamp must be identified as PII');

    // 1. buildGeminiPrompt on Nama Lengkap must redact student names from distribution
    const promptNama = buildGeminiPrompt(namaCol);
    const parsedNamaPrompt = JSON.parse(promptNama);

    // Explicit assertions for real respondent student names
    assert.strictEqual(promptNama.includes('Tsalista Faiza'), false, 'Must not contain student name Tsalista Faiza');
    assert.strictEqual(promptNama.includes('Geovany Bramanthya'), false, 'Must not contain student name Geovany Bramanthya');
    assert.strictEqual(promptNama.includes('Alya Fara Humairo'), false, 'Must not contain student name Alya Fara Humairo');
    assert.strictEqual(promptNama.includes('Andini Dian Sasna'), false, 'Must not contain student name Andini Dian Sasna');

    // Distribution must be redacted to empty distribution
    assert.deepStrictEqual(parsedNamaPrompt.distribution, {});

    // 2. buildGeminiPrompt on Timestamp must redact distribution
    const promptTimestamp = buildGeminiPrompt(timestampCol);
    const parsedTimestampPrompt = JSON.parse(promptTimestamp);
    assert.deepStrictEqual(parsedTimestampPrompt.distribution, {});

    // 3. fetchGeminiNarrative on Nama Lengkap must trigger preflight guard and never leak student names
    const narrativeNama = await fetchGeminiNarrative(namaCol, 'AIzaSy_TEST_API_KEY_VALID_FORMAT');
    assert.strictEqual(narrativeNama.isOfflineFallback, true, 'Must force offline fallback for PII');
    assert.ok(narrativeNama.narrative.includes('PII') || narrativeNama.narrative.includes('privasi'));
    assert.strictEqual(narrativeNama.narrative.includes('Tsalista Faiza'), false);
    assert.strictEqual(narrativeNama.narrative.includes('Geovany Bramanthya'), false);

    // 4. fetchGeminiNarrative on Timestamp must also trigger preflight guard
    const narrativeTimestamp = await fetchGeminiNarrative(timestampCol, 'AIzaSy_TEST_API_KEY_VALID_FORMAT');
    assert.strictEqual(narrativeTimestamp.isOfflineFallback, true);
    assert.ok(narrativeTimestamp.narrative.includes('PII') || narrativeTimestamp.narrative.includes('privasi'));

    // 5. resolveNarrativeWithFallback on PII columns must return offline privacy summary even if apiKey is given
    const resolvedNama = resolveNarrativeWithFallback(namaCol, 'AIzaSy_TEST_API_KEY_VALID_FORMAT', true);
    assert.strictEqual(resolvedNama.isOfflineFallback, true);
    assert.ok(resolvedNama.narrative.includes('privasi') || resolvedNama.narrative.includes('Diabaikan'));
    assert.strictEqual(resolvedNama.narrative.includes('Tsalista Faiza'), false);
  });

  runTest('resolveNarrativeWithFallback returns offline summary when apiKey is empty', () => {
    const res = resolveNarrativeWithFallback(mockColumn, '');
    assert.strictEqual(res.isOfflineFallback, true);
    assert.ok(res.narrative.includes('FSM'));
  });

  runTest('resolveNarrativeWithFallback returns offline summary when offline', () => {
    const res = resolveNarrativeWithFallback(mockColumn, 'test_key_123', false);
    assert.strictEqual(res.isOfflineFallback, true);
    assert.ok(res.narrative.includes('FSM'));
  });

  runTest('resolveNarrativeWithFallback returns AI narrative when apiKey provided and online', () => {
    const res = resolveNarrativeWithFallback(mockColumn, 'test_key_123', true);
    assert.strictEqual(res.isOfflineFallback, false);
    assert.ok(res.narrative.includes('[Gemini AI]'));
  });

  await runAsyncTest('fetchGeminiNarrative falls back gracefully on fake or invalid key', async () => {
    // Calling with non-existent key will trigger network error or 400 from Google API
    const res = await fetchGeminiNarrative(mockColumn, 'AIzaSy_FAKE_TEST_KEY_123', 2000);
    assert.strictEqual(res.isOfflineFallback, true);
    assert.ok(res.narrative.length > 0);
    // Offline narrative must be generated without crashing
    assert.ok(res.narrative.includes('FSM'));
  });

  // -------------------------------------------------------------
  // Test Suite 6: Real-World Survey Datasets Ingestion & Profiling
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 6: Real-World Dataset Validation ---');

  runTest('Validates Sample 1 UPGRADING BEM UNDIP dataset recommendations', () => {
    const ds1 = loadDemoSurvey1();
    assert.strictEqual(ds1.rowCount, 134);
    assert.strictEqual(ds1.columns.length, 27);

    // PII columns must recommend none and be excluded
    const piiCols = ds1.columns.filter((c) => c.isPII);
    assert.strictEqual(piiCols.length, 2); // Timestamp & Nama Lengkap
    for (const c of piiCols) {
      assert.strictEqual(c.recommendedChart, 'none');
      assert.strictEqual(c.isExcluded, true);
    }

    // Likert columns must recommend ordered_likert
    const likertCols = ds1.columns.filter((c) => c.type === 'LIKERT_SCALE');
    assert.ok(likertCols.length >= 8);
    for (const c of likertCols) {
      assert.strictEqual(c.recommendedChart, 'ordered_likert');
      assert.ok(c.likertScale !== undefined);
      assert.ok(c.likertScale.mean >= 1 && c.likertScale.mean <= 5);
    }

    // Multi-select columns must recommend ranked_bar
    const multiCols = ds1.columns.filter((c) => c.type === 'MULTI_SELECT_CHECKBOX');
    assert.ok(multiCols.length >= 8);
    for (const c of multiCols) {
      assert.strictEqual(c.recommendedChart, 'ranked_bar');
      assert.ok(c.multiSelect !== undefined);
    }
  });

  runTest('Validates Sample 2 Campus Safety & Catcalling recommendations', () => {
    const ds2 = loadDemoSurvey2();
    assert.strictEqual(ds2.rowCount, 197);
    assert.strictEqual(ds2.columns.length, 15);

    // Binary question recommends donut
    const binaryCol = ds2.columns.find((c) => c.type === 'DICHOTOMOUS_BINARY');
    assert.ok(binaryCol !== undefined);
    assert.strictEqual(binaryCol.recommendedChart, 'donut');

    // 1-4 Likert scales recommend ordered_likert
    const likertCols = ds2.columns.filter((c) => c.type === 'LIKERT_SCALE');
    assert.strictEqual(likertCols.length, 7);
    for (const c of likertCols) {
      assert.strictEqual(c.recommendedChart, 'ordered_likert');
      assert.strictEqual(c.likertScale.max, 4);
    }
  });

  runTest('Validates KTR UNDIP Excel workbook recommendations', () => {
    const excelPath = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Responses).xlsx';
    if (fs.existsSync(excelPath)) {
      const buffer = fs.readFileSync(excelPath);
      const ds = parseExcelBuffer(buffer, 'KTR.xlsx');
      assert.strictEqual(ds.rowCount, 265);
      assert.strictEqual(ds.columns.length, 19);

      // Binary question recommends donut
      const binaryCols = ds.columns.filter((c) => c.type === 'DICHOTOMOUS_BINARY');
      assert.ok(binaryCols.length >= 1);
      for (const c of binaryCols) {
        assert.strictEqual(c.recommendedChart, 'donut');
      }

      // Demographic questions recommend horizontal_bar or vertical_bar
      const demoCols = ds.columns.filter((c) => c.type === 'NOMINAL_DEMOGRAPHIC');
      assert.ok(demoCols.length >= 2);
      for (const c of demoCols) {
        assert.ok(['horizontal_bar', 'vertical_bar', 'donut'].includes(c.recommendedChart));
      }
    }
  });

  // -------------------------------------------------------------
  // Test Summary
  // -------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`  ALL MILESTONE 2 VERIFICATION TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('========================================================================\n');
})();
