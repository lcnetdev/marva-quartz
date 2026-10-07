/**
 * Workflows: turns profile components into flat spreadsheet columns and resolves
 * what each cell of a record is.
 *
 * The full editor renders a component recursively (Main.vue -> Ref.vue -> Main.vue ...)
 * until it hits a Literal / LookupSimple / LookupComplex field. Here that same walk is
 * done as plain functions so one component can be spread out over many columns, and so
 * it can be done against any record (profile) not just the profile store's activeProfile.
 *
 * Nothing in here modifies a record, it is all read only.
 */

import utilsRDF from '@/lib/utils_rdf'
import utilsProfile from '@/lib/utils_profile'
import { unescape } from 'html-escaper'

const SAME_AS = 'http://www.w3.org/2002/07/owl#sameAs'

const LABEL_PREDICATES = [
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://www.loc.gov/mads/rdf/v1#authoritativeLabel',
  'http://id.loc.gov/ontologies/bibframe/code',
  'http://id.loc.gov/ontologies/bibframe/mainTitle',
  'http://id.loc.gov/ontologies/bibframe/title'
]

// structural components that are not data fields, same ones Main.vue treats as META/HIDE
const STRUCTURAL_PROPERTIES = [
  'http://id.loc.gov/ontologies/bibframe/hasInstance',
  'http://id.loc.gov/ontologies/bibframe/instanceOf',
  'http://id.loc.gov/ontologies/bibframe/hasItem',
]

// the @type found in the data for an agent doesn't always match the resourceURI of the template (same map Ref.vue uses)
const AGENT_TYPE_TEMPLATES = {
  'http://id.loc.gov/ontologies/bibframe/Person': 'lc:RT:bf2:Agent:bfPerson',
  'http://id.loc.gov/ontologies/bibframe/Family': 'lc:RT:bf2:Agent:bfFamily',
  'http://www.loc.gov/mads/rdf/v1#CorporateName': 'lc:RT:bf2:Agent:bfCorp',
  'http://id.loc.gov/ontologies/bibframe/Jurisdiction': 'lc:RT:bf2:Agent:bfJurisdiction',
  'http://id.loc.gov/ontologies/bibframe/Meeting': 'lc:RT:bf2:Agent:bfConf',
}

const MAX_DEPTH = 6

// Admin metadata is not in the profiles (the profile store strips it when they load), the
// editor puts a component for it into each record instead, from this template
export const ADMIN_METADATA_URI = 'http://id.loc.gov/ontologies/bibframe/adminMetadata'
export const ADMIN_METADATA_COMPONENT_ID = 'id_loc_gov_ontologies_bibframe_adminmetadata'
export const ADMIN_METADATA_TEMPLATE = 'lc:RT:bf2:AdminMetadata:BFDB'


/**
* What kind of field is this structure, the same decision Main.vue makes in componentType
* @param {object} structure - the pt or nested property template
* @param {object} lookupConfig - the lookupConfig from the config store
* @return {string|null} - REF, LITERAL, SIMPLE, COMPLEX, RDFTYPE, STRUCTURAL or null if it can't be rendered
*/
export function fieldType(structure, lookupConfig){
  if (!structure || !structure.valueConstraint){ return null }
  if (STRUCTURAL_PROPERTIES.includes(structure.propertyURI)){ return 'STRUCTURAL' }
  if (utilsRDF.isRdfTypePicklist(structure)){ return 'RDFTYPE' }
  if (structure.valueConstraint.valueTemplateRefs && structure.valueConstraint.valueTemplateRefs.length > 0){ return 'REF' }
  if (structure.type === 'literal'){ return 'LITERAL' }
  let useValuesFrom = structure.valueConstraint.useValuesFrom || []
  if (useValuesFrom.length == 0){ return null }
  let type = 'SIMPLE'
  for (let cs of useValuesFrom){
    if (lookupConfig[cs] && lookupConfig[cs].type.toLowerCase() == 'complex'){
      type = 'COMPLEX'
    }
  }
  return type
}

/**
* Same as Main.vue buildPropertyPath, adds this structure to the path for its level
*/
function buildPropertyPath(currentPath, level, structure){
  currentPath = currentPath.filter((v) => { return (v.level < level) })
  if (currentPath.map((v) => { return v.propertyURI }).indexOf(structure.propertyURI) == -1){
    currentPath.push({ level: level, propertyURI: structure.propertyURI })
  }
  return currentPath
}

/**
* The templates a REF structure can use, only the ones that exist in the loaded profiles
*/
function availableTemplates(structure, rtLookup){
  return structure.valueConstraint.valueTemplateRefs.filter((id) => { return rtLookup[id] }).map((id) => { return rtLookup[id] })
}

/**
* The children of a template with the key each one gets, the key is the property URI but
* a template can use the same property more than once so those get a counter
*/
function templateChildren(template, parentKey){
  let seen = {}
  let children = []
  for (let child of template.propertyTemplates){
    let count = seen[child.propertyURI] || 0
    seen[child.propertyURI] = count + 1
    let key = (parentKey ? parentKey + '|' : '') + child.propertyURI + (count > 0 ? '#' + count : '')
    children.push({ structure: child, key: key })
  }
  return children
}

function typeKey(nodeKey){
  return (nodeKey ? nodeKey + '|' : '') + '@type'
}
function valueKey(nodeKey){
  return nodeKey ? nodeKey : '@value'
}

/**
* A lookup field often just has the label "Search LCNAF" etc. which makes a bad column header
*/
function leafLabel(structure, parentStructure){
  if (parentStructure && (structure.propertyURI == SAME_AS || /^search\b/i.test(structure.propertyLabel || ''))){
    return parentStructure.propertyLabel
  }
  return structure.propertyLabel
}


/**
* Spread a component out into the columns needed to show every field it could have.
* When a component (or something nested in it) can be one of several templates
* (Person/Corporate..., LCC/DDC...) it gets a "type" column and the fields
* of all of the possible templates, a record only fills in the ones for the template it uses.
*
* @param {object} pt - the component from the (blank) profile
* @param {object} rtLookup - the rtLookup from the profile store
* @param {object} lookupConfig - the lookupConfig from the config store
* @return {array} - of {key, kind:'type'|'field', label, fieldType, template}, template is the
*   label of the template the field came from (Topic, Person...) when it is nested in one
*/
export function expandComponentColumns(pt, rtLookup, lookupConfig){
  let columns = []
  let seenKeys = {}
  let add = function(col){
    if (seenKeys[col.key]){ return }
    seenKeys[col.key] = true
    columns.push(col)
  }

  let walk = function(structure, nodeKey, parentStructure, depth, refTrail, templateLabel){
    let type = fieldType(structure, lookupConfig)
    if (!type || type == 'STRUCTURAL'){ return }

    if (type == 'REF'){
      let templates = availableTemplates(structure, rtLookup)
      if (templates.length > 1){
        add({
          key: typeKey(nodeKey),
          kind: 'type',
          label: (depth == 0) ? 'Type' : structure.propertyLabel + ' type',
          fieldType: 'TYPE',
          template: templateLabel || null,
        })
      }
      if (depth >= MAX_DEPTH){ return }
      for (let template of templates){
        // don't loop forever if a template points back to itself
        if (refTrail.includes(template.id)){ continue }
        // a nested level can itself just be labeled "Search ...", keep handing down the last real label
        let labelParent = (parentStructure && /^search\b/i.test(structure.propertyLabel || '')) ? parentStructure : structure
        for (let child of templateChildren(template, nodeKey)){
          walk(child.structure, child.key, labelParent, depth + 1, refTrail.concat([template.id]), template.resourceLabel || template.id)
        }
      }
      return
    }

    add({
      key: valueKey(nodeKey),
      kind: 'field',
      label: leafLabel(structure, parentStructure),
      fieldType: type,
      template: templateLabel || null,
    })
  }

  walk(pt, '', null, 0, [], null)
  return columns
}


/**
* The @type to put on a blank node so that it reads back as this template (the opposite of
* pickTemplate): the agent templates' resourceURI is not the type the data carries
* @param {object} template - from rtLookup
* @return {string}
*/
export function typeUriForTemplate(template){
  for (let type in AGENT_TYPE_TEMPLATES){
    let id = AGENT_TYPE_TEMPLATES[type]
    if (template.id === id || template.id === id.replace(':bf2:', ':')){ return type }
  }
  return template.resourceURI
}

/**
* When a component has several subfields with the same label (the three "Subjects" of a
* subject component, one per template) the template name tells them apart
* @param {array} columns - all the columns of the component
* @param {object} column
* @return {string} - the template name, or '' when the label is already unique
*/
export function columnHint(columns, column){
  if (!column.template){ return '' }
  let sameLabel = columns.filter((c) => { return c.label === column.label })
  return (sameLabel.length > 1) ? column.template : ''
}


/**
* Decide which of the possible templates a REF structure is using based on the data
* @param {object} structure - the REF structure
* @param {object} node - the piece of the userValue for this structure (the blank node), if there is one
* @param {array} templates - the possible templates
* @param {string} activeType - the pt.activeType if this is the top level of the component
* @return {object} - the template
*/
function pickTemplate(structure, node, templates, activeType){
  if (activeType){
    let match = templates.filter((t) => { return t.resourceURI === activeType })
    if (match.length > 0){ return match[0] }
  }
  if (node && node['@type']){
    let type = node['@type']
    let match = templates.filter((t) => { return t.id != structure.id && t.resourceURI === type })
    if (match.length > 0){ return match[0] }

    if (AGENT_TYPE_TEMPLATES[type]){
      // some profile sets name the templates without the bf2 segment
      let wanted = [AGENT_TYPE_TEMPLATES[type], AGENT_TYPE_TEMPLATES[type].replace(':bf2:', ':')]
      match = templates.filter((t) => { return wanted.includes(t.id) })
      if (match.length > 0){ return match[0] }
    }
  }
  if (node){
    // look one level down, the type that tells the templates apart can be on a value inside of it
    for (let t of templates){
      for (let key in node){
        if (Array.isArray(node[key])){
          for (let val of node[key]){
            if (val && val['@type'] && val['@type'] === t.resourceURI){
              return t
            }
          }
        }
      }
    }
  }
  return templates[0]
}


/**
* Work out the cells for one instance of a component in a record.
* The result is keyed the same as the columns from expandComponentColumns, a column
* that has no key in the result does not apply to this component (it is using a different template)
*
* Each field cell has what the editor's field components need as props (structure, propertyPath, level, guid)
*
* @param {object} pt - the component from the record
* @param {object} rtLookup - the rtLookup from the profile store
* @param {object} lookupConfig - the lookupConfig from the config store
* @return {object} - key -> cell
*/
export function resolveComponentCells(pt, rtLookup, lookupConfig){
  let cells = {}
  let guid = pt['@guid']

  let walk = function(structure, level, path, nodeKey, parentNode, depth, refTrail){
    let type = fieldType(structure, lookupConfig)
    if (!type || type == 'STRUCTURAL'){ return }

    let propertyPath = buildPropertyPath(path, level, structure)

    if (type == 'REF'){
      let templates = availableTemplates(structure, rtLookup)
      if (templates.length == 0){ return }

      // the blank node in the data for this level, if it is there yet
      let node = null
      if (parentNode && Array.isArray(parentNode[structure.propertyURI]) && parentNode[structure.propertyURI][0]){
        node = parentNode[structure.propertyURI][0]
      }

      let template = pickTemplate(structure, node, templates, (depth == 0) ? pt.activeType : null)

      if (templates.length > 1){
        cells[typeKey(nodeKey)] = {
          kind: 'type',
          guid: guid,
          structure: structure,
          propertyPath: propertyPath,
          level: level + 1,
          options: templates.map((t) => { return { id: t.id, label: t.resourceLabel } }),
          active: template,
          // has the data picked this one or is it just the first one in the list
          matched: !!(node && node['@type']) || !!(depth == 0 && pt.activeType),
          editable: true,
          // the top level is switched with the editor's changeRefTemplate, deeper ones by
          // setting the @type of the blank node the propertyPath leads to (workflowStore.setNestedType)
          depth: depth,
        }
      }
      if (depth >= MAX_DEPTH || refTrail.includes(template.id)){ return }
      for (let child of templateChildren(template, nodeKey)){
        walk(child.structure, level + 1, propertyPath, child.key, node, depth + 1, refTrail.concat([template.id]))
      }
      return
    }

    cells[valueKey(nodeKey)] = {
      kind: 'field',
      fieldType: type,
      guid: guid,
      structure: structure,
      propertyPath: propertyPath,
      level: level + 1,
    }
  }

  walk(pt, 0, [], '', pt.userValue, 0, [])
  return cells
}


/**
* The cell's propertyPath as the data really has it. The profile's path carries levels the
* userValue does not (owl:sameAs and the madsrdf componentList / Topic / Geographic levels of
* the lookups) and, for the locators, misses one (the note of a supplementary content).
* @param {object} cell - a field cell from resolveComponentCells
* @return {array} - a copy of the propertyPath, adjusted
*/
export function dataPropertyPath(cell){
  let propertyPath = JSON.parse(JSON.stringify(cell.propertyPath))
  if (cell.fieldType == 'LITERAL'){
    let isLocator = propertyPath.some((pp) => pp.propertyURI.includes("electronicLocator") || pp.propertyURI.includes("supplementaryContent"))
    if (isLocator){
      propertyPath = propertyPath.filter((v) => { return (v.propertyURI !== SAME_AS) })
      if (propertyPath.some((pp) => pp.propertyURI.includes("supplementaryContent")) && propertyPath.at(-1).propertyURI == "http://www.w3.org/2000/01/rdf-schema#label"){
        propertyPath.splice(1, 0, { level: 1, propertyURI: "http://id.loc.gov/ontologies/bibframe/note" })
        propertyPath.at(-1).level = 2
      }
    }
    return propertyPath
  }
  propertyPath = propertyPath.filter((v) => { return (v.propertyURI !== SAME_AS) })
  if (cell.fieldType == 'COMPLEX'){
    propertyPath = propertyPath.filter((v) => { return (v.propertyURI !== 'http://www.loc.gov/mads/rdf/v1#componentList') })
    propertyPath = propertyPath.filter((v) => { return (v.propertyURI !== 'http://www.loc.gov/mads/rdf/v1#Topic') })
    propertyPath = propertyPath.filter((v) => { return (v.propertyURI !== 'http://www.loc.gov/mads/rdf/v1#Geographic') })
  }
  return propertyPath
}

/**
* Some profiles put class names in a simple lookup's path, the data doesn't have those levels
*/
export function simpleLookupFallbackPath(propertyPath){
  return propertyPath.filter((v) => { return !v.propertyURI.match(/http:\/\/id\.loc\.gov\/ontologies\/bibframe\/[A-Z][a-z]+/) })
}

/**
* The values to display for a field cell. These mirror the returnLiteralValueFromProfile /
* returnSimpleLookupValueFromProfile / returnComplexLookupValueFromProfile in the profile store
* but work on the pt passed and not the activeProfile
*
* @param {object} pt - the component from the record
* @param {object} cell - a field cell from resolveComponentCells
* @return {array} - of {label, uri, lang}
*/
export function readCellValues(pt, cell){
  if (!pt || !cell || cell.kind != 'field'){ return [] }

  if (cell.fieldType == 'RDFTYPE'){
    let types = pt.userValue['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] || []
    return types.filter((t) => { return t && t['@id'] }).map((t) => { return { label: t['@id'].split(/[\/#]/).pop(), uri: t['@id'], lang: null, guid: t['@guid'] || null } })
  }

  let propertyPath = dataPropertyPath(cell)

  if (cell.fieldType == 'LITERAL'){
    let isLocator = cell.propertyPath.some((pp) => pp.propertyURI.includes("electronicLocator") || pp.propertyURI.includes("supplementaryContent"))
    if (propertyPath.length == 0){ return [] }
    let valueLocation = utilsProfile.returnValueFromPropertyPath(pt, propertyPath)
    if (!valueLocation){ return [] }
    let deepestLevelURI = propertyPath[propertyPath.length - 1].propertyURI
    let values = []
    for (let v of valueLocation){
      let value = null
      if (typeof v[deepestLevelURI] === 'string' || typeof v[deepestLevelURI] === 'number'){
        value = unescape(String(v[deepestLevelURI]))
      } else if (isLocator && v['@id']){
        value = unescape(v['@id'])
      }
      if (value !== null && value !== ''){
        values.push({ label: value, uri: null, lang: (v['@language']) ? v['@language'] : null, guid: v['@guid'] || null })
      }
    }
    return values
  }

  // the lookups
  if (propertyPath.length == 0){ return [] }

  let valueLocation = utilsProfile.returnValueFromPropertyPath(pt, propertyPath)
  if (!valueLocation && cell.fieldType == 'SIMPLE'){
    // try again without any class names that ended up in the path
    propertyPath = simpleLookupFallbackPath(propertyPath)
    if (propertyPath.length > 0){
      valueLocation = utilsProfile.returnValueFromPropertyPath(pt, propertyPath)
    }
  }
  if (!valueLocation){ return [] }

  let values = []
  for (let v of valueLocation){
    if (!v){ continue }
    let uri = (v['@id']) ? v['@id'] : null
    let label = null
    for (let lP of LABEL_PREDICATES){
      if (v[lP] && v[lP][0] && v[lP][0][lP]){
        label = v[lP][0][lP]
        break
      }
    }
    if (!label){
      // bf:title -> bf:mainTitle
      for (let lP1 of LABEL_PREDICATES){
        for (let lP2 of LABEL_PREDICATES){
          if (!label && v[lP1] && v[lP1][0] && v[lP1][0][lP2] && v[lP1][0][lP2][0] && v[lP1][0][lP2][0][lP2]){
            label = v[lP1][0][lP2][0][lP2]
          }
        }
      }
    }
    if (uri || label){
      values.push({
        label: (label) ? unescape(String(label)) : uri,
        uri: uri,
        lang: null,
        guid: v['@guid'] || null,
        // the complex lookups show how well the value is linked, same icons as the editor
        validation: (cell.fieldType == 'COMPLEX') ? validationIcon(v) : null,
      })
    }
  }
  return values
}

/**
* How well a complex lookup value is linked to authorities, the same decision as the editor's
* ValidationIcon + profileStore.returnValidationType but on the value node itself
* @param {object} node - the value's blank node from the userValue
* @return {object} - { icon: material icon name, title }
*/
export function validationIcon(node){
  if (node['@id']){ return { icon: 'verified', title: 'Linked' } }
  let components = node['http://www.loc.gov/mads/rdf/v1#componentList']
  if (Array.isArray(components) && components.length > 0){
    if (components.every((c) => { return c && c['@id'] })){ return { icon: 'done_all', title: 'Linked' } }
    if (components[0] && components[0]['@id']){ return { icon: 'warning', title: 'Partially Linked' } }
    return { icon: 'help', title: 'No Partial Link' }
  }
  return { icon: 'report', title: 'No Link' }
}


/**
* The admin metadata component as the parser/profile store build it into a record, used as the
* (blank) component to work out the columns from, since the profiles themselves don't have one
* @param {string} templateId - the admin metadata template, resolved against rtLookup
* @return {object} - a pt
*/
export function adminMetadataPt(templateId){
  return {
    id: ADMIN_METADATA_COMPONENT_ID,
    mandatory: false,
    propertyLabel: 'Admin Metadata',
    propertyURI: ADMIN_METADATA_URI,
    repeatable: false,
    resourceTemplates: [],
    type: 'resource',
    userValue: { '@root': ADMIN_METADATA_URI },
    valueConstraint: { defaults: [], useValuesFrom: [], valueDataType: {}, valueTemplateRefs: [templateId] },
  }
}

/**
* The top level components of a profile that can be picked as workflow fields
* @param {object} profile - a profile from the profile store
* @param {object} lookupConfig - the lookupConfig from the config store
* @param {string|null} adminTemplateId - include the Instance's admin metadata, with this template (see adminMetadataPt)
* @return {array} - of {rt, rtId, id, propertyURI, label}
*/
export function listProfileComponents(profile, lookupConfig, adminTemplateId = null){
  let components = []
  for (let rtId of profile.rtOrder){
    let rt = rtTypeFromId(rtId)
    // the editor only lets the Instance's (primary) admin metadata be edited, same here
    if (adminTemplateId && rt === 'Instance'){
      components.push({ rt: rt, id: ADMIN_METADATA_COMPONENT_ID, propertyURI: ADMIN_METADATA_URI, label: 'Admin Metadata' })
    }
    for (let ptId of profile.rt[rtId].ptOrder){
      let pt = profile.rt[rtId].pt[ptId]
      let type = fieldType(pt, lookupConfig)
      if (!type || type == 'STRUCTURAL'){ continue }
      components.push({
        rt: rt,
        id: pt.id,
        propertyURI: pt.propertyURI,
        label: pt.propertyLabel,
      })
    }
  }
  return components
}

/**
* lc:RT:bf2:Monograph:Work -> Work
*/
export function rtTypeFromId(rtId){
  return rtId.split(':').slice(-1)[0]
}

/**
* Find the rt in a record for a workflow component, only the first Work / Instance is used
* @param {object} profile - the record
* @param {string} rt - Work, Instance...
* @return {string|null} - the rt key
*/
export function findRtId(profile, rt){
  if (!profile || !profile.rtOrder){ return null }
  for (let rtId of profile.rtOrder){
    if (rtTypeFromId(rtId) === rt){ return rtId }
  }
  return null
}

/**
* All of the components in a record that are the workflow component, there is
* more than one if the component was repeated (two contributors, etc)
* @param {object} profile - the record
* @param {object} component - the workflow component {rt, id, propertyURI, label}
* @return {array} - of pts
*/
export function findComponentPts(profile, component){
  let rtId = findRtId(profile, component.rt)
  if (!rtId){ return [] }
  let pts = []
  for (let ptId of profile.rt[rtId].ptOrder){
    let pt = profile.rt[rtId].pt[ptId]
    if (!pt || pt.deleted){ continue }
    // repeated components get an id with a counter on the end, so match on what does not change
    if (pt.propertyURI === component.propertyURI && pt.propertyLabel === component.label){
      pts.push(pt)
    }
  }
  if (component.propertyURI === ADMIN_METADATA_URI && pts.length > 1){
    // a converted record carries the admin metadata of every MARC pass, the editor only edits
    // the one the parser marked primary
    let primary = pts.filter((pt) => { return pt.adminMetadataType === 'primary' })
    pts = (primary.length > 0) ? primary : [pts[0]]
  }
  return pts
}

/**
* The title and LCCN of a record to label its row with
* @param {object} profile - the record
* @return {object} - {title, lccn}
*/
export function recordSummary(profile){
  const TITLE = 'http://id.loc.gov/ontologies/bibframe/title'
  const MAIN_TITLE = 'http://id.loc.gov/ontologies/bibframe/mainTitle'
  const IDENTIFIED_BY = 'http://id.loc.gov/ontologies/bibframe/identifiedBy'
  const VALUE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'

  let summary = { title: null, lccn: null }
  if (!profile || !profile.rtOrder){ return summary }

  // the instance is what was scanned so use its title over the work's
  let rtIds = [findRtId(profile, 'Instance'), findRtId(profile, 'Work'), findRtId(profile, 'Hub')].filter((id) => { return id })
  for (let rtId of rtIds){
    for (let ptId of profile.rt[rtId].ptOrder){
      let pt = profile.rt[rtId].pt[ptId]
      if (!pt || pt.deleted || !pt.userValue){ continue }
      try {
        if (!summary.title && pt.propertyURI == TITLE && pt.userValue[TITLE] && pt.userValue[TITLE][0] && pt.userValue[TITLE][0][MAIN_TITLE]){
          let value = pt.userValue[TITLE][0][MAIN_TITLE][0][MAIN_TITLE]
          if (value){ summary.title = unescape(String(value)) }
        }
        if (!summary.lccn && pt.propertyURI == IDENTIFIED_BY && pt.userValue[IDENTIFIED_BY] && pt.userValue[IDENTIFIED_BY][0]){
          let bnode = pt.userValue[IDENTIFIED_BY][0]
          if (bnode['@type'] == 'http://id.loc.gov/ontologies/bibframe/Lccn' && bnode[VALUE] && bnode[VALUE][0] && bnode[VALUE][0][VALUE]){
            summary.lccn = String(bnode[VALUE][0][VALUE]).trim()
          }
        }
      } catch (e) {
        // a record with an unexpected shape just doesn't get a label
      }
    }
  }
  return summary
}

/**
* How many lines a record takes up in the sheet, a repeated component puts each repeat on its own line
* @param {object} profile - the record
* @param {array} components - the workflow components being shown
* @return {number}
*/
export function countRecordLines(profile, components){
  let count = 1
  for (let component of components){
    count = Math.max(count, findComponentPts(profile, component).length)
  }
  return count
}
