# Handoff Report: Survey Explorer 2 (Technical Architecture & Visual Engine)

**Agent ID**: `survey_explorer_2`  
**Role**: Technical Architecture, Charting Engine & Visual Stylist  
**Target Milestone**: Discovery / Architecture Blueprint  
**Timestamp**: 2026-09-14T08:50:00Z  

---

## 1. Observation

### 1.1 Host Environment & Available Runtimes
Direct terminal queries on this Windows host (`powershell.exe`) revealed the following verified environment versions:
- **Node.js**: `v26.3.0` (exited code 0)
- **npm**: `12.0.2` (exited code 0)
- **npx**: `12.0.2` (exited code 0)
- **Python**: `3.14.5` (exited code 0)
- **Git**: `git version 2.54.0.windows.1` (exited code 0)
- **npm Registry Latency**: `npm notice PING https://registry.npmjs.org/ -> PONG 368ms` (exited code 0)

### 1.2 Target NPM Ecosystem Availability
Verified active package registry availability and current versions:
- `echarts`: `6.1.0` (active, mature, native high-DPI canvas export)
- `papaparse`: `5.7.0` (standard for streaming/in-memory CSV parsing with quoted strings & auto-delimiter detection)
- `xlsx` (SheetJS): `0.18.5` (supports `.xlsx` and `.xls` workbook parsing in pure browser JavaScript)
- `jszip`: `3.10.2` (in-memory multi-file zip compression)
- `lucide-react`: `1.45.0` (clean, modern iconography)

### 1.3 Sample Datasets Verified
The following survey datasets exist locally in `C:\Users\geova\.gemini\antigravity\raw`:
- `survey_sample_1.csv`: 93,842 bytes (UPGRADING BEM UNDIP Survey; nominal, Likert, multi-select checkboxes).
- `survey_sample_2.csv`: 45,222 bytes (Campus Safety & Catcalling Survey; sensitive demographics, binary Ya/Tidak, Likert ratings).
- `Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx`: 42,460 bytes (Official UNDIP real survey in native Excel format).

---

## 2. Logic Chain

### 2.1 Architecture Selection: Client-Side SPA vs Client-Server vs Streamlit
1. **Observation**: Google Forms exports typically contain 100 to 5,000 rows and 5 to 40 columns (e.g. `survey_sample_1.csv` is ~93KB, `survey_sample_2.csv` is ~45KB).
2. **Inference**: Ingesting and profiling a 100KB dataset in JavaScript takes < 25ms using `PapaParse` and `SheetJS`. Transmitting raw survey data over HTTP to a Python backend adds network latency and serialisation overhead.
3. **Data Privacy Invariant**: Survey datasets from student unions (BEM) often capture sensitive campus climate, catcalling reports, student faculty affiliations, or organizational critiques. A **100% Client-Side Single Page Application (SPA)** guarantees zero student data ever leaves the user's browser, satisfying strict institutional confidentiality.
4. **Export Fidelity**: If charts were rendered on a server (e.g. Python Matplotlib/Seaborn), the server would have to duplicate the interactive theming engine (fonts, colors, 2D/3D bevels, overrides). In contrast, a client-side architecture renders the exact same DOM/Canvas that the user customized in the UI.
5. **Conclusion**: **Pure Client-Side React 19/18 + TypeScript + Vite + Tailwind CSS** is the optimal, zero-friction architecture.

### 2.2 Charting Library Evaluation: Apache ECharts vs Chart.js vs Plotly
1. **Requirements**:
   - 2D Modern Flat charts (Donut with percentage badges, Vertical/Horizontal bars with value labels, Ranked checkbox bars, Ordered Likert bars).
   - 3D Visual styling (depth, isometric lighting, bevels).
   - Dynamic custom font rendering across 6 Google Fonts.
   - High-resolution batch export at 3x scale (~300 DPI) without label cropping or text overlap.
2. **Chart.js Assessment**:
   - Requires external plugins (`chartjs-plugin-datalabels`) for data labels.
   - Lacks native 3D/isometric capabilities (requires hacky community extensions).
   - DPI scaling for export requires manually rebuilding canvas contexts.
3. **Plotly.js Assessment**:
   - Heavy bundle (> 3.5 MB minified).
   - Focuses on dense multi-axis scientific plots, which violates the requirement to *"Prohibit overly complex/confusing charts (no radar charts, curve balls, or dense multi-axis plots)"*.
4. **Apache ECharts Assessment**:
   - **Native 3x Scale Export**: `chartInstance.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#ffffff' })` is an official, built-in, synchronous vector-to-canvas rasterizer. Zero external screenshotting libraries (no `html2canvas`) required!
   - **Anti-Clipping Geometry**: `grid: { containLabel: true }` dynamically calculates bounding boxes for long Indonesian categorical text.
   - **Rich Label Formatting**: Supports rich text badges (`label: { formatter: '{b}\n{d}%', rich: { ... } }`) and value labels (`position: 'top' | 'right'`).
   - **Conclusion**: **Apache ECharts** is selected as the primary visual and charting engine.

### 2.3 Dimensionality Engine: 2D Modern Flat vs 3D Visual Styling
1. **2D Modern Flat**:
   - Soft rounded bar corners (`borderRadius: [8, 8, 0, 0]` for vertical, `[0, 8, 8, 0]` for horizontal).
   - Clean donut geometry (inner radius `60%`, outer radius `80%`, subtle white segment dividers `borderWidth: 2`).
   - Flat color fills with high-contrast text badges.
2. **3D Visual Styling**:
   - *WebGL `echarts-gl` evaluation*: WebGL introduces GPU driver dependency, context loss on low-end machines, and occasional blank/black frames during high-resolution headless exports.
   - *Engineered 2.5D Isometric 3D in ECharts*:
     - Vertical Bar 3D: Multi-facet isometric prism or cylindrical gradient shading with an illuminated top-cap ellipse and directional side shadow (`shadowBlur: 14`, `shadowOffsetY: 8`).
     - Horizontal Bar 3D: Cylindrical gradient with end-cap depth.
     - Donut 3D: Multi-layer concentric depth ring with cast gaussian drop shadow (`shadowBlur: 20`, `shadowOffsetY: 12`, `shadowColor: 'rgba(0,0,0,0.22)'`) and beveled radial illumination.
   - **Per-Chart Override**: Global theme toggle sets default dimensionality (`mode: '2d' | '3d'`), while each chart card maintains an individual override pill (`2D` / `3D`) in its header.

### 2.4 Typography & Font Injection Strategy
1. **Required Fonts**:
   - `Poppins` (Geometric, clean presentation standard)
   - `Montserrat` (Bold, structural editorial sans)
   - `Inter` (Neutral, modern data visualization standard)
   - `Plus Jakarta Sans` (Indonesian government/institutional standard)
   - `Roboto` (Workhorse clean sans)
   - `Merriweather` (Formal academic/senate serif)
2. **Canvas Font Invariant**:
   - When a browser renders canvas text before web fonts have finished downloading, it falls back to system fonts (e.g. Arial or Times New Roman).
   - Solution: The export pipeline must execute `await document.fonts.ready` and trigger a brief chart re-render before capturing the canvas to guarantee that every exported PNG uses the exact selected typeface.

### 2.5 Institutional Palettes & Custom Hex Validator
1. **Curated Palettes**:
   - **UNDIP Navy & Gold**: `['#0C2340', '#D97706', '#1E40AF', '#F59E0B', '#FCD34D', '#3B82F6', '#64748B']`
   - **Modern Emerald**: `['#059669', '#0D9488', '#10B981', '#34D399', '#6EE7B7', '#065F46', '#A7F3D0']`
   - **Executive Pastel**: `['#6366F1', '#8B5CF6', '#F43F5E', '#38BDF8', '#FB923C', '#34D399', '#94A3B8']`
   - **Warm Sunset**: `['#EA580C', '#DC2626', '#F59E0B', '#E11D48', '#FB923C', '#991B1B', '#FDE047']`
2. **Custom Palette Builder**:
   - Requirement: Enforces validation of **`>= 5` valid hex codes**.
   - Validator logic:
     - Regex: `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`
     - Parser: Splits input by commas, spaces, or newlines, trims whitespace, verifies format.
     - State Gate: Custom palette is marked `valid: true` and applied to charts only when `validHexCodes.length >= 5`. Otherwise, displays helpful error message: *"Minimal 5 kode hex valid diperlukan (saat ini: N/5)"*.

### 2.6 High-Resolution Batch Export (~300 DPI) & ZIP Packaging
1. **Scale Factor & DPI**:
   - Canvas display: 800px x 500px at 1x (96 DPI).
   - At `pixelRatio: 3`: **2400px x 1500px (~300 DPI)**.
2. **Infographic Slide Card Formatting**:
   - Rather than exporting a raw headless chart, each PNG is composed with:
     - Title header: Question text + Category tag + Response count (`N = ...`).
     - Main chart: ECharts rendering at 3x scale.
     - Official Footer Watermark: `"Biro Statistika BEM Universitas Diponegoro • Sumber: Olah Data Survei"`.
3. **ZIP Batch Packaging**:
   - Handled via `jszip`.
   - Iterates through all curated charts sequentially to prevent browser memory spikes.
   - Files are sanitized and named sequentially: `01_Fakultas_Donut.png`, `02_Kepuasan_Likert.png`, etc.
   - Includes `SURVEY_SUMMARY_AUDIT.txt` containing column names, chart types, respondent counts, and statistical highlights.
   - Triggers one-click download using `URL.createObjectURL(blob)`.

### 2.7 Heuristics & Optional Gemini LLM Engine
1. **100% Offline Statistical Heuristics**:
   - Generates instant Indonesian narrative summaries for each chart without network calls:
     - Nominal/Binary: Dominant category, percentage share, margin over second place.
     - Likert: Mean score, Median, Net Positive / Agreement percentage (scores 4 & 5).
     - Multi-select: Top selected item, percentage of total respondents, average items selected per respondent.
2. **Optional Gemini AI Narrative**:
   - Toggle switch in UI.
   - User inputs Gemini API key (stored in `localStorage` or memory).
   - Calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}` directly from the browser.
   - Graceful Fallback: If network is offline, key is invalid, or quota is exceeded, app displays a non-blocking toast warning and seamlessly displays the offline statistical summary.

---

## 3. Caveats

1. **Browser Memory During Batch Export**:
   - Exporting 30+ charts simultaneously at 2400x1500px in parallel could consume > 500MB of RAM if all blobs are held uncompressed.
   - *Mitigation*: The batch exporter must render and append charts to `JSZip` **sequentially** (using an async loop with a small 50ms tick between renders), freeing each temporary canvas before rendering the next.
2. **Font Loading Delay**:
   - If the user switches fonts and immediately hits "Export ZIP", the canvas might capture before the new font finishes downloading.
   - *Mitigation*: The export pipeline must await `document.fonts.ready` and verify font status with `document.fonts.check()` before triggering the canvas capture.
3. **Offline Demo Data Availability**:
   - Users might open the web app without internet and without an uploaded file.
   - *Mitigation*: Pre-compile and bundle `survey_sample_1.csv` and `survey_sample_2.csv` as structured JSON constants inside the application build so "Load BEM UNDIP Demo Data" works 100% offline.

---

## 4. Conclusion & Recommended Technical Architecture

### 4.1 Recommended Technology Stack
| Layer | Recommended Choice | Rationale |
|---|---|---|
| **Runtime & Bundler** | Vite 6 / Node 26 | Instant HMR, lightning-fast ESM builds, zero backend daemon needed. |
| **Framework** | React 19 / 18 + TypeScript | Type-safe state management, robust ecosystem, component modularity. |
| **Styling** | Tailwind CSS + Lucide React | Modern executive aesthetic, responsive layout, dark/light theme ready. |
| **Charting Engine** | Apache ECharts (`echarts` 6.x) | Native 3x `getDataURL` export, rich label badges, robust 2D/3D visual styling, zero clipping. |
| **Data Ingestion** | PapaParse + SheetJS (`xlsx`) | Robust CSV (quoted commas, newlines) and Excel (`.xlsx`/`.xls`) parsing in browser memory. |
| **Packaging & Export** | JSZip + FileSaver | In-memory 300 DPI PNG batch compression and instant ZIP download. |
| **Heuristics & AI** | TypeScript Stats + Gemini 2.5 Flash | 100% offline statistical heuristics by default + optional Gemini narrative insight toggle. |

### 4.2 Concrete Directory & Module Structure
```
bem_undip_stat_app/
├── index.html                       # Entry point loading Google Fonts (6 required families)
├── package.json                     # Dependencies: react, echarts, papaparse, xlsx, jszip, lucide-react
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Palette token definitions (UNDIP Navy & Gold, etc.)
├── src/
│   ├── main.tsx                     # React root
│   ├── App.tsx                      # Top-level state & tab orchestration
│   ├── types/
│   │   ├── survey.ts                # Raw survey, profiled column, and question category types
│   │   ├── chart.ts                 # Chart configuration, dimensionality, palette, export types
│   │   └── insight.ts               # Heuristic metrics and narrative insight types
│   ├── core/
│   │   ├── parser/
│   │   │   ├── csvParser.ts         # PapaParse with auto-delimiter and string sanitization
│   │   │   ├── excelParser.ts       # SheetJS workbook reader
│   │   │   └── piiFilter.ts         # PII regex / keyword detector (Timestamp, Nama, NIM, Email)
│   │   ├── profiler/
│   │   │   ├── questionClassifier.ts# Categorizes Nominal, Binary, Likert, Multi-Select, Text
│   │   │   ├── multiSelectSplitter.ts# Splits comma-delimited responses into item frequencies
│   │   │   └── statistics.ts        # Offline statistical metrics (mean, median, mode, net positive)
│   │   ├── recommender/
│   │   │   ├── chartHeuristics.ts   # Maps question characteristics to optimal public charts
│   │   │   └── prohibitedRules.ts   # Blocks confusing radar, 3D exploded pie, and dense multi-axis
│   │   ├── theming/
│   │   │   ├── palettes.ts          # Curated palettes + active palette state
│   │   │   ├── paletteValidator.ts  # Strict >= 5 hex code regex validation
│   │   │   └── typography.ts        # Font families and fallback definitions
│   │   └── export/
│   │       ├── canvasExporter.ts    # 3x scale / 300 DPI rasterizer with BEM UNDIP watermark
│   │       └── zipPackager.ts       # Sequential JSZip bundling with progress tracking
│   ├── services/
│   │   ├── demoDataService.ts       # Bundled real BEM UNDIP survey datasets (offline ready)
│   │   └── geminiService.ts         # Optional Gemini API client with non-blocking error handling
│   └── components/
│       ├── layout/
│       │   ├── Header.tsx           # BEM UNDIP header branding and quick stats
│       │   ├── Footer.tsx           # Institutional attribution and credentials
│       │   └── TabNavigation.tsx    # Workflow steps (Ingestion -> Curation -> Studio -> Export)
│       ├── ingestion/
│       │   ├── FileUploadZone.tsx   # Drag-and-drop CSV / Excel
│       │   ├── DemoDataLoader.tsx   # One-click BEM UNDIP demo loader
│       │   └── IngestionSummary.tsx # Dataset overview (rows, columns, filtered PII)
│       ├── curation/
│       │   ├── CurationTable.tsx    # Interactive override table for chart types and titles
│       │   └── ColumnCard.tsx       # Distribution preview per column
│       ├── studio/
│       │   ├── ThemingStudio.tsx    # Global font, palette, custom hex builder, and 2D/3D toggle
│       │   ├── ChartCard.tsx        # High-aesthetic card, per-chart 2D/3D toggle, title editor
│       │   ├── EChartsRenderer.tsx  # ECharts wrapper with 2D Modern Flat & 2.5D Isometric Engine
│       │   └── WatermarkFooter.tsx  # Embedded BEM UNDIP watermark footer
│       └── export/
│           ├── BatchExportModal.tsx # Progress bar, resolution selector (1x, 2x, 3x HD), ZIP trigger
│           └── SingleExportButton.tsx # Quick 3x PNG download for individual charts
```

---

## 5. Verification Method

To independently verify these architectural conclusions:
1. **Runtime Verification**:
   ```powershell
   node -v      # Expect v26.3.0
   npm -v       # Expect 12.0.2
   npm ping     # Expect PONG < 500ms
   ```
2. **Package Version & Compatibility Verification**:
   ```powershell
   npm info echarts version     # Expect 6.1.0 or 5.x
   npm info papaparse version   # Expect 5.x
   npm info jszip version       # Expect 3.10.x
   npm info xlsx version        # Expect 0.18.x
   ```
3. **Export Resolution & Anti-Clipping Invalidation Test**:
   - Render a mock ECharts chart with container dimensions `800px x 500px`.
   - Call `chartInstance.getDataURL({ pixelRatio: 3 })`.
   - Inspect resulting image dimensions: MUST be exactly `2400px x 1500px`.
   - Check that text on longest labels (e.g. `Fakultas Perikanan dan Ilmu Kelautan`) is fully visible with no truncation when `grid: { containLabel: true }` is enabled.
4. **Palette Validator Invalidation Test**:
   - Provide 4 valid hex codes `['#002b49', '#d97706', '#1e40af', '#f59e0b']` -> Validator MUST reject (`isValid: false`, reason: `< 5 hex codes`).
   - Provide 5 valid hex codes `['#002b49', '#d97706', '#1e40af', '#f59e0b', '#3b82f6']` -> Validator MUST pass (`isValid: true`).
   - Provide invalid hex codes `['#xyz123', 'blue']` -> Validator MUST reject.
5. **Demo Data Bundling Invalidation Test**:
   - Disconnect network or simulate offline mode.
   - Click "Load BEM UNDIP Demo Data".
   - Dashboard MUST instantly populate with the real UPGRADING BEM UNDIP survey without throwing network errors.
