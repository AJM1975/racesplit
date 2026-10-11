import test from 'node:test';
import assert from 'node:assert/strict';
import {enqueue,nextPending,markConflict,markRetry,flushQueue} from '../src/sync-queue.mjs';
test('deduplicates idempotent queue entries',()=>{const a=enqueue([], {id:'race-1'});assert.equal(enqueue(a,{id:'race-1'}).length,1)});
test('conflicts stay queued and blocked',async()=>{const q=await flushQueue(enqueue([],{id:'race-1'}),async()=>({status:409,revision:3}));assert.equal(q.length,1);assert.equal(q[0].serverRevision,3);assert.equal(nextPending(q),null)});
test('auth failure keeps pending data untouched',async()=>{const q=enqueue([],{id:'race-1'});assert.deepEqual(await flushQueue(q,async()=>({status:401})),q)});
test('successful upload removes item',async()=>{const q=enqueue([],{id:'race-1'});assert.deepEqual(await flushQueue(q,async()=>({ok:true,status:200})),[])});
test('network errors retry with backoff',async()=>{const q=await flushQueue(enqueue([],{id:'race-1'}),async()=>{throw Error('offline')},0);assert.equal(q[0].attempts,1);assert.equal(nextPending(q,0),null);assert.ok(nextPending(q,999999))});
test('backoff is capped at an hour',()=>{let q=enqueue([],{id:'race-1'});for(let i=0;i<30;i++)q=markRetry(q,'race-1',0);assert.equal(Date.parse(q[0].retryAt),3600000)});
test('invalid uploads block without retrying forever or stopping other races', async () => {
 const queue=await flushQueue([{id:'bad'},{id:'good'}],async item=>item.id==='bad'?{status:400,error:'Invalid race'}:{status:200,ok:true});
 assert.equal(queue.length,1);assert.equal(queue[0].blocked,'invalid-request');
});
