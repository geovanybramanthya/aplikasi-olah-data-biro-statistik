/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 4: High-Resolution Batch Export & Asset Packaging
 * Feature 29: High-Res Batch ZIP Packaging & Deliverables Generator
 */

import JSZip from 'jszip';
import { ColumnProfile, SurveyDataset } from '../../types/survey';
import { ThemeConfig, DimensionalityMode } from '../../types/theming';
import {
  BatchExportOptions,
  BatchExportProgress,
  BatchExportResult,
  BatchZipChartItem,
} from '../../types/export';
import {
  renderChartCardToBlob,
  renderCompositeCardToBuffer,
} from './canvasExporter';
import { WATERMARK_TEXT, resolveDimensionality } from '../theming/palettes';

export const AUDIT_MANIFEST_FILENAME = 'SURVEY_SUMMARY_AUDIT.txt';
export const DEFAULT_CHARTS_FOLDER = 'charts';

/**
 * Feature 28 & 29: Format chart filename inside ZIP archive
 * Pattern: charts/{01-99}_chart_{slug}.png
 */
export function formatBatchChartFilename(
  index: number,
  title: string,
  folder: string | null = DEFAULT_CHARTS_FOLDER
): string {
  const prefix = String(index).padStart(2, '0');
  const slug = (title || 'chart')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  const base = `${prefix}_chart_${slug || 'visual'}.png`;
  return folder ? `${folder}/${base}` : base;
}

/**
 * Generate sanitized ZIP download filename: <dataset_name>_BEM_UNDIP_Charts.zip
 */
export function generateZipArchiveFilename(datasetName?: string): string {
  const cleanName = (datasetName || 'Survey')
    .replace(/\.[^/.]+$/, '') // strip extension
    .replace(/[^a-zA-Z0-9_\-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${cleanName || 'Survey'}_BEM_UNDIP_Charts.zip`;
}

/**
 * Feature 29: Build itemized survey audit manifest matching specification
 */
export function buildExportManifest(
  columns: ColumnProfile[],
  theme: Partial<ThemeConfig> = {},
  datasetInfo?: { name?: string; rowCount?: number }
): string {
  const lines: string[] = [
    '=================================================================',
    '  BIRO STATISTIKA BEM UNIVERSITAS DIPONEGORO - AUDIT MANIFEST',
    '=================================================================',
    `Export Date   : ${new Date().toISOString()}`,
    ...(datasetInfo?.name ? [`Dataset Name  : ${datasetInfo.name}`] : []),
    ...(datasetInfo?.rowCount !== undefined ? [`Total Rows    : ${datasetInfo.rowCount}`] : []),
    `Typography    : ${theme?.fontFamily || 'Poppins'}`,
    `Active Palette: ${theme?.activePaletteId || 'undip_navy_gold'}`,
    `Watermark     : ${theme?.showWatermark ? 'Enabled' : 'Disabled'}`,
    `Watermark Text: "${theme?.watermarkText || WATERMARK_TEXT}"`,
    `Total Columns : ${columns.length}`,
    '-----------------------------------------------------------------',
    'Exported Charts:',
  ];

  let exportedIndex = 1;
  for (const col of columns) {
    if (!col.isExcluded) {
      const chartType = (col.selectedChart || 'chart').toUpperCase();
      const title = col.displayTitle || col.cleanName || 'Chart';
      const n = col.validResponses || 0;
      lines.push(
        `  ${String(exportedIndex).padStart(2, '0')}. [${chartType}] ${title} (N=${n})`
      );
      exportedIndex++;
    }
  }

  if (exportedIndex === 1) {
    lines.push('  (Tidak ada grafik visual yang diekspor)');
  }

  lines.push('=================================================================');
  return lines.join('\n');
}

/**
 * Low-Level ZIP packager conforming directly to E2E test harness
 * Returns Node Buffer in Node.js environment, or Blob in browser
 */
export async function packageBatchZip(
  charts: BatchZipChartItem[],
  manifestContent: string
): Promise<any> {
  const zip = new JSZip();
  zip.file(AUDIT_MANIFEST_FILENAME, manifestContent);

  for (const chart of charts) {
    zip.file(chart.filename, chart.data);
  }

  // Dual environment detection: Node.js Buffer for tests, Blob for browser
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    return await zip.generateAsync({ type: 'nodebuffer' });
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Trigger client-side browser file download from Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Feature 29: High-Level End-to-End Dataset Batch ZIP Export Orchestrator
 */
export async function exportDatasetToZip(
  options: BatchExportOptions
): Promise<BatchExportResult> {
  const {
    dataset,
    theme,
    cardOverrides = {},
    pixelRatio = 3,
    folderName = DEFAULT_CHARTS_FOLDER,
    autoDownload = true,
    onProgress,
  } = options;

  // Filter active visual columns
  const activeColumns = dataset.columns.filter(
    (c) => !c.isExcluded && c.selectedChart && c.selectedChart !== 'none'
  );
  const total = activeColumns.length;

  // Initialize progress
  onProgress?.({
    total,
    completed: 0,
    currentTitle: total > 0 ? (activeColumns[0].displayTitle || activeColumns[0].cleanName) : 'Mempersiapkan...',
    isZipping: false,
    isComplete: false,
  });

  const zip = new JSZip();
  const manifestContent = buildExportManifest(dataset.columns, theme, {
    name: dataset.name,
    rowCount: dataset.rowCount,
  });
  zip.file(AUDIT_MANIFEST_FILENAME, manifestContent);

  // Sequential rendering of active presentation cards
  for (let i = 0; i < total; i++) {
    const col = activeColumns[i];
    const currentTitle = col.displayTitle || col.cleanName;

    onProgress?.({
      total,
      completed: i,
      currentTitle,
      isZipping: false,
      isComplete: false,
    });

    const override = cardOverrides[col.id] || 'inherit';
    const effectiveDimensionality = resolveDimensionality(theme.globalDimensionality, override);

    const chartFilename = formatBatchChartFilename(i + 1, currentTitle, folderName);

    if (typeof document !== 'undefined') {
      const cardBlob = await renderChartCardToBlob({
        column: col,
        theme,
        dimensionality: effectiveDimensionality,
        pixelRatio,
      });
      zip.file(chartFilename, cardBlob);
    } else {
      const cardBuf = await renderCompositeCardToBuffer({
        column: col,
        theme,
        dimensionality: effectiveDimensionality,
        pixelRatio,
      });
      zip.file(chartFilename, cardBuf);
    }

    onProgress?.({
      total,
      completed: i + 1,
      currentTitle,
      isZipping: false,
      isComplete: false,
    });

    // Yield control to event loop for smooth UI rendering
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  // Zipping phase
  onProgress?.({
    total,
    completed: total,
    currentTitle: 'Mengompresi dan membundel berkas ZIP...',
    isZipping: true,
    isComplete: false,
  });

  let zipResult: any;
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    zipResult = await zip.generateAsync({ type: 'nodebuffer' });
  } else {
    zipResult = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  const downloadFilename = generateZipArchiveFilename(dataset.name);

  if (autoDownload && typeof window !== 'undefined') {
    triggerBlobDownload(zipResult, downloadFilename);
  }

  // Completion notification
  onProgress?.({
    total,
    completed: total,
    currentTitle: 'Selesai! Berkas ZIP berhasil diunduh.',
    isZipping: false,
    isComplete: true,
  });

  return {
    blob: zipResult,
    filename: downloadFilename,
    totalCharts: total,
    manifestContent,
  };
}

/**
 * Alias helper matching user specification
 */
export async function exportSurveyBatchZip(
  dataset: SurveyDataset,
  theme: ThemeConfig,
  onProgress?: (p: BatchExportProgress) => void
): Promise<BatchExportResult> {
  return exportDatasetToZip({
    dataset,
    theme,
    onProgress,
  });
}
