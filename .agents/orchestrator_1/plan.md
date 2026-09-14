# Orchestration Plan: BEM UNDIP Survey Analytics & Visualization Platform

## Overview
Build a web-based automated survey analytics and visualization platform for Biro Statistika BEM Universitas Diponegoro that ingests raw Google Form spreadsheet/Excel exports (.csv, .xlsx) and provides automated schema profiling, public-friendly chart recommendations, interactive theming studio, and high-res batch zip export.

## Phase 0: Survey & Scope Discovery
- **Action**: Spawn 3 Explorers in parallel to inspect:
  1. Explorer 1: Dataset analysis on `survey_sample_1.csv` & `survey_sample_2.csv` (structure, columns, multi-select values, Likert scales, PII columns).
  2. Explorer 2: Technical architecture & web platform stack (FastAPI backend + Vite/React frontend vs Streamlit vs full client-side React+Vite, charting libraries supporting 2D/3D like Chart.js / ECharts, export capabilities html2canvas / canvas to blob, zip packaging JSZip).
  3. Explorer 3: Requirements & Spec mining on R1 (Ingestion & Schema Profiling), R2 (Recommendation Engine & Gemini toggle), R3 (Theming Studio & UNDIP palettes/fonts), R4 (High-res batch export).
- **Deliverable**: Synthesized `PROJECT.md` with Feature Inventory, Milestones, and Interface Contracts.

## Phase 1: Dual Track Decomposition & Dispatch
- **Track 1: E2E Testing Track**:
  - Independent, opaque-box test suite covering Tiers 1-4 (Feature coverage, Boundary/corner cases, Cross-feature interactions, Real-world workloads with sample datasets).
  - Produces `TEST_INFRA.md` and signals `TEST_READY.md`.
- **Track 2: Implementation Track**:
  - **Milestone 1**: Ingestion & Schema Profiling Engine (CSV/XLSX parser, PII exclusion, question classifier, multi-select splitter, bundled demo datasets).
  - **Milestone 2**: Recommendation Engine & Curation Studio (Heuristics for 2-3 categories, multi-category bar, ranked multi-select, ordered Likert; prohibited confusing charts; curation override table; Gemini narrative insight toggle).
  - **Milestone 3**: Theming & Visual Craftsmanship Studio (Fonts Poppins, Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather; Palettes UNDIP Navy & Gold, Modern Emerald, Executive Pastel, Warm Sunset, Custom >=5 hex validator; 2D Flat & 3D Visual styles; BEM UNDIP footer branding).
  - **Milestone 4**: High-Resolution Batch Export & Zip Packaging (~300 DPI / 3x scale canvas rendering, label protection, zero clipping, JSZip batch packaging).
  - **Milestone 5 (Final Milestone)**:
    - Phase 1: 100% Pass of E2E Test Suite (Tiers 1-4).
    - Phase 2: Adversarial Coverage Hardening (Tier 5) with Challengers & Forensic Integrity Audit.

## Verification & Audit Gating
- Each milestone must undergo rigorous gate check:
  - Worker passes tests & builds.
  - 2 Reviewers APPROVE.
  - 2 Challengers confirm correctness.
  - Forensic Auditor certifies CLEAN integrity (hard veto).
