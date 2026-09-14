# Dispatch: Milestone 2 Worker (`worker_m2`)

## Mission
Implement Milestone 2: Public-Friendly AI Recommendation Engine & Curation Studio for the BEM UNDIP Survey Platform.

## Scope & Files Owned
- Project root: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app`
- Files owned:
  - `src/core/recommender/**` (`chartHeuristics.ts`, `prohibitedRules.ts`)
  - `src/services/geminiService.ts`
  - `src/components/curation/**` (`CurationTable.tsx`, `ColumnDetailModal.tsx`)
  - `src/App.tsx` (curation state management & tab transition)
  - `tests/m2_verification.cjs` (M2 verification test suite)

## Inputs
- `ORIGINAL_REQUEST.md`: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md`
- `PROJECT.md`: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md`
- Explorers' Handoffs:
  - `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_spec_miner_1\handoff.md`
  - `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_explorer_2\handoff.md`
- Test Suites:
  - `tests/e2e/runner.cjs`
  - `tests/m1_verification.cjs`
  - `tests/adversarial_m1_1.cjs`

## Requirements (Features 11–18)
1. **Recommendation Heuristics (`src/core/recommender/chartHeuristics.ts`)**:
   - 2–3 categories -> `donut` with percentage badges and center total.
   - Multi-category (4–12 items) or long labels (>15 chars) -> `horizontal_bar` (or `vertical_bar` if <= 6 categories with short labels).
   - Multi-select checkboxes -> `ranked_bar` (ranked horizontal bar, % of N respondents).
   - Likert scales (1-4, 1-5) -> `ordered_likert` (ordered frequency bar chart preserving semantic direction).
   - Open-ended qualitative text -> `text_feed`.
   - PII/Metadata -> `none` (excluded by default).
2. **Prohibited Charts Ban (`src/core/recommender/prohibitedRules.ts`)**:
   - Explicitly ban and reject: radar/spider charts, distorted 3D pie wedges, dual-axis spaghetti plots, uncalibrated bubble charts.
   - Return validation error if user attempts to select a prohibited chart type.
3. **Interactive Curation Table UI (`src/components/curation/CurationTable.tsx`)**:
   - Search & filter by question type (All, Demographics, Binary, Likert, Multi-Select, Text).
   - Table columns: #, Question / Display Title (inline editable), Detected Type chip, Recommended Chart, Selected Chart dropdown, Active Toggle switch (Include/Exclude in visual generation), Actions (Detail Modal).
   - Batch actions: "Include All", "Exclude Open-Ended", "Reset to Recommended".
   - Overview counters: Total Columns, Visualized Charts Count, Excluded Columns.
4. **Offline Heuristics & Optional Gemini AI Narrative (`src/services/geminiService.ts`)**:
   - 100% offline descriptive statistics by default (mode, percentage share, margin, Likert mean/median/top-box, multi-select distribution).
   - Optional Gemini AI Narrative Toggle:
     - User inputs Gemini API key (stored in `localStorage` or session).
     - Generates narrative insights analyzing student sentiment and public policy implications.
     - Graceful Degradation: If API key is missing, network is offline, or API returns error, display non-blocking notification and fall back seamlessly to offline statistical narrative without UI interruption.
5. **UI & State Integration (`src/App.tsx`)**:
   - Seamlessly propagate curated column modifications (display title, selected chart, isExcluded toggle) to global dataset state.
   - Tab transition to Curation tab after dataset ingestion or demo data load.
6. **Verification Target**:
   - Write and run `tests/m2_verification.cjs` covering all M2 features.
   - Run `npm run test:e2e` (must maintain 324/324 pass).
   - Run `npm run build` (must build cleanly with zero TypeScript errors).

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test assertions or circumvent the intended functionality. A forensic auditor will independently verify your code.

## Output
Write your handoff report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m2\handoff.md`.

## 2026-09-14T09:16:23Z
You are Milestone 2 Worker (worker_m2).
Your working directory is: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m2
Read your dispatch at C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m2\DISPATCH.md
Read the original user request at: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md
Read the master architecture at: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work.

Implement Milestone 2: Recommendation Engine & Curation Studio:
- src/core/recommender/chartHeuristics.ts (recommend optimal public charts)
- src/core/recommender/prohibitedRules.ts (ban radar, distorted 3D pie wedges, dual-axis plots)
- src/services/geminiService.ts (Gemini narrative insight toggle + graceful offline fallback)
- src/components/curation/CurationTable.tsx & ColumnDetailModal.tsx (interactive curation UI)
- Wire into src/App.tsx
- Write tests/m2_verification.cjs and verify npm run test:e2e and npm run build.

Write your handoff report to C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m2\handoff.md and notify the orchestrator via send_message when completed.
