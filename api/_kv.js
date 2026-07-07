// Vercel KV (Upstash Redis) REST yardımcısı — npm bağımlılığı yok, sadece global fetch.
// Env: KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV store bağlanınca otomatik enjekte edilir).
// Store yapılandırılmamışsa configured() false döner ve çağıranlar zarif fallback uygular.

const BASE = process.env.KV_REST_API_URL || '';
const TOKEN = process.env.KV_REST_API_TOKEN || '';

function configured() {
  return !!(BASE && TOKEN);
}

async function cmd(args) {
  if (!configured()) throw new Error('KV_NOT_CONFIGURED');
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  if (!res.ok) throw new Error('KV_HTTP_' + res.status);
  const j = await res.json();
  return j.result;
}

// Birden çok komutu tek turda çalıştır (Upstash /pipeline).
async function pipeline(cmds) {
  if (!configured()) throw new Error('KV_NOT_CONFIGURED');
  const res = await fetch(BASE + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!res.ok) throw new Error('KV_HTTP_' + res.status);
  const j = await res.json();
  return j.map(r => r.result);
}

// JSON gövdesini güvenli oku (Vercel bazen req.body'yi parse eder, bazen string bırakır).
function readBody(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') {
      try { return resolve(JSON.parse(req.body)); } catch (e) { return resolve({}); }
    }
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

// Elo — hem sunucu hem istemci aynı formülü kullanır (K=32).
function eloDelta(myRating, oppRating, won) {
  const expected = 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
  return Math.round(32 * ((won ? 1 : 0) - expected));
}

function sanitizeName(name) {
  return String(name || 'Komutan').replace(/[<>]/g, '').slice(0, 18) || 'Komutan';
}

module.exports = { configured, cmd, pipeline, readBody, eloDelta, sanitizeName };
