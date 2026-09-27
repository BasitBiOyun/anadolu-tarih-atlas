import { Storage } from '@google-cloud/storage';
import { pathToFileURL } from 'node:url';
import { Queue, db, type Claim } from './queue.ts';
import { BUCKET, PROJECT, hash, normalize } from './policy.ts';
import { Researcher } from './research.ts';
import { assess } from './quality.ts';
import { Drive } from './drive.ts';

const storage=new Storage({projectId:PROJECT});
const bucket=storage.bucket(BUCKET);
export function log(event:string,data:Record<string,any>={}) {
  console.log(JSON.stringify({severity:'INFO',service:'atlas-research-worker',event,...data,time:new Date().toISOString()}));
}
async function archive(path:string,result:any) {
  await bucket.file(path).save(JSON.stringify(result),{resumable:false,contentType:'application/json',preconditionOpts:{ifGenerationMatch:0}});
}
async function read(path:string) {const [b]=await bucket.file(path).download();return JSON.parse(b.toString('utf8'));}
export async function reconcile(queue:Queue) {
  const delivered=await queue.store.collection('research_queue').where('engine','==','research-v1').where('status','==','delivered').limit(100).get();
  for(const doc of delivered.docs) {
    const item=doc.data();
    try {
      const path=`atlas/sites/${doc.id}.json`;
      const file=bucket.file(path);
      const [exists]=await file.exists();
      if(!exists)throw new Error('STORAGE_PENDING');
      const [metadata]=await file.getMetadata();
      if(metadata.metadata?.sourceDriveFileId!==item.driveFileId)throw new Error('STORAGE_REVISION_PENDING');
      const site=await read(path);
      if(hash(site)!==item.sha256)throw new Error('STORAGE_HASH_MISMATCH');
      const index=(await queue.store.doc(`sites_index/${doc.id}`).get()).data();
      if(!index||index.storagePath!==path||index.latitude!==site.core.coordinates.latitude||index.longitude!==site.core.coordinates.longitude||index.nameTR!==site.content.tr.name||index.nameEN!==site.content.en.name||JSON.stringify(index.periodIds)!==JSON.stringify(site.core.chronology.map((c:any)=>c.periodId))||Date.parse(index.updatedAt)<Date.parse(metadata.updated!))throw new Error('INDEX_PENDING');
      await queue.store.runTransaction(async tx=>{
        const fresh=await tx.get(doc.ref);
        if(fresh.data()?.status!=='delivered'||fresh.data()?.sha256!==item.sha256)return;
        tx.update(doc.ref,{status:'published',publishedAt:Date.now()});
        if(item.quality==='needs_enrichment')tx.set(queue.store.doc(`research_enrichment/${doc.id}`),{status:'scheduled'},{merge:true});
      });
      log('published',{siteId:doc.id,sha256:item.sha256});
    }catch(e){
      log('publication_pending',{siteId:doc.id,code:(e as Error).message,stalled:Date.now()-item.deliveredAt>2*3600_000});
    }
  }
  const enrich=await queue.store.collection('research_enrichment').where('status','==','scheduled').where('nextAttemptAt','<=',Date.now()).limit(10).get();
  for(const e of enrich.docs)await queue.store.runTransaction(async tx=>{
    const task=await tx.get(queue.ref(e.id)),current=await tx.get(e.ref),d=task.data(),en=current.data();
    if(!d||d.status!=='published'||en?.status!=='scheduled'||en.nextAttemptAt>Date.now())return;
    // Enrichment uses the same globally capped queue; no second uncapped production lane.
    if(en.cycles>=3){tx.update(e.ref,{status:'needs_review'});return;}
    tx.update(task.ref,{status:'ready',taskKind:'enrichment',revision:(d.revision??0)+1,attempts:0,qualityAttempts:0,artifactPath:null,token:null});
    tx.update(e.ref,{status:'queued'});
  });
}
async function duplicateGuard(queue:Queue,claim:Claim,site:any) {
  const existing=await queue.store.doc(`sites_index/${site.id}`).get();
  if(existing.exists&&claim.taskKind!=='enrichment')throw new Error('EXISTING_PUBLISHED_ID');
  const lat=site.core.coordinates.latitude;
  const nearby=await queue.store.collection('sites_index').where('latitude','>=',lat-0.005).where('latitude','<=',lat+0.005).get();
  const names=new Set([site.content.tr.name,site.content.en.name,...site.content.tr.alternativeNames??[],...site.content.en.alternativeNames??[]].map(normalize));
  for(const d of nearby.docs) {
    if(d.id===site.id)continue;
    const other=d.data();
    if(Math.abs(other.longitude-site.core.coordinates.longitude)>0.005)continue;
    if([other.nameTR,other.nameEN,...other.alternativeNamesTR??[],...other.alternativeNamesEN??[]].filter(Boolean).some(n=>names.has(normalize(n))))throw new Error('DUPLICATE_PUBLISHED_IDENTITY');
  }
}
export async function run() {
  const queue=new Queue(db());
  if(Number(process.env.CLOUD_RUN_TASK_INDEX??0)===0){await queue.maintenance();await reconcile(queue);}
  const claim=await queue.claim();
  if(!claim){log('idle');return;}
  log('claimed',{siteId:claim.id,token:claim.token,attempt:claim.attempts});
  let leaseLost=false,renewing=false;
  const timer=setInterval(async()=>{if(renewing)return;renewing=true;try{await queue.renew(claim);}catch{leaseLost=true;}finally{renewing=false;}},60_000);
  try {
    const started=Date.now();
    const stage=async(name:string)=>{
      if(leaseLost||Date.now()-started>45*60_000)throw new Error('WORKER_DEADLINE_OR_LEASE_LOST');
      await queue.update(claim,{stage:name,status:name==='strict_validation'?'validating':'researching'});
      log('stage',{siteId:claim.id,stage:name});
    };
    let result:any;
    if(claim.artifactPath)result=await read(claim.artifactPath);
    else {
      let previous;
      if(claim.taskKind==='enrichment')previous=await read(`atlas/sites/${claim.id}.json`);
      result=await new Researcher().run(claim,stage,previous);
      const artifactPath=`atlas/research/${claim.id}/${claim.token}.json`;
      await archive(artifactPath,result);
      await queue.update(claim,{artifactPath});claim.artifactPath=artifactPath;
    }
    const decision=assess(result.site,result.evidence,result.review,claim.id);
    await queue.store.doc(`research_jobs/${claim.token}`).set({quality:decision.status,usage:result.usage,artifactPath:claim.artifactPath},{merge:true});
    if(['quarantine','retry'].includes(decision.status)) {
      // Bad draft structure or optional prose is retry/dead-letter, never core quarantine.
      await queue.update(claim,{artifactPath:null});
      await queue.fail(claim,decision.status==='quarantine'?'quality':'technical',[...decision.coreErrors,...decision.draftErrors]);
      log('quality_rejected',{siteId:claim.id,...decision});return;
    }
    await duplicateGuard(queue,claim,result.site);
    const control=(await queue.store.doc('research_control/runtime').get()).data();
    if(control?.publishEnabled!==true) {
      await queue.update(claim,{status:'pilot_ready',leaseUntil:0,quality:decision.status});
      log('pilot_ready',{siteId:claim.id,artifactPath:claim.artifactPath,...decision});return;
    }
    if(control.mode==='paused')throw new Error('PUBLISH_PAUSED');
    const drive=await Drive.create();await drive.preflight();
    const outboxRef=queue.store.doc(`research_outbox/${claim.id}-${claim.revision??0}`);
    let outbox=(await outboxRef.get()).data();
    if(!outbox) {
      const files=await drive.findByName(`${claim.id}.json`);
      if(files.length&&claim.taskKind!=='enrichment')throw new Error('DUPLICATE_DRIVE_NAME');
      const fileId=await drive.reserveId();
      outbox=await queue.fenced(claim,tx=>{
        const intent={fileId,artifactPath:claim.artifactPath,sha256:hash(result.site),createdAt:Date.now()};
        tx.create(outboxRef,intent);return intent;
      });
    }
    // A crash retry must send exactly the immutable payload associated with the reserved ID.
    if(outbox!.sha256!==hash(result.site))throw new Error('OUTBOX_PAYLOAD_CONFLICT');
    if(leaseLost)throw new Error('LEASE_LOST');
    await queue.update(claim,{status:'delivering'});
    await drive.deliver(outbox!.fileId,result.site);
    await queue.delivered(claim,outbox!.fileId,outbox!.sha256,decision.status,decision.missing);
    log('delivered',{siteId:claim.id,fileId:outbox!.fileId,quality:decision.status});
  } catch(e:any) {
    const code=(e.code?String(e.code):e.message??'UNKNOWN').slice(0,180);
    log('worker_error',{siteId:claim.id,code});
    if(!leaseLost)await queue.fail(claim,/DUPLICATE|EXISTING_PUBLISHED/.test(code)?'quality':'technical',[code]).catch(()=>{});
    process.exitCode=1;
  } finally {clearInterval(timer);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)run().catch(e=>{log('fatal',{code:e.code??e.message});process.exitCode=1;});
