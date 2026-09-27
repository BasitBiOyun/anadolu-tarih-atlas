import { GoogleAuth } from 'google-auth-library';
import { PROJECT,DATABASE } from '../src/policy.ts';
const specs:{collection:string;fields:string[]}[]=[
  {collection:'research_queue',fields:['engine','status','periodRank','earliestYear','importance','id']},
  {collection:'research_queue',fields:['engine','status','id','periodRank','earliestYear','importance']},
  {collection:'research_queue',fields:['engine','status','nextAttemptAt']},
  {collection:'research_queue',fields:['engine','status','leaseUntil']},
  {collection:'research_enrichment',fields:['status','nextAttemptAt']}
];
const auth=await new GoogleAuth({scopes:['https://www.googleapis.com/auth/cloud-platform']}).getClient();
for(const spec of specs){
  const url=`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DATABASE}/collectionGroups/${spec.collection}/indexes`;
  const response=await auth.request<any>({url});
  const fields=spec.fields.map(fieldPath=>({fieldPath,order:'ASCENDING'}));
  const existing=(response.data.indexes??[]).find((i:any)=>JSON.stringify(i.fields.filter((f:any)=>f.fieldPath!=='__name__'))===JSON.stringify(fields));
  if(existing){console.log(spec.collection,spec.fields.join(','),existing.state);continue;}
  await auth.request({url,method:'POST',data:{queryScope:'COLLECTION',fields}});
  console.log(spec.collection,spec.fields.join(','),'CREATING');
}
