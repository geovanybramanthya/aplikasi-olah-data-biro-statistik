/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Features 22 & 23: Apache ECharts Option Generator (2D Modern Flat & 2.5D Isometric 3D)
 */

import { ColumnProfile, ChartType } from '../../types/survey';
import { ThemeConfig, DimensionalityMode } from '../../types/theming';
import { lightenColor, darkenColor } from './colorUtils';
import { getPaletteColor } from './palettes';
import { collapseLongTail } from '../profiler/longTailAggregator';
import { extractKeywordsAndThemes } from '../profiler/keywordExtractor';

/**
 * Standard dynamic padding helper to prevent label clipping
 */
export function calculateDynamicPadding(labels: string[] = [], chartType: ChartType = 'horizontal_bar') {
  if (chartType !== 'horizontal_bar' && chartType !== 'ranked_bar') {
    return { left: 40, right: 40, top: 60, bottom: 50 };
  }
  const maxLabelLen = labels.reduce((max, l) => Math.max(max, String(l).length), 0);
  const leftPadding = Math.min(260, Math.max(80, Math.round(maxLabelLen * 7.5)));
  return { left: leftPadding, right: 50, top: 60, bottom: 50 };
}

/**
 * Multi-line label wrapping helper at maxCharsPerLine characters
 */
export function wrapLabel(text: string, maxCharsPerLine = 22): string[] {
  if (!text) return [];
  const words = String(text).split(' ');
  const lines: string[] = [];
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

/**
 * Determine badge placement inside or outside bar based on value proportion
 */
export function determineBadgePlacement(value: number, maxValue: number): 'inside' | 'outside' {
  if (maxValue <= 0) return 'outside';
  return value / maxValue > 0.25 ? 'inside' : 'outside';
}

/**
 * Semantic Likert 5-step color scale
 */
const LIKERT_SEMANTIC_COLORS: Record<number, string> = {
  1: '#C0392B', // Sangat Tidak Setuju / Sangat Buruk (Red)
  2: '#E67E22', // Tidak Setuju / Buruk (Orange)
  3: '#F39C12', // Cukup / Netral (Amber / Warm Gold)
  4: '#16A085', // Setuju / Baik (Emerald / Teal)
  5: '#1E56A0', // Sangat Setuju / Sangat Baik (UNDIP Deep Blue)
};

/**
 * Build ECharts option object for any supported survey question and theme
 */
export function generateEChartsOption(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode
): Record<string, unknown> {
  const chartType = column.selectedChart || column.recommendedChart || 'vertical_bar';

  switch (chartType) {
    case 'donut':
      return buildDonutOption(column, theme, dimensionality);

    case 'horizontal_bar':
    case 'ranked_bar':
      return buildHorizontalBarOption(column, theme, dimensionality, chartType === 'ranked_bar');

    case 'vertical_bar':
      if (column.type === 'OPEN_ENDED_TEXT') {
        return buildOpenEndedTopicBarOption(column, theme, dimensionality);
      }
      return buildVerticalBarOption(column, theme, dimensionality);

    case 'text_feed':
      return buildOpenEndedTopicBarOption(column, theme, dimensionality);

    case 'ordered_likert':
      return buildOrderedLikertOption(column, theme, dimensionality);

    default:
      if (column.type === 'OPEN_ENDED_TEXT') {
        return buildOpenEndedTopicBarOption(column, theme, dimensionality);
      }
      return buildVerticalBarOption(column, theme, dimensionality);
  }
}

/**
 * 1. Donut Chart Option Generator
 */
function buildDonutOption(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode
): Record<string, unknown> {
  const is3D = dimensionality === '3d';
  const palette = theme.activePalette;
  const total = column.validResponses || 0;

  // Extract distribution entries
  const entries = Object.entries(column.distribution || {});
  const data = entries.map(([name, value], idx) => {
    const baseColor = getPaletteColor(palette, idx);

    return {
      name,
      value,
      itemStyle: {
        color: is3D
          ? {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: lightenColor(baseColor, 15) },
                { offset: 1, color: darkenColor(baseColor, 10) },
              ],
            }
          : baseColor,
        borderRadius: is3D ? 6 : 4,
        borderColor: '#FFFFFF',
        borderWidth: 2,
        shadowBlur: is3D ? 8 : 0,
        shadowOffsetY: is3D ? 4 : 0,
        shadowColor: is3D ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
      },
    };
  });

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#FFFFFF', fontFamily: theme.fontFamily, fontSize: 12 },
      formatter: '{b}: <b>{c}</b> ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: '5%',
      left: 'center',
      textStyle: {
        fontFamily: theme.fontFamily,
        fontSize: theme.labelFontSize || 12,
        color: '#475569',
      },
      itemGap: 16,
    },
    title: {
      text: String(total),
      subtext: 'Responden',
      left: 'center',
      top: '38%',
      textStyle: {
        fontFamily: theme.fontFamily,
        fontSize: Math.round((theme.titleFontSize || 20) * 1.3),
        fontWeight: 'bold',
        color: '#0F172A',
      },
      subtextStyle: {
        fontFamily: theme.fontFamily,
        fontSize: 12,
        color: '#64748B',
      },
    },
    series: [
      {
        type: 'pie',
        radius: is3D ? ['45%', '75%'] : ['45%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        data,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{percent|{d}%}',
          rich: {
            percent: {
              fontWeight: 'bold',
              fontSize: (theme.labelFontSize || 12) + 1,
              color: '#0F172A',
              padding: [2, 0, 0, 0],
            },
          },
          fontFamily: theme.fontFamily,
          fontSize: theme.labelFontSize || 12,
          color: '#334155',
        },
        labelLine: {
          show: true,
          length: 12,
          length2: 14,
          smooth: true,
          lineStyle: { color: '#94A3B8', width: 1.2 },
        },
      },
    ],
  };
}

/**
 * 2. Horizontal Bar & Ranked Bar Generator
 */
function buildHorizontalBarOption(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode,
  isRanked: boolean
): Record<string, unknown> {
  const is3D = dimensionality === '3d';
  const palette = theme.activePalette;
  const total = column.validResponses || 1;

  // Prepare items
  let rawData: Array<{ name: string; value: number; isAggregated?: boolean; subItems?: string[] }> = [];

  if (isRanked && column.multiSelect?.tokenFrequencies) {
    rawData = column.multiSelect.tokenFrequencies.map((tf) => ({
      name: tf.token,
      value: tf.count,
    }));
  } else {
    rawData = Object.entries(column.distribution || {}).map(([name, value]) => ({
      name,
      value,
    }));
  }

  // Apply Smart Pareto Long-Tail Aggregation (default true)
  if (column.collapseMinorOptions !== false) {
    const collapseResult = collapseLongTail(rawData, true, 1);
    const nonAggregated = collapseResult.items.filter((i) => !i.isAggregated);
    const aggregated = collapseResult.items.filter((i) => i.isAggregated);
    nonAggregated.sort((a, b) => b.value - a.value);
    rawData = [...nonAggregated, ...aggregated];
  } else {
    rawData.sort((a, b) => b.value - a.value);
  }

  // ECharts category Y-axis stacks bottom-to-top by default, so reverse array for natural top-to-bottom rendering
  const sortedData = [...rawData].reverse();
  const categories = sortedData.map((d) => d.name);

  const padding = calculateDynamicPadding(categories, 'horizontal_bar');

  const seriesData = sortedData.map((d, idx) => {
    // Top-ranked item gets primary palette color; aggregated tail item gets neutral slate
    const originalRank = sortedData.length - 1 - idx;
    const baseColor = d.isAggregated ? '#94A3B8' : getPaletteColor(palette, originalRank);

    return {
      value: d.value,
      isAggregated: d.isAggregated,
      subItems: d.subItems,
      itemStyle: {
        color: is3D
          ? {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: darkenColor(baseColor, 10) },
                { offset: 1, color: lightenColor(baseColor, 18) },
              ],
            }
          : baseColor,
        borderRadius: [0, 6, 6, 0],
        shadowBlur: is3D ? 6 : 0,
        shadowOffsetY: is3D ? 4 : 0,
        shadowColor: is3D ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
      },
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#FFFFFF', fontFamily: theme.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0];
        const count = item.value;
        const pct = ((count / total) * 100).toFixed(1);
        const isAgg = item.data?.isAggregated;
        const subItems = item.data?.subItems;

        if (isAgg && subItems && subItems.length > 0) {
          const sampleList = subItems.slice(0, 4).join(', ');
          const extra = subItems.length > 4 ? ` (+${subItems.length - 4} lainnya)` : '';
          return `<b>${item.name}</b><br/>Total: <b>${count}</b> respon (${pct}%)<br/><span style="color:#94A3B8; font-size:11px;">Mencakup: ${sampleList}${extra}</span>`;
        }

        return `${item.name}<br/><b>${count}</b> respon (${pct}% ${isRanked ? 'dari N' : ''})`;
      },
    },
    grid: {
      left: padding.left,
      right: Math.max(85, padding.right + 35), // Generous right clearance preventing outside percentage labels from clipping
      top: 25,
      bottom: 30,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      axisLabel: {
        fontFamily: theme.fontFamily,
        fontSize: theme.labelFontSize || 12,
        color: '#64748B',
      },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisTick: { show: false },
      axisLabel: {
        fontFamily: theme.fontFamily,
        fontSize: categories.length > 12 ? 11 : (theme.labelFontSize || 12),
        color: '#334155',
        formatter: (val: string) => {
          const lines = wrapLabel(val, 24);
          return lines.join('\n');
        },
      },
    },
    series: [
      {
        type: 'bar',
        // Dynamic bar width & 35% category gap: ensures graceful vertical breathing room
        barWidth: categories.length > 12 ? 16 : categories.length > 7 ? 20 : 24,
        barCategoryGap: '35%',
        data: seriesData,
        label: {
          show: true,
          position: 'right',
          distance: 8,
          fontFamily: theme.fontFamily,
          fontSize: categories.length > 12 ? 11 : (theme.labelFontSize || 12),
          fontWeight: 600,
          color: '#0F172A',
          formatter: (params: any) => {
            const val = params.value;
            const pct = ((val / total) * 100).toFixed(1);
            return `${val} (${pct}%)`;
          },
        },
      },
    ],
  };
}

/**
 * 3. Vertical Bar Generator
 */
function buildVerticalBarOption(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode
): Record<string, unknown> {
  const is3D = dimensionality === '3d';
  const palette = theme.activePalette;
  const total = column.validResponses || 1;

  const entries = Object.entries(column.distribution || {});
  const categories = entries.map(([name]) => name);

  const seriesData = entries.map(([, val], idx) => {
    const baseColor = getPaletteColor(palette, idx);
    return {
      value: val,
      itemStyle: {
        color: is3D
          ? {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: lightenColor(baseColor, 18) },
                { offset: 1, color: darkenColor(baseColor, 10) },
              ],
            }
          : baseColor,
        borderRadius: [6, 6, 0, 0],
        shadowBlur: is3D ? 6 : 0,
        shadowOffsetY: is3D ? 4 : 0,
        shadowColor: is3D ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
      },
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#FFFFFF', fontFamily: theme.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0];
        const count = item.value;
        const pct = ((count / total) * 100).toFixed(1);
        return `${item.name}<br/><b>${count}</b> respon (${pct}%)`;
      },
    },
    grid: {
      left: 30,
      right: 30,
      top: 35,
      bottom: 45,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisLabel: {
        fontFamily: theme.fontFamily,
        fontSize: theme.labelFontSize || 12,
        color: '#334155',
        interval: 0,
        rotate: categories.some((c) => c.length > 10) ? 25 : 0,
        formatter: (val: string) => {
          const lines = wrapLabel(val, 16);
          return lines.join('\n');
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      axisLabel: {
        fontFamily: theme.fontFamily,
        fontSize: theme.labelFontSize || 12,
        color: '#64748B',
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: Math.min(48, Math.max(20, Math.round(280 / categories.length))),
        data: seriesData,
        label: {
          show: true,
          position: 'top',
          fontFamily: theme.fontFamily,
          fontSize: theme.labelFontSize || 12,
          fontWeight: 600,
          color: '#0F172A',
          formatter: (params: any) => {
            const val = params.value;
            const pct = ((val / total) * 100).toFixed(1);
            return `${val}\n(${pct}%)`;
          },
        },
      },
    ],
  };
}

/**
 * 4. Ordered Likert Scale Bar Generator
 */
function buildOrderedLikertOption(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode
): Record<string, unknown> {
  const is3D = dimensionality === '3d';
  const total = column.validResponses || 1;
  const min = column.likertScale?.min || 1;
  const max = column.likertScale?.max || 5;

  // Build complete ordered scale from min to max, preserving 0-count options
  const categories: string[] = [];
  const seriesData: Array<{ value: number; itemStyle: Record<string, unknown> }> = [];

  for (let score = min; score <= max; score++) {
    const labelFromProfile = column.likertScale?.labels?.[score];
    const scoreStr = String(score);
    // Find count by matching score or score prefix
    let count = column.distribution[scoreStr] || 0;
    if (!count) {
      // Check if distribution key starts with score e.g. "4 - Setuju"
      for (const [key, val] of Object.entries(column.distribution || {})) {
        if (key.trim().startsWith(scoreStr)) {
          count = val;
          break;
        }
      }
    }

    const categoryLabel = labelFromProfile ? `${score}. ${labelFromProfile}` : `Skala ${score}`;
    categories.push(categoryLabel);

    // Color: semantic Likert gradient or active palette
    const baseColor = LIKERT_SEMANTIC_COLORS[score] || getPaletteColor(theme.activePalette, score - 1);

    seriesData.push({
      value: count,
      itemStyle: {
        color: is3D
          ? {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: lightenColor(baseColor, 18) },
                { offset: 1, color: darkenColor(baseColor, 10) },
              ],
            }
          : baseColor,
        borderRadius: [6, 6, 0, 0],
        shadowBlur: is3D ? 6 : 0,
        shadowOffsetY: is3D ? 4 : 0,
        shadowColor: is3D ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
      },
    });
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#FFFFFF', fontFamily: theme.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0];
        const count = item.value;
        const pct = ((count / total) * 100).toFixed(1);
        return `${item.name}<br/><b>${count}</b> responden (${pct}%)`;
      },
    },
    grid: {
      left: 30,
      right: 30,
      top: 40,
      bottom: 45,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisLabel: {
        fontFamily: theme.fontFamily,
        fontSize: theme.labelFontSize || 12,
        color: '#334155',
        interval: 0,
        formatter: (val: string) => {
          const lines = wrapLabel(val, 15);
          return lines.join('\n');
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      axisLabel: {
        fontFamily: theme.fontFamily,
        fontSize: theme.labelFontSize || 12,
        color: '#64748B',
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: Math.min(48, Math.max(24, Math.round(280 / categories.length))),
        data: seriesData,
        label: {
          show: true,
          position: 'top',
          fontFamily: theme.fontFamily,
          fontSize: theme.labelFontSize || 12,
          fontWeight: 600,
          color: '#0F172A',
          formatter: (params: any) => {
            const val = params.value;
            const pct = ((val / total) * 100).toFixed(1);
            return `${val}\n(${pct}%)`;
          },
        },
      },
    ],
  };
}

/**
 * 5. Open-Ended Text Top Keywords & Topic Bar Generator
 * Transforms qualitative essay responses into an executive horizontal ranked bar chart
 */
export function buildOpenEndedTopicBarOption(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode
): Record<string, unknown> {
  const is3D = dimensionality === '3d';
  const palette = theme.activePalette;
  const total = column.validResponses || 1;

  // 1. Get extracted keywords
  let keywordItems: Array<{ name: string; value: number; percentage: number }> = [];

  if (column.qualitativeSummary?.topKeywords && column.qualitativeSummary.topKeywords.length > 0) {
    keywordItems = column.qualitativeSummary.topKeywords.map((k) => ({
      name: k.keyword,
      value: k.count,
      percentage: k.percentage,
    }));
  } else {
    // If qualitative summary is not precomputed, extract on the fly from distribution keys
    const rawTexts = Object.keys(column.distribution || {});
    const extracted = extractKeywordsAndThemes(rawTexts);
    keywordItems = extracted.topKeywords.map((k) => ({
      name: k.keyword,
      value: k.count,
      percentage: k.percentage,
    }));
  }

  // If still no keywords (e.g. all empty), provide a fallback
  if (keywordItems.length === 0) {
    keywordItems = [{ name: 'Belum ada data teks substantif', value: 0, percentage: 0 }];
  }

  // Take top 8 topics for presentation clarity
  const topItems = keywordItems.slice(0, 8);
  topItems.sort((a, b) => b.value - a.value);

  const sortedData = [...topItems].reverse();
  const categories = sortedData.map((d) => d.name);

  const padding = calculateDynamicPadding(categories, 'horizontal_bar');

  const seriesData = sortedData.map((d, idx) => {
    const originalRank = sortedData.length - 1 - idx;
    const baseColor = getPaletteColor(palette, originalRank);

    return {
      value: d.value,
      percentage: d.percentage,
      itemStyle: {
        color: is3D
          ? {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: darkenColor(baseColor, 10) },
                { offset: 1, color: lightenColor(baseColor, 18) },
              ],
            }
          : baseColor,
        borderRadius: [0, 6, 6, 0],
        shadowBlur: is3D ? 6 : 0,
        shadowOffsetY: is3D ? 4 : 0,
        shadowColor: is3D ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
      },
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderWidth: 0,
      textStyle: { color: '#FFFFFF', fontFamily: theme.fontFamily, fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0];
        const count = item.value;
        const pct = item.data?.percentage ?? ((count / total) * 100).toFixed(1);
        return `Topik Aspirasi: <b>${item.name}</b><br/>Disebutkan oleh <b>${count}</b> responden (<b>${pct}%</b> dari N=${total})`;
      },
    },
    grid: {
      left: padding.left,
      right: Math.max(85, padding.right + 35),
      top: 30,
      bottom: 35,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Frekuensi Respon',
      nameLocation: 'end',
      nameTextStyle: {
        fontFamily: theme.fontFamily,
        fontSize: 10,
        color: '#94A3B8',
        padding: [0, 0, 0, 8],
      },
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      axisLabel: {
        fontFamily: theme.fontFamily,
        fontSize: theme.labelFontSize || 12,
        color: '#64748B',
      },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisTick: { show: false },
      axisLabel: {
        fontFamily: theme.fontFamily,
        fontSize: theme.labelFontSize || 12,
        color: '#334155',
        formatter: (val: string) => {
          const lines = wrapLabel(val, 24);
          return lines.join('\n');
        },
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: categories.length > 7 ? 20 : 26,
        barCategoryGap: '35%',
        data: seriesData,
        label: {
          show: true,
          position: 'right',
          distance: 8,
          fontFamily: theme.fontFamily,
          fontSize: theme.labelFontSize || 12,
          fontWeight: 600,
          color: '#0F172A',
          formatter: (params: any) => {
            const val = params.value;
            const pct = params.data?.percentage ?? ((val / total) * 100).toFixed(1);
            return `${val} (${pct}%)`;
          },
        },
      },
    ],
  };
}
