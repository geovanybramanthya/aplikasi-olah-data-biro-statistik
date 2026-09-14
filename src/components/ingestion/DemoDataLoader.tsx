import React from 'react';
import { Sparkles, Users, FileQuestion, ArrowRight, ShieldAlert, BookOpen } from 'lucide-react';
import { SurveyDataset } from '../../types/survey';
import {
  DEMO_SURVEYS_META,
  loadDemoSurvey1,
  loadDemoSurvey2,
  DemoSurveyMeta,
} from '../../services/demoDataService';

interface DemoDataLoaderProps {
  onDatasetLoaded: (dataset: SurveyDataset) => void;
  activeDatasetName?: string;
}

export const DemoDataLoader: React.FC<DemoDataLoaderProps> = ({
  onDatasetLoaded,
  activeDatasetName,
}) => {
  const handleLoadDemo = (id: string) => {
    if (id === 'demo_2') {
      const ds = loadDemoSurvey2();
      onDatasetLoaded(ds);
    } else {
      const ds = loadDemoSurvey1();
      onDatasetLoaded(ds);
    }
  };

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-undip-gold" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-jakarta">
              Dataset Demo BEM UNDIP Terintegrasi (1-Klik Offline)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Eksplorasi langsung menggunakan data riil survei internal & advokasi kampus tanpa perlu mengunggah file
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_SURVEYS_META.map((demo: DemoSurveyMeta) => {
          const isSample1 = demo.id === 'demo_1';
          const isActive =
            activeDatasetName &&
            (activeDatasetName.toLowerCase().includes('upgrading')
              ? isSample1
              : !isSample1);

          return (
            <div
              key={demo.id}
              className={`bg-white rounded-xl p-5 border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-undip-navy ring-2 ring-undip-navy/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-undip-blue bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                    {demo.category}
                  </span>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {demo.respondentsCount}
                    </span>
                    <span className="flex items-center">
                      <FileQuestion className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {demo.questionsCount}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1.5 font-jakarta">
                  {demo.title}
                </h4>
                <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                  {demo.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {demo.highlightFeatures.map((feat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleLoadDemo(demo.id)}
                className={`w-full py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                    : 'bg-slate-900 text-white hover:bg-undip-navy shadow-sm'
                }`}
              >
                <span>{isActive ? 'Dataset Aktif Dipilih' : `Muat ${demo.title.split(' ')[0]} Demo`}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
