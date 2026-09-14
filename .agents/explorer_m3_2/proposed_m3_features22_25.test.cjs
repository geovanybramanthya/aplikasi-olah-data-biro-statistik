/**
 * Verification Test Suite for Features 22, 23, 24, 25 & Studio Components
 */

const assert = require('assert');
const path = require('path');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  MILESTONE 3 EXPLORER 2 VERIFICATION TEST SUITE (Features 22-25)        ');
console.log('========================================================================\n');

// 1. Compile proposed TypeScript source modules in memory via esbuild
console.log('[Setup] Compiling proposed TypeScript modules via esbuild...');
const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from './proposed_colorUtils';
      export * from './proposed_echartsOptions';
      export * from './proposed_ChartCard';
      export * from './proposed_WatermarkFooter';
      export * from './proposed_CustomPaletteModal';
    `,
    resolveDir: __dirname,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  jsx: 'transform',
});

const moduleExports = {};
const runnerFn = new Function('module', 'exports', 'require', bundleResult.outputFiles[0].text);
runnerFn(moduleExports, (moduleExports.exports = {}), require);

const {
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  hexToRgba,
  calculateDynamicPadding,
  wrapLabel,
  determineBadgePlacement,
  generateEChartsOption,
  resolveDimensionality,
  sanitizeExportFilename,
  WATERMARK_DEFAULT_TEXT,
  validatePaletteInput,
} = moduleExports.exports;

console.log('✓ Proposed modules compiled and loaded successfully.\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

// Sample Theme Config
const sampleTheme = {
  fontFamily: 'Poppins',
  titleFontSize: 20,
  labelFontSize: 12,
  activePaletteId: 'undip_navy_gold',
  activePalette: {
    id: 'undip_navy_gold',
    name: 'UNDIP Navy & Gold',
    colors: ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2', '#F9E79F'],
  },
  customPalette: {
    id: 'custom',
    name: 'Kustom BEM UNDIP',
    colors: ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2'],
  },
  globalDimensionality: '2d',
  showWatermark: true,
  watermarkText: 'Biro Statistika BEM Universitas Diponegoro',
};

// Test Suite 1: Color Utilities
console.log('--- Test Suite 1: Color Utilities for 2.5D Shading ---');
runTest('hexToRgb parses 6-digit hex code', () => {
  const rgb = hexToRgb('#002D62');
  assert.strictEqual(rgb.r, 0);
  assert.strictEqual(rgb.g, 45);
  assert.strictEqual(rgb.b, 98);
});

runTest('hexToRgb parses 3-digit shorthand hex', () => {
  const rgb = hexToRgb('#FFF');
  assert.strictEqual(rgb.r, 255);
  assert.strictEqual(rgb.g, 255);
  assert.strictEqual(rgb.b, 255);
});

runTest('lightenColor lightens color towards white', () => {
  const lighter = lightenColor('#002D62', 20);
  assert.ok(lighter.startsWith('#'));
  const rgbLighter = hexToRgb(lighter);
  const rgbOriginal = hexToRgb('#002D62');
  assert.ok(rgbLighter.r >= rgbOriginal.r);
  assert.ok(rgbLighter.g >= rgbOriginal.g);
  assert.ok(rgbLighter.b >= rgbOriginal.b);
});

runTest('darkenColor darkens color towards black', () => {
  const darker = darkenColor('#D4AF37', 20);
  assert.ok(darker.startsWith('#'));
  const rgbDarker = hexToRgb(darker);
  const rgbOriginal = hexToRgb('#D4AF37');
  assert.ok(rgbDarker.r <= rgbOriginal.r);
  assert.ok(rgbDarker.g <= rgbOriginal.g);
  assert.ok(rgbDarker.b <= rgbOriginal.b);
});

// Test Suite 2: Feature 22 - 2D Modern Flat Visual Style
console.log('\n--- Test Suite 2: Feature 22 - 2D Modern Flat Visual Style ---');
runTest('F22: Resolves 2d mode cleanly when global is 2d and override is inherit', () => {
  assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
});

runTest('F22: Generates solid fills from active palette in 2D vertical bar', () => {
  const col = {
    id: 'col1',
    columnIndex: 1,
    cleanName: 'Fakultas',
    selectedChart: 'vertical_bar',
    validResponses: 50,
    distribution: { FSM: 30, FT: 20 },
  };
  const opt = generateEChartsOption(col, sampleTheme, '2d');
  assert.strictEqual(opt.series[0].type, 'bar');
  assert.strictEqual(opt.series[0].data[0].itemStyle.color, '#002D62');
  assert.deepStrictEqual(opt.series[0].data[0].itemStyle.borderRadius, [6, 6, 0, 0]);
  assert.strictEqual(opt.series[0].data[0].itemStyle.shadowBlur, 0);
});

runTest('F22: 2D donut chart sets radius [45%, 72%] and center total count', () => {
  const col = {
    id: 'col2',
    columnIndex: 2,
    cleanName: 'Status',
    selectedChart: 'donut',
    validResponses: 100,
    distribution: { Aktif: 70, Cuti: 30 },
  };
  const opt = generateEChartsOption(col, sampleTheme, '2d');
  assert.strictEqual(opt.series[0].type, 'pie');
  assert.deepStrictEqual(opt.series[0].radius, ['45%', '72%']);
  assert.strictEqual(opt.title.text, '100');
  assert.strictEqual(opt.title.subtext, 'Responden');
});

runTest('F22: Anti-clipping grid.containLabel is true', () => {
  const col = {
    id: 'col3',
    columnIndex: 3,
    cleanName: 'Test',
    selectedChart: 'horizontal_bar',
    validResponses: 10,
    distribution: { A: 10 },
  };
  const opt = generateEChartsOption(col, sampleTheme, '2d');
  assert.strictEqual(opt.grid.containLabel, true);
});

// Test Suite 3: Feature 23 - 2.5D Isometric 3D Visual Style
console.log('\n--- Test Suite 3: Feature 23 - 2.5D Isometric 3D Visual Style ---');
runTest('F23: Resolves 3D mode when global preset is 3d', () => {
  assert.strictEqual(resolveDimensionality('3d', 'inherit'), '3d');
});

runTest('F23: 3D vertical bar specifies linear gradient with lighter top and darker base', () => {
  const col = {
    id: 'col1',
    columnIndex: 1,
    cleanName: 'Fakultas',
    selectedChart: 'vertical_bar',
    validResponses: 50,
    distribution: { FSM: 30, FT: 20 },
  };
  const opt = generateEChartsOption(col, sampleTheme, '3d');
  const grad = opt.series[0].data[0].itemStyle.color;
  assert.strictEqual(grad.type, 'linear');
  assert.strictEqual(grad.x, 0);
  assert.strictEqual(grad.y, 0);
  assert.strictEqual(grad.x2, 0);
  assert.strictEqual(grad.y2, 1);
  assert.strictEqual(grad.colorStops.length, 2);
  assert.strictEqual(grad.colorStops[0].offset, 0);
  assert.strictEqual(grad.colorStops[1].offset, 1);
});

runTest('F23: 3D style specifies soft drop shadow blur <= 8px', () => {
  const col = {
    id: 'col1',
    columnIndex: 1,
    cleanName: 'Fakultas',
    selectedChart: 'vertical_bar',
    validResponses: 50,
    distribution: { FSM: 30 },
  };
  const opt = generateEChartsOption(col, sampleTheme, '3d');
  const shadowBlur = opt.series[0].data[0].itemStyle.shadowBlur;
  assert.ok(shadowBlur > 0 && shadowBlur <= 8);
  assert.strictEqual(opt.series[0].data[0].itemStyle.shadowColor, 'rgba(0, 0, 0, 0.12)');
});

runTest('F23: 3D Donut style uses concentric bevel without angular tilt', () => {
  const col = {
    id: 'col2',
    columnIndex: 2,
    cleanName: 'Status',
    selectedChart: 'donut',
    validResponses: 100,
    distribution: { Aktif: 70, Cuti: 30 },
  };
  const opt = generateEChartsOption(col, sampleTheme, '3d');
  assert.deepStrictEqual(opt.series[0].radius, ['45%', '75%']);
  assert.strictEqual(opt.series[0].data[0].itemStyle.shadowBlur, 8);
});

// Test Suite 4: Feature 24 - Per-Chart Dimensionality Override
console.log('\n--- Test Suite 4: Feature 24 - Per-Chart Dimensionality Override ---');
runTest('F24: Per-chart 3D override takes precedence over global 2D', () => {
  assert.strictEqual(resolveDimensionality('2d', '3d'), '3d');
});

runTest('F24: Per-chart 2D override takes precedence over global 3D', () => {
  assert.strictEqual(resolveDimensionality('3d', '2d'), '2d');
});

runTest('F24: Per-chart inherit setting adopts active global preset', () => {
  assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
  assert.strictEqual(resolveDimensionality('3d', 'inherit'), '3d');
});

runTest('F24: Invalid or undefined override string falls back to global preset', () => {
  assert.strictEqual(resolveDimensionality('2d', 'invalid'), '2d');
  assert.strictEqual(resolveDimensionality('3d', undefined), '3d');
  assert.strictEqual(resolveDimensionality(null, 'inherit'), '2d');
});

// Test Suite 5: Feature 25 - Watermark & Single Chart PNG Export
console.log('\n--- Test Suite 5: Feature 25 & Single PNG Export ---');
runTest('F25: Default watermark text matches official specification', () => {
  assert.strictEqual(WATERMARK_DEFAULT_TEXT, 'Biro Statistika BEM Universitas Diponegoro');
});

runTest('F28: sanitizeExportFilename generates clean 2-digit slugged filename', () => {
  const filename = sanitizeExportFilename(3, 'Tingkat Kepuasan Pelayanan Advokasi BEM 2026?');
  assert.strictEqual(filename, 'chart_03_tingkat_kepuasan_pelayanan_advokasi_bem_.png');
});

// Test Suite 6: Likert & Ranked Bar Options
console.log('\n--- Test Suite 6: Ordered Likert & Ranked Bar Generators ---');
runTest('Ordered Likert generates all 1..max scales even if count is 0', () => {
  const col = {
    id: 'col_likert',
    columnIndex: 4,
    cleanName: 'Kepuasan',
    selectedChart: 'ordered_likert',
    validResponses: 10,
    likertScale: { min: 1, max: 5, labels: { 1: 'Sangat Buruk', 5: 'Sangat Baik' } },
    distribution: { '5': 10 }, // Scores 1, 2, 3, 4 have 0 responses
  };
  const opt = generateEChartsOption(col, sampleTheme, '2d');
  assert.strictEqual(opt.xAxis.data.length, 5);
  assert.strictEqual(opt.series[0].data.length, 5);
  assert.strictEqual(opt.series[0].data[0].value, 0);
  assert.strictEqual(opt.series[0].data[4].value, 10);
});

runTest('Horizontal & Ranked Bar sorts descending so highest count is at the top', () => {
  const col = {
    id: 'col_ranked',
    columnIndex: 5,
    cleanName: 'Program',
    selectedChart: 'ranked_bar',
    validResponses: 100,
    multiSelect: {
      tokenFrequencies: [
        { token: 'Kepanitiaan', count: 80, percentage: 80 },
        { token: 'Seminar', count: 30, percentage: 30 },
        { token: 'Bazar', count: 50, percentage: 50 },
      ],
    },
  };
  const opt = generateEChartsOption(col, sampleTheme, '2d');
  // Highest value (80: Kepanitiaan) should be at top of yAxis inverted stack
  assert.strictEqual(opt.yAxis.data[2], 'Kepanitiaan');
  assert.strictEqual(opt.yAxis.data[0], 'Seminar');
});

// Test Suite 7: Custom Palette Validation
console.log('\n--- Test Suite 7: Custom Palette Validation ---');
runTest('Validates custom palette with >= 5 hex codes and auto-prepends hash', () => {
  const res = validatePaletteInput('002D62, D4AF37, 1E56A0, F39C12, 4A90E2');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.colors.length, 5);
  assert.strictEqual(res.colors[0], '#002D62');
});

runTest('Rejects custom palette with < 5 hex codes with descriptive error', () => {
  const res = validatePaletteInput(['#002D62', '#D4AF37', '#1E56A0']);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors[0].includes('Minimal 5 kode hex warna'));
});

console.log('\n========================================================================');
console.log(`  ALL EXPLORER 2 VERIFICATION TESTS PASSED: ${passedTests}/${totalTests}`);
console.log('========================================================================\n');
