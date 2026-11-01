/** Pure, dependency-free CAE calculation and validation engine. No DOM, storage, or I/O. */
import { ENGINE_VERSION, SCHEMA_VERSION } from './demo.js';

export const METHODS = ['sum', 'mean', 'weighted_mean', 'raw_product'];
export const MODES = ['numeric', 'pugh', 'hybrid'];
export const PUGH_VALUES = ['more', 'same', 'less', 'unknown'];
export const EVIDENCE_VALUES = ['measured', 'literature', 'supplier', 'expert_judgment', 'assumption', 'not_provided'];
const EPS = 1e-12;
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const finite = x => typeof x === 'number' && Number.isFinite(x);
const textValue = x => typeof x === 'string' && x.trim().length > 0;
const numericMode = mode => mode === 'numeric' || mode === 'hybrid';
const pughMode = mode => mode === 'pugh' || mode === 'hybrid';
const close = (x, y) => Math.abs(x - y) <= EPS * Math.max(1, Math.abs(x), Math.abs(y));

export function isValidScale(s) {
  if (!object(s) || ![s.min, s.max, s.step].every(Number.isInteger)) return false;
  if (s.min < 0 || s.min >= s.max || s.step <= 0) return false;
  return (s.max - s.min) % s.step === 0;
}

export function isValidRating(r, scale) {
  return finite(r) && isValidScale(scale) && r >= scale.min && r <= scale.max &&
    close((r - scale.min) / scale.step, Math.round((r - scale.min) / scale.step));
}

export function align(raw, scale, direction) {
  if (!isValidRating(raw, scale)) throw new RangeError('Rating is outside the scale or off-step');
  if (!['higher', 'lower'].includes(direction)) throw new TypeError('Invalid direction');
  return direction === 'higher' ? (raw - scale.min) / (scale.max - scale.min)
    : (scale.max - raw) / (scale.max - scale.min);
}

export function normalizedWeights(criteria) {
  const weights = criteria.map(c => c.weight);
  if (!weights.every(w => finite(w) && w >= 0)) throw new RangeError('Weights must be finite and nonnegative');
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) throw new RangeError('At least one positive weight is required');
  return weights.map(w => w / sum);
}

export function aggregate(values, criteria, method, scale) {
  if (!values.length || values.some(v => !finite(v) || v < 0 || v > 1)) throw new Error('Incomplete or invalid aligned scores');
  if (!METHODS.includes(method)) throw new Error('Unsupported calculation method');
  let score; let contributions;
  if (method === 'sum') {
    score = values.reduce((a, b) => a + b, 0);
    contributions = values.map(v => v);
  } else if (method === 'mean') {
    score = values.reduce((a, b) => a + b, 0) / values.length;
    contributions = values.map(v => v / values.length);
  } else if (method === 'weighted_mean') {
    const alpha = normalizedWeights(criteria);
    contributions = values.map((v, j) => v * alpha[j]);
    score = contributions.reduce((a, b) => a + b, 0);
  } else {
    const originalAligned = values.map(v => scale.min + (scale.max - scale.min) * v);
    score = originalAligned.reduce((a, b) => a * b, 1);
    if (!finite(score)) throw new RangeError('Product overflow; use another method or a smaller scale');
    contributions = null; // Product has no additive decomposition.
  }
  return { score, contributions, originalScaleScore: method === 'mean' || method === 'weighted_mean'
    ? scale.min + (scale.max - scale.min) * score : null };
}

export function profile(judgments) {
  const result = { plus: 0, same: 0, minus: 0, unknown: 0, net: 0 };
  for (const j of judgments) {
    if (j === 'more') result.plus++;
    else if (j === 'same') result.same++;
    else if (j === 'less') result.minus++;
    else result.unknown++;
  }
  result.net = result.plus - result.minus;
  return result;
}

/** Validate record structure before accepting imported untrusted JSON. */
export function validateShape(file) {
  const errors = [];
  if (!object(file) || file.schemaVersion !== SCHEMA_VERSION || !object(file.assessment)) {
    return ['Expected CAE schemaVersion 0.1.0 with an assessment object'];
  }
  const a = file.assessment;
  if (!Array.isArray(a.alternatives) || !Array.isArray(a.criteria)) return ['Missing alternatives or criteria arrays'];
  if (!object(a.scale) || !object(a.ratings) || !object(a.pugh)) errors.push('Missing scale, ratings, or Pugh maps');
  if (!MODES.includes(a.mode) || !METHODS.includes(a.method)) errors.push('Unknown mode or method');
  if (!['most_aggressive', 'least_aggressive'].includes(a.rankingDirection)) errors.push('Unknown ranking direction');
  if (typeof a.id !== 'string') errors.push('Missing assessment ID');
  for (const item of a.alternatives) {
    if (!object(item) || typeof item.id !== 'string' || typeof item.name !== 'string' || !['pass','fail','unknown'].includes(item.gate)) errors.push('Malformed alternative');
  }
  for (const c of a.criteria) {
    if (!object(c) || typeof c.id !== 'string' || typeof c.name !== 'string' ||
      !['higher','lower'].includes(c.direction) || !finite(c.weight) || c.weight < 0) errors.push('Malformed criterion');
  }
  if (!isValidScale(a.scale)) errors.push('Invalid rating scale');
  if (a.ratingDetails !== undefined && !object(a.ratingDetails)) errors.push('Malformed rating details');
  if (a.pughRationale !== undefined && !object(a.pughRationale)) errors.push('Malformed Pugh rationale');
  if (typeof a.title !== 'string' || typeof a.objective !== 'string') errors.push('Missing title or objective');
  if (a.datumAlternativeId !== null && typeof a.datumAlternativeId !== 'string') errors.push('Invalid datum ID');
  return errors;
}

export function validateAssessment(a) {
  const errors = [], warnings = [];
  if (!object(a)) return { errors: ['Assessment must be an object'], warnings };
  if (!textValue(a.title)) errors.push('Assessment title is required.');
  if (!textValue(a.objective)) errors.push('Define the comparison objective.');
  if (!textValue(a.moreMeans)) warnings.push('Explain what “more aggressive” means for this objective.');
  if (!MODES.includes(a.mode)) errors.push('Choose a valid evaluation mode.');
  if (!METHODS.includes(a.method)) errors.push('Choose a valid numeric method.');
  if (!['most_aggressive','least_aggressive'].includes(a.rankingDirection)) errors.push('Choose a valid ranking direction.');
  if (!isValidScale(a.scale)) errors.push('Scale must use integer min/max/step, min ≥ 0, and an exact number of steps.');
  const alternatives = Array.isArray(a.alternatives) ? a.alternatives : [];
  const criteria = Array.isArray(a.criteria) ? a.criteria : [];
  if (alternatives.length < 2) errors.push('At least two alternatives are required.');
  if (criteria.length < 1) errors.push('At least one criterion is required.');
  if (new Set(alternatives.map(x => x?.id)).size !== alternatives.length) errors.push('Alternative IDs must be unique.');
  if (new Set(criteria.map(x => x?.id)).size !== criteria.length) errors.push('Criterion IDs must be unique.');
  for (const alt of alternatives) {
    if (!textValue(alt?.name)) errors.push('Each alternative needs a name.');
    if (!['pass','fail','unknown'].includes(alt?.gate)) errors.push(`Invalid constraint status for ${alt?.name ?? 'alternative'}.`);
  }
  for (const c of criteria) {
    if (!textValue(c?.name)) errors.push('Each criterion needs a name.');
    if (!['higher','lower'].includes(c?.direction)) errors.push(`Set a valid direction for ${c?.name ?? 'criterion'}.`);
    if (!finite(c?.weight) || c.weight < 0) errors.push(`Weight must be nonnegative for ${c?.name ?? 'criterion'}.`);
    if (!textValue(c?.definition)) warnings.push(`Consider documenting the meaning of criterion “${c?.name}”.`);
  }
  if (criteria.length > 1) {
    const names = criteria.map(c => String(c.name).trim().toLowerCase());
    if (new Set(names).size < names.length) warnings.push('Duplicate criterion names: check for double-counting.');
  }
  if (alternatives.length * criteria.length > 10000) warnings.push('Large matrix (>10,000 cells): editing may be slower on mobile.');
  if (pughMode(a.mode)) {
    if (!alternatives.some(x => x.id === a.datumAlternativeId)) errors.push('Select an existing datum alternative for Pugh/Hybrid.');
    for (const alt of alternatives) if (alt.id !== a.datumAlternativeId) for (const c of criteria) {
      const state = a.pugh?.[alt.id]?.[c.id];
      if (!PUGH_VALUES.includes(state)) warnings.push(`Pugh judgment missing for ${alt.name} / ${c.name}; treated as unknown.`);
    }
  }
  if (numericMode(a.mode)) {
    if (a.method === 'weighted_mean' && !(criteria.reduce((s, c) => s + (finite(c.weight) ? c.weight : 0), 0) > 0))
      errors.push('Weighted mean requires at least one positive weight.');
    if (a.method === 'raw_product' && !a.productAcknowledged) errors.push('Acknowledge exploratory product limitations before calculating.');
    if (isValidScale(a.scale)) for (const alt of alternatives) for (const c of criteria) {
      const raw = a.ratings?.[alt.id]?.[c.id];
      if (raw === null || raw === undefined || raw === '') errors.push(`Missing rating: ${alt.name} / ${c.name}.`);
      else if (!isValidRating(raw, a.scale)) errors.push(`Invalid rating: ${alt.name} / ${c.name} (outside scale or wrong step).`);
      if (!a.ratingDetails?.[alt.id]?.[c.id]?.rationale) {
        // Rationales are advisory, not blocking.
      }
    }
    if (a.method === 'raw_product') warnings.push('Exploratory product of ordinal scores is scale-dependent and not a validated physical model; zero collapses product.');
  }
  if (alternatives.some(alt => alt.gate === 'fail')) warnings.push('Failed hard-gate alternatives remain visible but are excluded from numeric ranks.');
  if (alternatives.some(alt => alt.gate === 'unknown')) warnings.push('Unknown constraint status: a numeric rank is provisional, not an approval.');
  return { errors, warnings };
}

export function runAssessment(a) {
  const { errors, warnings } = validateAssessment(a);
  const result = { engineVersion: ENGINE_VERSION, errors, warnings, rows: [], numericReady: false, pughReady: false, hybridFlags: [], method: a.method };
  const alternatives = Array.isArray(a.alternatives) ? a.alternatives : [];
  const criteria = Array.isArray(a.criteria) ? a.criteria : [];
  const datum = alternatives.find(x => x.id === a.datumAlternativeId);
  const validScale = isValidScale(a.scale);

  // Independent Pugh output remains usable even when hybrid numeric ratings are incomplete.
  if (pughMode(a.mode) && datum) {
    result.pughReady = true;
    result.pugh = alternatives.map(alt => {
      if (alt.id === datum.id) return { id: alt.id, isDatum: true, profile: null, judgments: [] };
      const judgments = criteria.map(c => {
        const v = a.pugh?.[alt.id]?.[c.id];
        return PUGH_VALUES.includes(v) ? v : 'unknown';
      });
      return { id: alt.id, isDatum: false, profile: profile(judgments), judgments };
    });
  }

  const numericBlocker = errors.some(e => !e.startsWith('Pugh') && !e.startsWith('Select an existing datum'));
  if (numericMode(a.mode) && !numericBlocker && validScale) {
    try {
      const rows = alternatives.map(alt => {
        const aligned = criteria.map(c => align(a.ratings[alt.id][c.id], a.scale, c.direction));
        const { score, contributions, originalScaleScore } = aggregate(aligned, criteria, a.method, a.scale);
        return { id: alt.id, name: alt.name, gate: alt.gate, aligned, score, originalScaleScore, contributions,
          rank: null, excluded: alt.gate === 'fail', provisional: alt.gate === 'unknown' };
      });
      const eligible = rows.filter(r => !r.excluded).sort((x, y) =>
        a.rankingDirection === 'least_aggressive' ? x.score - y.score : y.score - x.score);
      eligible.forEach((r, ix) => { r.rank = ix && close(r.score, eligible[ix - 1].score) ? eligible[ix - 1].rank : ix + 1; });
      result.rows = rows;
      result.numericReady = true;
      if (a.method === 'raw_product' && rows.some(r => r.score === 0)) result.warnings.push('At least one product is zero; zero-collapse can mask meaningful differences.');
    } catch (error) { result.errors.push(`Calculation error: ${error.message}`); }
  }

  if (a.mode === 'hybrid' && result.pughReady && result.numericReady) {
    const byId = new Map(result.rows.map(x => [x.id, x]));
    const base = byId.get(datum.id);
    for (const alt of alternatives) if (alt.id !== datum.id) {
      const actual = byId.get(alt.id);
      criteria.forEach((c, j) => {
        const manual = a.pugh?.[alt.id]?.[c.id] ?? 'unknown';
        const delta = actual.aligned[j] - base.aligned[j];
        const inferred = close(delta, 0) ? 'same' : delta > 0 ? 'more' : 'less';
        const state = manual === 'unknown' ? 'unknown' : manual === inferred ? 'consistent' : 'review_needed';
        result.hybridFlags.push({ altId: alt.id, criterionId: c.id, manual, inferred, state });
      });
    }
    if (result.hybridFlags.some(f => f.state === 'review_needed')) result.warnings.push('Pugh and numerical criterion comparisons disagree: review flagged cells.');
  }
  return result;
}
