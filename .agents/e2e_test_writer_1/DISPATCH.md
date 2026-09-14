# Dispatch: E2E Test Writer (`e2e_test_writer_1`)

## Mission
Author the comprehensive opaque-box E2E test suite for the BEM UNDIP Survey Analytics & Visualization Platform according to `TEST_INFRA.md` and `PROJECT.md`.

## Inputs
- `ORIGINAL_REQUEST.md`: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md`
- `PROJECT.md`: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\PROJECT.md`
- `TEST_INFRA.md`: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\TEST_INFRA.md`
- Datasets:
  - `C:\Users\geova\.gemini\antigravity\raw\survey_sample_1.csv`
  - `C:\Users\geova\.gemini\antigravity\raw\survey_sample_2.csv`
  - `C:\Users\geova\.gemini\antigravity\raw\Survei Penerapan Kawasan Tanpa Rokok (KTR) di Lingkungan Universitas Diponegoro (Jawaban).xlsx`

## Deliverables
Create the test suite in `tests/e2e/`:
1. `tests/e2e/runner.cjs`: Master test runner supporting colored console output, per-tier breakdown, summary statistics, and exit code 0 on all pass.
2. `tests/e2e/tier1_feature_coverage.test.cjs`: >= 145 tests covering Features 1-29 (>= 5 test cases per feature).
3. `tests/e2e/tier2_boundary_corner.test.cjs`: >= 145 tests covering edge cases, empty values, single-row data, malformed hex, 0-count Likert options, etc.
4. `tests/e2e/tier3_cross_feature.test.cjs`: >= 29 pairwise tests combining parsing + classification + recommendation + theming + export config.
5. `tests/e2e/tier4_real_world_workloads.test.cjs`: >= 5 full pipeline scenarios on `survey_sample_1.csv`, `survey_sample_2.csv`, and `KTR.xlsx`.
6. When tests are authored, publish `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\TEST_READY.md` summarizing total test counts and runner instructions.
7. Write handoff report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\e2e_test_writer_1\handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All test implementations must be genuine. DO NOT create dummy/facade implementations or circumvent tests.
