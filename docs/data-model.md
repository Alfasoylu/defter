# DATA MODEL

## Amaç
Bu modelin amacı, sistemi yalnızca kayıt tutan bir yapıdan çıkarıp karar üreten bir yapıya taşımaktır.

Temel kurallar:
- Gerçek veri, tahmini veri ve parametre verisi birbirine karıştırılmaz.
- Her kritik veri alanının tek bir sahip tablosu vardır.
- Aynı iş olayı iki ayrı tabloda manuel olarak girilmez.
- Apps Script tarafında tüm yansıtma işlemleri key bazlı upsert mantığı ile çalışmalıdır.

## Veri sınıfları

### 1. Gerçek veri
Gerçekleşmiş, belgeye veya fiili işleme dayanan veridir.

Örnekler:
- gerçekleşmiş nakit girişleri
- gerçekleşmiş nakit çıkışları
- kesilmiş kredi kartı ekstresi
- vadeli müşteri alacağı
- oluşmuş borç taksidi
- verilmiş ithalat siparişi
- ödenmiş ithalat maliyet kalemi

### 2. Tahmini veri
Henüz gerçekleşmemiş, model tarafından üretilen veya kullanıcı tarafından senaryo amaçlı girilen veridir.

Örnekler:
- tahmini satışlar
- tahmini tahsilatlar
- ithalat sonrası tahmini satış başlangıcı
- senaryo bazlı tahmini nakit katkısı

### 3. Parametre verisi
Merkezi olarak yönetilen, birden fazla modül tarafından kullanılan ayar verisidir.

Örnekler:
- USD/TRY kuru
- güvenli nakit alt limiti
- hava ve deniz transit süresi
- tahsilat gecikme katsayısı
- muhafazakar senaryo katsayısı
- maksimum kabul edilebilir faiz referansı

## Kimlik ve sahiplik kuralları

### Kayıt kimliği
- Her ana tabloda benzersiz bir `record_id` veya eşdeğer tekil anahtar bulunmalıdır.
- Aynı iş olayını temsil eden satırlar aynı anahtarla güncellenmelidir.
- Script tarafında `appendRow` varsayılan çözüm değildir; önce eşleşen kayıt aranır, varsa güncellenir.

### Tek kaynak sahipliği
- Hızlı Veri Girişi, kullanıcı aksiyonunun tek giriş noktasıdır.
- Nakit Akışı, birleşik görünüm tablosudur; manuel kaynak tablo değildir.
- Tahmini tablolar gerçek kayıtların yerine geçmez.
- Dashboard ve Karar Motoru yalnızca kaynak tablolardan veya güvenli özet tablolardan veri okur.

## Ana tablolar

### Parametreler
Amaç:
- Tüm sistem varsayımlarını tek merkezde toplamak.

Veri sınıfı:
- Parametre

Zorunlu alanlar:
- `param_key`
- `param_group`
- `param_value`
- `value_type`
- `updated_at`
- `updated_by`

Örnek anahtarlar:
- `usd_try`
- `safe_cash_floor`
- `sea_transit_days`
- `air_transit_days`
- `collection_delay_factor`
- `forecast_confidence_factor`

Tek sahip olduğu veri:
- Sistem genelinde ortak kullanılan tüm varsayımlar

### Hızlı Veri Girişi
Amaç:
- Mobil öncelikli günlük operasyon girişi

Veri sınıfı:
- Gerçek veri

Zorunlu alanlar:
- `entry_id`
- `entry_date`
- `record_type`
- `category`
- `counterparty`
- `amount`
- `currency`
- `payment_status`
- `source_sheet`
- `notes`
- `created_at`
- `updated_at`

Örnek kayıt türleri:
- satış tahsilatı
- manuel ödeme
- borç ödemesi
- masraf
- kart harcaması

Tek sahip olduğu veri:
- Kullanıcı tarafından girilen ham operasyon kaydı

### Nakit Akışı
Amaç:
- Tüm gerçek ve kontrollü tahmini etkileri tarih bazında birleştirmek

Veri sınıfı:
- Türetilmiş görünüm

Zorunlu alanlar:
- `cashflow_id`
- `flow_date`
- `flow_type`
- `source_module`
- `source_record_id`
- `scenario_type`
- `direction`
- `amount_try`
- `is_actual`
- `confidence_score`
- `running_balance`

Kurallar:
- Manuel giriş tablosu değildir.
- Aynı kaynak kaydın birden fazla yansıması varsa, her yansıma ayrı satır ama aynı `source_record_id` ile izlenir.
- `scenario_type` alanı en az `actual`, `forecast`, `stress` değerlerini desteklemelidir.

### Sabit Ödemeler
Amaç:
- Tek tanımla çok dönemli gider planı üretmek

Veri sınıfı:
- Gerçek planlı veri

Zorunlu alanlar:
- `fixed_payment_id`
- `expense_name`
- `expense_group`
- `start_date`
- `end_date`
- `repeat_type`
- `amount`
- `currency`
- `increase_date`
- `revised_amount`
- `status`

Durum alanları:
- aktif
- donduruldu
- iptal

### Borç Takibi
Amaç:
- Borç yükünü, ödeme takvimini ve finansman baskısını izlemek

Veri sınıfı:
- Gerçek veri

Zorunlu alanlar:
- `debt_id`
- `debt_type`
- `lender`
- `principal_amount`
- `currency`
- `start_date`
- `maturity_date`
- `installment_amount`
- `interest_rate_monthly`
- `remaining_principal`
- `payment_day`
- `status`

### Kredi Kartları
Amaç:
- Ekstre ve ödeme baskısını görünür kılmak

Veri sınıfı:
- Gerçek veri

Zorunlu alanlar:
- `card_id`
- `card_name`
- `bank_name`
- `credit_limit`
- `statement_day`
- `due_day`
- `current_balance`
- `payment_preference`
- `status`

### Açık Hesap Müşteriler
Amaç:
- Tahsil edilmemiş satışları nakitten ayırmak

Veri sınıfı:
- Gerçek veri

Zorunlu alanlar:
- `receivable_id`
- `customer_name`
- `invoice_or_order_no`
- `issue_date`
- `due_date`
- `amount`
- `currency`
- `collection_status`
- `days_overdue`
- `risk_score`

### İthalat Siparişleri
Amaç:
- İthalatı tek satırlı sipariş gibi değil, çok aşamalı finansal olay olarak modellemek

Veri sınıfı:
- Gerçek veri + kısmi tahmin

Zorunlu alanlar:
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

Durum alanları:
- planlandı
- sipariş verildi
- yolda
- gümrükte
- geldi
- iptal

Kritik not:
- Mal bedeli, navlun ve vergi/gümrük tek kolonla tutulmaz; ayrı olaylar olarak saklanır.

### Ürün / Stok Karlılık
Amaç:
- Marj ile sermaye verimini birlikte ölçmek

Veri sınıfı:
- Gerçek veri + hesaplanmış alan

Zorunlu alanlar:
- `product_id`
- `product_group`
- `gross_margin_pct`
- `estimated_net_margin_pct`
- `transit_days`
- `inventory_turn_days`
- `collection_days`
- `financing_cost_pct`
- `annualized_return_pct`
- `capital_efficiency_score`

### Tahmini Satışlar
Amaç:
- Uzun transitli dönemlerde kontrollü görünürlük üretmek

Veri sınıfı:
- Tahmini veri

Zorunlu alanlar:
- `forecast_id`
- `forecast_date`
- `product_group`
- `scenario_type`
- `projected_sales_amount`
- `projected_collection_date`
- `confidence_score`
- `assumption_version`
- `override_by_actual`

Kurallar:
- Gerçek veri geldiğinde tahmin silinmez; `override_by_actual` ile pasiflenir.
- Karar motoru yalnızca güven katsayısı eşiğini geçen tahminleri kullanır.

## İlişki özeti
- Parametreler -> tüm hesaplama modülleri
- Hızlı Veri Girişi -> Nakit Akışı
- Sabit Ödemeler -> Nakit Akışı -> Dashboard
- Borç Takibi -> Nakit Akışı -> Dashboard -> Karar Motoru
- Kredi Kartları -> Yaklaşan Ödemeler -> Dashboard
- Açık Hesap Müşteriler -> Yaklaşan Tahsilatlar -> Dashboard -> Karar Motoru
- İthalat Siparişleri -> Nakit Akışı + Tahmini Satışlar + Karar Motoru
- Ürün / Stok Karlılık -> Karar Motoru
- Tahmini Satışlar -> Nakit Akışı -> Karar Motoru

## Veri bütünlüğü kuralları
- Tarih formatı tek tip olmalıdır.
- Para birimi alanı zorunlu olmalıdır.
- TRY çevrimi kullanılan hesaplarda kur tarihi açıkça belirtilmelidir.
- Tahmini kayıtlar görsel ve mantıksal olarak gerçek kayıtlardan ayrılmalıdır.
- Dashboard kaynak tabloları kullanıcı tarafından doğrudan düzenlenmemelidir.
