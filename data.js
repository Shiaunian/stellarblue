// ===============================
// data.js  (資料與純函式)
// 依賴：無（純資料）
// 供外部使用：ICON, slotIconByKey, ELEM, ITEMS, SHOP_STOCK, MONSTER_DB, MAPS
//            以及 UI 會用到的：elemLabel, rarityLabel, rarityClass, equipStatsText, equipItem
// ===============================

// === Icon URLs ===
const ICON = {
  sword:'https://api.iconify.design/mdi:sword.svg',
  dagger:'https://api.iconify.design/mdi:knife.svg',
  cloak:'https://api.iconify.design/game-icons:hood.svg',
  boots:'https://api.iconify.design/mdi:shoe-sneaker.svg',
  medal:'https://api.iconify.design/mdi:medal.svg',
  ring:'https://api.iconify.design/mdi:ring.svg',
  potion:'https://api.iconify.design/mdi:bottle-tonic-plus-outline.svg',
  book:'https://api.iconify.design/mdi:book-open-variant.svg',
  scroll:'https://api.iconify.design/mdi:scroll.svg',
  bone:'https://api.iconify.design/mdi:bone.svg',
  chest:'https://api.iconify.design/mdi:treasure-chest.svg',
  enemy_bandit:'https://api.iconify.design/mdi:sword-cross.svg',
  enemy_wood:'https://api.iconify.design/game-icons:treant.svg',
  enemy_fire:'https://api.iconify.design/mdi:fire.svg',
  enemy_water:'https://api.iconify.design/mdi:water.svg',
  enemy_bug:'https://api.iconify.design/game-icons:beetle-shell.svg',
  slot:'https://api.iconify.design/mdi:checkbox-blank-circle-outline.svg'
};

const slotIconByKey = {
  weapon: ICON.sword,
  cloak: ICON.cloak,
  shoes: ICON.boots,
  medal: ICON.medal,
  ring: ICON.ring,
  reserved: ICON.chest
};

// === Elements ===
const ELEM = {
  NEUTRAL:'NEUTRAL',
  WATER:'WATER', FIRE:'FIRE', GRASS:'GRASS', EARTH:'EARTH',
  ICE:'ICE', THUNDER:'THUNDER', LIGHT:'LIGHT', DARK:'DARK'
};

// === 標籤與樣式工具（UI 會用到） ===
function elemLabel(e){
  return {
    NEUTRAL:'無', WATER:'水', FIRE:'火', GRASS:'木', EARTH:'土',
    ICE:'冰', THUNDER:'雷', LIGHT:'聖', DARK:'暗'
  }[e] || '無';
}
function rarityLabel(r){
  return {common:'普通', rare:'稀有', epic:'罕見', legend:'傳說', mythic:'神話', relic:'遺物'}[r] || '普通';
}
function rarityClass(r){ return 'rarity-' + (r || 'common'); }

// === 裝備屬性文字（UI 會用到） ===
function equipStatsText(def){
  if(!def || def.type!=='equip') return '';
  const parts=[];
  if(def.atk) parts.push(`攻擊+${def.atk}`);
  if(def.wil) parts.push(`意志+${def.wil}`);
  if(def.spd) parts.push(`速度+${def.spd}`);
  if(def.luk) parts.push(`幸運+${def.luk}`);
  if(def.all) parts.push(`全屬性+${def.all}`);
  if(def.hit!=null) parts.push(`命中${def.hit}%`);
  if(def.crit) parts.push(`爆擊+${def.crit}%`);
  if(def.speedMul && def.speedMul!==1.0) parts.push(`行動條x${def.speedMul}`);
  parts.push(`元素：${elemLabel(def.elem||ELEM.NEUTRAL)}`);
  parts.push(`稀有度：${rarityLabel(def.rarity||'common')}`);
  return parts.join('｜');
}

// === 裝備生成器 ===
function equipItem({
  id, slot, atk=0, wil=0, spd=0, luk=0, all=0, desc='', rarity='common',
  elem=ELEM.NEUTRAL, hit=95, crit=0, speedMul=1.0, dur=999, icon=null
}){
  return { id, type:'equip', slot, atk, wil, spd, luk, all, desc, rarity,
           elem, hit, crit, speedMul, dur, price:{stone:120}, icon };
}

// === 物品與裝備（注意：effect 內呼叫的 healFlat/addExp/goto 由外部檔案提供） ===
const ITEMS = {
  // —— 戰鬥丹藥 ——
  '小血丹': {id:'A001', type:'potion', icon:"https://i.ibb.co/Hfxz9394/image.png", desc:'氣血回復60點（戰鬥限定）CD 15s', useInCombat:true, useOutCombat:false, cd:15,
    effect:(ctx)=>healFlat(ctx,'hp',20), price:{stone:50}},
  '初血丹': {id:'A002', type:'potion', icon:"https://i.ibb.co/Nd71zTVQ/image.png", desc:'氣血回復120點（戰鬥限定）CD 13s', useInCombat:true, useOutCombat:false, cd:13,
    effect:(ctx)=>healFlat(ctx,'hp',40), price:{stone:120}},
  '中血丹': {id:'A003', type:'potion', icon:"https://i.ibb.co/hxqHhB8M/image.png", desc:'氣血回復180點（戰鬥限定）CD 13s', useInCombat:true, useOutCombat:false, cd:13,
    effect:(ctx)=>healFlat(ctx,'hp',60), price:{stone:260}},
  '大血丹': {id:'A004', type:'potion', icon:"https://i.ibb.co/TMsHqmNX/image.png", desc:'氣血回復240點（戰鬥限定）CD 13s', useInCombat:true, useOutCombat:false, cd:13,
    effect:(ctx)=>healFlat(ctx,'hp',80), price:{stone:550}},
  '氣血丹': {id:'A005', type:'potion', icon:ICON.potion, desc:'氣血回復100點（戰鬥限定）CD 11s', useInCombat:true, useOutCombat:false, cd:11,
    effect:(ctx)=>healFlat(ctx,'hp',100), price:{stone:300}},
  '補血丹': {id:'A006', type:'potion', icon:ICON.potion, desc:'氣血回復120點（戰鬥限定）CD 11s', useInCombat:true, useOutCombat:false, cd:11,
    effect:(ctx)=>healFlat(ctx,'hp',120), price:{stone:350}},
  '回血丹': {id:'A007', type:'potion', icon:ICON.potion, desc:'氣血回復140點（戰鬥限定）CD 10s', useInCombat:true, useOutCombat:false, cd:10,
    effect:(ctx)=>healFlat(ctx,'hp',140), price:{stone:400}},
  '復血丹': {id:'A008', type:'potion', icon:ICON.potion, desc:'氣血回復160點（戰鬥限定）CD 10s', useInCombat:true, useOutCombat:false, cd:10,
    effect:(ctx)=>healFlat(ctx,'hp',160), price:{stone:450}},

  // —— 非戰鬥回復 ——
  '血瓶':   {id:'AA01', type:'consumable', icon:ICON.potion, desc:'氣血回復40點（非戰鬥限定）', useInCombat:false, useOutCombat:true,
    effect:(ctx)=>healFlat(ctx,'hp',40), price:{stone:50}},
  '藥膏':   {id:'AA02', type:'consumable', icon:ICON.potion, desc:'氣血回復80點（非戰鬥限定）', useInCombat:false, useOutCombat:true,
    effect:(ctx)=>healFlat(ctx,'hp',80), price:{stone:100}},
  '超級血瓶': {id:'AA03', type:'consumable', icon:ICON.potion, desc:'氣血回復120點（非戰鬥限定）', useInCombat:false, useOutCombat:true,
    effect:(ctx)=>healFlat(ctx,'hp',120), price:{stone:150}},
  '極效血瓶': {id:'AA04', type:'consumable', icon:ICON.potion, desc:'氣血回復160點（非戰鬥限定）', useInCombat:false, useOutCombat:true,
    effect:(ctx)=>healFlat(ctx,'hp',160), price:{stone:200}},
  '至尊血瓶': {id:'AA05', type:'consumable', icon:ICON.potion, desc:'氣血回復200點（非戰鬥限定）', useInCombat:false, useOutCombat:true,
    effect:(ctx)=>healFlat(ctx,'hp',200), price:{stone:250}},

  // —— 裝備 ——
  '普通的木劍': equipItem({ id:'BA001',  slot:'weapon', icon:ICON.sword,  atk:5,  desc:'普通白字', rarity:'common', elem:ELEM.NEUTRAL, hit:85, crit:5,  speedMul:0.8, dur:50 }),
  '稀有的木劍': equipItem({ id:'BA0011', slot:'weapon', icon:ICON.sword,  atk:8,  desc:'稀有綠字', rarity:'rare',   elem:ELEM.NEUTRAL, hit:85, crit:5,  speedMul:0.8, dur:60 }),
  '罕見的木劍': equipItem({ id:'BA0012', slot:'weapon', icon:ICON.sword,  atk:10, desc:'罕見藍字｜土屬性攻擊+5', rarity:'epic', elem:ELEM.EARTH,   hit:85, crit:5,  speedMul:0.8, dur:80 }),
  '普通木匕首': equipItem({ id:'BA002',  slot:'weapon', icon:ICON.dagger, atk:2,  desc:'普通白字', rarity:'common', elem:ELEM.NEUTRAL, hit:70, crit:15, speedMul:1.0, dur:50 }),
  '稀有木匕首': equipItem({ id:'BA0021', slot:'weapon', icon:ICON.dagger, atk:2,  desc:'稀有綠字', rarity:'rare',   elem:ELEM.NEUTRAL, hit:70, crit:15, speedMul:1.0, dur:60 }),
  '罕見木匕首': equipItem({ id:'BA0022', slot:'weapon', icon:ICON.dagger, atk:2,  desc:'罕見藍字｜木屬性攻擊+5', rarity:'epic', elem:ELEM.GRASS,   hit:80, crit:15, speedMul:1.0, dur:85 }),
  '雲披風':     equipItem({ id:'cl_cloud',  slot:'cloak', icon:ICON.cloak,  wil:4, desc:'意志+4', rarity:'rare' }),
  '木靴':       equipItem({ id:'sh_wood',   slot:'shoes', icon:ICON.boots,  spd:4, desc:'速度+4', rarity:'common' }),
  '青銅勳章':   equipItem({ id:'md_bronze', slot:'medal', icon:ICON.medal,  all:2, desc:'全屬性+2', rarity:'rare' }),
  '銀戒':       equipItem({ id:'rg_silver', slot:'ring',  icon:ICON.ring,   luk:3, desc:'幸運+3', rarity:'epic' }),
  '野蠻人之斧': equipItem({ id:'axe_barbarian', slot:'weapon', icon:ICON.sword,
                             atk:14, desc:'沉重的大斧', rarity:'epic', elem:ELEM.NEUTRAL, hit:80, crit:8, speedMul:0.9, dur:120 }),

  // —— 功能/材料 ——
  '修煉經書': {id:'exp_book', type:'consumable', icon:ICON.book,  desc:'立即獲得 50 EXP（非戰鬥）',
    useInCombat:false, useOutCombat:true, effect:(ctx)=>addExp(50), price:{stone:120}},
  '回城符':   {id:'town_scroll', type:'other', icon:ICON.scroll,  desc:'離開危險地帶回到主頁（非戰鬥）',
    useInCombat:false, useOutCombat:true, effect:(ctx)=>goto('home'), price:{diamond:1}},
  '獸骨':     {id:'mat_bone',  type:'material', icon:ICON.bone,   desc:'常見材料，可用於鍛造或販售',
    useInCombat:false, useOutCombat:false, price:{stone:0}},
  '史萊姆膠質':   {id:'mat_slime',      type:'material', icon:ICON.potion, desc:'黏稠的史萊姆素材', useInCombat:false, useOutCombat:false, price:{stone:0}},
  '綠史萊姆膠質': {id:'mat_gslime',     type:'material', icon:ICON.potion, desc:'帶木靈氣息的膠質', useInCombat:false, useOutCombat:false, price:{stone:0}},
  '哥布林耳朵':   {id:'mat_gob_ear',    type:'material', icon:ICON.bone,   desc:'常見的討伐素材',   useInCombat:false, useOutCombat:false, price:{stone:0}},
  '骨頭碎片':     {id:'mat_bone_frag',  type:'material', icon:ICON.bone,   desc:'骷髏身上掉落的碎片', useInCombat:false, useOutCombat:false, price:{stone:0}},
  '食人魔牙':     {id:'mat_ogre_tooth', type:'material', icon:ICON.bone,   desc:'銳利的牙齒',       useInCombat:false, useOutCombat:false, price:{stone:0}},
  '巨魔皮':       {id:'mat_troll_hide', type:'material', icon:ICON.chest,  desc:'厚實的皮革',       useInCombat:false, useOutCombat:false, price:{stone:0}},
  '蛇鱗':         {id:'mat_snake_scale',type:'material', icon:ICON.chest,  desc:'飛蛇的鱗片',       useInCombat:false, useOutCombat:false, price:{stone:0}},
  '石像之翼':     {id:'mat_garg_wing',  type:'material', icon:ICON.chest,  desc:'沉重的石翼',       useInCombat:false, useOutCombat:false, price:{stone:0}},
  '火龍鱗片':     {id:'mat_dragon_scale',type:'material',icon:ICON.chest,  desc:'帶火氣的鱗片',     useInCombat:false, useOutCombat:false, price:{stone:0}},
};

// === 商店預設 ===
const SHOP_STOCK = [
  {name:'小血丹', qty:10},{name:'初血丹', qty:10},{name:'中血丹', qty:10},{name:'大血丹', qty:8},
  {name:'氣血丹', qty:6},{name:'補血丹', qty:6},{name:'回血丹', qty:4},{name:'復血丹', qty:4},
  {name:'血瓶', qty:10},{name:'藥膏', qty:8},{name:'超級血瓶', qty:6},{name:'極效血瓶', qty:6},{name:'至尊血瓶', qty:4},
  {name:'普通的木劍', qty:2},{name:'稀有的木劍', qty:2},{name:'罕見的木劍', qty:1},
  {name:'普通木匕首', qty:2},{name:'稀有木匕首', qty:2},{name:'罕見木匕首', qty:1},
  {name:'雲披風', qty:1},{name:'木靴', qty:1},{name:'青銅勳章', qty:2},{name:'銀戒', qty:2}
];

// === 怪物資料庫（與 battle.js 的 makeEnemy/地圖對應） ===
const MONSTER_DB = {
  slime: {
    id:'slime', level:1, name:'水萊姆', element:ELEM.WATER,
    base:{HP:137, MP:80, STR:4, AGI:4, VIT:4, INT:4, PER:4, WIL:4, LUK:4, SPD:4},
    drops:[{item:'史萊姆膠質',chance:0.80,qty:[1,1]},{stone:10,chance:1.0}],
    avatar:"https://i.ibb.co/qLL9g3w5/image.png"
  },
  g_slime: {
    id:'g_slime', level:2, name:'綠史萊姆', element:ELEM.GRASS,
    base:{HP:156, MP:96, STR:5, AGI:5, VIT:6, INT:5, PER:4, WIL:5, LUK:4, SPD:5},
    drops:[{item:'綠史萊姆膠質',chance:0.70,qty:[1,1]},{stone:20,chance:1.0}],
    avatar:ICON.enemy_wood
  },
  goblin: {
    id:'goblin', level:3, name:'哥布林', element:ELEM.NEUTRAL,
    base:{HP:176, MP:112, STR:5, AGI:5, VIT:8, INT:5, PER:4, WIL:5, LUK:4, SPD:5},
    drops:[{item:'哥布林耳朵',chance:0.60,qty:[1,1]},{stone:30,chance:1.0}],
    avatar:ICON.enemy_bandit
  },
  skeleton: {
    id:'skeleton', level:4, name:'骷髏', element:ELEM.NEUTRAL,
    base:{HP:195, MP:128, STR:6, AGI:6, VIT:9, INT:6, PER:4, WIL:6, LUK:4, SPD:6},
    drops:[{item:'骨頭碎片',chance:0.60,qty:[1,1]},{stone:40,chance:1.0}],
    avatar:ICON.enemy_bandit
  },
  orc: {
    id:'orc', level:5, name:'半獸人', element:ELEM.NEUTRAL,
    base:{HP:214, MP:144, STR:7, AGI:7, VIT:11, INT:7, PER:4, WIL:7, LUK:4, SPD:7},
    drops:[{item:'野蠻人之斧',chance:0.50,qty:[1,1]},{stone:50,chance:1.0}],
    avatar:ICON.enemy_bandit
  },
  ogre: {
    id:'ogre', level:6, name:'食人魔', element:ELEM.NEUTRAL,
    base:{HP:233, MP:160, STR:8, AGI:8, VIT:12, INT:8, PER:4, WIL:8, LUK:4, SPD:8},
    drops:[{item:'食人魔牙',chance:0.50,qty:[1,1]},{stone:60,chance:1.0}],
    avatar:ICON.enemy_bandit
  },
  troll: {
    id:'troll', level:7, name:'巨魔', element:ELEM.NEUTRAL,
    base:{HP:252, MP:176, STR:8, AGI:8, VIT:14, INT:8, PER:4, WIL:8, LUK:4, SPD:8},
    drops:[{item:'巨魔皮',chance:0.40,qty:[1,1]},{stone:70,chance:1.0}],
    avatar:ICON.enemy_bandit
  },
  wyvern: {
    id:'wyvern', level:8, name:'飛蛇', element:ELEM.GRASS,
    base:{HP:272, MP:192, STR:9, AGI:9, VIT:16, INT:9, PER:4, WIL:9, LUK:4, SPD:9},
    drops:[{item:'蛇鱗',chance:0.40,qty:[1,1]},{stone:80,chance:1.0}],
    avatar:ICON.enemy_wood
  },
  gargoyle: {
    id:'gargoyle', level:9, name:'石像鬼', element:ELEM.EARTH,
    base:{HP:291, MP:208, STR:10, AGI:10, VIT:17, INT:10, PER:4, WIL:10, LUK:4, SPD:10},
    drops:[{item:'石像之翼',chance:0.30,qty:[1,1]},{stone:90,chance:1.0}],
    avatar:ICON.enemy_bug
  },
  baby_dragon: {
    id:'baby_dragon', level:10, name:'小火龍', element:ELEM.FIRE,
    base:{HP:310, MP:224, STR:11, AGI:11, VIT:19, INT:11, PER:4, WIL:11, LUK:4, SPD:11},
    drops:[{item:'火龍鱗片',chance:0.20,qty:[1,1]},{stone:100,chance:1.0}],
    avatar:ICON.enemy_fire
  },
};

// === 地圖（對應 battle.js 的邏輯） ===
const MAPS = [
  {id:'forest', name:'青木林', level:[1,6], enemies:['slime','g_slime','goblin','wyvern']},
  {id:'ember',  name:'烈焰丘', level:[3,9], enemies:['orc','ogre','skeleton','baby_dragon']},
  {id:'marsh',  name:'靜水澤', level:[4,10], enemies:['g_slime','goblin','gargoyle','ogre']}
];

// ===============================
// end of data.js
// ===============================
