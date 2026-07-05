// Global Firepower: Tactical Fronts - Gerçek Zamanlı Savaş Motoru (V4.0)
// Kartlar sayı çarpıştırmaz: her kart sahaya birlik ordusu çıkarır (tank/jet/gemi).
// Üç cephe AYNI ANDA gerçek zamanlı çarpışır; oyuncu duruş komutları ve
// Komuta Puanı yetenekleriyle savaşın ortasında karar verir.
// Tasarım hedefi: beceri > istatistik. Doğru anda doğru komut, ham güçten değerlidir.

const Battle3D = (() => {

  // ---- Denge Tabloları -------------------------------------------------------
  const STANCES = {
    assault: { label: 'TAARRUZ',  dmg: 1.42, def: 0.72, speed: 1.35 },
    hold:    { label: 'MEVZİ',    dmg: 1.00, def: 1.12, speed: 1.00 },
    defense: { label: 'SAVUNMA',  dmg: 0.78, def: 1.48, speed: 0.75 },
    retreat: { label: 'RİCAT',    dmg: 0.30, def: 1.60, speed: 1.45 }
  };

  const ABILITIES = {
    airstrike: { cost: 4, label: 'Hava Saldırısı', target: 'enemy' },
    artillery: { cost: 3, label: 'Topçu Barajı',   target: 'enemy' },
    reinforce: { cost: 5, label: 'Acil Takviye',   target: null },
    smoke:     { cost: 2, label: 'Sis Perdesi',    target: 'ally' },
    ew:        { cost: 3, label: 'Elektronik Harp', target: null }
  };

  const TERRAINS = [
    { id: 'desert',   name: 'ÇÖL',    icon: '🏜', desc: 'Açık arazi: Taarruz duruşu +%15 daha etkili.', assaultBonus: 1.15 },
    { id: 'forest',   name: 'ORMAN',  icon: '🌲', desc: 'Pusu arazisi: Savunma +%15, hava birlikleri -%10.', defenseBonus: 1.15, airMod: 0.9 },
    { id: 'mountain', name: 'DAĞ',    icon: '⛰', desc: 'Zırh etkisiz: Kara hasarı -%15, hava +%10.', landMod: 0.85, airMod: 1.1 },
    { id: 'snow',     name: 'KAR',    icon: '❄', desc: 'Ağır kış: tüm birlikler daha yavaş ateş eder.', fireRateMod: 1.15 },
    { id: 'island',   name: 'ADA',    icon: '🏝', desc: 'Deniz hakimiyeti kritik: deniz birlikleri +%20, deniz desteği ×2.', seaMod: 1.2, seaSupportMult: 2 }
  ];

  const EVENTS = [
    { id: 'rain',  name: 'ŞİDDETLİ YAĞMUR', icon: '🌧', desc: 'Hava birlikleri -%25 etkinlik.', airMod: 0.75 },
    { id: 'night', name: 'GECE MUHAREBESİ', icon: '🌙', desc: 'İsabet oranı düştü: tüm atışlar %20 daha isabetsiz.', missChance: 0.2 },
    { id: 'fuel',  name: 'YAKIT KRİZİ',     icon: '⛽', desc: 'Ağır araçlar %30 yavaşladı.', speedMod: 0.7 },
    { id: 'emi',   name: 'ELEKTRONİK PARAZİT', icon: '📡', desc: 'Komuta Puanı üretimi %30 azaldı.', cpMod: 0.7 }
  ];

  const SIDE_COLORS = { player: 0x35c8f0, ai: 0xff8040 };
  const FRONTS = ['land', 'air', 'sea'];

  // ---- Durum ------------------------------------------------------------------
  let S = null; // aktif savaş durumu
  let rootGroup = null;
  const tracers = [];

  function pickTerrain() { return TERRAINS[Math.floor(Math.random() * TERRAINS.length)]; }
  function maybePickEvent() { return Math.random() < 0.45 ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null; }

  // ---- Birlik Meshleri ----------------------------------------------------------
  function buildUnitMesh(front, side) {
    const color = SIDE_COLORS[side];
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.5, emissive: color, emissiveIntensity: 0.25 });
    const g = new THREE.Group();

    if (front === 'land') {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.7), mat);
      hull.position.y = 0.14;
      const turret = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.34), mat);
      turret.position.y = 0.31;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), mat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.31, 0.4);
      g.add(hull, turret, barrel);
    } else if (front === 'air') {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 6), mat);
      body.rotation.x = Math.PI / 2;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.2), mat);
      wing.position.z = -0.08;
      g.add(body, wing);
    } else {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 1.05), mat);
      hull.position.y = 0.1;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.3), mat);
      tower.position.y = 0.3;
      g.add(hull, tower);
    }
    return g;
  }

  function spawnUnits(front, side, power) {
    const units = [];
    if (power <= 0) return units;

    const count = Math.max(3, Math.min(8, 3 + Math.round(power / 14)));
    const L = Scene3D.layout;
    const baseZ = L.OWNER_Z[side];
    const dir = side === 'player' ? -1 : 1; // düşmana doğru ilerleme yönü
    const yBase = front === 'air' ? 3.1 : 0.05;

    for (let i = 0; i < count; i++) {
      const mesh = buildUnitMesh(front, side);
      const spreadX = L.FRONT_X[front] + (i / (count - 1 || 1) - 0.5) * 3.6;
      const z = baseZ + (Math.random() - 0.5) * 1.2 - dir * 0.4;
      mesh.position.set(spreadX, yBase + (front === 'air' ? Math.random() * 0.8 : 0), z);
      mesh.rotation.y = dir === -1 ? Math.PI : 0;
      rootGroup.add(mesh);

      units.push({
        mesh, side, front,
        hp: power / count,
        maxHp: power / count,
        dmg: (power / count) * 0.16,
        speed: (front === 'air' ? 2.6 : front === 'sea' ? 1.5 : 1.8) * (0.85 + Math.random() * 0.3),
        cooldown: Math.random() * 1.2,
        fireInterval: 0.9 + Math.random() * 0.5,
        alive: true,
        evacuated: false,
        bob: Math.random() * Math.PI * 2
      });
    }
    return units;
  }

  // ---- İzler ve Efektler ----------------------------------------------------------
  let lastShotSfx = 0, lastBoomSfx = 0;

  function fireTracer(from, to, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geo, mat);
    rootGroup.add(line);
    tracers.push({ line, life: 0.11 });

    const now = performance.now();
    if (now - lastShotSfx > 130) { lastShotSfx = now; sfx('shot'); }
  }

  function unitBoom(pos, side) {
    Scene3D.worldExplode(pos, side === 'player' ? 0xff7040 : 0x40c8ff, 16, 0.17, 6.5);
    const now = performance.now();
    if (now - lastBoomSfx > 240) { lastBoomSfx = now; sfx('boomSmall'); }
  }

  // ---- Çarpanlar --------------------------------------------------------------------
  function dmgMult(side, front) {
    const st = STANCES[S.sides[side].stance];
    let m = st.dmg;

    const T = S.terrain;
    if (S.sides[side].stance === 'assault' && T.assaultBonus) m *= T.assaultBonus;
    if (front === 'land' && T.landMod) m *= T.landMod;
    if (front === 'air' && T.airMod) m *= T.airMod;
    if (front === 'sea' && T.seaMod) m *= T.seaMod;
    if (S.event && front === 'air' && S.event.airMod) m *= S.event.airMod;

    // Birleşik kuvvet desteği: sahadaki hava gücü kara hasarını besler
    const sup = S.supports[side];
    if (front === 'land') m *= 1 + sup.air * 0.002;
    if (front === 'air') m *= 1 + sup.sea * 0.0012;

    // Momentum
    m *= S.momentum[side].dmg;
    return m;
  }

  function defMult(side) {
    const st = STANCES[S.sides[side].stance];
    let m = st.def;
    if (S.sides[side].stance === 'defense' && S.terrain.defenseBonus) m *= S.terrain.defenseBonus;
    m *= S.momentum[side].def;
    return m;
  }

  function fireIntervalMult(side) {
    let m = S.terrain.fireRateMod || 1;
    if (S.fx.ewUntil[side] > S.elapsed) m *= 1.5; // elektronik harp altında yavaş ateş
    return m;
  }

  function missChance(attackerSide, front) {
    let c = 0;
    const defender = attackerSide === 'player' ? 'ai' : 'player';
    if (S.fx.smokeUntil[defender + '-' + front] > S.elapsed) c += 0.5; // sis: savunanı vurmak zor
    if (S.event && S.event.missChance) c += S.event.missChance;
    return Math.min(0.75, c);
  }

  // ---- CP ve Yetenekler ---------------------------------------------------------------
  function cpRate(side) {
    let r = 1 / (side === 'player' ? 2.2 : S.aiCpInterval);
    r *= 1 + S.supports[side].sea * 0.002;     // deniz gücü lojistiği hızlandırır
    if (S.terrain.seaSupportMult) r *= 1 + (S.terrain.seaSupportMult - 1) * Math.min(1, S.supports[side].sea / 40);
    r *= S.momentum[side].cp;
    if (S.event && S.event.cpMod) r *= S.event.cpMod;
    return r;
  }

  function tryUseAbility(side, id, front) {
    const ab = ABILITIES[id];
    if (!ab || S.sides[side].cp < ab.cost) return false;

    const enemy = side === 'player' ? 'ai' : 'player';
    const L = Scene3D.layout;

    if (id === 'airstrike') {
      if (!front || S.fronts[front].status !== 'fighting') return false;
      S.sides[side].cp -= ab.cost;
      const targets = S.fronts[front].units[enemy].filter(u => u.alive && !u.evacuated);
      const pos = { x: L.FRONT_X[front], y: 1.4, z: L.OWNER_Z[enemy] * 0.5 };
      Scene3D.worldExplode(pos, 0xff4422, 46, 0.26, 11);
      Scene3D.addShake(0.55);
      sfx('explosion');
      targets.forEach(u => damageUnit(u, u.maxHp * (0.45 + Math.random() * 0.3), side));
      S.cb.onLog(`${side === 'player' ? 'Hava Saldırısı' : 'Düşman hava saldırısı'}: ${front === 'land' ? 'Kara' : front === 'air' ? 'Hava' : 'Deniz'} cephesi vuruldu!`, side === 'player' ? 'player' : 'ai');
    } else if (id === 'artillery') {
      if (!front || S.fronts[front].status !== 'fighting') return false;
      S.sides[side].cp -= ab.cost;
      S.fx.artillery.push({ side, front, until: S.elapsed + 5, tick: 0 });
      S.cb.onLog(`Topçu barajı başladı: ${front} cephesi 5 saniye dövülecek!`, side === 'player' ? 'player' : 'ai');
    } else if (id === 'reinforce') {
      // En zayıf kendi cephesine takviye
      let weakest = null, worst = Infinity;
      FRONTS.forEach(f => {
        if (S.fronts[f].status !== 'fighting') return;
        const mine = aliveStrength(f, side);
        if (S.fronts[f].units[side].length > 0 && mine < worst) { worst = mine; weakest = f; }
      });
      if (!weakest) return false;
      S.sides[side].cp -= ab.cost;
      const extra = spawnUnits(weakest, side, S.fronts[weakest].power[side] * 0.35);
      S.fronts[weakest].units[side].push(...extra);
      S.cb.onLog(`Acil takviye ${weakest} cephesine ulaştı!`, side === 'player' ? 'player' : 'ai');
      sfx('deploy');
    } else if (id === 'smoke') {
      if (!front || S.fronts[front].status !== 'fighting') return false;
      S.sides[side].cp -= ab.cost;
      S.fx.smokeUntil[side + '-' + front] = S.elapsed + 6;
      S.cb.onLog(`Sis perdesi: ${front} cephesindeki birliklerin isabet alması zorlaştı.`, side === 'player' ? 'player' : 'ai');
      sfx('tactic');
    } else if (id === 'ew') {
      S.sides[side].cp -= ab.cost;
      S.fx.ewUntil[enemy] = S.elapsed + 5;
      S.cb.onLog(`Elektronik harp: düşman ateş sistemleri 5 saniye yavaşladı!`, side === 'player' ? 'player' : 'ai');
      sfx('tactic');
    } else {
      return false;
    }

    S.cb.onCP();
    return true;
  }

  // ---- Hasar & Çözüm --------------------------------------------------------------------
  function damageUnit(unit, amount, attackerSide) {
    if (!unit.alive) return;
    unit.hp -= amount;
    if (unit.hp <= 0) {
      unit.alive = false;
      unitBoom(unit.mesh.position, unit.side);
      rootGroup.remove(unit.mesh);
    }
  }

  function aliveStrength(front, side) {
    return S.fronts[front].units[side].reduce((sum, u) => sum + (u.alive && !u.evacuated ? u.hp : 0), 0);
  }

  function evacStrength(front, side) {
    return S.fronts[front].units[side].reduce((sum, u) => sum + (u.evacuated ? u.hp : 0), 0);
  }

  function resolveFront(front, winner, opts = {}) {
    const F = S.fronts[front];
    if (F.status !== 'fighting') return;
    F.status = 'done';

    const loser = winner === 'player' ? 'ai' : winner === 'ai' ? 'player' : null;
    const result = {
      winner,
      loserRetreated: !!opts.retreated,
      mutual: winner === 'none' && F.power.player > 0 && F.power.ai > 0,
      winnerRemaining: winner && winner !== 'none' ? Math.round(aliveStrength(front, winner)) : 0,
      loserRemaining: loser ? Math.round(aliveStrength(front, loser) + evacStrength(front, loser)) : 0,
      playerRemaining: Math.round(aliveStrength(front, 'player') + evacStrength(front, 'player')),
      aiRemaining: Math.round(aliveStrength(front, 'ai') + evacStrength(front, 'ai')),
      hadPlayerCard: F.power.player > 0,
      hadAiCard: F.power.ai > 0,
      baseDamage: F.baseDamage
    };
    F.result = result;

    // Momentum: cepheyi kazanan taraf stratejik avantaj elde eder
    if (winner === 'player' || winner === 'ai') {
      if (front === 'air') {
        S.momentum[winner].dmg *= 1.18;
        S.cb.onBanner('✈ HAVA ÜSTÜNLÜĞÜ', `${winner === 'player' ? 'Birliklerin' : 'Düşman birlikleri'} +%18 hasar kazandı!`, winner);
      } else if (front === 'land') {
        const other = winner === 'player' ? 'ai' : 'player';
        S.momentum[other].dmg *= 0.88;
        S.cb.onBanner('⛰ SAHA KONTROLÜ', `${winner === 'player' ? 'Düşman' : 'Senin'} manevra alanı daraldı (-%12 hasar).`, winner);
      } else {
        S.momentum[winner].cp *= 1.5;
        S.cb.onBanner('⚓ LOJİSTİK AVANTAJI', `${winner === 'player' ? 'Komuta Puanın' : 'Düşman komuta puanı'} %50 hızlı dolacak!`, winner);
      }
    }

    // Kalan birlikler diğer cephelere sinematik destek: yerinde bekler
    S.cb.onFrontResolved(front, result);

    // Tüm cepheler bitti mi? (temizlik bir sonraki kareye ertelenir:
    // aktif tick, durum nesnesi ayağının altından çekilmeden tamamlanabilsin)
    if (FRONTS.every(f => S.fronts[f].status === 'done') && !S.finished) {
      S.finished = true;
      setTimeout(finishBattle, 60);
    }
  }

  function finishBattle() {
    if (!S) return;
    Scene3D.setTicker(null);

    // Meshleri temizle
    const group = rootGroup;
    setTimeout(() => {
      if (group) {
        Scene3D.getScene().remove(group);
        group.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
      }
    }, 600);
    rootGroup = null;

    const results = {};
    FRONTS.forEach(f => results[f] = S.fronts[f].result);
    const done = S.resolve;
    S = null;
    done({ fronts: results });
  }

  // ---- AI Komutanı --------------------------------------------------------------------
  function aiThink() {
    if (S.spectateBoth) {
      autoCommand('player');
    }
    autoCommand('ai');
  }

  function autoCommand(side) {
    const enemy = side === 'player' ? 'ai' : 'player';
    let mine = 0, theirs = 0;
    FRONTS.forEach(f => {
      if (S.fronts[f].status !== 'fighting') return;
      mine += aliveStrength(f, side);
      theirs += aliveStrength(f, enemy);
    });
    if (mine === 0 && theirs === 0) return;

    const ratio = theirs > 0 ? mine / theirs : 2;
    let stance = 'hold';

    if (S.aiCounters && !S.spectateBoth) {
      // Zor AI: oyuncunun duruşuna karşı hamle yapar
      const ps = S.sides.player.stance;
      stance = ps === 'assault' ? 'defense' : ps === 'defense' ? 'hold' : ps === 'retreat' ? 'assault' : 'assault';
      if (ratio < 0.6) stance = 'defense';
    } else {
      if (ratio > 1.25) stance = 'assault';
      else if (ratio < 0.75) stance = 'defense';
    }

    if (S.sides[side].stance !== stance) {
      S.sides[side].stance = stance;
      if (side === 'ai') S.cb.onLog(`Düşman komutan duruş değiştirdi: ${STANCES[stance].label}`, 'ai');
      if (S.spectateBoth) S.cb.onCP();
    }

    // Yetenek kullanımı
    if (S.aiUsesAbilities || S.spectateBoth) {
      const cp = S.sides[side].cp;
      if (cp >= 4) {
        // En güçlü düşman cephesini vur
        let best = null, bestVal = 24;
        FRONTS.forEach(f => {
          if (S.fronts[f].status !== 'fighting') return;
          const v = aliveStrength(f, enemy);
          if (v > bestVal) { bestVal = v; best = f; }
        });
        if (best) { tryUseAbility(side, 'airstrike', best); return; }
      }
      if (cp >= 5) tryUseAbility(side, 'reinforce', null);
    }
  }

  // ---- Ana Simülasyon Adımı ---------------------------------------------------------------
  function tick(dt) {
    if (!S || S.finished) return;
    S.elapsed += dt;

    // CP birikimi
    ['player', 'ai'].forEach(side => {
      S.sides[side].cp = Math.min(10, S.sides[side].cp + cpRate(side) * dt);
    });
    S.cpUiTimer = (S.cpUiTimer || 0) + dt;
    if (S.cpUiTimer > 0.25) { S.cpUiTimer = 0; S.cb.onCP(); }

    // Rastgele muharebe olayı (12. saniyede bir kez)
    if (!S.eventFired && S.elapsed > 12 && S.event) {
      S.eventFired = true;
      S.cb.onBanner(`${S.event.icon} ${S.event.name}`, S.event.desc, null);
      S.cb.onLog(`MUHAREBE OLAYI — ${S.event.name}: ${S.event.desc}`, 'ability');
    }

    // AI düşünme zamanlayıcısı
    S.aiTimer += dt;
    if (S.aiTimer >= S.aiReactSec) {
      S.aiTimer = 0;
      aiThink();
    }

    // Topçu barajları
    for (let i = S.fx.artillery.length - 1; i >= 0; i--) {
      const bar = S.fx.artillery[i];
      if (S.elapsed > bar.until || S.fronts[bar.front].status !== 'fighting') { S.fx.artillery.splice(i, 1); continue; }
      bar.tick += dt;
      if (bar.tick > 0.5) {
        bar.tick = 0;
        const enemy = bar.side === 'player' ? 'ai' : 'player';
        const targets = S.fronts[bar.front].units[enemy].filter(u => u.alive && !u.evacuated);
        if (targets.length) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          Scene3D.worldExplode(t.mesh.position, 0xffaa33, 12, 0.18, 7);
          damageUnit(t, t.maxHp * 0.22, bar.side);
        }
      }
    }

    const L = Scene3D.layout;

    // Cephe simülasyonu
    FRONTS.forEach(front => {
      const F = S.fronts[front];
      if (F.status !== 'fighting') return;

      // Hiç birlik yoksa (iki taraf da boş) hemen çözülür
      if (F.power.player <= 0 && F.power.ai <= 0) {
        resolveFront(front, 'none');
        return;
      }

      ['player', 'ai'].forEach(side => {
        const enemy = side === 'player' ? 'ai' : 'player';
        const stance = S.sides[side].stance;
        const enemies = F.units[enemy].filter(u => u.alive && !u.evacuated);
        const range = front === 'air' ? 5.2 : front === 'sea' ? 4.4 : 3.4;
        const dir = side === 'player' ? -1 : 1;
        const homeEdgeZ = side === 'player' ? 8.6 : -8.6;

        F.units[side].forEach(u => {
          if (!u.alive || u.evacuated) return;

          // Hava birimleri süzülür
          if (front === 'air') {
            u.bob += dt * 2;
            u.mesh.position.y = 3.1 + Math.sin(u.bob) * 0.25;
          }

          // RİCAT: kendi kenarına çekil; ulaşırsa birlik kurtarılır
          if (stance === 'retreat') {
            u.mesh.position.z += STANCES.retreat.speed * u.speed * dt * -dir;
            u.mesh.rotation.y = dir === -1 ? 0 : Math.PI;
            if (Math.abs(u.mesh.position.z) > Math.abs(homeEdgeZ)) {
              u.evacuated = true;
              rootGroup.remove(u.mesh);
            }
            return;
          }

          let speedMod = STANCES[stance].speed * (S.event && S.event.speedMod && front !== 'air' ? S.event.speedMod : 1);

          if (enemies.length === 0) {
            // Savunmasız cephe: düşman üssüne ilerle ve bombardımana başla
            const targetZ = L.OWNER_Z[enemy];
            if (Math.abs(u.mesh.position.z - targetZ) > 1.1) {
              u.mesh.position.z += u.speed * speedMod * dt * dir;
            } else {
              u.cooldown -= dt;
              if (u.cooldown <= 0) {
                u.cooldown = u.fireInterval * fireIntervalMult(side);
                const hit = F.power[side] * 0.045 * dmgMult(side, front);
                F.baseDamage += hit;
                fireTracer(u.mesh.position, new THREE.Vector3(L.FRONT_X[front], 1.2, targetZ), SIDE_COLORS[side]);
                S.cb.onBaseDamage(side, front, hit);
                if (F.baseDamage >= F.power[side] * 1.05) {
                  resolveFront(front, side);
                }
              }
            }
            return;
          }

          // En yakın düşmanı bul
          let target = null, bestD = Infinity;
          enemies.forEach(e => {
            const d = u.mesh.position.distanceTo(e.mesh.position);
            if (d < bestD) { bestD = d; target = e; }
          });

          if (bestD > range) {
            // Yaklaş
            const dz = Math.sign(target.mesh.position.z - u.mesh.position.z);
            u.mesh.position.z += u.speed * speedMod * dt * dz;
            const dx = target.mesh.position.x - u.mesh.position.x;
            u.mesh.position.x += Math.sign(dx) * Math.min(Math.abs(dx), u.speed * 0.4 * dt);
          } else {
            // Ateş!
            u.cooldown -= dt;
            if (u.cooldown <= 0) {
              u.cooldown = u.fireInterval * fireIntervalMult(side);
              const muzzle = u.mesh.position.clone().setY(u.mesh.position.y + 0.3);
              fireTracer(muzzle, target.mesh.position.clone().setY(target.mesh.position.y + 0.2), SIDE_COLORS[side]);

              if (Math.random() > missChance(side, front)) {
                const dmg = u.dmg * dmgMult(side, front) / defMult(enemy);
                damageUnit(target, dmg, side);
              }
            }
          }
        });
      });

      // Çözüm kontrolleri
      const pAlive = aliveStrength(front, 'player');
      const aAlive = aliveStrength(front, 'ai');
      const pHasUnits = F.units.player.length > 0;
      const aHasUnits = F.units.ai.length > 0;

      if (pHasUnits && aHasUnits) {
        const pOut = pAlive <= 0 && F.units.player.every(u => !u.alive || u.evacuated);
        const aOut = aAlive <= 0 && F.units.ai.every(u => !u.alive || u.evacuated);
        const pEvac = evacStrength(front, 'player');
        const aEvac = evacStrength(front, 'ai');

        if (pOut && aOut) {
          resolveFront(front, pEvac > 0 && aEvac === 0 ? 'ai' : aEvac > 0 && pEvac === 0 ? 'player' : 'none',
            { retreated: pEvac > 0 || aEvac > 0 });
        } else if (pOut) {
          resolveFront(front, 'ai', { retreated: pEvac > 0 });
        } else if (aOut) {
          resolveFront(front, 'player', { retreated: aEvac > 0 });
        }
      }
    });

    // İzleri söndür
    for (let i = tracers.length - 1; i >= 0; i--) {
      tracers[i].life -= dt;
      if (tracers[i].life <= 0) {
        rootGroup && rootGroup.remove(tracers[i].line);
        tracers[i].line.geometry.dispose();
        tracers[i].line.material.dispose();
        tracers.splice(i, 1);
      }
    }

    // Zaman aşımı: 42 saniyede kalan cepheler güç karşılaştırmasıyla biter
    if (S.elapsed > 42) {
      FRONTS.forEach(front => {
        const F = S.fronts[front];
        if (F.status !== 'fighting') return;
        const p = aliveStrength(front, 'player');
        const a = aliveStrength(front, 'ai');
        if (Math.abs(p - a) < Math.max(p, a) * 0.15 || (p === 0 && a === 0)) {
          resolveFront(front, 'none');
        } else {
          resolveFront(front, p > a ? 'player' : 'ai', { timeout: true });
        }
      });
    }
  }

  // ---- Genel API ---------------------------------------------------------------------------
  // config: { powers: {front: {player, ai}}, supports: {player:{air,sea}, ai:{air,sea}},
  //           difficulty, spectateBoth, terrain, event }
  // cb: { onCP, onLog, onBanner, onFrontResolved, onBaseDamage }
  function startBattle(config, cb) {
    return new Promise(resolve => {
      rootGroup = new THREE.Group();
      Scene3D.getScene().add(rootGroup);
      tracers.length = 0;

      const diff = config.difficulty || 'normal';

      S = {
        elapsed: 0,
        finished: false,
        eventFired: false,
        terrain: config.terrain,
        event: config.event,
        spectateBoth: !!config.spectateBoth,
        supports: config.supports,
        cb, resolve,
        sides: {
          player: { stance: 'hold', cp: 2 },
          ai: { stance: 'hold', cp: diff === 'hard' ? 3 : 1 }
        },
        momentum: {
          player: { dmg: 1, def: 1, cp: 1 },
          ai: { dmg: 1, def: 1, cp: 1 }
        },
        fx: { smokeUntil: {}, ewUntil: { player: 0, ai: 0 }, artillery: [] },
        fronts: {},
        aiTimer: 0,
        aiReactSec: diff === 'hard' ? 3.5 : diff === 'normal' ? 5.5 : 8,
        aiCpInterval: diff === 'hard' ? 2.0 : diff === 'normal' ? 2.8 : 4.2,
        aiUsesAbilities: diff !== 'easy',
        aiCounters: diff === 'hard'
      };

      FRONTS.forEach(front => {
        const p = config.powers[front];
        S.fronts[front] = {
          status: 'fighting',
          power: { player: p.player, ai: p.ai },
          units: {
            player: spawnUnits(front, 'player', p.player),
            ai: spawnUnits(front, 'ai', p.ai)
          },
          baseDamage: 0,
          result: null
        };
      });

      Scene3D.setTicker(tick);
    });
  }

  function setStance(stance) {
    if (!S || S.spectateBoth || !STANCES[stance]) return false;
    if (S.sides.player.stance === stance) return false;
    S.sides.player.stance = stance;
    return true;
  }

  function useAbility(id, front) {
    if (!S || S.spectateBoth) return false;
    return tryUseAbility('player', id, front);
  }

  function getState() {
    if (!S) return null;
    return {
      cp: Math.floor(S.sides.player.cp),
      cpFrac: S.sides.player.cp / 10,
      stance: S.sides.player.stance,
      elapsed: S.elapsed
    };
  }

  function isActive() { return !!S; }

  return { startBattle, setStance, useAbility, getState, isActive, pickTerrain, maybePickEvent, ABILITIES, STANCES };
})();

window.Battle3D = Battle3D;
