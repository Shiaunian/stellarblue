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
.eq-grid{display:grid; grid-template-columns: repeat(4, 60px); column-gap:4px; row-gap:8px; justify-content:center;}
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

      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
    }

    render();
  }

  function open(){ const m = document.getElementById('eqModal'); if(!m) return; render(); m.classList.add('show'); m.setAttribute('aria-hidden','false'); }
  function close(){ const m = document.getElementById('eqModal'); if(!m) return; m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }

function onClick(e){
  const closeBtn = e.target.closest('[data-eq-close]'); if (closeBtn){ close(); return; }
  const slot = e.target.closest('.eq-slot, .eq-hole'); if(!slot) return;

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
      // 先歸到 ornaments（耳環/戒指/披風/衣服/鞋子）— 之後若你有更細類別可再拆
      P.bag.ornaments = Array.isArray(P.bag.ornaments) ? P.bag.ornaments : [];
      try { P.bag.ornaments.unshift(JSON.parse(JSON.stringify(obj))); }
      catch(_) { P.bag.ornaments.unshift(obj); }
    } else if (kind === 'medal') {
      // 先暫放 hidden，未來若有專屬勳章袋可再改
      P.bag.hidden = Array.isArray(P.bag.hidden) ? P.bag.hidden : [];
      try { P.bag.hidden.unshift(JSON.parse(JSON.stringify(obj))); }
      catch(_) { P.bag.hidden.unshift(obj); }
    }
  };

  // 點擊 = 卸下（改為：先回袋，再清空欄位）
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
  else if (part === 'medals') {
    const arr = P.equip?.medals || [];
    const cur = arr[idx];
    if (cur) {
      backToBag('medal', cur);
      arr[idx] = null;
      api.log('已卸下勳章 → 暫放背包(hidden)');
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
    const P=api.getPlayer&&api.getPlayer(); if(!P) return false;
    const arr = P.equip.medals || (P.equip.medals=[null,null,null,null,null]);
    if (arr.some(x=>x?.id===m.id)) { api.log('不可裝備相同勳章'); return false; }
    const pos = arr.findIndex(x=>!x); if(pos===-1){ api.log('勳章已達上限'); return false; }
    arr[pos] = {...m}; api.save(); render(); api.recalc(); return true;
  }

  /* 對外：回傳所有裝備帶來的加成（讓主程式加到能力值） */
  function getBonuses(){
    const P = api.getPlayer && api.getPlayer(); if(!P) return {};
    const sum={}; const add=(m)=>{ if(!m) return; for(const[k,v]of Object.entries(m)) sum[k]=(sum[k]||0)+(v||0); };
    const norm=(it, kind)=>{ if(!it) return null; if(typeof it==='string'){ const g=kind==='weapon'?'weapons':(kind==='medal'?'medals':kind); const d=window.ItemDB&&ItemDB.getDef(g,it); return d?{...d}:null; } return it; };

    const w = norm(P.equip?.weapon,'weapon');
    if(w){ if(w.bonus) add(w.bonus); else if(Array.isArray(w.dmg)){ const avg = Math.round(((w.dmg[0]||0)+(w.dmg[1]||0))/2) + (w.plus||0)*2; add({'物理攻擊':avg}); } }
    ['cloak','armor','shoes'].forEach(k=> add(norm(P.equip?.[k],k)?.bonus));
    (P.equip?.earrings||[]).forEach(x=> add(norm(x,'earrings')?.bonus));
    (P.equip?.rings||[]).forEach(x=> add(norm(x,'rings')?.bonus));
    (P.equip?.medals||[]).forEach(x=> add(norm(x,'medal')?.bonus));

    return sum;
  }

  window.Equip = { mount, open, close, render, getBonuses, equipWeapon, equipMedal };
})();
