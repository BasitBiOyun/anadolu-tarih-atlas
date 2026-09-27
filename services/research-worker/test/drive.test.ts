import test from 'node:test';
import assert from 'node:assert/strict';
import { Drive } from '../src/drive.ts';

test('My Drive service-account path fails before generating a file',async()=>{
  const d=new Drive({});
  d.request=async()=>new Response(JSON.stringify({id:'folder',mimeType:'application/vnd.google-apps.folder',capabilities:{canAddChildren:true}}));
  await assert.rejects(d.preflight(),/MY_DRIVE_REQUIRES_USER_OAUTH/);
});
test('ambiguous create retried with reserved ID checks actual bytes on 409',async()=>{
  const d=new Drive({});let writes=0,reads=0;
  const site={id:'test',schemaVersion:4};
  d.request=async(path,init)=>{
    if(init?.method==='POST'){writes++;const e:any=new Error('conflict');e.status=409;throw e;}
    assert.ok(path.includes('stable-id'));reads++;return new Response(JSON.stringify(site));
  };
  await d.deliver('stable-id',site);assert.equal(writes,1);assert.equal(reads,1);
});
test('Drive readback mismatch cannot be acknowledged as delivered',async()=>{
  const d=new Drive({});d.request=async(_path,init)=>new Response(JSON.stringify(init?.method==='POST'?{id:'stable-id'}:{id:'different'}));
  await assert.rejects(d.deliver('stable-id',{id:'test'}),/DRIVE_READBACK_MISMATCH/);
});
