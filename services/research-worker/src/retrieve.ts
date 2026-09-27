import { lookup } from 'node:dns/promises';
import { Agent, fetch } from 'undici';
import ipaddr from 'ipaddr.js';
import { load } from 'cheerio';
import { PDFParse } from 'pdf-parse';
import { hash } from './policy.ts';
import type { Evidence } from './quality.ts';

export function publicAddress(address:string) {
  try{return ipaddr.process(address).range()==='unicast';}catch{return false;}
}
export function allowedUrl(raw:string) {
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||u.hostname==='localhost'||u.hostname.endsWith('.internal')||u.hostname.endsWith('.local'))throw new Error('UNSAFE_SOURCE_URL');
  return u;
}
const agent=new Agent({connect:{lookup:(hostname:any,options:any,callback:any)=>{
  lookup(hostname,{all:true}).then(rows=>{
    if(!rows.length||rows.some(r=>!publicAddress(r.address)))return callback(new Error('PRIVATE_SOURCE_ADDRESS'));
    if(options?.all)callback(null,rows);else callback(null,rows[0].address,rows[0].family);
  },callback);
}}});
export const TRUSTED_HOSTS=['ktb.gov.tr','kulturportali.gov.tr','muze.gov.tr','whc.unesco.org','dergipark.org.tr','doi.org','nature.com','science.org','sciencedirect.com','cambridge.org','jstor.org','persee.fr','pmc.ncbi.nlm.nih.gov','archatlas.org','cayonutepesi.org.tr','asiklihoyuk.org','archeo.ens.fr'];
export function trustedHost(url:string,extra:string[]=[]){
  const h=new URL(url).hostname;
  return [...TRUSTED_HOSTS,...extra].some(d=>h===d||h.endsWith('.'+d))||h.endsWith('.edu.tr')||h.endsWith('.ac.uk')||h.endsWith('.edu');
}
export async function retrieve(raw:string,id:string,extra:string[]=[]):Promise<Evidence> {
  let url=allowedUrl(raw).href;
  for(let redirects=0;redirects<=5;redirects++) {
    const r=await fetch(url,{dispatcher:agent,redirect:'manual',signal:AbortSignal.timeout(30_000),headers:{'User-Agent':'AnadoluAtlasResearch/0.1 (source verification)'}});
    if([301,302,303,307,308].includes(r.status)) {
      const location=r.headers.get('location');await r.body?.cancel();
      if(!location)throw new Error('EMPTY_REDIRECT');
      url=allowedUrl(new URL(location,url).href).href;continue;
    }
    if(!r.ok){await r.body?.cancel();throw new Error(`SOURCE_HTTP_${r.status}`);}
    const chunks:Uint8Array[]=[];let size=0;
    for await (const chunk of r.body!){size+=chunk.length;if(size>8_000_000){await r.body?.cancel().catch(()=>{});throw new Error('SOURCE_TOO_LARGE');}chunks.push(chunk);}
    const bytes=Buffer.concat(chunks),type=r.headers.get('content-type')??'';
    let text='',title='';
    if(type.includes('pdf')){const parser=new PDFParse({data:bytes});try {text=(await parser.getText()).text;}finally{await parser.destroy();}}
    else if(type.includes('html')){const $=load(bytes.toString('utf8'));title=$('title').text();$('script,style,nav,footer,header,noscript').remove();text=$('body').text();}
    else if(type.startsWith('text/plain'))text=bytes.toString('utf8');
    else throw new Error('UNSUPPORTED_SOURCE_TYPE');
    text=text.replace(/\s+/g,' ').trim().slice(0,80_000);
    if(text.length<200)throw new Error('SOURCE_EMPTY');
    return {id,url,title,text,sha256:hash(text),fetchedAt:new Date().toISOString(),trusted:trustedHost(url,extra)};
  }
  throw new Error('TOO_MANY_REDIRECTS');
}
