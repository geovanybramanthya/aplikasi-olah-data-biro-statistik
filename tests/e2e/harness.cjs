/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * E2E Test Harness & Authoritative Specification Oracles
 * 
 * Provides unified test assertions, async suite execution,
 * dynamic binding to src/core modules, and mathematically verified
 * specification oracles derived from ORIGINAL_REQUEST.md & PROJECT.md.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const JSZip = require('jszip');

// Global test registry
const results = {
  tier1: [],
  tier2: [],
  tier3: [],
  tier4: [],
};

let currentTier = 'tier1';
let currentSuite = '';

function setTier(tier) {
  currentTier = tier;
}

function describe(suiteName, fn) {
  const previousSuite = currentSuite;
  currentSuite = suiteName;
  try {
    fn();
  } finally {
    currentSuite = previousSuite;
  }
}

async function test(testName, fn) {
  const fullName = currentSuite ? `${currentSuite} > ${testName}` : testName;
  const start = Date.now();
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      await res;
    }
    const durationMs = Date.now() - start;
    results[currentTier].push({
      name: fullName,
      status: 'pass',
      durationMs,
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    results[currentTier].push({
      name: fullName,
      status: 'fail',
      error: err,
      durationMs,
    });
  }
}

function getResults() {
  return results;
}

function resetResults() {
  results.tier1 = [];
  results.tier2 = [];
  results.tier3 = [];
  results.tier4 = [];
}

// ---------------------------------------------------------
// Authoritative Specifications & Oracles (F1 - F29)
// ---------------------------------------------------------

// F3: Header Sanitization
function sanitizeHeader(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\u00A0/g, ' ').trim().replace(/\s+/g, ' ');
}

// F4: PII / Metadata Patterns
const PII_PATTERNS = [
  /^(timestamp|waktu|tanggal|date|tanda\s*waktu)$/i,
  /^(nama|name|full\s*name|nama\s*lengkap|nama\s*\(.*?\)|nama\s*responden|nama\s*mahasiswa)/i,
  /^(nim|npm|nrp|nomor\s*induk(\s*mahasiswa)?|student\s*id)$/i,
  /^(email.*|surel.*|e-mail.*|alamat\s*email.*)$/i,
  /^(no\.?\s*hp|nomor\s*hp|no\.?\s*wa|nomor\s*(wa|whatsapp)|whatsapp|telepon|no\.?\s*telepon|phone|nomor\s*telepon|kontak|nomor\s*kontak)$/i,
];

function isPIIColumn(header) {
  if (!header) return false;
  const clean = sanitizeHeader(header);
  return PII_PATTERNS.some((pattern) => pattern.test(clean));
}

// F5, F6, F7, F8, F9: Profiler Heuristics
function normalizeValue(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (/^\d+\.0$/.test(str)) {
    str = str.replace(/\.0$/, '');
  }
  return str;
}

function calculateTokenRepeatRatio(values) {
  let totalTokens = 0;
  const uniqueSet = new Set();

  for (const val of values) {
    if (!val || typeof val !== 'string') continue;
    const tokens = val
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t !== '-' && t !== '_');

    for (const token of tokens) {
      totalTokens++;
      uniqueSet.add(token.toLowerCase());
    }
  }

  const uniqueTokens = uniqueSet.size;
  const ratio = uniqueTokens > 0 ? totalTokens / uniqueTokens : 0;
  return { totalTokens, uniqueTokens, ratio };
}

function splitMultiSelectResponses(values, totalRespondents) {
  const tokenCounts = new Map();
  let totalSelections = 0;

  for (const rowVal of values) {
    if (!rowVal || typeof rowVal !== 'string') continue;
    const rowTokens = rowVal
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t !== '-' && t !== '_');

    const uniqueRowTokens = Array.from(new Set(rowTokens));
    for (const token of uniqueRowTokens) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
      totalSelections++;
    }
  }

  const effectiveN = totalRespondents > 0 ? totalRespondents : 1;
  const tokenFrequencies = [];

  for (const [token, count] of tokenCounts.entries()) {
    const percentage = Number(((count / effectiveN) * 100).toFixed(1));
    tokenFrequencies.push({ token, count, percentage });
  }

  tokenFrequencies.sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));

  const uniqueTokensCount = tokenCounts.size;
  const tokenRepeatRatio = uniqueTokensCount > 0 ? totalSelections / uniqueTokensCount : 0;
  const averageSelectionsPerRespondent = Number((totalSelections / effectiveN).toFixed(2));

  return {
    totalSelections,
    averageSelectionsPerRespondent,
    tokenFrequencies,
    uniqueTokensCount,
    tokenRepeatRatio,
  };
}

function checkLikertNumeric(uniqueVals, cleanHeader) {
  if (!uniqueVals || uniqueVals.length === 0) return { isLikert: false };
  const isAllDigits1To5 = uniqueVals.every((v) => /^[1-5]$/.test(v));
  if (!isAllDigits1To5) return { isLikert: false };

  const numVals = uniqueVals.map((v) => parseInt(v, 10));
  const maxVal = Math.max(...numVals);
  const minVal = Math.min(...numVals);

  if (maxVal <= 4 && minVal >= 1) {
    const isFiveScaleHint = /skala\s*1\s*-\s*5|1\s*s(\/|\.)d\s*5|1\s*sampai\s*5/i.test(cleanHeader);
    return { isLikert: true, scaleMax: isFiveScaleHint ? 5 : 4 };
  }

  if (maxVal === 5 && minVal >= 1) {
    return { isLikert: true, scaleMax: 5 };
  }

  return { isLikert: false };
}

function classifyQuestion(rawHeader, rawValues) {
  const cleanHeader = sanitizeHeader(rawHeader);

  if (isPIIColumn(cleanHeader)) {
    return {
      type: 'METADATA_PII',
      isMultiSelect: false,
      reason: 'Matched PII/Metadata regex pattern',
    };
  }

  const normalizedValues = (rawValues || [])
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

  const uniqueValsSet = new Set();
  let totalLength = 0;
  let rowsWithCommas = 0;

  for (const v of normalizedValues) {
    uniqueValsSet.add(v);
    totalLength += v.length;
    if (v.includes(',')) rowsWithCommas++;
  }

  const uniqueValuesCount = uniqueValsSet.size;
  const uniqueValues = Array.from(uniqueValsSet);
  const avgLength = totalLength / totalValid;
  const uniqueRowRatio = uniqueValuesCount / totalValid;

  // Dichotomous Binary
  if (uniqueValuesCount === 2) {
    const v0 = uniqueValues[0].toLowerCase();
    const v1 = uniqueValues[1].toLowerCase();
    const isBinaryText =
      (v0 === 'ya' && (v1 === 'tidak' || v1 === 'tidak tahu')) ||
      (v1 === 'ya' && (v0 === 'tidak' || v0 === 'tidak tahu')) ||
      (v0 === 'setuju' && v1 === 'tidak setuju') ||
      (v1 === 'setuju' && v0 === 'tidak setuju') ||
      (v0 === 'laki-laki' && v1 === 'perempuan') ||
      (v0 === 'pria' && v1 === 'wanita') ||
      (v0 === 'pernah' && v1 === 'tidak pernah') ||
      (v1 === 'pernah' && v0 === 'tidak pernah');

    if (isBinaryText || (avgLength < 30 && !/^[1-5]$/.test(uniqueValues[0]))) {
      return {
        type: 'DICHOTOMOUS_BINARY',
        isMultiSelect: false,
        reason: 'Exactly 2 discrete categories',
      };
    }
  }

  // Likert Scale
  const likertCheck = checkLikertNumeric(uniqueValues, cleanHeader);
  if (likertCheck.isLikert && likertCheck.scaleMax) {
    return {
      type: 'LIKERT_SCALE',
      likertScaleMax: likertCheck.scaleMax,
      isMultiSelect: false,
      reason: `Numeric Likert scale 1-${likertCheck.scaleMax}`,
    };
  }

  // Multi-Select Checkboxes
  const { ratio: tokenRepeatRatio } = calculateTokenRepeatRatio(normalizedValues);
  const hasCheckboxHint = /\(maks\.?\s*\d+\)|\(boleh\s*memilih|pilihlah|faktor|kendala|alasan|aspek/i.test(cleanHeader);

  if (
    rowsWithCommas > 0 &&
    ((tokenRepeatRatio > 3.0 && avgLength < 120) ||
      (tokenRepeatRatio > 2.2 && hasCheckboxHint && avgLength < 100))
  ) {
    return {
      type: 'MULTI_SELECT_CHECKBOX',
      isMultiSelect: true,
      tokenRepeatRatio,
      reason: `Token Repeat Ratio ${tokenRepeatRatio.toFixed(2)} > 3.0`,
    };
  }

  // Open-Ended Text
  const isOpenEndedHeader = /harapan|masukan|opini|ceritakan|kronologi|lokasi\s*detail|waktu\s*kejadian|saran|catatan|evaluasi|deskripsi/i.test(cleanHeader);
  if (
    isOpenEndedHeader ||
    (uniqueRowRatio > 0.65 && avgLength > 28 && totalValid > 15) ||
    (avgLength > 50 && uniqueValuesCount > 10)
  ) {
    return {
      type: 'OPEN_ENDED_TEXT',
      isMultiSelect: false,
      reason: `Qualitative essay text (unique ratio: ${uniqueRowRatio.toFixed(2)}, avg len: ${avgLength.toFixed(1)})`,
    };
  }

  // Nominal Demographic
  return {
    type: 'NOMINAL_DEMOGRAPHIC',
    isMultiSelect: false,
    reason: `Nominal demographic category (${uniqueValuesCount} unique options)`,
  };
}

// F1, F2: File Ingestion
function parseCSVText(csvContent, fileName = 'survey.csv') {
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const rawHeaders = parsed.meta.fields || [];
  const cleanHeaders = rawHeaders.map(sanitizeHeader);
  const rawRows = parsed.data || [];
  const rowCount = rawRows.length;

  const columns = rawHeaders.map((rawHeader, idx) => {
    const cleanName = cleanHeaders[idx];
    const isPII = isPIIColumn(cleanName);
    const colValues = rawRows.map((r) => r[rawHeader]);
    const classification = classifyQuestion(cleanName, colValues);
    const uniqueVals = new Set(colValues.map(normalizeValue).filter((v) => v.length > 0));
    const maxLabelLen = Array.from(uniqueVals).reduce((max, val) => Math.max(max, val.length), 0);
    const recommendedChart = determineRecommendedChart(classification.type, uniqueVals.size, maxLabelLen);

    const distribution = {};
    for (const val of colValues) {
      const norm = normalizeValue(val);
      if (norm) distribution[norm] = (distribution[norm] || 0) + 1;
    }

    return {
      id: `col_${idx}`,
      columnIndex: idx,
      rawName: rawHeader,
      cleanName,
      displayTitle: cleanName,
      type: classification.type,
      isPII,
      isExcluded: isPII,
      recommendedChart,
      selectedChart: recommendedChart,
      totalResponses: rowCount,
      validResponses: Object.values(distribution).reduce((a, b) => a + b, 0),
      missingResponses: rowCount - Object.values(distribution).reduce((a, b) => a + b, 0),
      uniqueValuesCount: uniqueVals.size,
      distribution,
      offlineSummary: '',
    };
  });

  return {
    id: `survey_${Date.now()}`,
    name: path.basename(fileName, path.extname(fileName)),
    fileName,
    rowCount,
    columns,
    rawRows,
  };
}

function parseExcelBuffer(buffer, fileName = 'survey.xlsx') {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!jsonRows || jsonRows.length === 0) {
    return {
      id: `survey_${Date.now()}`,
      name: path.basename(fileName, path.extname(fileName)),
      fileName,
      rowCount: 0,
      columns: [],
      rawRows: [],
    };
  }

  const rawHeaders = (jsonRows[0] || []).map((h) => String(h || ''));
  const cleanHeaders = rawHeaders.map(sanitizeHeader);
  const dataRows = jsonRows.slice(1);
  const rowCount = dataRows.length;

  const rawRows = dataRows.map((row) => {
    const obj = {};
    rawHeaders.forEach((h, i) => {
      obj[h] = normalizeValue(row[i]);
    });
    return obj;
  });

  const columns = rawHeaders.map((rawHeader, idx) => {
    const cleanName = cleanHeaders[idx];
    const isPII = isPIIColumn(cleanName);
    const colValues = rawRows.map((r) => r[rawHeader]);
    const classification = classifyQuestion(cleanName, colValues);
    const uniqueVals = new Set(colValues.map(normalizeValue).filter((v) => v.length > 0));
    const maxLabelLen = Array.from(uniqueVals).reduce((max, val) => Math.max(max, val.length), 0);
    const recommendedChart = determineRecommendedChart(classification.type, uniqueVals.size, maxLabelLen);

    const distribution = {};
    for (const val of colValues) {
      const norm = normalizeValue(val);
      if (norm) distribution[norm] = (distribution[norm] || 0) + 1;
    }

    return {
      id: `col_${idx}`,
      columnIndex: idx,
      rawName: rawHeader,
      cleanName,
      displayTitle: cleanName,
      type: classification.type,
      isPII,
      isExcluded: isPII,
      recommendedChart,
      selectedChart: recommendedChart,
      totalResponses: rowCount,
      validResponses: Object.values(distribution).reduce((a, b) => a + b, 0),
      missingResponses: rowCount - Object.values(distribution).reduce((a, b) => a + b, 0),
      uniqueValuesCount: uniqueVals.size,
      distribution,
      offlineSummary: '',
    };
  });

  return {
    id: `survey_${Date.now()}`,
    name: path.basename(fileName, path.extname(fileName)),
    fileName,
    rowCount,
    columns,
    rawRows,
  };
}

// F11, F12, F13, F14, F15: Recommendations & Banned Charts
function determineRecommendedChart(type, uniqueCount, maxLabelLength) {
  switch (type) {
    case 'METADATA_PII':
      return 'none';
    case 'DICHOTOMOUS_BINARY':
      return 'donut';
    case 'LIKERT_SCALE':
      return 'ordered_likert';
    case 'MULTI_SELECT_CHECKBOX':
      return 'ranked_bar';
    case 'OPEN_ENDED_TEXT':
      return 'text_feed';
    case 'NOMINAL_DEMOGRAPHIC':
      if (uniqueCount <= 3 && maxLabelLength <= 15) return 'donut';
      if (uniqueCount <= 6 && maxLabelLength <= 12) return 'vertical_bar';
      return 'horizontal_bar';
    default:
      return 'horizontal_bar';
  }
}

const PROHIBITED_CHARTS = [
  'radar',
  'spider',
  '3d_pie_wedge',
  '3d_pie',
  'dual_y_axis',
  'bubble',
  '3d_surface',
];

function isChartTypeProhibited(chartType) {
  if (!chartType) return false;
  const clean = chartType.toLowerCase().trim();
  return PROHIBITED_CHARTS.includes(clean);
}

// F16: Curation Operations
function overrideChartType(column, newChart) {
  if (isChartTypeProhibited(newChart)) {
    throw new Error(`Chart type '${newChart}' is strictly prohibited.`);
  }
  return {
    ...column,
    selectedChart: newChart,
  };
}

function updateColumnTitle(column, newTitle) {
  return {
    ...column,
    displayTitle: sanitizeHeader(newTitle) || column.cleanName,
  };
}

function toggleColumnExclusion(column, isExcluded) {
  return {
    ...column,
    isExcluded: Boolean(isExcluded),
  };
}

function reorderColumns(columns, fromIndex, toIndex) {
  const result = [...columns];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result.map((col, idx) => ({ ...col, columnIndex: idx }));
}

// F17: Offline Statistical Calculations
const DEFAULT_LIKERT_4_LABELS = {
  1: 'Sangat Tidak Setuju / Sangat Rendah',
  2: 'Tidak Setuju / Rendah',
  3: 'Setuju / Cukup Tinggi',
  4: 'Sangat Setuju / Tinggi',
};

const DEFAULT_LIKERT_5_LABELS = {
  1: 'Sangat Jarang / Sangat Rendah',
  2: 'Jarang / Rendah',
  3: 'Kadang-kadang / Netral',
  4: 'Sering / Tinggi',
  5: 'Sangat Sering / Sangat Tinggi',
};

function calculateLikertStats(distribution, scaleMax = 4) {
  const min = 1;
  const max = scaleMax;
  const labels = scaleMax === 5 ? DEFAULT_LIKERT_5_LABELS : DEFAULT_LIKERT_4_LABELS;

  let totalWeightedScore = 0;
  let totalCount = 0;
  let topBoxCount = 0;
  const scoreArray = [];

  for (let score = min; score <= max; score++) {
    const count = distribution[String(score)] || distribution[`${score}.0`] || 0;
    totalWeightedScore += score * count;
    totalCount += count;
    if (score >= 4) topBoxCount += count;
    for (let i = 0; i < count; i++) scoreArray.push(score);
  }

  const mean = totalCount > 0 ? Number((totalWeightedScore / totalCount).toFixed(2)) : 0;
  const netPositivePercent = totalCount > 0 ? Number(((topBoxCount / totalCount) * 100).toFixed(1)) : 0;

  let median = 0;
  if (scoreArray.length > 0) {
    scoreArray.sort((a, b) => a - b);
    const mid = Math.floor(scoreArray.length / 2);
    if (scoreArray.length % 2 !== 0) {
      median = scoreArray[mid];
    } else {
      median = Number(((scoreArray[mid - 1] + scoreArray[mid]) / 2).toFixed(1));
    }
  }

  return { min, max, labels, mean, median, netPositivePercent };
}

function generateOfflineSummary(params) {
  const { type, validResponses, distribution, likertStats, multiSelectStats } = params;

  if (type === 'METADATA_PII') {
    return `Kolom metadata sistem/identitas responden (${validResponses} entri). Diabaikan dari visualisasi publik untuk menjaga privasi.`;
  }
  if (type === 'OPEN_ENDED_TEXT') {
    return `Terdapat ${validResponses} jawaban kualitatif terbuka. Menampilkan umpan naratif untuk analisis masukan deskriptif responden.`;
  }
  if (type === 'LIKERT_SCALE' && likertStats) {
    const tendency =
      likertStats.mean >= 3.5
        ? 'positif / sangat tinggi'
        : likertStats.mean >= 2.5
        ? 'moderat / cukup'
        : 'rendah / cenderung tidak setuju';
    return `Tingkat persetujuan responden mencapai ${likertStats.netPositivePercent}% (Top-Box skor 4 & 5), dengan skor rata-rata ${likertStats.mean} dari skala ${likertStats.max}. Mayoritas responden cenderung bersikap ${tendency} (N = ${validResponses}).`;
  }
  if (type === 'MULTI_SELECT_CHECKBOX' && multiSelectStats) {
    const topTokens = multiSelectStats.tokenFrequencies;
    if (topTokens.length === 0) return `Tidak ada opsi yang dipilih pada pertanyaan ini (N = ${validResponses}).`;
    const first = topTokens[0];
    const second = topTokens.length > 1 ? topTokens[1] : null;
    if (second) {
      return `Pilihan paling dominan adalah '${first.token}' dipilih oleh ${first.percentage}% responden (n=${first.count}), diikuti oleh '${second.token}' (${second.percentage}%, n=${second.count}). Rata-rata responden memilih ${multiSelectStats.averageSelectionsPerRespondent} opsi (total ${multiSelectStats.totalSelections} pilihan).`;
    }
    return `Pilihan utama adalah '${first.token}' dipilih oleh ${first.percentage}% responden (n=${first.count}). Total ${multiSelectStats.totalSelections} pilihan dari ${validResponses} responden.`;
  }

  const entries = Object.entries(distribution || {}).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return `Tidak ada data valid untuk pertanyaan ini.`;

  const [topKey, topVal] = entries[0];
  const topPct = validResponses > 0 ? ((topVal / validResponses) * 100).toFixed(1) : '0';

  if (type === 'DICHOTOMOUS_BINARY' && entries.length === 2) {
    const [secondKey, secondVal] = entries[1];
    const secondPct = validResponses > 0 ? ((secondVal / validResponses) * 100).toFixed(1) : '0';
    return `Sebanyak ${topPct}% responden (n=${topVal}) memilih '${topKey}', sedangkan ${secondPct}% (n=${secondVal}) memilih '${secondKey}' dari total ${validResponses} responden.`;
  }
  if (entries.length > 1) {
    const [secondKey, secondVal] = entries[1];
    const secondPct = validResponses > 0 ? ((secondVal / validResponses) * 100).toFixed(1) : '0';
    return `Mayoritas responden (${topPct}%, n=${topVal}) memilih '${topKey}', diikuti oleh '${secondKey}' sebesar ${secondPct}% (n=${secondVal}) dari total ${validResponses} responden (${entries.length} kategori).`;
  }
  return `Seluruh responden yang menjawab (${topPct}%, n=${topVal}) memilih '${topKey}' (N = ${validResponses}).`;
}

// F18: Gemini Prompt Builder & Fallback
function buildGeminiPrompt(column) {
  // Strip any personal identification - only send aggregated distribution and question title
  return JSON.stringify({
    role: 'Analis Kebijakan Mahasiswa BEM Universitas Diponegoro',
    question: column.displayTitle,
    type: column.type,
    n_valid: column.validResponses,
    distribution: column.distribution,
  });
}

function resolveNarrativeWithFallback(column, apiKey, isOnline = true) {
  if (!apiKey || !apiKey.trim() || !isOnline) {
    return {
      narrative: generateOfflineSummary({
        type: column.type,
        title: column.displayTitle,
        totalResponses: column.totalResponses,
        validResponses: column.validResponses,
        distribution: column.distribution,
        likertStats: column.likertScale,
      }),
      isOfflineFallback: true,
    };
  }
  return {
    narrative: `[Gemini AI] Mayoritas responden merekomendasikan fokus strategis pada ${column.displayTitle}.`,
    isOfflineFallback: false,
  };
}

// F19, F20, F21: Theming & Palettes
const FONT_FAMILIES = [
  'Poppins',
  'Montserrat',
  'Inter',
  'Plus Jakarta Sans',
  'Roboto',
  'Merriweather',
];

function calculateTypographyScale(preset = 'medium') {
  switch (preset) {
    case 'small':
      return { titleFontSize: 18, subtitleFontSize: 13, labelFontSize: 11, badgeFontSize: 11 };
    case 'large':
      return { titleFontSize: 24, subtitleFontSize: 16, labelFontSize: 14, badgeFontSize: 14 };
    case 'medium':
    default:
      return { titleFontSize: 20, subtitleFontSize: 14, labelFontSize: 12, badgeFontSize: 12 };
  }
}

const INSTITUTIONAL_PALETTES = {
  undip_navy_gold: {
    id: 'undip_navy_gold',
    name: 'UNDIP Navy & Gold',
    colors: ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2', '#F9E79F'],
  },
  modern_emerald: {
    id: 'modern_emerald',
    name: 'Modern Emerald',
    colors: ['#0E6251', '#16A085', '#2ECC71', '#82E0AA', '#117A65', '#A3E4D7'],
  },
  executive_pastel: {
    id: 'executive_pastel',
    name: 'Executive Pastel',
    colors: ['#6C88C4', '#C47D9B', '#7BAE9D', '#E8A87C', '#E0C366', '#958DC4'],
  },
  warm_sunset: {
    id: 'warm_sunset',
    name: 'Warm Sunset',
    colors: ['#C0392B', '#E67E22', '#F39C12', '#E74C3C', '#D35400', '#F1C40F'],
  },
};

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function validateCustomPalette(input) {
  let colors = [];
  if (Array.isArray(input)) {
    colors = input.map((c) => String(c).trim());
  } else if (typeof input === 'string') {
    colors = input
      .split(/[\s,;]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }

  // Auto-prepend # if 3 or 6 hex digits
  colors = colors.map((c) => (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(c) ? `#${c}` : c));

  const validColors = [];
  const errors = [];

  for (const c of colors) {
    if (HEX_REGEX.test(c)) {
      validColors.push(c.toUpperCase());
    } else {
      errors.push(`Format hex tidak valid: '${c}'`);
    }
  }

  if (validColors.length < 5) {
    errors.push(`Minimal 5 kode hex warna valid diperlukan (saat ini: ${validColors.length}/5)`);
  }

  return {
    isValid: errors.length === 0,
    colors: validColors,
    errors,
  };
}

// F22, F23, F24, F25: Dimensionality & Watermark
const WATERMARK_TEXT = 'Biro Statistika BEM Universitas Diponegoro';

function resolveDimensionality(globalMode, cardOverride) {
  if (cardOverride === '2d' || cardOverride === '3d') {
    return cardOverride;
  }
  return globalMode || '2d';
}

// F26, F27, F28, F29: Export & Padding Calculation
function calculateDynamicPadding(labels = [], chartType = 'horizontal_bar') {
  if (chartType !== 'horizontal_bar' && chartType !== 'ranked_bar') {
    return { left: 40, right: 40, top: 70, bottom: 50 };
  }
  const maxLabelLen = labels.reduce((max, l) => Math.max(max, String(l).length), 0);
  const leftPadding = Math.min(260, Math.max(80, Math.round(maxLabelLen * 7.5)));
  return { left: leftPadding, right: 50, top: 70, bottom: 50 };
}

function wrapLabel(text, maxCharsPerLine = 22) {
  if (!text) return [];
  const words = String(text).split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function determineBadgePlacement(value, maxValue) {
  if (maxValue <= 0) return 'outside';
  return value / maxValue > 0.25 ? 'inside' : 'outside';
}

function sanitizeExportFilename(index, title) {
  const prefix = String(index).padStart(2, '0');
  const slug = (title || 'chart')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return `chart_${prefix}_${slug}.png`;
}

function buildExportManifest(columns, theme) {
  const lines = [
    '=================================================================',
    '  BIRO STATISTIKA BEM UNIVERSITAS DIPONEGORO - AUDIT MANIFEST',
    '=================================================================',
    `Export Date   : ${new Date().toISOString()}`,
    `Typography    : ${theme.fontFamily || 'Poppins'}`,
    `Active Palette: ${theme.activePaletteId || 'undip_navy_gold'}`,
    `Watermark     : ${theme.showWatermark ? 'Enabled' : 'Disabled'}`,
    `Watermark Text: "${theme.watermarkText || WATERMARK_TEXT}"`,
    `Total Columns : ${columns.length}`,
    '-----------------------------------------------------------------',
    'Exported Charts:',
  ];

  let exportedIndex = 1;
  for (const col of columns) {
    if (!col.isExcluded) {
      const chartType = (col.selectedChart || 'chart').toUpperCase();
      const title = col.displayTitle || col.cleanName || 'Chart';
      const n = col.validResponses || 0;
      lines.push(
        `  ${String(exportedIndex).padStart(2, '0')}. [${chartType}] ${title} (N=${n})`
      );
      exportedIndex++;
    }
  }

  lines.push('=================================================================');
  return lines.join('\n');
}

async function packageBatchZip(charts, manifestContent) {
  const zip = new JSZip();
  zip.file('SURVEY_SUMMARY_AUDIT.txt', manifestContent);

  for (const chart of charts) {
    // If string or buffer
    zip.file(chart.filename, chart.data);
  }

  return await zip.generateAsync({ type: 'nodebuffer' });
}

module.exports = {
  // Test Harness
  setTier,
  describe,
  test,
  assert,
  getResults,
  resetResults,

  // Profiler & Parser
  sanitizeHeader,
  isPIIColumn,
  PII_PATTERNS,
  normalizeValue,
  calculateTokenRepeatRatio,
  splitMultiSelectResponses,
  checkLikertNumeric,
  classifyQuestion,
  parseCSVText,
  parseExcelBuffer,

  // Recommender & Rules
  determineRecommendedChart,
  PROHIBITED_CHARTS,
  isChartTypeProhibited,

  // Curation
  overrideChartType,
  updateColumnTitle,
  toggleColumnExclusion,
  reorderColumns,

  // Statistics & Gemini
  DEFAULT_LIKERT_4_LABELS,
  DEFAULT_LIKERT_5_LABELS,
  calculateLikertStats,
  generateOfflineSummary,
  buildGeminiPrompt,
  resolveNarrativeWithFallback,

  // Theming
  FONT_FAMILIES,
  calculateTypographyScale,
  INSTITUTIONAL_PALETTES,
  HEX_REGEX,
  validateCustomPalette,
  WATERMARK_TEXT,
  resolveDimensionality,

  // Export
  calculateDynamicPadding,
  wrapLabel,
  determineBadgePlacement,
  sanitizeExportFilename,
  buildExportManifest,
  packageBatchZip,
  JSZip,
};
