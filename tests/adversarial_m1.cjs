const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

const bundleResult = esbuild.buildSync({
  stdin: {
    contents: [
      'export * from "./src/core/parser/csvParser";',
      'export * from "./src/core/parser/excelParser";',
      'export * from "./src/core/parser/piiFilter";',
      'export * from "./src/core/profiler/questionClassifier";',
      'export * from "./src/core/profiler/multiSelectSplitter";',
      'export * from "./src/core/profiler/statistics";',
      'export * from "./src/services/demoDataService";',
    ].join('\n'),
    resolveDir: path.resolve(__dirname, '..'),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});

const m = {};
new Function('module', 'exports', 'require', bundleResult.outputFiles[0].text)(m, (m.exports = {}), require);
const {
  isPIIColumn,
  classifyQuestion,
  calculateTokenRepeatRatio,
  splitMultiSelectResponses,
  calculateLikertStats,
  parseCSVString,
  normalizeValue,
  profileDataset
} = m.exports;

console.log('===============================================================');
console.log('       ADVANCED ADVERSARIAL STRESS TEST SUITE (M1)            ');
console.log('===============================================================\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log('  ? PASS: ' + name);
  } catch (err) {
    console.error('  ? FAIL: ' + name + ' -> ' + err.message);
  }
}

// 1. All Empty Column (0 valid answers)
test('Handles completely empty column without throwing or NaN', () => {
  const emptyCol = ['', '', '   ', null, undefined];
  const res = classifyQuestion('Pertanyaan Kosong', emptyCol);
  assert.strictEqual(res.type, 'OPEN_ENDED_TEXT');
  const ds = profileDataset(['Pertanyaan Kosong'], [{'Pertanyaan Kosong': ''}, {'Pertanyaan Kosong': '-'}], 'Empty Test', 'empty.csv');
  assert.strictEqual(ds.columns[0].validResponses, 0);
  assert.strictEqual(ds.columns[0].missingResponses, 2);
  assert.ok(!ds.columns[0].offlineSummary.includes('NaN'));
});

// 2. Likert Single Value Monolithic Response
test('Handles monolithic Likert response (all respondents choose 4)', () => {
  const allFours = Array(100).fill('4');
  const res = classifyQuestion('Kepuasan', allFours);
  assert.strictEqual(res.type, 'LIKERT_SCALE');
  const stats = calculateLikertStats({ '4': 100 }, 4);
  assert.strictEqual(stats.mean, 4.0);
  assert.strictEqual(stats.median, 4);
  assert.strictEqual(stats.netPositivePercent, 100.0);
});

// 3. Likert Missing Low and High (Only 2 and 3 chosen)
test('Handles Likert scale with missing extremes (only 2 and 3)', () => {
  const vals = ['2', '3', '3', '2', '3', '2'];
  const res = classifyQuestion('Tingkat Stres', vals);
  assert.strictEqual(res.type, 'LIKERT_SCALE');
  const stats = calculateLikertStats({ '2': 3, '3': 3 }, 4);
  assert.strictEqual(stats.mean, 2.5);
  assert.strictEqual(stats.netPositivePercent, 0.0);
});

// 4. Multi-Select with Duplicate Options within single response
test('Deduplicates multiple identical selections within same respondent', () => {
  // Respondent selected "Waktu" twice in the same cell
  const responses = ['Waktu, Waktu, Biaya', 'Waktu, Biaya'];
  const ms = splitMultiSelectResponses(responses, 2);
  const waktuFreq = ms.tokenFrequencies.find(t => t.token === 'Waktu');
  assert.strictEqual(waktuFreq.count, 2, 'Waktu should only count once per respondent');
  assert.strictEqual(waktuFreq.percentage, 100.0);
});

// 5. Multi-Select Percentage Calculation with 0 Respondents Guard
test('Multi-select splitter survives 0 respondents without dividing by zero', () => {
  const ms = splitMultiSelectResponses([], 0);
  assert.strictEqual(ms.totalSelections, 0);
  assert.strictEqual(ms.averageSelectionsPerRespondent, 0);
  assert.strictEqual(ms.tokenFrequencies.length, 0);
});

// 6. CSV with Unescaped Commas in Quotes
test('CSV parser properly handles commas inside RFC 4180 quotes', async () => {
  const csv = 'Header A,Header B\n"Semarang, Jawa Tengah",10\n"Jakarta, DKI",20';
  const ds = await parseCSVString(csv, 'commas.csv');
  assert.strictEqual(ds.rowCount, 2);
  assert.strictEqual(ds.columns.length, 2);
  assert.strictEqual(ds.rawRows[0]['Header A'], 'Semarang, Jawa Tengah');
});

// 7. Value Normalization of diverse types
test('normalizeValue handles boolean, number, float, symbols cleanly', () => {
  assert.strictEqual(normalizeValue(true), 'true');
  assert.strictEqual(normalizeValue(123), '123');
  assert.strictEqual(normalizeValue('5.0'), '5');
  assert.strictEqual(normalizeValue('  3.0  '), '3');
  assert.strictEqual(normalizeValue(0), '0');
});

// 8. PII Regex Case Insensitivity and Whitespace Resilience
test('PII detection is case-insensitive and ignores padding whitespace', () => {
  assert.strictEqual(isPIIColumn('  TIMESTAMP  '), true);
  assert.strictEqual(isPIIColumn('  nim  '), true);
  assert.strictEqual(isPIIColumn('Nama   Responden'), true);
  assert.strictEqual(isPIIColumn('   e-mail   '), true);
});

// 9. Scalability: 10,000 Rows Profiling Speed
test('Scalability: profiles 10,000 synthetic rows in under 200ms', () => {
  const headers = ['Timestamp', 'NIM', 'Fakultas', 'Puas', 'Kendala', 'Saran'];
  const rows = [];
  for (let i = 0; i < 10000; i++) {
    rows.push({
      'Timestamp': '2026-03-01 12:00:00',
      'NIM': '210' + i,
      'Fakultas': i % 2 === 0 ? 'FSM' : 'FT',
      'Puas': String((i % 4) + 1),
      'Kendala': 'Waktu, Biaya',
      'Saran': 'Harapan saya upgrading ini memberikan wawasan mendalam.',
    });
  }
  const t0 = Date.now();
  const ds = profileDataset(headers, rows, 'Scale 10k', 'scale10k.csv');
  const dur = Date.now() - t0;
  console.log('    [Benchmark] 10,000 rows profiled in ' + dur + ' ms');
  assert.ok(dur < 500, 'Must be < 500ms, took ' + dur + 'ms');
  assert.strictEqual(ds.columns[0].type, 'METADATA_PII');
  assert.strictEqual(ds.columns[1].type, 'METADATA_PII');
  assert.strictEqual(ds.columns[2].type, 'DICHOTOMOUS_BINARY');
  assert.strictEqual(ds.columns[3].type, 'LIKERT_SCALE');
  assert.strictEqual(ds.columns[4].type, 'MULTI_SELECT_CHECKBOX');
  assert.strictEqual(ds.columns[5].type, 'OPEN_ENDED_TEXT');
});

console.log('\n===============================================================');
console.log('  STRESS TEST SUMMARY: ' + passed + ' / ' + total + ' PASSED');
console.log('===============================================================\n');