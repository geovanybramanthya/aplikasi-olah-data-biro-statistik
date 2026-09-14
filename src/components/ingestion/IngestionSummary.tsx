import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  BarChart2,
  PieChart,
  ListOrdered,
  Layers,
  MessageSquare,
  Search,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { SurveyDataset, ColumnProfile, QuestionType } from '../../types/survey';

interface IngestionSummaryProps {
  dataset: SurveyDataset;
  onProceedToCuration: () => void;
}

export const IngestionSummary: React.FC<IngestionSummaryProps> = ({
  dataset,
  onProceedToCuration,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const piiColumns = dataset.columns.filter((c) => c.isPII);
  const visualColumns = dataset.columns.filter((c) => !c.isPII);

  // Type counts
  const typeCounts = dataset.columns.reduce((acc, col) => {
    acc[col.type] = (acc[col.type] || 0) + 1;
    return acc;
  }, {} as Record<QuestionType, number>);

  const filteredColumns = dataset.columns.filter((col) => {
    const matchesSearch =
      col.cleanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.rawName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'PII') return matchesSearch && col.isPII;
    if (filterType === 'VISUAL') return matchesSearch && !col.isPII;
    return matchesSearch && col.type === filterType;
  });

  const getTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'METADATA_PII':
        return {
          label: 'Metadata / PII',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Shield,
        };
      case 'DICHOTOMOUS_BINARY':
        return {
          label: 'Dichotomous Binary (Ya/Tidak)',
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: PieChart,
        };
      case 'LIKERT_SCALE':
        return {
          label: 'Likert Scale (Ordinal)',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ListOrdered,
        };
      case 'MULTI_SELECT_CHECKBOX':
        return {
          label: 'Multi-Select Checkboxes',
          classes: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Layers,
        };
      case 'NOMINAL_DEMOGRAPHIC':
        return {
          label: 'Nominal / Demografis',
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: BarChart2,
        };
      case 'OPEN_ENDED_TEXT':
        return {
          label: 'Esai Naratif Terbuka',
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: MessageSquare,
        };
      default:
        return {
          label: type,
          classes: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Info,
        };
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Overview Metric Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Ingesti & Profiling Berhasil
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">{dataset.fileName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-jakarta">
              {dataset.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Dataset berhasil diproses secara lokal. Schema profiling otomatis mengklasifikasikan pertanyaan dan memfilter privasi responden.
            </p>
          </div>

          <button
            onClick={onProceedToCuration}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-undip-navy hover:bg-undip-blue transition-colors shadow-md hover:shadow-lg"
          >
            <span>Buka Rekomendasi Grafik</span>
            <ChevronRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Total Responden</span>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-jakarta">
              {dataset.rowCount.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400">Baris data terverifikasi</span>
          </div>

          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
            <span className="text-xs text-blue-700 font-medium">Pertanyaan Visual</span>
            <p className="text-2xl font-bold text-blue-900 mt-1 font-jakarta">
              {visualColumns.length}
            </p>
            <span className="text-[11px] text-blue-600">Siap untuk visualisasi</span>
          </div>

          <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
            <span className="text-xs text-amber-700 font-medium">PII / Metadata Terfilter</span>
            <p className="text-2xl font-bold text-amber-900 mt-1 font-jakarta">
              {piiColumns.length}
            </p>
            <span className="text-[11px] text-amber-600">Privasi terlindungi otomatis</span>
          </div>

          <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-100">
            <span className="text-xs text-purple-700 font-medium">Multi-Select & Likert</span>
            <p className="text-2xl font-bold text-purple-900 mt-1 font-jakarta">
              {(typeCounts['MULTI_SELECT_CHECKBOX'] || 0) + (typeCounts['LIKERT_SCALE'] || 0)}
            </p>
            <span className="text-[11px] text-purple-600">Skala & checkbox terdeteksi</span>
          </div>
        </div>

        {/* Taxonomic Distribution Pill Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">Distribusi Tipe:</span>
          {Object.entries(typeCounts).map(([typeKey, count]) => {
            const info = getTypeBadge(typeKey as QuestionType);
            return (
              <span
                key={typeKey}
                className={`inline-flex items-center text-xs px-2.5 py-1 rounded-lg border ${info.classes}`}
              >
                <info.icon className="w-3 h-3 mr-1" />
                <span>{info.label}:</span>
                <span className="ml-1 font-bold">{count}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Schema Columns Table Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-jakarta">
              Daftar Profil Kolom & Ringkasan Statistik
            </h3>
            <p className="text-xs text-slate-500">
              Hasil inferensi algoritma profiling terhadap seluruh kolom spreadsheet
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul kolom..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-undip-blue/20 focus:border-undip-blue w-48 sm:w-56"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-undip-blue/20 focus:border-undip-blue"
            >
              <option value="ALL">Semua Kolom ({dataset.columns.length})</option>
              <option value="VISUAL">Visual Saja ({visualColumns.length})</option>
              <option value="PII">PII / Metadata ({piiColumns.length})</option>
              <option value="NOMINAL_DEMOGRAPHIC">Nominal Demografis</option>
              <option value="DICHOTOMOUS_BINARY">Dichotomous Binary</option>
              <option value="LIKERT_SCALE">Likert Scale</option>
              <option value="MULTI_SELECT_CHECKBOX">Multi-Select</option>
              <option value="OPEN_ENDED_TEXT">Esai Terbuka</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Nama Kolom & Judul Tampilan</th>
                <th className="py-3 px-4">Klasifikasi Tipe</th>
                <th className="py-3 px-4 text-center">Respon Valid</th>
                <th className="py-3 px-4 text-center">Kategori Unik</th>
                <th className="py-3 px-4">Rekomendasi Grafik</th>
                <th className="py-3 px-4">Ringkasan Statistik Otomatis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredColumns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada kolom yang cocok dengan pencarian / filter ini.
                  </td>
                </tr>
              ) : (
                filteredColumns.map((col, idx) => {
                  const badge = getTypeBadge(col.type);
                  return (
                    <tr
                      key={col.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        col.isPII ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {col.columnIndex + 1}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {col.cleanName}
                        </div>
                        {col.cleanName !== col.rawName && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={`Raw: "${col.rawName}"`}>
                            Raw: "{col.rawName}"
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${badge.classes}`}
                        >
                          <badge.icon className="w-3 h-3 mr-1" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap font-medium text-slate-700">
                        {col.validResponses} / {col.totalResponses}
                        {col.missingResponses > 0 && (
                          <span className="block text-[10px] text-amber-600">
                            ({col.missingResponses} kosong)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {col.type === 'MULTI_SELECT_CHECKBOX' && col.multiSelect
                            ? `${col.multiSelect.tokenFrequencies.length} opsi`
                            : `${col.uniqueValuesCount}`}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {col.recommendedChart === 'none' ? (
                          <span className="text-[11px] text-slate-400 italic">
                            Tidak divisualisasikan
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {col.recommendedChart.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed max-w-sm">
                        {col.offlineSummary}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
