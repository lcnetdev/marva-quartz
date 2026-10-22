/**
 * Workflows graph: the nodes that can be put on the canvas, what each takes and gives, and what
 * it does with one line's worth of inputs.
 *
 * `inputs` and `outputs` are the ports (what wires connect to), `options` are the settings shown
 * on the node (a select, a text box, a check box), `layout` is the order they are drawn in (inputs
 * and options together, top to bottom) and `visible(options)` says which of them are shown for
 * the settings as they stand (a wired port is always shown). The canvas
 * (lib/workflows/graph/baklava.js) builds the Baklava node types from this catalog and run.js runs
 * them, so the two can not drift.
 *
 * Kinds on a port: `value` (the entries of values.js), `boolean` (one per line, the then / else
 * of a condition). An action node's `when` input takes a boolean, unconnected it is always on.
 *
 * run(inputs, options, ctx) is called once per line (run.js pairs the lines up), inputs are the
 * entries (null when nothing came in), it returns the outputs by key. Actions on the record go
 * through ctx: write(targetPortKey, entry, mode) -> Promise<string|null> (null when done,
 * otherwise why not), drop(reason), log(message). ctx.lines is the line of each component the
 * inputs came from.
 */

import { OPERATORS, compareEntries, constantEntry, entryText, entryTruth } from './values'

const WHEN = { label: 'Only when', kind: 'boolean', optional: true, hint: 'Wire a True / False of a test here, unwired this always runs' }

const NUMERIC_OPERATORS = ['lt', 'lte', 'gt', 'gte']
const EQUALITY_OPERATORS = ['equals', 'notEquals']

export const WRITE_MODES = [
  { id: 'ifEmpty', label: 'only if empty' },
  { id: 'replace', label: 'replace what is there' },
  { id: 'add', label: 'add to what is there' },
]

export const COMPARE_MODES = [
  { id: 'either', label: 'URI or label' },
  { id: 'uri', label: 'URI only' },
  { id: 'label', label: 'label only' },
]

export const TRANSFORMS = [
  { id: 'trim', label: 'trim spaces' },
  { id: 'regex', label: 'regex replace' },
  { id: 'prefix', label: 'add before' },
  { id: 'suffix', label: 'add after' },
  { id: 'upperFirst', label: 'capitalize first letter' },
  { id: 'lower', label: 'lower case' },
  { id: 'upper', label: 'upper case' },
  { id: 'stripPunctuation', label: 'strip ending punctuation' },
]

/**
* The message of a note / drop with the inputs filled into it: {a} {b} {value} {from}
*/
export function fillTemplate(text, inputs){
  return String(text || '').replace(/\{(\w+)\}/g, (m, key) => {
    return (inputs && inputs[key] !== undefined) ? entryText(inputs[key]) : m
  })
}

function gated(inputs){
  return inputs.when !== undefined && inputs.when !== null && !entryTruth(inputs.when)
}

// the test of the If-then node, shared with the combined nodes (Set value if, Drop record if...)
// that test and act in one: the same ports, settings and visibility, so they read the same way
const TEST_INPUTS = {
  a: { label: 'Value', kind: 'value', hint: 'The field to test' },
  b: { label: 'Compare with', kind: 'value', optional: true, hint: 'Another field to compare the value with, or type a text below' },
}
const TEST_OPTIONS = {
  operator: { label: 'Test', control: 'select', items: OPERATORS.map((o) => { return { value: o.id, text: o.label } }), default: 'equals' },
  constant: { label: 'or this text', control: 'text', default: '' },
  compare: { label: 'Match on', control: 'select', items: COMPARE_MODES.map((o) => { return { value: o.id, text: o.label } }), default: 'either' },
  parseYear: { label: 'Compare as years', control: 'checkbox', default: false },
}
const TEST_LAYOUT = ['a', 'operator', 'b', 'constant', 'compare', 'parseYear']
const TEST_OUTPUTS = {
  then: { label: 'True', kind: 'boolean' },
  else: { label: 'False', kind: 'boolean' },
}

function testVisible(options){
  let op = OPERATORS.filter((o) => { return o.id === options.operator })[0] || OPERATORS[0]
  return {
    b: op.needsB,
    constant: op.needsB,
    compare: EQUALITY_OPERATORS.includes(op.id),
    parseYear: NUMERIC_OPERATORS.includes(op.id),
  }
}

/**
* The test of a line: `a` against `b` or the typed text
* @return {boolean}
*/
function runTest(inputs, options){
  let b = inputs.b
  if ((b === undefined || b === null) && options.constant !== undefined){ b = constantEntry(options.constant) }
  return compareEntries(options.operator || 'empty', inputs.a, b, { compare: options.compare || 'either', parseYear: !!options.parseYear })
}

function ifThen(inputs, options){
  // gated off: neither branch
  if (gated(inputs)){ return { then: false, else: false, a: inputs.a } }
  let result = runTest(inputs, options)
  return { then: result, else: !result, a: inputs.a }
}

/**
* What a Set value writes: the wire, else the typed URI / text, else (when allowed) the tested value
*/
function valueToWrite(inputs, options, fallback){
  let entry = inputs.value
  if (entry && !entry.empty){ return entry }
  if (options.uri && String(options.uri).trim()){
    return { uri: String(options.uri).trim(), label: (options.text && String(options.text).trim()) || null, literal: null, lang: null, lines: (entry && entry.lines) || (fallback && fallback.lines) || {}, empty: false }
  }
  if (options.text && String(options.text).trim()){ return constantEntry(options.text) }
  if (fallback && !fallback.empty){ return fallback }
  return constantEntry(options.text)
}

export const NODE_TYPES = [
  {
    type: 'wf-if',
    title: 'If-then',
    category: 'Conditions',
    description: 'Test a value: is it empty, does it equal another field or a text, is it before a year. True and False go on to the actions',
    inputs: Object.assign({}, TEST_INPUTS, { when: WHEN }),
    options: Object.assign({}, TEST_OPTIONS),
    layout: TEST_LAYOUT.concat(['when']),
    visible: testVisible,
    outputs: Object.assign({}, TEST_OUTPUTS, { a: { label: 'Value (passed on)', kind: 'value' } }),
    run: ifThen,
  },
  {
    type: 'wf-set',
    title: 'Set value',
    category: 'Actions',
    description: 'Put a value into a field of the record: the connected value, or the text typed on the node',
    inputs: {
      when: WHEN,
      value: { label: 'Value from a wire', kind: 'value', optional: true, hint: 'A field or a Transform result, or type the value below' },
    },
    options: {
      target: { label: 'Into field', control: 'port', default: '' },
      text: { label: 'or this text', control: 'text', default: '' },
      uri: { label: 'or this URI (linked field)', control: 'text', default: '' },
      mode: { label: 'Write', control: 'select', items: WRITE_MODES.map((o) => { return { value: o.id, text: o.label } }), default: 'ifEmpty' },
    },
    layout: ['target', 'value', 'text', 'uri', 'mode', 'when'],
    outputs: {
      value: { label: 'Value (passed on)', kind: 'value' },
    },
    run: async function(inputs, options, ctx){
      if (gated(inputs)){ return { value: null } }
      let entry = valueToWrite(inputs, options, null)
      if (entry.empty){ return { value: entry } }
      let why = await ctx.write(options.target, entry, options.mode || 'ifEmpty')
      if (why){ ctx.log(why, 'error') }
      return { value: entry }
    },
  },
  {
    type: 'wf-copy',
    title: 'Copy value',
    category: 'Actions',
    description: 'Copy a value into a field of the record, a WorldCat value into the record\'s field for instance',
    inputs: {
      when: WHEN,
      from: { label: 'Value to copy', kind: 'value' },
    },
    options: {
      target: { label: 'Into field', control: 'port', default: '' },
      mode: { label: 'Write', control: 'select', items: WRITE_MODES.map((o) => { return { value: o.id, text: o.label } }), default: 'ifEmpty' },
    },
    layout: ['from', 'target', 'mode', 'when'],
    outputs: {
      value: { label: 'Value (passed on)', kind: 'value' },
    },
    run: async function(inputs, options, ctx){
      if (gated(inputs)){ return { value: null } }
      let entry = inputs.from
      if (!entry || entry.empty){ return { value: entry } }
      let why = await ctx.write(options.target, entry, options.mode || 'ifEmpty')
      if (why){ ctx.log(why, 'error') }
      return { value: entry }
    },
  },
  {
    type: 'wf-transform',
    title: 'Transform',
    category: 'Values',
    description: 'Change a text: trim, regex replace, add before or after. Connect the result to Set value',
    inputs: {
      value: { label: 'Value', kind: 'value' },
    },
    options: {
      transform: { label: 'Do', control: 'select', items: TRANSFORMS.map((o) => { return { value: o.id, text: o.label } }), default: 'trim' },
      pattern: { label: 'Pattern / text', control: 'text', default: '' },
      replacement: { label: 'Replace with', control: 'text', default: '' },
    },
    layout: ['value', 'transform', 'pattern', 'replacement'],
    visible: function(options){
      return {
        pattern: ['regex', 'prefix', 'suffix'].includes(options.transform),
        replacement: options.transform === 'regex',
      }
    },
    outputs: {
      value: { label: 'Result', kind: 'value' },
    },
    run: function(inputs, options){
      let entry = inputs.value
      if (!entry || entry.empty){ return { value: entry || null } }
      let text = entryText(entry)
      let pattern = (options.pattern === undefined || options.pattern === null) ? '' : String(options.pattern)
      switch (options.transform || 'trim'){
        case 'trim': text = text.trim(); break
        case 'regex':
          try { text = text.replace(new RegExp(pattern, 'g'), (options.replacement === undefined || options.replacement === null) ? '' : String(options.replacement)) } catch (e) { /* a bad pattern changes nothing */ }
          break
        case 'prefix': text = pattern + text; break
        case 'suffix': text = text + pattern; break
        case 'upperFirst': text = text.charAt(0).toUpperCase() + text.slice(1); break
        case 'lower': text = text.toLowerCase(); break
        case 'upper': text = text.toUpperCase(); break
        case 'stripPunctuation': text = text.replace(/[\s.,;:\/]+$/, ''); break
        default: break
      }
      let out = constantEntry(text)
      out.lines = entry.lines
      out.lang = entry.lang || null
      return { value: out }
    },
  },
  {
    type: 'wf-drop',
    title: 'Drop record',
    category: 'Actions',
    description: 'The record is not put on the sheet. It is listed in the sheet\'s log with the reason',
    inputs: {
      when: WHEN,
      value: { label: 'Value for the reason', kind: 'value', optional: true, hint: 'Shown in the reason as {value}' },
    },
    options: {
      reason: { label: 'Reason', control: 'text', default: 'Dropped by the workflow' },
    },
    layout: ['when', 'reason', 'value'],
    outputs: {},
    run: function(inputs, options, ctx){
      if (gated(inputs)){ return {} }
      ctx.drop(fillTemplate(options.reason || 'Dropped by the workflow', inputs))
      return {}
    },
  },
  {
    type: 'wf-flag',
    title: 'Set warning flag',
    category: 'Actions',
    description: 'Flag the record on the sheet with a warning for the cataloger to look at. The record itself is not changed',
    inputs: {
      when: WHEN,
      value: { label: 'Value for the warning', kind: 'value', optional: true, hint: 'Shown in the warning as {value}' },
    },
    options: {
      text: { label: 'Warning', control: 'text', default: '' },
    },
    layout: ['when', 'text', 'value'],
    outputs: {},
    run: function(inputs, options, ctx){
      if (gated(inputs)){ return {} }
      ctx.log(fillTemplate(options.text || 'Warning', inputs), 'flag')
      return {}
    },
  },

  // ---- the combined nodes: an If-then and an action in one, for the common case of one test, one action

  {
    type: 'wf-set-if',
    title: 'Set value if',
    category: 'Combined',
    description: 'Test a value and, when the test passes, put a value into a field: the tested value itself, another wire, or the text typed on the node',
    inputs: Object.assign({}, TEST_INPUTS, {
      value: { label: 'Value to write', kind: 'value', optional: true, hint: 'Unwired, the text below is written, or without one the tested value itself' },
      when: WHEN,
    }),
    options: Object.assign({}, TEST_OPTIONS, {
      // "Then" on the first setting of the action half, so the node reads test, then action
      target: { label: 'Then, into field', control: 'port', default: '' },
      text: { label: 'or write this text', control: 'text', default: '' },
      uri: { label: 'or write this URI', control: 'text', default: '' },
      mode: { label: 'Write', control: 'select', items: WRITE_MODES.map((o) => { return { value: o.id, text: o.label } }), default: 'ifEmpty' },
    }),
    layout: TEST_LAYOUT.concat(['target', 'value', 'text', 'uri', 'mode', 'when']),
    visible: testVisible,
    outputs: Object.assign({}, TEST_OUTPUTS, { value: { label: 'Value (passed on)', kind: 'value' } }),
    run: async function(inputs, options, ctx){
      if (gated(inputs)){ return { then: false, else: false, value: null } }
      let result = runTest(inputs, options)
      if (!result){ return { then: false, else: true, value: null } }
      let entry = valueToWrite(inputs, options, inputs.a)
      if (!entry.empty){
        let why = await ctx.write(options.target, entry, options.mode || 'ifEmpty')
        if (why){ ctx.log(why, 'error') }
      }
      return { then: true, else: false, value: entry }
    },
  },
  {
    type: 'wf-drop-if',
    title: 'Drop record if',
    category: 'Combined',
    description: 'Test a value and, when the test passes, keep the record off the sheet. It is listed in the sheet\'s log with the reason',
    inputs: Object.assign({}, TEST_INPUTS, { when: WHEN }),
    options: Object.assign({}, TEST_OPTIONS, {
      reason: { label: 'Then drop, reason', control: 'text', default: 'Dropped by the workflow', placeholder: '{value} is the tested value' },
    }),
    layout: TEST_LAYOUT.concat(['reason', 'when']),
    visible: testVisible,
    outputs: Object.assign({}, TEST_OUTPUTS, { a: { label: 'Value (passed on)', kind: 'value' } }),
    run: function(inputs, options, ctx){
      if (gated(inputs)){ return { then: false, else: false, a: inputs.a } }
      let result = runTest(inputs, options)
      if (result){ ctx.drop(fillTemplate(options.reason || 'Dropped by the workflow', Object.assign({ value: inputs.a }, inputs))) }
      return { then: result, else: !result, a: inputs.a }
    },
  },
  {
    type: 'wf-flag-if',
    title: 'Set warning flag if',
    category: 'Combined',
    description: 'Test a value and, when the test passes, flag the record on the sheet with a warning. The record itself is not changed',
    inputs: Object.assign({}, TEST_INPUTS, { when: WHEN }),
    options: Object.assign({}, TEST_OPTIONS, {
      text: { label: 'Then warn', control: 'text', default: '', placeholder: '{value} is the tested value' },
    }),
    layout: TEST_LAYOUT.concat(['text', 'when']),
    visible: testVisible,
    outputs: Object.assign({}, TEST_OUTPUTS, { a: { label: 'Value (passed on)', kind: 'value' } }),
    run: function(inputs, options, ctx){
      if (gated(inputs)){ return { then: false, else: false, a: inputs.a } }
      let result = runTest(inputs, options)
      if (result){ ctx.log(fillTemplate(options.text || 'Warning', Object.assign({ value: inputs.a }, inputs)), 'flag') }
      return { then: result, else: !result, a: inputs.a }
    },
  },
]

/**
* The order a node's inputs and options are drawn in
* @param {object} definition
* @return {array} - of keys
*/
export function nodeLayout(definition){
  let keys = Object.keys(definition.inputs).concat(Object.keys(definition.options))
  if (!definition.layout){ return keys }
  return definition.layout.concat(keys.filter((k) => { return !definition.layout.includes(k) }))
}

/**
* Which inputs and options are shown for the settings as they stand
* @param {object} definition
* @param {object} options - from nodeOptions
* @return {object} - key -> boolean, a key that is not there is shown
*/
export function nodeVisibility(definition, options){
  return definition.visible ? definition.visible(options) : {}
}

export function nodeType(type){
  return NODE_TYPES.filter((n) => { return n.type === type })[0] || null
}

/**
* The option values of a saved node, with the defaults for anything it does not have
* @param {object} definition - from NODE_TYPES
* @param {object} nodeState - the node from the saved graph (Baklava's state), its options sit in `inputs`
* @return {object}
*/
export function nodeOptions(definition, nodeState){
  let options = {}
  for (let key in definition.options){
    let saved = nodeState && nodeState.inputs && nodeState.inputs[key]
    options[key] = (saved && saved.value !== undefined && saved.value !== null) ? saved.value : definition.options[key].default
  }
  return options
}
