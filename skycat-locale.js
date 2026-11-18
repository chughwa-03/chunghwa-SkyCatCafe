/* V26 — one customer locale shared by all standalone pages. */
((root)=>{
  'use strict';
  const KEY='skycat:locale:v1', allowed=['ko','en','ja'];
  const valid=value=>allowed.includes(value);
  let memory=null;
  function get(store,key){try{return root[store].getItem(key);}catch{return null;}}
  function put(store,key,value){try{root[store].setItem(key,value);}catch{}}
  function read(){return [get('localStorage',KEY),memory,get('sessionStorage','skycat:locale'),get('localStorage','skycat:landing:v2:language')].find(valid)||'ko';}
  function save(value){if(!valid(value))return read();memory=value;put('localStorage',KEY,value);put('sessionStorage','skycat:locale',value);put('localStorage','skycat:landing:v2:language',value);return value;}
  function subscribe(callback,{syncOnPageShow=true}={}){
    const sync=()=>callback(read());
    root.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){memory=null;sync();}});
    if(syncOnPageShow)root.addEventListener('pageshow',sync);
  }
  root.SkyCatLocale=Object.freeze({KEY,read,save,subscribe,valid});
})(globalThis);
