# Aggressive Factor Test Explorer

**V0.1 — local-first engineering screening prototype**

A configurable browser tool for ranking user-defined engineering alternatives using arithmetic sum, arithmetic mean, weighted mean, or **opt-in exploratory product**, alongside an independent Pugh-style datum comparison. Hybrid mode surfaces criterion-level agreement/disagreement between manually entered Pugh judgments and numerical scores; it **does not** blend these into a false composite index.

> **Important:** The app does not measure or predict actual properties, validate a worst-case condition, perform ISO 14971 risk analysis, or establish design-control/regulatory compliance. Demonstration material ratings are fictional. Use public/synthetic data; do not enter employer-confidential information into a public code repository or shared export.

## Run in a browser

No bundler, account, framework, API, or package installation required. JavaScript ES modules require an HTTP server instead of opening `index.html` as a `file://` URL.

```bash
# From repository root (Python 3 installed):
python3 -m http.server 8000
# Visit http://localhost:8000
```

Alternatively: `npx serve .` or publish to GitHub Pages. Offline behavior is local-first **after initial load**, but V0.1 is **not** an installable offline PWA (no service worker / app shell caching).

## Deploy to GitHub Pages (no build)

1. Create a new GitHub repository, e.g. `comparative-aggressiveness-explorer`.
2. Upload **all files and folders from inside this project**, retaining their paths. Keep `index.html` at repository root.
3. In repository **Settings → Pages → Build and deployment**, select **Deploy from a branch**.
4. Choose the `main` branch and `/(root)`, then Save.
5. Wait for Pages to show a published URL, typically `https://YOUR-USERNAME.github.io/comparative-aggressiveness-explorer/`. Replace `YOUR-USERNAME` with your account. The exact URL is supplied by GitHub.
6. Test the sample, change a score, export JSON, reload, reimport, and check the Results section.

Paths are relative (`./src/...`), so the site works under a GitHub Pages project subpath. `.nojekyll` disables unnecessary Jekyll processing. `.github/workflows/test.yml` runs engine tests on commits and pull requests; it does **not** publish the Pages website.

### Add to an existing personal website

Link a page/card to the confirmed GitHub Pages URL, or copy the app into a website subdirectory while preserving relative paths. Do not assume a target repository or domain path without checking your current site layout.

## Core workflow

1. **Objective:** State what “more aggressive” means and choose Numeric, Pugh, or Hybrid.
2. **Scale:** Set an integer range and step (0–5 by default), and define verbal anchors.
3. **Alternatives:** Add candidates (minimum 2); choose a datum for Pugh/Hybrid and record mandatory constraint status.
4. **Criteria:** Add editable criteria with “higher/lower score means more aggressive,” importance weights, evidence class, and definitions.
5. **Ratings:** Enter scores; blank is missing, not zero. Open **Evidence** on a cell to document rationale and source.
6. **Pugh:** Assign `+`, `S`, `−`, `?` manually against datum; do not assume they are inferred from numeric ratings.
7. **Results:** Review validation/errors, ranking and ties, hard-gate exclusions, Pugh profiles, hybrid consistency flags, and per-criterion calculation trace.
8. **Record:** Export JSON for reimport; CSV for tabular inspection; Markdown for a human-readable report. Local storage retains the last assessment in this browser (not a secure backup).

**Pugh symbol semantics in CAE:** `+` more *aggressive/challenging* than datum, `S` comparable, `−` less challenging, `?` unknown. This is not the standard “+ more desirable” convention.

## Testing

Node.js 20+:

```bash
npm test
node --check src/app.js
```

Test source is in `tests/`; runnable as GitHub Actions CI. The suite covers charter acceptance cases including reverse scoring, 0–5 synthetic weighted results (2.40 vs 3.30), multiplication rank reversal (A=25 vs B=27), Pugh profiles, hybrid discordance, zero-collapse, unknowns, failed gates, ties, imports, CSV injection escaping, and large-matrix calculations.

## Repository map

| Path | Responsibility |
|---|---|
| `index.html` | Single-page app structure and accessibility labels |
| `src/style.css` | Responsive layout, matrices and result cards |
| `src/app.js` | UI events and state editing (no calculation formulas) |
| `src/engine.js` | Pure scale validation, normalization, aggregation, Pugh, hybrid and ranking |
| `src/demo.js` | Fictional demonstration and blank assessment factory |
| `src/io.js` | Local save, compatible JSON import/export, CSV and Markdown reports |
| `examples/` | Versioned portable fictional sample |
| `tests/` | Mathematical, data integrity and export regression tests |
| `docs/` | Project charter, architecture roadmap, formulas / limitations |
| `.github/workflows/test.yml` | CI verification (no remote user data) |

## Data model and versioning

JSON exports include `schemaVersion` and `engineVersion`, plus the original user-input `assessment`. Derived numeric scores are **not** used as authoritative saved fields: the engine recomputes on import. V0.1 rejects unsupported future schema versions; it does not silently migrate or transform prior assessment records. Stable IDs preserve associations across renames. Removing criteria deletes associated scores/evidence/Pugh judgments. Changing datum prompts before clearing datum-dependent comparisons.

## Release boundaries

**V0.1 implemented:** flexible criteria, user-entered weights, numeric methods, datum Pugh, hybrid review, hard gates, anchors, local save, JSON/CSV/Markdown, tests.

**V0.1 not implemented:** AHP, TOPSIS, automatic criterion inference, measured-unit mappings, sensitivity perturbations, Monte Carlo, multiple reviewers, login/server sync, digital signoff, PWA installation, or validated decision approval. The [architecture roadmap](docs/ARCHITECTURE_AND_VERSION_ROADMAP.md) covers V0.2–V1.0.

## License and contributions

No license is granted by default; see `LICENSE.md`. Version control, code reviews, and regression testing are recommended before public release or external collaboration.
