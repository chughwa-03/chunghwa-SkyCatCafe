(() => {
  'use strict';
  const groups = [...document.querySelectorAll('.goods-group')];
  const cards = [...document.querySelectorAll('.product-card[data-sku]')];
  const products = SkyCatGoodsCatalog;
  let productMap = new Map();
  let storage;
  try { storage = window.localStorage; } catch { /* browser storage unavailable */ }
  const store = SkyCatGoodsCommerce.createStore(products, storage);
  const i18n=globalThis.SkyCatGoodsI18n, sharedLocale=globalThis.SkyCatLocale;
  // The shop always opens in Korean, regardless of previously saved locale.
  let lang='ko';
  const t=(key,values={})=>i18n?i18n.translate(key,lang,values):key.replace(/\{(\w+)\}/g,(m,k)=>Object.hasOwn(values,k)?String(values[k]):m);
  const nameOf=(p,l=lang)=>i18n?i18n.productName(p,l,products):p.name;
  const languageSelect=document.getElementById('goods-language');
  const translateStatic=i18n?.capture(document);
  const won = amount => globalThis.SkyCatCurrency?.format(amount,lang) ?? (amount.toLocaleString('ko-KR')+'원');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const search = document.getElementById('goods-search');
  const result = document.getElementById('result-count');
  const empty = document.getElementById('empty');
  const sort = document.getElementById('goods-sort');
  const jump = document.getElementById('goods-jump');
  const stockOnly = document.getElementById('goods-in-stock');
  const favoriteOnly = document.getElementById('goods-favorites');
  const favoriteCount = document.getElementById('favorite-count');
  const groupOrder = new Map(groups.map(group => [group, [...group.querySelectorAll('.product-card')]]));
  const skuSet = new Set(products.map(product => product.sku));
  const FAVORITE_KEY = 'skycat:goods:v1:favorites';
  function readFavorites() {
    try {
      const saved = JSON.parse(storage?.getItem(FAVORITE_KEY) || '[]');
      return new Set(Array.isArray(saved) ? saved.filter(sku => skuSet.has(sku)) : []);
    } catch { return new Set(); }
  }
  let favorites = readFavorites();
  let favoritesSessionOnly = false;
  let category = 'all';
  const normalize = value => value.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
  function refreshFavorites() {
    favoriteCount.textContent = String(favorites.size);
    for (const card of cards) {
      const button = card.querySelector('[data-favorite]');
      const selected = favorites.has(card.dataset.sku);
      button.textContent = selected ? '♥' : '♡';
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', card.dataset.name + ' ' + t(selected ? '찜 해제' : '찜하기'));
      button.classList.toggle('is-favorite', selected);
    }
  }
  function orderCards(group) {
    const original = groupOrder.get(group);
    const grid = group.querySelector('.product-grid');
    const ordered = [...original];
    if (sort.value !== 'default') {
      ordered.sort((a,b) => {
        const x = productMap.get(a.dataset.sku), y = productMap.get(b.dataset.sku);
        if (!x || !y) return 0;
        if (sort.value === 'low') return x.price - y.price;
        if (sort.value === 'high') return y.price - x.price;
        if (sort.value === 'name') return nameOf(x).localeCompare(nameOf(y),lang);
        if (sort.value === 'stock') return y.stock - x.stock;
        return 0;
      });
    }
    const current = [...grid.querySelectorAll('.product-card')];
    if (ordered.some((card,i)=>card!==current[i])) grid.append(...ordered);
  }
  function filter() {
    const query = normalize(search.value.trim());
    let visibleGroups = 0, visibleProducts = 0;
    for (const group of groups) {
      const categoryMatch = category === 'all' || group.dataset.category === category;
      let groupCount = 0;
      for (const card of groupOrder.get(group)) {
        const p = productMap.get(card.dataset.sku);
        const aliases=p?[p.name,...['ko','en','ja'].flatMap(l=>[nameOf(p,l),i18n?.translate(p.design,l)||p.design,i18n?.translate(group.dataset.title,l)||group.dataset.title])]:[];
        const match = categoryMatch
          && (!query || normalize([group.dataset.title,card.dataset.name,card.dataset.design,card.dataset.sku,...aliases].join(' ')).includes(query))
          && (!stockOnly.checked || p?.available)
          && (!favoriteOnly.checked || favorites.has(card.dataset.sku));
        card.hidden = !match;
        if (match) groupCount++;
      }
      group.hidden = groupCount === 0;
      group.querySelector('.count').textContent = t('{n}종',{n:groupCount});
      if (groupCount) visibleGroups++;
      visibleProducts += groupCount;
      orderCards(group);
    }
    const previous = jump.value;
    const placeholder = node('option',t('품목 선택')); placeholder.value = '';
    jump.replaceChildren(placeholder);
    for (const group of groups.filter(g=>!g.hidden)) {
      const option = node('option',t(group.dataset.title)); option.value=group.id; jump.append(option);
    }
    jump.value = groups.some(g=>g.id===previous&&!g.hidden) ? previous : '';
    result.textContent = t('{g}개 품목 · {n}종',{g:visibleGroups,n:visibleProducts});
    empty.hidden = visibleProducts !== 0;
  }
  function selectCategory(next) {
    category = next;
    buttons.forEach(item => { const active = item.dataset.filter === category; item.classList.toggle('selected', active); item.setAttribute('aria-pressed', String(active)); });
    filter();
  }
  buttons.forEach(button => button.addEventListener('click', () => selectCategory(button.dataset.filter)));
  search.addEventListener('input', filter);
  [sort,stockOnly,favoriteOnly].forEach(control=>control.addEventListener('change',filter));
  jump.addEventListener('change',()=>{
    const group=groups.find(g=>g.id===jump.value&&!g.hidden);
    if(group) group.scrollIntoView({block:'start'});
  });
  document.getElementById('goods-reset').addEventListener('click',()=>{
    search.value='';sort.value='default';stockOnly.checked=false;favoriteOnly.checked=false;jump.value='';
    selectCategory('all');
  });
  for (const card of cards) {
    const button=node('button','♡','goods-favorite');
    button.type='button';button.dataset.favorite='';
    card.append(button);
  }
  document.getElementById('catalog-total').textContent = t('{g}개 품목 · {n}종',{g:groups.length,n:cards.length});
  const dialog = document.getElementById('product-dialog');
  const photo = document.getElementById('dialog-image');
  const title = document.getElementById('dialog-title');
  const design = document.getElementById('dialog-design');
  let lastFocus, selectedSku, cartFocus, directSku = null, toastTimer, quoteRevision, quoteSignature, completedOrder;
  const cartDialog = document.getElementById('cart-dialog');
  const cartTitle = document.getElementById('cart-title');
  const cartItems = document.getElementById('cart-items');
  const checkout = document.getElementById('checkout-button');
  const mailNote=document.createElement('p');
  checkout.closest('.cart-footer').before(mailNote);globalThis.SkyCatEmail?.notice(mailNote,'goods');
  const cartContent = document.getElementById('cart-content');
  const success = document.getElementById('order-success');
  const toast = document.getElementById('goods-toast');
  const warning = document.getElementById('cart-warning');
  const availability = p => p.available ? t('재고 {n}개',{n:p.stock}) : t(!p.active || p.componentAvailable===false ? '판매 중지' : '품절');
  function showWarning(text) { warning.textContent=text;warning.hidden=!text; }
  function syncCatalog() {
    productMap = new Map(store.list().map(p=>[p.sku,p]));
    for(const card of cards){
      const p=productMap.get(card.dataset.sku); if(!p)continue;
      const label=nameOf(p);
      card.dataset.name=label;card.dataset.price=String(p.price);
      card.querySelector('h3').textContent=label;
      const image=card.querySelector('img');image.alt=label+' · '+t(p.design);
      const variant=card.querySelector('.variant');if(variant)variant.textContent=t(p.design);
      const price=card.querySelector('.goods-price');
      price.querySelector('strong').textContent=won(p.price);
      if(p.regularPrice)price.querySelector('del').textContent=won(p.regularPrice);
      let badge=card.querySelector('.goods-stock');
      if(!badge){badge=node('span',undefined,'goods-stock');price.before(badge);}
      badge.textContent=availability(p);badge.classList.toggle('unavailable',!p.available);
      card.querySelectorAll('[data-product]').forEach(b=>{b.dataset.name=label;if(b.classList.contains('product-photo'))b.setAttribute('aria-label',label+' '+t('이미지 확대'));});
      const add=card.querySelector('[data-add]');
      add.disabled=!p.available;add.textContent=p.available?t('담기 +'):availability(p);
      add.setAttribute('aria-label',label+' '+(p.available?t('장바구니 담기'):availability(p)));
    }
    refreshFavorites();
    if(dialog.open&&selectedSku)updateDetail();
    filter();
  }
  function updateDetail(){
    const p=productMap.get(selectedSku);if(!p)return;
    title.textContent=nameOf(p);photo.alt=nameOf(p);
    design.textContent=t(p.design)+' · '+availability(p);
    document.getElementById('dialog-price').textContent=won(p.price)+(p.regularPrice?' ('+t('20% 할인')+')':'');
    document.getElementById('dialog-add').disabled=!p.available;
    document.getElementById('dialog-buy').disabled=!p.available;
  }
  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
  }
  function node(tag, content, className) {
    const element = document.createElement(tag);
    if (content !== undefined) element.textContent = content;
    if (className) element.className = className;
    return element;
  }
  function action(label, sku, operation, description) {
    const button = node('button', label, 'cart-control');
    button.type = 'button';
    button.dataset.sku = sku;
    button.dataset.operation = operation;
    button.setAttribute('aria-label', description);
    return button;
  }
  function renderHistory() {
    const history = document.getElementById('order-history');
    history.replaceChildren();
    const orders = store.history().slice(0,20);
    if (!orders.length) history.append(node('p', t('구매 내역이 없습니다.')));
    for (const order of orders) {
      const row = node('div', undefined, 'history-entry');
      row.append(node('strong', won(order.total)), node('small',
        new Date(order.date).toLocaleString(lang,{timeZone:'Asia/Seoul'}) + ' · ' + order.id));
      row.append(node('p', order.items.map(item => nameOf(item) + ' × ' + item.quantity).join(' / ')));
      row.append(node('span',t(SkyCatGoodsCommerce.statuses[order.status]||'주문 접수'),'goods-order-status'+(order.status==='cancelled'?' cancelled':'')));
      history.append(row);
    }
  }
  function renderCart() {
    const snapshot = store.snapshot();
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = snapshot.quantity; });
    const directProduct = productMap.get(directSku);
    const view = directProduct ? store.snapshot(directSku) : snapshot;
    quoteRevision=view.revision;quoteSignature=view.signature;
    cartItems.replaceChildren();
    for (const item of view.items) {
      const row = node('div', undefined, 'cart-row');
      const text = node('div', undefined, 'cart-item-info');
      const label=nameOf(item);
      text.append(node('strong', label), node('small', won(item.price) + ' / '+t('개')+' · '+availability(item)));
      const controls = node('div', undefined, 'quantity-controls');
      if (!directProduct) {
        const plus=action('+',item.sku,'plus',label+' '+t('수량 늘리기'));plus.disabled=!item.available||item.quantity>=Math.min(item.stock,99);
        controls.append(action('−',item.sku,'minus',label+' '+t('수량 줄이기')),
          node('span',String(item.quantity)),plus,
          action(t('삭제'),item.sku,'remove',label+' '+t('장바구니에서 삭제')));
      } else controls.append(node('span','1'+(lang==='en'?' ':'')+t('개')));
      row.append(text,controls,node('strong',won(item.subtotal),'line-total'));
      cartItems.append(row);
    }
    document.getElementById('cart-empty').hidden = view.items.length > 0;
    document.getElementById('cart-quantity').textContent = view.quantity;
    document.getElementById('cart-total').textContent = won(view.total);
    const problem=store.health?.()||'';
    checkout.disabled = !view.valid||Boolean(problem);
    showWarning(problem?t(problem):view.items.length&&!view.valid?t('판매 중지 또는 재고가 부족한 상품이 있습니다. 수량을 줄이거나 삭제해 주세요.'):'');
    renderHistory();
  }
  function add(sku) {
    if (store.add(sku)) {
      notify(t('{name}을(를) 장바구니에 담았어요!',{name:nameOf(productMap.get(sku))}));
      renderCart();
    } else notify(t(store.lastError()));
  }
  function openCart(sku = null, focus = document.activeElement) {
    directSku = sku;
    cartFocus = focus;
    completedOrder=null;
    cartTitle.textContent = t(sku ? '바로 구매' : '장바구니');
    success.hidden = true;
    cartContent.hidden = false;
    syncCatalog();
    renderCart();
    if (!cartDialog.open) cartDialog.showModal();
  }
  document.querySelectorAll('[data-cart-open]').forEach(button => button.addEventListener('click', () => openCart()));
  document.querySelectorAll('[data-cart-close]').forEach(button => button.addEventListener('click', () => cartDialog.close()));
  cartDialog.addEventListener('close', () => { directSku = null; renderCart(); cartFocus?.focus(); });
  cartItems.addEventListener('click', event => {
    const button = event.target.closest('[data-operation]');
    if (!button || directSku) return;
    const sku = button.dataset.sku;
    const item = store.snapshot().items.find(value => value.sku === sku);
    if (!item) return;
    let ok=false;
    if (button.dataset.operation === 'remove') ok=store.remove(sku);
    else if (button.dataset.operation === 'plus') ok=store.add(sku);
    else if (button.dataset.operation === 'minus') ok=store.set(sku,item.quantity-1);
    renderCart();
    if(!ok)showWarning(t(store.lastError()));
    const replacement = [...cartItems.querySelectorAll('[data-operation]')].find(el => el.dataset.sku === sku && el.dataset.operation === button.dataset.operation);
    (replacement || checkout).focus();
  });
  checkout.addEventListener('click', () => {
    if(checkout.disabled||cartContent.hidden)return;
    checkout.disabled=true;
    const order = store.checkout(directSku,quoteRevision,quoteSignature);
    if (!order) {const error=store.lastError();syncCatalog();renderCart();showWarning(t(error));return;}
    directSku = null;
    syncCatalog();
    renderCart();
    cartContent.hidden = true;
    success.hidden = false;
    completedOrder=order;
    globalThis.SkyCatEmail?.notify('goods',order,true);
    renderReceipt(order);
    success.querySelector('button').focus();
  });
  function renderReceipt(order){
    cartTitle.textContent = t('가상 주문 완료');
    document.getElementById('order-message').textContent = t('총 {n}개 · {price} · 주문 접수 · 실제 결제 없음',{n:order.quantity,price:won(order.total)});
    const receipt = document.getElementById('order-receipt');
    receipt.replaceChildren(node('p',t('주문번호: {id}',{id:order.id})));
    for (const item of order.items) {
      receipt.append(node('p',nameOf(item)+' × '+item.quantity+' · '+won(item.subtotal)));
    }
    const mailStatus=node('p','');receipt.append(mailStatus);globalThis.SkyCatEmail?.bind(mailStatus,'goods',order.id);
  }
  document.getElementById('groups').addEventListener('click', event => {
    const favoriteButton=event.target.closest('button[data-favorite]');
    if(favoriteButton){
      const sku=favoriteButton.closest('.product-card').dataset.sku;
      if(!favoritesSessionOnly) favorites=readFavorites();
      if(favorites.has(sku))favorites.delete(sku);else favorites.add(sku);
      try {
        if(!storage)throw Error('No storage');
        storage.setItem(FAVORITE_KEY,JSON.stringify([...favorites]));
        favoritesSessionOnly=false;
      } catch {favoritesSessionOnly=true;notify(t('찜 목록을 이번 방문에만 유지합니다.'));}
      refreshFavorites();filter();if(favoriteButton.closest('.product-card').hidden)favoriteOnly.focus();
      return;
    }
    const addButton = event.target.closest('button[data-add]');
    if (addButton) { add(addButton.closest('.product-card').dataset.sku); return; }
    const button = event.target.closest('button[data-product]');
    if (!button) return;
    const productImage = button.closest('.product-card')?.querySelector('img');
    if (!productImage) return;
    lastFocus = button;
    selectedSku = button.closest('.product-card').dataset.sku;
    dialog.dataset.sku = selectedSku;
    photo.src = productImage.getAttribute('src');
    photo.alt = button.dataset.name;
    updateDetail();
    dialog.showModal();
  });
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  document.getElementById('dialog-dismiss').addEventListener('click', () => dialog.close());
  document.getElementById('dialog-add').addEventListener('click', () => {
    if (!selectedSku) return;
    add(selectedSku);
    dialog.close();
  });
  document.getElementById('dialog-buy').addEventListener('click', () => {
    if (!selectedSku) return;
    dialog.close();
    openCart(selectedSku, lastFocus);
  });
  dialog.addEventListener('click', event => { if(event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if(event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { if (!cartDialog.open) lastFocus?.focus(); });
  window.addEventListener('storage',e=>{
    if(e.key===null||e.key===FAVORITE_KEY){favorites=readFavorites();favoritesSessionOnly=false;refreshFavorites();filter();}
    if(e.key===null||e.key===SkyCatGoodsCommerce.KEY){syncCatalog();renderCart();}
  });
  window.addEventListener('pageshow',()=>{if(!favoritesSessionOnly)favorites=readFavorites();syncCatalog();renderCart();});
  function setLanguage(next,save=true){
    if(!['ko','en','ja'].includes(next))next='ko';
    if(next!==lang)toast.hidden=true;
    lang=next;if(save)sharedLocale?.save(lang);
    globalThis.SkyCatCurrency?.updateNote(document,lang);
    if(languageSelect)languageSelect.value=lang;
    if(i18n){document.documentElement.lang=lang;document.title=t('하늘고양이 카페')+' | '+t('굿즈샵');const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=t('하늘고양이 카페 공식 굿즈 컬렉션 — 포트폴리오용 가상 굿즈샵');translateStatic(lang);}
    document.getElementById('catalog-total').textContent=t('{g}개 품목 · {n}종',{g:groups.length,n:cards.length});
    syncCatalog();renderCart();
    if(cartDialog.open){if(completedOrder&&!success.hidden)renderReceipt(completedOrder);else cartTitle.textContent=t(directSku?'바로 구매':'장바구니');}
  }
  languageSelect?.addEventListener('change',()=>setLanguage(languageSelect.value));
  sharedLocale?.subscribe(next=>{if(next!==lang)setLanguage(next,false);},{syncOnPageShow:false});
  setLanguage(lang,false);
})();
