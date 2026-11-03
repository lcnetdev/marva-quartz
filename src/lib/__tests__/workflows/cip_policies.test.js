import { describe, expect, test } from 'vitest'
// the profile store has to load before lib/workflows (utils_profile -> stores/profile -> utils_parse share a cycle with utils_rdf)
import '@/stores/profile'
import { isAutoReplaced, isRequired, suggestionsHidden, applyReplacements, applyRequired, applyChecklistRules, checklistGoverns, linkedToUnlinked, knownLabel, AUTO_REPLACE_COMPONENTS, REQUIRED_COMPONENTS, physicalDescriptionSaysColor, impliedColorContent, COLOR_CONTENT_COLOR, compareComponent, isSourceColumn, sourceStillOffered } from '@/lib/workflows/cip'

const ONT = 'http://id.loc.gov/ontologies/bibframe/'
const comp = (prop, id) => { return { rt: 'Instance', id: id || ('id_loc_gov_ontologies_bibframe_' + prop), propertyURI: ONT + prop, label: prop } }

describe('CIP field policies', () => {
  test('the fields the book settles are replaced on their own, and the ones a CIP record needs are required', () => {
    for (let prop of ['responsibilityStatement', 'copyrightDate', 'extent', 'dimensions']){
      expect(isAutoReplaced(comp(prop))).toBe(true)
      expect(isRequired(comp(prop))).toBe(true)
    }
    // replaced from WorldCat but not required: a book may have no illustrations
    expect(isAutoReplaced(comp('illustrativeContent'))).toBe(true)
    expect(isRequired(comp('illustrativeContent'))).toBe(false)
    expect(isAutoReplaced(comp('adminMetadata'))).toBe(true)
    expect(isRequired(comp('adminMetadata'))).toBe(false)
    expect(isAutoReplaced(comp('title'))).toBe(false)
    expect(isRequired(comp('title'))).toBe(false)
    expect(REQUIRED_COMPONENTS.every((uri) => { return AUTO_REPLACE_COMPONENTS.includes(uri) })).toBe(true)
  })

  test('the linked related work / series and the expression-of hub have their WorldCat data hidden', () => {
    expect(suggestionsHidden(comp('expressionOf', 'id_loc_gov_ontologies_bibframe_expressionOf__expression_of_[search_for_a_hub]'))).toBe(true)
    expect(suggestionsHidden(comp('relation', 'id_loc_gov_ontologies_bibframe_relation__search_related_workseries'))).toBe(true)
    expect(suggestionsHidden(comp('relation', 'id_loc_gov_ontologies_bibframe_relation__search_related_work'))).toBe(true)
    expect(suggestionsHidden(comp('relation', 'id_loc_gov_ontologies_bibframe_relation__input_transcribed_series'))).toBe(false)
    expect(suggestionsHidden(comp('relation', 'id_loc_gov_ontologies_bibframe_relation__related_work_not_held_by_lc'))).toBe(false)
    expect(suggestionsHidden(comp('contribution'))).toBe(false)
  })
})

describe('applyReplacements', () => {
  const line = () => { return { pt: { '@guid': 'g1', userValue: {} }, cells: {}, suggestion: null } }
  const replaced = { 'k|g1': { ptGuid: 'g1', before: {}, cells: { a: { old: [{ label: 'xx p.' }], new: [{ label: 'xx, 161 pages' }] } } } }

  test('puts a replaced suggestion on the cell with the old value and the key to restore with', () => {
    let l = line()
    applyReplacements('k', [l], replaced)
    expect(l.suggestion.cells.a.status).toBe('replaced')
    expect(l.suggestion.cells.a.old[0].label).toBe('xx p.')
    expect(l.suggestion.cells.a.lineKey).toBe('k|g1')
    expect(l.suggestion.replaced).toBe(1)
    expect(l.suggestion.open).toBe(0)
  })

  test('a match on the cell gives way to it, a checklist finding does not, and a dismissed one stays quiet', () => {
    let l = line()
    l.suggestion = { pt: null, cells: { a: { status: 'match', values: [] } }, verified: 1, open: 0, wholeLine: false, key: null, values: {} }
    applyReplacements('k', [l], replaced)
    expect(l.suggestion.cells.a.status).toBe('replaced')
    expect(l.suggestion.verified).toBe(0)

    let kept = line()
    kept.suggestion = { pt: null, cells: { a: { status: 'differs', values: [], check: '300' } }, verified: 0, open: 1, wholeLine: false, key: null, values: {} }
    applyReplacements('k', [kept], replaced)
    expect(kept.suggestion.cells.a.status).toBe('differs')

    let quiet = line()
    applyReplacements('k', [quiet], replaced, ['k|g1|a|replaced'])
    expect(quiet.suggestion).toBeNull()
  })
})

describe('applyRequired', () => {
  test('an empty line is missing unless the lookup is still running or something is offered for it', () => {
    let empty = { pt: { '@guid': 'g', userValue: { '@root': 'x' } }, cells: {}, suggestion: null }
    applyRequired([empty], false)
    expect(empty.missing).toBe(true)

    let pending = { pt: { '@guid': 'g', userValue: { '@root': 'x' } }, cells: {}, suggestion: null }
    applyRequired([pending], true)
    expect(pending.missing).toBeUndefined()

    let offered = { pt: { '@guid': 'g', userValue: { '@root': 'x' } }, cells: {}, suggestion: { open: 1, cells: {} } }
    applyRequired([offered], false)
    expect(offered.missing).toBeUndefined()

    let filled = { pt: { '@guid': 'g', userValue: { '@root': 'x', [ONT + 'extent']: [{ [ONT + 'extent']: '161 pages' }] } }, cells: {}, suggestion: null }
    applyRequired([filled], false)
    expect(filled.missing).toBeUndefined()
  })
})

describe('checklistGoverns', () => {
  test('the admin metadata cells a rule sets belong to the checklist, the rest to WorldCat', () => {
    let admin = { propertyURI: ONT + 'adminMetadata' }
    expect(checklistGoverns(admin, 'http://id.loc.gov/ontologies/bflc/encodingLevel')).toBe(true)
    expect(checklistGoverns(admin, ONT + 'descriptionConventions')).toBe(true)
    expect(checklistGoverns(admin, ONT + 'descriptionLanguage')).toBe(true)
    expect(checklistGoverns(admin, ONT + 'descriptionAuthentication')).toBe(true)
    expect(checklistGoverns(admin, ONT + 'source')).toBe(false)
    // a wording rule is a correction of whatever is there, not a fixed value
    expect(checklistGoverns(comp('extent'), ONT + 'extent')).toBe(false)
    // 33X rules only warn
    expect(checklistGoverns(comp('content'), ONT + 'content')).toBe(false)
  })
})

describe('linkedToUnlinked', () => {
  test('a URI value is not traded for a bare label, anything else may be', () => {
    expect(linkedToUnlinked([{ uri: 'http://id.loc.gov/vocabulary/mnotetype/physical', label: null }], [{ uri: null, label: 'physical details' }])).toBe(true)
    expect(linkedToUnlinked([{ uri: null, label: 'xx p.' }], [{ uri: null, label: 'xx pages' }])).toBe(false)
    expect(linkedToUnlinked([{ uri: 'http://a', label: 'a' }], [{ uri: 'http://b', label: 'b' }])).toBe(false)
    expect(linkedToUnlinked([], [{ uri: null, label: 'new' }])).toBe(false)
  })
})

describe('knownLabel', () => {
  test('reads the label the editor cached for a URI, under the editor\'s own key', () => {
    sessionStorage.setItem('https://id.loc.gov/vocabulary/mnotetype/physical.nt', 'physical details')
    expect(knownLabel('http://id.loc.gov/vocabulary/mnotetype/physical')).toBe('physical details')
    expect(knownLabel('http://id.loc.gov/vocabulary/mnotetype/physical/')).toBe('physical details')
    expect(knownLabel('http://id.loc.gov/vocabulary/mnotetype/other')).toBeNull()
    expect(knownLabel(null)).toBeNull()
  })
})

describe('applyChecklistRules is the authority on the cells it governs', () => {
  const ENCODING = 'http://id.loc.gov/ontologies/bflc/encodingLevel'
  const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'
  const group = { component: { propertyURI: ONT + 'adminMetadata' }, columns: [{ key: ENCODING, kind: 'field' }] }
  const fullPt = () => { return { '@guid': 'g', userValue: { [ENCODING]: [{ '@id': 'http://id.loc.gov/vocabulary/menclvl/f', '@guid': 'v', [LABEL]: [{ [LABEL]: 'full' }] }] } } }
  const cell = { kind: 'field', fieldType: 'SIMPLE', propertyPath: [{ level: 0, propertyURI: ENCODING }] }

  test('a satisfied rule turns a WorldCat offer for the cell into a match, so the old-value note can show', () => {
    let line = { pt: fullPt(), cells: { [ENCODING]: cell }, suggestion: { pt: null, cells: { [ENCODING]: { status: 'differs', values: [{ label: 'prepublication', uri: null }], key: 'k' } }, verified: 0, open: 1, wholeLine: false, key: null, values: {} } }
    applyChecklistRules('k', group, [line], { hasSeries: false })
    expect(line.suggestion.cells[ENCODING].status).toBe('match')
    expect(line.suggestion.open).toBe(0)
    expect(line.suggestion.verified).toBe(1)

    let replaced = { 'k|g': { ptGuid: 'g', before: {}, cells: { [ENCODING]: { old: [{ label: 'prepublication' }], new: [{ label: 'full' }] } } } }
    applyReplacements('k', [line], replaced)
    expect(line.suggestion.cells[ENCODING].status).toBe('replaced')
    expect(line.suggestion.cells[ENCODING].old[0].label).toBe('prepublication')
  })

  test('an unsatisfied rule still asks for the checklist value', () => {
    let pt = fullPt()
    pt.userValue[ENCODING][0]['@id'] = 'http://id.loc.gov/vocabulary/menclvl/3'
    pt.userValue[ENCODING][0][LABEL][0][LABEL] = 'abbreviated'
    let line = { pt: pt, cells: { [ENCODING]: cell }, suggestion: null }
    applyChecklistRules('k', group, [line], { hasSeries: false })
    expect(line.suggestion.cells[ENCODING].status).toBe('differs')
    expect(line.suggestion.cells[ENCODING].simple.label).toBe('full')
    expect(line.suggestion.cells[ENCODING].replaceGuid).toBe('v')
  })
})

describe('the physical description implies the color content', () => {
  const EXTENT = ONT + 'extent'
  const NOTE = ONT + 'note'
  const COLOR_CONTENT = ONT + 'colorContent'
  const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'
  const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
  const label = (text) => { return [{ '@guid': 'l', [LABEL]: text }] }
  // a record with a physical description (extent + a physical details note) and a Work color content
  const record = (extentLabel, noteLabel, colorContent) => {
    let extent = { '@guid': 'e', '@type': ONT + 'Extent', [LABEL]: label(extentLabel) }
    if (noteLabel !== null){
      extent[NOTE] = [{ '@guid': 'n', '@type': ONT + 'Note', [RDF_TYPE]: [{ '@guid': 't', '@id': 'http://id.loc.gov/vocabulary/mnotetype/physical' }], [LABEL]: label(noteLabel) }]
    }
    let color = { '@guid': 'c', propertyURI: COLOR_CONTENT, propertyLabel: 'Color content', userValue: { '@root': COLOR_CONTENT } }
    if (colorContent){ color.userValue[COLOR_CONTENT] = [{ '@guid': 'cv', '@type': ONT + 'ColorContent', '@id': colorContent, [LABEL]: label('x') }] }
    return {
      rtOrder: ['lc:RT:bf2:Monograph:Work', 'lc:RT:bf2:Monograph:Instance'],
      rt: {
        'lc:RT:bf2:Monograph:Work': { ptOrder: ['color'], pt: { color: color } },
        'lc:RT:bf2:Monograph:Instance': { ptOrder: ['extent'], pt: { extent: { '@guid': 'x', propertyURI: EXTENT, propertyLabel: 'Physical description', userValue: { '@root': EXTENT, [EXTENT]: [extent] } } } },
      },
    }
  }

  test('a physical details note saying color illustrations means color', () => {
    expect(physicalDescriptionSaysColor(record('1 volume (unpaged)', 'color illustrations', null))).toBe(true)
    expect(physicalDescriptionSaysColor(record('1 volume (unpaged)', 'chiefly colour illustrations', null))).toBe(true)
    expect(physicalDescriptionSaysColor(record('1 volume (unpaged)', 'col. ill.', null))).toBe(true)
    // all in the extent's label
    expect(physicalDescriptionSaysColor(record('32 pages : color illustrations', null, null))).toBe(true)
  })

  test('illustrations that are not said to be in color, or no note at all, do not', () => {
    expect(physicalDescriptionSaysColor(record('1 volume (unpaged)', 'illustrations', null))).toBe(false)
    expect(physicalDescriptionSaysColor(record('1 volume (unpaged)', 'black and white illustrations', null))).toBe(false)
    expect(physicalDescriptionSaysColor(record('1 volume (unpaged)', null, null))).toBe(false)
    expect(physicalDescriptionSaysColor({ rtOrder: [], rt: {} })).toBe(false)
  })

  test('the empty Work color content is set to color, an existing one is left to the cataloger', () => {
    let implied = impliedColorContent(record('1 volume (unpaged)', 'color illustrations', null))
    expect(implied).not.toBeNull()
    expect(implied.pt['@guid']).toBe('c')
    expect(implied.value).toEqual(COLOR_CONTENT_COLOR)
    expect(COLOR_CONTENT_COLOR.uri).toBe('http://id.loc.gov/vocabulary/mcolor/mul')
    expect(COLOR_CONTENT_COLOR.label).toBe('color')
    // already has one, even a different one
    expect(impliedColorContent(record('1 volume (unpaged)', 'color illustrations', 'http://id.loc.gov/vocabulary/mcolor/blw'))).toBeNull()
    expect(impliedColorContent(record('1 volume (unpaged)', 'color illustrations', 'http://id.loc.gov/vocabulary/mcolor/mul'))).toBeNull()
    // nothing to imply it from
    expect(impliedColorContent(record('1 volume (unpaged)', 'illustrations', null))).toBeNull()
  })
})

describe('the thesaurus of a heading the record already has is not offered', () => {
  const SUBJECT = ONT + 'subject'
  const SOURCE = ONT + 'source'
  const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'
  const columns = [
    { key: SUBJECT, kind: 'field', label: 'Subjects' },
    { key: SOURCE, kind: 'field', label: 'Thesaurus' },
  ]
  const cells = {
    [SUBJECT]: { kind: 'field', fieldType: 'SIMPLE', propertyPath: [{ level: 0, propertyURI: SUBJECT }] },
    [SOURCE]: { kind: 'field', fieldType: 'SIMPLE', propertyPath: [{ level: 0, propertyURI: SUBJECT }, { level: 1, propertyURI: SOURCE }] },
  }
  // a subject line: the heading, with or without a thesaurus on it
  const line = (guid, heading, headingUri, source) => {
    let node = { '@guid': guid + 'v', '@id': headingUri, [LABEL]: [{ '@guid': guid + 'l', [LABEL]: heading }] }
    if (source){ node[SOURCE] = [{ '@guid': guid + 's', '@id': source.uri, [LABEL]: [{ '@guid': guid + 'sl', [LABEL]: source.label }] }] }
    let pt = { '@guid': guid, propertyURI: SUBJECT, userValue: { '@root': SUBJECT, [SUBJECT]: [node] } }
    return { pt: pt, cells: cells }
  }
  const empty = (guid) => { return { pt: { '@guid': guid, propertyURI: SUBJECT, userValue: { '@root': SUBJECT } }, cells: cells } }
  const FAST = { uri: null, label: 'Faceted application of subject terminology' }
  const LCSH = { uri: 'http://id.loc.gov/vocabulary/subjectSchemes/lcsh', label: 'Library of Congress subject headings' }

  test('bf:source is the thesaurus column, at the top of a line or under a blank node', () => {
    expect(isSourceColumn(SOURCE)).toBe(true)
    expect(isSourceColumn('http://www.w3.org/2002/07/owl#sameAs|' + SOURCE)).toBe(true)
    expect(isSourceColumn(SUBJECT)).toBe(false)
    expect(isSourceColumn(ONT + 'sourceNote')).toBe(false)
  })

  test('WorldCat\'s FAST is not offered on a heading the record has, the heading is just verified', () => {
    let record = [line('r', 'Dinosaurs', 'http://id.loc.gov/authorities/subjects/sh85038226', null)]
    let worldcat = [line('w', 'Dinosaurs', null, FAST)]
    let compared = compareComponent('k', columns, record, worldcat)
    let s = compared.suggestions[0]
    expect(s).not.toBeNull()
    expect(s.cells[SUBJECT].status).toBe('match')
    expect(s.cells[SOURCE]).toBeUndefined()
    expect(s.open).toBe(0)
    expect(s.verified).toBe(1)
    expect(compared.ghosts.length).toBe(0)
  })

  test('nor a different thesaurus for a heading that has one', () => {
    let record = [line('r', 'Dinosaurs', null, LCSH)]
    let worldcat = [line('w', 'Dinosaurs', null, FAST)]
    let s = compareComponent('k', columns, record, worldcat).suggestions[0]
    expect(s.cells[SUBJECT].status).toBe('match')
    expect(s.cells[SOURCE]).toBeUndefined()
    expect(s.open).toBe(0)
  })

  test('the children\'s subject headings are still offered on a heading the record has', () => {
    const CYAC = { uri: 'http://id.loc.gov/authorities/childrensSubjects', label: null }
    expect(sourceStillOffered([CYAC])).toBe(true)
    // as the sheet shows it when the label was not looked up: the URI as the label
    expect(sourceStillOffered([{ uri: null, label: 'https://id.loc.gov/authorities/childrensSubjects/' }])).toBe(true)
    expect(sourceStillOffered([FAST])).toBe(false)
    expect(sourceStillOffered([])).toBe(false)

    let s = compareComponent('k', columns, [line('r', 'Stories in rhyme', null, null)], [line('w', 'Stories in rhyme', null, CYAC)]).suggestions[0]
    expect(s.cells[SUBJECT].status).toBe('match')
    expect(s.cells[SOURCE].status).toBe('add')
    expect(s.open).toBe(1)
    // and in place of a thesaurus the record has
    s = compareComponent('k', columns, [line('r', 'Stories in rhyme', null, LCSH)], [line('w', 'Stories in rhyme', null, CYAC)]).suggestions[0]
    expect(s.cells[SOURCE].status).toBe('differs')
  })

  test('a heading taken whole from WorldCat still brings its thesaurus, and a matching thesaurus still verifies', () => {
    let compared = compareComponent('k', columns, [empty('r')], [line('w', 'Rocks', null, FAST)])
    let s = compared.suggestions[0]
    expect(s.wholeLine).toBe(true)
    expect(s.cells[SUBJECT].status).toBe('add')
    expect(s.cells[SOURCE].status).toBe('add')

    s = compareComponent('k', columns, [line('r', 'Rocks', null, LCSH)], [line('w', 'Rocks', null, LCSH)]).suggestions[0]
    expect(s.cells[SOURCE].status).toBe('match')
    expect(s.verified).toBe(2)
  })
})
