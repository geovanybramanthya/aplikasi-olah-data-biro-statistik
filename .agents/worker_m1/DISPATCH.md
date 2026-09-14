# Dispatch: Milestone 1 Worker (`worker_m1`)

## Mission
Implement Milestone 1: Ingestion & Schema Profiling Engine for the BEM UNDIP Survey Analytics & Visualization Platform.

## Scope & Files Owned
- Project root: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app`
- Files owned exclusively:
  - `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
  - `src/main.tsx`, `src/App.tsx`, `src/index.css`
  - `src/types/survey.ts`, `src/types/theming.ts`, `src/types/export.ts`
  - `src/core/parser/**` (`csvParser.ts`, `excelParser.ts`, `piiFilter.ts`)
  - `src/core/profiler/**` (`questionClassifier.ts`, `multiSelectSplitter.ts`, `statistics.ts`)
  - `src/data/**` (`demoSurvey1.ts`, `demoSurvey2.ts`)
  - `src/services/demoDataService.ts`
  - `src/components/ingestion/**` (`FileUploadZone.tsx`, `DemoDataLoader.tsx`, `IngestionSummary.tsx`)
  - `src/components/layout/**` (`Header.tsx`, `Footer.tsx`, `TabNavigation.tsx`)
  - `tests/m1_verification.cjs` (M1 standalone validation script)

## Inputs
- `ORIGINAL_REQUEST.md`: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md`
- `PROJECT.md`: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md`
- Explorers' Handoffs:
  - `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_explorer_1\handoff.md`
  - `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_explorer_2\handoff.md`
  - `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_spec_miner_1\handoff.md`
- Datasets:
  - `C:\Users\geova\.gemini\antigravity\raw\survey_sample_1.csv`
  - `C:\Users\geova\.gemini\antigravity\raw\survey_sample_2.csv`
  - `C:\Users\geova\.gemini\antigravity\raw\Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx`

## Requirements
1. Initialize Vite + React 19/18 + TypeScript + Tailwind CSS project with required dependencies (`echarts`, `papaparse`, `xlsx`, `jszip`, `lucide-react`).
2. Implement robust CSV parser (`csvParser.ts`) and Excel parser (`excelParser.ts`) handling RFC 4180 quotes, commas, newlines, and float representation.
3. Implement header whitespace trimmer (`cleanName = rawName.trim().replace(/\s+/g, ' ')`).
4. Implement PII / Metadata filter (`piiFilter.ts`) with regex detecting `Timestamp`, `Nama`, `NIM`, `Email`, `No HP`. Auto-exclude from visualization by default.
5. Implement 5-type Question Classifier (`questionClassifier.ts`):
   - Nominal/Demographics (Fakultas, Bidang, Jabatan, etc.)
   - Dichotomous Binary (Ya/Tidak)
   - Likert Scale (1-4, 1-5, preserving semantic direction even if a rating option has 0 responses)
   - Multi-Select Checkboxes (using Token Repeat Ratio > 3.0 to distinguish from free-text with commas)
   - Open-Ended Text (qualitative essays)
6. Implement `multiSelectSplitter.ts` calculating percentage against total respondents ($N$).
7. Bundle `survey_sample_1.csv` and `survey_sample_2.csv` into `demoSurvey1.ts` and `demoSurvey2.ts` for instant offline 1-click loading.
8. Build responsive UI layout (`Header.tsx`, `Footer.tsx`, `TabNavigation.tsx`, `FileUploadZone.tsx`, `DemoDataLoader.tsx`, `IngestionSummary.tsx`).
9. Build and run tests to verify compilation and verification test pass.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write your handoff report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m1\handoff.md`.

## 2026-09-14T08:50:35Z
You are Milestone 1 Worker (worker_m1).
Your working directory is: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m1
Read your dispatch at C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m1\DISPATCH.md
Read the original user request at: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md
Read the master project architecture at: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement Milestone 1: Ingestion & Schema Profiling Engine:
- Setup React + TypeScript + Vite + Tailwind CSS project with dependencies (echarts, papaparse, xlsx, jszip, lucide-react).
- CSV & Excel parsers with quote/comma/newline handling and float normalization.
- Header whitespace trimmer and PII/Metadata regex filter (Timestamp, Nama, NIM, Email, Phone).
- 5 question type classifiers (Nominal, Binary, Likert 1-4 & 1-5, Multi-Select Checkboxes via Token Repeat Ratio > 3.0, Open-Ended Text).
- Multi-select splitter calculating % against N respondents.
- Offline bundled demo datasets (Sample 1 & Sample 2) for 1-click loading.
- Responsive ingestion UI layout.
- Verify build (`npm run build`) and run validation tests.

Write your handoff report to C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m1\handoff.md and notify the orchestrator via send_message when completed.

