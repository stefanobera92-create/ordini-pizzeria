# Ordini Pizzeria — riepilogo per Claude Code

## Cos'è
App per pizzaioli/gestori di pizzeria: selezione rapida dei prodotti da ordinare ai
fornitori abituali e generazione automatica di un messaggio WhatsApp precompilato
da inviare. Pensata per essere usata a fine turno, con tasti grandi.

È già una **PWA installabile** (icona in home screen, funziona offline, si apre a
schermo intero senza barra del browser). Non è ancora pubblicata: è solo cartella
di progetto locale.

## Struttura del progetto
```
index.html        punto d'ingresso, collega css/js, registra il service worker
manifest.json      metadati PWA (nome, icone, colori, display standalone)
sw.js              service worker: cache dei file per il funzionamento offline
css/app.css        tutto lo stile (tema chiaro/scuro via CSS variables)
js/app.js          logica dell'app (vanilla JS, nessun framework, nessuna build)
icons/             icone 192px e 512px (placeholder, migliorabili)
```
Nessuna dipendenza esterna da installare, nessun bundler: è HTML/CSS/JS puro,
apribile anche solo facendo doppio click su index.html (il service worker
funziona solo servito via http/https, non da file://).

## Come funziona (architettura)
- Stato dell'app tenuto in un unico oggetto JS (`state`), salvato in
  `localStorage` ad ogni modifica (`save()`), ricaricato all'avvio (`load()`).
- Tre schermate principali accessibili da una tab bar in basso: **Fornitori**,
  **Da inviare**, **Impostazioni**. Più due schermate "push" (Ordine e Riepilogo)
  raggiunte toccando un fornitore.
- **Fornitori**: elenco fornitori con icona per categoria, tag "Oggi" se è uno dei
  giorni in cui quel fornitore accetta ordini (`giorniOrdine`, indici 0-6 come
  `Date.getDay()`), tag "Bozza" se c'è già una quantità impostata.
- **Ordine**: lista prodotti del fornitore con stepper +/-, quantità salvate per
  fornitore in `state.drafts[supplierId].qty[productId]`.
- **Riepilogo**: solo i prodotti con quantità > 0, campo note libere, tasto che
  apre `wa.me/<numero>?text=...` (o `api.whatsapp.com/send?text=...` se il
  fornitore non ha un numero impostato) con il testo dell'ordine già scritto.
- **Da inviare**: aggrega tutti i fornitori con una bozza in corso, per avere il
  quadro completo a fine turno e inviare da lì senza rientrare in ogni fornitore.
- **Impostazioni**: rinomina fornitori, numero WhatsApp, giorni di ordine,
  aggiunta/rimozione/rinomina prodotti, aggiunta/eliminazione fornitori.
- I fornitori e prodotti di partenza sono hardcoded in `defaultState()` dentro
  `js/app.js`. Ogni volta che i prodotti di default sono stati aggiornati in una
  sessione precedente, `mergeNewDefaults()` fa da migrazione per chi ha già
  l'app installata, così non perde le proprie modifiche.

## Limiti noti / cosa manca
- **Nessun invio realmente programmato**: l'app non può inviare messaggi in
  background da sola (è una pagina web statica, non un'app nativa con
  background task). Oggi si limita a segnalare visivamente quando è il giorno
  giusto ("Oggi"). Per un vero invio automatico servirebbe un'app nativa o un
  backend con un servizio WhatsApp Business API.
- **Nessuna sincronizzazione multi-dispositivo**: tutto vive in `localStorage`
  del singolo telefono/browser. Se serve usarla da più dispositivi o da più
  persone in cucina, serve un backend (anche minimo, es. Supabase/Firebase) al
  posto di `localStorage`.
- **Idee ancora da implementare** (erano nella richiesta originale):
  - Modelli preimpostati (es. "Carico del giovedì") per precompilare quantità
    tipiche.
  - Bottone "Sottoscorta" per segnare a servizio un prodotto in esaurimento,
    evidenziato poi in rosso nella schermata Ordine.
  - Tracciamento vuoti/resi da restituire ai fornitori.
- **Icone**: generate a bassa fedeltà (placeholder), da rifare se l'app diventa
  pubblica.
- Non c'è nessun sistema di test o CI.

## Prossimi passi suggeriti
1. Inizializzare un repo Git e pubblicarlo su GitHub (come per le altre app:
   Erbario, Dizionario cocktail, ecc.).
2. Deploy statico su Netlify (basta puntare alla root del repo, nessuna build
   richiesta) per avere un URL fisso da aprire/installare sul telefono.
3. Valutare **Capacitor** se in futuro si vuole pubblicarla su Play Store/App
   Store come app nativa vera e propria (riusa questo stesso codice HTML/CSS/JS
   con una shell nativa attorno).
4. Se serve condivisione tra più dispositivi/persone, sostituire `localStorage`
   con un piccolo backend (Supabase è probabilmente il più rapido da integrare
   con questo stack).
