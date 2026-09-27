import { Firestore, FieldValue } from '@google-cloud/firestore';
import { randomUUID } from 'node:crypto';
import { DATABASE, PROJECT, HOUR_LIMIT, LEASE_MS, MAX_ATTEMPTS, prepare, nextRetry, terminalFailure, type Seed } from './policy.ts';

export const db = () => new Firestore({projectId: PROJECT, databaseId: DATABASE});
export type Claim = ReturnType<typeof prepare> & {token: string; attempts: number; qualityAttempts: number; taskKind: string; [key:string]: any};
export class Queue {
  constructor(public store: Firestore) {}
  ref(id: string) { return this.store.collection('research_queue').doc(id); }
  async enqueue(seed: Seed) {
    const item = prepare(seed);
    return this.store.runTransaction(async tx => {
      const refs = item.identityKeys.map(k=>this.store.doc(`research_identities/${k}`));
      const docs = await tx.getAll(this.ref(item.id), this.store.doc(`sites_index/${item.id}`), ...refs);
      if (docs.some(d=>d.exists)) return {created: false, id: item.id};
      // 'ready' isolates this queue from the old app's /claim endpoint (which selects 'pending').
      tx.create(this.ref(item.id), {...item, engine:'research-v1', status:'ready', attempts:0, qualityAttempts:0, taskKind:'research', createdAt:Date.now()});
      refs.forEach(r=>tx.create(r,{siteId:item.id}));
      return {created:true, id:item.id};
    });
  }
  async claim(now = Date.now()): Promise<Claim|null> {
    const token = randomUUID();
    const hour = String(Math.floor(now/3600_000));
    const quota = this.store.doc(`research_hours/${hour}`);
    return this.store.runTransaction(async tx => {
      const control = (await tx.get(this.store.doc('research_control/runtime'))).data();
      if (!control || !['pilot','production'].includes(control.mode)) return null;
      if (control.mode === 'production' && control.qualityApproved !== true) return null;
      const limit = control.mode === 'pilot' ? 1 : Math.min(HOUR_LIMIT, Math.max(1, Number(control.hourlyLimit)||HOUR_LIMIT));
      const hourDoc = await tx.get(quota);
      if ((hourDoc.data()?.claimed ?? 0) >= limit) return null;
      const capacityRef=this.store.doc('research_control/capacity');
      const capacity=(await tx.get(capacityRef)).data()?.slots??{};
      const slot=Array.from({length:HOUR_LIMIT},(_,i)=>String(i)).find(k=>!capacity[k]||capacity[k].until<=now);
      if(slot===undefined)return null;
      let query = this.store.collection('research_queue').where('engine','==','research-v1').where('status','==','ready');
      if (control.mode === 'pilot') {
        if (!Array.isArray(control.pilotIds) || !control.pilotIds.length) return null;
        query = query.where('id','in',control.pilotIds.slice(0,10));
      }
      const candidates = await tx.get(query.orderBy('periodRank').orderBy('earliestYear').orderBy('importance').orderBy('id').limit(1));
      if (candidates.empty) return null;
      const doc = candidates.docs[0], item = doc.data();
      if (item.attempts >= MAX_ATTEMPTS) { tx.update(doc.ref,{status:'dead_letter'}); return null; }
      const claim = {...item, token, slot, attempts:item.attempts+1, claimedAt:now, leaseUntil:now+LEASE_MS, status:'researching'};
      tx.update(doc.ref,claim);
      tx.set(capacityRef,{slots:{...capacity,[slot]:{token,until:now+LEASE_MS}}});
      tx.set(quota,{claimed:(hourDoc.data()?.claimed??0)+1, updatedAt:now});
      tx.create(this.store.doc(`research_jobs/${token}`),{siteId:doc.id, status:'researching', startedAt:now, attempt:claim.attempts});
      return claim as unknown as Claim;
    });
  }
  async fenced<T>(claim: Claim, action: (tx: any, data:any)=>T, now=Date.now()): Promise<T> {
    return this.store.runTransaction(async tx => {
      const doc = await tx.get(this.ref(claim.id));
      const data = doc.data();
      const capacityRef=this.store.doc('research_control/capacity');
      const slots=(await tx.get(capacityRef)).data()?.slots??{};
      if (!data || data.token!==claim.token || data.leaseUntil<=now || !['researching','validating','delivering'].includes(data.status)) throw new Error('LEASE_LOST');
      if(slots[data.slot]?.token!==claim.token||slots[data.slot]?.until<=now)throw new Error('CAPACITY_LEASE_LOST');
      const result=action(tx,data);
      // All fenced operations extend the global capacity lease too; terminal tasks occupy
      // their slot for at most one lease period, keeping overlap conservatively bounded.
      tx.set(capacityRef,{slots:{...slots,[data.slot]:{token:claim.token,until:now+LEASE_MS}}});
      return result;
    });
  }
  async renew(claim: Claim) {
    await this.fenced(claim,tx=>tx.update(this.ref(claim.id),{leaseUntil:Date.now()+LEASE_MS}));
  }
  async update(claim: Claim, patch: Record<string,any>) {
    await this.fenced(claim,tx=>tx.update(this.ref(claim.id),{...patch,updatedAt:Date.now()}));
  }
  async fail(claim: Claim, kind: 'quality'|'technical', codes: string[]) {
    await this.fenced(claim,(tx,data)=>{
      const qualityAttempts=(data.qualityAttempts??0)+(kind==='quality'?1:0);
      const status=terminalFailure(data.attempts,kind,qualityAttempts);
      tx.update(this.ref(claim.id),{status,qualityAttempts,lastError:codes.slice(0,30),nextAttemptAt:nextRetry(data.attempts,Date.now()),leaseUntil:0});
      tx.set(this.store.doc(`research_jobs/${claim.token}`),{status,kind,codes:codes.slice(0,30),finishedAt:Date.now()},{merge:true});
      if (['quarantine','dead_letter'].includes(status)) tx.set(this.store.doc(`research_${status}/${claim.id}`),{siteId:claim.id,kind,codes:codes.slice(0,30),attempts:data.attempts,updatedAt:Date.now()});
    });
  }
  async delivered(claim: Claim, fileId:string, sha256:string, quality:string, missing:string[]) {
    await this.fenced(claim,tx=>{
      tx.update(this.ref(claim.id),{status:'delivered',driveFileId:fileId,sha256,quality,deliveredAt:Date.now(),leaseUntil:0});
      tx.set(this.store.doc(`research_jobs/${claim.token}`),{status:'delivered',quality,sha256,finishedAt:Date.now()},{merge:true});
      if (quality==='needs_enrichment') tx.set(this.store.doc(`research_enrichment/${claim.id}`),{siteId:claim.id,status:'waiting_publication',missing,nextAttemptAt:Date.now()+7*86400_000,cycles:FieldValue.increment(1)},{merge:true});
      else tx.set(this.store.doc(`research_enrichment/${claim.id}`),{siteId:claim.id,status:'complete',updatedAt:Date.now()},{merge:true});
    });
  }
  async maintenance(now=Date.now()) {
    // Bounded queries. Expired workers are fenced before their item can be reclaimed.
    const deferred=await this.store.collection('research_queue').where('engine','==','research-v1').where('status','==','deferred').where('nextAttemptAt','<=',now).limit(100).get();
    const expired=await this.store.collection('research_queue').where('engine','==','research-v1').where('status','in',['researching','validating','delivering']).where('leaseUntil','<=',now).limit(100).get();
    for (const snapshot of [...deferred.docs,...expired.docs]) await this.store.runTransaction(async tx=>{
      const doc=await tx.get(snapshot.ref), d=doc.data();
      if (!d || (d.status==='deferred' ? d.nextAttemptAt>now : !['researching','validating','delivering'].includes(d.status)||d.leaseUntil>now)) return;
      const exhausted=d.attempts>=MAX_ATTEMPTS;
      tx.update(doc.ref,{status:exhausted?'dead_letter':'ready',token:null,leaseUntil:0,updatedAt:now});
      if (exhausted) tx.set(this.store.doc(`research_dead_letter/${doc.id}`),{siteId:doc.id,kind:'lease_expired',updatedAt:now});
    });
  }
}
