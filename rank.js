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



// ===== 戰力估算（基礎衍生 + 該玩家自身裝備加成；HP/5、MP/10）=====
function computePower(p){
  function safe(v,d){ return (v==null?d:v); }
  try{
    var base = (typeof derivedFrom === 'function') ? (derivedFrom(p) || {}) : {};

    // ✅ 只在有 Equip.getBonusesFor(player) 時才取；沒有就當 0，避免算錯
    var bonus = (window.Equip && typeof Equip.getBonusesFor === 'function')
      ? (Equip.getBonusesFor(p) || {})
      : {};

    var final = {}, k;
    for (k in base){ if (Object.prototype.hasOwnProperty.call(base,k)) final[k] = safe(base[k],0); }
    for (k in bonus){ if (Object.prototype.hasOwnProperty.call(bonus,k)) final[k] = (final[k]||0) + safe(bonus[k],0); }

    var score = 0;
    for (k in final){
      if (!Object.prototype.hasOwnProperty.call(final,k)) continue;
      var v = Number(final[k] || 0);
      if (isNaN(v)) continue;
      if (k.indexOf('氣血上限') !== -1) score += Math.floor(v/5);
      else if (k.indexOf('真元上限') !== -1) score += Math.floor(v/10);
      else score += v;
    }
    return Math.max(0, score|0);
  }catch(_){ return 0; }
}

// ===== 數據整形（補 avatar 與上限）=====
function normalizePlayer(username, data){
  function safe(v,d){ return (v==null?d:v); }
  var p = data || {};
  var name = p.name || username || '(未命名)';

  var fallbackAvatar = (window.Auth && typeof Auth.defaultAvatar==='function')
    ? (Auth.defaultAvatar() || 'https://picsum.photos/seed/xian/64')
    : 'https://picsum.photos/seed/xian/64';
  p.avatar = p.avatar || fallbackAvatar;

  // 重新計上限（基礎 + 該玩家自身裝備加成）
  try{
    var base  = (typeof derivedFrom === 'function') ? (derivedFrom(p) || {}) : {};
    var bonus = (window.Equip && typeof Equip.getBonusesFor === 'function')
      ? (Equip.getBonusesFor(p) || {})
      : {};
    var hpMax = safe(base['氣血上限'],0) + safe(bonus['氣血上限'],0);
    var mpMax = safe(base['真元上限'],0) + safe(bonus['真元上限'],0);
    p.hp = p.hp || { cur:hpMax, max:hpMax };
    p.mp = p.mp || { cur:mpMax, max:mpMax };
    p.hp.max = hpMax; p.mp.max = mpMax;
  }catch(_){}

  return {
    username: username || '',
    name,
    element: p.element || 'none',
    gender: (p.gender === 'F') ? 'F' : 'M',
    avatar: p.avatar,
    level: safe(p.level,1),
    exp: (p.exp && p.exp.cur!=null) ? p.exp.cur : 0,
    power: computePower(p),
    hpMax: safe(p.hp && p.hp.max, 0),
    mpMax: safe(p.mp && p.mp.max, 0),
    updatedAt: safe(p._updatedAt, 0)
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
          '<button class="rank-prof" data-view-profile="'+ (r.username || '') +'" style="all:unset;cursor:pointer;border-radius:50%;">' +
            '<img src="'+ avatar +'" alt="avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,.2)">' +
          '</button>' +
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

        // 自己的帳號（用於是否顯示加入好友）
        var me = (window.Auth && typeof Auth.currentUser==='function') ? Auth.currentUser() : null;
        var myId = (me && me.username) ? me.username : '';

        // 戰力
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

        // 是否可加入好友（不是自己）
        var canAdd = (myId && myId !== uid);
        var btnHtml = '';
        if (canAdd){
          btnHtml =
            '<button id="btnAddFriend" data-send-friend="'+ uid +'" '+
            'style="padding:6px 10px; border-radius:10px; border:1px solid rgba(255,255,255,.18); background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; font-weight:800; cursor:pointer;">加入好友</button>';
        } else {
          btnHtml = '<div style="opacity:.7; font-size:12px;">（這是你自己）</div>';
        }

        // 手機友善卡片 + 能力 + 裝備 + 動作（加入好友）
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
          + '</div>'
          + '<div style="margin-top:6px;">'+ btnHtml +'</div>';

        var body = qs('#profBody');
        if (body){ body.innerHTML = html; }
      }).catch(function(){
        var body = qs('#profBody');
        if (body){ body.innerHTML = '<div style="opacity:.8;">讀取失敗。</div>'; }
      });
    }

  };

  window.Rank = Rank;

  // 委派監聽：開啟排行榜／檢視玩家資訊／送出好友邀請
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
      if (uid){ Rank.view(uid); return; }
    }

    // 3) 送出好友邀請
    var addBtn = t.closest ? t.closest('[data-send-friend]') : null;
    if (addBtn){
      if (!window.DB || !DB.ref || !window.Auth || !Auth.currentUser){ return; }
      var me = Auth.currentUser() || null;
      var myId = me && me.username ? me.username : '';
      var toId = addBtn.getAttribute('data-send-friend') || '';
      if (!myId || !toId || myId === toId){ return; }

      // 寫入：對方的收件匣 & 我的寄件匣
      DB.ref('characters/'+toId+'/friendInbox/'+myId).set(true);
      DB.ref('characters/'+myId+'/friendOutbox/'+toId).set(true);

      // 視覺：按鈕變紅、顯示已發送
      addBtn.textContent = '已發送邀請';
      addBtn.style.background = '#ef4444';
      addBtn.style.borderColor = 'rgba(255,255,255,.35)';
      addBtn.style.color = '#fff';
      addBtn.disabled = true;
    }
  });

})();