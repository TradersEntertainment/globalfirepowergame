// Global Firepower: Tactical Fronts - Lider Veri Tabanı (V2.0)
// Kilitli liderler artık savaşlarda kazanılan Şeref Madalyası ile açılır (cost alanı).
const LEADERS_DB = [
  {
    id: "trump",
    iso: "us",
    name: "Donald Trump",
    flag: "🇺🇸",
    title: "America First",
    desc: "Yerleştirilen tüm Kara birimlerine kalıcı +6 Güç verir.",
    abilityType: "land_buff",
    abilityVal: 6,
    isLocked: false,
    cost: 0
  },
  {
    id: "putin",
    iso: "ru",
    name: "Vladimir Putin",
    flag: "🇷🇺",
    title: "Sibirya Ayısı",
    desc: "Rakibin oynadığı Kara biriminin gücünü kalıcı olarak -8 azaltır.",
    abilityType: "land_debuff",
    abilityVal: 8,
    isLocked: false,
    cost: 0
  },
  {
    id: "erdogan",
    iso: "tr",
    name: "R. Tayyip Erdoğan",
    flag: "🇹🇷",
    title: "SİHA Doktrini",
    desc: "Yerleştirilen tüm Hava birimlerine kalıcı +7 Güç verir.",
    abilityType: "air_buff",
    abilityVal: 7,
    isLocked: false,
    cost: 0
  },
  {
    id: "jinping",
    iso: "cn",
    name: "Xi Jinping",
    flag: "🇨🇳",
    title: "İpek Yolu Lojistiği",
    desc: "Her tur sonunda oyuncuya +5 Can (HP) yeniler.",
    abilityType: "heal_round_end",
    abilityVal: 5,
    isLocked: false,
    cost: 0
  },
  {
    id: "kim",
    iso: "kp",
    name: "Kim Jong Un",
    flag: "🇰🇵",
    title: "Nükleer Tehdit",
    desc: "Her 3 turda bir, rakibin sahadaki en güçlü biriminin gücünü yarıya düşürür.",
    abilityType: "nuke_debuff",
    abilityVal: 0.5,
    isLocked: true,
    cost: 150
  },
  {
    id: "macron",
    iso: "fr",
    name: "Emmanuel Macron",
    flag: "🇫🇷",
    title: "Diplomasi Koalisyonu",
    desc: "Boş cepheden alınan doğrudan hasarları %30 oranında azaltır.",
    abilityType: "direct_damage_reduction",
    abilityVal: 0.3,
    isLocked: true,
    cost: 150
  },
  {
    id: "zelensky",
    iso: "ua",
    name: "V. Zelenskiy",
    flag: "🇺🇦",
    title: "Direniş Ruhu",
    desc: "Sahadaki bir birimin yok edildiğinde +6 HP kazanırsın. Millet asla pes etmez.",
    abilityType: "hp_on_unit_lost",
    abilityVal: 6,
    isLocked: true,
    cost: 250
  },
  {
    id: "modi",
    iso: "in",
    name: "Narendra Modi",
    flag: "🇮🇳",
    title: "İnsan Gücü Seferberliği",
    desc: "El limitin 5 yerine 6 karttır. Her tur daha fazla seçenekle savaşırsın.",
    abilityType: "hand_size",
    abilityVal: 6,
    isLocked: true,
    cost: 250
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LEADERS_DB;
}
