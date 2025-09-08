(function(){
  // ===== 小工具 =====
  function qs(s,p){ return (p||document).querySelector(s); }
  function qsa(s,p){ p=p||document; return Array.prototype.slice.call(p.querySelectorAll(s)); }
  function fmt(n){ return new Intl.NumberFormat('zh-Hant').format(n||0); }
  function safe(v, d){ return (v==null ? d : v); }

  // ===== 確保排行榜 Modal 存在（若不存在就動態建立）=====
  function ensureModal(){
    var m = qs('#rankModal');
    if (!m){
      m = document.createElement('div');
      m.id = 'rankModal';
      m.className = 'modal';
      m.setAttribute('aria-hidden','true');
      m.innerHTML =
        '<div class="mask" data-close="rank"></div>'+
        '<div class="sheet" role="dialog" aria-labelledby="rankTitle">'+
          '<div class="sec-title" id="rankTitle">排行榜<div class="close" data-close="rank">✕</div></div>'+
          '<div class="body">'+
            '<table id="rankTable" style="width:100%;border-collapse:collapse;">'+
              '<thead><tr>'+
                '<th style="text-align:center;font-size:12px;">#</th>'+
                '<th style="text-align:center;font-size:12px;">名稱</th>'+
                '<th style="text-align:center;font-size:12px;">性別</th>'+
                '<th style="text-align:center;font-size:12px;">元素</th>'+
                '<th style="text-align:center;font-size:12px;">等級</th>'+
                '<th style="text-align:center;font-size:12px;min-width:96px;">戰力</th>'+
              '</tr></thead>'+
              '<tbody><tr><td colspan="6" style="padding:10px;opacity:.8;">尚無資料</td></tr></tbody>'+
            '</table>'+
            '<div id="rankHint" style="margin-top:6px;opacity:.8;font-size:12px;"></div>'+
          '</div>'+
        '</div>';
      document.body.appendChild(m);

      // 關閉（委派：遮罩 & 右上角 ✕）
      m.addEventListener('click', function(e){
        var c = e && e.target && e.target.getAttribute ? e.target.getAttribute('data-close') : '';
        if (c === 'rank'){
          m.classList.remove('show');
          m.setAttribute('aria-hidden','true');
        }
      });
    }
  }



  // ===== 戰力估算：所有能力值合成（含裝備加成；HP/5、MP/10）=====
  function computePower(p){
    try{
      var base  = (typeof derivedFrom === 'function') ? derivedFrom(p) : {};
      var bonus = (window.Equip && typeof Equip.getBonuses === 'function') ? (Equip.getBonuses() || {}) : {};
      var final = {};
      var k;

      // 合併 base + bonus（不用展開運算子）
      for (k in base){ if (base.hasOwnProperty(k)){ final[k] = safe(base[k],0) + safe(bonus[k],0); } }
      for (k in bonus){ if (bonus.hasOwnProperty(k) && !final.hasOwnProperty(k)){ final[k] = safe(bonus[k],0); } }

      // 將所有能力值累加；HP/MP 依既定縮放避免淹沒其他能力
      var score = 0;
      for (k in final){
        if (!final.hasOwnProperty(k)) continue;
        var v = Number(final[k] || 0);
        if (isNaN(v)) continue;
        if (k.indexOf('氣血上限') !== -1){ score += Math.floor(v/5); }
        else if (k.indexOf('真元上限') !== -1){ score += Math.floor(v/10); }
        else { score += v; }
      }
      if (score < 0) score = 0;
      return score;
    }catch(_){ return 0; }
  }


  // ===== 數據整形（補 avatar）=====
function normalizePlayer(username, data){
  var p = data || {};
  var name = p.name || username || '(未命名)';
  var elem = p.element || 'none';
  var gender = (p.gender === 'F') ? 'F' : 'M';

  // 頭像：玩家自帶 > Auth.defaultAvatar() > 預設
  var fallbackAvatar = (window.Auth && typeof Auth.defaultAvatar==='function')
    ? (Auth.defaultAvatar() || 'https://picsum.photos/seed/xian/64')
    : 'https://picsum.photos/seed/xian/64';
  var avatar = p.avatar || fallbackAvatar;

  // 重算上限（避免缺欄位時顯示不準）
  try{
    var base  = (typeof derivedFrom === 'function') ? derivedFrom(p) : {};
    var bonus = (window.Equip && typeof Equip.getBonuses === 'function') ? (Equip.getBonuses() || {}) : {};
    var hpMax = safe(base['氣血上限'],0) + safe(bonus['氣血上限'],0);
    var mpMax = safe(base['真元上限'],0) + safe(bonus['真元上限'],0);
    p.hp = p.hp || { cur:hpMax, max:hpMax };
    p.mp = p.mp || { cur:mpMax, max:mpMax };
    p.hp.max = hpMax; p.mp.max = mpMax;
  }catch(_){}
  var lv  = safe(p.level,1);
  var exp = (p.exp && p.exp.cur!=null) ? p.exp.cur : 0;
  var pow = computePower(p);

  // 更新時間（優先 _updatedAt）
  var ts = safe(p._updatedAt, 0);
  if (!ts && p.logs && p.logs.lastEnterCave) { ts = p.logs.lastEnterCave; }
  if (!ts && p.logs && p.logs.lastMap) { ts = p.logs.lastMap; }
  if (!ts) ts = 0;

  return {
    username: username || '',
    name: name,
    element: elem,
    gender: gender,        // ★ 新增
    avatar: avatar,
    level: lv,
    exp: exp,
    power: pow,
    hpMax: safe(p.hp && p.hp.max, 0),
    mpMax: safe(p.mp && p.mp.max, 0),
    updatedAt: ts
  };
}



  // ===== 排序（等級↓ → 經驗↓ → 戰力↓）=====
  function sortRank(a, b){
    if (b.level !== a.level) return b.level - a.level;
    if (b.exp   !== a.exp)   return b.exp   - a.exp;
    if (b.power !== a.power) return b.power - a.power;
    return 0;
  }

  // ===== 渲染表格（精簡欄位：元素單字、移除經驗/HP/時間）=====
  function renderTable(rows){
    var tbody = qs('#rankTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var max = rows.length;
    var i=0;

    // 元素單字對照
    var elemOne = {
      none:'無', gold:'金', wood:'木', water:'水', fire:'火', earth:'土', spirit:'靈', dark:'暗'
    };

    while(i<rows.length){
      var r = rows[i] || {};
      var tr = document.createElement('tr');
      if (i%2===1){ tr.style.background = 'rgba(255,255,255,.04)'; }

      var ekey = (r.element || 'none').toLowerCase();
      var elemText = elemOne[ekey] || '無';
      var avatar = r.avatar || 'https://picsum.photos/seed/xian/64';

      // 名稱欄位：頭像 + 名稱（可點擊開啟對方資訊）
      var nameCell =
        '<div style="display:flex; align-items:center; justify-content:center; gap:8px; min-width:0;">' +
          '<img src="'+ avatar +'" alt="avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,.2)">' +
          '<button class="rank-prof" data-view-profile="'+ (r.username || '') +'" '+
                  'style="all:unset;cursor:pointer;color:#eaf2ff;font-weight:700;font-size:11px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
            + (r.name || '(未命名)') +
          '</button>' +
        '</div>';

      // 性別以「男 / 女」顯示
      var genderText = (r.gender === 'F') ? '女' : '男';

      tr.innerHTML =
        '<td style="padding:6px 8px; white-space:nowrap; text-align:center; font-size:11px;">'+ (i+1) +'</td>'+
        '<td style="padding:6px 8px; max-width:180px; text-align:center;">'+ nameCell +'</td>'+
        '<td style="padding:6px 8px; text-align:center; font-size:11px;">'+ genderText +'</td>'+
        '<td style="padding:6px 8px; text-align:center; font-size:11px;">'+ elemText +'</td>'+
        '<td style="padding:6px 8px; text-align:center; font-size:11px;">'+ fmt(r.level) +'</td>'+
        '<td style="padding:6px 8px; font-weight:600; text-align:center; font-size:11px; min-width:96px; white-space:nowrap;">'+ fmt(r.power) +'</td>';

      tbody.appendChild(tr);
      i = i + 1;
    }
    var hint = qs('#rankHint');
    if (hint){
      hint.textContent = '資料來源：characters（依 等級→經驗→戰力 排序）｜共 '+ fmt(max) +' 名';
    }
  }



  // ===== 讀取資料 =====
  function fetchAllCharacters(cb){
    try{
      if (!window.DB || !DB.ref){ cb([]); return; }
      DB.ref('characters').get().then(function(snap){
        var list = [];
        if (snap && snap.exists()){
          var val = snap.val() || {};
          for (var u in val){
            if (!val.hasOwnProperty(u)) continue;
            try{
              var row = normalizePlayer(u, val[u] || {});
              list.push(row);
            }catch(_){}
          }
        }
        cb(list);
      }).catch(function(){ cb([]); });
    }catch(_){ cb([]); }
  }

  // ===== 開關 & 對外 API =====
  var Rank = {
    open: function(){
      ensureModal();
      var m = qs('#rankModal');
      if (m){ m.classList.add('show'); m.setAttribute('aria-hidden','false'); }
      this.refresh();
    },
    close: function(){
      var m = qs('#rankModal');
      if (m){ m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }
    },
      refresh: function(){
        var tbody = qs('#rankTable tbody');
        if (tbody){ tbody.innerHTML = '<tr><td colspan="6" style="padding:10px; opacity:.8;">讀取中…</td></tr>'; }
        fetchAllCharacters(function(list){
          list.sort(sortRank);
          if (list.length > 50){ list = list.slice(0,50); }
          renderTable(list);
        });
      },


    // === 檢視指定使用者（對方資訊視窗）===
    view: function(uid){
      if(!uid) return;

      // 動態建立 Profile Modal（一次）
      var pid = 'rankProfileModal';
      var pm = qs('#'+pid);
      if(!pm){
        pm = document.createElement('div');
        pm.id = pid;
        pm.className = 'modal';
        pm.setAttribute('aria-hidden','true');
        pm.innerHTML =
          '<div class="mask" data-close="prof"></div>'+
          '<div class="sheet" role="dialog" aria-labelledby="profTitle">'+
            '<div class="sec-title" id="profTitle">玩家資訊<div class="close" data-close="prof">✕</div></div>'+
            '<div class="body" id="profBody" style="display:grid; gap:10px;"></div>'+
          '</div>';
        document.body.appendChild(pm);

        // 關閉
        pm.addEventListener('click', function(e){
          var c = e.target && e.target.getAttribute ? e.target.getAttribute('data-close') : '';
          if (c === 'prof'){ pm.classList.remove('show'); pm.setAttribute('aria-hidden','true'); }
        });
      }

      // 讀取對方資料
      if (!window.DB || !DB.ref){
        qs('#profBody').innerHTML = '<div style="opacity:.8;">無法讀取資料。</div>';
        pm.classList.add('show'); pm.setAttribute('aria-hidden','false');
        return;
      }

      qs('#profBody').innerHTML = '<div style="opacity:.8;">讀取中…</div>';
      pm.classList.add('show'); pm.setAttribute('aria-hidden','false');

      DB.ref('characters/'+uid).get().then(function(snap){
        var p = snap && snap.exists() ? snap.val() : {};
        var row = normalizePlayer(uid, p);

        // 重新算戰力（全能力值版本）
        var pow = computePower(p);

        // 取裝備（純顯示，盡量容錯）
        function eqName(x){
          if(!x) return '-';
          if (typeof x === 'string') return x;
          if (x.name) return x.name;
          if (x.title) return x.title;
          if (x.id) return x.id;
          if (x.key) return x.key;
          return '-';
        }
        var eq = p.equip || p.equipment || {};
        var wname = eqName(eq.weapon || eq['武器']);
        var rname = eqName(eq.ring || eq['戒指']);
        var nname = eqName(eq.necklace || eq['項鍊']);
        var aname = eqName(eq.amulet || eq['護符'] || eq.accessory || eq['飾品']);

        var elemText = (typeof ELEMENT_LABEL!=='undefined' && ELEMENT_LABEL[row.element]) ? ELEMENT_LABEL[row.element] : (row.element||'none');

        // 手機友善卡片 + 能力 + 裝備（純顯示）
        var html = ''
          + '<div style="display:grid; grid-template-columns:56px 1fr; gap:10px; align-items:center;">'
          +   '<img src="'+ (row.avatar||'https://picsum.photos/seed/xian/64') +'" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:1px solid rgba(255,255,255,.2)">'
          +   '<div style="min-width:0;">'
          +     '<div style="font-weight:900; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">'+ (row.name||'(未命名)') +'</div>'
          +     '<div style="display:flex; gap:8px; align-items:center; font-size:12px; opacity:.9;">'
          +       '<span class="pill elem '+ (row.element||'none') +'">'+ elemText +'</span>'
          +       '<span>LV.'+ fmt(row.level) +'</span>'
          +       '<span>EXP '+ fmt(row.exp) +'</span>'
          +     '</div>'
          +   '</div>'
          + '</div>'
          + '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">'
          +   '<div class="kv item"><span class="k">戰力</span><span class="v">'+ fmt(pow) +'</span></div>'
          +   '<div class="kv item"><span class="k">氣血上限</span><span class="v">'+ fmt(row.hpMax) +'</span></div>'
          +   '<div class="kv item"><span class="k">真元上限</span><span class="v">'+ fmt(row.mpMax) +'</span></div>'
          + '</div>'
          + '<div class="sec-title" style="margin-top:6px;">裝備</div>'
          + '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">'
          +   '<div class="kv item"><span class="k">武器</span><span class="v">'+ wname +'</span></div>'
          +   '<div class="kv item"><span class="k">戒指</span><span class="v">'+ rname +'</span></div>'
          +   '<div class="kv item"><span class="k">項鍊</span><span class="v">'+ nname +'</span></div>'
          +   '<div class="kv item"><span class="k">飾品</span><span class="v">'+ aname +'</span></div>'
          + '</div>';

        var body = qs('#profBody');
        if (body){ body.innerHTML = html; }
      }).catch(function(){
        var body = qs('#profBody');
        if (body){ body.innerHTML = '<div style="opacity:.8;">讀取失敗。</div>'; }
      });
    }
  };

  window.Rank = Rank;

  // 委派監聽：開啟排行榜／檢視玩家資訊
  document.addEventListener('click', function(e){
    var t = e.target;

    // 1) 開啟排行榜
    var btnRank = t.closest ? t.closest('[data-open="rank"]') : null;
    if (btnRank){ Rank.open(); return; }

    // 2) 點擊名稱/頭像 → 檢視對方資訊
    var profBtn = (t.classList && t.classList.contains('rank-prof')) ? t
                  : (t.closest ? t.closest('[data-view-profile]') : null);
    if (profBtn){
      var uid = profBtn.getAttribute('data-view-profile') || profBtn.getAttribute('data-uid') || '';
      if (uid){ Rank.view(uid); }
    }
  });
})();
