/**
 * Adversarial Challenger Test Suite for Milestone 3
 * Agent: reviewer_m3_1 (Reviewer & Adversarial Critic)
 *
 * Stress-tests:
 * 1. Palette integrity, color definitions, and modulo wrap bounds (negative, zero, large, empty)
 * 2. Custom Palette Validator attack surface:
 *    - 3-digit, 6-digit, 8-digit RGBA, malformed tokens, injection strings
 *    - Auto-prepending, uppercase normalization, mixed delimiters
 *    - Boundary counts (0, 1, 4, 5, 6), Indonesian error messages
 * 3. Typography presentation library:
 *    - 6 fonts, CSS family strings, category taxonomy, scale presets with fallbacks
 * 4. Color math utilities:
 *    - Hex to RGB, RGB to Hex, bounds clamping (negative / >255), lighten / darken extremes
 * 5. Dimensionality override matrix (global vs cardOverride resolution)
 * 6. ECharts Option generators resilience under extreme data shapes (0 responses, empty dist, long labels)
 */

const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  CHALLENGER M3-1 ADVERSARIAL STRESS-TEST SUITE');
console.log('  Biro Statistik BEM Universitas Diponegoro');
console.log('========================================================================\n');

// 1. Compile TypeScript source modules in-memory
console.log('[Setup] Compiling Milestone 3 modules via esbuild...');
const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from './src/core/theming/palettes';
      export * from './src/core/theming/paletteValidator';
      export * from './src/core/theming/typography';
      export * from './src/core/theming/colorUtils';
      export * from './src/core/theming/echartsOptions';
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
  // Palettes
  WATERMARK_TEXT,
  INSTITUTIONAL_PALETTES,
  DEFAULT_CUSTOM_PALETTE,
  INSTITUTIONAL_PALETTE_LIST,
  DEFAULT_THEME_CONFIG,
  getPaletteById,
  resolveThemePalette,
  getAllPalettes,
  getPaletteColor,
  resolveDimensionality,

  // Validator
  HEX_COLOR_REGEX,
  isValidHexColor,
  normalizeHexColor,
  validateCustomPalette,
  createCustomPalette,

  // Typography
  FONT_FAMILIES,
  FONT_DEFINITIONS,
  calculateTypographyScale,
  getCssFontFamily,
  buildGoogleFontsUrl,

  // Color Utils
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  hexToRgba,

  // Option generator
  generateEChartsOption,
  calculateDynamicPadding,
  wrapLabel,
  determineBadgePlacement,
} = moduleExports.exports;

console.log('✓ Modules compiled successfully.\n');

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

// =========================================================================
// Section 1: Color Palette Modulo Math & Boundary Stress Tests
// =========================================================================
console.log('--- Section 1: Palette Modulo Math & Boundary Stress Tests ---');

runTest('1.1: Institutional palettes all contain >= 6 uppercase hex codes matching strict regex', () => {
  const ids = ['undip_navy_gold', 'modern_emerald', 'executive_pastel', 'warm_sunset'];
  for (const id of ids) {
    const pal = INSTITUTIONAL_PALETTES[id];
    assert.ok(pal, `Palette ${id} must exist`);
    assert.ok(pal.colors.length >= 6, `Palette ${id} must have >= 6 colors, got ${pal.colors.length}`);
    for (const color of pal.colors) {
      assert.ok(HEX_COLOR_REGEX.test(color), `Color ${color} in ${id} must match HEX regex`);
      assert.strictEqual(color, color.toUpperCase(), `Color ${color} must be uppercase`);
    }
  }
});

runTest('1.2: getPaletteColor resilience against extreme negative, zero, and huge indices', () => {
  const pal = INSTITUTIONAL_PALETTES.undip_navy_gold;
  // 0 index
  assert.strictEqual(getPaletteColor(pal, 0), '#002D62');
  // Modulo positive
  assert.strictEqual(getPaletteColor(pal, 6), '#002D62');
  assert.strictEqual(getPaletteColor(pal, 12), '#002D62');
  assert.strictEqual(getPaletteColor(pal, 13), '#D4AF37');
  // Negative indices wrapped via Math.abs
  assert.strictEqual(getPaletteColor(pal, -1), '#D4AF37');
  assert.strictEqual(getPaletteColor(pal, -6), '#002D62');
  assert.strictEqual(getPaletteColor(pal, -13), '#D4AF37');
  // Huge index
  assert.strictEqual(getPaletteColor(pal, 1000000), pal.colors[1000000 % 6]);
});

runTest('1.3: getPaletteColor fallback on null or empty palette object', () => {
  assert.strictEqual(getPaletteColor(null, 0), '#002D62');
  assert.strictEqual(getPaletteColor(undefined, 5), '#002D62');
  assert.strictEqual(getPaletteColor({ id: 'bad', name: 'bad', colors: [] }, 0), '#002D62');
});

runTest('1.4: getPaletteById safe fallback on unknown or invalid palette id', () => {
  const fallback = getPaletteById('non_existent_palette');
  assert.strictEqual(fallback.id, 'undip_navy_gold');
  assert.strictEqual(fallback.colors[0], '#002D62');
});

// =========================================================================
// Section 2: Custom Palette Validator Attack Surface & Edge Cases
// =========================================================================
console.log('\n--- Section 2: Custom Palette Validator Attack Surface ---');

runTest('2.1: Rejects empty, null, undefined, and whitespace-only inputs', () => {
  const inputs = ['', [], null, undefined, '   \t\n  '];
  for (const inp of inputs) {
    const res = validateCustomPalette(inp);
    assert.strictEqual(res.isValid, false, `Input ${JSON.stringify(inp)} must be invalid`);
    assert.strictEqual(res.colors.length, 0);
    assert.ok(res.errors.length > 0);
  }
});

runTest('2.2: Rejects inputs with 1, 2, 3, 4 valid colors with Indonesian count error', () => {
  for (let count = 1; count <= 4; count++) {
    const colors = ['#111111', '#222222', '#333333', '#444444'].slice(0, count);
    const res = validateCustomPalette(colors);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.colors.length, count);
    assert.ok(
      res.errors.includes(`Minimal 5 kode hex warna valid diperlukan (saat ini: ${count}/5)`),
      `Error must match exact format for count ${count}`
    );
  }
});

runTest('2.3: Rejects 8-digit RGBA hex (#002D62FF) and 4/5-digit hex codes', () => {
  const badCodes = ['#002D62FF', '#1234', '#12345', '1234', '12345', '#1234567'];
  for (const code of badCodes) {
    const res = validateCustomPalette(['#111111', '#222222', '#333333', '#444444', code]);
    assert.strictEqual(res.isValid, false, `Code ${code} must be rejected`);
    assert.ok(
      res.errors.some((e) => e.includes(code) || e.includes('Format hex tidak valid')),
      `Error must mention invalid format for ${code}`
    );
  }
});

runTest('2.4: 5 valid colors + 1 corrupt token -> strictly invalid (errors.length !== 0)', () => {
  const res = validateCustomPalette([
    '#002D62',
    '#D4AF37',
    '#1E56A0',
    '#F39C12',
    '#4A90E2',
    'INVALID_HEX_STRING',
  ]);
  assert.strictEqual(res.isValid, false, 'Palette with even one invalid code must be rejected');
  assert.strictEqual(res.colors.length, 5, '5 valid colors extracted');
  assert.ok(res.errors.some((e) => e.includes('INVALID_HEX_STRING')));
});

runTest('2.5: Auto-prepends "#" on 3-char and 6-char hex tokens without hash and normalizes to uppercase', () => {
  const mixed = ['002d62', 'd4af37', 'f00', '0f0', '1e56a0'];
  const res = validateCustomPalette(mixed);
  assert.strictEqual(res.isValid, true);
  assert.deepStrictEqual(res.colors, ['#002D62', '#D4AF37', '#F00', '#0F0', '#1E56A0']);
});

runTest('2.6: Handles complex mixed delimiters (commas, spaces, semicolons, tabs, newlines, pipes)', () => {
  const raw = '#002D62, #D4AF37; #1E56A0\n#F39C12\t#4A90E2 | #F9E79F';
  const res = validateCustomPalette(raw);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.colors.length, 6);
  assert.strictEqual(res.colors[0], '#002D62');
  assert.strictEqual(res.colors[5], '#F9E79F');
});

runTest('2.7: createCustomPalette throws descriptive error on invalid input, succeeds on valid', () => {
  assert.throws(
    () => createCustomPalette('Bad', ['#002D62', '#D4AF37']),
    (err) => err.message.includes('Gagal membuat palet kustom') && err.message.includes('2/5')
  );
  const ok = createCustomPalette('Biro Stat', [
    '#002D62',
    '#D4AF37',
    '#1E56A0',
    '#F39C12',
    '#4A90E2',
  ]);
  assert.strictEqual(ok.name, 'Biro Stat');
  assert.strictEqual(ok.colors.length, 5);
  assert.strictEqual(ok.isCustom, true);
});

// =========================================================================
// Section 3: Typography Presentation Library & Scaler Presets
// =========================================================================
console.log('\n--- Section 3: Typography Library & Scaler Presets ---');

runTest('3.1: Exactly 6 presentation fonts supported with valid metadata', () => {
  assert.strictEqual(FONT_FAMILIES.length, 6);
  const expected = ['Poppins', 'Montserrat', 'Inter', 'Plus Jakarta Sans', 'Roboto', 'Merriweather'];
  assert.deepStrictEqual([...FONT_FAMILIES], expected);

  for (const font of FONT_FAMILIES) {
    const def = FONT_DEFINITIONS[font];
    assert.ok(def, `Metadata for ${font} must exist`);
    assert.ok(def.weights.includes(400) || def.weights.includes(500));
    assert.ok(def.cssFamily.length > 0);
  }
});

runTest('3.2: Typography scales enforce legibility guard and title caps', () => {
  // Small preset: label >= 10px
  const sm = calculateTypographyScale('small');
  assert.ok(sm.labelFontSize >= 10, 'Small label must be >= 10px');
  assert.ok(sm.badgeFontSize >= 10, 'Small badge must be >= 10px');
  assert.strictEqual(sm.titleFontSize, 18);

  // Large preset: title <= 28px
  const lg = calculateTypographyScale('large');
  assert.ok(lg.titleFontSize <= 28, 'Large title must be <= 28px');
  assert.strictEqual(lg.titleFontSize, 24);

  // Fallbacks for unusual or empty strings
  const fb1 = calculateTypographyScale('unknown');
  const fb2 = calculateTypographyScale('');
  const fb3 = calculateTypographyScale(null);
  assert.strictEqual(fb1.titleFontSize, 20);
  assert.strictEqual(fb2.titleFontSize, 20);
  assert.strictEqual(fb3.titleFontSize, 20);
});

runTest('3.3: getCssFontFamily handles valid and invalid font names gracefully', () => {
  assert.strictEqual(getCssFontFamily('Plus Jakarta Sans'), "'Plus Jakarta Sans', sans-serif");
  assert.strictEqual(getCssFontFamily('Merriweather'), "'Merriweather', serif");
  assert.strictEqual(getCssFontFamily('RandomFont'), "'Poppins', sans-serif");
});

// =========================================================================
// Section 4: Color Utilities Mathematical Boundaries
// =========================================================================
console.log('\n--- Section 4: Color Utilities Mathematical Boundaries ---');

runTest('4.1: hexToRgb parsing and invalid fallback', () => {
  assert.deepStrictEqual(hexToRgb('#000000'), { r: 0, g: 0, b: 0 });
  assert.deepStrictEqual(hexToRgb('#FFFFFF'), { r: 255, g: 255, b: 255 });
  assert.deepStrictEqual(hexToRgb('#FFF'), { r: 255, g: 255, b: 255 });
  assert.deepStrictEqual(hexToRgb('#002D62'), { r: 0, g: 45, b: 98 });
  // Fallback on corrupt input to UNDIP Navy { r: 0, g: 45, b: 98 }
  assert.deepStrictEqual(hexToRgb('invalid'), { r: 0, g: 45, b: 98 });
  assert.deepStrictEqual(hexToRgb('#12345'), { r: 0, g: 45, b: 98 });
});

runTest('4.2: rgbToHex clamps out-of-bounds inputs', () => {
  assert.strictEqual(rgbToHex(-50, 300, 128), '#00FF80');
  assert.strictEqual(rgbToHex(0, 0, 0), '#000000');
  assert.strictEqual(rgbToHex(255, 255, 255), '#FFFFFF');
});

runTest('4.3: lightenColor and darkenColor boundary clamping (0% and 100%)', () => {
  // 0% change
  assert.strictEqual(lightenColor('#002D62', 0), '#002D62');
  assert.strictEqual(darkenColor('#002D62', 0), '#002D62');
  // 100% change
  assert.strictEqual(lightenColor('#002D62', 100), '#FFFFFF');
  assert.strictEqual(darkenColor('#002D62', 100), '#000000');
  // Out-of-bounds percent clamping
  assert.strictEqual(lightenColor('#002D62', 150), '#FFFFFF');
  assert.strictEqual(darkenColor('#002D62', -20), '#002D62');
});

runTest('4.4: hexToRgba clamps alpha between 0 and 1', () => {
  assert.strictEqual(hexToRgba('#002D62', 0.75), 'rgba(0, 45, 98, 0.75)');
  assert.strictEqual(hexToRgba('#002D62', 2.0), 'rgba(0, 45, 98, 1)');
  assert.strictEqual(hexToRgba('#002D62', -0.5), 'rgba(0, 45, 98, 0)');
});

// =========================================================================
// Section 5: Dimensionality Override Resolution Matrix
// =========================================================================
console.log('\n--- Section 5: Dimensionality Override Resolution Matrix ---');

runTest('5.1: Complete matrix of resolveDimensionality(globalMode, cardOverride)', () => {
  const matrix = [
    { global: '2d', override: '3d', expected: '3d' },
    { global: '3d', override: '2d', expected: '2d' },
    { global: '2d', override: 'inherit', expected: '2d' },
    { global: '3d', override: 'inherit', expected: '3d' },
    { global: '2d', override: undefined, expected: '2d' },
    { global: '3d', override: undefined, expected: '3d' },
    { global: '2d', override: null, expected: '2d' },
    { global: '3d', override: null, expected: '3d' },
    { global: '2d', override: 'invalid_val', expected: '2d' },
    { global: '3d', override: 'invalid_val', expected: '3d' },
    { global: null, override: undefined, expected: '2d' },
    { global: undefined, override: '3d', expected: '3d' },
  ];

  for (const { global, override, expected } of matrix) {
    const actual = resolveDimensionality(global, override);
    assert.strictEqual(
      actual,
      expected,
      `resolveDimensionality(${global}, ${override}) should be ${expected}, got ${actual}`
    );
  }
});

// =========================================================================
// Section 6: ECharts Option Generator Stress Tests
// =========================================================================
console.log('\n--- Section 6: ECharts Option Generator Stress Tests ---');

const testTheme = {
  ...DEFAULT_THEME_CONFIG,
  fontFamily: 'Inter',
  titleFontSize: 20,
  labelFontSize: 12,
  activePaletteId: 'modern_emerald',
  activePalette: INSTITUTIONAL_PALETTES.modern_emerald,
};

runTest('6.1: Empty distribution and 0 valid responses render without throwing', () => {
  const emptyCol = {
    id: 'empty_col',
    columnIndex: 1,
    cleanName: 'Pertanyaan Kosong',
    type: 'NOMINAL_DEMOGRAPHIC',
    selectedChart: 'donut',
    validResponses: 0,
    distribution: {},
  };
  const opt2d = generateEChartsOption(emptyCol, testTheme, '2d');
  assert.ok(opt2d.series && opt2d.series.length > 0);
  assert.strictEqual(opt2d.title.text, '0');

  const opt3d = generateEChartsOption(emptyCol, testTheme, '3d');
  assert.ok(opt3d.series && opt3d.series.length > 0);
});

runTest('6.2: Extremely long category label wrapping and dynamic padding calculation', () => {
  const longName = 'Program Sosialisasi dan Edukasi Advokasi Terpadu Mahasiswa Baru Fakultas Kedokteran Gigi Universitas Diponegoro 2026';
  const lines = wrapLabel(longName, 22);
  assert.ok(lines.length >= 4, `Long label should wrap into multiple lines, got ${lines.length}`);

  const padding = calculateDynamicPadding([longName], 'horizontal_bar');
  assert.strictEqual(padding.left, 260, 'Should cap left padding at 260px');
});

runTest('6.3: Likert scale preserves 1..max order with 0-response gaps', () => {
  const gapLikert = {
    id: 'likert_gaps',
    columnIndex: 2,
    cleanName: 'Kepuasan Fasilitas Kampus',
    type: 'LIKERT_SCALE',
    selectedChart: 'ordered_likert',
    validResponses: 25,
    likertScale: {
      min: 1,
      max: 5,
      labels: { 1: 'Sangat Buruk', 2: 'Buruk', 3: 'Cukup', 4: 'Baik', 5: 'Sangat Baik' },
    },
    // Only 2 and 5 have counts; 1, 3, 4 have 0
    distribution: { '2': 5, '5': 20 },
  };

  const opt = generateEChartsOption(gapLikert, testTheme, '3d');
  assert.strictEqual(opt.xAxis.data.length, 5);
  assert.strictEqual(opt.series[0].data.length, 5);
  assert.strictEqual(opt.series[0].data[0].value, 0, 'Score 1 count must be 0');
  assert.strictEqual(opt.series[0].data[1].value, 5, 'Score 2 count must be 5');
  assert.strictEqual(opt.series[0].data[2].value, 0, 'Score 3 count must be 0');
  assert.strictEqual(opt.series[0].data[3].value, 0, 'Score 4 count must be 0');
  assert.strictEqual(opt.series[0].data[4].value, 20, 'Score 5 count must be 20');
});

runTest('6.4: Official Watermark Text matches exact institutional specification', () => {
  assert.strictEqual(WATERMARK_TEXT, 'Biro Statistik BEM Universitas Diponegoro');
});

console.log('\n========================================================================');
console.log(`  ALL CHALLENGER M3 TESTS PASSED: ${passedTests}/${totalTests}`);
console.log('========================================================================\n');
