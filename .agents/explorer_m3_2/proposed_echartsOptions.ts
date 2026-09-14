/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Features 22 & 23: Apache ECharts Option Generator (2D Modern Flat & 2.5D Isometric 3D)
 */

import { ColumnProfile, ChartType } from '../../src/types/survey';
import { ThemeConfig, DimensionalityMode, ColorPalette } from '../../src/types/theming';
import { lightenColor, darkenColor, hexToRgba } from './proposed_colorUtils';

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
 * Safe modulo color resolver for palette cycling
 */
export function getPaletteColor(palette: ColorPalette, index: number): string {
  if (!palette || !palette.colors || palette.colors.length === 0) {
    return '#002D62';
  }
  const safeIndex = Math.abs(index) % palette.colors.length;
  return palette.colors[safeIndex];
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
  const palette = theme.activePalette;
  const is3D = dimensionality === '3d';
  const fontFamily = theme.fontFamily;
  const labelFontSize = theme.labelFontSize || 12;

  switch (chartType) {
    case 'donut':
      return buildDonutOption(column, theme, dimensionality);

    case 'horizontal_bar':
    case 'ranked_bar':
      return buildHorizontalBarOption(column, theme, dimensionality, chartType === 'ranked_bar');

    case 'vertical_bar':
      return buildVerticalBarOption(column, theme, dimensionality);

    case 'ordered_likert':
      return buildOrderedLikertOption(column, theme, dimensionality);

    default:
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
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

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
  let rawData: Array<{ name: string; value: number }> = [];

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

  // Descending sort so top item appears at top of inverted/bottom-up chart
  rawData.sort((a, b) => b.value - a.value);

  // ECharts category Y-axis stacks bottom-to-top by default, so reverse array for natural top-to-bottom rendering
  const sortedData = [...rawData].reverse();
  const categories = sortedData.map((d) => d.name);
  const values = sortedData.map((d) => d.value);
  const maxValue = Math.max(...values, 1);

  const padding = calculateDynamicPadding(categories, 'horizontal_bar');

  const seriesData = sortedData.map((d, idx) => {
    // Top-ranked item gets primary palette color
    const originalRank = sortedData.length - 1 - idx;
    const baseColor = getPaletteColor(palette, originalRank);

    return {
      value: d.value,
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
        return `${item.name}<br/><b>${count}</b> respon (${pct}% ${isRanked ? 'dari N' : ''})`;
      },
    },
    grid: {
      left: padding.left,
      right: padding.right,
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
        barWidth: 24,
        data: seriesData,
        label: {
          show: true,
          position: 'right',
          fontFamily: theme.fontFamily,
          fontSize: theme.labelFontSize || 12,
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
  const values = entries.map(([, val]) => val);
  const maxValue = Math.max(...values, 1);

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
      for (const [key, val] of Object.entries(column.distribution)) {
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
