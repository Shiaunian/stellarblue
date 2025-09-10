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
  id:'basic', name:'普攻', elem:'none', type:'phys',
  power:110, mp:0, desc:'一般攻擊，受相剋與暴擊影響'
},

// === 火系技能 ===
fire_ball: {
  id:'fire_ball', name:'火球術', elem:'fire', type:'mag',
  power:135, mp:8, desc:'火屬性法術攻擊，易觸發灼燒'
},
ember: {
  id:'ember', name:'火苗', elem:'fire', type:'mag',
  power:110, mp:12,
  desc:'造成110%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
  onHit:{
    burn:{ seconds:10, perSecondHP:-2,
      chanceBase:0.10, vsHigher5:0.05, vsFire:0.00, vsGrass:0.15
    }
  }
},
fire_kiss: {
  id:'fire_kiss', name:'火吻', elem:'fire', type:'mag',
  power:150, mp:15,
  desc:'造成150%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
  onHit:{
    burn:{ seconds:10, perSecondHP:-2,
      chanceBase:0.10, vsHigher5:0.05, vsFire:0.00, vsGrass:0.15
    }
  }
},

// === 水系技能 ===
water_gun: {
  id:'water_gun', name:'水槍', elem:'water', type:'mag',
  power:120, mp:10, desc:'水屬性法術攻擊，對火系有額外傷害'
},
aqua_ring: {
  id:'aqua_ring', name:'水之環', elem:'water', type:'mag',
  power:100, mp:15, desc:'水屬性治療技能，可回復少量HP'
},
tidal_wave: {
  id:'tidal_wave', name:'潮汐波', elem:'water', type:'mag',
  power:160, mp:20, desc:'強力水屬性攻擊，範圍傷害'
},

// === 草系技能 ===
vine_whip: {
  id:'vine_whip', name:'藤鞭', elem:'grass', type:'phys',
  power:125, mp:8, desc:'草屬性物理攻擊，可束縛敵人'
},
leaf_storm: {
  id:'leaf_storm', name:'飛葉風暴', elem:'grass', type:'mag',
  power:140, mp:18, desc:'草屬性法術攻擊，多段傷害'
},
synthesis: {
  id:'synthesis', name:'光合作用', elem:'grass', type:'mag',
  power:80, mp:12, desc:'草屬性回復技能，在陽光下效果更佳'
},

// === 雷系技能 ===
thunder_palm: {
  id:'thunder_palm', name:'雷電掌', elem:'thunder', type:'phys',
  power:150, mp:12, desc:'對敵方造成「雷元素」150%物理傷害'
},
thunder_drop: {
  id:'thunder_drop', name:'雷落', elem:'thunder', type:'phys',
  power:180, mp:22,
  desc:'對敵方造成「雷元素」180%物理傷害；若施放者自身亦為雷系，另行回復20點氣血（引擎支援後生效）'
},
lightning_bolt: {
  id:'lightning_bolt', name:'閃電箭', elem:'thunder', type:'mag',
  power:145, mp:16, desc:'雷屬性法術攻擊，有機率麻痺敵人'
},

// === 體系技能 ===
body_slam: {
  id:'body_slam', name:'泰山壓頂', elem:'body', type:'phys',
  power:160, mp:14, desc:'體屬性物理攻擊，重量越大傷害越高'
},
muscle_punch: {
  id:'muscle_punch', name:'肌肉拳', elem:'body', type:'phys',
  power:130, mp:10, desc:'體屬性物理攻擊，提升自身攻擊力'
},
iron_defense: {
  id:'iron_defense', name:'鐵壁', elem:'body', type:'phys',
  power:90, mp:12, desc:'體屬性防禦技能，大幅提升防禦力'
},

// === 毒系技能 ===
poison_sting: {
  id:'poison_sting', name:'毒針', elem:'poison', type:'phys',
  power:115, mp:8, desc:'毒屬性物理攻擊，有機率中毒'
},
toxic_spores: {
  id:'toxic_spores', name:'毒孢子', elem:'poison', type:'mag',
  power:100, mp:15, desc:'毒屬性法術攻擊，持續毒傷害'
},
venom_shock: {
  id:'venom_shock', name:'劇毒衝擊', elem:'poison', type:'mag',
  power:170, mp:22, desc:'毒屬性強力法術，對已中毒目標傷害加倍'
},

// === 土系技能 ===
earthquake: {
  id:'earthquake', name:'地震', elem:'earth', type:'phys',
  power:155, mp:18, desc:'土屬性物理攻擊，範圍地面震動'
},
rock_slide: {
  id:'rock_slide', name:'落石', elem:'earth', type:'phys',
  power:135, mp:12, desc:'土屬性物理攻擊，有機率使敵人畏縮'
},
mud_shot: {
  id:'mud_shot', name:'泥巴射擊', elem:'earth', type:'mag',
  power:110, mp:10, desc:'土屬性法術攻擊，降低敵人速度'
},

// === 風系技能 ===
Bluewave_Fist: {
  id:'Bluewave_Fist', name:'藍波拳', elem:'wind', type:'phys',
  power:110, mp:13, desc:'對敵方造成「風元素」110%物理傷害'
},
wind_blade: {
  id:'wind_blade', name:'風刃', elem:'wind', type:'mag',
  power:125, mp:14, desc:'風屬性法術攻擊，銳利的風刃切割'
},
tornado: {
  id:'tornado', name:'龍捲風', elem:'wind', type:'mag',
  power:165, mp:20, desc:'風屬性強力法術，捲起一切'
},

// === 超系技能 ===
psychic: {
  id:'psychic', name:'精神強念', elem:'mind', type:'mag',
  power:140, mp:16, desc:'超屬性法術攻擊，用念力攻擊敵人'
},
telekinesis: {
  id:'telekinesis', name:'念動力', elem:'mind', type:'mag',
  power:120, mp:12, desc:'超屬性法術攻擊，操控物體攻擊'
},
mind_blast: {
  id:'mind_blast', name:'精神爆破', elem:'mind', type:'mag',
  power:175, mp:24, desc:'超屬性終極法術，直接攻擊精神'
},

// === 蟲系技能 ===
bug_bite: {
  id:'bug_bite', name:'蟲咬', elem:'bug', type:'phys',
  power:120, mp:8, desc:'蟲屬性物理攻擊，可吸取敵人能量'
},
string_shot: {
  id:'string_shot', name:'吐絲', elem:'bug', type:'phys',
  power:95, mp:6, desc:'蟲屬性物理攻擊，降低敵人速度'
},
swarm_attack: {
  id:'swarm_attack', name:'蟲群攻擊', elem:'bug', type:'phys',
  power:150, mp:18, desc:'蟲屬性群體攻擊，數量越多威力越大'
},

// === 岩系技能 ===
rock_throw: {
  id:'rock_throw', name:'投岩', elem:'rock', type:'phys',
  power:130, mp:10, desc:'岩屬性物理攻擊，投擲堅硬岩石'
},
stone_edge: {
  id:'stone_edge', name:'尖石攻擊', elem:'rock', type:'phys',
  power:165, mp:20, desc:'岩屬性物理攻擊，高暴擊率'
},
rock_blast: {
  id:'rock_blast', name:'岩石爆破', elem:'rock', type:'phys',
  power:140, mp:16, desc:'岩屬性物理攻擊，連續攻擊'
},

// === 魂系技能 ===
soul_drain: {
  id:'soul_drain', name:'靈魂吸取', elem:'soul', type:'mag',
  power:125, mp:15, desc:'魂屬性法術攻擊，吸取敵人生命力'
},
spirit_bomb: {
  id:'spirit_bomb', name:'靈魂炸彈', elem:'soul', type:'mag',
  power:170, mp:22, desc:'魂屬性強力法術，靈魂能量爆炸'
},
ghost_claw: {
  id:'ghost_claw', name:'幽靈爪', elem:'soul', type:'phys',
  power:135, mp:12, desc:'魂屬性物理攻擊，無視物理防禦'
},

// === 冰系技能 ===
ice_shard: {
  id:'ice_shard', name:'冰礫', elem:'ice', type:'mag',
  power:115, mp:10, desc:'冰屬性法術攻擊，有機率凍結敵人'
},
blizzard: {
  id:'blizzard', name:'暴風雪', elem:'ice', type:'mag',
  power:160, mp:20, desc:'冰屬性範圍法術，冰雪風暴'
},
freeze_ray: {
  id:'freeze_ray', name:'急凍光線', elem:'ice', type:'mag',
  power:140, mp:16, desc:'冰屬性法術攻擊，高機率凍結'
},

// === 龍系技能 ===
dragon_claw: {
  id:'dragon_claw', name:'龍爪', elem:'dragon', type:'phys',
  power:155, mp:18, desc:'龍屬性物理攻擊，龍族的利爪'
},
dragon_breath: {
  id:'dragon_breath', name:'龍息', elem:'dragon', type:'mag',
  power:145, mp:16, desc:'龍屬性法術攻擊，龍族的吐息'
},
dragon_rage: {
  id:'dragon_rage', name:'龍之怒', elem:'dragon', type:'mag',
  power:180, mp:25, desc:'龍屬性終極法術，龍族的憤怒'
},

// === 暗系技能 ===
shadow_ball: {
  id:'shadow_ball', name:'暗影球', elem:'dark', type:'mag',
  power:135, mp:14, desc:'暗屬性法術攻擊，黑暗能量凝聚'
},
dark_pulse: {
  id:'dark_pulse', name:'惡之波動', elem:'dark', type:'mag',
  power:150, mp:18, desc:'暗屬性法術攻擊，邪惡的波動'
},
nightmare: {
  id:'nightmare', name:'惡夢', elem:'dark', type:'mag',
  power:120, mp:16, desc:'暗屬性法術攻擊，引發恐怖惡夢'
},

// === 鋼系技能 ===
steel_wing: {
  id:'steel_wing', name:'鋼翼', elem:'steel', type:'phys',
  power:140, mp:14, desc:'鋼屬性物理攻擊，堅硬的鋼鐵翅膀'
},
iron_head: {
  id:'iron_head', name:'鐵頭功', elem:'steel', type:'phys',
  power:155, mp:16, desc:'鋼屬性物理攻擊，鋼鐵般的頭槌'
},
metal_claw: {
  id:'metal_claw', name:'金屬爪', elem:'steel', type:'phys',
  power:130, mp:12, desc:'鋼屬性物理攻擊，提升自身攻擊力'
},

// === 妖系技能 ===
demon_fang: {
  id:'demon_fang', name:'妖牙', elem:'demon', type:'phys',
  power:145, mp:15, desc:'妖屬性物理攻擊，妖魔的利牙'
},
charm: {
  id:'charm', name:'魅惑', elem:'demon', type:'mag',
  power:110, mp:12, desc:'妖屬性法術攻擊，迷惑敵人心智'
},
demon_fire: {
  id:'demon_fire', name:'妖火', elem:'demon', type:'mag',
  power:165, mp:20, desc:'妖屬性法術攻擊，妖魔的詛咒之火'
}
};

// === 取技能 ===
function get(id){ return DB[id] || null; }
function list(){ return Object.keys(DB).map(function(k){ return DB[k]; }); }

// === 計算傷害（統一呼叫 stats.js 的 derivedFrom；相剋來源取自 map.html 的全域表） ===
function calcDamage(attacker, defender, skillId){
var sk = get(skillId) || get('basic');

// 1) 取雙方面板（由 stats.js 提供）
var aD = (typeof window.derivedFrom==='function') ? window.derivedFrom(attacker) : null;
var dD = (typeof window.derivedFrom==='function') ? window.derivedFrom(defender) : null;

// 若 stats.js 缺失，最低限度保底，避免報錯
if(!aD) aD = { '物理攻擊':10,'法術攻擊':10,'暴擊率':3,'暴擊傷害':150, '破甲':0,'法穿':0 };
if(!dD) dD = { '物理防禦':8,'法術防禦':8 };

// 2) 判斷使用哪種攻擊面板（改用 type: 'phys'|'mag'；無 type 則保持舊規則）
var isMag = false;
if (sk && sk.type){
  isMag = (sk.type === 'mag');
}else{
  // 後相容：舊資料/舊技能仍以「有元素＝法術」判斷
  isMag = (sk && sk.elem && sk.elem!=='none');
}
var ATK  = isMag ? safe(aD,'法術攻擊',10) : safe(aD,'物理攻擊',10);
var DEF  = isMag ? safe(dD,'法術防禦',8)   : safe(dD,'物理防禦',8);
var PEN  = isMag ? safe(aD,'法穿',0)       : safe(aD,'破甲',0);

// 3) 相剋倍率（支援雙元素防禦；若 map.html 未掛 getElemMultiplier，退回舊表/1.0）
var atkElem = (sk && sk.elem) ? sk.elem : 'none';
var defElems = (defender && defender.element) ? defender.element : 'none';
var elemMul = 1.0;
if (typeof window.getElemMultiplier === 'function'){
  elemMul = window.getElemMultiplier(atkElem, defElems);
}else{
  var MULS = (window.ELEM_MUL && window.ELEM_MUL[atkElem]) ? window.ELEM_MUL[atkElem] : null;
  var defOne = Array.isArray(defElems) ? (defElems[0]||'none') : defElems;
  elemMul = MULS ? (MULS[defOne]||1.0) : 1.0;
}

// 本源加成（同屬性↑，異屬性↓；無元素不受影響）
var STAB_SAME = (typeof window.STAB_SAME==='number') ? window.STAB_SAME : ((typeof window.STAB==='number')?window.STAB:1.0);
var STAB_DIFF = (typeof window.STAB_DIFF==='number') ? window.STAB_DIFF : 1.0;
if (atkElem !== 'none' && attacker && attacker.element){
  if (attacker.element === atkElem) elemMul = elemMul * STAB_SAME;
  else elemMul = elemMul * STAB_DIFF;
}

// 4) 係數與穿透
var power = safe(sk,'power',100) / 100;  // 100% → 1.0
var defEff = Math.max(0, DEF - PEN);

// 5) 基礎傷害
var base = Math.max(1, Math.round((ATK * power) - defEff));
base = Math.round(base * (0.9 + Math.random()*0.2));  // 技能亂數 ±10%

// 6) 暴擊
var cRate = clamp(safe(aD,'暴擊率',3), 0, 100);
var cDmg  = Math.max(100, safe(aD,'暴擊傷害',150));
var isCrit = (Math.random()*100 < cRate);
var out = base;
if (isCrit) out = Math.round(base * (cDmg/100));

// 7) 套元素倍率
out = Math.round(out * elemMul);

// 最低傷害保底 1
if (out < 1) out = 1;

return {
  damage: out,
  isCrit: !!isCrit,
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