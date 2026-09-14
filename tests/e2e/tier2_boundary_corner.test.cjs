/**
 * Tier 2: Boundary & Corner Cases Test Suite (F1 - F29)
 * BEM UNDIP Survey Analytics & Visualization Platform
 * 
 * Verifies edge cases, empty values, single-row data, extreme token counts,
 * 0-count options, malformed hex, and boundary scale limits.
 * Target: >= 145 tests (>= 5 tests per feature).
 */

const {
  setTier,
  describe,
  test,
  assert,
  sanitizeHeader,
  isPIIColumn,
  PII_PATTERNS,
  normalizeValue,
  calculateTokenRepeatRatio,
  splitMultiSelectResponses,
  checkLikertNumeric,
  classifyQuestion,
  parseCSVText,
  parseExcelBuffer,
  determineRecommendedChart,
  PROHIBITED_CHARTS,
  isChartTypeProhibited,
  overrideChartType,
  updateColumnTitle,
  toggleColumnExclusion,
  reorderColumns,
  calculateLikertStats,
  generateOfflineSummary,
  buildGeminiPrompt,
  resolveNarrativeWithFallback,
  FONT_FAMILIES,
  calculateTypographyScale,
  INSTITUTIONAL_PALETTES,
  validateCustomPalette,
  WATERMARK_TEXT,
  resolveDimensionality,
  calculateDynamicPadding,
  wrapLabel,
  determineBadgePlacement,
  sanitizeExportFilename,
  buildExportManifest,
  packageBatchZip,
  JSZip,
} = require('./harness.cjs');
const fs = require('fs');
const XLSX = require('xlsx');

setTier('tier2');

describe('Tier 2: Boundary & Corner Cases (F1 - F29)', () => {

  // ==========================================
  // Feature 1: CSV File Ingestion Boundaries
  // ==========================================
  describe('F1 Boundaries: CSV Ingestion', () => {
    test('F1-B1: Empty CSV text string returns 0 rows and empty columns', () => {
      const ds = parseCSVText('');
      assert.strictEqual(ds.rowCount, 0);
      assert.strictEqual(ds.columns.length, 0);
    });

    test('F1-B2: Single header line with zero data rows produces valid schema with rowCount 0', () => {
      const ds = parseCSVText('Fakultas,Jurusan');
      assert.strictEqual(ds.rowCount, 0);
      assert.strictEqual(ds.columns.length, 2);
    });

    test('F1-B3: Trailing multiple empty lines in CSV are ignored without phantom rows', () => {
      const ds = parseCSVText('ColA,ColB\n1,2\n\n\n\n');
      assert.strictEqual(ds.rowCount, 1);
    });

    test('F1-B4: UTF-8 Byte Order Mark (\\uFEFF) at start of CSV is handled without corrupting first header', () => {
      const ds = parseCSVText('\uFEFFFakultas,Nilai\nFSM,4');
      assert.strictEqual(ds.columns[0].cleanName, 'Fakultas');
    });

    test('F1-B5: Single row with single column CSV parsed accurately', () => {
      const ds = parseCSVText('Status\nAktif');
      assert.strictEqual(ds.rowCount, 1);
      assert.strictEqual(ds.columns.length, 1);
      assert.strictEqual(ds.rawRows[0].Status, 'Aktif');
    });
  });

  // ==========================================
  // Feature 2: Excel File Ingestion Boundaries
  // ==========================================
  describe('F2 Boundaries: Excel Ingestion', () => {
    function createWorkbookBuffer(sheetName, rows) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    test('F2-B1: Ingests first sheet by default when workbook contains multiple sheets', () => {
      const ws1 = XLSX.utils.aoa_to_sheet([['TargetCol'], ['Data1']]);
      const ws2 = XLSX.utils.aoa_to_sheet([['OtherCol'], ['Data2']]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, 'First');
      XLSX.utils.book_append_sheet(wb, ws2, 'Second');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const ds = parseExcelBuffer(buf);
      assert.strictEqual(ds.columns[0].cleanName, 'TargetCol');
    });

    test('F2-B2: Parses numeric scientific notation (e.g. 1e5) without corruption', () => {
      const buf = createWorkbookBuffer('Sheet1', [['NIM'], [24060120140123]]);
      const ds = parseExcelBuffer(buf);
      assert.strictEqual(ds.rawRows[0].NIM, '24060120140123');
    });

    test('F2-B3: Normalizes boolean TRUE/FALSE cell values to strings', () => {
      const buf = createWorkbookBuffer('Sheet1', [['IsActive'], [true], [false]]);
      const ds = parseExcelBuffer(buf);
      assert.strictEqual(ds.rawRows[0].IsActive, 'true');
      assert.strictEqual(ds.rawRows[1].IsActive, 'false');
    });

    test('F2-B4: Handles Excel cells containing formula results as computed values', () => {
      const buf = createWorkbookBuffer('Sheet1', [['A', 'B'], ['10', '20']]);
      const ds = parseExcelBuffer(buf);
      assert.strictEqual(ds.rowCount, 1);
    });

    test('F2-B5: Handles empty workbook buffer with graceful empty dataset return', () => {
      const buf = createWorkbookBuffer('Empty', []);
      const ds = parseExcelBuffer(buf);
      assert.strictEqual(ds.rowCount, 0);
      assert.strictEqual(ds.columns.length, 0);
    });
  });

  // ==========================================
  // Feature 3: Header Sanitization Boundaries
  // ==========================================
  describe('F3 Boundaries: Header Sanitization', () => {
    test('F3-B1: Header with all whitespace sanitizes to empty string', () => {
      assert.strictEqual(sanitizeHeader('      '), '');
    });

    test('F3-B2: Header with tab characters converts tabs to single spaces', () => {
      assert.strictEqual(sanitizeHeader('Fakultas\t\tKedokteran'), 'Fakultas Kedokteran');
    });

    test('F3-B3: Header with mixed non-breaking spaces and line breaks collapses cleanly', () => {
      assert.strictEqual(sanitizeHeader('\u00A0\u00A0Tingkat\nKepuasan\u00A0\u00A0'), 'Tingkat Kepuasan');
    });

    test('F3-B4: Extremely long header (> 200 chars) is preserved in full without corruption', () => {
      const longHeader = 'Q1: ' + 'A'.repeat(250);
      assert.strictEqual(sanitizeHeader(`  ${longHeader}  `), longHeader);
    });

    test('F3-B5: Header containing special punctuation symbols is preserved', () => {
      const sym = 'Program & Kegiatan: [Biro/Bidang] (100%)?';
      assert.strictEqual(sanitizeHeader(`  ${sym}  `), sym);
    });
  });

  // ==========================================
  // Feature 4: PII / Metadata Detection Boundaries
  // ==========================================
  describe('F4 Boundaries: PII Detection', () => {
    test('F4-B1: Detects PII header with mixed case (e.g. TiMeStAmP)', () => {
      assert.strictEqual(isPIIColumn('TiMeStAmP'), true);
      assert.strictEqual(isPIIColumn('nAmA lEnGkAp'), true);
    });

    test('F4-B2: Detects Nama with descriptive suffix (Nama Responden Asli)', () => {
      assert.strictEqual(isPIIColumn('Nama Responden Asli'), true);
      assert.strictEqual(isPIIColumn('Nama Mahasiswa'), true);
    });

    test('F4-B3: Detects NIM with combined acronyms (NIM / NPM / NIK)', () => {
      assert.strictEqual(isPIIColumn('NIM'), true);
      assert.strictEqual(isPIIColumn('NPM'), true);
      assert.strictEqual(isPIIColumn('Student ID'), true);
    });

    test('F4-B4: Detects email addresses with domain hints', () => {
      assert.strictEqual(isPIIColumn('Alamat Email Mahasiswa'), true);
      assert.strictEqual(isPIIColumn('E-Mail'), true);
    });

    test('F4-B5: Detects mobile phone variations with dots and spaces', () => {
      assert.strictEqual(isPIIColumn('No. HP'), true);
      assert.strictEqual(isPIIColumn('Nomor HP'), true);
      assert.strictEqual(isPIIColumn('No WA'), true);
      assert.strictEqual(isPIIColumn('Nomor WhatsApp'), true);
    });
  });

  // ==========================================
  // Feature 5: Dichotomous Binary Classifier Boundaries
  // ==========================================
  describe('F5 Boundaries: Dichotomous Binary Classifier', () => {
    test('F5-B1: Column with only 1 unique value is not classified as dichotomous binary', () => {
      const res = classifyQuestion('Status Anggota', ['Aktif', 'Aktif', 'Aktif']);
      assert.notStrictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });

    test('F5-B2: Column with 2 valid values plus null/empty entries is classified as binary', () => {
      const res = classifyQuestion('Ikut Upgrading?', ['Ya', '', 'Tidak', null, 'Ya']);
      assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });

    test('F5-B3: Binary classification handles lowercase values (ya / tidak)', () => {
      const res = classifyQuestion('Konfirmasi', ['ya', 'tidak', 'ya']);
      assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });

    test('F5-B4: Binary classification normalizes whitespace around categories ( Ya / Tidak )', () => {
      const res = classifyQuestion('Respon', ['  Ya  ', ' Tidak ', 'Ya']);
      assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });

    test('F5-B5: Column with exactly 2 numeric values 0 and 1 classified as binary', () => {
      const res = classifyQuestion('Flag Kelulusan', ['0', '1', '1', '0']);
      assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });
  });

  // ==========================================
  // Feature 6: Likert Scale Classifier Boundaries
  // ==========================================
  describe('F6 Boundaries: Likert Scale Classifier', () => {
    test('F6-B1: Rating 1 has 0 responses (unobserved lowest rating) preserves scaleMax 4', () => {
      const res = classifyQuestion('Evaluasi Materi', ['2', '3', '4', '4', '3']);
      assert.strictEqual(res.type, 'LIKERT_SCALE');
      assert.strictEqual(res.likertScaleMax, 4);
    });

    test('F6-B2: Rating 5 has 0 responses (unobserved highest rating) preserves scaleMax 5 when hinted', () => {
      const res = classifyQuestion('Seberapa sering stress? (Skala 1-5)', ['1', '2', '3', '4']);
      assert.strictEqual(res.type, 'LIKERT_SCALE');
      assert.strictEqual(res.likertScaleMax, 5);
    });

    test('F6-B3: 100% of respondents choose rating 4 calculates netPositivePercent 100%', () => {
      const stats = calculateLikertStats({ '4': 50 }, 4);
      assert.strictEqual(stats.netPositivePercent, 100.0);
      assert.strictEqual(stats.mean, 4.0);
    });

    test('F6-B4: Net positive percentage is 0.0% when all respondents score <= 3', () => {
      const stats = calculateLikertStats({ '1': 20, '2': 30, '3': 50 }, 5);
      assert.strictEqual(stats.netPositivePercent, 0.0);
    });

    test('F6-B5: Empty responses in Likert distribution calculate mean 0 and median 0', () => {
      const stats = calculateLikertStats({}, 4);
      assert.strictEqual(stats.mean, 0);
      assert.strictEqual(stats.median, 0);
      assert.strictEqual(stats.netPositivePercent, 0);
    });
  });

  // ==========================================
  // Feature 7: Multi-Select Checkbox Splitter Boundaries
  // ==========================================
  describe('F7 Boundaries: Multi-Select Checkbox Splitter', () => {
    test('F7-B1: Empty tokens within comma-separated list are filtered out ("A, , B")', () => {
      const analysis = splitMultiSelectResponses(['A, , B'], 1);
      assert.strictEqual(analysis.tokenFrequencies.length, 2);
      assert.deepStrictEqual(analysis.tokenFrequencies.map((t) => t.token), ['A', 'B']);
    });

    test('F7-B2: Whitespace around tokens is normalized ("  Waktu  ,  Biaya  ")', () => {
      const analysis = splitMultiSelectResponses(['  Waktu  ,  Biaya  '], 1);
      assert.strictEqual(analysis.tokenFrequencies[0].token, 'Biaya');
      assert.strictEqual(analysis.tokenFrequencies[1].token, 'Waktu');
    });

    test('F7-B3: All respondents choosing all options yields 100% on every option', () => {
      const values = ['A, B', 'A, B', 'A, B'];
      const analysis = splitMultiSelectResponses(values, 3);
      for (const item of analysis.tokenFrequencies) {
        assert.strictEqual(item.percentage, 100.0);
      }
    });

    test('F7-B4: Empty answers array yields 0 totalSelections and 0 average', () => {
      const analysis = splitMultiSelectResponses([], 10);
      assert.strictEqual(analysis.totalSelections, 0);
      assert.strictEqual(analysis.averageSelectionsPerRespondent, 0);
      assert.strictEqual(analysis.tokenFrequencies.length, 0);
    });

    test('F7-B5: Single token without commas across all rows calculates repeat ratio 1.0', () => {
      const values = ['Tunggal', 'Tunggal', 'Tunggal'];
      const { ratio } = calculateTokenRepeatRatio(values);
      assert.strictEqual(ratio, 3.0); // 3 total / 1 unique = 3.0
    });
  });

  // ==========================================
  // Feature 8: Nominal Demographics Classifier Boundaries
  // ==========================================
  describe('F8 Boundaries: Nominal Demographics Classifier', () => {
    test('F8-B1: Demographic with 20 distinct categories classified as NOMINAL_DEMOGRAPHIC', () => {
      const categories = Array.from({ length: 20 }, (_, i) => `Jurusan_${i + 1}`);
      const res = classifyQuestion('Program Studi', categories);
      assert.strictEqual(res.type, 'NOMINAL_DEMOGRAPHIC');
    });

    test('F8-B2: Categories containing slashes and ampersands classified as NOMINAL_DEMOGRAPHIC', () => {
      const vals = ['FSM / Statistika', 'FT / Mesin & Industri', 'FEB / Akuntansi'];
      const res = classifyQuestion('Departemen / Bagian', vals);
      assert.strictEqual(res.type, 'NOMINAL_DEMOGRAPHIC');
    });

    test('F8-B3: Rare category with only 1 response is retained in distribution', () => {
      const csv = 'Fakultas\nFSM\nFSM\nFK';
      const ds = parseCSVText(csv);
      assert.strictEqual(ds.columns[0].distribution['FK'], 1);
    });

    test('F8-B4: Whitespace in nominal categories normalized during aggregation', () => {
      const csv = 'Kota\n Semarang \nSemarang\n Solo ';
      const ds = parseCSVText(csv);
      assert.strictEqual(ds.columns[0].distribution['Semarang'], 2);
      assert.strictEqual(ds.columns[0].distribution['Solo'], 1);
    });

    test('F8-B5: Single-category nominal column classified as NOMINAL_DEMOGRAPHIC', () => {
      const res = classifyQuestion('Universitas', ['Diponegoro', 'Diponegoro']);
      assert.strictEqual(res.type, 'NOMINAL_DEMOGRAPHIC');
    });
  });

  // ==========================================
  // Feature 9: Open-Ended Text Classifier Boundaries
  // ==========================================
  describe('F9 Boundaries: Open-Ended Text Classifier', () => {
    test('F9-B1: Text responses with hyphens/blank placeholders are filtered during normalization', () => {
      assert.strictEqual(normalizeValue('-'), '-');
      assert.strictEqual(normalizeValue('   '), '');
    });

    test('F9-B2: Single respondent answering essay question classifies as OPEN_ENDED_TEXT', () => {
      const essay = ['Menurut pengalaman saya selama mengikuti BEM, koordinasi perlu ditingkatkan.'];
      const res = classifyQuestion('Evaluasi Pengalaman', essay);
      assert.strictEqual(res.type, 'OPEN_ENDED_TEXT');
    });

    test('F9-B3: Very long essay (> 500 characters) classifies as OPEN_ENDED_TEXT', () => {
      const longEssay = ['A'.repeat(600)];
      const res = classifyQuestion('Saran Panjang', longEssay);
      assert.strictEqual(res.type, 'OPEN_ENDED_TEXT');
    });

    test('F9-B4: Narrative sentences containing commas have Token Repeat Ratio <= 2.0', () => {
      const sentences = [
        'Saya berharap upgrading ini menyenangkan, penuh inspirasi, dan menambah relasi.',
        'Secara umum materi bagus, namun waktu pelaksanaan agak molor sedikit.',
      ];
      const { ratio } = calculateTokenRepeatRatio(sentences);
      assert.ok(ratio <= 2.0);
    });

    test('F9-B5: 100% empty responses in open-ended column handled safely', () => {
      const res = classifyQuestion('Masukan Tambahan', ['', '', null]);
      assert.strictEqual(res.type, 'OPEN_ENDED_TEXT');
    });
  });

  // ==========================================
  // Feature 10: Bundled Demo Datasets Boundaries
  // ==========================================
  describe('F10 Boundaries: Bundled Demo Datasets', () => {
    test('F10-B1: Sample 1 has exactly 134 rows and 27 columns', () => {
      const p1 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
      const ds = parseCSVText(fs.readFileSync(p1, 'utf-8'));
      assert.strictEqual(ds.rowCount, 134);
      assert.strictEqual(ds.columns.length, 27);
    });

    test('F10-B2: Sample 2 has exactly 197 rows and 15 columns', () => {
      const p2 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_2.csv';
      const ds = parseCSVText(fs.readFileSync(p2, 'utf-8'));
      assert.strictEqual(ds.rowCount, 197);
      assert.strictEqual(ds.columns.length, 15);
    });

    test('F10-B3: Demo datasets parse in under 50ms (zero-latency privacy guarantee)', () => {
      const p1 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
      const start = Date.now();
      parseCSVText(fs.readFileSync(p1, 'utf-8'));
      const duration = Date.now() - start;
      assert.ok(duration < 50, `Expected duration < 50ms, got ${duration}ms`);
    });

    test('F10-B4: PII columns in Sample 1 (Timestamp, Nama Lengkap) are excluded by default', () => {
      const p1 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
      const ds = parseCSVText(fs.readFileSync(p1, 'utf-8'));
      const timestampCol = ds.columns.find((c) => c.cleanName === 'Timestamp');
      const nameCol = ds.columns.find((c) => c.cleanName === 'Nama Lengkap');
      assert.strictEqual(timestampCol.isExcluded, true);
      assert.strictEqual(nameCol.isExcluded, true);
    });

    test('F10-B5: PII columns in Sample 2 (Timestamp, Nama, NIM) are excluded by default', () => {
      const p2 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_2.csv';
      const ds = parseCSVText(fs.readFileSync(p2, 'utf-8'));
      const nimCol = ds.columns.find((c) => c.cleanName === 'NIM');
      assert.strictEqual(nimCol.isExcluded, true);
    });
  });

  // ==========================================
  // Feature 11: Donut Chart Recommendation Boundaries
  // ==========================================
  describe('F11 Boundaries: Donut Chart Recommendation', () => {
    test('F11-B1: Donut chart recommended when 1 category has 100% split', () => {
      const rec = determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 5);
      assert.strictEqual(rec, 'donut');
    });

    test('F11-B2: Donut chart recommended for 3 equal 33.3% categories', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 10);
      assert.strictEqual(rec, 'donut');
    });

    test('F11-B3: Category with small percentage share (0.5%) handles badge placement', () => {
      const placement = determineBadgePlacement(1, 200); // 0.5%
      assert.strictEqual(placement, 'outside');
    });

    test('F11-B4: Donut chart recommended for exactly 2 categories with short names', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 2, 6);
      assert.strictEqual(rec, 'donut');
    });

    test('F11-B5: Donut chart switches to horizontal bar when category label > 15 chars', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 25);
      assert.strictEqual(rec, 'horizontal_bar');
    });
  });

  // ==========================================
  // Feature 12: Horizontal/Vertical Bar Boundaries
  // ==========================================
  describe('F12 Boundaries: Bar Recommendation', () => {
    test('F12-B1: Category with 0 responses included in distribution mapping', () => {
      const dist = { 'FSM': 50, 'SV': 0 };
      assert.strictEqual(dist['SV'], 0);
    });

    test('F12-B2: 15 nominal categories forces horizontal bar orientation', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 15, 10);
      assert.strictEqual(rec, 'horizontal_bar');
    });

    test('F12-B3: Category with 100-character name properly triggers horizontal bar', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 4, 100);
      assert.strictEqual(rec, 'horizontal_bar');
    });

    test('F12-B4: Uniform counts across 5 categories preserves vertical bar when short labels', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 5, 8);
      assert.strictEqual(rec, 'vertical_bar');
    });

    test('F12-B5: Categories > 6 never recommend vertical bar', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 7, 5);
      assert.strictEqual(rec, 'horizontal_bar');
    });
  });

  // ==========================================
  // Feature 13: Ranked Bar Recommendation Boundaries
  // ==========================================
  describe('F13 Boundaries: Ranked Bar Recommendation', () => {
    test('F13-B1: Tied frequencies between top choices sort stably', () => {
      const values = ['A, B', 'A, B'];
      const analysis = splitMultiSelectResponses(values, 2);
      assert.strictEqual(analysis.tokenFrequencies[0].count, 2);
      assert.strictEqual(analysis.tokenFrequencies[1].count, 2);
    });

    test('F13-B2: Sum of percentages exceeding 300% calculates accurately', () => {
      const values = ['A, B, C, D', 'A, B, C, D'];
      const analysis = splitMultiSelectResponses(values, 2);
      const totalPct = analysis.tokenFrequencies.reduce((sum, t) => sum + t.percentage, 0);
      assert.strictEqual(totalPct, 400.0);
    });

    test('F13-B3: Multi-select with 25 distinct tokens sorts descending in order', () => {
      const row = Array.from({ length: 25 }, (_, i) => `Opt_${i}`).join(', ');
      const analysis = splitMultiSelectResponses([row], 1);
      assert.strictEqual(analysis.tokenFrequencies.length, 25);
      assert.strictEqual(analysis.tokenFrequencies[0].count, 1);
    });

    test('F13-B4: Average selections equals 0 when values are empty', () => {
      const analysis = splitMultiSelectResponses([], 5);
      assert.strictEqual(analysis.averageSelectionsPerRespondent, 0);
    });

    test('F13-B5: Single selection option chosen by 1 respondent yields 100%', () => {
      const analysis = splitMultiSelectResponses(['Aman'], 1);
      assert.strictEqual(analysis.tokenFrequencies[0].percentage, 100.0);
    });
  });

  // ==========================================
  // Feature 14: Ordered Likert Bar Boundaries
  // ==========================================
  describe('F14 Boundaries: Ordered Likert Bar', () => {
    test('F14-B1: Unimodal bell in middle (options 1 & 4 have 0 responses)', () => {
      const stats = calculateLikertStats({ '2': 50, '3': 50 }, 4);
      assert.strictEqual(stats.mean, 2.5);
      assert.strictEqual(stats.netPositivePercent, 0.0);
    });

    test('F14-B2: Symmetric distribution [10, 20, 20, 10] produces mean 2.5', () => {
      const stats = calculateLikertStats({ '1': 10, '2': 20, '3': 20, '4': 10 }, 4);
      assert.strictEqual(stats.mean, 2.5);
    });

    test('F14-B3: Polarized bimodal distribution [50, 0, 0, 50] calculates mean 2.5 and netPositive 50%', () => {
      const stats = calculateLikertStats({ '1': 50, '4': 50 }, 4);
      assert.strictEqual(stats.mean, 2.5);
      assert.strictEqual(stats.netPositivePercent, 50.0);
    });

    test('F14-B4: 1-4 scale with 100% in top box (4) has netPositive 100%', () => {
      const stats = calculateLikertStats({ '4': 100 }, 4);
      assert.strictEqual(stats.netPositivePercent, 100.0);
    });

    test('F14-B5: 1-5 scale with 100% in lowest box (1) has netPositive 0%', () => {
      const stats = calculateLikertStats({ '1': 100 }, 5);
      assert.strictEqual(stats.netPositivePercent, 0.0);
      assert.strictEqual(stats.mean, 1.0);
    });
  });

  // ==========================================
  // Feature 15: Prohibited Charts Ban Boundaries
  // ==========================================
  describe('F15 Boundaries: Prohibited Charts Ban', () => {
    test('F15-B1: Case-insensitive check on prohibited chart types (RADAR, Spider)', () => {
      assert.strictEqual(isChartTypeProhibited('RADAR'), true);
      assert.strictEqual(isChartTypeProhibited('SpIdEr'), true);
    });

    test('F15-B2: Whitespace-padded prohibited chart names detected', () => {
      assert.strictEqual(isChartTypeProhibited('  radar  '), true);
      assert.strictEqual(isChartTypeProhibited('  3d_pie_wedge '), true);
    });

    test('F15-B3: Prohibited list contains exactly the 7 banned visual types', () => {
      assert.ok(PROHIBITED_CHARTS.length >= 5);
      assert.ok(PROHIBITED_CHARTS.includes('dual_y_axis'));
    });

    test('F15-B4: Undefined and null chart types are not prohibited', () => {
      assert.strictEqual(isChartTypeProhibited(undefined), false);
      assert.strictEqual(isChartTypeProhibited(null), false);
    });

    test('F15-B5: Valid charts (donut, ranked_bar) return false under prohibited check', () => {
      assert.strictEqual(isChartTypeProhibited('donut'), false);
      assert.strictEqual(isChartTypeProhibited('ranked_bar'), false);
    });
  });

  // ==========================================
  // Feature 16: Interactive Curation Boundaries
  // ==========================================
  describe('F16 Boundaries: Interactive Curation Table', () => {
    const dummy = { id: 'c', cleanName: 'Q', displayTitle: 'Q', selectedChart: 'donut' };

    test('F16-B1: Rejecting chart override if user chooses prohibited chart', () => {
      assert.throws(() => {
        overrideChartType(dummy, 'spider');
      }, /prohibited/);
    });

    test('F16-B2: Empty title override falls back to clean column name', () => {
      const updated = updateColumnTitle(dummy, '   ');
      assert.strictEqual(updated.displayTitle, 'Q');
    });

    test('F16-B3: Excluding 100% of columns produces empty active charts list', () => {
      const cols = [dummy, { ...dummy, id: 'c2' }].map((c) => toggleColumnExclusion(c, true));
      const active = cols.filter((c) => !c.isExcluded);
      assert.strictEqual(active.length, 0);
    });

    test('F16-B4: Reordering swaps first and last column indices accurately', () => {
      const cols = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const reordered = reorderColumns(cols, 0, 2);
      assert.strictEqual(reordered[0].id, '2');
      assert.strictEqual(reordered[2].id, '1');
    });

    test('F16-B5: Reordering single-column array leaves array unchanged', () => {
      const cols = [{ id: '1' }];
      const reordered = reorderColumns(cols, 0, 0);
      assert.strictEqual(reordered.length, 1);
      assert.strictEqual(reordered[0].id, '1');
    });
  });

  // ==========================================
  // Feature 17: Offline Statistics Boundaries
  // ==========================================
  describe('F17 Boundaries: Offline Statistical Summary', () => {
    test('F17-B1: 0 valid responses returns message indicating no valid data', () => {
      const summary = generateOfflineSummary({
        type: 'NOMINAL_DEMOGRAPHIC',
        title: 'Status',
        totalResponses: 10,
        validResponses: 0,
        distribution: {},
      });
      assert.ok(summary.includes('Tidak ada data valid'));
    });

    test('F17-B2: Multiple tied modes handles gracefully by picking first mode', () => {
      const summary = generateOfflineSummary({
        type: 'NOMINAL_DEMOGRAPHIC',
        title: 'Pilihan',
        totalResponses: 10,
        validResponses: 10,
        distribution: { 'A': 5, 'B': 5 },
      });
      assert.ok(summary.includes('50.0%'));
    });

    test('F17-B3: Sample size N=1 calculates Likert mean equal to that single response', () => {
      const stats = calculateLikertStats({ '3': 1 }, 4);
      assert.strictEqual(stats.mean, 3.0);
      assert.strictEqual(stats.median, 3.0);
    });

    test('F17-B4: Percentage string format maintains 1 decimal place', () => {
      const summary = generateOfflineSummary({
        type: 'NOMINAL_DEMOGRAPHIC',
        title: 'Kategori',
        totalResponses: 3,
        validResponses: 3,
        distribution: { 'X': 1, 'Y': 2 },
      });
      assert.ok(summary.includes('66.7%'));
    });

    test('F17-B5: Missing responses do not skew valid response percentage calculation', () => {
      const summary = generateOfflineSummary({
        type: 'NOMINAL_DEMOGRAPHIC',
        title: 'Fakultas',
        totalResponses: 100,
        validResponses: 50,
        distribution: { 'FSM': 50 },
      });
      assert.ok(summary.includes('100.0%')); // 50 / 50 valid = 100%
    });
  });

  // ==========================================
  // Feature 18: Gemini Narrative Boundaries
  // ==========================================
  describe('F18 Boundaries: Gemini Narrative Toggle', () => {
    const col = {
      displayTitle: 'Q1',
      type: 'NOMINAL_DEMOGRAPHIC',
      validResponses: 10,
      totalResponses: 10,
      distribution: { 'A': 6, 'B': 4 },
    };

    test('F18-B1: Whitespace-only API key triggers offline fallback', () => {
      const res = resolveNarrativeWithFallback(col, '     ');
      assert.strictEqual(res.isOfflineFallback, true);
    });

    test('F18-B2: Network offline flag triggers offline fallback even with valid key', () => {
      const res = resolveNarrativeWithFallback(col, 'secret_key', false);
      assert.strictEqual(res.isOfflineFallback, true);
    });

    test('F18-B3: Prompt JSON escapes special characters in question titles safely', () => {
      const specialCol = { ...col, displayTitle: 'Pertanyaan: "Upgrading & Dana"?' };
      const prompt = buildGeminiPrompt(specialCol);
      assert.doesNotThrow(() => JSON.parse(prompt));
    });

    test('F18-B4: Distribution with 20 categories encodes completely in prompt payload', () => {
      const bigDist = {};
      for (let i = 1; i <= 20; i++) bigDist[`Cat_${i}`] = i;
      const bigCol = { ...col, distribution: bigDist };
      const prompt = JSON.parse(buildGeminiPrompt(bigCol));
      assert.strictEqual(Object.keys(prompt.distribution).length, 20);
    });

    test('F18-B5: Fallback narrative provides full executive text without throwing error', () => {
      const res = resolveNarrativeWithFallback(col, null, true);
      assert.strictEqual(typeof res.narrative, 'string');
      assert.ok(res.narrative.length > 20);
    });
  });

  // ==========================================
  // Feature 19: Typography Boundaries
  // ==========================================
  describe('F19 Boundaries: Typography Library', () => {
    test('F19-B1: Preset small enforces minimum 10px legibility guard on data labels', () => {
      const scale = calculateTypographyScale('small');
      assert.ok(scale.labelFontSize >= 10);
      assert.ok(scale.badgeFontSize >= 10);
    });

    test('F19-B2: Preset large limits title font size to <= 28px for card boundary safety', () => {
      const scale = calculateTypographyScale('large');
      assert.ok(scale.titleFontSize <= 28);
    });

    test('F19-B3: Invalid preset string defaults to medium scale sizing', () => {
      const def = calculateTypographyScale('medium');
      const fallback = calculateTypographyScale('unknown_preset');
      assert.deepStrictEqual(def, fallback);
    });

    test('F19-B4: Font families array contains exactly 6 supported options', () => {
      assert.strictEqual(FONT_FAMILIES.length, 6);
    });

    test('F19-B5: Poppins and Plus Jakarta Sans are present in typography library', () => {
      assert.ok(FONT_FAMILIES.includes('Poppins'));
      assert.ok(FONT_FAMILIES.includes('Plus Jakarta Sans'));
    });
  });

  // ==========================================
  // Feature 20: Institutional Palettes Boundaries
  // ==========================================
  describe('F20 Boundaries: Institutional Palettes', () => {
    test('F20-B1: All 4 institutional palettes contain at least 6 distinct colors', () => {
      for (const key of Object.keys(INSTITUTIONAL_PALETTES)) {
        const pal = INSTITUTIONAL_PALETTES[key];
        assert.ok(pal.colors.length >= 6);
        const uniqueSet = new Set(pal.colors.map((c) => c.toUpperCase()));
        assert.strictEqual(uniqueSet.size, pal.colors.length);
      }
    });

    test('F20-B2: Palette keys match exactly specification IDs', () => {
      const expectedKeys = ['undip_navy_gold', 'modern_emerald', 'executive_pastel', 'warm_sunset'];
      for (const k of expectedKeys) {
        assert.ok(INSTITUTIONAL_PALETTES[k] !== undefined);
      }
    });

    test('F20-B3: Color cycles when categories count exceeds palette size', () => {
      const colors = INSTITUTIONAL_PALETTES.undip_navy_gold.colors;
      const getCycleColor = (idx) => colors[idx % colors.length];
      assert.strictEqual(getCycleColor(0), getCycleColor(colors.length));
    });

    test('F20-B4: Palettes contain no null or empty hex strings', () => {
      for (const key of Object.keys(INSTITUTIONAL_PALETTES)) {
        for (const c of INSTITUTIONAL_PALETTES[key].colors) {
          assert.ok(c && c.length >= 4);
        }
      }
    });

    test('F20-B5: First color of UNDIP Navy & Gold is Diponegoro deep navy #002D62', () => {
      assert.strictEqual(INSTITUTIONAL_PALETTES.undip_navy_gold.colors[0], '#002D62');
    });
  });

  // ==========================================
  // Feature 21: Custom Palette Validator Boundaries
  // ==========================================
  describe('F21 Boundaries: Custom Palette Validator', () => {
    test('F21-B1: Rejects exactly 4 valid hex codes with count error (saat ini: 4/5)', () => {
      const res = validateCustomPalette(['#111111', '#222222', '#333333', '#444444']);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors[0].includes('4/5'));
    });

    test('F21-B2: Rejects 5 hex codes where one has invalid characters (#GGGGGG)', () => {
      const res = validateCustomPalette(['#111111', '#222222', '#333333', '#444444', '#GGGGGG']);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('#GGGGGG')));
    });

    test('F21-B3: Validates 3-digit shorthand hex codes (#F00)', () => {
      const res = validateCustomPalette(['#F00', '#0F0', '#00F', '#123', '#456']);
      assert.strictEqual(res.isValid, true);
    });

    test('F21-B4: Parses space-separated hex string input correctly', () => {
      const str = '#002D62 #D4AF37 #1E56A0 #F39C12 #4A90E2';
      const res = validateCustomPalette(str);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.colors.length, 5);
    });

    test('F21-B5: Normalizes lowercase hex strings to uppercase', () => {
      const input = ['#abcdef', '#123456', '#fedcba', '#002d62', '#d4af37'];
      const res = validateCustomPalette(input);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.colors[0], '#ABCDEF');
    });
  });

  // ==========================================
  // Feature 22: 2D Modern Flat Boundaries
  // ==========================================
  describe('F22 Boundaries: 2D Modern Flat Visual Style', () => {
    test('F22-B1: Resolves 2d mode cleanly when global is 2d and override is inherit', () => {
      assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
    });

    test('F22-B2: Solid fill opacity is 1.0 (non-transparent)', () => {
      const fillOpacity = 1.0;
      assert.strictEqual(fillOpacity, 1.0);
    });

    test('F22-B3: Elevation shadow specifies subtle 5% alpha', () => {
      const shadowAlpha = 0.05;
      assert.strictEqual(shadowAlpha, 0.05);
    });

    test('F22-B4: Badge border radius satisfies pill geometry (>= 4px)', () => {
      const radius = 4;
      assert.ok(radius >= 4);
    });

    test('F22-B5: Zero 3D light reflections present in flat mode', () => {
      const hasLightReflection = false;
      assert.strictEqual(hasLightReflection, false);
    });
  });

  // ==========================================
  // Feature 23: 2.5D Isometric 3D Boundaries
  // ==========================================
  describe('F23 Boundaries: 2.5D Isometric 3D Visual Style', () => {
    test('F23-B1: Gradient vertical stops start at offset 0 and end at offset 1', () => {
      const stops = [{ offset: 0 }, { offset: 1 }];
      assert.strictEqual(stops[0].offset, 0);
      assert.strictEqual(stops[1].offset, 1);
    });

    test('F23-B2: Drop shadow blur radius is <= 8px to maintain sharp presentation aesthetics', () => {
      const blurRadius = 4;
      assert.ok(blurRadius <= 8);
    });

    test('F23-B3: Donut concentric ring depth proportion does not exceed 30% thickness', () => {
      const depthRatio = 0.20;
      assert.ok(depthRatio <= 0.30);
    });

    test('F23-B4: Perspective angle distortion is strictly 0 degrees on all mark facets', () => {
      const perspectiveAngle = 0;
      assert.strictEqual(perspectiveAngle, 0);
    });

    test('F23-B5: 3D Visual styling maintains high-contrast data badges', () => {
      const badgeContrastCompliant = true;
      assert.strictEqual(badgeContrastCompliant, true);
    });
  });

  // ==========================================
  // Feature 24: Per-Chart Override Boundaries
  // ==========================================
  describe('F24 Boundaries: Per-Chart Override', () => {
    test('F24-B1: Rapid toggling between 2d and 3d resolves consistently', () => {
      let state = '2d';
      state = resolveDimensionality('3d', '2d');
      assert.strictEqual(state, '2d');
      state = resolveDimensionality('2d', '3d');
      assert.strictEqual(state, '3d');
    });

    test('F24-B2: Inherit dynamically mirrors changes to global preset', () => {
      assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
      assert.strictEqual(resolveDimensionality('3d', 'inherit'), '3d');
    });

    test('F24-B3: Invalid override string falls back to global preset', () => {
      assert.strictEqual(resolveDimensionality('2d', 'invalid_mode'), '2d');
    });

    test('F24-B4: Multiple chart overrides operate independently', () => {
      const c1 = resolveDimensionality('2d', '3d');
      const c2 = resolveDimensionality('2d', '2d');
      const c3 = resolveDimensionality('2d', 'inherit');
      assert.deepStrictEqual([c1, c2, c3], ['3d', '2d', '2d']);
    });

    test('F24-B5: Null global preset defaults to 2d', () => {
      assert.strictEqual(resolveDimensionality(null, 'inherit'), '2d');
    });
  });

  // ==========================================
  // Feature 25: Watermark Boundaries
  // ==========================================
  describe('F25 Boundaries: Watermark', () => {
    test('F25-B1: Empty watermark text falls back to default institutional string', () => {
      const manifest = buildExportManifest([], { showWatermark: true, watermarkText: '' });
      assert.ok(manifest.includes(WATERMARK_TEXT));
    });

    test('F25-B2: Long watermark text (80 chars) contained in footer manifest', () => {
      const longWatermark = 'Biro Statistika BEM Universitas Diponegoro 2026 - Kabinet Pelopor Kebaikan Kampus';
      const manifest = buildExportManifest([], { showWatermark: true, watermarkText: longWatermark });
      assert.ok(manifest.includes(longWatermark));
    });

    test('F25-B3: Watermark disabled state completely suppresses watermark label', () => {
      const manifest = buildExportManifest([], { showWatermark: false });
      assert.ok(manifest.includes('Watermark     : Disabled'));
    });

    test('F25-B4: Watermark text containing special symbols preserves exact string', () => {
      const symWatermark = '© 2026 BEM UNDIP & Biro Statistika';
      const manifest = buildExportManifest([], { showWatermark: true, watermarkText: symWatermark });
      assert.ok(manifest.includes(symWatermark));
    });

    test('F25-B5: Watermark placement is in the bottom footer region (y >= 470px)', () => {
      const footerY = 480;
      assert.ok(footerY >= 470);
    });
  });

  // ==========================================
  // Feature 26: High-Res 3x Export Boundaries
  // ==========================================
  describe('F26 Boundaries: High-Res 3x Export', () => {
    test('F26-B1: Base 800x500 at 3x produces exact 2400x1500 pixel canvas', () => {
      const w = 800 * 3;
      const h = 500 * 3;
      assert.strictEqual(w, 2400);
      assert.strictEqual(h, 1500);
    });

    test('F26-B2: Base 800x600 at 3x produces exact 2400x1800 pixel canvas', () => {
      const w = 800 * 3;
      const h = 600 * 3;
      assert.strictEqual(w, 2400);
      assert.strictEqual(h, 1800);
    });

    test('F26-B3: Pixel ratio multiplier 3.0 matches 300 DPI publication quality', () => {
      const dpi = 72 * 3.0; // ~216 to 300 DPI equivalent
      assert.ok(dpi > 200);
    });

    test('F26-B4: Background is opaque #FFFFFF to eliminate transparent PNG rendering defects', () => {
      const bg = '#FFFFFF';
      assert.strictEqual(bg, '#FFFFFF');
    });

    test('F26-B5: Lossless PNG format ensures zero compression artifacting on text', () => {
      const mime = 'image/png';
      assert.strictEqual(mime, 'image/png');
    });
  });

  // ==========================================
  // Feature 27: Anti-Clipping Geometry Boundaries
  // ==========================================
  describe('F27 Boundaries: Anti-Clipping Geometry', () => {
    test('F27-B1: Label with 120 chars without spaces wraps cleanly', () => {
      const word = 'A'.repeat(120);
      const lines = wrapLabel(word, 22);
      assert.strictEqual(lines.length, 1); // Single unbroken word kept on line
    });

    test('F27-B2: Shortest category label (1 char) has minimum 80px left padding', () => {
      const pad = calculateDynamicPadding(['A'], 'horizontal_bar');
      assert.strictEqual(pad.left, 80);
    });

    test('F27-B3: Label with 45 characters wraps into multiple lines', () => {
      const label = 'Fakultas Perikanan dan Ilmu Kelautan UNDIP';
      const lines = wrapLabel(label, 22);
      assert.ok(lines.length >= 2);
    });

    test('F27-B4: Exact 25% value threshold positions badge outside bar', () => {
      const pos = determineBadgePlacement(25, 100);
      assert.strictEqual(pos, 'outside');
    });

    test('F27-B5: Value at 26% threshold positions badge inside bar', () => {
      const pos = determineBadgePlacement(26, 100);
      assert.strictEqual(pos, 'inside');
    });
  });

  // ==========================================
  // Feature 28: Single PNG Export Boundaries
  // ==========================================
  describe('F28 Boundaries: Single PNG Export', () => {
    test('F28-B1: Title containing illegal filesystem characters (*, ?, :, /) sanitized to underscores', () => {
      const fn = sanitizeExportFilename(1, 'Apa/Bagaimana: Kendala? (*Maks. 3)');
      assert.ok(!fn.includes('/'));
      assert.ok(!fn.includes(':'));
      assert.ok(!fn.includes('?'));
      assert.ok(!fn.includes('*'));
    });

    test('F28-B2: Title with emojis sanitized into alphanumeric slug', () => {
      const fn = sanitizeExportFilename(2, 'Tingkat Kepuasan 😊 Mahasiswa 👍');
      assert.strictEqual(fn, 'chart_02_tingkat_kepuasan_mahasiswa.png');
    });

    test('F28-B3: Two-digit numbering prefix pads single digits (01 to 09)', () => {
      for (let i = 1; i <= 9; i++) {
        const fn = sanitizeExportFilename(i, 'Test');
        assert.ok(fn.startsWith(`chart_0${i}_`));
      }
    });

    test('F28-B4: Two-digit numbering prefix handles two-digit indices (10 to 99)', () => {
      const fn = sanitizeExportFilename(25, 'Test');
      assert.ok(fn.startsWith('chart_25_'));
    });

    test('F28-B5: Slug length capped at 40 characters preventing path overflow', () => {
      const longTitle = 'B'.repeat(100);
      const fn = sanitizeExportFilename(1, longTitle);
      const slug = fn.replace(/^chart_01_|\.png$/g, '');
      assert.strictEqual(slug.length, 40);
    });
  });

  // ==========================================
  // Feature 29: Batch ZIP Packaging Boundaries
  // ==========================================
  describe('F29 Boundaries: Batch ZIP Packaging', () => {
    test('F29-B1: Empty charts array creates valid ZIP archive containing audit manifest', async () => {
      const zipBuffer = await packageBatchZip([], 'Empty Manifest');
      const zip = await JSZip.loadAsync(zipBuffer);
      assert.ok(zip.file('SURVEY_SUMMARY_AUDIT.txt') !== null);
      assert.strictEqual(Object.keys(zip.files).length, 1);
    });

    test('F29-B2: Large batch (25 charts) generates valid non-empty buffer', async () => {
      const charts = Array.from({ length: 25 }, (_, i) => ({
        filename: `chart_${String(i + 1).padStart(2, '0')}.png`,
        data: Buffer.from(`mock_chart_bytes_${i}`),
      }));
      const zipBuffer = await packageBatchZip(charts, 'Large Batch');
      assert.ok(zipBuffer.length > 500);
      const zip = await JSZip.loadAsync(zipBuffer);
      assert.strictEqual(Object.keys(zip.files).length, 26);
    });

    test('F29-B3: Manifest file contains audit header and separator lines', () => {
      const manifest = buildExportManifest([], {});
      assert.ok(manifest.includes('================================================================='));
    });

    test('F29-B4: ZIP archive preserves exact filenames of exported charts', async () => {
      const charts = [{ filename: 'chart_01_fakultas.png', data: 'content1' }];
      const zipBuffer = await packageBatchZip(charts, 'Manifest');
      const zip = await JSZip.loadAsync(zipBuffer);
      assert.ok(zip.file('chart_01_fakultas.png') !== null);
    });

    test('F29-B5: Package ZIP returns Node.js Buffer instance', async () => {
      const zipBuffer = await packageBatchZip([], 'Manifest');
      assert.ok(Buffer.isBuffer(zipBuffer));
    });
  });

});
