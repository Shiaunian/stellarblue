// map-data.js — 由 map.html 移出（修正：提供全域變數綁定）
var MAPS = [
{ id:'forest', name:'青木山脈', lv:'1-10', small:[
  { id:'slime_cave',  name:'萊姆洞窟', lv:'1-3',
    monsters:['slime_young','slime','slime_king'], 
    boss:'slime_boss', killsRequired: 8 },
  { id:'woodland',    name:'火林洞',   lv:'4-6',
    monsters:['wood_wisp','Fire_Spirit','laily',"fire_orb"], 
    boss:'flame_master', killsRequired: 12 },
  { id:'moss_vale',   name:'苔石谷',   lv:'7-10',
    monsters:['stone_golem','winter_spirit',"inferno_wolf","inferno_wolf9"],
    boss:'ice_flame_fox', killsRequired: 15 },
  { id:'Wraithwood',   name:'幽魂林谷',   lv:'11-15',
    monsters:['DuskRaven','SubterraneanBeast',"MimicryWoodling","FrostfangBear","IceHeir"],
    boss:'Limely', killsRequired: 15 },
  { id:'Nightmare_Valley',   name:'噩夢山谷',   lv:'16-20',
    monsters:['ghostfire_wood','blue_demon',"ice_crystal_beast","menkete","tundra_bear"],
    boss:'AshHornBeast', killsRequired: 18 },
  { id:'Spirit_Herb_Valley ',   name:'靈藥山谷',   lv:'21-25',
    monsters:['XuePo_SpiritBeast','DouLi_Spirit',"HuoYan_LanternSpirit","ZhangWu_LanternSpirit","YanShi_LanternSpirit"],
    boss:'King_of_Darkness', killsRequired: 20 },
]},
{ id:'tundra', name:'雪原台地', lv:'3-5', small:[
  { id:'snowfield',   name:'雪原狩場', lv:'3-4',
    monsters:['snow_wolf','ice_thorn'], 
    boss:'ice_bear_boss', killsRequired: 10 },
  { id:'ice_cave',    name:'寒晶洞穴', lv:'4-5',
    monsters:['ice_bear','ice_thorn'], 
    boss:'ice_cave_boss', killsRequired: 12 },  // ★ 加上 boss
]},
{ id:'ruins', name:'幽怨遺跡', lv:'5-7', small:[
  { id:'spirit_hall', name:'靈侍大殿', lv:'4-6',
    monsters:['spirit_acolyte','wraith'], 
    boss:'spirit_acolyte_boss', killsRequired: 15 },
  { id:'shadow_pit',  name:'影翼深坑', lv:'4-6',
    monsters:['shadow_bat','wraith'],     
    boss:'shadow_bat_boss', killsRequired: 15 },
]},
{ id:'canyon', name:'磐石峽谷', lv:'3-6', small:[
  { id:'beetle_ridge', name:'雷角嶺',  lv:'5-6',
    monsters:['brass_beetle','thunder_beetle'], 
    boss:'thunder_beetle_boss', killsRequired: 18 },
  { id:'bog',          name:'泥潭窪地',lv:'3-5',
    monsters:['bog_tortoise','stone_golem'],    
    boss:'ancient_tortoise_boss', killsRequired: 14 },
]}
];
window.MAPS = MAPS;
