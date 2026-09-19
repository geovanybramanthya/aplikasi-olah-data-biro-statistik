/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 4: High-Resolution Batch Export & Asset Packaging
 * Comprehensive Verification Test Suite (tests/m4_verification.cjs)
 *
 * Verifies Features 26–29:
 * - Feature 26: High-Resolution 3x Canvas Export & Dimensions (~300 DPI, 2400x1500 px)
 * - Feature 27: Dynamic Anti-Clipping Geometry, Margins, Word Wrapping & Badge Placement
 * - Feature 28: Single Chart PNG Export, Filename Sanitization & Download Helpers
 * - Feature 29: High-Res Batch ZIP Packaging, Audit Manifest Generator & Orchestration
 * - Node/Browser Dual Environment Support (Buffers, Blobs, Streams)
 * - Headless Presentation Card Compositor & PNG Generation
 * - UI Components: BatchExportModal & ExportAuditSummary
 */

const assert = require('assert');
const path = require('path');
const esbuild = require('esbuild');
const JSZip = require('jszip');

console.log('========================================================================');
console.log('  MILESTONE 4 VERIFICATION TEST SUITE (Export & Asset Packaging)       ');
console.log('========================================================================\n');

// 1. Compile TypeScript source modules via esbuild in memory
console.log('[Setup] Compiling Milestone 4 TypeScript modules in memory via esbuild...');

const srcTypesDir = path.resolve(__dirname, '../src/types');
const srcExportCoreDir = path.resolve(__dirname, '../src/core/export');
const srcExportCompDir = path.resolve(__dirname, '../src/components/export');

const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from '${srcExportCoreDir.replace(/\\/g, '/')}/canvasExporter';
      export * from '${srcExportCoreDir.replace(/\\/g, '/')}/zipPackager';
      export * from '${srcExportCompDir.replace(/\\/g, '/')}/BatchExportModal';
      export * from '${srcExportCompDir.replace(/\\/g, '/')}/ExportAuditSummary';
    `,
    resolveDir: __dirname,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  jsx: 'transform',
  external: ['echarts', 'jszip', 'react', 'react-dom', 'lucide-react'],
});

const moduleExports = {};
const runnerFn = new Function('module', 'exports', 'require', bundleResult.outputFiles[0].text);
runnerFn(moduleExports, (moduleExports.exports = {}), require);

const {
  // Feature 26 & 27: canvasExporter
  EXPORT_PIXEL_RATIO,
  DEFAULT_BASE_WIDTH,
  DEFAULT_BASE_HEIGHT,
  TALL_BASE_HEIGHT,
  EXPORT_BG_COLOR,
  EXPORT_MIME_TYPE,
  WATERMARK_DEFAULT_TEXT,
  calculateExportDimensions,
  calculateDynamicPadding,
  wrapLabel,
  determineBadgePlacement,
  sanitizeExportFilename,
  exportMountedChartToDataURL,
  exportMountedChartToBlob,
  exportChartToPng,
  downloadSingleChartPNG,
  dataURLToBlob,
  wrapCanvasText,
  generateHeadlessPngBuffer,
  renderCompositeCardToDataURL,
  renderCompositeCardToBuffer,
  renderChartCardToBlob,
  renderChartCardToDataURL,
  downloadSingleChart,

  // Feature 29: zipPackager
  AUDIT_MANIFEST_FILENAME,
  DEFAULT_CHARTS_FOLDER,
  formatBatchChartFilename,
  generateZipArchiveFilename,
  buildExportManifest,
  packageBatchZip,
  triggerBlobDownload,
  exportDatasetToZip,
  exportSurveyBatchZip,

  // UI Components
  BatchExportModal,
  ExportAuditSummary,
} = moduleExports.exports;

console.log('✓ All Milestone 4 modules compiled and loaded successfully.\n');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

// Mock Theme & Column fixtures
const mockTheme = {
  fontFamily: 'Poppins',
  titleFontSize: 20,
  labelFontSize: 12,
  activePaletteId: 'undip_navy_gold',
  activePalette: {
    id: 'undip_navy_gold',
    name: 'UNDIP Navy & Gold',
    colors: ['#002D62', '#D4AF37', '#1E56A0', '#4A90E2', '#A3B18A'],
  },
  customPalette: {
    id: 'custom',
    name: 'Custom',
    colors: ['#111111', '#222222', '#333333', '#444444', '#555555'],
    isCustom: true,
  },
  globalDimensionality: '2d',
  showWatermark: true,
  watermarkText: 'Biro Statistik BEM Universitas Diponegoro',
};

const mockColumns = [
  {
    id: 'col-1',
    columnIndex: 1,
    rawName: 'Fakultas Mahasiswa',
    cleanName: 'Fakultas Mahasiswa',
    displayTitle: 'Distribusi Fakultas Mahasiswa',
    type: 'NOMINAL_DEMOGRAPHIC',
    isPII: false,
    isExcluded: false,
    recommendedChart: 'horizontal_bar',
    selectedChart: 'horizontal_bar',
    totalResponses: 100,
    validResponses: 95,
    missingResponses: 5,
    uniqueValuesCount: 6,
    distribution: {
      'Fakultas Teknik': 30,
      'Fakultas Ekonomika dan Bisnis': 25,
      'Fakultas Ilmu Budaya': 15,
      'Fakultas Sains dan Matematika': 12,
      'Fakultas Hukum': 8,
      'Fakultas Kedokteran': 5,
    },
    offlineSummary: 'Fakultas Teknik memimpin dengan 30 responden.',
  },
  {
    id: 'col-2',
    columnIndex: 2,
    rawName: 'Kepuasan Program Kerja',
    cleanName: 'Kepuasan Program Kerja',
    displayTitle: 'Tingkat Kepuasan Kerja BEM',
    type: 'LIKERT_SCALE',
    isPII: false,
    isExcluded: false,
    recommendedChart: 'ordered_likert',
    selectedChart: 'ordered_likert',
    totalResponses: 100,
    validResponses: 98,
    missingResponses: 2,
    uniqueValuesCount: 5,
    distribution: { '1': 4, '2': 8, '3': 18, '4': 40, '5': 28 },
    likertScale: {
      min: 1,
      max: 5,
      labels: { 1: 'Sangat Buruk', 2: 'Buruk', 3: 'Cukup', 4: 'Baik', 5: 'Sangat Baik' },
      mean: 3.82,
      median: 4,
      netPositivePercent: 69.4,
    },
    offlineSummary: 'Rata-rata kepuasan 3.82 / 5.0 dengan Net Positive 69.4%.',
  },
  {
    id: 'col-3',
    columnIndex: 3,
    rawName: 'NIM Mahasiswa',
    cleanName: 'NIM Mahasiswa',
    displayTitle: 'NIM Mahasiswa',
    type: 'METADATA_PII',
    isPII: true,
    isExcluded: true,
    recommendedChart: 'none',
    selectedChart: 'none',
    totalResponses: 100,
    validResponses: 100,
    missingResponses: 0,
    uniqueValuesCount: 100,
    distribution: {},
    offlineSummary: 'Kolom PII - privasi terlindungi.',
  },
];

const mockDataset = {
  id: 'ds-test-1',
  name: 'UPGRADING_BEM_UNDIP.xlsx',
  fileName: 'UPGRADING_BEM_UNDIP.xlsx',
  rowCount: 100,
  columns: mockColumns,
  rawRows: [],
};

async function runAllTests() {
  // ========================================================================
  // Test Suite 1: Feature 26 - High-Resolution 3x Canvas Dimensions
  // ========================================================================
  console.log('--- Test Suite 1: Feature 26 - High-Resolution 3x Canvas Dimensions ---');

  runTest('F26-1: Constants match official publication specifications', () => {
    assert.strictEqual(EXPORT_PIXEL_RATIO, 3.0);
    assert.strictEqual(DEFAULT_BASE_WIDTH, 800);
    assert.strictEqual(DEFAULT_BASE_HEIGHT, 500);
    assert.strictEqual(TALL_BASE_HEIGHT, 600);
    assert.strictEqual(EXPORT_BG_COLOR, '#FFFFFF');
    assert.strictEqual(EXPORT_MIME_TYPE, 'image/png');
    assert.strictEqual(WATERMARK_DEFAULT_TEXT, 'Biro Statistik BEM Universitas Diponegoro');
  });

  runTest('F26-2: calculateExportDimensions calculates exact 2400x1500 for standard base', () => {
    const dims = calculateExportDimensions(800, 500, 3.0);
    assert.strictEqual(dims.baseWidth, 800);
    assert.strictEqual(dims.baseHeight, 500);
    assert.strictEqual(dims.pixelRatio, 3.0);
    assert.strictEqual(dims.targetWidth, 2400);
    assert.strictEqual(dims.targetHeight, 1500);
  });

  runTest('F26-3: calculateExportDimensions calculates exact 2400x1800 for tall base', () => {
    const dims = calculateExportDimensions(800, 600, 3.0);
    assert.strictEqual(dims.targetWidth, 2400);
    assert.strictEqual(dims.targetHeight, 1800);
  });

  runTest('F26-4: calculateExportDimensions handles arbitrary width/height and custom pixel ratio', () => {
    const dims = calculateExportDimensions(1000, 700, 2.0);
    assert.strictEqual(dims.targetWidth, 2000);
    assert.strictEqual(dims.targetHeight, 1400);
  });

  runTest('F26-5: calculateExportDimensions enforces minimum pixel ratio guard of 1.0', () => {
    const dims = calculateExportDimensions(800, 500, -2);
    assert.strictEqual(dims.pixelRatio, 1);
    assert.strictEqual(dims.targetWidth, 800);
    assert.strictEqual(dims.targetHeight, 500);
  });

  // ========================================================================
  // Test Suite 2: Feature 27 - Dynamic Anti-Clipping Padding Geometry
  // ========================================================================
  console.log('\n--- Test Suite 2: Feature 27 - Dynamic Anti-Clipping Padding Geometry ---');

  runTest('F27-1: calculateDynamicPadding clamps left margin to minimum 80px', () => {
    const pad = calculateDynamicPadding(['A'], 'horizontal_bar');
    assert.strictEqual(pad.left, 80);
    assert.strictEqual(pad.right, 50);
    assert.strictEqual(pad.top, 70);
    assert.strictEqual(pad.bottom, 50);
  });

  runTest('F27-2: calculateDynamicPadding clamps left margin to maximum safety cap 260px', () => {
    const extremeLabel = 'X'.repeat(100);
    const pad = calculateDynamicPadding([extremeLabel], 'horizontal_bar');
    assert.strictEqual(pad.left, 260);
  });

  runTest('F27-3: calculateDynamicPadding scales proportionally with Indonesian faculty titles', () => {
    // Length = 15 chars: round(15 * 7.5) = 113 px
    const pad = calculateDynamicPadding(['Fakultas Teknik'], 'horizontal_bar');
    assert.strictEqual(pad.left, 113);
  });

  runTest('F27-4: calculateDynamicPadding applies to ranked_bar identically', () => {
    const pad = calculateDynamicPadding(['Fakultas Hukum'], 'ranked_bar');
    assert.strictEqual(pad.left, 105); // round(14 * 7.5) = 105
  });

  runTest('F27-5: calculateDynamicPadding returns standard padding for non-horizontal charts', () => {
    const padDonut = calculateDynamicPadding(['Long Label Here'], 'donut');
    assert.deepStrictEqual(padDonut, { left: 40, right: 40, top: 70, bottom: 50 });

    const padVert = calculateDynamicPadding(['Long Label Here'], 'vertical_bar');
    assert.deepStrictEqual(padVert, { left: 40, right: 40, top: 70, bottom: 50 });

    const padLikert = calculateDynamicPadding(['Long Label Here'], 'ordered_likert');
    assert.deepStrictEqual(padLikert, { left: 40, right: 40, top: 70, bottom: 50 });
  });

  runTest('F27-6: calculateDynamicPadding handles empty label array gracefully', () => {
    const pad = calculateDynamicPadding([], 'horizontal_bar');
    assert.strictEqual(pad.left, 80);
  });

  // ========================================================================
  // Test Suite 3: Feature 27 - Label Wrapping & Adaptive Badge Placement
  // ========================================================================
  console.log('\n--- Test Suite 3: Feature 27 - Label Wrapping & Adaptive Badge Placement ---');

  runTest('F27-7: wrapLabel wraps long Indonesian text at 22 chars per line', () => {
    const text = 'Fakultas Perikanan dan Ilmu Kelautan';
    const lines = wrapLabel(text, 22);
    assert.ok(lines.length >= 2);
    for (const line of lines) {
      assert.ok(line.length <= 22, `Line "${line}" exceeds maxCharsPerLine`);
    }
  });

  runTest('F27-8: wrapLabel preserves single unbroken word exceeding limit without throwing', () => {
    const unbroken = 'A'.repeat(50);
    const lines = wrapLabel(unbroken, 22);
    assert.strictEqual(lines.length, 1);
    assert.strictEqual(lines[0], unbroken);
  });

  runTest('F27-9: wrapLabel handles empty or whitespace text cleanly', () => {
    assert.deepStrictEqual(wrapLabel(''), []);
    assert.deepStrictEqual(wrapLabel(null), []);
  });

  runTest('F27-10: determineBadgePlacement places inside when proportion > 25%', () => {
    assert.strictEqual(determineBadgePlacement(26, 100), 'inside');
    assert.strictEqual(determineBadgePlacement(80, 100), 'inside');
  });

  runTest('F27-11: determineBadgePlacement places outside when proportion <= 25%', () => {
    assert.strictEqual(determineBadgePlacement(25, 100), 'outside');
    assert.strictEqual(determineBadgePlacement(5, 100), 'outside');
    assert.strictEqual(determineBadgePlacement(0, 100), 'outside');
  });

  runTest('F27-12: determineBadgePlacement safely handles zero or negative max value', () => {
    assert.strictEqual(determineBadgePlacement(0, 0), 'outside');
    assert.strictEqual(determineBadgePlacement(10, -5), 'outside');
  });

  // ========================================================================
  // Test Suite 4: Feature 28 - Single Chart PNG Export & Sanitization
  // ========================================================================
  console.log('\n--- Test Suite 4: Feature 28 - Single Chart PNG Export & Sanitization ---');

  runTest('F28-1: sanitizeExportFilename formats with 2-digit index prefix and lowercase slug', () => {
    const fn = sanitizeExportFilename(1, 'Asal Fakultas Mahasiswa');
    assert.strictEqual(fn, 'chart_01_asal_fakultas_mahasiswa.png');
  });

  runTest('F28-2: sanitizeExportFilename replaces punctuation and symbols with underscores', () => {
    const fn = sanitizeExportFilename(4, 'Tingkat Stress / Burnout? (1-5)');
    assert.strictEqual(fn, 'chart_04_tingkat_stress_burnout_1_5.png');
  });

  runTest('F28-3: sanitizeExportFilename strips emojis cleanly', () => {
    const fn = sanitizeExportFilename(2, 'Kepuasan 😊 Mahasiswa BEM 👍');
    assert.strictEqual(fn, 'chart_02_kepuasan_mahasiswa_bem.png');
  });

  runTest('F28-4: sanitizeExportFilename strictly truncates slug to 40 characters', () => {
    const longTitle = 'B'.repeat(100);
    const fn = sanitizeExportFilename(10, longTitle);
    assert.strictEqual(fn, `chart_10_${'b'.repeat(40)}.png`);
    const slug = fn.replace(/^chart_10_|\.png$/g, '');
    assert.strictEqual(slug.length, 40);
  });

  runTest('F28-5: sanitizeExportFilename falls back to chart for empty title', () => {
    const fn = sanitizeExportFilename(3, '');
    assert.strictEqual(fn, 'chart_03_chart.png');
    const fnSpaces = sanitizeExportFilename(7, '    ');
    assert.strictEqual(fnSpaces, 'chart_07_chart.png');
  });

  runTest('F28-6: sanitizeExportFilename handles indices 10 through 99 properly', () => {
    const fn = sanitizeExportFilename(42, 'Evaluasi Akhir');
    assert.strictEqual(fn, 'chart_42_evaluasi_akhir.png');
  });

  runTest('F28-7: downloadSingleChart returns valid filename in Node environment', async () => {
    const col = mockColumns[0];
    const fn = await downloadSingleChart(col, mockTheme, '2d');
    assert.strictEqual(fn, 'chart_01_distribusi_fakultas_mahasiswa.png');
  });

  // ========================================================================
  // Test Suite 5: Feature 29 - Itemized Audit Manifest Generator
  // ========================================================================
  console.log('\n--- Test Suite 5: Feature 29 - Itemized Audit Manifest Generator ---');

  runTest('F29-1: buildExportManifest contains official ASCII header and separators', () => {
    const manifest = buildExportManifest(mockColumns, mockTheme);
    assert.ok(manifest.includes('================================================================='));
    assert.ok(manifest.includes('BIRO STATISTIK BEM UNIVERSITAS DIPONEGORO - AUDIT MANIFEST'));
    assert.ok(manifest.includes('-----------------------------------------------------------------'));
  });

  runTest('F29-2: buildExportManifest includes metadata: typography, palette, watermark, column count', () => {
    const manifest = buildExportManifest(mockColumns, mockTheme);
    assert.ok(manifest.includes('Typography    : Poppins'));
    assert.ok(manifest.includes('Active Palette: undip_navy_gold'));
    assert.ok(manifest.includes('Watermark     : Enabled'));
    assert.ok(manifest.includes('Watermark Text: "Biro Statistik BEM Universitas Diponegoro"'));
    assert.ok(manifest.includes(`Total Columns : ${mockColumns.length}`));
  });

  runTest('F29-3: buildExportManifest includes itemized chart entries with type and respondent count', () => {
    const manifest = buildExportManifest(mockColumns, mockTheme);
    assert.ok(manifest.includes('  01. [HORIZONTAL_BAR] Distribusi Fakultas Mahasiswa (N=95)'));
    assert.ok(manifest.includes('  02. [ORDERED_LIKERT] Tingkat Kepuasan Kerja BEM (N=98)'));
  });

  runTest('F29-4: buildExportManifest strictly excludes columns with isExcluded=true', () => {
    const manifest = buildExportManifest(mockColumns, mockTheme);
    assert.strictEqual(manifest.includes('NIM Mahasiswa'), false);
    assert.strictEqual(manifest.includes('03.'), false);
  });

  runTest('F29-5: buildExportManifest handles empty columns array and empty theme gracefully', () => {
    const manifest = buildExportManifest([], {});
    assert.ok(manifest.includes('Total Columns : 0'));
    assert.ok(manifest.includes('Typography    : Poppins'));
    assert.ok(manifest.includes('Active Palette: undip_navy_gold'));
    assert.ok(manifest.includes('(Tidak ada grafik visual yang diekspor)'));
  });

  runTest('F29-6: buildExportManifest reflects watermark disabled state accurately', () => {
    const manifest = buildExportManifest(mockColumns, { ...mockTheme, showWatermark: false });
    assert.ok(manifest.includes('Watermark     : Disabled'));
  });

  // ========================================================================
  // Test Suite 6: Feature 29 - In-Memory JSZip Packaging
  // ========================================================================
  console.log('\n--- Test Suite 6: Feature 29 - In-Memory JSZip Packaging ---');

  await runAsyncTest('F29-7: packageBatchZip returns a Node.js Buffer in test environment', async () => {
    const charts = [
      { filename: 'chart_01_fakultas.png', data: Buffer.from('mock_png_data_1') },
      { filename: 'chart_02_kepuasan.png', data: Buffer.from('mock_png_data_2') },
    ];
    const manifest = buildExportManifest(mockColumns, mockTheme);
    const zipBuffer = await packageBatchZip(charts, manifest);

    assert.ok(Buffer.isBuffer(zipBuffer), 'Returned zip must be a Node.js Buffer instance');
    assert.ok(zipBuffer.length > 0, 'Zip buffer must not be empty');
  });

  await runAsyncTest('F29-8: packageBatchZip bundles SURVEY_SUMMARY_AUDIT.txt at archive root', async () => {
    const manifestText = 'Test Audit Content 2026';
    const zipBuffer = await packageBatchZip([], manifestText);
    const zip = await JSZip.loadAsync(zipBuffer);

    const auditFile = zip.file('SURVEY_SUMMARY_AUDIT.txt');
    assert.ok(auditFile !== null, 'SURVEY_SUMMARY_AUDIT.txt must exist at root');
    const readManifest = await auditFile.async('string');
    assert.strictEqual(readManifest, manifestText);
  });

  await runAsyncTest('F29-9: packageBatchZip preserves exact file bytes and directory structure', async () => {
    const testContent = 'Binary PNG simulated data for BEM UNDIP';
    const charts = [{ filename: 'charts/01_chart_test.png', data: Buffer.from(testContent) }];
    const zipBuffer = await packageBatchZip(charts, 'Manifest');
    const zip = await JSZip.loadAsync(zipBuffer);

    const chartFile = zip.file('charts/01_chart_test.png');
    assert.ok(chartFile !== null);
    const readBack = await chartFile.async('string');
    assert.strictEqual(readBack, testContent);
  });

  await runAsyncTest('F29-10: packageBatchZip handles empty chart list boundary (manifest only)', async () => {
    const zipBuffer = await packageBatchZip([], 'Empty Manifest');
    const zip = await JSZip.loadAsync(zipBuffer);
    assert.strictEqual(Object.keys(zip.files).length, 1);
  });

  await runAsyncTest('F29-11: packageBatchZip handles large batch (25 charts) with 26 total entries', async () => {
    const charts = Array.from({ length: 25 }, (_, i) => ({
      filename: `chart_${String(i + 1).padStart(2, '0')}.png`,
      data: Buffer.from(`chart_data_${i}`),
    }));
    const zipBuffer = await packageBatchZip(charts, 'Large Batch');
    const zip = await JSZip.loadAsync(zipBuffer);
    assert.strictEqual(Object.keys(zip.files).length, 26);
  });

  // ========================================================================
  // Test Suite 7: Feature 29 - ZIP Filenames & Directory Structure
  // ========================================================================
  console.log('\n--- Test Suite 7: Feature 29 - ZIP Filenames & Directory Structure ---');

  runTest('F29-12: formatBatchChartFilename includes charts folder and 2-digit index', () => {
    const fn = formatBatchChartFilename(1, 'Asal Fakultas Mahasiswa');
    assert.strictEqual(fn, 'charts/01_chart_asal_fakultas_mahasiswa.png');
  });

  runTest('F29-13: formatBatchChartFilename supports custom or null folder', () => {
    const fnNoFolder = formatBatchChartFilename(3, 'Status Anggota', null);
    assert.strictEqual(fnNoFolder, '03_chart_status_anggota.png');

    const fnCustomFolder = formatBatchChartFilename(5, 'Evaluasi', 'visuals');
    assert.strictEqual(fnCustomFolder, 'visuals/05_chart_evaluasi.png');
  });

  runTest('F29-14: generateZipArchiveFilename sanitizes dataset name and appends suffix', () => {
    const fn1 = generateZipArchiveFilename('UPGRADING_BEM_UNDIP.xlsx');
    assert.strictEqual(fn1, 'UPGRADING_BEM_UNDIP_BEM_UNDIP_Charts.zip');

    const fn2 = generateZipArchiveFilename('Campus Safety & Catcalling Survey (1).csv');
    assert.strictEqual(fn2, 'Campus_Safety_Catcalling_Survey_1_BEM_UNDIP_Charts.zip');

    const fnDefault = generateZipArchiveFilename('');
    assert.strictEqual(fnDefault, 'Survey_BEM_UNDIP_Charts.zip');
  });

  // ========================================================================
  // Test Suite 8: Headless PNG Generation & Geometry Verification
  // ========================================================================
  console.log('\n--- Test Suite 8: Headless PNG Generation & Geometry Verification ---');

  runTest('F26-6: generateHeadlessPngBuffer outputs genuine PNG with 8-byte signature', () => {
    const col = mockColumns[0];
    const buf = generateHeadlessPngBuffer(2400, 1500, {
      column: col,
      theme: mockTheme,
      dimensionality: '2d',
      pixelRatio: 3.0,
    });

    assert.ok(Buffer.isBuffer(buf));
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    assert.strictEqual(buf[0], 0x89);
    assert.strictEqual(buf[1], 0x50);
    assert.strictEqual(buf[2], 0x4e);
    assert.strictEqual(buf[3], 0x47);
    assert.strictEqual(buf[4], 0x0d);
    assert.strictEqual(buf[5], 0x0a);
    assert.strictEqual(buf[6], 0x1a);
    assert.strictEqual(buf[7], 0x0a);
  });

  runTest('F26-7: generateHeadlessPngBuffer sets correct IHDR width and height in big-endian', () => {
    const col = mockColumns[0];
    const buf = generateHeadlessPngBuffer(2400, 1500, {
      column: col,
      theme: mockTheme,
      dimensionality: '2d',
      pixelRatio: 3.0,
    });

    // IHDR chunk starts at byte 8 (length: 4 bytes, type: 4 bytes 'IHDR', width: 4 bytes, height: 4 bytes)
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const chunkType = buf.subarray(12, 16).toString('ascii');
    assert.strictEqual(chunkType, 'IHDR');

    const width = view.getUint32(16, false);
    const height = view.getUint32(20, false);
    assert.strictEqual(width, 2400);
    assert.strictEqual(height, 1500);
  });

  await runAsyncTest('F26-8: renderCompositeCardToBuffer returns Buffer with valid PNG headers in Node', async () => {
    const col = mockColumns[1];
    const buf = await renderCompositeCardToBuffer({
      column: col,
      theme: mockTheme,
      dimensionality: '3d',
      pixelRatio: 3.0,
    });

    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.length > 100);
    assert.strictEqual(buf[0], 0x89);
    assert.strictEqual(buf[1], 0x50);
  });

  await runAsyncTest('F26-9: renderCompositeCardToDataURL produces valid base64 data URL', async () => {
    const col = mockColumns[0];
    const dataUrl = await renderCompositeCardToDataURL({
      column: col,
      theme: mockTheme,
      dimensionality: '2d',
      pixelRatio: 3.0,
    });

    assert.ok(dataUrl.startsWith('data:image/png;base64,'));
    const base64Data = dataUrl.replace('data:image/png;base64,', '');
    const decoded = Buffer.from(base64Data, 'base64');
    assert.strictEqual(decoded[0], 0x89);
    assert.strictEqual(decoded[1], 0x50);
  });

  // ========================================================================
  // Test Suite 9: High-Level Batch Export Orchestrator (exportDatasetToZip)
  // ========================================================================
  console.log('\n--- Test Suite 9: High-Level Batch Export Orchestrator ---');

  await runAsyncTest('F29-15: exportDatasetToZip executes end-to-end and emits sequential progress', async () => {
    const progressEvents = [];

    const result = await exportDatasetToZip({
      dataset: mockDataset,
      theme: mockTheme,
      pixelRatio: 3,
      autoDownload: false,
      onProgress: (p) => progressEvents.push({ ...p }),
    });

    // Mock dataset has 3 columns: 2 visual active, 1 PII excluded
    assert.strictEqual(result.totalCharts, 2);
    assert.strictEqual(result.filename, 'UPGRADING_BEM_UNDIP_BEM_UNDIP_Charts.zip');
    assert.ok(result.manifestContent.includes('Total Columns : 3'));

    // Verify progress progression
    assert.ok(progressEvents.length >= 3);
    const firstEvent = progressEvents[0];
    assert.strictEqual(firstEvent.total, 2);
    assert.strictEqual(firstEvent.completed, 0);

    const lastEvent = progressEvents[progressEvents.length - 1];
    assert.strictEqual(lastEvent.isComplete, true);
    assert.strictEqual(lastEvent.completed, 2);

    // Verify the zip contains both charts and the manifest
    const zip = await JSZip.loadAsync(result.blob);
    assert.ok(zip.file('SURVEY_SUMMARY_AUDIT.txt') !== null);
    assert.ok(zip.file('charts/01_chart_distribusi_fakultas_mahasiswa.png') !== null);
    assert.ok(zip.file('charts/02_chart_tingkat_kepuasan_kerja_bem.png') !== null);
    assert.strictEqual(zip.file('charts/03_chart_nim_mahasiswa.png'), null);
  });

  await runAsyncTest('F29-16: exportSurveyBatchZip alias function produces identical valid output', async () => {
    const result = await exportSurveyBatchZip(mockDataset, mockTheme);
    assert.strictEqual(result.totalCharts, 2);
    assert.ok(result.blob.length > 0);
  });

  // ========================================================================
  // Test Suite 10: UI Component Exports & Signatures
  // ========================================================================
  console.log('\n--- Test Suite 10: UI Component Exports & Signatures ---');

  runTest('F29-17: BatchExportModal and ExportAuditSummary are valid React component functions', () => {
    assert.strictEqual(typeof BatchExportModal, 'function');
    assert.strictEqual(typeof ExportAuditSummary, 'function');
  });

  runTest('F29-18: Helper utilities are properly exported and callable', () => {
    assert.strictEqual(typeof triggerBlobDownload, 'function');
    assert.strictEqual(typeof downloadSingleChartPNG, 'function');
    assert.strictEqual(typeof dataURLToBlob, 'function');
    assert.strictEqual(typeof wrapCanvasText, 'function');
    assert.strictEqual(typeof exportChartToPng, 'function');
  });

  // ========================================================================
  // Summary
  // ========================================================================
  console.log('\n========================================================================');
  console.log(`  ALL MILESTONE 4 VERIFICATION TESTS COMPLETED: ${passCount} Passed, ${failCount} Failed`);
  console.log('========================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
