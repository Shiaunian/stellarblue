// map-ui.js —— 地圖頁面 UI（不含戰鬥）抽離模組
// 依賴：MAPS（map-data.js）、MonsterDB、ELEMENT_LABEL、P（玩家資料）、Auth（可選）
// 提供全域同名函數：buildMapUI, renderAreaInfo, setLocBadge, updateBossUI, updateActionPanel, doExplore

(function(global){
  'use strict';

  // ===== 小工具（與頁面相同實作） =====
  function qs(s, p){ return (p||document).querySelector(s); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function pct(cur,max){ return (max>0? clamp(Math.round(cur/max*100),0,100) : 0); }
  function fmt(n){ return new Intl.NumberFormat('zh-Hant').format(n); }

  // ===== Header/Bars（沿用頁面相同名稱以供互動）=====
  function renderHeader(){
    if(!global.P) return;
    var fallbackAvatar = (typeof global.Auth!=='undefined' && global.Auth && global.Auth.defaultAvatar)
      ? (global.Auth.defaultAvatar() || 'https://picsum.photos/seed/xian/96')
      : 'https://picsum.photos/seed/xian/96';
    qs('#uiAvatar').src = global.P.avatar || fallbackAvatar;
    qs('#uiName').textContent = global.P.name || '無名散修';
    qs('#uiLv').textContent   = (global.P.level!=null)?global.P.level:1;
    var elem = (global.P.element || 'none').toLowerCase();
    var elemEl = qs('#uiElem'); 
    if (elemEl){
      elemEl.className = 'pill elem ' + elem; 
      elemEl.textContent = (global.ELEMENT_LABEL && global.ELEMENT_LABEL[elem]) ? global.ELEMENT_LABEL[elem] : '無元素';
    }
    var stone = (global.P.currencies && typeof global.P.currencies.stone==='number') ? global.P.currencies.stone : 0;
    var diamond = (global.P.currencies && typeof global.P.currencies.diamond==='number') ? global.P.currencies.diamond : 0;
    var sEl = qs('#uiStone');   if (sEl) sEl.textContent   = fmt(stone);
    var dEl = qs('#uiDiamond'); if (dEl) dEl.textContent   = fmt(diamond);
  }

  function renderBars(){
    if (!global.P) return;
    // —— 僅補預設、限制範圍 —— //
    if (!global.P.sta){ global.P.sta = { cur:100, max:100 }; }
    if (typeof global.P.sta.max !== 'number' || global.P.sta.max <= 0) global.P.sta.max = 100;
    if (typeof global.P.sta.cur !== 'number') global.P.sta.cur = global.P.sta.max;
    if (global.P.sta.cur > global.P.sta.max) global.P.sta.cur = global.P.sta.max;
    if (global.P.sta.cur < 0) global.P.sta.cur = 0;

    if (!global.P.exp){ global.P.exp = { cur:0, max:100 }; }
    if (typeof global.P.exp.max !== 'number' || global.P.exp.max <= 0) global.P.exp.max = 100;
    if (typeof global.P.exp.cur !== 'number') global.P.exp.cur = 0;
    if (global.P.exp.cur > global.P.exp.max) global.P.exp.cur = global.P.exp.max;
    if (global.P.exp.cur < 0) global.P.exp.cur = 0;

    // —— 畫面更新 —— //
    var staBar = qs('#barSta'); if (staBar){ staBar.style.width = (global.P.sta.cur / global.P.sta.max * 100) + '%'; }
    var staTxt = qs('#txtSta'); if (staTxt){ staTxt.textContent = global.P.sta.cur + '/' + global.P.sta.max; }

    var expBar = qs('#barExp'); if (expBar){ expBar.style.width = (global.P.exp.cur / global.P.exp.max * 100) + '%'; }
    var expTxt = qs('#txtExp'); if (expTxt){ expTxt.textContent = global.P.exp.cur + '/' + global.P.exp.max; }

    var hp = (global.P.hp||{cur:0,max:1}); var mp = (global.P.mp||{cur:0,max:1});
    var hpBar = qs('#barHp'); if (hpBar){ hpBar.style.width = (hp.cur / hp.max * 100) + '%'; }
    var hpTxt = qs('#txtHp'); if (hpTxt){ hpTxt.textContent = hp.cur + '/' + hp.max; }
    var mpBar = qs('#barMp'); if (mpBar){ mpBar.style.width = (mp.cur / mp.max * 100) + '%'; }
    var mpTxt = qs('#txtMp'); if (mpTxt){ mpTxt.textContent = mp.cur + '/' + mp.max; }
  }

  // ====== 以下皆為你目前頁面相同行為的函數（呼叫點不變） ======

  function renderAreaInfo(){
    var box = qs('#infoMonsters');
    // 依 curBig / curSmall 找到目前的小地圖
    var big = null, s = null, i, j;
    for (i=0;i<global.MAPS.length;i++){
      if (global.MAPS[i].id === global.curBig){ big = global.MAPS[i]; break; }
    }
    if (big && big.small){
      for (j=0;j<big.small.length;j++){
        if (big.small[j].id === global.curSmall){ s = big.small[j]; break; }
      }
    }
    if (!s){
      if (box) box.innerHTML = '<span class="chip">—</span>';
      return;
    }
    var chips = [];
    var list = s.monsters || [];
    var k;
    for (k=0;k<list.length;k++){
      var id = list[k];
      var m = (global.MonsterDB && global.MonsterDB.get) ? global.MonsterDB.get(id) : null;
      if(!m){
        chips.push('<span class="chip"><span class="mname">'+id+'</span></span>');
      }else{
        var el = (global.ELEMENT_LABEL && global.ELEMENT_LABEL[m.element]) || '無';
        chips.push(
          '<span class="chip">' +
            '<span class="pill elem '+(m.element||'none')+'">'+ el +'</span>' +
            '<span class="mname">'+ m.name +'</span><span class="mlv">LV.'+(m.level||1)+'</span>' +
          '</span>'
        );
      }
    }
    if (s.boss){
      var b = (global.MonsterDB && global.MonsterDB.get) ? global.MonsterDB.get(s.boss) : null;
      if (b){
        var elb = (global.ELEMENT_LABEL && global.ELEMENT_LABEL[b.element]) || '無';
        chips.push(
          '<span class="chip" style="border-color:#dc2626;background:rgba(220,38,38,.12)">' +
            '<strong>BOSS</strong>' +
            '<span class="pill elem '+(b.element||'none')+'">'+ elb +'</span>' +
            '<span class="mname">'+ b.name +'</span><span class="mlv">LV.'+(b.level||1)+'</span>' +
          '</span>'
        );
      }
    }
    if (box) box.innerHTML = chips.join('');
  }

  function setLocBadge(){
    var big = null, small = null, i, j;
    for(i=0;i<global.MAPS.length;i++){
      if(global.MAPS[i].id===global.curBig){ big = global.MAPS[i]; break; }
    }
    if (big && big.small){
      for (j=0;j<big.small.length;j++){
        if (big.small[j].id===global.curSmall){ small = big.small[j]; break; }
      }
    }
    var locTxt = small ? ('目前位置：' + big.name + ' ＞ ' + small.name) : '尚未選擇地點';
    var el = qs('#locBadge');
    if (el) el.textContent = global.entered ? (locTxt + '（已進入）') : locTxt;
  }

  function updateBossUI(){
    var hint = qs('#slimeQuestHint');
    var btnBoss = qs('#btnBoss');
    if(!hint || !btnBoss) return;

    // 找到當前小地圖
    var big = null, area = null, i, j;
    for (i=0; i<global.MAPS.length; i++){
      if (global.MAPS[i].id === global.curBig){ big = global.MAPS[i]; break; }
    }
    if (big && big.small){
      for (j=0; j<big.small.length; j++){
        if (big.small[j].id === global.curSmall){ area = big.small[j]; break; }
      }
    }

    if(!area || !area.boss || !global.entered){
      hint.style.display = 'none';
      btnBoss.style.display = 'none';
      return;
    }

    global.P = global.P || {};
    global.P.mapProg = global.P.mapProg || {};
    var progKey = area.id;
    var prog = global.P.mapProg[progKey] || { kills:0, bossReady:false, bossDefeated:false };
    var requiredKills = area.killsRequired || 10;

    if(prog.kills >= requiredKills){
      prog.bossReady = true;
    }

    if(prog.bossReady){
      var statusPrefix = prog.bossDefeated ? '重新挑戰' : '首次挑戰';
      hint.textContent = area.name + '：討伐已達 ' + prog.kills + '/' + requiredKills + ' → 可以' + statusPrefix + ' BOSS！';
      hint.style.display = 'block';
      btnBoss.style.display = 'inline-block';
      btnBoss.textContent = statusPrefix + ' BOSS';
      btnBoss.style.background = '#b91c1c';
    }else{
      var statusText = prog.bossDefeated 
        ? (area.name + '：BOSS 已擊敗，需重新累積討伐進度 ' + prog.kills + '/' + requiredKills)
        : (area.name + '：怪物討伐進度 ' + prog.kills + '/' + requiredKills + '（達成後將出現 BOSS）');
      hint.textContent = statusText;
      hint.style.display = 'block';
      btnBoss.style.display = 'none';
    }

    // 寫回
    global.P.mapProg[progKey] = prog;
  }

  function updateActionPanel(){
    var btnEnter   = qs('#btnEnter');
    var btnExplore = qs('#btnExplore');
    var btnFight   = qs('#btnFight');

    var canEnter = !!global.curBig && !!global.curSmall;
    if (btnEnter) btnEnter.disabled = !canEnter;

    if(!global.entered){
      if (btnEnter)   btnEnter.style.display   = 'inline-block';
      if (btnExplore) btnExplore.style.display = 'none';
      if (btnFight)   btnFight.style.display   = 'none';
    }else{
      if (btnEnter)   btnEnter.style.display   = 'none';
      if (btnExplore) btnExplore.style.display = 'inline-block';
      if (btnFight)   btnFight.style.display   = 'inline-block';
    }

    updateBossUI();
  }

  function buildMapUI(){
    var bigCol   = qs('#bigMapCol');
    var smallCol = qs('#smallMapCol');
    if (bigCol) bigCol.innerHTML=''; 
    if (smallCol) smallCol.innerHTML='';

    // 左列：大地圖（清單＋建議等級）
    var i;
    for(i=0;i<global.MAPS.length;i++){
      (function(m){
        var btn = document.createElement('div');
        btn.className = 'tag' + (m.id===global.curBig?' active':'');
        btn.innerHTML = '<span class="name">'+m.name+'</span><span class="lv">建議 '+(m.lv||'—')+'</span>';
        btn.onclick = function(){
          global.curBig = m.id;
          global.curSmall = null;
          global.entered = false;
          buildMapUI();
          setLocBadge();
          updateActionPanel();
        };
        if (bigCol) bigCol.appendChild(btn);
      })(global.MAPS[i]);
    }

    // 若尚未選擇，預設選第一個大地圖
    var big = null;
    for(i=0;i<global.MAPS.length;i++){
      if (global.MAPS[i].id === global.curBig){ big = global.MAPS[i]; break; }
    }
    if(!global.curBig){
      big = global.MAPS[0];
      if (big) global.curBig = big.id;
    }
    if (!big){
      // 無可用地圖
      setLocBadge();
      updateActionPanel();
      renderAreaInfo();
      return;
    }

    // 右列：依目前大地圖顯示副地圖（清單＋建議等級）
    if (big.small && smallCol){
      var j;
      for(j=0;j<big.small.length;j++){
        (function(s){
          var btn = document.createElement('div');
          btn.className = 'tag' + (s.id===global.curSmall?' active':'');
          btn.innerHTML = '<span class="name">'+s.name+'</span><span class="lv">建議 '+(s.lv||'—')+'</span>';
          btn.onclick = function(){
            global.curSmall = s.id;
            global.entered = false;
            setLocBadge();
            updateActionPanel();
            // 標記 active
            var kids = smallCol.children;
            var a;
            for (a=0;a<kids.length;a++){
              kids[a].classList.remove('active');
            }
            btn.classList.add('active');
            renderAreaInfo();
          };
          smallCol.appendChild(btn);
        })(big.small[j]);
      }
    }

    setLocBadge();
    updateActionPanel();
    renderAreaInfo();
  }

  function doExplore(){
    if(!global.curSmall){ log('請先選擇副地圖。'); return; }
    if(!global.entered){ log('請先按「進入」該地區。'); return; }
    if(!global.P) return;

    var staCur = (global.P.sta && typeof global.P.sta.cur === 'number') ? global.P.sta.cur : 0;
    if(staCur < 2){ log('體力不足（需要 2）', 'warn'); return; }
    global.P.sta.cur = staCur - 2;

    var r = Math.random();
    if(r < 0.5){
      var got = 5 + Math.floor(Math.random()*16); // 5~20
      global.P.currencies.stone = (global.P.currencies && typeof global.P.currencies.stone==='number') 
        ? (global.P.currencies.stone + got) : got;
      log('探險獲得 靈石 ×' + got, 'ok');
    }else if(r < 0.8){
      // 素材
      var picks = ['wood_shard','stone_core','ghost_essence'];
      var id = picks[Math.floor(Math.random()*picks.length)];
      var hasDef = (global.ItemDB && typeof global.ItemDB.getDef==='function' && global.ItemDB.getDef('materials', id));
      if(!hasDef){ id = 'wood_shard'; }
      var qty = 1 + Math.floor(Math.random()*2);
      if(global.ItemDB && typeof global.ItemDB.addMaterialToBag==='function') global.ItemDB.addMaterialToBag(global.P.bag, id, qty);
      var mdef = (global.ItemDB && global.ItemDB.getDef) ? global.ItemDB.getDef('materials', id) : null;
      var mname = (mdef && mdef.name) ? mdef.name : id;
      log('探險獲得素材：' + mname + ' ×' + qty, 'ok');
    }else{
      // 消耗品
      var ids = ['hp_small','mp_small'];
      var filtered = [];
      var x;
      for (x=0; x<ids.length; x++){
        var ok = (global.ItemDB && typeof global.ItemDB.getDef==='function' && global.ItemDB.getDef('consumables', ids[x]));
        if(ok) filtered.push(ids[x]);
      }
      var cid = filtered.length ? filtered[Math.floor(Math.random()*filtered.length)] : 'hp_small';
      if(global.ItemDB && typeof global.ItemDB.addConsumableToBag==='function') global.ItemDB.addConsumableToBag(global.P.bag, cid, 1);
      var cdef = (global.ItemDB && global.ItemDB.getDef) ? global.ItemDB.getDef('consumables', cid) : null;
      var cname = (cdef && cdef.name) ? cdef.name : cid;
      log('探險獲得丹藥：' + cname + ' ×1', 'ok');
    }

    renderHeader();
    renderBars();

    // 同步快取（與你頁面一致邏輯）
    if (global.Auth && typeof global.Auth.setCharacter === 'function') {
      try { 
        var cleanData = JSON.parse(JSON.stringify(global.P));
        delete cleanData._live;
        global.Auth.setCharacter(cleanData); 
      } catch(_e) {}
    }
  }

  // ===== 導出成全域同名（不影響現有呼叫） =====
  global.buildMapUI = buildMapUI;
  global.renderAreaInfo = renderAreaInfo;
  global.setLocBadge = setLocBadge;
  global.updateBossUI = updateBossUI;
  global.updateActionPanel = updateActionPanel;
  global.doExplore = doExplore;

})(window);
