(function(global){
  var MOD = { ctx: null };
  var overlay = null, listBox = null;
  var tabBtns = null, panes = null;

  function getPlayer(){
    return (MOD.ctx && MOD.ctx.getPlayer) ? MOD.ctx.getPlayer() : null;
  }
  function saveNow(){
    try{ if (MOD.ctx && typeof MOD.ctx.save === 'function') MOD.ctx.save(); }catch(_){}
  }

  /* === 與招募一致的單位成本（不相依外部函式，避免跨檔取值問題） === */
  function perUnitCostLike(def){
    var lvl = (def && def.level) ? def.level : 1;
    return {
      stone: lvl * 5,
      wood:  Math.max(1, Math.round(lvl * 1.25)),
      ore:   Math.max(1, Math.round(lvl * 1.25)),
      water: Math.max(1, Math.round(lvl * 1.25)),
      food:  Math.max(1, Math.round(lvl * 1.25))
      // time 不用在軍隊退款
    };
  }

  /* === 退款（解雇時退回招募成本的一半，逐項向下取整） === */
  function refundHalf(monId, qty){
    var p = getPlayer(); if (!p) return;
    if (!qty || qty < 1) qty = 1;
    var def = (global.MonsterDB && global.MonsterDB.get) ? global.MonsterDB.get(monId) : null;
    var c = perUnitCostLike(def);
    var backStone = Math.floor((c.stone || 0) * qty * 0.5);
    var backWood  = Math.floor((c.wood  || 0) * qty * 0.5);
    var backOre   = Math.floor((c.ore   || 0) * qty * 0.5);
    var backWater = Math.floor((c.water || 0) * qty * 0.5);
    var backFood  = Math.floor((c.food  || 0) * qty * 0.5);

    p.currencies = p.currencies || { stone:0, diamond:0 };
    p.resources  = p.resources  || { ore:0, wood:0, food:0, water:0 };

    p.currencies.stone = (p.currencies.stone||0) + backStone;
    p.resources.wood   = (p.resources.wood||0)   + backWood;
    p.resources.ore    = (p.resources.ore||0)    + backOre;
    p.resources.water  = (p.resources.water||0)  + backWater;
    p.resources.food   = (p.resources.food||0)   + backFood;
  }

  function ensureCSS(){
    if (document.getElementById('armyCSS')) return;
    var css = [
      '#armyOverlay{position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.55);z-index:9999;}',
      '#armyPanel{width:min(680px,94vw);max-height:86vh;overflow:auto;background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:12px;box-shadow:0 6px 22px rgba(0,0,0,.45);}',
      '#armyPanel .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:800;letter-spacing:.15em;}',
      '#armyPanel .tabs{display:flex;gap:6px;margin:6px 0 10px;}',
      '#armyPanel .tabs button{flex:0 0 auto;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.20);background:rgba(255,255,255,.06);color:#fff;font-weight:700;letter-spacing:.1em;}',
      '#armyPanel .tabs button.on{background:linear-gradient(90deg,#22c55e,#16a34a);border-color:transparent;}',
      '#armyList{display:flex;flex-direction:column;gap:8px;max-height:62vh;overflow:auto;}',
      '.a-card{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.03);}',
      '.a-left{display:flex;align-items:center;gap:10px;min-width:0;}',
      '.a-left img{width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#0b1220;}',
      '.a-tit{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.a-sub{opacity:.75;font-size:12px;}',
      '.a-ops{display:flex;gap:6px;}',
      '.a-ops button{padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;}',
      '.a-ops button.warn{background:rgba(239,68,68,.18);border-color:rgba(239,68,68,.35);}',
      '.muted{opacity:.7;}'
    ].join('');
    var st = document.createElement('style');
    st.id = 'armyCSS';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function ensureDOM(){
    if (overlay) return;
    ensureCSS();
    overlay = document.createElement('div');
    overlay.id = 'armyOverlay';
    overlay.innerHTML = ''
      + '<div id="armyPanel">'
      + '  <div class="hd"><div class="title">軍 隊</div><div class="rctrl"><button id="btnArmyClose" title="返回">×</button></div></div>'
      + '  <div class="tabs"><button data-tab="army" class="on">軍隊</button><button data-tab="todo1">待開發</button><button data-tab="todo2">待更新</button></div>'
      + '  <div class="pane" data-pane="army"><div id="armyList"></div></div>'
      + '  <div class="pane" data-pane="todo1" style="display:none;"><div class="muted">此分頁尚在規劃中。</div></div>'
      + '  <div class="pane" data-pane="todo2" style="display:none;"><div class="muted">此分頁尚待更新。</div></div>'
      + '</div>';
    document.body.appendChild(overlay);

    listBox = document.getElementById('armyList');
    tabBtns = overlay.querySelectorAll('.tabs button');
    panes   = overlay.querySelectorAll('.pane');

    var btnC = document.getElementById('btnArmyClose');
    if (btnC){ btnC.addEventListener('click', close); }

    var i;
    for (i=0;i<tabBtns.length;i++){
      (function(btn){
        btn.addEventListener('click', function(){
          var name = btn.getAttribute('data-tab') || 'army';
          switchTab(name);
        });
      })(tabBtns[i]);
    }
  }

  function switchTab(name){
    var i;
    for (i=0;i<tabBtns.length;i++){
      var on = (tabBtns[i].getAttribute('data-tab') === name);
      if (on) tabBtns[i].classList.add('on'); else tabBtns[i].classList.remove('on');
    }
    for (i=0;i<panes.length;i++){
      var pnm = panes[i].getAttribute('data-pane');
      panes[i].style.display = (pnm === name) ? 'block' : 'none';
    }
    if (name === 'army') renderArmy();
  }

  function buildRow(monId, count){
    var def = (global.MonsterDB && global.MonsterDB.get) ? global.MonsterDB.get(monId) : null;
    var name = (def && def.name) ? def.name : monId;
    var lv   = (def && def.level) ? def.level : 1;
    var img  = (def && def.img) ? def.img : '';
    var row  = document.createElement('div');
    row.className = 'a-card';
    row.setAttribute('data-id', String(monId));
    row.innerHTML = ''
      + '<div class="a-left">'
      + (img ? ('<img alt="" src="'+img+'">') : '<div style="width:44px;height:44px;border-radius:8px;border:1px solid rgba(255,255,255,.15);"></div>')
      + '<div>'
      + '  <div class="a-tit">'+ name +'</div>'
      + '  <div class="a-sub">LV.'+ lv +'　數量：<b>'+ count +'</b></div>'
      + '</div></div>'
      + '<div class="a-ops">'
      + '  <button class="warn" data-op="fire-one">解雇 1</button>'
      + '  <button class="warn" data-op="fire-all">解雇全部</button>'
      + '</div>';
    return row;
  }

  function renderArmy(){
    var p = getPlayer(); if(!p) return;
    listBox.innerHTML = '';
    p.army = p.army || {};
    var keys = []; var k;
    for (k in p.army){ if (p.army.hasOwnProperty(k)) keys.push(k); }
    if (!keys.length){
      listBox.innerHTML = '<div class="muted">目前洞府內沒有任何單位。</div>';
      return;
    }
    keys.sort();
    var i;
    for (i=0;i<keys.length;i++){
      var id = keys[i];
      var cnt = p.army[id] || 0;
      if (cnt <= 0) continue;
      var row = buildRow(id, cnt);
      (function(monId){
        var b1 = row.querySelector('[data-op="fire-one"]');
        var b2 = row.querySelector('[data-op="fire-all"]');
        if (b1){ b1.addEventListener('click', function(){ dismiss(monId, 1); }); }
        if (b2){ b2.addEventListener('click', function(){
          var cur = (getPlayer().army && getPlayer().army[monId]) ? getPlayer().army[monId] : 0;
          if (cur > 0) dismiss(monId, cur);
        }); }
      })(id);
      listBox.appendChild(row);
    }
  }

  function dismiss(monId, qty){
    var p = getPlayer(); if (!p) return;
    p.army = p.army || {};
    var cur = p.army[monId] || 0;
    if (cur <= 0) return;
    if (!qty || qty < 1) qty = 1;
    if (qty > cur) qty = cur;

    // 先扣除
    p.army[monId] = cur - qty;
    if (p.army[monId] <= 0) { try{ delete p.army[monId]; }catch(_){ p.army[monId]=0; } }

    // 退款一半
    refundHalf(monId, qty);

    saveNow();
    renderArmy();
  }

  function open(ctx){
    MOD.ctx = ctx || {};
    ensureDOM();
    overlay.style.display = 'grid';
    switchTab('army');
  }

  function close(){
    if (overlay) overlay.style.display = 'none';
  }

  MOD.open = open;
  MOD.close = close;
  global['洞府軍隊'] = MOD;
})(window);