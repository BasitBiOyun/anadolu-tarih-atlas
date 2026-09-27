import test from 'node:test';
import assert from 'node:assert/strict';
import { Queue } from '../src/queue.ts';
import { prepare } from '../src/policy.ts';

// Transaction retry regression: the SDK can invoke a callback more than once.
// This mock intentionally replays the callback; the real emulator suite separately
// exercises Firestore locks. No side effects may escape a discarded callback.
test('claim returns only committed attempt and never accumulates callback results',async()=>{
  const item={...prepare({id:'ancient-site',name:'Ancient',province:'Konya',earliestPeriod:'early_pleistocene'}),engine:'research-v1',status:'ready',attempts:0};
  const docRef={id:'ancient-site'};
  const chain:any={where:()=>chain,orderBy:()=>chain,limit:()=>chain};
  const store:any={collection:()=>chain,doc:(path:string)=>({path}),runTransaction:async(callback:any)=>{
    const tx={get:async(ref:any)=>{
      if(ref===chain)return {empty:false,docs:[{id:'ancient-site',ref:docRef,data:()=>item}]};
      if(ref.path==='research_control/runtime')return {data:()=>({mode:'production',qualityApproved:true,hourlyLimit:10})};
      return {data:()=>undefined};
    },update:()=>{},set:()=>{},create:()=>{}};
    const discarded=await callback(tx);
    const committed=await callback(tx);
    assert.equal(discarded.id,committed.id);
    return committed;
  }};
  const result=await new Queue(store).claim();
  assert.equal(result?.id,'ancient-site');assert.equal(result?.attempts,1);
});
