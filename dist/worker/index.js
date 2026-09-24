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
    lastGame: String(
      p?.lastGame || "Henüz oyun oynanmadı"
    ).slice(0, 200)
  };
}

function cleanPlayers(players) {
  const result = {};

  if (!players || typeof players !== "object") {
    return result;
  }

  for (const [key, value] of Object.entries(players)) {
    const player = cleanPlayer(value);

    if (player.name) {
      result[player.name] = player;
    }
  }

  return result;
}

function sortPlayers(players) {
  return Object.values(players).sort(
    (a, b) =>
      b.points - a.points ||
      b.correct - a.correct ||
      a.name.localeCompare(b.name, "tr", {
        sensitivity: "base"
      })
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
    quickCorrect: Math.max(
      oldP.quickCorrect,
      newP.quickCorrect
    ),
    radicalCorrect: Math.max(
      oldP.radicalCorrect,
      newP.radicalCorrect
    ),
    exponentCorrect: Math.max(
      oldP.exponentCorrect,
      newP.exponentCorrect
    ),
    lastGame: newP.lastGame || oldP.lastGame
  };
}

async function playersApi(request, env) {
  if (!env.KOKUS_DATA) {
    return json(
      {
        ok: false,
        error: "KOKUS_DATA KV bağlantısı bulunamadı."
      },
      500
    );
  }

  if (request.method === "GET") {
    let players = {};

    try {
      const raw = await env.KOKUS_DATA.get("players");

      if (raw) {
        const parsed = JSON.parse(raw);
        players = cleanPlayers(
          parsed.players || parsed
        );
      }
    } catch {}

    return json({
      ok: true,
      players,
      ranking: sortPlayers(players)
    });
  }

  if (request.method !== "PUT") {
    return json(
      {
        ok: false,
        error: "Yöntem desteklenmiyor."
      },
      405
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        error: "Geçersiz JSON."
      },
      400
    );
  }

  let existing = {};

  try {
    const raw = await env.KOKUS_DATA.get("players");

    if (raw) {
      const parsed = JSON.parse(raw);
      existing = cleanPlayers(
        parsed.players || parsed
      );
    }
  } catch {}

  const incoming = cleanPlayers(body?.players);

  for (const [name, player] of Object.entries(incoming)) {
    const existingName = Object.keys(existing).find(
      key =>
        key.toLocaleLowerCase("tr-TR") ===
        name.toLocaleLowerCase("tr-TR")
    );

    if (existingName) {
      existing[existingName] = mergePlayer(
        existing[existingName],
        player
      );
    } else {
      existing[name] = player;
    }
  }

  const players = cleanPlayers(existing);

  await env.KOKUS_DATA.put(
    "players",
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
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (
        url.pathname === "/api/data/players"
      ) {
        return playersApi(request, env);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return json(
        {
          ok: false,
          error: "Sunucu hatası."
        },
        500
      );
    }
  }
};
