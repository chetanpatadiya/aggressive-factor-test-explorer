// Synthetic teaching data ONLY — these are not measured polymer properties.
export const APP_VERSION = '0.1.0';
export const SCHEMA_VERSION = '0.1.0';
export const ENGINE_VERSION = '0.1.0';

export function newId(prefix = 'id') {
  if (typeof globalThis.crypto?.randomUUID === 'function') return `${prefix}-${globalThis.crypto.randomUUID()}`;
  // Fallback only for old browsers; not a security identifier.
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createDemo() {
  return {
    schemaVersion: SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    assessment: {
      id: newId('assessment'),
      title: 'Synthetic moisture challenge comparison',
      objective: 'Identify the more challenging construction under subjective teaching scores',
      context: 'Illustrative packaging screening; not measured WVTR or material-property data',
      moreMeans: 'Greater assigned moisture ingress challenge under this fictional example',
      mode: 'hybrid', method: 'weighted_mean', rankingDirection: 'most_aggressive',
      datumAlternativeId: 'alt-hdpe',
      scale: { min: 0, max: 5, step: 1, anchors: {
        low: 'Lowest assigned challenge on this fictional scale',
        mid: 'Intermediate assigned challenge', high: 'Highest assigned challenge on this fictional scale' } },
      productAcknowledged: false,
      alternatives: [
        { id: 'alt-hdpe', name: 'HDPE example', description: 'Illustrative datum only', gate: 'unknown' },
        { id: 'alt-pet', name: 'PET example', description: 'Illustrative comparison only', gate: 'unknown' },
      ],
      criteria: [
        { id: 'c1', name: 'Assigned permeation tendency', definition: 'Fictional qualitative rating, not WVTR', direction: 'higher', weight: 50, evidence: 'assumption', notes: '' },
        { id: 'c2', name: 'Assigned environmental sensitivity', definition: 'Fictional sensitivity judgment', direction: 'higher', weight: 30, evidence: 'assumption', notes: '' },
        { id: 'c3', name: 'Assigned thickness-related challenge', definition: 'Fictional challenge judgment', direction: 'higher', weight: 20, evidence: 'assumption', notes: '' },
      ],
      ratings: { 'alt-hdpe': { c1: 2, c2: 2, c3: 4 }, 'alt-pet': { c1: 4, c2: 3, c3: 2 } },
      ratingDetails: {},
      pugh: { 'alt-pet': { c1: 'more', c2: 'more', c3: 'less' } },
      pughRationale: {},
      assumptions: 'All values are invented teaching inputs. No physical performance or compliance is established.',
      conclusion: 'Illustration only. Testing under comparable conditions is required for a physical engineering decision.',
    },
  };
}

export function createBlank() {
  const file = createDemo();
  const a = file.assessment;
  a.title = 'Untitled assessment'; a.objective = ''; a.context = ''; a.moreMeans = '';
  a.alternatives = [
    { id: newId('alt'), name: 'Alternative A', description: '', gate: 'unknown' },
    { id: newId('alt'), name: 'Alternative B', description: '', gate: 'unknown' },
  ];
  a.datumAlternativeId = a.alternatives[0].id;
  a.criteria = [{ id: newId('crit'), name: 'Criterion 1', definition: '', direction: 'higher', weight: 1, evidence: 'not_provided', notes: '' }];
  a.ratings = {}; a.ratingDetails = {}; a.pugh = {}; a.pughRationale = {};
  a.assumptions = ''; a.conclusion = '';
  a.mode = 'hybrid'; a.method = 'mean';
  return file;
}
