/**
 * Workflows graph: a workflow as a file, so it can be saved, sent around and loaded on another
 * machine (and later published to a backend).
 *
 *     { "format": "marva-workflow", "version": 1, "workflow": { ...the definition... } }
 *
 * The definition is what the store keeps (builtin.js describes it) plus `graph`, the canvas's
 * saved state wrapped with its own version: { version: 1, editor: <Baklava editor state> }.
 */

import { usedPortKeys } from './run'
import { missingPorts } from './ports'
import { nodeType } from './nodes'
import { SOURCE_NODE_TYPE, TEST_NODE_TYPE } from './ports'

export const FILE_FORMAT = 'marva-workflow'
export const FILE_VERSION = 1
export const GRAPH_VERSION = 1

/**
* The definition as the text of a file
* @param {object} definition
* @return {string}
*/
export function exportDefinition(definition){
  let workflow = JSON.parse(JSON.stringify(definition))
  delete workflow.builtin
  delete workflow.id
  delete workflow.created
  delete workflow.updated
  return JSON.stringify({ format: FILE_FORMAT, version: FILE_VERSION, exported: new Date().toISOString(), workflow: workflow }, null, 2)
}

/**
* A file name for a definition
*/
export function exportFileName(definition){
  let base = String(definition.name || 'workflow').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'workflow'
  return base + '.workflow.json'
}

/**
* Read a definition back out of a file's text. The shape is checked, not whether the profile
* has the fields (that is checkDefinition, it needs the profiles)
* @param {string} text
* @return {object} - { definition, problems: [strings] }, definition is null when it can not be used
*/
export function importDefinition(text){
  let problems = []
  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { definition: null, problems: ['The file is not JSON'] }
  }
  // a bare definition is taken too
  let workflow = (data && data.format === FILE_FORMAT) ? data.workflow : data
  if (!workflow || typeof workflow !== 'object'){ return { definition: null, problems: ['The file does not hold a workflow'] } }
  if (data && data.format === FILE_FORMAT && data.version > FILE_VERSION){ problems.push('The file was made by a newer version of Marva (file version ' + data.version + '), it may not load fully') }
  if (!workflow.name || typeof workflow.name !== 'string'){ return { definition: null, problems: ['The workflow has no name'] } }
  if (!workflow.profileId || typeof workflow.profileId !== 'string'){ return { definition: null, problems: ['The workflow does not say which profile it is for'] } }
  if (!Array.isArray(workflow.components)){ return { definition: null, problems: ['The workflow has no list of fields'] } }
  for (let c of workflow.components){
    if (!c || typeof c.rt !== 'string' || typeof c.id !== 'string'){ return { definition: null, problems: ['A field in the workflow is not a field (it needs rt and id)'] } }
  }
  if (workflow.graph){
    if (typeof workflow.graph !== 'object' || !workflow.graph.editor || !workflow.graph.editor.graph || !Array.isArray(workflow.graph.editor.graph.nodes)){
      return { definition: null, problems: ['The workflow\'s graph is not in a shape that can be loaded'] }
    }
    if (workflow.graph.version > GRAPH_VERSION){ problems.push('The graph was made by a newer version of Marva (graph version ' + workflow.graph.version + ')') }
    for (let node of workflow.graph.editor.graph.nodes){
      if (node.type !== SOURCE_NODE_TYPE && node.type !== TEST_NODE_TYPE && !nodeType(node.type)){ problems.push('The graph has a node of a kind this version does not know: ' + node.type) }
    }
  }
  let definition = {
    name: workflow.name.trim(),
    description: (typeof workflow.description === 'string') ? workflow.description : '',
    profileId: workflow.profileId,
    components: workflow.components.map((c) => { return { rt: c.rt, id: c.id, hiddenColumns: Array.isArray(c.hiddenColumns) ? c.hiddenColumns : [] } }),
    enrichments: Array.isArray(workflow.enrichments) ? workflow.enrichments.filter((e) => { return typeof e === 'string' }) : [],
    graph: workflow.graph || null,
  }
  return { definition: definition, problems: problems }
}

/**
* Check a definition's graph against what the source node offers for its profile: every wire
* has to start from a port the profile (and the enrichments that are on) has
* @param {object} definition
* @param {array} groups - ports.listSourcePorts for the definition's profile and enrichments
* @return {array} - of {key, description} for the ports the graph uses and the profile does not have
*/
export function checkGraphPorts(definition, groups){
  if (!definition.graph || !definition.graph.editor){ return [] }
  return missingPorts(usedPortKeys(definition.graph.editor), groups)
}

/**
* Hand the text to the browser as a file to save
* @param {string} name
* @param {string} text
*/
export function downloadText(name, text){
  let blob = new Blob([text], { type: 'application/json' })
  let url = URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => { URL.revokeObjectURL(url) }, 1000)
}

/**
* Read a file the user picked
* @param {File} file
* @return {Promise<string>}
*/
export function readFileText(file){
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.onload = () => { resolve(String(reader.result)) }
    reader.onerror = () => { reject(reader.error) }
    reader.readAsText(file)
  })
}
