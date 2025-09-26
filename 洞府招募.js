(function(global){
  'use strict';
  // ===== 洞府招募（Recruitment for Cave） =====
  // 導出為 window['洞府招募']
  var MOD = {};

  var overlay = null;
  var listBox = null;
  var tabBtns = {};
  var queueBox = null;
  var qtyPanel = null;
  var qtyRange = null;
  var qtyOut = null;
  var confirmBtn = null;
  var curPick = null;
  var tickTimer = null;

  function fmt(n){
    try{ return new Intl.NumberFormat('zh-Hant').format(n|0); }catch(_){ return String(n); }
  }

  function ensureCSS(){
    if (document.getElementById('recruitCSS')) return;
    var css = [
      /* 全螢幕面板 + 背景 */
      '#recruitOverlay{position:fixed;inset:0;display:none;place-items:stretch;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);z-index:9999;}',
      '#recruitPanel{width:100vw;height:100vh;background:#0b1220;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:0;box-shadow:none;display:flex;flex-direction:column;overflow:hidden;}',
      '#recruitPanel .hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0));}',
      '#recruitPanel .title{font-weight:800;letter-spacing:.3em;opacity:.95;}',
      /* 右上角：招募中＋紅色圓形返回 */
      '#recruitPanel .rctrl{display:flex;align-items:center;gap:8px;}',
      '#recruitPanel .qbtn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);padding:6px 12px;border-radius:10px;font-weight:800;letter-spacing:.2em;color:#fff;}',
      '#btnClose{width:25px;height:25px;border-radius:999px;background:#b91c1c;border:1px solid #ef4444;color:#fff;font-weight:900;letter-spacing:-2px;display:grid;place-items:center;line-height:1;}',
      '#btnClose:hover{filter:brightness(1.1);}',
      /* 內容：單欄清單 + 滾動 */
      '#recruitPanel .bd{flex:1;overflow:auto;padding:12px;}',
      '#recruitPanel .lt{font-size:12px;letter-spacing:.2em;opacity:.8;margin:2px 0 8px 2px;}',
      '#recruitPanel .list{overflow:auto;min-height:320px;padding-right:6px;}',
      /* 底部切換：小怪 / BOSS（同寬同高、白字） */
      '#recruitPanel .btm{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(255,255,255,.08);}',
      '#recruitPanel .btm button{flex:1;height:44px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);border-radius:10px;font-weight:800;letter-spacing:.2em;color:#fff;}',
      '#recruitPanel .btm button.on{background:#b91c1c;border-color:#ef4444;}',
      /* 單行卡片 */
      '.rcard{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);border-radius:10px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;}',
      '.rcard .left{display:flex;align-items:center;gap:10px;min-width:0;}',
      '.rcard img.av{width:36px;height:36px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,.15);background:#222;}',
      '.rcard .tit{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.rcard .lv{opacity:.86;margin-left:8px;}',
      '.rcard .ops button{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.08);border-radius:10px;padding:6px 12px;font-weight:700;letter-spacing:.2em;}',
      '.pill.elem{display:inline-block;border-radius:999px;border:1px solid rgba(255,255,255,.28);padding:2px 8px;font-size:12px;}',
      /* 招募中進度條（隊列視窗用） */
      '.prog{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;}',
      '.prog .bar{height:100%;width:0%;background:linear-gradient(90deg,#ef4444,#f59e0b);}',
      /* 招募數量彈窗（招募資訊） */
      '#qtyModal{position:absolute;inset:0;display:none;place-items:center;background:rgba(0,0,0,.55);}',
      '#qtyModal .qbox{width:min(520px,92vw);background:#0f172a;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:12px;}',
      '#qtyModal .qbox .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:800;letter-spacing:.15em;}',
      '#qtyModal .qbox .row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0;}',
      '.qpanel{display:block;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px;background:rgba(255,255,255,.03);}',
      /* 招募中清單彈窗 */
      '#queueModal{position:absolute;inset:0;display:none;place-items:center;background:rgba(0,0,0,.55);}',
      '#queueModal .qbox{width:min(680px,94vw);max-height:80vh;overflow:auto;background:#0f172a;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:12px;}',
      '#queueModal .qbox .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:800;letter-spacing:.15em;}',
      '#queueList{max-height:65vh;overflow:auto;}',
      '.muted{opacity:.7}'
    ].join('');
    var st = document.createElement('style');
    st.id = 'recruitCSS';
    st.textContent = css;
    document.head.appendChild(st);
  }



  function ensureDOM(){
    if(overlay) return;
    ensureCSS();
    overlay = document.createElement('div');
    overlay.id = 'recruitOverlay';
    overlay.innerHTML = ''
      + '<div id="recruitPanel">'
      + '  <div class="hd">'
      + '    <div class="title">招 募 大 廳</div>'
      + '    <div class="rctrl">'
      + '      <button id="btnQueueOpen" class="qbtn">招募中</button>'
      + '      <button id="btnClose" title="返回">×</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="bd">'
      + '    <div>'
      + '      <div class="lt" id="listTitle">可招募小怪</div>'
      + '      <div class="list" id="recruitList"></div>'
      + '    </div>'
      + '  </div>'
      + '  <div class="btm">'
      + '    <button id="tabSmall" class="on">小怪</button>'
      + '    <button id="tabBoss">BOSS</button>'
      + '  </div>'
      + '</div>'
      + '<div id="qtyModal">'
      + '  <div class="qbox">'
      + '    <div class="hd"><div id="qmTitle">招募資訊</div><button id="btnQClose">×</button></div>'
      + '    <div class="qpanel" id="qtyPanel">'
      + '      <div class="row"><div id="qpTitle"></div><div class="muted">X <span id="qpQty">1</span></div></div>'
      + '      <div class="row"><input id="qpRange" type="range" min="0" max="99" value="0" style="width:100%"></div>'
      + '      <div class="row"><div class="muted">需花費</div><div id="qpCost"></div></div>'
      + '      <div class="row"><div class="muted">現有資源</div><div id="qpHave"></div></div>'
      + '      <div class="row"><div class="muted">時間</div><div id="qpTime"></div></div>'
      + '      <div class="row" style="justify-content:flex-end;gap:8px;">'
      + '        <button id="btnQCancel">取消</button>'
      + '        <button id="btnConfirmRecruit" class="opx primary">開始招募</button>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '<div id="queueModal">'
      + '  <div class="qbox">'
      + '    <div class="hd"><div>招募中</div><button id="btnQueueClose">×</button></div>'
      + '    <div id="queueList"></div>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(overlay);

    listBox   = document.getElementById('recruitList');
    qtyPanel  = document.getElementById('qtyPanel');
    qtyRange  = document.getElementById('qpRange');
    qtyOut    = document.getElementById('qpQty');
    confirmBtn= document.getElementById('btnConfirmRecruit');

    tabBtns.small = document.getElementById('tabSmall');
    tabBtns.boss  = document.getElementById('tabBoss');

    document.getElementById('btnClose').onclick = close;

    var qmClose = document.getElementById('btnQClose');
    if (qmClose){ qmClose.onclick = function(){ var m=document.getElementById('qtyModal'); if(m) m.style.display='none'; }; }
    var qmCancel = document.getElementById('btnQCancel');
    if (qmCancel){ qmCancel.onclick = function(){ var m=document.getElementById('qtyModal'); if(m) m.style.display='none'; }; }

    var qOpen = document.getElementById('btnQueueOpen');
    if (qOpen){ qOpen.onclick = function(){ var m=document.getElementById('queueModal'); if(m){ m.style.display='grid'; renderQueue(); } }; }
    var qClose = document.getElementById('btnQueueClose');
    if (qClose){ qClose.onclick = function(){ var m=document.getElementById('queueModal'); if(m) m.style.display='none'; }; }

    tabBtns.small.onclick = function(){ switchTab('small'); };
    tabBtns.boss.onclick  = function(){ switchTab('boss'); };

    qtyRange.addEventListener('input', updateQty);
    confirmBtn.addEventListener('click', confirmRecruit);
  }


  function switchTab(name){
    for (var k in tabBtns){
      if (tabBtns.hasOwnProperty(k)){
        tabBtns[k].classList.toggle('on', k===name);
      }
    }
    var lt = document.getElementById('listTitle');
    if (lt){
      if (name==='small') lt.textContent = '可招募小怪';
      else lt.textContent = '可招募 BOSS（需已擊敗）';
    }
    renderList(name);
  }



  function close(){
    if(overlay) overlay.style.display = 'none';
    var m1 = document.getElementById('qtyModal');   if (m1) m1.style.display='none';
    var m2 = document.getElementById('queueModal'); if (m2) m2.style.display='none';
    if (tickTimer){ clearInterval(tickTimer); tickTimer = null; }
  }


  function buildAreaMap(){
    var map = {};
    var i, j;
    var M = global.MAPS || [];
    for (i=0;i<M.length;i++){
      var big = M[i];
      if (!big || !big.small) continue;
      for (j=0;j<big.small.length;j++){
        var s = big.small[j];
        map[s.id] = s;
      }
    }
    return map;
  }

  function gatherSmallMonsterIds(){
    var set = {};
    var M = global.MAPS || [];
    var i,j,k;
    for (i=0;i<M.length;i++){
      var big = M[i];
      if (!big || !big.small) continue;
      for (j=0;j<big.small.length;j++){
        var s = big.small[j];
        var arr = (s && s.monsters) ? s.monsters : [];
        for (k=0;k<arr.length;k++){
          var id = arr[k];
          set[id] = 1;
        }
      }
    }
    return Object.keys(set);
  }

  function perUnitCost(mon){
    var lvl = (mon && mon.level) ? mon.level : 1;
    // 規則：LV4 → 靈石20、其他資源各5、時間3秒（依等級線性放大）
    var cost = {
      stone: lvl * 5,
      wood:  Math.max(1, Math.round(lvl * 1.25)),
      ore:   Math.max(1, Math.round(lvl * 1.25)),
      water: Math.max(1, Math.round(lvl * 1.25)),
      food:  Math.max(1, Math.round(lvl * 1.25)),
      time:  Math.max(3, Math.round(lvl * 0.75)) // 秒
    };
    return cost;
  }

  function calcTotal(cost, qty){
    var out = { stone:0, wood:0, ore:0, water:0, food:0, time:0 };
    var keys = ['stone','wood','ore','water','food','time'];
    for (var i=0;i<keys.length;i++){
      var k = keys[i];
      out[k] = (cost[k]||0) * qty;
    }
    return out;
  }

  function hasEnough(p, need){
    var ok = true;
    if (!p) return false;
    if (!p.currencies) p.currencies = { stone:0, diamond:0 };
    if (!p.resources)  p.resources  = { ore:0, wood:0, food:0, water:0 };
    if ((p.currencies.stone|0) < (need.stone|0)) ok = false;
    if ((p.resources.wood|0)  < (need.wood|0))  ok = false;
    if ((p.resources.ore|0)   < (need.ore|0))   ok = false;
    if ((p.resources.water|0) < (need.water|0)) ok = false;
    if ((p.resources.food|0)  < (need.food|0))  ok = false;
    return ok;
  }

  function costText(cost){
    return '靈石:'+fmt(cost.stone)+'　木:'+fmt(cost.wood)+'　礦:'+fmt(cost.ore)+'　水:'+fmt(cost.water)+'　糧:'+fmt(cost.food)+'　時間:'+fmt(cost.time)+'秒';
  }

  function buildCard(mon){
    var el = document.createElement('div');
    el.className = 'rcard';
    var elemLabel = (global.ELEMENT_LABEL && global.ELEMENT_LABEL[mon.element]) || '無';
    var img = mon && mon.img ? mon.img : '';
    el.innerHTML = ''
      + '<div class="left">'
      + '  <img class="av" alt="" src="'+img+'"/>'
      + '  <div class="tit"><span class="pill elem '+(mon.element||'none')+'">'+elemLabel+'</span> '+ (mon.name||'') +' <span class="lv">LV.'+(mon.level||1)+'</span></div>'
      + '</div>'
      + '<div class="ops"><button data-id="'+(mon.id||'')+'">招募</button></div>';
    var btn = el.querySelector('button');
    btn.onclick = function(){ openQty(mon); };
    return el;
  }


  function openQty(mon){
    curPick = mon;
    document.getElementById('qpTitle').textContent = mon.name + '（每單位）';

    // 計算可招募上限（依玩家現有資源）
    var p = (MOD.ctx && MOD.ctx.getPlayer) ? MOD.ctx.getPlayer() : null;
    var c = perUnitCost(mon);
    var maxStone = c.stone>0 && p && p.currencies ? Math.floor((p.currencies.stone|0) / c.stone) : 99;
    var maxWood  = c.wood >0 && p && p.resources  ? Math.floor((p.resources.wood  |0) / c.wood ) : 99;
    var maxOre   = c.ore  >0 && p && p.resources  ? Math.floor((p.resources.ore   |0) / c.ore  ) : 99;
    var maxWater = c.water>0 && p && p.resources  ? Math.floor((p.resources.water |0) / c.water) : 99;
    var maxFood  = c.food >0 && p && p.resources  ? Math.floor((p.resources.food  |0) / c.food ) : 99;
    var maxAff   = Math.max(0, Math.min(99, maxStone, maxWood, maxOre, maxWater, maxFood));

    // 設定滑桿與初值
    qtyRange.min = (maxAff>0 ? 1 : 0);
    qtyRange.max = maxAff;
    qtyRange.value = (maxAff>0 ? 1 : 0);

    // 顯示現有資源
    var haveTxt = '靈石:' + (p && p.currencies ? (p.currencies.stone|0) : 0)
                + '　木:' + (p && p.resources ? (p.resources.wood|0) : 0)
                + '　礦:' + (p && p.resources ? (p.resources.ore|0)  : 0)
                + '　水:' + (p && p.resources ? (p.resources.water|0): 0)
                + '　糧:' + (p && p.resources ? (p.resources.food|0) : 0);
    var haveEl = document.getElementById('qpHave'); if (haveEl) haveEl.textContent = haveTxt;

    var m = document.getElementById('qtyModal');
    if (m) m.style.display = 'grid';
    qtyPanel.style.display = 'block';
    updateQty();
  }


  function updateQty(){
    if (!curPick) return;
    var p = (MOD.ctx && MOD.ctx.getPlayer) ? MOD.ctx.getPlayer() : null;
    var c = perUnitCost(curPick);

    // 重新計算可招募上限（隨時反映最新資源）
    var maxStone = c.stone>0 && p && p.currencies ? Math.floor((p.currencies.stone|0) / c.stone) : 99;
    var maxWood  = c.wood >0 && p && p.resources  ? Math.floor((p.resources.wood  |0) / c.wood ) : 99;
    var maxOre   = c.ore  >0 && p && p.resources  ? Math.floor((p.resources.ore   |0) / c.ore  ) : 99;
    var maxWater = c.water>0 && p && p.resources  ? Math.floor((p.resources.water |0) / c.water) : 99;
    var maxFood  = c.food >0 && p && p.resources  ? Math.floor((p.resources.food  |0) / c.food ) : 99;
    var maxAff   = Math.max(0, Math.min(99, maxStone, maxWood, maxOre, maxWater, maxFood));

    // 夾住滑桿範圍與目前值
    qtyRange.min = (maxAff>0 ? 1 : 0);
    qtyRange.max = maxAff;
    var qty = parseInt(qtyRange.value,10);
    if (isNaN(qty)) qty = (maxAff>0 ? 1 : 0);
    if (qty > maxAff) { qty = maxAff; qtyRange.value = String(qty); }
    if (qty < (maxAff>0 ? 1 : 0)) { qty = (maxAff>0 ? 1 : 0); qtyRange.value = String(qty); }

    // 顯示數量與總花費/時間
    qtyOut.textContent = qty;
    var total = calcTotal(c, qty);
    var costEl = document.getElementById('qpCost'); if (costEl) costEl.textContent = costText(total);
    var timeEl = document.getElementById('qpTime'); if (timeEl) timeEl.textContent = fmt(total.time) + ' 秒';

    // 更新現有資源
    var haveTxt = '靈石:' + (p && p.currencies ? (p.currencies.stone|0) : 0)
                + '　木:' + (p && p.resources ? (p.resources.wood|0) : 0)
                + '　礦:' + (p && p.resources ? (p.resources.ore|0)  : 0)
                + '　水:' + (p && p.resources ? (p.resources.water|0): 0)
                + '　糧:' + (p && p.resources ? (p.resources.food|0) : 0);
    var haveEl = document.getElementById('qpHave'); if (haveEl) haveEl.textContent = haveTxt;

    // 可否按下「開始招募」
    if (confirmBtn){
      confirmBtn.disabled = (qty < 1);
    }
  }




  function confirmRecruit(){
    var p = (MOD.ctx && MOD.ctx.getPlayer) ? MOD.ctx.getPlayer() : null;
    if (!p || !curPick) return;
    var qty = parseInt(qtyRange.value,10) || 1;
    var total = calcTotal(perUnitCost(curPick), qty);
    if (!hasEnough(p, total)){
      alert('資源不足，無法招募。');
      return;
    }
    // 扣資源
    p.currencies = p.currencies || { stone:0, diamond:0 };
    p.resources  = p.resources  || { ore:0, wood:0, food:0, water:0 };
    p.currencies.stone = (p.currencies.stone|0) - (total.stone|0);
    p.resources.wood   = (p.resources.wood|0)    - (total.wood|0);
    p.resources.ore    = (p.resources.ore|0)     - (total.ore|0);
    p.resources.water  = (p.resources.water|0)   - (total.water|0);
    p.resources.food   = (p.resources.food|0)    - (total.food|0);

    p.recruitQueue = p.recruitQueue || [];
    var job = {
      monId: curPick.id,
      name:  curPick.name,
      qty:   qty,
      perSec: perUnitCost(curPick).time,
      totalSec: total.time,
      startAt: Date.now()
    };
    p.recruitQueue.push(job);

    try{ if (MOD.ctx && typeof MOD.ctx.save === 'function') MOD.ctx.save(); }catch(_){}
    switchTab('queue');
    renderQueue();
    qtyPanel.style.display = 'none';
    var m = document.getElementById('qtyModal'); if (m) m.style.display = 'none';
  }


  function renderQueue(){
    var p = (MOD.ctx && MOD.ctx.getPlayer) ? MOD.ctx.getPlayer() : null;
    var box = document.getElementById('queueList');
    if (!box) return;
    box.innerHTML = '';
    p = p || {};
    var q = p.recruitQueue || [];
    if (!q.length){
      box.innerHTML = '<div class="muted">目前沒有招募中的單位。</div>';
      return;
    }
    var now = Date.now();
    var i;
    for (i=0;i<q.length;i++){
      var it = q[i];
      var pass = Math.floor((now - (it.startAt||now)) / 1000);
      var remain = (it.totalSec|0) - pass;
      if (remain < 0) remain = 0;
      var percent = (it.totalSec>0) ? Math.max(0, Math.min(100, Math.floor((pass / it.totalSec) * 100))) : 0;

      var el = document.createElement('div');
      el.className = 'rcard';
      el.setAttribute('data-idx', String(i));
      el.innerHTML = ''
        + '<div class="info">'
        + '  <div class="tit">'+ it.name + ' ×'+ it.qty + '</div>'
        + '  <div class="cost muted">剩餘時間：<span data-left>'+fmt(remain)+'</span> 秒</div>'
        + '  <div class="prog"><div class="bar" data-bar style="width:'+percent+'%"></div></div>'
        + '</div>'
        + '<div class="ops"></div>';
      box.appendChild(el);
    }
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tickQueue, 1000);
  }



  function tickQueue(){
    var p = (MOD.ctx && MOD.ctx.getPlayer) ? MOD.ctx.getPlayer() : null;
    if (!p) return;
    var q = p.recruitQueue || [];
    var now = Date.now();
    var changed = false;
    var i;
    for (i=q.length-1; i>=0; i--){
      var it = q[i];
      var pass = Math.floor((now - (it.startAt||now)) / 1000);
      var remain = (it.totalSec|0) - pass;
      if (remain <= 0){
        q.splice(i,1);
        changed = true;
        // TODO：完成後把單位加入你的隊伍資料結構
      }
    }
    if (changed){
      try{ if (MOD.ctx && typeof MOD.ctx.save === 'function') MOD.ctx.save(); }catch(_){}
      renderQueue();
      return;
    }
    /* 沒完成就更新 UI（彈窗） */
    var spans = document.querySelectorAll('#queueList [data-left]');
    var bars  = document.querySelectorAll('#queueList [data-bar]');
    for (i=0;i<spans.length;i++){
      var el = spans[i];
      var it2 = q[i];
      if (!it2){ el.textContent='0'; continue; }
      var pass2 = Math.floor((Date.now() - (it2.startAt||Date.now()))/1000);
      var remain2 = (it2.totalSec|0) - pass2;
      if (remain2 < 0) remain2 = 0;
      el.textContent = fmt(remain2);
      if (bars[i]){
        var percent = (it2.totalSec>0) ? Math.max(0, Math.min(100, Math.floor((pass2 / it2.totalSec) * 100))) : 0;
        bars[i].style.width = percent + '%';
      }
    }
  }



  function renderList(tab){
    var p = (MOD.ctx && MOD.ctx.getPlayer) ? MOD.ctx.getPlayer() : null;
    if (!p) return;
    listBox.innerHTML = '';
    var ids = [];
    if (tab === 'small'){
      ids = gatherSmallMonsterIds();
    }else{ /* boss */
      var areaMap = buildAreaMap();
      var mp = (p.mapProg || {});
      var keys = Object.keys(areaMap);
      var z;
      for (z=0; z<keys.length; z++){
        var key = keys[z];
        var prog = mp[key];
        if (prog && prog.bossDefeated && areaMap[key] && areaMap[key].boss){
          ids.push(areaMap[key].boss);
        }
      }
    }
    var dict = {}; var out = []; var i;
    for (i=0;i<ids.length;i++){ dict[ids[i]] = 1; }
    var k; for (k in dict){ if(dict.hasOwnProperty(k)) out.push(k); }

    var mons = [];
    for (i=0;i<out.length;i++){
      var m = (global.MonsterDB && global.MonsterDB.get) ? global.MonsterDB.get(out[i]) : null;
      if (!m) continue;
      if (tab === 'small'){
        var lv = m.level || 1;
        if (lv <= (p.level||1)) mons.push(m);
      }else{
        mons.push(m);
      }
    }
    mons.sort(function(a,b){
      var al = a.level||1, bl = b.level||1;
      if (al !== bl) return al - bl;
      var an = a.name||'', bn = b.name||'';
      return an<bn ? -1 : (an>bn?1:0);
    });
    if (!mons.length){
      listBox.innerHTML = '<div class="muted">'+ (tab==='boss' ? '尚無已擊敗的 BOSS 可招募。' : '沒有符合等級的單位。') +'</div>';
      return;
    }
    for (i=0;i<mons.length;i++){
      listBox.appendChild(buildCard(mons[i]));
    }
  }

  MOD.open = function(ctx){
    MOD.ctx = ctx || {};
    ensureDOM();
    overlay.style.display = 'grid';
    switchTab('small');
    qtyPanel.style.display = 'none';
  };


  global['洞府招募'] = MOD;

})(window);
