/**
 * Challenger Adversarial Test Suite for Milestone 3
 * Agent: challenger_m3_2 (Adversarial Empirical Review)
 * 
 * Verifies and stress-tests:
 * 1. Extreme inputs on all 5 chart types in both 2D and 2.5D 3D modes:
 *    - 0 responses / empty distributions
 *    - 100+ categories with dynamic width and height scaling
 *    - Extreme label lengths (200+, 500+ chars, spaces, no spaces, Unicode)
 *    - Special characters & XSS / injection vectors in category labels
 * 2. Anti-clipping geometries, grid containment, and dynamic padding bounds:
 *    - Strict assertion: grid.containLabel === true across all cartesian charts
 *    - Dynamic padding bounds never produce negative margins or NaN
 * 3. 2.5D Isometric 3D compliance & Distorted 3D pie wedge prevention:
 *    - Concentric donut bevel only (blocking distorted 3D pie wedges and pie3D)
 *    - 2.5D shading gradients and shadow bounds
 * 4. Dimensionality override hierarchy:
 *    - Card override ('2d' | '3d') strictly overrides global preset ('2d' | '3d')
 *    - 'inherit' / undefined / null cleanly defaults to global preset
 * 5. Official institutional watermark positioning and visibility toggle:
 *    - Watermark footer component rendering and fallback behavior
 *    - showWatermark toggle (renders when true, null/empty when false)
 *    - Dynamic font synchronization with active presentation theme
 * 6. Mathematical color utility and palette validator hardening
 */

const assert = require('assert');
const path = require('path');
const esbuild = require('esbuild');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

console.log('========================================================================');
console.log('  CHALLENGER M3-2 ADVERSARIAL EMPIRICAL TEST SUITE');
console.log('  BEM UNDIP Survey Analytics & Visualization Platform');
console.log('========================================================================\n');

// 1. Bundle TypeScript modules into memory via esbuild
console.log('[Compiler] Bundling Milestone 3 modules in memory via esbuild...');

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
  external: ['react', 'react-dom', 'lucide-react', 'echarts'],
  write: false,
  format: 'cjs',
  platform: 'node',
  jsx: 'transform',
});

const moduleExports = {};
const runnerFn = new Function('module', 'exports', 'require', bundleResult.outputFiles[0].text);
runnerFn(moduleExports, (moduleExports.exports = {}), require);

const {
  // Palettes & Dimensionality
  WATERMARK_TEXT,
  INSTITUTIONAL_PALETTES,
  DEFAULT_CUSTOM_PALETTE,
  DEFAULT_THEME_CONFIG,
  getPaletteById,
  resolveThemePalette,
  getPaletteColor,
  resolveDimensionality,

  // Palette Validator
  HEX_COLOR_REGEX,
  isValidHexColor,
  normalizeHexColor,
  validateCustomPalette,
  createCustomPalette,

  // Typography
  FONT_FAMILIES,
  calculateTypographyScale,
  getCssFontFamily,

  // Color Utils
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  hexToRgba,

  // ECharts Options
  generateEChartsOption,
  calculateDynamicPadding,
  wrapLabel,
  determineBadgePlacement,

  // Studio Components
  ChartCard,
  WatermarkFooter,
  WATERMARK_DEFAULT_TEXT,
  sanitizeExportFilename,
} = moduleExports.exports;

console.log('✓ Modules bundled successfully.\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err });
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.stack || err.message}`);
  }
}

// Baseline Theme
const baseTheme = {
  fontFamily: 'Poppins',
  titleFontSize: 20,
  labelFontSize: 12,
  activePaletteId: 'undip_navy_gold',
  activePalette: INSTITUTIONAL_PALETTES.undip_navy_gold,
  customPalette: DEFAULT_CUSTOM_PALETTE,
  globalDimensionality: '2d',
  showWatermark: true,
  watermarkText: WATERMARK_TEXT,
};

// All 5 presentation chart types
const CHART_TYPES = ['donut', 'horizontal_bar', 'vertical_bar', 'ranked_bar', 'ordered_likert'];

// ============================================================================
// SUITE 1: Extreme Inputs & Geometry Generation (All 5 Types, 2D & 3D)
// ============================================================================
console.log('--- Suite 1: Extreme Inputs & Geometry Generation (All 5 Types x 2D/3D) ---');

// 1.1: 0 Responses (Empty distributions, 0 valid counts)
for (const chartType of CHART_TYPES) {
  for (const mode of ['2d', '3d']) {
    test(`S1.1 [0 Responses] ${chartType} in ${mode} mode generates valid option without crashing or NaN`, () => {
      const col = {
        id: `col_zero_${chartType}`,
        columnIndex: 1,
        rawName: 'Pertanyaan Kosong',
        cleanName: 'Pertanyaan Kosong',
        displayTitle: 'Pertanyaan Kosong',
        type: 'NOMINAL_DEMOGRAPHIC',
        isPII: false,
        isExcluded: false,
        recommendedChart: chartType,
        selectedChart: chartType,
        totalResponses: 0,
        validResponses: 0,
        missingResponses: 0,
        uniqueValuesCount: 0,
        distribution: {},
        offlineSummary: 'Belum ada responden.',
      };

      const opt = generateEChartsOption(col, baseTheme, mode);
      assert.ok(opt, 'Option object must be generated');

      if (chartType === 'donut') {
        assert.strictEqual(opt.series[0].type, 'pie');
        assert.strictEqual(opt.title.text, '0');
        assert.strictEqual(opt.series[0].data.length, 0);
      } else {
        // Cartesian charts must have valid containLabel and safe grid
        assert.strictEqual(opt.grid.containLabel, true);
        assert.ok(!isNaN(opt.grid.left), 'Grid left must not be NaN');
        assert.ok(!isNaN(opt.grid.right), 'Grid right must not be NaN');
        assert.ok(!isNaN(opt.grid.top), 'Grid top must not be NaN');
        assert.ok(!isNaN(opt.grid.bottom), 'Grid bottom must not be NaN');
      }
    });
  }
}

// 1.2: 100+ Categories (Stress testing multi-category scaling)
for (const chartType of CHART_TYPES) {
  for (const mode of ['2d', '3d']) {
    test(`S1.2 [100+ Categories] ${chartType} in ${mode} mode handles 120 categories safely`, () => {
      const dist120 = {};
      const tokens120 = [];
      for (let i = 1; i <= 120; i++) {
        const catName = `Opsi Kategori Ke-${i}`;
        const count = (i * 7) % 53;
        dist120[catName] = count;
        tokens120.push({ token: catName, count, percentage: Math.round((count / 500) * 100) });
      }

      const col = {
        id: `col_120_${chartType}`,
        columnIndex: 2,
        rawName: 'Kategori 120',
        cleanName: 'Kategori 120',
        displayTitle: 'Banyak Kategori 120 Opsi',
        type: chartType === 'ranked_bar' ? 'MULTI_SELECT_CHECKBOX' : 'NOMINAL_DEMOGRAPHIC',
        isPII: false,
        isExcluded: false,
        recommendedChart: chartType,
        selectedChart: chartType,
        totalResponses: 500,
        validResponses: 500,
        missingResponses: 0,
        uniqueValuesCount: 120,
        distribution: dist120,
        multiSelect: {
          totalSelections: 1500,
          averageSelectionsPerRespondent: 3,
          tokenFrequencies: tokens120,
        },
        likertScale: {
          min: 1,
          max: 120,
          labels: {},
          mean: 60,
          median: 60,
          netPositivePercent: 50,
        },
        offlineSummary: 'Ringkasan 120 kategori',
      };

      const opt = generateEChartsOption(col, baseTheme, mode);
      assert.ok(opt, 'Option object must be generated');

      if (chartType === 'donut') {
        assert.strictEqual(opt.series[0].data.length, 120);
        // Verify modulo color wrap-around on 120 items
        for (let i = 0; i < 120; i++) {
          const item = opt.series[0].data[i];
          assert.ok(item.itemStyle, `Item ${i} must have itemStyle`);
          assert.ok(item.itemStyle.color, `Item ${i} must have valid color`);
        }
      } else {
        assert.strictEqual(opt.grid.containLabel, true);
        if (chartType === 'vertical_bar') {
          // Verify barWidth bounds: Math.min(48, Math.max(20, Math.round(280 / 120))) = 20
          assert.strictEqual(opt.series[0].barWidth, 20);
        }
      }
    });
  }
}

// 1.3: Extreme Label Lengths (200+, 500+ characters, spaces & unbroken strings)
for (const chartType of CHART_TYPES) {
  for (const mode of ['2d', '3d']) {
    test(`S1.3 [Extreme Label Lengths] ${chartType} in ${mode} mode handles 250+ char labels`, () => {
      const longLabelWithSpaces = 'Fakultas Perikanan dan Ilmu Kelautan Universitas Diponegoro Semarang Jawa Tengah Indonesia '.repeat(4).trim();
      const longLabelUnbroken = 'A'.repeat(260);
      const specialLabel = 'Kategori Normal';

      const col = {
        id: `col_long_${chartType}`,
        columnIndex: 3,
        rawName: 'Pertanyaan Panjang',
        cleanName: 'Pertanyaan Panjang',
        displayTitle: 'Uji Label Panjang',
        type: 'NOMINAL_DEMOGRAPHIC',
        isPII: false,
        isExcluded: false,
        recommendedChart: chartType,
        selectedChart: chartType,
        totalResponses: 100,
        validResponses: 100,
        missingResponses: 0,
        uniqueValuesCount: 3,
        distribution: {
          [longLabelWithSpaces]: 50,
          [longLabelUnbroken]: 30,
          [specialLabel]: 20,
        },
        multiSelect: {
          totalSelections: 100,
          averageSelectionsPerRespondent: 1,
          tokenFrequencies: [
            { token: longLabelWithSpaces, count: 50, percentage: 50 },
            { token: longLabelUnbroken, count: 30, percentage: 30 },
            { token: specialLabel, count: 20, percentage: 20 },
          ],
        },
        offlineSummary: 'Ringkasan label panjang',
      };

      const opt = generateEChartsOption(col, baseTheme, mode);
      assert.ok(opt, 'Option must generate without throwing');

      if (chartType === 'horizontal_bar' || chartType === 'ranked_bar') {
        assert.strictEqual(opt.grid.containLabel, true);
        // Dynamic padding must be clamped to max 260
        assert.strictEqual(opt.grid.left, 260);
      }
    });
  }
}

// 1.4: Special Characters, HTML & Injection Vectors in Labels
for (const chartType of CHART_TYPES) {
  for (const mode of ['2d', '3d']) {
    test(`S1.4 [Special Chars & XSS] ${chartType} in ${mode} mode handles HTML/XSS & Unicode labels safely`, () => {
      const maliciousLabels = {
        '<script>alert("XSS")</script>': 40,
        '<img src=x onerror=console.error("Hacked") />': 30,
        'Fakultas Sains & Matematika (FSM) — “Keluarga Mahasiswa” €£¥': 20,
        '1\'; DROP TABLE survey_responses; --': 10,
      };

      const col = {
        id: `col_xss_${chartType}`,
        columnIndex: 4,
        rawName: 'Pertanyaan XSS',
        cleanName: 'Pertanyaan XSS',
        displayTitle: '<b onmouseover=alert(1)>Judul Berbahaya</b>',
        type: 'NOMINAL_DEMOGRAPHIC',
        isPII: false,
        isExcluded: false,
        recommendedChart: chartType,
        selectedChart: chartType,
        totalResponses: 100,
        validResponses: 100,
        missingResponses: 0,
        uniqueValuesCount: 4,
        distribution: maliciousLabels,
        multiSelect: {
          totalSelections: 100,
          averageSelectionsPerRespondent: 1,
          tokenFrequencies: Object.entries(maliciousLabels).map(([token, count]) => ({
            token,
            count,
            percentage: count,
          })),
        },
        offlineSummary: 'Ringkasan uji XSS',
      };

      const opt = generateEChartsOption(col, baseTheme, mode);
      assert.ok(opt, 'Option must generate without throwing on injection payloads');

      // Verify category strings are preserved as raw string data for canvas rendering
      if (chartType === 'horizontal_bar' || chartType === 'ranked_bar') {
        assert.strictEqual(opt.grid.containLabel, true);
        assert.ok(opt.yAxis.data.includes('<script>alert("XSS")</script>'));
      }
    });
  }
}

// ============================================================================
// SUITE 2: Anti-Clipping Geometry, Grid Invariants & Dynamic Padding Bounds
// ============================================================================
console.log('\n--- Suite 2: Anti-Clipping Geometry, Grid Invariants & Dynamic Padding ---');

test('S2.1: grid.containLabel is strictly true across ALL cartesian chart types in both 2D and 3D', () => {
  const cartesianTypes = ['horizontal_bar', 'vertical_bar', 'ranked_bar', 'ordered_likert'];
  const testDist = { 'Kategori A': 30, 'Kategori B': 20 };

  for (const cType of cartesianTypes) {
    for (const mode of ['2d', '3d']) {
      const col = {
        id: `test_grid_${cType}_${mode}`,
        columnIndex: 1,
        cleanName: 'Test Grid',
        displayTitle: 'Test Grid',
        selectedChart: cType,
        validResponses: 50,
        distribution: testDist,
        multiSelect: {
          totalSelections: 50,
          averageSelectionsPerRespondent: 1,
          tokenFrequencies: [{ token: 'Kategori A', count: 30, percentage: 60 }, { token: 'Kategori B', count: 20, percentage: 40 }],
        },
        likertScale: { min: 1, max: 5, labels: {} },
      };

      const opt = generateEChartsOption(col, baseTheme, mode);
      assert.ok(opt.grid, `${cType} in ${mode} mode must have a grid configuration`);
      assert.strictEqual(
        opt.grid.containLabel,
        true,
        `grid.containLabel MUST be strictly true for ${cType} in ${mode} mode`
      );
    }
  }
});

test('S2.2: calculateDynamicPadding never produces negative margins or NaN on any input', () => {
  // Edge test cases: empty, single character, normal, long, extreme, undefined, null
  const testCases = [
    [],
    ['A'],
    ['Short'],
    ['Fakultas Perikanan dan Ilmu Kelautan'],
    ['A'.repeat(100)],
    ['A'.repeat(500)],
    ['', '   ', '\t\n'],
    [null, undefined, 12345],
  ];

  for (const labels of testCases) {
    const padHorizontal = calculateDynamicPadding(labels, 'horizontal_bar');
    const padRanked = calculateDynamicPadding(labels, 'ranked_bar');
    const padVertical = calculateDynamicPadding(labels, 'vertical_bar');
    const padDonut = calculateDynamicPadding(labels, 'donut');

    for (const pad of [padHorizontal, padRanked, padVertical, padDonut]) {
      assert.ok(!isNaN(pad.left), `left padding must not be NaN for labels: ${JSON.stringify(labels)}`);
      assert.ok(!isNaN(pad.right), `right padding must not be NaN`);
      assert.ok(!isNaN(pad.top), `top padding must not be NaN`);
      assert.ok(!isNaN(pad.bottom), `bottom padding must not be NaN`);

      assert.ok(pad.left > 0, `left padding must be positive, got ${pad.left}`);
      assert.ok(pad.right > 0, `right padding must be positive, got ${pad.right}`);
      assert.ok(pad.top > 0, `top padding must be positive, got ${pad.top}`);
      assert.ok(pad.bottom > 0, `bottom padding must be positive, got ${pad.bottom}`);

      assert.ok(isFinite(pad.left), `left padding must be finite`);
      assert.ok(isFinite(pad.right), `right padding must be finite`);
    }

    // Horizontal & ranked padding bounds check
    assert.ok(padHorizontal.left >= 80, `Horizontal left padding must be >= 80, got ${padHorizontal.left}`);
    assert.ok(padHorizontal.left <= 260, `Horizontal left padding must be <= 260, got ${padHorizontal.left}`);
  }
});

test('S2.3: wrapLabel handles zero-length, non-breakable, and multi-word strings cleanly', () => {
  assert.deepStrictEqual(wrapLabel(''), []);
  assert.deepStrictEqual(wrapLabel(null), []);
  assert.deepStrictEqual(wrapLabel(undefined), []);

  const unbroken = 'SupercalifragilisticexpialidociousUnbrokenWord';
  const linesUnbroken = wrapLabel(unbroken, 22);
  assert.strictEqual(linesUnbroken.length, 1);
  assert.strictEqual(linesUnbroken[0], unbroken);

  const regular = 'Biro Statistika BEM Universitas Diponegoro';
  const linesRegular = wrapLabel(regular, 16);
  assert.ok(linesRegular.length >= 2);
  assert.ok(linesRegular.every((line) => line.length <= 25));
});

// ============================================================================
// SUITE 3: 2.5D Isometric 3D Compliance & Distorted 3D Pie Wedge Prevention
// ============================================================================
console.log('\n--- Suite 3: 2.5D Isometric 3D Compliance & 3D Pie Wedge Prevention ---');

test('S3.1: 2.5D Donut chart NEVER generates distorted 3D pie slices (concentric donut bevel only)', () => {
  const col = {
    id: 'col_donut_3d',
    columnIndex: 1,
    cleanName: 'Status',
    selectedChart: 'donut',
    validResponses: 100,
    distribution: { 'Mahasiswa Aktif': 75, 'Cuti Akademik': 25 },
  };

  const opt3D = generateEChartsOption(col, baseTheme, '3d');

  // Must be standard 2D/Canvas pie type, NOT pie3D or echarts-gl surface
  assert.strictEqual(opt3D.series[0].type, 'pie', 'Must use type: "pie", never pie3D');
  assert.strictEqual(opt3D.series[0].pie3D, undefined, 'Must NEVER have pie3D property');
  assert.strictEqual(opt3D.series[0].viewControl, undefined, 'Must NEVER have 3D viewControl');
  assert.strictEqual(opt3D.series[0].boxDepth, undefined, 'Must NEVER have 3D boxDepth');

  // Must use concentric donut geometry (inner radius > 0, outer radius > inner)
  const radius = opt3D.series[0].radius;
  assert.ok(Array.isArray(radius) && radius.length === 2, 'Donut radius must be a 2-tuple [inner, outer]');
  assert.strictEqual(radius[0], '45%', 'Inner radius must be 45% (concentric donut ring)');
  assert.strictEqual(radius[1], '75%', 'Outer radius in 2.5D must be 75%');

  // Verify 2.5D bevel styling: linear gradient, shadow blur <= 8px, shadowOffsetY = 4px
  const itemStyle = opt3D.series[0].data[0].itemStyle;
  assert.ok(itemStyle, 'Slice itemStyle must exist');
  assert.strictEqual(itemStyle.color.type, 'linear', '2.5D bevel must use linear gradient fill');
  assert.strictEqual(itemStyle.shadowBlur, 8, '2.5D shadowBlur must be 8px');
  assert.strictEqual(itemStyle.shadowOffsetY, 4, '2.5D shadowOffsetY must be 4px');
  assert.strictEqual(itemStyle.shadowColor, 'rgba(0, 0, 0, 0.12)', '2.5D shadowColor must be soft black');
});

test('S3.2: 2D Donut chart maintains flat geometry and clean zero-blur borders', () => {
  const col = {
    id: 'col_donut_2d',
    columnIndex: 1,
    cleanName: 'Status',
    selectedChart: 'donut',
    validResponses: 100,
    distribution: { 'Mahasiswa Aktif': 75, 'Cuti Akademik': 25 },
  };

  const opt2D = generateEChartsOption(col, baseTheme, '2d');
  assert.strictEqual(opt2D.series[0].type, 'pie');
  assert.deepStrictEqual(opt2D.series[0].radius, ['45%', '72%']);

  const itemStyle = opt2D.series[0].data[0].itemStyle;
  assert.strictEqual(typeof itemStyle.color, 'string', '2D fill must be flat hex string');
  assert.strictEqual(itemStyle.shadowBlur, 0, '2D must have shadowBlur = 0');
  assert.strictEqual(itemStyle.shadowOffsetY, 0, '2D must have shadowOffsetY = 0');
  assert.strictEqual(itemStyle.shadowColor, 'transparent');
});

test('S3.3: 2.5D Bar charts specify directional drop shadows and linear gradient shading', () => {
  const col = {
    id: 'col_bar_3d',
    columnIndex: 2,
    cleanName: 'Fakultas',
    selectedChart: 'vertical_bar',
    validResponses: 50,
    distribution: { FSM: 30, FT: 20 },
  };

  const opt3D = generateEChartsOption(col, baseTheme, '3d');
  const barItemStyle = opt3D.series[0].data[0].itemStyle;

  assert.strictEqual(barItemStyle.color.type, 'linear');
  assert.strictEqual(barItemStyle.shadowBlur, 6);
  assert.strictEqual(barItemStyle.shadowOffsetY, 4);
  assert.strictEqual(barItemStyle.shadowColor, 'rgba(0, 0, 0, 0.12)');
});

// ============================================================================
// SUITE 4: Dimensionality Override Hierarchy
// ============================================================================
console.log('\n--- Suite 4: Dimensionality Override Hierarchy ---');

test('S4.1: Card override strictly overrides global preset across all explicit combinations', () => {
  // Global 2D, Card 3D -> 3D
  assert.strictEqual(resolveDimensionality('2d', '3d'), '3d');
  // Global 3D, Card 2D -> 2D
  assert.strictEqual(resolveDimensionality('3d', '2d'), '2d');
  // Global 2D, Card 2D -> 2D
  assert.strictEqual(resolveDimensionality('2d', '2d'), '2d');
  // Global 3D, Card 3D -> 3D
  assert.strictEqual(resolveDimensionality('3d', '3d'), '3d');
});

test('S4.2: "inherit" cleanly defaults to active global preset', () => {
  assert.strictEqual(resolveDimensionality('2d', 'inherit'), '2d');
  assert.strictEqual(resolveDimensionality('3d', 'inherit'), '3d');
});

test('S4.3: undefined, null, empty string, and unrecognized tokens cleanly default to global preset', () => {
  assert.strictEqual(resolveDimensionality('2d', undefined), '2d');
  assert.strictEqual(resolveDimensionality('3d', undefined), '3d');
  assert.strictEqual(resolveDimensionality('2d', null), '2d');
  assert.strictEqual(resolveDimensionality('3d', null), '3d');
  assert.strictEqual(resolveDimensionality('2d', ''), '2d');
  assert.strictEqual(resolveDimensionality('3d', ''), '3d');
  assert.strictEqual(resolveDimensionality('2d', 'unknown_mode'), '2d');
  assert.strictEqual(resolveDimensionality('3d', 'random_string'), '3d');
});

test('S4.4: Corrupted or missing global preset defaults safely to "2d"', () => {
  assert.strictEqual(resolveDimensionality(undefined, 'inherit'), '2d');
  assert.strictEqual(resolveDimensionality(null, 'inherit'), '2d');
  assert.strictEqual(resolveDimensionality('invalid_global', 'inherit'), '2d');
});

test('S4.5: End-to-end option generation reflects hierarchical dimensionality resolution', () => {
  const col = {
    id: 'col_override_test',
    columnIndex: 1,
    cleanName: 'Evaluasi',
    selectedChart: 'vertical_bar',
    validResponses: 10,
    distribution: { Ya: 7, Tidak: 3 },
  };

  // 1. Global is 2D, card override is 3D -> generated option must have 3D linear gradient
  const mode1 = resolveDimensionality('2d', '3d');
  const opt1 = generateEChartsOption(col, baseTheme, mode1);
  assert.strictEqual(opt1.series[0].data[0].itemStyle.color.type, 'linear');
  assert.strictEqual(opt1.series[0].data[0].itemStyle.shadowBlur, 6);

  // 2. Global is 3D, card override is 2D -> generated option must have flat solid color
  const mode2 = resolveDimensionality('3d', '2d');
  const opt2 = generateEChartsOption(col, baseTheme, mode2);
  assert.strictEqual(typeof opt2.series[0].data[0].itemStyle.color, 'string');
  assert.strictEqual(opt2.series[0].data[0].itemStyle.shadowBlur, 0);

  // 3. Global is 3D, card override is inherit -> inherits 3D
  const mode3 = resolveDimensionality('3d', 'inherit');
  const opt3 = generateEChartsOption(col, baseTheme, mode3);
  assert.strictEqual(opt3.series[0].data[0].itemStyle.color.type, 'linear');
});

// ============================================================================
// SUITE 5: Official Institutional Watermark Positioning & Visibility Toggle
// ============================================================================
console.log('\n--- Suite 5: Institutional Watermark Positioning & Visibility Toggle ---');

test('S5.1: WatermarkFooter renders official institutional branding when showWatermark is true', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(WatermarkFooter, {
      showWatermark: true,
      watermarkText: 'Biro Statistika BEM Universitas Diponegoro',
      fontFamily: 'Poppins',
    })
  );

  assert.ok(html.length > 0, 'Rendered HTML must not be empty');
  assert.ok(html.includes('Biro Statistika BEM Universitas Diponegoro'), 'Must contain official watermark text');
  assert.ok(html.includes('Survei Terverifikasi BEM UNDIP 2026'), 'Must contain verification badge');
  assert.ok(html.includes('font-family:Poppins'), 'Must reflect active presentation font family');
});

test('S5.2: WatermarkFooter returns null (empty render) when showWatermark is false', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(WatermarkFooter, {
      showWatermark: false,
      watermarkText: 'Biro Statistika BEM Universitas Diponegoro',
    })
  );

  assert.strictEqual(html, '', 'WatermarkFooter must render nothing when showWatermark is false');
});

test('S5.3: WatermarkFooter falls back to official text when watermarkText is empty or whitespace', () => {
  const htmlEmpty = ReactDOMServer.renderToString(
    React.createElement(WatermarkFooter, {
      showWatermark: true,
      watermarkText: '',
    })
  );
  assert.ok(htmlEmpty.includes('Biro Statistika BEM Universitas Diponegoro'), 'Empty string must fall back to default text');

  const htmlWhitespace = ReactDOMServer.renderToString(
    React.createElement(WatermarkFooter, {
      showWatermark: true,
      watermarkText: '    ',
    })
  );
  assert.ok(htmlWhitespace.includes('Biro Statistika BEM Universitas Diponegoro'), 'Whitespace string must fall back to default text');

  const htmlUndefined = ReactDOMServer.renderToString(
    React.createElement(WatermarkFooter, {
      showWatermark: true,
      watermarkText: undefined,
    })
  );
  assert.ok(htmlUndefined.includes('Biro Statistika BEM Universitas Diponegoro'), 'Undefined text must fall back to default text');
});

test('S5.4: WatermarkFooter correctly renders custom watermark text when provided', () => {
  const customText = 'Biro Riset Strategis BEM UNDIP 2026';
  const html = ReactDOMServer.renderToString(
    React.createElement(WatermarkFooter, {
      showWatermark: true,
      watermarkText: customText,
    })
  );
  assert.ok(html.includes(customText), 'Must render custom watermark text');
});

test('S5.5: ChartCard integrates WatermarkFooter and respects theme.showWatermark toggle', () => {
  const col = {
    id: 'col_card_test',
    columnIndex: 1,
    cleanName: 'Kepuasan Mahasiswa',
    displayTitle: 'Tingkat Kepuasan Mahasiswa',
    type: 'NOMINAL_DEMOGRAPHIC',
    isPII: false,
    isExcluded: false,
    recommendedChart: 'vertical_bar',
    selectedChart: 'vertical_bar',
    validResponses: 50,
    distribution: { Puas: 35, Tidak: 15 },
    offlineSummary: 'Mayoritas puas',
  };

  // With watermark ON
  const themeWithWatermark = { ...baseTheme, showWatermark: true };
  const htmlWithWatermark = ReactDOMServer.renderToString(
    React.createElement(ChartCard, {
      column: col,
      theme: themeWithWatermark,
      cardOverride: 'inherit',
    })
  );
  assert.ok(htmlWithWatermark.includes('Biro Statistika BEM Universitas Diponegoro'), 'ChartCard must include watermark when showWatermark is true');
  assert.ok(htmlWithWatermark.includes('Survei Terverifikasi BEM UNDIP 2026'));

  // With watermark OFF
  const themeNoWatermark = { ...baseTheme, showWatermark: false };
  const htmlNoWatermark = ReactDOMServer.renderToString(
    React.createElement(ChartCard, {
      column: col,
      theme: themeNoWatermark,
      cardOverride: 'inherit',
    })
  );
  assert.ok(!htmlNoWatermark.includes('Survei Terverifikasi BEM UNDIP 2026'), 'ChartCard must NOT include watermark when showWatermark is false');
});

test('S5.6: ChartCard renders Q-index badge, title, dimensionality pill, and download button', () => {
  const col = {
    id: 'col_card_elements',
    columnIndex: 5,
    cleanName: 'Minat Kegiatan',
    displayTitle: 'Minat Terhadap Kegiatan Kampus',
    type: 'NOMINAL_DEMOGRAPHIC',
    isPII: false,
    isExcluded: false,
    recommendedChart: 'vertical_bar',
    selectedChart: 'vertical_bar',
    validResponses: 42,
    distribution: { A: 22, B: 20 },
    offlineSummary: 'Ringkasan kegiatan',
  };

  const html = ReactDOMServer.renderToString(
    React.createElement(ChartCard, {
      column: col,
      theme: baseTheme,
      cardOverride: '3d',
    })
  );

  // Strip React SSR comment markers between adjacent text nodes
  const textContent = html.replace(/<!--.*?-->/g, '');

  assert.ok(textContent.includes('Q5'), 'Must render Q-index badge Q5');
  assert.ok(textContent.includes('Minat Terhadap Kegiatan Kampus'), 'Must render question title');
  assert.ok(textContent.includes('N = 42'), 'Must render sample size N');
  assert.ok(textContent.includes('2.5D 3D'), 'Must render override pill for 3D mode');
});

// ============================================================================
// SUITE 6: Color Math & Custom Palette Validator Hardening
// ============================================================================
console.log('\n--- Suite 6: Color Math & Palette Validator Hardening ---');

test('S6.1: lightenColor and darkenColor clamp RGB channels within [0, 255] strictly without overflow', () => {
  // Pure white lighten by 50% -> stays #FFFFFF
  assert.strictEqual(lightenColor('#FFFFFF', 50), '#FFFFFF');
  assert.strictEqual(lightenColor('#ffffff', 100), '#FFFFFF');

  // Pure black darken by 50% -> stays #000000
  assert.strictEqual(darkenColor('#000000', 50), '#000000');
  assert.strictEqual(darkenColor('#000', 100), '#000000');

  // Negative percentage is defensively clamped to 0% change (returns original color)
  assert.strictEqual(lightenColor('#123456', -50), '#123456');
  assert.strictEqual(darkenColor('#123456', -50), '#123456');
});

test('S6.2: validateCustomPalette rejects invalid hex characters and enforces >= 5 count', () => {
  // 4 hex codes -> rejected
  const res4 = validateCustomPalette(['#111111', '#222222', '#333333', '#444444']);
  assert.strictEqual(res4.isValid, false);
  assert.ok(res4.errors.some((e) => e.includes('Minimal 5')));

  // Invalid hex characters
  const resInvalid = validateCustomPalette(['#111111', '#222222', '#333333', '#444444', '#ZZZZZZ']);
  assert.strictEqual(resInvalid.isValid, false);
  assert.ok(resInvalid.errors.some((e) => e.includes('#ZZZZZZ')));

  // Mixed 3-digit and 6-digit valid hexes without hash
  const resMixed = validateCustomPalette(['FFF', '000', '1E56A0', 'F39C12', '4A90E2']);
  assert.strictEqual(resMixed.isValid, true);
  assert.strictEqual(resMixed.colors.length, 5);
  assert.strictEqual(resMixed.colors[0], '#FFF');
  assert.strictEqual(resMixed.colors[2], '#1E56A0');
});

// ============================================================================
// Final Verdict Summary
// ============================================================================
console.log('\n========================================================================');
console.log(`  CHALLENGER M3-2 TEST EXECUTION COMPLETE: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.log(`  FAILURES: ${failedTests}`);
  for (const f of failures) {
    console.log(`    - ${f.name}: ${f.error.message}`);
  }
}
console.log('========================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
