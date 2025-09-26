// dex.js — 圖鑑系統模組（依賴：window.MonsterDB、window.MAPS）
(function (global) {
  'use strict';
  function qs(s, p){ return (p||document).querySelector(s); }
  function qsa(s, p){ return (p||document).querySelectorAll(s); }

  function lvText(lv){
    var n = (typeof lv==='number' && !isNaN(lv)) ? lv : 1;
    return n + '等';
  }

  function buildLocationIndex(){
    var idx = {};
    var maps = global.MAPS || [];
    for (var i=0;i<maps.length;i++){
      var big = maps[i];
      if (!big || !big.small) continue;
      for (var j=0;j<big.small.length;j++){
        var s = big.small[j];
        var list = s.monsters || [];
        for (var k=0;k<list.length;k++){
          var mid = list[k];
          if (!idx[mid]) idx[mid] = [];
          idx[mid].push({ big: big.name, small: s.name, boss:false });
        }
        if (s.boss){
          var bid = s.boss;
          if (!idx[bid]) idx[bid] = [];
          idx[bid].push({ big: big.name, small: s.name, boss:true });
        }
      }
    }
    return idx;
  }

  function listAllMonstersInDeclarationOrder(){
    var MD = global.MonsterDB;
    if (!MD || !MD.DB) return [];
    var arr = [];
    var keys = Object.keys(MD.DB);
    for (var i=0;i<keys.length;i++){
      var id = keys[i];
      var m = MD.DB[id];
      if (m && m.id) arr.push(m);
    }
    return arr;
  }

  function listBossesInDeclarationOrder(){
    var MD = global.MonsterDB;
    if (!MD || !MD.DB) return [];
    var arr = [];
    var keys = Object.keys(MD.DB);
    for (var i=0;i<keys.length;i++){
      var id = keys[i];
      var rank = (MD.rankOf ? MD.rankOf(id) : 'normal');
      if (rank === 'boss') arr.push(MD.DB[id]);
    }
    return arr;
  }

  function renderList(container, mons, locIndex){
    container.innerHTML = '';
    for (var i=0;i<mons.length;i++){
      var m = mons[i];

      // 取得正確圖片網址（修正：getImage 回傳的是物件，要取 .url；參照 monsters.js 的 getImage 實作）
      var imgUrl = (global.MonsterDB && typeof MonsterDB.getImage==='function')
        ? (function(){ var o = MonsterDB.getImage(m.id); return (o && o.url) ? o.url : (m.img || 'https://picsum.photos/seed/monster/200/200'); })()
        : (m.img || 'https://picsum.photos/seed/monster/200/200');

      // 元素顯示（名字右邊）— 改為完整三字；無元素維持「無元素」
      var ek = (m && m.element) ? String(m.element).toLowerCase() : 'none';
      var elabel = (global.ELEMENT_LABEL && ELEMENT_LABEL[ek]) ? ELEMENT_LABEL[ek] : '無元素';
      // 若是單一中文字（例：體/火/冰/水），補上「元素」；但「無元素」保持不變
      if (elabel !== '無元素' && elabel && elabel.length === 1) { elabel = elabel + '元素'; }
      // 固定樣式：同一行、統一高度/圓角/內距，避免個別 class 造成大小不一
      var elemPill = '<span class="pill elem '+ ek +'" style="display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;height:20px;line-height:20px;padding:0 8px;border-radius:999px;box-sizing:border-box;font-size:12px;font-weight:500;vertical-align:middle;">'+ elabel +'</span>';



      // 檢查是否已遇到（遇到過＝顯示、未遇到＝影子）
      var seen = false;
      try {
        var pl = (window.Game && typeof Game.getPlayer==='function') ? Game.getPlayer() : null;
        var seenMap = (pl && pl.dex && pl.dex.seen) ? pl.dex.seen : null;
        seen = !!(seenMap && seenMap[m.id]);
      } catch(_){ seen = false; }

      // 掉落物（顯示名稱；排除貨幣）；未遇到則用「—」
      var drops = [];
      if (seen && m && Array.isArray(m.drops)){
        for (var d=0; d<m.drops.length; d++){
          var it = m.drops[d];
          if (!it) continue;
          if (it.type === 'currency') continue;
          if (it.name) drops.push(it.name);
          else if (it.id) drops.push(it.id);
        }
      }
      var dropsLine = drops.length ? drops.join('、') : '—';

      var row = document.createElement('div');
      row.className = 'dex-row';
      // 未遇到：縮圖以黑影顯示（用 CSS filter 達成全黑影子）
      var thumbImg = '<img alt="'+(m.name||m.id)+'" src="'+ imgUrl +'"'+ (seen ? '' : ' style="filter:grayscale(1) brightness(0);"') +'>';
      row.innerHTML =
        '<div class="dex-thumb">'+ thumbImg +'</div>' +
        '<div class="dex-main">' +
          '<div class="dex-name" style="display:inline-flex;align-items:center;gap:6px;flex-wrap:nowrap;min-width:0;">'+ (m.name||m.id) + elemPill +'</div>' +
          '<div class="dex-sub">'+ dropsLine +'</div>' +
        '</div>' +
        '<div class="dex-lv">'+ lvText(m.level||1) +'</div>';




      (function(mon){
        row.addEventListener('click', function(){
          openDetail(mon, locIndex);
        });
      })(m);

      container.appendChild(row);
    }
  }


  function openDetail(mon, locIndex){
    var box = qs('#dexDetail');
    if (!box) return;

    // 是否已遇到
    var seen = false;
    try {
      var pl = (window.Game && typeof Game.getPlayer==='function') ? Game.getPlayer() : null;
      var seenMap = (pl && pl.dex && pl.dex.seen) ? pl.dex.seen : null;
      seen = !!(seenMap && seenMap[mon.id]);
    } catch(_){ seen = false; }

    // 與清單一致：正確取得圖片網址
    var imgUrl = (global.MonsterDB && typeof MonsterDB.getImage==='function')
      ? (function(){ var o = MonsterDB.getImage(mon.id); return (o && o.url) ? o.url : (mon.img || 'https://picsum.photos/seed/monster/200/200'); })()
      : (mon.img || 'https://picsum.photos/seed/monster/200/200');

    var locs = locIndex[mon.id] || [];
    var parts = [];
    for (var i=0;i<locs.length;i++){
      var e = locs[i];
      var t = e.big + ' ＞ ' + e.small + (e.boss ? '<span class="tag">BOSS</span>' : '');
      parts.push('<span class="dex-loc">'+ t +'</span>');
    }
    var locHtml = parts.length ? parts.join(' ') : '<span class="dex-loc">（尚未標註）</span>';

    var imgHtml = '<img alt="'+(mon.name||mon.id)+'" src="'+ imgUrl +'"'+ (seen ? '' : ' style="filter:grayscale(1) brightness(0);"') +'>';

    // 只有遇到過才顯示 HP/MP；未遇到則完全不顯示 kv 區
    var kvHtml = '';
    if (seen) {
      var stats = (mon && mon.stats) ? mon.stats : { hp:'—', mp:'—' };
      kvHtml =
        '<div class="dex-kv">' +
          '<div class="item"><span>氣血（HP）</span><b>'+ ((stats.hp!=null)? stats.hp : '—') +'</b></div>' +
          '<div class="item"><span>真元（MP）</span><b>'+ ((stats.mp!=null)? stats.mp : '—') +'</b></div>' +
        '</div>';
    }

    box.innerHTML =
      '<div class="dex-detail">' +
        '<div class="dex-hero">' +
          '<div class="img">'+ imgHtml +'</div>' +
          '<div>' +
            '<div class="dex-name" style="font-size:14px;">'+ (mon.name||mon.id) +'</div>' +
            '<div class="dex-sub">等級：'+ lvText(mon.level||1) +'</div>' +
          '</div>' +
        '</div>' +
        kvHtml +
        '<div>' +
          '<div style="font-weight:800; margin-bottom:4px;">出沒地點</div>' +
          '<div class="dex-locs">'+ locHtml +'</div>' +
        '</div>' +
      '</div>';
    box.style.display = 'block';
    if (box.scrollIntoView){
      try{ box.scrollIntoView({ behavior:'smooth', block:'start' }); }catch(e){}
    }
  }



  function wireTabs(locIndex){
    var tabs = qsa('#dexTabs .bag-tab');
    var listEl = qs('#dexList');

    // 小怪＝所有非 BOSS；BOSS ＝ rankOf(id)==='boss'
    var allMon = listAllMonstersInDeclarationOrder();
    var bossMon = listBossesInDeclarationOrder();
    var mobMon = [];
    for (var i=0;i<allMon.length;i++){
      var mm = allMon[i];
      var rid = (mm && mm.id) ? mm.id : null;
      var rk = (global.MonsterDB && typeof MonsterDB.rankOf==='function') ? MonsterDB.rankOf(rid) : 'normal';
      if (rk !== 'boss') mobMon.push(mm);
    }

    function activate(which){
      for (var i=0;i<tabs.length;i++){ tabs[i].classList.remove('active'); }
      var t = qs('[data-dex-tab="'+which+'"]', qs('#dexTabs'));
      if (t) t.classList.add('active');
      var dd = qs('#dexDetail'); if (dd){ dd.style.display='none'; dd.innerHTML=''; }
      renderList(listEl, (which==='boss' ? bossMon : mobMon), locIndex);
    }

    for (var i=0;i<tabs.length;i++){
      (function(tab){
        tab.addEventListener('click', function(){
          var which = tab.getAttribute('data-dex-tab');
          activate(which);
        });
      })(tabs[i]);
    }

    // 預設：小怪
    activate('mob');
  }


  function openDex(){
    var modal = qs('#dexModal');
    if (!modal){ console.warn('[dex] 找不到 #dexModal'); return; }

    var closes = qsa('[data-close="dex"]', modal);
    for (var i=0;i<closes.length;i++){
      closes[i].onclick = function(){
        modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
      };
    }
    var m = qs('.mask', modal);
    if (m){ m.onclick = function(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }; }

    var locIndex = buildLocationIndex();
    wireTabs(locIndex);

    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
  }

  global.openDex = openDex;

})(window);
