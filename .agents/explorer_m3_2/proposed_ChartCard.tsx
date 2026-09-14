/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Feature 24: Infographic Presentation Chart Card with Per-Chart Dimensionality Override
 */

import React, { useState, useRef } from 'react';
import * as echarts from 'echarts';
import { ColumnProfile, ChartType } from '../../src/types/survey';
import { ThemeConfig, DimensionalityMode } from '../../src/types/theming';
import { EChartsRenderer } from './proposed_EChartsRenderer';
import { WatermarkFooter } from './proposed_WatermarkFooter';
import {
  Download,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PieChart,
  EyeOff,
} from 'lucide-react';

export interface ChartCardProps {
  column: ColumnProfile;
  theme: ThemeConfig;
  cardOverride?: DimensionalityMode | 'inherit';
  onUpdateTitle?: (colId: string, newTitle: string) => void;
  onUpdateChartType?: (colId: string, chartType: ChartType) => void;
  onUpdateOverride?: (colId: string, override: DimensionalityMode | 'inherit') => void;
  onToggleExclude?: (colId: string) => void;
}

/**
 * Authoritative dimensionality resolution logic (Feature 24)
 */
export function resolveDimensionality(
  globalMode?: DimensionalityMode | null,
  cardOverride?: DimensionalityMode | 'inherit' | string | null
): DimensionalityMode {
  if (cardOverride === '2d' || cardOverride === '3d') {
    return cardOverride;
  }
  return globalMode === '3d' ? '3d' : '2d';
}

/**
 * Sanitize filename for individual 3x PNG export (Feature 28)
 */
export function sanitizeExportFilename(index: number, title: string): string {
  const prefix = String(index).padStart(2, '0');
  const slug = (title || 'chart')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return `chart_${prefix}_${slug}.png`;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  column,
  theme,
  cardOverride = 'inherit',
  onUpdateTitle,
  onUpdateChartType,
  onUpdateOverride,
  onToggleExclude,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.displayTitle || column.cleanName);
  const [showNarrative, setShowNarrative] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Feature 24: Resolve effective dimensionality
  const effectiveMode = resolveDimensionality(theme.globalDimensionality, cardOverride);

  // Handle saving modified title
  const handleSaveTitle = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && onUpdateTitle) {
      onUpdateTitle(column.id, trimmed);
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setEditedTitle(column.displayTitle || column.cleanName);
    setIsEditingTitle(false);
  };

  // Feature 28: Export individual chart at 3x resolution (~300 DPI)
  const handleExportPNG = () => {
    if (!chartInstanceRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = chartInstanceRef.current.getDataURL({
        type: 'png',
        pixelRatio: 3, // ~300 DPI rasterization
        backgroundColor: '#FFFFFF',
      });

      const filename = sanitizeExportFilename(
        column.columnIndex,
        column.displayTitle || column.cleanName
      );

      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('[ChartCard] Failed to export chart image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Cycle per-chart dimensionality override (inherit -> 2d -> 3d -> inherit)
  const handleCycleOverride = () => {
    if (!onUpdateOverride) return;
    let nextOverride: DimensionalityMode | 'inherit' = 'inherit';
    if (cardOverride === 'inherit') {
      nextOverride = theme.globalDimensionality === '2d' ? '3d' : '2d';
    } else if (cardOverride === '2d') {
      nextOverride = '3d';
    } else if (cardOverride === '3d') {
      nextOverride = 'inherit';
    }
    onUpdateOverride(column.id, nextOverride);
  };

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
      style={{
        fontFamily: theme.fontFamily,
      }}
    >
      {/* 1. Header & Title Section */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          {/* Question Index Badge & Metadata */}
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-undip-navy/10 text-undip-navy border border-undip-navy/20">
              Q{column.columnIndex}
            </span>
            <span className="text-xs font-medium text-slate-500 capitalize">
              {column.type.toLowerCase().replace(/_/g, ' ')}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              N = {column.validResponses || 0}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1.5">
            {/* Per-Chart Dimensionality Override Pill (Feature 24) */}
            <button
              onClick={handleCycleOverride}
              title={`Mode visual: ${cardOverride === 'inherit' ? `Global (${effectiveMode.toUpperCase()})` : cardOverride.toUpperCase()}. Klik untuk mengganti.`}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 border ${
                cardOverride === 'inherit'
                  ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  : effectiveMode === '3d'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 shadow-sm'
                  : 'bg-blue-50 text-undip-blue border-blue-200 hover:bg-blue-100 shadow-sm'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>
                {effectiveMode === '3d' ? '2.5D 3D' : '2D Flat'}
                {cardOverride === 'inherit' && (
                  <span className="text-[10px] font-normal text-slate-400 ml-1">(auto)</span>
                )}
              </span>
            </button>

            {/* Single 3x PNG Download Button (Feature 28) */}
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              title="Unduh Grafik PNG Resolusi Tinggi (~300 DPI)"
              className="p-1.5 text-slate-500 hover:text-undip-navy hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Quick Exclude Toggle */}
            {onToggleExclude && (
              <button
                onClick={() => onToggleExclude(column.id)}
                title="Sembunyikan Grafik"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Title (Editable or Presentation) */}
        {isEditingTitle ? (
          <div className="flex items-center space-x-2 my-2">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelTitle();
              }}
              autoFocus
              className="flex-1 px-3 py-1.5 text-sm border border-undip-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-undip-blue/20"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-200"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelTitle}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="group flex items-start justify-between cursor-pointer my-2">
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="font-bold text-slate-900 leading-snug hover:text-undip-blue transition-colors flex-1"
              style={{
                fontSize: `${theme.titleFontSize || 20}px`,
              }}
              title="Klik untuk mengedit judul grafik"
            >
              {column.displayTitle || column.cleanName}
            </h3>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-undip-blue transition-opacity ml-2"
              title="Edit Judul"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Interactive ECharts Canvas Area */}
      <div className="my-2 min-h-[340px] flex items-center justify-center">
        <EChartsRenderer
          column={column}
          theme={theme}
          dimensionality={effectiveMode}
          height={340}
          onChartReady={(chart) => {
            chartInstanceRef.current = chart;
          }}
        />
      </div>

      {/* 3. Statistical Summary & AI Narrative Drawer */}
      <div className="mt-2 space-y-2">
        <button
          onClick={() => setShowNarrative(!showNarrative)}
          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100/80 px-3 py-2 rounded-xl border border-slate-200/60 transition-colors"
        >
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-undip-blue" />
            <span className="font-semibold">Ringkasan Statistik & Narasi</span>
            {column.aiNarrative && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
              </span>
            )}
          </div>
          {showNarrative ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {showNarrative && (
          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2 animate-fadeIn">
            <div>
              <span className="font-bold text-slate-900 block mb-1">
                Deskriptif Offline:
              </span>
              <p className="text-slate-600">
                {column.offlineSummary || 'Tidak ada ringkasan offline tersedia.'}
              </p>
            </div>
            {column.aiNarrative && (
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-purple-900 flex items-center mb-1">
                  <Sparkles className="w-3 h-3 mr-1 text-purple-600" /> Narasi Cerdas:
                </span>
                <p className="text-slate-700 italic">{column.aiNarrative}</p>
              </div>
            )}
          </div>
        )}

        {/* 4. Official Institutional Watermark Footer (Feature 25) */}
        <WatermarkFooter
          showWatermark={theme.showWatermark}
          watermarkText={theme.watermarkText}
          fontFamily={theme.fontFamily}
        />
      </div>
    </div>
  );
};

export default ChartCard;
