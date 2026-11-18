import { describe, expect, test } from 'vitest'
import utils_parse from '@/lib/utils_parse'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { expandComponentColumns, listProfileComponents, recordSummary } from '@/lib/workflows/fields'
import { RECORD_COLUMNS, isLinkedColumn, buildExportColumns, buildExportTable, toCsv, exportFileName } from '@/lib/workflows/exportCsv'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const fs = require('fs')

const pinia = createPinia()
const app = createApp()
app.use(pinia)

useProfileStore().profiles = JSON.parse(fs.readFileSync('public/profiles.json', 'utf8'))
useProfileStore().rtLookup = JSON.parse(fs.readFileSync('public/rtLookup.json', 'utf8'))

const rtLookup = useProfileStore().rtLookup
const lookupConfig = useConfigStore().lookupConfig
const baseProfile = useProfileStore().profiles['lc:profile:bf2:Monograph']

async function parse(xml){
  utils_parse.parseXml(xml)
  return await utils_parse.transformRts(JSON.parse(JSON.stringify(baseProfile)))
}

const groups = listProfileComponents(baseProfile, lookupConfig).map((component) => {
  let rtId = baseProfile.rtOrder.filter((id) => { return id.endsWith(':' + component.rt) })[0]
  return { key: component.rt + '|' + component.id, component: component, allColumns: expandComponentColumns(baseProfile.rt[rtId].pt[component.id], rtLookup, lookupConfig) }
})

const group = (label, rt) => { return groups.filter((g) => { return g.component.label === label && (!rt || g.component.rt === rt) })[0] }
const column = (g, label) => { return g.allColumns.filter((c) => { return c.label === label })[0] }

// public/test_files/2019028142.xml: Dinosong, a picture book with two ISBNs (one canceled), three
// subjects, a LCC and a Dewey class number
async function dinosong(){
  let profile = await parse(fs.readFileSync('public/test_files/2019028142.xml', 'utf8'))
  let summary = recordSummary(profile)
  return { scanned: '9781534430020', lccn: summary.lccn, label: summary.title, profile: profile, done: true, posted: false, eId: 'e123', sourceUrl: '/x.xml' }
}

/**
* Export the rows with these fields picked, as a list of header -> value objects
*/
function run(rows, selection, repeats){
  let columns = buildExportColumns(groups, selection)
  let table = buildExportTable(rows, columns, rtLookup, lookupConfig, repeats)
  return table.slice(1).map((line) => {
    let out = {}
    table[0].forEach((h, i) => { out[h] = line[i] })
    return out
  })
}

describe('the CSV export of a sheet', () => {
  test('the record columns come first, in their own order', async () => {
    let row = await dinosong()
    let columns = buildExportColumns(groups, { record: ['done', 'isbn', 'scanned', 'lccn', 'title', 'instanceUri', 'workUri', 'marvaId', 'sourceUrl', 'posted'], labels: { [group('Summary').key]: [group('Summary').allColumns[0].key] }, uris: {} })
    expect(columns.map((c) => { return c.header })).toEqual(RECORD_COLUMNS.map((rc) => { return rc.label }).concat(['Summary']))
    let line = buildExportTable([row], columns, rtLookup, lookupConfig)[1]
    // the canceled ISBN is not one of the record's own
    expect(line.slice(0, 10)).toEqual(['9781534430020', '2019028142', '9781534430020', 'Dinosong', 'http://id.loc.gov/resources/instances/21067591', 'http://id.loc.gov/resources/works/21067591', 'e123', '/x.xml', 'yes', 'no'])
  })

  test('a linked field exports its label, its URI, or both as two columns', async () => {
    let row = await dinosong()
    let creator = group('Creator of Work')
    let agent = column(creator, 'Primary contributor')
    expect(isLinkedColumn(agent)).toBe(true)

    let both = run([row], { record: [], labels: { [creator.key]: [agent.key] }, uris: { [creator.key]: [agent.key] } })[0]
    expect(both).toEqual({ 'Creator of Work: Primary contributor': 'McCanna, Tim', 'Creator of Work: Primary contributor URI': 'http://id.loc.gov/rwo/agents/n2015011325' })

    let labelOnly = run([row], { record: [], labels: { [creator.key]: [agent.key] }, uris: {} })[0]
    expect(labelOnly).toEqual({ 'Creator of Work: Primary contributor': 'McCanna, Tim' })

    let uriOnly = run([row], { record: [], labels: {}, uris: { [creator.key]: [agent.key] } })[0]
    expect(uriOnly).toEqual({ 'Creator of Work: Primary contributor URI': 'http://id.loc.gov/rwo/agents/n2015011325' })
  })

  test('a literal has no URI column, and the type of a component is its template name', async () => {
    let row = await dinosong()
    let summary = group('Summary')
    let identifiers = group('Identifiers')
    expect(isLinkedColumn(summary.allColumns[0])).toBe(false)
    let out = run([row], { record: [], labels: { [identifiers.key]: [column(identifiers, 'Type').key] }, uris: { [summary.key]: [summary.allColumns[0].key], [identifiers.key]: [column(identifiers, 'Type').key] } })[0]
    expect(out).toEqual({ 'Identifiers: Type': 'LCCN | ISBN | ISBN' })
  })

  test('the repeats of a component share a cell and keep their places across its columns', async () => {
    let row = await dinosong()
    let classification = group('Classification numbers')
    let keys = ['Type', 'Classification number', 'Additional call number information', 'Dewey edition number', 'Used by assigning agency?'].map((label) => { return column(classification, label).key })
    let out = run([row], { record: [], labels: { [classification.key]: keys }, uris: { [classification.key]: keys } })[0]
    expect(out['Classification numbers: Type']).toBe('Library of Congress classification | Dewey Decimal classification')
    expect(out['Classification numbers: Classification number']).toBe('PZ8.3.M13193 | [E]')
    // only the LCC has one, only the Dewey has the other
    expect(out['Classification numbers: Additional call number information']).toBe('Din 2020 |')
    expect(out['Classification numbers: Dewey edition number']).toBe('| 23')
    expect(out['Classification numbers: Used by assigning agency? URI']).toBe('http://id.loc.gov/vocabulary/mstatus/uba |')

    // several values in one field of one component
    let content = group('Content type')
    let types = run([row], { record: [], labels: { [content.key]: [content.allColumns[0].key] }, uris: { [content.key]: [content.allColumns[0].key] } })[0]
    expect(types).toEqual({ 'Content type': 'text; still image', 'Content type URI': 'http://id.loc.gov/vocabulary/contentTypes/txt; http://id.loc.gov/vocabulary/contentTypes/sti' })

    // an unlinked value keeps its place among the URIs of the linked ones
    let audience = group('Intended audience')
    let aud = run([row], { record: [], labels: {}, uris: { [audience.key]: [column(audience, 'Intended audience').key] } })[0]
    expect(aud['Intended audience: Intended audience URI']).toBe('http://id.loc.gov/vocabulary/maudience/pri | http://id.loc.gov/authorities/demographicTerms/dg2015060010 |  |')
  })

  test('the repeats in columns of their own: a set per repeat, as many as the record with the most', async () => {
    let row = await dinosong()
    let classification = group('Classification numbers')
    let subjects = group('Subjects')
    let summary = group('Summary')
    let heading = subjects.allColumns.filter(isLinkedColumn)[0]
    let selection = {
      record: ['lccn'],
      labels: { [classification.key]: [column(classification, 'Type').key, column(classification, 'Dewey edition number').key], [summary.key]: [summary.allColumns[0].key] },
      uris: { [subjects.key]: [heading.key] },
    }
    let unloaded = { scanned: 'x', lccn: '', label: '', profile: null, done: false }
    let columns = buildExportColumns(groups, selection)
    let table = buildExportTable([unloaded, row], columns, rtLookup, lookupConfig, 'columns')
    let names = columns.map((c) => { return c.header })
    let subjectUri = names.filter((n) => { return n.startsWith('Subjects') })[0]
    // each repeat keeps its columns together, a field that does not repeat has no number
    expect(table[0].filter((h) => { return !h.startsWith('Subjects') })).toEqual(['LCCN', 'Summary', 'Classification numbers: Type (1)', 'Classification numbers: Dewey edition number (1)', 'Classification numbers: Type (2)', 'Classification numbers: Dewey edition number (2)'])
    expect(table[0].filter((h) => { return h.startsWith('Subjects') })).toEqual([subjectUri + ' (1)', subjectUri + ' (2)', subjectUri + ' (3)'])
    expect(table.length).toBe(3)
    let out = {}
    table[0].forEach((h, i) => { out[h] = table[2][i] })
    expect(out['Classification numbers: Type (1)']).toBe('Library of Congress classification')
    expect(out['Classification numbers: Dewey edition number (1)']).toBe('')
    expect(out['Classification numbers: Type (2)']).toBe('Dewey Decimal classification')
    expect(out['Classification numbers: Dewey edition number (2)']).toBe('23')
    expect(out[subjectUri + ' (3)']).toBe('http://id.loc.gov/authorities/childrensSubjects/sj2021051091')
    // the record that is not loaded has its record columns and nothing else
    expect(table[1]).toEqual([''].concat(table[0].slice(1).map(() => { return '' })))
  })

  test('the repeats on the rows below: a line per repeat, with the record columns on each', async () => {
    let row = await dinosong()
    let classification = group('Classification numbers')
    let subjects = group('Subjects')
    let summary = group('Summary')
    let heading = subjects.allColumns.filter(isLinkedColumn)[0]
    let selection = {
      record: ['lccn'],
      labels: { [classification.key]: [column(classification, 'Type').key], [subjects.key]: [heading.key], [summary.key]: [summary.allColumns[0].key] },
      uris: {},
    }
    let unloaded = { scanned: 'x', lccn: '123', label: '', profile: null, done: false }
    let out = run([row, unloaded], selection, 'rows')
    let subjectLabel = Object.keys(out[0]).filter((n) => { return n.startsWith('Subjects') })[0]
    // three subjects, two class numbers, one summary: three lines, then the one line of the other record
    expect(out.length).toBe(4)
    expect(out.map((line) => { return line['LCCN'] })).toEqual(['2019028142', '2019028142', '2019028142', '123'])
    expect(out.map((line) => { return line[subjectLabel] })).toEqual(['Stories in rhyme', 'Dinosaurs', 'Rocks', ''])
    expect(out.map((line) => { return line['Classification numbers: Type'] })).toEqual(['Library of Congress classification', 'Dewey Decimal classification', '', ''])
    expect(out[0]['Summary'].startsWith('Illustrations and easy-to-read')).toBe(true)
    expect(out.slice(1).map((line) => { return line['Summary'] })).toEqual(['', '', ''])
    // several values in one field of one component stay in its cell
    let content = group('Content type')
    let types = run([row], { record: [], labels: { [content.key]: [content.allColumns[0].key] }, uris: {} }, 'rows')
    expect(types).toEqual([{ 'Content type': 'text; still image' }])
  })

  test('two fields with the same name say which resource they are of', async () => {
    let work = group('Title information', 'Work')
    let instance = group('Title information', 'Instance')
    let columns = buildExportColumns(groups, { record: [], labels: { [work.key]: [column(work, 'Type').key], [instance.key]: [column(instance, 'Type').key] }, uris: {} })
    expect(columns.map((c) => { return c.header })).toEqual(['Title information: Type [Work]', 'Title information: Type [Instance]'])
  })

  test('a record that is not loaded only has its record columns', async () => {
    let summary = group('Summary')
    let out = run([{ scanned: '2019028142', lccn: '2019028142', label: 'Dinosong', profile: null, done: false }], { record: ['scanned', 'isbn', 'instanceUri', 'done'], labels: { [summary.key]: [summary.allColumns[0].key] }, uris: {} })[0]
    expect(out).toEqual({ 'Identifier scanned': '2019028142', 'ISBN': '', 'Instance URI': '', 'Done': 'no', 'Summary': '' })
  })
})

describe('toCsv', () => {
  test('quotes what needs it and doubles the quotes', () => {
    let csv = toCsv([['a', 'b,c', 'say "hi"'], ['line\nbreak', '', ' padded '], [null, undefined, 5]])
    expect(csv).toBe('a,"b,c","say ""hi"""\r\n"line\nbreak",," padded "\r\n,,5\r\n')
  })
})

describe('exportFileName', () => {
  test('the sheet name made safe for a file name, with the day', () => {
    let day = new Date(2026, 10, 18)
    expect(exportFileName('CIP: Verification / week 47 (été)', day)).toBe('CIP-Verification-week-47-ete-2026-11-18.csv')
    expect(exportFileName('', day)).toBe('workflow-2026-11-18.csv')
    expect(exportFileName('???', day)).toBe('workflow-2026-11-18.csv')
  })
})
