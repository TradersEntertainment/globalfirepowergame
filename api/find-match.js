// GET /api/find-match?playerId=&rating= — rating'e yakın bir rakip ordusu döndürür.
// Havuz boşsa veya KV yoksa { bot:true } döner → istemci yerel AI ordusu üretir.
// Dönüş: { bot } | { opponent:{ id,name,iso,rating,units:[...] } }

const kv = require('./_kv.js');

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const playerId = String(url.searchParams.get('playerId') || '').slice(0, 64);
  const rating = Math.max(0, Math.min(4000, parseInt(url.searchParams.get('rating'), 10) || 1000));

  if (!kv.configured()) { res.status(200).json({ bot: true }); return; }

  try {
    // Genişleyen bantla rating'e yakın aday ID'leri topla.
    let ids = [];
    for (const band of [150, 350, 700, 4000]) {
      const found = await kv.cmd(['ZRANGEBYSCORE', 'ladder', rating - band, rating + band]);
      ids = (found || []).filter(id => id && id !== playerId);
      if (ids.length > 0) break;
    }
    if (ids.length === 0) { res.status(200).json({ bot: true }); return; }

    // Adaylardan rastgele seç.
    const oppId = ids[Math.floor(Math.random() * ids.length)];
    const armyDoc = JSON.parse(await kv.cmd(['GET', 'army:' + oppId]) || 'null');
    if (!armyDoc || !Array.isArray(armyDoc.units) || armyDoc.units.length === 0) {
      res.status(200).json({ bot: true }); return;
    }

    res.status(200).json({
      opponent: {
        id: oppId,
        name: armyDoc.name || 'Rakip',
        iso: armyDoc.iso || 'us',
        rating: armyDoc.rating || 1000,
        units: armyDoc.units
      }
    });
  } catch (e) {
    res.status(200).json({ bot: true, error: String(e.message || e) });
  }
};
