// bag.js — 從 game.html 移出的「儲物袋」專用模組
// 內容完全取自目前的 game.html，不改函式名稱、不使用展開運算子。
// 依賴全域：state, ItemDB, Auth, Equip, Game, qs, render, renderDerived 等。


function openBag(){ seedBagIfMissing(); renderBag('consumable'); const m = qs('#bagModal'); if(!m) return; m.classList.add('show'); m.setAttribute('aria-hidden','false'); }

function closeBag(){ const m = qs('#bagModal'); if(!m) return; m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }

function switchBagTab(k){ document.querySelectorAll('.bag-tab').forEach(t=> t.classList.toggle('active', t.dataset.bagTab===k)); renderBag(k); }

function renderBag(k){
  const P = state.player; if(!P) return;
  const box = qs('#bagList'); if(!box) return;
  box.innerHTML = '';
  if (k === 'consumable') {
    renderConsumables(box, P);
  } else if (k === 'weapon') {
    renderWeapons(box, P);
  } else if (k === 'equip') {
    renderEquip(box, P);           // ← 新增這行
  } else if (k === 'ornament') {
    renderOrnaments(box, P);       // ← 只剩戒指/耳環（下一步會改）
  } else if (k === 'hidden') {
    renderHidden(box, P);
  } else if (k === 'material') {
    renderMaterials(box, P);
  } else {
    const tip = document.createElement('div'); tip.className='item-sub';
    tip.textContent = '尚無內容';
    box.appendChild(tip);
  }
}

function renderConsumables(box, P){
  const items = P.bag.consumables || [];
  const isUrl = s => typeof s === 'string' && /^https?:\/\//.test(s); // 檢查是否為有效URL

  items.forEach((it, i) => {
    // 取得物品基本資訊
    const def = ItemDB.getDef('consumables', it.id) || {};
    const name  = it.name  || def.name  || it.id;
    const price = (it.price ?? def.price ?? 0);
    
    // 處理效果顯示（氣血恢復）
    const effHp = (it.effect?.hp ?? def.effect?.hp);
    const effHtml = effHp ? `<span class="badge hp">氣血+${effHp}</span>` : '';
    
    // 處理圖示URL
    const iconUrl = isUrl(it.icon) ? it.icon : (isUrl(def.icon) ? def.icon : null);
    const cnt = Math.max(0, it.count || 0);

    // 建立物品列表元素
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.type = 'consumable'; // 標記物品類型
    row.dataset.idx  = String(i);    // 標記索引位置

    // 生成物品HTML結構
    row.innerHTML = `
      <div class="item-thumb">${iconUrl ? `<img src="${iconUrl}" alt="${name}">` : ''}</div>
      <div class="item-main">
        <div class="item-title cons">
          <span class="item-name">${name}</span>
          <span class="meta-effect">${effHtml}</span>
          <span class="count-slot">×${cnt}</span>
        </div>
        <div class="item-sub">
          <span class="sub-left"></span>
          <span class="sub-right">販售價格 ${price}</span>
        </div>
      </div>
    `;
    box.appendChild(row);
  });
}

function renderWeapons(box, P){
  const items = P.bag.weapons || [];
  const url = (s)=> typeof s==='string' && /^https?:\/\//.test(s);

  items.forEach((w, i)=>{
    const def = ItemDB.getDef('weapons', w.id);
    const iconUrl = url(w.icon) ? w.icon : (url(def?.icon) ? def.icon : null);
    const name = w.name || def?.name || w.id;
    const r = (w.rarity || def?.rarity || '').trim();            // ★ 稀有度（普/精/稀/史/傳）
    const rCls = r ? `rarity-${r}` : '';
    const rBadge = r ? `<span class="rb rb-${r}" title="稀有度">${r}</span>` : '';

    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.type = 'weapon';
    row.dataset.idx = String(i);

    row.innerHTML = `
      <div class="item-thumb">${iconUrl?`<img src="${iconUrl}" alt="${name}">`:''}</div>
      <div class="item-main">
        <div class="item-title wep">
          <span class="badge-lv">LV.${w.level ?? def?.level ?? 1}</span>
          <span class="item-name ${rCls}">${rBadge}${String(name).replace(/^(普|精|稀|史|傳)的?/, '')}</span>
          <span class="right-meta">
            <span>+${w.plus || 0}</span>
            <span class="dur-chip">耐久 ${(w.dur?.cur ?? def?.durMax ?? 0)}/${(w.dur?.max ?? def?.durMax ?? 0)}</span>
          </span>
        </div>
        <div class="item-sub">
          <span class="sub-left">物理攻擊 ${(Array.isArray(w.dmg)?w.dmg[0]:(def?.dmg?.[0]??0))}-${(Array.isArray(w.dmg)?w.dmg[1]:(def?.dmg?.[1]??0))}</span>
          <span class="sub-right">販售價格 ${w.price ?? def?.price ?? 0}</span>
        </div>
      </div>
    `;
    box.appendChild(row);
  });
}

function renderMaterials(box, P){
  const items = P.bag.materials || [];
  const url = (s)=> typeof s==='string' && /^https?:\/\//.test(s);

  items.forEach((m, i)=>{
    const def = ItemDB.getDef('materials', m.id);
    const iconUrl = url(m.icon) ? m.icon : (url(def?.icon) ? def.icon : null);
    const cnt = Math.max(0, m.count || 0);
    const name = m.name || def?.name || m.id;
    const r = (m.rarity || def?.rarity || '').trim();            // ★ 稀有度（普/精/稀/史/傳）
    const rCls = r ? `rarity-${r}` : '';
    const rBadge = r ? `<span class="rb rb-${r}" title="稀有度">${r}</span>` : '';

    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.type = 'material';
    row.dataset.idx = String(i);

    row.innerHTML = `
      <div class="item-thumb">${iconUrl?`<img src="${iconUrl}" alt="${name}">`:''}</div>
      <div class="item-main">
        <div class="item-title">
          <span class="item-name ${rCls}">${rBadge}${name}</span>
          <span class="count-slot">×${cnt}</span>
        </div>
        <div class="item-sub">
          <span class="sub-left">${def?.desc ? def.desc : (r ? '稀有度 '+r : '')}</span>
          <span class="sub-right">${def?.price ? `販售價格 ${def.price}` : ''}</span>
        </div>
      </div>
    `;
    box.appendChild(row);
  });

  if (!items.length){
    const tip = document.createElement('div'); tip.className='item-sub';
    tip.textContent = '尚無材料';
    box.appendChild(tip);
  }
}

function renderOrnaments(box, P){
  // 僅使用「正式」存放的 P.bag.ornaments，避免索引錯亂
  const items = Array.isArray(P.bag && P.bag.ornaments) ? P.bag.ornaments : [];

  // 小工具
  function isUrl(s){ return typeof s==='string' && /^https?:\/\//.test(s); }

  if (!items.length){
    const tip = document.createElement('div'); tip.className='item-sub';
    tip.textContent = '尚無飾品';
    box.appendChild(tip);
    return;
  }

  for (var i=0;i<items.length;i++){
    var o = items[i] || {};
    // 允許 def 缺失（不因此整個不顯示）
    var def = ItemDB.getDef('ornaments', o.id)
          || ItemDB.getDef('earrings',  o.id)
          || ItemDB.getDef('rings',     o.id)
          || ItemDB.getDef('cloaks',    o.id)
          || ItemDB.getDef('armors',    o.id)
          || ItemDB.getDef('boots',     o.id)
          || ItemDB.getDef('medals',    o.id)
          || {};

    var name    = (o.name!=null ? o.name : (def.name!=null ? def.name : o.id));
    var iconUrl = isUrl(o.icon) ? o.icon : (isUrl(def.icon) ? def.icon : '');
    var bonus   = o.bonus || def.bonus || {};
    var effect  = o.effect || def.effect || {};
    var mp = 0, hp = 0;
    if (effect.mp) mp += effect.mp;
    if (effect.hp) hp += effect.hp;
    if (bonus['真元上限']) mp += bonus['真元上限'];
    if (bonus['氣血上限']) hp += bonus['氣血上限'];
    var subLeft  = [mp?('真元+'+mp):'', hp?('氣血+'+hp):''].filter(Boolean).join(' ');
    var price    = (o.price!=null ? o.price : (def.price||0));

    var row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.type = 'ornament';
    row.dataset.idx  = String(i); // 直接用 ornaments 的索引

    row.innerHTML =
      '<div class="item-thumb">' + (iconUrl?('<img src="'+iconUrl+'" alt="'+name+'">'):'') + '</div>' +
      '<div class="item-main">' +
        '<div class="item-title equip"><span class="item-name">'+ name +'</span></div>' +
        '<div class="item-sub">' +
          '<span class="sub-left">'+ subLeft +'</span>' +
          '<span class="sub-right">販售價格 ' + price + '</span>' +
        '</div>' +
      '</div>';

    box.appendChild(row);
  }
}


function renderHidden(box, P){
  const items = (P.bag && P.bag.hidden) ? P.bag.hidden : [];
  const url = function(s){ return typeof s==='string' && /^https?:\/\//.test(s); };

  items.forEach(function(h, i){
    const def = (ItemDB.getDef && ItemDB.getDef('hidden', h.id)) || {};
    const iconUrl = url(h.icon) ? h.icon : (url(def.icon) ? def.icon : null);
    const name = (h.name!=null ? h.name : (def.name!=null ? def.name : h.id));
    const cnt = Math.max(0, h.count || 0);
    var dmg = (h.effect && typeof h.effect.dmg==='number') ? h.effect.dmg
            : (def.effect && typeof def.effect.dmg==='number') ? def.effect.dmg : 0;
    var subLeft  = dmg ? ('傷害 ' + dmg) : (def.desc ? def.desc : '戰鬥中可使用以造成傷害');
    var subRight = '販售價格 ' + String(h.price!=null ? h.price : (def.price || 0));

    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.type = 'hidden';
    row.dataset.idx = String(i);
    row.innerHTML = `
      <div class="item-thumb">${iconUrl?`<img src="${iconUrl}" alt="${name}">`:''}</div>
      <div class="item-main">
        <div class="item-title cons">
          <span class="item-name">${name}</span>
          <span class="count-slot">×${cnt}</span>
        </div>
        <div class="item-sub">
          <span class="sub-left">${subLeft}</span>
          <span class="sub-right">${subRight}</span>
        </div>
      </div>
    `;
    box.appendChild(row);
  });

  if (!items.length){
    const tip = document.createElement('div'); tip.className='item-sub';
    tip.textContent = '尚無暗器';
    box.appendChild(tip);
  }
}

function openBagAction(type, idx){
  const P = state.player; if(!P) return;
  const m = qs('#bagAction'); if(!m) return;

  // 工具
  const isUrl = function(s){ return typeof s === 'string' && /^https?:\/\//.test(s); };
  const clampInt = function(n, lo, hi){ n = n|0; if(n<lo) n=lo; if(n>hi) n=hi; return n; };
  const esc = function(s){ s=String(s); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };

  // 把 bonus / effect 做成細節 HTML（所有物品共用）
  function buildDetailHTML(kind, it, def){
    var lines = [];

    function addPlus(label, v){
      if (typeof v !== 'number') return;
      if (!v) return;
      lines.push(label + (v>0 ? ('+'+v) : v));
    }
    function addRaw(label, v){
      if (typeof v !== 'number') return;
      if (!v && v!==0) return;
      lines.push(label + ' ' + v);
    }

    // 1) bonus（裝備/飾品用）
    var b = (it && it.bonus) ? it.bonus : (def && def.bonus ? def.bonus : null);
    if (b){
      for (var k in b){
        if(!Object.prototype.hasOwnProperty.call(b,k)) continue;
        var v = b[k];
        if (v===0 || v===null || v===undefined) continue;
        if (k==='真元上限') addPlus('真元上限', v);
        else if (k==='氣血上限') addPlus('氣血上限', v);
        else if (k==='物理攻擊') addPlus('物理攻擊', v);
        else if (k==='法術攻擊') addPlus('法術攻擊', v);
        else if (k==='物理防禦') addPlus('物理防禦', v);
        else if (k==='法術防禦') addPlus('法術防禦', v);
        else if (k==='命中') addPlus('命中', v);
        else if (k==='閃避') addPlus('閃避', v);
        else if (k==='暴擊') addPlus('暴擊', v);
        else if (k==='攻速') addPlus('攻速', v);
        else addPlus(k, v);
      }
    }

    // 2) effect（消耗品/暗器/部分飾品）
    var e = (it && it.effect) ? it.effect : (def && def.effect ? def.effect : null);
    if (e){
      addPlus('氣血', e.hp);
      addPlus('真元', e.mp);
      addPlus('物攻', e.atk);
      addPlus('法攻', e.matk);
      addPlus('防禦', e.def);
      addPlus('法防', e.mdef);
      addPlus('命中', (e.acc!=null?e.acc:e.hit));
      addPlus('閃避', (e.eva!=null?e.eva:e.evd));
      addPlus('暴擊', (e.crit!=null?e.crit:e.cri));
      addPlus('攻速', (e.aspd!=null?e.aspd:e.spd));
      addPlus('力', e.str);
      addPlus('體', e.vit);
      addPlus('悟', e.int);
      addPlus('敏', e.agi);
      addRaw('傷害', e.dmg);
    }

    // 3) 武器專屬資訊
    if (kind==='weapon'){
      var dmg = (it && it.dmg) ? it.dmg : (def && def.dmg ? def.dmg : null);
      var plus = (it && typeof it.plus==='number') ? it.plus : (def && def.plus ? def.plus : 0);
      if (dmg && typeof dmg.length==='number'){
        var dmin = dmg[0]||0, dmax = dmg[1]||0;
        lines.push('物攻 ' + dmin + '~' + dmax + (plus?(' +' + plus):''));
      }
      var durCur = (it && it.dur && typeof it.dur.cur==='number') ? it.dur.cur : (def && typeof def.durCur==='number' ? def.durCur : null);
      var durMax = (it && it.dur && typeof it.dur.max==='number') ? it.dur.max : (def && typeof def.durMax==='number' ? def.durMax : null);
      if (durMax!==null && durMax!==undefined){
        lines.push('耐久 ' + (durCur!==null && durCur!==undefined ? (durCur + '/' + durMax) : durMax));
      }
    }

    // 4) 材料描述
    if (kind==='material' && def && def.desc){
      lines.push('用途：' + def.desc);
    }

    // 5) 暗器描述
    if (kind==='hidden' && def && def.desc){
      lines.push('說明：' + def.desc);
    }

    if (!lines.length) lines.push('無額外屬性');
    var html = '';
    for (var i=0;i<lines.length;i++){
      html += '<div class="line">' + esc(lines[i]) + '</div>';
    }
    return html;
  }

  let name='', subRight='', iconUrl=null, btnsHtml='';

  if (type === 'consumable') {
    const it  = (P.bag.consumables || [])[idx]; if (!it) return;
    const def = ItemDB.getDef('consumables', it.id) || {};
    name     = it.name || def.name || it.id;

    const effHp  = (it.effect && typeof it.effect.hp==='number') ? it.effect.hp
                   : (def.effect && typeof def.effect.hp==='number') ? def.effect.hp : 0;
    const effTxt = effHp ? ('<span class="badge hp">氣血+' + effHp + '</span>') : '';
    subRight = '販售價格 ' + String( (it.price!=null?it.price:(def.price||0)) );
    iconUrl  = isUrl(it.icon) ? it.icon : (isUrl(def.icon) ? def.icon : null);
    const cnt = clampInt(it.count ?? 0, 0, 9999);

    qs('#actTop').className = 'item-title cons';
    qs('#actTop').innerHTML = ''
      + '<span class="item-name">' + esc(name) + '</span>'
      + '<span class="meta-effect">' + effTxt + '</span>'
      + '<span class="count-slot">×' + cnt + '</span>';

    qs('#actLeft').innerHTML   = buildDetailHTML('consumable', it, def);
    qs('#actRight').textContent = subRight;

    btnsHtml = ''
      + '<button class="opx primary" data-op="use"   data-type="consumable" data-idx="'+idx+'">使用</button>'
      + '<button class="opx"         data-op="sell"  data-type="consumable" data-idx="'+idx+'">販賣</button>'
      + '<button class="opx"         data-op="throw" data-type="consumable" data-idx="'+idx+'">丟棄</button>';



  } else if (type === 'material') {
    const mat = (P.bag.materials || [])[idx]; if (!mat) return;
    const def = ItemDB.getDef('materials', mat.id) || {};
    name     = mat.name || def.name || mat.id;
    iconUrl  = isUrl(mat.icon) ? mat.icon : (isUrl(def.icon) ? def.icon : null);
    const cnt = clampInt(mat.count ?? 0, 0, 9999);
    subRight = def.price ? ('販售價格 ' + def.price) : '';

    qs('#actTop').className = 'item-title';
    qs('#actTop').innerHTML = ''
      + '<span class="item-name">' + esc(name) + '</span>'
      + '<span class="count-slot">×' + cnt + '</span>';

    qs('#actLeft').innerHTML   = buildDetailHTML('material', mat, def);
    qs('#actRight').textContent = subRight;

    btnsHtml = ''
      + '<button class="opx"         data-op="sell"  data-type="material" data-idx="'+idx+'">販賣</button>'
      + '<button class="opx"         data-op="throw" data-type="material" data-idx="'+idx+'">丟棄</button>';



  } else if (type === 'weapon') {
    const w   = (P.bag.weapons || [])[idx]; if (!w) return;
    const def = ItemDB.getDef('weapons', w.id) || {};
    name     = w.name || def.name || w.id;
    const dmg = Array.isArray(w.dmg) ? w.dmg : (def.dmg || [0,0]);
    const dmin = dmg[0]||0, dmax = dmg[1]||0;
    const plus = (typeof w.plus==='number') ? w.plus : (def.plus||0);
    const durCur = (w.dur && typeof w.dur.cur==='number') ? w.dur.cur : (def.durCur||0);
    const durMax = (w.dur && typeof w.dur.max==='number') ? w.dur.max : (def.durMax||0);
    iconUrl  = isUrl(w.icon) ? w.icon : (isUrl(def.icon) ? def.icon : null);
    subRight = '販售價格 ' + String(w.price ?? def.price ?? 0);

    qs('#actTop').className = 'item-title wep';
    qs('#actTop').innerHTML = ''
      + '<span class="item-name">' + esc(String(name).replace(/^(普|精|稀|史|傳)的?/,'') ) + '</span>'
      + '<span class="meta-effect">' + (dmin||dmax ? ('<span class="badge atk">' + dmin + '~' + dmax + (plus?(' +' + plus):'') + '</span>') : '') + '</span>'
      + '<span class="dur-chip">' + (durMax ? (durCur + '/' + durMax) : '') + '</span>';

    qs('#actLeft').innerHTML   = buildDetailHTML('weapon', w, def);
    qs('#actRight').textContent = subRight;


  // ✅ 直接呼叫，避免事件代理沒接上
  btnsHtml = ''
    + '<button class="opx primary" onclick="bagEquipWeapon('+idx+')" data-type="weapon" data-idx="'+idx+'">裝備</button>'
    + '<button class="opx"         data-op="sell"  data-type="weapon" data-idx="'+idx+'">販賣</button>'
    + '<button class="opx"         data-op="throw" data-type="weapon" data-idx="'+idx+'">丟棄</button>';


  } else if (type === 'ornament') {
    const o = (P.bag.ornaments || [])[idx]; if(!o) return;
    // 依你的清單渲染邏輯一樣走多類別找定義，避免因分類不同取不到 def
    const def = ItemDB.getDef('ornaments', o.id)
            || ItemDB.getDef('earrings', o.id)
            || ItemDB.getDef('cloaks',   o.id)
            || ItemDB.getDef('armors',   o.id)
            || ItemDB.getDef('boots',    o.id)
            || ItemDB.getDef('medals',   o.id)
            || {};
    name    = o.name || def.name || o.id;
    iconUrl = isUrl(o.icon) ? o.icon : (isUrl(def.icon) ? def.icon : null);
    subRight = '販售價格 ' + String(o.price != null ? o.price : (def.price || 0));

    qs('#actTop').className = 'item-title equip';
    qs('#actTop').innerHTML = ''
      + '<span class="item-name">' + esc(name) + '</span>';

    // 顯示完整屬性
    qs('#actLeft').innerHTML   = buildDetailHTML('ornament', o, def);
    qs('#actRight').textContent = subRight;

btnsHtml = ''
  + '<button class="opx primary" onclick="bagEquipOrnament('+idx+')" data-type="ornament" data-idx="'+idx+'">裝備</button>'
  + '<button class="opx"         data-op="sell"  data-type="ornament" data-idx="'+idx+'">販賣</button>'
  + '<button class="opx"         data-op="throw" data-type="ornament" data-idx="'+idx+'">丟棄</button>';


  } else if (type === 'hidden') {
    const h  = (P.bag.hidden || [])[idx]; if (!h) return;
    const def = ItemDB.getDef('hidden', h.id) || {};
    name     = h.name || def.name || h.id;
    const cnt = clampInt(h.count ?? 0, 0, 9999);
    iconUrl  = isUrl(h.icon) ? h.icon : (isUrl(def.icon) ? def.icon : null);
    subRight = def.price ? ('販售價格 ' + def.price) : '';

    qs('#actTop').className = 'item-title cons';
    qs('#actTop').innerHTML = ''
      + '<span class="item-name">' + esc(name) + '</span>'
      + '<span class="count-slot">×' + cnt + '</span>';

    qs('#actLeft').innerHTML   = buildDetailHTML('hidden', h, def);
    qs('#actRight').textContent = subRight;

    btnsHtml = ''
      + '<button class="opx" data-op="sell"  data-type="hidden" data-idx="'+idx+'">販賣</button>'
      + '<button class="opx" data-op="throw" data-type="hidden" data-idx="'+idx+'">丟棄</button>';

  } else {
    return;
  }

  qs('#actIcon').innerHTML = iconUrl ? ('<img src="'+esc(iconUrl)+'" alt="">') : '';
  qs('#actBtns').innerHTML = btnsHtml;

  m.classList.add('show');
  m.setAttribute('aria-hidden', 'false');
}

function closeBagAction(){ const m = qs('#bagAction'); if(!m) return; m.classList.remove('show'); m.setAttribute('aria-hidden','true'); qs('#actBtns').innerHTML = ''; }

function openSellPanel(type, idx){
  var P = state.player; if(!P) return;
  var name = '', unitPrice = 0, max = 1;

  // 根據物品類型取得物品資訊和價格
  if (type === 'consumable') {
    var it = (P.bag && P.bag.consumables) ? P.bag.consumables[idx] : null; if(!it) return;
    var def = ItemDB.getDef('consumables', it.id) || {};
    name = it.name || def.name || it.id;
    unitPrice = (it.price != null ? it.price : (def.price || 0));
    max = it.count || 0;
  } else if (type === 'material') {
    var m = (P.bag && P.bag.materials) ? P.bag.materials[idx] : null; if(!m) return;
    var d = ItemDB.getDef('materials', m.id) || {};
    name = m.name || d.name || m.id;
    unitPrice = (d.price || 0);
    max = m.count || 0;
  } else if (type === 'hidden') {
    var h = (P.bag && P.bag.hidden) ? P.bag.hidden[idx] : null; if(!h) return;
    var dh = ItemDB.getDef('hidden', h.id) || {};
    name = h.name || dh.name || h.id;
    unitPrice = (dh.price || 0);
    max = h.count || 0;
  } else if (type === 'weapon') {
    var w = (P.bag && P.bag.weapons) ? P.bag.weapons[idx] : null; if(!w) return;
    var dw = ItemDB.getDef('weapons', w.id) || {};
    name = w.name || dw.name || w.id;
    unitPrice = (w.price != null ? w.price : (dw.price || 0));
    max = 1; // 武器只能販賣一件
  } else {
    return;
  }

  // 生成販賣面板HTML
  var btns = ''
    + '<div id="sellBox" style="display:grid;gap:6px;">'
    +   '<div style="text-align:center;font-weight:700;">販賣數量</div>'
    +   '<input id="sellQtyMax" type="hidden" value="'+max+'">' // 隱藏欄位記錄最大數量
    +   '<div style="display:flex;gap:8px;align-items:center;justify-content:center;">'
    +     '<input id="sellQty" type="number" min="1" max="'+max+'" value="'+(max>0?1:0)+'" style="width:100px;text-align:center;">' // 數量輸入框
    +   '</div>'
    +   '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">' // 快速選擇按鈕
    +     '<button class="opx" data-sell-quick="1">1</button>'
    +     '<button class="opx" data-sell-quick="5">5</button>'
    +     '<button class="opx" data-sell-quick="10">10</button>'
    +     '<button class="opx" data-sell-quick="100">100</button>'
    +     '<button class="opx" data-sell-quick="max">最大</button>'
    +   '</div>'
    +   '<div class="ops" style="justify-content:center;">' // 操作按鈕
    +     '<button class="opx" data-op="cancel-sell" data-type="'+type+'" data-idx="'+idx+'">取消</button>'
    +     '<button class="opx primary" data-op="confirm-sell" data-type="'+type+'" data-idx="'+idx+'">確定販賣</button>'
    +   '</div>'
    +   '<div id="sellHint" style="text-align:center;font-size:12px;color:#e2e8f0;">單價 '+unitPrice+'，最多 '+max+' 件</div>' // 價格提示
    + '</div>';

  // 將面板HTML插入到操作按鈕容器
  var box = qs('#actBtns'); if(box) box.innerHTML = btns;
}

function bagSellHidden(i){
  var P = state.player; if(!P) return;
  var h = (P.bag && P.bag.hidden) ? P.bag.hidden[i] : null; if(!h) return;
  
  // 取得暗器定義和價格資訊
  var def = ItemDB.getDef('hidden', h.id) || {};
  var price = (def.price || 0);
  var max = h.count || 0;
  
  // 從販賣面板取得要賣出的數量
  var qtyEl = document.getElementById('sellQty');
  var qty = qtyEl ? parseInt(qtyEl.value,10) : max;
  if (!qty || qty < 1 || qty > max) return;
  
  // 增加玩家貨幣（靈石）
  P.currencies = P.currencies || { stone:0, diamond:0 };
  P.currencies.stone += qty * price;
  
  // 減少物品數量，如果用完就從背包移除
  h.count = (h.count||0) - qty;
  if (h.count <= 0) { P.bag.hidden.splice(i,1); }
  
  // 儲存並重新渲染
  if (window.Auth && Auth.saveCharacter) Auth.saveCharacter(P);
  render(P); renderBag('hidden');
}

function seedBagIfMissing(){
  const P = state.player; if(!P) return;
  
  // 如果沒有背包就建立預設背包
  if (!P.bag) { P.bag = ItemDB.getDefaultBag(); return; }
  
  // 確保各個物品分類都是陣列
  P.bag.consumables = Array.isArray(P.bag.consumables) ? P.bag.consumables : [];
  P.bag.weapons     = Array.isArray(P.bag.weapons)     ? P.bag.weapons     : [];
  P.bag.ornaments   = Array.isArray(P.bag.ornaments)   ? P.bag.ornaments   : [];
  P.bag.materials   = Array.isArray(P.bag.materials)   ? P.bag.materials   : [];
  P.bag.hidden      = Array.isArray(P.bag.hidden)      ? P.bag.hidden      : [];
}

function bagSellConsumable(i){
  var P = state.player; 
  var it = P.bag.consumables[i]; 
  if(!it) return;
  
  // ✅ 正確取得價格：優先用物品實例價格，再用定義價格
  var def = ItemDB.getDef('consumables', it.id) || {};
  var unitPrice = (it.price != null ? it.price : (def.price || 0));
  
  // 取得最大可販賣數量
  var max = it.count||0;
  // 從販賣面板取得要販賣的數量
  var qtyEl = document.getElementById('sellQty');
  var qty = qtyEl ? parseInt(qtyEl.value,10) : max;
  // 驗證數量範圍
  if (!qty || qty<1 || qty>max) return;
  
  // 增加玩家靈石收入
  P.currencies = P.currencies || {stone:0, diamond:0};
  P.currencies.stone += qty * unitPrice;  // ✅ 使用正確的價格
  
  // 減少物品數量
  it.count -= qty;
  // 如果賣完就從背包移除
  if (it.count <= 0) P.bag.consumables.splice(i,1);
  
  // 儲存並重新渲染
  if (window.Auth && Auth.saveCharacter) Auth.saveCharacter(P);
  render(P); renderBag('consumable');
  
  // ✅ 新增：顯示販賣成功訊息
  if (window.Game && Game.log) {
    Game.log(`販賣 ${it.name || def.name || '物品'} ×${qty}，獲得 ${qty * unitPrice} 靈石`, 'ok');
  }
}

function bagThrowConsumable(i){
  const P = state.player; 
  const it = P.bag.consumables[i]; 
  if(!it) return;
  
  // 取得最大可丟棄數量
  const max = it.count||0;
  // 彈出對話框讓玩家輸入丟棄數量
  const qty = +prompt(`輸入丟棄數量（1-${max}）`, String(max));
  // 驗證輸入的數量
  if (!qty || qty<1 || qty>max) return;
  
  // 減少物品數量（無任何補償）
  it.count -= qty;
  // 如果丟完就從背包移除
  if (it.count <= 0) P.bag.consumables.splice(i,1);
  
  // 儲存並重新渲染
  if (window.Auth && Auth.saveCharacter) Auth.saveCharacter(P);
  render(P); renderBag('consumable');
}

function bagEquipWeapon(i){
  const P = state.player; if(!P) return;
  P.bag = P.bag || {}; 
  P.bag.weapons = Array.isArray(P.bag.weapons) ? P.bag.weapons : [];

  const w = P.bag.weapons[i]; 
  if(!w) return;

  // 先記住舊武器（避免被覆蓋後消失）
  const prev = (P.equip && P.equip.weapon) ? P.equip.weapon : null;

  // 裝備新武器（有 Equip 模組就用它，否則直接寫入）
  if (window.Equip && Equip.equipWeapon) {
    Equip.equipWeapon(w);
  } else {
    P.equip = P.equip || {};
    try{
      P.equip.weapon = JSON.parse(JSON.stringify(w));
    }catch(_){
      P.equip.weapon = w;
    }
    if (typeof renderDerived === 'function') renderDerived();
  }

  // 從背包移除已裝備的那把
  P.bag.weapons.splice(i, 1);

  // 若原本有裝備，丟回背包前端避免遺失
  if (prev){
    try{
      P.bag.weapons.unshift(JSON.parse(JSON.stringify(prev)));
    }catch(_){
      P.bag.weapons.unshift(prev);
    }
  }

  // 存檔 + 重繪（立刻看到變化）
  if (window.Auth && Auth.saveCharacter) Auth.saveCharacter(P);
  if (typeof render === 'function') render(P); 
  renderBag('weapon');

  // 關閉物品操作面板，避免誤以為沒更新
  if (typeof closeBagAction === 'function') closeBagAction();

  // 安全呼叫日誌（避免未定義時噴錯）
  if (window.Game && Game.log) { Game.log('已裝備：' + (w.name || '武器'), 'ok'); }
}


function bagEquipOrnament(i){
  const P = state.player; if(!P) return;
  P.bag = P.bag || {};
  P.bag.ornaments = Array.isArray(P.bag.ornaments) ? P.bag.ornaments : [];

  const o = P.bag.ornaments[i];
  if(!o) return;

  // 判斷種類（優先用定義；否則預設當戒指）
  var kind = null;
  if (window.ItemDB && ItemDB.getDef){
    if (ItemDB.getDef('earrings', o.id)) kind = 'earrings';
    else if (ItemDB.getDef('rings',  o.id)) kind = 'rings';
    else if (ItemDB.getDef('cloaks', o.id)) kind = 'cloak';
    else if (ItemDB.getDef('armors', o.id)) kind = 'armor';
    else if (ItemDB.getDef('boots',  o.id)) kind = 'shoes';
    else if (ItemDB.getDef('ornaments', o.id)) kind = 'rings';
    else kind = 'rings';
  } else {
    kind = 'rings';
  }

  // 記住舊件（雙槽滿→記第1格；單槽記當前）
  var prev = null;
  if (kind==='earrings' || kind==='rings'){
    var arr = (P.equip && P.equip[kind]) ? P.equip[kind] : [];
    var filled = (arr && arr[0] && arr[1]);
    if (filled) prev = arr[0] || null;
  } else {
    prev = (P.equip && P.equip[kind]) ? P.equip[kind] : null;
  }

  // 裝備（優先走 Equip 模組）
  var usedEquipModule = false;
  if (window.Equip && Equip.equipOrnament){
    usedEquipModule = !!Equip.equipOrnament(o);
  } else {
    P.equip = P.equip || {};
    if (kind==='earrings' || kind==='rings'){
      var arr2 = Array.isArray(P.equip[kind]) ? P.equip[kind] : [null,null];
      var pos = -1;
      for (var j=0;j<2;j++){ if (!arr2[j]) { pos=j; break; } }
      if (pos===-1){ prev = arr2[0] || prev; arr2[0] = o; } else { arr2[pos] = o; }
      P.equip[kind] = arr2;
    } else {
      P.equip[kind] = o;
    }
    if (typeof renderDerived === 'function') renderDerived();
  }

  // 從背包移除剛裝備的
  P.bag.ornaments.splice(i,1);

  // 若 Equip 模組已經把「被換下的舊件」丟回袋子，這裡就不要再丟一次（避免重複）
  if (!usedEquipModule && prev){
    try{ P.bag.ornaments.unshift(JSON.parse(JSON.stringify(prev))); }
    catch(_){ P.bag.ornaments.unshift(prev); }
  }

  // 存檔 + 重繪（立刻看到變化）
  if (window.Auth && Auth.saveCharacter) Auth.saveCharacter(P);
  if (typeof render === 'function') render(P);
  renderBag('ornament');

  // 關閉物品操作面板，避免誤以為沒更新
  if (typeof closeBagAction === 'function') closeBagAction();

  if (window.Game && Game.log) { Game.log('已裝備：' + (o.name || o.id || '飾品'), 'ok'); }
}




function bagThrowMaterial(i){
    const P = state.player; const it = P.bag.materials?.[i]; if(!it) return;
    const max = it.count || 0;
    const qty = +prompt(`輸入丟棄數量（1-${max}）`, String(max));
    if (!qty || qty < 1 || qty > max) return;

    it.count -= qty;
    if (it.count <= 0) P.bag.materials.splice(i, 1);

    if (window.Auth && Auth.saveCharacter) Auth.saveCharacter(P);
    render(P); renderBag('material');
  }
