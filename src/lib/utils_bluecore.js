// Base URL for Bluecore API calls
const bluecoreApiBase = import.meta.env.VITE_BLUECORE_API_PATH.replace(/\/+$/, '')
// UUID matcher used for UUID input
const uuidOnlyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i


// Splits an input URL string into [path, querySuffix]
function splitPathAndQuery(input) {
  const value = input.trim()
  const queryIndex = value.indexOf('?')
  return queryIndex === -1 ? [value, ''] : [value.slice(0, queryIndex), value.slice(queryIndex)]
}

// Return true when input is just a UUID
export function isBluecoreUuidInput(input) {
  if (typeof input !== 'string') return false
  const [path] = splitPathAndQuery(input)
  return uuidOnlyPattern.test(path)
}

// Return True when URL path is /instances/{UUID}
export function isBluecoreInstancePath(input) {
  if (typeof input !== 'string') return false
  const [path] = splitPathAndQuery(input)
  const normalizedPath = path.replace(/\/+$/, '')
  const lastSegment = normalizedPath.split('/').pop()
  return /\/instances\//i.test(normalizedPath) && uuidOnlyPattern.test(lastSegment)
}

// Normalizes UUID-only input to native /instances/{UUID}
export function resolveBluecoreCbdUrl(input) {
  if (typeof input !== 'string') return input
  const [path, query] = splitPathAndQuery(input)
  return uuidOnlyPattern.test(path) ? `${bluecoreApiBase}/instances/${path}${query}` : `${path}${query}`
}

// Extracts a `resource` target to auto-load from a route query object or a raw
// query string, e.g. a Bluecore redirect like
// /marva/?resource=http://localhost:3000/instances/{UUID}.
// Returns the resolved CBD URL ready to load, or null when no resource is present.
function returnBluecoreAutoLoadResource(query) {
  let resource = null
  if (query && typeof query === 'object') {
    resource = query.resource || null
  } else if (typeof query === 'string') {
    const params = new URLSearchParams(query.startsWith('?') ? query : `?${query}`)
    resource = params.get('resource')
  }
  if (!resource || typeof resource !== 'string') return null
  // Accepts a full instance URL or a bare UUID; resolveBluecoreCbdUrl normalizes both.
  return resolveBluecoreCbdUrl(resource.trim())
}

// Auto-loads an instance passed via `?resource=` (e.g. a Bluecore redirect)
export function startBluecoreResourceAutoLoad(loadViewModel, intervalMs = 600) {
  const interval = setInterval(() => {
    const resourceUrl = returnBluecoreAutoLoadResource(loadViewModel.$route && loadViewModel.$route.query)
    if (!resourceUrl) {
      clearInterval(interval)
      return
    }
    // wait until profiles are ready and a default profile is known, then load
    if (loadViewModel.defaultProfile && loadViewModel.startingPointsFiltered && loadViewModel.startingPointsFiltered.length > 0) {
      loadViewModel.urlToLoad = resourceUrl
      loadViewModel.urlToLoadIsHttp = true
      loadViewModel.loadUrl(loadViewModel.defaultProfile)
      clearInterval(interval)
    }
  }, intervalMs)
  return interval
}

// Merges request options while combining headers
export function addBluecoreHeaders(baseOptions = {}, overrideOptions = {}) {
  return { ...baseOptions, ...overrideOptions, headers: { ...(baseOptions.headers || {}), ...(overrideOptions.headers || {}) }}
}

// Applies Bluecore URL normalization
export function applyBluecoreLookupRequest(url, options = {}) {
  const resolvedUrl = resolveBluecoreCbdUrl(url)
  const isInstancePath = isBluecoreInstancePath(resolvedUrl)
  const requestOptions = isInstancePath ? addBluecoreHeaders(options, { headers: { Accept: 'application/cbd+xml, application/json, */*;q=0.8' } }) : options

  return { url: resolvedUrl, options: requestOptions, cbd: isInstancePath }
}
