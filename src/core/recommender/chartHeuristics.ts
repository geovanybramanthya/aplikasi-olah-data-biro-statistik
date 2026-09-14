/**
 * Public-Friendly AI Chart Recommendation Engine & Curation Studio
 * Biro Statistika BEM Universitas Diponegoro
 * 
 * Heuristics:
 * 1. METADATA_PII -> 'none' (excluded by default)
 * 2. DICHOTOMOUS_BINARY -> 'donut' (2 categories: clean donut with % badges and center total)
 * 3. LIKERT_SCALE -> 'ordered_likert' (preserves natural ordinal scale 1-4 / 1-5 with Top-Box metrics)
 * 4. MULTI_SELECT_CHECKBOX -> 'ranked_bar' (ranked horizontal bar sorted descending, % of N respondents)
 * 5. OPEN_ENDED_TEXT -> 'text_feed' (qualitative narrative feed / card stream)
 * 6. NOMINAL_DEMOGRAPHIC:
 *    - 2-3 categories & short labels (<=15 chars) -> 'donut'
 *    - <=6 categories & short labels (<=12 chars) -> 'vertical_bar'
 *    - Multi-category (4-15) or long labels (>15 chars) -> 'horizontal_bar'
 */

import { QuestionType, ChartType, ColumnProfile } from '../../types/survey';
import { sanitizeHeader } from '../parser/piiFilter';
import { isChartTypeProhibited, getProhibitionReason } from './prohibitedRules';

/**
 * Determines the optimal public-friendly chart type for a survey question based on
 * its classified type, distinct category count, and maximum label length.
 */
export function determineRecommendedChart(
  type: QuestionType,
  uniqueCount: number,
  maxLabelLength: number
): ChartType {
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
      // 2-3 categories with short labels are optimal as Donut
      if (uniqueCount <= 3 && maxLabelLength <= 15) {
        return 'donut';
      }
      // Small number of categories (<=6) with short labels can use Vertical Bar
      if (uniqueCount <= 6 && maxLabelLength <= 12) {
        return 'vertical_bar';
      }
      // Default to Horizontal Bar to prevent text tilt and label clipping
      return 'horizontal_bar';

    default:
      return 'horizontal_bar';
  }
}

export interface RecommendationRationale {
  chartType: ChartType;
  title: string;
  rationale: string;
  presentationAdvice: string;
}

/**
 * Provides in-depth Indonesian rationale and advice for why a chart was recommended.
 */
export function getRecommendationRationale(
  type: QuestionType,
  uniqueCount: number,
  maxLabelLength: number
): RecommendationRationale {
  const chartType = determineRecommendedChart(type, uniqueCount, maxLabelLength);

  switch (chartType) {
    case 'donut':
      return {
        chartType: 'donut',
        title: 'Donut Chart (Persentase)',
        rationale: `Direkomendasikan untuk ${uniqueCount} kategori ringkas (label maks ${maxLabelLength} karakter). Memberikan fokus perbandingan proporsional yang tajam.`,
        presentationAdvice: 'Tampilkan persentase badge kontras tinggi di setiap irisan serta total responden di tengah donat.',
      };

    case 'vertical_bar':
      return {
        chartType: 'vertical_bar',
        title: 'Bar Vertikal (Kolom Tegak)',
        rationale: `Direkomendasikan untuk ${uniqueCount} kategori dengan nama singkat (maks ${maxLabelLength} karakter). Memudahkan perbandingan tinggi batang secara cepat.`,
        presentationAdvice: 'Pastikan label sumbu horizontal tidak miring dan nilai frekuensi tertera di atas tiap kolom.',
      };

    case 'horizontal_bar':
      return {
        chartType: 'horizontal_bar',
        title: 'Bar Horizontal',
        rationale: `Direkomendasikan untuk ${uniqueCount} kategori atau label panjang (maks ${maxLabelLength} karakter) agar nama fakultas/biro terbaca penuh horizontal tanpa terpotong.`,
        presentationAdvice: 'Gunakan dynamic margin kiri agar label panjang tidak terpotong saat dipresentasikan.',
      };

    case 'ranked_bar':
      return {
        chartType: 'ranked_bar',
        title: 'Ranked Horizontal Bar (% Responden)',
        rationale: `Direkomendasikan untuk pertanyaan multi-select checkbox. Opsi diurutkan dari yang paling banyak dipilih menuju yang paling sedikit.`,
        presentationAdvice: 'Gunakan persentase dari total responden (bukan total pilihan) karena satu responden bisa memilih lebih dari satu opsi.',
      };

    case 'ordered_likert':
      return {
        chartType: 'ordered_likert',
        title: 'Ordered Likert Frequency Bar',
        rationale: `Direkomendasikan untuk skala ordinal bertingkat. Urutan skala (1 sampai 4/5) dipertahankan demi menjaga arah semantik jawaban.`,
        presentationAdvice: 'Sertakan metrik Top-Box (persentase skor 4 & 5) untuk menyoroti tingkat kepuasan atau kesetujuan responden.',
      };

    case 'text_feed':
      return {
        chartType: 'text_feed',
        title: 'Umpan Naratif Kualitatif',
        rationale: 'Direkomendasikan untuk pertanyaan esai terbuka atau masukan deskriptif mahasiswa.',
        presentationAdvice: 'Sajikan dalam bentuk kartu kutipan yang dapat difilter atau dicari kata kuncinya.',
      };

    case 'none':
    default:
      return {
        chartType: 'none',
        title: 'Tidak Divisualisasikan',
        rationale: 'Kolom ini terdeteksi sebagai metadata sistem atau identitas pribadi (PII) sehingga dinonaktifkan demi privasi responden.',
        presentationAdvice: 'Biarkan tetap nonaktif saat memublikasikan laporan survei.',
      };
  }
}

/**
 * Returns permissible alternative chart types for manual curation override.
 */
export function getCompatibleChartAlternatives(type: QuestionType): ChartType[] {
  switch (type) {
    case 'METADATA_PII':
      return ['none'];

    case 'DICHOTOMOUS_BINARY':
      return ['donut', 'horizontal_bar', 'vertical_bar', 'none'];

    case 'NOMINAL_DEMOGRAPHIC':
      return ['horizontal_bar', 'vertical_bar', 'donut', 'ranked_bar', 'none'];

    case 'LIKERT_SCALE':
      return ['ordered_likert', 'horizontal_bar', 'vertical_bar', 'none'];

    case 'MULTI_SELECT_CHECKBOX':
      return ['ranked_bar', 'horizontal_bar', 'vertical_bar', 'none'];

    case 'OPEN_ENDED_TEXT':
      return ['text_feed', 'none'];

    default:
      return ['horizontal_bar', 'vertical_bar', 'donut', 'none'];
  }
}

// --------------------------------------------------------------------------
// Curation Mutation Operations (Immutable)
// --------------------------------------------------------------------------

/**
 * Overrides a column's selected chart type, enforcing prohibited chart rejection.
 */
export function overrideChartType(column: ColumnProfile, newChart: ChartType): ColumnProfile {
  if (isChartTypeProhibited(newChart)) {
    const reason = getProhibitionReason(newChart) || 'Grafik tersebut dilarang untuk publikasi standar.';
    throw new Error(`Chart type '${newChart}' is strictly prohibited. ${reason}`);
  }

  return {
    ...column,
    selectedChart: newChart,
    isExcluded: newChart === 'none',
  };
}

/**
 * Updates a column's presentation display title for slide readiness.
 */
export function updateColumnTitle(column: ColumnProfile, newTitle: string): ColumnProfile {
  const sanitized = sanitizeHeader(newTitle);
  return {
    ...column,
    displayTitle: sanitized || column.cleanName,
  };
}

/**
 * Toggles whether a column is excluded from visual chart generation.
 */
export function toggleColumnExclusion(column: ColumnProfile, isExcluded: boolean): ColumnProfile {
  return {
    ...column,
    isExcluded: Boolean(isExcluded),
  };
}

/**
 * Reorders columns in a dataset for presentation slide sequence.
 */
export function reorderColumns<T extends { columnIndex: number }>(
  columns: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (fromIndex < 0 || fromIndex >= columns.length || toIndex < 0 || toIndex >= columns.length) {
    return columns;
  }

  const result = [...columns];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  return result.map((col, idx) => ({
    ...col,
    columnIndex: idx,
  }));
}
