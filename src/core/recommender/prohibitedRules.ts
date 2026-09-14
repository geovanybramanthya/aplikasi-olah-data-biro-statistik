/**
 * Prohibited Chart Rules & Public Standards Engine
 * Biro Statistika BEM Universitas Diponegoro
 * 
 * Explicitly bans confusing, distorted, or misleading visualizations:
 * - Radar / Spider charts (distorts proportional area perception, confusing for student audience)
 * - Distorted 3D pie wedges (perspective tilt severely skews angle & area perception)
 * - Dual-axis spaghetti plots (creates spurious correlations and misleading intersections)
 * - Uncalibrated bubble charts (distorts area comparison without strict scaling)
 * - 3D surface plots (excessively complex for 1D survey distributions)
 */

import { ChartType } from '../../types/survey';

export const PROHIBITED_CHARTS = [
  'radar',
  'spider',
  '3d_pie_wedge',
  '3d_pie',
  'dual_y_axis',
  'bubble',
  '3d_surface',
] as const;

export type ProhibitedChartType = (typeof PROHIBITED_CHARTS)[number];

export interface ChartValidationResult {
  isValid: boolean;
  error?: string;
  reason?: string;
}

/**
 * Checks whether a given chart type string is in the prohibited charts blacklist.
 */
export function isChartTypeProhibited(chartType: string | null | undefined): boolean {
  if (!chartType) return false;
  const normalized = chartType.toLowerCase().trim();
  return (PROHIBITED_CHARTS as readonly string[]).includes(normalized);
}

/**
 * Returns pedagogical reason why a chart type is prohibited for student public reporting.
 */
export function getProhibitionReason(chartType: string): string | null {
  if (!chartType) return null;
  const normalized = chartType.toLowerCase().trim();

  switch (normalized) {
    case 'radar':
    case 'spider':
      return 'Diagram radar / spider dilarang karena mendistorsi persepsi proporsi area poligon dan membingungkan audiens mahasiswa.';
    case '3d_pie_wedge':
    case '3d_pie':
      return 'Diagram lingkaran 3D dengan kemiringan perspektif dilarang karena mendistorsi sudut irisan depan dan belakang secara visual.';
    case 'dual_y_axis':
      return 'Grafik sumbu ganda (dual-Y axis) dilarang karena memicu korelasi semu yang menyesatkan dan sulit diinterpretasikan publik.';
    case 'bubble':
      return 'Diagram bubble tanpa kalibrasi sumbu ketat dilarang karena luas lingkaran sulit dibandingkan secara akurat oleh mata manusia.';
    case '3d_surface':
      return 'Grafik permukaan 3D dilarang karena terlalu kompleks untuk representasi data distribusi survei publik.';
    default:
      if (isChartTypeProhibited(normalized)) {
        return `Tipe grafik '${chartType}' dilarang demi menjaga standar visualisasi publik yang jelas dan akurat.`;
      }
      return null;
  }
}

/**
 * Validates whether a user-selected chart type is permissible for public reporting.
 */
export function validateChartSelection(chartType: string): ChartValidationResult {
  if (isChartTypeProhibited(chartType)) {
    const reason = getProhibitionReason(chartType) || `Tipe grafik '${chartType}' dilarang.`;
    return {
      isValid: false,
      error: `Chart type '${chartType}' is strictly prohibited. ${reason}`,
      reason,
    };
  }

  return {
    isValid: true,
  };
}

export interface PublicChartMeta {
  type: ChartType;
  label: string;
  description: string;
  bestFor: string;
  icon: string;
}

/**
 * Returns all permissible public presentation chart types supported by the platform.
 */
export function getAllowedPublicChartTypes(): PublicChartMeta[] {
  return [
    {
      type: 'donut',
      label: 'Donut Chart (Persentase)',
      description: 'Diagram donat bersih dengan persentase badge dan metrik total di tengah.',
      bestFor: '2–3 kategori biner atau demografi ringkas',
      icon: 'PieChart',
    },
    {
      type: 'horizontal_bar',
      label: 'Bar Horizontal (Kategori Panjang)',
      description: 'Grafik batang horizontal dengan label terbaca penuh tanpa kemiringan teks.',
      bestFor: 'Banyak kategori (4–15) atau nama kategori panjang',
      icon: 'BarChartHorizontal',
    },
    {
      type: 'vertical_bar',
      label: 'Bar Vertikal (Kategori Singkat)',
      description: 'Grafik kolom tegak klasik dengan label nilai kontras tinggi.',
      bestFor: '3–6 kategori dengan nama singkat (≤ 12 karakter)',
      icon: 'BarChart3',
    },
    {
      type: 'ranked_bar',
      label: 'Ranked Bar (% Responden)',
      description: 'Batang horizontal terurut descending berdasarkan persentase responden (N).',
      bestFor: 'Pertanyaan multi-select checkbox (pilihan ganda banyak)',
      icon: 'ListOrdered',
    },
    {
      type: 'ordered_likert',
      label: 'Ordered Likert Scale (Ordinal)',
      description: 'Batang frekuensi terurut sesuai skala ordinal (1–4 atau 1–5) dengan persentase Top-Box.',
      bestFor: 'Pertanyaan skala kepuasan / kesetujuan / frekuensi',
      icon: 'SlidersHorizontal',
    },
    {
      type: 'text_feed',
      label: 'Umpan Teks Kualitatif',
      description: 'Daftar umpan kartu kutipan jawaban terbuka dengan pencarian dan analisis kata kunci.',
      bestFor: 'Pertanyaan esai, kritik, saran, dan kronologi',
      icon: 'MessageSquareText',
    },
    {
      type: 'none',
      label: 'Tidak Ditampilkan (Abaikan)',
      description: 'Kolom dikecualikan dari visualisasi (standar untuk PII/Metadata).',
      bestFor: 'Timestamp, Nama, NIM, atau kolom yang sengaja dinonaktifkan',
      icon: 'EyeOff',
    },
  ];
}
