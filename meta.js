// Global Firepower: Tactical Fronts - Meta İlerleme Sistemi (V2.0)
// Madalyalar, lider kilitleri, istatistikler ve başarımlar localStorage'da saklanır.

const ACHIEVEMENTS_DB = [
  { id: "first_win",  icon: "fa-medal",            name: "İlk Zafer",            desc: "İlk savaşını kazan." },
  { id: "flawless",   icon: "fa-heart-circle-check", name: "Kusursuz Zafer",     desc: "Hiç hasar almadan (100 HP) bir savaş kazan." },
  { id: "sweep",      icon: "fa-broom",            name: "Üç Cephe Süpürgesi",   desc: "Tek turda Kara, Hava ve Deniz çatışmalarının üçünü de kazan." },
  { id: "conqueror",  icon: "fa-crown",            name: "Fatih",                desc: "Fetih Harekâtı'nın 5 cephesini de tamamla." },
  { id: "collector",  icon: "fa-users-gear",       name: "Koleksiyoncu",         desc: "Tüm liderlerin kilidini aç." },
  { id: "doomsday",   icon: "fa-radiation",        name: "Kıyamet Günü",         desc: "Bir savaşı karşılıklı imha (beraberlik) ile bitir." },
  { id: "tactician",  icon: "fa-chess-knight",     name: "Taktik Dahisi",        desc: "Toplam 10 taktik kartı oyna." },
  { id: "veteran",    icon: "fa-star",             name: "Gazi",                 desc: "Toplam 10 savaş tamamla." },
  { id: "hard_win",   icon: "fa-skull",            name: "Demir Yumruk",         desc: "Zor seviyede bir Hızlı Savaş kazan." }
];

const META_STORAGE_KEY = "gfp_tactical_fronts_meta_v2";

const META = {
  medals: 0,
  unlockedLeaders: [],
  achievements: {},        // { id: timestamp }
  stats: {
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    tacticsPlayed: 0,
    campaignBest: 0        // temizlenen en yüksek cephe sayısı (0-5)
  },
  // Online Sıralı profili (asenkron PvP) — kimlik + Elo. Auth yok, localStorage tabanlı.
  online: {
    id: null,              // rastgele üretilen kalıcı oyuncu kimliği
    name: '',              // görünen ad
    iso: 'tr',             // bayrak/ülke kimliği (countries.js iso)
    rating: 1000,          // Elo
    wins: 0,
    losses: 0
  },
  muted: false,
  // Ayarlar
  volume: 0.8,
  bloom: true,
  shadows: true,
  lang: 'tr',        // 'tr' | 'en'
  tutorialDone: false
};

// Kısa, çakışma olasılığı düşük oyuncu kimliği üret.
function genPlayerId() {
  const rnd = Math.random().toString(36).slice(2, 10);
  return 'p_' + Date.now().toString(36) + rnd;
}

// Online profili döndürür; ilk çağrıda kimlik üretip kaydeder.
function getProfile() {
  if (!META.online.id) {
    META.online.id = genPlayerId();
    saveMeta();
  }
  return META.online;
}

// Maç sonrası rating/istatistik uygula ve kaydet.
function applyRating(newRating, won) {
  META.online.rating = Math.max(0, Math.round(newRating));
  if (won) META.online.wins++; else META.online.losses++;
  saveMeta();
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      META.medals = saved.medals || 0;
      META.unlockedLeaders = saved.unlockedLeaders || [];
      META.achievements = saved.achievements || {};
      META.stats = Object.assign(META.stats, saved.stats || {});
      META.online = Object.assign(META.online, saved.online || {});
      META.muted = !!saved.muted;
      if (saved.volume != null) META.volume = saved.volume;
      if (saved.bloom != null) META.bloom = !!saved.bloom;
      if (saved.shadows != null) META.shadows = !!saved.shadows;
      if (saved.lang) META.lang = saved.lang;
      META.tutorialDone = !!saved.tutorialDone;
    }
  } catch (e) {
    console.warn("Meta verisi okunamadı, sıfırdan başlanıyor.", e);
  }
}

function saveMeta() {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(META));
  } catch (e) {
    console.warn("Meta verisi kaydedilemedi.", e);
  }
}

function isLeaderUnlocked(leader) {
  return !leader.isLocked || META.unlockedLeaders.includes(leader.id);
}

function addMedals(amount) {
  META.medals = Math.max(0, META.medals + amount);
  saveMeta();
  document.querySelectorAll(".medal-count").forEach(el => {
    el.innerText = META.medals;
  });
}

function hasAchievement(id) {
  return !!META.achievements[id];
}

// Toast göstererek başarım açar. UI tarafındaki showAchievementToast app.js'de tanımlıdır.
function unlockAchievement(id) {
  if (hasAchievement(id)) return false;
  const def = ACHIEVEMENTS_DB.find(a => a.id === id);
  if (!def) return false;

  META.achievements[id] = Date.now();
  saveMeta();

  if (typeof showAchievementToast === "function") {
    showAchievementToast(def);
  }
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { META, ACHIEVEMENTS_DB, loadMeta, saveMeta };
}
