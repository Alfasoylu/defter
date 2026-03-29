# DASHBOARD SPEC

## Amaç
Dashboard'un amacı, yöneticinin 20-30 saniye içinde işletmenin finansal riskini ve aksiyon önceliğini görebilmesidir.

## Temel ilke
Dashboard bir rapor çöplüğü olmamalıdır.

Öncelik sırası:
1. Bugünkü durum
2. Yakın dönem risk
3. Kritik aksiyon
4. Karar destek verisi

## Hedef görünüm
Dashboard ilk ekranda şu sorulara cevap vermelidir:
- bugün gerçek nakit ne kadar
- 7/30/60/90 gün görünümünde risk var mı
- en riskli tarih hangisi
- güvenli ithalat kapasitesi nedir
- kredi kullanmak mantıklı mı
- bugün hangi aksiyonu almak gerekir

## Zorunlu bloklar

### 1. Üst özet blok
Gösterilecek alanlar:
- bugünkü gerçek nakit
- güvenli nakit alt limiti
- tampon durumu
- en riskli tarih
- negatif gün sayısı

### 2. Zaman ufku bloğu
Gösterilecek görünüm:
- 7 gün
- 30 gün
- 60 gün
- 90 gün

Her ufukta en az:
- minimum bakiye
- tampon altına düşüş var/yok
- negatif bakiye var/yok

### 3. Bugün ne yapmalıyım bloğu
Kaynak:
- Karar Motoru

Gösterilecek alanlar:
- en yüksek öncelikli karar
- neden
- önerilen aksiyon

### 4. Yaklaşan ödemeler bloğu
Kaynak:
- Yaklaşan Ödemeler

Gösterilecek alanlar:
- ilk 5 kritik ödeme
- toplam 7 gün ödeme yükü
- toplam 30 gün ödeme yükü

### 5. Yaklaşan tahsilatlar bloğu
Kaynak:
- Yaklaşan Tahsilatlar

Gösterilecek alanlar:
- ilk 5 beklenen tahsilat
- geciken tahsilatlar toplamı
- yüksek riskli açık hesap sayısı

### 6. Güvenli ithalat kapasitesi bloğu
Gösterilecek alanlar:
- bugün güvenli ithalat kapasitesi
- temkinli kapasite
- ana darboğaz nedeni

### 7. Kredi ve finansman bloğu
Gösterilecek alanlar:
- maksimum mantıklı faiz seviyesi
- önerilen kredi kullan / kullanma sinyali
- borç servis baskısı

### 8. Stok ve verim bloğu
Gösterilecek alanlar:
- en verimli ürün grupları
- yavaş dönen kritik stok
- fiyat kırma / azaltma önerisi

## Görsel ayrım kuralları
- Gerçek veri ve tahmini veri aynı renk grubunda gösterilmemeli.
- Kritik risk blokları ilk ekranda yukarıda olmalı.
- Yorum gerektiren detaylar ikinci seviyede kalmalı.
- Mobil görünümde yatay kaydırma zorunlu olmamalı.

## Renk ve durum mantığı
- yeşil: güvenli
- sarı: dikkat
- kırmızı: kritik

Not:
- renk tek başına yeterli değil; her blokta kısa metin etiketi de olmalı

## Veri kaynak kuralları
- Dashboard manuel veri girişi sayfası değildir.
- Sadece tanımlı kaynak sayfalardan veri okur.
- Tahmini veri katkısı varsa ayrı işaret taşır.
- Hangi metrik hangi kaynaktan geliyor izlenebilir olmalıdır.

## Mobil öncelik sırası
Mobilde ilk görünen bölümler:
1. Üst özet blok
2. Bugün ne yapmalıyım
3. 7/30/60/90 görünümü
4. Yaklaşan ödemeler
5. Güvenli ithalat kapasitesi

## Kabul kriterleri
- İlk ekranda ana karar okunabiliyor olmalı.
- Gerçek ve tahmini katkı karışmamalı.
- 7/30/60/90 görünümü güvenilir kaynaklardan beslenmeli.
- Kullanıcı en riskli tarihi tek bakışta görebilmeli.
