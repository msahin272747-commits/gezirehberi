# ARAŞTIRMA VE GELİŞTİRME GÜNLÜĞÜ

**Proje sahibi:** MUSTAFA ŞAHİN  
**Sınıf:** 9/D  
**Okul:** ABDULKADİRKONUKOĞLU

Bu günlük, projenin geliştirme sürecinde yapılan gerçek çalışmaları tarih sırasıyla kayıt altına almak için tutulmaktadır. Yeni çalışmalar yapıldıkça güncellenmelidir.

## 24.09.2026 — Mevcut sistemin incelenmesi

Mevcut matematik uygulaması incelendi. Uygulamanın kök ve üslü ifadeler üzerinde soru çözme, puan, seri ve oyuncu istatistikleri tuttuğu görüldü.

Araştırma projesi açısından yalnızca uygulamanın çalışması yerine öğrencinin performansını ölçebilecek verilerin toplanması gerektiği belirlendi.

## 24.09.2026 — Araştırma sorusunun belirlenmesi

Ana araştırma problemi şu şekilde netleştirildi:

> Öğrencinin önceki cevaplarına göre soru seçimini değiştiren uyarlanabilir ve oyunlaştırılmış bir sistem, sabit/rastgele soru seçimine göre matematik öğrenme başarısını artırır mı?

Buna bağlı olarak deney grubu ve kontrol grubu yaklaşımı planlandı.

## 24.09.2026 — Konu bazlı performans takibi

Üslü ifadeler ve köklü ifadeler için ayrı doğru/yanlış istatistikleri tutulmaya başlandı.

Amaç, öğrencinin hangi konuda zorlandığını belirlemek ve sonraki soruların seçiminde bu bilgiyi kullanmaktır.

## 24.09.2026 — Uyarlanabilir soru seçimi

Soru seçme sistemi öğrencinin konu doğruluğunu ve soru zorluğunu dikkate alacak şekilde geliştirildi.

Kontrol grubunda rastgele seçim kullanılabilmesi için araştırma grubu bilgisi sisteme eklendi.

## 24.09.2026 — Cevap süresi ölçümü

Bir sorunun gösterilmesi ile öğrencinin cevap vermesi arasındaki süre ölçülmeye başlandı.

Bu verinin ileride doğruluk oranı ile birlikte değerlendirilmesi planlandı.

## 24.09.2026 — Araştırma verisi kaydı

Araştırma olayları için sunucu tarafında kayıt sistemi oluşturuldu.

Kaydedilebilecek temel alanlar:
- anonim katılımcı kodu,
- grup,
- aşama,
- soru,
- konu,
- zorluk,
- doğru/yanlış,
- cevaplama süresi.

## 24.09.2026 — Araştırma modu

research.html oluşturuldu.

Araştırma modunda:
- anonim katılımcı kodu,
- deneysel veya kontrol grubu,
- ön test,
- uygulama,
- son test,
- yerel veri dışa aktarma,
- sunucu özeti

için bölümler oluşturuldu.

## Git geçmişi

Geliştirme sırasında yapılan önemli değişiklikler GitHub üzerinde commit olarak tutulmaktadır. Örneğin araştırma altyapısına ilişkin değişiklikler:

- 1e6a9c87db814814671a2493cd0f8cbd0b517dba
- f24c689a6cfab04e0e6a1ed108406c847af058a1
- b7cbf49aa57fadfbd31c235b29bf850aef8442ac
- 6426dde2b7307c144194f0f89724133434f7837f
- 7e7cb5adec1a7fc8e2c0f5c8f7b69f0f7eb91729

## Bundan sonraki kayıtlar

Gerçek öğrenci verisi toplanmaya başlandığında her uygulama tarihi ayrıca yazılmalıdır. Deney ve kontrol gruplarının sonuçları, kullanılan soru sayısı, katılımcı sayısı ve istatistiksel analizler veri toplama tamamlandıktan sonra gerçek değerleriyle eklenmelidir.

**Not:** Henüz yapılmamış bir deney, veri toplama veya sonuç bu dosyaya olmuş gibi yazılmamalıdır.
