import React from 'react';
import { ShieldCheck, Heart, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-8 mt-12 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
              <img
                src="/logo-birstat-transparent.png"
                alt="Logo Biro Statistika BEM UNDIP"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                Biro Riset, Data, dan Statistika • BEM Universitas Diponegoro 2026
              </p>
              <p className="text-slate-500 text-[11px]">
                Platform Visualisasi dan Analisis Data Survei Mahasiswa untuk Publikasi Advokasi Kampus
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-md border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Zero Cloud Upload: Data Tetap di Perangkat Anda</span>
            </div>
            <div className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Pemrosesan Klien Lokal (PapaParse + SheetJS + Apache ECharts)</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© 2026 Badan Eksekutif Mahasiswa Universitas Diponegoro. Hak cipta dilindungi.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Dikembangkan dengan dedikasi untuk transparansi & advokasi civitas akademika UNDIP
          </p>
        </div>
      </div>
    </footer>
  );
};
