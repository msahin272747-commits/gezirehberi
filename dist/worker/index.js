const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });

function cleanPlayer(p) {
  return {
    name: String(p?.name || "").trim().slice(0, 22),
    deviceId: String(p?.deviceId || "").trim().slice(0, 80),
    points: Number(p?.points) || 0,
    correct: Number(p?.correct) || 0,
    wrong: Number(p?.wrong) || 0,
    games: Number(p?.games) || 0,
    bestCombo: Number(p?.bestCombo) || 0,
    combo: Number(p?.combo) || 0,
    quickCorrect: Number(p?.quickCorrect) || 0,
    radicalCorrect: Number(p?.radicalCorrect) || 0,
    exponentCorrect: Number(p?.exponentCorrect) || 0,
    lastGame: String(p?.lastGame || "Henüz oyun oynanmadı").slice(0, 200),
    visible: p?.visible !== false,
    active: p?.active !== false,
    bannedAt: p?.bannedAt ? String(p.bannedAt).slice(0, 64) : ""
  };
}

function cleanPlayers(players) {
  const result = {};
  if (!players || typeof players !== "object") return result;
  for (const [key, value] of Object.entries(players)) {
    const player = cleanPlayer(value);
    if (player.name) result[player.name] = player;
  }
  return result;
}

function sortPlayers(players) {
  return Object.values(players).filter(p => p.visible !== false && p.active !== false).sort(
    (a, b) =>
      b.points - a.points ||
      b.correct - a.correct ||
      a.name.localeCompare(b.name, "tr", { sensitivity: "base" })
  );
}

function mergePlayer(oldPlayer, newPlayer) {
  const oldP = cleanPlayer(oldPlayer);
  const newP = cleanPlayer(newPlayer);
  return {
    name: newP.name || oldP.name,
    points: Math.max(oldP.points, newP.points),
    correct: Math.max(oldP.correct, newP.correct),
    wrong: Math.max(oldP.wrong, newP.wrong),
    games: Math.max(oldP.games, newP.games),
    bestCombo: Math.max(oldP.bestCombo, newP.bestCombo),
    combo: newP.combo,
    quickCorrect: Math.max(oldP.quickCorrect, newP.quickCorrect),
    radicalCorrect: Math.max(oldP.radicalCorrect, newP.radicalCorrect),
    exponentCorrect: Math.max(oldP.exponentCorrect, newP.exponentCorrect),
    lastGame: newP.lastGame || oldP.lastGame,
    visible: newP.visible,
    active: newP.active,
    bannedAt: newP.bannedAt || oldP.bannedAt,
    deviceId: newP.deviceId || oldP.deviceId
  };
}

async function playersApi(request, env) {
  if (!env.KOKUS_DATA) {
    return json({ ok: false, error: "KOKUS_DATA KV bağlantısı bulunamadı." }, 500);
  }

  if (request.method === "GET") {
    let players = {};
    try {
      const raw = await env.KOKUS_DATA.get("players");
      if (raw) {
        const parsed = JSON.parse(raw);
        players = cleanPlayers(parsed.players || parsed);
      }
    } catch {}
    return json({ ok: true, players, ranking: sortPlayers(players) });
  }

  if (request.method !== "PUT") {
    return json({ ok: false, error: "Yöntem desteklenmiyor." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Geçersiz JSON." }, 400);
  }

  let existing = {};
  try {
    const raw = await env.KOKUS_DATA.get("players");
    if (raw) {
      const parsed = JSON.parse(raw);
      existing = cleanPlayers(parsed.players || parsed);
    }
  } catch {}

  const incoming = cleanPlayers(body?.players);

  for (const [name, player] of Object.entries(incoming)) {
    const existingName = Object.keys(existing).find(
      key =>
        key.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR") ||
        (player.deviceId && existing[key].deviceId === player.deviceId)
    );
    if (existingName) {
      const merged = mergePlayer(existing[existingName], player);
      if (existingName !== name) {
        delete existing[existingName];
        existing[name] = merged;
      } else {
        existing[existingName] = merged;
      }
    } else {
      existing[name] = player;
    }
  }

  const players = cleanPlayers(existing);

  await env.KOKUS_DATA.put(
    "players",
    JSON.stringify({ players, updatedAt: new Date().toISOString() })
  );

  return json({ ok: true, players, ranking: sortPlayers(players) });
}


function adminCookie(token) {
  return `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}
function clearAdminCookie() {
  return "admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}
function base64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");
}
function fromBase64url(s) {
  const b = atob(s.replace(/-/g,"+").replace(/_/g,"/") + "=".repeat((4-s.length%4)%4));
  const out = new Uint8Array(b.length);
  for(let i=0;i<b.length;i++) out[i]=b.charCodeAt(i);
  return out;
}
async function adminSign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return base64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}
async function adminSessionToken(secret) {
  const payload = base64url(new TextEncoder().encode(JSON.stringify({exp:Date.now()+28800000})));
  return payload + "." + await adminSign(payload, secret);
}
async function isAdmin(request, env) {
  if(!env.ADMIN_PASSWORD) return false;
  const header = request.headers.get("cookie") || "";
  const match = header.match(/(?:^|;\\s*)admin_session=([^;]+)/);
  if(!match) return false;
  const [payload,sig] = match[1].split(".");
  if(!payload || !sig) return false;
  try {
    const expected = await adminSign(payload, env.ADMIN_PASSWORD);
    if(sig !== expected) return false;
    const data = JSON.parse(new TextDecoder().decode(fromBase64url(payload)));
    return Number(data.exp) > Date.now();
  } catch { return false; }
}
async function adminLogin(request, env) {
  if(request.method !== "POST") return json({ok:false,error:"Yöntem desteklenmiyor."},405);
  if(!env.ADMIN_PASSWORD) return json({ok:false,error:"ADMIN_PASSWORD secret tanımlı değil."},503);
  let body; try { body=await request.json(); } catch { return json({ok:false,error:"Geçersiz JSON."},400); }
  const password=String(body?.password||"");
  if(!password || password !== env.ADMIN_PASSWORD) return json({ok:false,error:"Yönetici şifresi yanlış."},401);
  const token=await adminSessionToken(env.ADMIN_PASSWORD);
  return new Response(JSON.stringify({success:true}),{status:200,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","set-cookie":adminCookie(token)}});
}
async function adminSession(request, env) {
  return json({success:await isAdmin(request,env)});
}
async function adminLogout() {
  return new Response(JSON.stringify({success:true}),{status:200,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","set-cookie":clearAdminCookie()}});
}
async function adminUsers(request, env) {
  if(!await isAdmin(request,env)) return json({ok:false,error:"Yönetici oturumu gerekli."},401);
  if(!env.KOKUS_DATA) return json({ok:false,error:"KOKUS_DATA KV bağlantısı bulunamadı."},500);
  let players={};
  try {
    const raw=await env.KOKUS_DATA.get("players");
    if(raw){ const parsed=JSON.parse(raw); players=cleanPlayers(parsed.players||parsed); }
  } catch {}
  if(request.method==="GET") return json({ok:true,users:Object.values(players).sort((a,b)=>b.points-a.points)});
  let body={};
  try{body=await request.json()}catch{return json({ok:false,error:"Geçersiz JSON."},400)}
  const name=String(body?.name||"").trim().slice(0,22);
  const key=Object.keys(players).find(k=>k.toLocaleLowerCase("tr-TR")===name.toLocaleLowerCase("tr-TR"));
  if(!key) return json({ok:false,error:"Kullanıcı bulunamadı."},404);
  if(request.method==="DELETE"){
    delete players[key];
  } else if(request.method==="PATCH"){
    if(typeof body.visible==="boolean") players[key].visible=body.visible;
    if(typeof body.active==="boolean") players[key].active=body.active;
    if(typeof body.newName==="string" && body.newName.trim()){
      const newName=body.newName.trim().slice(0,22);
      if(newName!==key && players[newName]) return json({ok:false,error:"Bu kullanıcı adı zaten kullanılıyor."},409);
      const updated=players[key]; updated.name=newName; delete players[key]; players[newName]=updated;
    }
  } else return json({ok:false,error:"Yöntem desteklenmiyor."},405);
  await env.KOKUS_DATA.put("players",JSON.stringify({players,updatedAt:new Date().toISOString()}));
  return json({ok:true,users:Object.values(players).sort((a,b)=>b.points-a.points)});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/data/players") {
        return playersApi(request, env);
      }
      if (url.pathname === "/api/admin/login") return adminLogin(request, env);
      if (url.pathname === "/api/admin/session") return adminSession(request, env);
      if (url.pathname === "/api/admin/logout") return adminLogout();
      if (url.pathname === "/api/admin/users") return adminUsers(request, env);


      if (url.pathname === "/api/research/events") {
        if (!env.KOKUS_DATA) return json({ ok:false, error:"KOKUS_DATA KV bağlantısı bulunamadı." },500);
        if (request.method !== "POST") return json({ ok:false, error:"Yöntem desteklenmiyor." },405);
        let body;
        try { body = await request.json(); } catch { return json({ok:false,error:"Geçersiz JSON."},400); }
        const participantId=String(body?.participantId||"").slice(0,64);
        const phase=String(body?.phase||"adaptive").slice(0,32);
        const group=String(body?.group||"adaptive").slice(0,32);
        const questionId=String(body?.questionId||"").slice(0,80);
        const topic=String(body?.topic||"").slice(0,32);
        const difficulty=String(body?.difficulty||"").slice(0,32);
        const correct=!!body?.correct;
        const responseTimeMs=Math.min(120000,Math.max(0,Number(body?.responseTimeMs)||0));
        if(!participantId||!questionId||!topic) return json({ok:false,error:"Eksik araştırma verisi."},400);
        const event={participantId,phase,group,questionId,topic,difficulty,correct,responseTimeMs,timestamp:new Date().toISOString()};
        const id=crypto.randomUUID();
        await env.KOKUS_DATA.put("research:event:"+id,JSON.stringify(event),{expirationTtl:60*60*24*180});
        return json({ok:true,id});
      }

      if (url.pathname === "/api/research/summary") {
        if (!env.KOKUS_DATA) return json({ ok:false, error:"KOKUS_DATA KV bağlantısı bulunamadı." },500);
        if (request.method !== "GET") return json({ok:false,error:"Yöntem desteklenmiyor."},405);
        const listed=await env.KOKUS_DATA.list({prefix:"research:event:",limit:1000});
        const events=[];
        for(const key of listed.keys||[]){
          try{
            const value=await env.KOKUS_DATA.get(key.name);
            if(value) events.push(JSON.parse(value));
          }catch{}
        }
        const participants=new Set(events.map(e=>e.participantId));
        const byPhase={};
        for(const e of events){
          const p=byPhase[e.phase] ||= {events:0,correct:0,totalResponseMs:0};
          p.events++; p.correct+=e.correct?1:0; p.totalResponseMs+=Number(e.responseTimeMs)||0;
        }
        Object.values(byPhase).forEach(p=>{p.accuracy=p.events?Math.round(p.correct/p.events*100):0;p.avgResponseMs=p.events?Math.round(p.totalResponseMs/p.events):0;delete p.totalResponseMs;});
        return json({ok:true,eventCount:events.length,participantCount:participants.size,byPhase});
      }

      if (url.pathname === "/api/research/export") {
        if (!env.KOKUS_DATA) return json({ ok:false, error:"KOKUS_DATA KV bağlantısı bulunamadı." },500);
        if (request.method !== "GET") return json({ok:false,error:"Yöntem desteklenmiyor."},405);
        const key=String(request.headers.get("x-research-key")||"");
        if (!env.RESEARCH_ADMIN_KEY || key!==env.RESEARCH_ADMIN_KEY) return json({ok:false,error:"Araştırma yönetici anahtarı gerekli."},401);
        const listed=await env.KOKUS_DATA.list({prefix:"research:event:",limit:1000});
        const events=[];
        for(const item of listed.keys||[]){
          try{const value=await env.KOKUS_DATA.get(item.name);if(value)events.push(JSON.parse(value));}catch{}
        }
        return json({ok:true,events});
      }

      // English 9 only: math/root asset handling remains unchanged.
      if (
        url.pathname === "/english9" ||
        url.pathname === "/english9/" ||
        url.pathname === "/english"
      ) {
        return env.ASSETS.fetch(
          new Request(new URL("/english9/index.html", request.url), request)
        );
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ ok: false, error: "Sunucu hatası." }, 500);
    }
  }
};
