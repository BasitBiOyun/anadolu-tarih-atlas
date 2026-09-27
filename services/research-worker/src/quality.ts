import { validateSiteJson } from '../../../src/validation/siteValidator.ts';
import { hash, PERIODS, SITE_TYPES } from './policy.ts';

export type Evidence = {id:string; url:string; title:string; text:string; sha256:string; fetchedAt:string; trusted:boolean};
export type Check = {path:string; verdict:'supported'|'unsupported'|'conflicting'; sourceIds:string[]; quotes:{sourceId:string; quote:string}[]};
export type Review = {documentHash:string; checks:Check[]; translationEquivalent:boolean; identityConsistent:boolean; coordinatePrecisionJustified:boolean; chronologyConsistent:boolean};
export type Decision = {status:'publishable'|'needs_enrichment'|'quarantine'|'retry'; coreErrors:string[]; draftErrors:string[]; missing:string[]};
const omit=new Set(['sourceIds','sourceId','citationNumber']);
export function factualLeaves(site:any): {path:string;value:any}[] {
  const result:{path:string;value:any}[]=[];
  function visit(node:any,path:string) {
    if (node===null || node===undefined || node==='') return;
    if (typeof node!=='object') {result.push({path,value:node});return;}
    Object.entries(node).forEach(([k,v])=>{if(!omit.has(k))visit(v,`${path}/${k.replaceAll('~','~0').replaceAll('/','~1')}`);});
  }
  visit(site.content,'/content');
  for (const field of ['coordinates','siteType','chronology','dateRange']) visit(site.core?.[field],`/core/${field}`);
  (Array.isArray(site.core?.sources)?site.core.sources:[]).forEach((source:any,i:number)=>{
    Object.entries(source).forEach(([key,value])=>{if(!['id','sourceId','citationNumber','url'].includes(key))visit(value,`/core/sources/${i}/${key}`);});
  });
  return result;
}
function contentWords(value:any):number {
  if(typeof value==='string')return value.trim().split(/\s+/).length;
  if(!value||typeof value!=='object')return 0;
  return Object.entries(value).filter(([k])=>!omit.has(k)).reduce((sum,[,v])=>sum+contentWords(v),0);
}
export function structural(site:any):string[] {
  let base:string[];
  try {base=validateSiteJson(site).errors;} catch {return ['Malformed schema structure'];}
  if (site?.schemaVersion!==4) base.push('Worker requires schemaVersion 4');
  if(site&&typeof site==='object')for(const k of Object.keys(site))if(!['schemaVersion','id','core','content'].includes(k))base.push(`Unknown root field: ${k}`);
  if(site?.core&&typeof site.core==='object')for(const k of Object.keys(site.core))if(!['coordinates','siteType','chronology','dateRange','visibility','images','sources','slug'].includes(k))base.push(`Unknown core field: ${k}`);
  if(!SITE_TYPES.includes(site?.core?.siteType))base.push('Unknown canonical siteType');
  for(const field of ['latitude','longitude']) if(!Number.isFinite(site?.core?.coordinates?.[field]))base.push(`Nonfinite ${field}`);
  for(const c of [...(Array.isArray(site?.core?.chronology)?site.core.chronology:[]),site?.core?.dateRange].filter(Boolean)) {
    for(const f of ['startYear','endYear'])if(c[f]!==undefined&&c[f]!==null&&!Number.isFinite(c[f]))base.push(`Nonfinite ${f}`);
    if(c.startYear>c.endYear)base.push('Reversed date range');
    if(c.periodId&&!PERIODS.includes(c.periodId))base.push('Noncanonical period');
  }
  if (JSON.stringify(site).length>1_500_000)base.push('Oversize document');
  return base;
}
export function assess(site:any,evidence:Evidence[],review:Review|undefined,expectedId:string):Decision {
  const coreErrors:string[]=[],draftErrors=structural(site),missing:string[]=[];
  const sources=Array.isArray(site?.core?.sources)?site.core.sources:[];
  const byId=new Map(evidence.filter(e=>e.trusted&&e.sha256===hash(e.text)&&e.text.length>=200).map(e=>[e.id,e]));
  if(site?.id!==expectedId)coreErrors.push('IDENTITY_MISMATCH');
  if(sources.length<2)coreErrors.push('INSUFFICIENT_SOURCES');
  const urls=new Set<string>(),hosts=new Set<string>();
  for(const source of sources) {
    const e=byId.get(source.id);
    if(!e || e.url!==source.url) {coreErrors.push(`UNVERIFIED_SOURCE:${source.id}`);continue;}
    urls.add(e.url);hosts.add(new URL(e.url).hostname.replace(/^www\./,''));
  }
  if(urls.size<2||hosts.size<2)coreErrors.push('INSUFFICIENT_INDEPENDENT_SOURCES');
  if(!review || review.documentHash!==hash(site))draftErrors.push('MISSING_OR_STALE_REVIEW');
  else {
    if(review.identityConsistent!==true)coreErrors.push('IDENTITY_CONFLICT');
    if(review.coordinatePrecisionJustified!==true)coreErrors.push('COORDINATE_UNVERIFIED');
    if(review.chronologyConsistent!==true)coreErrors.push('CHRONOLOGY_CONFLICT');
    if(review.translationEquivalent!==true)draftErrors.push('TR_EN_NOT_EQUIVALENT');
    const checks=Array.isArray(review.checks)?review.checks:[];
    const declared=new Set(sources.map((s:any)=>s.id));
    for(const leaf of factualLeaves(site)) {
      const matches=checks.filter(c=>c.path===leaf.path);
      const check=matches[0];
      const valid=matches.length===1 && check.verdict==='supported' && Array.isArray(check.sourceIds)&&check.sourceIds.length>0&&check.sourceIds.every(id=>declared.has(id)&&byId.has(id)) && Array.isArray(check.quotes)&&check.quotes.length>0 && check.sourceIds.every(id=>check.quotes.some(q=>q.sourceId===id && typeof q.quote==='string' && q.quote.trim().length>=12 && byId.get(id)!.text.includes(q.quote)));
      if(!valid) (leaf.path.startsWith('/core/')||/^\/content\/(tr|en)\/name$/.test(leaf.path)?coreErrors:draftErrors).push(`UNSUPPORTED:${leaf.path}`);
    }
  }
  for(const lang of ['tr','en']) {
    const c=site?.content?.[lang]??{};
    for(const key of ['overview','chronology','importance'])if(!Array.isArray(c[key])||!c[key].length)draftErrors.push(`MISSING_NARRATIVE:${lang}.${key}`);
    // A drafting floor, not an incentive to fabricate optional findings to meet a quota.
    if(contentWords(c)<350)draftErrors.push(`SHORT_MONOGRAPH:${lang}`);
    for(const key of ['discoveries','excavationHistory','currentStatus','keyFinds','researchDebates','geography','visit'])if(!c[key]||Array.isArray(c[key])&&!c[key].length)missing.push(`${lang}.${key}`);
    function citations(node:any,path:string) {
      if(!node||typeof node!=='object')return;
      if(typeof node.text==='string'||typeof node.description==='string'||typeof node.summary==='string') {
        if(!Array.isArray(node.sourceIds)||!node.sourceIds.length)draftErrors.push(`MISSING_CITATIONS:${path}`);
      }
      Object.entries(node).forEach(([k,v])=>citations(v,`${path}.${k}`));
    }
    citations(c,lang);
  }
  // v1 emits no images. Optional licensed-image enrichment must implement an independent
  // license-page verifier before this deny rule can be relaxed.
  if(site?.core?.images?.length)draftErrors.push('IMAGE_LICENSE_VERIFIER_NOT_ENABLED');
  else missing.push('images');
  return {status:coreErrors.length?'quarantine':draftErrors.length?'retry':missing.length?'needs_enrichment':'publishable',coreErrors,draftErrors,missing};
}
