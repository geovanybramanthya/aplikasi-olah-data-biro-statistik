/**
 * Adversarial Challenger 1 Suite for Milestone 2
 * Agent: challenger_m2_1
 * 
 * Stress-Tests:
 * 1. Prohibited Chart Injection Resistance
 * 2. Borderline Recommendation Heuristics & Edge Cases
 * 3. Real-World Survey Datasets Validation
 * 4. Curation Mutation Security & Invariants
 * 5. Gemini Hybrid Narrative Engine & Privacy Protection
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('================================================================================');
console.log('  CHALLENGER M2-1: ADVERSARIAL STRESS TEST & PROHIBITED CHART INJECTION HARNESS');
console.log('================================================================================\n');

// Compile source TypeScript modules in memory
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
  parseCSVString,
  parseExcelBuffer,
  loadDemoSurvey1,
  loadDemoSurvey2,
} = moduleExports.exports;

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  [PASS] ${title}`);
  } catch (err) {
    failedChecks++;
    failures.push({ title, error: err.message, stack: err.stack });
    console.error(`  [FAIL] ${title}`);
    console.error(`         => ${err.message}`);
  }
}

async function checkAsync(title, fn) {
  totalChecks++;
  try {
    await fn();
    passedChecks++;
    console.log(`  [PASS] ${title}`);
  } catch (err) {
    failedChecks++;
    failures.push({ title, error: err.message, stack: err.stack });
    console.error(`  [FAIL] ${title}`);
    console.error(`         => ${err.message}`);
  }
}

(async () => {
  // =========================================================================
  // SECTION 1: Adversarial Prohibited Chart Injections
  // =========================================================================
  console.log('--- SECTION 1: Adversarial Prohibited Chart Injections ---');

  const baseCol = {
    id: 'test_col_1',
    columnIndex: 0,
    rawName: 'Kepuasan Mahasiswa',
    cleanName: 'Kepuasan Mahasiswa',
    displayTitle: 'Kepuasan Mahasiswa',
    type: 'NOMINAL_DEMOGRAPHIC',
    isPII: false,
    isExcluded: false,
    recommendedChart: 'horizontal_bar',
    selectedChart: 'horizontal_bar',
    totalResponses: 100,
    validResponses: 100,
    missingResponses: 0,
    uniqueValuesCount: 5,
    distribution: { A: 20, B: 30, C: 25, D: 15, E: 10 },
    offlineSummary: '',
  };

  const prohibitedList = [
    'radar',
    'spider',
    '3d_pie_wedge',
    '3d_pie',
    'dual_y_axis',
    'bubble',
    '3d_surface',
  ];

  // 1.1 Test each prohibited chart in lowercase
  for (const p of prohibitedList) {
    check(`isChartTypeProhibited flags exact match: '${p}'`, () => {
      assert.strictEqual(isChartTypeProhibited(p), true);
    });

    check(`validateChartSelection strictly rejects: '${p}'`, () => {
      const res = validateChartSelection(p);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error.includes('strictly prohibited'));
      assert.ok(typeof res.reason === 'string' && res.reason.length > 10);
    });

    check(`overrideChartType throws when injecting '${p}'`, () => {
      assert.throws(() => {
        overrideChartType(baseCol, p);
      }, /strictly prohibited/i);
    });
  }

  // 1.2 Test casing variations
  const casingVariations = [
    'RADAR',
    'Radar',
    'RaDaR',
    'SPIDER',
    'Spider',
    '3D_PIE_WEDGE',
    '3D_Pie_Wedge',
    '3D_PIE',
    '3d_Pie',
    'DUAL_Y_AXIS',
    'Dual_Y_Axis',
    'BUBBLE',
    'Bubble',
    '3D_SURFACE',
    '3d_Surface',
  ];

  for (const c of casingVariations) {
    check(`Casing bypass injection resisted for '${c}'`, () => {
      assert.strictEqual(isChartTypeProhibited(c), true);
      assert.throws(() => {
        overrideChartType(baseCol, c);
      }, /strictly prohibited/i);
    });
  }

  // 1.3 Test whitespace padding bypasses
  const whitespaceVariations = [
    '  radar  ',
    '\tradar\t',
    '\nspider\n',
    '  3d_pie  ',
    '   dual_y_axis   ',
    '\r\n bubble \r\n',
    '   3d_surface   ',
  ];

  for (const w of whitespaceVariations) {
    check(`Whitespace padding bypass resisted for '${w.replace(/[\r\n\t]/g, ' ')}'`, () => {
      assert.strictEqual(isChartTypeProhibited(w), true);
      assert.throws(() => {
        overrideChartType(baseCol, w);
      }, /strictly prohibited/i);
    });
  }

  // 1.4 Test null, undefined, empty string handling
  check('isChartTypeProhibited handles null / undefined / empty gracefully', () => {
    assert.strictEqual(isChartTypeProhibited(null), false);
    assert.strictEqual(isChartTypeProhibited(undefined), false);
    assert.strictEqual(isChartTypeProhibited(''), false);
    assert.strictEqual(isChartTypeProhibited('   '), false);
  });

  // 1.5 Whitelist integrity: getAllowedPublicChartTypes must never contain prohibited charts
  check('getAllowedPublicChartTypes never leaks prohibited chart types', () => {
    const allowed = getAllowedPublicChartTypes();
    assert.ok(allowed.length >= 6);
    for (const item of allowed) {
      assert.strictEqual(isChartTypeProhibited(item.type), false, `Allowed type '${item.type}' is marked prohibited!`);
      assert.ok(!prohibitedList.includes(item.type));
    }
  });

  // 1.6 getCompatibleChartAlternatives never returns prohibited charts for any question type
  const allQuestionTypes = [
    'METADATA_PII',
    'DICHOTOMOUS_BINARY',
    'LIKERT_SCALE',
    'MULTI_SELECT_CHECKBOX',
    'NOMINAL_DEMOGRAPHIC',
    'OPEN_ENDED_TEXT',
  ];

  for (const qt of allQuestionTypes) {
    check(`getCompatibleChartAlternatives for ${qt} contains 0 prohibited charts`, () => {
      const alts = getCompatibleChartAlternatives(qt);
      assert.ok(Array.isArray(alts) && alts.length > 0);
      for (const a of alts) {
        assert.strictEqual(isChartTypeProhibited(a), false, `Prohibited chart '${a}' found in alternatives for ${qt}`);
      }
    });
  }

  // =========================================================================
  // SECTION 2: Borderline Recommendation Heuristics & Boundary Stress
  // =========================================================================
  console.log('\n--- SECTION 2: Borderline Recommendation Heuristics & Boundary Stress ---');

  // 2.1 Nominal Category Count Boundary: 3 vs 4
  check('Boundary: NOMINAL with 3 categories & 15-char label -> donut', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 15);
    assert.strictEqual(rec, 'donut');
  });

  check('Boundary: NOMINAL with 4 categories & 15-char label -> horizontal_bar', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 4, 15);
    assert.strictEqual(rec, 'horizontal_bar');
  });

  check('Boundary: NOMINAL with 4 categories & 12-char label -> vertical_bar', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 4, 12);
    assert.strictEqual(rec, 'vertical_bar');
  });

  check('Boundary: NOMINAL with 3 categories & 16-char label -> horizontal_bar', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 16);
    assert.strictEqual(rec, 'horizontal_bar');
  });

  // 2.2 Nominal Category Count Boundary: 6 vs 7
  check('Boundary: NOMINAL with 6 categories & 12-char label -> vertical_bar', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 6, 12);
    assert.strictEqual(rec, 'vertical_bar');
  });

  check('Boundary: NOMINAL with 7 categories & 12-char label -> horizontal_bar', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 7, 12);
    assert.strictEqual(rec, 'horizontal_bar');
  });

  check('Boundary: NOMINAL with 7 categories & 4-char label -> horizontal_bar', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 7, 4);
    assert.strictEqual(rec, 'horizontal_bar');
  });

  // 2.3 Single-Category & Zero-Category Boundary Questions
  check('Edge: NOMINAL with exactly 1 category & short label -> donut', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 1, 10);
    assert.strictEqual(rec, 'donut');
  });

  check('Edge: NOMINAL with 0 categories -> donut (fallback safe)', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 0, 0);
    assert.strictEqual(rec, 'donut');
  });

  check('Edge: Extreme label length (10,000 chars) -> horizontal_bar', () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 2, 10000);
    assert.strictEqual(rec, 'horizontal_bar');
  });

  // 2.4 Likert Scale 0-Count Options Stress
  check('Likert Scale with 0-count on lower scores (only 4 and 5 populated)', () => {
    const dist = { '1': 0, '2': 0, '3': 0, '4': 25, '5': 75 };
    const stats = calculateLikertStats(dist, 5);
    assert.strictEqual(stats.min, 1);
    assert.strictEqual(stats.max, 5);
    assert.strictEqual(stats.mean, 4.75);
    assert.strictEqual(stats.netPositivePercent, 100.0);
    assert.strictEqual(stats.median, 5);
  });

  check('Likert Scale with 0-count on upper scores (only 1 and 2 populated)', () => {
    const dist = { '1': 60, '2': 40, '3': 0, '4': 0, '5': 0 };
    const stats = calculateLikertStats(dist, 5);
    assert.strictEqual(stats.mean, 1.4);
    assert.strictEqual(stats.netPositivePercent, 0.0);
    assert.strictEqual(stats.median, 1);
  });

  check('Likert Scale completely empty (all 0 counts, zero respondents)', () => {
    const dist = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    const stats = calculateLikertStats(dist, 5);
    assert.strictEqual(stats.mean, 0);
    assert.strictEqual(stats.netPositivePercent, 0);
    assert.strictEqual(stats.median, 0);
    assert.doesNotThrow(() => {
      const summary = generateOfflineSummary({
        type: 'LIKERT_SCALE',
        title: 'Empty Likert',
        totalResponses: 0,
        validResponses: 0,
        distribution: dist,
        likertStats: stats,
      });
      assert.ok(summary.includes('0%') || summary.includes('0'));
    });
  });

  check('Likert Scale 4-point scale with missing middle score', () => {
    const dist = { '1': 10, '2': 0, '3': 0, '4': 90 };
    const stats = calculateLikertStats(dist, 4);
    assert.strictEqual(stats.max, 4);
    assert.strictEqual(stats.mean, 3.7);
    assert.strictEqual(stats.netPositivePercent, 90.0);
  });

  // 2.5 Multi-Select Checkbox Edge Cases
  check('Multi-Select with 0 selections / empty tokens', () => {
    const summary = generateOfflineSummary({
      type: 'MULTI_SELECT_CHECKBOX',
      title: 'Aktivitas',
      totalResponses: 50,
      validResponses: 50,
      distribution: {},
      multiSelectStats: {
        totalSelections: 0,
        averageSelectionsPerRespondent: 0,
        tokenFrequencies: [],
      },
    });
    assert.ok(summary.includes('Tidak ada opsi yang dipilih'));
  });

  check('Multi-Select with exactly 1 selected token', () => {
    const summary = generateOfflineSummary({
      type: 'MULTI_SELECT_CHECKBOX',
      title: 'Minat',
      totalResponses: 50,
      validResponses: 50,
      distribution: { 'Riset': 50 },
      multiSelectStats: {
        totalSelections: 50,
        averageSelectionsPerRespondent: 1.0,
        tokenFrequencies: [{ token: 'Riset', count: 50, percentage: 100.0 }],
      },
    });
    assert.ok(summary.includes('Riset'));
    assert.ok(summary.includes('100%'));
  });

  // 2.6 Single-Category Demographics
  check('Single-Category question offline summary states 100.0% cleanly', () => {
    const summary = generateOfflineSummary({
      type: 'NOMINAL_DEMOGRAPHIC',
      title: 'Status Keaktifan',
      totalResponses: 100,
      validResponses: 100,
      distribution: { 'Aktif': 100 },
    });
    assert.ok(summary.includes('Seluruh responden yang menjawab'));
    assert.ok(summary.includes('100.0%'));
    assert.ok(summary.includes('Aktif'));
  });

  // =========================================================================
  // SECTION 3: Real Survey Datasets Verification
  // =========================================================================
  console.log('\n--- SECTION 3: Real Survey Datasets Verification ---');

  // 3.1 Sample 1 UPGRADING BEM UNDIP
  check('Sample 1 UPGRADING BEM UNDIP: 100% questions get valid, non-prohibited recommendations', () => {
    const ds1 = loadDemoSurvey1();
    assert.strictEqual(ds1.rowCount, 134);
    assert.strictEqual(ds1.columns.length, 27);

    for (const col of ds1.columns) {
      assert.ok(col.recommendedChart, `Column ${col.cleanName} has no recommendedChart`);
      assert.strictEqual(
        isChartTypeProhibited(col.recommendedChart),
        false,
        `Prohibited chart recommended for column ${col.cleanName}: ${col.recommendedChart}`
      );

      // Verify specific mappings based on type
      if (col.isPII) {
        assert.strictEqual(col.recommendedChart, 'none');
        assert.strictEqual(col.isExcluded, true);
      } else if (col.type === 'LIKERT_SCALE') {
        assert.strictEqual(col.recommendedChart, 'ordered_likert');
        assert.ok(col.likertScale !== undefined);
        assert.ok(!isNaN(col.likertScale.mean));
        assert.ok(!isNaN(col.likertScale.netPositivePercent));
      } else if (col.type === 'MULTI_SELECT_CHECKBOX') {
        assert.strictEqual(col.recommendedChart, 'ranked_bar');
        assert.ok(col.multiSelect !== undefined);
      } else if (col.type === 'OPEN_ENDED_TEXT') {
        assert.strictEqual(col.recommendedChart, 'text_feed');
      } else if (col.type === 'NOMINAL_DEMOGRAPHIC') {
        assert.ok(['donut', 'horizontal_bar', 'vertical_bar'].includes(col.recommendedChart));
      }

      // Check offline summary
      assert.ok(col.offlineSummary && col.offlineSummary.length > 5);
      assert.ok(!col.offlineSummary.includes('NaN'), `Summary contains NaN for column: ${col.cleanName}`);
      assert.ok(!col.offlineSummary.includes('undefined'), `Summary contains undefined for column: ${col.cleanName}`);

      // Check recommendation rationale with actual max label length
      const maxLabelLen = Math.max(...Object.keys(col.distribution).map((k) => k.length), 0);
      const rationale = getRecommendationRationale(col.type, col.uniqueValuesCount, maxLabelLen);
      assert.strictEqual(rationale.chartType, col.recommendedChart);
      assert.ok(rationale.rationale.length > 10);
      assert.ok(rationale.presentationAdvice.length > 10);
    }
  });

  // 3.2 Sample 2 Campus Safety & Catcalling Survey
  check('Sample 2 Campus Safety: 100% questions get valid, non-prohibited recommendations', () => {
    const ds2 = loadDemoSurvey2();
    assert.strictEqual(ds2.rowCount, 197);
    assert.strictEqual(ds2.columns.length, 15);

    for (const col of ds2.columns) {
      assert.ok(col.recommendedChart, `Column ${col.cleanName} has no recommendedChart`);
      assert.strictEqual(
        isChartTypeProhibited(col.recommendedChart),
        false,
        `Prohibited chart recommended for column ${col.cleanName}: ${col.recommendedChart}`
      );

      if (col.isPII) {
        assert.strictEqual(col.recommendedChart, 'none');
        assert.strictEqual(col.isExcluded, true);
      } else if (col.type === 'DICHOTOMOUS_BINARY') {
        assert.strictEqual(col.recommendedChart, 'donut');
      } else if (col.type === 'LIKERT_SCALE') {
        assert.strictEqual(col.recommendedChart, 'ordered_likert');
        assert.strictEqual(col.likertScale.max, 4);
      } else if (col.type === 'OPEN_ENDED_TEXT') {
        assert.strictEqual(col.recommendedChart, 'text_feed');
      }

      assert.ok(col.offlineSummary && col.offlineSummary.length > 5);
      assert.ok(!col.offlineSummary.includes('NaN'));
      assert.ok(!col.offlineSummary.includes('undefined'));
    }
  });

  // 3.3 Raw Survey Files Direct Ingestion
  const sample1CsvPath = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
  const sample2CsvPath = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_2.csv';

  if (fs.existsSync(sample1CsvPath)) {
    check('Raw CSV File 1 Ingestion and Recommendation Consistency', () => {
      const content = fs.readFileSync(sample1CsvPath, 'utf8');
      const ds = parseCSVString(content, 'survey_sample_1.csv');
      assert.strictEqual(ds.rowCount, 134);
      for (const col of ds.columns) {
        assert.strictEqual(isChartTypeProhibited(col.recommendedChart), false);
      }
    });
  }

  if (fs.existsSync(sample2CsvPath)) {
    check('Raw CSV File 2 Ingestion and Recommendation Consistency', () => {
      const content = fs.readFileSync(sample2CsvPath, 'utf8');
      const ds = parseCSVString(content, 'survey_sample_2.csv');
      assert.strictEqual(ds.rowCount, 197);
      for (const col of ds.columns) {
        assert.strictEqual(isChartTypeProhibited(col.recommendedChart), false);
      }
    });
  }

  // =========================================================================
  // SECTION 4: Curation Mutation Security & Immutability
  // =========================================================================
  console.log('\n--- SECTION 4: Curation Mutation Security & Immutability ---');

  check('overrideChartType does not mutate original column in-place (immutable)', () => {
    const original = { ...baseCol };
    const updated = overrideChartType(baseCol, 'vertical_bar');
    assert.strictEqual(baseCol.selectedChart, 'horizontal_bar', 'Original was mutated!');
    assert.strictEqual(updated.selectedChart, 'vertical_bar');
    assert.notStrictEqual(baseCol, updated);
  });

  check('overrideChartType setting "none" automatically marks isExcluded = true', () => {
    const updated = overrideChartType(baseCol, 'none');
    assert.strictEqual(updated.selectedChart, 'none');
    assert.strictEqual(updated.isExcluded, true);
  });

  check('updateColumnTitle trims whitespace and protects against blank replacement', () => {
    const colWithBlank = updateColumnTitle(baseCol, '   ');
    assert.strictEqual(colWithBlank.displayTitle, baseCol.cleanName);

    const colWithWhitespace = updateColumnTitle(baseCol, '  Hasil Evaluasi Bidang  ');
    assert.strictEqual(colWithWhitespace.displayTitle, 'Hasil Evaluasi Bidang');

    const colWithSpecialChars = updateColumnTitle(baseCol, '<script>alert("test")</script>');
    assert.strictEqual(colWithSpecialChars.displayTitle, '<script>alert("test")</script>');
    assert.strictEqual(baseCol.displayTitle, 'Kepuasan Mahasiswa'); // original unchanged
  });

  check('reorderColumns handles out-of-bounds indices without throwing or corrupting', () => {
    const cols = [
      { id: 'c1', columnIndex: 0 },
      { id: 'c2', columnIndex: 1 },
      { id: 'c3', columnIndex: 2 },
    ];
    // Negative fromIndex
    const negRes = reorderColumns(cols, -1, 1);
    assert.deepStrictEqual(negRes, cols);

    // Out of bound toIndex
    const oobRes = reorderColumns(cols, 1, 99);
    assert.deepStrictEqual(oobRes, cols);

    // Valid reorder: move index 2 to index 0
    const validReorder = reorderColumns(cols, 2, 0);
    assert.strictEqual(validReorder[0].id, 'c3');
    assert.strictEqual(validReorder[0].columnIndex, 0);
    assert.strictEqual(validReorder[1].id, 'c1');
    assert.strictEqual(validReorder[1].columnIndex, 1);
    assert.strictEqual(validReorder[2].id, 'c2');
    assert.strictEqual(validReorder[2].columnIndex, 2);

    // Ensure original array was not mutated in place
    assert.strictEqual(cols[0].id, 'c1');
  });

  check('toggleColumnExclusion enforces boolean cast and immutability', () => {
    const res1 = toggleColumnExclusion(baseCol, 1);
    assert.strictEqual(res1.isExcluded, true);
    assert.strictEqual(typeof res1.isExcluded, 'boolean');

    const res2 = toggleColumnExclusion(res1, 0);
    assert.strictEqual(res2.isExcluded, false);
    assert.strictEqual(baseCol.isExcluded, false);
  });

  // =========================================================================
  // SECTION 5: Gemini Hybrid & Zero-PII Security Stress
  // =========================================================================
  console.log('\n--- SECTION 5: Gemini Hybrid & Zero-PII Security Stress ---');

  check('buildGeminiPrompt packages ONLY aggregated distribution and clean question name', () => {
    const sensitiveCol = {
      ...baseCol,
      rawName: 'Nama Lengkap Mahasiswa & NIM',
      cleanName: 'Evaluasi Mahasiswa',
      displayTitle: 'Evaluasi Mahasiswa',
      distribution: { 'Sangat Baik': 40, 'Baik': 60 },
      rawResponses: ['Azura - 24060120120001', 'Budi - 24060120120002'],
    };

    const promptStr = buildGeminiPrompt(sensitiveCol);
    const parsed = JSON.parse(promptStr);

    assert.strictEqual(parsed.question, 'Evaluasi Mahasiswa');
    assert.strictEqual(parsed.n_valid, 100);
    assert.strictEqual(parsed.distribution['Sangat Baik'], 40);
    assert.strictEqual(parsed.distribution['Baik'], 60);

    // Must NEVER contain raw personal identifiers
    assert.strictEqual(promptStr.includes('24060120120001'), false);
    assert.strictEqual(promptStr.includes('Azura'), false);
    assert.strictEqual(promptStr.includes('Budi'), false);
    assert.strictEqual(promptStr.includes('rawResponses'), false);
  });

  check('resolveNarrativeWithFallback returns offline summary when key is missing or offline', () => {
    const offlineCol = {
      ...baseCol,
      offlineSummary: 'Mayoritas responden (30.0%) memilih B.',
    };

    const resEmptyKey = resolveNarrativeWithFallback(offlineCol, '');
    assert.strictEqual(resEmptyKey.isOfflineFallback, true);
    assert.ok(resEmptyKey.narrative.includes('30.0%'));
    assert.ok(resEmptyKey.narrative.includes('B'));

    const resOffline = resolveNarrativeWithFallback(offlineCol, 'valid_key_xyz', false);
    assert.strictEqual(resOffline.isOfflineFallback, true);
    assert.ok(resOffline.narrative.includes('30.0%'));
    assert.ok(resOffline.narrative.includes('B'));
  });

  await checkAsync('fetchGeminiNarrative graceful fallback on simulated 403 / 400 error', async () => {
    const testCol = {
      ...baseCol,
      offlineSummary: 'Distribusi responden seimbang.',
    };

    // Invalid key causes fast 400 / error from Google Gemini endpoint
    const result = await fetchGeminiNarrative(testCol, 'AIzaSy_ADVERSARIAL_INVALID_KEY', 1500);
    assert.strictEqual(result.isOfflineFallback, true);
    assert.ok(result.narrative.length > 0);
    assert.ok(result.narrative.includes('30.0%'));
    assert.ok(result.narrative.includes('B'));
  });

  // =========================================================================
  // Final Results
  // =========================================================================
  console.log('\n================================================================================');
  console.log(`  CHALLENGE SUMMARY: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
  if (failedChecks > 0) {
    console.error(`  FAILURES: ${failedChecks} CHECKS FAILED`);
    for (const f of failures) {
      console.error(`  - ${f.title}: ${f.error}`);
    }
    console.log('================================================================================\n');
    process.exit(1);
  } else {
    console.log('  VERDICT: APPROVE (Zero vulnerabilities, strict prohibition adherence)');
    console.log('================================================================================\n');
    process.exit(0);
  }
})();
