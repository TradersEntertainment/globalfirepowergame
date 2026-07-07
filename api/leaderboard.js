// GET /api/leaderboard?limit=&playerId= — en yüksek rating'li oyuncular + çağıranın sırası.
// Dönüş: { entries:[{ rank,name,iso,rating,wins,losses }], you:{ rank,rating } | null, offline? }

const kv = require('./_kv.js');

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit'), 10) || 20));
  const playerId = String(url.searchParams.get('playerId') || '').slice(0, 64);

  if (!kv.configured()) { res.status(200).json({ entries: [], you: null, offline: true }); return; }

  try {
    const raw = await kv.cmd(['ZREVRANGE', 'ladder', 0, limit - 1, 'WITHSCORES']) || [];
    // raw: [id1, score1, id2, score2, ...]
    const ids = [];
    for (let i = 0; i < raw.length; i += 2) ids.push({ id: raw[i], rating: parseInt(raw[i + 1], 10) });

    const entries = [];
    for (let i = 0; i < ids.length; i++) {
      let p = null;
      try { p = JSON.parse(await kv.cmd(['GET', 'player:' + ids[i].id]) || 'null'); } catch (e) { p = null; }
      entries.push({
        rank: i + 1,
        name: (p && p.name) || 'Komutan',
        iso: (p && p.iso) || 'us',
        rating: ids[i].rating,
        wins: (p && p.wins) || 0,
        losses: (p && p.losses) || 0
      });
    }

    let you = null;
    if (playerId) {
      const rank = await kv.cmd(['ZREVRANK', 'ladder', playerId]);
      const score = await kv.cmd(['ZSCORE', 'ladder', playerId]);
      if (rank !== null && rank !== undefined) {
        you = { rank: parseInt(rank, 10) + 1, rating: parseInt(score, 10) || 0 };
      }
    }

    res.status(200).json({ entries, you });
  } catch (e) {
    res.status(200).json({ entries: [], you: null, offline: true, error: String(e.message || e) });
  }
};
