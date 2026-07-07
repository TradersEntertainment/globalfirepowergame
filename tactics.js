// Global Firepower: Tactical Fronts - Taktik Kartları Veri Tabanı (V2.0)
// target: 'enemy' → düşman cephesi seç, 'ally' → kendi cephen seç, 'none' → anında etki
const TACTICS_DB = [
  {
    id: "airstrike",
    icon: "fa-rocket",
    name: "Hava Harekâtı",
    desc: "Seçtiğin düşman biriminin gücünü bulunduğu cephede 12 azaltır.",
    target: "enemy",
    val: 12,
    aiUsable: true
  },
  {
    id: "fortify",
    icon: "fa-tower-observation",
    name: "İstihkam",
    desc: "Sahadaki bir birimine bulunduğu cephede kalıcı +10 Güç verir.",
    target: "ally",
    val: 10,
    aiUsable: true
  },
  {
    id: "recon",
    icon: "fa-satellite",
    name: "Keşif Uydusu",
    desc: "Bu tur boyunca düşmanın sahadaki gizli kartlarını açık görürsün.",
    target: "none",
    val: 0,
    aiUsable: false
  },
  {
    id: "hospital",
    icon: "fa-truck-medical",
    name: "Sahra Hastanesi",
    desc: "Komuta merkezini onarır: anında +12 HP iyileştirir.",
    target: "none",
    val: 12,
    aiUsable: true
  },
  {
    id: "mobilize",
    icon: "fa-boxes-stacked",
    name: "Seferberlik",
    desc: "Acil sevkiyat: desteden anında 2 kart çekersin.",
    target: "none",
    val: 2,
    aiUsable: false
  },
  {
    id: "emp",
    icon: "fa-bolt-lightning",
    name: "EMP Saldırısı",
    desc: "Bu turki savaş boyunca rakip liderin pasif yeteneğini devre dışı bırakır.",
    target: "none",
    val: 0,
    aiUsable: false
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TACTICS_DB;
}
