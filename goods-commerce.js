/* V24 — same-origin goods operations. Demo only; no real payment or shipping. */
((root)=>{
  'use strict';
  const KEY='skycat:goods:v2:state', OLD_CART='skycat:goods:v1:cart', OLD_ORDERS='skycat:goods:v1:orders';
  const BUNDLE='bundle-01', PARTS=['keyboard-01','mouse-01'], PRICE_PLAN=2;
  const statuses={received:'주문 접수',packing:'상품 준비 중',shipping:'배송 중',delivered:'배송 완료',cancelled:'주문 취소'};
  const stages=['received','packing','shipping','delivered'];
  const damaged='저장 데이터가 손상되었거나 지원하지 않는 형식입니다. 기존 데이터를 보호하기 위해 변경을 중단했습니다.';
  const storageDenied='브라우저 저장소에 저장할 수 없습니다. 저장소 설정을 확인해 주세요.';
  const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  const normal=v=>v.trim().normalize('NFKC').toLowerCase().replace(/\s+/g,'');
  function createStore(products,storage,now=()=>new Date()){
    const base=new Map(products.map(p=>[p.sku,{stock:30,active:true,...p}]));
    const sources=new WeakMap();
    let error='';
    const fail=msg=>{error=msg;return false;};
    function inspect(key){try{if(!storage)throw Error('No storage');const text=storage.getItem(key);if(text===null||text===undefined)return {text:null,value:null};try{return {text,value:JSON.parse(text)};}catch{return {text,issue:damaged};}}catch{return {text:null,issue:storageDenied};}}
    function load(){
      const source=inspect(KEY),raw=source.value,updated=obj(raw)&&raw.schema===2;
      if(source.text!==null&&(!updated||!obj(raw.products)||!obj(raw.cart)||!Array.isArray(raw.orders)))source.issue=damaged;
      if(updated&&!int(raw.revision,0,Number.MAX_SAFE_INTEGER-1))source.issue=damaged;
      const s={schema:2,pricePlan:PRICE_PLAN,revision:updated&&int(raw.revision,0,Number.MAX_SAFE_INTEGER-1)?raw.revision:0,products:{},cart:{},orders:[]};
      let repriced=false;
      const names=new Set();
      for(const p of base.values()){
        const m=updated&&obj(raw.products?.[p.sku])?raw.products[p.sku]:{};
        if(updated&&Object.hasOwn(raw.products||{},p.sku)&&(!obj(raw.products[p.sku])||typeof m.name!=='string'||!m.name.trim()||m.name.length>80||!int(m.price,1,p.sku===BUNDLE?20000000:10000000)||!int(m.stock,0,1000000)||typeof m.active!=='boolean'))source.issue=damaged;
        let name=typeof m.name==='string'&&m.name.trim()&&m.name.length<=80?m.name.trim():p.name;
        if(names.has(normal(name)))name=p.name;
        if(names.has(normal(name)))name=p.name+' ('+p.sku+')';
        names.add(normal(name));
        let price=int(m.price,1,10000000)?m.price:p.price;
        // Upgrade only unmodified default prices. Preserve explicit admin overrides and historical orders.
        const priorPrice=updated&&raw.pricePlan===1?(p.previousPriceV25_1??p.price):p.previousPrice;
        if(updated && (raw.pricePlan===1||raw.pricePlan===undefined) && m.price===priorPrice && Number.isSafeInteger(priorPrice) && price!==p.price){
          price=p.price;repriced=true;
        }
        s.products[p.sku]={name,price,stock:int(m.stock,0,1000000)?m.stock:p.stock,active:typeof m.active==='boolean'?m.active:p.active};
      }
      if(repriced)s.revision=Math.min(s.revision+1,Number.MAX_SAFE_INTEGER-1);
      const legacyCart=updated?null:inspect(OLD_CART),legacyOrders=updated?null:inspect(OLD_ORDERS);
      if(!updated){if(legacyCart.issue||legacyOrders.issue)source.issue=source.issue||legacyCart.issue||legacyOrders.issue;
        if((legacyCart.text!==null&&!obj(legacyCart.value))||(legacyOrders.text!==null&&!Array.isArray(legacyOrders.value)))source.issue=damaged;}
      const cart=updated?raw.cart:legacyCart.value;
      if(obj(cart))for(const [id,n] of Object.entries(cart)){if(base.has(id)&&int(n,1,99))s.cart[id]=n;else if(updated&&base.has(id))source.issue=damaged;}
      const orders=updated?raw.orders:legacyOrders.value,ids=new Set();
      for(const o of Array.isArray(orders)?orders:[]){
        if(!obj(o)||typeof o.id!=='string'||!o.id||ids.has(o.id)||typeof o.date!=='string'||!Number.isFinite(Date.parse(o.date))||!Array.isArray(o.items)||!o.items.length||
          !o.items.every(i=>obj(i)&&base.has(i.sku)&&typeof i.name==='string'&&int(i.price,1,20000000)&&int(i.quantity,1,99))){source.issue=source.issue||damaged;continue;}
        ids.add(o.id);
        const items=o.items.map(i=>({sku:i.sku,name:i.name,price:i.price,quantity:i.quantity,subtotal:i.price*i.quantity}));
        const deductions={};
        if(updated&&obj(o.deductions))for(const [sku,n] of Object.entries(o.deductions))if(base.has(sku)&&sku!==BUNDLE&&int(n,1,10000))deductions[sku]=n;
        if(updated&&obj(o.deductions)&&Object.keys(o.deductions).length){const expected=required(items);if(Object.keys(o.deductions).length!==Object.keys(expected).length||Object.entries(expected).some(([sku,n])=>deductions[sku]!==n))source.issue=damaged;}
        s.orders.push({id:o.id,date:o.date,items,quantity:items.reduce((n,i)=>n+i.quantity,0),total:items.reduce((n,i)=>n+i.subtotal,0),
          status:Object.hasOwn(statuses,o.status)?o.status:'received',deductions,updatedAt:typeof o.updatedAt==='string'?o.updatedAt:o.date});
      }
      sources.set(s,{source,legacyCart,legacyOrders});return s;
    }
    function save(s){
      error='';
      try{
        const prior=sources.get(s);if(!prior||prior.source.issue)return fail(prior?.source.issue||storageDenied);
        const current=inspect(KEY);if(current.issue)return fail(current.issue);
        if(current.text!==prior.source.text)return fail('다른 화면에서 운영 정보가 변경되었습니다. 최신 정보를 확인해 주세요.');
        if(current.text===null){const c=inspect(OLD_CART),o=inspect(OLD_ORDERS);if(c.issue||o.issue)return fail(c.issue||o.issue);if(c.text!==prior.legacyCart?.text||o.text!==prior.legacyOrders?.text)return fail('다른 화면에서 운영 정보가 변경되었습니다. 최신 정보를 확인해 주세요.');}
        if(s.revision>=Number.MAX_SAFE_INTEGER-1)return fail(damaged);
        s.revision++;
        storage.setItem(KEY,JSON.stringify(s));
        return true;
      }catch{return fail(storageDenied);}
    }
    function list(s=load()){
      return [...base.values()].map(p=>{
        const m={...p,...s.products[p.sku]};
        if(p.sku===BUNDLE&&PARTS.every(id=>s.products[id])){
          const parts=PARTS.map(id=>s.products[id]);
          m.regularPrice=parts.reduce((n,x)=>n+x.price,0);
          m.price=Math.max(1,Math.round(m.regularPrice*.8));
          m.stock=Math.min(...parts.map(x=>x.stock));
          m.componentAvailable=parts.every(x=>x.active);
        }
        m.available=m.active&&m.stock>0&&m.componentAvailable!==false;
        return m;
      });
    }
    function required(items){
      const needs={};
      for(const x of items)for(const id of x.sku===BUNDLE&&PARTS.every(id=>base.has(id))?PARTS:[x.sku])needs[id]=(needs[id]||0)+x.quantity;
      return needs;
    }
    function quote(s,only=null){
      const map=new Map(list(s).map(p=>[p.sku,p]));
      const items=(only===null?Object.entries(s.cart):[[only,1]]).filter(([id])=>map.has(id)).map(([id,quantity])=>({...map.get(id),quantity,subtotal:map.get(id).price*quantity}));
      const needs=required(items);
      const valid=items.length>0&&items.every(i=>i.available)&&Object.entries(needs).every(([id,n])=>s.products[id].stock>=n);
      return {items,quantity:items.reduce((n,i)=>n+i.quantity,0),total:items.reduce((n,i)=>n+i.subtotal,0),valid,revision:s.revision,signature:JSON.stringify(items.map(i=>[i.sku,i.price,i.quantity,i.available,i.stock]))};
    }
    function change(s,id,n){
      error='';
      if(!base.has(id)||!int(n,0,99))return fail('상품당 수량은 0~99개 사이로 설정하세요.');
      const previous=s.cart[id]||0;
      if(n===0)delete s.cart[id];else s.cart[id]=n;
      if(n>previous){
        const p=list(s).find(i=>i.sku===id);
        if(!p.available||Object.entries(required(quote(s).items)).some(([sku,q])=>s.products[sku].stock<q))return fail('판매 중지 또는 재고가 부족합니다. 단품과 세트 재고를 함께 확인해 주세요.');
      }
      return save(s);
    }
    function set(id,n){return change(load(),id,n);}
    function add(id){const s=load();return change(s,id,(s.cart[id]||0)+1);}
    function checkout(only=null,expectedRevision,expectedSignature){
      error='';const s=load();
      if(expectedRevision!==undefined&&s.revision!==expectedRevision){fail('가격 또는 운영 정보가 변경되었습니다. 합계를 다시 확인하고 구매해 주세요.');return null;}
      const q=quote(s,only);
      if(expectedSignature!==undefined&&q.signature!==expectedSignature){fail('가격 또는 운영 정보가 변경되었습니다. 합계를 다시 확인하고 구매해 주세요.');return null;}
      if(!q.valid){fail('장바구니가 비어 있거나 재고가 부족한 상품이 있습니다.');return null;}
      const date=now().toISOString(),deductions=required(q.items);
      const order={id:'SCG-'+Date.parse(date)+'-'+(s.revision+1),date,quantity:q.quantity,total:q.total,
        items:q.items.map(({sku,name,price,quantity,subtotal})=>({sku,name,price,quantity,subtotal})),status:'received',updatedAt:date,deductions};
      for(const [id,n] of Object.entries(deductions))s.products[id].stock-=n;
      s.orders.unshift(order);if(only===null)s.cart={};
      return save(s)?order:null;
    }
    function updateProduct(id,patch,expectedRevision){
      error='';const s=load(),p=s.products[id];
      if(!p)return fail('상품을 찾을 수 없습니다.');
      if(!obj(patch))return fail('상품 정보를 확인하세요.');
      if(expectedRevision!==undefined&&s.revision!==expectedRevision)return fail('최신 운영 정보를 불러온 뒤 다시 수정하세요.');
      if(Object.hasOwn(patch,'name')){
        if(typeof patch.name!=='string'||!patch.name.trim()||patch.name.trim().length>80)return fail('상품명은 1~80자로 입력하세요.');
        const name=patch.name.trim();if(Object.entries(s.products).some(([sku,m])=>sku!==id&&normal(m.name)===normal(name)))return fail('이미 사용 중인 굿즈명입니다.');
        p.name=name;
      }
      if(Object.hasOwn(patch,'price')){
        if(id===BUNDLE)return fail('세트 가격은 단품 합계에서 20% 할인되어 자동 계산됩니다.');
        if(!int(patch.price,1,10000000))return fail('가격은 1~10,000,000원 정수로 입력하세요.');
        p.price=patch.price;
      }
      if(Object.hasOwn(patch,'stock')){
        if(id===BUNDLE)return fail('세트 재고는 키보드와 마우스 재고에서 자동 계산됩니다.');
        if(!int(patch.stock,0,1000000))return fail('재고는 0~1,000,000개 정수로 입력하세요.');
        p.stock=patch.stock;
      }
      if(Object.hasOwn(patch,'active')){
        if(typeof patch.active!=='boolean')return fail('판매 여부를 확인하세요.');
        p.active=patch.active;
      }
      return save(s);
    }
    function updateOrder(id,status,expectedRevision){
      error='';const s=load(),o=s.orders.find(x=>x.id===id);
      if(expectedRevision!==undefined&&s.revision!==expectedRevision)return fail('최신 주문 정보를 불러온 뒤 다시 수정하세요.');
      if(!o||!Object.hasOwn(statuses,status))return fail('주문 정보를 확인하세요.');
      if(o.status==='cancelled'||o.status==='delivered')return fail('취소 또는 배송 완료 주문은 변경할 수 없습니다.');
      if(status===o.status)return true;
      if(status==='cancelled'){
        if(o.status==='shipping')return fail('배송 중인 주문은 취소할 수 없습니다.');
        for(const [sku,n] of Object.entries(o.deductions)){
          if(s.products[sku].stock+n>1000000)return fail('복구 재고가 상한을 초과합니다. 재고를 먼저 확인하세요.');
          s.products[sku].stock+=n;
        }
      }else if(stages.indexOf(status)!==stages.indexOf(o.status)+1)return fail('주문 상태는 다음 단계로만 변경할 수 있습니다.');
      o.status=status;o.updatedAt=now().toISOString();return save(s);
    }
    return {list:()=>list(),snapshot:(only=null)=>quote(load(),only),history:()=>load().orders,
      revision:()=>load().revision,health:()=>sources.get(load()).source.issue||'',set,add,remove:id=>set(id,0),checkout,updateProduct,updateOrder,lastError:()=>error};
  }
  const api={KEY,statuses,stages,createStore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SkyCatGoodsCommerce=api;
})(globalThis);
