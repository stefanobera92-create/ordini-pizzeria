import { getStore } from "@netlify/blobs";
import webpush from "web-push";

var STORE = "ordini-promemoria";

function env(name){
  if(typeof Netlify !== "undefined" && Netlify.env && Netlify.env.get) return Netlify.env.get(name) || "";
  return process.env[name] || "";
}

function keysReady(){
  return !!(env("VAPID_PUBLIC_KEY") && env("VAPID_PRIVATE_KEY"));
}

function configure(){
  if(!keysReady()) return false;
  webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:ordini@localhost", env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
  return true;
}

function store(){
  return getStore({ name: STORE, consistency: "strong" });
}

function endpointKey(subscription){
  var endpoint = subscription && subscription.endpoint ? String(subscription.endpoint) : "";
  var h = 0;
  for(var i = 0; i < endpoint.length; i++) h = (h * 31 + endpoint.charCodeAt(i)) >>> 0;
  return "sub-" + h.toString(16) + "-" + endpoint.slice(-24).replace(/[^a-zA-Z0-9]/g, "");
}

export default async function(req){
  if(req.method === "GET"){
    return Response.json({ ok: true, publicKey: keysReady() ? env("VAPID_PUBLIC_KEY") : "" });
  }
  if(req.method === "POST"){
    if(!configure()) return Response.json({ ok: false, error: "chiavi assenti" }, { status: 503 });
    var body = await req.json();
    if(!body || !body.subscription || !body.subscription.endpoint){
      return Response.json({ ok: false }, { status: 400 });
    }
    var key = endpointKey(body.subscription);
    await store().setJSON(key, {
      subscription: body.subscription,
      fornitori: Array.isArray(body.fornitori) ? body.fornitori : [],
      updatedAt: new Date().toISOString()
    });
    return Response.json({ ok: true });
  }
  return new Response("Method not allowed", { status: 405 });
}

export const config = {
  path: "/api/promemoria",
  method: ["GET", "POST"]
};
