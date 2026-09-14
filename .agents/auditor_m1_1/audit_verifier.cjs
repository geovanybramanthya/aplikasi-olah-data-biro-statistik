/**
 * Auditor Independent Forensic Verification Suite
 * Executed independently by auditor_m1_1 to stress-test Milestone 1.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('>>> FORENSIC AUDITOR INDEPENDENT VERIFICATION RUNNING...\n');

// Compile source modules
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
  generateOfflineSummary,
  determineRecommendedChart,
} = moduleExports.exports;

let totalChecks = 0;
let passedChecks = 0;

function check(name, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`[PASS] ${name}`);
  } catch (e) {
    console.error(`[FAIL] ${name}: ${e.message}`);
    throw e;
  }
}

async function checkAsync(name, fn) {
  totalChecks++;
  try {
    await fn();
    passedChecks++;
    console.log(`[PASS] ${name}`);
  } catch (e) {
    console.error(`[FAIL] ${name}: ${e.message}`);
    throw e;
  }
}

(async () => {
  // Test 1: PII privacy enforcement
  check('PII filter catches varied casing, prefixes, and punctuation', () => {
    assert.strictEqual(isPIIColumn('  TIMESTAMP  '), true);
    assert.strictEqual(isPIIColumn('Nama Responden (Lengkap)'), true);
    assert.strictEqual(isPIIColumn('NIM / Nomor Induk Mahasiswa'), true);
    assert.strictEqual(isPIIColumn('No. WhatsApp / Telepon Aktif'), true);
    assert.strictEqual(isPIIColumn('Email Pribadi (@undip.ac.id)'), true);
    assert.strictEqual(isPIIColumn('Apakah Anda tahu tentang NIM?'), false); // Survey question asking about NIM knowledge
  });

  // Test 2: Dynamic Synthetic CSV Profiling (zero hardcoding check)
  await checkAsync('Dynamic synthetic CSV with arbitrary unseen questions profiles correctly', async () => {
    const syntheticCSV = [
      'Timestamp,Nama Lengkap,NIM,Fakultas Responden,Apakah Pernah Magang?,Kepuasan Fasilitas Lab,Pilihan Software Pendukung (boleh memilih lebih dari 1),Kritik dan Saran Pengembangan',
      '2026-01-01 10:00,Budi Santoso,24060120120001,Fakultas Sains dan Matematika,Ya,4,"VSCode, Git, Docker","Tolong perbanyak stop kontak di ruang lab komputer."',
      '2026-01-01 10:05,Siti Rahma,24060120120002,Fakultas Sains dan Matematika,Tidak,3,"VSCode, Git","Fasilitas AC ruangan lab sering panas."',
      '2026-01-01 10:10,Joko Widodo,24060120120003,Fakultas Teknik,Ya,4,"Git, Docker","Mohon penambahan lisensi software komputasi."',
      '2026-01-01 10:15,Ani Yudhoyono,24060120120004,Sekolah Vokasi,Ya,2,"VSCode, Git","Jadwal praktikum bentrok dengan kuliah teori."',
      '2026-01-01 10:20,Megawati SP,24060120120005,Fakultas Ekonomika dan Bisnis,Tidak,1,"VSCode, Git, Docker","Internet lab sering putus saat ujian praktikum."',
      '2026-01-01 10:25,Prabowo S,24060120120006,Fakultas Teknik,Ya,4,"VSCode, Git","Perlu penambahan monitor eksternal."',
      '2026-01-01 10:30,Ganjar P,24060120120007,Fakultas Sains dan Matematika,Tidak,3,"Git, Docker","AC sering terlalu dingin."',
      '2026-01-01 10:35,Anies B,24060120120008,Fakultas Teknik,Ya,5,"VSCode, Docker","Ruangan lab sangat bersih dan tertata."',
      '2026-01-01 10:40,Gibran R,24060120120009,Sekolah Vokasi,Ya,4,"VSCode, Git","Mohon ada meja diskusi kelompok."',
      '2026-01-01 10:45,Mahfud M,24060120120010,Fakultas Ekonomika dan Bisnis,Tidak,2,"Git","Akses wifi perlu ditambah kecepatannya."',
      '2026-01-01 10:50,Muhaimin I,24060120120011,Sekolah Vokasi,Ya,3,"VSCode, Docker","Sangat terbantu dengan praktikum offline."',
      '2026-01-01 10:55,Hatta R,24060120120012,Fakultas Teknik,Tidak,3,"VSCode, Git, Docker","Kursi lab perlu diperbaiki busanya."'
    ].join('\n');

    const dataset = await parseCSVString(syntheticCSV, 'synthetic_test.csv');
    assert.strictEqual(dataset.rowCount, 12);
    assert.strictEqual(dataset.columns.length, 8);

    // Verify Column 0: Timestamp -> METADATA_PII
    assert.strictEqual(dataset.columns[0].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[0].isPII, true);
    assert.strictEqual(dataset.columns[0].isExcluded, true);
    assert.strictEqual(dataset.columns[0].recommendedChart, 'none');

    // Verify Column 1: Nama -> METADATA_PII
    assert.strictEqual(dataset.columns[1].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[1].isPII, true);

    // Verify Column 2: NIM -> METADATA_PII
    assert.strictEqual(dataset.columns[2].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[2].isPII, true);

    // Verify Column 3: Fakultas -> NOMINAL_DEMOGRAPHIC
    assert.strictEqual(dataset.columns[3].type, 'NOMINAL_DEMOGRAPHIC');
    assert.strictEqual(dataset.columns[3].isPII, false);

    // Verify Column 4: Ya/Tidak -> DICHOTOMOUS_BINARY
    assert.strictEqual(dataset.columns[4].type, 'DICHOTOMOUS_BINARY');
    assert.strictEqual(dataset.columns[4].recommendedChart, 'donut');
    assert.strictEqual(dataset.columns[4].distribution['Ya'], 7);
    assert.strictEqual(dataset.columns[4].distribution['Tidak'], 5);

    // Verify Column 5: Likert 1-5 -> LIKERT_SCALE
    assert.strictEqual(dataset.columns[5].type, 'LIKERT_SCALE');
    assert.strictEqual(dataset.columns[5].recommendedChart, 'ordered_likert');
    assert.ok(dataset.columns[5].likertScale !== undefined);
    assert.strictEqual(dataset.columns[5].likertScale.max, 5);

    // Verify Column 6: Multi-Select Checkbox
    assert.strictEqual(dataset.columns[6].type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(dataset.columns[6].recommendedChart, 'ranked_bar');
    assert.ok(dataset.columns[6].multiSelect !== undefined);
    const topToken = dataset.columns[6].multiSelect.tokenFrequencies[0];
    assert.strictEqual(topToken.token, 'Git');
    assert.strictEqual(topToken.count, 10);
    assert.strictEqual(topToken.percentage, 83.3); // 10 / 12 * 100

    // Verify Column 7: Open-Ended Text
    assert.strictEqual(dataset.columns[7].type, 'OPEN_ENDED_TEXT');
    assert.strictEqual(dataset.columns[7].recommendedChart, 'text_feed');
  });

  // Test 3: RFC 4180 complex quoting, internal commas, and multiline cells
  await checkAsync('RFC 4180 multiline cells and escaped quotes do not break parser', async () => {
    const complexCSV = [
      'Timestamp,"Pertanyaan ""Penting""",Komentar',
      '2026-01-01,"Jawaban A, dengan koma","Komentar baris 1\nKomentar baris 2"',
      '2026-01-02,"Jawaban B, juga koma","Komentar baris kedua yang cukup panjang"',
      '2026-01-03,"Jawaban C, juga koma","Komentar baris ketiga untuk analisis kualitatif"'
    ].join('\n');

    const dataset = await parseCSVString(complexCSV, 'quotes_test.csv');
    assert.strictEqual(dataset.rowCount, 3);
    assert.strictEqual(dataset.columns[1].cleanName, 'Pertanyaan "Penting"');
    assert.strictEqual(dataset.columns[2].type, 'OPEN_ENDED_TEXT');
  });

  // Test 4: Likert calculation precision & median
  check('Likert statistics math precision test (mean, median, top-box)', () => {
    // 10 responses: 1, 1, 2, 3, 4, 4, 4, 5, 5, 5
    // Sum = 1+1+2+3+4+4+4+5+5+5 = 34 / 10 = 3.40
    // Sorted: 1, 1, 2, 3, 4, 4, 4, 5, 5, 5 -> mid 4 & 5 is (4+4)/2 = 4.0
    // Top-box (4 & 5) count: 3 + 3 = 6 -> 60.0%
    const dist = { '1': 2, '2': 1, '3': 1, '4': 3, '5': 3 };
    const stats = calculateLikertStats(dist, 5);
    assert.strictEqual(stats.mean, 3.4);
    assert.strictEqual(stats.median, 4.0);
    assert.strictEqual(stats.netPositivePercent, 60.0);
  });

  // Test 5: Check multi-select token repeat ratio against narrative text containing commas
  check('Narrative sentences with commas are NOT misclassified as multi-select', () => {
    const narrativeSentences = [
      'Menurut saya, program ini bagus, tetapi waktu pelaksanaan terlalu singkat, mohon dievaluasi.',
      'Secara keseluruhan baik, materi relevan, pembicara komunikatif, dan tempat nyaman.',
      'Sangat bermanfaat, menambah relasi, menambah pengalaman, dan memperluas wawasan kepemimpinan.',
      'Kurang puas, koordinasi panitia terlambat, konsumsi kurang, dan ruangan panas.',
      'Bagus sekali, pemateri menguasai materi, panitia sigap, dan rundown tepat waktu.',
    ];
    const { ratio } = calculateTokenRepeatRatio(narrativeSentences);
    // Since each phrase is unique, ratio should be <= 1.5
    assert.ok(ratio < 2.0, `Expected ratio < 2.0, got ${ratio}`);
    const classification = classifyQuestion('Adakah masukan terkait acara?', narrativeSentences);
    assert.strictEqual(classification.type, 'OPEN_ENDED_TEXT');
  });

  // Test 6: Empty and single-row CSV error handling
  await checkAsync('Rejects empty or single-row CSV with descriptive error', async () => {
    let errorThrown = false;
    try {
      await parseCSVString('HeaderOnly,NoRows\n', 'empty.csv');
    } catch (err) {
      errorThrown = true;
      assert.ok(err.message.includes('kosong') || err.message.includes('data'));
    }
    assert.strictEqual(errorThrown, true);
  });

  // Test 7: Dirty tokens and whitespace in multi-select responses
  check('Cleans dirty tokens, empty tokens, and dashes from multi-select', () => {
    const dirtyResponses = [
      'Waktu, , Komunikasi, - , Koordinasi',
      'Waktu, _, Komunikasi',
      'Koordinasi,   ,  Waktu  '
    ];
    const res = splitMultiSelectResponses(dirtyResponses, 3);
    assert.strictEqual(res.totalSelections, 7);
    const tokens = res.tokenFrequencies.map(t => t.token);
    assert.ok(!tokens.includes(''));
    assert.ok(!tokens.includes('-'));
    assert.ok(!tokens.includes('_'));
    assert.ok(tokens.includes('Waktu'));
    assert.ok(tokens.includes('Komunikasi'));
    assert.ok(tokens.includes('Koordinasi'));
  });

  // Test 8: Excel float coercion in Likert distribution
  check('Correctly computes Likert stats when distributions contain float keys (e.g. 1.0, 4.0)', () => {
    const floatDist = { '1.0': 5, '2.0': 5, '3.0': 10, '4.0': 20 };
    // total = 40. sum = 5*1 + 5*2 + 10*3 + 20*4 = 5 + 10 + 30 + 80 = 125
    // mean = 125 / 40 = 3.125 -> 3.13
    // top box (4.0) = 20 / 40 = 50.0%
    const stats = calculateLikertStats(floatDist, 4);
    assert.strictEqual(stats.mean, 3.13);
    assert.strictEqual(stats.netPositivePercent, 50.0);
  });

  // Test 9: Independent raw KTR Excel ingestion
  check('Independently parses authentic KTR.xlsx without error', () => {
    const ktrPath = 'C:/Users/geova/.gemini/antigravity/raw/Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx';
    assert.ok(fs.existsSync(ktrPath), 'KTR.xlsx must exist');
    const buffer = fs.readFileSync(ktrPath);
    const dataset = parseExcelBuffer(buffer, 'KTR_Test.xlsx');
    assert.strictEqual(dataset.rowCount, 265);
    assert.strictEqual(dataset.columns.length, 19);
    assert.strictEqual(dataset.columns[0].isPII, true);
    assert.strictEqual(dataset.columns[0].type, 'METADATA_PII');
  });

  console.log(`\n>>> FORENSIC AUDIT PASS: All ${passedChecks}/${totalChecks} dynamic assertions succeeded!`);
})();
