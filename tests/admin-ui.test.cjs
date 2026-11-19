/* DOM harness with mocked auth: no actual account or browser network. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
class Node{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.value='';this.textContent='';this.classList={toggle(){},add(){},remove(){}};}
  append(...xs){this.children.push(...xs);} prepend(...xs){this.children.unshift(...xs);} replaceChildren(...xs){this.children=xs;}
  setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];} addEventListener(k,f){this.events[k]=f;} focus(){} select(){}
  contains(n){return flat(this).includes(n);} click(){if(!this.disabled)return this.events.click?.({preventDefault(){}});}
}
const flat=n=>[n,...(n.children||[]).flatMap(x=>x instanceof Node?flat(x):[])];
const nodes=new Map(),events={},storage=new Map(),mem={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
function get(s){if(s==='#cloud-inbox')return flat(get('#content')).find(n=>n.id==='cloud-inbox')||null;if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s);}
const mode=process.argv[2]||'cloud',local=['local','file','localhost','ipv6','custom','disabled','configured'].includes(mode),demoAllowed=['local','file','localhost','ipv6','custom'].includes(mode);
let allowed=false,signouts=0,updated=null,cloudCalls=0;
const cloud={usable:()=>mode==='cloud',resume:async()=>{cloudCalls++;return false;},async signIn(email,pass){cloudCalls++;if(pass!=='mock-password'||!allowed)throw Object.assign(Error('mock deny'),{code:'NOT_ADMIN'});return true;},signOut:async()=>{signouts++;},verify:async()=>{cloudCalls++;return true;},listEvents:async()=>{cloudCalls++;return [{id:'12345678-1234-1234-1234-123456789abc',kind:'inquiry',reference:'Q-001',details:'Mock server inquiry',total_krw:'—',status:'received',created_at:new Date().toISOString()}];},updateEvent:async(id,status)=>{updated={id,status};return updated;}};
const context=vm.createContext({Node,console,document:{querySelector:get,querySelectorAll:()=>[],createElement:t=>new Node(t),addEventListener(){},activeElement:null},location:{hash:'',protocol:mode==='file'?'file:':'https:',hostname:mode==='file'?'':mode==='localhost'?'localhost':mode==='ipv6'?'[::1]':local?'127.0.0.1':mode==='lookalike'?'localhost.example.com':'chughwa-03.github.io'},window:{addEventListener:(k,f)=>events[k]=f},localStorage:mem,sessionStorage:mem,confirm:()=>true,queueMicrotask,setInterval(){},SkyCatCloud:cloud,SkyCatCloudConfig:{enabled:mode==='configured'}});
vm.runInContext(read('admin-test-config.js'),context);
context.SkyCatAdminTestConfig=mode==='disabled'?{...context.window.SkyCatAdminTestConfig,enabled:false}:mode==='custom'?{enabled:true,email:'custom@example.invalid',password:'different-test-password'}:context.window.SkyCatAdminTestConfig;
for(const f of ['skycat-store.js','goods-catalog.js','goods-commerce.js','admin.js'])vm.runInContext(read(f),context);
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{await settle();assert.equal(get('#workspace').hidden,true);assert.equal(get('#login').hidden,false);
  if(mode!=='cloud'){
    assert.equal(get('#login-submit').disabled,!demoAllowed);
    const submit=async(email,pass)=>{get('#admin-id').value=email;get('#admin-pass').value=pass;await get('#login-form').events.submit({preventDefault(){}});await settle();};
    context.location.hash='#dashboard';events.hashchange();assert.equal(get('#content').children.length,0);
    await submit('wrong@example.invalid','wrong');assert.equal(get('#workspace').hidden,true);
    const {email,password}=context.SkyCatAdminTestConfig;
    await submit(email,'wrong');assert.equal(get('#workspace').hidden,true);
    context.location.hash='';await submit(email,password);
    assert.equal(get('#workspace').hidden,!demoAllowed);
    if(demoAllowed){assert.equal(get('#title').textContent,'관리자 대시보드');assert.equal(get('#auth-mode-label').textContent,'로컬 테스트 모드');
      const routes=['dashboard','orders','status','menu','stock','price','reservations','seats','sales','bundles','member','gifts','notices','inquiries','reviews','satisfaction','hours','inventory','crowd','faq','goods-products','goods-stock','goods-orders'];
      for(const id of routes){context.location.hash='#'+id;events.hashchange();assert.match(get('#content').children[0].textContent,/테스트 로그인 모드/);}
      context.location.hash='#cloud';events.hashchange();assert(flat(get('#content')).some(n=>n.textContent.includes('연결 보류')));get('#refresh-view').click();await settle();
      get('#logout').click();assert.equal(get('#workspace').hidden,true);assert.equal(get('#content').children.length,0);
    }else assert.equal(get('#content').children.length,0);
    assert.equal(cloudCalls,0);assert.equal(signouts,0);console.log('PASS: '+mode+' local demo gate, credential checks, protected routes, no cloud calls.');return;
  }
  assert.equal(get('#login-submit').disabled,false);
  get('#admin-id').value='test@example.invalid';get('#admin-pass').value='mock-password';await get('#login-form').events.submit({preventDefault(){}});assert.equal(get('#workspace').hidden,true);assert.match(get('#login-error').textContent,/관리자/);
  allowed=true;get('#admin-pass').value='wrong';await get('#login-form').events.submit({preventDefault(){}});assert.equal(get('#workspace').hidden,true);
  get('#admin-pass').value='mock-password';await get('#login-form').events.submit({preventDefault(){}});await settle();assert.equal(get('#workspace').hidden,false);assert.equal(get('#login').hidden,true);assert.equal(get('#nav-count').textContent,'24');assert(flat(get('#content')).some(n=>n.textContent==='Mock server inquiry'));
  const routes=['dashboard','orders','status','menu','stock','price','reservations','seats','sales','bundles','member','gifts','notices','inquiries','reviews','satisfaction','hours','inventory','crowd','faq','goods-products','goods-stock','goods-orders'];
  for(const id of routes){context.location.hash='#'+id;events.hashchange();assert(get('#content').children.length>0,id);assert.match(get('#content').children[0].textContent,/로컬 체험/);}
  context.location.hash='#cloud';events.hashchange();await settle();const pane=flat(get('#content')),state=pane.filter(n=>n.tagName==='SELECT').at(-1);state.value='completed';await pane.find(n=>n.tagName==='BUTTON'&&n.textContent==='상태 저장').click();await settle();assert.equal(updated.status,'completed');
  get('#logout').click();assert.equal(get('#workspace').hidden,true);assert.equal(get('#content').children.length,0);assert.equal(signouts,1);
  console.log('PASS: locked opening, denied incorrect/non-admin login, verified admin dashboard, 24 routes, cloud status update, logout clears protected content. Mock DOM only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
