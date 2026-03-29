# SALES FORECAST MODEL

## Amaç
Uzun transitli dönemlerde görünürlük üretmek, fakat kullanıcıyı hayali nakitle yanıltmamak.

## Temel ilke
Tahmin katmanı, gerçek verinin yerine geçmez.

Bu modelin görevi:
- 30 gün ötesinde tahsilat görünürlüğü sağlamak
- ithalat kararını desteklemek
- iyimserlik yerine kontrollü, güven katsayılı tahmin üretmek

## Ne için kullanılır
- ithalat sonrası satış başlangıcını görmek
- güvenli ithalat kapasitesi hesabını desteklemek
- Dashboard’da 60/90 gün görünümünü zenginleştirmek
- Karar Motoru’na yardımcı veri sağlamak

## Veri kaynakları
- geçmiş gerçek satışlar
- geçmiş tahsilat davranışı
- ürün grubu bazlı performans
- ithalat siparişleri
- sezonluk veya kampanya etkisi varsa ilgili parametreler
- Parametreler sayfasındaki senaryo katsayıları

## Tahmin katmanı kuralları
- Gerçek veriyle aynı tabloda izsiz birleşmez.
- Her tahmin satırı senaryo tipi taşır.
- Her tahmin satırı güven skoru taşır.
- Düşük güvenli tahminler ana karar katmanına tam ağırlıkla verilmez.

## Temel alanlar
- `forecast_id`
- `forecast_date`
- `product_group`
- `scenario_type`
- `projected_sales_amount`
- `projected_collection_date`
- `confidence_score`
- `assumption_version`
- `override_by_actual`

## Senaryo türleri

### Muhafazakar
- güvenli varsayımlar
- daha düşük satış katkısı
- karar motorunda varsayılan ana senaryo olmaya daha uygundur

### Normal
- geçmiş eğilime daha yakın görünüm

### Agresif
- yalnızca yönetim değerlendirmesi için
- ana karar çıktısında sınırlı kullanılmalı

## Hesap yaklaşımı

### 1. Başlangıç sinyali
- geçmiş satış ortalaması
- ürün grubu bazlı performans
- son dönem eğilimi

### 2. İthalat etkisi
- ürünün ne zaman satışa açılacağı
- stok bulunurluğunun ne zaman artacağı

### 3. Tahsilat dönüşümü
- satış tarihi ile tahsilat tarihi aynı kabul edilmez
- tahsilat gecikme katsayısı kullanılır

### 4. Güven skoru
Skoru etkileyen unsurlar:
- veri kalitesi
- geçmiş tutarlılık
- ürün grubu oynaklığı
- tahsilat davranışı
- ithalat varış belirsizliği

## Gerçek veri geldiğinde davranış
- Tahmin silinmek zorunda değildir.
- İlgili kayıt `override edildi` veya eşdeğer statü alır.
- Aynı dönem için ikinci kez nakit katkısı yaratmaz.

## Karar motoru kullanım kuralları
- Muhafazakar ve yeterli güven skorlu tahminler ana kararlarda kullanılabilir.
- Düşük güvenli tahminler yalnızca yardımcı görünümde kalmalıdır.
- Agresif tahminler “güvenli ithalat” kararı üretmek için tek başına kullanılamaz.

## Dashboard gösterim kuralları
- Tahmini katkı ayrı blok veya işaret ile gösterilmelidir.
- Gerçek nakit ile aynı görünümde toplansa bile açıklama etiketi bulunmalıdır.

## Çıktılar
- 30/60/90 gün tahmini satış görünümü
- beklenen tahsilat takvimi
- senaryo bazlı satış katkısı
- güven skoru

## Riskler
- sahte iyimserlik
- geç gelen gerçek veri yüzünden çift sayım
- tahsilat davranışının satış kadar hızlı dönmemesi
- ithalat gecikmesinin tahmini bozması

## Kabul kriterleri
- Tahminler gerçek veriden ayrılmalı.
- Tahsilat dönüşümü satıştan ayrı hesaplanmalı.
- Güven skoru olmayan tahmin karar motoruna girmemeli.
- Gerçek veri geldiğinde override mantığı çalışmalı.
