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
      '<div class="sheet" role="dialog" aria-labelledby="friendsTitle" style="width:min(96vw, 420px); max-height:90svh; display:grid; grid-template-rows:auto 1fr; overflow:hidden;">' +
        '<div class="sec-title" id="friendsTitle">好 友<div class="close" data-close="friends">✕</div></div>' +
        '<div class="body" style="display:grid; gap:8px; overflow:auto;">' +
          '<div class="bag-tabs">' +
            '<span class="bag-tab active" data-f-tab="list">好友</span>' +
            '<span class="bag-tab" data-f-tab="inbox">邀請</span>' +
          '</div>' +
          '<div id="friendsList" class="bag-list" style="max-height:unset;"></div>' +
          '<div id="friendsInbox" class="bag-list" style="display:none; max-height:unset;"></div>' +
          '<div id="chatBox" style="display:none; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:8px; gap:8px;">' +
            '<div id="chatBoxTitle" style="font-weight:bold; margin-bottom:4px;"></div>' +
            '<div id="chatLog" style="height:300px; overflow:auto; background:#060a1a; border:1px solid rgba(255,255,255,.15); border-radius:8px; padding:6px; font-size:12px;"></div>' +
            '<div id="chatRetentionTip" style="text-align:center; font-size:10px; opacity:.1.65; margin:18px 0 11px 0;">僅保留最近 300 則訊息</div>' +
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
  }

function renderFriends(arr){
  var box = qs('#friendsList'); if(!box) return;
  if(!arr || !arr.length){ box.innerHTML = '<div style="opacity:.8;">目前沒有好友。</div>'; return; }

  var html = '';
  var pending = arr.length;
  arr.forEach(function(username){
    DB.ref('characters/'+username).get().then(function(snap){
      var data = (snap && snap.exists()) ? snap.val() : {};
      var nickname = data.nickname || data.name || username;
      // ★ 先用 avatar，再退回 avatarUrl，最後用預設
      var avatar = (data.avatar && String(data.avatar).trim())
                || (data.avatarUrl && String(data.avatarUrl).trim())
                || 'https://via.placeholder.com/40x40?text=🤖';

      html +=
        '<div class="dex-row">'+
          '<img src="'+ avatar +'" alt="頭像" style="width:40px; height:40px; border-radius:50%; object-fit:cover; margin-right:8px;">'+
          '<div class="dex-main">'+
            '<div class="dex-name">'+ nickname +'</div>'+
            '<div class="dex-sub">可傳訊息</div>'+
          '</div>'+
          '<div>'+
            '<button class="opx" data-chat-with="'+ username +'">對話</button> '+
            '<button class="opx" data-unfriend="'+ username +'">解除</button>'+
          '</div>'+
        '</div>';

      pending--;
      if (pending === 0){
        box.innerHTML = html;
      }
    });
  });
}




  function renderInbox(arr){
    var box = qs('#friendsInbox'); if(!box) return;
    if(!arr || !arr.length){ box.innerHTML = '<div style="opacity:.8;">目前沒有待處理的邀請。</div>'; return; }
    var html = '';
    for (var i=0;i<arr.length;i++){
      var u = arr[i];
      html +=
        '<div class="dex-row">'+
          '<div class="dex-main">'+
            '<div class="dex-name">'+ u +'</div>'+
            '<div class="dex-sub">邀請你成為好友</div>'+
          '</div>'+
          '<div>'+
            '<button class="opx primary" data-accept="'+ u +'">接受</button> '+
            '<button class="opx" data-reject="'+ u +'">拒絕</button>'+
          '</div>'+
        '</div>';
    }
    box.innerHTML = html;
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

  // ===== 全域委派：打開好友面板 / 接受 / 拒絕 / 解除 / 對話 =====
  document.addEventListener('click', function(e){
    var t = e.target;

    // 開啟好友面板（主畫面「好友」按鈕）
    var btnOpen = t.closest ? t.closest('[data-open="friends"]') : null;
    if (btnOpen){ Friends.open(); return; }

    if (!window.DB || !DB.ref || !window.Auth || !Auth.currentUser) return;
    var me = Auth.currentUser(); if(!me || !me.username) return;

    // 接受
    var btnAcc = t.closest ? t.closest('[data-accept]') : null;
    if (btnAcc){
      var other = btnAcc.getAttribute('data-accept') || '';
      if (!other) return;
      DB.ref('characters/'+me.username+'/friends/'+other).set(true);
      DB.ref('characters/'+other+'/friends/'+me.username).set(true);
      DB.ref('characters/'+me.username+'/friendInbox/'+other).remove();
      DB.ref('characters/'+other+'/friendOutbox/'+me.username).remove();
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

    // 解除好友
    var btnUn = t.closest ? t.closest('[data-unfriend]') : null;
    if (btnUn){
      var other3 = btnUn.getAttribute('data-unfriend') || '';
      if (!other3) return;
      DB.ref('characters/'+me.username+'/friends/'+other3).remove();
      DB.ref('characters/'+other3+'/friends/'+me.username).remove();
      loadLists();
      return;
    }

// 進入對話
var btnChat = t.closest ? t.closest('[data-chat-with]') : null;
if (btnChat){
  var peer = btnChat.getAttribute('data-chat-with') || '';
  if (!peer) return;
  var m = ensureModal();
  qs('#friendsList').style.display = 'none';
  qs('#friendsInbox').style.display = 'none';
  qs('#chatBox').style.display = '';

  var logBox = qs('#chatLog');
  logBox.innerHTML = '';
  var key = pairKey(me.username, peer);

  // 對方暱稱/頭像、我方頭像
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

  // 先抓我自己的頭像
  DB.ref('characters/'+me.username).get().then(function(msnap){
    var mdata = (msnap && msnap.exists()) ? msnap.val() : {};
    myAvatar = (mdata.avatar && String(mdata.avatar).trim())
            || (mdata.avatarUrl && String(mdata.avatarUrl).trim())
            || fallbackAvatar();
  });

  // 設置標題 + 取得對方暱稱與頭像
  DB.ref('characters/'+peer).get().then(function(snap){
    var data = (snap && snap.exists()) ? snap.val() : {};
    peerNick = data.nickname || data.name || peer;
    peerAvatar = (data.avatar && String(data.avatar).trim())
              || (data.avatarUrl && String(data.avatarUrl).trim())
              || fallbackAvatar();

    var title = qs('#chatBoxTitle');
    if (!title) {
      title = document.createElement('div');
      title.id = 'chatBoxTitle';
      title.style = 'font-weight:bold; margin-bottom:4px;';
      qs('#chatBox').insertBefore(title, qs('#chatLog'));
    }
    title.textContent = '你正在與「' + peerNick + '」對話';

    // 有了暱稱/頭像後再渲染一次
    renderLog(lastLog);
  });

// 渲染器：25px 頭像；分日（台灣時區）＋久未發言插入時間條；不顯示名字
function renderLog(val){
  var html = '';

  // 先把訊息按 ts 正序排列（避免 Firebase 物件鍵序不穩）
  var arr = [];
  for (var k in val){
    if (!val.hasOwnProperty(k)) continue;
    arr.push({ id:k, msg: val[k] || {} });
  }
  arr.sort(function(a,b){
    var ta = Number(a.msg.ts || 0); var tb = Number(b.msg.ts || 0);
    return ta - tb;
  });

  // 工具：台灣時間的「年月日字串」與「完整日期+時間」
  function dayKeyTW(ts){
    return new Date(ts).toLocaleDateString('zh-TW', { timeZone:'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit' });
  }
  function dayLabelTW(ts){
    // 例：8月15日
    return new Date(ts).toLocaleDateString('zh-TW', { timeZone:'Asia/Taipei', month:'long', day:'numeric' });
  }
  function dateTimeLabelTW(ts){
    // 例：8月15日 20:43（24h）
    return new Date(ts).toLocaleString('zh-TW', { timeZone:'Asia/Taipei', month:'long', day:'numeric', hour12:false, hour:'2-digit', minute:'2-digit' });
  }

  var prevDay = '';
  var prevTs  = 0;

  for (var i=0; i<arr.length; i++){
    var id   = arr[i].id;
    var mmsg = arr[i].msg || {};
    var isMe = (mmsg.from === me.username);
    var ts   = Number(mmsg.ts || 0);

    // 每到新的一天（依台灣時間）插入「日期分隔條」
    var curDay = dayKeyTW(ts);
    if (curDay !== prevDay){
      html += '<div class="sep" style="text-align:center; opacity:.8; font-size:11px; margin:8px 0;">' + dayLabelTW(ts) + '</div>';
      prevDay = curDay;
      prevTs = 0; // 新的一天，重置間隔
    }

    // 若與上一則訊息間隔 > 10 分鐘，插入「日期時間分隔條」
    if (prevTs && (ts - prevTs) > 600000){
      html += '<div class="sep" style="text-align:center; opacity:.65; font-size:10px; margin:6px 0;">' + dateTimeLabelTW(ts) + '</div>';
    }

    // 頭像來源：我方優先 myAvatar；對方優先 fromAvatar -> peerAvatar
    var av = isMe
      ? (myAvatar || fallbackAvatar())
      : (mmsg.fromAvatar || peerAvatar || fallbackAvatar());

    if (!isMe){
      // 對方：頭像在左、灰黑底訊息泡泡
      html += ''
        + '<div class="item msg" data-msg-id="'+ id +'" data-from="'+ (mmsg.from||'') +'" data-ts="'+ ts +'" style="display:flex; justify-content:flex-start; align-items:flex-end; gap:8px; margin:6px 0;">'
        +   '<img src="'+ av +'" alt="avatar" style="width:25px; height:25px; border-radius:50%; object-fit:cover; flex:0 0 25px;">'
        +   '<div class="msg-bubble" style="max-width:72%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#eaf2ff; border-radius:12px; padding:6px 10px; line-height:1.5; word-break:break-word;">'
        +     (mmsg.text || '')
        +   '</div>'
        + '</div>';
    } else {
      // 自己：整列靠右、亮色泡泡、頭像在右
      html += ''
        + '<div class="item msg" data-msg-id="'+ id +'" data-from="'+ (mmsg.from||'') +'" data-ts="'+ ts +'" style="display:flex; justify-content:flex-end; align-items:flex-end; gap:8px; margin:6px 0;">'
        +   '<div class="msg-bubble" style="max-width:72%; background:linear-gradient(135deg, var(--accent,#8b5cf6), var(--accent2,#22d3ee)); color:#fff; border:1px solid rgba(255,255,255,.18); border-radius:12px; padding:6px 10px; line-height:1.5; word-break:break-word;">'
        +     (mmsg.text || '')
        +   '</div>'
        +   '<img src="'+ av +'" alt="avatar" style="width:25px; height:25px; border-radius:50%; object-fit:cover; flex:0 0 25px;">'
        + '</div>';
    }

    prevTs = ts;
  }

  logBox.innerHTML = html;
  logBox.scrollTop = logBox.scrollHeight;
}



// 即時監聽（含 300 則上限 & 自動清舊）
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
  // 依 ts 由舊到新排序（ts 缺失則當 0）
  items.sort(function(a,b){ return a.ts - b.ts; });

  var over = items.length - 300;
  var viewObj = {};
  if (over > 0){
    // 先畫面只顯示「最新 300」
    var keep = items.slice(items.length - 300);
    for (var i=0; i<keep.length; i++){ viewObj[ keep[i].id ] = keep[i].msg; }
    lastLog = viewObj;
    renderLog(lastLog);

    // 小字提示（3 秒回復）
    var tip = qs('#chatRetentionTip');
    if (tip){
      tip.textContent = '僅保留最近 300 則訊息（較舊訊息已自動清理）';
      setTimeout(function(){ tip.textContent = '僅保留最近 300 則訊息'; }, 3000);
    }

    // 真的刪除多餘的舊訊息
    for (var j=0; j<over; j++){
      var delId = items[j].id;
      DB.ref('chats/'+key+'/messages/'+delId).remove();
    }
  }else{
    lastLog = val;
    renderLog(lastLog);
  }
});


// 點擊訊息 → 嘗試收回（只限「我」在 5 分鐘內）
logBox.onclick = function(ev){
  var target = ev.target;
  // 允許點到泡泡或整列
  var row = target.closest ? target.closest('.msg') : null;
  if (!row) return;

  var from = row.getAttribute('data-from') || '';
  var mid  = row.getAttribute('data-msg-id') || '';
  var ts   = Number(row.getAttribute('data-ts') || '0');

  if (!mid) return;

  // 只允許收回自己的訊息
  if (from !== me.username) return;

  // 5 分鐘內可收回
  var now = Date.now();
  if (now - ts > 300000) return; // 超時則無動作

  // 直接刪除該訊息
  DB.ref('chats/'+key+'/messages/'+mid).remove();
};


  // 送出
  qs('#btnSendFriend').onclick = function(){
    var inp = qs('#chatInputFriend');
    var text = (inp && inp.value) ? String(inp.value).trim() : '';
    if (!text) return;

    var key2 = pairKey(me.username, peer);
    var ref = DB.ref('chats/'+key2+'/messages').push();

    // 寫入我的暱稱與頭像（讓對方那邊也能直接顯示）
    DB.ref('characters/'+me.username).get().then(function(msnap){
      var mdata = (msnap && msnap.exists()) ? msnap.val() : {};
      var myNick = mdata.nickname || mdata.name || me.username;
      var myAv   = (mdata.avatar && String(mdata.avatar).trim())
                 || (mdata.avatarUrl && String(mdata.avatarUrl).trim())
                 || fallbackAvatar();

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

  // 返回
  qs('#btnBackFriends').onclick = function(){
    qs('#chatBox').style.display = 'none';
    qs('#friendsList').style.display = '';
    qs('#friendsInbox').style.display = 'none';
  };
}


  });

  // 啟動紅點監聽
  watchInboxBadge();
})();
