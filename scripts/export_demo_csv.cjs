const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'contoh_data_survei');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Read demoSurvey1
const demo1File = path.join(projectRoot, 'src/data/demoSurvey1.ts');
const demo1Content = fs.readFileSync(demo1File, 'utf8');

// Quick extract using regex/eval in safe sandbox
const demo1RowsMatch = demo1Content.match(/export const DEMO_SURVEY_1_ROWS: Record<string, string>\[\] = (\[[\s\S]*?\]);/);
if (demo1RowsMatch) {
  const rows1 = eval(demo1RowsMatch[1]);
  const csv1 = Papa.unparse(rows1);
  fs.writeFileSync(path.join(outDir, 'Survei_1_Upgrading_Fungsionaris_BEM_UNDIP.csv'), csv1, 'utf8');
  console.log('Generated Survei_1_Upgrading_Fungsionaris_BEM_UNDIP.csv:', rows1.length, 'rows');
}

// 2. Read demoSurvey2
const demo2File = path.join(projectRoot, 'src/data/demoSurvey2.ts');
const demo2Content = fs.readFileSync(demo2File, 'utf8');

const demo2RowsMatch = demo2Content.match(/export const DEMO_SURVEY_2_ROWS: Record<string, string>\[\] = (\[[\s\S]*?\]);/);
if (demo2RowsMatch) {
  const rows2 = eval(demo2RowsMatch[1]);
  const csv2 = Papa.unparse(rows2);
  fs.writeFileSync(path.join(outDir, 'Survei_2_Persepsi_Keamanan_Kampus_UNDIP.csv'), csv2, 'utf8');
  console.log('Generated Survei_2_Persepsi_Keamanan_Kampus_UNDIP.csv:', rows2.length, 'rows');
}
