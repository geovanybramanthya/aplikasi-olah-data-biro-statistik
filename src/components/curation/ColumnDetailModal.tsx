import React, { useState, useEffect } from 'react';
import { ColumnProfile, ChartType, QuestionType } from '../../types/survey';
import {
  getAllowedPublicChartTypes,
  validateChartSelection,
  isChartTypeProhibited,
  getProhibitionReason,
} from '../../core/recommender/prohibitedRules';
import { getRecommendationRationale } from '../../core/recommender/chartHeuristics';
import { fetchGeminiNarrative, getStoredGeminiApiKey } from '../../services/geminiService';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  Info,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ColumnDetailModalProps {
  column: ColumnProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedColumn: ColumnProfile) => void;
  totalRespondents: number;
}

export const ColumnDetailModal: React.FC<ColumnDetailModalProps> = ({
  column,
  isOpen,
  onClose,
  onSave,
  totalRespondents,
}) => {
  if (!isOpen || !column) return null;

  const [displayTitle, setDisplayTitle] = useState(column.displayTitle);
  const [selectedChart, setSelectedChart] = useState<ChartType>(column.selectedChart);
  const [isExcluded, setIsExcluded] = useState<boolean>(column.isExcluded);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [currentNarrative, setCurrentNarrative] = useState<string>(
    column.aiNarrative || column.offlineSummary
  );
  const [aiStatusNotice, setAiStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    setDisplayTitle(column.displayTitle);
    setSelectedChart(column.selectedChart);
    setIsExcluded(column.isExcluded);
    setCurrentNarrative(column.aiNarrative || column.offlineSummary);
    setValidationError(null);
    setAiStatusNotice(null);
  }, [column]);

  const isPiiColumn = Boolean(column.isPII || column.type === 'METADATA_PII');
  const allowedCharts = getAllowedPublicChartTypes();
  const rationale = getRecommendationRationale(
    column.type,
    column.uniqueValuesCount,
    Object.keys(column.distribution).reduce((max, k) => Math.max(max, k.length), 0)
  );

  const handleChartChange = (newChart: ChartType) => {
    const val = validateChartSelection(newChart);
    if (!val.isValid) {
      setValidationError(val.error || 'Grafik ini dilarang.');
      return;
    }
    setValidationError(null);
    setSelectedChart(newChart);
    if (newChart === 'none') {
      setIsExcluded(true);
    }
  };

  const handleGenerateAi = async () => {
    if (isPiiColumn) {
      setAiStatusNotice(
        'AI dinonaktifkan untuk kolom PII / identitas pribadi demi perlindungan privasi mahasiswa.'
      );
      return;
    }

    const apiKey = getStoredGeminiApiKey();
    if (!apiKey) {
      setAiStatusNotice(
        'Kunci Gemini API belum diisi. Masukkan kunci API di pengaturan bilah atas untuk mengaktifkan narasi otomatis.'
      );
      return;
    }

    setIsGeneratingAi(true);
    setAiStatusNotice(null);

    try {
      const result = await fetchGeminiNarrative(
        { ...column, displayTitle, selectedChart },
        apiKey
      );

      setCurrentNarrative(result.narrative);

      if (result.isOfflineFallback) {
        setAiStatusNotice(
          result.error
            ? `Peringatan: ${result.error}. Beralih ke statistik offline.`
            : 'Menggunakan ringkasan statistik offline (kunci API tidak aktif / jaringan offline).'
        );
      } else {
        setAiStatusNotice('Narasi Gemini AI berhasil diperbarui!');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan sistem';
      setAiStatusNotice(`Gagal membuat narasi AI: ${msg}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSave = () => {
    if (isChartTypeProhibited(selectedChart)) {
      setValidationError('Pilihan grafik dilarang.');
      return;
    }

    onSave({
      ...column,
      displayTitle: displayTitle.trim() || column.cleanName,
      selectedChart,
      isExcluded,
      aiNarrative: currentNarrative.startsWith('[Gemini AI]') ? currentNarrative : undefined,
    });
    onClose();
  };

  const getTypeBadgeColor = (type: QuestionType) => {
    switch (type) {
      case 'DICHOTOMOUS_BINARY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LIKERT_SCALE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MULTI_SELECT_CHECKBOX':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'NOMINAL_DEMOGRAPHIC':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'OPEN_ENDED_TEXT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'METADATA_PII':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-undip-navy/10 text-undip-navy flex items-center justify-center font-bold text-sm">
              #{column.columnIndex + 1}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getTypeBadgeColor(
                    column.type
                  )}`}
                >
                  {column.type.replace(/_/g, ' ')}
                </span>
                {column.isPII && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    PII / Sensitif
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 font-jakarta mt-0.5 line-clamp-1">
                {column.cleanName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Presentation Title & Configuration */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span>Konfigurasi Presentasi</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Judul Grafik untuk Slide & Laporan
              </label>
              <input
                type="text"
                value={displayTitle}
                onChange={(e) => setDisplayTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-undip-navy/20 focus:border-undip-navy transition-all"
                placeholder="Masukkan judul presentasi..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Teks asli: <span className="italic">{column.cleanName}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipe Grafik Terpilih
                </label>
                <select
                  value={selectedChart}
                  onChange={(e) => handleChartChange(e.target.value as ChartType)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-undip-navy/20 focus:border-undip-navy transition-all"
                >
                  {allowedCharts.map((c) => (
                    <option key={c.type} value={c.type}>
                      {c.label} {c.type === column.recommendedChart ? '★ (Rekomendasi)' : ''}
                    </option>
                  ))}
                </select>
                {validationError && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status Visibilitas Grafik
                </label>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsExcluded(!isExcluded)}
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      !isExcluded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {!isExcluded ? (
                      <>
                        <Eye className="w-4 h-4 mr-1.5 text-emerald-600" />
                        <span>Ditampilkan (Aktif)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-1.5 text-slate-400" />
                        <span>Dilewati (Nonaktif)</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500">
                    {!isExcluded
                      ? 'Akan dirender ke grafik visual & ekspor ZIP'
                      : 'Diabaikan dari ekspor visual'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Recommendation Rationale Box */}
            <div className="bg-blue-50/80 rounded-xl p-3.5 border border-blue-200/80 text-xs text-blue-900 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-undip-blue mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-undip-navy">
                  Rekomendasi Biro Statistik: {rationale.title}
                </p>
                <p className="text-blue-800 mt-0.5 leading-relaxed">{rationale.rationale}</p>
                <p className="text-[11px] text-blue-700 mt-1 italic">
                  Saran: {rationale.presentationAdvice}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Distribution Metrics & Data Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Distribusi & Metrik Responden</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-medium text-slate-500 block">Total Responden</span>
                <span className="text-lg font-bold text-slate-900 font-jakarta">
                  {column.totalResponses}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-medium text-slate-500 block">Respon Valid</span>
                <span className="text-lg font-bold text-emerald-600 font-jakarta">
                  {column.validResponses}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-medium text-slate-500 block">Data Kosong</span>
                <span className="text-lg font-bold text-slate-400 font-jakarta">
                  {column.missingResponses}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-medium text-slate-500 block">Kategori Unik</span>
                <span className="text-lg font-bold text-undip-navy font-jakarta">
                  {column.uniqueValuesCount}
                </span>
              </div>
            </div>

            {/* Special Type Details */}
            {column.type === 'LIKERT_SCALE' && column.likertScale && (
              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 uppercase">
                    Metrik Skala Likert (Skala {column.likertScale.max})
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Top-Box (Skor 4 & 5): {column.likertScale.netPositivePercent}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-purple-600 block">Skor Rata-rata</span>
                    <span className="text-base font-bold text-purple-900">
                      {column.likertScale.mean}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-purple-600 block">Median</span>
                    <span className="text-base font-bold text-purple-900">
                      {column.likertScale.median}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-purple-600 block">Net Positif</span>
                    <span className="text-base font-bold text-purple-900">
                      {column.likertScale.netPositivePercent}%
                    </span>
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div className="space-y-1.5 pt-1">
                  {Array.from({ length: column.likertScale.max }, (_, i) => i + 1).map((score) => {
                    const count = column.distribution[String(score)] || 0;
                    const pct =
                      column.validResponses > 0
                        ? ((count / column.validResponses) * 100).toFixed(1)
                        : '0';
                    const label = column.likertScale?.labels[score] || `Skor ${score}`;

                    return (
                      <div key={score} className="space-y-0.5">
                        <div className="flex justify-between text-xs text-slate-700">
                          <span className="truncate max-w-[280px]">
                            {score} - {label}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {column.type === 'MULTI_SELECT_CHECKBOX' && column.multiSelect && (
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase">
                    Analisis Multi-Select Checkbox
                  </span>
                  <span className="text-xs text-amber-800 font-medium">
                    Total: {column.multiSelect.totalSelections} pilihan (Rata-rata{' '}
                    {column.multiSelect.averageSelectionsPerRespondent} per responden)
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {column.multiSelect.tokenFrequencies.map((t, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-xs text-slate-800">
                        <span className="font-medium truncate max-w-[320px]">{t.token}</span>
                        <span className="font-bold text-amber-900">
                          {t.count} pemilih ({t.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, t.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {column.type === 'OPEN_ENDED_TEXT' && (
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-undip-navy uppercase">
                    Ekstraksi Kata Kunci & Aspirasi Utama
                  </span>
                  <span className="text-xs text-blue-700 font-medium">
                    {column.qualitativeSummary?.meaningfulResponses || column.validResponses} respons substantif
                  </span>
                </div>

                {column.qualitativeSummary?.topKeywords && column.qualitativeSummary.topKeywords.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {column.qualitativeSummary.topKeywords.map((kw, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-xs text-slate-800">
                          <span className="font-semibold">{kw.keyword}</span>
                          <span className="font-bold text-undip-blue">
                            {kw.count} penyebutan ({kw.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-undip-blue rounded-full"
                            style={{ width: `${Math.min(100, kw.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Belum ada kata kunci yang cukup frekuen untuk dikelompokkan.
                  </p>
                )}
              </div>
            )}

            {/* Standard Distribution Table for Nominal/Binary */}
            {column.type !== 'LIKERT_SCALE' &&
              column.type !== 'MULTI_SELECT_CHECKBOX' &&
              column.type !== 'OPEN_ENDED_TEXT' &&
              column.type !== 'METADATA_PII' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Kategori / Opsi</th>
                        <th className="px-3 py-2 text-right">Frekuensi (n)</th>
                        <th className="px-3 py-2 text-right">Proporsi (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(column.distribution)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, count]) => {
                          const pct =
                            column.validResponses > 0
                              ? ((count / column.validResponses) * 100).toFixed(1)
                              : '0';
                          return (
                            <tr key={cat} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-medium text-slate-800">{cat}</td>
                              <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                                {count}
                              </td>
                              <td className="px-3 py-1.5 text-right font-semibold text-undip-navy">
                                {pct}%
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* Section 3: Narrative & Strategic Policy Insights */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-undip-gold" />
                <span>Narasi & Wawasan Kebijakan Publik</span>
              </h4>

              <div className="flex items-center space-x-2">
                {isPiiColumn && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                    AI dinonaktifkan untuk kolom PII / identitas pribadi
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={isGeneratingAi || isPiiColumn}
                  title={isPiiColumn ? 'AI dinonaktifkan untuk kolom PII / identitas pribadi' : undefined}
                  className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isPiiColumn
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-gradient-to-r from-undip-navy to-undip-blue text-white hover:opacity-90 disabled:opacity-50'
                  }`}
                >
                  <Sparkles className="w-3 h-3 mr-1 text-undip-gold animate-spin-slow" />
                  <span>{isGeneratingAi ? 'Membuat Narasi...' : 'Buat Narasi Gemini AI'}</span>
                </button>
              </div>
            </div>

            {aiStatusNotice && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {aiStatusNotice}
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center space-x-2 mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentNarrative.startsWith('[Gemini AI]')
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {currentNarrative.startsWith('[Gemini AI]')
                    ? 'AI Insight (Gemini)'
                    : 'Statistik Offline (Biro Statistik)'}
                </span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                {currentNarrative}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-undip-navy hover:bg-undip-blue transition-colors shadow-sm"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
