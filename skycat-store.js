/* Sky Cat V8 — local-only portfolio operation data. No authentication or real processing. */
(() => {
  'use strict';
  const KEYS = Object.freeze({experience:'skycat:official:v7:experience',config:'skycat:admin:v8:config',member:'skycat:official:v4:membership'});
  const baseNames=['아이스 아메리카노','카페라떼','바닐라라떼','카라멜 마끼아또','구름 라떼','하늘 고양이 라떼','허니 크림 라떼','블루 밀크티','콜드브루','바닐라 크림 콜드브루','디카페인 콜드브루','연유 콜드브루','말차 라떼','초코 라떼','딸기 라떼','고구마 라떼','얼그레이 티','캐모마일 티','유자차','복숭아 아이스티','레몬 에이드','블루 소다 에이드','자몽 에이드','딸기 요거트 스무디','딸기 생크림 케이크','블루베리 치즈케이크','초코 가나슈 케이크','구름 마카롱','버터 크루아상','플레인 스콘','고양이 쿠키 세트','햄치즈 샌드위치'];
  const basePrices=[4500,5000,5800,6300,6500,6800,6700,6200,5200,6300,5500,6500,6000,5800,6300,5800,5000,5000,5500,5300,6200,6500,6500,6800,6500,7500,7200,5200,4200,3800,4800,6900];
  const base=baseNames.map((name,i)=>({id:String(i),name,price:basePrices[i],group:i<12?'coffee':i<24?'drink':'dessert',description:'',archived:false}));
  const defaults=()=>({
    overrides:{},added:{},archived:[],inventory:{},materials:[],
    bundles:[
      {id:'b1',ids:['0','30'],off:700,name:['구름 산책 세트','Cloud walk set','雲のお散歩セット']},
      {id:'b2',ids:['1','28'],off:900,name:['포근한 아침 세트','Cozy morning set','ほっこり朝セット']},
      {id:'b3',ids:['5','24'],off:1200,name:['하늘고양이 시그니처 세트','Sky Cat signature set','空猫シグネチャーセット']}
    ],
    notices:[
      {id:'n1',title:'운영 안내',body:'운영 시간과 휴무일은 매장 안내를 확인해 주세요.',en:['Opening hours','Check the store information for hours and holidays.'],ja:['営業時間','店舗案内で営業時間と定休日をご確認ください。']},
      {id:'n2',title:'세트 메뉴 체험',body:'정해진 메뉴 조합을 담으면 자동 할인이 적용됩니다.',en:['Demo sets','Matching menus receive an automatic discount.'],ja:['セット体験','対象商品で自動割引。']},
      {id:'n3',title:'가상 서비스 안내',body:'모든 주문·예약·쿠폰은 포트폴리오 시연입니다.',en:['Demo service','All orders, reservations and vouchers are demonstrations.'],ja:['体験サービス','注文・予約・クーポンはすべて体験です。']}
    ],
    faq:[
      {id:'f1',title:'실제 예약이나 결제가 되나요?',body:'아니요. 모든 예약, 문의, 주문은 포트폴리오용 시연입니다.',en:['Is this a real booking or payment?','No, all services are demos.'],ja:['実際の予約や決済ですか？','いいえ。すべて体験です。']},
      {id:'f2',title:'예약은 언제 가능한가요?',body:'현재 매장 안내의 운영 시간과 휴무일을 확인해 주세요.',en:['When can I book?','Check current opening hours and closed days.'],ja:['いつ予約できますか？','現在の営業時間と定休日をご確認ください。']},
      {id:'f3',title:'고양이와 어떻게 인사하나요?',body:'먼저 다가올 때까지 기다려 주세요. 이용 수칙을 확인해 주세요.',en:['How do I greet cats?','Wait for the cat to approach and read the etiquette.'],ja:['猫にどう挨拶しますか？','猫が近づくまで待ち、ルールをご確認ください。']}
    ],
    hours:{open:540,close:1260,closed:[1]},blockedSeats:[],crowd:null
  });
  const blank=()=>({cart:[],orders:[],memberLog:[],recent:[],stock:[],giftCodes:[],giftBalance:0,reservation:null,reservations:[],reviews:[],inquiries:[]});
  function read(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x==='object'?x:fallback;}catch{return fallback;}}
  function write(key,v){try{const data=JSON.stringify(v);if(localStorage.getItem(key)!==data)localStorage.setItem(key,data);return true;}catch{return false;}}
  const arr=v=>Array.isArray(v)?v:[];
  const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const groups=['coffee','drink','dessert'];
  const validPrice=v=>Number.isInteger(v)&&v>=1&&v<=1000000;
  const validName=v=>typeof v==='string'&&v.trim().length>0;
  function config(){
    const d=defaults(),x=read(KEYS.config,{}),c={...d};
    for(const m of base){const v=obj(obj(x.overrides)[m.id]),o={};if(validName(v.name))o.name=v.name;if(validPrice(v.price))o.price=v.price;if(groups.includes(v.group))o.group=v.group;if(typeof v.description==='string')o.description=v.description;if(Object.keys(o).length)c.overrides[m.id]=o;}
    for(const [id,v] of Object.entries(obj(x.added))){if(/^a[a-z0-9]+$/i.test(id)&&isRecord(v)&&validName(v.name)&&validPrice(v.price)&&groups.includes(v.group))c.added[id]={id,name:v.name,price:v.price,group:v.group,description:typeof v.description==='string'?v.description:''};}
    const ids=new Set([...base.map(m=>m.id),...Object.keys(c.added)]);
    c.archived=[...new Set(arr(x.archived).filter(id=>ids.has(id)))];
    for(const [id,n] of Object.entries(obj(x.inventory)))if(ids.has(id)&&Number.isInteger(n)&&n>=0&&n<=100000)c.inventory[id]=n;
    c.materials=arr(x.materials).filter(v=>isRecord(v)&&validName(v.id)&&validName(v.name)&&Number.isFinite(v.amount)&&v.amount>=0&&typeof v.unit==='string');
    const h=obj(x.hours),validTime=n=>Number.isInteger(n)&&n>=0&&n<=1440&&n%30===0;
    if(validTime(h.open)&&validTime(h.close)&&h.open<h.close){c.hours.open=h.open;c.hours.close=h.close;}
    if(Array.isArray(h.closed))c.hours.closed=[...new Set(h.closed.filter(n=>Number.isInteger(n)&&n>=0&&n<=6))];
    c.blockedSeats=[...new Set(arr(x.blockedSeats).filter(id=>seats.some(s=>s.id===id)))];
    c.crowd=Number.isInteger(x.crowd)&&x.crowd>=0&&x.crowd<=100?x.crowd:null;
    if(Array.isArray(x.bundles)){
      const used=new Set(),keys=new Set();
      c.bundles=x.bundles.filter(v=>{
        if(!isRecord(v)||!validName(v.id)||keys.has(v.id)||!Array.isArray(v.ids)||v.ids.length!==2||v.ids[0]===v.ids[1]||!v.ids.every(id=>ids.has(id)&&!used.has(id))||!Array.isArray(v.name)||v.name.length!==3||!v.name.every(validName)||!Number.isInteger(v.off)||v.off<0)return false;
        keys.add(v.id);v.ids.forEach(id=>used.add(id));return true;
      });
    }
    for(const k of ['faq','notices'])if(Array.isArray(x[k]))c[k]=x[k].filter(v=>isRecord(v)&&validName(v.id)&&validName(v.title)&&typeof v.body==='string');
    return c;
  }
  const validAt=n=>Number.isFinite(n)&&n>=0&&n<=8640000000000000;
  const nonnegative=n=>Number.isFinite(n)&&n>=0;
  const validItem=v=>isRecord(v)&&validName(v.id)&&Number.isInteger(v.n)&&v.n>=1&&v.n<=5;
  const dateKey=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
  function validReservation(v){return isRecord(v)&&dateKey(v.date)&&typeof v.time==='string'&&/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(v.time)&&Number.isInteger(v.people)&&v.people>=1&&v.people<=6&&seats.some(s=>s.id===v.table&&s.capacity>=v.people)&&['none','window','table'].includes(v.seat);}
  function experience(){
    const x=read(KEYS.experience,{}),e={...blank(),...x};
    e.cart=arr(e.cart).filter(validItem);
    e.orders=arr(e.orders).filter(v=>isRecord(v)&&validName(v.id)&&validAt(v.at)&&nonnegative(v.total)&&arr(v.items).some(validItem)).map(v=>({...v,items:v.items.filter(validItem).map(i=>({...i,name:typeof i.name==='string'?i.name:i.id})),step:Number.isInteger(v.step)?Math.max(0,Math.min(3,v.step)):0,cancelled:!!v.cancelled}));
    e.memberLog=arr(e.memberLog).filter(v=>isRecord(v)&&validName(v.id)&&validAt(v.at)&&['stamp','reward','use','adjust'].includes(v.kind));
    e.giftCodes=arr(e.giftCodes).filter(v=>isRecord(v)&&typeof v.code==='string'&&/^SKY-[A-Z0-9-]+$/.test(v.code)&&[3000,5000,10000].includes(v.value)&&typeof v.used==='boolean');
    e.giftBalance=Number.isInteger(e.giftBalance)&&e.giftBalance>=0&&e.giftBalance<=400000?e.giftBalance:0;
    e.reviews=arr(e.reviews).filter(v=>isRecord(v)&&[1,2,3,4,5].includes(v.rating)&&['taste','space','kindness','cats'].includes(v.topic)&&validAt(v.at));
    e.inquiries=arr(e.inquiries).filter(v=>isRecord(v)&&validName(v.id)&&typeof v.body==='string').map(v=>({...v,reply:typeof v.reply==='string'?v.reply:''}));
    e.reservations=arr(e.reservations).filter(v=>validReservation(v)&&validName(v.id)).map(v=>({...v,status:['pending','approved','cancelled'].includes(v.status)?v.status:'pending'}));
    e.reservation=validReservation(e.reservation)?{...e.reservation,id:e.reservation.id||'legacy-reservation',status:['pending','approved','cancelled'].includes(e.reservation.status)?e.reservation.status:'pending'}:null;
    for(const k of ['recent','stock'])e[k]=[...new Set(arr(e[k]).filter(v=>typeof v==='string'))];
    return e;
  }
  function member(){const m=read(KEYS.member,{stamps:0,coupons:0});return {stamps:Number.isInteger(m.stamps)&&m.stamps>=0&&m.stamps<5?m.stamps:0,coupons:Number.isInteger(m.coupons)&&m.coupons>=0&&m.coupons<=999?m.coupons:0};}
  function allMenus(c=config()){
    return [...base.map(m=>({...m,...obj(c.overrides[m.id]),id:m.id})),...Object.values(c.added).map(m=>({...m}))].map(m=>({...m,archived:c.archived.includes(m.id)}));
  }
  // Strip only prices; all other operating settings must still match.
  // Comparing effective menus also treats a newly created price-only override
  // as a price change, rather than a structural catalog change.
  function nonPriceSignature(c){
    const {overrides,added,...rest}=c;
    return JSON.stringify([rest,allMenus(c).map(({price,...item})=>item)]);
  }
  function isPriceOnlyChange(before,after){return nonPriceSignature(before)===nonPriceSignature(after);}
  function quantity(id,c=config()){const n=c.inventory[id];return Number.isInteger(n)&&n>=0?n:Infinity;}
  function available(id,c=config(),e=experience()){return !c.archived.includes(id)&&!e.stock.includes(id)&&quantity(id,c)>0;}
  function key(prefix){return prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();}
  const seats=[{id:'W1',type:'window',capacity:2},{id:'W2',type:'window',capacity:2},{id:'W3',type:'window',capacity:4},{id:'T1',type:'table',capacity:2},{id:'T2',type:'table',capacity:4},{id:'T3',type:'table',capacity:6},{id:'T4',type:'table',capacity:6}];
  const day=(at=Date.now())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
  const clock=(n)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
  const demoSeatOccupied=(id,date,time)=>[...date+time+id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0)%5===0;
  function reservations(e=experience()){const list=[...e.reservations];const id=e.reservation?.id||'legacy-reservation';if(e.reservation&&!list.some(r=>r.id===id))list.push({...e.reservation,id,status:e.reservation.status||'pending'});return list;}
  globalThis.SkyCatStore=Object.freeze({KEYS,base,defaults,blank,config,experience,member,allMenus,isPriceOnlyChange,quantity,available,key,seats,day,clock,demoSeatOccupied,reservations,saveConfig:c=>write(KEYS.config,c),saveExperience:e=>write(KEYS.experience,e),saveMember:m=>write(KEYS.member,m)});
})();
