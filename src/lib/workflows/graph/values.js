/**
 * Workflows graph: what flows along a wire, and how values are read off a record and compared.
 *
 * A port carries a list of entries, one per value of the column, each
 *
 *     { uri, label, literal, lang, lines, empty, guid, port }
 *
 * `uri`/`label` for a linked value, `literal`/`lang` for a text value. `lines` says which line
 * of which component the entry came from ({ 'Work|id_..._contributors': 1 }), that is how the
 * entries of different ports are paired up when a node has several inputs (run.js). A line of
 * the component with nothing in the column still gets an entry, with `empty: true`, so that
 * "is empty" can be asked of it and so an action can fill it.
 */

import { findComponentPts, resolveComponentCells, readCellValues } from '../fields'
import { suggestedPtsFor, normalizeLabel, knownLabel } from '../cip'
import { parsePortKey, factKey, RECORD_ORIGIN } from './ports'

/**
* An entry for a value of a cell
*/
function entryFor(value, cell, lines, guid){
  if (cell.fieldType == 'LITERAL'){
    return { uri: null, label: null, literal: value.label, lang: value.lang || null, lines: lines, empty: false, guid: guid }
  }
  return { uri: value.uri || null, label: (value.label && value.label !== value.uri) ? value.label : (knownLabel(value.uri) || value.label || null), literal: null, lang: null, lines: lines, empty: false, guid: guid }
}

/**
* An entry for a constant typed into a node
* @param {string} text
* @return {object}
*/
export function constantEntry(text){
  let t = (text === null || text === undefined) ? '' : String(text)
  if (t.trim() === ''){ return { uri: null, label: null, literal: null, lang: null, lines: {}, empty: true, guid: null } }
  return { uri: null, label: null, literal: t, lang: null, lines: {}, empty: false, guid: null }
}

/**
* An entry for a boolean (a fact port, or the then/else of a condition)
*/
export function booleanEntry(value, lines = {}){
  return { boolean: !!value, lines: lines, empty: false }
}

/**
* Read every port of a record: its own columns and, for each enrichment origin with a record, that
* record's columns the same way
* @param {object} profile - the record
* @param {array} groups - from ports.listSourcePorts
* @param {object} enrichmentRecords - origin -> profile (worldcat -> the converted WorldCat record), null when none
* @param {object} facts - origin -> { factKey: value } (worldcat -> { found: true, format: 'print' })
* @param {object} rtLookup
* @param {object} lookupConfig
* @return {object} - { values: portKey -> [entries], targets: portKey -> [{pt, cell, line}] for the record's own ports }
*/
export function readSourceValues(profile, groups, enrichmentRecords, facts, rtLookup, lookupConfig){
  let values = {}
  let targets = {}
  let cellsCache = new Map()
  let cellsOf = function(pt){
    if (!cellsCache.has(pt)){ cellsCache.set(pt, resolveComponentCells(pt, rtLookup, lookupConfig)) }
    return cellsCache.get(pt)
  }

  for (let group of groups){
    if (group.fact){
      let port = group.ports[0]
      let have = facts && facts[group.origin] ? facts[group.origin][port.key.split('|')[1]] : undefined
      if (port.kind == 'boolean'){
        values[port.key] = [booleanEntry(!!have)]
      } else {
        values[port.key] = (have === undefined || have === null || have === '') ? [] : [constantEntry(String(have))]
      }
      continue
    }

    let record = (group.origin === RECORD_ORIGIN) ? profile : (enrichmentRecords ? enrichmentRecords[group.origin] : null)
    for (let port of group.ports){ values[port.key] = [] }
    if (!record){ continue }

    let pts = (group.origin === RECORD_ORIGIN) ? findComponentPts(record, group.component) : suggestedPtsFor(record, group.component)
    pts.forEach((pt, lineIndex) => {
      let cells = cellsOf(pt)
      let lines = { [group.groupKey]: lineIndex }
      for (let port of group.ports){
        let cell = cells[port.column.key]
        if (group.origin === RECORD_ORIGIN){
          if (!targets[port.key]){ targets[port.key] = [] }
          targets[port.key].push({ pt: pt, cell: cell || null, line: lineIndex })
        }
        if (!cell || cell.kind != 'field'){
          values[port.key].push({ uri: null, label: null, literal: null, lang: null, lines: lines, empty: true, guid: null, port: port.key, pt: pt, cell: cell || null })
          continue
        }
        let read = readCellValues(pt, cell)
        if (read.length == 0){
          values[port.key].push({ uri: null, label: null, literal: null, lang: null, lines: lines, empty: true, guid: null, port: port.key, pt: pt, cell: cell })
        } else {
          for (let v of read){
            let entry = entryFor(v, cell, lines, v.guid || null)
            entry.port = port.key
            entry.pt = pt
            entry.cell = cell
            values[port.key].push(entry)
          }
        }
      }
    })
  }
  return { values: values, targets: targets }
}

/**
* The text of an entry, what a person would read in the cell
* @param {object} entry
* @return {string}
*/
export function entryText(entry){
  if (!entry || entry.empty){ return '' }
  if (typeof entry.boolean === 'boolean'){ return entry.boolean ? 'true' : 'false' }
  return entry.literal !== null && entry.literal !== undefined ? String(entry.literal) : (entry.label || entry.uri || '')
}

/**
* Is the entry true, for a `when` input: a boolean entry is its value, a value entry is true when it is not empty
*/
export function entryTruth(entry){
  if (!entry){ return false }
  if (typeof entry.boolean === 'boolean'){ return entry.boolean }
  return !entry.empty
}

function normalizeUri(uri){
  return String(uri || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

/**
* The first four digit run in a text, as a number: "2010", "[2010]", "2010-2012", "c2010" all give 2010
* @param {string} text
* @return {number|null}
*/
export function parseYear(text){
  let m = String(text || '').match(/(?<!\d)(\d{4})(?!\d)/)
  return m ? parseInt(m[1], 10) : null
}

/**
* The number in a text, the year when asked for, otherwise the first number in it
*/
export function parseNumber(text, year){
  if (year){ return parseYear(text) }
  let m = String(text || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

/**
* Are two entries the same value. A linked value matches another on the URI, or on the label
* (one side may only have the URI, its label is looked for in the label cache), unless `mode`
* says to use one of them only. Text values match as normalized text.
* @param {object} a
* @param {object} b
* @param {string} mode - 'either' | 'uri' | 'label'
* @return {boolean}
*/
export function sameValue(a, b, mode = 'either'){
  if (!a || !b || a.empty || b.empty){ return false }
  let aUri = normalizeUri(a.uri), bUri = normalizeUri(b.uri)
  if (mode !== 'label' && aUri && bUri){ return aUri === bUri }
  if (mode === 'uri'){
    // one side has no URI: a text that is the URI counts
    return (aUri && aUri === normalizeUri(b.literal)) || (bUri && bUri === normalizeUri(a.literal)) || false
  }
  let aText = normalizeLabel(a.label || a.literal || (a.uri ? knownLabel(a.uri) : '') || '')
  let bText = normalizeLabel(b.label || b.literal || (b.uri ? knownLabel(b.uri) : '') || '')
  if (!aText || !bText){ return false }
  if (aText === bText){ return true }
  // a typed URI against a linked value
  if (mode === 'either'){
    if (aUri && aUri === normalizeUri(b.literal)){ return true }
    if (bUri && bUri === normalizeUri(a.literal)){ return true }
  }
  return false
}

export const OPERATORS = [
  { id: 'empty', label: 'is empty', needsB: false },
  { id: 'notEmpty', label: 'is not empty', needsB: false },
  { id: 'equals', label: 'equals', needsB: true },
  { id: 'notEquals', label: 'does not equal', needsB: true },
  { id: 'contains', label: 'contains', needsB: true },
  { id: 'startsWith', label: 'starts with', needsB: true },
  { id: 'regex', label: 'matches regex', needsB: true },
  { id: 'lt', label: 'number <', needsB: true },
  { id: 'lte', label: 'number <=', needsB: true },
  { id: 'gt', label: 'number >', needsB: true },
  { id: 'gte', label: 'number >=', needsB: true },
]

/**
* Compare an entry with another (or a constant) the way an if-then node does
* @param {string} op - an OPERATORS id
* @param {object|null} a
* @param {object|null} b
* @param {object} options - { compare: 'either'|'uri'|'label', parseYear: boolean }
* @return {boolean}
*/
export function compareEntries(op, a, b, options = {}){
  let aEmpty = !a || a.empty
  switch (op){
    case 'empty': return aEmpty
    case 'notEmpty': return !aEmpty
    case 'equals': return sameValue(a, b, options.compare || 'either')
    case 'notEquals': return !aEmpty && !sameValue(a, b, options.compare || 'either')
    case 'contains': {
      if (aEmpty || !b || b.empty){ return false }
      return normalizeLabel(entryText(a)).includes(normalizeLabel(entryText(b)))
    }
    case 'startsWith': {
      if (aEmpty || !b || b.empty){ return false }
      return normalizeLabel(entryText(a)).startsWith(normalizeLabel(entryText(b)))
    }
    case 'regex': {
      if (aEmpty || !b || b.empty){ return false }
      try {
        return new RegExp(entryText(b), 'i').test(entryText(a))
      } catch (e) {
        return false
      }
    }
    case 'lt': case 'lte': case 'gt': case 'gte': {
      if (aEmpty || !b || b.empty){ return false }
      let x = parseNumber(entryText(a), options.parseYear)
      let y = parseNumber(entryText(b), options.parseYear)
      if (x === null || y === null){ return false }
      if (op == 'lt'){ return x < y }
      if (op == 'lte'){ return x <= y }
      if (op == 'gt'){ return x > y }
      return x >= y
    }
    default: return false
  }
}

/**
* Which port a key reads from the record, for an action's target
*/
export function isRecordPort(key){
  let parsed = parsePortKey(key)
  return !!(parsed && parsed.origin === RECORD_ORIGIN && parsed.columnKey)
}

export { factKey }
