/**
 * 物品資料庫（中央表）：消耗品 / 武器 / 飾品 / 勳章 / 素材
 * - 新增：多種飾品（戒指/耳環/披風/衣服/鞋子）、勳章
 * - 新增：addWeaponToBag / addOrnamentToBag / addMedalToBag
 * - 不改其他模組呼叫規格（裝備加成仍用 bonus）
 */
(function () {
  'use strict';

  const RARITY = ["普", "精", "稀", "史", "傳"];
  const STACK_MAX = 9999;

  // === 物品定義（中央資料庫） ===
  const DB = {
    // ---- 消耗品（Consumables）----
    consumables: [
      { id: "hp_small", name: "小氣血丹",   effect: { hp: 25 },  price: 20,  icon: "https://i.ibb.co/Hfxz9394/image.png" },
      { id: "hp_mid",   name: "中氣血丹",   effect: { hp: 70 },  price: 60,  icon: "https://i.ibb.co/Nd71zTVQ/image.png" },
      { id: "hp_large", name: "大氣血丹",   effect: { hp: 140 }, price: 160, icon: "https://i.ibb.co/hxqHhB8M/image.png" },
      { id: "hp_huge",  name: "巨顆氣血丹", effect: { hp: 300 }, price: 350, icon: "https://i.ibb.co/TMsHqmNX/image.png" },
      { id: "mp_small", name: "靈氣丹",     effect: { mp: 25 },  price: 20,  icon: "https://i.ibb.co/1Q3p8mJ/mp.png" }
    ],

    // ---- 武器（Weapons）----
    weapons: [
      // 你原本就有的三把短劍
      { id: "c_dagger1", name: "普通的青銅短劍", level: 1, atk: 10, dmg: [8, 12],  rarity: "普", plus: 0, price: 50,  durMax: 50,  icon: "https://i.ibb.co/LDTw5Ry1/image.png" },
      { id: "c_dagger2", name: "精良的青銅短劍", level: 1, atk: 12, dmg: [9, 14],  rarity: "精", plus: 0, price: 120, durMax: 70,  icon: "https://i.ibb.co/LdxqWgyn/image.png" },
      { id: "c_dagger3", name: "稀有的青銅短劍", level: 1, atk: 14, dmg: [10, 16], rarity: "稀", plus: 0, price: 260, durMax: 100, icon: "https://i.ibb.co/tTvTWTDq/image.png" },

      // 新增兩把（示範：一把物理、一把法杖用 bonus 走法術攻擊）
      { id: "iron_sword1",  name: "打鐵長劍", level: 3, atk: 18, dmg: [14, 22], rarity: "普", price: 180, durMax: 120, icon: "https://i.ibb.co/3C4s9rD/sword.png" },
      { id: "elder_staff1", name: "長老法杖", level: 4, rarity: "精", price: 280, durMax: 90,  icon: "https://i.ibb.co/0mS9x7b/staff.png",
        bonus: { "法術攻擊": 18, "真元上限": 20 } }
    ],

    // ---- 飾品（Ornaments）----
    // 說明：一律放在 ornaments；實際裝到哪個欄位由你的 UI/邏輯決定
    ornaments: [
      // 戒指
      { id:"ring_green",   name:"翠玉戒指", rarity:"精", price:180, icon:"https://i.ibb.co/wRhN8Zx/ring-green.png",
        bonus:{ "命中率":5, "暴擊率":2 } },
      { id:"ring_thunder", name:"雷角戒",   rarity:"稀", price:260, icon:"https://i.ibb.co/m0P64mX/ring-thunder.png",
        bonus:{ "命中率":7, "物理攻擊":6 } },
      { id:"ring_midnight",name:"子夜之環", rarity:"稀", price:260, icon:"https://i.ibb.co/dQgx1n0/ring-midnight.png",
        bonus:{ "暴擊率":5, "暴擊傷害":15 } },

      // 耳環
      { id:"ear_wolf",  name:"狼嚎耳飾", rarity:"精", price:210, icon:"https://i.ibb.co/0KpQ0Yp/ear-wolf.png",
        bonus:{ "行動條速度":3, "閃避":5 } },
      { id:"ear_sage",  name:"賢者耳環", rarity:"稀", price:280, icon:"https://i.ibb.co/fQr2BfB/ear-sage.png",
        bonus:{ "真元上限":30, "法術防禦":5 } },

      // 披風/衣服/鞋子
      { id:"cloak_shadow", name:"影帛披風", rarity:"稀", price:300, icon:"https://i.ibb.co/1v3LqgC/cloak-shadow.png",
        bonus:{ "閃避":8, "行動條速度":3 } },
      { id:"armor_rock",  name:"岩甲",     rarity:"精", price:320, icon:"https://i.ibb.co/2ZQnsFL/armor-rock.png",
        bonus:{ "氣血上限":60, "物理防禦":10 } },
      { id:"shoes_fur",   name:"熊皮靴",   rarity:"普", price:140, icon:"https://i.ibb.co/5BYwTGS/shoes-fur.png",
        bonus:{ "行動條速度":4, "氣血上限":30 } }
    ],

    // ---- 勳章（Medals）----
    medals: [
      { id:"medal_slime_crown", name:"萊姆之冠", rarity:"精", icon:"https://i.ibb.co/7p4kJ3T/medal-slime.png",
        bonus:{ "破甲":4, "法穿":4 } },
      { id:"medal_wraith", name:"幽王勳章", rarity:"稀", icon:"https://i.ibb.co/pb0DLj7/medal-wraith.png",
        bonus:{ "法術攻擊":12, "暴擊率":3 } },
      { id:"medal_stone",  name:"巖魂勳章", rarity:"普", icon:"https://i.ibb.co/3cV3TGk/medal-stone.png",
        bonus:{ "物理防禦":6, "氣血上限":40 } },
      { id:"medal_fleet",  name:"迅捷勳章", rarity:"精", icon:"https://i.ibb.co/YW3KJ8g/medal-fleet.png",
        bonus:{ "行動條速度":6, "命中率":3 } }
    ],

    // ---- 素材（Materials）----
    // 補齊怪物會掉但你原本未收的素材（fire_core / mud_shell / bat_wing / soul_thread / beetle_horn）
    materials: [
      { id:"wood_shard",    name:"木靈碎片",   rarity:"普", icon:"https://i.ibb.co/sv81h190/image.png", desc:"木屬初階靈材，常見於靈木林。" },
      { id:"slime_jelly",   name:"史萊姆凝膠", rarity:"普", icon:"https://i.ibb.co/vvwVxHx9/image.png", desc:"黏稠凝膠，可作為煉製材料。" },
      { id:"fox_tail",      name:"靈狐尾",     rarity:"普", icon:"https://i.ibb.co/HspkbYT/image.png", desc:"狐狸的尾毛，富含靈性。" },
      { id:"thorn_shard",   name:"荊棘碎片",   rarity:"普", icon:"https://i.ibb.co/XxTZ7syL/image.png", desc:"鋒利的荊棘殘片。" },
      { id:"stone_core",    name:"石像核心",   rarity:"精", icon:"https://i.ibb.co/WWnBT1G8/image.png", desc:"石像守衛身上的能量核心。" },
      { id:"hard_rock",     name:"堅石",       rarity:"普", icon:"https://i.ibb.co/gFF3RCwp/image.png", desc:"堅硬岩石，可作為鍛造基材。" },
      { id:"ghost_essence", name:"幽魂精華",   rarity:"稀", icon:"https://i.ibb.co/mC3TS1WJ/image.png", desc:"自亡靈身上凝成的精華物質。" },
      { id:"wolf_fur",      name:"狼毛",       rarity:"普", icon:"https://i.ibb.co/GQkwt32B/image.png", desc:"雪原狼的毛皮。" },
      { id:"wolf_fang",     name:"狼牙",       rarity:"普", icon:"https://i.ibb.co/tM8yQrvR/image.png", desc:"鋒利的狼牙，可作材料。" },
      { id:"ice_crystal",   name:"冰晶",       rarity:"普", icon:"https://i.ibb.co/LdQQVq0X/image.png", desc:"寒氣凝結成的晶體。" },
      { id:"frozen_thorn",  name:"凍結荊棘",   rarity:"精", icon:"https://i.ibb.co/wFDyjfXn/image.png", desc:"被寒霜封存的荊棘，帶寒性。" },
      { id:"bear_claw",     name:"熊爪",       rarity:"精", icon:"https://i.ibb.co/dsRzmc7s/image.png", desc:"巨熊的爪子，沉重而堅硬。" },
      { id:"bear_fur",      name:"熊皮",       rarity:"普", icon:"https://i.ibb.co/1ttsV4N6/image.png", desc:"厚實保暖的皮張。" },

      { id:"fire_core",     name:"火靈核心",   rarity:"精", icon:"https://i.ibb.co/0d4QkJf/fire-core.png",   desc:"火元素的凝核。" },
      { id:"mud_shell",     name:"泥甲片",     rarity:"普", icon:"https://i.ibb.co/Jq8cv8g/mud-shell.png",  desc:"厚重的甲片。" },
      { id:"bat_wing",      name:"蝠翼",       rarity:"普", icon:"https://i.ibb.co/nwX4xkp/bat-wing.png",   desc:"薄而有力的翼膜。" },
      { id:"soul_thread",   name:"魂絲",       rarity:"稀", icon:"https://i.ibb.co/7k4fCBg/soul-thread.png",desc:"與靈性相連的細絲。" },
      { id:"beetle_horn",   name:"雷角",       rarity:"稀", icon:"https://i.ibb.co/4Wmry4y/beetle-horn.png",desc:"帶雷力的尖角。" }
    ]
  };

  // === 工具 ===
  function deepCopy(o){ return JSON.parse(JSON.stringify(o)); }
  function arrOf(k){ return Array.isArray(DB[k]) ? DB[k] : []; }

  function getDef(kind, id) {
    const arr = arrOf(kind);
    for (var i=0;i<arr.length;i++){ if(arr[i] && arr[i].id===id) return arr[i]; }
    return null;
  }

  // === 建立預設背包（深拷貝） ===
  function weaponWithDur(def){
    if (!def) return null;
    var w = deepCopy(def);
    w.dur = { cur: def.durMax || 0, max: def.durMax || 0 };
    return w;
  }
  function getDefaultBag() {
    var bag = { consumables:[], weapons:[], ornaments:[], materials:[], hidden:[] };
    var hpS = getDef("consumables", "hp_small");
    var hpM = getDef("consumables", "hp_mid");
    if (hpS) bag.consumables.push(Object.assign(deepCopy(hpS), { count: 20 }));
    if (hpM) bag.consumables.push(Object.assign(deepCopy(hpM), { count: 3  }));

    ["c_dagger1","c_dagger2","c_dagger3"].forEach(function(id){
      var w = weaponWithDur(getDef("weapons", id));
      if (w) bag.weapons.push(w);
    });
    return bag;
  }

  // === 背包操作：消耗品 ===
  function addConsumableToBag(bag, id, qty) {
    if (!bag || !qty || qty <= 0) return;
    var def = getDef("consumables", id);
    if (!def) return;

    bag.consumables = bag.consumables || [];
    var remain = qty;

    for (var i=0;i<bag.consumables.length;i++){
      var it = bag.consumables[i];
      if (it.id !== id) continue;
      var can = Math.max(0, STACK_MAX - (it.count || 0));
      var add = Math.min(can, remain);
      if (add > 0) { it.count = (it.count || 0) + add; remain -= add; }
      if (remain <= 0) break;
    }

    while (remain > 0) {
      var take = Math.min(STACK_MAX, remain);
      bag.consumables.push(Object.assign(deepCopy(def), { count: take }));
      remain -= take;
    }
  }

  // === 背包操作：素材 ===
  function addMaterialToBag(bag, id, qty) {
    if (!bag || !qty || qty <= 0) return;
    bag.materials = bag.materials || [];

    var def = getDef("materials", id);
    var name = def && def.name ? def.name : id;
    var icon = def && def.icon ? def.icon : "";

    var idx = -1;
    for(var i=0;i<bag.materials.length;i++){ if(bag.materials[i].id===id){ idx=i; break; } }
    if (idx >= 0) {
      bag.materials[idx].count = (bag.materials[idx].count || 0) + qty;
      if (!bag.materials[idx].name) bag.materials[idx].name = name;
      if (!bag.materials[idx].icon) bag.materials[idx].icon = icon;
    } else {
      bag.materials.push({ id:id, name:name, icon:icon, count:qty });
    }
  }

  // === 背包操作：武器 / 飾品 / 勳章（新增） ===
  function addWeaponToBag(bag, id, qty){
    if(!bag) return;
    var count = Math.max(1, qty|0);
    var def = getDef("weapons", id); if(!def) return;
    bag.weapons = bag.weapons || [];
    for(var i=0;i<count;i++){ bag.weapons.push( weaponWithDur(def) ); }
  }
  function addOrnamentToBag(bag, id, qty){
    if(!bag) return;
    var count = Math.max(1, qty|0);
    var def = getDef("ornaments", id); if(!def) return;
    bag.ornaments = bag.ornaments || [];
    for(var i=0;i<count;i++){ bag.ornaments.push( deepCopy(def) ); }
  }
  function addMedalToBag(bag, id, qty){
    if(!bag) return;
    var count = Math.max(1, qty|0);
    var def = getDef("medals", id); if(!def) return;
    bag.hidden = bag.hidden || [];
    for(var i=0;i<count;i++){ bag.hidden.push( deepCopy(def) ); }
  }

  // === 對外 ===
  window.ItemDB = {
    RARITY: RARITY,
    STACK_MAX: STACK_MAX,
    DB: DB,
    getDef: getDef,
    getDefaultBag: getDefaultBag,
    addConsumableToBag: addConsumableToBag,
    addMaterialToBag: addMaterialToBag,
    addWeaponToBag: addWeaponToBag,      // ⬅ 新增
    addOrnamentToBag: addOrnamentToBag,  // ⬅ 新增
    addMedalToBag: addMedalToBag         // ⬅ 新增
  };
})();
