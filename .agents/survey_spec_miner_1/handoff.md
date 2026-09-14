# Handoff Report: BEM UNDIP Survey Analytics & Visualization Specification

**Agent**: Survey Spec Miner 1 (`survey_spec_miner_1`)  
**Mission**: Mine the complete specification matrix, recommendation heuristics, prohibited chart rules, theming & typography, UNDIP & custom palette validation (>=5 hex codes), 2D/3D styles, Gemini narrative toggle, and batch export acceptance criteria.  
**Date**: 2026-09-14  
**Target Path**: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_spec_miner_1\handoff.md`  

---

## 1. Observation

Direct empirical observations from inspecting `ORIGINAL_REQUEST.md`, `DISPATCH.md`, and authentic survey datasets in `C:\Users\geova\.gemini\antigravity\raw`:

1. **`ORIGINAL_REQUEST.md` (lines 12–41)**:
   - Mandates R1 (Ingestion & Schema Profiling of `.xlsx`/`.csv` + bundled demo data, PII filtering `Timestamp`, `Nama`, `NIM`, 5-category taxonomy: Nominal, Dichotomous Binary, Ordinal/Likert, Multi-Select Checkbox, Open-Ended Text).
   - Mandates R2 (Public-friendly AI recommendation: 2–3 categories -> Donut/Pie with percentage badges; multi-category/long labels -> Horizontal/Vertical Bar; multi-select -> Ranked Horizontal Bar; Likert -> Ordered Likert frequency bar; strict ban on radar, distorted 3D pies, multi-axis spaghetti; interactive curation override table; hybrid 100% offline statistical heuristics + optional Gemini LLM narrative toggle).
   - Mandates R3 (Typography library: Poppins, Montserrat, Inter, Plus Jakarta Sans, Roboto, Merriweather with size adjustments; Palettes: UNDIP Navy & Gold, Modern Emerald, Executive Pastel, Warm Sunset + custom builder strictly requiring $\ge 5$ hex codes; 2D Modern Flat vs 3D Visual styling with per-chart override; clean card layout with official footer watermark "Biro Statistika BEM Universitas Diponegoro").
   - Mandates R4 (High-res batch export ~300 DPI / 3x scale factor; single organized `.zip` archive download; zero label clipping/text collision).

2. **Dataset 1: `C:\Users\geova\.gemini\antigravity\raw\survey_sample_1.csv` (134 rows, 27 columns)**:
   - Header issues: leading/trailing whitespace in headers, e.g., `'  Asal Bidang/Biro/Kantor  '`, `'Nama Lengkap '`, `'  Jabatan/Posisi  '`.
   - Metadata/PII: `Timestamp` (134 unique), `Nama Lengkap ` (133 unique).
   - Nominal/Demographics: `Asal Bidang/Biro/Kantor` (15 unique bureaus/divisions), `Jabatan/Posisi` (7 unique positions: Staf Muda, Staf Ahli, Ketua Divisi, etc.).
   - Multi-Select Checkboxes: 10 columns contain comma-separated combinations, e.g., `Dalam menjalankan tugas BEM, aspek mana yang paling sering menjadi kendala? (Maks. 3) ` (333 total tokens across 134 rows, but only 14 unique tokens, token repeat ratio = $23.79$).
   - Ordinal/Likert: 9 columns contain discrete integer ratings [1..4] and [1..5], e.g., `Seberapa besar tantangan...` (1–4), `Seberapa sering Anda mengalami stress...` (1–5).
   - Open-Ended Text: 2 columns, e.g., `Apa harapan terbesar kamu terhadap program upgrading ini?  ` (124 unique essays; comma split yields 189 tokens with 186 unique tokens, token repeat ratio = $1.016$).

3. **Dataset 2: `C:\Users\geova\.gemini\antigravity\raw\survey_sample_2.csv` (197 rows, 15 columns)**:
   - Metadata/PII: `Timestamp` (196 unique), `Nama (Diperkenankan menggunakan inisial)` (155 unique), `NIM` (187 unique).
   - Nominal/Demographics: `Asal Fakultas` (12 faculties/schools).
   - Dichotomous Binary: `Apakah Anda pernah mengalami atau menyaksikan tindakan catcalling...` (exactly 2 unique values: `'Ya'`, `'Tidak'`).
   - Likert Scale: 7 columns measuring safety/perception on a strict 1–4 scale (`1`, `2`, `3`, `4`).
   - Open-Ended Text: 3 columns (`Ceritakan kronologi...`, `Lokasi detail...`, `Perkiraan waktu...`) containing descriptive strings or blank placeholders (`'-'`, `'_'`).

4. **Dataset 3: `Survei Penerapan Kawasan Tanpa Rokok (KTR)...xlsx` (265 rows, 19 columns)**:
   - Confirms Excel workbook ingestion requirement.
   - Contains demographic fields (`Fakultas`, `Angkatan`, `Jenis kelamin`), binary questions (`Apakah Anda mengetahui bahwa Undip telah menerapkan KTR?` -> `Ya` / `Tidak tahu`), and 4-point ordinal questions.

---

## 2. Logic Chain

1. **Schema Ingestion & PII Filtering**:
   - Google Forms produces automatic timestamps and optional identification fields (`Nama`, `NIM`, `Email`, `No HP`).
   - Because public advocacy publications must strictly protect respondent confidentiality, the parser must apply case-insensitive regex pattern matching against header names (`r'^(timestamp|waktu|tanda\s*waktu|nama.*|nim.*|email.*|no(\.|\s*)*hp|nomor\s*(hp|wa|whatsapp|telepon|kontak))$'`) to automatically flag and exclude these columns from chart generation by default.
   - Headers frequently contain irregular whitespace (`'  Asal Bidang/Biro/Kantor  '`). The ingestion engine must strip column names upon load.

2. **Mathematical Distinction between Multi-Select Checkboxes and Open-Ended Text**:
   - Both question types can contain commas. However, a naive `contains(',')` rule erroneously flags essay questions (e.g., "Harapannya, tentu setelah mengikuti upgrading...") as multi-select checkboxes.
   - In actual multi-select checkboxes, users choose from a fixed option list of 5–15 choices. Therefore, splitting by comma yields a high token repeat ratio ($\frac{\text{Total Tokens}}{\text{Unique Tokens}} \gg 3.0$, observed $23.79$).
   - In open-ended essays, splitting by comma yields unique sentence fragments ($\frac{\text{Total Tokens}}{\text{Unique Tokens}} \approx 1.0$, observed $1.016$, and unique row ratio $> 0.70$).
   - Therefore, the classifier must combine token repeat ratio, unique row ratio, average string length, and explicit question cues (`(Maks.`, `(Boleh memilih`) to cleanly separate them.

3. **Public-Friendly Recommendation Heuristics & Banned Visualizations**:
   - Target audience is general university students, campus administrators, and public social media followers.
   - Visual clarity is paramount:
     - 2–3 categories are best represented by **Donut Charts** (cleaner visual weight and center metric over solid pie).
     - Multi-category (4–12 items) or long labels (>15 chars) require **Horizontal Bar Charts** so category labels remain horizontal and readable without 45° tilt.
     - Multi-select checkbox items must be presented as **Ranked Horizontal Bar Charts** sorted by frequency, displaying both count ($n$) and respondent percentage ($\% = n / N_{\text{respondents}}$).
     - Likert scales must be presented as **Ordered Likert Frequency Bar Charts** preserving semantic scale direction (1 to 4/5 or STS to SS).
     - Confusing chart types (Radar, angled 3D Pie wedges, Dual-Y spaghetti plots) are strictly prohibited because they distort area perception and lead to erroneous conclusions.

4. **Theming, Institutional Palette & Custom Palette Validator**:
   - Universitas Diponegoro's institutional identity uses Deep Navy Blue and Royal Gold.
   - The platform must bundle 4 curated palettes with $\ge 5$ harmonized hex codes each to support Likert scales (up to 5–7 points) without repeating colors.
   - The Custom Palette Builder must enforce a strict validation invariant: at least 5 valid hex codes matching `^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`. If $< 5$ or syntax invalid, reject application.
   - The 2D vs 3D styling must allow a global preset with individual chart overrides. 3D styling must use subtle isometric shading/gradients without perspective tilt distortion on angular wedges.
   - Every exported chart must support the official branding footer watermark: *"Biro Statistika BEM Universitas Diponegoro"*.

5. **Offline Statistical Engine vs. Gemini LLM Narrative Toggle**:
   - The platform must function 100% autonomously offline without internet access or API keys.
   - Default engine computes exact descriptive statistics: sample size ($N$), missing count, mode, percentage, runner-up, Likert mean/median, and produces clean Indonesian executive summaries.
   - An optional toggle allows users to provide a Gemini API key. If enabled and valid, Gemini enriches the chart with strategic student advocacy recommendations. If unavailable, network fails, or key is missing, it falls back seamlessly to offline statistics without UI disruption.

6. **High-Resolution Batch Export (~300 DPI / 3x scale factor) & Zip Packaging**:
   - Standard web canvases render at 72–96 DPI (e.g. 800x500 px), which blurs when pasted into PowerPoint or printed.
   - Export engine must render at a 3x scale multiplier (e.g. 2400x1500 px), equivalent to ~300 DPI.
   - The engine must guarantee zero label clipping: auto-calculating label margins, wrapping long text, and placing percentage badges with adequate clearance.
   - All rendered charts are packaged into a single organized `.zip` file via client-side/server-side archiver with sanitized file names (`chart_01_<slug>.png`) and a metadata summary.

---

## 3. Caveats

- **Free-Form "Lainnya / Other" options**: In Google Forms checkboxes, if a user writes a custom "Lainnya: [text]" response, it creates a unique token. The multi-select parser should trim whitespace, normalize lowercase/titlecase for grouping, or aggregate options with frequency $= 1$ into a "Lainnya" bucket if $> 15$ unique tokens exist.
- **Unlabeled Numeric Likert Scales**: Some surveys use numeric ratings (1–4 or 1–5) without verbal scale labels in the CSV cells (e.g., Survey 2 uses numbers 1, 2, 3, 4). The system should provide default semantic labels (e.g. 1: Sangat Tidak Setuju, 2: Tidak Setuju, 3: Setuju, 4: Sangat Setuju) with user curation override capability.
- **LLM Rate Limits**: When Gemini narrative generation is triggered across 25+ survey charts simultaneously, API rate limits could be hit. The implementation must process narratives with concurrency control / queue or batch requests.

---

## 4. Conclusion

The specification for the BEM UNDIP Survey Analytics & Visualization Platform is fully mapped, mathematically grounded, and aligned with all requirements of R1–R4. The platform architecture requires:
1. Robust ingestion for CSV/Excel with header sanitization and regex-driven PII exclusion.
2. An automated classification engine separating Demographics, Dichotomous Binary, Likert, Multi-Select Checkboxes (via token repeat ratio $> 3.0$), and Open-Ended Essays.
3. A public-friendly recommendation engine mapping question types to Donut, Horizontal/Vertical Bar, Ranked Bar, and Ordered Likert charts, with an explicit ban on misleading charts.
4. Institutional typography (6 font families) and 4 institutional palettes (all $\ge 5$ hex codes), plus a strict $\ge 5$ hex custom palette validator.
5. A hybrid narrative architecture (100% offline statistics default + optional Gemini LLM toggle with graceful degradation).
6. A 3x scale (~300 DPI) batch export engine with label collision prevention and `.zip` packaging.

---

## 5. Verification Method

To verify these specifications against reference implementations and test cases:

1. **Schema Profiling & Classification Verification**:
   - Run classifier against `survey_sample_1.csv` and `survey_sample_2.csv`:
     ```powershell
     python -c "import pandas as pd; df = pd.read_csv(r'C:\Users\geova\.gemini\antigravity\raw\survey_sample_1.csv'); print('Loaded columns:', len(df.columns))"
     ```
   - Assert `Timestamp`, `Nama Lengkap`, and `NIM` are flagged as PII (`assert ctype == 'METADATA_PII'`).
   - Assert `Dalam menjalankan tugas BEM, aspek mana... (Maks. 3)` is classified as `MULTI_SELECT` with token repeat ratio $> 10.0$.
   - Assert `Apa harapan terbesar kamu...` is classified as `OPEN_ENDED_TEXT` with token repeat ratio $< 1.5$.
   - Assert `Apakah Anda pernah mengalami atau menyaksikan...` in Survey 2 is classified as `DICHOTOMOUS_BINARY`.

2. **Custom Palette Validator Verification**:
   - Unit test custom palette validator with:
     - 4 hex codes: `['#002D62', '#D4AF37', '#1E56A0', '#F39C12']` -> Must return `INVALID (count < 5)`.
     - 5 hex codes: `['#002D62', '#D4AF37', '#1E56A0', '#F39C12', '#4A90E2']` -> Must return `VALID`.
     - Invalid syntax: `['#002D62', '#D4AF37', 'blue', '#F39C12', '#4A90E2']` -> Must return `INVALID (malformed hex)`.

3. **High-Res Export & Label Protection Verification**:
   - Render a chart with a 45-character faculty name ("Fakultas Perikanan dan Ilmu Kelautan") at 3x scale.
   - Inspect rendered PNG dimensions (e.g. $2400 \times 1500$ px) and verify label text is completely within canvas bounds without clipping.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Ingestion | CSV & XLSX Parser | Ingest raw survey spreadsheets exported from Google Forms/Sheets | `.csv` or `.xlsx` file upload | Parsed tabular DataFrame / records | Rejects non-CSV/XLSX; reports encoding or syntax errors | `ORIGINAL_REQUEST.md` R1 |
| 2 | Ingestion | Bundled BEM UNDIP Demo Loader | One-click button to load authentic sample survey datasets without file upload | Click on "Load BEM Upgrading Survey" or "Load Catcalling Survey" | Pre-populated dashboard with sample data | Graceful toast alert if sample files are missing from server path | `ORIGINAL_REQUEST.md` R1 & Sample Files |
| 3 | Ingestion | Header Sanitization | Trims leading/trailing whitespace and normalizes invisible characters from column headers | Raw header strings (e.g. `'  Asal Bidang/Biro/Kantor  '`) | Clean normalized header strings (`'Asal Bidang/Biro/Kantor'`) | Preserves original string if empty | `survey_sample_1.csv` inspection |
| 4 | Profiling | Metadata & PII Exclusion Filter | Automatically detects and excludes respondent personal information (`Timestamp`, `Nama`, `NIM`, `Email`, `No HP`) from chart generation | Column name string and value patterns | Exclusion flag `is_pii: true`, omitted from default chart queue | Retains column in dataset schema; allows user manual override in curation table | `ORIGINAL_REQUEST.md` R1 & `survey_sample_2.csv` |
| 5 | Profiling | Dichotomous Binary Classifier | Identifies questions with exactly two discrete non-null responses (e.g. Ya/Tidak, Laki-laki/Perempuan) | Column values with `n_unique == 2` | Question Type: `DICHOTOMOUS_BINARY` | Falls through to nominal if missing/empty | `ORIGINAL_REQUEST.md` R1 & `survey_sample_2.csv` Col 5 |
| 6 | Profiling | Nominal / Demographic Classifier | Categorizes unordered categorical demographic questions (Fakultas, Bidang, Jabatan) | Unordered string categories with $2 < n_{\text{unique}} \le 20$ | Question Type: `NOMINAL_DEMOGRAPHIC` | Falls through to text if $n_{\text{unique}} > 20$ and high entropy | `ORIGINAL_REQUEST.md` R1 & `survey_sample_1.csv` |
| 7 | Profiling | Ordinal / Likert Scale Classifier | Detects ordered rating scales (1–4, 1–5, 1–7 or verbal scales like STS to SS) | Bounded integer series or recognized Likert vocabulary | Question Type: `ORDINAL_LIKERT` with scale bounds $[1..K]$ | Flags unmapped ordinal strings for manual scale ordering | `ORIGINAL_REQUEST.md` R1 & `survey_sample_2.csv` Cols 6-12 |
| 8 | Profiling | Multi-Select Checkbox Classifier & Tokenizer | Splits comma-delimited checkbox answers using token repeat ratio heuristic ($\frac{\text{tokens}}{\text{unique}} > 3.0$) and question cues | Comma-delimited cell strings | Question Type: `MULTI_SELECT`, list of distinct options with frequency counts | Differentiates from essay sentences via token repetition ratio | `ORIGINAL_REQUEST.md` R1 & `survey_sample_1.csv` Col 8 |
| 9 | Profiling | Open-Ended Text Classifier | Identifies free-form essay responses, feedback, and verbatim comments | High string length ($\text{mean} > 40$) and high unique ratio ($> 0.70$) | Question Type: `OPEN_ENDED_TEXT` | Does not generate misleading bar charts; routes to Text Highlights Card | `ORIGINAL_REQUEST.md` R1 & `survey_sample_1.csv` Col 26 |
| 10 | Recommendation | Binary / 2–3 Categories -> Donut Chart | Recommends Donut Chart with percentage badges and center metric for 2–3 options | Question with 2–3 unique categories | Donut Chart configuration with percentage badges | Fallback to Horizontal Bar if labels are very long ($> 20$ chars) | `ORIGINAL_REQUEST.md` R2 |
| 11 | Recommendation | Multi-Category -> Horizontal / Vertical Bar Chart | Recommends Horizontal Bar for $> 3$ categories or long labels, Vertical Bar for short labels | Nominal question with 4–12 categories | Bar Chart configuration with data value labels atop bars | Auto-switches to Horizontal if any label exceeds 12 characters | `ORIGINAL_REQUEST.md` R2 |
| 12 | Recommendation | Multi-Select -> Ranked Horizontal Bar Chart | Recommends Horizontal Bar chart sorted descending by frequency with count ($n$) and respondent percentage ($\%$) | Multi-select checkbox question | Ranked Horizontal Bar with footnote: "Responden dapat memilih $>1$ jawaban" | Handles long tail options by grouping as "Lainnya" if $>15$ items | `ORIGINAL_REQUEST.md` R2 & `survey_sample_1.csv` |
| 13 | Recommendation | Likert Rating -> Ordered Likert Frequency Bar Chart | Recommends ordered distribution bar chart preserving scale order (1 to 4/5) with percentage badges | Ordinal Likert question | Ordered Bar Chart (100% distribution or sequential bars) | Preserves scale ordering even if a rating category has 0 responses | `ORIGINAL_REQUEST.md` R2 & `survey_sample_2.csv` |
| 14 | Recommendation | Prohibited Charts Ban Engine | Strictly bans confusing chart types (Radar, angled 3D Pie wedges, Dual-Y spaghetti plots, bubble charts) | User chart selection or engine recommendation | Validation pass: blocks banned chart types from available choices | UI disables prohibited chart options with helpful tooltip explaining why | `ORIGINAL_REQUEST.md` R2 & Dispatch Task 2 |
| 15 | Curation | Interactive Curation Override Studio | Allows user to override recommended chart type, edit titles/subtitles, and toggle question visibility | User UI actions in curation table/cards | Updated presentation schema & layout | Disallows selecting banned chart types | `ORIGINAL_REQUEST.md` R2 |
| 16 | Curation | Question Sequence Reordering | Allows dragging or moving questions up/down to configure presentation sequence | User drag/reorder event | Reordered chart deck | Preserves default order if not modified | `ORIGINAL_REQUEST.md` R2 |
| 17 | Analytics | Offline Statistical Summary Engine | Computes exact descriptive statistics (N, missing, mode, %, runner-up, Likert mean/median, Top-Box) | Active question data series | Indonesian rule-based narrative summary card | Handles nulls/empty cells gracefully ($N_{\text{valid}}$ vs $N_{\text{total}}$) | `ORIGINAL_REQUEST.md` R2 & Dispatch Task 4 |
| 18 | Analytics | Optional Gemini LLM Narrative Toggle | Generates executive takeaways and student advocacy points via Gemini LLM when toggled on | User toggle switch + Gemini API Key | 2–3 bullet point strategic narrative for presentation slides | Falls back seamlessly to offline statistical summary if key missing/invalid | `ORIGINAL_REQUEST.md` R2 & Dispatch Task 4 |
| 19 | Theming | Institutional Typography Library | Provides 6 presentation-ready font families (`Poppins`, `Montserrat`, `Inter`, `Plus Jakarta Sans`, `Roboto`, `Merriweather`) | Font selection dropdown | Global & per-chart typography styling | Fallbacks to system sans-serif/serif if webfont fails to load | `ORIGINAL_REQUEST.md` R3 & Dispatch Task 3 |
| 20 | Theming | Typography Scale Modifier | Adjusts font sizes (Title 16–24px, Subtitle 12–15px, Ticks 11–14px, Badges 11–14px) for slide legibility | Font size slider / preset (Small, Medium, Large) | Scaled canvas font definitions | Enforces minimum legibility threshold (no text $<10$px) | `ORIGINAL_REQUEST.md` R3 |
| 21 | Theming | Curated Institutional Palettes | Provides 4 publication-grade palettes with $\ge 5$ harmonized hex codes each | Palette selection dropdown | Applied color cycle for chart marks | Each curated palette contains $\ge 6$ distinct colors | `ORIGINAL_REQUEST.md` R3 & Dispatch Task 3 |
| 22 | Theming | Custom Palette Builder & Strict Validator | Allows user to define custom brand colors with strict validation requiring $\ge 5$ valid hex codes | Custom hex string or color picker inputs | Custom color palette applied to charts | Rejects input if $<5$ valid hex codes or malformed; preserves current palette | `ORIGINAL_REQUEST.md` R3 & Dispatch Task 3 |
| 23 | Theming | 2D Modern Flat Styling | Renders clean minimalist SVG/Canvas charts with crisp solid fills and subtle card elevation | Theme selector = "2D Modern Flat" | Flat chart aesthetics with clean rounded badges | None | `ORIGINAL_REQUEST.md` R3 |
| 24 | Theming | 3D Visual Styling & Per-Chart Override | Renders subtle 3D depth, isometric shading, and ambient gradients without angular distortion | Theme selector = "3D Visual" (or per-chart override) | 3D rendered bars and layered donut rings | Blocks 3D perspective distortion on pie wedges | `ORIGINAL_REQUEST.md` R3 & Dispatch Task 3 |
| 25 | Branding | BEM UNDIP Footer Watermark | Renders official footer watermark: "Biro Statistika BEM Universitas Diponegoro" | Watermark toggle switch | Brand footer on card canvas | Allows toggling off or editing text; defaults to ON | `ORIGINAL_REQUEST.md` R3 |
| 26 | Export | High-Resolution Canvas Renderer (~300 DPI) | Renders charts at 3x scale factor (e.g. 2400x1500 px) for crisp slide and publication printing | Export button click | High-DPI Canvas blob / PNG image | Memory management for large canvas exports | `ORIGINAL_REQUEST.md` R4 & Dispatch Task 5 |
| 27 | Export | Zero Label Clipping & Collision Protection | Dynamically adjusts margins, wraps labels $>20$ chars, and applies clearance margins to badges | Chart rendering dimensions and label text | Perfectly contained chart graphic with zero truncated text | Truncates with ellipsis only if single word exceeds maximum canvas width | `ORIGINAL_REQUEST.md` R4 & Dispatch Task 5 |
| 28 | Export | Batch Zip Packaging Engine | Bundles all active high-res chart PNGs into a single downloadable `.zip` archive with manifest | Batch Export click | `BEM_UNDIP_Survey_Charts_<timestamp>.zip` | Shows progress bar; handles async generation without UI freeze | `ORIGINAL_REQUEST.md` R4 & Dispatch Task 5 |
| 29 | Export | Filename Sanitizer | Generates clean, human-readable, sanitized filenames for each exported chart image | Question index and question title | `chart_01_asal_bidang_biro_kantor.png` | Replaces non-alphanumeric characters with underscores, caps length to 50 chars | `ORIGINAL_REQUEST.md` R4 & Dispatch Task 5 |

---

## 3. Recommendation Heuristics & Prohibited Charts Matrix

### Detailed Recommendation Decision Logic

```
IF column is flagged as PII / Metadata:
    -> EXCLUDE FROM VISUAL GENERATION (Track in schema table)

ELSE IF question_type == 'DICHOTOMOUS_BINARY' (n_unique == 2):
    -> RECOMMEND: Donut Chart with percentage badges & center total metric

ELSE IF question_type == 'NOMINAL_DEMOGRAPHIC' and n_unique <= 3:
    -> RECOMMEND: Donut Chart (or Pie Chart) with percentage badges

ELSE IF question_type == 'NOMINAL_DEMOGRAPHIC' and (n_unique > 3 or max_label_len > 15):
    -> RECOMMEND: Horizontal Bar Chart (sorted descending, value labels outside/inside bar)

ELSE IF question_type == 'NOMINAL_DEMOGRAPHIC' and n_unique <= 6 and max_label_len <= 12:
    -> RECOMMEND: Vertical Bar Chart (value labels atop bars)

ELSE IF question_type == 'MULTI_SELECT':
    -> RECOMMEND: Ranked Horizontal Bar Chart
    -> Sort: Descending by respondent frequency
    -> Badges: Count (n) and Percentage (% of N_respondents)
    -> Mandatory Note: "Responden dapat memilih lebih dari satu jawaban (total persentase dapat melebihi 100%)"

ELSE IF question_type == 'ORDINAL_LIKERT':
    -> RECOMMEND: Ordered Likert Frequency Bar Chart
    -> Ordering: Strict semantic scale order (1 -> K or STS -> SS)
    -> Display: Percentage distribution badges per scale level

ELSE IF question_type == 'OPEN_ENDED_TEXT':
    -> RECOMMEND: Verbatim Highlights Card / Text Summary Table
    -> Ban: Do not force into categorical bar charts
```

### Prohibited Charts Specification

| Prohibited Chart Type | Why It Is Strictly Banned | Safe Public Alternative |
|-----------------------|---------------------------|-------------------------|
| **Radar / Spider Charts** | Highly confusing for general public; polygon area scales quadratically causing severe visual exaggeration; arbitrary categorical ordering alters visual shape misleadingly. | Horizontal Bar Chart or Grouped Bar Chart |
| **3D Pie Wedges with Perspective Tilt** | Angular perspective distortion makes foreground wedges appear 30–50% larger than equal background wedges; violates accurate data representation. | 2D Donut Chart with percentage badges, or 3D Layered Ring with top-down orthogonal view |
| **Dual-Y-Axis Spaghetti Plots** | Dual vertical scales with different ranges induce spurious correlations and confuse readers regarding which line corresponds to which axis. | Small Multiples (Side-by-side separate charts) or Normalized Index Chart |
| **Uncalibrated Bubble Charts** | Audiences struggle to accurately estimate circular area relative to radius; without reference comparison circles, bubbles are consistently misread. | Ordered Dot Plot or Horizontal Bar Chart |
| **3D Surface / Ribbon Plots** | Foreground peaks obstruct background data points (occlusion); 3D spatial positioning is unreadable on flat slides. | Heatmap or Trellis Bar Charts |

---

## 4. Theming, Typography & Brand Design System

### Curated Institutional Color Palettes (All $\ge 5$ Hex Codes)

| Palette Name | Institutional Context | Exact Hex Codes (Cycle Order) | Swatch Sample & Usage |
|--------------|-----------------------|-------------------------------|-----------------------|
| **UNDIP Navy & Gold** | Official BEM Universitas Diponegoro institutional branding | 1. `#002D62` (Deep Navy Blue)<br>2. `#D4AF37` (Royal Gold)<br>3. `#1E56A0` (Diponegoro Blue)<br>4. `#F39C12` (Vibrant Amber)<br>5. `#4A90E2` (Sky Navy Accent)<br>6. `#F9E79F` (Soft Gold Tint) | Formal campus reports, congress presentations, official student executive council releases |
| **Modern Emerald** | Campus sustainability, health, green environment, and clean campus initiatives | 1. `#0E6251` (Deep Forest Pine)<br>2. `#16A085` (Mint Emerald)<br>3. `#2ECC71` (Vibrant Jade)<br>4. `#82E0AA` (Soft Sage)<br>5. `#117A65` (Dark Teal)<br>6. `#A3E4D7` (Pale Seafoam) | Environmental surveys, smoke-free zone (KTR) reports, health & wellbeing assessments |
| **Executive Pastel** | Subtle, elegant, editorial presentation aesthetics with low cognitive fatigue | 1. `#6C88C4` (Soft Slate Periwinkle)<br>2. `#C47D9B` (Dusty Rose Mauve)<br>3. `#7BAE9D` (Muted Sage Gray)<br>4. `#E8A87C` (Warm Peach Sand)<br>5. `#E0C366` (Muted Ochre)<br>6. `#958DC4` (Soft Lavender) | Academic symposium slides, leadership sentiment surveys, internal bureau feedback |
| **Warm Sunset** | High energy, dynamic, impactful advocacy and student rights campaigns | 1. `#C0392B` (Crimson Sunset)<br>2. `#E67E22` (Tangerine Orange)<br>3. `#F39C12` (Sunburst Gold)<br>4. `#E74C3C` (Coral Red)<br>5. `#D35400` (Deep Amber)<br>6. `#F1C40F` (Solar Yellow) | Student advocacy, campus safety campaigns, catcalling awareness, urgency metrics |

### Custom Palette Builder Validation Rules
- **Rule 1 (Count Invariant)**: Must contain **at least 5 valid hex codes** ($\ge 5$). Input can contain 5, 6, 7, 8, or more colors.
- **Rule 2 (Format Invariant)**: Each color token must strictly match `^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`. If the user types a hex without `#`, the builder may auto-prepend `#` if the remaining 3 or 6 characters are valid hex.
- **Rule 3 (Rejection Behavior)**: If $< 5$ valid codes are entered (e.g. 4 codes), the "Apply Palette" button is disabled, an inline validation message displays *"Minimal 5 kode hex warna valid diperlukan (saat ini: N/5)"*, and the active chart theme remains unchanged.
- **Rule 4 (Contrast & Uniqueness)**: Hex codes should be unique (no exact duplicates) and pass WCAG AA contrast against white presentation card backgrounds ($> 3:1$ for chart graphics).

### Typography Library & Hierarchy

| Font Family | Visual Characteristics | Best Used For | Fallback Font Stack |
|-------------|------------------------|---------------|---------------------|
| **Poppins** | Geometric sans-serif, friendly, contemporary | Standard BEM UNDIP social media and slide deck graphics | `'Poppins', 'Segoe UI', system-ui, sans-serif` |
| **Montserrat** | High-impact geometric sans, editorial headings | Large title presentation decks, executive summaries | `'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif` |
| **Inter** | Neutral, tall x-height, ultra-legible | Data labels, small percentage badges, dense tables | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` |
| **Plus Jakarta Sans** | Indonesian-designed modern geometric grotesque | Official national/campus branding, modern clean UI | `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif` |
| **Roboto** | Universal neo-grotesque, highly balanced | Cross-platform compatibility, mobile & slide parity | `'Roboto', 'Helvetica Neue', Arial, sans-serif` |
| **Merriweather** | High-readability editorial serif | Formal academic reports, narrative insight paragraphs | `'Merriweather', 'Georgia', serif` |

**Slide-Ready Size Hierarchy**:
- **Chart Title**: 18px – 22px (Bold, weight 700, color `#1A202C`)
- **Subtitle / Question Context**: 13px – 15px (Regular, weight 400, color `#4A5568`)
- **Axis Labels / Category Ticks**: 12px – 14px (Medium, weight 500, color `#2D3748`)
- **Data Value / Percentage Badges**: 12px – 14px (Semi-Bold, weight 600, high-contrast)
- **Footer Watermark**: 11px – 12px (Regular/Italic, color `#718096`)

### Dimensionality: 2D Flat vs. 3D Visual Styling
1. **2D Modern Flat**:
   - Clean solid vector fills from active palette.
   - 1px crisp outline with subtle contrast border (`rgba(0,0,0,0.05)`).
   - Rounded pill badges for percentage labels.
   - Clean white card background with elevation shadow `0 4px 12px rgba(0, 0, 0, 0.05)`.
2. **3D Visual Styling**:
   - Subtle vertical linear gradient fill on bars (15% lighter at top edge, 10% deeper shade at base) to create tactile cylindrical or extruded bar volume.
   - Soft ambient occlusion drop shadow under bars (`rgba(0,0,0,0.12)` blur 4px offset y 2px).
   - For Donut charts: concentric inner bevel and layered depth ring without perspective angle tilt.
   - **Strict prohibition**: No angled perspective tilt on pie wedges.
3. **Hierarchy & Override Rules**:
   - Global Theme Studio sets default mode ("2D Flat" vs "3D Visual").
   - Individual question cards provide an override selector: `[Inherit Global | Force 2D | Force 3D]`.

---

## 5. Offline Statistics & Gemini Hybrid Narrative Engine Spec

### Default Architecture: 100% Offline Statistical Engine
The platform must calculate and render statistical insights locally in the browser or local server with 0 network dependencies.
- **Metrics Calculated**:
  - Sample size: $N_{\text{valid}}$ and $N_{\text{total}}$ (with missing percentage if $N_{\text{missing}} > 0$).
  - Mode: top choice name, count, and percentage share.
  - Runner-up: 2nd highest choice name, count, and percentage share.
  - Likert metrics: Mean score ($\mu = \frac{\sum w_i n_i}{N}$), Median, Top-Box score (% responding 4 or 5 / Agree or Strongly Agree).
  - Multi-select metrics: Total selections count, average selections per respondent ($\frac{\sum n_i}{N_{\text{respondents}}}$), top rank item.
- **Offline Narrative Template (Indonesian)**:
  - *Nominal / Binary*: `"Mayoritas responden ({top_pct}%, n={top_count}) memilih '{top_choice}', diikuti oleh '{second_choice}' sebesar {second_pct}% (n={second_count}). Total {n_valid} responden."`
  - *Likert Scale*: `"Tingkat persetujuan responden mencapai {top_box_pct}% (Top-Box: Setuju & Sangat Setuju), dengan skor rata-rata {mean_score:.2f} dari skala {scale_max}. Mayoritas responden cenderung {tendency}."`
  - *Multi-Select*: `"Kendala/faktor yang paling dominan adalah '{top_choice}' dipilih oleh {top_pct}% responden (n={top_count}), diikuti oleh '{second_choice}' ({second_pct}%). Rata-rata responden memilih {avg_choices:.1f} opsi."`

### Optional Gemini LLM Narrative Engine
- **Activation**: Toggle switch in UI ("Aktifkan Gemini AI Narrative").
- **API Key**: Configured via secure input field (stored only in local browser state / session memory; never persisted to public git repo or hardcoded).
- **Prompt Structure**: Sends only aggregated frequency distributions and question text (zero PII or raw rows transmitted).
- **Prompt Formulation**:
  ```text
  Role: Analis Kebijakan Mahasiswa BEM Universitas Diponegoro.
  Konteks: Survei internal BEM UNDIP untuk publikasi slide deck dan advokasi kampus.
  Pertanyaan: "{question_title}"
  Distribusi Data: {aggregated_distribution_json}
  Metrik Statistik: N={n_valid}, Rata-rata={mean_or_mode}, Top-Box={top_box_pct}%
  Tugas: Buat 2-3 poin ringkasan naratif eksekutif berbahasa Indonesia yang tajam, profesional, dan actionable untuk slide presentasi.
  Panjang: Maksimal 60 kata. Hindari jargon teknis yang berlebihan.
  ```
- **Fallback & Resilience**:
  - If API key is empty, invalid, returns error 401/429/500, or browser is offline:
    - Display a subtle badge: `[Statistik Otomatis (Offline)]`.
    - Render the offline rule-based summary without throwing an error dialog or breaking card layout.
    - Log error to dev console only.

---

## 6. High-Resolution Batch Export & Asset Packaging Spec

### Resolution & Scaling Specifications
- **Target DPI**: ~300 DPI publication quality.
- **Base Card Canvas**: $800 \times 500$ px (16:10 presentation ratio) or $800 \times 600$ px (4:3 ratio).
- **Scale Multiplier**: $3.0\times$ (renders bitmap at $2400 \times 1500$ px or $2400 \times 1800$ px).
- **Image Format**: PNG (Lossless 24-bit RGB with alpha transparency or clean `#FFFFFF` solid background).

### Zero Label Clipping & Collision Protection Guarantees
1. **Dynamic Left Margin / Padding**:
   - For Horizontal Bar Charts, measure maximum text pixel width of category labels.
   - If max label width $> 180$ px:
     - Wrap text into multi-line strings (max 22 characters per line, up to 2 lines).
     - Dynamically allocate left padding: `margin.left = Math.min(260, max_label_width + 24)`.
2. **Percentage & Value Badge Clearance**:
   - For Horizontal Bar:
     - If bar width $> 25\%$ of max bar length: place badge inside bar, right-aligned with 10px padding (white bold text).
     - If bar width $\le 25\%$: place badge outside bar to the right with 8px clearance (palette color bold text).
   - For Donut Chart:
     - Place percentage badges on outer callout arcs or radially centered inside wide slices ($> 12\%$ share). Small slices ($< 8\%$) displayed in side legend to prevent badge overlapping.
3. **Card Container Layout Invariant**:
   - Canvas zones strictly partitioned:
     - Header Zone (Title + Subtitle): 0px to 80px (with 16px bottom breathing room).
     - Chart Canvas Zone: 80px to 420px.
     - Narrative Zone: 420px to 470px.
     - Watermark Footer Zone: 470px to 500px.
   - Text elements never cross or overlap container borders.

### Batch Zip Packaging Criteria
- **Packaging Library**: Client-side JSZip (or Python zipfile if backend-based).
- **Naming Standard**: `chart_{index:02d}_{sanitized_title}.png`.
  - Example: `chart_01_asal_fakultas.png`, `chart_02_pengalaman_catcalling.png`.
- **Sanitization Rule**: `re.sub(r'[^a-zA-Z0-9_]+', '_', title.lower()).strip('_')[:40]`.
- **Zip Archive Structure**:
  ```text
  BEM_UNDIP_Survey_Charts_20260914_153000.zip
  ├── chart_01_asal_bidang_biro_kantor.png
  ├── chart_02_sudah_berapa_lama_aktif.png
  ├── chart_03_aspek_kendala_tugas_bem.png
  ├── chart_04_tingkat_stress_burnout.png
  ├── chart_05_relevansi_materi_stress_management.png
  ├── ...
  └── METADATA_SURVEI.json (or README.txt detailing N, questions, date, and palettes used)
  ```
- **Asynchronous Execution**:
  - Show modal progress indicator during batch export: `"Rendering grafik 4/18 (22%)..."`.
  - Process charts sequentially via offscreen canvas to prevent browser memory exhaustion.

---

## Edge Cases

| # | Feature | Input | Observed Behavior | Handling Rule / Invariant |
|---|---------|-------|-------------------|---------------------------|
| 1 | Ingestion | Column headers with leading/trailing whitespace (`'  Asal Bidang/Biro/Kantor  '`, `'Nama Lengkap '`) | Header lookups fail if exact matching without stripping is used | Parser must run `.strip()` on all column headers immediately upon ingestion |
| 2 | Ingestion | Embedded quotes inside survey cells (`"Upgrading dengan pembawaan santai... benar"" menjawab keresahan..."`) | Naive regex CSV split breaks row alignment | Use RFC 4180 compliant CSV parser (e.g. PapaParse or Python `csv.reader`) that handles escaped quotes |
| 3 | Classification | Open-ended essay containing commas (`"Harapannya, tentu setelah upgrading, saya menjadi pribadi lebih baik..."`) | Naive comma check classifies essays as `MULTI_SELECT` | Calculate token repeat ratio: if $\frac{\text{tokens}}{\text{unique}} \le 2.0$ and unique row ratio $> 0.70$, classify as `OPEN_ENDED_TEXT` |
| 4 | Classification | Multi-select checkboxes with custom "Lainnya / Other" entries written by respondents | Creates rare 1-off tokens among standard options | Group tokens: normalize options; if $>15$ unique tokens, group options with frequency $\le 1$ under `"Lainnya"` |
| 5 | Classification | Likert scale using numbers without text labels (`1`, `2`, `3`, `4`) | Appears as pure integers; axis labels might render as raw numbers | Recognize domain $[1..4]$; provide default semantic labels (1: STS, 2: TS, 3: S, 4: SS) with editable curation override |
| 6 | Classification | Dichotomous question with non-standard labels (`'Ya'`, `'Tidak tahu'`) | Differs from standard `'Ya'`/`'Tidak'` | `n_unique == 2` flags as `DICHOTOMOUS_BINARY`; Donut Chart assigns distinct palette colors to both choices |
| 7 | Curation | Question with 100% missing or placeholder data (`'-'`, `'_'`, `NaN`) | Zero valid records | Mark as `EMPTY_DATA`; exclude from chart rendering; alert user in curation table |
| 8 | Theming | Custom palette builder receives 4 valid hex codes (`#002D62, #D4AF37, #1E56A0, #F39C12`) | Less than 5 required codes | Strict validator blocks submission: displays alert *"Minimal 5 warna hex diperlukan"*; retains existing palette |
| 9 | Theming | Custom palette builder receives hex code without `#` (`002D62`) | Missing leading hash | Auto-normalize if exactly 3 or 6 hex digits (`#002D62`), otherwise reject with format error |
| 10 | Theming | User applies 3D Visual styling to a 2-category Donut chart | Risk of perspective angle distortion | Render 3D concentric ring depth shading without elliptical perspective tilt; preserve exact 180° / 360° area proportions |
| 11 | Export | Long category name (e.g. 52 chars: `"Fakultas Perikanan dan Ilmu Kelautan Universitas Diponegoro"`) | Label bleeds off canvas margin or collides with chart bar | Auto-wrap text at 22 chars; dynamically expand canvas margin; force Horizontal Bar orientation |
| 12 | Export | Category has very low percentage ($1.5\%$) in Horizontal Bar chart | Bar is very narrow; value badge cannot fit inside | Badge positioning logic detects bar width $< 25\%$; renders badge outside bar with safe 8px offset |
| 13 | Narrative | Gemini API key invalid, expired, or network disconnected | API call fails (HTTP 401 or network exception) | Gracefully catch exception; fallback silently to offline descriptive statistical narrative; show offline indicator |
| 14 | Export | Batch export invoked on a survey with 30+ questions | Browser freezes or runs out of memory if 30 canvases rendered concurrently at 3x scale | Sequential asynchronous loop with `requestAnimationFrame` / `setTimeout` and visual progress bar |
| 15 | Ingestion | Column has identical values across all respondents (e.g. Angkatan = 2026 for all) | $n_{\text{unique}} == 1$ | Flag as `CONSTANT_VALUE`; recommend Single Metric Stat Card rather than a degenerate 1-slice Donut Chart |
