import React from 'react';
import { BarChart3, ShieldCheck, Database, RefreshCw, Layers } from 'lucide-react';
import { SurveyDataset } from '../../types/survey';
import { ThemeConfig } from '../../types/theming';

interface HeaderProps {
  dataset: SurveyDataset | null;
  onReset?: () => void;
  theme?: ThemeConfig;
}

export const Header: React.FC<HeaderProps> = ({ dataset, onReset, theme }) => {
  const piiCount = dataset?.columns.filter((c) => c.isPII).length ?? 0;
  const validColumnsCount = dataset?.columns.filter((c) => !c.isPII).length ?? 0;
  const effectiveLogo = theme?.customLogoUrl || '/logo-birstat-transparent.png';
  const effectiveOrgName = theme?.organizationName || 'BEM UNDIP';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border-2 border-undip-gold/40 overflow-hidden">
              <img
                src={effectiveLogo}
                alt={`Logo Biro Statistik ${effectiveOrgName}`}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-undip-gold bg-undip-navy/10 px-2.5 py-0.5 rounded-full border border-undip-gold/30">
                  Biro Statistik {effectiveOrgName}
                </span>
                <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  100% Client-Side Privacy
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight sm:text-xl font-jakarta">
                Survey Analytics & Visualization Platform
              </h1>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center space-x-3">
            {dataset ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-600">Responden:</span>
                  <span className="font-semibold text-slate-900">{dataset.rowCount.toLocaleString()}</span>
                  <span className="text-slate-300">|</span>
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-600">Grafik:</span>
                  <span className="font-semibold text-blue-700">{validColumnsCount}</span>
                  {piiCount > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">PII Terfilter:</span>
                      <span className="font-semibold text-amber-600">{piiCount}</span>
                    </>
                  )}
                </div>

                {onReset && (
                  <button
                    onClick={onReset}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                    title="Ganti atau Unggah Survei Baru"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    Ganti Survei
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 hidden sm:block">
                Mendukung <span className="font-medium text-slate-700">Google Forms CSV & Excel (.xlsx)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
