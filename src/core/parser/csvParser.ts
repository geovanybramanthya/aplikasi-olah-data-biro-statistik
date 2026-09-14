/**
 * CSV Survey Ingestion & Profiling Engine
 * Uses PapaParse to parse RFC 4180-compliant CSV files with support for
 * quotes, commas, multiline strings, and header sanitization.
 */

import Papa from 'papaparse';
import { ColumnProfile, SurveyDataset } from '../../types/survey';
import { sanitizeHeader } from './piiFilter';
import { classifyQuestion, normalizeValue, isPlaceholderValue } from '../profiler/questionClassifier';
import { splitMultiSelectResponses } from '../profiler/multiSelectSplitter';
import { extractKeywordsAndThemes } from '../profiler/keywordExtractor';
import {
  calculateLikertStats,
  determineRecommendedChart,
  generateOfflineSummary,
} from '../profiler/statistics';

/**
 * Builds a complete SurveyDataset from raw headers and raw row objects.
 */
export function profileDataset(
  rawHeaders: string[],
  rawRows: Record<string, string>[],
  datasetName: string,
  fileName: string
): SurveyDataset {
  const columns: ColumnProfile[] = rawHeaders.map((rawHeader, columnIndex) => {
    const cleanName = sanitizeHeader(rawHeader) || `Kolom_${columnIndex + 1}`;
    const displayTitle = cleanName;
    const id = `col_${columnIndex}_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Extract all column values preserving position and avoiding duplicate key collisions
    const colValues: string[] = rawRows.map((row) => {
      const posKey = `__col_${columnIndex}`;
      if (posKey in row) return normalizeValue(row[posKey] ?? '');
      const colKey = `col_${columnIndex}`;
      if (colKey in row) return normalizeValue(row[colKey] ?? '');
      const dedupKey = `${rawHeader}_${columnIndex}`;
      if (dedupKey in row) return normalizeValue(row[dedupKey] ?? '');
      return normalizeValue(row[rawHeader] ?? '');
    });

    const totalResponses = colValues.length;
    let missingResponses = 0;
    const distribution: Record<string, number> = {};
    let maxLabelLength = 0;

    for (const val of colValues) {
      if (!val || val === '-' || val === '_') {
        missingResponses++;
      } else {
        distribution[val] = (distribution[val] || 0) + 1;
        if (val.length > maxLabelLength) {
          maxLabelLength = val.length;
        }
      }
    }

    const validResponses = totalResponses - missingResponses;
    const uniqueValuesCount = Object.keys(distribution).length;

    // Classify question type
    const classification = classifyQuestion(rawHeader, colValues);
    const type = classification.type;
    const isPII = type === 'METADATA_PII';
    const isExcluded = isPII;

    // Calculate specialized statistics based on question type
    let likertScale: ColumnProfile['likertScale'] = undefined;
    let multiSelect: ColumnProfile['multiSelect'] = undefined;
    let qualitativeSummary: ColumnProfile['qualitativeSummary'] = undefined;

    if (type === 'LIKERT_SCALE') {
      likertScale = calculateLikertStats(distribution, classification.likertScaleMax || 4);
    } else if (type === 'MULTI_SELECT_CHECKBOX') {
      const msResult = splitMultiSelectResponses(colValues, validResponses || totalResponses);
      multiSelect = {
        totalSelections: msResult.totalSelections,
        averageSelectionsPerRespondent: msResult.averageSelectionsPerRespondent,
        tokenFrequencies: msResult.tokenFrequencies,
      };
    } else if (type === 'OPEN_ENDED_TEXT') {
      const nonPlaceholderValues = colValues.filter((v) => !isPlaceholderValue(v));
      qualitativeSummary = extractKeywordsAndThemes(nonPlaceholderValues);
    }

    const recommendedChart = determineRecommendedChart(type, uniqueValuesCount, maxLabelLength);
    const selectedChart = recommendedChart;

    const offlineSummary = generateOfflineSummary({
      type,
      title: displayTitle,
      totalResponses,
      validResponses,
      distribution,
      likertStats: likertScale,
      multiSelectStats: multiSelect
        ? {
            totalSelections: multiSelect.totalSelections,
            averageSelectionsPerRespondent: multiSelect.averageSelectionsPerRespondent,
            tokenFrequencies: multiSelect.tokenFrequencies,
            uniqueTokensCount: multiSelect.tokenFrequencies.length,
            tokenRepeatRatio: classification.tokenRepeatRatio || 0,
          }
        : undefined,
      qualitativeSummary,
    });

    return {
      id,
      columnIndex,
      rawName: rawHeader,
      cleanName,
      displayTitle,
      type,
      isPII,
      isExcluded,
      recommendedChart,
      selectedChart,
      totalResponses,
      validResponses,
      missingResponses,
      uniqueValuesCount,
      distribution,
      likertScale,
      multiSelect,
      qualitativeSummary,
      collapseMinorOptions: true,
      offlineSummary,
    };
  });

  return {
    id: `survey_${Date.now()}`,
    name: datasetName,
    fileName,
    rowCount: rawRows.length,
    columns,
    rawRows,
  };
}

/**
 * Parses raw CSV string or File into a structured SurveyDataset.
 */
export function parseCSVString(
  csvContent: string,
  fileName: string = 'survey_upload.csv'
): Promise<SurveyDataset> {
  return new Promise((resolve, reject) => {
    if (!csvContent || csvContent.trim().length === 0) {
      return reject(new Error('File CSV kosong atau tidak memiliki baris data.'));
    }

    // Pre-normalize CRLF and LF line endings to avoid PapaParse delimiter lock
    const normalizedCsv = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    Papa.parse<string[]>(normalizedCsv, {
      header: false,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          if (!results.data || results.data.length < 2) {
            throw new Error('File CSV kosong atau tidak memiliki baris data.');
          }

          const rawHeaders = results.data[0].map((h) => String(h));
          const rawRows: Record<string, string>[] = [];

          for (let r = 1; r < results.data.length; r++) {
            const rowData = results.data[r];
            // Skip empty rows
            if (!rowData || rowData.length === 0 || (rowData.length === 1 && !rowData[0])) {
              continue;
            }

            const record: Record<string, string> = {};
            const headerCounts: Record<string, number> = {};

            for (let c = 0; c < rawHeaders.length; c++) {
              const header = rawHeaders[c];
              const val = rowData[c] !== undefined ? String(rowData[c]) : '';

              // Positional keys guarantee no column data loss even with duplicate headers
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
            }
            rawRows.push(record);
          }

          const datasetName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
          const dataset = profileDataset(rawHeaders, rawRows, datasetName, fileName);
          resolve(dataset);
        } catch (err) {
          reject(err);
        }
      },
      error: (error: Error) => {
        reject(new Error(`Gagal mem-parsing CSV: ${error.message}`));
      },
    });
  });
}
