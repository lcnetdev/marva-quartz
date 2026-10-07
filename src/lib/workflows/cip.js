/**
 * Workflows: the CIP enrichment.
 *
 * A CIP (cataloging in publication) record is made before the book exists, from what the
 * publisher sent in. When the book arrives the record has to be verified and completed
 * against it (the RDA CIP VER checklist). The `cip-lookup` service (marva-backend) finds the
 * WorldCat record for the book from its inventory barcode or ISBN and returns it converted to
 * BIBFRAME. Here that converted record is parsed with the same parser the sheet's records use,
 * so both are Marva records built on the same profile, and the two are compared component by
 * component, cell by cell:
 *
 *   - the record already has the value WorldCat has -> the cell is marked verified (green)
 *   - the record is missing a value WorldCat has    -> the cell offers it, a click adds it
 *   - the values differ                              -> the cell shows WorldCat's, a click replaces
 *   - WorldCat has a whole component the record lacks (another contributor, a note) -> a ghost
 *     line under the record's lines offers it, a click adds the component
 *
 * Nothing is changed without a click. Accepting copies the parsed value (the piece of the
 * userValue the cell's propertyPath leads to, or the whole component) into the record, which
 * is the same shape the parser gives a loaded record.
 *
 * Request: GET {util}cip-lookup?barcode=|isbn=[&lccn=]&full=true  (see cip-lookup/README.md)
 */

import short from 'short-uuid'
import { readCellValues, findComponentPts, findRtId, ADMIN_METADATA_URI } from './fields'

export const CIP_ENRICHMENT_ID = 'cip-lookup'

const ONT = 'http://id.loc.gov/ontologies/bibframe/'
const VOC = 'http://id.loc.gov/vocabulary/'

const ISBN_URI_END = 'Isbn'
const IDENTIFIED_BY = 'http://id.loc.gov/ontologies/bibframe/identifiedBy'
const RDF_VALUE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'
const STATUS = 'http://id.loc.gov/ontologies/bibframe/status'

// ---------------------------------------------------------------- what to ask the service

function digits(value){
  return String(value || '').replace(/[\s-]/g, '')
}

export function looksLikeIsbn(value){
  let v = digits(value)
  return /^(97[89])?\d{9}[\dXx]$/.test(v)
}

/**
* The ISBNs of the record that are not marked canceled/invalid
* @param {object} profile - the record
* @return {array} - of strings
*/
export function recordIsbns(profile){
  let isbns = []
  let rtId = findRtId(profile, 'Instance')
  if (!rtId){ return isbns }
  for (let ptId of profile.rt[rtId].ptOrder){
    let pt = profile.rt[rtId].pt[ptId]
    if (!pt || pt.propertyURI !== IDENTIFIED_BY || !pt.userValue || !Array.isArray(pt.userValue[IDENTIFIED_BY])){ continue }
    for (let node of pt.userValue[IDENTIFIED_BY]){
      if (!node || !node['@type'] || !node['@type'].endsWith(ISBN_URI_END)){ continue }
      if (node[STATUS] && node[STATUS].length > 0){ continue }
      for (let v of (node[RDF_VALUE] || [])){
        let value = digits(v[RDF_VALUE])
        if (looksLikeIsbn(value)){ isbns.push(value) }
      }
    }
  }
  return isbns
}

/**
* Work out what to send the service for a row: the barcode that was scanned, or the ISBN
* @param {object} row - the sheet row (scanned, lccn, profile)
* @return {object|null} - {barcode} or {isbn, lccn}, null when there is nothing to look up with
*/
export function cipQuery(row){
  let scanned = (row.scanned || '').trim()
  let isUrl = /^(https?:)?\//.test(scanned)
  let isLccn = row.lccn && digits(scanned).toLowerCase() === digits(row.lccn).toLowerCase()
  if (!isUrl && !isLccn && scanned){
    if (looksLikeIsbn(scanned)){
      return { isbn: digits(scanned), lccn: row.lccn || null }
    }
    // not an ISBN or the LCCN, so it was the inventory barcode
    if (/^[0-9A-Za-z-]{6,}$/.test(scanned)){
      return { barcode: scanned }
    }
  }
  let isbns = row.profile ? recordIsbns(row.profile) : []
  if (isbns.length > 0){
    return { isbn: isbns[0], lccn: row.lccn || null }
  }
  return null
}

/**
* Call the service through util-service
* @param {object} query - from cipQuery
* @param {string} utilUrl - configStore.returnUrls.util
* @return {object} - the JSON response, with .status set ('ok', 'no_oclc_record', ...)
*/
export async function fetchCipLookup(query, utilUrl){
  let params = new URLSearchParams()
  if (query.barcode){
    params.set('barcode', query.barcode)
  } else {
    params.set('isbn', query.isbn)
    if (query.lccn){ params.set('lccn', query.lccn) }
  }
  params.set('full', 'true')
  let headers = { 'Accept': 'application/json' }
  let token = window.localStorage.getItem('marva_jwt')
  if (token){ headers['Authorization'] = 'Bearer ' + token }
  let response = await fetch(utilUrl + 'cip-lookup?' + params.toString(), { headers: headers })
  let body = null
  try {
    body = await response.json()
  } catch (e) {
    throw new Error('The CIP lookup service did not answer with JSON (' + response.status + ')')
  }
  if (!body || typeof body !== 'object'){ throw new Error('Empty answer from the CIP lookup service') }
  if (!body.status){ body.status = response.ok ? 'ok' : 'error' }
  return body
}

/**
* The bits of the response worth keeping once the record has been parsed out of it
*/
export function summarizeCip(data){
  let best = (data.oclc && data.oclc.best) ? data.oclc.best : {}
  return {
    oclcNumber: best.oclcNumber || (data.bibframe ? data.bibframe.oclcNumber : null),
    lccnConfirmed: !!best.lccnConfirmed,
    encodingLevel: best.encodingLevel || null,
    otherCandidates: (data.oclc && data.oclc.otherCandidates) ? data.oclc.otherCandidates.length : 0,
    conflicts: (data.oclc && data.oclc.conflicts) ? data.oclc.conflicts : {},
    messages: data.messages || [],
    query: data.query || {},
    rows: (data.bibframe && data.bibframe.checklist) ? data.bibframe.checklist.map((r) => { return r.row }) : [],
  }
}

// ---------------------------------------------------------------- scrubbing WorldCat's record

// LC never uses OCLC / WorldCat identifiers or URIs. Anything the converted record links to there
// is taken off before it is compared or offered: names come through as plain (unlinked) labels to
// be linked to NAF in the usual way, OCLC numbers are not offered at all.
const FOREIGN_URI = /^https?:\/\/([^/]*\.)?(id\.oclc\.org|worldcat\.org|oclc\.org|example\.org)\//i
const OCLC_IDENTIFIER_TYPES = /OclcNumber$/
const SOURCE = 'http://id.loc.gov/ontologies/bibframe/source'
const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'
const MARC_KEY = 'http://id.loc.gov/ontologies/bflc/marcKey'

export function isForeignUri(uri){
  return FOREIGN_URI.test(String(uri || ''))
}

function isOclcIdentifier(node){
  if (!node || typeof node !== 'object'){ return false }
  if (node['@type'] && OCLC_IDENTIFIER_TYPES.test(node['@type'])){ return true }
  // a Local identifier whose source is OCoLC
  for (let src of (node[SOURCE] || [])){
    for (let l of (src[LABEL] || [])){
      if (/OCoLC/i.test(l[LABEL] || '')){ return true }
    }
    if (/OCoLC/i.test(src[LABEL] || '') || isForeignUri(src['@id'])){ return true }
  }
  return false
}

// the converter turns the 010 / 776 $w links back to the LC record into relations that would say
// the record is the equivalent (or the instance) of itself
const RELATION = ONT + 'relation'
const RELATIONSHIP = ONT + 'relationship'
const ASSOCIATED_RESOURCE = ONT + 'associatedResource'
const SELF_RELATIONSHIPS = /bibframe\/(hasEquivalent|instanceOf|hasInstance|equivalent)$/i

function isSelfRelation(node, selfUris){
  if (!node || typeof node !== 'object'){ return false }
  for (let rel of (node[RELATIONSHIP] || [])){
    if (rel && rel['@id'] && SELF_RELATIONSHIPS.test(rel['@id'])){ return true }
  }
  for (let res of (node[ASSOCIATED_RESOURCE] || [])){
    if (res && res['@id'] && selfUris.some((u) => { return normalizeUri(u) === normalizeUri(res['@id']) })){ return true }
  }
  return false
}

/**
* The URIs a record goes by (its work and instance)
*/
export function recordUris(profile){
  let uris = []
  for (let rt of profile.rtOrder){
    if (profile.rt[rt] && profile.rt[rt].URI){ uris.push(profile.rt[rt].URI) }
  }
  return uris
}

/**
* Take the OCLC / WorldCat links and identifiers out of a parsed record, in place
* @param {object} profile - the parsed WorldCat record
* @param {array} selfUris - the URIs of the record being verified, relations pointing at them go too
* @return {object} - the same profile
*/
export function scrubForeignData(profile, selfUris = []){
  let scrubNode = function(node){
    if (Array.isArray(node)){
      // drop OCLC identifier blank nodes wherever they are (identifiedBy on the instance, on related works...)
      for (let i = node.length - 1; i >= 0; i--){
        if (isOclcIdentifier(node[i])){ node.splice(i, 1) } else { scrubNode(node[i]) }
      }
      return
    }
    if (!node || typeof node !== 'object'){ return }
    if (node['@id'] && isForeignUri(node['@id'])){ delete node['@id'] }
    for (let k in node){
      if (typeof node[k] === 'string'){
        if (k === MARC_KEY){
          // "1001 $aGlück, Robert,$d1947-$eauthor.$1https://id.oclc.org/..." -> without the $1
          node[k] = stripForeignSubfields(node[k])
        } else if (k !== '@type' && isForeignUri(node[k])){
          node[k] = ''
        }
        continue
      }
      scrubNode(node[k])
    }
  }
  for (let rtId of profile.rtOrder){
    let rt = profile.rt[rtId]
    for (let ptId of rt.ptOrder.slice()){
      let pt = rt.pt[ptId]
      if (!pt || !pt.userValue){ continue }
      // relations that say "equivalent to / instance of itself"
      if (pt.propertyURI === RELATION && Array.isArray(pt.userValue[RELATION])){
        pt.userValue[RELATION] = pt.userValue[RELATION].filter((n) => { return !isSelfRelation(n, selfUris) })
        if (pt.userValue[RELATION].length == 0){ delete pt.userValue[RELATION] }
      }
      scrubNode(pt.userValue)
      dropRdaRegistryDuplicates(pt)
      // the parser's copy of the component's source XML, not needed for comparing and full of the above
      delete pt.xmlSource
      // an identifier component that only held an OCLC number, or a relation to itself, is now empty: take it out
      if ((pt.propertyURI === IDENTIFIED_BY || pt.propertyURI === RELATION) && componentIsEmpty(pt)){
        rt.ptOrder = rt.ptOrder.filter((id) => { return id !== ptId })
        delete rt.pt[ptId]
      }
    }
  }
  return profile
}

// marc2bibframe2 says the same thing twice for illustrative content (and the 33X types): once as
// the id.loc.gov vocabulary term from the fixed field and once as the RDA registry term from the
// 340/336-338 $b/$2. LC uses the id.loc.gov vocabularies, the RDA registry copies go.
const RDA_REGISTRY = /^https?:\/\/rdaregistry\.info\//i
function dropRdaRegistryDuplicates(pt){
  let values = pt.userValue[pt.propertyURI]
  if (!Array.isArray(values)){ return }
  let hasLoc = values.some((v) => { return v && v['@id'] && /id\.loc\.gov\/vocabulary\//.test(v['@id']) })
  if (!hasLoc){ return }
  pt.userValue[pt.propertyURI] = values.filter((v) => { return !(v && v['@id'] && RDA_REGISTRY.test(v['@id'])) })
}

function stripForeignSubfields(marcKey){
  if (typeof marcKey !== 'string'){ return marcKey }
  // $0 / $1 subfields that point at OCLC / WorldCat
  return marcKey.replace(/\$[01]https?:\/\/[^$]*?(id\.oclc\.org|worldcat\.org)[^$]*/gi, '').trim()
}

// ---------------------------------------------------------------- comparing

/**
* Labels are compared loosely: case, punctuation and spacing don't count
*/
export function normalizeLabel(label){
  return String(label || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function normalizeUri(uri){
  return String(uri || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

/**
* The things a value can be recognised by: its URI and its label (when the label is not just the
* URI shown for want of a label). The converted WorldCat record often has a bare URI where the
* record has a URI and a label, or a bare label where the record has both, so either counts.
*/
function valueKeys(value){
  let keys = []
  if (value.uri){ keys.push('uri:' + normalizeUri(value.uri)) }
  if (value.label && value.label !== value.uri){
    let label = normalizeLabel(value.label)
    if (label){ keys.push('label:' + label) }
  }
  return keys
}

function valuesMatch(a, b){
  let kb = valueKeys(b)
  return valueKeys(a).some((k) => { return kb.includes(k) })
}

function hasValue(values){
  return values.some((v) => { return valueKeys(v).length > 0 })
}

function sameValues(a, b){
  a = a.filter((v) => { return valueKeys(v).length > 0 })
  b = b.filter((v) => { return valueKeys(v).length > 0 })
  if (a.length !== b.length){ return false }
  return a.every((va) => { return b.some((vb) => { return valuesMatch(va, vb) }) })
}

function overlap(a, b){
  return a.filter((va) => { return b.some((vb) => { return valuesMatch(va, vb) }) }).length
}

/**
* The values of every column of a line
* @return {object} - column key -> [{label, uri, ...}]
*/
export function lineValues(columns, line){
  let values = {}
  for (let column of columns){
    let cell = line.cells[column.key]
    if (!cell){ continue }
    if (column.kind === 'type'){
      values[column.key] = (cell.matched && cell.active) ? [{ label: cell.active.resourceLabel, uri: null }] : []
    } else {
      values[column.key] = readCellValues(line.pt, cell)
    }
  }
  return values
}

function isEmptyLine(values){
  return Object.values(values).every((v) => { return !hasValue(v) })
}

/**
* The component instances of the suggested record that go with a component of the sheet. Admin
* metadata is special: the sheet shows the Instance's primary one, the converted record's useful
* one may sit on the Work, so the one with the most data is used whichever resource it is on.
*/
export function suggestedPtsFor(suggested, component){
  if (component.propertyURI !== ADMIN_METADATA_URI){
    return findComponentPts(suggested, component)
  }
  let candidates = []
  for (let rt of ['Instance', 'Work']){
    candidates = candidates.concat(findComponentPts(suggested, Object.assign({}, component, { rt: rt })))
    // findComponentPts narrows admin metadata to the primary one, look at all of them here
    let rtId = findRtId(suggested, rt)
    if (rtId){
      for (let ptId of suggested.rt[rtId].ptOrder){
        let pt = suggested.rt[rtId].pt[ptId]
        if (pt && pt.propertyURI === ADMIN_METADATA_URI && !candidates.includes(pt)){ candidates.push(pt) }
      }
    }
  }
  if (candidates.length == 0){ return [] }
  candidates.sort((a, b) => { return JSON.stringify(b.userValue).length - JSON.stringify(a.userValue).length })
  return [candidates[0]]
}

/**
* Line up the record's lines of a component with the suggested record's and compare each cell
*
* @param {string} groupKey
* @param {array} columns - the group's columns
* @param {array} recordLines - [{pt, cells}] of the record
* @param {array} suggestedLines - [{pt, cells}] of the suggested record
* @param {array} dismissed - suggestion keys the user has waved away
* @return {object} - { suggestions: [per record line: null | {pt, cells: {colKey: {status, values, key}}, verified, open, wholeLine, key, values}],
*                      ghosts: [{pt, cells, values, key}] }
*   wholeLine is set when the record line is blank: the suggested line is offered as one thing
*/
export function compareComponent(groupKey, columns, recordLines, suggestedLines, dismissed = []){
  let recordValues = recordLines.map((l) => { return lineValues(columns, l) })
  let suggestedValues = suggestedLines.map((l) => { return lineValues(columns, l) })
  let dataColumns = columns.filter((c) => { return c.kind !== 'type' })

  // pair them up, the best matches first
  let pairs = []
  for (let r = 0; r < recordLines.length; r++){
    for (let s = 0; s < suggestedLines.length; s++){
      let score = 0
      for (let c of dataColumns){
        score += overlap(recordValues[r][c.key] || [], suggestedValues[s][c.key] || [])
      }
      if (score > 0){ pairs.push({ r: r, s: s, score: score }) }
    }
  }
  pairs.sort((a, b) => { return b.score - a.score || a.r - b.r || a.s - b.s })
  let matchOf = new Array(recordLines.length).fill(null)
  let taken = new Array(suggestedLines.length).fill(false)
  for (let p of pairs){
    if (matchOf[p.r] === null && !taken[p.s]){
      matchOf[p.r] = p.s
      taken[p.s] = true
    }
  }
  // a record line with nothing in it takes the next unmatched suggestion, so a blank component
  // gets filled in rather than a ghost line added under it. The same for a component that can
  // not be repeated, there its values are what differs.
  for (let r = 0; r < recordLines.length; r++){
    if (matchOf[r] !== null){ continue }
    let repeatable = recordLines[r].pt && recordLines[r].pt.repeatable !== false
    if (!isEmptyLine(recordValues[r]) && repeatable){ continue }
    let s = taken.indexOf(false)
    if (s >= 0){
      matchOf[r] = s
      taken[s] = true
    }
  }
  // one line each and they don't agree ("pages cm." against "xx, 161 pages", ©1985 against ©2025):
  // that is the record's value being out of date, offered as a replacement not as a second line
  if (recordLines.length == 1 && suggestedLines.length == 1 && matchOf[0] === null && !taken[0]){
    matchOf[0] = 0
    taken[0] = true
  }

  let suggestions = recordLines.map((line, r) => {
    let s = matchOf[r]
    if (s === null){ return null }
    let cells = {}
    let verified = 0
    let open = 0
    for (let column of columns){
      let have = recordValues[r][column.key] || []
      let want = suggestedValues[s][column.key] || []
      if (!hasValue(want)){ continue }
      let key = groupKey + '|' + line.pt['@guid'] + '|' + column.key
      let status
      if (sameValues(have, want)){
        status = 'match'
        verified++
      } else if (!hasValue(have)){
        status = 'add'
      } else {
        status = 'differs'
      }
      if (status !== 'match' && (column.kind === 'type' || dismissed.includes(key))){
        // types are not offered on their own, they come with the line
        continue
      }
      if (status !== 'match'){ open++ }
      cells[column.key] = { status: status, values: want, key: key }
    }
    // a record line with nothing in it takes the suggested line as a whole, with one click
    let wholeLine = isEmptyLine(recordValues[r]) && open > 0
    let lineKey = groupKey + '|' + line.pt['@guid'] + '|line'
    if (wholeLine && dismissed.includes(lineKey)){
      return null
    }
    return { pt: suggestedLines[s].pt, cells: cells, verified: verified, open: wholeLine ? 1 : open, wholeLine: wholeLine, key: lineKey, values: suggestedValues[s] }
  })

  let ghosts = []
  suggestedLines.forEach((line, s) => {
    if (taken[s] || isEmptyLine(suggestedValues[s])){ return }
    let key = groupKey + '|ghost|' + line.pt['@guid']
    if (dismissed.includes(key)){ return }
    ghosts.push({ pt: line.pt, cells: line.cells, values: suggestedValues[s], key: key })
  })

  return { suggestions: suggestions, ghosts: ghosts }
}

// ---------------------------------------------------------------- the call number year check

const PROVISION_ACTIVITY = 'http://id.loc.gov/ontologies/bibframe/provisionActivity'
const COPYRIGHT_DATE = 'http://id.loc.gov/ontologies/bibframe/copyrightDate'
const DATE = 'http://id.loc.gov/ontologies/bibframe/date'
const SIMPLE_DATE = 'http://id.loc.gov/ontologies/bflc/simpleDate'
const ITEM_PORTION = 'http://id.loc.gov/ontologies/bibframe/itemPortion'
const LCC_TYPE = 'http://id.loc.gov/ontologies/bibframe/ClassificationLcc'

function firstYear(text){
  let m = String(text || '').match(/(1[5-9]\d\d|20\d\d)/)
  return m ? m[1] : null
}

/**
* The year the record says the book was published: the date of the publication provision
* activity, failing that the copyright date
* @param {object} profile - a record
* @return {object|null} - { year, from: 'publication'|'copyright' }
*/
export function publicationYear(profile){
  for (let rt of profile.rtOrder){
    for (let ptId of profile.rt[rt].ptOrder){
      let pt = profile.rt[rt].pt[ptId]
      if (!pt || pt.propertyURI !== PROVISION_ACTIVITY || !pt.userValue){ continue }
      for (let node of (pt.userValue[PROVISION_ACTIVITY] || [])){
        if (node['@type'] && !/Publication$/.test(node['@type'])){ continue }
        for (let key of [DATE, SIMPLE_DATE]){
          for (let d of (node[key] || [])){
            let year = firstYear(d[key])
            if (year){ return { year: year, from: 'publication' } }
          }
        }
      }
    }
  }
  for (let rt of profile.rtOrder){
    for (let ptId of profile.rt[rt].ptOrder){
      let pt = profile.rt[rt].pt[ptId]
      if (!pt || pt.propertyURI !== COPYRIGHT_DATE || !pt.userValue){ continue }
      for (let d of (pt.userValue[COPYRIGHT_DATE] || [])){
        let year = firstYear(d[COPYRIGHT_DATE])
        if (year){ return { year: year, from: 'copyright' } }
      }
    }
  }
  return null
}

/**
* The year an LC call number's item portion ends in ("J33 2025" -> 2025)
*/
export function callNumberYear(itemPortion){
  let m = String(itemPortion || '').trim().match(/(1[5-9]\d\d|20\d\d)[a-z]?$/i)
  return m ? m[1] : null
}

/**
* Checklist row 050: the year in the call number has to be the publication year. Looks at the
* record's LC classification lines and marks the item portion cell verified, or offers it with the
* year corrected (as a literal to set, not something copied from WorldCat).
*
* @param {string} groupKey
* @param {array} columns - the classification group's columns
* @param {array} recordLines - [{pt, cells, suggestion}] of the record, suggestion gets added to
* @param {string} year - the publication year to check against
* @param {string} yearSource - where the year came from, for the note
* @param {array} dismissed
*/
export function checkCallNumberYears(groupKey, columns, recordLines, year, yearSource, dismissed = []){
  let itemColumn = columns.filter((c) => { return c.key.endsWith(ITEM_PORTION) })[0]
  if (!itemColumn || !year){ return }
  for (let line of recordLines){
    if (line.ghost || !line.pt){ continue }
    let cell = line.cells[itemColumn.key]
    if (!cell){ continue }
    // only LC call numbers carry a year
    let node = (line.pt.userValue[line.pt.propertyURI] || [])[0]
    if (!node || node['@type'] !== LCC_TYPE){ continue }
    let values = readCellValues(line.pt, cell)
    if (values.length == 0){ continue }
    let current = values[0].label
    let found = callNumberYear(current)
    if (!found){ continue }
    let key = groupKey + '|' + line.pt['@guid'] + '|' + itemColumn.key + '|year'
    if (!line.suggestion){ line.suggestion = { pt: null, cells: {}, verified: 0, open: 0, wholeLine: false, key: null, values: {} } }
    if (found === year){
      line.suggestion.cells[itemColumn.key] = { status: 'match', values: values, key: key, check: 'year', note: 'Call number year ' + year + ' matches the ' + yearSource + ' date' }
      line.suggestion.verified++
    } else if (!dismissed.includes(key)){
      let corrected = current.replace(new RegExp(found + '([a-z]?)$', 'i'), year + '$1')
      line.suggestion.cells[itemColumn.key] = {
        status: 'differs', values: [{ label: corrected, uri: null }], key: key, check: 'year',
        literal: corrected, valueGuid: values[0].guid,
        note: 'The ' + yearSource + ' date is ' + year + ', the call number says ' + found,
      }
      line.suggestion.open++
    }
  }
}

// ---------------------------------------------------------------- the checklist's fixed expectations

// The checklist rows that say what a field has to be, whatever WorldCat has. Each rule names the
// component (propertyURI) and column (the end of its key) it applies to and what the checklist
// expects there. `mode`:
//   replace  - the one value there has to be the expected one (Ldr/17 full, 040 $b eng)
//   include  - the expected value has to be among the values (040 $e rda, Ldr/18 isbd, 042 pcc)
//   warn     - the value is expected but a different one is a cataloger's call, so only point it out (336-338)
//   remove   - the field must be empty (263)
//   wording  - a literal must not use these abbreviations (300)
export const CHECKLIST_RULES = [
  { id: 'Ldr/17', component: ADMIN_METADATA_URI, column: /bflc\/encodingLevel$/, mode: 'replace',
    expect: [{ uri: VOC + 'menclvl/f', label: 'full' }], note: 'Ldr/17: the encoding level has to be full' },
  { id: 'Ldr/18', component: ADMIN_METADATA_URI, column: /descriptionConventions$/, mode: 'include',
    expect: [{ uri: VOC + 'descriptionConventions/isbd', label: 'ISBD: International standard bibliographic description' }], note: 'Ldr/18: ISBD has to be among the description conventions' },
  { id: '040 $e', component: ADMIN_METADATA_URI, column: /descriptionConventions$/, mode: 'include',
    expect: [{ uri: VOC + 'descriptionConventions/rda', label: 'Resource description and access' }], note: '040 $e: RDA has to be among the description conventions' },
  { id: '040 $b', component: ADMIN_METADATA_URI, column: /descriptionLanguage$/, mode: 'replace',
    expect: [{ uri: VOC + 'languages/eng', label: 'English' }], note: '040 $b: the language of cataloging has to be English' },
  { id: '042', component: ADMIN_METADATA_URI, column: /descriptionAuthentication$/, mode: 'include',
    expect: [{ uri: VOC + 'marcauthen/pcc', label: 'Program for Cooperative Cataloging' }], note: '042: pcc has to be among the authentication codes' },
  { id: '336', component: ONT + 'content', column: /./, mode: 'warn',
    expect: [{ uri: VOC + 'contentTypes/txt', label: 'text' }], note: '336: expected text, confer with a cataloger' },
  { id: '337', component: ONT + 'media', column: /./, mode: 'warn',
    expect: [{ uri: VOC + 'mediaTypes/n', label: 'unmediated' }], note: '337: expected unmediated, confer with a cataloger' },
  { id: '338', component: ONT + 'carrier', column: /./, mode: 'warn',
    expect: [{ uri: VOC + 'carriers/nc', label: 'volume' }], note: '338: expected volume, confer with a cataloger' },
  { id: '263', component: 'http://id.loc.gov/ontologies/bflc/projectedProvisionDate', column: /./, mode: 'remove',
    note: '263: delete, the book is in hand' },
  { id: '300', component: ONT + 'extent', column: /./, mode: 'wording', note: '300: do not abbreviate' },
  { id: '300 $c', component: ONT + 'dimensions', column: /./, mode: 'wording', note: '300: do not abbreviate, no period after cm unless there is a series statement' },
]

// abbreviations the checklist says not to use in the physical description
const ABBREVIATIONS = [
  [/\bp\.(?=\s|$|,|;|:)/g, 'pages'],
  [/\bv\.(?=\s|$|,|;|:)/g, 'volumes'],
  [/\bill\.(?=\s|$|,|;|:)/g, 'illustrations'],
  [/\billus\.(?=\s|$|,|;|:)/g, 'illustrations'],
  [/\bcol\.(?=\s|$|,|;|:)/g, 'color'],
  [/\bports?\.(?=\s|$|,|;|:)/g, 'portraits'],
  [/\bfacsims?\.(?=\s|$|,|;|:)/g, 'facsimiles'],
  [/\bunp\.(?=\s|$|,|;|:)/g, 'unpaged'],
]

/**
* Spell out the abbreviations in a 300 value, and drop the period after cm unless a series follows
*/
export function fixPhysicalDescriptionWording(text, hasSeries){
  let fixed = String(text)
  for (let [re, word] of ABBREVIATIONS){ fixed = fixed.replace(re, word) }
  if (!hasSeries){ fixed = fixed.replace(/\bcm\.\s*$/, 'cm') }
  return fixed
}

function valueIs(value, expected){
  if (value.uri && normalizeUri(value.uri) === normalizeUri(expected.uri)){ return true }
  return normalizeLabel(value.label) === normalizeLabel(expected.label)
}

/**
* Apply the checklist's fixed expectations to the record's lines of a component, adding to the
* lines' `suggestion` cells (these win over a WorldCat comparison of the same cell, the checklist
* is the authority). What accepting does is on the cell: `simple` sets a lookup value (replacing
* `replaceGuid` / beside `siblingGuid`), `literal` sets text, status `remove` clears the cell,
* status `warn` has nothing to accept.
*
* @param {string} groupKey
* @param {object} group - the column group
* @param {array} recordLines - [{pt, cells, suggestion}]
* @param {object} context - { hasSeries }
* @param {array} dismissed
*/
export function applyChecklistRules(groupKey, group, recordLines, context, dismissed = []){
  let rules = CHECKLIST_RULES.filter((r) => { return r.component === group.component.propertyURI })
  if (rules.length == 0){ return }
  for (let line of recordLines){
    if (line.ghost || !line.pt){ continue }
    for (let rule of rules){
      for (let column of group.columns){
        if (column.kind === 'type' || !rule.column.test(column.key)){ continue }
        let cell = line.cells[column.key]
        if (!cell){ continue }
        let values = readCellValues(line.pt, cell)
        let key = groupKey + '|' + line.pt['@guid'] + '|' + column.key + '|' + rule.id
        let result = null

        if (rule.mode === 'replace' || rule.mode === 'include' || rule.mode === 'warn'){
          let expected = rule.expect[0]
          let present = values.some((v) => { return valueIs(v, expected) })
          if (present){
            // leave a stronger finding on the cell alone
            if (!line.suggestion || !line.suggestion.cells[column.key] || line.suggestion.cells[column.key].status === 'match'){
              result = { status: 'match', values: values, note: rule.id + ': ' + expected.label + ' as the checklist expects' }
            }
          } else if (rule.mode === 'warn'){
            if (values.length > 0){
              result = { status: 'warn', values: values, note: rule.note }
            }
          } else if (values.length == 0 || rule.mode === 'include'){
            result = { status: 'add', values: [{ label: expected.label, uri: expected.uri }], note: rule.note,
              simple: expected, siblingGuid: (values.length > 0) ? values[0].guid : null }
          } else {
            result = { status: 'differs', values: [{ label: expected.label, uri: expected.uri }], note: rule.note,
              simple: expected, replaceGuid: values[0].guid }
          }
        } else if (rule.mode === 'remove'){
          if (values.length > 0){
            result = { status: 'remove', values: values, note: rule.note }
          }
        } else if (rule.mode === 'wording'){
          if (cell.fieldType === 'LITERAL' && values.length > 0){
            let fixed = fixPhysicalDescriptionWording(values[0].label, context.hasSeries)
            if (fixed !== values[0].label){
              result = { status: 'differs', values: [{ label: fixed, uri: null }], note: rule.note + ': "' + values[0].label + '"', literal: fixed, valueGuid: values[0].guid }
            }
          }
        }

        if (!result){ continue }
        if (result.status !== 'match' && dismissed.includes(key)){ continue }
        if (!line.suggestion){ line.suggestion = { pt: null, cells: {}, verified: 0, open: 0, wholeLine: false, key: null, values: {} } }
        let before = line.suggestion.cells[column.key]
        if (before && before.check && before.check !== rule.id){
          // two rules on the same cell (ISBD and RDA in the description conventions)
          if (before.status === 'match' && result.status === 'match'){
            before.note = before.note + '; ' + result.note
            continue
          }
          // a rule that found something wrong is kept over one that was satisfied
          if (before.status !== 'match' && result.status === 'match'){ continue }
        }
        if (before){
          if (before.status === 'match'){ line.suggestion.verified-- } else { line.suggestion.open-- }
        }
        result.key = key
        result.check = rule.id
        line.suggestion.cells[column.key] = result
        if (result.status === 'match'){ line.suggestion.verified++ } else { line.suggestion.open++ }
        // a whole-line offer no longer makes sense once a rule speaks about one of its cells
        if (result.status !== 'match'){ line.suggestion.wholeLine = false }
      }
    }
  }
}

const QUALIFIER = ONT + 'qualifier'
const CANCELED = { uri: VOC + 'mstatus/cancinv', label: 'canceled or invalid' }
const OTHER_MANIFESTATION = /e-?book|electronic|epub|pdf|kindle|large print|audio|hard ?back|hard ?cover|paperback|pbk|hbk/i

/**
* Checklist row 020: the ISBN of the book in hand is valid (and first), ISBNs of other
* manifestations (the ebook) are marked canceled/invalid
* @param {string} groupKey
* @param {object} group - the Identifiers column group
* @param {array} recordLines
* @param {string|null} inHand - the ISBN that was scanned / looked up
* @param {string|null} inHandQualifier - what WorldCat calls the in-hand format, if known (to tell the other formats apart)
* @param {array} dismissed
*/
export function checkIsbns(groupKey, group, recordLines, inHand, dismissed = []){
  let valueColumn = group.columns.filter((c) => { return c.kind !== 'type' && /rdf-syntax-ns#value$/.test(c.key) })[0]
  let statusColumn = group.columns.filter((c) => { return /bibframe\/status$/.test(c.key) })[0]
  let qualifierColumn = group.columns.filter((c) => { return c.key.endsWith(QUALIFIER) })[0]
  if (!valueColumn){ return }
  let inHandKey = inHand ? digits(inHand) : null
  let firstIsbnLine = true
  for (let line of recordLines){
    if (line.ghost || !line.pt){ continue }
    let node = (line.pt.userValue[line.pt.propertyURI] || [])[0]
    if (!node || !node['@type'] || !node['@type'].endsWith(ISBN_URI_END)){ continue }
    let cell = line.cells[valueColumn.key]
    if (!cell){ continue }
    let values = readCellValues(line.pt, cell)
    if (values.length == 0){ continue }
    let isbn = digits(values[0].label)
    let canceled = statusColumn && line.cells[statusColumn.key] ? readCellValues(line.pt, line.cells[statusColumn.key]).length > 0 : (node[STATUS] || []).length > 0
    let qualifier = (qualifierColumn && line.cells[qualifierColumn.key]) ? readCellValues(line.pt, line.cells[qualifierColumn.key]).map((v) => { return v.label }).join(' ') : ''
    let add = function(column, result){
      let key = groupKey + '|' + line.pt['@guid'] + '|' + column.key + '|020'
      if (result.status !== 'match' && dismissed.includes(key)){ return }
      if (!line.suggestion){ line.suggestion = { pt: null, cells: {}, verified: 0, open: 0, wholeLine: false, key: null, values: {} } }
      let before = line.suggestion.cells[column.key]
      if (before){ if (before.status === 'match'){ line.suggestion.verified-- } else { line.suggestion.open-- } }
      result.key = key
      result.check = '020'
      line.suggestion.cells[column.key] = result
      if (result.status === 'match'){ line.suggestion.verified++ } else { line.suggestion.open++ }
    }

    if (inHandKey && isbn === inHandKey){
      if (canceled){
        add(valueColumn, { status: 'warn', values: values, note: '020: the ISBN in hand is marked canceled' })
      } else {
        add(valueColumn, { status: 'match', values: values, note: '020: the ISBN of the book in hand' + (firstIsbnLine ? ', given first' : '') })
        if (!firstIsbnLine){
          add(valueColumn, { status: 'warn', values: values, note: '020: the ISBN in hand should be first' })
        }
      }
    } else if (!canceled && OTHER_MANIFESTATION.test(qualifier) && inHandKey && statusColumn && line.cells[statusColumn.key]){
      // a different format that is still a valid ISBN on this record: the checklist wants it in $z
      let fmt = qualifier.trim()
      if (!/e-?book|electronic|epub|pdf|kindle|large print|audio/i.test(fmt)){
        // paperback / hardback: only another manifestation if the book in hand is the other one, which we can't tell here
      } else {
        add(statusColumn, { status: 'add', values: [{ label: CANCELED.label, uri: CANCELED.uri }], note: '020: the ' + fmt + ' ISBN is another manifestation, mark it canceled ($z)', simple: CANCELED, siblingGuid: null })
      }
    }
    firstIsbnLine = false
  }
}

const MAIN_TITLE = ONT + 'mainTitle'
const SERIES_MARK = /bibframe\/Series|relationship\/series|hasSeries|seriesStatement|seriesEnumeration/i

function isSeriesComponent(pt){
  return pt && pt.propertyURI === RELATION && !componentIsEmpty(pt) && SERIES_MARK.test(JSON.stringify(pt.userValue))
}

/**
* The titles the record gives its series, from every component that can hold one (a linked
* series relation, a transcribed series statement) so a series is recognised whichever way it is in
* @param {object} profile - the record
* @param {object|null} except - a workflow component {propertyURI, label} whose instances are left out
* @return {array} - normalised titles
*/
export function recordSeriesTitles(profile, except = null){
  let titles = []
  let collect = function(node){
    if (Array.isArray(node)){ node.forEach(collect); return }
    if (!node || typeof node !== 'object'){ return }
    for (let k in node){
      if (k === MAIN_TITLE && typeof node[k] === 'string'){
        let t = normalizeLabel(node[k])
        if (t){ titles.push(t) }
      } else {
        collect(node[k])
      }
    }
  }
  for (let rt of profile.rtOrder){
    for (let ptId of profile.rt[rt].ptOrder){
      let pt = profile.rt[rt].pt[ptId]
      if (except && pt && pt.propertyURI === except.propertyURI && pt.propertyLabel === except.label){ continue }
      if (isSeriesComponent(pt)){ collect(pt.userValue) }
    }
  }
  return titles
}

/**
* Is a suggested component a series the record already has under another component
* @param {object} suggestedPt
* @param {array} recordTitles - from recordSeriesTitles
*/
export function isSeriesAlreadyInRecord(suggestedPt, recordTitles){
  if (!isSeriesComponent(suggestedPt) || recordTitles.length == 0){ return false }
  let titles = recordSeriesTitles({ rtOrder: ['x'], rt: { x: { ptOrder: ['p'], pt: { p: suggestedPt } } } })
  return titles.some((t) => { return recordTitles.includes(t) })
}

/**
* Does the record carry a series statement (the 300 "cm." rule depends on it)
*/
export function hasSeriesStatement(profile){
  for (let rt of profile.rtOrder){
    for (let ptId of profile.rt[rt].ptOrder){
      let pt = profile.rt[rt].pt[ptId]
      if (pt && pt.propertyURI === ONT + 'relation' && !componentIsEmpty(pt)){
        let text = JSON.stringify(pt.userValue)
        if (/bibframe\/Series|relationship\/series|hasSeries/i.test(text)){ return true }
      }
    }
  }
  return false
}

// ---------------------------------------------------------------- protections

// Some records must not have certain fields *replaced* from WorldCat, adding more is fine:
//  - juvenile fiction (target audience a/b/c/d/j and classed in PZ): the summary, the 6XX
//    subjects/genre-forms and the classification (except its date)
//  - law (classed in K): the 6XX and the classification (except its date)
const INTENDED_AUDIENCE = ONT + 'intendedAudience'
const CLASSIFICATION = ONT + 'classification'
const CLASSIFICATION_PORTION = ONT + 'classificationPortion'
const JUVENILE_AUDIENCE = /maudience\/(pre|pri|pad|ado|juv)$|^(juvenile|primary|pre-?adolescent|adolescent|preschool)/i

const PROTECTIONS = [
  {
    id: 'juvenile',
    label: 'Juvenile fiction (PZ)',
    applies: function(facts){ return facts.juvenileAudience && facts.classes.some((c) => { return /^PZ/i.test(c) }) },
    components: [ONT + 'summary', ONT + 'subject', ONT + 'genreForm', CLASSIFICATION],
    reason: 'juvenile fiction classed in PZ: do not replace the summary, subjects or classification (adding more is fine)',
  },
  {
    id: 'law',
    label: 'Law (K)',
    applies: function(facts){ return facts.classes.some((c) => { return /^K/i.test(c) }) },
    components: [ONT + 'subject', ONT + 'genreForm', CLASSIFICATION],
    reason: 'law material classed in K: do not replace the subjects or classification (adding more is fine)',
  },
]

/**
* What kind of record this is, as far as the protections care
* @param {object} profile - the record
* @return {object} - { juvenileAudience, classes: [classification portions] }
*/
export function recordFacts(profile){
  let facts = { juvenileAudience: false, classes: [] }
  for (let rt of profile.rtOrder){
    for (let ptId of profile.rt[rt].ptOrder){
      let pt = profile.rt[rt].pt[ptId]
      if (!pt || !pt.userValue){ continue }
      if (pt.propertyURI === INTENDED_AUDIENCE){
        for (let node of (pt.userValue[INTENDED_AUDIENCE] || [])){
          let label = ((node[LABEL] || [])[0] || {})[LABEL] || ''
          if (JUVENILE_AUDIENCE.test(node['@id'] || '') || JUVENILE_AUDIENCE.test(label)){ facts.juvenileAudience = true }
        }
      }
      if (pt.propertyURI === CLASSIFICATION){
        for (let node of (pt.userValue[CLASSIFICATION] || [])){
          if (node['@type'] !== LCC_TYPE){ continue }
          for (let c of (node[CLASSIFICATION_PORTION] || [])){
            let portion = String(c[CLASSIFICATION_PORTION] || '').trim()
            if (portion){ facts.classes.push(portion) }
          }
        }
      }
    }
  }
  return facts
}

/**
* The protections that apply to a record
* @return {array} - of { id, label, components, reason }
*/
export function recordProtections(profile){
  let facts = recordFacts(profile)
  return PROTECTIONS.filter((p) => { return p.applies(facts) })
}

/**
* Turn the replacements WorldCat would make in a protected component into warnings. Additions
* (empty cells, blank lines, ghost lines) are left as they are, the date of a call number too.
* @param {object} group
* @param {array} recordLines
* @param {array} protections - from recordProtections
*/
export function applyProtections(group, recordLines, protections){
  let applying = protections.filter((p) => { return p.components.includes(group.component.propertyURI) })
  if (applying.length == 0){ return }
  let reason = applying.map((p) => { return p.reason }).join('; ')
  for (let line of recordLines){
    if (line.ghost || !line.suggestion){ continue }
    for (let key in line.suggestion.cells){
      let cell = line.suggestion.cells[key]
      if (cell.status !== 'differs' || cell.check === 'year'){ continue }
      line.suggestion.cells[key] = {
        status: 'warn', values: cell.values, key: cell.key, check: cell.check || 'protected', protected: true,
        note: 'Not replaced, ' + reason + '. WorldCat has: ' + cell.values.map((v) => { return v.label }).join('; '),
      }
    }
  }
}

// ---------------------------------------------------------------- accepting

/**
* Deep copy a piece of userValue giving every blank node a new @guid
*/
export function cloneWithNewGuids(value){
  let copy = JSON.parse(JSON.stringify(value))
  let walk = function(node){
    if (Array.isArray(node)){
      node.forEach(walk)
    } else if (node && typeof node === 'object'){
      if (node['@guid']){ node['@guid'] = short.generate() }
      for (let k in node){ walk(node[k]) }
    }
  }
  walk(copy)
  return copy
}

/**
* Copy the value a cell shows from the suggested component into the record's component: the
* property the cell's propertyPath ends in. When a blank node on the way is not in the record yet
* the whole suggested node is taken (a note comes with its type, a title with its parts), since
* the cells of one node belong together; when it is there only the one value is replaced. Steps
* of the path the suggested data does not have (the owl:sameAs / componentList levels the lookups
* carry) are skipped on both sides.
*
* @param {object} target - the record component's userValue
* @param {object} source - the suggested component's userValue
* @param {array} propertyPath - the cell's propertyPath
* @return {boolean} - false when the suggested data was not where the path said
*/
export function copyCellValue(target, source, propertyPath){
  let steps = propertyPath.map((p) => { return p.propertyURI })
  // keep only the steps the source really has, in order
  let src = source
  let used = []
  for (let i = 0; i < steps.length; i++){
    let p = steps[i]
    if (!Array.isArray(src[p]) || src[p].length == 0){ continue }
    used.push(p)
    if (i < steps.length - 1){ src = src[p][0] }
  }
  if (used.length == 0 || used[used.length - 1] !== steps[steps.length - 1]){ return false }

  let dst = target
  src = source
  for (let i = 0; i < used.length - 1; i++){
    let p = used[i]
    let srcNode = src[p][0]
    if (!Array.isArray(dst[p]) || dst[p].length == 0 || componentIsEmpty({ userValue: dst[p][0] })){
      // the record has nothing here: take the suggested blank node as a whole
      dst[p] = cloneWithNewGuids(src[p])
      return true
    }
    if (srcNode['@type'] && !dst[p][0]['@type']){
      dst[p][0]['@type'] = srcNode['@type']
    }
    dst = dst[p][0]
    src = srcNode
  }
  let last = used[used.length - 1]
  dst[last] = cloneWithNewGuids(src[last])
  return true
}

/**
* Make a record component hold what a suggested one holds
*/
export function copyComponentValue(targetPt, sourcePt){
  let value = cloneWithNewGuids(sourcePt.userValue)
  if (targetPt.userValue && targetPt.userValue['@root']){ value['@root'] = targetPt.userValue['@root'] }
  targetPt.userValue = value
  if (sourcePt.activeType){ targetPt.activeType = sourcePt.activeType }
}

/**
* Does a component hold any data. A blank component can still carry empty blank nodes
* (a Contribution with no agent or role) from the profile, those don't count.
*/
export function componentIsEmpty(pt){
  if (!pt || !pt.userValue){ return true }
  let nodeIsEmpty = function(node){
    if (node === null || typeof node === 'undefined'){ return true }
    if (typeof node !== 'object'){ return String(node).trim() === '' }
    if (Array.isArray(node)){ return node.every(nodeIsEmpty) }
    for (let k in node){
      // @id is a value (a link), the other @ keys are bookkeeping
      if (k === '@id' && node[k]){ return false }
      if (k.startsWith('@')){ continue }
      if (!nodeIsEmpty(node[k])){ return false }
    }
    return true
  }
  return nodeIsEmpty(pt.userValue)
}
