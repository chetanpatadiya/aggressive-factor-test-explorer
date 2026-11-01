# Release checklist — CAE V0.1

## Verification

- [ ] Run `npm test`; capture passed/failed counts in the release notes.
- [ ] Run `node --check src/app.js` and `node --check src/engine.js`.
- [ ] Browser smoke test on desktop and mobile: objective, mode, rating, weights, Pugh, datum change, hard gates, export/import, persistence.
- [ ] Confirm synthetic example: HDPE 2.40/5 and PET 3.30/5 weighted; Pugh profile +2/S0/−1/?0.
- [ ] Confirm blank assessment blocks ranking until all numeric ratings are provided.
- [ ] Confirm exploratory product requires acknowledgement and warns on zero-collapse.
- [ ] Check keyboard access, screen zoom, table overflow and focus behavior.
- [ ] Check import of incompatible or malformed JSON fails without overwriting existing records.
- [ ] Verify no private telemetry, remote scripts, or unauthorized network requests.
- [ ] Inspect published website and existing cross-links after GitHub Pages deployment.

## Engineering and publishing controls

- [ ] Review license status and ownership/IP before sharing externally.
- [ ] Use synthetic/public examples only; remove employer-confidential information.
- [ ] Keep disclaimer visible, especially in public calculator descriptions.
- [ ] Record app/engine/schema version and test date.
- [ ] Preserve versioned project charter and architecture roadmap with release.
