import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo, createBlank } from '../src/demo.js';
import { align, aggregate, normalizedWeights, isValidScale, isValidRating, profile, runAssessment, validateAssessment, validateShape } from '../src/engine.js';
const example = () => structuredClone(createDemo().assessment);
const approx = (actual, expected, tol=1e-10) => assert.ok(Math.abs(actual-expected)<tol, `${actual} ≠ ${expected}`);

// Charter verification IDs T01–T20, plus additional safety and consistency cases.
test('T01: two alternatives and one criterion can be ranked',()=>{
  const a=createBlank().assessment;a.objective='Rank challenge';a.ratings[a.alternatives[0].id]={[a.criteria[0].id]:1};a.ratings[a.alternatives[1].id]={[a.criteria[0].id]:3};
  const r=runAssessment(a);assert.equal(r.numericReady,true);assert.deepEqual(r.rows.map(x=>x.rank),[2,1]);
});
test('T02: reversed 0–5 rating 1 vs 4 maps to 0.8 vs 0.2',()=>{
  approx(align(1,{min:0,max:5,step:1},'lower'),.8);approx(align(4,{min:0,max:5,step:1},'lower'),.2);
});
test('T03: 1–3 custom scale maps midpoint 2 to 0.5',()=>approx(align(2,{min:1,max:3,step:1},'higher'),.5));
test('T04: synthetic weighted calculation returns HDPE=2.40, PET=3.30, normalized .48/.66',()=>{
  const r=runAssessment(example());assert.equal(r.numericReady,true);approx(r.rows[0].score,.48);approx(r.rows[1].score,.66);
  approx(r.rows[0].originalScaleScore,2.4);approx(r.rows[1].originalScaleScore,3.3);
});
test('T05: equal positive weights produce arithmetic mean',()=>{
  const values=[.1,.6,1];const c=values.map(()=>({weight:7}));
  approx(aggregate(values,c,'mean',{min:0,max:5}).score,aggregate(values,c,'weighted_mean',{min:0,max:5}).score);
});
test('T06: all-zero weights prohibit weighted ranking',()=>{
  const a=example();a.criteria.forEach(c=>c.weight=0);const r=runAssessment(a);
  assert.equal(r.numericReady,false);assert.match(r.errors.join(' '),/positive weight/i);
});
test('T07: missing rating prohibits official numeric ranking',()=>{
  const a=example();a.ratings['alt-pet'].c2=null;const r=runAssessment(a);
  assert.equal(r.numericReady,false);assert.equal(r.rows.length,0);assert.match(r.errors.join(' '),/Missing rating/);
});
test('T08: out-of-range and off-step ratings are not accepted',()=>{
  assert.equal(isValidRating(6,{min:0,max:5,step:1}),false);
  assert.equal(isValidRating(3,{min:0,max:6,step:2}),false);
  assert.equal(isValidRating(4,{min:0,max:6,step:2}),true);
  const a=example();a.ratings['alt-pet'].c1=6;assert.equal(runAssessment(a).numericReady,false);
});
test('T09: zero collapses product with warning',()=>{
  const a=example();a.method='raw_product';a.productAcknowledged=true;a.ratings['alt-hdpe'].c1=0;
  const r=runAssessment(a);assert.equal(r.numericReady,true);assert.equal(r.rows[0].score,0);assert.match(r.warnings.join(' '),/zero-collapse/i);
});
test('T10: mean vs product reverse ranking for A=[5,5,1], B=[3,3,3] on 1–5',()=>{
  const a=example();a.scale={min:1,max:5,step:1};a.criteria.forEach(c=>{c.direction='higher';c.weight=1;});
  a.ratings['alt-hdpe']={c1:5,c2:5,c3:1};a.ratings['alt-pet']={c1:3,c2:3,c3:3};a.method='mean';
  assert.deepEqual(runAssessment(a).rows.map(x=>x.rank),[1,2]);a.method='raw_product';a.productAcknowledged=true;
  const r=runAssessment(a);assert.deepEqual(r.rows.map(x=>x.rank),[2,1]);approx(r.rows[0].score,25);approx(r.rows[1].score,27);
});
test('T11: manual Pugh [more,more,less] profile is +2/S0/−1/?0',()=>{
  const p=runAssessment(example()).pugh.find(x=>x.id==='alt-pet').profile;
  assert.deepEqual(p,{plus:2,same:0,minus:1,unknown:0,net:1});
});
test('T12: numeric vs manual Pugh mismatch is flagged without alteration',()=>{
  const a=example();a.pugh['alt-pet'].c1='same';const r=runAssessment(a);
  const f=r.hybridFlags.find(x=>x.altId==='alt-pet'&&x.criterionId==='c1');
  assert.equal(f.state,'review_needed');assert.equal(f.manual,'same');assert.equal(f.inferred,'more');assert.equal(a.pugh['alt-pet'].c1,'same');
});
test('T13: failed gate excluded but retained and scored',()=>{
  const a=example();a.alternatives[1].gate='fail';const r=runAssessment(a);
  assert.equal(r.rows.length,2);assert.equal(r.rows[1].rank,null);assert.equal(r.rows[1].excluded,true);assert.equal(r.rows[0].rank,1);
});
test('T14: identical normalized outcomes share tied rank',()=>{
  const a=example();a.ratings['alt-pet']={...a.ratings['alt-hdpe']};const r=runAssessment(a);
  assert.deepEqual(r.rows.map(x=>x.rank),[1,1]);
});
test('T15: changing datum requires Pugh judgments to be regenerated in UI',()=>{
  const a=example();a.datumAlternativeId='alt-pet';a.pugh={};const r=runAssessment(a);
  assert.equal(r.pugh.find(x=>x.id==='alt-pet').isDatum,true);
  assert.equal(r.pugh.find(x=>x.id==='alt-hdpe').profile.unknown,3);
});
test('T17: 100x100 numeric assessment calculates without nonfinite results',()=>{
  const a=example();a.mode='numeric';a.method='mean';a.criteria=Array.from({length:100},(_,j)=>({id:`c${j}`,name:`Criterion ${j}`,definition:'test',direction:'higher',weight:1,evidence:'assumption'}));
  a.alternatives=Array.from({length:100},(_,i)=>({id:`a${i}`,name:`Alt ${i}`,gate:'pass'}));
  a.ratings=Object.fromEntries(a.alternatives.map(alt=>[alt.id,Object.fromEntries(a.criteria.map((c,j)=>[c.id,j%6]))]));
  const r=runAssessment(a);assert.equal(r.numericReady,true);assert.equal(r.rows.length,100);
});
test('T18: Pugh-only produces no fabricated numeric ranking',()=>{
  const a=example();a.mode='pugh';a.ratings={};const r=runAssessment(a);
  assert.equal(r.numericReady,false);assert.equal(r.pughReady,true);assert.deepEqual(r.rows,[]);
});
test('T19: reverse displayed rank changes no input data or Pugh signs',()=>{
  const a=example();const orig=structuredClone(a.ratings);const signs=structuredClone(a.pugh);
  a.rankingDirection='least_aggressive';const r=runAssessment(a);assert.deepEqual(r.rows.map(x=>x.rank),[1,2]);
  assert.deepEqual(a.ratings,orig);assert.deepEqual(a.pugh,signs);
});
test('T20: product acknowledgement is required',()=>{
  const a=example();a.method='raw_product';a.productAcknowledged=false;
  assert.equal(runAssessment(a).numericReady,false);assert.match(validateAssessment(a).errors.join(' '),/Acknowledge/i);
});
test('Scale specification requires integral points and nonnegative minimum',()=>{
  assert.equal(isValidScale({min:0,max:5,step:2}),false);
  assert.equal(isValidScale({min:-1,max:5,step:1}),false);
  assert.equal(isValidScale({min:1,max:5,step:2}),true);
});
test('Criterion direction reversal consistently changes challenge ranking',()=>{
  const a=example();a.mode='numeric';a.method='mean';a.criteria=a.criteria.slice(0,1);
  a.ratings['alt-hdpe']={c1:1};a.ratings['alt-pet']={c1:4};
  assert.deepEqual(runAssessment(a).rows.map(x=>x.rank),[2,1]);a.criteria[0].direction='lower';
  assert.deepEqual(runAssessment(a).rows.map(x=>x.rank),[1,2]);
});
test('Normalized weights reflect 50/30/20 split',()=>{
  const alpha=normalizedWeights(example().criteria);approx(alpha[0],.5);approx(alpha[1],.3);approx(alpha[2],.2);
});
test('Engine rejects unsupported mode, method, duplicate IDs and malformed schema',()=>{
  const a=example();a.mode='invalid';a.method='nonsense';a.alternatives[1].id=a.alternatives[0].id;
  assert.equal(validateAssessment(a).errors.length>=3,true);
  assert.equal(validateShape({schemaVersion:'99.0.0',assessment:{}}).length>0,true);
});
test('Unknown gates are provisional; unknown Pugh cannot silently become same',()=>{
  const a=example();delete a.pugh['alt-pet'].c1;const r=runAssessment(a);
  assert.equal(r.rows[0].provisional,true);assert.equal(r.pugh[1].profile.unknown,1);
  assert.equal(r.hybridFlags.find(x=>x.criterionId==='c1').state,'unknown');
});
test('Pure engine calculations do not mutate input assessment',()=>{
  const a=example();const before=structuredClone(a);runAssessment(a);assert.deepEqual(a,before);
});
test('Product overflow is an explicit calculation error, not Infinity rank',()=>{
  const a=example();a.mode='numeric';a.method='raw_product';a.productAcknowledged=true;
  a.scale={min:0,max:1000000,step:1};a.criteria=Array.from({length:100},(_,i)=>({id:`x${i}`,name:`X${i}`,weight:1,direction:'higher',definition:'test'}));
  a.ratings=Object.fromEntries(a.alternatives.map(alt=>[alt.id,Object.fromEntries(a.criteria.map(c=>[c.id,1000000]))]));
  const r=runAssessment(a);assert.equal(r.numericReady,false);assert.match(r.errors.join(' '),/overflow/i);
});
test('Pugh profile always preserves unknown category',()=>assert.deepEqual(profile(['more','same','less','unknown']),{plus:1,same:1,minus:1,unknown:1,net:0}));
