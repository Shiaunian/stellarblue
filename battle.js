/* battle.js — 回合制戰鬥（完整可替換版） */
;(function () {
  // ---------------- 安全工具 & 全域取用 ----------------
  const $  = (sel, par = document) => (window.$ ? window.$(sel, par) : par.querySelector(sel));
  const $$ = (sel, par = document) => (window.$$ ? window.$$(sel, par) : [...par.querySelectorAll(sel)]);
  const clamp = (v, min, max) => (window.clamp ? window.clamp(v, min, max) : Math.max(min, Math.min(max, v)));
  const rnd   = (a, b) => (window.rnd ? window.rnd(a, b) : Math.floor(Math.random() * (b - a + 1)) + a);
  const nowMs = () => (window.nowMs ? window.nowMs() : Date.now());
  const fmt   = (n) => (window.fmt ? window.fmt(n) : (new Intl.NumberFormat('zh-Hant')).format(n));

  // 取 state（由 ui.js 建立），若不存在給個保底，避免整頁中斷
  const getState = () => (window.state ||= {
    player: {
      name: '無名散修', level: 1, exp: 0, nextExp: 100,
      hp: 100, mp: 50, element: (window.ELEM && ELEM.NEUTRAL) || 'NEUTRAL',
      currencies: { stone: 0, diamond: 0, gold: 0 },
      statPoints: 0,
      attrs: { STR:5, AGI:5, VIT:5, INT:5, PER:5, WIL:5, LUK:5, SPD:5, MET:3, WOO:3, WAT:3, FIR:3, ELG:1, ELW:1, ELF:1, ELE:1, ELI:1, ELT:1 },
      equip: { weapon:null, cloak:null, shoes:null, medals:[null,null,null], rings:[null,null], reserved:[null,null,null] },
      avatar:'', effects:{guard:false}
    },
    inventory: [],
    shop: [],
    meta: { version: 'fallback' }
  });

  // UI/資料層可能提供的函式：優先用現有，否則給 fallback
  const toast  = (msg) => (window.toast ? window.toast(msg) : console.log('[Toast]', msg));
  const log    = (msg) => {
    const el = $('#battleLog');
    if (el) { const line = document.createElement('div'); line.className='small'; line.textContent=msg; el.appendChild(line); el.scrollTop = el.scrollHeight; }
    console.log('[BattleLog]', msg);
  };
  const markDirty = () => (window.markDirty ? window.markDirty() : void 0);
  const persistLocal = () => (window.persistLocal ? window.persistLocal() : void 0);

  const renderTop        = () => (window.renderTop ? window.renderTop() : void 0);
  const renderAttrs      = () => (window.renderAttrs ? window.renderAttrs() : void 0);
  const renderEquip      = () => (window.renderEquip ? window.renderEquip() : void 0);
  const renderBag        = (f) => (window.renderBag ? window.renderBag(f||'all') : void 0);

  const addItem = (name, qty=1, payload) => {
    if (typeof window.addItem === 'function') return window.addItem(name, qty, payload);
    const state = getState();
    const it = state.inventory.find(i => i.name === name);
    if (it) it.qty += qty;
    else state.inventory.push({ name, qty, payload: payload ?? null });
  };
  const removeItem = (name, qty=1) => {
    if (typeof window.removeItem === 'function') return window.removeItem(name, qty);
    const state = getState();
    const idx = state.inventory.findIndex(i => i.name === name);
    if (idx >= 0) {
      state.inventory[idx].qty -= qty;
      if (state.inventory[idx].qty <= 0) state.inventory.splice(idx, 1);
    }
  };
  const findItemDef = (name) => {
    if (typeof window.findItemDef === 'function') return window.findItemDef(name);
    return (window.ITEMS || {})[name] || null;
  };
  const addExp = (v) => {
    if (typeof window.addExp === 'function') return window.addExp(v);
    const s = getState(); s.player.exp += v; toast(`獲得 ${v} EXP`); // 簡化 fallback
  };
  const gotoTab = (tab) => (typeof window.goto === 'function' ? window.goto(tab) : void 0);
  const normalizeHPMP = () => (typeof window.normalizeHPMP === 'function' ? window.normalizeHPMP() : void 0);

  const setAvatar = (imgEl, url) => {
    if (window.setAvatar) return window.setAvatar(imgEl, url);
    if (!imgEl) return; if (url) imgEl.src = url; else imgEl.removeAttribute('src');
  };

  // ---------------- 元素相剋（本檔自帶，避免缺失） ----------------
  const ELEM = window.ELEM || {
    NEUTRAL:'NEUTRAL', WATER:'WATER', FIRE:'FIRE', GRASS:'GRASS', EARTH:'EARTH', ICE:'ICE', THUNDER:'THUNDER', LIGHT:'LIGHT', DARK:'DARK'
  };
  const ELEM_ADV = { WATER:'FIRE', FIRE:'GRASS', GRASS:'EARTH', EARTH:'ICE', ICE:'THUNDER', THUNDER:'WATER' };
  const ELEM_LIGHT_DARK = { LIGHT:'DARK', DARK:'LIGHT' };
  function elementMultiplier(attackerElem, defenderElem){
    if(!attackerElem || attackerElem===ELEM.NEUTRAL || !defenderElem || defenderElem===ELEM.NEUTRAL) return 1.0;
    if(ELEM_ADV[attackerElem] === defenderElem) return 1.5;
    if(ELEM_ADV[defenderElem] === attackerElem) return 0.75;
    if(ELEM_LIGHT_DARK[attackerElem] === defenderElem) return 1.5;
    if(ELEM_LIGHT_DARK[defenderElem] === attackerElem) return 0.75;
    return 1.0;
  }

  // ---------------- 戰鬥狀態 ----------------
  const Battle = {
    in:false, enemy:null, timer:null, turn:'none', map:null,
    bars:{player:0, enemy:0}, startedAt:0, cooldowns:{}
  };

  // （可調）怪物基礎倍率
  const MONSTER_SCALER = { HP:1, MP:1, ATK:1, DEF:1, SPD:1 };

  function makeEnemyFromTemplate(tpl){
    const hpMax = Math.floor(tpl.base.HP * MONSTER_SCALER.HP);
    const mpMax = Math.floor(tpl.base.MP * MONSTER_SCALER.MP);
    const atk   = Math.floor((tpl.base.STR) * MONSTER_SCALER.ATK);
    const def   = Math.floor((tpl.base.VIT) * MONSTER_SCALER.DEF);
    const spd   = Math.max(8, Math.floor(tpl.base.SPD * MONSTER_SCALER.SPD));
    return {
      id: tpl.id, name: tpl.name, level: tpl.level, element: tpl.element,
      hp:hpMax, hpMax, mp:mpMax, mpMax, atk, def, spd,
      avatar: tpl.avatar, drops: tpl.drops
    };
  }

  function makeEnemy(){
    const MAPS = window.MAPS || [];
    const MONSTER_DB = window.MONSTER_DB || {};
    const pool = (Battle.map ? MAPS.find(m=>m.id===Battle.map)?.enemies : null) || Object.keys(MONSTER_DB);
    const id   = pool[rnd(0, pool.length-1)];
    return makeEnemyFromTemplate(MONSTER_DB[id]);
  }

  // ---------------- 衍生屬性（呼叫 ui.js 的 derived；無則 fallback） ----------------
  function derived(){
    if (typeof window.derived === 'function') return window.derived();
    const P = getState().player;
    const VIT = P.attrs?.VIT || 5, INT=P.attrs?.INT||5, STR=P.attrs?.STR||5, SPD=P.attrs?.SPD||5, AGI=P.attrs?.AGI||5, PER=P.attrs?.PER||5, LUK=P.attrs?.LUK||5, WIL=P.attrs?.WIL||5, WAT=P.attrs?.WAT||0, WOO=P.attrs?.WOO||0, MET=P.attrs?.MET||0;
    const hpMax = 100 + VIT*12 + WIL*2;
    const mpMax =  50 + INT*10 + WIL*4;
    const atk = 8 + STR*2 + Math.floor(MET*0.5);
    const spdBase = 40 + SPD*3 + Math.floor(AGI*1.2);
    const spd = Math.max(10, Math.floor(spdBase * 1.0));
    const crit = Math.min(70, (5 + Math.floor((PER+LUK)/3)));
    const def  = 4 + Math.floor(VIT*1.2) + Math.floor(WOO*0.5);
    const res  = Math.min(60, Math.floor((WIL+WAT)/2));
    return {hpMax, mpMax, atk, def, spd, crit, res, weapon:{elem:ELEM.NEUTRAL, hit:95, crit:0, speedMul:1.0}};
  }

  // ---------------- 回合流程 ----------------
  function startBattle(){
    const MAPS = window.MAPS || [];
    if(!Battle.map){ openMapModal(); return; }
    Battle.in = true;
    Battle.enemy = makeEnemy();
    Battle.bars.player = 0;
    Battle.bars.enemy = rnd(0,40);
    Battle.turn = 'none';
    Battle.startedAt = nowMs();
    Battle.cooldowns = {};

    $('#enemyLv').textContent = Battle.enemy.level;
    setAvatar($('#enemyAvatar'), Battle.enemy.avatar);
    setAvatar($('#playerAvatar'), getState().player.avatar);

    $('#enemyHeaderTitle').textContent = Battle.enemy.name;
    $('#enemyHeaderTitle').classList.add('title-xl');
    $('#turnHint').textContent = '等待行動條填滿...';

    toast('遭遇『'+Battle.enemy.name+'』！');
    log('於『'+ (MAPS.find(m=>m.id===Battle.map)?.name||'未知地區') +'』遭遇 '+Battle.enemy.name+'！');
    renderBattleBars();

    if(Battle.timer) clearInterval(Battle.timer);
    Battle.timer = setInterval(tick, 120);
    showActions(false); // 等待行動條
  }

  function endBattle(result){
    const state = getState();
    if(result === 'win'){
      const exp = 8 + (Battle.enemy.level || 1) * 6;
      addExp(exp);
      const got = [];
      (Battle.enemy.drops || []).forEach(d => {
        if(Math.random() <= (d.chance || 0)){
          const qty = Array.isArray(d.qty) ? rnd(d.qty[0], d.qty[1]) : (d.qty || 1);
          if(d.item){ addItem(d.item, qty); got.push(`${d.item} x${qty}`); }
          if(d.stone){
            state.player.currencies.stone = (state.player.currencies.stone || 0) + d.stone;
            got.push(`靈石 ${d.stone}`);
          }
        }
      });
      log(`勝利！獲得 EXP ${exp}${got.length ? '、' + got.join('、') : ''}`);
      toast('勝利！' + (got.length ? '獲得 ' + got.join('、') : ''));
      const sum = `<div class="list"><div>獲得 EXP ${exp}</div>${got.map(g=>`<div>${g}</div>`).join('')}</div>`;
      openWinModal(sum);
      $('#enemyHeaderTitle').textContent = '已打敗敵人';

    } else if(result === 'lose'){
      log('你被擊敗了……');
      toast('你被擊敗了');
      $('#enemyHeaderTitle').textContent = '戰鬥失敗';
      state.player.hp = Math.max(1, state.player.hp);
      renderTop();

    } else if(result === 'flee'){
      log('你成功脫戰。');
      toast('已逃離戰鬥');
      $('#enemyHeaderTitle').textContent = '已脫離戰鬥';
    }

    Battle.in = false;
    Battle.turn = 'none';
    Battle.enemy = null;
    if(Battle.timer){ clearInterval(Battle.timer); Battle.timer = null; }
    showActions(false);
    $('#turnHint').textContent = '戰鬥已結束';
    Battle.bars.player = 0; Battle.bars.enemy = 0;
    renderActBars();
    setAvatar($('#enemyAvatar'), '');
    renderBattleBars();
    state.player.effects.guard = false;

    markDirty(); persistLocal?.();
  }

  function tick(){
    if(!Battle.in) return;
    const D=derived();
    const pRate = D.spd/50;
    const eRate = Battle.enemy.spd/60;
    if(Battle.turn==='none'){
      Battle.bars.player = clamp(Battle.bars.player + pRate, 0, 100);
      Battle.bars.enemy  = clamp(Battle.bars.enemy + eRate, 0, 100);
      renderActBars();
      if(Battle.bars.player>=100){ Battle.turn='player'; $('#turnHint').textContent='輪到你行動'; showActions(true); }
      else if(Battle.bars.enemy>=100){ Battle.turn='enemy'; $('#turnHint').textContent='敵人行動中'; showActions(false); enemyAct(); }
    }
  }

  function showActions(on){
    const box = $('#battleActions');
    if (!box) return;
    box.style.opacity = on?1:.5;
    Array.from(box.children).forEach(b=> b.disabled=!on);
  }

  // ---------------- 傷害與命中 ----------------
  function rollHit(attackerIsPlayer){
    const D=derived();
    const acc = attackerIsPlayer ? (D.weapon?.hit ?? 95) : 90;
    return Math.random()*100 < acc;
  }

  function damage(from, to, attackerElem=ELEM.NEUTRAL, defenderElem=ELEM.NEUTRAL, toIsPlayer=false){
    const base = Math.max(1, from.atk - Math.floor(to.def*0.6));
    const variance = rnd(-2, 2);
    const D = derived();
    const critChance = (toIsPlayer ? 8 : D.crit); // from===player 時使用 D.crit
    const crit = Math.random()*100 < critChance ? 1.6 : 1.0;

    let val = Math.max(1, Math.floor((base+variance)*crit));
    const mult = elementMultiplier(attackerElem, defenderElem);
    val = Math.max(1, Math.floor(val * mult));

    if(toIsPlayer && getState().player.effects.guard){
      val = Math.floor(val * 0.6);
      getState().player.effects.guard = false;
    }
    return {val, crit:crit>1.0, mult};
  }

  function endPlayerTurn(){ Battle.bars.player=0; Battle.turn='none'; $('#turnHint').textContent='等待行動條填滿...'; }
  function endEnemyTurn(){ Battle.bars.enemy=0; Battle.turn='none'; $('#turnHint').textContent='等待行動條填滿...'; }

  function playerStatsObj(){
    const D=derived(), p=getState().player;
    return {name:'少俠', atk:D.atk, def:D.def, hp:p.hp, hpMax:D.hpMax, mp:p.mp, mpMax:D.mpMax};
  }

  // ---------------- 行動 ----------------
  function attackPlayer(){
    const foe = Battle.enemy; const p=getState().player; const D=derived();
    if(Math.random()*100 >= 90){ log(`${foe.name} 攻擊落空！`); endEnemyTurn(); return; }
    const {val, crit, mult} = damage(foe, playerStatsObj(), foe.element, p.element, true);
    p.hp = clamp(p.hp - val, 0, D.hpMax);
    renderBattleBars(); floatText($('#playerAvatar'), `-${val}`, 'blue');
    log(`${foe.name} 對你造成 ${val} 傷害${crit?'（暴擊）':''}${mult!==1?`（元素x${mult}）`:''}`);
    if(p.hp <= 0){ endBattle('lose'); } else { endEnemyTurn(); }
  }

  function enemyAct(){ setTimeout(()=>{ if(!Battle.in) return; attackPlayer(); }, 400); }

  function playerAttack(){
    if(Battle.turn!=='player') return;
    const D=derived(), me=playerStatsObj(), foe=Battle.enemy;
    if(!rollHit(true)){ log('你攻擊落空！'); endPlayerTurn(); return; }
    const atkElem = D.weapon?.elem || ELEM.NEUTRAL;
    const {val, crit, mult} = damage(me, foe, atkElem, foe.element);
    foe.hp = clamp(foe.hp - val, 0, foe.hpMax);
    renderBattleBars(); log(`你造成 ${val} 傷害${crit?'（暴擊）':''}${mult!==1?`（元素x${mult}）`:''}`);
    floatText($('#enemyAvatar'), `-${val}`, 'red');
    if(foe.hp<=0){ endBattle('win'); } else { endPlayerTurn(); }
  }

  // ---------------- 飄字 ----------------
  function floatText(targetEl, text, cls='red'){
    if(!targetEl) return;
    const r = targetEl.getBoundingClientRect();
    const host = document.body;
    const span = document.createElement('div');
    span.className = `floating-dmg ${cls}`;
    span.textContent = text;
    span.style.left = (r.left + r.width/2 - 8) + 'px';
    span.style.top  = (r.top  - 6) + 'px';
    host.appendChild(span);
    setTimeout(()=> span.remove(), 900);
  }

  // ---------------- 技能 ----------------
  const SKILLS = [
    {id:'slash',  name:'劍氣斬',  mp:10, desc:'以劍氣造成中量傷害', power:1.5, elem:ELEM.NEUTRAL,
      cast:()=> Math.floor(derived().atk*1.5 + rnd(2,6)), type:'dmg'},
    {id:'fire符', name:'火焰符',  mp:14, desc:'以火靈之力灼傷敵人', power:1.8, elem:ELEM.FIRE,
      cast:()=> Math.floor(derived().atk*1.2 + 8 + rnd(4,10)), type:'dmg'},
    {id:'taiching', name:'太清護身', mp:8, desc:'本回合受到傷害降低', type:'buff', elem:ELEM.NEUTRAL,
      cast:()=>{ getState().player.effects.guard=true; return 0; }}
  ];

  function openSkillModal(){
    const list=$('#skillList'); if(!list) return;
    list.innerHTML='';
    SKILLS.forEach(sk=>{
      const row=document.createElement('div'); row.className='card';
      row.innerHTML=`<div class="grow"><div><strong>${sk.name}</strong></div><div class="small muted">${sk.desc}｜消耗 ${sk.mp} MP</div></div><button class="btn small">施放</button>`;
      row.querySelector('button').onclick=()=>{ castSkill(sk); closeSkillModal(); };
      list.appendChild(row);
    });
    $('#skillModal').style.display='grid';
  }
  function closeSkillModal(){ const m=$('#skillModal'); if(m) m.style.display='none'; }
  function castSkill(sk){
    if(Battle.turn!=='player') return;
    const p=getState().player;
    if(p.mp < sk.mp){ toast('真元不足'); return; }
    p.mp -= sk.mp;
    if(sk.type==='dmg'){
      const base = sk.cast(playerStatsObj(), Battle.enemy);
      const mult = elementMultiplier(sk.elem || ELEM.NEUTRAL, Battle.enemy.element);
      const real = Math.max(1, Math.floor(base * mult));
      Battle.enemy.hp = clamp(Battle.enemy.hp - real, 0, Battle.enemy.hpMax);
      renderBattleBars(); floatText($('#enemyAvatar'), `-${real}`, 'red');
      log(`施展【${sk.name}】，造成 ${real} 傷害！${mult!==1?`（元素x${mult}）`:''}`);
      if(Battle.enemy.hp<=0){ endBattle('win'); return; }
    } else if(sk.type==='buff'){
      sk.cast(playerStatsObj(), Battle.enemy);
      renderBattleBars(); log(`施展【${sk.name}】，獲得護身效果。`);
    }
    endPlayerTurn();
  }

  // ---------------- 道具（戰鬥用） ----------------
  function useItemFromBag(name){
    const def=findItemDef(name); if(!def) return;
    const inBattle = Battle.in && Battle.turn==='player';
    if(inBattle){
      if(!def.useInCombat) return toast('此道具非戰鬥可用');
      if(def.cd){
        const now = nowMs();
        const next = Battle.cooldowns[name] || 0;
        if(now < next){
          const left = Math.ceil((next - now)/1000);
          return toast(`冷卻中（${left}s）`);
        }
      }
      def.effect(getState().player);
      removeItem(name,1);
      markDirty(); renderBag?.();
      log('使用：'+name);
      if(def.cd){ Battle.cooldowns[name] = nowMs() + def.cd*1000; }
      endPlayerTurn();
    } else {
      if(!def.useOutCombat) return toast('此道具僅可於戰鬥中使用');
      def.effect(getState().player);
      removeItem(name,1);
      markDirty(); renderBag?.();
      toast('已使用：'+name);
    }
  }

  function openItemModal(){
    const list=$('#battleItemList'); if(!list) return;
    list.innerHTML='';
    const inv = getState().inventory || [];
    inv.forEach(it=>{
      const def=findItemDef(it.name); if(!def || !def.useInCombat) return;
      const next = Battle.cooldowns[it.name] || 0;
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
  function closeItemModal(){ const m=$('#itemModal'); if(m) m.style.display='none'; }

  // ---------------- 戰鬥 UI ----------------
  function renderBattleBars(){
    const D=derived(); const p=getState().player;
    const php = D.hpMax ? clamp(p.hp/D.hpMax*100,0,100) : 0;
    const pmp = D.mpMax ? clamp(p.mp/D.mpMax*100,0,100) : 0;
    const phpEl = $('#playerHpBar'), pmpEl = $('#playerMpBar');
    if (phpEl) phpEl.style.width = php + '%';
    if (pmpEl) pmpEl.style.width = pmp + '%';

    if(Battle.enemy){
      const e=Battle.enemy;
      const ehp = e.hpMax ? clamp(e.hp/e.hpMax*100,0,100) : 0;
      const emp = e.mpMax ? clamp(e.mp/e.mpMax*100,0,100) : 0;
      const ehpEl = $('#enemyHpBar'), empEl = $('#enemyMpBar');
      if (ehpEl) ehpEl.style.width = ehp + '%';
      if (empEl) empEl.style.width = emp + '%';
      const title = $('#enemyHeaderTitle');
      if (title){ title.textContent = e.name; title.classList.add('title-xl'); }
    }else{
      const ehpEl = $('#enemyHpBar'), empEl = $('#enemyMpBar');
      if (ehpEl) ehpEl.style.width = '0%';
      if (empEl) empEl.style.width = '0%';
      const title = $('#enemyHeaderTitle');
      if (title){ title.textContent = '目前沒有敵人'; title.classList.add('title-xl'); }
    }
    renderTop?.();
  }
  function renderActBars(){
    const p = $('#playerActBar'), e = $('#enemyActBar');
    if (p) p.style.width = Battle.bars.player+'%';
    if (e) e.style.width = Battle.bars.enemy+'%';
  }

  function openWinModal(summaryHTML){
    const body=$('#winBody'); if (body) body.innerHTML = summaryHTML || '<div class="small">已獲勝。</div>';
    const m=$('#winModal'); if (m) m.style.display='grid';
  }

  // ---------------- 地圖 ----------------
  function openMapModal(){
    const list=$('#mapList'); if(!list) return;
    list.innerHTML='';
    const MAPS = window.MAPS || [];
    const MONSTER_DB = window.MONSTER_DB || {};
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
  function closeMapModal(){ const m=$('#mapModal'); if (m) m.style.display='none'; }
  function chooseMap(id){
    const MAPS = window.MAPS || [];
    Battle.map=id; closeMapModal();
    const m = MAPS.find(m=>m.id===id);
    const lab = $('#currentMapLabel'); if(lab) lab.textContent = '地圖：' + (m?.name || '未知');
    toast('已選擇地圖：' + (m?.name || '未知'));
  }

  // ---------------- 對外匯出（提供 ui 綁定） ----------------
  const api = {
    Battle,
    // life cycle
    startBattle, endBattle, tick,
    // actions
    playerAttack, enemyAct, useItemFromBag,
    // skills
    openSkillModal, closeSkillModal, castSkill,
    // map
    openMapModal, closeMapModal, chooseMap,
    // ui
    renderBattleBars, renderActBars, openWinModal,
    // helpers
    elementMultiplier, floatText
  };

  // 兩種方式同時匯出（相容舊碼與新碼）
  window.Battle = api;
  Object.entries(api).forEach(([k, v]) => { window[k] = v; });

  // 初始化：若 UI 已載入，可先刷新一次戰鬥條
  try { renderBattleBars(); renderActBars(); } catch {}
})();
