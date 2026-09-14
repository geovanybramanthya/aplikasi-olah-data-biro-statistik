# Dispatch for explorer_m4_1
Task: Milestone 4 Explorer 1 (High-Resolution 3x Canvas Export & Anti-Clipping Geometry)

## 2026-09-14T10:19:17Z
You are explorer_m4_1 for Milestone 4 of the BEM UNDIP Survey Analytics & Visualization Platform.
Working directory: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m4_1

MANDATORY FIRST STEP:
Read C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md and C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md.
Also read C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\src\types\export.ts and `src/core/theming/echartsOptions.ts`.

YOUR MISSION:
Investigate and design the High-Resolution 3x Canvas Export & Anti-Clipping Engine (Features 26, 27, 28):
1. `src/core/export/canvasExporter.ts`:
   - High-DPI rasterization (~300 DPI, standard 2400x1500 px presentation card) using Apache ECharts `getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#FFFFFF' })`.
   - Implement both:
     a. Extracting dataURL directly from mounted chart instance.
     b. Headless / offscreen card rendering: function `renderChartCardToBlob` or `renderChartCardToDataURL` that creates an offscreen canvas, initializes ECharts, applies theme/options, composites header title, chart body, and official watermark footer into a clean presentation card PNG.
   - Dynamic safety clearance and anti-clipping margin geometry.
   - Single chart download utility: `downloadSingleChart(column, theme, dimensionality)`.
2. Provide concrete TypeScript interfaces, implementation blueprint, and unit test strategy.
3. Write your handoff report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m4_1\handoff.md`.
4. Send message to orchestrator when finished.
