// GFP: Tactical Fronts — Online Sıralı ağ katmanı (asenkron PvP).
// Aynı origin /api Serverless Function'larına fetch yapar. Ağ/KV yoksa nazikçe
// yerel-AI (bot) maçına ve istemci-taraflı Elo'ya düşer — oyun her zaman oynanabilir.

const Net = (() => {
  const API = '/api';
  const TIMEOUT = 6000;

  function eloDelta(myRating, oppRating, won) {
    const expected = 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
    return Math.round(32 * ((won ? 1 : 0) - expected));
  }

  async function call(path, opts) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(API + path, Object.assign({ signal: ctrl.signal }, opts));
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      return null; // ağ yok / zaman aşımı → çağıran fallback uygular
    }
  }

  // Rakip bul. Dönüş: { bot:true } | { opponent:{ id,name,iso,rating,units } }
  async function findMatch(playerId, rating) {
    const j = await call(`/find-match?playerId=${encodeURIComponent(playerId)}&rating=${rating}`, { method: 'GET' });
    if (!j || j.error) return { bot: true, offline: !j };
    return j;
  }

  // Kullanılan orduyu havuza kaydet (gelecekteki rakipler için). Dönüş: { ok, rating } | null
  async function submitArmy(profile, army) {
    return await call('/submit-army', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: profile.id, name: profile.name, iso: profile.iso, rating: profile.rating, army })
    });
  }

  // Sonucu raporla; sunucu online ise otoriter rating döner, değilse istemci Elo'su.
  async function reportResult(profile, opponent, won) {
    const oppRating = opponent && typeof opponent.rating === 'number' ? opponent.rating : profile.rating;
    const oppId = opponent && opponent.id ? opponent.id : 'bot';
    const j = await call('/report-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: profile.id, opponentId: oppId, won, myRating: profile.rating, oppRating })
    });
    if (j && typeof j.rating === 'number') return { rating: j.rating, delta: j.delta, offline: !!j.offline };
    const delta = eloDelta(profile.rating, oppRating, won);
    return { rating: Math.max(0, profile.rating + delta), delta, offline: true };
  }

  // Liderlik tablosu. Dönüş: { entries, you, offline? }
  async function leaderboard(playerId, limit = 20) {
    const j = await call(`/leaderboard?limit=${limit}&playerId=${encodeURIComponent(playerId || '')}`, { method: 'GET' });
    if (!j) return { entries: [], you: null, offline: true };
    return j;
  }

  return { findMatch, submitArmy, reportResult, leaderboard, eloDelta };
})();

window.Net = Net;
