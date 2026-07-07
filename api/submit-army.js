// POST /api/submit-army — oyuncunun ordusunu havuza kaydeder (gelecekteki rakipler için).
// Gövde: { playerId, name, iso, army:[{type,x,z,force}], rating }
// Dönüş: { ok, rating, offline? }

const kv = require('./_kv.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const body = await kv.readBody(req);
  const playerId = String(body.playerId || '').slice(0, 64);
  const name = kv.sanitizeName(body.name);
  const iso = String(body.iso || 'us').toLowerCase().slice(0, 3);
  const army = Array.isArray(body.army) ? body.army.slice(0, 20) : [];
  const rating = Math.max(0, Math.min(4000, parseInt(body.rating, 10) || 1000));

  if (!playerId || army.length === 0) { res.status(200).json({ ok: false, error: 'invalid' }); return; }
  if (!kv.configured()) { res.status(200).json({ ok: false, offline: true, rating }); return; }

  try {
    // Mevcut profil varsa rating/istatistiği koru, yoksa oluştur.
    let profile;
    try { profile = JSON.parse(await kv.cmd(['GET', 'player:' + playerId]) || 'null'); } catch (e) { profile = null; }
    if (!profile) profile = { id: playerId, name, iso, rating, wins: 0, losses: 0 };
    profile.name = name; profile.iso = iso; profile.lastSeen = Date.now();
    if (typeof profile.rating !== 'number') profile.rating = rating;

    const armyDoc = { ownerId: playerId, name, iso, rating: profile.rating, units: army };

    await kv.pipeline([
      ['SET', 'player:' + playerId, JSON.stringify(profile)],
      ['SET', 'army:' + playerId, JSON.stringify(armyDoc)],
      ['ZADD', 'ladder', profile.rating, playerId]
    ]);

    res.status(200).json({ ok: true, rating: profile.rating });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'kv', detail: String(e.message || e) });
  }
};
