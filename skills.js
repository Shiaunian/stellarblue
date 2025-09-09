/* skills.js — 技能資料庫（去重版；統一依賴 stats.js / map.html 的相剋表） */
(function(){
  // === 內部工具 ===
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function safe(obj, k, v){ return (obj && obj[k]!==undefined) ? obj[k] : v; }

  // === 外觀定義（可日後擴充） ===
  var DB = {
    // 例：基礎普攻（走元素相剋）
    basic: {
      id:'basic', name:'普攻', elem:'none',
      power:110, mp:0, desc:'一般攻擊，受相剋與暴擊影響'
    },

    // 保留舊有範例
    fire_ball: {
      id:'fire_ball', name:'火球術', elem:'fire',
      power:135, mp:8, desc:'火屬性法術攻擊，易觸發灼燒'
    },

    // === 新增：木幽火會用到 ===
    ember: {
      id:'ember', name:'火苗', elem:'fire',
      power:110, mp:12,
      desc:'造成110%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
      onHit:{
        burn:{ seconds:10, perSecondHP:-2,
          chanceBase:0.10, vsHigher5:0.05, vsFire:0.00, vsGrass:0.15
        }
      }
    },

        // === 藍波拳 ===
    ember: {
      id:'Bluewave_Fist', name:'藍波拳', elem:'wind',
      power:110, mp:13,
      desc:'對敵方造成「風元素」110%物理傷害（暫以靈元素計）',
    },

    // === 新增：火之靈、萊利會用到 ===
    fire_kiss: {
      id:'fire_kiss', name:'火吻', elem:'fire',
      power:120, mp:15,
      desc:'造成120%火屬性法術傷害；命中後有機率灼燒10秒（每秒-2HP）',
      onHit:{
        burn:{ seconds:10, perSecondHP:-2,
          chanceBase:0.10, vsHigher5:0.05, vsFire:0.00, vsGrass:0.15
        }
      }
    },

    // === 新增：雷系（暫以 spirit 代表雷元素） ===
    thunder_palm: {
      id:'thunder_palm', name:'雷電掌', elem:'thunder',
      power:120, mp:12,
      desc:'對敵方造成「雷元素」120%物理傷害（暫以靈元素計）'
    },
    thunder_drop: {
      id:'thunder_drop', name:'雷落', elem:'thunder',
      power:140, mp:22,
      desc:'對敵方造成「雷元素」140%物理傷害（暫以靈元素計）；若施放者自身亦為雷系，另行回復20點氣血（引擎支援後生效）'
    }

  };


  // === 取技能 ===
  function get(id){ return DB[id] || null; }
  function list(){ return Object.keys(DB).map(function(k){ return DB[k]; }); }

  // === 計算傷害（統一呼叫 stats.js 的 derivedFrom；相剋來源取自 map.html 的全域表） ===
  function calcDamage(attacker, defender, skillId){
    var sk = get(skillId) || get('basic');

    // 1) 取雙方面板（由 stats.js 提供）
    var aD = (typeof window.derivedFrom==='function') ? window.derivedFrom(attacker) : null;
    var dD = (typeof window.derivedFrom==='function') ? window.derivedFrom(defender) : null;

    // 若 stats.js 缺失，最低限度保底，避免報錯
    if(!aD) aD = { '物理攻擊':10,'法術攻擊':10,'暴擊率':3,'暴擊傷害':150, '破甲':0,'法穿':0 };
    if(!dD) dD = { '物理防禦':8,'法術防禦':8 };

    // 2) 判斷使用哪種攻擊面板（普攻/武技用物攻；法術用法攻）
    var useMatk = (sk && sk.elem && sk.elem!=='none'); // 簡單規則：有元素就當法術
    var ATK  = useMatk ? safe(aD,'法術攻擊',10) : safe(aD,'物理攻擊',10);
    var DEF  = useMatk ? safe(dD,'法術防禦',8)   : safe(dD,'物理防禦',8);
    var PEN  = useMatk ? safe(aD,'法穿',0)       : safe(aD,'破甲',0);

    // 3) 相剋倍率（支援雙元素防禦；若 map.html 未掛 getElemMultiplier，退回舊表/1.0）
    var atkElem = (sk && sk.elem) ? sk.elem : 'none';
    var defElems = (defender && defender.element) ? defender.element : 'none';
    var elemMul = 1.0;
    if (typeof window.getElemMultiplier === 'function'){
      elemMul = window.getElemMultiplier(atkElem, defElems);
    }else{
      var MULS = (window.ELEM_MUL && window.ELEM_MUL[atkElem]) ? window.ELEM_MUL[atkElem] : null;
      var defOne = Array.isArray(defElems) ? (defElems[0]||'none') : defElems;
      elemMul = MULS ? (MULS[defOne]||1.0) : 1.0;
    }

    // 本源加成（同屬性↑，異屬性↓；無元素不受影響）
    var STAB_SAME = (typeof window.STAB_SAME==='number') ? window.STAB_SAME : ((typeof window.STAB==='number')?window.STAB:1.0);
    var STAB_DIFF = (typeof window.STAB_DIFF==='number') ? window.STAB_DIFF : 1.0;
    if (atkElem !== 'none' && attacker && attacker.element){
      if (attacker.element === atkElem) elemMul = elemMul * STAB_SAME;
      else elemMul = elemMul * STAB_DIFF;
    }

    // 4) 係數與穿透
    var power = safe(sk,'power',100) / 100;  // 100% → 1.0
    var defEff = Math.max(0, DEF - PEN);

    // 5) 基礎傷害
    var base = Math.max(1, Math.round((ATK * power) - defEff));

    // 6) 暴擊
    var cRate = clamp(safe(aD,'暴擊率',3), 0, 100);
    var cDmg  = Math.max(100, safe(aD,'暴擊傷害',150));
    var isCrit = (Math.random()*100 < cRate);
    var out = base;
    if (isCrit) out = Math.round(base * (cDmg/100));

    // 7) 套元素倍率
    out = Math.round(out * elemMul);

    // 最低傷害保底 1
    if (out < 1) out = 1;

    return {
      damage: out,
      isCrit: !!isCrit,
      elem: atkElem,
      mul: elemMul
    };
  }

  // === 對外 ===
  window.SkillDB = {
    get: get,
    list: list,
    calcDamage: calcDamage
  };
})();
