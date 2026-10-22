import { describe, it, expect, beforeEach } from 'vitest'

// the lib under lib/workflows reaches the profile store through utils_rdf / utils_parse, which
// only resolve when the store module has been loaded first (an import cycle)
import '@/stores/profile'

import { portKey, parsePortKey, listSourcePorts, missingPorts, factKey, TEST_NODE_TYPE } from '@/lib/workflows/graph/ports'
import { parseYear, sameValue, compareEntries, constantEntry, booleanEntry, entryText } from '@/lib/workflows/graph/values'
import { NODE_TYPES, nodeType, nodeOptions, fillTemplate } from '@/lib/workflows/graph/nodes'
import { runGraph, joinInputs, usedPortKeys, graphSummary } from '@/lib/workflows/graph/run'
import { exportDefinition, importDefinition, checkGraphPorts, exportFileName } from '@/lib/workflows/graph/file'

const WORK_DATE = portKey('record', 'Work', 'id_loc_gov_ontologies_bibframe_originDate__date', 'http://id.loc.gov/ontologies/bibframe/originDate')
const ROLE = portKey('record', 'Work', 'id_loc_gov_ontologies_bibframe_contribution__contributors', 'http://id.loc.gov/ontologies/bibframe/role')
const AGENT = portKey('record', 'Work', 'id_loc_gov_ontologies_bibframe_contribution__contributors', 'http://id.loc.gov/ontologies/bibframe/agent')
const WC_EXTENT = portKey('worldcat', 'Instance', 'id_loc_gov_ontologies_bibframe_extent__physical_description', 'http://id.loc.gov/ontologies/bibframe/extent')
const EXTENT = portKey('record', 'Instance', 'id_loc_gov_ontologies_bibframe_extent__physical_description', 'http://id.loc.gov/ontologies/bibframe/extent')
const CONTRIB = 'Work|id_loc_gov_ontologies_bibframe_contribution__contributors'
const DATE_GROUP = 'Work|id_loc_gov_ontologies_bibframe_originDate__date'

function literal(text, lines){
  let e = constantEntry(text)
  e.lines = lines || {}
  return e
}
function linked(uri, label, lines){
  return { uri: uri, label: label, literal: null, lang: null, lines: lines || {}, empty: false, guid: null }
}
function emptyEntry(lines){
  return { uri: null, label: null, literal: null, lang: null, lines: lines || {}, empty: true, guid: null }
}

/**
* A saved graph the way Baklava saves it: the source node's outputs are keyed by port key, the
* wires go from interface id to interface id
*/
let nextId = 1
function iface(value){ return { id: 'i' + (nextId++), value: value === undefined ? null : value } }
function sourceNode(portKeys){
  let outputs = {}
  for (let k of portKeys){ outputs[k] = iface() }
  return { type: 'wf-source', id: 'source', title: 'Record', inputs: {}, outputs: outputs }
}
function node(type, id, options){
  let definition = nodeType(type)
  let inputs = {}
  for (let k in definition.inputs){ inputs[k] = iface() }
  for (let k in definition.options){ inputs[k] = iface((options && options[k] !== undefined) ? options[k] : definition.options[k].default) }
  let outputs = {}
  for (let k in definition.outputs){ outputs[k] = iface() }
  return { type: type, id: id, title: definition.title, inputs: inputs, outputs: outputs }
}
function wire(fromNode, fromKey, toNode, toKey){
  return { id: 'c' + (nextId++), from: fromNode.outputs[fromKey].id, to: toNode.inputs[toKey].id }
}
function state(nodes, connections){
  return { graph: { id: 'g', nodes: nodes, connections: connections, inputs: [], outputs: [] }, graphTemplates: [] }
}

function context(){
  let ctx = { writes: [], logged: [] }
  ctx.write = async function(targetKey, lineIndex, entry, mode){
    ctx.writes.push({ target: targetKey, line: lineIndex, text: entryText(entry), uri: entry.uri, mode: mode })
    return null
  }
  ctx.log = function(entry){ ctx.logged.push(entry) }
  return ctx
}

describe('graph ports', () => {
  it('a port key round trips', () => {
    let parsed = parsePortKey(ROLE)
    expect(parsed.origin).toBe('record')
    expect(parsed.rt).toBe('Work')
    expect(parsed.componentId).toBe('id_loc_gov_ontologies_bibframe_contribution__contributors')
    expect(parsed.columnKey).toBe('http://id.loc.gov/ontologies/bibframe/role')
    expect(parsed.groupKey).toBe(CONTRIB)
    // a nested column key carries its own |
    let nested = portKey('record', 'Instance', 'c', 'http://a|http://b')
    expect(parsePortKey(nested).columnKey).toBe('http://a|http://b')
    expect(parsePortKey(factKey('worldcat', 'found'))).toEqual({ origin: 'worldcat', fact: 'found' })
    expect(parsePortKey('nonsense')).toBeNull()
  })

  it('the source node lists the record, then each enrichment with its facts', () => {
    let components = [{ rt: 'Work', id: 'a', label: 'A' }, { rt: 'Instance', id: 'b', label: 'B' }]
    let columnsFor = (c) => { return c.id === 'a' ? [{ key: 'k1', label: 'One' }, { key: 'k2', label: 'Two' }] : [{ key: 'k3', label: 'Three' }] }
    let groups = listSourcePorts(components, columnsFor, [])
    expect(groups.map((g) => { return g.origin + ':' + g.label })).toEqual(['record:A', 'record:B'])
    expect(groups[0].ports.map((p) => { return p.key })).toEqual(['record|Work|a|k1', 'record|Work|a|k2'])

    let withWorldcat = listSourcePorts(components, columnsFor, ['cip-lookup'])
    let origins = withWorldcat.map((g) => { return g.origin + ':' + (g.fact ? 'fact' : g.label) })
    expect(origins).toEqual(['record:A', 'record:B', 'worldcat:fact', 'worldcat:fact', 'worldcat:A', 'worldcat:B'])
    expect(withWorldcat[2].ports[0].key).toBe('worldcat|found')
    expect(withWorldcat[2].ports[0].kind).toBe('boolean')

    expect(missingPorts(['record|Work|a|k1', 'record|Work|zzz|k9'], groups).map((m) => { return m.key })).toEqual(['record|Work|zzz|k9'])
  })
})

describe('graph values', () => {
  beforeEach(() => { window.sessionStorage.clear() })

  it('parses a year out of the ways a date is written', () => {
    expect(parseYear('2010')).toBe(2010)
    expect(parseYear('[2010]')).toBe(2010)
    expect(parseYear('2010-2012')).toBe(2010)
    expect(parseYear('c2010.')).toBe(2010)
    expect(parseYear('19uu')).toBeNull()
    expect(parseYear('')).toBeNull()
  })

  it('compares linked values on the URI or the label', () => {
    let a = linked('http://id.loc.gov/vocabulary/relators/ill', 'Illustrator')
    expect(sameValue(a, linked('https://id.loc.gov/vocabulary/relators/ill/', 'anything'))).toBe(true)
    expect(sameValue(a, literal('illustrator'))).toBe(true)
    expect(sameValue(a, literal('http://id.loc.gov/vocabulary/relators/ill'))).toBe(true)
    expect(sameValue(a, literal('illustrator'), 'uri')).toBe(false)
    expect(sameValue(a, linked('http://id.loc.gov/vocabulary/relators/aut', 'Illustrator'), 'label')).toBe(true)
    expect(sameValue(a, linked('http://id.loc.gov/vocabulary/relators/aut', 'Illustrator'))).toBe(false)
    expect(sameValue(emptyEntry(), a)).toBe(false)
  })

  it('a bare URI gets its label from the editor\'s label cache', () => {
    window.sessionStorage.setItem('https://id.loc.gov/vocabulary/mnotetype/physical.nt', 'physical details')
    let bare = linked('http://id.loc.gov/vocabulary/mnotetype/physical', null)
    expect(sameValue(bare, literal('Physical details'))).toBe(true)
  })

  it('the operators', () => {
    let date = literal('[1998]')
    expect(compareEntries('lt', date, literal('2010'), { parseYear: true })).toBe(true)
    expect(compareEntries('gte', date, literal('2010'), { parseYear: true })).toBe(false)
    expect(compareEntries('lt', literal('no digits'), literal('2010'), { parseYear: false })).toBe(false)
    expect(compareEntries('empty', null)).toBe(true)
    expect(compareEntries('empty', emptyEntry())).toBe(true)
    expect(compareEntries('notEmpty', date)).toBe(true)
    expect(compareEntries('contains', literal('Illustrated by Jane Doe'), literal('jane doe'))).toBe(true)
    expect(compareEntries('startsWith', literal('Illustrated by Jane Doe'), literal('illus'))).toBe(true)
    expect(compareEntries('regex', literal('324 pages'), literal('^\\d+ pages$'))).toBe(true)
    expect(compareEntries('regex', literal('324 pages'), literal('['))).toBe(false)
    expect(compareEntries('notEquals', literal('a'), literal('b'))).toBe(true)
    expect(compareEntries('notEquals', emptyEntry(), literal('b'))).toBe(false)
  })
})

describe('graph nodes', () => {
  it('every node type has a run function and defaults for its options', () => {
    for (let definition of NODE_TYPES){
      expect(typeof definition.run).toBe('function')
      let options = nodeOptions(definition, null)
      expect(Object.keys(options)).toEqual(Object.keys(definition.options))
    }
    expect(nodeType('nope')).toBeNull()
  })

  it('a note fills the inputs into its text', () => {
    expect(fillTemplate('Date is {value}, {nothing}', { value: literal('2010') })).toBe('Date is 2010, {nothing}')
  })

  it('transform changes the text', () => {
    let t = nodeType('wf-transform')
    expect(t.run({ value: literal('  324 p. ') }, { transform: 'trim' }).value.literal).toBe('324 p.')
    expect(t.run({ value: literal('324 p.') }, { transform: 'regex', pattern: 'p\\.', replacement: 'pages' }).value.literal).toBe('324 pages')
    expect(t.run({ value: literal('324 p.') }, { transform: 'suffix', pattern: ' ; 24 cm' }).value.literal).toBe('324 p. ; 24 cm')
    expect(t.run({ value: literal('illustrations.') }, { transform: 'stripPunctuation' }).value.literal).toBe('illustrations')
    expect(t.run({ value: emptyEntry() }, { transform: 'trim' }).value.empty).toBe(true)
  })
})

describe('joining the lines of a node\'s inputs', () => {
  it('pairs the same component by line and hands a single value to every line', () => {
    let rows = joinInputs({
      a: [literal('a0', { [CONTRIB]: 0 }), literal('a1', { [CONTRIB]: 1 })],
      b: [literal('b0', { [CONTRIB]: 0 }), literal('b1', { [CONTRIB]: 1 })],
      c: [literal('date', { [DATE_GROUP]: 0 })],
      when: null,
    })
    expect(rows.length).toBe(2)
    expect(rows.map((r) => { return r.inputs.a.literal + '+' + r.inputs.b.literal + '+' + r.inputs.c.literal })).toEqual(['a0+b0+date', 'a1+b1+date'])
    expect(rows[1].lines).toEqual({ [CONTRIB]: 1, [DATE_GROUP]: 0 })
    expect(rows[0].inputs.when).toBeNull()
  })

  it('two repeating components give every combination', () => {
    let rows = joinInputs({
      a: [literal('a0', { x: 0 }), literal('a1', { x: 1 })],
      b: [literal('b0', { y: 0 }), literal('b1', { y: 1 }), literal('b2', { y: 2 })],
    })
    expect(rows.length).toBe(6)
  })

  it('an input with nothing on it still gives the line, as empty', () => {
    let rows = joinInputs({ a: [literal('a0', { x: 0 })], b: [] })
    expect(rows.length).toBe(1)
    expect(rows[0].inputs.b).toBeNull()
  })
})

describe('running a graph', () => {
  it('drops a record whose work date is before 2010', async () => {
    let source = sourceNode([WORK_DATE])
    let test = node('wf-if', 'if1', { operator: 'lt', constant: '2010', parseYear: true })
    let drop = node('wf-drop', 'drop1', { reason: 'Published {value} which is before 2010' })
    let graph = state([source, test, drop], [wire(source, WORK_DATE, test, 'a'), wire(test, 'then', drop, 'when'), wire(test, 'a', drop, 'value')])

    let ctx = context()
    let result = await runGraph(graph, { [WORK_DATE]: [literal('[1998]', { [DATE_GROUP]: 0 })] }, ctx)
    expect(result.dropped).toBe(true)
    expect(result.reason).toBe('Published [1998] which is before 2010')
    expect(ctx.logged[0].level).toBe('drop')

    let kept = await runGraph(graph, { [WORK_DATE]: [literal('2015', { [DATE_GROUP]: 0 })] }, context())
    expect(kept.dropped).toBe(false)
    expect(kept.ran).toBe(2)
  })

  it('sets a value when the field is empty, on the line that was tested', async () => {
    let source = sourceNode([WORK_DATE])
    let test = node('wf-if', 'if1', { operator: 'empty' })
    let set = node('wf-set', 'set1', { target: WORK_DATE, text: '2010', mode: 'ifEmpty' })
    let graph = state([source, test, set], [wire(source, WORK_DATE, test, 'a'), wire(test, 'then', set, 'when')])

    let ctx = context()
    await runGraph(graph, { [WORK_DATE]: [emptyEntry({ [DATE_GROUP]: 0 })] }, ctx)
    expect(ctx.writes).toEqual([{ target: WORK_DATE, line: 0, text: '2010', uri: null, mode: 'ifEmpty' }])

    let untouched = context()
    await runGraph(graph, { [WORK_DATE]: [literal('2001', { [DATE_GROUP]: 0 })] }, untouched)
    expect(untouched.writes).toEqual([])
  })

  it('runs once per contributor and acts on the matching line', async () => {
    let source = sourceNode([ROLE, AGENT])
    let test = node('wf-if', 'if1', { operator: 'equals', constant: 'illustrator' })
    let note = node('wf-flag', 'flag1', { text: 'Illustrated by {value}' })
    let graph = state([source, test, note], [wire(source, ROLE, test, 'a'), wire(test, 'then', note, 'when'), wire(source, AGENT, note, 'value')])

    let values = {
      [ROLE]: [linked('http://id.loc.gov/vocabulary/relators/aut', 'Author', { [CONTRIB]: 0 }), linked('http://id.loc.gov/vocabulary/relators/ill', 'Illustrator', { [CONTRIB]: 1 }), emptyEntry({ [CONTRIB]: 2 })],
      [AGENT]: [linked('http://a', 'Doe, Jane', { [CONTRIB]: 0 }), linked('http://b', 'Roe, Richard', { [CONTRIB]: 1 }), linked('http://c', 'Nobody', { [CONTRIB]: 2 })],
    }
    let ctx = context()
    let result = await runGraph(graph, values, ctx)
    let flags = result.log.filter((l) => { return l.level === 'flag' })
    expect(flags.map((l) => { return l.message })).toEqual(['Illustrated by Roe, Richard'])
  })

  it('copies a WorldCat value into the record through the context', async () => {
    let source = sourceNode([EXTENT, WC_EXTENT])
    let test = node('wf-if', 'if1', { operator: 'empty' })
    let copy = node('wf-copy', 'copy1', { target: EXTENT, mode: 'replace' })
    let graph = state([source, test, copy], [wire(source, EXTENT, test, 'a'), wire(test, 'then', copy, 'when'), wire(source, WC_EXTENT, copy, 'from')])
    let ctx = context()
    await runGraph(graph, {
      [EXTENT]: [emptyEntry({ 'Instance|id_loc_gov_ontologies_bibframe_extent__physical_description': 0 })],
      [WC_EXTENT]: [literal('324 pages', { 'Instance|id_loc_gov_ontologies_bibframe_extent__physical_description': 0 })],
    }, ctx)
    expect(ctx.writes).toEqual([{ target: EXTENT, line: 0, text: '324 pages', uri: null, mode: 'replace' }])
  })

  it('Set value if tests and writes in one node: the tested value, or the typed text', async () => {
    let source = sourceNode([ROLE, AGENT])
    // every contributor whose role is empty gets the author role, written as a linked value
    let setIf = node('wf-set-if', 'setif1', { operator: 'empty', target: ROLE, uri: 'http://id.loc.gov/vocabulary/relators/aut', text: 'Author', mode: 'ifEmpty' })
    let graph = state([source, setIf], [wire(source, ROLE, setIf, 'a')])
    let ctx = context()
    let result = await runGraph(graph, {
      [ROLE]: [linked('http://id.loc.gov/vocabulary/relators/ill', 'Illustrator', { [CONTRIB]: 0 }), emptyEntry({ [CONTRIB]: 1 })],
    }, ctx)
    expect(result.dropped).toBe(false)
    expect(ctx.writes).toEqual([{ target: ROLE, line: 1, text: 'Author', uri: 'http://id.loc.gov/vocabulary/relators/aut', mode: 'ifEmpty' }])

    // without a text the tested value itself is what is written: the agent of every illustrator goes into the other field
    let copyIf = node('wf-set-if', 'setif2', { operator: 'contains', constant: 'Roe', target: AGENT, mode: 'add' })
    let graph2 = state([source, copyIf], [wire(source, AGENT, copyIf, 'a')])
    let ctx2 = context()
    await runGraph(graph2, { [AGENT]: [linked('http://a', 'Doe, Jane', { [CONTRIB]: 0 }), linked('http://b', 'Roe, Richard', { [CONTRIB]: 1 })] }, ctx2)
    expect(ctx2.writes).toEqual([{ target: AGENT, line: 1, text: 'Roe, Richard', uri: 'http://b', mode: 'add' }])
  })

  it('Drop record if and Set warning flag if act on the test alone, and chain through True', async () => {
    let source = sourceNode([WORK_DATE])
    let dropIf = node('wf-drop-if', 'dropif1', { operator: 'lt', constant: '2010', parseYear: true, reason: 'Published {value}' })
    let flagIf = node('wf-flag-if', 'flagif1', { operator: 'notEmpty', text: 'Check the date {value}' })
    let graph = state([source, dropIf, flagIf], [wire(source, WORK_DATE, dropIf, 'a'), wire(dropIf, 'a', flagIf, 'a'), wire(dropIf, 'else', flagIf, 'when')])

    let dropped = await runGraph(graph, { [WORK_DATE]: [literal('c1998', { [DATE_GROUP]: 0 })] }, context())
    expect(dropped.dropped).toBe(true)
    expect(dropped.reason).toBe('Published c1998')

    let kept = await runGraph(graph, { [WORK_DATE]: [literal('2015', { [DATE_GROUP]: 0 })] }, context())
    expect(kept.dropped).toBe(false)
    expect(kept.log.filter((l) => { return l.level === 'flag' }).map((l) => { return l.message })).toEqual(['Check the date 2015'])
  })

  it('a write that can not be done is logged as an error', async () => {
    let source = sourceNode([WORK_DATE])
    let set = node('wf-set', 'set1', { target: '', text: '2010' })
    let graph = state([source, set], [])
    let result = await runGraph(graph, { [WORK_DATE]: [] }, context())
    expect(result.log.filter((l) => { return l.level === 'error' }).length).toBe(1)
  })

  it('the builder\'s Test node on the canvas is not a step of the graph', async () => {
    let source = sourceNode([WORK_DATE])
    let flag = node('wf-flag', 'flag1', { text: 'Date is {value}' })
    let testNode = { type: TEST_NODE_TYPE, id: 'test1', title: 'Test on a record', inputs: { identifier: iface('2001012345') }, outputs: {} }
    let graph = state([source, flag, testNode], [wire(source, WORK_DATE, flag, 'value')])
    let result = await runGraph(graph, { [WORK_DATE]: [literal('2015', { [DATE_GROUP]: 0 })] }, context())
    expect(result.log.filter((l) => { return l.level === 'error' })).toEqual([])
    expect(result.log.filter((l) => { return l.level === 'flag' }).length).toBe(1)
    expect(graphSummary(graph).nodes).toBe(1)
    let file = importDefinition(exportDefinition({ id: 'wf-1', name: 'T', profileId: 'lc:RT:bf2:Monograph:Instance', components: [], enrichments: [], graph: { version: 1, editor: graph } }))
    expect(file.problems).toEqual([])
  })

  it('a loop is refused', async () => {
    let source = sourceNode([WORK_DATE])
    let t1 = node('wf-transform', 't1', {})
    let t2 = node('wf-transform', 't2', {})
    let graph = state([source, t1, t2], [wire(t1, 'value', t2, 'value'), wire(t2, 'value', t1, 'value')])
    let result = await runGraph(graph, {}, context())
    expect(result.log[0].level).toBe('error')
    expect(result.ran).toBe(0)
  })

  it('knows which ports are wired', () => {
    let source = sourceNode([WORK_DATE, ROLE])
    let test = node('wf-if', 'if1', {})
    let graph = state([source, test], [wire(source, ROLE, test, 'a')])
    expect(usedPortKeys(graph)).toEqual([ROLE])
    expect(graphSummary(graph)).toEqual({ nodes: 1, wires: 1, ports: 1 })
  })
})

describe('a workflow as a file', () => {
  it('exports and imports a definition with its graph', () => {
    let source = sourceNode([WORK_DATE])
    let test = node('wf-if', 'if1', { operator: 'empty' })
    let definition = {
      id: 'wf-1', builtin: false, created: 1, updated: 2,
      name: 'Drop old books', description: 'd', profileId: 'lc:RT:bf2:Monograph:Instance',
      components: [{ rt: 'Work', id: 'x', label: 'X', hiddenColumns: [] }],
      enrichments: ['cip-lookup'],
      graph: { version: 1, editor: state([source, test], [wire(source, WORK_DATE, test, 'a')]) },
    }
    let text = exportDefinition(definition)
    let data = JSON.parse(text)
    expect(data.format).toBe('marva-workflow')
    expect(data.workflow.id).toBeUndefined()
    expect(exportFileName(definition)).toBe('drop-old-books.workflow.json')

    let back = importDefinition(text)
    expect(back.problems).toEqual([])
    expect(back.definition.name).toBe('Drop old books')
    expect(back.definition.components).toEqual([{ rt: 'Work', id: 'x', hiddenColumns: [] }])
    expect(back.definition.graph.editor.graph.nodes.length).toBe(2)
  })

  it('says what is wrong with a file', () => {
    expect(importDefinition('not json').definition).toBeNull()
    expect(importDefinition('{"name": "x"}').problems[0]).toMatch(/profile/)
    let unknown = importDefinition(JSON.stringify({ name: 'x', profileId: 'p', components: [], graph: { version: 1, editor: { graph: { nodes: [{ type: 'wf-future', id: 'n', inputs: {}, outputs: {} }], connections: [] } } } }))
    expect(unknown.definition).not.toBeNull()
    expect(unknown.problems[0]).toMatch(/wf-future/)
  })

  it('finds the wires whose port the profile does not have', () => {
    let source = sourceNode([WORK_DATE, 'record|Work|gone|k'])
    let test = node('wf-if', 'if1', {})
    let definition = { graph: { version: 1, editor: state([source, test], [wire(source, 'record|Work|gone|k', test, 'a')]) } }
    let groups = listSourcePorts([{ rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_originDate__date', label: 'Date' }], () => { return [{ key: 'http://id.loc.gov/ontologies/bibframe/originDate', label: 'Date' }] }, [])
    expect(checkGraphPorts(definition, groups).map((m) => { return m.key })).toEqual(['record|Work|gone|k'])
  })
})
