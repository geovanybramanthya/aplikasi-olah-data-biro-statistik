/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 4: High-Resolution Batch Export & Asset Packaging
 * Feature 29: Interactive Batch Export Progress Modal
 */

import React, { useState, useEffect } from 'react';
import { SurveyDataset } from '../../types/survey';
import { ThemeConfig, DimensionalityMode } from '../../types/theming';
import { BatchExportProgress } from '../../types/export';
import { exportDatasetToZip, triggerBlobDownload } from '../../core/export/zipPackager';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileArchive,
  FileText,
  RotateCcw,
} from 'lucide-react';

export interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: SurveyDataset | null;
  theme: ThemeConfig;
  cardOverrides?: Record<string, DimensionalityMode | 'inherit'>;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  dataset,
  theme,
  cardOverrides = {},
}) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState<BatchExportProgress>({
    total: 0,
    completed: 0,
    currentTitle: '',
    isZipping: false,
    isComplete: false,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string>('');

  const activeChartsCount =
    dataset?.columns.filter((c) => !c.isExcluded && c.selectedChart && c.selectedChart !== 'none')
      .length ?? 0;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setProgress({
        total: activeChartsCount,
        completed: 0,
        currentTitle: '',
        isZipping: false,
        isComplete: false,
      });
      setErrorMsg(null);
      setGeneratedBlob(null);
    }
  }, [isOpen, activeChartsCount]);

  if (!isOpen || !dataset) return null;

  const handleStartExport = async () => {
    setStatus('running');
    setErrorMsg(null);

    try {
      const result = await exportDatasetToZip({
        dataset,
        theme,
        cardOverrides,
        pixelRatio: 3,
        autoDownload: true,
        onProgress: (p) => setProgress(p),
      });

      setGeneratedBlob(result.blob);
      setGeneratedFilename(result.filename);
      setStatus('completed');
    } catch (err: any) {
      console.error('[BatchExportModal] Export failed:', err);
      setStatus('error');
      setErrorMsg(err?.message || 'Terjadi kesalahan saat merasterisasi grafik.');
    }
  };

  const handleRedownload = () => {
    if (generatedBlob && generatedFilename) {
      triggerBlobDownload(generatedBlob, generatedFilename);
    }
  };

  const percent =
    progress.total > 0
      ? Math.min(100, Math.round((progress.completed / progress.total) * 100))
      : progress.isZipping
      ? 100
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-undip-navy to-undip-blue p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={status === 'running'}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-undip-gold/20 text-undip-gold border border-undip-gold/30 flex items-center justify-center">
              <FileArchive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-jakarta">Ekspor Paket Batch (.ZIP)</h3>
              <p className="text-xs text-slate-200">
                Resolusi Tinggi 3x (~300 DPI) • Standar Publikasi {theme.organizationName || 'BEM UNDIP'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Dataset:</span>
              <span className="font-bold text-slate-900 truncate max-w-[240px]">
                {dataset.name}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Jumlah Grafik Visual:</span>
              <span className="font-bold text-undip-navy bg-undip-navy/10 px-2 py-0.5 rounded-full">
                {activeChartsCount} Grafik Aktif
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Audit Manifest:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                <FileText className="w-3 h-3 mr-1" /> SURVEY_SUMMARY_AUDIT.txt
              </span>
            </div>
          </div>

          {/* Progress Section */}
          {status === 'running' && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-undip-blue" />
                  {progress.isZipping
                    ? 'Mengompresi arsip ZIP...'
                    : `Memproses ${progress.completed} dari ${progress.total} grafik`}
                </span>
                <span className="text-undip-blue font-bold">{percent}%</span>
              </div>

              {/* Progress Bar Track */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-undip-navy to-undip-blue rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Current Title Info */}
              <p className="text-[11px] text-slate-500 truncate italic">
                {progress.isZipping
                  ? 'Menyusun berkas ke dalam kompresi DEFLATE level 6...'
                  : `Sedang memproses: "${progress.currentTitle}"`}
              </p>
            </div>
          )}

          {/* Completed State */}
          {status === 'completed' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2 animate-fadeIn">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900 font-jakarta">
                Paket ZIP Berhasil Dibuat!
              </h4>
              <p className="text-xs text-emerald-700">
                Berkas <strong>{generatedFilename}</strong> telah diproses dan diunduh ke perangkat Anda.
              </p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-700 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-red-900">
                <AlertCircle className="w-4 h-4" />
                <span>Gagal Mengekspor</span>
              </div>
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          {status === 'idle' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleStartExport}
                disabled={activeChartsCount === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue transition-colors shadow-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 text-undip-gold" />
                <span>Mulai Ekspor Paket ({activeChartsCount} Grafik)</span>
              </button>
            </>
          )}

          {status === 'running' && (
            <div className="text-xs text-slate-500 italic flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-undip-blue" />
              <span>Harap tunggu, proses render sedang berjalan...</span>
            </div>
          )}

          {status === 'completed' && (
            <>
              <button
                onClick={handleRedownload}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-undip-navy bg-white border border-undip-navy/30 hover:bg-undip-navy/5 transition-colors flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Unduh Ulang</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue transition-colors shadow-md"
              >
                Selesai & Tutup
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Tutup
              </button>
              <button
                onClick={handleStartExport}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Coba Lagi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchExportModal;
