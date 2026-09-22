const KEY = 'kok-us-academy-v1';
let state = {
  players: {},
  current: null
};

let game = null;
let saving = false;

const badges = [
  ['🏆','İlk Doğru','İlk doğru cevabını ver.','correct',1],
  ['🔥','Seri Ustası','5 cevaplık combo yap.','bestCombo',5],
  ['⚡','Hızlı Matematikçi','Hızlı Turda 5 doğru yap.','quickCorrect',5],
  ['√','Kök Uzmanı','25 köklü ifade çöz.','radicalCorrect',25],
  ['x²','Üs Ustası','25 üslü ifade çöz.','exponentCorrect',25],
  ['👑','Matematik Şampiyonu','500 puana ulaş.','points',500]
];

/*
 * ============================================================
 * MERKEZİ VERİ SİSTEMİ
 * Artık oyuncu sıralaması sadece tarayıcıda tutulmuyor.
 * Veriler /api/data/players üzerinden sunucuya gönderiliyor.
 * ============================================================
 */

async function loadPlayers() {
  try {
    const response = await fetch('/api/data/players', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Oyuncular alınamadı: HTTP ${response.status}`);
    }

    const data = await response.json();

    state.players = data.players || {};
    state.current = localStorage.getItem('kok-current-player') || null;

    render();
  } catch (error) {
    console.error('Merkezi oyuncu verisi alınamadı:', error);

    /*
     * Sunucu geçici olarak cevap vermezse oyuncunun kendi cihazındaki
     * son kayıt tamamen kaybolmasın.
     *
     * Ancak sıralama için sunucu verisi esas kaynaktır.
     */
    try {
      const old = JSON.parse(
        localStorage.getItem(KEY) || '{"players":{},"current":null}'
      );

      state.players = old.players || {};
      state.current = old.current || null;

      render();
    } catch {
      state = {
        players: {},
        current: null
      };

      render();
    }
  }
}


async function save() {
  /*
   * Aktif oyuncunun adı cihazda tutulabilir.
   * Puan/istatistik gibi önemli bilgiler sunucuya gider.
   */
  if (state.current) {
    localStorage.setItem('kok-current-player', state.current);
  } else {
    localStorage.removeItem('kok-current-player');
  }

  if (saving) return;

  saving = true;

  try {
    const response = await fetch('/api/data/players', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        players: state.players
      })
    });

    if (!response.ok) {
      throw new Error(`Oyuncular kaydedilemedi: HTTP ${response.status}`);
    }

    /*
     * Sunucudan dönen güncel liste varsa onu kullan.
     * Böylece iki farklı cihaz aynı anda işlem yaptığında
     * mümkün olduğunca güncel veriyle çalışırız.
     */
    const data = await response.json();

    if (data.players) {
      state.players = data.players;
    }

  } catch (error) {
    console.error('Merkezi kayıt hatası:', error);

    /*
     * Geçici bağlantı sorunu durumunda yerel yedek.
     * Bu veri sıralamanın ana kaynağı DEĞİLDİR.
     */
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(state)
      );
    } catch {}
  } finally {
    saving = false;
  }
}


function player() {
  return state.current && state.players[state.current];
}


function fresh(name) {
  return {
    name,
    points: 0,
    correct: 0,
    wrong: 0,
    games: 0,
    bestCombo: 0,
    combo: 0,
    quickCorrect: 0,
    radicalCorrect: 0,
    exponentCorrect: 0,
    lastGame: 'Henüz oyun oynanmadı'
  };
}


function pct(p) {
  let n = p.correct + p.wrong;
  return n ? `%${Math.round(p.correct / n * 100)}` : '—';
}


/*
 * Aynı puanda sıralama her cihazda aynı olsun.
 * Önce puan, sonra doğru sayısı, sonra kullanıcı adı.
 */
function sortedPlayers() {
  return Object.values(state.players).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.correct !== a.correct) {
      return b.correct - a.correct;
    }

    return String(a.name).localeCompare(
      String(b.name),
      'tr',
      { sensitivity: 'base' }
    );
  });
}


function render() {
  const p = player();

  const stats = document.querySelector('#stats');

  if (stats) {
    stats.innerHTML = [
      ['SORU BANKASI', '220'],
      ['TOPLAM PUAN', p ? p.points : '—'],
      ['BAŞARILAR', p ? badges.filter(b => p[b[3]] >= b[4]).length + '/6' : '0/6'],
      ['COMBO', p ? 'x' + p.combo : 'x0'],
      ['SON OYUN', p ? p.lastGame : 'Oyuncu bekleniyor']
    ]
      .map(x => `<article><small>${x[0]}</small><b>${x[1]}</b></article>`)
      .join('');
  }


  const leaderRows = document.querySelector('#leaderRows');

  if (leaderRows) {
    const rows = sortedPlayers();

    leaderRows.innerHTML = rows.length
      ? rows.map((p, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><b>${escapeHtml(p.name)}</b></td>
            <td>${p.points}</td>
            <td>${p.correct}</td>
            <td>${pct(p)}</td>
            <td>x${p.bestCombo}</td>
          </tr>
        `).join('')
      : `
          <tr>
            <td class="empty" colspan="6">
              Henüz gerçek oyuncu kaydı yok. İlk sırayı sen al!
            </td>
          </tr>
        `;
  }


  const badgeGrid = document.querySelector('#badgeGrid');

  if (badgeGrid) {
    badgeGrid.innerHTML = badges.map(b =>
      `<article class="badge ${p && p[b[3]] >= b[4] ? 'unlocked' : ''}">
        <strong>${b[0]}</strong>
        <b>${b[1]}</b>
        <small>
          ${b[2]}
          ${p && p[b[3]] >= b[4] ? '✓' : '🔒'}
        </small>
      </article>`
    ).join('');
  }
}


function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function modal(html) {
  const m = document.querySelector('#modal');

  if (!m) return;

  m.innerHTML = `<div class="dialog">${html}</div>`;
  m.classList.remove('hidden');
}


function close() {
  const modalElement = document.querySelector('#modal');

  if (modalElement) {
    modalElement.classList.add('hidden');
  }

  if (game?.timer) {
    clearInterval(game.timer);
  }

  game = null;
}


function identify(callback) {
  if (player()) {
    callback();
    return;
  }

  modal(`
    <button class="close" onclick="close()">×</button>

    <span class="eyebrow">OYUNCU PROFİLİ</span>

    <h2>Oyuna başlamak için adını yaz</h2>

    <p>
      İlerlemen aynı kullanıcı adıyla merkezi olarak korunur.
    </p>

    <input
      id="username"
      maxlength="22"
      placeholder="Kullanıcı adı"
      autofocus
    >

    <button class="primary" onclick="createPlayer()">
      Akademiye Katıl
    </button>
  `);


  window.createPlayer = async () => {
    const input = document.querySelector('#username');

    if (!input) return;

    const name = input.value.trim();

    if (!name) {
      input.focus();
      return;
    }

    if (name.length < 2) {
      alert('Kullanıcı adı en az 2 karakter olmalı.');
      return;
    }

    /*
     * Kullanıcı adını standartlaştırıyoruz.
     * Böylece "Mustafa", "mustafa" gibi iki ayrı kullanıcı
     * oluşması engellenir.
     */
    const existingName = Object.keys(state.players).find(
      key => key.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR')
    );

    if (existingName) {
      state.current = existingName;
    } else {
      state.current = name;
      state.players[name] = fresh(name);
    }

    localStorage.setItem(
      'kok-current-player',
      state.current
    );

    render();

    await save();

    close();

    callback();
  };
}


function start(mode = 'ten', topic = null) {
  identify(() => begin(mode, topic));
}


function begin(mode, topic) {
  const p = player();

  if (!p) return;

  let qs = questionBank.filter(
    q => !topic || q.topic === topic
  );

  if (mode === 'boss') {
    qs = qs.filter(q => q.boss);
  }

  if (mode === 'mastery') {
    qs = qs.sort((a, b) => a.points - b.points);
  } else {
    qs = shuffled(qs);
  }

  game = {
    mode,
    qs,
    index: 0,
    answered: 0,
    correct: 0,
    topic,
    time: mode === 'quick' ? 60 : null
  };

  p.games++;

  p.lastGame = ({
    quick: 'Hızlı Tur devam ediyor',
    ten: '10 Soru devam ediyor',
    streak: 'Seri Modu devam ediyor',
    mastery: 'Ustalaşma devam ediyor',
    boss: 'Boss Sorusu devam ediyor'
  })[mode];

  save();

  showQuestion();

  if (mode === 'quick') {
    game.timer = setInterval(() => {
      if (!game) return;

      game.time--;

      if (game.time <= 0) {
        finish();
      } else {
        showQuestion();
      }
    }, 1000);
  }
}


function showQuestion() {
  if (!game) return;

  if (
    (game.mode === 'ten' && game.answered >= 10) ||
    game.index >= game.qs.length
  ) {
    return finish();
  }

  const q = game.qs[game.index];

  modal(`
    <button class="close" onclick="close()">×</button>

    <div class="game-top">
      <span>
        ${
          game.mode === 'quick'
            ? 'HIZLI TUR'
            : game.mode === 'boss'
              ? 'BOSS SORUSU'
              : 'MATEMATİK TURU'
        }
        • ${q.difficulty.toUpperCase()}
      </span>

      <span class="timer">
        ${game.time !== null ? '⏱ ' + game.time + ' sn' : ''}
      </span>

      <span>
        Puan: ${player().points}
        • Combo: x${player().combo}
      </span>
    </div>

    <div class="question">
      ${q.question}
    </div>

    <div class="choices">
      ${q.options.map(a => `
        <button
          class="choice"
          onclick="answer(${JSON.stringify(a)})"
        >
          ${a}
        </button>
      `).join('')}
    </div>

    <div id="result"></div>
  `);
}


async function answer(a) {
  if (!game) return;

  const q = game.qs[game.index];
  const p = player();

  if (!p) return;

  /*
   * Çift tıklama ile aynı sorunun iki kere işlenmesini engelle.
   */
  const buttons = document.querySelectorAll('.choice');

  if ([...buttons].some(b => b.disabled)) {
    return;
  }

  let correct = a === q.answer;

  game.answered++;

  if (correct) {
    p.correct++;
    game.correct++;

    p.combo++;
    p.bestCombo = Math.max(
      p.bestCombo,
      p.combo
    );

    if (q.topic === 'köklü') {
      p.radicalCorrect++;
    } else {
      p.exponentCorrect++;
    }

    if (game.mode === 'quick') {
      p.quickCorrect++;
    }

    const bonus = ({
      2: 5,
      3: 10,
      5: 25,
      10: 50
    })[p.combo] || 0;

    p.points += q.points + bonus;

    document.querySelector('#result').innerHTML = `
      <div class="feedback good">
        <b>✅ DOĞRU!</b>
        +${q.points}
        ${bonus ? ' + ' + bonus + ' combo bonus' : ''}
        puan.

        <br>
        <small>Kural: ${q.rule}</small>

        <br>

        <button class="primary" onclick="nextQuestion()">
          Sonraki soru →
        </button>
      </div>
    `;

  } else {

    p.wrong++;
    p.combo = 0;

    document.querySelector('#result').innerHTML = `
      <div class="feedback bad">
        <b>❌ YANLIŞ!</b>

        Doğru cevap:
        <strong>${q.answer}</strong>

        <hr>

        <b>Kısa çözüm</b>
        <br>
        ${q.solution}

        <br>

        <small>
          Kullanılan kural: ${q.rule}
        </small>

        <br>

        <button class="primary" onclick="nextQuestion()">
          Sonraki soru →
        </button>
      </div>
    `;

    if (game.mode === 'streak') {
      await save();
      render();
      return finish();
    }
  }

  buttons.forEach(b => {
    b.disabled = true;
  });

  render();

  /*
   * Kritik nokta:
   * Her cevap sunucuya kaydediliyor.
   */
  await save();
}


function nextQuestion() {
  if (!game) return;

  game.index++;

  showQuestion();
}


function finish() {
  if (!game) return;

  const p = player();

  if (!p) return;

  if (game.timer) {
    clearInterval(game.timer);
  }

  p.lastGame =
    `${game.correct} doğru • ${game.answered} soru`;

  save();
  render();

  modal(`
    <button class="close" onclick="close()">×</button>

    <span class="eyebrow">
      TUR TAMAMLANDI
    </span>

    <h2>
      Harika çalışma, ${escapeHtml(p.name)}!
    </h2>

    <div class="profile-list">
      <div>
        Bu tur doğru
        <b>${game.correct}</b>
      </div>

      <div>
        Toplam puan
        <b>${p.points}</b>
      </div>

      <div>
        En iyi combo
        <b>x${p.bestCombo}</b>
      </div>

      <div>
        Başarı oranı
        <b>${pct(p)}</b>
      </div>
    </div>

    <p>
      Rozetlerin ve ilerlemen kaydedildi.
    </p>

    <button class="primary" onclick="close()">
      Akademiye dön
    </button>
  `);

  game = null;
}


/*
 * ============================================================
 * SAYFA BAŞLANGICI
 * ============================================================
 */

document.querySelectorAll('[data-mode]').forEach(b => {
  b.onclick = () => start(b.dataset.mode);
});


document.querySelectorAll('[data-topic]').forEach(b => {
  b.onclick = () => start('ten', b.dataset.topic);
});


const startButton = document.querySelector('[data-action=start]');

if (startButton) {
  startButton.onclick = () => start();
}


const mobileNav = document.querySelector('.mobile-nav');

if (mobileNav) {
  mobileNav.onclick = () => {
    document.querySelector('header')?.classList.toggle('open');
  };
}


/*
 * Önce merkezi veriyi al.
 */
loadPlayers();
