/**
 * Independent Forensic Re-verification Suite for Milestone 1 Remediation
 * Auditor: auditor_m1_reverify
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('======================================================================');
console.log('  FORENSIC RE-VERIFICATION SUITE: MILESTONE 1 (auditor_m1_reverify)    ');
console.log('======================================================================\n');

// Compile TypeScript modules in memory
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
    resolveDir: path.resolve(__dirname, '../..'),
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
} = moduleExports.exports;

let totalTests = 0;
let passedTests = 0;

function runAuditCheck(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [AUDIT PASS] ${description}`);
  } catch (err) {
    console.error(`  [AUDIT FAIL] ${description}`);
    console.error(`               ${err.message}`);
    throw err;
  }
}

async function runAsyncAuditCheck(description, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [AUDIT PASS] ${description}`);
  } catch (err) {
    console.error(`  [AUDIT FAIL] ${description}`);
    console.error(`               ${err.message}`);
    throw err;
  }
}

(async () => {
  // Test 1: PII Edge Cases & Non-PII Academic Questions
  runAuditCheck('PII: Correctly flags academic ID variations including periods', () => {
    const piiHeaders = [
      'NIM', 'N.I.M.', 'n.i.m.', 'NPM', 'N.P.M.', 'NRP', 'N.R.P.',
      'Nomor Induk Mahasiswa', 'nomor induk', 'Student ID',
      'No. Telp', 'Nomor Telp', 'kontak', 'No HP (WhatsApp)',
      'Timestamp', 'Waktu Pengisian', 'Tanggal Input', 'Date Submitted'
    ];
    for (const h of piiHeaders) {
      assert.strictEqual(isPIIColumn(h), true, `Failed to recognize PII header: "${h}"`);
    }
  });

  runAuditCheck('PII: Strictly preserves legitimate survey questions starting with Waktu, Tanggal, Nama', () => {
    const legitimateHeaders = [
      'Waktu pelaksanaan kegiatan seminar nasional yang Anda sarankan',
      'Waktu ideal untuk pelaksanaan rapat koordinasi BEM',
      'Tanggal pelaksanaan expo organisasi mahasiswa',
      'Nama divisi atau biro yang paling Anda minati di BEM UNDIP',
      'Nama tokoh inspiratif pilihan Anda',
      'Nama kegiatan upgrading favorit Anda'
    ];
    for (const h of legitimateHeaders) {
      assert.strictEqual(isPIIColumn(h), false, `Legitimate question was falsely flagged as PII: "${h}"`);
    }
  });

  // Test 2: CSV Handling of 3 Identical Duplicate Headers
  await runAsyncAuditCheck('CSV: Preserves all 3 columns when duplicate headers exist without data collision', async () => {
    const csv = [
      'Timestamp,Opini,Opini,Opini',
      '2026-01-01,Opini Pertama Baris 1,Opini Kedua Baris 1,Opini Ketiga Baris 1',
      '2026-01-02,Opini Pertama Baris 2,Opini Kedua Baris 2,Opini Ketiga Baris 2'
    ].join('\r\n');

    const dataset = await parseCSVString(csv, 'triple_dup.csv');
    assert.strictEqual(dataset.rowCount, 2);
    assert.strictEqual(dataset.columns.length, 4);

    // Columns 1, 2, 3 must have unique IDs
    const col1 = dataset.columns[1];
    const col2 = dataset.columns[2];
    const col3 = dataset.columns[3];

    assert.notStrictEqual(col1.id, col2.id);
    assert.notStrictEqual(col2.id, col3.id);
    assert.notStrictEqual(col1.id, col3.id);

    // Column values must be distinct
    assert.ok(col1.distribution['Opini Pertama Baris 1'] === 1);
    assert.ok(col2.distribution['Opini Kedua Baris 1'] === 1);
    assert.ok(col3.distribution['Opini Ketiga Baris 1'] === 1);
  });

  // Test 3: Mixed CR, LF, and CRLF line endings
  await runAsyncAuditCheck('CSV: Robust to chaotic line endings (mixed CRLF, CR, LF)', async () => {
    const csv = 'Timestamp,Pilihan\r\n2026-01-01,A\r2026-01-02,B\n2026-01-03,C\r\n2026-01-04,D';
    const dataset = await parseCSVString(csv, 'chaotic_endings.csv');
    assert.strictEqual(dataset.rowCount, 4);
    assert.strictEqual(dataset.columns[1].validResponses, 4);
    assert.strictEqual(dataset.columns[1].distribution['A'], 1);
    assert.strictEqual(dataset.columns[1].distribution['B'], 1);
    assert.strictEqual(dataset.columns[1].distribution['C'], 1);
    assert.strictEqual(dataset.columns[1].distribution['D'], 1);
  });

  // Test 4: Placeholder Column Robustness
  runAuditCheck('Classifier: Column of mixed placeholders ("-", "_", "tidak ada", "none") returns OPEN_ENDED_TEXT', () => {
    const vals = ['-', '_', '--', 'tidak ada', 'none', 'n/a', '..'];
    const res = classifyQuestion('Keluhan Operasional', vals);
    assert.strictEqual(res.type, 'OPEN_ENDED_TEXT');
    assert.strictEqual(res.reason, 'Column contains only placeholder non-responses');
  });

  // Test 5: Small N Multi-select
  runAuditCheck('Classifier: Small N (3 respondents) multi-select with hint is correctly classified', () => {
    const vals = [
      'Riset, Advokasi',
      'Advokasi, Humas',
      'Riset, Humas'
    ];
    const res = classifyQuestion('Pilihan biro/bidang yang diminati (boleh memilih lebih dari 1)', vals);
    assert.strictEqual(res.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(res.isMultiSelect, true);
  });

  // Test 6: Dichotomous Binary with Punctuation & Missing placeholders
  runAuditCheck('Classifier: Dichotomous Binary ignores placeholders and handles punctuation ("Setuju!", "Tidak Setuju!")', () => {
    const vals = ['Setuju!', 'Tidak Setuju!', '-', 'Setuju!', ''];
    const res = classifyQuestion('Apakah Anda menyetujui anggaran?', vals);
    assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
  });

  // Test 7: Likert Scale missing middle options
  runAuditCheck('Classifier: Likert scale missing options 2 and 3 still resolves to LIKERT_SCALE', () => {
    const vals = ['1', '4', '1', '4', '4'];
    const res = classifyQuestion('Kesesuaian Target', vals);
    assert.strictEqual(res.type, 'LIKERT_SCALE');
    assert.strictEqual(res.likertScaleMax, 4);
  });

  // Test 8: Real Excel Ingestion (KTR.xlsx)
  runAuditCheck('Excel: Ingestion of KTR.xlsx binary workbook profiles 265 rows and 19 columns', () => {
    const filePath = 'C:/Users/geova/.gemini/antigravity/raw/Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx';
    const buffer = fs.readFileSync(filePath);
    const dataset = parseExcelBuffer(buffer, 'KTR.xlsx');
    assert.strictEqual(dataset.rowCount, 265);
    assert.strictEqual(dataset.columns.length, 19);
    assert.strictEqual(dataset.columns[0].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[0].isPII, true);
  });

  // Test 9: Recommended Charts Integrity
  runAuditCheck('Engine: Recommended charts correctly mapped without none for non-PII', () => {
    const types = [
      'DICHOTOMOUS_BINARY',
      'LIKERT_SCALE',
      'MULTI_SELECT_CHECKBOX',
      'NOMINAL_DEMOGRAPHIC',
      'OPEN_ENDED_TEXT'
    ];
    for (const t of types) {
      const chart = determineRecommendedChart(t, 4, 10);
      assert.notStrictEqual(chart, 'none', `Chart for ${t} should not be 'none'`);
    }
    assert.strictEqual(determineRecommendedChart('METADATA_PII', 0, 0), 'none');
  });

  console.log('\n======================================================================');
  console.log(`  FORENSIC RE-VERIFICATION RESULT: ${passedTests}/${totalTests} CHECKS PASSED`);
  console.log('  VERDICT: CLEAN - ZERO INTEGRITY VIOLATIONS');
  console.log('======================================================================\n');
})();
