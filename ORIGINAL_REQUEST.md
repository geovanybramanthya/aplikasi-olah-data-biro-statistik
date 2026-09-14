# Original User Request

## 2026-09-14T08:43:44Z

A web-based automated survey analytics and visualization platform for Biro Statistika BEM Universitas Diponegoro that transforms raw Google Form spreadsheet/Excel exports into publication-grade, public-friendly presentation charts with an automated recommendation engine, interactive theming studio, and batch export.

Working directory: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app
Integrity mode: development

## Requirements

### R1. Survey Ingestion & Automated Schema Profiling
- Ingest `.xlsx` and `.csv` files exported from Google Forms/Sheets, as well as one-click loading of bundled BEM UNDIP real demo datasets.
- Automatically detect and filter metadata/PII columns (e.g., `Timestamp`, `Nama`, `NIM`) from visual generation.
- Classify question types into structured categories:
  - Nominal / Demographics (e.g. Fakultas, Bidang, Jabatan)
  - Dichotomous Binary (e.g. Ya/Tidak)
  - Ordinal / Likert Scale (e.g. 1–4 or 1–5 agreement/frequency scales)
  - Multi-Select Checkbox responses (comma-delimited items needing frequency breakdown)
  - Open-Ended Text (essay responses)

### R2. Public-Friendly AI Recommendation Engine
- Recommend optimal, easily interpretable public charts based on question characteristics:
  - 2-3 categories -> Donut / Pie chart with percentage badges.
  - Multi-category or long labels -> Horizontal or Vertical Bar chart with value labels.
  - Multi-select checkboxes -> Ranked Horizontal Bar chart.
  - Likert scale ratings -> Ordered Likert frequency bar chart with percentage distribution.
- Prohibit overly complex/confusing charts (no radar charts, curve balls, or dense multi-axis plots).
- Provide an interactive curation table allowing the user to override chart types, modify titles, or toggle columns on/off.
- Support a hybrid architecture: 100% offline statistical heuristics by default, with an optional toggle for Gemini LLM to generate automated narrative insights for charts.

### R3. Theming & Visual Craftsmanship Studio
- **Typography Library**: Selectable presentation fonts (Poppins, Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather) with size adjustments for slide-ready legibility.
- **Color Palettes**: Curated institutional palettes (UNDIP Navy & Gold, Modern Emerald, Executive Pastel, Warm Sunset) plus a custom palette builder strictly validating >= 5 hex color codes.
- **Dimensionality**: Support both 2D Modern Flat and 3D Visual styling, configurable globally with per-chart override capability.
- **Branding & Layout**: Clean card layout with optional official footer watermark ("Biro Statistika BEM Universitas Diponegoro").

### R4. High-Resolution Batch Export & Asset Packaging
- Render charts into high-resolution images (~300 DPI / 3x scale) suitable for direct insertion into slide decks or social media.
- Package all rendered chart files into a single organized `.zip` archive for one-click download.

## Verification Resources
- Sample survey datasets available locally:
  - `C:\Users\geova\.gemini\antigravity\raw\survey_sample_1.csv` (UPGRADING BEM UNDIP Survey)
  - `C:\Users\geova\.gemini\antigravity\raw\survey_sample_2.csv` (Campus Safety & Catcalling Survey)

## Acceptance Criteria

### Data Ingestion & Demo Data
- [ ] Successfully parses both sample Excel/CSV survey datasets without schema errors.
- [ ] Correctly splits and tabulates comma-separated multi-select checkbox answers.
- [ ] Automatically identifies and excludes metadata/PII (`Timestamp`, `Nama`, `NIM`).
- [ ] 'Load BEM UNDIP Demo Data' button successfully populates the dashboard without requiring an uploaded file.

### Recommendation & Curation
- [ ] Assigns valid, public-friendly chart types to 100% of recognized survey questions.
- [ ] User can override recommended chart type or exclude any column from the UI.
- [ ] Optional LLM insight toggle executes gracefully when API key is provided, falling back seamlessly to offline statistics when disabled.

### Theming & Visual Standards
- [ ] Custom palette generator enforces validation of >= 5 valid hex codes before applying.
- [ ] Font selections visibly apply to title, axis, and data labels.
- [ ] 2D and 3D styles render accurately and permit individual chart overrides.

All exported images render without cropped labels, overlapping text, or visual distortion.

## 2026-09-14T09:37:36Z

A web-based automated survey analytics and visualization platform for Biro Statistika BEM Universitas Diponegoro that transforms raw Google Form spreadsheet/Excel exports into publication-grade, public-friendly presentation charts with an automated recommendation engine, interactive theming studio, and batch export.

Working directory: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app
Integrity mode: development

Resume and complete the project execution. Milestones 1 and 2 are partially/fully completed. Continue directly with Milestones 2, 3, 4, and 5.

## Requirements

### R1. Survey Ingestion & Automated Schema Profiling
- Ingest .xlsx and .csv files exported from Google Forms/Sheets, as well as one-click loading of bundled BEM UNDIP real demo datasets.
- Automatically detect and filter metadata/PII columns (e.g., Timestamp, Nama, NIM) from visual generation.
- Classify question types into structured categories (Nominal, Binary, Likert, Multi-select, Open-ended).

### R2. Public-Friendly AI Recommendation Engine
- Recommend optimal, easily interpretable public charts based on question characteristics.
- Prohibit overly complex/confusing charts (no radar charts, curve balls, or dense multi-axis plots).
- Provide an interactive curation table allowing the user to override chart types, modify titles, or toggle columns on/off.
- Hybrid architecture: 100% offline statistical heuristics by default, with optional toggle for Gemini LLM narrative insights.

### R3. Theming & Visual Craftsmanship Studio
- Typography Library: Selectable presentation fonts with size adjustments.
- Color Palettes: Curated institutional palettes plus custom palette builder strictly validating >= 5 hex codes.
- Dimensionality: Support 2D Modern Flat and 3D Visual styling, configurable globally with per-chart override.
- Branding & Layout: Clean card layout with optional official footer watermark ("Biro Statistika BEM Universitas Diponegoro").

### R4. High-Resolution Batch Export & Asset Packaging
- Render charts into high-resolution images (~300 DPI / 3x scale).
- Package all rendered chart files into a single organized .zip archive for one-click download.

## Verification Resources
- Sample survey datasets available locally in C:\Users\geova\.gemini\antigravity\raw\survey_sample_1.csv and survey_sample_2.csv.

