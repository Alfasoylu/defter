# FIXED PAYMENTS SPEC

## Amaç
Tekrarlı giderleri tek kayıtla yönetmek ve bunları Nakit Akışı ile Yaklaşan Ödemeler görünümüne güvenli şekilde taşımak.

## Temel ilke
- Aynı sabit gider her ay elle yeniden girilmemelidir.
- Değişiklikler ileri dönemleri güncellemeli, geçmişi bozmamalıdır.

## Kapsam
- maaş
- kira
- aidat
- yazılım abonelikleri
- düzenli hizmet faturaları
- kredi taksitleri niteliğindeki sabit ödemeler

## Zorunlu alanlar
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

## Durum alanları
- aktif
- donduruldu
- iptal

## Tekrarlama tipleri
- aylık
- iki aylık
- üç aylık
- yıllık

## Üretim mantığı
1. Kaynak kayıt oluşturulur.
2. Tekrarlama tipine göre gelecek dönemler hesaplanır.
3. Her dönem için planlı ödeme olayı oluşturulur.
4. Nakit Akışı ve Yaklaşan Ödemeler görünümüne yansıtılır.

## Güncelleme kuralları
- Tutar değişirse geçmiş kayıtlar değil, ileri dönem üretimleri etkilenir.
- Artış tarihi varsa yeni tutar o tarihten sonra uygulanır.
- Dondurma, geçici olarak gelecekteki üretimi durdurur.
- İptal, gelecekteki tüm üretimleri kapatır.

## Nakit etkisi
- Sabit ödeme, gerçek ödeme yapılana kadar planlı yükümlülük olarak görünür.
- Ödeme gerçekleştiğinde gerçek kayıtla ilişkilendirilebilir olmalıdır.

## Uyarılar
- 7 gün içinde yaklaşan yüksek tutarlı sabit ödeme
- aynı tarihte birden fazla sabit ödeme çakışması
- artış sonrası tampon kırılımı

## Kabul kriterleri
- Tek kayıtla gelecek dönemler doğru üretilmeli.
- İleri dönem değişikliği geçmişi bozmamalı.
- İptal ve dondurma davranışı görünüm tablolarına doğru yansımalı.
