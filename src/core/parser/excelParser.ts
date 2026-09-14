/**
 * Excel Survey Ingestion Engine (.xlsx and .xls)
 * Uses SheetJS (xlsx) to parse workbook sheets, normalize float and integer values,
 * and profile the survey dataset.
 */

import * as XLSX from 'xlsx';
import { SurveyDataset } from '../../types/survey';
import { profileDataset } from './csvParser';
import { normalizeValue } from '../profiler/questionClassifier';

/**
 * Parses an Excel file (ArrayBuffer or Uint8Array) into a structured SurveyDataset.
 * Reads the first sheet of the workbook.
 */
export function parseExcelBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string = 'survey_upload.xlsx'
): SurveyDataset {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Workbook Excel tidak memiliki lembar kerja (worksheet).');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert worksheet to array of rows (header: 1)
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rows || rows.length < 2) {
    throw new Error('Lembar kerja Excel kosong atau tidak memiliki data.');
  }

  const rawHeaders = (rows[0] as unknown[]).map((cell) => String(cell ?? ''));
  const rawRows: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const rowCells = rows[r] as unknown[];
    if (!rowCells || rowCells.length === 0) continue;

    const record: Record<string, string> = {};
    const headerCounts: Record<string, number> = {};
    let hasNonEmpty = false;

    for (let c = 0; c < rawHeaders.length; c++) {
      const header = rawHeaders[c];
      const val = normalizeValue(rowCells[c]);
      record[`__col_${c}`] = val;
      record[`col_${c}`] = val;

      const count = headerCounts[header] || 0;
      headerCounts[header] = count + 1;
      if (count === 0) {
        record[header] = val;
      } else {
        record[`${header}_${c}`] = val;
        record[`${header} (${count})`] = val;
      }

      if (val.length > 0) {
        hasNonEmpty = true;
      }
    }

    if (hasNonEmpty) {
      rawRows.push(record);
    }
  }

  const datasetName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  return profileDataset(rawHeaders, rawRows, datasetName, fileName);
}
