## 2026-09-14T10:23:50Z
<USER_REQUEST>
You are worker_m4 for Milestone 4 of the BEM UNDIP Survey Analytics & Visualization Platform.
Working directory: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m4

MANDATORY FIRST STEP:
Read C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md and C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md.
Also read the explorer reports:
- C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m4_1\handoff.md
- C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\explorer_m4_2\handoff.md
- C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\spec_miner_m4_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE OWNERSHIP:
You have exclusive write ownership of:
- `src/types/export.ts`
- `src/core/export/` (`canvasExporter.ts`, `zipPackager.ts`)
- `src/components/export/` (`BatchExportModal.tsx`, `ExportAuditSummary.tsx`)
- `src/App.tsx`
- `package.json`
- `tests/m4_verification.cjs`

YOUR MISSION (Implement Milestone 4: High-Resolution Batch Export & Asset Packaging):
1. `src/types/export.ts`: Extend export types (`ExportCardConfig`, `BatchExportProgress`, `BatchExportOptions`, `BatchExportResult`).
2. `src/core/export/canvasExporter.ts`:
   - High-DPI rasterization (~300 DPI, 2400x1500 px presentation card).
   - Support both direct chart instance export (`exportChartToPng`) and headless/offscreen card rendering (`renderCompositeCardToDataURL` / `renderCompositeCardToBuffer` for Node/test environments).
   - Composite card rendering: header (Q-number, title, metadata badge), chart canvas, and official watermark footer ("Biro Statistika BEM Universitas Diponegoro").
   - Dynamic safety clearance and anti-clipping margin geometry.
   - Single chart PNG download helper: `downloadSingleChartPNG(dataUrl, filename)`.
3. `src/core/export/zipPackager.ts`:
   - Sequential in-memory JSZip packaging: iterate through all active visual columns (`!c.isExcluded && c.selectedChart !== 'none'`).
   - Store high-res 3x PNG cards into `charts/01_chart_slug.png`.
   - Generate `SURVEY_SUMMARY_AUDIT.txt` audit manifest matching spec_miner_m4_1 template (platform header, ISO 8601 timestamp, dataset metadata, active theme config, itemized chart inventory).
   - Progress callback `onProgress?: (progress: BatchExportProgress) => void`.
   - Dual output support: returns Node `Buffer` in Node environments (for unit tests / runners) and triggers browser download of `<dataset_name>_BEM_UNDIP_Charts.zip` in browser environments.
4. `src/components/export/BatchExportModal.tsx`:
   - Interactive modal with animated progress bar, status messages, error boundary, and re-download triggers.
5. `src/components/export/ExportAuditSummary.tsx`:
   - Tab 4 ("Ekspor & Audit Paket") dashboard in `src/App.tsx` with active charts count, theme summary, live audit text preview, individual chart download links, and batch export trigger.
6. Wire Tab 4 into `src/App.tsx`.
7. Author comprehensive test suite `tests/m4_verification.cjs` verifying all Milestone 4 features. Add `"test:m4": "node tests/m4_verification.cjs"` in `package.json`.
8. Run verification commands:
   - `npm run test:m4`
   - `npm run test:e2e`
   - `npm run test:m3`
   - `npm run test:m2`
   - `npm run test:m1`
   - `npm run build`
9. Write full handoff report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m4\handoff.md`.
10. Send message to orchestrator upon completion.
</USER_REQUEST>
