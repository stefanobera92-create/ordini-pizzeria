import { getStore } from "@netlify/blobs";
import webpush from "web-push";

var STORE = "ordini-promemoria";
var DAY_NAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

function env(name){
  if(typeof Netlify !== "undefined" && Netlify.env && Netlify.env.get) return Netlify.env.get(name) || "";
  return process.env[name] || "";
}

function canaryHour(date){
  var part = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Atlantic/Canary", hour: "2-digit", hourCycle: "h23"
  }).formatToParts(date).filter(function(p){ return p.type === "hour"; })[0];
  return part ? part.value : "";
}

function canaryDate(date){
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Atlantic/Canary", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

function tomorrowWeekday(date){
  var iso = canaryDate(date);
  var local = new Date(iso + "T12:00:00Z");
  return (local.getUTCDay() + 1) % 7;
}

export default async function(){
  var now = new Date();
  if(canaryHour(now) !== "18") return new Response("non è l'ora");
  var publicKey = env("VAPID_PUBLIC_KEY");
  var privateKey = env("VAPID_PRIVATE_KEY");
  if(!publicKey || !privateKey) return new Response("chiavi assenti");
  webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:ordini@localhost", publicKey, privateKey);

  var blobs = getStore({ name: STORE, consistency: "strong" });
  var stamp = await blobs.get("last-sent", { type: "text" });
  var today = canaryDate(now);
  if(stamp === today) return new Response("già inviato");

  var day = tomorrowWeekday(now);
  var listed = await blobs.list();
  var sent = 0;
  for(var i = 0; i < listed.blobs.length; i++){
    var item = listed.blobs[i];
    if(item.key.indexOf("sub-") !== 0) continue;
    var saved = await blobs.get(item.key, { type: "json" });
    if(!saved || !saved.subscription) continue;
    var names = (saved.fornitori || []).filter(function(s){
      return Array.isArray(s.giorniOrdine) && s.giorniOrdine.indexOf(day) > -1;
    }).map(function(s){ return s.nome; });
    if(!names.length) continue;
    var body = "Domani, " + DAY_NAMES[day] + ", si ordina da " + names.join(", ") + ".";
    try{
      await webpush.sendNotification(saved.subscription, JSON.stringify({
        title: "Ordini di domani",
        body: body
      }));
      sent++;
    }catch(err){
      if(err && (err.statusCode === 404 || err.statusCode === 410)) await blobs.delete(item.key);
    }
  }
  await blobs.set("last-sent", today);
  return new Response("inviati " + sent);
}

export const config = {
  schedule: "0 * * * *"
};
