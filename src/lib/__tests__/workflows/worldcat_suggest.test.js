import { describe, it, expect } from 'vitest'

// the lib under lib/workflows reaches the profile store through utils_rdf / utils_parse, which
// only resolve when the store module has been loaded first (an import cycle)
import '@/stores/profile'

import { CIP_ENRICHMENT_ID, WORLDCAT_SUGGEST_ENRICHMENT_ID, worldcatLookupOn, cipChecklistOn } from '@/lib/workflows/cip'
import workflowEnrichments from '@/lib/workflows/enrichments'
import { listSourcePorts, enrichmentOrigins, ENRICHMENT_ORIGINS } from '@/lib/workflows/graph/ports'

describe('Suggest from WorldCat (the plain overlay, without the CIP checklist)', () => {
  it('is offered in the builder, available, and the two WorldCat options exclude each other', () => {
    let suggest = workflowEnrichments.filter((e) => { return e.id === WORLDCAT_SUGGEST_ENRICHMENT_ID })[0]
    let cip = workflowEnrichments.filter((e) => { return e.id === CIP_ENRICHMENT_ID })[0]
    expect(suggest).toBeTruthy()
    expect(suggest.available).toBe(true)
    expect(suggest.label).toBe('Suggest from WorldCat')
    expect(suggest.excludes).toEqual([CIP_ENRICHMENT_ID])
    expect(cip.excludes).toEqual([WORLDCAT_SUGGEST_ENRICHMENT_ID])
  })

  it('turns the lookup on but not the checklist', () => {
    expect(worldcatLookupOn([WORLDCAT_SUGGEST_ENRICHMENT_ID])).toBe(true)
    expect(cipChecklistOn([WORLDCAT_SUGGEST_ENRICHMENT_ID])).toBe(false)
    expect(worldcatLookupOn([CIP_ENRICHMENT_ID])).toBe(true)
    expect(cipChecklistOn([CIP_ENRICHMENT_ID])).toBe(true)
    expect(worldcatLookupOn([])).toBe(false)
    expect(worldcatLookupOn(null)).toBe(false)
    expect(worldcatLookupOn(['default-values'])).toBe(false)
  })

  it('puts the WorldCat fields on the graph source node, once even when both WorldCat options are on', () => {
    expect(ENRICHMENT_ORIGINS[WORLDCAT_SUGGEST_ENRICHMENT_ID].origin).toBe('worldcat')
    expect(ENRICHMENT_ORIGINS[WORLDCAT_SUGGEST_ENRICHMENT_ID].name).not.toBe(ENRICHMENT_ORIGINS[CIP_ENRICHMENT_ID].name)
    expect(enrichmentOrigins([WORLDCAT_SUGGEST_ENRICHMENT_ID]).map((o) => { return o.origin })).toEqual(['worldcat'])
    expect(enrichmentOrigins([CIP_ENRICHMENT_ID, WORLDCAT_SUGGEST_ENRICHMENT_ID]).map((o) => { return o.origin })).toEqual(['worldcat'])

    let components = [{ rt: 'Work', id: 'a', label: 'A' }]
    let columnsFor = () => { return [{ key: 'k1', label: 'One' }] }
    let onlySuggest = listSourcePorts(components, columnsFor, [WORLDCAT_SUGGEST_ENRICHMENT_ID]).map((g) => { return g.origin + ':' + (g.fact ? 'fact' : g.label) })
    expect(onlySuggest).toEqual(['record:A', 'worldcat:fact', 'worldcat:fact', 'worldcat:A'])
    let both = listSourcePorts(components, columnsFor, [CIP_ENRICHMENT_ID, WORLDCAT_SUGGEST_ENRICHMENT_ID]).map((g) => { return g.origin + ':' + (g.fact ? 'fact' : g.label) })
    expect(both).toEqual(onlySuggest)
  })
})
