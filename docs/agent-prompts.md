# AGENT PROMPTS

## Amaç

Bu dosya, projede tekrar kullanılabilir ajan komut şablonlarını standartlaştırır.

## Genel kullanım kuralı

1. Her turda önce `docs/ai-agent-protocol.md` ve `docs/backlog.md` okunur.
2. Faz bazlı iş seçilir.
3. Değişiklik küçük parçalarda uygulanır.
4. Test edilmeden iş tamamlandı denmez.

## 1) Docs-Only Şablonu

```text
Sadece docs/ klasörünü incele.

Önce sırayla oku:
1. docs/ai-agent-protocol.md
2. docs/backlog.md
3. ilgili faz dokümanları

Sonra yalnızca docs/backlog.md içindeki tamamlanmamış en yüksek öncelikli dokümantasyon işini uygula.

Kesin kural: docs/ dışındaki hiçbir dosyayı okuma veya değiştirme.

Çıktı formatı:
- Analiz edilenler
- Değiştirilenler
- Neden önemli
- Sonraki kritik dokümantasyon görevi
```

## 2) Faz Uygulama Şablonu (Kod + Test)

```text
Bu görev için ilgili fazı uygula.

Adımlar:
1. docs/ai-agent-protocol.md ve docs/backlog.md oku.
2. İlgili faz dokümanlarını oku.
3. Sadece gerekli dosyalarda minimum değişiklik yap.
4. Değişiklikten sonra şu testleri çalıştır:
	- npx clasp run runSmokeTestsCLI
	- npx clasp run runSafetyGateCLI
5. FAIL varsa düzelt ve testleri tekrar koş.
6. FAIL=0 olmadan görevi bitirme.

Raporla:
- Değişen dosyalar
- Test sonucu (PASS/FAIL)
- Kalan risk
```

## 3) Güvenli Deploy Şablonu

```text
Değişiklikleri deploy etmeden önce güvenlik kapısını çalıştır.

Sıra:
1. echo y | npx clasp push
2. npx clasp run runSmokeTestsCLI
3. npx clasp run runSafetyGateCLI
4. Safety gate PASS ise deploy:
	npx clasp deploy --description "<surum-notu>"
5. Deploy sonrası:
	npx clasp run postDeployCheckCLI

Kurallar:
- SAFETY_GATE=PASS olmadan deploy yok.
- Post-deploy çıktısında FAIL satırı varsa deploy tamamlandı sayma.
```

## 4) Hata Düzeltme Şablonu

```text
Test başarısızlığını düzeltmek için yalnızca ilgili hata kök nedenine odaklan.

Adımlar:
1. Hata veren test satırını bul.
2. Kök nedeni tek dosyada izole et.
3. En küçük düzeltmeyi uygula.
4. Önce ilgili testi, sonra tam smoke testi koş.
5. PASS olana kadar tekrarla.

Kural:
- Alakasız refactor yapma.
- Çalışan modüllere dokunma.
```

## 5) Canlı/Test Ayrımı Şablonu

```text
Canlıya dokunmadan önce test spreadsheet üstünde doğrulama akışı hazırla.

Adımlar:
1. Test spreadsheet ID belirle.
2. _SS_OVERRIDE kullanan CLI wrapper'ın test ID'li kopyasını oluştur.
3. Önce testte smoke/safety gate çalıştır.
4. PASS alınca canlı wrapper ile aynı adımları tekrarla.

Not:
- ID değişiklikleri dokümana işlenmeli.
- Hangi komutun test, hangisinin canlı olduğu raporda açık yazılmalı.
```

## Başarı ölçütü

- Ajan, fazı testsiz kapatmaz.
- Çalışma adımları tekrar edilebilir olur.
- Deploy kararları komut bazlı kanıtla desteklenir.
