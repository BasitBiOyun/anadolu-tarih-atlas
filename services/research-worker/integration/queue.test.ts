import test from 'node:test';
import assert from 'node:assert/strict';
import { Firestore } from '@google-cloud/firestore';
import { Queue } from '../src/queue.ts';
import { DATABASE, prepare, LEASE_MS } from '../src/policy.ts';

if(!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST??''))throw new Error('LOCAL_EMULATOR_REQUIRED');
const store=new Firestore({projectId:'demo-atlas-research',databaseId:DATABASE});
const queue=new Queue(store);
test('5001 records: concurrent claims, oldest-first, global hourly quota, capacity, fencing and recovery',async()=>{
  const writer=store.bulkWriter();
  for(let i=0;i<5001;i++) {
    const id=`seed-${String(i).padStart(5,'0')}`;
    const seed=prepare({id,name:id,province:'Test',earliestPeriod:i<12?'early_pleistocene':'roman'});
    writer.set(queue.ref(id),{...seed,engine:'research-v1',status:'ready',attempts:0,qualityAttempts:0,taskKind:'research'});
  }
  await writer.close();
  await store.doc('research_control/runtime').set({mode:'production',qualityApproved:true,hourlyLimit:10});
  const now=Date.now();
  const settled=await Promise.allSettled(Array.from({length:24},()=>queue.claim(now)));
  const claims=settled.flatMap(r=>r.status==='fulfilled'&&r.value?[r.value]:[]);
  assert.equal(claims.length,10,JSON.stringify(settled.filter(r=>r.status==='rejected')));
  assert.equal(new Set(claims.map(c=>c.id)).size,10);
  assert.ok(claims.every(c=>c.earliestPeriod==='early_pleistocene'));
  assert.equal(await queue.claim(now),null);
  await assert.rejects(queue.update({...claims[0],token:'stale'},{status:'delivered'}),/LEASE_LOST/);
  await queue.update(claims[0],{status:'validating'});
  await assert.rejects(queue.fenced(claims[0],()=>{},now+LEASE_MS+1),/LEASE_LOST/);
  await queue.maintenance(now+LEASE_MS+2);
  assert.equal((await queue.ref(claims[0].id).get()).data()?.status,'ready');
  assert.equal(await queue.claim(now),null,'same-hour quota survives lease recovery');
  const later=await queue.claim(now+3600_000);
  assert.ok(later);assert.equal(later!.attempts,2);
});
test('duplicate name aliases and published IDs are rejected atomically',async()=>{
  const base={name:'Çayönü',province:'Diyarbakır',earliestPeriod:'neolithic'};
  const results=await Promise.all([queue.enqueue({...base,id:'alias-one'}),queue.enqueue({...base,id:'alias-two'})]);
  assert.equal(results.filter(r=>r.created).length,1);
  await store.doc('sites_index/existing').set({nameTR:'Existing'});
  assert.equal((await queue.enqueue({...base,id:'existing',name:'Different'})).created,false);
});
test.after(async()=>{await store.terminate();});
