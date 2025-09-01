/**
 * 物品資料庫（中央表）：消耗品 / 武器 / 飾品 / 素材
 * - 純 JavaScript：這個檔案不要放 <script> 標籤！
 * - 新增 mp_small（靈氣丹）
 * - 補齊所有怪物掉落會用到的素材（避免袋子渲染缺資料）
 * - getDefaultBag 使用深拷貝；提供 addConsumableToBag / addMaterialToBag
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
      { id: "mp_small", name: "靈氣丹",     effect: { mp: 25 },  price: 20,  icon: "" },
      // { id: "entry_ticket", name: "副本入場卷", effect: null, price: 0, icon: "" },
    ],

    // ---- 武器（Weapons）----
    weapons: [
      { id: "c_dagger1", name: "普通的青銅短劍", level: 1, atk: 10, dmg: [8, 12],  rarity: "普", plus: 0, price: 50,  durMax: 50,  icon: "https://i.ibb.co/LDTw5Ry1/image.png" },
      { id: "c_dagger2", name: "精良的青銅短劍", level: 1, atk: 12, dmg: [9, 14],  rarity: "精", plus: 0, price: 120, durMax: 70,  icon: "https://i.ibb.co/LdxqWgyn/image.png" },
      { id: "c_dagger3", name: "稀有的青銅短劍", level: 1, atk: 14, dmg: [10, 16], rarity: "稀", plus: 0, price: 260, durMax: 100, icon: "https://i.ibb.co/tTvTWTDq/image.png" },
    ],

    // ---- 飾品（Ornaments）----
    ornaments: [
      // 之後擴充
    ],

    // ---- 素材（Materials）----
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
    ],
  };

  // === 工具 ===
  const deepCopy = (o) => JSON.parse(JSON.stringify(o));
  const arrOf = (k) => Array.isArray(DB[k]) ? DB[k] : [];
  const normalizeRarity = (r) => RARITY.includes(r) ? r : "普通";

  function getDef(kind, id) {
    const arr = arrOf(kind);
    return arr.find((x) => x && x.id === id) || null;
  }

  // === 建立預設背包（深拷貝） ===
  function weaponWithDur(def){
    if (!def) return null;
    return Object.assign(deepCopy(def), { dur: { cur: def.durMax || 0, max: def.durMax || 0 } });
  }
  function getDefaultBag() {
    const bag = {
      consumables: [],
      weapons: [],
      ornaments: [],
      materials: [],
      hidden: [],
    };
    const hpS = getDef("consumables", "hp_small");
    const hpM = getDef("consumables", "hp_mid");
    if (hpS) bag.consumables.push(Object.assign(deepCopy(hpS), { count: 20 }));
    if (hpM) bag.consumables.push(Object.assign(deepCopy(hpM), { count: 3  }));

    ["c_dagger1","c_dagger2","c_dagger3"].forEach(id=>{
      const w = weaponWithDur(getDef("weapons", id));
      if (w) bag.consumables; // no-op to keep structure
      if (w) bag.weapons.push(w);
    });
    return bag;
  }

  // === 背包操作：消耗品 ===
  function addConsumableToBag(bag, id, qty) {
    if (!bag || !qty || qty <= 0) return;
    const def = getDef("consumables", id);
    if (!def) return;

    bag.consumables = bag.consumables || [];
    let remain = qty;

    for (const it of bag.consumables) {
      if (it.id !== id) continue;
      const can = Math.max(0, STACK_MAX - (it.count || 0));
      const add = Math.min(can, remain);
      if (add > 0) {
        it.count = (it.count || 0) + add;
        remain -= add;
      }
      if (remain <= 0) break;
    }

    while (remain > 0) {
      const take = Math.min(STACK_MAX, remain);
      bag.consumables.push(Object.assign(deepCopy(def), { count: take }));
      remain -= take;
    }
  }

  // === 背包操作：素材 ===
  function addMaterialToBag(bag, id, qty) {
    if (!bag || !qty || qty <= 0) return;
    bag.materials = bag.materials || [];

    const def = getDef("materials", id);
    const name = def?.name || id;
    const icon = def?.icon || "";

    const idx = bag.materials.findIndex(x=>x.id===id);
    if (idx >= 0) {
      bag.materials[idx].count = (bag.materials[idx].count || 0) + qty;
      if (!bag.materials[idx].name) bag.materials[idx].name = name;
      if (!bag.materials[idx].icon) bag.materials[idx].icon = icon;
    } else {
      bag.materials.push({ id, name, icon, count: qty });
    }
  }

  // === 對外 ===
  window.ItemDB = {
    RARITY,
    STACK_MAX,
    DB,
    normalizeRarity,
    getDef,
    getDefaultBag,
    addConsumableToBag,
    addMaterialToBag,
  };
})();
