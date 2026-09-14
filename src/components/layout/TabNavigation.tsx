import React from 'react';
import { UploadCloud, CheckSquare, Palette, Download, Sparkles } from 'lucide-react';

export type ActiveTab = 'ingestion' | 'curation' | 'studio' | 'export';

interface TabNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasDataset: boolean;
  totalChartsCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  hasDataset,
  totalChartsCount,
}) => {
  const tabs = [
    {
      id: 'ingestion' as ActiveTab,
      label: '1. Ingest & Profil Data',
      icon: UploadCloud,
      badge: hasDataset ? 'Tersedia' : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'curation' as ActiveTab,
      label: '2. Rekomendasi & Kurasi',
      icon: CheckSquare,
      badge: hasDataset ? `${totalChartsCount} Grafik` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'studio' as ActiveTab,
      label: '3. Studio Visual & Tema',
      icon: Palette,
      badge: '2D & 3D',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'export' as ActiveTab,
      label: '4. Ekspor High-Res Batch',
      icon: Download,
      badge: '~300 DPI',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto py-2.5" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = !hasDataset && tab.id !== 'ingestion';

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onTabChange(tab.id)}
                disabled={isDisabled}
                className={`group inline-flex items-center py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-undip-navy text-white shadow-sm'
                    : isDisabled
                    ? 'text-slate-400 cursor-not-allowed opacity-60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`mr-2 h-4 w-4 ${
                    isActive
                      ? 'text-undip-cream'
                      : isDisabled
                      ? 'text-slate-300'
                      : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
