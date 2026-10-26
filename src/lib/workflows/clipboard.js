/**
 * Workflows: copying a cell and pasting it into another.
 *
 * Ctrl+C on a selected cell puts the cell's text on the system clipboard, so it pastes as plain
 * text anywhere else, and keeps what the cell really holds (the value nodes of the record with
 * the kind of field they came from) in sessionStorage under that text. Ctrl+V on another cell
 * reads the text off the clipboard, finds the kept copy by it, and when the field being pasted
 * into is of the same kind (same type of field, same vocabulary) writes the nodes into the
 * record with new guids, the way the record would hold them had they been typed or picked.
 */

import utilsProfile from '@/lib/utils_profile'
import { dataPropertyPath, simpleLookupFallbackPath } from './fields'
import { cloneWithNewGuids } from './cip'

const STORAGE_PREFIX = 'wf-copy:'
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'

/**
* The path the data really uses for the cell, for a simple lookup the one that has values if the first doesn't
* @param {object} pt
* @param {object} cell
* @return {array}
*/
function pathInData(pt, cell){
  let path = dataPropertyPath(cell)
  if (cell.fieldType == 'SIMPLE' && !utilsProfile.returnValueFromPropertyPath(pt, path)){
    let fallback = simpleLookupFallbackPath(path)
    if (fallback.length > 0 && utilsProfile.returnValueFromPropertyPath(pt, fallback)){ return fallback }
  }
  return path
}

/**
* What is kept of a copied cell
* @param {object} pt - the component the cell is in
* @param {object} cell - from resolveComponentCells
* @param {object} column - the sheet column
* @param {string} text - what the cell shows, the text that goes on the clipboard
* @param {string|null} templateId - the template the component uses (its Type), to make a new component for the paste
* @return {object|null} - null when there is nothing to copy
*/
export function copyPayload(pt, cell, column, text, templateId){
  if (!pt || !cell || cell.kind != 'field'){ return null }
  let nodes
  let leafURI
  if (cell.fieldType == 'RDFTYPE'){
    nodes = pt.userValue[RDF_TYPE] || []
    leafURI = RDF_TYPE
  } else {
    let path = pathInData(pt, cell)
    if (path.length == 0){ return null }
    nodes = utilsProfile.returnValueFromPropertyPath(pt, path) || []
    leafURI = path[path.length - 1].propertyURI
  }
  nodes = nodes.filter((n) => { return n && typeof n === 'object' })
  if (nodes.length == 0){ return null }
  return {
    text: text,
    label: column.label,
    fieldType: cell.fieldType,
    useValuesFrom: (cell.structure.valueConstraint && cell.structure.valueConstraint.useValuesFrom) ? cell.structure.valueConstraint.useValuesFrom.slice() : [],
    leafURI: leafURI,
    templateId: templateId || null,
    nodes: JSON.parse(JSON.stringify(nodes)),
    at: Date.now(),
  }
}

/**
* Keep the copy for a paste, under its text. Only the latest copy is kept.
*/
export function rememberCopy(payload){
  try {
    forgetCopies()
    window.sessionStorage.setItem(STORAGE_PREFIX + payload.text, JSON.stringify(payload))
  } catch (e) {
    console.warn('Workflows: could not keep the copied cell', e)
  }
}

/**
* The kept copy that goes with the text on the clipboard, if the text came from a cell
* @param {string} text
* @return {object|null}
*/
export function recallCopy(text){
  if (!text){ return null }
  try {
    let raw = window.sessionStorage.getItem(STORAGE_PREFIX + text)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function forgetCopies(){
  try {
    let keys = []
    for (let i = 0; i < window.sessionStorage.length; i++){
      let k = window.sessionStorage.key(i)
      if (k && k.startsWith(STORAGE_PREFIX)){ keys.push(k) }
    }
    for (let k of keys){ window.sessionStorage.removeItem(k) }
  } catch (e) {
    // nothing kept, nothing to forget
  }
}

/**
* A vocabulary (or a value's) uri reduced to what names it: the profiles point at the same
* vocabulary as http and https, on id.loc.gov and on preprod.id.loc.gov
* @param {string} uri
* @return {string}
*/
export function vocabularyKey(uri){
  return String(uri || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^([a-z0-9-]+\.)*id\.loc\.gov/, 'id.loc.gov')
    .replace(/\/+$/, '')
}

/**
* Can the copied value go into this cell: the same type of field, and the field draws on the
* vocabulary the value comes from.
* A value from a list (simple lookup) is judged by its own uri, which is the vocabulary's uri
* plus the term: a relator pasted into a field that takes relators and rbms relators is fine, one
* from rbmsrel into a relators-only field is not. A linked value (complex lookup) is judged by
* the two fields having a vocabulary in common, its stored uri says nothing about that (an agent
* is kept as its real world object uri, not the name authority it was found in).
* @param {object} payload - from copyPayload
* @param {object} cell - the cell being pasted into
* @return {string|null} - null when it can, otherwise why not
*/
export function incompatible(payload, cell){
  if (!cell || cell.kind != 'field'){ return 'This is not a field that takes a value' }
  if (cell.fieldType !== payload.fieldType){
    return 'The copied value is a ' + describeFieldType(payload.fieldType) + ', this field takes a ' + describeFieldType(cell.fieldType)
  }
  if (payload.fieldType == 'LITERAL' || payload.fieldType == 'RDFTYPE'){ return null }

  let accepts = ((cell.structure.valueConstraint && cell.structure.valueConstraint.useValuesFrom) || []).map(vocabularyKey)
  if (payload.fieldType == 'SIMPLE'){
    let uris = payload.nodes.map((n) => { return n['@id'] }).filter((u) => { return u }).map(vocabularyKey)
    if (uris.length > 0){
      let allIn = uris.every((u) => { return accepts.some((v) => { return u === v || u.startsWith(v + '/') || u.startsWith(v + '#') }) })
      return allIn ? null : 'The copied value comes from a vocabulary this field does not use'
    }
  }
  let comesFrom = payload.useValuesFrom.map(vocabularyKey)
  if (!comesFrom.some((v) => { return accepts.includes(v) })){ return 'The copied value comes from a different vocabulary than this field uses' }
  return null
}

function describeFieldType(type){
  switch (type){
    case 'LITERAL': return 'text value'
    case 'SIMPLE': return 'value from a list'
    case 'COMPLEX': return 'linked value'
    case 'RDFTYPE': return 'type'
    default: return 'different kind of value'
  }
}

/**
* Put the copied nodes into the cell of a component of the active record, as its value or beside what it has
* @param {object} pt - the component, in the activeProfile
* @param {object} cell - the cell of pt being pasted into
* @param {object} payload - from copyPayload
* @param {boolean} add - keep the values the cell has and add the copied ones, instead of replacing them
* @return {boolean}
*/
export function writeCellNodes(pt, cell, payload, add){
  let nodes = cloneWithNewGuids(payload.nodes)
  let path = pathInData(pt, cell)
  if (path.length == 0){ return false }
  let last = path[path.length - 1].propertyURI
  // a text value is held under the name of its property, pasted into another property it takes that name
  if (cell.fieldType == 'LITERAL' && payload.leafURI !== last){
    for (let n of nodes){
      if (Object.prototype.hasOwnProperty.call(n, payload.leafURI)){
        n[last] = n[payload.leafURI]
        delete n[payload.leafURI]
      }
    }
  }
  if (utilsProfile.countValues(pt, path) == 0){
    // nothing here yet, build the blank nodes down to the value the way the editor does
    utilsProfile.buildBlanknode(pt, path)
    let parent = utilsProfile.returnPropertyPathParent(pt, path)
    if (!parent){ return false }
    parent[last] = nodes
  } else {
    let parent = utilsProfile.returnPropertyPathParent(pt, path)
    if (!parent){ return false }
    parent[last] = add ? parent[last].concat(nodes) : nodes
  }
  pt.hasData = true
  pt.userModified = true
  return true
}

/**
* The copied RDF types, as the uris the picklist setter takes
* @param {object} payload
* @param {object} pt - to add to what it has
* @param {boolean} add
* @return {array} - of uris
*/
export function pastedTypeUris(payload, pt, add){
  let uris = payload.nodes.map((n) => { return n['@id'] }).filter((u) => { return u })
  if (add){
    let have = (pt.userValue[RDF_TYPE] || []).map((n) => { return n['@id'] }).filter((u) => { return u })
    uris = have.concat(uris.filter((u) => { return !have.includes(u) }))
  }
  return uris
}
