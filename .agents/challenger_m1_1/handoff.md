# Handoff Report: Milestone 1 Adversarial Challenge & Verdict

**Challenger**: Milestone 1 Challenger 1 (`challenger_m1_1`)  
**Role**: Empirical Challenger (critic, specialist)  
**Target Path**: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\challenger_m1_1\handoff.md`  
**Verdict**: **REJECT**  
**Timestamp**: 2026-09-14T09:05:00Z  

---

## 1. Observation

Direct empirical observations from executing adversarial tests in `tests/adversarial_m1_1.cjs` against Milestone 1 ingestion and profiling modules (`csvParser.ts`, `excelParser.ts`, `piiFilter.ts`, `questionClassifier.ts`, `multiSelectSplitter.ts`, `statistics.ts`):

```powershell
node tests/adversarial_m1_1.cjs
```

**Overall Result**: 23 PASSED, 7 FAILED out of 30 test cases.

### Observation 1: Critical PII False Positive Over-Filtering
- **File**: `src/core/parser/piiFilter.ts`, lines 7–13
- **Code**:
  ```typescript
  export const PII_PATTERNS: RegExp[] = [
    /^(timestamp|waktu|tanggal|date|tanda\s*waktu)/i,
    /^(nama|name|full\s*name|nama\s*lengkap|nama\s*\(.*?\)|nama\s*responden|nama\s*mahasiswa)/i,
    /^(nim|npm|nrp|nomor\s*induk(\s*mahasiswa)?|student\s*id)/i,
    /(email|surel|e-mail)/i,
    /(no\.?\s*hp|nomor\s*hp|no\.?\s*wa|nomor\s*wa|whatsapp|telepon|no\.?\s*telepon|phone|nomor\s*telepon|kontak|nomor\s*kontak)/i,
  ];
  ```
- **Empirical Execution Result**:
  - `isPIIColumn("Waktu pelaksanaan webinar yang Anda inginkan?")` → `true` (FALSE POSITIVE)
  - `isPIIColumn("Tanggal kegiatan yang paling efektif untuk divisi Anda")` → `true` (FALSE POSITIVE)
  - `isPIIColumn("Nama kegiatan yang paling berkesan bagi Anda selama upgrading?")` → `true` (FALSE POSITIVE)
  - `isPIIColumn("Nama departemen atau biro pilihan pertama Anda")` → `true` (FALSE POSITIVE)
  - `isPIIColumn("Date of event preference")` → `true` (FALSE POSITIVE)
- **Impact in Pipeline (`profileDataset` in `csvParser.ts:57-58`)**:
  These genuine survey questions receive `type: 'METADATA_PII'`, `isPII: true`, `isExcluded: true`, and `recommendedChart: 'none'`. They are completely excluded from visualization studio generation.

### Observation 2: PII Leakage on Common Indonesian Formatting
- **File**: `src/core/parser/piiFilter.ts`, lines 10 & 12
- **Empirical Execution Result**:
  - `isPIIColumn("N.I.M.")` → `false` (PII LEAK)
  - `isPIIColumn("N.P.M.")` → `false` (PII LEAK)
  - `isPIIColumn("No. Telp")` → `false` (PII LEAK)
  - `isPIIColumn("Nomor Telp")` → `false` (PII LEAK)
- **Impact**: Student ID numbers with periods and phone numbers under `"No. Telp"` bypass the privacy filter, resulting in confidential student identity being rendered into public demographic charts.

### Observation 3: Data Overwrite Collision on Duplicate Header Names
- **File**: `src/core/parser/csvParser.ts`, lines 155–161 & line 33
- **Code**:
  ```typescript
  const record: Record<string, string> = {};
  for (let c = 0; c < rawHeaders.length; c++) {
    const header = rawHeaders[c];
    record[header] = rowData[c] !== undefined ? String(rowData[c]) : '';
  }
  rawRows.push(record);
  ```
- **Empirical Execution Result**:
  When input CSV has duplicate headers (e.g. `Timestamp,Catatan,Catatan`):
  ```
  col1 (first 'Catatan'): ['Catatan Kedua', 'Catatan Empat']
  col2 (second 'Catatan'): ['Catatan Kedua', 'Catatan Empat']
  ```
  `record[header]` overwrote the first column's data with the second column's data. Column 0 data is permanently lost.

### Observation 4: Non-Response Placeholders Misclassified as `DICHOTOMOUS_BINARY`
- **File**: `src/core/profiler/questionClassifier.ts`, line 91 & lines 138–143
- **Code**:
  ```typescript
  if (isBinaryText || (avgLength < 30 && !/^[1-5]$/.test(uniqueValues[0]))) {
    return {
      type: 'DICHOTOMOUS_BINARY',
      isMultiSelect: false,
      reason: 'Exactly 2 discrete categories',
    };
  }
  ```
- **Empirical Execution Result**:
  `classifyQuestion('Keluhan atau Kendala Khusus', ['-', '-', '_', '-', '_', '-'])` returns:
  `type: 'DICHOTOMOUS_BINARY'`, `recommendedChart: 'donut'`.
- **Impact**: A column containing only placeholder dashes and underscores is misidentified as a Ya/Tidak binary question and recommended for a Donut chart.

### Observation 5: Mixed CRLF / LF Merges Rows in PapaParse
- **File**: `src/core/parser/csvParser.ts`, line 136
- **Empirical Execution Result**:
  Parsing a CSV string containing mixed `\r\n` and `\n` line endings (`Timestamp,Nama,Fakultas\r\n2026-01-01,Andi,FT\r\n2026-01-02,Budi,FEB\n2026-01-03,Citra,FSM`) produces `rowCount: 2` instead of `3`, because PapaParse locks delimiter/newline to `\r\n` and merges the LF-separated rows.

### Observation 6: Small-Sample Multi-Select ($N \le 3$) Fails to Split
- **File**: `src/core/profiler/questionClassifier.ts`, lines 174–177
- **Empirical Execution Result**:
  A survey question with $N=3$ respondents picking from checkboxes (`'Pilihan A, Pilihan B'`, `'Pilihan B, Pilihan C'`, `'Pilihan A, Pilihan C'`) with hint `(boleh memilih lebih dari 1)` has `tokenRepeatRatio = 2.0`. Because the heuristic demands `tokenRepeatRatio > 2.2`, it classifies the column as `NOMINAL_DEMOGRAPHIC`. The comma responses are treated as raw unsplit strings rather than ranked bars.

---

## 2. Logic Chain

1. **Premise**: Ingestion and schema profiling must accurately identify metadata/PII without dropping legitimate survey questions (`ORIGINAL_REQUEST.md § R1, AC`).
   - **Observation 1**: Regex `/^(timestamp|waktu|tanggal|date|tanda\s*waktu)/i` and `/^(nama|name...)/i` match any question beginning with "Waktu", "Tanggal", "Nama", or "Date" because they lack word boundaries or terminal string anchors (`$`).
   - **Deduction**: Legitimate campus advocacy questions such as `"Waktu pelaksanaan webinar yang Anda inginkan?"` or `"Nama kegiatan yang paling berkesan..."` are automatically flagged as PII and hidden (`isExcluded: true`, `recommendedChart: 'none'`).
   - **Observation 2**: Indonesian students frequently abbreviate telephone as `"No. Telp"` / `"Nomor Telp"` and student IDs with punctuation as `"N.I.M."`. These do not match `/^nim/` or `/telepon/`.
   - **Deduction**: Student private contact details and IDs will bypass filtration and be displayed on charts.

2. **Premise**: Data ingestion must preserve exact column contents without silent data corruption (`PROJECT.md § Feature 1 & 3`).
   - **Observation 3**: `csvParser.ts` constructs row objects indexed by raw header string: `record[header] = ...`.
   - **Deduction**: When duplicate header strings occur (common in Google Form survey sections or un-named Likert matrix scales), the later column silently overwrites preceding columns in `rawRows`, causing irreversible data loss.

3. **Premise**: Question classification heuristics must not hallucinate binary structures from missing data (`PROJECT.md § Feature 5`).
   - **Observation 4**: In `questionClassifier.ts:138`, if unique values count is 2 and strings are $<30$ characters not matching `^[1-5]$`, it unconditionally classifies the column as `DICHOTOMOUS_BINARY`.
   - **Deduction**: When respondents answer placeholder characters (`'-'` and `'_'`), the engine identifies them as 2 categories and generates a Donut chart instead of treating them as un-populated/open-ended fields.

4. **Premise**: Parsing must be resilient across operating systems and export formats (`ORIGINAL_REQUEST.md § AC`).
   - **Observation 5**: PapaParse without input newline normalization fails when mixed `\r\n` and `\n` line endings occur.
   - **Deduction**: Uploads combining Windows and Unix newline formats experience row truncation.

---

## 3. Caveats

1. **Production Build & Standard Samples**: The worker's implementation builds cleanly (`npm run build` exits 0) and passes standard happy-path tests on `survey_sample_1.csv` and `survey_sample_2.csv`. The flaws exposed here emerge under adversarial corner cases, varied Indonesian phrasing, and data boundaries.
2. **Review-Only Constraint**: As an empirical challenger, I have not modified any implementation code in `src/`. All flaws are reported for remediation by the implementer.
3. **Multi-Select Repeat Ratio**: The Token Repeat Ratio concept is fundamentally sound for larger samples ($N > 15$), but requires a sample-size-aware lower bound or explicit hint priority for pilot surveys ($N \le 5$).

---

## 4. Conclusion

**Verdict: REJECT**

Milestone 1 cannot be approved in its current state due to:
1. **Critical Functionality Bug**: False-positive PII exclusion hiding valid survey questions starting with "Waktu", "Tanggal", "Nama", and "Date".
2. **Privacy Vulnerability**: PII leaks for dotted academic IDs (`"N.I.M."`, `"N.P.M."`) and standard phone abbreviations (`"No. Telp"`, `"Nomor Telp"`).
3. **Data Integrity Flaw**: Silent data overwrite when CSVs contain duplicate column header names.
4. **Classification Flaw**: Non-response placeholders (`'-'`, `'_'`) misclassified as `DICHOTOMOUS_BINARY` Donut charts.
5. **Parser Flaw**: Mixed `\r\n` and `\n` line endings causing merged rows in PapaParse.

**Actionable Remediation Required**:
1. **In `src/core/parser/piiFilter.ts`**:
   - Anchor or constrain PII regexes: match `"Waktu"` only if followed by end of string or metadata terms (e.g. `^(waktu|tanggal|timestamp|date)(\s*(pengisian|tanggapan|submit))?$` or negative lookahead `(?!\s+(pelaksanaan|kegiatan|acara|yang|anda))`).
   - Add dot tolerance for academic IDs: `/^(n\.?i\.?m\.?|n\.?p\.?m\.?|n\.?r\.?p\.?|nomor\s*induk(\s*mahasiswa)?|student\s*id)/i`.
   - Add `"telp"` to telephone regex: `/(no\.?\s*(hp|wa|telp)|nomor\s*(hp|wa|telp|telepon)|telepon|phone|whatsapp|kontak)/i`.
   - Constrain `"nama"` to prevent matching `"Nama kegiatan/divisi"`: `/^(nama|name|full\s*name|nama\s*lengkap|nama\s*\(.*?\)|nama\s*responden|nama\s*mahasiswa)($|\s*\()/i` with negative lookahead for non-person entities.
2. **In `src/core/parser/csvParser.ts`**:
   - Normalize CSV input line endings before parsing: `csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')`.
   - Index rows by column index rather than raw header string, or disambiguate duplicate headers (`Header`, `Header (1)`).
3. **In `src/core/profiler/questionClassifier.ts`**:
   - Pre-filter placeholder values (`'-'`, `'_'`, `'.'`) before evaluating `uniqueValuesCount === 2`.
   - Lower Token Repeat Ratio threshold to $> 1.5$ when explicit multi-select hint is present (`hasCheckboxHint`).

---

## 5. Verification Method

To independently reproduce all 7 failures:

1. **Run the Adversarial Test Suite**:
   ```powershell
   cd C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app
   node tests/adversarial_m1_1.cjs
   ```
   *Expected result*: Reproduces 7 failures across Categories 1, 2, 3, and 6.

2. **Inspect Test Script & Assertions**:
   - File: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\tests\adversarial_m1_1.cjs`

3. **Invalidation Conditions**:
   - This rejection is invalidated only when all 30 tests in `tests/adversarial_m1_1.cjs` exit with code 0 (30/30 PASSED) without breaking the existing 24 tests in `tests/m1_verification.cjs`.
