/**
* Manages the in-progress state recording for the state recorder feature.
*
* The active recording is kept in memory and mirrored into sessionStorage so an
* interrupted session (reload/crash) can still be recovered and downloaded.
* The initial snapshot is written once, events are appended as pre-serialized
* strings so each capture doesn't re-stringify the whole history.
*/

export const RECORDING_FILE_TYPE = 'marva-state-recording'
export const RECORDING_FILE_VERSION = 1

const SESSION_KEY_BASE = 'marva-state-recorder-base'
const SESSION_KEY_EVENTS = 'marva-state-recorder-events'

// the recording currently in progress, not reactive on purpose - the states can be large
let active = null

/**
* Start a new recording
* @param {object} initialState - JSON-safe snapshot of the profile state at recording start
* @param {object} meta - info about the record/user this recording belongs to
* @return {object} the new recording
*/
export function startSessionRecording(initialState, meta) {
    const recording = {
        type: RECORDING_FILE_TYPE,
        version: RECORDING_FILE_VERSION,
        started: Date.now(),
        ended: null,
        meta: meta || {},
        initialState: initialState,
        events: []
    }
    active = { recording: recording, eventStrings: [], persistFailed: false }
    try {
        // events are persisted under their own key so this large write happens only once
        sessionStorage.setItem(SESSION_KEY_BASE, JSON.stringify({ ...recording, events: undefined }))
        sessionStorage.setItem(SESSION_KEY_EVENTS, '[]')
    } catch (err) {
        active.persistFailed = true
        console.warn('State recorder: could not persist to sessionStorage, recording in memory only', err)
    }
    return recording
}

/**
* Append a change event to the active recording
* @param {object} event - {t: timestamp, ops: [...]} from json_patch diffStates
* @return {void}
*/
export function appendSessionEvent(event) {
    if (!active) { return }
    active.recording.events.push(event)
    if (active.persistFailed) { return }
    active.eventStrings.push(JSON.stringify(event))
    try {
        sessionStorage.setItem(SESSION_KEY_EVENTS, '[' + active.eventStrings.join(',') + ']')
    } catch (err) {
        active.persistFailed = true
        console.warn('State recorder: could not persist to sessionStorage, recording in memory only', err)
    }
}

/**
* Stop the active recording and clear the sessionStorage mirror
* @return {object|null} the finished recording
*/
export function finishSessionRecording() {
    if (!active) { return null }
    const recording = active.recording
    recording.ended = Date.now()
    active = null
    clearSessionRecording()
    return recording
}

/**
* Throw away the active recording (if any) and its sessionStorage mirror
* @return {void}
*/
export function discardSessionRecording() {
    active = null
    clearSessionRecording()
}

function clearSessionRecording() {
    try {
        sessionStorage.removeItem(SESSION_KEY_BASE)
        sessionStorage.removeItem(SESSION_KEY_EVENTS)
    } catch { /* nothing to do */ }
}

/**
* If a recording was interrupted (page reload mid-recording) rebuild it from
* the sessionStorage mirror so it can still be downloaded
* @return {object|null} the recovered recording
*/
export function recoverUnfinishedSessionRecording() {
    if (active) { return null }
    try {
        const base = sessionStorage.getItem(SESSION_KEY_BASE)
        if (!base) { return null }
        const recording = JSON.parse(base)
        recording.events = JSON.parse(sessionStorage.getItem(SESSION_KEY_EVENTS) || '[]')
        if (!recording.ended) {
            recording.ended = recording.events.length > 0 ? recording.events[recording.events.length - 1].t : recording.started
        }
        return recording
    } catch {
        return null
    }
}

/**
* Parse and validate the text of a state history file
* @param {string} text - the file contents
* @return {object} the recording
*/
export function parseRecordingFile(text) {
    let data
    try {
        data = JSON.parse(text)
    } catch {
        throw new Error('the file is not valid JSON')
    }
    if (!data || data.type !== RECORDING_FILE_TYPE) {
        throw new Error('the file is not a Marva state history file')
    }
    if (!data.initialState || !Array.isArray(data.events)) {
        throw new Error('the file is missing the recorded states')
    }
    for (let event of data.events) {
        if (!event || !Array.isArray(event.ops)) {
            throw new Error('the file has a malformed change event')
        }
    }
    return data
}

/**
* Download a recording as a JSON file
* @param {object} recording - the recording to download
* @return {void}
*/
export function downloadRecording(recording) {
    const blob = new Blob([JSON.stringify(recording)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const started = new Date(recording.started).toISOString().replace(/[:.]/g, '-')
    const recordId = (recording.meta && recording.meta.recordId) ? recording.meta.recordId : 'record'
    a.href = url
    a.download = `marva-state-history-${recordId}-${started}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => { URL.revokeObjectURL(url) }, 5000)
}
