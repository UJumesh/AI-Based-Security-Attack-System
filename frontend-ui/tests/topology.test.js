import test from 'node:test';
import assert from 'node:assert/strict';
import {topologyMetrics, displayCount} from '../src/data/topologyMetrics.js';
test('circle counters use all database rows rather than the loaded history page', () => {
  const data=topologyMetrics({total:23,benign:12,attacks:11},{model_loaded:true,expected_features:70});
  assert.equal(data.ingress.value,23); assert.equal(data.model.value,23); assert.equal(data.database.value,23);
  assert.equal(data.extractor.value,70); assert.equal(data.workloads.value,12); assert.equal(data.quarantine.value,11);
});
test('missing services show unavailable instead of invented zeroes',()=>{
  const data=topologyMetrics(null,{model_loaded:false,expected_features:0});
  for (const node of Object.values(data)) assert.equal(node.value,null);
});
test('a connected empty database displays actual zeroes',()=>{
  const data=topologyMetrics({total:0,benign:0,attacks:0},null); assert.equal(data.database.value,0); assert.equal(displayCount(0),'0');
});
test('invalid count inputs cannot become misleading counters',()=>{
  const data=topologyMetrics({total:-1,benign:'12',attacks:NaN},null);
  assert.equal(data.database.value,null); assert.equal(data.workloads.value,null); assert.equal(data.quarantine.value,null);
});
test('large counts fit inside the circle and missing values stay explicit',()=>{
  assert.equal(displayCount(504160),'504.2K'); assert.equal(displayCount(null),'—');
});
