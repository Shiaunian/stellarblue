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
// ===== 自動回復系統（基於角色屬性） =====
window.AutoRecovery = (function(){
  var timers = { hp: null, mp: null, sta: null, stone: null };
  var isActive = false;

  function start(gameAPI){
    if (isActive) stop(); // 避免重複啟動
    
    var getPlayer = gameAPI.getPlayer || function(){ return null; };
    var save = gameAPI.save || function(){};
    var log = gameAPI.log || function(){};
    var updateUI = gameAPI.updateUI || function(){};

    // 氣血回復：每5秒
    timers.hp = setInterval(function(){
      var P = getPlayer(); if (!P || !P.hp) return;
      var base = derivedFrom(P);
      var bonus = gameAPI.getBonuses ? gameAPI.getBonuses() : {};
      var hpMax = (base['氣血上限'] || 0) + (bonus['氣血上限'] || 0);
      
      if (P.hp.cur < hpMax) {
        var recover = Math.max(1, base['回血/回合'] || 1);
        P.hp.cur = Math.min(P.hp.cur + recover, hpMax);
        log('氣血回復 +' + recover + '（' + P.hp.cur + '/' + hpMax + '）', 'ok');
        updateUI(); save();
      }
    }, 5000);

    // 真元回復：每10秒
    timers.mp = setInterval(function(){
      var P = getPlayer(); if (!P || !P.mp) return;
      var base = derivedFrom(P);
      var bonus = gameAPI.getBonuses ? gameAPI.getBonuses() : {};
      var mpMax = (base['真元上限'] || 0) + (bonus['真元上限'] || 0);
      
      if (P.mp.cur < mpMax) {
        var recover = Math.max(1, base['回氣/回合'] || 1);
        P.mp.cur = Math.min(P.mp.cur + recover, mpMax);
        log('真元回復 +' + recover + '（' + P.mp.cur + '/' + mpMax + '）', 'ok');
        updateUI(); save();
      }
    }, 10000);

    // 體力回復：每1分鐘+1
    timers.sta = setInterval(function(){
      var P = getPlayer(); if (!P || !P.sta) return;
      if (P.sta.cur < P.sta.max) {
        P.sta.cur = Math.min(P.sta.cur + 1, P.sta.max);
        log('體力回復 +1（' + P.sta.cur + '/' + P.sta.max + '）', 'ok');
        updateUI(); save();
      }
    }, 60000);

    // 靈石收入：每1分鐘
    timers.stone = setInterval(function(){
      var P = getPlayer(); if (!P || !P.currencies) return;
      var gain = Math.max(1, Math.floor(P.level || 1));
      P.currencies.stone = (P.currencies.stone || 0) + gain;
      log('靈石收入 +' + gain + '（修煉所得）', 'ok');
      updateUI(); save();
    }, 60000);

    isActive = true;
    log('開始自動修煉回復...', 'info');
  }

  function stop(){
    Object.keys(timers).forEach(function(k){
      if (timers[k]) clearInterval(timers[k]);
      timers[k] = null;
    });
    isActive = false;
  }

  return { start: start, stop: stop, isActive: function(){ return isActive; } };
})();



// ===== 🌟 元素系統（18屬性版） =====
window.ELEMENT_LABEL = {
  none:'無', fire:'火', water:'水', grass:'草',
  thunder:'雷', body:'體', poison:'毒', earth:'土',
  wind:'風', mind:'超', bug:'蟲', rock:'岩',
  soul:'魂', ice:'冰', dragon:'龍', dark:'暗',
  steel:'鋼', demon:'妖'
};

// 攻擊方「剋制」與「被剋制」清單
window.ELEM_STRONG = {
  none: [],
  fire:    ['grass','ice','bug','steel'],
  water:   ['fire','earth','rock'],
  grass:   ['water','earth','rock'],
  thunder: ['wind','water'],
  body:    ['dark','ice','rock','steel','none'],
  poison:  ['grass','demon'],
  earth:   ['fire','thunder','poison','rock','steel'],
  wind:    ['grass','body','bug'],
  mind:    ['body','poison'],
  bug:     ['mind','grass','dark'],
  rock:    ['fire','ice','bug','wind'],
  soul:    ['soul','mind'],
  ice:     ['dragon','wind','grass','earth'],
  dragon:  ['dragon'],
  dark:    ['soul','mind'],
  steel:   ['demon','rock','ice'],
  demon:   ['dark','dragon','body']
};

window.ELEM_WEAK = {
  none:    ['body'], // 無元素被體剋
  fire:    ['water','earth','rock'],
  water:   ['thunder','grass'],
  grass:   ['fire','ice','poison','wind','bug'],
  thunder: ['earth'],
  body:    ['wind','mind','demon'],
  poison:  ['earth','mind'],
  earth:   ['water','grass','ice'],
  wind:    ['thunder','ice','rock'],
  mind:    ['bug','soul','dark'],
  bug:     ['fire','wind','rock'],
  rock:    ['water','grass','body','earth','steel'],
  soul:    ['soul','dark'],
  ice:     ['fire','body','rock','steel'],
  dragon:  ['ice','dragon','demon'],
  dark:    ['body','bug','demon'],
  steel:   ['fire','body','earth'], // 修正：直接用 fire
  demon:   ['poison','steel']
};

// 倍率常數（可微調）
window.ELEM_MUL_STRONG = 1.2;
window.ELEM_MUL_WEAK   = 0.8;
window.ELEM_MUL_NEUT   = 1.0;
window.ELEM_MUL_DOUBLE_STRONG = 2.0;

// 本源加成（同屬性 / 異屬性）
window.STAB_SAME = 1.15;   // 同屬性加成
window.STAB_DIFF = 1.0;    // 異屬性無加成
window.STAB = window.STAB_SAME; // 舊版相容

// ===== 🔥 元素克制計算函數 =====
window.getElemMultiplier = function(atkElem, defElems){
  if (!atkElem || atkElem==='none') return 1.0; // 無元素攻擊一律中性

  var defs = Array.isArray(defElems) ? defElems.slice(0) : [defElems];
  var cleaned = [];
  for (var i=0;i<defs.length;i++){ 
    if(defs[i] && defs[i]!=='none') cleaned.push(defs[i]); 
  }
  if (cleaned.length===0) return 1.0;

  var strong = window.ELEM_STRONG[atkElem] || [];
  var weak   = window.ELEM_WEAK[atkElem]   || [];

  var s=0,w=0,i=0;
  for(i=0;i<cleaned.length;i++){
    var d = cleaned[i];
    var j=0,hitS=false,hitW=false;
    for(j=0;j<strong.length;j++){ if(strong[j]===d){ hitS=true; break; } }
    for(j=0;j<weak.length;j++){ if(weak[j]===d){ hitW=true; break; } }
    if (hitS) s=s+1;
    if (hitW) w=w+1;
  }

  if (s>=2) return window.ELEM_MUL_DOUBLE_STRONG; // 兩個都被剋制
  if (s>=1 && w>=1) return window.ELEM_MUL_NEUT;  // 一剋一抵
  if (s>=1) return window.ELEM_MUL_STRONG;        // 一剋一無關
  if (w>=1) return window.ELEM_MUL_WEAK;
  return window.ELEM_MUL_NEUT;
};

// 舊函式相容：單/雙防禦元素都可
window.elemMult = function(atkElem, defElemOrElems){
  return window.getElemMultiplier(atkElem, defElemOrElems);
};

// 顯示相剋說明（摘要）
window.elemRelationText = function(atkElem, defElem, elemMul, stabMul){
  // 只有克制/受克才顯示；相同或中性不顯示
  var m = (typeof elemMul === 'number') ? elemMul : 1;
  if (m === 1) return '';
  var label = (m > 1) ? '克制' : '受克';
  var pct   = Math.round(Math.abs(m - 1) * 100);
  return '（' + label + ' ' + (m>1?'+':'-') + pct + '%）';
};

// 元素關係摘要（用於技能說明等）
window.elemSummaryText = function(atk){
  var strong = window.ELEM_STRONG[atk] || [];
  var weak   = window.ELEM_WEAK[atk]   || [];
  var s = strong.map(function(k){ return window.ELEMENT_LABEL[k]||k; }).join('、');
  var w = weak.map(function(k){ return window.ELEMENT_LABEL[k]||k; }).join('、');
  return '攻克：' + (s||'無') + '；弱於：' + (w||'無');
};

// 掛到全域
global.ELEMENT_LABEL = window.ELEMENT_LABEL;
global.ELEM_STRONG = window.ELEM_STRONG;
global.ELEM_WEAK = window.ELEM_WEAK;
global.getElemMultiplier = window.getElemMultiplier;
global.elemMult = window.elemMult;
global.elemRelationText = window.elemRelationText;
global.elemSummaryText = window.elemSummaryText;

// ===== 🛠️ 通用工具函數 =====
window.GameUtils = {
  // 數值處理
  clamp: function(v,min,max){ return Math.max(min,Math.min(max,v)); },
  pct: function(cur,max){ return this.clamp(Math.round(cur/max*100),0,100); },
  fmt: function(n){ return new Intl.NumberFormat('zh-Hant').format(n); },
  fmtCompact: function(n){ return new Intl.NumberFormat('en', { notation:'compact', maximumFractionDigits:1 }).format(n); },
  
  // URL 驗證
  isValidUrl: function(s){ return typeof s === 'string' && /^https?:\/\//.test(s); },
  
  // HTML 轉義
  escapeHtml: function(s){
    s = String(s);
    return s.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;');
  }
};

// ===== 📊 基礎屬性定義 =====
window.BASE_ATTRS = [
  {key:'str', name:'力道'},
  {key:'vit', name:'體魄'},
  {key:'dex', name:'身法'},
  {key:'int', name:'悟性'},
  {key:'wis', name:'心神'},
  {key:'luk', name:'氣運'},
];

// 掛到全域
global.GameUtils = window.GameUtils;
global.BASE_ATTRS = window.BASE_ATTRS;

})(window);

