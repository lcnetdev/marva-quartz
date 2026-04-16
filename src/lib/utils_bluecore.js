const bluecoreApiBase = (import.meta.env.VITE_BLUECORE_API_PATH || 'http://localhost:3000').replace(/\/+$/, '')
const uuidOnlyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isBluecoreUuidInput(input) {
  if (typeof input !== 'string') return false
  const [rawId] = input.trim().split('?')
  return uuidOnlyPattern.test(rawId)
}

export function resolveBluecoreCbdUrl(input) {
  if (typeof input !== 'string') return input

  const value = input.trim()
  const [rawId, ...suffixParts] = value.split('?')
  const suffix = suffixParts.length ? `?${suffixParts.join('?')}` : ''

  if (isBluecoreUuidInput(rawId)) {
    return `${bluecoreApiBase}/api/cbd/${rawId}.rdf${suffix}`
  }

  return value
}
