# CAE V0.1 — Formulas, Conventions, and Method Limitations

**Status:** Engineering-screening prototype. Not a validated prediction of physical aggressiveness, safety, suitability, risk, or regulatory compliance.

## Definitions

- `i = 1…N` alternatives; `N ≥ 2`.
- `j = 1…M` criteria; `M ≥ 1`.
- Common integer score range `[L, U]`, with an exact integer step and `0 ≤ L < U`.
- `rᵢⱼ` is the user-entered rating, not a measured property unless separately documented.
- `wⱼ ≥ 0` is criterion importance; a user judgment, not automatically a physical coefficient.

## Direction alignment

- Higher raw rating = more aggressive: `aᵢⱼ = (rᵢⱼ−L)/(U−L)`.
- Lower raw rating = more aggressive: `aᵢⱼ = (U−rᵢⱼ)/(U−L)`.
- Aligned `aᵢⱼ` is between 0 and 1. Higher always represents greater *assigned* challenge.
- Aligned value on original scale: `qᵢⱼ = L + (U−L)×aᵢⱼ`.

## Methods

| Method | Formula | Notes |
|---|---|---|
| Unweighted sum | `Sᵢ=Σⱼ aᵢⱼ` | Range 0…M; cannot compare across different M. |
| Arithmetic mean | `Mᵢ=(Σⱼ aᵢⱼ)/M` | Range 0…1; default; equal weights. |
| Weighted mean | `Wᵢ=Σⱼ αⱼ aᵢⱼ`, where `αⱼ=wⱼ/Σₖwₖ` | Range 0…1; requires total weight >0. |
| Exploratory product | `Pᵢ=Πⱼ qᵢⱼ` | Opt-in only; ordinal-scale multiplication is generally not physically justified. |

For mean/weighted mean, the familiar original-scale score is `L+(U−L)×score`; the aligned 100-point presentation is `100×score`. Additive contribution for weighted mean is `αⱼ×aᵢⱼ` (or multiply by 100 for percentage points). Additive contribution for mean is `aᵢⱼ/M`; sum is `aᵢⱼ`. Product has **no** additive criterion contribution.

**Product safeguards:** Zero collapses the result; scale choice can change ranking; ordinal scores do not possess ratio meaning merely because written as numbers. A product of ratings is *not* the physics of cumulative damage or permeability. Changing criteria or scale can reverse rank. Nonfinite overflow is an error.

## Pugh adaptation

For each non-datum alternative, the user independently enters `more (+)`, `same (S)`, `less (−)`, or `unknown (?)`. “More” means **more aggressive for the defined objective**, not the classical Pugh “more desirable.” The datum is the reference; it is not Pugh-ranked. Show `N+`, `NS`, `N−`, `N?`, and optionally descriptive `NET=N+−N−`. A high NET is not a verified winner and does not override a failed requirement.

## Hybrid consistency logic

For each criterion of non-datum alternative `i`, derive numeric relationship to datum `b` from the aligned scores: `sign(aᵢⱼ−a_bⱼ)`; compare it to manual Pugh `+ / S / −`. If disagreement, flag **review needed**, preserving both inputs. Unknown Pugh stays unknown. No blended Pugh/MCDA score is calculated.

## Hard gates and missing data

- `fail`: retain alternative in record, but exclude from numeric ranking.
- `unknown`: numeric rank provisional, not demonstrated to be qualified.
- `pass`: a user-entered claim, not verified by this tool.
- Missing/invalid numeric ratings: no complete numeric rank.
- Pugh unknowns are tracked, not silently treated as equivalent.
- Ties use small floating-point tolerance; no arbitrary winner is chosen.
- Changing Pugh datum clears reference-dependent judgments in the UI, after confirmation.

## Intended-use limitations

1. User-defined ordinal scores do not predict actual WVTR, permeation, seal strength, shelf life, reliability, or failure likelihood.
2. For physical comparisons, obtain relevant measurements under comparable test conditions and characterize uncertainty.
3. Look for criterion dependence and double-counting (e.g. correlated material attributes).
4. Weights and rating anchors require explicit rationale, especially if ranking affects test selection.
5. Avoid compensating any mandatory criterion failure by averaging with unrelated advantages.
6. ISO 14971, ISO 11607, design control, medical-device safety, and regulatory compliance require separate applicable processes and evidence.

## Verification

Run `npm test` using Node.js 20+. The tests include the fictional weighted example (2.40 versus 3.30 on a 0–5 scale), a multiplication rank reversal, Pugh disagreement flagging, missing-value refusal, gate exclusion, tie handling, and 100×100 performance smoke test.
