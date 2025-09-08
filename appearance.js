/* appearance.js — 外觀介面（單一裝備欄位；可堆疊；會替換舊外觀） */
(function(){
  var api = { getPlayer:null, save:function(){}, recalc:function(){}, log:function(t){ console.log(t); } };

  function el(html){ var d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }

  function mount(opts){ api = Object.assign(api, opts||{}); ensureModal(); render(); }

  function open(){ var m=document.getElementById('apModal'); if(!m) return; render(); m.classList.add('show'); m.setAttribute('aria-hidden','false'); }
  function close(){ var m=document.getElementById('apModal'); if(!m) return; m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }

  function ensureModal(){
    if (document.getElementById('ap-css')) return createOnce();
    var s=document.createElement('style'); s.id='ap-css';
    s.textContent = '\
#apModal{position:fixed; inset:0; display:none; place-items:center; z-index:999}\
#apModal.show{display:grid;}\
#apModal .mask{position:absolute; inset:0; background:rgba(0,0,0,.5); backdrop-filter: blur(2px);}\
#apModal .sheet{position:relative; width:min(420px, 100svw); max-height:70vh; border-radius:16px; overflow:hidden; background:var(--panel-2); border:1px solid rgba(255,255,255,.12); box-shadow: var(--shadow); color:var(--text);}\
#apModal .sec-title{background:rgba(255,255,255,.06); border-bottom:1px solid rgba(255,255,255,.08); text-align:center; font-weight:900; letter-spacing:4px; padding:8px 12px; position:relative;}\
#apModal .close{position:absolute; right:10px; top:50%; transform:translateY(-50%); width:24px; height:24px; border-radius:999px; display:grid; place-items:center; background:#ef4444; color:#fff; font-weight:900; cursor:pointer; user-select:none;}\
.ap-list{ padding:10px; display:grid; gap:8px; max-height:60vh; overflow:auto;}\
.ap-row{ display:grid; grid-template-columns:42px 1fr auto; gap:8px; align-items:center; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:6px;}\
.ap-thumb{ width:42px; height:42px; border-radius:8px; overflow:hidden; display:grid; place-items:center; background:#1e293b; }\
.ap-thumb img{width:100%; height:100%; object-fit:cover; display:block;}\
.ap-main{ display:grid; gap:2px; }\
.ap-name{ font-weight:800; font-size:12px; }\
.ap-desc{ font-size:11px; color:#93c5fd; }\
.ap-bonus{ font-size:11px; color:#e2e8f0; }\
.ap-count{ justify-self:end; min-width:54px; text-align:right; font-variant-numeric: tabular-nums; background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18); border-radius:9999px; padding:2px 6px; font-size:11px; }\
#apAction{position:fixed; inset:0; display:none; place-items:center; z-index:1000;}\
#apAction.show{display:grid;}\
#apAction .mask{position:absolute; inset:0; background:rgba(0,0,0,.5); backdrop-filter: blur(2px);}\
#apAction .sheet{position:relative; width:min(92vw, 380px);}\
.ops{display:flex; justify-content:flex-end; gap:6px;}\
.opx{padding:6px 10px; border-radius:10px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.08); color:#fff; font-weight:700; font-size:12px; cursor:pointer;}\
.opx.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));}\
';
    document.head.appendChild(s);

    createOnce();
    function createOnce(){
      if (document.getElementById('apModal')) return;
      var node = el('\
<div id="apModal" aria-hidden="true">\
  <div class="mask" data-ap-close="1"></div>\
  <div class="sheet" role="dialog" aria-labelledby="apTitle">\
    <div class="sec-title" id="apTitle">外觀\
      <div class="close" data-ap-close="1">✕</div>\
    </div>\
    <div id="apList" class="ap-list"></div>\
  </div>\
</div>\
<div id="apAction" aria-hidden="true">\
  <div class="mask" data-apact-close="1"></div>\
  <div class="sheet" role="dialog" aria-labelledby="apActionTitle">\
    <div class="sec-title" id="apActionTitle">外觀操作\
      <div class="close" data-apact-close="1">✕</div>\
    </div>\
    <div class="body">\
      <div class="ops">\
        <button class="opx" id="btnApDrop">丟棄</button>\
        <button class="opx" id="btnApSell">販賣</button>\
        <button class="opx primary" id="btnApEquip">裝備</button>\
      </div>\
    </div>\
  </div>\
</div>');
      document.body.appendChild(node);

      document.addEventListener('click', function(e){
        var t=e.target;
        if (t && t.getAttribute && t.getAttribute('data-ap-close')==='1'){ close(); }
        if (t && t.getAttribute && t.getAttribute('data-apact-close')==='1'){ hideAction(); }
      });

      // 事件（操作面板）
      var btnE=document.getElementById('btnApEquip');
      var btnS=document.getElementById('btnApSell');
      var btnD=document.getElementById('btnApDrop');
      if (btnE) btnE.addEventListener('click', onEquip);
      if (btnS) btnS.addEventListener('click', onSell);
      if (btnD) btnD.addEventListener('click', onDrop);
    }
  }

  function toBonusText(eff){
    if(!eff) return '';
    var arr=[], k;
    for(k in eff){ if(Object.prototype.hasOwnProperty.call(eff,k)){ arr.push(k+'+'+String(eff[k])); } }
    return arr.join('、');
  }

  function ensureBag(p){
    p.bag = p.bag || {};
    if (!Array.isArray(p.bag.appearances)) p.bag.appearances = [];
  }

  function findInBag(p, id){
    ensureBag(p);
    var i=0;
    while(i<p.bag.appearances.length){
      var it=p.bag.appearances[i];
      if(it && it.id===id) return { idx:i, item:it };
      i=i+1;
    }
    return { idx:-1, item:null };
  }

  // 渲染清單
  function render(){
    var P = api.getPlayer && api.getPlayer(); if(!P) return;
    ensureBag(P);
    var list = document.getElementById('apList'); if(!list) return;
    list.innerHTML='';

    var defs = (window.ItemDB && ItemDB.list && ItemDB.list('appearances')) ? ItemDB.list('appearances') : [];
    var i=0;
    while(i<defs.length){
      var d = defs[i] || {};
      var bag = findInBag(P, d.id).item;
      var cnt = bag ? (bag.count||0) : 0;

      var row = el('\
<div class="ap-row" data-ap-id="'+ (d.id||'') +'">\
  <div class="ap-thumb">'+ (d.icon?('<img src="'+d.icon+'" alt="">'):'') +'</div>\
  <div class="ap-main">\
    <div class="ap-name">'+ (d.name||'(未命名)') +'</div>\
    <div class="ap-desc">'+ (d.desc||'') +'</div>\
    <div class="ap-bonus">'+ toBonusText(d.effect||d.bonus) +'</div>\
  </div>\
  <div class="ap-count">x'+ String(cnt) +'</div>\
</div>');
      row.addEventListener('click', function(){
        var id = this.getAttribute('data-ap-id')||'';
        showAction(id);
      });
      list.appendChild(row);
      i=i+1;
    }
  }

  // === 操作面板 ===
  var _actId = null;
  function showAction(id){ _actId = id; var m=document.getElementById('apAction'); if(m){ m.classList.add('show'); m.setAttribute('aria-hidden','false'); } }
  function hideAction(){ _actId = null; var m=document.getElementById('apAction'); if(m){ m.classList.remove('show'); m.setAttribute('aria-hidden','true'); } }

  function onEquip(){
    var P = api.getPlayer && api.getPlayer(); if(!P || !_actId) return;
    ensureBag(P);

    // 找定義
    var def = (window.ItemDB && ItemDB.getDef) ? ItemDB.getDef('appearances', _actId) : null;
    if (!def){ hideAction(); return; }

    // 堆疊扣 1
    var hit = findInBag(P, _actId);
    if (!hit.item || (hit.item.count||0)<=0){ api.log('背包沒有此外觀'); hideAction(); return; }
    hit.item.count = (hit.item.count||0) - 1;
    if (hit.item.count <= 0){ P.bag.appearances.splice(hit.idx,1); }

    // 裝備：單一欄位，替換舊外觀 → 舊外觀回袋 +1
    P.equip = P.equip || {};
    if (P.equip.character && P.equip.character.id){
      // 舊的回袋 +1（堆疊）
      var oldId = P.equip.character.id;
      var back = findInBag(P, oldId);
      if (back.item){ back.item.count = (back.item.count||0)+1; }
      else{ P.bag.appearances.push({ id: oldId, count:1 }); }
    }

    // 深拷貝到裝備位
    try{ P.equip.character = JSON.parse(JSON.stringify(def)); }
    catch(_){ P.equip.character = def; }

    // 如有 grantSkills：把技能 ID 塞到 P.skills（避免重複）
    if (def.grantSkills && def.grantSkills.length){
      P.skills = Array.isArray(P.skills) ? P.skills : [];
      var j=0;
      while(j<def.grantSkills.length){
        var sid = def.grantSkills[j];
        // 檢查重複
        var has=false, k=0;
        while(k<P.skills.length){ if(P.skills[k]===sid){ has=true; break; } k=k+1; }
        if(!has){ P.skills.push(sid); }
        j=j+1;
      }
    }

    api.save(); api.recalc(); render();
    hideAction(); api.log('已裝備外觀：'+ (def.name||_actId));
  }

  function onSell(){
    var P = api.getPlayer && api.getPlayer(); if(!P || !_actId) return;
    ensureBag(P);
    var def = (window.ItemDB && ItemDB.getDef) ? ItemDB.getDef('appearances', _actId) : null;
    if (!def){ hideAction(); return; }
    var hit = findInBag(P, _actId);
    if (!hit.item || (hit.item.count||0)<=0){ hideAction(); return; }

    // 簡單賣價：price 的 50%
    var gain = Math.max(1, Math.floor((def.price||0)*0.5));
    P.currencies = P.currencies || { stone:0, diamond:0 };
    P.currencies.stone = (P.currencies.stone||0) + gain;

    hit.item.count = (hit.item.count||0) - 1;
    if (hit.item.count <= 0){ P.bag.appearances.splice(hit.idx,1); }

    api.save(); api.recalc(); render();
    hideAction(); api.log('已販賣：'+ (def.name||_actId) +' +'+gain+'靈石');
  }

  function onDrop(){
    var P = api.getPlayer && api.getPlayer(); if(!P || !_actId) return;
    ensureBag(P);
    var hit = findInBag(P, _actId);
    if (!hit.item || (hit.item.count||0)<=0){ hideAction(); return; }
    hit.item.count = (hit.item.count||0) - 1;
    if (hit.item.count <= 0){ P.bag.appearances.splice(hit.idx,1); }
    api.save(); api.recalc(); render();
    hideAction(); api.log('已丟棄：'+ _actId);
  }

  // 對外
  window.Appearance = { mount:mount, open:open, close:close, render:render };
})();
