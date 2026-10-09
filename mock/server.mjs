// Minimal mock of the service-pulso internal API for visual verification only.
import http from 'node:http'

const PORT = 8787
let nextId = 120
const now = Date.now()
const h = 3600_000
const notifications = [
  { id: 119, audience: 'broadcast', title: { ru: 'Кешбэк за октябрь уже доступен', uz: 'Oktyabr uchun keshbek tayyor', uzCyrl: 'Октябрь учун кешбек тайёр' }, description: { ru: 'Проверьте баланс: ожидавшие начисления переведены в доступные.', uz: 'Balansni tekshiring.' }, type: 100, url: '/wallet', created_at: new Date(now - 2 * h).toISOString(), targeted_count: 0, read_count: 1834, unread_count: 0 },
  { id: 118, audience: 'platform', target_platform: 'ios', title: { ru: 'Обновите приложение', uz: 'Ilovani yangilang' }, description: { ru: 'Вышла версия 1.4.0 с исправлением сканера чеков.' }, type: 200, url: '/profile', created_at: new Date(now - 26 * h).toISOString(), targeted_count: 0, read_count: 412, unread_count: 0 },
  { id: 117, audience: 'targeted', title: { ru: 'Чек проверен', uz: 'Chek tekshirildi', uzCyrl: 'Чек текширилди' }, description: { ru: 'Начислено 3 200 сум. Деньги появятся в балансе через несколько минут.' }, type: 300, url: '/history', created_at: new Date(now - 30 * h).toISOString(), targeted_count: 1, read_count: 1, unread_count: 0 },
  { id: 116, audience: 'targeted', title: { ru: 'Опрос от производителя', uz: "Ishlab chiqaruvchidan so'rovnoma" }, description: { ru: 'Ответьте на 5 вопросов и получите 5 000 сум.' }, type: 400, url: '/survey', created_at: new Date(now - 50 * h).toISOString(), targeted_count: 500, read_count: 212, unread_count: 288 },
  { id: 115, audience: 'targeted', title: { ru: 'Друг зарегистрировался' }, description: { ru: 'Вы получите 20 000 сум после его первого чека.' }, type: 500, url: '/referrals', created_at: new Date(now - 80 * h).toISOString(), targeted_count: 37, read_count: 30, unread_count: 7 },
]
let versions = [
  { platform: 'ios', version: '1.4.0', min_supported_version: '1.2.0', minimum_os_version: '15.0', force_update: false, rollout_percent: 100, update_url: 'https://apps.apple.com/app/id0', release_notes: 'Исправлен сканер чеков, быстрее открывается кошелёк.' },
  { platform: 'android', version: '1.3.2', min_supported_version: '1.3.0', force_update: true, rollout_percent: 50, update_url: 'https://play.google.com/store/apps/details?id=x', release_notes: 'Принудительное обновление из-за ошибки в выводе средств.' },
]

const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(body === undefined ? '' : JSON.stringify(body)) }
const read = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { r(b ? JSON.parse(b) : {}) } catch { r({}) } }) })

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const p = url.pathname
  const m = req.method
  const auth = req.headers.authorization
  console.log(m, p + url.search)
  if (m === 'POST' && p === '/internal/auth/login') {
    const b = await read(req)
    if (b.phone === '+998901234567' && b.password === 'password12') return json(res, 200, { access_token: 'acc', refresh_token: 'ref', access_expires_at: new Date(now + h).toISOString(), refresh_expires_at: new Date(now + 24 * h).toISOString(), admin_id: 1, phone: b.phone })
    return json(res, 401, { alias: 'admin.invalid_credentials', code: 40101, message: 'invalid credentials', type: 'error' })
  }
  if (!auth || !auth.startsWith('Bearer ')) return json(res, 401, { alias: 'auth.unauthorized', message: 'unauthorized', type: 'error' })
  if (m === 'GET' && p === '/internal/auth') return json(res, 200, { id: 1, phone: '+998901234567', full_name: 'Мадина Каримова', is_admin: true })
  if (m === 'POST' && p === '/internal/auth/logout') return json(res, 204)
  if (m === 'POST' && p === '/internal/auth/password') return json(res, 204)
  if (m === 'GET' && p === '/internal/notifications') {
    let items = notifications.slice()
    const q = url.searchParams
    if (q.get('search')) { const s = q.get('search').toLowerCase(); items = items.filter((n) => JSON.stringify(n.title).toLowerCase().includes(s) || JSON.stringify(n.description).toLowerCase().includes(s)) }
    if (q.get('audience')) items = items.filter((n) => n.audience === q.get('audience'))
    if (q.get('type')) items = items.filter((n) => String(n.type) === q.get('type'))
    if (q.get('unread_only') === 'true') items = items.filter((n) => n.unread_count > 0)
    const before = Number(q.get('before_id') || 0)
    if (before) items = items.filter((n) => n.id < before)
    const limit = Number(q.get('limit') || 20)
    return json(res, 200, { items: items.slice(0, limit), has_more: items.length > limit, totals: items.length })
  }
  const detail = p.match(/^\/internal\/notifications\/(\d+)$/)
  if (detail) {
    const n = notifications.find((x) => x.id === Number(detail[1]))
    if (!n) return json(res, 404, { alias: 'notification.not_found', message: 'not found', type: 'error' })
    if (m === 'GET') return json(res, 200, { notification: { id: n.id, title: n.title, description: n.description, type: n.type, url: n.url, created_at: n.created_at }, audience: n.audience, target_platform: n.target_platform, targeted_count: n.targeted_count, read_count: n.read_count, unread_count: n.unread_count, updated_at: n.updated_at })
    if (m === 'PATCH') { const b = await read(req); Object.assign(n, b, { updated_at: new Date().toISOString() }); return json(res, 204) }
    if (m === 'DELETE') { notifications.splice(notifications.indexOf(n), 1); return json(res, 204) }
  }
  if (m === 'POST' && p === '/internal/notifications') {
    const b = await read(req)
    const audience = b.target?.kind === 'all' ? 'broadcast' : b.target?.kind === 'platform' ? 'platform' : 'targeted'
    const count = b.target?.user_ids?.length ?? (b.target?.user_id ? 1 : b.target?.push_tokens?.length ?? 0)
    const n = { id: nextId++, audience, target_platform: b.target?.platform, title: b.title, description: b.description, type: b.type, url: b.url, created_at: new Date().toISOString(), targeted_count: count, read_count: 0, unread_count: count }
    notifications.unshift(n)
    const push = { resolved: audience === 'broadcast' ? 2140 : count, sent: audience === 'broadcast' ? 2101 : count, failed: audience === 'broadcast' ? 39 : 0, skipped_revoked: 0, batch_ids: ['b1'] }
    return json(res, 201, { notification: { id: n.id, title: n.title, description: n.description, type: n.type, url: n.url, created_at: n.created_at }, push, targets_created: count })
  }
  if (m === 'POST' && p === '/internal/push/send') { const b = await read(req); const c = b.target?.push_tokens?.length ?? 1; return json(res, 200, { resolved: c, sent: c, failed: 0, skipped_revoked: 0 }) }
  if (m === 'POST' && p === '/internal/receipts/promote-pending') return json(res, 200, { before: url.searchParams.get('before') || new Date(now - 60000).toISOString(), promoted: 14 })
  if (m === 'GET' && p === '/internal/versions') return json(res, 200, { items: versions, totals: versions.length })
  if (m === 'POST' && p === '/internal/versions') {
    const b = await read(req)
    const cur = versions.find((v) => v.platform === b.platform)
    if (cur && cur.version >= b.version) return json(res, 409, { alias: 'version.stale_write', code: 'stale', message: 'stale', type: 'error', stored_platform: cur.platform, stored_version: cur.version })
    if (cur) Object.assign(cur, b); else versions.push(b)
    return json(res, 200, b)
  }
  const del = p.match(/^\/internal\/versions\/(\w+)$/)
  if (del && m === 'DELETE') { versions = versions.filter((v) => v.platform !== del[1]); return json(res, 204) }
  json(res, 404, { message: 'no route', type: 'error' })
}).listen(PORT, () => console.log('mock on', PORT))
