# Milestone 3 Architectural Blueprint & Handoff Report: Theming, Palettes & Typography

**Agent**: explorer_m3_1  
**Milestone**: Milestone 3 (Features 19, 20, 21)  
**Target Modules**:
- `src/core/theming/palettes.ts` (Feature 20: Institutional Palettes & ThemeConfig)
- `src/core/theming/paletteValidator.ts` (Feature 21: Custom Palette Validator)
- `src/core/theming/typography.ts` (Feature 19: Presentation Typography & Google Fonts Loader)
- `tests/m3_verification.cjs` (Milestone 3 Verification Test Suite)

---

## 1. Observation

### 1.1 Type Definitions (`src/types/theming.ts`)
Inspection of `src/types/theming.ts` (lines 1–36) established the explicit TypeScript contract:
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

### 1.2 Test Harness Specifications (`tests/e2e/harness.cjs`)
Inspection of `tests/e2e/harness.cjs` (lines 642–735) revealed the exact reference implementations and test assertions used in the 324-test E2E suite:
- **Font Families (F19)**:
  `FONT_FAMILIES = ['Poppins', 'Montserrat', 'Inter', 'Plus Jakarta Sans', 'Roboto', 'Merriweather']`
- **Typography Sizing (F19)**:
  - `'small'`: `{ titleFontSize: 18, subtitleFontSize: 13, labelFontSize: 11, badgeFontSize: 11 }`
  - `'medium'`: `{ titleFontSize: 20, subtitleFontSize: 14, labelFontSize: 12, badgeFontSize: 12 }`
  - `'large'`: `{ titleFontSize: 24, subtitleFontSize: 16, labelFontSize: 14, badgeFontSize: 14 }`
  - fallback: `{ titleFontSize: 20, subtitleFontSize: 14, labelFontSize: 12, badgeFontSize: 12 }`
- **Curated Institutional Palettes (F20)**:
  - `undip_navy_gold`: `['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2', '#F9E79F']`
  - `modern_emerald`: `['#0E6251', '#16A085', '#2ECC71', '#82E0AA', '#117A65', '#A3E4D7']`
  - `executive_pastel`: `['#6C88C4', '#C47D9B', '#7BAE9D', '#E8A87C', '#E0C366', '#958DC4']`
  - `warm_sunset`: `['#C0392B', '#E67E22', '#F39C12', '#E74C3C', '#D35400', '#F1C40F']`
- **Validation Engine (F21)**:
  - Regex: `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`
  - Auto-prepending `#` if 3 or 6 hex digits are provided without `#`
  - Normalization to uppercase `#RRGGBB` or `#RGB`
  - Error messages:
    - Malformed: `Format hex tidak valid: '${token}'`
    - Insufficient count: `Minimal 5 kode hex warna valid diperlukan (saat ini: ${validColors.length}/5)`
- **Watermark (F25)**:
  `WATERMARK_TEXT = 'Biro Statistika BEM Universitas Diponegoro'`

### 1.3 Test Assertions in Tier 1 & Tier 2 Tests
- `tests/e2e/tier1_feature_coverage.test.cjs`:
  - Lines 827–860: Verifies all 6 font families in `FONT_FAMILIES`, checks typography scales (`small`, `medium`, `large`, invalid fallback).
  - Lines 865–900: Verifies all 4 palettes contain >= 5 colors, checks exact leading colors (`#002D62`, `#0E6251`, `#6C88C4`, `#C0392B`), and validates all colors against hex regex.
  - Lines 905–941: Verifies 5-color custom palette, >5 colors, rejection of <5 colors, rejection of malformed string (`'blue'`), and auto-prepending `#`.
- `tests/e2e/tier2_boundary_corner.test.cjs`:
  - Lines 787–817: Verifies count error reports `(saat ini: 4/5)`, rejects `#GGGGGG`, allows 3-digit shorthand (`#F00`), parses space-separated string input, and normalizes lowercase hex to uppercase.

### 1.4 Baseline Test Execution
Executed `npm run test:e2e` via PowerShell:
```
Tier 1: Feature Coverage (F1-F29)    : 145 passed,  0 failed  [PASS]
Tier 2: Boundary & Corner Cases      : 145 passed,  0 failed  [PASS]
Tier 3: Cross-Feature Interactions   :  29 passed,  0 failed  [PASS]
Tier 4: Real-World Workloads         :   5 passed,  0 failed  [PASS]
TOTAL TESTS : 324 | PASSED : 324 | FAILED : 0
```
Executed proposed M3 verification script (`node .agents/explorer_m3_1/proposed_m3_verification.cjs`):
```
ALL MILESTONE 3 VERIFICATION TESTS PASSED: 32/32
```

---

## 2. Logic Chain

1. **Alignment with ThemeConfig**:
   - By structuring `DEFAULT_THEME_CONFIG` with `fontFamily: 'Poppins'`, `titleFontSize: 20`, `labelFontSize: 12`, `activePaletteId: 'undip_navy_gold'`, `activePalette: INSTITUTIONAL_PALETTES.undip_navy_gold`, `customPalette: DEFAULT_CUSTOM_PALETTE`, `globalDimensionality: '2d'`, and `showWatermark: true`, any component or export engine consuming `ThemeConfig` receives a 100% compliant, non-null object without needing defensive null checks.
2. **Deterministic Hex Validation & Sanitization**:
   - Users may input hex codes as an array (`['#002D62', ...]`) or delimiter-separated strings (e.g. from copy-pasting from a style guide or spreadsheet: `"#002D62 #D4AF37 #1E56A0 #F39C12 #4A90E2"` or comma/semicolon delimited).
   - Splitting on `/[\s,;|\n\r]+/` and checking `/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/` guarantees that un-hashed entries like `002D62` become `#002D62`.
   - Normalizing to `.toUpperCase()` guarantees color equality comparisons succeed.
   - Enforcing `>= 5` valid colors guarantees charts with up to 5 categories have unique hues, and `getPaletteColor` uses modulo indexing `index % palette.colors.length` to safely handle arbitrarily large numbers of categories without crashing.
3. **Typography Library & Dynamic Loading**:
   - All 6 presentation fonts (`Poppins`, `Montserrat`, `Inter`, `Plus Jakarta Sans`, `Roboto`, `Merriweather`) are preconnected in `index.html`.
   - However, in dynamic runtime environments, `loadGoogleFont` and `loadAllPresentationFonts` provide idempotent `<link>` stylesheet injection into `document.head`.
   - In Node.js / headless testing / SSR environments where `document` is undefined, the loader safely returns `Promise.resolve(true)` without throwing errors.
4. **Architectural Isolation**:
   - Creating `src/core/theming/palettes.ts`, `src/core/theming/paletteValidator.ts`, and `src/core/theming/typography.ts` encapsulates pure domain logic, free of React DOM dependencies. This enables 100% testability via Node.js / esbuild in `<50ms`.

---

## 3. Caveats

1. **Downstream UI Component Scoping**:
   - This blueprint specifies the core logic modules (`palettes.ts`, `paletteValidator.ts`, `typography.ts`) and the verification suite (`tests/m3_verification.cjs`).
   - The React UI components (`ThemingStudio.tsx`, `ChartCard.tsx`, `EChartsRenderer.tsx`, `CustomPaletteModal.tsx`, `WatermarkFooter.tsx`) will consume these core utilities and will be implemented by the implementer agent.
2. **Network Offline Mode**:
   - The Google Fonts dynamic loader depends on internet connectivity to fetch webfonts from `fonts.googleapis.com`. If offline, the browser gracefully falls back to local sans-serif/serif system fonts defined in the CSS font stack (e.g. `'Plus Jakarta Sans', sans-serif`).
3. **No Project Source Modifying during Exploration**:
   - In accordance with explorer read-only constraints, proposed implementations have been fully realized and tested inside `.agents/explorer_m3_1/`. The implementer can copy them directly to `src/core/theming/`.

---

## 4. Conclusion & Concrete Blueprint

The architecture for Milestone 3 Features 19, 20, 21 is complete, verified, and ready for immediate implementation.

### 4.1 File Layout & Exports Specification

#### A. `src/core/theming/palettes.ts`
- **Location**: `src/core/theming/palettes.ts`
- **Reference Artifact**: `.agents/explorer_m3_1/proposed_palettes.ts`
- **Exports**:
  - `WATERMARK_TEXT: string` ('Biro Statistika BEM Universitas Diponegoro')
  - `INSTITUTIONAL_PALETTES: Record<Exclude<PaletteId, 'custom'>, ColorPalette>`
  - `DEFAULT_CUSTOM_PALETTE: ColorPalette`
  - `INSTITUTIONAL_PALETTE_LIST: ColorPalette[]`
  - `DEFAULT_THEME_CONFIG: ThemeConfig`
  - `getPaletteById(id: PaletteId, customPalette?: ColorPalette): ColorPalette`
  - `resolveThemePalette(theme: ThemeConfig): ColorPalette`
  - `getAllPalettes(customPalette?: ColorPalette): ColorPalette[]`
  - `getPaletteColor(palette: ColorPalette, index: number): string`
  - `resolveDimensionality(globalMode?: DimensionalityMode, cardOverride?: DimensionalityMode | 'inherit'): DimensionalityMode`

#### B. `src/core/theming/paletteValidator.ts`
- **Location**: `src/core/theming/paletteValidator.ts`
- **Reference Artifact**: `.agents/explorer_m3_1/proposed_paletteValidator.ts`
- **Exports**:
  - `HEX_COLOR_REGEX: RegExp` (`/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`)
  - `interface PaletteValidationResult` (`{ isValid: boolean; colors: string[]; errors: string[]; palette?: ColorPalette }`)
  - `isValidHexColor(color: string): boolean`
  - `normalizeHexColor(color: string): string | null`
  - `validateCustomPalette(input: unknown, paletteName?: string): PaletteValidationResult`
  - `createCustomPalette(name: string, input: string[] | string): ColorPalette`

#### C. `src/core/theming/typography.ts`
- **Location**: `src/core/theming/typography.ts`
- **Reference Artifact**: `.agents/explorer_m3_1/proposed_typography.ts`
- **Exports**:
  - `FONT_FAMILIES: readonly FontFamily[]` (Poppins, Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather)
  - `interface FontDefinition`
  - `interface TypographyScale` (`titleFontSize`, `subtitleFontSize`, `labelFontSize`, `badgeFontSize`)
  - `type TypographyScalePreset` ('small' | 'medium' | 'large')
  - `FONT_DEFINITIONS: Record<FontFamily, FontDefinition>`
  - `calculateTypographyScale(preset?: string): TypographyScale`
  - `getCssFontFamily(fontFamily: FontFamily): string`
  - `buildGoogleFontsUrl(fonts?: readonly FontFamily[] | FontFamily[]): string`
  - `loadGoogleFont(font: FontFamily): Promise<boolean>`
  - `loadAllPresentationFonts(): Promise<boolean>`

#### D. `tests/m3_verification.cjs`
- **Location**: `tests/m3_verification.cjs`
- **Reference Artifact**: `.agents/explorer_m3_1/proposed_m3_verification.cjs`
- **Scripts**: Add `"test:m3": "node tests/m3_verification.cjs"` to `package.json`.

---

## 5. Verification Method

To independently verify the implementation:

1. **Run Proposed Milestone 3 Verification Suite**:
   ```powershell
   node .agents/explorer_m3_1/proposed_m3_verification.cjs
   ```
   *Expected*: All 32 tests pass (0 failures, exit code 0).

2. **Once implementer creates `src/core/theming/*` and `tests/m3_verification.cjs`**:
   ```powershell
   npm run test:m3
   ```
   *Expected*: All Milestone 3 tests pass cleanly.

3. **Verify Zero Regressions on Existing Test Suites**:
   ```powershell
   npm run test:m1
   npm run test:m2
   npm run test:e2e
   ```
   *Expected*: 100% of tests pass (M1: 24/24, M2: 36/36, E2E: 324/324).

4. **Verify TypeScript Build Integrity**:
   ```powershell
   npm run build
   ```
   *Expected*: `tsc -b` and `vite build` complete with 0 errors.

5. **Invalidation Conditions**:
   - Any institutional palette having fewer than 5 hex codes.
   - Any color code failing `^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`.
   - `validateCustomPalette` failing to reject <5 colors or invalid characters.
   - Any of the 6 presentation fonts missing from `FONT_FAMILIES`.
   - `calculateTypographyScale` violating minimum legibility bounds (title >= 16, subtitle >= 12, label >= 10, badge >= 10).
