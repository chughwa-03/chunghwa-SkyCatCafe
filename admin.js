/* V30.1 Admin Studio — server auth or local-only test access. */
(() => {
  'use strict';
  const S=globalThis.SkyCatStore,$=s=>document.querySelector(s);
  const G=globalThis.SkyCatGoodsCommerce;
  let goodsStorage;try{goodsStorage=localStorage;}catch{}
  const goods=G.createStore(globalThis.SkyCatGoodsCatalog,goodsStorage);
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const money=n=>Number(n||0).toLocaleString('ko-KR')+'원';
  const datetime=at=>Number.isFinite(at)&&Number.isFinite(new Date(at).getTime())?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'short',timeStyle:'short'}).format(new Date(at)):'—';
  const statuses=['주문 접수','제조 중','제조 완료','수령 완료'];
  const categories={coffee:'커피',drink:'음료',dessert:'디저트'};
  const topics={taste:'메뉴 맛',space:'공간 분위기',kindness:'서비스',cats:'고양이 교감'};
  const week=['일','월','화','수','목','금','토'];
  const sections=[
    ['cloud','공용 접수 대시보드','Supabase 공용 데이터'],
    ['dashboard','관리자 대시보드','운영 현황'],['orders','주문 관리','운영 현황'],['status','주문 상태 관리','운영 현황'],
    ['menu','메뉴 관리','상품 운영'],['stock','품절 관리','상품 운영'],['price','가격 관리','상품 운영'],
    ['reservations','예약 관리','방문 운영'],['seats','좌석 관리','방문 운영'],['sales','매출 통계','통계'],
    ['bundles','세트 메뉴 관리','상품 운영'],['member','멤버십 관리','고객 관리'],['gifts','기프트 쿠폰 관리','고객 관리'],
    ['notices','공지사항 관리','콘텐츠'],['inquiries','고객 문의 관리','고객 관리'],['reviews','리뷰 관리','고객 관리'],
    ['satisfaction','방문 만족도 통계','통계'],['hours','영업시간 관리','방문 운영'],['inventory','재고 관리','상품 운영'],
    ['crowd','혼잡도 관리','방문 운영'],['faq','FAQ 관리','콘텐츠'],
    ['goods-products','굿즈 상품 관리','굿즈 운영'],['goods-stock','굿즈 재고 관리','굿즈 운영'],['goods-orders','굿즈 주문 관리','굿즈 운영']
  ];
  const descriptions={dashboard:'오늘의 주문과 예약, 운영 현황을 한눈에 확인하세요.',orders:'접수된 가상 주문의 내역과 취소 상태를 확인하세요.',status:'접수부터 수령까지 주문 진행 단계를 관리하세요.',menu:'메뉴의 이름과 분류, 가격, 설명 및 표시 상태를 편집하세요.',stock:'판매 중지 및 재판매 여부를 관리하세요.',price:'고객 화면과 연동되는 메뉴 가격을 변경하세요.',reservations:'방문 예약을 확인하고 승인 또는 변경하세요.',seats:'창가석과 테이블석의 이용 가능 상태를 관리하세요.',sales:'기간별 가상 주문 금액과 주문 건수를 확인하세요.',bundles:'음료와 디저트 세트 조합 및 할인 금액을 관리하세요.',member:'스탬프, 쿠폰 수치와 적립 내역을 확인하세요.',gifts:'가상 기프트 코드를 발행하고 사용 상태를 확인하세요.',notices:'고객 화면에 표시할 카페 소식을 관리하세요.',inquiries:'접수된 고객 문의를 확인하고 답변하세요.',reviews:'방문 후기를 확인하고 표시 여부를 관리하세요.',satisfaction:'별점 및 만족 분야별 통계를 확인하세요.',hours:'영업시간과 정기 휴무일을 설정하세요.',inventory:'상품 수량과 원재료 재고를 관리하세요.',crowd:'자동 또는 수동으로 매장 혼잡도를 설정하세요.',faq:'자주 묻는 질문을 등록하고 수정하세요.'};
  Object.assign(descriptions,{'goods-products':globalThis.SkyCatGoodsCatalog.length+'종 굿즈 이름, 가격 및 판매 여부를 관리합니다.','goods-stock':'굿즈 재고를 조정하고 품절 및 판매 상태를 확인합니다.','goods-orders':'굿즈 주문 접수, 상품 준비, 배송 및 취소를 관리합니다.'});
  descriptions.cloud='다른 기기에서 접수된 카페·굿즈·예약·문의를 확인하고 처리 상태를 변경합니다.';
  let conf,exp,member,menus,active='cloud',period='day',filter='',goodsRevision=0;
  const navEntries=[],navGroups=[],tableQueries=new Map();
  let navOpen=false,baseline='',dirty=false;
  const cloud=globalThis.SkyCatCloud;
  const demo=globalThis.SkyCatAdminTestConfig||{};
  const localOrigin=()=>(location.protocol==='file:'&&!location.hostname)||(['http:','https:'].includes(location.protocol)&&['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname));
  const demoUsable=()=>demo.enabled===true&&typeof demo.email==='string'&&!!demo.email.trim()&&typeof demo.password==='string'&&!!demo.password&&!globalThis.SkyCatCloudConfig?.enabled&&!cloud?.usable()&&localOrigin();
  const canLogin=()=>!!cloud?.usable()||demoUsable();
  let authMode=null;
  let signedIn=false,authBusy=false,cloudBusy=false,cloudEpoch=0,cloudFilter='all';
  const snapshot=()=>JSON.stringify([S.config(),S.experience(),S.member(),goods.revision()]);
  const reloadData=()=>{conf=S.config();exp=S.experience();member=S.member();menus=S.allMenus(conf);goodsRevision=goods.revision();baseline=JSON.stringify([conf,exp,member,goodsRevision]);dirty=false;};
  const name=id=>menus.find(m=>m.id===id)?.name||id;
  function message(text,error=false){const box=$('#notification');box.textContent=(error?'확인 필요 · ':'✓ ')+text;box.classList.toggle('error',error);}
  function save(which,text){
    if(!signedIn){message('관리자 로그인이 필요합니다.',true);return false;}
    if(snapshot()!==baseline){message('다른 화면에서 운영 정보가 변경되었습니다. 최신 정보 불러오기 후 다시 수정해 주세요.',true);return false;}
    let ok=true;
    if(which.includes('c'))ok=S.saveConfig(conf)&&ok;
    if(which.includes('e'))ok=S.saveExperience(exp)&&ok;
    if(which.includes('m'))ok=S.saveMember(member)&&ok;
    if(!ok){message('저장할 수 없습니다. 브라우저 저장소 설정을 확인하세요.',true);return false;}
    render();message(text);return true;
  }
  const button=(label,fn,cls='')=>{const b=el('button',cls,label);b.type='button';b.addEventListener('click',()=>{if(signedIn)fn();});return b;};
  const input=(type,value='',min,max)=>{const n=el('input');n.type=type;n.value=value;if(min!==undefined)n.min=min;if(max!==undefined)n.max=max;return n;};
  function select(values,initial){const n=el('select');for(const [v,t] of values){const o=el('option','',t);o.value=v;n.append(o);}if(initial!==undefined)n.value=String(initial);else if(values.length)n.value=String(values[0][0]);return n;}
  const label=(caption,control)=>{const l=el('label','field',caption);l.append(control);return l;};
  const actions=(...nodes)=>{const d=el('div','actions');d.append(...nodes);return d;};
  const hint=text=>el('p','hint',text);
  const pill=(text,cls='')=>el('span','tag '+cls,text);
  const empty=text=>el('div','empty',text);
  function panel(title,...nodes){const p=el('section','panel');p.append(el('h2','',title),...nodes);return p;}
  function formGrid(...nodes){const d=el('div','form-grid');d.append(...nodes);return d;}
  function table(headers,rows){
    if(!rows.length)return empty('아직 데이터가 없습니다.');
    const wrap=el('div','table-scroll'),t=el('table'),thead=el('thead'),head=el('tr'),body=el('tbody');
    wrap.tabIndex=0;wrap.setAttribute('aria-label','데이터 표 · 좌우 스크롤 가능');
    headers.forEach(h=>{const th=el('th','',h);th.scope='col';head.append(th);});thead.append(head);
    const records=[];
    for(const row of rows){const tr=el('tr');for(const value of row){const td=el('td');if(value instanceof Node)td.append(value);else td.textContent=String(value??'—');tr.append(td);}body.append(tr);records.push({tr,text:row.map(v=>v instanceof Node?(v.textContent||v.value||''):String(v??'')).join(' ').toLowerCase()});}
    t.append(thead,body);wrap.append(t);
    if(rows.length<6||['orders','status','sales','satisfaction'].includes(active))return wrap;
    const key=active+'|'+headers.join('|'),root=el('div','table-container'),tools=el('div','table-tools'),search=el('input','table-search'),count=el('span','table-count');
    search.type='search';search.placeholder='표에서 검색';search.setAttribute('aria-label','표 행 검색');search.value=tableQueries.get(key)||'';count.setAttribute('aria-live','polite');
    const noMatch=empty('검색 결과가 없습니다. 검색어를 변경해 주세요.');noMatch.hidden=true;
    const apply=()=>{const q=search.value.trim().toLowerCase();tableQueries.set(key,search.value);let visible=0;for(const r of records){r.tr.hidden=!!q&&!r.text.includes(q);if(!r.tr.hidden)visible++;}count.textContent=visible+' / '+rows.length+'건';noMatch.hidden=visible!==0;wrap.hidden=visible===0;};
    search.addEventListener('input',apply);const clear=button('초기화',()=>{search.value='';apply();search.focus();});const filterBox=el('div','table-filter');filterBox.append(search,clear);tools.append(filterBox,count);root.append(tools,wrap,noMatch);apply();return root;
  }
  function cards(data){const grid=el('div','cards');for(const [title,value,sub] of data){const c=el('div','metric');c.append(el('span','',title),el('strong','',value),el('small','',sub||''));grid.append(c);}return grid;}
  function chart(rows){const result=el('div'),max=Math.max(1,...rows.map(x=>x[1]));for(const [text,num,value] of rows){const row=el('div','chart-row'),bar=el('div','chart-bar'),fill=el('i');fill.style.width=(num/max*100)+'%';bar.append(fill);row.append(el('span','',text),bar,el('strong','',value??String(num)));result.append(row);}return result;}
  function activeOrders(){return exp.orders.filter(o=>!o.cancelled);}
  function bookings(){return S.reservations(exp);}
  function mailPanel(){
    const api=globalThis.SkyCatEmail;
    const status={disabled:'미설정 · 미발송',queued:'대기',sending:'발송 중',sent:'요청 성공',failed:'실패',uncertain:'결과 미확인','local-error':'저장 실패 · 미발송',serve:'HTTP(S) 필요'};
    const rows=api?.history()||[];
    const p=panel('EmailJS 운영 알림',
      hint(api?.configured()?'설정값 입력 완료 · 실제 발송 여부는 아래 기록과 EmailJS History에서 확인하세요.':'미연결 · emailjs-config.js에 공개 설정값을 입력하면 알림을 사용할 수 있습니다.'),
      hint('이 브라우저의 최근 100건까지만 표시합니다. 실제 주문·예약 및 결제 기능은 아닙니다.'),
      table(['발생 시간 (KST)','알림 유형','접수 번호','이메일 상태'],rows.map(r=>[datetime(r.at),api.labels[r.kind]||r.kind,r.ref,pill(status[r.status]||'—',r.status==='sent'?'blue':['failed','uncertain','local-error','serve'].includes(r.status)?'bad':'')]))
    );
    p.id='skycat-admin-email-panel';return p;
  }
  function refreshMailPanel(){
    const old=$('#skycat-admin-email-panel');if(signedIn&&active==='dashboard'&&old)old.replaceWith(mailPanel());
  }
  function dashboard(){
    const today=S.day(),orders=activeOrders().filter(o=>S.day(o.at)===today),rev=orders.reduce((n,o)=>n+Number(o.total||0),0);
    const todayBookings=bookings().filter(r=>r.date===today&&r.status!=='cancelled');
    const goodOrders=goods.history().filter(o=>o.status!=='cancelled'&&S.day(Date.parse(o.date))===today);
    const goodsRev=goodOrders.reduce((sum,o)=>sum+o.total,0);
    const welcome=el('section','dashboard-welcome'),intro=el('div');intro.append(el('span','eyebrow','TODAY AT SKY CAT'),el('h2','','오늘의 카페 운영 현황'),el('p','','예약부터 주문까지, 필요한 업무를 바로 확인하세요.'));welcome.append(intro,el('span','welcome-date',today+' · KST'));
    const tasks=el('div','task-list');for(const [id,label,count,desc] of [['status','진행 중 주문',activeOrders().filter(o=>o.step<3).length,'접수 및 제조 상태를 확인합니다.'],['reservations','승인 대기 예약',bookings().filter(r=>r.status==='pending').length,'방문 일정과 좌석을 확인합니다.'],['inquiries','미답변 문의',exp.inquiries.filter(q=>!q.reply).length,'고객 문의에 답변합니다.'],['stock','품절 메뉴',menus.filter(m=>!m.archived&&!S.available(m.id,conf,exp)).length,'판매 상태를 확인합니다.']]){const card=button('',()=>{location.hash=id;},'task-card'+(count?' has-work':''));card.append(el('span','',label),el('b','',count+(id==='stock'?'종':'건')+' ›'),el('small','',desc));tasks.append(card);}
    const analysis=el('div','dashboard-grid');analysis.append(panel('최근 7일 통합 가상 주문액',hint('카페 + 굿즈 · 취소 제외 · 한국 시간 기준'),chart(salesRows('day').map(x=>[x.label,x.total,money(x.total)]))),panel('처리해야 할 업무',hint('항목을 선택하면 해당 관리 화면으로 이동합니다.'),tasks));
    const quick=el('div','quick-links');for(const [id,label] of [['orders','주문 내역 ↗'],['price','가격 관리 ↗'],['reservations','예약 관리 ↗'],['notices','공지 등록 ↗']])quick.append(button(label,()=>{location.hash=id;}));
    return [welcome,
      cards([['오늘 통합 주문액',money(rev+goodsRev),'카페 '+money(rev)+' · 굿즈 '+money(goodsRev)],['오늘 주문',orders.length+goodOrders.length+'건','카페 '+orders.length+'건 · 굿즈 '+goodOrders.length+'건'],['오늘 예약',todayBookings.length+'건','승인 및 대기'],['좌석 사용 제한',conf.blockedSeats.length+' / '+S.seats.length,'관리자 설정']]),
      panel('굿즈 운영 요약',cards([['오늘 굿즈 주문액',money(goodsRev)],['오늘 굿즈 주문',goodOrders.length+'건'],['판매 가능 굿즈',goods.list().filter(p=>p.available).length+'종'],['배송 진행 중',goods.history().filter(o=>['received','packing','shipping'].includes(o.status)).length+'건']]),actions(button('굿즈 주문 관리',()=>{location.hash='goods-orders';}),button('굿즈 상품 관리',()=>{location.hash='goods-products';}),button('굿즈 재고 관리',()=>{location.hash='goods-stock';}))),
      analysis,panel('빠른 관리',quick),mailPanel(),
      panel('운영 요약',cards([['제조 중',activeOrders().filter(o=>o.step===1).length+'건'],['판매 가능 메뉴',menus.filter(m=>!m.archived&&S.available(m.id,conf,exp)).length+'종'],['가상 후기',exp.reviews.filter(r=>!r.hidden).length+'건'],['가상 기프트 잔액',money(exp.giftBalance)]]),hint('실제 영업 데이터가 아닌 동일 브라우저 내 고객의 시연 기록입니다.'))
    ];
  }
  function orderTable(statusMode){
    const data=exp.orders.filter(o=>!filter||o.id.includes(filter.toUpperCase())||o.items?.some(x=>(x.name||name(x.id)).includes(filter)));
    const search=input('search',filter);search.placeholder='주문번호 또는 메뉴 검색';search.addEventListener('change',()=>{filter=search.value.trim();render();});
    return panel(statusMode?'주문 진행 상태 변경':'가상 주문 내역',hint('고객은 상태 확인만 가능하며, 취소된 주문은 매출에서 제외합니다.'),actions(search,button('검색',()=>{filter=search.value.trim();render();}),button('초기화',()=>{filter='';render();})),table(['주문번호 / 시간','상품','결제 합계','상태','관리'],data.map(o=>{
      const status=o.cancelled?pill('취소','bad'):pill(statuses[o.step]||statuses[0],o.step===3?'':'blue');
      const state=select(statuses.map((v,i)=>[String(i),v]),o.step||0);state.disabled=!!o.cancelled;
      const change=button('상태 저장',()=>{o.step=Number(state.value);save('e','주문 상태를 변경했습니다.');},'primary');change.disabled=!!o.cancelled;
      const cancel=button('주문 취소',()=>{
        if(!confirm('이 시연 주문을 취소하시겠습니까? 주문액에서 제외하고, 제한 재고와 기프트 잔액을 복구합니다.'))return;
        if(o.cancelled||o.step===3)return;o.cancelled=true;o.cancelledAt=Date.now();
        exp.giftBalance=Math.min(400000,Number(exp.giftBalance||0)+Number(o.giftDiscount||0));
        if(o.discount){member.coupons=Math.min(999,member.coupons+1);exp.memberLog.unshift({kind:'adjust',id:o.id,at:Date.now()});}
        for(const x of o.items||[]){const n=S.quantity(x.id,conf);if(Number.isFinite(n))conf.inventory[x.id]=n+x.n;}
        save('cem','가상 주문 취소 완료 · 재고/기프트 복구 · 스탬프는 멤버십에서 조정 가능');
      },'danger');cancel.disabled=o.cancelled||o.step===3;
      return [o.id+'\n'+datetime(o.at),(o.items||[]).map(x=>(x.name||name(x.id))+' × '+x.n).join(' · '),money(o.total),status,statusMode?actions(state,change):actions(cancel,button('상태 관리',()=>{location.hash='status';}))];
    })));
  }
  function menuEditor(){
    const title=input('text'),price=input('number',4500,1,1000000),group=select(Object.entries(categories)),desc=el('textarea');title.maxLength=60;desc.maxLength=300;price.step=100;
    let editing=null;
    const form=panel('메뉴 등록 및 수정',formGrid(label('메뉴 이름',title),label('분류',group),label('기본 가격 (원)',price),label('설명',desc)));
    const saveBtn=button('메뉴 추가',()=>{
      const n=Number(price.value);if(!title.value.trim()||!Number.isInteger(n)||n<1||n>1000000){message('메뉴명과 1~1,000,000원 가격을 확인하세요.',true);return;}
      const item={name:title.value.trim(),price:n,group:group.value,description:desc.value.trim()};
      if(editing){if(conf.added[editing])conf.added[editing]={...item,id:editing};else conf.overrides[editing]=item;}
      else{const id='a'+Date.now().toString(36);conf.added[id]={...item,id};}
      save('c',editing?'메뉴를 수정했습니다.':'메뉴를 추가했습니다.');
    },'primary');
    form.append(actions(saveBtn,button('입력 초기화',()=>render())),hint('원본 32종 메뉴 이미지는 브랜드 디자인 시안으로 보존됩니다. 등록·수정 후 고객 주문은 최신 목록을 사용합니다.'));
    const rows=menus.map(m=>[m.id,m.name,categories[m.group],money(m.price),m.archived?pill('숨김','bad'):pill('표시'),actions(button('편집',()=>{editing=m.id;title.value=m.name;group.value=m.group;price.value=m.price;desc.value=m.description||'';saveBtn.textContent='수정 저장';title.focus();form.scrollIntoView({block:'start'});}),button(m.archived?'복원':'숨김(삭제)',()=>{if(m.archived)conf.archived=conf.archived.filter(id=>id!==m.id);else{conf.archived.push(m.id);exp.cart=exp.cart.filter(x=>x.id!==m.id);}save('ce','메뉴 표시 상태를 변경했습니다.');},m.archived?'':'danger'))]);
    return [form,panel('상품 목록 ('+menus.length+'종)',table(['ID','메뉴','분류','가격','표시','관리'],rows))];
  }
  function stockManager(){
    return panel('판매 상태 관리',hint('판매 중지는 고객 장바구니에서 상품을 제거합니다. 재고가 0이면 판매 재개 후에도 주문 불가입니다.'),table(['메뉴','현재 재고','판매 상태','변경'],menus.filter(m=>!m.archived).map(m=>{
      const blocked=exp.stock.includes(m.id),qty=S.quantity(m.id,conf);
      return [m.name,Number.isFinite(qty)?qty:'제한 없음',S.available(m.id,conf,exp)?pill('판매 중'):pill('품절','bad'),button(blocked?'판매 재개':'품절 설정',()=>{if(blocked)exp.stock=exp.stock.filter(id=>id!==m.id);else{exp.stock.push(m.id);exp.cart=exp.cart.filter(x=>x.id!==m.id);}save('e','판매 상태를 변경했습니다.');},blocked?'primary':'danger')];
    })));
  }
  function priceManager(){
    return panel('메뉴 가격 관리',hint('저장하면 고객의 이미지 메뉴판·장바구니·결제 합계에 새 가격이 반영됩니다. 이미 완료된 주문의 단가 및 합계는 보존합니다.'),table(['메뉴','현재 가격','새 가격','저장'],menus.filter(m=>!m.archived).map(m=>{
      const p=input('number',m.price,1,1000000);p.step=100;return [m.name,money(m.price),p,button('저장',()=>{const n=Number(p.value);if(!Number.isInteger(n)||n<1||n>1000000){message('가격을 확인하세요.',true);return;}if(conf.added[m.id])conf.added[m.id].price=n;else conf.overrides[m.id]={...conf.overrides[m.id],price:n};save('c','상품 가격을 변경했습니다.');},'primary')];
    })));
  }
  function syncBooking(r){
    exp.reservations=bookings().filter(x=>x.id!==r.id);exp.reservations.unshift({...r});
    if(exp.reservation&&(exp.reservation.id||'legacy-reservation')===r.id)exp.reservation=r.status==='cancelled'?null:{...r};
  }
  function reservationValid(r){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(r.time)||!Number.isInteger(r.people)||r.people<1||r.people>6)return false;
    const at=Date.parse(r.date+'T00:00:00Z'),[h,m]=r.time.split(':').map(Number),mins=h*60+m;
    const today=S.day(),end=new Date(Date.parse(today+'T00:00:00Z')+90*86400000).toISOString().slice(0,10);
    const now=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).split(':').map(Number);
    if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,10)!==r.date||r.date<today||r.date>end||conf.hours.closed.includes(new Date(at).getUTCDay())||mins<conf.hours.open||mins>=conf.hours.close||(r.date===today&&mins<=now[0]*60+now[1]))return false;
    const seat=S.seats.find(x=>x.id===r.table);if(!seat||seat.capacity<r.people||conf.blockedSeats.includes(r.table))return false;
    const prior=bookings().find(x=>x.id===r.id);
    if(!(prior&&prior.date===r.date&&prior.time===r.time&&prior.table===r.table)&&S.demoSeatOccupied(r.table,r.date,r.time))return false;
    return !bookings().some(x=>x.id!==r.id&&x.status!=='cancelled'&&x.date===r.date&&x.time===r.time&&x.table===r.table);
  }
  function reservationManager(){
    return panel('예약 승인 · 변경 · 취소',hint('고객이 신청한 로컬 가상 예약입니다. 동일 시간·좌석 중복, 정기 휴무 및 인원 초과를 확인합니다.'),table(['예약 ID','날짜 / 시간','인원 / 좌석','상태','관리'],bookings().map(r=>{
      const cancelled=r.status==='cancelled',date=input('date',r.date),time=input('time',r.time);time.step=1800;
      const people=select([1,2,3,4,5,6].map(n=>[n,n+'명']),r.people),seat=select(S.seats.map(s=>[s.id,s.id+' ('+s.capacity+'석)']),r.table);
      const change=button('변경 저장',()=>{const n={...r,date:date.value,time:time.value,people:Number(people.value),table:seat.value,seat:S.seats.find(x=>x.id===seat.value)?.type};if(!reservationValid(n)){message('날짜·시간·좌석·인원 또는 중복 예약을 확인하세요.',true);return;}syncBooking(n);save('e','예약을 변경했습니다.');},'primary');
      const approve=button('승인',()=>{const n={...r,status:'approved'};if(!reservationValid(n)){message('승인 가능한 좌석과 시간을 확인하세요.',true);return;}syncBooking(n);save('e','예약을 승인했습니다.');});
      const cancel=button('취소',()=>{syncBooking({...r,status:'cancelled'});save('e','예약을 취소했습니다.');},'danger');
      [date,time,people,seat,change,approve,cancel].forEach(n=>n.disabled=cancelled);if(r.status==='approved')approve.disabled=true;
      return [r.id,actions(date,time),actions(people,seat),pill(cancelled?'취소':r.status==='approved'?'승인':'대기',cancelled?'bad':r.status==='approved'?'':'wait'),actions(change,approve,cancel)];
    })));
  }
  function seatManager(){
    const grid=el('div','seat-grid');for(const seat of S.seats){const blocked=conf.blockedSeats.includes(seat.id),b=button(seat.id+' · '+seat.capacity+'석\n'+(blocked?'이용 제한':'이용 가능'),()=>{conf.blockedSeats=blocked?conf.blockedSeats.filter(id=>id!==seat.id):[...conf.blockedSeats,seat.id];save('c','좌석 상태를 변경했습니다.');},blocked?'blocked':'');grid.append(b);}
    return panel('좌석 운영 배치도',hint('창가 W1~W3 / 테이블 T1~T4 · 제한 좌석은 고객의 신규 예약 목록에서 제외됩니다. 기존 예약은 예약 관리에서 처리하세요.'),grid);
  }
  function salesRows(mode){
    const today=new Date(S.day()+'T00:00:00Z'),rows=[];
    if(mode==='day'){for(let i=6;i>=0;i--){const d=new Date(today);d.setUTCDate(d.getUTCDate()-i);const key=d.toISOString().slice(0,10);rows.push({label:key.slice(5),match:o=>S.day(o.at)===key});}}
    else if(mode==='week'){for(let i=3;i>=0;i--){const end=new Date(today);end.setUTCDate(end.getUTCDate()-7*i);const begin=new Date(end);begin.setUTCDate(begin.getUTCDate()-6);const a=begin.toISOString().slice(0,10),b=end.toISOString().slice(0,10);rows.push({label:a.slice(5)+'~'+b.slice(5),match:o=>S.day(o.at)>=a&&S.day(o.at)<=b});}}
    else{for(let i=5;i>=0;i--){const d=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth()-i,1)),k=d.toISOString().slice(0,7);rows.push({label:k,match:o=>S.day(o.at).startsWith(k)});}}
    const goodsOrders=goods.history().filter(o=>o.status!=='cancelled').map(o=>({...o,at:Date.parse(o.date)}));
    return rows.map(r=>{const o=activeOrders().filter(r.match),g=goodsOrders.filter(r.match);const cafeTotal=o.reduce((n,x)=>n+Number(x.total||0),0),goodsTotal=g.reduce((n,x)=>n+x.total,0);return {label:r.label,count:o.length+g.length,cafeCount:o.length,goodsCount:g.length,cafeTotal,goodsTotal,total:cafeTotal+goodsTotal};});
  }
  function salesManager(){
    const sel=select([['day','일별 7일'],['week','주별 4주'],['month','월별 6개월']],period);sel.addEventListener('change',()=>{period=sel.value;render();});
    const rows=salesRows(period),sum=k=>rows.reduce((n,r)=>n+r[k],0);
    return panel('카페 · 굿즈 통합 매출 통계',hint('취소 주문 제외 · 주문 시점 금액 기준 · 카페는 배송비 포함, 굿즈 배송비 없음 · 실제 매출 아님'),actions(sel),
      cards([['카페 주문액',money(sum('cafeTotal')),sum('cafeCount')+'건'],['굿즈 주문액',money(sum('goodsTotal')),sum('goodsCount')+'건'],['통합 주문액',money(sum('total')),sum('count')+'건']]),
      chart(rows.map(r=>[r.label,r.total,money(r.total)])),table(['기간','카페 주문/매출','굿즈 주문/매출','통합 주문/매출'],rows.map(r=>[r.label,r.cafeCount+'건 / '+money(r.cafeTotal),r.goodsCount+'건 / '+money(r.goodsTotal),r.count+'건 / '+money(r.total)])));
  }
  function bundleManager(){
    const eligible=menus.filter(m=>!m.archived),title=input('text'),first=select(eligible.filter(m=>m.group!=='dessert').map(m=>[m.id,m.name])),second=select(eligible.filter(m=>m.group==='dessert').map(m=>[m.id,m.name])),off=input('number',700,0,1000000);let editing=null;
    const form=panel('세트 구성 · 할인액 설정',formGrid(label('세트명',title),label('음료',first),label('디저트',second),label('할인액 (원)',off)));
    const submit=button('세트 등록',()=>{const a=menus.find(m=>m.id===first.value),b=menus.find(m=>m.id===second.value),n=Number(off.value);
      if(!title.value.trim()||!a||!b||!Number.isInteger(n)||n<0||n>=a.price+b.price||conf.bundles.some(x=>x.id!==editing&&x.ids.some(id=>[a.id,b.id].includes(id)))){message('세트명·가격·메뉴 중복을 확인하세요. 한 메뉴는 한 세트에 포함됩니다.',true);return;}
      const row={id:editing||S.key('B'),ids:[a.id,b.id],name:[title.value.trim(),title.value.trim(),title.value.trim()],off:n};
      conf.bundles=editing?conf.bundles.map(x=>x.id===editing?row:x):[...conf.bundles,row];save('c','세트 메뉴를 저장했습니다.');
    },'primary');form.append(actions(submit,button('초기화',()=>render())));
    return [form,panel('세트 목록',table(['세트명','구성','할인','관리'],conf.bundles.map(b=>[b.name[0],b.ids.map(name).join(' + '),money(b.off),actions(button('편집',()=>{editing=b.id;title.value=b.name[0];first.value=b.ids[0];second.value=b.ids[1];off.value=b.off;submit.textContent='변경 저장';title.focus();}),button('삭제',()=>{conf.bundles=conf.bundles.filter(x=>x.id!==b.id);save('c','세트 메뉴를 삭제했습니다.');},'danger'))])))];
  }
  function memberManager(){
    const stamps=input('number',member.stamps,0,4),coupons=input('number',member.coupons,0,999);
    return [cards([['현재 스탬프',member.stamps+' / 5'],['보유 쿠폰',member.coupons+'장'],['적립 기록',exp.memberLog.length+'건'],['회원 범위','로컬 1명','실제 계정 없음']]),panel('멤버십 수치 조정',hint('기존 5회 주문 → 쿠폰 1장 규칙 유지. 브라우저의 시연 회원 상태를 관리합니다.'),formGrid(label('스탬프 (0~4)',stamps),label('쿠폰 (0~999)',coupons)),button('수치 저장',()=>{const s=Number(stamps.value),c=Number(coupons.value);if(!Number.isInteger(s)||s<0||s>4||!Number.isInteger(c)||c<0||c>999){message('허용된 수치를 입력하세요.',true);return;}member={stamps:s,coupons:c};exp.memberLog.unshift({kind:'adjust',id:S.key('ADMIN'),at:Date.now()});save('me','멤버십을 조정했습니다.');},'primary')),panel('적립 · 사용 기록',table(['시간','종류','주문번호'],exp.memberLog.map(x=>[datetime(x.at),({stamp:'스탬프 적립',reward:'쿠폰 지급',use:'쿠폰 사용',adjust:'관리자 조정'})[x.kind]||x.kind,x.id])))];
  }
  function giftsManager(){
    const val=select([[3000,'3,000원'],[5000,'5,000원'],[10000,'10,000원']]);
    return [panel('가상 기프트 발행',hint('실제 유효한 상품권이 아닙니다. 발행한 코드를 고객 페이지에서 입력해 등록할 수 있습니다.'),actions(val,button('코드 발행',()=>{if(exp.giftCodes.length>=40){message('기프트 코드 저장 한도 40개입니다.',true);return;}exp.giftCodes.unshift({code:S.key('SKY'),value:Number(val.value),used:false,revoked:false});save('e','가상 코드를 발행했습니다.');},'primary')),el('p','','등록된 가상 기프트 잔액: '+money(exp.giftBalance))),panel('기프트 코드 목록',table(['코드','금액','상태','관리'],exp.giftCodes.map(g=>{
      const code=input('text',g.code);code.readOnly=true;code.addEventListener('focus',()=>code.select());
      const revoke=button('폐기',()=>{g.revoked=true;save('e','미사용 기프트 코드를 폐기했습니다.');},'danger');revoke.disabled=g.used||g.revoked;
      return [code,money(g.value),g.used?pill('사용 등록'):g.revoked?pill('폐기','bad'):pill('미등록','wait'),revoke];
    })))];
  }
  function textManager(field,title){
    const subject=input('text'),body=el('textarea');subject.maxLength=100;body.maxLength=500;let editing=null;
    const editor=panel(title+' 등록 · 수정',formGrid(label('제목',subject),label('내용',body)));
    const saveBtn=button('등록',()=>{if(!subject.value.trim()||!body.value.trim()){message('제목과 내용을 입력하세요.',true);return;}const row={id:editing||S.key(field==='faq'?'F':'N'),title:subject.value.trim(),body:body.value.trim()};conf[field]=editing?conf[field].map(x=>x.id===editing?row:x):[row,...conf[field]];save('c',title+' 저장 완료');},'primary');
    editor.append(actions(saveBtn,button('초기화',()=>render())),hint('관리자가 작성한 내용은 입력한 언어 그대로 고객 페이지에 표시됩니다.'));
    const list=panel(title+' 목록');for(const item of conf[field]){const row=el('div','list-row');row.append(el('strong','',item.title),el('p','hint',item.body),actions(button('수정',()=>{editing=item.id;subject.value=item.title;body.value=item.body;saveBtn.textContent='수정 저장';subject.focus();}),button('삭제',()=>{conf[field]=conf[field].filter(x=>x.id!==item.id);save('c',title+' 삭제 완료');},'danger')));list.append(row);}if(!conf[field].length)list.append(empty('등록된 게시물이 없습니다.'));
    return [editor,list];
  }
  function inquiryManager(){
    const p=panel('문의 내역 및 답변',hint('개인정보가 아닌 가상 문의만 다룹니다. 답변은 고객 페이지의 문의 내역에 표시됩니다.'));
    if(!exp.inquiries.length)p.append(empty('문의 내역이 없습니다.'));
    for(const q of exp.inquiries){const row=el('div','list-row'),reply=el('textarea');reply.value=q.reply||'';reply.maxLength=500;row.append(el('strong','',q.id+' · '+q.category+' · '+datetime(q.at)),pill(q.reply?'답변 완료':'답변 대기',q.reply?'':'wait'),el('p','',q.body),label('관리자 답변',reply),actions(button('답변 저장',()=>{if(!reply.value.trim()){message('답변을 입력하세요.',true);return;}q.reply=reply.value.trim();q.status='answered';save('e','문의에 답변했습니다.');},'primary')));p.append(row);}
    return p;
  }
  function reviewsManager(){
    return panel('가상 후기 공개 상태 관리',hint('후기를 숨기면 고객 화면과 만족도 통계에서 제외합니다. 복원할 수 있습니다.'),table(['시간','별점','분야','상태','관리'],exp.reviews.map(r=>[datetime(r.at),'★'.repeat(r.rating),topics[r.topic]||r.topic,pill(r.hidden?'숨김':'표시',r.hidden?'bad':''),button(r.hidden?'다시 표시':'숨김',()=>{r.hidden=!r.hidden;save('e','후기 표시 상태를 변경했습니다.');},r.hidden?'primary':'danger')])));
  }
  function reviewStats(){
    const rows=exp.reviews.filter(r=>!r.hidden),avg=rows.length?rows.reduce((n,r)=>n+r.rating,0)/rows.length:0;
    return [cards([['평균 별점',avg.toFixed(1)+' / 5'],['후기 수',rows.length+'건'],['긍정 4~5점',rows.filter(r=>r.rating>=4).length+'건'],['숨김 후기',exp.reviews.length-rows.length+'건']]),panel('별점 분포',chart([5,4,3,2,1].map(i=>[i+'점',rows.filter(r=>r.rating===i).length]))),panel('만족 분야',chart(Object.keys(topics).map(k=>[topics[k],rows.filter(r=>r.topic===k).length])))];
  }
  function hoursManager(){
    const open=input('time',S.clock(conf.hours.open)),close=input('time',S.clock(conf.hours.close));open.step=1800;close.step=1800;
    const line=el('div','checkline'),checks=week.map((w,i)=>{const x=input('checkbox');x.checked=conf.hours.closed.includes(i);const l=el('label','',w+'요일');l.prepend(x);line.append(l);return x;});
    return panel('운영 시간과 정기 휴무',hint('한국 표준시 · 30분 단위 · 예약 가능 시간에 반영됩니다. 이미 접수된 예약은 예약 관리에서 처리하세요.'),formGrid(label('오픈',open),label('마감',close)),el('h3','','휴무일'),line,actions(button('영업 설정 저장',()=>{const mins=v=>{const [h,m]=v.split(':').map(Number);return h*60+m;};const a=mins(open.value),b=mins(close.value);if(!Number.isFinite(a)||!Number.isFinite(b)||a%30||b%30||a>=b){message('30분 단위로 오픈 < 마감 시간을 입력하세요.',true);return;}conf.hours={open:a,close:b,closed:checks.flatMap((x,i)=>x.checked?[i]:[])};save('c','영업시간과 휴무일을 저장했습니다.');},'primary')));
  }
  function inventoryManager(){
    const products=panel('상품별 재고',hint('공란은 수량 제한 없음. 0개는 자동 품절 처리되며 주문 완료 시 지정 재고만 차감합니다.'),table(['메뉴','수량','저장'],menus.filter(m=>!m.archived).map(m=>{const v=input('number',Number.isFinite(S.quantity(m.id,conf))?S.quantity(m.id,conf):'',0,100000);v.placeholder='제한 없음';return [m.name,v,button('저장',()=>{if(v.value==='')delete conf.inventory[m.id];else{const n=Number(v.value);if(!Number.isInteger(n)||n<0||n>100000){message('재고는 0~100,000의 정수입니다.',true);return;}conf.inventory[m.id]=n;exp.cart=exp.cart.filter(x=>x.id!==m.id||x.n<=n);}save('ce','재고 수량을 저장했습니다.');},'primary')];})));
    const material=input('text'),amount=input('number',0,0,1000000),unit=select([['g','g'],['kg','kg'],['ml','ml'],['L','L'],['개','개']]);
    const raw=panel('원재료 재고 기록',hint('원재료는 수동 재고 기록입니다. 레시피별 자동 소모는 적용하지 않았습니다.'),formGrid(label('재료명',material),label('수량',amount),label('단위',unit)),button('원재료 등록',()=>{const n=Number(amount.value);if(!material.value.trim()||!Number.isFinite(n)||n<0){message('재료명과 수량을 입력하세요.',true);return;}conf.materials.push({id:S.key('M'),name:material.value.trim(),amount:n,unit:unit.value});save('c','원재료를 등록했습니다.');},'primary'));
    raw.append(table(['재료','수량','단위','관리'],conf.materials.map(m=>{const a=input('number',m.amount,0,1000000);return [m.name,a,m.unit,actions(button('수량 저장',()=>{const n=Number(a.value);if(!Number.isFinite(n)||n<0)return message('수량을 확인하세요.',true);m.amount=n;save('c','원재료 수량을 저장했습니다.');}),button('삭제',()=>{conf.materials=conf.materials.filter(x=>x.id!==m.id);save('c','원재료를 삭제했습니다.');},'danger'))];})));
    return [products,raw];
  }
  function crowdManager(){
    const val=input('number',conf.crowd??50,0,100),mode=select([['auto','시간 패턴 자동'],['manual','관리자 수동']],conf.crowd===null?'auto':'manual');
    return panel('혼잡도 운영 설정',hint('영업시간 외에는 고객 화면에 영업시간 외로 표시됩니다. 실제 매장 정보가 아닙니다.'),formGrid(label('혼잡도 모드',mode),label('수동 혼잡도 (%)',val)),button('혼잡도 저장',()=>{const n=Number(val.value);if(mode.value==='manual'&&(!Number.isInteger(n)||n<0||n>100)){message('0~100 사이 수치를 입력하세요.',true);return;}conf.crowd=mode.value==='auto'?null:n;save('c','혼잡도 모드를 저장했습니다.');},'primary'));
  }
  function goodsChange(fn,success){
    if(snapshot()!==baseline){message('다른 화면에서 정보가 변경되었습니다. 최신 정보 불러오기 후 다시 수정해 주세요.',true);return;}
    if(!fn()){message(goods.lastError(),true);return;}render();message(success);
  }
  function goodsProductManager(){
    const rows=goods.list().map(p=>{
      const nameField=input('text',p.name);nameField.className='goods-admin-name';nameField.maxLength=80;nameField.setAttribute('aria-label',p.sku+' 상품명');
      const price=input('number',p.price,1,10000000);price.step=1;price.setAttribute('aria-label',p.sku+' 가격');
      const activeField=select([['on','판매 허용'],['off','판매 중지']],p.active?'on':'off');activeField.setAttribute('aria-label',p.sku+' 판매 여부');
      const bundle=p.sku==='bundle-01';price.disabled=bundle;
      const saveBtn=button('저장',()=>{
        if(!bundle&&!price.value.trim()){message('가격을 입력하세요.',true);return;}
        const patch={name:nameField.value,active:activeField.value==='on'};
        if(!bundle)patch.price=Number(price.value);
        goodsChange(()=>goods.updateProduct(p.sku,patch,goodsRevision),'굿즈 상품 정보를 저장했습니다.');
      },'primary');
      const state=p.available?pill('판매 중'):pill(!p.active||p.componentAvailable===false?'판매 중지':'품절','bad');
      return [p.sku+'\n'+p.group,p.name,nameField,bundle?money(p.price)+' (자동 20% 할인)':price,activeField,state,saveBtn];
    });
    return panel('굿즈 상품 정보 관리',hint(rows.length+'종 상품의 이미지와 품목은 유지하고 이름·가격·판매 여부를 편집합니다. 이름 중복 불가. 키보드·마우스 세트 가격은 두 단품 합계에서 20% 할인됩니다.'),table(['SKU / 품목','현재 상품명','새 상품명','판매가 (원)','판매 설정','현재 상태','관리'],rows));
  }
  function goodsStockManager(){
    const products=goods.list();
    return panel('굿즈 재고 · 품절 관리',hint('기본 재고: 일반 상품 30개, 키보드·마우스 각 15개. 세트 재고는 단품 재고 중 작은 수량입니다. 가상 구매 시 차감, 배송 전 취소 시 복구됩니다.'),cards([['등록 상품',products.length+'종'],['품절·판매 중지',products.filter(p=>!p.available).length+'종'],['개별 상품 재고',products.filter(p=>p.sku!=='bundle-01').reduce((n,p)=>n+p.stock,0)+'개']]),table(['상품','현재 재고','새 재고','판매 상태','관리'],products.map(p=>{
      const bundle=p.sku==='bundle-01',stock=input('number',p.stock,0,1000000);stock.step=1;stock.setAttribute('aria-label',p.sku+' 재고');
      const saveBtn=button('재고 저장',()=>{if(!stock.value.trim()){message('재고를 입력하세요.',true);return;}goodsChange(()=>goods.updateProduct(p.sku,{stock:Number(stock.value)},goodsRevision),'굿즈 재고를 저장했습니다.');},'primary');
      const toggleBtn=button(p.active?'판매 중지':'판매 허용',()=>goodsChange(()=>goods.updateProduct(p.sku,{active:!p.active},goodsRevision),'판매 상태를 변경했습니다.'));
      return [p.name,p.stock+'개',bundle?'단품 연동':stock,p.available?pill('판매 중'):pill(!p.active||p.componentAvailable===false?'판매 중지':'품절','bad'),bundle?actions(toggleBtn):actions(saveBtn,toggleBtn)];
    })));
  }
  function goodsOrderManager(){
    const rows=goods.history().map(o=>{
      const next=o.status==='cancelled'?undefined:G.stages[G.stages.indexOf(o.status)+1],advance=button(next?G.statuses[next]+' 처리':'처리 완료',()=>goodsChange(()=>goods.updateOrder(o.id,next,goodsRevision),'굿즈 주문 상태를 변경했습니다.'),'primary');
      advance.disabled=!next||o.status==='cancelled'||o.status==='delivered';
      const cancel=button('주문 취소',()=>{if(confirm('이 가상 주문을 취소하시겠습니까? 차감된 재고가 있으면 복구하고 통합 매출에서 제외합니다.'))goodsChange(()=>goods.updateOrder(o.id,'cancelled',goodsRevision),Object.keys(o.deductions).length?'굿즈 주문 취소 · 재고 복구 완료':'굿즈 주문 취소 완료');},'danger');
      cancel.disabled=!['received','packing'].includes(o.status);
      return [o.id+'\n'+datetime(Date.parse(o.date)),o.items.map(i=>i.name+' × '+i.quantity+' · '+money(i.price)).join('\n'),money(o.total),pill(G.statuses[o.status],o.status==='cancelled'?'bad':o.status==='delivered'?'':'blue'),actions(advance,cancel)];
    });
    return panel('굿즈 주문 · 배송 관리',hint('주문 접수 → 상품 준비 중 → 배송 중 → 배송 완료. 접수/준비 중 취소 가능. V23까지의 기존 주문은 이전 재고 차감 기록이 없어 취소 시 재고를 복구하지 않습니다. 실제 결제 및 배송 없음.'),table(['주문번호 / 시간','주문 상품 및 단가','주문액','상태','관리'],rows));
  }
  const cloudKinds={cafe:'카페 주문',goods:'굿즈 주문',reservation:'예약',inquiry:'고객 문의'};
  const cloudStates={received:'접수',processing:'처리 중',completed:'처리 완료',cancelled:'취소'};
  function cloudDashboard(){
    if(authMode==='demo')return panel('공용 접수 · 연결 보류',hint('로컬 테스트 로그인에서는 공용 데이터베이스에 연결하지 않습니다.'),hint('같은 브라우저의 주문·예약·문의 등은 각 로컬 관리 메뉴에서 검사하세요. Supabase 연결 후에만 다른 기기의 접수를 확인할 수 있습니다.'));
    const root=el('div');root.id='cloud-inbox';root.append(hint('공용 접수 기록을 불러오는 중…'));
    const p=panel('통합 공용 접수',hint('다른 기기의 시연 접수 내역 · 최근 200건 · 실제 거래 및 매장 예약 아님'),hint('접수 내용과 금액은 방문자 브라우저에서 전송된 시연 데이터입니다. 기존 로컬 메뉴·재고 관리에는 영향을 주지 않습니다.'),root);
    queueMicrotask(()=>loadCloud());return p;
  }
  async function loadCloud(){
    const root=$('#cloud-inbox');if(!signedIn||authMode!=='cloud'||active!=='cloud'||!root||cloudBusy)return;
    const epoch=cloudEpoch;cloudBusy=true;
    try{
      const rows=await cloud.listEvents();if(!Array.isArray(rows))throw Error('Invalid response');
      if(!signedIn||epoch!==cloudEpoch||active!=='cloud'||root!==$('#cloud-inbox'))return;
      const picker=select([['all','전체'],...Object.entries(cloudKinds)],cloudFilter);
      picker.addEventListener('change',()=>{cloudFilter=picker.value;loadCloud();});
      const filtered=rows.filter(r=>cloudFilter==='all'||r.kind===cloudFilter);
      const counts=Object.keys(cloudKinds).map(k=>[cloudKinds[k],rows.filter(r=>r.kind===k).length+'건','접수 대기 '+rows.filter(r=>r.kind===k&&r.status==='received').length+'건']);
      root.replaceChildren(cards(counts),actions(label('접수 유형',picker),button('서버 새로고침',()=>loadCloud())),hint('최근 갱신: '+datetime(Date.now())+' · 30초마다 갱신'),table(['접수 번호 / 시간','유형','내용','원화 기준 합계','처리 상태'],filtered.map(r=>{
        const detail=el('div','cloud-detail',r.details),selectState=select(Object.entries(cloudStates),r.status);
        const saveBtn=button('상태 저장',async()=>{
          saveBtn.disabled=true;
          try{await cloud.updateEvent(r.id,selectState.value);if(signedIn){message('공용 접수 상태를 저장했습니다.');await loadCloud();}}
          catch{if(signedIn)message('상태 저장 실패 · 권한 또는 연결을 확인하세요.',true);}
          finally{saveBtn.disabled=false;}
        },'primary');
        return [r.reference+'\n'+datetime(Date.parse(r.created_at)),cloudKinds[r.kind]||'—',detail,r.total_krw,actions(selectState,saveBtn)];
      })));
    }catch(e){
      if(signedIn&&epoch===cloudEpoch){root.replaceChildren(hint('공용 접수 조회 실패. SQL 설정·계정 권한·네트워크를 확인하세요.'));
        if(['NOT_ADMIN','NOT_AUTHENTICATED','HTTP_401','HTTP_403'].includes(e.code))lock('관리자 권한을 다시 확인해 주세요.');}
    }finally{cloudBusy=false;if(signedIn&&active==='cloud'&&root!==$('#cloud-inbox'))queueMicrotask(loadCloud);}
  }
  const renderers={cloud:cloudDashboard,dashboard,orders:()=>orderTable(false),status:()=>orderTable(true),menu:menuEditor,stock:stockManager,price:priceManager,reservations:reservationManager,seats:seatManager,sales:salesManager,bundles:bundleManager,member:memberManager,gifts:giftsManager,notices:()=>textManager('notices','공지사항'),inquiries:inquiryManager,reviews:reviewsManager,satisfaction:reviewStats,hours:hoursManager,inventory:inventoryManager,crowd:crowdManager,faq:()=>textManager('faq','FAQ'),'goods-products':goodsProductManager,'goods-stock':goodsStockManager,'goods-orders':goodsOrderManager};
  function render(){
    if(!signedIn)return;reloadData();const current=sections.find(x=>x[0]===active)||sections[0];
    $('#title').textContent=current[1];$('#breadcrumb').textContent='관리자 / '+current[2];$('#section-desc').textContent=descriptions[current[0]];$('#notification').textContent='';
    const badges={status:activeOrders().filter(o=>o.step<3).length,reservations:bookings().filter(r=>r.status==='pending').length,inquiries:exp.inquiries.filter(q=>!q.reply).length,stock:menus.filter(m=>!m.archived&&!S.available(m.id,conf,exp)).length,'goods-orders':goods.history().filter(o=>['received','packing','shipping'].includes(o.status)).length,'goods-stock':goods.list().filter(p=>!p.available).length};
    for(const entry of navEntries){if(entry.id===active)entry.link.setAttribute('aria-current','page');else entry.link.removeAttribute('aria-current');const n=badges[entry.id]||0;entry.badge.textContent=String(n);entry.badge.hidden=!n;}
    const view=renderers[active]();const nodes=Array.isArray(view)?view:[view];
    if(active!=='cloud')nodes.unshift(el('p','cloud-local-banner',authMode==='demo'?'로컬 체험 · 테스트 로그인 모드 · 현재 브라우저의 시연 데이터만 사용합니다.':'로컬 체험 관리 · 현재 브라우저의 시연 데이터만 사용합니다. 다른 기기의 접수는 공용 접수 대시보드에서 확인하세요.'));
    $('#content').replaceChildren(...nodes);
  }
  function route(){const id=location.hash.slice(1);active=Object.hasOwn(renderers,id)?id:authMode==='demo'?'dashboard':'cloud';filter='';render();setNav(false);}
  function setNav(open){navOpen=open;$('#sidebar').classList.toggle('is-open',open);$('#nav-scrim').hidden=!open;$('#nav-toggle').setAttribute('aria-expanded',String(open));$('#nav-toggle').setAttribute('aria-label',open?'관리자 메뉴 닫기':'관리자 메뉴 열기');$('#nav-toggle').textContent=open?'×':'☰';}
  function filterNav(){const query=$('#nav-search').value.trim().toLowerCase();let count=0;for(const entry of navEntries){entry.link.hidden=!!query&&!entry.text.includes(query);if(!entry.link.hidden)count++;}for(const g of navGroups)g.title.hidden=g.entries.every(x=>x.link.hidden);$('#nav-count').textContent=String(count);$('#nav-empty').hidden=count!==0;}
  function buildNav(){const nav=$('#nav'),groups=[...new Set(sections.map(x=>x[2]))];for(const group of groups){const g={title:el('p','nav-group',group),entries:[]};navGroups.push(g);nav.append(g.title);for(const [id,title] of sections.filter(x=>x[2]===group)){const a=el('a','nav-link'),badge=el('span','nav-badge');badge.hidden=true;a.href='#'+id;a.append(el('span','nav-no',String(sections.findIndex(x=>x[0]===id)+1).padStart(2,'0')),el('strong','',title),badge);a.addEventListener('click',()=>{setNav(false);});const entry={id,link:a,badge,text:(title+' '+group+' '+id).toLowerCase()};navEntries.push(entry);g.entries.push(entry);nav.append(a);}}filterNav();}
  function toggle(){ $('#login').hidden=signedIn;$('#workspace').hidden=!signedIn;$('#auth-mode-label').textContent=authMode==='demo'?'로컬 테스트 모드':'관리자 인증';if(signedIn)route();else $('#content').replaceChildren();}
  function lock(reason=''){const previous=authMode;signedIn=false;authMode=null;cloudEpoch++;$('#admin-pass').value='';$('#login-error').textContent=reason;toggle();if(previous==='cloud')cloud?.signOut();}
  const loginError=e=>e.code==='NOT_ADMIN'?'관리자로 등록되지 않은 계정입니다.':e.code==='NOT_CONFIGURED'?'Supabase 설정 또는 HTTP(S) 실행 환경을 확인하세요.':'로그인 실패 · 이메일, 비밀번호, 관리자 등록 및 연결 상태를 확인하세요.';
  $('#login-form').addEventListener('submit',async e=>{e.preventDefault();if(authBusy||!canLogin()||signedIn)return;authBusy=true;$('#login-submit').disabled=true;$('#login-error').textContent='인증 확인 중…';
    try{const email=$('#admin-id').value.trim(),pass=$('#admin-pass').value;
      if(demoUsable()){if(email.toLowerCase()!==demo.email.trim().toLowerCase()||pass!==demo.password)throw Object.assign(Error('Invalid test credentials'),{code:'TEST_DENIED'});authMode='demo';}
      else{await cloud.signIn(email,pass);authMode='cloud';}
      signedIn=true;cloudEpoch++;$('#login-error').textContent='';toggle();}
    catch(e){signedIn=false;authMode=null;$('#login-error').textContent=e.code==='TEST_DENIED'?'테스트 이메일 또는 비밀번호가 일치하지 않습니다.':loginError(e);toggle();}
    finally{$('#admin-pass').value='';authBusy=false;$('#login-submit').disabled=!canLogin();}
  });
  $('#logout').addEventListener('click',()=>lock());
  $('#nav-toggle').addEventListener('click',()=>{setNav(!navOpen);if(navOpen)$('#nav-search').focus();});
  for(const id of ['#nav-close','#nav-scrim'])$(id).addEventListener('click',()=>{setNav(false);$('#nav-toggle').focus();});
  window.addEventListener('keydown',e=>{if(navOpen&&e.key==='Escape'){setNav(false);$('#nav-toggle').focus();}});
  $('#nav-search').addEventListener('input',filterNav);
  $('#skip-link').addEventListener('click',e=>{e.preventDefault();(signedIn?$('#main'):$('#admin-id')).focus();});
  $('#refresh-view').addEventListener('click',()=>{if(signedIn){if(active==='cloud')loadCloud();else{render();message('최신 운영 정보를 불러왔습니다.');}}});
  $('#password-toggle').addEventListener('click',()=>{const p=$('#admin-pass'),show=p.type==='password';p.type=show?'text':'password';$('#password-toggle').textContent=show?'숨기기':'보기';$('#password-toggle').setAttribute('aria-pressed',String(show));$('#password-toggle').setAttribute('aria-label',show?'비밀번호 숨기기':'비밀번호 표시');});
  window.addEventListener('hashchange',route);
  const markDirty=e=>{const n=e.target;if(n&&['INPUT','SELECT','TEXTAREA'].includes(n.tagName)&&n.type!=='search'&&!n.readOnly&&!n.disabled)dirty=true;};
  $('#content').addEventListener('input',markDirty);
  $('#content').addEventListener('change',markDirty);
  const remoteRefresh=()=>{if(!signedIn||snapshot()===baseline)return;if(dirty)message('다른 화면에서 정보가 갱신되었습니다. 입력값을 확인한 뒤 최신 정보를 불러와 다시 저장하세요.',true);else render();};
  window.addEventListener('storage',e=>{if(e.key===globalThis.SkyCatEmail?.KEY)refreshMailPanel();if(e.key===null||e.key===G.KEY||Object.values(S.KEYS).includes(e.key))remoteRefresh();});
  window.addEventListener('skycat:mail-status',refreshMailPanel);
  window.addEventListener('pageshow',e=>{if(e.persisted)remoteRefresh();});
  buildNav();toggle();
  async function restore(){
    if(demoUsable()){
      $('#login-desc').textContent='로컬 검수 전용 계정으로 로그인해 주세요.';
      $('#login-mode-title').textContent='로컬 테스트 전용 · 실제 사용자 인증 아님';
      $('#login-mode-desc').textContent='SQL 없이 같은 브라우저의 시연 기능을 검사합니다. 공개 사이트에서는 이 계정을 사용할 수 없습니다.';
      $('#cloud-login-notice').textContent='테스트 계정: '+demo.email+' · 비밀번호는 admin-test-config.js에서 확인/변경하세요.';
      $('#login-submit').disabled=false;return;
    }
    $('#cloud-login-notice').textContent=cloud?.usable()?'등록된 관리자만 인증할 수 있습니다.':localOrigin()?'연결 전 · supabase-config.js 또는 로컬 테스트 설정을 확인하세요.':'공개 주소에서는 테스트 로그인 불가 · Supabase 관리자 인증이 필요합니다.';
    if(!cloud?.usable()){$('#login-submit').disabled=true;return;}
    authBusy=true;try{if(await cloud.resume()){authMode='cloud';signedIn=true;cloudEpoch++;toggle();}}finally{authBusy=false;$('#login-submit').disabled=false;}
  }
  restore();
  let checking=false;
  async function periodic(){if(!signedIn||authMode!=='cloud'||checking||document.hidden)return;checking=true;try{await cloud.verify();if(active==='cloud'&&!cloudBusy&&!$('#cloud-inbox')?.contains(document.activeElement))await loadCloud();}catch{if(signedIn)lock('관리자 세션이 만료되었거나 인증 확인에 실패했습니다. 다시 로그인해 주세요.');}finally{checking=false;}}
  setInterval(periodic,30000);
  document.addEventListener('visibilitychange',periodic);
})();
