/**
 * Independent Adversarial Re-verification Suite: Milestone 2 PII Privacy & Gemini Fallback
 * Biro Statistika BEM Universitas Diponegoro
 * 
 * Objectives:
 * 1. Load actual survey datasets (survey_sample_1.csv and survey_sample_2.csv) and locate all PII columns.
 * 2. Invoke buildGeminiPrompt on each PII column: assert that ZERO student names appear in the payload string.
 * 3. Invoke fetchGeminiNarrative on each PII column with simulated valid API key: assert that
 *    isOfflineFallback === true, narrative contains privacy notice, and strictly 0 network calls are made.
 * 4. Test non-PII columns (Demographics, Likert, Multi-select, Binary): assert that aggregated
 *    distributions ARE preserved and properly passed.
 * 5. Verify UI safeguards in ColumnDetailModal.tsx (button disable, warning badge, handler guard).
 * 6. Concurrency stress test under load (100 simultaneous calls).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  ADVERSARIAL RE-VERIFICATION SUITE: M2 PII PRIVACY & GEMINI FALLBACK  ');
console.log('  Biro Statistika BEM Universitas Diponegoro                           ');
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
      export * from './src/data/demoSurvey1';
      export * from './src/data/demoSurvey2';
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
  buildGeminiPrompt,
  resolveNarrativeWithFallback,
  fetchGeminiNarrative,
  generateOfflineSummary,
  parseCSVString,
  isPIIColumn,
  loadDemoSurvey1,
  loadDemoSurvey2,
  DEMO_SURVEY_1_ROWS,
  DEMO_SURVEY_2_ROWS,
} = moduleExports.exports;

console.log('✓ TypeScript modules compiled and loaded successfully.\n');

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function runTest(testName, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result && typeof result.then === 'function') {
      await result;
    }
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } catch (err) {
    failedTests++;
    failures.push({ name: testName, error: err.message, stack: err.stack });
    console.error(`  ✗ [FAIL] ${testName}`);
    console.error(`     Error: ${err.message}`);
  }
}

// Locate raw files
const rawPath1 = 'C:/Users/geova/.gemini/antigravity/raw/survey_sample_1.csv';
const rawPath2 = 'C:/Users/geova/.gemini/antigravity/raw/survey_sample_2.csv';

(async () => {
  console.log('------------------------------------------------------------------------');
  console.log('TEST SUITE 1: Actual Survey Datasets Ingestion & PII Column Identification');
  console.log('------------------------------------------------------------------------');

  let ds1Raw, ds2Raw;
  let ds1Demo, ds2Demo;

  await runTest('Load and parse actual raw survey_sample_1.csv from raw directory', async () => {
    assert.ok(fs.existsSync(rawPath1), `File must exist at ${rawPath1}`);
    const content = fs.readFileSync(rawPath1, 'utf8');
    ds1Raw = await parseCSVString(content, 'survey_sample_1.csv');
    assert.strictEqual(ds1Raw.rowCount, 134, 'Survey 1 row count must be 134');
    assert.ok(ds1Raw.columns.length >= 25, 'Survey 1 must have at least 25 columns');
  });

  await runTest('Load and parse actual raw survey_sample_2.csv from raw directory', async () => {
    assert.ok(fs.existsSync(rawPath2), `File must exist at ${rawPath2}`);
    const content = fs.readFileSync(rawPath2, 'utf8');
    ds2Raw = await parseCSVString(content, 'survey_sample_2.csv');
    assert.strictEqual(ds2Raw.rowCount, 197, 'Survey 2 row count must be 197');
    assert.ok(ds2Raw.columns.length >= 10, 'Survey 2 must have at least 10 columns');
  });

  await runTest('Load pre-bundled Demo Survey 1 and Demo Survey 2', () => {
    ds1Demo = loadDemoSurvey1();
    ds2Demo = loadDemoSurvey2();
    assert.strictEqual(ds1Demo.rowCount, 134);
    assert.strictEqual(ds2Demo.rowCount, 197);
  });

  // Extract all PII columns from datasets
  const s1PiiCols = ds1Raw.columns.filter((c) => c.isPII || c.type === 'METADATA_PII');
  const s2PiiCols = ds2Raw.columns.filter((c) => c.isPII || c.type === 'METADATA_PII');

  await runTest('Verify PII columns identified in Survey 1', () => {
    const colNames = s1PiiCols.map((c) => c.cleanName);
    assert.ok(colNames.includes('Timestamp'), 'Timestamp must be identified as PII');
    assert.ok(colNames.includes('Nama Lengkap'), 'Nama Lengkap must be identified as PII');
    s1PiiCols.forEach((c) => {
      assert.strictEqual(c.isPII, true);
      assert.strictEqual(c.type, 'METADATA_PII');
    });
  });

  await runTest('Verify PII columns identified in Survey 2', () => {
    const colNames = s2PiiCols.map((c) => c.cleanName);
    assert.ok(colNames.includes('Timestamp'), 'Timestamp must be identified as PII');
    assert.ok(colNames.includes('Nama (Diperkenankan menggunakan inisial)'), 'Nama must be identified as PII');
    assert.ok(colNames.includes('NIM'), 'NIM must be identified as PII');
    s2PiiCols.forEach((c) => {
      assert.strictEqual(c.isPII, true);
      assert.strictEqual(c.type, 'METADATA_PII');
    });
  });

  console.log('\n------------------------------------------------------------------------');
  console.log('TEST SUITE 2: Empirical Zero-PII Leakage in buildGeminiPrompt');
  console.log('------------------------------------------------------------------------');

  // Collect all raw student names from Survey 1
  const s1RawNames = ds1Raw.rawRows.map((r) => r['Nama Lengkap '] || r['Nama Lengkap']).filter(Boolean);
  const knownS1Names = [
    'Tsalista Faiza',
    'Geovany Bramanthya',
    'Alya Fara Humairo',
    'Andini Dian Sasna',
    'Bintang Alamsyah',
    'Aditya Wardhana',
  ];

  await runTest('Assert buildGeminiPrompt contains ZERO student names from Survey 1 Nama Lengkap', () => {
    const namaCol = s1PiiCols.find((c) => c.cleanName === 'Nama Lengkap');
    assert.ok(namaCol, 'Nama Lengkap column must exist');
    const promptStr = buildGeminiPrompt(namaCol);

    // Test specific known student names
    for (const name of knownS1Names) {
      assert.strictEqual(
        promptStr.toLowerCase().includes(name.toLowerCase()),
        false,
        `Prompt string must NOT contain student name: ${name}`
      );
    }

    // Exhaustive test: test every single student name in the 134 raw rows
    let leakedCount = 0;
    for (const name of s1RawNames) {
      if (name.trim().length > 3 && promptStr.toLowerCase().includes(name.trim().toLowerCase())) {
        leakedCount++;
      }
    }
    assert.strictEqual(leakedCount, 0, `Prompt leaked ${leakedCount} student names from raw rows!`);

    // Verify parsed distribution is empty object
    const parsed = JSON.parse(promptStr);
    assert.deepStrictEqual(parsed.distribution, {}, 'Distribution must be sanitized to {}');
    assert.strictEqual(parsed.n_valid, namaCol.validResponses);
  });

  await runTest('Assert buildGeminiPrompt on Survey 1 Timestamp contains empty distribution', () => {
    const timestampCol = s1PiiCols.find((c) => c.cleanName === 'Timestamp');
    assert.ok(timestampCol, 'Timestamp column must exist');
    const promptStr = buildGeminiPrompt(timestampCol);

    const parsed = JSON.parse(promptStr);
    assert.deepStrictEqual(parsed.distribution, {}, 'Timestamp distribution must be sanitized to {}');
  });

  // Collect all raw student names/initials and NIMs from Survey 2
  const s2RawNames = ds2Raw.rawRows
    .map((r) => r['Nama (Diperkenankan menggunakan inisial)'])
    .filter(Boolean);
  const s2RawNims = ds2Raw.rawRows.map((r) => r['NIM']).filter(Boolean);

  await runTest('Assert buildGeminiPrompt contains ZERO student names/initials from Survey 2', () => {
    const namaCol = s2PiiCols.find((c) => c.cleanName === 'Nama (Diperkenankan menggunakan inisial)');
    assert.ok(namaCol, 'Nama column in Survey 2 must exist');
    const promptStr = buildGeminiPrompt(namaCol);

    let leakedCount = 0;
    for (const name of s2RawNames) {
      if (name.trim().length > 3 && promptStr.toLowerCase().includes(name.trim().toLowerCase())) {
        leakedCount++;
      }
    }
    assert.strictEqual(leakedCount, 0, `Prompt leaked ${leakedCount} names/initials from Survey 2!`);

    const parsed = JSON.parse(promptStr);
    assert.deepStrictEqual(parsed.distribution, {}, 'Distribution must be sanitized to {}');
  });

  await runTest('Assert buildGeminiPrompt contains ZERO student IDs (NIM) from Survey 2', () => {
    const nimCol = s2PiiCols.find((c) => c.cleanName === 'NIM');
    assert.ok(nimCol, 'NIM column in Survey 2 must exist');
    const promptStr = buildGeminiPrompt(nimCol);

    let leakedNims = 0;
    for (const nim of s2RawNims) {
      if (nim.trim().length >= 6 && promptStr.includes(nim.trim())) {
        leakedNims++;
      }
    }
    assert.strictEqual(leakedNims, 0, `Prompt leaked ${leakedNims} NIM numbers from Survey 2!`);

    const parsed = JSON.parse(promptStr);
    assert.deepStrictEqual(parsed.distribution, {}, 'NIM distribution must be sanitized to {}');
  });

  await runTest('Adversarial synthetic PII columns with malicious injection vectors', () => {
    const adversarialPiiCols = [
      {
        id: 'col_adv_1',
        columnIndex: 0,
        rawName: 'Email Address',
        cleanName: 'Email Address',
        displayTitle: 'Email Address',
        type: 'METADATA_PII',
        isPII: true,
        isExcluded: true,
        recommendedChart: 'none',
        selectedChart: 'none',
        totalResponses: 50,
        validResponses: 50,
        missingResponses: 0,
        uniqueValuesCount: 50,
        distribution: {
          'tsalista@undip.ac.id': 1,
          'geovany@live.undip.ac.id': 1,
          'admin@undip.ac.id': 1,
        },
        offlineSummary: '',
      },
      {
        id: 'col_adv_2',
        columnIndex: 1,
        rawName: 'Nomor WhatsApp',
        cleanName: 'Nomor WhatsApp',
        displayTitle: 'Nomor WhatsApp',
        type: 'METADATA_PII',
        isPII: true,
        isExcluded: true,
        recommendedChart: 'none',
        selectedChart: 'none',
        totalResponses: 30,
        validResponses: 30,
        missingResponses: 0,
        uniqueValuesCount: 30,
        distribution: {
          '081234567890': 1,
          '+628987654321': 1,
        },
        offlineSummary: '',
      },
      {
        id: 'col_adv_3',
        columnIndex: 2,
        rawName: 'Misclassified Nominal PII',
        cleanName: 'Nama Lengkap',
        displayTitle: 'Nama Lengkap',
        type: 'NOMINAL_DEMOGRAPHIC', // Edge case: type says NOMINAL, but isPII: true
        isPII: true,
        isExcluded: true,
        recommendedChart: 'horizontal_bar',
        selectedChart: 'horizontal_bar',
        totalResponses: 10,
        validResponses: 10,
        missingResponses: 0,
        uniqueValuesCount: 10,
        distribution: {
          'Malicious Student 1': 1,
          'Malicious Student 2': 1,
        },
        offlineSummary: '',
      },
      {
        id: 'col_adv_4',
        columnIndex: 3,
        rawName: 'Misclassified Flag PII',
        cleanName: 'Student ID',
        displayTitle: 'Student ID',
        type: 'METADATA_PII', // Edge case: isPII says false, but type: METADATA_PII
        isPII: false,
        isExcluded: true,
        recommendedChart: 'none',
        selectedChart: 'none',
        totalResponses: 10,
        validResponses: 10,
        missingResponses: 0,
        uniqueValuesCount: 10,
        distribution: {
          '21060120140001': 1,
          '21060120140002': 1,
        },
        offlineSummary: '',
      },
    ];

    for (const col of adversarialPiiCols) {
      const prompt = buildGeminiPrompt(col);
      const parsed = JSON.parse(prompt);
      assert.deepStrictEqual(parsed.distribution, {}, `Distribution must be {} for ${col.cleanName}`);
      assert.strictEqual(prompt.includes('tsalista@undip.ac.id'), false);
      assert.strictEqual(prompt.includes('081234567890'), false);
      assert.strictEqual(prompt.includes('Malicious Student'), false);
      assert.strictEqual(prompt.includes('21060120140001'), false);
    }
  });

  console.log('\n------------------------------------------------------------------------');
  console.log('TEST SUITE 3: fetchGeminiNarrative Network Interception & Preflight Guard');
  console.log('------------------------------------------------------------------------');

  // Mock global.fetch to intercept any network requests
  let networkCalls = [];
  const originalFetch = global.fetch;

  function installNetworkTrap() {
    networkCalls = [];
    global.fetch = async (url, options) => {
      networkCalls.push({ url, options });
      throw new Error(`CRITICAL SECURITY FAILURE: Unexpected network request dispatched to ${url}!`);
    };
  }

  function uninstallNetworkTrap() {
    global.fetch = originalFetch;
    networkCalls = [];
  }

  await runTest('fetchGeminiNarrative on Survey 1 Nama Lengkap triggers ZERO network calls and forces fallback', async () => {
    installNetworkTrap();
    try {
      const namaCol = s1PiiCols.find((c) => c.cleanName === 'Nama Lengkap');
      const validApiKey = 'AIzaSyFakeKeyValidFormat1234567890ABCDEF';

      const result = await fetchGeminiNarrative(namaCol, validApiKey);

      assert.strictEqual(networkCalls.length, 0, 'Zero network calls must be made for PII column');
      assert.strictEqual(result.isOfflineFallback, true, 'isOfflineFallback must be true');
      assert.ok(
        result.narrative.includes('PII') ||
        result.narrative.includes('privasi') ||
        result.narrative.includes('identitas'),
        'Narrative must contain privacy notice'
      );
      assert.strictEqual(result.narrative.includes('Tsalista Faiza'), false);
      assert.strictEqual(result.narrative.includes('Geovany Bramanthya'), false);
    } finally {
      uninstallNetworkTrap();
    }
  });

  await runTest('fetchGeminiNarrative on Survey 1 Timestamp triggers ZERO network calls and forces fallback', async () => {
    installNetworkTrap();
    try {
      const timestampCol = s1PiiCols.find((c) => c.cleanName === 'Timestamp');
      const validApiKey = 'AIzaSyFakeKeyValidFormat1234567890ABCDEF';

      const result = await fetchGeminiNarrative(timestampCol, validApiKey);

      assert.strictEqual(networkCalls.length, 0, 'Zero network calls must be made for Timestamp column');
      assert.strictEqual(result.isOfflineFallback, true);
      assert.ok(result.narrative.includes('PII') || result.narrative.includes('privasi'));
    } finally {
      uninstallNetworkTrap();
    }
  });

  await runTest('fetchGeminiNarrative on Survey 2 Nama triggers ZERO network calls and forces fallback', async () => {
    installNetworkTrap();
    try {
      const namaCol = s2PiiCols.find((c) => c.cleanName === 'Nama (Diperkenankan menggunakan inisial)');
      const validApiKey = 'AIzaSyFakeKeyValidFormat1234567890ABCDEF';

      const result = await fetchGeminiNarrative(namaCol, validApiKey);

      assert.strictEqual(networkCalls.length, 0);
      assert.strictEqual(result.isOfflineFallback, true);
      assert.ok(result.narrative.includes('PII') || result.narrative.includes('privasi'));
      for (const name of s2RawNames.slice(0, 10)) {
        if (name.length > 3) {
          assert.strictEqual(result.narrative.includes(name), false);
        }
      }
    } finally {
      uninstallNetworkTrap();
    }
  });

  await runTest('fetchGeminiNarrative on Survey 2 NIM triggers ZERO network calls and forces fallback', async () => {
    installNetworkTrap();
    try {
      const nimCol = s2PiiCols.find((c) => c.cleanName === 'NIM');
      const validApiKey = 'AIzaSyFakeKeyValidFormat1234567890ABCDEF';

      const result = await fetchGeminiNarrative(nimCol, validApiKey);

      assert.strictEqual(networkCalls.length, 0);
      assert.strictEqual(result.isOfflineFallback, true);
      assert.ok(result.narrative.includes('PII') || result.narrative.includes('privasi'));
      for (const nim of s2RawNims.slice(0, 10)) {
        if (nim.length > 6) {
          assert.strictEqual(result.narrative.includes(nim), false);
        }
      }
    } finally {
      uninstallNetworkTrap();
    }
  });

  await runTest('resolveNarrativeWithFallback on PII columns always returns offline fallback', () => {
    for (const col of [...s1PiiCols, ...s2PiiCols]) {
      const resultWithKey = resolveNarrativeWithFallback(col, 'AIzaSyValidKey', true);
      assert.strictEqual(resultWithKey.isOfflineFallback, true, `Must force offline for ${col.cleanName}`);
      assert.ok(
        resultWithKey.narrative.includes('privasi') ||
        resultWithKey.narrative.includes('Diabaikan') ||
        resultWithKey.narrative.includes('metadata'),
        `Narrative must explain privacy protection for ${col.cleanName}`
      );
      assert.strictEqual(resultWithKey.narrative.includes('Tsalista Faiza'), false);
      assert.strictEqual(resultWithKey.narrative.includes('Geovany Bramanthya'), false);

      const resultWithoutKey = resolveNarrativeWithFallback(col, '', false);
      assert.strictEqual(resultWithoutKey.isOfflineFallback, true);
    }
  });

  console.log('\n------------------------------------------------------------------------');
  console.log('TEST SUITE 4: Preservation of Non-PII Aggregated Distributions');
  console.log('------------------------------------------------------------------------');

  // Test Demographics column in Survey 1
  await runTest('Preservation of Demographics distribution (Asal Bidang/Biro/Kantor)', () => {
    const bidangCol = ds1Raw.columns.find((c) => c.cleanName.includes('Bidang/Biro/Kantor'));
    assert.ok(bidangCol, 'Bidang/Biro/Kantor column must exist in Survey 1');
    assert.strictEqual(bidangCol.isPII, false, 'Demographic must NOT be PII');

    const promptStr = buildGeminiPrompt(bidangCol);
    const parsed = JSON.parse(promptStr);

    assert.strictEqual(parsed.type, bidangCol.type);
    assert.strictEqual(parsed.n_valid, bidangCol.validResponses);
    assert.deepStrictEqual(parsed.distribution, bidangCol.distribution);

    // Verify key categories exist
    const categories = Object.keys(parsed.distribution);
    assert.ok(categories.length > 5, 'Must contain multiple biro/bidang categories');
    const totalCount = Object.values(parsed.distribution).reduce((a, b) => a + b, 0);
    assert.strictEqual(totalCount, bidangCol.validResponses, 'Total counts in distribution must match valid responses');
  });

  // Test Demographics column in Survey 2
  await runTest('Preservation of Demographics distribution (Asal Fakultas)', () => {
    const fakultasCol = ds2Raw.columns.find((c) => c.cleanName === 'Asal Fakultas');
    assert.ok(fakultasCol, 'Asal Fakultas column must exist in Survey 2');
    assert.strictEqual(fakultasCol.isPII, false, 'Asal Fakultas must NOT be PII');

    const promptStr = buildGeminiPrompt(fakultasCol);
    const parsed = JSON.parse(promptStr);

    assert.deepStrictEqual(parsed.distribution, fakultasCol.distribution);
    assert.ok(parsed.distribution['Fakultas Teknik'] > 0);
    assert.ok(parsed.distribution['Fakultas Sains dan Matematika'] > 0);
  });

  // Test Likert question in Survey 1
  await runTest('Preservation of Likert Scale distribution & statistics', () => {
    const likertCol = ds1Raw.columns.find((c) => c.type === 'LIKERT_SCALE');
    assert.ok(likertCol, 'At least one Likert column must exist in Survey 1');
    assert.strictEqual(likertCol.isPII, false);

    const promptStr = buildGeminiPrompt(likertCol);
    const parsed = JSON.parse(promptStr);

    assert.deepStrictEqual(parsed.distribution, likertCol.distribution);
    assert.ok(likertCol.likertScale, 'Likert stats must exist');
    assert.ok(likertCol.likertScale.mean >= 1 && likertCol.likertScale.mean <= 5);
    assert.ok(likertCol.likertScale.netPositivePercent >= 0 && likertCol.likertScale.netPositivePercent <= 100);
  });

  // Test Multi-Select Checkboxes in Survey 1
  await runTest('Preservation of Multi-Select Checkbox distribution & token frequencies', () => {
    const multiCol = ds1Raw.columns.find((c) => c.type === 'MULTI_SELECT_CHECKBOX');
    assert.ok(multiCol, 'At least one Multi-Select column must exist in Survey 1');
    assert.strictEqual(multiCol.isPII, false);

    const promptStr = buildGeminiPrompt(multiCol);
    const parsed = JSON.parse(promptStr);

    assert.deepStrictEqual(parsed.distribution, multiCol.distribution);
    assert.ok(multiCol.multiSelect, 'MultiSelect stats must exist');
    assert.ok(multiCol.multiSelect.tokenFrequencies.length > 0);
  });

  // Test Dichotomous Binary question in Survey 2
  await runTest('Preservation of Dichotomous Binary distribution (Ya/Tidak)', () => {
    const binaryCol = ds2Raw.columns.find((c) => c.type === 'DICHOTOMOUS_BINARY');
    assert.ok(binaryCol, 'At least one Binary column must exist in Survey 2');
    assert.strictEqual(binaryCol.isPII, false);

    const promptStr = buildGeminiPrompt(binaryCol);
    const parsed = JSON.parse(promptStr);

    assert.deepStrictEqual(parsed.distribution, binaryCol.distribution);
    assert.ok('Ya' in parsed.distribution || 'Tidak' in parsed.distribution);
  });

  // Test fetchGeminiNarrative with mock response on Non-PII column
  await runTest('fetchGeminiNarrative succeeds and passes aggregated data on Non-PII column', async () => {
    let capturedRequest = null;
    global.fetch = async (url, options) => {
      capturedRequest = { url, options };
      return {
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Responden mayoritas menyetujui program kerja dengan tingkat kepuasan tinggi.',
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    try {
      const fakultasCol = ds2Raw.columns.find((c) => c.cleanName === 'Asal Fakultas');
      const validApiKey = 'AIzaSyFakeKeyValidFormat1234567890ABCDEF';

      const result = await fetchGeminiNarrative(fakultasCol, validApiKey);

      assert.strictEqual(result.isOfflineFallback, false, 'Must be online success');
      assert.ok(result.narrative.startsWith('[Gemini AI]'));
      assert.ok(result.narrative.includes('Responden mayoritas menyetujui'));

      // Check captured request payload
      assert.ok(capturedRequest, 'Fetch request must have been dispatched');
      assert.ok(capturedRequest.url.includes('generativelanguage.googleapis.com'));
      assert.ok(capturedRequest.url.includes(validApiKey));

      const body = JSON.parse(capturedRequest.options.body);
      const promptText = body.contents[0].parts[0].text;

      // Aggregated distribution must be in prompt
      assert.ok(promptText.includes('Distribusi Frekuensi:'));
      assert.ok(promptText.includes('Fakultas Teknik'));
      assert.ok(promptText.includes('Fakultas Sains dan Matematika'));

      // Individual names must NOT be in prompt
      assert.strictEqual(promptText.includes('Tsalista Faiza'), false);
      assert.strictEqual(promptText.includes('Geovany Bramanthya'), false);
    } finally {
      uninstallNetworkTrap();
    }
  });

  console.log('\n------------------------------------------------------------------------');
  console.log('TEST SUITE 5: UI Layer Safeguards in ColumnDetailModal.tsx');
  console.log('------------------------------------------------------------------------');

  await runTest('Verify ColumnDetailModal.tsx contains programmatic PII guard and disabled button', () => {
    const modalPath = path.resolve(__dirname, '../src/components/curation/ColumnDetailModal.tsx');
    assert.ok(fs.existsSync(modalPath), 'ColumnDetailModal.tsx must exist');
    const modalSource = fs.readFileSync(modalPath, 'utf8');

    // 1. Check isPiiColumn definition
    assert.ok(
      modalSource.includes("const isPiiColumn = Boolean(column.isPII || column.type === 'METADATA_PII');"),
      'Must define isPiiColumn checking both isPII and METADATA_PII'
    );

    // 2. Check handleGenerateAi early return guard
    assert.ok(
      modalSource.includes('if (isPiiColumn) {') &&
      modalSource.includes('AI dinonaktifkan untuk kolom PII / identitas pribadi'),
      'handleGenerateAi must guard against PII and set notice'
    );

    // 3. Check button disabled state
    assert.ok(
      modalSource.includes('disabled={isGeneratingAi || isPiiColumn}'),
      'AI button must be disabled when isPiiColumn is true'
    );

    // 4. Check warning badge rendered in UI
    assert.ok(
      modalSource.includes('AI dinonaktifkan untuk kolom PII / identitas pribadi'),
      'UI must render warning badge for PII columns'
    );
  });

  console.log('\n------------------------------------------------------------------------');
  console.log('TEST SUITE 6: High Concurrency & Stress Invariants (100 Concurrent Calls)');
  console.log('------------------------------------------------------------------------');

  await runTest('Concurrent execution of 100 fetchGeminiNarrative calls across mixed columns', async () => {
    installNetworkTrap();
    try {
      const validApiKey = 'AIzaSyFakeKeyValidFormat1234567890ABCDEF';
      const piiCol = s1PiiCols.find((c) => c.cleanName === 'Nama Lengkap');

      // Create array of 100 simultaneous calls on PII column
      const promises = Array.from({ length: 100 }, () =>
        fetchGeminiNarrative(piiCol, validApiKey)
      );

      const results = await Promise.all(promises);

      assert.strictEqual(results.length, 100);
      assert.strictEqual(networkCalls.length, 0, 'Zero network calls across all 100 concurrent requests');

      for (const res of results) {
        assert.strictEqual(res.isOfflineFallback, true);
        assert.ok(res.narrative.includes('PII') || res.narrative.includes('privasi'));
        assert.strictEqual(res.narrative.includes('Tsalista Faiza'), false);
        assert.strictEqual(res.narrative.includes('Geovany Bramanthya'), false);
      }
    } finally {
      uninstallNetworkTrap();
    }
  });

  console.log('\n========================================================================');
  console.log(`RE-VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (failedTests > 0) {
    console.log(`FAILURES: ${failedTests} CHECKS FAILED`);
    failures.forEach((f, idx) => {
      console.log(` [${idx + 1}] ${f.name}: ${f.error}`);
    });
    console.log('>>> VERDICT: REJECT (FAILURES DETECTED) <<<');
    process.exit(1);
  } else {
    console.log('ALL PII CONTROLS AND GEMINI FALLBACK VERIFIED WITH ZERO LEAKAGE.');
    console.log('>>> VERDICT: APPROVE <<<');
    console.log('========================================================================\n');
  }
})();
