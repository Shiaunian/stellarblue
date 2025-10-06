// shop.js — 外掛式商店模組（含 UI + CSS）
(function (global){
  'use strict';

  // 小工具
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function toArray(x){ return (typeof x==='function') ? x() : (Array.isArray(x) ? x : []); }

  // 注入 CSS（含固定高度＋滾動條）
  function injectCSS(){
    if (document.getElementById('shop-style')) return;
    var css = `
#shopModal .sheet, #buyModal .sheet { width:min(96vw, 420px); }
#shopModal .bag-tabs { display:flex; gap:8px; padding:4px 0; }
#shopModal .bag-tab { padding:4px 10px; border-radius:8px; background:rgba(255,255,255,.06); }
#shopModal .bag-tab.active { background:rgba(255,255,255,.14); }
#shopModal .bag-list, #shopModal #merchantBox, #shopModal #shopList { max-height:62svh; overflow:auto; }

/* 每列卡片外觀與排版（示意圖風格） */
#shopModal .item-row, #buyModal .item-row{
  display:flex; gap:14px; align-items:center;
  background:rgba(23,32,46,.96);            /* 深色卡片底 */
  border-radius:16px;
  padding:10px 14px;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);
}

/* 固定縮圖框，避免被外部 img 樣式撐爆
   注意：把 overflow 改為 visible，讓下方顯示的數量可以不被裁切 */
#shopModal .item-thumb, #buyModal .item-thumb {
  width:48px; height:48px; flex:0 0 48px;
  border-radius:10px; overflow:visible;
  background:radial-gradient(120% 120% at 20% 20%, rgba(255,255,255,.08), rgba(0,0,0,.0));
  position:relative;
}

/* 圖片填滿框且不變形；!important 防止被外部樣式覆蓋 */
#shopModal .item-thumb img, #buyModal .item-thumb img {
  width:100% !important; height:100% !important;
  object-fit:cover; display:block; border-radius:10px;
}

/* 縮圖下方的小數量標籤（小字、置中、半透明背景） */
#shopModal .item-thumb .thumb-count, #buyModal .item-thumb .thumb-count {
  position:absolute;
  left:50%;
  transform:translateX(-50%);
  bottom:-10px;
  font-size:11px;
  line-height:1;
  color:#cbd5e1;
  background:rgba(0,0,0,0.36);
  padding:2px 6px;
  border-radius:8px;
  box-shadow:inset 0 -1px 0 rgba(0,0,0,.2);
}

/* 已售罄 (0) 的數量顯示為紅底白字 */
#shopModal .item-thumb .thumb-count.sold-out, #buyModal .item-thumb .thumb-count.sold-out {
  background:#7f1d1d;
  color:#fff;
  box-shadow:inset 0 -1px 0 rgba(0,0,0,.35);
}

/* 右側主體排版 */
#shopModal .item-main, #buyModal .item-main{ flex:1; min-width:0; }
#shopModal .item-title, #buyModal .item-title{
  display:flex; align-items:center; gap:8px;
  margin:2px 0 6px 0;
}

/* 名稱做成膠囊（灰藍） */
#shopModal .item-title .item-name, #buyModal .item-title .item-name{
  display:inline-block;
  padding:2px 10px;
  border-radius:9999px;
  background:rgba(255,255,255,.10);
  color:#d1d5db;
  font-weight:600;
  line-height:1.4;
}

/* 效果標籤（紅膠囊 / 深藍膠囊） */
.badge{ display:inline-block; padding:2px 8px; border-radius:9999px;
  background:#334155; color:#e5e7eb; font-size:12px; margin-left:8px;
  box-shadow:inset 0 -1px 0 rgba(0,0,0,.25);
}
.badge.hp{ background:#7f1d1d; color:#fff; }

/* 下排：價格（灰字） + 右側按鈕 */
#shopModal .item-sub, #buyModal .item-sub{
  display:flex; align-items:center; justify-content:space-between;
}
#shopModal .item-sub .sub-left, #buyModal .item-sub .sub-left{
  color:#94a3b8; font-size:12px; letter-spacing:.2px;
}

/* 藍色膠囊購買按鈕（靠右） */
#shopModal .item-sub .opx.primary, #buyModal .item-sub .opx.primary{
  border:0; outline:0;
  padding:8px 16px;
  border-radius:9999px;
  background:#4f67ff;
  color:#fff; font-weight:700;
  box-shadow:0 2px 0 rgba(0,0,0,.25), inset 0 -2px 0 rgba(0,0,0,.12);
  cursor:pointer;
}
#shopModal .item-sub .opx.primary:hover, #buyModal .item-sub .opx.primary:hover{
  filter:brightness(1.05);
}
#shopModal .item-sub .opx.primary:active, #buyModal .item-sub .opx.primary:active{
  transform:translateY(1px);
}

    `;
    
    var s = document.createElement('style'); s.id = 'shop-style'; s.textContent = css;
    document.head.appendChild(s);
  }




  // 生成 DOM（商店 / 購買）
  function ensureDOM(){
    if (qs('#shopModal') && qs('#buyModal')) return;

    // 商店
    var shop = document.createElement('div');
    shop.id = 'shopModal'; shop.className = 'modal'; shop.setAttribute('aria-hidden','true');
    shop.innerHTML = ''
     + '<div class="mask" data-close="shop"></div>'
     + '<div class="sheet" role="dialog" aria-labelledby="shopTitle">'
     + '  <div class="sec-title" id="shopTitle">商 店<div class="close" data-close="shop">✕</div></div>'
     + '  <div class="body" style="display:grid;gap:8px;">'
     + '    <div id="merchantList" style="display:block;">'
     + '      <div class="bag-tabs"><span class="bag-tab active">商人清單</span></div>'
     + '      <div id="merchantBox" class="bag-list"></div>'
     + '    </div>'
     + '    <div id="merchantShop" style="display:none;">'
     + '      <div class="bag-tabs">'
     + '        <span class="bag-tab" id="btnBackMerchants">◀ 返回</span>'
     + '        <span class="bag-tab active" id="merchantName">商人</span>'
     + '      </div>'
     + '      <div id="shopHeader" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'
     + '        <div id="merchantTopLeft"></div>'
     + '        <div id="playerCurrency" style="font-weight:700;">靈石：<span id="playerStone">—</span></div>'
     + '      </div>'
     + '      <div id="shopList" class="bag-list"></div>'
     + '      <div id="purchaseLog" class="bag-list" style="max-height:22svh; overflow:auto; display:none; border-top:1px solid rgba(255,255,255,0.03); padding-top:8px;">'
     + '        <!-- 購買訊息會顯示在這裡（最新在上方） -->'
     + '      </div>'
     + '    </div>'
     + '  </div>'
     + '</div>';
    document.body.appendChild(shop);

    // 購買
    var buy = document.createElement('div');
    buy.id = 'buyModal'; buy.className = 'modal'; buy.setAttribute('aria-hidden','true');
    buy.innerHTML = ''
     + '<div class="mask" data-close="buy"></div>'
     + '<div class="sheet" role="dialog" aria-labelledby="buyTitle">'
     + '  <div class="sec-title" id="buyTitle">購 買<div class="close" data-close="buy">✕</div></div>'
     + '  <div class="body">'
     + '    <div class="item-row" style="cursor:default">'
     + '      <div class="item-thumb" id="buyIcon"></div>'
     + '      <div class="item-main">'
     + '        <div class="item-title cons" id="buyTop"></div>'
     + '        <div class="item-sub">'
     + '          <span class="sub-left" id="buyLeft"></span>'
     + '          <span class="sub-right" id="buyRight"></span>'
     + '        </div>'
     + '      </div>'
     + '    </div>'
     + '    <div class="kv" style="grid-template-columns:1fr;">'
     + '      <label class="item-sub" style="display:flex;align-items:center;gap:10px;">'
     + '        <span>數量：</span>'
     + '        <input id="buyQty" type="number" value="1" min="1" style="width:80px;" />'
     + '        <span id="buyCost" style="margin-left:auto;">總價：—</span>'
     + '      </label>'
     + '    </div>'
     + '    <div class="ops" style="justify-content:flex-end;">'
     + '      <button id="btnConfirmBuy" class="opx primary">購買</button>'
     + '    </div>'
     + '  </div>'
     + '</div>';
    document.body.appendChild(buy);

    // 關閉與返回
    qsa('[data-close="shop"]').forEach(function(el){ el.addEventListener('click', api.close); });
    qsa('[data-close="buy"]').forEach(function(el){ el.addEventListener('click', closeBuy); });
    var back = qs('#btnBackMerchants'); if (back){ back.addEventListener('click', function(){
      var list = qs('#merchantList'), page = qs('#merchantShop');
      if (list) list.style.display='block';
      if (page) page.style.display='none';
      // 回到商人列表時，隱藏交易訊息區
      try{ var log = qs('#purchaseLog'); if (log){ log.style.display = 'none'; } }catch(_){}
    });}
    // 確認購買
    var btn = qs('#btnConfirmBuy');
    if (btn) btn.addEventListener('click', confirmBuy);
  }


  // 商人清單（可擴充）  —（已加入雲端同步支援）
  var merchants = [
    {
      name: '藥鋪小李',
      icon: 'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1759631237/%E8%97%A5%E9%8B%AA%E5%B0%8F%E6%9D%8E_yy7wxb.png',
      dailyCounts: {
        'hp_small': 20,
        'hp_mid': 20,
        'mp_small': 20
      },
      // 每個商人都內含 isOpen 判定（使用台北/台灣時區 UTC+8）
      isOpen: function(){
        var d = new Date();
        var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        var now = new Date(utc + 8 * 60 * 60000); // 台北時間
        // 藥鋪小李：每週一到週日都開（也就是每天都開）
        return true;
      },
      // items 回傳從 ItemDB 讀取（只需要寫 id，會自動補全 name/price/icon/effect），count 優先使用 this.dailyCounts，再 fallback 到 this.getDailyCount，最後預設 20
      items: function(){
        var ids = ['hp_small','hp_mid','mp_small'];
        var out = [];
        var perMap = (this && this.dailyCounts) ? this.dailyCounts : null;
        for (var i=0;i<ids.length;i++){
          var id = ids[i];
          var def = (window.ItemDB && ItemDB.getDef) ? ItemDB.getDef('consumables', id) : null;
          var cnt = 20;
          try{
            if (perMap && typeof perMap[id] !== 'undefined') cnt = perMap[id];
            else if (typeof this.getDailyCount === 'function') cnt = this.getDailyCount(id);
          }catch(e){}
          if (def){
            // 不使用展開運算子，改用老寫法合併屬性
            var copy = {
              id: def.id,
              name: def.name,
              price: def.price || 0,
              icon: def.icon || '',
              effect: def.effect || null,
              kind: 'consumables',
              count: cnt
            };
            out.push(copy);
          } else {
            out.push({ id: id, name: id, price: 0, icon: '', effect: null, kind: 'consumables', count: cnt });
          }
        }
        return out;
      },

      // 每日持有數量（fallback，item 本身也有 count）
      getDailyCount: function(itemId){
        return 20;
      }
    },


    {
      name: '水果小古',
      icon: 'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1759631237/%E6%B0%B4%E6%9E%9C%E5%B0%8F%E5%8F%A4_h6k3yp.png',
      dailyCounts: {
        'food_apple': 20,
        'food_banana': 20,
        'food_greenapple': 20
      },
      // 每週一到週四顯示開放（台灣時間）
      isOpen: function(){
        var d = new Date();
        var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        var now = new Date(utc + 8 * 60 * 60000); // 台北時間
        var day = now.getDay(); // 0=Sun,1=Mon,...6=Sat
        return (day >= 1 && day <= 4); // Mon-Thu
      },
      // items 回傳從 ItemDB 讀取（只需要寫 id），count 由 getDailyCount 控制
      items: function(){
        var ids = ['food_apple','food_banana','food_greenapple'];
        var out = [];
        var perMap = (this && this.dailyCounts) ? this.dailyCounts : null;
        for (var i=0;i<ids.length;i++){
          var id = ids[i];
          var def = (window.ItemDB && ItemDB.getDef) ? ItemDB.getDef('consumables', id) : null;
          var cnt = 20;
          try{
            if (perMap && typeof perMap[id] !== 'undefined') cnt = perMap[id];
            else if (typeof this.getDailyCount === 'function') cnt = this.getDailyCount(id);
          }catch(e){}
          if (def){
            var copy = {
              id: def.id,
              name: def.name,
              price: def.price || 0,
              icon: def.icon || '',
              effect: def.effect || null,
              kind: 'consumables',
              count: cnt
            };
            out.push(copy);
          } else {
            out.push({ id: id, name: id, price: 0, icon: '', effect: null, kind: 'consumables', count: cnt });
          }
        }
        return out;
      },
      getDailyCount: function(itemId){
        return 20;
      }
    },


    {
      name: '氣血神秘商人',
      icon: 'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1759631237/%E6%B0%A3%E8%A1%80%E7%A5%9E%E7%A7%98%E5%95%86%E4%BA%BA_mch3k0.png',
      dailyCounts: {
        'hp_large': 20,
        'jade_qixue_dan': 20,
        'phoenix_blood_pill': 20
      },
      // 每天有兩個時段：13:00~15:00 與 20:00~21:00（台灣時間）
      isOpen: function(){
        var d = new Date();
        var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        var now = new Date(utc + 8 * 60 * 60000); // 台北時間
        var mins = now.getHours() * 60 + now.getMinutes();
        if (mins >= (13*60) && mins < (15*60)) return true;
        if (mins >= (20*60) && mins < (21*60)) return true;
        return false;
      },
      // items 回傳從 ItemDB 讀取（只需要寫 id），count 由 getDailyCount 控制
      items: function(){
        var ids = ['hp_large','jade_qixue_dan','phoenix_blood_pill'];
        var out = [];
        var perMap = (this && this.dailyCounts) ? this.dailyCounts : null;
        for (var i=0;i<ids.length;i++){
          var id = ids[i];
          var def = (window.ItemDB && ItemDB.getDef) ? ItemDB.getDef('consumables', id) : null;
          var cnt = 20;
          try{
            if (perMap && typeof perMap[id] !== 'undefined') cnt = perMap[id];
            else if (typeof this.getDailyCount === 'function') cnt = this.getDailyCount(id);
          }catch(e){}
          if (def){
            var copy = {
              id: def.id,
              name: def.name,
              price: def.price || 0,
              icon: def.icon || '',
              effect: def.effect || null,
              kind: 'consumables',
              count: cnt
            };
            out.push(copy);
          } else {
            out.push({ id: id, name: id, price: 0, icon: '', effect: null, kind: 'consumables', count: cnt });
          }
        }
        return out;
      },
      getDailyCount: function(itemId){
        return 20;
      }
    },


    // ★ 管理員專用商人（只有管理員看得到）  --- ※ 我完全保留原內容（不改動）
    {
      name: '管理員商店',
      icon: 'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1759631238/%E7%AE%A1%E7%90%86%E5%93%A1%E5%95%86%E5%BA%97_jhywic.png',
      lockedText: '管理員限定',
      unlock: function(){
        try{ return !!(global.Auth && Auth.isAdminUser && Auth.isAdminUser()); }
        catch(_){ return false; }
      },
      items: function(){
        var kinds = ['consumables','materials','weapons','ornaments','earrings','cloaks','armors','boots','medals','cards','hidden'];
        var out = [];
        if (global.ItemDB && ItemDB.list){
          for (var i=0;i<kinds.length;i++){
            var arr = ItemDB.list(kinds[i]);
            if (!Array.isArray(arr)) arr = [];
            for (var j=0;j<arr.length;j++){
              var it = arr[j] || {};
              out.push({
                id: it.id,
                name: it.name,
                price: it.price || 0,
                icon: it.icon || '',
                effect: it.effect || null,
                kind: kinds[i]   // 供購買時判斷加入哪個袋子/欄位
              });
            }
          }
        }
        return out;
      }
    },

    {
      name: '洞窟補給商',
      icon: 'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1759631238/%E6%B4%9E%E7%AA%9F%E8%A3%9C%E7%B5%A6%E5%95%86_tjyzzg.png',
      lockedText: '尚未解鎖',
      unlock: function(){
        try{
          var P = (global.Auth && Auth.getCharacter) ? Auth.getCharacter() : null;
          return !!(P && P.mapProg && P.mapProg.slime_cave && P.mapProg.slime_cave.bossReady);
        }catch(_e){ return false; }
      },
      items: function(){
        return [{ id:'antidote', name:'解毒藥', price:120, icon:'https://i.ibb.co/JxR7ZzP/antidote.png' }];
      }
    }
  ];
  
  var purchaseLogs = {}; // { "商人名稱": [ { time: 'YYYY/MM/DD hh:mm:ss', playerName: '角色名', itemName:'', qty:1, msg:'' }, ... ] }
  
  // === 新增：Shop counts 同步 helpers（會監聽 DB / fallback localStorage） ===

  function _shop_applyRemoteCounts(data){
    // data 預期形態： { "藥鋪小李": { hp_small:19, ... }, "水果小古": { ... } }
    try{
      if (!data || typeof data !== 'object') return;
      for (var i=0;i<merchants.length;i++){
        var M = merchants[i];
        if (!M || !M.name) continue;
        if (data[M.name] && typeof data[M.name] === 'object'){
          M.dailyCounts = M.dailyCounts || {};
          // 用遠端值覆蓋本地
          for (var k in data[M.name]){
            if (!data[M.name].hasOwnProperty(k)) continue;
            M.dailyCounts[k] = Number(data[M.name][k]) || 0;
          }
        }
      }
    }catch(_){}
  }

  function attachShopSync(){
    // 優先使用全域 DB 物件（你的專案內其他檔案有使用 DB.ref()），若無則使用 localStorage fallback
    try{
      if (window.DB && typeof DB.ref === 'function'){
        var ref = DB.ref('shop/dailyCounts');
        // 先嘗試一次 pull
        ref.get().then(function(snap){
          var val = (snap && snap.exists()) ? snap.val() : {};
          _shop_applyRemoteCounts(val);
          try{ renderMerchants(); }catch(_){}
        }).catch(function(){});
        // 再開監聽：若任一玩家更新，所有連線玩家會收到 on('value')
        try{ ref.off('value'); }catch(_){}
        ref.on('value', function(snap){
          var val = (snap && snap.exists()) ? snap.val() : {};
          _shop_applyRemoteCounts(val);
          try{ renderMerchants(); }catch(_){}
          try{
            var curName = (qs('#merchantName') && qs('#merchantName').textContent) ? qs('#merchantName').textContent : null;
            if (curName) {
              // 如果正在檢視某個商人，重新打開一次以更新商品數量顯示
              for (var j=0;j<merchants.length;j++){
                if (merchants[j] && merchants[j].name === curName){
                  try{ openMerchant(curName, (typeof merchants[j].items === 'function') ? merchants[j].items.call(merchants[j]) : (Array.isArray(merchants[j].items) ? merchants[j].items : [])); }catch(_){}
                  break;
                }
              }
            }
          }catch(_){}
        });
        return;
      }
    }catch(_){}
    // fallback: localStorage
    try{
      var raw = localStorage.getItem('shop_dailyCounts_v1');
      if (raw){
        var parsed = JSON.parse(raw);
        _shop_applyRemoteCounts(parsed);
        try{ renderMerchants(); }catch(_){}
      }
    }catch(_){}
  }

  function saveMerchantCountsToRemote(name, counts){
    // counts 應為物件 {id: number, ...}
    try{
      if (window.DB && typeof DB.ref === 'function'){
        var obj = {};
        obj[name] = counts || {};
        return DB.ref('shop/dailyCounts').update(obj).catch(function(){});
      }else{
        // fallback localStorage，整個 map 存一份
        try{
          var raw = localStorage.getItem('shop_dailyCounts_v1');
          var parsed = raw ? JSON.parse(raw) : {};
          parsed[name] = counts || {};
          localStorage.setItem('shop_dailyCounts_v1', JSON.stringify(parsed));
        }catch(_){}
      }
    }catch(_){}
  }

  // 最後：呼叫 attachShopSync 以載入/監聽遠端數量（放在 merchants 定義後）——如果已經有 DB 連線，就會自動同步
  function savePurchaseLogsToRemote(name, logs){
    try{
      if (window.DB && typeof DB.ref === 'function'){
        var obj = {};
        obj[name] = logs || [];
        // 使用 update 只更新該商人的 logs
        return DB.ref('shop/purchaseLogs').update(obj).catch(function(){});
      } else {
        // fallback localStorage（整個 map 存一份）
        try{
          var raw = localStorage.getItem('shop_purchaseLogs_v1');
          var parsed = raw ? JSON.parse(raw) : {};
          parsed[name] = logs || [];
          localStorage.setItem('shop_purchaseLogs_v1', JSON.stringify(parsed));
        }catch(_){}
      }
    }catch(_){}
  }

  function attachPurchaseLogSync(){
    try{
      if (window.DB && typeof DB.ref === 'function'){
        var ref = DB.ref('shop/purchaseLogs');
        // 先拉一次
        ref.get().then(function(snap){
          var val = (snap && snap.exists()) ? snap.val() : {};
          try{ purchaseLogs = (typeof val === 'object' && val) ? val : {}; }catch(_){}
        }).catch(function(){});
        // 開監聽（所有玩家會收到更新）
        try{ ref.off('value'); }catch(_){}
        ref.on('value', function(snap){
          var val = (snap && snap.exists()) ? snap.val() : {};
          try{
            purchaseLogs = (typeof val === 'object' && val) ? val : {};
            // 若當前正在檢視某個商人，重新渲染該商人的交易紀錄
            var curName = (qs('#merchantName') && qs('#merchantName').textContent) ? qs('#merchantName').textContent : null;
            if (curName){
              try{ openMerchant(curName, (function(){ for (var i=0;i<merchants.length;i++){ if (merchants[i] && merchants[i].name===curName) return (typeof merchants[i].items === 'function') ? merchants[i].items.call(merchants[i]) : (Array.isArray(merchants[i].items) ? merchants[i].items : []); } return []; })() ); }catch(_){}
            }
          }catch(_){}
        });
        return;
      }
    }catch(_){}
    // fallback: localStorage
    try{
      var raw = localStorage.getItem('shop_purchaseLogs_v1');
      if (raw){
        var parsed = JSON.parse(raw);
        purchaseLogs = parsed || {};
      }
    }catch(_){}
  }

  try{ attachShopSync(); }catch(_){}
  try{ attachPurchaseLogSync(); }catch(_){}




  function renderMerchants(){
    var box = qs('#merchantBox'); if(!box) return;
    box.innerHTML = '';
    merchants.forEach(function(m){
      var row = document.createElement('div');
      row.className = 'item-row';
      var unlocked = typeof m.unlock==='function' ? !!m.unlock() : true;
      var open = typeof m.isOpen === 'function' ? !!m.isOpen() : true;
      // 如果未解鎖或非開放時段，顯示灰階
      row.style.filter = (unlocked && open) ? 'none' : 'grayscale(1) opacity(.5)';
      var statusText = '';
      if (!unlocked) statusText = (m.lockedText || '尚未解鎖');
      else statusText = open ? '販售中' : '休息中';
      row.innerHTML = ''
        + '<div class="item-thumb"><img src="'+m.icon+'" alt="'+m.name+'"></div>'
        + '<div class="item-main">'
        + '  <div class="item-title"><span class="item-name">'+m.name+'</span></div>'
        + '  <div class="item-sub"><span class="sub-left">'+(statusText)+'</span></div>'
        + '</div>';
      if (unlocked && open){
        row.addEventListener('click', function(){ openMerchant(m.name, (typeof m.items === 'function') ? m.items.call(m) : (Array.isArray(m.items) ? m.items : [])); });
      }
      box.appendChild(row);
    });
  }


  function openMerchant(name, items){
    var list = qs('#merchantList'), page = qs('#merchantShop');
    if(list) list.style.display='none';
    if(page) page.style.display='block';
    var nameEl = qs('#merchantName'); if (nameEl) nameEl.textContent = name;
    var box = qs('#shopList'); if (!box) return;
    box.innerHTML = '';

    // 顯示/更新玩家靈石在上方 header
    try{
      var P0 = (global.Game && Game.getPlayer) ? Game.getPlayer() : null;
      if (P0 && qs('#playerStone')){
        var s0 = (P0.currencies && typeof P0.currencies.stone === 'number') ? P0.currencies.stone : 0;
        qs('#playerStone').textContent = String(s0);
      }
    }catch(_){}

    // 顯示該商人的歷史購買訊息（若有）
    try{
      var log = qs('#purchaseLog');
      if (log){
        log.innerHTML = '';
        var arr = purchaseLogs[name] || [];
        for (var t=0;t<arr.length;t++){
          var e = arr[t];
          var el = document.createElement('div');
          el.style.fontSize = '12px';
          el.style.padding = '6px 0';
          el.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
          el.textContent = (e.time || '') + ' — ' + (e.playerName || '') + ' 購買了 ' + (e.itemName || '') + ' ×' + (e.qty || 1) + (e.msg ? (' ('+e.msg+')') : '');
          log.appendChild(el);
        }
        // 顯示交易區（商人頁面打開時顯示）
        log.style.display = 'block';
      }
    }catch(_){}

    for (var i=0; i<items.length; i++){
      var it = items[i]||{};
      var hasIcon = it.icon && /^https?:\/\//.test(it.icon);
      var effHp = it.effect && it.effect.hp ? it.effect.hp : 0;
      var effMp = it.effect && it.effect.mp ? it.effect.mp : 0;
      var effHtml = '';
      if (effHp){ effHtml += '<span class="badge hp">氣血+'+effHp+'</span>'; }
      if (effMp){ effHtml += '<span class="badge">真元+'+effMp+'</span>'; }

      var row = document.createElement('div');
      row.className = 'item-row';
      // 計算顯示數量與樣式（count === 0 時標示為 sold-out）
      var countText = (typeof it.count === 'number') ? ('×' + it.count) : '';
      var countClass = (typeof it.count === 'number' && it.count === 0) ? 'thumb-count sold-out' : 'thumb-count';
      row.innerHTML = ''
        + '<div class="item-thumb">' + (hasIcon?('<img src="'+it.icon+'" alt="'+(it.name||'')+'">'):'') + '<div class="' + countClass + '">' + countText + '</div></div>'
        + '<div class="item-main">'
        + '  <div class="item-title cons">'
        + '    <span class="item-name">'+(it.name||'')+'</span>'
        + '    <span class="meta-effect">'+ effHtml +'</span>'
        + '  </div>'
        + '  <div class="item-sub">'
        + '    <span class="sub-left">價格 '+(it.price||0)+' 靈石</span>'
        + '    <span class="sub-right"><button class="opx primary" data-shop-src="'+name+'" data-shop-buy="'+i+'">購買</button></span>'
        + '  </div>'
        + '</div>';
      box.appendChild(row);


    }
  }


  // 點「購買」→ 打開買單
  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest ? e.target.closest('[data-shop-buy]') : null;
    if(!btn) return;

    var idx = parseInt(btn.getAttribute('data-shop-buy')||'0',10);
    var src = btn.getAttribute('data-shop-src') || '';

    var items = [];
    for (var i=0;i<merchants.length;i++) if (merchants[i].name===src) items = (typeof merchants[i].items === 'function') ? merchants[i].items.call(merchants[i]) : (Array.isArray(merchants[i].items) ? merchants[i].items : []);
    var it = items[idx]; if(!it) return;


    var m = qs('#buyModal'); if(!m) return;
    var buyTop = qs('#buyTop'); if (buyTop) buyTop.textContent = it.name + '（單價 ' + (it.price||0) + ' 靈石）';
    var buyLeft = qs('#buyLeft'); if (buyLeft){
      var effHp = it.effect && it.effect.hp ? it.effect.hp : 0;
      var effMp = it.effect && it.effect.mp ? it.effect.mp : 0;
      buyLeft.textContent = (effHp?('氣血+'+effHp+' '):'') + (effMp?('真元+'+effMp):'');
    }
    var iconBox = qs('#buyIcon'); if (iconBox) iconBox.innerHTML = it.icon ? '<img src="'+it.icon+'" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">' : '';
    var qtyEl = qs('#buyQty'); if (qtyEl) qtyEl.value = 1;
    var costEl = qs('#buyCost'); if (costEl) costEl.textContent = '總價：' + (it.price||0);

    m.dataset.itemIndex = idx;
    m.dataset.itemSrc = src;
    m.classList.add('show'); m.setAttribute('aria-hidden','false');

    if (qtyEl){
      qtyEl.oninput = function(){
        var q = parseInt(qtyEl.value||'1',10); if (isNaN(q)||q<1) q=1;
        if (costEl) costEl.textContent = '總價：' + ((it.price||0)*q);
      };
    }
  });

  function closeBuy(){
    var m = qs('#buyModal'); if(!m) return;
    try{
      var active = document.activeElement;
      if (active && m.contains(active)) {
        try{ active.blur(); }catch(e){}
      }
    }catch(e){}
    m.classList.remove('show'); m.setAttribute('aria-hidden','true');
  }


  function confirmBuy(){
    var m = qs('#buyModal'); if(!m) return;
    var idx = parseInt(m.dataset.itemIndex||'0',10);
    var src = m.dataset.itemSrc || '';

    var items = [];
    for (var i=0;i<merchants.length;i++){
      if (merchants[i] && merchants[i].name === src){
        items = (typeof merchants[i].items === 'function') ? merchants[i].items.call(merchants[i]) : (Array.isArray(merchants[i].items) ? merchants[i].items : []);
        break;
      }
    }
    var it = items[idx]; if(!it) return;

    var qtyEl = qs('#buyQty');
    var qty = parseInt((qtyEl ? qtyEl.value : '1')||'1',10);
    if(qty<1) qty=1;

    // 先檢查商人剩餘數量（available），若玩家要求超過，顯示提醒並把 qty 限制到 available
    var available = 0;
    try{
      var foundIndex = -1;
      for (var j=0;j<merchants.length;j++){
        if (merchants[j] && merchants[j].name === src){ foundIndex = j; break; }
      }
      if (foundIndex !== -1){
        var M0 = merchants[foundIndex];
        var base = (typeof M0.dailyCounts !== 'undefined' && typeof M0.dailyCounts[it.id] !== 'undefined') ? M0.dailyCounts[it.id] : (typeof M0.getDailyCount === 'function' ? M0.getDailyCount(it.id) : (it.count || 0));
        available = (typeof base === 'number') ? base : 0;
      }
    }catch(_e){ available = (typeof it.count === 'number') ? it.count : 0; }

    if (qty > available){
      // 顯示小提醒（資訊性）並把數量設為 available
      var info = (available>0) ? ('剩餘數量上限 ' + available) : '已售罄';
      try{
        var toastI = document.createElement('div');
        toastI.textContent = info;
        toastI.style.position = 'absolute';
        toastI.style.left = '50%';
        toastI.style.transform = 'translateX(-50%)';
        toastI.style.top = '8px';
        toastI.style.background = 'rgba(0,0,0,0.8)';
        toastI.style.color = '#fff';
        toastI.style.padding = '6px 10px';
        toastI.style.borderRadius = '6px';
        toastI.style.fontSize = '13px';
        toastI.style.zIndex = 9999;
        toastI.style.opacity = '1';
        toastI.style.transition = 'opacity 0.4s';
        if (m && m.querySelector('.sheet')) m.querySelector('.sheet').appendChild(toastI);
        else if (m) m.appendChild(toastI);
        (function(el){ setTimeout(function(){ try{ el.style.opacity='0'; setTimeout(function(){ try{ el.parentNode && el.parentNode.removeChild(el); }catch(_){} },400); }catch(_){} }, 1200); })(toastI);
      }catch(e){}
      qty = (available>0) ? available : 0;
      if (qty <= 0){
        return;
      } else {
        if (qtyEl) qtyEl.value = qty;
      }
    }

    var P = (global.Game && Game.getPlayer) ? Game.getPlayer() : null; if(!P) return;
    var stone = (P.currencies && typeof P.currencies.stone==='number') ? P.currencies.stone : 0;
    var cost = (it.price||0) * qty;

    // 如果玩家金錢不足，顯示紅色小框 (靈石不足) 1.5 秒淡出，並停止購買
    if (stone < cost){
      try{
        var toast = document.createElement('div');
        toast.textContent = '靈石不足';
        toast.style.position = 'absolute';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.top = '8px';
        toast.style.background = 'rgba(220,38,38,0.95)';
        toast.style.color = '#fff';
        toast.style.padding = '6px 10px';
        toast.style.borderRadius = '6px';
        toast.style.fontSize = '13px';
        toast.style.zIndex = 9999;
        toast.style.opacity = '1';
        toast.style.transition = 'opacity 0.4s';
        if (m && m.querySelector('.sheet')) m.querySelector('.sheet').appendChild(toast);
        else if (m) m.appendChild(toast);
        (function(el){ setTimeout(function(){ try{ el.style.opacity='0'; setTimeout(function(){ try{ el.parentNode && el.parentNode.removeChild(el); }catch(_){} },400); }catch(_){} }, 1500); })(toast);
      }catch(e){}
      if (global.Game && Game.log) Game.log('靈石不足，無法購買 ' + (it.name||'') + ' ×' + qty, 'warn');
      return;
    }

    // 扣錢並加入背包
    P.currencies.stone = stone - cost;
    if (global.ItemDB && ItemDB.addConsumableToBag) ItemDB.addConsumableToBag(P.bag, it.id, qty);

    // 扣除商人持有數量（如果 merchants 裡有 dailyCounts 或 getDailyCount）並同步到遠端
    try{
      var foundIndex2 = -1;
      for (var k=0;k<merchants.length;k++){
        if (merchants[k] && merchants[k].name === src){ foundIndex2 = k; break; }
      }
      if (foundIndex2 !== -1){
        var M = merchants[foundIndex2];
        M.dailyCounts = M.dailyCounts || {};
        var cur = (typeof M.dailyCounts[it.id] !== 'undefined') ? M.dailyCounts[it.id] : (typeof M.getDailyCount === 'function' ? M.getDailyCount(it.id) : (it.count || 0));
        cur = cur - qty;
        if (cur < 0) cur = 0;
        M.dailyCounts[it.id] = cur;

        // 儲存到遠端（或 localStorage fallback）
        try{ saveMerchantCountsToRemote(M.name, M.dailyCounts); }catch(_){}

        // 重新渲染商人清單（讓 UI 立即更新）
        try{ renderMerchants(); }catch(_e){}
        // 注意：不在此刻呼叫 openMerchant，避免在後續購買紀錄同步時重複刷新造成雙筆顯示
      }
    }catch(_){}


    // 寫入 purchaseLogs 並顯示在交易訊息區（最新在上方） — 僅保留最新 4 筆，並同步到遠端/localStorage（所有玩家可見）
    try{
      var playerName = (P.name || (P.profile && P.profile.name) || '');
      var entry = {
        time: (new Date()).toLocaleString(),
        playerName: playerName,
        itemName: (it.name || it.id || ''),
        qty: qty,
        msg: ''
      };
      purchaseLogs[src] = purchaseLogs[src] || [];
      purchaseLogs[src].unshift(entry);
      // 保留最新 4 筆
      if (purchaseLogs[src].length > 4){
        purchaseLogs[src].splice(4, purchaseLogs[src].length - 4);
      }

      // 儲存同步（所有玩家可看到）
      try{ savePurchaseLogsToRemote(src, purchaseLogs[src]); }catch(_){}

      var logEl = qs('#purchaseLog');
      if (logEl){
        // 新訊息顯示在最上方
        var node = document.createElement('div');
        node.style.fontSize = '12px';
        node.style.padding = '6px 0';
        node.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
        node.textContent = entry.time + ' — ' + entry.playerName + ' 購買了 ' + entry.itemName + ' ×' + entry.qty;
        // 新訊息放在最上面
        if (logEl.firstChild) logEl.insertBefore(node, logEl.firstChild);
        else logEl.appendChild(node);
        // 確保顯示並帶有滾動條（若需要）
        logEl.style.display = 'block';

        // 若超過 4 筆，移除畫面上多餘的舊筆（避免 UI 與記錄不同步）
        try{
          while (logEl.children.length > 4) logEl.removeChild(logEl.lastChild);
        }catch(_){}
      }

      // 若沒有遠端 DB，手動刷新當前商店頁面一次（否則由 attachPurchaseLogSync 的 on('value') 事件負責刷新 — 可避免雙重刷新）
      try{
        if (!(window.DB && typeof DB.ref === 'function')){
          try{ openMerchant(src, (function(){ for (var i=0;i<merchants.length;i++){ if (merchants[i] && merchants[i].name===src) return (typeof merchants[i].items === 'function') ? merchants[i].items.call(merchants[i]) : (Array.isArray(merchants[i].items) ? merchants[i].items : []); } return []; })() ); }catch(_){}
        }
      }catch(_){}
    }catch(_){}



    if (global.Auth && Auth.saveCharacter){
      var clean = JSON.parse(JSON.stringify(P)); delete clean._live;
      Auth.saveCharacter(clean);
    }
    if (global.Game){
      if (Game.recalc) Game.recalc();
      if (Game.log) Game.log('購買 ' + (it.name||'') + ' ×' + qty + ' 成功！', 'ok');
    }

    // 更新上方顯示的玩家靈石（購買後立即反映）
    try{
      if (qs('#playerStone')){
        var newStone = (P.currencies && typeof P.currencies.stone === 'number') ? P.currencies.stone : 0;
        qs('#playerStone').textContent = String(newStone);
      }
    }catch(_){}

    closeBuy();
  }



  // 對外 API
  var api = {
    open: function(){
      injectCSS(); ensureDOM(); renderMerchants();
      var m = qs('#shopModal'); if(!m) return;
      m.classList.add('show'); m.setAttribute('aria-hidden','false');
      var list = qs('#merchantList'), page = qs('#merchantShop');
      if(list) list.style.display='block';
      if(page) page.style.display='none';
    },
    close: function(){
      var m = qs('#shopModal'); if(!m) return;
      m.classList.remove('show'); m.setAttribute('aria-hidden','true');
    },
    setMerchants: function(list){ if (Array.isArray(list)) merchants = list; },
    getMerchants: function(){ return merchants.slice(); }
  };

  // 舊介面相容
  global.Shop = api;
  global.openShop = function(){ api.open(); };
  global.closeShop = function(){ api.close(); };

  // 綁定購買按鈕
  function bindBuy(){ var btn = qs('#btnConfirmBuy'); if (btn) btn.addEventListener('click', confirmBuy); }
  bindBuy(); // 初次嘗試
  document.addEventListener('DOMContentLoaded', bindBuy);

})(window);
