// Global Firepower Dengelenmiş Ülke Kart Veri Tabanı
// doctrine: ulusal birlik doktrini — dengeli asimetri (bir güç kümesi ~+%15-25, bir zayıflık ~-%10-15).
//   mods anahtarları birim SINIFI (inf/at/apc/tank/arty/aa/air/heli/drone/ship/boat) veya KUVVET (land/air/sea).
//   signature = ülkenin ikonik birlik sınıfı (tooltip + görsel vurgu).
const COUNTRIES_DB = [
  { id: "usa", colors: [0x3c3b6e, 0xb22234], iso: "us", lat: 38.9, lon: -77.0, name: "ABD", flag: "🇺🇸", rank: 1, land: 55, air: 60, sea: 50, desc: "Küresel güç projeksiyonu ve teknolojik üstünlük.",
    doctrine: { name: "Hava-Deniz Üstünlüğü", tag: "+Hava/Deniz · −Kara", signature: "air", mods: { air: { hp: 1.13, dmg: 1.1 }, sea: { dmg: 1.08 }, land: { dmg: 0.94 } } } },
  { id: "russia", colors: [0xd52b1e, 0x0039a6], iso: "ru", lat: 55.8, lon: 37.6, name: "Rusya", flag: "🇷🇺", rank: 2, land: 60, air: 50, sea: 40, desc: "Muazzam tank envanteri ve zırhlı kara gücü.",
    doctrine: { name: "Zırhlı Doktrin", tag: "+Tank/Topçu · −Hava", signature: "tank", mods: { tank: { hp: 1.18, dmg: 1.1 }, arty: { dmg: 1.12 }, air: { hp: 0.85, dmg: 0.88 } } } },
  { id: "china", colors: [0xde2910, 0xffde00], iso: "cn", lat: 39.9, lon: 116.4, name: "Çin", flag: "🇨🇳", rank: 3, land: 52, air: 48, sea: 55, desc: "Endüstriyel üretim gücü ve hızla büyüyen donanma.",
    doctrine: { name: "Halk Ordusu", tag: "+Deniz/Piyade · −Hava", signature: "ship", mods: { ship: { hp: 1.16, dmg: 1.1 }, inf: { hp: 1.12 }, air: { dmg: 0.88 } } } },
  { id: "india", colors: [0xff9933, 0x138808], iso: "in", lat: 28.6, lon: 77.2, name: "Hindistan", flag: "🇮🇳", rank: 4, land: 54, air: 42, sea: 38, desc: "Yüksek insan gücü ve stratejik bölgesel güç.",
    doctrine: { name: "Kitle Kara Gücü", tag: "+Piyade/Tank · −Hava", signature: "tank", mods: { inf: { hp: 1.12 }, tank: { hp: 1.1 }, air: { dmg: 0.86 }, sea: { dmg: 0.92 } } } },
  { id: "south_korea", colors: [0xcd2e3a, 0x0047a0], iso: "kr", lat: 37.6, lon: 127.0, name: "Güney Kore", flag: "🇰🇷", rank: 5, land: 48, air: 45, sea: 40, desc: "Gelişmiş yerli savunma sanayii ve teknoloji.",
    doctrine: { name: "Teknoloji Savunması", tag: "+Tank/Dron · −Deniz", signature: "drone", mods: { tank: { dmg: 1.1 }, drone: { hp: 1.12, dmg: 1.08 }, sea: { hp: 0.9 } } } },
  { id: "uk", colors: [0x012169, 0xc8102e], iso: "gb", lat: 51.5, lon: -0.1, name: "İngiltere", flag: "🇬🇧", rank: 6, land: 30, air: 42, sea: 45, desc: "Köklü donanma geleneği ve hava devriyeleri.",
    doctrine: { name: "Kraliyet Donanması", tag: "+Deniz/Hava · −Kara", signature: "ship", mods: { sea: { hp: 1.2, dmg: 1.12 }, air: { dmg: 1.1 }, land: { hp: 0.9 } } } },
  { id: "japan", colors: [0xbc002d, 0xf0f0f0], iso: "jp", lat: 35.7, lon: 139.7, name: "Japonya", flag: "🇯🇵", rank: 7, land: 32, air: 44, sea: 48, desc: "Yüksek teknolojili savunma filoları ve ada koruması.",
    doctrine: { name: "Ada Savunması", tag: "+Deniz/AA · −Kara", signature: "ship", mods: { sea: { hp: 1.18, dmg: 1.12 }, aa: { dmg: 1.2 }, land: { dmg: 0.9 } } } },
  { id: "turkey", colors: [0xe30a17, 0xffffff], iso: "tr", lat: 39.9, lon: 32.9, name: "Türkiye", flag: "🇹🇷", rank: 9, land: 48, air: 42, sea: 36, desc: "Gelişmiş İHA/SİHA teknolojisi ve geniş kara ordusu.",
    doctrine: { name: "İHA Doktrini", tag: "+Dron/Heli · −Deniz", signature: "drone", mods: { drone: { hp: 1.28, dmg: 1.22, range: 1.1 }, heli: { dmg: 1.15 }, sea: { hp: 0.9, dmg: 0.88 } } } },
  { id: "italy", colors: [0x008c45, 0xcd212a], iso: "it", lat: 41.9, lon: 12.5, name: "İtalya", flag: "🇮🇹", rank: 10, land: 32, air: 40, sea: 42, desc: "Akdeniz'de güçlü deniz varlığı ve modern hava filosu.",
    doctrine: { name: "Akdeniz Filosu", tag: "+Deniz/Hava · −Kara", signature: "ship", mods: { sea: { hp: 1.16, dmg: 1.12 }, air: { dmg: 1.1 }, land: { dmg: 0.92 } } } },
  { id: "brazil", colors: [0x009c3b, 0xffdf00], iso: "br", lat: -15.8, lon: -47.9, name: "Brezilya", flag: "🇧🇷", rank: 12, land: 35, air: 34, sea: 32, desc: "Güney Amerika'nın en büyük dengeli askeri gücü.",
    doctrine: { name: "Dengeli Kara", tag: "+Piyade/ZPT · −Hava", signature: "apc", mods: { inf: { hp: 1.15 }, apc: { hp: 1.15, dmg: 1.1 }, air: { dmg: 0.9 } } } },
  { id: "egypt", colors: [0xce1126, 0x000000], iso: "eg", lat: 30.0, lon: 31.2, name: "Mısır", flag: "🇪🇬", rank: 15, land: 46, air: 38, sea: 30, desc: "Ortadoğu'nun köklü ve yüksek zırhlı kara gücü.",
    doctrine: { name: "Çöl Zırhı", tag: "+Tank/Piyade · −Deniz", signature: "tank", mods: { tank: { hp: 1.14, dmg: 1.08 }, inf: { hp: 1.1 }, sea: { hp: 0.88 } } } },
  { id: "australia", colors: [0x00247d, 0xcf142b], iso: "au", lat: -35.3, lon: 149.1, name: "Avustralya", flag: "🇦🇺", rank: 16, land: 22, air: 35, sea: 38, desc: "Kıtasal savunma ve gelişmiş deniz devriye filoları.",
    doctrine: { name: "Kıta Devriyesi", tag: "+Deniz/Hava · −Kara", signature: "ship", mods: { sea: { hp: 1.16, dmg: 1.1 }, air: { dmg: 1.1 }, land: { hp: 0.9 } } } },
  { id: "israel", colors: [0x0038b8, 0xf0f0f0], iso: "il", lat: 31.8, lon: 35.2, name: "İsrail", flag: "🇮🇱", rank: 17, land: 45, air: 46, sea: 15, desc: "İleri düzey hava hakimiyeti ve teknolojik savunma.",
    doctrine: { name: "Demir Kubbe", tag: "+Dron/AA/Hava · −Deniz", signature: "aa", mods: { aa: { hp: 1.2, dmg: 1.25 }, drone: { dmg: 1.18 }, air: { dmg: 1.12 }, sea: { hp: 0.85, dmg: 0.85 } } } },
  { id: "ukraine", colors: [0x0057b7, 0xffd700], iso: "ua", lat: 50.5, lon: 30.5, name: "Ukrayna", flag: "🇺🇦", rank: 18, land: 50, air: 30, sea: 12, desc: "Yüksek operasyonel tecrübeli kara ve topçu gücü.",
    doctrine: { name: "Direniş Doktrini", tag: "+Tanksavar/Topçu/Dron · −Hava/Deniz", signature: "at", mods: { at: { hp: 1.2, dmg: 1.2 }, arty: { dmg: 1.15 }, drone: { dmg: 1.15 }, air: { hp: 0.9 }, sea: { hp: 0.85 } } } },
  { id: "poland", colors: [0xdc143c, 0xf0f0f0], iso: "pl", lat: 52.2, lon: 21.0, name: "Polonya", flag: "🇵🇱", rank: 21, land: 42, air: 32, sea: 18, desc: "Hızla büyüyen kara savunması ve zırhlı birlikler.",
    doctrine: { name: "Doğu Kalkanı", tag: "+Tank/Tanksavar · −Deniz", signature: "tank", mods: { tank: { hp: 1.2, dmg: 1.12 }, at: { dmg: 1.12 }, sea: { hp: 0.88 } } } },
  { id: "saudi_arabia", colors: [0x006c35, 0xf0f0f0], iso: "sa", lat: 24.7, lon: 46.7, name: "Suudi Arabistan", flag: "🇸🇦", rank: 23, land: 38, air: 40, sea: 20, desc: "Yüksek bütçeli modern hava savunma ve jet filoları.",
    doctrine: { name: "Çöl Kalkanı", tag: "+Hava/AA · −Kara", signature: "air", mods: { air: { hp: 1.18, dmg: 1.12 }, aa: { dmg: 1.15 }, land: { dmg: 0.92 } } } },
  { id: "germany", colors: [0xdd0000, 0xffce00], iso: "de", lat: 52.5, lon: 13.4, name: "Almanya", flag: "🇩🇪", rank: 25, land: 30, air: 34, sea: 25, desc: "Avrupa merkezli teknolojik lojistik altyapı.",
    doctrine: { name: "Leopard Doktrini", tag: "+Tank/ZPT · −Deniz", signature: "tank", mods: { tank: { hp: 1.22, dmg: 1.15 }, apc: { hp: 1.12 }, sea: { hp: 0.9 } } } },
  { id: "canada", colors: [0xd52b1e, 0xf0f0f0], iso: "ca", lat: 45.4, lon: -75.7, name: "Kanada", flag: "🇨🇦", rank: 27, land: 24, air: 32, sea: 30, desc: "Geniş coğrafyada arama-kurtarma ve deniz devriyesi.",
    doctrine: { name: "Kuzey Devriyesi", tag: "+Deniz/Hava · −Kara", signature: "ship", mods: { sea: { hp: 1.24, dmg: 1.16 }, air: { dmg: 1.14 }, land: { hp: 0.97 } } } },
  { id: "greece", colors: [0x0d5eaf, 0xf0f0f0], iso: "gr", lat: 38.0, lon: 23.7, name: "Yunanistan", flag: "🇬🇷", rank: 32, land: 32, air: 35, sea: 28, desc: "Ege ve Akdeniz'de yoğunlaşmış deniz ve jet filoları.",
    doctrine: { name: "Ege Savunması", tag: "+Hava/Deniz · −Kara", signature: "air", mods: { air: { hp: 1.2, dmg: 1.16 }, sea: { dmg: 1.18 }, land: { dmg: 0.95 } } } },
  { id: "switzerland", colors: [0xd52b1e, 0xf0f0f0], iso: "ch", lat: 46.9, lon: 7.4, name: "İsviçre", flag: "🇨🇭", rank: 44, land: 28, air: 25, sea: 0, desc: "Dağlık coğrafya tahkimatı. Denize kıyısı yoktur (Sea: 0).",
    doctrine: { name: "Alp Kalesi", tag: "+AA/Tanksavar/Piyade · Deniz yok", signature: "aa", mods: { aa: { hp: 1.2, dmg: 1.15 }, at: { hp: 1.15 }, inf: { hp: 1.15 }, sea: { hp: 0.8, dmg: 0.8 } } } },
  { id: "azerbaijan", colors: [0x00b5e2, 0xef3340], iso: "az", lat: 40.4, lon: 49.9, name: "Azerbaycan", flag: "🇦🇿", rank: 59, land: 34, air: 28, sea: 10, desc: "Hazar'da sınırlı donanma, modern İHA ve kara gücü.",
    doctrine: { name: "İHA Taarruzu", tag: "+Dron/Topçu · −Deniz", signature: "drone", mods: { drone: { hp: 1.22, dmg: 1.18 }, arty: { dmg: 1.12 }, sea: { hp: 0.85 } } } },
  { id: "mongolia", colors: [0xc4272e, 0x015197], iso: "mn", lat: 47.9, lon: 106.9, name: "Moğolistan", flag: "🇲🇳", rank: 101, land: 20, air: 12, sea: 0, desc: "Landlocked bozkır gücü. Denize kıyısı yoktur (Sea: 0).",
    doctrine: { name: "Bozkır Süvarisi", tag: "+Piyade(hızlı) · −Hava/Deniz", signature: "inf", mods: { inf: { hp: 1.26, dmg: 1.12, speed: 1.2 }, apc: { hp: 1.12, speed: 1.15 }, air: { dmg: 0.9 }, sea: { hp: 0.85 } } } },
  { id: "france", colors: [0x0055a4, 0xef4135], iso: "fr", lat: 48.9, lon: 2.4, name: "Fransa", flag: "🇫🇷", rank: 8, land: 36, air: 44, sea: 44, desc: "Nükleer denizaltılar ve uçak gemisi görev gücü.",
    doctrine: { name: "Uçak Gemisi Görev Gücü", tag: "+Deniz/Hava · −Kara", signature: "ship", mods: { sea: { hp: 1.26, dmg: 1.2 }, air: { dmg: 1.16 }, land: { dmg: 0.97 } } } },
  { id: "pakistan", colors: [0x01411c, 0xf0f0f0], iso: "pk", lat: 33.7, lon: 73.1, name: "Pakistan", flag: "🇵🇰", rank: 11, land: 44, air: 36, sea: 24, desc: "Geniş kara ordusu ve bölgesel caydırıcılık.",
    doctrine: { name: "Bölgesel Caydırıcılık", tag: "+Tank/Piyade · −Deniz", signature: "tank", mods: { tank: { hp: 1.18, dmg: 1.12 }, inf: { hp: 1.12 }, sea: { hp: 0.88 } } } },
  { id: "indonesia", colors: [0xce1126, 0xf0f0f0], iso: "id", lat: -6.2, lon: 106.8, name: "Endonezya", flag: "🇮🇩", rank: 13, land: 36, air: 30, sea: 36, desc: "Takımadalar donanması ve büyüyen savunma bütçesi.",
    doctrine: { name: "Takımada Savunması", tag: "+Deniz/Piyade · −Hava", signature: "ship", mods: { sea: { hp: 1.24, dmg: 1.16 }, inf: { hp: 1.16 }, air: { dmg: 0.94 } } } },
  { id: "iran", colors: [0x239f40, 0xda0000], iso: "ir", lat: 35.7, lon: 51.4, name: "İran", flag: "🇮🇷", rank: 14, land: 42, air: 30, sea: 26, desc: "Balistik füze programı ve asimetrik deniz taktikleri.",
    doctrine: { name: "Asimetrik Doktrin", tag: "+Topçu/Tanksavar/Bot · −Hava", signature: "arty", mods: { arty: { hp: 1.22, dmg: 1.22 }, at: { dmg: 1.18 }, boat: { dmg: 1.2 }, air: { hp: 0.93 } } } },
  { id: "spain", colors: [0xc60b1e, 0xffc400], iso: "es", lat: 40.4, lon: -3.7, name: "İspanya", flag: "🇪🇸", rank: 19, land: 28, air: 34, sea: 36, desc: "Amfibi hücum gemileri ve Akdeniz filosu.",
    doctrine: { name: "Amfibi Kuvvet", tag: "+Deniz/Hava · −Kara", signature: "ship", mods: { sea: { hp: 1.26, dmg: 1.18 }, air: { dmg: 1.14 }, land: { hp: 0.97 } } } },
  { id: "vietnam", colors: [0xda251d, 0xffff00], iso: "vn", lat: 21.0, lon: 105.9, name: "Vietnam", flag: "🇻🇳", rank: 20, land: 40, air: 26, sea: 22, desc: "Çetin savunma doktrini ve tecrübeli kara kuvvetleri.",
    doctrine: { name: "Gerilla Doktrini", tag: "+Piyade/Tanksavar · −Hava/Deniz", signature: "inf", mods: { inf: { hp: 1.28, dmg: 1.16 }, at: { dmg: 1.2 }, air: { dmg: 0.92 }, sea: { hp: 0.94 } } } },
  { id: "sweden", colors: [0x006aa7, 0xfecc00], iso: "se", lat: 59.3, lon: 18.1, name: "İsveç", flag: "🇸🇪", rank: 29, land: 26, air: 36, sea: 24, desc: "Gripen filosu ve Baltık'ta sessiz denizaltılar.",
    doctrine: { name: "Gripen Doktrini", tag: "+Hava/Deniz · −Kara", signature: "air", mods: { air: { hp: 1.24, dmg: 1.2 }, sea: { dmg: 1.16 }, land: { hp: 0.96 } } } },
  { id: "netherlands", colors: [0xae1c28, 0x21468b], iso: "nl", lat: 52.4, lon: 4.9, name: "Hollanda", flag: "🇳🇱", rank: 35, land: 24, air: 32, sea: 34, desc: "Fırkateyn filosu ve NATO lojistik üssü.",
    doctrine: { name: "Fırkateyn Filosu", tag: "+Deniz/AA · −Kara", signature: "ship", mods: { sea: { hp: 1.26, dmg: 1.18 }, aa: { dmg: 1.18 }, land: { dmg: 0.97 } } } }
];

// Özel elit fraksiyon(lar) — "her şeyin counter'ı". 30-ülke kart havuzuna GİRMEZ; yalnız online
// sıralı kimlik seçiminde ve rakip olarak görünür. counterAll: taş-kağıt-makas zayıflığı yok
// (her hedefe en az bu çarpan). costMul: kıtlıkla denge — az ama üstün ordu.
const SPECIAL_FACTIONS = [
  { id: "un_taskforce", special: true, colors: [0x1b4a8f, 0xf0f0f0], iso: "un", name: "BM Görev Gücü", flag: "🇺🇳", rank: 0, land: 50, air: 50, sea: 50,
    desc: "Elit çok-uluslu görev gücü: her tehdide karşı üstün (zayıflığı yok), ama pahalı — az sayıda ama üstün birlik.",
    doctrine: { name: "Birleşik Kuvvet", tag: "Her tipe counter · Az ama üstün", signature: "tank", elite: true, counterAll: 1.42, costMul: 1.3, mods: { land: { hp: 1.16 }, air: { hp: 1.16 }, sea: { hp: 1.16 } } } }
];

// Tarayıcı ve Node.js için dışa aktarma uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COUNTRIES_DB, SPECIAL_FACTIONS };
  module.exports.default = COUNTRIES_DB;
}
