const RAW_SLUG = typeof window !== 'undefined' ? window.PLANE_SLUG : null
const SLUG = RAW_SLUG && RAW_SLUG !== '__PLANE_SLUG__'
    ? RAW_SLUG
    : (import.meta.env.VITE_PLANE_SLUG || 'main')
const PROXY_BASE = import.meta.env.VITE_PROXY_BASE || ''

export function apiBase() {
    return `${PROXY_BASE}/plane/api/v1/workspaces/${SLUG}`
}

export function toProxyUrl(absoluteUrl) {
    try {
        const u = new URL(absoluteUrl)
        return PROXY_BASE + '/plane' + u.pathname + u.search
    } catch {
        return absoluteUrl
    }
}

export function assetUrl(path) {
    if (!path) return ''
    if (/^https?:\/\//i.test(path)) return path
    return `${PROXY_BASE}/plane${path.startsWith('/') ? path : `/${path}`}`
}

const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 500
const RATE_LIMIT_MAX_REQUESTS = 115
const RATE_LIMIT_WINDOW_MS = 1000
const RATE_LIMIT_BACKOFF_MS = 5000
const MAX_COOLDOWN_MS = 60 * 1000

const requestLog = []
let cooldownUntil = 0

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function acquireRequestSlot() {
    while (true) {
        const now = Date.now()

        if (now < cooldownUntil) {
            await sleep(cooldownUntil - now)
            continue
        }

        while (requestLog.length && now - requestLog[0] >= RATE_LIMIT_WINDOW_MS) {
            requestLog.shift()
        }

        if (requestLog.length < RATE_LIMIT_MAX_REQUESTS) {
            requestLog.push(now)
            return
        }

        await sleep(RATE_LIMIT_WINDOW_MS - (now - requestLog[0]) + 10)
    }
}

function applyRateLimitCooldown(delayMs) {
    const until = Date.now() + Math.min(delayMs, MAX_COOLDOWN_MS)
    if (until > cooldownUntil) cooldownUntil = until
}

export async function fetchJson(path, attempt = 0) {
    await acquireRequestSlot()

    const res = await fetch(path)

    if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after')) || 0
        const delay = retryAfter ? retryAfter * 1000 : RATE_LIMIT_BACKOFF_MS * 2 ** attempt
        applyRateLimitCooldown(delay)
        if (attempt < MAX_RETRIES) {
            return fetchJson(path, attempt + 1)
        }
        throw new Error(`HTTP 429 (rate limit) em ${path}`)
    }

    if (!res.ok) {
        if (res.status >= 500 && attempt < MAX_RETRIES) {
            await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
            return fetchJson(path, attempt + 1)
        }
        throw new Error(`HTTP ${res.status} em ${path}`)
    }

    return res.json()
}

export async function fetchAll(path) {
    const pageUrl = (cursor) => {
        let url = path + (path.includes('?') ? '&' : '?') + 'per_page=250'
        if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`
        return url
    }

    const results = []
    let url = pageUrl()
    let guard = 0

    while (url && guard < 100) {
        guard += 1
        const data = await fetchJson(url)

        if (Array.isArray(data)) {
            results.push(...data)
            break
        }

        results.push(...(data.results || []))

        if (data.next) {
            url = toProxyUrl(data.next)
        } else if (data.next_page_results && data.next_cursor) {
            url = pageUrl(data.next_cursor)
        } else {
            url = null
        }
    }

    return results
}
