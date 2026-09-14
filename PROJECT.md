# Project: BEM UNDIP Survey Analytics & Visualization Platform

## Architecture
- **Platform Architecture**: Pure Client-Side Single Page Application (SPA) built with React 19/18, TypeScript, Vite, and Tailwind CSS. Guarantees 100% student data privacy (zero cloud upload), zero-latency processing (<30ms for 2,000 survey rows), and offline availability.
- **Data Ingestion & Profiling**: PapaParse (CSV with RFC 4180 quotes/commas) and SheetJS (XLSX/XLS). Header normalization (whitespace trimming), regex-based PII exclusion (Timestamp, Nama, NIM, Email, Phone), 5-tier question classification using statistical heuristics (including Token Repeat Ratio for multi-select vs free-text), and pre-bundled BEM UNDIP demo datasets.
- **Visual & Charting Engine**: Apache ECharts (`echarts` 6.x / 5.x) providing native vector-to-canvas rasterization at 3x DPI via `chartInstance.getDataURL({ pixelRatio: 3 })`, anti-clipping geometry (`grid.containLabel: true`), rich text percentage badges, and custom font rendering.
- **Dimensionality Engine**: 2D Modern Flat (soft rounded corners, clean donut geometry, high-contrast badges) and 2.5D Isometric 3D Visual Styling (shaded facet prisms, illuminated top-cap ellipses, directional drop shadows). Global preset with per-chart override selector.
- **Theming & Typography**: 6 presentation fonts (Poppins, Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather); 4 institutional palettes (UNDIP Navy & Gold, Modern Emerald, Executive Pastel, Warm Sunset) with >= 5 hex codes each; custom palette builder with strict validation requiring >= 5 valid hex codes (`^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`).
- **Narrative & Insight Engine**: Hybrid architecture: 100% offline descriptive statistics by default (mean, median, mode, percentages, net positive agreement, top-box), with an optional Gemini LLM narrative toggle with graceful fallback to offline statistics when API key is not provided or offline.
- **Export & Packaging Engine**: Canvas card rasterization at ~300 DPI (3x scale factor, 2400x1500 px) with official BEM UNDIP footer watermark ("Biro Statistika BEM Universitas Diponegoro"), wrapped in in-memory sequential JSZip batch archive with audit metadata file (`SURVEY_SUMMARY_AUDIT.txt`).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| 1 | CSV File Ingestion | Robust CSV parsing handling RFC 4180 quotes, commas, newlines | M1 | R1, Survey |
| 2 | Excel File Ingestion | Ingestion of `.xlsx` and `.xls` workbooks via SheetJS | M1 | R1, Survey |
| 3 | Header Sanitization | Trims leading/trailing whitespace and normalizes column headers | M1 | Survey |
| 4 | PII / Metadata Detection | Regex scanner automatically identifying & excluding Timestamp, Nama, NIM, Email, Phone | M1 | R1, Survey |
| 5 | Dichotomous Binary Classifier | Detects 2-category binary questions (e.g. Ya/Tidak) | M1 | R1, Survey |
| 6 | Likert Scale Classifier | Classifies 1-4 and 1-5 ordinal scales, preserving semantic direction even with 0-count options | M1 | R1, Survey |
| 7 | Multi-Select Checkbox Splitter | Tokenizes comma-delimited responses, distinguishes from free text via Token Repeat Ratio (>3.0) | M1 | R1, Survey |
| 8 | Nominal Demographics Classifier | Classifies categorical questions (Fakultas, Bidang, Jabatan, Lama aktif) | M1 | R1, Survey |
| 9 | Open-Ended Text Classifier | Detects qualitative essay responses and provides text feed/word cloud | M1 | R1, Survey |
| 10 | Bundled Demo Datasets | One-click instant offline loading of real BEM UNDIP sample surveys (Sample 1 & Sample 2) | M1 | R1, AC |
| 11 | Donut Chart Recommendation | Recommends Donut chart with percentage badges for 2-3 categories | M2 | R2 |
| 12 | Horizontal/Vertical Bar Recommendation | Recommends Bar charts for multi-category demographics with value labels | M2 | R2 |
| 13 | Ranked Bar Recommendation | Recommends descending Horizontal Bar chart for multi-select checkboxes (% of N respondents) | M2 | R2 |
| 14 | Ordered Likert Bar Recommendation | Recommends ordered frequency bar chart for Likert ratings with distribution percentages | M2 | R2 |
| 15 | Prohibited Charts Ban | Strictly bans confusing charts (radar, distorted 3D pie wedges, dual-axis spaghetti plots) | M2 | R2 |
| 16 | Interactive Curation Table | UI table allowing user to override chart types, modify titles/subtitles, toggle columns on/off | M2 | R2 |
| 17 | Offline Statistical Summary | 100% offline Indonesian narrative summary (mode, percentages, Likert mean/net positive) | M2 | R2 |
| 18 | Optional Gemini Narrative Toggle | Toggle switch for Gemini API key with graceful fallback to offline statistics | M2 | R2 |
| 19 | Typography Library | Support 6 presentation fonts (Poppins, Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather) | M3 | R3 |
| 20 | Institutional Color Palettes | 4 curated palettes (UNDIP Navy & Gold, Modern Emerald, Executive Pastel, Warm Sunset) with >= 5 hex codes | M3 | R3 |
| 21 | Custom Palette Builder & Validator | Custom palette input with strict validation requiring >= 5 valid hex codes | M3 | R3, AC |
| 22 | 2D Modern Flat Visual Style | Soft rounded bar corners, clean donut geometry, high-contrast badges | M3 | R3 |
| 23 | 2.5D Isometric 3D Visual Style | Shaded facet prisms, illuminated top-cap ellipses, directional drop shadows | M3 | R3 |
| 24 | Per-Chart Dimensionality Override | Individual toggle pill on each chart card overriding global 2D/3D preset | M3 | R3 |
| 25 | Official BEM UNDIP Watermark | Infographic card footer watermark ("Biro Statistika BEM Universitas Diponegoro") | M3 | R3 |
| 26 | High-Resolution 3x Canvas Export | Native ~300 DPI rasterization (2400x1500 px) via ECharts getDataURL without clipping | M4 | R4, AC |
| 27 | Anti-Clipping Geometry & Padding | Dynamic margin safety clearance and auto-wrapping for long Indonesian category labels | M4 | R4, AC |
| 28 | Single Chart PNG Export | One-click 3x PNG download for any individual chart card | M4 | R4 |
| 29 | High-Res Batch ZIP Packaging | In-memory sequential JSZip batch bundling of all charts + SURVEY_SUMMARY_AUDIT.txt | M4 | R4, AC |
| 30 | Opaque-Box E2E Test Suite | Comprehensive 4-tier test suite covering Tiers 1-4 with sample datasets | E2E Track | Arch, AC |
| 31 | Adversarial Coverage Hardening | Tier 5 white-box challenger testing & Forensic Integrity Audit | M5 | Arch |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Ingestion & Schema Profiling Engine | Features 1–10: CSV/XLSX parser, header trimmer, PII filter, 5 question classifiers, multi-select splitter, bundled demo data | None | DONE |
| M2 | Recommendation Engine & Curation Studio | Features 11–18: Chart recommendation heuristics, prohibited chart rules, curation override table, offline statistics, Gemini toggle | M1 | IN_PROGRESS |
| M3 | Theming & Visual Craftsmanship Studio | Features 19–25: 6 typography fonts, 4 institutional palettes, custom hex validator (>=5), 2D Flat & 2.5D Isometric styling, watermark | M2 | PLANNED |
| M4 | High-Resolution Batch Export & Asset Packaging | Features 26–29: 3x DPI (~300 DPI) canvas exporter, anti-clipping label layout, single PNG download, JSZip batch archive | M3 | PLANNED |
| M5 | Final Milestone: E2E Test Pass & Hardening | Features 30–31: Phase 1 pass 100% E2E test suite (Tiers 1-4); Phase 2 Tier 5 Adversarial Coverage Hardening & Forensic Audit | M4, E2E Track | PLANNED |
| E2E | E2E Testing Track | Independent opaque-box test runner & test cases (Tiers 1-4) derived from ORIGINAL_REQUEST.md | None (Parallel) | DONE |

---

## Interface Contracts

### `src/types/survey.ts`
```typescript
export type QuestionType =
  | 'METADATA_PII'
  | 'DICHOTOMOUS_BINARY'
  | 'LIKERT_SCALE'
  | 'MULTI_SELECT_CHECKBOX'
  | 'NOMINAL_DEMOGRAPHIC'
  | 'OPEN_ENDED_TEXT';

export type ChartType =
  | 'donut'
  | 'vertical_bar'
  | 'horizontal_bar'
  | 'ranked_bar'
  | 'ordered_likert'
  | 'text_feed'
  | 'none';

export interface ColumnProfile {
  id: string;
  columnIndex: number;
  rawName: string;
  cleanName: string;
  displayTitle: string;
  type: QuestionType;
  isPII: boolean;
  isExcluded: boolean;
  recommendedChart: ChartType;
  selectedChart: ChartType;
  totalResponses: number;
  validResponses: number;
  missingResponses: number;
  uniqueValuesCount: number;
  distribution: Record<string, number>;
  likertScale?: {
    min: number;
    max: number;
    labels: Record<number, string>;
    mean: number;
    median: number;
    netPositivePercent: number; // % scoring 4 or 5
  };
  multiSelect?: {
    totalSelections: number;
    averageSelectionsPerRespondent: number;
    tokenFrequencies: Array<{ token: string; count: number; percentage: number }>;
  };
  offlineSummary: string;
  aiNarrative?: string;
}

export interface SurveyDataset {
  id: string;
  name: string;
  fileName: string;
  rowCount: number;
  columns: ColumnProfile[];
  rawRows: Record<string, string>[];
}
```

### `src/types/theming.ts`
```typescript
export type FontFamily =
  | 'Poppins'
  | 'Montserrat'
  | 'Inter'
  | 'Plus Jakarta Sans'
  | 'Roboto'
  | 'Merriweather';

export type PaletteId =
  | 'undip_navy_gold'
  | 'modern_emerald'
  | 'executive_pastel'
  | 'warm_sunset'
  | 'custom';

export interface ColorPalette {
  id: PaletteId;
  name: string;
  colors: string[]; // Minimum 5 hex strings
  isCustom?: boolean;
}

export type DimensionalityMode = '2d' | '3d';

export interface ThemeConfig {
  fontFamily: FontFamily;
  titleFontSize: number;
  labelFontSize: number;
  activePaletteId: PaletteId;
  activePalette: ColorPalette;
  customPalette: ColorPalette;
  globalDimensionality: DimensionalityMode;
  showWatermark: boolean;
  watermarkText: string;
}
```

### `src/types/export.ts`
```typescript
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

---

## Code Layout
```
bem_undip_stat_app/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── public/
│   └── undip_logo.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   ├── survey.ts
│   │   ├── theming.ts
│   │   └── export.ts
│   ├── core/
│   │   ├── parser/
│   │   │   ├── csvParser.ts
│   │   │   ├── excelParser.ts
│   │   │   └── piiFilter.ts
│   │   ├── profiler/
│   │   │   ├── questionClassifier.ts
│   │   │   ├── multiSelectSplitter.ts
│   │   │   └── statistics.ts
│   │   ├── recommender/
│   │   │   ├── chartHeuristics.ts
│   │   │   └── prohibitedRules.ts
│   │   ├── theming/
│   │   │   ├── palettes.ts
│   │   │   ├── paletteValidator.ts
│   │   │   └── typography.ts
│   │   └── export/
│   │       ├── canvasExporter.ts
│   │       └── zipPackager.ts
│   ├── services/
│   │   ├── demoDataService.ts
│   │   └── geminiService.ts
│   ├── data/
│   │   ├── demoSurvey1.ts
│   │   └── demoSurvey2.ts
│   └── components/
│       ├── layout/
│       │   ├── Header.tsx
│       │   ├── Footer.tsx
│       │   └── TabNavigation.tsx
│       ├── ingestion/
│       │   ├── FileUploadZone.tsx
│       │   ├── DemoDataLoader.tsx
│       │   └── IngestionSummary.tsx
│       ├── curation/
│       │   ├── CurationTable.tsx
│       │   └── ColumnDetailModal.tsx
│       ├── studio/
│       │   ├── ThemingStudio.tsx
│       │   ├── ChartCard.tsx
│       │   ├── EChartsRenderer.tsx
│       │   ├── CustomPaletteModal.tsx
│       │   └── WatermarkFooter.tsx
│       └── export/
│           ├── BatchExportModal.tsx
│           └── ExportAuditSummary.tsx
└── tests/
    ├── e2e/
    │   ├── runner.cjs
    │   ├── tier1_feature_coverage.test.cjs
    │   ├── tier2_boundary_corner.test.cjs
    │   ├── tier3_cross_feature.test.cjs
    │   └── tier4_real_world_workloads.test.cjs
    └── fixtures/
```
