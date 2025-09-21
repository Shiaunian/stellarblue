// auth.js
const STORE_USER = 'rpg_user';
const STORE_CHAR_PREFIX = 'rpg_character_';

// 帳號清單（寫死在前端）：username / password / avatar
// 之後要改頭像，只需改這裡的 avatar，玩家下次登入就會拿到最新網址
var ACCOUNTS = [
  { username: "0017", password: "0128", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1756723857/%E5%BF%B5%E5%BF%B5_bmuc6s.png" },
  { username: "little01", password: "5126", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1757509864/%E6%B2%90%E6%B2%90_hmamju.png" }, // 沐沐
  { username: "little02", password: "5126", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758477022/%E5%93%86%E5%95%A6_kkuf6u.png" }, // 多啦
  { username: "little03", password: "5126", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758477022/%E7%90%B3%E7%90%B3%E5%85%92_wpslfg.png" }, // 琳琳兒
  { username: "little04", password: "5126", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758477021/%E5%A7%8D%E5%A7%8D_uhxxfw.png" }, // 姍姍
  { username: "little05", password: "5126", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758477022/%E9%BA%A5%E9%BA%A5_ejnwjn.png" }, // 麥麥
  { username: "little06", password: "5126", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758477022/%E8%89%BE%E5%80%AB_gqzfst.png" }, // 艾倫
  { username: "little07", password: "5126", avatar: "https://res.cloudinary.com/dzj7ghbf6/image/upload/v1758477022/%E5%AE%89%E8%BF%AA%E5%93%A5_bfprfd.png" }, //安迪哥
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

async createCharacter(name, element='none', gender='M', avatarOverride=''){
  var u = this.currentUser(); if(!u) return false;

  // 基本安全處理
  var safeName = String(name || '').trim().slice(0, 16);
  if (!safeName) safeName = '無名散修';
  var safeElem = (element || 'none').toLowerCase();
  var safeGender = (gender === 'F') ? 'F' : 'M';

  // 基礎屬性與上限
  var level = 1;
  var attrs = { str:0, vit:0, dex:0, int:0, wis:0, luk:0 };
  var hpMax = 80 + attrs.vit * 12 + level * 6;

  // 角色主體
  var character = {
    name: safeName,
    element: safeElem,
    gender: safeGender,                 // ★ 新增：性別 M/F
    level: level,
    avatar: avatarOverride || this.defaultAvatar() || '',
    medals: [],
    attributes: attrs,
    unspentPoints: 10,
    sta: { cur: 100, max: 100 },
    exp: { cur: 0,   max: 100 },
    hp:  { cur: hpMax, max: hpMax },
    currencies: { stone: 13000, diamond: 300 },
    // ★ 新增：包包與裝備欄（含外觀欄位）
    bag: {
      consumables: [],
      materials:   [],
      weapons:     [],
      armors:      [],
      boots:       [],
      ornaments:   [],
      earrings:    [],
      cloaks:      [],
      necklaces:   [],
      appearances: []
    },
    equip: {
      weapon:null, armor:null, boots:null,
      ring:null, earring:null, cloak:null, necklace:null,
      appearance:null
    },
    skills: [],
    _updatedAt: Date.now()
  };

  // ★ 初始外觀：依性別給一件（先放入外觀背包，需玩家自行裝備）
  var startSkin = (safeGender === 'F') ? 'skin_qing_f' : 'skin_qing_m';
  character.bag.appearances.push({ id: startSkin, count: 1 });

  // ★ 管理員專屬配給（帳號 0017）
  var isAdmin = (u && u.username === '0017', 'little01', 'little02');
  if (isAdmin) {
    try {
  
      // 額外外觀
      character.bag.appearances.push({ id: 'night_yu', count: 1 });
      character.bag.appearances.push({ id: 'skin_qing_f', count: 1 });
      character.bag.appearances.push({ id: 'skin_raiming', count: 1 });
      character.bag.appearances.push({ id: 'skin_ice_asuna', count: 1 });

      // 稀有的青銅短劍 x1（武器需帶耐久）
      if (window.ItemDB && ItemDB.getDef) {
        var wdef = ItemDB.getDef('weapons', 'c_dagger3');
        if (wdef) {
          var w = JSON.parse(JSON.stringify(wdef));
          w.dur = { cur: w.durMax, max: w.durMax };
          character.bag.weapons.push(w);
        }
        // 血玉戒指 x1
        var rdef = ItemDB.getDef('ornaments', 'ring_blood');
        if (rdef) {
          character.bag.ornaments.push(JSON.parse(JSON.stringify(rdef)));
        }
        // 大氣血丹 x50；中氣血丹 x100
        if (ItemDB.addConsumableToBag) {
          ItemDB.addConsumableToBag(character.bag, 'hp_large', 50);
          ItemDB.addConsumableToBag(character.bag, 'hp_mid', 100);
        } else {
          character.bag.consumables.push({ id:'hp_large', count:50 });
          character.bag.consumables.push({ id:'hp_mid',   count:100 });
        }
      } else {
        // 萬一 items.js 未載入（保底）：先塞入 id + 數量
        character.bag.consumables.push({ id:'hp_large', count:50 });
        character.bag.consumables.push({ id:'hp_mid',   count:100 });
      }
    } catch(_){}
  }

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
  try { character._updatedAt = Date.now(); } catch(e) {}
  _cache.character = character; // 先更新快取，讓其它頁面立刻拿到最新
  await window.DB.ref(charPath(u.username)).set(character);
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
