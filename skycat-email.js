/* V29 — Optional administrator email notifications for fictional demo events.
   No customer name, phone, address, payment credentials or recipient address
   is sent. The template recipient is configured in the EmailJS dashboard. */
(() => {
  'use strict';
  const KEY='skycat:email:v29:history', ENDPOINT='https://api.emailjs.com/api/v1.0/email/send';
  const config=globalThis.SkyCatEmailConfig||{};
  const labels={cafe:'카페 가상 주문',goods:'굿즈 가상 주문',reservation:'가상 예약 신청',inquiry:'고객 문의'};
  const messages={
    disabled:['이메일 알림 미설정 · 가상 기록만 저장됩니다.','Email not configured · Demo records only.','メール未設定・体験記録のみ保存します。'],
    ready:['완료 시 가상 기록 정보가 운영자 이메일로 전송됩니다. 실제 결제·예약은 아닙니다.','Submitting sends demo details to the administrator by email; no real payment or booking.','完了時に体験情報を管理者にメール送信します。実際の決済・予約ではありません。'],
    inquiry:['문의 접수 시 작성한 문의 내용이 운영자 이메일로 전송됩니다. 개인정보는 입력하지 마세요.','Submitting sends your question to the administrator by email. Do not include personal information.','送信時にお問い合わせ内容を管理者へメール送信します。個人情報は入力しないでください。'],
    queued:['이메일 알림 대기 중…','Email notification queued…','メール通知の送信待ち…'],
    sending:['이메일 알림 발송 중…','Sending email notification…','メール通知を送信中…'],
    sent:['이메일 알림 요청 성공 · 실제 결제·예약과 무관합니다.','Email notification accepted · No real payment or booking.','メール通知受付完了・実際の決済や予約ではありません。'],
    failed:['이메일 알림 실패 · 가상 기록은 유지됩니다. 운영자에게 확인해 주세요.','Email failed · Demo record retained. Contact the administrator.','メール通知失敗・体験記録は保持されます。管理者にご確認ください。'],
    uncertain:['이메일 발송 결과 미확인 · 중복 방지를 위해 자동 재발송하지 않습니다.','Email result unknown · No automatic retry to prevent duplicates.','送信結果未確認・重複防止のため自動再送しません。'],
    'local-error':['저장 실패로 이메일 알림을 보내지 않았습니다.','Email skipped because local saving failed.','保存失敗のためメール通知は送信されませんでした。'],
    'serve':['HTTP(S)로 사이트를 열어 주세요. 이메일은 발송되지 않았습니다.','Open the site over HTTP(S). No email was sent.','HTTP(S)でサイトを開いてください。メールは送信されていません。']
  };
  let memory=new Map(), queue=Promise.resolve(), lastStart=0;
  const validId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(x)&&!/^YOUR_/i.test(x);
  const configured=()=>config.enabled===true&&[config.serviceId,config.templateId,config.publicKey].every(validId);
  const lang=()=>['en','ja'].includes(document.documentElement.lang)?document.documentElement.lang:'ko';
  const localized=key=>(messages[key]||messages.disabled)[lang()==='en'?1:lang()==='ja'?2:0];
  const keyOf=(kind,ref)=>kind+':'+String(ref);
  function stored(){
    try{const rows=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(rows)?rows.filter(r=>r&&typeof r.key==='string'&&Object.hasOwn(labels,r.kind)&&Object.hasOwn(messages,r.status)&&Number.isFinite(r.at)):[];}catch{return [];}
  }
  function history(){
    const all=new Map(stored().map(r=>[r.key,r]));
    for(const [key,row] of memory)if(!all.has(key)||all.get(key).at<=row.at)all.set(key,row);
    return [...all.values()].map(r=>(['sending','queued'].includes(r.status)&&Date.now()-r.at>120000?{...r,status:'uncertain'}:r)).sort((a,b)=>b.at-a.at).slice(0,100);
  }
  function put(kind,ref,eventRef,status,httpStatus){
    const row={key:keyOf(kind,eventRef),kind,ref:String(ref).slice(0,100),status,at:Date.now()};
    if(Number.isInteger(httpStatus))row.httpStatus=httpStatus;
    memory.set(row.key,row);
    try{localStorage.setItem(KEY,JSON.stringify(history()));}catch{}
    refresh();
    globalThis.dispatchEvent(new Event('skycat:mail-status'));
    return row;
  }
  function result(kind,eventRef){return history().find(r=>r.key===keyOf(kind,eventRef));}
  function refresh(){
    for(const n of document.querySelectorAll('[data-mail-notice]')){
      n.textContent=localized(configured()?(n.dataset.mailNotice==='inquiry'?'inquiry':'ready'):'disabled');
      if(globalThis.SkyCatCloud?.configured())n.textContent+=lang()==='en'?' Shared demo records are also sent to the administrator database. Do not enter personal information.':lang()==='ja'?' 体験記録は管理者用データベースにも送信されます。個人情報は入力しないでください。':' 가상 기록은 관리자용 데이터베이스에도 전송됩니다. 개인정보는 입력하지 마세요.';
    }
    for(const n of document.querySelectorAll('[data-mail-status]')){
      const row=history().find(r=>r.key===n.dataset.mailStatus);
      const split=n.dataset.mailStatus.indexOf(':'),kind=n.dataset.mailStatus.slice(0,split),ref=n.dataset.mailStatus.slice(split+1);
      const cloud=globalThis.SkyCatCloud,cloudText=cloud?.textFor(cloud.status(kind,ref),lang())||'';
      n.hidden=!row&&!cloudText;
      n.textContent=[row?localized(row.status):'',cloudText].filter(Boolean).join(' / ');
      n.dataset.state=row?.status||'';
    }
  }
  function notice(node,kind){
    if(!node)return;node.classList.add('skycat-mail-note');node.dataset.mailNotice=kind;refresh();
  }
  function bind(node,kind,eventRef){
    if(!node)return;node.classList.add('skycat-mail-status');node.setAttribute('role','status');
    if(eventRef)node.dataset.mailStatus=keyOf(kind,eventRef);else{delete node.dataset.mailStatus;node.hidden=true;node.textContent='';}
    refresh();
  }
  const str=(v,max=100)=>String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').slice(0,max);
  const amount=n=>Number.isFinite(n)?Math.round(n).toLocaleString('ko-KR')+' KRW':'—';
  const reservationRef=r=>[r.id,r.date,r.time,r.table,r.people].join('|');
  // Explicit allowlist: only non-personal demo metadata (or the question the
  // visitor explicitly submits after seeing the external email notice).
  function build(kind,r,language){
    let lines=[],total='—',ref=str(r.id);
    if(kind==='cafe'){
      lines=(r.items||[]).map(i=>{
        const o=i.options||{},opts=[];
        if([1,2].includes(o.shot))opts.push('샷 '+o.shot+'회 추가');
        if(['less','none'].includes(o.ice))opts.push('얼음 '+({less:'적게',none:'없이'}[o.ice]));
        if(['less','more'].includes(o.sugar))opts.push('당도 '+({less:'덜 달게',more:'더 달게'}[o.sugar]));
        if(['oat','soy'].includes(o.milk))opts.push({oat:'오트 밀크',soy:'두유'}[o.milk]);
        return str(i.name,80)+' × '+i.n+' · '+amount(i.unit*i.n)+(opts.length?' ('+opts.join(', ')+')':'');
      });
      lines.push('상품 금액: '+amount(r.subtotal),'세트 할인: '+amount(r.setDiscount||0),'쿠폰 할인: '+amount(r.discount||0),'기프트 할인: '+amount(r.giftDiscount||0),'가상 배달비: '+amount(r.shipping||0));
      total=amount(r.total);
    }else if(kind==='goods'){
      lines=(r.items||[]).map(i=>str(i.name,80)+' × '+i.quantity+' · '+amount(i.subtotal));total=amount(r.total);
    }else if(kind==='reservation'){
      lines=['방문 일시: '+str(r.date)+' '+str(r.time)+' KST','인원: '+str(r.people),'좌석: '+str(r.table)+' ('+str(r.seat)+')','상태: 승인 대기 (가상)'];
    }else if(kind==='inquiry'){
      const cats={reservation:'예약 문의',menu:'메뉴 문의',service:'이용 문의',other:'기타 문의'};
      lines=['문의 유형: '+(cats[r.category]||'기타 문의'),'문의 내용: '+str(r.body,300)];
    }else throw new Error('Unsupported email event');
    return {event_label:labels[kind],reference:ref,created_at:new Date().toISOString(),language:['ko','en','ja'].includes(language)?language:'ko',details:str(lines.join('\n'),12000),total_krw:total,demo_notice:'하늘고양이 카페 포트폴리오 시연 알림입니다. 실제 주문·결제·예약·배송이 아닙니다.'};
  }
  async function sendRequest(kind,ref,eventRef,params){
    const gap=Math.max(0,1200-(Date.now()-lastStart));
    if(gap)await new Promise(resolve=>setTimeout(resolve,gap));
    lastStart=Date.now();
    put(kind,ref,eventRef,'sending');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({service_id:config.serviceId,template_id:config.templateId,user_id:config.publicKey,template_params:params}),signal:controller.signal});
      return put(kind,ref,eventRef,response.ok?'sent':'failed',response.status);
    }catch{return put(kind,ref,eventRef,'uncertain');}
    finally{clearTimeout(timeout);}
  }
  function notify(kind,record,saved=true){
    if(!Object.hasOwn(labels,kind)||!record?.id)return Promise.resolve(null);
    const ref=record.id,eventRef=kind==='reservation'?reservationRef(record):ref;
    const previous=result(kind,eventRef);
    if(previous)return Promise.resolve(previous); // never auto-resend an existing event
    if(!saved)return Promise.resolve(put(kind,ref,eventRef,'local-error'));
    const params=build(kind,record,lang());
    globalThis.SkyCatCloud?.submit(kind,eventRef,params);
    if(!configured())return Promise.resolve(put(kind,ref,eventRef,'disabled'));
    if(!['http:','https:'].includes(location.protocol))return Promise.resolve(put(kind,ref,eventRef,'serve'));
    put(kind,ref,eventRef,'queued');
    const task=queue.then(()=>sendRequest(kind,ref,eventRef,params));
    queue=task.catch(()=>put(kind,ref,eventRef,'uncertain'));
    return queue;
  }
  globalThis.SkyCatEmail=Object.freeze({KEY,configured,notify,notice,bind,refresh,history,labels,reservationRef});
  globalThis.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)refresh();});
  globalThis.addEventListener('skycat:cloud-status',refresh);
  if(typeof MutationObserver==='function')new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  refresh();
})();
