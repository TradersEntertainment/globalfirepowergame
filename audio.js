// Global Firepower: Tactical Fronts - Prosedürel Ses Motoru (V2.0)
// Harici ses dosyası gerekmez: tüm efektler WebAudio ile anlık sentezlenir.

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

  // Basit osilatör tonu (freq → slideTo kayması destekli)
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

  // Filtrelenmiş gürültü patlaması (çarpışma / patlama / whoosh için)
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
    defeat()    { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, { type: "sawtooth", vol: 0.1, delay: i * 0.17 })); }
  };

  function play(name) {
    if (typeof META !== "undefined" && META.muted) return;
    const fn = SFX[name];
    if (fn) {
      try { fn(); } catch (e) { /* ses hatası oyunu durdurmasın */ }
    }
  }

  return { play };
})();

function sfx(name) {
  AudioEngine.play(name);
}
