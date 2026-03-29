# KPI DEFINITIONS

## Amaç
Sistemin ürettiği metrikleri standart tanımlarla belgelemek, karar motorunun ve Dashboard'un hangi KPI'ı nasıl hesaplayacağını netleştirmek.

## Temel ilke
KPI tek başına anlam taşımaz. Her metrik bağlamı, eşiği ve karar etkisi ile birlikte tanımlanmalıdır.

---

## 1. Nakit metrikleri

### 1.1. Bugünkü gerçek nakit
Tanım: Bugün itibarıyla gerçekleşmiş tüm giriş ve çıkışlar sonrası kalan bakiye.
Kaynak: Nakit Akışı (yalnızca `actual` statülü satırlar)
Birim: TRY
Yorum: Tahmini veya planlı yükümlülükler dahil değildir.

### 1.2. Güvenli nakit tamponu durumu
Tanım: Bugünkü gerçek nakit - güvenli nakit alt limiti
Kaynak: Nakit Akışı + Parametreler (`safe_cash_floor`)
Birim: TRY
Eşik: Negatifse kritik risk. Sıfıra yakınsa uyarı.

### 1.3. Aylık net nakit değişimi
Tanım: Son 30 günde gerçekleşen toplam nakit girişi - çıkışı
Kaynak: Nakit Akışı
Birim: TRY
Yorum: Pozitifse nakit büyüyor, negatifse eriyor.

### 1.4. Negatif gün sayısı
Tanım: Projeksiyon ufkunda (90 gün) bakiyenin sıfırın altında kaldığı gün sayısı.
Kaynak: Nakit Akışı projeksiyonu
Birim: gün
Eşik: 0 = ideal. 1+ = risk mevcut.

### 1.5. En riskli tarih
Tanım: Projeksiyon ufkunda en düşük bakiyenin görüldüğü tarih.
Kaynak: Nakit Akışı projeksiyonu
Birim: tarih
Yorum: Karar motoru için öncelikli girdi.

### 1.6. 7/30/60/90 gün minimum bakiye
Tanım: İlgili ufukta görülen en düşük bakiye tutarı.
Kaynak: Nakit Akışı projeksiyonu
Birim: TRY
Yorum: Her ufukta güvenli tampon altına düşüş olup olmadığı kontrol edilir.

---

## 2. Karlılık metrikleri

### 2.1. Brüt kar marjı
Tanım: (Satış fiyatı - Mal maliyeti) / Satış fiyatı × 100
Kaynak: Ürün / Stok Karlılık
Birim: %
Yorum: Transit, finansman ve tahsilat etkisini içermez.

### 2.2. Tahmini net kar marjı
Tanım: Brüt marj - finansman etkisi - bekleme süresi maliyeti - tahsilat gecikme etkisi
Kaynak: Ürün / Stok Karlılık + Parametreler
Birim: %
Yorum: Gerçek değer üretimini gösterir.

### 2.3. Finansman sonrası net getiri
Tanım: Net marj - finansman maliyeti (faiz + bekleme)
Kaynak: Ürün / Stok Karlılık
Birim: TRY veya %
Eşik: Negatifse ürün sermaye tüketiyor demektir.

### 2.4. Yıllıklandırılmış sermaye verimi
Tanım: Bir çevrimdeki net getiri × (365 / toplam çevrim süresi)
Kaynak: Ürün / Stok Karlılık
Birim: %
Yorum: Yavaş dönen yüksek marj ile hızlı dönen orta marjı karşılaştırır.

---

## 3. Operasyon metrikleri

### 3.1. Ortalama stok devir süresi
Tanım: Ürün stoğa girdikten satışa çıkana kadar ortalama geçen gün sayısı.
Kaynak: Stok Envanter + satış verileri
Birim: gün
Eşik: `max_acceptable_inventory_turn_days` parametresini aşarsa uyarı.

### 3.2. Toplam sermaye çevrim süresi
Tanım: Transit süresi + stok devir süresi + tahsilat süresi
Kaynak: İthalat Siparişleri + Stok + Alacak
Birim: gün
Yorum: Bu süre uzadıkça sermaye verimliliği düşer.

### 3.3. Ortalama tahsil süresi
Tanım: Satış / fatura tarihinden tahsilat tarihine kadar geçen ortalama gün sayısı.
Kaynak: Açık Hesap Müşteriler
Birim: gün
Eşik: `late_collection_warning_days` parametresini aşarsa uyarı.

### 3.4. Açık hesap gecikme oranı
Tanım: Geciken alacak sayısı / toplam açık alacak sayısı × 100
Kaynak: Açık Hesap Müşteriler
Birim: %
Yorum: Yüksekse tahsilat disiplini bozuluyor demektir.

---

## 4. Finansman metrikleri

### 4.1. Borç servis karşılama oranı (DSCR)
Tanım: Aylık faaliyet kaynaklı nakit yaratımı / aylık toplam borç servisi (anapara + faiz)
Kaynak: Nakit Akışı + Borç Takibi
Birim: oran
Eşik: `minimum_dscr_threshold` parametresi. 1.0 altı kritik, 1.2 altı dikkat.

### 4.2. Toplam finansman baskısı
Tanım: Aylık toplam finansman gideri (kredi faizi + kart faizi + diğer finansman maliyetleri)
Kaynak: Borç Takibi + Kredi Kartları
Birim: TRY
Yorum: Artış trendi varsa uyarı.

### 4.3. Kredi kartı limit kullanım oranı
Tanım: Toplam kart borcu / toplam kart limiti × 100
Kaynak: Kredi Kartları
Birim: %
Eşik: %80 dikkat, %90 yüksek risk.

### 4.4. Maksimum mantıklı aylık faiz oranı
Tanım: Sistem tarafından hesaplanan, finansman sonrası net katkının pozitif kaldığı en yüksek faiz seviyesi.
Kaynak: Güvenli İthalat Kapasitesi + Ürün Verim modeli
Birim: %
Yorum: Kararlar bu eşiğe göre kredi kullan / kullanma çıktısı üretir.

---

## 5. Sabit gider metrikleri

### 5.1. Sabit gider karşılama oranı
Tanım: Aylık net nakit yaratımı / aylık sabit gider toplamı
Kaynak: Nakit Akışı + Sabit Ödemeler
Birim: oran
Eşik: 1.0 altı kritik — sabit giderler taşınamıyor demektir.

### 5.2. Minimum gerekli brüt marj
Tanım: Sabit giderleri + finansman maliyetini + operasyonel riski taşımak için gerekli alt sınır marj.
Kaynak: Min Margin Turnover Model
Birim: %
Yorum: Bu eşiğin altındaki ürünler sermaye eritici.

### 5.3. Maksimum kabul edilebilir devir süresi
Tanım: Bu marj seviyesinde nakde dönüş süresi eşiği.
Kaynak: Min Margin Turnover Model
Birim: gün

---

## 6. İthalat metrikleri

### 6.1. Güvenli ithalat kapasitesi
Tanım: 30/60/90 gün görünümünde güvenli tamponu koruyarak yapılabilecek maksimum ithalat tutarı.
Kaynak: Safe Import Capacity modeli
Birim: USD veya TRY
Yorum: Temkinli ve riskli kapasite ayrı gösterilir.

### 6.2. İthalat nakit baskı profili
Tanım: Aktif ithalat siparişlerinin gelecek 90 gündeki toplam planlı çıkışı.
Kaynak: İthalat Siparişleri
Birim: TRY
Yorum: Mal + navlun + gümrük ayrı ayrı toplanır.

---

## 7. Karar metrikleri

### 7.1. Sermaye büyüme / erime oranı
Tanım: Dönem sonu toplam varlık - dönem başı toplam varlık
Kaynak: Dashboard özet
Birim: TRY veya %
Yorum: Negatif trend = firma büyürken bile sermaye eriyor olabilir.

### 7.2. Büyüme yönü sinyali
Tanım: Nakit risk, stok kalite, finansman baskısı ve sabit gider karşılama skorlarının bileşik değerlendirmesi.
Kaynak: Karar Motoru
Çıktı: Büyü / Temkinli büyü / Dur / Küçül
Yorum: Dashboard'daki ana yönlendirme kararıdır.

---

## Dashboard gösterim önceliği
1. Bugünkü gerçek nakit + tampon durumu
2. En riskli tarih + negatif gün sayısı
3. 7/30/60/90 minimum bakiye
4. Sabit gider karşılama oranı
5. Güvenli ithalat kapasitesi
6. Büyüme yönü sinyali

## Kabul kriterleri
- Her KPI'ın kaynak modülü, birimi ve eşik değeri tanımlı olmalı.
- Dashboard ve Karar Motoru aynı tanımları kullanmalı.
- KPI hesaplamasında gerçek ve tahmini veri ayrımı korunmalı.
- Eşik değerleri mümkünse Parametreler sayfasından gelmeli.
