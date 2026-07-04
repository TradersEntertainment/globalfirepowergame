# Global Firepower: Tactical Fronts (Cephe Savaşları)

Ülke kartları, liderler ve taktik kartlarıyla **3 cephede** (Kara / Hava / Deniz) oynanan stratejik kart savaşı oyunu. Tamamen bağımsız (vanilla JS) — framework, build adımı veya harici asset gerekmez. Vercel'de statik site olarak yayınlanır.

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

## Steam Yol Haritası (öneriler)

1. **Masaüstü paketleme** — Oyun tek sayfalık statik web uygulaması olduğu için [Tauri](https://tauri.app) (küçük boyut) veya Electron ile sarmalanıp Steam'e yüklenebilir.
2. **Steamworks entegrasyonu** — `unlockAchievement()` çağrıları tek noktadan geçer; Steamworks API'sine köprülemek için `meta.js` içindeki bu fonksiyona `SteamAPI.ActivateAchievement` eklemek yeterli.
3. **İçerik genişletme** — Daha fazla lider/ülke, günlük görevler, sezonluk liderlik tablosu, çevrimiçi PvP (WebSocket).
4. ⚠️ **Hukuki not** — Steam sürümünden önce gerçek siyasi liderlerin isim/kimliklerinin kullanımı gözden geçirilmeli (kişilik hakları ve Steam içerik politikaları). Kampanya modundaki kurgusal komutanlar (General Volkov, Amiral Zheng, NEXUS...) bu geçiş için hazır bir şablondur; liderler de benzer şekilde kurgusallaştırılabilir.

## Dosya Yapısı

| Dosya | Görev |
|---|---|
| `index.html` | Tüm ekranlar (menü, oyun, liderler, başarımlar, perkler) |
| `app.js` | Oyun döngüsü, savaş çözümü, AI, kampanya, taktikler |
| `countries.js` | 30 ülke kartı veri tabanı |
| `leaders.js` | 8 lider ve pasif yetenekleri |
| `tactics.js` | 6 taktik kartı tanımı |
| `meta.js` | Madalya/başarım/istatistik kalıcılığı (localStorage) |
| `audio.js` | WebAudio prosedürel ses motoru |
| `styles.css` | Tema ve tüm animasyonlar |
