# APPS SCRIPT ARCHITECTURE

## Amaç
Apps Script tarafını güvenli, modüler, duplicate üretmeyen ve ajanlar tarafından okunabilir hale getirmek.

## Temel ilke
Script yapısı, sheet karmaşasını gizleyen kontrol katmanı olmalıdır; yeni risk üreten görünmez bir kara kutu olmamalıdır.

## Mimari hedefler
- kaynak ve görünüm tabloları arasında güvenli veri akışı
- duplicate engelleme
- küçük ve test edilebilir fonksiyonlar
- modül bazlı sorumluluk ayrımı
- riskli işlemlerde açık log

## Önerilen modüller

### 1. Config modülü
Sorumluluk:
- sheet isimleri
- başlık satırı bilgileri
- veri başlangıç satırları
- parametre anahtarları

Amaç:
- sabitleri kod içine dağınık gömmemek

### 2. Sheet access modülü
Sorumluluk:
- sheet bulma
- başlık eşleme
- satır okuma / yazma yardımcıları

Amaç:
- birebir sheet adı kontrolünü tek yerde toplamak

### 3. Validation modülü
Sorumluluk:
- zorunlu alan kontrolü
- tarih formatı kontrolü
- para birimi kontrolü
- veri tipi doğrulama

### 4. Upsert modülü
Sorumluluk:
- iş anahtarı oluşturma
- mevcut kaydı bulma
- varsa güncelleme, yoksa ekleme

Kritik:
- duplicate önleme mantığının merkezi burası olmalı

### 5. Cashflow projection modülü
Sorumluluk:
- farklı kaynak modüllerden gelen nakit etkilerini standart satıra çevirmek
- gerçek / planlı / tahmini statü atamak

### 6. Fixed payments modülü
Sorumluluk:
- tekrarlı ödeme üretimi
- artış ve iptal davranışı

### 7. Import finance modülü
Sorumluluk:
- ithalat siparişini parçalı ödeme olaylarına dönüştürmek
- varış ve satış başlangıcı hesaplarını beslemek

### 8. Forecast modülü
Sorumluluk:
- tahmini satış satırları üretmek
- güven skoru hesaplamak
- override işaretini yönetmek

### 9. Decision preparation modülü
Sorumluluk:
- Dashboard ve Karar Motoru için özet veri üretmek
- 7/30/60/90 gün bloklarını hazırlamak

### 10. Logging modülü
Sorumluluk:
- kritik akışlarda işlem izi bırakmak
- hata, uyarı ve bilgi seviyelerini ayırmak

### 11. Smoke test modülü
Sorumluluk:
- duplicate testi
- sheet erişim testi
- temel veri akışı testi

## onEdit kuralı
- `onEdit` minimum sorumluluk taşımalıdır.
- Ağır iş mantığı doğrudan `onEdit` içine gömülmemelidir.
- `onEdit`, ilgili modülü tetikleyen hafif bir yönlendirici olarak kalmalıdır.

## İş akışı örneği
1. Kullanıcı kaynak sayfada değişiklik yapar.
2. `onEdit` değişikliğin hangi modülü ilgilendirdiğini belirler.
3. Validation modülü girdiyi kontrol eder.
4. İlgili üretim modülü standart olay satırları oluşturur.
5. Upsert modülü görünüm tablosunu güvenli şekilde günceller.
6. Logging modülü sonucu kaydeder.

## İş anahtarı yaklaşımı
Her yansıtma satırı için iş anahtarı üretilmelidir.

Örnek bileşenler:
- kaynak modül
- kaynak kayıt kimliği
- olay tipi
- tarih

Bu sayede:
- aynı satır tekrar işlenirse duplicate oluşmaz
- güncelleme ve silme davranışı izlenebilir

## Loglama kuralları
- Hata logu: işlem başarısız
- Uyarı logu: veri eksik ama kritik değil
- Bilgi logu: önemli üretim veya güncelleme

Kritik akışlar:
- ithalat yansıtması
- sabit ödeme üretimi
- tahmin override
- karar verisi yenileme

## Hata yönetimi
- Hatalar sessizce yutulmamalıdır.
- Kritik modüller hata verirse Dashboard sessizce yanlış veri göstermemelidir.
- Mümkünse hata durumu Sistem Logları veya Test Sonuçları sayfasına yazılmalıdır.

## Test stratejisi
Her ana modül için en az:
- doğrulama testi
- duplicate testi
- tarih testi
- beklenen çıktı testi

## Kabul kriterleri
- `appendRow` varsayılan yaklaşım olmamalı.
- İş anahtarı olmadan görünüm güncellemesi yapılmamalı.
- `onEdit` içinde büyük hesap mantığı birikmemeli.
- Kritik akışlarda log üretilmeli.
- Modül sorumlulukları ayrışmış olmalı.
