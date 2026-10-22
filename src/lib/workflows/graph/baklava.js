/**
 * Workflows graph: the node catalog (nodes.js) and the source node (ports.js) as Baklava node
 * types, for the canvas. Nothing here runs a graph, run.js does that from the saved state.
 *
 * Options sit on the node as Baklava inputs without a port, so they are saved with the node
 * (`inputs.<key>.value`) which is where nodes.nodeOptions reads them back.
 */

import { markRaw } from 'vue'
import { Editor, NodeInterface, defineNode, defineDynamicNode } from '@baklavajs/core'
import { CheckboxInterface } from '@baklavajs/renderer-vue'
import { NodeInterfaceType, BaklavaInterfaceTypes, setType } from '@baklavajs/interface-types'

import GraphSelect from '@/components/workflows/graph/GraphSelect.vue'
import GraphText from '@/components/workflows/graph/GraphText.vue'

import { NODE_TYPES, nodeLayout, nodeVisibility, nodeOptions } from './nodes'
import { SOURCE_NODE_TYPE, TEST_NODE_TYPE, ENRICHMENT_ORIGINS, listSourcePorts } from './ports'
import { entryTruth } from './values'

// a value (blue) only goes into a value port, a True / False (orange) only into an Only when: no
// conversions, so a wire between the two kinds is refused on the canvas
export const valueType = new NodeInterfaceType('value')
export const booleanType = new NodeInterfaceType('boolean')

// the key of the check box of an enrichment on the source node
export function enrichmentInputKey(id){
  return 'enrichment:' + id
}

function typed(intf, kind){
  setType(intf, kind === 'boolean' ? booleanType : valueType)
  return intf
}

/**
* A control for an option: a labelled select or text box of our own (GraphSelect / GraphText, so
* the row says what it is), Baklava's check box
*/
function optionInterface(key, option, portItems){
  let intf
  switch (option.control){
    case 'select':
      intf = new NodeInterface(option.label, option.default)
      intf.items = option.items
      intf.setComponent(markRaw(GraphSelect))
      break
    case 'checkbox':
      intf = new CheckboxInterface(option.label, !!option.default)
      break
    case 'port':
      intf = new NodeInterface(option.label, option.default)
      intf.items = [{ text: 'pick a field...', value: '' }].concat(portItems || [])
      intf.setComponent(markRaw(GraphSelect))
      break
    default:
      intf = new NodeInterface(option.label, option.default === undefined ? '' : option.default)
      intf.placeholder = option.placeholder || ''
      intf.setComponent(markRaw(GraphText))
  }
  intf.setPort(false)
  return intf
}

/**
* The Baklava node types of the catalog
* @param {array} portItems - the record's column ports a Set value / Copy value can write to, as select items {text, value}
* @return {array} - of node classes, each with `category` for the palette
*/
export function buildNodeTypes(portItems){
  return NODE_TYPES.map((definition) => {
    let inputs = {}
    // inputs and options in the order the node draws them (nodes.layout)
    for (let key of nodeLayout(definition)){
      if (definition.inputs[key]){
        let input = definition.inputs[key]
        inputs[key] = () => { return typed(new NodeInterface(input.label, null), input.kind) }
      } else if (definition.options[key]){
        let option = definition.options[key]
        inputs[key] = () => { return optionInterface(key, option, portItems) }
      }
    }
    let outputs = {}
    for (let key in definition.outputs){
      let output = definition.outputs[key]
      outputs[key] = () => { return typed(new NodeInterface(output.label, null), output.kind) }
    }
    // the settings that do not apply (B for "is empty") are hidden, a wired port is always shown
    let applyVisibility = function(node){
      let current = {}
      for (let key in definition.options){ current[key] = node.inputs[key] ? node.inputs[key].value : undefined }
      let shown = nodeVisibility(definition, Object.assign(nodeOptions(definition, null), current))
      for (let key in shown){
        let intf = node.inputs[key]
        if (!intf){ continue }
        intf.hidden = !shown[key] && !(intf.port && intf.connectionCount > 0)
      }
    }
    let nodeClass = defineNode({
      type: definition.type,
      title: definition.title,
      inputs: inputs,
      outputs: outputs,
      onPlaced(){
        applyVisibility(this)
        this.events.update.subscribe(this, () => { applyVisibility(this) })
      },
    })
    nodeClass.category = definition.category
    nodeClass.definition = definition
    return nodeClass
  })
}

/**
* The source node: a check box per enrichment, and an output for every port of the record and
* of the enrichments that are checked
* @param {array} components - the profile's components
* @param {function} columnsFor - component -> columns
* @return {class}
*/
export function buildSourceNodeType(components, columnsFor){
  let inputs = {}
  for (let id in ENRICHMENT_ORIGINS){
    let origin = ENRICHMENT_ORIGINS[id]
    inputs[enrichmentInputKey(id)] = () => { return new CheckboxInterface(origin.label + ' lookup', false).setPort(false) }
  }
  let nodeClass = defineDynamicNode({
    type: SOURCE_NODE_TYPE,
    title: 'Record',
    inputs: inputs,
    outputs: {},
    onUpdate(inputValues){
      let on = Object.keys(ENRICHMENT_ORIGINS).filter((id) => { return inputValues[enrichmentInputKey(id)] })
      let outputs = {}
      for (let group of listSourcePorts(components, columnsFor, on)){
        for (let port of group.ports){
          outputs[port.key] = () => { return typed(new NodeInterface(port.label, null), port.kind) }
        }
      }
      return { outputs: outputs }
    },
  })
  nodeClass.category = 'Source'
  return nodeClass
}

/**
* The Test node: an identifier typed on it, the graph is tried on that record (TestNode.vue draws it,
* the store's testGraph runs it). It has no ports, the identifier is kept on the node so it is saved
* with the graph; run.js skips it
* @return {class}
*/
export function buildTestNodeType(){
  let nodeClass = defineNode({
    type: TEST_NODE_TYPE,
    title: 'Test on a record',
    inputs: {
      identifier: () => { return new NodeInterface('Identifier', '').setPort(false) },
    },
    outputs: {},
  })
  nodeClass.category = 'Test'
  return nodeClass
}

/**
* An editor with the node types registered and the port types enforced on the wires
* @param {object} viewModel - from useBaklava()
* @param {array} nodeTypes - from buildNodeTypes
* @param {class} sourceType - from buildSourceNodeType
* @param {class} testType - from buildTestNodeType
* @return {Editor}
*/
export function prepareEditor(viewModel, nodeTypes, sourceType, testType){
  let editor = viewModel.editor
  editor.registerNodeType(sourceType, { category: 'Source', title: 'Record' })
  if (testType){ editor.registerNodeType(testType, { category: 'Test', title: 'Test on a record' }) }
  for (let nodeClass of nodeTypes){
    editor.registerNodeType(nodeClass, { category: nodeClass.category, title: nodeClass.definition.title })
  }
  let types = new BaklavaInterfaceTypes(editor, { viewPlugin: viewModel })
  types.addTypes(valueType, booleanType)
  // one record on the canvas
  editor.graphEvents.beforeAddNode.subscribe(editor, (node, prevent) => {
    if (node.type === SOURCE_NODE_TYPE && editor.graph.nodes.some((n) => { return n.type === SOURCE_NODE_TYPE })){
      prevent()
    }
  })
  return editor
}

/**
* The source node of a graph
*/
export function findSourceNode(graph){
  return graph.nodes.filter((n) => { return n.type === SOURCE_NODE_TYPE })[0] || null
}

export { Editor, entryTruth }
