/**
 * Independent Adversarial Re-Verification Script for Milestone 2 PII Remediation
 * Agent: reviewer_m2_reverify
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

function compileModules() {
  const projectRoot = path.resolve(__dirname, '../..');
  
  const bundleResult = esbuild.buildSync({
    stdin: {
      contents: `
        export * from './src/services/geminiService';
        export * from './src/services/demoDataService';
        export * from './src/data/demoSurvey1';
        export * from './src/data/demoSurvey2';
      `,
      resolveDir: projectRoot,
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
  return moduleExports.exports;
}

async function runAdversarialAudit() {
  console.log('========================================================================');
  console.log('  REVIEWER M2 REVERIFY: ADVERSARIAL PII DEFECT AUDIT');
  console.log('========================================================================\n');

  const bundle = compileModules();
  const { buildGeminiPrompt, fetchGeminiNarrative, resolveNarrativeWithFallback } = bundle;
  const { loadDemoSurvey1, loadDemoSurvey2 } = bundle;

  let totalAssertions = 0;
  let passedAssertions = 0;

  function check(name, fn) {
    totalAssertions++;
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passedAssertions++;
    } catch (e) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(e);
      process.exitCode = 1;
    }
  }

  async function checkAsync(name, fn) {
    totalAssertions++;
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passedAssertions++;
    } catch (e) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(e);
      process.exitCode = 1;
    }
  }

  const ds1 = loadDemoSurvey1();
  const ds2 = loadDemoSurvey2();

  console.log('--- 1. REAL SURVEY DATASET 1 (UPGRADING BEM UNDIP) PII AUDIT ---');
  const piiCols1 = ds1.columns.filter(c => c.isPII || c.type === 'METADATA_PII');
  check('Dataset 1 contains detected PII columns', () => {
    assert.ok(piiCols1.length >= 2, `Expected at least 2 PII columns, found ${piiCols1.length}`);
    const names = piiCols1.map(c => c.cleanName);
    assert.ok(names.includes('Nama Lengkap'));
    assert.ok(names.includes('Timestamp'));
  });

  // Extract all student names from raw rows to check against
  const studentNames = ds1.rawRows.map(r => r['Nama Lengkap '] || r['Nama Lengkap']).filter(Boolean);
  check('Extracted actual student names from raw records (>100 students)', () => {
    assert.ok(studentNames.length > 100);
  });

  for (const piiCol of piiCols1) {
    check(`buildGeminiPrompt on ${piiCol.cleanName} redacts distribution to empty object`, () => {
      const prompt = buildGeminiPrompt(piiCol);
      const parsed = JSON.parse(prompt);
      assert.deepStrictEqual(parsed.distribution, {});
      
      // Verify zero student names in the serialized prompt
      for (const name of studentNames.slice(0, 20)) {
        assert.strictEqual(prompt.includes(name), false, `Prompt contained student name: ${name}`);
      }
    });

    await checkAsync(`fetchGeminiNarrative on ${piiCol.cleanName} intercepts via preflight guard`, async () => {
      const res = await fetchGeminiNarrative(piiCol, 'AIzaSy_FAKE_KEY_FOR_TESTING');
      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('PII') || res.narrative.includes('privasi'));
      for (const name of studentNames.slice(0, 20)) {
        assert.strictEqual(res.narrative.includes(name), false, `Narrative contained student name: ${name}`);
      }
    });

    check(`resolveNarrativeWithFallback on ${piiCol.cleanName} forces offline fallback even with valid key and online=true`, () => {
      const res = resolveNarrativeWithFallback(piiCol, 'AIzaSy_VALID_LOOKING_KEY_123', true);
      assert.strictEqual(res.isOfflineFallback, true);
      assert.ok(res.narrative.includes('privasi') || res.narrative.includes('Diabaikan'));
      for (const name of studentNames.slice(0, 20)) {
        assert.strictEqual(res.narrative.includes(name), false, `Fallback contained student name: ${name}`);
      }
    });
  }

  console.log('\n--- 2. REAL SURVEY DATASET 2 (CAMPUS SAFETY) PII AUDIT ---');
  const piiCols2 = ds2.columns.filter(c => c.isPII || c.type === 'METADATA_PII');
  check('Dataset 2 contains Timestamp as METADATA_PII', () => {
    assert.ok(piiCols2.length >= 1);
    assert.ok(piiCols2.map(c => c.cleanName).includes('Timestamp'));
  });

  for (const piiCol of piiCols2) {
    check(`buildGeminiPrompt on Dataset 2 ${piiCol.cleanName} redacts distribution`, () => {
      const prompt = buildGeminiPrompt(piiCol);
      const parsed = JSON.parse(prompt);
      assert.deepStrictEqual(parsed.distribution, {});
    });
  }

  console.log('\n--- 3. ADVERSARIAL STRESS TESTING: EDGE & INJECTION CASES ---');

  // Case A: isPII = true, but type = 'NOMINAL_DEMOGRAPHIC'
  const mockPiiMismatch1 = {
    id: 'col_adv_1',
    columnIndex: 1,
    rawName: 'Nama Samaran',
    cleanName: 'Nama Samaran',
    displayTitle: 'Nama Samaran',
    type: 'NOMINAL_DEMOGRAPHIC',
    isPII: true,
    isExcluded: true,
    recommendedChart: 'none',
    selectedChart: 'none',
    totalResponses: 5,
    validResponses: 5,
    missingResponses: 0,
    uniqueValuesCount: 5,
    distribution: { 'Budi Santoso': 1, 'Siti Nurhaliza': 1, 'Agus Setiawan': 1 },
    offlineSummary: '',
  };

  check('Adversarial Case A (isPII=true, type=NOMINAL_DEMOGRAPHIC) redacts distribution', () => {
    const prompt = buildGeminiPrompt(mockPiiMismatch1);
    const parsed = JSON.parse(prompt);
    assert.deepStrictEqual(parsed.distribution, {});
    assert.strictEqual(prompt.includes('Budi Santoso'), false);
  });

  await checkAsync('Adversarial Case A preflight guard blocks external AI processing', async () => {
    const res = await fetchGeminiNarrative(mockPiiMismatch1, 'AIzaSy_KEY');
    assert.strictEqual(res.isOfflineFallback, true);
    assert.ok(res.narrative.includes('PII') || res.narrative.includes('privasi'));
  });

  check('Adversarial Case A resolveNarrativeWithFallback forces offline fallback', () => {
    const res = resolveNarrativeWithFallback(mockPiiMismatch1, 'AIzaSy_KEY', true);
    assert.strictEqual(res.isOfflineFallback, true);
  });

  // Case B: isPII = false, but type = 'METADATA_PII'
  const mockPiiMismatch2 = {
    id: 'col_adv_2',
    columnIndex: 2,
    rawName: 'NIM Rahasia',
    cleanName: 'NIM Rahasia',
    displayTitle: 'NIM Rahasia',
    type: 'METADATA_PII',
    isPII: false,
    isExcluded: true,
    recommendedChart: 'none',
    selectedChart: 'none',
    totalResponses: 3,
    validResponses: 3,
    missingResponses: 0,
    uniqueValuesCount: 3,
    distribution: { '24060120120001': 1, '24060120120002': 1 },
    offlineSummary: '',
  };

  check('Adversarial Case B (isPII=false, type=METADATA_PII) redacts distribution', () => {
    const prompt = buildGeminiPrompt(mockPiiMismatch2);
    const parsed = JSON.parse(prompt);
    assert.deepStrictEqual(parsed.distribution, {});
    assert.strictEqual(prompt.includes('24060120120001'), false);
  });

  await checkAsync('Adversarial Case B preflight guard blocks external AI processing', async () => {
    const res = await fetchGeminiNarrative(mockPiiMismatch2, 'AIzaSy_KEY');
    assert.strictEqual(res.isOfflineFallback, true);
  });

  check('Adversarial Case B resolveNarrativeWithFallback forces offline fallback', () => {
    const res = resolveNarrativeWithFallback(mockPiiMismatch2, 'AIzaSy_KEY', true);
    assert.strictEqual(res.isOfflineFallback, true);
  });

  // Case C: Non-PII column preserves aggregated distribution
  const normalCol = ds1.columns.find(c => c.cleanName === 'Asal Bidang/Biro/Kantor');
  check('Normal demographic column preserves aggregated distribution in buildGeminiPrompt', () => {
    assert.ok(normalCol, 'Demographic column Asal Bidang/Biro/Kantor must exist');
    const prompt = buildGeminiPrompt(normalCol);
    const parsed = JSON.parse(prompt);
    assert.deepStrictEqual(parsed.distribution, normalCol.distribution);
    assert.ok(Object.keys(parsed.distribution).length > 0);
  });

  console.log('\n--- 4. UI SOURCE CODE VERIFICATION: ColumnDetailModal.tsx ---');
  const modalPath = path.resolve(__dirname, '../../src/components/curation/ColumnDetailModal.tsx');
  const modalSource = fs.readFileSync(modalPath, 'utf8');

  check('ColumnDetailModal.tsx computes isPiiColumn checking both isPII and METADATA_PII', () => {
    assert.ok(modalSource.includes("const isPiiColumn = Boolean(column.isPII || column.type === 'METADATA_PII');"));
  });

  check('ColumnDetailModal.tsx disables Gemini narrative button when isPiiColumn is true', () => {
    assert.ok(modalSource.includes('disabled={isGeneratingAi || isPiiColumn}'));
  });

  check('ColumnDetailModal.tsx renders red privacy badge for PII columns', () => {
    assert.ok(modalSource.includes('AI dinonaktifkan untuk kolom PII / identitas pribadi'));
    assert.ok(modalSource.includes('bg-red-50 text-red-700'));
  });

  check('ColumnDetailModal.tsx handleGenerateAi aborts early if isPiiColumn', () => {
    assert.ok(modalSource.includes('if (isPiiColumn) {'));
    assert.ok(modalSource.includes('setAiStatusNotice('));
    assert.ok(modalSource.includes('return;'));
  });

  console.log('\n========================================================================');
  console.log(`  REVERIFY SUMMARY: ${passedAssertions} / ${totalAssertions} CHECKS PASSED`);
  console.log('========================================================================\n');
}

runAdversarialAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
