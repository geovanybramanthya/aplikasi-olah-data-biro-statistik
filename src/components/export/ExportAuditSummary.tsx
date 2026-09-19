/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 4: High-Resolution Batch Export & Asset Packaging
 * Feature 29: Tab 4 Deliverables & Audit Studio Dashboard
 */

import React, { useState, useMemo } from 'react';
import { SurveyDataset, ColumnProfile } from '../../types/survey';
import { ThemeConfig, DimensionalityMode } from '../../types/theming';
import { BatchExportModal } from './BatchExportModal';
import { buildExportManifest, triggerBlobDownload } from '../../core/export/zipPackager';
import { downloadSingleChart } from '../../core/export/canvasExporter';
import { resolveDimensionality } from '../../core/theming/palettes';
import {
  Download,
  FileArchive,
  FileText,
  Copy,
  Check,
  Palette,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Layers,
  ChevronRight,
} from 'lucide-react';

export interface ExportAuditSummaryProps {
  dataset: SurveyDataset | null;
  theme: ThemeConfig;
  cardOverrides?: Record<string, DimensionalityMode | 'inherit'>;
  onNavigateToTab?: (tab: 'ingestion' | 'curation' | 'studio' | 'export') => void;
}

export const ExportAuditSummary: React.FC<ExportAuditSummaryProps> = ({
  dataset,
  theme,
  cardOverrides = {},
  onNavigateToTab,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [downloadingColId, setDownloadingColId] = useState<string | null>(null);

  // Active visual columns
  const activeColumns = useMemo(() => {
    return (
      dataset?.columns.filter(
        (c) => !c.isExcluded && c.selectedChart && c.selectedChart !== 'none'
      ) ?? []
    );
  }, [dataset]);

  // Generate live preview of SURVEY_SUMMARY_AUDIT.txt
  const manifestPreview = useMemo(() => {
    if (!dataset) return '';
    return buildExportManifest(dataset.columns, theme, {
      name: dataset.name,
      rowCount: dataset.rowCount,
    });
  }, [dataset, theme]);

  const handleCopyManifest = () => {
    if (!manifestPreview) return;
    navigator.clipboard.writeText(manifestPreview);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadManifestTxt = () => {
    if (!manifestPreview) return;
    const blob = new Blob([manifestPreview], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, 'SURVEY_SUMMARY_AUDIT.txt');
  };

  // Feature 28: Download single chart directly from audit table
  const handleDownloadSingle = async (col: ColumnProfile) => {
    setDownloadingColId(col.id);
    try {
      const override = cardOverrides[col.id] || 'inherit';
      const effMode = resolveDimensionality(theme.globalDimensionality, override);
      await downloadSingleChart(col, theme, effMode);
    } catch (err) {
      console.error('[ExportAuditSummary] Single export failed:', err);
    } finally {
      setDownloadingColId(null);
    }
  };

  if (!dataset) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
          <FileArchive className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-jakarta">
          Belum Ada Data Survei yang Dimuat
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Silakan unggah berkas CSV/XLSX survei Google Forms atau gunakan 1-Klik Data Demo BEM UNDIP untuk menghasilkan paket ekspor arsip grafik dan audit manifest.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigateToTab?.('ingestion')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue transition-colors shadow-md inline-flex items-center space-x-1.5"
          >
            <span>Buka Menu Ingesti Data</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Hero Action Banner */}
      <div className="bg-gradient-to-br from-undip-navy via-slate-900 to-undip-blue rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-undip-cream border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-undip-gold" />
            <span>Studio Ekspor & Audit Paket Rilis Resmi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-jakarta">
            Paketkan Seluruh Grafik Presentasi ke Dalam Berkas ZIP
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Rasterisasi otomatis ~300 DPI (2400x1500 px) dengan logo dan watermark resmi Biro Statistik {theme.organizationName || 'BEM UNDIP'},
            disertai berkas manifest kepatuhan audit <code className="bg-white/20 px-1 py-0.5 rounded text-undip-cream">SURVEY_SUMMARY_AUDIT.txt</code>.
          </p>
        </div>

        <div className="relative z-10 flex-shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={activeColumns.length === 0}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-extrabold text-sm text-undip-navy bg-gradient-to-r from-undip-gold to-amber-300 hover:from-amber-300 hover:to-undip-gold transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-5 h-5 text-undip-navy" />
            <span>Unduh Paket Batch (.ZIP)</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Grafik Visual Aktif</span>
            <BarChart3 className="w-4 h-4 text-undip-blue" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-jakarta">
            {activeColumns.length}{' '}
            <span className="text-xs font-normal text-slate-400">/ {dataset.columns.length}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {dataset.columns.length - activeColumns.length} kolom dikecualikan / teks murni
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Palet & Tema Aktif</span>
            <Palette className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 font-jakarta truncate">
            {theme.activePalette.name}
          </div>
          <div className="flex items-center space-x-1 pt-1">
            {theme.activePalette.colors.slice(0, 5).map((hex, idx) => (
              <span
                key={idx}
                className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
            <span className="text-[10px] text-slate-400 ml-1 font-mono">{theme.fontFamily}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Watermark Institusional</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">
            {theme.showWatermark ? 'Aktif Tersemat' : 'Dinonaktifkan'}
          </div>
          <p className="text-[11px] text-slate-500 truncate" title={theme.watermarkText}>
            "{theme.watermarkText}"
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Resolusi Ekspor</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 font-jakarta">
            ~300 DPI (3x Scale)
          </div>
          <p className="text-[11px] text-slate-500">
            2400 × 1500 px • Lossless PNG
          </p>
        </div>
      </div>

      {/* 3. Live Audit Manifest Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-undip-blue" />
            <h3 className="text-sm font-bold text-slate-800 font-jakarta">
              Pratinjau Berkas Manifest Audit (<code className="text-xs text-undip-navy font-mono">SURVEY_SUMMARY_AUDIT.txt</code>)
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyManifest}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadManifestTxt}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-undip-navy text-white hover:bg-undip-blue transition-colors inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh TXT</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="p-6 bg-slate-900">
          <pre className="text-xs font-mono text-emerald-400 overflow-x-auto max-h-64 leading-relaxed">
            {manifestPreview}
          </pre>
        </div>
      </div>

      {/* 4. Itemized Export Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 font-jakarta">
            Daftar Inventaris Grafik Siap Kemas ({activeColumns.length} Berkas)
          </h3>
          <span className="text-xs text-slate-500">
            Format file: <code className="font-mono text-undip-navy">charts/01_chart_slug.png</code>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 w-16">No</th>
                <th className="px-6 py-3">Judul Grafik</th>
                <th className="px-6 py-3">Tipe Visual</th>
                <th className="px-6 py-3">Dimensi</th>
                <th className="px-6 py-3">Responden</th>
                <th className="px-6 py-3 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeColumns.map((col, idx) => {
                const override = cardOverrides[col.id] || 'inherit';
                const effMode = resolveDimensionality(theme.globalDimensionality, override);
                const isDownloading = downloadingColId === col.id;

                return (
                  <tr key={col.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                      {col.displayTitle || col.cleanName}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-undip-blue border border-blue-200 uppercase">
                        {col.selectedChart}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>{effMode.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600">
                      N = {col.validResponses || 0}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDownloadSingle(col)}
                        disabled={isDownloading}
                        className="p-1.5 text-slate-500 hover:text-undip-navy hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        title="Unduh 3x PNG Individual"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[11px]">PNG</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Batch Export Modal Instance */}
      <BatchExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dataset={dataset}
        theme={theme}
        cardOverrides={cardOverrides}
      />
    </div>
  );
};

export default ExportAuditSummary;
