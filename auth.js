// auth.js
const STORE_USER = 'rpg_user';
const STORE_CHAR_PREFIX = 'rpg_character_';

// 帳號清單（寫死在前端）：username / password / avatar
// 之後要改頭像，只需改這裡的 avatar，玩家下次登入就會拿到最新網址
var ACCOUNTS = [
  { username: "0017", password: "0128", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756723857/%E5%BF%B5%E5%BF%B5_bmuc6s.png" },
  { username: "9975", password: "0807", avatar: "https://example.com/avatars/9975.png" },
  { username: "2817", password: "0428", avatar: "https://example.com/avatars/2817.png" },
  { username: "9031", password: "1123", avatar: "https://example.com/avatars/9031.png" },
  { username: "7905", password: "0824", avatar: "https://example.com/avatars/7905.png" },
  { username: "0592", password: "0825", avatar: "https://example.com/avatars/0592.png" }
];

// 工具：用帳號找對應物件
function findAccount(username){
  var i = 0;
  while(i < ACCOUNTS.length){
    var a = ACCOUNTS[i];
    if(a && a.username === username){ return a; }
    i = i + 1;
  }
  return null;
}


// ===== 快取與雲端路徑 =====
var _cache = { character: null };

function charPath(username){
  // 統一走這個節點：characters/{username}
  return 'characters/' + username;
}

const charKey = (u) => STORE_CHAR_PREFIX + u; // 舊本機 key（保留相容）


const Auth = {

async login(username, password) {
  if(!username || !password){
    return { success:false, message:'請輸入帳號與密碼' };
  }

  // 只用寫死清單驗證
  var acc = findAccount(username);
  if(!acc || acc.password !== password){
    return { success:false, message:'帳號或密碼錯誤' };
  }

  // 記錄使用者資訊（含頭像網址）
  localStorage.setItem(STORE_USER, JSON.stringify({
    username: acc.username,
    avatar: acc.avatar ? acc.avatar : ''
  }));

  // 到雲端看是否已有存檔
  var snap = await window.DB.ref(charPath(username)).get();
  _cache.character = snap.exists() ? snap.val() : null;

  return { success:true, hasCharacter: !!_cache.character };
},


  logout(){
    localStorage.removeItem(STORE_USER);
  },

  currentUser(){
    try { return JSON.parse(localStorage.getItem(STORE_USER) || 'null'); }
    catch { return null; }
  },

defaultAvatar(){
  var u = this.currentUser();
  if(!u){ return ''; }
  return u.avatar ? u.avatar : '';
},

async createCharacter(name, element='none', avatarOverride=''){
  var u = this.currentUser(); if(!u) return false;

  var safeName = String(name || '').trim().slice(0, 16);
  var safeElem = (element || 'none').toLowerCase();

  var level = 1;
  var attrs = { str:10, vit:10, dex:10, int:10, wis:10, luk:10 };
  var hpMax = 80 + attrs.vit * 12 + level * 6;

  var character = {
    name: safeName || '無名散修',
    element: safeElem,
    level: level,
    avatar: avatarOverride || this.defaultAvatar() || '',
    medals: [],
    attributes: attrs,
    unspentPoints: 5,
    sta: { cur: 100, max: 100 },
    exp: { cur: 0,   max: 100 },
    hp:  { cur: hpMax, max: hpMax },
    currencies: { stone: 13000, diamond: 300 }
  };

  await window.DB.ref(charPath(u.username)).set(character);
  _cache.character = character;
  return true;
},


getCharacter(){
  return _cache.character || null;
},

async loadCharacter(){
  var u = this.currentUser(); if(!u){ _cache.character=null; return null; }
  var snap = await window.DB.ref(charPath(u.username)).get();
  _cache.character = snap.exists() ? snap.val() : null;
  return _cache.character;
},


hasCharacter(){
  return !!_cache.character;
},


async saveCharacter(character){
  var u = this.currentUser(); if(!u) return false;
  await window.DB.ref(charPath(u.username)).set(character);
  _cache.character = character;
  return true;
},


async deleteCharacter(){
  var u = this.currentUser(); if(!u) return false;
  await window.DB.ref(charPath(u.username)).remove();
  _cache.character = null;
  return true;
}
};

// 讓其他頁面能透過 window.Auth 使用
if (typeof window !== 'undefined') {
  window.Auth = Auth;
}
