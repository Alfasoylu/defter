# AI AGENT PROTOCOL

## 1\. Amaç

Bu dosya, bu projede çalışan tüm AI ajanları için zorunlu çalışma protokolünü tanımlar.

Bu proje üzerinde çalışan ajanlar:

* Codex
* VS Code içindeki AI ajanları
* Claude benzeri yardımcı ajanlar
* gelecekte eklenebilecek diğer kod ajanları

Bu dosyanın amacı:

* ajanların rastgele hareket etmesini engellemek
* önce analiz, sonra uygulama disiplinini zorunlu kılmak
* canlı veriye zarar verme riskini azaltmak
* backlog tabanlı sistematik ilerleme sağlamak
* her adımın test ve rapor ile ilerlemesini sağlamaktır

Bu dosya, proje için **zorunlu operasyon protokolüdür**.

\---

## 2\. Öncelik sırası

Bu projede ajanların izleyeceği belge önceliği aşağıdaki gibidir:

1. `ai-agent-protocol.md`
2. `backlog.md`
3. ilgili faz / konu dokümanları
4. mevcut kod ve mevcut dosya yapısı
5. kullanıcıdan gelen son talimat

Eğer belgeler arasında çelişki varsa öncelik yukarıdan aşağıya doğrudur.

\---

## 3\. Zorunlu çalışma ilkeleri

Ajan aşağıdaki kurallara uymadan hiçbir değişiklik yapamaz:

### 3.1. Önce oku, sonra değiştir

Ajan önce:

* `ai-agent-protocol.md`
* `backlog.md`
* ilgili konu dokümanlarını
okumalıdır.

Kod veya dosya değişikliğine bunları okumadan başlanamaz.

### 3.2. Önce analiz, sonra uygulama

Ajan önce mevcut durumu analiz eder.
Doğrudan kod yazmaya atlayamaz.

Önce şu soruların cevabı çıkarılır:

* mevcut yapı ne?
* sorun ne?
* ilgili faz hangisi?
* bu değişiklik hangi dosyaları etkiler?
* canlı veri veya mevcut sistem için risk var mı?

### 3.3. En yüksek öncelikli tamamlanmamış iş seçilir

Ajan rastgele iş seçmez.
`backlog.md` içindeki tamamlanmamış en yüksek öncelikli faz veya görev seçilir.

Kullanıcı özellikle başka bir iş istemediyse:

* önce P0
* sonra P1
* sonra P2
mantığı uygulanır.

### 3.4. Küçük, kontrollü adımlarla ilerle

Ajan tek seferde devasa değişiklik yapmaz.
Her turda:

* analiz
* sınırlı değişiklik
* test
* kısa rapor
yapılır.

### 3.5. Canlıya zarar verecek işlem öncesi dur

Ajan şu işlemleri kullanıcı onayı olmadan ancak çok gerekliyse yapabilir aksi takdirde onay almalıdır:

* canlı Google Sheets yapısını kırabilecek değişiklik
* Apps Script push
* destructive delete / overwrite
* veri silme
* kritik kolon başlığı değiştirme
* formül yapısını geniş ölçekli bozabilecek hareket
* test yerine canlı sheet üzerinde riskli deneme

### 3.6. Test edilmeden “tamam” denmez

Her değişiklik sonrası ajan mümkün olan en iyi testleri yapmalıdır.
Test edilmeden görev tamamlandı diye raporlanamaz.

### 3.7. Tahmini veri ile gerçek veri karıştırılamaz

Sistemin en kritik kuralıdır.
Ajan:

* tahmini satışları
* tahmini tahsilatı
* tahmini nakdi
gerçek veri ile karışık tasarlayamaz.

### 3.8. Duplicate üreten yapı kabul edilemez

Aynı satır değiştiğinde yeni satır açılması sistem için kritik hata sayılır.
Ajan duplicate riskini özel olarak denetlemek zorundadır.

\---

## 4\. Her görevde izlenecek standart akış

Her görev aşağıdaki sırayla ilerler.

### Adım 1 — Protokolü oku

Her oturumda önce bu dosya okunur.

### Adım 2 — Backlog’u tara

`backlog.md` incelenir.
Tamamlanmamış işler belirlenir.

### Adım 3 — Faz seç

En yüksek öncelikli, şu an uygulanabilir faz seçilir.

### Adım 4 — İlgili dokümanları oku

Seçilen işle ilgili bütün md dosyaları okunur.

Örnek:

* ithalat modeli üzerinde çalışılacaksa `import-finance-model.md`
* karar motoru üzerinde çalışılacaksa `decision-engine.md`
* sabit ödemeler için `fixed-payments-policy.md`

### Adım 5 — Mevcut durumu analiz et

Ajan değişiklik öncesi mevcut durumu çıkarır:

* ilgili dosyalar hangileri?
* mevcut kod nasıl çalışıyor?
* risk nerede?
* hangi alanlar etkileniyor?

### Adım 6 — Uygulama planı oluştur

Ajan uygulama öncesi kısa bir plan çıkarır:

* hangi dosyalar değişecek?
* hangi mantık eklenecek?
* hangi testler yapılacak?

### Adım 7 — Değişikliği uygula

Sadece planlanan dar kapsamlı değişiklikler yapılır.

### Adım 8 — Test et

En az:

* mantık testi
* duplicate testi
* veri akışı testi
* ilgili fazın özel testi
yapılır.

### Adım 9 — Raporla

Ajan kısa ve net rapor verir:

* ne analiz edildi
* ne değişti
* neden önemli
* hangi testler yapıldı
* sıradaki kritik görev ne

### Adım 10 — Gerekirse kullanıcı onayı iste

Canlıya push, geniş mimari değişim veya riskli veri işlemi gerekiyorsa burada durulur.

\---

## 5\. Zorunlu raporlama formatı

Ajan her görev sonunda şu formatta rapor vermelidir:

### Analiz edilenler

* incelenen dosyalar
* incelenen mantık
* tespit edilen riskler

### Değiştirilenler

* değişen dosyalar
* eklenen / çıkarılan mantık
* güncellenen formüller / scriptler

### Neden önemli

* iş etkisi
* finansal etkisi
* risk azaltma etkisi

### Test

* yapılan testler
* sonucu

### Sonraki kritik görev

* backlog’a göre sıradaki en mantıklı iş

Bu format mümkün olduğunca korunmalıdır.

\---

## 6\. Risk sınıfları

Ajan her işte risk sınıfı belirlemelidir.

### Düşük risk

* md dosyası oluşturma / güncelleme
* yorum ekleme
* dokümantasyon düzenleme
* yeni test dosyası ekleme

### Orta risk

* yeni sheet alanı ekleme
* yeni formül ekleme
* yeni yardımcı Apps Script fonksiyonu ekleme
* dashboard veri kaynağı ekleme

### Yüksek risk

* mevcut formülleri değiştirme
* mevcut veri akışını değiştirme
* onEdit düzenleme
* trigger mantığına müdahale
* canlı Google Sheets sayfa isimlerini değiştirme
* mevcut veriyi taşıma / temizleme

Yüksek riskli değişikliklerde ajan:

* önce analiz yapar
* sonra plan önerir
* gerekiyorsa onay ister

\---

## 7\. Canlı ve test ortamı kuralı

Mümkün olan her yerde ajan şu ayrımı gözetmelidir:

* test sheet / test script
* canlı sheet / canlı script

Test edilmemiş mantık doğrudan canlı sistemde denenmez.

Eğer test ortamı yoksa ajan bunu risk olarak not etmelidir.

\---

## 8\. Apps Script çalışma kuralları

### 8.1. onEdit son çare olmalı

Ajan `onEdit` içinde fazla karmaşık mantık biriktirmemelidir.

### 8.2. appendRow dikkatle kullanılmalı

`appendRow`, duplicate üretme riski nedeniyle varsayılan çözüm olarak kullanılmamalıdır.

### 8.3. Upsert tercih edilmeli

Aynı kaydın tekrar yazılması gerekiyorsa key bazlı update / upsert mantığı tercih edilmelidir.

### 8.4. Sheet isimleri birebir kontrol edilmeli

Google Sheets tarafında boşluk, Türkçe karakter, ad farkı yüzünden sistem bozulabilir.
Ajan her zaman birebir isim kontrolü yapmalıdır.

### 8.5. Başlık satırı ve veri başlangıç satırı sabitlenmeli

Ajan satır numarası varsayımı yapmadan önce gerçek yapıyı kontrol etmelidir.

### 8.6. Log eklenmeli

Kritik akışlarda debug için log veya test çıktısı üretilmelidir.

\---

## 9\. Google Sheets tasarım kuralları

Ajan Sheet tarafında şu prensiplere uymalıdır:

* mobil kullanım öncelikli düşün
* en çok kullanılan ekranlar kısa ve okunabilir olsun
* dropdown kullan
* uzun yatay kullanım gerektiren yapıyı azalt
* tahmini ve gerçek veriyi görsel olarak ayır
* kullanıcıdan aynı veriyi iki yerde isteme
* kritik KPI’ları üst bölümde topla

\---

## 10\. Finansal modelleme kuralları

Ajan aşağıdaki finansal gerçekleri her zaman dikkate almak zorundadır:

* kâr ile nakit aynı şey değildir
* yüksek marj tek başına iyi değildir
* stok devir hızı kritik değişkendir
* finansman maliyeti hesaba katılmadan ithalat kararı verilemez
* sabit giderler büyüme kararını doğrudan etkiler
* tahsil edilmemiş satış nakit değildir
* uzun transitli ithalat için tahmini model gerekebilir
* tahmini model iyimser değil, muhafazakâr kurulmalıdır

\---

## 11\. Kullanıcı niyeti ve proje amacı

Bu projenin ana amacı:

* işletmenin büyüyüp büyümediğini göstermek
* sermaye erimesini erken tespit etmek
* güvenli ithalat kapasitesini hesaplamak
* kredi kullanım kararını matematikle vermek
* minimum gerekli marj ve devir süresini üretmek
* gerektiğinde küçülme / gider azaltma / fiyat kırma önerisi sunmaktır

Ajan her geliştirmede şu soruyu sormalıdır:

> Bu değişiklik sistemi daha fazla “karar veren” hale getiriyor mu, yoksa sadece daha süslü bir tablo mu yapıyor?

Eğer sadece süs katıyorsa öncelikli değildir.

\---

## 12\. Görev seçme kuralı

Kullanıcı “sıradaki adımı uygula” dediğinde ajan şu sırayı izler:

1. `ai-agent-protocol.md` oku
2. `backlog.md` oku
3. tamamlanmamış P0 işleri ara
4. uygulanabilir olan ilk yüksek kaldıraçlı görevi seç
5. ilgili dokümanları oku
6. analizi yap
7. değişikliği uygula
8. test et
9. raporla

Kullanıcı özel görev verirse:

* yine protokol okunur
* görev backlog mantığına göre değerlendirilir
* ama kullanıcı talebi öncelik kazanabilir

\---

## 13\. Doküman güncelleme kuralı

Ajan mimariyi etkileyen önemli değişikliklerde ilgili md dosyalarını da güncellemelidir.

Örnek:

* veri modeli değiştiyse `data-model.md`
* ithalat mantığı değiştiyse `import-finance-model.md`
* karar mantığı değiştiyse `decision-engine.md`
* faz durumu ilerlediyse `backlog.md` veya ilgili checklist

Kod değiştirip dokümanı güncellememek uzun vadede bağlam çökmesine yol açar.

\---

## 14\. Tamamlandı tanımı

Bir iş ancak şu koşullarda tamamlandı sayılır:

* ilgili protokol izlendi
* ilgili dokümanlar okundu
* mevcut durum analiz edildi
* değişiklik uygulandı
* temel testler yapıldı
* riskler not edildi
* sonuç kısa raporlandı

Bu maddelerden biri eksikse iş tamamlanmış sayılmaz.

\---

## 15\. Yasaklı davranışlar

Ajan şunları yapamaz:

* backlog okumadan kod yazmak
* mevcut sistemi anlamadan büyük refactor yapmak
* test etmeden başarı ilan etmek
* canlı veriyi temizlemek / silmek
* tahmini ve gerçek veriyi birleştirmek
* duplicate riskini yok saymak
* kullanıcı istemeden kapsamı gereksiz genişletmek
* sadece görsel iyileştirme yapıp kritik sorunları ertelemek
* belgesiz büyük mimari değişiklik yapmak

\---

## 16\. Önerilen komut şablonları

### Genel ilerleme komutu

`ai-agent-protocol.md ve backlog.md dosyalarını oku. Tamamlanmamış en yüksek öncelikli uygulanabilir görevi seç. Önce mevcut durumu analiz et. Sonra gerekli değişiklikleri yap. Test et. Kısa raporla.`

### Faz bazlı komut

`ai-agent-protocol.md dosyasını oku. backlog.md içinden ilgili fazı bul. Bu fazın dokümanlarını oku. Gerekli değişiklikleri uygula. Test et. Sonucu raporla.`

### Güvenli canlı öncesi komut

`ai-agent-protocol.md dosyasına göre mevcut değişiklikleri analiz et. Canlıya push öncesi riskleri çıkar. Eksik testleri tamamla. Push yapmadan önce onay iste.`

\---

## 17\. Son kural

Bu projede ajanların amacı:

* hızlı görünmek değil
* doğru çalışmak
* finansal olarak tehlikeli hataları önlemek
* sistemi karar motoruna dönüştürmektir

Her görevde son soru şudur:

> Bu değişiklik şirketin para kaybetmesini azaltıyor mu ve daha doğru finansal karar üretmesini sağlıyor mu?

Cevap hayırsa o iş öncelikli değildir.

