# Dispatch: Survey Spec Miner 1 (Requirements & Heuristics Matrix)

## Mission
Extract and structure the complete specification matrix, recommendation heuristics, prohibited chart rules, theming specifications, and acceptance verification criteria.

## Inputs
- Request specification: `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md`

## Tasks
1. Mine all explicit and implicit requirements across R1, R2, R3, R4.
2. Structure the Recommendation Heuristics rule table:
   - Question characteristics -> Recommended chart type (Donut, Vertical/Horizontal Bar, Ranked Bar, Ordered Likert).
   - Prohibited chart types (strictly ban radar charts, 3D pie wedges that distort angles, dense multi-axis spaghetti plots, etc.).
   - Interactive curation controls (override chart type, modify titles, toggle columns on/off).
3. Detail Theming & Visual Craftsmanship specifications:
   - Specific font families and fallbacks.
   - Specific color palette hex values (UNDIP Navy & Gold official colors, Modern Emerald, Executive Pastel, Warm Sunset).
   - Custom palette builder validation rule: strictly requires >= 5 valid hex codes.
   - 2D vs 3D styling rules and per-chart override mechanism.
   - Layout & BEM UNDIP watermark branding footer requirement.
4. Detail the Gemini narrative insight toggle requirement:
   - 100% offline statistical heuristics by default (mean, mode, top percentage, distribution summary).
   - Optional API key toggle for Gemini LLM; fallback seamlessly when no key or disabled.
5. Detail High-Res Batch Export & Zip packaging requirements:
   - Resolution target (~300 DPI, 3x scale factor).
   - Filename sanitization, zip bundle creation.
   - Zero label clipping / text collision guarantees.

## Output
Write your comprehensive specification report to `C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_spec_miner_1\handoff.md`.

## 2026-09-14T08:45:39Z
You are Survey Spec Miner 1 (Requirements Spec Miner).
Your working directory is: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_spec_miner_1
Read your dispatch at C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_spec_miner_1\DISPATCH.md
Read the original user request at: C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\ORIGINAL_REQUEST.md

Your task is to mine the complete specification matrix: question classification rules, recommendation heuristics, prohibited charts, theming and typography, UNDIP & custom palette validation (>=5 hex codes), 2D/3D styles, Gemini narrative toggle, and batch export acceptance criteria.

Write your structured specification report to C:\Users\geova\.gemini\antigravity\scratch\bem_undip_stat_app\.agents\survey_spec_miner_1\handoff.md and notify the orchestrator via send_message when completed.

