/**
 * Workflows: the workflow screens use their own css (assets/workflows.css) but take
 * their colors from the same preferences the editor uses, this maps those preferences
 * to the css variables the workflow css is written against.
 *
 * The variables are set on the <html> element while a workflow screen is open (see
 * applyWorkflowTheme) rather than on the screen's own root, because the menus
 * (floating-vue poppers) are rendered at the end of <body>, outside of the screen.
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
  '--wf-button-background': '--c-edit-general-action-button-background-color',
  '--wf-button-color': '--c-edit-general-action-button-color',
}

// the colors used as backgrounds of things that sit on top of the sheet (the frozen header and
// record column), these must not let what is behind them show through
const MUST_BE_OPAQUE = ['--wf-work-color', '--wf-instance-color', '--wf-item-color', '--wf-nav-background']

// the shades of gray the sheet is drawn with (grid lines, the header strip, cells that don't apply, muted text)
// have no preference of their own, they are mixed from the text color onto the background so they suit
// whatever the user picked. The number is how much of the text color goes into the mix.
const DERIVED = {
  '--wf-line-color': { light: 0.16, dark: 0.22 },
  '--wf-head-background': { light: 0.04, dark: 0.12 },
  '--wf-na-color': { light: 0.07, dark: 0.07 },
  '--wf-na-hatch-color': { light: 0.16, dark: 0.2 },
  '--wf-muted-color': { light: 0.6, dark: 0.6 },
  '--wf-canvas-background': { light: 0.1, dark: 0.1 },
}

// every variable the theme may set, so they can all be cleared again
const ALL_VARIABLES = Object.keys(PREFERENCE_MAP).concat(Object.keys(DERIVED), ['--wf-page-background'])

// a page darker than this is a dark theme and gets the dark set of status colors, see :root.wf-dark in the css
const DARK_BELOW = 0.45

let canvas = null

/**
* Read a css color the way the browser does, so names ("whitesmoke"), #rgb, #rrggbbaa, rgb() and hsl() all work
* @param {string} color - a css color
* @return {array|null} - [r, g, b, a] with 0-255 channels and 0-1 alpha, null if it is not a color
*/
export function parseColor(color){
  if (!color || typeof color !== 'string'){ return null }
  color = color.trim()
  if (color == '' || color == 'transparent'){ return null }
  if (typeof document === 'undefined'){ return null }
  if (!canvas){
    canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    if (!canvas){ return null }
  }
  // an invalid color leaves the previous fillStyle in place, setting it twice from different starting points tells those apart
  canvas.fillStyle = '#000000'
  canvas.fillStyle = color
  let first = canvas.fillStyle
  canvas.fillStyle = '#ffffff'
  canvas.fillStyle = color
  if (first !== canvas.fillStyle){ return null }
  // the canvas gives back #rrggbb for solid colors and rgba(r, g, b, a) otherwise
  let hex = first.match(/^#([0-9a-f]{6})$/i)
  if (hex){
    return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16), 1]
  }
  let fn = first.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i)
  if (!fn){ return null }
  return [parseFloat(fn[1]), parseFloat(fn[2]), parseFloat(fn[3]), (typeof fn[4] === 'undefined') ? 1 : parseFloat(fn[4])]
}

/**
* @param {array} rgba
* @return {string} - a css color
*/
function toCss(rgba){
  let rgb = rgba.slice(0, 3).map((c) => { return Math.round(c) })
  return (rgba[3] >= 1) ? 'rgb(' + rgb.join(', ') + ')' : 'rgba(' + rgb.join(', ') + ', ' + rgba[3] + ')'
}

/**
* Lay one color over another
* @param {array} top - [r, g, b, a]
* @param {array} under - [r, g, b, a], taken as solid
* @param {number} amount - how much of the top color shows, 0-1, on top of its own alpha
* @return {array} - [r, g, b, 1]
*/
function blend(top, under, amount){
  let a = top[3] * amount
  return [0, 1, 2].map((i) => { return top[i] * a + under[i] * (1 - a) }).concat([1])
}

/**
* How light a color is, 0 (black) to 1 (white)
* @param {array} rgba
* @return {number}
*/
export function luminance(rgba){
  let [r, g, b] = rgba.slice(0, 3).map((c) => {
    c = c / 255
    return (c <= 0.03928) ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
* The editor's color preferences can be see-through (#rrggbbaa, rgba()). Where that is a problem,
* blend the color onto white so it looks the same as it does on the editor's white page but is solid.
* @param {string} color - a css color
* @return {string} - the color, solid
*/
export function opaqueColor(color){
  let rgba = parseColor(color)
  if (!rgba || rgba[3] >= 1){ return color }
  return toCss(blend(rgba, [255, 255, 255, 1], 1))
}

/**
* The css variables for the workflow screens, from the editor's color preferences
* @param {object} preferenceStore - the preference store
* @return {object} - { variables: {'--wf-...': color}, dark: boolean }
*/
export function workflowTheme(preferenceStore){
  let variables = {}
  for (let cssVar in PREFERENCE_MAP){
    let value = preferenceStore.returnValue(PREFERENCE_MAP[cssVar])
    // leave it to the default in the css if the preference isn't a usable color
    if (value && typeof value === 'string' && value != 'transparent'){
      variables[cssVar] = MUST_BE_OPAQUE.includes(cssVar) ? opaqueColor(value) : value
    }
  }

  // the page behind the cells: the field color when it is a solid color, otherwise the editor's modal background,
  // which is its page color (white by default, dark gray in dark mode)
  let field = parseColor(variables['--wf-field-color'])
  let page = (field && field[3] >= 1) ? field : parseColor(variables['--wf-modal-background'])
  if (!page){ page = [255, 255, 255, 1] }
  variables['--wf-page-background'] = toCss(page)
  // see-through fields show the page
  if (!field || field[3] < 1){ variables['--wf-field-color'] = toCss(field ? blend(field, page, 1) : page) }

  let dark = luminance(page) < DARK_BELOW
  let text = parseColor(variables['--wf-text-color'])
  // no text color, or one that can't be read against the page (half-applied theme): plain white or black
  if (!text || Math.abs(luminance(text) - luminance(page)) < 0.3){
    text = dark ? [255, 255, 255, 1] : [0, 0, 0, 1]
    variables['--wf-text-color'] = toCss(text)
  }
  for (let cssVar in DERIVED){
    variables[cssVar] = toCss(blend(text, page, DERIVED[cssVar][dark ? 'dark' : 'light']))
  }

  return { variables: variables, dark: dark }
}

/**
* Put the theme on the document, for a workflow screen and its menus
* @param {object} preferenceStore - the preference store
* @return {void}
*/
export function applyWorkflowTheme(preferenceStore){
  if (typeof document === 'undefined'){ return }
  let theme = workflowTheme(preferenceStore)
  let root = document.documentElement
  for (let cssVar of ALL_VARIABLES){
    if (theme.variables[cssVar]){
      root.style.setProperty(cssVar, theme.variables[cssVar])
    } else {
      root.style.removeProperty(cssVar)
    }
  }
  // wf-theme: a workflow screen is open, the menus follow its colors. wf-dark: with the dark set of status colors
  root.classList.add('wf-theme')
  root.classList.toggle('wf-dark', theme.dark)
}

/**
* Take the theme off the document again, when the workflow screen is left
* @return {void}
*/
export function removeWorkflowTheme(){
  if (typeof document === 'undefined'){ return }
  let root = document.documentElement
  for (let cssVar of ALL_VARIABLES){ root.style.removeProperty(cssVar) }
  root.classList.remove('wf-theme', 'wf-dark')
}
