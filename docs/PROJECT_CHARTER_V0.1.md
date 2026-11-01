# Comparative Aggressiveness Explorer (CAE)
## Project Charter and Functional / Mathematical Specification — V0.1

| Field | Value |
|---|---|
| Document ID | CAE-CHARTER-001 |
| Version / status | 0.1.0 / Proposed implementation baseline |
| Date | 2026-11-01 |
| Product family | Engineering Decision & Selection Explorer |
| Application | Comparative Aggressiveness Explorer |
| Intended implementation | Client-side responsive web app, suitable for future PWA |
| Companion document | `02_ARCHITECTURE_AND_VERSION_ROADMAP.md` |
| Intended audience | Engineering users, technical reviewers, software developers, testers |

> **Use limitation:** CAE provides structured *comparative judgments*, not a validated prediction of a physical property, engineering safety, regulatory acceptability, or compliance. Its conclusions are only as defensible as the criteria, scores, evidence, and assumptions supplied by users.

---

## 1. Project purpose

Build a reusable, domain-independent tool that compares **at least two alternatives** against **one or more user-defined criteria** to determine relative *aggressiveness, challenge, severity of a chosen exposure, or suitability for a specified comparison objective*. The user defines the meaning and direction of aggressiveness. The software must not infer it from a material name or a qualitative descriptor.

The design combines:

1. **Pugh-style datum comparison:** relative `+ / S / − / ?` assessment for every criterion, with an explicit baseline.
2. **Quantitative multi-criteria scoring:** user-defined common rating scale, arithmetic sum/mean, optional weighted mean, and an opt-in exploratory multiplication mode.
3. **Hybrid interpretation:** present the qualitative and quantitative analyses side by side, flag disagreements, and preserve rationale without mathematically blending two judgments into a new unexplained score.

**Primary V0.1 result:** a reproducible comparison record displaying rankings (where a numeric method supports rankings), criterion-level drivers, Pugh profiles, calculation details, evidence/assumptions, exclusions, and limitations.

### 1.1 Why this is not simply a Pugh matrix

Classical Pugh analysis compares a concept with a datum using better / same / worse judgments; its strong use is *controlled convergence and concept improvement*, not an objectively exact numerical ranking. CAE changes the comparison question to **more / equally / less aggressive for the explicitly defined objective**. This adaptation must always be visible to prevent confusion with the classical convention in which `+` means *more desirable*.

**Pugh in CAE:** `+` = more aggressive/challenging than datum; `S` = comparable; `−` = less aggressive/challenging; `?` = insufficient information. If an objective is to find the *least* challenging option instead, the user changes the objective/ranking direction or interprets the lower numeric rank; the meaning of the symbols is still explicitly displayed.

## 2. Goals and success definition

### In scope for V0.1

- Create, clone, edit, import, export, and locally save comparisons.
- Define **N ≥ 2 alternatives**, including editable name/description, one datum if Pugh or Hybrid is used, and optional constraint status.
- Define **M ≥ 1 criteria**; recommend 2+ for meaningful multi-criteria analysis. Add/delete/reorder criteria dynamically.
- Define objective, context, assumptions, and what *higher aggressiveness* means.
- Define **one common rating scale** for the comparison (e.g., 0–3, 0–5, 0–10, 1–5; custom integer lower/upper bounds and step).
- Define each criterion, measurement/interpretation, directional effect, anchor descriptions, weight, source/justification, and optional rationale.
- Perform **unweighted sum**, **unweighted arithmetic mean**, **weighted arithmetic mean**, and **opt-in exploratory product**.
- Perform manual Pugh comparisons against the datum, with `+`, `S`, `−`, `?` and rationale.
- Support Pugh-only, Numeric-only, and Hybrid modes in one project schema.
- Present score contributions, rank/tie status, Pugh `+ / S / − / ?` counts, and hybrid disagreement indicators.
- Flag incomplete values, missing rationales (advisory), unsupported calculations, potential double-counting, and evidence limitations.
- Export human-readable Markdown/CSV summary and a reproducible machine-readable JSON record; print view is optional.
- Mobile-responsive, keyboard usable, offline-capable after page load; no external user data transmission.

### Explicitly out of scope for V0.1

- Predicting measured WVTR, oxygen permeability, diffusion coefficients, product shelf life, or physical failure rates from generic scores.
- Automatic scoring from material names, polymer families, molecular structure, or undocumented heuristics.
- AHP pairwise weight derivation, TOPSIS, ELECTRE, Monte Carlo, probabilistic sensitivity, full weighted geometric product, optimization algorithms.
- Formal design verification conclusions, regulatory signoff, electronic signatures, or claimed compliance to ISO 14971/ISO 11607.
- Account management, server synchronization, proprietary datasets, and AI-generated score recommendations.

### Acceptance outcome

V0.1 is complete when the **functional and mathematical acceptance tests in §12 pass**, a user can finish and export a two-alternative/three-criterion example, and all computational assumptions and limitations are available in the result.

## 3. Terminology and decision model

| Term | Precise meaning in CAE | Example |
|---|---|---|
| Objective | The exact challenge or characteristic being compared | Greater challenge for moisture ingress |
| Alternative / candidate | The thing being compared (not a criterion) | HDPE construction, PET construction |
| Criterion / variable | A characteristic used to assess the alternatives | Assigned permeation tendency, environmental sensitivity, geometry |
| Rating | User-entered ordinal score within one scale | 2 on a 0–5 scale |
| Direction | Whether increasing the entered rating increases or decreases challenge | Higher permeation tendency increases challenge |
| Datum / baseline | Reference alternative for Pugh-style comparisons | Current construction |
| Weight | User judgment of the *relative importance* of a criterion | 50, 30, 20 (internally normalized) |
| Constraint | A non-compensatory requirement that scoring cannot override | Candidate fails a mandatory specification |
| Evidence | Supporting reference/assumption for an input | Supplier report, laboratory result, expert judgment |
| Decision | Human-reviewed engineering interpretation, not an automatically validated fact | Candidate B warrants test priority |

**User-language rule:** The interface uses “alternatives” for compared items and “criteria” for influencing variables. The term “factor” may appear in user-facing descriptions, but must not have two conflicting technical meanings in saved records.

## 4. Intended use cases and boundaries

1. **Worst-case challenge screening:** rank hypothetical packaging constructions for a defined exposure question.
2. **Process challenge selection:** compare manufacturing settings, handling conditions, or test configurations.
3. **Qualitative concept comparison:** Pugh analysis against an existing/reference design.
4. **Trade-study documentation:** record why a candidate was chosen for more investigation.

**Not valid without additional evidence:** claiming that a material with a higher user-assigned score necessarily has higher measured moisture transmission; substituting a score for a physical barrier test; declaring patient risk acceptable; or averaging away a hard functional requirement.

## 5. User workflow and interface specification

1. **New assessment:** name, user-defined objective, use context, objective direction, optional assessor/date.
2. **Alternatives:** enter minimum two; add further alternatives without a fixed logical count; choose datum for Pugh/Hybrid.
3. **Criteria:** describe criteria; enter direction (`increase` or `decrease` challenge with increasing raw rating); state boundaries/units or explicitly say “judgment only.”
4. **Scale:** choose preset or custom integer interval and scoring step; show labeled anchors for low/mid/high, with editable descriptions.
5. **Weights (optional):** default equal weights; show raw and normalized weights; disallow all-zero weights.
6. **Ratings:** editable matrix, rows = criteria and columns = alternatives; capture rationale and evidence status for individual ratings.
7. **Pugh (Pugh/Hybrid):** independently enter `+ / S / − / ?` for each non-datum candidate/criterion against baseline; optional short justification; datum column is `S`/reference and read-only.
8. **Calculate:** choose numeric method; see validation/constraint notices; view score, rank, criterion contributions, Pugh profile, and flags.
9. **Review/export:** write a human conclusion and unresolved items; export JSON and readable tables; keep assessment metadata, engine version, method selection, scale, ratings, Pugh judgments, and assumptions.

**Display rule:** do not label a Pugh majority as a mathematically proven “winner.” An assessment may conclude “requires further testing,” “inconclusive,” or “multiple viable candidates.”

## 6. Data requirements and validation

| Data element | Type | Validation / handling |
|---|---|---|
| `assessment.id` | UUID/string | Unique stable ID |
| `assessment.title/objective` | string | Nonempty before final export |
| `assessment.mode` | enum | `numeric`, `pugh`, `hybrid` |
| `alternatives[]` | objects | At least two, unique IDs; names must be nonempty |
| `datumAlternativeId` | string or null | Required for `pugh`/`hybrid`, references an existing alternative |
| `criteria[]` | objects | At least one; unique IDs; defined direction; discourage overlapping criteria |
| `scale` | `{min,max,step}` | Finite integers; `0 ≤ min < max`, `step > 0`; available points exactly defined |
| `rawRating[altId][criterionId]` | integer / null | One of allowed scale points, or missing (blocks final numeric ranking) |
| `direction` | enum | `higher_is_more_aggressive`, `lower_is_more_aggressive` |
| `weights[criterionId]` | finite number | Nonnegative; at least one positive for weighted analysis |
| `pugh[altId][criterionId]` | enum | `more`, `same`, `less`, `unknown`; reference auto-`same` |
| `constraintStatus[altId]` | enum | `pass`, `fail`, `unknown` (optional assessment-level gate) |
| `evidenceStatus` | enum | `measured`, `literature`, `supplier`, `expert_judgment`, `assumption`, `not_provided` |
| `calculationMethod` | enum | `sum`, `mean`, `weighted_mean`, `raw_product` |

**No silent missing-data behavior.** Missing numeric ratings block a **complete** numeric ranking; the UI may show a clearly marked partial preview, never an official rank. A Pugh `unknown` is displayed and counted, not silently treated as `same`. Constraint `fail` excludes a candidate from an eligible ranking while retaining it in the record; constraint `unknown` prevents labeling the candidate decisively qualified.

A custom scale always applies to **all** criteria in V0.1. Per-criterion scaling and physical-unit mapping are future features.

## 7. Mathematical specification

### 7.1 Notation

- Alternatives: `i ∈ {1,...,N}`, where `N ≥ 2`.
- Criteria: `j ∈ {1,...,M}`, where `M ≥ 1`.
- User-defined shared rating interval: `L` to `U`, `0 ≤ L < U`.
- Input rating: `rᵢⱼ` within the allowed discrete set.
- Criterion direction: `dⱼ ∈ {+1,−1}` where `+1` means higher raw rating → greater aggressiveness.
- Criterion weight: `wⱼ ≥ 0`, with `Σⱼ wⱼ > 0` when weighted scoring is used.
- Datum alternative: `b` (Pugh/Hybrid modes).

### 7.2 Align all ratings to a single direction

Convert each input rating to an aggressiveness-aligned **normalized** value `aᵢⱼ ∈ [0,1]`:

```text
If dⱼ = +1: aᵢⱼ = (rᵢⱼ − L) / (U − L)
If dⱼ = −1: aᵢⱼ = (U − rᵢⱼ) / (U − L)
```

On the aligned 0–1 scale, **1 means higher challenge relative to that criterion's entered scale**. The application shall show original ratings and aligned ratings separately to avoid hidden inversions.

The equivalent *aligned rating on the original scale* is:

```text
qᵢⱼ = L + (U − L) × aᵢⱼ
```

### 7.3 Unweighted sum and arithmetic mean

```text
SUMᵢ  = Σⱼ aᵢⱼ                      [range 0..M]
MEANᵢ = (Σⱼ aᵢⱼ) / M               [range 0..1]
MEAN_100ᵢ = 100 × MEANᵢ             [range 0..100]
```

Sum and mean have **the same ranking** if all alternatives have complete evaluations on the same criteria. Sum is displayed as an exploratory magnitude only; it must not be compared across assessments with different criterion counts. For a familiar scale-specific output, show `MEAN_ORIGINAL = L + (U−L)×MEAN`.

### 7.4 Weighted arithmetic mean (optional in V0.1)

Normalize weights:

```text
αⱼ = wⱼ / (Σₖ wₖ)                   [Σⱼ αⱼ = 1]
Wᵢ = Σⱼ αⱼ × aᵢⱼ                   [range 0..1]
W_100ᵢ = 100 × Wᵢ                  [range 0..100]
Contributionᵢⱼ = 100 × αⱼ × aᵢⱼ   [percentage points in W_100]
W_ORIGINALᵢ = L + (U−L) × Wᵢ       [display on user scale]
```

Equal positive weights yield the unweighted mean. A zero-weight criterion remains visible and receives zero contribution; display that it was excluded from aggregate importance.

**Important:** Weights are value judgments about importance, not automatically verified physical sensitivities. They require contextual justification.

### 7.5 Exploratory multiplication (explicit opt-in)

To honor the desired multiplication capability, calculate the **product of aligned ratings in the original user-defined range**:

```text
PRODUCTᵢ = Πⱼ qᵢⱼ
```

**Mandatory V0.1 warnings:**

- The product of ordinal judgment scores is usually **not physically meaningful** and is not a validated property model.
- The result is scale-dependent: a 0–5 scale and 1–5 scale can produce different ranking behavior.
- Any zero produces a zero total (and ties may hide meaningful differences).
- Product and arithmetic mean can reverse rank order.
- No multiplication of the raw values before direction alignment.
- This method must be labeled `Exploratory product (unvalidated aggregation)` and cannot be the default or sole basis for an automatic regulatory/worst-case conclusion.
- Product results must not be combined mathematically with other modes.

Future versions may add **weighted geometric means** with strictly positive ratio/utility inputs and appropriate measurement assumptions; do not represent that as equivalent to this V0.1 product.

### 7.6 Pugh-style reference comparison

For each non-datum alternative `i` and criterion `j`, user enters:

```text
pᵢⱼ ∈ { +1, 0, −1, ? }
+1 = more aggressive than datum for this objective/criterion
 0 = effectively equivalent to datum
−1 = less aggressive than datum
 ? = uncertain / insufficient evidence
```

Show for each alternative:

```text
N_plus  = count(pᵢⱼ = +1)
N_same  = count(pᵢⱼ =  0)
N_minus = count(pᵢⱼ = −1)
N_unknown = count(pᵢⱼ = ?)
Optional descriptive NET = N_plus − N_minus
```

The **NET is a descriptive heuristic only**, not an authoritative ranking or a compensated physical index. Preserve the pattern of individual `+` and `−` judgments. The datum is a reference, not a user-scored competitor in the Pugh sign comparison. Selecting another datum requires reconfirming manual judgments; do not silently reuse incompatible signs.

### 7.7 Hybrid / composite interpretation — no blended pseudo-score

Compute **numeric scores independently** of **manual Pugh judgments**. For each criterion, show an agreement indicator:

```text
numericRelativeᵢⱼ = sign(aᵢⱼ − a_bⱼ)
comparisonᵢⱼ =
  'unknown'        if pᵢⱼ = ?
  'consistent'     if pᵢⱼ equals numericRelativeᵢⱼ
  'review_needed'  otherwise
```

The `sign` calculation detects directional agreement for equal discrete ratings; it does not assume the size of one score increment is physically calibrated. In V0.1, manually marking `S` despite different ratings triggers a **review flag**, not automatic replacement of user input. Show both the Pugh pattern and numeric ranking; **never add a Pugh net score to the numeric aggregate**. Hybrid output includes:

- Numeric method and rank, including ties and excluded candidates.
- Pugh `+ / S / − / ?` profile relative to the datum.
- Criterion-level disagreements and missing evidence.
- User-authored synthesis/decision, including the possibility of *no justified selection*.

### 7.8 Constraint (hard gate) behavior

A mandatory requirement is not another compensating criterion. Each alternative's gate status may be `pass`, `fail`, or `unknown`:

```text
eligible(i) = (gateStatus(i) != 'fail')
qualified(i) = (gateStatus(i) == 'pass')
```

A `fail` candidate remains visible for audit but is excluded from the eligible ranking. An `unknown` candidate can be shown provisionally but not called fully qualified. This is a **user-entered constraint**; V0.1 does not verify whether a regulatory requirement is met.

### 7.9 Ranking and ties

- For arithmetic/weighted/product modes, rank *eligible, completely scored* alternatives in **descending** aligned aggressiveness score when the goal is to find the **most** challenging candidate.
- Let the user toggle presentation to **least** challenging without changing underlying scores or the meaning of Pugh symbols.
- Preserve ties. Use a computation tolerance (suggested `1e−12` for normalized outputs) rather than manufacturing distinctions from floating-point noise.
- Do not force a numerical ranking in Pugh-only mode. Do not assert a selected engineering worst case based on scores alone.

## 8. V0.1 demonstration — fictional input, not polymer-property data

**Assessment objective:** rank illustrative packaging constructions for a hypothetical moisture-ingress challenge. Both examples use a **0–5** scale where higher aligned ratings mean higher challenge. The chosen scores and weights are **invented teaching values**; they do **not** assert actual HDPE/PET WVTR or material behavior.

| Criterion | Direction | Weight | HDPE (datum) | PET |
|---|---|---:|---:|---:|
| Assigned permeation tendency | Higher = more challenge | 50 | 2 | 4 |
| Assigned environmental sensitivity | Higher = more challenge | 30 | 2 | 3 |
| Assigned thickness-related challenge | Higher = more challenge | 20 | 4 | 2 |

**Weighted score on 0–5 scale:**

```text
HDPE = (50×2 + 30×2 + 20×4) / 100 = 2.40 → 48/100 normalized
PET  = (50×4 + 30×3 + 20×2) / 100 = 3.30 → 66/100 normalized
```

**Pugh against HDPE datum (manual illustrative judgments):** PET is `+` for permeation tendency, `+` for environmental sensitivity, `−` for thickness-related challenge; the Pugh profile is `2 plus / 0 same / 1 minus / 0 unknown`. The numeric ranking and Pugh pattern both suggest PET deserves investigation **under these input assumptions**; neither establishes real-world permeability.

**Method-dependence check:** Suppose A = `[5,5,1]` and B = `[3,3,3]` on a 1–5 scale, all higher = more challenge. Arithmetic mean: A = `11/3 ≈ 3.667` > B = `3`. Raw product: A = `25` < B = `27`. The rankings **reverse**; display this possibility in the product help panel.

## 9. Calculation pipeline and implementation logic

```text
Input assessment
  → Validate objective, alternatives ≥2, criteria ≥1, scale and step
  → Validate datum (if Pugh/Hybrid), direction, ratings, weights, Pugh states
  → Evaluate mandatory constraints; retain failed alternatives in audit display
  → Normalize and direction-align every numeric rating
  → Compute selected numeric method and criterion contributions
  → Produce Pugh counts and criterion patterns (if enabled)
  → Produce hybrid agreement/review flags (if enabled)
  → Rank complete eligible numeric alternatives; preserve ties
  → Display limitations, unknowns, rationale, evidence, and report
  → Export assessment + calculation version for reproducibility
```

### Reference pseudocode (implementation-neutral TypeScript style)

```ts
function alignedRating(raw: number, lower: number, upper: number,
                       direction: 'higher' | 'lower'): number {
  const x = (raw - lower) / (upper - lower);
  return direction === 'higher' ? x : 1 - x;
}

function numericScore(values: number[], weights: number[],
                      method: 'sum' | 'mean' | 'weighted_mean' | 'raw_product',
                      lower: number, upper: number): number {
  if (values.some(v => !Number.isFinite(v))) throw Error('Incomplete score');
  if (method === 'sum') return values.reduce((s, v) => s + v, 0);
  if (method === 'mean') return values.reduce((s, v) => s + v, 0) / values.length;
  if (method === 'weighted_mean') {
    const total = weights.reduce((s, w) => s + w, 0);
    if (total <= 0) throw Error('At least one positive weight required');
    return values.reduce((s, v, j) => s + weights[j] * v, 0) / total;
  }
  // The user must explicitly acknowledge the exploratory product limitation.
  return values.reduce((p, v) => p * (lower + (upper - lower) * v), 1);
}

function pughProfile(judgments: ('more'|'same'|'less'|'unknown')[]) {
  return {
    plus: judgments.filter(x => x === 'more').length,
    same: judgments.filter(x => x === 'same').length,
    minus: judgments.filter(x => x === 'less').length,
    unknown: judgments.filter(x => x === 'unknown').length,
  };
}
```

**Engineering implementation note:** The pseudocode is an illustrative function contract, not the entire validation or persistence implementation. Validate score dimensions, bounds, step, weights, and Pugh associations in a dedicated schema layer before calling the pure computation functions.

## 10. Data model / interchange contract

Minimum persisted structure (illustrative values):

```json
{
  "schemaVersion": "0.1.0",
  "engineVersion": "0.1.0",
  "assessment": {
    "id": "example-001",
    "title": "Illustrative moisture challenge screening",
    "objective": "Identify the more challenging construction under subjective example scores",
    "mode": "hybrid",
    "rankingDirection": "most_aggressive",
    "datumAlternativeId": "alt-hdpe",
    "method": "weighted_mean",
    "scale": { "min": 0, "max": 5, "step": 1 },
    "alternatives": [
      { "id": "alt-hdpe", "name": "HDPE", "gate": "unknown" },
      { "id": "alt-pet", "name": "PET", "gate": "unknown" }
    ],
    "criteria": [
      { "id": "c1", "name": "Assigned permeation tendency", "direction": "higher", "weight": 50 },
      { "id": "c2", "name": "Assigned environmental sensitivity", "direction": "higher", "weight": 30 },
      { "id": "c3", "name": "Assigned thickness-related challenge", "direction": "higher", "weight": 20 }
    ],
    "ratings": {
      "alt-hdpe": { "c1": 2, "c2": 2, "c3": 4 },
      "alt-pet": { "c1": 4, "c2": 3, "c3": 2 }
    },
    "pugh": {
      "alt-pet": { "c1": "more", "c2": "more", "c3": "less" }
    },
    "assumptions": ["All input ratings are fictional examples; no material property is implied."],
    "conclusion": "Illustration only; physical test data required for an engineering decision."
  }
}
```

**Implementation requirement:** Permanent IDs must be used for alternatives and criteria. Renames must not orphan data. Removing a criterion must remove its linked ratings, weights, judgments, and evidence references in one consistent state transaction. Imported assessments require `schemaVersion` validation. Save input decisions, not only computed scores; recalculate on import and show the engine version.

## 11. Nonfunctional requirements and development deliverables

- **Platform:** static HTML/CSS/TypeScript/JavaScript web application, deployable to GitHub Pages; no compulsory backend.
- **Architecture:** pure calculation engine, schema/validation module, independent Pugh module, view/presentation module, persistence/export module.
- **Integrity:** deterministic calculations, no hidden AI scoring, no automatic mutation of source scores when toggling methods.
- **Privacy/IP:** local-first storage; user responsible for avoiding employer-confidential information; demonstrate with synthetic/public data only.
- **Accessibility:** keyboard controls, labeled rating inputs and direction controls, readable legends, screen-reader-compatible tables.
- **Performance:** support growing `N × M` matrices without an arbitrary small hard limit; test at least 100 alternatives × 100 criteria and show a soft performance warning for very large cases.
- **Documentation:** versioned README, formula reference, validation tests, limitations, sample case, release notes.
- **Usability:** one-click reset to demo; score source/rationale visible; Pugh sign legend always on screen.
- **Release designation:** `V0.1 — engineering-screening prototype`; **not** a validated decision-support medical device or QMS-controlled calculation.

### Proposed repository layout

```text
comparative-aggressiveness-explorer/
├─ README.md
├─ docs/
│  ├─ PROJECT_CHARTER_V0.1.md
│  ├─ ARCHITECTURE_AND_VERSION_ROADMAP.md
│  └─ METHOD_LIMITATIONS.md
├─ src/
│  ├─ model/assessment.ts
│  ├─ validation/assessmentValidation.ts
│  ├─ engine/normalize.ts
│  ├─ engine/aggregate.ts
│  ├─ engine/pugh.ts
│  ├─ engine/hybrid.ts
│  ├─ state/persistence.ts
│  └─ ui/...
├─ tests/
│  ├─ aggregation.test.ts
│  ├─ pugh.test.ts
│  ├─ hybrid.test.ts
│  └─ persistence.test.ts
└─ examples/
   └─ synthetic-moisture-comparison.json
```

## 12. Verification and acceptance test matrix

| ID | Test | Expected result |
|---|---|---|
| T01 | 2 alternatives, 1 criterion | Valid assessment and rank |
| T02 | 0–5, reverse direction, input 1 vs 4 | Aligned values 0.8 vs 0.2 |
| T03 | Custom 1–3 scale, input 2 | Aligned value 0.5 |
| T04 | Weighted HDPE/PET fictional sample | 2.40 and 3.30 on original 0–5 scale; 48/100 and 66/100 |
| T05 | All positive weights equal | Weighted mean equals arithmetic mean |
| T06 | All weights = 0 | Weighted result blocked with specific message |
| T07 | Missing rating | No final numeric rank; explicit incomplete notice |
| T08 | Input outside scale or wrong step | Validation error; no silent rounding |
| T09 | Product input contains aligned zero | Product is 0 with zero-collapse warning |
| T10 | Method reversal A=[5,5,1], B=[3,3,3] | Mean ranks A ahead; product ranks B ahead |
| T11 | Pugh PET `[more,more,less]` vs HDPE datum | Profile 2 plus, 0 same, 1 minus, 0 unknown |
| T12 | Manual Pugh says `same`, numeric is different | Review/discordance flag, both values preserved |
| T13 | Candidate with failed mandatory gate | Candidate retained in display but excluded from eligible rank |
| T14 | Identical numeric outcomes | Tied rank explicitly shown; no forced winner |
| T15 | Change datum | Prompt to reconfirm/clear datum-dependent Pugh judgments |
| T16 | Export then reimport | Same schema-valid inputs and reproducible calculated values |
| T17 | 100 alternatives × 100 criteria | Calculations remain responsive in supported browsers |
| T18 | Pugh-only mode | Qualitative profile shown; no numeric ranking fabricated |
| T19 | One criterion has weight 0 | It remains in the matrix; contributes 0 to weighted result |
| T20 | Pugh `unknown` | Explicit unknown count; not mapped to `same` |

### Quality gates

**QG1:** All T01–T20 tests pass. **QG2:** formula-help text matches the computation engine. **QG3:** two people can reproduce the sample manually. **QG4:** exported record preserves all ranking-relevant inputs. **QG5:** prominent warnings for physical-property/regulatory interpretation and product aggregation.

## 13. Delivery sequence and decision log

| Stage | Deliverable | Exit condition |
|---|---|---|
| A | Types, schema, pure arithmetic and Pugh modules | Unit tests pass |
| B | Editable alternative × criterion matrix and method selector | User can run a complete assessment |
| C | Hybrid diagnostics, evidence notes, constraints, results | Explanations match input and test cases |
| D | Persistence, JSON/CSV export, sample assessment | Export/import regression passes |
| E | README, limitations, responsive UI, GitHub Pages smoke test | Public V0.1 labeled as prototype |

**Design decision D001:** Use **normalized direction-aligned values** internally.  
**D002:** Keep **Pugh and quantitative outputs independent**; do not add their scores.  
**D003:** Include user-requested **simple product as exploratory opt-in**, never default.  
**D004:** **Weights optional** in V0.1, normalized by engine.  
**D005:** **Hard constraints cannot be compensated** by scores.  
**D006:** Do not represent conceptual screening as a validated regulatory/material-property conclusion.

## 14. Risks and mitigations

| Risk | Consequence | V0.1 mitigation |
|---|---|---|
| User interprets assigned ranks as physical properties | Incorrect worst-case conclusion | Prominent input provenance and interpretation disclaimer |
| Criteria overlap (e.g., polarity and hydrophilicity) | Double-counting | Criterion review checklist / warning |
| Reverse-score misunderstanding | Wrong ranking | Direction labels plus raw/aligned values |
| Multiplication of ordinal judgments | Unsupported numerical interpretation | Exploratory label, examples of rank reversal, not default |
| Baseline bias in Pugh | Distorted qualitative comparison | Baseline visible/changeable and judgments reconfirmed |
| Subjective weights | Unstable ranking | Require weight visibility and rationale field; sensitivity in V0.2 |
| Missing or contradictory evidence | False precision | Incomplete/review-needed statuses; never silent imputation |
| Confidential inputs stored in the browser | Information-handling risk | Local-only prototype, no telemetry, warning against confidential data |

## 15. Research and method references (context, not certification)

1. American Society for Quality (ASQ), **What Is a Decision Matrix?** — defines Pugh/datum comparisons and weighted scoring conventions. https://asq.org/quality-resources/decision-matrix
2. Frey et al., **The Pugh Controlled Convergence method: model-based evaluation and implications for design theory**, *Research in Engineering Design* — cautions against treating Pugh as automatic one-number selection. https://link.springer.com/article/10.1007/s00163-008-0056-z
3. NASA, **Systems Engineering Handbook — Appendix** — defines trade-study report content, including criteria, models, source data, uncertainty and selection rules. https://www.nasa.gov/reference/system-engineering-handbook-appendix/
4. NASA, **6.8 Decision Analysis** — overview of engineering decision-analysis practices. https://www.nasa.gov/reference/6-8-decision-analysis/
5. ISO, **ISO 14971:2019**, medical-device risk management — separate discipline; CAE does **not** implement its full requirements. https://www.iso.org/standard/72704.html

---

**Charter approval status:** Proposed, pending product-owner review.  
**Next implementation artifact:** `README.md` + V0.1 engineering tasks + pure-function test suite.  
**Companion:** `02_ARCHITECTURE_AND_VERSION_ROADMAP.md`.
