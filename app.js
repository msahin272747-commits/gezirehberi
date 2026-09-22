const KEY='kok-us-academy-v1'; let state=JSON.parse(localStorage.getItem(KEY)||'{"players":{},"current":null}'); let game=null;
const badges=[['🏆','İlk Doğru','İlk doğru cevabını ver.','correct',1],['🔥','Seri Ustası','5 cevaplık combo yap.','bestCombo',5],['⚡','Hızlı Matematikçi','Hızlı Turda 5 doğru yap.','quickCorrect',5],['√','Kök Uzmanı','25 köklü ifade çöz.','radicalCorrect',25],['x²','Üs Ustası','25 üslü ifade çöz.','exponentCorrect',25],['👑','Matematik Şampiyonu','500 puana ulaş.','points',500]];

function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function player(){return state.current&&state.players[state.current]}
function fresh(name){return {name,points:0,correct:0,wrong:0,games:0,bestCombo:0,combo:0,quickCorrect:0,radicalCorrect:0,exponentCorrect:0,lastGame:'Henüz oyun oynanmadı'}}
function pct(p){let n=p.correct+p.wrong;return n?`%${Math.round(p.correct/n*100)}`:'—'}

function render(){
 const p=player();
 document.querySelector('#stats').innerHTML=[
  ['SORU BANKASI','220'],
  ['TOPLAM PUAN',p?p.points:'—'],
  ['BAŞARILAR',p?badges.filter(b=>p[b[3]]>=b[4]).length+'/6':'0/6'],
  ['COMBO',p?'x'+p.combo:'x0'],
  ['SON OYUN',p?p.lastGame:'Oyuncu bekleniyor']
 ].map(x=>`<article><small>${x[0]}</small><b>${x[1]}</b></article>`).join('');

 const rows=Object.values(state.players).sort((a,b)=>b.points-a.points);
 document.querySelector('#leaderRows').innerHTML=rows.length
 ?rows.map((p,i)=>`<tr><td>${i+1}</td><td><b>${p.name}</b></td><td>${p.points}</td><td>${p.correct}</td><td>${pct(p)}</td><td>x${p.bestCombo}</td></tr>`).join('')
 :'<tr><td class="empty" colspan="6">Henüz gerçek oyuncu kaydı yok. İlk sırayı sen al!</td></tr>';

 document.querySelector('#badgeGrid').innerHTML=badges.map(b=>
 `<article class="badge ${p&&p[b[3]]>=b[4]?'unlocked':''}">
 <strong>${b[0]}</strong><b>${b[1]}</b>
 <small>${b[2]} ${p&&p[b[3]]>=b[4]?'✓':'🔒'}</small>
 </article>`).join('');
}

function modal(html){
 let m=document.querySelector('#modal');
 m.innerHTML=`<div class="dialog">${html}</div>`;
 m.classList.remove('hidden');
}

function close(){
 document.querySelector('#modal').classList.add('hidden');
 if(game?.timer)clearInterval(game.timer);
 game=null;
}

function identify(callback){
 if(player())return callback();

 modal(`
 <button class="close" onclick="close()">×</button>
 <span class="eyebrow">OYUNCU PROFİLİ</span>
 <h2>Oyuna başlamak için adını yaz</h2>
 <p>İlerlemen aynı kullanıcı adıyla bu cihazda korunur.</p>
 <input id="username" maxlength="22" placeholder="Kullanıcı adı" autofocus>
 <button class="primary" onclick="createPlayer()">Akademiye Katıl</button>
 `);

 window.createPlayer=()=>{
  let name=document.querySelector('#username').value.trim();
  if(!name)return document.querySelector('#username').focus();

  state.current=name;
  if(!state.players[name])state.players[name]=fresh(name);

  save();
  render();
  close();
  callback();
 }
}

function start(mode='ten',topic=null){
 identify(()=>begin(mode,topic));
}

function begin(mode,topic){
 let p=player();
 let qs=questionBank.filter(q=>!topic||q.topic===topic);

 if(mode==='boss')qs=qs.filter(q=>q.boss);
 if(mode==='mastery')qs=qs.sort((a,b)=>a.points-b.points);
 else qs=shuffled(qs);

 game={
  mode,
  qs,
  index:0,
  answered:0,
  correct:0,
  topic,
  time:mode==='quick'?60:null
 };

 p.games++;
 p.lastGame=({
  quick:'Hızlı Tur devam ediyor',
  ten:'10 Soru devam ediyor',
  streak:'Seri Modu devam ediyor',
  mastery:'Ustalaşma devam ediyor',
  boss:'Boss Sorusu devam ediyor'
 })[mode];

 save();
 showQuestion();

 if(mode==='quick'){
  game.timer=setInterval(()=>{
   game.time--;
   if(game.time<=0)finish();
   else showQuestion();
  },1000);
 }
}

function showQuestion(){
 if(!game)return;

 if((game.mode==='ten'&&game.answered>=10)||game.index>=game.qs.length)
  return finish();

 let q=game.qs[game.index];

 modal(`
 <button class="close" onclick="close()">×</button>
 <div class="game-top">
 <span>${game.mode==='quick'?'HIZLI TUR':game.mode==='boss'?'BOSS SORUSU':'MATEMATİK TURU'} • ${q.difficulty.toUpperCase()}</span>
 <span class="timer">${game.time!==null?'⏱ '+game.time+' sn':''}</span>
 <span>Puan: ${player().points} • Combo: x${player().combo}</span>
 </div>
 <div class="question">${q.question}</div>
 <div class="choices">
 ${q.options.map(a=>`<button class="choice" onclick="answer(${JSON.stringify(a)})">${a}</button>`).join('')}
 </div>
 <div id="result"></div>
 `);
}

function answer(a){
 if(!game)return;

 let q=game.qs[game.index];
 let p=player();
 let correct=a===q.answer;

 game.answered++;

 if(correct){
  p.correct++;
  game.correct++;
  p.combo++;
  p.bestCombo=Math.max(p.bestCombo,p.combo);

  p[q.topic==='köklü'?'radicalCorrect':'exponentCorrect']++;

  if(game.mode==='quick')p.quickCorrect++;

  let bonus=({2:5,3:10,5:25,10:50})[p.combo]||0;
  p.points+=q.points+bonus;

  document.querySelector('#result').innerHTML=`
  <div class="feedback good">
  <b>✅ DOĞRU!</b> +${q.points}${bonus?' + '+bonus+' combo bonus':''} puan.
  <br><small>Kural: ${q.rule}</small>
  <br><button class="primary" onclick="nextQuestion()">Sonraki soru →</button>
  </div>`;
 }else{
  p.wrong++;
  p.combo=0;

  document.querySelector('#result').innerHTML=`
  <div class="feedback bad">
  <b>❌ YANLIŞ!</b> Doğru cevap: <strong>${q.answer}</strong>
  <hr>
  <b>Kısa çözüm</b><br>${q.solution}
  <br><small>Kullanılan kural: ${q.rule}</small>
  <br><button class="primary" onclick="nextQuestion()">Sonraki soru →</button>
  </div>`;

  if(game.mode==='streak')return finish();
 }

 save();
 render();
 document.querySelectorAll('.choice').forEach(b=>b.disabled=true);
}

function nextQuestion(){
 game.index++;
 showQuestion();
}

function finish(){
 if(!game)return;

 let p=player();

 if(game.timer)clearInterval(game.timer);

 p.lastGame=`${game.correct} doğru • ${game.answered} soru`;

 save();
 render();

 modal(`
 <button class="close" onclick="close()">×</button>
 <span class="eyebrow">TUR TAMAMLANDI</span>
 <h2>Harika çalışma, ${p.name}!</h2>
 <div class="profile-list">
 <div>Bu tur doğru<b>${game.correct}</b></div>
 <div>Toplam puan<b>${p.points}</b></div>
 <div>En iyi combo<b>x${p.bestCombo}</b></div>
 <div>Başarı oranı<b>${pct(p)}</b></div>
 </div>
 <p>Rozetlerin ve ilerlemen kaydedildi.</p>
 <button class="primary" onclick="close()">Akademiye dön</button>
 `);

 game=null;
}

document.querySelectorAll('[data-mode]').forEach(b=>
 b.onclick=()=>start(b.dataset.mode)
);

document.querySelectorAll('[data-topic]').forEach(b=>
 b.onclick=()=>start('ten',b.dataset.topic)
);

document.querySelector('[data-action=start]').onclick=()=>start();

document.querySelector('.mobile-nav').onclick=()=>
 document.querySelector('header').classList.toggle('open');

render();
