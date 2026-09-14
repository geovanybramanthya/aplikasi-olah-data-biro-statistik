# Milestone 4 Explorer 1 Handoff Report: High-Resolution 3x Canvas Export & Anti-Clipping Engine

**Agent**: `explorer_m4_1`  
**Milestone**: Milestone 4 (High-Resolution Batch Export & Asset Packaging)  
**Features Covered**: Feature 26 (High-Res 3x Canvas Export), Feature 27 (Anti-Clipping Geometry & Padding), Feature 28 (Single Chart PNG Export)  
**Target Output File**: `src/core/export/canvasExporter.ts` and enhanced `src/types/export.ts`  
**Date**: 2026-09-14  

---

## 1. Observation

### 1.1 Existing Codebase & File Paths
- **`PROJECT.md`** (Lines 42–46, 223–225):
  ```
  | 26 | High-Resolution 3x Canvas Export | Native ~300 DPI rasterization (2400x1500 px) via ECharts getDataURL without clipping | M4 | R4, AC |
  | 27 | Anti-Clipping Geometry & Padding | Dynamic margin safety clearance and auto-wrapping for long Indonesian category labels | M4 | R4, AC |
  | 28 | Single Chart PNG Export | One-click 3x PNG download for any individual chart card | M4 | R4 |
  | 29 | High-Res Batch ZIP Packaging | In-memory sequential JSZip batch bundling of all charts + SURVEY_SUMMARY_AUDIT.txt | M4 | R4, AC |
  ```
  Code layout assigns `src/core/export/canvasExporter.ts` and `src/core/export/zipPackager.ts`.

- **`src/types/export.ts`** (Lines 1–18):
  ```typescript
  import { ColumnProfile } from './survey';
  import { DimensionalityMode, ThemeConfig } from './theming';

  export interface ExportCardConfig {
    column: ColumnProfile;
    theme: ThemeConfig;
    dimensionality: DimensionalityMode; // Can override global
    pixelRatio: number; // 3 for ~300 DPI
  }

  export interface BatchExportProgress {
    total: number;
    completed: number;
    currentTitle: string;
    isZipping: boolean;
    isComplete: boolean;
  }
  ```

- **`src/core/theming/echartsOptions.ts`** (Lines 15–52):
  Already defines and exports the core anti-clipping calculations:
  - `calculateDynamicPadding(labels: string[], chartType: ChartType)`: Computes left padding for `horizontal_bar` and `ranked_bar` between 80px and 260px safety cap using `Math.round(maxLabelLen * 7.5)`. Other charts receive `{ left: 40, right: 40, top: 60, bottom: 50 }`.
  - `wrapLabel(text: string, maxCharsPerLine = 22)`: Splits on words, preserving single unbroken long words.
  - `determineBadgePlacement(value: number, maxValue: number)`: Returns `'inside'` if `value / maxValue > 0.25`, else `'outside'`.

- **`src/components/studio/ChartCard.tsx`** (Lines 40–48, 82–109):
  - Currently defines `sanitizeExportFilename(index: number, title: string): string` generating `chart_01_slug.png` with 40-char slug cap.
  - Currently triggers export by taking `chartInstanceRef.current.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#FFFFFF' })`, which only exports the bare chart canvas without the card header, question title, or official watermark footer.

- **E2E Test Specifications (`tests/e2e/tier1_feature_coverage.test.cjs` & `tier2_boundary_corner.test.cjs`)**:
  - **F26**: Base `800x500 px` at 3x scale yields exact `2400x1500 px`; base `800x600 px` at 3x yields exact `2400x1800 px`. Solid `#FFFFFF` background, lossless `image/png`.
  - **F27**: Dynamic margin clearance (80px to 260px), multi-line label wrapping (22 chars), badge placement (>0.25).
  - **F28**: Filename format `chart_${prefix}_${slug}.png`, padded index (01-99), slug capped at 40 characters, punctuation replaced with underscores, emojis stripped, fallback `'chart_03_chart.png'` for empty titles.
  - Baseline test verification: `npm run test:e2e` runs 324 tests across Tiers 1–4 with 100% pass rate. `npx tsc --noEmit` exits clean with code 0.

---

## 2. Logic Chain

1. **Dual Export Modality Requirement**:
   - *Observation*: Direct export from mounted chart (`chart.getDataURL()`) is fast for interactive preview, but users require complete publication-ready presentation cards (containing question title, Q-index metadata, chart, and official BEM UNDIP watermark footer) suitable for direct insertion into slide decks.
   - *Inference*: `src/core/export/canvasExporter.ts` must provide both:
     1. **Mounted Exporter**: `exportMountedChartToDataURL(chart, options)` & `exportMountedChartToBlob(chart, options)` for immediate capture of visible on-screen instances.
     2. **Headless / Offscreen Compositor**: `renderChartCardToBlob(cardConfig, options)` & `renderChartCardToDataURL(cardConfig, options)` that creates a temporary offscreen ECharts instance, disables animations for instant synchronous vector rasterization, and composites a high-DPI 2400x1500 px presentation card canvas.

2. **Offscreen Canvas & Animation Invariant**:
   - *Observation*: Apache ECharts default animation duration is 1000ms. If `chart.getDataURL()` is called immediately during offscreen rendering without waiting, bars or slices may be captured in an unexpanded state.
   - *Inference*: In the headless renderer, `option.animation = false` must be explicitly injected before calling `chart.setOption(option, true)`. This guarantees synchronous frame-0 complete vector rendering.

3. **Memory Management & DOM Lifecycle**:
   - *Observation*: In client-side SPA, generating batch exports for 20+ survey questions creates multiple ECharts instances. If not disposed, memory leaks and canvas context limits will occur.
   - *Inference*: The headless renderer must encapsulate instance lifecycle in a strict `try ... finally` block:
     ```typescript
     try {
       // init, render, capture
     } finally {
       chart.dispose();
       container.remove();
     }
     ```

4. **Typography & Font Synchronization**:
   - *Observation*: Presentations use 6 custom fonts (Poppins, Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather). If text is drawn on `<canvas>` before webfonts load, the browser falls back to system fonts, causing text overflow or alignment defects.
   - *Inference*: Before drawing header titles or watermark footers on the 2D canvas context, the compositor must call `await (document.fonts?.ready ?? Promise.resolve())`.

5. **Presentation Card Layout Geometry (2400x1500 px)**:
   - Scale factor: 3x.
   - Canvas width: `2400` px; Canvas height: `1500` px (or `1800` px for tall charts).
   - Card Background: Fill solid `#FFFFFF`.
   - Outer Margins: 90px left/right clearance.
   - Zone 1 (Top Header, `y = 70` to `y = 230`):
     - Pill Badge: `x = 90, y = 80`, height = 44px, radius = 22px, fill `#EFF6FF`, stroke `#BFDBFE`.
       Text: `Q${col.columnIndex} • ${col.type.replace(/_/g, ' ')} • N = ${col.validResponses}` (Font: `bold 20px ${fontFamily}`).
     - Title: `x = 90, y = 160`, font `bold 52px ${fontFamily}`, color `#0F172A`. Auto-wrapped to max 2 lines with canvas text measurement.
   - Zone 2 (Chart Body, `y = 240` to `y = 1380`):
     - Chart drawn centered horizontally: `ctx.drawImage(chartImg, 60, 240, 2280, 1140)`.
   - Zone 3 (Footer, `y = 1400` to `y = 1470`):
     - Divider line from `x = 90` to `x = 2310`, `#E2E8F0`, 2px thickness.
     - Left Watermark (`x = 90, y = 1445`): Watermark icon emblem + text (e.g. "Biro Statistika BEM Universitas Diponegoro").
     - Right Trust Badge (`x = 2310, y = 1445`): Emerald shield icon + text ("Survei Terverifikasi BEM UNDIP 2026"), right-aligned.

6. **Single Chart Download Utility**:
   - `downloadSingleChart(column, theme, dimensionality, options?)`:
     - Renders blob via `renderChartCardToBlob`.
     - Generates filename via `sanitizeExportFilename(column.columnIndex, column.displayTitle || column.cleanName)`.
     - Uses standard DOM anchor simulation (`URL.createObjectURL(blob)`, `a.click()`, `URL.revokeObjectURL(url)`).
     - Returns filename string.

---

## 3. Caveats

1. **Headless Testing in Pure Node.js vs Browser DOM**:
   - Node.js environment does not have native `window`, `document`, `HTMLCanvasElement`, or `Image`.
   - The test harness (`tests/e2e/harness.cjs` and `tests/m4_verification.cjs`) validates the mathematical and string invariants (`calculateExportDimensions`, `calculateDynamicPadding`, `wrapLabel`, `determineBadgePlacement`, `sanitizeExportFilename`, canvas text wrapping line calculations).
   - In `canvasExporter.ts`, all DOM-dependent functions must check `if (typeof window === 'undefined' || typeof document === 'undefined')` and throw a descriptive error or mock gracefully if executed in Node.js without a DOM shim.
2. **Maximum Slug Length**:
   - Per test requirements F28-3 and F28-B5, the slug portion of `chart_01_slug.png` is strictly capped at 40 characters (`.slice(0, 40)`), preventing filesystem path overflow.
3. **No Radar or Dual-Axis Charts**:
   - In accordance with Feature 15 (Prohibited Charts Ban), the exporter only handles the 5 public-friendly chart types: `donut`, `horizontal_bar`, `vertical_bar`, `ranked_bar`, and `ordered_likert`.

---

## 4. Conclusion & Implementation Blueprint

### 4.1 Enhanced Interfaces (`src/types/export.ts`)

```typescript
import { ColumnProfile } from './survey';
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
  baseWidth?: number; // Default 800
  baseHeight?: number; // Default 500 (standard) or 600 (tall)
  pixelRatio?: number; // Default 3.0 (~300 DPI)
  backgroundColor?: string; // Default '#FFFFFF'
  exportMode?: ExportMode; // Default 'card'
  includeWatermark?: boolean; // Default true
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
```

### 4.2 Module Implementation Blueprint (`src/core/export/canvasExporter.ts`)

```typescript
/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 4: High-Resolution Batch Export & Asset Packaging
 * Features 26, 27, 28: High-DPI 3x Canvas Export & Anti-Clipping Engine
 */

import * as echarts from 'echarts';
import { ColumnProfile } from '../../types/survey';
import { ThemeConfig, DimensionalityMode } from '../../types/theming';
import {
  ExportCardConfig,
  ExportDimensions,
  RenderCardOptions,
  SingleChartExportResult,
} from '../../types/export';
import {
  generateEChartsOption,
  calculateDynamicPadding,
  wrapLabel,
  determineBadgePlacement,
} from '../theming/echartsOptions';

// Re-export anti-clipping helpers
export { calculateDynamicPadding, wrapLabel, determineBadgePlacement };

// Constants
export const EXPORT_PIXEL_RATIO = 3.0; // ~300 DPI publication quality
export const DEFAULT_BASE_WIDTH = 800;
export const DEFAULT_BASE_HEIGHT = 500;
export const TALL_BASE_HEIGHT = 600;
export const EXPORT_BG_COLOR = '#FFFFFF';
export const EXPORT_MIME_TYPE = 'image/png';
export const WATERMARK_DEFAULT_TEXT = 'Biro Statistika BEM Universitas Diponegoro';

/**
 * Calculate export dimensions matching presentation aspect ratios
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
  return `chart_${prefix}_${slug}.png`;
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
  const baseH = options?.baseHeight ?? (column.selectedChart === 'ordered_likert' || column.selectedChart === 'horizontal_bar' ? 420 : 380);

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
    await document.fonts.ready;
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
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 22);
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
  const titleY = 150;
  const maxTitleWidth = canvas.width - 180;
  const titleFontSize = Math.round((theme.titleFontSize || 20) * 2.6);
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
  const chartTop = titleY + displayLines.length * (titleFontSize + 12) + 20;
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

/**
 * Helper: Load image from DataURL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('[canvasExporter] Failed to load chart raster image: ' + err));
    img.src = dataUrl;
  });
}

/**
 * Headless Render: Complete presentation card to Blob
 */
export async function renderChartCardToBlob(
  cardConfig: ExportCardConfig,
  options?: RenderCardOptions
): Promise<Blob> {
  const dataUrl = await renderChartCardToDataURL(cardConfig, options);
  return dataURLToBlob(dataUrl);
}

/**
 * Headless Render: Complete presentation card to DataURL
 */
export async function renderChartCardToDataURL(
  cardConfig: ExportCardConfig,
  options?: RenderCardOptions
): Promise<string> {
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

  const dimensions = calculateExportDimensions(
    options?.baseWidth ?? DEFAULT_BASE_WIDTH,
    options?.baseHeight ?? (cardConfig.column.selectedChart === 'ordered_likert' || cardConfig.column.selectedChart === 'horizontal_bar' ? TALL_BASE_HEIGHT : DEFAULT_BASE_HEIGHT),
    cardConfig.pixelRatio || EXPORT_PIXEL_RATIO
  );

  const cardCanvas = await compositePresentationCard(
    chartDataUrl,
    cardConfig.column,
    cardConfig.theme,
    dimensions,
    options
  );

  return cardCanvas.toDataURL(EXPORT_MIME_TYPE);
}

/**
 * Feature 28: One-click Single Chart Download Utility
 */
export async function downloadSingleChart(
  column: ColumnProfile,
  theme: ThemeConfig,
  dimensionality: DimensionalityMode,
  options?: RenderCardOptions
): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('[canvasExporter] downloadSingleChart requires a browser DOM environment.');
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

  const filename = sanitizeExportFilename(
    column.columnIndex,
    column.displayTitle || column.cleanName
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
```

---

## 5. Verification Method

### 5.1 Independent Test Suite (`tests/m4_verification.cjs`)
A dedicated automated verification script testing both pure mathematical logic and simulated headless flows:
1. **Command**:
   ```bash
   node tests/m4_verification.cjs
   ```
2. **Test Assertions**:
   - `calculateExportDimensions(800, 500, 3)` returns `targetWidth: 2400, targetHeight: 1500`.
   - `calculateExportDimensions(800, 600, 3)` returns `targetWidth: 2400, targetHeight: 1800`.
   - `sanitizeExportFilename(1, 'Asal Fakultas Mahasiswa')` returns `'chart_01_asal_fakultas_mahasiswa.png'`.
   - `sanitizeExportFilename(4, 'Tingkat Stress / Burnout? (1-5)')` returns `'chart_04_tingkat_stress_burnout_1_5.png'`.
   - `sanitizeExportFilename(2, 'Tingkat Kepuasan 😊 Mahasiswa 👍')` returns `'chart_02_tingkat_kepuasan_mahasiswa.png'`.
   - `calculateDynamicPadding(['A'], 'horizontal_bar')` returns `left: 80`.
   - `calculateDynamicPadding(['A'.repeat(80)], 'horizontal_bar')` returns `left: 260`.
   - `determineBadgePlacement(25, 100)` returns `'outside'`, `determineBadgePlacement(26, 100)` returns `'inside'`.
   - `wrapLabel('Fakultas Perikanan dan Ilmu Kelautan', 22)` wraps properly without clipping.
   - `wrapCanvasText` splits long text based on maxWidth properly.

### 5.2 Full E2E Test Suite Pass
1. **Command**:
   ```bash
   npm run test:e2e
   ```
   Must pass 100% of 324 tests across Tier 1, Tier 2, Tier 3, and Tier 4 with zero failures.

2. **TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with code 0.
