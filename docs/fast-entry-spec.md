# FAST ENTRY SPEC

## Amaç
Hızlı Veri Girişi sayfasını, mobil öncelikli, düşük hata üreten ve güvenli veri akışına bağlı bir giriş noktası olarak tanımlamak.

## Temel ilke
- Kullanıcı aynı veriyi iki kez girmemelidir.
- Sayfa, dashboard veya nakit görünümü üretmeye çalışmamalıdır.
- Amaç ham operasyon kaydını hızlı ve hatasız toplamak olmalıdır.

## Kullanım amacı
Bu ekran şu işler için tasarlanır:
- günlük tahsilat girişi
- günlük ödeme girişi
- masraf girişi
- kart harcaması girişi
- temel operasyonel nakit hareketi girişi

Bu ekran şu işler için tasarlanmamalıdır:
- toplu raporlama
- ileri analiz
- manuel dashboard yönetimi
- tahmini veri girişi

## Zorunlu alanlar
- `entry_id`
- `entry_date`
- `record_type`
- `category`
- `counterparty`
- `amount`
- `currency`
- `payment_status`
- `notes`
- `created_at`
- `updated_at`

## Önerilen yardımcı alanlar
- `channel`
- `document_no`
- `related_record_id`
- `created_by`

## Kayıt türleri
En az şu tipler desteklenmelidir:
- satış tahsilatı
- nakit ödeme
- banka ödeme
- masraf
- kart harcaması
- borç ödemesi
- tahsilat düzeltmesi

## Kullanıcı deneyimi kuralları
- Mobilde kullanılacak temel alanlar üstte olmalı.
- Dropdown ile seçilebilecek alanlar serbest metne bırakılmamalı.
- Tarih alanı tek formatta çalışmalı.
- Tutar alanında para birimi zorunlu olmalı.
- Gereksiz sütun sayısı azaltılmalı.

## Veri güvenliği kuralları
- Sayfa tek kaynak ham giriş ekranıdır.
- Aynı satır güncellendiğinde bağlı görünüm kayıtları duplicate üretmemelidir.
- Silinen/iptal edilen kayıtların yansımaları kontrol altında geri çekilmelidir.
- Boş zorunlu alanla yansıtma yapılmamalıdır.

## Akış kuralları
1. Kullanıcı kayıt girer.
2. Validation kontrolü çalışır.
3. Kayıt türüne göre sınıflandırma yapılır.
4. Nakit Akışı veya ilgili görünüm tablosuna key bazlı upsert uygulanır.
5. İşlem loglanır.

## Başlık standardı
Başlık satırları sabit ve açık isimli olmalıdır.

Önerilen sıralama:
1. tarih
2. kayıt türü
3. kategori
4. karşı taraf
5. tutar
6. para birimi
7. durum
8. not
9. kayıt kimliği

## Validation kuralları
- tarih boş olamaz
- kayıt türü boş olamaz
- tutar sıfır veya negatif mantıksızsa uyarı verilmelidir
- para birimi boş olamaz
- durum alanı kontrollü liste olmalıdır

## Duplicate önleme kuralı
- Aynı iş olayı için tek bir `entry_id` bulunmalıdır.
- Satır güncellenirse yeni nakit satırı oluşmamalı, mevcut yansıma güncellenmelidir.
- Satır silme/iptal durumunda bağlı kaydın durumu pasiflenmeli veya geri çekilmelidir.

## Kabul kriterleri
- Mobilde 30 saniyeden kısa sürede temel işlem girilebilmeli.
- Aynı kayıt tekrar işlendiğinde duplicate oluşmamalı.
- Hatalı alanlar görünüm tablolarına bozuk veri taşımamalı.
- Hızlı Veri Girişi, tahmini veriyle karışmamalı.
