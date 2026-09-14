/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Feature 24: Infographic Presentation Chart Card with Per-Chart Dimensionality Override
 */

import React, { useState, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { ColumnProfile, ChartType } from '../../types/survey';
import { ThemeConfig, DimensionalityMode } from '../../types/theming';
import { EChartsRenderer } from './EChartsRenderer';
import { WatermarkFooter } from './WatermarkFooter';
import { resolveDimensionality } from '../../core/theming/palettes';
import { canCollapseLongTail } from '../../core/profiler/longTailAggregator';
import {
  compositePresentationCard,
  calculateExportDimensions,
} from '../../core/export/canvasExporter';
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
  EyeOff,
  Filter,
  MessageSquareQuote,
  Search,
} from 'lucide-react';

export interface ChartCardProps {
  column: ColumnProfile;
  theme: ThemeConfig;
  cardOverride?: DimensionalityMode | 'inherit';
  onUpdateTitle?: (colId: string, newTitle: string) => void;
  onUpdateChartType?: (colId: string, chartType: ChartType) => void;
  onUpdateOverride?: (colId: string, override: DimensionalityMode | 'inherit') => void;
  onToggleExclude?: (colId: string) => void;
  onToggleCollapseMinor?: (colId: string, collapse: boolean) => void;
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
  onUpdateOverride,
  onToggleExclude,
  onToggleCollapseMinor,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.displayTitle || column.cleanName);
  const [showNarrative, setShowNarrative] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Check if items can be collapsed
  const rawEntries = useMemo(() => {
    if (column.multiSelect?.tokenFrequencies) {
      return column.multiSelect.tokenFrequencies.map((tf) => ({
        name: tf.token,
        value: tf.count,
      }));
    }
    return Object.entries(column.distribution || {}).map(([name, value]) => ({
      name,
      value,
    }));
  }, [column.distribution, column.multiSelect]);

  const isCollapsible = useMemo(() => canCollapseLongTail(rawEntries, 1), [rawEntries]);
  const [collapseMinor, setCollapseMinor] = useState(column.collapseMinorOptions !== false);

  const handleToggleCollapse = () => {
    const nextVal = !collapseMinor;
    setCollapseMinor(nextVal);
    if (onToggleCollapseMinor) {
      onToggleCollapseMinor(column.id, nextVal);
    }
  };

  const effectiveColumn: ColumnProfile = useMemo(
    () => ({
      ...column,
      collapseMinorOptions: collapseMinor,
    }),
    [column, collapseMinor]
  );

  // Open-ended text quotes feed state
  const [showQuotesFeed, setShowQuotesFeed] = useState(false);
  const [quoteSearch, setQuoteSearch] = useState('');
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState<string | null>(null);

  const quotesList = useMemo(() => {
    if (column.qualitativeSummary?.quotes && column.qualitativeSummary.quotes.length > 0) {
      return column.qualitativeSummary.quotes;
    }
    return Object.keys(column.distribution || {});
  }, [column.qualitativeSummary, column.distribution]);

  const filteredQuotes = useMemo(() => {
    return quotesList.filter((quote) => {
      if (selectedKeywordFilter) {
        if (!quote.toLowerCase().includes(selectedKeywordFilter.toLowerCase())) {
          return false;
        }
      }
      if (quoteSearch.trim()) {
        if (!quote.toLowerCase().includes(quoteSearch.trim().toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [quotesList, selectedKeywordFilter, quoteSearch]);

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

  // Dynamic responsive canvas height: provides optimal breathing room for horizontal & ranked bars
  const dynamicChartHeight = useMemo(() => {
    const chartType = effectiveColumn.selectedChart || effectiveColumn.recommendedChart || 'vertical_bar';
    if (
      chartType === 'horizontal_bar' ||
      chartType === 'ranked_bar' ||
      effectiveColumn.type === 'NOMINAL_DEMOGRAPHIC' ||
      effectiveColumn.type === 'MULTI_SELECT_CHECKBOX'
    ) {
      // Determine displayed category count (considering collapsed or expanded long-tail)
      const displayedCount = rawEntries.length;
      // Formula: each bar gets 34px vertical band (16px bar + 18px white-space gap) + 90px axes margin
      return Math.max(360, Math.min(850, displayedCount * 34 + 90));
    }
    if (chartType === 'ordered_likert') {
      return 380;
    }
    return 360;
  }, [effectiveColumn, rawEntries.length]);

  // Feature 28: Export individual chart as full presentation card at 3x resolution (~300 DPI) with Title & Watermark
  const handleExportPNG = async () => {
    if (!chartInstanceRef.current) return;
    setIsExporting(true);

    try {
      // 1. Capture high-DPI rasterization of the rendered chart canvas
      const chartDataUrl = chartInstanceRef.current.getDataURL({
        type: 'png',
        pixelRatio: 3, // ~300 DPI rasterization
        backgroundColor: '#FFFFFF',
      });

      // 2. Ensure current custom-edited title is preserved in export
      const currentTitle = column.displayTitle || editedTitle || column.cleanName;
      const exportColumn: ColumnProfile = {
        ...effectiveColumn,
        displayTitle: currentTitle,
      };

      // 3. Determine presentation card canvas dimensions
      const chartType = exportColumn.selectedChart || exportColumn.recommendedChart || 'vertical_bar';
      const isHorizontal =
        chartType === 'horizontal_bar' ||
        chartType === 'ranked_bar' ||
        exportColumn.type === 'NOMINAL_DEMOGRAPHIC' ||
        exportColumn.type === 'MULTI_SELECT_CHECKBOX';
      const displayedCount = rawEntries.length;
      const baseHeight =
        isHorizontal && displayedCount > 8
          ? Math.min(850, Math.max(550, displayedCount * 32 + 160))
          : 520;

      const dimensions = calculateExportDimensions(800, baseHeight, 3);

      // 4. Composite presentation card with Question Pill, Title, rasterized chart, and official watermark
      const cardCanvas = await compositePresentationCard(
        chartDataUrl,
        exportColumn,
        theme,
        dimensions
      );

      const finalDataUrl = cardCanvas.toDataURL('image/png');

      const filename = sanitizeExportFilename(
        column.columnIndex,
        currentTitle
      );

      const downloadLink = document.createElement('a');
      downloadLink.href = finalDataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('[ChartCard] Failed to export presentation card:', err);
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
            {/* Smart Long-Tail Aggregation Pill Toggle */}
            {isCollapsible && (
              <button
                onClick={handleToggleCollapse}
                title={
                  collapseMinor
                    ? 'Opsi minor (1 respon) dirangkum jadi "Lainnya". Klik untuk melihat semua rincian mentah.'
                    : 'Semua opsi mentah ditampilkan. Klik untuk merangkum opsi minor jadi "Lainnya".'
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 border ${
                  collapseMinor
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-3 h-3 text-amber-600" />
                <span>{collapseMinor ? 'Rangkum "Lainnya": ON' : 'Rangkum: OFF'}</span>
              </button>
            )}

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
      <div
        className="my-2 w-full flex items-center justify-center transition-all duration-300"
        style={{ minHeight: `${dynamicChartHeight}px` }}
      >
        <EChartsRenderer
          column={effectiveColumn}
          theme={theme}
          dimensionality={effectiveMode}
          height={dynamicChartHeight}
          onChartReady={(chart) => {
            chartInstanceRef.current = chart;
          }}
        />
      </div>

      {/* 2b. Feed Aspirasi Mahasiswa (for OPEN_ENDED_TEXT questions) */}
      {column.type === 'OPEN_ENDED_TEXT' && quotesList.length > 0 && (
        <div className="my-2 border border-slate-200/90 rounded-2xl bg-slate-50/70 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowQuotesFeed(!showQuotesFeed)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <MessageSquareQuote className="w-4 h-4 text-undip-blue" />
              <span className="text-xs font-bold text-slate-800 font-jakarta">
                Feed Aspirasi & Jawaban Mahasiswa
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-undip-blue">
                {quotesList.length} Respon
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
              <span>{showQuotesFeed ? 'Sembunyikan' : 'Buka Aspirasi'}</span>
              {showQuotesFeed ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </button>

          {showQuotesFeed && (
            <div className="p-4 border-t border-slate-200/80 space-y-3 bg-white animate-fadeIn">
              {/* Search & Topic Filter Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quoteSearch}
                    onChange={(e) => setQuoteSearch(e.target.value)}
                    placeholder="Cari kata kunci dalam opini responden..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-navy/20 focus:border-undip-navy transition-all"
                  />
                  {quoteSearch && (
                    <button
                      onClick={() => setQuoteSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Topic Keyword Filter Chips */}
                {column.qualitativeSummary?.topKeywords && column.qualitativeSummary.topKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      onClick={() => setSelectedKeywordFilter(null)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        selectedKeywordFilter === null
                          ? 'bg-undip-navy text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Topik ({quotesList.length})
                    </button>
                    {column.qualitativeSummary.topKeywords.slice(0, 6).map((kw) => (
                      <button
                        key={kw.keyword}
                        onClick={() =>
                          setSelectedKeywordFilter(
                            selectedKeywordFilter === kw.keyword ? null : kw.keyword
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          selectedKeywordFilter === kw.keyword
                            ? 'bg-undip-blue text-white shadow-xs'
                            : 'bg-blue-50 text-undip-blue border border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {kw.keyword} ({kw.count})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scrollable Quotes Stream */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote, qIdx) => (
                    <div
                      key={qIdx}
                      className="pt-2 first:pt-0 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-700 leading-relaxed hover:bg-slate-50 transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-undip-navy/80 bg-undip-navy/5 px-2 py-0.5 rounded">
                          Responden #{qIdx + 1}
                        </span>
                      </div>
                      <p className="italic text-slate-800 font-sans">
                        "{quote}"
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Tidak ada respon yang cocok dengan filter atau kata kunci pencarian.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
