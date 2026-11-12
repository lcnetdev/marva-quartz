import { describe, it, expect } from 'vitest'

// the lib under lib/workflows reaches the profile store through utils_rdf / utils_parse, which
// only resolve when the store module has been loaded first (an import cycle)
import '@/stores/profile'

import { sortByProfileOrder, inProfileOrder } from '@/lib/workflows/fields'

const available = [
  { rt: 'Work', id: 'a' }, { rt: 'Work', id: 'b' }, { rt: 'Work', id: 'c' },
  { rt: 'Instance', id: 'a' }, { rt: 'Instance', id: 'd' },
]

describe('Putting the fields in the order of the profile', () => {
  it('sorts by where the component comes in the profile, the same id in Work and Instance kept apart', () => {
    let picked = [{ rt: 'Instance', id: 'd' }, { rt: 'Work', id: 'c', hiddenColumns: ['x'] }, { rt: 'Instance', id: 'a' }, { rt: 'Work', id: 'a' }]
    expect(inProfileOrder(picked, available)).toBe(false)
    let sorted = sortByProfileOrder(picked, available)
    expect(sorted.map((c) => { return c.rt + '|' + c.id })).toEqual(['Work|a', 'Work|c', 'Instance|a', 'Instance|d'])
    // the components themselves are carried over (their subfield choices with them), the list given is not changed
    expect(sorted[1]).toBe(picked[1])
    expect(picked[0].id).toBe('d')
    expect(inProfileOrder(sorted, available)).toBe(true)
  })

  it('puts a component the profile does not have last, and an empty or single list is in order', () => {
    let picked = [{ rt: 'Work', id: 'gone' }, { rt: 'Work', id: 'b' }]
    expect(sortByProfileOrder(picked, available).map((c) => { return c.id })).toEqual(['b', 'gone'])
    expect(inProfileOrder([], available)).toBe(true)
    expect(inProfileOrder([{ rt: 'Instance', id: 'd' }], available)).toBe(true)
  })
})
