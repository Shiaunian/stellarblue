(function(global){
  // ===== 工具 =====
  function qs(s, p){ return (p||document).querySelector(s); }
  function qsa(s, p){ return Array.prototype.slice.call((p||document).querySelectorAll(s)); }
  function el(tag, cls, html){
    var d = document.createElement(tag);
    if(cls) d.className = cls;
    if(html!=null) d.innerHTML = html;
    return d;
  }
  function fmt(n){ return new Intl.NumberFormat('zh-Hant').format(n||0); }

  // ===== 內部狀態 =====
  var api = {
    getPlayer: function(){ return null; },
    save: function(){},
    log: function(t){ console.log(t); }
  };
  var mounted = false;
  var modal  = null;
  var tabButtons = null;
  var viewWraps  = null;
  var searchBox  = null;
  var sortSel    = null;
  var gridList   = null;
  var gridShelf  = null;
  var dataAll    = [];     // [{id,name,count}]
  var shelf      = [];     // [cardId,...]

  // ===== 樣式（一次注入） =====
  function injectCSS(){
    if (document.getElementById('collectionCSS')) return;
    var css = el('style'); css.id='collectionCSS';
    css.textContent =
      '#collectionModal .sheet{width:min(100%,960px);max-height:90vh;display:flex;flex-direction:column;}'+
      '#collectionModal .body{overflow:auto;padding:12px;display:flex;flex-direction:column;gap:12px;}'+
      '#collectionModal .tabbar{display:flex;gap:8px;border-bottom:1px solid #eee;padding:8px 12px;}'+
      '#collectionModal .tabbar .tab{padding:6px 12px;border-radius:8px;cursor:pointer;}'+
      '#collectionModal .tabbar .tab.active{background:#222;color:#fff;}'+
      '#collectionModal .tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}'+
      '#collectionModal .tools .left{display:flex;gap:8px;align-items:center}'+
      '#collectionModal input[type="search"]{padding:6px 10px;border:1px solid #ddd;border-radius:8px;min-width:160px}'+
      '#collectionModal select{padding:6px 10px;border:1px solid #ddd;border-radius:8px;}'+
      '.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px}'+
      '.card-cell{position:relative;aspect-ratio:3/4;border:1px solid #ddd;border-radius:10px;overflow:hidden;background:#fafafa;display:flex;align-items:center;justify-content:center;cursor:pointer}'+
      '.card-cell .thumb{font-size:12px;text-align:center;line-height:1.1;padding:4px}'+
      '.card-cell .qty{position:absolute;right:4px;bottom:4px;background:#222;color:#fff;padding:2px 6px;border-radius:999px;font-size:12px}'+
      '.shelf{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}'+
      '.shelf .slot{position:relative;aspect-ratio:3/4;border:1px dashed #bbb;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center}'+
      '.shelf .slot.filled{border-style:solid;border-color:#666}'+
      '.shelf .slot .remove{position:absolute;right:6px;top:6px;background:#000;color:#fff;border-radius:999px;line-height:1;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer}'+
      '@media (max-width:640px){ .card-grid{grid-template-columns:repeat(auto-fill,minmax(80px,1fr));} }';
    document.head.appendChild(css);
  }

  // ===== UI 建立 =====
  function buildModal(){
    if (modal) return modal;

    modal = el('div'); modal.id='collectionModal'; modal.className='modal'; modal.setAttribute('aria-hidden','true');

    var mask = el('div','mask'); mask.setAttribute('data-close','collection');
    var sheet = el('div','sheet'); sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-labelledby','colTitle');

    // 標題列
    var title = el('div','sec-title'); title.id='colTitle';
    title.innerHTML = '卡片收藏<div class="close" data-close="collection">✕</div>';

    // 內容
    var body = el('div','body');

    // 分頁列
    var tabs = el('div','tabbar');
    tabs.innerHTML =
      '<div class="tab active" data-tab="list">卡片收藏</div>'+
      '<div class="tab" data-tab="shelf">展示架</div>';

    // 工具列（搜尋 / 排序）— 只在「卡片收藏」頁顯示
    var tools = el('div','tools');
    tools.innerHTML =
      '<div class="left">'+
        '<input id="colSearch" type="search" placeholder="搜尋卡片（編號/名稱）" />'+
      '</div>'+
      '<div class="right">'+
        '<label>排序：</label>'+
        '<select id="colSort">'+
          '<option value="id">編號</option>'+
          '<option value="name">名稱</option>'+
          '<option value="count">擁有數量</option>'+
        '</select>'+
      '</div>';

    // 兩個檢視容器
    var viewList = el('div'); viewList.dataset.view='list';
    var viewShelf = el('div'); viewShelf.dataset.view='shelf'; viewShelf.style.display='none';

    // 清單：卡片格
    gridList = el('div','card-grid'); viewList.appendChild(gridList);

    // 展示架：5 欄
    var shelfTitle = el('div', null, '<b>展示架（5 欄）</b><div style="font-size:12px;color:#666">點卡片放入展示架，再點一次可移除；上限 5 張</div>');
    gridShelf = el('div','shelf');
    for (var i=0;i<5;i++){
      var s = el('div','slot'); s.dataset.pos = String(i);
      gridShelf.appendChild(s);
    }
    viewShelf.appendChild(shelfTitle);
    viewShelf.appendChild(gridShelf);

    // 組裝
    body.appendChild(tabs);
    body.appendChild(tools);
    body.appendChild(viewList);
    body.appendChild(viewShelf);

    sheet.appendChild(title);
    sheet.appendChild(body);
    modal.appendChild(mask);
    modal.appendChild(sheet);
    document.body.appendChild(modal);

    // 成員快取
    tabButtons = qsa('.tab', tabs);
    viewWraps  = [viewList, viewShelf];
    searchBox  = qs('#colSearch', tools);
    sortSel    = qs('#colSort', tools);

    // 綁定：關閉
    qsa('[data-close="collection"]', modal).forEach(function(x){
      x.addEventListener('click', function(){ Collection.close(); });
    });
    mask.addEventListener('click', function(){ Collection.close(); });

    // 綁定：分頁
    tabButtons.forEach(function(tb){
      tb.addEventListener('click', function(){
        var tab = tb.getAttribute('data-tab');
        tabButtons.forEach(function(t){ t.classList.toggle('active', t===tb); });
        for (var i=0;i<viewWraps.length;i++){
          var v = viewWraps[i];
          v.style.display = ( (tab==='list' && v===viewList) || (tab==='shelf' && v===viewShelf) ) ? '' : 'none';
        }
      });
    });

    // 綁定：搜尋 / 排序
    searchBox.addEventListener('input', renderList);
    sortSel.addEventListener('change', renderList);

    // 互動：清單點擊→放到展示架
    gridList.addEventListener('click', function(e){
      var cell = e.target.closest ? e.target.closest('.card-cell') : null;
      if (!cell) return;
      var id = cell.getAttribute('data-id');
      if (!id) return;

      var have = countOf(id);
      if (have<=0) { api.log('沒有這張卡，無法放入展示架'); return; }

      // 尋第一個空槽
      var pos = -1;
      var i;
      for(i=0;i<5;i++){ if(!shelf[i]){ pos=i; break; } }
      if (pos===-1){
        api.log('展示架已滿（最多 5 張）','warn');
        return;
      }
      shelf[pos] = id;
      renderShelf();
      api.save();
    });

    // 互動：展示架點擊→移除
    gridShelf.addEventListener('click', function(e){
      var slot = e.target.closest ? e.target.closest('.slot') : null;
      if (!slot) return;
      var p = parseInt(slot.getAttribute('data-pos'),10);
      if (isNaN(p)) return;

      if (shelf[p]){
        shelf[p] = null;
        renderShelf();
        api.save();
      }
    });

    return modal;
  }

  // ===== 資料處理 =====
  function countOf(id){
    for (var i=0;i<dataAll.length;i++){
      if (String(dataAll[i].id) === String(id)) return dataAll[i].count||0;
    }
    return 0;
  }

  function loadDataFromPlayer(P){
    // 允許 P.cards（物件 {id:count} 或 陣列 [{id,count}]），都轉為統一格式
    dataAll.length = 0;

    // 讀 inventory
    var inv = (P && P.cards) ? P.cards : null;
    if (Array.isArray(inv)){
      for (var i=0;i<inv.length;i++){
        var it = inv[i] || {};
        var id = it.id!=null ? String(it.id) : null;
        if(!id) continue;
        var name = it.name || ('卡片 #'+id);
        var cnt = it.count!=null ? parseInt(it.count,10) : 1;
        if(isNaN(cnt)||cnt<0) cnt=0;
        dataAll.push({id:id, name:name, count:cnt});
      }
    } else if (inv && typeof inv==='object'){
      var ks = Object.keys(inv);
      for (var j=0;j<ks.length;j++){
        var k = ks[j];
        var cnt2 = parseInt(inv[k],10);
        if(isNaN(cnt2)||cnt2<0) cnt2=0;
        dataAll.push({id:String(k), name:('卡片 #'+k), count:cnt2});
      }
    }

    // 若完全沒有資料，給空陣列（UI 會顯示空）
    // 讀展示架
    var arr = (P && Array.isArray(P.cardShelf)) ? P.cardShelf.slice(0,5) : [];
    shelf = [null,null,null,null,null];
    for (var s=0;s<Math.min(arr.length,5);s++){
      var v = arr[s];
      shelf[s] = v ? String(v) : null;
    }
  }

  // ===== 繪製 =====
  function renderList(){
    if(!gridList) return;
    var keyword = (searchBox.value||'').trim().toLowerCase();
    var mode = (sortSel.value||'id');

    // 過濾
    var list = [];
    for (var i=0;i<dataAll.length;i++){
      var it = dataAll[i];
      var hit = true;
      if (keyword){
        var t = (String(it.id)+' '+(it.name||'')).toLowerCase();
        hit = t.indexOf(keyword) >= 0;
      }
      if(hit) list.push(it);
    }

    // 排序
    list.sort(function(a,b){
      if (mode==='count'){
        var da = (a.count||0), db=(b.count||0);
        if (db!==da) return db-da; // 數量多的在前
        return String(a.id).localeCompare(String(b.id),'zh-Hant');
      }
      if (mode==='name'){
        var na = a.name||'', nb=b.name||'';
        var c = na.localeCompare(nb,'zh-Hant');
        if (c!==0) return c;
        return String(a.id).localeCompare(String(b.id),'zh-Hant');
      }
      // id
      return String(a.id).localeCompare(String(b.id),'zh-Hant',{numeric:true});
    });

    // 產生 DOM
    var html = '';
    for (var j=0;j<list.length;j++){
      var it2 = list[j];
      var id = String(it2.id);
      var name = it2.name || ('卡片 #'+id);
      // 圖片先用佔位（之後可換正式素材）
      var img = 'https://picsum.photos/seed/card_'+encodeURIComponent(id)+'/120/160';
      html += '<div class="card-cell" data-id="'+id+'">'+
                '<div class="thumb"><img alt="'+name+'" src="'+img+'" style="max-width:100%;max-height:100%;display:block;margin:auto" /><div>'+name+'</div></div>'+
                (it2.count>0? '<div class="qty">x'+fmt(it2.count)+'</div>':'' )+
              '</div>';
    }
    gridList.innerHTML = html || '<div style="color:#666">目前沒有任何卡片</div>';
  }

  function renderShelf(){
    if(!gridShelf) return;
    var cells = qsa('.slot', gridShelf);
    for (var i=0;i<cells.length;i++){
      var slot = cells[i];
      var id = shelf[i];
      if (!id){
        slot.classList.remove('filled');
        slot.innerHTML = '<div style="color:#aaa;font-size:12px">空位</div>';
      } else {
        var name = '卡片 #'+id;
        var img = 'https://picsum.photos/seed/card_'+encodeURIComponent(id)+'/120/160';
        slot.classList.add('filled');
        slot.innerHTML =
          '<div class="remove">×</div>'+
          '<div class="thumb"><img alt="'+name+'" src="'+img+'" style="max-width:100%;max-height:100%;display:block;margin:auto" /><div style="font-size:12px;text-align:center">'+name+'</div></div>';
      }
    }

    // 回寫到玩家資料
    try{
      var P = api.getPlayer ? api.getPlayer() : null;
      if (P){
        P.cardShelf = shelf.slice(0,5);
      }
    }catch(_){}
  }

  // ===== 開關 =====
    function open(gameAPI){
    // 掛 API
    api.getPlayer = (gameAPI && gameAPI.getPlayer) ? gameAPI.getPlayer : api.getPlayer;
    api.save      = (gameAPI && gameAPI.save) ? gameAPI.save : api.save;
    api.log       = (gameAPI && gameAPI.log) ? gameAPI.log : api.log;

    injectCSS();
    buildModal();

    // 安全初始化玩家欄位
    var P = api.getPlayer ? api.getPlayer() : null;
    if (P){
        if (!P.cards){ P.cards = {}; }              // 預設空物件：{cardId: count}
        if (!Array.isArray(P.cardShelf)){ P.cardShelf = []; }
    }

    loadDataFromPlayer(P);
    renderList();
    renderShelf();

    // ★ 關鍵：加上 .show，才會套用 .modal.show { display:grid; }
    if (modal && modal.classList) { modal.classList.add('show'); }
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    }


    function close(){
    if(!modal) return;
    if (modal.classList) { modal.classList.remove('show'); }
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';

    // 存檔（避免遺漏）
    try{ api.save(); }catch(_){}
    }


  // ===== 匯出 =====
  var Collection = {
    mount: function(){ if(mounted) return; injectCSS(); buildModal(); mounted=true; },
    open: open,
    close: close
  };
  global.Collection = Collection;

})(window);
