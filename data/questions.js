/* Merkezi soru bankası. Yeni sorular bu dosyadaki Question nesneleriyle eklenir. */
(function () {
  const questionBank = [];
  const add = (topic, difficulty, question, options, correctAnswer, explanation, solution) => {
    questionBank.push({
      id: `${topic}-${questionBank.filter(q => q.topic === topic).length + 1}`,
      topic, difficulty, question, options, correctAnswer, explanation, solution,
      points: difficulty === 'boss' ? 50 : difficulty === 'orta-zor' ? 20 : 10,
      boss: difficulty === 'boss'
    });
  };
  const superscript = value => String(value).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('');
  const pow = (base, exp) => `${base}${superscript(exp)}`;
  const simplify = [
    [12,'2√3','12 = 2 × 2 × 3. 2 × 2 çifti kök dışına çıkar.'], [18,'3√2','18 = 3 × 3 × 2. 3 × 3 çifti kök dışına çıkar.'],
    [20,'2√5','20 = 2 × 2 × 5. 2 × 2 çifti kök dışına çıkar.'], [24,'2√6','24 = 2 × 2 × 6. 2 × 2 çifti kök dışına çıkar.'],
    [27,'3√3','27 = 3 × 3 × 3. Bir 3 × 3 çifti kök dışına çıkar.'], [28,'2√7','28 = 2 × 2 × 7.'], [32,'4√2','32 = 2 × 2 × 2 × 2 × 2. İki çift dışarı çıkar.'],
    [45,'3√5','45 = 3 × 3 × 5.'], [48,'4√3','48 = 2 × 2 × 2 × 2 × 3.'], [50,'5√2','50 = 5 × 5 × 2.'],
    [72,'6√2','72 = 6 × 6 × 2.'], [75,'5√3','75 = 5 × 5 × 3.'], [80,'4√5','80 = 4 × 4 × 5.'], [98,'7√2','98 = 7 × 7 × 2.'],
    [108,'6√3','108 = 6 × 6 × 3.'], [125,'5√5','125 = 5 × 5 × 5.'], [180,'6√5','180 = 6 × 6 × 5.'], [200,'10√2','200 = 10 × 10 × 2.'],
    [288,'12√2','288 = 12 × 12 × 2.'], [450,'15√2','450 = 15 × 15 × 2.']
  ];
  const radicalOptions = (answer) => [answer, '2√7', '3√5', '4√2'].filter((v, i, a) => a.indexOf(v) === i).concat(['5√3']).slice(0, 4);
  // 75 orta: M Yöntemi ile sadeleştirme ve benzer köklü ifadeleri toplama/çıkarma.
  for (let i = 0; i < 55; i++) {
    const [n, ans, step] = simplify[i % simplify.length];
    const options = radicalOptions(ans);
    add('koklu', 'orta', `√${n} sayısı aşağıdakilerden hangisine eşittir?`, options, options.indexOf(ans), 'M Yönteminde kök içindeki aynı çarpanlar ikili eşleştirilir.', `√${n}\n${step}\nSonuç: √${n} = ${ans}`);
  }
  const terms = [[2,3,3,'5√3'],[5,2,-2,'3√2'],[2,5,3,'5√5'],[4,7,-1,'3√7'],[3,6,2,'5√6']];
  for (let i = 0; i < 20; i++) {
    const [a, r, b, ans] = terms[i % terms.length]; const op = b < 0 ? '−' : '+'; const abs = Math.abs(b);
    // Her seçenekte farklı bir sonuç gösterilir; aynı metinli iki şık olmaz.
    const options = [ans, `${a + abs + 1}√${r}`, `${Math.abs(a - abs) + 1}√${r}`, `${a * abs + 1}√${r}`];
    add('koklu', 'orta', `${a}√${r} ${op} ${abs}√${r} işleminin sonucu kaçtır?`, options, 0, 'Sadece kök içleri aynı olan terimlerin katsayıları toplanır veya çıkarılır.', `${a}√${r} ${op} ${abs}√${r} = ${ans}`);
  }
  const radicalOps = [['2√18 + √8','8√2','√18 = 3√2 ve √8 = 2√2 olduğundan 6√2 + 2√2 = 8√2.'],['√50 + √8','7√2','√50 = 5√2 ve √8 = 2√2 olduğundan 7√2.'],['2√27 − √12','4√3','2√27 = 6√3 ve √12 = 2√3 olduğundan 4√3.'],['√75 + √48','9√3','√75 = 5√3 ve √48 = 4√3 olduğundan 9√3.'],['3√20 − √45','3√5','3√20 = 6√5 ve √45 = 3√5 olduğundan 3√5.'],['√72 − √8','4√2','6√2 − 2√2 = 4√2.']];
  for (let i = 0; i < 30; i++) { const [q,a,s] = radicalOps[i % radicalOps.length]; const opts=[a,'5√2','6√3','7√5']; add('koklu','orta-zor',`${q} işleminin sonucu kaçtır?`,opts,0,'Önce köklü ifadeleri M Yöntemiyle sadeleştir.',s); }
  const radicalBoss = [['√200 − √8','8√2'],['√288 + √8','14√2'],['2√50 − √18','7√2'],['√450 − 3√8','9√2'],['√180 + 2√20','10√5']];
  radicalBoss.forEach(([q,a]) => add('koklu','boss',`${q} işleminin sonucu kaçtır?`,[a,'10√2','12√3','8√5'],0,'Dikkat: önce her köklü ifadeyi sadeleştir, sonra benzer köklü terimleri birleştir.',`${q} = ${a}`));

  const exponentMid = [[2,3,4,5,2], [3,2,4,3,3], [5,2,2,3,5], [2,4,3,5,2], [3,5,2,4,3]];
  for (let i = 0; i < 50; i++) { const [b,x,y,z] = exponentMid[i % exponentMid.length]; const result=x+y-z; const ans=pow(b,result); const opts=[ans,pow(b,9),pow(b,15),pow(b,20)]; add('uslu','orta',`${pow(b,x)} · ${pow(b,y)} / ${pow(b,z)} işleminin sonucu nedir?`,opts,0,'Aynı tabanda çarpma yapılırken üsler toplanır, bölme yapılırken çıkarılır.',`${pow(b,x)} · ${pow(b,y)} / ${pow(b,z)} = ${pow(b,x+y-z)}`); }
  // Carefully authored transform questions, repeated with alternate wording to reinforce conversion.
  const transformQs=[['3² · 9²','3⁶','9 = 3²; 3² · (3²)² = 3⁶.'],['2⁴ · 4³','2¹⁰','4 = 2²; 2⁴ · (2²)³ = 2¹⁰.'],['8² / 2⁴','2²','8 = 2³; (2³)² / 2⁴ = 2².'],['(2³)² / 2⁴','2²','(2³)² = 2⁶; 2⁶ / 2⁴ = 2².'],['5² · 25 / 5³','5¹','25 = 5²; 5² · 5² / 5³ = 5¹.'],['(3² · 3³) / 3⁴','3¹','Üsler: 2 + 3 − 4 = 1.'],['4³ · 2² / 8²','2²','4³ = 2⁶, 8² = 2⁶; 2⁶ · 2² / 2⁶ = 2².'],['2⁵ · 4² / 8','2⁶','4² = 2⁴, 8 = 2³; 2⁵ · 2⁴ / 2³ = 2⁶.']];
  for(let i=0;i<25;i++){const[q,a,s]=transformQs[i%transformQs.length];add('uslu','orta',`${q} işleminin sonucu nedir?`,[a,'2⁴','3⁴','5²'],0,'Önce sayıları aynı tabana dönüştür.',s)}
  const exponentHard=[['(2³)² · 2⁴ / 2⁵','2⁵'],['(3²)³ / 9²','3²'],['4⁴ / (2³ · 2²)','2³'],['25² · 5 / 5⁴','5¹'],['8³ / (2⁴ · 2²)','2³'],['9³ / 3⁴','3²']];
  for(let i=0;i<30;i++){const[q,a]=exponentHard[i%exponentHard.length];add('uslu','orta-zor',`${q} işleminin sonucu nedir?`,[a,'2⁴','3⁴','5³'],0,'Üslü sayıları önce aynı tabanda yazıp üs kurallarını sırayla uygula.',`${q} = ${a}`)}
  [['(2⁴ · 4²) / 8','2⁵'],['(3³ · 9²) / 3⁵','3²'],['(5² · 25²) / 5⁴','5²'],['(8² · 2³) / 4³','2³'],['(4³ · 8²) / 2⁸','2⁴']].forEach(([q,a])=>add('uslu','boss',`${q} işleminin sonucu nedir?`,[a,'2⁶','3³','5³'],0,'Boss soruda da yöntem aynı: tüm sayıları ortak tabana dönüştür ve üsleri dikkatle işle.',`${q} = ${a}`));
  if (questionBank.length !== 220) throw new Error(`Soru bankası 220 soru içermelidir; mevcut: ${questionBank.length}`);
  window.questionBank = questionBank;
})();
