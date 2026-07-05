// Global Firepower: Tactical Fronts - Prosedürel Ses Motoru (V3.1)
// Harici ses dosyası gerekmez: tüm efektler, ulusal marş ezgileri ve savaş
// ambiyansı WebAudio ile anlık sentezlenir.

const AudioEngine = (() => {
  let ctx = null;

  function ensureCtx() {
    if (typeof META !== "undefined" && META.muted) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  // ---- Nota çözümleme -------------------------------------------------------
  const NOTE_OFFSET = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function noteFreq(note) {
    // "C4", "Bb3", "F#5" → Hz (A4 = 440)
    const m = /^([A-G])([b#]?)(\d)$/.exec(note);
    if (!m) return 440;
    let semis = NOTE_OFFSET[m[1]];
    if (m[2] === '#') semis += 1;
    if (m[2] === 'b') semis -= 1;
    semis += (parseInt(m[3], 10) - 4) * 12;
    return 440 * Math.pow(2, semis / 12);
  }

  // ---- Temel sentez ---------------------------------------------------------
  function tone(freq, dur, { type = "sine", vol = 0.15, slideTo = null, delay = 0 } = {}) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, { vol = 0.2, freq = 1000, q = 1, type = "lowpass", delay = 0, slideTo = null } = {}) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    }
    filter.Q.value = q;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
  }

  // ---- Ulusal Marş Ezgileri --------------------------------------------------
  // Telifsiz bestelerin AÇILIŞLARININ yaklaşık, kısaltılmış ezgileri.
  // Format: [nota, süre_ms]. Toplam ~2 saniyeyle sınırlanır.
  const ANTHEMS = {
    turkey:       [["G4",220],["Bb4",220],["A4",220],["G4",220],["C5",340],["Bb4",240],["A4",480]],
    usa:          [["G4",300],["E4",200],["C4",300],["E4",300],["G4",300],["C5",580]],
    france:       [["D4",150],["D4",150],["D4",160],["G4",400],["G4",300],["A4",400],["D5",480]],
    uk:           [["C4",340],["C4",340],["D4",340],["B3",480],["C4",340],["D4",480]],
    russia:       [["F4",280],["C5",420],["Bb4",260],["A4",280],["G4",260],["C5",520]],
    china:        [["G4",240],["C5",240],["E5",240],["C5",240],["G4",240],["C5",500]],
    japan:        [["D4",300],["C4",300],["D4",300],["E4",300],["G4",300],["E4",300],["D4",380]],
    india:        [["C4",240],["D4",240],["E4",240],["E4",240],["E4",240],["F4",240],["E4",240],["D4",340]],
    germany:      [["Eb4",300],["F4",200],["G4",300],["F4",200],["Eb4",300],["Ab4",380],["G4",380]],
    italy:        [["G4",200],["G4",160],["G4",200],["E4",300],["C5",300],["B4",200],["A4",200],["B4",400]],
    israel:       [["D4",260],["E4",260],["F4",260],["G4",260],["A4",420],["A4",420]],
    ukraine:      [["A4",300],["A4",200],["G4",260],["A4",260],["Bb4",300],["A4",300],["G4",380]],
    poland:       [["E4",250],["G4",200],["G4",200],["F#4",250],["E4",250],["A4",340],["F#4",340]],
    south_korea:  [["C4",300],["E4",300],["G4",300],["G4",300],["E4",300],["A4",440]],
    greece:       [["E4",250],["E4",250],["F4",250],["G4",340],["G4",250],["F4",250],["E4",340]],
    brazil:       [["C4",160],["E4",160],["G4",160],["C5",300],["G4",160],["E5",440]]
  };

  // Marşı olmayan ülkeler için 3 farklı askeri boru fanfarı
  const GENERIC_FANFARES = [
    [["C4",200],["F4",200],["A4",200],["C5",420],["A4",220],["C5",500]],           // kahraman majör
    [["A3",260],["C4",260],["E4",260],["A4",420],["G4",260],["E4",460]],           // ağırbaşlı minör
    [["G3",240],["C4",240],["G4",480],["E4",240],["G4",520]]                       // donanma borusu
  ];

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // Bakır nefesli (bando) sesi: detune'lu çift osilatör + lowpass
  function brassNote(freq, dur, startDelay, vol = 0.085) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + startDelay;
    const t1 = t0 + dur;

    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2100, t0);
    filter.Q.value = 0.8;

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
    gain.gain.setValueAtTime(vol, Math.max(t0 + 0.03, t1 - 0.07));
    gain.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.03);

    [["sawtooth", 0], ["square", 5]].forEach(([type, cents]) => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      osc.detune.setValueAtTime(cents, t0);
      osc.connect(filter);
      osc.start(t0);
      osc.stop(t1 + 0.06);
    });

    filter.connect(gain).connect(c.destination);
  }

  let lastAnthemAt = 0;

  // Ülke sahaya sürülünce çalınan 1.5-2 saniyelik marş/fanfar
  function playAnthem(countryId) {
    if (typeof META !== "undefined" && META.muted) return;
    const c = ensureCtx();
    if (!c) return;

    // Üst üste binmeyi önle: yeni marş öncekini beklemez ama 300ms içinde spamlanamaz
    const now = performance.now();
    if (now - lastAnthemAt < 300) return;
    lastAnthemAt = now;

    const melody = ANTHEMS[countryId] || GENERIC_FANFARES[hashStr(countryId) % GENERIC_FANFARES.length];

    // Trampet girişi (kısa rulo)
    noise(0.09, { vol: 0.10, freq: 2600, type: "bandpass", q: 1.6 });
    noise(0.09, { vol: 0.08, freq: 2600, type: "bandpass", q: 1.6, delay: 0.11 });
    noise(0.16, { vol: 0.12, freq: 2200, type: "bandpass", q: 1.4, delay: 0.22 });

    // Ezgi (maks ~2 sn)
    let tSec = 0.30;
    const MAX_SEC = 2.3;
    for (const [note, ms] of melody) {
      const dur = ms / 1000;
      if (tSec + dur > MAX_SEC) break;
      brassNote(noteFreq(note), dur * 0.92, tSec);
      // Oktav altı destek (tuba hissi)
      brassNote(noteFreq(note) / 2, dur * 0.92, tSec, 0.03);
      tSec += dur;
    }

    // Kapanışta hafif zil parlaması
    noise(0.35, { vol: 0.05, freq: 6800, type: "highpass", delay: tSec - 0.05 });
  }

  // ---- Savaş Ambiyansı ---------------------------------------------------------
  // Alçak cephe uğultusu (kahverengi gürültü) + rastgele uzak top atışları
  let ambient = null;
  let ambientIntensity = 1;

  function makeBrownNoiseBuffer(c, seconds) {
    const size = Math.floor(c.sampleRate * seconds);
    const buffer = c.createBuffer(1, size, c.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  function distantBoom() {
    const strength = 0.4 + Math.random() * 0.6;
    noise(1.1, { vol: 0.045 * strength * ambientIntensity, freq: 140, slideTo: 55 });
    tone(52 + Math.random() * 18, 0.9, { type: "sine", vol: 0.045 * strength * ambientIntensity, slideTo: 34 });
  }

  function startAmbient() {
    if (ambient) return;
    if (typeof META !== "undefined" && META.muted) return;
    const c = ensureCtx();
    if (!c) return;

    const src = c.createBufferSource();
    src.buffer = makeBrownNoiseBuffer(c, 3);
    src.loop = true;

    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 210;

    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 2);

    src.connect(filter).connect(gain).connect(c.destination);
    src.start();

    const boomTimer = setInterval(() => {
      if (typeof META !== "undefined" && META.muted) return;
      const chance = ambientIntensity >= 2 ? 0.62 : 0.24;
      if (Math.random() < chance) distantBoom();
    }, 2400);

    ambient = { src, gain, boomTimer };
  }

  function stopAmbient() {
    if (!ambient) return;
    try {
      const c = ctx;
      if (c) {
        ambient.gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.8);
        const srcRef = ambient.src;
        setTimeout(() => { try { srcRef.stop(); } catch (e) {} }, 900);
      } else {
        ambient.src.stop();
      }
    } catch (e) { /* yoksay */ }
    clearInterval(ambient.boomTimer);
    ambient = null;
  }

  function setAmbientIntensity(v) {
    ambientIntensity = v;
    if (ambient && ctx) {
      const target = v >= 2 ? 0.085 : 0.05;
      try { ambient.gain.gain.exponentialRampToValueAtTime(target, ctx.currentTime + 1.2); } catch (e) {}
    }
  }

  // Ses açma/kapama sonrası ambiyansı duruma göre düzelt
  function refreshAmbient(inMatch) {
    if (typeof META !== "undefined" && META.muted) {
      stopAmbient();
    } else if (inMatch && !ambient) {
      startAmbient();
    }
  }

  // ---- Efekt Kütüphanesi ---------------------------------------------------------
  const SFX = {
    click()     { tone(750, 0.06, { type: "square", vol: 0.06 }); },
    draw()      { noise(0.18, { vol: 0.08, freq: 2500, slideTo: 600, type: "bandpass", q: 2 }); },
    deploy()    { tone(190, 0.16, { type: "triangle", vol: 0.2, slideTo: 70 }); noise(0.1, { vol: 0.07, freq: 300 }); },
    pickup()    { tone(300, 0.1, { type: "triangle", vol: 0.1, slideTo: 500 }); },
    battle()    { tone(90, 0.5, { type: "sawtooth", vol: 0.12, slideTo: 45 }); noise(0.4, { vol: 0.06, freq: 500 }); },
    clash()     { noise(0.3, { vol: 0.25, freq: 3500, slideTo: 200 }); tone(110, 0.25, { type: "sawtooth", vol: 0.15, slideTo: 40 }); },
    explosion() { noise(0.6, { vol: 0.3, freq: 900, slideTo: 60 }); tone(60, 0.5, { type: "sine", vol: 0.25, slideTo: 30 }); },
    damage()    { tone(320, 0.2, { type: "sawtooth", vol: 0.12, slideTo: 110 }); },
    heal()      { tone(520, 0.12, { type: "sine", vol: 0.1 }); tone(780, 0.15, { type: "sine", vol: 0.1, delay: 0.09 }); },
    tactic()    { tone(880, 0.07, { type: "square", vol: 0.08 }); tone(1320, 0.09, { type: "square", vol: 0.07, delay: 0.06 }); },
    nuke()      { tone(600, 0.9, { type: "sawtooth", vol: 0.12, slideTo: 70 }); noise(0.9, { vol: 0.2, freq: 700, slideTo: 50 }); },
    medal()     { tone(880, 0.18, { type: "sine", vol: 0.15 }); tone(1174, 0.22, { type: "sine", vol: 0.13, delay: 0.1 }); tone(1760, 0.3, { type: "sine", vol: 0.1, delay: 0.2 }); },
    achievement(){ tone(659, 0.14, { type: "triangle", vol: 0.14 }); tone(880, 0.14, { type: "triangle", vol: 0.14, delay: 0.11 }); tone(1318, 0.28, { type: "triangle", vol: 0.13, delay: 0.22 }); },
    victory()   { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, { type: "triangle", vol: 0.14, delay: i * 0.14 })); },
    legendary() { tone(1568, 0.22, { type: "sine", vol: 0.12 }); tone(1975, 0.28, { type: "sine", vol: 0.1, delay: 0.12 }); tone(2637, 0.35, { type: "sine", vol: 0.08, delay: 0.24 }); noise(0.4, { vol: 0.04, freq: 7500, type: "highpass", delay: 0.1 }); },
    defeat()    { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, { type: "sawtooth", vol: 0.1, delay: i * 0.17 })); },
    // Düşman konuşlanması: karanlık savaş borusu
    enemyHorn() { brassNote(noteFreq("A3"), 0.4, 0, 0.07); brassNote(noteFreq("Ab3"), 0.55, 0.42, 0.08); noise(0.3, { vol: 0.06, freq: 500, slideTo: 120 }); }
  };

  function play(name) {
    if (typeof META !== "undefined" && META.muted) return;
    const fn = SFX[name];
    if (fn) {
      try { fn(); } catch (e) { /* ses hatası oyunu durdurmasın */ }
    }
  }

  return { play, playAnthem, startAmbient, stopAmbient, setAmbientIntensity, refreshAmbient };
})();

function sfx(name) {
  AudioEngine.play(name);
}

function anthem(countryId) {
  try { AudioEngine.playAnthem(countryId); } catch (e) { /* yoksay */ }
}
