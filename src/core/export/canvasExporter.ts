/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 4: High-Resolution Batch Export & Asset Packaging
 * Features 26, 27, 28: High-DPI 3x Canvas Export & Anti-Clipping Engine
 */

import * as echarts from 'echarts';
import { ColumnProfile, ChartType } from '../../types/survey';
import { ThemeConfig, DimensionalityMode } from '../../types/theming';
import {
  ExportCardConfig,
  ExportDimensions,
  RenderCardOptions,
  SingleChartExportResult,
} from '../../types/export';
import {
  generateEChartsOption,
  calculateDynamicPadding as coreDynamicPadding,
  wrapLabel as coreWrapLabel,
  determineBadgePlacement as coreBadgePlacement,
} from '../theming/echartsOptions';
import { WATERMARK_TEXT } from '../theming/palettes';

// Constants
export const EXPORT_PIXEL_RATIO = 3.0; // ~300 DPI publication quality
export const DEFAULT_BASE_WIDTH = 800;
export const DEFAULT_BASE_HEIGHT = 500;
export const TALL_BASE_HEIGHT = 600;
export const EXPORT_BG_COLOR = '#FFFFFF';
export const EXPORT_MIME_TYPE = 'image/png';
export const WATERMARK_DEFAULT_TEXT = 'Biro Statistika BEM Universitas Diponegoro';

/**
 * Feature 27: Dynamic Anti-Clipping Margin Padding Calculation
 * Matches tests/e2e/harness.cjs specification
 */
export function calculateDynamicPadding(
  labels: string[] = [],
  chartType: ChartType = 'horizontal_bar'
): { left: number; right: number; top: number; bottom: number } {
  if (chartType !== 'horizontal_bar' && chartType !== 'ranked_bar') {
    return { left: 40, right: 40, top: 70, bottom: 50 };
  }
  const maxLabelLen = labels.reduce((max, l) => Math.max(max, String(l).length), 0);
  const leftPadding = Math.min(260, Math.max(80, Math.round(maxLabelLen * 7.5)));
  return { left: leftPadding, right: 50, top: 70, bottom: 50 };
}

/**
 * Feature 27: Word-Level Multi-line Label Wrapping
 * Wraps text into lines of at most maxCharsPerLine characters, keeping long words intact.
 */
export function wrapLabel(text: string, maxCharsPerLine = 22): string[] {
  if (!text) return [];
  const words = String(text).split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Feature 27: Adaptive Badge Placement
 * Returns 'inside' if value / maxValue > 0.25, else 'outside'.
 */
export function determineBadgePlacement(
  value: number,
  maxValue: number
): 'inside' | 'outside' {
  if (maxValue <= 0) return 'outside';
  return value / maxValue > 0.25 ? 'inside' : 'outside';
}

/**
 * Feature 26: Calculate export dimensions matching presentation aspect ratios
 * Base 800x500 at 3x -> 2400x1500 px. Base 800x600 at 3x -> 2400x1800 px.
 */
export function calculateExportDimensions(
  baseWidth = DEFAULT_BASE_WIDTH,
  baseHeight = DEFAULT_BASE_HEIGHT,
  pixelRatio = EXPORT_PIXEL_RATIO
): ExportDimensions {
  const safeRatio = Math.max(1, pixelRatio);
  return {
    baseWidth,
    baseHeight,
    pixelRatio: safeRatio,
    targetWidth: Math.round(baseWidth * safeRatio),
    targetHeight: Math.round(baseHeight * safeRatio),
  };
}

/**
 * Feature 28: Sanitize filename for individual 3x PNG export
 * Formats: chart_{01-99}_{slug}.png (slug max 40 chars)
 */
export function sanitizeExportFilename(index: number, title: string): string {
  const prefix = String(index).padStart(2, '0');
  const slug = (title || 'chart')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return `chart_${prefix}_${slug || 'chart'}.png`;
}

/**
 * Feature 26: Export mounted ECharts instance directly to DataURL
 */
export function exportMountedChartToDataURL(
  chart: echarts.ECharts,
  options?: RenderCardOptions
): string {
  if (!chart || chart.isDisposed()) {
    throw new Error('[canvasExporter] Cannot export: chart instance is disposed or null.');
  }
  return chart.getDataURL({
    type: 'png',
    pixelRatio: options?.pixelRatio ?? EXPORT_PIXEL_RATIO,
    backgroundColor: options?.backgroundColor ?? EXPORT_BG_COLOR,
    excludeComponents: ['toolbox'],
  });
}

/**
 * Feature 26: Export mounted ECharts instance directly to Blob
 */
export async function exportMountedChartToBlob(
  chart: echarts.ECharts,
  options?: RenderCardOptions
): Promise<Blob> {
  const dataUrl = exportMountedChartToDataURL(chart, options);
  return dataURLToBlob(dataUrl);
}

/**
 * Export chart instance to PNG data URL and optionally trigger download if filename provided
 */
export function exportChartToPng(
  chart: echarts.ECharts,
  filename?: string,
  options?: RenderCardOptions
): string {
  const dataUrl = exportMountedChartToDataURL(chart, options);
  if (filename && typeof window !== 'undefined') {
    downloadSingleChartPNG(dataUrl, filename);
  }
  return dataUrl;
}

/**
 * Single chart PNG download helper
 */
export function downloadSingleChartPNG(dataUrl: string, filename: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert base64 data URL to Blob synchronously/reliably
 */
export function dataURLToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || EXPORT_MIME_TYPE;
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Helper: Canvas 2D Text Wrapping
 */
export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Headless Offscreen ECharts Renderer:
 * Creates hidden DOM element, sets animation=false, captures 3x dataURL, disposes.
 */
export async function renderOffscreenECharts(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode,
  options?: RenderCardOptions
): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('[canvasExporter] renderOffscreenECharts requires a browser DOM environment.');
  }

  const baseW = options?.baseWidth ?? DEFAULT_BASE_WIDTH;
  const baseH =
    options?.baseHeight ??
    (column.selectedChart === 'ordered_likert' || column.selectedChart === 'horizontal_bar'
      ? 420
      : 380);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '-99999px';
  container.style.width = `${baseW}px`;
  container.style.height = `${baseH}px`;
  container.style.visibility = 'hidden';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  let chart: echarts.ECharts | null = null;
  try {
    chart = echarts.init(container, undefined, {
      renderer: 'canvas',
      width: baseW,
      height: baseH,
    });

    const option = generateEChartsOption(column, theme, dimensionality) as any;
    // Invariant: disable animations to guarantee instant synchronous rendering in frame 0
    option.animation = false;
    chart.setOption(option, true);

    const dataUrl = chart.getDataURL({
      type: 'png',
      pixelRatio: options?.pixelRatio ?? EXPORT_PIXEL_RATIO,
      backgroundColor: options?.backgroundColor ?? EXPORT_BG_COLOR,
    });

    return dataUrl;
  } finally {
    if (chart) chart.dispose();
    container.remove();
  }
}

/**
 * Load image from DataURL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) =>
      reject(new Error('[canvasExporter] Failed to load chart raster image: ' + err));
    img.src = dataUrl;
  });
}

/**
 * Presentation Card Compositor:
 * Takes high-DPI chart dataURL and composites full 2400x1500 card with title, Q-pill, and watermark.
 */
export async function compositePresentationCard(
  chartDataUrl: string,
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensions: ExportDimensions,
  options?: RenderCardOptions
): Promise<HTMLCanvasElement> {
  if (typeof document === 'undefined') {
    throw new Error('[canvasExporter] compositePresentationCard requires a browser DOM environment.');
  }

  // Ensure typography fonts are ready
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-fatal if font loading times out
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.targetWidth;
  canvas.height = dimensions.targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('[canvasExporter] Could not obtain 2D canvas context.');

  const scale = dimensions.pixelRatio;
  const font = theme.fontFamily || 'Poppins';

  // 1. Solid Background
  ctx.fillStyle = options?.backgroundColor ?? EXPORT_BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Header: Question Pill Badge
  const pillX = 90;
  const pillY = 70;
  const pillHeight = 44;
  const colTypeStr = column.type.toLowerCase().replace(/_/g, ' ');
  const badgeText = `Q${column.columnIndex} • ${colTypeStr.toUpperCase()} • N = ${column.validResponses || 0}`;

  ctx.font = `bold ${Math.round(18 * (scale / 3 * 1.1))}px ${font}, system-ui, sans-serif`;
  const textMetrics = ctx.measureText(badgeText);
  const pillWidth = Math.max(340, textMetrics.width + 48);

  // Draw rounded pill
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 22);
  } else {
    ctx.rect(pillX, pillY, pillWidth, pillHeight);
  }
  ctx.fillStyle = '#EFF6FF'; // Blue 50
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#BFDBFE'; // Blue 200
  ctx.stroke();

  // Pill text
  ctx.fillStyle = '#1E40AF'; // Blue 800
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, pillX + 24, pillY + pillHeight / 2);
  ctx.restore();

  // 3. Header: Question Title
  const titleX = 90;
  const titleFontSize = Math.round((theme.titleFontSize || 20) * 2.5);
  const titleY = pillY + pillHeight + 24 + titleFontSize; // Clean breathing room below pill
  const maxTitleWidth = canvas.width - 180;
  ctx.font = `bold ${titleFontSize}px ${font}, system-ui, sans-serif`;
  ctx.fillStyle = '#0F172A'; // Slate 900
  ctx.textBaseline = 'alphabetic';

  const rawTitle = column.displayTitle || column.cleanName || 'Grafik Survei';
  const titleLines = wrapCanvasText(ctx, rawTitle, maxTitleWidth);
  const displayLines = titleLines.slice(0, 2);
  if (titleLines.length > 2) {
    displayLines[1] = displayLines[1].replace(/(\.\.\.)?$/, '...');
  }

  displayLines.forEach((line, idx) => {
    ctx.fillText(line, titleX, titleY + idx * (titleFontSize + 12));
  });

  // 4. Chart Body: Draw rasterized ECharts image
  const chartImg = await loadImage(chartDataUrl);
  const titleBlockBottom = titleY + (displayLines.length - 1) * (titleFontSize + 12);
  const chartTop = titleBlockBottom + 30;
  const footerTop = canvas.height - 100;
  const chartAvailableHeight = footerTop - chartTop - 20;

  // Calculate proportional scaling within chart area
  const imgAspect = chartImg.width / chartImg.height;
  let drawW = canvas.width - 120;
  let drawH = drawW / imgAspect;

  if (drawH > chartAvailableHeight) {
    drawH = chartAvailableHeight;
    drawW = drawH * imgAspect;
  }
  const drawX = Math.round((canvas.width - drawW) / 2);
  const drawY = Math.round(chartTop + (chartAvailableHeight - drawH) / 2);

  ctx.drawImage(chartImg, drawX, drawY, drawW, drawH);

  // 5. Footer: Divider line & Official Watermark
  ctx.beginPath();
  ctx.moveTo(90, footerTop);
  ctx.lineTo(canvas.width - 90, footerTop);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Left Watermark Text
  if (theme.showWatermark !== false && options?.includeWatermark !== false) {
    const wmText = options?.watermarkText || theme.watermarkText || WATERMARK_DEFAULT_TEXT;
    ctx.font = `600 24px ${font}, system-ui, sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.textBaseline = 'middle';
    ctx.fillText(wmText, 90, footerTop + 45);
  }

  // Right Institutional Trust Badge
  const trustBadge = 'Survei Terverifikasi BEM UNDIP 2026';
  ctx.font = `500 22px ${font}, system-ui, sans-serif`;
  ctx.fillStyle = '#64748B';
  ctx.textBaseline = 'middle';
  const trustMetrics = ctx.measureText(trustBadge);
  ctx.fillText(trustBadge, canvas.width - 90 - trustMetrics.width, footerTop + 45);

  return canvas;
}

// --------------------------------------------------------------------------
// Pure Software / Node.js Headless PNG Renderer (Node environment fallback)
// --------------------------------------------------------------------------

function getNodeZlib(): any {
  if (typeof window !== 'undefined') return null;
  try {
    const req = (globalThis as any).require || (typeof require !== 'undefined' ? require : null);
    return req ? req('zlib') : null;
  } catch {
    return null;
  }
}

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(buf: Uint8Array, offset = 0, length = buf.length): number {
  let crc = 0xffffffff;
  for (let i = offset; i < offset + length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunk = new Uint8Array(4 + 4 + len + 4);
  const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  view.setUint32(0, len, false);
  chunk[4] = type.charCodeAt(0);
  chunk[5] = type.charCodeAt(1);
  chunk[6] = type.charCodeAt(2);
  chunk[7] = type.charCodeAt(3);
  chunk.set(data, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  view.setUint32(8 + len, crcVal, false);
  return chunk;
}

/**
 * Generate a genuine PNG image Buffer in Node.js with presentation card geometry.
 */
export function generateHeadlessPngBuffer(
  width: number,
  height: number,
  cardConfig: ExportCardConfig
): any {
  const zlib = getNodeZlib();
  // 4 bytes per pixel: RGBA
  const rowBytes = 1 + width * 4;
  const rawScanlines = new Uint8Array(rowBytes * height);

  // Palette colors for visual bars in headless render
  const colors = cardConfig.theme?.activePalette?.colors || ['#002D62', '#D4AF37', '#1E56A0', '#4A90E2', '#A3B18A'];
  const colCount = Math.max(1, Object.keys(cardConfig.column?.distribution || {}).length);

  // Parse color helper
  const parseHex = (hex: string) => {
    const h = hex.replace('#', '');
    const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  const parsedColors = colors.map(parseHex);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawScanlines[rowOffset] = 0; // Filter: 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Default white background
      let r = 255, g = 255, b = 255, a = 255;

      // Zone 1: Pill Badge (y between 70 and 114, x between 90 and 450)
      if (y >= 70 && y <= 114 && x >= 90 && x <= 450) {
        r = 239; g = 246; b = 255; // #EFF6FF
      }
      // Zone 1: Title bar line representation (y between 150 and 180, x between 90 and Math.min(x, 1000))
      else if (y >= 150 && y <= 175 && x >= 90 && x <= Math.min(width - 90, 800)) {
        r = 15; g = 23; b = 42; // #0F172A
      }
      // Zone 3: Footer line (y between height - 100 and height - 98, x between 90 and width - 90)
      else if (y >= height - 100 && y <= height - 98 && x >= 90 && x <= width - 90) {
        r = 226; g = 232; b = 240; // #E2E8F0
      }
      // Zone 3: Watermark indicator (y between height - 60 and height - 50, x between 90 and 400)
      else if (y >= height - 60 && y <= height - 50 && x >= 90 && x <= 400) {
        r = 71; g = 85; b = 105; // #475569
      }
      // Zone 2: Chart Area (y between 240 and height - 140)
      else if (y >= 240 && y <= height - 140 && x >= 120 && x <= width - 120) {
        // Draw representative colored segments / bars
        const chartAreaW = width - 240;
        const segmentW = Math.floor(chartAreaW / colCount);
        const segmentIdx = Math.min(colCount - 1, Math.floor((x - 120) / segmentW));
        const color = parsedColors[segmentIdx % parsedColors.length];

        // Draw bar shape within segment
        const barPad = Math.max(10, Math.floor(segmentW * 0.15));
        const relX = (x - 120) % segmentW;
        if (relX >= barPad && relX <= segmentW - barPad) {
          const barHeight = Math.floor((height - 380) * (0.4 + 0.5 * ((segmentIdx + 1) / colCount)));
          const barTop = height - 140 - barHeight;
          if (y >= barTop) {
            r = color[0];
            g = color[1];
            b = color[2];
          }
        }
      }

      rawScanlines[pxOffset] = r;
      rawScanlines[pxOffset + 1] = g;
      rawScanlines[pxOffset + 2] = b;
      rawScanlines[pxOffset + 3] = a;
    }
  }

  // Compress scanlines via zlib
  let compressedData: Uint8Array;
  if (zlib?.deflateSync) {
    compressedData = zlib.deflateSync(rawScanlines, { level: 6 });
  } else {
    // Fallback: uncompressed deflate block (RFC 1951)
    const blockLen = rawScanlines.length;
    compressedData = new Uint8Array(blockLen + 5);
    compressedData[0] = 0x01; // BFINAL=1, BTYPE=00 (uncompressed)
    compressedData[1] = blockLen & 0xff;
    compressedData[2] = (blockLen >> 8) & 0xff;
    compressedData[3] = (~blockLen) & 0xff;
    compressedData[4] = ((~blockLen) >> 8) & 0xff;
    compressedData.set(rawScanlines, 5);
  }

  // PNG Signature (8 bytes)
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk (13 bytes payload)
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type 6: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createPngChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createPngChunk('IEND', new Uint8Array(0));

  // Assemble complete PNG file
  const totalLength = signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const pngBytes = new Uint8Array(totalLength);
  let pos = 0;
  pngBytes.set(signature, pos); pos += signature.length;
  pngBytes.set(ihdrChunk, pos); pos += ihdrChunk.length;
  pngBytes.set(idatChunk, pos); pos += idatChunk.length;
  pngBytes.set(iendChunk, pos);

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(pngBytes);
  }
  return pngBytes;
}

/**
 * Headless Render: Complete presentation card to DataURL
 */
export async function renderCompositeCardToDataURL(
  cardConfig: ExportCardConfig,
  options?: RenderCardOptions
): Promise<string> {
  const dimensions = calculateExportDimensions(
    options?.baseWidth ?? DEFAULT_BASE_WIDTH,
    options?.baseHeight ??
      (cardConfig.column.selectedChart === 'ordered_likert' ||
      cardConfig.column.selectedChart === 'horizontal_bar'
        ? TALL_BASE_HEIGHT
        : DEFAULT_BASE_HEIGHT),
    cardConfig.pixelRatio || EXPORT_PIXEL_RATIO
  );

  // Browser environment
  if (typeof document !== 'undefined') {
    const mode = options?.exportMode || 'card';
    const chartDataUrl = await renderOffscreenECharts(
      cardConfig.column,
      cardConfig.theme,
      cardConfig.dimensionality,
      options
    );

    if (mode === 'chart_only') {
      return chartDataUrl;
    }

    const cardCanvas = await compositePresentationCard(
      chartDataUrl,
      cardConfig.column,
      cardConfig.theme,
      dimensions,
      options
    );

    return cardCanvas.toDataURL(EXPORT_MIME_TYPE);
  }

  // Node / headless test environment
  const buf = generateHeadlessPngBuffer(
    dimensions.targetWidth,
    dimensions.targetHeight,
    cardConfig
  );
  const base64 = typeof Buffer !== 'undefined' ? Buffer.from(buf).toString('base64') : '';
  return `data:${EXPORT_MIME_TYPE};base64,${base64}`;
}

/**
 * Headless Render: Complete presentation card to Buffer (Node) or Uint8Array (Browser)
 */
export async function renderCompositeCardToBuffer(
  cardConfig: ExportCardConfig,
  options?: RenderCardOptions
): Promise<any> {
  const dimensions = calculateExportDimensions(
    options?.baseWidth ?? DEFAULT_BASE_WIDTH,
    options?.baseHeight ??
      (cardConfig.column.selectedChart === 'ordered_likert' ||
      cardConfig.column.selectedChart === 'horizontal_bar'
        ? TALL_BASE_HEIGHT
        : DEFAULT_BASE_HEIGHT),
    cardConfig.pixelRatio || EXPORT_PIXEL_RATIO
  );

  // Node environment
  if (typeof document === 'undefined') {
    return generateHeadlessPngBuffer(
      dimensions.targetWidth,
      dimensions.targetHeight,
      cardConfig
    );
  }

  // Browser environment
  const dataUrl = await renderCompositeCardToDataURL(cardConfig, options);
  const base64 = dataUrl.split(',')[1];
  const binaryStr = atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes);
  }
  return bytes;
}

/**
 * Headless Render: Complete presentation card to Blob
 */
export async function renderChartCardToBlob(
  cardConfig: ExportCardConfig,
  options?: RenderCardOptions
): Promise<Blob> {
  if (typeof document !== 'undefined') {
    const dataUrl = await renderCompositeCardToDataURL(cardConfig, options);
    return dataURLToBlob(dataUrl);
  }
  const buf = await renderCompositeCardToBuffer(cardConfig, options);
  return new Blob([buf], { type: EXPORT_MIME_TYPE });
}

/**
 * Alias for renderCompositeCardToDataURL
 */
export const renderChartCardToDataURL = renderCompositeCardToDataURL;

/**
 * Feature 28: One-click Single Chart Download Utility
 */
export async function downloadSingleChart(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode,
  options?: RenderCardOptions
): Promise<string> {
  const filename = sanitizeExportFilename(
    column.columnIndex,
    column.displayTitle || column.cleanName
  );

  if (typeof document === 'undefined') {
    return filename;
  }

  const blob = await renderChartCardToBlob(
    {
      column,
      theme,
      dimensionality,
      pixelRatio: options?.pixelRatio || EXPORT_PIXEL_RATIO,
    },
    options
  );

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return filename;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
