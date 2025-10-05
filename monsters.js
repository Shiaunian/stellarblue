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
  stats:{ hp:78, mp:32, atk:2,  matk:0,  def:0,  mdef:0,  acc:68, eva:4, crit:2, aspd:1.00 },
  // 能力值（主要）生命值/魔力值/物理攻擊力/魔法攻擊力/物理防禦力/魔法防禦力/命中率/閃避率/暴擊率/攻擊速度
  extra:{ critDmg:50, recover_mp:2, recover_hp:1, armorPen:0, magicPen:0 },         // 額外屬性：暴擊傷害/回復魔力/回復生命/物理穿透/魔法穿透
  skills:[
    { id:'dash', name:'衝撞', elem:'none', kind:'physical', power:110, mp:6, desc:'造成120%無屬性物理傷害', chance: 0.30, lowHpBonus: 0.20 }
  ],
      // 額外經驗：+5；若玩家等級超過10等則不給（僅註記，不影響相容）
  xpBonus:{ extra:20, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
  drops:[
    {type:'currency',  id:'stone',         name:'靈石',      min:6,  max:14, chance:1.00},      // 掉落貨幣：靈石，數量6-14，機率100%
    {type:'cloaks',  id:'cloak_fur',   name:'野獸皮披風', min:1,  max:1,  chance:0.60},
    {type:'armors',  id:'armor_leather',   name:'皮甲', min:1,  max:1,  chance:0.60},
    {type:'boots',  id:'boot_cloth',   name:'布鞋', min:1,  max:1,  chance:0.60},
    {type:'earrings',  id:'ear_shadow',   name:'影縛耳環', min:1,  max:1,  chance:0.60},
    {type:'earrings',id:'ear_ice', name:'冰痕耳環',   min:1,  max:1,  chance:0.60},      // 掉落消耗品：小氣血丹，數量1，機率60%
    {type:'accessory', id:'jade_ring',     name:'翠玉戒指',   min:1,  max:1,  chance:0.60}      // 掉落飾品：翠玉戒指，數量1，機率5%
  ]
},


  slime:{
    id:'slime', name:'萊姆成體', level:2, element:'none',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757507487/%E8%90%8A%E5%A7%86%E6%88%90%E9%AB%94_zqui1l.png', imgMirror:false,
    appear:{ minPlayerLevel:2 }, // 出現條件：角色達到 2 等
    stats:{ hp:93, mp:32, atk:5,  matk:0,  def:1,  mdef:0,  acc:69, eva:4, crit:2, aspd:1.00 },
    extra:{ critDmg:51, recover_mp:2, recover_hp:1, armorPen:0, magicPen:0 },
    skills:[
      { id:'dash', name:'衝撞', elem:'none', kind:'physical', power:110, mp:6, desc:'造成120%無屬性物理傷害', chance: 0.30, lowHpBonus: 0.20 }
    ],
        // 額外經驗：+5；若玩家等級超過10等則不給（僅註記，不影響相容）
    xpBonus:{ extra:20, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',       name:'靈石',       min:10, max:15, chance:1.00},
      {type:'cards',  id:'S20-001',   name:'パーティーの誘い アスナ RR', min:1,  max:1,  chance:0.60},
      {type:'cards',  id:'S20-001S',   name:'パーティーの誘い アスナ SR', min:1,  max:1,  chance:0.60},
      {type:'earrings',  id:'ear_shadow',   name:'影縛耳環', min:1,  max:1,  chance:0.60},
      {type:'earrings',id:'ear_ice',    name:'冰痕耳環',   min:1,  max:1,  chance:0.60},
      {type:'accessory', id:'jade_ring',   name:'翠玉戒指',   min:1,  max:1,  chance:0.60}
    ]
  },

  slime_king:{
    id:'slime_king', name:'史萊姆', level:3, element:'none',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757508388/%E5%8F%B2%E8%90%8A%E5%A7%86_xlo0qz.png', imgMirror:false,
    appear:{ minPlayerLevel:4 }, // 出現條件：角色達到 4 等
    stats:{ hp:98, mp:34, atk:6,  matk:2,  def:1,  mdef:0,  acc:71, eva:6, crit:2, aspd:1.00 },
    extra:{ critDmg:52, recover_mp:2, recover_hp:1, armorPen:1, magicPen:0 },
    skills:[
      { id:'dash', name:'高速衝撞', elem:'none', kind:'physical', power:120, mp:10, desc:'造成120%無屬性物理傷害', chance: 0.35, lowHpBonus: 0.25 }
    ],
    // 額外經驗：+5；若玩家等級超過10等則不給（僅註記，不影響相容）
    xpBonus:{ extra:20, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',       name:'靈石',       min:15, max:20, chance:1.00},
      {type:'earrings',  id:'ear_shadow',   name:'影縛耳環', min:1,  max:1,  chance:0.60},
      {type:'consumable',id:'hp_small',    name:'小氣血丹',   min:1,  max:1,  chance:0.60},
      {type:'accessory', id:'jade_ring',   name:'翠玉戒指',   min:1,  max:1,  chance:0.60}
    ]
  },

  /* === 新增：木幽火（wood_wisp） === */
  wood_wisp:{
    id:'wood_wisp', name:'木幽火', level:4, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757512929/%E6%9C%A8%E5%B9%BD%E7%81%AB_azpqyy.png', imgMirror:false,
    stats:{ hp:103, mp:42, atk:15,  matk:2,  def:10,  mdef:2,  acc:72, eva:6, crit:2, aspd:1.05 },
    extra:{ critDmg:52, recover_mp:3, recover_hp:1, armorPen:0, magicPen:1 },
    skills:[
      {
        id:'ember', name:'火苗', elem:'fire', kind:'magical', power:110, mp:12,
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
    stats:{ hp:103, mp:42, atk:17,  matk:2,  def:12,  mdef:2,  acc:72, eva:6, crit:2, aspd:1.10 },
    extra:{ critDmg:53, recover_mp:3, recover_hp:1, armorPen:0, magicPen:1 },
    ai:{ pattern:'smart', note:'先 1~2 次普攻，之後只要有 MP 優先用技能' },
    skills:[
      {
        id:'fire_kiss', name:'火吻', elem:'fire', kind:'magical', power:120, mp:15,
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
    stats:{ hp:119, mp:43, atk:18,  matk:2,  def:14,  mdef:6,  acc:73, eva:7, crit:3, aspd:1.15 },
    extra:{ critDmg:55, recover_mp:3, recover_hp:1, armorPen:1, magicPen:1 },
    skills:[
      {
        id:'fire_kiss', name:'火吻', elem:'fire', kind:'magical', power:120, mp:15,
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
    stats:{ hp:124, mp:44, atk:20,  matk:4,  def:16,  mdef:4,  acc:75, eva:8, crit:3, aspd:1.12 },
    extra:{ critDmg:55, recover_mp:3, recover_hp:1, armorPen:1, magicPen:1 },
    skills:[
      {
        id:'fire_kiss', name:'火吻', elem:'fire', kind:'magical', power:120, mp:15,
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
    stone_golem:{
    id:'stone_golem', name:'石像守衛', level:7, element:'rock',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757827138/%E7%9F%B3%E5%83%8F%E5%AE%88%E8%A1%9B_zbn95l.png', imgMirror:false,
    scales:{},
    stats:{ hp:170, mp:60, atk:20, matk:5, def:36, mdef:14, acc:60, eva:1, crit:5, aspd:1.00 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    winter_spirit:{
    id:'winter_spirit', name:'冰霜妖', level:8, element:'ice',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757826863/%E5%86%B0%E9%9C%9C%E5%A6%96_vljrns.png', imgMirror:false,
    scales:{},
    stats:{ hp:188, mp:110, atk:23, matk:22, def:11, mdef:19, acc:70, eva:1, crit:6, aspd:1.20 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    inferno_wolf:{
    id:'inferno_wolf', name:'地獄狼', level:8, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757827949/%E5%9C%B0%E7%8D%84%E7%8B%BC_pkukuz.png', imgMirror:false,
    scales:{},
    stats:{ hp:210, mp:70, atk:27, matk:11, def:22, mdef:13, acc:70, eva:4, crit:7, aspd:1.30 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:15, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    inferno_wolf9:{
    id:'inferno_wolf9', name:'菁英地獄狼', level:9, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757827949/%E5%9C%B0%E7%8D%84%E7%8B%BC_pkukuz.png', imgMirror:false,
    scales:{},
    stats:{ hp:235, mp:76, atk:31, matk:15, def:24, mdef:16, acc:72, eva:4, crit:7, aspd:1.30 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    DuskRaven:{
    id:'DuskRaven', name:'暗夜暮', level:11, element:'dark',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758010776/%E6%9A%97%E5%A4%9C%E6%9A%AElv11_pnuzmz.png', imgMirror:false,
    scales:{},
    stats:{ hp:245, mp:80, atk:32, matk:26, def:31, mdef:22, acc:72, eva:4, crit:7, aspd:1.20 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    SubterraneanBeast:{
    id:'SubterraneanBeast', name:'地下水怪', level:12, element:'water',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758010776/%E5%9C%B0%E4%B8%8B%E6%B0%B4%E6%80%AAlv12_ecthur.png', imgMirror:false,
    scales:{},
    stats:{ hp:255, mp:110, atk:34, matk:15, def:28, mdef:16, acc:72, eva:4, crit:7, aspd:1.10 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    MimicryWoodling:{
    id:'MimicryWoodling', name:'偽裝木妖', level:13, element:'grass',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758010776/%E5%81%BD%E8%A3%9D%E6%9C%A8%E5%A6%96lv13_wchtr2.png', imgMirror:false,
    scales:{},
    stats:{ hp:270, mp:80, atk:36, matk:24, def:26, mdef:20, acc:72, eva:5, crit:8, aspd:1.05 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    FrostfangBear:{
    id:'FrostfangBear', name:'寒霜冰熊', level:14, element:'ice',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758010776/%E5%AF%92%E9%9C%9C%E5%86%B0%E7%86%8Alv14_x7ryfc.png', imgMirror:false,
    scales:{},
    stats:{ hp:280, mp:110, atk:40, matk:15, def:32, mdef:16, acc:76, eva:6, crit:8, aspd:1.15 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    IceHeir:{
    id:'IceHeir', name:'冰霜之子', level:15, element:'ice',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758010776/%E5%86%B0%E9%9C%9C%E4%B9%8B%E5%AD%90LV15_c8te2j.png', imgMirror:false,
    scales:{},
    stats:{ hp:310, mp:120, atk:38, matk:20, def:28, mdef:22, acc:72, eva:7, crit:9, aspd:1.20 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    ghostfire_wood:{
    id:'ghostfire_wood', name:'鬼火木', level:16, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758035043/%E9%AC%BC%E7%81%AB%E6%9C%A8LV16_zvw8ee.png', imgMirror:false,
    scales:{},
    stats:{ hp:320, mp:140, atk:39, matk:26, def:28, mdef:24, acc:77, eva:7, crit:9, aspd:1.05 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    blue_demon:{
    id:'blue_demon', name:'藍妖魔', level:17, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758035043/%E8%97%8D%E5%A6%96%E9%AD%94LV17_wespyq.png', imgMirror:false,
    scales:{},
    stats:{ hp:360, mp:140, atk:44, matk:26, def:36, mdef:24, acc:76, eva:9, crit:11, aspd:1.20 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    ice_crystal_beast:{
    id:'ice_crystal_beast', name:'冰鑽怪', level:18, element:'ice',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758035043/%E5%86%B0%E9%91%BD%E6%80%AALV18_uupsgp.png', imgMirror:false,
    scales:{},
    stats:{ hp:410, mp:160, atk:44, matk:27, def:37, mdef:27, acc:72, eva:9, crit:11, aspd:1.20 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    menkete:{
    id:'menkete', name:'孟凱特', level:19, element:'body',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758035042/%E5%AD%9F%E5%87%B1%E7%89%B9LV19_qdlis1.png', imgMirror:false,
    scales:{},
    stats:{ hp:470, mp:80, atk:49, matk:22, def:35, mdef:19, acc:78, eva:11, crit:12, aspd:1.20 },
      // 能力值（主要）生命值/魔力值/物理攻擊力/魔法攻擊力/物理防禦力/魔法防禦力/命中率/閃避率/暴擊率/攻擊速度
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    tundra_bear:{
    id:'tundra_bear', name:'雪原地熊', level:20, element:'none',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758035043/%E9%9B%AA%E5%8E%9F%E5%9C%B0%E7%86%8ALV20_aobui4.png', imgMirror:false,
    scales:{},
    stats:{ hp:530, mp:120, atk:45, matk:24, def:41, mdef:38, acc:72, eva:7, crit:9, aspd:1.10 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    XuePo_SpiritBeast:{
    id:'XuePo_SpiritBeast', name:'雪魄靈獸', level:21, element:'ice',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758168219/%E9%9B%AA%E9%AD%84%E9%9D%88%E7%8D%B8LV21_csmm2k.png', imgMirror:false,
    scales:{},
    stats:{ hp:550, mp:120, atk:44, matk:20, def:47, mdef:31, acc:72, eva:7, crit:10, aspd:1.15 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    DouLi_Spirit:{
    id:'DouLi_Spirit', name:'斗笠精', level:22, element:'none',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758168221/%E6%96%97%E7%AC%A0%E7%B2%BELV22_yowc6n.png', imgMirror:false,
    scales:{},
    stats:{ hp:480, mp:160, atk:45, matk:31, def:40, mdef:23, acc:72, eva:7, crit:9, aspd:1.20 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    HuoYan_LanternSpirit:{
    id:'HuoYan_LanternSpirit', name:'火燄燈靈', level:23, element:'fire',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758168218/%E7%81%AB%E7%87%84%E7%87%88%E9%9D%88LV23_rjpay7.png', imgMirror:false,
    scales:{},
    stats:{ hp:510, mp:120, atk:48, matk:37, def:30, mdef:30, acc:80, eva:7, crit:11, aspd:1.20 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    ZhangWu_LanternSpirit:{
    id:'ZhangWu_LanternSpirit', name:'瘴霧燈靈', level:24, element:'dark',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758168218/%E7%98%B4%E9%9C%A7%E7%87%88%E9%9D%88LV24_bs8u2w.png', imgMirror:false,
    scales:{},
    stats:{ hp:530, mp:140, atk:50, matk:36, def:34, mdef:21, acc:82, eva:7, crit:11, aspd:1.20 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
    YanShi_LanternSpirit:{
    id:'YanShi_LanternSpirit', name:'岩石燈靈', level:25, element:'rock',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758168218/%E5%B2%A9%E7%9F%B3%E7%87%88%E9%9D%88LV25_tfvsz4.png', imgMirror:false,
    scales:{},
    stats:{ hp:570, mp:120, atk:45, matk:20, def:42, mdef:22, acc:82, eva:7, crit:11, aspd:1.10 },
    // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:1, note:'玩家等級>10則無額外獎勵' },
    drops:[
      {type:'currency',  id:'stone',      name:'靈石',     min:14, max:28, chance:1.00},
      {type:'material',  id:'stone_core', name:'石像核心', min:1,  max:1,  chance:0.30},
      {type:'material',  id:'hard_rock',  name:'堅石',     min:2,  max:4,  chance:0.60},
      
    ]
  },
  


  // ★ 原有 BOSS（保留原圖）
  slime_boss: {
    id:'slime_boss', name:'萊姆王', level:3, element:'none',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756707781/%E5%8F%B2%E8%90%8A%E7%8E%8B_kzopon.png', imgMirror:false,  
    scales:{}, 
    stats:{ hp:250, mp:60, atk:27, matk:22, def:20, mdef:12, acc:85, eva:6, crit:5, aspd:1.10 },  // 能力值（主要）生命值/魔力值/物理攻擊力/魔法攻擊力/物理防禦力/魔法防禦力/命中率/閃避率/暴擊率/攻擊速度
    extra:{ critDmg:50, recover_mp:2, recover_hp:1, armorPen:0, magicPen:0 },    // 額外屬性：暴擊傷害/回復魔力/回復生命/物理穿透/魔法穿透
        // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
    skills: [
      { id:'slime_wave', name:'萊姆波動', kind:'magical', elem:'none', dps:4, duration:5, chance:0.25, lowHpBonus:0.35 } 
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
  stats:{ hp:550, mp:110, atk:32, matk:30, def:27, mdef:22, acc:87, eva:10, crit:6, aspd:1.30 },
      // 額外經驗 +8；若玩家等級 > 10 不給
    xpBonus:{ extra:10, cutoffLevel:10, note:'玩家等級>10則無額外獎勵' },
  skills:[
    { id:'flame_burst', chance: 0.40, lowHpBonus: 0.35 },  // 🔥 改為引用模式
    { id:'fire_kiss', chance: 0.35, lowHpBonus: 0.30 }
  ],
  drops:[
    {type:'currency',  id:'stone',       name:'靈石',      min:10, max:22, chance:1.00},
    {type:'material',  id:'fox_tail',    name:'靈狐尾',    min:1,  max:1,  chance:0.40},
    {type:'material',  id:'thorn_shard', name:'荊棘碎片',  min:1,  max:3,  chance:0.70},
  ]
},

  ice_flame_fox:{
    id:'ice_flame_fox', name:'冰焰狐', level:10, element:'fire',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757845184/%E7%81%AB%E7%8B%90%E5%86%B0%E5%A6%96_ropah6.png', imgMirror:false,
    scales:{},
    stats:{ hp:650, mp:170, atk:34, matk:26, def:20, mdef:14, acc:88, eva:11, crit:7, aspd:1.30 },
    skills:[
      { id:'ice_shard', chance: 0.40, lowHpBonus: 0.35 },  // 🔥 改為引用模式
      { id:'glacier_prison', chance: 0.35, lowHpBonus: 0.30 }
    ],
    drops:[
      {type:'currency',  id:'stone',        name:'靈石',    min:16, max:30, chance:1.00},
      {type:'material',  id:'ghost_essence',name:'幽魂精華',min:1,  max:2,  chance:0.45},
      {type:'consumable',id:'mp_small',     name:'靈氣丹',  min:1,  max:1,  chance:0.30},
    ]
  },
  Limely:{
    id:'Limely', name:'水怪萊姆立', level:15, element:'water',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758010776/%E6%B0%B4%E6%80%AA%E8%90%8A%E5%A7%86%E7%AB%8BbossLV15_w7bg52.png', imgMirror:false,
    scales:{},
    stats:{ hp:820, mp:170, atk:44, matk:22, def:34, mdef:19, acc:90, eva:10, crit:7, aspd:1.30 },
    drops:[
      {type:'currency',  id:'stone',    name:'靈石', min:9,  max:20, chance:1.00},
      {type:'material',  id:'wolf_fur', name:'狼毛', min:1,  max:2,  chance:0.80},
      {type:'material',  id:'wolf_fang',name:'狼牙', min:1,  max:1,  chance:0.40},
    ]
  },
  AshHornBeast:{
    id:'AshHornBeast', name:'霜燼角獣', level:20, element:'none',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758035427/%E9%9C%9C%E7%87%BC%E8%A7%92%E7%8D%A3bossLV20_n5alej.png', imgMirror:false,
    scales:{},
    stats:{ hp:1050, mp:400, atk:67, matk:30, def:41, mdef:24, acc:92, eva:12, crit:8, aspd:1.40 },
    drops:[
      {type:'currency',  id:'stone',     name:'靈石', min:14, max:26, chance:1.00},
      {type:'material',  id:'bear_claw', name:'熊爪', min:1,  max:1,  chance:0.40},
      {type:'material',  id:'bear_fur',  name:'熊皮', min:1,  max:2,  chance:0.70},
    ]
  },
  King_of_Darkness:{
    id:'King_of_Darkness', name:'闇之王', level:25, element:'dark',rank: 'boss',
    img:'https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758168218/%E9%97%87%E4%B9%8B%E7%8E%8BbossLV25_a4mdga.png', imgMirror:false,
    scales:{ '法術攻擊':1.05, '法術防禦':1.05, '行動條速度':0.95 },
    stats:{ hp:1250, mp:65, atk:63, matk:40, def:50, mdef:37, acc:87, eva:12, crit:13, aspd:1.40 },
    drops:[
      {type:'currency',  id:'stone',          name:'靈石',     min:12, max:24, chance:1.00},
      {type:'material',  id:'ice_crystal',    name:'冰晶',     min:1,  max:3,  chance:0.65},
      {type:'material',  id:'frozen_thorn',   name:'凍結荊棘', min:1,  max:1,  chance:0.35},
    ]
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
    else if(d.type==='cards'){
      if(window.ItemDB && ItemDB.addCardToCollection) ItemDB.addCardToCollection(player, d.id, qty);
    }
    else if(d.type==='ornament' || d.type==='accessory' || d.type==='earrings' || d.type==='rings' || d.type==='cloaks' || d.type==='armors' || d.type==='boots'){
      if(window.ItemDB && ItemDB.addOrnamentToBag)  ItemDB.addOrnamentToBag(player.bag, d.id, qty);
    }
    else if(d.type==='medal' || d.type==='medals'){
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


