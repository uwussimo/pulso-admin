// Minimal mock of the service-pulso internal API for visual verification only.
import http from 'node:http'

const PORT = 8787
let nextId = 120
const now = Date.now()
const h = 3600_000
const notifications = [
  {
    id: 119,
    audience: 'broadcast',
    title: {
      ru: 'Кешбэк за октябрь уже доступен',
      uz: 'Oktyabr uchun keshbek tayyor',
      uzCyrl: 'Октябрь учун кешбек тайёр',
    },
    description: { ru: 'Проверьте баланс: ожидавшие начисления переведены в доступные.', uz: 'Balansni tekshiring.' },
    type: 100,
    url: '/wallet',
    created_at: new Date(now - 2 * h).toISOString(),
    targeted_count: 0,
    read_count: 1834,
    unread_count: 0,
  },
  {
    id: 118,
    audience: 'platform',
    target_platform: 'ios',
    title: { ru: 'Обновите приложение', uz: 'Ilovani yangilang' },
    description: { ru: 'Вышла версия 1.4.0 с исправлением сканера чеков.' },
    type: 200,
    url: '/profile',
    created_at: new Date(now - 26 * h).toISOString(),
    targeted_count: 0,
    read_count: 412,
    unread_count: 0,
  },
  {
    id: 117,
    audience: 'targeted',
    title: { ru: 'Чек проверен', uz: 'Chek tekshirildi', uzCyrl: 'Чек текширилди' },
    description: { ru: 'Начислено 3 200 сум. Деньги появятся в балансе через несколько минут.' },
    type: 300,
    url: '/history',
    created_at: new Date(now - 30 * h).toISOString(),
    targeted_count: 1,
    read_count: 1,
    unread_count: 0,
  },
  {
    id: 116,
    audience: 'targeted',
    title: { ru: 'Опрос от производителя', uz: "Ishlab chiqaruvchidan so'rovnoma" },
    description: { ru: 'Ответьте на 5 вопросов и получите 5 000 сум.' },
    type: 400,
    url: '/survey',
    created_at: new Date(now - 50 * h).toISOString(),
    targeted_count: 500,
    read_count: 212,
    unread_count: 288,
  },
  {
    id: 115,
    audience: 'targeted',
    title: { ru: 'Друг зарегистрировался' },
    description: { ru: 'Вы получите 20 000 сум после его первого чека.' },
    type: 500,
    url: '/referrals',
    created_at: new Date(now - 80 * h).toISOString(),
    targeted_count: 37,
    read_count: 30,
    unread_count: 7,
  },
]
const users = [
  {
    id: 1052,
    phone: '+998901234567',
    full_name: 'Мадина Каримова',
    is_verified: true,
    is_admin: true,
    status: 'active',
    balance_available: 12_500_000,
    balance_pending: 320_000,
    receipts_total: 14,
    receipts_approved: 12,
    last_receipt_at: new Date(now - 3 * h).toISOString(),
    referrals_count: 3,
    created_at: new Date(now - 400 * h).toISOString(),
    updated_at: new Date(now - 3 * h).toISOString(),
  },
  {
    id: 1051,
    phone: '+998935550011',
    full_name: 'Azizbek Tursunov',
    is_verified: false,
    is_admin: false,
    status: 'active',
    balance_available: 450_000,
    balance_pending: 0,
    receipts_total: 2,
    receipts_approved: 1,
    last_receipt_at: new Date(now - 30 * h).toISOString(),
    referrals_count: 0,
    invited_by: 1052,
    created_at: new Date(now - 60 * h).toISOString(),
    updated_at: new Date(now - 30 * h).toISOString(),
  },
  {
    id: 1050,
    phone: '+998971112233',
    full_name: '',
    is_verified: true,
    is_admin: false,
    status: 'blocked',
    balance_available: 0,
    balance_pending: 0,
    receipts_total: 41,
    receipts_approved: 9,
    last_receipt_at: new Date(now - 200 * h).toISOString(),
    referrals_count: 17,
    created_at: new Date(now - 900 * h).toISOString(),
    updated_at: new Date(now - 100 * h).toISOString(),
  },
  {
    id: 1049,
    phone: '+998909876543',
    full_name: 'Nilufar Rashidova',
    is_verified: true,
    is_admin: false,
    status: 'active',
    balance_available: 2_080_000,
    balance_pending: 150_000,
    receipts_total: 6,
    receipts_approved: 6,
    last_receipt_at: new Date(now - 10 * h).toISOString(),
    referrals_count: 1,
    invited_by: 1052,
    created_at: new Date(now - 300 * h).toISOString(),
    updated_at: new Date(now - 10 * h).toISOString(),
  },
  {
    id: 1048,
    phone: '+998901110000',
    full_name: 'Удалённый аккаунт',
    is_verified: false,
    is_admin: false,
    status: 'deleted',
    balance_available: 0,
    balance_pending: 0,
    receipts_total: 0,
    receipts_approved: 0,
    referrals_count: 0,
    created_at: new Date(now - 1000 * h).toISOString(),
    updated_at: new Date(now - 500 * h).toISOString(),
  },
]
let versions = [
  {
    platform: 'ios',
    version: '1.4.0',
    min_supported_version: '1.2.0',
    minimum_os_version: '15.0',
    force_update: false,
    rollout_percent: 100,
    update_url: 'https://apps.apple.com/app/id0',
    release_notes: 'Исправлен сканер чеков, быстрее открывается кошелёк.',
  },
  {
    platform: 'android',
    version: '1.3.2',
    min_supported_version: '1.3.0',
    force_update: true,
    rollout_percent: 50,
    update_url: 'https://play.google.com/store/apps/details?id=x',
    release_notes: 'Принудительное обновление из-за ошибки в выводе средств.',
  },
]

// Mirror of the real seed so the panel can be exercised without a backend:
// one receipt per status, including one an operator already rejected, and a
// reversed cashback row that a rejection created.
let receipts = [
  {
    id: 101,
    user_id: 1,
    user_phone: '+998901234567',
    user_name: 'Мадина Каримова',
    status: 'approved',
    company_tin: '312019876',
    company_name: 'Аптека «Здоровье»',
    url: 'https://ofd.soliq.uz/check?t=AA100000000001&r=1',
    total: 845000,
    cashback: 84500,
    error_code: '',
    rejected_by_operator: false,
    scanned_at: new Date(now - 2 * h).toISOString(),
    created_at: new Date(now - 2 * h).toISOString(),
    updated_at: new Date(now - 2 * h).toISOString(),
    fiscalized_at: new Date(now - 2 * h).toISOString(),
    item_count: 4,
    medical_item_count: 3,
    cashback_transaction: { id: 9001, amount: 84500, status: 'posted' },
  },
  {
    id: 100,
    user_id: 2,
    user_phone: '+998935551201',
    user_name: 'Бекзод Шоқиров',
    status: 'pending',
    company_tin: '',
    company_name: '',
    url: 'https://ofd.soliq.uz/check?t=AA100000000002&r=1',
    total: 0,
    cashback: 0,
    error_code: '',
    rejected_by_operator: false,
    scanned_at: new Date(now - 5 * 60000).toISOString(),
    created_at: new Date(now - 5 * 60000).toISOString(),
    updated_at: new Date(now - 5 * 60000).toISOString(),
    item_count: 0,
    medical_item_count: 0,
  },
  {
    id: 99,
    user_id: 1,
    user_phone: '+998901234567',
    user_name: 'Мадина Каримова',
    status: 'canceled',
    company_tin: '201019876',
    company_name: 'Аптека «Вита»',
    url: 'https://ofd.soliq.uz/check?t=AA100000000003&r=1',
    total: 0,
    cashback: 0,
    cancel_reason: 'Чек поддельный или дублирующий',
    error_code: 'receipts.rejected_by_operator',
    rejected_by_operator: true,
    scanned_at: new Date(now - 26 * h).toISOString(),
    created_at: new Date(now - 26 * h).toISOString(),
    updated_at: new Date(now - h).toISOString(),
    item_count: 2,
    medical_item_count: 2,
    cashback_transaction: { id: 9002, amount: 23000, status: 'reversed' },
  },
  {
    id: 98,
    user_id: 3,
    user_phone: '+998907778899',
    user_name: 'Нина Юсупова',
    status: 'canceled',
    company_tin: '212019876',
    company_name: 'Аптека «Шифо»',
    url: 'https://ofd.soliq.uz/check?t=AA100000000004&r=1',
    total: 0,
    cashback: 0,
    cancel_reason: 'Срок проверки истёк',
    error_code: 'receipts.expired',
    rejected_by_operator: false,
    scanned_at: new Date(now - 96 * h).toISOString(),
    created_at: new Date(now - 96 * h).toISOString(),
    updated_at: new Date(now - 70 * h).toISOString(),
    item_count: 0,
    medical_item_count: 0,
  },
]

const receiptItems = {
  101: [
    {
      id: 1,
      name: 'Ибупрофен 200мг',
      count_hundredths: 200,
      price: 42000,
      ikpu_code: '0000000001',
      nomenclature_id: 412,
      cashback: 4200,
      status: 'cashbacked',
    },
    {
      id: 2,
      name: 'Парацетамол 500мг',
      count_hundredths: 100,
      price: 12500,
      ikpu_code: '0000000002',
      nomenclature_id: 413,
      cashback: 1250,
      status: 'cashbacked',
    },
    {
      id: 3,
      name: 'Витамины C',
      count_hundredths: 100,
      price: 39000,
      ikpu_code: '0000000003',
      nomenclature_id: 414,
      cashback: 3900,
      status: 'cashbacked',
    },
    {
      id: 4,
      name: 'Шампунь',
      count_hundredths: 100,
      price: 68300,
      ikpu_code: '',
      nomenclature_id: 0,
      cashback: 0,
      status: 'non_medical',
    },
  ],
  99: [
    {
      id: 5,
      name: 'Антибиотик',
      count_hundredths: 100,
      price: 115000,
      ikpu_code: '0000000004',
      nomenclature_id: 415,
      cashback: 11500,
      status: 'cashbacked',
    },
    {
      id: 6,
      name: 'Бинт',
      count_hundredths: 100,
      price: 11500,
      ikpu_code: '0000000005',
      nomenclature_id: 416,
      cashback: 1150,
      status: 'cashbacked',
    },
  ],
}

let transactions = [
  {
    id: 9002,
    user_id: 1,
    user_phone: '+998901234567',
    user_name: 'Мадина Каримова',
    type: 'receipt_scan',
    amount: 23000,
    reference: 'receipt:99',
    description: 'Cashback for scanned receipt',
    status: 'reversed',
    reversed: true,
    created_at: new Date(now - 26 * h).toISOString(),
  },
  {
    id: 9001,
    user_id: 1,
    user_phone: '+998901234567',
    user_name: 'Мадина Каримова',
    type: 'receipt_scan',
    amount: 84500,
    reference: 'receipt:101',
    description: 'Cashback for scanned receipt',
    status: 'posted',
    reversed: false,
    created_at: new Date(now - 2 * h).toISOString(),
    posted_at: new Date(now - 2 * h).toISOString(),
  },
  {
    id: 9000,
    user_id: 1,
    user_phone: '+998901234567',
    user_name: 'Мадина Каримова',
    type: 'welcome_bonus',
    amount: 50000,
    reference: 'user:1:welcome',
    description: 'Welcome bonus',
    status: 'posted',
    reversed: false,
    created_at: new Date(now - 200 * h).toISOString(),
    posted_at: new Date(now - 200 * h).toISOString(),
  },
  {
    id: 8999,
    user_id: 2,
    user_phone: '+998935551201',
    user_name: 'Бекзод Шоқиров',
    type: 'card_withdrawal',
    amount: 120000,
    reference: 'payout:5501',
    description: 'Вывод на карту',
    status: 'posted',
    reversed: false,
    created_at: new Date(now - 30 * h).toISOString(),
    posted_at: new Date(now - 30 * h).toISOString(),
  },
  {
    id: 8998,
    user_id: 3,
    user_phone: '+998907778899',
    user_name: 'Нина Юсупова',
    type: 'receipt_scan',
    amount: 15000,
    reference: 'receipt:97',
    description: 'Cashback for scanned receipt',
    status: 'pending',
    reversed: false,
    created_at: new Date(now - 2 * 60000).toISOString(),
  },
]

const receiptSummary = (rows) => {
  const approved = rows.filter((r) => r.status === 'approved')
  const sum = (list, k) => list.reduce((a, r) => a + (r[k] || 0), 0)
  return {
    totals: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: approved.length,
    canceled: rows.filter((r) => r.status === 'canceled').length,
    rejected_by_operator: rows.filter((r) => r.rejected_by_operator).length,
    total_amount: sum(approved, 'total'),
    cashback_total: sum(approved, 'cashback'),
  }
}

const transactionSummary = (rows) => {
  const credits = ['welcome_bonus', 'friend_invitation', 'receipt_scan', 'survey_completion']
  const posted = rows.filter((r) => r.status === 'posted')
  const sum = (list, k) => list.reduce((a, r) => a + (r[k] || 0), 0)
  return {
    totals: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    posted: posted.length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    reversed: rows.filter((r) => r.status === 'reversed').length,
    posted_credits: sum(
      posted.filter((r) => credits.includes(r.type)),
      'amount',
    ),
    posted_debits: sum(
      posted.filter((r) => !credits.includes(r.type)),
      'amount',
    ),
    pending_total: sum(
      rows.filter((r) => r.status === 'pending'),
      'amount',
    ),
  }
}

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(body === undefined ? '' : JSON.stringify(body))
}
const read = (req) =>
  new Promise((r) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => {
      try {
        r(b ? JSON.parse(b) : {})
      } catch {
        r({})
      }
    })
  })

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x')
    const p = url.pathname
    const m = req.method
    const auth = req.headers.authorization
    console.log(m, p + url.search)
    if (m === 'POST' && p === '/internal/auth/login') {
      const b = await read(req)
      if (b.phone === '+998901234567' && b.password === 'password12')
        return json(res, 200, {
          access_token: 'acc',
          refresh_token: 'ref',
          access_expires_at: new Date(now + h).toISOString(),
          refresh_expires_at: new Date(now + 24 * h).toISOString(),
          admin_id: 1,
          phone: b.phone,
        })
      return json(res, 401, {
        alias: 'admin.invalid_credentials',
        code: 40101,
        message: 'invalid credentials',
        type: 'error',
      })
    }
    if (!auth || !auth.startsWith('Bearer '))
      return json(res, 401, { alias: 'auth.unauthorized', message: 'unauthorized', type: 'error' })
    if (m === 'GET' && p === '/internal/auth')
      return json(res, 200, { id: 1, phone: '+998901234567', full_name: 'Мадина Каримова', is_admin: true })
    if (m === 'POST' && p === '/internal/auth/logout') return json(res, 204)
    if (m === 'POST' && p === '/internal/auth/password') return json(res, 204)
    if (m === 'GET' && p === '/internal/notifications') {
      let items = notifications.slice()
      const q = url.searchParams
      if (q.get('search')) {
        const s = q.get('search').toLowerCase()
        items = items.filter(
          (n) =>
            JSON.stringify(n.title).toLowerCase().includes(s) ||
            JSON.stringify(n.description).toLowerCase().includes(s),
        )
      }
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
      if (m === 'GET')
        return json(res, 200, {
          notification: {
            id: n.id,
            title: n.title,
            description: n.description,
            type: n.type,
            url: n.url,
            created_at: n.created_at,
          },
          audience: n.audience,
          target_platform: n.target_platform,
          targeted_count: n.targeted_count,
          read_count: n.read_count,
          unread_count: n.unread_count,
          updated_at: n.updated_at,
        })
      if (m === 'PATCH') {
        const b = await read(req)
        Object.assign(n, b, { updated_at: new Date().toISOString() })
        return json(res, 204)
      }
      if (m === 'DELETE') {
        notifications.splice(notifications.indexOf(n), 1)
        return json(res, 204)
      }
    }
    if (m === 'POST' && p === '/internal/notifications') {
      const b = await read(req)
      const audience = b.target?.kind === 'all' ? 'broadcast' : b.target?.kind === 'platform' ? 'platform' : 'targeted'
      const count = b.target?.user_ids?.length ?? (b.target?.user_id ? 1 : (b.target?.push_tokens?.length ?? 0))
      const n = {
        id: nextId++,
        audience,
        target_platform: b.target?.platform,
        title: b.title,
        description: b.description,
        type: b.type,
        url: b.url,
        created_at: new Date().toISOString(),
        targeted_count: count,
        read_count: 0,
        unread_count: count,
      }
      notifications.unshift(n)
      const push = {
        resolved: audience === 'broadcast' ? 2140 : count,
        sent: audience === 'broadcast' ? 2101 : count,
        failed: audience === 'broadcast' ? 39 : 0,
        skipped_revoked: 0,
        batch_ids: ['b1'],
      }
      return json(res, 201, {
        notification: {
          id: n.id,
          title: n.title,
          description: n.description,
          type: n.type,
          url: n.url,
          created_at: n.created_at,
        },
        push,
        targets_created: count,
      })
    }
    if (m === 'POST' && p === '/internal/push/send') {
      const b = await read(req)
      const c = b.target?.push_tokens?.length ?? 1
      return json(res, 200, { resolved: c, sent: c, failed: 0, skipped_revoked: 0 })
    }
    if (m === 'POST' && p === '/internal/receipts/promote-pending')
      return json(res, 200, {
        before: url.searchParams.get('before') || new Date(now - 60000).toISOString(),
        promoted: 14,
      })
    if (m === 'GET' && p === '/internal/receipts') {
      const q = url.searchParams
      let items = receipts.slice()
      if (q.get('status')) items = items.filter((r) => r.status === q.get('status'))
      if (q.get('user_id')) items = items.filter((r) => r.user_id === Number(q.get('user_id')))
      const company = (q.get('company') || '').toLowerCase()
      if (company) items = items.filter((r) => r.company_name.toLowerCase().includes(company))
      const before = Number(q.get('before_id') || 0)
      if (before) items = items.filter((r) => r.id < before)
      const limit = Number(q.get('limit') || 25)
      // The summary is computed before the page is cut, matching the real
      // endpoint's "whole filtered set" semantics.
      const summary = receiptSummary(items)
      return json(res, 200, {
        items: items.slice(0, limit),
        has_more: items.length > limit,
        totals: summary.totals,
        summary,
      })
    }
    const receiptReject = p.match(/^\/internal\/receipts\/(\d+)\/reject$/)
    if (receiptReject && m === 'POST') {
      const b = await read(req)
      const row = receipts.find((r) => r.id === Number(receiptReject[1]))
      if (!row) return json(res, 404, { alias: 'receipts.not_found', message: 'receipt not found', type: 'error' })
      if (row.status === 'canceled')
        return json(res, 409, {
          alias: 'receipts.not_rejectable',
          message: 'receipt cannot be rejected in its current state',
          type: 'error',
        })

      const tx = row.cashback_transaction
      let cashback_reversal = 'none'
      if (tx) {
        if (tx.status === 'pending') {
          tx.status = 'rejected'
          cashback_reversal = 'rejected'
        } else {
          tx.status = 'reversed'
          const mirrored = transactions.find((t) => t.id === tx.id)
          if (mirrored) mirrored.status = 'reversed'
          cashback_reversal = 'clawed_back'
        }
      }

      row.status = 'canceled'
      row.rejected_by_operator = true
      row.error_code = 'receipts.rejected_by_operator'
      row.cancel_reason = b.reason || 'Отклонён оператором'
      row.updated_at = new Date(now).toISOString()

      const balance = transactions
        .filter((t) => t.user_id === row.user_id && (t.status === 'posted' || t.status === 'reversed'))
        .reduce((acc, t) => {
          const credits = ['welcome_bonus', 'friend_invitation', 'receipt_scan', 'survey_completion']
          const sign = credits.includes(t.type) ? 1 : -1
          return acc + (t.status === 'posted' ? sign * t.amount : 0)
        }, 0)

      return json(res, 200, {
        receipt: row,
        cashback_reversal,
        transaction: tx,
        balance: {
          available: balance,
          pending: transactions
            .filter((t) => t.user_id === row.user_id && t.status === 'pending')
            .reduce((a, t) => a + t.amount, 0),
        },
      })
    }
    const receiptDetail = p.match(/^\/internal\/receipts\/(\d+)$/)
    if (receiptDetail && m === 'GET') {
      const row = receipts.find((r) => r.id === Number(receiptDetail[1]))
      return row
        ? json(res, 200, { receipt: row, items: receiptItems[row.id] ?? [] })
        : json(res, 404, { alias: 'receipts.not_found', message: 'receipt not found', type: 'error' })
    }
    if (m === 'GET' && p === '/internal/transactions') {
      const q = url.searchParams
      let items = transactions.slice()
      if (q.get('status')) items = items.filter((t) => t.status === q.get('status'))
      if (q.get('type')) items = items.filter((t) => t.type === q.get('type'))
      if (q.get('user_id')) items = items.filter((t) => t.user_id === Number(q.get('user_id')))
      const before = Number(q.get('before_id') || 0)
      if (before) items = items.filter((t) => t.id < before)
      const limit = Number(q.get('limit') || 25)
      const summary = transactionSummary(items)
      return json(res, 200, {
        items: items.slice(0, limit),
        has_more: items.length > limit,
        totals: summary.totals,
        summary,
      })
    }
    const txDetail = p.match(/^\/internal\/transactions\/(\d+)$/)
    if (txDetail && m === 'GET') {
      const row = transactions.find((t) => t.id === Number(txDetail[1]))
      return row
        ? json(res, 200, { transaction: row })
        : json(res, 404, { alias: 'transactions.not_found', message: 'transaction not found', type: 'error' })
    }
    if (m === 'GET' && p === '/internal/users') {
      const q = url.searchParams
      let items = users.slice()
      const digits = (q.get('phone') || '').replace(/\D/g, '')
      if (digits) items = items.filter((u) => u.phone.replace(/\D/g, '').includes(digits))
      if (q.get('status')) items = items.filter((u) => u.status === q.get('status'))
      else items = items.filter((u) => u.status !== 'deleted')
      const before = Number(q.get('before_id') || 0)
      if (before) items = items.filter((u) => u.id < before)
      const limit = Number(q.get('limit') || 20)
      return json(res, 200, { items: items.slice(0, limit), has_more: items.length > limit, totals: items.length })
    }
    const userDetail = p.match(/^\/internal\/users\/(\d+)$/)
    if (userDetail && m === 'GET') {
      const u = users.find((x) => x.id === Number(userDetail[1]))
      return u
        ? json(res, 200, u)
        : json(res, 404, { alias: 'users.not_found', message: 'user not found', type: 'error' })
    }
    const userStatus = p.match(/^\/internal\/users\/(\d+)\/status$/)
    if (userStatus && m === 'PATCH') {
      const b = await read(req)
      const u = users.find((x) => x.id === Number(userStatus[1]))
      if (!u) return json(res, 404, { alias: 'users.not_found', message: 'user not found', type: 'error' })
      if (!['active', 'blocked', 'deleted'].includes(b.status))
        return json(res, 400, { alias: 'users.invalid_status', message: 'bad status', type: 'error' })
      if (u.status === 'deleted')
        return json(res, 409, { alias: 'users.invalid_transition', message: 'deleted is terminal', type: 'error' })
      const sessions_revoked = b.status === 'active' ? 0 : Math.ceil(Math.random() * 3)
      u.status = b.status
      u.updated_at = new Date(now).toISOString()
      return json(res, 200, { user: u, sessions_revoked })
    }
    if (m === 'GET' && p === '/internal/versions') return json(res, 200, { items: versions, totals: versions.length })
    if (m === 'POST' && p === '/internal/versions') {
      const b = await read(req)
      const cur = versions.find((v) => v.platform === b.platform)
      if (cur && cur.version >= b.version)
        return json(res, 409, {
          alias: 'version.stale_write',
          code: 'stale',
          message: 'stale',
          type: 'error',
          stored_platform: cur.platform,
          stored_version: cur.version,
        })
      if (cur) Object.assign(cur, b)
      else versions.push(b)
      return json(res, 200, b)
    }
    const del = p.match(/^\/internal\/versions\/(\w+)$/)
    if (del && m === 'DELETE') {
      versions = versions.filter((v) => v.platform !== del[1])
      return json(res, 204)
    }
    json(res, 404, { message: 'no route', type: 'error' })
  })
  .listen(PORT, () => console.log('mock on', PORT))
