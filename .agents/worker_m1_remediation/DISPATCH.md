# Dispatch: Milestone 1 Remediation Worker (`worker_m1_remediation`)

## Mission
Remediate the 6 empirical issues identified by `challenger_m1_1` in `tests/adversarial_m1_1.cjs` to achieve 100% pass rate.

## Inputs
- Full Challenger Report: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\challenger_m1_1\handoff.md`
- Test Harness: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\tests\adversarial_m1_1.cjs`
- Codebase Files to Modify:
  - `src/core/parser/piiFilter.ts`
  - `src/core/parser/csvParser.ts`
  - `src/core/profiler/questionClassifier.ts`

## Specific Remediation Tasks
1. **Fix PII Regex Precision (`src/core/parser/piiFilter.ts`)**:
   - Change start-matching `/^waktu/i` and `/^tanggal/i` to strict full-string or submission-specific regex:
     e.g., `/^(timestamp|tanda\s*waktu|waktu(\s*(pengisian|submit|input))?|tanggal(\s*(pengisian|submit|input))?|date(\s*submitted)?)$/i`
     Do NOT match long survey questions like "Waktu pelaksanaan webinar yang Anda inginkan?" or "Tanggal kegiatan yang paling efektif...".
   - Use strict end anchors for name regex:
     `/^(nama|name|full\s*name|nama\s*lengkap|nama\s*\(.*?\)|nama\s*responden|nama\s*mahasiswa|nama\s*fungsionaris)$/i`
     Do NOT match "Nama kegiatan yang paling berkesan..." or "Nama departemen pilihan...".
   - Expand student ID and phone patterns:
     `/^(n\.?i\.?m\.?|n\.?p\.?m\.?|n\.?r\.?p\.?|nomor\s*induk(\s*mahasiswa)?|student\s*id)$/i`
     `/^(no\.?\s*(hp|wa|whatsapp|telepon|telp)|nomor\s*(hp|wa|whatsapp|telepon|telp|kontak)|kontak|phone)$/i`
     Add `isStrictPIIHeader(header)` helper.
2. **Fix Duplicate Headers Data Loss (`src/core/parser/csvParser.ts`)**:
   - Ensure `rawRows` records either deduplicate keys (e.g. `header_${colIndex}`) or keep positional arrays so duplicate header names do not overwrite earlier columns.
3. **Fix Placeholder Misclassification (`src/core/profiler/questionClassifier.ts`)**:
   - Filter non-informative placeholder tokens (`'-'`, `'_'`, `'.'`, `''`, `'tidak ada'`, `'none'`, `'n/a'`) before evaluating unique category counts.
   - For `DICHOTOMOUS_BINARY`, check for authentic binary semantic tokens (`ya`/`tidak`, `yes`/`no`, `true`/`false`, `setuju`/`tidak`, `laki-laki`/`perempuan`, `pria`/`wanita`) or ensure both categories are actual words, not dashes or punctuation.
4. **Fix Mixed CRLF/LF Normalization (`src/core/parser/csvParser.ts`)**:
   - Pre-normalize `csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')` before feeding to PapaParse.
5. **Fix Small-Sample Multi-Select ($N \le 3$) (`src/core/profiler/questionClassifier.ts`)**:
   - Check for explicit multi-select question cues in header: `/\((maks|pilih|boleh\s*memilih|centang|select)/i`. If present and answers contain commas, classify as `MULTI_SELECT_CHECKBOX` even if sample size is small.
6. **Verification Target**:
   - Run `node tests/adversarial_m1_1.cjs` -> Must pass **30/30 (100%)**.
   - Run `npm run test:m1` -> Must pass **24/24 (100%)**.
   - Run `npm run test:e2e` -> Must pass **324/324 (100%)**.
   - Run `npm run build` -> Must succeed with zero errors.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test assertions or circumvent the intended functionality. A forensic auditor will independently verify your code.

## Output
Write your handoff report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\worker_m1_remediation\handoff.md`.

## 2026-09-14T09:05:31Z
Received user assignment:
Fix the 6 identified empirical issues in:
- src/core/parser/piiFilter.ts (regex precision, strict boundary matching, avoiding false positives on legitimate survey questions)
- src/core/parser/csvParser.ts (duplicate headers deduplication, CRLF/LF pre-normalization)
- src/core/profiler/questionClassifier.ts (placeholder filtering, explicit multi-select hints for small samples)

Verification target:
- node tests/adversarial_m1_1.cjs (30/30)
- npm run test:m1 (24/24)
- npm run test:e2e (324/324)
- npm run build

