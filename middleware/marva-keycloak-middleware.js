/* eslint-disable no-console */
const http = require('http')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// #############################################################################
// ##  Runtime Configuration  ##
// #############################
const env = process.env
const PORT = Number(env.MARVA_MW_PORT)
const BASE_PATH =  '/marva/util'
const MARVA_REDIRECT = ( env.MARVA_REDIRECT_BASE || "http://localhost/marva/" )

const KEYCLOAK_ISSUER_EXTERNAL = `${env.KEYCLOAK_EXTERNAL_URL }/realms/bluecore`
const KEYCLOAK_ISSUER_INTERNAL = `${env.KEYCLOAK_INTERNAL_URL}/realms/bluecore`
const KEYCLOAK_REDIRECT_URI = ( env.BLUECORE_STACK_KEYCLOAK_REDIRECT_URI || `http://localhost:${PORT}${BASE_PATH}/auth/callback`)

const UPSTREAM_UTIL_BASE = `${env.MARVA_UTIL_PATH}/marva/util`
const CORS_ORIGIN = env.CORS_ORIGIN || '*'

// #############################################################################
// ##  In-Memory Session State  ##
// ###############################
const tokenStore = new Map()
const subjectIndex = new Map()
const pendingStates = new Map()

const KEYCLOAK_ENDPOINTS = {
  authorization: `${KEYCLOAK_ISSUER_EXTERNAL}/protocol/openid-connect/auth`,
  token: `${KEYCLOAK_ISSUER_INTERNAL}/protocol/openid-connect/token`,
  logout: `${KEYCLOAK_ISSUER_EXTERNAL}/protocol/openid-connect/logout`
}

// #############################################################################
// ##  HTTP Request Router  ##
// ###########################
const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      return writeJson(res, 400, { error: 'Missing URL' })
    }

    if (req.method === 'OPTIONS') {
      writeCorsHeaders(res)
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const pathname = url.pathname

    if (!pathname.startsWith(BASE_PATH)) {
      return writeJson(res, 404, { error: 'Not found' })
    }
    if (pathname === `${BASE_PATH}/auth/login`) {
      return handleLogin(req, res, url)
    }
    if (pathname === `${BASE_PATH}/auth/callback`) {
      return handleCallback(req, res, url)
    }
    if (pathname === `${BASE_PATH}/auth/refresh`) {
      return handleRefresh(req, res)
    }
    if (pathname === `${BASE_PATH}/auth/logout`) {
      return handleLogout(req, res)
    }
    return proxyToUpstream(req, res, url)
  } catch (error) {
    logEvent('error', 'unhandled-request-error', { error: String(error?.message || error) })
    return writeJson(res, 500, { error: 'Unhandled middleware error' })
  }
})

const KEYCLOAK_HOST_HEADER = new URL(env.KEYCLOAK_EXTERNAL_URL).host
const KEYCLOAK_FORWARD_PROTO = new URL(env.KEYCLOAK_EXTERNAL_URL).protocol.replace(':', '')
const MIDDLEWARE_LOG_FILE = "/app/logs/marva-keycloak-middleware.log"
// #############################################################################
// ##  Server Startup  ##
// ######################
server.listen(PORT, () => {
  logEvent('info', 'middleware-started', {
    port: PORT,
    basePath: BASE_PATH,
    logFile: MIDDLEWARE_LOG_FILE,
    tokenHostHeader: KEYCLOAK_HOST_HEADER || null
  })
})

setInterval(cleanupStores, 60_000).unref()

// #############################################################################
// ##  Auth Login Handler  ##
// ##########################
async function handleLogin(_req, res, url) {
  const state = randomString(24)
  const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo') || MARVA_REDIRECT )
  pendingStates.set(state, { returnTo, createdAt: Date.now() })
  logEvent('info', 'login-redirect', { returnTo })

  const authUrl = new URL(KEYCLOAK_ENDPOINTS.authorization)
  authUrl.searchParams.set('client_id', 'bluecore_api')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid profile email')
  authUrl.searchParams.set('redirect_uri', KEYCLOAK_REDIRECT_URI)
  authUrl.searchParams.set('state', state)

  writeCorsHeaders(res)
  res.writeHead(302, { Location: authUrl.toString() })
  res.end()
}

// #############################################################################
// ##  Auth Callback Handler  ##
// #############################
async function handleCallback(_req, res, url) {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  const stateData = state ? pendingStates.get(state) : null
  if (state) pendingStates.delete(state)

  const returnTo = sanitizeReturnTo(stateData?.returnTo || MARVA_REDIRECT )

  if (oauthError) {
    logEvent('warn', 'callback-oauth-error', { oauthError })
    const errUrl = new URL(returnTo)
    errUrl.searchParams.set('auth_error', oauthError)
    writeCorsHeaders(res)
    res.writeHead(302, { Location: errUrl.toString() })
    res.end()
    return
  }

  if (!code || !stateData) {
    logEvent('warn', 'callback-invalid-state-or-code')
    return writeJson(res, 400, { error: 'Invalid OAuth callback state/code' })
  }

  let tokenResponse
  try {
    tokenResponse = await exchangeToken({
      grantType: 'authorization_code',
      code
    })
  } catch (error) {
    logEvent('error', 'token-exchange-network-error', {
      issuer: KEYCLOAK_ISSUER_INTERNAL,
      error: String(error?.message || error)
    })
    return writeJson(res, 502, {
      error: 'Token exchange network error',
      issuer: KEYCLOAK_ISSUER_INTERNAL
    })
  }

  if (!tokenResponse.ok) {
    const errTxt = await tokenResponse.text()
    logEvent('error', 'token-exchange-failed', { status: tokenResponse.status, detail: errTxt })
    return writeJson(res, 502, { error: 'Token exchange failed', detail: errTxt })
  }

  const payload = await tokenResponse.json()
  const accessToken = payload.access_token
  const refreshToken = payload.refresh_token
  const idToken = payload.id_token
  if (!accessToken || !refreshToken) {
    return writeJson(res, 502, { error: 'Keycloak token response missing access/refresh token' })
  }

  const claims = decodeJwtPayload(accessToken)
  const subject = claims?.sub || claims?.preferred_username || claims?.email || randomString(12)
  const expiresAt = claims?.exp ? claims.exp * 1000 : Date.now() + 50 * 60 * 1000

  tokenStore.set(accessToken, { refreshToken, idToken, subject, expiresAt })
  subjectIndex.set(subject, accessToken)

  const redirectUrl = new URL(returnTo)
  redirectUrl.searchParams.set('token', accessToken)
  logEvent('info', 'callback-success', {
    subject: subject || null,
    returnTo
  })

  writeCorsHeaders(res)
  res.writeHead(302, { Location: redirectUrl.toString() })
  res.end()
}

// #############################################################################
// ##  Auth Refresh Handler  ##
// ############################
async function handleRefresh(req, res) {
  const oldToken = getBearerToken(req)
  if (!oldToken) {
    logEvent('warn', 'refresh-missing-bearer')
    return writeJson(res, 401, { error: 'Missing bearer token' })
  }

  let session = tokenStore.get(oldToken)
  if (!session) {
    const claims = decodeJwtPayload(oldToken)
    const subject = claims?.sub || claims?.preferred_username || claims?.email
    if (subject && subjectIndex.has(subject)) {
      session = tokenStore.get(subjectIndex.get(subject))
    }
  }

  if (!session?.refreshToken) {
    logEvent('warn', '❌  refresh-session-not-found')
    return writeJson(res, 401, { error: 'Refresh session not found; login required' })
  }

  let refreshResponse
  try {
    refreshResponse = await exchangeToken({
      grantType: 'refresh_token',
      refreshToken: session.refreshToken
    })
  } catch (error) {
    logEvent('warn', 'refresh-network-error', {
      issuer: KEYCLOAK_ISSUER_INTERNAL,
      error: String(error?.message || error)
    })
    return writeJson(res, 401, {
      error: 'Refresh network error',
      issuer: KEYCLOAK_ISSUER_INTERNAL
    })
  }

  if (!refreshResponse.ok) {
    const errTxt = await refreshResponse.text()
    const currentClaims = decodeJwtPayload(oldToken) || {}
    logEvent('warn', 'refresh-failed', {
      status: refreshResponse.status,
      detail: errTxt,
      tokenIssuer: currentClaims.iss || null,
      refreshIssuerEndpoint: KEYCLOAK_ISSUER_INTERNAL
    })
    return writeJson(res, 401, { error: 'Refresh failed', detail: errTxt })
  }

  const payload = await refreshResponse.json()
  const newAccessToken = payload.access_token
  const newRefreshToken = payload.refresh_token || session.refreshToken
  const newIdToken = payload.id_token || session.idToken

  if (!newAccessToken) {
    return writeJson(res, 502, { error: 'Refresh response missing access token' })
  }

  const claims = decodeJwtPayload(newAccessToken)
  const subject = claims?.sub || session.subject
  const expiresAt = claims?.exp ? claims.exp * 1000 : Date.now() + 50 * 60 * 1000

  tokenStore.delete(oldToken)
  tokenStore.set(newAccessToken, {
    refreshToken: newRefreshToken,
    idToken: newIdToken,
    subject,
    expiresAt
  })
  subjectIndex.set(subject, newAccessToken)
  logEvent('info', '✅  refresh-success', { subject: subject || null })

  return writeJson(res, 200, { token: newAccessToken })
}

// #############################################################################
// ##  Auth Logout Handler  ##
// ###########################
async function handleLogout(req, res) {
  const token = getBearerToken(req)
  const session = token ? tokenStore.get(token) : null

  if (token) tokenStore.delete(token)
  if (session?.subject) subjectIndex.delete(session.subject)
  logEvent('info', 'logout-redirect', { hasSession: Boolean(session) })

  const logoutUrl = new URL(KEYCLOAK_ENDPOINTS.logout)
  logoutUrl.searchParams.set('client_id', 'bluecore_api')
  logoutUrl.searchParams.set('post_logout_redirect_uri', MARVA_REDIRECT)
  if (session?.idToken) {
    logoutUrl.searchParams.set('id_token_hint', session.idToken)
  }

  writeCorsHeaders(res)
  res.writeHead(302, { Location: logoutUrl.toString() })
  res.end()
}

// #############################################################################
// ##  Upstream Proxy Handler  ##
// ##############################
async function proxyToUpstream(req, res, url) {
  const pathFromBase = url.pathname.slice(BASE_PATH.length)
  if (!env.MARVA_UTIL_PATH) {
    logEvent('warn', `⚠️  ${pathFromBase} ENDPOINT DISABLED`, {target: proxyToUpstream, warning: String("MARVA_UTIL_PATH no set. Add path to enable additional Marva features")})
    return writeJson(res, 404, { warning: `⚠️  ${pathFromBase} ENDPOINT DISABLED. MARVA_UTIL_PATH no set. Add path to enable additional Marva features` })
  }

  const proxyTarget = `${UPSTREAM_UTIL_BASE}${pathFromBase}${url.search}`
  const headers = { ...req.headers }
  delete headers.host
  delete headers['content-length']

  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readRequestBody(req)

  let response
  try {
    response = await fetch(proxyTarget, {
      method: req.method,
      headers,
      body,
      redirect: 'manual'
    })
  } catch (error) {
    logEvent('error', 'upstream-proxy-error', {
      target: proxyTarget,
      error: String(error?.message || error)
    })
    return writeJson(res, 502, {
      error: 'Upstream util request failed',
      target: proxyTarget
    })
  }

  writeCorsHeaders(res)
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-length') return
    if (key.toLowerCase() === 'content-encoding') return
    if (key.toLowerCase() === 'transfer-encoding') return
    res.setHeader(key, value)
  })

  const responseBuffer = Buffer.from(await response.arrayBuffer())
  logEvent('info', 'upstream-proxy-response', {
    method: req.method,
    path: pathFromBase || '/',
    status: response.status
  })
  res.end(responseBuffer)
}

// #############################################################################
// ##  Keycloak Token Exchange  ##
// ###############################
async function exchangeToken({ grantType, code, refreshToken }) {
  const body = new URLSearchParams()
  body.set('grant_type', grantType)
  body.set('client_id', 'bluecore_api')
  body.set('redirect_uri', KEYCLOAK_REDIRECT_URI)

  if (grantType === 'authorization_code') {
    body.set('code', code || '')
  } else if (grantType === 'refresh_token') {
    body.set('refresh_token', refreshToken || '')
  }

  const headers = {
    'content-type': 'application/x-www-form-urlencoded'
  }
  if (KEYCLOAK_HOST_HEADER) {
    headers.host = KEYCLOAK_HOST_HEADER
    headers['x-forwarded-host'] = KEYCLOAK_HOST_HEADER
    headers['x-forwarded-proto'] = KEYCLOAK_FORWARD_PROTO
  }

  return fetch(KEYCLOAK_ENDPOINTS.token, {
    method: 'POST',
    headers,
    body: body.toString()
  })
}

// #############################################################################
// ##  Response Helpers  ##
// ########################
function writeJson(res, statusCode, payload) {
  writeCorsHeaders(res)
  const data = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  })
  res.end(data)
}

function writeCorsHeaders(res) {
  res.setHeader('access-control-allow-origin', CORS_ORIGIN)
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('access-control-allow-headers', 'Content-Type, Authorization, Accept')
}

// #############################################################################
// ##  Request/Token Helpers  ##
// #############################
function getBearerToken(req) {
  const header = req.headers.authorization || ''
  if (!header.toLowerCase().startsWith('bearer ')) return null
  return header.slice(7).trim()
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

// #############################################################################
// ##  General Utilities  ##
// #########################
function randomString(size) {
  return crypto.randomBytes(size).toString('hex')
}

function sanitizeReturnTo(returnTo) {
  try {
    const parsed = new URL(returnTo)
    return parsed.toString()
  } catch {
    return MARVA_REDIRECT
  }
}

function cleanupStores() {
  const now = Date.now()
  for (const [state, data] of pendingStates) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      pendingStates.delete(state)
    }
  }
  for (const [accessToken, session] of tokenStore) {
    if (session.expiresAt && now > session.expiresAt + 24 * 60 * 60 * 1000) {
      tokenStore.delete(accessToken)
      if (session.subject && subjectIndex.get(session.subject) === accessToken) {
        subjectIndex.delete(session.subject)
      }
    }
  }
}

// #############################################################################
// ##  Middleware Logging  ##
// ##########################
function logEvent(level, event, meta = {}) {
  const payload = { ts: new Date().toISOString(), level, event, ...meta}
  const line = `[marva-keycloak-middleware] ${JSON.stringify(payload)}`

  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }

  if (!MIDDLEWARE_LOG_FILE) return
  try {
    const dir = path.dirname(MIDDLEWARE_LOG_FILE)
    fs.mkdirSync(dir, { recursive: true })
    pruneLogFile()
    fs.appendFileSync(MIDDLEWARE_LOG_FILE, line + '\n', 'utf8')
  } catch (e) {
    console.error('[marva-keycloak-middleware] failed to write log file:', e?.message || e)
  }
}

// #############################################################################
// ##  Log Pruning  ##
// ###################
const LOG_RETENTION = 7 * 24 * 60 * 60 * 1000 // Keep only the last 7 days of log entries.
const LOG_PRUNE_INTERVAL = 60 * 60 * 1000 // Run log pruning once per hour.
let lastLogPruneAt = 0

function pruneLogFile() {
  const now = Date.now()
  if ((now - lastLogPruneAt) < LOG_PRUNE_INTERVAL) return
  lastLogPruneAt = now
  if (!fs.existsSync(MIDDLEWARE_LOG_FILE)) return
  const cutoff = now - LOG_RETENTION
  const content = fs.readFileSync(MIDDLEWARE_LOG_FILE, 'utf8')
  if (!content) return
  const keptLines = content.split('\n').filter((line) => !line || getLogLineTimestampMs(line) >= cutoff)
  fs.writeFileSync(MIDDLEWARE_LOG_FILE, keptLines.join('\n'), 'utf8')
}

function getLogLineTimestampMs(line) {
  const jsonStart = line.indexOf('{')
  if (jsonStart < 0) return Date.now()
  try {
    const payload = JSON.parse(line.slice(jsonStart))
    const tsMs = Date.parse(payload.ts)
    return Number.isFinite(tsMs) ? tsMs : Date.now()
  } catch {
    return Date.now()
  }
}
