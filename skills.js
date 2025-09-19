/* skills.js — 技能資料庫（18屬性完整版；統一依賴 stats.js / map.html 的相剋表） */
(function(){
// === 內部工具 ===
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function safe(obj, k, v){ return (obj && obj[k]!==undefined) ? obj[k] : v; }

// === 技能資料庫（18屬性完整版） ===
var DB = {
// 基礎普攻
basic: {
  id:'basic', name:'普攻', elem:'none', type:'physical',
  power:110, mp:0, desc:'一般攻擊，受相剋與暴擊影響'
},

// === 火系技能 ===
fire_ball: {
  id:'fire_ball', name:'火球術', elem:'fire', type:'magical',
  power:135, mp:8, desc:'火屬性法術攻擊，易觸發灼燒'
},
ember: {
  id:'ember', name:'火苗', elem:'fire', type:'magical',
  power:110, mp:12,
  desc:'造成110%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
  onHit:{
    burn:{ seconds:10, perSecondHP:-2,
      chanceBase:0.10, vsHigher5:0.05, vsFire:0.00, vsGrass:0.15
    }
  }
},
fire_kiss: {
  id:'fire_kiss', name:'火吻', elem:'fire', type:'magical',
  power: 150, mp: 15,
  desc:'造成150%火屬性法術傷害；命中後有機率施加燒傷狀態',
  onHit:{
    burn:{ 
      seconds: 10,        // 燒傷持續時間
      chanceBase: 0.15,   // 基礎觸發機率 15%
      vsHigher5: 0.08,    // 對高等級敵人 8%
      vsFire: 0.00,       // 對火系無效
      vsGrass: 0.25       // 對草系高機率 25%
    }
  }
},
flame_burst: {
  id:'flame_burst', name:'烈焰爆發', elem:'fire', type:'magical',
  power: 120, mp: 15,
  desc:'造成120%火屬性法術傷害；造成持續燃燒效果（6秒內每秒8點傷害）',
  onHit:{
    burn:{ 
      seconds: 6,         // 燒傷持續時間 6秒
      perSecondHP: -8,    // 每秒扣8點血
      chanceBase: 0.80,   // 高觸發機率 80%
      vsHigher5: 0.70,    // 對高等級敵人 70%
      vsFire: 0.00,       // 對火系無效
      vsGrass: 0.90,      // 對草系超高機率 90%
      stackable: false,   // 🔥 不可堆疊
      refreshable: true   // 可以刷新持續時間
    }
  }
},


// === 水系技能 ===
water_gun: {
  id:'water_gun', name:'水槍', elem:'water', type:'magical',
  power:120, mp:10, desc:'水屬性法術攻擊，對火系有額外傷害'
},
aqua_ring: {
  id:'aqua_ring', name:'水之環', elem:'water', type:'magical',
  power:100, mp:15, desc:'水屬性治療技能，可回復少量HP'
},
tidal_wave: {
  id:'tidal_wave', name:'潮汐波', elem:'water', type:'magical',
  power:160, mp:20, desc:'強力水屬性攻擊，範圍傷害'
},

// === 草系技能 ===
vine_whip: {
  id:'vine_whip', name:'藤鞭', elem:'grass', type:'physical',
  power:125, mp:8, desc:'草屬性物理攻擊，可束縛敵人'
},
leaf_storm: {
  id:'leaf_storm', name:'飛葉風暴', elem:'grass', type:'magical',
  power:140, mp:18, desc:'草屬性法術攻擊，多段傷害'
},
synthesis: {
  id:'synthesis', name:'光合作用', elem:'grass', type:'magical',
  power:80, mp:12, desc:'草屬性回復技能，在陽光下效果更佳'
},

// === 雷系技能 ===
thunder_palm: {
  id:'thunder_palm', name:'雷電掌', elem:'thunder', type:'physical',
  power:150, mp:12, desc:'對敵方造成「雷元素」150%物理傷害'
},
thunder_drop: {
  id:'thunder_drop', name:'雷落', elem:'thunder', type:'physical',
  power:180, mp:22,
  desc:'對敵方造成「雷元素」180%物理傷害；若施放者自身亦為雷系，另行回復20點氣血（引擎支援後生效）'
},
lightning_bolt: {
  id:'lightning_bolt', name:'閃電箭', elem:'thunder', type:'magical',
  power:145, mp:16, desc:'雷屬性法術攻擊，有機率麻痺敵人'
},

// === 體系技能 ===
body_slam: {
  id:'body_slam', name:'泰山壓頂', elem:'body', type:'physical',
  power:160, mp:14, desc:'體屬性物理攻擊，重量越大傷害越高'
},
muscle_punch: {
  id:'muscle_punch', name:'肌肉拳', elem:'body', type:'physical',
  power:130, mp:10, desc:'體屬性物理攻擊，提升自身攻擊力'
},
iron_defense: {
  id:'iron_defense', name:'鐵壁', elem:'body', type:'physical',
  power:90, mp:12, desc:'體屬性防禦技能，大幅提升防禦力'
},

// === 毒系技能 ===
poison_sting: {
  id:'poison_sting', name:'毒針', elem:'poison', type:'physical',
  power:115, mp:8, desc:'毒屬性物理攻擊，有機率中毒'
},
toxic_spores: {
  id:'toxic_spores', name:'毒孢子', elem:'poison', type:'magical',
  power:100, mp:15, desc:'毒屬性法術攻擊，持續毒傷害'
},
venom_shock: {
  id:'venom_shock', name:'劇毒衝擊', elem:'poison', type:'magical',
  power:170, mp:22, desc:'毒屬性強力法術，對已中毒目標傷害加倍'
},

// === 土系技能 ===
earthquake: {
  id:'earthquake', name:'地震', elem:'earth', type:'physical',
  power:155, mp:18, desc:'土屬性物理攻擊，範圍地面震動'
},
rock_slide: {
  id:'rock_slide', name:'落石', elem:'earth', type:'physical',
  power:135, mp:12, desc:'土屬性物理攻擊，有機率使敵人畏縮'
},
mud_shot: {
  id:'mud_shot', name:'泥巴射擊', elem:'earth', type:'magical',
  power:110, mp:10, desc:'土屬性法術攻擊，降低敵人速度'
},

// === 風系技能 ===
Bluewave_Fist: {
  id:'Bluewave_Fist', name:'藍波拳', elem:'wind', type:'physical',
  power:120, mp:13, desc:'對敵方造成「風元素」120%物理傷害'
},
wind_blade: {
  id:'wind_blade', name:'風刃', elem:'wind', type:'magical',
  power:125, mp:14, desc:'風屬性法術攻擊，銳利的風刃切割'
},
tornado: {
  id:'tornado', name:'龍捲風', elem:'wind', type:'magical',
  power:165, mp:20, desc:'風屬性強力法術，捲起一切'
},

// === 超系技能 ===
psychic: {
  id:'psychic', name:'精神強念', elem:'mind', type:'magical',
  power:140, mp:16, desc:'超屬性法術攻擊，用念力攻擊敵人'
},
telekinesis: {
  id:'telekinesis', name:'念動力', elem:'mind', type:'magical',
  power:120, mp:12, desc:'超屬性法術攻擊，操控物體攻擊'
},
mind_blast: {
  id:'mind_blast', name:'精神爆破', elem:'mind', type:'magical',
  power:175, mp:24, desc:'超屬性終極法術，直接攻擊精神'
},

// === 蟲系技能 ===
bug_bite: {
  id:'bug_bite', name:'蟲咬', elem:'bug', type:'physical',
  power:120, mp:8, desc:'蟲屬性物理攻擊，可吸取敵人能量'
},
string_shot: {
  id:'string_shot', name:'吐絲', elem:'bug', type:'physical',
  power:95, mp:6, desc:'蟲屬性物理攻擊，降低敵人速度'
},
swarm_attack: {
  id:'swarm_attack', name:'蟲群攻擊', elem:'bug', type:'physical',
  power:150, mp:18, desc:'蟲屬性群體攻擊，數量越多威力越大'
},

// === 岩系技能 ===
rock_throw: {
  id:'rock_throw', name:'投岩', elem:'rock', type:'physical',
  power:130, mp:10, desc:'岩屬性物理攻擊，投擲堅硬岩石'
},
stone_edge: {
  id:'stone_edge', name:'尖石攻擊', elem:'rock', type:'physical',
  power:165, mp:20, desc:'岩屬性物理攻擊，高暴擊率'
},
rock_blast: {
  id:'rock_blast', name:'岩石爆破', elem:'rock', type:'physical',
  power:140, mp:16, desc:'岩屬性物理攻擊，連續攻擊'
},

// === 魂系技能 ===
soul_drain: {
  id:'soul_drain', name:'靈魂吸取', elem:'soul', type:'magical',
  power:125, mp:15, desc:'魂屬性法術攻擊，吸取敵人生命力'
},
spirit_bomb: {
  id:'spirit_bomb', name:'靈魂炸彈', elem:'soul', type:'magical',
  power:170, mp:22, desc:'魂屬性強力法術，靈魂能量爆炸'
},
ghost_claw: {
  id:'ghost_claw', name:'幽靈爪', elem:'soul', type:'physical',
  power:135, mp:12, desc:'魂屬性物理攻擊，無視物理防禦'
},

// === 冰系技能 ===
ice_shard: {
  id:'ice_shard', name:'冰礫', elem:'ice', type:'physical',
  power:115, mp:10, desc:'冰屬性法術攻擊，有機率凍結敵人'
},
blizzard: {
  id:'blizzard', name:'寒冰斬', elem:'ice', type:'physical',
  power:160, mp:20, desc:'冰屬性範圍法術，冰雪風暴'
},
freeze_ray: {
  id:'freeze_ray', name:'急凍光線', elem:'ice', type:'physical',
  power:140, mp:16, desc:'冰屬性法術攻擊，高機率凍結'
},

// === 龍系技能 ===
dragon_claw: {
  id:'dragon_claw', name:'龍爪', elem:'dragon', type:'physical',
  power:155, mp:18, desc:'龍屬性物理攻擊，龍族的利爪'
},
dragon_breath: {
  id:'dragon_breath', name:'龍息', elem:'dragon', type:'magical',
  power:145, mp:16, desc:'龍屬性法術攻擊，龍族的吐息'
},
dragon_rage: {
  id:'dragon_rage', name:'龍之怒', elem:'dragon', type:'magical',
  power:180, mp:25, desc:'龍屬性終極法術，龍族的憤怒'
},

// === 暗系技能 ===
shadow_ball: {
  id:'shadow_ball', name:'暗影球', elem:'dark', type:'magical',
  power:135, mp:14, desc:'暗屬性法術攻擊，黑暗能量凝聚'
},
dark_pulse: {
  id:'dark_pulse', name:'惡之波動', elem:'dark', type:'magical',
  power:150, mp:18, desc:'暗屬性法術攻擊，邪惡的波動'
},
nightmare: {
  id:'nightmare', name:'惡夢', elem:'dark', type:'magical',
  power:120, mp:16, desc:'暗屬性法術攻擊，引發恐怖惡夢'
},

// === 鋼系技能 ===
steel_wing: {
  id:'steel_wing', name:'鋼翼', elem:'steel', type:'physical',
  power:140, mp:14, desc:'鋼屬性物理攻擊，堅硬的鋼鐵翅膀'
},
iron_head: {
  id:'iron_head', name:'鐵頭功', elem:'steel', type:'physical',
  power:155, mp:16, desc:'鋼屬性物理攻擊，鋼鐵般的頭槌'
},
metal_claw: {
  id:'metal_claw', name:'金屬爪', elem:'steel', type:'physical',
  power:130, mp:12, desc:'鋼屬性物理攻擊，提升自身攻擊力'
},



// === 妖系技能 ===
demon_fang: {
  id:'demon_fang', name:'妖牙', elem:'demon', type:'physical',
  power:145, mp:15, desc:'妖屬性物理攻擊，妖魔的利牙'
},
charm: {
  id:'charm', name:'魅惑', elem:'demon', type:'magical',
  power:110, mp:12, desc:'妖屬性法術攻擊，迷惑敵人心智'
},
demon_fire: {
  id:'demon_fire', name:'妖火', elem:'demon', type:'magical',
  power:165, mp:20, desc:'妖屬性法術攻擊，妖魔的詛咒之火'
},

// —— 控場與弱化 ——

// 1) 冰獄束縛：低威力 + 高控制（freeze）
glacier_prison: {
  id:'glacier_prison', name:'冰獄束縛', elem:'ice', type:'magical',
  power:90, mp:18,
  desc:'造成90%冰屬性法術傷害；命中後短時間【冰凍】目標（無法行動+ATB停止）'
},

// 2) 斷筋一擊：物理打擊 + 減速（slow）
hamstring_strike: {
  id:'hamstring_strike', name:'斷筋一擊', elem:'earth', type:'physical',
  power:120, mp:12,
  desc:'造成120%土屬性物理傷害；命中後【減速】（行動條速度-30%）'
},

// 3) 目盲煙幕：小傷害 + 命中壓制（blind）
smokescreen: {
  id:'smokescreen', name:'目盲煙幕', elem:'dark', type:'magical',
  power:80, mp:10,
  desc:'造成80%暗屬性法術傷害；命中後使目標【致盲】（命中率-40%）'
},

// 4) 斷法咒印：小傷害 + 封技（silence）
seal_of_mute: {
  id:'seal_of_mute', name:'斷法咒印', elem:'mind', type:'magical',
  power:95, mp:14,
  desc:'造成95%超屬性法術傷害；命中後【沉默】目標（無法使用技能）'
},

// —— DOT 與破甲 ——

// 5) 血刃穿喉：物理 + 流血DOT（bleed，可疊層）
bloodletting_edge: {
  id:'bloodletting_edge', name:'血刃穿喉', elem:'poison', type:'physical',
  power:115, mp:10,
  desc:'造成115%毒屬性物理傷害；命中後施加【流血】（可疊加的持續失血）'
},

// 6) 灰燼鎖鏈：法術 + 防禦削弱（burn + weak）
ashen_shackles: {
  id:'ashen_shackles', name:'灰燼鎖鏈', elem:'fire', type:'magical',
  power:110, mp:16,
  desc:'造成110%火屬性法術傷害；命中後【灼燒】並【虛弱】（攻防下降）'
},

// —— 強化與護衛 ——

// 7) 戰吼：自我強化（attack_up + crit_up）
battle_cry: {
  id:'battle_cry', name:'戰吼', elem:'body', type:'physical',
  power:0, mp:10,
  desc:'不造成傷害；使自身【攻擊強化】並【暴擊強化】'
},

// 8) 鋼鐵壁障：護盾（shield）+ 少量威力
aegis_barrier: {
  id:'aegis_barrier', name:'鋼鐵壁障', elem:'steel', type:'physical',
  power:70, mp:14,
  desc:'造成小量鋼屬性傷害；並獲得可吸收傷害的【護盾】'
}

};

// === 取技能 ===
function get(id){ return DB[id] || null; }
function list(){ return Object.keys(DB).map(function(k){ return DB[k]; }); }

 // === 計算傷害（統一呼叫 stats.js 的 derivedFrom；相剋來源取自 map.html 的全域表） ===
 function calcDamage(attacker, defender, skillId){
 var sk = get(skillId) || get('basic');

 // 1) 取雙方面板（優先用戰鬥中的即時面板）
 var aD = null;
 if (attacker && attacker._live && typeof attacker._live === 'object') {
   aD = attacker._live;
 } else if (typeof window.derivedFrom === 'function') {
   aD = window.derivedFrom(attacker);
 }
 if (!aD) aD = { '物理攻擊':10,'法術攻擊':10,'暴擊率':3,'暴擊傷害':150, '破甲':0,'法穿':0 };

 var dD = null;
  // 優先用敵人戰鬥面板（battle.enemyStats -> 中文鍵；英文字段後備）
  if (typeof window.battle === 'object' && window.battle && defender === window.battle.enemy && window.battle.enemyStats) {
    var es = window.battle.enemyStats;
    dD = {
      '物理防禦': (es['物理防禦']!=null ? es['物理防禦'] : (es.def||0)),
      '法術防禦': (es['法術防禦']!=null ? es['法術防禦'] : (es.mdef||0)),
      '命中率'  : (es['命中率']!=null   ? es['命中率']   : (es.acc||0)),
      '閃避'    : (es['閃避']!=null     ? es['閃避']     : (es.eva||0))
    };
  } else if (defender && defender._live && typeof defender._live === 'object') {

   dD = defender._live;
 } else if (typeof window.derivedFrom === 'function') {
   dD = window.derivedFrom(defender);
 }
 if (!dD) dD = { '物理防禦':8,'法術防禦':8 };

 // ★ 1.5) 命中/閃避判定（若有全域 calcHitChance 則優先使用）
 var atkElem = (sk && sk.elem) ? sk.elem : 'none';
 var isHit = true;
 if (typeof window.calcHitChance === 'function') {
   isHit = window.calcHitChance(attacker, defender);  // 會用到「命中率」「閃避」 :contentReference[oaicite:3]{index=3}
 } else {
   var acc = (aD['命中率']!=null ? aD['命中率'] : 60);
   var eva = (dD['閃避']!=null   ? dD['閃避']   : 5);
   var hitChance = acc - eva;
   if (hitChance < 5) hitChance = 5;
   if (hitChance > 95) hitChance = 95;
   isHit = (Math.random()*100 < hitChance);
 }
 if (!isHit){
   return {
     damage: 0,
     isCrit: false,
     isMiss: true,
     elem: atkElem,
     mul: 1.0
   };
 }

 // 2) 物理/法術分支
 var isMag = false;
 if (sk && sk.type){
   isMag = (sk.type === 'magical');
 } else {
   isMag = (sk && sk.elem && sk.elem!=='none');
 }
 var ATK  = isMag ? (aD['法術攻擊']!=null?aD['法術攻擊']:10) : (aD['物理攻擊']!=null?aD['物理攻擊']:10);
 var DEF  = isMag ? (dD['法術防禦']!=null?dD['法術防禦']:8)   : (dD['物理防禦']!=null?dD['物理防禦']:8);
 var PEN  = isMag ? (aD['法穿']!=null?aD['法穿']:0)           : (aD['破甲']!=null?aD['破甲']:0);

 // 3) 相剋倍率
 var defElems = (defender && defender.element) ? defender.element : 'none';
 var elemMul = 1.0;
 if (typeof window.getElemMultiplier === 'function'){
   elemMul = window.getElemMultiplier(atkElem, defElems);
 } else {
   var MULS = (window.ELEM_MUL && window.ELEM_MUL[atkElem]) ? window.ELEM_MUL[atkElem] : null;
   var defOne = Array.isArray(defElems) ? (defElems[0]||'none') : defElems;
   elemMul = MULS ? (MULS[defOne]||1.0) : 1.0;
 }

 // STAB
 var STAB_SAME = (typeof window.STAB_SAME==='number') ? window.STAB_SAME : ((typeof window.STAB==='number')?window.STAB:1.0);
 var STAB_DIFF = (typeof window.STAB_DIFF==='number') ? window.STAB_DIFF : 1.0;
 if (atkElem !== 'none' && attacker && attacker.element){
   if (attacker.element === atkElem) elemMul = elemMul * STAB_SAME;
   else elemMul = elemMul * STAB_DIFF;
 }

 // 4) 技能倍率與穿透
 var power = (sk && typeof sk.power==='number') ? (sk.power/100) : (parseFloat((sk&&sk.power)||'100')/100);
 if (isNaN(power)) power = 1.0;
 var defEff = DEF - PEN; if (defEff < 0) defEff = 0;

 // 5) 基礎傷害（±10%浮動）
 var base = Math.round((ATK * power) - defEff);
 if (base < 1) base = 1;
 base = Math.round(base * (0.9 + Math.random()*0.2));

 // 6) 暴擊
 var cRate = (aD['暴擊率']!=null?aD['暴擊率']:3); if (cRate < 0) cRate = 0; if (cRate > 100) cRate = 100;
 var cDmg  = (aD['暴擊傷害']!=null?aD['暴擊傷害']:150); if (cDmg < 100) cDmg = 100;
 var isCrit = (Math.random()*100 < cRate);
 var out = isCrit ? Math.round(base * (cDmg/100)) : base;

 // 7) 套元素倍率
 out = Math.round(out * elemMul);
 if (out < 1) out = 1;

 return {
   damage: out,
   isCrit: !!isCrit,
   isMiss: false,
   elem: atkElem,
   mul: elemMul
 };
 }


// === 按元素分類取技能 ===
function getByElement(elem){
return Object.keys(DB).map(function(k){ return DB[k]; }).filter(function(skill){
  return skill.elem === elem;
});
}

// === 取所有元素清單 ===
function getAllElements(){
var elements = {};
Object.keys(DB).forEach(function(k){
  var elem = DB[k].elem;
  if(!elements[elem]) elements[elem] = 0;
  elements[elem]++;
});
return elements;
}

// === 對外 ===
window.SkillDB = {
get: get,
list: list,
calcDamage: calcDamage,
getByElement: getByElement,
getAllElements: getAllElements
};
})();