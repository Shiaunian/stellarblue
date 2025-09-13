/* ===== 戰鬥狀態管理模組 ===== */
window.BattleState = (function(){

// 戰鬥狀態變數
const ATB_MAX = 1000;
let battle = null;
let loop = null;

// ===== 狀態效果定義 =====
const STATUS_EFFECTS = {
  // 🎭 負面狀態 (Debuff)
  poison: {
    name: '中毒',
    type: 'debuff',
    icon: '☠️',
    color: '#8b5cf6',
    description: '每回合持續扣血',
    tickDamage: true,
    stackable: true
  },
  burn: {
    name: '灼燒',
    type: 'debuff', 
    icon: '🔥',
    color: '#f97316',
    description: '火焰持續傷害，降低防禦',
    tickDamage: true,
    statModifier: { '物理防禦': -0.2, '法術防禦': -0.2 }
  },
  bleed: {
    name: '流血',
    type: 'debuff',
    icon: '🩸', 
    color: '#ef4444',
    description: '物理攻擊造成的持續扣血',
    tickDamage: true
  },
  stun: {
    name: '暈眩',
    type: 'debuff',
    icon: '💫',
    color: '#fbbf24',
    description: '無法行動',
    disableActions: true
  },
  freeze: {
    name: '冰凍',
    type: 'debuff',
    icon: '🧊',
    color: '#38bdf8', 
    description: '完全無法動作',
    disableActions: true,
    disableATB: true
  },
  petrify: {
    name: '石化',
    type: 'debuff',
    icon: '🗿',
    color: '#a16207',
    description: '完全無法動作',
    disableActions: true,
    disableATB: true
  },
  silence: {
    name: '沉默',
    type: 'debuff',
    icon: '🤐',
    color: '#6b7280',
    description: '無法使用技能',
    disableSkills: true
  },
  slow: {
    name: '減速',
    type: 'debuff',
    icon: '🐌',
    color: '#94a3b8',
    description: '行動速度下降',
    statModifier: { '行動條速度': -0.3 }
  },
  weak: {
    name: '虛弱',
    type: 'debuff',
    icon: '💔',
    color: '#64748b',
    description: '攻擊力和防禦力下降',
    statModifier: { '物理攻擊': -0.25, '法術攻擊': -0.25, '物理防禦': -0.15, '法術防禦': -0.15 }
  },
  blind: {
    name: '致盲',
    type: 'debuff',
    icon: '👁️‍🗨️',
    color: '#374151',
    description: '命中率大幅下降',
    statModifier: { '命中率': -0.4 }
  },

  // 💪 正面狀態 (Buff)
  attack_up: {
    name: '攻擊強化',
    type: 'buff',
    icon: '⚔️',
    color: '#dc2626',
    description: '攻擊力提升',
    statModifier: { '物理攻擊': 0.3, '法術攻擊': 0.3 }
  },
  defense_up: {
    name: '防禦強化',
    type: 'buff',
    icon: '🛡️',
    color: '#1d4ed8',
    description: '防禦力提升',
    statModifier: { '物理防禦': 0.3, '法術防禦': 0.3 }
  },
  speed_up: {
    name: '加速',
    type: 'buff',
    icon: '💨',
    color: '#22d3ee',
    description: '行動速度提升',
    statModifier: { '行動條速度': 0.4 }
  },
  crit_up: {
    name: '暴擊強化',
    type: 'buff',
    icon: '💥',
    color: '#fbbf24',
    description: '暴擊率提升',
    statModifier: { '暴擊率': 0.2 }
  },
  shield: {
    name: '護盾',
    type: 'buff',
    icon: '🔰',
    color: '#06b6d4',
    description: '吸收一定傷害',
    absorbDamage: true
  },
  invincible: {
    name: '無敵',
    type: 'buff',
    icon: '✨',
    color: '#a78bfa',
    description: '免疫一切攻擊',
    immuneToAttack: true
  },
  regen: {
    name: '再生',
    type: 'buff',
    icon: '💚',
    color: '#22c55e',
    description: '每回合回復血量',
    tickHeal: true
  },
  immunity: {
    name: '狀態免疫',
    type: 'buff',
    icon: '🛡️',
    color: '#8b5cf6',
    description: '免疫負面狀態',
    immuneToDebuff: true
  },
  berserk: {
    name: '狂暴',
    type: 'buff',
    icon: '😡',
    color: '#b91c1c',
    description: '血量越低攻擊越高',
    dynamicModifier: function(currentHp, maxHp) {
      var hpRate = currentHp / maxHp;
      var atkBonus = (1 - hpRate) * 0.8;
      return { '物理攻擊': atkBonus, '法術攻擊': atkBonus, '物理防禦': -0.3, '法術防禦': -0.3 };
    }
  }
};

// ===== 戰鬥初始化 =====
function startBattle(enemy, area, playerData) {
  if (!enemy || !area || !playerData) {
    console.error('❌ startBattle: 缺少必要參數');
    return false;
  }

  // 顯示戰鬥區
  var mapSection = document.querySelector('#mapSection');
  var battleSection = document.querySelector('#battleSection');
  if (mapSection) mapSection.style.display = 'none';
  if (battleSection) battleSection.classList.add('show');
  
  if (loop) { clearInterval(loop); loop = null; }

  // 玩家衍生值快照
  if (typeof window.refreshLive === 'function') window.refreshLive();
  var d = (playerData && playerData._live) ? playerData._live : {};

  // 取怪物衍生表
  var dMon = null;
  try {
    if (window.MonsterDB && MonsterDB.getDerived) {
      dMon = MonsterDB.getDerived(enemy.id) || null;
    }
  } catch (_err) { dMon = null; }

  function pickD(key, fallback) {
    var v = (dMon && typeof dMon[key] === 'number') ? dMon[key] : fallback;
    return (typeof v === 'number') ? v : (fallback || 0);
  }

var eStats = {
  '物理攻擊': (enemy.stats && typeof enemy.stats.atk === 'number') ? enemy.stats.atk : 10,
  '法術攻擊': (enemy.stats && typeof enemy.stats.matk === 'number') ? enemy.stats.matk : 10,
  '物理防禦': (enemy.stats && typeof enemy.stats.def === 'number') ? enemy.stats.def : 8,
  '法術防禦': (enemy.stats && typeof enemy.stats.mdef === 'number') ? enemy.stats.mdef : 8,
  '命中率': (enemy.stats && typeof enemy.stats.acc === 'number') ? enemy.stats.acc : 75,
  '閃避': (enemy.stats && typeof enemy.stats.eva === 'number') ? enemy.stats.eva : 5,
  '暴擊率': (enemy.stats && typeof enemy.stats.crit === 'number') ? Math.min(100, enemy.stats.crit) : 3,
  '暴擊傷害': 150, // 預設暴擊傷害倍率
  '行動條速度': (enemy.stats && typeof enemy.stats.aspd === 'number') ? Math.round(100 * enemy.stats.aspd) : 100,
  '破甲': (enemy.extra && typeof enemy.extra.armorPen === 'number') ? enemy.extra.armorPen : 0,
  '法穿': 0 // 預設法術穿透
};


  // 初始化戰鬥狀態
  battle = {
    enemy: enemy,
    enemyStats: eStats,
    p: {
      hp: (playerData && playerData.hp && typeof playerData.hp.cur === 'number') ? playerData.hp.cur : 100,
      hpMax: (playerData && playerData.hp && typeof playerData.hp.max === 'number') ? playerData.hp.max : 100,
      mp: (playerData && playerData.mp && typeof playerData.mp.cur === 'number') ? playerData.mp.cur : 0,
      mpMax: (playerData && playerData.mp && typeof playerData.mp.max === 'number') ? playerData.mp.max : 0,
      atb: 0,
      speed: (d && typeof d['行動條速度'] === 'number') ? d['行動條速度'] : 100,
      statusEffects: [],
      originalStats: JSON.parse(JSON.stringify(d))
    },
    e: {
      hp: pickD('氣血上限', 100),
      hpMax: pickD('氣血上限', 100),
      atb: 0,
      speed: pickD('行動條速度', 100),
      statusEffects: [],
      originalStats: JSON.parse(JSON.stringify(eStats))
    },
    turn: 'none',
    over: false,
    dotTimers: []
  };

  console.log('🎮 戰鬥開始:', enemy.name, 'vs', playerData.name);
  
  // 開始 ATB 循環
  loop = setInterval(tickATB, 60);
  return true;
}

// ===== ATB 系統 tick =====
function tickATB() {
  if (!battle || battle.over) return;
  
  var playerDisabled = isDisabled('player');
  var enemyDisabled = isDisabled('enemy');

  if (battle.p.atb >= ATB_MAX && !playerDisabled) {
    if (typeof window.updateCmdEnabled === 'function') window.updateCmdEnabled();
    if (typeof window.updateBattleBars === 'function') window.updateBattleBars();
    return;
  }

  var spP = getEffectiveSpeed('player');
  var spE = getEffectiveSpeed('enemy');
  
  // ★ 添加調試信息
  if (Math.random() < 0.01) { // 1% 機率顯示調試信息
    console.log('🐛 速度調試:', {
      playerSpeed: spP,
      enemySpeed: spE,
      playerATB: battle.p.atb,
      enemyATB: battle.e.atb
    });
  }
  
  // 🎯 使用相對速度系統
  var pStep = playerDisabled ? 0 : (window.calculateATBStep ? window.calculateATBStep(spP, spE, 'player') : Math.max(1, Math.round(spP / 10)));
  var eStep = enemyDisabled ? 0 : (window.calculateATBStep ? window.calculateATBStep(spP, spE, 'enemy') : Math.max(1, Math.round(spE / 10)));


  battle.p.atb = clamp(battle.p.atb + pStep, 0, ATB_MAX);
  battle.e.atb = clamp(battle.e.atb + eStep, 0, ATB_MAX);

  if (typeof window.updateBattleBars === 'function') window.updateBattleBars();
  if (typeof window.updateCmdEnabled === 'function') window.updateCmdEnabled();

  if (battle.e.atb >= ATB_MAX && !enemyDisabled) {
    if (typeof window.enemyAttack === 'function') window.enemyAttack();
    battle.e.atb = 0;
    if (typeof window.updateBattleBars === 'function') window.updateBattleBars();
  }

  processStatusTick();
}


// ===== 狀態效果管理 =====
function addStatusEffect(target, effectId, duration, power, source) {
  if (!battle || !STATUS_EFFECTS[effectId]) return false;
  
  var targetData = (target === 'player') ? battle.p : battle.e;
  var effect = STATUS_EFFECTS[effectId];
  
  if (effect.type === 'debuff' && hasStatusEffect(target, 'immunity')) {
    if (typeof window.log === 'function') {
      var targetName = (target === 'player') ? '你' : battle.enemy.name;
      window.log(targetName + ' 免疫了 ' + effect.name + '！', 'ok');
    }
    return false;
  }

  var existing = targetData.statusEffects.find(function(e) { return e.id === effectId; });
  if (existing) {
    if (effect.stackable) {
      existing.stacks = (existing.stacks || 1) + 1;
      existing.duration = Math.max(existing.duration, duration || 3);
      existing.power = (existing.power || 0) + (power || 0);
    } else {
      existing.duration = duration || 3;
      existing.power = power || existing.power || 0;
    }
  } else {
    targetData.statusEffects.push({
      id: effectId,
      duration: duration || 3,
      power: power || 0,
      stacks: 1,
      source: source || 'unknown'
    });
  }

  recalculateStats(target);
  
  if (typeof window.log === 'function') {
    var targetName = (target === 'player') ? '你' : battle.enemy.name;
    var stackText = (existing && effect.stackable) ? ' (堆疊 ' + existing.stacks + ')' : '';
    window.log(targetName + ' 獲得了 ' + effect.name + stackText + '！', effect.type === 'buff' ? 'ok' : 'warn');
  }

  return true;
}

function removeStatusEffect(target, effectId) {
  if (!battle) return false;
  
  var targetData = (target === 'player') ? battle.p : battle.e;
  var index = targetData.statusEffects.findIndex(function(e) { return e.id === effectId; });
  
  if (index !== -1) {
    var effect = STATUS_EFFECTS[effectId];
    targetData.statusEffects.splice(index, 1);
    recalculateStats(target);
    
    if (typeof window.log === 'function') {
      var targetName = (target === 'player') ? '你' : battle.enemy.name;
      window.log(targetName + ' 的 ' + effect.name + ' 效果消失了。');
    }
    return true;
  }
  return false;
}

function hasStatusEffect(target, effectId) {
  if (!battle) return false;
  var targetData = (target === 'player') ? battle.p : battle.e;
  return targetData.statusEffects.some(function(e) { return e.id === effectId; });
}

function isDisabled(target) {
  if (!battle) return false;
  var targetData = (target === 'player') ? battle.p : battle.e;
  return targetData.statusEffects.some(function(e) {
    var effect = STATUS_EFFECTS[e.id];
    return effect && (effect.disableActions || effect.disableATB);
  });
}

function canUseSkills(target) {
  if (!battle) return true;
  var targetData = (target === 'player') ? battle.p : battle.e;
  return !targetData.statusEffects.some(function(e) {
    var effect = STATUS_EFFECTS[e.id];
    return effect && effect.disableSkills;
  });
}

// ===== 屬性重新計算 =====
function recalculateStats(target) {
  if (!battle) return;
  
  var targetData = (target === 'player') ? battle.p : battle.e;
  var originalStats = targetData.originalStats;
  var modifiedStats = JSON.parse(JSON.stringify(originalStats));

  targetData.statusEffects.forEach(function(statusEffect) {
    var effect = STATUS_EFFECTS[statusEffect.id];
    if (!effect) return;

    if (effect.statModifier) {
      Object.keys(effect.statModifier).forEach(function(stat) {
        var modifier = effect.statModifier[stat];
        var stacks = statusEffect.stacks || 1;
        if (modifiedStats[stat] !== undefined) {
          modifiedStats[stat] += originalStats[stat] * modifier * stacks;
        }
      });
    }

    if (effect.dynamicModifier && typeof effect.dynamicModifier === 'function') {
      var dynamicMods = effect.dynamicModifier(targetData.hp, targetData.hpMax);
      Object.keys(dynamicMods).forEach(function(stat) {
        var modifier = dynamicMods[stat];
        if (modifiedStats[stat] !== undefined) {
          modifiedStats[stat] += originalStats[stat] * modifier;
        }
      });
    }
  });

  if (target === 'player') {
    if (window.P && window.P._live) {
      Object.keys(modifiedStats).forEach(function(stat) {
        window.P._live[stat] = Math.max(0, Math.round(modifiedStats[stat]));
      });
    }
  } else {
    Object.keys(modifiedStats).forEach(function(stat) {
      var enemyStatKey = getEnemyStatKey(stat);
      if (enemyStatKey && battle.enemyStats[enemyStatKey] !== undefined) {
        battle.enemyStats[enemyStatKey] = Math.max(0, Math.round(modifiedStats[stat]));
      }
    });
  }
}

function getEnemyStatKey(stat) {
  var mapping = {
    '物理攻擊': 'atk',
    '法術攻擊': 'matk', 
    '物理防禦': 'def',
    '法術防禦': 'mdef',
    '命中率': 'acc',
    '閃避': 'eva',
    '暴擊率': 'crit',
    '行動條速度': 'aspd',
    '破甲': 'pen'
  };
  return mapping[stat];
}

function getEffectiveSpeed(target) {
  if (!battle) return 100;
  
  if (target === 'player') {
    return (window.P && window.P._live && typeof window.P._live['行動條速度'] === 'number') 
      ? window.P._live['行動條速度'] : 100;
  } else {
    // ★ 修正：現在使用中文鍵值
    return (battle.enemyStats && typeof battle.enemyStats['行動條速度'] === 'number') 
      ? battle.enemyStats['行動條速度'] : 100;
  }
}



// ===== 狀態效果 tick 處理 =====
function processStatusTick() {
  if (!battle || battle.over) return;

  ['player', 'enemy'].forEach(function(target) {
    var targetData = (target === 'player') ? battle.p : battle.e;
    var toRemove = [];

    targetData.statusEffects.forEach(function(statusEffect, index) {
      var effect = STATUS_EFFECTS[statusEffect.id];
      if (!effect) return;

      if (effect.tickDamage && statusEffect.power > 0) {
        var damage = Math.max(1, statusEffect.power * (statusEffect.stacks || 1));
        targetData.hp = Math.max(0, targetData.hp - damage);
        
        if (typeof window.showHit === 'function') {
          window.showHit(target, damage, false, 'hit');
        }
        if (typeof window.log === 'function') {
          var targetName = (target === 'player') ? '你' : battle.enemy.name;
          window.log('【' + effect.name + '】' + targetName + ' 受到 ' + damage + ' 點傷害', 'warn');
        }
      }

      if (effect.tickHeal && statusEffect.power > 0) {
        var heal = Math.max(1, statusEffect.power * (statusEffect.stacks || 1));
        targetData.hp = Math.min(targetData.hpMax, targetData.hp + heal);
        
        if (typeof window.showHit === 'function') {
          window.showHit(target, heal, false, 'heal');
        }
        if (typeof window.log === 'function') {
          var targetName = (target === 'player') ? '你' : battle.enemy.name;
          window.log('【' + effect.name + '】' + targetName + ' 回復 ' + heal + ' 點血量', 'ok');
        }
      }

      statusEffect.duration--;
      if (statusEffect.duration <= 0) {
        toRemove.push(index);
      }
    });

    for (var i = toRemove.length - 1; i >= 0; i--) {
      var effectToRemove = targetData.statusEffects[toRemove[i]];
      var effect = STATUS_EFFECTS[effectToRemove.id];
      targetData.statusEffects.splice(toRemove[i], 1);
      
      if (typeof window.log === 'function') {
        var targetName = (target === 'player') ? '你' : battle.enemy.name;
        window.log(targetName + ' 的 ' + effect.name + ' 效果消失了。');
      }
    }

    if (toRemove.length > 0) {
      recalculateStats(target);
    }
  });

  if (typeof window.endCheck === 'function') {
    window.endCheck();
  }
  if (typeof window.updateBattleBars === 'function') {
    window.updateBattleBars();
  }
}

// ===== 傷害處理 =====
function processDamage(target, damage, damageType) {
  if (!battle) return damage;
  
  var targetData = (target === 'player') ? battle.p : battle.e;
  var finalDamage = damage;

  if (hasStatusEffect(target, 'invincible')) {
    if (typeof window.log === 'function') {
      var targetName = (target === 'player') ? '你' : battle.enemy.name;
      window.log(targetName + ' 處於無敵狀態，免疫了攻擊！', 'ok');
    }
    return 0;
  }

  var shieldEffect = targetData.statusEffects.find(function(e) { return e.id === 'shield'; });
  if (shieldEffect && shieldEffect.power > 0) {
    var absorbed = Math.min(finalDamage, shieldEffect.power);
    shieldEffect.power -= absorbed;
    finalDamage -= absorbed;
    
    if (typeof window.log === 'function') {
      var targetName = (target === 'player') ? '你' : battle.enemy.name;
      window.log(targetName + ' 的護盾吸收了 ' + absorbed + ' 點傷害！', 'ok');
    }
    
    if (shieldEffect.power <= 0) {
      removeStatusEffect(target, 'shield');
    }
  }

  return Math.max(0, finalDamage);
}

// ===== 戰鬥狀態更新 =====
function updateBattleBars() {
  if (!battle) return;
  
  var pHpEl = document.querySelector('#pHp');
  var eHpEl = document.querySelector('#eHp');
  var pATBEl = document.querySelector('#pATB');
  var eATBEl = document.querySelector('#eATB');
  var btStateEl = document.querySelector('#btState');

  if (pHpEl) pHpEl.style.width = pct(battle.p.hp, battle.p.hpMax) + '%';
  if (eHpEl) eHpEl.style.width = pct(battle.e.hp, battle.e.hpMax) + '%';
  if (pATBEl) pATBEl.style.width = pct(battle.p.atb, ATB_MAX) + '%';
  if (eATBEl) eATBEl.style.width = pct(battle.e.atb, ATB_MAX) + '%';
  
  if (btStateEl) {
    btStateEl.textContent = battle.over ? '戰鬥結束' : 
      (battle.p.atb >= ATB_MAX ? '輪到你行動' : '等待行動條…');
  }

  if (window.P && window.P.hp) {
    window.P.hp.cur = battle.p.hp;
    window.P.hp.max = battle.p.hpMax;
  }
  if (window.P && window.P.mp) {
    window.P.mp.cur = battle.p.mp || window.P.mp.cur || 0;
    window.P.mp.max = battle.p.mpMax || window.P.mp.max || 0;
  }
  
  if (typeof window.renderBars === 'function') {
    window.renderBars();
  }
}

function updateCmdEnabled() {
  if (!battle) return;
  
  var canAct = !battle.over && battle.p.atb >= ATB_MAX && !isDisabled('player');
  var canUseSkill = canAct && canUseSkills('player');
  
  var buttons = ['actAttack', 'actItem', 'actRun'];
  buttons.forEach(function(id) {
    var btn = document.querySelector('#' + id);
    if (btn) btn.disabled = !canAct;
  });
  
  var skillBtn = document.querySelector('#actSkill');
  if (skillBtn) skillBtn.disabled = !canUseSkill;
}

// ===== 戰鬥結束 =====
function finishBattle() {
  if (!battle) return;
  
  battle.over = true;
  if (loop) { clearInterval(loop); loop = null; }
  
  if (battle.dotTimers && Array.isArray(battle.dotTimers)) {
    for (var i = 0; i < battle.dotTimers.length; i++) {
      try { clearInterval(battle.dotTimers[i]); } catch (e) { }
    }
    battle.dotTimers.length = 0;
  }
  
  updateBattleBars();
  updateCmdEnabled();
  
  var leaveBattleBtn = document.querySelector('#btnLeaveBattle');
  if (leaveBattleBtn) leaveBattleBtn.style.display = 'none';
}

function leaveBattle() {
  var battleSection = document.querySelector('#battleSection');
  var mapSection = document.querySelector('#mapSection');
  var leaveBattleBtn = document.querySelector('#btnLeaveBattle');
  
  if (battleSection) battleSection.classList.remove('show');
  if (leaveBattleBtn) leaveBattleBtn.style.display = 'none';
  if (mapSection) mapSection.style.display = 'grid';
  
  battle = null;
}

// ===== 工具函數 =====
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function pct(cur, max) {
  return (max > 0 ? clamp(Math.round(cur / max * 100), 0, 100) : 0);
}

// ===== 對外接口 =====
return {
  // 核心功能
  startBattle: startBattle,
  finishBattle: finishBattle,
  leaveBattle: leaveBattle,
  tickATB: tickATB,
  
  // 狀態效果管理
  addStatusEffect: addStatusEffect,
  removeStatusEffect: removeStatusEffect,
  hasStatusEffect: hasStatusEffect,
  isDisabled: isDisabled,
  canUseSkills: canUseSkills,
  
  // 戰鬥狀態更新
  updateBattleBars: updateBattleBars,
  updateCmdEnabled: updateCmdEnabled,
  
  // 傷害處理
  processDamage: processDamage,
  
  // 工具函數
  getBattle: function() { return battle; },
  getStatusEffects: function() { return STATUS_EFFECTS; }
};

})();