/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 4: High-Resolution Batch Export & Asset Packaging
 * Comprehensive Export Type Definitions
 */

import { ColumnProfile, SurveyDataset } from './survey';
import { DimensionalityMode, ThemeConfig } from './theming';

export interface ExportDimensions {
  baseWidth: number;
  baseHeight: number;
  pixelRatio: number;
  targetWidth: number;
  targetHeight: number;
}

export type ExportMode = 'card' | 'chart_only';

export interface RenderCardOptions {
  baseWidth?: number;
  baseHeight?: number;
  pixelRatio?: number;
  backgroundColor?: string;
  exportMode?: ExportMode;
  includeWatermark?: boolean;
  watermarkText?: string;
}

export interface ExportCardConfig {
  column: ColumnProfile;
  theme: ThemeConfig;
  dimensionality: DimensionalityMode; // Can override global
  pixelRatio: number; // 3 for ~300 DPI
}

export interface SingleChartExportResult {
  filename: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export interface BatchExportProgress {
  total: number;
  completed: number;
  currentTitle: string;
  isZipping: boolean;
  isComplete: boolean;
}

export interface BatchZipChartItem {
  filename: string;
  data: Blob | Uint8Array | ArrayBuffer | string | any;
}

export interface BatchExportOptions {
  dataset: SurveyDataset;
  theme: ThemeConfig;
  cardOverrides?: Record<string, DimensionalityMode | 'inherit'>;
  pixelRatio?: number;
  folderName?: string | null; // e.g. 'charts' (default) or null
  autoDownload?: boolean; // default true in browser
  onProgress?: (progress: BatchExportProgress) => void;
}

export interface BatchExportResult {
  blob: Blob | any;
  filename: string;
  totalCharts: number;
  manifestContent: string;
}
