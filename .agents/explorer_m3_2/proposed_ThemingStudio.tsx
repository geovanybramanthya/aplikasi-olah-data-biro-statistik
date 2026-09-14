/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Features 19-25: Studio Tab Interface (Tab 3 in App.tsx)
 */

import React, { useState } from 'react';
import { SurveyDataset, ColumnProfile, ChartType } from '../../src/types/survey';
import {
  ThemeConfig,
  FontFamily,
  PaletteId,
  ColorPalette,
  DimensionalityMode,
} from '../../src/types/theming';
import { ChartCard } from './proposed_ChartCard';
import { CustomPaletteModal } from './proposed_CustomPaletteModal';
import {
  Palette,
  Type,
  Layers,
  Sparkles,
  Download,
  Settings2,
  Check,
  RotateCcw,
  Sliders,
  Shield,
  LayoutGrid,
} from 'lucide-react';

export interface ThemingStudioProps {
  dataset: SurveyDataset;
  theme: ThemeConfig;
  onUpdateTheme: (updates: Partial<ThemeConfig>) => void;
  onUpdateColumn: (colId: string, updates: Partial<ColumnProfile>) => void;
  onBatchUpdateColumns?: (columns: ColumnProfile[]) => void;
  onProceedToExport?: () => void;
}

const FONT_OPTIONS: Array<{ id: FontFamily; label: string; desc: string }> = [
  { id: 'Poppins', label: 'Poppins', desc: 'Modern & Geometrik' },
  { id: 'Montserrat', label: 'Montserrat', desc: 'Tegas & Berwibawa' },
  { id: 'Inter', label: 'Inter', desc: 'Presisi Angka Tinggi' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', desc: 'Resmi BEM UNDIP 2026' },
  { id: 'Roboto', label: 'Roboto', desc: 'Netral & Seimbang' },
  { id: 'Merriweather', label: 'Merriweather', desc: 'Serif Akademik Elegan' },
];

const INSTITUTIONAL_PALETTES: Record<Exclude<PaletteId, 'custom'>, ColorPalette> = {
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

export const ThemingStudio: React.FC<ThemingStudioProps> = ({
  dataset,
  theme,
  onUpdateTheme,
  onUpdateColumn,
  onBatchUpdateColumns,
  onProceedToExport,
}) => {
  const [isCustomPaletteOpen, setIsCustomPaletteOpen] = useState(false);
  const [cardOverrides, setCardOverrides] = useState<
    Record<string, DimensionalityMode | 'inherit'>
  >({});
  const [isEditingWatermark, setIsEditingWatermark] = useState(false);
  const [watermarkInput, setWatermarkInput] = useState(
    theme.watermarkText || 'Biro Statistika BEM Universitas Diponegoro'
  );

  // Filter active presentation columns
  const activeColumns = dataset.columns.filter(
    (col) => !col.isExcluded && col.selectedChart !== 'none'
  );

  // Handle font selection
  const handleSelectFont = (fontFamily: FontFamily) => {
    onUpdateTheme({ fontFamily });
  };

  // Handle typography scale presets
  const handleSelectScale = (preset: 'small' | 'medium' | 'large') => {
    switch (preset) {
      case 'small':
        onUpdateTheme({ titleFontSize: 18, labelFontSize: 11 });
        break;
      case 'large':
        onUpdateTheme({ titleFontSize: 24, labelFontSize: 14 });
        break;
      case 'medium':
      default:
        onUpdateTheme({ titleFontSize: 20, labelFontSize: 12 });
        break;
    }
  };

  // Handle palette selection
  const handleSelectPalette = (paletteId: PaletteId) => {
    if (paletteId === 'custom') {
      setIsCustomPaletteOpen(true);
      return;
    }
    const selected = INSTITUTIONAL_PALETTES[paletteId];
    if (selected) {
      onUpdateTheme({
        activePaletteId: paletteId,
        activePalette: selected,
      });
    }
  };

  // Handle custom palette apply
  const handleApplyCustomPalette = (palette: ColorPalette) => {
    onUpdateTheme({
      activePaletteId: 'custom',
      activePalette: palette,
      customPalette: palette,
    });
  };

  // Handle global 2D/3D toggle
  const handleToggleDimensionality = (mode: DimensionalityMode) => {
    onUpdateTheme({ globalDimensionality: mode });
  };

  // Handle watermark toggle
  const handleToggleWatermark = () => {
    onUpdateTheme({ showWatermark: !theme.showWatermark });
  };

  // Handle saving custom watermark text
  const handleSaveWatermarkText = () => {
    const trimmed = watermarkInput.trim() || 'Biro Statistika BEM Universitas Diponegoro';
    onUpdateTheme({ watermarkText: trimmed });
    setIsEditingWatermark(false);
  };

  // Handle per-chart dimensionality override
  const handleUpdateOverride = (
    columnId: string,
    override: DimensionalityMode | 'inherit'
  ) => {
    setCardOverrides((prev) => ({
      ...prev,
      [columnId]: override,
    }));
  };

  // Handle chart title edit from card
  const handleUpdateTitle = (columnId: string, newTitle: string) => {
    onUpdateColumn(columnId, { displayTitle: newTitle });
  };

  // Handle chart type override from card
  const handleUpdateChartType = (columnId: string, chartType: ChartType) => {
    onUpdateColumn(columnId, { selectedChart: chartType });
  };

  // Handle chart hide/exclude toggle from card
  const handleToggleExclude = (columnId: string) => {
    onUpdateColumn(columnId, { isExcluded: true, selectedChart: 'none' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Global Theming Studio Control Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-undip-navy to-undip-blue flex items-center justify-center text-white shadow-md border-2 border-undip-gold/40">
              <Palette className="w-6 h-6 text-undip-cream" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-jakarta flex items-center space-x-2">
                <span>Theming & Visual Craftsmanship Studio</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-undip-navy/10 text-undip-navy border border-undip-navy/20">
                  Milestone 3
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kustomisasi tipografi presentasi, palet institusional, dan gaya visual 2D Flat / 2.5D Isometric
              </p>
            </div>
          </div>

          {/* Export Action CTA */}
          {onProceedToExport && (
            <button
              onClick={onProceedToExport}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue transition-all shadow-md flex items-center space-x-2 self-start lg:self-auto"
            >
              <Download className="w-4 h-4 text-undip-gold" />
              <span>Ekspor Semua Grafik (Batch ZIP)</span>
            </button>
          )}
        </div>

        {/* Theming Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* A. Typography Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Type className="w-3.5 h-3.5 text-undip-blue" />
              <span>Font Presentasi</span>
            </label>
            <select
              value={theme.fontFamily}
              onChange={(e) => handleSelectFont(e.target.value as FontFamily)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-blue/20"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label} ({font.desc})
                </option>
              ))}
            </select>

            {/* Font Size Presets */}
            <div className="flex items-center space-x-1 pt-1">
              <span className="text-[10px] text-slate-400 mr-1">Ukuran:</span>
              {(['small', 'medium', 'large'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleSelectScale(sz)}
                  className={`px-2 py-0.5 text-[10px] rounded font-bold capitalize transition-colors ${
                    (sz === 'small' && theme.titleFontSize === 18) ||
                    (sz === 'medium' && theme.titleFontSize === 20) ||
                    (sz === 'large' && theme.titleFontSize === 24)
                      ? 'bg-undip-navy text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* B. Color Palette Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-undip-blue" />
              <span>Palet Warna</span>
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={theme.activePaletteId}
                onChange={(e) => handleSelectPalette(e.target.value as PaletteId)}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-blue/20"
              >
                <option value="undip_navy_gold">UNDIP Navy & Gold (Resmi)</option>
                <option value="modern_emerald">Modern Emerald (Lingkungan)</option>
                <option value="executive_pastel">Executive Pastel (Tata Kelola)</option>
                <option value="warm_sunset">Warm Sunset (Dinamis)</option>
                <option value="custom">★ Palet Kustom</option>
              </select>
              <button
                onClick={() => setIsCustomPaletteOpen(true)}
                title="Buka Editor Palet Kustom"
                className="px-2.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center space-x-1"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            </div>

            {/* Active Colors Swatch Strip */}
            <div className="h-4 rounded-lg overflow-hidden flex shadow-inner border border-slate-200 mt-1.5">
              {theme.activePalette.colors.map((c, i) => (
                <div
                  key={i}
                  style={{ backgroundColor: c }}
                  className="flex-1 h-full"
                  title={`Warna #${i + 1}: ${c}`}
                />
              ))}
            </div>
          </div>

          {/* C. Dimensionality Mode (2D / 3D) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-undip-blue" />
              <span>Dimensi Visual Global</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleToggleDimensionality('2d')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  theme.globalDimensionality === '2d'
                    ? 'bg-white text-undip-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2D Flat
              </button>
              <button
                onClick={() => handleToggleDimensionality('3d')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  theme.globalDimensionality === '3d'
                    ? 'bg-undip-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2.5D 3D
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Dapat di-override per kartu secara mandiri.
            </p>
          </div>

          {/* D. Watermark Branding */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-undip-blue" />
                <span>Watermark BEM</span>
              </label>
              <button
                onClick={handleToggleWatermark}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  theme.showWatermark ? 'bg-undip-navy' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                    theme.showWatermark ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Editable Watermark Text */}
            {theme.showWatermark && (
              <div>
                {isEditingWatermark ? (
                  <div className="flex items-center space-x-1 mt-1">
                    <input
                      type="text"
                      value={watermarkInput}
                      onChange={(e) => setWatermarkInput(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none"
                    />
                    <button
                      onClick={handleSaveWatermarkText}
                      className="p-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingWatermark(true)}
                    className="text-xs text-slate-600 truncate cursor-pointer hover:text-undip-blue bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200"
                    title="Klik untuk mengubah teks watermark"
                  >
                    {theme.watermarkText || 'Biro Statistika BEM Universitas Diponegoro'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Studio Active Charts Overview Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <LayoutGrid className="w-4 h-4 text-undip-blue" />
          <h3 className="text-sm font-bold text-slate-800 font-jakarta">
            Daftar Grafik Aktif ({activeColumns.length} Pertanyaan Siap Presentasi)
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Resolusi Ekspor Default: 3x Native Canvas (~300 DPI)
        </span>
      </div>

      {/* 3. Responsive Grid of Active Chart Cards */}
      {activeColumns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {activeColumns.map((col) => (
            <ChartCard
              key={col.id}
              column={col}
              theme={theme}
              cardOverride={cardOverrides[col.id] || 'inherit'}
              onUpdateTitle={handleUpdateTitle}
              onUpdateChartType={handleUpdateChartType}
              onUpdateOverride={handleUpdateOverride}
              onToggleExclude={handleToggleExclude}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 font-jakarta">
            Tidak Ada Grafik Aktif
          </h4>
          <p className="text-xs text-slate-500">
            Semua kolom survei telah disembunyikan. Buka kembali tab Kurasi untuk mengaktifkan grafik yang ingin ditampilkan.
          </p>
        </div>
      )}

      {/* Custom Palette Builder Modal */}
      <CustomPaletteModal
        isOpen={isCustomPaletteOpen}
        onClose={() => setIsCustomPaletteOpen(false)}
        initialPalette={theme.customPalette}
        onApplyPalette={handleApplyCustomPalette}
      />
    </div>
  );
};

export default ThemingStudio;
