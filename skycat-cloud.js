/* V30: Supabase REST integration. No secret key or password is stored in source. */
(() => {
  'use strict';
  const cfg=globalThis.SkyCatCloudConfig||{}, SESSION='skycat:v30:admin-session';
  const KINDS=['cafe','goods','reservation','inquiry'];
  const STATES=['received','processing','completed','cancelled'];
  let session=null, refreshing=null, generation=0;
  const uploads=new Map();
  const configured=()=>cfg.enabled===true&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.url||'')&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(cfg.publishableKey||'');
  const usable=()=>configured()&&['http:','https:'].includes(location.protocol);
  const base=()=>cfg.url.replace(/\/$/,'');
  const err=code=>Object.assign(new Error(code),{code});
  async function request(path,{method='GET',body,token,prefer}={}){
    if(!usable())throw err('NOT_CONFIGURED');
    const headers={apikey:cfg.publishableKey,Accept:'application/json'};
    if(token)headers.Authorization='Bearer '+token;
    if(body!==undefined)headers['Content-Type']='application/json';
    if(prefer)headers.Prefer=prefer;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(base()+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,cache:'no-store',referrerPolicy:'no-referrer'});
      if(!response.ok)throw err('HTTP_'+response.status);
      const text=await response.text();return text?JSON.parse(text):null;
    }finally{clearTimeout(timer);}
  }
  function clear(){generation++;session=null;try{sessionStorage.removeItem(SESSION);}catch{}}
  function save(value){
    if(!value?.access_token||!value?.refresh_token||!Number.isFinite(Number(value.expires_in)))throw err('INVALID_SESSION');
    session={access_token:value.access_token,refresh_token:value.refresh_token,expires_at:Date.now()+Number(value.expires_in)*1000};
    try{sessionStorage.setItem(SESSION,JSON.stringify(session));}catch{}
    return session;
  }
  async function token(){
    if(!session)throw err('NOT_AUTHENTICATED');
    if(session.expires_at>Date.now()+60000)return session.access_token;
    if(!refreshing){const captured=generation,refresh_token=session.refresh_token;
      refreshing=request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token}}).then(value=>{
        if(captured!==generation)throw err('SESSION_CHANGED');return save(value).access_token;
      }).catch(e=>{if(captured===generation)clear();throw e;}).finally(()=>{refreshing=null;});
    }return refreshing;
  }
  async function verify(){
    const captured=generation,access=await token();
    const allowed=await request('/rest/v1/rpc/skycat_is_admin',{method:'POST',body:{},token:access});
    if(captured!==generation||allowed!==true){if(captured===generation)clear();throw err('NOT_ADMIN');}
    return true;
  }
  async function signIn(email,password){
    clear();const captured=generation;
    try{const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
      if(captured!==generation)throw err('SESSION_CHANGED');save(data);return await verify();
    }catch(e){if(captured===generation)clear();throw e;}
  }
  async function resume(){
    if(!usable())return false;
    try{const stored=JSON.parse(sessionStorage.getItem(SESSION)||'null');
      if(!stored?.access_token||!stored?.refresh_token||!Number.isFinite(stored.expires_at))return false;
      session=stored;return await verify();
    }catch{clear();return false;}
  }
  async function signOut(){
    const access=session?.access_token;clear();
    if(access){try{await request('/auth/v1/logout',{method:'POST',token:access});}catch{}}
  }
  async function listEvents(){
    await verify();return request('/rest/v1/skycat_events?select=id,kind,reference,details,total_krw,language,status,created_at&order=created_at.desc&limit=200',{token:await token()});
  }
  async function updateEvent(id,status){
    if(!/^[0-9a-f-]{36}$/i.test(id)||!STATES.includes(status))throw err('INVALID_EVENT');
    await verify();const rows=await request('/rest/v1/skycat_events?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{status},token:await token(),prefer:'return=representation'});
    if(!Array.isArray(rows)||rows.length!==1)throw err('ACCESS_DENIED');return rows[0];
  }
  const uploadKey=(kind,eventRef)=>kind+':'+eventRef;
  function status(kind,eventRef){return uploads.get(uploadKey(kind,eventRef));}
  function mark(key,value){uploads.set(key,value);globalThis.dispatchEvent(new Event('skycat:cloud-status'));return value;}
  function submit(kind,eventRef,params){
    if(!configured()||!KINDS.includes(kind)||!eventRef)return Promise.resolve('disabled');
    const key=uploadKey(kind,eventRef);if(uploads.has(key))return Promise.resolve(uploads.get(key));
    if(!usable())return Promise.resolve(mark(key,'serve'));
    mark(key,'sending');
    const body={p_kind:kind,p_event_ref:String(eventRef).slice(0,150),p_reference:String(params.reference).slice(0,100),p_details:String(params.details).slice(0,12000),p_total_krw:String(params.total_krw).slice(0,50),p_language:['ko','en','ja'].includes(params.language)?params.language:'ko'};
    return request('/rest/v1/rpc/skycat_submit_event',{method:'POST',body}).then(()=>mark(key,'saved')).catch(()=>mark(key,'failed'));
  }
  const notices={sending:['서버 기록 저장 중…','Saving shared demo record…','共有記録を保存中…'],saved:['공용 서버 접수 완료','Shared demo record saved','共有記録を保存しました'],failed:['공용 서버 저장 실패 · 로컬 기록은 유지됩니다.','Shared save failed; local record retained.','共有保存に失敗・ローカル記録は保持'],serve:['공용 서버 기록은 HTTP(S)에서만 전송됩니다.','Shared records require HTTP(S).','共有記録はHTTP(S)が必要です。']};
  const textFor=(value,language)=>notices[value]?.[language==='en'?1:language==='ja'?2:0]||'';
  globalThis.SkyCatCloud=Object.freeze({configured,usable,submit,status,textFor,signIn,resume,signOut,verify,listEvents,updateEvent});
})();
