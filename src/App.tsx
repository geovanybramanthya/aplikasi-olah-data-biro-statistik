import React, { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { SurveyDataset, ColumnProfile } from './types/survey';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { TabNavigation, ActiveTab } from './components/layout/TabNavigation';
import { FileUploadZone } from './components/ingestion/FileUploadZone';
import { DemoDataLoader } from './components/ingestion/DemoDataLoader';
import { IngestionSummary } from './components/ingestion/IngestionSummary';
import { CurationTable } from './components/curation/CurationTable';
import { ThemingStudio } from './components/studio/ThemingStudio';
import { ExportAuditSummary } from './components/export/ExportAuditSummary';
import { LandingPage } from './components/landing/LandingPage';
import { ThemeConfig } from './types/theming';
import { DEFAULT_THEME_CONFIG } from './core/theming/palettes';
import { loadSavedOrgIdentity, saveOrgIdentity } from './services/identityStorage';
import {
  Sparkles,
  CheckCircle2,
  Palette,
  Download,
  Sliders,
  ChevronRight,
  Database,
} from 'lucide-react';

const loadInitialTheme = (): ThemeConfig => {
  const saved = loadSavedOrgIdentity();
  if (!saved) return DEFAULT_THEME_CONFIG;
  return {
    ...DEFAULT_THEME_CONFIG,
    organizationName: saved.organizationName || DEFAULT_THEME_CONFIG.organizationName,
    facultyName: saved.facultyName || '',
    customLogoUrl: saved.customLogoUrl || null,
    watermarkText: saved.watermarkText || DEFAULT_THEME_CONFIG.watermarkText,
    verifiedBadgeText: saved.verifiedBadgeText || DEFAULT_THEME_CONFIG.verifiedBadgeText,
  };
};

const LandingRoute: React.FC = () => {
  const navigate = useNavigate();
  const [theme] = useState<ThemeConfig>(loadInitialTheme);

  return (
    <LandingPage
      theme={theme}
      onEnterApp={() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        navigate('/app');
      }}
    />
  );
};

const Workspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ingestion');
  const [dataset, setDataset] = useState<SurveyDataset | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>(loadInitialTheme);

  const handleUpdateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme((prev) => {
      const next = { ...prev, ...updates };
      saveOrgIdentity(next);
      return next;
    });
  };

  const handleDatasetLoaded = (newDataset: SurveyDataset) => {
    setDataset(newDataset);
    // Tab transition to curation tab upon dataset load as per M2 dispatch
    setActiveTab('curation');
  };

  const handleReset = () => {
    setDataset(null);
    setActiveTab('ingestion');
  };

  const handleUpdateColumn = (colId: string, updates: Partial<ColumnProfile>) => {
    if (!dataset) return;
    setDataset({
      ...dataset,
      columns: dataset.columns.map((col) =>
        col.id === colId ? { ...col, ...updates } : col
      ),
    });
  };

  const handleBatchUpdate = (updatedColumns: ColumnProfile[]) => {
    if (!dataset) return;
    setDataset({
      ...dataset,
      columns: updatedColumns,
    });
  };

  // Dynamically calculate active charts based on user curation
  const totalChartsCount =
    dataset?.columns.filter((c) => !c.isExcluded && c.selectedChart !== 'none').length ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation Header */}
      <Header dataset={dataset} onReset={handleReset} theme={theme} />

      {/* Main Workflow Tabs */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasDataset={dataset !== null}
        totalChartsCount={totalChartsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Ingestion & Schema Profiling Engine */}
        {activeTab === 'ingestion' && (
          <div className="space-y-8">
            {!dataset ? (
              <>
                {/* Hero Introduction */}
                <div className="bg-gradient-to-br from-undip-navy via-undip-blue to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-undip-gold to-transparent" />
                  
                  <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-undip-cream border border-white/20 mb-4">
                      <img
                        src={theme.customLogoUrl || '/logo-birstat-transparent.png'}
                        alt="Emblem"
                        className="w-4 h-4 object-contain"
                      />
                      <span>Platform Resmi Biro Statistik {theme.organizationName || 'BEM UNDIP 2026'}</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-jakarta leading-tight">
                      Ubah Data Mentah Survei Menjadi Grafik Presentasi Berstandar Publikasi
                    </h2>

                    <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed">
                      Sistem profiling otomatis mendeteksi skala Likert, pertanyaan multi-select, demografi,
                      serta memfilter identitas mahasiswa (NIM & Nama) secara 100% aman di browser tanpa server pihak ketiga.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-undip-gold" />
                        <span>RFC 4180 CSV & XLSX Parsing</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-undip-gold" />
                        <span>Filter PII / NIM / Nama Otomatis</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-undip-gold" />
                        <span>Multi-Select Token Repeat Ratio</span>
                      </div>
                    </div>
                  </div>

                  {/* Logo Hero Badge */}
                  <div className="relative z-10 hidden md:flex flex-col items-center justify-center p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl shrink-0">
                    <div className="w-32 h-32 rounded-2xl bg-white p-3 flex items-center justify-center shadow-lg border border-undip-gold/40">
                      <img
                        src={theme.customLogoUrl || '/logo-birstat-transparent.png'}
                        alt="Logo Biro Statistik"
                        className="w-full h-full object-contain filter drop-shadow"
                      />
                    </div>
                    <span className="mt-3 text-xs font-bold text-undip-cream tracking-wide uppercase font-jakarta text-center">
                      Biro Statistik<br />{theme.organizationName || 'BEM UNDIP'}
                    </span>
                  </div>
                </div>

                {/* Upload Zone */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-jakarta">
                        Unggah Berkas Survei
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pilih file CSV Google Forms atau lembar kerja Excel dari perangkat Anda
                      </p>
                    </div>
                  </div>

                  <FileUploadZone onDatasetLoaded={handleDatasetLoaded} />
                </div>

                {/* 1-Click Demo Data Loader */}
                <DemoDataLoader onDatasetLoaded={handleDatasetLoaded} />
              </>
            ) : (
              <>
                {/* Dataset Ingestion Summary Table & Metrics */}
                <IngestionSummary
                  dataset={dataset}
                  onProceedToCuration={() => setActiveTab('curation')}
                />

                {/* Quick Alternative Upload / Demo Loader */}
                <div className="border-t border-slate-200 pt-8 mt-8">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-2 font-jakarta">
                      Ingin Mencoba Dataset Survei Lainnya?
                    </h4>
                    <DemoDataLoader
                      onDatasetLoaded={handleDatasetLoaded}
                      activeDatasetName={dataset.name}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Curation & Recommendation Studio */}
        {activeTab === 'curation' && (
          <div>
            {!dataset ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-undip-blue flex items-center justify-center mx-auto border border-blue-100">
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-jakarta">
                  Belum Ada Data Survei
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Silakan unggah berkas CSV/XLSX survei Google Forms atau gunakan 1-Klik Data Demo BEM UNDIP untuk memulai kurasi grafik rekomendasi.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('ingestion')}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue transition-colors shadow-md inline-flex items-center space-x-1.5"
                  >
                    <span>Buka Menu Ingesti & Profil Data</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <CurationTable
                dataset={dataset}
                onUpdateColumn={handleUpdateColumn}
                onBatchUpdate={handleBatchUpdate}
                onProceedToStudio={() => setActiveTab('studio')}
                theme={theme}
                onUpdateTheme={handleUpdateTheme}
              />
            )}
          </div>
        )}

        {/* Tab 3: Theming Studio */}
        {activeTab === 'studio' && (
          <div>
            {!dataset ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                  <Palette className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-jakarta">
                  Belum Ada Data Survei
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Silakan unggah berkas CSV/XLSX survei Google Forms atau gunakan 1-Klik Data Demo BEM UNDIP untuk melihat dan menyesuaikan studio theming grafik.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('ingestion')}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue transition-colors shadow-md inline-flex items-center space-x-1.5"
                  >
                    <span>Buka Menu Ingesti & Profil Data</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <ThemingStudio
                dataset={dataset}
                theme={theme}
                onUpdateTheme={handleUpdateTheme}
                onUpdateColumn={handleUpdateColumn}
                onBatchUpdateColumns={handleBatchUpdate}
                onProceedToExport={() => setActiveTab('export')}
              />
            )}
          </div>
        )}

        {/* Tab 4: Batch Export & Audit Studio */}
        {activeTab === 'export' && (
          <ExportAuditSummary
            dataset={dataset}
            theme={theme}
            onNavigateToTab={setActiveTab}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <Footer theme={theme} />
    </div>
  );
};

export const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<LandingRoute />} />
    <Route path="/app" element={<Workspace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
