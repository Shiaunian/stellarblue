// monsters.js — 怪物資料庫（可直接掛到 window）
(function(){
  // === 中央怪物定義 ===
  const DEFAULT_IMG = 'https://picsum.photos/seed/monster/500/500';

    // 平衡版：普遍血量/防禦下降、攻擊/破甲上升、速度略慢
  const defaultScales = {
    '氣血上限': 0.75, '真元上限': 0.90,
    '物理攻擊': 1.35, '法術攻擊': 1.35,
    '物理防禦': 0.60, '法術防禦': 0.70,
    '命中率': 1.00,  '閃避': 0.95,
    '暴擊率': 1.00,  '暴擊傷害': 1.00,
    '行動條速度': 0.95,
    '回氣/回合': 1.00, '回血/回合': 1.00,
    '破甲': 1.10, '法穿': 1.10,
  };

  const DB = {
    slime_young: {
      id:'slime_young', name:'萊姆幼體', level:1, element:'none',
      img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756700521/%E8%90%8A%E5%A7%86%E5%B9%BC%E9%AB%94_vbpjcf.png', imgMirror:false,
      
      scales:{ '氣血上限':0.85, '物理攻擊':0.80, '行動條速度':0.90 },
      stats:{ hp:105, mp:26, atk:8, matk:7, def:4, mdef:4, acc:79, eva:4, crit:2, aspd:1.0 },
      drops:[
        {type:'currency',  id:'stone',        name:'靈石',          min:6,  max:14, chance:1.00},
        {type:'material',  id:'slime_jelly',  name:'史萊姆凝膠',    min:1,  max:1,  chance:0.60},
      ]
    },
    slime: {
      id:'slime', name:'萊姆成體', level:2, element:'none',
      img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756701712/%E8%90%8A%E5%A7%86%E6%88%90%E9%AB%94_gog4wl.png', imgMirror:false,
      
      scales:{ '氣血上限':0.85, '物理攻擊':0.80, '行動條速度':0.90 },
      stats:{ hp:145, mp:31, atk:8, matk:10, def:5, mdef:6, acc:79, eva:5, crit:3, aspd:1.05 },
      drops:[
        {type:'currency',  id:'stone',        name:'靈石',          min:10,  max:14, chance:1.00},
        {type:'material',  id:'slime_jelly',  name:'史萊姆凝膠',    min:1,  max:2,  chance:0.60},
        {type:'consumable',id:'hp_small',     name:'氣血丹',        min:1,  max:1,  chance:0.25},
      ]
    },
        slime_king: {
      id:'slime_king', name:'史萊姆', level:3, element:'none',
      img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756701968/%E5%8F%B2%E8%90%8A%E5%A7%86_llcjhj.png', imgMirror:false,
      scales:{ '氣血上限':0.90, '物理攻擊':0.85, '行動條速度':0.95 },
      stats:{ hp:195, mp:38, atk:12, matk:14, def:7, mdef:8, acc:82, eva:6, crit:4, aspd:1.10 },
      drops:[
        {type:'currency',  id:'stone',        name:'靈石',          min:15,  max:22, chance:1.00},
        {type:'material',  id:'slime_jelly',  name:'史萊姆凝膠',    min:2,  max:3,  chance:0.75},
        {type:'consumable',id:'hp_small',     name:'氣血丹',        min:1,  max:2,  chance:0.35},
      ]
    },

    // ★ 新增：萊姆王（副本 BOSS）
    slime_boss: {
      id:'slime_boss', name:'萊姆王', level:3, element:'none',
      img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756707781/%E5%8F%B2%E8%90%8A%E7%8E%8B_kzopon.png', imgMirror:false,
      // 固定數值（不縮放）
      scales:{}, 
      stats:{ hp:415, mp:60, atk:16, matk:22, def:9, mdef:12, acc:85, eva:6, crit:5, aspd:1.10 },
      // 敵方技能
      skills: [
        {
          id:'slime_wave', name:'萊姆波動', kind:'magic_dot',
          elem:'none',     // 元素（如要之後改成 water…）
          dps:4, duration:5,             // 每秒 -4，持續 5 秒
          chance:0.25, lowHpBonus:0.35   // 基礎 25% 機率；血量 <50% 額外 +35%（總 60%）
        }
      ],
      drops:[
        {type:'currency',  id:'stone',        name:'靈石',          min:28, max:40, chance:1.00},
        {type:'material',  id:'slime_jelly',  name:'史萊姆凝膠',    min:3,  max:4,  chance:1.00},
        // 想加禮包可再放消耗品或稀有素材
      ]
    },
    wood_wisp:{
      id:'wood_wisp', name:'木幽火', level:2, element:'fire',
      img:'https://picsum.photos/seed/woodwisp/500/500', imgMirror:false,
      scales:{ '法術攻擊':1.05, '法術防禦':1.05, '行動條速度':0.95 },
      stats:{ hp:142, mp:50, atk:8, matk:12, def:6, mdef:8, acc:81, eva:7, crit:3, aspd:1.05 },
      drops:[
        {type:'currency',  id:'stone',      name:'靈石',       min:8,  max:18, chance:1.00},
        {type:'material',  id:'wood_shard', name:'木靈碎片',   min:1,  max:3,  chance:0.75},
        {type:'consumable',id:'hp_small',   name:'氣血丹',     min:1,  max:1,  chance:0.20},
      ]
    },
    thorn_fox:{
      id:'thorn_fox', name:'荊棘毒狐', level:3, element:'wood',
      img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756830089/%E8%8D%8A%E6%A3%98%E6%AF%92%E7%8B%90_ibbaqp.png', imgMirror:false,
      scales:{ '命中率':1.05, '閃避':1.10, '行動條速度':1.10 },
      stats:{ hp:180, mp:49, atk:17, matk:11, def:10, mdef:8, acc:85, eva:9, crit:6, aspd:1.15 },
      drops:[
        {type:'currency',  id:'stone',       name:'靈石',      min:10, max:22, chance:1.00},
        {type:'material',  id:'fox_tail',    name:'靈狐尾',    min:1,  max:1,  chance:0.40},
        {type:'material',  id:'thorn_shard', name:'荊棘碎片',  min:1,  max:3,  chance:0.70},
      ]
    },
    stone_golem:{
      id:'stone_golem', name:'石像守衛', level:4, element:'none',
      img:'https://picsum.photos/seed/golem/500/500', imgMirror:false,
      scales:{ '氣血上限':1.20, '物理防禦':1.20, '行動條速度':0.80 },
      stats:{ hp:300, mp:39, atk:25, matk:10, def:23, mdef:14, acc:82, eva:4, crit:3, aspd:0.9 },
      drops:[
        {type:'currency',  id:'stone',      name:'靈石',       min:14, max:28, chance:1.00},
        {type:'material',  id:'stone_core', name:'石像核心',   min:1,  max:1,  chance:0.30},
        {type:'material',  id:'hard_rock',  name:'堅石',       min:2,  max:4,  chance:0.60},
      ]
    },
    wraith:{
      id:'wraith', name:'幽怨亡靈', level:5, element:'none',
      img:'https://picsum.photos/seed/wraith/500/500', imgMirror:false,
      scales:{ '法術攻擊':1.15, '法術防禦':1.10, '行動條速度':0.95 },
      stats:{ hp:270, mp:110, atk:20, matk:30, def:13, mdef:25, acc:88, eva:9, crit:7, aspd:1.1 },
      drops:[
        {type:'currency',  id:'stone',       name:'靈石',       min:16, max:30, chance:1.00},
        {type:'material',  id:'ghost_essence', name:'幽魂精華', min:1,  max:2,  chance:0.45},
        {type:'consumable',id:'mp_small',    name:'靈氣丹',     min:1,  max:1,  chance:0.30},
      ]
    },
    snow_wolf:{
      id:'snow_wolf', name:'雪原狼', level:3, element:'water',
      img:'https://picsum.photos/seed/snowwolf/500/500', imgMirror:false,
      scales:{ '命中率':1.05, '閃避':1.05, '行動條速度':1.05 },
      stats:{ hp:178, mp:41, atk:16, matk:10, def:10, mdef:8, acc:84, eva:8, crit:5, aspd:1.12 },
      drops:[
        {type:'currency',  id:'stone',    name:'靈石',  min:9,  max:20, chance:1.00},
        {type:'material',  id:'wolf_fur', name:'狼毛',  min:1,  max:2,  chance:0.80},
        {type:'material',  id:'wolf_fang',name:'狼牙',  min:1,  max:1,  chance:0.40},
      ]
    },
    ice_bear:{
      id:'ice_bear', name:'冰原巨熊', level:4, element:'water',
      img:'https://picsum.photos/seed/icebear/500/500', imgMirror:false,
      scales:{ '氣血上限':1.10, '物理攻擊':1.10, '物理防禦':1.10, '行動條速度':0.90 },
      stats:{ hp:318, mp:30, atk:25, matk:10, def:22, mdef:12, acc:80, eva:3, crit:3, aspd:0.95 },
      drops:[
        {type:'currency',  id:'stone',     name:'靈石',  min:14, max:26, chance:1.00},
        {type:'material',  id:'bear_claw', name:'熊爪',  min:1,  max:1,  chance:0.40},
        {type:'material',  id:'bear_fur',  name:'熊皮',  min:1,  max:2,  chance:0.70},
      ]
    },
    ice_thorn:{
      id:'ice_thorn', name:'寒棘', level:4, element:'water',
      img:'https://picsum.photos/seed/icethorn/500/500', imgMirror:false,
      scales:{ '法術攻擊':1.05, '法術防禦':1.05, '行動條速度':0.95 },
      stats:{ hp:264, mp:65, atk:19, matk:23, def:15, mdef:19, acc:87, eva:7, crit:5, aspd:1.06 },
      drops:[
        {type:'currency',  id:'stone',          name:'靈石',     min:12, max:24, chance:1.00},
        {type:'material',  id:'ice_crystal',    name:'冰晶',     min:1,  max:3,  chance:0.65},
        {type:'material',  id:'frozen_thorn',   name:'凍結荊棘', min:1,  max:1,  chance:0.35},
      ]
    },
  };

  // === 工具 ===
  const rnd = (a,b)=> Math.floor(Math.random()*(b-a+1))+a;

  function get(id){ return DB[id] || null; }
  function byLevel(level){ return Object.values(DB).filter(m=>m.level===level); }
  function rollDrops(monsterId){
    const m = get(monsterId); if(!m) return [];
    const drops=[];
    for(const d of m.drops){
      if(Math.random() <= (d.chance ?? 0)){
        const qty = rnd(d.min|0, d.max|0);
        if(qty>0) drops.push({ type:d.type, id:d.id, name:d.name, amount:qty });
      }
    }
    return drops;
  }

  // 直接把掉落套用到玩家（呼叫 ItemDB / 加靈石）
  function applyDrops(player, drops){
    if(!player || !Array.isArray(drops)) return;
    player.currencies = player.currencies || { stone:0, diamond:0 };
    player.bag = player.bag || (window.ItemDB && ItemDB.getDefaultBag ? ItemDB.getDefaultBag() : {consumables:[],weapons:[],ornaments:[],materials:[],hidden:[]});
    for(const d of drops){
      if(d.type==='currency' && d.id==='stone'){
        player.currencies.stone += d.amount|0;
      }else if(d.type==='consumable'){
        if(window.ItemDB && ItemDB.addConsumableToBag) ItemDB.addConsumableToBag(player.bag, d.id, d.amount|0);
      }else if(d.type==='material'){
        if(window.ItemDB && ItemDB.addMaterialToBag)  ItemDB.addMaterialToBag(player.bag, d.id, d.amount|0);
      }
    }
    // 存檔（若有）
    if(window.Auth && Auth.saveCharacter) Auth.saveCharacter(player);
  }

  function getImage(id){
    const m = get(id);
    return {
      url: (m && m.img) ? m.img : DEFAULT_IMG,
      mirror: !!(m && m.imgMirror)
    };
  }

  function deriveAgainst(dp, monsterId){
    // dp = 由玩家算出的衍生能力（map.html 的 derivedFrom(P) 結果）
    const m = get(monsterId); if(!m) return null;
    const sc = Object.assign({}, defaultScales, m.scales||{});

    // 依玩家衍生值 × 怪物倍率 → 生成怪物實際數值
    const pick = (k, round=true)=> {
      const v = (dp[k] ?? 0) * (sc[k] ?? 1.0);
      return round ? Math.max(1, Math.round(v)) : v;
    };

    const out = {
      hp: pick('氣血上限'),         // 用來當敵方 HP
      mp: pick('真元上限'),
      atk: pick('物理攻擊'),
      matk: pick('法術攻擊'),
      def: pick('物理防禦'),
      mdef: pick('法術防禦'),
      acc: pick('命中率'),
      eva: pick('閃避'),
      crit: Math.min(100, pick('暴擊率')),
      critdmg: Math.max(100, pick('暴擊傷害')),
      speed: Math.max(40, pick('行動條速度')), // 行動條速度下限
      regen_mp: pick('回氣/回合'),
      regen_hp: pick('回血/回合'),
      pen: pick('破甲'),
      mpen: pick('法穿'),
    };
    return out;
  }

  // 對外
  window.MonsterDB = { DB, get, byLevel, rollDrops, applyDrops, getImage, deriveAgainst };
})();

