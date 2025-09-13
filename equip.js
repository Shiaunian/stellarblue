/* equip.js — 裝備欄獨立模組 */
(function(){
  let api = {                     // 從外部注入的方法
    getPlayer: null,              // () => player 物件
    save: ()=>{},                 // () => 存檔
    recalc: ()=>{},               // () => 重新渲染能力值/畫面
    log: (t)=>console.log(t),
  };

  const el = (html)=>{ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; };

  function mount(opts){
    api = Object.assign(api, opts||{});

    /* --- CSS（僅此模組使用） --- */
    if(!document.getElementById('eq-css')){
      const s = document.createElement('style'); s.id='eq-css';
      s.textContent = `
#eqModal{position:fixed; inset:0; display:none; place-items:center; z-index:999}
#eqModal.show{display:grid;}
#eqModal .mask{position:absolute; inset:0; background:rgba(0,0,0,.5); backdrop-filter: blur(2px);}
#eqModal .sheet{position:relative; width:min(420px, 100svw); border-radius:16px; overflow:hidden;
  background:var(--panel-2); border:1px solid rgba(255,255,255,.12); box-shadow: var(--shadow); color:var(--text);}
#eqModal .sec-title{background:rgba(255,255,255,.06); border-bottom:1px solid rgba(255,255,255,.08);
  text-align:center; font-weight:900; letter-spacing:4px; padding:8px 12px; position:relative;}
#eqModal .close{position:absolute; right:10px; top:50%; transform:translateY(-50%);
  width:24px; height:24px; border-radius:999px; display:grid; place-items:center;
  background:#ef4444; color:#fff; font-weight:900; cursor:pointer; user-select:none;}
#eqModal .body{ padding:12px; display:grid; gap:12px; }
.eq-wrap{padding:4px; display:grid; gap:10px; max-height:60vh; overflow:auto;}
.eq-grid{
  display:grid;
  grid-template-columns: 100px repeat(4, 60px); /* 左邊加角色外觀欄位 */
  column-gap:8px;
  row-gap:8px;
  justify-content:center;
  align-items:start;
}
.eq-char{
  grid-row: 1 / span 3;   /* 高度跨 3 行 */
  width:100px;
  aspect-ratio:3/4;       /* 稍長矩形，類似立繪比例 */
  border-radius:12px;
  background:rgba(255,255,255,.05);
  border:2px solid rgba(255,255,255,.15);
  display:flex; align-items:center; justify-content:center;
  color:#9ca3af; font-weight:700; font-size:12px;
  overflow:hidden;
}
.eq-char img{ width:100%; height:100%; object-fit:cover; display:block; }

.eq-slot{
  aspect-ratio: 1 / 1;
  width: 80%;
  max-width: 60px;
  border-radius:10px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.12);
  display:grid; place-items:center;
  color:#cbd5e1; font-weight:800; letter-spacing:2px; cursor:pointer; user-select:none;
  position:relative; overflow:hidden;
}

.eq-slot .tag{ position:absolute; left:4px; top:4px; font-size:9px; opacity:.8; }
#eqModal img{
  width:100%; height:100%;       /* ✅ 圖示也跟著縮小 */
  object-fit:contain;
  display:block;
  background:transparent;
}


.eq-slot.empty{
  background:rgba(255,255,255,.04);
  color:#9aa3b2;
  font-size:10px;    /* ✅ 縮小未裝備顯示的文字 */
}


.eq-row{ display:grid; grid-template-columns:1fr auto; align-items:center; gap:8px; }
.eq-note{ font-size:12px; color:#e879f9; font-weight:900; white-space:nowrap; }
.eq-medals{ display:flex; justify-content:center; gap:10px; padding-top:6px; }
.eq-hole{width:40px; height:40px; border-radius:50%; border:2px dashed rgba(255,255,255,2);
  display:grid; place-items:center; color:#94a3b8; cursor:pointer; overflow:hidden;}
`; document.head.appendChild(s);
    }

    /* --- HTML（Modal骨架） --- */
    if(!document.getElementById('eqModal')){
      const node = el(`
<div id="eqModal" aria-hidden="true">
  <div class="mask" data-eq-close="1"></div>
  <div class="sheet" role="dialog" aria-labelledby="eqTitle">
    <div class="sec-title" id="eqTitle">
      裝備欄
      <div class="close" data-eq-close="1">✕</div>
    </div>
    <div class="body eq-wrap">
      <div class="eq-row">
        <div class="sec-title" style="letter-spacing:2px;">部位</div>
      </div>
      <div class="eq-grid" id="eqGrid"></div>
      <div class="sec-title" style="letter-spacing:2px;">勳章（最多 5、不可重複）</div>
      <div class="eq-medals" id="eqMedals"></div>
    </div>
  </div>
</div>`);
      document.body.appendChild(node);

    const modal = document.getElementById('eqModal');
    if (modal) {
      modal.addEventListener('click', onClick);
    }
      document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
    }

    render();
  }

  function open(){ const m = document.getElementById('eqModal'); if(!m) return; render(); m.classList.add('show'); m.setAttribute('aria-hidden','false'); }
  function close(){ const m = document.getElementById('eqModal'); if(!m) return; m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }

function onClick(e){
  const closeBtn = e.target.closest('[data-eq-close]'); if (closeBtn){ close(); return; }
  const slot = e.target.closest('.eq-slot, .eq-hole, .eq-char'); if(!slot) return;

  const P = api.getPlayer && api.getPlayer(); if(!P) return;
  const part = slot.dataset.part; const idx = +slot.dataset.idx || 0;

  // 將卸下的裝備放回背包
  const backToBag = (kind, obj) => {
    if (!obj) return;
    P.bag = P.bag || {};
    if (kind === 'weapon') {
      P.bag.weapons = Array.isArray(P.bag.weapons) ? P.bag.weapons : [];
      try { P.bag.weapons.unshift(JSON.parse(JSON.stringify(obj))); }
      catch(_) { P.bag.weapons.unshift(obj); }
    } else if (kind === 'orn') {
      P.bag.ornaments = Array.isArray(P.bag.ornaments) ? P.bag.ornaments : [];
      try { P.bag.ornaments.unshift(JSON.parse(JSON.stringify(obj))); }
      catch(_) { P.bag.ornaments.unshift(obj); }
    } else if (kind === 'medal') {
      P.bag.hidden = Array.isArray(P.bag.hidden) ? P.bag.hidden : [];
      try { P.bag.hidden.unshift(JSON.parse(JSON.stringify(obj))); }
      catch(_) { P.bag.hidden.unshift(obj); }
    } else if (kind === 'appearance') {
      P.bag.appearances = Array.isArray(P.bag.appearances) ? P.bag.appearances : [];
      const id = obj && obj.id;
      if (!id) return;
      // 找同 id，加一；沒有就新增 {id, count:1}
      var found = false;
      for (var i=0;i<P.bag.appearances.length;i++){
        var it = P.bag.appearances[i];
        if (it && it.id === id){
          it.count = (it.count||0) + 1;
          found = true;
          break;
        }
      }
      if (!found){
        P.bag.appearances.unshift({ id:id, count:1 });
      }
      // 清理：移除所有 count<=0 的項目（確保 0 代表沒有）
      for (var j=P.bag.appearances.length-1;j>=0;j--){
        if (!P.bag.appearances[j] || (P.bag.appearances[j].count||0)<=0){
          P.bag.appearances.splice(j,1);
        }
      }
    }

  };

  // 點擊 = 卸下
  if (part === 'weapon') {
    if (P.equip?.weapon) {
      backToBag('weapon', P.equip.weapon);
      P.equip.weapon = null;
      api.log('已卸下武器 → 回到儲物袋');
    }
  }
  else if (part === 'earrings' || part === 'rings') {
    const arr = P.equip?.[part] || [];
    const cur = arr[idx];
    if (cur) {
      backToBag('orn', cur);
      arr[idx] = null;
      api.log(`已卸下${part === 'earrings' ? '耳環' : '戒指'} → 回到儲物袋`);
    }
  }
  else if (part === 'cloak' || part === 'armor' || part === 'shoes') {
    const cur = P.equip?.[part];
    if (cur) {
      backToBag('orn', cur);
      P.equip[part] = null;
      api.log('已卸下 → 回到儲物袋');
    }
  }
  // ★ 新增：角色外觀（character）— 卸下時回收至外觀背包
else if (part === 'character') {
  const cur = P.equip && P.equip.character;
  if (cur){
    backToBag('appearance', cur);
    P.equip.character = null;

    // 🆕 卸下外觀時，同步移除所有外觀技能 + 同步地圖技能清單 + 重算畫面
    if (window.Appearance && Appearance.removeAppearanceSkills) {
      Appearance.removeAppearanceSkills(P);
      Appearance.syncSkillsPanel && Appearance.syncSkillsPanel();
    }

    api.log('已卸下角色外觀 → 回到外觀背包');
  }
}

  api.save(); render(); api.recalc();
}



  function render(){
    const P = api.getPlayer && api.getPlayer(); if(!P) return;
    P.equip = P.equip || { weapon:null, earrings:[null,null], rings:[null,null], cloak:null, armor:null, shoes:null, medals:[null,null,null,null,null]};

    const grid = document.getElementById('eqGrid'); const bar = document.getElementById('eqMedals');
    if(!grid || !bar) return;

    const slots = [
      { key:'weapon',  name:'武器',  max:1 },
      { key:'earrings',name:'耳環',  max:2 },
      { key:'rings',   name:'戒指',  max:2 },
      { key:'cloak',   name:'披風',  max:1 },
      { key:'armor',   name:'衣服',  max:1 },
      { key:'shoes',   name:'鞋子',  max:1 },
    ];

    const norm=(it, kind)=>{
      if(!it) return null;
      if(typeof it==='string'){
        const group = kind==='weapon' ? 'weapons' : (kind==='medal' ? 'medals' : kind);
        const d = window.ItemDB && ItemDB.getDef(group, it);
        return d ? {...d} : null;
      }
      return it;
    };

    grid.innerHTML='';

    // 新增角色外觀框
    const charDiv = document.createElement('div');
    charDiv.className = 'eq-char';
    charDiv.dataset.part = 'character';
    charDiv.innerHTML = P.equip?.character?.icon
      ? `<img src="${P.equip.character.icon}" alt="角色外觀">`
      : '<span>外觀</span>';
    grid.appendChild(charDiv);

    // 原本的裝備欄位
    for(const s of slots){
      const cur = P.equip[s.key];
      const arr = (s.max===1) ? [cur] : (cur || []);
      for(let i=0;i<s.max;i++){
        const it = norm(arr[i], s.key);
        const div = document.createElement('div');
        div.className = 'eq-slot' + (it? '' : ' empty');
        div.dataset.part=s.key; div.dataset.idx=String(i);
        div.title = it ? (it.name || s.name) : s.name;
        div.innerHTML = it ? `<span class="tag">${s.name}</span>${it.icon?`<img src="${it.icon}" alt="">`:''}` : `<span>${s.name}</span>`;
        grid.appendChild(div);
      }
    }


    bar.innerHTML='';
    const meds = P.equip.medals || [null,null,null,null,null];
    for(let i=0;i<5;i++){
      const m = norm(meds[i],'medal');
      const div = document.createElement('div'); div.className='eq-hole'; div.dataset.part='medals'; div.dataset.idx=String(i);
      div.title = m ? (m.name||'勳章') : '勳章';
      div.innerHTML = m ? (m.icon?`<img src="${m.icon}" alt="">`:'勳章') : '勳章';
      bar.appendChild(div);
    }
  }

  /* 對外：從其它地方裝上 */
  function equipWeapon(w){
  const P = api.getPlayer && api.getPlayer(); 
  if(!P) return false;
  P.equip = P.equip || {};
  try{
    P.equip.weapon = JSON.parse(JSON.stringify(w));
  }catch(_){
    P.equip.weapon = w;
  }
  api.save(); 
  render(); 
  api.recalc(); 
  return true;
}


  function equipMedal(m){
    const P = api.getPlayer && api.getPlayer(); if(!P) return false;
    P.equip = P.equip || {};
    const arr = P.equip.medals || (P.equip.medals=[null,null,null,null,null]);
    if (!m) return false;
    for (var i=0;i<arr.length;i++){ if(arr[i] && arr[i].id===m.id){ api.log('不可裝備相同勳章'); return false; } }
    var pos = -1; for (var j=0;j<arr.length;j++){ if(!arr[j]){ pos=j; break; } }
    if (pos===-1){ api.log('勳章已達上限'); return false; }
    arr[pos] = JSON.parse(JSON.stringify(m));
    api.save(); render(); api.recalc(); return true;
  }

// ★新增：飾品（戒指/耳飾/披風/護甲/鞋）裝備（修正：雙槽正規化）
  function equipOrnament(o){
    const P = api.getPlayer && api.getPlayer(); if(!P || !o) return false;
    P.equip = P.equip || {};

    // 判斷種類（依 id 從各類別資料表查）
    var kind = null;
    if (window.ItemDB && ItemDB.getDef){
      if (ItemDB.getDef('ornaments', o.id)) kind = 'rings'; // ornaments 視為「戒指」分類
      else if (ItemDB.getDef('rings',    o.id)) kind = 'rings';
      else if (ItemDB.getDef('earrings', o.id)) kind = 'earrings';
      else if (ItemDB.getDef('cloaks',   o.id)) kind = 'cloak';
      else if (ItemDB.getDef('armors',   o.id)) kind = 'armor';
      else if (ItemDB.getDef('boots',    o.id)) kind = 'shoes';
      else if (ItemDB.getDef('medals',   o.id)) return equipMedal(o); // 勳章沿用上面
    }
    if (!kind){ api.log('無法辨識飾品種類'); return false; }

    var copy = JSON.parse(JSON.stringify(o));

    if (kind==='rings' || kind==='earrings'){
      // ★ 關鍵：舊存檔若不是陣列，可能是單一值（字串或物件）→ 保留到第 1 槽
      var arr = P.equip[kind];
      if (!Array.isArray(arr)) {
        var prev = arr || null;
        arr = [null, null];
        if (prev){
          try { arr[0] = (typeof prev === 'string') ? prev : JSON.parse(JSON.stringify(prev)); }
          catch(_){ arr[0] = prev; }
        }
      } else {
        // 將缺少的索引補成 null，並固定長度為 2
        if (typeof arr[0] === 'undefined') arr[0] = null;
        if (typeof arr[1] === 'undefined') arr[1] = null;
        if (arr.length > 2) arr.length = 2;
      }
      P.equip[kind] = arr;

      // 不允許同 ID 重複裝備（同時支援舊格式字串與新格式物件）
      for (var i=0;i<2;i++){
        if (arr[i] && (
             (typeof arr[i] === 'string' && arr[i] === copy.id) ||
             (typeof arr[i] === 'object' && arr[i].id === copy.id)
           )){
          api.log('不可重複裝備相同飾品');
          return false;
        }
      }

      // 先找空位；若無空位才覆蓋第 1 格
      var pos = -1;
      for (var j=0;j<2;j++){
        if (!arr[j]) { pos = j; break; }
      }
      if (pos === -1) { arr[0] = copy; } else { arr[pos] = copy; }

    } else { // cloak / armor / shoes 單格
      P.equip[kind] = copy;
    }

    api.save(); render(); api.recalc();
    return true;
  }



/* 對外：回傳所有裝備帶來的加成（讓主程式加到能力值） */
/* 對外：回傳裝備加成（共用核心演算法） */
// --- 核心：計算「指定玩家」的裝備加成 ---
function _calcBonusesFor(P){
  if(!P) return {};
  var sum = {};

  function convert(raw){
    if(!raw) return null;
    var out = {};

    for (var k in raw){
      if(!Object.prototype.hasOwnProperty.call(raw,k)) continue;
      var v = raw[k] || 0;

      // --- 直接對應到中文面板鍵（「最終面板」就該長這些） ---
      if (k === 'hp')        { out['氣血上限']   = (out['氣血上限']||0)   + v; }
      else if (k === 'mp')   { out['真元上限']   = (out['真元上限']||0)   + v; }
      else if (k === 'def')  { out['物理防禦']   = (out['物理防禦']||0)   + v; }
      else if (k === 'mdef') { out['法術防禦']   = (out['法術防禦']||0)   + v; }
      else if (k === 'atk')  { out['物理攻擊']   = (out['物理攻擊']||0)   + v; } // 供外觀/飾品使用
      else if (k === 'matk') { out['法術攻擊']   = (out['法術攻擊']||0)   + v; }
      else if (k === 'aspd') { out['行動條速度'] = (out['行動條速度']||0) + v; }
      else if (k === 'eva')  { out['閃避']       = (out['閃避']||0)       + v; }
      else if (k === 'acc')  { out['命中率']     = (out['命中率']||0)     + v; }
      else if (k === 'crit') { out['暴擊率']     = (out['暴擊率']||0)     + v; }
      else if (k === 'critDmg' || k === 'crd') { out['暴擊傷害'] = (out['暴擊傷害']||0) + v; }
      else if (k === 'pen')  { out['破甲']       = (out['破甲']||0)       + v; }
      else if (k === 'mpen') { out['法穿']       = (out['法穿']||0)       + v; }
      else if (k === 'rmp')  { out['回氣/回合']  = (out['回氣/回合']||0)  + v; }
      else if (k === 'rhp')  { out['回血/回合']  = (out['回血/回合']||0)  + v; }

      // --- 主屬性（影響衍生公式）：先收進 __ATTR__，稍後由 finalDerived() 套入 A.* 再推導 ---
      else if (k === 'str' || k === 'int' || k === 'vit' || k === 'dex' || k === 'wis' || k === 'luk' || k === 'agi'){
        // 註：若資料使用 agi 表示敏捷，統一視為 dex
        var key = (k === 'agi') ? 'dex' : k;
        if (!out['__ATTR__']) out['__ATTR__'] = {};
        out['__ATTR__'][key] = (out['__ATTR__'][key]||0) + v;
      }

      // --- 其他未知鍵，保留（方便日後擴充，例如抗性 res: {ice:10} 等） ---
      else {
        out[k] = (out[k]||0) + v;
      }
    }

    return out;
  }


  function addMap(m){
    if(!m) return;
    for (var k in m){
      if(!Object.prototype.hasOwnProperty.call(m,k)) continue;
      var v = m[k] || 0;
      sum[k] = (sum[k]||0) + v;
    }
  }

  function norm(it, kind){
    if(!it) return null;
    if(typeof it === 'string'){
      var g;
      if (kind === 'weapon') g = 'weapons';
      else if (kind === 'medal') g = 'medals';
      else if (kind === 'character') g = 'appearances';
      else g = kind;
      var d = window.ItemDB && ItemDB.getDef(g, it);
      if (d) return d;
      return null;
    }
    return it;
  }

  // 武器
  var w = norm(P.equip && P.equip.weapon, 'weapon');
  if (w){
    if (w.bonus) addMap(convert(w.bonus));
    else if (w.effect) addMap(convert(w.effect));
    else if (Array.isArray(w.dmg)){
      var avg = Math.round(((w.dmg[0]||0)+(w.dmg[1]||0))/2) + (w.plus||0)*2;
      addMap({'物理攻擊': avg});
    }
  }

  // 單格：披風/護甲/鞋子
  var single = ['cloak','armor','shoes'];
  for (var i=0;i<single.length;i++){
    var k = single[i];
    var it = norm(P.equip && P.equip[k], k);
    if (it) addMap(convert(it.bonus || it.effect));
  }

  // 外觀（character）
  var ch = norm(P.equip && P.equip.character, 'character');
  if (ch) addMap(convert(ch.bonus || ch.effect));

  // 陣列：耳環/戒指/勳章
  var arr, i2, it2;

  arr = (P.equip && P.equip.earrings) || [];
  for (i2=0;i2<arr.length;i2++){ it2 = norm(arr[i2],'earrings'); addMap(convert(it2 && (it2.bonus || it2.effect))); }

  arr = (P.equip && P.equip.rings) || [];
  for (i2=0;i2<arr.length;i2++){ it2 = norm(arr[i2],'rings'); addMap(convert(it2 && (it2.bonus || it2.effect))); }

  arr = (P.equip && P.equip.medals) || [];
  for (i2=0;i2<arr.length;i2++){ it2 = norm(arr[i2],'medal');  addMap(convert(it2 && (it2.bonus || it2.effect))); }

  return sum;
}

// --- 對外 API ---
// 1) 舊版：用當前登入者
function getBonuses(){
  var P = api.getPlayer && api.getPlayer();
  return _calcBonusesFor(P);
}

// 2) 新增：針對「任意玩家」計算（給排行榜等用）
function getBonusesFor(player){
  return _calcBonusesFor(player);
}

window.Equip = {
  mount, open, close, render,
  getBonuses,            // 既有：目前玩家
  getBonusesFor,         // 新增：指定玩家
  equipWeapon, equipMedal, equipOrnament
};

})();

