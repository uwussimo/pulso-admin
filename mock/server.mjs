// Minimal mock of the service-pulso internal API (and the mobile /v1/surveys slice) for visual verification only.
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

// ---- promo products + nomenclature catalog (IT-10508) ----

const catalog = [
  {
    id: 415,
    name: 'Тромбопол',
    full_name: 'Тромбопол табл. 75 мг блистер №60',
    maker: { id: 845, name: 'Polpharma', country_name: 'Польша' },
    image_url: 'https://placehold.co/96x96/png?text=Тромбо',
    reference_retail_price_with_vat: 38500,
    inn: '123456789012',
    packages: [
      {
        ikpu_code: '03004098003012004',
        package_code: 1111886,
        package_name: 'dona (tabletka (75 mg))',
        is_default: true,
      },
      {
        ikpu_code: '03004098003012003',
        package_code: 1111885,
        package_name: 'dona (tabletka (100 mg))',
        is_default: false,
      },
    ],
  },
  {
    id: 416,
    name: 'Канефрон H',
    full_name: 'Канефрон H р-р орал. фл. 100 мл №1',
    maker: { id: 1040, name: 'Bionorica', country_name: 'Германия' },
    image_url: 'https://placehold.co/96x96/png?text=Канеф',
    reference_retail_price_with_vat: 124400,
    inn: '770865120004',
    packages: [
      {
        ikpu_code: '03004285021001003',
        package_code: 1145109,
        package_name: 'dona (flakon (100 ml))',
        is_default: true,
      },
    ],
  },
  {
    id: 417,
    // The longest catalogue title of the seed set — the case that pushes an
    // auto-layout table past its container when nothing bounds the name cell.
    name: 'Бромгексин 8 Берлин-Хеми',
    full_name: 'Бромгексин 8 Берлин-Хеми табл. 8 мг блистер №25',
    maker: { id: 1041, name: 'Berlin-Chemie', country_name: 'Германия' },
    image_url: 'https://placehold.co/96x96/png?text=Бромг',
    reference_retail_price_with_vat: 21700,
    inn: '770865120011',
    packages: [
      {
        ikpu_code: '03004554002020002',
        package_code: 1126821,
        package_name: 'dona (tabletka (8 mg))',
        is_default: true,
      },
      {
        ikpu_code: '03004554002020003',
        package_code: 1126822,
        package_name: 'dona (tabletka (4 mg))',
        is_default: false,
      },
    ],
  },
  {
    id: 418,
    name: 'Витамин D3',
    full_name: 'Холекальциферол 500 МЕ № 60 капель',
    maker: { id: 13, name: 'Эвалар', country_name: 'Россия' },
    image_url: 'https://placehold.co/96x96/png?text=ВитD',
    reference_retail_price_with_vat: 9400,
    packages: [{ ikpu_code: '0000000031', package_code: 1, package_name: 'капли 500 МЕ, № 60', is_default: true }],
  },
]

// The real service nests the catalogue payload under `nomenclature` on every
// promo product and the panel flattens it at the API boundary. The mock serves
// the same shape, so a divergence shows up here instead of in production.
const nomenclatureOf = (drug) => ({
  id: drug.id,
  name: drug.name,
  full_name: drug.full_name,
  image_url: drug.image_url || '',
  ikpu_count: drug.packages.length,
  maker: { ...drug.maker },
})

// is_live is the same predicate the real service computes: status 100, not
// soft-deleted, and ends_at has not passed.
const isLive = (p) => p.status === 100 && (!p.ends_at || new Date(p.ends_at).getTime() >= now)

let promoProducts = [
  {
    id: 1,
    nomenclature_id: 415,
    nomenclature: nomenclatureOf(catalog[0]),
    status: 100,
    is_new: true,
    bonus_amount: 2000,
    max_price: 40000,
    price_note: 'по акции производителя',
    applies_to: 'Ташкент и Самарканд',
    ends_at: new Date(now + 90 * 24 * h).toISOString(),
    position: 1,
    created_at: new Date(now - 20 * 24 * h).toISOString(),
    updated_at: new Date(now - 2 * 24 * h).toISOString(),
    packages: catalog[0].packages.map((p, i) => ({ ...p, id: i + 1, position: i })),
    effect: { purchases_count: 184, bonus_paid: 368000, receipts_count: 96 },
  },
  {
    // Past ends_at → is_live false, renders «Завершён».
    id: 2,
    nomenclature_id: 416,
    nomenclature: nomenclatureOf(catalog[1]),
    status: 100,
    is_new: false,
    bonus_amount: 800,
    max_price: 0,
    price_note: '',
    applies_to: 'по всей республике',
    ends_at: new Date(now - 5 * 24 * h).toISOString(),
    position: 5,
    created_at: new Date(now - 60 * 24 * h).toISOString(),
    updated_at: new Date(now - 6 * 24 * h).toISOString(),
    packages: catalog[1].packages.map((p, i) => ({ ...p, id: i + 4, position: i })),
    effect: { purchases_count: 57, bonus_paid: 45600, receipts_count: 31 },
  },
  {
    // ends_at null → «бессрочно», but paused → «Выключен»: the state the
    // operator's Switch produces, reachable offline without touching anything.
    id: 3,
    nomenclature_id: 417,
    nomenclature: nomenclatureOf(catalog[2]),
    status: 200,
    is_new: false,
    bonus_amount: 1200,
    max_price: 25000,
    price_note: '',
    applies_to: 'Ташкент',
    ends_at: null,
    position: 3,
    created_at: new Date(now - 10 * 24 * h).toISOString(),
    updated_at: new Date(now - 10 * 24 * h).toISOString(),
    packages: catalog[2].packages.map((p, i) => ({ ...p, id: i + 6, position: i })),
    effect: null,
  },
]

// The tiles read these numbers, never the loaded page.
const promoSummary = (rows) => ({
  totals: rows.length,
  live_count: rows.filter(isLive).length,
  purchases_count: rows.reduce((a, p) => a + (p.effect?.purchases_count || 0), 0),
  bonus_paid: rows.reduce((a, p) => a + (p.effect?.bonus_paid || 0), 0),
})

const withLiveness = (p) => ({ ...p, is_live: isLive(p) })

// ---- goal offers / «экстра-выгода» (IT-10739) ----

// The operator list carries no product name: the real service nests nothing
// here, so the mock must not either — a mock that answers more than the real
// service hides the gap until production.
const offerContent = (ru, uz, uzCyrl) => {
  const c = {}
  if (ru) c.ru = ru
  if (uz) c.uz = uz
  if (uzCyrl) c.uzCyrl = uzCyrl
  return c
}

// The operator copy. There is no instruction/button label: that content
// comes from the backend's AI summary, keyed on the product. The rules are
// one block of text, not a list, and the how-it-works steps are the app's
// own copy.
const offerText = (title, subtitle, rationale, rules = '') => ({
  title,
  subtitle,
  rationale,
  rules,
})

let extraBenefitOffers = [
  {
    id: 1,
    status: 100,
    nomenclature_id: 415,
    ikpu_codes: catalog[0].packages.map((p) => p.ikpu_code),
    goal_target: 5,
    bonus_amount: 15000,
    currency: 'UZS',
    content: offerContent(
      offerText(
        'Запас на сезон простуды',
        'Пять упаковок — фиксированный бонус сверх кешбэка',
        'Простуда не ждёт, а лекарство всегда нужно. Копим запас — получаем фиксированный бонус.',
        'Цель действует на чеки из любых аптек Узбекистана. Бонус начисляется автоматически после пятой упаковки.',
      ),
      offerText(
        'Soviqa oldini olish zaxirasi',
        'Besh dona — keksbekdan tashqari qo‘shimcha bonus',
        '',
        'Maqsad O‘zbekistondagi istalgan dorixonadan olingan cheklardan hisoblanadi.',
      ),
      offerText(
        'Простуда учун захира',
        'Беш дона — кешбекдан ташқари қўшимча бонус',
        '',
        'Мақсад Ўзбекистондаги исталган дарёхоналардан олинган чеклар ҳисобланади.',
      ),
    ),
    starts_at: new Date(now - 10 * 24 * h).toISOString(),
    ends_at: new Date(now + 20 * 24 * h).toISOString(),
    position: 1,
    created_at: new Date(now - 12 * 24 * h).toISOString(),
    updated_at: new Date(now - 1 * 24 * h).toISOString(),
  },
  {
    // Russian only — the app falls back to it, and the list says «RU» so the
    // operator knows the Uzbek copy is missing.
    id: 2,
    status: 200,
    nomenclature_id: 418,
    ikpu_codes: catalog[3].packages.map((p) => p.ikpu_code),
    goal_target: 3,
    bonus_amount: 9000,
    currency: 'UZS',
    content: offerContent(
      offerText(
        'Витамин D на весь год',
        'Три флакона — бонус сверх кешбэка',
        'Зимой витамин D нужен всем, а летом его забывают купить.',
        '',
      ),
    ),
    starts_at: new Date(now - 5 * 24 * h).toISOString(),
    ends_at: new Date(now + 60 * 24 * h).toISOString(),
    position: 2,
    created_at: new Date(now - 8 * 24 * h).toISOString(),
    updated_at: new Date(now - 8 * 24 * h).toISOString(),
  },
  {
    // ends_at in the past → «Завершён» even though status is live.
    id: 3,
    status: 100,
    nomenclature_id: 416,
    ikpu_codes: catalog[1].packages.map((p) => p.ikpu_code),
    goal_target: 4,
    bonus_amount: 12000,
    currency: 'UZS',
    content: offerContent(offerText('Канефрон — курс поддержки', 'Четыре упаковки — бонус', '')),
    starts_at: new Date(now - 40 * 24 * h).toISOString(),
    ends_at: new Date(now - 3 * 24 * h).toISOString(),
    position: 3,
    created_at: new Date(now - 45 * 24 * h).toISOString(),
    updated_at: new Date(now - 3 * 24 * h).toISOString(),
  },
  {
    // One code the catalogue does not carry — the form must show it, not
    // reject it: a code simply never matches a receipt.
    id: 4,
    status: 100,
    nomenclature_id: 417,
    ikpu_codes: [...catalog[2].packages.map((p) => p.ikpu_code), '0000000099'],
    goal_target: 6,
    bonus_amount: 25000,
    currency: 'UZS',
    content: offerContent(
      offerText('Шесть упаковок — одна в подарок', 'Фиксированный бонус за цель', ''),
      offerText('Olti dona — sovg‘a sifatida bonus', ''),
    ),
    starts_at: new Date(now - 2 * 24 * h).toISOString(),
    ends_at: new Date(now + 45 * 24 * h).toISOString(),
    position: 4,
    created_at: new Date(now - 2 * 24 * h).toISOString(),
    updated_at: new Date(now - 2 * 24 * h).toISOString(),
  },
]

let nextOfferId = 5

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

// The mock does not store bytes: it hands back a deterministic
// data-URI-looking URL so the markdown the panel builds renders an image
// during local verification without needing a bucket.
const uploadMock = (req) =>
  new Promise((resolve) => {
    let size = 0
    let name = 'upload.png'
    req.on('data', (c) => {
      size += c.length
      const m = /filename="([^"]+)"/.exec(c.toString('latin1'))
      if (m) name = m[1]
    })
    req.on('end', () => resolve({ name, size }))
  })

// ---- surveys ----
const PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const img = (seed) => `https://picsum.photos/seed/${seed}/1200/800`
const fullSchema = {
  version: 1,
  fields: [
    {
      id: 'q_visit',
      key: 'visit_freq',
      type: 'single_choice',
      label: {
        ru: 'Как часто вы заходите в аптеку?',
        uz: 'Dorixonaga qanchalik tez-tez borasiz?',
        uzCyrl: 'Дорихонага қанчалик тез-тез борасиз?',
      },
      required: true,
      options: [
        { id: 'o1', value: 'weekly', label: { ru: 'Раз в неделю', uz: 'Haftada bir', uzCyrl: 'Ҳафтада бир' } },
        { id: 'o2', value: 'monthly', label: { ru: 'Раз в месяц', uz: 'Oyda bir', uzCyrl: 'Ойда бир' } },
        { id: 'o3', value: 'rarely', label: { ru: 'Реже', uz: 'Kamroq', uzCyrl: 'Камроқ' } },
      ],
    },
    {
      id: 'q_cats',
      key: 'categories',
      type: 'multi_choice',
      label: {
        ru: 'Что покупаете чаще всего?',
        uz: 'Koʻpincha nima sotib olasiz?',
        uzCyrl: 'Кўпинча нима сотиб оласиз?',
      },
      required: true,
      min: 1,
      max: 3,
      options: [
        { id: 'c1', value: 'vitamins', label: { ru: 'Витамины', uz: 'Vitaminlar', uzCyrl: 'Витаминлар' } },
        {
          id: 'c2',
          value: 'painkillers',
          label: { ru: 'Обезболивающие', uz: 'Ogʻriq qoldiruvchi', uzCyrl: 'Оғриқ қолдирувчи' },
        },
        { id: 'c3', value: 'cosmetics', label: { ru: 'Косметика', uz: 'Kosmetika', uzCyrl: 'Косметика' } },
        {
          id: 'c4',
          value: 'kids',
          label: { ru: 'Детские товары', uz: 'Bolalar mahsulotlari', uzCyrl: 'Болалар маҳсулотлари' },
        },
      ],
    },
    {
      id: 'q_app',
      key: 'uses_app',
      type: 'yes_no',
      label: {
        ru: 'Пользуетесь ли вы кешбэком Pulso?',
        uz: 'Pulso keshbekidan foydalanasizmi?',
        uzCyrl: 'Pulso кешбекидан фойдаланасизми?',
      },
      required: true,
    },
    {
      id: 'q_why',
      key: 'why_not',
      type: 'textarea',
      label: { ru: 'Почему нет?', uz: 'Nega yoʻq?', uzCyrl: 'Нега йўқ?' },
      help: { ru: 'Пара слов — нам поможет', uz: 'Bir-ikki soʻz yetarli', uzCyrl: 'Бир-икки сўз етарли' },
      required: false,
      maxLength: 500,
      visibleWhen: { type: 'equals', fieldId: 'q_app', value: false },
    },
    {
      id: 'q_rate',
      key: 'rating',
      type: 'rating',
      label: { ru: 'Оцените сервис', uz: 'Xizmatni baholang', uzCyrl: 'Хизматни баҳоланг' },
      required: true,
      max: 5,
    },
    {
      id: 'q_nps',
      key: 'nps',
      type: 'nps',
      label: {
        ru: 'Порекомендуете Pulso друзьям?',
        uz: 'Pulso ni doʻstlaringizga tavsiya qilasizmi?',
        uzCyrl: 'Pulso ни дўстларингизга тавсия қиласизми?',
      },
      required: true,
    },
    {
      id: 'q_spend',
      key: 'spend',
      type: 'number',
      label: {
        ru: 'Сколько тратите в месяц, тыс. сум?',
        uz: 'Oyiga qancha sarflaysiz, ming soʻm?',
        uzCyrl: 'Ойига қанча сарфлайсиз, минг сўм?',
      },
      required: false,
      min: 0,
      max: 5000,
    },
    {
      id: 'q_name',
      key: 'name',
      type: 'text',
      label: {
        ru: 'Как к вам обращаться?',
        uz: 'Sizga qanday murojaat qilish mumkin?',
        uzCyrl: 'Сизга қандай мурожаат қилиш мумкин?',
      },
      required: false,
      maxLength: 60,
    },
    {
      id: 'q_date',
      key: 'last_visit',
      type: 'date',
      label: {
        ru: 'Когда были в аптеке в последний раз?',
        uz: 'Oxirgi marta dorixonada qachon boʻldingiz?',
        uzCyrl: 'Охирги марта дорихонада қачон бўлдингиз?',
      },
      required: false,
    },
    {
      id: 'q_slide',
      key: 'promo_slides',
      type: 'slide',
      label: { ru: 'Посмотрите новинки', uz: 'Yangiliklarni koʻring', uzCyrl: 'Янгиликларни кўринг' },
      required: false,
      slides: [
        { id: 's1', url: img('pulso1'), name: 'Витамины', mime: 'image/jpeg' },
        { id: 's2', url: img('pulso2'), name: 'Косметика', mime: 'image/jpeg' },
        { id: 's3', url: PDF_URL, name: 'Каталог.pdf', mime: 'application/pdf' },
      ],
    },
    {
      id: 'q_photo',
      key: 'receipt_photo',
      type: 'image_upload',
      label: { ru: 'Прикрепите фото чека', uz: 'Chek rasmini biriktiring', uzCyrl: 'Чек расмини бириктиринг' },
      required: false,
      maxFiles: 2,
    },
  ],
}
const smallSchema = {
  version: 1,
  fields: [
    { id: 'a1', key: 'like', type: 'yes_no', label: { ru: 'Понравилась новая аптека?' }, required: true },
    { id: 'a2', key: 'score', type: 'rating', label: { ru: 'Оцените от 1 до 5' }, required: true, max: 5 },
  ],
}
let surveys = [
  {
    id: 1,
    title: { ru: 'Черновик: про доставку', uz: 'Qoralama: yetkazib berish haqida' },
    description: { ru: 'Ещё не готов.' },
    reward_amount: 3000,
    status: 'draft',
    starts_at: undefined,
    ends_at: undefined,
    schema: smallSchema,
    created_at: new Date(now - 5 * h).toISOString(),
    updated_at: new Date(now - 2 * h).toISOString(),
    created_by: 1,
  },
  {
    id: 2,
    title: { ru: 'Запланирован: витамины осенью', uz: 'Rejalashtirilgan: kuzda vitaminlar' },
    description: {},
    reward_amount: 2000,
    status: 'pending',
    starts_at: new Date(now + 48 * h).toISOString(),
    ends_at: new Date(now + 240 * h).toISOString(),
    schema: smallSchema,
    created_at: new Date(now - 30 * h).toISOString(),
    updated_at: new Date(now - 20 * h).toISOString(),
    created_by: 1,
  },
  {
    id: 3,
    title: { ru: 'Как вам аптеки Pulso?', uz: 'Pulso dorixonalari qanday?', uzCyrl: 'Pulso дорихоналари қандай?' },
    description: {
      ru: 'Ответьте на 10 вопросов и получите 5 000 сум на баланс.',
      uz: '10 savolga javob bering va balansga 5 000 soʻm oling.',
      uzCyrl: '10 саволга жавоб беринг ва балансга 5 000 сўм олинг.',
    },
    cover_image_url: img('pulsocover'),
    reward_amount: 5000,
    status: 'active',
    starts_at: undefined,
    ends_at: new Date(now + 400 * h).toISOString(),
    schema: fullSchema,
    created_at: new Date(now - 100 * h).toISOString(),
    updated_at: new Date(now - 50 * h).toISOString(),
    created_by: 1,
  },
  {
    id: 4,
    title: { ru: 'Завершён: летняя акция' },
    description: {},
    reward_amount: 1000,
    status: 'closed',
    starts_at: undefined,
    ends_at: undefined,
    closed_at: new Date(now - 300 * h).toISOString(),
    schema: smallSchema,
    created_at: new Date(now - 900 * h).toISOString(),
    updated_at: new Date(now - 300 * h).toISOString(),
    created_by: 1,
  },
]
let nextSurveyId = 5
let nextSubmissionId = 7
const submissions = [
  {
    id: 1,
    survey_id: 3,
    user_id: 1052,
    token: 'mobile-done',
    answers: {
      q_visit: 'weekly',
      q_cats: ['vitamins', 'kids'],
      q_app: true,
      q_rate: 5,
      q_nps: 10,
      q_spend: 300,
      q_name: 'Мадина',
      q_date: '2026-10-01',
      q_slide: 'viewed',
    },
    created_at: new Date(now - 40 * h).toISOString(),
  },
  {
    id: 2,
    survey_id: 3,
    user_id: 1051,
    answers: {
      q_visit: 'monthly',
      q_cats: ['painkillers'],
      q_app: false,
      q_why: 'Не знал, что есть кешбэк',
      q_rate: 3,
      q_nps: 6,
      q_slide: 'viewed',
    },
    created_at: new Date(now - 30 * h).toISOString(),
  },
  {
    id: 3,
    survey_id: 3,
    user_id: 1049,
    answers: {
      q_visit: 'weekly',
      q_cats: ['cosmetics', 'vitamins'],
      q_app: true,
      q_rate: 4,
      q_nps: 9,
      q_spend: 450,
      q_slide: 'viewed',
      q_photo: [img('receipt1')],
    },
    created_at: new Date(now - 20 * h).toISOString(),
  },
  {
    id: 4,
    survey_id: 3,
    user_id: 1050,
    answers: {
      q_visit: 'rarely',
      q_cats: ['kids'],
      q_app: false,
      q_why: 'Сложно сканировать чеки',
      q_rate: 2,
      q_nps: 3,
      q_slide: 'viewed',
    },
    created_at: new Date(now - 10 * h).toISOString(),
  },
  {
    id: 5,
    survey_id: 3,
    user_id: 1048,
    answers: {
      q_visit: 'monthly',
      q_cats: ['vitamins'],
      q_app: true,
      q_rate: 4,
      q_nps: 8,
      q_name: 'Азиз',
      q_slide: 'viewed',
    },
    created_at: new Date(now - 6 * h).toISOString(),
  },
  {
    id: 6,
    survey_id: 4,
    user_id: 1052,
    answers: { a1: true, a2: 5 },
    created_at: new Date(now - 500 * h).toISOString(),
  },
]
const isSurveyLive = (s) => {
  const t = Date.now()
  const startOk =
    s.status === 'active' || (s.status === 'pending' && s.starts_at && new Date(s.starts_at).getTime() <= t)
  const endOk = !s.ends_at || new Date(s.ends_at).getTime() > t
  return Boolean(startOk && endOk)
}
const subsOf = (id) => submissions.filter((x) => x.survey_id === id)
const adminSurvey = (s, withSchema) => ({
  id: s.id,
  title: s.title,
  description: s.description,
  cover_image_url: s.cover_image_url,
  reward_amount: s.reward_amount,
  status: s.status,
  is_live: isSurveyLive(s),
  starts_at: s.starts_at,
  ends_at: s.ends_at,
  questions_count: s.schema.fields.length,
  submissions_count: subsOf(s.id).length,
  reward_total: subsOf(s.id).length * s.reward_amount,
  created_at: s.created_at,
  updated_at: s.updated_at,
  closed_at: s.closed_at,
  ...(withSchema ? { schema: s.schema } : {}),
})
const submissionJSON = (x, withAnswers) => {
  const u = users.find((u) => u.id === x.user_id)
  const s = surveys.find((s) => s.id === x.survey_id)
  return {
    id: x.id,
    survey_id: x.survey_id,
    user_id: x.user_id,
    user_phone: u?.phone,
    user_name: u?.full_name || undefined,
    reward_amount: s?.reward_amount ?? 0,
    credited: (s?.reward_amount ?? 0) > 0,
    transaction_id: (s?.reward_amount ?? 0) > 0 ? 9000 + x.id : undefined,
    created_at: x.created_at,
    ...(withAnswers ? { answers: x.answers } : {}),
  }
}
const err = (res, code, alias, message) => json(res, code, { alias, code, message, type: 'error' })
const TRANSITIONS = {
  draft: ['pending', 'active'],
  pending: ['active', 'draft', 'closed'],
  active: ['closed'],
  closed: [],
}
function evalCond(c, answers) {
  const v = answers[c.fieldId]
  const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
  switch (c.type) {
    case 'and':
      return c.rules.length > 0 && c.rules.every((r) => evalCond(r, answers))
    case 'or':
      return c.rules.some((r) => evalCond(r, answers))
    case 'answered':
      return !empty
    case 'equals':
      return (
        !empty &&
        (Array.isArray(v)
          ? v.map(String).includes(String(c.value))
          : typeof v === 'boolean'
            ? v === c.value
            : String(v) === String(c.value))
      )
    case 'not_equals':
      return (
        !empty &&
        !(Array.isArray(v)
          ? v.map(String).includes(String(c.value))
          : typeof v === 'boolean'
            ? v === c.value
            : String(v) === String(c.value))
      )
    case 'in':
      return (
        !empty &&
        (Array.isArray(v)
          ? v.some((x) => c.values.map(String).includes(String(x)))
          : c.values.map(String).includes(String(v)))
      )
    default: {
      const n = Number(v)
      if (empty || Number.isNaN(n)) return false
      return c.type === 'gt'
        ? n > c.value
        : c.type === 'gte'
          ? n >= c.value
          : c.type === 'lt'
            ? n < c.value
            : n <= c.value
    }
  }
}
function validateAnswers(schema, raw) {
  const out = {}
  const seen = {}
  for (const f of schema.fields) {
    const visible = !f.visibleWhen || evalCond(f.visibleWhen, seen)
    if (!visible) continue
    let v = raw[f.id]
    if (f.type === 'slide') v = 'viewed'
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
    if (empty) {
      if (f.required && f.type !== 'slide') return { error: `answers.${f.id}: required` }
      continue
    }
    if (f.type === 'single_choice' && !f.options.some((o) => o.value === v))
      return { error: `answers.${f.id}: unknown option` }
    if (f.type === 'multi_choice') {
      if (!Array.isArray(v) || v.some((x) => !f.options.some((o) => o.value === x)))
        return { error: `answers.${f.id}: unknown option` }
      v = [...new Set(v)].sort()
    }
    if (f.type === 'yes_no' && typeof v !== 'boolean') return { error: `answers.${f.id}: boolean expected` }
    if (f.type === 'rating' && !(Number.isInteger(v) && v >= 1 && v <= f.max))
      return { error: `answers.${f.id}: out of range` }
    if (f.type === 'nps' && !(Number.isInteger(v) && v >= 0 && v <= 10))
      return { error: `answers.${f.id}: out of range` }
    out[f.id] = v
    seen[f.id] = v
  }
  return { answers: out }
}
function statsFor(s) {
  const subs = subsOf(s.id)
  const questions = s.schema.fields.map((f) => {
    const vals = subs
      .map((x) => x.answers[f.id])
      .filter((v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
    const q = { field_id: f.id, key: f.key, type: f.type, answered: vals.length }
    if (f.type === 'single_choice' || f.type === 'yes_no') {
      const m = new Map()
      for (const v of vals) m.set(String(v), (m.get(String(v)) ?? 0) + 1)
      q.options = [...m].map(([value, count]) => ({ value, count }))
    }
    if (f.type === 'multi_choice') {
      const m = new Map()
      for (const arr of vals) for (const v of arr) m.set(String(v), (m.get(String(v)) ?? 0) + 1)
      q.options = [...m].map(([value, count]) => ({ value, count }))
    }
    if (f.type === 'rating' || f.type === 'nps' || f.type === 'number') {
      const nums = vals.map(Number)
      if (nums.length) q.avg = nums.reduce((a, b) => a + b, 0) / nums.length
      const m = new Map()
      for (const n of nums) m.set(String(n), (m.get(String(n)) ?? 0) + 1)
      q.distribution = [...m].map(([value, count]) => ({ value, count }))
      if (f.type === 'nps' && nums.length) {
        const promoters = nums.filter((n) => n >= 9).length
        const detractors = nums.filter((n) => n <= 6).length
        q.nps_score = ((promoters - detractors) / nums.length) * 100
      }
    }
    return q
  })
  return { survey_id: s.id, submissions: subs.length, reward_total: subs.length * s.reward_amount, questions }
}
const readRaw = (req) =>
  new Promise((r) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => r(Buffer.concat(chunks)))
  })
async function handleUpload(req, res) {
  const buf = await readRaw(req)
  const head = buf.toString('latin1', 0, Math.min(buf.length, 4000))
  const m = /filename="([^"]+)"/.exec(head)
  const name = m ? Buffer.from(m[1], 'latin1').toString('utf8') : 'file'
  const ext = (name.split('.').pop() || '').toLowerCase()
  const isPdf = ext === 'pdf'
  return json(res, 201, {
    public_url: isPdf ? PDF_URL : img(`u${Date.now() % 100000}`),
    size_bytes: buf.length,
    content_type: isPdf
      ? 'application/pdf'
      : ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/jpeg',
    original_name: name,
  })
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

    // ---- mobile API (public /s/:id page). Tokens: mobile-test (new user), mobile-done (already completed). ----
    if (p.startsWith('/v1/')) {
      const token = (auth || '').replace('Bearer ', '')
      if (!['mobile-test', 'mobile-done', 'mobile-other'].includes(token))
        return err(res, 401, 'auth.invalid_token', 'invalid token')
      const userId = token === 'mobile-done' ? 1052 : token === 'mobile-other' ? 2002 : 2001
      if (m === 'POST' && p === '/v1/upload') return handleUpload(req, res)
      const det = p.match(/^\/v1\/surveys\/(\d+)$/)
      if (det && m === 'GET') {
        const s = surveys.find((x) => x.id === Number(det[1]))
        if (!s || s.status === 'draft') return err(res, 404, 'surveys.not_found', 'survey not found')
        const mine = subsOf(s.id).find((x) => x.token === token || x.user_id === userId)
        return json(res, 200, {
          survey: {
            id: s.id,
            title: s.title,
            description: s.description,
            cover_image_url: s.cover_image_url,
            reward_amount: s.reward_amount,
            currency: 'UZS',
            questions_count: s.schema.fields.length,
            starts_at: s.starts_at,
            ends_at: s.ends_at,
            is_active: isSurveyLive(s),
            schema: s.schema,
          },
          user_state: mine
            ? { status: 'completed', submission_id: mine.id, completed_at: mine.created_at }
            : { status: 'new' },
        })
      }
      const sub = p.match(/^\/v1\/surveys\/(\d+)\/submit$/)
      if (sub && m === 'POST') {
        const s = surveys.find((x) => x.id === Number(sub[1]))
        if (!s || s.status === 'draft') return err(res, 404, 'surveys.not_found', 'survey not found')
        const b = await read(req)
        const existing = subsOf(s.id).find((x) => x.token === token || x.user_id === userId)
        if (existing) {
          const same =
            JSON.stringify(validateAnswers(s.schema, b.answers || {}).answers) === JSON.stringify(existing.answers)
          if (!same) return err(res, 409, 'surveys.already_completed', 'already completed')
          return json(res, 200, {
            submission_id: existing.id,
            reward_amount: s.reward_amount,
            credited: false,
            already_completed: true,
            completed_at: existing.created_at,
          })
        }
        if (!isSurveyLive(s)) return err(res, 409, 'surveys.not_active', 'survey is not active')
        const v = validateAnswers(s.schema, b.answers || {})
        if (v.error) return err(res, 400, 'surveys.invalid_answers', v.error)
        await new Promise((r) => setTimeout(r, 1000))
        const row = {
          id: nextSubmissionId++,
          survey_id: s.id,
          user_id: userId,
          token,
          answers: v.answers,
          created_at: new Date().toISOString(),
        }
        submissions.push(row)
        return json(res, 200, {
          submission_id: row.id,
          reward_amount: s.reward_amount,
          credited: s.reward_amount > 0,
          already_completed: false,
          completed_at: row.created_at,
        })
      }
      return err(res, 404, 'not_found', 'no route')
    }
    if (!auth || !auth.startsWith('Bearer '))
      return json(res, 401, { alias: 'auth.unauthorized', message: 'unauthorized', type: 'error' })
    if (m === 'GET' && p === '/internal/auth')
      return json(res, 200, { id: 1, phone: '+998901234567', full_name: 'Мадина Каримова', is_admin: true })
    if (m === 'POST' && p === '/internal/auth/logout') return json(res, 204)
    if (m === 'POST' && p === '/internal/auth/password') return json(res, 204)

    // ---- surveys admin ----
    if (m === 'POST' && p === '/internal/upload') return handleUpload(req, res)
    if (m === 'GET' && p === '/internal/surveys') {
      const q = url.searchParams
      let items = surveys.slice().sort((a, b) => b.id - a.id)
      if (q.get('status')) items = items.filter((x) => x.status === q.get('status'))
      if (q.get('search')) {
        const needle = q.get('search').toLowerCase()
        items = items.filter((x) => JSON.stringify(x.title).toLowerCase().includes(needle))
      }
      const before = Number(q.get('before_id') || 0)
      if (before) items = items.filter((x) => x.id < before)
      const limit = Number(q.get('limit') || 20)
      return json(res, 200, {
        items: items.slice(0, limit).map((x) => adminSurvey(x, false)),
        has_more: items.length > limit,
        totals: items.length,
      })
    }
    if (m === 'POST' && p === '/internal/surveys') {
      const b = await read(req)
      if (!b.title?.ru) return err(res, 400, 'surveys.title_required', 'title.ru required')
      const s = {
        id: nextSurveyId++,
        title: b.title,
        description: b.description ?? {},
        cover_image_url: b.cover_image_url,
        reward_amount: b.reward_amount ?? 0,
        status: 'draft',
        starts_at: b.starts_at ?? undefined,
        ends_at: b.ends_at ?? undefined,
        schema: b.schema ?? { version: 1, fields: [] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 1,
      }
      surveys.push(s)
      return json(res, 201, adminSurvey(s, true))
    }
    const sv = p.match(/^\/internal\/surveys\/(\d+)(\/status|\/responses|\/stats|\/responses\/(\d+))?$/)
    if (sv) {
      const s = surveys.find((x) => x.id === Number(sv[1]))
      if (!s) return err(res, 404, 'surveys.not_found', 'survey not found')
      const tail = sv[2] || ''
      if (tail === '' && m === 'GET') return json(res, 200, adminSurvey(s, true))
      if (tail === '' && m === 'PUT') {
        const b = await read(req)
        if (s.status === 'closed') return err(res, 409, 'surveys.locked', 'closed survey is read-only')
        if (subsOf(s.id).length > 0) {
          if (JSON.stringify(b.schema) !== JSON.stringify(s.schema) || b.reward_amount !== s.reward_amount)
            return err(res, 409, 'surveys.locked', 'schema and reward are locked')
        }
        if (!b.title?.ru) return err(res, 400, 'surveys.title_required', 'title.ru required')
        Object.assign(s, {
          title: b.title,
          description: b.description ?? {},
          cover_image_url: b.cover_image_url,
          reward_amount: b.reward_amount ?? 0,
          starts_at: b.starts_at ?? undefined,
          ends_at: b.ends_at ?? undefined,
          schema: b.schema,
          updated_at: new Date().toISOString(),
        })
        return json(res, 200, adminSurvey(s, true))
      }
      if (tail === '' && m === 'DELETE') {
        if (s.status === 'active') return err(res, 409, 'surveys.invalid_status_transition', 'close the survey first')
        surveys = surveys.filter((x) => x.id !== s.id)
        return json(res, 204)
      }
      if (tail === '/status' && m === 'PATCH') {
        const b = await read(req)
        const to = b.status
        if (!['draft', 'pending', 'active', 'closed'].includes(to))
          return err(res, 400, 'surveys.invalid_status', 'unknown status')
        if (to === s.status) return json(res, 200, adminSurvey(s, true))
        if (!TRANSITIONS[s.status].includes(to))
          return err(res, 409, 'surveys.invalid_status_transition', `${s.status} -> ${to}`)
        if (to === 'pending' && (!s.starts_at || new Date(s.starts_at).getTime() <= Date.now()))
          return err(res, 400, 'surveys.invalid_window', 'starts_at must be in the future')
        if (to === 'draft' && subsOf(s.id).length) return err(res, 409, 'surveys.locked', 'has submissions')
        if ((to === 'active' || to === 'pending') && !s.schema.fields.some((f) => f.type !== 'slide'))
          return err(res, 400, 'surveys.invalid_schema', 'fields: at least one question')
        s.status = to
        if (to === 'closed') s.closed_at = new Date().toISOString()
        s.updated_at = new Date().toISOString()
        return json(res, 200, adminSurvey(s, true))
      }
      if (tail === '/responses' && m === 'GET') {
        const q = url.searchParams
        let items = subsOf(s.id)
          .slice()
          .sort((a, b) => b.id - a.id)
        const before = Number(q.get('before_id') || 0)
        if (before) items = items.filter((x) => x.id < before)
        const limit = Number(q.get('limit') || 20)
        return json(res, 200, {
          items: items.slice(0, limit).map((x) => submissionJSON(x, false)),
          has_more: items.length > limit,
          totals: items.length,
        })
      }
      if (sv[3] && m === 'GET') {
        const x = subsOf(s.id).find((y) => y.id === Number(sv[3]))
        if (!x) return err(res, 404, 'surveys.submission_not_found', 'submission not found')
        return json(res, 200, submissionJSON(x, true))
      }
      if (tail === '/stats' && m === 'GET') return json(res, 200, statsFor(s))
    }
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
      const term = (q.get('search') || '').trim()
      const digits = term.replace(/\D/g, '')
      if (term) {
        items = items.filter((u) => {
          const phone = u.phone.replace(/\D/g, '')
          const byPhone = digits ? phone.includes(digits) : false
          const byName = u.full_name.toLowerCase().includes(term.toLowerCase())
          const byId = digits && Number(digits) === u.id
          return byPhone || byName || byId
        })
      } else {
        const phoneDigits = (q.get('phone') || '').replace(/\D/g, '')
        if (phoneDigits) items = items.filter((u) => u.phone.replace(/\D/g, '').includes(phoneDigits))
      }
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
    if (m === 'POST' && p === '/internal/upload') {
      const f = await uploadMock(req)
      if (!f.size) return json(res, 400, { alias: 'upload.empty', message: 'file is empty', type: 'error' })
      const ext = (f.name.match(/\.[a-z0-9]+$/i) || ['.png'])[0]
      return json(res, 201, {
        public_url: `https://placehold.co/1200x675/png?text=${encodeURIComponent(f.name)}`,
        size_bytes: f.size,
        content_type: ext === '.png' ? 'image/png' : `image/${ext.slice(1)}`,
        original_name: f.name,
      })
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

    // ---- promo products ----

    const promoStatusId = p.match(/^\/internal\/promo\/(\d+)\/status$/)
    if (promoStatusId && m === 'PATCH') {
      const row = promoProducts.find((x) => x.id === Number(promoStatusId[1]))
      if (!row)
        return json(res, 404, { alias: 'promo.admin.not_found', message: 'promo product not found', type: 'error' })
      const b = await read(req)
      // 400 is not settable here — soft delete stays its own, final verb.
      if (b.status !== 100 && b.status !== 200)
        return json(res, 400, {
          alias: 'promo.admin.invalid_status',
          message: 'status must be 100 or 200',
          type: 'error',
        })
      row.status = b.status
      row.updated_at = new Date(now).toISOString()
      return json(res, 200, withLiveness(row))
    }

    const promoId = p.match(/^\/internal\/promo\/(\d+)$/)
    if (promoId) {
      const row = promoProducts.find((x) => x.id === Number(promoId[1]))
      if (!row)
        return json(res, 404, { alias: 'promo.admin.not_found', message: 'promo product not found', type: 'error' })
      if (m === 'GET') return json(res, 200, withLiveness(row))
      if (m === 'PUT') {
        const b = await read(req)
        // PUT is a partial update: only the keys present in the body are
        // validated, and only they are written.
        if (b.bonus_amount !== undefined && (!Number.isInteger(b.bonus_amount) || b.bonus_amount < 0))
          return json(res, 400, {
            alias: 'promo.admin.invalid_bonus',
            message: 'bonus must be a non-negative integer',
            type: 'error',
          })
        if (b.max_price !== undefined && (!Number.isInteger(b.max_price) || b.max_price < 0))
          return json(res, 400, {
            alias: 'promo.admin.invalid_price',
            message: 'price must be a non-negative integer',
            type: 'error',
          })
        if (b.ends_at && new Date(b.ends_at).getTime() < now)
          return json(res, 400, {
            alias: 'promo.admin.invalid_end_date',
            message: 'ends_at is in the past',
            type: 'error',
          })
        Object.assign(row, b, { updated_at: new Date(now).toISOString() })
        return json(res, 200, withLiveness(row))
      }
      if (m === 'DELETE') {
        promoProducts = promoProducts.filter((x) => x.id !== row.id)
        return json(res, 204)
      }
    }
    if (m === 'GET' && p === '/internal/promo') {
      const q = url.searchParams
      let items = promoProducts.slice()
      const term = (q.get('query') || '').toLowerCase()
      if (term)
        items = items.filter(
          (x) =>
            (x.nomenclature?.name || '').toLowerCase().includes(term) ||
            (x.nomenclature?.full_name || '').toLowerCase().includes(term) ||
            (x.nomenclature?.maker?.name || '').toLowerCase().includes(term),
        )
      const before = Number(q.get('before_id') || 0)
      if (before) items = items.filter((x) => x.id < before)
      const limit = Number(q.get('limit') || 25)
      const summary = promoSummary(items)
      return json(res, 200, {
        items: items.slice(0, limit).map(withLiveness),
        totals: summary.totals,
        has_more: items.length > limit,
        summary,
      })
    }
    if (m === 'POST' && p === '/internal/promo') {
      const b = await read(req)
      const drug = catalog.find((d) => d.id === Number(b.nomenclature_id))
      // The 400/409 statuses below are the only ones that leak a raw message
      // when an alias is missing, so each carries one.
      if (!b.nomenclature_id || Number.isNaN(Number(b.nomenclature_id)))
        return json(res, 400, { alias: 'nomin.invalid_id', message: 'nomenclature_id is required', type: 'error' })
      if (!drug)
        return json(res, 404, { alias: 'nomin.invalid_id', message: 'drug not found in catalog', type: 'error' })
      if (!Number.isInteger(b.bonus_amount) || b.bonus_amount < 0)
        return json(res, 400, {
          alias: 'promo.admin.invalid_bonus',
          message: 'bonus must be a non-negative integer',
          type: 'error',
        })
      if (!Number.isInteger(b.max_price) || b.max_price < 0)
        return json(res, 400, {
          alias: 'promo.admin.invalid_price',
          message: 'price must be a non-negative integer',
          type: 'error',
        })
      if (b.ends_at && new Date(b.ends_at).getTime() < now)
        return json(res, 400, {
          alias: 'promo.admin.invalid_end_date',
          message: 'ends_at is in the past',
          type: 'error',
        })
      if (promoProducts.some((x) => x.nomenclature_id === Number(b.nomenclature_id)))
        return json(res, 409, {
          alias: 'promo.admin.duplicate_nomenclature',
          message: 'already in promo',
          type: 'error',
        })
      if (!Array.isArray(b.packages) || b.packages.length === 0)
        return json(res, 400, {
          alias: 'promo.admin.invalid_packages',
          message: 'at least one ikpu code is required',
          type: 'error',
        })
      const row = {
        id: nextId++,
        nomenclature_id: drug.id,
        nomenclature: { ...nomenclatureOf(drug), ikpu_count: b.packages.length },
        status: 100,
        is_new: Boolean(b.is_new),
        bonus_amount: b.bonus_amount,
        max_price: b.max_price,
        price_note: b.price_note || '',
        applies_to: b.applies_to || '',
        ends_at: b.ends_at || null,
        position: b.position ?? 0,
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
        packages: b.packages,
        effect: null,
      }
      // A created product is live immediately — there is no enable step.
      promoProducts.push(row)
      return json(res, 201, withLiveness(row))
    }

    // ---- goal offers / «экстра-выгода» (IT-10739) ----

    if (m === 'GET' && p === '/internal/extra-benefit/offers') {
      const q = url.searchParams
      const limit = Number(q.get('limit') || 50)
      const offset = Number(q.get('offset') || 0)
      // Ordered by the operator-controlled position, like the real service.
      const rows = extraBenefitOffers.slice().sort((a, b) => a.position - b.position || a.id - b.id)
      return json(res, 200, {
        items: rows.slice(offset, offset + limit),
        totals: rows.length,
        limit,
        offset,
      })
    }
    if (m === 'POST' && p === '/internal/extra-benefit/offers') {
      const b = await read(req)
      const drug = catalog.find((d) => d.id === Number(b.nomenclature_id))
      if (!b.nomenclature_id || Number.isNaN(Number(b.nomenclature_id)))
        return err(res, 400, 'extra_benefit.offer.invalid', 'nomenclature_id is required')
      if (!drug) return err(res, 404, 'extra_benefit.offer.not_found', 'drug not found in catalog')
      if (!Array.isArray(b.ikpu_codes) || b.ikpu_codes.length === 0)
        return err(res, 400, 'extra_benefit.offer.invalid', 'at least one ikpu code is required')
      if (!Number.isInteger(b.goal_target) || b.goal_target < 1)
        return err(res, 400, 'extra_benefit.offer.invalid', 'goal_target must be a positive integer')
      if (!Number.isInteger(b.bonus_amount) || b.bonus_amount < 1)
        return err(res, 400, 'extra_benefit.offer.invalid', 'bonus_amount must be a positive integer')
      if (!b.starts_at || !b.ends_at)
        return err(res, 400, 'extra_benefit.offer.invalid', 'starts_at and ends_at are required')
      if (new Date(b.ends_at) <= new Date(b.starts_at))
        return err(res, 400, 'extra_benefit.offer.invalid', 'ends_at must be after starts_at')
      if (!b.content || !b.content.ru || !b.content.ru.title)
        return err(res, 400, 'extra_benefit.offer.invalid', 'a russian title is required')
      const row = {
        id: nextOfferId++,
        status: 100,
        nomenclature_id: drug.id,
        ikpu_codes: b.ikpu_codes,
        goal_target: b.goal_target,
        bonus_amount: b.bonus_amount,
        currency: 'UZS',
        content: b.content,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        position: b.position ?? 0,
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      }
      extraBenefitOffers.push(row)
      return json(res, 201, row)
    }

    const offerId = p.match(/^\/internal\/extra-benefit\/offers\/(\d+)$/)
    if (offerId && m === 'GET') {
      const row = extraBenefitOffers.find((x) => x.id === Number(offerId[1]))
      if (!row) return err(res, 404, 'extra_benefit.admin.not_found', 'offer not found')
      return json(res, 200, row)
    }
    if (offerId && m === 'PUT') {
      const row = extraBenefitOffers.find((x) => x.id === Number(offerId[1]))
      if (!row) return err(res, 404, 'extra_benefit.admin.not_found', 'offer not found')
      const b = await read(req)
      if (b.ikpu_codes !== undefined && (!Array.isArray(b.ikpu_codes) || b.ikpu_codes.length === 0))
        return err(res, 400, 'extra_benefit.offer.invalid', 'at least one ikpu code is required')
      if (b.goal_target !== undefined && (!Number.isInteger(b.goal_target) || b.goal_target < 1))
        return err(res, 400, 'extra_benefit.offer.invalid', 'goal_target must be a positive integer')
      if (b.bonus_amount !== undefined && (!Number.isInteger(b.bonus_amount) || b.bonus_amount < 1))
        return err(res, 400, 'extra_benefit.offer.invalid', 'bonus_amount must be a positive integer')
      const starts = b.starts_at ?? row.starts_at
      const ends = b.ends_at ?? row.ends_at
      if (new Date(ends) <= new Date(starts))
        return err(res, 400, 'extra_benefit.offer.invalid', 'ends_at must be after starts_at')
      if (b.content !== undefined && (!b.content.ru || !b.content.ru.title))
        return err(res, 400, 'extra_benefit.offer.invalid', 'a russian title is required')
      // PUT is partial: a field left out keeps its stored value.
      Object.assign(row, {
        nomenclature_id: b.nomenclature_id ?? row.nomenclature_id,
        ikpu_codes: b.ikpu_codes ?? row.ikpu_codes,
        goal_target: b.goal_target ?? row.goal_target,
        bonus_amount: b.bonus_amount ?? row.bonus_amount,
        content: b.content ?? row.content,
        starts_at: starts,
        ends_at: ends,
        position: b.position ?? row.position,
        updated_at: new Date(now).toISOString(),
      })
      return json(res, 200, row)
    }
    if (offerId && m === 'DELETE') {
      const i = extraBenefitOffers.findIndex((x) => x.id === Number(offerId[1]))
      if (i < 0) return err(res, 404, 'extra_benefit.admin.not_found', 'offer not found')
      extraBenefitOffers.splice(i, 1)
      res.writeHead(204)
      return res.end()
    }

    const offerStatus = p.match(/^\/internal\/extra-benefit\/offers\/(\d+)\/status$/)
    if (offerStatus && m === 'PATCH') {
      const row = extraBenefitOffers.find((x) => x.id === Number(offerStatus[1]))
      if (!row) return err(res, 404, 'extra_benefit.admin.not_found', 'offer not found')
      const b = await read(req)
      if (b.status !== 100 && b.status !== 200)
        return err(res, 400, 'extra_benefit.offer.invalid_status', 'status must be 100 or 200')
      row.status = b.status
      row.updated_at = new Date(now).toISOString()
      return json(res, 200, row)
    }

    // ---- nomenclature catalog ----

    const nomId = p.match(/^\/internal\/nomenclatures\/(\d+)$/)
    if (nomId && m === 'GET') {
      const drug = catalog.find((d) => d.id === Number(nomId[1]))
      if (!drug) return json(res, 404, { alias: 'nomin.invalid_id', message: 'drug not found', type: 'error' })
      return json(res, 200, drug)
    }
    if (m === 'GET' && p === '/internal/nomenclatures') {
      const q = url.searchParams
      let items = catalog.slice()
      const term = (q.get('query') || '').toLowerCase()
      if (term)
        items = items.filter(
          (d) =>
            d.name.toLowerCase().includes(term) ||
            d.full_name.toLowerCase().includes(term) ||
            (d.maker?.name || '').toLowerCase().includes(term),
        )
      const offset = Number(q.get('offset') || 0)
      const limit = Number(q.get('limit') || 20)
      return json(res, 200, { items: items.slice(offset, offset + limit), count: items.length })
    }

    json(res, 404, { message: 'no route', type: 'error' })
  })
  .listen(PORT, () => console.log('mock on', PORT))
