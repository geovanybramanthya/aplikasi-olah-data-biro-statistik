/**
 * BEM Survey Analytics & Visualization Platform
 * Verification Test Suite: Dynamic Organization Identity & Custom Logo System
 * Verifies multi-faculty customization, local persistence, manifest generation, and export rendering.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

console.log('========================================================================');
console.log('  DYNAMIC MULTI-FACULTY BEM IDENTITY & CUSTOM LOGO VERIFICATION SUITE   ');
console.log('========================================================================\n');

// 1. Bundle TypeScript source modules in memory via esbuild
console.log('[Setup] Compiling modules in memory via esbuild...');

const srcCoreDir = path.resolve(__dirname, '../src/core');
const srcServicesDir = path.resolve(__dirname, '../src/services');
const srcComponentsDir = path.resolve(__dirname, '../src/components');

const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from '${srcCoreDir.replace(/\\/g, '/')}/theming/palettes';
      export * from '${srcCoreDir.replace(/\\/g, '/')}/export/zipPackager';
      export * from '${srcCoreDir.replace(/\\/g, '/')}/export/canvasExporter';
      export * from '${srcServicesDir.replace(/\\/g, '/')}/identityStorage';
      export * from '${srcComponentsDir.replace(/\\/g, '/')}/studio/WatermarkFooter';
    `,
    resolveDir: __dirname,
    loader: 'ts',
  },
  bundle: true,
  external: ['react', 'react-dom', 'lucide-react', 'echarts', 'jszip'],
  write: false,
  format: 'cjs',
  platform: 'node',
  jsx: 'transform',
});

// Mock browser localStorage for Node testing
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
};

const moduleExports = {};
const runnerFn = new Function('module', 'exports', 'require', bundleResult.outputFiles[0].text);
runnerFn(moduleExports, (moduleExports.exports = {}), require);

const {
  WATERMARK_TEXT,
  DEFAULT_LOGO_URL,
  DEFAULT_ORG_NAME,
  DEFAULT_BADGE_TEXT,
  DEFAULT_THEME_CONFIG,
  DEFAULT_THEME,
  buildExportManifest,
  generateZipArchiveFilename,
  formatBatchChartFilename,
  renderCompositeCardToBuffer,
  generateHeadlessPngBuffer,
  loadSavedOrgIdentity,
  saveOrgIdentity,
  clearSavedOrgIdentity,
  STORAGE_KEY,
  WatermarkFooter,
} = moduleExports.exports;

console.log('✓ Modules compiled and loaded successfully.\n');

let totalTests = 0;
let passedTests = 0;

function runTest(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

(async () => {
  // =========================================================================
  // Test Suite 1: Default Identity Invariants
  // =========================================================================
  console.log('--- Test Suite 1: Default Identity Invariants ---');

  runTest('1.1: Default identity constants match official Biro Statistik specifications', () => {
    assert.strictEqual(WATERMARK_TEXT, 'Biro Statistik BEM Universitas Diponegoro');
    assert.strictEqual(DEFAULT_LOGO_URL, '/logo-birstat-transparent.png');
    assert.strictEqual(DEFAULT_ORG_NAME, 'BEM Universitas Diponegoro');
    assert.strictEqual(DEFAULT_BADGE_TEXT, 'Survei Terverifikasi BEM UNDIP 2026');
  });

  runTest('1.2: DEFAULT_THEME_CONFIG contains complete default identity fields', () => {
    assert.strictEqual(DEFAULT_THEME_CONFIG.organizationName, 'BEM Universitas Diponegoro');
    assert.strictEqual(DEFAULT_THEME_CONFIG.facultyName, '');
    assert.strictEqual(DEFAULT_THEME_CONFIG.customLogoUrl, null);
    assert.strictEqual(DEFAULT_THEME_CONFIG.verifiedBadgeText, 'Survei Terverifikasi BEM UNDIP 2026');
    assert.strictEqual(DEFAULT_THEME_CONFIG.watermarkText, 'Biro Statistik BEM Universitas Diponegoro');
  });

  runTest('1.3: DEFAULT_THEME alias mirrors DEFAULT_THEME_CONFIG exactly', () => {
    assert.strictEqual(DEFAULT_THEME.organizationName, DEFAULT_THEME_CONFIG.organizationName);
    assert.strictEqual(DEFAULT_THEME.customLogoUrl, DEFAULT_THEME_CONFIG.customLogoUrl);
    assert.strictEqual(DEFAULT_THEME.verifiedBadgeText, DEFAULT_THEME_CONFIG.verifiedBadgeText);
  });

  // =========================================================================
  // Test Suite 2: LocalStorage Identity Persistence Service
  // =========================================================================
  console.log('\n--- Test Suite 2: LocalStorage Identity Persistence Service ---');

  runTest('2.1: STORAGE_KEY uses isolated namespace bem_stat_org_identity', () => {
    assert.strictEqual(STORAGE_KEY, 'bem_stat_org_identity');
  });

  runTest('2.2: loadSavedOrgIdentity returns null when storage is empty', () => {
    localStorage.clear();
    const loaded = loadSavedOrgIdentity();
    assert.strictEqual(loaded, null);
  });

  runTest('2.3: saveOrgIdentity saves custom faculty fields correctly', () => {
    localStorage.clear();
    const customConfig = {
      organizationName: 'BEM Fakultas Teknik Universitas Diponegoro',
      facultyName: 'Fakultas Teknik',
      customLogoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      watermarkText: 'Biro Statistik BEM FT UNDIP',
      verifiedBadgeText: 'Survei Terverifikasi BEM FT 2026',
    };

    saveOrgIdentity(customConfig);
    const savedRaw = localStorage.getItem('bem_stat_org_identity');
    assert.ok(savedRaw !== null);

    const loaded = loadSavedOrgIdentity();
    assert.ok(loaded !== null);
    assert.strictEqual(loaded.organizationName, 'BEM Fakultas Teknik Universitas Diponegoro');
    assert.strictEqual(loaded.facultyName, 'Fakultas Teknik');
    assert.strictEqual(loaded.watermarkText, 'Biro Statistik BEM FT UNDIP');
    assert.strictEqual(loaded.verifiedBadgeText, 'Survei Terverifikasi BEM FT 2026');
    assert.ok(loaded.customLogoUrl.startsWith('data:image/png;base64,'));
  });

  runTest('2.4: clearSavedOrgIdentity removes entry from storage cleanly', () => {
    clearSavedOrgIdentity();
    assert.strictEqual(localStorage.getItem('bem_stat_org_identity'), null);
    assert.strictEqual(loadSavedOrgIdentity(), null);
  });

  runTest('2.5: loadSavedOrgIdentity handles corrupted JSON gracefully without crashing', () => {
    localStorage.setItem('bem_stat_org_identity', 'INVALID_JSON{{{');
    const loaded = loadSavedOrgIdentity();
    assert.strictEqual(loaded, null);
  });

  // =========================================================================
  // Test Suite 3: Itemized Audit Manifest with Dynamic Organization Identity
  // =========================================================================
  console.log('\n--- Test Suite 3: Audit Manifest with Dynamic Identity ---');

  const mockColumns = [
    { cleanName: 'Q1', displayTitle: 'Kepuasan Layanan', selectedChart: 'donut', validResponses: 120, isExcluded: false },
    { cleanName: 'Q2', displayTitle: 'Fasilitas Lab', selectedChart: 'horizontal_bar', validResponses: 118, isExcluded: false },
  ];

  runTest('3.1: Manifest uses default Biro Statistik BEM UNDIP header when no custom org is set', () => {
    const manifest = buildExportManifest(mockColumns, DEFAULT_THEME_CONFIG);
    assert.ok(manifest.includes('BIRO STATISTIK BEM UNIVERSITAS DIPONEGORO - AUDIT MANIFEST'));
    assert.ok(manifest.includes('Organization  : BEM Universitas Diponegoro'));
    assert.ok(manifest.includes('Logo Status   : Default Biro Statistik Logo'));
    assert.ok(manifest.includes('Watermark Text: "Biro Statistik BEM Universitas Diponegoro"'));
  });

  runTest('3.2: Manifest dynamically reflects custom faculty BEM identity and custom logo status', () => {
    const customTheme = {
      ...DEFAULT_THEME_CONFIG,
      organizationName: 'BEM Fakultas Sains dan Matematika',
      facultyName: 'Fakultas Sains dan Matematika',
      customLogoUrl: 'data:image/png;base64,mockLogoData',
      watermarkText: 'Biro Statistik BEM FSM UNDIP',
      verifiedBadgeText: 'Survei Terverifikasi BEM FSM 2026',
    };

    const manifest = buildExportManifest(mockColumns, customTheme);
    assert.ok(manifest.includes('BIRO STATISTIK BEM FAKULTAS SAINS DAN MATEMATIKA - AUDIT MANIFEST'));
    assert.ok(manifest.includes('Organization  : BEM Fakultas Sains dan Matematika'));
    assert.ok(manifest.includes('Logo Status   : Custom BEM/Faculty Logo'));
    assert.ok(manifest.includes('Watermark Text: "Biro Statistik BEM FSM UNDIP"'));
  });

  // =========================================================================
  // Test Suite 4: Dynamic ZIP Archive Filename Generation
  // =========================================================================
  console.log('\n--- Test Suite 4: Dynamic ZIP Archive Filename Generation ---');

  runTest('4.1: generateZipArchiveFilename uses BEM_UNDIP when default organization', () => {
    const filename = generateZipArchiveFilename('Survey_Mahasiswa.xlsx', 'BEM Universitas Diponegoro');
    assert.strictEqual(filename, 'Survey_Mahasiswa_BEM_UNDIP_Charts.zip');
  });

  runTest('4.2: generateZipArchiveFilename dynamically incorporates faculty slug when custom org provided', () => {
    const filename = generateZipArchiveFilename('Survey_Fasilitas.csv', 'BEM FT UNDIP');
    assert.strictEqual(filename, 'Survey_Fasilitas_BEM_FT_UNDIP_Charts.zip');
  });

  runTest('4.3: generateZipArchiveFilename sanitizes special characters in custom org name', () => {
    const filename = generateZipArchiveFilename('Evaluasi Dosen', 'BEM FK & FKM (UNDIP)');
    assert.strictEqual(filename, 'Evaluasi_Dosen_BEM_FK_FKM_UNDIP_Charts.zip');
  });

  // =========================================================================
  // Test Suite 5: WatermarkFooter DOM Rendering with Dynamic Identity
  // =========================================================================
  console.log('\n--- Test Suite 5: WatermarkFooter Dynamic Rendering ---');

  runTest('5.1: WatermarkFooter renders default logo and badge when no custom props provided', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(WatermarkFooter, {
        showWatermark: true,
        watermarkText: 'Biro Statistik BEM Universitas Diponegoro',
      })
    );

    assert.ok(html.includes('Biro Statistik BEM Universitas Diponegoro'));
    assert.ok(html.includes('Survei Terverifikasi BEM UNDIP 2026'));
    assert.ok(html.includes('/logo-birstat-transparent.png'));
  });

  runTest('5.2: WatermarkFooter renders custom logo URL and custom verified badge text', () => {
    const customLogo = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
    const customBadge = 'Survei Resmi BEM FEB 2026';
    const customWm = 'Biro Statistik BEM Fakultas Ekonomika dan Bisnis';

    const html = ReactDOMServer.renderToString(
      React.createElement(WatermarkFooter, {
        showWatermark: true,
        watermarkText: customWm,
        customLogoUrl: customLogo,
        verifiedBadgeText: customBadge,
      })
    );

    assert.ok(html.includes(customWm));
    assert.ok(html.includes(customBadge));
    assert.ok(html.includes(customLogo));
  });

  // =========================================================================
  // Test Suite 6: Canvas Composite Card Headless Export with Custom Identity
  // =========================================================================
  console.log('\n--- Test Suite 6: Headless Canvas Export with Custom Identity ---');

  await runAsyncTest('6.1: renderCompositeCardToBuffer generates valid PNG with custom identity options', async () => {
    const col = mockColumns[0];
    const customTheme = {
      ...DEFAULT_THEME_CONFIG,
      organizationName: 'BEM Fakultas Kedokteran',
      facultyName: 'Fakultas Kedokteran',
      customLogoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      watermarkText: 'Biro Statistik BEM FK UNDIP',
      verifiedBadgeText: 'Survei Terverifikasi BEM FK 2026',
    };

    const outBuffer = await renderCompositeCardToBuffer(
      {
        column: col,
        theme: customTheme,
        dimensionality: '3d',
        pixelRatio: 3.0,
      },
      {
        watermarkText: customTheme.watermarkText,
        verifiedBadgeText: customTheme.verifiedBadgeText,
        customLogoUrl: customTheme.customLogoUrl,
      }
    );

    assert.ok(Buffer.isBuffer(outBuffer), 'Must return a Node.js Buffer');
    assert.ok(outBuffer.length > 100, 'PNG buffer must contain meaningful bytes');
    // Verify genuine PNG 8-byte signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    for (let i = 0; i < 8; i++) {
      assert.strictEqual(outBuffer[i], pngSignature[i], `Byte at index ${i} must match PNG signature`);
    }
  });

  await runAsyncTest('6.2: renderCompositeCardToBuffer falls back safely if custom logo URL is malformed or invalid', async () => {
    const col = mockColumns[1];
    const customTheme = {
      ...DEFAULT_THEME_CONFIG,
      organizationName: 'BEM Fakultas Hukum',
      facultyName: 'Fakultas Hukum',
      customLogoUrl: 'not_a_valid_image_url_or_data_scheme',
      watermarkText: 'Biro Statistik BEM FH UNDIP',
      verifiedBadgeText: 'Survei Terverifikasi BEM FH 2026',
    };

    // Must not crash or reject, should complete and output valid PNG
    const outBuffer = await renderCompositeCardToBuffer(
      {
        column: col,
        theme: customTheme,
        dimensionality: '2d',
        pixelRatio: 3.0,
      },
      {
        watermarkText: customTheme.watermarkText,
        verifiedBadgeText: customTheme.verifiedBadgeText,
        customLogoUrl: customTheme.customLogoUrl,
      }
    );

    assert.ok(Buffer.isBuffer(outBuffer));
    assert.strictEqual(outBuffer[0], 0x89);
    assert.strictEqual(outBuffer[1], 0x50);
  });

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n========================================================================');
  console.log(`  ALL CUSTOM IDENTITY TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('========================================================================\n');
})();
