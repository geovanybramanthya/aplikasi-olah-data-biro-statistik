## 2026-09-14T10:07:19Z

You are worker_m3 for Milestone 3 of the BEM UNDIP Survey Analytics & Visualization Platform.
Working directory: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m3

MANDATORY FIRST STEP:
Read C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md and C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md.
Also read the explorer reports:
- C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m3_1\handoff.md
- C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m3_2\handoff.md
- C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\spec_miner_m3_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE OWNERSHIP:
You have exclusive write ownership of:
- `src/core/theming/` (`palettes.ts`, `paletteValidator.ts`, `typography.ts`, `colorUtils.ts`, `echartsOptions.ts`)
- `src/components/studio/` (`EChartsRenderer.tsx`, `WatermarkFooter.tsx`, `ChartCard.tsx`, `CustomPaletteModal.tsx`, `ThemingStudio.tsx`)
- `src/App.tsx`
- `package.json`
- `tests/m3_verification.cjs`

YOUR MISSION (Implement Milestone 3: Theming & Visual Craftsmanship Studio):
1. Promote and implement the core theming layer in `src/core/theming/`:
   - `palettes.ts`: 4 institutional palettes (`undip_navy_gold`, `modern_emerald`, `executive_pastel`, `warm_sunset`) with 6 hex codes each matching spec_miner_m3_1; `DEFAULT_THEME` conforming to `ThemeConfig`; palette lookup & color cycling helper.
   - `paletteValidator.ts`: strict regex `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`; minimum 5 valid hex codes; auto `#` prefix, uppercase normalization, Indonesian error strings.
   - `typography.ts`: 6 fonts (Poppins [default], Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather); font family mappings, dynamic Google Fonts loader.
   - `colorUtils.ts`: mathematical color manipulation (`lightenColor`, `darkenColor`, `hexToRgb`, `rgbToHex`) for 2.5D shader gradients.
   - `echartsOptions.ts`: pure Apache ECharts option generator for `donut`, `horizontal_bar`, `vertical_bar`, `ranked_bar`, and `ordered_likert` in both 2D Modern Flat and 2.5D Isometric 3D styles. Anti-clipping `grid.containLabel: true`, dynamic label wrapping.
2. Implement studio components in `src/components/studio/`:
   - `EChartsRenderer.tsx`: native canvas renderer with `useRef`, `ResizeObserver`, responsive resize, and automatic instance disposal.
   - `WatermarkFooter.tsx`: official institutional watermark ("Biro Statistika BEM Universitas Diponegoro") positioned at bottom.
   - `ChartCard.tsx`: presentation card with title, per-chart 2D/3D override toggle pill, single 3x PNG download button (`chartInstance.getDataURL({ pixelRatio: 3 })`), and watermark footer.
   - `CustomPaletteModal.tsx`: live custom palette builder with real-time validation and color pickers.
   - `ThemingStudio.tsx`: studio tab view with global theming toolbar and responsive grid of active chart cards.
3. Wire `ThemingStudio` into Tab 3 in `src/App.tsx` with global `theme` state, per-chart dimensionality overrides, and active column updates.
4. Author comprehensive test suite `tests/m3_verification.cjs` verifying all Milestone 3 features. Add `"test:m3": "node tests/m3_verification.cjs"` in `package.json`.
5. Run verification commands:
   - `npm run test:m3`
   - `npm run test:e2e`
   - `npm run test:m2`
   - `npm run test:m1`
   - `npm run build`
6. Write full handoff report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m3\handoff.md`.
7. Send message to orchestrator upon completion.
