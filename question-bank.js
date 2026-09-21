/* KÖK & ÜS soru bankası — UI'dan bağımsız, genişletilebilir veri katmanı. */
const optionize = (answer, candidates) => {
  const values = [...new Set([answer, ...candidates].map(String))].slice(0, 4);
  while (values.length < 4) values.push(String(Number(answer) + values.length + 2));
  const seed = [...values].sort((a,b) => (a.length * 7 + a.charCodeAt(0)) - (b.length * 7 + b.charCodeAt(0)));
  return { options: seed, correctAnswer: seed.indexOf(String(answer)) };
};
const exponentQuestion = (id, base, a, b, c, difficulty) => {
  const answer = base ** (a + b - c);
  const q = optionize(answer, [base ** (a+b), base ** (a+b-c+1), base ** Math.max(1,a+b-c-1)]);
  return { id:`u-${id}`, topic:'Üslü İfadeler', difficulty, question:`${base}<sup>${a}</sup> · ${base}<sup>${b}</sup> / ${base}<sup>${c}</sup> = ?`, ...q, explanation:`Aynı tabanlı üslü ifadelerde çarpımda üsler toplanır, bölümde çıkarılır: ${a}+${b}−${c}=${a+b-c}.`, solution:`${base}<sup>${a}</sup> · ${base}<sup>${b}</sup> / ${base}<sup>${c}</sup> = ${base}<sup>${a+b-c}</sup> = ${answer}`, points:difficulty === 'Zorlayıcı' ? 20 : 10, boss:difficulty === 'Zorlayıcı' };
};
const radicalQuestion = (id, outside, inside, difficulty) => {
  const n = outside * outside * inside, ans = outside === 1 ? `√${inside}` : `${outside}√${inside}`;
  const q = optionize(ans, [`${outside+1}√${inside}`, `${outside}√${Math.max(2,inside+1)}`, `√${n}`]);
  return { id:`k-${id}`, topic:'Köklü İfadeler', difficulty, question:`√${n} = ?`, ...q, explanation:`${n} = ${outside}² × ${inside}. M Yöntemi'nde eş iki çarpan bir çift olur ve kökün dışına çıkar.`, solution:`√${n} = √(${outside}² × ${inside}) = ${ans}`, points:difficulty === 'Zorlayıcı' ? 20 : 10, boss:difficulty === 'Zorlayıcı' };
};
const exponentBases=[2,3,5,2,3,4,2,3,5,2,3], radicals=[2,3,5,6,7,10,11,12,13,14,15];
const exponentQuestions = Array.from({length:110},(_,i)=>exponentQuestion(i+1, exponentBases[i%11], 2+(i%5), 2+(Math.floor(i/11)%5), 1+(i%4), i>=95?'Zorlayıcı':i>=55?'Orta-Zor':'Orta'));
const radicalQuestions = Array.from({length:110},(_,i)=>radicalQuestion(i+1, 2+(i%17), radicals[i%11], i>=95?'Zorlayıcı':i>=55?'Orta-Zor':'Orta'));
const specials = [
 ['√72 = ?', '6√2', ['4√3','8√2','12√2'], '72 = 2×2×2×3×3. 2×2 → 2 dışarı, 3×3 → 3 dışarı; bir 2 içeride kalır.', '√72 = 6√2'],
 ['√50 + √8 = ?', '7√2', ['5√2','6√2','8√2'], '√50=5√2 ve √8=2√2. Benzer köklü ifadelerin katsayıları toplanır.', '5√2 + 2√2 = 7√2'],
 ['2√27 − √12 = ?', '4√3', ['3√3','5√3','2√3'], '√27=3√3, √12=2√3. Önce katsayı ile çarp, sonra benzer kökleri çıkar.', '2·3√3 − 2√3 = 4√3'],
 ['√75 + √48 = ?', '9√3', ['7√3','8√3','10√3'], '√75=5√3 ve √48=4√3.', '5√3 + 4√3 = 9√3'],
 ['3√20 − √45 = ?', '3√5', ['2√5','4√5','5√5'], '√20=2√5 ve √45=3√5.', '3·2√5 − 3√5 = 3√5']
];
specials.forEach((s,i)=>{const q=optionize(s[1],s[2]); radicalQuestions[i]={id:`k-özel-${i+1}`,topic:'Köklü İfadeler',difficulty:'Orta',question:s[0],...q,explanation:s[3],solution:s[4],points:10,boss:false};});
const QUESTION_BANK = [...exponentQuestions, ...radicalQuestions];
if (typeof window !== 'undefined') window.QUESTION_BANK = QUESTION_BANK;
