const esbuild = require('esbuild');
const b = esbuild.buildSync({
  stdin: {
    contents: 'export * from "./src/services/demoDataService"; export * from "./src/services/geminiService";',
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
const ds = m.exports.loadDemoSurvey1();
const piiCol = ds.columns[1];
console.log(JSON.stringify({
  cleanName: piiCol.cleanName,
  isPII: piiCol.isPII,
  prompt: m.exports.buildGeminiPrompt(piiCol),
  distSample: Object.keys(piiCol.distribution).slice(0, 3)
}, null, 2));
