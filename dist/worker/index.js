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
    points: Number(p?.points) || 0,
    correct: Number(p?.correct) || 0,
    wrong: Number(p?.wrong) || 0,
    games: Number(p?.games) || 0,
    bestCombo: Number(p?.bestCombo) || 0,
    combo: Number(p?.combo) || 0,
    quickCorrect: Number(p?.quickCorrect) || 0,
    radicalCorrect: Number(p?.radicalCorrect) || 0,
    exponentCorrect: Number(p?.exponentCorrect) || 0,
    lastGame: String(p?.lastGame || "Henüz oyun oynanmadı").slice(0, 200)
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
  return Object.values(players).sort(
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
    lastGame: newP.lastGame || oldP.lastGame
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
      key => key.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR")
    );
    if (existingName) {
      existing[existingName] = mergePlayer(existing[existingName], player);
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/data/players") {
        return playersApi(request, env);
      }

      if (url.pathname === "/api/research/events") {
        if (!env.KOKUS_DATA) return json({ ok:false, error:"KOKUS_DATA KV bağlantısı bulunamadı." },500);
        if (request.method !== "POST") return json({ ok:false, error:"Yöntem desteklenmiyor." },405);
        let body;
        try { body = await request.json(); } catch { return json({ok:false,error:"Geçersiz JSON."},400); }
        const participantId=String(body?.participantId||"").slice(0,64);
        const phase=String(body?.phase||"adaptive").slice(0,32);
        const questionId=String(body?.questionId||"").slice(0,80);
        const topic=String(body?.topic||"").slice(0,32);
        const difficulty=String(body?.difficulty||"").slice(0,32);
        const correct=!!body?.correct;
        const responseTimeMs=Math.min(120000,Math.max(0,Number(body?.responseTimeMs)||0));
        if(!participantId||!questionId||!topic) return json({ok:false,error:"Eksik araştırma verisi."},400);
        const event={participantId,phase,questionId,topic,difficulty,correct,responseTimeMs,timestamp:new Date().toISOString()};
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
