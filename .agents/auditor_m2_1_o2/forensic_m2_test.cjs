/**
 * Forensic Integrity & Adversarial Audit Script for Milestone 2
 * Author: auditor_m2_1
 * Date: 2026-09-14
 */

const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  FORENSIC INTEGRITY AUDIT — MILESTONE 2');
console.log('========================================================================\n');

// 1. Compile in-memory
const projectRoot = path.resolve(__dirname, '..', '..');
const bundle = esbuild.buildSync({
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
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});

const exportsObj = {};
const runner = new Function('module', 'exports', 'require', bundle.outputFiles[0].text);
runner(exportsObj, (exportsObj.exports = {}), require);

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
  buildGeminiPrompt,
  resolveNarrativeWithFallback,
  fetchGeminiNarrative,
  generateOfflineSummary,
  calculateLikertStats,
  loadDemoSurvey1,
  loadDemoSurvey2,
} = exportsObj.exports;

let checksPassed = 0;
let totalChecks = 0;

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    checksPassed++;
    console.log(`  [PASS] ${desc}`);
  } catch (e) {
    console.error(`  [FAIL] ${desc}: ${e.message}`);
    throw e;
  }
}

async function checkAsync(desc, fn) {
  totalChecks++;
  try {
    await fn();
    checksPassed++;
    console.log(`  [PASS] ${desc}`);
  } catch (e) {
    console.error(`  [FAIL] ${desc}: ${e.message}`);
    throw e;
  }
}

// -------------------------------------------------------------
// Check 1: Recommendation Engine Heuristics & Boundary Logic
// -------------------------------------------------------------
console.log('--- 1. Recommendation Engine Heuristics & Boundary Logic ---');

check('NOMINAL_DEMOGRAPHIC boundaries (uniqueCount: 3, labelLen: 15 -> donut; labelLen: 16 -> horizontal_bar)', () => {
  assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 15), 'donut');
  assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 16), 'horizontal_bar');
});

check('NOMINAL_DEMOGRAPHIC boundaries (uniqueCount: 6, labelLen: 12 -> vertical_bar; uniqueCount: 7 -> horizontal_bar)', () => {
  assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 6, 12), 'vertical_bar');
  assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 7, 12), 'horizontal_bar');
  assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 6, 13), 'horizontal_bar');
});

check('All 6 Question Types map to permissible chart types without exceptions', () => {
  const types = [
    'METADATA_PII',
    'DICHOTOMOUS_BINARY',
    'LIKERT_SCALE',
    'MULTI_SELECT_CHECKBOX',
    'NOMINAL_DEMOGRAPHIC',
    'OPEN_ENDED_TEXT',
  ];
  for (const t of types) {
    const rec = determineRecommendedChart(t, 4, 10);
    assert.strictEqual(typeof rec, 'string');
    assert.strictEqual(isChartTypeProhibited(rec), false);
  }
});

check('Synthetic unknown type falls back safely to horizontal_bar', () => {
  const rec = determineRecommendedChart('UNKNOWN_CUSTOM_TYPE', 5, 10);
  assert.strictEqual(rec, 'horizontal_bar');
});

// -------------------------------------------------------------
// Check 2: Prohibited Charts Ban & Enforcement Rigor
// -------------------------------------------------------------
console.log('\n--- 2. Prohibited Charts Enforcement Rigor ---');

check('Prohibited chart list contains all 7 mandated prohibited types', () => {
  const expected = ['radar', 'spider', '3d_pie_wedge', '3d_pie', 'dual_y_axis', 'bubble', '3d_surface'];
  for (const exp of expected) {
    assert.ok(PROHIBITED_CHARTS.includes(exp), `Missing prohibited chart: ${exp}`);
    assert.strictEqual(isChartTypeProhibited(exp), true);
    assert.strictEqual(isChartTypeProhibited(exp.toUpperCase()), true);
    assert.strictEqual(isChartTypeProhibited(`  ${exp}  `), true);
  }
});

check('Null, undefined, or empty string are not flagged as prohibited charts', () => {
  assert.strictEqual(isChartTypeProhibited(null), false);
  assert.strictEqual(isChartTypeProhibited(undefined), false);
  assert.strictEqual(isChartTypeProhibited(''), false);
});

check('Allowed chart types returns 7 distinct public types with complete metadata', () => {
  const allowed = getAllowedPublicChartTypes();
  assert.strictEqual(allowed.length, 7);
  const types = allowed.map((a) => a.type);
  assert.deepStrictEqual(types.sort(), [
    'donut',
    'horizontal_bar',
    'none',
    'ordered_likert',
    'ranked_bar',
    'text_feed',
    'vertical_bar',
  ].sort());
  for (const a of allowed) {
    assert.ok(a.label.length > 0);
    assert.ok(a.description.length > 0);
    assert.ok(a.bestFor.length > 0);
    assert.ok(a.icon.length > 0);
  }
});

// -------------------------------------------------------------
// Check 3: Curation Mutations & Immutability Integrity
// -------------------------------------------------------------
console.log('\n--- 3. Curation Mutations & Immutability Integrity ---');

const dummyColumn = {
  id: 'col_forensic',
  columnIndex: 0,
  rawName: '  Biro / Bidang Minat Mahasiswa  ',
  cleanName: 'Biro / Bidang Minat Mahasiswa',
  displayTitle: 'Biro / Bidang Minat Mahasiswa',
  type: 'NOMINAL_DEMOGRAPHIC',
  isPII: false,
  isExcluded: false,
  recommendedChart: 'horizontal_bar',
  selectedChart: 'horizontal_bar',
  totalResponses: 50,
  validResponses: 50,
  missingResponses: 0,
  uniqueValuesCount: 5,
  distribution: { 'Kestari': 15, 'Humas': 12, 'Sospol': 10, 'Ekraf': 8, 'Riset': 5 },
  offlineSummary: '',
};

check('overrideChartType strictly rejects prohibited charts with descriptive error', () => {
  for (const prohibited of PROHIBITED_CHARTS) {
    assert.throws(
      () => overrideChartType(dummyColumn, prohibited),
      (err) => err.message.includes('strictly prohibited')
    );
  }
});

check('overrideChartType creates a new object without mutating original (immutability)', () => {
  const modified = overrideChartType(dummyColumn, 'donut');
  assert.notStrictEqual(modified, dummyColumn);
  assert.strictEqual(dummyColumn.selectedChart, 'horizontal_bar');
  assert.strictEqual(modified.selectedChart, 'donut');
  assert.strictEqual(modified.isExcluded, false);
});

check('updateColumnTitle sanitizes input and trims whitespace without mutating original', () => {
  const updated = updateColumnTitle(dummyColumn, '   Minat Biro BEM   ');
  assert.strictEqual(updated.displayTitle, 'Minat Biro BEM');
  assert.strictEqual(dummyColumn.displayTitle, 'Biro / Bidang Minat Mahasiswa');
});

check('updateColumnTitle falls back to cleanName when blank string is passed', () => {
  const updated = updateColumnTitle(dummyColumn, '     ');
  assert.strictEqual(updated.displayTitle, dummyColumn.cleanName);
});

check('toggleColumnExclusion safely sets boolean state without mutation', () => {
  const toggled = toggleColumnExclusion(dummyColumn, true);
  assert.strictEqual(toggled.isExcluded, true);
  assert.strictEqual(dummyColumn.isExcluded, false);
});

check('reorderColumns handles invalid indices gracefully without throwing', () => {
  const list = [
    { id: '1', columnIndex: 0 },
    { id: '2', columnIndex: 1 },
  ];
  const outOfBounds1 = reorderColumns(list, -1, 1);
  assert.deepStrictEqual(outOfBounds1, list);
  const outOfBounds2 = reorderColumns(list, 0, 99);
  assert.deepStrictEqual(outOfBounds2, list);
});

// -------------------------------------------------------------
// Check 4: PII Privacy Audit & Gemini Prompt Inspection
// -------------------------------------------------------------
console.log('\n--- 4. PII Privacy Audit & Prompt Sanitization ---');

check('buildGeminiPrompt extracts ONLY aggregated distributions, never student identifiers', () => {
  const piiCol = {
    ...dummyColumn,
    id: 'col_pii',
    rawName: 'Nama Lengkap Mahasiswa',
    cleanName: 'Nama Lengkap Mahasiswa',
    displayTitle: 'Nama Lengkap Mahasiswa',
    type: 'METADATA_PII',
    isPII: true,
    distribution: { 'Budi Santoso': 1, 'Siti Rahma': 1 },
    rawRows: [
      { 'Nama Lengkap Mahasiswa': 'Budi Santoso', NIM: '24060121130001' },
      { 'Nama Lengkap Mahasiswa': 'Siti Rahma', NIM: '24060121130002' },
    ],
  };

  const prompt = buildGeminiPrompt(piiCol);
  const parsed = JSON.parse(prompt);

  // Assert structure
  assert.strictEqual(parsed.role, 'Analis Kebijakan Mahasiswa BEM Universitas Diponegoro');
  assert.strictEqual(parsed.question, 'Nama Lengkap Mahasiswa');
  assert.strictEqual(parsed.type, 'METADATA_PII');
  assert.strictEqual(parsed.n_valid, 50);

  // Assert rawRows and NIM are strictly NOT in payload
  assert.strictEqual(parsed.rawRows, undefined);
  assert.strictEqual(prompt.includes('24060121130001'), false);
  assert.strictEqual(prompt.includes('24060121130002'), false);
});

// -------------------------------------------------------------
// Check 5: Offline Statistics Correctness on Edge Cases
// -------------------------------------------------------------
console.log('\n--- 5. Offline Statistics Mathematical Correctness ---');

check('Likert stats correctly computes mean, median, and Top-Box for skewed distributions', () => {
  // All respondents gave score 5
  const statsAll5 = calculateLikertStats({ '1': 0, '2': 0, '3': 0, '4': 0, '5': 100 }, 5);
  assert.strictEqual(statsAll5.mean, 5.0);
  assert.strictEqual(statsAll5.median, 5);
  assert.strictEqual(statsAll5.netPositivePercent, 100.0);

  // All respondents gave score 1
  const statsAll1 = calculateLikertStats({ '1': 100, '2': 0, '3': 0, '4': 0, '5': 0 }, 5);
  assert.strictEqual(statsAll1.mean, 1.0);
  assert.strictEqual(statsAll1.median, 1);
  assert.strictEqual(statsAll1.netPositivePercent, 0.0);

  // 4-point scale with even count (median interpolation)
  const stats4 = calculateLikertStats({ '1': 20, '2': 30, '3': 30, '4': 20 }, 4);
  assert.strictEqual(stats4.mean, 2.5);
  assert.strictEqual(stats4.median, 2.5);
  assert.strictEqual(stats4.netPositivePercent, 20.0); // only 4 is >= 4
});

check('generateOfflineSummary generates accurate Indonesian prose for single-choice unanimous vote', () => {
  const summary = generateOfflineSummary({
    type: 'DICHOTOMOUS_BINARY',
    title: 'Persetujuan',
    totalResponses: 100,
    validResponses: 100,
    distribution: { 'Setuju': 100 },
  });
  assert.ok(summary.includes('100.0%'));
  assert.ok(summary.includes('Setuju'));
});

// -------------------------------------------------------------
// Check 6: Gemini Offline Degradation & Error Recovery
// -------------------------------------------------------------
console.log('\n--- 6. Gemini Service Offline Degradation ---');

check('resolveNarrativeWithFallback returns offline statistical summary when apiKey is missing or offline', () => {
  const resOffline = resolveNarrativeWithFallback(dummyColumn, '', false);
  assert.strictEqual(resOffline.isOfflineFallback, true);
  assert.ok(resOffline.narrative.includes('Kestari'));

  const resOnlineNoKey = resolveNarrativeWithFallback(dummyColumn, '   ', true);
  assert.strictEqual(resOnlineNoKey.isOfflineFallback, true);
  assert.ok(resOnlineNoKey.narrative.includes('Kestari'));
});

check('resolveNarrativeWithFallback produces AI narrative preview when apiKey is provided and online', () => {
  const resWithKey = resolveNarrativeWithFallback(dummyColumn, 'AIzaSy_ValidKeySample', true);
  assert.strictEqual(resWithKey.isOfflineFallback, false);
  assert.ok(resWithKey.narrative.startsWith('[Gemini AI]'));
});

(async () => {
  await checkAsync('fetchGeminiNarrative degrades cleanly when given invalid API key or abort signal', async () => {
    const res = await fetchGeminiNarrative(dummyColumn, 'AIzaSy_InvalidKey_ForensicTest', 2500);
    assert.strictEqual(res.isOfflineFallback, true);
    assert.ok(res.narrative.length > 0);
    assert.ok(res.error !== undefined);
  });

  console.log('\n========================================================================');
  console.log(`  FORENSIC AUDIT COMPLETE: ${checksPassed}/${totalChecks} CHECKS PASSED`);
  console.log('========================================================================\n');
})();
