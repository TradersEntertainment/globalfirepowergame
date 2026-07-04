// Global Firepower: Tactical Fronts - Game Logic (V2.0 "Steam Edition")

// ==========================================================================
// State
// ==========================================================================
let playerHP = 100;
let aiHP = 100;
let aiMaxHP = 100;
let deck = [];
let playerHand = [];
let aiHand = [];
let round = 1;
let gameState = 'menu'; // 'menu', 'leader_selection', 'planning', 'battle', 'gameover'

let gameMode = 'quick';       // 'quick' | 'campaign'
let difficulty = 'normal';    // 'easy' | 'normal' | 'hard'

// Leaders State
let playerLeader = null;
let aiLeader = null;
let pendingUnlockLeader = null;

// Tactics State
let playerTactics = [];
let aiTactics = [];
let selectedTacticIdx = null;
let tacticPlayedThisTurn = false;
let reconActive = false;
let empActive = false; // rakip lider pasifi bu tur devre dışı

// Campaign State
let campaignStage = 0; // 1-5 arası aktifken
let campaignPerks = {
  powerBonus: { land: 0, air: 0, sea: 0 },
  medicHeal: 0
};

// Battle tracking (başarımlar için)
let playerFrontWinsThisBattle = 0;

// Unique Card ID generator
let cardInstanceCounter = 0;

// Active board slots
const board = {
  player: { land: null, air: null, sea: null },
  ai: { land: null, air: null, sea: null }
};

let selectedHandCardIdx = null;

const MAX_TACTICS = 4;

// ==========================================================================
// Campaign Data - 5 düşman komutanı
// ==========================================================================
const CAMPAIGN_STAGES = [
  {
    name: "Teğmen Marko",
    flag: "🎖️",
    title: "Sınır Karakolu",
    desc: "Acemi bir komutan. Isınma turu.",
    leader: { id: "c1", name: "Teğmen Marko", flag: "🎖️", title: "Sınır Karakolu", desc: "Özel yeteneği yok.", abilityType: "none", abilityVal: 0 },
    hp: 100, aiPowerBonus: 0, aiDifficulty: 'easy', aiTacticCount: 0, reward: 30
  },
  {
    name: "General Volkov",
    flag: "🐻",
    title: "Çelik Yumruk",
    desc: "Kara birliklerini ezmeye programlı sert bir stratejist.",
    leader: { id: "c2", name: "General Volkov", flag: "🐻", title: "Çelik Yumruk", desc: "Rakip Kara birimini -8 zayıflatır.", abilityType: "land_debuff", abilityVal: 8 },
    hp: 100, aiPowerBonus: 2, aiDifficulty: 'normal', aiTacticCount: 1, reward: 30
  },
  {
    name: "Amiral Zheng",
    flag: "⚓",
    title: "Okyanus Hakimi",
    desc: "Filosu yaralarını hızla sarar. Uzun savaşta tehlikelidir.",
    leader: { id: "c3", name: "Amiral Zheng", flag: "⚓", title: "Okyanus Hakimi", desc: "Her tur sonu +5 HP yeniler.", abilityType: "heal_round_end", abilityVal: 5 },
    hp: 110, aiPowerBonus: 3, aiDifficulty: 'normal', aiTacticCount: 1, reward: 30
  },
  {
    name: "Mareşal Steiner",
    flag: "🦅",
    title: "Gök Kartalı",
    desc: "Hava üstünlüğü doktrini. Gökyüzünü ona bırakma.",
    leader: { id: "c4", name: "Mareşal Steiner", flag: "🦅", title: "Gök Kartalı", desc: "Hava birimlerine +7 Güç verir.", abilityType: "air_buff", abilityVal: 7 },
    hp: 120, aiPowerBonus: 5, aiDifficulty: 'hard', aiTacticCount: 2, reward: 30
  },
  {
    name: "Yüksek Komutan NEXUS",
    flag: "☢️",
    title: "Kıyamet Protokolü",
    desc: "Son savunma hattı. Nükleer seçenekleri masada tutar.",
    leader: { id: "c5", name: "Yüksek Komutan NEXUS", flag: "☢️", title: "Kıyamet Protokolü", desc: "Her 3 turda en güçlü birimini yarıya indirir.", abilityType: "nuke_debuff", abilityVal: 0.5 },
    hp: 140, aiPowerBonus: 8, aiDifficulty: 'hard', aiTacticCount: 2, reward: 60
  }
];

const PERK_POOL = [
  { id: "repair",    icon: "fa-screwdriver-wrench", name: "ACİL ONARIM",     desc: "Komuta merkezi onarılır: anında +35 HP." },
  { id: "land_re",   icon: "fa-trowel-bricks",      name: "ZIRHLI TAKVİYE",  desc: "Harekât boyunca yerleştirilen Kara birimlerine +4 Güç." },
  { id: "air_re",    icon: "fa-jet-fighter",        name: "FİLO TAKVİYESİ",  desc: "Harekât boyunca yerleştirilen Hava birimlerine +4 Güç." },
  { id: "sea_re",    icon: "fa-ship",               name: "DONANMA TAKVİYESİ", desc: "Harekât boyunca yerleştirilen Deniz birimlerine +4 Güç." },
  { id: "tactics2",  icon: "fa-chess-knight",       name: "HARP AKADEMİSİ",  desc: "Anında 2 taktik kartı kazanırsın." },
  { id: "medic",     icon: "fa-truck-medical",      name: "SEYYAR HASTANE",  desc: "Harekât boyunca her tur sonunda +3 HP yenilenir." }
];

// ==========================================================================
// DOM Elements
// ==========================================================================
const gameContainer = document.querySelector('.game-container');
const aiHpBar = document.getElementById('ai-hp-bar');
const aiHpVal = document.getElementById('ai-hp-val');
const aiHpMaxEl = document.getElementById('ai-hp-max');
const playerHpBar = document.getElementById('player-hp-bar');
const playerHpVal = document.getElementById('player-hp-val');
const aiNameEl = document.getElementById('ai-name');

const playerHandEl = document.getElementById('player-hand');
const roundCounter = document.getElementById('round-counter');
const btnBattle = document.getElementById('btn-battle');
const btnRestart = document.getElementById('btn-restart');
const btnMainMenu = document.getElementById('btn-main-menu');
const btnSound = document.getElementById('btn-sound');
const combatLog = document.getElementById('combat-log');
const deckPile = document.getElementById('deck-pile');
const tacticsBar = document.getElementById('tactics-bar');

// Overlays
const mainMenuOverlay = document.getElementById('main-menu-overlay');
const leaderSelectionOverlay = document.getElementById('leader-selection-overlay');
const leadersGrid = document.getElementById('leaders-grid');
const purchaseOverlay = document.getElementById('purchase-overlay');
const btnCancelBuy = document.getElementById('btn-cancel-buy');
const btnConfirmBuy = document.getElementById('btn-confirm-buy');
const purchasePriceTag = document.getElementById('purchase-price-tag');
const purchaseText = document.getElementById('purchase-text');
const achievementsOverlay = document.getElementById('achievements-overlay');
const achievementsGrid = document.getElementById('achievements-grid');
const perkOverlay = document.getElementById('perk-overlay');
const perkGrid = document.getElementById('perk-grid');
const perkTitle = document.getElementById('perk-title');
const perkSub = document.getElementById('perk-sub');
const toastContainer = document.getElementById('toast-container');

const playerLeaderDisplay = document.getElementById('player-leader-display');
const aiLeaderDisplay = document.getElementById('ai-leader-display');

const campaignIndicator = document.getElementById('campaign-indicator');
const campaignStageNum = document.getElementById('campaign-stage-num');

// Slot Containers
const playerSlots = {
  land: document.getElementById('player-card-land'),
  air: document.getElementById('player-card-air'),
  sea: document.getElementById('player-card-sea')
};

const aiSlots = {
  land: document.getElementById('ai-card-land'),
  air: document.getElementById('ai-card-air'),
  sea: document.getElementById('ai-card-sea')
};

// Modals
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMsg = document.getElementById('game-over-msg');
const gameOverIcon = document.getElementById('game-over-icon');
const statRounds = document.getElementById('stat-rounds');
const statHp = document.getElementById('stat-hp');
const statMedalsEarned = document.getElementById('stat-medals-earned');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnGoMenu = document.getElementById('btn-go-menu');

// ==========================================================================
// Helpers
// ==========================================================================
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function writeLog(text, type = 'system') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `[TUR ${round}] ${text}`;
  combatLog.appendChild(entry);
  combatLog.scrollTop = combatLog.scrollHeight;
}

function getHandLimit(owner) {
  const leader = owner === 'player' ? playerLeader : aiLeader;
  if (leader && leader.abilityType === 'hand_size') return leader.abilityVal;
  return 5;
}

function isLeaderActive(owner) {
  // EMP oynandıysa AI liderinin pasifi bu tur devre dışıdır
  if (owner === 'ai' && empActive) return false;
  return true;
}

// ==========================================================================
// Visual Effects Engine (Particles, Shake, Damage Numbers)
// ==========================================================================
function triggerScreenShake() {
  gameContainer.classList.add('screen-shake');
  setTimeout(() => {
    gameContainer.classList.remove('screen-shake');
  }, 350);
}

function spawnFloatingDmg(x, y, text, isHeal = false, isText = false) {
  const dmgEl = document.createElement('div');
  dmgEl.className = 'floating-dmg';
  if (isHeal) dmgEl.classList.add('heal');
  if (isText) dmgEl.classList.add('text');
  dmgEl.innerText = text;
  dmgEl.style.left = `${x}px`;
  dmgEl.style.top = `${y}px`;
  document.body.appendChild(dmgEl);
  setTimeout(() => dmgEl.remove(), 900);
}

function spawnClashParticles(x, y, colorType = 'cyan') {
  const count = 15;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = `clash-particle ${colorType === 'gold' ? 'gold' : colorType === 'red' ? 'red' : ''}`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 80;
    p.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    p.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function spawnClashRing(x, y) {
  const ring = document.createElement('div');
  ring.className = 'clash-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 500);
}

// ==========================================================================
// Achievement Toasts
// ==========================================================================
function showAchievementToast(def) {
  sfx('achievement');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i class="fa-solid ${def.icon} toast-icon"></i>
    <div>
      <div class="toast-label">Başarım Açıldı</div>
      <div class="toast-title">${def.name}</div>
      <div class="toast-desc">${def.desc}</div>
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4600);
}

// ==========================================================================
// Card Draw Animations
// ==========================================================================
async function animateCardDraw(isPlayer, card) {
  const deckRect = deckPile.getBoundingClientRect();

  const flyer = document.createElement('div');
  flyer.className = 'flying-card';
  flyer.innerHTML = `<i class="fa-solid fa-layer-group"></i>`;
  flyer.style.left = `${deckRect.left}px`;
  flyer.style.top = `${deckRect.top}px`;
  flyer.style.transform = 'scale(0.8) rotate(3deg)';
  document.body.appendChild(flyer);

  sfx('draw');

  if (isPlayer) {
    playerHand.push(card);
    renderHand();

    const handCards = playerHandEl.querySelectorAll('.card');
    const targetCardEl = handCards[handCards.length - 1];

    if (targetCardEl) {
      targetCardEl.style.opacity = '0';
      targetCardEl.style.transform = 'translateY(20px)';

      const targetRect = targetCardEl.getBoundingClientRect();
      flyer.getBoundingClientRect();
      flyer.style.left = `${targetRect.left}px`;
      flyer.style.top = `${targetRect.top}px`;
      flyer.style.transform = 'scale(1) rotate(0deg)';

      await delay(600);

      flyer.remove();
      targetCardEl.style.opacity = '1';
      targetCardEl.style.transform = '';
      targetCardEl.style.transition = 'var(--transition-smooth)';
    } else {
      flyer.remove();
    }
  } else {
    aiHand.push(card);
    const aiAvatarEl = document.querySelector('.ai-avatar');
    const targetRect = aiAvatarEl.getBoundingClientRect();

    flyer.getBoundingClientRect();
    flyer.style.left = `${targetRect.left}px`;
    flyer.style.top = `${targetRect.top}px`;
    flyer.style.transform = 'scale(0.3) rotate(-15deg)';
    flyer.style.opacity = '0.3';

    await delay(600);
    flyer.remove();
  }
}

async function fillHandsAnimated() {
  const drawDelay = 160;
  const pLimit = getHandLimit('player');
  const aLimit = getHandLimit('ai');

  const maxNeeds = Math.max(pLimit - playerHand.length, aLimit - aiHand.length);

  for (let i = 0; i < maxNeeds; i++) {
    if (playerHand.length < pLimit) {
      await animateCardDraw(true, getNextDeckCard());
      await delay(drawDelay);
    }
    if (aiHand.length < aLimit) {
      await animateCardDraw(false, getNextDeckCard());
      await delay(drawDelay);
    }
  }
}

function getNextDeckCard() {
  if (deck.length === 0) {
    writeLog("Deste bitti. Kartlar karıştırılarak yeni deste oluşturuluyor...", 'system');
    initDeck();
  }
  const rawCard = deck.pop();
  return {
    ...rawCard,
    instanceId: ++cardInstanceCounter,
    currentPower: {
      land: rawCard.land,
      air: rawCard.air,
      sea: rawCard.sea
    }
  };
}

function initDeck() {
  deck = JSON.parse(JSON.stringify(COUNTRIES_DB));
  shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ==========================================================================
// Main Menu & Navigation
// ==========================================================================
function refreshMenuStats() {
  document.querySelectorAll('.medal-count').forEach(el => el.innerText = META.medals);
  document.getElementById('menu-wins').innerText = META.stats.wins;
  document.getElementById('menu-losses').innerText = META.stats.losses;
  document.getElementById('campaign-best').innerText = META.stats.campaignBest;
  document.getElementById('ach-count').innerText = Object.keys(META.achievements).length;
  document.getElementById('ach-total').innerText = ACHIEVEMENTS_DB.length;

  // Kampanya ilerleme çizgisi
  const nodes = document.querySelectorAll('#campaign-track .track-node');
  nodes.forEach((node, idx) => {
    node.classList.toggle('cleared', idx < META.stats.campaignBest);
  });

  updateSoundButtons();
}

function showMainMenu() {
  gameState = 'menu';
  campaignStage = 0;
  refreshMenuStats();
  mainMenuOverlay.classList.remove('hidden');
  leaderSelectionOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  perkOverlay.classList.add('hidden');
  achievementsOverlay.classList.add('hidden');
  campaignIndicator.classList.add('hidden');
}

function openLeaderSelection() {
  gameState = 'leader_selection';
  mainMenuOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  renderLeaderSelection();
  leaderSelectionOverlay.classList.remove('hidden');
}

function updateSoundButtons() {
  const iconClass = META.muted ? 'fa-volume-xmark' : 'fa-volume-high';
  btnSound.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
  const menuSoundBtn = document.getElementById('btn-menu-sound');
  menuSoundBtn.innerHTML = `<i class="fa-solid ${iconClass}"></i> Ses: <span id="sound-state">${META.muted ? 'Kapalı' : 'Açık'}</span>`;
}

function toggleSound() {
  META.muted = !META.muted;
  saveMeta();
  updateSoundButtons();
  if (!META.muted) sfx('click');
}

// ==========================================================================
// Achievements Screen
// ==========================================================================
function renderAchievements() {
  achievementsGrid.innerHTML = '';
  ACHIEVEMENTS_DB.forEach(ach => {
    const unlocked = hasAchievement(ach.id);
    const card = document.createElement('div');
    card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <div class="ach-icon"><i class="fa-solid ${unlocked ? ach.icon : 'fa-lock'}"></i></div>
      <div>
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div>
      </div>
    `;
    achievementsGrid.appendChild(card);
  });
}

// ==========================================================================
// Leader Selection & Medal Unlock Store
// ==========================================================================
function renderLeaderSelection() {
  leadersGrid.innerHTML = '';

  LEADERS_DB.forEach(leader => {
    const unlocked = isLeaderUnlocked(leader);
    const card = document.createElement('div');
    card.className = `leader-card ${unlocked ? '' : 'locked'}`;

    card.innerHTML = `
      ${!unlocked ? `
        <div class="lock-badge">
          <i class="fa-solid fa-medal"></i> ${leader.cost}
        </div>
      ` : ''}
      <div class="leader-profile">
        <div class="leader-avatar-img">${leader.flag}</div>
        <div class="leader-name-group">
          <span class="leader-card-name">${leader.name}</span>
          <span class="leader-card-title">${leader.title}</span>
        </div>
      </div>
      <div class="leader-desc">
        ${leader.desc}
      </div>
      <button class="btn ${unlocked ? 'btn-primary' : 'btn-secondary'} leader-action-btn">
        ${unlocked ? 'Seç' : `<i class="fa-solid fa-medal"></i> ${leader.cost} Madalya ile Aç`}
      </button>
    `;

    card.addEventListener('click', () => {
      sfx('click');
      if (!isLeaderUnlocked(leader)) {
        openPurchaseModal(leader);
      } else {
        selectPlayerLeader(leader);
      }
    });

    leadersGrid.appendChild(card);
  });
}

function openPurchaseModal(leader) {
  pendingUnlockLeader = leader;
  purchasePriceTag.innerText = leader.cost;
  purchaseText.innerText = `${leader.name} (${leader.title}) komutan kadrona katılmak istiyor. Savaşlarda kazandığın Şeref Madalyalarını harcayarak kilidini açabilirsin.`;

  const affordable = META.medals >= leader.cost;
  btnConfirmBuy.classList.toggle('insufficient', !affordable);
  btnConfirmBuy.innerHTML = affordable
    ? '<i class="fa-solid fa-unlock"></i> Kilidi Aç'
    : '<i class="fa-solid fa-lock"></i> Yetersiz Madalya';

  document.querySelectorAll('.medal-count').forEach(el => el.innerText = META.medals);
  purchaseOverlay.classList.remove('hidden');
}

btnCancelBuy.addEventListener('click', () => {
  sfx('click');
  purchaseOverlay.classList.add('hidden');
  pendingUnlockLeader = null;
});

btnConfirmBuy.addEventListener('click', () => {
  if (!pendingUnlockLeader) return;
  if (META.medals < pendingUnlockLeader.cost) {
    sfx('damage');
    return;
  }

  addMedals(-pendingUnlockLeader.cost);
  META.unlockedLeaders.push(pendingUnlockLeader.id);
  saveMeta();

  sfx('medal');
  writeLog(`Komuta Merkezi: ${pendingUnlockLeader.name} kadroya katıldı!`, 'ability');
  purchaseOverlay.classList.add('hidden');

  const rect = btnConfirmBuy.getBoundingClientRect();
  spawnClashParticles(rect.left + rect.width / 2, rect.top, 'gold');

  // Koleksiyoncu başarımı: tüm liderler açıldı mı?
  if (LEADERS_DB.every(l => isLeaderUnlocked(l))) {
    unlockAchievement('collector');
  }

  pendingUnlockLeader = null;
  renderLeaderSelection();
});

function selectPlayerLeader(leader) {
  playerLeader = leader;
  leaderSelectionOverlay.classList.add('hidden');

  if (gameMode === 'campaign') {
    startCampaignStage(1);
    return;
  }

  // Hızlı Savaş: rastgele AI lideri (açık olanlardan)
  const availableLeaders = LEADERS_DB.filter(l => isLeaderUnlocked(l));
  aiLeader = availableLeaders[Math.floor(Math.random() * availableLeaders.length)];
  aiNameEl.innerText = `Yapay Zeka (${difficulty === 'easy' ? 'Kolay' : difficulty === 'hard' ? 'Zor' : 'Normal'})`;
  aiMaxHP = 100;

  updateLeaderDisplays();
  writeLog(`Komutan ${playerLeader.name} liderliğini seçti! (${playerLeader.title})`, 'player');
  writeLog(`Yapay Zeka ${aiLeader.name} liderliğini seçti! (${aiLeader.title})`, 'ai');

  gameState = 'planning';
  resetMatch();
}

function updateLeaderDisplays() {
  playerLeaderDisplay.innerHTML = `
    <span>${playerLeader.flag} ${playerLeader.name}</span>
    <span class="sub-title" style="font-size:0.6rem; display:block; color:var(--color-warning);" title="${playerLeader.desc}">
      <i class="fa-solid fa-bolt"></i> ${playerLeader.title}
    </span>
  `;

  aiLeaderDisplay.innerHTML = `
    <span>${aiLeader.flag} ${aiLeader.name}</span>
    <span class="sub-title" style="font-size:0.6rem; display:block; color:var(--color-warning);" title="${aiLeader.desc}">
      <i class="fa-solid fa-bolt"></i> ${aiLeader.title}
    </span>
  `;
}

// ==========================================================================
// Campaign Flow
// ==========================================================================
function startCampaign() {
  gameMode = 'campaign';
  campaignStage = 0;
  campaignPerks = { powerBonus: { land: 0, air: 0, sea: 0 }, medicHeal: 0 };
  playerHP = 100;
  openLeaderSelection();
}

function startCampaignStage(stageNum) {
  campaignStage = stageNum;
  const stage = CAMPAIGN_STAGES[stageNum - 1];

  // Cepheler arası otomatik saha onarımı
  if (stageNum > 1) {
    playerHP = Math.min(100, playerHP + 20);
  }

  aiLeader = stage.leader;
  difficulty = stage.aiDifficulty;
  aiMaxHP = stage.hp;
  aiNameEl.innerText = `${stage.flag} ${stage.name}`;

  campaignIndicator.classList.remove('hidden');
  campaignStageNum.innerText = stageNum;
  aiHpMaxEl.innerText = aiMaxHP;

  updateLeaderDisplays();

  gameState = 'planning';
  resetMatch({ keepPlayerHP: stageNum > 1, aiTacticCount: stage.aiTacticCount });

  writeLog(`━━━ CEPHE ${stageNum}/5: ${stage.name} (${stage.title}) ━━━`, 'ability');
  writeLog(stage.desc, 'system');
}

function getRandomPerks(count) {
  const pool = [...PERK_POOL];
  shuffle(pool);
  return pool.slice(0, count);
}

function showPerkSelection() {
  const clearedStage = CAMPAIGN_STAGES[campaignStage - 1];
  perkTitle.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> CEPHE ${campaignStage} DÜŞTÜ!`;
  perkSub.innerText = `${clearedStage.name} mağlup edildi (+${clearedStage.reward} madalya). Bir sonraki cepheye geçmeden önce harekât desteğini seç:`;

  perkGrid.innerHTML = '';
  getRandomPerks(3).forEach(perk => {
    const card = document.createElement('div');
    card.className = 'perk-card';
    card.innerHTML = `
      <i class="fa-solid ${perk.icon} perk-icon"></i>
      <div class="perk-name">${perk.name}</div>
      <div class="perk-desc">${perk.desc}</div>
    `;
    card.addEventListener('click', () => {
      sfx('medal');
      applyPerk(perk);
      perkOverlay.classList.add('hidden');
      startCampaignStage(campaignStage + 1);
    });
    perkGrid.appendChild(card);
  });

  perkOverlay.classList.remove('hidden');
}

function applyPerk(perk) {
  switch (perk.id) {
    case 'repair':
      playerHP = Math.min(100, playerHP + 35);
      break;
    case 'land_re':
      campaignPerks.powerBonus.land += 4;
      break;
    case 'air_re':
      campaignPerks.powerBonus.air += 4;
      break;
    case 'sea_re':
      campaignPerks.powerBonus.sea += 4;
      break;
    case 'tactics2':
      grantTactic('player');
      grantTactic('player');
      break;
    case 'medic':
      campaignPerks.medicHeal += 3;
      break;
  }
  writeLog(`Harekât desteği alındı: ${perk.name}`, 'ability');
}

// ==========================================================================
// Tactics System
// ==========================================================================
function randomTactic(aiOnly = false) {
  const pool = aiOnly ? TACTICS_DB.filter(t => t.aiUsable) : TACTICS_DB;
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

function grantTactic(owner) {
  if (owner === 'player') {
    if (playerTactics.length >= MAX_TACTICS) return;
    playerTactics.push(randomTactic());
    renderTactics();
  } else {
    if (aiTactics.length >= MAX_TACTICS) return;
    aiTactics.push(randomTactic(true));
  }
}

function renderTactics() {
  tacticsBar.innerHTML = '';

  if (playerTactics.length === 0) {
    tacticsBar.innerHTML = '<span class="tactics-empty">Taktik kartın yok. Her 3 turda bir yenisi gelir.</span>';
    return;
  }

  playerTactics.forEach((tactic, idx) => {
    const el = document.createElement('div');
    el.className = 'tactic-card';
    if (selectedTacticIdx === idx) el.classList.add('armed');
    if (tacticPlayedThisTurn || gameState !== 'planning') el.classList.add('disabled');
    el.title = tactic.desc;
    el.innerHTML = `<i class="fa-solid ${tactic.icon}"></i> ${tactic.name}`;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (gameState !== 'planning' || tacticPlayedThisTurn) return;
      sfx('click');

      if (selectedTacticIdx === idx) {
        selectedTacticIdx = null;
        clearTacticTargets();
        renderTactics();
        return;
      }

      selectedTacticIdx = idx;
      selectedHandCardIdx = null;
      renderHand();
      highlightActiveSlots();
      renderTactics();

      if (tactic.target === 'none') {
        playInstantTactic(idx);
      } else {
        armTacticTargets(tactic);
      }
    });

    tacticsBar.appendChild(el);
  });
}

function armTacticTargets(tactic) {
  clearTacticTargets();
  const side = tactic.target === 'enemy' ? 'ai' : 'player';
  ['land', 'air', 'sea'].forEach(front => {
    if (board[side][front]) {
      document.getElementById(`${side}-slot-${front}`).classList.add('tactic-target');
    }
  });
}

function clearTacticTargets() {
  document.querySelectorAll('.tactic-target').forEach(el => el.classList.remove('tactic-target'));
}

function consumeTactic(idx) {
  playerTactics.splice(idx, 1);
  selectedTacticIdx = null;
  tacticPlayedThisTurn = true;
  META.stats.tacticsPlayed++;
  saveMeta();
  if (META.stats.tacticsPlayed >= 10) unlockAchievement('tactician');
  clearTacticTargets();
  renderTactics();
}

function playInstantTactic(idx) {
  const tactic = playerTactics[idx];
  sfx('tactic');

  switch (tactic.id) {
    case 'recon': {
      reconActive = true;
      writeLog(`🛰 Keşif Uydusu aktif: Düşman kartları bu tur boyunca görünür!`, 'ability');
      renderBoard();
      break;
    }
    case 'hospital': {
      playerHP = Math.min(100, playerHP + tactic.val);
      updateHpDisplay();
      sfx('heal');
      writeLog(`⛑ Sahra Hastanesi kuruldu: +${tactic.val} HP iyileştirildi.`, 'ability');
      const rect = playerHpBar.getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top - 30, `+${tactic.val} HP`, true);
      break;
    }
    case 'mobilize': {
      writeLog(`📦 Seferberlik ilan edildi: 2 ek kart çekiliyor...`, 'ability');
      (async () => {
        for (let i = 0; i < tactic.val; i++) {
          if (playerHand.length >= 8) break;
          await animateCardDraw(true, getNextDeckCard());
        }
      })();
      break;
    }
    case 'emp': {
      empActive = true;
      writeLog(`⚡ EMP Saldırısı: ${aiLeader.name} liderinin pasifi bu turki savaşta devre dışı!`, 'ability');
      const aiRect = document.querySelector('.ai-avatar').getBoundingClientRect();
      spawnClashParticles(aiRect.left + 22, aiRect.top + 22, 'cyan');
      spawnFloatingDmg(aiRect.left + 22, aiRect.top - 10, 'EMP!', false, true);
      break;
    }
  }

  consumeTactic(idx);
}

function playTargetedTactic(idx, side, front) {
  const tactic = playerTactics[idx];
  const card = board[side][front];
  if (!card) return;

  sfx('tactic');
  const slot = document.getElementById(`${side}-slot-${front}`);
  const rect = slot.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  if (tactic.id === 'airstrike') {
    card.currentPower[front] = Math.max(0, card.currentPower[front] - tactic.val);
    writeLog(`🚀 Hava Harekâtı: Düşmanın ${front === 'land' ? 'Kara' : front === 'air' ? 'Hava' : 'Deniz'} birimi -${tactic.val} güç kaybetti!`, 'ability');
    spawnClashRing(cx, cy);
    spawnClashParticles(cx, cy, 'red');
    spawnFloatingDmg(cx, cy, `-${tactic.val} GÜÇ`);
    sfx('explosion');
    triggerScreenShake();

    // Güç sıfırlandıysa birim imha olur
    if (card.currentPower[front] <= 0) {
      writeLog(`Düşman birimi ${card.flag} ${card.name} hava harekâtıyla imha edildi!`, 'player');
      destroyUnit('ai', front, card);
    }
  } else if (tactic.id === 'fortify') {
    card.currentPower[front] += tactic.val;
    writeLog(`🛡 İstihkam: ${card.flag} ${card.name} +${tactic.val} güç kazandı!`, 'ability');
    spawnFloatingDmg(cx, cy, `+${tactic.val} GÜÇ`, true);
    spawnClashParticles(cx, cy, 'gold');
  }

  consumeTactic(idx);
  renderBoard();
}

// AI taktik kullanımı (savaş başlangıcında, basit sezgisel kurallar)
function aiUseTactics() {
  if (aiTactics.length === 0) return;

  // Tur başına en fazla 1 taktik
  for (let i = 0; i < aiTactics.length; i++) {
    const tactic = aiTactics[i];

    if (tactic.id === 'hospital' && aiHP <= aiMaxHP - tactic.val && aiHP < 65) {
      aiHP = Math.min(aiMaxHP, aiHP + tactic.val);
      updateHpDisplay();
      writeLog(`Düşman Sahra Hastanesi kurdu: +${tactic.val} HP iyileşti.`, 'ai');
      aiTactics.splice(i, 1);
      return;
    }

    if (tactic.id === 'airstrike') {
      // Oyuncunun en güçlü birimini vur
      let bestFront = null, bestPower = 14; // ancak değecek bir hedef varsa kullan
      ['land', 'air', 'sea'].forEach(front => {
        const c = board.player[front];
        if (c && c.currentPower[front] > bestPower) {
          bestPower = c.currentPower[front];
          bestFront = front;
        }
      });
      if (bestFront) {
        const target = board.player[bestFront];
        target.currentPower[bestFront] = Math.max(0, target.currentPower[bestFront] - tactic.val);
        writeLog(`Düşman Hava Harekâtı düzenledi: ${target.flag} ${target.name} -${tactic.val} güç!`, 'ai');
        const slot = document.getElementById(`player-slot-${bestFront}`);
        const rect = slot.getBoundingClientRect();
        spawnClashRing(rect.left + rect.width / 2, rect.top + rect.height / 2);
        spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'red');
        sfx('explosion');
        if (target.currentPower[bestFront] <= 0) {
          writeLog(`${target.flag} ${target.name} hava harekâtıyla imha edildi!`, 'ai');
          destroyUnit('player', bestFront, target);
        }
        aiTactics.splice(i, 1);
        return;
      }
    }

    if (tactic.id === 'fortify') {
      // En güçlü kendi birimini güçlendir
      let bestFront = null, bestPower = -1;
      ['land', 'air', 'sea'].forEach(front => {
        const c = board.ai[front];
        if (c && c.currentPower[front] > bestPower) {
          bestPower = c.currentPower[front];
          bestFront = front;
        }
      });
      if (bestFront) {
        board.ai[bestFront].currentPower[bestFront] += tactic.val;
        writeLog(`Düşman cephesini tahkim etti: +${tactic.val} güç.`, 'ai');
        aiTactics.splice(i, 1);
        return;
      }
    }
  }
}

// ==========================================================================
// Board & Hand Rendering
// ==========================================================================
function getCardHTML(card, frontType = null) {
  const isLandlocked = card.sea === 0;

  const landHighlight = frontType === 'land' ? 'land-highlight' : '';
  const airHighlight = frontType === 'air' ? 'air-highlight' : '';
  const seaHighlight = frontType === 'sea' ? 'sea-highlight' : '';

  return `
    <div class="card-header">
      <div class="card-title-group">
        <span class="card-flag">${card.flag}</span>
        <span class="card-name" title="${card.name}">${card.name}</span>
      </div>
      <span class="card-rank">#${card.rank}</span>
    </div>
    <div class="card-stats">
      <div class="stat-row land-row ${landHighlight}">
        <span><i class="fa-solid fa-trowel-bricks"></i> Kara</span>
        <span class="stat-val">${card.currentPower.land}</span>
      </div>
      <div class="stat-row air-row ${airHighlight}">
        <span><i class="fa-solid fa-jet-fighter"></i> Hava</span>
        <span class="stat-val">${card.currentPower.air}</span>
      </div>
      <div class="stat-row sea-row ${seaHighlight}">
        <span><i class="fa-solid fa-ship"></i> Deniz</span>
        <span class="stat-val ${isLandlocked ? 'text-danger' : ''}">${card.currentPower.sea}</span>
      </div>
    </div>
    <div class="sub-title" style="font-size: 0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${card.desc}">
      ${card.desc}
    </div>
  `;
}

function renderHand() {
  playerHandEl.innerHTML = '';
  playerHand.forEach((card, idx) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    if (selectedHandCardIdx === idx) {
      cardEl.classList.add('selected');
    }
    cardEl.innerHTML = getCardHTML(card);

    cardEl.addEventListener('click', () => {
      if (gameState !== 'planning') return;
      sfx('click');

      // Kart seçimi taktik hedeflemesini iptal eder
      selectedTacticIdx = null;
      clearTacticTargets();
      renderTactics();

      selectedHandCardIdx = selectedHandCardIdx === idx ? null : idx;
      renderHand();
      highlightActiveSlots();
    });

    playerHandEl.appendChild(cardEl);
  });
}

function highlightActiveSlots() {
  Object.keys(playerSlots).forEach(front => {
    const slot = document.getElementById(`player-slot-${front}`);
    slot.classList.toggle('slot-highlight', selectedHandCardIdx !== null);
  });
}

function getEmptySlotHTML(front) {
  let icon = 'fa-trowel-bricks';
  if (front === 'air') icon = 'fa-jet-fighter';
  if (front === 'sea') icon = 'fa-ship';

  return `
    <div class="empty-slot-msg">
      <i class="fa-solid ${icon}"></i>
      <span>BOŞ CEPHE</span>
    </div>
  `;
}

function renderBoard() {
  // Player Slots
  Object.keys(board.player).forEach(front => {
    const container = playerSlots[front];
    const slotParent = document.getElementById(`player-slot-${front}`);
    const card = board.player[front];

    container.innerHTML = '';

    if (card) {
      slotParent.classList.remove('empty-warning');
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.innerHTML = getCardHTML(card, front);

      cardEl.addEventListener('click', (e) => {
        if (gameState !== 'planning') return;
        e.stopPropagation();

        // Hedefli taktik bu karta mı oynanıyor?
        if (selectedTacticIdx !== null && playerTactics[selectedTacticIdx] && playerTactics[selectedTacticIdx].target === 'ally') {
          playTargetedTactic(selectedTacticIdx, 'player', front);
          return;
        }

        sfx('pickup');
        removeDeployModifiers(card, front, 'player');

        playerHand.push(card);
        board.player[front] = null;
        selectedHandCardIdx = null;

        renderHand();
        renderBoard();
      });

      container.appendChild(cardEl);
    } else {
      container.innerHTML = getEmptySlotHTML(front);
      slotParent.classList.add('empty-warning');
    }
  });

  // AI Slots
  Object.keys(board.ai).forEach(front => {
    const container = aiSlots[front];
    const slotParent = document.getElementById(`ai-slot-${front}`);
    const card = board.ai[front];

    container.innerHTML = '';
    slotParent.classList.remove('empty-warning');

    if (card) {
      const cardEl = document.createElement('div');

      if (gameState === 'planning' && !reconActive) {
        cardEl.className = 'card card-back';
        cardEl.innerHTML = `<i class="fa-solid fa-user-secret"></i>`;
      } else {
        cardEl.className = 'card';
        cardEl.innerHTML = getCardHTML(card, front);
      }
      container.appendChild(cardEl);
    } else {
      container.innerHTML = getEmptySlotHTML(front);
      if (gameState === 'planning') {
        slotParent.classList.add('empty-warning');
      }
    }
  });
}

// ==========================================================================
// Deploy Modifiers: Lider buffları + kampanya perk bonusları + AI güç bonusu
// ==========================================================================
function getDeployBonus(front, owner) {
  let bonus = 0;
  const leader = owner === 'player' ? playerLeader : aiLeader;

  if (leader) {
    if (leader.abilityType === 'land_buff' && front === 'land') bonus += leader.abilityVal;
    if (leader.abilityType === 'air_buff' && front === 'air') bonus += leader.abilityVal;
  }

  if (owner === 'player' && gameMode === 'campaign') {
    bonus += campaignPerks.powerBonus[front];
  }

  if (owner === 'ai' && gameMode === 'campaign' && campaignStage > 0) {
    bonus += CAMPAIGN_STAGES[campaignStage - 1].aiPowerBonus;
  }

  return bonus;
}

function applyDeployModifiers(card, front, owner) {
  const bonus = getDeployBonus(front, owner);
  if (bonus <= 0) return;

  card.currentPower[front] += bonus;

  const leader = owner === 'player' ? playerLeader : aiLeader;
  const isLeaderPart = leader && ((leader.abilityType === 'land_buff' && front === 'land') || (leader.abilityType === 'air_buff' && front === 'air'));
  if (isLeaderPart) {
    writeLog(`${leader.flag} ${leader.name} pasifi etkinleşti: birime destek verildi (+${bonus} toplam)!`, owner === 'player' ? 'player' : 'ai');
  }

  const slot = document.getElementById(`${owner}-slot-${front}`);
  if (slot) {
    const rect = slot.getBoundingClientRect();
    spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `+${bonus} Güç`, true);
  }
}

function removeDeployModifiers(card, front, owner) {
  const bonus = getDeployBonus(front, owner);
  if (bonus <= 0) return;
  card.currentPower[front] = Math.max(0, card.currentPower[front] - bonus);
}

// ==========================================================================
// Slot Click Handling (deploy + tactic targeting)
// ==========================================================================
function handleSlotClick(front) {
  if (gameState !== 'planning') return;

  // Hedefli taktik: kendi cephemize (fortify)
  if (selectedTacticIdx !== null && playerTactics[selectedTacticIdx] && playerTactics[selectedTacticIdx].target === 'ally') {
    if (board.player[front]) {
      playTargetedTactic(selectedTacticIdx, 'player', front);
    }
    return;
  }

  if (selectedHandCardIdx === null) return;

  const selectedCard = playerHand[selectedHandCardIdx];

  const existing = board.player[front];
  if (existing) {
    removeDeployModifiers(existing, front, 'player');
    playerHand.push(existing);
  }

  sfx('deploy');
  board.player[front] = selectedCard;
  applyDeployModifiers(selectedCard, front, 'player');

  playerHand.splice(selectedHandCardIdx, 1);
  selectedHandCardIdx = null;

  renderHand();
  renderBoard();
  highlightActiveSlots();
}

Object.keys(playerSlots).forEach(front => {
  const slot = document.getElementById(`player-slot-${front}`);
  slot.addEventListener('click', () => handleSlotClick(front));
});

// Düşman cephelerine tıklama: sadece hedefli taktik (airstrike) için
Object.keys(aiSlots).forEach(front => {
  const slot = document.getElementById(`ai-slot-${front}`);
  slot.addEventListener('click', () => {
    if (gameState !== 'planning' || selectedTacticIdx === null) return;
    const tactic = playerTactics[selectedTacticIdx];
    if (tactic && tactic.target === 'enemy' && board.ai[front]) {
      playTargetedTactic(selectedTacticIdx, 'ai', front);
    }
  });
});

// ==========================================================================
// HP Display
// ==========================================================================
function updateHpDisplay() {
  playerHP = Math.max(0, Math.min(100, playerHP));
  aiHP = Math.max(0, Math.min(aiMaxHP, aiHP));

  playerHpBar.style.width = `${playerHP}%`;
  playerHpVal.innerText = playerHP;

  aiHpBar.style.width = `${(aiHP / aiMaxHP) * 100}%`;
  aiHpVal.innerText = aiHP;
  aiHpMaxEl.innerText = aiMaxHP;

  playerHpBar.style.backgroundColor = playerHP < 30 ? 'var(--color-danger)' : '';
  aiHpBar.style.backgroundColor = aiHP < aiMaxHP * 0.3 ? 'var(--color-danger)' : '';
}

// ==========================================================================
// AI Turn Logic - Zorluk profilleri
// ==========================================================================
function getAiProfile() {
  switch (difficulty) {
    case 'easy':
      return { random: true, counter: false, redeployThreshold: Infinity, skipChance: 0.25 };
    case 'hard':
      return { random: false, counter: true, redeployThreshold: 8, skipChance: 0 };
    default:
      return { random: false, counter: false, redeployThreshold: 12, skipChance: 0 };
  }
}

function aiPickCandidate(front, profile) {
  let candidates = aiHand
    .map((c, idx) => ({ card: c, idx }))
    .filter(item => !(front === 'sea' && item.card.currentPower.sea <= 0));

  if (candidates.length === 0) return null;

  if (profile.random) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Zor AI: oyuncunun görünen kartını minimum israfla yenmeye çalışır
  if (profile.counter) {
    const playerCard = board.player[front];
    if (playerCard) {
      const deployBonus = getDeployBonus(front, 'ai');
      const beaters = candidates.filter(item =>
        item.card.currentPower[front] + deployBonus > playerCard.currentPower[front]
      );
      if (beaters.length > 0) {
        beaters.sort((a, b) => a.card.currentPower[front] - b.card.currentPower[front]);
        return beaters[0];
      }
    }
  }

  candidates.sort((a, b) => b.card.currentPower[front] - a.card.currentPower[front]);
  return candidates[0];
}

function aiPlayTurn() {
  const fronts = ['land', 'air', 'sea'];
  const profile = getAiProfile();

  fronts.forEach(front => {
    const existing = board.ai[front];

    if (!existing) {
      // Kolay AI bazen cepheyi boş bırakır
      if (profile.skipChance > 0 && Math.random() < profile.skipChance) return;

      const pick = aiPickCandidate(front, profile);
      if (pick) {
        board.ai[front] = pick.card;
        aiHand.splice(pick.idx, 1);
        applyDeployModifiers(pick.card, front, 'ai');
      }
    } else {
      const pick = aiPickCandidate(front, profile);
      if (pick) {
        const currentVal = existing.currentPower[front];
        const candidateVal = pick.card.currentPower[front];
        const playerCard = board.player[front];
        const losing = profile.counter && playerCard && currentVal <= playerCard.currentPower[front];

        if (candidateVal > currentVal + profile.redeployThreshold || (losing && candidateVal + getDeployBonus(front, 'ai') > playerCard.currentPower[front])) {
          removeDeployModifiers(existing, front, 'ai');
          aiHand.push(existing);
          board.ai[front] = pick.card;
          aiHand.splice(aiHand.indexOf(pick.card), 1);
          applyDeployModifiers(pick.card, front, 'ai');
        }
      }
    }
  });

  // AI elini arka planda doldurur
  while (aiHand.length < getHandLimit('ai') && deck.length > 0) {
    aiHand.push(getNextDeckCard());
  }
}

// ==========================================================================
// Leader Abilities (savaş fazı)
// ==========================================================================
function applyLandDebuffs() {
  if (playerLeader && playerLeader.abilityType === 'land_debuff' && isLeaderActive('player')) {
    const aiLand = board.ai.land;
    if (aiLand) {
      aiLand.currentPower.land = Math.max(0, aiLand.currentPower.land - playerLeader.abilityVal);
      writeLog(`${playerLeader.flag} ${playerLeader.name} yeteneği: Düşman Kara birimi kalıcı olarak -${playerLeader.abilityVal} güç kaybetti!`, 'player');

      const rect = document.getElementById('ai-slot-land').getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `-${playerLeader.abilityVal} Güç`);
    }
  }

  if (aiLeader && aiLeader.abilityType === 'land_debuff' && isLeaderActive('ai')) {
    const playerLand = board.player.land;
    if (playerLand) {
      playerLand.currentPower.land = Math.max(0, playerLand.currentPower.land - aiLeader.abilityVal);
      writeLog(`${aiLeader.flag} ${aiLeader.name} yeteneği: Kara biriminiz kalıcı olarak -${aiLeader.abilityVal} güç kaybetti!`, 'ai');

      const rect = document.getElementById('player-slot-land').getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `-${aiLeader.abilityVal} Güç`);
    }
  }
}

function applyNukes() {
  if (round % 3 !== 0) return;

  const tryNuke = (attackerLeader, targetSide, attackerOwner) => {
    if (!attackerLeader || attackerLeader.abilityType !== 'nuke_debuff') return;
    if (!isLeaderActive(attackerOwner)) {
      if (attackerOwner === 'ai') writeLog(`EMP sayesinde ${attackerLeader.name} nükleer pasifi bu tur çalışmadı!`, 'player');
      return;
    }

    let strongestFront = null;
    let maxPower = -1;

    ['land', 'air', 'sea'].forEach(front => {
      const card = board[targetSide][front];
      if (card && card.currentPower[front] > maxPower) {
        maxPower = card.currentPower[front];
        strongestFront = front;
      }
    });

    if (strongestFront) {
      const targetCard = board[targetSide][strongestFront];
      const oldPower = targetCard.currentPower[strongestFront];
      const newPower = Math.ceil(oldPower * attackerLeader.abilityVal);
      targetCard.currentPower[strongestFront] = newPower;
      sfx('nuke');
      writeLog(`${attackerLeader.flag} ${attackerLeader.name} NÜKLEER pasifi: ${targetCard.flag} ${targetCard.name} gücü ${oldPower} → ${newPower}!`, attackerOwner === 'player' ? 'player' : 'ai');

      const rect = document.getElementById(`${targetSide}-slot-${strongestFront}`).getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `½ GÜÇ`, false, true);
      spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'red');
    }
  };

  tryNuke(playerLeader, 'ai', 'player');
  tryNuke(aiLeader, 'player', 'ai');
}

function handleMacronMitigation(damage, target) {
  const leader = target === 'player' ? playerLeader : aiLeader;
  if (leader && leader.abilityType === 'direct_damage_reduction' && isLeaderActive(target)) {
    const mitigation = Math.floor(damage * leader.abilityVal);
    if (mitigation <= 0) return;
    if (target === 'player') {
      playerHP += mitigation;
      writeLog(`${leader.flag} ${leader.name} pasifi ile can kaybı **${mitigation} HP** azaltıldı!`, 'player');

      const rect = playerHpBar.getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top - 30, `+${mitigation} HP SAVUNMA`, true);
    } else {
      aiHP += mitigation;
      writeLog(`${leader.flag} ${leader.name} pasifi ile düşman can kaybı **${mitigation} HP** azaltıldı!`, 'ai');

      const rect = aiHpBar.getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top + 30, `+${mitigation} HP SAVUNMA`, true);
    }
  }
}

// ==========================================================================
// Unit Destruction (Kamikaze, İsviçre çekilmesi, Zelenskiy pasifi)
// ==========================================================================
function destroyUnit(owner, front, card) {
  // İsviçre: Taktiksel Çekilme (yok olmak yerine yarı güçle ele döner)
  if (card.id === 'switzerland') {
    card.currentPower.land = Math.ceil(card.currentPower.land / 2);
    card.currentPower.air = Math.ceil(card.currentPower.air / 2);
    card.currentPower.sea = Math.ceil(card.currentPower.sea / 2);

    if (owner === 'player') {
      playerHand.push(card);
      writeLog(`🇨🇭 İsviçre "Taktiksel Çekilme": Kart yok olmak yerine güçleri yarıya inerek eline döndü!`, 'player');
    } else {
      aiHand.push(card);
      writeLog(`🇨🇭 Düşman İsviçre'si taktiksel çekilme yaptı ve ele geri döndü.`, 'ai');
    }

    const slot = document.getElementById(`${owner}-slot-${front}`);
    const rect = slot.getBoundingClientRect();
    spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `ÇEKİLME`, false, true);
    spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'gold');

    board[owner][front] = null;
    return;
  }

  board[owner][front] = null;

  // Japonya: Kamikaze (imha olunca karşı tarafa 15 HP)
  if (card.id === 'japan') {
    const slot = document.getElementById(`${owner}-slot-${front}`);
    const rect = slot.getBoundingClientRect();
    spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'red');
    sfx('explosion');
    triggerScreenShake();

    if (owner === 'player') {
      aiHP -= 15;
      writeLog(`🇯🇵 Japonya "Kamikaze": İmha edilirken düşmana **15 HP** doğrudan hasar verdi!`, 'player');
      const hpRect = aiHpBar.getBoundingClientRect();
      spawnFloatingDmg(hpRect.left + hpRect.width / 2, hpRect.top + 30, `-15 HP KAMIKAZE`);
    } else {
      playerHP -= 15;
      writeLog(`🇯🇵 Düşman Japonyası "Kamikaze": İmha edilirken sana **15 HP** doğrudan hasar verdi!`, 'ai');
      const hpRect = playerHpBar.getBoundingClientRect();
      spawnFloatingDmg(hpRect.left + hpRect.width / 2, hpRect.top - 30, `-15 HP KAMIKAZE`);
    }
    updateHpDisplay();
  }

  // Zelenskiy: Direniş Ruhu (birim kaybedince +HP)
  const ownerLeader = owner === 'player' ? playerLeader : aiLeader;
  if (ownerLeader && ownerLeader.abilityType === 'hp_on_unit_lost' && isLeaderActive(owner)) {
    if (owner === 'player') {
      playerHP = Math.min(100, playerHP + ownerLeader.abilityVal);
      writeLog(`${ownerLeader.flag} ${ownerLeader.name} "Direniş Ruhu": Kayıp birimin ardından +${ownerLeader.abilityVal} HP!`, 'player');
      const hpRect = playerHpBar.getBoundingClientRect();
      spawnFloatingDmg(hpRect.left + hpRect.width / 2, hpRect.top - 30, `+${ownerLeader.abilityVal} HP`, true);
    } else {
      aiHP = Math.min(aiMaxHP, aiHP + ownerLeader.abilityVal);
      writeLog(`${ownerLeader.flag} ${ownerLeader.name} "Direniş Ruhu": Düşman +${ownerLeader.abilityVal} HP kazandı.`, 'ai');
    }
    updateHpDisplay();
  }
}

// ==========================================================================
// Battle Phase
// ==========================================================================
async function startBattlePhase() {
  gameState = 'battle';
  btnBattle.disabled = true;
  btnBattle.querySelector('.btn-text').innerText = 'ÇATIŞMA SÜRÜYOR...';
  playerFrontWinsThisBattle = 0;

  sfx('battle');
  clearTacticTargets();
  selectedTacticIdx = null;
  renderTactics();

  aiPlayTurn();
  renderBoard();

  writeLog("Savaş cepheleri çözümleniyor...", 'system');
  await delay(900);

  aiUseTactics();
  applyLandDebuffs();
  applyNukes();

  renderBoard();
  await delay(700);

  const fronts = ['land', 'air', 'sea'];

  for (let front of fronts) {
    const playerSlot = document.getElementById(`player-slot-${front}`);
    const aiSlot = document.getElementById(`ai-slot-${front}`);

    playerSlot.classList.add(`combat-flash-${front}`);
    aiSlot.classList.add(`combat-flash-${front}`);

    let frontNameTR = front === 'land' ? 'KARA' : front === 'air' ? 'HAVA' : 'DENİZ';
    writeLog(`${frontNameTR} cephesi çatışmaya giriyor...`, 'system');
    await delay(700);

    renderBoardRevealed(front);
    await delay(500);

    const playerCard = board.player[front];
    const aiCard = board.ai[front];

    if (playerCard && aiCard) {
      const playerPower = playerCard.currentPower[front];
      const aiPower = aiCard.currentPower[front];

      const pCardEl = playerSlot.querySelector('.card');
      const aCardEl = aiSlot.querySelector('.card');

      const pRect = pCardEl.getBoundingClientRect();
      const aRect = aCardEl.getBoundingClientRect();
      const midX = (pRect.left + aRect.left + pRect.width) / 2;
      const midY = (pRect.top + aRect.top + pRect.height) / 2;

      pCardEl.classList.add('clash-slide-up');
      aCardEl.classList.add('clash-slide-down');

      await delay(200);

      spawnClashRing(midX, midY);
      spawnClashParticles(midX, midY, front === 'land' ? 'red' : 'cyan');
      triggerScreenShake();
      sfx('clash');

      await delay(300);

      if (playerPower > aiPower) {
        const diff = playerPower - aiPower;
        aiHP -= diff;
        playerFrontWinsThisBattle++;

        writeLog(`${playerCard.flag} ${playerCard.name} (${playerPower}), ${aiCard.flag} ${aiCard.name} (${aiPower}) birliğini yok etti!`, 'player');
        writeLog(`Düşman doğrudan **${diff} HP** hasar aldı.`, 'damage');
        sfx('damage');

        const aiHpBarRect = aiHpBar.getBoundingClientRect();
        spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `-${diff} HP`);
        spawnFloatingDmg(aRect.left + aRect.width / 2, aRect.top + aRect.height / 2, `-${aiPower} GÜÇ`);

        playerCard.currentPower[front] = diff;

        handleMacronMitigation(diff, 'ai');
        destroyUnit('ai', front, aiCard);

        aCardEl.classList.add('card-damaged');
        pCardEl.classList.add('card-damaged');

      } else if (aiPower > playerPower) {
        const diff = aiPower - playerPower;
        playerHP -= diff;

        writeLog(`${aiCard.flag} ${aiCard.name} (${aiPower}), ${playerCard.flag} ${playerCard.name} (${playerPower}) birliğini yok etti!`, 'ai');
        writeLog(`Komutan (Sen) doğrudan **${diff} HP** hasar aldın.`, 'damage');
        sfx('damage');

        const playerHpBarRect = playerHpBar.getBoundingClientRect();
        spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `-${diff} HP`);
        spawnFloatingDmg(pRect.left + pRect.width / 2, pRect.top + pRect.height / 2, `-${playerPower} GÜÇ`);

        aiCard.currentPower[front] = diff;

        handleMacronMitigation(diff, 'player');
        destroyUnit('player', front, playerCard);

        pCardEl.classList.add('card-damaged');
        aCardEl.classList.add('card-damaged');

      } else {
        writeLog(`${playerCard.flag} ${playerCard.name} ve ${aiCard.flag} ${aiCard.name} karşılıklı olarak birbirini imha etti!`, 'system');
        sfx('explosion');

        spawnFloatingDmg(pRect.left + pRect.width / 2, pRect.top + pRect.height / 2, `-${playerPower} GÜÇ`);
        spawnFloatingDmg(aRect.left + aRect.width / 2, aRect.top + aRect.height / 2, `-${aiPower} GÜÇ`);

        destroyUnit('player', front, playerCard);
        destroyUnit('ai', front, aiCard);

        pCardEl.classList.add('card-damaged');
        aCardEl.classList.add('card-damaged');
      }

    } else if (playerCard && !aiCard) {
      // AI'ya doğrudan hasar
      let damage = playerCard.currentPower[front];
      const pCardEl = playerSlot.querySelector('.card');

      pCardEl.classList.add('clash-slide-up');
      await delay(200);

      const aiSlotRect = aiSlot.getBoundingClientRect();
      spawnClashRing(aiSlotRect.left + aiSlotRect.width / 2, aiSlotRect.top + aiSlotRect.height / 2);
      spawnClashParticles(aiSlotRect.left + aiSlotRect.width / 2, aiSlotRect.top + aiSlotRect.height / 2, 'red');
      triggerScreenShake();
      sfx('explosion');

      await delay(300);

      if (aiLeader && aiLeader.abilityType === 'direct_damage_reduction' && isLeaderActive('ai')) {
        const mitigation = Math.floor(damage * aiLeader.abilityVal);
        damage -= mitigation;
        writeLog(`${aiLeader.flag} ${aiLeader.name} yeteneği: Düşman doğrudan hasarı azalttı!`, 'ai');

        const aiHpBarRect = aiHpBar.getBoundingClientRect();
        spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `ENGELLENDİ`, false, true);
      }

      aiHP -= damage;
      playerFrontWinsThisBattle++;
      writeLog(`Düşman ${frontNameTR} cephesi korumasız! ${playerCard.flag} ${playerCard.name} doğrudan saldırdı!`, 'player');
      writeLog(`Düşman **${damage} HP** doğrudan hasar aldı!`, 'damage');

      const aiHpBarRect = aiHpBar.getBoundingClientRect();
      spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `-${damage} HP`);

    } else if (!playerCard && aiCard) {
      // Oyuncuya doğrudan hasar
      let damage = aiCard.currentPower[front];
      const aCardEl = aiSlot.querySelector('.card');

      aCardEl.classList.add('clash-slide-down');
      await delay(200);

      const playerSlotRect = playerSlot.getBoundingClientRect();
      spawnClashRing(playerSlotRect.left + playerSlotRect.width / 2, playerSlotRect.top + playerSlotRect.height / 2);
      spawnClashParticles(playerSlotRect.left + playerSlotRect.width / 2, playerSlotRect.top + playerSlotRect.height / 2, 'red');
      triggerScreenShake();
      sfx('explosion');

      await delay(300);

      if (playerLeader && playerLeader.abilityType === 'direct_damage_reduction' && isLeaderActive('player')) {
        const mitigation = Math.floor(damage * playerLeader.abilityVal);
        damage -= mitigation;
        writeLog(`${playerLeader.flag} ${playerLeader.name} yeteneği: Doğrudan hasarı azalttın!`, 'player');

        const playerHpBarRect = playerHpBar.getBoundingClientRect();
        spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `SAVUNULDU`, false, true);
      }

      playerHP -= damage;
      writeLog(`<i class="fa-solid fa-triangle-exclamation"></i> ${frontNameTR} cephen boştu! ${aiCard.flag} ${aiCard.name} engelsiz saldırdı!`, 'ai');
      writeLog(`Komutan (Sen) **${damage} HP** ağır hasar aldın!`, 'damage');
      sfx('damage');

      const playerHpBarRect = playerHpBar.getBoundingClientRect();
      spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `-${damage} HP`);

    } else {
      writeLog(`Her iki taraf da ${frontNameTR} cephesine birlik konuşlandırmadı.`, 'system');
    }

    updateHpDisplay();
    renderBoardAfterCombat();

    await delay(1100);

    playerSlot.classList.remove(`combat-flash-${front}`);
    aiSlot.classList.remove(`combat-flash-${front}`);

    if (playerHP <= 0 || aiHP <= 0) break;
  }

  // Başarım: tek turda 3 cephe zaferi
  if (playerFrontWinsThisBattle >= 3) {
    unlockAchievement('sweep');
  }

  resolveRoundEnd();
}

function renderBoardRevealed(activeFront) {
  Object.keys(board.ai).forEach(front => {
    const container = aiSlots[front];
    const card = board.ai[front];
    if (card && front === activeFront) {
      container.innerHTML = '';
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.innerHTML = getCardHTML(card, front);
      container.appendChild(cardEl);
    }
  });
}

function renderBoardAfterCombat() {
  Object.keys(board.player).forEach(front => {
    const container = playerSlots[front];
    const card = board.player[front];
    if (!card) {
      container.innerHTML = getEmptySlotHTML(front);
    } else {
      const cardEl = container.querySelector('.card');
      if (cardEl) cardEl.innerHTML = getCardHTML(card, front);
    }
  });

  Object.keys(board.ai).forEach(front => {
    const container = aiSlots[front];
    const card = board.ai[front];
    if (!card) {
      container.innerHTML = getEmptySlotHTML(front);
    } else {
      const cardEl = container.querySelector('.card');
      if (cardEl && !cardEl.classList.contains('card-back')) {
        cardEl.innerHTML = getCardHTML(card, front);
      }
    }
  });
}

// ==========================================================================
// Round End
// ==========================================================================
async function resolveRoundEnd() {
  if (playerHP <= 0 || aiHP <= 0) {
    triggerGameOver();
    return;
  }

  // Gücü sıfırlanan birimler imha olur (nuke/airstrike sonrası)
  ['land', 'air', 'sea'].forEach(front => {
    const playerCard = board.player[front];
    const aiCard = board.ai[front];

    if (playerCard && playerCard.currentPower[front] <= 0) {
      writeLog(`${playerCard.flag} ${playerCard.name} savaşamaz durumda ve dağıldı.`, 'system');
      destroyUnit('player', front, playerCard);
    }
    if (aiCard && aiCard.currentPower[front] <= 0) {
      writeLog(`Düşman birimi ${aiCard.flag} ${aiCard.name} savaşamaz durumda ve dağıldı.`, 'system');
      destroyUnit('ai', front, aiCard);
    }
  });

  // Tur sonu iyileştirme pasifleri
  if (playerLeader && playerLeader.abilityType === 'heal_round_end') {
    playerHP = Math.min(100, playerHP + playerLeader.abilityVal);
    writeLog(`${playerLeader.flag} ${playerLeader.name} pasifi: Canın **+${playerLeader.abilityVal} HP** yenilendi!`, 'player');
    sfx('heal');

    const rect = playerHpBar.getBoundingClientRect();
    spawnFloatingDmg(rect.left + rect.width / 2, rect.top - 30, `+${playerLeader.abilityVal} HP`, true);
  }

  if (aiLeader && aiLeader.abilityType === 'heal_round_end' && isLeaderActive('ai')) {
    aiHP = Math.min(aiMaxHP, aiHP + aiLeader.abilityVal);
    writeLog(`${aiLeader.flag} ${aiLeader.name} pasifi: Düşman canı **+${aiLeader.abilityVal} HP** yenilendi!`, 'ai');

    const rect = aiHpBar.getBoundingClientRect();
    spawnFloatingDmg(rect.left + rect.width / 2, rect.top + 30, `+${aiLeader.abilityVal} HP`, true);
  }

  // Kampanya perki: Seyyar Hastane
  if (gameMode === 'campaign' && campaignPerks.medicHeal > 0) {
    playerHP = Math.min(100, playerHP + campaignPerks.medicHeal);
    writeLog(`Seyyar Hastane: +${campaignPerks.medicHeal} HP yenilendi.`, 'ability');
  }

  // Bu turluk taktik etkileri (EMP, Keşif) yeni tura geçerken sıfırlanır
  reconActive = false;
  empActive = false;

  updateHpDisplay();

  if (playerHP <= 0 || aiHP <= 0) {
    triggerGameOver();
    return;
  }

  round++;
  roundCounter.innerText = round;

  // Her 3 turda bir taktik kartı ver (4, 7, 10...)
  if (round > 1 && (round - 1) % 3 === 0) {
    grantTactic('player');
    writeLog(`Genelkurmay yeni bir Taktik Kartı gönderdi!`, 'ability');
    sfx('tactic');
    if (difficulty !== 'easy') grantTactic('ai');
  }

  writeLog("Yeni tura geçildi. Desteden kartlar çekiliyor...", 'system');
  await fillHandsAnimated();

  gameState = 'planning';
  selectedHandCardIdx = null;
  tacticPlayedThisTurn = false;

  renderHand();
  renderBoard();
  renderTactics();

  btnBattle.disabled = false;
  btnBattle.querySelector('.btn-text').innerText = 'SAVAŞI BAŞLAT';

  writeLog("Planlarını yap ve cepheleri savun!", 'system');
}

// ==========================================================================
// Game Over & Rewards
// ==========================================================================
function calcQuickBattleReward(won) {
  if (!won) return 5; // teselli madalyası
  switch (difficulty) {
    case 'easy': return 20;
    case 'hard': return 70;
    default: return 40;
  }
}

function triggerGameOver() {
  gameState = 'gameover';

  const won = playerHP > 0 && aiHP <= 0;
  const lost = playerHP <= 0 && aiHP > 0;
  const draw = !won && !lost;

  // Kampanyada ara cephe zaferi: game over yerine perk ekranı
  if (gameMode === 'campaign' && won && campaignStage < 5) {
    const stage = CAMPAIGN_STAGES[campaignStage - 1];
    addMedals(stage.reward);
    sfx('victory');

    META.stats.campaignBest = Math.max(META.stats.campaignBest, campaignStage);
    saveMeta();

    writeLog(`CEPHE ${campaignStage} DÜŞTÜ! +${stage.reward} madalya kazanıldı.`, 'win');
    showPerkSelection();
    return;
  }

  // İstatistikler
  META.stats.matches++;
  if (won) META.stats.wins++;
  else if (lost) META.stats.losses++;
  else META.stats.draws++;
  saveMeta();

  statRounds.innerText = round;
  statHp.innerText = playerHP;

  let medalsEarned = 0;

  const modal = gameOverOverlay.querySelector('.game-over-modal');

  if (won) {
    sfx('victory');

    if (gameMode === 'campaign') {
      // Kampanya tamamlandı (5. cephe)
      const stage = CAMPAIGN_STAGES[campaignStage - 1];
      medalsEarned = stage.reward + 100;
      META.stats.campaignBest = 5;
      saveMeta();
      unlockAchievement('conqueror');

      modal.className = 'game-over-modal victory';
      gameOverTitle.innerText = "FETİH TAMAMLANDI!";
      gameOverMsg.innerText = `${playerLeader.name} liderliğinde 5 cephenin tamamını ele geçirdin. Dünya artık senin komutanda!`;
      gameOverIcon.className = "fa-solid fa-crown trophy-icon";
      writeLog("HAREKÂT BİTTİ: Tüm cepheler fethedildi!", 'win');
    } else {
      medalsEarned = calcQuickBattleReward(true);
      modal.className = 'game-over-modal victory';
      gameOverTitle.innerText = "KÜRESEL HAKİMİYET!";
      gameOverMsg.innerText = `${playerLeader.name} liderliğinde düşman hatlarını tamamen yerle bir ettin!`;
      gameOverIcon.className = "fa-solid fa-trophy trophy-icon";
      writeLog("OYUN BİTTİ: Zafer kazandın!", 'win');

      if (difficulty === 'hard') unlockAchievement('hard_win');
    }

    unlockAchievement('first_win');
    if (playerHP >= 100) unlockAchievement('flawless');

  } else if (lost) {
    sfx('defeat');

    if (gameMode === 'campaign') {
      medalsEarned = (campaignStage - 1) * 15 + 5;
      modal.className = 'game-over-modal defeat';
      gameOverTitle.innerText = "HAREKÂT BAŞARISIZ...";
      gameOverMsg.innerText = `${aiNameEl.innerText} seni Cephe ${campaignStage}'te durdurdu. ${campaignStage - 1} cephe temizlendi. Tekrar dene, Komutan.`;
      gameOverIcon.className = "fa-solid fa-circle-xmark trophy-icon text-danger";
    } else {
      medalsEarned = calcQuickBattleReward(false);
      modal.className = 'game-over-modal defeat';
      gameOverTitle.innerText = "HEZİMET...";
      gameOverMsg.innerText = `Düşman Lider ${aiLeader.name} komuta merkezini ele geçirdi. Ordu dağıldı.`;
      gameOverIcon.className = "fa-solid fa-circle-xmark trophy-icon text-danger";
    }
    writeLog("OYUN BİTTİ: Yenildin...", 'damage');

  } else {
    sfx('defeat');
    medalsEarned = 10;
    modal.className = 'game-over-modal';
    gameOverTitle.innerText = "NÜKLEER KIYAMET!";
    gameOverMsg.innerText = "Karşılıklı imha protokolü devreye girdi. İki lider de yenildi.";
    gameOverIcon.className = "fa-solid fa-radiation trophy-icon";
    writeLog("OYUN BİTTİ: Berabere kalındı.", 'system');
    unlockAchievement('doomsday');
  }

  if (META.stats.matches >= 10) unlockAchievement('veteran');

  addMedals(medalsEarned);
  if (medalsEarned > 0) sfx('medal');
  statMedalsEarned.innerText = medalsEarned;

  btnPlayAgain.innerHTML = gameMode === 'campaign'
    ? '<i class="fa-solid fa-flag"></i> Yeni Harekât'
    : '<i class="fa-solid fa-gamepad"></i> Tekrar Oyna';

  gameOverOverlay.classList.remove('hidden');
}

// ==========================================================================
// Match Reset
// ==========================================================================
async function resetMatch(options = {}) {
  const { keepPlayerHP = false, aiTacticCount = null } = options;

  gameState = 'dealing';
  if (!keepPlayerHP) playerHP = 100;
  aiHP = aiMaxHP;
  round = 1;
  selectedHandCardIdx = null;
  selectedTacticIdx = null;
  tacticPlayedThisTurn = false;
  reconActive = false;
  empActive = false;
  playerFrontWinsThisBattle = 0;

  board.player = { land: null, air: null, sea: null };
  board.ai = { land: null, air: null, sea: null };

  playerHand = [];
  aiHand = [];

  // Taktik kartları: her maç başında 2 (kampanyada perk taktikleri korunur)
  if (gameMode === 'quick' || campaignStage <= 1) {
    playerTactics = [randomTactic(), randomTactic()];
  }
  aiTactics = [];
  const aiTacticStart = aiTacticCount !== null ? aiTacticCount : (difficulty === 'hard' ? 2 : difficulty === 'normal' ? 1 : 0);
  for (let i = 0; i < aiTacticStart; i++) grantTactic('ai');

  roundCounter.innerText = round;
  btnBattle.disabled = true;
  btnBattle.querySelector('.btn-text').innerText = 'DAĞITILIYOR...';

  gameOverOverlay.classList.add('hidden');
  if (gameMode === 'quick') {
    combatLog.innerHTML = '';
    campaignIndicator.classList.add('hidden');
  }

  initDeck();

  updateHpDisplay();
  renderHand();
  renderBoard();
  renderTactics();

  writeLog(`Savaş başladı! Kartlar dağıtılıyor...`, 'system');

  await fillHandsAnimated();

  gameState = 'planning';
  renderTactics();
  btnBattle.disabled = false;
  btnBattle.querySelector('.btn-text').innerText = 'SAVAŞI BAŞLAT';
  writeLog(`Birliklerin hazır. Liderlerin pasifleri devrede. Savunma hatlarını kur!`, 'system');
}

// ==========================================================================
// Event Listeners
// ==========================================================================
btnBattle.addEventListener('click', () => {
  if (gameState !== 'planning') return;
  startBattlePhase();
});

btnRestart.addEventListener('click', () => {
  sfx('click');
  if (gameState === 'menu') return;
  // Aynı modu baştan başlat
  if (gameMode === 'campaign') {
    startCampaign();
  } else {
    openLeaderSelection();
  }
});

btnMainMenu.addEventListener('click', () => {
  sfx('click');
  showMainMenu();
});

btnSound.addEventListener('click', toggleSound);
document.getElementById('btn-menu-sound').addEventListener('click', toggleSound);

btnPlayAgain.addEventListener('click', () => {
  sfx('click');
  gameOverOverlay.classList.add('hidden');
  if (gameMode === 'campaign') {
    startCampaign();
  } else {
    openLeaderSelection();
  }
});

btnGoMenu.addEventListener('click', () => {
  sfx('click');
  showMainMenu();
});

// Ana menü
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sfx('click');
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
  });
});

document.getElementById('btn-mode-quick').addEventListener('click', () => {
  sfx('click');
  gameMode = 'quick';
  const activeDiff = document.querySelector('.diff-btn.active');
  if (activeDiff) difficulty = activeDiff.dataset.diff;
  openLeaderSelection();
});

document.getElementById('btn-mode-campaign').addEventListener('click', () => {
  sfx('click');
  startCampaign();
});

document.getElementById('btn-menu-achievements').addEventListener('click', () => {
  sfx('click');
  renderAchievements();
  achievementsOverlay.classList.remove('hidden');
});

document.getElementById('btn-close-achievements').addEventListener('click', () => {
  sfx('click');
  achievementsOverlay.classList.add('hidden');
});

document.getElementById('btn-back-to-menu').addEventListener('click', () => {
  sfx('click');
  showMainMenu();
});

// ==========================================================================
// Init
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  loadMeta();
  showMainMenu();
});
