# Global Firepower: Tactical Fronts 3D (Cephe Savaşları)

Ülke kartları, liderler ve taktik kartlarıyla **3 cephede** (Kara / Hava / Deniz) oynanan, **tamamen 3D** stratejik kart savaşı oyunu. Vercel'de statik site olarak yayınlanır; build adımı gerekmez (Three.js `vendor/` altında yerel olarak paketlidir).

## v3.0 "Full 3D Edition" Özellikleri

- **Holografik 3D Savaş Masası** — Three.js (WebGL) ile: hex cephe platformları, dönen radar halkaları, yıldız alanı, arka planda dönen Dünya hologramı, süzülen toz partikülleri.
- **3D Kart Meshleri** — Kart yüzleri canvas'ta anlık çizilip doku olarak basılır; güç değişince kart yüzü canlı güncellenir. Düşman kartları sırtı dönük gelir, çatışma anında **3D flip** ile açılır.
- **3D Oynanış** — Kart yerleştirme raycast ile: elden kart seç, sahnede parlayan hex platforma tıkla. Taktik hedefleme de 3D sahne üzerinde (mor hedef halkaları).
- **Savaş Koreografisi** — Kartlar orta hatta tokuşur; patlama partikülleri, şok dalgası halkaları, nokta ışık flaşları, balistik **füze saldırıları** (bezier yörünge + iz partikülleri), nükleer vuruş efekti ve kamera sarsıntısı.
- **Sinematik Kamera** — Menüde yörünge turu, planlamada nefes alan komuta açısı, her cephe çatışmasında yakınlaşan odak kamerası.

## v4.0 "Gerçek Zamanlı Taarruz" — Savaş Sistemi Yeniden Tasarımı

Kartlar artık sayı çarpıştırmıyor. **Her kart sahaya bir ordu çıkarır** ve üç cephe **aynı anda, gerçek zamanlı** çarpışır. Tasarım hedefi: **beceri > istatistik** — doğru anda doğru komut, ham güçten değerlidir.

- **Birlik Simülasyonu** — Kara cephesinde tanklar, havada jetler, denizde savaş gemileri (taraf renkli low-poly birimler). Birlikler ilerler, menzile girince iz mermileriyle ateş eder, ölünce patlar. Kart gücü birlik sayısını/canını belirler ama savaşın kaderini belirlemez.
- **Duruş Komutları** (savaş sırasında her an değiştirilebilir): ⚔ **Taarruz** (+%42 hasar / -%28 savunma), 🛡 **Mevzi** (dengeli), 🏰 **Savunma** (+%48 savunma), 🏳 **Ricat** (birlikleri kurtar: kaçan birlik kartı yaşatır, cephe kaybedilir ama HP hasarı yarıya iner).
- **Komuta Puanı & Yetenekler** — CP zamanla dolar (deniz gücün lojistiği hızlandırır): Hava Saldırısı (4), Topçu Barajı (3), Acil Takviye (5), Sis Perdesi (2), Elektronik Harp (3). Hedefli yetenekler 3D sahnede cepheye tıklanarak atılır.
- **Birleşik Kuvvet** — Sahadaki hava gücün kara birliklerinin hasarını besler; deniz gücün CP üretimini hızlandırır.
- **Momentum** — Cephe kazanmak stratejik avantaj verir: Hava zaferi → tüm birliklere +%18 hasar; Kara zaferi → düşman -%12 hasar; Deniz zaferi → CP %50 hızlı dolar.
- **Arazi** — Her savaş rastgele bir haritada: Çöl (taarruz güçlü), Orman (savunma güçlü, hava zayıf), Dağ (zırh etkisiz), Kar (yavaş ateş), Ada (deniz kritik).
- **Muharebe Olayları** — 12. saniyede %45 ihtimalle: Şiddetli Yağmur, Gece Muharebesi, Yakıt Krizi, Elektronik Parazit.
- **Akıllı Düşman Komutan** — Kolay: yavaş tepki; Normal: kazanırken taarruza, kaybederken savunmaya geçer; **Zor: senin duruşuna karşı hamle yapar** ve yetenekleri optimal anda kullanır.
- Ricat eden kart güç kaybıyla hayatta kalır; kaybedilen cephe HP hasrını kazananın **kalan** gücü belirler (eziyerek kazanmak daha çok vurur).

## v3.1 "Savaş Hissiyatı" Güncellemesi

- **Ulusal Marş Ezgileri** 🎺 — Bir ülkeyi cepheye sürdüğünde, o ülkenin marşının ~2 saniyelik açılış ezgisi bando sesiyle çalar (trampet girişi + bakır nefesliler + tuba desteği). 16 ülkenin ezgisi nota nota WebAudio ile sentezlenir (Türkiye, ABD, Rusya, Çin, Fransa, Japonya, İsrail, Ukrayna...); kalanlar 3 farklı askeri boru fanfarından birini çalar. **Ses dosyası yok, telif riski yok** — melodiler kamu malı bestelerin kısa yaklaşık açılışlarıdır.
- **Savaş Ambiyansı** — Maç boyunca alçak cephe uğultusu ve rastgele uzak top atışları; savaş fazında yoğunluk artar. Düşman konuşlanırken karanlık savaş borusu çalar.
- **Canlı Fetih Küresi** 🌍 — Sahaya sürülen her ülke, arka plandaki dönen Dünya hologramında kendi başkent koordinatında ışık sütunuyla işaretlenir (oyuncu camgöbeği / düşman turuncu). Birim düşünce işaret söner — küresel savaşın gidişatı kürede canlı izlenir.
- **Konuşlanma Etkisi** — Kart inişinde toz halkası + yer sarsıntısı.

## v2.0 "Steam Edition" Özellikleri

- **Ana Menü ve Oyun Modları**
  - **Hızlı Savaş** — 3 zorluk seviyesi (Kolay / Normal / Zor). Zor AI, senin sahandaki kartları okuyup minimum israfla karşı hamle yapar.
  - **Fetih Harekâtı** — 5 düşman komutanına karşı zincirleme roguelike sefer. Canın cepheler arasında taşınır; her zafer sonrası 3 harekât desteğinden (perk) birini seçersin.
- **Madalya Ekonomisi** — Sahte para satışları kaldırıldı. Kilitli liderler artık savaşlarda kazanılan **Şeref Madalyası** ile açılıyor (Steam mağaza politikalarına uygun, oyun içi ilerleme). Tüm ilerleme `localStorage`'da kalıcı.
- **Taktik Kartları** — Hava Harekâtı, İstihkam, Keşif Uydusu, Sahra Hastanesi, Seferberlik, EMP Saldırısı. Her tur 1 taktik; her 3 turda bir yenisi gelir.
- **Başarım Sistemi** — 9 başarım, oyun içi toast bildirimleri (Steam Achievements'a birebir taşınabilir yapı).
- **Prosedürel Ses Motoru** — WebAudio ile anlık sentezlenen SFX (çarpışma, patlama, zafer fanfarı...). Ses dosyası yok; tek tuşla kapatılabilir.
- **8 yeni ülke kartı** (toplam 30) ve **2 yeni lider** (Zelenskiy "Direniş Ruhu", Modi "İnsan Gücü Seferberliği").
- **Düzeltmeler** — Japonya Kamikaze pasifi artık gerçekten imha anında tetikleniyor; İsviçre'nin Taktiksel Çekilmesi AI için de çalışıyor.

## Yerelde Çalıştırma

```bash
# Herhangi bir statik sunucu yeterli:
npx serve .
# veya
python3 -m http.server 8080
```

## Steam "Çok Satan" Yol Haritası

**Paketleme & platform**
1. **Masaüstü paketleme** — Oyun statik web uygulaması olduğu için [Tauri](https://tauri.app) (küçük boyut) veya Electron ile sarmalanıp Steam'e yüklenebilir.
2. **Steamworks entegrasyonu** — `unlockAchievement()` tek noktadan geçer; `meta.js` içine `SteamAPI.ActivateAchievement` köprüsü yeterli. Steam Cloud kayıt için `META` objesi zaten tek JSON.
3. **Steam Trading Cards & rozetler** — Lider portreleri ve ülke kartları hazır görsel malzeme.

**Oynanışı derinleştirecek büyük özellikler (öncelik sırasıyla)**
4. **Deste kurma (deck-building)** — 30 ülkeden 15'lik kendi desteni kur; madalyayla yeni kart paketleri aç. Koleksiyon dürtüsü = uzun oyun süresi.
5. **Dünya haritası fetih modu** — Fetih Harekâtı'nı gerçek harita üzerinde bölge bölge ilerleyen bir kampanyaya genişlet (Risk tarzı): kürede işgal ettiğin bölgeler kalıcı boyanır, her bölge farklı modifikatör verir.
6. **Çevrimiçi PvP** — WebSocket ile 1v1 dereceli mod + sezonluk lig; eşzamanlı planlama fazı bu kural setine mükemmel uyar.
7. **Ülke özel yetenekleri** — Her ülkeye imza pasifi (İsviçre ve Japonya'daki gibi): Türkiye SİHA sürüsü, ABD uçak gemisi grubu, Rusya "General Kış"...
8. **Günlük görevler + haftalık meydan okumalar** — "3 hava zaferi kazan" → madalya; geri dönüş döngüsü.
9. **Replay & paylaşım** — Maç kaydını benzersiz link ile paylaşma (viral büyüme).
10. **Lokalizasyon** — İngilizce başta olmak üzere çok dil; metinler tek dosyada toplanmalı.

**Hukuki not** ⚠️ — Steam sürümünden önce gerçek siyasi liderlerin isim/kimliklerinin kullanımı gözden geçirilmeli. Kampanyadaki kurgusal komutanlar (General Volkov, Amiral Zheng, NEXUS...) bu geçiş için hazır şablondur. Marş ezgileri kamu malı bestelerin kısa sentezlenmiş açılışlarıdır; ses kaydı kullanılmaz.

## Dosya Yapısı

| Dosya | Görev |
|---|---|
| `index.html` | 3D sahne + HUD + tüm overlay ekranları |
| `scene3d.js` | Three.js savaş sahnesi: platformlar, kart meshleri, efektler, kamera, raycast |
| `app.js` | Oyun döngüsü, savaş çözümü, AI, kampanya, taktikler, HUD |
| `countries.js` | 30 ülke kartı veri tabanı |
| `leaders.js` | 8 lider ve pasif yetenekleri |
| `tactics.js` | 6 taktik kartı tanımı |
| `meta.js` | Madalya/başarım/istatistik kalıcılığı (localStorage) |
| `audio.js` | WebAudio prosedürel ses motoru |
| `styles.css` | HUD, modaller ve UI animasyonları |
| `vendor/three.min.js` | Three.js r128 (yerel, CDN bağımlılığı yok) |
