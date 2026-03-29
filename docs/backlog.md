# Finansal Karar Sistemi — Master Backlog

## 0. Belgenin amacı

Bu belge, Google Sheets + Apps Script + yerel geliştirme ortamı (VS Code / Codex / clasp) ile geliştirilecek **ithalat odaklı finansal karar sisteminin** ana backlog’udur.

Bu sistemin amacı yalnızca veri toplamak veya muhasebe görünümü vermek değildir. Nihai amaç:

- firmanın **nakit akışını kontrol etmek**
- **sermaye erimesini erken tespit etmek**
- **güvenli ithalat kapasitesini hesaplamak**
- **kredi kullanımını matematikle yönetmek**
- **ürün bazlı marj + devir + transit süresi** ilişkisini ölçmek
- **büyüme / küçülme / fiyat kırma / gider azaltma** gibi kararları sistematikleştirmek
- tek ekrandan “**şu an ne yapmalıyım?**” cevabını üretebilmektir

Bu backlog, tüm proje için **tek kaynak belge** olarak kullanılacaktır.

## 0.1. Güncel durum notu (2026-03-27)

- Faz 1-18 implementasyonu kod tarafında tamamlanmış durumdadır.
- Canlı doğrulama: smoke ve safety gate geçmektedir.
- Test doğrulama: manuel senaryo UAT ve mobil UAT yardımcıları eklenmiştir.
- Bu dosyadaki çok sayıdaki açık kutu, tarihsel tasarım backlog'u olarak korunmaktadır; hepsi güncel uygulanmamış iş anlamına gelmez.
- Aktif açıklar artık daha çok operasyonel sertleştirme, mobil regresyon kontrolü ve düzenli UAT raporlaması tarafındadır.

---

## 1. Ürün vizyonu

### 1.1. Sistem neyi çözmeli?

Mevcut işletme yapısındaki temel problem şudur:

- ithalat USD ile yapılır
- ödeme iki aşamalıdır:
  - siparişte mal bedeli
  - mal geldiğinde navlun + vergi / gümrük
- hava kargo 5–15 gün
- deniz yük 45–60 gün
- satışlardan gelen nakit çoğunlukla 30 gün içinde görünür
- sabit giderler her ay devam eder
- ithalat yapılmazsa ciro düşer, sabit gider devam ettiği için sermaye erir
- ithalat yapılırsa kısa vadede nakit baskısı artar ve kredi ihtiyacı doğabilir

Dolayısıyla sistem şu soruları cevaplamalıdır:

1. Şu an **güvenli şekilde ne kadar ithalat** yapılabilir?
2. Hangi ürün / ürün grubu **sermayeyi daha iyi döndürür**?
3. Hangi faiz seviyesine kadar **kredi kullanmak mantıklıdır**?
4. Sabit giderleri taşımak için **minimum gerekli brüt marj** kaç olmalıdır?
5. Sabit giderleri taşımak için **maksimum kabul edilebilir stok devir süresi** kaç olmalıdır?
6. Deniz ithalat ile hava ithalat arasında hangi durumda hangisi seçilmelidir?
7. Gerekirse stok **fiyat kırılarak eritilmeli mi**?
8. Gerekirse **küçülme / gider azaltma / personel azaltma** gerekli mi?
9. Firma **gerçekten büyüyor mu**, yoksa ciro yaparken sermaye mi eritiyor?

---

## 2. Tasarım ilkeleri

### 2.1. Genel ilkeler

- Sistem muhasebe tablosu değil, **karar motoru** olacaktır.
- Gerçek veriler ve tahmini veriler asla birbirine karıştırılmayacaktır.
- Aynı veri iki farklı yere elle girilmeyecektir.
- Her kritik hesap için tek bir kaynak tablo olacaktır.
- Telefon kullanımına uygunluk öncelikli olacaktır.
- Google Sheets mobilde veri girişi yapılabilir olacak, karmaşık bakım masaüstünde yapılacaktır.
- Apps Script tarafında duplicate üretmeyecek, güvenli upsert mantığı kullanılacaktır.
- Canlı veriye zarar verebilecek tüm otomasyonlar test ortamında doğrulanmadan devreye alınmayacaktır.

### 2.2. Karar üretim ilkeleri

Bir ürün veya ithalat kararı yalnızca tek değişkene göre verilmez.

Her karar en az şu değişkenleri birlikte dikkate almalıdır:

- brüt kar marjı
- net kar marjı
- transit süresi
- stok devir süresi
- tahsilat süresi
- finansman maliyeti
- sabit gider baskısı
- güvenli nakit alt limiti
- mevcut borç baskısı
- gelecek 30 / 60 / 90 gün projeksiyonu

---

## 3. Kapsam

### 3.1. Dahil olan alanlar

- Hızlı veri girişi
- Nakit akışı
- Gerçekleşen nakit giriş / çıkışlar
- Sabit ödemeler
- Kredi / çek / borç takibi
- Kredi kartı ekstresi ve ödeme takibi
- Açık hesap müşteri alacakları
- İthalat siparişleri
- Ürün bazlı karlılık ve stok devir analizi
- Tahmini satış / tahmini nakit modeli
- Dashboard
- Karar motoru
- Uyarılar ve otomasyonlar
- Apps Script akışı
- Test senaryoları
- Yerel geliştirme akışı

### 3.2. Hariç olan alanlar (şimdilik)

- tam kapsamlı genel muhasebe entegrasyonu
- e-fatura / ERP / banka API entegrasyonları
- vergi beyannamesi üretimi
- resmi muhasebe kayıtları
- mali müşavir iş akışları

---

## 4. Başarı kriterleri

Sistem başarılı sayılmak için aşağıdakileri üretmelidir:

1. Bugünkü gerçek nakit durumu
2. 7 gün sonrası projeksiyon
3. 30 gün sonrası projeksiyon
4. 60 gün sonrası projeksiyon
5. 90 gün sonrası projeksiyon
6. En riskli tarih
7. Güvenli ithalat kapasitesi
8. Maksimum mantıklı kredi tutarı
9. Maksimum mantıklı aylık faiz oranı
10. Minimum gerekli kar marjı
11. Maksimum kabul edilebilir stok devir süresi
12. Yaklaşan ödemeler listesi
13. Yaklaşan tahsilatlar listesi
14. Geciken alacak / geciken ödeme listesi
15. “Bugün ne yapmalıyım?” çıktısı
16. “Büyü / temkinli büyü / dur / küçül” yönlendirmesi

---

## 5. Roller ve çalışma modeli

### 5.1. İnsan rolleri

- İş sahibi / karar verici
- Operasyon / finans veri girişi yapan kişi
- Geliştirici (Apps Script / Sheets yapısı)
- AI ajanı (Codex / Claude)

### 5.2. AI ajan rolü

AI ajanı şu şekilde çalışmalıdır:

1. backlog’u okur
2. en yüksek öncelikli tamamlanmamış fazı bulur
3. ilgili doküman ve dosyaları inceler
4. değişikliği uygular
5. test eder
6. sonuç raporlar
7. canlıya zarar verecek işlem varsa onay ister

---

## 6. Kavramsal veri modeli

### 6.1. Temel varlıklar

- Parametreler
- Hızlı Veri Girişi
- Nakit Akışı
- Sabit Ödemeler
- Borç Takibi
- Kredi Kartları
- Açık Hesap Müşteriler
- İthalat Siparişleri
- Ürün / Stok Karlılık
- Tahmini Satışlar
- Dashboard
- Karar Motoru
- Yaklaşan Ödemeler
- Yaklaşan Tahsilatlar
- Test Sonuçları
- Sistem Logları

### 6.2. Veri türleri

#### Gerçek veriler
Gerçekleşmiş ve belgelenmiş işlemler.

Örnek:
- tahsil edilen para
- ödenmiş kredi taksidi
- gelmiş ithalat
- kesilmiş kredi kartı ekstresi
- açık hesap vadesi belli müşteri alacağı

#### Tahmini veriler
Model tarafından üretilen ama henüz gerçekleşmemiş veriler.

Örnek:
- tahmini satış nakdi
- tahmini ithalat dönüş nakdi
- muhafazakâr senaryo tahsilat akışı

#### Parametre verileri
Kullanıcı tarafından merkezi olarak belirlenen ayar verileri.

Örnek:
- USD/TRY
- güvenli nakit alt limiti
- deniz transit süresi
- hava transit süresi
- tahsilat gecikme katsayısı
- güven katsayısı

---

## 7. Sayfa mimarisi

### 7.1. Ana sayfalar

1. Ana Kontrol Paneli
2. Hızlı Veri Girişi
3. Nakit Akışı
4. Sabit Ödemeler
5. Borç Takibi
6. Kredi Kartları
7. Açık Hesap Müşteriler
8. İthalat Siparişleri
9. Stok Yatırım Planı
10. Tahmini Satışlar
11. Parametreler
12. Dashboard
13. Karar Motoru
14. Yaklaşan Ödemeler
15. Yaklaşan Tahsilatlar
16. Test Sonuçları
17. Sistem Logları

### 7.2. Mobil kullanım ilkesi

Telefonda en çok kullanılacak sayfalar:

- Ana Kontrol Paneli
- Hızlı Veri Girişi
- Dashboard
- Yaklaşan Ödemeler
- Yaklaşan Tahsilatlar

Detay hesaplama sayfaları daha çok masaüstü odaklıdır.

---

## 8. Kritik finansal mantıklar

### 8.1. İthalat maliyeti yapısı

İthalatın toplam maliyeti en az üç parçalı düşünülmelidir:

1. mal bedeli
2. navlun
3. vergi / gümrük

Bunların ödeme tarihleri farklı olabilir. Bu yüzden nakit akışında tek satırla değil, çok aşamalı akışla modellenmelidir.

### 8.2. Transit ve devir ilişkisi

Bir ürünün sermaye baskısı şu dört zamanın toplam etkisiyle belirlenir:

- siparişten varışa geçen süre
- varıştan satış başlangıcına kadar geçen süre
- satıştan tahsilata kadar geçen süre
- satılamayan stokta bekleme süresi

### 8.3. Satış ve ithalat zaman uyumsuzluğu problemi

Deniz ithalat 45–60 gün sürerken mevcut satış alacakları çoğunlukla 30 gün ufkunda görünür.

Bu yüzden sistem:
- sahte manuel alacak girişi mecburiyeti yaratmamalı
- bunun yerine tahmini satış / tahmini nakit modülü kullanmalı
- tahmini verileri ayrı katmanda tutmalı
- gerçek veri geldikçe tahmini veriyi geri çekmeli

### 8.4. Kredi kullanım mantığı

Kredi kullanımı şu mantıkla değerlendirilmelidir:

- kredi sadece açığı kapatıyorsa ama kârlı büyüme yaratmıyorsa dikkat
- kredi, finansman maliyeti sonrası pozitif net getiri bırakıyorsa mantıklı olabilir
- kredi, güvenli nakit tamponunu korumuyorsa tehlikelidir
- kredi kararı ürün bazlı devir ve marj ile birlikte değerlendirilmelidir

---

## 9. Ana metrikler

### 9.1. İşletme sağlığı metrikleri

- Aylık net nakit değişimi
- Sermaye büyüme / erime oranı
- Sabit gider karşılama oranı
- Borç servis karşılama oranı
- Finansman baskısı oranı
- Negatif gün sayısı
- Güvenli nakit tamponu

### 9.2. Operasyonel metrikler

- Ortalama stok devir süresi
- Satıştan nakde dönüş süresi
- Ortalama tahsil süresi
- Açık hesap gecikme oranı
- Kredi kartı ödeme baskısı
- Sabit ödeme yükü

### 9.3. Ürün bazlı metrikler

- Brüt marj
- Net marj
- Transit süresi
- Stok devir süresi
- Yıllıklandırılmış sermaye getirisi
- Finansman sonrası net verim
- Fiyat kırma eşiği
- Stok yaşlanma puanı

---

## 10. Temel karar çıktıları

Sistem aşağıdaki aksiyonlardan birini veya birkaçını üretebilmelidir:

- Güvenli şekilde ithalat yap
- Temkinli ithalat yap
- İthalatı ertele
- Deniz yerine hava kargo seç
- Bu faiz seviyesine kadar kredi kullan
- Bu faizle kredi kullanma
- Tahsilatı hızlandır
- Fiyat kırıp stok erit
- Sabit giderleri azalt
- Personel azaltımını değerlendir
- Küçülme moduna geç
- Operasyonu mevcut seviyede koru
- Yüksek marjlı ama yavaş dönen ürünü sınırla
- Düşük marjlı ama hızlı dönen ürünü artır

---

## 11. Faz planı

---

# FAZ 0 — Mevcut sistem analizi ve kurtarma

## Amaç
Mevcut Google Sheets ve Apps Script yapısının envanterini çıkarmak, hatalı veya riskli kısımları tespit etmek.

## Girdiler
- mevcut Google Sheets dosyası
- mevcut Apps Script projesi
- mevcut sayfa yapısı
- mevcut formüller
- mevcut dropdown ve doğrulamalar

## Görevler
- [ ] Tüm mevcut sheet isimlerini listele
- [ ] Tüm kolon başlıklarını çıkar
- [ ] Kritik formülleri belgeye dök
- [ ] Veri doğrulama kurallarını listele
- [ ] Koşullu biçimlendirme kurallarını listele
- [ ] Mevcut Apps Script dosyalarını listele
- [ ] Trigger ve onEdit akışlarını çıkar
- [ ] Duplicate üreten noktaları tespit et
- [ ] Tarih format bozulmalarını tespit et
- [ ] Grafik veri kaynaklarını doğrula
- [ ] test coverage artır
- [ ] fail durumunda otomatik rollback
- [ ] log dosyasını tarih bazlı sakla

## Çıktılar
- `docs/current-state-audit.md`
- `docs/current-risks.md`

## Kabul kriteri
Mevcut sistemin hangi parçasının güvenilir olduğu, hangi parçasının yeniden yazılacağı netleşmiş olmalı.

---

# FAZ 1 — Bilgi mimarisi ve veri modeli

## Amaç
Sistemi muhasebe tablosundan karar motoruna taşıyacak veri modelini netleştirmek.

## Görevler
- [ ] Tüm veri varlıklarını tanımla
- [ ] Gerçek veri / tahmini veri ayrımını tasarla
- [ ] Sayfalar arası veri akışını tanımla
- [ ] Manuel giriş alanlarını tanımla
- [ ] Türetilen alanları tanımla
- [ ] Mobil kullanım için zorunlu alanları ayıkla
- [ ] Hangi verinin hangi sayfanın tek kaynağı olduğunu tanımla

## Çıktılar
- `docs/data-model.md`
- `docs/sheet-architecture.md`
- `docs/data-flow.md`

## Kabul kriteri
Her sayfanın ne işe yaradığı ve hangi veriyi ürettiği / tükettiği net olmalı.

---

# FAZ 2 — Parametre merkezi

## Amaç
Tüm ana sistem parametrelerini tek bir merkezden yönetmek.

## Görevler
- [ ] Parametreler sayfası oluştur
- [ ] Kur bilgisi alanı ekle
- [ ] Güvenli nakit alt limiti alanı ekle
- [ ] Transit süre parametreleri ekle
- [ ] Tahsil gecikmesi parametreleri ekle
- [ ] Senaryo katsayıları ekle
- [ ] Maksimum kabul edilebilir faiz için referans alanları ekle
- [ ] Sabit gider güvenlik katsayısı ekle
- [ ] Stok eritme indirim katsayısı ekle

## Çıktılar
- `docs/parameters-spec.md`

## Kabul kriteri
Sistem içerisindeki tüm kritik varsayımlar tek sayfadan değiştirilebilir olmalı.

---

# FAZ 3 — Hızlı veri girişi ve güvenli veri akışı

## Amaç
Mobil kullanım için hızlı veri giriş ekranını optimize etmek ve bunu güvenli veri akışına bağlamak.

## Görevler
- [ ] Hızlı Veri Girişi alanlarını sadeleştir
- [ ] Dropdown yapılarını gözden geçir
- [ ] Alan adlarını standardize et
- [ ] Veri giriş başlangıç satırını netleştir
- [ ] Apps Script ile güvenli upsert mantığı kur
- [ ] Duplicate engelleme yap
- [ ] Aynı satır değiştiğinde mirror kayıt güncellenmeli
- [ ] Silinen veya iptal edilen satırların yansıması kontrol edilmeli
- [ ] Günlük Satış verisi özel akışla yönetilmeli

## Çıktılar
- `docs/fast-entry-spec.md`
- güvenli Apps Script modülü

## Kabul kriteri
Aynı kayıt tekrar tekrar çoğalmamalı. Hatalı veri akışı dashboard’u bozmayacak şekilde kontrol altına alınmalı.

---

# FAZ 4 — Sabit ödemeler motoru

## Amaç
Her ay tekrar girilmek zorunda kalınan düzenli giderleri merkezi ve otomatik şekilde yönetmek.

## Kapsam
- maaş
- kira
- aidat
- üyelikler
- kredi taksitleri
- düzenli hizmet ödemeleri
- tekrar eden diğer giderler

## Görevler
- [ ] Sabit Ödemeler sayfası oluştur
- [ ] Tekrarlama tipi alanı ekle
- [ ] Başlangıç / bitiş tarihi alanı ekle
- [ ] Artış tarihi alanı ekle
- [ ] Yeni tutar / revize tutar mantığı ekle
- [ ] Nakit Akışı’na otomatik yansıt
- [ ] Yaklaşan ödemeler listesine düşür
- [ ] Dondurulan / iptal edilen sabit ödemeleri yönet

## Çıktılar
- `docs/fixed-payments-spec.md`
- sabit ödeme üretim fonksiyonu

## Kabul kriteri
Bir sabit ödeme bir kez tanımlandığında gelecek dönemlere otomatik yayılmalı ve değişiklikler ileri dönemleri otomatik güncellemelidir.

---

# FAZ 5 — Borç, kredi ve finansman yönetimi

## Amaç
Borç yükünü kayıt seviyesinden karar seviyesine taşımak.

## Görevler
- [ ] Borç Takibi sayfasını yeniden tasarla
- [ ] Taksitli kredi yapısını destekle
- [ ] Kalan anapara mantığı ekle
- [ ] Aylık ödeme mantığı ekle
- [ ] Faiz oranı alanı ekle
- [ ] Toplam finansman maliyeti hesapla
- [ ] Borç servis karşılama oranı üret
- [ ] Kredi kullan / kullanma analizini kur
- [ ] Maksimum mantıklı faiz formülünü oluştur
- [ ] Borcun sadece açık kapatma mı yoksa değer yaratan ithalat mı finanse ettiğini ayrıştır

## Çıktılar
- `docs/credit-policy.md`
- `docs/borc-modeli.md`

## Kabul kriteri
Sistem, “X kredi + Y faiz + Z ithalat” kombinasyonunun mantıklı olup olmadığını hesaplayabilmeli.

---

# FAZ 6 — Kredi kartı modülü

## Amaç
Kredi kartı ekstre kesim ve son ödeme tarihlerini unutulmaz hale getirmek.

## Görevler
- [ ] Kredi Kartları sayfası oluştur
- [ ] Kart limiti alanı ekle
- [ ] Ekstre kesim günü alanı ekle
- [ ] Son ödeme günü alanı ekle
- [ ] Güncel borç alanı ekle
- [ ] Asgari / tam ödeme tercihi alanı ekle
- [ ] Yaklaşan ekstre / ödeme uyarısı üret
- [ ] Limit aşımı riski göster
- [ ] Kredi kartı finansman baskısını dashboard’a taşı

## Çıktılar
- `docs/credit-card-policy.md`

## Kabul kriteri
Sadece kart borcu girildiğinde sistem yaklaşan ödeme tarihlerini ve baskısını doğru hesaplamalıdır.

---

# FAZ 7 — Açık hesap müşteri alacakları

## Amaç
Vadeli müşteri alacaklarını ayrı ve daha güvenli yönetmek.

## Görevler
- [ ] Açık Hesap Müşteriler sayfası oluştur
- [ ] Müşteri bazlı kayıt yapısı kur
- [ ] Vade tarihi alanı ekle
- [ ] Tahsil durumu alanı ekle
- [ ] Gecikme gün sayısı hesapla
- [ ] Risk skoru hesapla
- [ ] Beklenen tahsilat takvimi üret
- [ ] Geciken alacak uyarılarını oluştur
- [ ] Dashboard’da tahsilat riski bloğu oluştur

## Çıktılar
- `docs/receivables-policy.md`

## Kabul kriteri
Tahsilat riski görünür hale gelmeli, vadeli müşteri alacakları normal satış nakdi ile karışmamalıdır.

---

# FAZ 8 — İthalat siparişi ve çok aşamalı ödeme modeli

## Amaç
İthalatın iki aşamalı / çok aşamalı nakit etkisini doğru modellemek.

## Görevler
- [ ] İthalat Siparişleri sayfası oluştur
- [ ] Sipariş tarihi alanı ekle
- [ ] Tedarikçi alanı ekle
- [ ] Taşıma tipi alanı ekle
- [ ] Ürün grubu alanı ekle
- [ ] Mal bedeli ödeme tarihi ve tutarı alanı ekle
- [ ] Navlun ödeme tarihi ve tutarı alanı ekle
- [ ] Vergi / gümrük ödeme tarihi ve tutarı alanı ekle
- [ ] Tahmini varış tarihi hesapla
- [ ] Satış başlangıç tarihi tahmini ekle
- [ ] İthalatın Nakit Akışı üzerindeki parçalı etkisini hesapla
- [ ] Sipariş iptali / gecikme / kur değişimi senaryolarını düşün

## Çıktılar
- `docs/import-finance-model.md`
- `docs/import-order-spec.md`

## Kabul kriteri
İthalat kararı tek satır değil, zamanlanmış çok aşamalı bir nakit akışı olarak görünmelidir.

---

# FAZ 9 — Ürün bazlı karlılık ve stok devir modeli

## Amaç
Hangi ürünün gerçekten değer yarattığını görmek.

## Görevler
- [ ] Ürün / Stok Karlılık sayfası oluştur
- [ ] Ürün grubu tanımla
- [ ] Brüt kar marjı alanı ekle
- [ ] Tahmini net marj alanı ekle
- [ ] Transit süresi alanı ekle
- [ ] Varış sonrası stok devir süresi alanı ekle
- [ ] Tahsil süresi alanı ekle
- [ ] Finansman etkisi sonrası net getiri hesapla
- [ ] Yıllıklandırılmış sermaye verimi üret
- [ ] Hızlı dönen düşük marj vs yavaş dönen yüksek marj karşılaştırmasını yap
- [ ] Ürün kalite puanı / sermaye verim puanı üret

## Çıktılar
- `docs/inventory-policy.md`
- `docs/product-profit-model.md`

## Kabul kriteri
Sistem, yalnızca marj değil, toplam sermaye verimini esas alan ürün kararı üretebilmelidir.

---

# FAZ 10 — Tahmini satış ve tahmini nakit motoru

## Amaç
Uzun transitli ithalat dönemlerinde sahte manuel alacak girmeye gerek bırakmayan tahmin katmanını kurmak.

## Problem
Gerçek satış alacakları 30 gün ufkunda görünür; deniz ithalatın etkisi 60–90 güne yayılabilir.

## Görevler
- [ ] Tahmini Satışlar sayfası oluştur
- [ ] Tarih bazlı tahmini satış üret
- [ ] Kategori bazlı trailing average mantığı oluştur
- [ ] Muhafazakâr / normal / agresif senaryo üret
- [ ] Tahmini tahsilat süresini modele bağla
- [ ] Tahmini veriyi gerçek veriden ayrı renkte ve ayrı blokta göster
- [ ] Gerçek veri geldikçe tahmini veriyi bastır / düzelt
- [ ] Dashboard’da tahmini ve gerçek nakdi ayrı göster
- [ ] Karar motorunda sadece güven katsayılı tahmini verileri kullan

## Çıktılar
- `docs/sales-forecast-model.md`
- `docs/cashflow-rules.md`

## Kabul kriteri
Sistem uzun vadeli ithalat kararları için görünürlük sağlamalı, ama kullanıcıyı hayali alacakla kandırmamalıdır.

---

# FAZ 11 — Minimum gerekli marj ve devir modeli

## Amaç
Firmanın sabit giderleri taşıyabilmesi için alt sınırları belirlemek.

## Görevler
- [ ] Sabit gider toplamını baz al
- [ ] Ortalama tahsil süresi etkisini dahil et
- [ ] Ortalama finansman maliyetini dahil et
- [ ] Ürün grubu bazlı marj / devir kombinasyonlarını çöz
- [ ] Minimum gerekli brüt marjı hesapla
- [ ] Maksimum kabul edilebilir devir süresini hesapla
- [ ] Farklı senaryolarda bu eşikleri yeniden üret
- [ ] Dashboard’a “altına düşme” uyarısı ekle

## Çıktılar
- `docs/min-margin-turnover-model.md`

## Kabul kriteri
Sistem “bu yapı sabit giderleri taşımaz” diyebilmeli ve bunu sayıyla göstermelidir.

---

# FAZ 12 — Güvenli ithalat kapasitesi ve kredi eşiği modeli

## Amaç
Ne kadar ithalatın güvenli olduğunu ve hangi faiz seviyesinin kabul edilebilir olduğunu hesaplamak.

## Görevler
- [ ] 30 / 60 / 90 günlük nakit baskısını topla
- [ ] Sabit ödemeleri dahil et
- [ ] Borç servislerini dahil et
- [ ] İthalatın parçalı ödeme takvimini dahil et
- [ ] Tahmini satışlardan güven katsayılı katkıyı ekle
- [ ] Güvenli ithalat kapasitesini hesapla
- [ ] X kredi / Y faiz / Z ithalat senaryosu kur
- [ ] Maksimum mantıklı faiz oranısını hesapla
- [ ] Krediyle büyümenin pozitif / negatif olduğu sınırı belirle

## Çıktılar
- `docs/credit-threshold-model.md`
- `docs/safe-import-capacity.md`

## Kabul kriteri
Sistem “aylık %y faize kadar x kredi kullanıp z ithalat yapabilirsin” benzeri bir öneri üretebilmelidir.

---

# FAZ 13 — Karar motoru

## Amaç
Sistemin sadece gösteren değil, yönlendiren hale gelmesi.

## Görevler
- [ ] Karar kurallarını yaz
- [ ] Çok kriterli karar mantığı kur
- [ ] Önceliklendirme mantığı ekle
- [ ] Çelişen kararları çöz
- [ ] Nakit riski > büyüme fırsatı gibi öncelikler tanımla
- [ ] “Bugün ne yapmalıyım?” çıktısı üret
- [ ] Aksiyon başlıklarını standardize et
- [ ] Kararların veri dayanaklarını göster

## Örnek kararlar
- [ ] Güvenli şekilde ithalat yap
- [ ] Temkinli büyü
- [ ] İthalatı yavaşlat
- [ ] Stok alımını ertele
- [ ] Kredi kullan
- [ ] Bu faizle kredi kullanma
- [ ] Tahsilatı hızlandır
- [ ] Fiyat kırıp stoğu erit
- [ ] Giderleri kıs
- [ ] Personel azaltımını değerlendir
- [ ] Küçülme moduna geç

## Çıktılar
- `docs/decision-engine.md`

## Kabul kriteri
Dashboard üzerinde görünen kararlar tutarlı, izah edilebilir ve veri ile desteklenmiş olmalıdır.

---

# FAZ 14 — Dashboard ve mobil deneyim

## Amaç
Telefon ekranından 30 saniyede okunabilir bir yönetim paneli oluşturmak.

## Görevler
- [ ] Ana Kontrol Paneli’ni sadeleştir
- [ ] Dashboard’u karar odaklı yeniden tasarla
- [ ] KPI bloklarını önceliklendir
- [ ] 7 / 30 / 60 / 90 gün görünümünü sadeleştir
- [ ] Risk alanlarını renk kodla
- [ ] Tahmini ve gerçek veriyi görsel olarak ayır
- [ ] Yaklaşan ödeme ve tahsilat bloklarını öne çıkar
- [ ] Güvenli ithalat kapasitesi bloğu ekle
- [ ] Maksimum mantıklı kredi / faiz bloğu ekle
- [ ] Minimum gerekli marj / devir bloğu ekle

## Çıktılar
- `docs/dashboard-spec.md`
- `docs/mobile-ux-notes.md`

## Kabul kriteri
Telefon ekranından açıldığında ilk 20–30 satır içinde ana kararlar okunabilmelidir.

---

# FAZ 15 — Uyarılar ve otomasyonlar

## Amaç
Unutma, geç kalma ve sessiz çöküş riskini azaltmak.

## Görevler
- [ ] Yaklaşan ödemeler görünümü oluştur
- [ ] Yaklaşan tahsilatlar görünümü oluştur
- [ ] Geciken alacak uyarısı üret
- [ ] Kredi kartı son ödeme uyarısı üret
- [ ] Güvenli nakit altı uyarısı üret
- [ ] Negatif bakiye tarihi uyarısı üret
- [ ] Yavaş dönen stok uyarısı üret
- [ ] Faizi karşılamayan ithalat uyarısı üret
- [ ] Sabit gider baskısı uyarısı üret
- [ ] Apps Script menüsü ile dashboard yenileme fonksiyonu ekle

## Çıktılar
- `docs/alerts-and-automations.md`

## Kabul kriteri
Önemli finansal riskler kullanıcı fark etmeden büyümemelidir.

---

# FAZ 16 — Apps Script modülerizasyonu

## Amaç
Script tarafını güvenli, okunabilir ve test edilebilir hale getirmek.

## Görevler
- [ ] Script dosyalarını modüllere ayır
- [ ] onEdit’i minimum sorumlulukla sadeleştir
- [ ] Yardımcı fonksiyonları ayır
- [ ] Upsert / duplicate engelleme modülü kur
- [ ] Loglama modülü ekle
- [ ] Dashboard yenileme fonksiyonu ekle
- [ ] Sabit ödeme üretim fonksiyonu ekle
- [ ] Yaklaşan ödeme hesaplayıcıyı script veya formül düzeyinde netleştir
- [ ] Test verisi üretim fonksiyonu ekle
- [ ] Smoke test fonksiyonları ekle

## Çıktılar
- `docs/apps-script-architecture.md`
- modüler Apps Script kodu

## Kabul kriteri
Kod yapısı bir AI ajan tarafından okunabilir ve güvenle geliştirilebilir olmalıdır.

---

# FAZ 17 — Test, doğrulama ve emniyet katmanı

## Amaç
Sistemin yanlış yönlendirme üretmesini engellemek.

## Görevler
- [ ] Aynı satır güncelleme testleri
- [ ] Duplicate testleri
- [ ] Sheet adı değişikliği testleri
- [ ] Tarih format testleri
- [ ] Kredi kartı uyarı testleri
- [ ] Sabit ödeme artış testleri
- [ ] İthalat çok aşamalı ödeme testleri
- [ ] Tahmini satış motoru testleri
- [ ] Karar motoru sınır senaryo testleri
- [ ] Dashboard veri kaynağı testleri
- [ ] Test sonuçlarını sayfaya veya log’a yazma

## Çıktılar
- `docs/qa-checklist.md`
- `docs/test-scenarios.md`

## Kabul kriteri
Canlı sistem güvenilir minimum kalite eşiğini geçmeden devreye alınmamalıdır.

---

# FAZ 18 — Yerel geliştirme ve ajan entegrasyonu

## Amaç
Codex / VS Code / clasp ile sürdürülebilir geliştirme ortamı kurmak.

## Görevler
- [ ] `clasp` ile Apps Script projesini local repoya bağla
- [ ] Repo yapısını standardize et
- [ ] `.clasp.json` / `appsscript.json` düzenini netleştir
- [ ] Yedekleme prosedürü oluştur
- [ ] Push öncesi test akışı oluştur
- [ ] Kod inceleme ve geri alma prosedürü oluştur
- [ ] Ajan komut şablonlarını yaz
- [ ] Canlı / test sheet ayrımı düşün

## Çıktılar
- `docs/local-dev-workflow.md`
- `docs/agent-prompts.md`
- `docs/deployment-runbook.md`

## Kabul kriteri
Ajan destekli geliştirme kontrollü, geri alınabilir ve izlenebilir olmalıdır.

---

## 12. Öncelik matrisi

### P0 — Kritik
- mevcut sistem analizi
- duplicate / veri akışı sorunlarının çözümü
- veri modelinin netleşmesi
- parametre merkezi
- sabit ödemeler
- ithalat çok aşamalı ödeme modeli
- tahmini satış motorunun ana iskeleti

### P1 — Çok önemli
- kredi kartı modülü
- açık hesap müşteri modülü
- minimum marj / devir modeli
- güvenli ithalat kapasitesi
- karar motoru

### P2 — Güçlendirici
- mobil dashboard iyileştirmeleri
- loglama
- test ekranları
- ileri düzey ajan entegrasyonu

---

## 13. Teknik kurallar

### 13.1. Sheets kuralları
- Sayfa adları sabit ve standardize olmalı
- Başlık satırları standardize olmalı
- Tarih formatı tek tip olmalı
- Para formatı tek tip olmalı
- Tahmini ve gerçek veriler renkle ayrılmalı
- Ana veri kaynakları mümkünse tek tablodan okunmalı

### 13.2. Apps Script kuralları
- `appendRow` yalnızca gerçekten gerekli yerde kullanılmalı
- Mirror kayıtlar key bazlı upsert edilmeli
- Aynı veri iki kez çoğalmamalı
- Yardımcı fonksiyonlar küçük ve okunabilir olmalı
- Destructive işlem öncesi onay istenmeli
- Log tutulmalı

### 13.3. Ajan kuralları
- Her işten önce backlog okunmalı
- Önce analiz, sonra değişiklik
- Canlıya zarar verecek işlem öncesi soru sorulmalı
- Yapılan değişiklik kısa raporlanmalı
- Test edilmeden “tamamlandı” denmemeli

---

## 14. Riskler ve kör noktalar

### 14.1. Finansal riskler
- ciro büyürken sermaye erimesi
- yüksek marjlı ama yavaş dönen stokta para kilitlenmesi
- sabit giderlerin ciroyu yemesi
- krediyle kısa vadeli rahatlama ama uzun vadeli bozulma
- deniz ithalat süresinde görünmeyen gelecek nakit yüzünden yanlış karar

### 14.2. Teknik riskler
- duplicate kayıt
- yanlış sheet’e yazım
- tarih format bozulması
- formül kırılması
- dashboard’un yanlış veri okuması
- tahmini ve gerçek verinin karışması

### 14.3. Yönetim riski
- sisteme veri girişi aksarsa karar motoru çöker
- gerçek hayattaki davranış modele uymazsa tahminler yanıltır
- kötü senaryo katsayıları düşük seçilirse sistem aşırı iyimser olur

---

## 15. Done tanımı

Bir faz ancak şu koşullarda tamamlandı sayılır:

- gereksinimler dokümante edildi
- veri modeli netleşti
- ilgili sayfa / kod değişikliği uygulandı
- en az temel testleri geçti
- sonucu kısa raporlandı
- canlı veriyi bozmadığı doğrulandı

---

## 16. Çalışma komutu standardı

AI ajanı için temel komut:

> `docs/backlog.md dosyasını oku. Henüz tamamlanmamış en yüksek öncelikli fazı seç. Önce mevcut durumu analiz et. Sonra gerekli dosya değişikliklerini yap. Test et. Sonucu kısa raporla. Canlıya zarar verecek işlem yapmadan önce sor.`

Alternatif komut:

> `docs/backlog.md ve ilgili dokümanlara göre şu an en kritik blokajı bul. En yüksek kaldıraçlı sonraki adımı uygula. Yaptığın değişikliği özetle. Test et. Push veya destructive işlem öncesi onay iste.`

---

## 17. İlk yürütme sırası

İlk geliştirme turunda önerilen sırayla ilerleme:

1. FAZ 0 — mevcut sistem analizi
2. FAZ 1 — veri modeli
3. FAZ 2 — parametre merkezi
4. FAZ 3 — hızlı veri girişi ve güvenli veri akışı
5. FAZ 4 — sabit ödemeler
6. FAZ 8 — ithalat çok aşamalı ödeme modeli
7. FAZ 10 — tahmini satış motorunun iskeleti
8. FAZ 11 — minimum marj / devir modeli
9. FAZ 12 — güvenli ithalat kapasitesi ve kredi eşiği
10. FAZ 13 — karar motoru
11. FAZ 14 — dashboard
12. FAZ 15+ — otomasyon, test, ajan akışı

---

## 18. Nihai ürün tanımı

Bu proje tamamlandığında sistem:

- gerçek nakdi gösterecek
- gelecek riskleri gösterecek
- ithalatı güvenli seviyede tutacak
- kredi kararını matematikle verecek
- minimum gerekli marjı ve devir hızını gösterecek
- sahte iyimserlik yerine kontrollü tahmin kullanacak
- büyüme / küçülme / stok eritme / gider azaltma kararlarını veriyle önerecek

Bu backlog, projenin ana omurgasıdır.
