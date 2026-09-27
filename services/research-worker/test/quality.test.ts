import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { assess, factualLeaves, structural, type Evidence, type Review } from '../src/quality.ts';
import { hash, prepare, terminalFailure, nextRetry } from '../src/policy.ts';
import { allowedUrl,publicAddress } from '../src/retrieve.ts';
import { validateSiteJson } from '../../../src/validation/siteValidator.ts';

const reference=()=>JSON.parse(readFileSync(new URL('../reference/cayonu-tepesi.json',import.meta.url),'utf8'));
// Synthetic verifier fixtures exercise gate control flow; they are NOT archaeological verification.
function fixture() {
  const site=reference();site.core.images=[];
  const evidence:Evidence[]=site.core.sources.map((s:any)=>({id:s.id,url:s.url,title:s.title,text:'Synthetic evidence for gate testing only. '.repeat(10),sha256:hash('Synthetic evidence for gate testing only. '.repeat(10)),fetchedAt:new Date().toISOString(),trusted:true}));
  const review:Review={documentHash:hash(site),identityConsistent:true,coordinatePrecisionJustified:true,chronologyConsistent:true,translationEquivalent:true,checks:factualLeaves(site).map(l=>({path:l.path,verdict:'supported',sourceIds:[evidence[0].id],quotes:[{sourceId:evidence[0].id,quote:'Synthetic evidence for gate testing only.'}]}))};
  return {site,evidence,review};
}
test('all 10 reference files retain compatibility with original structural validator',()=>{
  const names=readdirSync(new URL('../reference/',import.meta.url)).filter(f=>f.endsWith('.json'));
  assert.equal(names.length,10);
  for(const name of names){const s=JSON.parse(readFileSync(new URL('../reference/'+name,import.meta.url),'utf8'));assert.deepEqual(validateSiteJson(s).errors,[],name);}
});
test('missing images/visit remain eligible for enrichment',()=>{
  const f=fixture();delete f.site.content.tr.visit;delete f.site.content.en.visit;
  f.review.documentHash=hash(f.site);f.review.checks=f.review.checks.filter(c=>!c.path.includes('/visit/'));
  const result=assess(f.site,f.evidence,f.review,f.site.id);assert.equal(result.status,'needs_enrichment',JSON.stringify(result));
});
test('reference without independent review can never be published',()=>{
  const f=fixture();assert.notEqual(assess(f.site,f.evidence,undefined,f.site.id).status,'needs_enrichment');
});
test('post-review mutation invalidates approval',()=>{
  const f=fixture();f.site.content.en.overview[0].text+=' invented';assert.equal(assess(f.site,f.evidence,f.review,f.site.id).status,'retry');
});
test('unverified coordinates quarantine',()=>{
  const f=fixture();f.review.coordinatePrecisionJustified=false;assert.equal(assess(f.site,f.evidence,f.review,f.site.id).status,'quarantine');
});
test('fabricated quotations fail core gate',()=>{
  const f=fixture();f.review.checks.find(c=>c.path.includes('/coordinates/'))!.quotes[0].quote='This quote was never retrieved';assert.equal(assess(f.site,f.evidence,f.review,f.site.id).status,'quarantine');
});
test('missing coverage and duplicate verifier checks fail',()=>{
  const f=fixture();f.review.checks.push(f.review.checks[0]);assert.ok(assess(f.site,f.evidence,f.review,f.site.id).coreErrors.length);
});
test('unretrieved or untrusted sources quarantine',()=>{
  const f=fixture();f.evidence=[];assert.equal(assess(f.site,f.evidence,f.review,f.site.id).status,'quarantine');
});
test('unlicensed images block draft without quarantining site core',()=>{
  const f=fixture();f.site.core.images=[{url:'https://example.org/image.jpg'}];f.review.documentHash=hash(f.site);assert.equal(assess(f.site,f.evidence,f.review,f.site.id).status,'retry');
});
test('nonfinite chronology and unknown site type rejected',()=>{
  const s=reference();s.core.chronology[0].startYear=Infinity;s.core.siteType='modern_city';assert.ok(structural(s).length>=2);
});
test('oldest first includes bronze subdivisions and ends Ottoman',()=>{
  const seed=(earliestPeriod:string)=>prepare({id:'test',name:'Test',province:'Konya',earliestPeriod});
  assert.ok(seed('early_pleistocene').periodRank<seed('lower_palaeolithic').periodRank);
  assert.ok(seed('late_bronze_age').periodRank<seed('iron_age').periodRank);
  assert.ok(seed('roman').periodRank<seed('ottoman').periodRank);
  assert.throws(()=>seed('bronze_age')); // group is not a valid canonical period ID
});
test('alias identity normalizes Turkish diacritics',()=>{
  const a=prepare({id:'cayonu',name:'Çayönü',province:'Diyarbakır',earliestPeriod:'neolithic'});
  const b=prepare({id:'cayonu-tepesi',name:'Cayonu',province:'Diyarbakir',earliestPeriod:'neolithic'});
  assert.ok(a.identityKeys.some(k=>b.identityKeys.includes(k)));
});
test('retry policy distinguishes core quarantine from technical dead-letter',()=>{
  assert.equal(terminalFailure(1,'quality',1),'deferred');assert.equal(terminalFailure(2,'quality',2),'quarantine');
  assert.equal(terminalFailure(5,'technical',0),'dead_letter');assert.ok(nextRetry(3,0,0.5)>nextRetry(2,0,0.5));
});
test('source retriever rejects private IPs and hostile URLs',()=>{
  for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','::1','::ffff:127.0.0.1','192.168.0.1'])assert.equal(publicAddress(ip),false);
  assert.equal(publicAddress('8.8.8.8'),true);
  for(const u of ['http://example.org','https://user:password@example.org','https://metadata.google.internal','https://localhost','https://example.org:8080'])assert.throws(()=>allowedUrl(u));
});
