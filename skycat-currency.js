/* V26.1 — The one source for customer-facing exchange rates. All stored values are KRW. */
(function(root){
  'use strict';
  const date='2026-11-17';
  const source='https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2026/11/20261117.pdf';
  const rates=Object.freeze({ko:1,en:1.0989/1468.36,ja:175.05/1468.36});
  const codes=Object.freeze({ko:'KRW',en:'USD',ja:'JPY'});
  function rate(lang){return rates[lang]||1;}
  function value(krw,lang){
    const precision=lang==='en'?100:1;
    return Math.round(Number(krw)*rate(lang)*precision)/precision;
  }
  function toKRW(amount,lang){return Math.round(Number(amount)/rate(lang));}
  function format(krw,lang='ko'){
    const amount=value(krw,lang);
    if(lang==='en')return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount);
    if(lang==='ja')return new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'}).format(amount);
    return amount.toLocaleString('ko-KR')+'원';
  }
  function text(raw,lang){
    if(typeof raw!=='string'||lang==='ko')return raw;
    return raw.replace(/₩\s*(\d[\d,]*)|(\d[\d,]*)\s*(?:KRW|ウォン|원)/g,(_,a,b)=>format(Number((a||b).replace(/,/g,'')),lang));
  }
  function note(lang){
    if(lang==='en')return 'USD estimate · ECB reference rate '+date+' · Rounded totals may differ. Demo only; base prices remain KRW.';
    if(lang==='ja')return '日本円換算（目安）・ECB基準 '+date+'・端数処理により合計に差が生じる場合があります。体験用・基準価格は韓国ウォン。';
    return '기준 통화 KRW · 영어·일본어 가격은 '+date+' ECB 기준 환산 금액입니다.';
  }
  function updateNote(doc,lang){const el=doc.getElementById('skycat-currency-note');if(el)el.textContent=note(lang);}
  const api=Object.freeze({date,source,rates,codes,rate,value,toKRW,format,text,note,updateNote});
  root.SkyCatCurrency=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
