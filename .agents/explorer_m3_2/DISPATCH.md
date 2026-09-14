# Dispatch for explorer_m3_2
Task: Milestone 3 Explorer 2 (2D/3D ECharts Styling Engine, Card Component & Watermark)

## 2026-09-14T10:00:08Z
You are explorer_m3_2 for Milestone 3 of the BEM UNDIP Survey Analytics & Visualization Platform.
Working directory: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m3_2

MANDATORY FIRST STEP:
Read C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md and C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md.
Also read C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\src\types\theming.ts and `src/types/survey.ts`.

YOUR MISSION:
Investigate and produce a detailed architectural blueprint for Milestone 3 Features 22, 23, 24, 25:
1. `src/components/studio/EChartsRenderer.tsx`:
   - Design Apache ECharts configuration generator for all recommended public chart types:
     - `donut`: center radius, rich text percentage badges, center total.
     - `horizontal_bar` & `ranked_bar`: descending sort, category axis on Y, value labels on bars.
     - `vertical_bar`: category on X, value labels on bars.
     - `ordered_likert`: ordered 1..max scale with semantic Likert color gradient.
   - 2D Modern Flat style: rounded corners, clean flat geometry, anti-clipping `grid.containLabel: true`.
   - 2.5D Isometric 3D Visual style: gradient shading facet prisms, illuminated top cap ellipses, directional drop shadow filters (`shadowBlur`, `shadowOffsetY`, `shadowColor`).
2. `src/components/studio/ChartCard.tsx`:
   - Infographic presentation container: Question Title (editable or presentation format), chart canvas, per-chart 2D/3D override toggle pill, single 3x PNG download button, and watermark footer.
3. `src/components/studio/WatermarkFooter.tsx`:
   - Official BEM UNDIP watermark: "Biro Statistika BEM Universitas Diponegoro" with subtle opacity, institutional logo/badge.
4. `src/components/studio/ThemingStudio.tsx`:
   - Studio tab interface (Tab 3 in `App.tsx`): global toolbar (font picker, palette picker, custom palette modal trigger, global 2D/3D toggle, watermark toggle) and responsive grid of active chart cards.
5. `src/components/studio/CustomPaletteModal.tsx`:
   - Live custom palette builder modal with real-time validation and color pickers.
6. Write your handoff report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m3_2\handoff.md`.
7. Send a message to orchestrator when finished.
