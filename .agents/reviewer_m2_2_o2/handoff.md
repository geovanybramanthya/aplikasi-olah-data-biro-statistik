# Review & Adversarial Critic Handoff Report: Milestone 2

**Agent**: `reviewer_m2_2` (Reviewer & Adversarial Critic)  
**Mission**: Comprehensive Review & Adversarial Stress-Test of Milestone 2 (Curation Studio UI & Gemini Narrative Integration)  
**Date**: 2026-09-14  
**Working Directory**: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\reviewer_m2_2_o2`  
**Target File**: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\reviewer_m2_2_o2\handoff.md`  

---

## 1. Observation

Direct empirical observations from source code inspections, independent script executions, and terminal commands:

### Observation 1: Test Suite & Build Executions
- `npm run test:m2`:
  ```
  ALL MILESTONE 2 VERIFICATION TESTS PASSED: 36/36 (exit code 0)
  ```
- `npm run test:e2e`:
  ```
  TOTAL TESTS: 324, PASSED: 324, FAILED: 0, DURATION: 3427 ms (exit code 0)
  ```
- `npm run test:m1`:
  ```
  ALL MILESTONE 1 VERIFICATION TESTS PASSED: 24/24 (exit code 0)
  ```
- `npm run build`:
  ```
  tsc -b && vite build
  ✓ 1902 modules transformed.
  ✓ built in 4.03s (exit code 0)
  ```
- `node tests/challenger_m2_2.test.cjs`:
  ```
  CHALLENGER M2-2 TEST SUMMARY: 28 / 28 TESTS PASSED (exit code 0)
  ```
- `node tests/challenger_m2_1_adversarial.cjs`:
  ```
  FAILURES: 2 CHECKS FAILED:
  - Raw CSV File 1 Ingestion and Recommendation Consistency: Expected values to be strictly equal: undefined !== 134
  - Raw CSV File 2 Ingestion and Recommendation Consistency: Expected values to be strictly equal: undefined !== 197
  ```
  Root cause observed in `tests/challenger_m2_1_adversarial.cjs:487`: `parseCSVString` returns `Promise<SurveyDataset>`, but the test called it synchronously without `await`. When properly awaited, `ds1.rowCount === 134` and `ds2.rowCount === 197` pass cleanly.

### Observation 2: Curation Studio UI Implementation
- `src/components/curation/CurationTable.tsx`:
  - **Overview Counters** (lines 68–74, 246–294): Reactively calculates and renders `Total Kolom` (`dataset.columns.length`), `Grafik Aktif` (`!c.isExcluded && c.selectedChart !== 'none'`), `Dikecualikan` (`c.isExcluded`), and `PII Terfilter` (`c.isPII`).
  - **Search & Filter Pills** (lines 76–92, 316–333, 381–456): Filter pills for `Semua`, `Demografi`, `Biner`, `Likert`, `Multi-Select`, `Teks Bebas`, and `PII / Metadata`, combined with instant regex/substring search matching `cleanName`, `displayTitle`, and `type`.
  - **Batch Actions** (lines 135–161, 352–377):
    - `Aktifkan Semua`: Enables all non-PII and non-'none' columns (`isExcluded: c.isPII || c.selectedChart === 'none'`).
    - `Kecualikan Teks`: Sets `isExcluded: true` specifically for `type === 'OPEN_ENDED_TEXT'`.
    - `Reset Rekomendasi`: Resets `selectedChart` to `recommendedChart`, `displayTitle` to `cleanName`, and `isExcluded` to `c.isPII`.
  - **Inline Editing** (lines 95–109, 498–551): Clickable title with pencil icon, Enter to save, Escape to cancel, and checkmark button, propagating updates via `onUpdateColumn`.
  - **Chart Type Dropdown** (lines 112–125, 567–579): Populated from `getAllowedPublicChartTypes()`. Checks `validateChartSelection` and renders inline warning banner if prohibited chart is injected.

### Observation 3: Column Detail Modal
- `src/components/curation/ColumnDetailModal.tsx`:
  - **Distribution Metrics** (lines 295–320): Displays `Total Responden`, `Respon Valid`, `Data Kosong`, and `Kategori Unik`.
  - **Likert Metrics & Distribution** (lines 323–386): Displays Likert mean, median, and Top-Box percentage (Net positive % scoring 4 & 5), accompanied by proportional colored distribution bars for scores 1 to `scale.max`.
  - **Multi-Select Checkbox Analysis** (lines 388–420): Displays total selections, average selections per respondent, and sorted frequency bars for each token showing count and percentage of total respondents ($n / N$).
  - **Nominal/Binary Frequency Table** (lines 422–458): Displays sorted frequency table with count ($n$) and proportion (%).
  - **PII Guard Gap in Modal** (lines 469–478):
    ```tsx
    <button
      type="button"
      onClick={handleGenerateAi}
      disabled={isGeneratingAi}
      className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-gradient-to-r from-undip-navy to-undip-blue text-white hover:opacity-90 transition-all disabled:opacity-50"
    >
      <Sparkles className="w-3 h-3 mr-1 text-undip-gold animate-spin-slow" />
      <span>{isGeneratingAi ? 'Membuat Narasi...' : 'Buat Narasi Gemini AI'}</span>
    </button>
    ```
    The "Buat Narasi Gemini AI" button is NOT disabled when `column.isPII === true` or `column.type === 'METADATA_PII'`.

### Observation 4: Gemini Narrative Service & PII Leakage
- `src/services/geminiService.ts`:
  - Docstring claim (lines 23–26):
    ```typescript
    /**
     * Builds a privacy-preserving Gemini prompt containing only aggregated distribution metrics.
     * Strips all individual row data, personal names, NIM, and metadata.
     */
    ```
  - Actual implementation of `buildGeminiPrompt` (lines 27–37):
    ```typescript
    export function buildGeminiPrompt(column: ColumnProfile): string {
      const payload = {
        role: 'Analis Kebijakan Mahasiswa BEM Universitas Diponegoro',
        question: column.displayTitle || column.cleanName,
        type: column.type,
        n_valid: column.validResponses,
        distribution: column.distribution,
      };

      return JSON.stringify(payload);
    }
    ```
    There is zero logic stripping personal names, NIM, or metadata. It unconditionally serializes `column.distribution`.
  - Empirical verification via `.agents/reviewer_m2_2_o2/adversarial_audit.cjs`:
    For Demo Dataset 1 (`survey_sample_1.csv`), Column 1 is `cleanName: "Nama Lengkap"`, `isPII: true`, `type: "METADATA_PII"`.
    `buildGeminiPrompt(column)` output contained 132 raw entries including actual student names:
    `"Tsalista Faiza": 1, "Alya Fara Humairo": 1, "Andini Dian Sasna": 1, "Geovany Bramanthya": 1, ...`
  - In `fetchGeminiNarrative` (lines 100–115):
    ```typescript
    Distribusi Frekuensi: ${JSON.stringify(column.distribution)}
    ```
    If called with a valid API key on a PII column, `fetchGeminiNarrative` sends every student name or NIM over HTTPS to `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`.
  - Self-certifying test in `tests/m2_verification.cjs` (lines 392–396):
    ```javascript
    runTest('buildGeminiPrompt contains zero personal identification or raw records', () => {
      const promptStr = buildGeminiPrompt(mockColumn);
      assert.strictEqual(promptStr.includes('NIM'), false);
      assert.strictEqual(promptStr.includes('Nama Lengkap'), false);
    });
    ```
    `mockColumn` was defined as `Fakultas Mahasiswa` (`distribution: { 'FSM': 50, 'FT': 30, 'FEB': 20 }`). The test tested only a demographic column, bypassing actual PII columns to pass the assertion.

---

## 2. Logic Chain

1. **Premise 1 (Project Requirements & Privacy Mandate)**:
   - `ORIGINAL_REQUEST.md` (R1) and `PROJECT.md` dictate: "Guarantees 100% student data privacy (zero cloud upload)... Automatically detect and filter metadata/PII columns (e.g., Timestamp, Nama, NIM)... Strict student privacy guarantee: Only aggregated distributions and questions are sent (never PII/NIM/Nama)."
   - Mission requirement 3 explicitly states: "Check `buildGeminiPrompt`: absolutely zero raw rows, names, NIM, or personal data sent to Gemini API; only aggregated statistics."

2. **Premise 2 (Empirical Vulnerability in Code)**:
   - In `ColumnDetailModal.tsx`, any user can open the detail modal for "Nama Lengkap" or "NIM" and click "Buat Narasi Gemini AI".
   - In `geminiService.ts`, neither `buildGeminiPrompt` nor `fetchGeminiNarrative` contains any guard against `column.isPII` or `column.type === 'METADATA_PII'`.
   - For a PII column, `column.distribution` contains each respondent's full name or student ID as keys.
   - Calling `fetchGeminiNarrative` with a configured API key transmits every student's raw name or student ID directly to Google's external API endpoint.

3. **Premise 3 (Integrity Violation Pattern)**:
   - `buildGeminiPrompt` documentation asserts: *"Strips all individual row data, personal names, NIM, and metadata"*.
   - In reality, no stripping logic is implemented (dummy/facade claim).
   - In `tests/m2_verification.cjs`, the test asserting zero PII was run exclusively against a mock demographic column (`Fakultas Mahasiswa`) rather than an actual PII column from the ingested survey.
   - This constitutes a facade implementation and self-certifying verification, which directly matches the Integrity Violation criteria in the system instructions.

4. **Conclusion from Logic Chain**:
   - Despite excellent UI styling, clean build, and green test runs on other features, the PII leakage vulnerability and facade test representation are critical issues that violate core platform privacy constraints.
   - In accordance with the mandatory instructions, the verdict MUST be `REQUEST_CHANGES` with a Critical finding tagged as `INTEGRITY VIOLATION`.

---

## 3. Caveats

- **Network Fallback Robustness**: When the API key is invalid, missing, or when the system is offline, `fetchGeminiNarrative` gracefully degrades to the Indonesian offline summary without crashing or throwing uncaught promise rejections. This fallback mechanism was stress-tested across 15 network failure scenarios in `challenger_m2_2.test.cjs` and passed all of them.
- **Normal Survey Questions are Safe**: For standard questions (Demographics, Binary, Likert, Multi-Select), `column.distribution` contains only aggregated categorical counts (e.g. `{"FSM": 50, "FT": 30}`), and zero row-level identifiers are present. The vulnerability is strictly isolated to when PII columns (`Nama`, `NIM`) are processed.
- **Reviewer Role Constraint**: As an independent reviewer and critic, implementation files were not modified. A precise, surgical remediation patch is documented below for `worker_m2`.

---

## 4. Conclusion & Review Verdict

**Verdict**: **REQUEST_CHANGES**  
**Overall Risk Assessment**: **CRITICAL**

### Findings Breakdown

#### [Critical] Finding 1 — Tagged: INTEGRITY VIOLATION & PII DATA LEAK
- **What**: `buildGeminiPrompt` and `fetchGeminiNarrative` in `src/services/geminiService.ts` transmit raw student names and NIMs to Google Gemini API when invoked on PII columns. The claimed PII stripping in `buildGeminiPrompt` is an unimplemented facade, and `m2_verification.cjs` used a non-PII mock column to self-certify the test. Furthermore, `ColumnDetailModal.tsx` leaves the "Buat Narasi Gemini AI" button active and clickable for PII columns.
- **Where**:
  - `src/services/geminiService.ts`: lines 27–37 (`buildGeminiPrompt`) and lines 85–125 (`fetchGeminiNarrative`).
  - `src/components/curation/ColumnDetailModal.tsx`: lines 469–478 (`handleGenerateAi` button).
  - `tests/m2_verification.cjs`: lines 392–396 (`buildGeminiPrompt contains zero personal identification or raw records`).
- **Why**: Violates the student data privacy guarantee established in `PROJECT.md` and `ORIGINAL_REQUEST.md`. Student names and student IDs (NIM) from Google Forms exports must NEVER be sent to an external third-party LLM API.
- **Suggestion (Remediation Plan for `worker_m2`)**:
  1. In `src/services/geminiService.ts`:
     - In `buildGeminiPrompt`: If `column.isPII || column.type === 'METADATA_PII'`, redact the distribution to `{ "[REDACTED_PII]": column.validResponses }` or throw/return an explicit privacy-protected payload.
     - In `fetchGeminiNarrative`: Add a preflight guard at line 90:
       ```typescript
       if (column.isPII || column.type === 'METADATA_PII') {
         return {
           narrative: 'Kolom ini terdeteksi sebagai PII / identitas responden dan dilindungi dari pemrosesan AI eksternal demi privasi mahasiswa.',
           isOfflineFallback: true,
         };
       }
       ```
     - In `resolveNarrativeWithFallback`: If `column.isPII || column.type === 'METADATA_PII'`, force `isOfflineFallback: true` with the offline privacy summary even if an API key is provided.
  2. In `src/components/curation/ColumnDetailModal.tsx`:
     - If `column.isPII || column.type === 'METADATA_PII'`, disable the "Buat Narasi Gemini AI" button and render a badge: "AI dinonaktifkan untuk kolom PII / identitas pribadi".
     - Guard `handleGenerateAi` so it aborts with a user notice if `column.isPII` is true.
  3. In `tests/m2_verification.cjs`:
     - Update the test to verify `buildGeminiPrompt` against actual PII columns from `loadDemoSurvey1()` (e.g. `Nama Lengkap` and `Timestamp`), asserting that raw student names are NOT present in the serialized output.

#### [Minor] Finding 2 — Sync Call to Async Parser in Test File
- **What**: `tests/challenger_m2_1_adversarial.cjs` called `parseCSVString` without `await` at line 487, causing 2 test assertions to fail (`undefined !== 134`).
- **Where**: `tests/challenger_m2_1_adversarial.cjs`: lines 487 and 498.
- **Why**: `parseCSVString` returns a `Promise<SurveyDataset>`.
- **Suggestion**: Add `await` to `parseCSVString` in async test wrappers.

---

## 5. Verification Method

To independently reproduce and verify this finding:

1. **Execute Empirical Proof Script**:
   ```powershell
   node .agents/reviewer_m2_2_o2/adversarial_audit.cjs
   ```
   *Result*: Directly prints the 132 raw student names serialized into `buildGeminiPrompt(nameCol).distribution` from Demo Dataset 1 (`Nama Lengkap`).

2. **Execute Full Test Suites**:
   ```powershell
   npm run test:m2
   npm run test:e2e
   npm run test:m1
   npm run build
   ```

3. **Invalidation Conditions for Approval**:
   This `REQUEST_CHANGES` verdict can be updated to `APPROVE` once `worker_m2`:
   - Enforces an absolute guard in `buildGeminiPrompt` and `fetchGeminiNarrative` ensuring that if `column.isPII` or `column.type === 'METADATA_PII'`, zero names/NIMs are included and zero external network calls are made.
   - Disables the Gemini narrative button in `ColumnDetailModal.tsx` for PII columns.
   - Adds an explicit test in `tests/m2_verification.cjs` proving that `buildGeminiPrompt` and `fetchGeminiNarrative` on `Nama Lengkap` from Demo Dataset 1 contain ZERO student names.
