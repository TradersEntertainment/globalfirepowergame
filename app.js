// Global Firepower: Tactical Fronts - Game Logic (V1.3)

// State Variables
let playerHP = 100;
let aiHP = 100;
let deck = [];
let playerHand = [];
let aiHand = [];
let round = 1;
let gameState = 'leader_selection'; // 'leader_selection', 'planning', 'battle', 'gameover'

// Leaders State
let playerLeader = null;
let aiLeader = null;
let pendingUnlockLeader = null;

// Unique Card ID generator
let cardInstanceCounter = 0;

// Active board slots
const board = {
  player: { land: null, air: null, sea: null },
  ai: { land: null, air: null, sea: null }
};

let selectedHandCardIdx = null;

// DOM Elements
const gameContainer = document.querySelector('.game-container');
const aiHpBar = document.getElementById('ai-hp-bar');
const aiHpVal = document.getElementById('ai-hp-val');
const playerHpBar = document.getElementById('player-hp-bar');
const playerHpVal = document.getElementById('player-hp-val');

const playerHandEl = document.getElementById('player-hand');
const roundCounter = document.getElementById('round-counter');
const btnBattle = document.getElementById('btn-battle');
const btnRestart = document.getElementById('btn-restart');
const combatLog = document.getElementById('combat-log');
const deckPile = document.getElementById('deck-pile');

// Overlays
const leaderSelectionOverlay = document.getElementById('leader-selection-overlay');
const leadersGrid = document.getElementById('leaders-grid');
const purchaseOverlay = document.getElementById('purchase-overlay');
const btnCancelBuy = document.getElementById('btn-cancel-buy');
const btnConfirmBuy = document.getElementById('btn-confirm-buy');
const purchasePriceTag = document.getElementById('purchase-price-tag');

const playerLeaderDisplay = document.getElementById('player-leader-display');
const aiLeaderDisplay = document.getElementById('ai-leader-display');

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
const btnPlayAgain = document.getElementById('btn-play-again');

// Helper functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function writeLog(text, type = 'system') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `[TUR ${round}] ${text}`;
  combatLog.appendChild(entry);
  combatLog.scrollTop = combatLog.scrollHeight;
}

// ==========================================================================
// GFP V1.3 - Visual Effects Engine (Particles, Shake, Damage Numbers)
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
  
  setTimeout(() => {
    dmgEl.remove();
  }, 900);
}

function spawnClashParticles(x, y, colorType = 'cyan') {
  const count = 15;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = `clash-particle ${colorType === 'gold' ? 'gold' : colorType === 'red' ? 'red' : ''}`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    
    // Random trajectories
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 80;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    p.style.setProperty('--tx', `${tx}px`);
    p.style.setProperty('--ty', `${ty}px`);
    
    document.body.appendChild(p);
    
    setTimeout(() => {
      p.remove();
    }, 700);
  }
}

function spawnClashRing(x, y) {
  const ring = document.createElement('div');
  ring.className = 'clash-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  
  document.body.appendChild(ring);
  
  setTimeout(() => {
    ring.remove();
  }, 500);
}

// 3D Card Draw Animation
async function animateCardDraw(isPlayer, card) {
  // Find deck coordinates
  const deckRect = deckPile.getBoundingClientRect();
  const startX = deckRect.left;
  const startY = deckRect.top;
  
  // Create flying visual representation
  const flyer = document.createElement('div');
  flyer.className = 'flying-card';
  flyer.innerHTML = `<i class="fa-solid fa-layer-group"></i>`;
  flyer.style.left = `${startX}px`;
  flyer.style.top = `${startY}px`;
  flyer.style.transform = 'scale(0.8) rotate(3deg)';
  
  document.body.appendChild(flyer);
  
  // Render destination card in hand (invisible initially)
  if (isPlayer) {
    playerHand.push(card);
    renderHand();
    
    const handCards = playerHandEl.querySelectorAll('.card');
    const targetCardEl = handCards[handCards.length - 1];
    
    if (targetCardEl) {
      targetCardEl.style.opacity = '0';
      targetCardEl.style.transform = 'translateY(20px)';
      
      const targetRect = targetCardEl.getBoundingClientRect();
      
      // Force repaint to register flyer start styles
      flyer.getBoundingClientRect();
      
      // Move flyer to destination
      flyer.style.left = `${targetRect.left}px`;
      flyer.style.top = `${targetRect.top}px`;
      flyer.style.transform = 'scale(1) rotate(0deg)';
      
      await delay(600);
      
      // Remove flyer and show target card in hand
      flyer.remove();
      targetCardEl.style.opacity = '1';
      targetCardEl.style.transform = '';
      targetCardEl.style.transition = 'var(--transition-smooth)';
    } else {
      flyer.remove();
    }
  } else {
    // AI Draw Animation
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

// Sequential Hand Draw
async function fillHandsAnimated() {
  const drawDelay = 180;
  
  let playerNeeds = 5 - playerHand.length;
  let aiNeeds = 5 - aiHand.length;
  
  const maxNeeds = Math.max(playerNeeds, aiNeeds);
  
  for (let i = 0; i < maxNeeds; i++) {
    if (playerHand.length < 5 && deck.length > 0) {
      const card = getNextDeckCard();
      await animateCardDraw(true, card);
      await delay(drawDelay);
    }
    if (aiHand.length < 5 && deck.length > 0) {
      const card = getNextDeckCard();
      await animateCardDraw(false, card);
      await delay(drawDelay);
    }
  }
}

function getNextDeckCard() {
  if (deck.length === 0) {
    writeLog("Deste bitti. Iskarta kartlar karıştırılarak yeni deste oluşturuluyor...", 'system');
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

// Render Leader Selection Screen
function renderLeaderSelection() {
  leadersGrid.innerHTML = '';
  
  LEADERS_DB.forEach(leader => {
    const card = document.createElement('div');
    card.className = `leader-card ${leader.isLocked ? 'locked' : ''}`;
    
    card.innerHTML = `
      ${leader.isLocked ? `
        <div class="lock-badge">
          <i class="fa-solid fa-lock"></i> ${leader.price}
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
      <button class="btn ${leader.isLocked ? 'btn-secondary' : 'btn-primary'} leader-action-btn">
        ${leader.isLocked ? '<i class="fa-solid fa-cart-shopping"></i> Kilit Aç' : 'Seç'}
      </button>
    `;
    
    card.addEventListener('click', () => {
      if (leader.isLocked) {
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
  purchasePriceTag.innerText = leader.price;
  purchaseOverlay.classList.remove('hidden');
}

btnCancelBuy.addEventListener('click', () => {
  purchaseOverlay.classList.add('hidden');
  pendingUnlockLeader = null;
});

btnConfirmBuy.addEventListener('click', () => {
  if (pendingUnlockLeader) {
    pendingUnlockLeader.isLocked = false;
    writeLog(`PREMIUM Mağaza: ${pendingUnlockLeader.name} kilidi başarıyla açıldı!`, 'system');
    purchaseOverlay.classList.add('hidden');
    
    // Spawn gold purchase particles!
    const rect = btnConfirmBuy.getBoundingClientRect();
    spawnClashParticles(rect.left + rect.width / 2, rect.top, 'gold');
    
    pendingUnlockLeader = null;
    renderLeaderSelection();
  }
});

// Select Player Leader and initialize game
function selectPlayerLeader(leader) {
  playerLeader = leader;
  leaderSelectionOverlay.classList.add('hidden');
  
  const unlockedLeaders = LEADERS_DB.filter(l => !l.isLocked);
  aiLeader = unlockedLeaders[Math.floor(Math.random() * unlockedLeaders.length)];
  
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
  
  writeLog(`Komutan ${playerLeader.name} liderliğini seçti! (${playerLeader.title})`, 'player');
  writeLog(`Yapay Zeka ${aiLeader.name} liderliğini seçti! (${aiLeader.title})`, 'ai');
  
  gameState = 'planning';
  resetGame(false);
}

// Card Deck Management
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

// UI Rendering helpers
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
    
    cardEl.addEventListener('click', (e) => {
      if (gameState !== 'planning') return;
      
      if (selectedHandCardIdx === idx) {
        selectedHandCardIdx = null;
      } else {
        selectedHandCardIdx = idx;
      }
      renderHand();
      highlightActiveSlots();
    });
    
    playerHandEl.appendChild(cardEl);
  });
}

function highlightActiveSlots() {
  Object.keys(playerSlots).forEach(front => {
    const slot = document.getElementById(`player-slot-${front}`);
    if (selectedHandCardIdx !== null) {
      slot.classList.add('slot-highlight');
    } else {
      slot.classList.remove('slot-highlight');
    }
  });
}

function getEmptySlotHTML(front) {
  let icon = 'fa-trowel-bricks';
  let label = 'KARA';
  if (front === 'air') { icon = 'fa-jet-fighter'; label = 'HAVA'; }
  if (front === 'sea') { icon = 'fa-ship'; label = 'DENİZ'; }
  
  return `
    <div class="empty-slot-msg">
      <i class="fa-solid ${icon}"></i>
      <span>BOŞ CEPHE</span>
    </div>
  `;
}

function renderBoard() {
  // Render Player Slots
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
        
        removeLeaderBuff(card, front, 'player');
        
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

  // Render AI Slots
  Object.keys(board.ai).forEach(front => {
    const container = aiSlots[front];
    const slotParent = document.getElementById(`ai-slot-${front}`);
    const card = board.ai[front];
    
    container.innerHTML = '';
    slotParent.classList.remove('empty-warning');
    
    if (card) {
      const cardEl = document.createElement('div');
      
      if (gameState === 'planning') {
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

// Apply Leader passive buffs on deployment
function applyLeaderBuff(card, front, owner) {
  const leader = owner === 'player' ? playerLeader : aiLeader;
  if (!leader) return;

  if (leader.abilityType === 'land_buff' && front === 'land') {
    card.currentPower.land += leader.abilityVal;
    writeLog(`${leader.flag} ${leader.name} pasifi etkinleşti: Kara birimine **+${leader.abilityVal} Güç** verildi!`, owner === 'player' ? 'player' : 'ai');
    
    // Spawn green stats buff numbers
    const slot = document.getElementById(`${owner}-slot-land`);
    const rect = slot.getBoundingClientRect();
    spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `+${leader.abilityVal} Güç`, true);
  }
  
  if (leader.abilityType === 'air_buff' && front === 'air') {
    card.currentPower.air += leader.abilityVal;
    writeLog(`${leader.flag} ${leader.name} pasifi etkinleşti: Hava birimine **+${leader.abilityVal} Güç** verildi!`, owner === 'player' ? 'player' : 'ai');
    
    const slot = document.getElementById(`${owner}-slot-air`);
    const rect = slot.getBoundingClientRect();
    spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `+${leader.abilityVal} Güç`, true);
  }
}

// Remove Leader buffs when returning to hand
function removeLeaderBuff(card, front, owner) {
  const leader = owner === 'player' ? playerLeader : aiLeader;
  if (!leader) return;

  if (leader.abilityType === 'land_buff' && front === 'land') {
    card.currentPower.land = Math.max(0, card.currentPower.land - leader.abilityVal);
  }
  
  if (leader.abilityType === 'air_buff' && front === 'air') {
    card.currentPower.air = Math.max(0, card.currentPower.air - leader.abilityVal);
  }
}

function handleSlotClick(front) {
  if (gameState !== 'planning' || selectedHandCardIdx === null) return;
  
  const selectedCard = playerHand[selectedHandCardIdx];
  
  const existing = board.player[front];
  if (existing) {
    removeLeaderBuff(existing, front, 'player');
    playerHand.push(existing);
  }
  
  board.player[front] = selectedCard;
  applyLeaderBuff(selectedCard, front, 'player');
  
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

function updateHpDisplay() {
  playerHP = Math.max(0, Math.min(100, playerHP));
  aiHP = Math.max(0, Math.min(100, aiHP));

  playerHpBar.style.width = `${playerHP}%`;
  playerHpVal.innerText = playerHP;

  aiHpBar.style.width = `${aiHP}%`;
  aiHpVal.innerText = aiHP;
  
  if (playerHP < 30) {
    playerHpBar.style.backgroundColor = 'var(--color-danger)';
  } else {
    playerHpBar.style.backgroundColor = '';
  }
  if (aiHP < 30) {
    aiHpBar.style.backgroundColor = 'var(--color-danger)';
  } else {
    aiHpBar.style.backgroundColor = '';
  }
}

function aiPlayTurn() {
  const fronts = ['land', 'air', 'sea'];
  
  fronts.forEach(front => {
    const existing = board.ai[front];
    
    let candidates = [...aiHand].map((c, idx) => ({ card: c, idx })).filter(item => {
      if (front === 'sea' && item.card.sea === 0) return false;
      return true;
    });
    
    candidates.sort((a, b) => b.card.currentPower[front] - a.card.currentPower[front]);
    
    if (!existing) {
      if (candidates.length > 0) {
        const chosen = candidates[0].card;
        board.ai[front] = chosen;
        applyLeaderBuff(chosen, front, 'ai');
        aiHand.splice(candidates[0].idx, 1);
      }
    } else {
      if (candidates.length > 0) {
        const bestCandidate = candidates[0].card;
        const currentVal = existing.currentPower[front];
        const candidateVal = bestCandidate.currentPower[front];
        
        if (candidateVal > currentVal + 12) {
          removeLeaderBuff(existing, front, 'ai');
          aiHand.push(existing);
          board.ai[front] = bestCandidate;
          applyLeaderBuff(bestCandidate, front, 'ai');
          aiHand.splice(candidates[0].idx, 1);
        }
      }
    }
  });

  // fill AI hands in background (drawing logic)
  while (aiHand.length < 5 && deck.length > 0) {
    aiHand.push(getNextDeckCard());
  }
}

// Apply Vladimir Putin debuff (-8 land power to opponent)
function applyPutinDebuff() {
  if (playerLeader && playerLeader.abilityType === 'land_debuff') {
    const aiLand = board.ai.land;
    if (aiLand) {
      aiLand.currentPower.land = Math.max(0, aiLand.currentPower.land - playerLeader.abilityVal);
      writeLog(`🇷🇺 Vladimir Putin yeteneği: AI'ın Kara birimi gücü kalıcı olarak -8 azaltıldı!`, 'player');
      
      const slot = document.getElementById('ai-slot-land');
      const rect = slot.getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `-${playerLeader.abilityVal} Güç`);
    }
  }

  if (aiLeader && aiLeader.abilityType === 'land_debuff') {
    const playerLand = board.player.land;
    if (playerLand) {
      playerLand.currentPower.land = Math.max(0, playerLand.currentPower.land - aiLeader.abilityVal);
      writeLog(`🇷🇺 Vladimir Putin yeteneği: Kara biriminiz gücü kalıcı olarak -8 azaltıldı!`, 'ai');
      
      const slot = document.getElementById('player-slot-land');
      const rect = slot.getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `-${aiLeader.abilityVal} Güç`);
    }
  }
}

// Apply Kim Jong Un nuclear power
function applyKimNuke() {
  if (round % 3 !== 0) return;

  // Player Kim
  if (playerLeader && playerLeader.abilityType === 'nuke_debuff') {
    let strongestAiFront = null;
    let maxPower = -1;
    
    ['land', 'air', 'sea'].forEach(front => {
      const card = board.ai[front];
      if (card && card.currentPower[front] > maxPower) {
        maxPower = card.currentPower[front];
        strongestAiFront = front;
      }
    });

    if (strongestAiFront) {
      const targetCard = board.ai[strongestAiFront];
      const oldPower = targetCard.currentPower[strongestAiFront];
      const newPower = Math.ceil(oldPower * playerLeader.abilityVal);
      targetCard.currentPower[strongestAiFront] = newPower;
      writeLog(`🇰🇵 Kim Jong Un NÜKLEER pasifi: Rakibin en güçlü birimi (${targetCard.name}) gücü ${oldPower}'den ${newPower}'e indirildi!`, 'player');
      
      const slot = document.getElementById(`ai-slot-${strongestAiFront}`);
      const rect = slot.getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `½ GÜÇ`, false, true);
      spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'red');
    }
  }

  // AI Kim
  if (aiLeader && aiLeader.abilityType === 'nuke_debuff') {
    let strongestPlayerFront = null;
    let maxPower = -1;
    
    ['land', 'air', 'sea'].forEach(front => {
      const card = board.player[front];
      if (card && card.currentPower[front] > maxPower) {
        maxPower = card.currentPower[front];
        strongestPlayerFront = front;
      }
    });

    if (strongestPlayerFront) {
      const targetCard = board.player[strongestPlayerFront];
      const oldPower = targetCard.currentPower[strongestPlayerFront];
      const newPower = Math.ceil(oldPower * aiLeader.abilityVal);
      targetCard.currentPower[strongestPlayerFront] = newPower;
      writeLog(`🇰🇵 Kim Jong Un NÜKLEER pasifi: Birliğinizin (${targetCard.name}) gücü ${oldPower}'den ${newPower}'e indirildi!`, 'ai');
      
      const slot = document.getElementById(`player-slot-${strongestPlayerFront}`);
      const rect = slot.getBoundingClientRect();
      spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `½ GÜÇ`, false, true);
      spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'red');
    }
  }
}

// Resolve Combat Phase
async function startBattlePhase() {
  gameState = 'battle';
  btnBattle.disabled = true;
  btnBattle.querySelector('.btn-text').innerText = 'ÇATIŞMA SÜRÜYOR...';
  
  aiPlayTurn();
  renderBoard();
  
  writeLog("Savaş cepheleri çözümleniyor...", 'system');
  await delay(1000);

  applyPutinDebuff();
  applyKimNuke();

  renderBoard();
  await delay(800);
  
  const fronts = ['land', 'air', 'sea'];
  
  for (let front of fronts) {
    const playerSlot = document.getElementById(`player-slot-${front}`);
    const aiSlot = document.getElementById(`ai-slot-${front}`);
    
    playerSlot.classList.add(`combat-flash-${front}`);
    aiSlot.classList.add(`combat-flash-${front}`);
    
    let frontNameTR = front === 'land' ? 'KARA' : front === 'air' ? 'HAVA' : 'DENİZ';
    writeLog(`${frontNameTR} cephesi çatışmaya giriyor...`, 'system');
    await delay(800);
    
    renderBoardRevealed(front);
    await delay(600);

    const playerCard = board.player[front];
    const aiCard = board.ai[front];
    
    if (playerCard && aiCard) {
      // Both cards exist - CLASH
      const playerPower = playerCard.currentPower[front];
      const aiPower = aiCard.currentPower[front];
      
      const pCardEl = playerSlot.querySelector('.card');
      const aCardEl = aiSlot.querySelector('.card');
      
      // Calculate intersection coordinates for clash VFX
      const pRect = pCardEl.getBoundingClientRect();
      const aRect = aCardEl.getBoundingClientRect();
      const midX = (pRect.left + aRect.left + pRect.width) / 2;
      const midY = (pRect.top + aRect.top + pRect.height) / 2;
      
      // Trigger card flying animations towards each other
      pCardEl.classList.add('clash-slide-up');
      aCardEl.classList.add('clash-slide-down');
      
      // Wait for collision moment (approx 200ms)
      await delay(200);
      
      // VFX: Explode sparks, ring shockwave, shake screen
      spawnClashRing(midX, midY);
      spawnClashParticles(midX, midY, front === 'sea' ? 'cyan' : front === 'air' ? 'cyan' : 'red');
      triggerScreenShake();
      
      await delay(300); // Wait for animations to settle
      
      if (playerPower > aiPower) {
        const diff = playerPower - aiPower;
        aiHP -= diff;
        
        writeLog(`${playerCard.flag} ${playerCard.name} (${playerPower}), ${aiCard.flag} ${aiCard.name} (${aiPower}) birliğini yok etti!`, 'player');
        writeLog(`Yapay Zeka doğrudan **${diff} HP** hasar aldı.`, 'damage');
        
        // Float damage number over AI HP bar
        const aiHpBarRect = aiHpBar.getBoundingClientRect();
        spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `-${diff} HP`);
        
        // Float damage number over defeated AI Card
        spawnFloatingDmg(aRect.left + aRect.width / 2, aRect.top + aRect.height / 2, `-${aiPower} GÜÇ`);
        
        playerCard.currentPower[front] = diff;
        
        handleMacronMitigation(diff, 'ai');
        board.ai[front] = null;
        
        aCardEl.classList.add('card-damaged');
        pCardEl.classList.add('card-damaged');
        
      } else if (aiPower > playerPower) {
        const diff = aiPower - playerPower;
        playerHP -= diff;
        
        writeLog(`${aiCard.flag} ${aiCard.name} (${aiPower}), ${playerCard.flag} ${playerCard.name} (${playerPower}) birliğini yok etti!`, 'ai');
        writeLog(`Komutan (Sen) doğrudan **${diff} HP** hasar aldın.`, 'damage');
        
        const playerHpBarRect = playerHpBar.getBoundingClientRect();
        spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `-${diff} HP`);
        spawnFloatingDmg(pRect.left + pRect.width / 2, pRect.top + pRect.height / 2, `-${playerPower} GÜÇ`);
        
        aiCard.currentPower[front] = diff;
        
        handleMacronMitigation(diff, 'player');
        
        const retreated = triggerSwissRetreat(playerCard, front);
        if (!retreated) {
          board.player[front] = null;
        }
        
        pCardEl.classList.add('card-damaged');
        aCardEl.classList.add('card-damaged');
        
      } else {
        writeLog(`${playerCard.flag} ${playerCard.name} ve ${aiCard.flag} ${aiCard.name} karşılıklı olarak birbirini imha etti!`, 'system');
        
        spawnFloatingDmg(pRect.left + pRect.width / 2, pRect.top + pRect.height / 2, `-${playerPower} GÜÇ`);
        spawnFloatingDmg(aRect.left + aRect.width / 2, aRect.top + aRect.height / 2, `-${aiPower} GÜÇ`);

        const retreated = triggerSwissRetreat(playerCard, front);
        if (!retreated) {
          board.player[front] = null;
        }
        board.ai[front] = null;
        
        pCardEl.classList.add('card-damaged');
        aCardEl.classList.add('card-damaged');
      }
      
    } else if (playerCard && !aiCard) {
      // Direct damage to AI
      let damage = playerCard.currentPower[front];
      const pCardEl = playerSlot.querySelector('.card');
      const pRect = pCardEl.getBoundingClientRect();
      
      pCardEl.classList.add('clash-slide-up');
      await delay(200);
      
      const aiSlotRect = aiSlot.getBoundingClientRect();
      spawnClashRing(aiSlotRect.left + aiSlotRect.width / 2, aiSlotRect.top + aiSlotRect.height / 2);
      spawnClashParticles(aiSlotRect.left + aiSlotRect.width / 2, aiSlotRect.top + aiSlotRect.height / 2, 'red');
      triggerScreenShake();
      
      await delay(300);
      
      if (aiLeader && aiLeader.abilityType === 'direct_damage_reduction') {
        const mitigation = Math.floor(damage * aiLeader.abilityVal);
        damage -= mitigation;
        writeLog(`🇫🇷 Emmanuel Macron yeteneği: AI doğrudan hasarı %30 azalttı!`, 'ai');
        
        const aiHpBarRect = aiHpBar.getBoundingClientRect();
        spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `ENGELENDİ`, false, true);
      }

      aiHP -= damage;
      writeLog(`Düşman ${frontNameTR} cephesi korumasız! ${playerCard.flag} ${playerCard.name} doğrudan saldırdı!`, 'player');
      writeLog(`Yapay Zeka **${damage} HP** doğrudan hasar aldı!`, 'damage');
      
      const aiHpBarRect = aiHpBar.getBoundingClientRect();
      spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `-${damage} HP`);
      
    } else if (!playerCard && aiCard) {
      // Direct damage to Player
      let damage = aiCard.currentPower[front];
      const aCardEl = aiSlot.querySelector('.card');
      const aRect = aCardEl.getBoundingClientRect();
      
      aCardEl.classList.add('clash-slide-down');
      await delay(200);
      
      const playerSlotRect = playerSlot.getBoundingClientRect();
      spawnClashRing(playerSlotRect.left + playerSlotRect.width / 2, playerSlotRect.top + playerSlotRect.height / 2);
      spawnClashParticles(playerSlotRect.left + playerSlotRect.width / 2, playerSlotRect.top + playerSlotRect.height / 2, 'red');
      triggerScreenShake();
      
      await delay(300);
      
      if (playerLeader && playerLeader.abilityType === 'direct_damage_reduction') {
        const mitigation = Math.floor(damage * playerLeader.abilityVal);
        damage -= mitigation;
        writeLog(`🇫🇷 Emmanuel Macron yeteneği: Doğrudan hasarı %30 azalttınız!`, 'player');
        
        const playerHpBarRect = playerHpBar.getBoundingClientRect();
        spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `SAVUNULDU`, false, true);
      }

      playerHP -= damage;
      writeLog(`<i class="fa-solid fa-triangle-exclamation"></i> Kendi ${frontNameTR} cephenizi boş bıraktınız! Düşman ${aiCard.flag} ${aiCard.name} engelsiz saldırdı!`, 'ai');
      writeLog(`Komutan (Sen) **${damage} HP** ağır hasar aldın!`, 'damage');
      
      const playerHpBarRect = playerHpBar.getBoundingClientRect();
      spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `-${damage} HP`);
      
    } else {
      writeLog(`Her iki taraf da ${frontNameTR} cephesine birlik konuşlandırmadı.`, 'system');
    }
    
    updateHpDisplay();
    renderBoardAfterCombat();
    
    await delay(1250);
    
    playerSlot.classList.remove(`combat-flash-${front}`);
    aiSlot.classList.remove(`combat-flash-${front}`);
    
    if (playerHP <= 0 || aiHP <= 0) {
      break;
    }
  }

  resolveRoundEnd();
}

function handleMacronMitigation(damage, target) {
  const leader = target === 'player' ? playerLeader : aiLeader;
  if (leader && leader.abilityType === 'direct_damage_reduction') {
    const mitigation = Math.floor(damage * leader.abilityVal);
    if (target === 'player') {
      playerHP += mitigation;
      writeLog(`🇫🇷 Emmanuel Macron pasifi ile can kaybı **${mitigation} HP** azaltıldı!`, 'player');
      
      const playerHpBarRect = playerHpBar.getBoundingClientRect();
      spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `+${mitigation} HP SAVUNMA`, true);
    } else {
      aiHP += mitigation;
      writeLog(`🇫🇷 Emmanuel Macron pasifi ile AI can kaybı **${mitigation} HP** azaltıldı!`, 'ai');
      
      const aiHpBarRect = aiHpBar.getBoundingClientRect();
      spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `+${mitigation} HP SAVUNMA`, true);
    }
  }
}

// Switzerland ability: Tactical Retreat
function triggerSwissRetreat(card, front) {
  if (card.id === 'switzerland') {
    card.currentPower.land = Math.ceil(card.currentPower.land / 2);
    card.currentPower.air = Math.ceil(card.currentPower.air / 2);
    card.currentPower.sea = Math.ceil(card.currentPower.sea / 2);
    
    playerHand.push(card);
    writeLog(`🇨🇭 İsviçre "Taktiksel Çekilme" yeteneği: Kart yok edilmek yerine güçleri yarıya indirilerek elinize döndü!`, 'player');
    
    const slot = document.getElementById('player-slot-land'); // or whichever slot is active
    const rect = slot.getBoundingClientRect();
    spawnFloatingDmg(rect.left + rect.width / 2, rect.top + rect.height / 2, `ÇEKİLME`, false, true);
    spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'gold');
    
    return true;
  }
  
  return false;
}

// Japan passive: Kamikaze
function triggerKamikaze(card, owner) {
  if (card.id === 'japan') {
    if (owner === 'player') {
      aiHP -= 15;
      writeLog(`🇯🇵 Japonya "Kamikaze" etkisi: Kart imha edildiğinde rakip AI'a **15 HP** doğrudan hasar verdi!`, 'player');
      
      const aiHpBarRect = aiHpBar.getBoundingClientRect();
      spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `-15 HP KAMIKAZE`);
      
      const slot = document.getElementById('player-slot-land'); // just relative anchor
      const rect = slot.getBoundingClientRect();
      spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'red');
    } else {
      playerHP -= 15;
      writeLog(`🇯🇵 Japonya "Kamikaze" etkisi: Kart imha edildiğinde Komutana (Sana) **15 HP** doğrudan hasar verdi!`, 'ai');
      
      const playerHpBarRect = playerHpBar.getBoundingClientRect();
      spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `-15 HP KAMIKAZE`);
      
      const slot = document.getElementById('ai-slot-land');
      const rect = slot.getBoundingClientRect();
      spawnClashParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'red');
    }
    updateHpDisplay();
    triggerScreenShake();
  }
}

function renderBoardRevealed(activeFront) {
  Object.keys(board.ai).forEach(front => {
    const container = aiSlots[front];
    const card = board.ai[front];
    if (card) {
      if (front === activeFront || gameState === 'battle_resolved') {
        container.innerHTML = '';
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = getCardHTML(card, front);
        container.appendChild(cardEl);
      }
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
      if (cardEl) {
        cardEl.innerHTML = getCardHTML(card, front);
      }
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

async function resolveRoundEnd() {
  if (playerHP <= 0 || aiHP <= 0) {
    triggerGameOver();
    return;
  }
  
  const fronts = ['land', 'air', 'sea'];
  
  fronts.forEach(front => {
    const playerCard = board.player[front];
    const aiCard = board.ai[front];

    if (playerCard && playerCard.currentPower[front] <= 0) {
      triggerKamikaze(playerCard, 'player');
      board.player[front] = null;
    }
    if (aiCard && aiCard.currentPower[front] <= 0) {
      triggerKamikaze(aiCard, 'ai');
      board.ai[front] = null;
    }
  });

  // Apply Xi Jinping passive healing
  if (playerLeader && playerLeader.abilityType === 'heal_round_end') {
    playerHP = Math.min(100, playerHP + playerLeader.abilityVal);
    writeLog(`🇨🇳 Xi Jinping pasifi: Canınız **+5 HP** yenilendi!`, 'player');
    
    const playerHpBarRect = playerHpBar.getBoundingClientRect();
    spawnFloatingDmg(playerHpBarRect.left + playerHpBarRect.width / 2, playerHpBarRect.top - 30, `+5 HP`, true);
  }
  
  if (aiLeader && aiLeader.abilityType === 'heal_round_end') {
    aiHP = Math.min(100, aiHP + aiLeader.abilityVal);
    writeLog(`🇨🇳 Xi Jinping pasifi: Yapay Zeka canı **+5 HP** yenilendi!`, 'ai');
    
    const aiHpBarRect = aiHpBar.getBoundingClientRect();
    spawnFloatingDmg(aiHpBarRect.left + aiHpBarRect.width / 2, aiHpBarRect.top + 30, `+5 HP`, true);
  }

  updateHpDisplay();
  
  if (playerHP <= 0 || aiHP <= 0) {
    triggerGameOver();
    return;
  }

  round++;
  roundCounter.innerText = round;
  
  // Fill hands animated step-by-step
  writeLog("Yeni tura geçildi. Desteden kartlar çekiliyor...", 'system');
  await fillHandsAnimated();
  
  gameState = 'planning';
  selectedHandCardIdx = null;
  
  renderHand();
  renderBoard();
  
  btnBattle.disabled = false;
  btnBattle.querySelector('.btn-text').innerText = 'SAVAŞI BAŞLAT';
  
  writeLog("Planlarınızı yapın ve cepheleri savunun!", 'system');
}

function triggerGameOver() {
  gameState = 'gameover';
  statRounds.innerText = round;
  statHp.innerText = playerHP;
  
  gameOverOverlay.classList.remove('hidden');
  const modal = gameOverOverlay.querySelector('.game-over-modal');
  
  if (playerHP > 0 && aiHP <= 0) {
    modal.className = 'game-over-modal victory';
    gameOverTitle.innerText = "KÜRESEL HAKİMİYET!";
    gameOverMsg.innerText = `${playerLeader.name} liderliğinde, düşman hatlarını tamamen yerle bir ettiniz!`;
    gameOverIcon.className = "fa-solid fa-trophy trophy-icon";
    writeLog("OYUN BİTTİ: Zafer kazandınız!", 'win');
  } else if (playerHP <= 0 && aiHP > 0) {
    modal.className = 'game-over-modal defeat';
    gameOverTitle.innerText = "HEZİMET...";
    gameOverMsg.innerText = `Düşman Lider ${aiLeader.name} sizin komuta merkezinizi ele geçirdi. Ordu dağıldı.`;
    gameOverIcon.className = "fa-solid fa-circle-xmark trophy-icon text-danger";
    writeLog("OYUN BİTTİ: Yenildiniz...", 'damage');
  } else {
    modal.className = 'game-over-modal';
    gameOverTitle.innerText = "NÜKLEER KIYAMET!";
    gameOverMsg.innerText = "Karşılıklı imha protokolü devreye girdi. İki lider de yenildi.";
    gameOverIcon.className = "fa-solid fa-radiation trophy-icon";
    writeLog("OYUN BİTTİ: Berabere kalındı.", 'system');
  }
}

// Reset/Initialize Game
async function resetGame(triggerSelectionScreen = true) {
  if (triggerSelectionScreen) {
    playerLeader = null;
    aiLeader = null;
    gameState = 'leader_selection';
    
    btnBattle.disabled = true;
    btnBattle.querySelector('.btn-text').innerText = 'LİDER SEÇİLMEDİ';
    
    leaderSelectionOverlay.classList.remove('hidden');
    renderLeaderSelection();
    return;
  }
  
  playerHP = 100;
  aiHP = 100;
  round = 1;
  selectedHandCardIdx = null;
  
  board.player = { land: null, air: null, sea: null };
  board.ai = { land: null, air: null, sea: null };
  
  playerHand = [];
  aiHand = [];
  
  roundCounter.innerText = round;
  btnBattle.disabled = true;
  btnBattle.querySelector('.btn-text').innerText = 'DAĞITILIYOR...';
  
  gameOverOverlay.classList.add('hidden');
  combatLog.innerHTML = '';
  
  initDeck();
  
  updateHpDisplay();
  renderHand();
  renderBoard();
  
  writeLog(`Oyun Başladı! Kartlar dağıtılıyor...`, 'system');
  
  // Deal cards animated sequential
  await fillHandsAnimated();
  
  btnBattle.disabled = false;
  btnBattle.querySelector('.btn-text').innerText = 'SAVAŞI BAŞLAT';
  writeLog(`Birlikleriniz elinize geldi. Liderlerin pasif özellikleri devrede. Savunma hatlarınızı kurun!`, 'system');
}

// Event Listeners
btnBattle.addEventListener('click', () => {
  if (gameState !== 'planning') return;
  startBattlePhase();
});

btnRestart.addEventListener('click', () => resetGame(true));
btnPlayAgain.addEventListener('click', () => resetGame(true));

// Start initialization on page load
window.addEventListener('DOMContentLoaded', () => {
  renderLeaderSelection();
});
