import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Queue, db } from './queue.ts';
import { prepare, hash, DATABASE } from './policy.ts';
import { structural } from './quality.ts';
import { Drive } from './drive.ts';

async function cli() {
  const [command,file]=process.argv.slice(2);
  if(command==='audit') {
    const dir=resolve(file??'reference');
    const report=readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>{
      const site=JSON.parse(readFileSync(join(dir,f),'utf8'));
      return {id:site.id,sha256:hash(site),bytes:Buffer.byteLength(JSON.stringify(site)),sources:site.core?.sources?.length??0,structuralErrors:structural(site),provenance:'Reference only; source claims have NOT been reverified'};
    });
    console.log(JSON.stringify({database:DATABASE,report},null,2));return;
  }
  if(command==='preflight-drive'){console.log(await (await Drive.create()).preflight());return;}
  const queue=new Queue(db());
  if(command==='seed') {
    if(!file)throw new Error('Provide seed JSON path');
    const seeds=JSON.parse(readFileSync(file,'utf8'));if(!Array.isArray(seeds))throw new Error('Seed must be array');
    seeds.forEach(prepare); // Validate all entries before the first write.
    let created=0,duplicate=0;
    for(const seed of seeds){const result=await queue.enqueue(seed);result.created?created++:duplicate++;}
    console.log(JSON.stringify({created,duplicate,total:seeds.length}));return;
  }
  if(command==='register-existing') {
    const snapshots=await queue.store.collection('sites_index').get();
    for(const snap of snapshots.docs) {
      const s=snap.data();
      const names=[s.nameTR,s.nameEN,...s.alternativeNamesTR??[],...s.alternativeNamesEN??[]].filter(Boolean);
      if(!names.length||!s.province)continue;
      const seed=prepare({id:snap.id,name:names[0],province:s.province,earliestPeriod:s.periodIds?.[0]??'ottoman',aliases:names.slice(1)});
      await queue.store.runTransaction(async tx=>{
        const refs=seed.identityKeys.map(k=>queue.store.doc(`research_identities/${k}`));
        const existing=await tx.getAll(...refs);
        existing.forEach((d,i)=>{if(!d.exists)tx.create(refs[i],{siteId:snap.id,existing:true});});
      });
    }
    console.log(JSON.stringify({registered:snapshots.size}));return;
  }
  if(command==='pilot') {
    if(!file)throw new Error('Provide pilot site ID');
    const item=await queue.ref(file).get();if(!item.exists)throw new Error('Seed first');
    await queue.store.doc('research_control/runtime').set({mode:'pilot',pilotIds:[file],hourlyLimit:1,publishEnabled:false,qualityApproved:false});
    console.log('Pilot configured: 1 attempt/hour, publication disabled.');return;
  }
  if(command==='publish-pilot') {
    if(!file)throw new Error('Provide pilot site ID');
    await (await Drive.create()).preflight();
    await queue.store.runTransaction(async tx=>{
      const doc=await tx.get(queue.ref(file));
      if(doc.data()?.status!=='pilot_ready'||!doc.data()?.artifactPath)throw new Error('No validated pilot artifact');
      tx.update(doc.ref,{status:'ready'});
      tx.set(queue.store.doc('research_control/runtime'),{mode:'pilot',pilotIds:[file],hourlyLimit:1,publishEnabled:true,qualityApproved:false});
    });
    console.log('Validated pilot released for delivery at next eligible hourly slot.');return;
  }
  if(command==='pause') {await queue.store.doc('research_control/runtime').set({mode:'paused',publishEnabled:false},{merge:true});console.log('Paused.');return;}
  if(command==='activate') {
    if(!file)throw new Error('Provide acceptance JSON with pilotIds and reviewedHashes');
    const acceptance=JSON.parse(readFileSync(file,'utf8'));
    if(!acceptance.pilotIds?.length||acceptance.qualityReviewed!==true)throw new Error('Pilot quality review required');
    for(const id of acceptance.pilotIds) {
      const item=(await queue.ref(id).get()).data();
      if(item?.status!=='published'||item.sha256!==acceptance.reviewedHashes?.[id])throw new Error('Pilot must be published and match reviewed hash');
    }
    await (await Drive.create()).preflight();
    await queue.store.doc('research_control/acceptance').set({...acceptance,acceptedAt:Date.now()});
    await queue.store.doc('research_control/runtime').set({mode:'production',publishEnabled:true,qualityApproved:true,hourlyLimit:10});
    console.log('Production enabled, maximum 10 global claims/hour.');return;
  }
  if(command==='status') {
    const collections=['research_queue','research_quarantine','research_dead_letter','research_enrichment'];
    for(const collection of collections)console.log(JSON.stringify({collection,count:(await queue.store.collection(collection).count().get()).data().count}));
    console.log(JSON.stringify({control:(await queue.store.doc('research_control/runtime').get()).data()}));return;
  }
  if(command==='export-pilot') {
    if(!file)throw new Error('Provide pilot ID');
    const item=(await queue.ref(file).get()).data();if(!item?.artifactPath)throw new Error('No artifact');
    const {Storage}=await import('@google-cloud/storage');
    const {BUCKET,PROJECT}=await import('./policy.ts');
    const [bytes]=await new Storage({projectId:PROJECT}).bucket(BUCKET).file(item.artifactPath).download();
    const result=JSON.parse(bytes.toString('utf8'));mkdirSync('out',{recursive:true});
    writeFileSync(`out/${file}.json`,JSON.stringify(result.site,null,2));
    writeFileSync(`out/${file}-report.json`,JSON.stringify({decision:result.decision,usage:result.usage,review:result.review,retrievalErrors:result.retrievalErrors},null,2));
    console.log(`Wrote out/${file}.json and quality report; nothing published.`);return;
  }
  throw new Error('Commands: audit, seed, register-existing, preflight-drive, pilot, publish-pilot, pause, status, export-pilot');
}
cli().catch(e=>{console.error(e.code??e.message);process.exitCode=1;});
