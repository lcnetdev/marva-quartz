/**
 * Workflows: which fields a sheet shows, remembered and saved as named "field sets".
 *
 * A sheet's fields are the components of its session (session.definition.components: the order,
 * and each one's hiddenColumns, the subfields turned off) along with session.hiddenComponents,
 * the ones unchecked in the Fields menu. That is a "selection" here:
 *   { components: [{rt, id, hiddenColumns: [columnKey]}], hidden: ['rt|id'] }
 *
 * Two things are kept in the editor's preferences (preference store, the
 * '--o-workflows-field-sets' object, so they are saved with the preferences and go to the backend
 * with them):
 *   current: { "<workflow id>": selection }   the fields the person last had on a sheet of that
 *                                             workflow; a sheet of it opens with these, not the
 *                                             workflow's own list, once there are any
 *   sets:    [{ id, name, profileId, components, hidden, created, updated }]
 *                                             the named sets, buttons at the top of the Fields menu
 */

import short from 'short-uuid'

export const FIELD_SETS_PREFERENCE = '--o-workflows-field-sets'

/**
* The selection a session has now
* @param {object} session
* @return {object} - {components, hidden}
*/
export function selectionOf(session){
  if (!session || !session.definition){ return { components: [], hidden: [] } }
  return {
    components: session.definition.components.map((c) => {
      return { rt: c.rt, id: c.id, hiddenColumns: (c.hiddenColumns || []).slice() }
    }),
    hidden: (session.hiddenComponents || []).slice(),
  }
}

function componentKey(c){
  return c.rt + '|' + c.id
}

/**
* A selection in a form that compares: the order of the components matters, the order of the
* hidden subfields and hidden components does not
* @param {object} selection
* @return {string}
*/
export function selectionKey(selection){
  if (!selection){ return '' }
  let components = (selection.components || []).map((c) => {
    return componentKey(c) + '[' + (c.hiddenColumns || []).slice().sort().join(',') + ']'
  })
  let hidden = (selection.hidden || []).slice().sort()
  return components.join(';') + '//' + hidden.join(';')
}

export function sameSelection(a, b){
  return selectionKey(a) === selectionKey(b)
}

/**
* Turn a selection into the components of a session, matched up to the profile. Components the
* profile does not have are left out, so are hidden keys of components not in the selection.
* @param {object} selection - {components, hidden}
* @param {array} available - the profile's components (workflowStore.returnProfileComponents),
*   [{rt, id, propertyURI, label, ...}]
* @return {object|null} - {components, hidden} ready to put on a session, null when nothing matched
*/
export function resolveSelection(selection, available){
  if (!selection || !Array.isArray(selection.components) || !Array.isArray(available)){ return null }
  let components = []
  for (let c of selection.components){
    let match = available.filter((a) => { return a.rt === c.rt && a.id === c.id })[0]
    if (match){
      components.push(Object.assign({}, match, { hiddenColumns: (c.hiddenColumns || []).slice() }))
    }
  }
  if (components.length == 0){ return null }
  let keys = components.map(componentKey)
  let hidden = (selection.hidden || []).filter((k) => { return keys.includes(k) })
  return { components: components, hidden: hidden }
}

/**
* What the preference holds, with the shape filled in
* @param {*} value - the preference's value
* @return {object} - {sets: [], current: {}}
*/
export function readFieldSets(value){
  let data = (value && typeof value === 'object' && !Array.isArray(value)) ? value : {}
  return {
    sets: Array.isArray(data.sets) ? data.sets.filter((s) => { return s && s.id && s.name }) : [],
    current: (data.current && typeof data.current === 'object') ? data.current : {},
  }
}

/**
* A named set made of a selection
* @param {string} name
* @param {string} profileId - the profile the components belong to
* @param {object} selection
* @return {object}
*/
export function newFieldSet(name, profileId, selection){
  return {
    id: 'fs-' + short.generate(),
    name: name,
    profileId: profileId,
    components: JSON.parse(JSON.stringify(selection.components || [])),
    hidden: (selection.hidden || []).slice(),
    created: Date.now(),
    updated: Date.now(),
  }
}

/**
* Put a set into the list: in place of the one with the same name for the same profile (names
* are compared without case), or on the end
* @param {array} sets
* @param {object} set - from newFieldSet
* @return {array} - the new list
*/
export function upsertFieldSet(sets, set){
  let name = set.name.trim().toLowerCase()
  let idx = sets.findIndex((s) => { return s.profileId === set.profileId && s.name.trim().toLowerCase() === name })
  let list = sets.slice()
  if (idx < 0){
    list.push(set)
  } else {
    list[idx] = Object.assign({}, set, { id: sets[idx].id, created: sets[idx].created || set.created })
  }
  return list
}
