/**
 * Workflows graph: running a graph over one record.
 *
 * The graph is Baklava's saved state (what the canvas gives back), the record's values come in
 * already read off it (values.readSourceValues), the record is changed through the context the
 * store hands in, so this file does not know about the profile store and can be run on its own
 * in a test.
 *
 * Every node runs once per line. A node's inputs are lists of entries that each know which line
 * of which component they came from; the lists are joined on the components they share: entries
 * of the same component pair up by line, an entry of another component goes with every line
 * (a record has one Work date and three contributors: the date is given to each contributor),
 * two repeating components that share nothing give every combination.
 */

import { SOURCE_NODE_TYPE, TEST_NODE_TYPE, parsePortKey } from './ports'
import { nodeType, nodeOptions } from './nodes'
import { booleanEntry } from './values'

// the most lines one node is run for on one record, past this the combinations are a mistake
const MAX_ROWS = 2000

/**
* The graph part of a saved editor state, whichever was handed in
*/
function graphOf(state){
  if (!state){ return null }
  if (state.graph && state.graph.nodes){ return state.graph }
  if (state.nodes){ return state }
  return null
}

/**
* The port keys of the source node that have a wire on them
* @param {object} state - the saved graph
* @return {array}
*/
export function usedPortKeys(state){
  let graph = graphOf(state)
  if (!graph){ return [] }
  let source = graph.nodes.filter((n) => { return n.type === SOURCE_NODE_TYPE })[0]
  if (!source){ return [] }
  let wired = {}
  for (let c of (graph.connections || [])){ wired[c.from] = true }
  return Object.keys(source.outputs || {}).filter((key) => { return source.outputs[key] && wired[source.outputs[key].id] })
}

/**
* A few numbers about a graph for a card
* @param {object} state
* @return {object} - {nodes, wires, ports}
*/
export function graphSummary(state){
  let graph = graphOf(state)
  if (!graph){ return { nodes: 0, wires: 0, ports: 0 } }
  return {
    nodes: graph.nodes.filter((n) => { return n.type !== SOURCE_NODE_TYPE && n.type !== TEST_NODE_TYPE }).length,
    wires: (graph.connections || []).length,
    ports: usedPortKeys(state).length,
  }
}

/**
* Do two entries sit on the same lines of the components they both come from
*/
function compatibleLines(a, b){
  for (let key in a){
    if (b[key] !== undefined && b[key] !== a[key]){ return false }
  }
  return true
}

/**
* Pair the entries of a node's inputs up into the rows the node runs for
* @param {object} inputLists - input key -> [entries] | null (not connected)
* @return {array} - of { inputs: key -> entry|null, lines }
*/
export function joinInputs(inputLists){
  let rows = [{ inputs: {}, lines: {} }]
  for (let key in inputLists){
    let entries = inputLists[key]
    if (entries === null || entries === undefined){
      for (let row of rows){ row.inputs[key] = null }
      continue
    }
    let next = []
    for (let row of rows){
      let matching = entries.filter((e) => { return compatibleLines(e.lines || {}, row.lines) })
      if (matching.length == 0){
        next.push({ inputs: Object.assign({}, row.inputs, { [key]: null }), lines: row.lines })
        continue
      }
      for (let m of matching){
        next.push({ inputs: Object.assign({}, row.inputs, { [key]: m }), lines: Object.assign({}, row.lines, m.lines || {}) })
        if (next.length > MAX_ROWS){ return next }
      }
    }
    rows = next
  }
  return rows
}

/**
* The nodes in the order they can be run, each after everything that feeds it
* @return {object} - { order: [node states], incoming: nodeId -> inputKey -> {nodeId, key}, error }
*/
function plan(graph){
  let byInterface = {}
  let nodes = {}
  for (let node of graph.nodes){
    nodes[node.id] = node
    for (let key in (node.inputs || {})){ if (node.inputs[key] && node.inputs[key].id){ byInterface[node.inputs[key].id] = { nodeId: node.id, key: key, side: 'input' } } }
    for (let key in (node.outputs || {})){ if (node.outputs[key] && node.outputs[key].id){ byInterface[node.outputs[key].id] = { nodeId: node.id, key: key, side: 'output' } } }
  }
  let incoming = {}
  let feeds = {}
  let inDegree = {}
  for (let id in nodes){ inDegree[id] = 0; feeds[id] = []; incoming[id] = {} }
  for (let c of (graph.connections || [])){
    let from = byInterface[c.from], to = byInterface[c.to]
    if (!from || !to || from.side !== 'output' || to.side !== 'input'){ continue }
    incoming[to.nodeId][to.key] = { nodeId: from.nodeId, key: from.key }
    feeds[from.nodeId].push(to.nodeId)
    inDegree[to.nodeId]++
  }
  let ready = Object.keys(nodes).filter((id) => { return inDegree[id] == 0 })
  let order = []
  while (ready.length > 0){
    let id = ready.shift()
    order.push(nodes[id])
    for (let next of feeds[id]){
      inDegree[next]--
      if (inDegree[next] == 0){ ready.push(next) }
    }
  }
  if (order.length < Object.keys(nodes).length){
    return { order: order, incoming: incoming, error: 'The graph has a loop, nothing was run' }
  }
  return { order: order, incoming: incoming, error: null }
}

/**
* Run a graph over one record
* @param {object} state - the saved graph (the editor state or its graph)
* @param {object} sourceValues - port key -> [entries], from values.readSourceValues
* @param {object} context - { write(targetKey, lineIndex, entry, mode) -> Promise<string|null>, log(entry) }
* @return {object} - { dropped, reason, log: [{nodeId, title, message, level}], ran }
*/
export async function runGraph(state, sourceValues, context){
  let result = { dropped: false, reason: null, log: [], ran: 0 }
  let graph = graphOf(state)
  if (!graph){ return result }

  let logLine = function(node, message, level){
    let entry = { nodeId: node ? node.id : null, title: node ? node.title : 'Graph', message: message, level: level || 'info' }
    result.log.push(entry)
    if (context && context.log){ context.log(entry) }
  }

  let planned = plan(graph)
  if (planned.error){
    logLine(null, planned.error, 'error')
    return result
  }

  // what each node gave out, nodeId -> outputKey -> [entries]
  let outputs = {}
  for (let node of planned.order){
    if (node.type === SOURCE_NODE_TYPE){
      outputs[node.id] = {}
      for (let key in (node.outputs || {})){ outputs[node.id][key] = sourceValues[key] || [] }
      continue
    }
    // the builder's Test node is a tool on the canvas, not a step of the graph
    if (node.type === TEST_NODE_TYPE){ continue }
    let definition = nodeType(node.type)
    if (!definition){
      logLine(node, 'Unknown node type "' + node.type + '", skipped', 'error')
      continue
    }
    let options = nodeOptions(definition, node)
    let inputLists = {}
    for (let key in definition.inputs){
      let from = planned.incoming[node.id][key]
      inputLists[key] = (from && outputs[from.nodeId]) ? (outputs[from.nodeId][from.key] || []) : null
    }
    let rows = joinInputs(inputLists)
    if (rows.length > MAX_ROWS){
      logLine(node, 'Too many combinations of lines (' + rows.length + '), the node was not run', 'error')
      rows = []
    }
    outputs[node.id] = {}
    for (let key in definition.outputs){ outputs[node.id][key] = [] }

    for (let row of rows){
      let ctx = {
        lines: row.lines,
        write: async function(targetKey, entry, mode){
          if (!targetKey){ return 'no field chosen on the node' }
          let parsed = parsePortKey(targetKey)
          let lineIndex = (parsed && parsed.groupKey && row.lines[parsed.groupKey] !== undefined) ? row.lines[parsed.groupKey] : 0
          if (!context || !context.write){ return 'nothing to write to' }
          return await context.write(targetKey, lineIndex, entry, mode, node)
        },
        drop: function(reason){
          if (!result.dropped){
            result.dropped = true
            result.reason = reason
            logLine(node, 'Dropped: ' + reason, 'drop')
          }
        },
        log: function(message, level){ logLine(node, message, level) },
      }
      let out
      try {
        out = await definition.run(row.inputs, options, ctx)
      } catch (e) {
        logLine(node, 'Failed: ' + ((e && e.message) ? e.message : String(e)), 'error')
        out = {}
      }
      result.ran++
      for (let key in definition.outputs){
        let value = out ? out[key] : undefined
        if (definition.outputs[key].kind === 'boolean'){
          outputs[node.id][key].push(booleanEntry(!!value, row.lines))
        } else if (value && typeof value === 'object'){
          outputs[node.id][key].push(Object.assign({}, value, { lines: Object.assign({}, value.lines || {}, row.lines) }))
        } else {
          outputs[node.id][key].push({ uri: null, label: null, literal: null, lang: null, lines: row.lines, empty: true, guid: null })
        }
      }
      if (result.dropped){ return result }
    }
  }
  return result
}
