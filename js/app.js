(function(){
  var STORAGE_KEY = 'pizzeria-ordini-v1';
  var DAY_NAMES = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  var uid = function(){ return Math.random().toString(36).slice(2,9); };

  /* ---------- icone SVG ---------- */
  function ic(name){
    var paths = {
      pizza: '<path d="M4 6l8-3 8 3-8 15z"/><circle cx="11" cy="9" r="1"/><circle cx="14.5" cy="12" r="1"/><circle cx="10" cy="13.5" r="1"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      send: '<path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/>',
      gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2.5 12h3M18.5 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
      wheat: '<path d="M12 21V4"/><path d="M12 8l-3-2M12 8l3-2M12 12l-3-2M12 12l3-2M12 16l-3-2M12 16l3-2"/>',
      cheese: '<path d="M3 18h18l-2-9-7-5-7 5z"/><circle cx="11" cy="14" r=".8"/><circle cx="15" cy="15.5" r=".8"/><circle cx="13" cy="11" r=".8"/>',
      box: '<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v9l9 4 9-4V8"/><path d="M12 12v9"/>',
      bottle: '<path d="M10 3h4v3.2c1 .8 1.5 1.8 1.5 3.3V19a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V9.5c0-1.5.5-2.5 1.5-3.3z"/><path d="M9.5 12h5"/>',
      meat: '<path d="M9 15c-3-1-4-4.5-2-7 1.6-2 4.6-2.5 6.8-.3l3.5 3.5c2.2 2.2 1.7 5.2-.3 6.8-2.5 2-6 1-7-2z"/><path d="M17 3s2 1 2 3-2 2-2 2"/>',
      fish: '<path d="M3 12s3.5-5 10-5 8 5 8 5-1.5 5-8 5-10-5-10-5z"/><circle cx="16" cy="10.5" r=".8"/><path d="M3 12l-2-2.5M3 12l-2 2.5"/>',
      plane: '<path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/>'
    };
    return '<svg class="icn" viewBox="0 0 24 24">'+(paths[name]||paths.box)+'</svg>';
  }
  var SUPPLIER_ICONS = { comit:'cheese', viera:'meat', alambra:'bottle', emicela:'cheese', indiano:'bottle', aral:'box', panaderia:'wheat', herbania:'fish', barril:'bottle' };
  function iconForSupplier(id){ return ic(SUPPLIER_ICONS[id] || 'pizza'); }

  // nome dei prodotti di default nel messaggio ai fornitori in spagnolo
  // (senza voce = nome uguale, es. marchi o prodotti italiani come Spianata)
  var ES_NAMES = {
    v1:'Cruasanes', v2:'Napolitanas', v3:'Donuts', v4:'Jamón cocido', v6:'Jamón serrano',
    c2:'Salami', c4:'Harina', c7:'Tomate', c8:'Cajas de pizza',
    em2:'Queso gouda', em3:'Leche',
    in2:'Bombona de gas', in5:'Topping de coco',
    ar1:'Bolsas de basura 120L', ar2:'Vasos 0,7 + tapas 0,7', ar3:'Vasos 0,4 + tapas 0,4',
    ar4:'Film transparente', ar5:'Papel de aluminio', ar6:'Servilletas blancas',
    ar7:'Bandejas de aluminio + tapas', ar8:'Paletinas de madera', ar9:'PET transparente',
    ar10:'Vasos smoothie + tapas',
    pn1:'Coco', he1:'Salmón',
    ba1:'Cerveza de barril', ba2:'Sin alcohol'
  };
  function withEsNames(st){
    st.suppliers.forEach(function(sup){
      sup.prodotti.forEach(function(p){ if(ES_NAMES[p.id] && p.nomeEs === undefined) p.nomeEs = ES_NAMES[p.id]; });
    });
    return st;
  }

  function defaultState(){
    return withEsNames({
      tab: 'fornitori', view: 'fornitori',
      currentSupplierId: null, settingsOpenId: null,
      suppliers: [
        { id:'viera', nome:'Viera', telefono:'', giorniOrdine:[5],
          prodotti:[
            {id:'v1', nome:'Cornetti'}, {id:'v2', nome:'Napolitane'}, {id:'v3', nome:'Donut'},
            {id:'v4', nome:'Prosciutto cotto'}, {id:'v5', nome:'Bacon'}, {id:'v6', nome:'Serrano'},
            {id:'v7', nome:'Nata'}
          ] },
        { id:'comit', nome:'Comit (Moreno)', telefono:'', giorniOrdine:[5,3],
          prodotti:[
            {id:'c1', nome:'Mozzarella'}, {id:'c2', nome:'Salame'}, {id:'c3', nome:'Spianata'},
            {id:'c4', nome:'Farina'}, {id:'c5', nome:'Spolvero'}, {id:'c6', nome:'Gorgonzola'},
            {id:'c7', nome:'Pomodoro'}, {id:'c8', nome:'Cartoni pizza'}
          ] },
        { id:'alambra', nome:'Alambra', telefono:'', giorniOrdine:[],
          prodotti:[ {id:'al1', nome:'San Miguel'}, {id:'al2', nome:'Alhambra'}, {id:'al3', nome:'IPA'} ] },
        { id:'emicela', nome:'Emicela', telefono:'', giorniOrdine:[1,3],
          prodotti:[ {id:'em1', nome:'Pollo'}, {id:'em2', nome:'Formaggio gouda'}, {id:'em3', nome:'Latte'} ] },
        { id:'indiano', nome:'Indiano', telefono:'', giorniOrdine:[],
          prodotti:[
            {id:'in1', nome:'Barril'}, {id:'in2', nome:'Bombola gas'}, {id:'in3', nome:'Magners'},
            {id:'in4', nome:'Strongbow'}, {id:'in5', nome:'Topping cocco'}
          ] },
        { id:'aral', nome:'Aral (Detersivi)', telefono:'', giorniOrdine:[],
          prodotti:[
            {id:'ar1', nome:'Sacchi 120L'}, {id:'ar2', nome:'Bicchieri 0.7 + Tappi 0.7'},
            {id:'ar3', nome:'Bicchieri 0.4 + Tappi 0.4'}, {id:'ar4', nome:'Film trasparente'},
            {id:'ar5', nome:'Alluminio'}, {id:'ar6', nome:'Tovaglioli bianchi'},
            {id:'ar7', nome:'Bandeja alluminio + coperchi'}, {id:'ar8', nome:'Palettine legno'},
            {id:'ar9', nome:'PET trasparente'}, {id:'ar10', nome:'Vaso smoothie + coperchi'}
          ] },
        { id:'panaderia', nome:'Panaderia (Torte)', telefono:'', giorniOrdine:[],
          prodotti:[ {id:'pn1', nome:'Cocco'}, {id:'pn2', nome:'Chocolate'}, {id:'pn3', nome:'Zanahoria'} ] },
        { id:'herbania', nome:'Herbania Surgelati', telefono:'', giorniOrdine:[],
          prodotti:[ {id:'he1', nome:'Salmone'} ] },
        { id:'barril', nome:'Barril', telefono:'', giorniOrdine:[],
          prodotti:[ {id:'ba1', nome:'Birra alla spina'}, {id:'ba2', nome:'Senza alcol'}, {id:'ba3', nome:'Tostada'} ] }
      ],
      drafts: {},
      lastOrders: {}
    });
  }

  // rende sicuri dati vecchi o importati: campi mancanti non devono bloccare l'app
  function normalizeSuppliers(list){
    return (Array.isArray(list) ? list : []).filter(function(s){
      return s && typeof s === 'object' && s.id;
    }).map(function(s){
      s.id = String(s.id);
      s.nome = String(s.nome || 'Fornitore');
      s.telefono = normPhone(s.telefono || '');
      s.giorniOrdine = (Array.isArray(s.giorniOrdine) ? s.giorniOrdine : []).filter(function(d){ return d >= 0 && d <= 6; });
      s.prodotti = (Array.isArray(s.prodotti) ? s.prodotti : []).filter(function(p){
        return p && typeof p === 'object' && p.id;
      }).map(function(p){ p.id = String(p.id); p.nome = String(p.nome || 'Prodotto'); return p; });
      return s;
    });
  }
  // numero WhatsApp: solo cifre, senza 00 iniziale; 9 cifre spagnole → prefisso 34
  function normPhone(v){
    var n = String(v).replace(/[^0-9]/g,'').replace(/^00/, '');
    if(n.length === 9 && /^[6789]/.test(n)) n = '34' + n;
    return n;
  }

  var state = load();

  function freshState(){
    var st = defaultState();
    st.migratedRealSuppliers = true;
    mergeNewDefaults(st); // registra i default già presenti
    return st;
  }
  function load(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return freshState();
      var parsed = JSON.parse(raw);
      if(!parsed || !Array.isArray(parsed.suppliers)) return freshState();
      parsed.suppliers = normalizeSuppliers(parsed.suppliers);
      parsed.tab = 'fornitori'; parsed.view = 'fornitori';
      parsed.currentSupplierId = null; parsed.settingsOpenId = null;
      if(!parsed.drafts || typeof parsed.drafts !== 'object') parsed.drafts = {};
      if(!parsed.lastOrders || typeof parsed.lastOrders !== 'object') parsed.lastOrders = {};
      mergeNewDefaults(parsed);
      return parsed;
    }catch(e){ return freshState(); }
  }
  function mergeNewDefaults(savedState){
    // migrazione: sostituiamo le vecchie categorie generiche con i fornitori reali
    var wasMigrated = !!savedState.migratedRealSuppliers;
    var OLD_IDS = ['farine','latticini','imballaggi','bevande','salumi','carne-pesce'];
    if(!savedState.migratedRealSuppliers){
      savedState.suppliers = savedState.suppliers.filter(function(s){ return OLD_IDS.indexOf(s.id) === -1; });
      OLD_IDS.forEach(function(id){ delete savedState.drafts[id]; });
      savedState.migratedRealSuppliers = true;
    }

    // correzione nomi: solo se il prodotto ha ancora il vecchio nome di default
    var RENAMES = [
      ['comit','c5','Spolvero soia','Spolvero'],
      ['comit','c8','Cartoncini pizza','Cartoni pizza'],
      ['emicela','em2','Formaggio','Formaggio gouda']
    ];
    RENAMES.forEach(function(r){
      var sup = savedState.suppliers.filter(function(x){ return x.id===r[0]; })[0];
      var prod = sup && sup.prodotti.filter(function(x){ return x.id===r[1]; })[0];
      if(prod && prod.nome === r[2]) prod.nome = r[3];
    });

    var defaults = defaultState();
    // traduzioni spagnole: solo sui prodotti che hanno ancora il nome di default
    defaults.suppliers.forEach(function(defSupplier){
      var existing = savedState.suppliers.filter(function(s){return s.id===defSupplier.id;})[0];
      if(!existing) return;
      existing.prodotti.forEach(function(p){
        var def = defSupplier.prodotti.filter(function(x){ return x.id===p.id; })[0];
        if(def && def.nomeEs && p.nomeEs === undefined && p.nome === def.nome) p.nomeEs = def.nomeEs;
      });
    });
    // aggiunge solo i default mai visti prima: se l'utente ne elimina uno non ricompare.
    // Prima volta con questo registro: quelli mancanti si considerano eliminati apposta.
    var known = Array.isArray(savedState.knownDefaults) ? savedState.knownDefaults : null;
    var addMissing = !(known === null && wasMigrated);
    known = known || [];
    function isNew(key){
      if(known.indexOf(key) > -1) return false;
      known.push(key); return addMissing;
    }
    defaults.suppliers.forEach(function(defSupplier){
      var existing = savedState.suppliers.filter(function(s){return s.id===defSupplier.id;})[0];
      var supplierIsNew = isNew('s:'+defSupplier.id);
      if(!existing){
        defSupplier.prodotti.forEach(function(p){ isNew('p:'+defSupplier.id+':'+p.id); });
        if(supplierIsNew) savedState.suppliers.push(defSupplier);
        return;
      }
      defSupplier.prodotti.forEach(function(defProd){
        var hasIt = existing.prodotti.some(function(p){
          return p.id === defProd.id || p.nome.trim().toLowerCase() === defProd.nome.trim().toLowerCase();
        });
        if(isNew('p:'+defSupplier.id+':'+defProd.id) && !hasIt) existing.prodotti.push(defProd);
      });
    });
    savedState.knownDefaults = known;
  }
  function save(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }
  function getDraft(supplierId){
    if(!state.drafts[supplierId]) state.drafts[supplierId] = { qty:{}, note:'' };
    return state.drafts[supplierId];
  }
  // unità: '' = pezzi (5x), oppure 'kg' / 'L' (ammessi decimali)
  var UNITS = ['', 'kg', 'L'];
  function round2(n){ return Math.round(n*100)/100; }
  function fmtNum(n){ return String(round2(n)).replace('.', ','); }
  function fmtQty(p, n){ return p.unita ? fmtNum(n)+' '+p.unita : 'x'+fmtNum(n); }
  function msgLine(p, n, es){
    var nome = (es && p.nomeEs) ? p.nomeEs : p.nome;
    return p.unita ? fmtNum(n)+' '+p.unita+' '+nome : fmtNum(n)+'x '+nome;
  }
  function shortDate(iso){ return new Date(iso).toLocaleDateString('it-IT', { day:'numeric', month:'short' }); }
  function draftLines(supplierId){
    var s = findSupplier(supplierId); if(!s) return [];
    var d = state.drafts[supplierId]; if(!d) return [];
    return s.prodotti.filter(function(p){ return (d.qty[p.id]||0) > 0; });
  }
  function findSupplier(id){ return state.suppliers.filter(function(s){return s.id===id;})[0] || null; }
  function todayIdx(){ return new Date().getDay(); }
  function todayLabel(locale){ return new Date().toLocaleDateString(locale || 'it-IT', { weekday:'long', day:'numeric', month:'long' }); }
  // lingua del messaggio WhatsApp: spagnolo se non impostata
  function langOf(s){ return s.lingua === 'it' ? 'it' : 'es'; }
  function renderSentAsk(supplierId){
    var d = state.drafts[supplierId];
    if(!d || !d.sentAsk) return '';
    return '<div class="sent-ask">'+
      '<div class="sent-ask-txt">Hai inviato l\'ordine su WhatsApp?</div>'+
      '<div class="pending-actions">'+
        '<button class="btn btn-sm btn-primary" data-clear-draft="'+supplierId+'">Sì, svuota bozza</button>'+
        '<button class="btn btn-sm btn-ghost" data-keep-draft="'+supplierId+'">No, tienila</button>'+
      '</div></div>';
  }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function render(){
    save();
    var app = document.getElementById('app');
    var pushed = state.view === 'order' || state.view === 'summary';
    var screen = renderScreen();
    app.innerHTML = '<div class="app-shell">' + renderBar() + '<div class="screens">' + screen + '</div>' + (pushed ? '' : renderNav()) + '</div>';
    bindEvents();
  }

  function renderBar(){
    if(state.view === 'order' || state.view === 'summary'){
      var s = findSupplier(state.currentSupplierId);
      var title = state.view === 'summary' ? 'Riepilogo' : (s ? s.nome : '');
      return '<div class="app-bar back-row">'+
        '<button class="icon-btn" data-back aria-label="Indietro">'+ic('back')+'</button>'+
        '<div class="brand-name">'+esc(title)+'</div>'+
        '<div style="width:38px;"></div>'+
      '</div>';
    }
    var titles = { fornitori:'Ordini', invia:'Da inviare', impostazioni:'Impostazioni' };
    return '<div class="app-bar">'+
      '<div class="brand">'+
        '<div class="brand-mark">'+ic('pizza')+'</div>'+
        '<div class="brand-text"><div class="brand-name">'+titles[state.tab]+'</div><div class="brand-sub">'+todayLabel()+'</div></div>'+
      '</div>'+
    '</div>';
  }

  function renderNav(){
    var tabs = [
      { id:'fornitori', label:'Fornitori', icon:'grid' },
      { id:'invia', label:'Da inviare', icon:'send' },
      { id:'impostazioni', label:'Impostazioni', icon:'gear' }
    ];
    var anyPending = state.suppliers.some(function(s){ return draftLines(s.id).length > 0; });
    return '<nav class="bottom-nav">'+ tabs.map(function(t){
      var active = state.tab === t.id;
      var dot = (t.id === 'invia' && anyPending) ? ' nav-dot' : '';
      return '<button class="nav-btn'+(active?' active':'')+dot+'" data-tab="'+t.id+'">'+ic(t.icon)+'<span>'+t.label+'</span></button>';
    }).join('') + '</nav>';
  }

  function renderScreen(){
    if(state.view === 'order') return renderOrder();
    if(state.view === 'summary') return renderSummary();
    if(state.tab === 'fornitori') return renderFornitori();
    if(state.tab === 'invia') return renderInvia();
    if(state.tab === 'impostazioni') return renderSettings();
    return renderFornitori();
  }

  function renderFornitori(){
    var today = todayIdx();
    if(!state.suppliers.length) return '<div class="empty-state">Nessun fornitore ancora.<br>Aggiungine uno da Impostazioni.</div>';
    var rows = state.suppliers.map(function(s){
      var isToday = s.giorniOrdine.indexOf(today) > -1;
      var hasDraft = draftLines(s.id).length > 0;
      var daysTxt = s.giorniOrdine.length ? s.giorniOrdine.slice().sort().map(function(d){return DAY_NAMES[d];}).join(' · ') : 'giorni non impostati';
      return '<button class="supplier-row'+(isToday?' today':'')+'" data-open-supplier="'+s.id+'">'+
        '<div class="supplier-icn">'+iconForSupplier(s.id)+'</div>'+
        '<div class="supplier-body"><div class="supplier-name">'+esc(s.nome)+'</div><div class="supplier-days">'+daysTxt+'</div></div>'+
        (hasDraft ? '<span class="tag draft">Bozza</span>' : '') + (isToday ? '<span class="tag today">Oggi</span>' : '') +
        '<span class="chevron">'+ic('back').replace('icn','icn').replace('d="M15 18l-6-6 6-6"','d="M9 18l6-6-6-6"')+'</span>'+
        '</button>';
    }).join('');
    return '<div class="supplier-list">'+rows+'</div>';
  }

  function renderOrder(){
    var s = findSupplier(state.currentSupplierId);
    if(!s){ state.view='fornitori'; return renderFornitori(); }
    var d = getDraft(s.id);
    var rows = s.prodotti.map(function(p){
      var q = d.qty[p.id] || 0;
      return '<div class="product-row"><div class="pname">'+esc(p.nome)+(p.unita?' <span class="unit">'+p.unita+'</span>':'')+'</div>'+
        '<div class="stepper">'+
          '<button class="step-btn" data-minus="'+p.id+'" aria-label="Meno">−</button>'+
          '<input class="qty" type="text" inputmode="'+(p.unita?'decimal':'numeric')+'" value="'+fmtNum(q)+'" data-qty="'+p.id+'" aria-label="Quantità">'+
          '<button class="step-btn" data-plus="'+p.id+'" aria-label="Più">+</button>'+
        '</div></div>';
    }).join('');
    if(!s.prodotti.length) rows = '<div class="empty-state">Nessun prodotto per questo fornitore.<br>Aggiungilo da Impostazioni.</div>';
    var count = draftLines(s.id).length;
    var last = state.lastOrders[s.id];
    var repeat = (last && s.prodotti.length) ?
      '<button class="btn btn-ghost repeat-btn" data-repeat-last="'+s.id+'">↻ Ripeti ultimo ordine ('+shortDate(last.at)+')</button>' : '';
    return repeat+'<div>'+rows+'</div>'+
      '<div class="bottom-bar"><button class="btn btn-primary" data-goto-summary>'+summaryLabel(count)+'</button></div>';
  }

  function summaryLabel(count){ return 'Vedi riepilogo'+(count?(' · '+count+(count===1?' articolo':' articoli')):''); }

  function renderSummary(){
    var s = findSupplier(state.currentSupplierId);
    if(!s){ state.view='fornitori'; return renderFornitori(); }
    var d = getDraft(s.id);
    var lines = draftLines(s.id);
    var linesHtml = lines.map(function(p){
      return '<div class="ticket-line"><span>'+esc(p.nome)+'</span><span class="q">'+fmtQty(p, d.qty[p.id])+'</span></div>';
    }).join('');
    if(!lines.length) linesHtml = '<div class="empty-state" style="padding:10px 0;">Nessun articolo selezionato.</div>';
    return renderSentAsk(s.id)+'<div class="ticket">'+
        '<div class="head">'+esc(s.nome)+'<span class="date">'+todayLabel()+'</span></div>'+
        linesHtml+
        '<label class="field-label" for="noteField">Note al volo (opzionale)</label>'+
        '<textarea id="noteField" class="note-field" placeholder="Es. consegnate entro le 10">'+esc(d.note||'')+'</textarea>'+
      '</div>'+
      '<div class="bottom-bar"><button class="btn btn-whatsapp" data-send-whatsapp="'+s.id+'" '+(lines.length?'':'disabled')+'>'+ic('plane')+' Genera messaggio WhatsApp</button></div>';
  }

  function renderInvia(){
    var pending = state.suppliers.filter(function(s){ return draftLines(s.id).length > 0; });
    if(!pending.length) return '<div class="empty-state">Nessun ordine in bozza al momento.<br>Vai su Fornitori per iniziarne uno.</div>';
    return pending.map(function(s){
      var lines = draftLines(s.id);
      var isToday = s.giorniOrdine.indexOf(todayIdx()) > -1;
      var itemsTxt = lines.map(function(p){ return p.nome + ' ' + fmtQty(p, getDraft(s.id).qty[p.id]); }).join(' · ');
      return renderSentAsk(s.id)+'<div class="pending-card">'+
        '<div class="pending-head"><span class="nm">'+esc(s.nome)+'</span>'+(isToday?'<span class="tag today">Oggi</span>':'')+'</div>'+
        '<div class="pending-items">'+esc(itemsTxt)+'</div>'+
        '<div class="pending-actions">'+
          '<button class="btn btn-sm btn-ghost" data-open-supplier="'+s.id+'">Modifica</button>'+
          '<button class="btn btn-sm btn-whatsapp" data-send-whatsapp="'+s.id+'">'+ic('plane')+' Invia</button>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  function renderSettings(){
    var cards = state.suppliers.map(function(s){
      var open = state.settingsOpenId === s.id;
      var dayChips = [0,1,2,3,4,5,6].map(function(idx){
        var on = s.giorniOrdine.indexOf(idx) > -1;
        return '<button class="day-chip'+(on?' on':'')+'" data-toggle-day="'+s.id+':'+idx+'">'+DAY_NAMES[idx]+'</button>';
      }).join('');
      var prodRows = s.prodotti.map(function(p){
        var opts = UNITS.map(function(u){
          return '<option value="'+u+'"'+((p.unita||'')===u?' selected':'')+'>'+(u||'pz')+'</option>';
        }).join('');
        return '<div class="prod-edit-row"><input type="text" value="'+esc(p.nome)+'" data-rename-product="'+s.id+':'+p.id+'">'+
          '<select class="unit-select" data-set-unit="'+s.id+':'+p.id+'" aria-label="Unità">'+opts+'</select>'+
          '<button class="small-x" data-remove-product="'+s.id+':'+p.id+'">✕</button></div>'+
          (langOf(s) === 'es' ?
            '<div class="prod-es-row"><span class="es-label">ES</span><input type="text" placeholder="In spagnolo (vuoto = uguale)" value="'+esc(p.nomeEs||'')+'" data-rename-product-es="'+s.id+':'+p.id+'"></div>' : '');
      }).join('');
      var body = !open ? '' : (
        '<label class="field-label">Nome fornitore</label>'+
        '<input type="text" value="'+esc(s.nome)+'" data-rename-supplier="'+s.id+'">'+
        '<label class="field-label">Numero WhatsApp (con prefisso, es. 34600000000)</label>'+
        '<input type="text" inputmode="tel" placeholder="34600000000" value="'+esc(s.telefono||'')+'" data-set-phone="'+s.id+'">'+
        '<label class="field-label">Lingua del messaggio</label>'+
        '<div class="day-chips">'+
          '<button class="day-chip'+(langOf(s)==='es'?' on':'')+'" data-set-lang="'+s.id+':es">Español</button>'+
          '<button class="day-chip'+(langOf(s)==='it'?' on':'')+'" data-set-lang="'+s.id+':it">Italiano</button>'+
        '</div>'+
        '<label class="field-label">Giorni in cui accetta ordini</label>'+
        '<div class="day-chips">'+dayChips+'</div>'+
        '<label class="field-label">Prodotti</label>'+prodRows+
        '<div class="prod-edit-row" style="margin-top:10px;">'+
          '<input type="text" placeholder="Nuovo prodotto…" data-new-product-input="'+s.id+'">'+
          '<button class="small-x" data-add-product="'+s.id+'" style="font-size:1.4rem;">＋</button>'+
        '</div>'+
        '<hr class="thin"><button class="link-btn" data-remove-supplier="'+s.id+'">Elimina fornitore</button>'
      );
      return '<div class="settings-card">'+
        '<div class="settings-head" data-toggle-open="'+s.id+'">'+
          '<div class="supplier-icn" style="width:34px;height:34px;">'+iconForSupplier(s.id)+'</div>'+
          '<span class="nm" style="flex:1;margin-left:10px;">'+esc(s.nome)+'</span>'+
          '<span class="chevron">'+(open?ic('back').replace('d="M15 18l-6-6 6-6"','d="M6 9l6 6 6-6"'):ic('back').replace('d="M15 18l-6-6 6-6"','d="M9 6l6 6-6 6"'))+'</span>'+
        '</div>'+ body +
      '</div>';
    }).join('');
    return '<div class="section-title">Fornitori</div>'+ cards +
      '<div class="prod-edit-row">'+
        '<input type="text" placeholder="Nome nuovo fornitore…" id="newSupplierInput">'+
        '<button class="small-x" id="addSupplierBtn" style="font-size:1.4rem;">＋</button>'+
      '</div>'+
      '<div class="section-title">Backup</div>'+
      '<div class="settings-card">'+
        '<div class="hint-block">Salva fornitori, prodotti, numeri e bozze in un file (es. su Drive). Se cambi telefono o svuoti i dati del browser, lo reimporti da qui.</div>'+
        '<div class="pending-actions">'+
          '<button class="btn btn-sm btn-primary" id="exportBtn">Esporta dati</button>'+
          '<button class="btn btn-sm btn-ghost" id="importBtn">Importa dati</button>'+
        '</div>'+
        '<input type="file" id="importFile" accept="application/json,.json" hidden>'+
      '</div>';
  }

  function bindEvents(){
    var app = document.getElementById('app');

    app.querySelectorAll('[data-tab]').forEach(function(el){
      el.addEventListener('click', function(){
        state.tab = el.getAttribute('data-tab'); state.view = state.tab; render();
      });
    });
    var backBtn = app.querySelector('[data-back]');
    if(backBtn){
      backBtn.addEventListener('click', function(){
        state.view = (state.view === 'summary') ? 'order' : state.tab;
        render();
      });
    }
    app.querySelectorAll('[data-open-supplier]').forEach(function(el){
      el.addEventListener('click', function(){
        state.currentSupplierId = el.getAttribute('data-open-supplier');
        state.view = 'order'; render();
      });
    });
    var toSummary = app.querySelector('[data-goto-summary]');
    if(toSummary){ toSummary.addEventListener('click', function(){ state.view='summary'; render(); }); }

    app.querySelectorAll('[data-plus]').forEach(function(el){
      el.addEventListener('click', function(){
        var d = getDraft(state.currentSupplierId); var pid = el.getAttribute('data-plus');
        d.qty[pid] = round2((d.qty[pid]||0) + 1); delete d.sentAsk; render();
      });
    });
    app.querySelectorAll('[data-minus]').forEach(function(el){
      el.addEventListener('click', function(){
        var d = getDraft(state.currentSupplierId); var pid = el.getAttribute('data-minus');
        d.qty[pid] = Math.max(0, round2((d.qty[pid]||0) - 1)); delete d.sentAsk; render();
      });
    });
    // quantità scritta a mano: aggiorna senza ridisegnare, così la tastiera resta aperta
    app.querySelectorAll('[data-qty]').forEach(function(el){
      el.addEventListener('focus', function(){ el.select(); });
      el.addEventListener('input', function(){
        var d = getDraft(state.currentSupplierId);
        var n = parseFloat(el.value.replace(',', '.').replace(/[^0-9.]/g,''));
        d.qty[el.getAttribute('data-qty')] = isNaN(n) ? 0 : Math.min(round2(n), 9999);
        delete d.sentAsk; save();
        var btn = app.querySelector('[data-goto-summary]');
        if(btn) btn.textContent = summaryLabel(draftLines(state.currentSupplierId).length);
      });
      el.addEventListener('blur', function(){
        el.value = fmtNum(getDraft(state.currentSupplierId).qty[el.getAttribute('data-qty')] || 0);
      });
      el.addEventListener('keydown', function(e){ if(e.key === 'Enter') el.blur(); });
    });

    var repeatBtn = app.querySelector('[data-repeat-last]');
    if(repeatBtn){
      repeatBtn.addEventListener('click', function(){
        var sid = repeatBtn.getAttribute('data-repeat-last');
        var s = findSupplier(sid), last = state.lastOrders[sid];
        if(!s || !last) return;
        var d = getDraft(sid);
        if(draftLines(sid).length && !confirm('Sostituire le quantità attuali con quelle dell\'ultimo ordine?')) return;
        d.qty = {};
        s.prodotti.forEach(function(p){ if(last.qty[p.id] > 0) d.qty[p.id] = last.qty[p.id]; });
        delete d.sentAsk; render();
      });
    }

    var noteField = app.querySelector('#noteField');
    if(noteField){
      noteField.addEventListener('input', function(){ getDraft(state.currentSupplierId).note = noteField.value; save(); });
    }

    app.querySelectorAll('[data-send-whatsapp]').forEach(function(el){
      el.addEventListener('click', function(){ sendWhatsApp(el.getAttribute('data-send-whatsapp')); });
    });

    app.querySelectorAll('[data-clear-draft]').forEach(function(el){
      el.addEventListener('click', function(){
        delete state.drafts[el.getAttribute('data-clear-draft')];
        if(state.view === 'summary') state.view = state.tab;
        render();
      });
    });
    app.querySelectorAll('[data-keep-draft]').forEach(function(el){
      el.addEventListener('click', function(){
        var d = state.drafts[el.getAttribute('data-keep-draft')];
        if(d) delete d.sentAsk; render();
      });
    });
    app.querySelectorAll('[data-set-lang]').forEach(function(el){
      el.addEventListener('click', function(){
        var parts = el.getAttribute('data-set-lang').split(':');
        var s = findSupplier(parts[0]); if(!s) return;
        s.lingua = parts[1]; render();
      });
    });

    app.querySelectorAll('[data-toggle-open]').forEach(function(el){
      el.addEventListener('click', function(){
        var id = el.getAttribute('data-toggle-open');
        state.settingsOpenId = (state.settingsOpenId === id) ? null : id;
        render();
      });
    });
    app.querySelectorAll('[data-rename-supplier]').forEach(function(el){
      el.addEventListener('change', function(){
        var s = findSupplier(el.getAttribute('data-rename-supplier'));
        if(s) s.nome = el.value.trim() || s.nome; save();
      });
    });
    app.querySelectorAll('[data-set-phone]').forEach(function(el){
      el.addEventListener('change', function(){
        var s = findSupplier(el.getAttribute('data-set-phone'));
        if(s){ s.telefono = normPhone(el.value); el.value = s.telefono; save(); }
      });
    });
    app.querySelectorAll('[data-toggle-day]').forEach(function(el){
      el.addEventListener('click', function(){
        var parts = el.getAttribute('data-toggle-day').split(':');
        var s = findSupplier(parts[0]); var idx = parseInt(parts[1],10);
        if(!s) return;
        var pos = s.giorniOrdine.indexOf(idx);
        if(pos>-1) s.giorniOrdine.splice(pos,1); else s.giorniOrdine.push(idx);
        render();
      });
    });
    app.querySelectorAll('[data-rename-product]').forEach(function(el){
      el.addEventListener('change', function(){
        var parts = el.getAttribute('data-rename-product').split(':');
        var s = findSupplier(parts[0]); if(!s) return;
        var p = s.prodotti.filter(function(x){return x.id===parts[1];})[0];
        if(p) p.nome = el.value.trim() || p.nome; save();
      });
    });
    app.querySelectorAll('[data-rename-product-es]').forEach(function(el){
      el.addEventListener('change', function(){
        var parts = el.getAttribute('data-rename-product-es').split(':');
        var s = findSupplier(parts[0]); if(!s) return;
        var p = s.prodotti.filter(function(x){return x.id===parts[1];})[0];
        if(p){ p.nomeEs = el.value.trim(); save(); }
      });
    });
    app.querySelectorAll('[data-set-unit]').forEach(function(el){
      el.addEventListener('change', function(){
        var parts = el.getAttribute('data-set-unit').split(':');
        var s = findSupplier(parts[0]); if(!s) return;
        var p = s.prodotti.filter(function(x){return x.id===parts[1];})[0];
        if(!p) return;
        if(el.value) p.unita = el.value; else delete p.unita;
        save();
      });
    });
    app.querySelectorAll('[data-remove-product]').forEach(function(el){
      el.addEventListener('click', function(){
        var parts = el.getAttribute('data-remove-product').split(':');
        var s = findSupplier(parts[0]); if(!s) return;
        s.prodotti = s.prodotti.filter(function(x){return x.id!==parts[1];}); render();
      });
    });
    app.querySelectorAll('[data-add-product]').forEach(function(el){
      el.addEventListener('click', function(){
        var sid = el.getAttribute('data-add-product'); var s = findSupplier(sid);
        var input = app.querySelector('[data-new-product-input="'+sid+'"]');
        if(!s || !input || !input.value.trim()) return;
        s.prodotti.push({ id:'p'+uid(), nome: input.value.trim() }); render();
      });
    });
    app.querySelectorAll('[data-remove-supplier]').forEach(function(el){
      el.addEventListener('click', function(){
        var sid = el.getAttribute('data-remove-supplier');
        if(!confirm('Eliminare questo fornitore e tutti i suoi prodotti?')) return;
        state.suppliers = state.suppliers.filter(function(x){return x.id!==sid;});
        delete state.drafts[sid]; delete state.lastOrders[sid]; state.settingsOpenId = null; render();
      });
    });
    var exportBtn = app.querySelector('#exportBtn');
    if(exportBtn){ exportBtn.addEventListener('click', exportData); }
    var importBtn = app.querySelector('#importBtn'), importFile = app.querySelector('#importFile');
    if(importBtn && importFile){
      importBtn.addEventListener('click', function(){ importFile.click(); });
      importFile.addEventListener('change', function(){
        var f = importFile.files && importFile.files[0]; if(!f) return;
        var reader = new FileReader();
        reader.onload = function(){ importData(String(reader.result)); };
        reader.readAsText(f);
      });
    }

    app.querySelectorAll('[data-new-product-input]').forEach(function(el){
      el.addEventListener('keydown', function(e){
        if(e.key !== 'Enter') return;
        var btn = app.querySelector('[data-add-product="'+el.getAttribute('data-new-product-input')+'"]');
        if(btn) btn.click();
      });
    });
    var newSupplierInput = app.querySelector('#newSupplierInput');
    if(newSupplierInput){
      newSupplierInput.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){ var b = app.querySelector('#addSupplierBtn'); if(b) b.click(); }
      });
    }

    var addSupplierBtn = app.querySelector('#addSupplierBtn');
    if(addSupplierBtn){
      addSupplierBtn.addEventListener('click', function(){
        var input = app.querySelector('#newSupplierInput');
        if(!input || !input.value.trim()) return;
        var newId = 'f'+uid();
        state.suppliers.push({ id:newId, nome:input.value.trim(), telefono:'', giorniOrdine:[], prodotti:[] });
        state.settingsOpenId = newId; render();
      });
    }
  }

  function greeting(es){
    var h = new Date().getHours();
    if(es) return h < 14 ? '¡Buenos días!' : (h < 21 ? '¡Buenas tardes!' : '¡Buenas noches!');
    return h < 14 ? 'Buongiorno!' : 'Buonasera!';
  }

  function sendWhatsApp(supplierId){
    var s = findSupplier(supplierId); if(!s) return;
    var d = getDraft(supplierId);
    var lines = draftLines(supplierId);
    if(!lines.length) return;
    var es = langOf(s) === 'es';
    // tono informale ma da ordinazione, con saluto in base all'ora
    var text = greeting(es) + '\n' + (es ? 'Quería hacer un pedido, por favor:' : 'Vorrei fare un ordine, per favore:') + '\n\n';
    text += lines.map(function(p){ return '- ' + msgLine(p, d.qty[p.id], es); }).join('\n');
    if(d.note && d.note.trim()) text += '\n\n' + d.note.trim();
    text += '\n\n' + (es ? '¡Muchas gracias!' : 'Grazie mille!');
    var url = (s.telefono && s.telefono.length > 5)
      ? 'https://wa.me/' + s.telefono + '?text=' + encodeURIComponent(text)
      : 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
    // al ritorno nell'app chiediamo se svuotare la bozza
    d.sentAsk = true;
    var lastQty = {};
    lines.forEach(function(p){ lastQty[p.id] = d.qty[p.id]; });
    state.lastOrders[supplierId] = { qty: lastQty, at: new Date().toISOString() };
    render();
  }

  function exportData(){
    var data = {
      app: 'ordini-pizzeria', versione: 1, esportatoIl: new Date().toISOString(),
      suppliers: state.suppliers, drafts: state.drafts, lastOrders: state.lastOrders, knownDefaults: state.knownDefaults,
      migratedRealSuppliers: state.migratedRealSuppliers
    };
    var name = 'ordini-pizzeria-backup-' + new Date().toISOString().slice(0,10) + '.json';
    var blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    // sul telefono apre la condivisione (Drive, WhatsApp, email…), altrimenti scarica il file
    try{
      var file = new File([blob], name, { type:'application/json' });
      if(navigator.canShare && navigator.canShare({ files:[file] })){
        navigator.share({ files:[file], title: name }).catch(function(){});
        return;
      }
    }catch(e){}
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
  }

  function importData(text){
    var data;
    try{ data = JSON.parse(text); }catch(e){ alert('File non valido.'); return; }
    var suppliers = data && normalizeSuppliers(data.suppliers);
    if(!suppliers || !suppliers.length){ alert('Questo file non è un backup di Ordini Pizzeria.'); return; }
    if(!confirm('Sostituire tutti i dati attuali con quelli del backup ('+suppliers.length+' fornitori)?')) return;
    state.suppliers = suppliers;
    state.drafts = (data.drafts && typeof data.drafts === 'object') ? data.drafts : {};
    state.lastOrders = (data.lastOrders && typeof data.lastOrders === 'object') ? data.lastOrders : {};
    if(Array.isArray(data.knownDefaults)) state.knownDefaults = data.knownDefaults;
    state.migratedRealSuppliers = true;
    state.settingsOpenId = null;
    render();
    alert('Backup importato.');
  }

  render();
})();
