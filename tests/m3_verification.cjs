/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Comprehensive Verification Test Suite (tests/m3_verification.cjs)
 * 
 * Verifies Features 19–25:
 * - Feature 19: Presentation Typography Library (6 Google Fonts & Scaler)
 * - Feature 20: Institutional Color Palettes (4 Curated Palettes & Cycling)
 * - Feature 21: Custom Palette Builder & Strict Validator (>=5 hex codes)
 * - Feature 22: 2D Modern Flat Visual Style
 * - Feature 23: 2.5D Isometric 3D Visual Style (Linear Gradients & Shadows)
 * - Feature 24: Per-Chart Dimensionality Override (2D vs 3D precedence)
 * - Feature 25: Official BEM UNDIP Watermark & Filename Sanitization
 * - All Option Generators (Donut, Horizontal, Vertical, Ranked, Likert)
 * - Mathematical Color Manipulation (lighten, darken, hexToRgb, rgbToHex)
 */

const assert = require('assert');
const path = require('path');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  MILESTONE 3 VERIFICATION TEST SUITE (Theming & Visual Studio)         ');
console.log('========================================================================\n');

// 1. Compile TypeScript source modules via esbuild
console.log('[Setup] Compiling Milestone 3 TypeScript modules in memory via esbuild...');

const srcCoreDir = path.resolve(__dirname, '../src/core/theming');
const srcStudioDir = path.resolve(__dirname, '../src/components/studio');

const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from '${srcCoreDir.replace(/\\/g, '/')}/palettes';
      export * from '${srcCoreDir.replace(/\\/g, '/')}/paletteValidator';
      export * from '${srcCoreDir.replace(/\\/g, '/')}/typography';
      export * from '${srcCoreDir.replace(/\\/g, '/')}/colorUtils';
      export * from '${srcCoreDir.replace(/\\/g, '/')}/echartsOptions';
      export * from '${srcStudioDir.replace(/\\/g, '/')}/ChartCard';
      export * from '${srcStudioDir.replace(/\\/g, '/')}/WatermarkFooter';
      export * from '${srcStudioDir.replace(/\\/g, '/')}/CustomPaletteModal';
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
  // Feature 20: Palettes
  WATERMARK_TEXT,
  INSTITUTIONAL_PALETTES,
  DEFAULT_CUSTOM_PALETTE,
  INSTITUTIONAL_PALETTE_LIST,
  DEFAULT_THEME,
  DEFAULT_THEME_CONFIG,
  getPaletteById,
  resolveThemePalette,
  getAllPalettes,
  getPaletteColor,
  resolveDimensionality,

  // Feature 21: Palette Validator
  HEX_COLOR_REGEX,
  isValidHexColor,
  normalizeHexColor,
  validateCustomPalette,
  createCustomPalette,

  // Feature 19: Typography
  FONT_FAMILIES,
  FONT_DEFINITIONS,
  calculateTypographyScale,
  getCssFontFamily,
  buildGoogleFontsUrl,
  loadGoogleFont,
  loadAllPresentationFonts,

  // Color Utils
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  hexToRgba,

  // Feature 22 & 23: ECharts Options
  generateEChartsOption,
  calculateDynamicPadding,
  wrapLabel,
  determineBadgePlacement,

  // Feature 24, 25 & 28: Studio Exports
  sanitizeExportFilename,
  WATERMARK_DEFAULT_TEXT,
  validatePaletteInput,
} = moduleExports.exports;

console.log('✓ All Milestone 3 modules compiled and loaded successfully.\n');

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

async function runAsyncTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

// Sample Theme Config for Option Testing
const sampleTheme = {
  fontFamily: 'Poppins',
  titleFontSize: 20,
  labelFontSize: 12,
  activePaletteId: 'undip_navy_gold',
  activePalette: INSTITUTIONAL_PALETTES.undip_navy_gold,
  customPalette: DEFAULT_CUSTOM_PALETTE,
  globalDimensionality: '2d',
  showWatermark: true,
  watermarkText: 'Biro Statistika BEM Universitas Diponegoro',
};

(async () => {
  // =========================================================================
  // Test Suite 1: Feature 19 - Presentation Typography Library
  // =========================================================================
  console.log('--- Test Suite 1: Feature 19 - Presentation Typography Library ---');

  runTest('F19-1: Supports all 6 required presentation font families', () => {
    const required = ['Poppins', 'Montserrat', 'Inter', 'Plus Jakarta Sans', 'Roboto', 'Merriweather'];
    for (const font of required) {
      assert.ok(FONT_FAMILIES.includes(font), `Font ${font} must be present in FONT_FAMILIES`);
    }
  });

  runTest('F19-2: Typography scale preset "small" meets minimum legibility guard (>=10px)', () => {
    const scale = calculateTypographyScale('small');
    assert.strictEqual(scale.titleFontSize, 18);
    assert.strictEqual(scale.subtitleFontSize, 13);
    assert.strictEqual(scale.labelFontSize, 11);
    assert.strictEqual(scale.badgeFontSize, 11);
  });

  runTest('F19-3: Typography scale preset "medium" provides balanced default sizing', () => {
    const scale = calculateTypographyScale('medium');
    assert.strictEqual(scale.titleFontSize, 20);
    assert.strictEqual(scale.subtitleFontSize, 14);
    assert.strictEqual(scale.labelFontSize, 12);
    assert.strictEqual(scale.badgeFontSize, 12);
  });

  runTest('F19-4: Typography scale preset "large" scales up for large room presentations', () => {
    const scale = calculateTypographyScale('large');
    assert.strictEqual(scale.titleFontSize, 24);
    assert.strictEqual(scale.subtitleFontSize, 16);
    assert.strictEqual(scale.labelFontSize, 14);
    assert.strictEqual(scale.badgeFontSize, 14);
  });

  runTest('F19-5: Invalid preset string gracefully defaults to medium scale', () => {
    const scale = calculateTypographyScale('unknown_preset');
    assert.strictEqual(scale.titleFontSize, 20);
    assert.strictEqual(scale.labelFontSize, 12);
  });

  runTest('F19-6: FONT_DEFINITIONS contains complete metadata for all 6 fonts', () => {
    for (const font of FONT_FAMILIES) {
      const def = FONT_DEFINITIONS[font];
      assert.ok(def, `Metadata for ${font} must exist`);
      assert.ok(def.cssFamily.includes(font), `cssFamily must contain font name ${font}`);
      assert.ok(Array.isArray(def.weights) && def.weights.length > 0);
      assert.ok(def.googleFontUrlFamily.length > 0);
    }
  });

  runTest('F19-7: getCssFontFamily returns valid CSS family string with fallbacks', () => {
    assert.strictEqual(getCssFontFamily('Plus Jakarta Sans'), "'Plus Jakarta Sans', sans-serif");
    assert.strictEqual(getCssFontFamily('Merriweather'), "'Merriweather', serif");
    assert.strictEqual(getCssFontFamily('NonExistent'), "'Poppins', sans-serif");
  });

  runTest('F19-8: buildGoogleFontsUrl constructs valid Google Fonts CSS2 URL', () => {
    const url = buildGoogleFontsUrl();
    assert.ok(url.startsWith('https://fonts.googleapis.com/css2?'));
    assert.ok(url.includes('family=Poppins'));
    assert.ok(url.includes('family=Plus+Jakarta+Sans'));
    assert.ok(url.includes('display=swap'));
  });

  await runAsyncTest('F19-9: loadGoogleFont and loadAllPresentationFonts run non-blocking in Node', async () => {
    const res1 = await loadGoogleFont('Poppins');
    assert.strictEqual(res1, true);
    const res2 = await loadAllPresentationFonts();
    assert.strictEqual(res2, true);
  });

  // =========================================================================
  // Test Suite 2: Feature 20 - Curated Institutional Palettes
  // =========================================================================
  console.log('\n--- Test Suite 2: Feature 20 - Institutional Color Palettes ---');

  runTest('F20-1: undip_navy_gold contains >= 5 valid hex codes and starts with #002D62, #D4AF37', () => {
    const pal = INSTITUTIONAL_PALETTES.undip_navy_gold;
    assert.ok(pal, 'undip_navy_gold must exist');
    assert.ok(pal.colors.length >= 5, 'Must contain >= 5 colors');
    assert.strictEqual(pal.colors[0], '#002D62');
    assert.strictEqual(pal.colors[1], '#D4AF37');
  });

  runTest('F20-2: modern_emerald contains >= 5 valid hex codes and starts with #0E6251', () => {
    const pal = INSTITUTIONAL_PALETTES.modern_emerald;
    assert.ok(pal, 'modern_emerald must exist');
    assert.ok(pal.colors.length >= 5);
    assert.strictEqual(pal.colors[0], '#0E6251');
  });

  runTest('F20-3: executive_pastel contains >= 5 valid hex codes and starts with #6C88C4', () => {
    const pal = INSTITUTIONAL_PALETTES.executive_pastel;
    assert.ok(pal, 'executive_pastel must exist');
    assert.ok(pal.colors.length >= 5);
    assert.strictEqual(pal.colors[0], '#6C88C4');
  });

  runTest('F20-4: warm_sunset contains >= 5 valid hex codes and starts with #C0392B', () => {
    const pal = INSTITUTIONAL_PALETTES.warm_sunset;
    assert.ok(pal, 'warm_sunset must exist');
    assert.ok(pal.colors.length >= 5);
    assert.strictEqual(pal.colors[0], '#C0392B');
  });

  runTest('F20-5: 100% of institutional color codes pass strict hex regex', () => {
    for (const key of Object.keys(INSTITUTIONAL_PALETTES)) {
      const pal = INSTITUTIONAL_PALETTES[key];
      for (const color of pal.colors) {
        assert.ok(HEX_COLOR_REGEX.test(color), `Color ${color} in ${key} must match HEX regex`);
      }
    }
  });

  runTest('F20-6: getPaletteById resolves known palettes and falls back safely', () => {
    assert.strictEqual(getPaletteById('modern_emerald').id, 'modern_emerald');
    assert.strictEqual(getPaletteById('invalid_palette_id').id, 'undip_navy_gold');
  });

  runTest('F20-7: getPaletteById resolves custom palette correctly', () => {
    const custom = { id: 'custom', name: 'Custom Palette', colors: ['#111111', '#222222', '#333333', '#444444', '#555555'] };
    assert.strictEqual(getPaletteById('custom', custom).name, 'Custom Palette');
  });

  runTest('F20-8: resolveThemePalette respects activePaletteId and customPalette', () => {
    const theme1 = { ...DEFAULT_THEME_CONFIG, activePaletteId: 'executive_pastel' };
    assert.strictEqual(resolveThemePalette(theme1).id, 'executive_pastel');

    const customPal = { id: 'custom', name: 'Kustom Khusus', colors: ['#111111', '#222222', '#333333', '#444444', '#555555'] };
    const theme2 = { ...DEFAULT_THEME_CONFIG, activePaletteId: 'custom', customPalette: customPal };
    assert.strictEqual(resolveThemePalette(theme2).name, 'Kustom Khusus');
  });

  runTest('F20-9: getPaletteColor wraps around deterministically via modulo indexing', () => {
    const pal = INSTITUTIONAL_PALETTES.undip_navy_gold; // 6 colors
    assert.strictEqual(getPaletteColor(pal, 0), pal.colors[0]);
    assert.strictEqual(getPaletteColor(pal, 5), pal.colors[5]);
    assert.strictEqual(getPaletteColor(pal, 6), pal.colors[0]);
    assert.strictEqual(getPaletteColor(pal, 13), pal.colors[1]);
  });

  runTest('F20-10: DEFAULT_THEME and DEFAULT_THEME_CONFIG conform to ThemeConfig contract', () => {
    assert.ok(DEFAULT_THEME, 'DEFAULT_THEME must be exported');
    assert.strictEqual(DEFAULT_THEME.fontFamily, 'Poppins');
    assert.strictEqual(DEFAULT_THEME.titleFontSize, 20);
    assert.strictEqual(DEFAULT_THEME.labelFontSize, 12);
    assert.strictEqual(DEFAULT_THEME.activePaletteId, 'undip_navy_gold');
    assert.strictEqual(DEFAULT_THEME.globalDimensionality, '2d');
    assert.strictEqual(DEFAULT_THEME.showWatermark, true);
    assert.strictEqual(DEFAULT_THEME.watermarkText, 'Biro Statistika BEM Universitas Diponegoro');
    assert.ok(DEFAULT_THEME.customPalette.colors.length >= 5);
  });

  // =========================================================================
  // Test Suite 3: Feature 21 - Custom Palette Builder & Strict Validator
  // =========================================================================
  console.log('\n--- Test Suite 3: Feature 21 - Custom Palette Builder & Validator ---');

  runTest('F21-1: Validates custom palette with exactly 5 valid hex codes', () => {
    const input = ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2'];
    const res = validateCustomPalette(input);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.colors.length, 5);
    assert.strictEqual(res.errors.length, 0);
    assert.ok(res.palette);
    assert.strictEqual(res.palette.isCustom, true);
  });

  runTest('F21-2: Validates custom palette with > 5 valid hex codes', () => {
    const input = ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2', '#AABBCC'];
    const res = validateCustomPalette(input);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.colors.length, 6);
  });

  runTest('F21-3: Rejects custom palette with < 5 hex codes with count error report', () => {
    const input = ['#002D62', '#D4AF37', '#1E56A0', '#F39C12'];
    const res = validateCustomPalette(input);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('Minimal 5')));
    assert.ok(res.errors[0].includes('4/5'));
  });

  runTest('F21-4: Rejects custom palette containing malformed hex strings with token name', () => {
    const input = ['#002D62', '#D4AF37', 'blue', '#F39C12', '#4A90E2'];
    const res = validateCustomPalette(input);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('blue')));
  });

  runTest('F21-5: Auto-prepends "#" if user enters 6 valid hex digits without hash', () => {
    const input = ['002D62', 'D4AF37', '1E56A0', 'F39C12', '4A90E2'];
    const res = validateCustomPalette(input);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.colors[0], '#002D62');
  });

  runTest('F21-6: Auto-prepends "#" for 3-digit shorthand without hash', () => {
    const input = ['F00', '0F0', '00F', '123', '456'];
    const res = validateCustomPalette(input);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.colors[0], '#F00');
  });

  runTest('F21-7: Validates 3-digit shorthand hex codes with hash (#F00)', () => {
    const res = validateCustomPalette(['#F00', '#0F0', '#00F', '#123', '#456']);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.colors.length, 5);
  });

  runTest('F21-8: Parses space-separated hex string input correctly', () => {
    const str = '#002D62 #D4AF37 #1E56A0 #F39C12 #4A90E2';
    const res = validateCustomPalette(str);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.colors.length, 5);
  });

  runTest('F21-9: Parses comma and semicolon separated string input', () => {
    const str = '#002D62, #D4AF37; #1E56A0, #F39C12; #4A90E2';
    const res = validateCustomPalette(str);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.colors.length, 5);
  });

  runTest('F21-10: Normalizes lowercase hex strings to uppercase', () => {
    const input = ['#abcdef', '#123456', '#fedcba', '#002d62', '#d4af37'];
    const res = validateCustomPalette(input);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.colors[0], '#ABCDEF');
  });

  runTest('F21-11: Rejects #GGGGGG and flags invalid characters', () => {
    const res = validateCustomPalette(['#111111', '#222222', '#333333', '#444444', '#GGGGGG']);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('#GGGGGG')));
  });

  runTest('F21-12: createCustomPalette returns ColorPalette or throws', () => {
    const pal = createCustomPalette('Palet Baru', ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2']);
    assert.strictEqual(pal.name, 'Palet Baru');
    assert.strictEqual(pal.isCustom, true);
    assert.throws(() => createCustomPalette('Bad', ['#002D62']));
  });

  // =========================================================================
  // Test Suite 4: Color Utilities & 2.5D Shading
  // =========================================================================
  console.log('\n--- Test Suite 4: Color Manipulation Utilities ---');

  runTest('hexToRgb parses 6-digit hex code accurately', () => {
    const rgb = hexToRgb('#002D62');
    assert.strictEqual(rgb.r, 0);
    assert.strictEqual(rgb.g, 45);
    assert.strictEqual(rgb.b, 98);
  });

  runTest('hexToRgb parses 3-digit shorthand hex (#FFF)', () => {
    const rgb = hexToRgb('#FFF');
    assert.strictEqual(rgb.r, 255);
    assert.strictEqual(rgb.g, 255);
    assert.strictEqual(rgb.b, 255);
  });

  runTest('rgbToHex converts RGB components to uppercase hex', () => {
    assert.strictEqual(rgbToHex(0, 45, 98), '#002D62');
    assert.strictEqual(rgbToHex(255, 255, 255), '#FFFFFF');
  });

  runTest('lightenColor increases brightness towards white', () => {
    const lighter = lightenColor('#002D62', 20);
    assert.ok(lighter.startsWith('#'));
    const rgbLighter = hexToRgb(lighter);
    const rgbOrig = hexToRgb('#002D62');
    assert.ok(rgbLighter.r >= rgbOrig.r);
    assert.ok(rgbLighter.g >= rgbOrig.g);
    assert.ok(rgbLighter.b >= rgbOrig.b);
  });

  runTest('darkenColor decreases brightness towards black', () => {
    const darker = darkenColor('#D4AF37', 20);
    assert.ok(darker.startsWith('#'));
    const rgbDarker = hexToRgb(darker);
    const rgbOrig = hexToRgb('#D4AF37');
    assert.ok(rgbDarker.r <= rgbOrig.r);
    assert.ok(rgbDarker.g <= rgbOrig.g);
    assert.ok(rgbDarker.b <= rgbOrig.b);
  });

  runTest('hexToRgba formats rgba string with clamped alpha', () => {
    assert.strictEqual(hexToRgba('#002D62', 0.5), 'rgba(0, 45, 98, 0.5)');
    assert.strictEqual(hexToRgba('#002D62', 1.5), 'rgba(0, 45, 98, 1)');
  });

  // =========================================================================
  // Test Suite 5: Feature 22 - 2D Modern Flat Visual Style
  // =========================================================================
  console.log('\n--- Test Suite 5: Feature 22 - 2D Modern Flat Visual Style ---');

  runTest('F22-1: 2D vertical bar specifies solid fill with zero shadow blur', () => {
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

  runTest('F22-2: 2D donut chart sets radius [45%, 72%] and total count center title', () => {
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
    assert.strictEqual(opt.series[0].data[0].itemStyle.color, '#002D62');
  });

  runTest('F22-3: Anti-clipping grid.containLabel is true across bar charts', () => {
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

  // =========================================================================
  // Test Suite 6: Feature 23 - 2.5D Isometric 3D Visual Style
  // =========================================================================
  console.log('\n--- Test Suite 6: Feature 23 - 2.5D Isometric 3D Visual Style ---');

  runTest('F23-1: 3D vertical bar specifies linear gradient with lighter top and darker base', () => {
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

  runTest('F23-2: 3D style specifies directional drop shadow blur <= 8px', () => {
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

  runTest('F23-3: 3D Donut style uses concentric bevel radius [45%, 75%] with shadow', () => {
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

  // =========================================================================
  // Test Suite 7: Feature 24 - Per-Chart Dimensionality Override
  // =========================================================================
  console.log('\n--- Test Suite 7: Feature 24 - Per-Chart Dimensionality Override ---');

  runTest('F24-1: Per-chart 3D override takes precedence over global 2D', () => {
    assert.strictEqual(resolveDimensionality('2d', '3d'), '3d');
  });

  runTest('F24-2: Per-chart 2D override takes precedence over global 3D', () => {
    assert.strictEqual(resolveDimensionality('3d', '2d'), '2d');
  });

  runTest('F24-3: Per-chart inherit setting adopts active global preset', () => {
    assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
    assert.strictEqual(resolveDimensionality('3d', 'inherit'), '3d');
  });

  runTest('F24-4: Undefined or invalid override safely falls back to global preset', () => {
    assert.strictEqual(resolveDimensionality('2d', undefined), '2d');
    assert.strictEqual(resolveDimensionality('3d', null), '3d');
    assert.strictEqual(resolveDimensionality('2d', 'invalid_mode'), '2d');
  });

  // =========================================================================
  // Test Suite 8: Feature 25 & 28 - Watermark & Filename Sanitization
  // =========================================================================
  console.log('\n--- Test Suite 8: Feature 25 & Single PNG Export ---');

  runTest('F25-1: WATERMARK_TEXT and WATERMARK_DEFAULT_TEXT match official specification', () => {
    assert.strictEqual(WATERMARK_TEXT, 'Biro Statistika BEM Universitas Diponegoro');
    assert.strictEqual(WATERMARK_DEFAULT_TEXT, 'Biro Statistika BEM Universitas Diponegoro');
  });

  runTest('F28-1: sanitizeExportFilename generates clean 2-digit slugged filename', () => {
    const filename = sanitizeExportFilename(3, 'Tingkat Kepuasan Pelayanan Advokasi BEM 2026?');
    assert.strictEqual(filename, 'chart_03_tingkat_kepuasan_pelayanan_advokasi_bem_.png');
  });

  // =========================================================================
  // Test Suite 9: Specialized Chart Generators (Ranked Bar & Ordered Likert)
  // =========================================================================
  console.log('\n--- Test Suite 9: Specialized Chart Generators ---');

  runTest('Ordered Likert generates all 1..max scales even if some response counts are 0', () => {
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
    // Inverted Y-axis stack: top category is at the end of the array
    assert.strictEqual(opt.yAxis.data[2], 'Kepanitiaan');
    assert.strictEqual(opt.yAxis.data[0], 'Seminar');
  });

  runTest('wrapLabel splits long labels cleanly at maxCharsPerLine', () => {
    const lines = wrapLabel('Fakultas Perikanan dan Ilmu Kelautan Universitas Diponegoro', 22);
    assert.ok(lines.length >= 2);
    assert.ok(lines.every((line) => line.length <= 30));
  });

  runTest('calculateDynamicPadding adjusts left margin for horizontal bars', () => {
    const padding = calculateDynamicPadding(['Fakultas Perikanan dan Ilmu Kelautan'], 'horizontal_bar');
    assert.ok(padding.left >= 80 && padding.left <= 260);
  });

  console.log('\n========================================================================');
  console.log(`  ALL MILESTONE 3 VERIFICATION TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('========================================================================\n');
})();
