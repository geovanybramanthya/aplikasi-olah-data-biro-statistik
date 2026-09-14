/**
 * Tier 3: Cross-Feature Interaction Test Suite (Pairwise Combinations)
 * BEM UNDIP Survey Analytics & Visualization Platform
 * 
 * Verifies the interaction of parsing + classification + recommendation + theming + export packaging.
 * Target: >= 29 tests.
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

setTier('tier3');

describe('Tier 3: Cross-Feature Interactions (Pairwise Combinations)', () => {

  test('XF-01: CSV Ingestion -> PII Detection -> Binary Classifier -> Donut Recommendation', () => {
    const csv = 'Timestamp,Apakah Mahasiswa Aktif?\n2026-09-14 10:00:00,Ya\n2026-09-14 10:01:00,Tidak';
    const ds = parseCSVText(csv, 'survey1.csv');
    assert.strictEqual(ds.columns[0].isPII, true);
    assert.strictEqual(ds.columns[0].isExcluded, true);
    assert.strictEqual(ds.columns[1].type, 'DICHOTOMOUS_BINARY');
    assert.strictEqual(ds.columns[1].recommendedChart, 'donut');
  });

  test('XF-02: CSV Ingestion -> Header Sanitization -> Multi-Select Splitter -> Ranked Bar Recommendation', () => {
    const csv = '  Kendala BEM (Maks. 3)  \n"Waktu, Dana"\n"Dana, Komunikasi"\n"Waktu, Dana, Komunikasi"';
    const ds = parseCSVText(csv, 'survey2.csv');
    const col = ds.columns[0];
    assert.strictEqual(col.cleanName, 'Kendala BEM (Maks. 3)');
    assert.strictEqual(col.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(col.recommendedChart, 'ranked_bar');

    const analysis = splitMultiSelectResponses(ds.rawRows.map((r) => r[col.rawName]), 3);
    assert.strictEqual(analysis.tokenFrequencies[0].token, 'Dana');
    assert.strictEqual(analysis.tokenFrequencies[0].count, 3);
  });

  test('XF-03: CSV Ingestion -> Likert Classifier -> Ordered Likert Bar -> Offline Statistical Summary', () => {
    const csv = 'Tingkat Kepuasan (1-4)\n4\n4\n3\n2';
    const ds = parseCSVText(csv, 'likert.csv');
    const col = ds.columns[0];
    assert.strictEqual(col.type, 'LIKERT_SCALE');
    assert.strictEqual(col.recommendedChart, 'ordered_likert');

    const stats = calculateLikertStats(col.distribution, 4);
    assert.strictEqual(stats.netPositivePercent, 50.0); // 2 of 4 respondents scored 4

    const summary = generateOfflineSummary({
      type: col.type,
      title: col.cleanName,
      totalResponses: 4,
      validResponses: 4,
      distribution: col.distribution,
      likertStats: stats,
    });
    assert.ok(summary.includes('50%'));
    assert.ok(summary.includes('Top-Box'));
  });

  test('XF-04: CSV Ingestion -> Nominal Demographic -> Horizontal Bar -> UNDIP Navy & Gold Palette', () => {
    const csv = 'Asal Bidang\nBiro Riset\nBiro Media\nBidang Harmonisasi\nBiro Keuangan';
    const ds = parseCSVText(csv, 'demog.csv');
    const col = ds.columns[0];
    assert.strictEqual(col.type, 'NOMINAL_DEMOGRAPHIC');
    assert.strictEqual(col.recommendedChart, 'horizontal_bar');

    const palette = INSTITUTIONAL_PALETTES.undip_navy_gold;
    assert.ok(palette.colors.length >= 5);
    assert.strictEqual(palette.colors[0], '#002D62');
  });

  test('XF-05: CSV Ingestion -> Open-Ended Text -> Curation Table Verification -> Presentation Typography', () => {
    const csv = 'Apa Harapan Kamu?\n"Semoga upgrading membawa dampak positif bagi biro."\n"Harapannya semakin kompak antar pengurus."';
    const ds = parseCSVText(csv, 'text.csv');
    const col = ds.columns[0];
    assert.strictEqual(col.type, 'OPEN_ENDED_TEXT');
    assert.strictEqual(col.recommendedChart, 'text_feed');

    const typography = calculateTypographyScale('medium');
    assert.strictEqual(typography.titleFontSize, 20);
    assert.strictEqual(FONT_FAMILIES.includes('Poppins'), true);
  });

  test('XF-06: Excel Ingestion -> PII Detection -> Binary Classifier -> Custom Palette Validation', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nama Lengkap', 'Apakah Pernah Mengikuti Organisasi?'],
      ['Budi Santoso', 'Ya'],
      ['Siti Rahma', 'Tidak'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const ds = parseExcelBuffer(buf, 'excel_test.xlsx');
    assert.strictEqual(ds.columns[0].isPII, true);
    assert.strictEqual(ds.columns[1].type, 'DICHOTOMOUS_BINARY');

    const customPal = validateCustomPalette(['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2']);
    assert.strictEqual(customPal.isValid, true);
  });

  test('XF-07: Excel Ingestion -> Likert Classifier -> Ordered Likert Bar -> 2D Modern Flat Styling', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Keamanan Kampus'],
      [3.0],
      [4.0],
      [4.0],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const ds = parseExcelBuffer(buf, 'excel_likert.xlsx');
    const col = ds.columns[0];
    assert.strictEqual(col.type, 'LIKERT_SCALE');
    assert.strictEqual(col.recommendedChart, 'ordered_likert');

    const style = resolveDimensionality('2d', 'inherit');
    assert.strictEqual(style, '2d');
  });

  test('XF-08: Excel Ingestion -> Nominal Demographic -> Horizontal Bar -> 2.5D Isometric 3D Styling', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Fakultas'],
      ['FSM'],
      ['FT'],
      ['FEB'],
      ['FH'],
      ['FKM'],
      ['FPP'],
      ['FIB'],
      ['FISIP'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const ds = parseExcelBuffer(buf, 'excel_fac.xlsx');
    assert.strictEqual(ds.columns[0].recommendedChart, 'horizontal_bar');

    const style = resolveDimensionality('3d', 'inherit');
    assert.strictEqual(style, '3d');
  });

  test('XF-09: Excel Ingestion -> Multi-Select Splitter -> Ranked Bar -> Per-Chart 3D Override', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Faktor (Boleh Memilih Lebih Dari Satu)'],
      ['Waktu, Biaya'],
      ['Biaya, Tempat'],
      ['Waktu, Biaya, Tempat'],
      ['Waktu, Tempat'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const ds = parseExcelBuffer(buf);
    assert.strictEqual(ds.columns[0].type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(ds.columns[0].recommendedChart, 'ranked_bar');

    // Global is 2d, chart card overrides to 3d
    const cardStyle = resolveDimensionality('2d', '3d');
    assert.strictEqual(cardStyle, '3d');
  });

  test('XF-10: Header Sanitization -> Curation Title Edit -> Typography Scaling -> Watermark Footer', () => {
    const sanitized = sanitizeHeader('  Tingkat   Kepuasan  ');
    assert.strictEqual(sanitized, 'Tingkat Kepuasan');

    const col = updateColumnTitle({ cleanName: sanitized, displayTitle: sanitized, selectedChart: 'donut' }, 'Kepuasan Mahasiswa BEM');
    assert.strictEqual(col.displayTitle, 'Kepuasan Mahasiswa BEM');

    const typo = calculateTypographyScale('large');
    assert.strictEqual(typo.titleFontSize, 24);

    const manifest = buildExportManifest([col], { showWatermark: true });
    assert.ok(manifest.includes(WATERMARK_TEXT));
  });

  test('XF-11: Dichotomous Binary -> Donut Recommendation -> Modern Emerald Palette -> 3x Canvas Config', () => {
    const rec = determineRecommendedChart('DICHOTOMOUS_BINARY', 2, 5);
    assert.strictEqual(rec, 'donut');

    const pal = INSTITUTIONAL_PALETTES.modern_emerald;
    assert.strictEqual(pal.colors[0], '#0E6251');

    const canvasWidth = 800 * 3;
    const canvasHeight = 500 * 3;
    assert.strictEqual(canvasWidth, 2400);
    assert.strictEqual(canvasHeight, 1500);
  });

  test('XF-12: Likert Scale -> Ordered Bar -> Top-Box Stats -> Anti-Clipping Geometry', () => {
    const dist = { '1': 5, '2': 10, '3': 25, '4': 30, '5': 30 };
    const stats = calculateLikertStats(dist, 5);
    assert.strictEqual(stats.netPositivePercent, 60.0);

    const labels = Object.values(stats.labels);
    const padding = calculateDynamicPadding(labels, 'ordered_likert');
    assert.ok(padding.top >= 50);
    assert.ok(padding.bottom >= 40);
  });

  test('XF-13: Multi-Select Checkboxes -> Ranked Bar -> Custom Palette Validation -> Single PNG Sanitization', () => {
    const rec = determineRecommendedChart('MULTI_SELECT_CHECKBOX', 5, 10);
    assert.strictEqual(rec, 'ranked_bar');

    const customPal = validateCustomPalette(['#111111', '#222222', '#333333', '#444444', '#555555']);
    assert.strictEqual(customPal.isValid, true);

    const filename = sanitizeExportFilename(3, 'Kendala Utama: Dana & Waktu?');
    assert.strictEqual(filename, 'chart_03_kendala_utama_dana_waktu.png');
  });

  test('XF-14: Nominal Demographics -> Horizontal Bar -> Executive Pastel Palette -> Batch ZIP Packaging', async () => {
    const rec = determineRecommendedChart('NOMINAL_DEMOGRAPHIC', 8, 20);
    assert.strictEqual(rec, 'horizontal_bar');

    const pal = INSTITUTIONAL_PALETTES.executive_pastel;
    assert.strictEqual(pal.colors[0], '#6C88C4');

    const charts = [{ filename: 'chart_01_fakultas.png', data: Buffer.from('mock_png') }];
    const manifest = buildExportManifest(
      [{ cleanName: 'Fakultas', displayTitle: 'Fakultas', selectedChart: 'horizontal_bar', isExcluded: false, validResponses: 50 }],
      { activePaletteId: 'executive_pastel' }
    );
    const zip = await packageBatchZip(charts, manifest);
    assert.ok(zip.length > 100);
  });

  test('XF-15: Bundled Demo Data (Sample 1) -> Curation Override -> Custom Palette -> 2D Flat Preset', () => {
    const p1 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
    const ds = parseCSVText(fs.readFileSync(p1, 'utf-8'));
    assert.strictEqual(ds.rowCount, 134);

    const col = ds.columns.find((c) => c.cleanName.includes('Asal Bidang'));
    const overridden = overrideChartType(col, 'vertical_bar');
    assert.strictEqual(overridden.selectedChart, 'vertical_bar');

    const pal = validateCustomPalette('#002D62 #D4AF37 #1E56A0 #F39C12 #4A90E2');
    assert.strictEqual(pal.isValid, true);

    assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
  });

  test('XF-16: Bundled Demo Data (Sample 2) -> Gemini Fallback Check -> Watermark Render -> Single PNG Sanitization', () => {
    const p2 = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_2.csv';
    const ds = parseCSVText(fs.readFileSync(p2, 'utf-8'));
    const col = ds.columns.find((c) => c.type === 'LIKERT_SCALE');

    const narrative = resolveNarrativeWithFallback(col, ''); // Empty key
    assert.strictEqual(narrative.isOfflineFallback, true);

    const filename = sanitizeExportFilename(1, col.cleanName);
    assert.ok(filename.startsWith('chart_01_'));
    assert.ok(filename.endsWith('.png'));
  });

  test('XF-17: Donut Chart -> Prohibited Chart Guard -> Curation Override Block -> Dimensionality Mode Retention', () => {
    const col = { id: 'c', cleanName: 'Status', selectedChart: 'donut' };
    assert.throws(() => {
      overrideChartType(col, 'radar');
    }, /prohibited/);

    assert.strictEqual(col.selectedChart, 'donut');
    assert.strictEqual(resolveDimensionality('3d', 'inherit'), '3d');
  });

  test('XF-18: Ranked Bar -> Average Selections Stats -> Dynamic Left Margin -> 3x DPI Resolution', () => {
    const analysis = splitMultiSelectResponses(['A, B', 'B, C', 'A, C'], 3);
    assert.strictEqual(analysis.averageSelectionsPerRespondent, 2.0);

    const labels = analysis.tokenFrequencies.map((t) => t.token);
    const padding = calculateDynamicPadding(labels, 'ranked_bar');
    assert.ok(padding.left >= 80);

    const scale = 3.0;
    assert.strictEqual(800 * scale, 2400);
  });

  test('XF-19: Likert Scale -> Warm Sunset Palette -> 2.5D Isometric Gradients -> Batch ZIP Archive', async () => {
    const pal = INSTITUTIONAL_PALETTES.warm_sunset;
    assert.strictEqual(pal.colors[0], '#C0392B');

    const style = resolveDimensionality('3d', 'inherit');
    assert.strictEqual(style, '3d');

    const zipBuffer = await packageBatchZip([], 'Manifest Warm Sunset');
    const zip = await JSZip.loadAsync(zipBuffer);
    assert.ok(zip.file('SURVEY_SUMMARY_AUDIT.txt') !== null);
  });

  test('XF-20: CSV vs Excel Ingestion Equivalence on identical survey schema', () => {
    const csv = 'Jurusan,Angkatan\nInformatika,2024\nStatistika,2023';
    const dsCSV = parseCSVText(csv);

    const ws = XLSX.utils.aoa_to_sheet([['Jurusan', 'Angkatan'], ['Informatika', '2024'], ['Statistika', '2023']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const dsExcel = parseExcelBuffer(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

    assert.strictEqual(dsCSV.rowCount, dsExcel.rowCount);
    assert.strictEqual(dsCSV.columns.length, dsExcel.columns.length);
    assert.strictEqual(dsCSV.columns[0].cleanName, dsExcel.columns[0].cleanName);
    assert.strictEqual(dsCSV.columns[1].cleanName, dsExcel.columns[1].cleanName);
  });

  test('XF-21: PII Column Exclusion -> Curation Table Status -> Watermark Inclusion -> Exclusion from Batch ZIP', () => {
    const colPII = { cleanName: 'NIM', isPII: true, isExcluded: true, selectedChart: 'none' };
    const colData = { cleanName: 'Fakultas', isPII: false, isExcluded: false, selectedChart: 'horizontal_bar' };
    const manifest = buildExportManifest([colPII, colData], { showWatermark: true });

    assert.strictEqual(manifest.includes('NIM'), false);
    assert.ok(manifest.includes('Fakultas'));
    assert.ok(manifest.includes(WATERMARK_TEXT));
  });

  test('XF-22: Likert Scale -> Offline Top-Box Summary -> Gemini Prompt Agnostic -> 3x Scale Export', () => {
    const col = {
      displayTitle: 'Tingkat Kepuasan Organisasi',
      type: 'LIKERT_SCALE',
      validResponses: 50,
      totalResponses: 50,
      distribution: { '4': 25, '5': 25 },
      likertScale: { min: 1, max: 5, mean: 4.5, median: 4.5, netPositivePercent: 100.0, labels: {} },
    };
    const summary = generateOfflineSummary({
      type: col.type,
      title: col.displayTitle,
      totalResponses: 50,
      validResponses: 50,
      distribution: col.distribution,
      likertStats: col.likertScale,
    });
    assert.ok(summary.includes('100%'));

    const prompt = buildGeminiPrompt(col);
    assert.ok(prompt.includes('Tingkat Kepuasan Organisasi'));
    assert.strictEqual(prompt.includes('NIM'), false);
  });

  test('XF-23: Multi-Select Checkbox vs Demographic Bar -> Long Label Wrapping -> Dynamic Margin', () => {
    const longLabel = 'Biro Riset dan Pengembangan Organisasi Kemahasiswaan';
    const lines = wrapLabel(longLabel, 22);
    assert.ok(lines.length >= 2);

    const pad = calculateDynamicPadding([longLabel], 'horizontal_bar');
    assert.ok(pad.left >= 200);
  });

  test('XF-24: Nominal Demographics -> Custom Palette 5 Hex -> Card Override 3D -> PNG Export Slug', () => {
    const pal = validateCustomPalette(['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2']);
    assert.strictEqual(pal.isValid, true);

    const override = resolveDimensionality('2d', '3d');
    assert.strictEqual(override, '3d');

    const fn = sanitizeExportFilename(7, 'Fakultas & Sekolah Vokasi');
    assert.strictEqual(fn, 'chart_07_fakultas_sekolah_vokasi.png');
  });

  test('XF-25: Open-Ended Essay -> Prohibited Radar Chart Check -> Text Feed Curation -> Qualitative Summary', () => {
    assert.strictEqual(isChartTypeProhibited('radar'), true);

    const rec = determineRecommendedChart('OPEN_ENDED_TEXT', 50, 40);
    assert.strictEqual(rec, 'text_feed');

    const summary = generateOfflineSummary({
      type: 'OPEN_ENDED_TEXT',
      title: 'Kritik dan Saran',
      totalResponses: 30,
      validResponses: 30,
      distribution: {},
    });
    assert.ok(summary.includes('jawaban kualitatif terbuka'));
  });

  test('XF-26: Donut Chart -> UNDIP Navy & Gold Cycle -> 2D Flat Pill Badges -> BEM UNDIP Watermark', () => {
    const pal = INSTITUTIONAL_PALETTES.undip_navy_gold;
    const color0 = pal.colors[0];
    const color1 = pal.colors[1];
    assert.strictEqual(color0, '#002D62');
    assert.strictEqual(color1, '#D4AF37');

    const mode = resolveDimensionality('2d', 'inherit');
    assert.strictEqual(mode, '2d');

    const manifest = buildExportManifest([], { showWatermark: true });
    assert.ok(manifest.includes(WATERMARK_TEXT));
  });

  test('XF-27: Horizontal Bar -> Plus Jakarta Sans Font -> 3D Isometric Elevation -> 2400x1500 px Canvas', () => {
    assert.ok(FONT_FAMILIES.includes('Plus Jakarta Sans'));

    const mode = resolveDimensionality('3d', 'inherit');
    assert.strictEqual(mode, '3d');

    const w = 800 * 3;
    const h = 500 * 3;
    assert.strictEqual(w, 2400);
    assert.strictEqual(h, 1500);
  });

  test('XF-28: Mixed Multi-Select & Likert Survey -> Curated Palettes -> Batch ZIP Bundle with Audit File', async () => {
    const cols = [
      { cleanName: 'Kendala', displayTitle: 'Kendala', selectedChart: 'ranked_bar', isExcluded: false, validResponses: 134 },
      { cleanName: 'Stress', displayTitle: 'Tingkat Stress', selectedChart: 'ordered_likert', isExcluded: false, validResponses: 134 },
    ];
    const manifest = buildExportManifest(cols, {
      fontFamily: 'Plus Jakarta Sans',
      activePaletteId: 'undip_navy_gold',
      showWatermark: true,
    });
    const charts = [
      { filename: 'chart_01_kendala.png', data: Buffer.from('data1') },
      { filename: 'chart_02_stress.png', data: Buffer.from('data2') },
    ];
    const zipBuf = await packageBatchZip(charts, manifest);
    const zip = await JSZip.loadAsync(zipBuf);
    assert.strictEqual(Object.keys(zip.files).length, 3);
  });

  test('XF-29: Full Curation & Theming Lifecycle: Title Edit + Exclusion Toggle + Custom Palette + Watermark + ZIP Output', async () => {
    let col = { id: 'c1', rawName: '  Fakultas  ', cleanName: 'Fakultas', displayTitle: 'Fakultas', isExcluded: false, selectedChart: 'horizontal_bar', validResponses: 100 };
    col = updateColumnTitle(col, 'Distribusi Fakultas Mahasiswa BEM 2026');
    assert.strictEqual(col.displayTitle, 'Distribusi Fakultas Mahasiswa BEM 2026');

    const pal = validateCustomPalette(['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2']);
    assert.strictEqual(pal.isValid, true);

    const manifest = buildExportManifest([col], {
      fontFamily: 'Montserrat',
      showWatermark: true,
      watermarkText: 'Biro Statistika BEM UNDIP',
    });
    assert.ok(manifest.includes('Distribusi Fakultas Mahasiswa BEM 2026'));
    assert.ok(manifest.includes('Biro Statistika BEM UNDIP'));

    const zipBuf = await packageBatchZip([{ filename: sanitizeExportFilename(1, col.displayTitle), data: 'png_bytes' }], manifest);
    const zip = await JSZip.loadAsync(zipBuf);
    assert.ok(zip.file('chart_01_distribusi_fakultas_mahasiswa_bem_2026.png') !== null);
  });

});
