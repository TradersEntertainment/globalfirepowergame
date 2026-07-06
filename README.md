# Global Firepower: Tactical Fronts 3D (Cephe Savaşları)

Ülke kartları, liderler ve taktik kartlarıyla **3 cephede** (Kara / Hava / Deniz) oynanan, **tamamen 3D** stratejik kart savaşı oyunu. Vercel'de statik site olarak yayınlanır; build adımı gerekmez (Three.js `vendor/` altında yerel olarak paketlidir).

## v3.0 "Full 3D Edition" Özellikleri

- **Holografik 3D Savaş Masası** — Three.js (WebGL) ile: hex cephe platformları, dönen radar halkaları, yıldız alanı, arka planda dönen Dünya hologramı, süzülen toz partikülleri.
- **3D Kart Meshleri** — Kart yüzleri canvas'ta anlık çizilip doku olarak basılır; güç değişince kart yüzü canlı güncellenir. Düşman kartları sırtı dönük gelir, çatışma anında **3D flip** ile açılır.
- **3D Oynanış** — Kart yerleştirme raycast ile: elden kart seç, sahnede parlayan hex platforma tıkla. Taktik hedefleme de 3D sahne üzerinde (mor hedef halkaları).
- **Savaş Koreografisi** — Kartlar orta hatta tokuşur; patlama partikülleri, şok dalgası halkaları, nokta ışık flaşları, balistik **füze saldırıları** (bezier yörünge + iz partikülleri), nükleer vuruş efekti ve kamera sarsıntısı.
- **Sinematik Kamera** — Menüde yörünge turu, planlamada nefes alan komuta açısı, her cephe çatışmasında yakınlaşan odak kamerası.

## v6.3 "Fetih 2.0 + Doktrin Dengesi" — Genişletilmiş Kampanya + Veri Odaklı Denge

Tek-oyunculu derinlik + ölçülü denge.

- **Fetih Harekâtı 2.0** — 5 → **8 düşman ulus**. Her aşama gerçek bir ülke **doktrinine** bağlı (🇬🇷→🇪🇬→🇷🇺→🇨🇳→🇮🇱→🇸🇪→🇺🇸→🇺🇳): oyuncu farklı doktrinlere karşı kontra kurmayı öğrenir; final aşama **elit BM Görev Gücü** (counterAll patronu). Enemy'nin bayrağı + doktrini aşamaya sabitlenir (çektiği kartlardan bağımsız).
- **Aşama modifikatörleri** — her aşama savaşına zorlanan arazi/su/olay: Çöl Zırhı (Mısır)=çöl, Çelik Yumruk (Rusya)=dağ, Okyanus Hakimi (Çin)=kanal (haritayı bölen su), Demir Kubbe (İsrail)=gece, Gök Kartalı (İsveç)=orman (hava zayıf), NEXUS=şehir+nehir. `warmap.js`: `pickTerrainById` + `eventById` + `config.waterStyle`.
- **Dinamik fetih şeridi** — menüdeki ilerleme çubuğu aşamalardan üretilir (8 ülke bayrağı; fethedilenler parlar, hover'da ad/başlık). Yeni perkler: **Ağır Takviye** (+2 tüm kuvvetler), **Sabotaj** (düşman −4 birlik gücü).
- **Doktrin denge turu (veri odaklı)** — bağımsız Node simülatörü (`balance-sim.js`) 31 doktrini round-robin oynatıp kazanma oranı çıkardı. Kritik bulgular: **elit fraksiyon %36'da bozuktu** (costMul aşırı ceza) — düzeltildi (counterAll 1.30→1.42, costMul 1.5→1.30) ve artık %60 (uygun elit-tier); land-ağırlıklı doktrinler kısıldı, deniz-doktrinlerinin öz-cezası yumuşatıldı. Elit-dışı dağılım 43→34 puana daraldı. *(Not: soyut sim gemilerin menzil/konumlanma avantajını modelleyemez → deniz doktrinlerinin gerçek gücü daha yüksek; tam rekabetçi denge canlı telemetri gerektirir. Bu tur model-sağlam aykırılar düzeltildi.)*
- **Teknik** — `app.js` (CAMPAIGN_STAGES 8'e çıkarıldı + modifikatör tüketimi + düşman doktrin override + perkler + genelleme), `warmap.js` (terrain/event/su config'leri), `countries.js` (denge nudge'ları), `index.html`/`styles.css` (dinamik bayraklı şerit). Doğrulama: doktrin-matematik 12/12, kampanya E2E (8-bayrak şerit + aşama ilerleme 🇬🇷→🇪🇬 + zorlanan çöl + düşman doktrini) + PvE/Düello/Online ERRORS NONE.

## v6.2 "Onboarding & Paylaşım" — Viral Zafer Kartı, Tutorial, Ayarlar, TR/EN

Büyüme ve elde tutma cilası: yeni oyuncu öğrenir, kazanan paylaşır, herkes ayarlar.

- **Viral paylaşım kartı** — Online maç sonrası tek tık **"Görüntü Oluştur & Paylaş"**: 1200×630 (sosyal-paylaşım boyutu) kompozit PNG üretir — **🇹🇷 SEN KARŞI 🇬🇷 RAKİP**, ZAFER/YENİLGİ, kalan birlik / süre / arazi, Elo delta ve `globalfirepowergame.vercel.app` watermark'ı. `navigator.share` destekliyse doğrudan paylaşır, değilse PNG indirir + başlığı panoya kopyalar. Harici kütüphane yok (canvas 2D). "Türkiye vs Yunanistan" reklamını doğrudan paylaşıma çevirir.
- **"Nasıl Oynanır" interaktif rehber** — İlk açılışta otomatik, menüden tekrar erişilebilir 6 adımlı rehber (ordu kur → taş-kağıt-makas → ulusal doktrin → savaş/yönlendir → su/köprü → kazan/paylaş). Elde tutmanın #1 belirleyicisi.
- **Ayarlar menüsü** — Ses seviyesi (WebAudio master gain), **Bloom aç/kapa**, **Gölgeler aç/kapa** (performans için), ve **TR/EN dil** anahtarı — hepsi localStorage'da kalıcı, açılışta uygulanır.
- **Çift dil (TR/EN)** — Hafif i18n sistemi (`i18n.js`, `T()` + `[data-i18n]`): menü, mod kartları, ayarlar, tutorial ve paylaşım kartı canlı dil değişimiyle çevrilir (çevirisi olmayan TR'ye düşer). Uluslararası virallik için EN.
- **Teknik** — Yeni `i18n.js`; `audio.js` master gain + `setVolume`; `scene3d.js` `setBloomEnabled`/`setShadowsEnabled`; `meta.js` ayar alanları (volume/bloom/shadows/lang/tutorialDone); `warmap.js` sonuç objesine birlik sayısı/süre/arazi; `app.js` ayarlar + rehber + paylaşım kartı kompozitörü. Doğrulama: tutorial/ayarlar/EN-switch/paylaşım-PNG uçtan uca + PvE/Düello/Online regresyonları ERRORS NONE.

## v6.1 "Ulusal Doktrinler + Su Reformu" — Ülkeye Özel Birlikler, Counter Ulus, Bilgi Kartları, Nehirli Haritalar

Ulusal kimlik artık oynanışı da belirliyor, birlikleri öğrenmek kolaylaştı ve deniz haritaların merkezine taşındı.

- **Ulusal doktrinler** — 30 ülkenin her birine dengeli asimetrik doktrin: birlik statlarında bir güç kümesi (~+%15-25) ve bir zayıflık (~-%10-15). Örn. **Rusya** +tank −hava, **Türkiye** +İHA/heli −deniz (Bayraktar doktrini), **İsrail** +AA/dron (Demir Kubbe) −deniz, **Çin** +deniz/piyade −hava. Her ülkenin bir **imza birliği** var. Doktrinler her modda etkiler (PvE + Fetih + Düello + Online Sıralı); sabit ranked bütçe korunduğu için ranked adil-asimetrik kalır.
- **Counter ulus — 🇺🇳 BM Görev Gücü (ELİT)** — "Her şeyin counter'ı" özel fraksiyon: taş-kağıt-makas zayıflığı yok (her düşman tipine ≥1.30× hasar), ama birlik maliyeti ×1.5 → **az ama üstün** ordu (kıtlıkla dengeli). Online sıralı kimlik seçiminde "ELİT" rozetiyle seçilebilir; 30-ülke kart havuzuna girmez.
- **Bilgi kartları (hover tooltip)** — Birlik/ülke üstüne gelince kart: birim istatistikleri (can/hasar/menzil/hız), **▲Güçlü / ▼Zayıf** kontra listesi ve seçili ülkenin o birime doktrin etkisi. Ülke seçicide doktrin adı + buff/nerf + imza birlik. Öğrenme eğrisini düşürür.
- **Su reformu** — Deniz artık hep solda şerit değil: araziye göre **kıyı** (dalgalı organik), **nehir** (dikey kıvrımlı kanal) veya **kanal** (eğik su bandı). Nehir/kanal **haritayı böler** ama daima geçilebilir bir **köprü/geçit chokepoint** bırakır — kara birlikleri köprüye hunilenir, gemiler su lanesinde merkezî rol oynar. Su tüm derinlik boyunca uzandığı için gemiler iki tarafta da konabilir. Hücre-tabanlı su mesh'i + dalga animasyonu; birim hareketi su-farkında steering ile suya girmez.
- **Teknik** — `countries.js` doktrin + `SPECIAL_FACTIONS`; `warmap.js` doktrin stat uygulama (`doctrineMul`), `threatValue` counterAll, `effCost` maliyet çarpanı, su layout sistemi (`buildWaterLayout`/`waterAt`/`resolveStep`), `getUnitInfo`; `app.js` tooltip + elit fraksiyon UI. Doğrulama: doktrin-matematik testi (12/12), 3 su düzeninde tam savaş boyunca `maxGroundInWater=0` (steering doğru), tooltip + costMul (42→33) uçtan uca, PvE/Düello/Online regresyonları ERRORS NONE.

## v6.0 "Online Sıralı" — Asenkron PvP + Elo Sıralama + Liderlik Tablosu

İlk **online çok oyunculu** mod. "Arkadaşını/dünyayı yen" döngüsü: ülkeni seç, ordunu kur, gerçek oyuncuların kayıtlı ordularına karşı savaş, Elo sıralamasında yüksel. Viral kanca burada zirveye çıkar — **🇹🇷 Türkiye vs 🇬🇷 Yunanistan** maçları bakışta okunur.

- **Asenkron eşleştirme** — Oyuncu ordusunu kurar → sunucuya kaydedilir → başka bir oyuncunun *kayıtlı* ordusuyla eşleştirilir; savaş oyuncunun cihazında çözülür (rakip birlikler snapshot'tan otonom savaşır, oyuncu kendi tarafını canlı yönetir). İkisinin aynı anda online olması gerekmez. Havuz boşsa/çevrimdışıysa nazikçe **bot maçına** düşer.
- **Ülke kimliği & profil** — Auth yok; ilk açılışta kalıcı `playerId` üretilir (localStorage). Oyuncu **ad + ülke bayrağı** seçer; ordusu o bayrak altında savaşır. Muharebede plakalar ülke + Elo gösterir (anlamsız HP çubukları gizlenir).
- **Adil ranked bütçe** — Herkese sabit birlik bütçesi (⛰42 ✈28 ⚓20); ülke seçimi güç değil **kimlik/kozmetik** — ranked adil kalır, "ülkeni oyna" hissi korunur.
- **Elo sıralama & liderlik tablosu** — Standart Elo (K=32); maç sonrası iki tarafın da rating'i güncellenir. Sonuç ekranında **rating delta** animasyonu; menüden ve profil ekranından **top-20 liderlik tablosu** (bayrak + ad + G/Y + Elo, kendi sıran vurgulanır).
- **Sıfır-build backend** — `/api/*.js` Vercel Serverless Functions (statik siteyle otomatik dağıtılır) + **Vercel KV (Upstash Redis)**, `fetch` ile doğrudan REST (npm bağımlılığı yok). Uçlar: `submit-army`, `find-match`, `report-result`, `leaderboard`. Kurulum: Vercel'de KV store bağla → `KV_REST_API_URL` + `KV_REST_API_TOKEN` env otomatik gelir. Env yoksa tüm uçlar 200 + bot/çevrimdışı fallback döner (oyun her zaman oynanır).
- **Yeni dosyalar** — İstemci `net.js` (API sarmalayıcı + offline degrade), `api/_kv.js` (KV REST + Elo yardımcı), `api/submit-army.js`, `api/find-match.js`, `api/report-result.js`, `api/leaderboard.js`. Motor tarafında `warmap.js` `opponentArmy` snapshot yerleşimi + `captureArmy` serileştirmesi ekler.

## v5.1 "Görsel Yükseltme" — Muharebe Sahası Grafik & Ulusal Kimlik

v5.0 mekaniği korunarak muharebe sahnesi profesyonel görsel kaliteye çıkarıldı ve **viral kanca** eklendi: birlikler artık hangi ülkeye ait olduklarını bakışta gösterir — "Türkiye vs Yunanistan savaşı" reklamı rahatça yapılabilir. Motor: `warmap.js` + `scene3d.js` post-processing.

- **Ulusal Kimlik (viral kanca)** — Her birliğin üstünde **direk + dalgalanan ülke bayrağı** (ülkenin gerçek bayrak dokusundan) yüzer, gövdesinde **milli renk aksanı** taşır. Dost/düşman ayrımı için birim altında taraf renkli **taban halkası** (oyuncu camgöbeği / düşman kırmızı-turuncu). Ülke başına milli renk paleti (`countries.js` `colors`).
- **Detaylı & Büyük "Kahraman" Birlikler** — Basit yer tutucular tamamen yenilendi: taretli gövde + namlulu tank, nişancılı tanksavar, miğferli piyade mangası (biri bayraktar), uzun namlulu obüs, radar + füze rampalı AA, delta kanatlı + alevli jet, dönen ana/kuyruk rotorlu helikopter, İHA, güverte + kuleli fırkateyn, hücumbot. Ekranda **~1.75× ölçek**, taraf başına **sert üst sınır ~14** birlik — okuma ve mikro kolaylaşır.
- **Post-Processing & Işıklandırma** — **UnrealBloom** parıltısı (iz mermileri/patlamalar/bayraklar parlar), **PCFSoft gölge haritası** (gerçek gölgeler), ACESFilmic ton eşleme + sRGB kodlama. Yönlü anahtar ışık + dolgu ışığıyla yumuşak, kaliteli aydınlatma. Vendor: `EffectComposer/RenderPass/ShaderPass/UnrealBloomPass` (three@0.128 UMD, yerel).
- **Zengin Arazi & Gökyüzü** — Düz renk zemin yerine **prosedürel canvas doku** (çim/kum/kar/asfalt lekeleri + yollar + gürültü), arazi rengine uyan **degrade gökyüzü kubbesi** + `FogExp2` derinlik sisi. Muharebede uzay fonu (küre/yıldızlar) gizlenir; savaş bitince geri gelir.
- **Birim Geri Bildirimi & Efektler** — Birim üstü **can barı** (hasar alınca belirir, kameraya döner), seçim halkası, namlu ateşi flaşı, çok katmanlı patlama + duman + yerde **scorch decal**. Kamera daha yakın ve kuşbakışına yakın açıyla savaşı okunur kılar.

## v5.0 "Muharebe Sahası" — TABS Tarzı Savaş Haritası

Savaş başlayınca **sahne komple bir muharebe haritasına dönüşür** (kart masası kaybolur), ordular gerçek zamanlı çarpışır ve oyuncu birliklerini **RTS gibi yönlendirir**. Motor: yeni `warmap.js`.

- **Muharebe Haritası** — ~90×64 birimlik zemin, arazi temasına göre prosedürel dekor (orman ağaçları, çöl kumulları, dağ kayaları, kent blokları, kar), solda animasyonlu su şeridi, iki tarafta karargâh (HQ) bayrakları. Savaş bitince sahne yumuşakça kart masasına geri döner.
- **Birlik Bütçesi** — Her kuvvet kartının gücü o kuvvetin birlik puanı: Kara kartı → piyade/tanksavar/ZPT/tank/topçu/AA; Hava → jet/helikopter/İHA; Deniz → fırkateyn/hücumbot. **11 birlik tipi**, taş-kağıt-makas kontrlarıyla (tanksavar > tank, tank > piyade, piyade > tanksavar, AA > uçak, jet > helikopter, helikopter > tank...).
- **TABS Tarzı Yerleştirme** — Alt panelden birlik tipi seç, kendi (mavi) bölgene yerleştir; yarı saydam hayalet imleci takip eder, geçerli alan yeşil/kırmızı gösterir. Sağ tık: birlik kaldır (iade). AI görünür şekilde ordusunu kurar — rakibi okuyup kontra kompozisyon dizmek beceridir. 60sn veya HAZIR ile savaş başlar.
- **RTS Yönlendirme** — Birliğe tıkla veya boş zeminden sürükle-kutu ile grup seç; zemine tıkla → oraya ilerlesinler (hedef işaretçisi). Sağ tık/ESC seçimi bırakır. Tekerlek = yakınlaş, WASD/oklar/orta-tık sürükle = haritayı kaydır.
- **Otonom Muharebe** — Birlikler sınıf önceliğine göre hedef seçer, menzilde ateş eder (iz mermileri; topçu/fırkateyn havan yayıyla AoE atar), ölünce devrilip patlar. **Moral**: gücü düşen birlik bozulup (rout) kendi kenarına kaçar — kaçan birlik kartı yaşatır (ricat).
- **Komuta (savaş içi)** — Duruşlar (Taarruz/Mevzi/Savunma/Ricat) tüm orduyu etkiler; Komuta Puanı yetenekleri artık **zemin noktası** hedefler: Hava Saldırısı, Topçu Barajı, Acil Takviye, Sis Perdesi, Elektronik Harp.
- **Zafer** — Düşman ordusunu yok et, ya da düşman karargâhına 3 birlikle 5sn bas (bayrak iner) = anında zafer; 5dk zaman aşımında kalan güç kazanır. Sonuç kart katmanına yansır: kalan güç oranı kart gücünü belirler, kaybeden komutan kazananın kalan gücü kadar HP kaybeder (HQ ele geçirme +15 bonus).
- **Beceri > İstatistik** — Zayıf orduyla iyi yerleşim + doğru duruş + isabetli yetenek zamanlaması, güçlü ama kötü yönetilen orduyu yenebilir.

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
| `scene3d.js` | Three.js sahne: kart masası, meshler, efektler, kamera, zemin raycast |
| `warmap.js` | Muharebe sahası motoru: harita, birlikler, yerleştirme, RTS, otonom savaş |
| `app.js` | Oyun döngüsü, savaş çözümü, AI, kampanya, taktikler, HUD |
| `countries.js` | 30 ülke kartı veri tabanı |
| `leaders.js` | 8 lider ve pasif yetenekleri |
| `tactics.js` | 6 taktik kartı tanımı |
| `meta.js` | Madalya/başarım/istatistik kalıcılığı (localStorage) |
| `audio.js` | WebAudio prosedürel ses motoru |
| `styles.css` | HUD, modaller ve UI animasyonları |
| `vendor/three.min.js` | Three.js r128 (yerel, CDN bağımlılığı yok) |
