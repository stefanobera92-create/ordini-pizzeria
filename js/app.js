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
  var SUPPLIER_ICONS = { aral:'box', panaderia:'wheat', herbania:'box', barril:'bottle' };
  function iconForSupplier(id){ return ic(SUPPLIER_ICONS[id] || 'pizza'); }

  function defaultState(){
    return {
      tab: 'fornitori', view: 'fornitori',
      currentSupplierId: null, settingsOpenId: null,
      suppliers: [
        { id:'viera', nome:'Viera', telefono:'', giorniOrdine:[], prodotti:[] },
        { id:'comit', nome:'Comit', telefono:'', giorniOrdine:[], prodotti:[] },
        { id:'alambra', nome:'Alambra', telefono:'', giorniOrdine:[], prodotti:[] },
        { id:'emicela', nome:'Emicela', telefono:'', giorniOrdine:[], prodotti:[] },
        { id:'indiano', nome:'Indiano', telefono:'', giorniOrdine:[], prodotti:[] },
        { id:'aral', nome:'Aral (Detersivi)', telefono:'', giorniOrdine:[], prodotti:[] },
        { id:'panaderia', nome:'Panaderia (Torte)', telefono:'', giorniOrdine:[], prodotti:[] },
        { id:'herbania', nome:'Herbania Surgelati', telefono:'', giorniOrdine:[], prodotti:[] },
        { id:'barril', nome:'Barril', telefono:'', giorniOrdine:[], prodotti:[] }
      ],
      drafts: {}
    };
  }

  var state = load();

  function load(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return defaultState();
      var parsed = JSON.parse(raw);
      if(!parsed || !parsed.suppliers) return defaultState();
      parsed.tab = 'fornitori'; parsed.view = 'fornitori';
      parsed.currentSupplierId = null; parsed.settingsOpenId = null;
      if(!parsed.drafts) parsed.drafts = {};
      mergeNewDefaults(parsed);
      return parsed;
    }catch(e){ return defaultState(); }
  }
  function mergeNewDefaults(savedState){
    // migrazione: sostituiamo le vecchie categorie generiche con i fornitori reali
    var OLD_IDS = ['farine','latticini','imballaggi','bevande','salumi','carne-pesce'];
    if(!savedState.migratedRealSuppliers){
      savedState.suppliers = savedState.suppliers.filter(function(s){ return OLD_IDS.indexOf(s.id) === -1; });
      OLD_IDS.forEach(function(id){ delete savedState.drafts[id]; });
      savedState.migratedRealSuppliers = true;
    }

    var defaults = defaultState();
    defaults.suppliers.forEach(function(defSupplier){
      var existing = savedState.suppliers.filter(function(s){return s.id===defSupplier.id;})[0];
      if(!existing){ savedState.suppliers.push(defSupplier); return; }
      defSupplier.prodotti.forEach(function(defProd){
        var hasIt = existing.prodotti.some(function(p){
          return p.id === defProd.id || p.nome.trim().toLowerCase() === defProd.nome.trim().toLowerCase();
        });
        if(!hasIt) existing.prodotti.push(defProd);
      });
    });
  }
  function save(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }
  function getDraft(supplierId){
    if(!state.drafts[supplierId]) state.drafts[supplierId] = { qty:{}, note:'' };
    return state.drafts[supplierId];
  }
  function draftLines(supplierId){
    var s = findSupplier(supplierId); if(!s) return [];
    var d = state.drafts[supplierId]; if(!d) return [];
    return s.prodotti.filter(function(p){ return (d.qty[p.id]||0) > 0; });
  }
  function findSupplier(id){ return state.suppliers.filter(function(s){return s.id===id;})[0] || null; }
  function todayIdx(){ return new Date().getDay(); }
  function todayLabel(){ return new Date().toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' }); }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function render(){
    save();
    var app = document.getElementById('app');
    app.innerHTML = '<div class="app-shell">' + renderBar() + '<div class="screens">' + renderScreen() + '</div>' + renderNav() + '</div>';
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
        (isToday ? '<span class="tag today">Oggi</span>' : (hasDraft ? '<span class="tag draft">Bozza</span>' : '')) +
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
      return '<div class="product-row"><div class="pname">'+esc(p.nome)+'</div>'+
        '<div class="stepper">'+
          '<button class="step-btn" data-minus="'+p.id+'" aria-label="Meno">−</button>'+
          '<div class="qty">'+q+'</div>'+
          '<button class="step-btn" data-plus="'+p.id+'" aria-label="Più">+</button>'+
        '</div></div>';
    }).join('');
    if(!s.prodotti.length) rows = '<div class="empty-state">Nessun prodotto per questo fornitore.<br>Aggiungilo da Impostazioni.</div>';
    var count = draftLines(s.id).length;
    return '<div>'+rows+'</div>'+
      '<div class="bottom-bar"><button class="btn btn-primary" data-goto-summary>Vedi riepilogo'+(count?(' · '+count+' articoli'):'')+'</button></div>';
  }

  function renderSummary(){
    var s = findSupplier(state.currentSupplierId);
    if(!s){ state.view='fornitori'; return renderFornitori(); }
    var d = getDraft(s.id);
    var lines = draftLines(s.id);
    var linesHtml = lines.map(function(p){
      return '<div class="ticket-line"><span>'+esc(p.nome)+'</span><span class="q">x'+d.qty[p.id]+'</span></div>';
    }).join('');
    if(!lines.length) linesHtml = '<div class="empty-state" style="padding:10px 0;">Nessun articolo selezionato.</div>';
    return '<div class="ticket">'+
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
      var itemsTxt = lines.map(function(p){ return p.nome + ' x' + getDraft(s.id).qty[p.id]; }).join(' · ');
      return '<div class="pending-card">'+
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
        return '<div class="prod-edit-row"><input type="text" value="'+esc(p.nome)+'" data-rename-product="'+s.id+':'+p.id+'">'+
          '<button class="small-x" data-remove-product="'+s.id+':'+p.id+'">✕</button></div>';
      }).join('');
      var body = !open ? '' : (
        '<label class="field-label">Nome fornitore</label>'+
        '<input type="text" value="'+esc(s.nome)+'" data-rename-supplier="'+s.id+'">'+
        '<label class="field-label">Numero WhatsApp (con prefisso, es. 34600000000)</label>'+
        '<input type="text" inputmode="tel" placeholder="34600000000" value="'+esc(s.telefono||'')+'" data-set-phone="'+s.id+'">'+
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
        d.qty[pid] = (d.qty[pid]||0) + 1; render();
      });
    });
    app.querySelectorAll('[data-minus]').forEach(function(el){
      el.addEventListener('click', function(){
        var d = getDraft(state.currentSupplierId); var pid = el.getAttribute('data-minus');
        d.qty[pid] = Math.max(0, (d.qty[pid]||0) - 1); render();
      });
    });

    var noteField = app.querySelector('#noteField');
    if(noteField){
      noteField.addEventListener('input', function(){ getDraft(state.currentSupplierId).note = noteField.value; save(); });
    }

    app.querySelectorAll('[data-send-whatsapp]').forEach(function(el){
      el.addEventListener('click', function(){ sendWhatsApp(el.getAttribute('data-send-whatsapp')); });
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
        if(s) s.telefono = el.value.replace(/[^0-9]/g,''); save();
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
        delete state.drafts[sid]; state.settingsOpenId = null; render();
      });
    });
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

  function sendWhatsApp(supplierId){
    var s = findSupplier(supplierId); if(!s) return;
    var d = getDraft(supplierId);
    var lines = draftLines(supplierId);
    if(!lines.length) return;
    var text = 'Ordine ' + s.nome + ' - ' + todayLabel() + '\n\n';
    text += lines.map(function(p){ return d.qty[p.id] + 'x ' + p.nome; }).join('\n');
    if(d.note && d.note.trim()) text += '\n\nNote: ' + d.note.trim();
    text += '\n\nGrazie!';
    var url = (s.telefono && s.telefono.length > 5)
      ? 'https://wa.me/' + s.telefono + '?text=' + encodeURIComponent(text)
      : 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  }

  render();
})();
