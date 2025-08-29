// items.js － 物品資料庫（可日後擴充後端或以 JSON 載入）
(function(){
  const RARITY = ['普通','精良','稀有','史詩','傳說'];

  // === 物品定義 ===
  const DB = {
        consumables: [
      {
        id:'hp_small',
        name:'氣血丹',
        effect:{hp:+25},
        price:20,
        icon:'https://i.ibb.co/Hfxz9394/image.png'   // 小瓶藥劑
      },
      {
        id:'hp_mid',
        name:'中等氣血丹',
        effect:{hp:+70},
        price:60,
        icon:'https://i.ibb.co/Nd71zTVQ/image.png'   // 培養皿/藥劑
      },
    ],
       weapons: [
      { id:'c_dagger1', name:'普通的青銅短劍', level:1, dmg:[8,12],  rarity:'普通', plus:0, price:50,  durMax:50,
        icon:'https://i.ibb.co/LDTw5Ry1/image.png' },
      { id:'c_dagger2', name:'精良的青銅短劍', level:1, dmg:[9,14],  rarity:'精良', plus:0, price:120, durMax:70,
        icon:'https://i.ibb.co/LdxqWgyn/image.png' },
      { id:'c_dagger3', name:'稀有的青銅短劍', level:1, dmg:[9,14],  rarity:'稀有', plus:0, price:260, durMax:100,
        icon:'https://i.ibb.co/tTvTWTDq/image.png' },
    ],
    ornaments: [
      // 之後再填
    ],
  };

  // 依 id 取定義
  function getDef(kind, id){
    const arr = DB[kind] || [];
    return arr.find(x => x.id === id) || null;
  }

  // 建立預設背包（深拷貝）
  function getDefaultBag(){
  return {
    consumables: [
      (() => { const d = getDef('consumables', 'hp_small'); return { ...d, count: 20 }; })(),
      (() => { const d = getDef('consumables', 'hp_mid');   return { ...d, count: 3  }; })(),
    ],
      weapons: [
        // 武器不可堆疊，附上耐久 cur/max
        (() => { const d = getDef('weapons', 'c_dagger1'); return { ...d, dur: { cur: d.durMax, max: d.durMax } }; })(),
        (()=>{ const d=getDef('weapons','c_dagger2'); return { ...d, dur:{cur:d.durMax, max:d.durMax} }; })(),
        (()=>{ const d=getDef('weapons','c_dagger3'); return { ...d, dur:{cur:d.durMax, max:d.durMax} }; })(),
      ],
      ornaments: [],
      materials: [],
      hidden: [],
    };
  }

  // 取得稀有度清單／驗證
  function normalizeRarity(r){
    return RARITY.includes(r) ? r : '普通';
  }

  // 對外
  window.ItemDB = {
    RARITY,
    getDef,
    getDefaultBag,
    normalizeRarity,
    STACK_MAX: 9999,
  };
})();
