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
#shopModal .item-row, #buyModal .item-row { display:flex; gap:10px; align-items:center; }
#shopModal .item-thumb img { width:48px; height:48px; object-fit:cover; border-radius:8px; }
.badge{ display:inline-block; padding:2px 6px; border-radius:6px; background:#334155; font-size:12px; margin-left:6px; }
.badge.hp{ background:#7f1d1d; color:#fff; }
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
     + '      <div id="shopList" class="bag-list"></div>'
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
    });}
    // 確認購買
    var btn = qs('#btnConfirmBuy');
    if (btn) btn.addEventListener('click', confirmBuy);
  }

  // 商人清單（可擴充）
  var merchants = [
    {
      name: '藥鋪小李',
      icon: 'https://i.ibb.co/3fNzHbn/apothecary.png',
      items: function(){
        var src = (global.ItemDB && ItemDB.DB && Array.isArray(ItemDB.DB.consumables))
          ? ItemDB.DB.consumables : [];
        return src.filter(function(it){
          var hp = it && it.effect && it.effect.hp;
          var mp = it && it.effect && it.effect.mp;
          return (hp && hp>0) || (mp && mp>0);
        });
      }
    },
    {
      name: '洞窟補給商',
      icon: 'https://i.ibb.co/QnLR7VN/cave-merchant.png',
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

  function renderMerchants(){
    var box = qs('#merchantBox'); if(!box) return;
    box.innerHTML = '';
    merchants.forEach(function(m){
      var row = document.createElement('div');
      row.className = 'item-row';
      var unlocked = typeof m.unlock==='function' ? !!m.unlock() : true;
      row.style.filter = unlocked ? 'none' : 'grayscale(1) opacity(.5)';
      row.innerHTML = ''
        + '<div class="item-thumb"><img src="'+m.icon+'" alt="'+m.name+'"></div>'
        + '<div class="item-main">'
        + '  <div class="item-title"><span class="item-name">'+m.name+'</span></div>'
        + '  <div class="item-sub"><span class="sub-left">'+(unlocked? '販售用品' : (m.lockedText||'尚未解鎖'))+'</span></div>'
        + '</div>';
      if (unlocked){
        row.addEventListener('click', function(){ openMerchant(m.name, toArray(m.items)); });
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
      row.innerHTML = ''
        + '<div class="item-thumb">' + (hasIcon?('<img src="'+it.icon+'" alt="'+(it.name||'')+'">'):'') + '</div>'
        + '<div class="item-main">'
        + '  <div class="item-title cons">'
        + '    <span class="item-name">'+(it.name||'')+'</span>'
        + '    <span class="meta-effect">'+ effHtml +'</span>'
        + '    <span class="count-slot">×1</span>'
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
    for (var i=0;i<merchants.length;i++) if (merchants[i].name===src) items = toArray(merchants[i].items);
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
    m.classList.remove('show'); m.setAttribute('aria-hidden','true');
  }

  function confirmBuy(){
    var m = qs('#buyModal'); if(!m) return;
    var idx = parseInt(m.dataset.itemIndex||'0',10);
    var src = m.dataset.itemSrc || '';

    var items = [];
    for (var i=0;i<merchants.length;i++) if (merchants[i].name===src) items = toArray(merchants[i].items);
    var it = items[idx]; if(!it) return;

    var qtyEl = qs('#buyQty');
    var qty = parseInt((qtyEl ? qtyEl.value : '1')||'1',10);
    if(qty<1) qty=1;

    var P = (global.Game && Game.getPlayer) ? Game.getPlayer() : null; if(!P) return;
    var stone = (P.currencies && typeof P.currencies.stone==='number') ? P.currencies.stone : 0;
    var cost = (it.price||0) * qty;
    if (stone < cost){
      if (global.Game && Game.log) Game.log('靈石不足，無法購買 ' + (it.name||'') + ' ×' + qty, 'warn');
      return;
    }

    P.currencies.stone = stone - cost;
    if (global.ItemDB && ItemDB.addConsumableToBag) ItemDB.addConsumableToBag(P.bag, it.id, qty);

    if (global.Auth && Auth.saveCharacter){
      var clean = JSON.parse(JSON.stringify(P)); delete clean._live;
      Auth.saveCharacter(clean);
    }
    if (global.Game){
      if (Game.recalc) Game.recalc();
      if (Game.log) Game.log('購買 ' + (it.name||'') + ' ×' + qty + ' 成功！', 'ok');
    }
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
