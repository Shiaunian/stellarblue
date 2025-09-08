/* appearance.js — 外觀介面（修復版本，正確整合 Game 系統） */
(function(){
var api = { 
  getPlayer: function() {
    // ✅ 修復：從 Game 系統讀取，而不是 localStorage
    return window.Game ? Game.getPlayer() : null;
  }, 
  save: function() {
    // ✅ 修復：透過 Auth 系統存檔
    var player = api.getPlayer();
    if (player && window.Auth && Auth.saveCharacter) {
      Auth.saveCharacter(player);
    }
  }, 
  recalc: function() {
    // ✅ 修復：呼叫 Game 系統重新計算
    if (window.Game && Game.recalc) {
      Game.recalc();
    }
  }, 
  log: function(t) { 
    console.log('[外觀系統]', t); 
    // ✅ 修復：使用 Game 系統的 log
    if (window.Game && Game.log) {
      Game.log(t);
    }
  } 
};

function el(html){ 
  var d=document.createElement('div'); 
  d.innerHTML=html.trim(); 
  return d.firstChild; 
}

function mount(opts){ 
  api = Object.assign(api, opts||{}); 
  ensureModal(); 
  render(); 
}

function open(){ 
  var m=document.getElementById('apModal'); 
  if(!m) return; 
  render(); 
  m.classList.add('show'); 
  m.setAttribute('aria-hidden','false'); 
}

function close(){ 
  var m=document.getElementById('apModal'); 
  if(!m) return; 
  m.classList.remove('show'); 
  m.setAttribute('aria-hidden','true'); 
}

function ensureModal(){
  if (document.getElementById('ap-css')) return createOnce();
  var s=document.createElement('style'); s.id='ap-css';
  s.textContent = '\
:root { --panel-2: #1e293b; --text: #e2e8f0; --shadow: 0 10px 25px rgba(0,0,0,0.3); --accent: #3b82f6; --accent2: #1d4ed8; }\
#apModal{position:fixed; inset:0; display:none; place-items:center; z-index:999}\
#apModal.show{display:grid;}\
#apModal .mask{position:absolute; inset:0; background:rgba(0,0,0,.5); backdrop-filter: blur(2px);}\
#apModal .sheet{position:relative; width:min(420px, 100svw); max-height:70vh; border-radius:16px; overflow:hidden; background:var(--panel-2); border:1px solid rgba(255,255,255,.12); box-shadow: var(--shadow); color:var(--text);}\
#apModal .sec-title{background:rgba(255,255,255,.06); border-bottom:1px solid rgba(255,255,255,.08); text-align:center; font-weight:900; letter-spacing:4px; padding:8px 12px; position:relative;}\
#apModal .close{position:absolute; right:10px; top:50%; transform:translateY(-50%); width:24px; height:24px; border-radius:999px; display:grid; place-items:center; background:#ef4444; color:#fff; font-weight:900; cursor:pointer; user-select:none;}\
.ap-list{ padding:10px; display:grid; gap:8px; max-height:60vh; overflow:auto;}\
.ap-row{ display:grid; grid-template-columns:42px 1fr auto; gap:8px; align-items:center; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:6px; cursor:pointer; transition: all 0.2s;}\
.ap-row:hover{ background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.2); transform:translateY(-1px);}\
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
#apAction .sheet{position:relative; width:min(92vw, 380px); background:var(--panel-2); border-radius:16px; padding:20px; color:var(--text);}\
.ops{display:flex; justify-content:flex-end; gap:6px; margin-top:20px;}\
.opx{padding:6px 10px; border-radius:10px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.08); color:#fff; font-weight:700; font-size:12px; cursor:pointer; transition:all 0.2s;}\
.opx:hover{background:rgba(255,255,255,.15);}\
.opx.primary{background:linear-gradient(135deg,var(--accent),var(--accent2)); border-color:var(--accent);}\
.opx.primary:hover{transform:translateY(-1px); box-shadow:0 4px 12px rgba(59,130,246,0.3);}\
.action-info{margin-bottom:15px; padding:15px; background:rgba(255,255,255,.05); border-radius:8px;}\
.action-title{font-weight:bold; margin-bottom:5px;}\
.action-desc{font-size:12px; color:#93c5fd; margin-bottom:8px;}\
.action-stats{font-size:11px; color:#e2e8f0;}\
';
  document.head.appendChild(s);

  createOnce();
  function createOnce(){
    // 只要缺任一個節點，就重建兩個（避免「只有 Modal 沒有 Action」的半套狀態）
    var hasModal  = !!document.getElementById('apModal');
    var hasAction = !!document.getElementById('apAction');
    if (hasModal && hasAction) return;
    if (hasModal && !hasAction) document.getElementById('apModal').remove();
    if (!hasModal && hasAction) document.getElementById('apAction').remove();

    // 這段包含兩個兄弟節點，不能用 el()（只回傳 firstChild）
    var wrap = document.createElement('div');
    wrap.innerHTML = '\
<div id="apModal" aria-hidden="true">\
<div class="mask" data-ap-close="1"></div>\
<div class="sheet" role="dialog" aria-labelledby="apTitle">\
  <div class="sec-title" id="apTitle">外觀背包\
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
  <div class="action-info">\
    <div class="action-title" id="actionTitle">外觀名稱</div>\
    <div class="action-desc" id="actionDesc">外觀描述</div>\
    <div class="action-stats" id="actionStats">屬性加成</div>\
  </div>\
  <div class="ops">\
    <button class="opx" id="btnApDrop">丟棄</button>\
    <button class="opx" id="btnApSell">販賣</button>\
    <button class="opx primary" id="btnApEquip">裝備</button>\
  </div>\
</div>\
</div>';
    // 將 wrap 內的兩個節點逐一插入 body（#apModal 與 #apAction 都會存在）
    while (wrap.firstChild) {
      document.body.appendChild(wrap.firstChild);
    }

    // 只掛一次全域關閉事件，避免多次 mount 疊加
    if (!document.body.dataset.apDocBound) {
      document.addEventListener('click', function(e){
        var t=e.target;
        if (t && t.getAttribute && t.getAttribute('data-ap-close')==='1'){ close(); }
        if (t && t.getAttribute && t.getAttribute('data-apact-close')==='1'){ hideAction(); }
      });
      document.body.dataset.apDocBound = '1';
    }


    var btnE=document.getElementById('btnApEquip');
    var btnS=document.getElementById('btnApSell');
    var btnD=document.getElementById('btnApDrop');
    if (btnE) btnE.addEventListener('click', onEquip);
    if (btnS) btnS.addEventListener('click', onSell);
    if (btnD) btnD.addEventListener('click', onDrop);

    // ✅ 事件委派：點任何 .ap-row 都會開啟操作視窗
    var listEl = document.getElementById('apList');
    if (listEl && !listEl.dataset.bound) {
      listEl.addEventListener('click', function(e){
        var row = e.target.closest('.ap-row');
        if (!row) return;
        var id = row.getAttribute('data-ap-id') || '';
        if (id) { showAction(id); }
      });
      listEl.dataset.bound = '1';
    }
  }
  
}

function toBonusText(eff){
  if(!eff) return '';
  var arr=[], k;
  for(k in eff){ 
    if(Object.prototype.hasOwnProperty.call(eff,k)){ 
      var displayName = k;
      if (k === 'attack') displayName = '攻擊';
      else if (k === 'defense') displayName = '防禦';
      else if (k === 'speed') displayName = '速度';
      else if (k === 'hp') displayName = '生命';
      else if (k === 'mp') displayName = '真元';
      else if (k === 'def') displayName = '防禦';
      else if (k === 'mdef') displayName = '法防';
      else if (k === 'eva') displayName = '閃避';
      else if (k === 'aspd') displayName = '攻速';
      else if (k === 'matk') displayName = '法攻';
      arr.push(displayName+'+'+String(eff[k])); 
    } 
  }
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

function render(){
  var P = api.getPlayer(); 
  if(!P || !P.name) {
    console.log('❌ 找不到玩家資料，P =', P);
    return;
  }
  
  // 檢查 ItemDB 是否存在
  if (!window.ItemDB || !window.ItemDB.list) {
    console.log('❌ ItemDB 未載入，請確保 ItemDB.js 已正確載入');
    return;
  }
  
  ensureBag(P);
  var list = document.getElementById('apList'); 
  if(!list) return;
  list.innerHTML='';

  var defs = window.ItemDB.list('appearances');
  console.log('📦 渲染外觀清單，共', defs.length, '個外觀定義');
  console.log('📦 玩家外觀背包:', P.bag.appearances);
  
  var i=0;
  while(i<defs.length){
    var d = defs[i] || {};
    var bag = findInBag(P, d.id).item;
    var cnt = bag ? (bag.count||0) : 0;

    // ✅ 規則：count <= 0 視為沒有，清單不顯示
    if (cnt <= 0) { i = i + 1; continue; }

    var nameSafe = (d && d.name) ? d.name : '(未命名)';
    var thumbFallback = (d && d.name) ? d.name.charAt(0) : '?';

    var row = el('\
<div class="ap-row" data-ap-id="'+ (d.id||'') +'">\
<div class="ap-thumb">'+ (d.icon?('<img src="'+d.icon+'" alt="'+nameSafe+'">'):thumbFallback) +'</div>\
<div class="ap-main">\
  <div class="ap-name">'+ nameSafe +'</div>\
  <div class="ap-desc">'+ (d.desc||'') +'</div>\
  <div class="ap-bonus">'+ toBonusText(d.effect||d.bonus) +'</div>\
</div>\
<div class="ap-count">x'+ String(cnt) +'</div>\
</div>');

    
    list.appendChild(row);
    i=i+1;
  }
  
  console.log('✅ 外觀清單渲染完成');
}

var _actId = null;
function showAction(id){ 
  _actId = id; 
  
  if (!window.ItemDB || !window.ItemDB.getDef) {
    console.log('❌ ItemDB 未載入');
    return;
  }
  
  var def = window.ItemDB.getDef('appearances', id);
  if (def) {
    var titleEl = document.getElementById('actionTitle');
    var descEl = document.getElementById('actionDesc');
    var statsEl = document.getElementById('actionStats');
    
    if (titleEl) titleEl.textContent = def.name || '未知外觀';
    if (descEl) descEl.textContent = def.desc || '無描述';
    if (statsEl) statsEl.textContent = '屬性加成: ' + toBonusText(def.effect || def.bonus);
  }
  
  var m=document.getElementById('apAction'); 
  if(m){ 
    m.classList.add('show'); 
    m.setAttribute('aria-hidden','false'); 
  } 
}

function hideAction(){ 
  _actId = null; 
  var m=document.getElementById('apAction'); 
  if(m){ 
    m.classList.remove('show'); 
    m.setAttribute('aria-hidden','true'); 
  } 
}

function onEquip(){
  var P = api.getPlayer(); 
  if(!P || !_actId) return;
  ensureBag(P);

  var def = window.ItemDB.getDef('appearances', _actId);
  if (!def){ 
    api.log('找不到外觀定義: ' + _actId);
    hideAction(); 
    return; 
  }

  var hit = findInBag(P, _actId);
  if (!hit.item || (hit.item.count||0)<=0){ 
    api.log('背包沒有此外觀，先添加一個進行測試');
    P.bag.appearances.push({ id: _actId, count: 1 });
    hit = findInBag(P, _actId);
  }

  // 背包扣數
  hit.item.count = (hit.item.count||0) - 1;
  if (hit.item.count <= 0){ 
    P.bag.appearances.splice(hit.idx,1); 
  }

  P.equip = P.equip || {};
  // 回收舊外觀 → 背包
  if (P.equip.character && P.equip.character.id){
    var oldId = P.equip.character.id;
    var back = findInBag(P, oldId);
    if (back.item){ 
      back.item.count = (back.item.count||0)+1; 
    } else { 
      P.bag.appearances.push({ id: oldId, count: 1 }); 
    }
    api.log('舊外觀 ' + oldId + ' 已回到背包');
  }

  // 寫入角色外觀（equip.js 讀的是 character），並同步到 appearance 欄位（相容舊程式）
  try{
    var copy = JSON.parse(JSON.stringify(def));
    P.equip.character  = copy;
    P.equip.appearance = JSON.parse(JSON.stringify(def));
  } catch(_){
    P.equip.character  = def;
    P.equip.appearance = def;
  }

  // 附贈技能（維持原邏輯）
  if (def.grantSkills && def.grantSkills.length){
    P.skills = Array.isArray(P.skills) ? P.skills : [];
    for (var j=0;j<def.grantSkills.length;j++){
      var sid = def.grantSkills[j];
      var has = false;
      for (var k=0;k<P.skills.length;k++){ if(P.skills[k]===sid){ has=true; break; } }
      if(!has){ P.skills.push(sid); api.log('獲得技能: ' + sid); }
    }
  }

  // 存檔 + 重算 + 重繪
  api.save();
  api.recalc();
  render();
  hideAction();
  api.log('✅ 已裝備外觀：' + (def.name || _actId));
}


function onSell(){
  var P = api.getPlayer(); 
  if(!P || !_actId) return;
  ensureBag(P);
  
  var def = window.ItemDB.getDef('appearances', _actId);
  if (!def){ 
    hideAction(); 
    return; 
  }
  
  var hit = findInBag(P, _actId);
  if (!hit.item || (hit.item.count||0)<=0){ 
    api.log('背包沒有此外觀');
    hideAction(); 
    return; 
  }

  var gain = Math.max(1, Math.floor((def.price||0)*0.5));
  P.currencies = P.currencies || { stone:0, diamond:0 };
  P.currencies.stone = (P.currencies.stone||0) + gain;

  hit.item.count = (hit.item.count||0) - 1;
  if (hit.item.count <= 0){ 
    P.bag.appearances.splice(hit.idx,1); 
  }

  api.save(); 
  api.recalc(); 
  render();
  hideAction(); 
  api.log('✅ 已販賣：'+ (def.name||_actId) +' +'+gain+'靈石');
}

function onDrop(){
  var P = api.getPlayer(); 
  if(!P || !_actId) return;
  ensureBag(P);
  
  var hit = findInBag(P, _actId);
  if (!hit.item || (hit.item.count||0)<=0){ 
    api.log('背包沒有此外觀');
    hideAction(); 
    return; 
  }
  
  var def = window.ItemDB.getDef('appearances', _actId);
  var name = def ? def.name : _actId;
  
  hit.item.count = (hit.item.count||0) - 1;
  if (hit.item.count <= 0){ 
    P.bag.appearances.splice(hit.idx,1); 
  }
  
  api.save(); 
  api.recalc(); 
  render();
  hideAction(); 
  api.log('✅ 已丟棄：'+ name);
}

function addTestAppearances() {
  var P = api.getPlayer();
  if (!P || !P.name) {
    console.log('❌ 請先登入');
    return;
  }
  
  ensureBag(P);
  
  var testAppearances = ['skin_qing_m', 'skin_qing_f', 'skin_raiming'];
  testAppearances.forEach(function(id) {
    var existing = findInBag(P, id);
    if (!existing.item) {
      P.bag.appearances.push({ id: id, count: 1 });
    }
  });
  
  api.save();
  render();
  console.log('✅ 已添加測試外觀到背包');
}

window.Appearance = { 
  mount: mount, 
  open: open, 
  close: close, 
  render: render,
  addTestAppearances: addTestAppearances
};

// ✅ 移除自動初始化，改由主城頁面控制
console.log('✅ 外觀系統腳本已載入');
})();