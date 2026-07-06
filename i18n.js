// GFP: Tactical Fronts — hafif çift dil (TR/EN) sistemi.
// T(key) çeviri döndürür; applyLang() DOM'daki [data-i18n] öğelerini + kayıtlı menü
// dizelerini günceller. Çevirisi olmayan anahtar TR'ye, o da yoksa anahtara düşer.
const I18N = (() => {
  const DICT = {
    tr: {
      'menu.tagline': 'TACTICAL FRONTS 3D — CEPHE SAVAŞLARI',
      'menu.medals': 'Madalya', 'menu.wins': 'Zafer', 'menu.losses': 'Yenilgi',
      'mode.quick.title': 'HIZLI SAVAŞ', 'mode.quick.btn': 'SAVAŞA GİR',
      'mode.campaign.title': 'FETİH HAREKÂTI', 'mode.campaign.btn': 'HAREKÂTI BAŞLAT',
      'mode.duel.title': 'DÜELLO', 'mode.duel.btn': 'DÜELLOYU BAŞLAT',
      'mode.online.title': 'ONLINE SIRALI', 'mode.online.btn': 'SIRALIYA GİR',
      'btn.achievements': 'Başarımlar', 'btn.leaderboard': 'Liderlik Tablosu',
      'btn.howto': 'Nasıl Oynanır?', 'btn.settings': 'Ayarlar', 'btn.sound': 'Ses',
      'btn.close': 'Kapat', 'btn.back': 'Geri', 'btn.skip': 'Atla', 'btn.next': 'İleri', 'btn.start': 'Başla',
      // Ayarlar
      'settings.title': 'AYARLAR', 'settings.volume': 'Ses Seviyesi', 'settings.bloom': 'Bloom (parıltı)',
      'settings.shadows': 'Gölgeler', 'settings.lang': 'Dil / Language', 'settings.on': 'Açık', 'settings.off': 'Kapalı',
      'settings.perf': 'Performans için Bloom/Gölgeleri kapatabilirsin.',
      // Nasıl Oynanır
      'howto.title': 'NASIL OYNANIR',
      'howto.1.t': '1 · Ordunu Kur', 'howto.1.d': 'Alt panelden birlik tipi seç, kendi (mavi) bölgene tıklayarak yerleştir. Bütçeni akıllı harca.',
      'howto.2.t': '2 · Taş-Kağıt-Makas', 'howto.2.d': 'Her birliğin güçlü/zayıf olduğu tipler var. Fareyi birliğin üstüne getir → kontra kartını gör. Tanksavar tankı ezer, piyade tanksavarı, AA uçağı düşürür.',
      'howto.3.t': '3 · Ulusal Doktrin', 'howto.3.d': 'Seçtiğin ülke birliklerine bonus/ceza verir (Türkiye +İHA, Rusya +tank...). Rakibin ülkesini oku, ona göre kur.',
      'howto.4.t': '4 · Savaş & Yönlendir', 'howto.4.d': 'HAZIR de → birlikler otomatik çarpışır. Birlik seç + hedefe tıkla ile yönlendir. Duruş (Taarruz/Savunma) ve Komuta Puanı yeteneklerini doğru anda kullan.',
      'howto.5.t': '5 · Su & Köprü', 'howto.5.d': 'Bazı haritalarda nehir/kanal haritayı böler. Kara birlikleri köprüden geçer; gemiler suda savaşır. Köprüyü tutan avantajlıdır.',
      'howto.6.t': '6 · Kazan & Paylaş', 'howto.6.d': 'Düşman ordusunu yok et ya da karargâhını ele geçir. Zaferini paylaş, sıralamada yüksel!',
      // Zafer/paylaşım
      'result.victory': 'ZAFER', 'result.defeat': 'YENİLGİ', 'result.draw': 'BERABERE',
      'result.crushed': 'EZDİ', 'result.vs': 'KARŞI',
      'result.remaining': 'Kalan birlik', 'result.duration': 'Süre', 'result.terrain': 'Arazi',
      'result.share': 'Görüntü Oluştur & Paylaş', 'result.shot': 'Ekran Görüntüsü',
      'result.again': 'Tekrar', 'result.continue': 'Devam', 'result.menu': 'Menü', 'result.copied': 'Kopyalandı!'
    },
    en: {
      'menu.tagline': 'TACTICAL FRONTS 3D — FRONT WARS',
      'menu.medals': 'Medals', 'menu.wins': 'Wins', 'menu.losses': 'Losses',
      'mode.quick.title': 'QUICK BATTLE', 'mode.quick.btn': 'ENTER BATTLE',
      'mode.campaign.title': 'CONQUEST', 'mode.campaign.btn': 'START CAMPAIGN',
      'mode.duel.title': 'DUEL', 'mode.duel.btn': 'START DUEL',
      'mode.online.title': 'ONLINE RANKED', 'mode.online.btn': 'PLAY RANKED',
      'btn.achievements': 'Achievements', 'btn.leaderboard': 'Leaderboard',
      'btn.howto': 'How to Play', 'btn.settings': 'Settings', 'btn.sound': 'Sound',
      'btn.close': 'Close', 'btn.back': 'Back', 'btn.skip': 'Skip', 'btn.next': 'Next', 'btn.start': 'Start',
      'settings.title': 'SETTINGS', 'settings.volume': 'Volume', 'settings.bloom': 'Bloom (glow)',
      'settings.shadows': 'Shadows', 'settings.lang': 'Language / Dil', 'settings.on': 'On', 'settings.off': 'Off',
      'settings.perf': 'Turn off Bloom/Shadows for better performance.',
      'howto.title': 'HOW TO PLAY',
      'howto.1.t': '1 · Build Your Army', 'howto.1.d': 'Pick a unit type from the bottom panel and place it in your (blue) zone. Spend your budget wisely.',
      'howto.2.t': '2 · Rock-Paper-Scissors', 'howto.2.d': 'Every unit counters some and is weak to others. Hover a unit → see its counter card. Anti-tank beats tanks, infantry beats anti-tank, AA downs aircraft.',
      'howto.3.t': '3 · National Doctrine', 'howto.3.d': 'Your country buffs/nerfs its units (Turkey +drones, Russia +tanks...). Read your enemy\'s country and build to counter.',
      'howto.4.t': '4 · Fight & Command', 'howto.4.d': 'Hit READY → armies clash automatically. Select a unit + click a target to command it. Use stances (Assault/Defense) and Command Point abilities at the right moment.',
      'howto.5.t': '5 · Water & Bridges', 'howto.5.d': 'Some maps have a river/channel splitting the map. Land units cross via the bridge; ships fight in the water. Hold the bridge to win.',
      'howto.6.t': '6 · Win & Share', 'howto.6.d': 'Destroy the enemy army or capture their HQ. Share your victory and climb the ranks!',
      'result.victory': 'VICTORY', 'result.defeat': 'DEFEAT', 'result.draw': 'DRAW',
      'result.crushed': 'CRUSHED', 'result.vs': 'VS',
      'result.remaining': 'Units left', 'result.duration': 'Duration', 'result.terrain': 'Terrain',
      'result.share': 'Create Image & Share', 'result.shot': 'Screenshot',
      'result.again': 'Rematch', 'result.continue': 'Continue', 'result.menu': 'Menu', 'result.copied': 'Copied!'
    }
  };

  function lang() { return (typeof META !== 'undefined' && META.lang) ? META.lang : 'tr'; }
  function T(key) {
    const l = lang();
    return (DICT[l] && DICT[l][key]) || DICT.tr[key] || key;
  }
  // DOM'daki [data-i18n] / [data-i18n-html] öğelerini güncelle
  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = T(el.getAttribute('data-i18n-html')); });
  }
  return { T, applyLang, lang };
})();
const T = I18N.T;
