// Base URL for Bluecore API calls
const bluecoreApiBase = import.meta.env.VITE_BLUECORE_API_PATH.replace(/\/+$/, '')
// UUID matcher used for UUID input
const uuidOnlyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Returns true when input is just a UUID
export function isBluecoreUuidInput(input) {
  if (typeof input !== 'string') return false
  const [rawId] = input.trim().split('?')
  return uuidOnlyPattern.test(rawId)
}

// Normalizes supported Bluecore record inputs into /api/cbd/{UUID}.rdf URLs.
export function resolveBluecoreCbdUrl(input) {
  if (typeof input !== 'string') return input

  const value = input.trim()
  const [rawId, ...suffixParts] = value.split('?')
  const suffix = suffixParts.length ? `?${suffixParts.join('?')}` : ''

  if (isBluecoreUuidInput(rawId)) {
    return `${bluecoreApiBase}/cbd/${rawId}.rdf${suffix}`
  }

  const normalizedRawId = rawId.replace(/\/+$/, '')
  const lastSegment = normalizedRawId.split('/').pop()
  if (/\/api\/cbd\//i.test(normalizedRawId) && isBluecoreUuidInput(lastSegment)) {
    return `${normalizedRawId}.rdf${suffix}`
  }

  if (/\/instances\//i.test(normalizedRawId) && isBluecoreUuidInput(lastSegment)) {
    try {
      const parsedUrl = new URL(normalizedRawId)
      return `${parsedUrl.origin}/api/cbd/${lastSegment}.rdf${suffix}`
    } catch {
      return `${bluecoreApiBase}/cbd/${lastSegment}.rdf${suffix}`
    }
  }

  return value
}
