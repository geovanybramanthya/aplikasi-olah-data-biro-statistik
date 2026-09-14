/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Feature 21: Live Custom Palette Builder Modal with Strict Real-Time Validation
 */

import React, { useState, useMemo } from 'react';
import { ColorPalette } from '../../src/types/theming';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Palette,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export interface CustomPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPalette: ColorPalette;
  onApplyPalette: (palette: ColorPalette) => void;
}

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface ValidationResult {
  isValid: boolean;
  colors: string[];
  errors: string[];
}

/**
 * Pure validator function matching harness.cjs and paletteValidator.ts
 */
export function validatePaletteInput(input: string[] | string): ValidationResult {
  let tokens: string[] = [];
  if (Array.isArray(input)) {
    tokens = input.map((c) => String(c).trim());
  } else if (typeof input === 'string') {
    tokens = input
      .split(/[\s,;|\n\r]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }

  // Auto-prepend # if 3 or 6 hex digits
  const processed = tokens.map((c) =>
    /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(c) ? `#${c}` : c
  );

  const validColors: string[] = [];
  const errors: string[] = [];

  for (const token of processed) {
    if (HEX_COLOR_REGEX.test(token)) {
      validColors.push(token.toUpperCase());
    } else {
      errors.push(`Format hex tidak valid: '${token}'`);
    }
  }

  if (validColors.length < 5) {
    errors.push(
      `Minimal 5 kode hex warna valid diperlukan (saat ini: ${validColors.length}/5)`
    );
  }

  return {
    isValid: errors.length === 0,
    colors: validColors,
    errors,
  };
}

export const CustomPaletteModal: React.FC<CustomPaletteModalProps> = ({
  isOpen,
  onClose,
  initialPalette,
  onApplyPalette,
}) => {
  const [paletteName, setPaletteName] = useState(
    initialPalette.name || 'Palet Kustom Saya'
  );
  const [colorList, setColorList] = useState<string[]>(
    initialPalette.colors && initialPalette.colors.length >= 5
      ? initialPalette.colors
      : ['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2']
  );
  const [rawTextInput, setRawTextInput] = useState('');
  const [activeMode, setActiveMode] = useState<'visual' | 'text'>('visual');

  // Real-time validation computation
  const validation: ValidationResult = useMemo(() => {
    if (activeMode === 'text') {
      return validatePaletteInput(rawTextInput);
    }
    return validatePaletteInput(colorList);
  }, [activeMode, rawTextInput, colorList]);

  if (!isOpen) return null;

  const handleAddColor = () => {
    // Pick next complementary default or duplicate last
    const nextColor = '#2ECC71';
    setColorList([...colorList, nextColor]);
  };

  const handleRemoveColor = (index: number) => {
    if (colorList.length <= 1) return;
    setColorList(colorList.filter((_, i) => i !== index));
  };

  const handleUpdateColor = (index: number, newColor: string) => {
    const updated = [...colorList];
    updated[index] = newColor.toUpperCase();
    setColorList(updated);
  };

  const handleSwitchToText = () => {
    setRawTextInput(colorList.join(', '));
    setActiveMode('text');
  };

  const handleSwitchToVisual = () => {
    const res = validatePaletteInput(rawTextInput);
    if (res.colors.length > 0) {
      setColorList(res.colors);
    }
    setActiveMode('visual');
  };

  const handleResetStarter = (starterColors: string[]) => {
    setColorList(starterColors);
    setRawTextInput(starterColors.join(', '));
  };

  const handleApply = () => {
    if (!validation.isValid) return;

    const validatedPalette: ColorPalette = {
      id: 'custom',
      name: paletteName.trim() || 'Palet Kustom',
      colors: validation.colors,
      isCustom: true,
    };

    onApplyPalette(validatedPalette);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-jakarta">
                Pembuat Palet Warna Kustom
              </h3>
              <p className="text-xs text-slate-500">
                Tentukan minimal 5 kode warna hex untuk seluruh grafik infografis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Palette Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Palet Kustom
            </label>
            <input
              type="text"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              placeholder="Contoh: Palet Khusus Dies Natalis 2026"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-blue/20 focus:border-undip-blue"
            />
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex space-x-2">
              <button
                onClick={activeMode === 'text' ? handleSwitchToVisual : undefined}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeMode === 'visual'
                    ? 'bg-undip-navy text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pemilih Warna Visual
              </button>
              <button
                onClick={activeMode === 'visual' ? handleSwitchToText : undefined}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeMode === 'text'
                    ? 'bg-undip-navy text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Input Teks Hex
              </button>
            </div>

            {/* Validation Badge */}
            <div className="flex items-center space-x-1.5">
              {validation.isValid ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Valid ({validation.colors.length} Warna)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
                  Belum Memenuhi Syarat
                </span>
              )}
            </div>
          </div>

          {/* Mode 1: Visual Color Chips */}
          {activeMode === 'visual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colorList.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                  >
                    {/* Native color picker */}
                    <input
                      type="color"
                      value={color.startsWith('#') && color.length === 7 ? color : '#002D62'}
                      onChange={(e) => handleUpdateColor(idx, e.target.value)}
                      className="w-9 h-9 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                    />

                    {/* Hex Text Field */}
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handleUpdateColor(idx, e.target.value)}
                      placeholder="#002D62"
                      className="flex-1 text-xs font-mono font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-undip-blue"
                    />

                    {/* Delete button (minimum 1) */}
                    <button
                      onClick={() => handleRemoveColor(idx)}
                      disabled={colorList.length <= 1}
                      title="Hapus Warna"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddColor}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-undip-blue hover:text-undip-blue hover:bg-blue-50/50 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Warna Baru</span>
              </button>
            </div>
          )}

          {/* Mode 2: Delimited Text Input */}
          {activeMode === 'text' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ketik atau tempel kode hex (pisahkan dengan koma, spasi, atau baris baru):
              </label>
              <textarea
                rows={4}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                placeholder="#002D62, #D4AF37, #1E56A0, #F39C12, #4A90E2, #F9E79F"
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-blue/20 focus:border-undip-blue"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tanda pagar (<code>#</code>) akan otomatis ditambahkan jika hanya memasukkan 3 atau 6 digit hex.
              </p>
            </div>
          )}

          {/* Validation Feedback & Error Messages */}
          {validation.errors.length > 0 && (
            <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-xl space-y-1">
              <span className="text-xs font-bold text-red-800 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
                Perhatian:
              </span>
              <ul className="text-xs text-red-700 list-disc list-inside space-y-0.5 pl-1">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Live Preview Strip */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pratinjau Urutan Warna Grafik:
            </label>
            <div className="h-10 rounded-xl overflow-hidden flex shadow-inner border border-slate-200">
              {validation.colors.map((c, i) => (
                <div
                  key={i}
                  style={{ backgroundColor: c }}
                  className="flex-1 h-full transition-all group relative flex items-center justify-center text-[10px] font-mono font-bold text-white/90 drop-shadow-sm"
                  title={`Warna #${i + 1}: ${c}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 bg-slate-900/80 px-1 py-0.5 rounded text-[9px]">
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Starter Palettes Shortcuts */}
          <div>
            <span className="block text-xs font-semibold text-slate-600 mb-2">
              Inspirasi Palet Awal:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleResetStarter([
                    '#002D62',
                    '#D4AF37',
                    '#1E56A0',
                    '#F39C12',
                    '#4A90E2',
                  ])
                }
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                UNDIP Navy & Gold
              </button>
              <button
                type="button"
                onClick={() =>
                  handleResetStarter([
                    '#0E6251',
                    '#16A085',
                    '#2ECC71',
                    '#82E0AA',
                    '#117A65',
                  ])
                }
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Modern Emerald
              </button>
              <button
                type="button"
                onClick={() =>
                  handleResetStarter([
                    '#6C88C4',
                    '#C47D9B',
                    '#7BAE9D',
                    '#E8A87C',
                    '#E0C366',
                  ])
                }
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Executive Pastel
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            disabled={!validation.isValid}
            className="px-5 py-2 text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Terapkan Palet Kustom</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomPaletteModal;
