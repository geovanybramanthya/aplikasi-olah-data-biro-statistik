import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { SurveyDataset } from '../../types/survey';
import { parseCSVString } from '../../core/parser/csvParser';
import { parseExcelBuffer } from '../../core/parser/excelParser';

interface FileUploadZoneProps {
  onDatasetLoaded: (dataset: SurveyDataset) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onDatasetLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();

    try {
      if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        const dataset = await parseCSVString(text, fileName);
        onDatasetLoaded(dataset);
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const dataset = parseExcelBuffer(buffer, fileName);
        onDatasetLoaded(dataset);
      } else {
        throw new Error(
          'Format file tidak didukung. Harap unggah file spreadsheet Google Forms (.csv) atau Excel (.xlsx / .xls).'
        );
      }
    } catch (err) {
      console.error('File parsing error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses file survei. Pastikan file valid.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
          isDragging
            ? 'border-undip-blue bg-blue-50/60 scale-[1.005]'
            : 'border-slate-300 hover:border-undip-blue/70 bg-white hover:bg-slate-50/80 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isDragging
                ? 'bg-undip-blue text-white shadow-lg'
                : 'bg-slate-100 text-slate-500 group-hover:bg-undip-navy/10 group-hover:text-undip-navy'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-undip-blue" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {isLoading
                ? 'Sedang Memproses & Memprofil Data Survei...'
                : 'Tarik & Letakkan File Survei di Sini, atau Klik untuk Memilih'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Ekspor mentah Google Forms spreadsheet dalam format <span className="font-semibold text-slate-700">.csv</span> atau file Microsoft Excel <span className="font-semibold text-slate-700">.xlsx / .xls</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Excel (.xlsx, .xls)
            </div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
              <FileText className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Google Forms (.csv)
            </div>
            <div className="text-[11px] text-slate-400">
              Maksimal 15 MB • Header & PII Difilter Otomatis
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Gagal Memproses File</p>
            <p className="mt-0.5 text-red-600">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
