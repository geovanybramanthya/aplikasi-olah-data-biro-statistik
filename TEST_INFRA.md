# E2E Test Infra: BEM UNDIP Survey Analytics & Visualization Platform

## Test Philosophy
- **Opaque-box & Requirement-driven**: Derived purely from `ORIGINAL_REQUEST.md` and user specifications, independent of internal UI layout or private component state.
- **Methodology**: 4-Tier Strategy:
  - **Tier 1: Feature Coverage (>=5 per feature)**: Equivalence class representative inputs for every inventoried feature.
  - **Tier 2: Boundary & Corner Cases (>=5 per feature)**: Empty strings, single-row datasets, extreme token counts, 0-response options, malformed hex codes, boundary scale limits.
  - **Tier 3: Cross-Feature Combinations (Pairwise)**: Interaction of parser + classifier + recommender + theming + custom hex validator + 3x export.
  - **Tier 4: Real-World Application Scenarios**: End-to-end processing and validation of real datasets (`survey_sample_1.csv`, `survey_sample_2.csv`, `KTR.xlsx`).

## Feature Inventory & Tier Mapping
| # | Feature | Source (Requirement) | Tier 1 Target | Tier 2 Target | Tier 3 | Tier 4 |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | CSV File Ingestion | R1 | 5 | 5 | ✓ | ✓ |
| 2 | Excel File Ingestion | R1 | 5 | 5 | ✓ | ✓ |
| 3 | Header Sanitization | Survey, R1 | 5 | 5 | ✓ | ✓ |
| 4 | PII / Metadata Detection | R1 | 5 | 5 | ✓ | ✓ |
| 5 | Dichotomous Binary Classifier | R1 | 5 | 5 | ✓ | ✓ |
| 6 | Likert Scale Classifier | R1 | 5 | 5 | ✓ | ✓ |
| 7 | Multi-Select Checkbox Splitter | R1 | 5 | 5 | ✓ | ✓ |
| 8 | Nominal Demographics Classifier | R1 | 5 | 5 | ✓ | ✓ |
| 9 | Open-Ended Text Classifier | R1 | 5 | 5 | ✓ | ✓ |
| 10 | Bundled Demo Datasets | R1, AC | 5 | 5 | ✓ | ✓ |
| 11 | Donut Chart Recommendation | R2 | 5 | 5 | ✓ | ✓ |
| 12 | Horizontal/Vertical Bar Recommendation | R2 | 5 | 5 | ✓ | ✓ |
| 13 | Ranked Bar Recommendation | R2 | 5 | 5 | ✓ | ✓ |
| 14 | Ordered Likert Bar Recommendation | R2 | 5 | 5 | ✓ | ✓ |
| 15 | Prohibited Charts Ban | R2 | 5 | 5 | ✓ | ✓ |
| 16 | Interactive Curation Table | R2 | 5 | 5 | ✓ | ✓ |
| 17 | Offline Statistical Summary | R2 | 5 | 5 | ✓ | ✓ |
| 18 | Optional Gemini Narrative Toggle | R2 | 5 | 5 | ✓ | ✓ |
| 19 | Typography Library | R3 | 5 | 5 | ✓ | ✓ |
| 20 | Institutional Color Palettes | R3 | 5 | 5 | ✓ | ✓ |
| 21 | Custom Palette Builder & Validator | R3, AC | 5 | 5 | ✓ | ✓ |
| 22 | 2D Modern Flat Visual Style | R3 | 5 | 5 | ✓ | ✓ |
| 23 | 2.5D Isometric 3D Visual Style | R3 | 5 | 5 | ✓ | ✓ |
| 24 | Per-Chart Dimensionality Override | R3 | 5 | 5 | ✓ | ✓ |
| 25 | Official BEM UNDIP Watermark | R3 | 5 | 5 | ✓ | ✓ |
| 26 | High-Resolution 3x Canvas Export | R4, AC | 5 | 5 | ✓ | ✓ |
| 27 | Anti-Clipping Geometry & Padding | R4, AC | 5 | 5 | ✓ | ✓ |
| 28 | Single Chart PNG Export | R4 | 5 | 5 | ✓ | ✓ |
| 29 | High-Res Batch ZIP Packaging | R4, AC | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner**: Node.js test runner script `tests/e2e/runner.cjs`.
  - Invocation: `node tests/e2e/runner.cjs`
  - Pass/Fail Semantics: Exits with code 0 if 100% tests pass; non-zero on any failure. Outputs TAP or structured test summary with execution time and tier breakdown.
- **Directory Layout**:
  ```
  tests/
  ├── e2e/
  │   ├── runner.cjs
  │   ├── tier1_feature_coverage.test.cjs
  │   ├── tier2_boundary_corner.test.cjs
  │   ├── tier3_cross_feature.test.cjs
  │   └── tier4_real_world_workloads.test.cjs
  ```

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|---|---|---|
| 1 | UPGRADING BEM UNDIP Survey (`survey_sample_1.csv`) Full Pipeline | F1, F3, F4, F6, F7, F8, F9, F11-F17, F19-F29 | High (134 rows, 27 cols) |
| 2 | Campus Safety & Catcalling (`survey_sample_2.csv`) Full Pipeline | F1, F3, F4, F5, F6, F8, F9, F11, F14-F17, F19-F29 | High (197 rows, 15 cols, sensitive PII) |
| 3 | KTR UNDIP Survey (`KTR.xlsx`) Full Excel Pipeline | F2, F3, F4, F5, F6, F8, F11-F17, F19-F29 | High (265 rows, 19 cols, Excel floats) |
| 4 | Offline Demo Data Instant Load & Custom Theming | F10, F16, F19, F20, F21, F22, F23, F24, F25 | Medium (Zero network test) |
| 5 | Gemini LLM Narrative Toggle with Graceful Offline Fallback | F17, F18, F28, F29 | Medium (API simulation + network error fallback) |

## Coverage Thresholds
- **Tier 1 Target**: >= 145 test cases (>= 5 per feature)
- **Tier 2 Target**: >= 145 boundary & corner test cases
- **Tier 3 Target**: >= 29 pairwise cross-feature tests
- **Tier 4 Target**: >= 5 realistic application scenarios
- **Expected Total**: >= 324 test cases
