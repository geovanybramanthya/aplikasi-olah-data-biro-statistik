/**
 * Proposed Milestone 3 Verification Test Suite
 * Validates Features 19, 20, 21:
 * - Feature 19: Typography Library (6 Presentation Fonts, Scale Presets, Google Fonts Loader)
 * - Feature 20: Institutional Color Palettes (4 Curated Palettes, >= 5 Hex, Theme Resolution)
 * - Feature 21: Custom Palette Builder & Strict Validator (>= 5 Hex, Auto-hash, Error Reporting)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('========================================================================');
console.log('  MILESTONE 3 VERIFICATION TEST SUITE (Theming, Palettes & Typography)  ');
console.log('========================================================================\n');

// 1. Compile proposed TypeScript source modules in memory via esbuild
console.log('[Setup] Compiling proposed TypeScript modules via esbuild...');
const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from './proposed_palettes';
      export * from './proposed_paletteValidator';
      export * from './proposed_typography';
    `,
    resolveDir: __dirname,
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
  // Palettes (Feature 20)
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

  // Palette Validator (Feature 21)
  HEX_COLOR_REGEX,
  isValidHexColor,
  normalizeHexColor,
  validateCustomPalette,
  createCustomPalette,

  // Typography (Feature 19)
  FONT_FAMILIES,
  FONT_DEFINITIONS,
  calculateTypographyScale,
  getCssFontFamily,
  buildGoogleFontsUrl,
  loadGoogleFont,
  loadAllPresentationFonts,
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

(async () => {
  // -------------------------------------------------------------
  // Test Suite 1: Feature 20 - Institutional Color Palettes
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Feature 20 - Institutional Color Palettes ---');

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

  runTest('F20-6: getPaletteById resolves known palettes and falls back to undip_navy_gold for unknown', () => {
    assert.strictEqual(getPaletteById('modern_emerald').id, 'modern_emerald');
    assert.strictEqual(getPaletteById('unknown_id').id, 'undip_navy_gold');
  });

  runTest('F20-7: getPaletteById resolves custom palette correctly', () => {
    const custom = { id: 'custom', name: 'User Palette', colors: ['#111111', '#222222', '#333333', '#444444', '#555555'] };
    assert.strictEqual(getPaletteById('custom', custom).name, 'User Palette');
  });

  runTest('F20-8: resolveThemePalette respects activePaletteId', () => {
    const theme = { ...DEFAULT_THEME_CONFIG, activePaletteId: 'executive_pastel' };
    const resolved = resolveThemePalette(theme);
    assert.strictEqual(resolved.id, 'executive_pastel');
  });

  runTest('F20-9: getPaletteColor wraps around via modulo indexing', () => {
    const pal = INSTITUTIONAL_PALETTES.undip_navy_gold; // 6 colors
    assert.strictEqual(getPaletteColor(pal, 0), pal.colors[0]);
    assert.strictEqual(getPaletteColor(pal, 6), pal.colors[0]);
    assert.strictEqual(getPaletteColor(pal, 7), pal.colors[1]);
  });

  runTest('F20-10: DEFAULT_THEME_CONFIG conforms strictly to ThemeConfig contract', () => {
    assert.strictEqual(DEFAULT_THEME_CONFIG.fontFamily, 'Poppins');
    assert.strictEqual(DEFAULT_THEME_CONFIG.titleFontSize, 20);
    assert.strictEqual(DEFAULT_THEME_CONFIG.labelFontSize, 12);
    assert.strictEqual(DEFAULT_THEME_CONFIG.activePaletteId, 'undip_navy_gold');
    assert.strictEqual(DEFAULT_THEME_CONFIG.globalDimensionality, '2d');
    assert.strictEqual(DEFAULT_THEME_CONFIG.showWatermark, true);
    assert.strictEqual(DEFAULT_THEME_CONFIG.watermarkText, 'Biro Statistika BEM Universitas Diponegoro');
    assert.ok(DEFAULT_THEME_CONFIG.customPalette.colors.length >= 5);
  });

  runTest('F20-11: resolveDimensionality handles global mode and card overrides', () => {
    assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
    assert.strictEqual(resolveDimensionality('2d', '3d'), '3d');
    assert.strictEqual(resolveDimensionality('3d', '2d'), '2d');
  });

  // -------------------------------------------------------------
  // Test Suite 2: Feature 21 - Custom Palette Builder & Strict Validator
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: Feature 21 - Custom Palette Builder & Validator ---');

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

  runTest('F21-3: Rejects custom palette with < 5 hex codes with clear error', () => {
    const input = ['#002D62', '#D4AF37', '#1E56A0', '#F39C12'];
    const res = validateCustomPalette(input);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('Minimal 5')));
    assert.ok(res.errors[0].includes('4/5'));
  });

  runTest('F21-4: Rejects custom palette containing malformed hex strings', () => {
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

  runTest('F21-11: Rejects #GGGGGG and malformed hex', () => {
    const res = validateCustomPalette(['#111111', '#222222', '#333333', '#444444', '#GGGGGG']);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('#GGGGGG')));
  });

  runTest('F21-12: createCustomPalette returns ColorPalette or throws', () => {
    const pal = createCustomPalette('My Pal', ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2']);
    assert.strictEqual(pal.name, 'My Pal');
    assert.strictEqual(pal.isCustom, true);
    assert.throws(() => createCustomPalette('Bad', ['#002D62']));
  });

  // -------------------------------------------------------------
  // Test Suite 3: Feature 19 - Typography Library & Dynamic Loader
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Feature 19 - Typography Library ---');

  runTest('F19-1: Supports all 6 required presentation font families', () => {
    const required = ['Poppins', 'Montserrat', 'Inter', 'Plus Jakarta Sans', 'Roboto', 'Merriweather'];
    for (const font of required) {
      assert.ok(FONT_FAMILIES.includes(font), `Font ${font} must be in FONT_FAMILIES`);
    }
  });

  runTest('F19-2: Typography scale preset "small" meets minimum 10px legibility guard', () => {
    const scale = calculateTypographyScale('small');
    assert.ok(scale.titleFontSize >= 16);
    assert.ok(scale.subtitleFontSize >= 12);
    assert.ok(scale.labelFontSize >= 10);
    assert.ok(scale.badgeFontSize >= 10);
  });

  runTest('F19-3: Typography scale preset "medium" provides balanced presentation sizing', () => {
    const scale = calculateTypographyScale('medium');
    assert.strictEqual(scale.titleFontSize, 20);
    assert.strictEqual(scale.subtitleFontSize, 14);
    assert.strictEqual(scale.labelFontSize, 12);
    assert.strictEqual(scale.badgeFontSize, 12);
  });

  runTest('F19-4: Typography scale preset "large" scales up for slide presentations', () => {
    const scale = calculateTypographyScale('large');
    assert.strictEqual(scale.titleFontSize, 24);
    assert.strictEqual(scale.labelFontSize, 14);
  });

  runTest('F19-5: Default typography scale falls back to medium on invalid preset', () => {
    const scale = calculateTypographyScale('invalid');
    assert.strictEqual(scale.titleFontSize, 20);
  });

  runTest('F19-6: FONT_DEFINITIONS provides complete metadata and valid cssFamily for all 6 fonts', () => {
    for (const font of FONT_FAMILIES) {
      const def = FONT_DEFINITIONS[font];
      assert.ok(def, `Metadata for ${font} must exist`);
      assert.ok(def.cssFamily.includes(font), `cssFamily must contain ${font}`);
      assert.ok(Array.isArray(def.weights) && def.weights.length > 0);
    }
  });

  runTest('F19-7: getCssFontFamily returns correct CSS string and defaults safely', () => {
    assert.strictEqual(getCssFontFamily('Plus Jakarta Sans'), "'Plus Jakarta Sans', sans-serif");
    assert.strictEqual(getCssFontFamily('Merriweather'), "'Merriweather', serif");
    assert.strictEqual(getCssFontFamily('NonExistent'), "'Poppins', sans-serif");
  });

  runTest('F19-8: buildGoogleFontsUrl produces valid Google Fonts CSS2 query string', () => {
    const url = buildGoogleFontsUrl();
    assert.ok(url.startsWith('https://fonts.googleapis.com/css2?'));
    assert.ok(url.includes('family=Poppins'));
    assert.ok(url.includes('family=Plus+Jakarta+Sans'));
    assert.ok(url.includes('display=swap'));
  });

  await runAsyncTest('F19-9: loadGoogleFont and loadAllPresentationFonts execute non-blocking in Node', async () => {
    const res1 = await loadGoogleFont('Poppins');
    assert.strictEqual(res1, true);
    const res2 = await loadAllPresentationFonts();
    assert.strictEqual(res2, true);
  });

  console.log('\n========================================================================');
  console.log(`  ALL MILESTONE 3 VERIFICATION TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('========================================================================\n');
})();
