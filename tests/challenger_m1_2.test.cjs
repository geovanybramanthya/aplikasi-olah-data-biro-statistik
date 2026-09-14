/**
 * Milestone 1 Adversarial Challenge Test Suite (challenger_m1_2)
 * 
 * Adversarial Verification Areas:
 * 1. Mathematical Accuracy:
 *    - Likert Mean, Median, Net Positive Percentage against exact rational truth
 *    - Multi-select percentage: denominator is N_respondents, NOT sum of tokens
 *    - Row-level token deduplication per respondent
 * 2. Dataset Scale Limits & Stress Testing:
 *    - Synthetic dataset with 5,000 rows and 40 columns (200,000 cells)
 *    - Measure parsing and profiling runtime (MUST be < 500ms)
 * 3. Edge Cases:
 *    - Survey with all identical rows (1,000 rows)
 *    - Survey with all blank/hyphen responses (1,000 rows)
 *    - Single-row survey (N = 1)
 *    - Extreme outlier distribution (4,999 at 1, 1 at 5)
 *    - Dirty multi-select formatting (empty delimiters, dashes, duplicates)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { performance } = require('perf_hooks');
const esbuild = require('esbuild');

console.log('================================================================================');
console.log('  MILESTONE 1 ADVERSARIAL CHALLENGER 2 (challenger_m1_2) TEST SUITE');
console.log('================================================================================\n');

// 1. Compile TypeScript source modules in memory
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
  generateOfflineSummary,
  determineRecommendedChart,
} = moduleExports.exports;

console.log('✓ TypeScript modules compiled and bound successfully.\n');

let totalTests = 0;
let passedTests = 0;
const failures = [];

function runChallengeTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failures.push({ name, error: err });
  }
}

async function runChallengeAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failures.push({ name, error: err });
  }
}

(async () => {
  // ===========================================================================
  // SECTION 1: MATHEMATICAL ACCURACY OF LIKERT STATISTICS
  // ===========================================================================
  console.log('--- SECTION 1: Mathematical Accuracy of Likert Statistics ---');

  runChallengeTest('Likert Mean: Uniform 4-scale distribution {1:25, 2:25, 3:25, 4:25}', () => {
    // Weighted sum = 25*1 + 25*2 + 25*3 + 25*4 = 25 + 50 + 75 + 100 = 250
    // Total count = 100 -> Expected Mean = 2.50
    const stats = calculateLikertStats({ '1': 25, '2': 25, '3': 25, '4': 25 }, 4);
    assert.strictEqual(stats.mean, 2.5);
    assert.strictEqual(stats.median, 2.5); // mid elements 2 and 3 -> (2+3)/2 = 2.5
    assert.strictEqual(stats.netPositivePercent, 25.0); // only 4 >= 4: 25/100 = 25.0%
  });

  runChallengeTest('Likert Mean: Uniform 5-scale distribution {1:20, 2:20, 3:20, 4:20, 5:20}', () => {
    // Weighted sum = 20*1 + 20*2 + 20*3 + 20*4 + 20*5 = 300
    // Total count = 100 -> Expected Mean = 3.00
    const stats = calculateLikertStats({ '1': 20, '2': 20, '3': 20, '4': 20, '5': 20 }, 5);
    assert.strictEqual(stats.mean, 3.0);
    assert.strictEqual(stats.median, 3.0); // mid elements 3 and 3 -> 3.0
    assert.strictEqual(stats.netPositivePercent, 40.0); // 4 and 5: 40/100 = 40.0%
  });

  runChallengeTest('Likert Mean & Net Positive: Highly skewed real-world distribution', () => {
    // Distribution: { 1: 17, 2: 43, 3: 111, 4: 89, 5: 240 } (Total N = 500)
    // Weighted sum = 17*1 + 43*2 + 111*3 + 89*4 + 240*5 = 17 + 86 + 333 + 356 + 1200 = 1992
    // Exact Mean = 1992 / 500 = 3.984 -> rounded to 2 decimals = 3.98
    // Top-box (4 & 5) = 89 + 240 = 329
    // Net Positive % = (329 / 500) * 100 = 65.8%
    // Median: 500 elements. mid = 250.
    // 0..16 (17): 1
    // 17..59 (43): 2
    // 60..170 (111): 3
    // 171..259 (89): 4 -> index 249 and 250 are both score 4!
    // Median = (4 + 4)/2 = 4.0
    const stats = calculateLikertStats({ '1': 17, '2': 43, '3': 111, '4': 89, '5': 240 }, 5);
    assert.strictEqual(stats.mean, 3.98);
    assert.strictEqual(stats.median, 4.0);
    assert.strictEqual(stats.netPositivePercent, 65.8);
  });

  runChallengeTest('Likert Mean: Monte Carlo oracle verification across 50 random distributions', () => {
    // Seeded pseudo-random generation to stress-test arbitrary distributions
    let seed = 42;
    function pseudoRandom(min, max) {
      seed = (seed * 9301 + 49297) % 233280;
      return Math.floor(min + (seed / 233280) * (max - min + 1));
    }

    for (let trial = 0; trial < 50; trial++) {
      const scaleMax = trial % 2 === 0 ? 4 : 5;
      const dist = {};
      let exactWeighted = 0;
      let exactTotal = 0;
      let exactTopBox = 0;
      const allScores = [];

      for (let s = 1; s <= scaleMax; s++) {
        const count = pseudoRandom(0, 500);
        dist[String(s)] = count;
        exactWeighted += s * count;
        exactTotal += count;
        if (s >= 4) exactTopBox += count;
        for (let k = 0; k < count; k++) allScores.push(s);
      }

      const stats = calculateLikertStats(dist, scaleMax);

      if (exactTotal > 0) {
        const expectedMean = Number((exactWeighted / exactTotal).toFixed(2));
        const expectedNetPos = Number(((exactTopBox / exactTotal) * 100).toFixed(1));

        allScores.sort((a, b) => a - b);
        const mid = Math.floor(allScores.length / 2);
        const expectedMedian =
          allScores.length % 2 !== 0
            ? allScores[mid]
            : Number(((allScores[mid - 1] + allScores[mid]) / 2).toFixed(1));

        assert.strictEqual(
          stats.mean,
          expectedMean,
          `Trial ${trial}: Mean mismatch: expected ${expectedMean}, got ${stats.mean}`
        );
        assert.strictEqual(
          stats.median,
          expectedMedian,
          `Trial ${trial}: Median mismatch: expected ${expectedMedian}, got ${stats.median}`
        );
        assert.strictEqual(
          stats.netPositivePercent,
          expectedNetPos,
          `Trial ${trial}: NetPositive mismatch: expected ${expectedNetPos}, got ${stats.netPositivePercent}`
        );
      }
    }
  });

  runChallengeTest('Likert Median: Odd vs Even count exact boundary handling', () => {
    // Odd count N = 5: scores [1, 2, 3, 4, 5] -> median = 3.0
    const oddStats = calculateLikertStats({ '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 }, 5);
    assert.strictEqual(oddStats.median, 3.0);

    // Even count N = 4: scores [1, 1, 4, 4] -> median = (1 + 4)/2 = 2.5
    const evenSplitStats = calculateLikertStats({ '1': 2, '2': 0, '3': 0, '4': 2 }, 4);
    assert.strictEqual(evenSplitStats.median, 2.5);

    // Even count N = 4: scores [2, 2, 3, 3] -> median = (2 + 3)/2 = 2.5
    const evenConsecutiveStats = calculateLikertStats({ '2': 2, '3': 2 }, 4);
    assert.strictEqual(evenConsecutiveStats.median, 2.5);

    // Single item N = 1: score [4] -> median = 4.0, mean = 4.0
    const singleStats = calculateLikertStats({ '4': 1 }, 4);
    assert.strictEqual(singleStats.median, 4.0);
    assert.strictEqual(singleStats.mean, 4.0);
    assert.strictEqual(singleStats.netPositivePercent, 100.0);
  });

  runChallengeTest('Likert Scale: Missing frequencies & 0-count options preservation', () => {
    // Only options 1 and 5 received votes (options 2, 3, 4 have 0 votes)
    // Distribution: { 1: 50, 5: 50 } (N = 100)
    // Mean = (50*1 + 50*5)/100 = 300/100 = 3.00
    // Median = (1 + 5)/2 = 3.0
    // Net Positive = 50.0%
    const stats = calculateLikertStats({ '1': 50, '5': 50 }, 5);
    assert.strictEqual(stats.mean, 3.0);
    assert.strictEqual(stats.median, 3.0);
    assert.strictEqual(stats.netPositivePercent, 50.0);
  });

  runChallengeTest('Likert Scale: Safe zero division on empty distribution', () => {
    const stats = calculateLikertStats({}, 4);
    assert.strictEqual(stats.mean, 0);
    assert.strictEqual(stats.median, 0);
    assert.strictEqual(stats.netPositivePercent, 0);
    assert.ok(!Number.isNaN(stats.mean));
    assert.ok(!Number.isNaN(stats.median));
    assert.ok(!Number.isNaN(stats.netPositivePercent));
  });

  // ===========================================================================
  // SECTION 2: MATHEMATICAL ACCURACY OF MULTI-SELECT FORMULAS
  // ===========================================================================
  console.log('\n--- SECTION 2: Mathematical Accuracy of Multi-Select Formulas ---');

  runChallengeTest('Multi-Select Denominator: Strictly N_respondents, NEVER sum of tokens', () => {
    // 100 respondents answering a multi-select question:
    // Option 'A': 90 respondents (90%)
    // Option 'B': 80 respondents (80%)
    // Option 'C': 50 respondents (50%)
    // Total selections = 90 + 80 + 50 = 220 tokens
    // Mathematical Truth:
    // Pct(A) = 90 / 100 = 90.0% (NOT 90 / 220 = 40.9%)
    // Pct(B) = 80 / 100 = 80.0% (NOT 80 / 220 = 36.4%)
    // Pct(C) = 50 / 100 = 50.0% (NOT 50 / 220 = 22.7%)
    // Sum of percentages = 220.0%
    const responses = [];
    for (let i = 0; i < 50; i++) responses.push('A, B, C'); // 50 chose all 3
    for (let i = 0; i < 30; i++) responses.push('A, B');    // 30 chose A, B
    for (let i = 0; i < 10; i++) responses.push('A');       // 10 chose A
    for (let i = 0; i < 10; i++) responses.push('');        // 10 chose nothing (blank)

    const totalRespondents = 100;
    const result = splitMultiSelectResponses(responses, totalRespondents);

    assert.strictEqual(result.totalSelections, 220);
    assert.strictEqual(result.averageSelectionsPerRespondent, 2.2);

    const freqMap = Object.fromEntries(result.tokenFrequencies.map((f) => [f.token, f]));
    assert.strictEqual(freqMap['A'].count, 90);
    assert.strictEqual(freqMap['A'].percentage, 90.0);
    assert.strictEqual(freqMap['B'].count, 80);
    assert.strictEqual(freqMap['B'].percentage, 80.0);
    assert.strictEqual(freqMap['C'].count, 50);
    assert.strictEqual(freqMap['C'].percentage, 50.0);

    // Sum of percentages exceeds 100% (90 + 80 + 50 = 220%)
    const sumPercentages = result.tokenFrequencies.reduce((sum, f) => sum + f.percentage, 0);
    assert.strictEqual(sumPercentages, 220.0);

    // Explicit check: Assert that percentage does NOT equal token share
    const wrongTokenShareA = Number(((90 / 220) * 100).toFixed(1)); // 40.9%
    assert.notStrictEqual(freqMap['A'].percentage, wrongTokenShareA);
  });

  runChallengeTest('Multi-Select Deduplication: Single respondent duplicate tokens counted once', () => {
    // Respondent submits "A, A, A, B, B" in a single cell
    // Row count = 1, N = 1
    // Expected: A count = 1 (100.0%), B count = 1 (100.0%), Total selections = 2
    const responses = ['A, A, A, B, B'];
    const result = splitMultiSelectResponses(responses, 1);

    assert.strictEqual(result.totalSelections, 2);
    assert.strictEqual(result.tokenFrequencies.length, 2);
    assert.strictEqual(result.tokenFrequencies[0].count, 1);
    assert.strictEqual(result.tokenFrequencies[0].percentage, 100.0);
    assert.strictEqual(result.tokenFrequencies[1].count, 1);
    assert.strictEqual(result.tokenFrequencies[1].percentage, 100.0);
  });

  runChallengeTest('Multi-Select Token Repeat Ratio: Heuristic discriminant correctness', () => {
    // High repeat (fixed checkboxes): 200 responses, 4 options -> Ratio = 400 / 4 = 100.0
    const fixedOptions = [];
    for (let i = 0; i < 100; i++) {
      fixedOptions.push('Biaya, Waktu');
      fixedOptions.push('Koordinasi, Fasilitas');
    }
    const fixedRatio = calculateTokenRepeatRatio(fixedOptions);
    assert.strictEqual(fixedRatio.uniqueTokens, 4);
    assert.strictEqual(fixedRatio.totalTokens, 400);
    assert.strictEqual(fixedRatio.ratio, 100.0);
    assert.ok(fixedRatio.ratio > 3.0);

    // Low repeat (free text essay clauses): distinct unique words
    const freeText = [
      'Mohon fasilitas proyektor di ruang kuliah diperbaiki segera',
      'Kurikulum perlu disesuaikan dengan kebutuhan dunia industri kerja',
      'Jadwal praktikum laboratorium sering kali bertabrakan dengan perkuliahan teori',
      'Layanan administrasi akademik fakultas perlu dipercepat responsnya',
    ];
    const freeTextRatio = calculateTokenRepeatRatio(freeText);
    // Since each sentence has 0 commas or unique words, ratio should be ~1.0
    assert.ok(freeTextRatio.ratio <= 1.5, `Free text ratio was ${freeTextRatio.ratio}`);
  });

  runChallengeTest('Multi-Select Safe Zero Handling: Empty or all-blank survey', () => {
    const result = splitMultiSelectResponses([], 0);
    assert.strictEqual(result.totalSelections, 0);
    assert.strictEqual(result.averageSelectionsPerRespondent, 0);
    assert.strictEqual(result.tokenFrequencies.length, 0);
    assert.strictEqual(result.uniqueTokensCount, 0);
    assert.strictEqual(result.tokenRepeatRatio, 0);
    assert.ok(!Number.isNaN(result.averageSelectionsPerRespondent));
  });

  // ===========================================================================
  // SECTION 3: STRESS TESTING DATASET SIZE (5,000 ROWS x 40 COLUMNS)
  // ===========================================================================
  console.log('\n--- SECTION 3: Stress Testing Dataset Size (5,000 Rows x 40 Columns) ---');

  await runChallengeAsyncTest('Stress Test: 5,000 rows x 40 columns parsing & profiling (< 500ms)', async () => {
    const rowCount = 5000;
    const colCount = 40;

    // Define 40 diverse column headers matching all question types
    const headers = [];
    // 3 PII
    headers.push('Timestamp');
    headers.push('Nama Lengkap');
    headers.push('NIM');
    // 5 Binary
    for (let i = 1; i <= 5; i++) headers.push(`Pertanyaan Binary ${i} (Ya/Tidak)`);
    // 10 Likert 1-4
    for (let i = 1; i <= 10; i++) headers.push(`Evaluasi Program ${i} (Skala 1-4)`);
    // 8 Likert 1-5
    for (let i = 1; i <= 8; i++) headers.push(`Kepuasan Layanan ${i} (Skala 1 - 5)`);
    // 5 Multi-select
    for (let i = 1; i <= 5; i++) headers.push(`Kendala dan Faktor Pilihan ${i} (Pilihlah opsi)`);
    // 6 Demographics
    headers.push('Asal Fakultas');
    headers.push('Angkatan');
    headers.push('Jenjang Studi');
    headers.push('Jalur Masuk');
    headers.push('Status Tempat Tinggal');
    headers.push('Kategori UKT');
    // 3 Open-ended
    headers.push('Harapan dan Saran Mahasiswa');
    headers.push('Ceritakan Pengalaman Anda');
    headers.push('Catatan Tambahan untuk BEM');

    assert.strictEqual(headers.length, colCount, `Header count must be ${colCount}`);

    console.log(`    Generating synthetic CSV with ${rowCount} rows and ${colCount} columns (${rowCount * colCount} cells)...`);

    const faculties = ['FSM', 'SV', 'FT', 'FEB', 'FH', 'FISIP', 'FIB', 'FK', 'FPP', 'FPIK', 'FKM', 'Psikologi'];
    const batches = ['2021', '2022', '2023', '2024'];
    const degrees = ['S1', 'D4', 'S2'];
    const entryPaths = ['SNBP', 'SNBT', 'UM Mandiri', 'Kemitraan'];
    const livingStatuses = ['Kos', 'Rumah Orang Tua', 'Asrama', 'Kontrakan'];
    const uktCategories = ['Golongan 1-2', 'Golongan 3-4', 'Golongan 5-6', 'Golongan 7-8'];
    const msOptionsPool = ['Waktu', 'Biaya', 'Koordinasi', 'Fasilitas', 'Komunikasi', 'Motivasi'];
    const openEndedPhrases = [
      'Semoga program kerja BEM semakin progresif dan bermanfaat bagi seluruh mahasiswa Undip.',
      'Perlu perbaikan dalam koordinasi jadwal kegiatan agar tidak bertabrakan dengan ujian.',
      'Materi yang disampaikan sangat aplikatif dan membuka wawasan baru untuk tim kami.',
      'Mohon publikasi informasi advokasi beasiswa dilakukan lebih awal dan terstruktur.',
      '-',
    ];

    const lines = [headers.map((h) => `"${h}"`).join(',')];

    for (let r = 0; r < rowCount; r++) {
      const row = [];
      // 0: Timestamp
      row.push(`"2026-09-14 10:${String(r % 60).padStart(2, '0')}:${String((r * 7) % 60).padStart(2, '0')}"`);
      // 1: Nama
      row.push(`"Mahasiswa Tester ${r + 1}"`);
      // 2: NIM
      row.push(`"24060120140${String(r % 1000).padStart(3, '0')}"`);

      // 3-7: 5 Binary
      for (let b = 0; b < 5; b++) {
        row.push(r % (b + 2) === 0 ? '"Ya"' : '"Tidak"');
      }

      // 8-17: 10 Likert 1-4
      for (let l4 = 0; l4 < 10; l4++) {
        const score = ((r + l4) % 4) + 1;
        row.push(`"${score}"`);
      }

      // 18-25: 8 Likert 1-5
      for (let l5 = 0; l5 < 8; l5++) {
        const score = ((r + l5 * 2) % 5) + 1;
        row.push(`"${score}"`);
      }

      // 26-30: 5 Multi-select
      for (let m = 0; m < 5; m++) {
        const sel1 = msOptionsPool[(r + m) % msOptionsPool.length];
        const sel2 = msOptionsPool[(r + m + 2) % msOptionsPool.length];
        row.push(`"${sel1}, ${sel2}"`);
      }

      // 31-36: 6 Demographics
      row.push(`"${faculties[r % faculties.length]}"`);
      row.push(`"${batches[r % batches.length]}"`);
      row.push(`"${degrees[r % degrees.length]}"`);
      row.push(`"${entryPaths[r % entryPaths.length]}"`);
      row.push(`"${livingStatuses[r % livingStatuses.length]}"`);
      row.push(`"${uktCategories[r % uktCategories.length]}"`);

      // 37-39: 3 Open-ended
      for (let o = 0; o < 3; o++) {
        row.push(`"${openEndedPhrases[(r + o) % openEndedPhrases.length]}"`);
      }

      lines.push(row.join(','));
    }

    const csvContent = lines.join('\n');
    const csvSizeBytes = Buffer.byteLength(csvContent, 'utf-8');
    console.log(`    Synthetic CSV generated: ${(csvSizeBytes / (1024 * 1024)).toFixed(2)} MB (${lines.length - 1} data rows).`);

    // Benchmark parsing and profiling
    const t0 = performance.now();
    const dataset = await parseCSVString(csvContent, 'synthetic_stress_5000x40.csv');
    const t1 = performance.now();
    const elapsedMs = Number((t1 - t0).toFixed(2));

    console.log(`    Parsing & Profiling Runtime: ${elapsedMs} ms (Benchmark Limit: < 500 ms)`);

    // Strict performance assertion: MUST be < 500 ms
    assert.ok(
      elapsedMs < 500,
      `Stress runtime benchmark FAILED: expected < 500ms, actual was ${elapsedMs}ms`
    );

    // Structural correctness verification
    assert.strictEqual(dataset.rowCount, 5000);
    assert.strictEqual(dataset.columns.length, 40);

    // Verify PII columns excluded
    assert.strictEqual(dataset.columns[0].isPII, true);
    assert.strictEqual(dataset.columns[0].type, 'METADATA_PII');
    assert.strictEqual(dataset.columns[1].isPII, true);
    assert.strictEqual(dataset.columns[2].isPII, true);

    // Verify Binary
    assert.strictEqual(dataset.columns[3].type, 'DICHOTOMOUS_BINARY');
    assert.strictEqual(dataset.columns[3].recommendedChart, 'donut');

    // Verify Likert 1-4
    const l4Col = dataset.columns[8];
    assert.strictEqual(l4Col.type, 'LIKERT_SCALE');
    assert.strictEqual(l4Col.recommendedChart, 'ordered_likert');
    assert.ok(l4Col.likertScale !== undefined);
    assert.strictEqual(l4Col.likertScale.max, 4);
    assert.ok(l4Col.likertScale.mean >= 1 && l4Col.likertScale.mean <= 4);
    assert.ok(!Number.isNaN(l4Col.likertScale.mean));

    // Verify Likert 1-5
    const l5Col = dataset.columns[18];
    assert.strictEqual(l5Col.type, 'LIKERT_SCALE');
    assert.strictEqual(l5Col.recommendedChart, 'ordered_likert');
    assert.ok(l5Col.likertScale !== undefined);
    assert.strictEqual(l5Col.likertScale.max, 5);
    assert.ok(l5Col.likertScale.mean >= 1 && l5Col.likertScale.mean <= 5);

    // Verify Multi-select
    const msCol = dataset.columns[26];
    assert.strictEqual(msCol.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(msCol.recommendedChart, 'ranked_bar');
    assert.ok(msCol.multiSelect !== undefined);
    assert.strictEqual(msCol.multiSelect.totalSelections, 10000); // 5000 rows * 2 tokens
    assert.strictEqual(msCol.multiSelect.averageSelectionsPerRespondent, 2.0);

    // Verify Demographic
    const demoCol = dataset.columns[31];
    assert.strictEqual(demoCol.type, 'NOMINAL_DEMOGRAPHIC');
    assert.strictEqual(demoCol.recommendedChart, 'horizontal_bar');

    // Verify Open-ended
    const openCol = dataset.columns[37];
    assert.strictEqual(openCol.type, 'OPEN_ENDED_TEXT');
    assert.strictEqual(openCol.recommendedChart, 'text_feed');
  });

  // ===========================================================================
  // SECTION 4: BOUNDARY AND CORNER EDGE CASES
  // ===========================================================================
  console.log('\n--- SECTION 4: Boundary & Corner Edge Cases ---');

  await runChallengeAsyncTest('Edge Case: Survey with 1,000 completely identical rows', async () => {
    // 1,000 respondents giving the exact same answers across all columns
    const headers = ['Timestamp', 'Nama', 'Puas', 'Rating', 'Pilihan', 'Fakultas', 'Saran'];
    const row = [
      '"2026-09-14 12:00:00"',
      '"Responden Seragam"',
      '"Ya"',
      '"4"',
      '"Fasilitas, Biaya"',
      '"Fakultas Teknik"',
      '"Semoga semakin baik"',
    ].join(',');

    const lines = [headers.map((h) => `"${h}"`).join(',')];
    for (let i = 0; i < 1000; i++) {
      lines.push(row);
    }

    const dataset = await parseCSVString(lines.join('\n'), 'identical_rows.csv');
    assert.strictEqual(dataset.rowCount, 1000);
    assert.strictEqual(dataset.columns.length, 7);

    // Puas (Single binary choice: 'Ya')
    const puasCol = dataset.columns[2];
    assert.strictEqual(puasCol.distribution['Ya'], 1000);
    assert.strictEqual(puasCol.validResponses, 1000);
    assert.ok(puasCol.offlineSummary.includes('100.0%'));

    // Rating (Likert all 4s)
    const ratingCol = dataset.columns[3];
    assert.strictEqual(ratingCol.type, 'LIKERT_SCALE');
    assert.strictEqual(ratingCol.likertScale.mean, 4.0);
    assert.strictEqual(ratingCol.likertScale.median, 4.0);
    assert.strictEqual(ratingCol.likertScale.netPositivePercent, 100.0);

    // Multi-select (all selected Fasilitas, Biaya)
    const msCol = dataset.columns[4];
    assert.strictEqual(msCol.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(msCol.multiSelect.tokenFrequencies[0].percentage, 100.0);
    assert.strictEqual(msCol.multiSelect.tokenFrequencies[1].percentage, 100.0);
    assert.strictEqual(msCol.multiSelect.averageSelectionsPerRespondent, 2.0);
  });

  await runChallengeAsyncTest('Edge Case: Survey with 1,000 blank question responses (all questions skipped)', async () => {
    // 1,000 submissions with Timestamp, but all survey questions left completely blank ("")
    const headers = ['Timestamp', 'Nama', 'Tanya1', 'Tanya2', 'Tanya3'];
    const row = '"2026-09-14 10:00:00","","","",""';

    const lines = [headers.map((h) => `"${h}"`).join(',')];
    for (let i = 0; i < 1000; i++) {
      lines.push(row);
    }

    const dataset = await parseCSVString(lines.join('\n'), 'all_blank_questions.csv');
    assert.strictEqual(dataset.rowCount, 1000);
    assert.strictEqual(dataset.columns.length, 5);

    // Timestamp & Nama are PII
    assert.strictEqual(dataset.columns[0].isPII, true);
    assert.strictEqual(dataset.columns[1].isPII, true);

    // Survey questions with all blank responses
    for (let c = 2; c < 5; c++) {
      const col = dataset.columns[c];
      assert.strictEqual(col.validResponses, 0);
      assert.strictEqual(col.missingResponses, 1000);
      assert.strictEqual(col.type, 'OPEN_ENDED_TEXT');
      assert.strictEqual(col.recommendedChart, 'text_feed');
      assert.ok(!col.offlineSummary.includes('NaN'));
      assert.ok(!col.offlineSummary.includes('undefined'));
    }
  });

  await runChallengeAsyncTest('Edge Case: Completely empty CSV file rejects with descriptive error', async () => {
    // CSV with header only or only commas
    const emptyCsv = 'Col1,Col2,Col3\n,,\n,,\n';
    await assert.rejects(
      async () => {
        await parseCSVString(emptyCsv, 'empty.csv');
      },
      (err) => {
        assert.ok(err.message.includes('kosong atau tidak memiliki baris data'));
        return true;
      }
    );
  });

  await runChallengeAsyncTest('Edge Case: Survey with placeholder hyphen responses ("-")', async () => {
    // 1,000 rows where non-PII cells contain '-' placeholder
    const headers = ['Timestamp', 'Nama', 'FeedbackHyphen'];
    const row = '"","","-"';

    const lines = [headers.map((h) => `"${h}"`).join(',')];
    for (let i = 0; i < 1000; i++) {
      lines.push(row);
    }

    const dataset = await parseCSVString(lines.join('\n'), 'all_hyphens.csv');
    assert.strictEqual(dataset.rowCount, 1000);
    assert.strictEqual(dataset.columns.length, 3);

    const hyphenCol = dataset.columns[2];
    // In csvParser, '-' is counted as missingResponses (validResponses = 0)
    assert.strictEqual(hyphenCol.missingResponses, 1000);
    assert.strictEqual(hyphenCol.validResponses, 0);
    // Observe question classifier behavior on placeholder '-'
    // Note: classifyQuestion treats '-' as valid token if not explicitly filtered in normalizeValue
    assert.ok(!hyphenCol.offlineSummary.includes('NaN'));
    assert.ok(!hyphenCol.offlineSummary.includes('undefined'));
  });

  await runChallengeAsyncTest('Edge Case: Single-row survey (N = 1)', async () => {
    const headers = ['Timestamp', 'Gender', 'Rating', 'Kendala'];
    const row = '"2026-09-14","Laki-laki","3","Waktu"';
    const csvContent = `${headers.join(',')}\n${row}`;

    const dataset = await parseCSVString(csvContent, 'single_row.csv');
    assert.strictEqual(dataset.rowCount, 1);

    const ratingCol = dataset.columns[2];
    assert.strictEqual(ratingCol.likertScale.mean, 3.0);
    assert.strictEqual(ratingCol.likertScale.median, 3.0);
    assert.strictEqual(ratingCol.likertScale.netPositivePercent, 0.0);
  });

  runChallengeTest('Edge Case: Extreme Likert asymmetry (4,999 at score 1, 1 at score 5)', () => {
    // Total = 5,000
    // Mean = (4999*1 + 1*5) / 5000 = 5004 / 5000 = 1.0008 -> 1.00
    // Top-box (4 or 5) = 1 respondent -> Net positive = (1 / 5000) * 100 = 0.02% -> 0.0%
    // Median = 1.0
    const stats = calculateLikertStats({ '1': 4999, '5': 1 }, 5);
    assert.strictEqual(stats.mean, 1.0);
    assert.strictEqual(stats.median, 1.0);
    assert.strictEqual(stats.netPositivePercent, 0.0);
  });

  runChallengeTest('Edge Case: Dirty multi-select values with trailing commas, spaces, dashes', () => {
    const responses = [
      'Opsi 1, , Opsi 2, -, _',
      '   Opsi 1 , Opsi 3   ',
      ' , , - , , ',
      'Opsi 2, Opsi 2, Opsi 2',
    ];
    const result = splitMultiSelectResponses(responses, 4);

    assert.strictEqual(result.totalSelections, 5); // Opsi 1 (x2), Opsi 2 (x2), Opsi 3 (x1)
    const tokens = result.tokenFrequencies.map((f) => f.token);
    assert.deepStrictEqual(tokens, ['Opsi 1', 'Opsi 2', 'Opsi 3']);
    assert.ok(!tokens.includes('-'));
    assert.ok(!tokens.includes('_'));
    assert.ok(!tokens.includes(''));
  });

  // ===========================================================================
  // SECTION 5: ADVANCED ADVERSARIAL STRESS & SANITY
  // ===========================================================================
  console.log('\n--- SECTION 5: Advanced Adversarial Stress & Sanity ---');

  runChallengeTest('Float Normalization in Likert: Excel float formats ("1.0", "4.0")', () => {
    // Excel numbers often exported as 1.0, 2.0, 3.0, 4.0
    const rawValues = ['1.0', '2.0', '3.0', '4.0', '4.0'];
    const classification = classifyQuestion('Kepuasan Fasilitas Laboratorium', rawValues);
    assert.strictEqual(classification.type, 'LIKERT_SCALE');
    assert.strictEqual(classification.likertScaleMax, 4);

    const dist = { '1': 1, '2': 1, '3': 1, '4': 2 };
    const stats = calculateLikertStats(dist, 4);
    // Weighted: 1*1 + 2*1 + 3*1 + 4*2 = 14 / 5 = 2.80
    assert.strictEqual(stats.mean, 2.8);
    assert.strictEqual(stats.median, 3.0);
    assert.strictEqual(stats.netPositivePercent, 40.0); // 2 / 5 = 40.0%
  });

  await runChallengeAsyncTest('Likert with 50% Missing Responses: Mean uses valid respondents ONLY', async () => {
    // 100 rows: 50 rows score 4, 50 rows left blank ("")
    // If bug exists and totalRows (100) is used as denominator: mean = 50*4 / 100 = 2.00 (WRONG!)
    // Mathematical truth: mean = 50*4 / 50 = 4.00 (CORRECT!)
    const lines = ['Timestamp,Rating'];
    for (let i = 0; i < 50; i++) lines.push('"2026-09-14","4"');
    for (let i = 0; i < 50; i++) lines.push('"2026-09-14",""');

    const dataset = await parseCSVString(lines.join('\n'), 'partial_likert.csv');
    const col = dataset.columns[1];
    assert.strictEqual(col.type, 'LIKERT_SCALE');
    assert.strictEqual(col.totalResponses, 100);
    assert.strictEqual(col.validResponses, 50);
    assert.strictEqual(col.missingResponses, 50);
    assert.strictEqual(col.likertScale.mean, 4.0);
    assert.strictEqual(col.likertScale.median, 4.0);
    assert.strictEqual(col.likertScale.netPositivePercent, 100.0);
  });

  await runChallengeAsyncTest('Multi-Select Partial Response: Denominator is valid respondents', async () => {
    // 100 total rows: 60 answered multi-select question, 40 skipped ("")
    // Valid respondents = 60
    // 20 chose "A, B"
    // 20 chose "A"
    // 20 chose "B, C"
    // Token counts:
    // A: 20 + 20 = 40 respondents
    // B: 20 + 20 = 40 respondents
    // C: 20 respondents
    // Expected percentages relative to N_valid (60):
    // A: 40 / 60 = 66.7%
    // B: 40 / 60 = 66.7%
    // C: 20 / 60 = 33.3%
    const lines = ['Timestamp,Faktor Penghambat (boleh memilih lebih dari satu)'];
    for (let i = 0; i < 20; i++) lines.push('"2026-09-14","A, B"');
    for (let i = 0; i < 20; i++) lines.push('"2026-09-14","A"');
    for (let i = 0; i < 20; i++) lines.push('"2026-09-14","B, C"');
    for (let i = 0; i < 40; i++) lines.push('"2026-09-14",""');

    const dataset = await parseCSVString(lines.join('\n'), 'partial_ms.csv');
    const col = dataset.columns[1];
    assert.strictEqual(col.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(col.totalResponses, 100);
    assert.strictEqual(col.validResponses, 60);
    assert.strictEqual(col.missingResponses, 40);

    const freqMap = Object.fromEntries(col.multiSelect.tokenFrequencies.map((f) => [f.token, f]));
    assert.strictEqual(freqMap['A'].count, 40);
    assert.strictEqual(freqMap['A'].percentage, 66.7); // 40 / 60 * 100 = 66.666... -> 66.7
    assert.strictEqual(freqMap['B'].count, 40);
    assert.strictEqual(freqMap['B'].percentage, 66.7); // 40 / 60 * 100 = 66.666... -> 66.7
    assert.strictEqual(freqMap['C'].count, 20);
    assert.strictEqual(freqMap['C'].percentage, 33.3); // 20 / 60 * 100 = 33.333... -> 33.3
  });

  runChallengeTest('Unicode & Non-Breaking Space Sanitization in Headers', () => {
    const rawHeader = '\u00A0 Asal\u00A0 Bidang / Biro \u00A0\u00A0 ';
    const cleaned = sanitizeHeader(rawHeader);
    assert.ok(!cleaned.startsWith(' '));
    assert.ok(!cleaned.endsWith(' '));
  });

  runChallengeTest('Offline Summary Sanity: Zero NaN/undefined across all types', () => {
    // Test summary generation on all supported question types
    const types = ['METADATA_PII', 'DICHOTOMOUS_BINARY', 'LIKERT_SCALE', 'MULTI_SELECT_CHECKBOX', 'NOMINAL_DEMOGRAPHIC', 'OPEN_ENDED_TEXT'];

    for (const type of types) {
      const summary = generateOfflineSummary({
        type,
        title: `Pertanyaan ${type}`,
        totalResponses: 50,
        validResponses: 50,
        distribution: { 'Opsi 1': 30, 'Opsi 2': 20 },
        likertStats: type === 'LIKERT_SCALE' ? calculateLikertStats({ '1': 10, '2': 10, '3': 10, '4': 20 }, 4) : undefined,
        multiSelectStats: type === 'MULTI_SELECT_CHECKBOX' ? splitMultiSelectResponses(['A', 'B'], 50) : undefined,
      });

      assert.ok(typeof summary === 'string' && summary.length > 10, `Summary for ${type} was too short`);
      assert.ok(!summary.includes('NaN'), `Summary for ${type} contained NaN: ${summary}`);
      assert.ok(!summary.includes('undefined'), `Summary for ${type} contained undefined: ${summary}`);
      assert.ok(!summary.includes('null'), `Summary for ${type} contained null: ${summary}`);
    }
  });

  // ===========================================================================
  // SUMMARY AND VERDICT
  // ===========================================================================
  console.log('\n================================================================================');
  console.log(`  CHALLENGE RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (failures.length > 0) {
    console.log(`  FAILURES: ${failures.length}`);
    for (const f of failures) {
      console.log(`    - ${f.name}: ${f.error.message}`);
    }
    console.log('  VERDICT: REJECT');
    console.log('================================================================================\n');
    process.exit(1);
  } else {
    console.log('  ALL ADVERSARIAL CHALLENGES AND STRESS BENCHMARKS PASSED!');
    console.log('  VERDICT: APPROVE');
    console.log('================================================================================\n');
    process.exit(0);
  }
})();
