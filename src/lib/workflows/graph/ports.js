/**
 * Workflows graph: the ports of the source node.
 *
 * A port is one column (subfield) of one component of the record, or of a record an enrichment
 * brought in (WorldCat's version of it). It is named by a key that stays the same across saves,
 * builds of the profile and machines:
 *
 *     <origin>|<rt>|<component id>|<column key>
 *     record|Work|id_loc_gov_ontologies_bibframe_contribution__contributors|http://.../agent
 *     worldcat|Work|id_loc_gov_ontologies_bibframe_contribution__contributors|http://.../agent
 *
 * `origin` is `record` for the record itself or the origin of an enrichment (ENRICHMENT_ORIGINS).
 * An origin also has a few ports of its own that are not columns (`worldcat|found`).
 */

import { CIP_ENRICHMENT_ID } from '../cip'
import { columnHint } from '../fields'

export const SOURCE_NODE_TYPE = 'wf-source'
// the builder's Test node (try the graph on one record): on the canvas, never run as part of the graph
export const TEST_NODE_TYPE = 'wf-test'
export const RECORD_ORIGIN = 'record'

// the enrichments that put fields on the source node, by enrichment id
export const ENRICHMENT_ORIGINS = {
  [CIP_ENRICHMENT_ID]: {
    origin: 'worldcat',
    label: 'WorldCat',
    description: 'The matching WorldCat record, converted to BIBFRAME',
    // ports that are not columns of a component
    facts: [
      { key: 'found', label: 'WorldCat: record found', kind: 'boolean' },
      { key: 'format', label: 'WorldCat: format of the record', kind: 'value' },
    ],
  },
}

/**
* The key of a column port
* @param {string} origin
* @param {string} rt - Work | Instance ...
* @param {string} componentId
* @param {string} columnKey
* @return {string}
*/
export function portKey(origin, rt, componentId, columnKey){
  return [origin, rt, componentId, columnKey].join('|')
}

/**
* The key of a fact port (worldcat|found)
*/
export function factKey(origin, key){
  return origin + '|' + key
}

/**
* Take a port key apart
* @param {string} key
* @return {object|null} - {origin, rt, componentId, columnKey, groupKey} for a column port,
*   {origin, fact} for a fact port, null for anything else
*/
export function parsePortKey(key){
  if (!key || typeof key !== 'string'){ return null }
  let parts = key.split('|')
  if (parts.length == 2){ return { origin: parts[0], fact: parts[1] } }
  if (parts.length < 4){ return null }
  // a column key can itself hold a | (a nested property path), everything after the component id is the column
  return {
    origin: parts[0],
    rt: parts[1],
    componentId: parts[2],
    columnKey: parts.slice(3).join('|'),
    groupKey: parts[1] + '|' + parts[2],
  }
}

/**
* The origins a workflow's enrichments add to the source node
* @param {array} enrichmentIds
* @return {array} - of ENRICHMENT_ORIGINS entries with the enrichment id on each
*/
export function enrichmentOrigins(enrichmentIds){
  return (enrichmentIds || []).filter((id) => { return ENRICHMENT_ORIGINS[id] }).map((id) => {
    return Object.assign({ enrichment: id }, ENRICHMENT_ORIGINS[id])
  })
}

/**
* Everything the source node offers: the record's components with their columns, then the same
* again for each enrichment that is on, with its facts
* @param {array} components - the profile's components (workflowStore.returnProfileComponents)
* @param {function} columnsFor - component -> columns (workflowStore.returnComponentColumns)
* @param {array} enrichmentIds - the enrichments that are on
* @return {array} - of groups {origin, originLabel, rt, component, groupKey, label, ports: [{key, label, column, kind}]}
*/
export function listSourcePorts(components, columnsFor, enrichmentIds){
  let groups = []
  let origins = [{ origin: RECORD_ORIGIN, label: 'Record', facts: [] }].concat(enrichmentOrigins(enrichmentIds))
  for (let o of origins){
    for (let fact of (o.facts || [])){
      groups.push({
        origin: o.origin, originLabel: o.label, rt: null, component: null, groupKey: null, fact: true,
        label: fact.label,
        ports: [{ key: factKey(o.origin, fact.key), label: fact.label, column: null, kind: fact.kind }],
      })
    }
    for (let component of components){
      let columns = columnsFor(component) || []
      if (columns.length == 0){ continue }
      groups.push({
        origin: o.origin,
        originLabel: o.label,
        rt: component.rt,
        component: component,
        groupKey: component.rt + '|' + component.id,
        label: component.label,
        ports: columns.map((column) => {
          // the sheet's header tells same-named columns apart by their template (the three "Subjects"
          // of a subject component, one per kind of subject), the port says it in its name
          let hint = columnHint(columns, column)
          return { key: portKey(o.origin, component.rt, component.id, column.key), label: column.label + (hint ? ' (' + hint + ')' : ''), column: column, kind: 'value' }
        }),
      })
    }
  }
  return groups
}

/**
* The port keys of a graph that the source node no longer offers (the profile changed, an
* enrichment was turned off)
* @param {array} usedKeys - the port keys the graph's wires start from
* @param {array} groups - from listSourcePorts
* @return {array} - the keys that are not offered, with a readable description of each
*/
export function missingPorts(usedKeys, groups){
  let offered = {}
  for (let g of groups){ for (let p of g.ports){ offered[p.key] = true } }
  return usedKeys.filter((k) => { return !offered[k] }).map((k) => {
    let parsed = parsePortKey(k)
    let what = parsed ? (parsed.fact ? parsed.origin + ': ' + parsed.fact : parsed.origin + ': ' + parsed.rt + ' ' + parsed.componentId + ' / ' + parsed.columnKey.split('|').pop().split(/[\/#]/).pop()) : k
    return { key: k, description: what }
  })
}
