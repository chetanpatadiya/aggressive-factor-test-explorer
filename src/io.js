import { SCHEMA_VERSION, ENGINE_VERSION } from './demo.js';
import { runAssessment, validateShape, validateAssessment } from './engine.js';

const escapeMd = x => String(x ?? '').replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('\n', ' ');
const csvCell = value => {
  let x = String(value ?? '');
  // Prevent CSV formula injection when a user opens results in a spreadsheet.
  if (/^[\s]*[=+@-]/.test(x) && !/^\s*-?\d+(\.\d+)?$/.test(x)) x = `'${x}`;
  return `"${x.replaceAll('"','""')}"`;
};
const csvLine = cells => cells.map(csvCell).join(',');
export const filename = (title, extension) => `${String(title || 'assessment').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55) || 'assessment'}-${SCHEMA_VERSION}.${extension}`;
export function exportJson(file) {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, engineVersion: ENGINE_VERSION, assessment: file.assessment }, null, 2) + '\n';
}
export function importJson(raw) {
  if (raw.length > 5_000_000) throw new Error('JSON file exceeds the 5 MB import limit.');
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('The selected file is not valid JSON.'); }
  const errs = validateShape(data);
  if (errs.length) throw new Error(`Import rejected: ${errs.slice(0, 5).join(' ')}`);
  const a = data.assessment;
  // Import permits incomplete user drafts, but rejects corrupted IDs and association maps.
  if (new Set(a.alternatives.map(x => x.id)).size !== a.alternatives.length ||
      new Set(a.criteria.map(x => x.id)).size !== a.criteria.length) throw new Error('Duplicate IDs in import.');
  if (a.alternatives.length < 2 || a.criteria.length < 1) throw new Error('Import requires at least 2 alternatives and 1 criterion.');
  // IDs become object-map keys in the editor. Accept stable portable IDs only;
  // reject JavaScript special keys (__proto__, constructor, prototype).
  const safeId = x => /^[a-zA-Z][a-zA-Z0-9_-]{0,110}$/.test(x) &&
    !['__proto__', 'constructor', 'prototype'].includes(x);
  for (const alt of a.alternatives) {
    if (!safeId(alt.id) || !alt.name.trim()) throw new Error('Invalid or unsafe alternative ID or name.');
    if (a.ratings[alt.id] !== undefined && (a.ratings[alt.id] === null || typeof a.ratings[alt.id] !== 'object' || Array.isArray(a.ratings[alt.id]))) throw new Error('Malformed ratings map.');
    if (a.pugh[alt.id] !== undefined && (a.pugh[alt.id] === null || typeof a.pugh[alt.id] !== 'object' || Array.isArray(a.pugh[alt.id]))) throw new Error('Malformed Pugh map.');
  }
  for (const c of a.criteria) {
    if (!safeId(c.id) || !c.name.trim()) throw new Error('Invalid or unsafe criterion ID or name.');
  }
  a.ratingDetails ??= {}; a.pughRationale ??= {}; a.context ??= ''; a.moreMeans ??= '';
  a.assumptions ??= ''; a.conclusion ??= ''; a.productAcknowledged ??= false;
  a.scale.anchors ??= { low: '', mid: '', high: '' };
  return { schemaVersion: SCHEMA_VERSION, engineVersion: ENGINE_VERSION, assessment: a };
}
export function exportCsv(a) {
  const result = runAssessment(a); const numeric = new Map(result.rows.map(x => [x.id, x]));
  const flags = new Map(result.hybridFlags.map(f => [`${f.altId}/${f.criterionId}`, f.state]));
  const rows = [[ 'Alternative','Constraint','Rank','Aggregate method','Aggregate score','Criterion','Direction','Weight','Raw rating','Aligned 0-1','Additive contribution','Pugh vs datum','Hybrid status','Evidence status','Score rationale','Source' ]];
  for (const alt of a.alternatives) for (const c of a.criteria) {
    const r = numeric.get(alt.id); const ix = a.criteria.findIndex(x => x.id === c.id);
    const detail = a.ratingDetails?.[alt.id]?.[c.id] ?? {};
    rows.push([alt.name, alt.gate, r?.rank ?? '', a.method, r?.score ?? '', c.name, c.direction, c.weight,
      a.ratings?.[alt.id]?.[c.id] ?? '', r?.aligned[ix] ?? '', r?.contributions?.[ix] ?? '',
      alt.id === a.datumAlternativeId ? 'datum' : a.pugh?.[alt.id]?.[c.id] ?? 'unknown',
      flags.get(`${alt.id}/${c.id}`) ?? '', detail.evidenceStatus ?? '', detail.rationale ?? '', detail.source ?? '']);
  }
  return rows.map(csvLine).join('\r\n') + '\r\n';
}
export function exportMarkdown(a) {
  const r = runAssessment(a), date = new Date().toISOString();
  const lines = [
    `# ${escapeMd(a.title)}`, '', `- Exported UTC: ${date}`, `- Engine: ${ENGINE_VERSION}`,
    `- Mode: ${a.mode}`, `- Numeric method: ${a.method}`, `- Ranking direction: ${a.rankingDirection}`,
    `- Scale: ${a.scale.min} to ${a.scale.max} by ${a.scale.step}`,
    `- Objective: ${escapeMd(a.objective)}`, `- Aggressiveness definition: ${escapeMd(a.moreMeans)}`,
    `- Context: ${escapeMd(a.context)}`, '',
    '## Results', '', '| Alternative | Gate | Numeric score | Rank | Pugh +/S/−/? |', '|---|---|---:|---:|---|'
  ];
  for (const alt of a.alternatives) {
    const n = r.rows.find(x => x.id === alt.id), p = r.pugh?.find(x => x.id === alt.id);
    lines.push(`| ${escapeMd(alt.name)} | ${alt.gate} | ${n ? n.score.toPrecision(7) : 'not calculated'} | ${n?.rank ?? (n?.excluded ? 'excluded' : '—')} | ${p?.isDatum ? 'datum' : p?.profile ? `${p.profile.plus}/${p.profile.same}/${p.profile.minus}/${p.profile.unknown}` : '—'} |`);
  }
  lines.push('', '## Input ratings and judgments', '', '| Criterion | Direction | Weight | ' + a.alternatives.map(x => escapeMd(x.name)).join(' | ') + ' |',
    '|---|---|---:|' + a.alternatives.map(() => '---|').join(''));
  for (const c of a.criteria) lines.push(`| ${escapeMd(c.name)} | ${c.direction} | ${c.weight} | ${a.alternatives.map(alt => `${a.ratings?.[alt.id]?.[c.id] ?? '—'} / ${alt.id === a.datumAlternativeId ? 'datum' : a.pugh?.[alt.id]?.[c.id] ?? '?'}`).join(' | ')} |`);
  lines.push('', '## Evidence and rationale', '');
  for (const c of a.criteria) {
    lines.push(`### ${escapeMd(c.name)}`, '', `Definition: ${escapeMd(c.definition ?? '')}. Criterion evidence: ${escapeMd(c.evidence ?? 'not provided')}. ${escapeMd(c.notes ?? '')}`, '');
    for (const alt of a.alternatives) {
      const detail = a.ratingDetails?.[alt.id]?.[c.id] ?? {};
      lines.push(`- ${escapeMd(alt.name)}: rating rationale: ${escapeMd(detail.rationale ?? 'not provided')}; evidence: ${escapeMd(detail.evidenceStatus ?? 'not provided')}; source: ${escapeMd(detail.source ?? 'not provided')}; Pugh rationale: ${escapeMd(a.pughRationale?.[alt.id]?.[c.id] ?? 'not provided')}`);
    }
    lines.push('');
  }
  lines.push('## Hybrid review flags', '');
  if (!r.hybridFlags.length) lines.push('No hybrid comparison available.');
  for (const f of r.hybridFlags.filter(f => f.state !== 'consistent')) lines.push(`- ${escapeMd(a.alternatives.find(x => x.id === f.altId)?.name)} / ${escapeMd(a.criteria.find(x => x.id === f.criterionId)?.name)}: manual ${f.manual}, inferred ${f.inferred}; ${f.state}`);
  lines.push('', '## Warnings and validation', '', ...r.errors.map(x => `- ERROR: ${escapeMd(x)}`), ...r.warnings.map(x => `- WARNING: ${escapeMd(x)}`),
    '', '## Assumptions', '', escapeMd(a.assumptions), '', '## Human conclusion', '', escapeMd(a.conclusion), '',
    '## Limitation', '', 'This is a user-defined comparative screening tool; not a validated physical model, medical-device risk assessment, regulatory finding, or proof of compliance.', '');
  return lines.join('\n');
}
export function saveLocal(file) {
  localStorage.setItem('cae-assessment-v0.1', exportJson(file));
}
export function loadLocal() {
  const s = localStorage.getItem('cae-assessment-v0.1');
  return s ? importJson(s) : null;
}
