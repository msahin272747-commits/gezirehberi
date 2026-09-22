const DATA_KEY = "players";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function cleanPlayer(player) {
  return {
    name: String(player.name || "").trim().slice(0, 22),
    points: Number(player.points) || 0,
    correct: Number(player.correct) || 0,
    wrong: Number(player.wrong) || 0,
    games: Number(player.games) || 0,
    bestCombo: Number(player.bestCombo) || 0,
    combo: Number(player.combo) || 0,
    quickCorrect: Number(player.quickCorrect) || 0,
    radicalCorrect: Number(player.radicalCorrect) || 0,
    exponentCorrect: Number(player.exponentCorrect) || 0,
    lastGame: String(player.lastGame || "Henüz oyun oynanmadı").slice(0, 200)
  };
}

function cleanPlayers(players) {
  const result = {};

  if (!players || typeof players !== "object") {
    return result;
  }

  for (const [key, value] of Object.entries(players)) {
    if (!value || typeof value !== "object") continue;

    const player = cleanPlayer(value);

    if (!player.name) continue;

    result[player.name] = player;
  }

  return result;
}

function sortPlayers(players) {
  return Object.values(players).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.correct !== a.correct) {
      return b.correct - a.correct;
    }

    return a.name.localeCompare(
      b.name,
      "tr",
      { sensitivity: "base" }
    );
  });
}

export async function onRequestGet(context) {
  try {
    const env = context.env;

    if (!env.KOKUS_DATA) {
      return json({
        ok: false,
        error: "KOKUS_DATA KV bağlantısı bulunamadı."
      }, 500);
    }

    const raw = await env.KOKUS_DATA.get(DATA_KEY);

    let players = {};

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        players = cleanPlayers(parsed.players || parsed);
      } catch {
        players = {};
      }
    }

    return json({
      ok: true,
      players,
      ranking: sortPlayers(players)
    });

  } catch (error) {
    console.error("GET /api/data/players:", error);

    return json({
      ok: false,
      error: "Oyuncu verileri alınamadı."
    }, 500);
  }
}


export async function onRequestPut(context) {
  try {
    const env = context.env;

    if (!env.KOKUS_DATA) {
      return json({
        ok: false,
        error: "KOKUS_DATA KV bağlantısı bulunamadı."
      }, 500);
    }

    let body;

    try {
      body = await context.request.json();
    } catch {
      return json({
        ok: false,
        error: "Geçersiz JSON."
      }, 400);
    }

    const incoming = cleanPlayers(body.players);

    /*
     * Mevcut merkezi veriyi önce oku.
     * Böylece farklı cihazlardan gelen kayıtların
     * tamamını yanlışlıkla silmeyiz.
     */
    const existingRaw = await env.KOKUS_DATA.get(DATA_KEY);

    let existing = {};

    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        existing = cleanPlayers(parsed.players || parsed);
      } catch {
        existing = {};
      }
    }

    /*
     * Gelen oyuncuları merkezi listeyle birleştir.
     */
    for (const [name, incomingPlayer] of Object.entries(incoming)) {
      const existingName = Object.keys(existing).find(
        key =>
          key.toLocaleLowerCase("tr-TR") ===
          name.toLocaleLowerCase("tr-TR")
      );

      if (existingName && existingName !== name) {
        delete existing[existingName];
      }

      existing[name] = incomingPlayer;
    }

    const players = cleanPlayers(existing);

    await env.KOKUS_DATA.put(
      DATA_KEY,
      JSON.stringify({
        players,
        updatedAt: new Date().toISOString()
      })
    );

    return json({
      ok: true,
      players,
      ranking: sortPlayers(players)
    });

  } catch (error) {
    console.error("PUT /api/data/players:", error);

    return json({
      ok: false,
      error: "Oyuncu verileri kaydedilemedi."
    }, 500);
  }
}
