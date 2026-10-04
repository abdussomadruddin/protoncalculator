const crypto = require('node:crypto');
const webpush = require('web-push');

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const cookieName = '__Host-carloan-admin';
const refreshCookieName = '__Host-carloan-admin-refresh';
const persistentSessionSeconds = 365 * 24 * 60 * 60;
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
  const approved = host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com' || host === 'web.push.apple.com' || host.endsWith('.push.apple.com') || host === 'notify.windows.com' || host.endsWith('.notify.windows.com');
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
    if(path==='/auth/v1/admin/users'&&method==='POST'&&['email_exists','user_already_exists'].includes(data?.error_code||data?.code))
      throw new HttpError(409,'Emel ini sudah pernah berdaftar. Sila login atau daftar semula dengan email berbeza.');
    const invalidLogin = path.startsWith('/auth/v1/token?') && response.status === 400;
    const denied = invalidLogin || response.status === 401 || response.status === 403;
    throw new HttpError(response.status === 429 ? 429 : denied ? 401 : 503, response.status === 429 ? 'Terlalu banyak percubaan. Cuba lagi sebentar.' : denied ? 'Sesi tamat atau login tidak sah.' : 'Backend tidak tersedia. Cuba lagi.');
  }
  return { data, headers: response.headers };
}
function sameOrigin(req) {
  // Explicit production aliases only; never trust arbitrary Host or forwarded headers.
  const origins = new Set([
    'https://protoncalculator.vercel.app',
    'https://carloanmalaysia.vercel.app',
    'https://protoncalculator-abdussomadruddin-projects.vercel.app',
    process.env.APP_ORIGIN,
    ...(process.env.APP_ORIGINS || '').split(',').map(origin => origin.trim()),
  ].filter(Boolean));
  if (!origins.has(req.headers.origin)) fail(403, 'Domain ini belum dibenarkan. Buka Car Loan MY di domain rasmi dan cuba semula.');
}
function readCookie(req, name) {
  const cookie = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return cookie?.slice(name.length + 1);
}
function adminToken(req) { return readCookie(req, cookieName); }
function setAdminSession(res, accessToken, refreshToken) {
  const claims = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString());
  const expires = Math.max(0, Math.min((claims.exp || 0) - Math.floor(Date.now() / 1000), 3600));
  if (!expires) fail(401, 'Sesi login telah tamat.');
  const cookies = [`${cookieName}=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${expires}`];
  if (refreshToken) {
    if (!/^[A-Za-z0-9_-]+$/.test(refreshToken)) fail(503, 'Sesi tidak sah. Cuba login semula.');
    cookies.push(`${refreshCookieName}=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${persistentSessionSeconds}`);
  }
  res.setHeader('Set-Cookie', cookies.length === 1 ? cookies[0] : cookies);
}
async function requireAdmin(req, res) {
  let token = adminToken(req);
  let user;
  if (token && /^[A-Za-z0-9_.-]+$/.test(token)) {
    try { ({ data: user } = await supabase('/auth/v1/user', { service: false, authToken: token })); }
    catch(error) { if(error.status !== 401) throw error; }
  }
  if (!user) {
    const refreshToken = readCookie(req, refreshCookieName);
    if (!refreshToken || !/^[A-Za-z0-9_-]{1,512}$/.test(refreshToken)) fail(401, 'Sila login admin.');
    const { data: session } = await supabase('/auth/v1/token?grant_type=refresh_token', { service:false, method:'POST', body:{refresh_token:refreshToken} });
    user = session?.user;
    if (!user?.email_confirmed_at || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) fail(403, 'Akses admin tidak dibenarkan.');
    setAdminSession(res, session.access_token, session.refresh_token);
    token = session.access_token;
  }
  if (!user?.email_confirmed_at || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) fail(403, 'Akses admin tidak dibenarkan.');
  return {...user,realtimeToken:token};
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
  let next = 0;
  async function deliver() {
    while (next < batch.length) {
      const row = batch[next++];
      let state = 'sent'; let code = null;
      try { await webpush.sendNotification(row.subscription, payload, { TTL: 86400, timeout: 5000, urgency: 'high' }); sent++; }
      catch (error) {
        state = 'failed'; code = String(Number(error.statusCode) || 0); failed++;
        if (error.statusCode === 404 || error.statusCode === 410) await supabase('/rest/v1/car_push_subscriptions?id=eq.' + row.subscription_id, { method: 'PATCH', body: { enabled: false } });
      }
      await supabase('/rest/v1/car_push_deliveries?announcement_id=eq.' + id + '&subscription_id=eq.' + row.subscription_id, {
        method: 'PATCH', body: { state, error_code: code, updated_at: new Date().toISOString() },
      });
    }
  }
  await Promise.all(Array.from({ length: Math.min(10, batch.length) }, deliver));
  const { data: summary } = await supabase('/rest/v1/rpc/car_delivery_summary', { method: 'POST', body: { announcement_id: id } });
  return { ...summary, batchSent: sent, batchFailed: failed, complete: batch.length === 0 };
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json');
  try {
    const action = req.query?.action;
    if (action === 'pro-reminders' && req.method === 'POST') return await require('../lib/pro.cjs').reminders(req,res,{supabase,fail,pushReady});
    if (action === 'pro-followup-reminders' && req.method === 'POST') return await require('../lib/pro.cjs').followupReminders(req,res,{supabase,fail,pushReady});
    if (!['GET', 'POST'].includes(req.method)) fail(405, 'Kaedah tidak dibenarkan.');
    if (action === 'config' && req.method === 'GET') return res.status(200).json({ ready: configured(), pushReady: pushReady(), vapidPublicKey: pushReady() ? process.env.VAPID_PUBLIC_KEY : null });
    if (!configured()) fail(503, 'Backend Car Loan MY belum dikonfigurasi.');
    if(action==='public-realtime'&&req.method==='GET') return res.status(200).json({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY,subscriptions:[{table:'car_live_signals',filter:'topic=eq.announcements'}]});
    if (req.method === 'POST') {
      requirePost(req);
      if (JSON.stringify(req.body || {}).length > 12000) fail(413, 'Mesej terlalu besar.');
    }
    const body = req.body || {};
    if(action==='agent-profile'&&(readCookie(req,'__Host-carloan-agent')||readCookie(req,'__Host-carloan-agent-refresh')))return await require('../lib/pro.cjs')({...req,query:{...req.query,action:'pro-profile-save'}},res,{supabase,fail,readCookie,uuid,validateSubscription,pushReady});
    if (typeof action === 'string' && action.startsWith('pro-')) return await require('../lib/pro.cjs')(req,res,{supabase,fail,readCookie,uuid,validateSubscription,pushReady});
    if (action === 'download-request' || action === 'agent-profile') {
      requirePost(req);
      const id = uuid(body.id);
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const rawPhone = typeof body.phone === 'string' ? body.phone.replace(/[\s()-]/g, '').replace(/^\+/, '').replace(/^0/, '60') : '';
      const phone = '+' + rawPhone;
      if (!name || name.length > 100 || /[\x00-\x1f]/.test(name) || !/^\+601(?:1\d{8}|[02-9]\d{7})$/.test(phone)) fail(400, 'Nama atau WhatsApp tidak sah.');
      if (action === 'agent-profile') {
        const { data } = await supabase('/rest/v1/rpc/car_save_download', { method: 'POST', body: { request_id: id, person_name: name, whatsapp: phone, calculation: { kind: 'agent-profile' }, client_hash: hash(String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')) } });
        if (!data) fail(429, 'Terlalu banyak permintaan. Cuba sebentar lagi.');
        return res.status(200).json({ saved: true });
      }
      const incoming = body.snapshot;
      if (incoming?.cars && (incoming.version !== 2 || !Array.isArray(incoming.cars) || incoming.cars.length < 1 || incoming.cars.length > 2)) fail(400, 'Snapshot perbandingan tidak sah.');
      const cars = incoming?.cars || [incoming];
      const cleaned = cars.map(s => {
      if (!s || !['brand', 'model', 'variant'].every(k => typeof s[k] === 'string' && s[k].length > 0 && s[k].length <= 200) || !Number.isInteger(s.loanPeriod) || s.loanPeriod < 1 || s.loanPeriod > 9 || !['inputPrice','rebate','extras','insurance','depositAmount','loanAfterDeposit','interestRate','ncd','baseMonthly','selectedMonthly','batteryMonthly'].every(k => Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 10000000)) fail(400, 'Snapshot kiraan tidak sah.');
      const snapshot = Object.fromEntries(['brand','model','variant','loanPeriod','inputPrice','rebate','extras','insurance','depositAmount','loanAfterDeposit','interestRate','ncd','baseMonthly','selectedMonthly','batteryMonthly'].map(k => [k,s[k]]));
      if (s.ncd > 100 || s.interestRate > 100 || s.inputPrice <= 0 || s.rebate > s.inputPrice || s.depositAmount > s.inputPrice - s.rebate + s.extras + s.insurance) fail(400, 'Kiraan tidak sah.');
      const principal = s.inputPrice - s.rebate + s.extras + s.insurance - s.depositAmount;
      const monthly = years => principal * (1 + s.interestRate / 100 * years) / (years * 12);
      if (Math.abs(principal - s.loanAfterDeposit) > 0.01 || Math.abs(monthly(7) - s.baseMonthly) > 0.01 || Math.abs(monthly(s.loanPeriod) - s.selectedMonthly) > 0.01) fail(400, 'Kiraan snapshot tidak sepadan.');
      if (s.insuranceOption !== undefined) {
        if (!['with','exclude','without'].includes(s.insuranceOption)) fail(400, 'Pilihan insurans tidak sah.');
        const expected = s.insuranceOption === 'with' ? s.inputPrice * .033 * (1-s.ncd/100) : 0;
        if (Math.abs(expected-s.insurance) > .01) fail(400, 'Insurans tidak sepadan.');
        snapshot.insuranceOption = s.insuranceOption;
      }
      if(s.depositOption !== undefined) {
        if(!['full','ten','custom'].includes(s.depositOption)) fail(400,'Downpayment tidak sah.');
        if((s.depositOption === 'full' && s.depositAmount !== 0) || (s.depositOption === 'ten' && Math.abs(s.depositAmount-(principal+s.depositAmount)*.1)>.01)) fail(400,'Downpayment tidak sepadan.');
        snapshot.depositOption = s.depositOption;
      }
      return snapshot;
      });
      const snapshot = incoming?.cars ? {version:2,cars:cleaned} : cleaned[0];
      const { data } = await supabase('/rest/v1/rpc/car_save_download', { method: 'POST', body: { request_id: id, person_name: name, whatsapp: phone, calculation: snapshot, client_hash: hash(String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')) } });
      if (!data) fail(429, 'Terlalu banyak permintaan. Cuba sebentar lagi.');
      return res.status(200).json({ saved: true });
    }
    if (action === 'announcement' && req.method === 'GET') {
      const idFilter = req.query.id ? '&id=eq.' + uuid(req.query.id) : '';
      const { data } = await supabase('/rest/v1/car_announcements?active=eq.true' + idFilter + '&select=id,title,message,link_url,link_label&order=created_at.desc&limit=1');
      return res.status(200).json({ announcement: data[0] || null });
    }
    if (action === 'activity') {
      requirePost(req);
      if (!/^[a-f0-9]{64}$/.test(body.deviceToken || '') || (body.sessionToken !== null && !/^[a-f0-9]{64}$/.test(body.sessionToken || '')) || typeof body.phoneApp !== 'boolean' || !['granted', 'denied', 'default', 'unsupported'].includes(body.permission)) fail(400, 'Data aktiviti tidak sah.');
      await supabase('/rest/v1/rpc/car_record_activity', { method: 'POST', body: {
        device_hash: hash(body.deviceToken), visit_hash: body.sessionToken ? hash(body.sessionToken) : null,
        phone_app: body.phoneApp, notification_permission: body.permission,
      } });
      return res.status(200).json({ recorded: true });
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
      setAdminSession(res, session.access_token, session.refresh_token);
      return res.status(200).json({ email: user.email });
    }
    if (action === 'logout') {
      requirePost(req);
      let token = adminToken(req);
      if (!token && readCookie(req, refreshCookieName)) {
        try {
          const { data: session } = await supabase('/auth/v1/token?grant_type=refresh_token', { method:'POST',service:false,body:{refresh_token:readCookie(req,refreshCookieName)} });
          token = session?.access_token;
        } catch {}
      }
      // Invalidate the Supabase session as well as deleting the browser cookie.
      if (token) await supabase('/auth/v1/logout', { method: 'POST', service: false, authToken: token }).catch(() => {});
      res.setHeader('Set-Cookie', [cookieName,refreshCookieName].map(name=>`${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`));
      return res.status(200).json({ loggedOut: true });
    }
    const user = await requireAdmin(req, res);
    if(action==='admin-realtime'&&req.method==='GET') return res.status(200).json({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY,accessToken:user.realtimeToken,subscriptions:[{table:'car_live_signals',filter:'topic=eq.admin'}]});
    if (typeof action === 'string' && action.startsWith('manage-agent-')) return await require('../lib/agents.cjs')(req,res,{supabase,fail,uuid,adminEmail:process.env.ADMIN_EMAIL});
    if (action === 'agent-stats' && req.method === 'GET') {
      const now = new Date(), cutoff = now.toISOString(), firstRecorded = new Map();
      // A WhatsApp is counted on its first record, not on every poster download.
      for (let offset = 0; ; offset += 500) {
        const { data } = await supabase('/rest/v1/car_download_requests?select=created_at,whatsapp&created_at=lte.' + encodeURIComponent(cutoff) + '&order=created_at.asc,id.asc&limit=500&offset=' + offset);
        for (const row of data) {
          const time = new Date(row.created_at).getTime();
          if (!Number.isFinite(time)) continue;
          const previous = firstRecorded.get(row.whatsapp);
          if (previous === undefined || time < previous) firstRecorded.set(row.whatsapp, time);
        }
        if (data.length < 500) break;
      }
      const malaysiaDay = time => new Date(time + 8 * 3600000).toISOString().slice(0, 10);
      const today = malaysiaDay(now.getTime());
      const daily = Array.from({ length: 30 }, (_, i) => ({ date: new Date(Date.parse(today + 'T00:00:00Z') - (29 - i) * 86400000).toISOString().slice(0, 10), count: 0 }));
      const counts = new Map(daily.map(day => [day.date, day]));
      for (const time of firstRecorded.values()) { const day = counts.get(malaysiaDay(time)); if (day) day.count++; }
      return res.status(200).json({ total: firstRecorded.size, daily, checkedAt: cutoff });
    }
    if (action === 'downloads' && req.method === 'GET') {
      const page = Number(req.query.page || 1);
      if (!Number.isSafeInteger(page) || page < 1 || page > 100000) fail(400, 'Halaman tidak sah.');
      const { data } = await supabase('/rest/v1/car_download_contacts?select=id,created_at,name,whatsapp,snapshot&order=created_at.desc,id.desc&limit=21&offset=' + ((page - 1) * 20));
      return res.status(200).json({ records: data.slice(0,20), page, hasNext: data.length > 20 });
    }
    if (action === 'downloads-excel' && req.method === 'GET') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Rekod Download');
      const keys = ['brand','model','variant','loanPeriod','inputPrice','rebate','extras','insurance','ncd','depositAmount','loanAfterDeposit','interestRate','baseMonthly','selectedMonthly','batteryMonthly'];
      sheet.addRow(['ID','Masa Malaysia','Nama','WhatsApp',...keys.map(k=>'A '+k),...keys.map(k=>'B '+k),'Jenis rekod']);
      const cutoff = new Date().toISOString();
      for (let offset = 0; ; offset += 500) {
        const { data } = await supabase('/rest/v1/car_download_contacts?select=id,created_at,name,whatsapp,snapshot&created_at=lte.' + encodeURIComponent(cutoff) + '&order=created_at.asc,id.asc&limit=500&offset=' + offset);
        for (const row of data) {
          // Explicit string values are written as XLSX text, never formulas.
          const cars = row.snapshot?.cars || [row.snapshot || {}];
          const added = sheet.addRow([String(row.id),new Date(row.created_at).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'}),String(row.name),String(row.whatsapp),...keys.map(k => cars[0][k] ?? ''),...keys.map(k=>cars[1]?.[k] ?? ''),row.snapshot?.kind === 'pro-registration' ? 'Daftar PRO' : row.snapshot?.kind === 'agent-profile' ? 'Profil Ejen' : 'Download poster']);
          added.getCell(4).numFmt = '@';
        }
        if (data.length < 500) break;
      }
      sheet.getRow(1).font = { bold: true };
      sheet.columns.forEach(column => { column.width = 24; });
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition','attachment; filename="car-loan-my-downloads.xlsx"');
      res.status(200); return res.end(buffer);
    }
    if (action === 'stats' && req.method === 'GET') {
      const { data } = await supabase('/rest/v1/rpc/car_admin_stats', { method: 'POST', body: {} });
      return res.status(200).json(data);
    }
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
