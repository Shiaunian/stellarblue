// ============ UI Helper ============
function attrTips(key){
  const map={
    STR:'力量：提升攻擊力', AGI:'敏捷：提升行動效率', VIT:'體質：提升最大HP與防禦', INT:'智慧：提升最大MP與術法效果',
    PER:'感知：提升暴擊與命中', WIL:'意志：提升抗性與MP回復', LUK:'幸運：提升掉落與暴擊', SPD:'速度：決定行動條充能',
    ELG:'木靈：元素親和（木）', ELW:'水靈：元素親和（水）', ELF:'火靈：元素親和（火）',
    ELE:'土靈：元素親和（土）', ELI:'冰靈：元素親和（冰）', ELT:'雷靈：元素親和（雷）'
  };
  return map[key]||key;
}

function attrLabel(k){
  return {
    STR:'力量',AGI:'敏捷',VIT:'體質',INT:'智慧',PER:'感知',WIL:'意志',LUK:'幸運',SPD:'速度',
    ELG:'木靈',ELW:'水靈',ELF:'火靈',ELE:'土靈',ELI:'冰靈',ELT:'雷靈'
  }[k]||k;
}

function rarityClass(r){ return 'rarity-'+(r||'common'); }
function cardIconHTML(src){ return `<div class="icon"><img src="${src||ICON.slot}" alt="icon"/></div>`; }

// ============ 屬性 / 加點 ============
const DISPLAY_ATTRS_ORDER=['STR','AGI','VIT','INT','PER','WIL','LUK','SPD','ELG','ELW','ELF','ELE','ELI','ELT'];

function addPoint(k){
  const P=state.player;
  if((P.statPoints||0)<=0) return toast('沒有可分配點數');
  P.attrs[k] = (P.attrs[k]||0)+1;
  P.statPoints-=1;
  normalizeHPMP();
  markDirty();
  renderTop(); renderAttrs(); renderBattleBars();
}

function renderAttrs(){
  const box = $('#attrList'); box.innerHTML='';
  const D=derived(); const A=D.A;
  DISPLAY_ATTRS_ORDER.forEach(k=>{
    const row=document.createElement('div');
    row.className='stat';
    row.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span>${attrLabel(k)}</span>
        <span class="attr-right">
          <small class="val">${Number.isFinite(A[k]) ? A[k] : 0}</small>
          <small class="attr-desc muted">${attrTips(k)}</small>
          ${(state.player.statPoints>0)?`<button class="add" data-add="${k}">＋</button>`:''}
        </span>
      </div>`;
    box.appendChild(row);
  });
  $$('#attrList .add').forEach(btn=>{ btn.onclick = ()=> addPoint(btn.dataset.add); });
}

// ============ 渲染 Topbar ============
function renderTop(){
  const P = state.player, D=derived();
  $('#uiLevel').textContent = P.level;
  $('#uiExp').textContent = `${fmt(P.exp)}/${fmt(P.nextExp)}`;
  $('#uiStone').textContent = fmt(P.currencies.stone);
  $('#uiDiamond').textContent = fmt(P.currencies.diamond);
  $('#uiGold').textContent = fmt(P.currencies.gold||0);
  $('#uiPts').textContent = fmt(P.statPoints||0);
  $('#uiExpBar').style.width = clamp(P.exp / P.nextExp * 100,0,100) + '%';
  $('#playerLv2').textContent = P.level;

  setAvatar($('#homeAvatar'), state.player.avatar);
  $('#homePlayerName').textContent = state.player.name || '無名散修';
  $('#homePlayerLv').textContent = P.level;

  const hpRatio = clamp(state.player.hp / D.hpMax * 100, 0, 100);
  const mpRatio = clamp(state.player.mp / D.mpMax * 100, 0, 100);
  $('#homeHpBar').style.width = hpRatio+'%';
  $('#homeMpBar').style.width = mpRatio+'%';
  $('#homeHpText').textContent = `HP ${fmt(state.player.hp)}/${fmt(D.hpMax)}`;
  $('#homeMpText').textContent = `MP ${fmt(state.player.mp)}/${fmt(D.mpMax)}`;
}

// ============ 背包 ============
function renderBag(filter='all'){
  const list = $('#bagList'); list.innerHTML='';
  state.inventory.forEach(it=>{
    const def=findItemDef(it.name); if(!def) return;
    if(filter!=='all' && def.type!==filter) return;
    const card=document.createElement('div'); card.className='card';
    if(def.type==='equip'){ card.classList.add(rarityClass(def.rarity)); }
    const detail = def.type==='equip' ? equipStatsText(def) : def.desc;
    card.innerHTML=`${cardIconHTML(def.icon || slotIconByKey[def.slot] || ICON.potion)}
      <div class="grow">
        <div><strong class="equip-name">${it.name}</strong> <span class="tag">x${it.qty}</span></div>
        <div class="small muted">${detail}${def.desc && def.type==='equip'?'｜'+def.desc:''}</div>
      </div>
      <div style="display:flex;gap:6px">
        ${def.type==='equip'?'<button class="btn small" data-equip>裝備</button>':''}
        ${(def.useInCombat||def.useOutCombat)?'<button class="btn ghost small" data-use>使用</button>':''}
        <button class="btn ghost small" data-drop>丟棄</button>
      </div>`;
    card.querySelector('[data-drop]').onclick=()=>{ if(confirm('丟棄 1 個？')){ removeItem(it.name,1); renderBag(filter);} };
    if(card.querySelector('[data-use]')) card.querySelector('[data-use]').onclick=()=>useItemFromBag(it.name);
    if(card.querySelector('[data-equip]')) card.querySelector('[data-equip]').onclick=()=>equipFromBag(it.name);
    list.appendChild(card);
  });
}

// ============ 裝備 ============
function renderEquip(){
  const box=$('#equipSlots'); box.innerHTML='';
  const e=state.player.equip;
  const slots=[
    {key:'weapon', label:'武器', val:e.weapon},
    {key:'cloak', label:'披風', val:e.cloak},
    {key:'shoes', label:'鞋子', val:e.shoes},
    {key:'medal', label:'勳章1', val:e.medals[0], idx:0},
    {key:'medal', label:'勳章2', val:e.medals[1], idx:1},
    {key:'medal', label:'勳章3', val:e.medals[2], idx:2},
    {key:'ring', label:'戒指1', val:e.rings[0], idx:0},
    {key:'ring', label:'戒指2', val:e.rings[1], idx:1},
    {key:'reserved', label:'待開發1', val:e.reserved[0], idx:0},
    {key:'reserved', label:'待開發2', val:e.reserved[1], idx:1},
    {key:'reserved', label:'待開發3', val:e.reserved[2], idx:2}
  ];
  slots.forEach(s=>{
    const card=document.createElement('div'); card.className='slot';
    if(s.val && s.val.type==='equip'){ card.classList.add(rarityClass(s.val.rarity)); }
    const iconSrc = (s.val && (s.val.icon || slotIconByKey[s.val.slot])) || slotIconByKey[s.key] || ICON.slot;
    card.innerHTML=`
      ${cardIconHTML(iconSrc)}
      <div class="meta">
        <div class="label">${s.label}</div>
        <div class="name">${s.val? `<span class="equip-name">${s.val.name}</span>` : '—'}</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:6px">
        ${s.val?'<button class="btn ghost small" data-unequip>卸下</button>':''}
      </div>`;
    card.onclick=()=>openEquipInfoModal(s.key, s.idx??0);
    if(s.val) card.querySelector('[data-unequip]').onclick=(ev)=>{
      ev.stopPropagation();
      addItem(s.val.name,1);
      if(s.key==='weapon') e.weapon=null;
      else if(s.key==='cloak') e.cloak=null;
      else if(s.key==='shoes') e.shoes=null;
      else if(s.key==='ring') e.rings[s.idx]=null;
      else if(s.key==='medal') e.medals[s.idx]=null;
      else if(s.key==='reserved') e.reserved[s.idx]=null;
      normalizeHPMP();
      markDirty();
      renderEquip(); renderTop(); renderAttrs(); renderBattleBars();
      renderBag(currentFilter);
    };
    box.appendChild(card);
  });

  const inv=$('#equipInventory'); inv.innerHTML='';
  state.inventory.filter(i=>findItemDef(i.name)?.type==='equip').forEach(it=>{
    const def=findItemDef(it.name);
    const card=document.createElement('div'); card.className='card '+rarityClass(def.rarity);
    card.innerHTML=`
      ${cardIconHTML(def.icon || slotIconByKey[def.slot])}
      <div class="grow">
        <div><strong class="equip-name">${it.name}</strong> <span class="tag">x${it.qty}</span></div>
        <div class="small muted">${equipStatsText(def)}${def.desc?'｜'+def.desc:''}</div>
      </div>
      <button class="btn small">裝備</button>`;
    card.querySelector('button').onclick=()=>equipFromBag(it.name);
    inv.appendChild(card);
  });
}

function openEquipInfoModal(slotKey, slotIdx){
  const e=state.player.equip;
  let val=null;
  if(slotKey==='weapon') val=e.weapon;
  else if(slotKey==='cloak') val=e.cloak;
  else if(slotKey==='shoes') val=e.shoes;
  else if(slotKey==='ring') val=e.rings[slotIdx];
  else if(slotKey==='medal') val=e.medals[slotIdx];
  else if(slotKey==='reserved') val=e.reserved[slotIdx];

  const body=$('#equipInfoBody');
  const title=$('#equipInfoTitle');
  const btnUn=$('#equipInfoUnequip');

  if(val){
    title.textContent = val.name+'｜'+(rarityLabel(val.rarity||'common'));
    btnUn.style.display='inline-block';
    btnUn.onclick=()=>{
      addItem(val.name,1);
      if(slotKey==='weapon') e.weapon=null;
      else if(slotKey==='cloak') e.cloak=null;
      else if(slotKey==='shoes') e.shoes=null;
      else if(slotKey==='ring') e.rings[slotIdx]=null;
      else if(slotKey==='medal') e.medals[slotIdx]=null;
      else if(slotKey==='reserved') e.reserved[slotIdx]=null;
      normalizeHPMP();
      markDirty();
      closeEquipInfoModal();
      renderEquip(); renderTop(); renderAttrs(); renderBattleBars();
      renderBag(currentFilter);
    };
    body.innerHTML = `
      <div class="card ${rarityClass(val.rarity)}" style="align-items:flex-start">
        ${cardIconHTML(val.icon || slotIconByKey[val.slot])}
        <div class="grow">
          <div><strong class="equip-name">${val.name}</strong></div>
          <div class="small muted" style="margin-top:4px">${val.desc||''}</div>
          <hr style="border-color:rgba(255,255,255,.06);margin:8px 0"/>
          <div class="small"><div>${equipStatsText(val)}</div></div>
        </div>
      </div>`;
  }else{
    title.textContent='裝備詳情';
    btnUn.style.display='none';
    body.innerHTML = `<div class="center muted small" style="padding:12px">此槽位目前未裝備</div>`;
  }
  $('#equipInfoModal').style.display='grid';
}
function closeEquipInfoModal(){ $('#equipInfoModal').style.display='none'; }

// ============ 商店 ============
function renderShop(){
  const list=$('#shopList'); list.innerHTML='';
  state.shop.forEach(item=>{
    const def=findItemDef(item.name); if(!def) return;
    if(shopFilter!=='all' && def.type!==shopFilter) return;
    const price = def.price?.diamond? `💎${def.price.diamond}` : `❤${def.price?.stone||0}`;
    const card=document.createElement('div'); card.className='card';
    if(def.type==='equip'){ card.classList.add(rarityClass(def.rarity)); }
    card.innerHTML=`
      ${cardIconHTML(def.icon || slotIconByKey[def.slot] || ICON.potion)}
      <div class="grow">
        <div><strong class="equip-name">${item.name}</strong> <span class="tag">剩餘 ${item.qty}</span></div>
        <div class="small muted">${def.type==='equip'?equipStatsText(def):def.desc}</div>
      </div>
      <div style="display:flex;gap:6px"><div class="chip">${price}</div><button class="btn small">購買</button></div>`;
    card.querySelector('button').onclick=()=>buy(item.name);
    list.appendChild(card);
  });

  $$('[data-page="shop"] [data-shop]').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.shop===shopFilter);
  });
}
function buy(name){
  const stock = state.shop.find(s=>s.name===name && s.qty>0); if(!stock) return toast('缺貨');
  const def=findItemDef(name); if(!def) return;
  const P=state.player;
  if(def.price?.diamond){
    if(P.currencies.diamond<def.price.diamond) return toast('鑽石不足');
    P.currencies.diamond -= def.price.diamond;
  } else {
    const c = def.price?.stone||0; if(P.currencies.stone<c) return toast('靈石不足');
    P.currencies.stone -= c;
  }
  stock.qty--; addItem(name,1);
  markDirty();
  renderTop(); renderBag(currentFilter); renderShop();
  toast('已購買：'+name);
}

// ============ Modal ============
function openMapModal(){
  const list=$('#mapList'); list.innerHTML='';
  MAPS.forEach(m=>{
    const enemyNames = (m.enemies||[]).map(id => (MONSTER_DB[id]?.name || id)).join('、');
    const row=document.createElement('div'); row.className='card';
    row.innerHTML=`
      <div class="grow">
        <div><strong>${m.name}</strong></div>
        <div class="small muted">建議等級 ${m.level[0]}-${m.level[1]} ｜ 可能敵人：${enemyNames}</div>
      </div>
      <button class="btn small">選擇</button>`;
    row.querySelector('button').onclick=()=>{ chooseMap(m.id); };
    list.appendChild(row);
  });
  $('#mapModal').style.display='grid';
}
function closeMapModal(){ $('#mapModal').style.display='none'; }

function openItemModal(){
  const list=$('#battleItemList'); list.innerHTML='';
  state.inventory.forEach(it=>{
    const def=findItemDef(it.name); if(!def || !def.useInCombat) return;
    const next = battle.cooldowns[it.name] || 0;
    const left = Math.max(0, Math.ceil((next - nowMs())/1000));
    const cdText = def.cd ? (left>0?`CD ${left}s`:`CD ${def.cd}s`) : '';
    const row=document.createElement('div'); row.className='card';
    row.innerHTML=`<div class="grow">
      <div><strong>${it.name}</strong> <span class="tag">x${it.qty}</span></div>
      <div class="small muted">${def.desc} ${cdText?`｜${cdText}`:''}</div>
    </div>
    <button class="btn small" ${left>0?'disabled':''}>使用</button>`;
    row.querySelector('button').onclick=()=>{ useItemFromBag(it.name); closeItemModal(); };
    list.appendChild(row);
  });
  $('#itemModal').style.display='grid';
}
function closeItemModal(){ $('#itemModal').style.display='none'; }

function openWinModal(summaryHTML){
  $('#winBody').innerHTML = summaryHTML || '<div class="small">已獲勝。</div>';
  $('#winModal').style.display='grid';
}
$('#closeWinModal').onclick=()=>$('#winModal').style.display='none';

// ============ 導航 ============
let currentFilter='all'; let shopFilter='consumable';
function goto(tab){
  if(battle.in && tab!=='battle'){ toast('戰鬥中不可切換頁面'); tab = 'battle'; }
  $$('#tabbar button').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  $$('section[data-page]').forEach(s=>s.hidden = s.dataset.page!==tab);
  if(tab==='bag') renderBag(currentFilter);
  if(tab==='equip') renderEquip();
  if(tab==='shop') renderShop();
  if(tab==='battle') renderBattleBars();
}

// ============ 綁定事件 ============
function bindUI(){
  $$('#tabbar button, .nav button').forEach(b=> b.onclick=()=>{ 
    const target=b.dataset.tab; 
    if(battle.in && target!=='battle'){ toast('戰鬥中不可切換頁面'); goto('battle'); return; } 
    goto(target); 
  });
  $$('[data-goto]').forEach(b=> b.onclick=()=> goto(b.dataset.goto));
  $$('[data-filter]').forEach(b=> b.onclick=()=>{ currentFilter=b.dataset.filter; renderBag(currentFilter); });
  $$('[data-shop]').forEach(b=> b.onclick=()=>{ shopFilter=b.dataset.shop; renderShop(); });

  $('#btnMeditate').onclick=()=>{ addExp(5); renderTop(); };
  $('#btnReadBook').onclick=()=>useItemFromBag('修煉經書');
  $('#btnUseTown').onclick=()=>useItemFromBag('回城符');

  $('#btnStartBattle').onclick=startBattle;
  $('#btnFlee').onclick=()=>{ if(battle.in){ endBattle('flee'); } };
  $('#btnChooseMap').onclick=openMapModal;

  $('#actAttack').onclick=playerAttack;
  $('#actSkill').onclick=openSkillModal;
  $('#actItem').onclick=openItemModal;
  $('#actDefend').onclick=()=>{ state.player.effects.guard=true; log('你進入防禦姿態，本回合所受傷害減少'); endPlayerTurn(); };

  $('#closeSkillModal').onclick=closeSkillModal;
  $('#closeMapModal').onclick=closeMapModal;
  $('#closeItemModal').onclick=closeItemModal;
  $('#closeEquipInfoModal').onclick=closeEquipInfoModal;
}

// ============ Toast ============
let toastTimer=null;
function toast(msg){
  const t=$('#toast'); $('#toastMsg').textContent=msg; t.style.display='block';
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.style.display='none', 1600);
}

// ============ 渲染總入口 ============
function renderAll(){ renderTop(); renderAttrs(); renderBag('all'); renderEquip(); renderShop(); goto('home'); }

// ---- boot ----
(function boot(){
  if (typeof init === 'function') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once:true });
    } else {
      init();
    }
  } else {
    console.error('init() 不存在：請確認 ui.js 內有定義 init()');
  }
})();

