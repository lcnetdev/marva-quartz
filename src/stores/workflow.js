import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { useConfigStore } from './config'
import { usePreferenceStore } from './preference'
import { useProfileStore } from './profile'

import utilsNetwork from '@/lib/utils_network'
import utilsParse from '@/lib/utils_parse'
import utilsExport from '@/lib/utils_export'
import utilsProfile from '@/lib/utils_profile'

import workflowStorage from '@/lib/workflows/storage'
import builtinWorkflows from '@/lib/workflows/builtin'
import { runEnrichments } from '@/lib/workflows/enrichments'
import { expandComponentColumns, listProfileComponents, findRtId, findComponentPts, recordSummary, typeUriForTemplate, adminMetadataPt, ADMIN_METADATA_COMPONENT_ID, ADMIN_METADATA_TEMPLATE } from '@/lib/workflows/fields'
import { inspectRecord, recommendCandidate } from '@/lib/workflows/disambiguate'
import { CIP_ENRICHMENT_ID, cipQuery, fetchCipLookup, summarizeCip, scrubForeignData, recordUris, copyCellValue, copyComponentValue, componentIsEmpty } from '@/lib/workflows/cip'

import short from 'short-uuid'

/*
  Workflows keep many records open at once, the profile store only knows about one (activeProfile).

  Each row of a workflow session holds its own record (row.profile) in this store. To reuse
  the profile store's editing functions and the editor's field components, which all
  work on activeProfile, the row being worked on is made the activeProfile ("activating" the row).
  It is the same object, so edits made through the profile store land in the row's record.

  Two things have shared state that can't be used by two records at the same time:
    - parsing a record (utilsParse keeps the XML being parsed), these are run one at a time on loadChain
    - anything that needs a row that is not the active one to be the activeProfile for a moment
      (building its XML, posting it), these are run one at a time on opChain while the grid is locked (busy)
*/
let loadChain = Promise.resolve()
let opChain = Promise.resolve()
let saveTimeout = null
let listeningToProfileStore = false

// record XML already fetched while telling scan matches apart, url -> xml, used once by buildRecordFromUrl
const prefetched = {}

// how many records are fetched from the network at the same time. Fetching is the slow part of
// loading and is done in parallel, only the parsing has to go one at a time (loadChain)
const MAX_PARALLEL_FETCHES = 5
let fetching = 0
const fetchWaiting = []

/**
* Run a fetch when there is a slot free, at most MAX_PARALLEL_FETCHES at once
* @param {function} fn - returns a promise
* @return {Promise}
*/
function fetchSlot(fn){
  return new Promise((resolve, reject) => {
    let start = async () => {
      fetching++
      try {
        resolve(await fn())
      } catch (e) {
        reject(e)
      } finally {
        fetching--
        if (fetchWaiting.length > 0){ fetchWaiting.shift()() }
      }
    }
    if (fetching < MAX_PARALLEL_FETCHES){ start() } else { fetchWaiting.push(start) }
  })
}

/**
* The scan box has the focus by default, when a cell is selected the keyboard should go to the sheet instead
*/
function leaveTheScanBox(){
  let el = document.activeElement
  if (el && el.closest && el.closest('.wf-bar') && el.blur){ el.blur() }
}

function enqueue(chainName, fn){
  let run
  if (chainName == 'load'){
    run = loadChain.then(fn, fn)
    loadChain = run.catch(() => {})
  } else {
    run = opChain.then(fn, fn)
    opChain = run.catch(() => {})
  }
  return run
}

export const useWorkflowStore = defineStore('workflow', {
  state: () => ({

    // has the saved data been read from storage
    initialized: false,

    // the workflow definitions the user made
    definitions: [],

    // the saved sessions (just the stored data, not the records)
    sessions: [],

    // the session that is open in the grid
    activeSession: null,

    // the id of the row that is currently the profile store's activeProfile
    activeRowId: null,

    // the cell being edited {rowId, guid, key}
    editingCell: null,

    // the cell that is selected (outlined, not open for editing) {rowId, line, col}
    // line is the line of the record, col the position in the sheet counting all of the visible columns
    selectedCell: null,

    // when a scan matches more than one record the questions wait here for the user, the first one is shown
    prompts: [],

    // short lived notices shown in the grid
    messages: [],

    // set to a label while something is running that needs the grid to be locked
    busy: null,

    // the result of the last post that failed, shown in a modal
    postError: null,

    // the widths the user dragged columns to, by the kind of column so it is used in every sheet
    columnWidths: {},
    // per workflow choices, workflow id -> { autoFormat: 'print'|'ebook' } see storage.js
    preferences: {},

  }),

  getters: {

    /**
    * Is the feature turned on for this user / environment
    * @return {boolean}
    */
    enabled: () => {
      if (usePreferenceStore().featureFlags.includes('workflows')){ return true }
      return useConfigStore().returnUrls.enableWorkflows === true
    },

    /**
    * The built in workflows and the ones the user made
    * @return {array}
    */
    allDefinitions: (state) => {
      return builtinWorkflows.concat(state.definitions)
    },

    activeRow: (state) => {
      if (!state.activeSession){ return null }
      return state.activeSession.rows.filter((r) => { return r.id === state.activeRowId })[0] || null
    },

    /**
    * The components of the open session with the columns each one spreads out into
    * @return {array} - of {component, key, hidden, columns, allColumns}, columns leaves out the
    *   subfields the component has turned off (component.hiddenColumns), allColumns has every one
    */
    columnGroups: (state) => {
      if (!state.activeSession){ return [] }
      let profileStore = useProfileStore()
      let lookupConfig = useConfigStore().lookupConfig
      let baseProfile = findBaseProfile(state.activeSession.definition.profileId)
      if (!baseProfile){ return [] }

      let groups = []
      for (let component of state.activeSession.definition.components){
        let key = component.rt + '|' + component.id
        let pt = findComponentTemplate(baseProfile, component)
        if (!pt){ continue }
        let allColumns = expandComponentColumns(pt, profileStore.rtLookup, lookupConfig)
        let hiddenColumns = component.hiddenColumns || []
        groups.push({
          component: component,
          key: key,
          hidden: state.activeSession.hiddenComponents.includes(key),
          allColumns: allColumns,
          columns: allColumns.filter((c) => { return !hiddenColumns.includes(c.key) }),
        })
      }
      return groups
    },

    /**
    * The components of the session's profile that are not in the sheet yet and could be added
    * @return {array} - of components, same shape as the definition's components
    */
    addableComponents: (state) => {
      if (!state.activeSession){ return [] }
      let baseProfile = findBaseProfile(state.activeSession.definition.profileId)
      if (!baseProfile){ return [] }
      let inUse = state.activeSession.definition.components.map((c) => { return c.rt + '|' + c.id })
      return listProfileComponents(baseProfile, useConfigStore().lookupConfig, adminMetadataTemplate()).filter((c) => {
        return !inUse.includes(c.rt + '|' + c.id)
      })
    },

  },

  actions: {

    /**
    * Read the saved workflows and sessions, and start listening for edits made through the profile store
    * @return {void}
    */
    async init(){
      if (!listeningToProfileStore){
        listeningToProfileStore = true
        // every edit the profile store makes ends by calling dataChanged. Detached, otherwise
        // pinia ties the listener to whichever component called init (the workflows list) and
        // drops it when that component is unmounted, that is when the user goes into a sheet
        useProfileStore().$onAction(({ name }) => {
          if (name === 'dataChanged'){
            this.activeRowChanged()
          }
        }, true)
      }
      this.definitions = await workflowStorage.listDefinitions()
      this.sessions = await workflowStorage.listSessions()
      this.columnWidths = await workflowStorage.getColumnWidths()
      this.preferences = await workflowStorage.getPreferences()
      this.initialized = true
    },

    /**
    * Remember the width of a kind of column
    * @param {string} key - the kind of column, component id + column key
    * @param {number|null} width - in pixels, null to go back to the default width
    * @param {boolean} save - store it, false while the column is still being dragged
    * @return {void}
    */
    setColumnWidth(key, width, save = true){
      if (width === null){
        delete this.columnWidths[key]
      } else {
        this.columnWidths[key] = Math.round(width)
      }
      if (save){
        workflowStorage.saveColumnWidths(JSON.parse(JSON.stringify(this.columnWidths)))
      }
    },

    /**
    * The format (print/ebook) a workflow always takes when a scan matches several records, if one was chosen
    * @param {string} workflowId
    * @return {string|null}
    */
    returnAutoFormat(workflowId){
      let pref = this.preferences[workflowId]
      return (pref && pref.autoFormat) ? pref.autoFormat : null
    },

    /**
    * Remember (or forget, with null) which format a workflow always takes
    * @param {string} workflowId
    * @param {string|null} format - 'print' | 'ebook' | null
    * @return {void}
    */
    setAutoFormat(workflowId, format){
      if (format){
        this.preferences[workflowId] = Object.assign({}, this.preferences[workflowId], { autoFormat: format })
      } else if (this.preferences[workflowId]){
        delete this.preferences[workflowId].autoFormat
        if (Object.keys(this.preferences[workflowId]).length == 0){ delete this.preferences[workflowId] }
      }
      workflowStorage.savePreferences(JSON.parse(JSON.stringify(this.preferences)))
    },

    notify(text, type = 'info'){
      let message = { id: short.generate(), text: text, type: type }
      this.messages.push(message)
      window.setTimeout(() => {
        this.messages = this.messages.filter((m) => { return m.id !== message.id })
      }, (type == 'error') ? 12000 : 5000)
    },

    dismissMessage(id){
      this.messages = this.messages.filter((m) => { return m.id !== id })
    },

    // ---------------------------------------------------------------- definitions

    /**
    * The components of a profile that can be used in a workflow
    * @param {string} profileId - the instance rt id of the starting point, lc:RT:bf2:Monograph:Instance
    * @return {array}
    */
    returnProfileComponents(profileId){
      let baseProfile = findBaseProfile(profileId)
      if (!baseProfile){ return [] }
      return listProfileComponents(baseProfile, useConfigStore().lookupConfig, adminMetadataTemplate())
    },

    /**
    * The columns (subfields) a component of a profile spreads out into
    * @param {string} profileId
    * @param {object} component - {rt, id}
    * @return {array} - of {key, kind, label, fieldType}
    */
    returnComponentColumns(profileId, component){
      let baseProfile = findBaseProfile(profileId)
      if (!baseProfile){ return [] }
      let pt = findComponentTemplate(baseProfile, component)
      if (!pt){ return [] }
      return expandComponentColumns(pt, useProfileStore().rtLookup, useConfigStore().lookupConfig)
    },

    /**
    * Match the components of a definition up to the profile, drops the ones the profile doesn't have
    * @param {object} definition
    * @return {object|null} - a copy of the definition ready to use, null if the profile is not loaded
    */
    resolveDefinition(definition){
      let available = this.returnProfileComponents(definition.profileId)
      if (available.length == 0){ return null }
      let resolved = JSON.parse(JSON.stringify(definition))
      resolved.components = []
      for (let c of definition.components){
        let match = available.filter((a) => { return a.rt === c.rt && a.id === c.id })[0]
        if (match){
          resolved.components.push(Object.assign({}, match, { hiddenColumns: c.hiddenColumns || [] }))
        } else {
          console.warn('Workflows: the profile', definition.profileId, 'has no component', c.rt, c.id)
        }
      }
      return resolved
    },

    async saveDefinition(definition){
      let toSave = JSON.parse(JSON.stringify(definition))
      if (!toSave.id){
        toSave.id = 'wf-' + short.generate()
        toSave.created = Date.now()
      }
      toSave.builtin = false
      toSave.updated = Date.now()
      await workflowStorage.saveDefinition(toSave)
      this.definitions = await workflowStorage.listDefinitions()
      return toSave
    },

    async deleteDefinition(id){
      await workflowStorage.deleteDefinition(id)
      this.definitions = await workflowStorage.listDefinitions()
    },

    // ---------------------------------------------------------------- sessions

    /**
    * Make a new blank session from a workflow
    * @param {string} definitionId
    * @param {string|null} name - what to call the sheet, the workflow's name when not given
    * @return {string|null} - the id of the new session
    */
    async startSession(definitionId, name = null){
      let definition = this.allDefinitions.filter((d) => { return d.id === definitionId })[0]
      if (!definition){ return null }
      let resolved = this.resolveDefinition(definition)
      if (!resolved){
        alert('The profile this workflow uses (' + definition.profileId + ') is not available.')
        return null
      }
      name = (typeof name === 'string') ? name.trim() : ''
      let session = {
        id: 'ws-' + short.generate(),
        workflowId: definition.id,
        name: name || definition.name,
        created: Date.now(),
        updated: Date.now(),
        definition: resolved,
        hiddenComponents: [],
        rows: [],
      }
      await workflowStorage.saveSession(session)
      this.sessions = await workflowStorage.listSessions()
      return session.id
    },

    /**
    * Open a saved session in the grid and load its records back in
    * @param {string} sessionId
    * @return {boolean} - false if there is no session with that id
    */
    async openSession(sessionId){
      await this.closeSession()
      let stored = await workflowStorage.getSession(sessionId)
      if (!stored){ return false }

      this.activeSession = {
        id: stored.id,
        workflowId: stored.workflowId,
        name: stored.name,
        created: stored.created,
        definition: stored.definition,
        hiddenComponents: stored.hiddenComponents || [],
        rows: (stored.rows || []).map((r) => {
          return Object.assign(newRow(r.scanned), r, { status: 'loading', profile: null })
        }),
      }

      for (let row of this.activeSession.rows){
        this.loadRow(row.id)
      }
      return true
    },

    /**
    * Leaving the grid, save anything pending and let go of the records
    * @return {void}
    */
    async closeSession(){
      if (!this.activeSession){ return }
      window.clearTimeout(saveTimeout)
      let row = this.activeRow
      if (row && row.dirty){
        await this.saveRow(row.id)
      }
      await this.persistSession()
      this.editingCell = null
      this.selectedCell = null
      this.activeRowId = null
      this.activeSession = null
      this.prompts = []
      useProfileStore().prepareForNewRecord()
    },

    async deleteSession(sessionId){
      await workflowStorage.deleteSession(sessionId)
      this.sessions = await workflowStorage.listSessions()
    },

    /**
    * Give a session (sheet) another name, whether it is the open one or one in the list
    * @param {string} sessionId
    * @param {string} name
    * @return {boolean} - did it change
    */
    async renameSession(sessionId, name){
      name = (typeof name === 'string') ? name.trim() : ''
      if (name === ''){ return false }
      if (this.activeSession && this.activeSession.id === sessionId){
        if (this.activeSession.name === name){ return false }
        this.activeSession.name = name
        await this.persistSession()
        return true
      }
      let stored = await workflowStorage.getSession(sessionId)
      if (!stored || stored.name === name){ return false }
      stored.name = name
      stored.updated = Date.now()
      await workflowStorage.saveSession(stored)
      this.sessions = await workflowStorage.listSessions()
      return true
    },

    /**
    * Store the open session, only the pointers to the records are stored not the records
    * @return {void}
    */
    async persistSession(){
      let s = this.activeSession
      if (!s){ return }
      await workflowStorage.saveSession({
        id: s.id,
        workflowId: s.workflowId,
        name: s.name,
        created: s.created,
        updated: Date.now(),
        definition: JSON.parse(JSON.stringify(s.definition)),
        hiddenComponents: JSON.parse(JSON.stringify(s.hiddenComponents)),
        rows: s.rows.filter((r) => { return r.sourceUrl }).map((r) => {
          return { id: r.id, eId: r.eId, sourceUrl: r.sourceUrl, scanned: r.scanned, label: r.label, lccn: r.lccn, done: r.done, posted: r.posted, saved: r.saved }
        }),
      })
      this.sessions = await workflowStorage.listSessions()
    },

    toggleComponent(key){
      let s = this.activeSession
      if (!s){ return }
      if (s.hiddenComponents.includes(key)){
        s.hiddenComponents = s.hiddenComponents.filter((k) => { return k !== key })
      } else {
        // don't leave an editor open in a column that is going away
        this.editingCell = null
        s.hiddenComponents.push(key)
      }
      this.persistSession()
    },

    /**
    * Change the type of a blank node nested inside a component (the Person/Corporate... of a
    * contribution's agent). The editor's changeRefTemplate only switches the top level of a
    * component, so this sets the @type on the node the cell's propertyPath leads to, which is
    * what the cells (and the export) read. Like the editor, a link to an authority (@id) is
    * dropped since it was to a thing of the old type.
    * @param {string} rowId
    * @param {object} cell - a type cell from resolveComponentCells
    * @param {object} template - the template picked, from rtLookup
    * @return {boolean} - false if it could not be done
    */
    async setNestedType(rowId, cell, template){
      if (!(await this.activateRow(rowId))){ return false }
      let profileStore = useProfileStore()
      let pt = utilsProfile.returnPt(profileStore.activeProfile, cell.guid)
      if (!pt){ return false }

      // walk (and build if needed) the blank nodes down to the one this type belongs to
      let node = pt.userValue
      for (let step of cell.propertyPath){
        if (!Array.isArray(node[step.propertyURI]) || node[step.propertyURI].length == 0){
          node[step.propertyURI] = [{ '@guid': short.generate() }]
        }
        node = node[step.propertyURI][0]
      }
      let type = typeUriForTemplate(template)
      if (node['@type'] === type){ return true }
      node['@type'] = type
      delete node['@id']
      profileStore.dataChanged()
      return true
    },

    /**
    * Move a component (its group of columns) to another place in the sheet
    * @param {string} groupKey - rt|component id of the one being moved
    * @param {string|null} beforeKey - the component to put it in front of, null for the end
    * @return {void}
    */
    moveComponent(groupKey, beforeKey){
      let s = this.activeSession
      if (!s || groupKey === beforeKey){ return }
      let components = s.definition.components
      let idx = components.findIndex((c) => { return c.rt + '|' + c.id === groupKey })
      if (idx < 0){ return }
      let item = components.splice(idx, 1)[0]
      let to = beforeKey ? components.findIndex((c) => { return c.rt + '|' + c.id === beforeKey }) : -1
      if (to < 0){
        components.push(item)
      } else {
        components.splice(to, 0, item)
      }
      // the selection is by column position, it would land on a different column now
      this.selectedCell = null
      this.editingCell = null
      this.persistSession()
    },

    /**
    * Show or hide one subfield (column) of a component in the sheet
    * @param {string} groupKey - rt|component id
    * @param {string} columnKey
    * @return {void}
    */
    toggleColumn(groupKey, columnKey){
      let s = this.activeSession
      if (!s){ return }
      let component = s.definition.components.filter((c) => { return c.rt + '|' + c.id === groupKey })[0]
      if (!component){ return }
      if (!component.hiddenColumns){ component.hiddenColumns = [] }
      if (component.hiddenColumns.includes(columnKey)){
        component.hiddenColumns = component.hiddenColumns.filter((k) => { return k !== columnKey })
      } else {
        this.editingCell = null
        component.hiddenColumns.push(columnKey)
      }
      this.persistSession()
    },

    /**
    * Add a component of the profile to the sheet, it goes on the end. This only changes the
    * open session, the workflow it was started from is left as it is.
    * @param {object} component - one of addableComponents
    * @return {void}
    */
    addComponent(component){
      let s = this.activeSession
      if (!s){ return }
      let key = component.rt + '|' + component.id
      if (!s.definition.components.some((c) => { return c.rt + '|' + c.id === key })){
        s.definition.components.push(JSON.parse(JSON.stringify(component)))
      }
      s.hiddenComponents = s.hiddenComponents.filter((k) => { return k !== key })
      this.persistSession()
    },

    returnRow(rowId){
      if (!this.activeSession){ return null }
      return this.activeSession.rows.filter((r) => { return r.id === rowId })[0] || null
    },

    // ---------------------------------------------------------------- getting records in

    /**
    * Something was scanned (or typed), find the record and add it to the session
    * @param {string} value - a LCCN, ISBN, barcode or the URL to a record
    * @return {void}
    */
    async scan(value){
      value = (value || '').trim()
      if (value == '' || !this.activeSession){ return }
      let session = this.activeSession

      let row = newRow(value)
      row.status = 'searching'
      session.rows.push(row)
      // work with the reactive one from here on
      row = this.returnRow(row.id)

      let sourceUrl = null
      let label = null

      if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')){
        sourceUrl = value
      } else {
        let results = await utilsNetwork.searchInstanceByLCCN(value)
        results = (results || []).filter((r) => { return r && typeof r === 'object' && r.bfdbPackageURL })

        if (results.length == 0){
          this.removeRow(row.id)
          this.notify('No record found for "' + value + '"', 'error')
          return
        }

        let pick = results[0]
        if (results.length > 1){
          // more than one record, usually the print book and its ebook: look in the records to
          // tell them apart, then ask the user which one with the likely one pointed out
          row.status = 'checking'
          let advice = await this.inspectCandidates(results, value)
          if (this.activeSession !== session || !this.returnRow(row.id)){ return }

          // the user said to always take one format for this workflow, if exactly one record is that format take it
          let autoFormat = this.returnAutoFormat(session.workflowId)
          let automatic = autoFormat ? results.filter((c) => { return c.format === autoFormat }) : []
          if (automatic.length == 1){
            pick = automatic[0]
            this.notify('Took the ' + autoFormat + ' record for "' + value + '", as always for this workflow', 'info')
          } else {
            row.status = 'choosing'
            pick = await new Promise((resolve) => {
              this.prompts.push({ id: row.id, scanned: value, candidates: results, reason: advice.reason, resolve: resolve })
            })
            this.prompts = this.prompts.filter((p) => { return p.id !== row.id })
            if (!pick){
              this.removeRow(row.id)
              return
            }
          }
        }
        sourceUrl = pick.bfdbPackageURL
        label = pick.label
        // the record was already fetched to look at it, no need to fetch it again
        if (pick.xml){ prefetched[sourceUrl] = pick.xml }
        // same as the load screen, the user can default to continue editing the BF instead of reconverting from MARC
        if (usePreferenceStore().returnValue('--b-general-default-load-tupe')){
          sourceUrl = sourceUrl.replace('convertedit-pkg', 'editor-pkg')
        }
      }

      // they closed the session while it was searching
      if (this.activeSession !== session || !this.returnRow(row.id)){ return }

      let existing = session.rows.filter((r) => { return r.id !== row.id && r.sourceUrl === sourceUrl })[0]
      if (existing){
        this.removeRow(row.id)
        this.notify('"' + value + '" is already in this workflow', 'info')
        existing.flash = true
        window.setTimeout(() => { existing.flash = false }, 2000)
        return
      }

      row.sourceUrl = sourceUrl
      row.label = label
      row.status = 'loading'
      await this.loadRow(row.id)
      this.persistSession()
      // the keyboard goes to the record that just came in
      row = this.returnRow(row.id)
      if (row && row.status === 'ready' && this.activeSession === session && !this.editingCell){
        this.selectCell(row.id, 0, 0)
        leaveTheScanBox()
      }
    },

    /**
    * A scan matched more than one record. Fetch each one and look at how it lists the scanned
    * identifier: the print book's record has the ebook's ISBN as canceled and the other way round,
    * so usually only one of them really is the scanned thing.
    * @param {array} candidates - the search results, each gets .inspection .format .scannedStatus .recommended (.xml) set on it
    * @param {string} scanned
    * @return {object} - { recommended, reason } see recommendCandidate
    */
    async inspectCandidates(candidates, scanned){
      await Promise.all(candidates.map(async (c) => {
        try {
          let xml = await utilsNetwork.fetchBfdbXML(c.bfdbPackageURL)
          if (xml && typeof xml === 'string' && xml.indexOf('<rdf:RDF') !== -1){
            c.xml = xml
            c.inspection = inspectRecord(xml, c.idURL || c.bfdbURL)
          } else {
            c.inspection = null
          }
        } catch (e) {
          console.warn('Workflows: could not look at', c.bfdbPackageURL, e)
          c.inspection = null
        }
      }))
      return recommendCandidate(candidates, scanned)
    },

    /**
    * Answer the "which record" question for a scan that matched more than one
    * @param {object|null} candidate - the search result picked, or null to skip the scan
    * @param {boolean} always - from now on take this candidate's format (print/ebook) for this workflow without asking
    * @return {void}
    */
    answerPrompt(candidate, always = false){
      if (this.prompts.length == 0){ return }
      if (always && candidate && this.activeSession){
        if (candidate.format && candidate.format !== 'unknown'){
          this.setAutoFormat(this.activeSession.workflowId, candidate.format)
          this.notify('The ' + candidate.format + ' record will be taken from now on in this workflow, that can be turned off under Options', 'info')
        } else {
          this.notify('Could not tell what format this record is, so it can not be chosen automatically', 'error')
        }
      }
      this.prompts[0].resolve(candidate)
    },

    /**
    * Get the record for a row, from the Marva backend if the row was saved there otherwise from its source
    * @param {string} rowId
    * @return {void}
    */
    async loadRow(rowId){
      let session = this.activeSession
      let row = this.returnRow(rowId)
      if (!row){ return }
      row.status = 'loading'
      row.error = null

      // 1. fetch, several rows at a time. From the Marva backend if the row was saved there, otherwise the source
      let savedXml = null
      let sourceXml = null
      try {
        await fetchSlot(async () => {
          if (row.saved && row.eId){
            try {
              savedXml = await utilsNetwork.loadSavedRecord(row.eId)
              if (!savedXml || typeof savedXml !== 'string' || savedXml.indexOf('<rdf:RDF') === -1){ savedXml = null }
            } catch (e) {
              savedXml = null
            }
            if (!savedXml){ console.warn('Workflows: could not fetch the saved record', row.eId, 'going back to the source') }
          }
          if (!savedXml){
            sourceXml = await this.fetchRecordXml(row.sourceUrl)
          }
        })
      } catch (e) {
        row = this.returnRow(rowId)
        if (row){
          row.status = 'error'
          row.error = (e && e.message) ? e.message : String(e)
        }
        return
      }

      // 2. parse, one record at a time (the parser keeps global state)
      return enqueue('load', async () => {
        row = this.returnRow(rowId)
        // it might be gone by the time its turn in line comes up
        if (!row || this.activeSession !== session){ return }
        try {
          let profile = null
          if (savedXml){
            try {
              profile = await utilsProfile.loadRecordFromBackend(row.eId, savedXml)
            } catch (e) {
              console.warn('Workflows: could not load the saved record', row.eId, 'going back to the source', e)
            }
          }
          if (!profile){
            if (!sourceXml){ sourceXml = await this.fetchRecordXml(row.sourceUrl) }
            profile = await this.buildRecordFromXml(sourceXml, session.definition.profileId, row.eId, row.sourceUrl)
          }
          row = this.returnRow(rowId)
          if (!row || this.activeSession !== session){ return }

          row.eId = profile.eId
          row.profile = profile
          // read it back through the store so we are working with the reactive version of the record
          let summary = recordSummary(row.profile)
          if (summary.title){ row.label = summary.title }
          row.lccn = summary.lccn
          if (profile.status == 'published'){ row.posted = true }
          row.status = 'ready'
          // the first record to come in gets the keyboard, so the sheet can be worked without a click
          if (!this.selectedCell && !this.editingCell && session.rows.indexOf(row) === session.rows.findIndex((r) => { return r.status === 'ready' })){
            this.selectCell(row.id, 0, 0)
            leaveTheScanBox()
          }

          if ((session.definition.enrichments || []).length > 0){
            let changed = await this.withRow(row.id, async () => {
              return await runEnrichments(session.definition.enrichments, row.profile, { row: row, definition: session.definition })
            })
            if (changed){ row.dirty = true }
            // the suggestions come in on their own, the row is usable meanwhile
            this.enrichRow(row.id)
          }
        } catch (e) {
          console.error('Workflows: could not load', row.sourceUrl, e)
          row = this.returnRow(rowId)
          if (row){
            row.status = 'error'
            row.error = (e && e.message) ? e.message : String(e)
          }
        }
      })
    },

    /**
    * Fetch a record's XML (or take the copy fetched earlier while telling scan matches apart)
    * @param {string} url - the url to the record XML
    * @return {string} - the xml
    */
    async fetchRecordXml(url){
      let xml = prefetched[url]
      delete prefetched[url]
      if (!xml){
        xml = await utilsNetwork.fetchBfdbXML(url)
      }
      if (!xml || typeof xml !== 'string' || xml.indexOf('<rdf:RDF') === -1){
        throw new Error('Could not retrieve the record from ' + url)
      }
      return xml
    },

    /**
    * Fetch a record and parse it into a profile, the same steps the load screen does
    * @param {string} url - the url to the record XML
    * @param {string} profileId - the instance rt id of the profile to use
    * @param {string} eId - reuse this eId instead of making a new one
    * @return {object} - the record
    */
    async buildRecordFromUrl(url, profileId, eId){
      return this.buildRecordFromXml(await this.fetchRecordXml(url), profileId, eId, url)
    },

    /**
    * Parse a record's XML into a profile. Must not run for two records at once (the parser keeps
    * global state), loadRow runs it on the load queue
    * @param {string} xml - the record XML
    * @param {string} profileId - the instance rt id of the profile to use
    * @param {string} eId - reuse this eId instead of making a new one
    * @param {string} url - where the xml came from, for the record's log
    * @return {object} - the record
    */
    async buildRecordFromXml(xml, profileId, eId, url = null){
      let profileStore = useProfileStore()
      utilsParse.parseXml(xml)

      let baseProfile = findBaseProfile(profileId)
      if (!baseProfile){
        throw new Error('The profile ' + profileId + ' is not available')
      }
      let useProfile = JSON.parse(JSON.stringify(baseProfile))

      // add in the rts for any items the record has
      if (utilsParse.hasItem > 0){
        let useItemRtLabel = profileId.replace(':Instance', ':Item')
        for (let i = 0; i < utilsParse.hasItem; i++){
          for (let pkey in profileStore.profiles){
            for (let rtkey in profileStore.profiles[pkey].rt){
              if (rtkey == useItemRtLabel){
                let useRtLabel = useItemRtLabel + '-' + (i + 1)
                let useItem = JSON.parse(JSON.stringify(profileStore.profiles[pkey].rt[rtkey]))
                for (let ptk in useItem.pt){
                  useItem.pt[ptk]['@guid'] = short.generate()
                }
                useProfile.rtOrder.push(useRtLabel)
                useProfile.rt[useRtLabel] = useItem
              }
            }
          }
        }
      }

      if (!useProfile.log){ useProfile.log = [] }
      useProfile.log.push({ action: 'loadInstance', from: url })
      useProfile.procInfo = "update instance"
      useProfile.eId = (eId) ? eId : 'e' + Date.now().toString()
      useProfile.neweId = true
      useProfile.marvaLocalId = null
      useProfile.user = usePreferenceStore().returnUserNameForSaving
      useProfile.status = 'unposted'

      return await utilsParse.transformRts(useProfile)
    },

    // ---------------------------------------------------------------- CIP suggestions

    /**
    * Fetch WorldCat's version of a row's record through the cip-lookup service and keep it, parsed,
    * on the row for the sheet to compare against (row.enrichment). Only when the workflow has the
    * cip-lookup enrichment turned on.
    * @param {string} rowId
    * @param {boolean} force - look it up again even if it was already done
    * @return {void}
    */
    async enrichRow(rowId, force = false){
      let session = this.activeSession
      let row = this.returnRow(rowId)
      if (!row || !row.profile || !session){ return }
      if (!(session.definition.enrichments || []).includes(CIP_ENRICHMENT_ID)){ return }
      if (row.enrichment && row.enrichment.status === 'loading'){ return }
      if (row.enrichment && !force && row.enrichment.status !== 'error'){ return }

      let query = cipQuery(row)
      if (!query){
        row.enrichment = { status: 'none', message: 'No barcode or ISBN to look the book up with' }
        return
      }
      row.enrichment = { status: 'loading', query: query }
      try {
        let data = await fetchSlot(() => { return fetchCipLookup(query, useConfigStore().returnUrls.util) })
        row = this.returnRow(rowId)
        if (!row || this.activeSession !== session){ return }
        let xml = (data.bibframe && data.bibframe.record) ? data.bibframe.record.rdfxml : null
        if (data.status !== 'ok' || !xml){
          row.enrichment = { status: 'none', query: query, message: (data.messages && data.messages.length) ? data.messages.join('; ') : ('WorldCat lookup: ' + data.status) }
          return
        }
        // parsed like any record, on the parse queue, with its own throwaway id
        let suggested = await enqueue('load', () => {
          return this.buildRecordFromXml(xml, session.definition.profileId, 'cip-' + short.generate(), 'cip-lookup ' + JSON.stringify(query))
        })
        row = this.returnRow(rowId)
        if (!row || this.activeSession !== session){ return }
        // LC does not use OCLC / WorldCat URIs or identifiers, take them out before anything is offered,
        // along with the converter's relations pointing back at this very record
        scrubForeignData(suggested, recordUris(row.profile))
        row.enrichment = { status: 'ready', query: query, suggested: markRaw(suggested), source: summarizeCip(data), dismissed: [] }
      } catch (e) {
        console.error('Workflows: CIP lookup failed', e)
        row = this.returnRow(rowId)
        if (row){ row.enrichment = { status: 'error', query: query, message: (e && e.message) ? e.message : String(e) } }
      }
    },

    /**
    * Take a suggested value into a cell of the record
    * @param {string} rowId
    * @param {string} componentGuid - the record component the cell belongs to
    * @param {object} suggestedPt - the suggested component it comes from
    * @param {object} cell - the cell (its propertyPath says what to copy)
    * @return {boolean}
    */
    async acceptSuggestedCell(rowId, componentGuid, suggestedPt, cell){
      if (!(await this.activateRow(rowId))){ return false }
      let profileStore = useProfileStore()
      let pt = utilsProfile.returnPt(profileStore.activeProfile, componentGuid)
      if (!pt){ return false }
      if (!copyCellValue(pt.userValue, suggestedPt.userValue, cell.propertyPath)){
        this.notify('Could not copy that value into the record', 'error')
        return false
      }
      profileStore.dataChanged()
      return true
    },

    /**
    * Put a corrected value into a literal cell (the call number year check), through the editor's
    * own setter so it is the same as typing it
    * @param {string} rowId
    * @param {string} componentGuid
    * @param {object} cell
    * @param {string} value
    * @param {string|null} valueGuid - the @guid of the value being replaced, if there is one
    * @return {boolean}
    */
    async setSuggestedLiteral(rowId, componentGuid, cell, value, valueGuid){
      if (!(await this.activateRow(rowId))){ return false }
      let profileStore = useProfileStore()
      await profileStore.setValueLiteral(componentGuid, valueGuid || short.generate(), cell.propertyPath, value, null)
      return true
    },

    /**
    * Put a lookup value a checklist rule expects into a cell, through the editor's own setters
    * @param {string} rowId
    * @param {string} componentGuid
    * @param {object} cell
    * @param {object} simple - {uri, label}
    * @param {string|null} replaceGuid - the value to take out first (replace mode)
    * @param {string|null} siblingGuid - an existing value to add this one next to (include mode)
    * @return {boolean}
    */
    async setSuggestedSimple(rowId, componentGuid, cell, simple, replaceGuid, siblingGuid){
      if (!(await this.activateRow(rowId))){ return false }
      let profileStore = useProfileStore()
      if (replaceGuid){
        await profileStore.removeValueSimple(componentGuid, replaceGuid)
      }
      // with a guid it can find, setValueSimple adds beside it, otherwise it builds the node
      await profileStore.setValueSimple(componentGuid, siblingGuid || short.generate(), cell.propertyPath, simple.uri, simple.label)
      return true
    },

    /**
    * Take a whole suggested component (a contributor, a note...) into the record, into the
    * component's blank instance if it has one otherwise as a new repeat of it
    * @param {string} rowId
    * @param {object} component - the workflow component {rt, id, propertyURI, label}
    * @param {object} suggestedPt
    * @return {boolean}
    */
    async acceptSuggestedComponent(rowId, component, suggestedPt){
      if (!(await this.activateRow(rowId))){ return false }
      let profileStore = useProfileStore()
      let pts = findComponentPts(profileStore.activeProfile, component)
      if (pts.length == 0){ return false }
      let target = pts.filter((pt) => { return componentIsEmpty(pt) })[0]
      if (!target){
        let last = pts[pts.length - 1]
        let newGuid = await profileStore.duplicateComponent(last['@guid'], profileStore.returnStructureByGUID(last['@guid']))
        if (!newGuid){ return false }
        target = utilsProfile.returnPt(profileStore.activeProfile, newGuid)
        if (!target){ return false }
      }
      copyComponentValue(target, suggestedPt)
      profileStore.dataChanged()
      return true
    },

    /**
    * Wave a suggestion away for this sheet
    * @param {string} rowId
    * @param {string} key - the suggestion's key (see cip.compareComponent)
    */
    dismissSuggestion(rowId, key){
      let row = this.returnRow(rowId)
      if (!row || !row.enrichment){ return }
      if (!row.enrichment.dismissed){ row.enrichment.dismissed = [] }
      if (!row.enrichment.dismissed.includes(key)){ row.enrichment.dismissed.push(key) }
    },

    removeRow(rowId){
      let s = this.activeSession
      if (!s){ return }
      if (this.editingCell && this.editingCell.rowId === rowId){ this.editingCell = null }
      if (this.selectedCell && this.selectedCell.rowId === rowId){ this.selectedCell = null }
      if (this.activeRowId === rowId){
        this.activeRowId = null
        useProfileStore().prepareForNewRecord()
      }
      s.rows = s.rows.filter((r) => { return r.id !== rowId })
      this.persistSession()
    },

    toggleDone(rowId){
      let row = this.returnRow(rowId)
      if (!row){ return }
      row.done = !row.done
      this.persistSession()
    },

    // ---------------------------------------------------------------- editing

    /**
    * Make the row's record the profile store's activeProfile so it can be edited.
    * If another row was active and has unsaved edits it is saved first.
    * @param {string} rowId
    * @return {boolean} - is the row active now
    */
    async activateRow(rowId){
      let row = this.returnRow(rowId)
      if (!row || row.status != 'ready'){ return false }
      // wait out anything that is borrowing the activeProfile
      await opChain
      if (this.activeRowId === rowId && useProfileStore().activeProfile === row.profile){ return true }

      let previous = this.activeRow
      if (previous && previous.dirty && previous.status == 'ready'){
        window.clearTimeout(saveTimeout)
        await this.saveRow(previous.id)
      }

      row = this.returnRow(rowId)
      if (!row){ return false }
      useProfileStore().activeProfile = row.profile
      this.activeRowId = rowId
      return true
    },

    /**
    * Put a cell into edit mode
    * @param {string} rowId
    * @param {string} guid - the guid of the component
    * @param {string} key - the key of the column in the component
    * @return {boolean}
    */
    async editCell(rowId, guid, key){
      if (this.busy){ return false }
      if (this.editingCell && this.editingCell.rowId === rowId && this.editingCell.guid === guid && this.editingCell.key === key){ return true }
      if (!(await this.activateRow(rowId))){ return false }
      this.editingCell = { rowId: rowId, guid: guid, key: key }
      return true
    },

    stopEditing(){
      this.editingCell = null
    },

    selectCell(rowId, line, col){
      // moving to another cell is done with the one being edited
      if (this.editingCell && (this.editingCell.rowId !== rowId || !this.isSelected(rowId, line, col))){
        this.editingCell = null
      }
      this.selectedCell = { rowId: rowId, line: line, col: col }
    },

    isSelected(rowId, line, col){
      let s = this.selectedCell
      return !!s && s.rowId === rowId && s.line === line && s.col === col
    },

    /**
    * The profile store changed the active record
    * @return {void}
    */
    activeRowChanged(){
      let row = this.activeRow
      if (!row || useProfileStore().activeProfile !== row.profile){ return }
      row.dirty = true
      row.done = false
      // lets things that are derived from the record (the MARC preview) know it changed
      row.revision = (row.revision || 0) + 1
      window.clearTimeout(saveTimeout)
      let rowId = row.id
      saveTimeout = window.setTimeout(() => {
        // only if it is still the active one, when the user moves to another row it is saved as part of that
        if (this.activeRowId === rowId){
          this.saveRow(rowId)
        }
      }, 2500)
    },

    /**
    * Run something with the row's record as the activeProfile then put back whatever was active.
    * The grid is locked while it runs so the user is not editing a record while the activeProfile is someone else.
    * @param {string} rowId
    * @param {function} fn
    * @param {string} label - what to show while it is running
    * @return {*} - what fn returns
    */
    withRow(rowId, fn, label = 'Working...'){
      return enqueue('op', async () => {
        let row = this.returnRow(rowId)
        if (!row || !row.profile){ return null }
        let profileStore = useProfileStore()
        let needsSwap = profileStore.activeProfile !== row.profile
        let previous = profileStore.activeProfile
        let previousBusy = this.busy
        if (needsSwap){
          this.busy = label
          profileStore.activeProfile = row.profile
        }
        try {
          return await fn(row)
        } finally {
          if (needsSwap){
            profileStore.activeProfile = previous
            this.busy = previousBusy
          }
        }
      })
    },

    /**
    * The MARC the record converts to, as text, from the same service the editor's MARC preview uses
    * @param {string} rowId
    * @return {object} - { text, version, error }
    */
    async marcPreviewRow(rowId){
      // the XML has to be built with the row active (buildXML reads the profile store), the
      // conversion itself can then run without holding the grid
      let xml = await this.withRow(rowId, async (row) => { return await utilsExport.buildXML(row.profile) }, 'Building the MARC preview...')
      if (!xml || !xml.bf2Marc){ return { text: '', version: null, error: 'Could not build the record XML' } }
      let preview
      try {
        preview = await utilsNetwork.marcPreview(xml.bf2Marc, false)
      } catch (e) {
        return { text: '', version: null, error: 'The MARC preview service could not be reached' }
      }
      // like profileStore.marcPreview, take the newest converter version that produced a record
      let versions = (Array.isArray(preview) ? preview : []).slice().sort((a, b) => { return (a.version < b.version) ? 1 : (a.version > b.version) ? -1 : 0 })
      let good = versions.filter((v) => { return v.results && v.results.stdout && v.marcRecord })[0]
      if (good){ return { text: good.marcRecord, version: good.version, error: null } }
      let bad = versions[0]
      let error = 'The MARC preview service did not return a record'
      if (bad && bad.results){ error = (typeof bad.results === 'string') ? bad.results : JSON.stringify(bad.results, null, 2) }
      return { text: '', version: (bad) ? bad.version : null, error: error }
    },

    /**
    * Save the row's record to the Marva backend, the same place the full editor saves to
    * @param {string} rowId
    * @return {boolean} - did it save
    */
    async saveRow(rowId){
      let row = this.returnRow(rowId)
      if (!row || !row.profile){ return false }
      row.saving = true
      let saved = false
      try {
        saved = await this.withRow(rowId, async (row) => {
          let xml = await utilsExport.buildXML(row.profile)
          if (!xml || !xml.xlmStringBasic){ return false }
          // nothing to save to in the test env
          if (useProfileStore().isTestEnv()){ return false }
          return await utilsNetwork.saveRecord(xml.xlmStringBasic, row.profile.eId)
        }, 'Saving...')
      } catch (e) {
        console.error('Workflows: could not save', rowId, e)
      }
      row = this.returnRow(rowId)
      if (row){
        row.saving = false
        // in the test env it is never saved, but don't keep trying
        if (saved || useProfileStore().isTestEnv()){
          row.dirty = false
        }
        if (saved && !row.saved){
          row.saved = true
          this.persistSession()
        }
      }
      return !!saved
    },

    // ---------------------------------------------------------------- row actions

    isStaging(){
      let urls = useConfigStore().returnUrls
      return urls.env == 'staging' || urls.dev == true
    },

    canPost(){
      if (!useConfigStore().returnUrls.displayLCOnlyFeatures){
        alert("Sorry you cannot post in this Marva environment")
        return false
      }
      if (this.isStaging()){
        return confirm('This is Marva STAGING. It should not be used for Production work. Do you want to continue?')
      }
      return true
    },

    /**
    * Post the row's record, the same publish the full editor does
    * @param {string} rowId
    * @param {boolean} confirmed - the user has already been asked the staging question (post all)
    * @return {boolean} - did it post
    */
    async postRow(rowId, confirmed = false){
      let row = this.returnRow(rowId)
      if (!row || row.status != 'ready' || row.posting){ return false }
      if (!confirmed && !this.canPost()){ return false }

      row.posting = true
      let results = null
      let pageTitle = document.title
      try {
        results = await this.withRow(rowId, async () => {
          return await useProfileStore().publishRecord()
        }, 'Posting ' + (row.label || row.scanned || '') + '...')
      } catch (e) {
        console.error('Workflows: error posting', rowId, e)
        results = { status: false, msg: (e && e.message) ? e.message : String(e) }
      }
      // publishRecord renames the page for the full editor
      document.title = pageTitle

      row = this.returnRow(rowId)
      if (!row){ return false }
      row.posting = false
      if (results && results.status){
        row.posted = true
        row.postedTimestamp = Date.now()
        row.dirty = false
        // publishRecord saves the record as part of posting, unless it is the test env
        if (!useProfileStore().isTestEnv()){ row.saved = true }
        row.postFailed = false
        this.persistSession()
        return true
      }
      row.posted = false
      row.postFailed = true
      this.postError = { rowId: rowId, label: row.label || row.scanned, msg: (results && results.msg) ? results.msg : 'Unknown error' }
      return false
    },

    /**
    * Post every record in the session that is loaded and not posted yet, one after the other
    * @return {void}
    */
    async postAll(){
      if (!this.activeSession){ return }
      let rows = this.activeSession.rows.filter((r) => { return r.status == 'ready' && !r.posted })
      if (rows.length == 0){
        this.notify('Nothing to post.', 'info')
        return
      }
      if (!confirm('Post ' + rows.length + ' record' + (rows.length == 1 ? '' : 's') + '?')){ return }
      if (!this.canPost()){ return }

      let posted = 0
      for (let row of rows){
        if (await this.postRow(row.id, true)){
          posted++
        } else {
          // stop at the first one that fails so the error can be looked at
          break
        }
      }
      this.notify('Posted ' + posted + ' of ' + rows.length + ' records.', (posted == rows.length) ? 'info' : 'error')
    },

    /**
    * The URL to the row's record in LCAP, same as the full editor's Open in LCAP
    * @param {string} rowId
    * @return {string|null}
    */
    returnLcapUrl(rowId){
      let row = this.returnRow(rowId)
      if (!row || !row.profile){ return null }
      let base = useConfigStore().returnUrls.lcap
      if (!base){ return null }
      for (let rt in row.profile.rt){
        let uri = row.profile.rt[rt].URI
        if (uri){
          return base + uri.split("/")[uri.split('/').length - 1]
        }
        break
      }
      return null
    },

    openLcap(rowId, confirmed = false){
      let url = this.returnLcapUrl(rowId)
      if (!url){
        this.notify('Open in LCAP is not available in this Marva environment.', 'error')
        return false
      }
      if (!confirmed && this.isStaging() && !confirm('This is Marva STAGING. It should not be used for Production work. Do you want to continue?')){ return false }
      window.open(url)
      return true
    },

    openAllLcap(){
      if (!this.activeSession){ return }
      let rows = this.activeSession.rows.filter((r) => { return r.status == 'ready' })
      if (rows.length == 0){ return }
      if (!confirm('Open ' + rows.length + ' record' + (rows.length == 1 ? '' : 's') + ' in LCAP? Each one opens in its own tab, your browser may ask to allow the popups.')){ return }
      if (this.isStaging() && !confirm('This is Marva STAGING. It should not be used for Production work. Do you want to continue?')){ return }
      for (let row of rows){
        if (!this.openLcap(row.id, true)){ break }
      }
    },

    /**
    * Get the row ready to be opened in the full editor, it has to be saved to the backend to be loaded there
    * @param {string} rowId
    * @return {string|null} - the eId to open
    */
    async prepareForFullEditor(rowId){
      let row = this.returnRow(rowId)
      if (!row || !row.profile){ return null }
      if (useProfileStore().isTestEnv()){
        this.notify('Records are not saved in the test environment so it can not be opened in the full editor.', 'error')
        return null
      }
      if (row.dirty || !row.saved){
        if (!(await this.saveRow(rowId))){
          this.notify('Could not save the record to open it in the full editor.', 'error')
          return null
        }
      }
      return row.eId
    },

  },
})


/**
* Find the profile that has the starting point's instance rt in it
* @param {string} profileId - lc:RT:bf2:Monograph:Instance
* @return {object|null} - the profile from the profile store, do not modify it
*/
/**
* The admin metadata template, if the loaded profiles have one
* @return {string|null}
*/
function adminMetadataTemplate(){
  let profileStore = useProfileStore()
  let id = profileStore.resolveTemplateId(ADMIN_METADATA_TEMPLATE)
  return profileStore.rtLookup[id] ? id : null
}

/**
* The blank component of the profile that a workflow component refers to, what the columns are worked out from
* @param {object} baseProfile
* @param {object} component - {rt, id}
* @return {object|null} - the pt
*/
function findComponentTemplate(baseProfile, component){
  if (component.id === ADMIN_METADATA_COMPONENT_ID){
    let templateId = adminMetadataTemplate()
    return templateId ? adminMetadataPt(templateId) : null
  }
  let rtId = findRtId(baseProfile, component.rt)
  if (!rtId || !baseProfile.rt[rtId].pt[component.id]){ return null }
  return baseProfile.rt[rtId].pt[component.id]
}

function findBaseProfile(profileId){
  let profiles = useProfileStore().profiles
  let found = null
  for (let key in profiles){
    if (profiles[key].rtOrder && profiles[key].rtOrder.indexOf(profileId) > -1){
      found = profiles[key]
    }
  }
  return found
}

function newRow(scanned){
  return {
    id: 'r-' + short.generate(),
    scanned: scanned || '',
    // searching, choosing, loading, ready, error
    status: 'loading',
    error: null,
    sourceUrl: null,
    eId: null,
    label: null,
    lccn: null,
    profile: null,
    done: false,
    posted: false,
    postedTimestamp: null,
    postFailed: false,
    posting: false,
    // has edits that are not saved to the backend yet
    dirty: false,
    // has it ever been saved to the backend
    saved: false,
    saving: false,
    flash: false,
    // bumped on every edit, for things derived from the record (the MARC preview)
    revision: 0,
    // the CIP lookup: null, or { status: loading|ready|none|error, suggested, source, dismissed, message }, not stored
    enrichment: null,
  }
}
