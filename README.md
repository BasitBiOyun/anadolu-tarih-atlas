# Anadolu Tarih Atlası, Temel 20 Alan Paketi

Bu paket önceki data dosyalarının yerine tek başına kullanılmak üzere hazırlanmıştır.

## İçerik
- `index.json`: Harita, arama, filtre ve zoom görünürlüğü için hafif indeks
- `periods.json`: TR ve EN dönem adlarının tek kaynağı
- `sites/*.json`: 20 alanın ayrı TR ve EN ayrıntılı dosyaları

## Kurallar
- Uygulama başlangıçta yalnızca `index.json` ve `periods.json` yüklemelidir.
- Ayrıntılı site dosyaları kullanıcı alanı açınca lazy-load edilmelidir.
- Arayüzde ham period ID gösterilmemelidir. Örneğin `lower_palaeolithic` yerine aktif dile göre `Alt Paleolitik` veya `Lower Palaeolithic` gösterilmelidir.
- `startYear` ve `endYear` bazı kayıtlarda `null` olabilir. Bu, yanlış tarih uydurmamak içindir.
- Site dosyalarındaki kullanıcı metinlerinde noktalı virgül ve uzun tire kullanılmamıştır.
- Atlasın kronolojik kapsamını daraltan ifadeler kullanılmamıştır.
- `coordinatePrecision` varsa iç metadata olarak kalmalıdır ve kullanıcıya gösterilmemelidir.

## 20 alan
1. Kocabaş Hominin Buluntu Alanı
2. Gediz Erken Pleistosen Buluntu Alanı
3. Dursunlu
4. Kaletepe Deresi 3
5. Yarımburgaz Mağarası
6. Karain Mağarası
7. Üçağızlı Mağarası
8. Öküzini Mağarası
9. Beldibi Mağarası
10. Direkli Mağarası
11. Hallan Çemi Höyüğü
12. Körtik Tepe
13. Boncuklu Tarla
14. Göbekli Tepe
15. Karahantepe
16. Nevalı Çori
17. Çayönü Tepesi
18. Aşıklı Höyük
19. Çatalhöyük
20. Arslantepe Höyüğü
