// Global Firepower: Tactical Fronts - Muharebe Sahası Motoru (V5.0 "Warmap")
// Savaş başlayınca sahne komple bir muharebe haritasına dönüşür. Her kuvvet kartı
// bir birlik bütçesi verir; oyuncu TABS gibi birlik yerleştirir, sonra ordular
// gerçek zamanlı çarpışır. Oyuncu birlik seçip yönlendirir (RTS mikro), duruş
// komutları ve Komuta Puanı yetenekleriyle savaşın akışını değiştirir.
// Tasarım hedefi: beceri (kompozisyon + yerleşim + yönlendirme) > ham istatistik.

const Warmap = (() => {

  // ==========================================================================
  // Denge Tabloları
  // ==========================================================================
  const STANCES = {
    assault: { label: 'TAARRUZ', dmg: 1.35, def: 0.78, speed: 1.35, aggro: 1 },
    hold:    { label: 'MEVZİ',   dmg: 1.00, def: 1.10, speed: 1.00, aggro: 0 },
    defense: { label: 'SAVUNMA', dmg: 0.82, def: 1.42, speed: 0.70, aggro: -1 },
    retreat: { label: 'RİCAT',   dmg: 0.35, def: 1.55, speed: 1.5,  aggro: -2 }
  };

  const ABILITIES = {
    airstrike: { cost: 4, label: 'Hava Saldırısı', ground: true },
    artillery: { cost: 3, label: 'Topçu Barajı',   ground: true },
    reinforce: { cost: 5, label: 'Acil Takviye',   ground: true },
    smoke:     { cost: 2, label: 'Sis Perdesi',    ground: true },
    ew:        { cost: 3, label: 'Elektronik Harp', ground: false }
  };

  const TERRAINS = [
    { id: 'desert',   name: 'ÇÖL',    icon: '🏜', ground: 0xb89258, accent: 0xd4b072, sky: 0xd8c69a, horizon: 0x8a7048, desc: 'Açık arazi: Taarruz güçlü, siper az.', assaultBonus: 1.12, waterStyles: ['coast', 'river', 'channel'] },
    { id: 'forest',   name: 'ORMAN',  icon: '🌲', ground: 0x3c5a2c, accent: 0x4f7038, sky: 0x9fc4e0, horizon: 0x314a40, desc: 'Sık orman: Savunma güçlü, hava zayıf.', defenseBonus: 1.15, airMod: 0.9, cover: true, waterStyles: ['river', 'coast'] },
    { id: 'mountain', name: 'DAĞ',    icon: '⛰', ground: 0x6a6a70, accent: 0x84848c, sky: 0xaebccb, horizon: 0x4a4a54, desc: 'Kayalık: Zırh yavaş, hava üstünlüğü değerli.', landMod: 0.9, airMod: 1.1, waterStyles: ['river', 'channel'] },
    { id: 'snow',     name: 'KAR',    icon: '❄', ground: 0xdde6ef, accent: 0xf2f7fc, sky: 0xcdd8e6, horizon: 0x9fb0c4, desc: 'Kar fırtınası: Menziller kısaldı.', rangeMod: 0.88, waterStyles: ['coast', 'river'] },
    { id: 'urban',    name: 'ŞEHİR',  icon: '🏙', ground: 0x646771, accent: 0x7c808b, sky: 0x8f9db0, horizon: 0x3e414a, desc: 'Kent savaşı: Piyade kral, tanklar riskli.', infBonus: 1.2, tankMod: 0.85, cover: true, waterStyles: ['channel', 'coast'] }
  ];

  // Prosedürel zemin dokusu: taban renk + lekeler + gürültü + yollar
  function buildGroundTexture(terrain) {
    const W = 1024, H = 1024;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const base = '#' + terrain.ground.toString(16).padStart(6, '0');
    const acc = '#' + terrain.accent.toString(16).padStart(6, '0');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // Yamalar (aksan tonunda, yumuşak)
    for (let i = 0; i < 900; i++) {
      const r = 8 + Math.random() * 46;
      ctx.globalAlpha = 0.04 + Math.random() * 0.12;
      ctx.fillStyle = Math.random() < 0.5 ? acc : base;
      ctx.beginPath();
      ctx.ellipse(Math.random() * W, Math.random() * H, r, r * (0.5 + Math.random()), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // İnce gürültü noktacıkları
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }

    // Toprak yollar (şehir/çöl/dağ) veya patika
    if (terrain.id !== 'snow') {
      ctx.strokeStyle = terrain.id === 'urban' ? 'rgba(30,32,38,0.55)' : 'rgba(90,72,45,0.4)';
      ctx.lineWidth = terrain.id === 'urban' ? 26 : 34;
      ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        let x = Math.random() * W, y = 0;
        ctx.moveTo(x, y);
        while (y < H) { x += (Math.random() - 0.5) * 120; y += 90; ctx.lineTo(Math.max(0, Math.min(W, x)), y); }
        ctx.stroke();
      }
      if (terrain.id === 'urban') {
        // Şehir grid yolları
        ctx.strokeStyle = 'rgba(25,27,32,0.5)'; ctx.lineWidth = 16;
        for (let gx = 128; gx < W; gx += 170) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
        for (let gy = 128; gy < H; gy += 170) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      }
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = 4;
    if ('encoding' in tex) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  const EVENTS = [
    { id: 'rain',  name: 'ŞİDDETLİ YAĞMUR', icon: '🌧', desc: 'Hava birlikleri -%25.', airMod: 0.75 },
    { id: 'night', name: 'GECE MUHAREBESİ', icon: '🌙', desc: 'Menziller kısaldı, isabet düştü.', rangeMod: 0.82 },
    { id: 'fuel',  name: 'YAKIT KRİZİ',     icon: '⛽', desc: 'Ağır araçlar yavaşladı.', heavySpeed: 0.7 },
    { id: 'emi',   name: 'ELEKTRONİK PARAZİT', icon: '📡', desc: 'Komuta Puanı üretimi -%30.', cpMod: 0.7 }
  ];

  // force: hangi karttan bütçe alır | cls: kontra sınıfı | domain: ground/air/sea
  // vs: hedef sınıfına hasar çarpanı | hitsAir: havayı vurabilir mi
  const UNIT_TYPES = {
    infantry:   { force:'land', name:'Piyade Mangası', icon:'fa-person-rifle',      cls:'inf',  cost:2, hp:30,  dmg:4.5, range:6.5, speed:2.6, fire:0.95, domain:'ground', hitsAir:false, heavy:false, squad:5, vs:{ at:1.6, arty:1.4, aa:1.3, tank:0.45, apc:0.7 } },
    at:         { force:'land', name:'Tanksavar Timi', icon:'fa-crosshairs',        cls:'at',   cost:3, hp:22,  dmg:10,  range:10,  speed:2.1, fire:1.5,  domain:'ground', hitsAir:false, heavy:false, squad:3, vs:{ tank:2.4, apc:1.8, heli:1.6, inf:0.5 } },
    apc:        { force:'land', name:'ZPT',            icon:'fa-truck-ramp-box',    cls:'apc',  cost:4, hp:40,  dmg:6,   range:8,   speed:3.6, fire:0.9,  domain:'ground', hitsAir:false, heavy:true,  vs:{ inf:1.7, arty:1.4, at:1.1, tank:0.55 } },
    tank:       { force:'land', name:'Muharebe Tankı', icon:'fa-shield',            cls:'tank', cost:6, hp:70,  dmg:13,  range:9,   speed:2.7, fire:1.4,  domain:'ground', hitsAir:false, heavy:true,  vs:{ inf:1.8, apc:1.6, arty:1.7, at:1.1 } },
    artillery:  { force:'land', name:'Obüs Topçusu',   icon:'fa-explosion',         cls:'arty', cost:5, hp:26,  dmg:20,  range:26,  speed:1.1, fire:3.2,  domain:'ground', hitsAir:false, heavy:true,  arc:true, aoe:3.4, vs:{} },
    aa:         { force:'land', name:'Hava Savunma',   icon:'fa-tower-cell',        cls:'aa',   cost:4, hp:30,  dmg:15,  range:17,  speed:2.2, fire:1.1,  domain:'ground', hitsAir:true,  onlyAir:true, heavy:true, vs:{ air:2.2, heli:2.3, drone:2.8 }, groundVs:0.35 },

    fighter:    { force:'air',  name:'Savaş Uçağı',    icon:'fa-jet-fighter-up',    cls:'air',  cost:6, hp:32,  dmg:11,  range:10,  speed:7.5, fire:1.2,  domain:'air', alt:8.5, hitsAir:true, vs:{ heli:1.9, drone:2.1, air:1.2 }, groundVs:0.85 },
    helicopter: { force:'air',  name:'Taarruz Heli',   icon:'fa-helicopter',        cls:'heli', cost:5, hp:36,  dmg:12,  range:9.5, speed:3.8, fire:1.1,  domain:'air', alt:4.6, hitsAir:false, vs:{ tank:2.0, apc:1.7, at:1.2 } },
    drone:      { force:'air',  name:'İHA',            icon:'fa-plane-up',          cls:'drone',cost:3, hp:16,  dmg:7,   range:12,  speed:3.4, fire:1.5,  domain:'air', alt:6.5, hitsAir:false, vs:{ arty:1.5, at:1.3, aa:1.1 } },

    frigate:    { force:'sea',  name:'Fırkateyn',      icon:'fa-ship',              cls:'ship', cost:7, hp:80,  dmg:16,  range:28,  speed:1.2, fire:2.6,  domain:'sea', hitsAir:true, arc:true, aoe:2.8, vs:{ air:1.4, heli:1.4 } },
    gunboat:    { force:'sea',  name:'Hücumbot',       icon:'fa-sailboat',          cls:'boat', cost:4, hp:34,  dmg:11,  range:11,  speed:3.2, fire:1.0,  domain:'sea', hitsAir:false, vs:{ ship:1.9, boat:1.2 } }
  };

  const ROSTER = {
    land: ['infantry', 'at', 'apc', 'tank', 'artillery', 'aa'],
    air:  ['fighter', 'helicopter', 'drone'],
    sea:  ['frigate', 'gunboat']
  };

  const SIDE_COLOR = { player: 0x35c8f0, ai: 0xff7040 };

  // Harita sınırları (X genişlik, Z derinlik). Su düzeni araziye göre değişir (kıyı/nehir/kanal).
  const MAP = { minX: -45, maxX: 45, minZ: -34, maxZ: 34, coastX: -29, hqZ: 30 };
  let waterLayout = null; // savaş başında buildWaterLayout ile kurulur
  const waterAt = (x, z) => waterLayout ? waterLayout.test(x, z) : false;

  // Su düzeni: 'coast' (dalgalı sol kıyı), 'river' (dikey kıvrımlı kanal + yatay köprü),
  // 'channel' (eğik su bandı + köprü). river/channel haritayı böler ama köprü chokepoint bırakır.
  // Her düzen tüm z boyunca suya sahip → gemiler iki tarafın bölgesinde de konabilir.
  let forcedWaterStyle = null; // test için su düzenini sabitle
  function buildWaterLayout(terrain) {
    const styles = terrain.waterStyles || ['coast', 'river', 'channel'];
    const style = forcedWaterStyle || styles[Math.floor(Math.random() * styles.length)];
    const phase = Math.random() * Math.PI * 2;
    if (style === 'coast') {
      const edge = z => MAP.coastX + 6 + Math.sin(z * 0.11 + phase) * 5 + Math.sin(z * 0.33) * 2;
      return { style, bridge: null, edgeAt: edge, test: (x, z) => x < edge(z) };
    }
    const slope = style === 'channel' ? 30 / (MAP.maxZ - MAP.minZ) : 0;
    const amp = style === 'channel' ? 5 : 9;
    const base = style === 'channel' ? 0 : -3;
    const half = style === 'channel' ? 6 : 6.5;
    const centerAt = z => base + slope * z + Math.sin(z * 0.09 + phase) * amp + Math.sin(z * 0.031) * 3;
    const bridgeZ = -6 + Math.random() * 12;
    const bridgeHalfZ = 5;
    return {
      style, half, centerAt, bridgeZ,
      bridge: { x: centerAt(bridgeZ), z: bridgeZ, half },
      test: (x, z) => Math.abs(x - centerAt(z)) < half && Math.abs(z - bridgeZ) > bridgeHalfZ
    };
  }

  // Su-farkında nokta üreticileri (yerleştirme/AI için)
  function randomDrySpot(xMin, xMax, zMin, zMax) {
    for (let i = 0; i < 30; i++) {
      const x = xMin + Math.random() * (xMax - xMin), z = zMin + Math.random() * (zMax - zMin);
      if (!waterAt(x, z)) return { x, z };
    }
    return { x: (xMin + xMax) / 2, z: (zMin + zMax) / 2 };
  }
  function randomWetSpot(zMin, zMax) {
    for (let i = 0; i < 40; i++) {
      const x = MAP.minX + 2 + Math.random() * (MAP.maxX - MAP.minX - 4), z = zMin + Math.random() * (zMax - zMin);
      if (waterAt(x, z)) return { x, z };
    }
    // Kıyı düzeninde sol şeride düş
    return { x: MAP.minX + 4, z: (zMin + zMax) / 2 };
  }
  // En yakın kuru noktaya doğru kaç birim kaydırmalı (kara birimi steering için)
  function nearestDryX(x, z, dir) {
    for (let step = 1; step <= 30; step++) {
      const cx = x + dir * step;
      if (cx < MAP.minX || cx > MAP.maxX) break;
      if (!waterAt(cx, z)) return cx;
    }
    return null;
  }

  // Hareket adımını domain'e göre çöz: kara suya girmez (köprüye hunilenir), gemi suda kalır.
  function resolveStep(u, ox, oz, nx, nz, spd) {
    if (u.domain === 'air') return { x: nx, z: nz };
    if (u.domain === 'sea') {
      if (waterAt(nx, nz)) return { x: nx, z: nz };
      if (waterAt(ox, nz)) return { x: ox, z: nz };
      for (const dir of [-1, 1]) {
        for (let s = 1; s <= 8; s++) { if (waterAt(ox + dir * s, oz)) return { x: ox + dir * Math.min(spd, s), z: oz }; }
      }
      return { x: ox, z: oz };
    }
    // ground
    if (!waterAt(nx, nz)) return { x: nx, z: nz };
    if (!waterAt(ox, nz)) return { x: ox, z: nz };
    if (!waterAt(nx, oz)) return { x: nx, z: oz };
    // Köprüye yönel (chokepoint hunisi)
    if (waterLayout && waterLayout.bridge) {
      const b = waterLayout.bridge;
      const tz = oz + Math.sign(b.z - oz) * Math.min(spd, Math.abs(b.z - oz) || 1);
      const tx = ox + Math.sign(b.x - ox) * Math.min(spd, Math.abs(b.x - ox) || 1);
      if (!waterAt(ox, tz)) return { x: ox, z: tz };
      if (!waterAt(tx, oz)) return { x: tx, z: oz };
    }
    const dryR = nearestDryX(ox, oz, 1), dryL = nearestDryX(ox, oz, -1);
    const target = (dryR != null && (dryL == null || Math.abs(dryR - ox) < Math.abs(dryL - ox))) ? dryR : dryL;
    if (target != null) return { x: ox + Math.sign(target - ox) * Math.min(spd, Math.abs(target - ox)), z: oz };
    return { x: ox, z: oz };
  }

  // ==========================================================================
  // Durum
  // ==========================================================================
  let S = null;
  let rootGroup = null;
  let mapGroup = null;
  const projectiles = [];
  const tracers = [];
  const corpses = [];
  let canvas = null;
  let listenersBound = false;
  let timeScale = 1;

  // Kamera durumu (daha yakın, sinematik)
  const cam = { cx: 0, cz: 4, dist: 30, height: 25, targetDist: 30, targetHeight: 25 };

  const UNIT_SCALE = 1.75;       // birlikler ekranda büyük görünsün
  const MAX_UNITS_PER_SIDE = 14; // az sayıda "kahraman" birlik
  const overheadList = [];       // billboard'lanacak baş-üstü (bayrak+can barı) grupları
  const pan = { up: false, down: false, left: false, right: false };

  // Seçim / emir
  let selection = [];
  let dragStart = null;
  let dragCur = null;
  let midDragging = false;
  let lastMid = null;

  // ==========================================================================
  // Yardımcılar
  // ==========================================================================
  function terrainMod(key, def = 1) { return S && S.terrain[key] !== undefined ? S.terrain[key] : def; }
  function eventMod(key, def = 1) { return S && S.event && S.event[key] !== undefined ? S.event[key] : def; }

  function makeSelDecal() {
    const g = new THREE.RingGeometry(0.7, 0.9, 20);
    const m = new THREE.MeshBasicMaterial({ color: 0x39ff9a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(g, m);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    return ring;
  }

  // ==========================================================================
  // Harita Üretimi
  // ==========================================================================
  function buildMap(terrain) {
    mapGroup = new THREE.Group();
    rootGroup.add(mapGroup);

    // Gökyüzü kubbesi (arazi tonuna uyan degrade) + derinlik sisi
    const skyColor = terrain.sky || 0x9fb8d8;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(200, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: { top: { value: new THREE.Color(skyColor) }, bot: { value: new THREE.Color(terrain.horizon || 0x2a3446) } },
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 bot; void main(){ float h = clamp((normalize(vP).y+0.15)/0.9, 0.0, 1.0); gl_FragColor = vec4(mix(bot, top, h), 1.0); }'
      })
    );
    mapGroup.add(sky);
    Scene3D.setFog(terrain.horizon || 0x2a3446, 0.006);

    // Zemin — prosedürel doku (çim/kum/asfalt lekeleri + yollar + gürültü)
    const groundTex = buildGroundTexture(terrain);
    const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.98, metalness: 0.0 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP.maxX - MAP.minX, MAP.maxZ - MAP.minZ, 1, 1), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set((MAP.minX + MAP.maxX) / 2, 0, 0);
    ground.receiveShadow = true;
    mapGroup.add(ground);

    // Su düzeni (araziye göre kıyı/nehir/kanal) — hücre-tabanlı birleşik mesh
    S = S || {};
    waterLayout = buildWaterLayout(terrain);
    if (S) S.water = waterLayout;
    const step = 2, wv = [], wIdx = [];
    let vi = 0;
    for (let cx = MAP.minX; cx < MAP.maxX; cx += step) {
      for (let cz = MAP.minZ; cz < MAP.maxZ; cz += step) {
        if (!waterAt(cx + step / 2, cz + step / 2)) continue;
        const x0 = cx, x1 = cx + step, z0 = cz, z1 = cz + step;
        wv.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1);
        wIdx.push(vi, vi + 2, vi + 1, vi, vi + 3, vi + 2);
        vi += 4;
      }
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3));
    wg.setIndex(wIdx);
    wg.computeVertexNormals();
    const water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({
      color: 0x1b4a86, transparent: true, opacity: 0.9, roughness: 0.3, metalness: 0.4, side: THREE.DoubleSide
    }));
    water.position.y = 0.06;
    mapGroup.add(water);
    mapGroup.userData.water = water;
    mapGroup.userData.waterBase = wg.attributes.position.array.slice();

    // Köprü/geçit güvertesi (nehir/kanal böler ama buradan geçilir)
    if (waterLayout.bridge) {
      const b = waterLayout.bridge;
      const deck = new THREE.Mesh(
        new THREE.PlaneGeometry(b.half * 2 + 6, 9),
        new THREE.MeshStandardMaterial({ color: terrain.id === 'urban' ? 0x3a3d46 : 0x8a7048, roughness: 0.95 })
      );
      deck.rotation.x = -Math.PI / 2;
      deck.position.set(b.x, 0.09, b.z);
      deck.receiveShadow = true;
      mapGroup.add(deck);
      // Geçit vurgusu (parlak kenarlar)
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(b.half * 2 + 6, 9),
        new THREE.MeshBasicMaterial({ color: 0xe7d9a8, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(b.x, 0.1, b.z);
      mapGroup.add(glow);
    }

    // Orta hat (temas hattı) — tam genişlik
    const mid = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP.maxX - MAP.minX, 0.35),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })
    );
    mid.rotation.x = -Math.PI / 2;
    mid.position.set(0, 0.05, 0);
    mapGroup.add(mid);

    // Arazi dekoru
    scatterDecor(terrain);

    // HQ bayrakları (kuru noktaya)
    const phq = randomDrySpot(-10, 10, MAP.hqZ - 2, MAP.hqZ + 2);
    const ahq = randomDrySpot(-10, 10, -MAP.hqZ - 2, -MAP.hqZ + 2);
    buildHQ('player', MAP.hqZ, phq.x);
    buildHQ('ai', -MAP.hqZ, ahq.x);

    // Yerleştirme bölge göstergeleri (tam genişlik; geçerlilik ghost ile hücre bazında gösterilir)
    S.deployDecals = {};
    ['player', 'ai'].forEach(side => {
      const zA = side === 'player' ? 6 : -6;
      const zB = side === 'player' ? MAP.maxZ - 1 : MAP.minZ + 1;
      const zone = new THREE.Mesh(
        new THREE.PlaneGeometry(MAP.maxX - MAP.minX - 2, Math.abs(zB - zA)),
        new THREE.MeshBasicMaterial({ color: SIDE_COLOR[side], transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false })
      );
      zone.rotation.x = -Math.PI / 2;
      zone.position.set(0, 0.04, (zA + zB) / 2);
      mapGroup.add(zone);
      S.deployDecals[side] = zone;
    });
  }

  function scatterDecor(terrain) {
    // Merkez koridoru (temas hattı) boş kalsın ki ordular buluşabilsin
    const inCorridor = z => Math.abs(z) < 5;
    // Su üstüne dekor koyma (nehir/kanal düzenlerinde kuru zemine düşür)
    const put = (mesh, x, z) => { if (waterAt(x, z)) return; mesh.position.set(x, mesh.position.y, z); mesh.castShadow = true; mesh.receiveShadow = true; mapGroup.add(mesh); };
    const spotX = () => MAP.minX + 4 + Math.random() * (MAP.maxX - MAP.minX - 8);
    const spotZ = () => MAP.minZ + 4 + Math.random() * (MAP.maxZ - MAP.minZ - 8);

    if (terrain.id === 'urban') {
      // Şehir: az sayıda, koyu, gölge veren bloklar (parlamasın diye koyu ton)
      const shades = [0x2b2e35, 0x33363e, 0x25282f, 0x3a3d46];
      for (let i = 0; i < 34; i++) {
        const z = spotZ(); if (inCorridor(z)) continue;
        const h = 1.4 + Math.random() * 3.2;
        const mat = new THREE.MeshStandardMaterial({ color: shades[i % shades.length], roughness: 0.85, metalness: 0.05, flatShading: true });
        const b = new THREE.Mesh(new THREE.BoxGeometry(1.3 + Math.random() * 1.2, h, 1.3 + Math.random() * 1.2), mat);
        b.position.y = h / 2;
        put(b, spotX(), z);
      }
    } else if (terrain.id === 'forest') {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 1 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e3a16, roughness: 0.95, flatShading: true });
      for (let i = 0; i < 60; i++) {
        const z = spotZ(); if (inCorridor(z) && Math.random() < 0.7) continue;
        const x = spotX();
        const th = 0.6 + Math.random() * 0.5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, th, 5), trunkMat);
        trunk.position.y = th / 2; put(trunk, x, z);
        const ch = 1.8 + Math.random() * 1.4;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.75, ch, 7), leafMat);
        cone.position.y = th + ch / 2 - 0.2; put(cone, x, z);
      }
    } else if (terrain.id === 'mountain') {
      const rockMat = new THREE.MeshStandardMaterial({ color: terrain.accent, roughness: 1, flatShading: true });
      for (let i = 0; i < 26; i++) {
        const h = 2 + Math.random() * 5;
        const r = new THREE.Mesh(new THREE.ConeGeometry(1.6 + Math.random() * 2, h, 5), rockMat);
        r.position.y = h / 2;
        r.rotation.y = Math.random() * Math.PI;
        put(r, spotX(), spotZ());
      }
    } else if (terrain.id === 'desert') {
      const duneMat = new THREE.MeshStandardMaterial({ color: terrain.accent, roughness: 1, flatShading: true });
      for (let i = 0; i < 20; i++) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 3, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), duneMat);
        d.scale.y = 0.3;
        put(d, spotX(), spotZ());
      }
    } else if (terrain.id === 'snow') {
      const iceMat = new THREE.MeshStandardMaterial({ color: 0xbcd0e6, roughness: 0.8, flatShading: true });
      for (let i = 0; i < 18; i++) {
        const h = 1 + Math.random() * 2;
        const r = new THREE.Mesh(new THREE.ConeGeometry(1 + Math.random(), h, 5), iceMat);
        r.position.y = h / 2;
        put(r, spotX(), spotZ());
      }
    }
  }

  function buildHQ(side, z, hqx = 6) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 6), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    pole.position.y = 2.5;
    g.add(pole);
    // Bayrak (taraf renkli)
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ color: SIDE_COLOR[side], side: THREE.DoubleSide }));
    flag.position.set(1.3, 4, 0);
    g.add(flag);
    // Üs platformu
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0x1a2230, emissive: SIDE_COLOR[side], emissiveIntensity: 0.15 }));
    base.position.y = 0.15;
    g.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.06, 8, 40), new THREE.MeshBasicMaterial({ color: SIDE_COLOR[side], transparent: true, opacity: 0.6 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.32;
    g.add(ring);

    g.position.set(hqx, 0, z);
    mapGroup.add(g);
    S.hq = S.hq || {};
    S.hq[side] = { group: g, flag, pole, pos: new THREE.Vector3(hqx, 0, z), capture: 0 };
  }

  // ==========================================================================
  // Birlik Meshleri — detaylı modeller, milli renk aksanı, gölge
  // ==========================================================================
  function enableShadow(obj) { obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }

  // country: { colors:[primary,secondary], iso } — milli renkler gövde aksanında
  function buildUnitMesh(type, side, country) {
    const g = new THREE.Group();
    const nat = (country && country.colors) ? country.colors[0] : (side === 'player' ? 0x2a6f97 : 0x8a3b2a);
    const nat2 = (country && country.colors) ? country.colors[1] : 0xdddddd;

    // Nötr askeri gövde (arazi bağımsız koyu zeytin/gri) + milli aksan
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x3a4033, metalness: 0.25, roughness: 0.7 });
    const accentMat = new THREE.MeshStandardMaterial({ color: nat, metalness: 0.3, roughness: 0.55 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x22261e, metalness: 0.3, roughness: 0.6 });
    const trimMat = new THREE.MeshStandardMaterial({ color: nat2, metalness: 0.3, roughness: 0.5 });
    g.userData.mat = accentMat; // hasar tonlaması aksana uygulanır

    const M = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; };

    if (type === 'infantry') {
      // 4 asker + bayraktar
      for (let i = 0; i < 4; i++) {
        const bx = (i - 1.5) * 0.32, bz = (i % 2) * 0.3 - 0.15;
        M(new THREE.CylinderGeometry(0.1, 0.13, 0.44, 8), hullMat, bx, 0.26, bz);      // gövde
        M(new THREE.SphereGeometry(0.11, 8, 6), accentMat, bx, 0.54, bz);              // miğfer (milli)
        const rifle = M(new THREE.BoxGeometry(0.05, 0.05, 0.4), darkMat, bx + 0.12, 0.32, bz + 0.1);
        rifle.rotation.x = 0.3;
      }
    } else if (type === 'at') {
      for (let i = 0; i < 2; i++) {
        const bx = (i - 0.5) * 0.5;
        M(new THREE.CylinderGeometry(0.11, 0.14, 0.46, 8), hullMat, bx, 0.27, 0);
        M(new THREE.SphereGeometry(0.11, 8, 6), accentMat, bx, 0.56, 0);
        const tube = M(new THREE.CylinderGeometry(0.06, 0.07, 0.85, 8), darkMat, bx, 0.55, 0.25);
        tube.rotation.x = Math.PI / 2 - 0.2;
      }
    } else if (type === 'apc') {
      const hull = M(new THREE.BoxGeometry(0.66, 0.36, 1.05), hullMat, 0, 0.32, 0);
      // eğimli ön zırh
      const nose = M(new THREE.BoxGeometry(0.66, 0.3, 0.3), hullMat, 0, 0.26, 0.6); nose.rotation.x = -0.4;
      M(new THREE.BoxGeometry(0.34, 0.18, 0.34), accentMat, 0, 0.56, -0.1);  // taret (milli)
      M(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), darkMat, 0, 0.58, 0.2).rotation.x = Math.PI / 2;
      wheels(g, darkMat, 0.36, [-0.4, 0, 0.4]);
    } else if (type === 'tank') {
      M(new THREE.BoxGeometry(0.82, 0.3, 1.2), hullMat, 0, 0.32, 0);            // gövde
      M(new THREE.BoxGeometry(0.86, 0.14, 1.26), darkMat, 0, 0.18, 0);         // palet kaidesi
      const turret = M(new THREE.BoxGeometry(0.52, 0.26, 0.62), accentMat, 0, 0.56, -0.05); // taret (milli)
      const mantlet = M(new THREE.BoxGeometry(0.2, 0.16, 0.2), darkMat, 0, 0.56, 0.28);
      const barrel = M(new THREE.CylinderGeometry(0.055, 0.06, 0.95, 8), darkMat, 0, 0.56, 0.72); barrel.rotation.x = Math.PI / 2;
      g.userData.turret = turret;
    } else if (type === 'artillery') {
      M(new THREE.BoxGeometry(0.66, 0.32, 1.0), hullMat, 0, 0.3, 0);
      M(new THREE.BoxGeometry(0.3, 0.2, 0.34), accentMat, 0, 0.52, -0.15);
      const barrel = M(new THREE.CylinderGeometry(0.07, 0.08, 1.5, 8), darkMat, 0, 0.7, 0.25); barrel.rotation.x = Math.PI / 3;
      wheels(g, darkMat, 0.34, [-0.35, 0.1, 0.4]);
      g.userData.barrel = barrel;
    } else if (type === 'aa') {
      M(new THREE.BoxGeometry(0.62, 0.34, 0.9), hullMat, 0, 0.3, 0);
      const rot = M(new THREE.BoxGeometry(0.36, 0.2, 0.36), accentMat, 0, 0.56, 0);   // dönen kule
      // füze rampası
      M(new THREE.BoxGeometry(0.1, 0.1, 0.5), darkMat, -0.14, 0.66, 0.1).rotation.x = -0.5;
      M(new THREE.BoxGeometry(0.1, 0.1, 0.5), darkMat, 0.14, 0.66, 0.1).rotation.x = -0.5;
      const radar = M(new THREE.BoxGeometry(0.44, 0.06, 0.28), trimMat, 0, 0.76, -0.1); radar.rotation.z = 0.35;
      wheels(g, darkMat, 0.34, [-0.35, 0.05, 0.4]);
      g.userData.radar = radar; g.userData.turret = rot;
    } else if (type === 'fighter') {
      const body = M(new THREE.ConeGeometry(0.18, 1.4, 8), accentMat, 0, 0, 0); body.rotation.x = -Math.PI / 2;
      const wing = M(new THREE.BoxGeometry(1.3, 0.05, 0.42), hullMat, 0, 0, -0.15);  // delta kanat
      wing.geometry.translate(0, 0, 0);
      M(new THREE.BoxGeometry(0.06, 0.3, 0.3), accentMat, 0, 0.15, -0.5);            // dikey kanat
      const flame = M(new THREE.ConeGeometry(0.1, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0xff9030 }), 0, 0, -0.75); flame.rotation.x = Math.PI / 2;
      g.userData.flame = flame;
    } else if (type === 'helicopter') {
      const body = M(new THREE.CylinderGeometry(0.22, 0.16, 1.0, 10), accentMat, 0, 0, 0); body.rotation.x = Math.PI / 2;
      M(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0.6, roughness: 0.2 }), 0, 0.02, 0.42); // kokpit camı
      const tail = M(new THREE.CylinderGeometry(0.06, 0.05, 0.95, 6), hullMat, 0, 0.05, -0.7); tail.rotation.x = Math.PI / 2;
      const rotor = M(new THREE.BoxGeometry(1.9, 0.03, 0.12), new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.55 }), 0, 0.34, 0);
      const trotor = M(new THREE.BoxGeometry(0.05, 0.5, 0.03), new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 }), 0, 0.12, -1.1);
      // paten iniş takımı
      M(new THREE.BoxGeometry(0.04, 0.04, 0.7), darkMat, -0.2, -0.24, 0);
      M(new THREE.BoxGeometry(0.04, 0.04, 0.7), darkMat, 0.2, -0.24, 0);
      g.userData.rotor = rotor; g.userData.trotor = trotor;
    } else if (type === 'drone') {
      M(new THREE.BoxGeometry(0.24, 0.12, 0.6), accentMat, 0, 0, 0);
      M(new THREE.BoxGeometry(1.2, 0.03, 0.16), hullMat, 0, 0.02, 0);      // düz kanat
      M(new THREE.BoxGeometry(0.3, 0.12, 0.04), hullMat, 0, 0.02, -0.28);  // kuyruk
    } else if (type === 'frigate') {
      const hull = M(new THREE.BoxGeometry(0.7, 0.32, 2.3), hullMat, 0, 0.2, 0);
      const bow = M(new THREE.BoxGeometry(0.7, 0.32, 0.5), hullMat, 0, 0.2, 1.2); bow.rotation.x = 0.3;
      M(new THREE.BoxGeometry(0.4, 0.5, 0.7), accentMat, 0, 0.6, -0.1);   // köprüüstü (milli)
      M(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), trimMat, 0, 1.0, -0.1);  // direk
      const gun = M(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), darkMat, 0, 0.42, 0.85); gun.rotation.x = Math.PI / 2;
    } else if (type === 'gunboat') {
      M(new THREE.BoxGeometry(0.46, 0.24, 1.2), hullMat, 0, 0.16, 0);
      M(new THREE.BoxGeometry(0.46, 0.2, 0.3), hullMat, 0, 0.14, 0.7).rotation.x = 0.4;
      M(new THREE.BoxGeometry(0.24, 0.22, 0.34), accentMat, 0, 0.4, -0.1);
    }

    enableShadow(g);
    return g;
  }

  // Basit tekerlek/palet dizisi
  function wheels(g, mat, spanX, zs) {
    zs.forEach(z => {
      [-1, 1].forEach(sx => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10), mat);
        w.rotation.z = Math.PI / 2;
        w.position.set(sx * spanX, 0.13, z);
        w.castShadow = true;
        g.add(w);
      });
    });
  }

  // ==========================================================================
  // Birlik Oluşturma & Yerleştirme
  // ==========================================================================
  function makeUnit(type, side, x, z) {
    const t = UNIT_TYPES[type];
    const country = S.countries && S.countries[side] ? S.countries[side][t.force] : null;

    const mesh = buildUnitMesh(type, side, country);
    mesh.scale.setScalar(UNIT_SCALE);
    const alt = t.domain === 'air' ? t.alt : 0;
    mesh.position.set(x, alt, z);
    mesh.rotation.y = side === 'player' ? Math.PI : 0;
    rootGroup.add(mesh);

    // Dost/düşman taban halkası (zeminde parlak, bloom yakalar)
    const ringY = 0.06;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9 * UNIT_SCALE, 1.15 * UNIT_SCALE, 24),
      new THREE.MeshBasicMaterial({ color: SIDE_COLOR[side], transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = ringY - alt;
    mesh.add(ring);
    mesh.userData.baseRing = ring;

    // Baş-üstü: bayrak direği + ülke bayrağı (Sprite, kameraya döner) + can barı
    const overhead = new THREE.Group();
    const topY = (t.domain === 'air' ? 1.0 : 1.5);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), new THREE.MeshBasicMaterial({ color: 0xdddddd }));
    pole.position.y = topY + 0.45;
    mesh.add(pole);
    if (country && country.iso) {
      const flagTex = Scene3D.getFlagTexture(country.iso);
      if (flagTex) {
        const flag = new THREE.Sprite(new THREE.SpriteMaterial({ map: flagTex, depthTest: true }));
        flag.scale.set(0.95, 0.62, 1);
        flag.position.set(0.5, topY + 0.75, 0);
        mesh.add(flag);
      }
    }
    // Can barı (arka + ön), kameraya döndürülür; hasar alınca görünür
    const hpGroup = new THREE.Group();
    hpGroup.position.y = topY + 0.15;
    const hpBg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.14), new THREE.MeshBasicMaterial({ color: 0x220000, transparent: true, opacity: 0.85, depthTest: false }));
    const hpFg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.12), new THREE.MeshBasicMaterial({ color: 0x39ff6a, depthTest: false }));
    hpFg.position.z = 0.001;
    hpGroup.add(hpBg, hpGroup.userData_fg = hpFg);
    hpGroup.visible = false;
    hpGroup.renderOrder = 999;
    mesh.add(hpGroup);
    mesh.userData.hpGroup = hpGroup;
    mesh.userData.hpFg = hpFg;
    overheadList.push(mesh);

    const heavySpeed = t.heavy ? eventMod('heavySpeed', 1) : 1;
    // Ulusal doktrin: birlik statlarına dengeli asimetri uygula
    const dHp = doctrineMul(country, t.cls, t.force, 'hp');
    const dDmg = doctrineMul(country, t.cls, t.force, 'dmg');
    const dRange = doctrineMul(country, t.cls, t.force, 'range');
    const dSpeed = doctrineMul(country, t.cls, t.force, 'speed');
    const maxHp = t.hp * dHp;
    return {
      id: ++S.unitCounter, type, cls: t.cls, side, force: t.force, mesh, country,
      doctrine: country ? country.doctrine : null,
      hp: maxHp, maxHp, dmg: t.dmg * dDmg, range: t.range * terrainMod('rangeMod') * eventMod('rangeMod') * dRange,
      speed: t.speed * heavySpeed * dSpeed, fire: t.fire, domain: t.domain, alt,
      cost: t.cost, cooldown: Math.random() * t.fire, muzzle: 0,
      target: null, order: null, alive: true, routing: false, dead: false,
      bob: Math.random() * Math.PI * 2, retarget: Math.random() * 0.5
    };
  }

  // Ulusal doktrin çarpanı: mods anahtarı birim sınıfı (cls) veya kuvvet (force) olabilir.
  function doctrineMul(country, cls, force, stat) {
    if (!country || !country.doctrine || !country.doctrine.mods) return 1;
    const m = country.doctrine.mods;
    let v = 1;
    if (m[cls] && m[cls][stat] != null) v *= m[cls][stat];
    // cls===force (ör. jet: cls='air', force='air') çift uygulamayı önle
    if (force !== cls && m[force] && m[force][stat] != null) v *= m[force][stat];
    return v;
  }

  function validPlacement(side, x, z, domain) {
    if (x < MAP.minX + 1 || x > MAP.maxX - 1) return false;
    const inZone = side === 'player' ? (z > 6 && z < MAP.maxZ - 1) : (z < -6 && z > MAP.minZ + 1);
    if (!inZone) return false;
    if (domain === 'sea') return waterAt(x, z);
    if (domain === 'ground') return !waterAt(x, z);
    return true; // air: her yer (kendi bölgesinde)
  }

  // Doktrin maliyet çarpanı (elit fraksiyon pahalı → az birlik). Bütçe tam sayı kalsın.
  function effCost(side, force, base) {
    const c = S.countries && S.countries[side] ? S.countries[side][force] : null;
    const mul = c && c.doctrine && c.doctrine.costMul ? c.doctrine.costMul : 1;
    return Math.round(base * mul);
  }

  function placeUnit(type, x, z) {
    const t = UNIT_TYPES[type];
    if (!t) return false;
    const cost = effCost('player', t.force, t.cost);
    const budget = S.budget.player[t.force];
    if (budget < cost) return false;
    if (sideCount('player') >= MAX_UNITS_PER_SIDE) { S.cb.onLog('Ordu kapasitesi dolu (maks 14 birlik).', 'system'); return false; }
    if (!validPlacement('player', x, z, t.domain)) return false;
    S.budget.player[t.force] -= cost;
    const u = makeUnit(type, 'player', x, z);
    S.units.push(u);
    S.cb.onBudget();
    sfx('deploy');
    return true;
  }

  function removeLastAt(x, z) {
    // Yakındaki oyuncu birimini kaldır (iade)
    let best = null, bd = 3;
    S.units.forEach(u => {
      if (u.side !== 'player' || !u.alive) return;
      const d = Math.hypot(u.mesh.position.x - x, u.mesh.position.z - z);
      if (d < bd) { bd = d; best = u; }
    });
    if (best) {
      S.budget.player[best.force] += effCost('player', best.force, UNIT_TYPES[best.type].cost);
      best.alive = false;
      rootGroup.remove(best.mesh);
      S.units = S.units.filter(u => u !== best);
      S.cb.onBudget();
      sfx('pickup');
      return true;
    }
    return false;
  }

  // AI kompozisyonu ve yerleştirmesi (side: 'ai' veya seyir modunda 'player')
  function aiPlace(side = 'ai') {
    ['land', 'air', 'sea'].forEach(force => {
      let budget = S.budget[side][force];
      const pool = ROSTER[force].filter(tp => budget >= effCost(side, force, UNIT_TYPES[tp].cost));
      if (pool.length === 0) return;

      // Zorluğa göre ağırlıklar
      const hard = S.difficulty === 'hard';
      const weights = {
        infantry: hard ? 2 : 3, at: hard ? 3 : 1.5, apc: 2, tank: hard ? 3 : 2.5,
        artillery: hard ? 2.5 : 1.5, aa: hard ? 2.5 : 1,
        fighter: 2, helicopter: hard ? 2.5 : 1.5, drone: 1.5,
        frigate: 1.5, gunboat: 1.5
      };

      // Az sayıda büyük birlik: bu kuvvete düşen birim kotası
      const forceSlots = force === 'land' ? 7 : force === 'air' ? 4 : 3;
      let placed = 0;
      let guard = 0;
      while (budget >= 2 && guard++ < 60 && sideCount(side) < MAX_UNITS_PER_SIDE && placed < forceSlots) {
        const affordable = ROSTER[force].filter(tp => budget >= effCost(side, force, UNIT_TYPES[tp].cost));
        if (affordable.length === 0) break;
        // Slot azken bütçeyi büyük birliğe yatır (az ama güçlü ordu)
        const slotsLeft = Math.min(forceSlots - placed, MAX_UNITS_PER_SIDE - sideCount(side));
        let pick;
        if (budget / Math.max(1, slotsLeft) > 5) {
          pick = affordable.reduce((a, b) => UNIT_TYPES[b].cost > UNIT_TYPES[a].cost ? b : a);
        } else {
          let total = affordable.reduce((s, tp) => s + (weights[tp] || 1), 0);
          let r = Math.random() * total; pick = affordable[0];
          for (const tp of affordable) { r -= (weights[tp] || 1); if (r <= 0) { pick = tp; break; } }
        }
        const t = UNIT_TYPES[pick];
        budget -= effCost(side, force, t.cost);
        placed++;

        // Formasyon: topçu/AA geride, tank/apc önde. Taraf işaretine göre Z yönü. Su-farkında.
        const dir = side === 'ai' ? -1 : 1;
        const backish = (pick === 'artillery' || pick === 'aa' || pick === 'frigate');
        const zC = backish ? dir * (MAP.maxZ - 3 - Math.random() * 8) : dir * (8 + Math.random() * 12);
        let x, z = zC;
        if (t.domain === 'sea') { const s = randomWetSpot(Math.min(zC, dir * 6), Math.max(zC, dir * 6)); x = s.x; z = s.z; }
        else { const s = randomDrySpot(MAP.minX + 3, MAP.maxX - 3, zC - 3, zC + 3); x = s.x; z = s.z; }
        S.units.push(makeUnit(pick, side, x, z));
      }
      S.budget[side][force] = budget;
    });
  }

  // Online Sıralı: kayıtlı bir ordu snapshot'ını sahaya kur (aiPlace yerine).
  // Snapshot'lar oyuncu bölgesinde (z>0) yakalanır; 'ai' tarafına aynalanır (z<0).
  function snapshotPlace(side, army) {
    if (!Array.isArray(army)) return;
    army.forEach(u => {
      if (!u || !UNIT_TYPES[u.type]) return;
      if (sideCount(side) >= MAX_UNITS_PER_SIDE) return;
      const x = Math.max(MAP.minX + 1, Math.min(MAP.maxX - 1, +u.x || 0));
      const z = side === 'ai' ? -Math.abs(+u.z || 8) : Math.abs(+u.z || 8);
      S.units.push(makeUnit(u.type, side, x, z));
    });
  }

  // Oyuncunun mevcut yerleşimini serialize et (havuza kaydetmek için).
  function captureArmySnapshot() {
    return S.units
      .filter(u => u.side === 'player' && u.alive)
      .map(u => ({ type: u.type, x: +u.mesh.position.x.toFixed(2), z: +u.mesh.position.z.toFixed(2), force: u.force }));
  }

  // ==========================================================================
  // Hedefleme & Ateş
  // ==========================================================================
  function canHit(attacker, target) {
    if (target.domain === 'air') {
      const t = UNIT_TYPES[attacker.type];
      return !!t.hitsAir;
    }
    return true; // kara/deniz hedefleri herkesçe vurulabilir
  }

  function threatValue(attacker, target) {
    const t = UNIT_TYPES[attacker.type];
    let v = t.vs && t.vs[target.cls] ? t.vs[target.cls] : 1;
    if (t.onlyAir && target.domain !== 'air') v = t.groundVs || 0.35;
    // Elit görev gücü: her hedefe en az counterAll (taş-kağıt-makas zayıflığı yok)
    if (attacker.doctrine && attacker.doctrine.counterAll) v = Math.max(v, attacker.doctrine.counterAll);
    return v;
  }

  function sideCount(side) {
    let c = 0;
    for (const u of S.units) if (u.side === side && u.alive) c++;
    return c;
  }

  // Namlu ateşi flaşı (kısa parlak küre + söner) — bloom yakalar
  function spawnMuzzleFlash(u) {
    if (u.muzzleMesh) return;
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 1, depthWrite: false })
    );
    // namlu ucu yaklaşık: gövdenin ön yönü
    flash.position.set(0, 0.5, 0.85);
    u.mesh.add(flash);
    u.muzzleMesh = flash;
    u.muzzle = 0.08;
  }

  // Yerde iz (scorch) — kısa ömürlü koyu daire
  function spawnScorch(x, z) {
    const d = new THREE.Mesh(
      new THREE.CircleGeometry(0.9 + Math.random() * 0.5, 16),
      new THREE.MeshBasicMaterial({ color: 0x120c08, transparent: true, opacity: 0.55, depthWrite: false })
    );
    d.rotation.x = -Math.PI / 2;
    d.position.set(x, 0.03, z);
    rootGroup.add(d);
    S.fx.scorches.push({ mesh: d, life: 8 });
  }

  function acquireTarget(u) {
    let best = null, bestScore = -Infinity;
    const ux = u.mesh.position.x, uz = u.mesh.position.z;
    for (const e of S.units) {
      if (!e.alive || e.routing || e.side === u.side) continue;
      if (!canHit(u, e)) continue;
      const d = Math.hypot(e.mesh.position.x - ux, e.mesh.position.z - uz);
      const pref = threatValue(u, e);
      // Yakın + tercih edilen sınıf öncelikli
      const score = pref * 3 - d * 0.12;
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  function damageUnit(target, amount, attackerSide) {
    if (!target.alive) return;
    target.hp -= amount;
    // Hasar tonu koyulaşsın
    const ratio = Math.max(0, target.hp / target.maxHp);
    if (target.mesh.userData.mat) {
      target.mesh.userData.mat.emissiveIntensity = 0.18 * ratio + 0.05;
    }
    if (target.hp <= 0) {
      killUnit(target);
    } else if (!target.routing && ratio < 0.3 && Math.random() < 0.5) {
      // Moral bozulması → ricat (savaş dışı ama kart yaşar)
      target.routing = true;
      spawnFloatWorld(target.mesh.position, 'BOZULDU', 0xffcc33);
    }
  }

  function killUnit(u) {
    u.alive = false;
    u.dead = true;
    // Çok katmanlı patlama: ateş topu + duman
    Scene3D.worldExplode(u.mesh.position, 0xffb040, 18, 0.22, 8);
    Scene3D.worldExplode(u.mesh.position, 0x552211, 10, 0.3, 3);
    Scene3D.addShake(0.12);
    if (u.domain === 'ground') spawnScorch(u.mesh.position.x, u.mesh.position.z);
    const now = performance.now();
    if (now - S.lastBoom > 200) { S.lastBoom = now; sfx('boomSmall'); }
    // Baş-üstü öğeleri gizle, devrilme cesedi
    if (u.mesh.userData.hpGroup) u.mesh.userData.hpGroup.visible = false;
    if (u.mesh.userData.baseRing) u.mesh.userData.baseRing.visible = false;
    const oi = overheadList.indexOf(u.mesh);
    if (oi >= 0) overheadList.splice(oi, 1);
    corpses.push({ mesh: u.mesh, t: 0, dur: 0.7, startY: u.mesh.position.y });
  }

  function fireTracer(from, to, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geo, mat);
    rootGroup.add(line);
    tracers.push({ line, life: 0.09 });
    const now = performance.now();
    if (now - S.lastShot > 90) { S.lastShot = now; sfx('shot'); }
  }

  function launchShell(from, target, side, aoe) {
    const to = target.mesh.position.clone();
    const mid = from.clone().lerp(to, 0.5); mid.y += 6 + from.distanceTo(to) * 0.12;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffcc66 }));
    rootGroup.add(shell);
    projectiles.push({ mesh: shell, from: from.clone(), mid, to, t: 0, dur: 0.9 + from.distanceTo(to) * 0.012, side, aoe, target });
    if (performance.now() - S.lastShot > 120) { S.lastShot = performance.now(); sfx('artilleryWhistle'); }
  }

  // ==========================================================================
  // Komuta Puanı & Yetenekler
  // ==========================================================================
  function cpRate(side) {
    let r = 1 / (side === 'player' ? 2.4 : S.aiCpInterval);
    // Deniz üstünlüğü lojistiği hızlandırır
    const navy = S.units.filter(u => u.alive && u.side === side && u.domain === 'sea').length;
    r *= 1 + navy * 0.08;
    r *= eventMod('cpMod');
    if (S.momentum[side]) r *= S.momentum[side].cp;
    return r;
  }

  function useAbility(side, id, worldPt) {
    const ab = ABILITIES[id];
    if (!ab || S.sides[side].cp < ab.cost) return false;
    const enemy = side === 'player' ? 'ai' : 'player';

    if (id === 'airstrike') {
      if (!worldPt) return false;
      S.sides[side].cp -= ab.cost;
      Scene3D.worldExplode({ x: worldPt.x, y: 1.2, z: worldPt.z }, 0xff4422, 40, 0.24, 10);
      Scene3D.addShake(0.5);
      sfx('explosion');
      S.units.forEach(u => {
        if (u.alive && u.side === enemy) {
          const d = Math.hypot(u.mesh.position.x - worldPt.x, u.mesh.position.z - worldPt.z);
          if (d < 6) damageUnit(u, u.maxHp * (0.5 + Math.random() * 0.3), side);
        }
      });
      S.cb.onLog(`${side === 'player' ? 'Hava saldırısı çağırdın' : 'Düşman hava saldırısı'}: bölge vuruldu!`, side === 'player' ? 'player' : 'ai');
    } else if (id === 'artillery') {
      if (!worldPt) return false;
      S.sides[side].cp -= ab.cost;
      S.fx.barrages.push({ side, x: worldPt.x, z: worldPt.z, until: S.elapsed + 5, tick: 0 });
      S.cb.onLog(`Topçu barajı: hedef bölge 5 saniye dövülecek.`, side === 'player' ? 'player' : 'ai');
    } else if (id === 'reinforce') {
      S.sides[side].cp -= ab.cost;
      const baseZ = side === 'player' ? MAP.maxZ - 3 : MAP.minZ + 3;
      for (let i = 0; i < 3; i++) {
        const rx = (worldPt ? worldPt.x : 0) + (i - 1) * 2;
        const spot = waterAt(rx, baseZ) ? randomDrySpot(MAP.minX + 3, MAP.maxX - 3, baseZ - 2, baseZ + 2) : { x: Math.max(MAP.minX + 1, Math.min(MAP.maxX - 1, rx)), z: baseZ };
        S.units.push(makeUnit('infantry', side, spot.x, spot.z));
      }
      sfx('deploy');
      S.cb.onLog(`Acil takviye: taze piyade sahaya indi!`, side === 'player' ? 'player' : 'ai');
    } else if (id === 'smoke') {
      if (!worldPt) return false;
      S.sides[side].cp -= ab.cost;
      S.fx.smokes.push({ x: worldPt.x, z: worldPt.z, side, until: S.elapsed + 7 });
      spawnSmoke(worldPt.x, worldPt.z);
      S.cb.onLog(`Sis perdesi kuruldu: o bölgede isabet zorlaştı.`, side === 'player' ? 'player' : 'ai');
    } else if (id === 'ew') {
      S.sides[side].cp -= ab.cost;
      S.fx.ewUntil[enemy] = S.elapsed + 5;
      S.cb.onLog(`Elektronik harp: düşman atış hızı 5sn yavaşladı!`, side === 'player' ? 'player' : 'ai');
    } else return false;

    S.cb.onCP();
    return true;
  }

  function inSmoke(x, z) {
    return S.fx.smokes.some(s => s.until > S.elapsed && Math.hypot(s.x - x, s.z - z) < 5);
  }

  function spawnSmoke(x, z) {
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random(), 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xaab0b8, transparent: true, opacity: 0.4 }));
      puff.position.set(x + (Math.random() - 0.5) * 3, 1 + Math.random(), z + (Math.random() - 0.5) * 3);
      rootGroup.add(puff);
      S.fx.smokeMeshes.push({ mesh: puff, until: S.elapsed + 7 });
    }
  }

  function spawnFloatWorld(pos, text, color) {
    const sp = Scene3D.projectToScreen(pos.x, pos.y + 1, pos.z);
    if (sp.behind) return;
    if (typeof spawnFloatingDmg === 'function') {
      spawnFloatingDmg(sp.x, sp.y, text, color === 0x39ff88, true);
    }
  }

  // ==========================================================================
  // AI Komutan
  // ==========================================================================
  function aiThink() {
    const side = 'ai';
    let mine = 0, theirs = 0;
    S.units.forEach(u => { if (u.alive && !u.routing) { if (u.side === side) mine += u.cost; else theirs += u.cost; } });
    const ratio = theirs > 0 ? mine / theirs : 2;

    let stance = 'hold';
    if (S.aiCounters) {
      const ps = S.sides.player.stance;
      stance = ps === 'assault' ? 'hold' : ps === 'defense' ? 'assault' : 'assault';
      if (ratio < 0.6) stance = 'defense';
      else if (ratio > 1.3) stance = 'assault';
    } else {
      if (ratio > 1.25) stance = 'assault';
      else if (ratio < 0.7) stance = 'defense';
    }
    if (S.sides.ai.stance !== stance) {
      S.sides.ai.stance = stance;
      if (S.spectateBoth) S.cb.onCP();
    }

    // Yetenek: en yoğun oyuncu kümesine hava saldırısı
    if ((S.aiUsesAbilities || S.spectateBoth) && S.sides.ai.cp >= 4) {
      const cluster = densestCluster('player');
      if (cluster) useAbility('ai', 'airstrike', cluster);
      else if (S.sides.ai.cp >= 5) useAbility('ai', 'reinforce', null);
    }
  }

  function densestCluster(side) {
    const pts = S.units.filter(u => u.alive && u.side === side && u.domain !== 'air');
    if (pts.length < 3) return null;
    let best = null, bestC = 2;
    for (const p of pts) {
      let c = 0;
      for (const q of pts) if (Math.hypot(p.mesh.position.x - q.mesh.position.x, p.mesh.position.z - q.mesh.position.z) < 6) c++;
      if (c > bestC) { bestC = c; best = { x: p.mesh.position.x, z: p.mesh.position.z }; }
    }
    return best;
  }

  // ==========================================================================
  // Simülasyon Adımı
  // ==========================================================================
  function stepFight(dt) {
    S.elapsed += dt;

    // CP
    ['player', 'ai'].forEach(side => { S.sides[side].cp = Math.min(10, S.sides[side].cp + cpRate(side) * dt); });
    S.cpUi = (S.cpUi || 0) + dt;
    if (S.cpUi > 0.25) { S.cpUi = 0; S.cb.onCP(); }

    // Olay
    if (!S.eventFired && S.elapsed > 14 && S.event) {
      S.eventFired = true;
      S.cb.onBanner(`${S.event.icon} ${S.event.name}`, S.event.desc, null);
    }

    // AI
    S.aiTimer += dt;
    if (S.aiTimer > S.aiReact) { S.aiTimer = 0; aiThink(); if (S.spectateBoth) aiThinkPlayerAuto(); }

    // Topçu barajları
    for (let i = S.fx.barrages.length - 1; i >= 0; i--) {
      const b = S.fx.barrages[i];
      if (S.elapsed > b.until) { S.fx.barrages.splice(i, 1); continue; }
      b.tick += dt;
      if (b.tick > 0.4) {
        b.tick = 0;
        const px = b.x + (Math.random() - 0.5) * 5, pz = b.z + (Math.random() - 0.5) * 5;
        Scene3D.worldExplode({ x: px, y: 0.6, z: pz }, 0xffaa33, 10, 0.16, 6);
        const enemy = b.side === 'player' ? 'ai' : 'player';
        S.units.forEach(u => {
          if (u.alive && u.side === enemy && u.domain !== 'air' && Math.hypot(u.mesh.position.x - px, u.mesh.position.z - pz) < 2.6) {
            damageUnit(u, u.maxHp * 0.3, b.side);
          }
        });
      }
    }

    const stances = S.sides;

    // Birlikler
    for (const u of S.units) {
      if (!u.alive) continue;
      const st = STANCES[stances[u.side].stance];
      const speedMod = st.speed * eventMod('speedMod', 1);

      // Hava birimleri süzülür / rotor döner
      if (u.domain === 'air') {
        u.bob += dt * 2.4;
        u.mesh.position.y = u.alt + Math.sin(u.bob) * 0.3;
        if (u.mesh.userData.rotor) u.mesh.userData.rotor.rotation.y += dt * 30;
      }

      // Ricat: kendi kenarına kaç
      if (u.routing) {
        const homeZ = u.side === 'player' ? MAP.maxZ + 4 : MAP.minZ - 4;
        u.mesh.position.z += Math.sign(homeZ - u.mesh.position.z) * u.speed * 1.4 * dt;
        u.mesh.lookAt(u.mesh.position.x, u.mesh.position.y, homeZ);
        continue;
      }

      // Hedef tazeleme
      u.retarget -= dt;
      if (u.retarget <= 0 || (u.target && (!u.target.alive || u.target.routing))) {
        u.retarget = 0.35 + Math.random() * 0.3;
        u.target = acquireTarget(u);
      }

      // Emir (RTS hareket) — düşman menzile girene dek geçerli
      let moveGoal = null;
      if (u.order) {
        const d = Math.hypot(u.order.x - u.mesh.position.x, u.order.z - u.mesh.position.z);
        if (d < 1.2) u.order = null;
        else moveGoal = u.order;
      }

      const tgt = u.target;
      let firing = false;
      if (tgt) {
        const tx = tgt.mesh.position.x, tz = tgt.mesh.position.z;
        const d = Math.hypot(tx - u.mesh.position.x, tz - u.mesh.position.z);
        // Duruşa göre: savunma/mevzi menzilde bekler, taarruz kovalar
        const wantClose = !moveGoal && (st.aggro >= 0 || d > u.range);
        if (d > u.range * 0.92 && wantClose && !moveGoal) {
          moveGoal = { x: tx, z: tz };
        }
        if (d <= u.range) {
          // Ateş
          u.cooldown -= dt;
          const fireMul = (S.fx.ewUntil[u.side] > S.elapsed ? 1.5 : 1);
          if (u.cooldown <= 0) {
            u.cooldown = u.fire * fireMul;
            firing = true;
            u.mesh.lookAt(tx, u.mesh.position.y, tz);
            const t = UNIT_TYPES[u.type];
            let dmg = u.dmg * threatValue(u, tgt) * st.dmg / (STANCES[stances[tgt.side].stance].def);
            dmg *= (S.momentum[u.side] ? S.momentum[u.side].dmg : 1);
            if (u.domain === 'ground' && u.cls !== 'aa') dmg *= terrainMod('landMod');
            if (u.domain === 'air') dmg *= terrainMod('airMod') * eventMod('airMod');
            if (u.cls === 'inf') dmg *= terrainMod('infBonus');
            if (u.cls === 'tank') dmg *= terrainMod('tankMod');
            // Sis / arazi örtüsü: isabet düşür
            let miss = 0;
            if (inSmoke(tx, tz)) miss += 0.5;
            if (terrainMod('cover', false) && tgt.domain === 'ground') miss += 0.18;
            const muzzle = u.mesh.position.clone(); muzzle.y += 0.4;
            spawnMuzzleFlash(u);
            if (t.arc) {
              launchShell(muzzle, tgt, u.side, t.aoe);
            } else {
              fireTracer(muzzle, tgt.mesh.position.clone().setY(tgt.mesh.position.y + 0.2), SIDE_COLOR[u.side]);
              if (Math.random() > miss) damageUnit(tgt, dmg, u.side);
            }
          }
        }
      }

      // Hareket
      if (moveGoal && !firing) {
        let gx = moveGoal.x, gz = moveGoal.z;
        const ox = u.mesh.position.x, oz = u.mesh.position.z;
        const dx = gx - ox, dz = gz - oz;
        const dist = Math.hypot(dx, dz) || 1;
        const spd = u.speed * speedMod * dt;
        let nx = ox + (dx / dist) * spd;
        let nz = oz + (dz / dist) * spd;
        nx = Math.max(MAP.minX + 0.5, Math.min(MAP.maxX - 0.5, nx));
        nz = Math.max(MAP.minZ - 4, Math.min(MAP.maxZ + 4, nz));
        const step = resolveStep(u, ox, oz, nx, nz, spd);
        u.mesh.position.x = step.x;
        u.mesh.position.z = step.z;
        if (u.domain !== 'air') u.mesh.lookAt(gx, u.mesh.position.y, gz);
      }
    }

    // Mermiler (havan)
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.t += dt / p.dur;
      if (p.t >= 1) {
        const land = p.to.clone();
        Scene3D.worldExplode({ x: land.x, y: 0.5, z: land.z }, 0xffaa44, 18, 0.2, 8);
        Scene3D.addShake(0.2);
        const enemy = p.side === 'player' ? 'ai' : 'player';
        S.units.forEach(u => {
          if (u.alive && u.side === enemy && u.domain !== 'air' && Math.hypot(u.mesh.position.x - land.x, u.mesh.position.z - land.z) < p.aoe) {
            damageUnit(u, (u.maxHp * 0.35), p.side);
          }
        });
        rootGroup.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose();
        projectiles.splice(i, 1);
      } else {
        const a = p.from.clone().lerp(p.mid, p.t);
        const b = p.mid.clone().lerp(p.to, p.t);
        p.mesh.position.copy(a.lerp(b, p.t));
      }
    }

    // İzler
    for (let i = tracers.length - 1; i >= 0; i--) {
      tracers[i].life -= dt;
      if (tracers[i].life <= 0) {
        rootGroup.remove(tracers[i].line);
        tracers[i].line.geometry.dispose(); tracers[i].line.material.dispose();
        tracers.splice(i, 1);
      }
    }

    // Cesetler (devrilme)
    for (let i = corpses.length - 1; i >= 0; i--) {
      const c = corpses[i];
      c.t += dt;
      const k = Math.min(1, c.t / c.dur);
      c.mesh.rotation.z = k * 1.4;
      c.mesh.position.y = c.startY - k * 0.3;
      if (c.mesh.userData.mat) c.mesh.userData.mat.opacity = 1 - k;
      if (k >= 1) { rootGroup.remove(c.mesh); corpses.splice(i, 1); }
    }

    // Sis meshleri sönümü
    for (let i = S.fx.smokeMeshes.length - 1; i >= 0; i--) {
      const sm = S.fx.smokeMeshes[i];
      if (S.elapsed > sm.until) {
        sm.mesh.material.opacity -= dt * 0.8;
        if (sm.mesh.material.opacity <= 0) { rootGroup.remove(sm.mesh); S.fx.smokeMeshes.splice(i, 1); }
      }
    }

    // Baş-üstü bayrak/can barı kameraya döner + can barı güncellenir + namlu flaşı söner
    const camObj = Scene3D.getCamera();
    for (const u of S.units) {
      if (!u.alive) continue;
      const hpG = u.mesh.userData.hpGroup;
      if (hpG) {
        hpG.quaternion.copy(camObj.quaternion);
        const frac = Math.max(0, u.hp / u.maxHp);
        if (frac < 0.999) {
          hpG.visible = true;
          const fg = u.mesh.userData.hpFg;
          fg.scale.x = Math.max(0.02, frac);
          fg.position.x = -(1 - frac) * 0.5;
          fg.material.color.setHex(frac > 0.5 ? 0x39ff6a : frac > 0.25 ? 0xffcc33 : 0xff3b3b);
        }
      }
      // Muzzle flash sönümü
      if (u.muzzleMesh) {
        u.muzzle -= dt;
        u.muzzleMesh.material.opacity = Math.max(0, u.muzzle / 0.08);
        if (u.muzzle <= 0) { u.mesh.remove(u.muzzleMesh); u.muzzleMesh = null; }
      }
      // Rotor / turret / jet alevi
      const ud = u.mesh.userData;
      if (ud.rotor) ud.rotor.rotation.y += dt * 34;
      if (ud.trotor) ud.trotor.rotation.x += dt * 40;
      if (ud.flame) { const s = 0.8 + Math.random() * 0.5; ud.flame.scale.set(s, s, s); }
    }

    // Scorch izleri sönümü
    for (let i = S.fx.scorches.length - 1; i >= 0; i--) {
      const sc = S.fx.scorches[i];
      sc.life -= dt;
      if (sc.life < 2) sc.mesh.material.opacity = Math.max(0, 0.55 * (sc.life / 2));
      if (sc.life <= 0) { rootGroup.remove(sc.mesh); sc.mesh.geometry.dispose(); sc.mesh.material.dispose(); S.fx.scorches.splice(i, 1); }
    }

    // Su dalgası
    const water = mapGroup.userData.water;
    if (water) {
      const pos = water.geometry.attributes.position, base = mapGroup.userData.waterBase;
      const tw = (S && S.elapsed != null ? S.elapsed : performance.now() / 1000) * 1.6;
      for (let vi = 0; vi < pos.count; vi++) {
        pos.array[vi * 3 + 1] = Math.sin(tw + base[vi * 3] * 0.35 + base[vi * 3 + 2] * 0.28) * 0.16;
      }
      pos.needsUpdate = true;
    }

    // HQ yakalama
    checkHQ(dt);

    // Sayaç/durum UI
    S.countUi = (S.countUi || 0) + dt;
    if (S.countUi > 0.4) { S.countUi = 0; S.cb.onCount(counts()); }

    // Zafer kontrolü
    checkVictory();
  }

  function aiThinkPlayerAuto() {
    // Düello seyir modunda oyuncu tarafı da otomatik komuta edilir
    let mine = 0, theirs = 0;
    S.units.forEach(u => { if (u.alive && !u.routing) { if (u.side === 'player') mine += u.cost; else theirs += u.cost; } });
    const ratio = theirs > 0 ? mine / theirs : 2;
    S.sides.player.stance = ratio > 1.25 ? 'assault' : ratio < 0.7 ? 'defense' : 'hold';
    if (S.sides.player.cp >= 4) {
      const cl = densestCluster('ai');
      if (cl) useAbility('player', 'airstrike', cl);
    }
  }

  function counts() {
    let p = 0, a = 0;
    S.units.forEach(u => { if (u.alive && !u.routing) { if (u.side === 'player') p++; else a++; } });
    return { player: p, ai: a };
  }

  function sideStrength(side) {
    let s = 0;
    S.units.forEach(u => { if (u.alive && !u.routing && u.side === side) s += u.hp / u.maxHp * u.cost; });
    return s;
  }

  function checkHQ(dt) {
    ['player', 'ai'].forEach(defender => {
      const attacker = defender === 'player' ? 'ai' : 'player';
      const hq = S.hq[defender];
      const near = S.units.filter(u => u.alive && !u.routing && u.side === attacker && u.domain !== 'air' &&
        Math.hypot(u.mesh.position.x - hq.pos.x, u.mesh.position.z - hq.pos.z) < 4).length;
      if (near >= 3) {
        hq.capture += dt;
        hq.flag.material.color.setHex(near >= 3 ? SIDE_COLOR[attacker] : SIDE_COLOR[defender]);
        hq.pole.position.y = 2.5;
        hq.flag.position.y = 4 - Math.min(3.5, hq.capture / 5 * 3.5); // bayrak iniyor
        if (hq.capture >= 5 && !S.finished) {
          endBattle(attacker, true);
        }
      } else if (hq.capture > 0) {
        hq.capture = Math.max(0, hq.capture - dt * 0.5);
        hq.flag.position.y = 4 - Math.min(3.5, hq.capture / 5 * 3.5);
      }
    });
  }

  function checkVictory() {
    if (S.finished) return;
    const p = counts().player, a = counts().ai;
    if (p === 0 && a === 0) { endBattle('none', false); return; }
    if (p === 0) { endBattle('ai', false); return; }
    if (a === 0) { endBattle('player', false); return; }
    // Zaman aşımı (5 dk)
    if (S.elapsed > 300) {
      const ps = sideStrength('player'), as = sideStrength('ai');
      endBattle(Math.abs(ps - as) < 0.1 ? 'none' : (ps > as ? 'player' : 'ai'), false);
    }
  }

  // ==========================================================================
  // Sonuç
  // ==========================================================================
  function endBattle(winner, hqCaptured) {
    if (S.finished) return;
    S.finished = true;
    S.winner = winner;
    S.hqCaptured = hqCaptured;

    // Kalan güçler (kuvvet başına, kart eşlemesi için)
    const forces = { land: {}, air: {}, sea: {} };
    ['land', 'air', 'sea'].forEach(f => {
      forces[f].playerOrig = S.orig.player[f];
      forces[f].aiOrig = S.orig.ai[f];
      forces[f].player = 0; forces[f].ai = 0;
    });
    S.units.forEach(u => {
      if (u.alive) {
        const w = u.hp / u.maxHp * u.cost;
        forces[u.force][u.side] += w * (u.routing ? 0.6 : 1);
      }
    });

    const result = {
      winner, hqCaptured,
      forces,
      totalPlayer: sideStrength('player'),
      totalAi: sideStrength('ai'),
      playerArmy: S.capturedArmy || []
    };

    setTimeout(() => finish(result), 1400);
  }

  function finish(result) {
    Scene3D.setTicker(null);
    unbindInput();
    // Temizlik
    const grp = rootGroup;
    setTimeout(() => {
      if (grp) {
        Scene3D.getScene().remove(grp);
        grp.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose && m.dispose());
        });
      }
    }, 400);
    rootGroup = null; mapGroup = null;
    projectiles.length = 0; tracers.length = 0; corpses.length = 0; selection = []; overheadList.length = 0;
    const done = S.resolve;
    S = null;
    done(result);
  }

  // ==========================================================================
  // Kamera Kontrolü
  // ==========================================================================
  function updateCamera(dt) {
    const sp = 26 * dt;
    if (pan.left) cam.cx -= sp;
    if (pan.right) cam.cx += sp;
    if (pan.up) cam.cz -= sp;
    if (pan.down) cam.cz += sp;
    cam.cx = Math.max(-28, Math.min(28, cam.cx));
    cam.cz = Math.max(-22, Math.min(28, cam.cz));
    cam.dist += (cam.targetDist - cam.dist) * Math.min(1, dt * 6);
    cam.height += (cam.targetHeight - cam.height) * Math.min(1, dt * 6);
    Scene3D.setCamera(cam.cx, cam.height, cam.cz + cam.dist, cam.cx, 0, cam.cz - 4);
  }

  // ==========================================================================
  // Girdi (Yerleştirme + RTS)
  // ==========================================================================
  function bindInput() {
    canvas = Scene3D.getCanvas();
    if (!canvas || listenersBound) return;
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onContext);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    listenersBound = true;
  }
  function unbindInput() {
    if (!canvas || !listenersBound) return;
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('contextmenu', onContext);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    listenersBound = false;
    pan.up = pan.down = pan.left = pan.right = false;
    dragStart = null; dragCur = null; midDragging = false;
    hideSelBox();
  }

  function onContext(e) { e.preventDefault(); }
  function onWheel(e) {
    e.preventDefault();
    cam.targetDist = Math.max(16, Math.min(58, cam.targetDist + Math.sign(e.deltaY) * 4));
    cam.targetHeight = cam.targetDist * 1.28; // daha kuşbakışı açı
  }
  function onKey(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') pan.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') pan.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w') pan.up = true;
    if (e.key === 'ArrowDown' || e.key === 's') pan.down = true;
    if (e.key === 'Escape') clearSelection();
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') pan.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') pan.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w') pan.up = false;
    if (e.key === 'ArrowDown' || e.key === 's') pan.down = false;
  }

  function onDown(e) {
    if (!S) return;
    if (e.button === 1) { midDragging = true; lastMid = { x: e.clientX, y: e.clientY }; return; }

    if (S.phase === 'deploy') {
      const pt = Scene3D.raycastGround(e.clientX, e.clientY);
      if (!pt) return;
      if (e.button === 2) { removeLastAt(pt.x, pt.z); return; }
      if (S.selectedType) {
        placeUnit(S.selectedType, pt.x, pt.z);
      }
      return;
    }

    // fight fazı
    if (e.button === 2) { clearSelection(); return; }

    // Hedefli yetenek atımı
    if (S.armedAbility) {
      const pt = Scene3D.raycastGround(e.clientX, e.clientY);
      if (pt && useAbility('player', S.armedAbility, pt)) {
        S.armedAbility = null;
        S.cb.onAbilityArmed(null);
      }
      return;
    }

    // Seçili birlik varsa: sol tık = hareket emri
    if (selection.length > 0) {
      const pt = Scene3D.raycastGround(e.clientX, e.clientY);
      // Ama tıklanan yerde birlik varsa yeniden seç
      const clicked = pickUnitAt(e.clientX, e.clientY);
      if (clicked && clicked.side === 'player') { selectSingle(clicked); return; }
      if (pt) { orderMove(pt); return; }
    }

    // Seçim başlat
    dragStart = { x: e.clientX, y: e.clientY };
    dragCur = { x: e.clientX, y: e.clientY };
  }

  function onMove(e) {
    if (!S) return;
    if (midDragging && lastMid) {
      cam.cx -= (e.clientX - lastMid.x) * 0.05;
      cam.cz -= (e.clientY - lastMid.y) * 0.05;
      lastMid = { x: e.clientX, y: e.clientY };
      return;
    }
    if (S.phase === 'deploy' && S.selectedType) {
      const pt = Scene3D.raycastGround(e.clientX, e.clientY);
      updateGhost(pt);
      return;
    }
    if (dragStart) {
      dragCur = { x: e.clientX, y: e.clientY };
      updateSelBox();
    }
  }

  function onUp(e) {
    if (e.button === 1) { midDragging = false; return; }
    if (!S || S.phase !== 'fight') { dragStart = null; hideSelBox(); return; }
    if (dragStart) {
      const dx = Math.abs(e.clientX - dragStart.x), dy = Math.abs(e.clientY - dragStart.y);
      if (dx < 6 && dy < 6) {
        const u = pickUnitAt(e.clientX, e.clientY);
        if (u && u.side === 'player') selectSingle(u);
        else clearSelection();
      } else {
        boxSelect(dragStart, { x: e.clientX, y: e.clientY });
      }
      dragStart = null; dragCur = null; hideSelBox();
    }
  }

  function pickUnitAt(cx, cy) {
    let best = null, bd = 40;
    for (const u of S.units) {
      if (!u.alive) continue;
      const sp = Scene3D.projectToScreen(u.mesh.position.x, u.mesh.position.y + 0.4, u.mesh.position.z);
      if (sp.behind) continue;
      const d = Math.hypot(sp.x - cx, sp.y - cy);
      if (d < bd) { bd = d; best = u; }
    }
    return best;
  }

  function selectSingle(u) {
    clearSelection();
    selection = [u];
    attachSelDecal(u);
    S.cb.onSelection(selInfo());
  }
  function boxSelect(a, b) {
    clearSelection();
    const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x), y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
    for (const u of S.units) {
      if (!u.alive || u.side !== 'player') continue;
      const sp = Scene3D.projectToScreen(u.mesh.position.x, u.mesh.position.y + 0.4, u.mesh.position.z);
      if (sp.behind) continue;
      if (sp.x >= x1 && sp.x <= x2 && sp.y >= y1 && sp.y <= y2) { selection.push(u); attachSelDecal(u); }
    }
    S.cb.onSelection(selInfo());
    if (selection.length) sfx('click');
  }
  function attachSelDecal(u) {
    if (u.selDecal) return;
    const d = makeSelDecal();
    u.mesh.add(d);
    u.selDecal = d;
  }
  function clearSelection() {
    selection.forEach(u => { if (u.selDecal) { u.mesh.remove(u.selDecal); u.selDecal = null; } });
    selection = [];
    if (S) S.cb.onSelection(null);
  }
  function selInfo() {
    if (!selection.length) return null;
    if (selection.length === 1) {
      const u = selection[0];
      return { count: 1, name: UNIT_TYPES[u.type].name, hp: Math.round(u.hp), maxHp: u.maxHp };
    }
    return { count: selection.length, name: `${selection.length} birlik`, hp: 0, maxHp: 0 };
  }
  function orderMove(pt) {
    if (!selection.length) return;
    selection.forEach((u, i) => {
      const off = (i - (selection.length - 1) / 2) * 1.4;
      u.order = { x: pt.x + off, z: pt.z };
      u.routing = false;
    });
    spawnMoveMarker(pt);
    sfx('click');
  }
  function spawnMoveMarker(pt) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.6, 18), new THREE.MeshBasicMaterial({ color: 0x39ff9a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pt.x, 0.1, pt.z);
    rootGroup.add(ring);
    let life = 0.6;
    const iv = setInterval(() => {
      life -= 0.05;
      ring.scale.multiplyScalar(1.08);
      ring.material.opacity = life * 1.4;
      if (life <= 0) { clearInterval(iv); rootGroup && rootGroup.remove(ring); }
    }, 30);
  }

  // Yerleştirme hayaleti
  let ghost = null;
  function updateGhost(pt) {
    if (S.phase !== 'deploy' || !S.selectedType || !pt) { if (ghost) ghost.visible = false; return; }
    const t = UNIT_TYPES[S.selectedType];
    if (!ghost || ghost.userData.type !== S.selectedType) {
      if (ghost) rootGroup.remove(ghost);
      const country = S.countries && S.countries.player ? S.countries.player[t.force] : null;
      ghost = buildUnitMesh(S.selectedType, 'player', country);
      ghost.scale.setScalar(UNIT_SCALE);
      ghost.userData.type = S.selectedType;
      ghost.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.5; } });
      rootGroup.add(ghost);
    }
    ghost.visible = true;
    const y = t.domain === 'air' ? t.alt : 0;
    ghost.position.set(pt.x, y, pt.z);
    const ok = validPlacement('player', pt.x, pt.z, t.domain) && S.budget.player[t.force] >= t.cost;
    ghost.traverse(o => { if (o.material && o.material.emissive) o.material.emissive.setHex(ok ? 0x39ff88 : 0xff3333); });
  }
  function clearGhost() { if (ghost) { rootGroup.remove(ghost); ghost = null; } }

  // Seçim kutusu (DOM)
  function updateSelBox() {
    if (!dragStart || !dragCur) return;
    let box = document.getElementById('rts-selbox');
    if (!box) { box = document.createElement('div'); box.id = 'rts-selbox'; document.body.appendChild(box); }
    const x = Math.min(dragStart.x, dragCur.x), y = Math.min(dragStart.y, dragCur.y);
    box.style.cssText = `position:fixed;border:1.5px solid #39ff9a;background:rgba(57,255,154,0.12);left:${x}px;top:${y}px;width:${Math.abs(dragCur.x - dragStart.x)}px;height:${Math.abs(dragCur.y - dragStart.y)}px;z-index:60;pointer-events:none;`;
  }
  function hideSelBox() { const box = document.getElementById('rts-selbox'); if (box) box.remove(); }

  // ==========================================================================
  // Ticker
  // ==========================================================================
  function tick(dt) {
    if (!S) return;
    const sdt = Math.min(0.05, dt) * timeScale;
    updateCamera(dt);
    if (S.phase === 'deploy') {
      // Su dalgası + deploy sayaç
      S.deployTime -= dt;
      if (S.deployTime <= 0 && S.phase === 'deploy') startFight();
      S.cb.onDeployTick(Math.ceil(Math.max(0, S.deployTime)));
      const water = mapGroup && mapGroup.userData.water;
      if (water) {
        const pos = water.geometry.attributes.position, base = mapGroup.userData.waterBase;
        for (let vi = 0; vi < pos.count; vi++) pos.array[vi * 3 + 2] = Math.sin(performance.now() * 0.0016 + base[vi * 3] * 0.4) * 0.15;
        pos.needsUpdate = true;
      }
    } else if (S.phase === 'fight') {
      stepFight(sdt);
    }
  }

  // ==========================================================================
  // Faz Geçişleri
  // ==========================================================================
  function startFight() {
    if (S.phase !== 'deploy') return;
    S.phase = 'fight';
    if (S.captureArmy) S.capturedArmy = captureArmySnapshot(); // online: kullanılan orduyu sakla
    clearGhost();
    S.selectedType = null;
    // Yerleştirme bölge göstergeleri sönsün
    Object.values(S.deployDecals).forEach(d => d.material.opacity = 0.02);
    S.cb.onPhase('fight');
    S.cb.onBanner('⚔ TAARRUZ', S.terrain.desc, null);
    sfx('battle');
  }

  // ==========================================================================
  // Genel API
  // ==========================================================================
  function runBattle(config, callbacks) {
    return new Promise(resolve => {
      rootGroup = new THREE.Group();
      Scene3D.getScene().add(rootGroup);
      projectiles.length = 0; tracers.length = 0; corpses.length = 0; selection = []; overheadList.length = 0;

      const diff = config.difficulty || 'normal';
      S = {
        phase: 'deploy',
        elapsed: 0, deployTime: config.spectateBoth ? 2 : 60,
        finished: false, eventFired: false,
        terrain: config.terrain, event: config.event,
        difficulty: diff, spectateBoth: !!config.spectateBoth,
        captureArmy: !!config.captureArmy, capturedArmy: [],
        units: [], unitCounter: 0,
        budget: {
          player: { land: config.budgets.player.land, air: config.budgets.player.air, sea: config.budgets.player.sea },
          ai: { land: config.budgets.ai.land, air: config.budgets.ai.air, sea: config.budgets.ai.sea }
        },
        orig: {
          player: { ...config.budgets.player },
          ai: { ...config.budgets.ai }
        },
        countries: config.countries || { player: {}, ai: {} },
        sides: { player: { stance: 'hold', cp: 2 }, ai: { stance: 'hold', cp: diff === 'hard' ? 3 : 1 } },
        momentum: { player: { dmg: 1, cp: 1 }, ai: { dmg: 1, cp: 1 } },
        fx: { barrages: [], smokes: [], smokeMeshes: [], scorches: [], ewUntil: { player: 0, ai: 0 } },
        selectedType: null, armedAbility: null,
        aiTimer: 0, aiReact: diff === 'hard' ? 3.5 : diff === 'normal' ? 5.5 : 8,
        aiCpInterval: diff === 'hard' ? 2.2 : diff === 'normal' ? 3 : 4.2,
        aiUsesAbilities: diff !== 'easy', aiCounters: diff === 'hard',
        lastShot: 0, lastBoom: 0,
        hq: {}, cb: normalizeCallbacks(callbacks), resolve
      };

      overheadList.length = 0;
      buildMap(config.terrain);
      // Online Sıralı: rakip kayıtlı ordu snapshot'ından kurulur; yoksa yerel AI.
      if (config.opponentArmy && config.opponentArmy.length) snapshotPlace('ai', config.opponentArmy);
      else aiPlace('ai');
      if (S.spectateBoth) aiPlace('player'); // düello seyir: oyuncu ordusu da otomatik kurulur

      // Kamera başlangıcı (yakın ama kuşbakışı) — savaş başında hafif giriş süzülmesi
      cam.cx = 0; cam.cz = 4; cam.dist = 30; cam.height = 30; cam.targetDist = 34; cam.targetHeight = 42;
      Scene3D.overrideCamera(true);
      bindInput();
      Scene3D.setTicker(tick);

      S.cb.onPhase(S.spectateBoth ? 'fight_spectate' : 'deploy');
      S.cb.onBudget();
      if (S.spectateBoth) { /* deploy kısa; oyuncu da otomatik */ }
    });
  }

  function normalizeCallbacks(cb) {
    const noop = () => {};
    return {
      onLog: cb.onLog || noop, onBanner: cb.onBanner || noop,
      onCP: cb.onCP || noop, onBudget: cb.onBudget || noop,
      onCount: cb.onCount || noop, onPhase: cb.onPhase || noop,
      onDeployTick: cb.onDeployTick || noop, onSelection: cb.onSelection || noop,
      onAbilityArmed: cb.onAbilityArmed || noop
    };
  }

  // Birim kontra özeti (tooltip için): vs çarpanlarından güçlü/zayıf sınıflar
  function getUnitInfo(type) {
    const t = UNIT_TYPES[type];
    if (!t) return null;
    const strong = [], weak = [];
    if (t.vs) for (const k in t.vs) { if (t.vs[k] >= 1.3) strong.push(k); else if (t.vs[k] <= 0.7) weak.push(k); }
    if (t.hitsAir && t.onlyAir) strong.push('air');
    return { strong, weak, hitsAir: !!t.hitsAir, arc: !!t.arc, domain: t.domain };
  }

  return {
    runBattle, getUnitInfo,
    UNIT_TYPES, ROSTER, ABILITIES, STANCES,
    pickTerrain: () => TERRAINS[Math.floor(Math.random() * TERRAINS.length)],
    maybeEvent: () => Math.random() < 0.45 ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null,
    isActive: () => !!S,
    getPhase: () => S && S.phase,
    getElapsed: () => S ? S.elapsed : 0,
    selectUnitType: tp => { if (S) { S.selectedType = tp; } },
    getSelectedType: () => S && S.selectedType,
    getBudget: () => S ? S.budget.player : null,
    ready: () => { if (S && S.phase === 'deploy') startFight(); },
    setStance: st => { if (S && !S.spectateBoth && STANCES[st]) { S.sides.player.stance = st; return true; } return false; },
    getStance: () => S && S.sides.player.stance,
    getCP: () => S ? S.sides.player.cp : 0,
    armAbility: id => { if (S) { S.armedAbility = S.armedAbility === id ? null : id; return S.armedAbility; } return null; },
    useInstantAbility: id => { if (S && ABILITIES[id] && !ABILITIES[id].ground) return useAbility('player', id, null); return false; },
    getArmed: () => S && S.armedAbility,
    set _debugTimeScale(v) { timeScale = v; },
    get _debugTimeScale() { return timeScale; },
    set _debugWaterStyle(v) { forcedWaterStyle = v; },
    get _debugWaterStyle() { return waterLayout ? waterLayout.style : null; },
    _debugWaterViolations: () => {
      if (!S) return null;
      let g = 0, se = 0, alive = 0;
      S.units.forEach(u => {
        if (!u.alive) return; alive++;
        const w = waterAt(u.mesh.position.x, u.mesh.position.z);
        if (u.domain === 'ground' && w) g++;
        if (u.domain === 'sea' && !w) se++;
      });
      return { groundInWater: g, seaOnLand: se, alive };
    },
    _forceEnd: () => { if (S) endBattle(sideStrength('player') >= sideStrength('ai') ? 'player' : 'ai', false); }
  };
})();

window.Warmap = Warmap;
