// Global Firepower Dengelenmiş Ülke Kart Veri Tabanı
const COUNTRIES_DB = [
  { id: "usa", iso: "us", lat: 38.9, lon: -77.0, name: "ABD", flag: "🇺🇸", rank: 1, land: 55, air: 60, sea: 50, desc: "Küresel güç projeksiyonu ve teknolojik üstünlük." },
  { id: "russia", iso: "ru", lat: 55.8, lon: 37.6, name: "Rusya", flag: "🇷🇺", rank: 2, land: 60, air: 50, sea: 40, desc: "Muazzam tank envanteri ve zırhlı kara gücü." },
  { id: "china", iso: "cn", lat: 39.9, lon: 116.4, name: "Çin", flag: "🇨🇳", rank: 3, land: 52, air: 48, sea: 55, desc: "Endüstriyel üretim gücü ve hızla büyüyen donanma." },
  { id: "india", iso: "in", lat: 28.6, lon: 77.2, name: "Hindistan", flag: "🇮🇳", rank: 4, land: 54, air: 42, sea: 38, desc: "Yüksek insan gücü ve stratejik bölgesel güç." },
  { id: "south_korea", iso: "kr", lat: 37.6, lon: 127.0, name: "Güney Kore", flag: "🇰🇷", rank: 5, land: 48, air: 45, sea: 40, desc: "Gelişmiş yerli savunma sanayii ve teknoloji." },
  { id: "uk", iso: "gb", lat: 51.5, lon: -0.1, name: "İngiltere", flag: "🇬🇧", rank: 6, land: 30, air: 42, sea: 45, desc: "Köklü donanma geleneği ve hava devriyeleri." },
  { id: "japan", iso: "jp", lat: 35.7, lon: 139.7, name: "Japonya", flag: "🇯🇵", rank: 7, land: 32, air: 44, sea: 48, desc: "Yüksek teknolojili savunma filoları ve ada koruması." },
  { id: "turkey", iso: "tr", lat: 39.9, lon: 32.9, name: "Türkiye", flag: "🇹🇷", rank: 9, land: 48, air: 42, sea: 36, desc: "Gelişmiş İHA/SİHA teknolojisi ve geniş kara ordusu." },
  { id: "italy", iso: "it", lat: 41.9, lon: 12.5, name: "İtalya", flag: "🇮🇹", rank: 10, land: 32, air: 40, sea: 42, desc: "Akdeniz'de güçlü deniz varlığı ve modern hava filosu." },
  { id: "brazil", iso: "br", lat: -15.8, lon: -47.9, name: "Brezilya", flag: "🇧🇷", rank: 12, land: 35, air: 34, sea: 32, desc: "Güney Amerika'nın en büyük dengeli askeri gücü." },
  { id: "egypt", iso: "eg", lat: 30.0, lon: 31.2, name: "Mısır", flag: "🇪🇬", rank: 15, land: 46, air: 38, sea: 30, desc: "Ortadoğu'nun köklü ve yüksek zırhlı kara gücü." },
  { id: "australia", iso: "au", lat: -35.3, lon: 149.1, name: "Avustralya", flag: "🇦🇺", rank: 16, land: 22, air: 35, sea: 38, desc: "Kıtasal savunma ve gelişmiş deniz devriye filoları." },
  { id: "israel", iso: "il", lat: 31.8, lon: 35.2, name: "İsrail", flag: "🇮🇱", rank: 17, land: 45, air: 46, sea: 15, desc: "İleri düzey hava hakimiyeti ve teknolojik savunma." },
  { id: "ukraine", iso: "ua", lat: 50.5, lon: 30.5, name: "Ukrayna", flag: "🇺🇦", rank: 18, land: 50, air: 30, sea: 12, desc: "Yüksek operasyonel tecrübeli kara ve topçu gücü." },
  { id: "poland", iso: "pl", lat: 52.2, lon: 21.0, name: "Polonya", flag: "🇵🇱", rank: 21, land: 42, air: 32, sea: 18, desc: "Hızla büyüyen kara savunması ve zırhlı birlikler." },
  { id: "saudi_arabia", iso: "sa", lat: 24.7, lon: 46.7, name: "Suudi Arabistan", flag: "🇸🇦", rank: 23, land: 38, air: 40, sea: 20, desc: "Yüksek bütçeli modern hava savunma ve jet filoları." },
  { id: "germany", iso: "de", lat: 52.5, lon: 13.4, name: "Almanya", flag: "🇩🇪", rank: 25, land: 30, air: 34, sea: 25, desc: "Avrupa merkezli teknolojik lojistik altyapı." },
  { id: "canada", iso: "ca", lat: 45.4, lon: -75.7, name: "Kanada", flag: "🇨🇦", rank: 27, land: 24, air: 32, sea: 30, desc: "Geniş coğrafyada arama-kurtarma ve deniz devriyesi." },
  { id: "greece", iso: "gr", lat: 38.0, lon: 23.7, name: "Yunanistan", flag: "🇬🇷", rank: 32, land: 32, air: 35, sea: 28, desc: "Ege ve Akdeniz'de yoğunlaşmış deniz ve jet filoları." },
  { id: "switzerland", iso: "ch", lat: 46.9, lon: 7.4, name: "İsviçre", flag: "🇨🇭", rank: 44, land: 28, air: 25, sea: 0, desc: "Dağlık coğrafya tahkimatı. Denize kıyısı yoktur (Sea: 0)." },
  { id: "azerbaijan", iso: "az", lat: 40.4, lon: 49.9, name: "Azerbaycan", flag: "🇦🇿", rank: 59, land: 34, air: 28, sea: 10, desc: "Hazar'da sınırlı donanma, modern İHA ve kara gücü." },
  { id: "mongolia", iso: "mn", lat: 47.9, lon: 106.9, name: "Moğolistan", flag: "🇲🇳", rank: 101, land: 20, air: 12, sea: 0, desc: "Landlocked bozkır gücü. Denize kıyısı yoktur (Sea: 0)." },
  { id: "france", iso: "fr", lat: 48.9, lon: 2.4, name: "Fransa", flag: "🇫🇷", rank: 8, land: 36, air: 44, sea: 44, desc: "Nükleer denizaltılar ve uçak gemisi görev gücü." },
  { id: "pakistan", iso: "pk", lat: 33.7, lon: 73.1, name: "Pakistan", flag: "🇵🇰", rank: 11, land: 44, air: 36, sea: 24, desc: "Geniş kara ordusu ve bölgesel caydırıcılık." },
  { id: "indonesia", iso: "id", lat: -6.2, lon: 106.8, name: "Endonezya", flag: "🇮🇩", rank: 13, land: 36, air: 30, sea: 36, desc: "Takımadalar donanması ve büyüyen savunma bütçesi." },
  { id: "iran", iso: "ir", lat: 35.7, lon: 51.4, name: "İran", flag: "🇮🇷", rank: 14, land: 42, air: 30, sea: 26, desc: "Balistik füze programı ve asimetrik deniz taktikleri." },
  { id: "spain", iso: "es", lat: 40.4, lon: -3.7, name: "İspanya", flag: "🇪🇸", rank: 19, land: 28, air: 34, sea: 36, desc: "Amfibi hücum gemileri ve Akdeniz filosu." },
  { id: "vietnam", iso: "vn", lat: 21.0, lon: 105.9, name: "Vietnam", flag: "🇻🇳", rank: 20, land: 40, air: 26, sea: 22, desc: "Çetin savunma doktrini ve tecrübeli kara kuvvetleri." },
  { id: "sweden", iso: "se", lat: 59.3, lon: 18.1, name: "İsveç", flag: "🇸🇪", rank: 29, land: 26, air: 36, sea: 24, desc: "Gripen filosu ve Baltık'ta sessiz denizaltılar." },
  { id: "netherlands", iso: "nl", lat: 52.4, lon: 4.9, name: "Hollanda", flag: "🇳🇱", rank: 35, land: 24, air: 32, sea: 34, desc: "Fırkateyn filosu ve NATO lojistik üssü." }
];

// Tarayıcı ve Node.js için dışa aktarma uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
  module.exports = COUNTRIES_DB;
}
