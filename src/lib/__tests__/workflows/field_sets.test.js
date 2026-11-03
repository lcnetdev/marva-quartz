import { describe, expect, test } from 'vitest'
import { selectionOf, selectionKey, sameSelection, resolveSelection, readFieldSets, newFieldSet, upsertFieldSet } from '@/lib/workflows/fieldSets'

const AVAILABLE = [
  { rt: 'Instance', id: 'adminmetadata', propertyURI: 'a', label: 'Admin Metadata' },
  { rt: 'Instance', id: 'identifiers', propertyURI: 'b', label: 'Identifiers' },
  { rt: 'Work', id: 'subjects', propertyURI: 'c', label: 'Subjects' },
  { rt: 'Work', id: 'classification', propertyURI: 'd', label: 'Classification numbers' },
]

function session(components, hidden = []){
  return { definition: { profileId: 'p', components: components }, hiddenComponents: hidden }
}

describe('field sets: the selection of a sheet', () => {
  test('selectionOf takes the order, the subfields turned off and the unchecked components', () => {
    let s = session([
      { rt: 'Work', id: 'subjects', propertyURI: 'c', label: 'Subjects', hiddenColumns: ['x'] },
      { rt: 'Instance', id: 'identifiers', propertyURI: 'b', label: 'Identifiers' },
    ], ['Instance|identifiers'])
    expect(selectionOf(s)).toEqual({
      components: [{ rt: 'Work', id: 'subjects', hiddenColumns: ['x'] }, { rt: 'Instance', id: 'identifiers', hiddenColumns: [] }],
      hidden: ['Instance|identifiers'],
    })
  })

  test('sameSelection: the order of the components matters, the order of hidden things does not', () => {
    let a = { components: [{ rt: 'Work', id: 'subjects', hiddenColumns: ['x', 'y'] }, { rt: 'Instance', id: 'identifiers', hiddenColumns: [] }], hidden: ['Instance|identifiers', 'Work|subjects'] }
    let b = { components: [{ rt: 'Work', id: 'subjects', hiddenColumns: ['y', 'x'] }, { rt: 'Instance', id: 'identifiers' }], hidden: ['Work|subjects', 'Instance|identifiers'] }
    let c = { components: [{ rt: 'Instance', id: 'identifiers', hiddenColumns: [] }, { rt: 'Work', id: 'subjects', hiddenColumns: ['x', 'y'] }], hidden: ['Instance|identifiers', 'Work|subjects'] }
    expect(sameSelection(a, b)).toBe(true)
    expect(sameSelection(a, c)).toBe(false)
    expect(sameSelection(a, null)).toBe(false)
    expect(selectionKey(null)).toBe('')
  })

  test('resolveSelection matches the profile and leaves out what it does not have', () => {
    let selection = {
      components: [
        { rt: 'Work', id: 'classification', hiddenColumns: ['k'] },
        { rt: 'Work', id: 'gone', hiddenColumns: [] },
        { rt: 'Instance', id: 'adminmetadata' },
      ],
      hidden: ['Work|gone', 'Instance|adminmetadata'],
    }
    let resolved = resolveSelection(selection, AVAILABLE)
    expect(resolved.components.map((c) => { return c.id })).toEqual(['classification', 'adminmetadata'])
    expect(resolved.components[0].label).toBe('Classification numbers')
    expect(resolved.components[0].hiddenColumns).toEqual(['k'])
    expect(resolved.components[1].hiddenColumns).toEqual([])
    expect(resolved.hidden).toEqual(['Instance|adminmetadata'])
    // nothing matched: nothing to apply
    expect(resolveSelection({ components: [{ rt: 'Work', id: 'gone' }], hidden: [] }, AVAILABLE)).toBeNull()
    expect(resolveSelection(null, AVAILABLE)).toBeNull()
  })

  test('readFieldSets fills in the shape whatever the preference holds', () => {
    expect(readFieldSets(undefined)).toEqual({ sets: [], current: {} })
    expect(readFieldSets('')).toEqual({ sets: [], current: {} })
    expect(readFieldSets({ sets: [{ id: 'fs-1', name: 'A' }, { name: 'no id' }, null], current: { w: { components: [] } } }))
      .toEqual({ sets: [{ id: 'fs-1', name: 'A' }], current: { w: { components: [] } } })
  })

  test('upsertFieldSet replaces a set of the same name for the same profile, keeping its id', () => {
    let first = newFieldSet('CIP', 'p', { components: [{ rt: 'Work', id: 'subjects', hiddenColumns: [] }], hidden: [] })
    let sets = upsertFieldSet([], first)
    expect(sets.length).toBe(1)
    let again = newFieldSet('cip ', 'p', { components: [{ rt: 'Instance', id: 'identifiers', hiddenColumns: [] }], hidden: [] })
    sets = upsertFieldSet(sets, again)
    expect(sets.length).toBe(1)
    expect(sets[0].id).toBe(first.id)
    expect(sets[0].components[0].id).toBe('identifiers')
    // the same name for another profile is another set
    sets = upsertFieldSet(sets, newFieldSet('CIP', 'q', { components: [], hidden: [] }))
    expect(sets.length).toBe(2)
  })
})
