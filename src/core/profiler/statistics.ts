/**
 * Offline Statistical Engine for Survey Ingestion & Profiling
 * Calculates descriptive statistics (mean, median, mode, net positive agreement, top-box)
 * and generates 100% offline Indonesian narrative summaries without network calls.
 */

import { QuestionType, ChartType } from '../../types/survey';
import { MultiSelectAnalysis } from './multiSelectSplitter';

export interface LikertStats {
  min: number;
  max: number;
  labels: Record<number, string>;
  mean: number;
  median: number;
  netPositivePercent: number; // Percentage scoring 4 or 5
}

export const DEFAULT_LIKERT_4_LABELS: Record<number, string> = {
  1: 'Sangat Tidak Setuju / Sangat Rendah',
  2: 'Tidak Setuju / Rendah',
  3: 'Setuju / Cukup Tinggi',
  4: 'Sangat Setuju / Tinggi',
};

export const DEFAULT_LIKERT_5_LABELS: Record<number, string> = {
  1: 'Sangat Jarang / Sangat Rendah',
  2: 'Jarang / Rendah',
  3: 'Kadang-kadang / Netral',
  4: 'Sering / Tinggi',
  5: 'Sangat Sering / Sangat Tinggi',
};

/**
 * Calculates Likert scale statistics from distribution counts.
 */
export function calculateLikertStats(
  distribution: Record<string, number>,
  scaleMax: 4 | 5 = 4
): LikertStats {
  const min = 1;
  const max = scaleMax;
  const labels = scaleMax === 5 ? DEFAULT_LIKERT_5_LABELS : DEFAULT_LIKERT_4_LABELS;

  let totalWeightedScore = 0;
  let totalCount = 0;
  let topBoxCount = 0;
  const scoreArray: number[] = [];

  for (let score = min; score <= max; score++) {
    const count = distribution[String(score)] || distribution[`${score}.0`] || 0;
    totalWeightedScore += score * count;
    totalCount += count;
    if (score >= 4) {
      topBoxCount += count;
    }
    for (let i = 0; i < count; i++) {
      scoreArray.push(score);
    }
  }

  const mean = totalCount > 0 ? Number((totalWeightedScore / totalCount).toFixed(2)) : 0;
  const netPositivePercent = totalCount > 0 ? Number(((topBoxCount / totalCount) * 100).toFixed(1)) : 0;

  // Calculate Median
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

  return {
    min,
    max,
    labels,
    mean,
    median,
    netPositivePercent,
  };
}

/**
 * Generates an executive Indonesian summary string based on question type and metrics.
 */
export function generateOfflineSummary(params: {
  type: QuestionType;
  title: string;
  totalResponses: number;
  validResponses: number;
  distribution: Record<string, number>;
  likertStats?: LikertStats;
  multiSelectStats?: MultiSelectAnalysis;
  qualitativeSummary?: {
    totalResponses: number;
    meaningfulResponses: number;
    topKeywords: Array<{ keyword: string; count: number; percentage: number }>;
  };
}): string {
  const { type, validResponses, distribution, likertStats, multiSelectStats, qualitativeSummary } = params;

  if (type === 'METADATA_PII') {
    return `Kolom metadata sistem/identitas responden (${validResponses} entri). Diabaikan dari visualisasi publik untuk menjaga privasi.`;
  }

  if (type === 'OPEN_ENDED_TEXT') {
    if (qualitativeSummary?.topKeywords && qualitativeSummary.topKeywords.length > 0) {
      const first = qualitativeSummary.topKeywords[0];
      const second = qualitativeSummary.topKeywords.length > 1 ? qualitativeSummary.topKeywords[1] : null;
      if (second) {
        return `Terdapat ${validResponses} jawaban kualitatif terbuka (${qualitativeSummary.meaningfulResponses} respons substantif). Topik utama yang paling sering diaspirasikan adalah '${first.keyword}' (${first.percentage}%, n=${first.count}) dan '${second.keyword}' (${second.percentage}%, n=${second.count}).`;
      }
      return `Terdapat ${validResponses} jawaban kualitatif terbuka. Topik utama yang paling sering diaspirasikan adalah '${first.keyword}' (${first.percentage}%, n=${first.count}).`;
    }
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
    if (topTokens.length === 0) {
      return `Tidak ada opsi yang dipilih pada pertanyaan ini (N = ${validResponses}).`;
    }

    const first = topTokens[0];
    const second = topTokens.length > 1 ? topTokens[1] : null;

    if (second) {
      return `Pilihan paling dominan adalah '${first.token}' dipilih oleh ${first.percentage}% responden (n=${first.count}), diikuti oleh '${second.token}' (${second.percentage}%, n=${second.count}). Rata-rata responden memilih ${multiSelectStats.averageSelectionsPerRespondent} opsi (total ${multiSelectStats.totalSelections} pilihan).`;
    }

    return `Pilihan utama adalah '${first.token}' dipilih oleh ${first.percentage}% responden (n=${first.count}). Total ${multiSelectStats.totalSelections} pilihan dari ${validResponses} responden.`;
  }

  // Nominal / Binary
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return `Tidak ada data valid untuk pertanyaan ini.`;
  }

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

export { determineRecommendedChart } from '../recommender/chartHeuristics';
