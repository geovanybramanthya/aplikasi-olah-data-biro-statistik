# Handoff Report: Survey Data Ingestion & Profiling Exploration

**Author**: Survey Explorer 1 (Data Ingestion Explorer)  
**Date**: 2026-09-14  
**Workspace Target**: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app`  
**Reference Dispatch**: `.agents/survey_explorer_1/DISPATCH.md`  

---

## 1. Observation

Direct empirical profiling was conducted across the local survey datasets provided in `C:\Users\geova\.gemini\antigravity\raw\`:
1. `survey_sample_1.csv` (UPGRADING BEM UNDIP Survey)
2. `survey_sample_2.csv` (Campus Safety & Catcalling Survey)
3. `Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx` (KTR UNDIP Survey)

### 1.1 Dataset Specifications & Structural Metrics

| Metric | Sample 1 (`survey_sample_1.csv`) | Sample 2 (`survey_sample_2.csv`) | Sample 3 (`KTR.xlsx`) |
| :--- | :--- | :--- | :--- |
| **Survey Topic** | UPGRADING Fungsionaris BEM UNDIP 2026 | Catcalling & Campus Construction Safety | Kawasan Tanpa Rokok (KTR) UNDIP |
| **Total Rows (Data)** | **134** respondents | **197** respondents | **265** respondents |
| **Total Columns** | **27** columns | **15** columns | **19** columns |
| **File Size** | 93,842 bytes (91.64 KB) | 45,222 bytes (44.16 KB) | 42,460 bytes (41.46 KB) |
| **Encoding** | UTF-8 (Strict, No BOM) | UTF-8 (Strict, No BOM) | Microsoft Excel OpenXML (.xlsx) |
| **Line Terminator** | LF (`\n`) | LF (`\n`) | N/A (Sheet XML rows) |
| **Delimiter** | Comma (`,`), RFC 4180 quoted | Comma (`,`), RFC 4180 quoted | N/A |
| **Header Whitespace** | **24 / 27** headers have leading/trailing whitespace | **4 / 15** headers have trailing whitespace | Clean strings / Float header representations |

---

### 1.2 Column Catalog & Automated Classification: Sample 1 (`survey_sample_1.csv`)

| Col # | Raw Header (Verbatim) | Trimmed Header | Type Classification | Unique | Distribution / Observed Patterns | Recommended Chart |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **0** | `Timestamp` | `Timestamp` | `METADATA_PII` | 134 | Form submission timestamp (`03/07/2026 16:04:04`) | *Excluded by default* |
| **1** | `Nama Lengkap ` | `Nama Lengkap` | `METADATA_PII` | 133 | Student full name (e.g. `Muhammad Daffa Al Fariqi`) | *Excluded by default* |
| **2** | `  Asal Bidang/Biro/Kantor  ` | `Asal Bidang/Biro/Kantor` | `NOMINAL_DEMOGRAPHIC` | 15 | Riset & Keilmuan (20.9%), Sosmas (12.7%), Seniora (11.2%), Sospol (10.4%), etc. | Horizontal Bar / Column Chart |
| **3** | `  Jabatan/Posisi  ` | `Jabatan/Posisi` | `NOMINAL_DEMOGRAPHIC` | 7 | Staf Muda (50.0%), Staf Ahli (29.9%), Kadiv (9.7%), Sekre (4.5%), Kabid (2.2%), Bendahara (2.2%), Waka (1.5%) | Donut / Horizontal Bar Chart |
| **4** | `Sudah berapa lama kamu aktif sebagai fungsionaris BEM Undip? ` | `Sudah berapa lama kamu aktif sebagai fungsionaris BEM Undip?` | `NOMINAL_DEMOGRAPHIC` | 3 | 4 bulan (86.6%), 2 periode (11.9%), 3 periode (1.5%) | Donut Chart with percentage badges |
| **5** | `Rata-rata berapa jam per minggu kamu menjalani aktivitas BEM? ` | `Rata-rata berapa jam per minggu kamu menjalani aktivitas BEM?` | `NOMINAL_DEMOGRAPHIC` | 4 | 5-10 jam (47.8%), <5 jam (20.1%), 10-20 jam (17.9%), >20 jam (14.2%) | Donut / Column Chart |
| **6** | `Seberapa besar tantangan yang kamu hadapi dalam menyeimbangkan tugas akademik dan tanggung jawab di BEM? ` | `Seberapa besar tantangan...` | `LIKERT_SCALE_1_4` | 4 | 1: 3.0%, 2: 23.1%, 3: 47.0%, 4: 26.9% | Likert Frequency Bar Chart |
| **7** | `Dalam menjalankan tugas BEM, aspek mana yang paling sering menjadi kendala? (Maks. 3) ` | `Dalam menjalankan tugas BEM, aspek mana... (Maks. 3)` | `MULTI_SELECT_CHECKBOX` | 14 tokens | Waktu (66.4%), Komunikasi (49.3%), Koordinasi (41.0%), Beban kerja (34.3%), Konflik internal (22.4%) | Ranked Horizontal Bar Chart |
| **8** | `Seberapa sering kamu telah menginternalisasi Nilai & Budaya BEM Undip 2026? ` | `Seberapa sering kamu telah menginternalisasi...` | `LIKERT_SCALE_1_4` | 4 | 1: 1.5%, 2: 11.2%, 3: 64.2%, 4: 23.1% | Likert Frequency Bar Chart |
| **9** | `Menurut kamu, seberapa manfaat yang dirasakan dari kegiatan Upgrading... ` | `Menurut kamu, seberapa manfaat yang dirasakan...` | `LIKERT_SCALE_1_4` | 4 | 1: 0.7%, 2: 9.7%, 3: 44.0%, 4: 45.5% | Likert Frequency Bar Chart |
| **10** | `Dalam kebutuhan ilmu berorganisasi, materi pencerdasan mana yang paling kamu butuhkan? (Maks. 3) ` | `Materi pencerdasan mana yang paling dibutuhkan (Maks. 3)` | `MULTI_SELECT_CHECKBOX` | 10 tokens | Stress Mgt (70.1%), Conflict Mgt (58.2%), Time Mgt (41.8%), Leadership (29.1%), Public Speaking (27.6%) | Ranked Horizontal Bar Chart |
| **11** | `Metode penyampaian materi dalam Upgrading seperti apa yang paling efektif menurut kamu? ` | `Metode penyampaian materi Upgrading paling efektif` | `MULTI_SELECT_CHECKBOX` | 5 tokens | Kombinasi seminar + FGD (64.9%), Workshop (39.6%), Seminar (26.9%), Studi kasus (21.6%), FGD (15.7%) | Ranked Horizontal Bar Chart |
| **12** | `Seberapa sering Anda mengalami stress atau burnout dalam menjalankan tugas sebagai fungsionaris BEM? ` | `Seberapa sering Anda mengalami stress atau burnout...` | `LIKERT_SCALE_1_5` | 5 | 1: 3.0%, 2: 17.9%, 3: 34.3%, 4: 30.6%, 5: 14.2% | Likert 1-5 Frequency Bar Chart |
| **13** | `Faktor apa yang paling sering menjadi sumber stres Anda? (maks 3)` | `Faktor sumber stres Anda (maks 3)` | `MULTI_SELECT_CHECKBOX` | 20 tokens | Tuntutan akademik (59.7%), Deadline proker (41.8%), Keterbatasan sumber daya (29.1%), Rasa tidak percaya diri (24.6%) | Ranked Horizontal Bar Chart |
| **14** | `Bagaimana cara kamu mengelola stres saat ini? ` | `Bagaimana cara kamu mengelola stres saat ini?` | `MULTI_SELECT_CHECKBOX` | 9 tokens | Istirahat/tidur (73.9%), Hiburan (47.0%), Solusi langsung (39.6%), Curhat (33.6%), Olahraga (15.7%) | Ranked Horizontal Bar Chart |
| **15** | `  Relevansi materi Stress Management` | `Relevansi materi Stress Management` | `LIKERT_SCALE_1_4` | 3 | Observed: 2 (7.5%), 3 (35.1%), 4 (57.5%) [Option 1 had 0 votes] | Likert Frequency Bar Chart |
| **16** | `  Aspek Stress Management apa yang paling ingin kamu pelajari?   ` | `Aspek Stress Management yang ingin dipelajari` | `MULTI_SELECT_CHECKBOX` | 7 tokens | Relaksasi/regulasi emosi (61.9%), Akademik-organisasi (44.8%), Mencegah burnout (44.8%), Keseimbangan (35.1%) | Ranked Horizontal Bar Chart |
| **17** | `  Seberapa sering kamu terlibat/menyaksikan konflik di lingkungan BEM Undip?  ` | `Seberapa sering terlibat/menyaksikan konflik...` | `LIKERT_SCALE_1_5` | 5 | 1: 5.2%, 2: 27.6%, 3: 32.8%, 4: 25.4%, 5: 9.0% | Likert 1-5 Frequency Bar Chart |
| **18** | `  Jenis konflik apa yang menurut kamu paling sering terjadi di lingkungan BEM?  (maks 2)` | `Jenis konflik paling sering terjadi (maks 2)` | `MULTI_SELECT_CHECKBOX` | 7 tokens | Konflik komunikasi (68.7%), Perbedaan pendapat proker (28.4%), Ketidakjelasan tugas (25.4%), Perbedaan prioritas (24.6%) | Ranked Horizontal Bar Chart |
| **19** | `  Bagaimana konflik biasanya diselesaikan di dalam bidang/biro/kantor kamu?  ` | `Bagaimana konflik biasanya diselesaikan...` | `MULTI_SELECT_CHECKBOX` | 13 tokens | Diskusi terbuka (82.8%), Melibatkan pihak ketiga (29.9%), Salah satu pihak mengalah (20.9%) | Ranked Horizontal Bar Chart |
| **20** | `Seberapa percaya diri kamu dalam menghadapi dan menyelesaikan konflik?` | `Percaya diri menyelesaikan konflik` | `LIKERT_SCALE_1_4` | 4 | 1: 1.5%, 2: 9.7%, 3: 49.3%, 4: 39.6% | Likert Frequency Bar Chart |
| **21** | `  Seberapa relevan materi Conflict Management dengan kamu saat ini?  ` | `Relevansi materi Conflict Management` | `LIKERT_SCALE_1_4` | 4 | 1: 1.5%, 2: 7.5%, 3: 38.8%, 4: 52.2% | Likert Frequency Bar Chart |
| **22** | `Aspek Conflict Management apa yang paling ingin kamu pelajari? (Maks. 2) ` | `Aspek Conflict Management yang ingin dipelajari (Maks. 2)` | `MULTI_SELECT_CHECKBOX` | 6 tokens | Komunikasi asertif (51.5%), Negosiasi/mediasi (50.0%), Akar konflik (30.6%), Ubah konflik jd peluang (30.6%) | Ranked Horizontal Bar Chart |
| **23** | `  Apakah materi Stress dan Conflict Management relevan untuk mengupgrade/meningkatkan skill kamu?  ` | `Relevansi materi Stress & Conflict Mgt untuk upgrade skill` | `LIKERT_SCALE_1_4` | 4 | 1: 0.7%, 2: 3.0%, 3: 38.8%, 4: 57.5% | Likert Frequency Bar Chart |
| **24** | `  Bagaimana kemampuan Stress dan Conflict Management mendukung Tri Dharma?  ` | `Dukungan kemampuan Stress & Conflict terhadap Tri Dharma` | `MULTI_SELECT_CHECKBOX` | 6 tokens | Iklim kondusif (59.7%), Nilai memanusiakan (57.5%), Regulasi emosi (47.0%), Fokus akademik (41.8%) | Ranked Horizontal Bar Chart |
| **25** | `  Apa harapan terbesar kamu terhadap program upgrading ini?  ` | `Apa harapan terbesar terhadap program upgrading?` | `OPEN_ENDED_TEXT` | 125 | Narrative text responses; 10 entered `"-"` | Qualitative Text Feed / Word Cloud |
| **26** | `  Adakah masukan atau opini terkait topik di upgrading kali ini?  ` | `Masukan atau opini terkait topik upgrading` | `OPEN_ENDED_TEXT` | 79 | Narrative text responses; 45 entered `"-"`, 6 entered `"tidak ada"` | Qualitative Text Feed / Word Cloud |

---

### 1.3 Column Catalog & Automated Classification: Sample 2 (`survey_sample_2.csv`)

| Col # | Raw Header (Verbatim) | Trimmed Header | Type Classification | Unique | Distribution / Observed Patterns | Recommended Chart |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **0** | `Timestamp` | `Timestamp` | `METADATA_PII` | 196 | Form submission timestamp (`02/03/2026 17:36:02`) | *Excluded by default* |
| **1** | `Nama (Diperkenankan menggunakan inisial)` | `Nama (Diperkenankan menggunakan inisial)` | `METADATA_PII` | 154 | Respondent names or initials (e.g. `A`: 10, `N`: 4, full names) | *Excluded by default* |
| **2** | `NIM` | `NIM` | `METADATA_PII` | 187 | Student identification numbers (`40040125650027`, `-`: 9) | *Excluded by default* |
| **3** | `Asal Fakultas` | `Asal Fakultas` | `NOMINAL_DEMOGRAPHIC` | 12 | FSM (16.8%), SV (15.2%), FPP (11.7%), FIB (10.2%), FH (10.2%), FT (7.6%), FISIP (6.6%), FK (6.1%), FKM (5.1%), FEB (5.1%), FPIK (4.6%), F.Psi (1.0%) | Horizontal Bar Chart |
| **4** | `Apakah Anda pernah mengalami atau menyaksikan tindakan catcalling di area konstruksi Undip dalam 6 bulan terakhir?` | `Pernah mengalami/menyaksikan catcalling di area konstruksi Undip 6 bulan terakhir` | `DICHOTOMOUS_BINARY` | 2 | **Ya: 106 (53.8%)**, **Tidak: 91 (46.2%)** | Donut Chart with percentage badges |
| **5** | `Saya merasa aman saat berjalan sendirian melewati area konstruksi di dalam kampus.` | `Merasa aman saat berjalan sendirian melewati area konstruksi` | `LIKERT_SCALE_1_4` | 4 | 1: 25.9%, 2: 30.5%, 3: 26.4%, 4: 17.3% | Likert Frequency Bar Chart |
| **6** | `Muncul rasa cemas atau tidak nyaman saat harus melewati kerumunan pekerja bangunan di area kampus. ` | `Muncul cemas/tidak nyaman saat melewati pekerja bangunan` | `LIKERT_SCALE_1_4` | 4 | 1: 12.7%, 2: 19.3%, 3: 29.4%, **4: 38.6%** | Likert Frequency Bar Chart |
| **7** | `Saya pernah mengubah rute perjalanan di dalam kampus untuk menghindari potensi pelecehan ataupun catcalling di area pembangunan.` | `Pernah mengubah rute perjalanan untuk menghindari pelecehan` | `LIKERT_SCALE_1_4` | 4 | 1: 28.4%, 2: 22.8%, 3: 27.9%, 4: 20.8% | Likert Frequency Bar Chart |
| **8** | `Saya pernah mengalami atau melihat tindak catcalling di area pembangunan yang memengaruhi saya menuju ruang perkuliahan` | `Mengalami/melihat catcalling memengaruhi akses perkuliahan` | `LIKERT_SCALE_1_4` | 4 | 1: 31.0%, 2: 20.3%, 3: 22.3%, 4: 26.4% | Likert Frequency Bar Chart |
| **9** | `Pihak kampus (birokrasi/satpam) telah memberikan pengawasan yang cukup di area sensitif pembangunan.` | `Kampus telah memberikan pengawasan cukup di area pembangunan` | `LIKERT_SCALE_1_4` | 4 | 1: 19.8%, **2: 39.1%**, 3: 26.4%, 4: 14.7% | Likert Frequency Bar Chart |
| **10** | `Saya mengetahui adanya kanal pelaporan yang jelas jika terjadi pelecehan di area kampus.` | `Mengetahui kanal pelaporan pelecehan di kampus` | `LIKERT_SCALE_1_4` | 4 | 1: 21.8%, 2: 24.4%, 3: 31.5%, 4: 22.3% | Likert Frequency Bar Chart |
| **11** | `Pihak kampus perlu memberikan sanksi tegas kepada pihak ketiga (kontraktor) jika pekerjanya melakukan pelecehan. ` | `Kampus perlu memberi sanksi tegas kepada kontraktor jika pekerja melecehkan` | `LIKERT_SCALE_1_4` | 4 | 1: 3.6%, 2: 2.5%, 3: 8.1%, **4: 85.8% (Massive Consensus)** | Likert Frequency Bar Chart |
| **12** | `Ceritakan kronologi kejadian yang dialami/dilihat bila berkenan (apa yang dilakukan/diucapkan pelaku).  ` | `Kronologi kejadian dialami/dilihat` | `OPEN_ENDED_TEXT` | 82 | Narrative descriptions; 116 entered `"-"`, 81 detailed incident reports | Qualitative Text Feed / Word Cloud |
| **13** | `Lokasi detail kejadian   ` | `Lokasi detail kejadian` | `OPEN_ENDED_TEXT` | 78 | Location text; 119 entered `"-"`, Top: Taman FSM, Teknik Elektro, Jembatan Sikatak, Parkir FH | Qualitative Text Feed / Word Cloud |
| **14** | `Perkiraan waktu (Tanggal, hari, dan jam)` | `Perkiraan waktu` | `OPEN_ENDED_TEXT` | 65 | Time text; 131 entered `"-"`, mentions of days, months, morning/evening | Qualitative Text Feed |

---

## 2. Logic Chain

### Step 2.1: Handling Dirty Headers and Whitespace Anomalies
- **Observation**: In Sample 1, 24 of 27 columns contained leading or trailing spaces (e.g. `'  Asal Bidang/Biro/Kantor  '`, `'Nama Lengkap '`). In Sample 2, columns had trailing spaces (e.g. `'Lokasi detail kejadian   '`).
- **Inference**: Direct dictionary lookups or exact-match column bindings will fail if the ingestion parser does not normalize column names.
- **Architectural Requirement**:
  1. Store two header properties per column: `rawName` (original string as parsed from file) and `cleanName` (`rawName.trim().replace(/\s+/g, ' ')`).
  2. The UI display should always display `cleanName` or an editable user-facing alias (`displayTitle`).

### Step 2.2: PII Detection and Filtering Rules
- **Observation**: Real Google Form exports include identifiers: `Timestamp` (Col 0 in all files), `Nama Lengkap ` (Sample 1 Col 1), `Nama (Diperkenankan menggunakan inisial)` (Sample 2 Col 1), and `NIM` (Sample 2 Col 2).
- **Inference**: Presenting individual student names, timestamps, or student numbers as category bars violates privacy principles and produces meaningless charts with 100+ categories.
- **Filtering Algorithm**:
  - Test trimmed lowercase header against regex patterns:
    `/^(timestamp|waktu|tanggal|date)$/i`
    `/^(nama|name|full\s*name|nama\s*lengkap|nama\s*\(.*?\))$/i`
    `/^(nim|npm|nomor\s*induk|student\s*id)$/i`
    `/^(email|surel|e-mail|alamat\s*email)$/i`
    `/^(no\s*hp|nomor\s*hp|no\s*wa|whatsapp|telepon|phone)$/i`
  - When matched, mark column status as `isExcluded: true`, `isPII: true`.
  - Provide a toggle in the UI Curation Table allowing administrative users to view or re-enable excluded columns if desired.

### Step 2.3: Parsing Multi-Select Responses and Edge Cases
- **Observation**:
  In Sample 1 Col 7, 10, 11, 13, 14, 16, 18, 19, 22, 24, Google Forms outputs multiple selected options separated by commas (e.g., `"Waktu, Komunikasi, Koordinasi"`).
  In Col 19, free-text entries from the "Other / Lainnya" option contain internal commas (e.g., Row 62: `"Diskusi internal divisi dulu, baru naik ke wakabid, nanti disampaikan ke kabid"`).
- **Inference**:
  - A naive split on `,` could fragment a single qualitative sentence into three parts.
  - However, across all 134 respondents, splitting by `, ` (comma followed by space) captures the standard fixed options with 99%+ accuracy (e.g. `'Waktu'`: 89 respondents, `'Komunikasi'`: 66 respondents).
  - In ranked horizontal bar charts, each token frequency represents the number of respondents who selected that option. The percentage should be calculated against **Total Survey Respondents ($N=134$)**, NOT against total token count, because respondents could pick up to 2 or 3 choices (sum of percentages exceeds 100%).

### Step 2.4: Likert Scale Detection and Normalization
- **Observation**:
  - Sample 2 contains seven 1–4 Likert statements (Cols 5–11), all mapped to numeric strings `"1"`, `"2"`, `"3"`, `"4"`.
  - Sample 1 contains 1–4 Likert statements (Cols 6, 8, 9, 20, 21, 23) AND 1–5 Likert statements (Cols 12, 17).
  - In Sample 1 Col 15 (`Relevansi materi Stress Management`), no respondent voted for option 1; observed responses were only `2`, `3`, `4`.
  - In Excel exports (`KTR.xlsx`), numeric Likert values are parsed as IEEE floats (`1.0`, `2.0`, `3.0`, `4.0`).
- **Inference**:
  - Likert heuristic must NOT demand that every value between 1 and 5 has at least 1 respondent.
  - Likert heuristic must coerce float representations (`1.0` -> `"1"`).
  - Standardized scale mapping for presentation:
    - 4-point scale: `1: Sangat Tidak Setuju / Rendah`, `2: Tidak Setuju / Cukup Rendah`, `3: Setuju / Cukup Tinggi`, `4: Sangat Setuju / Tinggi`.
    - 5-point scale: `1: Sangat Jarang / Sangat Rendah`, `2: Jarang / Rendah`, `3: Kadang-kadang / Netral`, `4: Sering / Tinggi`, `5: Sangat Sering / Sangat Tinggi`.

### Step 2.5: Open-Ended Qualitative Text Handling
- **Observation**: In Sample 1 Cols 25–26 and Sample 2 Cols 12–14, questions have high uniqueness (>60%), high text length, and high proportions of placeholder entries (`"-"`: 116/197, `"tidak ada"`: 6, `"_"`: 1).
- **Inference**: Standard bar/pie charts fail on open-ended text. The system should classify these as `OPEN_ENDED_TEXT` and either:
  1. Offer a dedicated Qualitative Narrative / Text Card view.
  2. Provide a frequency word cloud or token counter.
  3. Exclude from standard batch chart image export by default, or provide an LLM synthesis summary card.

---

## 3. Caveats

1. **Custom "Other" Responses with Commas**: When Google Forms captures a custom response via "Lainnya" that contains commas, standard comma splitting treats each comma-separated phrase as a distinct option. In our sample data, this accounted for only 1–3 responses per question.
2. **Missing Demographic Normalization**: In Sample 1 Col 1 (`Nama Lengkap`), one student submitted twice (`Muhammad Daffa Al Fariqi` appears at index 1 and 42). The system should treat each row as a survey submission; deduplication should be an optional toggle if ever required.
3. **Floating Point Strings in CSV vs XLSX**: In CSV files, values are plain text strings (`"1"`). In XLSX files read via browser libraries (`xlsx` / `SheetJS`), numeric cells may parse as JavaScript numbers (`1`) or formatted floats (`"1.0"`). Normalization to trimmed string without trailing `.0` is mandatory before classification.

---

## 4. Conclusion & Architecture Blueprint

### 4.1 Ingestion Pipeline Architecture

```
[ Raw CSV / XLSX Upload or Demo Data ]
                  │
                  ▼
         [ Header Sanitizer ]
   - Strip leading/trailing whitespace
   - Deduplicate empty column names
                  │
                  ▼
      [ PII & Metadata Scanner ]
   - Regex matching on headers (Timestamp, Nama, NIM, Email, etc.)
   - Flag as isPII = true, isExcluded = true
                  │
                  ▼
     [ Question Type Classifier ]
   ├── DICHOTOMOUS_BINARY     ──> Donut / Pie Chart with % badges
   ├── LIKERT_SCALE (1-4/1-5) ──> Ordered Likert Bar Chart with distribution
   ├── MULTI_SELECT_CHECKBOX  ──> Ranked Horizontal Bar Chart (% of N)
   ├── NOMINAL_DEMOGRAPHIC    ──> Donut (<=4) or Horizontal Bar (>4)
   └── OPEN_ENDED_TEXT        ──> Qualitative Narrative Card / Word Cloud
                  │
                  ▼
     [ Interactive Curation Table ]
   - User overrides: Chart Type, Custom Title, Visibility Toggle
                  │
                  ▼
     [ Theming & Chart Rendering Engine ]
```

### 4.2 Demo Dataset Specifications for "Load BEM UNDIP Demo Data"

To fulfill acceptance criteria:
- **Demo Dataset 1**: `UPGRADING BEM UNDIP 2026 (Internal Capacity, Stress & Conflict)`
  - Source: `survey_sample_1.csv`
  - Metrics: 134 respondents, 27 questions.
  - Focus: Demonstrates multi-select checkboxes, Likert 1-4 & 1-5 scales, and internal BEM governance demographics.
- **Demo Dataset 2**: `Campus Safety & Catcalling Survey (Public Policy & Infrastructure Audit)`
  - Source: `survey_sample_2.csv`
  - Metrics: 197 respondents, 15 questions.
  - Focus: Demonstrates PII filtering (`Nama`, `NIM`), dichotomous binary (`Ya/Tidak`), strong 85.8% Likert consensus, and qualitative incident logging.
- **Demo Dataset 3 (Bonus)**: `Kawasan Tanpa Rokok (KTR) UNDIP Survey`
  - Source: `Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx`
  - Metrics: 265 respondents, 19 questions.
  - Focus: Demonstrates `.xlsx` ingestion, float number normalization, and cross-faculty public health evaluation.

Both demo datasets should be pre-compiled into clean JSON / TypeScript data modules bundled directly in the frontend build (e.g., `src/data/demo_surveys.ts`) so the "Load BEM UNDIP Demo Data" button operates instantaneously with 0ms network latency and 100% offline reliability.

---

## 5. Verification Method

To independently verify the data profiling and classification results:

1. **Verify Strict UTF-8 & File Integrity**:
   ```powershell
   python -c "
   with open(r'C:\Users\geova\.gemini\antigravity\raw\survey_sample_1.csv', 'r', encoding='utf-8') as f:
       print('Sample 1 rows:', len(f.readlines()))
   with open(r'C:\Users\geova\.gemini\antigravity\raw\survey_sample_2.csv', 'r', encoding='utf-8') as f:
       print('Sample 2 rows:', len(f.readlines()))
   "
   ```
   *Expected result*: Sample 1 has 135 lines (1 header + 134 rows); Sample 2 has 198 lines (1 header + 197 rows).

2. **Verify Multi-Select Split Consistency**:
   Inspect Column 7 in Sample 1:
   ```powershell
   python -c "
   import csv, collections
   with open(r'C:\Users\geova\.gemini\antigravity\raw\survey_sample_1.csv', 'r', encoding='utf-8') as f:
       r = list(csv.reader(f))
   tokens = [t.strip() for row in r[1:] for t in row[7].split(',') if t.strip()]
   print('Top 3 kendala:', collections.Counter(tokens).most_common(3))
   "
   ```
   *Expected result*: `[('Waktu', 89), ('Komunikasi', 66), ('Koordinasi', 55)]`.

3. **Verify Dichotomous Binary in Sample 2**:
   Inspect Column 4 in Sample 2:
   ```powershell
   python -c "
   import csv, collections
   with open(r'C:\Users\geova\.gemini\antigravity\raw\survey_sample_2.csv', 'r', encoding='utf-8') as f:
       r = list(csv.reader(f))
   print(collections.Counter([row[4].strip() for row in r[1:]]))
   "
   ```
   *Expected result*: `Counter({'Ya': 106, 'Tidak': 91})`.

4. **Invalidation Conditions**:
   - If any column is classified as a chart target when it contains PII (`Nama`, `NIM`), the classification gate has failed.
   - If multi-select answers are parsed as monolithic unique strings instead of splitting on commas into ranked options, the multi-select pipeline has failed.
   - If Likert scale charts fail when a score value has 0 responses (e.g. Col 15 in Sample 1), the scale normalizer has failed.
