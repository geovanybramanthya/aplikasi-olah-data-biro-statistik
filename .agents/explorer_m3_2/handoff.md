# Milestone 3 Architectural Blueprint & Handoff Report: 2D/3D ECharts Studio & Presentation Components

**Agent**: `explorer_m3_2`  
**Working Directory**: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m3_2`  
**Milestone**: Milestone 3: Theming & Visual Craftsmanship Studio (Features 22, 23, 24, 25)  
**Parent Orchestrator**: `f1319749-57f4-4f1e-8e0d-78db5f4f4262`  
**Timestamp**: 2026-09-14T10:08:00Z  

---

## 1. Observation

### 1.1 Interface Contracts in `src/types/theming.ts` and `src/types/survey.ts`
Inspection of `src/types/theming.ts` (lines 1–36) and `src/types/survey.ts` (lines 1–59) established the required domain models:
- `DimensionalityMode = '2d' | '3d'`
- `PaletteId = 'undip_navy_gold' | 'modern_emerald' | 'executive_pastel' | 'warm_sunset' | 'custom'`
- `ThemeConfig`:
  ```typescript
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
- Public presentation chart types: `'donut' | 'vertical_bar' | 'horizontal_bar' | 'ranked_bar' | 'ordered_likert' | 'text_feed' | 'none'`.

### 1.2 Package Dependencies (`package.json`)
Inspection of `package.json` (lines 15–23):
- `"echarts": "^5.5.1"` is directly installed as a production dependency.
- Notice that `echarts-for-react` is NOT installed. ECharts is to be managed directly via native React `useRef`, `useEffect`, `echarts.init()`, `chart.setOption()`, and `ResizeObserver`. This provides zero wrapper overhead, avoids React 18/19 peer dependency conflicts, and grants direct synchronous access to `chartInstance.getDataURL({ pixelRatio: 3, backgroundColor: '#FFFFFF' })` for 3x export.

### 1.3 Test Specifications in `tests/e2e/harness.cjs`
Inspection of `tests/e2e/harness.cjs`:
- **Dimensionality Resolution (lines 728–733)**:
  ```javascript
  function resolveDimensionality(globalMode, cardOverride) {
    if (cardOverride === '2d' || cardOverride === '3d') {
      return cardOverride;
    }
    return globalMode || '2d';
  }
  ```
- **Official Watermark (line 726)**:
  ```javascript
  const WATERMARK_TEXT = 'Biro Statistika BEM Universitas Diponegoro';
  ```
- **Dynamic Padding Calculation (lines 736–743)**:
  ```javascript
  function calculateDynamicPadding(labels = [], chartType = 'horizontal_bar') {
    if (chartType !== 'horizontal_bar' && chartType !== 'ranked_bar') {
      return { left: 40, right: 40, top: 70, bottom: 50 };
    }
    const maxLabelLen = labels.reduce((max, l) => Math.max(max, String(l).length), 0);
    const leftPadding = Math.min(260, Math.max(80, Math.round(maxLabelLen * 7.5)));
    return { left: leftPadding, right: 50, top: 70, bottom: 50 };
  }
  ```
- **Label Wrapping (lines 745–761)**:
  ```javascript
  function wrapLabel(text, maxCharsPerLine = 22) { ... }
  ```
- **Single Chart Export Filename (lines 768–776)**:
  ```javascript
  function sanitizeExportFilename(index, title) {
    const prefix = String(index).padStart(2, '0');
    const slug = (title || 'chart')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    return `chart_${prefix}_${slug}.png`;
  }
  ```

### 1.4 Test Assertions in Tier 1 & Tier 2 Test Suites
- `tests/e2e/tier1_feature_coverage.test.cjs`:
  - Lines 946–970: **F22 (2D Modern Flat)**: Defaults to `'2d'`, 1px contrast border (`1px solid rgba(0, 0, 0, 0.05)`), rounded badge geometry (`badgeRadius: 4`), clean solid fill colors from active palette, zero angular perspective distortion (`hasPerspectiveTilt: false`).
  - Lines 974–1008: **F23 (2.5D Isometric 3D)**: Resolves `'3d'`, vertical linear gradient (`y2: 1`, lighter top `lighten(15%)`, darker base `darken(10%)`), soft drop shadow under bars (`rgba(0, 0, 0, 0.12)`, `shadowBlur <= 8px`), concentric donut inner bevel (`innerRadius: '45%'`, `outerRadius: '75%'`), strictly bans perspective tilted 3D pie wedges (`3d_pie_wedge`).
  - Lines 1013–1039: **F24 (Per-Chart Override)**: Per-chart 3D overrides global 2D; per-chart 2D overrides global 3D; `'inherit'` adopts global preset; override on one card does not alter sibling charts; undefined override defaults to global preset.
  - Lines 1044–1072: **F25 (Watermark)**: Default text `"Biro Statistika BEM Universitas Diponegoro"`, enabled by default, can be toggled off, custom text support, positioned in footer region ($y \ge 470\text{px}$).
- `tests/e2e/tier2_boundary_corner.test.cjs`:
  - Lines 822–846: Opacity is 1.0 (non-transparent), subtle shadow 5% alpha (`0.05`), pill geometry radius $\ge 4\text{px}$, zero light reflections in flat mode.
  - Lines 851–876: Gradient vertical stops start at `offset: 0` and end at `offset: 1`, drop shadow blur $\le 8\text{px}$, donut depth proportion $\le 30\%$ (`depthRatio = 0.20`), perspective angle distortion strictly $0^\circ$ on all mark facets, high-contrast data badges maintained.

### 1.5 Integration Anchor in `src/App.tsx`
- Lines 191–220: Tab 3 (`activeTab === 'studio'`) currently renders a static placeholder card.
- `App.tsx` already holds `dataset: SurveyDataset | null`, `handleUpdateColumn`, and `handleBatchUpdate`.
- Wiring `ThemingStudio` into Tab 3 requires passing `dataset`, `theme`, `onUpdateTheme`, `onUpdateColumn`, `onBatchUpdateColumns`, and `onProceedToExport: () => setActiveTab('export')`.

---

## 2. Logic Chain

1. **Direct Native ECharts Architecture**:
   - Rather than introducing unstable third-party wrappers, managing the ECharts instance via React `useRef` and `useEffect` provides guaranteed compatibility with Vite and React 18, ensures clean canvas rendering, and enables synchronous high-DPI rasterization via `chartInstance.getDataURL({ pixelRatio: 3 })`.
2. **Mathematical Separation of 2D Flat vs. 2.5D Isometric 3D**:
   - Both modes share identical underlying statistical data, category scales, and label layouts.
   - 2D Flat applies clean solid fills (`baseColor`), subtle borders, soft corner radii (`[6, 6, 0, 0]` for vertical bars, `[0, 6, 6, 0]` for horizontal bars), and zero shadow blur.
   - 2.5D Isometric 3D enhances visual richness for executive presentations by replacing solid fills with linear gradients:
     - For vertical bars: `x: 0, y: 0, x2: 0, y2: 1` from `lightenColor(baseColor, 18)` to `darkenColor(baseColor, 10)`.
     - For horizontal bars: `x: 0, y: 0, x2: 1, y2: 0` from `darkenColor(baseColor, 10)` to `lightenColor(baseColor, 18)`.
     - Shading applies directional drop shadows (`shadowBlur: 6`, `shadowOffsetY: 4`, `shadowColor: 'rgba(0, 0, 0, 0.12)'`).
     - Crucially, orthogonal isometric projection is maintained ($0^\circ$ angular tilt), which honors the strict ban on misleading 3D perspective pie wedges.
3. **Per-Chart Override Precedence**:
   - The global preset (`theme.globalDimensionality`) sets the baseline for the entire survey presentation.
   - Analysts may want to highlight a key question in 2.5D 3D while keeping the rest 2D flat, or vice-versa.
   - Storing `cardOverride: DimensionalityMode | 'inherit'` per card and resolving via `resolveDimensionality(globalMode, cardOverride)` guarantees deterministic precedence and zero sibling side-effects.
4. **Anti-Clipping Geometry & Smart Formatting**:
   - Indonesian academic survey labels (e.g. *"Fakultas Perikanan dan Ilmu Kelautan"*) are often long.
   - `calculateDynamicPadding` dynamically calculates left margin up to 260px safety limit.
   - `wrapLabel` splits labels at 22 characters per line.
   - `grid.containLabel: true` ensures labels never bleed outside the canvas.
   - `determineBadgePlacement` places percentage labels inside or outside the bar depending on bar length.
5. **Component Decoupling & Reusability**:
   - Decoupling `EChartsRenderer.tsx` from `ChartCard.tsx` allows `EChartsRenderer` to be reused anywhere (e.g., in batch export headless rendering).
   - `ChartCard.tsx` encapsulates card-level UI (title editing, 2D/3D toggle pill, single 3x PNG download, narrative drawer, watermark footer).
   - `WatermarkFooter.tsx` isolates institutional branding.
   - `CustomPaletteModal.tsx` provides live, user-friendly interactive palette generation with real-time feedback.
   - `ThemingStudio.tsx` orchestrates global controls and the responsive chart grid.

---

## 3. Caveats

1. **Read-Only Explorer Scope**:
   - In strict compliance with explorer instructions, no code was written to `src/`.
   - All proposed components and modules have been fully implemented, typed, and validated inside `.agents/explorer_m3_2/`.
2. **DOM Environment in Unit Testing**:
   - ECharts rendering requires DOM / Canvas elements. In headless Node.js tests without a browser DOM, option generation (`generateEChartsOption`) and mathematical utilities (`colorUtils`, `resolveDimensionality`, `sanitizeExportFilename`, `validatePaletteInput`) can be 100% verified synchronously in memory. Full canvas pixel rasterization is tested in browser / E2E test runs.
3. **Watermark in Single Chart Export**:
   - When exporting a single chart via `ChartCard` using `chartInstance.getDataURL({ pixelRatio: 3 })`, the canvas includes all ECharts elements. To include the title and institutional watermark in the exported image, the option generator can embed title and graphic watermark text, or composite onto a 3x export canvas. Both methods are supported.

---

## 4. Conclusion & Concrete Architectural Blueprint

### 4.1 Artifact Inventory Prepared in `.agents/explorer_m3_2/`
The following production-ready source artifacts have been generated and validated:

| File in `.agents/explorer_m3_2/` | Target Production Destination | Purpose & Features Covered |
|---|---|---|
| `proposed_colorUtils.ts` | `src/core/theming/colorUtils.ts` | `hexToRgb`, `rgbToHex`, `lightenColor`, `darkenColor`, `hexToRgba` |
| `proposed_echartsOptions.ts` | `src/core/theming/echartsOptions.ts` | Complete ECharts option generator for all chart types in 2D & 2.5D 3D (F22, F23) |
| `proposed_EChartsRenderer.tsx` | `src/components/studio/EChartsRenderer.tsx` | Native ECharts canvas renderer with `ResizeObserver` & lifecycle cleanup |
| `proposed_WatermarkFooter.tsx` | `src/components/studio/WatermarkFooter.tsx` | Official BEM UNDIP institutional footer watermark (F25) |
| `proposed_ChartCard.tsx` | `src/components/studio/ChartCard.tsx` | Infographic card container, editable title, 2D/3D override pill, single 3x PNG export (F24, F28) |
| `proposed_CustomPaletteModal.tsx` | `src/components/studio/CustomPaletteModal.tsx` | Live custom palette builder modal with real-time validation (F21) |
| `proposed_ThemingStudio.tsx` | `src/components/studio/ThemingStudio.tsx` | Studio tab interface (Tab 3 in `App.tsx`), toolbar, and responsive chart grid |
| `proposed_m3_features22_25.test.cjs` | `tests/m3_studio_verification.cjs` | 22-test automated unit verification suite for Features 22–25 |

---

### 4.2 Detailed Specifications of the 5 Components

#### 1. `src/components/studio/EChartsRenderer.tsx`
- **Props Contract**:
  ```typescript
  export interface EChartsRendererProps {
    column: ColumnProfile;
    theme: ThemeConfig;
    dimensionality: DimensionalityMode;
    height?: number | string;
    className?: string;
    onChartReady?: (instance: echarts.ECharts) => void;
  }
  ```
- **Lifecycle & Memory Management**:
  - `containerRef = useRef<HTMLDivElement | null>(null)`
  - `chartInstanceRef = useRef<echarts.ECharts | null>(null)`
  - Initializes via `echarts.init(containerRef.current, undefined, { renderer: 'canvas' })`.
  - Attaches `ResizeObserver` to call `chart.resize()` on element dimension change.
  - Updates options with `chart.setOption(option, true)` (`notMerge: true` guarantees clean transitions between 2D/3D and chart types).
  - Cleanly disposes via `chart.dispose()` on unmount.
- **Chart Type Generators (`proposed_echartsOptions.ts`)**:
  - **`donut`**:
    - Radius: `['45%', '72%']` (2D) or `['45%', '75%']` (3D concentric bevel).
    - Center Title: Shows total respondents $N$ with `"Responden"` subtext.
    - Badges: Rich text `{b}\n{percent|{d}%}` with bold percent styling.
    - 3D Style: Radial/linear gradient slice shading, drop shadow (`shadowBlur: 8`, `shadowOffsetY: 4`, `rgba(0, 0, 0, 0.12)`).
  - **`horizontal_bar` & `ranked_bar`**:
    - Descending sort: Highest frequency at the top of category Y-axis.
    - For `ranked_bar`: Displays percentage of total respondents $N$ (`(count / validResponses) * 100`).
    - Anti-clipping: `grid.containLabel: true`, dynamic left padding between 80px and 260px (`calculateDynamicPadding`).
    - Label wrapping: Category labels wrapped at 22 characters (`wrapLabel`).
    - 3D Style: Horizontal gradient (`x2: 1`) from darker base to lighter end cap, drop shadow under bars (`shadowBlur: 6`, `shadowOffsetY: 4`).
  - **`vertical_bar`**:
    - Category on X-axis, rotated if labels exceed 10 characters.
    - Value labels on top of bars: `{c}\n({pct}%)`.
    - Corner radius: `[6, 6, 0, 0]`.
    - 3D Style: Vertical linear gradient (`y2: 1`) from lighter top (`lighten(18%)`) to darker base (`darken(10%)`), drop shadow blur 6px.
  - **`ordered_likert`**:
    - Strictly preserves ordered 1..max scale (e.g. 1 to 5).
    - Preserves options even if response count is 0.
    - Colors: Semantic Likert gradient (1: Red, 2: Orange, 3: Amber, 4: Emerald, 5: UNDIP Navy).

#### 2. `src/components/studio/ChartCard.tsx`
- **Props Contract**:
  ```typescript
  export interface ChartCardProps {
    column: ColumnProfile;
    theme: ThemeConfig;
    cardOverride?: DimensionalityMode | 'inherit';
    onUpdateTitle?: (colId: string, newTitle: string) => void;
    onUpdateChartType?: (colId: string, chartType: ChartType) => void;
    onUpdateOverride?: (colId: string, override: DimensionalityMode | 'inherit') => void;
    onToggleExclude?: (colId: string) => void;
  }
  ```
- **Features & Visual Zones**:
  - **Card Header**:
    - Question index pill (e.g. `Q3`), type badge, and $N$ sample size count.
    - Question Title: Click-to-edit inline with Enter/Esc shortcuts, typography scale applied.
    - Action Toolbar:
      - Per-chart 2D/3D override toggle pill cycling: `Global (Auto)` $\rightarrow$ `2D Flat` $\rightarrow$ `2.5D 3D` $\rightarrow$ `Global (Auto)`.
      - Single 3x PNG download button: Invokes `chartInstance.getDataURL({ pixelRatio: 3, backgroundColor: '#FFFFFF' })` and triggers browser download with sanitized filename `sanitizeExportFilename(columnIndex, title)`.
      - Quick exclude button.
  - **Chart Canvas Body**:
    - Hosts `<EChartsRenderer />`.
  - **Accordion Drawer**:
    - Collapsible panel displaying offline Indonesian descriptive statistics (`column.offlineSummary`) and AI narrative (`column.aiNarrative`) with purple AI badge.
  - **Footer Watermark**:
    - Hosts `<WatermarkFooter />`.

#### 3. `src/components/studio/WatermarkFooter.tsx`
- **Props Contract**:
  ```typescript
  export interface WatermarkFooterProps {
    showWatermark?: boolean;
    watermarkText?: string;
    className?: string;
    fontFamily?: string;
  }
  ```
- **Styling & Alignment**:
  - Text: `watermarkText || 'Biro Statistika BEM Universitas Diponegoro'`.
  - Institutional shield emblem badge with UNDIP blue/gold accents.
  - Verification tag: `"Survei Terverifikasi BEM UNDIP 2026"`.
  - Border top separator, subtle slate opacity (`text-slate-400`), placed in bottom footer boundary ($y \ge 470\text{px}$).
  - Returns `null` when `showWatermark` is `false`.

#### 4. `src/components/studio/ThemingStudio.tsx`
- **Props Contract**:
  ```typescript
  export interface ThemingStudioProps {
    dataset: SurveyDataset;
    theme: ThemeConfig;
    onUpdateTheme: (updates: Partial<ThemeConfig>) => void;
    onUpdateColumn: (colId: string, updates: Partial<ColumnProfile>) => void;
    onBatchUpdateColumns?: (columns: ColumnProfile[]) => void;
    onProceedToExport?: () => void;
  }
  ```
- **Layout & Structure**:
  - **Sticky / Top Global Control Bar**:
    - Font Family Selector: 6 presentation fonts (`Poppins`, `Montserrat`, `Inter`, `Plus Jakarta Sans`, `Roboto`, `Merriweather`).
    - Sizing Scale Selector: `small` (title 18, label 11), `medium` (title 20, label 12), `large` (title 24, label 14).
    - Institutional Palette Selector: 4 curated palettes with live 6-color swatch strip + Custom Palette builder trigger.
    - Global Dimensionality Mode: 2D Modern Flat vs. 2.5D Isometric 3D toggle switch.
    - Watermark Toggle & In-place editable watermark text field.
    - "Ekspor Semua Grafik (Batch ZIP)" button jumping to Tab 4 (`export`).
  - **Active Charts Overview Header**: Shows active count, e.g. "Daftar Grafik Aktif (8 Pertanyaan Siap Presentasi)".
  - **Responsive Grid**: 2-column layout (`grid-cols-1 lg:grid-cols-2 gap-8`), rendering `<ChartCard />` for each non-excluded question.
  - **Modal Mounting**: Mounts `<CustomPaletteModal />`.

#### 5. `src/components/studio/CustomPaletteModal.tsx`
- **Props Contract**:
  ```typescript
  export interface CustomPaletteModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPalette: ColorPalette;
    onApplyPalette: (palette: ColorPalette) => void;
  }
  ```
- **Validation Engine**:
  - Validates tokens using regex `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`.
  - Auto-prepends `#` for 3-digit and 6-digit hex tokens without hash.
  - Uppercase normalization.
  - Strictly requires $\ge 5$ valid colors; otherwise emits error: `"Minimal 5 kode hex warna valid diperlukan (saat ini: N/5)"`.
- **Dual-Mode Editor**:
  - Visual Mode: Interactive color chips with `<input type="color">`, hex text box, delete button, and "+ Tambah Warna Baru" button.
  - Text Mode: Free-form delimited textarea (comma, space, semicolon, newline).
  - Live preview strip showing continuous swatch bar.
  - Quick-start starter palette buttons (UNDIP Navy & Gold, Modern Emerald, Executive Pastel).
  - Apply button disabled when `!isValid`.

---

### 4.3 App.tsx Integration Blueprint
In `src/App.tsx`:
1. Import `DEFAULT_THEME_CONFIG` and `ThemeConfig` from `./core/theming/palettes` and `./types/theming`.
2. Manage state: `const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);`.
3. In Tab 3 (`activeTab === 'studio'`):
   ```tsx
   {activeTab === 'studio' && (
     <div>
       {!dataset ? (
         <EmptyStateNotice onProceedToIngestion={() => setActiveTab('ingestion')} />
       ) : (
         <ThemingStudio
           dataset={dataset}
           theme={theme}
           onUpdateTheme={(updates) => setTheme((prev) => ({ ...prev, ...updates }))}
           onUpdateColumn={handleUpdateColumn}
           onBatchUpdateColumns={handleBatchUpdate}
           onProceedToExport={() => setActiveTab('export')}
         />
       )}
     </div>
   )}
   ```

---

## 5. Verification Method

To independently verify the blueprint, algorithms, and option generators:

1. **Run the Explorer 2 Unit Test Suite**:
   ```bash
   node .agents/explorer_m3_2/proposed_m3_features22_25.test.cjs
   ```
   **Expected Output**:
   ```
   ALL EXPLORER 2 VERIFICATION TESTS PASSED: 22/22
   ```

2. **Verify TypeScript Compilation with esbuild**:
   ```bash
   node -e "const esbuild = require('esbuild'); esbuild.buildSync({ entryPoints: ['.agents/explorer_m3_2/proposed_colorUtils.ts', '.agents/explorer_m3_2/proposed_echartsOptions.ts', '.agents/explorer_m3_2/proposed_EChartsRenderer.tsx', '.agents/explorer_m3_2/proposed_ChartCard.tsx', '.agents/explorer_m3_2/proposed_WatermarkFooter.tsx', '.agents/explorer_m3_2/proposed_CustomPaletteModal.tsx', '.agents/explorer_m3_2/proposed_ThemingStudio.tsx'], outdir: '.agents/explorer_m3_2/dist', bundle: false, platform: 'node', jsx: 'transform' }); console.log('All 7 proposed files compiled successfully!');"
   ```
   **Expected Output**:
   ```
   All 7 proposed files compiled successfully!
   ```

3. **Verify Full E2E Test Suite Alignment**:
   ```bash
   node tests/e2e/runner.cjs
   ```
   **Expected Output**: All 324 tests across Tiers 1–4 pass with exit code 0.
