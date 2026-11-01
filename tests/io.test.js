import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo } from '../src/demo.js';
import { exportJson, importJson, exportMarkdown, exportCsv, filename } from '../src/io.js';
import { runAssessment } from '../src/engine.js';

test('T16: JSON export/import preserves source scores and reproducible results',()=>{
  const file=createDemo(), json=exportJson(file), restored=importJson(json);
  assert.deepEqual(restored.assessment,file.assessment);
  assert.deepEqual(runAssessment(restored.assessment).rows,runAssessment(file.assessment).rows);
});
test('Schema validation rejects incompatible future files',()=>{
  const data=createDemo();data.schemaVersion='2.0.0';
  assert.throws(()=>importJson(JSON.stringify(data)),/schemaVersion/);
});
test('Corrupt maps, duplicate IDs, and incomplete alternative lists are rejected on import',()=>{
  const file=createDemo();file.assessment.alternatives[1].id=file.assessment.alternatives[0].id;
  assert.throws(()=>importJson(JSON.stringify(file)),/Duplicate IDs/);
  file.assessment.alternatives=[file.assessment.alternatives[0]];
  assert.throws(()=>importJson(JSON.stringify(file)),/Duplicate IDs|at least 2 alternatives/);
});
test('CSV and Markdown exports include inputs, rationale, caveats and output',()=>{
  const file=createDemo(),a=file.assessment;
  a.ratingDetails['alt-pet']={c1:{rationale:'Synthetic trial',evidenceStatus:'assumption',source:'Public demonstration'}};
  const csv=exportCsv(a),md=exportMarkdown(a);
  assert.match(csv,/"Synthetic trial"/);assert.match(csv,/"Assigned permeation tendency"/);
  assert.match(md,/0\.66/);assert.match(md,/Synthetic trial/);assert.match(md,/not a validated physical model/);
});
test('Spreadsheet formula injection is escaped in CSV exports',()=>{
  const a=createDemo().assessment;a.alternatives[0].name='=HYPERLINK("http://bad")';
  const csv=exportCsv(a);assert.ok(csv.includes("'=HYPERLINK"));
});
test('Import permits incomplete drafts but does not create missing score values',()=>{
  const file=createDemo();delete file.assessment.ratings['alt-pet'].c1;
  const imported=importJson(exportJson(file));assert.equal(imported.assessment.ratings['alt-pet'].c1,undefined);
  assert.equal(runAssessment(imported.assessment).numericReady,false);
});
test('Filename contains only portable safe characters',()=>{
  assert.equal(filename('A/B: PET #1?','json'),'a-b-pet-1-0.1.0.json');
});

test('Imported ID map keys reject prototype-manipulation names',()=>{
  const file=createDemo();file.assessment.criteria[0].id='__proto__';
  assert.throws(()=>importJson(JSON.stringify(file)),/unsafe criterion ID/);
});
