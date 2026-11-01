import { createDemo, createBlank, newId, APP_VERSION } from './demo.js';
import { runAssessment, isValidScale } from './engine.js';
import { exportJson, importJson, exportCsv, exportMarkdown, saveLocal, loadLocal, filename } from './io.js';

const $ = id => document.getElementById(id);
const esc = x => String(x ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const attr = (name, val) => `${name}="${esc(val)}"`;
const options = (values, current) => values.map(([value, label]) => `<option value="${esc(value)}" ${value === current ? 'selected' : ''}>${esc(label)}</option>`).join('');
const NUM_MODES = new Set(['numeric','hybrid']);
const PUGH_MODES = new Set(['pugh','hybrid']);
const evidences = ['not_provided','measured','literature','supplier','expert_judgment','assumption'].map(x=>[x,x.replaceAll('_',' ')]);
const pughOpts = [['unknown','? Uncertain'],['more','+ More aggressive'],['same','S Equivalent'],['less','− Less aggressive']];
const methodOpts = [['mean','Arithmetic mean (equal weight)'],['sum','Arithmetic sum'],['weighted_mean','Weighted mean'],['raw_product','Exploratory product (opt-in)']];
const modeOpts = [['hybrid','Hybrid — numeric + Pugh'],['numeric','Numeric only'],['pugh','Pugh only']];
let file;
try { file = loadLocal() ?? createDemo(); } catch { file = createDemo(); }
let inspected = null;
let statusTimer = null;
const assessment = () => file.assessment;
const getAlt = id => assessment().alternatives.find(x => x.id === id);
const getCrit = id => assessment().criteria.find(x => x.id === id);
function status(message, error = false) {
  const node = $('status'); node.hidden = false; node.textContent = message; node.className = error ? 'status error' : 'status';
  clearTimeout(statusTimer); statusTimer = setTimeout(() => { node.hidden = true; }, 7000);
}
function persist() { try { saveLocal(file); } catch { status('Local save failed. Export JSON to preserve your data.', true); } }
function update(repaint = true) { persist(); if (repaint) renderAll(); else renderResults(); }
function textField(label, field, value, placeholder = '', extra = '') {
  return `<label>${esc(label)}<input type="text" data-field="${esc(field)}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${extra}></label>`;
}
function renderSetup() {
  const a = assessment();
  $('setup-editor').innerHTML = `
    <div class="grid-2">
      ${textField('Assessment title','title',a.title,'Name your study')}
      ${textField('Objective / comparison question','objective',a.objective,'Identify the most challenging alternative…')}
    </div>
    <div class="grid-2 setup-meta">
      <label>Application context<textarea rows="2" data-field="context" placeholder="Relevant conditions, scope and boundaries">${esc(a.context)}</textarea></label>
      <label>What does MORE aggressive mean?<textarea rows="2" data-field="moreMeans" placeholder="Example: greater moisture ingress challenge">${esc(a.moreMeans)}</textarea></label>
    </div>
    <div class="grid-3 setup-meta">
      <label>Evaluation mode<select data-field="mode">${options(modeOpts,a.mode)}</select></label>
      <label>Numeric method<select data-field="method" ${!NUM_MODES.has(a.mode) ? 'disabled' : ''}>${options(methodOpts,a.method)}</select></label>
      <label>Show ranking<select data-field="rankingDirection">${options([['most_aggressive','Most aggressive first'],['least_aggressive','Least aggressive first']],a.rankingDirection)}</select></label>
    </div>
    <h3 class="group-title">Shared rating scale</h3>
    <div class="grid-3">
      <label>Minimum<input type="number" step="1" data-scale="min" value="${esc(a.scale.min)}"></label>
      <label>Maximum<input type="number" step="1" data-scale="max" value="${esc(a.scale.max)}"></label>
      <label>Step<input type="number" step="1" min="1" data-scale="step" value="${esc(a.scale.step)}"></label>
    </div>
    <p class="help">Presets: <button class="btn tiny" type="button" data-action="scale-preset" data-preset="0,3,1">0–3</button> <button class="btn tiny" type="button" data-action="scale-preset" data-preset="0,5,1">0–5</button> <button class="btn tiny" type="button" data-action="scale-preset" data-preset="1,5,1">1–5</button> <button class="btn tiny" type="button" data-action="scale-preset" data-preset="0,10,1">0–10</button>. Changing the scale preserves existing scores and flags out-of-range values.</p>
    <div class="grid-3">
      ${textField('Low anchor / score meaning','anchor.low',a.scale.anchors?.low ?? '','What does the low value mean?')}
      ${textField('Middle anchor / interpretation','anchor.mid',a.scale.anchors?.mid ?? '','Interpretation at midpoint')}
      ${textField('High anchor / score meaning','anchor.high',a.scale.anchors?.high ?? '','What does the high value mean?')}
    </div>
    ${a.method === 'raw_product' && NUM_MODES.has(a.mode) ? `<div class="method-note"><label class="horizontal-label"><input type="checkbox" data-field="productAcknowledged" ${a.productAcknowledged ? 'checked' : ''}> I acknowledge that multiplying ordinal scores is scale-dependent, can collapse to zero, and is not a validated physical model.</label></div>` : `<p class="method-note">Default: arithmetic mean. Weighted mean uses user-supplied importance weights. Pugh judgments are never blended into the numeric score.</p>`}`;
}
function renderAlternatives() {
  const a = assessment(), pugh = PUGH_MODES.has(a.mode);
  $('alternatives-editor').innerHTML = `<div class="table-scroll"><table><thead><tr><th>Alternative</th><th>Description</th><th>Mandatory requirement</th>${pugh ? '<th>Datum</th>' : ''}<th>Manage</th></tr></thead><tbody>
    ${a.alternatives.map((x, i) => `<tr><td><input class="cell-input" aria-label="Name of alternative ${i+1}" data-alt="${esc(x.id)}" data-key="name" value="${esc(x.name)}"></td>
    <td><input class="cell-input" aria-label="Description for ${esc(x.name)}" data-alt="${esc(x.id)}" data-key="description" value="${esc(x.description)}"></td>
    <td><select class="cell-select" aria-label="Hard gate for ${esc(x.name)}" data-alt="${esc(x.id)}" data-key="gate">${options([['unknown','Unknown / not assessed'],['pass','Pass (user stated)'],['fail','Fail (exclude from eligible rank)']],x.gate)}</select></td>
    ${pugh ? `<td><label class="horizontal-label"><input type="radio" name="datum" aria-label="Use ${esc(x.name)} as Pugh datum" data-datum="${esc(x.id)}" ${x.id === a.datumAlternativeId ? 'checked' : ''}> Datum</label></td>` : ''}
    <td><button class="btn tiny danger" type="button" data-action="delete-alt" data-id="${esc(x.id)}" ${a.alternatives.length <= 2 ? 'disabled' : ''}>Remove</button></td></tr>`).join('')}
    </tbody></table></div><div class="table-actions"><button class="btn subtle" data-action="add-alt" type="button">+ Add alternative</button></div>`;
}
function renderCriteria() {
  const a = assessment(), total = a.criteria.reduce((s,c) => s + (Number.isFinite(c.weight) ? c.weight : 0),0);
  $('criteria-editor').innerHTML = `<div class="table-scroll"><table><thead><tr><th>Criterion / definition</th><th>Effect of higher raw score</th><th>Weight</th><th>Normalized</th><th>Evidence class</th><th>Order / remove</th></tr></thead><tbody>
    ${a.criteria.map((c, i)=>`<tr><td><input aria-label="Criterion ${i+1} name" class="cell-input" data-crit="${esc(c.id)}" data-key="name" value="${esc(c.name)}"><input style="margin-top:5px" aria-label="Definition for ${esc(c.name)}" class="cell-input" data-crit="${esc(c.id)}" data-key="definition" value="${esc(c.definition ?? '')}" placeholder="Meaning / units / boundary"></td>
    <td><select class="cell-select" data-crit="${esc(c.id)}" data-key="direction" aria-label="Direction of ${esc(c.name)}">${options([['higher','More aggressive'],['lower','Less aggressive (reverse)']],c.direction)}</select></td>
    <td><input type="number" min="0" step="any" class="rating-input" data-crit="${esc(c.id)}" data-key="weight" aria-label="Weight for ${esc(c.name)}" value="${esc(c.weight)}"></td>
    <td><span class="pill">${total > 0 && Number.isFinite(c.weight) ? (100*c.weight/total).toFixed(1) : '—'}%</span></td>
    <td><select class="cell-select" data-crit="${esc(c.id)}" data-key="evidence" aria-label="Evidence for ${esc(c.name)}">${options(evidences,c.evidence ?? 'not_provided')}</select></td>
    <td><div class="cell-actions"><button class="btn tiny" type="button" title="Move up" aria-label="Move ${esc(c.name)} up" data-action="up-crit" data-id="${esc(c.id)}" ${i===0?'disabled':''}>↑</button><button class="btn tiny" type="button" title="Move down" aria-label="Move ${esc(c.name)} down" data-action="down-crit" data-id="${esc(c.id)}" ${i===a.criteria.length-1?'disabled':''}>↓</button><button class="btn tiny danger" type="button" data-action="delete-crit" data-id="${esc(c.id)}" ${a.criteria.length<=1?'disabled':''}>×</button></div></td></tr>`).join('')}
    </tbody></table></div>
    <p class="help">Weight is relative importance, not a measured sensitivity. Zero weight excludes the criterion from a weighted aggregate but retains it in the record. Review related criteria for double-counting.</p>
    <button class="btn subtle" type="button" data-action="add-crit">+ Add criterion</button>`;
}
function renderRatings() {
  const a = assessment();
  if (!NUM_MODES.has(a.mode)) { $('ratings-editor').innerHTML = '<p class="muted">Numeric ratings are not required in Pugh-only mode. Switch to Numeric or Hybrid to edit them.</p>'; $('detail-editor').innerHTML=''; return; }
  $('ratings-editor').innerHTML = `<p class="help">Scale ${esc(a.scale.min)}–${esc(a.scale.max)}, step ${esc(a.scale.step)}. Evidence opens the per-cell rationale/source inspector.</p><div class="table-scroll"><table class="matrix"><thead><tr><th>Criterion (direction)</th>${a.alternatives.map(x=>`<th>${esc(x.name)}${x.id===a.datumAlternativeId && PUGH_MODES.has(a.mode)?' · datum':''}</th>`).join('')}</tr></thead><tbody>
    ${a.criteria.map(c=>`<tr><td class="matrix-label">${esc(c.name)}<small>${c.direction==='lower'?'Lower raw = more challenge':'Higher raw = more challenge'}</small></td>
    ${a.alternatives.map(alt=>`<td><div class="cell-actions"><input class="rating-input" type="number" inputmode="decimal" ${attr('min',a.scale.min)} ${attr('max',a.scale.max)} ${attr('step',a.scale.step)} ${attr('aria-label', `${c.name} rating for ${alt.name}`)} data-rating-alt="${esc(alt.id)}" data-rating-crit="${esc(c.id)}" value="${esc(a.ratings?.[alt.id]?.[c.id] ?? '')}"><button class="evidence-btn" type="button" data-action="inspect" data-kind="rating" data-alt-id="${esc(alt.id)}" data-crit-id="${esc(c.id)}">Evidence</button></div></td>`).join('')}</tr>`).join('')}
    </tbody></table></div>`;
  renderInspector();
}
function renderPugh() {
  const a = assessment();
  if (!PUGH_MODES.has(a.mode)) { $('pugh-editor').innerHTML='<p class="muted">Pugh comparison is not active in Numeric-only mode.</p>'; return; }
  const base = getAlt(a.datumAlternativeId);
  $('pugh-editor').innerHTML = `<p class="help"><strong>Datum:</strong> ${esc(base?.name ?? 'not selected')} · <strong>+</strong> more aggressive · <strong>S</strong> equivalent · <strong>−</strong> less aggressive · <strong>?</strong> unknown. These are challenge comparisons, not the classical “more desirable” interpretation.</p><div class="table-scroll"><table class="matrix"><thead><tr><th>Criterion</th>${a.alternatives.map(x=>`<th>${esc(x.name)}</th>`).join('')}</tr></thead><tbody>
    ${a.criteria.map(c=>`<tr><td>${esc(c.name)}</td>${a.alternatives.map(alt=>`<td>${alt.id === a.datumAlternativeId ? '<span class="datum-mark">S · datum</span>' : `<div class="cell-actions"><select class="cell-select" ${attr('aria-label', `Pugh ${c.name} for ${alt.name}`)} data-pugh-alt="${esc(alt.id)}" data-pugh-crit="${esc(c.id)}">${options(pughOpts,a.pugh?.[alt.id]?.[c.id] ?? 'unknown')}</select><button class="evidence-btn" type="button" data-action="inspect" data-kind="pugh" data-alt-id="${esc(alt.id)}" data-crit-id="${esc(c.id)}">Why?</button></div>`}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>`;
}
function renderInspector() {
  const host = $('detail-editor'), a = assessment();
  if (!inspected || !getAlt(inspected.altId) || !getCrit(inspected.critId) ||
      (inspected.kind === 'rating' && !NUM_MODES.has(a.mode)) || (inspected.kind === 'pugh' && !PUGH_MODES.has(a.mode))) { host.innerHTML=''; return; }
  const alt = getAlt(inspected.altId), crit = getCrit(inspected.critId), r = a.ratingDetails?.[alt.id]?.[crit.id] ?? {};
  host.innerHTML = `<div class="detail-box"><div class="detail-top"><strong>${inspected.kind==='rating'?'Rating evidence':'Pugh rationale'}: ${esc(alt.name)} / ${esc(crit.name)}</strong><button type="button" class="btn tiny" data-action="close-inspector">Close</button></div>
    ${inspected.kind==='rating' ? `<div class="grid-2"><label>Evidence status<select data-detail="evidenceStatus">${options(evidences,r.evidenceStatus ?? 'not_provided')}</select></label><label>Source / reference<input type="text" data-detail="source" value="${esc(r.source ?? '')}" placeholder="Report ID, URL, assumption…"></label></div><label style="margin-top:10px">Rationale for assigned score<textarea rows="2" data-detail="rationale" placeholder="Why was this rating assigned?">${esc(r.rationale ?? '')}</textarea></label>` : `<label>Reasoning relative to selected datum<textarea rows="3" data-detail="pughRationale" placeholder="Explain the + / S / − judgment or missing evidence">${esc(a.pughRationale?.[alt.id]?.[crit.id] ?? '')}</textarea></label>`}
    </div>`;
}
function fmt(x) { return Number.isFinite(x) ? Number(x).toFixed(4).replace(/0+$/,'').replace(/\.$/,'') : '—'; }
function renderResults() {
  const a = assessment(), result = runAssessment(a);
  const issues = [...result.errors.map(x=>`<div class="notice error">${esc(x)}</div>`),...result.warnings.map(x=>`<div class="notice">${esc(x)}</div>`)];
  const num = result.numericReady && NUM_MODES.has(a.mode);
  const pugh = result.pughReady && PUGH_MODES.has(a.mode);
  let html = `<div class="notices">${issues.length ? issues.slice(0,18).join('') + (issues.length>18 ? `<div class="notice">${issues.length-18} additional notices. Export report for all.</div>`:'') : '<p class="ok">All required inputs are present for the selected mode.</p>'}</div>`;
  if (num) {
    const eligible = [...result.rows].filter(x=>!x.excluded).sort((x,y)=>x.rank-y.rank), ordered = [...eligible,...result.rows.filter(x=>x.excluded)];
    const canBar = a.method !== 'sum' && a.method !== 'raw_product';
    html += `<h3 class="group-title">Numeric comparison <span class="pill">${esc(a.method.replaceAll('_',' '))}</span></h3><div class="results-grid">
      ${ordered.map(r=>`<div class="result-card ${r.rank===1?'is-top':''}"><div class="caption">${r.excluded?'Excluded: failed constraint':r.rank===null?'Not ranked':`Rank ${r.rank}${r.provisional?' · provisional':''}`}</div><h3>${esc(r.name)}</h3><div class="score">${fmt(r.score)}</div><div class="caption">${canBar ? `${fmt(r.score*100)} / 100 aligned; ${fmt(r.originalScaleScore)} on ${a.scale.min}–${a.scale.max} scale` : a.method==='sum'?'Sum of aligned 0–1 ratings':'Product of original-scale aligned ratings'}</div>${canBar?`<div class="bar" role="img" aria-label="${esc(r.name)} score ${fmt(r.score*100)} out of 100"><div style="width:${Math.max(0,Math.min(100,r.score*100))}%"></div></div>`:''}<div class="caption">${r.gate==='unknown'?'Mandatory requirements unverified':r.gate==='pass'?'Mandatory requirements marked pass by user':'Mandatory requirement failed'}</div></div>`).join('')}
      </div>`;
    html += `<details><summary>How each numerical score was calculated</summary><div class="table-scroll"><table><thead><tr><th>Alternative</th><th>Criterion</th><th>Entered</th><th>Aligned (0–1)</th><th>Weight</th><th>Additive contribution</th></tr></thead><tbody>
      ${result.rows.map(row=>a.criteria.map((c,i)=>`<tr><td>${esc(row.name)}</td><td>${esc(c.name)}</td><td>${esc(a.ratings?.[row.id]?.[c.id])}</td><td>${fmt(row.aligned[i])}</td><td>${esc(c.weight)}</td><td>${row.contributions ? fmt(row.contributions[i]) : 'n/a (product)'}</td></tr>`).join('')).join('')}</tbody></table></div><p class="help">Normalized direction: higher aligned score = more aggressive. Sum range 0–M; mean/weighted mean range 0–1; product is unvalidated exploratory aggregation. Weights are normalized to sum to 1 for weighted mean.</p></details>`;
  } else if (NUM_MODES.has(a.mode)) {
    html += '<p class="muted"><strong>No official numerical ranking.</strong> Complete the required inputs or resolve validation errors. Missing data is never treated as zero.</p>';
  }
  if (pugh) {
    html += `<h3 class="group-title">Pugh profiles relative to ${esc(getAlt(a.datumAlternativeId)?.name ?? 'datum')}</h3><div class="table-scroll"><table><thead><tr><th>Alternative</th><th>More (+)</th><th>Same (S)</th><th>Less (−)</th><th>Unknown (?)</th><th>NET*</th></tr></thead><tbody>
      ${result.pugh.map(p=>`<tr><td>${esc(getAlt(p.id)?.name)} ${p.isDatum?'<span class="pill">datum</span>':''}</td>${p.isDatum?'<td colspan="5">Reference; not ranked by Pugh</td>':`<td>${p.profile.plus}</td><td>${p.profile.same}</td><td>${p.profile.minus}</td><td>${p.profile.unknown}</td><td>${p.profile.net}</td>`}</tr>`).join('')}
      </tbody></table></div><p class="help">* NET = number of + minus number of −; descriptive only. Pugh profiles are not formal physical scores or approved rankings.</p>`;
  }
  if (a.mode==='hybrid') {
    const flags = result.hybridFlags.filter(f=>f.state!=='consistent');
    html += `<h3 class="group-title">Hybrid consistency review</h3>${!result.numericReady?'<p class="muted">Enter all numeric ratings to compare Pugh judgments with aligned numerical direction.</p>':flags.length?flags.map(f=>`<div class="flag">${esc(getAlt(f.altId)?.name)} / ${esc(getCrit(f.criterionId)?.name)}: Pugh <strong>${esc(f.manual)}</strong>; numerical comparison <strong>${esc(f.inferred)}</strong> — ${f.state === 'review_needed' ? 'REVIEW DISAGREEMENT' : 'insufficient Pugh judgment'}.</div>`).join(''):'<p class="ok">All known Pugh judgments agree with the direction of the numeric criterion comparisons.</p>'}`;
  }
  html += '<p class="method-note"><strong>Interpretation:</strong> A user-supplied screening score does not predict a property, prove design robustness, demonstrate compliance, establish an ISO 14971 risk level, or select a verified worst case. Hard gates cannot be compensated by other scores. Review criteria overlap and underlying evidence before making decisions.</p>';
  $('results-output').innerHTML = html;
}
function renderAll() {
  renderSetup(); renderAlternatives(); renderCriteria(); renderRatings(); renderPugh(); renderResults();
  document.querySelector('[data-field="assumptions"]').value = assessment().assumptions ?? '';
  document.querySelector('[data-field="conclusion"]').value = assessment().conclusion ?? '';
}
function setRating(altId, critId, value) { assessment().ratings[altId] ??= {}; assessment().ratings[altId][critId] = value === '' ? null : Number(value); }
function setPugh(altId, critId, value) { assessment().pugh[altId] ??= {}; assessment().pugh[altId][critId] = value; }
function action(button) {
  const a = assessment(), id = button.dataset.id;
  switch (button.dataset.action) {
    case 'new': if (!confirm('Start a new blank assessment? Export the current JSON first if you need a backup.')) return; file=createBlank(); inspected=null; break;
    case 'demo': if (!confirm('Replace current assessment with the synthetic example?')) return; file=createDemo(); inspected=null; break;
    case 'clone': file=structuredClone(file); file.assessment.id = newId('assessment'); file.assessment.title += ' (copy)'; break;
    case 'import': $('import-file').click(); return;
    case 'json': download(exportJson(file), filename(a.title,'json'),'application/json'); return;
    case 'csv': download(exportCsv(a), filename(a.title,'csv'),'text/csv'); return;
    case 'markdown': download(exportMarkdown(a), filename(a.title,'md'),'text/markdown'); return;
    case 'scale-preset': { const [min,max,step] = button.dataset.preset.split(',').map(Number); Object.assign(a.scale,{min,max,step}); break; }
    case 'add-alt': { const id=newId('alt'); a.alternatives.push({id,name:`Alternative ${a.alternatives.length+1}`,description:'',gate:'unknown'}); break; }
    case 'delete-alt': if (a.alternatives.length<=2) return; if (!confirm(`Remove ${getAlt(id)?.name} and its ratings/judgments?`)) return;
      a.alternatives=a.alternatives.filter(x=>x.id!==id); delete a.ratings[id]; delete a.ratingDetails[id]; delete a.pugh[id]; delete a.pughRationale[id];
      if (a.datumAlternativeId===id) { a.datumAlternativeId=a.alternatives[0].id; a.pugh={}; a.pughRationale={}; status('Datum was removed; remaining Pugh judgments were cleared.'); }
      inspected=null; break;
    case 'add-crit': a.criteria.push({id:newId('crit'),name:`Criterion ${a.criteria.length+1}`,definition:'',direction:'higher',weight:1,evidence:'not_provided',notes:''}); break;
    case 'delete-crit': if (a.criteria.length<=1) return; if (!confirm(`Remove ${getCrit(id)?.name} and all connected scores, evidence and judgments?`)) return;
      a.criteria=a.criteria.filter(x=>x.id!==id); for (const alt of a.alternatives) for (const map of [a.ratings,a.ratingDetails,a.pugh,a.pughRationale]) if (map?.[alt.id]) delete map[alt.id][id]; inspected=null; break;
    case 'up-crit': case 'down-crit': {const j=a.criteria.findIndex(x=>x.id===id), k=j+(button.dataset.action==='up-crit'?-1:1); if(k<0||k>=a.criteria.length)return; [a.criteria[j],a.criteria[k]]=[a.criteria[k],a.criteria[j]]; break;}
    case 'inspect': inspected={kind:button.dataset.kind,altId:button.dataset.altId,critId:button.dataset.critId}; renderInspector(); $('detail-editor').scrollIntoView({block:'nearest',behavior:'smooth'}); return;
    case 'close-inspector': inspected=null; renderInspector(); return;
    default: return;
  }
  update();
}
function download(content, name, type) {
  const blob = new Blob([content],{type:`${type};charset=utf-8`}); const href=URL.createObjectURL(blob);
  const el=document.createElement('a');el.href=href;el.download=name;document.body.append(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
  status(`Exported ${name}.`);
}
// Event delegation avoids per-cell listeners and supports dynamically added criteria/alternatives.
document.addEventListener('click',event=>{const button=event.target.closest('button[data-action]');if(button)action(button);});
document.addEventListener('input',event=>{
  const el=event.target,a=assessment(); if (!(el instanceof HTMLElement))return;
  if(el.dataset.field){ const path=el.dataset.field; if(path.startsWith('anchor.')){a.scale.anchors??={};a.scale.anchors[path.slice(7)]=el.value;}
    else a[path]=el.type==='checkbox'?el.checked:el.value; update(false); return; }
  if(el.dataset.scale){a.scale[el.dataset.scale]=el.value===''?null:Number(el.value);update(false);return;}
  if(el.dataset.alt){const alt=getAlt(el.dataset.alt);if(alt){alt[el.dataset.key]=el.value;update(false);}return;}
  if(el.dataset.crit){const c=getCrit(el.dataset.crit);if(c){c[el.dataset.key]=el.dataset.key==='weight'?(el.value===''?null:Number(el.value)):el.value;update(false);}return;}
  if(el.dataset.ratingAlt){setRating(el.dataset.ratingAlt,el.dataset.ratingCrit,el.value);update(false);return;}
  if(el.dataset.detail && inspected){const {altId,critId}=inspected;if(el.dataset.detail==='pughRationale'){a.pughRationale[altId]??={};a.pughRationale[altId][critId]=el.value;}
    else {a.ratingDetails[altId]??={};a.ratingDetails[altId][critId]??={};a.ratingDetails[altId][critId][el.dataset.detail]=el.value;} update(false);}
});
document.addEventListener('change',event=>{
  const el=event.target,a=assessment();if(!(el instanceof HTMLElement))return;
  if(el.dataset.datum){if(el.dataset.datum!==a.datumAlternativeId){if(!confirm('Changing datum clears all existing Pugh judgments and their rationales. Continue?')) {renderAll();return;}a.datumAlternativeId=el.dataset.datum;a.pugh={};a.pughRationale={};inspected=null;update();}return;}
  if(el.dataset.pughAlt){setPugh(el.dataset.pughAlt,el.dataset.pughCrit,el.value);update(false);return;}
  if(el.dataset.field==='mode'||el.dataset.field==='method'||el.dataset.field==='productAcknowledged'||el.dataset.field==='rankingDirection'||el.dataset.alt||el.dataset.crit||el.dataset.scale) {update();}
});
$('import-file').addEventListener('change',async event=>{
  const input=event.target,selected=input.files?.[0]; if(!selected)return;
  try { if(selected.size>5_000_000)throw Error('File too large (> 5 MB).');const raw=await selected.text();const imported=importJson(raw);
    if(!confirm('Replace current assessment with this imported JSON record?'))return;file=imported;inspected=null;update();status('Imported assessment. Scores recalculated using the local V0.1 engine.');
  } catch(err){status(err.message,true);} finally{input.value='';}
});
renderAll();
