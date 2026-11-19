/* No external access: all EmailJS calls are intercepted by this test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','skycat-email.js'),'utf8');

function boot({enabled=true,protocol='https:',reply=200,storage=new Map()}={}){
  const calls=[],events=[],nodes=[];
  let clock=1700000000000;
  const clockDate=class extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}};
  const doc={documentElement:{lang:'ko'},querySelectorAll(selector){return nodes.filter(n=>selector==='[data-mail-notice]'?'mailNotice'in n.dataset:'mailStatus'in n.dataset);}};
  function makeNode(){const n={dataset:{},hidden:false,textContent:'',classList:{add(){}},setAttribute(){}};nodes.push(n);return n;}
  const ctx={
    SkyCatEmailConfig:{enabled,serviceId:'service_test',templateId:'template_test',publicKey:'test_public_key'},
    document:doc,location:{protocol},Date:clockDate,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    Event:class{constructor(type){this.type=type;}},
    dispatchEvent:e=>events.push(e.type),addEventListener(){},
    MutationObserver:class{constructor(fn){this.fn=fn;}observe(){}},
    AbortController,clearTimeout(){},setTimeout(fn,ms){if(ms<15000){clock+=ms;queueMicrotask(fn);}return 1;},
    fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body),at:clock});if(reply==='network')throw Error('mock network');return {ok:reply===200,status:reply};}
  };
  vm.createContext(ctx);vm.runInContext(source,ctx);
  return {api:ctx.SkyCatEmail,ctx,calls,events,makeNode,storage};
}

(async()=>{
  const order={id:'SC-TEST-1',items:[{name:'라떼',n:2,unit:5500,options:{shot:1,milk:'oat'}}],subtotal:11000,total:12000,shipping:1000,customerName:'PRIVATE',phone:'PRIVATE',address:'PRIVATE'};
  const off=boot({enabled:false});
  const note=off.makeNode(),status=off.makeNode();
  off.api.notice(note,'cafe');assert.match(note.textContent,/미설정/);
  await off.api.notify('cafe',order);
  off.api.bind(status,'cafe',order.id);assert.equal(status.dataset.state,'disabled');assert.equal(off.calls.length,0);
  off.ctx.document.documentElement.lang='en';off.api.refresh();assert.match(status.textContent,/not configured/);
  off.ctx.document.documentElement.lang='ja';off.api.refresh();assert.match(status.textContent,/未設定/);

  const on=boot();
  const res={id:'R-1',date:'2026-12-01',time:'10:00',table:'W1',people:2,seat:'window'};
  const goods={id:'SCG-1',items:[{name:'키보드',quantity:1,subtotal:59000}],total:59000};
  const inquiry={id:'Q-1',category:'menu',body:'테스트 문의입니다.'};
  const result=await Promise.all([on.api.notify('cafe',order),on.api.notify('goods',goods),on.api.notify('reservation',res),on.api.notify('inquiry',inquiry),on.api.notify('cafe',order)]);
  assert.equal(on.calls.length,4);
  assert(result.every(r=>['sent','queued'].includes(r.status)));
  assert(on.api.history().every(r=>r.status==='sent'));
  for(let i=1;i<on.calls.length;i++)assert(on.calls[i].at-on.calls[i-1].at>=1200);
  for(const call of on.calls){
    assert.equal(call.url,'https://api.emailjs.com/api/v1.0/email/send');
    assert.equal(call.body.service_id,'service_test');assert.equal(call.body.template_id,'template_test');assert.equal(call.body.user_id,'test_public_key');
    assert(!JSON.stringify(call.body).includes('PRIVATE'));assert(!('accessToken' in call.body));assert(!('to_email' in call.body.template_params));
  }
  assert.match(on.calls[0].body.template_params.details,/라떼 × 2/);
  assert.match(on.calls[0].body.template_params.details,/오트 밀크/);
  assert.equal(on.calls[0].body.template_params.total_krw,'12,000 KRW');
  assert.match(on.calls[1].body.template_params.details,/키보드/);
  assert.match(on.calls[2].body.template_params.details,/10:00 KST/);
  assert.match(on.calls[3].body.template_params.details,/테스트 문의/);
  assert(![...on.storage.values()].join('').includes('테스트 문의')); // ledger contains no payload
  await on.api.notify('cafe',order);assert.equal(on.calls.length,4);
  const reload=boot({storage:on.storage});await reload.api.notify('cafe',order);assert.equal(reload.calls.length,0);
  await on.api.notify('reservation',{...res,time:'11:00'});assert.equal(on.calls.length,5);

  const rejected=boot({reply:422});await rejected.api.notify('goods',goods);assert.equal(rejected.api.history()[0].status,'failed');
  await rejected.api.notify('goods',goods);assert.equal(rejected.calls.length,1);
  const network=boot({reply:'network'});await network.api.notify('inquiry',inquiry);assert.equal(network.api.history()[0].status,'uncertain');
  const saveFail=boot();await saveFail.api.notify('cafe',order,false);assert.equal(saveFail.calls.length,0);assert.equal(saveFail.api.history()[0].status,'local-error');
  const file=boot({protocol:'file:'});await file.api.notify('cafe',order);assert.equal(file.calls.length,0);assert.equal(file.api.history()[0].status,'serve');
  console.log('PASS: unconfigured, all 4 request types, three languages, duplicate and reload protection, reservation revision, rate spacing, privacy allowlist, HTTP error, network failure, local failure, file protocol. No real email sent.');
})().catch(error=>{console.error(error);process.exitCode=1;});
