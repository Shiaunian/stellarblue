(function(){
  // ===== 小工具 =====
  function qs(s,p){ return (p||document).querySelector(s); }
  function qsa(s,p){ p=p||document; return Array.prototype.slice.call(p.querySelectorAll(s)); }
  function fmt(n){ return new Intl.NumberFormat('zh-Hant').format(n||0); }
  function safe(v, d){ return (v==null ? d : v); }

  // ===== 產出 Modal（若不存在）=====
  function ensureModal(){
    if (qs('#rankModal')) return;
    var wrap = document.createElement('div');
    wrap.id = 'rankModal';
    wrap.className = 'modal';
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML =
      '<div class="mask" data-close="rank"></div>'+
      '<div class="sheet" role="dialog" aria-labelledby="rankTitle">'+
        '<div class="sec-title" id="rankTitle">排行榜'+
          '<div class="close" data-close="rank">✕</div>'+
        '</div>'+
        '<div class="body" style="display:grid; gap:10px; max-height:65vh; overflow:auto;">'+
          '<div class="row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">'+
            '<button class="opx" id="btnRankRefresh">重新整理</button>'+
            '<span id="rankHint" style="font-size:12px; opacity:.8;"></span>'+
          '</div>'+
          '<div style="overflow:auto;">'+
            '<table id="rankTable" style="width:100%; border-collapse:collapse; font-size:12px;">'+
              '<thead>'+
                '<tr style="text-align:left; border-bottom:1px solid rgba(255,255,255,.15)">'+
                  '<th style="padding:6px 8px; writing-mode:horizontal-tb; text-orientation:mixed;">#</th>'+
                  '<th style="padding:6px 8px; writing-mode:horizontal-tb; text-orientation:mixed;">名稱</th>'+
                  '<th style="padding:6px 8px; writing-mode:horizontal-tb; text-orientation:mixed;">元素</th>'+
                  '<th style="padding:6px 8px; writing-mode:horizontal-tb; text-orientation:mixed;">等級</th>'+
                  '<th style="padding:6px 8px; writing-mode:horizontal-tb; text-orientation:mixed;">戰力</th>'+
                  '<th style="padding:6px 8px; writing-mode:horizontal-tb; text-orientation:mixed;">真元上限</th>'+
                '</tr>'+
              '</thead>'+
              '<tbody></tbody>'+
            '</table>'+
          '</div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(wrap);

    // 關閉事件
    wrap.addEventListener('click', function(e){
      var closeBtn = e.target.getAttribute ? e.target.getAttribute('data-close') : '';
      if (closeBtn === 'rank'){ Rank.close(); }
    });
    // 重新整理
    var btn = qs('#btnRankRefresh', wrap);
    if (btn){ btn.addEventListener('click', function(){ Rank.refresh(); }); }
  }


  // ===== 戰力估算：沿用你現有 stats + 裝備加成 =====
  function computePower(p){
    try{
      var base  = (typeof derivedFrom === 'function') ? derivedFrom(p) : {};
      var bonus = (window.Equip && typeof Equip.getBonuses === 'function') ? (Equip.getBonuses() || {}) : {};
      function get(name){ return safe(base[name],0) + safe(bonus[name],0); }
      // 簡單綜合：物攻+法攻+物防+法防 + (HP上限/5) + (MP上限/10)
      var atk  = get('物理攻擊') + get('法術攻擊');
      var def  = get('物理防禦') + get('法術防禦');
      var hpm  = get('氣血上限');
      var mpm  = get('真元上限');
      var pwr  = (atk + def) + Math.floor(hpm/5) + Math.floor(mpm/10);
      return pwr >= 0 ? pwr : 0;
    }catch(_){ return 0; }
  }

  // ===== 數據整形（補 avatar）=====
  function normalizePlayer(username, data){
    var p = data || {};
    var name = p.name || username || '(未命名)';
    var elem = p.element || 'none';

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
        '<div style="display:flex; align-items:center; gap:8px; min-width:0;">' +
          '<img src="'+ avatar +'" alt="avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,.2)">' +
          '<button class="rank-prof" data-view-profile="'+ (r.username || '') +'" '+
                  'style="all:unset;cursor:pointer;color:#eaf2ff;font-weight:700;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
            + (r.name || '(未命名)') +
          '</button>' +
        '</div>';

      tr.innerHTML =
        '<td style="padding:6px 8px; white-space:nowrap;">'+ (i+1) +'</td>'+
        '<td style="padding:6px 8px; max-width:180px;">'+ nameCell +'</td>'+
        '<td style="padding:6px 8px;">'+ elemText +'</td>'+
        '<td style="padding:6px 8px;">'+ fmt(r.level) +'</td>'+
        '<td style="padding:6px 8px; font-weight:600;">'+ fmt(r.power) +'</td>'+
        '<td style="padding:6px 8px;">'+ fmt(r.mpMax) +'</td>';

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

        // 重新算戰力（保證一致）
        var pow = (function(){
          try{
            var base  = (typeof derivedFrom === 'function') ? derivedFrom(p) : {};
            var bonus = (window.Equip && typeof Equip.getBonuses === 'function') ? (Equip.getBonuses() || {}) : {};
            var atk  = (base['物理攻擊']||0)+(bonus['物理攻擊']||0) + (base['法術攻擊']||0)+(bonus['法術攻擊']||0);
            var def  = (base['物理防禦']||0)+(bonus['物理防禦']||0) + (base['法術防禦']||0)+(bonus['法術防禦']||0);
            var hpm  = (base['氣血上限']||0)+(bonus['氣血上限']||0);
            var mpm  = (base['真元上限']||0)+(bonus['真元上限']||0);
            var x = (atk+def) + Math.floor(hpm/5) + Math.floor(mpm/10);
            return x>=0?x:0;
          }catch(_){ return row.power||0; }
        })();

        var elemText = (typeof ELEMENT_LABEL!=='undefined' && ELEMENT_LABEL[row.element]) ? ELEMENT_LABEL[row.element] : (row.element||'none');

        // 手機友善卡片
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
          +   '<div class="kv item"><span class="k">最近活動</span><span class="v">'+ (row.updatedAt? new Date(row.updatedAt).toLocaleString('zh-TW') : '-') +'</span></div>'
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
