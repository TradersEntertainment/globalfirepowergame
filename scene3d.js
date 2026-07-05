// Global Firepower: Tactical Fronts - 3D Savaş Sahnesi Motoru (V3.0)
// Three.js (vendor/three.min.js) ile holografik komuta masası: hex cephe platformları,
// 3D kart meshleri, füze/patlama/şok dalgası efektleri ve sinematik kamera.

const Scene3D = (() => {
  // ---- Sabitler ------------------------------------------------------------
  const FRONT_X = { land: -7.2, air: 0, sea: 7.2 };
  const OWNER_Z = { player: 4.6, ai: -4.6 };
  const CARD_W = 3.1, CARD_H = 4.0, CARD_T = 0.09;
  const CARD_Y = 2.15;

  const FRONT_COLORS = {
    land: 0x7cbf4a,
    air: 0x00e5ff,
    sea: 0x5472ff
  };
  const FRONT_LABELS = { land: 'KARA CEPHESİ', air: 'HAVA CEPHESİ', sea: 'DENİZ CEPHESİ' };

  // ---- Durum ---------------------------------------------------------------
  let renderer, scene, camera, container;
  let ready = false;
  let clockPrev = 0;

  const platforms = { player: {}, ai: {} };   // owner -> front -> {group, hex, ring, state}
  const cardMeshes = { player: {}, ai: {} };  // owner -> front -> mesh group
  const tweens = [];
  const particleSystems = [];
  const transientMeshes = [];

  let slotClickCb = null;
  let hoverSlot = null;
  let externalTicker = null; // gerçek zamanlı savaş simülasyonu her karede çağrılır

  // Kamera hedef durumu
  const camTarget = { pos: new THREE.Vector3(0, 26, 26), look: new THREE.Vector3(0, 0, 0) };
  const camCurrent = { pos: new THREE.Vector3(0, 26, 26), look: new THREE.Vector3(0, 0, 0) };
  let camMode = 'menu'; // 'menu' | 'play' | 'focus'
  let shakeAmp = 0;

  // Platform vurgu durumları
  const platformFlags = {
    deploySide: null,    // 'player' | 'ai' | null
    tacticTargets: null, // {side, fronts:[]}
    emptyWarnings: []    // [{owner, front}]
  };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // ---- Yardımcılar ----------------------------------------------------------
  const EASE = {
    linear: t => t,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inCubic: t => t * t * t,
    outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    inOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    outBounce: t => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  };

  function tween(opts) {
    return new Promise(resolve => {
      tweens.push({
        start: performance.now(),
        dur: opts.dur || 500,
        ease: EASE[opts.ease || 'outCubic'],
        onUpdate: opts.onUpdate || (() => {}),
        onComplete: () => { if (opts.onComplete) opts.onComplete(); resolve(); }
      });
    });
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- Dünya Haritası Dokusu ---------------------------------------------------
  // worldmap.js içindeki Natural Earth kıta poligonlarını equirectangular çizer.
  function buildEarthTexture() {
    const W = 2048, H = 1024;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    // Okyanus
    const ocean = ctx.createLinearGradient(0, 0, 0, H);
    ocean.addColorStop(0, '#04111e');
    ocean.addColorStop(0.5, '#062033');
    ocean.addColorStop(1, '#04111e');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, W, H);

    // Enlem/boylam ızgarası
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let lon = -150; lon <= 180; lon += 30) {
      const x = (lon + 180) / 360 * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = (90 - lat) / 180 * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (typeof WORLD_LAND !== 'undefined') {
      const proj = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];

      const tracePolys = () => {
        ctx.beginPath();
        for (const ring of WORLD_LAND) {
          const [x0, y0] = proj(ring[0][0], ring[0][1]);
          ctx.moveTo(x0, y0);
          for (let i = 1; i < ring.length; i++) {
            const [x, y] = proj(ring[i][0], ring[i][1]);
            ctx.lineTo(x, y);
          }
          ctx.closePath();
        }
      };

      // Kara dolgusu
      tracePolys();
      ctx.fillStyle = 'rgba(18, 84, 105, 0.85)';
      ctx.fill();

      // Kıyı çizgisi (neon ışıma)
      tracePolys();
      ctx.shadowColor = 'rgba(0, 229, 255, 0.9)';
      ctx.shadowBlur = 7;
      ctx.strokeStyle = 'rgba(60, 220, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }

  // ---- Bayrak Önbelleği -----------------------------------------------------
  // flags/*.svg dosyalarını Image olarak yükler; kart dokularında çizilir.
  const FlagCache = {};
  function preloadFlags() {
    const sources = [];
    if (typeof COUNTRIES_DB !== 'undefined') sources.push(...COUNTRIES_DB);
    if (typeof LEADERS_DB !== 'undefined') sources.push(...LEADERS_DB);
    sources.forEach(entry => {
      if (entry.iso && !FlagCache[entry.iso]) {
        const img = new Image();
        img.src = `flags/${entry.iso}.svg`;
        FlagCache[entry.iso] = img;
      }
    });
  }

  // ---- Kart Dokuları ---------------------------------------------------------
  function drawCardFace(card, highlightFront) {
    const W = 512, H = 660;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    // Zemin
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#141c2c');
    bg.addColorStop(0.5, '#0d1320');
    bg.addColorStop(1, '#10182a');
    roundRectPath(ctx, 6, 6, W - 12, H - 12, 34);
    ctx.fillStyle = bg;
    ctx.fill();

    // Hasar durumu (temel güçten düşükse) + efsanevi (Top 10) durumu
    const anyDamaged = ['land', 'air', 'sea'].some(k =>
      typeof card[k] === 'number' && card.currentPower[k] < card[k]
    );
    const legendary = card.rank <= 10;

    // Efsanevi kartlarda altın ışıma zemini
    if (legendary) {
      const sheen = ctx.createLinearGradient(0, 0, W, H * 0.6);
      sheen.addColorStop(0, 'rgba(255, 208, 92, 0.10)');
      sheen.addColorStop(0.5, 'rgba(255, 232, 160, 0.05)');
      sheen.addColorStop(1, 'rgba(255, 208, 92, 0)');
      roundRectPath(ctx, 6, 6, W - 12, H - 12, 34);
      ctx.fillStyle = sheen;
      ctx.fill();
    }

    // Kenarlık (öncelik: hasar kızılı > efsanevi altını > cephe camgöbeği)
    roundRectPath(ctx, 6, 6, W - 12, H - 12, 34);
    ctx.lineWidth = 8;
    ctx.strokeStyle = anyDamaged
      ? 'rgba(255, 96, 80, 0.9)'
      : (legendary ? '#f7c948' : (highlightFront ? '#39d5ff' : 'rgba(120, 160, 210, 0.55)'));
    if (legendary && !anyDamaged) {
      ctx.shadowColor = 'rgba(255, 200, 80, 0.9)';
      ctx.shadowBlur = 14;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // İç ışıltı çizgisi
    roundRectPath(ctx, 18, 18, W - 36, H - 36, 26);
    ctx.lineWidth = 2;
    ctx.strokeStyle = legendary ? 'rgba(255, 210, 110, 0.35)' : 'rgba(0, 229, 255, 0.18)';
    ctx.stroke();

    // Efsanevi köşe süsleri
    if (legendary) {
      ctx.strokeStyle = 'rgba(247, 201, 72, 0.85)';
      ctx.lineWidth = 5;
      const c = 46, o = 20;
      [[o, o + c, o, o, o + c, o], [W - o, o + c, W - o, o, W - o - c, o],
       [o, H - o - c, o, H - o, o + c, H - o], [W - o, H - o - c, W - o, H - o, W - o - c, H - o]].forEach(([x1, y1, x2, y2, x3, y3]) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
      });
    }

    // Bayrak (SVG yüklüyse gerçek bayrak, değilse emoji)
    ctx.textBaseline = 'middle';
    const flagImg = card.iso ? FlagCache[card.iso] : null;
    if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
      ctx.save();
      roundRectPath(ctx, 34, 44, 100, 75, 10);
      ctx.clip();
      ctx.drawImage(flagImg, 34, 44, 100, 75);
      ctx.restore();
      roundRectPath(ctx, 34, 44, 100, 75, 10);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.stroke();
    } else {
      ctx.font = '86px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.fillText(card.flag, 34, 92);
    }

    ctx.fillStyle = '#f2f6fc';
    ctx.font = '800 52px Outfit, sans-serif';
    let name = card.name;
    while (ctx.measureText(name).width > 300 && name.length > 3) name = name.slice(0, -1);
    if (name !== card.name) name += '…';
    ctx.fillText(name, 148, 76);

    // Rank rozeti + hasar uyarısı (Top 10 → altın yıldızlı)
    ctx.font = '700 30px "JetBrains Mono", monospace';
    ctx.fillStyle = legendary ? '#f7c948' : 'rgba(255,255,255,0.45)';
    ctx.fillText(legendary ? `★ EFSANEVİ #${card.rank}` : `GFP SIRALAMA #${card.rank}`, 148, 122);
    if (anyDamaged) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff6655';
      ctx.fillText('⚠ HASARLI', W - 44, 122);
      ctx.textAlign = 'left';
    }

    // İstatistik satırları
    const rows = [
      { key: 'land', label: 'KARA',  icon: '⛰', color: '#7cbf4a' },
      { key: 'air',  label: 'HAVA',  icon: '✈', color: '#00e5ff' },
      { key: 'sea',  label: 'DENİZ', icon: '⚓', color: '#5472ff' }
    ];

    let y = 190;
    rows.forEach(row => {
      const val = card.currentPower[row.key];
      const hl = highlightFront === row.key;

      roundRectPath(ctx, 36, y, W - 72, 108, 20);
      ctx.fillStyle = hl ? row.color + '33' : 'rgba(255,255,255,0.05)';
      ctx.fill();
      if (hl) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = row.color;
        ctx.stroke();
      }

      ctx.font = '52px "Segoe UI Symbol", sans-serif';
      ctx.fillStyle = row.color;
      ctx.fillText(row.icon, 58, y + 56);

      ctx.font = '700 40px Outfit, sans-serif';
      ctx.fillStyle = hl ? row.color : 'rgba(235,242,250,0.85)';
      ctx.fillText(row.label, 130, y + 56);

      // Güç barı
      const maxBar = 70;
      const barW = Math.max(0.04, Math.min(1, val / maxBar)) * 160;
      roundRectPath(ctx, 130, y + 78, 160, 10, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fill();
      roundRectPath(ctx, 130, y + 78, barW, 10, 5);
      ctx.fillStyle = row.color;
      ctx.fill();

      const base = card[row.key];
      const rowDamaged = typeof base === 'number' && val < base;
      ctx.font = '800 64px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = (val === 0 || rowDamaged) ? '#ff5566' : (hl ? row.color : '#f2f6fc');
      ctx.fillText(String(val), W - 56, y + 56);
      if (rowDamaged) {
        ctx.font = '700 30px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ff5566';
        ctx.fillText('▼' + (base - val), W - 56, y + 94);
      }
      ctx.textAlign = 'left';

      y += 128;
    });

    // Alt açıklama
    ctx.font = '400 26px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(200,215,235,0.55)';
    let desc = card.desc;
    while (ctx.measureText(desc).width > W - 90 && desc.length > 3) desc = desc.slice(0, -1);
    if (desc !== card.desc) desc += '…';
    ctx.fillText(desc, 44, H - 52);

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }

  let cardBackTexture = null;
  function getCardBackTexture() {
    if (cardBackTexture) return cardBackTexture;
    const W = 512, H = 660;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1a1208');
    bg.addColorStop(0.5, '#0d0a06');
    bg.addColorStop(1, '#171008');
    roundRectPath(ctx, 6, 6, W - 12, H - 12, 34);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ff8c2a';
    ctx.stroke();

    // Merkez kalkan
    ctx.translate(W / 2, H / 2);
    ctx.beginPath();
    ctx.moveTo(0, -120);
    ctx.lineTo(95, -70);
    ctx.lineTo(95, 40);
    ctx.quadraticCurveTo(95, 110, 0, 150);
    ctx.quadraticCurveTo(-95, 110, -95, 40);
    ctx.lineTo(-95, -70);
    ctx.closePath();
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255, 140, 42, 0.9)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 140, 42, 0.12)';
    ctx.fill();

    ctx.fillStyle = '#ff8c2a';
    ctx.font = '800 64px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GFP', 0, 20);
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,190,120,0.7)';
    ctx.fillText('TACTICAL FRONTS', 0, 60);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Köşe devre çizgileri
    ctx.strokeStyle = 'rgba(255,140,42,0.25)';
    ctx.lineWidth = 3;
    [40, 56, 72].forEach(off => {
      ctx.beginPath(); ctx.moveTo(off, 30); ctx.lineTo(30, off); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - off, H - 30); ctx.lineTo(W - 30, H - off); ctx.stroke();
    });

    cardBackTexture = new THREE.CanvasTexture(cv);
    return cardBackTexture;
  }

  function makeFloorLabelTexture(text, colorHex) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 128;
    const ctx = cv.getContext('2d');
    ctx.font = '800 56px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const c = '#' + colorHex.toString(16).padStart(6, '0');
    ctx.shadowColor = c;
    ctx.shadowBlur = 24;
    ctx.fillStyle = c;
    ctx.fillText(text, 256, 64);
    return new THREE.CanvasTexture(cv);
  }

  // ---- Sahne Kurulumu --------------------------------------------------------
  function buildEnvironment() {
    scene.fog = new THREE.FogExp2(0x04060c, 0.016);

    // Işıklar
    scene.add(new THREE.AmbientLight(0x40506a, 0.9));
    const keyLight = new THREE.DirectionalLight(0xdfeaff, 0.85);
    keyLight.position.set(6, 22, 10);
    scene.add(keyLight);

    const playerGlow = new THREE.PointLight(0x00b4d8, 0.9, 45);
    playerGlow.position.set(0, 7, 14);
    scene.add(playerGlow);

    const aiGlow = new THREE.PointLight(0xff7b33, 0.8, 45);
    aiGlow.position.set(0, 8, -16);
    scene.add(aiGlow);

    // Zemin ızgarası (holo masa)
    const grid = new THREE.GridHelper(240, 96, 0x0e5f73, 0x0a2333);
    grid.position.y = -0.02;
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    scene.add(grid);

    // Masa diski
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(17.5, 18.5, 0.5, 64),
      new THREE.MeshStandardMaterial({ color: 0x0a1220, metalness: 0.7, roughness: 0.35, emissive: 0x061420, emissiveIntensity: 0.6 })
    );
    table.position.y = -0.3;
    scene.add(table);

    const tableRing = new THREE.Mesh(
      new THREE.TorusGeometry(17.9, 0.09, 8, 128),
      new THREE.MeshBasicMaterial({ color: 0x00b8d9, transparent: true, opacity: 0.5 })
    );
    tableRing.rotation.x = -Math.PI / 2;
    tableRing.position.y = 0.02;
    scene.add(tableRing);

    // Orta hat (cephe ayrımı)
    const midLine = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xff6a33, transparent: true, opacity: 0.4 })
    );
    midLine.rotation.x = -Math.PI / 2;
    midLine.position.y = 0.03;
    scene.add(midLine);

    // Yıldız alanı
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 120 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.7 + 2;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9fd8ff, size: 0.5, transparent: true, opacity: 0.8, sizeAttenuation: true }));
    scene.add(stars);

    // Dünya hologramı (arka merkez) — gerçek kıta haritası dokusuyla
    const earthGroup = new THREE.Group();
    const earthWire = new THREE.Mesh(
      new THREE.SphereGeometry(10.05, 28, 20),
      new THREE.MeshBasicMaterial({ color: 0x00d2ff, wireframe: true, transparent: true, opacity: 0.04 })
    );
    earthGroup.add(earthWire);
    const earthCore = new THREE.Mesh(
      new THREE.SphereGeometry(9.95, 48, 32),
      new THREE.MeshBasicMaterial({ map: buildEarthTexture(), transparent: true, opacity: 0.96 })
    );
    earthGroup.add(earthCore);
    const earthRing = new THREE.Mesh(
      new THREE.TorusGeometry(13, 0.05, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.22 })
    );
    earthRing.rotation.x = Math.PI / 2.6;
    earthGroup.add(earthRing);
    // Eğik eksen (üst grup) + içte dönen küre: kuzey yarımküre kameraya bakar
    const earthTilt = new THREE.Group();
    earthTilt.position.set(0, 4.0, -33);
    earthTilt.rotation.x = 0.62;
    earthGroup.rotation.y = -2.1; // Avrasya bölgesi kameraya dönük başlasın
    earthTilt.add(earthGroup);
    scene.add(earthTilt);
    transientEnv.earth = earthGroup;
    transientEnv.earthRadius = 10;

    // Süzülen toz partikülleri
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 260;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 46;
      dustPos[i * 3 + 1] = Math.random() * 12;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x3fb4d8, size: 0.09, transparent: true, opacity: 0.5 }));
    scene.add(dust);
    transientEnv.dust = dust;
  }

  const transientEnv = {};

  const HEX_TINTS = { land: 0x15230e, air: 0x0a2029, sea: 0x0e1633 };

  function buildPlatforms() {
    ['player', 'ai'].forEach(owner => {
      ['land', 'air', 'sea'].forEach(front => {
        const group = new THREE.Group();
        const color = FRONT_COLORS[front];

        const hex = new THREE.Mesh(
          new THREE.CylinderGeometry(2.85, 3.05, 0.42, 6),
          new THREE.MeshStandardMaterial({
            color: HEX_TINTS[front],
            metalness: 0.6,
            roughness: 0.4,
            emissive: color,
            emissiveIntensity: 0.08
          })
        );
        hex.rotation.y = Math.PI / 6;
        group.add(hex);

        // ---- Cephe tema dekorları: her cephe tek bakışta ayırt edilsin ----
        const anims = [];
        if (front === 'land') {
          // Alçak poligonlu dağ silsilesi
          const mtnMat = new THREE.MeshStandardMaterial({ color: 0x3c5c2a, roughness: 0.95, flatShading: true });
          [[-2.0, -1.2, 0.8], [-1.25, -1.8, 1.15], [1.55, -1.6, 0.95], [2.1, -0.95, 0.65]].forEach(([x, z, h]) => {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(h * 0.55, h, 5), mtnMat);
            cone.position.set(x, 0.21 + h / 2, z);
            cone.rotation.y = Math.random() * Math.PI;
            group.add(cone);
          });
        } else if (front === 'air') {
          // Jiroskop radar halkaları (dönen)
          const gyroMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
          const g1 = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.028, 6, 48), gyroMat);
          g1.rotation.x = 1.15;
          g1.position.y = 0.5;
          group.add(g1);
          const g2 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.028, 6, 48), gyroMat.clone());
          g2.rotation.x = -0.95;
          g2.rotation.z = 0.6;
          g2.position.y = 0.5;
          group.add(g2);
          anims.push({ type: 'gyro', mesh: g1, speed: 0.8 });
          anims.push({ type: 'gyro', mesh: g2, speed: -1.1 });
        } else {
          // Dalgalanan su yüzeyi
          const waterGeo = new THREE.CircleGeometry(2.45, 26);
          const water = new THREE.Mesh(
            waterGeo,
            new THREE.MeshBasicMaterial({ color: 0x2450d8, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
          );
          water.rotation.x = -Math.PI / 2;
          water.position.y = 0.24;
          group.add(water);
          anims.push({ type: 'water', geo: waterGeo, base: waterGeo.attributes.position.array.slice() });
        }

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(2.85, 0.075, 10, 64),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.26;
        group.add(ring);

        // İç halka (dönen)
        const innerRing = new THREE.Mesh(
          new THREE.TorusGeometry(2.1, 0.03, 6, 48),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28 })
        );
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.y = 0.28;
        group.add(innerRing);

        group.position.set(FRONT_X[front], 0.2, OWNER_Z[owner]);
        scene.add(group);

        hex.userData.slot = { owner, front };

        platforms[owner][front] = { group, hex, ring, innerRing, baseColor: color, anims };
      });
    });

    // Zemin cephe etiketleri (orta hat üstünde) + sütun renk şeritleri
    ['land', 'air', 'sea'].forEach(front => {
      const tex = makeFloorLabelTexture(FRONT_LABELS[front], FRONT_COLORS[front]);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(5.6, 1.4),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false })
      );
      label.rotation.x = -Math.PI / 2;
      label.position.set(FRONT_X[front], 0.05, 0);
      scene.add(label);

      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(6.0, 16.5),
        new THREE.MeshBasicMaterial({ color: FRONT_COLORS[front], transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(FRONT_X[front], 0.012, 0);
      scene.add(stripe);
    });
  }

  // ---- Kart Meshleri ---------------------------------------------------------
  function createCardMesh(card, highlightFront, hidden) {
    const faceTex = drawCardFace(card, highlightFront);
    const backTex = getCardBackTexture();

    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x1a2436, metalness: 0.5, roughness: 0.5 });
    const faceMat = new THREE.MeshBasicMaterial({ map: faceTex });
    const backMat = new THREE.MeshBasicMaterial({ map: backTex });

    // BoxGeometry material sırası: +x, -x, +y, -y, +z(ön), -z(arka)
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(CARD_W, CARD_H, CARD_T),
      [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, backMat]
    );

    const group = new THREE.Group();
    group.add(mesh);
    mesh.rotation.x = -0.42; // kamerayı görecek şekilde geriye yatık

    group.userData = {
      instanceId: card.instanceId,
      powerKey: cardPowerKey(card, highlightFront),
      hidden: !!hidden,
      legendary: card.rank <= 10,
      inner: mesh,
      faceMat
    };
    if (hidden) mesh.rotation.y = Math.PI;

    return group;
  }

  function cardPowerKey(card, highlightFront) {
    return `${card.currentPower.land}/${card.currentPower.air}/${card.currentPower.sea}/${highlightFront || ''}`;
  }

  async function animateDeploy(group, owner, front) {
    const targetPos = new THREE.Vector3(FRONT_X[front], CARD_Y, OWNER_Z[owner]);
    group.position.copy(targetPos).setY(10);
    group.scale.setScalar(0.6);
    scene.add(group);

    ringPulse(FRONT_X[front], OWNER_Z[owner], platforms[owner][front].baseColor, 4);

    await tween({
      dur: 520,
      ease: 'outCubic',
      onUpdate: t => {
        group.position.y = 10 + (targetPos.y - 10) * t;
        group.scale.setScalar(0.6 + 0.4 * t);
      }
    });
    group.position.copy(targetPos);

    // İniş etkisi: toz halkası + hafif yer sarsıntısı
    ringPulse(FRONT_X[front], OWNER_Z[owner], 0xffffff, 2.2);
    addShake(0.14);

    // Efsanevi birim inişi: altın çifte halka + yükselen altın kıvılcımlar
    if (group.userData.legendary) {
      ringPulse(FRONT_X[front], OWNER_Z[owner], 0xf7c948, 4.5);
      setTimeout(() => ringPulse(FRONT_X[front], OWNER_Z[owner], 0xffe08a, 3), 140);
      sparkleAt(owner, front, 0xffd24a);
    }
  }

  async function animateDissolve(group, destroyed) {
    if (destroyed) {
      explodeAt(group.position.clone(), 0xff5533, 34, 0.24);
      addShake(0.35);
    }
    await tween({
      dur: 420,
      ease: 'inCubic',
      onUpdate: t => {
        group.scale.setScalar(Math.max(0.01, 1 - t));
        group.rotation.y += 0.12;
        group.position.y = CARD_Y + t * 1.6;
      }
    });
    scene.remove(group);
    disposeGroup(group);
  }

  function disposeGroup(group) {
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => {
          if (m.map && m.map !== cardBackTexture) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  async function animateFlip(group) {
    const inner = group.userData.inner;
    await tween({
      dur: 480,
      ease: 'inOutQuad',
      onUpdate: t => {
        inner.rotation.y = Math.PI * (1 - t);
        group.position.y = CARD_Y + Math.sin(t * Math.PI) * 1.1;
      }
    });
    inner.rotation.y = 0;
    group.position.y = CARD_Y;
  }

  // ---- Board Senkronizasyonu ---------------------------------------------------
  // view[owner][front] = null | { card, hidden, highlight }
  async function syncBoard(view) {
    const jobs = [];

    ['player', 'ai'].forEach(owner => {
      ['land', 'air', 'sea'].forEach(front => {
        const target = view[owner][front];
        const existing = cardMeshes[owner][front];

        if (!target && existing) {
          cardMeshes[owner][front] = null;
          removeGlobeMarker(owner, front);
          jobs.push(animateDissolve(existing, view.destroyedHint && view.destroyedHint[`${owner}-${front}`]));
          return;
        }

        if (target && !existing) {
          const group = createCardMesh(target.card, target.highlight, target.hidden);
          cardMeshes[owner][front] = group;
          addGlobeMarker(owner, front, target.card);
          jobs.push(animateDeploy(group, owner, front));
          return;
        }

        if (target && existing) {
          // Farklı kart mı?
          if (existing.userData.instanceId !== target.card.instanceId) {
            cardMeshes[owner][front] = null;
            removeGlobeMarker(owner, front);
            jobs.push(animateDissolve(existing, false).then(() => {
              const group = createCardMesh(target.card, target.highlight, target.hidden);
              cardMeshes[owner][front] = group;
              addGlobeMarker(owner, front, target.card);
              return animateDeploy(group, owner, front);
            }));
            return;
          }

          // Gizlilik değişti mi? (açığa çıkma → flip)
          if (existing.userData.hidden && !target.hidden) {
            existing.userData.hidden = false;
            // Önce güncel yüzü çiz
            refreshCardFace(existing, target.card, target.highlight);
            jobs.push(animateFlip(existing));
          } else if (!existing.userData.hidden && target.hidden) {
            existing.userData.hidden = true;
            existing.userData.inner.rotation.y = Math.PI;
          }

          // Güç değişti mi? → doku yenile
          const key = cardPowerKey(target.card, target.highlight);
          if (existing.userData.powerKey !== key) {
            refreshCardFace(existing, target.card, target.highlight);
          }
        }
      });
    });

    await Promise.all(jobs);
  }

  function refreshCardFace(group, card, highlight) {
    const newTex = drawCardFace(card, highlight);
    const mat = group.userData.faceMat;
    if (mat.map) mat.map.dispose();
    mat.map = newTex;
    mat.needsUpdate = true;
    group.userData.powerKey = cardPowerKey(card, highlight);
  }

  // ---- Efektler ---------------------------------------------------------------
  function explodeAt(pos, color, count = 40, size = 0.22, speed = 9) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      const dir = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.2), (Math.random() - 0.5)).normalize();
      velocities.push(dir.multiplyScalar(speed * (0.4 + Math.random() * 0.8)));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    particleSystems.push({ points, velocities, life: 1, decay: 1.6, gravity: 9 });

    // Işık patlaması
    const flash = new THREE.PointLight(color, 3.2, 22);
    flash.position.copy(pos);
    scene.add(flash);
    tween({ dur: 380, onUpdate: t => { flash.intensity = 3.2 * (1 - t); }, onComplete: () => scene.remove(flash) });

    // Şok dalgası halkası
    shockRing(pos, color);
  }

  function shockRing(pos, color) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.5, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.35, pos.z);
    scene.add(ring);
    transientMeshes.push(ring);

    tween({
      dur: 560,
      onUpdate: t => {
        const s = 1 + t * 12;
        ring.scale.setScalar(s);
        ring.material.opacity = 0.85 * (1 - t);
      },
      onComplete: () => { scene.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
    });
  }

  function ringPulse(x, z, color, maxScale = 5) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.44, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.32, z);
    scene.add(ring);
    tween({
      dur: 450,
      onUpdate: t => {
        ring.scale.setScalar(1 + t * maxScale);
        ring.material.opacity = 0.7 * (1 - t);
      },
      onComplete: () => { scene.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
    });
  }

  function sparkleAt(owner, front, colorHex) {
    const pos = new THREE.Vector3(FRONT_X[front], 1.2, OWNER_Z[owner]);
    const geo = new THREE.BufferGeometry();
    const count = 22;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x + (Math.random() - 0.5) * 2.4;
      positions[i * 3 + 1] = pos.y + Math.random() * 0.5;
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 2.4;
      velocities.push(new THREE.Vector3(0, 2.2 + Math.random() * 2.4, 0));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: colorHex, size: 0.16, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    particleSystems.push({ points, velocities, life: 1, decay: 1.4, gravity: -0.6 });
  }

  function addShake(amount) {
    shakeAmp = Math.min(1.2, shakeAmp + amount);
  }

  // Çarpışma: iki kart ortada tokuşur
  async function clash(front) {
    const p = cardMeshes.player[front];
    const a = cardMeshes.ai[front];
    if (!p || !a) return;

    const meet = new THREE.Vector3(FRONT_X[front], CARD_Y + 0.4, 0);
    const pStart = p.position.clone();
    const aStart = a.position.clone();

    await tween({
      dur: 340,
      ease: 'inCubic',
      onUpdate: t => {
        p.position.lerpVectors(pStart, new THREE.Vector3(meet.x, meet.y, meet.z + 1.15), t);
        a.position.lerpVectors(aStart, new THREE.Vector3(meet.x, meet.y, meet.z - 1.15), t);
        p.rotation.z = Math.sin(t * Math.PI) * 0.12;
        a.rotation.z = -Math.sin(t * Math.PI) * 0.12;
      }
    });

    explodeAt(meet, FRONT_COLORS[front], 48, 0.26, 11);
    addShake(0.55);

    await tween({
      dur: 420,
      ease: 'outCubic',
      onUpdate: t => {
        p.position.lerpVectors(new THREE.Vector3(meet.x, meet.y, meet.z + 1.15), pStart, t);
        a.position.lerpVectors(new THREE.Vector3(meet.x, meet.y, meet.z - 1.15), aStart, t);
      }
    });

    p.position.copy(pStart);
    a.position.copy(aStart);
    p.rotation.z = 0;
    a.rotation.z = 0;
  }

  // Füze saldırısı: saldıran cepheden karşı cepheye balistik atış
  async function missileStrike(attackerOwner, front, colorHex = 0xff6a33) {
    const defender = attackerOwner === 'player' ? 'ai' : 'player';
    const from = new THREE.Vector3(FRONT_X[front], 1.6, OWNER_Z[attackerOwner]);
    const to = new THREE.Vector3(FRONT_X[front], 0.8, OWNER_Z[defender]);
    const mid = new THREE.Vector3(FRONT_X[front], 7.5, 0);

    const missile = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.85, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    missile.add(body);
    const glow = new THREE.PointLight(colorHex, 1.6, 10);
    missile.add(glow);
    scene.add(missile);

    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);

    await tween({
      dur: 640,
      ease: 'inOutQuad',
      onUpdate: t => {
        const pos = curve.getPoint(t);
        missile.position.copy(pos);
        const tangent = curve.getTangent(Math.min(0.99, t));
        missile.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.normalize());

        // İz partikülü
        if (Math.random() < 0.7) {
          trailPuff(pos, colorHex);
        }
      }
    });

    scene.remove(missile);
    body.geometry.dispose();
    body.material.dispose();

    explodeAt(to.clone().setY(1.4), colorHex, 46, 0.26, 10);
    addShake(0.6);
  }

  function trailPuff(pos, color) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([pos.x, pos.y, pos.z]), 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.3, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const p = new THREE.Points(geo, mat);
    scene.add(p);
    tween({
      dur: 420,
      onUpdate: t => { mat.opacity = 0.8 * (1 - t); mat.size = 0.3 + t * 0.3; },
      onComplete: () => { scene.remove(p); geo.dispose(); mat.dispose(); }
    });
  }

  // Nükleer vuruş görseli
  function nukeStrike(targetOwner, front) {
    const pos = new THREE.Vector3(FRONT_X[front], 1.6, OWNER_Z[targetOwner]);
    explodeAt(pos, 0xff2222, 70, 0.34, 13);
    shockRing(pos, 0xff2222);
    setTimeout(() => shockRing(pos, 0xffaa00), 150);
    addShake(0.9);
  }

  function explodeAtSlot(owner, front, colorHex = 0xff5533) {
    explodeAt(new THREE.Vector3(FRONT_X[front], 1.6, OWNER_Z[owner]), colorHex, 40, 0.26, 10);
    addShake(0.4);
  }

  function flashFront(front) {
    ['player', 'ai'].forEach(owner => {
      ringPulse(FRONT_X[front], OWNER_Z[owner], FRONT_COLORS[front], 3.2);
    });
  }

  // ---- Dünya Küresi İşaretleyicileri -----------------------------------------
  // Sahaya sürülen her ülke, hologram kürede başkent koordinatında ışıldar.
  const globeMarkers = { player: {}, ai: {} };
  const OWNER_MARKER_COLORS = { player: 0x00e5ff, ai: 0xff7b33 };

  function latLonToVec3(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  let markerHaloTexture = null;
  function getMarkerHaloTexture() {
    if (markerHaloTexture) return markerHaloTexture;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    markerHaloTexture = new THREE.CanvasTexture(cv);
    return markerHaloTexture;
  }

  function addGlobeMarker(owner, front, card) {
    if (typeof card.lat !== 'number' || !transientEnv.earth) return;
    removeGlobeMarker(owner, front, true);

    const color = OWNER_MARKER_COLORS[owner];
    const r = transientEnv.earthRadius;
    const surface = latLonToVec3(card.lat, card.lon, r);
    const dir = surface.clone().normalize();

    const group = new THREE.Group();

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 10),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
    );
    dot.position.copy(surface);
    group.add(dot);

    // Kamera-yönlü ışık halesi: her açıdan görünür
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getMarkerHaloTexture(),
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    halo.position.copy(dir.clone().multiplyScalar(r + 0.25));
    halo.scale.setScalar(2.4);
    group.add(halo);

    // Işık sütunu (kürenin dışına doğru)
    const pillarH = 3.2;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.18, pillarH, 8, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    pillar.position.copy(dir.clone().multiplyScalar(r + pillarH / 2));
    pillar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    group.add(pillar);

    transientEnv.earth.add(group);
    globeMarkers[owner][front] = group;

    // Doğuş animasyonu
    group.scale.setScalar(0.01);
    tween({
      dur: 450,
      ease: 'outBack',
      onUpdate: t => group.scale.setScalar(Math.max(0.01, t))
    });
  }

  function removeGlobeMarker(owner, front, instant = false) {
    const marker = globeMarkers[owner][front];
    if (!marker) return;
    globeMarkers[owner][front] = null;

    const cleanup = () => {
      if (transientEnv.earth) transientEnv.earth.remove(marker);
      disposeGroup(marker);
    };

    if (instant) {
      cleanup();
    } else {
      tween({
        dur: 350,
        ease: 'inCubic',
        onUpdate: t => marker.scale.setScalar(Math.max(0.01, 1 - t)),
        onComplete: cleanup
      });
    }
  }

  // Zafer/yenilgi kutlaması: masa merkezinden partikül çeşmesi
  function celebrationBurst(type = 'victory') {
    const color = type === 'victory' ? 0xffd24a : type === 'defeat' ? 0xff3344 : 0xff8822;
    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        const pos = new THREE.Vector3((Math.random() - 0.5) * 10, 0.6, (Math.random() - 0.5) * 6);
        const geo = new THREE.BufferGeometry();
        const count = 60;
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
          positions[i * 3] = pos.x;
          positions[i * 3 + 1] = pos.y;
          positions[i * 3 + 2] = pos.z;
          const ang = Math.random() * Math.PI * 2;
          const spread = 1.5 + Math.random() * 3.5;
          velocities.push(new THREE.Vector3(Math.cos(ang) * spread, 9 + Math.random() * 7, Math.sin(ang) * spread));
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color, size: 0.26, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
        const points = new THREE.Points(geo, mat);
        scene.add(points);
        particleSystems.push({ points, velocities, life: 1.6, decay: 0.7, gravity: 8 });
        shockRing(pos, color);
      }, wave * 320);
    }
  }

  // ---- Kamera ------------------------------------------------------------------
  function cameraMenu() {
    camMode = 'menu';
  }

  function cameraPlay() {
    camMode = 'play';
    camTarget.pos.set(0, 15.2, 20.2);
    camTarget.look.set(0, 0.2, -2.6);
  }

  function cameraFocus(front) {
    camMode = 'focus';
    camTarget.pos.set(FRONT_X[front] * 0.55, 9.6, 13.8);
    camTarget.look.set(FRONT_X[front] * 0.8, 1.0, -0.4);
  }

  // ---- Vurgu/Etkileşim ------------------------------------------------------------
  // side: 'player' | 'ai' | null (true → 'player' uyumluluk için)
  function setDeployMode(side) {
    if (side === true) side = 'player';
    if (side === false) side = null;
    platformFlags.deploySide = side;
  }

  function setTacticTargets(side, fronts) {
    platformFlags.tacticTargets = side ? { side, fronts } : null;
  }

  function setEmptyWarnings(list) {
    platformFlags.emptyWarnings = list || [];
  }

  function onSlotClick(cb) {
    slotClickCb = cb;
  }

  // Sürükle-bırak için dışarıdan raycast ve hover kontrolü
  function pickSlotAt(x, y) {
    return pickSlot(x, y);
  }

  function setExternalHover(slot) {
    hoverSlot = slot || null;
  }

  function getScreenPos(owner, front, yOffset = 2.2) {
    const v = new THREE.Vector3(FRONT_X[front], yOffset, OWNER_Z[owner]);
    v.project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  function pickSlot(clientX, clientY) {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hexes = [];
    ['player', 'ai'].forEach(owner => {
      ['land', 'air', 'sea'].forEach(front => {
        hexes.push(platforms[owner][front].hex);
        const cm = cardMeshes[owner][front];
        if (cm) {
          cm.userData.inner.userData.slot = { owner, front };
          hexes.push(cm.userData.inner);
        }
      });
    });

    const hits = raycaster.intersectObjects(hexes, false);
    if (hits.length > 0) return hits[0].object.userData.slot || null;
    return null;
  }

  // ---- Animasyon Döngüsü ------------------------------------------------------------
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - clockPrev) / 1000 || 0.016);
    clockPrev = now;
    const t = now / 1000;

    // Tween güncelle
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const p = Math.min(1, (now - tw.start) / tw.dur);
      tw.onUpdate(tw.ease(p));
      if (p >= 1) {
        tweens.splice(i, 1);
        tw.onComplete();
      }
    }

    // Partiküller
    for (let i = particleSystems.length - 1; i >= 0; i--) {
      const ps = particleSystems[i];
      ps.life -= dt * ps.decay;
      const posAttr = ps.points.geometry.attributes.position;
      for (let j = 0; j < ps.velocities.length; j++) {
        const v = ps.velocities[j];
        v.y -= ps.gravity * dt;
        posAttr.array[j * 3] += v.x * dt;
        posAttr.array[j * 3 + 1] += v.y * dt;
        posAttr.array[j * 3 + 2] += v.z * dt;
      }
      posAttr.needsUpdate = true;
      ps.points.material.opacity = Math.max(0, ps.life);
      if (ps.life <= 0) {
        scene.remove(ps.points);
        ps.points.geometry.dispose();
        ps.points.material.dispose();
        particleSystems.splice(i, 1);
      }
    }

    // Gerçek zamanlı savaş sim adımı
    if (externalTicker) {
      try { externalTicker(dt, t); } catch (e) { console.error('battle tick:', e); }
    }

    // Ortam animasyonları
    if (transientEnv.earth) {
      transientEnv.earth.rotation.y += dt * 0.12;
    }
    if (transientEnv.dust) {
      transientEnv.dust.rotation.y += dt * 0.015;
    }

    // Platform durum ışıkları + tema dekor animasyonları
    ['player', 'ai'].forEach(owner => {
      ['land', 'air', 'sea'].forEach(front => {
        const p = platforms[owner][front];
        p.innerRing.rotation.z += dt * 0.6;

        if (p.anims) {
          p.anims.forEach(a => {
            if (a.type === 'gyro') {
              a.mesh.rotation.y += dt * a.speed;
            } else if (a.type === 'water') {
              const pos = a.geo.attributes.position;
              for (let vi = 0; vi < pos.count; vi++) {
                const bx = a.base[vi * 3], by = a.base[vi * 3 + 1];
                pos.array[vi * 3 + 2] = Math.sin(t * 2.2 + bx * 2.0 + by * 1.6) * 0.08;
              }
              pos.needsUpdate = true;
            }
          });
        }

        let ringColor = p.baseColor;
        let ringOpacity = 0.5;
        let emissive = 0.08;

        const tt = platformFlags.tacticTargets;
        const isTacticTarget = tt && tt.side === owner && tt.fronts.includes(front) && cardMeshes[owner][front];
        const isDeployTarget = platformFlags.deploySide === owner;
        const isEmptyWarn = platformFlags.emptyWarnings.some(w => w.owner === owner && w.front === front);
        const isHover = hoverSlot && hoverSlot.owner === owner && hoverSlot.front === front;

        if (isTacticTarget) {
          ringColor = 0xc45cff;
          ringOpacity = 0.65 + Math.sin(t * 7) * 0.3;
          emissive = 0.25;
        } else if (isDeployTarget) {
          ringColor = 0x00e5ff;
          ringOpacity = 0.6 + Math.sin(t * 6) * 0.3;
          emissive = 0.2;
        } else if (isEmptyWarn) {
          ringColor = 0xff3344;
          ringOpacity = 0.4 + Math.sin(t * 5) * 0.25;
          emissive = 0.14;
        }

        if (isHover && (isDeployTarget || isTacticTarget || owner === 'player')) {
          ringOpacity = Math.min(1, ringOpacity + 0.3);
          emissive += 0.15;
        }

        p.ring.material.color.setHex(ringColor);
        p.ring.material.opacity = ringOpacity;
        p.hex.material.emissive.setHex(ringColor);
        p.hex.material.emissiveIntensity = emissive + Math.sin(t * 2 + FRONT_X[front]) * 0.02;
      });
    });

    // Sahadaki kartlar hafifçe süzülür (aktif tween yoksa)
    if (tweens.length === 0) {
      ['player', 'ai'].forEach(owner => {
        ['land', 'air', 'sea'].forEach(front => {
          const cm = cardMeshes[owner][front];
          if (cm) {
            cm.userData.inner.position.y = Math.sin(t * 1.4 + FRONT_X[front] + OWNER_Z[owner]) * 0.09;
          }
        });
      });
    }

    // Kamera
    if (camMode === 'menu') {
      const ang = t * 0.12;
      camTarget.pos.set(Math.sin(ang) * 24, 11 + Math.sin(t * 0.4) * 1.2, Math.cos(ang) * 24);
      camTarget.look.set(0, 1.5, 0);
    } else if (camMode === 'play') {
      camTarget.pos.set(Math.sin(t * 0.25) * 0.5, 15.2 + Math.sin(t * 0.35) * 0.25, 20.2);
    }

    camCurrent.pos.lerp(camTarget.pos, Math.min(1, dt * 3.2));
    camCurrent.look.lerp(camTarget.look, Math.min(1, dt * 3.2));

    // Sarsıntı
    let sx = 0, sy = 0, sz = 0;
    if (shakeAmp > 0.001) {
      sx = (Math.random() - 0.5) * shakeAmp;
      sy = (Math.random() - 0.5) * shakeAmp * 0.7;
      sz = (Math.random() - 0.5) * shakeAmp * 0.5;
      shakeAmp *= Math.pow(0.0001, dt); // hızlı sönüm
      if (shakeAmp < 0.001) shakeAmp = 0;
    }

    camera.position.set(camCurrent.pos.x + sx, camCurrent.pos.y + sy, camCurrent.pos.z + sz);
    camera.lookAt(camCurrent.look);

    renderer.render(scene, camera);
  }

  // ---- Init ------------------------------------------------------------------
  function init(containerEl) {
    container = containerEl;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (e) {
      console.error('WebGL başlatılamadı:', e);
      return false;
    }

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x04060c);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 400);
    camera.position.set(0, 26, 26);

    buildEnvironment();
    buildPlatforms();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    renderer.domElement.addEventListener('pointermove', e => {
      hoverSlot = pickSlot(e.clientX, e.clientY);
      renderer.domElement.style.cursor = hoverSlot ? 'pointer' : 'default';
    });

    renderer.domElement.addEventListener('pointerdown', e => {
      const slot = pickSlot(e.clientX, e.clientY);
      if (slot && slotClickCb) slotClickCb(slot.owner, slot.front);
    });

    preloadFlags();
    ready = true;
    requestAnimationFrame(animate);
    return true;
  }

  return {
    init,
    get ready() { return ready; },
    syncBoard,
    clash,
    missileStrike,
    nukeStrike,
    explodeAtSlot,
    celebrationBurst,
    sparkleAt,
    flashFront,
    ringPulse,
    addShake,
    cameraMenu,
    cameraPlay,
    cameraFocus,
    setDeployMode,
    setTacticTargets,
    setEmptyWarnings,
    onSlotClick,
    pickSlotAt,
    setExternalHover,
    getScreenPos,
    // Gerçek zamanlı savaş motoru API'si
    getScene: () => scene,
    setTicker: fn => { externalTicker = fn; },
    worldExplode: (pos, color, count = 24, size = 0.2, speed = 8) =>
      explodeAt(new THREE.Vector3(pos.x, pos.y, pos.z), color, count, size, speed),
    layout: { FRONT_X, OWNER_Z, CARD_Y }
  };
})();

window.Scene3D = Scene3D;
