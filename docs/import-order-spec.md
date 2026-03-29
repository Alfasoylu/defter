# IMPORT ORDER SPEC

## Amaç
İthalat siparişlerini operasyonel kayıt seviyesinde standartlaştırmak ve finans modeline doğru veri beslemek.

## Temel ilke
- İthalat siparişi, tek tarihli tek tutarlı kayıt değildir.
- Operasyonel kayıt ile finansal etkiler ayrıştırılmalı ama bağlantılı tutulmalıdır.

## Zorunlu alanlar
- `import_id`
- `supplier_name`
- `transport_type`
- `product_group`
- `order_date`
- `currency`
- `fx_rate_at_order`
- `goods_payment_date`
- `goods_payment_amount`
- `freight_payment_date`
- `freight_payment_amount`
- `customs_payment_date`
- `customs_payment_amount`
- `estimated_arrival_date`
- `estimated_sale_start_date`
- `status`

## Yardımcı alanlar
- `supplier_invoice_no`
- `container_or_shipment_no`
- `incoterm`
- `notes`
- `delay_reason`

## Durum akışı
- planlandı
- sipariş verildi
- ödeme kısmen yapıldı
- yolda
- gümrükte
- teslim alındı
- iptal

## Kayıt kuralları
- Mal bedeli, navlun ve gümrük ayrı alanlarla tutulur.
- Taşıma tipi zorunludur.
- Ürün grubu zorunludur.
- Tahmini varış ve satış başlangıcı boş bırakılmamalıdır; en az varsayılan parametreyle üretilmelidir.

## Finans modeline beslediği çıktılar
- parçalı ödeme takvimi
- varış tarihi
- satış başlangıç tahmini
- kur etkisi
- ithalat yükü

## Operasyon kuralları
- Sipariş güncellendiğinde finansal yansıma duplicate üretmemelidir.
- Gecikme veya iptal durumunda tahmini satış ve nakit baskısı yeniden değerlendirilmelidir.
- Kısmi sevkiyat varsa ayrı işlenebilmelidir.

## Kabul kriterleri
- İthalat siparişi finans modeline eksiksiz veri verebilmeli.
- Gecikme, iptal ve kısmi ödeme davranışları yönetilebilir olmalı.
- Tek sipariş, tek satır toplamı gibi davranmamalı.
