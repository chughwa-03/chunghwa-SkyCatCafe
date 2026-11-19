/* Assert the actual V30 email hook sends one independent shared event. No external requests. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
async function run(emailEnabled,cloudEnabled){
  const calls=[],local=new Map();const ctx={SkyCatEmailConfig:{enabled:emailEnabled,serviceId:'service_test',templateId:'template_test',publicKey:'test_public_key'},SkyCatCloudConfig:{enabled:cloudEnabled,url:'https://demo.supabase.co',publishableKey:'sb_publishable_test'},location:{protocol:'https:'},document:{documentElement:{lang:'ko'},querySelectorAll:()=>[]},localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},Event:class{},dispatchEvent(){},addEventListener(){},AbortController,setTimeout,clearTimeout,fetch:async(url,opt)=>{calls.push({url,payload:JSON.parse(opt.body)});return {ok:true,status:200,text:async()=>''};}};
  vm.createContext(ctx);vm.runInContext(read('skycat-cloud.js'),ctx);vm.runInContext(read('skycat-email.js'),ctx);
  const inquiry={id:'Q-TEST',category:'menu',body:'가상 문의 QA'};
  await ctx.SkyCatEmail.notify('inquiry',inquiry,true);await Promise.resolve();await ctx.SkyCatEmail.notify('inquiry',inquiry,true);await Promise.resolve();
  assert.equal(calls.filter(c=>c.url.includes('supabase.co')).length,cloudEnabled?1:0);assert.equal(calls.filter(c=>c.url.includes('emailjs.com')).length,emailEnabled?1:0);
  if(cloudEnabled){assert.match(calls.find(c=>c.url.includes('supabase.co')).payload.p_details,/가상 문의 QA/);assert.equal(ctx.SkyCatCloud.status('inquiry',inquiry.id),'saved');}
  if(emailEnabled)assert.equal(ctx.SkyCatEmail.history()[0].status,'sent');
}
(async()=>{await run(true,true);await run(false,true);await run(true,false);await run(false,false);console.log('PASS: EmailJS and cloud submission independently enabled/disabled; duplicate event blocked; no live requests.');})().catch(e=>{console.error(e);process.exitCode=1;});
