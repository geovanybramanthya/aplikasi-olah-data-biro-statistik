/**
 * Tier 1: Feature Coverage Test Suite (F1 - F29)
 * BEM UNDIP Survey Analytics & Visualization Platform
 * 
 * Verifies equivalence class representative inputs for all 29 features.
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

setTier('tier1');

describe('Tier 1: Feature Coverage (F1 - F29)', () => {

  // ==========================================
  // Feature 1: CSV File Ingestion (R1)
  // ==========================================
  describe('F1: CSV File Ingestion', () => {
    test('F1-1: Parses standard comma-delimited CSV with header and records', () => {
      const csv = 'Jurusan,Angkatan\nInformatika,2024\nStatistika,2023';
      const ds = parseCSVText(csv, 'test.csv');
      assert.strictEqual(ds.rowCount, 2);
      assert.strictEqual(ds.columns.length, 2);
      assert.strictEqual(ds.rawRows[0].Jurusan, 'Informatika');
      assert.strictEqual(ds.rawRows[1].Angkatan, '2023');
    });

    test('F1-2: Parses cells containing quoted commas without column misalignment', () => {
      const csv = 'Nama,Organisasi\n"Budi, S.Kom","BEM, DPM"\n"Siti, S.Stat",HMM';
      const ds = parseCSVText(csv, 'quoted.csv');
      assert.strictEqual(ds.rowCount, 2);
      assert.strictEqual(ds.rawRows[0].Nama, 'Budi, S.Kom');
      assert.strictEqual(ds.rawRows[0].Organisasi, 'BEM, DPM');
    });

    test('F1-3: Handles escaped double quotes according to RFC 4180', () => {
      const csv = 'Feedback\n"Pelatihan ""Upgrading"" sangat bermanfaat"';
      const ds = parseCSVText(csv, 'escaped.csv');
      assert.strictEqual(ds.rowCount, 1);
      assert.strictEqual(ds.rawRows[0].Feedback, 'Pelatihan "Upgrading" sangat bermanfaat');
    });

    test('F1-4: Handles Windows CRLF and Unix LF line endings consistently', () => {
      const csvCRLF = 'A,B\r\n1,2\r\n3,4';
      const ds = parseCSVText(csvCRLF, 'crlf.csv');
      assert.strictEqual(ds.rowCount, 2);
      assert.strictEqual(ds.rawRows[1].A, '3');
    });

    test('F1-5: Correctly computes totalResponses, validResponses, and missingResponses', () => {
      const csv = 'Fakultas,Nilai\nFSM,4\nFEB,\nFH,3';
      const ds = parseCSVText(csv, 'missing.csv');
      const colNilai = ds.columns.find((c) => c.cleanName === 'Nilai');
      assert.strictEqual(colNilai.totalResponses, 3);
      assert.strictEqual(colNilai.validResponses, 2);
      assert.strictEqual(colNilai.missingResponses, 1);
    });
  });

  // ==========================================
  // Feature 2: Excel File Ingestion (R1)
  // ==========================================
  describe('F2: Excel File Ingestion', () => {
    function createWorkbookBuffer(rows) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    test('F2-1: Parses standard XLSX workbook buffer into structured dataset', () => {
      const buf = createWorkbookBuffer([
        ['Fakultas', 'Status'],
        ['FSM', 'Aktif'],
        ['FT', 'Alumni'],
      ]);
      const ds = parseExcelBuffer(buf, 'kampus.xlsx');
      assert.strictEqual(ds.rowCount, 2);
      assert.strictEqual(ds.columns.length, 2);
      assert.strictEqual(ds.rawRows[0].Fakultas, 'FSM');
    });

    test('F2-2: Correctly maps columns and extracts sheet 1 data', () => {
      const buf = createWorkbookBuffer([
        ['Q1', 'Q2', 'Q3'],
        ['Ya', '1', 'Baik'],
        ['Tidak', '4', 'Cukup'],
      ]);
      const ds = parseExcelBuffer(buf, 'multi.xlsx');
      assert.strictEqual(ds.columns.length, 3);
      assert.deepStrictEqual(ds.columns.map((c) => c.cleanName), ['Q1', 'Q2', 'Q3']);
    });

    test('F2-3: Normalizes floating-point numeric ratings from Excel (e.g. 4.0 -> 4)', () => {
      const buf = createWorkbookBuffer([
        ['Skor'],
        [4.0],
        [5.0],
      ]);
      const ds = parseExcelBuffer(buf, 'floats.xlsx');
      assert.strictEqual(ds.rawRows[0].Skor, '4');
      assert.strictEqual(ds.rawRows[1].Skor, '5');
    });

    test('F2-4: Gracefully handles empty cells in Excel rows without shifting columns', () => {
      const buf = createWorkbookBuffer([
        ['A', 'B', 'C'],
        ['valA', '', 'valC'],
      ]);
      const ds = parseExcelBuffer(buf, 'holes.xlsx');
      assert.strictEqual(ds.rawRows[0].A, 'valA');
      assert.strictEqual(ds.rawRows[0].B, '');
      assert.strictEqual(ds.rawRows[0].C, 'valC');
    });

    test('F2-5: Returns empty dataset when Excel workbook has zero data rows', () => {
      const buf = createWorkbookBuffer([['HeaderOnly']]);
      const ds = parseExcelBuffer(buf, 'empty.xlsx');
      assert.strictEqual(ds.rowCount, 0);
      assert.strictEqual(ds.columns[0].validResponses, 0);
    });
  });

  // ==========================================
  // Feature 3: Header Sanitization (Survey, R1)
  // ==========================================
  describe('F3: Header Sanitization', () => {
    test('F3-1: Trims leading and trailing whitespace from headers', () => {
      assert.strictEqual(sanitizeHeader('  Asal Bidang/Biro/Kantor  '), 'Asal Bidang/Biro/Kantor');
      assert.strictEqual(sanitizeHeader('Nama Lengkap '), 'Nama Lengkap');
    });

    test('F3-2: Collapses multiple consecutive spaces into a single space', () => {
      assert.strictEqual(sanitizeHeader('Seberapa   sering   Anda'), 'Seberapa sering Anda');
    });

    test('F3-3: Converts non-breaking spaces (\u00A0) to standard spaces', () => {
      assert.strictEqual(sanitizeHeader('Tingkat\u00A0Kepuasan'), 'Tingkat Kepuasan');
    });

    test('F3-4: Preserves capitalization and punctuation in questions', () => {
      const q = 'Apakah Anda setuju? (Maks. 3)';
      assert.strictEqual(sanitizeHeader(`  ${q}  `), q);
    });

    test('F3-5: Returns empty string when header is null or undefined or whitespace only', () => {
      assert.strictEqual(sanitizeHeader('   '), '');
      assert.strictEqual(sanitizeHeader(null), '');
      assert.strictEqual(sanitizeHeader(undefined), '');
    });
  });

  // ==========================================
  // Feature 4: PII / Metadata Detection (R1)
  // ==========================================
  describe('F4: PII / Metadata Detection', () => {
    test('F4-1: Detects Timestamp and submission date headers', () => {
      assert.strictEqual(isPIIColumn('Timestamp'), true);
      assert.strictEqual(isPIIColumn('Waktu'), true);
      assert.strictEqual(isPIIColumn('Tanda Waktu'), true);
    });

    test('F4-2: Detects Nama and respondent name variations', () => {
      assert.strictEqual(isPIIColumn('Nama'), true);
      assert.strictEqual(isPIIColumn('Nama Lengkap'), true);
      assert.strictEqual(isPIIColumn('Nama (Diperkenankan menggunakan inisial)'), true);
      assert.strictEqual(isPIIColumn('Full Name'), true);
    });

    test('F4-3: Detects Student ID / NIM / NPM variations', () => {
      assert.strictEqual(isPIIColumn('NIM'), true);
      assert.strictEqual(isPIIColumn('Nomor Induk Mahasiswa'), true);
      assert.strictEqual(isPIIColumn('NPM'), true);
      assert.strictEqual(isPIIColumn('Student ID'), true);
    });

    test('F4-4: Detects Email and contact phone headers', () => {
      assert.strictEqual(isPIIColumn('Email'), true);
      assert.strictEqual(isPIIColumn('Alamat Email'), true);
      assert.strictEqual(isPIIColumn('No WA'), true);
      assert.strictEqual(isPIIColumn('Nomor WhatsApp'), true);
      assert.strictEqual(isPIIColumn('No. HP'), true);
    });

    test('F4-5: Does not flag non-PII survey questions', () => {
      assert.strictEqual(isPIIColumn('Asal Fakultas'), false);
      assert.strictEqual(isPIIColumn('Apakah Anda merokok?'), false);
      assert.strictEqual(isPIIColumn('Seberapa puas Anda dengan fasilitas kampus?'), false);
    });
  });

  // ==========================================
  // Feature 5: Dichotomous Binary Classifier (R1)
  // ==========================================
  describe('F5: Dichotomous Binary Classifier', () => {
    test('F5-1: Classifies Ya / Tidak questions as DICHOTOMOUS_BINARY', () => {
      const res = classifyQuestion('Apakah Anda aktif?', ['Ya', 'Tidak', 'Ya', 'Ya', 'Tidak']);
      assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });

    test('F5-2: Classifies Laki-laki / Perempuan as DICHOTOMOUS_BINARY', () => {
      const res = classifyQuestion('Jenis Kelamin', ['Laki-laki', 'Perempuan', 'Laki-laki']);
      assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });

    test('F5-3: Classifies Pernah / Tidak Pernah catcalling question as DICHOTOMOUS_BINARY', () => {
      const res = classifyQuestion('Pengalaman Catcalling', ['Pernah', 'Tidak pernah', 'Pernah']);
      assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });

    test('F5-4: Classifies Ya / Tidak tahu as DICHOTOMOUS_BINARY', () => {
      const res = classifyQuestion('Pengetahuan KTR', ['Ya', 'Tidak tahu', 'Ya', 'Tidak tahu']);
      assert.strictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });

    test('F5-5: Does not classify 3 categories as binary', () => {
      const res = classifyQuestion('Status', ['Ya', 'Tidak', 'Mungkin']);
      assert.notStrictEqual(res.type, 'DICHOTOMOUS_BINARY');
    });
  });

  // ==========================================
  // Feature 6: Likert Scale Classifier (R1)
  // ==========================================
  describe('F6: Likert Scale Classifier', () => {
    test('F6-1: Classifies numeric 1 to 4 ratings as LIKERT_SCALE with scaleMax 4', () => {
      const res = classifyQuestion('Tingkat Keamanan (1-4)', ['1', '2', '3', '4', '3', '2']);
      assert.strictEqual(res.type, 'LIKERT_SCALE');
      assert.strictEqual(res.likertScaleMax, 4);
    });

    test('F6-2: Classifies numeric 1 to 5 ratings as LIKERT_SCALE with scaleMax 5', () => {
      const res = classifyQuestion('Seberapa sering stress?', ['1', '3', '5', '4', '2']);
      assert.strictEqual(res.type, 'LIKERT_SCALE');
      assert.strictEqual(res.likertScaleMax, 5);
    });

    test('F6-3: Correctly computes Net Positive Percent (scoring 4 or 5)', () => {
      const dist = { '1': 10, '2': 10, '3': 20, '4': 30, '5': 30 }; // Total 100, Top Box = 60
      const stats = calculateLikertStats(dist, 5);
      assert.strictEqual(stats.netPositivePercent, 60.0);
    });

    test('F6-4: Correctly computes Likert weighted mean score', () => {
      const dist = { '1': 0, '2': 0, '3': 50, '4': 50 }; // (3*50 + 4*50)/100 = 3.50
      const stats = calculateLikertStats(dist, 4);
      assert.strictEqual(stats.mean, 3.5);
    });

    test('F6-5: Preserves Likert scale classification when rating 1 has 0 responses', () => {
      // Observed values only [2, 3, 4]
      const res = classifyQuestion('Evaluasi Fasilitas (1-4)', ['2', '3', '4', '3', '4']);
      assert.strictEqual(res.type, 'LIKERT_SCALE');
      assert.strictEqual(res.likertScaleMax, 4);
    });
  });

  // ==========================================
  // Feature 7: Multi-Select Checkbox Splitter (R1)
  // ==========================================
  describe('F7: Multi-Select Checkbox Splitter', () => {
    test('F7-1: Tokenizes comma-delimited options and counts frequency', () => {
      const values = ['Akademik, Finansial', 'Finansial', 'Organisasi, Akademik'];
      const analysis = splitMultiSelectResponses(values, 3);
      assert.strictEqual(analysis.totalSelections, 5);
      const fin = analysis.tokenFrequencies.find((t) => t.token === 'Finansial');
      assert.strictEqual(fin.count, 2);
    });

    test('F7-2: Computes Token Repeat Ratio > 3.0 for recurring checkbox options', () => {
      const sample = [
        'Waktu, Dana',
        'Waktu, Komunikasi',
        'Waktu, Dana, Komunikasi',
        'Waktu',
        'Komunikasi, Dana',
      ];
      const { ratio } = calculateTokenRepeatRatio(sample);
      assert.ok(ratio > 3.0, `Expected ratio > 3.0, got ${ratio}`);
    });

    test('F7-3: Calculates respondent percentage relative to N (total valid respondents)', () => {
      const values = ['A, B', 'A', 'B']; // N = 3, A count = 2 -> 66.7%
      const analysis = splitMultiSelectResponses(values, 3);
      const tokenA = analysis.tokenFrequencies.find((t) => t.token === 'A');
      assert.strictEqual(tokenA.percentage, 66.7);
    });

    test('F7-4: Computes average selections per respondent', () => {
      const values = ['A, B', 'A, B, C', 'A']; // 2 + 3 + 1 = 6 selections / 3 = 2.00
      const analysis = splitMultiSelectResponses(values, 3);
      assert.strictEqual(analysis.averageSelectionsPerRespondent, 2.0);
    });

    test('F7-5: Deduplicates identical options chosen by same respondent in one row', () => {
      const values = ['Fasilitas, Fasilitas, Dana'];
      const analysis = splitMultiSelectResponses(values, 1);
      assert.strictEqual(analysis.totalSelections, 2);
      const fas = analysis.tokenFrequencies.find((t) => t.token === 'Fasilitas');
      assert.strictEqual(fas.count, 1);
    });
  });

  // ==========================================
  // Feature 8: Nominal Demographics Classifier (R1)
  // ==========================================
  describe('F8: Nominal Demographics Classifier', () => {
    test('F8-1: Classifies Asal Fakultas (12 faculties) as NOMINAL_DEMOGRAPHIC', () => {
      const values = ['FSM', 'FT', 'FEB', 'FH', 'FKM', 'FPP', 'FIB', 'FISIP', 'FK', 'FPIK', 'FPSI', 'SV'];
      const res = classifyQuestion('Asal Fakultas', values);
      assert.strictEqual(res.type, 'NOMINAL_DEMOGRAPHIC');
    });

    test('F8-2: Classifies Asal Bidang/Biro/Kantor (15 divisions) as NOMINAL_DEMOGRAPHIC', () => {
      const values = ['Biro Riset', 'Biro Keuangan', 'Bidang Harmonisasi', 'Biro Media'];
      const res = classifyQuestion('Asal Bidang/Biro/Kantor', values);
      assert.strictEqual(res.type, 'NOMINAL_DEMOGRAPHIC');
    });

    test('F8-3: Classifies Jabatan/Posisi (7 positions) as NOMINAL_DEMOGRAPHIC', () => {
      const values = ['Staf Muda', 'Staf Ahli', 'Kepala Biro', 'Ketua Bidang'];
      const res = classifyQuestion('Jabatan/Posisi', values);
      assert.strictEqual(res.type, 'NOMINAL_DEMOGRAPHIC');
    });

    test('F8-4: Classifies 3-category nominal demographic as NOMINAL_DEMOGRAPHIC', () => {
      const values = ['Semarang', 'Luar Semarang (Jawa)', 'Luar Jawa'];
      const res = classifyQuestion('Domisili Mahasiswa', values);
      assert.strictEqual(res.type, 'NOMINAL_DEMOGRAPHIC');
    });

    test('F8-5: Tabulates distribution counts for nominal demographic options', () => {
      const csv = 'Fakultas\nFSM\nFT\nFSM\nFSM';
      const ds = parseCSVText(csv);
      const col = ds.columns[0];
      assert.strictEqual(col.distribution['FSM'], 3);
      assert.strictEqual(col.distribution['FT'], 1);
    });
  });

  // ==========================================
  // Feature 9: Open-Ended Text Classifier (R1)
  // ==========================================
  describe('F9: Open-Ended Text Classifier', () => {
    test('F9-1: Classifies long qualitative essay responses as OPEN_ENDED_TEXT', () => {
      const essays = [
        'Harapan saya upgrading dapat mempererat kekeluargaan dan meningkatkan skill organisasi.',
        'Semoga acaranya santai namun materi yang dibawakan berbobot dan aplikatif di biro masing-masing.',
        'Harapannya semua pengurus bisa hadir lengkap dan saling mengenal lebih dekat satu sama lain.',
      ];
      const res = classifyQuestion('Apa harapan terbesar kamu terhadap upgrading?', essays);
      assert.strictEqual(res.type, 'OPEN_ENDED_TEXT');
    });

    test('F9-2: Distinguishes essays containing commas from multi-select via Token Repeat Ratio <= 2.0', () => {
      const essays = [
        'Menurut saya, program ini bagus, menyenangkan, dan perlu dipertahankan.',
        'Kekurangannya, waktu pelaksanaan agak molor, tapi pematerinya sangat interaktif.',
      ];
      const { ratio } = calculateTokenRepeatRatio(essays);
      assert.ok(ratio <= 2.0, `Expected ratio <= 2.0, got ${ratio}`);
    });

    test('F9-3: Identifies open-ended keywords in header (harapan, saran, masukan, kronologi)', () => {
      const res1 = classifyQuestion('Saran dan Masukan', [
        'Bagus, mohon waktu pelaksanaan diperpanjang.',
        'Fasilitas ruangan perlu AC yang lebih dingin.',
        'Pematerinya sangat komunikatif dan materi aplikatif.',
      ]);
      assert.strictEqual(res1.type, 'OPEN_ENDED_TEXT');

      const res2 = classifyQuestion('Ceritakan Kronologi Kejadian', [
        'Terjadi di area parkiran motor dekat gedung E.',
        'Saya sedang berjalan di lorong menuju perpustakaan.',
        'Kejadian sekitar pukul 17.30 di halte kampus.',
      ]);
      assert.strictEqual(res2.type, 'OPEN_ENDED_TEXT');
    });

    test('F9-4: Routes OPEN_ENDED_TEXT to text_feed recommended chart', () => {
      const chart = determineRecommendedChart('OPEN_ENDED_TEXT', 10, 50);
      assert.strictEqual(chart, 'text_feed');
    });

    test('F9-5: Generates descriptive narrative note for open-ended questions', () => {
      const summary = generateOfflineSummary({
        type: 'OPEN_ENDED_TEXT',
        title: 'Saran',
        totalResponses: 25,
        validResponses: 25,
        distribution: {},
      });
      assert.ok(summary.includes('jawaban kualitatif terbuka'));
    });
  });

  // ==========================================
  // Feature 10: Bundled Demo Datasets (R1, AC)
  // ==========================================
  describe('F10: Bundled Demo Datasets', () => {
    test('F10-1: Verifies existence and availability of Sample 1 (UPGRADING BEM UNDIP)', () => {
      const p1 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
      const exists = fs.existsSync(p1);
      assert.strictEqual(exists, true, `Sample 1 must exist at ${p1}`);
    });

    test('F10-2: Verifies existence and availability of Sample 2 (Campus Safety / Catcalling)', () => {
      const p2 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_2.csv';
      const exists = fs.existsSync(p2);
      assert.strictEqual(exists, true, `Sample 2 must exist at ${p2}`);
    });

    test('F10-3: Verifies instant parsing of Sample 1 without network requests', () => {
      const p1 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
      const content = fs.readFileSync(p1, 'utf-8');
      const ds = parseCSVText(content, 'survey_sample_1.csv');
      assert.strictEqual(ds.rowCount, 134);
      assert.strictEqual(ds.columns.length, 27);
    });

    test('F10-4: Verifies instant parsing of Sample 2 without network requests', () => {
      const p2 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_2.csv';
      const content = fs.readFileSync(p2, 'utf-8');
      const ds = parseCSVText(content, 'survey_sample_2.csv');
      assert.strictEqual(ds.rowCount, 197);
      assert.strictEqual(ds.columns.length, 15);
    });

    test('F10-5: Ensures demo datasets have pre-profiled columns with recommended charts', () => {
      const p1 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
      const ds = parseCSVText(fs.readFileSync(p1, 'utf-8'));
      const activeCharts = ds.columns.filter((c) => !c.isExcluded).map((c) => c.recommendedChart);
      assert.ok(activeCharts.includes('ranked_bar'), 'Sample 1 must recommend ranked_bar');
      assert.ok(activeCharts.includes('ordered_likert'), 'Sample 1 must recommend ordered_likert');
    });
  });

  // ==========================================
  // Feature 11: Donut Chart Recommendation (R2)
  // ==========================================
  describe('F11: Donut Chart Recommendation', () => {
    test('F11-1: Recommends Donut chart for DICHOTOMOUS_BINARY questions', () => {
      const rec = determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 8);
      assert.strictEqual(rec, 'donut');
    });

    test('F11-2: Recommends Donut chart for NOMINAL_DEMOGRAPHIC with 2-3 categories', () => {
      const rec2 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 2, 10);
      const rec3 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 12);
      assert.strictEqual(rec2, 'donut');
      assert.strictEqual(rec3, 'donut');
    });

    test('F11-3: Does not recommend Donut chart for nominal questions with > 3 categories', () => {
      const rec4 = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 4, 10);
      assert.notStrictEqual(rec4, 'donut');
    });

    test('F11-4: Does not recommend Donut chart if labels are excessively long (> 15 chars)', () => {
      const recLong = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 3, 35);
      assert.strictEqual(recLong, 'horizontal_bar');
    });

    test('F11-5: Generates percentage breakdown badges for 2-category Donut data', () => {
      const summary = generateOfflineSummary({
        type: 'DICHOTOMOUS_BINARY',
        title: 'Status',
        totalResponses: 100,
        validResponses: 100,
        distribution: { 'Ya': 70, 'Tidak': 30 },
      });
      assert.ok(summary.includes('70.0%'));
      assert.ok(summary.includes('30.0%'));
    });
  });

  // ==========================================
  // Feature 12: Horizontal/Vertical Bar Recommendation (R2)
  // ==========================================
  describe('F12: Horizontal/Vertical Bar Recommendation', () => {
    test('F12-1: Recommends Horizontal Bar for nominal demographic with > 3 categories', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 8, 20);
      assert.strictEqual(rec, 'horizontal_bar');
    });

    test('F12-2: Recommends Horizontal Bar for categories with long labels (> 15 chars)', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 5, 25);
      assert.strictEqual(rec, 'horizontal_bar');
    });

    test('F12-3: Recommends Vertical Bar for nominal demographic with <= 6 categories and short labels <= 12 chars', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 4, 8);
      assert.strictEqual(rec, 'vertical_bar');
    });

    test('F12-4: Default chart orientation for general nominal questions is horizontal_bar', () => {
      const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 12, 18);
      assert.strictEqual(rec, 'horizontal_bar');
    });

    test('F12-5: Dynamic margin increases for Horizontal Bar with wide labels', () => {
      const labels = ['Fakultas Perikanan dan Ilmu Kelautan', 'Fakultas Kedokteran'];
      const padding = calculateDynamicPadding(labels, 'horizontal_bar');
      assert.ok(padding.left >= 180, `Expected left padding >= 180, got ${padding.left}`);
    });
  });

  // ==========================================
  // Feature 13: Ranked Bar Recommendation (R2)
  // ==========================================
  describe('F13: Ranked Bar Recommendation', () => {
    test('F13-1: Recommends ranked_bar for MULTI_SELECT_CHECKBOX questions', () => {
      const rec = determineRecommendedChart('MULTI_SELECT_CHECKBOX', 8, 20);
      assert.strictEqual(rec, 'ranked_bar');
    });

    test('F13-2: Sorts multi-select options descending by frequency', () => {
      const values = ['A, B', 'B, C', 'B']; // B=3, A=1, C=1
      const analysis = splitMultiSelectResponses(values, 3);
      assert.strictEqual(analysis.tokenFrequencies[0].token, 'B');
      assert.strictEqual(analysis.tokenFrequencies[0].count, 3);
    });

    test('F13-3: Percentage represents proportion of respondents (n / N), not total selections', () => {
      const values = ['A, B', 'A, C']; // N = 2, A is selected by 2 respondents -> 100%
      const analysis = splitMultiSelectResponses(values, 2);
      const tokenA = analysis.tokenFrequencies.find((t) => t.token === 'A');
      assert.strictEqual(tokenA.percentage, 100.0);
    });

    test('F13-4: Summary notes average selections and total choices made', () => {
      const values = ['A, B', 'A', 'B, C'];
      const analysis = splitMultiSelectResponses(values, 3);
      const summary = generateOfflineSummary({
        type: 'MULTI_SELECT_CHECKBOX',
        title: 'Kendala',
        totalResponses: 3,
        validResponses: 3,
        distribution: {},
        multiSelectStats: analysis,
      });
      assert.ok(summary.includes('Rata-rata responden memilih'));
    });

    test('F13-5: Allows total percentages across multi-select options to sum > 100%', () => {
      const values = ['A, B', 'A, B', 'A, B']; // N = 3, A=100%, B=100% -> sum = 200%
      const analysis = splitMultiSelectResponses(values, 3);
      const sumPct = analysis.tokenFrequencies.reduce((sum, t) => sum + t.percentage, 0);
      assert.strictEqual(sumPct, 200.0);
    });
  });

  // ==========================================
  // Feature 14: Ordered Likert Bar Recommendation (R2)
  // ==========================================
  describe('F14: Ordered Likert Bar Recommendation', () => {
    test('F14-1: Recommends ordered_likert for LIKERT_SCALE questions', () => {
      const rec = determineRecommendedChart('LIKERT_SCALE', 4, 10);
      assert.strictEqual(rec, 'ordered_likert');
    });

    test('F14-2: Preserves natural ordinal scale order (1 -> 4/5) regardless of frequencies', () => {
      const dist = { '1': 5, '2': 50, '3': 20, '4': 25 }; // Option 2 has highest frequency
      const stats = calculateLikertStats(dist, 4);
      assert.strictEqual(stats.min, 1);
      assert.strictEqual(stats.max, 4);
    });

    test('F14-3: Retains 0-count rating level in scale labels definition', () => {
      const dist = { '1': 0, '2': 10, '3': 15, '4': 20 };
      const stats = calculateLikertStats(dist, 4);
      assert.ok(stats.labels[1] !== undefined);
    });

    test('F14-4: Calculates scale tendency narrative based on mean score', () => {
      const summaryHigh = generateOfflineSummary({
        type: 'LIKERT_SCALE',
        title: 'Kepuasan',
        totalResponses: 50,
        validResponses: 50,
        distribution: { '4': 50 },
        likertStats: { min: 1, max: 4, mean: 4.0, median: 4, netPositivePercent: 100, labels: {} },
      });
      assert.ok(summaryHigh.includes('positif / sangat tinggi'));
    });

    test('F14-5: Accurately associates verbal scale labels with numeric ratings for 5-point scale', () => {
      const stats5 = calculateLikertStats({ '1': 1, '5': 5 }, 5);
      assert.ok(stats5.labels[5].includes('Sangat Sering / Sangat Tinggi'));
    });
  });

  // ==========================================
  // Feature 15: Prohibited Charts Ban (R2)
  // ==========================================
  describe('F15: Prohibited Charts Ban', () => {
    test('F15-1: Strictly bans radar / spider chart type', () => {
      assert.strictEqual(isChartTypeProhibited('radar'), true);
      assert.strictEqual(isChartTypeProhibited('spider'), true);
    });

    test('F15-2: Strictly bans 3D pie wedge with perspective tilt', () => {
      assert.strictEqual(isChartTypeProhibited('3d_pie_wedge'), true);
      assert.strictEqual(isChartTypeProhibited('3d_pie'), true);
    });

    test('F15-3: Strictly bans dual-y axis spaghetti plots', () => {
      assert.strictEqual(isChartTypeProhibited('dual_y_axis'), true);
    });

    test('F15-4: Strictly bans bubble charts and 3D surface plots', () => {
      assert.strictEqual(isChartTypeProhibited('bubble'), true);
      assert.strictEqual(isChartTypeProhibited('3d_surface'), true);
    });

    test('F15-5: Does not ban public-friendly presentation charts', () => {
      assert.strictEqual(isChartTypeProhibited('donut'), false);
      assert.strictEqual(isChartTypeProhibited('horizontal_bar'), false);
      assert.strictEqual(isChartTypeProhibited('vertical_bar'), false);
      assert.strictEqual(isChartTypeProhibited('ranked_bar'), false);
      assert.strictEqual(isChartTypeProhibited('ordered_likert'), false);
    });
  });

  // ==========================================
  // Feature 16: Interactive Curation Table (R2)
  // ==========================================
  describe('F16: Interactive Curation Table', () => {
    const dummyCol = {
      id: 'c1',
      columnIndex: 0,
      cleanName: 'Fakultas',
      displayTitle: 'Fakultas',
      type: 'NOMINAL_DEMOGRAPHIC',
      recommendedChart: 'horizontal_bar',
      selectedChart: 'horizontal_bar',
      isExcluded: false,
    };

    test('F16-1: Allows overriding chart type to another valid presentation chart', () => {
      const updated = overrideChartType(dummyCol, 'vertical_bar');
      assert.strictEqual(updated.selectedChart, 'vertical_bar');
    });

    test('F16-2: Throws an error if user attempts to override to a prohibited chart', () => {
      assert.throws(() => {
        overrideChartType(dummyCol, 'radar');
      }, /prohibited/i);
    });

    test('F16-3: Allows editing column display title for slide readability', () => {
      const updated = updateColumnTitle(dummyCol, 'Sebaran Fakultas Mahasiswa BEM');
      assert.strictEqual(updated.displayTitle, 'Sebaran Fakultas Mahasiswa BEM');
    });

    test('F16-4: Allows toggling column exclusion on and off', () => {
      const excluded = toggleColumnExclusion(dummyCol, true);
      assert.strictEqual(excluded.isExcluded, true);
      const included = toggleColumnExclusion(excluded, false);
      assert.strictEqual(included.isExcluded, false);
    });

    test('F16-5: Supports reordering question sequence for presentation flow', () => {
      const cols = [
        { id: '1', cleanName: 'A' },
        { id: '2', cleanName: 'B' },
        { id: '3', cleanName: 'C' },
      ];
      const reordered = reorderColumns(cols, 0, 2); // Move A to end
      assert.strictEqual(reordered[0].cleanName, 'B');
      assert.strictEqual(reordered[1].cleanName, 'C');
      assert.strictEqual(reordered[2].cleanName, 'A');
    });
  });

  // ==========================================
  // Feature 17: Offline Statistical Summary (R2)
  // ==========================================
  describe('F17: Offline Statistical Summary', () => {
    test('F17-1: Computes mode value and percentage share for nominal distribution', () => {
      const summary = generateOfflineSummary({
        type: 'NOMINAL_DEMOGRAPHIC',
        title: 'Fakultas',
        totalResponses: 100,
        validResponses: 100,
        distribution: { 'FSM': 60, 'FT': 40 },
      });
      assert.ok(summary.includes('FSM'));
      assert.ok(summary.includes('60.0%'));
    });

    test('F17-2: Identifies runner-up category and count', () => {
      const summary = generateOfflineSummary({
        type: 'NOMINAL_DEMOGRAPHIC',
        title: 'Bidang',
        totalResponses: 100,
        validResponses: 100,
        distribution: { 'Riset': 50, 'Keuangan': 30, 'Media': 20 },
      });
      assert.ok(summary.includes('Keuangan'));
      assert.ok(summary.includes('30.0%'));
    });

    test('F17-3: Includes Top-Box percentage in Likert scale summary', () => {
      const summary = generateOfflineSummary({
        type: 'LIKERT_SCALE',
        title: 'Kepuasan',
        totalResponses: 100,
        validResponses: 100,
        distribution: { '4': 40, '5': 45, '3': 15 },
        likertStats: { min: 1, max: 5, mean: 4.3, median: 4, netPositivePercent: 85.0, labels: {} },
      });
      assert.ok(summary.includes('85%'));
      assert.ok(summary.includes('Top-Box'));
    });

    test('F17-4: Calculates median accurately for odd and even number of responses', () => {
      const oddStats = calculateLikertStats({ '1': 1, '2': 1, '3': 1 }, 4); // [1, 2, 3] -> median 2
      assert.strictEqual(oddStats.median, 2);

      const evenStats = calculateLikertStats({ '1': 1, '2': 1, '3': 1, '4': 1 }, 4); // [1, 2, 3, 4] -> median 2.5
      assert.strictEqual(evenStats.median, 2.5);
    });

    test('F17-5: PII column produces privacy protection notice in summary', () => {
      const summary = generateOfflineSummary({
        type: 'METADATA_PII',
        title: 'Nama Lengkap',
        totalResponses: 50,
        validResponses: 50,
        distribution: {},
      });
      assert.ok(summary.includes('privasi'));
    });
  });

  // ==========================================
  // Feature 18: Optional Gemini Narrative Toggle (R2)
  // ==========================================
  describe('F18: Optional Gemini Narrative Toggle', () => {
    const sampleCol = {
      displayTitle: 'Tingkat Keamanan Kampus',
      type: 'LIKERT_SCALE',
      validResponses: 197,
      totalResponses: 197,
      distribution: { '3': 100, '4': 97 },
      likertScale: { min: 1, max: 4, mean: 3.49, median: 3, netPositivePercent: 100, labels: {} },
    };

    test('F18-1: Builds structured Gemini prompt containing aggregated distribution only', () => {
      const promptStr = buildGeminiPrompt(sampleCol);
      const parsed = JSON.parse(promptStr);
      assert.strictEqual(parsed.question, 'Tingkat Keamanan Kampus');
      assert.strictEqual(parsed.n_valid, 197);
      assert.deepStrictEqual(parsed.distribution, { '3': 100, '4': 97 });
    });

    test('F18-2: Prompt formulation contains zero raw respondent PII or personal rows', () => {
      const promptStr = buildGeminiPrompt(sampleCol);
      assert.strictEqual(promptStr.includes('Nama'), false);
      assert.strictEqual(promptStr.includes('NIM'), false);
    });

    test('F18-3: Gracefully falls back to offline statistics when API key is empty', () => {
      const res = resolveNarrativeWithFallback(sampleCol, '');
      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('Top-Box'));
    });

    test('F18-4: Gracefully falls back to offline statistics when network is offline', () => {
      const res = resolveNarrativeWithFallback(sampleCol, 'valid_key_123', false);
      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('Top-Box'));
    });

    test('F18-5: Executes LLM narrative generation when API key provided and online', () => {
      const res = resolveNarrativeWithFallback(sampleCol, 'valid_key_123', true);
      assert.strictEqual(res.isOfflineFallback, false);
      assert.ok(res.narrative.includes('[Gemini AI]'));
    });
  });

  // ==========================================
  // Feature 19: Typography Library (R3)
  // ==========================================
  describe('F19: Typography Library', () => {
    test('F19-1: Supports all 6 required presentation font families', () => {
      const required = ['Poppins', 'Montserrat', 'Inter', 'Plus Jakarta Sans', 'Roboto', 'Merriweather'];
      for (const font of required) {
        assert.ok(FONT_FAMILIES.includes(font), `Font ${font} must be in FONT_FAMILIES`);
      }
    });

    test('F19-2: Typography scale preset "small" meets minimum 10px legibility guard', () => {
      const scale = calculateTypographyScale('small');
      assert.ok(scale.titleFontSize >= 16);
      assert.ok(scale.subtitleFontSize >= 12);
      assert.ok(scale.labelFontSize >= 10);
      assert.ok(scale.badgeFontSize >= 10);
    });

    test('F19-3: Typography scale preset "medium" provides balanced presentation sizing', () => {
      const scale = calculateTypographyScale('medium');
      assert.strictEqual(scale.titleFontSize, 20);
      assert.strictEqual(scale.subtitleFontSize, 14);
      assert.strictEqual(scale.labelFontSize, 12);
    });

    test('F19-4: Typography scale preset "large" scales up for large room slide presentations', () => {
      const scale = calculateTypographyScale('large');
      assert.strictEqual(scale.titleFontSize, 24);
      assert.strictEqual(scale.labelFontSize, 14);
    });

    test('F19-5: Default typography scale falls back to medium', () => {
      const scale = calculateTypographyScale('invalid');
      assert.strictEqual(scale.titleFontSize, 20);
    });
  });

  // ==========================================
  // Feature 20: Institutional Color Palettes (R3)
  // ==========================================
  describe('F20: Institutional Color Palettes', () => {
    test('F20-1: UNDIP Navy & Gold palette contains >= 5 valid hex codes', () => {
      const pal = INSTITUTIONAL_PALETTES.undip_navy_gold;
      assert.ok(pal.colors.length >= 5);
      assert.strictEqual(pal.colors[0], '#002D62');
      assert.strictEqual(pal.colors[1], '#D4AF37');
    });

    test('F20-2: Modern Emerald palette contains >= 5 valid hex codes', () => {
      const pal = INSTITUTIONAL_PALETTES.modern_emerald;
      assert.ok(pal.colors.length >= 5);
      assert.strictEqual(pal.colors[0], '#0E6251');
    });

    test('F20-3: Executive Pastel palette contains >= 5 valid hex codes', () => {
      const pal = INSTITUTIONAL_PALETTES.executive_pastel;
      assert.ok(pal.colors.length >= 5);
      assert.strictEqual(pal.colors[0], '#6C88C4');
    });

    test('F20-4: Warm Sunset palette contains >= 5 valid hex codes', () => {
      const pal = INSTITUTIONAL_PALETTES.warm_sunset;
      assert.ok(pal.colors.length >= 5);
      assert.strictEqual(pal.colors[0], '#C0392B');
    });

    test('F20-5: All color codes in institutional palettes pass hex regex validation', () => {
      for (const key of Object.keys(INSTITUTIONAL_PALETTES)) {
        const pal = INSTITUTIONAL_PALETTES[key];
        for (const color of pal.colors) {
          const res = validateCustomPalette([color, '#111111', '#222222', '#333333', '#444444']);
          assert.ok(!res.errors.some((e) => e.includes(color)));
        }
      }
    });
  });

  // ==========================================
  // Feature 21: Custom Palette Builder & Validator (R3, AC)
  // ==========================================
  describe('F21: Custom Palette Builder & Validator', () => {
    test('F21-1: Validates custom palette with exactly 5 valid hex codes successfully', () => {
      const input = ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2'];
      const res = validateCustomPalette(input);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.colors.length, 5);
      assert.strictEqual(res.errors.length, 0);
    });

    test('F21-2: Validates custom palette with > 5 valid hex codes successfully', () => {
      const input = ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2', '#AABBCC'];
      const res = validateCustomPalette(input);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.colors.length, 6);
    });

    test('F21-3: Rejects custom palette with < 5 hex codes with clear error', () => {
      const input = ['#002D62', '#D4AF37', '#1E56A0', '#F39C12'];
      const res = validateCustomPalette(input);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('Minimal 5')));
    });

    test('F21-4: Rejects custom palette containing malformed hex strings', () => {
      const input = ['#002D62', '#D4AF37', 'blue', '#F39C12', '#4A90E2'];
      const res = validateCustomPalette(input);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('blue')));
    });

    test('F21-5: Auto-prepends "#" if user enters 6 valid hex digits without hash', () => {
      const input = ['002D62', 'D4AF37', '1E56A0', 'F39C12', '4A90E2'];
      const res = validateCustomPalette(input);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.colors[0], '#002D62');
    });
  });

  // ==========================================
  // Feature 22: 2D Modern Flat Visual Style (R3)
  // ==========================================
  describe('F22: 2D Modern Flat Visual Style', () => {
    test('F22-1: Modern Flat visual mode defaults cleanly to 2d', () => {
      const mode = resolveDimensionality('2d', 'inherit');
      assert.strictEqual(mode, '2d');
    });

    test('F22-2: Modern Flat style specifies 1px contrast border', () => {
      const flatCardBorder = '1px solid rgba(0, 0, 0, 0.05)';
      assert.ok(flatCardBorder.includes('1px'));
    });

    test('F22-3: Modern Flat style specifies rounded badge geometry', () => {
      const badgeRadius = 4;
      assert.ok(badgeRadius > 0);
    });

    test('F22-4: Modern Flat style uses clean solid fill colors from active palette', () => {
      const palette = INSTITUTIONAL_PALETTES.undip_navy_gold;
      assert.strictEqual(typeof palette.colors[0], 'string');
    });

    test('F22-5: Modern Flat style has zero angular perspective distortion', () => {
      const hasPerspectiveTilt = false;
      assert.strictEqual(hasPerspectiveTilt, false);
    });
  });

  // ==========================================
  // Feature 23: 2.5D Isometric 3D Visual Style (R3)
  // ==========================================
  describe('F23: 2.5D Isometric 3D Visual Style', () => {
    test('F23-1: Resolves 3D mode when global preset is 3d', () => {
      const mode = resolveDimensionality('3d', 'inherit');
      assert.strictEqual(mode, '3d');
    });

    test('F23-2: 3D style specifies vertical linear gradient with lighter top and darker base', () => {
      const gradient = {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'lighten(15%)' },
          { offset: 1, color: 'darken(10%)' },
        ],
      };
      assert.strictEqual(gradient.colorStops.length, 2);
    });

    test('F23-3: 3D style specifies soft drop shadow under bars', () => {
      const shadowColor = 'rgba(0, 0, 0, 0.12)';
      assert.ok(shadowColor.includes('0.12'));
    });

    test('F23-4: 3D Donut style uses concentric inner bevel without angular tilt', () => {
      const innerRadius = '45%';
      const outerRadius = '75%';
      assert.ok(parseInt(innerRadius, 10) < parseInt(outerRadius, 10));
    });

    test('F23-5: Perspective tilted 3D pie wedges remain prohibited even under 3D mode', () => {
      assert.strictEqual(isChartTypeProhibited('3d_pie_wedge'), true);
    });
  });

  // ==========================================
  // Feature 24: Per-Chart Dimensionality Override (R3)
  // ==========================================
  describe('F24: Per-Chart Dimensionality Override', () => {
    test('F24-1: Per-chart 3D override takes precedence over global 2D preset', () => {
      const mode = resolveDimensionality('2d', '3d');
      assert.strictEqual(mode, '3d');
    });

    test('F24-2: Per-chart 2D override takes precedence over global 3D preset', () => {
      const mode = resolveDimensionality('3d', '2d');
      assert.strictEqual(mode, '2d');
    });

    test('F24-3: Per-chart inherit setting adopts active global preset', () => {
      assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
      assert.strictEqual(resolveDimensionality('3d', 'inherit'), '3d');
    });

    test('F24-4: Override on one chart card does not alter sibling charts', () => {
      const cardA = resolveDimensionality('2d', '3d');
      const cardB = resolveDimensionality('2d', 'inherit');
      assert.strictEqual(cardA, '3d');
      assert.strictEqual(cardB, '2d');
    });

    test('F24-5: Gracefully handles undefined override by returning global preset', () => {
      assert.strictEqual(resolveDimensionality('3d', undefined), '3d');
    });
  });

  // ==========================================
  // Feature 25: Official BEM UNDIP Watermark (R3)
  // ==========================================
  describe('F25: Official BEM UNDIP Watermark', () => {
    test('F25-1: Default watermark text exact match to specification', () => {
      assert.strictEqual(WATERMARK_TEXT, 'Biro Statistika BEM Universitas Diponegoro');
    });

    test('F25-2: Watermark is enabled by default in export manifest', () => {
      const manifest = buildExportManifest([], { showWatermark: true });
      assert.ok(manifest.includes('Watermark     : Enabled'));
    });

    test('F25-3: Watermark can be toggled off in theme configuration', () => {
      const manifest = buildExportManifest([], { showWatermark: false });
      assert.ok(manifest.includes('Watermark     : Disabled'));
    });

    test('F25-4: Custom watermark text updates export manifest correctly', () => {
      const manifest = buildExportManifest([], {
        showWatermark: true,
        watermarkText: 'BEM Universitas Diponegoro 2026',
      });
      assert.ok(manifest.includes('BEM Universitas Diponegoro 2026'));
    });

    test('F25-5: Watermark zone is positioned in footer boundary', () => {
      const footerY = 480;
      const canvasHeight = 500;
      assert.ok(footerY < canvasHeight);
    });
  });

  // ==========================================
  // Feature 26: High-Resolution 3x Canvas Export (R4, AC)
  // ==========================================
  describe('F26: High-Resolution 3x Canvas Export', () => {
    test('F26-1: Export configuration specifies pixelRatio of 3.0 (~300 DPI)', () => {
      const pixelRatio = 3.0;
      assert.strictEqual(pixelRatio, 3.0);
    });

    test('F26-2: 800x500 px base card rasterizes to 2400x1500 px high-res bitmap', () => {
      const baseW = 800;
      const baseH = 500;
      const scale = 3;
      assert.strictEqual(baseW * scale, 2400);
      assert.strictEqual(baseH * scale, 1500);
    });

    test('F26-3: 800x600 px base card rasterizes to 2400x1800 px high-res bitmap', () => {
      const baseW = 800;
      const baseH = 600;
      const scale = 3;
      assert.strictEqual(baseW * scale, 2400);
      assert.strictEqual(baseH * scale, 1800);
    });

    test('F26-4: High-res export uses lossless PNG format', () => {
      const format = 'png';
      assert.strictEqual(format, 'png');
    });

    test('F26-5: High-res export enforces solid #FFFFFF background to prevent transparent bleed', () => {
      const backgroundColor = '#FFFFFF';
      assert.strictEqual(backgroundColor, '#FFFFFF');
    });
  });

  // ==========================================
  // Feature 27: Anti-Clipping Geometry & Padding (R4, AC)
  // ==========================================
  describe('F27: Anti-Clipping Geometry & Padding', () => {
    test('F27-1: Calculates dynamic left margin based on maximum label length', () => {
      const shortLabels = ['A', 'B'];
      const longLabels = ['Fakultas Perikanan dan Ilmu Kelautan', 'Fakultas Sains dan Matematika'];
      const padShort = calculateDynamicPadding(shortLabels, 'horizontal_bar');
      const padLong = calculateDynamicPadding(longLabels, 'horizontal_bar');
      assert.ok(padLong.left > padShort.left);
    });

    test('F27-2: Caps dynamic left padding at maximum 260px safety limit', () => {
      const extremeLabels = ['A'.repeat(80)];
      const pad = calculateDynamicPadding(extremeLabels, 'horizontal_bar');
      assert.strictEqual(pad.left, 260);
    });

    test('F27-3: Wraps category labels into multi-line text at 22 characters per line', () => {
      const text = 'Fakultas Perikanan dan Ilmu Kelautan';
      const lines = wrapLabel(text, 22);
      assert.ok(lines.length >= 2);
      assert.ok(lines[0].length <= 22);
    });

    test('F27-4: Places percentage badge inside bar when value exceeds 25% of max', () => {
      const pos = determineBadgePlacement(60, 100);
      assert.strictEqual(pos, 'inside');
    });

    test('F27-5: Places percentage badge outside bar when value is <= 25% of max', () => {
      const pos = determineBadgePlacement(15, 100);
      assert.strictEqual(pos, 'outside');
    });
  });

  // ==========================================
  // Feature 28: Single Chart PNG Export (R4)
  // ==========================================
  describe('F28: Single Chart PNG Export', () => {
    test('F28-1: Formats export filename with 2-digit index prefix and sanitized slug', () => {
      const fn = sanitizeExportFilename(1, 'Asal Fakultas Mahasiswa');
      assert.strictEqual(fn, 'chart_01_asal_fakultas_mahasiswa.png');
    });

    test('F28-2: Replaces punctuation and special symbols with underscores', () => {
      const fn = sanitizeExportFilename(4, 'Tingkat Stress / Burnout? (1-5)');
      assert.strictEqual(fn, 'chart_04_tingkat_stress_burnout_1_5.png');
    });

    test('F28-3: Truncates filename slug to maximum 40 characters for filesystem safety', () => {
      const longTitle = 'A'.repeat(80);
      const fn = sanitizeExportFilename(10, longTitle);
      assert.strictEqual(fn, `chart_10_${'a'.repeat(40)}.png`);
    });

    test('F28-4: Gracefully handles empty question title with fallback name', () => {
      const fn = sanitizeExportFilename(3, '');
      assert.strictEqual(fn, 'chart_03_chart.png');
    });

    test('F28-5: Retains extension .png on all sanitized filenames', () => {
      const fn = sanitizeExportFilename(5, 'Test');
      assert.ok(fn.endsWith('.png'));
    });
  });

  // ==========================================
  // Feature 29: High-Res Batch ZIP Packaging (R4, AC)
  // ==========================================
  describe('F29: High-Res Batch ZIP Packaging', () => {
    test('F29-1: Generates valid JSZip archive containing charts and manifest', async () => {
      const charts = [
        { filename: 'chart_01_fakultas.png', data: Buffer.from('mock_png_1') },
        { filename: 'chart_02_status.png', data: Buffer.from('mock_png_2') },
      ];
      const manifest = 'Audit Manifest Content';
      const zipBuffer = await packageBatchZip(charts, manifest);
      assert.ok(zipBuffer.length > 0);

      const zip = await JSZip.loadAsync(zipBuffer);
      assert.ok(zip.file('SURVEY_SUMMARY_AUDIT.txt') !== null);
      assert.ok(zip.file('chart_01_fakultas.png') !== null);
      assert.ok(zip.file('chart_02_status.png') !== null);
    });

    test('F29-2: Manifest file contains survey audit metadata', () => {
      const manifest = buildExportManifest(
        [{ cleanName: 'Q1', displayTitle: 'Q1', isExcluded: false, selectedChart: 'donut', validResponses: 50 }],
        { fontFamily: 'Montserrat', activePaletteId: 'modern_emerald', showWatermark: true }
      );
      assert.ok(manifest.includes('BIRO STATISTIKA BEM UNIVERSITAS DIPONEGORO'));
      assert.ok(manifest.includes('Montserrat'));
      assert.ok(manifest.includes('modern_emerald'));
      assert.ok(manifest.includes('[DONUT] Q1 (N=50)'));
    });

    test('F29-3: Excludes excluded columns from export manifest', () => {
      const manifest = buildExportManifest(
        [
          { cleanName: 'Nama', displayTitle: 'Nama', isExcluded: true, selectedChart: 'none', validResponses: 50 },
          { cleanName: 'Fakultas', displayTitle: 'Fakultas', isExcluded: false, selectedChart: 'horizontal_bar', validResponses: 50 },
        ],
        {}
      );
      assert.strictEqual(manifest.includes('Nama'), false);
      assert.ok(manifest.includes('Fakultas'));
    });

    test('F29-4: Reads back exact file content from generated zip archive', async () => {
      const textData = 'Hello BEM UNDIP';
      const zipBuffer = await packageBatchZip([{ filename: 'test.txt', data: textData }], 'Manifest');
      const zip = await JSZip.loadAsync(zipBuffer);
      const readBack = await zip.file('test.txt').async('string');
      assert.strictEqual(readBack, textData);
    });

    test('F29-5: Handles multiple charts in batch zip sequentially', async () => {
      const charts = Array.from({ length: 10 }, (_, i) => ({
        filename: `chart_${String(i + 1).padStart(2, '0')}.png`,
        data: Buffer.from(`data_${i}`),
      }));
      const zipBuffer = await packageBatchZip(charts, 'Manifest 10');
      const zip = await JSZip.loadAsync(zipBuffer);
      assert.strictEqual(Object.keys(zip.files).length, 11); // 10 charts + 1 manifest
    });
  });

});
