import { GoogleAuth, OAuth2Client, Impersonated } from 'google-auth-library';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { INBOX, hash } from './policy.ts';

export class Drive {
  constructor(private client:any,public folder=INBOX,private userOAuth=false){}
  static async create() {
    const path=process.env.DRIVE_OAUTH_FILE;
    if(path) {
      const c=JSON.parse(readFileSync(path,'utf8'));
      if(c.type!=='authorized_user'||!c.refresh_token)throw new Error('DRIVE_OAUTH_REFRESH_TOKEN_REQUIRED');
      const client=new OAuth2Client(c.client_id,c.client_secret);client.setCredentials({refresh_token:c.refresh_token});
      return new Drive(client,INBOX,true);
    }
    const auth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/cloud-platform']});
    const client=new Impersonated({sourceClient:await auth.getClient(),targetPrincipal:process.env.DRIVE_SA??'atlas-storage-sync@hiddenfeed.iam.gserviceaccount.com',targetScopes:['https://www.googleapis.com/auth/drive'],lifetime:600});
    return new Drive(client);
  }
  async request(path:string,init:RequestInit={}) {
    const token=await this.client.getAccessToken();
    if(!token.token)throw new Error('DRIVE_AUTH_FAILED');
    const r=await fetch(`https://www.googleapis.com/${path}`,{...init,signal:AbortSignal.timeout(60_000),headers:{...init.headers,Authorization:`Bearer ${token.token}`}});
    if(!r.ok) {const err:any=new Error(`DRIVE_HTTP_${r.status}`);err.status=r.status;throw err;}
    return r;
  }
  async preflight() {
    const f=await (await this.request(`drive/v3/files/${this.folder}?supportsAllDrives=true&fields=id,mimeType,driveId,capabilities(canAddChildren)`)).json() as any;
    if(f.mimeType!=='application/vnd.google-apps.folder'||f.capabilities?.canAddChildren!==true)throw new Error('DRIVE_FOLDER_WRITE_DENIED');
    if(!this.userOAuth&&!f.driveId)throw new Error('MY_DRIVE_REQUIRES_USER_OAUTH_SERVICE_ACCOUNTS_HAVE_NO_STORAGE_QUOTA');
    return {folder:f.id,sharedDrive:!!f.driveId};
  }
  async reserveId():Promise<string> {
    const r=await (await this.request('drive/v3/files/generateIds?count=1&space=drive&type=files')).json() as any;
    if(!r.ids?.[0])throw new Error('DRIVE_ID_MISSING');return r.ids[0];
  }
  async findByName(name:string) {
    const q=new URLSearchParams({q:`'${this.folder}' in parents and trashed=false and name='${name.replaceAll("'","\\'")}'`,fields:'files(id,name)',pageSize:'100',supportsAllDrives:'true',includeItemsFromAllDrives:'true'});
    return (await (await this.request(`drive/v3/files?${q}`)).json() as any).files??[];
  }
  async deliver(fileId:string,site:any):Promise<void> {
    const boundary=`atlas_${randomUUID()}`;
    const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({id:fileId,name:`${site.id}.json`,parents:[this.folder],mimeType:'application/json',appProperties:{atlasResearch:'v1',sha256:hash(site)}})}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(site)}\r\n--${boundary}--`;
    try{await this.request('upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});}
    catch(e:any){if(e.status!==409)throw e;}
    // Repeated create with the persisted ID is safe after a crash or response loss.
    const check=await (await this.request(`drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`)).json();
    if(hash(check)!==hash(site))throw new Error('DRIVE_READBACK_MISMATCH');
  }
}
