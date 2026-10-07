/* KÖK & ÜS — özgün ve zor soru bankası */
(function(){
  const VERSION='extra-bank-v3';
  if(typeof data==='undefined'||!Array.isArray(data.questions))return;
  if(localStorage.getItem('kokus-extra-bank-version')===VERSION)return;

  const old=data.questions||[];
  const seenText=new Set();
  data.questions=old.filter(q=>{
    const key=String(q.topic||'')+'|'+String(q.text||'').trim().toLocaleLowerCase('tr-TR');
    if(!q.text||seenText.has(key))return false;
    seenText.add(key);return true;
  }).filter(q=>!String(q.id||'').startsWith('extra-'));

  let seq=1;
  const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=(i*17+seq*13)% (i+1);[x[i],x[j]]=[x[j],x[i]]}return x};
  const add=(topic,text,answer,wrong,difficulty='zor',kind='yorum')=>{
    const key=topic+'|'+text.trim().toLocaleLowerCase('tr-TR');
    if(seenText.has(key))return false;
    const correct=String(answer), opts=[...new Set(wrong.map(String).filter(x=>x!==correct))].slice(0,3);
    if(opts.length<3)return false;
    const all=shuffle([correct,...opts]), correctAnswer='ABCD'[all.indexOf(correct)];
    data.questions.push({id:'extra-'+seq++,topic,text,options:all,correctAnswer,explanation:'Sonucu bulurken üs/kök kurallarını sırayla uygula ve işlemi tekrar kontrol et.',difficulty,kind});
    seenText.add(key);return true;
  };

  // 400 özgün üslü ifade sorusu
  let made=0;
  for(let a=2;a<=9&&made<400;a++)for(let b=2;b<=9&&made<400;b++)for(let c=1;c<=6&&made<400;c++){
    if(add('uslu',`${a}^${b} · ${a}^${c} işleminin üslü gösterimi nedir?`,`${a}^${b+c}`,[`${a}^${b*c}`,`${a}^${b-c}`,`${a}^${b+c+1}`],'zor'))made++;
    if(made>=400)break;
    if(add('uslu',`${a}^${b} ÷ ${a}^${c} işleminin sonucu nedir?`,`${a}^${b-c}`,[`${a}^${b+c}`,`${a}^${b*c}`,`${a}^${c-b}`],'zor'))made++;
    if(made>=400)break;
    if(add('uslu',`(${a}^${b})^${c} işleminin üslü gösterimi nedir?`,`${a}^${b*c}`,[`${a}^${b+c}`,`${a}^${b+c+1}`,`${a}^${b-c}`],'zor'))made++;
    if(made>=400)break;
    if(add('uslu',`${a}^${b} · ${a}^${c} ÷ ${a}^${c-1} işleminin sonucu nedir?`,`${a}^${b+1}`,[`${a}^${b+c}`,`${a}^${b}`,`${a}^${b+2}`],'zor'))made++;
  }

  // 400 özgün köklü ifade sorusu
  made=0;
  for(let a=2;a<=12&&made<400;a++)for(let b=2;b<=10&&made<400;b++){
    const r1=a*a*b, r2=b*b*a;
    if(add('koklu',`√${r1} sayısının en sade hâli nedir?`,`${a}√${b}`,[`${b}√${a}`,`√${r1+a}`,`${a+1}√${b}`],'zor'))made++;
    if(made>=400)break;
    if(add('koklu',`√${r1} + √${r2} işleminin sonucu nedir?`,`${a+b}√${a*b}`,[`${a+b}√${b}`,`${a*b}√${a+b}`,`${a+b+1}√${a*b}`],'zor'))made++;
    if(made>=400)break;
    if(add('koklu',`√${r1} · √${b} işleminin sonucu nedir?`,a*b,[a+b,a*b*b,a*a*b],'zor'))made++;
    if(made>=400)break;
    if(add('koklu',`(${a}√${b})² işleminin sonucu nedir?`,a*a*b,[a*b,a*a+b,a*b*b],'zor'))made++;
  }

  // 200 özgün Boss sorusu
  made=0;
  for(let a=2;a<=7&&made<200;a++)for(let b=2;b<=6&&made<200;b++)for(let c=2;c<=5&&made<200;c++){
    const ans=a**(b+c);
    if(add('boss',`[${a}^${b} × ${a}^${c}]² ÷ ${a}^{${b+c}} işleminin sonucu nedir?`,String(ans),[String(a**(b+c-1)),String(a**(b*c-1)),String(a**(b*c+1))],'boss','boss'))made++;
    if(made>=200)break;
    const root=a*a*b;
    if(add('boss',`√${root} × √${b} işleminin sonucu nedir?`,a*b,[a+b,a*a*b,b*b*a],'boss','boss'))made++;
  }

  // Aynı soruyu tekrar göstermemek için geçmiş hafızasını büyüt.
  data.users=(data.users||[]).map(u=>({...u,history:(u.history||[]).slice(-1000)}));
  try{localStorage.setItem('kokus_data_v13',JSON.stringify(data));localStorage.setItem('kokus-extra-bank-version',VERSION)}catch(e){}
  location.reload();
})();