// skills.js — 技能資料庫（含清楚數值說明＋灼燒狀態）
window.SkillDB = (()=>{
  const TYPE_LABEL = { physical:'物理', magic:'法術', support:'輔助' };
  const ELEM_LABEL = { none:'無', water:'水', fire:'火' };

// skills.js — 技能資料庫（含清楚數值說明＋灼燒狀態）
window.SkillDB = (()=>{
  const TYPE_LABEL = { physical:'物理', magic:'法術', support:'輔助' };
  const ELEM_LABEL = { none:'無', water:'水', fire:'火' };

  // === 1) 技能定義 ===
  const SKILLS = {
    fireball: {
      id:'fireball',
      name:'火球術',
      icon:'https://i.ibb.co/2dqVvkr/fireball.png',
      elem:'fire',
      type:'magic',
      cost:{ mp:8 },
      cd:0,
      scale:{ stat:'法術攻擊', ratio:1.10 },
      effects:{
        burn:{ chance:0.20, name:'一度燒傷', dps:2, durationMs:20000 } // 20秒 × 每秒2
      },
      desc:'造成 110% 火屬性法術傷害；消耗真元 8。20% 使目標【一度燒傷】：持續 20 秒，每秒 -2 氣血。'
    },
    iai_slash: {
      id:'iai_slash',
      name:'拔刀斬',
      icon:'https://i.ibb.co/ZGN3WCH/iai.png',
      elem:'none',
      type:'physical',
      cost:{ mp:6 },
      cd:0,
      scale:{ stat:'物理攻擊', ratio:1.20 },
      desc:'造成 120% 無屬性物理傷害；消耗真元 6。'
    }
  };

  // === 2) Utils ===
  const get = id => SKILLS[id];
  const list = (ids)=> (ids||Object.keys(SKILLS)).map(get);
  const fmt = n => (typeof n==='number' ? new Intl.NumberFormat('zh-Hant').format(n) : n);

  // === 3) 戰鬥計算 ===
  function canUse(P, skill){
    return (P?.mp?.cur||0) >= (skill?.cost?.mp||0);
  }
  function consumeCost(P, skill){
    if (!P?.mp) return;
    const need = skill?.cost?.mp||0;
    P.mp.cur = Math.max(0, (P.mp.cur||0) - need);
  }
function calcDamage(P, skill, enemyStats){
  const D = (typeof getDerivedTotal==='function')
              ? getDerivedTotal(P)
              : ((typeof derivedFrom==='function') ? derivedFrom(P) : {});
  const atk = D[skill.scale.stat] || 1;
  let base = Math.max(1, Math.round(atk * (skill.scale.ratio||1)));


  // 若沒有全域表，使用完整預設（八元素）
  const table = (window.ELEM_MUL || {
  none:  { none:1, gold:1,   wood:1,    water:1,    fire:1,    earth:1,   spirit:1,   dark:1 },
  gold:  { none:1, gold:1,   wood:1.25, water:1,    fire:0.75, earth:1,   spirit:1,   dark:1 },
  wood:  { none:1, gold:0.75,wood:1,    water:1,    fire:0.75, earth:1.25,spirit:1,   dark:1 },
  water: { none:1, gold:1,   wood:1,    water:1,    fire:1.25, earth:0.75,spirit:1,   dark:1 },
  fire:  { none:1, gold:1.25,wood:1.25, water:0.75, fire:1,    earth:1,   spirit:1,   dark:1 },
  earth: { none:1, gold:1,   wood:0.75, water:1.25, fire:1,    earth:1,   spirit:1,   dark:1 },
  spirit:{ none:1, gold:1,   wood:1,    water:1,    fire:1,    earth:1,   spirit:1,   dark:1.25 },
  dark:  { none:1, gold:1,   wood:1,    water:1,    fire:1,    earth:1,   spirit:1.25,dark:1 },
});

  const stab = (typeof window.STAB==='number' ? window.STAB : 1.00);

  const atkElem = (P?.element || 'none');
  const dmgElem = skill.elem || atkElem;
  const defElem = enemyStats?.elem || enemyStats?.element || 'none';

  const mul = (table[dmgElem] && table[dmgElem][defElem]) || 1;
  const same = (dmgElem!=='none' && dmgElem===atkElem) ? stab : 1;

  return Math.max(1, Math.round(base * mul * same));
}

  // 擲出「命中時效果」
  function rollOnHit(skill){
    const b = skill?.effects?.burn;
    if (b && Math.random() < (b.chance||0)) {
      return { type:'burn1', name:b.name||'燒傷', dps:b.dps||1, durationMs:b.durationMs||5000 };
    }
    return null;
  }

  // === 4) 說明文字（可帶入玩家算出實際數值） ===
  function describeFor(P, skill){
    if (!skill) return '';
    const kind = TYPE_LABEL[skill.type] || '';
    const elem = ELEM_LABEL[skill.elem] || '';
    const base = calcDamage(P, skill);
    const parts = [];
    parts.push(`造成${elem}${kind}傷害 ${fmt(base)}`);
    if (skill.effects?.burn){
      const b = skill.effects.burn;
      const sec = Math.round((b.durationMs||0)/1000);
      const total = (b.dps||0) * sec;
      parts.push(`${Math.round((b.chance||0)*100)}% 使目標${b.name||'燒傷'}（${sec}秒，每秒 -${fmt(b.dps||0)}，合計 -${fmt(total)}）`);
    }
    if (skill.cost?.mp) parts.push(`消耗真元 ${fmt(skill.cost.mp)}`);
    if (skill.cd>0) parts.push(`冷卻 ${fmt(skill.cd)} 回合`);
    return parts.join(' / ');
  }

  return { get, list, canUse, consumeCost, calcDamage, rollOnHit, describeFor };
})();

  // === 2) Utils ===
  const get = id => SKILLS[id];
  const list = (ids)=> (ids||Object.keys(SKILLS)).map(get);
  const fmt = n => (typeof n==='number' ? new Intl.NumberFormat('zh-Hant').format(n) : n);

  // === 3) 戰鬥計算 ===
  function canUse(P, skill){
    return (P?.mp?.cur||0) >= (skill?.cost?.mp||0);
  }
  function consumeCost(P, skill){
    if (!P?.mp) return;
    const need = skill?.cost?.mp||0;
    P.mp.cur = Math.max(0, (P.mp.cur||0) - need);
  }
  function calcDamage(P, skill, enemyStats){
    const D = (typeof derivedFrom==='function') ? derivedFrom(P) : {};
    const atk = D[skill.scale.stat] || 1;
    let dmg = Math.max(1, Math.round(atk * (skill.scale.ratio||1)));
    // 可選：簡單相剋示例（火→冰）
    if (skill.elem==='fire' && enemyStats?.elem==='ice') dmg = Math.round(dmg*1.25);
    return dmg;
  }

  // 擲出「命中時效果」
  function rollOnHit(skill){
    const b = skill?.effects?.burn;
    if (b && Math.random() < (b.chance||0)) {
      return { type:'burn1', name:b.name||'燒傷', dps:b.dps||1, durationMs:b.durationMs||5000 };
    }
    return null;
  }

  // === 4) 說明文字（可帶入玩家算出實際數值） ===
  function describeFor(P, skill){
    if (!skill) return '';
    const kind = TYPE_LABEL[skill.type] || '';
    const elem = ELEM_LABEL[skill.elem] || '';
    const base = calcDamage(P, skill);
    const parts = [];
    parts.push(`造成${elem}${kind}傷害 ${fmt(base)}`);
    if (skill.effects?.burn){
      const b = skill.effects.burn;
      const sec = Math.round((b.durationMs||0)/1000);
      const total = (b.dps||0) * sec;
      parts.push(`${Math.round((b.chance||0)*100)}% 使目標${b.name||'燒傷'}（${sec}秒，每秒 -${fmt(b.dps||0)}，合計 -${fmt(total)}）`);
    }
    if (skill.cost?.mp) parts.push(`消耗真元 ${fmt(skill.cost.mp)}`);
    if (skill.cd>0) parts.push(`冷卻 ${fmt(skill.cd)} 回合`);
    return parts.join(' / ');
  }

  return { get, list, canUse, consumeCost, calcDamage, rollOnHit, describeFor };
})();
