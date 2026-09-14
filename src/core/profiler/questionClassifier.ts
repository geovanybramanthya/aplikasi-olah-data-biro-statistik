/**
 * 5-Tier Question Classification Engine for Survey Profiling
 * Classifies columns into:
 * 1. METADATA_PII
 * 2. DICHOTOMOUS_BINARY
 * 3. LIKERT_SCALE (1-4 and 1-5, preserving semantic direction even if a rating has 0 responses)
 * 4. MULTI_SELECT_CHECKBOX (using Token Repeat Ratio > 3.0 to differentiate from free-text)
 * 5. NOMINAL_DEMOGRAPHIC
 * 6. OPEN_ENDED_TEXT
 */

import { QuestionType } from '../../types/survey';
import { isPIIColumn } from '../parser/piiFilter';
import { calculateTokenRepeatRatio } from './multiSelectSplitter';

export interface ClassificationDetails {
  type: QuestionType;
  likertScaleMax?: 4 | 5;
  isMultiSelect: boolean;
  tokenRepeatRatio?: number;
  reason: string;
}

/**
 * Normalizes a raw survey value string:
 * - Trims whitespace
 * - Strips float .0 representation (e.g. "1.0" -> "1", "4.0" -> "4")
 */
export function normalizeValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // Strip trailing .0 from floating point numbers coming from Excel
  if (/^\d+\.0$/.test(str)) {
    str = str.replace(/\.0$/, '');
  }
  return str;
}

/**
 * Checks if a value is a non-informative placeholder or empty symbol.
 */
export function isPlaceholderValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  const str = String(val).trim().toLowerCase();
  return (
    str === '' ||
    str === '-' ||
    str === '--' ||
    str === '---' ||
    str === '_' ||
    str === '__' ||
    str === '.' ||
    str === '..' ||
    str === 'none' ||
    str === 'n/a' ||
    str === 'na' ||
    str === 'tidak ada' ||
    str === 'null' ||
    str === 'undefined'
  );
}

/**
 * Checks if values strictly represent an integer Likert rating scale (1-4 or 1-5).
 * Robust to missing categories (e.g. 0 responses for option 1).
 */
function checkLikertNumeric(
  uniqueVals: string[],
  cleanHeader: string
): { isLikert: boolean; scaleMax?: 4 | 5 } {
  if (uniqueVals.length === 0) return { isLikert: false };

  // Check if every unique value is a single-digit integer string in 1..5
  const isAllDigits1To5 = uniqueVals.every((v) => /^[1-5]$/.test(v));
  if (!isAllDigits1To5) return { isLikert: false };

  const numVals = uniqueVals.map((v) => parseInt(v, 10));
  const maxVal = Math.max(...numVals);
  const minVal = Math.min(...numVals);

  // If all numbers are within 1..4 and header suggests rating/scale or max is 4
  if (maxVal <= 4 && minVal >= 1) {
    // If there is any value 5 in 1..5, scaleMax is 5.
    // If max is 4, check if header implies 5-scale or 4-scale
    const isFiveScaleHint = /skala\s*1\s*-\s*5|1\s*s(\/|\.)d\s*5|1\s*sampai\s*5/i.test(cleanHeader);
    return { isLikert: true, scaleMax: isFiveScaleHint ? 5 : 4 };
  }

  if (maxVal === 5 && minVal >= 1) {
    return { isLikert: true, scaleMax: 5 };
  }

  return { isLikert: false };
}

/**
 * Classifies a survey column based on header and observed values.
 */
export function classifyQuestion(
  rawHeader: string,
  rawValues: unknown[]
): ClassificationDetails {
  const cleanHeader = rawHeader.trim().replace(/\s+/g, ' ');

  // 1. Check PII / Metadata Filter
  if (isPIIColumn(cleanHeader)) {
    return {
      type: 'METADATA_PII',
      isMultiSelect: false,
      reason: 'Matched PII/Metadata regex pattern',
    };
  }

  // Normalize all values and filter out empty cells
  const normalizedValues = rawValues
    .map((v) => normalizeValue(v))
    .filter((v) => v.length > 0);

  const totalValid = normalizedValues.length;
  if (totalValid === 0) {
    return {
      type: 'OPEN_ENDED_TEXT',
      isMultiSelect: false,
      reason: 'No valid responses',
    };
  }

  // Filter out non-informative placeholders ('-', '_', '.', 'tidak ada', 'none', 'n/a', etc.)
  const meaningfulValues = normalizedValues.filter((v) => !isPlaceholderValue(v));

  // If column contains ONLY placeholders, do not hallucinate categories
  if (meaningfulValues.length === 0) {
    return {
      type: 'OPEN_ENDED_TEXT',
      isMultiSelect: false,
      reason: 'Column contains only placeholder non-responses',
    };
  }

  // Count unique values from meaningful responses
  const uniqueValsSet = new Set<string>();
  let totalLength = 0;
  let rowsWithCommas = 0;

  for (const v of meaningfulValues) {
    uniqueValsSet.add(v);
    totalLength += v.length;
    if (v.includes(',')) {
      rowsWithCommas++;
    }
  }

  const uniqueValuesCount = uniqueValsSet.size;
  const uniqueValues = Array.from(uniqueValsSet);
  const avgLength = totalLength / meaningfulValues.length;
  const uniqueRowRatio = uniqueValuesCount / meaningfulValues.length;

  // 2. Check Dichotomous Binary (exactly 2 unique categories, e.g. Ya/Tidak, Pria/Wanita)
  if (uniqueValuesCount === 2) {
    const v0 = uniqueValues[0].toLowerCase();
    const v1 = uniqueValues[1].toLowerCase();

    // Standard binary pairs
    const isBinaryText =
      (v0 === 'ya' && (v1 === 'tidak' || v1 === 'tidak tahu')) ||
      (v1 === 'ya' && (v0 === 'tidak' || v0 === 'tidak tahu')) ||
      (v0 === 'yes' && v1 === 'no') ||
      (v1 === 'yes' && v0 === 'no') ||
      (v0 === 'true' && v1 === 'false') ||
      (v1 === 'true' && v0 === 'false') ||
      (v0 === 'setuju' && v1 === 'tidak setuju') ||
      (v1 === 'setuju' && v0 === 'tidak setuju') ||
      (v0 === 'laki-laki' && v1 === 'perempuan') ||
      (v1 === 'laki-laki' && v0 === 'perempuan') ||
      (v0 === 'pria' && v1 === 'wanita') ||
      (v1 === 'pria' && v0 === 'wanita') ||
      (v0 === 'pernah' && v1 === 'tidak pernah') ||
      (v1 === 'pernah' && v0 === 'tidak pernah') ||
      (v0 === 'sudah' && v1 === 'belum') ||
      (v1 === 'sudah' && v0 === 'belum');

    // Both categories must be genuine words/text with alphanumeric characters, not placeholders or punctuation
    const hasWordChars = /[\p{L}\p{N}]/u.test(v0) && /[\p{L}\p{N}]/u.test(v1);

    if (
      (isBinaryText || (hasWordChars && avgLength < 30 && !/^[1-5]$/.test(uniqueValues[0]))) &&
      !isPlaceholderValue(v0) &&
      !isPlaceholderValue(v1)
    ) {
      return {
        type: 'DICHOTOMOUS_BINARY',
        isMultiSelect: false,
        reason: 'Exactly 2 discrete categories',
      };
    }
  }

  // 3. Check Likert Scale (Numeric 1-4 or 1-5, with tolerance for missing option)
  const likertCheck = checkLikertNumeric(uniqueValues, cleanHeader);
  if (likertCheck.isLikert && likertCheck.scaleMax) {
    return {
      type: 'LIKERT_SCALE',
      likertScaleMax: likertCheck.scaleMax,
      isMultiSelect: false,
      reason: `Numeric Likert scale 1-${likertCheck.scaleMax}`,
    };
  }

  // 4. Check Multi-Select Checkboxes vs Open-Ended Text
  // Calculate Token Repeat Ratio on meaningful values
  const { totalTokens, uniqueTokens, ratio: tokenRepeatRatio } =
    calculateTokenRepeatRatio(meaningfulValues);

  const hasExplicitCheckboxHint =
    /\((maks|pilih|boleh\s*memilih|centang|select|jawaban\s*boleh\s*lebih)/i.test(cleanHeader);

  const hasGeneralTopicHint =
    /faktor|kendala|alasan|aspek|media|sarana|kebutuhan/i.test(cleanHeader);

  // Multi-Select Checkbox Condition:
  // - Rows contain commas
  // - Explicit multi-select hint in header (e.g. "(boleh memilih lebih dari 1)"):
  //   supports small N (e.g. N=3) with repeat ratio >= 1.2 and moderate length
  // - High Token Repeat Ratio (> 3.0, or > 2.0 with general topic hint)
  if (
    rowsWithCommas > 0 &&
    ((hasExplicitCheckboxHint && tokenRepeatRatio >= 1.2 && avgLength < 100) ||
      (tokenRepeatRatio > 3.0 && avgLength < 120) ||
      (tokenRepeatRatio > 2.0 && hasGeneralTopicHint && avgLength < 100))
  ) {
    return {
      type: 'MULTI_SELECT_CHECKBOX',
      isMultiSelect: true,
      tokenRepeatRatio,
      reason: hasExplicitCheckboxHint
        ? `Explicit multi-select hint with comma options (token repeat ratio: ${tokenRepeatRatio.toFixed(2)})`
        : `Token Repeat Ratio ${tokenRepeatRatio.toFixed(2)} > 3.0`,
    };
  }

  // 5. Check Open-Ended Text
  // Calculate metrics on meaningful values
  const nonPlaceholderValues = meaningfulValues;
  const nonPlaceholderCount = nonPlaceholderValues.length;
  let nonPlaceholderAvgLen = 0;
  let nonPlaceholderUniqueRatio = 0;

  if (nonPlaceholderCount > 0) {
    const nonPlaceholderUnique = new Set(nonPlaceholderValues).size;
    nonPlaceholderUniqueRatio = nonPlaceholderUnique / nonPlaceholderCount;
    const nonPlaceholderTotalLen = nonPlaceholderValues.reduce((acc, v) => acc + v.length, 0);
    nonPlaceholderAvgLen = nonPlaceholderTotalLen / nonPlaceholderCount;
  }

  const isOpenEndedHeader =
    /harapan|masukan|opini|ceritakan|kronologi|lokasi|perkiraan\s*waktu|waktu\s*\(|saran|catatan|evaluasi|deskripsi|komentar|keterangan/i.test(
      cleanHeader
    );

  if (
    isOpenEndedHeader ||
    (nonPlaceholderCount > 5 && nonPlaceholderUniqueRatio > 0.65 && nonPlaceholderAvgLen > 15) ||
    (uniqueRowRatio > 0.65 && avgLength > 28 && totalValid > 15) ||
    (avgLength > 50 && uniqueValuesCount > 10)
  ) {
    return {
      type: 'OPEN_ENDED_TEXT',
      isMultiSelect: false,
      reason: `Qualitative essay text (unique ratio: ${nonPlaceholderUniqueRatio.toFixed(2)}, avg len: ${nonPlaceholderAvgLen.toFixed(1)})`,
    };
  }

  // 6. Nominal / Demographics
  // Unordered categories (Fakultas, Bidang, Jabatan, Jenis Kelamin, dsb.)
  return {
    type: 'NOMINAL_DEMOGRAPHIC',
    isMultiSelect: false,
    reason: `Nominal demographic category (${uniqueValuesCount} unique options)`,
  };
}
