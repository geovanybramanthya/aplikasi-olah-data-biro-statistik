/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Feature 25: Official BEM UNDIP Institutional Watermark Footer
 */

import React from 'react';
import { ShieldCheck, BarChart2 } from 'lucide-react';

export interface WatermarkFooterProps {
  showWatermark?: boolean;
  watermarkText?: string;
  className?: string;
  fontFamily?: string;
}

export const WATERMARK_DEFAULT_TEXT = 'Biro Statistika BEM Universitas Diponegoro';

export const WatermarkFooter: React.FC<WatermarkFooterProps> = ({
  showWatermark = true,
  watermarkText = WATERMARK_DEFAULT_TEXT,
  className = '',
  fontFamily,
}) => {
  if (!showWatermark) {
    return null;
  }

  const effectiveText = watermarkText?.trim() || WATERMARK_DEFAULT_TEXT;

  return (
    <div
      className={`border-t border-slate-100/80 pt-3 mt-2 flex items-center justify-between text-xs text-slate-400 select-none ${className}`}
      style={{ fontFamily }}
    >
      {/* Left: Official Watermark Text & Emblem */}
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center p-0.5 border border-slate-200 overflow-hidden shadow-2xs">
          <img
            src="/logo-birstat-transparent.png"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="font-semibold text-slate-600 tracking-tight text-[11px]">
          {effectiveText}
        </span>
      </div>

      {/* Right: Institutional Trust Badge */}
      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span className="font-medium">Survei Terverifikasi BEM UNDIP 2026</span>
      </div>
    </div>
  );
};

export default WatermarkFooter;
