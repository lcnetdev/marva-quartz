/**
 * Workflows: the workflow screens use their own css (assets/workflows.css) but take
 * their colors from the same preferences the editor uses, this maps those preferences
 * to the css variables the workflow css is written against.
 */

const PREFERENCE_MAP = {
  '--wf-nav-background': '--c-edit-main-splitpane-nav-background-color',
  '--wf-nav-color': '--c-edit-main-splitpane-nav-font-color',
  '--wf-work-color': '--c-edit-main-splitpane-edit-background-color-work',
  '--wf-instance-color': '--c-edit-main-splitpane-edit-background-color-instance',
  '--wf-item-color': '--c-edit-main-splitpane-edit-background-color-item',
  '--wf-field-color': '--c-edit-main-splitpane-edit-field-color',
  '--wf-field-border-color': '--c-edit-main-splitpane-edit-field-border-color',
  '--wf-field-focus-color': '--c-edit-main-splitpane-edit-focused-field-color',
  '--wf-text-color': '--c-edit-main-literal-font-color',
  '--wf-modal-background': '--c-edit-modals-background-color',
  '--wf-modal-accent': '--c-edit-modals-background-color-accent',
  '--wf-modal-color': '--c-edit-modals-text-color',
  '--wf-linked-icon-color': '--c-edit-main-lookup-icon-linked-color',
}

// the colors used as backgrounds of things that sit on top of the sheet (the frozen header and
// record column), these must not let what is behind them show through
const MUST_BE_OPAQUE = ['--wf-work-color', '--wf-instance-color', '--wf-item-color', '--wf-nav-background']

/**
* The editor's color preferences can be see-through (#rrggbbaa, rgba()). Where that is a problem,
* blend the color onto white so it looks the same as it does on the editor's white page but is solid.
* @param {string} color - a css color
* @return {string} - the color, solid
*/
export function opaqueColor(color){
  let rgba = null
  let hex = color.trim().match(/^#([0-9a-f]{3,8})$/i)
  if (hex){
    let h = hex[1]
    if (h.length == 3 || h.length == 4){ h = h.split('').map((c) => { return c + c }).join('') }
    if (h.length == 8){
      rgba = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), parseInt(h.slice(6, 8), 16) / 255]
    } else {
      return color
    }
  } else {
    let fn = color.trim().match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i)
    if (!fn){ return color }
    let a = (typeof fn[4] === 'undefined') ? 1 : (fn[4].endsWith('%') ? parseFloat(fn[4]) / 100 : parseFloat(fn[4]))
    rgba = [parseFloat(fn[1]), parseFloat(fn[2]), parseFloat(fn[3]), a]
  }
  if (rgba[3] >= 1){ return color }
  let over = rgba.slice(0, 3).map((c) => { return Math.round(c * rgba[3] + 255 * (1 - rgba[3])) })
  return 'rgb(' + over.join(', ') + ')'
}

/**
* @param {object} preferenceStore - the preference store
* @return {object} - a style object to bind to the root element of a workflow screen
*/
export function workflowThemeStyle(preferenceStore){
  let style = {}
  for (let cssVar in PREFERENCE_MAP){
    let value = preferenceStore.returnValue(PREFERENCE_MAP[cssVar])
    // leave it to the default in the css if the preference isn't a usable color
    if (value && typeof value === 'string' && value != 'transparent'){
      style[cssVar] = MUST_BE_OPAQUE.includes(cssVar) ? opaqueColor(value) : value
    }
  }
  return style
}
