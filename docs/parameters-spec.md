# PARAMETERS SPEC

## Amaç
Sistem genelinde kullanılan tüm kritik varsayımları tek merkezden yönetmek.

## Temel kurallar
- Parametreler dağınık hücrelerde tutulmamalıdır.
- Aynı varsayım birden fazla sayfada elle tekrar edilmemelidir.
- Karar motorunu etkileyen her kritik eşik burada izlenebilir olmalıdır.
- Parametre değişikliği yapıldığında etkilediği modüller biliniyor olmalıdır.

## Ana parametre grupları

### 1. Kur ve para birimi
Alanlar:
- `usd_try`
- `eur_try`
- `fx_update_date`
- `fx_stress_factor`

Kullanım:
- ithalat maliyeti
- finansman baskısı
- senaryo stres testi

### 2. Nakit güvenliği
Alanlar:
- `safe_cash_floor`
- `critical_cash_floor`
- `cash_warning_days`

Kullanım:
- nakit tamponu
- karar motoru uyarıları
- dashboard risk blokları

### 3. Transit ve lojistik
Alanlar:
- `sea_transit_days_default`
- `air_transit_days_default`
- `customs_clearance_days_default`
- `local_logistics_days_default`

Kullanım:
- ithalat modeli
- tahmini satış başlangıcı
- güvenli ithalat kapasitesi hesabı

### 4. Tahsilat davranışı
Alanlar:
- `collection_delay_factor`
- `receivable_risk_multiplier`
- `forecast_confidence_threshold`
- `late_collection_warning_days`

Kullanım:
- tahmini satışlar
- açık hesap riski
- karar motoru

### 5. Finansman
Alanlar:
- `max_acceptable_monthly_interest`
- `credit_warning_interest_gap`
- `minimum_dscr_threshold`

Kullanım:
- kredi politikası
- güvenli ithalat kapasitesi
- karar motoru

### 6. Stok ve karlılık
Alanlar:
- `max_acceptable_inventory_turn_days`
- `stock_aging_warning_days`
- `minimum_net_margin_threshold`
- `discount_clearance_factor`

Kullanım:
- stok politikası
- fiyat kırma kararı
- ürün kalite puanı

### 7. Senaryo katsayıları
Alanlar:
- `conservative_sales_factor`
- `normal_sales_factor`
- `aggressive_sales_factor`
- `stress_fx_factor`
- `stress_delay_days`

Kullanım:
- tahmini satış
- nakit senaryo görünümü
- kapasite hesabı

## Önerilen tablo yapısı
- `param_key`
- `param_group`
- `param_label`
- `param_value`
- `value_type`
- `unit`
- `description`
- `used_by_modules`
- `updated_at`
- `updated_by`

## Zorunlu yönetişim kuralları
- Değişiklik yapan kişi ve tarih izlenmelidir.
- Kritik parametrelerde eski değer kaydı tutulmalıdır.
- Parametre silinmez; gerekirse pasiflenir veya yeni versiyon açılır.
- Varsayılan değer ile operasyonel override birbirinden ayrılmalıdır.

## Minimum başlangıç seti
Canlıya geçmeden önce en az şu parametreler tanımlı olmalıdır:
- `safe_cash_floor`
- `usd_try`
- `sea_transit_days_default`
- `air_transit_days_default`
- `collection_delay_factor`
- `forecast_confidence_threshold`
- `max_acceptable_monthly_interest`
- `max_acceptable_inventory_turn_days`

## Modül eşleşmesi
- Nakit Akışı -> `safe_cash_floor`, `critical_cash_floor`
- İthalat Siparişleri -> kur, transit ve lojistik parametreleri
- Tahmini Satışlar -> senaryo ve tahsilat parametreleri
- Karar Motoru -> tüm eşik parametreleri
- Dashboard -> uyarı ve gösterim eşikleri
