const fs = require('fs');
const esbuild = require('esbuild');

const b = esbuild.buildSync({
  stdin: {
    contents: 
      export * from './src/services/demoDataService';
      export * from './src/services/geminiService';
      export * from './src/core/recommender/chartHeuristics';
      export * from './src/core/recommender/prohibitedRules';
      export * from './src/core/profiler/statistics';
      export * from './src/core/parser/csvParser';
    ,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});

const m = {};
new Function('module', 'exports', 'require', b.outputFiles[0].text)(m, (m.exports = {}), require);

const ds1 = m.exports.loadDemoSurvey1();
console.log('Dataset 1 columns:', ds1.columns.length);

const piiColumns = ds1.columns.filter(c => c.isPII || c.type === 'METADATA_PII');
console.log('PII columns count:', piiColumns.length);
for (const pii of piiColumns) {
  console.log('--- PII Column ---');
  console.log('cleanName:', pii.cleanName);
  console.log('type:', pii.type);
  console.log('isPII:', pii.isPII);
  console.log('isExcluded:', pii.isExcluded);
  console.log('recommendedChart:', pii.recommendedChart);
  console.log('selectedChart:', pii.selectedChart);
  console.log('distribution keys count:', Object.keys(pii.distribution).length);
  console.log('distribution sample keys:', Object.keys(pii.distribution).slice(0, 5));
  console.log('Prompt built:', m.exports.buildGeminiPrompt(pii));
}