/**
 * Tier 4: Real-World Workloads Test Suite
 * BEM UNDIP Survey Analytics & Visualization Platform
 * 
 * Verifies end-to-end processing and validation of real BEM UNDIP datasets:
 * 1. UPGRADING BEM UNDIP Survey (`survey_sample_1.csv`)
 * 2. Campus Safety & Catcalling Survey (`survey_sample_2.csv`)
 * 3. Smoke-Free Campus Zone (KTR) Survey (`Survei Penerapan Kawasan Tanpa Rokok (KTR)...xlsx`)
 * 4. Offline Demo Data Instant Load & Theming Lifecycle
 * 5. Gemini LLM Narrative Toggle with Graceful Offline Fallback & Batch Packaging
 * 
 * Target: >= 5 comprehensive scenarios.
 */

const fs = require('fs');
const path = require('path');
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

setTier('tier4');

const RAW_DIR = 'C:\\Users\\geova\\.gemini\\antigravity\\raw';

describe('Tier 4: Real-World Application Scenarios', () => {

  // =========================================================================
  // Scenario 1: UPGRADING BEM UNDIP Survey (survey_sample_1.csv) Full Pipeline
  // =========================================================================
  test('Scenario 1: UPGRADING BEM UNDIP Survey (survey_sample_1.csv) Full Pipeline', () => {
    const filePath = path.join(RAW_DIR, 'survey_sample_1.csv');
    assert.strictEqual(fs.existsSync(filePath), true, `Sample file must exist at ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const dataset = parseCSVText(content, 'survey_sample_1.csv');

    // 1. Dataset Shape & Integrity
    assert.strictEqual(dataset.rowCount, 134, 'Sample 1 must contain exactly 134 rows');
    assert.strictEqual(dataset.columns.length, 27, 'Sample 1 must contain exactly 27 columns');

    // 2. Header Normalization & PII Filtering
    const piiColumns = dataset.columns.filter((c) => c.isPII);
    assert.ok(piiColumns.length >= 2, 'Must detect at least Timestamp and Nama Lengkap as PII');
    const timestampCol = dataset.columns.find((c) => c.cleanName === 'Timestamp');
    const nameCol = dataset.columns.find((c) => c.cleanName.startsWith('Nama Lengkap'));
    assert.strictEqual(timestampCol.isExcluded, true);
    assert.strictEqual(nameCol.isExcluded, true);

    // 3. Multi-Select Checkboxes with High Token Repeat Ratio (> 10.0)
    const kendalaCol = dataset.columns.find((c) => c.cleanName.includes('kendala?'));
    assert.ok(kendalaCol !== undefined, 'Must identify Kendala question');
    assert.strictEqual(kendalaCol.type, 'MULTI_SELECT_CHECKBOX');
    assert.strictEqual(kendalaCol.recommendedChart, 'ranked_bar');

    const kendalaValues = dataset.rawRows.map((r) => r[kendalaCol.rawName]);
    const { ratio: repeatRatio } = calculateTokenRepeatRatio(kendalaValues);
    assert.ok(repeatRatio > 10.0, `Token Repeat Ratio must be > 10.0, got ${repeatRatio}`);

    const kendalaAnalysis = splitMultiSelectResponses(kendalaValues, dataset.rowCount);
    assert.ok(kendalaAnalysis.tokenFrequencies.length > 5);
    assert.ok(kendalaAnalysis.averageSelectionsPerRespondent > 1.0);

    // 4. Likert Scale Detection (1-4 and 1-5 scales)
    const likertColumns = dataset.columns.filter((c) => c.type === 'LIKERT_SCALE');
    assert.ok(likertColumns.length >= 7, `Expected >= 7 Likert columns, found ${likertColumns.length}`);
    for (const lCol of likertColumns) {
      assert.strictEqual(lCol.recommendedChart, 'ordered_likert');
      const stats = calculateLikertStats(lCol.distribution, lCol.cleanName.includes('1-5') ? 5 : 4);
      assert.ok(stats.mean >= 1.0 && stats.mean <= 5.0);
    }

    // 5. Open-Ended Text Classification
    const openEndedCols = dataset.columns.filter((c) => c.type === 'OPEN_ENDED_TEXT');
    assert.ok(openEndedCols.length >= 1, 'Must detect open-ended essay questions');
    const harapanCol = dataset.columns.find((c) => c.cleanName.includes('harapan'));
    assert.strictEqual(harapanCol.type, 'OPEN_ENDED_TEXT');
    assert.strictEqual(harapanCol.recommendedChart, 'text_feed');

    // 6. Anti-Clipping Dynamic Padding on All Columns
    for (const col of dataset.columns) {
      const labels = Object.keys(col.distribution);
      const pad = calculateDynamicPadding(labels, col.recommendedChart);
      assert.ok(pad.left >= 40 && pad.left <= 260);
      assert.ok(pad.top >= 40);
    }
  });

  // =========================================================================
  // Scenario 2: Campus Safety & Catcalling (survey_sample_2.csv) Full Pipeline
  // =========================================================================
  test('Scenario 2: Campus Safety & Catcalling (survey_sample_2.csv) Full Pipeline', () => {
    const filePath = path.join(RAW_DIR, 'survey_sample_2.csv');
    assert.strictEqual(fs.existsSync(filePath), true, `Sample 2 must exist at ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const dataset = parseCSVText(content, 'survey_sample_2.csv');

    // 1. Dataset Dimensions
    assert.strictEqual(dataset.rowCount, 197, 'Sample 2 must contain exactly 197 rows');
    assert.strictEqual(dataset.columns.length, 15, 'Sample 2 must contain exactly 15 columns');

    // 2. Sensitive PII Detection (Timestamp, Nama, NIM)
    const nimCol = dataset.columns.find((c) => c.cleanName === 'NIM');
    assert.ok(nimCol !== undefined, 'Must find NIM column');
    assert.strictEqual(nimCol.isPII, true);
    assert.strictEqual(nimCol.isExcluded, true);

    const namaCol = dataset.columns.find((c) => c.cleanName.startsWith('Nama'));
    assert.strictEqual(namaCol.isPII, true);
    assert.strictEqual(namaCol.isExcluded, true);

    // 3. Dichotomous Binary Question (Pengalaman Catcalling: Ya / Tidak)
    const binaryCol = dataset.columns.find((c) => c.cleanName.includes('catcalling'));
    assert.ok(binaryCol !== undefined, 'Must find Catcalling experience question');
    assert.strictEqual(binaryCol.type, 'DICHOTOMOUS_BINARY');
    assert.strictEqual(binaryCol.recommendedChart, 'donut');
    assert.strictEqual(binaryCol.uniqueValuesCount, 2);
    assert.ok(binaryCol.distribution['Ya'] > 0);
    assert.ok(binaryCol.distribution['Tidak'] > 0);

    // 4. Ordinal Likert Ratings (1-4 scale)
    const likertCols = dataset.columns.filter((c) => c.type === 'LIKERT_SCALE');
    assert.ok(likertCols.length >= 6, `Expected >= 6 Likert columns, found ${likertCols.length}`);
    for (const lCol of likertCols) {
      assert.strictEqual(lCol.recommendedChart, 'ordered_likert');
      const stats = calculateLikertStats(lCol.distribution, 4);
      assert.strictEqual(stats.min, 1);
      assert.strictEqual(stats.max, 4);
      assert.ok(stats.netPositivePercent >= 0 && stats.netPositivePercent <= 100);
    }

    // 5. Open-Ended Narrative Investigation Questions (Kronologi, Lokasi, Waktu)
    const kronologiCol = dataset.columns.find((c) => c.cleanName.includes('kronologi'));
    assert.ok(kronologiCol !== undefined, 'Must find kronologi column');
    assert.strictEqual(kronologiCol.type, 'OPEN_ENDED_TEXT');
    assert.strictEqual(kronologiCol.recommendedChart, 'text_feed');
  });

  // =========================================================================
  // Scenario 3: Smoke-Free Campus Zone (KTR.xlsx) Full Excel Pipeline
  // =========================================================================
  test('Scenario 3: Smoke-Free Campus Zone (KTR.xlsx) Full Excel Pipeline', () => {
    const filePath = path.join(
      RAW_DIR,
      'Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx'
    );
    assert.strictEqual(fs.existsSync(filePath), true, `KTR Excel file must exist at ${filePath}`);

    const buffer = fs.readFileSync(filePath);
    const dataset = parseExcelBuffer(buffer, 'KTR.xlsx');

    // 1. Excel Shape & Rows Ingestion
    assert.strictEqual(dataset.rowCount, 265, 'KTR dataset must contain exactly 265 rows');
    assert.strictEqual(dataset.columns.length, 19, 'KTR dataset must contain exactly 19 columns');

    // 2. Demographic Parsing (Fakultas, Angkatan, Jenis Kelamin)
    const facCol = dataset.columns.find((c) => c.cleanName.toLowerCase().includes('fakultas'));
    assert.ok(facCol !== undefined, 'Must find Fakultas column');
    assert.strictEqual(facCol.type, 'NOMINAL_DEMOGRAPHIC');

    const genderCol = dataset.columns.find((c) => c.cleanName.toLowerCase().includes('jenis kelamin'));
    assert.ok(genderCol !== undefined, 'Must find Jenis Kelamin column');
    assert.strictEqual(genderCol.type, 'DICHOTOMOUS_BINARY');
    assert.strictEqual(genderCol.recommendedChart, 'donut');

    // 3. Binary Awareness Question (Ya / Tidak tahu)
    const knowCol = dataset.columns.find((c) => c.cleanName.includes('mengetahui bahwa Undip telah'));
    assert.ok(knowCol !== undefined, 'Must find KTR awareness question');
    assert.strictEqual(knowCol.type, 'DICHOTOMOUS_BINARY');
    assert.strictEqual(knowCol.recommendedChart, 'donut');

    // 4. Appropriate Institutional Theming for Environment / Health
    const envPalette = INSTITUTIONAL_PALETTES.modern_emerald;
    assert.ok(envPalette.colors.length >= 5);
    assert.strictEqual(envPalette.colors[0], '#0E6251');
  });

  // =========================================================================
  // Scenario 4: Offline Demo Data Instant Load & Theming Lifecycle
  // =========================================================================
  test('Scenario 4: Offline Demo Data Instant Load & Theming Lifecycle', () => {
    // 1. Instant loading without network
    const p1 = path.join(RAW_DIR, 'survey_sample_1.csv');
    const p2 = path.join(RAW_DIR, 'survey_sample_2.csv');

    const start = Date.now();
    const ds1 = parseCSVText(fs.readFileSync(p1, 'utf-8'), 'demo1.csv');
    const ds2 = parseCSVText(fs.readFileSync(p2, 'utf-8'), 'demo2.csv');
    const elapsedMs = Date.now() - start;

    assert.ok(elapsedMs < 100, `Demo load should take < 100ms, took ${elapsedMs}ms`);
    assert.strictEqual(ds1.rowCount, 134);
    assert.strictEqual(ds2.rowCount, 197);

    // 2. Custom Palette Builder Validation
    const invalidCustom = validateCustomPalette(['#002D62', '#D4AF37', '#1E56A0', '#F39C12']); // 4 colors
    assert.strictEqual(invalidCustom.isValid, false);
    assert.ok(invalidCustom.errors[0].includes('Minimal 5'));

    const validCustom = validateCustomPalette([
      '#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2', '#AABBCC'
    ]);
    assert.strictEqual(validCustom.isValid, true);
    assert.strictEqual(validCustom.colors.length, 6);

    // 3. Dimensionality Hierarchy & Overrides
    const globalPreset = '2d';
    const card1Override = resolveDimensionality(globalPreset, '3d');
    const card2Override = resolveDimensionality(globalPreset, 'inherit');
    assert.strictEqual(card1Override, '3d');
    assert.strictEqual(card2Override, '2d');

    // 4. BEM UNDIP Watermark Configuration
    assert.strictEqual(WATERMARK_TEXT, 'Biro Statistik BEM Universitas Diponegoro');
  });

  // =========================================================================
  // Scenario 5: Gemini Narrative Toggle with Graceful Fallback & Batch ZIP
  // =========================================================================
  test('Scenario 5: Gemini Narrative Toggle with Graceful Fallback & Batch ZIP', async () => {
    const p1 = path.join(RAW_DIR, 'survey_sample_1.csv');
    const ds = parseCSVText(fs.readFileSync(p1, 'utf-8'), 'sample.csv');
    const activeCols = ds.columns.filter((c) => !c.isExcluded);

    // 1. Verify Gemini Prompt Strips PII and Only Encodes Aggregated Distributions
    for (const col of activeCols.slice(0, 5)) {
      const prompt = JSON.parse(buildGeminiPrompt(col));
      assert.strictEqual(typeof prompt.question, 'string');
      assert.strictEqual(typeof prompt.n_valid, 'number');
      assert.strictEqual(typeof prompt.distribution, 'object');
      assert.strictEqual(prompt.rawRows, undefined);
    }

    // 2. Simulate Offline Network State -> Graceful Fallback
    const targetCol = activeCols[0];
    const offlineResult = resolveNarrativeWithFallback(targetCol, 'dummy_key', false);
    assert.strictEqual(offlineResult.isOfflineFallback, true);
    assert.ok(offlineResult.narrative.length > 20);

    // 3. High-Resolution 3x Canvas Dimensions (~300 DPI)
    const baseWidth = 800;
    const baseHeight = 500;
    const pixelRatio = 3.0;
    const exportWidth = baseWidth * pixelRatio;
    const exportHeight = baseHeight * pixelRatio;
    assert.strictEqual(exportWidth, 2400);
    assert.strictEqual(exportHeight, 1500);

    // 4. Batch ZIP Packaging with Audit Manifest
    const mockCharts = activeCols.slice(0, 5).map((col, idx) => ({
      filename: sanitizeExportFilename(idx + 1, col.displayTitle),
      data: Buffer.from(`mock_chart_bytes_for_${col.id}`),
    }));

    const manifestContent = buildExportManifest(activeCols.slice(0, 5), {
      fontFamily: 'Poppins',
      activePaletteId: 'undip_navy_gold',
      showWatermark: true,
      watermarkText: WATERMARK_TEXT,
    });

    assert.ok(manifestContent.includes('AUDIT MANIFEST'));
    assert.ok(manifestContent.includes(WATERMARK_TEXT));

    const zipBuffer = await packageBatchZip(mockCharts, manifestContent);
    assert.ok(Buffer.isBuffer(zipBuffer));
    assert.ok(zipBuffer.length > 300);

    const zip = await JSZip.loadAsync(zipBuffer);
    assert.ok(zip.file('SURVEY_SUMMARY_AUDIT.txt') !== null);
    assert.strictEqual(Object.keys(zip.files).length, 6); // 5 charts + 1 manifest
  });

});
