// Global Firepower Dengelenmiş Ülke Kart Veri Tabanı
const COUNTRIES_DB = [
  { id: "usa", name: "ABD", flag: "🇺🇸", rank: 1, land: 55, air: 60, sea: 50, desc: "Küresel güç projeksiyonu ve teknolojik üstünlük." },
  { id: "russia", name: "Rusya", flag: "🇷🇺", rank: 2, land: 60, air: 50, sea: 40, desc: "Muazzam tank envanteri ve zırhlı kara gücü." },
  { id: "china", name: "Çin", flag: "🇨🇳", rank: 3, land: 52, air: 48, sea: 55, desc: "Endüstriyel üretim gücü ve hızla büyüyen donanma." },
  { id: "india", name: "Hindistan", flag: "🇮🇳", rank: 4, land: 54, air: 42, sea: 38, desc: "Yüksek insan gücü ve stratejik bölgesel güç." },
  { id: "south_korea", name: "Güney Kore", flag: "🇰🇷", rank: 5, land: 48, air: 45, sea: 40, desc: "Gelişmiş yerli savunma sanayii ve teknoloji." },
  { id: "uk", name: "İngiltere", flag: "🇬🇧", rank: 6, land: 30, air: 42, sea: 45, desc: "Köklü donanma geleneği ve hava devriyeleri." },
  { id: "japan", name: "Japonya", flag: "🇯🇵", rank: 7, land: 32, air: 44, sea: 48, desc: "Yüksek teknolojili savunma filoları ve ada koruması." },
  { id: "turkey", name: "Türkiye", flag: "🇹🇷", rank: 9, land: 48, air: 42, sea: 36, desc: "Gelişmiş İHA/SİHA teknolojisi ve geniş kara ordusu." },
  { id: "italy", name: "İtalya", flag: "🇮🇹", rank: 10, land: 32, air: 40, sea: 42, desc: "Akdeniz'de güçlü deniz varlığı ve modern hava filosu." },
  { id: "brazil", name: "Brezilya", flag: "🇧🇷", rank: 12, land: 35, air: 34, sea: 32, desc: "Güney Amerika'nın en büyük dengeli askeri gücü." },
  { id: "egypt", name: "Mısır", flag: "🇪🇬", rank: 15, land: 46, air: 38, sea: 30, desc: "Ortadoğu'nun köklü ve yüksek zırhlı kara gücü." },
  { id: "australia", name: "Avustralya", flag: "🇦🇺", rank: 16, land: 22, air: 35, sea: 38, desc: "Kıtasal savunma ve gelişmiş deniz devriye filoları." },
  { id: "israel", name: "İsrail", flag: "🇮🇱", rank: 17, land: 45, air: 46, sea: 15, desc: "İleri düzey hava hakimiyeti ve teknolojik savunma." },
  { id: "ukraine", name: "Ukrayna", flag: "🇺🇦", rank: 18, land: 50, air: 30, sea: 12, desc: "Yüksek operasyonel tecrübeli kara ve topçu gücü." },
  { id: "poland", name: "Polonya", flag: "🇵🇱", rank: 21, land: 42, air: 32, sea: 18, desc: "Hızla büyüyen kara savunması ve zırhlı birlikler." },
  { id: "saudi_arabia", name: "Suudi Arabistan", flag: "🇸🇦", rank: 23, land: 38, air: 40, sea: 20, desc: "Yüksek bütçeli modern hava savunma ve jet filoları." },
  { id: "germany", name: "Almanya", flag: "🇩🇪", rank: 25, land: 30, air: 34, sea: 25, desc: "Avrupa merkezli teknolojik lojistik altyapı." },
  { id: "canada", name: "Kanada", flag: "🇨🇦", rank: 27, land: 24, air: 32, sea: 30, desc: "Geniş coğrafyada arama-kurtarma ve deniz devriyesi." },
  { id: "greece", name: "Yunanistan", flag: "🇬🇷", rank: 32, land: 32, air: 35, sea: 28, desc: "Ege ve Akdeniz'de yoğunlaşmış deniz ve jet filoları." },
  { id: "switzerland", name: "İsviçre", flag: "🇨🇭", rank: 44, land: 28, air: 25, sea: 0, desc: "Dağlık coğrafya tahkimatı. Denize kıyısı yoktur (Sea: 0)." },
  { id: "azerbaijan", name: "Azerbaycan", flag: "🇦🇿", rank: 59, land: 34, air: 28, sea: 10, desc: "Hazar'da sınırlı donanma, modern İHA ve kara gücü." },
  { id: "mongolia", name: "Moğolistan", flag: "🇲🇳", rank: 101, land: 20, air: 12, sea: 0, desc: "Landlocked bozkır gücü. Denize kıyısı yoktur (Sea: 0)." }
];

// Tarayıcı ve Node.js için dışa aktarma uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
  module.exports = COUNTRIES_DB;
}
