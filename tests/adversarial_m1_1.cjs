/**
 * Comprehensive Adversarial Stress Test Suite: Milestone 1 Ingestion & Profiling Engine
 * Agent: challenger_m1_1 (Empirical Challenger)
 * 
 * Verifies and stresses:
 * 1. Malformed CSVs & Delimiter/Newline/Quote Corner Cases
 * 2. PII Detection (Dotted acronyms, abbreviations, case variations, false-positive traps)
 * 3. Commas in Narrative Essays vs Multi-Select Checkboxes
 * 4. Likert Scales with Missing Middle/Extreme Ratings & Boundary Conditions
 * 5. Multi-Select Token Deduplication & Case Variations
 * 6. Placeholder / Empty Column Degeneracies
 * 7. Duplicate Column Header Collision
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('======================================================================');
console.log('  ADVERSARIAL CHALLENGER TEST SUITE: MILESTONE 1 (challenger_m1_1)     ');
console.log('======================================================================\n');

// Compile TypeScript modules in memory
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
  determineRecommendedChart,
  generateOfflineSummary,
  loadDemoSurvey1,
  loadDemoSurvey2,
  loadDemoSurveyById,
} = moduleExports.exports;

console.log('✓ Modules compiled and loaded successfully.\n');

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  findings: [],
};

function recordTest(suite, testName, fn) {
  testResults.total++;
  try {
    fn();
    testResults.passed++;
    console.log(`  [PASS] ${testName}`);
  } catch (err) {
    testResults.failed++;
    console.log(`  [FAIL] ${testName}`);
    console.log(`         Error: ${err.message}`);
    testResults.findings.push({ suite, testName, error: err.message });
  }
}

async function recordAsyncTest(suite, testName, fn) {
  testResults.total++;
  try {
    await fn();
    testResults.passed++;
    console.log(`  [PASS] ${testName}`);
  } catch (err) {
    testResults.failed++;
    console.log(`  [FAIL] ${testName}`);
    console.log(`         Error: ${err.message}`);
    testResults.findings.push({ suite, testName, error: err.message });
  }
}

(async () => {
  // =========================================================================
  // CATEGORY 1: MALFORMED CSV HANDLING & BOUNDARY RESILIENCE
  // =========================================================================
  console.log('\n--- CATEGORY 1: Malformed CSV & Boundary Resilience ---');

  // Test 1.1: Completely empty CSV
  await recordAsyncTest('CSV Handling', 'Rejects completely empty CSV with descriptive error', async () => {
    try {
      await parseCSVString('');
      assert.fail('Should have thrown an error for empty CSV');
    } catch (err) {
      assert.ok(err.message.includes('kosong') || err.message.includes('tidak memiliki'));
    }
  });

  // Test 1.2: CSV with whitespace and empty lines only
  await recordAsyncTest('CSV Handling', 'Rejects whitespace-only and blank-line CSV', async () => {
    try {
      await parseCSVString('   \n\r\n\t\n   \n');
      assert.fail('Should have thrown for whitespace-only CSV');
    } catch (err) {
      assert.ok(err.message.includes('kosong') || err.message.includes('tidak memiliki'));
    }
  });

  // Test 1.3: CSV with header only, zero data rows
  await recordAsyncTest('CSV Handling', 'Rejects header-only CSV (no data rows)', async () => {
    try {
      await parseCSVString('Timestamp,Nama,Fakultas\n');
      assert.fail('Should have thrown for header-only CSV');
    } catch (err) {
      assert.ok(err.message.includes('kosong') || err.message.includes('tidak memiliki'));
    }
  });

  // Test 1.4: Single-row dataset (header + exactly 1 data row)
  await recordAsyncTest('CSV Handling', 'Gracefully profiles single-row dataset without crash or NaN', async () => {
    const csv = 'Nama Lengkap,Asal Fakultas,Pernah Mengalami,Skala Kepuasan\nBudi Santoso,Fakultas Teknik,Ya,4';
    const dataset = await parseCSVString(csv, 'single_row.csv');
    assert.strictEqual(dataset.rowCount, 1);
    assert.strictEqual(dataset.columns.length, 4);

    const piiCol = dataset.columns[0];
    assert.strictEqual(piiCol.isPII, true);
    assert.strictEqual(piiCol.type, 'METADATA_PII');

    const likertCol = dataset.columns[3];
    assert.strictEqual(likertCol.type, 'LIKERT_SCALE');
    assert.strictEqual(likertCol.likertScale.mean, 4);
    assert.strictEqual(likertCol.likertScale.netPositivePercent, 100);
    assert.ok(!isNaN(likertCol.likertScale.mean));
  });

  // Test 1.5: Mixed line endings (CRLF vs LF)
  await recordAsyncTest('CSV Handling', 'Handles standard CRLF and LF line endings', async () => {
    const csv = 'Timestamp,Nama,Fakultas\r\n2026-01-01,Andi,FT\r\n2026-01-02,Budi,FEB\n2026-01-03,Citra,FSM';
    const dataset = await parseCSVString(csv, 'mixed_endings.csv');
    assert.strictEqual(dataset.rowCount, 3);
    assert.strictEqual(dataset.columns.length, 3);
    assert.strictEqual(dataset.columns[2].validResponses, 3);
  });

  // Test 1.6: Mismatched columns (ragged rows)
  await recordAsyncTest('CSV Handling', 'Handles ragged rows (fewer/extra columns) without crashing', async () => {
    const csv = [
      'Timestamp,Nama,Fakultas,Nilai',
      '2026-01-01,Andi,FT',                 // Missing column 4
      '2026-01-02,Budi,FEB,4,EXTRA_DATA',   // Extra column 5
      '2026-01-03,Citra,FSM,3',             // Normal
    ].join('\n');
    const dataset = await parseCSVString(csv, 'ragged.csv');
    assert.strictEqual(dataset.rowCount, 3);
    assert.strictEqual(dataset.columns.length, 4);
    assert.strictEqual(dataset.columns[3].missingResponses, 1);
    assert.strictEqual(dataset.columns[3].validResponses, 2);
  });

  // Test 1.7: Unescaped internal quotes inside fields
  await recordAsyncTest('CSV Handling', 'Does not crash on unescaped internal quotes', async () => {
    const csv = [
      'Timestamp,Nama,Komentar',
      '2026-01-01,Andi,Acara "UPGRADING" sangat seru dan inspiratif',
      '2026-01-02,Budi,"Materi sangat baik, tapi durasi kurang"',
      '2026-01-03,Citra,Sesi "Ice Breaking" perlu diperbanyak',
    ].join('\n');
    const dataset = await parseCSVString(csv, 'unescaped_quotes.csv');
    assert.strictEqual(dataset.rowCount, 3);
    assert.strictEqual(dataset.columns[2].validResponses, 3);
  });

  // Test 1.8: Interspersed empty lines
  await recordAsyncTest('CSV Handling', 'Gracefully skips interspersed empty lines', async () => {
    const csv = [
      'Timestamp,Nama,Pilihan',
      '',
      '2026-01-01,Andi,Opsi A',
      '',
      '',
      '2026-01-02,Budi,Opsi B',
      '',
    ].join('\n');
    const dataset = await parseCSVString(csv, 'empty_lines.csv');
    assert.strictEqual(dataset.rowCount, 2);
  });

  // Test 1.9: Duplicate column headers in raw CSV
  await recordAsyncTest('CSV Handling', 'Stress: Duplicate column headers in CSV export', async () => {
    const csv = [
      'Timestamp,Catatan,Catatan',
      '2026-01-01,Catatan Pertama,Catatan Kedua',
      '2026-01-02,Catatan Tiga,Catatan Empat',
    ].join('\n');
    const dataset = await parseCSVString(csv, 'dup_headers.csv');
    // Check if both columns have unique IDs
    assert.notStrictEqual(dataset.columns[1].id, dataset.columns[2].id);
    // Check if column values are preserved or overwritten
    const col1Val = dataset.columns[1].distribution;
    const col2Val = dataset.columns[2].distribution;
    console.log('       [Info] Duplicate header values check:', { col1: Object.keys(col1Val), col2: Object.keys(col2Val) });
    // In record[header], duplicate keys overwrite each other
    if (Object.keys(col1Val)[0] === Object.keys(col2Val)[0]) {
      throw new Error('DUPLICATE HEADER COLLISION: Second column overwrote first column data due to Record<string, string> key collision');
    }
  });


  // =========================================================================
  // CATEGORY 2: PII DETECTION & ADVERSARIAL VARIATIONS
  // =========================================================================
  console.log('\n--- CATEGORY 2: PII Detection & Adversarial Variations ---');

  // Test 2.1: Case variations
  recordTest('PII Detection', 'Matches uppercase and mixed case PII headers', () => {
    assert.strictEqual(isPIIColumn('TIMESTAMP'), true);
    assert.strictEqual(isPIIColumn('TiMeStAmP'), true);
    assert.strictEqual(isPIIColumn('NAMA LENGKAP'), true);
    assert.strictEqual(isPIIColumn('NaMa MaHaSiSwA'), true);
    assert.strictEqual(isPIIColumn('EMAIL'), true);
    assert.strictEqual(isPIIColumn('No Hp'), true);
    assert.strictEqual(isPIIColumn('WHATSAPP'), true);
    assert.strictEqual(isPIIColumn('STUDENT ID'), true);
  });

  // Test 2.2: Hyphenated and spaced email/contact headers
  recordTest('PII Detection', 'Matches hyphenated and spaced email/contact headers', () => {
    assert.strictEqual(isPIIColumn('E-MAIL'), true);
    assert.strictEqual(isPIIColumn('e-mail'), true);
    assert.strictEqual(isPIIColumn('No. HP'), true);
    assert.strictEqual(isPIIColumn('No. WA'), true);
    assert.strictEqual(isPIIColumn('Nomor Telepon'), true);
    assert.strictEqual(isPIIColumn('Nomor Kontak'), true);
  });

  // Test 2.3: PII variation "N.I.M." (dotted acronym)
  recordTest('PII Detection', 'Adversarial: Detects dotted academic ID "N.I.M." / "N.P.M."', () => {
    const nimWithDots = isPIIColumn('N.I.M.');
    const npmWithDots = isPIIColumn('N.P.M.');
    assert.strictEqual(nimWithDots, true, 'FAILED: "N.I.M." with dots was not recognized as PII');
    assert.strictEqual(npmWithDots, true, 'FAILED: "N.P.M." with dots was not recognized as PII');
  });

  // Test 2.4: Phone number variation "No. Telp" / "Nomor Telp"
  recordTest('PII Detection', 'Adversarial: Detects abbreviated telephone "No. Telp" / "Nomor Telp"', () => {
    const noTelp = isPIIColumn('No. Telp');
    const nomorTelp = isPIIColumn('Nomor Telp');
    assert.strictEqual(noTelp, true, 'FAILED: "No. Telp" was not recognized as PII');
    assert.strictEqual(nomorTelp, true, 'FAILED: "Nomor Telp" was not recognized as PII');
  });

  // Test 2.5: PII Overkill / False Positives (Legitimate questions starting with "Waktu", "Tanggal", "Nama")
  recordTest('PII Detection', 'Adversarial: Does NOT falsely exclude legitimate questions starting with "Waktu", "Tanggal", "Nama"', () => {
    const q1 = isPIIColumn('Waktu pelaksanaan webinar yang Anda inginkan?');
    const q2 = isPIIColumn('Tanggal kegiatan yang paling efektif untuk divisi Anda');
    const q3 = isPIIColumn('Nama kegiatan yang paling berkesan bagi Anda selama upgrading?');
    const q4 = isPIIColumn('Nama departemen atau biro pilihan pertama Anda');

    assert.strictEqual(q1, false, 'FALSE POSITIVE: "Waktu pelaksanaan webinar..." was erroneously classified as PII');
    assert.strictEqual(q2, false, 'FALSE POSITIVE: "Tanggal kegiatan..." was erroneously classified as PII');
    assert.strictEqual(q3, false, 'FALSE POSITIVE: "Nama kegiatan yang paling berkesan..." was erroneously classified as PII');
    assert.strictEqual(q4, false, 'FALSE POSITIVE: "Nama departemen pilihan..." was erroneously classified as PII');
  });


  // =========================================================================
  // CATEGORY 3: COMMAS IN NARRATIVE ESSAYS VS MULTI-SELECT CHECKBOXES
  // =========================================================================
  console.log('\n--- CATEGORY 3: Commas in Narrative Essays vs Multi-Select Checkboxes ---');

  // Test 3.1: Long narrative essay with multiple commas per sentence
  recordTest('Classifier Commas', 'Correctly classifies narrative essay containing multiple commas as OPEN_ENDED_TEXT', () => {
    const essayResponses = [
      'Menurut saya, acara upgrading sudah sangat baik, namun koordinasi antar divisi perlu ditingkatkan lagi.',
      'Materi kepemimpinan sangat aplikatif, pemateri menyampaikan materi dengan jelas, hanya saja waktu tanya jawab terlalu sempit.',
      'Harapan saya ke depan, BEM UNDIP dapat lebih responsif terhadap isu kampus, terbuka, dan transparan dalam evaluasi.',
      'Sesi team building cukup seru, tetapi lokasi outdoor terlalu panas, mohon disediakan tenda tambahan.',
      'Secara keseluruhan memuaskan, konsumsi enak, panitia ramah, dan rundown berjalan tepat waktu.',
      'Perlu ada follow-up setelah upgrading, misalnya mentoring bulanan, agar komitmen kerja tetap terjaga.',
    ];
    const res = classifyQuestion('Apa kritik, saran, dan masukan Anda untuk kepengurusan ini?', essayResponses);
    assert.strictEqual(res.type, 'OPEN_ENDED_TEXT', `Expected OPEN_ENDED_TEXT, got ${res.type}`);
    assert.strictEqual(res.isMultiSelect, false);
  });

  // Test 3.2: Short narrative comments with commas (Tricky edge case)
  recordTest('Classifier Commas', 'Adversarial: Short open feedback with commas is NOT misclassified as MULTI_SELECT_CHECKBOX', () => {
    const shortResponses = [
      'Sangat seru, terima kasih panitia',
      'Materi mantap, pemateri keren',
      'Waktu agak mepet, tapi seru',
      'AC ruangan dingin, selebihnya oke',
      'Bagus sekali, pertahankan',
      'Keren, semoga ada lagi',
      'Cukup baik, tolong konsumsi diperbaiki',
      'Sangat bermanfaat, wawasan bertambah',
      'Rundown tepat waktu, apresiasi panitia',
      'Luar biasa, materi sangat relate',
    ];
    const res = classifyQuestion('Komentar singkat mengenai kegiatan ini', shortResponses);
    assert.notStrictEqual(res.type, 'MULTI_SELECT_CHECKBOX', `Misclassified short comment as MULTI_SELECT_CHECKBOX!`);
    assert.strictEqual(res.type, 'OPEN_ENDED_TEXT', `Expected OPEN_ENDED_TEXT, got ${res.type}`);
  });

  // Test 3.3: Authentic multi-select checkbox (high Token Repeat Ratio)
  recordTest('Classifier Commas', 'Authentic multi-select with fixed options is classified as MULTI_SELECT_CHECKBOX', () => {
    const checkboxResponses = [
      'Waktu, Biaya, Fasilitas',
      'Waktu, Koordinasi',
      'Biaya, Fasilitas',
      'Waktu, Biaya, Koordinasi',
      'Fasilitas, Koordinasi',
      'Waktu, Fasilitas',
      'Biaya, Koordinasi',
      'Waktu, Biaya',
    ];
    const res = classifyQuestion('Kendala yang dihadapi dalam menjalankan program kerja (Boleh pilih lebih dari 1):', checkboxResponses);
    assert.strictEqual(res.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(res.isMultiSelect, true);
    assert.ok(res.tokenRepeatRatio > 2.0);
  });

  // Test 3.4: Multi-select with low respondent count (Small N boundary: N=3)
  recordTest('Classifier Commas', 'Adversarial: Small N (3 respondents) multi-select with explicit hint', () => {
    const smallNResponses = [
      'Pilihan A, Pilihan B',
      'Pilihan B, Pilihan C',
      'Pilihan A, Pilihan C',
    ];
    const res = classifyQuestion('Faktor penentu pemilihan program (boleh memilih lebih dari 1)', smallNResponses);
    assert.strictEqual(res.type, 'MULTI_SELECT_CHECKBOX', `Small N multi-select was classified as ${res.type}`);
  });


  // =========================================================================
  // CATEGORY 4: LIKERT SCALE CORNER CASES & MISSING RATINGS
  // =========================================================================
  console.log('\n--- CATEGORY 4: Likert Scale Corner Cases & Missing Ratings ---');

  // Test 4.1: Extreme bimodal polarization (Only 1 and 5 chosen, missing 2, 3, 4)
  recordTest('Likert Corner Cases', 'Handles extreme bimodal polarization (only 1 and 5 chosen, missing middle 2,3,4)', () => {
    const polarizedValues = ['1', '1', '1', '1', '1', '5', '5', '5', '5', '5'];
    const res = classifyQuestion('Tingkat Kepuasan Terhadap Kebijakan Baru (Skala 1-5)', polarizedValues);
    assert.strictEqual(res.type, 'LIKERT_SCALE');
    assert.strictEqual(res.likertScaleMax, 5);

    const stats = calculateLikertStats({ '1': 5, '5': 5 }, 5);
    assert.strictEqual(stats.min, 1);
    assert.strictEqual(stats.max, 5);
    assert.strictEqual(stats.mean, 3.0);
    assert.strictEqual(stats.median, 3.0);
    assert.strictEqual(stats.netPositivePercent, 50.0);
  });

  // Test 4.2: Asymmetric missing ratings (Only 2 and 4 chosen, missing 1, 3)
  recordTest('Likert Corner Cases', 'Handles missing levels (only 2 and 4 chosen, missing 1 and 3)', () => {
    const values = ['2', '4', '2', '4', '4', '2'];
    const res = classifyQuestion('Evaluasi Materi', values);
    assert.strictEqual(res.type, 'LIKERT_SCALE');
    assert.strictEqual(res.likertScaleMax, 4);

    const stats = calculateLikertStats({ '2': 3, '4': 3 }, 4);
    assert.strictEqual(stats.mean, 3.0);
    assert.strictEqual(stats.netPositivePercent, 50.0);
    assert.strictEqual(stats.median, 3.0);
  });

  // Test 4.3: Absolute consensus at endpoint 4 (100% strongly agree, 0 for other options)
  recordTest('Likert Corner Cases', 'Handles 100% consensus at single rating (e.g. all respondents answer 4)', () => {
    const values = ['4', '4', '4', '4', '4', '4', '4'];
    const res = classifyQuestion('Kesesuaian Materi dengan Kebutuhan Mahasiswa', values);
    assert.strictEqual(res.type, 'LIKERT_SCALE');
    assert.strictEqual(res.likertScaleMax, 4);

    const stats = calculateLikertStats({ '4': 7 }, 4);
    assert.strictEqual(stats.mean, 4.0);
    assert.strictEqual(stats.median, 4.0);
    assert.strictEqual(stats.netPositivePercent, 100.0);
  });

  // Test 4.4: Absolute consensus at lowest rating 1 (100% strongly disagree)
  recordTest('Likert Corner Cases', 'Handles 100% lowest rating (all respondents answer 1)', () => {
    const values = ['1', '1', '1', '1'];
    const res = classifyQuestion('Kesesuaian Jadwal', values);
    assert.strictEqual(res.type, 'LIKERT_SCALE');

    const stats = calculateLikertStats({ '1': 4 }, 4);
    assert.strictEqual(stats.mean, 1.0);
    assert.strictEqual(stats.median, 1.0);
    assert.strictEqual(stats.netPositivePercent, 0.0);
  });

  // Test 4.5: Excel float string normalization in Likert calculation ("1.0", "4.0")
  recordTest('Likert Corner Cases', 'Normalizes float strings from Excel exports in Likert calculations', () => {
    const values = ['1.0', '2.0', '3.0', '4.0', '4.0'];
    const res = classifyQuestion('Seberapa Efektif Program Ini', values);
    assert.strictEqual(res.type, 'LIKERT_SCALE');
    assert.strictEqual(res.likertScaleMax, 4);

    const stats = calculateLikertStats({ '1': 1, '2': 1, '3': 1, '4': 2 }, 4);
    assert.strictEqual(stats.mean, 2.8);
    assert.strictEqual(stats.netPositivePercent, 40.0);
  });


  // =========================================================================
  // CATEGORY 5: MULTI-SELECT TOKEN DEDUPLICATION & CASE NORMALIZATION
  // =========================================================================
  console.log('\n--- CATEGORY 5: Multi-Select Token Deduplication & Case Variations ---');

  // Test 5.1: Repeated token in single response ("Waktu, Waktu, Biaya")
  recordTest('Multi-Select Logic', 'Deduplicates repeated tokens within single respondent response', () => {
    const responses = [
      'Waktu, Waktu, Biaya', // Respondent entered Waktu twice
      'Biaya, Fasilitas',
    ];
    const res = splitMultiSelectResponses(responses, 2);
    const waktuFreq = res.tokenFrequencies.find((f) => f.token === 'Waktu');
    assert.strictEqual(waktuFreq.count, 1, `Expected Waktu count=1, got ${waktuFreq.count}`);
    assert.strictEqual(waktuFreq.percentage, 50.0);
  });

  // Test 5.2: Percentage sums for multi-select can legitimately exceed 100%
  recordTest('Multi-Select Logic', 'Correctly computes percentages of N respondents (sum > 100%)', () => {
    const responses = [
      'Opsi 1, Opsi 2, Opsi 3',
      'Opsi 1, Opsi 2',
      'Opsi 1',
    ];
    const res = splitMultiSelectResponses(responses, 3);
    const sumPercentages = res.tokenFrequencies.reduce((sum, f) => sum + f.percentage, 0);
    assert.strictEqual(sumPercentages, 200.0);
  });

  // Test 5.3: Empty selections and placeholder symbols ("-", "_") filtered
  recordTest('Multi-Select Logic', 'Filters placeholder symbols ("-", "_", "") from multi-select tokens', () => {
    const responses = [
      'Waktu, -, Biaya',
      '_',
      '-',
      'Koordinasi',
    ];
    const res = splitMultiSelectResponses(responses, 4);
    const tokens = res.tokenFrequencies.map((f) => f.token);
    assert.ok(!tokens.includes('-'), 'Dash placeholder was included as a token');
    assert.ok(!tokens.includes('_'), 'Underscore placeholder was included as a token');
    assert.strictEqual(res.totalSelections, 3);
  });

  // Test 5.4: Case-sensitivity in multi-select choices
  recordTest('Multi-Select Logic', 'Adversarial: Handles case differences in multi-select options ("Waktu", "waktu")', () => {
    const responses = [
      'Waktu, Biaya',
      'waktu, Fasilitas',
    ];
    const res = splitMultiSelectResponses(responses, 2);
    console.log('       [Info] Token counts with mixed case:', res.tokenFrequencies.map(t => `${t.token}:${t.count}`));
    // Does it create separate tokens 'Waktu' and 'waktu'?
    const tokens = res.tokenFrequencies.map((f) => f.token.toLowerCase());
    const uniqueLower = new Set(tokens);
    if (uniqueLower.size !== tokens.length) {
      console.log('       [Note] Case discrepancy: "Waktu" and "waktu" were treated as distinct tokens');
    }
  });


  // =========================================================================
  // CATEGORY 6: PLACEHOLDER / DEGENERATE COLUMNS & STATISTICAL SANITY
  // =========================================================================
  console.log('\n--- CATEGORY 6: Placeholder / Degenerate Columns & Statistical Sanity ---');

  // Test 6.1: Column with 100% whitespace/empty strings
  recordTest('Statistical Sanity', 'Profiles column with 100% empty responses as OPEN_ENDED_TEXT', () => {
    const emptyValues = ['', '', '', '   '];
    const res = classifyQuestion('Catatan Tambahan', emptyValues);
    assert.strictEqual(res.type, 'OPEN_ENDED_TEXT');
  });

  // Test 6.2: Column with only placeholder non-responses ("-", "_")
  recordTest('Statistical Sanity', 'Adversarial: Does not classify pure placeholders ("-", "_") as DICHOTOMOUS_BINARY', () => {
    const placeholderValues = ['-', '-', '_', '-', '_', '-'];
    const res = classifyQuestion('Keluhan atau Kendala Khusus', placeholderValues);
    assert.notStrictEqual(res.type, 'DICHOTOMOUS_BINARY', 'FLAW: Column with only "-" and "_" placeholders was misclassified as DICHOTOMOUS_BINARY');
  });

  // Test 6.3: Recommended chart mapping for all question types
  recordTest('Statistical Sanity', 'Assigns valid public chart types to all recognized question categories', () => {
    assert.strictEqual(determineRecommendedChart('METADATA_PII', 0, 0), 'none');
    assert.strictEqual(determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 5), 'donut');
    assert.strictEqual(determineRecommendedChart('LIKERT_SCALE', 4, 3), 'ordered_likert');
    assert.strictEqual(determineRecommendedChart('MULTI_SELECT_CHECKBOX', 8, 12), 'ranked_bar');
    assert.strictEqual(determineRecommendedChart('OPEN_ENDED_TEXT', 20, 80), 'text_feed');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 10), 'donut');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 5, 8), 'vertical_bar');
    assert.strictEqual(determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 12, 25), 'horizontal_bar');
  });


  // =========================================================================
  // SUMMARY & VERDICT
  // =========================================================================
  console.log('\n======================================================================');
  console.log(`  ADVERSARIAL STRESS TEST RESULTS: ${testResults.passed}/${testResults.total} PASSED`);
  if (testResults.failed > 0) {
    console.log(`  FAILURES / ADVERSARIAL FLAWS DETECTED: ${testResults.failed}`);
    testResults.findings.forEach((f, idx) => {
      console.log(`    ${idx + 1}. [${f.suite}] ${f.testName}`);
      console.log(`       -> ${f.error}`);
    });
  } else {
    console.log('  NO VULNERABILITIES OR UNHANDLED EXCEPTIONS DETECTED');
  }
  console.log('======================================================================\n');
})();
