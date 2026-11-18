/**
 * Workflows: the records of a sheet as a CSV file.
 *
 * A component that is repeated in the record (two contributors) can go three ways (REPEAT_MODES):
 *   cell    - one line per record, the repeats share the cell, split with REPEAT_SEPARATOR
 *   columns - one line per record, each repeat gets its own set of columns: "Agent (1)", "Agent (2)"
 *   rows    - each repeat goes on a line of its own under the record's first line
 * A field with several values (two content types in the one component) always keeps them in its
 * cell, split with VALUE_SEPARATOR: the columns of a component stay lined up that way. The label
 * and the URI of a linked value are two columns that keep the same positions, so the third label
 * goes with the third URI.
 *
 * Nothing in here modifies a record or touches the page, except downloadCsv.
 */

import { findComponentPts, findRtId, resolveComponentCells, readCellValues, columnHint } from './fields'
import { recordIsbns } from './cip'

export const REPEAT_SEPARATOR = ' | '
export const VALUE_SEPARATOR = '; '

// what to do with a component that is repeated in a record, see the top of the file
export const REPEAT_MODES = ['cell', 'columns', 'rows']

// what a field of a record can hold a URI for: the lookups and the rdf:type picker
const LINKED_FIELD_TYPES = ['SIMPLE', 'COMPLEX', 'RDFTYPE']

/**
* The columns about the record itself (what it goes by, and where it is in the work), the first
* section of the export dialog. `on` is checked the first time the dialog is opened.
*/
export const RECORD_COLUMNS = [
  { key: 'scanned', label: 'Identifier scanned', on: true, hint: 'what was scanned or typed to add the record' },
  { key: 'lccn', label: 'LCCN', on: true },
  { key: 'isbn', label: 'ISBN', on: true, hint: 'the ones not marked canceled' },
  { key: 'title', label: 'Title', on: true },
  { key: 'instanceUri', label: 'Instance URI', on: true },
  { key: 'workUri', label: 'Work URI', on: false },
  { key: 'marvaId', label: 'Marva ID', on: false, hint: 'the e number' },
  { key: 'sourceUrl', label: 'Record URL', on: false, hint: 'where the record was loaded from' },
  { key: 'done', label: 'Done', on: false, hint: 'yes or no' },
  { key: 'posted', label: 'Posted', on: false, hint: 'yes or no' },
]

/**
* Can the field hold a link, so that it has a URI to export next to its label
* @param {object} column - from expandComponentColumns
* @return {boolean}
*/
export function isLinkedColumn(column){
  return !!column && column.kind === 'field' && LINKED_FIELD_TYPES.includes(column.fieldType)
}

/**
* The value of one of the RECORD_COLUMNS for a record
* @param {object} row - the sheet row
* @param {string} key
* @return {string}
*/
export function recordColumnValue(row, key){
  let profile = row.profile
  let rtUri = (rt) => {
    let rtId = profile ? findRtId(profile, rt) : null
    return (rtId && profile.rt[rtId] && profile.rt[rtId].URI) ? profile.rt[rtId].URI : ''
  }
  switch (key){
    case 'scanned': return row.scanned || ''
    case 'lccn': return row.lccn || ''
    case 'isbn': return profile ? recordIsbns(profile).join(VALUE_SEPARATOR) : ''
    case 'title': return row.label || ''
    case 'instanceUri': return rtUri('Instance')
    case 'workUri': return rtUri('Work')
    case 'marvaId': return row.eId || ''
    case 'sourceUrl': return row.sourceUrl || ''
    case 'done': return row.done ? 'yes' : 'no'
    case 'posted': return row.posted ? 'yes' : 'no'
  }
  return ''
}

/**
* Put the repeats of a component into one cell. Empty repeats keep their place (so the columns
* of a component line up with each other: "| 23" is nothing in the first, 23 in the second)
* unless the whole cell is empty.
* @param {string[]} parts - one per repeat of the component
* @return {string}
*/
function joinRepeats(parts){
  if (parts.every((p) => { return p === '' })){ return '' }
  return parts.join(REPEAT_SEPARATOR).trim()
}

/**
* What a record has in the columns of one component, for each time the component is in the record
* @param {object} profile - the record
* @param {object} component - the workflow component {rt, id, propertyURI, label}
* @param {array} columns - the columns of the component to read, from expandComponentColumns
* @param {object} rtLookup - the rtLookup from the profile store
* @param {object} lookupConfig - the lookupConfig from the config store
* @return {array} - one per repeat of the component: column key -> { label, uri }, both strings.
*   The empty repeats at the end are left off, so a component the record has nothing in gives [].
*/
export function readComponentRepeats(profile, component, columns, rtLookup, lookupConfig){
  let repeats = []
  for (let pt of (profile ? findComponentPts(profile, component) : [])){
    let cells = resolveComponentCells(pt, rtLookup, lookupConfig)
    let repeat = {}
    for (let column of columns){
      let cell = cells[column.key]
      if (!cell){
        // the column is a field of another template than the one this repeat is using
        repeat[column.key] = { label: '', uri: '' }
      } else if (cell.kind === 'type'){
        // only when the record says which one it is, not the first of the list a blank one falls back to
        repeat[column.key] = { label: (cell.matched && cell.active) ? (cell.active.resourceLabel || cell.active.id || '') : '', uri: '' }
      } else {
        let values = readCellValues(pt, cell)
        // an unlinked value keeps its place among the URIs, unless none of them is linked
        let uris = values.map((v) => { return clean(v.uri) })
        repeat[column.key] = {
          label: values.map((v) => { return clean(v.label) }).join(VALUE_SEPARATOR),
          uri: uris.every((u) => { return u === '' }) ? '' : uris.join(VALUE_SEPARATOR),
        }
      }
    }
    repeats.push(repeat)
  }
  let isEmpty = (repeat) => { return columns.every((c) => { return repeat[c.key].label === '' && repeat[c.key].uri === '' }) }
  while (repeats.length > 0 && isEmpty(repeats[repeats.length - 1])){ repeats.pop() }
  return repeats
}

function clean(value){
  return (value === null || value === undefined) ? '' : String(value).replace(/\s*[\r\n]+\s*/g, ' ').trim()
}

/**
* The name of a field's column in the file
* @param {object} group - {component, allColumns}
* @param {object} column
* @return {string}
*/
function fieldHeader(group, column){
  if (group.allColumns.length == 1){ return group.component.label }
  let hint = columnHint(group.allColumns, column)
  return group.component.label + ': ' + column.label + (hint ? ' (' + hint + ')' : '')
}

/**
* The columns of the file, in order, for what was picked in the dialog
* @param {array} groups - every component that can be exported, {key, component, allColumns}, in the order to export them
* @param {object} selection - { record: [keys of RECORD_COLUMNS], labels: {groupKey: [column keys]}, uris: {groupKey: [column keys]} }
* @return {array} - of { header, kind: 'record'|'label'|'uri', key | (group, column) }
*/
export function buildExportColumns(groups, selection){
  let columns = []
  for (let rc of RECORD_COLUMNS){
    if ((selection.record || []).includes(rc.key)){
      columns.push({ kind: 'record', key: rc.key, header: rc.label })
    }
  }
  for (let group of groups){
    let labels = (selection.labels || {})[group.key] || []
    let uris = (selection.uris || {})[group.key] || []
    for (let column of group.allColumns){
      let header = fieldHeader(group, column)
      if (labels.includes(column.key)){
        columns.push({ kind: 'label', group: group, column: column, header: header })
      }
      if (uris.includes(column.key) && isLinkedColumn(column)){
        columns.push({ kind: 'uri', group: group, column: column, header: header + ' URI' })
      }
    }
  }

  // two fields of the same name (the Work's and the Instance's): say which is which
  let count = {}
  for (let c of columns){ count[c.header] = (count[c.header] || 0) + 1 }
  for (let c of columns){
    if (count[c.header] > 1 && c.group){ c.header = c.header + ' [' + c.group.component.rt + ']' }
  }
  let seen = {}
  for (let c of columns){
    seen[c.header] = (seen[c.header] || 0) + 1
    if (seen[c.header] > 1){ c.header = c.header + ' ' + seen[c.header] }
  }
  return columns
}

/**
* The table to write: the header line and the lines of the records
* @param {array} rows - the sheet rows to export, a row without a record (still loading, failed) only has its record columns
* @param {array} columns - from buildExportColumns
* @param {object} rtLookup - the rtLookup from the profile store
* @param {object} lookupConfig - the lookupConfig from the config store
* @param {string} repeats - one of REPEAT_MODES, where the repeats of a component go
* @return {array} - of arrays of strings, the first one is the headers
*/
export function buildExportTable(rows, columns, rtLookup, lookupConfig, repeats = 'cell'){
  // the columns wanted of each component, so a component is read once per record
  let wanted = {}
  for (let c of columns){
    if (!c.group){ continue }
    if (!wanted[c.group.key]){ wanted[c.group.key] = { group: c.group, columns: [] } }
    if (!wanted[c.group.key].columns.includes(c.column)){ wanted[c.group.key].columns.push(c.column) }
  }
  // per record: group key -> the repeats of the component
  let read = rows.map((row) => {
    let groups = {}
    for (let key in wanted){
      groups[key] = row.profile ? readComponentRepeats(row.profile, wanted[key].group.component, wanted[key].columns, rtLookup, lookupConfig) : []
    }
    return groups
  })
  // the value of a field column in one repeat of its component
  let valueAt = (groups, c, index) => {
    let repeat = groups[c.group.key][index]
    return repeat ? repeat[c.column.key][c.kind] : ''
  }

  if (repeats === 'columns'){
    // a component gets as many sets of its columns as the record that repeats it the most has
    let sets = {}
    for (let key in wanted){
      sets[key] = Math.max(1, ...read.map((groups) => { return groups[key].length }))
    }
    let expanded = []
    let done = {}
    for (let c of columns){
      if (!c.group){ expanded.push({ column: c, index: 0, header: c.header }); continue }
      if (done[c.group.key]){ continue }
      done[c.group.key] = true
      let mine = columns.filter((o) => { return o.group && o.group.key === c.group.key })
      for (let index = 0; index < sets[c.group.key]; index++){
        for (let m of mine){
          expanded.push({ column: m, index: index, header: m.header + (sets[c.group.key] > 1 ? ' (' + (index + 1) + ')' : '') })
        }
      }
    }
    let table = [expanded.map((e) => { return e.header })]
    rows.forEach((row, r) => {
      table.push(expanded.map((e) => {
        return (e.column.kind === 'record') ? recordColumnValue(row, e.column.key) : valueAt(read[r], e.column, e.index)
      }))
    })
    return table
  }

  let table = [columns.map((c) => { return c.header })]
  rows.forEach((row, r) => {
    if (repeats === 'rows'){
      // the record takes as many lines as its most repeated component, what the record goes by is on each of them
      let lines = Math.max(1, ...Object.keys(wanted).map((key) => { return read[r][key].length }))
      for (let index = 0; index < lines; index++){
        table.push(columns.map((c) => {
          return (c.kind === 'record') ? recordColumnValue(row, c.key) : valueAt(read[r], c, index)
        }))
      }
      return
    }
    table.push(columns.map((c) => {
      if (c.kind === 'record'){ return recordColumnValue(row, c.key) }
      return joinRepeats(read[r][c.group.key].map((repeat) => { return repeat[c.column.key][c.kind] }))
    }))
  })
  return table
}

/**
* A table as the text of a CSV file (RFC 4180: quoted when needed, quotes doubled, CRLF line ends)
* @param {array} table - of arrays of strings
* @return {string}
*/
export function toCsv(table){
  return table.map((line) => {
    return line.map((value) => {
      value = (value === null || value === undefined) ? '' : String(value)
      return /[",\r\n]/.test(value) || /^\s|\s$/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value
    }).join(',')
  }).join('\r\n') + '\r\n'
}

/**
* A file name for the export from the sheet's name: letters and digits kept, the rest to dashes
* @param {string} name - the sheet's name
* @param {Date} date
* @return {string}
*/
export function exportFileName(name, date = new Date()){
  let base = String(name || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  let pad = (n) => { return String(n).padStart(2, '0') }
  let day = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
  return (base || 'workflow') + '-' + day + '.csv'
}

/**
* Hand the file to the browser to save. It starts with a byte order mark so Excel reads it as UTF-8.
* @param {string} csv
* @param {string} fileName
* @return {void}
*/
export function downloadCsv(csv, fileName){
  let blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  let url = URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => { URL.revokeObjectURL(url) }, 1000)
}
