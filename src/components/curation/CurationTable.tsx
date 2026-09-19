import React, { useState, useMemo } from 'react';
import { SurveyDataset, ColumnProfile, QuestionType, ChartType } from '../../types/survey';
import { ThemeConfig } from '../../types/theming';
import {
  getAllowedPublicChartTypes,
  validateChartSelection,
  isChartTypeProhibited,
} from '../../core/recommender/prohibitedRules';
import { ColumnDetailModal } from './ColumnDetailModal';
import { OrgIdentityModal } from '../studio/OrgIdentityModal';
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey,
} from '../../services/geminiService';
import {
  Search,
  SlidersHorizontal,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  PieChart,
  BarChart3,
  BarChartHorizontal,
  ListOrdered,
  MessageSquareText,
  Shield,
  RotateCcw,
  CheckSquare,
  XSquare,
  ChevronRight,
  Key,
  Edit2,
  Check,
  X,
  Layers,
  ArrowUpDown,
  Filter,
  Building2,
} from 'lucide-react';

interface CurationTableProps {
  dataset: SurveyDataset;
  onUpdateColumn: (colId: string, updates: Partial<ColumnProfile>) => void;
  onBatchUpdate: (updatedColumns: ColumnProfile[]) => void;
  onProceedToStudio?: () => void;
  theme?: ThemeConfig;
  onUpdateTheme?: (updates: Partial<ThemeConfig>) => void;
}

type FilterType = 'ALL' | QuestionType;

export const CurationTable: React.FC<CurationTableProps> = ({
  dataset,
  onUpdateColumn,
  onBatchUpdate,
  onProceedToStudio,
  theme,
  onUpdateTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [selectedColumnForModal, setSelectedColumnForModal] = useState<ColumnProfile | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isOrgIdentityOpen, setIsOrgIdentityOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getStoredGeminiApiKey());
  const [apiKeySuccessNotice, setApiKeySuccessNotice] = useState<string | null>(null);
  const [prohibitedErrorNotice, setProhibitedErrorNotice] = useState<string | null>(null);

  const allowedCharts = getAllowedPublicChartTypes();

  // Overview Counts
  const totalColumns = dataset.columns.length;
  const activeChartsCount = dataset.columns.filter(
    (c) => !c.isExcluded && c.selectedChart !== 'none'
  ).length;
  const excludedColumnsCount = dataset.columns.filter((c) => c.isExcluded).length;
  const piiColumnsCount = dataset.columns.filter((c) => c.isPII).length;

  // Filtered and Searched Columns
  const filteredColumns = useMemo(() => {
    return dataset.columns.filter((col) => {
      // Type Filter
      if (activeFilter !== 'ALL' && col.type !== activeFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = col.cleanName.toLowerCase().includes(query);
        const matchesTitle = col.displayTitle.toLowerCase().includes(query);
        const matchesType = col.type.toLowerCase().includes(query);
        return matchesName || matchesTitle || matchesType;
      }
      return true;
    });
  }, [dataset.columns, activeFilter, searchQuery]);

  // Inline Title Editing Handlers
  const startEditingTitle = (col: ColumnProfile) => {
    setEditingTitleId(col.id);
    setEditingTitleText(col.displayTitle);
  };

  const saveEditingTitle = (colId: string) => {
    if (editingTitleText.trim()) {
      onUpdateColumn(colId, { displayTitle: editingTitleText.trim() });
    }
    setEditingTitleId(null);
  };

  const cancelEditingTitle = () => {
    setEditingTitleId(null);
  };

  // Chart Selection Handler with Prohibition Check
  const handleChartChange = (col: ColumnProfile, newChart: ChartType) => {
    const validation = validateChartSelection(newChart);
    if (!validation.isValid) {
      setProhibitedErrorNotice(validation.error || 'Grafik ini dilarang.');
      setTimeout(() => setProhibitedErrorNotice(null), 5000);
      return;
    }

    setProhibitedErrorNotice(null);
    onUpdateColumn(col.id, {
      selectedChart: newChart,
      isExcluded: newChart === 'none' ? true : col.isExcluded,
    });
  };

  // Toggle Excluded
  const handleToggleExclusion = (col: ColumnProfile) => {
    onUpdateColumn(col.id, {
      isExcluded: !col.isExcluded,
    });
  };

  // Batch Actions
  const handleIncludeAll = () => {
    const updated = dataset.columns.map((c) => ({
      ...c,
      isExcluded: c.isPII || c.selectedChart === 'none',
    }));
    onBatchUpdate(updated);
  };

  const handleExcludeOpenEnded = () => {
    const updated = dataset.columns.map((c) => {
      if (c.type === 'OPEN_ENDED_TEXT') {
        return { ...c, isExcluded: true };
      }
      return c;
    });
    onBatchUpdate(updated);
  };

  const handleResetToRecommended = () => {
    const updated = dataset.columns.map((c) => ({
      ...c,
      selectedChart: c.recommendedChart,
      displayTitle: c.cleanName,
      isExcluded: c.isPII,
    }));
    onBatchUpdate(updated);
  };

  // API Key Management
  const handleSaveApiKey = () => {
    setStoredGeminiApiKey(apiKeyInput);
    setApiKeySuccessNotice('Kunci Gemini API berhasil disimpan!');
    setTimeout(() => {
      setApiKeySuccessNotice(null);
      setIsApiKeyModalOpen(false);
    }, 1200);
  };

  const handleClearApiKey = () => {
    clearStoredGeminiApiKey();
    setApiKeyInput('');
    setApiKeySuccessNotice('Kunci Gemini API berhasil dihapus.');
    setTimeout(() => setApiKeySuccessNotice(null), 1200);
  };

  // Type Badges & Icons Helper
  const getTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'DICHOTOMOUS_BINARY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Biner (Ya/Tidak)
          </span>
        );
      case 'LIKERT_SCALE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Skala Likert
          </span>
        );
      case 'MULTI_SELECT_CHECKBOX':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Multi-Select
          </span>
        );
      case 'NOMINAL_DEMOGRAPHIC':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Demografi
          </span>
        );
      case 'OPEN_ENDED_TEXT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Teks Bebas
          </span>
        );
      case 'METADATA_PII':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            PII / Metadata
          </span>
        );
    }
  };

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case 'donut':
        return <PieChart className="w-3.5 h-3.5 text-blue-600" />;
      case 'vertical_bar':
        return <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'horizontal_bar':
        return <BarChartHorizontal className="w-3.5 h-3.5 text-undip-navy" />;
      case 'ranked_bar':
        return <ListOrdered className="w-3.5 h-3.5 text-amber-600" />;
      case 'ordered_likert':
        return <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />;
      case 'text_feed':
        return <MessageSquareText className="w-3.5 h-3.5 text-indigo-600" />;
      case 'none':
      default:
        return <EyeOff className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic BEM Faculty Identity & Logo Banner */}
      {theme && onUpdateTheme && (
        <div className="bg-gradient-to-r from-slate-900 via-undip-navy to-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center border-2 border-undip-gold/50 shadow-sm overflow-hidden shrink-0">
              <img
                src={theme.customLogoUrl || '/logo-birstat-transparent.png'}
                alt="Logo BEM"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-undip-gold uppercase tracking-wider font-jakarta">
                  Identitas & Logo BEM Penerbit
                </span>
                {theme.customLogoUrl ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Logo Kustom Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Logo Default Biro Statistik
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-white font-jakarta mt-0.5">
                Biro Statistik {theme.organizationName || 'BEM UNDIP'}
              </h4>
              <p className="text-[11px] text-slate-300">
                Gambar grafik yang diunduh otomatis memuat logo dan nama BEM ini sebagai watermark resmi.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsOrgIdentityOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-undip-navy bg-gradient-to-r from-undip-gold to-amber-300 hover:from-amber-300 hover:to-undip-gold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-undip-navy" />
              <span>Ganti Logo & Identitas BEM</span>
            </button>
          </div>
        </div>
      )}

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Kolom</span>
            <span className="text-xl font-extrabold text-slate-900 font-jakarta">
              {totalColumns}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Grafik Aktif</span>
            <span className="text-xl font-extrabold text-emerald-600 font-jakarta">
              {activeChartsCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <EyeOff className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Dikecualikan</span>
            <span className="text-xl font-extrabold text-amber-600 font-jakarta">
              {excludedColumnsCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-undip-navy/10 text-undip-navy flex items-center justify-center font-bold">
            <Shield className="w-5 h-5 text-undip-navy" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">PII Terfilter</span>
            <span className="text-xl font-extrabold text-undip-navy font-jakarta">
              {piiColumnsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Prohibited Alert Notice if triggered */}
      {prohibitedErrorNotice && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <X className="w-4 h-4 text-red-600 shrink-0" />
            <span>{prohibitedErrorNotice}</span>
          </div>
          <button
            onClick={() => setProhibitedErrorNotice(null)}
            className="text-red-500 hover:text-red-800"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Action Toolbar: Search, Filters & Batch Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan, judul, atau tipe data..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-navy/20 focus:border-undip-navy transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Gemini AI Key & Batch Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Gemini AI Key Button */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-undip-navy to-undip-blue text-white hover:opacity-95 transition-all flex items-center space-x-1.5 shadow-sm"
              title="Pengaturan Kunci Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-undip-gold" />
              <span>Gemini AI Key</span>
              {getStoredGeminiApiKey() && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
              )}
            </button>

            {/* Custom Logo & Organization Identity Button */}
            {theme && onUpdateTheme && (
              <button
                type="button"
                onClick={() => setIsOrgIdentityOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all flex items-center space-x-2 shadow-xs cursor-pointer"
                title="Kustomisasi Logo dan Identitas BEM Fakultas"
              >
                <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                  <img
                    src={theme.customLogoUrl || '/logo-birstat-transparent.png'}
                    alt="Emblem"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span>Logo & Identitas BEM</span>
                {theme.customLogoUrl ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Logo Kustom Aktif" />
                ) : (
                  <span className="text-[10px] text-slate-400">(Default)</span>
                )}
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <button
              onClick={handleIncludeAll}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center space-x-1"
              title="Aktifkan semua grafik yang bukan PII"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aktifkan Semua</span>
            </button>

            <button
              onClick={handleExcludeOpenEnded}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center space-x-1"
              title="Kecualikan pertanyaan teks kualitatif"
            >
              <XSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Kecualikan Teks</span>
            </button>

            <button
              onClick={handleResetToRecommended}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center space-x-1"
              title="Kembalikan semua pilihan grafik ke rekomendasi awal"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Rekomendasi</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 flex items-center mr-1 text-[11px] font-semibold">
            <Filter className="w-3 h-3 mr-1" />
            Filter:
          </span>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-undip-navy text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({totalColumns})
          </button>
          <button
            onClick={() => setActiveFilter('NOMINAL_DEMOGRAPHIC')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
              activeFilter === 'NOMINAL_DEMOGRAPHIC'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Demografi
          </button>
          <button
            onClick={() => setActiveFilter('DICHOTOMOUS_BINARY')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
              activeFilter === 'DICHOTOMOUS_BINARY'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Biner
          </button>
          <button
            onClick={() => setActiveFilter('LIKERT_SCALE')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
              activeFilter === 'LIKERT_SCALE'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Likert
          </button>
          <button
            onClick={() => setActiveFilter('MULTI_SELECT_CHECKBOX')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
              activeFilter === 'MULTI_SELECT_CHECKBOX'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Multi-Select
          </button>
          <button
            onClick={() => setActiveFilter('OPEN_ENDED_TEXT')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
              activeFilter === 'OPEN_ENDED_TEXT'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Teks Bebas
          </button>
          <button
            onClick={() => setActiveFilter('METADATA_PII')}
            className={`px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
              activeFilter === 'METADATA_PII'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            PII / Metadata
          </button>
        </div>
      </div>

      {/* Main Curation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5 min-w-[280px]">Pertanyaan & Judul Tampilan</th>
                <th className="px-4 py-3.5 w-32">Tipe Terdeteksi</th>
                <th className="px-4 py-3.5 w-40">Rekomendasi AI</th>
                <th className="px-4 py-3.5 w-48">Pilihan Grafik</th>
                <th className="px-4 py-3.5 w-24 text-center">Status</th>
                <th className="px-4 py-3.5 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredColumns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">Tidak ada pertanyaan yang sesuai filter</p>
                    <p className="text-xs mt-1">Coba sesuaikan kata pencarian atau pilih filter Semua</p>
                  </td>
                </tr>
              ) : (
                filteredColumns.map((col, idx) => {
                  const isEditing = editingTitleId === col.id;

                  return (
                    <tr
                      key={col.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        col.isExcluded ? 'bg-slate-50/40 opacity-70' : ''
                      }`}
                    >
                      {/* Index */}
                      <td className="px-4 py-3 text-center font-bold text-slate-400 font-mono">
                        {col.columnIndex + 1}
                      </td>

                      {/* Display Title with inline edit */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              value={editingTitleText}
                              onChange={(e) => setEditingTitleText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditingTitle(col.id);
                                if (e.key === 'Escape') cancelEditingTitle();
                              }}
                              autoFocus
                              className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-undip-navy focus:outline-none ring-1 ring-undip-navy bg-white"
                            />
                            <button
                              onClick={() => saveEditingTitle(col.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEditingTitle}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="group flex items-start justify-between">
                            <div className="space-y-0.5 max-w-[420px]">
                              <span
                                onClick={() => startEditingTitle(col)}
                                className="font-bold text-slate-900 cursor-pointer hover:text-undip-blue transition-colors line-clamp-2"
                                title="Klik untuk mengedit judul slide"
                              >
                                {col.displayTitle}
                              </span>
                              {col.displayTitle !== col.cleanName && (
                                <p className="text-[10px] text-slate-400 truncate">
                                  Asli: {col.cleanName}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => startEditingTitle(col)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 rounded transition-opacity shrink-0 ml-2"
                              title="Edit Judul"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Question Type Badge */}
                      <td className="px-4 py-3">{getTypeBadge(col.type)}</td>

                      {/* AI Recommendation */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                          {getChartIcon(col.recommendedChart)}
                          <span className="capitalize">
                            {col.recommendedChart.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Selected Chart Dropdown */}
                      <td className="px-4 py-3">
                        <select
                          value={col.selectedChart}
                          onChange={(e) => handleChartChange(col, e.target.value as ChartType)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-undip-navy focus:border-undip-navy transition-all"
                        >
                          {allowedCharts.map((c) => (
                            <option key={c.type} value={c.type}>
                              {c.label} {c.type === col.recommendedChart ? '★' : ''}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleExclusion(col)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            !col.isExcluded ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={!col.isExcluded ? 'Aktif (Ditampilkan)' : 'Nonaktif (Dilewati)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              !col.isExcluded ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions: Detail Modal */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedColumnForModal(col)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Studio Transition Banner */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-bold text-slate-800">{filteredColumns.length}</span>{' '}
            dari <span className="font-bold text-slate-800">{totalColumns}</span> kolom data.
          </div>

          {onProceedToStudio && (
            <button
              onClick={onProceedToStudio}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue transition-all shadow-md flex items-center space-x-1.5"
            >
              <span>Lanjut ke Theming & Visual Studio</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Column Detail Modal */}
      {selectedColumnForModal && (
        <ColumnDetailModal
          column={selectedColumnForModal}
          isOpen={selectedColumnForModal !== null}
          onClose={() => setSelectedColumnForModal(null)}
          onSave={(updated) => {
            onUpdateColumn(updated.id, updated);
            setSelectedColumnForModal(null);
          }}
          totalRespondents={dataset.rowCount}
        />
      )}

      {/* Gemini API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-undip-navy/10 text-undip-navy flex items-center justify-center">
                  <Key className="w-4 h-4 text-undip-navy" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-jakarta">
                  Kunci Gemini API (Opsional)
                </h3>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Kunci API disimpan secara aman di peramban (localStorage) Anda. Sistem platform tetap
              berjalan 100% tanpa internet menggunakan heuristik statistik offline jika kunci ini
              dikosongkan.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-undip-navy"
              />
            </div>

            {apiKeySuccessNotice && (
              <p className="text-xs text-emerald-600 font-semibold">{apiKeySuccessNotice}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleClearApiKey}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Hapus Kunci
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-undip-navy text-white hover:bg-undip-blue"
                >
                  Simpan Kunci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organization Identity & Custom Logo Modal */}
      {isOrgIdentityOpen && theme && onUpdateTheme && (
        <OrgIdentityModal
          isOpen={isOrgIdentityOpen}
          onClose={() => setIsOrgIdentityOpen(false)}
          theme={theme}
          onUpdateTheme={onUpdateTheme}
        />
      )}
    </div>
  );
};
