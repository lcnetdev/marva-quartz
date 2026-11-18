import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
// the profile store has to load before lib/workflows (utils_profile -> stores/profile -> utils_parse share a cycle with utils_rdf)
import '@/stores/profile'
import utilsMisc from '@/lib/utils_misc'
import utilsNetwork from '@/lib/utils_network'
import { cipQuery } from '@/lib/workflows/cip'

const UUID = 'e4b0b11a-538d-5f80-a65d-e95f684c773f'

describe('returnFolioUuid', () => {
  test('a UUID is recognized bare, prefixed, in capitals and with spaces around it', () => {
    expect(utilsMisc.returnFolioUuid(UUID)).toBe(UUID)
    expect(utilsMisc.returnFolioUuid('folio:' + UUID)).toBe(UUID)
    expect(utilsMisc.returnFolioUuid('FOLIO:' + UUID.toUpperCase())).toBe(UUID)
    expect(utilsMisc.returnFolioUuid('  ' + UUID + '\n')).toBe(UUID)
  })

  test('the other identifiers are not taken for one', () => {
    for (let value of ['2023416867', 'n 79021164', '9780000000654', '978-0-00-000065-4', 'in00012345678', '00012345678901', 'e4b0b11a-538d-5f80-a65d', UUID + '0', 'https://id.loc.gov/resources/instances/' + UUID, '', null, undefined]){
      expect(utilsMisc.returnFolioUuid(value)).toBe(null)
    }
  })
})

describe('searchInstanceByLCCN', () => {
  let asked = []
  beforeEach(() => {
    setActivePinia(createPinia())
    asked = []
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      asked.push(String(url))
      return { json: async () => { return { hits: [{ uri: 'http://id.loc.gov/resources/instances/8385123', aLabel: 'A book' }] } } }
    }))
  })
  afterEach(() => { vi.unstubAllGlobals() })

  const query = () => { return new URL(asked[0]).searchParams.get('q') }

  test('a FOLIO UUID is searched with the folio: prefix', async () => {
    let results = await utilsNetwork.searchInstanceByLCCN(UUID)
    expect(query()).toBe('folio:' + UUID)
    expect(new URL(asked[0]).searchParams.get('searchtype')).toBe('keyword')
    expect(results.length).toBe(1)
    expect(results[0].bfdbPackageURL).toContain('resources/instances/8385123')
  })

  test('the prefix is not doubled, and a UUID that starts with two letters is not split like a LCCN', async () => {
    await utilsNetwork.searchInstanceByLCCN('folio:' + UUID)
    expect(query()).toBe('folio:' + UUID)
    asked = []
    await utilsNetwork.searchInstanceByLCCN('AB' + UUID.slice(2))
    expect(query()).toBe('folio:ab' + UUID.slice(2))
  })

  test('a LCCN is searched as before', async () => {
    await utilsNetwork.searchInstanceByLCCN('2023416867')
    expect(query()).toBe('2023416867')
    asked = []
    await utilsNetwork.searchInstanceByLCCN('gm71005810')
    expect(query()).toBe('gm 71005810')
  })
})

describe('cipQuery', () => {
  test('a scanned FOLIO UUID is not sent to WorldCat as the item barcode', () => {
    expect(cipQuery({ scanned: UUID, lccn: '2023416867' })).toBe(null)
    expect(cipQuery({ scanned: 'folio:' + UUID, lccn: '2023416867' })).toBe(null)
    // a barcode and an ISBN still are what the service is asked with
    expect(cipQuery({ scanned: '00012345678901', lccn: '2023416867' })).toEqual({ barcode: '00012345678901' })
    expect(cipQuery({ scanned: '9780000000654', lccn: '2023416867' })).toEqual({ isbn: '9780000000654', lccn: '2023416867' })
  })
})
