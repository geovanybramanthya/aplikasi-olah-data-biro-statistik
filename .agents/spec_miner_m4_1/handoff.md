# Milestone 4 Specification Report: Export & Packaging (Features 26–29)
**Agent**: `spec_miner_m4_1`  
**Working Directory**: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\spec_miner_m4_1`  
**Parent Orchestrator**: `f1319749-57f4-4f1e-8e0d-78db5f4f4262`  
**Timestamp**: 2026-09-14T17:22:00+07:00  

---

## Executive Summary
This specification report provides the definitive, authoritative requirements, boundary conditions, mathematical formulas, file structures, and acceptance criteria for **Milestone 4: High-Resolution Batch Export & Asset Packaging (Features 26–29)** of the BEM UNDIP Survey Analytics & Visualization Platform.

All specifications have been verified against:
1. `ORIGINAL_REQUEST.md` (§ R4 & Acceptance Criteria)
2. `PROJECT.md` (§ Visual & Charting Engine, Export & Packaging Engine, and Interface Contracts)
3. `TEST_INFRA.md` (Tiers 1–4 Test Matrix)
4. `tests/e2e/harness.cjs` (Authoritative Oracle Definitions)
5. Existing test suites in `tests/e2e/` (Tiers 1, 2, 3, 4 — 324/324 passing)

---

## 1. Observation

### 1.1 Direct Observations from Codebase & Specifications
- **`PROJECT.md` Feature Inventory**:
  - Feature 26: High-Resolution 3x Canvas Export — Native ~300 DPI rasterization (2400x1500 px) via ECharts `getDataURL` without clipping.
  - Feature 27: Anti-Clipping Geometry & Padding — Dynamic margin safety clearance and auto-wrapping for long Indonesian category labels.
  - Feature 28: Single Chart PNG Export — One-click 3x PNG download for any individual chart card.
  - Feature 29: High-Res Batch ZIP Packaging — In-memory sequential JSZip batch bundling of all charts + `SURVEY_SUMMARY_AUDIT.txt`.
- **`src/types/export.ts` Contracts**:
  - `ExportCardConfig`: encapsulates `column: ColumnProfile`, `theme: ThemeConfig`, `dimensionality: DimensionalityMode`, `pixelRatio: number`.
  - `BatchExportProgress`: encapsulates `total: number`, `completed: number`, `currentTitle: string`, `isZipping: boolean`, `isComplete: boolean`.
- **`tests/e2e/harness.cjs` & E2E Test Suite**:
  - `calculateDynamicPadding(labels, chartType)`: clamps between `80px` and `260px` with multiplier `7.5` for `horizontal_bar` and `ranked_bar`, returning `{ left, right: 50, top: 70, bottom: 50 }`. For other chart types, returns `{ left: 40, right: 40, top: 70, bottom: 50 }`.
  - `wrapLabel(text, maxCharsPerLine = 22)`: word-based wrapping splitting on space and pushing lines up to 22 characters per line.
  - `determineBadgePlacement(value, maxValue)`: threshold at `0.25`. Values `> 0.25` placed `'inside'`, `<= 0.25` placed `'outside'`.
  - `sanitizeExportFilename(index, title)`: `chart_${prefix}_${slug}.png` where prefix is `String(index).padStart(2, '0')` and slug is lowercase alphanumeric with underscores, capped at 40 characters (fallback `'chart'`).
  - `buildExportManifest(columns, theme)`: exact ASCII banner structure containing date, typography, palette, watermark, column counts, and itemized non-excluded charts in format `  ${idx}. [${TYPE}] ${title} (N=${n})`.
  - `packageBatchZip(charts, manifestContent)`: bundles `SURVEY_SUMMARY_AUDIT.txt` at the root of the archive alongside individual chart PNGs.

---

## 2. Features Discovered & Specification Matrix

### Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 26 | Export / Rasterization | High-Resolution 3x Canvas Export | Renders charts at 3.0 scale multiplier (~300 DPI) to 2400x1500 px canvas with solid #FFFFFF background | `chartInstance: echarts.ECharts`, `pixelRatio: 3.0`, `backgroundColor: '#FFFFFF'` | Lossless PNG DataURL / Blob (`image/png`, 2400x1500 px or 2400x1800 px) | Falls back to default DPR if invalid, logs rasterization error | `ORIGINAL_REQUEST.md` R4, `PROJECT.md` F26, `tier1_feature_coverage.test.cjs` (F26-1 to F26-5) |
| 27 | Layout / Geometry | Dynamic Anti-Clipping Padding | Dynamically calculates left margin padding based on max label length to eliminate label clipping | `labels: string[]`, `chartType: ChartType` | Margin object `{ left, right: 50, top: 70, bottom: 50 }` (or `{ left: 40, right: 40, top: 70, bottom: 50 }`) | Clamps left padding to range [80, 260] px; empty labels default to 80 px | `PROJECT.md` F27, `harness.cjs`, `tier1_feature_coverage.test.cjs` (F27-1, F27-2) |
| 27 | Layout / Geometry | Word-Level Label Wrapping | Wraps Indonesian category labels into multi-line strings at max 22 characters per line | `text: string`, `maxCharsPerLine: number = 22` | Array of wrapped strings `string[]` | Empty text returns `[]`; single unbroken word >22 chars kept intact on single line | `PROJECT.md` F27, `harness.cjs`, `tier1_feature_coverage.test.cjs` (F27-3), `tier2_boundary_corner.test.cjs` (F27-B1) |
| 27 | Layout / Geometry | Adaptive Badge Placement | Places percentage/value badges inside or outside bars based on 25% length threshold | `value: number`, `maxValue: number` | `'inside' \| 'outside'` | Returns `'outside'` if `maxValue <= 0` or `value / maxValue <= 0.25` | `PROJECT.md` F27, `harness.cjs`, `tier1_feature_coverage.test.cjs` (F27-4, F27-5), `tier2_boundary_corner.test.cjs` (F27-B4, F27-B5) |
| 28 | Single Export | Sanitize Export Filename | Generates filesystem-safe, standardized PNG filename with 2-digit index and sanitized slug | `index: number`, `title: string` | `chart_${prefix}_${slug}.png` (e.g. `chart_01_asal_fakultas.png`) | Empty/symbol-only title falls back to `chart_${prefix}_chart.png`; slug capped at 40 chars | `PROJECT.md` F28, `harness.cjs`, `tier1_feature_coverage.test.cjs` (F28-1 to F28-5), `tier2_boundary_corner.test.cjs` (F28-B1 to F28-B5) |
| 28 | Single Export | Single Chart PNG Download | Direct browser download of individual 3x PNG card with title and institutional watermark | `column: ColumnProfile`, `theme: ThemeConfig`, `cardOverride?: DimensionalityMode` | Instant file download trigger via anchor element | Logs console error if chart unmounted or canvas tainted | `PROJECT.md` F28, `src/components/studio/ChartCard.tsx` (lines 82-109) |
| 29 | Batch Packaging | Audit Manifest Generation | Formats institutional ASCII audit file `SURVEY_SUMMARY_AUDIT.txt` documenting metadata & chart inventory | `columns: ColumnProfile[]`, `theme: Partial<ThemeConfig>` | UTF-8 formatted manifest string with strict headers and dividers | Excluded columns (`isExcluded: true`) are strictly omitted | `PROJECT.md` F29, `harness.cjs`, `tier1_feature_coverage.test.cjs` (F29-2, F29-3), `tier2_boundary_corner.test.cjs` (F29-B3) |
| 29 | Batch Packaging | In-Memory JSZip Archive Bundling | Packages all rendered chart PNGs and `SURVEY_SUMMARY_AUDIT.txt` into a compressed ZIP file | `charts: Array<{ filename: string; data: any }>`, `manifestContent: string` | Node `Buffer` (tests) or Browser `Blob` (`application/zip`) | Empty charts array produces valid ZIP containing manifest only | `PROJECT.md` F29, `harness.cjs`, `tier1_feature_coverage.test.cjs` (F29-1, F29-4, F29-5), `tier2_boundary_corner.test.cjs` (F29-B1, F29-B2) |
| 29 | Batch Packaging | Progress Tracking & State Reporting | Emits real-time rendering and zipping status to driver UI modal | `onProgress: (p: BatchExportProgress) => void` | Updates UI progress bar, counts, and active chart title | Graceful completion flag `isComplete: true` on finish or error | `PROJECT.md` § Interface Contracts, `src/types/export.ts` |
| 29 | UI Studio | Batch Export Modal & Audit Summary Tab | Interactive modal with animated progress bar and Tab 4 dashboard for export triggers | `dataset: SurveyDataset`, `theme: ThemeConfig` | React UI elements with real-time feedback and download triggers | Disables CTA if no active exportable columns | `PROJECT.md` Code Layout (`BatchExportModal.tsx`, `ExportAuditSummary.tsx`) |

---

## 3. Edge Cases & Boundary Conditions

| # | Feature | Input / Boundary Condition | Observed & Required Behavior |
|---|---------|----------------------------|------------------------------|
| 1 | F26: High-Res Resolution | Base card dimensions: 800x500 px at 3.0 pixel ratio | Exact output canvas size: 2400x1500 px. Zero scaling blur. |
| 2 | F26: High-Res Resolution | Base card dimensions: 800x600 px at 3.0 pixel ratio | Exact output canvas size: 2400x1800 px. |
| 3 | F26: Background Opacity | Canvas rendering without explicit background | Must enforce solid `#FFFFFF`. Eliminates transparent bleed when pasted into slides. |
| 4 | F26: Format & Encoding | Lossless PNG rasterization | Format string `'png'`, MIME type `'image/png'`. Zero lossy artifacting around text. |
| 5 | F27: Minimum Padding | Single-character category label `['A']` | Left padding clamped to minimum `80 px` (`Math.max(80, 1 * 7.5)`). |
| 6 | F27: Maximum Padding | Extreme 80-character label `['A'.repeat(80)]` | Left padding capped to safety ceiling `260 px` (`Math.min(260, 600)`). |
| 7 | F27: Non-Horizontal Chart | Donut, Vertical Bar, Ordered Likert | Returns standard padding `{ left: 40, right: 40, top: 70, bottom: 50 }`. |
| 8 | F27: Word-Level Wrapping | Text with words fitting within 22 chars | Wraps across multiple lines; each line length <= 22 chars. |
| 9 | F27: Long Unbroken Word | 120 characters with no spaces (`'A'.repeat(120)`) | Preserved on single line (`lines.length === 1`) without throwing or corrupting text. |
| 10 | F27: Empty Text Wrapping | Empty string `""` or `null` | Returns empty array `[]`. |
| 11 | F27: Badge Placement | Value exactly 25% of max (`25 / 100`) | Placed `'outside'` the bar (boundary condition `<= 0.25`). |
| 12 | F27: Badge Placement | Value at 26% of max (`26 / 100`) | Placed `'inside'` the bar (boundary condition `> 0.25`). |
| 13 | F27: Badge Placement | Max value `<= 0` (all zero responses) | Returns `'outside'` safely without division by zero errors. |
| 14 | F28: Illegal Characters | Title with `*`, `?`, `:`, `/`, `\`, `(`, `)` | All converted to underscores `_`; slashes and illegal characters eliminated. |
| 15 | F28: Emojis in Title | Title containing emojis (e.g. `'Kepuasan 😊'`) | Emojis stripped/converted to alphanumeric slug (`'chart_02_kepuasan.png'`). |
| 16 | F28: Single-Digit Prefix | Indices 1 through 9 | Padded with leading zero: `chart_01_` through `chart_09_`. |
| 17 | F28: Two-Digit Prefix | Indices 10 through 99 | Retains 2 digits without extra zero: `chart_10_` through `chart_99_`. |
| 18 | F28: Title Truncation | Title length > 80 characters | Slug truncated to exactly 40 characters: `chart_10_${'a'.repeat(40)}.png`. |
| 19 | F28: Empty Question Title | Title is `""` or whitespace | Falls back to `'chart'`: `chart_03_chart.png`. |
| 20 | F29: Empty Batch Export | `charts = []` | Produces valid ZIP archive containing exactly 1 file (`SURVEY_SUMMARY_AUDIT.txt`). |
| 21 | F29: Large Batch Export | 25 charts batch export | Produces valid ZIP archive containing 26 files (25 charts + 1 manifest). |
| 22 | F29: Excluded Column Manifest | Column with `isExcluded: true` | Completely omitted from the itemized list in `SURVEY_SUMMARY_AUDIT.txt`. |
| 23 | F29: Audit Manifest Metadata | Theme missing optional fields | Falls back to defaults: typography `'Poppins'`, palette `'undip_navy_gold'`, watermark text. |
| 24 | F29: Progress State Sequence | Start to Finish transitions | `(0, total) -> (1, total) ... -> (total, isZipping: true) -> (total, isComplete: true)`. |

---

## 4. Architectural & Implementation Blueprint

### 4.1 Required Source Files & Module Layout
```
src/
├── core/
│   └── export/
│       ├── canvasExporter.ts    # High-Res 3x DPI rasterization, anti-clipping padding, filename sanitization
│       └── zipPackager.ts       # JSZip batch bundling, SURVEY_SUMMARY_AUDIT.txt generator, progress reporter
└── components/
    └── export/
        ├── BatchExportModal.tsx # Animated progress modal dialog
        └── ExportAuditSummary.tsx # Tab 4 dashboard with live audit preview & export actions
```

### 4.2 Detailed Specifications per Component

#### 1. `src/core/export/canvasExporter.ts`
- **Constants**:
  - `EXPORT_BASE_WIDTH = 800`
  - `EXPORT_BASE_HEIGHT = 500`
  - `EXPORT_PIXEL_RATIO = 3.0`
  - `EXPORT_BG_COLOR = '#FFFFFF'`
- **Functions to implement/export**:
  1. `calculateDynamicPadding(labels?: string[], chartType?: ChartType): { left: number; right: number; top: number; bottom: number }`
     - Matches `tests/e2e/harness.cjs` lines 736-743.
     - Clamps left padding: `Math.min(260, Math.max(80, Math.round(maxLabelLen * 7.5)))`.
     - Returns `{ left, right: 50, top: 70, bottom: 50 }` for horizontal/ranked bar.
     - Returns `{ left: 40, right: 40, top: 70, bottom: 50 }` for other chart types.
  2. `wrapLabel(text: string, maxCharsPerLine = 22): string[]`
     - Matches `tests/e2e/harness.cjs` lines 745-761.
  3. `determineBadgePlacement(value: number, maxValue: number): 'inside' | 'outside'`
     - Matches `tests/e2e/harness.cjs` lines 763-766.
  4. `sanitizeExportFilename(index: number, title: string): string`
     - Matches `tests/e2e/harness.cjs` lines 768-776.
     - Format: `chart_${String(index).padStart(2, '0')}_${slug}.png` (slug max 40 chars, fallback `'chart'`).
  5. `getChartDataURL(chartInstance: echarts.ECharts): string`
     - Calls `chartInstance.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#FFFFFF' })`.
  6. `renderOffscreenChartCard(config: ExportCardConfig): Promise<Blob>`
     - Creates offscreen canvas / container element.
     - Renders complete card: Question badge & title header, ECharts chart with anti-clipping grid, institutional watermark footer.
     - Returns standard PNG Blob.
  7. `downloadSingleChart(column: ColumnProfile, theme: ThemeConfig, dimensionality: DimensionalityMode): void`
     - Helper triggering immediate browser download.

#### 2. `src/core/export/zipPackager.ts`
- **Functions to implement/export**:
  1. `buildExportManifest(columns: ColumnProfile[], theme: Partial<ThemeConfig>): string`
     - Matches `tests/e2e/harness.cjs` lines 778-808.
     - Header banner: `BIRO STATISTIKA BEM UNIVERSITAS DIPONEGORO - AUDIT MANIFEST`
     - Mandatory fields: `Export Date`, `Typography`, `Active Palette`, `Watermark`, `Watermark Text`, `Total Columns`.
     - Non-excluded charts list: `  ${idx}. [${CHART_TYPE}] ${title} (N=${n})`.
  2. `packageBatchZip(charts: Array<{ filename: string; data: any }>, manifestContent: string): Promise<any>`
     - Matches `tests/e2e/harness.cjs` lines 810-820.
     - Places `SURVEY_SUMMARY_AUDIT.txt` at root.
     - Places chart files directly in the archive.
     - In Node environment: returns `Buffer` (`zip.generateAsync({ type: 'nodebuffer' })`).
     - In Browser environment: returns `Blob` (`zip.generateAsync({ type: 'blob' })`).
  3. `exportSurveyBatchZip(dataset: SurveyDataset, theme: ThemeConfig, onProgress?: (p: BatchExportProgress) => void): Promise<Blob>`
     - High-level coordinator that filters active visual columns (`!col.isExcluded && col.selectedChart !== 'none'`).
     - Iterates columns, offscreen renders each chart, emits `onProgress` callbacks.
     - Builds manifest via `buildExportManifest(dataset.columns, theme)`.
     - Packages zip via JSZip, sets `isZipping: true`, and upon completion triggers download `<dataset.name>_BEM_UNDIP_Charts.zip` and sets `isComplete: true`.

#### 3. `src/components/export/BatchExportModal.tsx`
- Dialog modal listening to `BatchExportProgress`.
- Displays progress bar (0% to 100%), current chart title, state badges ("Merasterisasi..." -> "Mengompresi berkas..." -> "Selesai!").
- Auto-triggers file download on completion.

#### 4. `src/components/export/ExportAuditSummary.tsx`
- Tab 4 view in `src/App.tsx`.
- Displays:
  - Statistics: Total survey respondents, total questions, questions ready for export, excluded questions.
  - Specs list: 3x resolution (~300 DPI), 2400x1500 px, lossless PNG, solid white background, institutional watermark.
  - Live ASCII Manifest Preview: scrollable monospaced card rendering `buildExportManifest`.
  - Batch Export CTA button: initiates `BatchExportModal` workflow.

---

## 5. Logic Chain

1. **User Requirement & Integrity**:
   - `ORIGINAL_REQUEST.md` requires high-resolution batch export (~300 DPI / 3x scale) and packaged ZIP download with public-friendly charts.
   - Student privacy is 100% preserved because all rendering, zipping, and manifest generation happens client-side in-memory via JSZip and Canvas.
2. **Dimension Derivation**:
   - Presentation slides standard aspect ratio is 16:10 or 16:9. A base card of 800x500 px at 3x DPR yields 2400x1500 px, matching publication standard (~300 DPI).
3. **Anti-Clipping Derivation**:
   - Indonesian academic titles can be verbose (e.g. "Fakultas Perikanan dan Ilmu Kelautan").
   - Clamping left padding dynamically between 80px and 260px (`maxLabelLen * 7.5`) guarantees category labels are readable without being cut off by canvas boundaries.
   - Word wrapping at 22 chars prevents long titles from overlapping chart bars or legend components.
   - 25% threshold for badge placement prevents numbers/percentages from protruding beyond small bar segments.
4. **ZIP Structure Derivation**:
   - Placing `SURVEY_SUMMARY_AUDIT.txt` at the root alongside indexed PNG files `chart_01_*.png` ensures any archiving tool, slide designer, or auditor can immediately inspect the audit trail and charts in numerical question order.

---

## 6. Caveats
- Browser Memory Management: For surveys with >50 questions, creating 2400x1500 px canvases in parallel can exhaust browser memory. **Sequential rendering** (`await` per chart) with canvas cleanup is strictly required.
- Offscreen Canvas Support: Modern browsers support `OffscreenCanvas`, but standard DOM hidden container fallback is recommended to ensure 100% cross-browser compatibility with ECharts font rendering.
- Test Environment Dual Support: `packageBatchZip` must support returning a Node.js `Buffer` when running in Node/CommonJS test runners (`type: 'nodebuffer'`) and a `Blob` in the browser (`type: 'blob'`).

---

## 7. Conclusion
The specification for Milestone 4 (Features 26–29) is fully discovered, mathematically verified, and cross-referenced with all 324 existing E2E tests. The required data structures, algorithms, filenames, and component architectures are clearly bounded and ready for immediate implementation by the Milestone 4 worker.

---

## 8. Verification Method

To independently verify all Milestone 4 specifications:
1. **Execute Complete E2E Test Suite**:
   ```bash
   node tests/e2e/runner.cjs
   ```
   *Expected Result*: 324 / 324 tests passing across Tiers 1–4 with exit code 0.
2. **Verify Milestone 4 Specific Tests**:
   - Tier 1: `node -e "const { getResults } = require('./tests/e2e/harness.cjs'); require('./tests/e2e/tier1_feature_coverage.test.cjs');"`
   - Tier 2: `node -e "const { getResults } = require('./tests/e2e/harness.cjs'); require('./tests/e2e/tier2_boundary_corner.test.cjs');"`
   - Tier 3: `node -e "const { getResults } = require('./tests/e2e/harness.cjs'); require('./tests/e2e/tier3_cross_feature.test.cjs');"`
   - Tier 4: `node -e "const { getResults } = require('./tests/e2e/harness.cjs'); require('./tests/e2e/tier4_real_world_workloads.test.cjs');"`
3. **Inspect Implementation TypeScript Compile**:
   ```bash
   npm run build
   ```
   *Expected Result*: Zero TypeScript errors, clean Vite build.
