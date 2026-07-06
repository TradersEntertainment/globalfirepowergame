// POST /api/report-result — asenkron maç sonucunu işler, Elo uygular (iki tarafa da).
// Gövde: { playerId, opponentId, won, myRating, oppRating }
// Dönüş: { rating, delta, offline? }  (istemci offline ise kendi Elo'sunu hesaplar)

const kv = require('./_kv.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
  const body = await kv.readBody(req);
  const playerId = String(body.playerId || '').slice(0, 64);
  const opponentId = body.opponentId ? String(body.opponentId).slice(0, 64) : null;
  const won = !!body.won;
  const myRatingHint = Math.max(0, Math.min(4000, parseInt(body.myRating, 10) || 1000));
  const oppRatingHint = Math.max(0, Math.min(4000, parseInt(body.oppRating, 10) || 1000));

  // Bot maçı veya KV yok → istemci-taraflı Elo (ipuçlarıyla) yeter.
  if (!kv.configured() || !opponentId || opponentId === 'bot') {
    const delta = kv.eloDelta(myRatingHint, oppRatingHint, won);
    res.status(200).json({ offline: true, delta, rating: myRatingHint + delta });
    return;
  }

  try {
    let me = JSON.parse(await kv.cmd(['GET', 'player:' + playerId]) || 'null');
    let opp = JSON.parse(await kv.cmd(['GET', 'player:' + opponentId]) || 'null');
    if (!me) me = { id: playerId, name: 'Komutan', iso: 'us', rating: myRatingHint, wins: 0, losses: 0 };
    if (!opp) opp = { id: opponentId, name: 'Rakip', iso: 'us', rating: oppRatingHint, wins: 0, losses: 0 };

    const myDelta = kv.eloDelta(me.rating, opp.rating, won);
    const oppDelta = kv.eloDelta(opp.rating, me.rating, !won);
    me.rating = Math.max(0, me.rating + myDelta);
    opp.rating = Math.max(0, opp.rating + oppDelta);
    if (won) { me.wins = (me.wins || 0) + 1; opp.losses = (opp.losses || 0) + 1; }
    else { me.losses = (me.losses || 0) + 1; opp.wins = (opp.wins || 0) + 1; }

    await kv.pipeline([
      ['SET', 'player:' + playerId, JSON.stringify(me)],
      ['SET', 'player:' + opponentId, JSON.stringify(opp)],
      ['ZADD', 'ladder', me.rating, playerId],
      ['ZADD', 'ladder', opp.rating, opponentId]
    ]);

    res.status(200).json({ rating: me.rating, delta: myDelta });
  } catch (e) {
    const delta = kv.eloDelta(myRatingHint, oppRatingHint, won);
    res.status(200).json({ offline: true, delta, rating: myRatingHint + delta, error: String(e.message || e) });
  }
};
