# Satış Pipeline Sekme Şablonları ve Mapping

## 1. Ham Siparişler

- Tüm kaynak veri, dokunulmaz.
- Header: Kaynak dosyanın ilk satırı (otomatik alınacak)

## 2. Temiz Satış Verisi

| Sipariş Tarihi | Satış Ayı | Pazaryeri | Stok Kodu | Ürün Adı | Miktar | Satış Fiyatı TL | USD Kuru | Satış Fiyatı USD | Unique Key |
| -------------- | --------- | --------- | --------- | -------- | ------ | --------------- | -------- | ---------------- | ---------- |

## 3. Aylık USD Kurları

| Ay (YYYY-MM) | USDTRY | Manuel Giriş |
| ------------ | ------ | ------------ |

## 4. Ürün Satış Özeti

| Stok Kodu | Ürün Adı | Toplam Satış Adet | Aylık Ortalama | Son 3 Ay | Son 6 Ay | Ortalama Fiyat TL | Ortalama Fiyat USD | Satış Pazaryerleri | Satış Olmayan Pazaryerleri | Son Satış Tarihi |
| --------- | -------- | ----------------- | -------------- | -------- | -------- | ----------------- | ------------------ | ------------------ | -------------------------- | ---------------- |

## 5. Pazaryeri Performansı

| Pazaryeri | Toplam Adet | Toplam Ciro TL | Toplam Ciro USD | Aktif SKU | SKU Başına Satış | Hiç Satış Olmayan SKU |
| --------- | ----------- | -------------- | --------------- | --------- | ---------------- | --------------------- |

## 6. Satışsız Stok Analizi

| Stok Kodu | Ürün Adı | Stok Adedi | Son Satış Tarihi | Son X Ay Satış | Yüksek Stok Düşük Satış | İlgilenilmesi Gereken Skor |
| --------- | -------- | ---------- | ---------------- | -------------- | ----------------------- | -------------------------- |

## 7. Aksiyon Merkezi

| Stok Kodu | Ürün Adı | Kriter | Açıklama |
| --------- | -------- | ------ | -------- |

---

# Mapping Tablosu

| Kaynak      | Hedef            | Açıklama           |
| ----------- | ---------------- | ------------------ |
| F           | Sipariş Tarihi   |                    |
| F (YYYY-MM) | Satış Ayı        | Derived            |
| H           | Pazaryeri        |                    |
| AW          | Stok Kodu        |                    |
| AZ          | Ürün Adı         |                    |
| BG          | Miktar           |                    |
| W           | Satış Fiyatı TL  |                    |
| USD Kurları | USD Kuru         | Lookup             |
| Hesaplanan  | Satış Fiyatı USD | TL / USD Kuru      |
| Composite   | Unique Key       | Tüm ana alanlardan |

---

# USD Kur Sistemi

- "Aylık USD Kurları" sekmesi: Son 100 ay, manuel doldurulacak.
- Kolonlar: Ay (YYYY-MM), USDTRY, Manuel Giriş
- Temiz Satış Verisi'nde ilgili ay için lookup ile USD kuru çekilecek.
- Satış Fiyatı USD = Satış Fiyatı TL / USD Kuru

---

# Test Import Planı

- İlk 500 satır için batch import
- Temizleme, duplicate, mapping, skip reason logu
- Sadece Temiz Satış Verisi sekmesine yazılır
- Header guard ve exact range readback yapılır
- Batch whitelist ve formül kolon koruması aktif

---

# Analizler Listesi

- Ürün bazında satış trendi (aylık)
- Pazaryeri penetrasyonu (ürün/pazaryeri var/yok)
- Son 90/180 gün ve tüm dönem karşılaştırmaları
- Düşük stok + yüksek satış riski
- Hiç satış almayan yeni ürünler
- Geçmişte satan ama son dönemde satmayan ürünler
- USD bazında fiyat değişimi
- Ürün başına pazaryeri bağımlılığı
- Satış hızı / stokta kalma süresi tahmini
- Stokta çok bekleyen ürün öncelik listesi
- İthalat için yeniden alınacak ürünler
- Tasfiye/kampanya adayı ürünler

---

# Kalan Riskler

- 147.000 satır büyük hacim, batch ve readback zorunlu
- USD kuru manuel girilecek, eksik aylar için hata riski
- Duplicate ve veri temizliği kritik
- Formül kolonları ve diğer sekmeler korunmalı
- Stok pipeline’ı izole edilmeli
- Her aşamada exact log ve hata yönetimi şart
