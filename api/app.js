const crypto = require('node:crypto');
const webpush = require('web-push');

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const cookieName = '__Host-carloan-admin';
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };
const configured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.ADMIN_EMAIL);
const pushReady = () => configured() && Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
function httpsLink(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || value.length > 2048) throw new Error();
    return url.href;
  } catch { fail(400, 'Link mestilah URL HTTPS yang sah.'); }
}
function validateSubscription(subscription) {
  if (!subscription || typeof subscription.endpoint !== 'string') fail(400, 'Langganan tidak sah.');
  let endpoint;
  try { endpoint = new URL(subscription.endpoint); } catch { fail(400, 'Endpoint tidak sah.'); }
  // Guest endpoints must never turn the push sender into an arbitrary HTTP client.
  const host = endpoint.hostname;
  const approved = host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com' || host === 'web.push.apple.com' || host.endsWith('.push.apple.com');
  if (endpoint.protocol !== 'https:' || endpoint.port || endpoint.username || endpoint.password || !approved || subscription.endpoint.length > 2048) fail(400, 'Provider notification tidak disokong.');
  const keys = subscription.keys;
  const validKey = (value, bytes) => typeof value === 'string' && /^[A-Za-z0-9_-]+={0,2}$/.test(value) && Buffer.from(value, 'base64url').length === bytes;
  if (!validKey(keys?.p256dh, 65) || !validKey(keys?.auth, 16)) fail(400, 'Key langganan tidak sah.');
  return { endpoint: endpoint.href, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}
async function supabase(path, { method = 'GET', body, authToken, service = true, headers = {} } = {}) {
  const key = service ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(process.env.SUPABASE_URL + path, {
    method, headers: { apikey: key, Authorization: 'Bearer ' + (authToken || key), 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Never relay upstream SQL details, credentials, or subscription endpoints.
    const invalidLogin = path.startsWith('/auth/v1/token?') && response.status === 400;
    const denied = invalidLogin || response.status === 401 || response.status === 403;
    throw new HttpError(response.status === 429 ? 429 : denied ? 401 : 503, response.status === 429 ? 'Terlalu banyak percubaan. Cuba lagi sebentar.' : denied ? 'Sesi tamat atau login tidak sah.' : 'Backend tidak tersedia. Cuba lagi.');
  }
  return { data, headers: response.headers };
}
function sameOrigin(req) {
  const origin = process.env.APP_ORIGIN || 'https://protoncalculator.vercel.app';
  if (req.headers.origin !== origin) fail(403, 'Permintaan tidak dibenarkan.');
}
function adminToken(req) {
  const cookie = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='));
  return cookie?.slice(cookieName.length + 1);
}
function setAdminSession(res, accessToken) {
  const claims = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString());
  const expires = Math.max(0, Math.min((claims.exp || 0) - Math.floor(Date.now() / 1000), 3600));
  if (!expires) fail(401, 'Sesi login telah tamat.');
  res.setHeader('Set-Cookie', `${cookieName}=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${expires}`);
}
async function requireAdmin(req) {
  const token = adminToken(req);
  if (!token || !/^[A-Za-z0-9_.-]+$/.test(token)) fail(401, 'Sila login admin.');
  const { data: user } = await supabase('/auth/v1/user', { service: false, authToken: token });
  if (!user?.email_confirmed_at || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) fail(403, 'Akses admin tidak dibenarkan.');
  return user;
}
function requirePost(req) {
  if (req.method !== 'POST') fail(405, 'Gunakan POST.');
  sameOrigin(req);
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) fail(415, 'Gunakan JSON.');
}
function uuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) fail(400, 'ID tidak sah.');
  return value;
}
async function broadcast(id) {
  const { data: announcements } = await supabase('/rest/v1/car_announcements?id=eq.' + id + '&select=*');
  const announcement = announcements?.[0];
  if (!announcement || !announcement.active) fail(409, 'Hebahan mesti aktif sebelum dihantar.');
  const { data: batch } = await supabase('/rest/v1/rpc/car_claim_deliveries', { method: 'POST', body: { announcement_id: id } });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const payload = JSON.stringify({ id, title: announcement.title, message: announcement.message.slice(0, 500) });
  let sent = 0, failed = 0;
  // Bounded batches avoid function timeouts; durable claims prevent concurrent duplicates.
  for (let offset = 0; offset < batch.length; offset += 5) {
    await Promise.all(batch.slice(offset, offset + 5).map(async row => {
      let state = 'sent'; let code = null;
      try { await webpush.sendNotification(row.subscription, payload, { TTL: 86400, timeout: 5000 }); sent++; }
      catch (error) {
        state = 'failed'; code = String(Number(error.statusCode) || 0); failed++;
        if (error.statusCode === 404 || error.statusCode === 410) await supabase('/rest/v1/car_push_subscriptions?id=eq.' + row.subscription_id, { method: 'PATCH', body: { enabled: false } });
      }
      await supabase('/rest/v1/car_push_deliveries?announcement_id=eq.' + id + '&subscription_id=eq.' + row.subscription_id, {
        method: 'PATCH', body: { state, error_code: code, updated_at: new Date().toISOString() },
      });
    }));
  }
  const { data: summary } = await supabase('/rest/v1/rpc/car_delivery_summary', { method: 'POST', body: { announcement_id: id } });
  return { ...summary, batchSent: sent, batchFailed: failed, complete: batch.length === 0 };
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json');
  try {
    const action = req.query?.action;
    if (!['GET', 'POST'].includes(req.method)) fail(405, 'Kaedah tidak dibenarkan.');
    if (action === 'config' && req.method === 'GET') return res.status(200).json({ ready: configured(), pushReady: pushReady(), vapidPublicKey: pushReady() ? process.env.VAPID_PUBLIC_KEY : null });
    if (!configured()) fail(503, 'Backend Car Loan MY belum dikonfigurasi.');
    if (req.method === 'POST') {
      requirePost(req);
      if (JSON.stringify(req.body || {}).length > 12000) fail(413, 'Mesej terlalu besar.');
    }
    const body = req.body || {};
    if (action === 'announcement' && req.method === 'GET') {
      const { data } = await supabase('/rest/v1/car_announcements?active=eq.true&select=id,title,message,link_url,link_label&order=created_at.desc&limit=1');
      return res.status(200).json({ announcement: data[0] || null });
    }
    if (action === 'subscribe') {
      requirePost(req);
      if (!pushReady()) fail(503, 'Notification belum tersedia. Kalkulator masih boleh digunakan.');
      const subscription = validateSubscription(body.subscription);
      if (!/^[a-f0-9]{64}$/.test(body.deviceToken || '')) fail(400, 'Token peranti tidak sah.');
      const { data } = await supabase('/rest/v1/rpc/car_register_subscription', { method: 'POST', body: {
        endpoint_hash: hash(subscription.endpoint), token_hash: hash(body.deviceToken), push_subscription: subscription,
      } });
      if (!data) fail(409, 'Langganan milik peranti lain atau kapasiti penuh. Cuba daftar semula notification.');
      return res.status(200).json({ subscribed: true });
    }
    if (action === 'login') {
      requirePost(req);
      if (typeof body.email !== 'string' || body.email.trim().toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase() || typeof body.password !== 'string' || !body.password || body.password.length > 256) fail(401, 'Email atau password tidak sah.');
      let session;
      try {
        ({ data: session } = await supabase('/auth/v1/token?grant_type=password', { service: false, method: 'POST', body: { email: body.email.trim(), password: body.password } }));
      } catch (error) { if (error.status === 401) fail(401, 'Login gagal. Semak email dan password.'); throw error; }
      const user = session?.user;
      if (!user?.email_confirmed_at || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) fail(403, 'Akses tidak dibenarkan.');
      setAdminSession(res, session.access_token);
      return res.status(200).json({ email: user.email });
    }
    if (action === 'logout') {
      requirePost(req);
      const token = adminToken(req);
      // Invalidate the Supabase session as well as deleting the browser cookie.
      if (token) await supabase('/auth/v1/logout', { method: 'POST', service: false, authToken: token }).catch(() => {});
      res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
      return res.status(200).json({ loggedOut: true });
    }
    const user = await requireAdmin(req);
    if (action === 'admin' && req.method === 'GET') {
      const { data } = await supabase('/rest/v1/car_announcements?select=*&order=created_at.desc&limit=40');
      return res.status(200).json({ email: user.email, announcements: data, pushReady: pushReady() });
    }
    if (action === 'publish') {
      requirePost(req);
      if (!pushReady()) fail(503, 'Push notification belum tersedia. Hebahan belum diterbitkan.');
      const title = String(body.title || '').trim(); const message = String(body.message || '').trim();
      const linkLabel = String(body.linkLabel || '').trim();
      if (!title || title.length > 100 || !message || message.length > 1500 || linkLabel.length > 50) fail(400, 'Lengkapkan tajuk dan mesej dalam had yang ditetapkan.');
      const { data } = await supabase('/rest/v1/rpc/car_publish_announcement', { method: 'POST', body: {
        announcement_title: title, announcement_message: message, announcement_link: httpsLink(body.linkUrl), announcement_label: linkLabel || null,
      } });
      // Return the published ID even if push fails, so retries never republish the popup.
      let push = null, pushError = null;
      try { push = await broadcast(data.id); }
      catch { pushError = 'Popup diterbitkan tetapi push terganggu. Sambung penghantaran pada rekod hebahan ini.'; }
      return res.status(200).json({ announcement: data, push, pushError });
    }
    if (action === 'deactivate') {
      requirePost(req);
      await supabase('/rest/v1/car_announcements?id=eq.' + uuid(body.id), { method: 'PATCH', body: { active: false } });
      return res.status(200).json({ deactivated: true });
    }
    if (action === 'broadcast') {
      requirePost(req);
      if (!pushReady()) fail(503, 'Push notification belum dikonfigurasi.');
      return res.status(200).json(await broadcast(uuid(body.id)));
    }
    fail(404, 'Fungsi tidak dijumpai.');
  } catch (error) {
    res.status(error.status || 503).json({ error: error.status ? error.message : 'Sambungan backend terganggu. Cuba lagi.' });
  }
};
module.exports.validateSubscription = validateSubscription;
module.exports.httpsLink = httpsLink;
