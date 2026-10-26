/**
 * Workflows: persistence.
 *
 * Everything the Workflows feature keeps between visits goes through here. It is stored in the
 * editor's backend (util-service, MongoDB, per user: routes/workflows.js there) when the user is
 * logged in and a util service is configured; otherwise, and in the test environment, it stays in
 * the browser's localStorage. The first time the backend is used and has nothing yet, whatever
 * localStorage holds is moved over, so nothing made before the backend existed is lost.
 *
 * WHAT IS STORED (and where in the backend)
 * ----------------------------------------
 * 1. Workflow definitions                      PUT/GET/DELETE {util}workflows/definitions[/:id]
 *      { id, name, description, profileId,
 *        components:[{rt, id, propertyURI, label, hiddenColumns:[columnKey]}],  // hiddenColumns: the subfields turned off
 *        enrichments:[enrichmentId], created, updated }
 *    The built in ones live in builtin.js and are not stored.
 *
 * 2. Workflow sessions (one "sheet" a user opened from a definition)   {util}workflows/sessions[/:id]
 *      { id, workflowId, name, created, updated,
 *        definition,            // snapshot of the definition the session was started with
 *        hiddenComponents:[],   // the components the user has toggled off in this session
 *        rows:[{ id, eId, sourceUrl, scanned, label, profileId, done, posted, saved }] }
 *    Only the pointer to each record is stored here, not the record.
 *
 * 3. The records being edited are NOT stored here. Each row is a normal Marva record
 *    with an eId that is saved through the existing record endpoint (utilsNetwork.saveRecord
 *    -> ldpjs/ldp/{eId}), same as the full editor. That is also what lets a row be opened
 *    in the full editor.
 *
 * 4. Per user preferences                              {util}workflows/preferences
 *      { columnWidths: { "<component id>|<column key>": widthInPixels },   // dragged column widths, by kind of column
 *        workflows: { "<workflow id>": { autoFormat: 'print'|'ebook',      // "always select this version" answers
 *                                        layout: 'pages' } } }              // one record per page instead of the spreadsheet
 *
 * NOT STORED YET
 * --------------
 * - Identifier search: scans are resolved with the instance keyword search on ID
 *   (utilsNetwork.searchInstanceByLCCN). Finding a record by the item/inventory barcode needs
 *   an endpoint that can search the item barcode (the CIP lookup service does it for its own use).
 */

import { useConfigStore } from '@/stores/config'
import { useProfileStore } from '@/stores/profile'

const COLUMN_WIDTHS_KEY = 'marva-workflows-column-widths'
const DEFINITIONS_KEY = 'marva-workflows-definitions'
const SESSIONS_KEY = 'marva-workflows-sessions'
const PREFERENCES_KEY = 'marva-workflows-preferences'
const MIGRATED_KEY = 'marva-workflows-moved-to-backend'

// ---------------------------------------------------------------- localStorage

function readList(key){
  try {
    let data = window.localStorage.getItem(key)
    if (!data){ return [] }
    data = JSON.parse(data)
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.warn('Workflows: could not read', key, e)
    return []
  }
}

function readObject(key){
  try {
    let data = JSON.parse(window.localStorage.getItem(key) || '{}')
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {}
  } catch (e) {
    return {}
  }
}

function write(key, value){
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error('Workflows: could not save', key, e)
    return false
  }
}

const local = {
  listDefinitions: async () => { return readList(DEFINITIONS_KEY) },
  saveDefinition: async (definition) => {
    let all = readList(DEFINITIONS_KEY).filter((d) => { return d.id !== definition.id })
    all.push(definition)
    return write(DEFINITIONS_KEY, all)
  },
  deleteDefinition: async (id) => { return write(DEFINITIONS_KEY, readList(DEFINITIONS_KEY).filter((d) => { return d.id !== id })) },

  listSessions: async () => { return readList(SESSIONS_KEY).sort((a, b) => { return (b.updated || 0) - (a.updated || 0) }) },
  getSession: async (id) => { return readList(SESSIONS_KEY).filter((s) => { return s.id === id })[0] || null },
  saveSession: async (session) => {
    let all = readList(SESSIONS_KEY).filter((s) => { return s.id !== session.id })
    all.push(session)
    return write(SESSIONS_KEY, all)
  },
  deleteSession: async (id) => { return write(SESSIONS_KEY, readList(SESSIONS_KEY).filter((s) => { return s.id !== id })) },

  getColumnWidths: async () => { return readObject(COLUMN_WIDTHS_KEY) },
  saveColumnWidths: async (widths) => { return write(COLUMN_WIDTHS_KEY, widths) },
  getPreferences: async () => { return readObject(PREFERENCES_KEY) },
  savePreferences: async (preferences) => { return write(PREFERENCES_KEY, preferences) },
}

// ---------------------------------------------------------------- the backend

/**
* Is there a backend to talk to: a util service, a login, and not the test environment
*/
export function usingBackend(){
  if (useProfileStore().isTestEnv()){ return false }
  let util = useConfigStore().returnUrls.util
  return !!util && !!window.localStorage.getItem('marva_jwt')
}

async function api(method, path, body){
  let headers = { 'Accept': 'application/json' }
  let token = window.localStorage.getItem('marva_jwt')
  if (token){ headers['Authorization'] = 'Bearer ' + token }
  if (body !== undefined){ headers['Content-Type'] = 'application/json' }
  let response = await fetch(useConfigStore().returnUrls.util + 'workflows/' + path, {
    method: method,
    headers: headers,
    body: (body !== undefined) ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await response.json() } catch (e) { data = null }
  if (!response.ok){
    let error = new Error((data && data.error) ? data.error : ('Workflows storage: ' + response.status + ' ' + method + ' ' + path))
    error.status = response.status
    throw error
  }
  return data
}

const remote = {
  listDefinitions: async () => { return (await api('GET', 'definitions')).definitions || [] },
  saveDefinition: async (definition) => { await api('PUT', 'definitions/' + encodeURIComponent(definition.id), definition); return true },
  deleteDefinition: async (id) => { await api('DELETE', 'definitions/' + encodeURIComponent(id)); return true },

  listSessions: async () => { return (await api('GET', 'sessions')).sessions || [] },
  getSession: async (id) => {
    try {
      return (await api('GET', 'sessions/' + encodeURIComponent(id))).session || null
    } catch (e) {
      if (e.status === 404){ return null }
      throw e
    }
  },
  saveSession: async (session) => { await api('PUT', 'sessions/' + encodeURIComponent(session.id), session); return true },
  deleteSession: async (id) => { await api('DELETE', 'sessions/' + encodeURIComponent(id)); return true },

  getColumnWidths: async () => { return (await api('GET', 'preferences')).columnWidths || {} },
  saveColumnWidths: async (widths) => { await api('PUT', 'preferences', { columnWidths: widths }); return true },
  getPreferences: async () => { return (await api('GET', 'preferences')).workflows || {} },
  savePreferences: async (preferences) => { await api('PUT', 'preferences', { workflows: preferences }); return true },
}

/**
* The first time the backend is used, what was kept in localStorage before is moved into it
* (only when the backend holds nothing yet for this user), then left alone.
*/
async function migrateIfNeeded(){
  if (window.localStorage.getItem(MIGRATED_KEY)){ return }
  let definitions = readList(DEFINITIONS_KEY)
  let sessions = readList(SESSIONS_KEY)
  let widths = readObject(COLUMN_WIDTHS_KEY)
  let preferences = readObject(PREFERENCES_KEY)
  let anything = definitions.length > 0 || sessions.length > 0 || Object.keys(widths).length > 0 || Object.keys(preferences).length > 0
  if (anything){
    let have = await remote.listDefinitions()
    let haveSessions = await remote.listSessions()
    if (have.length == 0 && haveSessions.length == 0){
      for (let d of definitions){ if (d && d.id){ await remote.saveDefinition(d) } }
      for (let s of sessions){ if (s && s.id){ await remote.saveSession(s) } }
      if (Object.keys(widths).length > 0 || Object.keys(preferences).length > 0){
        await api('PUT', 'preferences', { columnWidths: widths, workflows: preferences })
      }
      console.info('Workflows: moved', definitions.length, 'workflows and', sessions.length, 'sheets from this browser into the backend')
    }
  }
  window.localStorage.setItem(MIGRATED_KEY, String(Date.now()))
}

let migration = null

/**
* The implementation to use for a call, after the one-time move of local data to the backend
*/
async function store(){
  if (!usingBackend()){ return local }
  if (!migration){
    migration = migrateIfNeeded().catch((e) => {
      console.warn('Workflows: could not move the local data to the backend', e)
      migration = null
    })
  }
  await migration
  return remote
}

/**
* A backend call that fails falls back to the browser copy, so the sheet keeps working offline or
* when the backend does not have these routes yet
*/
function withFallback(name){
  return async function(...args){
    let impl = await store()
    if (impl === local){ return local[name](...args) }
    try {
      return await remote[name](...args)
    } catch (e) {
      console.warn('Workflows: backend', name, 'failed, using the browser copy', e.message)
      return local[name](...args)
    }
  }
}

const workflowStorage = {
  listDefinitions: withFallback('listDefinitions'),
  saveDefinition: withFallback('saveDefinition'),
  deleteDefinition: withFallback('deleteDefinition'),
  listSessions: withFallback('listSessions'),
  getSession: withFallback('getSession'),
  saveSession: withFallback('saveSession'),
  deleteSession: withFallback('deleteSession'),
  getColumnWidths: withFallback('getColumnWidths'),
  saveColumnWidths: withFallback('saveColumnWidths'),
  getPreferences: withFallback('getPreferences'),
  savePreferences: withFallback('savePreferences'),
  usingBackend: usingBackend,
}

export default workflowStorage
