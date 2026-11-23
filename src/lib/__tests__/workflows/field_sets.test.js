import { describe, expect, test } from 'vitest'
import { selectionOf, selectionKey, sameSelection, resolveSelection, readFieldSets, newFieldSet, upsertFieldSet, placeComponents } from '@/lib/workflows/fieldSets'
import builtinWorkflows, { STANDARD_PLACEMENTS } from '@/lib/workflows/builtin'

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
    expect(readFieldSets(undefined)).toEqual({ sets: [], current: {}, standard: {} })
    expect(readFieldSets('')).toEqual({ sets: [], current: {}, standard: {} })
    expect(readFieldSets({ sets: [{ id: 'fs-1', name: 'A' }, { name: 'no id' }, null], current: { w: { components: [] } } }))
      .toEqual({ sets: [{ id: 'fs-1', name: 'A' }], current: { w: { components: [] } }, standard: {} })
    // which standard placements a workflow's remembered fields have had is kept
    expect(readFieldSets({ standard: { w: 1 } }).standard).toEqual({ w: 1 })
    expect(readFieldSets({ standard: ['not this'] }).standard).toEqual({})
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

describe('a built-in workflow\'s standard fields are given their place', () => {
  const PLACE = [{ rt: 'Work', id: 'subjects', after: { rt: 'Instance', id: 'identifiers' } }]
  const keys = (list) => { return list.map((c) => { return c.rt + '|' + c.id }) }
  const pick = (...ids) => { return ids.map((id) => { return AVAILABLE.filter((a) => { return a.id === id })[0] }) }

  test('a field missing from the list is put in after the field it follows', () => {
    let placed = placeComponents(pick('adminmetadata', 'identifiers', 'classification'), PLACE, AVAILABLE, false)
    expect(keys(placed)).toEqual(['Instance|adminmetadata', 'Instance|identifiers', 'Work|subjects', 'Work|classification'])
    // taken from the profile, with no subfields turned off
    expect(placed[2]).toEqual({ rt: 'Work', id: 'subjects', propertyURI: 'c', label: 'Subjects', hiddenColumns: [] })
  })

  test('one on the end of the list is moved there only when asked to', () => {
    let list = pick('adminmetadata', 'identifiers', 'classification', 'subjects')
    list[3] = Object.assign({}, list[3], { hiddenColumns: ['x'] })
    expect(placeComponents(list, PLACE, AVAILABLE, false)).toBeNull()
    let moved = placeComponents(list, PLACE, AVAILABLE, true)
    expect(keys(moved)).toEqual(['Instance|adminmetadata', 'Instance|identifiers', 'Work|subjects', 'Work|classification'])
    // it is the sheet's own component that moves, its subfields stay as they were
    expect(moved[2].hiddenColumns).toEqual(['x'])
    // the list handed in is left alone
    expect(keys(list)).toEqual(['Instance|adminmetadata', 'Instance|identifiers', 'Work|classification', 'Work|subjects'])
  })

  test('nothing changes when it is in place, or there is nowhere to put it', () => {
    expect(placeComponents(pick('identifiers', 'subjects', 'classification'), PLACE, AVAILABLE, true)).toBeNull()
    // the field it follows is not on the sheet: one that is there stays put, a missing one goes on the end
    expect(placeComponents(pick('subjects', 'classification'), PLACE, AVAILABLE, true)).toBeNull()
    expect(keys(placeComponents(pick('classification'), PLACE, AVAILABLE, false))).toEqual(['Work|classification', 'Work|subjects'])
    // the profile does not have the field
    expect(placeComponents(pick('identifiers'), PLACE, pick('identifiers'), true)).toBeNull()
  })

  test('CIP Verification has color content right after illustrative content, in its list and as a standard placement', () => {
    let cip = builtinWorkflows.filter((d) => { return d.id === 'builtin-monograph-cip-verification' })[0]
    let ids = cip.components.map((c) => { return c.rt + '|' + c.id })
    let illustrative = ids.indexOf('Work|id_loc_gov_ontologies_bibframe_illustrativeContent__illustrative_content')
    expect(illustrative).toBeGreaterThan(-1)
    expect(ids[illustrative + 1]).toBe('Work|id_loc_gov_ontologies_bibframe_colorContent__color_content')
    // the remembered lists get the same place
    let standard = STANDARD_PLACEMENTS[cip.id]
    expect(standard.version).toBeGreaterThan(0)
    expect(standard.place).toEqual([{
      rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_colorContent__color_content',
      after: { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_illustrativeContent__illustrative_content' },
    }])
    // and only that workflow: the other built-in one is as it was
    expect(Object.keys(STANDARD_PLACEMENTS)).toEqual([cip.id])
    // a list remembered from before, color content on the end where it used to be put
    let before = cip.components.filter((c) => { return !c.id.includes('colorContent') }).concat([{ rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_colorContent__color_content' }])
    let after = placeComponents(before, standard.place, [], true).map((c) => { return c.rt + '|' + c.id })
    expect(after).toEqual(ids)
  })
})
