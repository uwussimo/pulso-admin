// Read-only view of the mobile app's PostHog analytics for the Обзор page.
//
// PostHog's query API needs a personal API key, which must never reach the
// browser. So the panel asks this handler, the handler checks the caller is a
// signed-in operator (the same bearer token the operator API accepts), runs a
// fixed set of HogQL queries with the secret, and returns one compact JSON.
// The queries are fixed here on purpose: the browser picks a range, never SQL.
//
// Shared by the Cloudflare Worker (production) and the Vite dev server.

const ACTIVITY = `('$screen', 'Application Opened', 'Application Became Active')`
const RANGES = new Set([7, 30])

export async function handleMetrics(request, env) {
  const url = new URL(request.url)
  const userMatch = /^\/metrics\/user\/(\d{1,12})$/.exec(url.pathname)
  if (request.method !== 'GET' || (url.pathname !== '/metrics/app' && !userMatch)) {
    return json(404, { alias: 'metrics.not_found', message: 'not found' })
  }

  // Only operators may read product analytics: ask the operator API who this is.
  const auth = request.headers.get('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return json(401, { alias: 'auth.unauthorized', message: 'unauthorized' })
  }
  const origin = (env.API_ORIGIN || 'https://api.pulso.dorim.com').replace(/\/$/, '')
  const who = await fetch(`${origin}/internal/auth`, { headers: { authorization: auth } })
  if (who.status === 401 || who.status === 403) {
    return json(who.status, { alias: 'auth.unauthorized', message: 'unauthorized' })
  }
  if (!who.ok) return json(502, { alias: 'metrics.auth_unavailable', message: 'auth check failed' })

  if (!env.POSTHOG_API_KEY || !env.POSTHOG_PROJECT_ID) {
    return json(503, { alias: 'metrics.not_configured', message: 'PostHog is not configured' })
  }

  const range = RANGES.has(Number(url.searchParams.get('range'))) ? Number(url.searchParams.get('range')) : 7
  const ph = {
    host: (env.POSTHOG_HOST || 'https://us.posthog.com').replace(/\/$/, ''),
    project: env.POSTHOG_PROJECT_ID,
    key: env.POSTHOG_API_KEY,
  }

  try {
    if (userMatch) return json(200, await userView(ph, userMatch[1]), { 'cache-control': 'private, max-age=60' })

    const [active, people, totals, screens, daily, versions, platforms] = await Promise.all([
      hogql(
        ph,
        `SELECT
           uniqIf(person_id, timestamp >= now() - INTERVAL 1 DAY),
           uniqIf(person_id, timestamp >= now() - INTERVAL 7 DAY),
           uniq(person_id)
         FROM events
         WHERE event IN ${ACTIVITY} AND timestamp >= now() - INTERVAL 30 DAY`,
      ),
      hogql(
        ph,
        `SELECT
           countIf(created_at >= now() - INTERVAL ${range} DAY),
           count(),
           countIf(is_identified = 1),
           countIf(toString(properties.is_verified) = 'true')
         FROM persons`,
      ),
      hogql(
        ph,
        `SELECT
           countIf(event = 'Application Opened'),
           countIf(event = 'Application Installed'),
           countIf(event = '$screen'),
           countIf(event = '$exception'),
           uniqIf(person_id, event = '$exception')
         FROM events
         WHERE timestamp >= now() - INTERVAL ${range} DAY`,
      ),
      hogql(
        ph,
        `SELECT properties.$screen_name AS name, count() AS views, uniq(person_id) AS people
         FROM events
         WHERE event = '$screen' AND timestamp >= now() - INTERVAL ${range} DAY AND properties.$screen_name IS NOT NULL
         GROUP BY name ORDER BY views DESC LIMIT 6`,
      ),
      hogql(
        ph,
        `SELECT toDate(timestamp) AS day, uniq(person_id) AS people
         FROM events
         WHERE event IN ${ACTIVITY} AND timestamp >= toStartOfDay(now() - INTERVAL 13 DAY)
         GROUP BY day ORDER BY day`,
      ),
      hogql(
        ph,
        `SELECT properties.$app_version AS version, uniq(person_id) AS people
         FROM events
         WHERE event IN ${ACTIVITY} AND timestamp >= now() - INTERVAL ${range} DAY AND properties.$app_version IS NOT NULL
         GROUP BY version ORDER BY people DESC LIMIT 5`,
      ),
      hogql(
        ph,
        `SELECT properties.$os_name AS os, uniq(person_id) AS people
         FROM events
         WHERE event IN ${ACTIVITY} AND timestamp >= now() - INTERVAL ${range} DAY AND properties.$os_name IS NOT NULL
         GROUP BY os ORDER BY people DESC LIMIT 4`,
      ),
    ])

    const body = {
      range_days: range,
      generated_at: new Date().toISOString(),
      active: { day: num(active[0]?.[0]), week: num(active[0]?.[1]), month: num(active[0]?.[2]) },
      people: {
        new_in_range: num(people[0]?.[0]),
        total: num(people[0]?.[1]),
        identified: num(people[0]?.[2]),
        // The app sets person.is_verified on identify once MyID KYC passes.
        verified: num(people[0]?.[3]),
      },
      in_range: {
        opens: num(totals[0]?.[0]),
        installs: num(totals[0]?.[1]),
        screen_views: num(totals[0]?.[2]),
        errors: num(totals[0]?.[3]),
        people_with_errors: num(totals[0]?.[4]),
      },
      top_screens: screens.map((r) => ({ name: String(r[0]), views: num(r[1]), people: num(r[2]) })),
      daily_active: daily.map((r) => ({ day: String(r[0]).slice(0, 10), people: num(r[1]) })),
      versions: versions.map((r) => ({ version: String(r[0]), people: num(r[1]) })),
      platforms: platforms.map((r) => ({ os: String(r[0]), people: num(r[1]) })),
    }
    return json(200, body, { 'cache-control': 'private, max-age=60' })
  } catch (e) {
    if (e instanceof UpstreamError) {
      const alias = e.status === 401 || e.status === 403 ? 'metrics.upstream_auth' : 'metrics.upstream'
      return json(502, { alias, message: e.message })
    }
    return json(502, { alias: 'metrics.upstream', message: String(e && e.message ? e.message : e) })
  }
}

/**
 * Everything PostHog knows about one app user. The app identifies people by
 * their profile id (posthog.identify(String(profileId))), so the admin user id
 * is the distinct_id. Only digits reach the query, so it is safe to inline.
 */
async function userView(ph, id) {
  // Match on the person, not the raw distinct_id: events sent before the app
  // identified the user carry the device's anonymous id, and PostHog merges
  // both ids into one person on identify.
  const personOf = `(SELECT person_id FROM person_distinct_ids WHERE distinct_id = '${id}')`
  const where = `person_id IN ${personOf}`
  const replayWhere = `distinct_id IN (SELECT distinct_id FROM person_distinct_ids WHERE person_id IN ${personOf})`
  const [summary, recent, screens, daily, replays] = await Promise.all([
    hogql(
      ph,
      `SELECT
         count(),
         min(timestamp),
         max(timestamp),
         countIf(event = 'Application Opened'),
         countIf(event = '$screen'),
         countIf(event = '$exception'),
         argMax(properties.$app_version, timestamp),
         argMax(properties.$os_name, timestamp),
         argMax(properties.$os_version, timestamp),
         argMax(properties.$device_type, timestamp),
         argMax(properties.$device_name, timestamp),
         argMax(properties.$locale, timestamp),
         argMax(person.properties, timestamp)
       FROM events WHERE ${where}`,
    ),
    hogql(
      ph,
      `SELECT timestamp, event, properties.$screen_name, properties.$exception_types, properties.$exception_values
       FROM events
       WHERE ${where} AND event IN ('$screen', 'Application Opened', 'Application Installed', 'Application Updated', '$exception', '$identify')
       ORDER BY timestamp DESC LIMIT 25`,
    ),
    hogql(
      ph,
      `SELECT properties.$screen_name AS name, count() AS views
       FROM events WHERE ${where} AND event = '$screen' AND properties.$screen_name IS NOT NULL
       GROUP BY name ORDER BY views DESC LIMIT 6`,
    ),
    hogql(
      ph,
      `SELECT toDate(timestamp) AS day, count() AS events
       FROM events WHERE ${where} AND timestamp >= toStartOfDay(now() - INTERVAL 13 DAY)
       GROUP BY day ORDER BY day`,
    ),
    hogql(ph, `SELECT count(DISTINCT session_id) FROM session_replay_events WHERE ${replayWhere}`).catch(() => [[0]]),
  ])

  const s = summary[0] ?? []
  let personProps = {}
  try {
    personProps = typeof s[12] === 'string' ? JSON.parse(s[12]) : s[12] || {}
  } catch {
    personProps = {}
  }
  const total = num(s[0])
  return {
    distinct_id: id,
    seen: total > 0,
    events_total: total,
    first_seen: total > 0 ? String(s[1]) : null,
    last_seen: total > 0 ? String(s[2]) : null,
    opens: num(s[3]),
    screen_views: num(s[4]),
    errors: num(s[5]),
    replays: num(replays[0]?.[0]),
    device: {
      app_version: str(s[6]),
      os: str(s[7]),
      os_version: str(s[8]),
      device_type: str(s[9]),
      device_name: str(s[10]),
      locale: str(s[11]),
    },
    person: {
      name: str(personProps.name),
      is_verified: personProps.is_verified === true || personProps.is_verified === 'true',
      first_seen_platform: str(personProps.first_seen_platform),
    },
    recent: recent.map((r) => ({
      at: String(r[0]),
      event: String(r[1]),
      screen: str(r[2]),
      error: str(Array.isArray(r[3]) ? r[3][0] : r[3]) || str(Array.isArray(r[4]) ? r[4][0] : r[4]),
    })),
    top_screens: screens.map((r) => ({ name: String(r[0]), views: num(r[1]) })),
    daily: daily.map((r) => ({ day: String(r[0]).slice(0, 10), events: num(r[1]) })),
    posthog_url: `${ph.host}/project/${ph.project}/person/${encodeURIComponent(id)}`,
  }
}

function str(v) {
  return v === null || v === undefined || v === '' ? null : String(v)
}

class UpstreamError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function hogql(ph, query) {
  const res = await fetch(`${ph.host}/api/projects/${ph.project}/query/`, {
    method: 'POST',
    headers: { authorization: `Bearer ${ph.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  })
  if (!res.ok) {
    let detail = ''
    try {
      const b = await res.json()
      detail = b.detail || b.error || JSON.stringify(b).slice(0, 200)
    } catch {
      detail = await res.text().catch(() => '')
    }
    throw new UpstreamError(res.status, `PostHog ${res.status}: ${detail}`)
  }
  const data = await res.json()
  return Array.isArray(data.results) ? data.results : []
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  })
}
