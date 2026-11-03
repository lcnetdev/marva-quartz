import { describe, expect, test } from 'vitest'
import utils_export from "@/lib/utils_export";
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const pinia = createPinia()
const app = createApp()
app.use(pinia)

// NacoStubCreateModal stores repeated subfields (e.g. two $c) as one string joined with this delimiter.
const DELIM = '<REPEATED_MARVA_VALUE>'

const subfieldsOf = (xml, tag) => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const field = [...doc.getElementsByTagNameNS('*','datafield')].find(f => f.getAttribute('tag') == tag)
  return [...field.getElementsByTagNameNS('*','subfield')].map(s => [s.getAttribute('code'), s.textContent])
}

describe('createNacoStubXML repeated subfields', () => {
  test('1XX, 4XX and additional fields never contain the delimiter and split into separate subfields', () => {
    const oneXX = { fieldTag: '100', indicators: '1 ', a: 'García Márquez, Gabriel,', c: `Saint${DELIM}Bishop of Rome`, d: '1927-2014' }
    const fourXX = { fieldTag: '400', indicators: '1 ', a: 'Márquez, Gabriel García,', c: `Saint${DELIM}Bishop of Rome` }
    // the hyphenated / compound 4XX is passed as an additional field with indexed [code, value] pairs
    const additional = [{ fieldTag: '400', indicators: '1 ', 0: ['a', 'Márquez, Gabriel García'], 1: ['c', `Saint${DELIM}Bishop of Rome`] }]

    const { xml, text } = utils_export.createNacoStubXML(oneXX, fourXX, 'Some title', '123', 'http://id.loc.gov/resources/instances/123', '2020', 'n123', '', {}, false, additional, false)

    expect(xml).not.toContain(DELIM)
    expect(text).not.toContain(DELIM)

    expect(subfieldsOf(xml, '100')).toEqual([
      ['a', 'García Márquez, Gabriel,'], ['c', 'Saint'], ['c', 'Bishop of Rome'], ['d', '1927-2014'],
    ])

    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const fourHundreds = [...doc.getElementsByTagNameNS('*','datafield')].filter(f => f.getAttribute('tag') == '400')
    expect(fourHundreds.length).toBe(2)
    for (const f of fourHundreds) {
      const cs = [...f.getElementsByTagNameNS('*','subfield')].filter(s => s.getAttribute('code') == 'c').map(s => s.textContent)
      expect(cs).toEqual(['Saint', 'Bishop of Rome'])
    }
  })
})
