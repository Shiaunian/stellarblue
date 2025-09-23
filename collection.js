(function(global){
  // ===== 工具 =====
  function qs(s, p){ return (p||document).querySelector(s); }
  function qsa(s, p){ return Array.prototype.slice.call((p||document).querySelectorAll(s)); }
  function el(tag, cls, html){
    var d = document.createElement(tag);
    if(cls) d.className = cls;
    if(html!=null) d.innerHTML = html;
    return d;
  }
  function fmt(n){ return new Intl.NumberFormat('zh-Hant').format(n||0); }

  // ===== 內部狀態 =====
  var api = {
    getPlayer: function(){ return null; },
    save: function(){},
    log: function(t){ console.log(t); }
  };
  var mounted = false;
  var modal  = null;
  var tabButtons = null;
  var viewWraps  = null;
  var searchBox  = null;
  var sortSel    = null;
  var gridList   = null;
  var gridShelf  = null;
  
    // ===== 追加：展示架佔用計算與加成重算 =====
  function countOnShelf(id){
    var n = 0;
    for (var i=0;i<shelf.length;i++){
      if (String(shelf[i]) === String(id)) n++;
    }
    return n;
  }

  function countAvailable(id){
    var total = countOf(id);
    var used = countOnShelf(id);
    var left = total - used;
    if (left < 0) left = 0;
    return left;
  }

  function recalcShelfBonus(){
    var bonus = { hp:0, mp:0, atk:0, spd:0 };
    for (var i=0;i<5;i++){
      var sid = shelf[i];
      if (!sid) continue;
      try{
        var it = (window.Items && Items[sid]) ? Items[sid] : null;
        if (it && it.bonus){
          if (it.bonus.hp) bonus.hp += it.bonus.hp;
          if (it.bonus.mp) bonus.mp += it.bonus.mp;
          if (it.bonus.atk) bonus.atk += it.bonus.atk;
          if (it.bonus.spd) bonus.spd += it.bonus.spd;
        }
      }catch(_){}
    }
    try{
      var P = api.getPlayer ? api.getPlayer() : null;
      if (P){
        P.bonusFromShelf = bonus;
        if (typeof window.render === 'function') { window.render(P); }
        if (api.recalc) api.recalc();
      }
    }catch(_){}
  }

  var dataAll    = [];     // [{id,name,count}]
  var shelf      = [];     // [cardId,...]

  // ===== 樣式（一次注入） =====
  function injectCSS(){
    if (document.getElementById('collectionCSS')) return;
    var css = el('style'); css.id='collectionCSS';
    css.textContent =
      '#collectionModal .sheet{width:min(100%,960px);max-height:90vh;display:flex;flex-direction:column;}'+
      '#collectionModal .body{overflow:auto;padding:12px;display:flex;flex-direction:column;gap:12px;}'+
      '#collectionModal .tabbar{display:flex;gap:8px;border-bottom:1px solid #eee;padding:8px 12px;}'+
      '#collectionModal .tabbar .tab{padding:6px 12px;border-radius:8px;cursor:pointer;}'+
      '#collectionModal .tabbar .tab.active{background:#222;color:#fff;}'+
      '#collectionModal .tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}'+
      '#collectionModal .tools .left{display:flex;gap:8px;align-items:center}'+
      '#collectionModal input[type="search"]{padding:6px 10px;border:1px solid #ddd;border-radius:8px;min-width:160px}'+
      '#collectionModal select{padding:6px 10px;border:1px solid #ddd;border-radius:8px;}'+
      '.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px}'+
      '.card-cell{position:relative;aspect-ratio:3/4;border:0px solid #ddd;border-radius:10px;background:#fafafa00;display:flex;align-items:center;justify-content:center;cursor:pointer}'+
      '.col-thumb{font-size:12px;text-align:center;line-height:1.1;padding:4px}'+
      '.card-cell img{width:100%;height:auto;aspect-ratio:80/106.67;object-fit:contain;display:block;margin:auto}'+
      '.card-cell .name{position:absolute;left:4px;right:36px;bottom:4px;text-align:center;font-size:12px;color:#fff;background:rgba(0,0,0,.55);padding:2px 4px;border-radius:6px}'+
      '.card-cell .qty{position:absolute;right:4px;bottom:4px;background:#222;color:#fff;padding:2px 6px;border-radius:999px;font-size:12px}'+
      '.shelf{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}'+
      '.shelf .slot{position:relative;aspect-ratio:3/4;border:1px dashed #bbb;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center}'+
      '.shelf .slot.filled{border-style:solid;border-color:#666}'+
      '.shelf .slot .remove{position:absolute;right:6px;top:6px;background:#000;color:#fff;border-radius:999px;line-height:1;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer}'+
      '@media (max-width:640px){ .card-grid{grid-template-columns:repeat(auto-fill,minmax(80px,1fr));} }';
    document.head.appendChild(css);
  }

  // ===== UI 建立 =====
  function buildModal(){
    if (modal) return modal;

    modal = el('div'); modal.id='collectionModal'; modal.className='modal'; modal.setAttribute('aria-hidden','true');

    var mask = el('div','mask'); mask.setAttribute('data-close','collection');
    var sheet = el('div','sheet'); sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-labelledby','colTitle');

    // 標題列
    var title = el('div','sec-title'); title.id='colTitle';
    title.innerHTML = '卡片收藏<div class="close" data-close="collection">✕</div>';

    // 內容
    var body = el('div','body');

    // 分頁列
    var tabs = el('div','tabbar');
    tabs.innerHTML =
      '<div class="tab active" data-tab="list">卡片收藏</div>'+
      '<div class="tab" data-tab="shelf">展示架</div>';

    // 工具列（搜尋 / 排序）— 只在「卡片收藏」頁顯示
    var tools = el('div','tools');
    tools.innerHTML =
      '<div class="left">'+
        '<input id="colSearch" type="search" placeholder="搜尋卡片（編號/名稱）" />'+
      '</div>'+
      '<div class="right">'+
        '<label>排序：</label>'+
        '<select id="colSort">'+
          '<option value="id">編號</option>'+
          '<option value="name">名稱</option>'+
          '<option value="count">擁有數量</option>'+
        '</select>'+
      '</div>';

    // 兩個檢視容器
    var viewList = el('div'); viewList.dataset.view='list';
    var viewShelf = el('div'); viewShelf.dataset.view='shelf'; viewShelf.style.display='none';

    // 清單：卡片格
    gridList = el('div','card-grid'); viewList.appendChild(gridList);

    // 展示架：5 欄
    var shelfTitle = el('div', null, '<b>展示架（5 欄）</b><div style="font-size:12px;color:#666">點卡片放入展示架，再點一次可移除；上限 5 張</div>');
    gridShelf = el('div','shelf');
    for (var i=0;i<5;i++){
      var s = el('div','slot'); s.dataset.pos = String(i);
      gridShelf.appendChild(s);
    }
    viewShelf.appendChild(shelfTitle);
    viewShelf.appendChild(gridShelf);

    // 組裝
    body.appendChild(tabs);
    body.appendChild(tools);
    body.appendChild(viewList);
    body.appendChild(viewShelf);

    sheet.appendChild(title);
    sheet.appendChild(body);
    modal.appendChild(mask);
    modal.appendChild(sheet);
    document.body.appendChild(modal);

    // 成員快取
    tabButtons = qsa('.tab', tabs);
    viewWraps  = [viewList, viewShelf];
    searchBox  = qs('#colSearch', tools);
    sortSel    = qs('#colSort', tools);

    // 綁定：關閉
    qsa('[data-close="collection"]', modal).forEach(function(x){
      x.addEventListener('click', function(){ Collection.close(); });
    });
    mask.addEventListener('click', function(){ Collection.close(); });

    // 綁定：分頁
    tabButtons.forEach(function(tb){
      tb.addEventListener('click', function(){
        var tab = tb.getAttribute('data-tab');
        tabButtons.forEach(function(t){ t.classList.toggle('active', t===tb); });
        for (var i=0;i<viewWraps.length;i++){
          var v = viewWraps[i];
          v.style.display = ( (tab==='list' && v===viewList) || (tab==='shelf' && v===viewShelf) ) ? '' : 'none';
        }
      });
    });

    // 綁定：搜尋 / 排序
    searchBox.addEventListener('input', renderList);
    sortSel.addEventListener('change', renderList);

// 互動：清單點擊→打開卡片資訊視窗
gridList.addEventListener('click', function(e){
  var cell = e.target.closest ? e.target.closest('.card-cell') : null;
  if (!cell) return;
  var id = cell.getAttribute('data-id');
  if (!id) return;

  // 取卡片資料
  var card = dataAll.find(function(it){ return String(it.id)===String(id); });
  if (!card) return;

  // 取正式圖（優先 items.js -> ItemDB.DB.cards 裡的 img）
  var imgUrl = (function(){
    try{
      var arr = (window.ItemDB && ItemDB.DB && ItemDB.DB.cards) ? ItemDB.DB.cards : [];
      for (var i=0;i<arr.length;i++){
        var it = arr[i] || {};
        if (String(it.id) === String(id)) {
          if (it.img && typeof it.img === 'string' && it.img.trim()) return it.img;
          break;
        }
      }
    }catch(_){}
    return '';
  })() || ('https://picsum.photos/seed/card_'+id+'/200/280');

  // 取正式名稱與說明（優先 items.js -> ItemDB.DB.cards）
  var officialName = '';
  var officialDesc = '';
  try{
    var arr2 = (window.ItemDB && ItemDB.DB && ItemDB.DB.cards) ? ItemDB.DB.cards : [];
    for (var j=0;j<arr2.length;j++){
      var c2 = arr2[j] || {};
      if (String(c2.id) === String(id)) {
        if (c2.name && typeof c2.name === 'string' && c2.name.trim()) officialName = c2.name;
        if (c2.desc && typeof c2.desc === 'string' && c2.desc.trim()) officialDesc = c2.desc;
        break;
      }
    }
  }catch(_){}
  var shownName = officialName || card.name || ('卡片 #'+id);
  var shownDesc = officialDesc || '尚無說明';

  // 填充卡片資訊（使用 imgUrl、名稱、說明）
  var html = ''
    + '<img src="'+imgUrl+'" style="width:80%;height:auto;aspect-ratio:80/106.67;object-fit:contain;display:block;margin:auto" />'
    + '<h3 style="text-align:center">'+ shownName +'</h3>'
    + '<p style="text-align:center">卡片介紹：'+ shownDesc +'</p>';
  qs('#cardInfoContent').innerHTML = html;


  // 綁定按鈕：放到展示架
qs('#btnAddToShelf').onclick = function(){
    var have = countAvailable(id);
    if (have<=0) { api.log('沒有可用的這張卡，無法放入展示架'); return; }

    var pos = -1;
    for(var i=0;i<5;i++){ if(!shelf[i]){ pos=i; break; } }
    if (pos===-1){
      api.log('展示架已滿（最多 5 張）','warn');
      return;
    }

    // 不動原始 dataAll.count，只在展示架記錄
    shelf[pos] = id;

    // 重新計算展示加成
    recalcShelfBonus();

    renderList();
    renderShelf();
    api.save();
    closeCardInfo();
  };



  // 綁定按鈕：販賣（原樣保留）
qs('#btnSellCard').onclick = function(){
  var have = countOf(id);
  if (have<=0) { api.log('沒有這張卡，無法販賣'); return; }

  // 建立販賣視窗
  var sellModal = document.createElement('div');
  sellModal.className = 'modal show';
  sellModal.innerHTML =
    '<div class="mask" data-close="sell"></div>'+
    '<div class="sheet" style="max-width:360px;padding:16px">'+
      '<div class="sec-title">販賣卡片</div>'+
      '<div style="margin:12px 0">擁有數量：'+have+'</div>'+
      '<input id="sellQtyInput" type="number" min="1" max="'+have+'" value="1" style="width:100%;padding:6px;margin-bottom:10px" />'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+
        '<button data-val="1">1</button>'+
        '<button data-val="5">5</button>'+
        '<button data-val="10">10</button>'+
        '<button data-val="max">最高</button>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<button id="btnSellCancel">取消</button> '+
        '<button id="btnSellConfirm">確定</button>'+
      '</div>'+
    '</div>';

  document.body.appendChild(sellModal);

  function closeSell(){
    if(sellModal && sellModal.parentNode){
      sellModal.parentNode.removeChild(sellModal);
    }
  }

  // 綁定快捷按鈕（自動限制為擁有數量）
  qsa('button[data-val]', sellModal).forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-val');
      var n;
      if (v === 'max') {
        n = have;
      } else {
        n = parseInt(v, 10);
        if (!n || n < 1) n = 1;
        if (n > have) n = have;
      }
      qs('#sellQtyInput', sellModal).value = n;
    });
  });


  // 確認販賣
  qs('#btnSellConfirm', sellModal).onclick = function(){
    var qty = parseInt(qs('#sellQtyInput', sellModal).value,10);
    if(!qty || qty<=0){ api.log('數量不正確'); return; }
    if(qty>have) qty = have;

    // 1) 先扣前端快取 dataAll（維持畫面立即更新）
    for (var k=0;k<dataAll.length;k++){
      if (String(dataAll[k].id)===String(id)){
        dataAll[k].count -= qty;
        if (dataAll[k].count<0) dataAll[k].count=0;
        break;
      }
    }

    // 2) 同步寫回玩家資料 P.cards（避免下次打開被覆蓋回來），並加上靈石
    var gain = 0;
    try{
      var P = api.getPlayer ? api.getPlayer() : null;
      if (P){
        // 確保 P.cards 存在，且統一成 { id: count } 物件格式
        if (!P.cards){ P.cards = {}; }
        var store = null;
        if (Array.isArray(P.cards)){
          var obj = {};
          for (var i=0;i<P.cards.length;i++){
            var it = P.cards[i]||{};
            var key = it.id!=null ? String(it.id) : null;
            if(!key) continue;
            var c = it.count!=null ? parseInt(it.count,10) : 1;
            if(isNaN(c)||c<0) c=0;
            obj[key] = (obj[key]||0) + c;
          }
          P.cards = obj;
          store = P.cards;
        } else if (typeof P.cards==='object'){
          store = P.cards;
        }

        var key2 = String(id);
        var cur = parseInt(store[key2]||0,10); if(isNaN(cur)||cur<0) cur=0;
        cur -= qty; if (cur<0) cur=0;
        if (cur===0){ delete store[key2]; } else { store[key2] = cur; }

        // 查單價並加錢
        var unitPrice = 0;
        try{
          var arr = (window.ItemDB && ItemDB.DB && ItemDB.DB.cards) ? ItemDB.DB.cards : [];
          for (var j=0;j<arr.length;j++){
            var cd = arr[j]||{};
            if (String(cd.id) === String(id)) {
              if (cd.price!=null) unitPrice = parseInt(cd.price,10) || 0;
              break;
            }
          }
        }catch(_){}
        gain = unitPrice * qty;
        P.currencies = P.currencies || { stone:0, diamond:0 };
        P.currencies.stone = (P.currencies.stone||0) + gain;
      }
    }catch(_){}

    // 3) 存檔 + 重載列表/展示架，確保畫面與資料一致
    try{
      if (window.Auth && Auth.saveCharacter && P){
        var clean = JSON.parse(JSON.stringify(P));
        delete clean._live;
        Auth.saveCharacter(clean);
      } else {
        api.save();
      }
    }catch(_){ api.save(); }

    loadDataFromPlayer(P);
    renderList();
    renderShelf();

    // 4) 立刻刷新頁面上的貨幣顯示
    try{
      if (window.Game && Game.recalc) {
        Game.recalc();
      } else {
        // 最小備援：直接更新頁首的靈石文本（若存在）
        var uiStone = document.querySelector('#uiStone');
        if (uiStone && P && P.currencies){
          uiStone.textContent = (P.currencies.stone||0);
        }
      }
    }catch(_){}

    closeSell();
    closeCardInfo();
    var logMsg = '已販賣 '+qty+' 張卡片 #'+id;
    if (gain>0) logMsg += '，獲得 '+gain+' 靈石';
    api.log(logMsg);
  };

  // 取消
  qs('#btnSellCancel', sellModal).onclick = closeSell;
  sellModal.querySelector('.mask').onclick = closeSell;
}



  openCardInfo();
});



    // 互動：展示架點擊→移除
gridShelf.addEventListener('click', function(e){
      var slot = e.target.closest ? e.target.closest('.slot') : null;
      if (!slot) return;
      var p = parseInt(slot.getAttribute('data-pos'),10);
      if (isNaN(p)) return;

      if (shelf[p]){
        var id = shelf[p];
        shelf[p] = null;

        // 不回補 dataAll.count，改為統一由 countAvailable 控制顯示與可用量

        // 重新計算展示加成
        recalcShelfBonus();

        renderList();
        renderShelf();
        api.save();
      }


    });

    // === 卡片資訊視窗 ===
    var cardInfoModal = document.createElement('div');
    cardInfoModal.id = 'cardInfoModal';
    cardInfoModal.className = 'modal';
    cardInfoModal.setAttribute('aria-hidden','true');
    cardInfoModal.setAttribute('tabindex','-1');
    cardInfoModal.innerHTML =
      '<div class="mask" data-close="cardInfo"></div>'
      + '<div class="sheet">'
      +   '<div class="sec-title">卡片資訊 <div class="close" data-close="cardInfo">✕</div></div>'
      +   '<div class="body">'
      +     '<div id="cardInfoContent"></div>'
      +     '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px">'
      +       '<button id="btnAddToShelf">放到展示架</button>'
      +       '<button id="btnSellCard">販賣</button>'
      +     '</div>'
      +   '</div>'
      + '</div>';

    document.body.appendChild(cardInfoModal);

    return modal;
  }

  // ===== 資料處理 =====
  function countOf(id){
    for (var i=0;i<dataAll.length;i++){
      if (String(dataAll[i].id) === String(id)) return dataAll[i].count||0;
    }
    return 0;
  }

  function loadDataFromPlayer(P){
    // 允許 P.cards（物件 {id:count} 或 陣列 [{id,count}]），都轉為統一格式
    dataAll.length = 0;

    // 讀 inventory
    var inv = (P && P.cards) ? P.cards : null;
    if (Array.isArray(inv)){
      for (var i=0;i<inv.length;i++){
        var it = inv[i] || {};
        var id = it.id!=null ? String(it.id) : null;
        if(!id) continue;
        var name = it.name || ('卡片 #'+id);
        var cnt = it.count!=null ? parseInt(it.count,10) : 1;
        if(isNaN(cnt)||cnt<0) cnt=0;
        dataAll.push({id:id, name:name, count:cnt});
      }
    } else if (inv && typeof inv==='object'){
      var ks = Object.keys(inv);
      for (var j=0;j<ks.length;j++){
        var k = ks[j];
        var cnt2 = parseInt(inv[k],10);
        if(isNaN(cnt2)||cnt2<0) cnt2=0;
        dataAll.push({id:String(k), name:('卡片 #'+k), count:cnt2});
      }
    }

    // 若完全沒有資料，給空陣列（UI 會顯示空）
    // 讀展示架
    var arr = (P && Array.isArray(P.cardShelf)) ? P.cardShelf.slice(0,5) : [];
    shelf = [null,null,null,null,null];
    for (var s=0;s<Math.min(arr.length,5);s++){
      var v = arr[s];
      shelf[s] = v ? String(v) : null;
    }
  }

  // ===== 繪製 =====
function renderList(){
  if(!gridList) return;
  var keyword = (searchBox.value||'').trim().toLowerCase();
  var mode = (sortSel.value||'id');

  // 過濾（只顯示「可用數量 > 0」的卡 = 總數 - 展示佔用）
  var list = [];
  for (var i=0;i<dataAll.length;i++){
    var it = dataAll[i];
    var hit = true;
    if (keyword){
      var t = (String(it.id)+' '+(it.name||'')).toLowerCase();
      hit = t.indexOf(keyword) >= 0;
    }
    if (hit){
      var remain = countAvailable(it.id);
      if (remain > 0){
        // 複製一份顯示用資料，避免改動原 dataAll
        list.push({ id: it.id, name: it.name, count: remain });
      }
    }
  }

  // 排序
  list.sort(function(a,b){
    if (mode === 'name'){
      var na = (a.name||'').toLowerCase();
      var nb = (b.name||'').toLowerCase();
      if (na<nb) return -1;
      if (na>nb) return 1;
      return 0;
    } else if (mode === 'count'){
      return (b.count||0) - (a.count||0);
    }
    return (parseInt(a.id,10)||0) - (parseInt(b.id,10)||0);
  });

  // 渲染（優先用 ItemDB 正式資料）
  var html = '';
  for (var j=0;j<list.length;j++){
    var it2 = list[j];
    var id = String(it2.id);

    var officialImg = '';
    var officialName = '';
    try{
      var arr = (window.ItemDB && ItemDB.DB && ItemDB.DB.cards) ? ItemDB.DB.cards : [];
      for (var k=0;k<arr.length;k++){
        var c = arr[k] || {};
        if (String(c.id)===id){
          officialImg  = c.img || '';
          officialName = c.name || '';
          break;
        }
      }
    }catch(_){}

    var name = (officialName && officialName.trim())
      ? officialName
      : (it2.name || ('卡片 #'+id));

    var img = (officialImg && officialImg.trim())
      ? officialImg
      : ('https://picsum.photos/seed/card_'+encodeURIComponent(id)+'/120/160');

    html += '<div class="card-cell" data-id="'+id+'">'+
              '<img alt="'+name+'" src="'+img+'"/>'+
              '<div class="name">'+name+'</div>'+
              '<div class="qty">x'+fmt(it2.count)+'</div>'+
            '</div>';
  }
  gridList.innerHTML = html || '<div style="color:#666">目前沒有任何卡片</div>';
}


function renderShelf(){
  if(!gridShelf) return;
  var cells = qsa('.slot', gridShelf);
  for (var i=0;i<cells.length;i++){
    var slot = cells[i];
    var id = shelf[i];
    if (!id){
      slot.classList.remove('filled');
      slot.innerHTML = '<div style="color:#aaa;font-size:12px">空位</div>';
    } else {
      var officialImg = '';
      var officialName = '';
      try{
        var arr = (window.ItemDB && ItemDB.DB && ItemDB.DB.cards) ? ItemDB.DB.cards : [];
        for (var k=0;k<arr.length;k++){
          var c = arr[k] || {};
          if (String(c.id)===String(id)){
            officialImg  = c.img || '';
            officialName = c.name || '';
            break;
          }
        }
      }catch(_){}

      var name = (officialName && officialName.trim()) ? officialName : ('卡片 #'+id);
      var img  = (officialImg && officialImg.trim())
        ? officialImg
        : ('https://picsum.photos/seed/card_'+encodeURIComponent(id)+'/120/160');

      slot.classList.add('filled');
      slot.innerHTML =
        '<div class="remove">×</div>'+
        '<div class="col-thumb"><img alt="'+name+'" src="'+img+'" style="width:100%;height:auto;aspect-ratio:80/106.67;object-fit:contain;display:block;margin:auto" /><div style="font-size:12px;text-align:center">'+name+'</div></div>';
    }
  }

  // 回寫到玩家資料 + 立刻刷新主頁面能力值（原樣保留）
  try{
    var P = api.getPlayer ? api.getPlayer() : null;
    if (P){
      P.cardShelf = shelf.slice(0,5);
      if (typeof window.render === 'function') { window.render(P); }
    }
  }catch(_){}
}




  // ===== 開關 =====
    function open(gameAPI){
    // 掛 API
    api.getPlayer = (gameAPI && gameAPI.getPlayer) ? gameAPI.getPlayer : api.getPlayer;
    api.save      = (gameAPI && gameAPI.save) ? gameAPI.save : api.save;
    api.log       = (gameAPI && gameAPI.log) ? gameAPI.log : api.log;

    injectCSS();
    buildModal();

    // 安全初始化玩家欄位
    var P = api.getPlayer ? api.getPlayer() : null;
    if (P){
        if (!P.cards){ P.cards = {}; }              // 預設空物件：{cardId: count}
        if (!Array.isArray(P.cardShelf)){ P.cardShelf = []; }
    }

    loadDataFromPlayer(P);
    renderList();
    renderShelf();

    // ★ 關鍵：加上 .show，才會套用 .modal.show { display:grid; }
    if (modal && modal.classList) { modal.classList.add('show'); }
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    }


    function close(){
    if(!modal) return;
    if (modal.classList) { modal.classList.remove('show'); }
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';

    // 存檔（避免遺漏）
    try{ api.save(); }catch(_){}
    }


  // ===== 匯出 =====
  var Collection = {
    mount: function(){ if(mounted) return; injectCSS(); buildModal(); mounted=true; },
    open: open,
    close: close
  };
  global.Collection = Collection;

  function openCardInfo(){
    var m = qs('#cardInfoModal');
    if (!m) return;
    m.setAttribute('aria-hidden','false');
    m.classList.add('show');
    // 先把焦點移到 modal 本身，避免 aria-hidden 衝突
    m.focus();
    // 如果需要自動聚焦到按鈕，可延遲一個 tick
    setTimeout(function(){
      var btn = qs('#btnAddToShelf');
      if (btn) btn.focus();
    }, 0);
  }

  function closeCardInfo(){
    var m = qs('#cardInfoModal');
    if (!m) return;
    m.setAttribute('aria-hidden','true');
    m.classList.remove('show');
  }

  document.body.addEventListener('click', function(e){
    if (e.target.dataset.close==='cardInfo'){
      closeCardInfo();
    }
  });


})(window);
