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
