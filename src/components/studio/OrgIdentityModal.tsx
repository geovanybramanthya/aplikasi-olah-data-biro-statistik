/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Component: OrgIdentityModal
 * Allows customization of BEM / Faculty logo, organization name, and dynamic watermark
 */

import React, { useState, useRef } from 'react';
import { ThemeConfig } from '../../types/theming';
import {
  DEFAULT_LOGO_URL,
  DEFAULT_ORG_NAME,
  DEFAULT_BADGE_TEXT,
  WATERMARK_TEXT,
} from '../../core/theming/palettes';
import {
  saveOrgIdentity,
  clearSavedOrgIdentity,
} from '../../services/identityStorage';
import {
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export interface OrgIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  onUpdateTheme: (updates: Partial<ThemeConfig>) => void;
}

interface FacultyPreset {
  id: string;
  name: string;
  shortBadge: string;
  fullName: string;
}

const FACULTY_PRESETS: FacultyPreset[] = [
  {
    id: 'undip',
    name: 'BEM Universitas Diponegoro (Pusat)',
    shortBadge: 'BEM UNDIP',
    fullName: 'BEM Universitas Diponegoro',
  },
  {
    id: 'ft',
    name: 'Fakultas Teknik (FT)',
    shortBadge: 'BEM FT UNDIP',
    fullName: 'BEM Fakultas Teknik UNDIP',
  },
  {
    id: 'fsm',
    name: 'Fakultas Sains dan Matematika (FSM)',
    shortBadge: 'BEM FSM UNDIP',
    fullName: 'BEM Fakultas Sains dan Matematika UNDIP',
  },
  {
    id: 'feb',
    name: 'Fakultas Ekonomika dan Bisnis (FEB)',
    shortBadge: 'BEM FEB UNDIP',
    fullName: 'BEM Fakultas Ekonomika dan Bisnis UNDIP',
  },
  {
    id: 'fk',
    name: 'Fakultas Kedokteran (FK)',
    shortBadge: 'BEM FK UNDIP',
    fullName: 'BEM Fakultas Kedokteran UNDIP',
  },
  {
    id: 'fisip',
    name: 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)',
    shortBadge: 'BEM FISIP UNDIP',
    fullName: 'BEM Fakultas Ilmu Sosial dan Ilmu Politik UNDIP',
  },
  {
    id: 'fh',
    name: 'Fakultas Hukum (FH)',
    shortBadge: 'BEM FH UNDIP',
    fullName: 'BEM Fakultas Hukum UNDIP',
  },
  {
    id: 'fib',
    name: 'Fakultas Ilmu Budaya (FIB)',
    shortBadge: 'BEM FIB UNDIP',
    fullName: 'BEM Fakultas Ilmu Budaya UNDIP',
  },
  {
    id: 'fpik',
    name: 'Fakultas Perikanan dan Ilmu Kelautan (FPIK)',
    shortBadge: 'BEM FPIK UNDIP',
    fullName: 'BEM Fakultas Perikanan dan Ilmu Kelautan UNDIP',
  },
  {
    id: 'fpp',
    name: 'Fakultas Peternakan dan Pertanian (FPP)',
    shortBadge: 'BEM FPP UNDIP',
    fullName: 'BEM Fakultas Peternakan dan Pertanian UNDIP',
  },
  {
    id: 'fkm',
    name: 'Fakultas Kesehatan Masyarakat (FKM)',
    shortBadge: 'BEM FKM UNDIP',
    fullName: 'BEM Fakultas Kesehatan Masyarakat UNDIP',
  },
  {
    id: 'fpsi',
    name: 'Fakultas Psikologi (FPsi)',
    shortBadge: 'BEM FPsi UNDIP',
    fullName: 'BEM Fakultas Psikologi UNDIP',
  },
  {
    id: 'sv',
    name: 'Sekolah Vokasi (SV)',
    shortBadge: 'BEM SV UNDIP',
    fullName: 'BEM Sekolah Vokasi UNDIP',
  },
  {
    id: 'sps',
    name: 'Sekolah Pascasarjana (SPs)',
    shortBadge: 'BEM SPs UNDIP',
    fullName: 'BEM Sekolah Pascasarjana UNDIP',
  },
];

export const OrgIdentityModal: React.FC<OrgIdentityModalProps> = ({
  isOpen,
  onClose,
  theme,
  onUpdateTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orgName, setOrgName] = useState(
    theme.organizationName || DEFAULT_ORG_NAME
  );
  const [customLogo, setCustomLogo] = useState<string | null>(
    theme.customLogoUrl || null
  );
  const [watermarkText, setWatermarkText] = useState(
    theme.watermarkText || WATERMARK_TEXT
  );
  const [badgeText, setBadgeText] = useState(
    theme.verifiedBadgeText || DEFAULT_BADGE_TEXT
  );
  const [autoSync, setAutoSync] = useState<boolean>(
    Boolean(
      !theme.watermarkText ||
        theme.watermarkText === WATERMARK_TEXT ||
        (theme.organizationName && theme.watermarkText === `Biro Statistik ${theme.organizationName}`)
    )
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Automatically update watermark & badge when orgName changes if autoSync is active
  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    if (autoSync) {
      const trimmed = val.trim();
      if (!trimmed || trimmed === DEFAULT_ORG_NAME) {
        setWatermarkText(WATERMARK_TEXT);
        setBadgeText(DEFAULT_BADGE_TEXT);
      } else {
        const wmPrefix = trimmed.toLowerCase().startsWith('biro')
          ? trimmed
          : `Biro Statistik ${trimmed}`;
        setWatermarkText(wmPrefix);
        setBadgeText(`Survei Terverifikasi ${trimmed} 2026`);
      }
    }
  };

  const handleWatermarkChange = (val: string) => {
    setWatermarkText(val);
    setAutoSync(false);
  };

  const handleBadgeChange = (val: string) => {
    setBadgeText(val);
    setAutoSync(false);
  };

  // Handle preset selection
  const handleSelectPreset = (preset: FacultyPreset) => {
    setOrgName(preset.fullName);
    if (preset.id === 'undip') {
      setWatermarkText('Biro Statistik BEM Universitas Diponegoro');
      setBadgeText('Survei Terverifikasi BEM UNDIP 2026');
    } else {
      setWatermarkText(`Biro Statistik ${preset.fullName}`);
      setBadgeText(`Survei Terverifikasi ${preset.shortBadge} 2026`);
    }
    setAutoSync(true);
  };

  // Handle Logo Upload via FileReader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file logo terlalu besar. Maksimal 5 MB.');
      return;
    }

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Berkas harus berupa file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomLogo(dataUrl);
        setSuccessNotice('Logo kustom berhasil dimuat!');
        setTimeout(() => setSuccessNotice(null), 2500);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca file logo. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  // Remove custom logo and revert to official default
  const handleRemoveLogo = () => {
    setCustomLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save changes to state and localStorage
  const handleSave = () => {
    const trimmedOrg = orgName.trim() || DEFAULT_ORG_NAME;
    const trimmedWm = watermarkText.trim() || `Biro Statistik ${trimmedOrg}`;
    const trimmedBadge = badgeText.trim() || 'Survei Terverifikasi 2026';

    const updates = {
      organizationName: trimmedOrg,
      customLogoUrl: customLogo,
      watermarkText: trimmedWm,
      verifiedBadgeText: trimmedBadge,
    };

    onUpdateTheme(updates);
    saveOrgIdentity(updates);

    setSuccessNotice('Pengaturan identitas & logo berhasil disimpan!');
    setTimeout(() => {
      setSuccessNotice(null);
      onClose();
    }, 800);
  };

  // Reset all to default official Biro Statistik BEM UNDIP
  const handleResetToDefault = () => {
    setOrgName(DEFAULT_ORG_NAME);
    setCustomLogo(null);
    setWatermarkText(WATERMARK_TEXT);
    setBadgeText(DEFAULT_BADGE_TEXT);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const defaultUpdates = {
      organizationName: DEFAULT_ORG_NAME,
      facultyName: '',
      customLogoUrl: null,
      watermarkText: WATERMARK_TEXT,
      verifiedBadgeText: DEFAULT_BADGE_TEXT,
    };

    onUpdateTheme(defaultUpdates);
    clearSavedOrgIdentity();

    setSuccessNotice('Identitas dikembalikan ke default Biro Statistik BEM UNDIP.');
    setTimeout(() => setSuccessNotice(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-undip-navy to-undip-blue p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-undip-gold/20 text-undip-gold border border-undip-gold/30 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-jakarta">
                Identitas & Logo BEM Fakultas
              </h3>
              <p className="text-xs text-slate-200">
                Sesuaikan logo dan watermark resmi untuk Biro Statistik BEM fakultas Anda
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* 1. Logo Management Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 font-jakarta flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-undip-blue" />
                  <span>Logo Organisasi / BEM</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Secara default menggunakan logo resmi Biro Statistik. Unggah logo fakultas Anda untuk kustomisasi hasil unduhan.
                </p>
              </div>

              {customLogo ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Logo Kustom
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-undip-blue border border-blue-200">
                  Logo Default
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Logo Preview Container */}
              <div className="w-24 h-24 rounded-2xl bg-white p-2 border-2 border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative group">
                <img
                  src={customLogo || DEFAULT_LOGO_URL}
                  alt="Logo Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-undip-navy text-white hover:bg-undip-blue rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-undip-gold" />
                    <span>Unggah Logo BEM</span>
                  </button>

                  {customLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer border border-slate-200 hover:border-red-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Gunakan Logo Default</span>
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400">
                  Format yang didukung: PNG (latar transparan disarankan), JPG, SVG, WebP. Maksimal 5 MB.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Quick Preset Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
              <span>Pilihan Cepat Fakultas UNDIP</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
              {FACULTY_PRESETS.map((preset) => {
                const isSelected = orgName === preset.fullName;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-undip-navy text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Organization Identity Fields */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Organisasi / BEM
                </label>
                <label className="flex items-center space-x-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setAutoSync(next);
                      if (next) {
                        const trimmed = orgName.trim();
                        if (!trimmed || trimmed === DEFAULT_ORG_NAME) {
                          setWatermarkText(WATERMARK_TEXT);
                          setBadgeText(DEFAULT_BADGE_TEXT);
                        } else {
                          const wmPrefix = trimmed.toLowerCase().startsWith('biro')
                            ? trimmed
                            : `Biro Statistik ${trimmed}`;
                          setWatermarkText(wmPrefix);
                          setBadgeText(`Survei Terverifikasi ${trimmed} 2026`);
                        }
                      }
                    }}
                    className="rounded text-undip-navy focus:ring-undip-navy/30 h-3.5 w-3.5"
                  />
                  <span>Sinkronkan watermark otomatis</span>
                </label>
              </div>
              <input
                type="text"
                value={orgName}
                onChange={(e) => handleOrgNameChange(e.target.value)}
                placeholder="Contoh: BEM Fakultas Teknik UNDIP atau BEM FSM UNDIP"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-navy/20 focus:border-undip-navy transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ketik nama BEM atau Biro Statistik fakultas Anda di sini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teks Watermark Resmi (Footer Kartu & Unduhan)
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => handleWatermarkChange(e.target.value)}
                placeholder="Contoh: Biro Statistik BEM Fakultas Teknik UNDIP"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-navy/20 focus:border-undip-navy transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Teks ini akan tertera di pojok kiri bawah setiap kartu grafik dan berkas ekspor PNG ~300 DPI.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lencana Verifikasi (Pojok Kanan Footer)
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => handleBadgeChange(e.target.value)}
                placeholder="Contoh: Survei Terverifikasi BEM FT UNDIP 2026"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-undip-navy/20 focus:border-undip-navy transition-all"
              />
            </div>
          </div>

          {/* 4. Live Watermark Footer Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pratinjau Footer Watermark Hasil Unduhan
              </span>
              <span className="text-[10px] text-slate-400">Tampilan Langsung di Hasil PNG</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-sm">
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-400 select-none">
                {/* Left: Emblem & Text */}
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5 border border-slate-200 overflow-hidden shadow-2xs">
                    <img
                      src={customLogo || DEFAULT_LOGO_URL}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-semibold text-slate-700 tracking-tight text-xs">
                    {watermarkText || 'Biro Statistik BEM Universitas Diponegoro'}
                  </span>
                </div>

                {/* Right: Trust Badge */}
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium">
                    {badgeText || 'Survei Terverifikasi BEM UNDIP 2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Identitas Default</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-undip-navy hover:bg-undip-blue transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-undip-gold" />
              <span>Simpan Identitas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgIdentityModal;
