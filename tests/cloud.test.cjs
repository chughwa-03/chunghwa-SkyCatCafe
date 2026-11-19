/* Supabase mock only: no external traffic, credentials or real records. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','skycat-cloud.js'),'utf8');
function boot({enabled=true,protocol='https:',admin=true,failLogin=false,failSubmit=false,storage=new Map(),expiry=3600}={}){
  const calls=[];const ctx={SkyCatCloudConfig:{enabled,url:'https://demo.supabase.co',publishableKey:'sb_publishable_test'},location:{protocol},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},Event:class{},dispatchEvent(){},AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{
    const body=options.body?JSON.parse(options.body):null;calls.push({url,options,body});
    const respond=(value,http=200)=>({ok:http===200,status:http,text:async()=>value===null?'':JSON.stringify(value)});
    if(url.includes('grant_type=password'))return failLogin?respond({},400):respond({access_token:'access_mock',refresh_token:'refresh_mock',expires_in:expiry});
    if(url.includes('refresh_token'))return respond({access_token:'access_refreshed',refresh_token:'refresh_updated',expires_in:3600});
    if(url.endsWith('skycat_is_admin'))return respond(admin);
    if(url.endsWith('skycat_submit_event'))return failSubmit?respond({},429):respond(null);
    if(url.endsWith('logout'))return respond(null);
    if(options.method==='PATCH')return respond([{id:'12345678-1234-1234-1234-123456789abc',status:body.status}]);
    return respond([{id:'12345678-1234-1234-1234-123456789abc',kind:'inquiry',status:'received'}]);
  }};vm.createContext(ctx);vm.runInContext(source,ctx);return {api:ctx.SkyCatCloud,calls,storage};
}
(async()=>{
  const payload={reference:'QA',details:'테스트 문의',total_krw:'—',language:'ko',email:'not-sent',phone:'not-sent'};
  const off=boot({enabled:false});assert.equal(await off.api.submit('inquiry','QA',payload),'disabled');assert.equal(off.calls.length,0);await assert.rejects(off.api.signIn('user@example.invalid','mock'));
  const file=boot({protocol:'file:'});assert.equal(await file.api.submit('inquiry','QA',payload),'serve');assert.equal(file.calls.length,0);
  const anon=boot();await assert.rejects(anon.api.listEvents());assert.equal(anon.calls.length,0);
  for(const kind of ['cafe','goods','reservation','inquiry'])assert.equal(await anon.api.submit(kind,kind+'-QA',payload),'saved');
  await anon.api.submit('inquiry','inquiry-QA',payload);assert.equal(anon.calls.length,4);assert(anon.calls.every(x=>!x.options.headers.Authorization&&!JSON.stringify(x.body).includes('not-sent')));
  assert.equal(await boot({failSubmit:true}).api.submit('inquiry','QA',payload),'failed');
  const bad=boot({failLogin:true});await assert.rejects(bad.api.signIn('user@example.invalid','mock'));assert.equal(bad.storage.size,0);
  const nonAdmin=boot({admin:false});await assert.rejects(nonAdmin.api.signIn('user@example.invalid','mock'),{code:'NOT_ADMIN'});assert.equal(nonAdmin.storage.size,0);await assert.rejects(nonAdmin.api.listEvents());
  const yes=boot({expiry:1});assert.equal(await yes.api.signIn('admin@example.invalid','mock'),true);assert(yes.calls.some(x=>x.url.includes('grant_type=refresh_token')));assert.equal((await yes.api.listEvents()).length,1);assert(yes.calls.filter(x=>x.url.includes('/rest/v1/skycat_events')).every(x=>x.options.headers.Authorization==='Bearer access_refreshed'));
  const result=await yes.api.updateEvent('12345678-1234-1234-1234-123456789abc','completed');assert.equal(result.status,'completed');await assert.rejects(yes.api.updateEvent('bad','deleted'));
  const resumed=boot({storage:yes.storage});assert.equal(await resumed.api.resume(),true);await resumed.api.signOut();assert.equal(yes.storage.size,0);await assert.rejects(resumed.api.listEvents());
  assert(yes.calls.every(x=>!x.options.headers.apikey.startsWith('sb_secret_')));
  console.log('PASS: disabled/file mode, 4 write-only submissions, duplicate prevention, request failure, wrong password, non-admin rejection, authorized list/update, token refresh, restore and logout. No real requests.');
})().catch(e=>{console.error(e);process.exitCode=1;});
