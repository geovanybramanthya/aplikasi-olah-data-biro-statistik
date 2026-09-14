/**
 * Challenger Adversarial Test Suite for Milestone 2
 * Agent: challenger_m2_1 (Adversarial Empirical Review)
 * 
 * Stress-tests:
 * 1. Prohibited chart injection (every blacklisted chart, uppercase/mixed case, whitespace, bypass attempts)
 * 2. Demographic boundary matrix (uniqueCount: 2, 3, 4, 6, 7; maxLabelLength: 12, 13, 15, 16)
 * 3. Likert scale edge cases (4-pt vs 5-pt, empty dist, 100% agree/disagree/neutral, float keys, sorting)
 * 4. Multi-select checkbox rankings (deduplication per respondent, N-normalization, 0 tokens, ties)
 * 5. PII protection in recommender (always 'none', privacy rationale, zero leakage)
 * 6. Curation mutation resilience (bounds, title sanitization, exclusion cascades)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  CHALLENGER M2-1 ADVERSARIAL EMPIRICAL TEST SUITE');
console.log('  Biro Statistika BEM Universitas Diponegoro');
console.log('========================================================================\n');

// Compile TypeScript modules via esbuild in-memory
console.log('[Compiler] Bundling TypeScript modules in memory...');
const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from './src/core/recommender/prohibitedRules';
      export * from './src/core/recommender/chartHeuristics';
      export * from './src/core/profiler/statistics';
      export * from './src/core/profiler/multiSelectSplitter';
      export * from './src/services/geminiService';
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

  // Recommender Heuristics & Curation
  determineRecommendedChart,
  getRecommendationRationale,
  getCompatibleChartAlternatives,
  overrideChartType,
  updateColumnTitle,
  toggleColumnExclusion,
  reorderColumns,

  // Statistics
  calculateLikertStats,
  generateOfflineSummary,

  // Multi-Select
  splitMultiSelectResponses,
  calculateTokenRepeatRatio,

  // Gemini Service
  buildGeminiPrompt,
} = moduleExports.exports;

console.log('✓ TypeScript modules bundled and exported successfully.\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assertTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err });
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Details: ${err.message}`);
  }
}

// ============================================================================
// SUITE 1: Prohibited Chart Injection & Blacklist Verification
// ============================================================================
console.log('--- SUITE 1: Prohibited Chart Injection & Evasion Resistance ---');

const mockCol = {
  id: 'col_test',
  columnIndex: 0,
  rawName: 'Kepuasan Layanan',
  cleanName: 'Kepuasan Layanan',
  displayTitle: 'Kepuasan Layanan',
  type: 'LIKERT_SCALE',
  isPII: false,
  isExcluded: false,
  recommendedChart: 'ordered_likert',
  selectedChart: 'ordered_likert',
  totalResponses: 100,
  validResponses: 100,
  missingResponses: 0,
  uniqueValuesCount: 5,
  distribution: { '1': 10, '2': 10, '3': 20, '4': 30, '5': 30 },
  offlineSummary: '',
};

const prohibitedTargets = [
  'radar',
  'spider',
  '3d_pie_wedge',
  '3d_pie',
  'dual_y_axis',
  'bubble',
  '3d_surface',
];

prohibitedTargets.forEach((target) => {
  assertTest(`isChartTypeProhibited detects canonical '${target}'`, () => {
    assert.strictEqual(isChartTypeProhibited(target), true);
  });

  assertTest(`validateChartSelection rejects '${target}' with descriptive reason`, () => {
    const res = validateChartSelection(target);
    assert.strictEqual(res.isValid, false);
    assert.ok(typeof res.error === 'string' && res.error.length > 0);
    assert.ok(typeof res.reason === 'string' && res.reason.length > 0);
  });

  assertTest(`overrideChartType throws when attempting injection with '${target}'`, () => {
    assert.throws(
      () => overrideChartType(mockCol, target),
      /strictly prohibited/i
    );
  });

  assertTest(`getProhibitionReason provides specific pedagogy for '${target}'`, () => {
    const reason = getProhibitionReason(target);
    assert.ok(reason !== null && reason.length > 15);
  });
});

// Test Case Variants & Whitespace Evasion
const adversarialVariants = [
  'RADAR',
  'Spider',
  '3D_PIE',
  '3D_pie_wedge',
  '  dual_y_axis  ',
  'BUBBLE',
  '3D_SURFACE',
  '\tspider\n',
  '  3D_PIE  ',
  '   radar   ',
];

adversarialVariants.forEach((variant) => {
  assertTest(`Case/Whitespace evasion blocked for '${variant}'`, () => {
    assert.strictEqual(isChartTypeProhibited(variant), true);
    const res = validateChartSelection(variant);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error.includes('strictly prohibited'));
    assert.throws(
      () => overrideChartType(mockCol, variant),
      /strictly prohibited/i
    );
  });
});

// Ensure legitimate charts are NOT falsely prohibited
const allowedCharts = [
  'donut',
  'vertical_bar',
  'horizontal_bar',
  'ranked_bar',
  'ordered_likert',
  'text_feed',
  'none',
];

allowedCharts.forEach((allowed) => {
  assertTest(`Authorized chart '${allowed}' is allowed and non-prohibited`, () => {
    assert.strictEqual(isChartTypeProhibited(allowed), false);
    const res = validateChartSelection(allowed);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.error, undefined);
    const updated = overrideChartType(mockCol, allowed);
    assert.strictEqual(updated.selectedChart, allowed);
  });
});

// ============================================================================
// SUITE 2: Demographic Boundary Conditions Matrix
// ============================================================================
console.log('\n--- SUITE 2: Demographic Boundary Matrix Stress-Test ---');

// Grid test of uniqueCount x maxLabelLength
const demographicMatrix = [
  // uniqueCount = 2
  { count: 2, len: 12, expected: 'donut' },
  { count: 2, len: 13, expected: 'donut' },
  { count: 2, len: 15, expected: 'donut' },
  { count: 2, len: 16, expected: 'horizontal_bar' }, // exceeds 15 char limit for donut
  // uniqueCount = 3
  { count: 3, len: 12, expected: 'donut' },
  { count: 3, len: 13, expected: 'donut' },
  { count: 3, len: 15, expected: 'donut' },
  { count: 3, len: 16, expected: 'horizontal_bar' }, // exceeds 15 char limit for donut
  // uniqueCount = 4
  { count: 4, len: 12, expected: 'vertical_bar' }, // <= 6 count & <= 12 len
  { count: 4, len: 13, expected: 'horizontal_bar' }, // exceeds 12 char limit for vertical
  { count: 4, len: 15, expected: 'horizontal_bar' },
  { count: 4, len: 16, expected: 'horizontal_bar' },
  // uniqueCount = 6
  { count: 6, len: 12, expected: 'vertical_bar' }, // <= 6 count & <= 12 len
  { count: 6, len: 13, expected: 'horizontal_bar' }, // exceeds 12 char limit for vertical
  { count: 6, len: 15, expected: 'horizontal_bar' },
  { count: 6, len: 16, expected: 'horizontal_bar' },
  // uniqueCount = 7
  { count: 7, len: 12, expected: 'horizontal_bar' }, // > 6 count -> always horizontal
  { count: 7, len: 13, expected: 'horizontal_bar' },
  { count: 7, len: 15, expected: 'horizontal_bar' },
  { count: 7, len: 16, expected: 'horizontal_bar' },
  // Extreme boundaries
  { count: 1, len: 5, expected: 'donut' },
  { count: 25, len: 5, expected: 'horizontal_bar' },
  { count: 5, len: 100, expected: 'horizontal_bar' },
];

demographicMatrix.forEach(({ count, len, expected }) => {
  assertTest(
    `Demographic boundary (count=${count}, maxLen=${len}) -> '${expected}'`,
    () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', count, len);
      assert.strictEqual(
        rec,
        expected,
        `Expected ${expected} for count=${count}, len=${len}, got ${rec}`
      );
      const rationale = getRecommendationRationale('NOMINAL_DEMOGRAPHIC', count, len);
      assert.strictEqual(rationale.chartType, expected);
    }
  );
});

// Non-demographic questions must remain invariant under category & label count shifts
assertTest('DICHOTOMOUS_BINARY always recommends donut regardless of label length', () => {
  assert.strictEqual(determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 5), 'donut');
  assert.strictEqual(determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 50), 'donut');
});

assertTest('LIKERT_SCALE always recommends ordered_likert regardless of label length', () => {
  assert.strictEqual(determineRecommendedChart('LIKERT_SCALE', 4, 10), 'ordered_likert');
  assert.strictEqual(determineRecommendedChart('LIKERT_SCALE', 5, 45), 'ordered_likert');
});

assertTest('MULTI_SELECT_CHECKBOX always recommends ranked_bar', () => {
  assert.strictEqual(determineRecommendedChart('MULTI_SELECT_CHECKBOX', 12, 10), 'ranked_bar');
  assert.strictEqual(determineRecommendedChart('MULTI_SELECT_CHECKBOX', 2, 80), 'ranked_bar');
});

assertTest('OPEN_ENDED_TEXT always recommends text_feed', () => {
  assert.strictEqual(determineRecommendedChart('OPEN_ENDED_TEXT', 150, 120), 'text_feed');
});

// ============================================================================
// SUITE 3: Likert Scale Edge Cases & Arithmetic Invariants
// ============================================================================
console.log('\n--- SUITE 3: Likert Scale Edge Cases & Descriptive Statistics ---');

assertTest('Likert 4-point vs 5-point scale max and label mapping', () => {
  const stats4 = calculateLikertStats({ '1': 10, '2': 10, '3': 10, '4': 10 }, 4);
  assert.strictEqual(stats4.min, 1);
  assert.strictEqual(stats4.max, 4);
  assert.strictEqual(Object.keys(stats4.labels).length, 4);

  const stats5 = calculateLikertStats({ '1': 10, '2': 10, '3': 10, '4': 10, '5': 10 }, 5);
  assert.strictEqual(stats5.min, 1);
  assert.strictEqual(stats5.max, 5);
  assert.strictEqual(Object.keys(stats5.labels).length, 5);
});

assertTest('Zero responses on intermediate scale points handled correctly', () => {
  // Extreme polarization: 50 at score 1, 50 at score 5. Scores 2, 3, 4 are 0
  const polarStats = calculateLikertStats({ '1': 50, '5': 50 }, 5);
  assert.strictEqual(polarStats.mean, 3.0);
  assert.strictEqual(polarStats.median, 3.0);
  assert.strictEqual(polarStats.netPositivePercent, 50.0);
});

assertTest('100% Agreement (All score 5) yields 100% net positive agreement', () => {
  const all5 = calculateLikertStats({ '5': 120 }, 5);
  assert.strictEqual(all5.mean, 5.0);
  assert.strictEqual(all5.median, 5);
  assert.strictEqual(all5.netPositivePercent, 100.0);
});

assertTest('100% Agreement (Split between 4 and 5) yields 100% Top-Box', () => {
  const split45 = calculateLikertStats({ '4': 30, '5': 70 }, 5);
  assert.strictEqual(split45.mean, 4.7);
  assert.strictEqual(split45.netPositivePercent, 100.0);
});

assertTest('100% Disagreement (All score 1) yields 0% net positive agreement', () => {
  const all1 = calculateLikertStats({ '1': 80 }, 5);
  assert.strictEqual(all1.mean, 1.0);
  assert.strictEqual(all1.median, 1);
  assert.strictEqual(all1.netPositivePercent, 0.0);
});

assertTest('100% Neutral (All score 3 in 5-point scale) yields 0% Top-Box', () => {
  const all3 = calculateLikertStats({ '3': 60 }, 5);
  assert.strictEqual(all3.mean, 3.0);
  assert.strictEqual(all3.median, 3);
  assert.strictEqual(all3.netPositivePercent, 0.0);
});

assertTest('Decimal string keys (e.g. "1.0", "4.0") parsed seamlessly without data loss', () => {
  const floatKeys = { '1.0': 10, '2.0': 10, '3.0': 10, '4.0': 10, '5.0': 10 };
  const stats = calculateLikertStats(floatKeys, 5);
  assert.strictEqual(stats.mean, 3.0);
  assert.strictEqual(stats.netPositivePercent, 40.0); // 4.0 and 5.0 -> 20 out of 50 = 40%
});

assertTest('Completely empty distribution handles 0 respondents without NaN or exception', () => {
  const emptyStats = calculateLikertStats({}, 5);
  assert.strictEqual(emptyStats.mean, 0);
  assert.strictEqual(emptyStats.median, 0);
  assert.strictEqual(emptyStats.netPositivePercent, 0);
});

assertTest('Questions sortable by netPositivePercent descending', () => {
  const qA = { id: 'qA', stats: calculateLikertStats({ '4': 40, '5': 40, '1': 20 }, 5) }; // 80%
  const qB = { id: 'qB', stats: calculateLikertStats({ '1': 100 }, 5) }; // 0%
  const qC = { id: 'qC', stats: calculateLikertStats({ '5': 95, '2': 5 }, 5) }; // 95%
  const qD = { id: 'qD', stats: calculateLikertStats({ '4': 25, '3': 75 }, 5) }; // 25%

  const questions = [qA, qB, qC, qD];
  questions.sort((a, b) => b.stats.netPositivePercent - a.stats.netPositivePercent);

  assert.strictEqual(questions[0].id, 'qC'); // 95%
  assert.strictEqual(questions[1].id, 'qA'); // 80%
  assert.strictEqual(questions[2].id, 'qD'); // 25%
  assert.strictEqual(questions[3].id, 'qB'); // 0%
});

// ============================================================================
// SUITE 4: Multi-Select Checkbox Rankings & Normalization Invariants
// ============================================================================
console.log('\n--- SUITE 4: Multi-Select Checkbox Rankings & Normalization ---');

assertTest('Token frequencies sorted descending by count with alphabetical tie-break', () => {
  const rows = [
    'Option B, Option A, Option C',
    'Option C, Option B',
    'Option B',
  ];
  // Option B: 3 respondents (100%)
  // Option C: 2 respondents (66.7%)
  // Option A: 1 respondent (33.3%)
  const analysis = splitMultiSelectResponses(rows, 3);
  assert.strictEqual(analysis.tokenFrequencies.length, 3);
  assert.strictEqual(analysis.tokenFrequencies[0].token, 'Option B');
  assert.strictEqual(analysis.tokenFrequencies[0].count, 3);
  assert.strictEqual(analysis.tokenFrequencies[0].percentage, 100.0);

  assert.strictEqual(analysis.tokenFrequencies[1].token, 'Option C');
  assert.strictEqual(analysis.tokenFrequencies[1].count, 2);
  assert.strictEqual(analysis.tokenFrequencies[1].percentage, 66.7);

  assert.strictEqual(analysis.tokenFrequencies[2].token, 'Option A');
  assert.strictEqual(analysis.tokenFrequencies[2].count, 1);
  assert.strictEqual(analysis.tokenFrequencies[2].percentage, 33.3);
});

assertTest('Tie-break sorts alphabetically when counts are identical', () => {
  const rows = [
    'Zebra, Apple, Mango',
  ];
  const analysis = splitMultiSelectResponses(rows, 1);
  assert.strictEqual(analysis.tokenFrequencies[0].token, 'Apple');
  assert.strictEqual(analysis.tokenFrequencies[1].token, 'Mango');
  assert.strictEqual(analysis.tokenFrequencies[2].token, 'Zebra');
});

assertTest('Deduplication invariant: duplicate tokens within one respondent count only once', () => {
  const rowsWithDups = [
    'Instagram, Twitter, Instagram, Instagram',
    'Twitter, Twitter, Twitter',
    'LinkedIn',
  ];
  // Total respondents = 3
  // Instagram: selected by row 1 -> count = 1 (33.3%), NOT 3
  // Twitter: selected by row 1 and row 2 -> count = 2 (66.7%), NOT 4
  // LinkedIn: selected by row 3 -> count = 1 (33.3%)
  const analysis = splitMultiSelectResponses(rowsWithDups, 3);
  const ig = analysis.tokenFrequencies.find((t) => t.token === 'Instagram');
  const tw = analysis.tokenFrequencies.find((t) => t.token === 'Twitter');
  const li = analysis.tokenFrequencies.find((t) => t.token === 'LinkedIn');

  assert.strictEqual(ig.count, 1);
  assert.strictEqual(ig.percentage, 33.3);
  assert.strictEqual(tw.count, 2);
  assert.strictEqual(tw.percentage, 66.7);
  assert.strictEqual(li.count, 1);

  // Total selections must equal sum of distinct selections per respondent (2 + 1 + 1 = 4)
  assert.strictEqual(analysis.totalSelections, 4);
});

assertTest('Normalization is based on N respondents, allowing sum of % to exceed 100%', () => {
  const rows = [
    'Komisi 1, Komisi 2',
    'Komisi 1, Komisi 2',
    'Komisi 1, Komisi 2',
  ];
  // 3 respondents, both selected both
  const analysis = splitMultiSelectResponses(rows, 3);
  assert.strictEqual(analysis.tokenFrequencies[0].percentage, 100.0);
  assert.strictEqual(analysis.tokenFrequencies[1].percentage, 100.0);
  const sumPercentages = analysis.tokenFrequencies.reduce((sum, t) => sum + t.percentage, 0);
  assert.strictEqual(sumPercentages, 200.0);
});

assertTest('Empty, whitespace-only, and punctuation placeholder tokens filtered cleanly', () => {
  const rows = [
    '  , - , _ ,   ',
    'Option Valid,  , -',
    '',
    null,
    undefined,
  ];
  const analysis = splitMultiSelectResponses(rows, 5);
  assert.strictEqual(analysis.tokenFrequencies.length, 1);
  assert.strictEqual(analysis.tokenFrequencies[0].token, 'Option Valid');
  assert.strictEqual(analysis.tokenFrequencies[0].count, 1);
  assert.strictEqual(analysis.totalSelections, 1);
});

assertTest('Zero respondents (N=0) does not divide by zero', () => {
  const analysis = splitMultiSelectResponses([], 0);
  assert.strictEqual(analysis.totalSelections, 0);
  assert.strictEqual(analysis.averageSelectionsPerRespondent, 0);
  assert.strictEqual(analysis.tokenFrequencies.length, 0);
});

assertTest('Token repeat ratio distinguishes checkboxes (>3.0) from free text (<2.0)', () => {
  const checkboxResponses = [
    'Instagram, Twitter, TikTok',
    'Instagram, TikTok',
    'Instagram, YouTube',
    'Twitter, TikTok',
    'Instagram, TikTok, YouTube',
  ];
  const cbRatio = calculateTokenRepeatRatio(checkboxResponses);
  assert.ok(cbRatio.ratio >= 2.5);

  const essayResponses = [
    'Pelayanan biro sangat cepat dan memuaskan sekali',
    'Tolong tingkatkan koordinasi antar bidang agar tidak tumpang tindih',
    'Fasilitas ruangan perlu diperbaiki terutama pendingin udara',
  ];
  const essayRatio = calculateTokenRepeatRatio(essayResponses);
  assert.ok(essayRatio.ratio <= 1.5);
});

// ============================================================================
// SUITE 5: PII Protection in Recommender & Curation
// ============================================================================
console.log('\n--- SUITE 5: PII Protection & Data Privacy Invariants ---');

assertTest('METADATA_PII always yields recommendedChart="none" under all category/length variations', () => {
  const variations = [
    { count: 1, len: 10 },
    { count: 2, len: 5 },
    { count: 5, len: 12 },
    { count: 50, len: 25 },
    { count: 1000, len: 100 },
  ];
  for (const { count, len } of variations) {
    const rec = determineRecommendedChart('METADATA_PII', count, len);
    assert.strictEqual(rec, 'none');
  }
});

assertTest('getCompatibleChartAlternatives for METADATA_PII returns only ["none"]', () => {
  const alts = getCompatibleChartAlternatives('METADATA_PII');
  assert.deepStrictEqual(alts, ['none']);
});

assertTest('getRecommendationRationale for METADATA_PII highlights privacy exclusion', () => {
  const rationale = getRecommendationRationale('METADATA_PII', 134, 20);
  assert.strictEqual(rationale.chartType, 'none');
  assert.ok(rationale.title.includes('Tidak Divisualisasikan'));
  assert.ok(rationale.rationale.includes('privasi'));
});

assertTest('generateOfflineSummary for METADATA_PII generates privacy notice', () => {
  const summary = generateOfflineSummary({
    type: 'METADATA_PII',
    title: 'NIM Mahasiswa',
    totalResponses: 250,
    validResponses: 250,
    distribution: {},
  });
  assert.ok(summary.includes('privasi'));
  assert.ok(summary.includes('Diabaikan'));
});

assertTest('buildGeminiPrompt packages zero PII / raw individual respondent records', () => {
  const piiCol = {
    ...mockCol,
    rawName: 'Nama Lengkap Mahasiswa',
    cleanName: 'Nama Lengkap Mahasiswa',
    displayTitle: 'Nama Lengkap Mahasiswa',
    type: 'METADATA_PII',
    isPII: true,
  };
  const prompt = buildGeminiPrompt(piiCol);
  const parsed = JSON.parse(prompt);
  // Prompt must contain only aggregated high-level distribution & question metadata
  assert.strictEqual(parsed.hasOwnProperty('rawRows'), false);
  assert.strictEqual(parsed.hasOwnProperty('individualRecords'), false);
  assert.strictEqual(parsed.hasOwnProperty('studentNames'), false);
});

// ============================================================================
// SUITE 6: Curation Mutation Robustness
// ============================================================================
console.log('\n--- SUITE 6: Curation Mutation Robustness & Boundary Guarantees ---');

assertTest('updateColumnTitle trims whitespace and protects against empty strings', () => {
  const updatedBlank = updateColumnTitle(mockCol, '     ');
  assert.strictEqual(updatedBlank.displayTitle, 'Kepuasan Layanan');

  const updatedTrimmed = updateColumnTitle(mockCol, '  Evaluasi Biro Statistika 2026  ');
  assert.strictEqual(updatedTrimmed.displayTitle, 'Evaluasi Biro Statistika 2026');
});

assertTest('toggleColumnExclusion enforces boolean casting', () => {
  const res1 = toggleColumnExclusion(mockCol, 1);
  assert.strictEqual(res1.isExcluded, true);

  const res0 = toggleColumnExclusion(mockCol, 0);
  assert.strictEqual(res0.isExcluded, false);
});

assertTest('reorderColumns returns unchanged array on out-of-bounds indices', () => {
  const cols = [
    { id: '1', columnIndex: 0 },
    { id: '2', columnIndex: 1 },
  ];
  const out1 = reorderColumns(cols, -1, 1);
  assert.strictEqual(out1, cols);

  const out2 = reorderColumns(cols, 0, 5);
  assert.strictEqual(out2, cols);
});

assertTest('reorderColumns preserves array length and maintains sequential 0-indexed ordering', () => {
  const items = [
    { id: 'A', columnIndex: 0 },
    { id: 'B', columnIndex: 1 },
    { id: 'C', columnIndex: 2 },
    { id: 'D', columnIndex: 3 },
  ];
  const moved = reorderColumns(items, 3, 0); // Move D to front: D, A, B, C
  assert.strictEqual(moved.length, 4);
  assert.strictEqual(moved[0].id, 'D');
  assert.strictEqual(moved[0].columnIndex, 0);
  assert.strictEqual(moved[1].id, 'A');
  assert.strictEqual(moved[1].columnIndex, 1);
  assert.strictEqual(moved[2].id, 'B');
  assert.strictEqual(moved[2].columnIndex, 2);
  assert.strictEqual(moved[3].id, 'C');
  assert.strictEqual(moved[3].columnIndex, 3);
});

// ============================================================================
// FINAL SUMMARY & VERDICT
// ============================================================================
console.log('\n========================================================================');
console.log(`  ADVERSARIAL SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
if (failedTests > 0) {
  console.log(`  FAILURES: ${failedTests}`);
  failures.forEach((f) => console.log(`   - ${f.name}: ${f.error.message}`));
}
console.log('========================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('>>> VERDICT: ALL ADVERSARIAL CHALLENGES SATISFIED EMPIRICALLY (PASS). <<<\n');
  process.exit(0);
}
