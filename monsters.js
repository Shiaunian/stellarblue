// monsters.js — 怪物資料庫（可直接掛到 window）
(function(){
  // === 中央怪物定義 ===
  const DEFAULT_IMG = 'https://picsum.photos/seed/monster/500/500';

    // 平衡版：普遍血量/防禦下降、攻擊/破甲上升、速度略慢
  const defaultScales = {
    '氣血上限': 1.00, '真元上限': 1.00,
    '物理攻擊': 1.00, '法術攻擊': 1.00,
    '物理防禦': 1.00, '法術防禦': 1.00,
    '命中率': 1.00,  '閃避': 1.00,
    '暴擊率': 1.00,  '暴擊傷害': 1.00,
    '行動條速度': 1.00,
    '回氣/回合': 1.00, '回血/回合': 1.00,
    '破甲': 1.10, '法穿': 1.10,
  };


const DB = {
// === 原有普通怪（保留原圖） ===
slime_young:{        
  id:'slime_young', name:'萊姆幼體', level:1, element:'none',   // 怪物ID/怪物名稱/等級/屬性（無屬性）
  img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757507487/%E8%90%8A%E5%A7%86%E5%B9%BC%E9%AB%94_mrsay6.png', imgMirror:false,   // 是否水平翻轉圖片
  // 新版能力值（主用 stats；extra 裝你新增的細項，保持相容不報錯）
  stats:{ hp:92, mp:41, atk:10,  matk:2,  def:0,  mdef:0,  acc:60, eva:5, crit:3, aspd:1.00 },  // 能力值（主要）生命值/魔力值/物理攻擊力/魔法攻擊力/物理防禦力/魔法防禦力/命中率/閃避率/暴擊率/攻擊速度
  extra:{ critDmg:50, recover_mp:2, recover_hp:1, armorPen:0, magicPen:0 },         // 額外屬性：暴擊傷害/速度/回復魔力/回復生命/物理穿透/魔法穿透
  skills:[
    { id:'dash', name:'衝撞', elem:'none', kind:'physical', power:110, mp:6, desc:'造成120%無屬性物理傷害', chance: 0.30, lowHpBonus: 0.20 }
  ],
      // 額外經驗：+5；若玩家等級超過10等則不給（僅註記，不影響相容）
  xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
  drops:[
    {type:'currency',  id:'stone',       name:'靈石',       min:6,  max:14, chance:1.00},      // 掉落貨幣：靈石，數量6-14，機率100%
    {type:'material',  id:'slime_jelly', name:'史萊姆凝膠', min:1,  max:1,  chance:0.60},      // 掉落素材：史萊姆凝膠，數量1，機率60%
    {type:'consumable',id:'hp_small',    name:'小氣血丹',   min:1,  max:1,  chance:0.60},      // 掉落消耗品：小氣血丹，數量1，機率60%
    {type:'accessory', id:'jade_ring',   name:'翠玉戒指',   min:1,  max:1,  chance:0.05}       // 掉落飾品：翠玉戒指，數量1，機率5%
  ]
},


  slime:{
    id:'slime', name:'萊姆成體', level:2, element:'none',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757507487/%E8%90%8A%E5%A7%86%E6%88%90%E9%AB%94_zqui1l.png', imgMirror:false,
    appear:{ minPlayerLevel:2 }, // 出現條件：角色達到 2 等
    stats:{ hp:98, mp:41, atk:12,  matk:2,  def:1,  mdef:1,  acc:61, eva:5, crit:3, aspd:1.00 },
    extra:{ critDmg:51, recover_mp:2, recover_hp:1, armorPen:0, magicPen:0 },
    skills:[
      { id:'dash', name:'衝撞', elem:'none', kind:'physical', power:110, mp:6, desc:'造成120%無屬性物理傷害', chance: 0.30, lowHpBonus: 0.20 }
    ],
        // 額外經驗：+5；若玩家等級超過10等則不給（僅註記，不影響相容）
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',       name:'靈石',       min:10, max:15, chance:1.00},
      {type:'material',  id:'slime_jelly', name:'史萊姆凝膠', min:1,  max:1,  chance:0.60},
      {type:'consumable',id:'hp_small',    name:'小氣血丹',   min:1,  max:1,  chance:0.60},
      {type:'accessory', id:'jade_ring',   name:'翠玉戒指',   min:1,  max:1,  chance:0.10}
    ]
  },

  slime_king:{
    id:'slime_king', name:'史萊姆', level:3, element:'none',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757508388/%E5%8F%B2%E8%90%8A%E5%A7%86_xlo0qz.png', imgMirror:false,
    appear:{ minPlayerLevel:4 }, // 出現條件：角色達到 4 等
    stats:{ hp:105, mp:41, atk:14,  matk:2,  def:2,  mdef:1,  acc:62, eva:6, crit:3, aspd:1.00 },
    extra:{ critDmg:52, recover_mp:2, recover_hp:1, armorPen:1, magicPen:0 },
    skills:[
      { id:'dash', name:'高速衝撞', elem:'none', kind:'physical', power:120, mp:10, desc:'造成120%無屬性物理傷害', chance: 0.35, lowHpBonus: 0.25 }
    ],
    // 額外經驗：+5；若玩家等級超過10等則不給（僅註記，不影響相容）
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',       name:'靈石',       min:15, max:20, chance:1.00},
      {type:'material',  id:'slime_jelly', name:'史萊姆凝膠', min:1,  max:1,  chance:0.60},
      {type:'consumable',id:'hp_small',    name:'小氣血丹',   min:1,  max:1,  chance:0.60},
      {type:'accessory', id:'jade_ring',   name:'翠玉戒指',   min:1,  max:1,  chance:0.10}
    ]
  },

  /* === 新增：木幽火（wood_wisp） === */
  wood_wisp:{
    id:'wood_wisp', name:'木幽火', level:4, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757512929/%E6%9C%A8%E5%B9%BD%E7%81%AB_azpqyy.png', imgMirror:false,
    stats:{ hp:120, mp:50, atk:11,  matk:5,  def:2,  mdef:3,  acc:62, eva:6, crit:3, aspd:1.00 },
    extra:{ critDmg:52, recover_mp:3, recover_hp:1, armorPen:0, magicPen:1 },
    skills:[
      {
        id:'ember', name:'火苗', elem:'fire', kind:'magic', power:110, mp:12,
        desc:'造成110%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
        chance: 0.25, lowHpBonus: 0.20,
        onHit:{
          burn:{ seconds:10, perSecondHP:-2,
            chanceBase:0.10,   // 一般 10%
            vsHigher5:0.05,    // 對手等級高 5 等 → 5%
            vsFire:0.00,       // 被攻擊方是火 → 0%
            vsGrass:0.15       // 被攻擊方是草 → 15%
          }
        }
      }
    ],

    // 額外經驗 +5；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',     name:'靈石',   min:18, max:22, chance:1.00},
      {type:'material',  id:'charcoal',  name:'木炭',   min:1,  max:1,  chance:0.60},
      {type:'consumable',id:'hp_small',  name:'小氣血丹', min:1, max:1, chance:0.60},
      {type:'accessory', id:'jade_ring', name:'翠玉戒指', min:1, max:1, chance:0.80}
    ]
  },

  /* === 新增：火之靈（Fire_Spirit）=== */
  Fire_Spirit:{
    id:'Fire_Spirit', name:'火之靈', level:4, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757512930/%E7%81%AB%E4%B9%8B%E9%9D%88_qgsyug.png', imgMirror:false,
    stats:{ hp:130, mp:40, atk:10,  matk:8,  def:2,  mdef:4,  acc:63, eva:8, crit:3, aspd:1.10 },
    extra:{ critDmg:53, recover_mp:3, recover_hp:1, armorPen:0, magicPen:1 },
    ai:{ pattern:'smart', note:'先 1~2 次普攻，之後只要有 MP 優先用技能' },
    skills:[
      {
        id:'fire_kiss', name:'火吻', elem:'fire', kind:'magic', power:120, mp:15,
        desc:'造成120%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
        chance: 0.30, lowHpBonus: 0.25,
        onHit:{
          burn:{ seconds:10, perSecondHP:-2,
            chanceBase:0.10, vsHigher5:0.05, vsFire:0.00, vsGrass:0.15
          }
        }
      }
    ],
    // 額外經驗 +7；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',     name:'靈石',   min:20, max:23, chance:1.00},
      {type:'material',  id:'fire_seed', name:'火種',   min:1,  max:1,  chance:0.60},
      {type:'consumable',id:'hp_small',  name:'小氣血丹', min:1, max:1, chance:0.60},
      {type:'accessory', id:'jade_ring', name:'翠玉戒指', min:1, max:1, chance:0.80}
    ]
  },

  /* === 新增：萊利（laily）=== */
  laily:{
    id:'laily', name:'萊利', level:5, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757513124/%E8%90%8A%E5%88%A9_nmxv1h.png', imgMirror:false,
    stats:{ hp:140, mp:45, atk:13,  matk:6,  def:3,  mdef:4,  acc:65, eva:8, crit:4, aspd:1.10 },
    extra:{ critDmg:55, recover_mp:3, recover_hp:1, armorPen:1, magicPen:1 },
    skills:[
      {
        id:'fire_kiss', name:'火吻', elem:'fire', kind:'magic', power:120, mp:15,
        desc:'造成120%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
        chance: 0.30, lowHpBonus: 0.25,
        onHit:{
          burn:{ seconds:10, perSecondHP:-2,
            chanceBase:0.10, vsHigher5:0.05, vsFire:0.00, vsGrass:0.15
          }
        }
      }
    ],
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',     name:'靈石',   min:25, max:28, chance:1.00},
      {type:'material',  id:'fire_seed', name:'火種',   min:1,  max:2,  chance:0.60},
      {type:'consumable',id:'hp_small',  name:'小氣血丹', min:1, max:1, chance:0.60},
      {type:'accessory', id:'jade_ring', name:'翠玉戒指', min:1, max:1, chance:0.80}
    ]
  },
  /* === 聚火靈=== */
  fire_orb:{
    id:'fire_orb', name:'聚火靈', level:6, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757513832/%E8%81%9A%E7%81%AB%E9%9D%88_yaenqp.png', imgMirror:false,
    stats:{ hp:160, mp:50, atk:15,  matk:7,  def:4,  mdef:5,  acc:67, eva:10, crit:5, aspd:1.00 },
    extra:{ critDmg:55, recover_mp:3, recover_hp:1, armorPen:1, magicPen:1 },
    skills:[
      {
        id:'fire_kiss', name:'火吻', elem:'fire', kind:'magic', power:120, mp:15,
        desc:'造成120%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
        chance: 0.30, lowHpBonus: 0.25,
        onHit:{
          burn:{ seconds:10, perSecondHP:-2,
            chanceBase:0.10, vsHigher5:0.05, vsFire:0.00, vsGrass:0.15
          }
        }
      }
    ],
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',     name:'靈石',   min:25, max:28, chance:1.00},
      {type:'material',  id:'fire_seed', name:'火種',   min:1,  max:2,  chance:0.60},
      {type:'consumable',id:'hp_small',  name:'小氣血丹', min:1, max:1, chance:0.60},
      {type:'accessory', id:'jade_ring', name:'翠玉戒指', min:1, max:1, chance:0.80}
    ]
  },


  // ★ 原有 BOSS（保留原圖）
  slime_boss: {
    id:'slime_boss', name:'萊姆王', level:3, element:'none',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756707781/%E5%8F%B2%E8%90%8A%E7%8E%8B_kzopon.png', imgMirror:false,  
    scales:{}, 
    stats:{ hp:250, mp:60, atk:21, matk:22, def:9, mdef:12, acc:85, eva:6, crit:5, aspd:1.00 },  // 能力值（主要）生命值/魔力值/物理攻擊力/魔法攻擊力/物理防禦力/魔法防禦力/命中率/閃避率/暴擊率/攻擊速度
    extra:{ critDmg:50, recover_mp:2, recover_hp:1, armorPen:0, magicPen:0 },    // 額外屬性：暴擊傷害/回復魔力/回復生命/物理穿透/魔法穿透
    skills: [
      { id:'slime_wave', name:'萊姆波動', kind:'magic_dot', elem:'none', dps:4, duration:5, chance:0.25, lowHpBonus:0.35 } 
    ],
    drops:[
      {type:'currency',  id:'stone',       name:'靈石',       min:70, max:125, chance:1.00},
      {type:'material',  id:'slime_jelly', name:'萊姆核心', min:3,  max:4,  chance:0.05},
    ]
  },

  flame_master:{
    id:'flame_master', name:'炎使者', level:6, element:'fire',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757518547/%E7%82%8E%E4%BD%BF%E8%80%85_gpdouc.png', imgMirror:false,
    scales:{},
    stats:{ hp:550, mp:110, atk:27, matk:25, def:14, mdef:15, acc:87, eva:10, crit:6, aspd:1.50 },
    skills:[
      { id:'flame_burst', name:'烈焰爆發', elem:'fire', kind:'magic_dot', dps:8, duration:6, chance:0.40, lowHpBonus:0.35 }
    ],
    drops:[
      {type:'currency',  id:'stone',       name:'靈石',      min:10, max:22, chance:1.00},
      {type:'material',  id:'fox_tail',    name:'靈狐尾',    min:1,  max:1,  chance:0.40},
      {type:'material',  id:'thorn_shard', name:'荊棘碎片',  min:1,  max:3,  chance:0.70},
    ]
  },

  stone_golem:{
    id:'stone_golem', name:'石像守衛', level:4, element:'earth',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756917889/%E7%9F%B3%E5%83%8F%E5%AE%88%E8%A1%9B_dqcolr.png', imgMirror:false,
    scales:{ '氣血上限':1.20, '物理防禦':1.20, '行動條速度':0.80 },
    stats:{ hp:300, mp:39, atk:25, matk:10, def:23, mdef:14, acc:82, eva:4, crit:3, aspd:0.90 },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
    ]
  },
  wraith:{
    id:'wraith', name:'幽怨亡靈', level:5, element:'dark',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756917889/%E5%B9%BD%E6%80%A8%E4%BA%A1%E9%9D%88_ac6oug.png', imgMirror:false,
    scales:{ '法術攻擊':1.15, '法術防禦':1.10, '行動條速度':0.95 },
    stats:{ hp:270, mp:110, atk:20, matk:30, def:13, mdef:25, acc:88, eva:9, crit:7, aspd:1.10 },
    drops:[
      {type:'currency',  id:'stone',        name:'靈石',    min:16, max:30, chance:1.00},
      {type:'material',  id:'ghost_essence',name:'幽魂精華',min:1,  max:2,  chance:0.45},
      {type:'consumable',id:'mp_small',     name:'靈氣丹',  min:1,  max:1,  chance:0.30},
    ]
  },
  snow_wolf:{
    id:'snow_wolf', name:'雪原狼', level:3, element:'water',rank: 'boss',
    img:'https://picsum.photos/seed/snowwolf/500/500', imgMirror:false,
    scales:{ '命中率':1.05, '閃避':1.05, '行動條速度':1.05 },
    stats:{ hp:178, mp:41, atk:16, matk:10, def:10, mdef:8, acc:84, eva:8, crit:5, aspd:1.12 },
    drops:[
      {type:'currency',  id:'stone',    name:'靈石', min:9,  max:20, chance:1.00},
      {type:'material',  id:'wolf_fur', name:'狼毛', min:1,  max:2,  chance:0.80},
      {type:'material',  id:'wolf_fang',name:'狼牙', min:1,  max:1,  chance:0.40},
    ]
  },
  ice_bear:{
    id:'ice_bear', name:'冰原巨熊', level:4, element:'water',rank: 'boss',
    img:'https://picsum.photos/seed/icebear/500/500', imgMirror:false,
    scales:{ '氣血上限':1.10, '物理攻擊':1.10, '物理防禦':1.10, '行動條速度':0.90 },
    stats:{ hp:318, mp:30, atk:25, matk:10, def:22, mdef:12, acc:80, eva:3, crit:3, aspd:0.95 },
    drops:[
      {type:'currency',  id:'stone',     name:'靈石', min:14, max:26, chance:1.00},
      {type:'material',  id:'bear_claw', name:'熊爪', min:1,  max:1,  chance:0.40},
      {type:'material',  id:'bear_fur',  name:'熊皮', min:1,  max:2,  chance:0.70},
    ]
  },
  ice_thorn:{
    id:'ice_thorn', name:'寒棘', level:4, element:'water',rank: 'boss',
    img:'https://picsum.photos/seed/icethorn/500/500', imgMirror:false,
    scales:{ '法術攻擊':1.05, '法術防禦':1.05, '行動條速度':0.95 },
    stats:{ hp:264, mp:65, atk:19, matk:23, def:15, mdef:19, acc:87, eva:7, crit:5, aspd:1.06 },
    drops:[
      {type:'currency',  id:'stone',          name:'靈石',     min:12, max:24, chance:1.00},
      {type:'material',  id:'ice_crystal',    name:'冰晶',     min:1,  max:3,  chance:0.65},
      {type:'material',  id:'frozen_thorn',   name:'凍結荊棘', min:1,  max:1,  chance:0.35},
    ]
  },


  // 火：DoT 法師型
  ember_imp:{
    id:'ember_imp', name:'灰燼小惡魔', level:3, element:'fire',
    img:'https://picsum.photos/seed/emberimp/500/500', imgMirror:false,
    scales:{ '法術攻擊':1.15, '行動條速度':1.10 },
    stats:{ hp:160, mp:70, atk:10, matk:24, def:8, mdef:12, acc:86, eva:7, crit:6, aspd:1.18 },
    skills:[
      { id:'burn_flame', name:'燃灼', kind:'magic_dot', elem:'fire', dps:5, duration:4, chance:0.30 }
    ],
    drops:[
      {type:'currency', id:'stone', name:'靈石', min:12, max:20, chance:1.00},
      {type:'material', id:'fire_core', name:'火靈核心', min:1, max:1, chance:0.35},
    ]
  },

  // 土：重甲慢速坦
  bog_tortoise:{
    id:'bog_tortoise', name:'泥潭甲龜', level:3, element:'earth',
    img:'https://picsum.photos/seed/bogtortoise/500/500', imgMirror:false,
    scales:{ '氣血上限':1.25, '物理防禦':1.25, '行動條速度':0.80 },
    stats:{ hp:360, mp:28, atk:18, matk:8, def:26, mdef:18, acc:80, eva:3, crit:2, aspd:0.82 },
    drops:[
      {type:'currency', id:'stone', name:'靈石', min:10, max:22, chance:1.00},
      {type:'material', id:'mud_shell', name:'泥甲片', min:1, max:2, chance:0.60},
    ]
  },

  // 暗：高閃避玻璃砲
  shadow_bat:{
    id:'shadow_bat', name:'影翼蝠', level:4, element:'dark',
    img:'https://picsum.photos/seed/shadowbat/500/500', imgMirror:false,
    scales:{ '閃避':1.25, '命中率':1.05, '行動條速度':1.15 },
    stats:{ hp:210, mp:40, atk:24, matk:14, def:10, mdef:12, acc:90, eva:12, crit:8, aspd:1.20 },
    drops:[
      {type:'currency', id:'stone', name:'靈石', min:12, max:26, chance:1.00},
      {type:'material', id:'bat_wing', name:'蝠翼', min:1, max:2, chance:0.55},
    ]
  },

  // 靈：高 MP / 法防，帶吸靈 DoT
  spirit_acolyte:{
    id:'spirit_acolyte', name:'靈侍', level:4, element:'spirit',
    img:'https://picsum.photos/seed/spiritacolyte/500/500', imgMirror:false,
    scales:{ '真元上限':1.20, '法術防禦':1.15 },
    stats:{ hp:240, mp:120, atk:14, matk:26, def:12, mdef:24, acc:86, eva:7, crit:7, aspd:1.00 },
    skills:[
      { id:'mind_leech', name:'噬心', kind:'magic_dot', elem:'spirit', dps:6, duration:4, chance:0.25 }
    ],
    drops:[
      {type:'currency', id:'stone', name:'靈石', min:14, max:28, chance:1.00},
      {type:'material', id:'soul_thread', name:'魂絲', min:1, max:1, chance:0.40},
    ]
  },

  // 金：高速穿刺蟲（命中高）
  thunder_beetle:{
    id:'thunder_beetle', name:'雷角甲蟲', level:5, element:'gold',
    img:'https://picsum.photos/seed/thunderbeetle/500/500', imgMirror:false,
    scales:{ '命中率':1.20, '行動條速度':1.15 },
    stats:{ hp:260, mp:36, atk:32, matk:10, def:18, mdef:12, acc:94, eva:6, crit:10, aspd:1.22 },
    drops:[
      {type:'currency', id:'stone', name:'靈石', min:16, max:32, chance:1.00},
      {type:'material', id:'beetle_horn', name:'雷角', min:1, max:1, chance:0.45},
    ]
  },

  /* =========================
     下面開始為「菁英 / BOSS」獨立定義（各自有獨立圖片）
     ========================= */

  // ---- 菁英（各自有圖） ----
  slime_elite:{
    id:'slime_elite', rank:'elite', name:'萊姆成體（菁英）', level:3, element:'none',
    img:'https://picsum.photos/seed/slime-elite/500/500', imgMirror:false,
    scales:{},
    stats:{ hp:203, mp:37, atk:10, matk:12, def:6, mdef:7, acc:83, eva:5, crit:4, aspd:1.10 },
    drops:[]
  },
  thorn_fox_elite:{
    id:'thorn_fox_elite', rank:'elite', name:'荊棘毒狐（菁英）', level:4, element:'wood',
    img:'https://picsum.photos/seed/thorn-fox-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:252, mp:59, atk:21, matk:14, def:12, mdef:10, acc:89, eva:9, crit:7, aspd:1.21 }, drops:[]
  },
  stone_golem_elite:{
    id:'stone_golem_elite', rank:'elite', name:'石像守衛（菁英）', level:5, element:'earth',
    img:'https://picsum.photos/seed/stone-golem-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:420, mp:47, atk:31, matk:12, def:28, mdef:17, acc:86, eva:4, crit:4, aspd:0.95 }, drops:[]
  },
  wraith_elite:{
    id:'wraith_elite', rank:'elite', name:'幽怨亡靈（菁英）', level:6, element:'dark',
    img:'https://picsum.photos/seed/wraith-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:378, mp:132, atk:25, matk:38, def:16, mdef:30, acc:92, eva:9, crit:8, aspd:1.16 }, drops:[]
  },
  snow_wolf_elite:{
    id:'snow_wolf_elite', rank:'elite', name:'雪原狼（菁英）', level:4, element:'water',
    img:'https://picsum.photos/seed/snow-wolf-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:249, mp:49, atk:20, matk:12, def:12, mdef:10, acc:88, eva:8, crit:6, aspd:1.18 }, drops:[]
  },
  ice_bear_elite:{
    id:'ice_bear_elite', rank:'elite', name:'冰原巨熊（菁英）', level:5, element:'water',
    img:'https://picsum.photos/seed/ice-bear-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:445, mp:36, atk:31, matk:12, def:26, mdef:14, acc:84, eva:3, crit:4, aspd:1.00 }, drops:[]
  },
  ice_thorn_elite:{
    id:'ice_thorn_elite', rank:'elite', name:'寒棘（菁英）', level:5, element:'water',
    img:'https://picsum.photos/seed/ice-thorn-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:370, mp:78, atk:24, matk:29, def:18, mdef:23, acc:91, eva:7, crit:6, aspd:1.11 }, drops:[]
  },
  brass_beetle_elite:{
    id:'brass_beetle_elite', rank:'elite', name:'黃銅甲蟲（菁英）', level:3, element:'gold',
    img:'https://picsum.photos/seed/brass-beetle-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:231, mp:29, atk:19, matk:10, def:19, mdef:12, acc:92, eva:4, crit:5, aspd:1.05 }, drops:[]
  },
  ember_imp_elite:{
    id:'ember_imp_elite', rank:'elite', name:'灰燼小惡魔（菁英）', level:4, element:'fire',
    img:'https://picsum.photos/seed/ember-imp-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:224, mp:84, atk:12, matk:30, def:10, mdef:14, acc:90, eva:7, crit:7, aspd:1.24 }, drops:[]
  },
  bog_tortoise_elite:{
    id:'bog_tortoise_elite', rank:'elite', name:'泥潭甲龜（菁英）', level:4, element:'earth',
    img:'https://picsum.photos/seed/bog-tortoise-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:504, mp:34, atk:22, matk:10, def:31, mdef:22, acc:84, eva:3, crit:2, aspd:0.86 }, drops:[]
  },
  shadow_bat_elite:{
    id:'shadow_bat_elite', rank:'elite', name:'影翼蝠（菁英）', level:5, element:'dark',
    img:'https://picsum.photos/seed/shadow-bat-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:294, mp:48, atk:30, matk:18, def:12, mdef:14, acc:94, eva:13, crit:10, aspd:1.26 }, drops:[]
  },
  spirit_acolyte_elite:{
    id:'spirit_acolyte_elite', rank:'elite', name:'靈侍（菁英）', level:5, element:'spirit',
    img:'https://picsum.photos/seed/spirit-acolyte-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:336, mp:144, atk:18, matk:32, def:14, mdef:29, acc:90, eva:7, crit:8, aspd:1.05 }, drops:[]
  },
  thunder_beetle_elite:{
    id:'thunder_beetle_elite', rank:'elite', name:'雷角甲蟲（菁英）', level:6, element:'gold',
    img:'https://picsum.photos/seed/thunder-beetle-elite/500/500', imgMirror:false,
    scales:{}, stats:{ hp:364, mp:43, atk:40, matk:12, def:22, mdef:14, acc:99, eva:6, crit:12, aspd:1.28 }, drops:[]
  },

  // ---- BOSS（各自有圖） ----
  stone_golem_boss:{
    id:'stone_golem_boss', rank:'boss', name:'石像霸主', level:6, element:'earth',
    img:'https://picsum.photos/seed/stone-golem-boss/500/500', imgMirror:false,
    scales:{}, stats:{ hp:660, mp:55, atk:40, matk:13, def:41, mdef:21, acc:90, eva:4, crit:4, aspd:0.90 }, drops:[]
  },
  wraith_boss:{
    id:'wraith_boss', rank:'boss', name:'冥怨幽王', level:7, element:'dark',
    img:'https://picsum.photos/seed/wraith-boss/500/500', imgMirror:false,
    scales:{}, stats:{ hp:540, mp:198, atk:28, matk:54, def:18, mdef:45, acc:101, eva:10, crit:9, aspd:1.16 }, drops:[]
  },
  ice_bear_boss:{
    id:'ice_bear_boss', rank:'boss', name:'冰原霸熊', level:6, element:'water',
    img:'https://picsum.photos/seed/ice-bear-boss/500/500', imgMirror:false,
    scales:{}, stats:{ hp:731, mp:39, atk:42, matk:12, def:40, mdef:17, acc:84, eva:3, crit:4, aspd:0.95 }, drops:[]
  },
  thunder_beetle_boss:{
    id:'thunder_beetle_boss', rank:'boss', name:'雷角蟲王', level:8, element:'gold',
    img:'https://picsum.photos/seed/thunder-beetle-boss/500/500', imgMirror:false,
    scales:{}, stats:{ hp:520, mp:50, atk:58, matk:13, def:29, mdef:17, acc:118, eva:7, crit:15, aspd:1.34 }, drops:[]
  },
  shadow_bat_boss:{
    id:'shadow_bat_boss', rank:'boss', name:'影翼魔皇', level:7, element:'dark',
    img:'https://picsum.photos/seed/shadow-bat-boss/500/500', imgMirror:false,
    scales:{}, stats:{ hp:378, mp:60, atk:41, matk:20, def:14, mdef:18, acc:112, eva:16, crit:13, aspd:1.38 }, drops:[]
  },
  spirit_acolyte_boss:{
    id:'spirit_acolyte_boss', rank:'boss', name:'靈侍大祭司', level:9, element:'spirit',
    img:'https://picsum.photos/seed/spirit-acolyte-boss/500/500', imgMirror:false,
    scales:{}, stats:{ hp:456, mp:264, atk:20, matk:49, def:18, mdef:48, acc:99, eva:8, crit:10, aspd:1.05 }, drops:[]
  },
  ancient_tortoise_boss:{
    id:'ancient_tortoise_boss', rank:'boss', name:'上古玄龜', level:10, element:'earth',
    img:'https://picsum.photos/seed/ancient-tortoise-boss/500/500', imgMirror:false,
    scales:{}, stats:{ hp:1008, mp:45, atk:32, matk:11, def:57, mdef:32, acc:88, eva:3, crit:2, aspd:0.74 }, drops:[]
  },
};


// === 正規化（把缺的能力補齊，特別是 acc / eva / crit / aspd）===
 // === 正規化 + 回填六圍（attributes）===
 (function normalizeAndBackfill(){
   var DEF = { hp:100, mp:30, atk:10, matk:10, def:8, mdef:8, acc:75, eva:5, crit:3, aspd:1.00 };

   function clamp(v,min,max){ if(v<min) return min; if(v>max) return max; return v; }
   function round(n){ return Math.round(n); }

   function backfillAttributes(m){
     if (m.attributes && typeof m.attributes.str==='number') return; // 已有就不動
     var s = m.stats||{}, L = m.level||1;

     // 反推六圍（以你公式的近似反解）
     // 1) 力道：atk ≈ str*2 + L → str ≈ (atk - L)/2
     var str = round(((s.atk||DEF.atk) - L)/2);

     // 2) 體魄：hp ≈ 80 + vit*12 + L*6 → vit ≈ (hp - 80 - 6L)/12
     var vit = round(((s.hp||DEF.hp) - 80 - 6*L)/12);

     // 3) 身法：由 acc 與 速度 共同估，acc≈60+dex*2；speed≈100+dex*2.2
     var dexFromAcc   = ((s.acc||DEF.acc) - 60)/2;
     var dexFromSpeed = (( (typeof s.aspd==='number'?s.aspd:1.00)*100 ) - 100)/2.2;
     var dex = round(( (isFinite(dexFromAcc)?dexFromAcc:0) + (isFinite(dexFromSpeed)?dexFromSpeed:0) )/2);

     // 4) 悟性/心神：由 mp 與 matk/法防估
     // mp ≈ 40 + wis*10 + floor(int*6/5)；先用 matk≈int*2 估 int，再回推 wis
     var int0 = ((s.matk||DEF.matk) / 2);
     var wisFromMP = ((s.mp||DEF.mp) - 40 - Math.floor((isFinite(int0)?int0:0)*6/5)) / 10;
     // 另由法防與心神關係微調：mdef ≈ floor(wis*1.3) + floor(int*0.5)
     var wisFromMdef = ((s.mdef||DEF.mdef) - Math.floor((isFinite(int0)?int0:0)*0.5)) / 1.3;
     var wis = round( ( (isFinite(wisFromMP)?wisFromMP:0) + (isFinite(wisFromMdef)?wisFromMdef:0) ) / 2 );
     var Int = round(isFinite(int0)?int0:10);

     // 5) 氣運：crit ≈ 3 + floor(luk*0.8)，critdmg ≈ 50 + floor(luk*1.5)
     var lukFromCrit   = ((s.crit||DEF.crit) - 3) / 0.8;
     var lukFromCrtDmg = (( (typeof s.critdmg==='number')?s.critdmg:150 ) - 50) / 1.5;
     var luk = round( ( (isFinite(lukFromCrit)?lukFromCrit:0) + (isFinite(lukFromCrtDmg)?lukFromCrtDmg:lukFromCrit) ) / 2 );

     // 夾限（避免負數/爆表）
     str = clamp(str,  1, 200);
     vit = clamp(vit,  1, 200);
     dex = clamp(dex,  1, 200);
     Int = clamp(Int,  1, 200);
     wis = clamp(wis,  1, 200);
     luk = clamp(luk,  1, 200);

     m.attributes = { str:str, vit:vit, dex:dex, int:Int, wis:wis, luk:luk };
   }

   Object.keys(DB).forEach(function(key){
     var m = DB[key];
     if(!m) return;
     // 先補齊缺的 stats
     m.stats = m.stats || {};
     for (var k in DEF){ if (typeof m.stats[k] !== 'number') m.stats[k] = DEF[k]; }
     // 再嘗試反推 attributes
     backfillAttributes(m);
   });
 })();



// === 工具 ===
  const rnd = function(a,b){ return Math.floor(Math.random()*(b-a+1))+a; };

  function get(id){ return DB[id] || null; }
  function byLevel(level){ return Object.values(DB).filter(function(m){ return m.level===level; }); }

  function rollDrops(monsterId){
    var m = get(monsterId); if(!m) return [];
    var drops=[];
    for(var i=0;i<(m.drops||[]).length;i++){
      var d = m.drops[i];
      var chance = (typeof d.chance==='number') ? d.chance : 0;
      if(Math.random() <= chance){
        var min = d.min|0, max = d.max|0;
        var qty = rnd(min, max);
        if(qty>0) drops.push({ type:d.type, id:d.id, name:d.name, amount:qty });
      }
    }
    return drops;
  }


// 直接把掉落套用到玩家（含武器/飾品/勳章）
function applyDrops(player, drops){
  if(!player || !Array.isArray(drops) || !drops.length) return;
  player.currencies = player.currencies || { stone:0, diamond:0 };
  player.bag = player.bag || (window.ItemDB && ItemDB.getDefaultBag ? ItemDB.getDefaultBag() : {consumables:[],weapons:[],ornaments:[],materials:[],hidden:[]});

  for(var i=0;i<drops.length;i++){
    var d = drops[i];
    var qty = d.amount|0; if(qty<=0) continue;

    if(d.type==='currency' && d.id==='stone'){
      player.currencies.stone += qty;
    }
    else if(d.type==='consumable'){
      if(window.ItemDB && ItemDB.addConsumableToBag) ItemDB.addConsumableToBag(player.bag, d.id, qty);
    }
    else if(d.type==='material'){
      if(window.ItemDB && ItemDB.addMaterialToBag)  ItemDB.addMaterialToBag(player.bag, d.id, qty);
    }
    else if(d.type==='weapon'){
      if(window.ItemDB && ItemDB.addWeaponToBag)    ItemDB.addWeaponToBag(player.bag, d.id, qty);
    }
    else if(d.type==='ornament' || d.type==='accessory'){
      if(window.ItemDB && ItemDB.addOrnamentToBag)  ItemDB.addOrnamentToBag(player.bag, d.id, qty);
    }
    else if(d.type==='medal'){
      if(window.ItemDB && ItemDB.addMedalToBag)     ItemDB.addMedalToBag(player.bag, d.id, qty);
    }
  }
  if(window.Auth && Auth.saveCharacter) {
    var cleanData = JSON.parse(JSON.stringify(player));
    delete cleanData._live;
    Auth.saveCharacter(cleanData);
  }
}

  function getImage(id){
    var m = get(id);
    return { url: (m && m.img) ? m.img : DEFAULT_IMG, mirror: !!(m && m.imgMirror) };
  }

  // 怪物「自有六圍」→ 你的衍生鍵名 → 再套 scales
  // 規則：
  // 1) 若 m.attributes 存在，使用你的公式計算（與主城一致）
  // 2) 否則退回用 m.stats 對應成你的鍵名
  // 3) 最後一律乘上 defaultScales 與 m.scales
  function deriveAgainst(_dp_ignored, monsterId){
    var m = get(monsterId); if(!m) return null;
    var sc = Object.assign({}, defaultScales, m.scales||{});

    function derivedFromAttrs(mon){
      var A = (mon && mon.attributes) ? mon.attributes : null;
      if(!A) return null;
      var L = mon.level || 1;
      var out = {
        '物理攻擊': A.str*2 + L,
        '法術攻擊': A.int*2 + Math.floor(A.wis*0.5),
        '氣血上限': 80 + A.vit*12 + L*6,
        '真元上限': 40 + A.wis*10 + Math.floor(A.int*6/5),
        '物理防禦': Math.floor(A.vit*1.2) + Math.floor(A.dex*0.6),
        '法術防禦': Math.floor(A.wis*1.3) + Math.floor(A.int*0.5),
        '命中率': 60 + A.dex*2,
        '閃避': 5 + Math.floor(A.dex*1.2),
        '暴擊率': Math.min(50, 3 + Math.floor(A.luk*0.8)),
        '暴擊傷害': 50 + Math.floor(A.luk*1.5),
        '行動條速度': 100 + Math.floor(A.dex*2.2),
        '回氣/回合': 2 + Math.floor(A.wis*0.4),
        '回血/回合': 1 + Math.floor(A.vit*0.5),
        '破甲': Math.floor(A.str*0.6),
        '法穿': Math.floor(A.int*0.6)
      };
      return out;
    }

function mappedFromStats(mon){
      var s = mon.stats||{};
      var out = {
        '氣血上限':   (typeof s.hp==='number')?s.hp:100,
        '真元上限':   (typeof s.mp==='number')?s.mp:40,
        '物理攻擊':   (typeof s.atk==='number')?s.atk:10,
        '法術攻擊':   (typeof s.matk==='number')?s.matk:10,
        '物理防禦':   (typeof s.def==='number')?s.def:8,
        '法術防禦':   (typeof s.mdef==='number')?s.mdef:8,
        '命中率':     (typeof s.acc==='number')?s.acc:75,
        '閃避':       (typeof s.eva==='number')?s.eva:5,
        '暴擊率':     Math.min(100, (typeof s.crit==='number')?s.crit:3),
        '暴擊傷害':   (typeof s.critdmg==='number')?Math.max(100,s.critdmg):150,
        // 行動條速度 = aspd × 100（不再做 40 保底；由戰鬥端做人性化保底/比例）
        '行動條速度': Math.round(((typeof s.aspd==='number'?s.aspd:1.00)*100)),
        '回氣/回合':  (typeof s.regen_mp==='number')?s.regen_mp:2,
        '回血/回合':  (typeof s.regen_hp==='number')?s.regen_hp:1,
        '破甲':       (typeof s.pen==='number')?s.pen:0,
        '法穿':       (typeof s.mpen==='number')?s.mpen:0
      };
      return out;
    }



    var sheet = derivedFromAttrs(m) || mappedFromStats(m);
    var out = {};
    for (var k in sheet){
      var mul = (sc[k]!==undefined) ? sc[k] : 1.0;
      var v = Math.round((sheet[k]||0) * mul);
      if (k==='暴擊率') { if (v<0) v=0; if (v>100) v=100; }
      else if (k==='暴擊傷害') { if (v<1) v=1; }
      else { if (v<1) v=1; }
      out[k] = v;
    }
    return out;
  }

  //（可選）供地圖直接取用
  function getDerived(monId){ return deriveAgainst(null, monId); }



/* === 怪物 Rank 與 expFor(mon) 規則（供 map.html 使用）=== */
  var EXP_RULE = {
    normal: function(lvl){ return Math.round(10 + lvl*4); },        // 基礎
    elite:  function(lvl){ return Math.round((10 + lvl*4) * 1.8); },// 菁英倍率
    boss:   function(lvl){ return Math.round((10 + lvl*4) * 4.0); } // BOSS 倍率
  };

/* === 活動：全局經驗倍率（預設 1.0，可動態調整）=== */
  var EXP_EVENT_MUL = 1.0;
  function setGlobalExpMultiplier(x){
    if (typeof x==='number' && x>0) { EXP_EVENT_MUL = x; }
  }
  function clearGlobalExpMultiplier(){
    EXP_EVENT_MUL = 1.0;
  }


  // 舊怪未標 rank：依 id 後綴推斷；否則預設 normal
  function rankOf(id){
    var m = get(id);
    if (m && m.rank) return m.rank;
    var sid = String(id||'');
    if (sid.slice(-5)==='_boss') return 'boss';
    if (sid.slice(-6)==='_elite') return 'elite';
    return 'normal';
  }

function expFor(mon, playerLevel){
    var m = (typeof mon==='string') ? get(mon) : mon;
    var mul = (typeof EXP_EVENT_MUL==='number' && EXP_EVENT_MUL>0) ? EXP_EVENT_MUL : 1;

    if(!m){
      return Math.round(EXP_RULE.normal(1) * mul);
    }
    var r = rankOf(m.id);
    var lvl = m.level || 1;
    var fn = EXP_RULE[r] || EXP_RULE.normal;
    var base = fn(lvl);

    // 套用每隻怪的額外經驗（若有設定）
    var bonus = 0;
    var xpb = (m && m.xpBonus) ? m.xpBonus : null;
    var pLvl = (typeof playerLevel==='number') ? playerLevel : null;
    if (xpb && typeof xpb.extra==='number'){
      // 未設定 cutoffLevel → 一律給；有設定 → 玩家等級未超過才給
      if (!xpb.cutoffLevel || (pLvl === null) || (pLvl <= xpb.cutoffLevel)){
        bonus = Math.max(0, Math.round(xpb.extra));
      }
    }

    return Math.round((base + bonus) * mul);
  }




  window.MonsterDB = {
    DB: DB,
    get: get,
    byLevel: byLevel,
    rollDrops: rollDrops,
    applyDrops: applyDrops,
    getImage: getImage,
    // 新增：直接取怪物「衍生能力表」（鍵名與主城一致）
    getDerived: getDerived,
    // 保留舊介面（若有其它地方還用得到）
    deriveAgainst: deriveAgainst,
    rankOf: rankOf,
    expFor: expFor
  };


})();


