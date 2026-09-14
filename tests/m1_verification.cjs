/**
 * Standalone M1 Verification Test Suite
 * Validates Milestone 1: Ingestion & Schema Profiling Engine
 * 
 * Tests:
 * 1. CSV Parsing (RFC 4180 quotes, commas, newlines, floats)
 * 2. Excel Parsing (.xlsx workbook)
 * 3. Header Whitespace Trimming & Sanitization
 * 4. PII & Metadata Detection Regex
 * 5. 5-Tier Question Classification (Nominal, Binary, Likert 1-4 & 1-5, Multi-Select, Open-Ended)
 * 6. Likert Scale 0-Count Tolerance (Sample 1 Col 15)
 * 7. Multi-Select Checkbox Token Repeat Ratio (> 3.0) & % of N Respondents
 * 8. Bundled Demo Datasets (Instant 1-Click Offline Load)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('===============================================================');
console.log('  MILESTONE 1 VERIFICATION TEST SUITE (Ingestion & Profiling)  ');
console.log('===============================================================\n');

// 1. Bundle TypeScript source modules for in-memory Node CJS execution
console.log('[Setup] Compiling TypeScript source modules in memory via esbuild...');
const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from './src/core/parser/csvParser';
      export * from './src/core/parser/excelParser';
      export * from './src/core/parser/piiFilter';
      export * from './src/core/profiler/questionClassifier';
      export * from './src/core/profiler/multiSelectSplitter';
      export * from './src/core/profiler/statistics';
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
  parseCSVString,
  profileDataset,
  parseExcelBuffer,
  isPIIColumn,
  sanitizeHeader,
  classifyQuestion,
  normalizeValue,
  calculateTokenRepeatRatio,
  splitMultiSelectResponses,
  calculateLikertStats,
  loadDemoSurvey1,
  loadDemoSurvey2,
  loadDemoSurveyById,
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
  // Test Suite 1: Header Sanitization & Whitespace Trimming
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Header Sanitization ---');
  runTest('Trims leading and trailing whitespace', () => {
    assert.strictEqual(sanitizeHeader('  Asal Bidang/Biro/Kantor  '), 'Asal Bidang/Biro/Kantor');
    assert.strictEqual(sanitizeHeader('Nama Lengkap '), 'Nama Lengkap');
    assert.strictEqual(sanitizeHeader('  Jabatan/Posisi  '), 'Jabatan/Posisi');
  });

  runTest('Collapses multiple internal spaces to single space', () => {
    assert.strictEqual(sanitizeHeader('Nama   Lengkap   Mahasiswa'), 'Nama Lengkap Mahasiswa');
  });

  runTest('Handles empty or undefined headers safely', () => {
    assert.strictEqual(sanitizeHeader(''), '');
    assert.strictEqual(sanitizeHeader(null), '');
  });

  // -------------------------------------------------------------
  // Test Suite 2: PII / Metadata Filter Regex
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: PII & Metadata Detection ---');
  runTest('Detects Timestamp headers', () => {
    assert.strictEqual(isPIIColumn('Timestamp'), true);
    assert.strictEqual(isPIIColumn('timestamp'), true);
    assert.strictEqual(isPIIColumn('Waktu'), true);
    assert.strictEqual(isPIIColumn('Tanggal'), true);
  });

  runTest('Detects Student Name headers (full, partial, with parenthetical notes)', () => {
    assert.strictEqual(isPIIColumn('Nama Lengkap '), true);
    assert.strictEqual(isPIIColumn('Nama (Diperkenankan menggunakan inisial)'), true);
    assert.strictEqual(isPIIColumn('Nama Mahasiswa'), true);
    assert.strictEqual(isPIIColumn('Full Name'), true);
  });

  runTest('Detects Student ID (NIM, NPM, NRP)', () => {
    assert.strictEqual(isPIIColumn('NIM'), true);
    assert.strictEqual(isPIIColumn('nim'), true);
    assert.strictEqual(isPIIColumn('Nomor Induk Mahasiswa'), true);
    assert.strictEqual(isPIIColumn('NPM'), true);
  });

  runTest('Detects Email and Phone Number headers', () => {
    assert.strictEqual(isPIIColumn('Email'), true);
    assert.strictEqual(isPIIColumn('Alamat Email'), true);
    assert.strictEqual(isPIIColumn('No HP'), true);
    assert.strictEqual(isPIIColumn('Nomor WhatsApp'), true);
  });

  runTest('Does not falsely flag valid survey question headers', () => {
    assert.strictEqual(isPIIColumn('Asal Fakultas'), false);
    assert.strictEqual(isPIIColumn('Apakah Anda pernah mengalami catcalling?'), false);
    assert.strictEqual(isPIIColumn('Tingkat Kepuasan Mahasiswa'), false);
  });

  // -------------------------------------------------------------
  // Test Suite 3: Value Normalization & Float Handling
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Value Normalization ---');
  runTest('Normalizes Excel float values without trailing .0', () => {
    assert.strictEqual(normalizeValue('1.0'), '1');
    assert.strictEqual(normalizeValue('4.0'), '4');
    assert.strictEqual(normalizeValue(5.0), '5');
  });

  runTest('Trims surrounding whitespace in cell values', () => {
    assert.strictEqual(normalizeValue('  Fakultas Teknik  '), 'Fakultas Teknik');
  });

  runTest('Handles null, undefined, and empty values gracefully', () => {
    assert.strictEqual(normalizeValue(null), '');
    assert.strictEqual(normalizeValue(undefined), '');
  });

  // -------------------------------------------------------------
  // Test Suite 4: Multi-Select Splitter & Token Repeat Ratio
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Multi-Select Checkbox Splitter ---');
  runTest('Token Repeat Ratio separates fixed options (>3.0) from free text (~1.0)', () => {
    // Synthetic fixed options: 5 respondents choosing from 3 options
    const checkboxResponses = [
      'Waktu, Biaya',
      'Waktu, Koordinasi',
      'Biaya, Koordinasi',
      'Waktu, Biaya',
      'Waktu',
    ];
    const cbMetrics = calculateTokenRepeatRatio(checkboxResponses);
    assert.strictEqual(cbMetrics.totalTokens, 9);
    assert.strictEqual(cbMetrics.uniqueTokens, 3);
    assert.strictEqual(cbMetrics.ratio, 3.0);

    // Free text essay fragments
    const essayResponses = [
      'Harapannya, tentu setelah upgrading, saya menjadi pribadi lebih baik',
      'Semoga materi bermanfaat untuk divisi kami',
      'Perlu koordinasi lebih rapi antar biro',
    ];
    const essayMetrics = calculateTokenRepeatRatio(essayResponses);
    assert.ok(essayMetrics.ratio < 2.0, `Essay ratio should be < 2.0, got ${essayMetrics.ratio}`);
  });

  runTest('Calculates percentages against total respondents (N), not total tokens', () => {
    const responses = [
      'Opsi A, Opsi B',
      'Opsi A, Opsi C',
      'Opsi B',
      'Opsi A',
    ];
    const totalRespondents = 4;
    const result = splitMultiSelectResponses(responses, totalRespondents);

    assert.strictEqual(result.totalSelections, 6);
    assert.strictEqual(result.averageSelectionsPerRespondent, 1.5);

    const freqMap = Object.fromEntries(result.tokenFrequencies.map((f) => [f.token, f]));
    assert.strictEqual(freqMap['Opsi A'].count, 3);
    assert.strictEqual(freqMap['Opsi A'].percentage, 75.0); // 3 / 4 * 100
    assert.strictEqual(freqMap['Opsi B'].count, 2);
    assert.strictEqual(freqMap['Opsi B'].percentage, 50.0); // 2 / 4 * 100
    assert.strictEqual(freqMap['Opsi C'].count, 1);
    assert.strictEqual(freqMap['Opsi C'].percentage, 25.0); // 1 / 4 * 100

    // Sum of percentages exceeds 100% (75 + 50 + 25 = 150%)
    const sumPct = Object.values(freqMap).reduce((acc, f) => acc + f.percentage, 0);
    assert.strictEqual(sumPct, 150.0);
  });

  // -------------------------------------------------------------
  // Test Suite 5: Question Type Classifier Heuristics
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: Question Classifier ---');
  runTest('Classifies Dichotomous Binary with exactly 2 categories', () => {
    const values = ['Ya', 'Tidak', 'Ya', 'Ya', 'Tidak'];
    const res = classifyQuestion('Apakah Anda pernah mengalami catcalling?', values);
    assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
  });

  runTest('Classifies Likert Scale 1-4 and calculates mean and top-box', () => {
    const values = ['1', '2', '3', '4', '4', '3', '2', '4'];
    const res = classifyQuestion('Seberapa besar tantangan yang kamu hadapi?', values);
    assert.strictEqual(res.type, 'LIKERT_SCALE');
    assert.strictEqual(res.likertScaleMax, 4);
  });

  runTest('Handles Likert Scale with 0 votes in an option (tolerance edge case)', () => {
    // Only options 2, 3, 4 received votes (option 1 had 0 votes)
    const values = ['2', '3', '4', '3', '4', '4', '2', '3'];
    const res = classifyQuestion('Relevansi materi Stress Management', values);
    assert.strictEqual(res.type, 'LIKERT_SCALE');
    assert.strictEqual(res.likertScaleMax, 4);

    const stats = calculateLikertStats({ '2': 2, '3': 3, '4': 3 }, 4);
    assert.strictEqual(stats.min, 1);
    assert.strictEqual(stats.max, 4);
    assert.strictEqual(stats.netPositivePercent, 37.5); // 3 / 8 * 100
  });

  runTest('Classifies Nominal Demographics with multi-category choices', () => {
    const values = ['FSM', 'SV', 'FT', 'FEB', 'FH', 'FIB', 'FK'];
    const res = classifyQuestion('Asal Fakultas', values);
    assert.strictEqual(res.type, 'NOMINAL_DEMOGRAPHIC');
  });

  runTest('Classifies Open-Ended Essays with high uniqueness and sentence structure', () => {
    const values = [
      'Harapan saya upgrading ini memberikan wawasan mendalam dan evaluasi kinerja yang transparan.',
      'Semoga BEM UNDIP semakin progresif dan solid antar biro dalam program kerja mendatang.',
      'Materi yang disampaikan sangat baik, mohon waktu FGD diperpanjang.',
      '-',
      '-',
    ];
    const res = classifyQuestion('Apa harapan terbesar kamu terhadap program upgrading ini?', values);
    assert.strictEqual(res.type, 'OPEN_ENDED_TEXT');
  });

  // -------------------------------------------------------------
  // Test Suite 6: Authentic Sample 1 Dataset Profiling
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 6: Real-World Ingestion: Sample 1 (UPGRADING BEM UNDIP) ---');
  await runAsyncTest('Parses survey_sample_1.csv with 134 respondents and 27 columns', async () => {
    const csvPath = 'C:/Users/geova/.gemini/antigravity/raw/survey_sample_1.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const dataset = await parseCSVString(csvContent, 'survey_sample_1.csv');

    assert.strictEqual(dataset.rowCount, 134);
    assert.strictEqual(dataset.columns.length, 27);

    // PII columns
    assert.strictEqual(dataset.columns[0].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[0].isPII, true);
    assert.strictEqual(dataset.columns[1].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[1].isPII, true);

    // Col 7: Multi-Select kendala tugas BEM
    const col7 = dataset.columns[7];
    assert.strictEqual(col7.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(col7.recommendedChart, 'ranked_bar');
    assert.ok(col7.multiSelect !== undefined);
    assert.strictEqual(col7.multiSelect.totalSelections, 333);
    assert.strictEqual(col7.multiSelect.tokenFrequencies[0].token, 'Waktu');
    assert.strictEqual(col7.multiSelect.tokenFrequencies[0].count, 89);
    assert.strictEqual(col7.multiSelect.tokenFrequencies[0].percentage, 66.4);

    // Col 15: Likert scale with 0 count on option 1
    const col15 = dataset.columns[15];
    assert.strictEqual(col15.type, 'LIKERT_SCALE');
    assert.strictEqual(col15.recommendedChart, 'ordered_likert');

    // Col 25: Open-Ended text
    const col25 = dataset.columns[25];
    assert.strictEqual(col25.type, 'OPEN_ENDED_TEXT');
    assert.strictEqual(col25.recommendedChart, 'text_feed');
  });

  // -------------------------------------------------------------
  // Test Suite 7: Authentic Sample 2 Dataset Profiling
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 7: Real-World Ingestion: Sample 2 (Campus Safety & Catcalling) ---');
  await runAsyncTest('Parses survey_sample_2.csv with 197 respondents and 15 columns', async () => {
    const csvPath = 'C:/Users/geova/.gemini/antigravity/raw/survey_sample_2.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const dataset = await parseCSVString(csvContent, 'survey_sample_2.csv');

    assert.strictEqual(dataset.rowCount, 197);
    assert.strictEqual(dataset.columns.length, 15);

    // Col 0, 1, 2 are PII
    assert.strictEqual(dataset.columns[0].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[1].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[2].type, 'METADATA_PII');

    // Col 4: Dichotomous Binary (Ya/Tidak)
    const col4 = dataset.columns[4];
    assert.strictEqual(col4.type, 'DICHOTOMOUS_BINARY');
    assert.strictEqual(col4.recommendedChart, 'donut');
    assert.strictEqual(col4.distribution['Ya'], 106);
    assert.strictEqual(col4.distribution['Tidak'], 91);

    // Col 11: Massive Likert consensus (85.8% strongly agree)
    const col11 = dataset.columns[11];
    assert.strictEqual(col11.type, 'LIKERT_SCALE');
    assert.strictEqual(col11.recommendedChart, 'ordered_likert');
    assert.strictEqual(col11.distribution['4'], 169); // 169 / 197 = 85.78% -> 85.8%

    // Col 12: Open-ended qualitative incident logging
    const col12 = dataset.columns[12];
    assert.strictEqual(col12.type, 'OPEN_ENDED_TEXT');
  });

  // -------------------------------------------------------------
  // Test Suite 8: Authentic Excel Workbook Ingestion (.xlsx)
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 8: Real-World Ingestion: KTR UNDIP Excel Workbook (.xlsx) ---');
  runTest('Parses KTR.xlsx with 265 respondents and 19 columns', () => {
    const xlsxPath = 'C:/Users/geova/.gemini/antigravity/raw/Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx';
    const buffer = fs.readFileSync(xlsxPath);
    const dataset = parseExcelBuffer(buffer, 'KTR.xlsx');

    assert.strictEqual(dataset.rowCount, 265);
    assert.strictEqual(dataset.columns.length, 19);

    // Col 0: Timestamp (PII)
    assert.strictEqual(dataset.columns[0].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[0].isPII, true);

    // Col 3: Jenis kelamin (Binary)
    assert.strictEqual(dataset.columns[3].type, 'DICHOTOMOUS_BINARY');
    assert.strictEqual(dataset.columns[3].recommendedChart, 'donut');

    // Multi-Select question in Excel
    const col6 = dataset.columns[6];
    assert.strictEqual(col6.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(col6.recommendedChart, 'ranked_bar');
  });

  // -------------------------------------------------------------
  // Test Suite 9: Offline Bundled Demo Data Service
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 9: Bundled Demo Data Service ---');
  runTest('loadDemoSurvey1 returns authentic UPGRADING BEM UNDIP dataset', () => {
    const s1 = loadDemoSurvey1();
    assert.strictEqual(s1.rowCount, 134);
    assert.strictEqual(s1.columns.length, 27);
    assert.ok(s1.name.includes('UPGRADING'));
    assert.strictEqual(s1.columns[7].type, 'MULTI_SELECT_CHECKBOX');
  });

  runTest('loadDemoSurvey2 returns authentic Catcalling Survey dataset', () => {
    const s2 = loadDemoSurvey2();
    assert.strictEqual(s2.rowCount, 197);
    assert.strictEqual(s2.columns.length, 15);
    assert.ok(s2.name.includes('Catcalling') || s2.name.includes('Keamanan'));
    assert.strictEqual(s2.columns[4].type, 'DICHOTOMOUS_BINARY');
  });

  runTest('loadDemoSurveyById loads correctly by identifier', () => {
    const d1 = loadDemoSurveyById('demo_1');
    assert.strictEqual(d1.rowCount, 134);
    const d2 = loadDemoSurveyById('demo_2');
    assert.strictEqual(d2.rowCount, 197);
  });

  console.log('\n===============================================================');
  console.log(`  ALL MILESTONE 1 VERIFICATION TESTS PASSED: ${passedTests}/${totalTests} `);
  console.log('===============================================================\n');
})();
