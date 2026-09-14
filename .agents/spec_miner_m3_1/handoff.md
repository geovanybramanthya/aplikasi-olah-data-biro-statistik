# Specification Mining Report: Milestone 3 (Features 19–25)
**BEM UNDIP Survey Analytics & Visualization Platform**  
**Agent:** `spec_miner_m3_1`  
**Working Directory:** `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\spec_miner_m3_1`  
**Timestamp:** 2026-09-14T10:02:00Z  

---

## Executive Summary
This authoritative specification report establishes the complete interface contracts, mathematical boundary rules, visual styling algorithms, and acceptance test criteria for **Milestone 3: Theming & Visual Craftsmanship Studio (Features 19–25)**.

All specifications have been cross-referenced and validated against:
1. `ORIGINAL_REQUEST.md` (R3: Theming & Visual Craftsmanship Studio & Acceptance Criteria)
2. `PROJECT.md` (Architecture, Code Layout, Interface Types)
3. `TEST_INFRA.md` (E2E Test Philosophy and Tier Structure)
4. `tests/e2e/harness.cjs` (Authoritative Specification Oracles)
5. `tests/e2e/tier1_feature_coverage.test.cjs` (F19–F25 Coverage Suite)
6. `tests/e2e/tier2_boundary_corner.test.cjs` (F19–F25 Boundary & Corner Suite)
7. `tests/e2e/tier3_cross_feature.test.cjs` (Theming Pairwise Integration Suite)
8. `tests/e2e/tier4_real_world_workloads.test.cjs` (Scenarios 1, 3, 4, 5 Real-World Workloads)

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| F19 | Typography | Presentation Fonts Library | Selectable presentation typography providing 6 pre-loaded Google Fonts with system fallbacks | `FontFamily` enum: `'Poppins'`, `'Montserrat'`, `'Inter'`, `'Plus Jakarta Sans'`, `'Roboto'`, `'Merriweather'` | Font family string applied to chart titles, subtitles, axis labels, badges, and tooltips | Unknown font falls back to `'Poppins'` or system sans-serif | `ORIGINAL_REQUEST.md` R3, `harness.cjs:643`, `tier1:828`, `tier2:734` |
| F19a | Typography | Typography Scale Presets | Three responsive size presets ('small', 'medium', 'large') for slide and document legibility | `preset: 'small' \| 'medium' \| 'large'` | Object `{ titleFontSize, subtitleFontSize, labelFontSize, badgeFontSize }` | Invalid preset string defaults to `'medium'` scale (`title: 20, sub: 14, label: 12, badge: 12`) | `harness.cjs:652`, `tier1:835-859`, `tier2:717-732` |
| F20 | Color Theming | Curated Institutional Palettes | 4 official institutional palettes tailored for academic and university executive presentations | `PaletteId`: `'undip_navy_gold'`, `'modern_emerald'`, `'executive_pastel'`, `'warm_sunset'` | `ColorPalette` object containing `id`, `name`, and `colors: string[]` (6 hex strings each) | Invalid palette ID falls back to `'undip_navy_gold'` | `ORIGINAL_REQUEST.md` R3, `harness.cjs:664`, `tier1:865-899`, `tier2:747-780` |
| F20a | Color Theming | Deterministic Color Cycling | Modulo index resolution when chart categories count exceeds palette size ($N > 6$) | Category index `idx: number`, palette `colors: string[]` | Hex color string `colors[idx % colors.length]` | N/A (deterministic mathematical cycle) | `tier2:764`, `tier3:418`, `harness.cjs:664` |
| F21 | Color Theming | Custom Palette Builder & Validator | Custom palette input builder strictly enforcing $\ge 5$ valid hex codes | `string[]` or delimited `string` (comma, space, semicolon, newline) | `PaletteValidationResult`: `{ isValid: boolean, colors: string[], errors: string[] }` | If $< 5$ valid hex codes: `isValid: false`, error `"Minimal 5 kode hex warna valid diperlukan (saat ini: N/5)"` | `ORIGINAL_REQUEST.md` AC, `harness.cjs:689`, `tier1:905-940`, `tier2:786-816` |
| F21a | Color Theming | Hex Normalization & Auto-Prepend | Normalizes 3-char and 6-char hex tokens without `#` and enforces uppercase | Raw string tokens (e.g. `'002D62'`, `'#f00'`, `'d4af37'`) | Uppercase prepended strings (e.g. `'#002D62'`, `'#F00'`, `'#D4AF37'`) | Non-hex characters flagged as `"Format hex tidak valid: '...'"` | `harness.cjs:701-708`, `tier1:935`, `tier2:799-815` |
| F22 | Visual Styling | 2D Modern Flat Visual Style | Clean, publication-grade flat aesthetic with soft corner radii and solid fills | Global mode `'2d'`, chart column profile | Solid fill (`opacity: 1.0`), border radius `4px`, subtle card shadow (`rgba(0,0,0,0.05)`), zero perspective tilt | N/A | `ORIGINAL_REQUEST.md` R3, `harness.cjs:728`, `tier1:946-970`, `tier2:822-846` |
| F23 | Visual Styling | 2.5D Isometric 3D Visual Style | Shaded facet prisms, illuminated top-cap ellipses, and directional drop shadows without perspective distortion | Global mode `'3d'`, chart column profile | Vertical linear gradient (`y2: 1`, lighter top to darker base), drop shadow blur $\le 8\text{px}$, concentric donut bevel | Prohibited chart types (e.g. `3d_pie_wedge`) remain blocked | `PROJECT.md:7`, `harness.cjs:728`, `tier1:974-1007`, `tier2:851-876` |
| F24 | Visual Styling | Per-Chart Dimensionality Override | Independent toggle pill on each chart card overriding the active global preset | Global mode (`'2d' \| '3d'`), card override (`'2d' \| '3d' \| 'inherit' \| undefined`) | Resolved mode: `'2d' \| '3d'` | Invalid or undefined override inherits global preset; null global defaults to `'2d'` | `PROJECT.md:40`, `harness.cjs:728`, `tier1:1013-1038`, `tier2:882-909` |
| F25 | Branding | Official BEM UNDIP Watermark | Institutional footer branding with official typography and positioning | `showWatermark: boolean`, `watermarkText: string` | Watermark text rendered at bottom canvas footer (`y >= 470px` on 500px card) | Empty string falls back to `"Biro Statistika BEM Universitas Diponegoro"` | `ORIGINAL_REQUEST.md` R3, `harness.cjs:726`, `tier1:1044-1072`, `tier2:915-942` |
| F25a | Branding | Export Audit Manifest Integration | Recording watermark status and theme configuration into `SURVEY_SUMMARY_AUDIT.txt` | Columns array, `ThemeConfig` object | Multi-line text manifest detailing font, palette ID, and watermark state | Gracefully outputs `"Disabled"` when toggled off | `harness.cjs:778`, `tier1:1050-1065`, `tier2:928` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| E1 | F19: Typography Scale | `preset = 'small'` | Enforces minimum legibility guard: `title: 18`, `subtitle: 13`, `label: 11`, `badge: 11` (all $\ge 10\text{px}$). |
| E2 | F19: Typography Scale | `preset = 'large'` | Limits `titleFontSize` to $24\text{px}$ ($\le 28\text{px}$) to prevent text clipping against card headers. |
| E3 | F19: Typography Scale | `preset = 'unknown_preset'` / invalid string | Defaults cleanly to `'medium'` scale (`title: 20`, `subtitle: 14`, `label: 12`, `badge: 12`). |
| E4 | F19: Font Selection | Font not in Google Fonts pre-connect list | Fallback to browser font family (`sans-serif` or `serif` for Merriweather). |
| E5 | F20: Institutional Palettes | Categories count $N = 14$ exceeds palette size ($6$) | Colors cycle deterministically via modulo `colors[idx % 6]`; first and 7th categories share `#002D62`. |
| E6 | F20: Institutional Palettes | First color of `undip_navy_gold` | Strictly Diponegoro official deep navy `#002D62`, followed by gold `#D4AF37`. |
| E7 | F21: Custom Validator | Input with exactly 4 valid hex codes (`['#111111', '#222222', '#333333', '#444444']`) | Rejected with `isValid: false`, error: `"Minimal 5 kode hex warna valid diperlukan (saat ini: 4/5)"`. |
| E8 | F21: Custom Validator | Input with 5 codes where one has non-hex characters (`'#GGGGGG'`) | Rejected with `isValid: false`, error: `"Format hex tidak valid: '#GGGGGG'"` and count error `(saat ini: 4/5)`. |
| E9 | F21: Custom Validator | 3-digit shorthand hex codes (`['#F00', '#0F0', '#00F', '#123', '#456']`) | Accepted as valid (`isValid: true`), preserved in uppercase `#F00`. |
| E10 | F21: Custom Validator | Unhashed 6-character hex strings (`['002D62', 'D4AF37', '1E56A0', 'F39C12', '4A90E2']`) | Automatically prepends `#` to all items, resulting in `['#002D62', '#D4AF37', ...]` with `isValid: true`. |
| E11 | F21: Custom Validator | Delimited string with mixed whitespace, commas, and newlines | Tokenizer `split(/[\s,;]+/)` parses all distinct tokens and filters empty tokens cleanly. |
| E12 | F21: Custom Validator | Lowercase hex strings (`['#abcdef', '#123456', ...]`) | Normalized to uppercase (`'#ABCDEF'`) for consistent styling and manifest generation. |
| E13 | F22: 2D Modern Flat | `resolveDimensionality('2d', 'inherit')` | Resolves to `'2d'`. Opacity is `1.0` (opaque solid), badge radius is `4px`, perspective tilt is strictly `false`. |
| E14 | F23: 2.5D Isometric 3D | User attempts to render `3d_pie_wedge` in 3D mode | Prohibited chart guard strictly blocks 3D pie wedges (`isChartTypeProhibited('3d_pie_wedge') === true`). |
| E15 | F23: 2.5D Isometric 3D | Bar gradient vertical stops | Stops start at `offset: 0` (lightened top cap) and end at `offset: 1` (darkened base). |
| E16 | F23: 2.5D Isometric 3D | Drop shadow blur limit | Blur radius is set to $4\text{px}$ ($\le 8\text{px}$) to avoid visual blur / muddy printing. |
| E17 | F23: 2.5D Isometric 3D | Donut concentric ring depth | Depth ratio is $0.20$ ($\le 0.30$), inner radius $45\%$, outer radius $75\%$, perspective tilt $0^\circ$. |
| E18 | F24: Per-Chart Override | Global `'2d'`, Chart Card overridden to `'3d'` | Chart Card renders in `'3d'` while sibling cards with `'inherit'` remain in `'2d'`. |
| E19 | F24: Per-Chart Override | Global `'3d'`, Chart Card overridden to `'2d'` | Chart Card renders in `'2d'` while sibling cards remain in `'3d'`. |
| E20 | F24: Per-Chart Override | Rapid toggling between `'2d'` and `'3d'` | Deterministic state resolution with zero memoization leaks. |
| E21 | F24: Per-Chart Override | `cardOverride = undefined` or `'invalid_mode'` | Falls back immediately to global preset mode. |
| E22 | F24: Per-Chart Override | `globalMode = null`, `cardOverride = 'inherit'` | Defaults cleanly to `'2d'`. |
| E23 | F25: Watermark | User enters empty string `""` or whitespace for custom watermark | Falls back to default institutional string: `"Biro Statistika BEM Universitas Diponegoro"`. |
| E24 | F25: Watermark | Long watermark string (80 characters) | Renders without throwing, recorded verbatim in audit manifest. |
| E25 | F25: Watermark | Watermark disabled (`showWatermark = false`) | Visual watermark element hidden; manifest records `"Watermark : Disabled"`. |
| E26 | F25: Watermark | Special characters (`"© 2026 BEM UNDIP & Biro Statistika"`) | Special characters preserved verbatim in card canvas and text manifest. |
| E27 | F25: Watermark | Canvas vertical boundary placement | Placed in footer region `y: 480px` on standard 500px card ($y \ge 470\text{px}$ and $< 500\text{px}$). |

---

## 5-Component Handoff Report

### 1. Observation
1. **File Locations & Contracts**:
   - Types defined in `src/types/theming.ts` (`FontFamily`, `PaletteId`, `ColorPalette`, `DimensionalityMode`, `ThemeConfig`).
   - Planned core theming directory: `src/core/theming/` (`palettes.ts`, `paletteValidator.ts`, `typography.ts`, `dimensionality.ts`).
   - Planned UI components: `src/components/studio/` (`ThemingStudio.tsx`, `ChartCard.tsx`, `EChartsRenderer.tsx`, `CustomPaletteModal.tsx`, `WatermarkFooter.tsx`).
   - Active workflow integration: `src/App.tsx` tab `'studio'` (currently renders a preview card, ready to host `ThemingStudio.tsx`).
2. **Authoritative Font Families**:
   - `index.html` lines 12–15 pre-connects and loads Google Fonts: `Inter`, `Merriweather`, `Montserrat`, `Plus Jakarta Sans`, `Poppins`, `Roboto`.
   - `tests/e2e/harness.cjs` line 643 defines exact array:
     ```javascript
     const FONT_FAMILIES = [
       'Poppins',
       'Montserrat',
       'Inter',
       'Plus Jakarta Sans',
       'Roboto',
       'Merriweather',
     ];
     ```
3. **Typography Scale Specifications**:
   - `tests/e2e/harness.cjs` lines 652–662:
     - `'small'`: `titleFontSize: 18`, `subtitleFontSize: 13`, `labelFontSize: 11`, `badgeFontSize: 11`
     - `'medium'` (default): `titleFontSize: 20`, `subtitleFontSize: 14`, `labelFontSize: 12`, `badgeFontSize: 12`
     - `'large'`: `titleFontSize: 24`, `subtitleFontSize: 16`, `labelFontSize: 14`, `badgeFontSize: 14`
4. **Institutional Color Palettes**:
   - Exact hex arrays in `tests/e2e/harness.cjs` lines 664–685:
     - `undip_navy_gold`: `['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2', '#F9E79F']`
     - `modern_emerald`: `['#0E6251', '#16A085', '#2ECC71', '#82E0AA', '#117A65', '#A3E4D7']`
     - `executive_pastel`: `['#6C88C4', '#C47D9B', '#7BAE9D', '#E8A87C', '#E0C366', '#958DC4']`
     - `warm_sunset`: `['#C0392B', '#E67E22', '#F39C12', '#E74C3C', '#D35400', '#F1C40F']`
5. **Custom Palette Validation Engine**:
   - Regex in `tests/e2e/harness.cjs` line 687: `HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`.
   - Normalization: Auto-prepends `#` for 3 or 6 hex digits, trims whitespace, converts to uppercase.
   - Count rule: Strictly requires $\ge 5$ valid hex codes (`validColors.length < 5` emits error: `"Minimal 5 kode hex warna valid diperlukan (saat ini: ${validColors.length}/5)"`).
6. **2D vs 2.5D Isometric 3D Visual Styling**:
   - 2D Flat: Solid palette fills (`opacity: 1.0`), border radius `4px`, light card border `1px solid rgba(0,0,0,0.05)`, subtle shadow `rgba(0,0,0,0.05)`.
   - 2.5D Isometric: Vertical linear gradients (`x: 0, y: 0, x2: 0, y2: 1`) from lighter tint (`offset: 0`) to darker shade (`offset: 1`), directional drop shadow (`rgba(0,0,0,0.12)`, `blur: 4`, `offsetY: 4`), donut concentric bevel depth ratio $0.20$ (inner $45\%$, outer $75\%$). Zero angular 3D perspective distortion.
   - Prohibited charts ban: Perspective tilted 3D pie wedges (`3d_pie_wedge`, `3d_pie`) remain prohibited even in 3D mode (`isChartTypeProhibited('3d_pie_wedge') === true`).
7. **Dimensionality Resolution**:
   - `tests/e2e/harness.cjs` lines 728–733:
     ```javascript
     function resolveDimensionality(globalMode, cardOverride) {
       if (cardOverride === '2d' || cardOverride === '3d') {
         return cardOverride;
       }
       return globalMode || '2d';
     }
     ```
8. **Institutional Watermark**:
   - Default text: `WATERMARK_TEXT = 'Biro Statistika BEM Universitas Diponegoro'` (`harness.cjs:726`).
   - Placement: Card footer region ($y \ge 470\text{px}$ on standard 500px card height).
   - Manifest entry: `"Watermark : Enabled"` or `"Watermark : Disabled"` (`harness.cjs:786`).
9. **Test Suite Execution**:
   - Executing `node tests/e2e/runner.cjs` synchronously passes all 324 tests across Tiers 1–4 with exit code 0.

### 2. Logic Chain
1. **Requirements to Interface Types**:
   - `ORIGINAL_REQUEST.md` R3 requires presentation fonts, institutional palettes, custom hex validator ($\ge 5$), 2D/3D dimensionality, and BEM UNDIP watermark.
   - `PROJECT.md` formalizes these into TypeScript types in `src/types/theming.ts`.
2. **Validation Logic Rigor**:
   - User inputs in forms or paste buffers can contain space-delimited or comma-delimited strings, or missing `#` prefixes.
   - The validator cleans, splits, auto-prepends `#`, uppercase-normalizes, and tests against `HEX_REGEX`.
   - It counts valid tokens. If $< 5$, `isValid` is false and specific user-facing Indonesian feedback is generated (`"Minimal 5 kode hex warna valid diperlukan (saat ini: N/5)"`).
3. **Legibility & Presentation Guardrails**:
   - Academic slide presentations require legible labels at a distance. Preset 'small' enforces minimum 10px label/badge size. Preset 'large' caps title at 24px ($\le 28\text{px}$) to avoid card header overflow.
   - Category labels wrap at 22 characters per line (`wrapLabel`), and dynamic left padding ranges from 80px to 260px (`calculateDynamicPadding`).
4. **Visual Craftsmanship Separation**:
   - 2D Flat preserves raw institutional colors and high-contrast badges for formal statistical reports.
   - 2.5D Isometric adds modern gradient depth and drop shadows for public executive slide decks without confusing 3D distortion (banning distorted 3D pie slices).
   - Global presets provide instant site-wide consistency, while per-chart overrides give analysts flexibility for specific charts.

### 3. Caveats
1. **Scope Boundary**:
   - This agent is a read-only **SPECIFICATION MINER**. No implementation code was written or modified in `src/`.
2. **Font Loading Dependency**:
   - Fonts rely on Google Fonts links in `index.html`. In strict offline air-gapped environments without cached webfonts, the system gracefully falls back to system sans-serif / serif fonts.
3. **ECharts Options Configuration**:
   - ECharts gradients and shadows must be configured using ECharts graphic gradient syntax (`new echarts.graphic.LinearGradient(0, 0, 0, 1, [...])`) in `EChartsRenderer.tsx`.

### 4. Conclusion
The specification for Milestone 3 (Features 19–25) is fully mined, mathematically bounded, and 100% aligned with the E2E test suite.
The implementer agent for Milestone 3 can directly generate:
- `src/core/theming/typography.ts`
- `src/core/theming/palettes.ts`
- `src/core/theming/paletteValidator.ts`
- `src/core/theming/dimensionality.ts`
- `src/components/studio/ThemingStudio.tsx`
- `src/components/studio/ChartCard.tsx`
- `src/components/studio/EChartsRenderer.tsx`
- `src/components/studio/CustomPaletteModal.tsx`
- `src/components/studio/WatermarkFooter.tsx`
- And wire `ThemingStudio` into Tab 3 of `src/App.tsx`.

### 5. Verification Method
To independently verify this specification and all underlying assertions:
1. Run the master test runner:
   ```bash
   node tests/e2e/runner.cjs
   ```
   **Expected Result**: All 324 tests across Tier 1, Tier 2, Tier 3, and Tier 4 pass with exit code 0.
2. Run Tier 1 and Tier 2 specifically:
   ```bash
   node tests/e2e/runner.cjs --tier 1
   node tests/e2e/runner.cjs --tier 2
   ```
3. Inspect `tests/e2e/tier1_feature_coverage.test.cjs` lines 825–1072 (Features 19–25 coverage).
4. Inspect `tests/e2e/tier2_boundary_corner.test.cjs` lines 714–942 (Features 19–25 boundaries).
5. Inspect `tests/e2e/harness.cjs` lines 643–734 (Oracle implementations).
