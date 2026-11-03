import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/services/api.js';

test('history propagates server pagination and filters', async () => {
  globalThis.fetch = async url => { const parsed = new URL(url); assert.equal(parsed.searchParams.get('page'),'3'); assert.equal(parsed.searchParams.get('search'),"DDoS & scan"); assert.equal(parsed.searchParams.get('limit'),'50'); return Response.json({total:123}); };
  assert.equal((await api.getHistory(50,{page:3,search:'DDoS & scan'})).total,123);
});
test('history bounds requested page size', async () => {
  globalThis.fetch = async url => { assert.equal(new URL(url).searchParams.get('limit'),'100'); return Response.json({}); };
  await api.getHistory(1000);
});
test('prediction sends actual values as JSON', async () => {
  globalThis.fetch = async (_, options) => { assert.equal(options.method,'POST'); assert.deepEqual(JSON.parse(options.body),{features:{a:2}}); return Response.json({history_id:9}); };
  assert.equal((await api.predict({a:2})).history_id,9);
});
test('database failure is visible to callers', async () => {
  globalThis.fetch = async () => Response.json({detail:'History unavailable'},{status:503});
  await assert.rejects(api.getHistory(), {message:'History unavailable',status:503});
});
test('validation error preserves structured details', async () => {
  globalThis.fetch = async () => Response.json({detail:{message:'Feature mismatch',missing_features:['a']}},{status:422});
  await assert.rejects(api.predict({}), err => err.status===422 && err.data.detail.missing_features[0]==='a');
});
test('failed mutation is never retried against another server', async () => {
  let calls=0; globalThis.fetch = async () => { calls++; throw new TypeError('Network failed'); };
  await assert.rejects(api.predict({}),/Network failed/); assert.equal(calls,1);
});
test('explanation calls the implemented endpoint', async () => {
  globalThis.fetch = async url => { assert.equal(new URL(url).pathname,'/explain'); return Response.json({scope:'global'}); };
  assert.equal((await api.getExplanation()).scope,'global');
});
test('replay sends bounded configuration', async () => {
  globalThis.fetch = async (url,options) => { assert.equal(new URL(url).pathname,'/monitoring/start'); assert.deepEqual(JSON.parse(options.body),{limit:20,interval_seconds:1}); return Response.json({status:'running'}); };
  await api.startReplay();
});
