(function(){
  var STORAGE_KEY = 'pizzeria-ordini-v1';
  var DAY_NAMES = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  var DAY_FULL_IT = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
  var DAY_FULL_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var WEEK = [1,2,3,4,5,6,0]; // la settimana parte dal lunedì
  // "Lun · Mer" oppure, per 3+ giorni di fila, "Lun–Gio"
  function daysLabel(days){
    var sorted = WEEK.filter(function(d){ return days.indexOf(d) > -1; });
    var out = [], i = 0;
    while(i < sorted.length){
      var j = i;
      while(j+1 < sorted.length && WEEK.indexOf(sorted[j+1]) === WEEK.indexOf(sorted[j]) + 1) j++;
      if(j - i >= 2) out.push(DAY_NAMES[sorted[i]]+'–'+DAY_NAMES[sorted[j]]);
      else for(var k=i;k<=j;k++) out.push(DAY_NAMES[sorted[k]]);
      i = j + 1;
    }
    return out.join(' · ');
  }
  var uid = function(){ return Math.random().toString(36).slice(2,9); };

  /* ---------- icone SVG ---------- */
  function ic(name){
    var paths = {
      pizza: '<path d="M4 6l8-3 8 3-8 15z"/><circle cx="11" cy="9" r="1"/><circle cx="14.5" cy="12" r="1"/><circle cx="10" cy="13.5" r="1"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      send: '<path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/>',
      gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2.5 12h3M18.5 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
      plane: '<path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/>',
      trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'
    };
    return '<svg class="icn" viewBox="0 0 24 24">'+(paths[name]||paths.pizza)+'</svg>';
  }
  // ogni fornitore ha un colore suo e le iniziali, come i contatti del telefono
  var BADGE_COLORS = ['#b23a2e','#2f6b73','#a8661c','#5b4a8a','#45573a','#8a3b5e','#3f5f8a','#b5572f','#6b6a2a','#7a4a2e'];
  var SUPPLIER_COLOR = { viera:0, comit:1, alambra:2, emicela:3, indiano:4, aral:5, panaderia:6, herbania:7, barril:8 };
  function badgeColor(id){
    if(SUPPLIER_COLOR[id] !== undefined) return BADGE_COLORS[SUPPLIER_COLOR[id]];
    var h = 0; for(var i=0;i<id.length;i++) h = (h*31 + id.charCodeAt(i)) >>> 0;
    return BADGE_COLORS[h % BADGE_COLORS.length];
  }
  function initials(nome){
    var w = String(nome).replace(/\(.*?\)/g,'').trim() || String(nome);
    return w.replace(/[^A-Za-zÀ-ÿ0-9]/g,'').slice(0,2).toUpperCase() || '?';
  }
  function supplierBadge(s, small){
    return '<div class="supplier-badge'+(small?' small':'')+'" style="background:'+badgeColor(s.id)+'">'+esc(initials(s.nome))+'</div>';
  }

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
    ar11:'Bolsa de papel', ar12:'Bolsa con asa media', ar13:'Bolsa con asa pequeña', ar14:'Bolsa transparente',
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
        { id:'comit', nome:'Comit (Moreno)', telefono:'', giorniOrdine:[1,3], consegne:{1:2, 3:4},
          prodotti:[
            {id:'c1', nome:'Mozzarella'}, {id:'c2', nome:'Salame'}, {id:'c3', nome:'Spianata'},
            {id:'c4', nome:'Farina'}, {id:'c5', nome:'Spolvero'}, {id:'c6', nome:'Gorgonzola'},
            {id:'c7', nome:'Pomodoro'}, {id:'c8', nome:'Cartoni pizza'}
          ] },
        { id:'alambra', nome:'Alambra', telefono:'', giorniOrdine:[1,4], consegne:{1:2, 4:5},
          prodotti:[ {id:'al1', nome:'San Miguel'}, {id:'al2', nome:'Alhambra'}, {id:'al3', nome:'IPA'} ] },
        { id:'emicela', nome:'Emicela', telefono:'', giorniOrdine:[1,3],
          prodotti:[ {id:'em1', nome:'Pollo'}, {id:'em2', nome:'Formaggio gouda'}, {id:'em3', nome:'Latte'} ] },
        { id:'indiano', nome:'Indiano', telefono:'', giorniOrdine:[],
          prodotti:[
            {id:'in1', nome:'Barril'}, {id:'in2', nome:'Bombola gas'}, {id:'in3', nome:'Magners'},
            {id:'in4', nome:'Strongbow'}, {id:'in5', nome:'Topping cocco'}
          ] },
        { id:'aral', nome:'Aral (Detersivi)', telefono:'', giorniOrdine:[1,2,3,4], giorniConsegna:[1,2,3,4,5],
          prodotti:[
            {id:'ar1', nome:'Sacchi 120L'}, {id:'ar2', nome:'Bicchieri 0.7 + Tappi 0.7'},
            {id:'ar3', nome:'Bicchieri 0.4 + Tappi 0.4'}, {id:'ar4', nome:'Film trasparente'},
            {id:'ar5', nome:'Alluminio'}, {id:'ar6', nome:'Tovaglioli bianchi'},
            {id:'ar7', nome:'Bandeja alluminio + coperchi'}, {id:'ar8', nome:'Palettine legno'},
            {id:'ar9', nome:'PET trasparente'}, {id:'ar10', nome:'Vaso smoothie + coperchi'},
            {id:'ar11', nome:'Buste di carta'}, {id:'ar12', nome:'Buste con manici medie'},
            {id:'ar13', nome:'Buste con manici piccole'}, {id:'ar14', nome:'Buste trasparenti'}
          ] },
        { id:'panaderia', nome:'Panaderia (Torte)', telefono:'', giorniOrdine:[],
          prodotti:[ {id:'pn1', nome:'Cocco'}, {id:'pn2', nome:'Chocolate'}, {id:'pn3', nome:'Zanahoria'} ] },
        { id:'herbania', nome:'Herbania Surgelati', telefono:'', giorniOrdine:[],
          prodotti:[ {id:'he1', nome:'Salmone'} ] },
        { id:'barril', nome:'Barril', telefono:'', giorniOrdine:[1,4], consegne:{1:2, 4:5},
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
      s.giorniConsegna = (Array.isArray(s.giorniConsegna) ? s.giorniConsegna : []).filter(function(d){ return d >= 0 && d <= 6; });
      if(!s.giorniConsegna.length) delete s.giorniConsegna;
      if(s.consegne && typeof s.consegne === 'object'){
        var map = {};
        Object.keys(s.consegne).forEach(function(k){
          var orderDay = parseInt(k, 10), deliveryDay = parseInt(s.consegne[k], 10);
          if(orderDay >= 0 && orderDay <= 6 && deliveryDay >= 0 && deliveryDay <= 6) map[orderDay] = deliveryDay;
        });
        s.consegne = map;
      } else delete s.consegne;
      if(!(s.consegna >= 0 && s.consegna <= 6)) delete s.consegna;
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
    // Aral: ordini lun–gio per consegna il venerdì (solo se i giorni non erano ancora impostati)
    if(!savedState.migratedAralDays){
      var aral = savedState.suppliers.filter(function(x){ return x.id==='aral'; })[0];
      if(aral && !aral.giorniOrdine.length){ aral.giorniOrdine = [1,2,3,4]; }
      if(aral && aral.consegna === undefined && !(aral.giorniConsegna && aral.giorniConsegna.length)){ aral.consegna = 5; }
      savedState.migratedAralDays = true;
    }

    // giorni di consegna: Comit, detersivi (Aral), birra Barril e Alambra
    if(!savedState.migratedDeliverySchedule){
      var comit = savedState.suppliers.filter(function(x){ return x.id==='comit'; })[0];
      if(comit){
        var comitDays = comit.giorniOrdine.slice().sort().join(',');
        if(comitDays === '3,5' || !comit.giorniOrdine.length) comit.giorniOrdine = [1, 3];
        if(!comit.consegne) comit.consegne = {1:2, 3:4};
      }
      var aralNow = savedState.suppliers.filter(function(x){ return x.id==='aral'; })[0];
      if(aralNow && !(aralNow.giorniConsegna && aralNow.giorniConsegna.length)){
        aralNow.giorniConsegna = [1, 2, 3, 4, 5];
        if(aralNow.consegna === 5) delete aralNow.consegna;
      }
      ['barril', 'alambra'].forEach(function(id){
        var beer = savedState.suppliers.filter(function(x){ return x.id===id; })[0];
        if(!beer) return;
        if(!beer.giorniOrdine.length) beer.giorniOrdine = [1, 4];
        if(!beer.consegne) beer.consegne = {1:2, 4:5};
      });
      savedState.migratedDeliverySchedule = true;
    }

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
  function deliveryForOrderDay(s, orderDay){
    if(!s.consegne) return null;
    var v = s.consegne[orderDay];
    if(v === undefined) v = s.consegne[String(orderDay)];
    return (v >= 0 && v <= 6) ? v : null;
  }
  function deliveryDays(s){
    var days = [];
    function add(d){ if(d >= 0 && d <= 6 && days.indexOf(d) === -1) days.push(d); }
    if(s.consegne){
      WEEK.forEach(function(orderDay){
        if(s.giorniOrdine.indexOf(orderDay) === -1) return;
        var d = deliveryForOrderDay(s, orderDay);
        if(d !== null) add(d);
      });
    }
    (s.giorniConsegna || []).forEach(add);
    if(s.consegna !== undefined) add(s.consegna);
    return WEEK.filter(function(d){ return days.indexOf(d) > -1; });
  }
  // giorno che finisce nel messaggio: coppia di oggi, altrimenti il prossimo ordine, altrimenti la prossima consegna
  function resolvedDelivery(s, draft){
    var allowed = deliveryDays(s);
    if(draft && draft.consegnaGiorno !== undefined && allowed.indexOf(draft.consegnaGiorno) > -1) return draft.consegnaGiorno;
    var today = todayIdx();
    var paired = deliveryForOrderDay(s, today);
    if(paired !== null && s.giorniOrdine.indexOf(today) > -1) return paired;
    if(s.consegne && s.giorniOrdine.length){
      for(var i = 1; i <= 7; i++){
        var orderDay = (today + i) % 7;
        if(s.giorniOrdine.indexOf(orderDay) === -1) continue;
        var next = deliveryForOrderDay(s, orderDay);
        if(next !== null) return next;
      }
    }
    if(!allowed.length) return null;
    if(allowed.length === 1 && !s.giorniConsegna && !s.consegne) return allowed[0];
    for(var j = 1; j <= 7; j++){
      var day = (today + j) % 7;
      if(allowed.indexOf(day) > -1) return day;
    }
    return allowed[0];
  }
  function scheduleLabel(s){
    if(s.consegne){
      var pairs = [];
      WEEK.forEach(function(d){
        if(s.giorniOrdine.indexOf(d) === -1) return;
        var c = deliveryForOrderDay(s, d);
        if(c === null) return;
        pairs.push(DAY_NAMES[d]+' → '+DAY_NAMES[c]);
      });
      if(pairs.length) return pairs.join(' · ');
    }
    var daysTxt = s.giorniOrdine.length ? daysLabel(s.giorniOrdine) : 'giorni non impostati';
    var cons = deliveryDays(s);
    if(cons.length) daysTxt += ' · consegna ' + daysLabel(cons);
    return daysTxt;
  }
  function todayIdx(){ return new Date().getDay(); }
  function todayLabel(locale){ return new Date().toLocaleDateString(locale || 'it-IT', { weekday:'long', day:'numeric', month:'long' }); }
  // lingua del messaggio WhatsApp: spagnolo se non impostata
  function langOf(s){ return s.lingua === 'it' ? 'it' : 'es'; }
  function hasPhone(s){ return !!(s.telefono && s.telefono.length > 5); }
  // senza numero WhatsApp apre la scelta del contatto: lo chiediamo qui, una volta sola
  function renderPhoneAsk(s){
    if(hasPhone(s)) return '';
    return '<div class="phone-ask">'+
      '<div class="phone-ask-txt">Manca il numero WhatsApp di '+esc(s.nome)+'</div>'+
      '<div class="phone-ask-row">'+
        '<input type="tel" inputmode="tel" placeholder="Es. 600 11 22 33" data-quick-phone="'+s.id+'" aria-label="Numero WhatsApp">'+
        '<button class="btn btn-sm btn-primary" data-save-quick-phone="'+s.id+'">Salva</button>'+
      '</div>'+
      '<div class="phone-ask-hint">Con il numero, WhatsApp apre direttamente la sua chat col messaggio pronto.</div>'+
    '</div>';
  }
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
        '<img class="brand-mark" src="icons/icon.svg" alt="">'+
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
      var draftCount = draftLines(s.id).length, hasDraft = draftCount > 0;
      var daysTxt = scheduleLabel(s);
      return '<button class="supplier-row'+(isToday?' today':'')+'" data-open-supplier="'+s.id+'">'+
        supplierBadge(s)+
        '<div class="supplier-body"><div class="supplier-name">'+esc(s.nome)+'</div><div class="supplier-days">'+daysTxt+(hasPhone(s)?'':' · <span class="no-phone">senza numero</span>')+'</div></div>'+
        ((hasDraft || isToday) ? '<div class="supplier-tags">'+
          (isToday ? '<span class="tag today">Oggi</span>' : '') +
          (hasDraft ? '<span class="tag draft">'+draftCount+(draftCount===1?' articolo':' articoli')+'</span>' : '') +
        '</div>' : '') +
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
      return '<div class="product-row'+(q>0?' has-qty':'')+'"><div class="pname">'+esc(p.nome)+(p.unita?' <span class="unit">'+p.unita+'</span>':'')+'</div>'+
        '<div class="stepper">'+
          '<button class="step-btn" data-minus="'+p.id+'" aria-label="Meno">−</button>'+
          '<input class="qty" type="text" inputmode="'+(p.unita?'decimal':'numeric')+'" value="'+fmtNum(q)+'" data-qty="'+p.id+'" aria-label="Quantità">'+
          '<button class="step-btn" data-plus="'+p.id+'" aria-label="Più">+</button>'+
        '</div></div>';
    }).join('');
    if(!s.prodotti.length) rows = '<div class="empty-state">Nessun prodotto per questo fornitore.<br>Aggiungilo da Impostazioni.</div>';
    var deliveryDay = resolvedDelivery(s, d);
    var deliveryNote = deliveryDay === null ? '' : '<div class="order-delivery">Consegna '+DAY_FULL_IT[deliveryDay]+'</div>';
    var count = draftLines(s.id).length;
    var last = state.lastOrders[s.id];
    var repeat = (last && s.prodotti.length) ?
      '<button class="btn btn-ghost repeat-btn" data-repeat-last="'+s.id+'">↻ Ripeti ultimo ordine ('+shortDate(last.at)+')</button>' : '';
    return repeat+deliveryNote+'<div>'+rows+'</div>'+
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
    return renderSentAsk(s.id)+renderPhoneAsk(s)+'<div class="ticket">'+
        '<div class="head">'+esc(s.nome)+'<span class="date">'+todayLabel()+'</span></div>'+
        linesHtml+
        renderDeliveryPicker(s, d)+
        '<label class="field-label" for="noteField">Note al volo (opzionale)</label>'+
        '<textarea id="noteField" class="note-field" placeholder="Es. consegnate entro le 10">'+esc(d.note||'')+'</textarea>'+
      '</div>'+
      '<div class="bottom-bar"><button class="btn btn-whatsapp" data-send-whatsapp="'+s.id+'" '+(lines.length?'':'disabled')+'>'+ic('plane')+' Genera messaggio WhatsApp</button></div>';
  }

  // ultima bozza eliminata col cestino, recuperabile per qualche secondo
  var undoDelete = null, undoTimer = null;
  function renderUndo(){
    if(!undoDelete) return '';
    var s = findSupplier(undoDelete.supplierId);
    return '<div class="undo-bar"><span>Bozza di '+esc(s ? s.nome : 'fornitore')+' eliminata</span>'+
      '<button class="link-btn" data-undo-delete>Annulla</button></div>';
  }

  function renderInvia(){
    var pending = state.suppliers.filter(function(s){ return draftLines(s.id).length > 0; });
    if(!pending.length) return renderUndo()+'<div class="empty-state">Nessun ordine in bozza al momento.<br>Vai su Fornitori per iniziarne uno.</div>';
    return renderUndo()+pending.map(function(s){
      var lines = draftLines(s.id);
      var isToday = s.giorniOrdine.indexOf(todayIdx()) > -1;
      var itemsTxt = lines.map(function(p){ return p.nome + ' ' + fmtQty(p, getDraft(s.id).qty[p.id]); }).join(' · ');
      return renderSentAsk(s.id)+'<div class="pending-card">'+
        '<div class="pending-head"><span class="nm">'+esc(s.nome)+'</span>'+(isToday?'<span class="tag today">Oggi</span>':'')+
          '<button class="icon-btn trash-btn" data-delete-draft="'+s.id+'" aria-label="Elimina bozza">'+ic('trash')+'</button></div>'+
        '<div class="pending-items">'+esc(itemsTxt)+'</div>'+
        renderPhoneAsk(s)+
        '<div class="pending-actions">'+
          '<button class="btn btn-sm btn-ghost" data-open-supplier="'+s.id+'">Modifica</button>'+
          '<button class="btn btn-sm btn-whatsapp" data-send-whatsapp="'+s.id+'">'+ic('plane')+' Invia</button>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  function renderDeliveryPicker(s, d){
    var days = deliveryDays(s);
    if(!days.length) return '';
    var sel = resolvedDelivery(s, d);
    var es = langOf(s) === 'es';
    var chips = days.map(function(idx){
      return '<button type="button" class="day-chip'+(sel===idx?' on':'')+'" data-draft-delivery="'+s.id+':'+idx+'">'+DAY_NAMES[idx]+'</button>';
    }).join('');
    var hint = sel === null ? '' : (es ? 'Nel messaggio: para el ' + DAY_FULL_ES[sel] : 'Nel messaggio: per ' + DAY_FULL_IT[sel]);
    return '<label class="field-label">Consegna</label><div class="day-chips">'+chips+'</div>'+
      (hint ? '<div class="delivery-hint">'+esc(hint)+'</div>' : '');
  }

  function renderSettings(){
    var cards = state.suppliers.map(function(s){
      var open = state.settingsOpenId === s.id;
      var dayChips = WEEK.map(function(idx){
        var on = s.giorniOrdine.indexOf(idx) > -1;
        return '<button class="day-chip'+(on?' on':'')+'" data-toggle-day="'+s.id+':'+idx+'">'+DAY_NAMES[idx]+'</button>';
      }).join('');
      var deliveryOn = function(idx){
        return (s.giorniConsegna || []).indexOf(idx) > -1 || s.consegna === idx;
      };
      var deliveryChips = WEEK.map(function(idx){
        return '<button class="day-chip'+(deliveryOn(idx)?' on':'')+'" data-set-delivery="'+s.id+':'+idx+'">'+DAY_NAMES[idx]+'</button>';
      }).join('');
      var pairRows = WEEK.filter(function(orderDay){ return s.giorniOrdine.indexOf(orderDay) > -1; }).map(function(orderDay){
        var cur = deliveryForOrderDay(s, orderDay);
        var chips = WEEK.map(function(idx){
          return '<button class="day-chip'+(cur===idx?' on':'')+'" data-set-pair="'+s.id+':'+orderDay+':'+idx+'">'+DAY_NAMES[idx]+'</button>';
        }).join('');
        return '<div class="pair-row"><span class="pair-label">'+DAY_NAMES[orderDay]+' →</span><div class="day-chips">'+chips+'</div></div>';
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
        (pairRows ? '<label class="field-label">Consegna per quel giorno</label>'+pairRows : '')+
        '<label class="field-label">Giorni di consegna</label>'+
        '<div class="hint-block">Per chi consegna più giorni, senza un giorno fisso per ogni ordine. Es. detersivi, da lunedì a venerdì.</div>'+
        '<div class="day-chips">'+deliveryChips+'</div>'+
        '<label class="field-label">Prodotti</label>'+prodRows+
        '<div class="prod-edit-row" style="margin-top:10px;">'+
          '<input type="text" placeholder="Nuovo prodotto…" data-new-product-input="'+s.id+'">'+
          '<button class="small-x" data-add-product="'+s.id+'" style="font-size:1.4rem;">＋</button>'+
        '</div>'+
        '<hr class="thin"><button class="link-btn" data-remove-supplier="'+s.id+'">Elimina fornitore</button>'
      );
      return '<div class="settings-card">'+
        '<div class="settings-head" data-toggle-open="'+s.id+'">'+
          supplierBadge(s, true)+
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
        var row = el.closest('.product-row');
        if(row) row.classList.toggle('has-qty', d.qty[el.getAttribute('data-qty')] > 0);
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
    function saveQuickPhone(sid){
      var s = findSupplier(sid);
      var input = app.querySelector('[data-quick-phone="'+sid+'"]');
      if(!s || !input) return;
      var n = normPhone(input.value);
      if(n.length < 9){ alert('Numero non valido. Scrivilo con o senza prefisso, es. 600 11 22 33.'); input.focus(); return; }
      s.telefono = n; render();
    }
    app.querySelectorAll('[data-save-quick-phone]').forEach(function(el){
      el.addEventListener('click', function(){ saveQuickPhone(el.getAttribute('data-save-quick-phone')); });
    });
    app.querySelectorAll('[data-quick-phone]').forEach(function(el){
      el.addEventListener('keydown', function(e){ if(e.key === 'Enter') saveQuickPhone(el.getAttribute('data-quick-phone')); });
    });
    app.querySelectorAll('[data-delete-draft]').forEach(function(el){
      el.addEventListener('click', function(){
        var sid = el.getAttribute('data-delete-draft');
        if(!state.drafts[sid]) return;
        undoDelete = { supplierId: sid, draft: state.drafts[sid] };
        delete state.drafts[sid];
        clearTimeout(undoTimer);
        undoTimer = setTimeout(function(){ undoDelete = null; if(state.view === 'invia') render(); }, 6000);
        render();
      });
    });
    var undoBtn = app.querySelector('[data-undo-delete]');
    if(undoBtn){
      undoBtn.addEventListener('click', function(){
        if(!undoDelete) return;
        state.drafts[undoDelete.supplierId] = undoDelete.draft;
        undoDelete = null; clearTimeout(undoTimer); render();
      });
    }
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
    app.querySelectorAll('[data-draft-delivery]').forEach(function(el){
      el.addEventListener('click', function(){
        var parts = el.getAttribute('data-draft-delivery').split(':');
        var d = getDraft(parts[0]);
        d.consegnaGiorno = parseInt(parts[1], 10);
        render();
      });
    });
    app.querySelectorAll('[data-set-pair]').forEach(function(el){
      el.addEventListener('click', function(){
        var parts = el.getAttribute('data-set-pair').split(':');
        var s = findSupplier(parts[0]); if(!s) return;
        var orderDay = parseInt(parts[1], 10), deliveryDay = parseInt(parts[2], 10);
        if(!s.consegne) s.consegne = {};
        if(deliveryForOrderDay(s, orderDay) === deliveryDay) delete s.consegne[orderDay];
        else s.consegne[orderDay] = deliveryDay;
        if(!Object.keys(s.consegne).length) delete s.consegne;
        render();
      });
    });
    app.querySelectorAll('[data-set-delivery]').forEach(function(el){
      el.addEventListener('click', function(){
        var parts = el.getAttribute('data-set-delivery').split(':');
        var s = findSupplier(parts[0]); if(!s) return;
        var idx = parseInt(parts[1],10);
        if(s.consegna !== undefined){
          s.giorniConsegna = s.giorniConsegna || [];
          if(s.giorniConsegna.indexOf(s.consegna) === -1) s.giorniConsegna.push(s.consegna);
          delete s.consegna;
        }
        s.giorniConsegna = s.giorniConsegna || [];
        var at = s.giorniConsegna.indexOf(idx);
        if(at > -1) s.giorniConsegna.splice(at, 1); else s.giorniConsegna.push(idx);
        if(!s.giorniConsegna.length) delete s.giorniConsegna;
        render();
      });
    });
    app.querySelectorAll('[data-toggle-day]').forEach(function(el){
      el.addEventListener('click', function(){
        var parts = el.getAttribute('data-toggle-day').split(':');
        var s = findSupplier(parts[0]); var idx = parseInt(parts[1],10);
        if(!s) return;
        var pos = s.giorniOrdine.indexOf(idx);
        if(pos>-1){
          s.giorniOrdine.splice(pos,1);
          if(s.consegne) delete s.consegne[idx];
        } else s.giorniOrdine.push(idx);
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
    var intro;
    var deliveryDay = resolvedDelivery(s, d);
    if(deliveryDay !== null){
      intro = es ? 'Quería hacer un pedido para el ' + DAY_FULL_ES[deliveryDay] + ', por favor:'
                 : 'Vorrei fare un ordine per ' + DAY_FULL_IT[deliveryDay] + ', per favore:';
    } else {
      intro = es ? 'Quería hacer un pedido, por favor:' : 'Vorrei fare un ordine, per favore:';
    }
    var text = greeting(es) + '\n' + intro + '\n\n';
    text += lines.map(function(p){ return '- ' + msgLine(p, d.qty[p.id], es); }).join('\n');
    if(d.note && d.note.trim()) text += '\n\n' + d.note.trim();
    text += '\n\n' + (es ? '¡Muchas gracias!' : 'Grazie mille!');
    var url = hasPhone(s)
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
