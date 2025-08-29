// auth.js
const STORE_USER = 'rpg_user';
const STORE_CHAR_PREFIX = 'rpg_character_';

// 只允許這些帳號登入，並可各自設定預設頭像
const ALLOWED = {
  test:  { password: '1234', avatar: 'https://picsum.photos/seed/testxian/96' },
  admin: { password: '9999', avatar: 'https://picsum.photos/seed/admxx/96' },
  // 再加帳號就照這格式：
  // userA: { password: 'abcd', avatar: 'https://你的預設頭像網址' },
};

const charKey = (u) => STORE_CHAR_PREFIX + u;

const Auth = {
  login(username, password) {
    const rule = ALLOWED[username];
    if (!rule || rule.password !== password) {
      return { success:false, message:'帳密錯誤' };
    }
    localStorage.setItem(STORE_USER, JSON.stringify({ username }));

    // 舊版共用 key -> 嘗試搬到每帳號的 key（若存在）
    const oldRaw = localStorage.getItem('rpg_character');
    if (oldRaw && !localStorage.getItem(charKey(username))) {
      localStorage.setItem(charKey(username), oldRaw);
    }
    // 移除舊版共用 key（避免之後混淆）
    localStorage.removeItem('rpg_character');

    return { success:true, hasCharacter: !!localStorage.getItem(charKey(username)) };
  },

  logout(){
    localStorage.removeItem(STORE_USER);
  },

  currentUser(){
    try { return JSON.parse(localStorage.getItem(STORE_USER) || 'null'); }
    catch { return null; }
  },

  defaultAvatar(){
    const u = this.currentUser(); if(!u) return '';
    return ALLOWED[u.username]?.avatar || '';
  },

  createCharacter(name, element='none', avatarOverride=''){
    const u = this.currentUser(); if(!u) return false;

    const safeName = String(name || '').trim().slice(0, 16); // 最長 16 字，防呆
    const safeElem = (element || 'none').toLowerCase();      // 'none' | 'fire' | 'water'…

  // 先在物件外計算初值（⚠️ const 不能放在物件字面值裡）
    const level = 1;
    const attrs = { str:10, vit:10, dex:10, int:10, wis:10, luk:10 };
    const hpMax = 80 + attrs.vit * 12 + level * 6; // 與 derivedFrom 的公式一致

    const character = {
      name: safeName || '無名散修',
      element: safeElem,
      level: level,
      avatar: avatarOverride || this.defaultAvatar() || '',
      medals: [],
      attributes: attrs,
      unspentPoints: 5,
      sta: { cur: 100, max: 100 },     // 體力滿
      exp: { cur: 0,   max: 100 },     // 經驗 0/100
      hp:  { cur: hpMax, max: hpMax }, // 氣血依 VIT/等級計算
      currencies: { stone: 13000, diamond: 300 }
    };

  localStorage.setItem(charKey(u.username), JSON.stringify(character));
  return true;
},

  getCharacter(){
    const u = this.currentUser(); if(!u) return null;
    const raw = localStorage.getItem(charKey(u.username));
    return raw ? JSON.parse(raw) : null;
  },

  hasCharacter(){
    const u = this.currentUser(); if(!u) return false;
    return !!localStorage.getItem(charKey(u.username));
  },

  saveCharacter(character){
    const u = this.currentUser(); if(!u) return false;
    localStorage.setItem(charKey(u.username), JSON.stringify(character));
    return true;
  },

  deleteCharacter(){
    const u = this.currentUser(); if(!u) return false;
    localStorage.removeItem(charKey(u.username));
    return true;
  }
};

// 讓其他頁面能透過 window.Auth 使用
if (typeof window !== 'undefined') {
  window.Auth = Auth;
}
