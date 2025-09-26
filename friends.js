(function(){
  function qs(s,p){ return (p||document).querySelector(s); }
  function qsa(s,p){ p=p||document; return Array.prototype.slice.call(p.querySelectorAll(s)); }

  // ===== pair key（雙方固定排序避免重複房間）=====
  function pairKey(a,b){
    return (String(a)<=String(b)) ? (a+'__'+b) : (b+'__'+a);
  }

  // ===== 監聽邀請數量，更新紅點 =====
  function watchInboxBadge(){
    try{
      if(!window.DB || !DB.ref || !window.Auth || !Auth.currentUser) return;
      var me = Auth.currentUser(); if(!me || !me.username) return;
      var badge = qs('#friendBadge');

      DB.ref('characters/'+me.username+'/friendInbox').on('value', function(snap){
        var has = snap && snap.exists() && snap.val();
        var show = false;
        if (has){
          for (var k in has){ if (has.hasOwnProperty(k)) { show=true; break; } }
        }
        if (badge){ badge.style.display = show ? 'inline-block' : 'none'; }
      });
    }catch(_){}
  }

  // ===== 面板建立 =====
  function ensureModal(){
    var m = qs('#friendsModal');
    if(m) return m;
    m = document.createElement('div');
    m.id = 'friendsModal';
    m.className = 'modal';
    m.setAttribute('aria-hidden','true');
    m.innerHTML =
      '<div class="mask" data-close="friends"></div>' +
      '<div class="sheet" role="dialog" aria-labelledby="friendsTitle" style="position:fixed; top:0; left:50%; transform:translateX(-50%); width:min(96vw, 420px); max-height:98svh; display:grid; grid-template-rows:auto 1fr; overflow:hidden;">' +
        '<div class="sec-title" id="friendsTitle">好 友<div class="close" data-close="friends">✕</div></div>' +
        '<div class="body" style="display:grid; gap:8px; overflow:auto;">' +
          '<div class="bag-tabs" style="display:flex; align-items:center; gap:8px;">' +
            '<span class="bag-tab active" data-f-tab="list">好友</span>' +
            '<span class="bag-tab" data-f-tab="inbox">邀請</span>' +
            '<button id="btnNewGroup" class="opx" style="margin-left:auto;">＋ 群組</button>' +
          '</div>' +
          '<div id="groupsList" class="bag-list" style="max-height:unset;"></div>' +
          '<div id="friendsList" class="bag-list" style="max-height:unset;"></div>' +
          '<div id="friendsInbox" class="bag-list" style="display:none; max-height:unset;"></div>' +
          '<div id="chatBox" style="display:none; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:8px; gap:8px;">' +
            '<div id="chatLog" style="height:460px; overflow:auto; background:#060a1a; border:1px solid rgba(255,255,255,.15); border-radius:8px; padding:6px; font-size:12px;"></div>' +
            '<div id="chatRetentionTip" style="text-align:center; font-size:10px; opacity:.1.65; margin:5px 0 5px 0;">僅保留最近 300 則訊息</div>' +
            '<div style="display:flex; gap:6px;">' +
              '<input id="chatInputFriend" type="text" placeholder="輸入訊息..." style="flex:1; padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,.15); background:#fff; color:#111;">' +
              '<button id="btnSendFriend" class="opx primary">送出</button>' +
              '<button id="btnBackFriends" class="opx">返回</button>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';

    document.body.appendChild(m);

    // 關閉
    m.addEventListener('click', function(e){
      var c = e.target && e.target.getAttribute ? e.target.getAttribute('data-close') : '';
      if (c === 'friends'){ m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }
    });

    // 分頁切換
    m.addEventListener('click', function(e){
      var tab = e.target && e.target.getAttribute ? e.target.getAttribute('data-f-tab') : '';
      if (!tab) return;
      qsa('.bag-tab', m).forEach(function(t){ t.classList.remove('active'); });
      e.target.classList.add('active');
      qs('#friendsList').style.display  = (tab==='list') ? '' : 'none';
      qs('#friendsInbox').style.display = (tab==='inbox') ? '' : 'none';
      qs('#chatBox').style.display = 'none';
      // 群組清單在兩個分頁都顯示（保持常駐）
      var g = qs('#groupsList'); if (g) g.style.display = '';
    });

    return m;
  }



  // ===== 讀清單 =====
function loadLists(){
    if (!window.DB || !DB.ref || !window.Auth || !Auth.currentUser) return;
    var me = Auth.currentUser(); if(!me || !me.username) return;

    // 好友清單
    DB.ref('characters/'+me.username+'/friends').get().then(function(snap){
      var val = (snap && snap.exists()) ? snap.val() : {};
      var list = [];
      for (var k in val){ if (val.hasOwnProperty(k) && val[k]) list.push(k); }
      renderFriends(list);
    });

    // 邀請清單（收件匣）
    DB.ref('characters/'+me.username+'/friendInbox').get().then(function(snap){
      var val = (snap && snap.exists()) ? snap.val() : {};
      var list = [];
      for (var k in val){ if (val.hasOwnProperty(k) && val[k]) list.push(k); }
      renderInbox(list);
    });

    // 群組清單（常駐於視窗）
    DB.ref('characters/'+me.username+'/groups').get().then(function(snap){
      var val = (snap && snap.exists()) ? snap.val() : {};
      var list = [];
      for (var k in val){ if (val.hasOwnProperty(k) && val[k]) list.push(k); }
      renderGroups(list);
    });

    // ====== 渲染邀請清單（收件匣）— 修正為好友邀請樣式 ======
    function renderInbox(arr){
      var box = qs('#friendsInbox'); if(!box) return;
      if(!arr || !arr.length){
        box.innerHTML = '<div style="opacity:.8;">目前沒有邀請。</div>';
        return;
      }

      var rows = [];
      var pending = arr.length;

      function fallbackAvatar(){
        try{
          if (window.Auth && Auth.defaultAvatar){
            var a = Auth.defaultAvatar();
            if (a) return a;
          }
        }catch(_){}
        return 'https://via.placeholder.com/28';
      }

      function pushRow(username, data){
        var nickname = (data && (data.nickname || data.name)) || username;
        var avatar   = (data && data.avatar && String(data.avatar).trim())
                     || (data && data.avatarUrl && String(data.avatarUrl).trim())
                     || fallbackAvatar();
        rows.push({ username: username, nickname: nickname, avatar: avatar });
        pending--;
        if (pending === 0){ finalize(); }
      }

      for (var i=0; i<arr.length; i++){
        (function(idx){
          var u = arr[idx];
          DB.ref('characters/'+u).get().then(function(snap){
            var data = (snap && snap.exists()) ? snap.val() : {};
            pushRow(u, data);
          }).catch(function(_){
            pushRow(u, {});
          });
        })(i);
      }

      function finalize(){
        var html = '';
        for (var j=0; j<rows.length; j++){
          var r = rows[j];
          html +=
            '<div class="dex-row">'+
              '<img src="'+ r.avatar +'" alt="頭像" style="width:40px; height:40px; border-radius:50%; object-fit:cover; margin-right:8px;">'+
              '<div class="dex-main">'+
                '<div class="dex-name">'+ r.nickname +'</div>'+
                '<div class="dex-sub">好友邀請</div>'+
              '</div>'+
              '<div>'+
                '<button class="opx primary" data-accept="'+ r.username +'">接受</button> '+
                '<button class="opx" data-reject="'+ r.username +'" style="background:#b91c1c; color:#fff; border:1px solid rgba(255,255,255,.2);">拒絕</button>'+
              '</div>'+
            '</div>';
        }
        box.innerHTML = html;
      }
    }
  }



function renderFriends(arr){
  var box = qs('#friendsList'); if(!box) return;
  if(!arr || !arr.length){ box.innerHTML = '<div style="opacity:.8;">目前沒有好友。</div>'; return; }

  // 取得自己帳號（供 pairKey 使用）
  if (!window.DB || !DB.ref || !window.Auth || !Auth.currentUser) return;
  var meObj = Auth.currentUser(); if (!meObj || !meObj.username) return;
  var me = meObj.username;

  var rows = [];
  var pending = arr.length;

  // 預設頭像
  function fallbackAvatar(){
    try{
      if (window.Auth && Auth.defaultAvatar){
        var a = Auth.defaultAvatar();
        if (a) return a;
      }
    }catch(_){}
    return 'https://via.placeholder.com/40x40?text=🤖';
  }

  // 逐一載入好友資料 + 最新訊息
  for (var i=0;i<arr.length;i++){
    (function(idx){
      var username = arr[idx];
      DB.ref('characters/'+username).get().then(function(snap){
        var data = (snap && snap.exists()) ? snap.val() : {};
        var nickname = data.nickname || data.name || username;
        var avatar = (data.avatar && String(data.avatar).trim())
                   || (data.avatarUrl && String(data.avatarUrl).trim())
                   || fallbackAvatar();

        var row = { i:idx, username:username, nickname:nickname, avatar:avatar, lastText:'', lastTs:0 };

        // 讀取最新一則訊息（僅 1 則）
        var k = pairKey(me, username);
        return DB.ref('chats/'+k+'/messages').limitToLast(1).get().then(function(ms){
          if (ms && ms.exists()){
            var v = ms.val() || {};
            for (var mid in v){
              if (!v.hasOwnProperty(mid)) continue;
              var m = v[mid] || {};
              row.lastText = String(m.text || '');
              row.lastTs   = Number(m.ts || 0);
            }
          }
          rows.push(row);
          pending--;
          if (pending === 0){ finalize(); }
        }).catch(function(_){
          rows.push(row);
          pending--;
          if (pending === 0){ finalize(); }
        });
      });
    })(i);
  }

  // 產出畫面：依最新訊息 ts 由新到舊排序（無訊息者放後面；同 ts 依原本順序）
  function finalize(){
    rows.sort(function(a,b){
      var ta = Number(a.lastTs || 0), tb = Number(b.lastTs || 0);
      if (ta === tb) return a.i - b.i;
      return tb - ta; // 新的在上方
    });

    var html = '';
    for (var j=0;j<rows.length;j++){
      var r = rows[j];
      var preview = r.lastText ? String(r.lastText).replace(/\s+/g,' ').trim() : '尚無訊息';
      // 依寬度自動裁切（以 CSS ellipsis 顯示 …，約 12～16 字）
      // 不再用固定 slice(0,8)

      html +=
        '<div class="dex-row">'+
          '<img src="'+ r.avatar +'" alt="頭像" style="width:40px; height:40px; border-radius:50%; object-fit:cover; margin-right:8px;">'+
          '<div class="dex-main">'+
            // 移除驚嘆號！ 只保留名稱
            '<div class="dex-name">'+ r.nickname +'</div>'+
            // 最新一行訊息（CSS 省略號，依寬度裁切）
            '<div class="dex-sub" title="'+ preview +'" style="color:#93c5fd; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:12em;">'+ preview +'</div>'+
          '</div>'+
          '<div>'+
            '<button class="opx" data-trade="'+ r.username +'">交易</button> '+
            '<button class="opx" data-chat-with="'+ r.username +'">對話</button> '+
            '<button class="opx" data-unfriend="'+ r.username +'">解除</button>'+
          '</div>'+
        '</div>';
    }

    box.innerHTML = html;
  }
}




function renderGroups(arr){
  var box = qs('#groupsList'); if(!box) return;
  // 區塊抬頭
  var head = '<div style="opacity:.9; font-weight:600; margin:6px 0 2px 0;">群組</div>';
  if(!arr || !arr.length){ box.innerHTML = head + '<div style="opacity:.7;">目前沒有群組。</div>'; return; }

  var rows = [];
  var pending = arr.length;

  for (var i=0;i<arr.length;i++){
    (function(idx){
      var gid = arr[idx];
      // 讀群組基本資料
      DB.ref('groups/'+gid).get().then(function(snap){
        var data = (snap && snap.exists()) ? snap.val() : {};
        var gname = data && data.name ? String(data.name) : ('群組 ' + gid.slice(-4));
        rows.push({ gid: gid, name: gname });
        pending--;
        if (pending === 0){ finalize(); }
      }).catch(function(_){
        rows.push({ gid: gid, name: ('群組 ' + gid.slice(-4)) });
        pending--;
        if (pending === 0){ finalize(); }
      });
    })(i);
  }

  function finalize(){
    var html = head;
    for (var j=0;j<rows.length;j++){
      var r = rows[j];
      html +=
        '<div class="dex-row">'+
          '<div class="dex-main">'+
            '<div class="dex-name">'+ r.name +'</div>'+
            '<div class="dex-sub">點擊進入群聊</div>'+
          '</div>'+
          '<div>'+
            '<button class="opx" data-chat-group="'+ r.gid +'">群聊</button> '+
            '<button class="opx" data-leave-group="'+ r.gid +'" style="background:#b91c1c; color:#fff; border:1px solid rgba(255,255,255,.2);">退出群組</button>'+
          '</div>'+
        '</div>';
    }
    box.innerHTML = html;
  }
}




  // ===== 對外 API =====
  var Friends = {
    open: function(){
      var m = ensureModal();
      if (m){ m.classList.add('show'); m.setAttribute('aria-hidden','false'); }
      loadLists();
    }
  };
  window.Friends = Friends;

  // ===== 全域委派：打開好友面板 / 接受 / 拒絕 / 解除 / 對話 / 建群 / 群聊 =====
  document.addEventListener('click', function(e){
    var t = e.target;

    // 開啟好友面板（主畫面「好友」按鈕）
    var btnOpen = t.closest ? t.closest('[data-open="friends"]') : null;
    if (btnOpen){ Friends.open(); return; }

    if (!window.DB || !DB.ref || !window.Auth || !Auth.currentUser) return;
    var me = Auth.currentUser(); if(!me || !me.username) return;

    // === 建立群組：打開建立面板（簡易對話框：輸入群名 + 勾選好友） ===
    var btnNewGroup = t.closest ? t.closest('#btnNewGroup') : null;
    if (btnNewGroup){
      // 讀好友清單供選擇
      DB.ref('characters/'+me.username+'/friends').get().then(function(snap){
        var val = (snap && snap.exists()) ? snap.val() : {};
        var list = [];
        for (var k in val){ if (val.hasOwnProperty(k) && val[k]) list.push(k); }

        // 動態生成簡易選單
        var overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.left = '0'; overlay.style.top = '0';
        overlay.style.right = '0'; overlay.style.bottom = '0';
        overlay.style.background = 'rgba(0,0,0,.45)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';

        var panel = document.createElement('div');
        panel.style.width = 'min(92vw, 420px)';
        panel.style.background = '#0b1020';
        panel.style.border = '1px solid rgba(255,255,255,.15)';
        panel.style.borderRadius = '12px';
        panel.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
        panel.style.color = '#eaf2ff';
        panel.style.padding = '16px';
        panel.style.display = 'grid';
        panel.style.gap = '10px';

        var title = document.createElement('div');
        title.textContent = '建立群組';
        title.style.fontWeight = 'bold';

        var nameInp = document.createElement('input');
        nameInp.type = 'text';
        nameInp.placeholder = '輸入群組名稱';
        nameInp.style.padding = '8px';
        nameInp.style.borderRadius = '8px';
        nameInp.style.border = '1px solid rgba(255,255,255,.2)';
        nameInp.style.background = '#fff';
        nameInp.style.color = '#111';

        var listBox = document.createElement('div');
        listBox.style.maxHeight = '40vh';
        listBox.style.overflow = 'auto';
        listBox.style.border = '1px solid rgba(255,255,255,.12)';
        listBox.style.borderRadius = '8px';
        listBox.style.padding = '8px';
        listBox.style.background = 'rgba(255,255,255,.04)';
        if (!list.length){
          listBox.innerHTML = '<div style="opacity:.8;">目前沒有可加入的好友。</div>';
        } else {
          for (var i=0;i<list.length;i++){
            (function(idx){
              var u = list[idx];
              var row = document.createElement('label');
              row.style.display = 'flex';
              row.style.alignItems = 'center';
              row.style.gap = '8px';
              row.style.margin = '4px 0';

              var cb = document.createElement('input');
              cb.type = 'checkbox';
              cb.value = u;

              var span = document.createElement('span');
              span.textContent = '載入中…';

              row.appendChild(cb);
              row.appendChild(span);
              listBox.appendChild(row);

              // 讀取角色暱稱/名稱，顯示在清單上（不要顯示帳號）
              DB.ref('characters/'+u).get().then(function(csnap){
                var cdata = (csnap && csnap.exists()) ? csnap.val() : {};
                var nickname = cdata && cdata.nickname ? String(cdata.nickname) : '';
                var cname = cdata && cdata.name ? String(cdata.name) : '';
                var showName = nickname || cname || '這位用戶';
                span.textContent = showName;
              }).catch(function(_){
                span.textContent = '這位用戶';
              });
            })(i);
          }
        }

        var btns = document.createElement('div');
        btns.style.display = 'flex';
        btns.style.justifyContent = 'flex-end';
        btns.style.gap = '8px';

        var cancel = document.createElement('button');
        cancel.className = 'opx';
        cancel.textContent = '取消';

        var ok = document.createElement('button');
        ok.className = 'opx primary';
        ok.textContent = '建立';

        btns.appendChild(cancel);
        btns.appendChild(ok);

        panel.appendChild(title);
        panel.appendChild(nameInp);
        panel.appendChild(listBox);
        panel.appendChild(btns);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeDlg(){
          if (overlay && overlay.parentNode){ overlay.parentNode.removeChild(overlay); }
        }
        cancel.onclick = function(){ closeDlg(); };

        ok.onclick = function(){
          var gname = String(nameInp.value||'').trim();
          if (!gname){ alert('請輸入群組名稱'); return; }

          // 收集選取成員（仍以帳號為值）
          var picks = [];
          var cbs = listBox.querySelectorAll('input[type=checkbox]');
          for (var j=0;j<cbs.length;j++){ if (cbs[j].checked){ picks.push(cbs[j].value); } }

          // 建群：一次性原子更新，避免重整時資料未送完
          var gidRef = DB.ref('groups').push();
          var gid = gidRef.key;
          var now = Date.now();

          var updates = {};
          updates['groups/'+gid] = { name: gname, owner: me.username, createdAt: now };
          updates['groupMembers/'+gid+'/'+me.username] = true;
          updates['characters/'+me.username+'/groups/'+gid] = true;
          for (var k=0;k<picks.length;k++){
            var u2 = picks[k];
            updates['groupMembers/'+gid+'/'+u2] = true;
            updates['characters/'+u2+'/groups/'+gid] = true;
          }

          // 防止重複點擊
          ok.disabled = true; ok.textContent = '建立中…';

          DB.ref().update(updates).then(function(){
            // 再次確認群組節點已可讀（避免網路延遲你剛 F5 就看不到）
            return DB.ref('groups/'+gid).get();
          }).then(function(snap){
            if (!snap || !snap.exists()){
              throw new Error('群組節點尚未可讀（可能被安全規則或網路延遲影響）');
            }
            loadLists();
            closeDlg();
          }).catch(function(err){
            ok.disabled = false; ok.textContent = '建立';
            alert('建立群組失敗：' + (err && err.message ? err.message : err));
          });
        };

      });
      return;
    }


    // 接受
    var btnAcc = t.closest ? t.closest('[data-accept]') : null;
    if (btnAcc){
      var other = btnAcc.getAttribute('data-accept') || '';
      if (!other) return;

      // 互加好友
      DB.ref('characters/'+me.username+'/friends/'+other).set(true);
      DB.ref('characters/'+other+'/friends/'+me.username).set(true);

      // 將雙方的邀請收件匣/寄件匣全部清乾淨（處理雙向同時發過邀請的狀況）
      DB.ref('characters/'+me.username+'/friendInbox/'+other).remove();
      DB.ref('characters/'+other+'/friendOutbox/'+me.username).remove();
      DB.ref('characters/'+me.username+'/friendOutbox/'+other).remove();
      DB.ref('characters/'+other+'/friendInbox/'+me.username).remove();

      loadLists();
      return;
    }


    // 拒絕
    var btnRej = t.closest ? t.closest('[data-reject]') : null;
    if (btnRej){
      var other2 = btnRej.getAttribute('data-reject') || '';
      if (!other2) return;
      DB.ref('characters/'+me.username+'/friendInbox/'+other2).remove();
      DB.ref('characters/'+other2+'/friendOutbox/'+me.username).remove();
      loadLists();
      return;
    }

    // 解除好友（新增確認視窗，顯示對方暱稱而非帳號；並清除雙方對話與已讀）
    var btnUn = t.closest ? t.closest('[data-unfriend]') : null;
    if (btnUn){
      var other3 = btnUn.getAttribute('data-unfriend') || '';
      if (!other3) return;

      // 先抓對方角色暱稱（無論任何情況都不要把帳號顯示給用戶）
      DB.ref('characters/'+other3).get().then(function(snap){
        var data = (snap && snap.exists()) ? snap.val() : {};
        var nick = data.nickname || data.name || '這位用戶';
        var ok = window.confirm('你確定要解除與「' + nick + '」的好友關係嗎？');
        if (!ok) return;

        // 1) 解除好友關係
        DB.ref('characters/'+me.username+'/friends/'+other3).remove();
        DB.ref('characters/'+other3+'/friends/'+me.username).remove();

        // 2) 刪除雙方對話紀錄（以固定 pair key）
        var chatKey = pairKey(me.username, other3);
        DB.ref('chats/'+chatKey).remove();

        // 3) 清除雙方已讀紀錄（避免之後紅點又出現）
        DB.ref('characters/'+me.username+'/chatReads/'+other3).remove();
        DB.ref('characters/'+other3+'/chatReads/'+me.username).remove();

        loadLists();
      });
      return;
    }

        // === 退出群組（紅色按鈕）===
    var btnLeaveGroup = t.closest ? t.closest('[data-leave-group]') : null;
    if (btnLeaveGroup){
      var gid = btnLeaveGroup.getAttribute('data-leave-group') || '';
      if (!gid) return;

      // 先抓群名
      DB.ref('groups/'+gid).get().then(function(snap){
        var gdata = (snap && snap.exists()) ? snap.val() : {};
        var gname = (gdata && gdata.name) ? String(gdata.name) : '這個群組';

        // 暗色小視窗：是 / 否
        var overlay = document.createElement('div');
        overlay.setAttribute('role','dialog');
        overlay.setAttribute('aria-modal','true');
        overlay.style.position = 'fixed';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.background = 'rgba(0,0,0,.45)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';

        var panel = document.createElement('div');
        panel.style.width = 'min(92vw, 420px)';
        panel.style.background = '#0b1020';
        panel.style.border = '1px solid rgba(255,255,255,.15)';
        panel.style.borderRadius = '12px';
        panel.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
        panel.style.color = '#eaf2ff';
        panel.style.padding = '16px';
        panel.style.display = 'grid';
        panel.style.gap = '12px';

        var title = document.createElement('div');
        title.textContent = '是否退出群組「'+ gname +'」？';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '16px';

        var buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.gap = '8px';
        buttons.style.justifyContent = 'flex-end';

        var btnNo = document.createElement('button');
        btnNo.className = 'opx';
        btnNo.textContent = '否';

        var btnYes = document.createElement('button');
        btnYes.className = 'opx';
        btnYes.textContent = '是';
        btnYes.style.background = '#b91c1c';
        btnYes.style.color = '#fff';
        btnYes.style.border = '1px solid rgba(255,255,255,.2)';
        btnYes.style.borderRadius = '8px';
        btnYes.style.padding = '6px 12px';

        buttons.appendChild(btnNo);
        buttons.appendChild(btnYes);
        panel.appendChild(title);
        panel.appendChild(buttons);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function closeDlg(){
          if (overlay && overlay.parentNode){ overlay.parentNode.removeChild(overlay); }
        }
        btnNo.onclick = function(){ closeDlg(); };
        overlay.onclick = function(ev2){
          if (ev2.target === overlay){ closeDlg(); }
        };

        btnYes.onclick = function(){
          var updates = {};
          updates['groupMembers/'+gid+'/'+me.username] = null;
          updates['characters/'+me.username+'/groups/'+gid] = null;

          DB.ref().update(updates).then(function(){
            // 若當前正開著這個群聊，一併關閉回列表
            try{
              if (window.__activeGroupId === gid){
                var back = qs('#btnBackFriends');
                if (back && back.click){ back.click(); }
              }
            }catch(_){}
            loadLists();
            closeDlg();
          }).catch(function(err){
            alert('退出群組失敗：' + (err && err.message ? err.message : err));
          });
        };
      });

      return;
    }

    // === 進入群聊 ===
    var btnChatGroup = t.closest ? t.closest('[data-chat-group]') : null;
    if (btnChatGroup){
      var gid = btnChatGroup.getAttribute('data-chat-group') || '';
      if (!gid) return;

      var m = ensureModal();
      // 讓群聊視圖佔滿整個好友面板：隱藏 tabs 與群組清單
      var sheet = m.querySelector('.sheet');
      var tabs  = m.querySelector('.bag-tabs');
      var groupsBox = qs('#groupsList');

      if (tabs){ tabs.style.display = 'none'; }
      if (groupsBox){ groupsBox.style.display = 'none'; }

      qs('#friendsList').style.display = 'none';
      qs('#friendsInbox').style.display = 'none';
      qs('#chatBox').style.display = '';

      // 放大容器（只調整寬高，不動定位）
      if (sheet){
        sheet.style.width = 'min(96vw, 960px)';
        sheet.style.maxHeight = '98svh';
      }
      // 放大聊天視窗高度（預留標題與控制列）
      try{
        var chatLogEl = qs('#chatLog');
        if (chatLogEl){
          chatLogEl.style.height = 'calc(98svh - 180px)';
        }
      }catch(_){}

      // 標記目前群組
      window.__activeGroupId = gid;
      window.__activeChatPeer = null; // 清空單聊標記

      var chatBox = qs('#chatBox');
      var logBox = qs('#chatLog');
      logBox.innerHTML = '';

      // ====== 動態建立群組標題與「成員面板」控制 ======
      try{
        chatBox.style.position = 'relative';

        // Header（顯示群名）
        var hdr = qs('#groupHeader');
        if (!hdr){
          hdr = document.createElement('div');
          hdr.id = 'groupHeader';
          hdr.style.display = 'flex';
          hdr.style.alignItems = 'center';
          hdr.style.justifyContent = 'space-between';
          hdr.style.gap = '8px';
          hdr.style.padding = '6px 8px';
          hdr.style.border = '1px solid rgba(255,255,255,.12)';
          hdr.style.borderRadius = '8px';
          hdr.style.background = 'rgba(255,255,255,.05)';
          chatBox.insertBefore(hdr, chatBox.firstChild);
        }

        var titleSpan = hdr.querySelector ? hdr.querySelector('.gh-title') : null;
        if (!titleSpan){
          titleSpan = document.createElement('div');
          titleSpan.className = 'gh-title';
          titleSpan.style.fontWeight = '600';
          titleSpan.style.letterSpacing = '.5px';
          hdr.appendChild(titleSpan);
        }

        // 右側控制：成員按鈕 + 人數（新增：加入好友）
        var ctrl = hdr.querySelector ? hdr.querySelector('.gh-ctrl') : null;
        if (!ctrl){
          ctrl = document.createElement('div');
          ctrl.className = 'gh-ctrl';
          ctrl.style.display = 'flex';
          ctrl.style.alignItems = 'center';
          ctrl.style.gap = '6px';

          // 新增：加入好友按鈕（左側）
          var btnInvite = document.createElement('button');
          btnInvite.id = 'inviteFriends';
          btnInvite.className = 'opx';
          btnInvite.textContent = '加入好友';
          btnInvite.style.background = '#0ea5e9';
          btnInvite.style.color = '#fff';
          btnInvite.style.border = '1px solid rgba(255,255,255,.2)';
          btnInvite.style.borderRadius = '8px';
          btnInvite.style.padding = '6px 10px';

          var btn = document.createElement('button');
          btn.id = 'toggleMembers';
          btn.className = 'opx';
          btn.textContent = '成員';
          btn.style.background = '#1e3a8a';
          btn.style.color = '#fff';
          btn.style.border = '1px solid rgba(255,255,255,.2)';
          btn.style.borderRadius = '8px';
          btn.style.padding = '6px 10px';

          var count = document.createElement('span');
          count.id = 'memberCount';
          count.style.opacity = '.85';
          count.style.marginLeft = '2px';
          count.textContent = '（0）';

          ctrl.appendChild(btnInvite);
          ctrl.appendChild(btn);
          ctrl.appendChild(count);
          hdr.appendChild(ctrl);
        }


        // 成員面板容器（固定從右側滑出、寬度約半螢幕再小一點、可滾動）
        var panel = qs('#groupMembersPanel');
        if (!panel){
          panel = document.createElement('div');
          panel.id = 'groupMembersPanel';
          panel.style.position = 'absolute';
          panel.style.right = '8px';
          panel.style.top = '48px';
          panel.style.width = 'min(45vw, 420px)';   // 約半螢幕再小一點
          panel.style.maxHeight = '60vh';
          panel.style.overflowY = 'auto';
          panel.style.overflowX = 'visible';
          panel.style.background = '#0b1020';
          panel.style.border = '1px solid rgba(255,255,255,.15)';
          panel.style.borderRadius = '10px';
          panel.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
          panel.style.padding = '10px 10px 10px 20px';
          panel.style.display = 'none';
          panel.style.transform = 'translateX(0)';
          panel.style.textAlign = 'center';
          chatBox.appendChild(panel);


          // 左側小叉叉關閉
          var closeX = document.createElement('div');
          closeX.textContent = '✕';
          closeX.title = '關閉';
          closeX.style.position = 'absolute';
          closeX.style.left = '-12px';
          closeX.style.top = '8px';
          closeX.style.width = '20px';
          closeX.style.height = '20px';
          closeX.style.lineHeight = '20px';
          closeX.style.textAlign = 'center';
          closeX.style.borderRadius = '50%';
          closeX.style.background = '#0b1020';
          closeX.style.border = '1px solid rgba(255,255,255,.35)';
          closeX.style.color = '#fff';
          closeX.style.cursor = 'pointer';
          closeX.style.userSelect = 'none';
          panel.appendChild(closeX);
          closeX.onclick = function(){ panel.style.display = 'none'; };
        }

        // 顯示群名 + 成員列表（角色名稱）並更新人數
        DB.ref('groups/'+gid).get().then(function(gs){
          var gdata = (gs && gs.exists()) ? gs.val() : {};
          var gname = (gdata && gdata.name) ? String(gdata.name) : gid;
          titleSpan.textContent = gname;

          DB.ref('groupMembers/'+gid).get().then(function(msnap){
            var mem = (msnap && msnap.exists()) ? msnap.val() : {};
            var ids = [];
            for (var u in mem){ if (mem.hasOwnProperty(u) && mem[u]) ids.push(u); }
            var countSpan = qs('#memberCount');
            if (countSpan){ countSpan.textContent = '（'+ ids.length +'）'; }

            if (!ids.length){
              panel.innerHTML = '<div style="opacity:.8; text-align:center;">目前沒有成員</div>';
              // 重新附加小叉叉（因為上行直接覆蓋了 innerHTML）
              var closeX2 = document.createElement('div');
              closeX2.textContent = '✕';
              closeX2.title = '關閉';
              closeX2.style.position = 'absolute';
              closeX2.style.left = '-12px';
              closeX2.style.top = '8px';
              closeX2.style.width = '20px';
              closeX2.style.height = '20px';
              closeX2.style.lineHeight = '20px';
              closeX2.style.textAlign = 'center';
              closeX2.style.borderRadius = '50%';
              closeX2.style.background = '#0b1020';
              closeX2.style.border = '1px solid rgba(255,255,255,.35)';
              closeX2.style.color = '#fff';
              closeX2.style.cursor = 'pointer';
              closeX2.style.userSelect = 'none';
              panel.appendChild(closeX2);
              closeX2.onclick = function(){ panel.style.display = 'none'; };
              return;
            }

            var pending = ids.length;
            var rows = [];
            function fallbackAvatar(){
              try{
                if (window.Auth && Auth.defaultAvatar){
                  var a = Auth.defaultAvatar();
                  if (a) return a;
                }
              }catch(_){}
              return 'https://via.placeholder.com/28';
            }
            function pushRow(u, data){
              var nickname = (data && (data.nickname || data.name)) || u;
              var avatar   = (data && data.avatar && String(data.avatar).trim())
                           || (data && data.avatarUrl && String(data.avatarUrl).trim())
                           || fallbackAvatar();
              rows.push({ nickname: nickname, avatar: avatar });
              pending--;
              if (pending === 0){ finalizeMembers(); }
            }
            for (var i=0;i<ids.length;i++){
              (function(idx){
                var u = ids[idx];
                DB.ref('characters/'+u).get().then(function(snap){
                  var d = (snap && snap.exists()) ? snap.val() : {};
                  pushRow(u, d);
                }).catch(function(_){ pushRow(u, {}); });
              })(i);
            }

            function finalizeMembers(){
              var countSpan2 = qs('#memberCount');
              if (countSpan2){ countSpan2.textContent = '（'+ rows.length +'）'; }
              var html = '<div style="font-weight:600; margin-bottom:8px; text-align:center;">成員（'+ rows.length +'）</div>';
              for (var j=0;j<rows.length;j++){
                var r = rows[j];
                html += ''
                  + '<div style="display:flex; align-items:center; justify-content:center; gap:8px; margin:6px 0;">'
                  +   '<img src="'+ r.avatar +'" alt="" style="width:26px; height:26px; border-radius:50%; object-fit:cover;">'
                  +   '<div>'+ r.nickname +'</div>'
                  + '</div>';
              }
              panel.innerHTML = html;

              // 重新附加小叉叉（因為 innerHTML 被覆蓋）
              var closeX3 = document.createElement('div');
              closeX3.textContent = '✕';
              closeX3.title = '關閉';
              closeX3.style.position = 'absolute';
              closeX3.style.left = '-12px';
              closeX3.style.top = '8px';
              closeX3.style.width = '20px';
              closeX3.style.height = '20px';
              closeX3.style.lineHeight = '20px';
              closeX3.style.textAlign = 'center';
              closeX3.style.borderRadius = '50%';
              closeX3.style.background = '#0b1020';
              closeX3.style.border = '1px solid rgba(255,255,255,.35)';
              closeX3.style.color = '#fff';
              closeX3.style.cursor = 'pointer';
              closeX3.style.userSelect = 'none';
              panel.appendChild(closeX3);
              closeX3.onclick = function(){ panel.style.display = 'none'; };
            }
          });
        });

        // 綁定按鈕：顯示 / 隱藏（固定從右側滑出）
        var btnToggle = qs('#toggleMembers');
        if (btnToggle){
          btnToggle.onclick = function(){
            if (!panel) return;
            if (panel.style.display === 'none'){
              panel.style.display = 'block';
              panel.style.transform = 'translateX(20px)';
              setTimeout(function(){
                panel.style.transform = 'translateX(0)';
                panel.style.transition = 'transform .18s ease-out';
              }, 0);
            }else{
              panel.style.display = 'none';
            }
          };
        }

        // 新增：加入好友（邀請尚未在群組內的好友，清單只顯示角色名稱不顯示帳號）
        var btnInvite = qs('#inviteFriends');
        if (btnInvite){
          btnInvite.onclick = function(){
            // 讀我自己的好友清單
            DB.ref('characters/'+me.username+'/friends').get().then(function(fsnap){
              var fval = (fsnap && fsnap.exists()) ? fsnap.val() : {};
              var myFriends = [];
              for (var k in fval){ if (fval.hasOwnProperty(k) && fval[k]) myFriends.push(k); }

              // 讀取目前群組成員
              return DB.ref('groupMembers/'+gid).get().then(function(msnap){
                var mval = (msnap && msnap.exists()) ? msnap.val() : {};
                var memberSet = {};
                for (var u in mval){ if (mval.hasOwnProperty(u) && mval[u]) memberSet[u] = true; }

                // 過濾出「尚未在群組內」的好友
                var candidates = [];
                for (var i=0;i<myFriends.length;i++){
                  var uid = myFriends[i];
                  if (!memberSet[uid]) candidates.push(uid);
                }

                // 建立選擇面板
                var overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.left = '0'; overlay.style.top = '0';
                overlay.style.right = '0'; overlay.style.bottom = '0';
                overlay.style.background = 'rgba(0,0,0,.45)';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.zIndex = '9999';

                var panel2 = document.createElement('div');
                panel2.style.width = 'min(92vw, 420px)';
                panel2.style.background = '#0b1020';
                panel2.style.border = '1px solid rgba(255,255,255,.15)';
                panel2.style.borderRadius = '12px';
                panel2.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
                panel2.style.color = '#eaf2ff';
                panel2.style.padding = '16px';
                panel2.style.display = 'grid';
                panel2.style.gap = '10px';

                var title2 = document.createElement('div');
                title2.textContent = '邀請好友加入群組';
                title2.style.fontWeight = 'bold';

                var listBox2 = document.createElement('div');
                listBox2.style.maxHeight = '40vh';
                listBox2.style.overflow = 'auto';
                listBox2.style.border = '1px solid rgba(255,255,255,.12)';
                listBox2.style.borderRadius = '8px';
                listBox2.style.padding = '8px';
                listBox2.style.background = 'rgba(255,255,255,.04)';

                if (!candidates.length){
                  listBox2.innerHTML = '<div style="opacity:.8;">沒有可邀請的好友（所有好友都在群組內了）。</div>';
                } else {
                  for (var j=0;j<candidates.length;j++){
                    (function(idx){
                      var u3 = candidates[idx];
                      var row = document.createElement('label');
                      row.style.display = 'flex';
                      row.style.alignItems = 'center';
                      row.style.gap = '8px';
                      row.style.margin = '4px 0';

                      var cb = document.createElement('input');
                      cb.type = 'checkbox';
                      cb.value = u3;

                      var span = document.createElement('span');
                      span.textContent = '載入中…';

                      row.appendChild(cb);
                      row.appendChild(span);
                      listBox2.appendChild(row);

                      // 顯示角色名稱（nickname > name），不顯示帳號
                      DB.ref('characters/'+u3).get().then(function(csnap){
                        var cdata = (csnap && csnap.exists()) ? csnap.val() : {};
                        var nickname = cdata && cdata.nickname ? String(cdata.nickname) : '';
                        var cname = cdata && cdata.name ? String(cdata.name) : '';
                        var showName = nickname || cname || '這位用戶';
                        span.textContent = showName;
                      }).catch(function(_){
                        span.textContent = '這位用戶';
                      });
                    })(j);
                  }
                }

                var btns2 = document.createElement('div');
                btns2.style.display = 'flex';
                btns2.style.justifyContent = 'flex-end';
                btns2.style.gap = '8px';

                var cancel2 = document.createElement('button');
                cancel2.className = 'opx';
                cancel2.textContent = '取消';

                var ok2 = document.createElement('button');
                ok2.className = 'opx primary';
                ok2.textContent = '邀請';

                btns2.appendChild(cancel2);
                btns2.appendChild(ok2);

                panel2.appendChild(title2);
                panel2.appendChild(listBox2);
                panel2.appendChild(btns2);
                overlay.appendChild(panel2);
                document.body.appendChild(overlay);

                function closeDlg2(){
                  if (overlay && overlay.parentNode){ overlay.parentNode.removeChild(overlay); }
                }
                cancel2.onclick = function(){ closeDlg2(); };
                overlay.onclick = function(evx){
                  if (evx.target === overlay){ closeDlg2(); }
                };

                ok2.onclick = function(){
                  var picks2 = [];
                  var cbs2 = listBox2.querySelectorAll('input[type=checkbox]');
                  for (var z=0; z<cbs2.length; z++){ if (cbs2[z].checked){ picks2.push(cbs2[z].value); } }
                  if (!picks2.length){ closeDlg2(); return; }

                  ok2.disabled = true; ok2.textContent = '邀請中…';

                  var updates2 = {};
                  var now2 = Date.now();
                  for (var p=0; p<picks2.length; p++){
                    var u4 = picks2[p];
                    updates2['groupMembers/'+gid+'/'+u4] = true;
                    updates2['characters/'+u4+'/groups/'+gid] = true;
                  }

                  DB.ref().update(updates2).then(function(){
                    // 更新成員數顯示與清單
                    try{
                      var countSpan3 = qs('#memberCount');
                      if (countSpan3){
                        var curTxt = countSpan3.textContent || '';
                        var m = curTxt.match(/（(\d+)）/);
                        var n = m ? parseInt(m[1]||'0',10) : 0;
                        n = n + picks2.length;
                        countSpan3.textContent = '（'+ n +'）';
                      }
                      // 若面板已開，重新載入一次成員面板
                      if (panel && panel.style.display !== 'none'){
                        panel.style.display = 'none';
                        setTimeout(function(){
                          if (qs('#toggleMembers') && qs('#toggleMembers').click){ qs('#toggleMembers').click(); }
                        }, 0);
                      }
                    }catch(_){}
                    loadLists();
                    closeDlg2();
                  }).catch(function(err){
                    ok2.disabled = false; ok2.textContent = '邀請';
                    alert('邀請失敗：' + (err && err.message ? err.message : err));
                  });
                };
              });
            });
          };
        }
      }catch(_){}


      // 我的頭像
      var myAvatar = '';
      function fallbackAvatar(){
        try{
          if (window.Auth && Auth.defaultAvatar){
            var a = Auth.defaultAvatar();
            if (a) return a;
          }
        }catch(_){}
        return 'https://via.placeholder.com/28';
      }
      DB.ref('characters/'+me.username).get().then(function(msnap){
        var mdata = (msnap && msnap.exists()) ? msnap.val() : {};
        myAvatar = (mdata.avatar && String(mdata.avatar).trim())
                || (mdata.avatarUrl && String(mdata.avatarUrl).trim())
                || fallbackAvatar();
      });

      function renderGroupLog(val){
        var html = '';
        var arr = [];
        for (var k in val){ if (val.hasOwnProperty(k)) arr.push({ id:k, msg: val[k]||{} }); }
        arr.sort(function(a,b){
          var ta = Number(a.msg.ts || 0); var tb = Number(b.msg.ts || 0);
          return ta - tb;
        });

        function dayKeyTW(ts){
          return new Date(ts).toLocaleDateString('zh-TW', { timeZone:'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit' });
        }
        function dayLabelTW(ts){
          return new Date(ts).toLocaleDateString('zh-TW', { timeZone:'Asia/Taipei', month:'long', day:'numeric' });
        }
        function dateTimeLabelTW(ts){
          return new Date(ts).toLocaleString('zh-TW', { timeZone:'Asia/Taipei', month:'long', day:'numeric', hour12:false, hour:'2-digit', minute:'2-digit' });
        }

        var prevDay = '';
        var prevTs  = 0;

        for (var i=0;i<arr.length;i++){
          var id = arr[i].id;
          var mmsg = arr[i].msg || {};
          var isMe = (mmsg.from === me.username);
          var ts   = Number(mmsg.ts || 0);
          var nick = mmsg.fromNickname || mmsg.from || '';

          var curDay = dayKeyTW(ts);
          if (curDay !== prevDay){
            html += '<div class="sep" style="text-align:center; opacity:.8; font-size:11px; margin:8px 0;">' + dayLabelTW(ts) + '</div>';
            prevDay = curDay;
            prevTs = 0;
          }
          if (prevTs && (ts - prevTs) > 600000){
            html += '<div class="sep" style="text-align:center; opacity:.65; font-size:10px; margin:6px 0;">' + dateTimeLabelTW(ts) + '</div>';
          }

          var av = isMe ? (myAvatar || fallbackAvatar()) : (mmsg.fromAvatar || fallbackAvatar());

          if (!isMe){
            html += ''
              + '<div class="item msg" data-msg-id="'+ id +'" data-from="'+ (mmsg.from||'') +'" data-ts="'+ ts +'" style="display:flex; justify-content:flex-start; align-items:flex-start; gap:8px; margin:6px 0;">'
              +   '<img src="'+ av +'" alt="avatar" style="width:35px; height:35px; border-radius:50%; object-fit:cover; flex:0 0 25px;">'
              +   '<div style="max-width:72%;">'
              +     '<div style="opacity:.8; font-size:11px; margin:0 0 2px 4px;">'+ nick +'</div>'
              +     '<div class="msg-bubble" style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#eaf2ff; border-radius:12px; padding:6px 10px; line-height:1.5; word-break:break-word;">'
              +       (mmsg.text || '') 
              +     '</div>'
              +   '</div>'
              + '</div>';
          }else{
            html += ''
              + '<div class="item msg" data-msg-id="'+ id +'" data-from="'+ (mmsg.from||'') +'" data-ts="'+ ts +'" style="display:flex; justify-content:flex-end; align-items:flex-end; gap:8px; margin:6px 0;">'
              +   '<div class="msg-bubble" style="max-width:72%; background:linear-gradient(135deg, var(--accent,#8b5cf6), var(--accent2,#22d3ee)); color:#fff; border:1px solid rgba(255,255,255,.18); border-radius:12px; padding:6px 10px; line-height:1.5; word-break:break-word;">'
              +     (mmsg.text || '') 
              +   '</div>'
              +   '<img src="'+ av +'" alt="avatar" style="width:35px; height:35px; border-radius:50%; object-fit:cover; flex:0 0 25px;">'
              + '</div>';
          }

          prevTs = ts;
        }

        logBox.innerHTML = html;
        logBox.scrollTop = logBox.scrollHeight;
      }

      // 監聽群組訊息
      DB.ref('groupChats/'+gid+'/messages').off();
      DB.ref('groupChats/'+gid+'/messages').on('value', function(snap){
        var val = (snap && snap.exists()) ? (snap.val() || {}) : {};
        var items = [];
        for (var k in val){
          if (!val.hasOwnProperty(k)) continue;
          var msg = val[k] || {};
          var ts  = Number(msg.ts || 0);
          items.push({ id:k, ts:ts, msg:msg });
        }
        items.sort(function(a,b){ return a.ts - b.ts; });

        var over = items.length - 300;
        var viewObj = {};
        if (over > 0){
          var keep = items.slice(items.length - 300);
          for (var i=0;i<keep.length;i++){ viewObj[ keep[i].id ] = keep[i].msg; }
          renderGroupLog(viewObj);
          for (var j=0;j<over;j++){
            var delId = items[j].id;
            DB.ref('groupChats/'+gid+'/messages/'+delId).remove();
          }
        }else{
          var obj = {};
          for (var z=0; z<items.length; z++){ obj[items[z].id] = items[z].msg; }
          renderGroupLog(obj);
        }

        try{
          var latestTs = items.length ? Number(items[items.length - 1].ts || 0) : 0;
          DB.ref('groupReads/'+me.username+'/'+gid).set(latestTs);
        }catch(_){}
      });

      // 送出（覆蓋為群組送出）
      qs('#btnSendFriend').onclick = function(){
        var inp = qs('#chatInputFriend');
        var text = (inp && inp.value) ? String(inp.value).trim() : '';
        if (!text) return;
        var ref = DB.ref('groupChats/'+gid+'/messages').push();

        DB.ref('characters/'+me.username).get().then(function(msnap){
          var mdata = (msnap && msnap.exists()) ? msnap.val() : {};
          var myNick = mdata.nickname || mdata.name || me.username;
          var myAv   = (mdata.avatar && String(mdata.avatar).trim())
                     || (mdata.avatarUrl && String(mdata.avatarUrl).trim())
                     || 'https://via.placeholder.com/28';
          ref.set({
            from: me.username,
            text: text,
            ts: Date.now(),
            fromNickname: myNick,
            fromAvatar: myAv
          });
        });

        inp.value = '';
      };

      // 返回：還原清單與 tabs/群組區塊，同時關閉面板
      qs('#btnBackFriends').onclick = function(){
        var panel = qs('#groupMembersPanel');
        if (panel){ panel.style.display = 'none'; }
        qs('#chatBox').style.display = 'none';
        if (tabs){ tabs.style.display = 'flex'; }
        if (groupsBox){ groupsBox.style.display = ''; }
        qs('#friendsList').style.display = '';
        qs('#friendsInbox').style.display = 'none';
        if (sheet){
          sheet.style.width = 'min(96vw, 420px)';
          sheet.style.maxHeight = '98svh';
        }
        window.__activeGroupId = null;
      };

      return;
    }


    // === 單聊：進入對話 ===
    var btnChat = t.closest ? t.closest('[data-chat-with]') : null;
    if (btnChat){
      // （以下為你原有的私聊流程，未改動）
      var peer = btnChat.getAttribute('data-chat-with') || '';
      if (!peer) return;
      var m = ensureModal();
      qs('#friendsList').style.display = 'none';
      qs('#friendsInbox').style.display = 'none';
      qs('#chatBox').style.display = '';

      window.__activeChatPeer = peer;
      window.__activeGroupId = null;

      var logBox = qs('#chatLog');
      logBox.innerHTML = '';
      var key = pairKey(me.username, peer);

      try{
        var mark = qs('#unread_'+ peer);
        if (mark){ mark.style.display = 'none'; }
      }catch(_){}

      (function(){
        var hInput = qs('#chatHeightPx');
        var hBtn   = qs('#applyChatHeight');
        var hNow   = qs('#chatHeightNow');
        if (hInput && hBtn){
          var cur = 460;
          try{
            var raw = (qs('#chatLog').style.height || '').replace('px','');
            cur = parseInt(raw || '460', 10);
            if (isNaN(cur) || cur <= 0) cur = 460;
          }catch(_){ cur = 460; }
          hInput.value = cur;
          if (hNow){ hNow.innerHTML = '目前：<b>'+ cur +'</b> px'; }
          hInput.oninput = function(){
            var v = parseInt(hInput.value||'0',10);
            if (hNow){ hNow.innerHTML = '目前：<b>'+ v +'</b> px'; }
          };
          hBtn.onclick = function(){
            var v = parseInt(hInput.value||'0',10);
            if (!isNaN(v) && v >= 200 && v <= 1200){
              qs('#chatLog').style.height = v + 'px';
              if (hNow){ hNow.innerHTML = '目前：<b>'+ v +'</b> px'; }
              var lb = qs('#chatLog'); if (lb){ lb.scrollTop = lb.scrollHeight; }
            }
          };
        }
      })();

      var peerNick = '';
      var peerAvatar = '';
      var myAvatar = '';
      var lastLog = {};

      function fallbackAvatar(){
        try{
          if (window.Auth && Auth.defaultAvatar){
            var a = Auth.defaultAvatar();
            if (a) return a;
          }
        }catch(_){}
        return 'https://via.placeholder.com/28';
      }

      DB.ref('characters/'+me.username).get().then(function(msnap){
        var mdata = (msnap && msnap.exists()) ? msnap.val() : {};
        myAvatar = (mdata.avatar && String(mdata.avatar).trim())
                || (mdata.avatarUrl && String(mdata.avatarUrl).trim())
                || fallbackAvatar();
      });

      DB.ref('characters/'+peer).get().then(function(snap){
        var data = (snap && snap.exists()) ? snap.val() : {};
        peerNick = data.nickname || data.name || peer;
        peerAvatar = (data.avatar && String(data.avatar).trim())
                  || (data.avatarUrl && String(data.avatarUrl).trim())
                  || fallbackAvatar();
        renderLog(lastLog);
      });

      function renderLog(val){
        var html = '';
        var arr = [];
        for (var k in val){
          if (!val.hasOwnProperty(k)) continue;
          arr.push({ id:k, msg: val[k] || {} });
        }
        arr.sort(function(a,b){
          var ta = Number(a.msg.ts || 0); var tb = Number(b.msg.ts || 0);
          return ta - tb;
        });

        function dayKeyTW(ts){
          return new Date(ts).toLocaleDateString('zh-TW', { timeZone:'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit' });
        }
        function dayLabelTW(ts){
          return new Date(ts).toLocaleDateString('zh-TW', { timeZone:'Asia/Taipei', month:'long', day:'numeric' });
        }
        function dateTimeLabelTW(ts){
          return new Date(ts).toLocaleString('zh-TW', { timeZone:'Asia/Taipei', month:'long', day:'numeric', hour12:false, hour:'2-digit', minute:'2-digit' });
        }

        var prevDay = '';
        var prevTs  = 0;

        for (var i=0; i<arr.length; i++){
          var id   = arr[i].id;
          var mmsg = arr[i].msg || {};
          var isMe = (mmsg.from === me.username);
          var ts   = Number(mmsg.ts || 0);

        var curDay = dayKeyTW(ts);
        if (curDay !== prevDay){
          html += '<div class="sep" style="text-align:center; opacity:.8; font-size:11px; margin:8px 0;">' + dayLabelTW(ts) + '</div>';
          prevDay = curDay;
          prevTs = 0;
        }
        if (prevTs && (ts - prevTs) > 600000){
          html += '<div class="sep" style="text-align:center; opacity:.65; font-size:10px; margin:6px 0;">' + dateTimeLabelTW(ts) + '</div>';
        }

        var av = isMe
          ? (myAvatar || fallbackAvatar())
          : (mmsg.fromAvatar || peerAvatar || fallbackAvatar());

        if (!isMe){
          html += ''
            + '<div class="item msg" data-msg-id="'+ id +'" data-from="'+ (mmsg.from||'') +'" data-ts="'+ ts +'" style="display:flex; justify-content:flex-start; align-items:flex-end; gap:8px; margin:6px 0;">'
            +   '<img src="'+ av +'" alt="avatar" style="width:35px; height:35px; border-radius:50%; object-fit:cover; flex:0 0 25px;">'
            +   '<div class="msg-bubble" style="max-width:72%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#eaf2ff; border-radius:12px; padding:6px 10px; line-height:1.5; word-break:break-word;">'
            +     (mmsg.text || '') 
            +   '</div>'
            + '</div>';
        } else {
          html += ''
            + '<div class="item msg" data-msg-id="'+ id +'" data-from="'+ (mmsg.from||'') +'" data-ts="'+ ts +'" style="display:flex; justify-content:flex-end; align-items:flex-end; gap:8px; margin:6px 0;">'
            +   '<div class="msg-bubble" style="max-width:72%; background:linear-gradient(135deg, var(--accent,#8b5cf6), var(--accent2,#22d3ee)); color:#fff; border:1px solid rgba(255,255,255,.18); border-radius:12px; padding:6px 10px; line-height:1.5; word-break:break-word;">'
            +     (mmsg.text || '') 
            +   '</div>'
            +   '<img src="'+ av +'" alt="avatar" style="width:35px; height:35px; border-radius:50%; object-fit:cover; flex:0 0 25px;">'
            + '</div>';
        }

        prevTs = ts;
      }

      logBox.innerHTML = html;
      logBox.scrollTop = logBox.scrollHeight;
    }

    DB.ref('chats/'+key+'/messages').off();
    DB.ref('chats/'+key+'/messages').on('value', function(snap){
      var val = (snap && snap.exists()) ? (snap.val() || {}) : {};
      var items = [];
      for (var k in val){
        if (!val.hasOwnProperty(k)) continue;
        var msg = val[k] || {};
        var ts  = Number(msg.ts || 0);
        items.push({ id:k, ts:ts, msg:msg });
      }
      items.sort(function(a,b){ return a.ts - b.ts; });

      var over = items.length - 300;
      var viewObj = {};
      if (over > 0){
        var keep = items.slice(items.length - 300);
        for (var i=0;i<keep.length;i++){ viewObj[ keep[i].id ] = keep[i].msg; }
        lastLog = viewObj;
        renderLog(lastLog);

        var tip = qs('#chatRetentionTip');
        if (tip){
          tip.textContent = '僅保留最近 300 則訊息（較舊訊息已自動清理）';
          setTimeout(function(){ tip.textContent = '僅保留最近 300 則訊息'; }, 3000);
        }

        for (var j=0; j<over; j++){
          var delId = items[j].id;
          DB.ref('chats/'+key+'/messages/'+delId).remove();
        }
      }else{
        lastLog = val;
        renderLog(lastLog);
      }

      try{
        var latestTs = items.length ? Number(items[items.length - 1].ts || 0) : 0;
        DB.ref('characters/'+me.username+'/chatReads/'+peer).set(latestTs);
        var mark2 = qs('#unread_'+ peer);
        if (mark2){ mark2.style.display = 'none'; }
      }catch(_){}
    });

    logBox.onclick = function(ev){
      var target = ev.target;
      var row = target.closest ? target.closest('.msg') : null;
      if (!row) return;

      var from = row.getAttribute('data-from') || '';
      var mid  = row.getAttribute('data-msg-id') || '';
      var ts   = Number(row.getAttribute('data-ts') || '0');

      if (!mid) return;
      if (from !== me.username) return;

      var now = Date.now();
      if (now - ts > 300000) return;

      var overlay = document.createElement('div');
      overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-modal','true');
      overlay.style.position = 'fixed';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.background = 'rgba(0,0,0,.45)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '9999';

      var panel = document.createElement('div');
      panel.style.width = 'min(92vw, 360px)';
      panel.style.background = '#0b1020';
      panel.style.border = '1px solid rgba(255,255,255,.15)';
      panel.style.borderRadius = '12px';
      panel.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
      panel.style.color = '#eaf2ff';
      panel.style.padding = '16px';
      panel.style.display = 'grid';
      panel.style.gap = '12px';

      var title = document.createElement('div');
      title.textContent = '是否收回這則訊息？';
      title.style.fontWeight = 'bold';
      title.style.fontSize = '16px';

      var buttons = document.createElement('div');
      buttons.style.display = 'flex';
      buttons.style.gap = '8px';
      buttons.style.justifyContent = 'flex-end';

      var btnNo = document.createElement('button');
      btnNo.className = 'opx';
      btnNo.textContent = '否';
      btnNo.style.background = '#1e3a8a';
      btnNo.style.color = '#fff';
      btnNo.style.border = '1px solid rgba(255,255,255,.2)';
      btnNo.style.borderRadius = '8px';
      btnNo.style.padding = '6px 12px';

      var btnYes = document.createElement('button');
      btnYes.className = 'opx';
      btnYes.textContent = '是';
      btnYes.style.background = '#b91c1c';
      btnYes.style.color = '#fff';
      btnYes.style.border = '1px solid rgba(255,255,255,.2)';
      btnYes.style.borderRadius = '8px';
      btnYes.style.padding = '6px 12px';

      buttons.appendChild(btnNo);
      buttons.appendChild(btnYes);
      panel.appendChild(title);
      panel.appendChild(buttons);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      function closeDlg(){
        if (overlay && overlay.parentNode){ overlay.parentNode.removeChild(overlay); }
      }

      btnNo.onclick = function(){ closeDlg(); };
      overlay.onclick = function(ev2){
        if (ev2.target === overlay){ closeDlg(); }
      };
      btnYes.onclick = function(){
        DB.ref('chats/'+key+'/messages/'+mid).remove();
        closeDlg();
      };
    };

    qs('#btnSendFriend').onclick = function(){
      var inp = qs('#chatInputFriend');
      var text = (inp && inp.value) ? String(inp.value).trim() : '';
      if (!text) return;

      var key2 = pairKey(me.username, peer);
      var ref = DB.ref('chats/'+key2+'/messages').push();

      DB.ref('characters/'+me.username).get().then(function(msnap){
        var mdata = (msnap && msnap.exists()) ? msnap.val() : {};
        var myNick = mdata.nickname || mdata.name || me.username;
        var myAv   = (mdata.avatar && String(mdata.avatar).trim())
                   || (mdata.avatarUrl && String(mdata.avatarUrl).trim())
                   || 'https://via.placeholder.com/28';

        ref.set({
          from: me.username,
          to: peer,
          text: text,
          ts: Date.now(),
          fromNickname: myNick,
          fromAvatar: myAv
        });
      });

      inp.value = '';
    };

    qs('#btnBackFriends').onclick = function(){
      qs('#chatBox').style.display = 'none';
      qs('#friendsList').style.display = '';
      qs('#friendsInbox').style.display = 'none';
      window.__activeChatPeer = null;
    };

    return;
  }
  });

  // 啟動紅點監聽
  watchInboxBadge();
})();
