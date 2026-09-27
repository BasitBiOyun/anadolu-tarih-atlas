# Anadolu Tarih Atlası

Anadolu'nun arkeolojik ve tarihî alanlarını dönem, konum ve yerleşim bazında incelemek için geliştirilen çift dilli (TR/EN) harita uygulamasıdır.

## Üretim mimarisi

Uygulamanın veri kaynağı GitHub içindeki yerel site JSON dosyaları değildir.

- **Firestore `sites_index`**: Harita, arama, dönem filtreleri ve görünürlük için hafif indeks.
- **Firebase Storage `atlas/sites/{siteId}.json`**: Her alanın kanonik, ayrıntılı ve çift dilli monografisi.
- **`GET /api/sites/:siteId`**: Cloud Run üzerinden Storage'daki monografiyi aynı origin üzerinden sunar.
- **Firestore `research_queue`**: Araştırma kuyruğu; istemciye kapalıdır.
- **Firestore `research_jobs`**: Araştırma/ingestion telemetrisi; istemciye kapalıdır.
- **`/api/atlas/*`**: Bearer token ile korunan server-side ingestion API'si.

Frontend ilk açılışta yalnızca hafif Firestore indeksini yükler. Ayrıntılı monografi kullanıcı bir alanı açtığında lazy-load edilir ve oturum içinde bellekte cache'lenir.

## Güncel üretim başlangıç seti

Canlı Firestore indeksinde şu beş kanonik alan bulunmaktadır:

1. Alacahöyük (`alacahoyuk`)
2. Ani (`ani`)
3. Aphrodisias (`aphrodisias`)
4. Arslantepe (`arslantepe`)
5. Aşıklı Höyük (`asikli-hoyuk`)

Yeni alanlar yerel frontend veri dosyası eklenerek değil, doğrulanan monografinin ingestion API üzerinden Storage'a ve `sites_index` koleksiyonuna yazılmasıyla eklenir.

## İçerik ilkeleri

- Arayüzde ham period ID veya internal source ID gösterilmez.
- Kaynakça kullanıcıya yazar, yıl, eser adı, yayın bilgisi ve mevcutsa URL/DOI/PDF bağlantısıyla gösterilir.
- `startYear` ve `endYear` bilinmiyorsa `null` bırakılabilir; tarih uydurulmaz.
- Ayrıntılı arkeolojik içerik için Firebase Storage kanonik kaynaktır.
- Firestore browser tarafından yalnızca `sites_index` okumalarına açıktır; ingestion yazmaları server-side yapılır.

## Geliştirme

```bash
npm ci
npm run lint
npm run build
npm run dev
```

Deployment ve Cloud Run gereksinimleri için `DEPLOYMENT.md` dosyasına bakın.
