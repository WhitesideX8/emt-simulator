import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
const COOKIE = 'emt_session';
const lifetime = 8 * 60 * 60;
const equal = (a, b) => a.length === b.length && timingSafeEqual(a, b);

export function installSimulatorLogin(app) {
  const secret = process.env.SESSION_SECRET;
  const origin = process.env.SIMULATOR_ORIGIN;
  if (!secret || secret.length < 32) throw new Error('Set SESSION_SECRET to a random secret of at least 32 characters.');
  if (!origin || new URL(origin).origin !== origin || !origin.startsWith('https://')) throw new Error('Set SIMULATOR_ORIGIN to your HTTPS simulator origin, without a trailing slash.');
  let users;
  try { users = JSON.parse(process.env.SIMULATOR_USERS_JSON || ''); } catch { throw new Error('Set SIMULATOR_USERS_JSON to your generated account JSON.'); }
  if (!Array.isArray(users) || !users.length) throw new Error('At least one simulator account is required.');
  const accounts = new Map();
  for (const user of users) {
    if (!user || !/^[a-z0-9._-]{1,64}$/.test(user.username) || !/^[a-f0-9]{32}$/.test(user.salt) || !/^[a-f0-9]{128}$/.test(user.hash) || accounts.has(user.username)) throw new Error('Invalid or duplicate simulator account.');
    accounts.set(user.username, user);
  }
  const sign = value => createHmac('sha256', secret).update(value).digest('base64url');
  const fingerprint = user => sign(`${user.username}:${user.salt}:${user.hash}`);
  const cookie = (res, value, seconds) => res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`);
  const attempts = new Map();
  const dummy = {salt: randomBytes(16).toString('hex'), hash: randomBytes(64).toString('hex')};
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== origin) return res.status(403).json({error: 'Request must come from the simulator website.'});
    next();
  });
  function page(res, error = '', status = 200) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    return res.status(status).type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EMT Simulator Login</title><style>body{margin:0;background:#30343b;font:18px Arial;color:#fff;display:grid;place-items:center;min-height:100vh}main{width:min(360px,85vw);padding:28px;background:#454b55;border-radius:12px}h1{text-align:center;font-size:28px}label{display:block;margin-top:18px}input,button{box-sizing:border-box;width:100%;padding:12px;margin-top:8px;font-size:18px;border-radius:6px;border:0}button{background:#164fb1;color:white;margin-top:24px;cursor:pointer}.error{color:#ffd5d5}</style></head><body><main><h1>EMT Simulator</h1><p>Sign in with your student account.</p>${error ? `<p class="error" role="alert">${error}</p>` : ''}<form method="post" action="/login"><label for="username">Username</label><input id="username" name="username" autocomplete="username" maxlength="64" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required><button type="submit">Log In</button></form></main></body></html>`);
  }
  app.get('/login', (req,res) => page(res));
  app.post('/login', async (req,res,next) => {
    try {
      const now = Date.now();
      for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
      const key = req.ip;
      const record = attempts.get(key) || {count:0, until:now+15*60*1000};
      if (record.count >= 10 || attempts.size >= 10000 && !attempts.has(key)) return page(res, 'Too many attempts. Try again in 15 minutes.', 429);
      record.count++; attempts.set(key, record);
      const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
      const password = req.body?.password;
      if (typeof password !== 'string' || password.length > 256) return page(res, 'Invalid username or password.', 401);
      const user = accounts.get(username);
      const candidate = user || dummy;
      const derived = await scrypt(password, candidate.salt, 64);
      if (!equal(derived, Buffer.from(candidate.hash, 'hex')) || !user || user.disabled === true) return page(res, 'Invalid username or password.', 401);
      attempts.delete(key);
      const payload = Buffer.from(JSON.stringify({username, expires:Math.floor(now/1000)+lifetime, version:fingerprint(user), nonce:randomBytes(16).toString('hex')})).toString('base64url');
      cookie(res, `${payload}.${sign(payload)}`, lifetime);
      return res.redirect(303, '/index.html');
    } catch (error) { next(error); }
  });
  app.get('/health', (req,res) => res.json({status:'ok'}));
  app.use((req,res,next) => {
    try {
      const raw = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1) || '';
      const [payload, signature, extra] = raw.split('.');
      if (!payload || !signature || extra || raw.length > 4096 || !equal(Buffer.from(signature), Buffer.from(sign(payload)))) throw new Error('invalid');
      const session = JSON.parse(Buffer.from(payload,'base64url').toString());
      const user = accounts.get(session.username);
      if (!user || user.disabled === true || session.expires <= Date.now()/1000 || session.version !== fingerprint(user)) throw new Error('expired');
      req.simulatorUser = user.username;
      return next();
    } catch {
      if (req.method === 'GET' && req.accepts('html') && !req.path.startsWith('/scenario-data')) return res.redirect('/login');
      return res.status(401).json({error:'Please log in to the EMT Simulator again.'});
    }
  });
  app.post('/logout', (req,res) => { cookie(res, '', 0); res.redirect(303,'/login'); });
}
