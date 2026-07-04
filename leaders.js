// Global Firepower: Tactical Fronts - Lider Veri Tabanı
const LEADERS_DB = [
  {
    id: "trump",
    name: "Donald Trump",
    flag: "🇺🇸",
    title: "America First",
    desc: "Yerleştirilen tüm Kara birimlerine kalıcı +6 Güç verir.",
    abilityType: "land_buff",
    abilityVal: 6,
    isLocked: false,
    price: "0.00"
  },
  {
    id: "putin",
    name: "Vladimir Putin",
    flag: "🇷🇺",
    title: "Sibirya Ayısı",
    desc: "Rakibin oynadığı Kara biriminin gücünü kalıcı olarak -8 azaltır.",
    abilityType: "land_debuff",
    abilityVal: 8,
    isLocked: false,
    price: "0.00"
  },
  {
    id: "erdogan",
    name: "R. Tayyip Erdoğan",
    flag: "🇹🇷",
    title: "SİHA Doktrini",
    desc: "Yerleştirilen tüm Hava birimlerine kalıcı +7 Güç verir.",
    abilityType: "air_buff",
    abilityVal: 7,
    isLocked: false,
    price: "0.00"
  },
  {
    id: "jinping",
    name: "Xi Jinping",
    flag: "🇨🇳",
    title: "İpek Yolu Lojistiği",
    desc: "Her tur sonunda oyuncuya +5 Can (HP) yeniler.",
    abilityType: "heal_round_end",
    abilityVal: 5,
    isLocked: false,
    price: "0.00"
  },
  {
    id: "kim",
    name: "Kim Jong Un",
    flag: "🇰🇵",
    title: "Nükleer Tehdit",
    desc: "Her 3 turda bir, rakibin sahadaki en güçlü biriminin gücünü yarıya düşürür.",
    abilityType: "nuke_debuff",
    abilityVal: 0.5,
    isLocked: true,
    price: "$0.99"
  },
  {
    id: "macron",
    name: "Emmanuel Macron",
    flag: "🇫🇷",
    title: "Diplomasi Koalisyonu",
    desc: "Boş cepheden alınan doğrudan hasarları %30 oranında azaltır.",
    abilityType: "direct_damage_reduction",
    abilityVal: 0.3,
    isLocked: true,
    price: "$0.99"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LEADERS_DB;
}
