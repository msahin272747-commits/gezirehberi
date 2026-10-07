/* KÖK & ÜS — geniş soru bankası. Mevcut oyun akışına dokunmadan bankaya yeni sorular ekler. */
(function(){
  const VERSION='extra-bank-v1';
  if(localStorage.getItem('kokus-extra-bank-version')===VERSION)return;
  if(!window.data || !Array.isArray(window.data.questions))return;

  const questions=window.data.questions;
  const used=new Set(questions.map(q=>q.id));
  let seed=7919;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const add=(id,topic,text,answer,options,difficulty='orta',explanation='')=>{
    if(used.has(id))return;
    const all=shuffle([String(answer),...options.map(String)]).slice(0,4);
    const correctAnswer='ABCD'[all.indexOf(String(answer))];
    questions.push({id,topic,text,options:all,correctAnswer,explanation:explanation||('Doğru sonuç: '+answer+'. İşlemi üs/kök kurallarını kullanarak kontrol et.'),difficulty,kind:difficulty==='zor'?'yorum':'işlem'});
    used.add(id);
  };

  // 500 yeni üslü ifade sorusu
  for(let i=1;i<=500;i++){
    const a=2+(i%8), b=2+(Math.floor(i/3)%5), c=2+(Math.floor(i/7)%4);
    const type=i%10;
    if(type===0){
      const n=b+c, ans=Math.pow(a,n);
      add('extra-uslu-'+i,'uslu',`${a}^${b} × ${a}^${c} işleminin sonucu?`,ans,[Math.pow(a,n-1),Math.pow(a,n+1),Math.pow(a,b+c-1)],i%3===0?'zor':'orta');
    }else if(type===1){
      const n=Math.max(1,b-c), ans=Math.pow(a,n);
      add('extra-uslu-'+i,'uslu',`${a}^${b} ÷ ${a}^${c} işleminin sonucu?`,ans,[Math.pow(a,n+1),Math.pow(a,n+2),Math.pow(a,Math.max(0,b-c+2))],i%3===0?'zor':'orta');
    }else if(type===2){
      const n=b*c, ans=Math.pow(a,n);
      add('extra-uslu-'+i,'uslu',`(${a}^${b})^${c} işleminin sonucu?`,ans,[Math.pow(a,n-1),Math.pow(a,b+c),Math.pow(a,n+1)],i%2===0?'zor':'orta');
    }else if(type===3){
      const ans=Math.pow(a,b);
      add('extra-uslu-'+i,'uslu',`${a}^${b} sayısının değeri kaçtır?`,ans,[ans+a,Math.pow(a,b-1),Math.pow(a,b+1)],i%4===0?'zor':'orta');
    }else if(type===4){
      const ans=1/Math.pow(a,b);
      add('extra-uslu-'+i,'uslu',`${a}^(-${b}) işleminin sonucu?`,`1/${Math.pow(a,b)}`,[`1/${Math.pow(a,b-1)}`,String(Math.pow(a,b)),`1/${Math.pow(a,b+1)}`],'zor');
    }else if(type===5){
      const ans=Math.pow(a,b);
      add('extra-uslu-'+i,'uslu',`(${a} × ${a})^${b} işleminin sonucu?`,Math.pow(a,2*b),[ans,Math.pow(a,2*b-1),Math.pow(a,2*b+1)],i%2===0?'zor':'orta');
    }else if(type===6){
      const p=b+c, ans=`10^${p}`;
      add('extra-uslu-'+i,'uslu',`10^${b} × 10^${c} işleminin üslü gösterimi?`,ans,[`10^${p-1}`,`10^${p+1}`,`10^${b*c}`],i%2===0?'zor':'orta');
    }else if(type===7){
      const p=Math.max(0,b-c), ans=`10^${p}`;
      add('extra-uslu-'+i,'uslu',`10^${b} ÷ 10^${c} işleminin üslü gösterimi?`,ans,[`10^${p+1}`,`10^${b+c}`,`10^${b*c}`],'zor');
    }else if(type===8){
      const ans=Math.pow(2,b);
      add('extra-uslu-'+i,'uslu',`2^${b} + 2^${b} işleminin sonucu?`,2*ans,[ans,4*ans,Math.pow(2,b+2)],i%3===0?'zor':'orta');
    }else{
      const ans=Math.pow(a,b)+Math.pow(a,b);
      add('extra-uslu-'+i,'uslu',`${a}^${b} + ${a}^${b} işleminin sonucu?`,ans,[Math.pow(a,b+1),Math.pow(a,2*b),Math.pow(a,b)],'zor');
    }
  }

  // 500 yeni köklü ifade sorusu
  for(let i=1;i<=500;i++){
    const a=2+(i%8), b=2+(Math.floor(i/4)%9), c=2+(Math.floor(i/9)%7);
    const type=i%8;
    if(type===0){
      const rad=a*a*b, ans=`${a}√${b}`;
      add('extra-koklu-'+i,'koklu',`√${rad} en sade hâliyle nedir?`,ans,[`${b}√${a}`,`√${rad+a}`,`${a+1}√${b}`],i%3===0?'zor':'orta');
    }else if(type===1){
      const rad=a*a*b*b, ans=a*b;
      add('extra-koklu-'+i,'koklu',`√${rad} işleminin sonucu?`,ans,[a*b+1,a*b-1,a+b],'orta');
    }else if(type===2){
      const r1=a*a*b,r2=c*c*b, ans=`${a+c}√${b}`;
      add('extra-koklu-'+i,'koklu',`√${r1} + √${r2} işleminin sonucu?`,ans,[`${a+c-1}√${b}`,`${a+c+1}√${b}`,`${a*c}√${b}`],i%2===0?'zor':'orta');
    }else if(type===3){
      const r1=a*a*b,r2=c*c*b, ans=`${Math.abs(a-c)}√${b}`;
      add('extra-koklu-'+i,'koklu',`√${r1} - √${r2} işleminin sonucu?`,ans,[`${a+c}√${b}`,`${Math.abs(a-c)+1}√${b}`,`${a*c}√${b}`],'zor');
    }else if(type===4){
      const ans=a*Math.sqrt(b*b);
      add('extra-koklu-'+i,'koklu',`√(${a*a*b*b}) işleminin sonucu?`,String(ans),[String(ans+1),String(Math.max(1,ans-1)),String(a+b)],'orta');
    }else if(type===5){
      const ans=a*a*b;
      add('extra-koklu-'+i,'koklu',`(${a}√${b})² işleminin sonucu?`,ans,[a*b, a*a+b, a*b*b],'zor');
    }else if(type===6){
      const ans=`${a}√${b}`;
      add('extra-koklu-'+i,'koklu',`√${a*a*b} sayısının karesi alındığında hangi sonuç elde edilir?`,a*a*b,[`${a*b}`,`${a*a+b}`,`${a*b*b}`],'zor');
    }else{
      const rad=a*a*b;
      const ans=`${a}√${b}`;
      add('extra-koklu-'+i,'koklu',`√${rad} için doğru sadeleştirme hangisidir?`,ans,[`√${a*b}`,`${a+1}√${b}`,`${a}√${b*b}`],i%3===0?'zor':'orta');
    }
  }

  localStorage.setItem('kokus-extra-bank-version',VERSION);
  try{localStorage.setItem('kokus_data_v13',JSON.stringify(data));}catch(e){}\n  location.reload();
})();