/* Question bank is deliberately separate from the interface. Add records here or replace it with an API later. */
const supers = {2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹',10:'¹⁰',11:'¹¹',12:'¹²'};
const pow = (b,n) => `${b}${supers[n] || '^'+n}`;
const shuffled = a => [...a].sort(()=>Math.random()-.5);
const make = (id,topic,difficulty,question,answer,solution,rule,boss=false) => ({id,topic,difficulty,question,answer:String(answer),solution,rule,points:boss?50:difficulty==='zorlayıcı'?20:10,boss});
function options(answer, wrong) { return shuffled([String(answer), ...wrong.map(String).filter(x=>String(x)!==String(answer)).slice(0,3)]); }
const exponentQuestions=[];
const exponentTemplates=[
 [2,3,4,5],[2,4,3,4],[3,2,3,4],[3,3,2,3],[2,5,2,4],[3,4,2,3],[2,6,3,5],[3,4,2,4],[3,5,3,5],[2,7,4,6],
];
for(let i=0;i<110;i++) { const [b,a,c,d]=exponentTemplates[i%10]; const tier=i<55?'orta':i<95?'orta-zor':'zorlayıcı'; const boss=i>=95; let q,ans,sol,rule;
 if(i%4===0){ q=`${pow(b,a)} · ${pow(b,c)} / ${pow(b,d)} = ?`; ans=pow(b,a+c-d); sol=`Aynı tabanda üsler toplanır, bölmede çıkarılır: ${a}+${c}−${d}=${a+c-d}.`; rule='aᵐ · aⁿ = aᵐ⁺ⁿ ve aᵐ / aⁿ = aᵐ⁻ⁿ'; }
 else if(i%4===1){ q=`(${pow(b,a)})${supers[2]} / ${pow(b,d)} = ?`; ans=pow(b,2*a-d); sol=`Üssün üssü: (${pow(b,a)})²=${pow(b,2*a)}; sonra ${d} çıkarılır.`; rule='(aᵐ)ⁿ = aᵐⁿ'; }
 else if(i%4===2){ q=`${pow(b===2?4:9, a)} · ${pow(b, c)} = ?`; const base=b===2?2:3, first=b===2?2*a:2*a; ans=pow(base,first+c); sol=`${b===2?4:9} = ${pow(base,2)} olduğundan ${pow(b===2?4:9,a)}=${pow(base,first)}. Üsleri topla.`; rule='Aynı tabana dönüştürme'; }
 else { q=`${pow(b===2?8:27,a)} / ${pow(b,c)} = ?`; const base=b===2?2:3, first=3*a; ans=pow(base,first-c); sol=`${b===2?8:27} = ${pow(base,3)}. ${first}−${c}=${first-c}.`; rule='Aynı tabana dönüştürme ve bölüm kuralı'; }
 const n=Number(ans.replace(/[^0-9]/g,''))||2; exponentQuestions.push({...make(`u-${i+1}`,'üslü',tier,q,ans,sol,rule,boss),options:options(ans,[pow(b,Math.max(1,a+c-d+1)),pow(b,Math.max(1,a+c-d-1)),'1'])}); }
const radicalValues=[12,18,20,24,27,28,32,45,48,50,72,75,80,98,108,125,180,200,288,450,8,14,15,21,30,40,54,60,63,96,112,147,162,192,242,245,252,270,300,320,338,360,392,405,432,500,540,588,675,720,750,800,882,968,1024];
function simplify(n){ let outside=1, inside=n; for(let k=2;k*k<=inside;k++){while(inside%(k*k)===0){outside*=k;inside/=k*k;}} return [outside,inside]; }
function radicalText([o,i]){return i===1?String(o):o===1?`√${i}`:`${o}√${i}`}
function factors(n){let a=[];for(let p=2;p<=n;p++)while(n%p===0){a.push(p);n/=p}return a.join(' × ')}
const radicalQuestions=[];
for(let i=0;i<110;i++){const n=radicalValues[i%radicalValues.length], [o,inn]=simplify(n), tier=i<55?'orta':i<95?'orta-zor':'zorlayıcı',boss=i>=95; let q,ans,sol,rule;
 if(i<65 || i%3===0){ q=`M Yöntemi ile √${n} sadeleştirilirse sonuç nedir?`; ans=radicalText([o,inn]); sol=`√${n} → ${n} = ${factors(n)} → eş çiftler dışarı çıkar, eşleşmeyen ${inn===1?'çarpan kalmaz':inn+' kökün içinde kalır'} → ${ans}.`; rule='M Yöntemi: aynı çarpanların her çifti kökün dışına bir kez çıkar.'; }
 else {const m=radicalValues[(i*7+3)%radicalValues.length], [a,r]=simplify(n),[b,s]=simplify(m); if(r===s){ const coef=(i%2?1:-1), val=a+coef*b; q=`√${n} ${coef>0?'+':'−'} √${m} = ?`; ans=radicalText([val,r]); sol=`√${n}=${radicalText([a,r])}, √${m}=${radicalText([b,s])}. Benzer köklülerde katsayıları ${coef>0?'topla':'çıkar'}: ${ans}.`; rule='Önce M Yöntemiyle sadeleştir, sonra benzer köklü ifadeleri birleştir.';} else {q=`2√${n} + √${n} = ?`;ans=radicalText([3*o,inn]);sol=`√${n}=${radicalText([o,inn])}. 2${radicalText([o,inn])}+${radicalText([o,inn])}=${ans}.`;rule='M Yöntemi ve benzer köklü ifadeler';}}
 radicalQuestions.push({...make(`k-${i+1}`,'köklü',tier,q,ans,sol,rule,boss),options:options(ans,[radicalText([Math.max(1,o+1),inn]),`√${n}`,radicalText([Math.max(1,o-1),inn])])}); }
const questionBank=[...exponentQuestions,...radicalQuestions];
