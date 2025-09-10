// stats.js — 負責屬性公式計算（全域共用）
(function(global){
function derivedFrom(player){
  var A = (player && player.attributes) ? player.attributes : {str:0, vit:0, dex:0, int:0, wis:0, luk:0};
  var L = (player && typeof player.level==='number') ? player.level : 1;
  if (L < 1) L = 1;

  // === 等級基礎成長 ===
  var hpLv   = 6    + Math.floor(L * 2/10);
  var mpLv   = Math.floor((L+1) / 2);
  var atkLv  = 1;
  var matkLv = (L <= 10) ? 1 : Math.floor((L-10)/4);
  var defLv  = Math.floor(L * 6/10);
  var mdfLv  = Math.floor(L * 6/10);
  var accLv  = Math.floor(L * 6/10);
  var evaLv  = Math.floor(L * 4/10);
  var crtLv  = Math.floor(L * 2/10);
  var crdLv  = Math.floor(L * 8/10);
  var spdLv  = Math.floor(L * 5/10);
  var rmpLv  = Math.floor(L * 2/10);
  var rhpLv  = Math.floor(L * 15/100);
  var penLv  = Math.floor(L * 2/10);
  var mpenLv = Math.floor(L * 2/10);

  var out = {
    '物理攻擊': (A.str*2 + L) + atkLv,
    '法術攻擊': (A.int*2 + Math.floor(A.wis*0.5)) + matkLv,
    '氣血上限': (80 + A.vit*12 + L*6) + hpLv,
    '真元上限': (40 + A.wis*10 + Math.floor(A.int*6/5)) + mpLv,
    '物理防禦': (Math.floor(A.vit*1.2) + Math.floor(A.dex*0.6)) + defLv,
    '法術防禦': (Math.floor(A.wis*1.3) + Math.floor(A.int*0.5)) + mdfLv,
    '命中率':   (60 + A.dex*2) + accLv,
    '閃避':     (5 + Math.floor(A.dex*1.2)) + evaLv,
    '暴擊率':   Math.min(50, (3 + Math.floor(A.luk*0.8) + crtLv)),
    '暴擊傷害': 50 + Math.floor(A.luk*1.5) + crdLv,
    '行動條速度': 100 + Math.floor(A.dex*2.2) + spdLv,
    '回氣/回合': 2 + Math.floor(A.wis*0.4) + rmpLv,
    '回血/回合': 1 + Math.floor(A.vit*0.5) + rhpLv,
    '破甲': Math.floor(A.str*0.6) + penLv,
    '法穿': Math.floor(A.int*0.6) + mpenLv
  };

  if (out['行動條速度'] < 40) out['行動條速度'] = 40;
  if (out['回氣/回合'] < 1) out['回氣/回合'] = 1;
  if (out['回血/回合'] < 0) out['回血/回合'] = 0;
  if (out['破甲'] < 0) out['破甲'] = 0;
  if (out['法穿'] < 0) out['法穿'] = 0;

  return out;
}

// ===== 🔥 新增：傷害計算函數 =====
function calcDamage(attacker, defender, skillData) {
  // 取得攻擊者和防禦者的屬性
  var attackerStats = derivedFrom(attacker);
  var defenderStats = derivedFrom(defender);
  
  // 預設為物理攻擊
  var damageType = (skillData && skillData.type) ? skillData.type : 'physical';
  var skillPower = (skillData && skillData.power) ? skillData.power : 1.0;
  
  var damage = 0;
  var isCritical = false;
  
  if (damageType === 'physical') {
    // 物理傷害計算
    var attack = attackerStats['物理攻擊'];
    var defense = defenderStats['物理防禦'];
    var penetration = attackerStats['破甲'];
    
    // 計算有效防禦力（破甲減少防禦）
    var effectiveDefense = Math.max(0, defense - penetration);
    
    // 基礎傷害 = 攻擊力 * 技能倍率 - 有效防禦
    damage = Math.max(1, Math.floor((attack * skillPower) - effectiveDefense));
    
  } else if (damageType === 'magical') {
    // 法術傷害計算
    var magicAttack = attackerStats['法術攻擊'];
    var magicDefense = defenderStats['法術防禦'];
    var magicPenetration = attackerStats['法穿'];
    
    // 計算有效法防
    var effectiveMagicDefense = Math.max(0, magicDefense - magicPenetration);
    
    // 基礎法術傷害
    damage = Math.max(1, Math.floor((magicAttack * skillPower) - effectiveMagicDefense));
  }
  
  // 暴擊判定
  var criticalChance = attackerStats['暴擊率'];
  var criticalRoll = Math.random() * 100;
  
  if (criticalRoll < criticalChance) {
    isCritical = true;
    var criticalDamage = attackerStats['暴擊傷害'];
    damage = Math.floor(damage * (100 + criticalDamage) / 100);
  }
  
  // 隨機浮動 ±10%
  var randomFactor = 0.9 + (Math.random() * 0.2);
  damage = Math.floor(damage * randomFactor);
  
  // 最少傷害為1
  damage = Math.max(1, damage);
  
  return {
    damage: damage,
    isCritical: isCritical,
    damageType: damageType
  };
}

// ===== 🎯 新增：命中判定函數 =====
function calcHitChance(attacker, defender) {
  var attackerStats = derivedFrom(attacker);
  var defenderStats = derivedFrom(defender);
  
  var accuracy = attackerStats['命中率'];
  var evasion = defenderStats['閃避'];
  
  // 命中率計算：基礎命中 - 對方閃避
  var hitChance = Math.max(5, Math.min(95, accuracy - evasion));
  
  var hitRoll = Math.random() * 100;
  return hitRoll < hitChance;
}

// ===== 🛡️ 新增：完整戰鬥計算函數 =====
function calculateBattleResult(attacker, defender, skillData) {
  // 先判定是否命中
  var isHit = calcHitChance(attacker, defender);
  
  if (!isHit) {
    return {
      hit: false,
      damage: 0,
      isCritical: false,
      message: "攻擊被閃避了！"
    };
  }
  
  // 計算傷害
  var damageResult = calcDamage(attacker, defender, skillData);
  
  return {
    hit: true,
    damage: damageResult.damage,
    isCritical: damageResult.isCritical,
    damageType: damageResult.damageType,
    message: damageResult.isCritical ? "暴擊！" : ""
  };
}

// 掛到全域，讓 game.html、map.html 都能直接用
global.derivedFrom = derivedFrom;
global.calcDamage = calcDamage;
global.calcHitChance = calcHitChance;
global.calculateBattleResult = calculateBattleResult;
})(window);