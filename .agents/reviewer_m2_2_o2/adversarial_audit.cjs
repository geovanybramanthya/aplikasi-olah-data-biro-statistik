const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

console.log('--- Reviewer M2-2 Independent Adversarial Audit ---');

const projectRoot = path.resolve(__dirname, '../..');

// Compile source TypeScript modules in memory
const bundleResult = esbuild.buildSync({
  stdin: {
    contents: `
      export * from './src/core/recommender/prohibitedRules';
      export * from './src/core/recommender/chartHeuristics';
      export * from './src/services/geminiService';
      export * from './src/core/profiler/statistics';
      export * from './src/core/parser/csvParser';
      export * from './src/services/demoDataService';
    `,
    resolveDir: projectRoot,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});

const m = {};
new Function('module', 'exports', 'require', bundleResult.outputFiles[0].text)(m, (m.exports = {}), require);
const {
  loadDemoSurvey1,
  loadDemoSurvey2,
  buildGeminiPrompt,
  fetchGeminiNarrative,
  resolveNarrativeWithFallback,
  parseCSVString,
  isChartTypeProhibited,
  validateChartSelection,
  overrideChartType,
} = m.exports;

async function runAudit() {
  // Test 1: Real CSV parsing with await
  console.log('\n[Check 1] Real CSV Parsing with Async/Await:');
  const csv1Path = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_1.csv';
  const csv2Path = 'C:\\Users\\geova\\.gemini\\antigravity\\raw\\survey_sample_2.csv';

  if (fs.existsSync(csv1Path)) {
    const content1 = fs.readFileSync(csv1Path, 'utf8');
    const ds1 = await parseCSVString(content1, 'survey_sample_1.csv');
    console.log(`  Sample 1 parsed: rowCount=${ds1.rowCount}, columns=${ds1.columns.length}`);
    assert.strictEqual(ds1.rowCount, 134);
    assert.strictEqual(ds1.columns.length, 27);
  }

  if (fs.existsSync(csv2Path)) {
    const content2 = fs.readFileSync(csv2Path, 'utf8');
    const ds2 = await parseCSVString(content2, 'survey_sample_2.csv');
    console.log(`  Sample 2 parsed: rowCount=${ds2.rowCount}, columns=${ds2.columns.length}`);
    assert.strictEqual(ds2.rowCount, 197);
    assert.strictEqual(ds2.columns.length, 15);
  }

  // Test 2: PII privacy boundary analysis on Demo Datasets
  console.log('\n[Check 2] PII Privacy Boundary Analysis:');
  const ds1 = loadDemoSurvey1();
  const nameCol = ds1.columns.find(c => c.cleanName.toLowerCase().includes('nama'));
  console.log(`  Found column: "${nameCol.cleanName}", isPII=${nameCol.isPII}, type=${nameCol.type}`);
  
  const promptOutput = buildGeminiPrompt(nameCol);
  const parsedPrompt = JSON.parse(promptOutput);
  const distKeys = Object.keys(parsedPrompt.distribution || {});
  console.log(`  buildGeminiPrompt(nameCol) includes ${distKeys.length} distribution entries.`);
  console.log(`  Sample entries in prompt distribution:`, distKeys.slice(0, 5));
  
  const hasRawStudentNames = distKeys.some(k => k.includes('Bramanthya') || k.includes('Tsalista') || k.includes('Faiza'));
  console.log(`  Contains raw student names: ${hasRawStudentNames}`);

  // Test 3: Simulated Gemini narrative fetch on PII column
  console.log('\n[Check 3] fetchGeminiNarrative on PII column:');
  const fallbackResult = await fetchGeminiNarrative(nameCol, 'fake_key', 1000);
  console.log(`  Fallback narrative returned: "${fallbackResult.narrative}"`);
  console.log(`  Is offline fallback: ${fallbackResult.isOfflineFallback}`);

  // Test 4: Prohibited chart injection resistance
  console.log('\n[Check 4] Prohibited Chart Injection:');
  const prohibited = ['radar', 'spider', '3d_pie_wedge', '3d_pie', 'dual_y_axis', 'bubble', '3d_surface'];
  for (const chart of prohibited) {
    assert.strictEqual(isChartTypeProhibited(chart), true);
    assert.strictEqual(validateChartSelection(chart).isValid, false);
  }
  console.log('  All prohibited charts properly blocked.');

  console.log('\n--- Audit Run Complete ---');
}

runAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
