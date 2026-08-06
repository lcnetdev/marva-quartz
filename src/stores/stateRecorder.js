import { defineStore } from 'pinia'
import { watch } from 'vue'

import { useProfileStore } from './profile'
import { usePreferenceStore } from './preference'

import { diffStates, applyOps } from '@/lib/state_recorder/json_patch'
import * as recorder from '@/lib/state_recorder/recorder'

/**
* Debugging aid: records every change to the active profile as timestamped
* diffs that can be downloaded, then replayed step by step on another machine.
* Enabled per region with the enableStateRecorder config flag.
*
* Recording piggybacks on profileStore.dataChangedTimestamp, the same debounced
* signal the undo system uses, so one recorded event == one undoable change.
*/

// non-reactive working data, the snapshots/history can be large
let unwatchProfile = null
let lastSnapshotStr = null
let lastSnapshotObj = null
let loadedHistory = null
let replayCache = null // {index, state} so stepping forward only applies the new events
let playTimer = null

export const useStateRecorderStore = defineStore('stateRecorder', {
    state: () => ({
        isRecording: false,
        recordingStarted: null,
        eventCount: 0,

        replayActive: false,
        replayIndex: 0, // 0 = initial state, i = state after event i
        replayTotal: 0,
        replayMeta: null,
        replayEventTimes: [],
        replayPlaying: false,
    }),

    actions: {

        startRecording() {
            if (this.isRecording) { return }
            if (this.replayActive) {
                alert('Close the state replay before starting a recording.')
                return
            }
            const profileStore = useProfileStore()
            if (!profileStore.activeProfile || !profileStore.activeProfile.id) {
                alert('Load a record before starting a recording.')
                return
            }

            // a recording interrupted by a reload is still in sessionStorage, offer it before overwriting
            const unfinished = recorder.recoverUnfinishedSessionRecording()
            if (unfinished && confirm('An unfinished state recording from before the page was reloaded was found. Download it before starting the new recording?')) {
                recorder.downloadRecording(unfinished)
            }

            lastSnapshotStr = JSON.stringify(profileStore.activeProfile)
            lastSnapshotObj = JSON.parse(lastSnapshotStr)

            const preferenceStore = usePreferenceStore()
            recorder.startSessionRecording(lastSnapshotObj, {
                recordId: profileStore.activeProfile.eId || profileStore.activeProfile.id || null,
                profileId: profileStore.activeProfile.id || null,
                user: preferenceStore.catInitals || null,
                url: window.location.href,
            })

            this.isRecording = true
            this.recordingStarted = Date.now()
            this.eventCount = 0

            unwatchProfile = watch(() => profileStore.dataChangedTimestamp, () => { this.captureChange() })
        },

        /**
        * Runs on every dataChangedTimestamp tick while recording, stores the
        * delta between the last snapshot and the current profile state
        */
        captureChange() {
            if (!this.isRecording) { return }
            const profileStore = useProfileStore()
            const str = JSON.stringify(profileStore.activeProfile)
            if (str === lastSnapshotStr) { return }
            const newObj = JSON.parse(str)
            const ops = diffStates(lastSnapshotObj, newObj)
            lastSnapshotStr = str
            lastSnapshotObj = newObj
            if (ops.length === 0) { return }
            recorder.appendSessionEvent({ t: Date.now(), ops: ops })
            this.eventCount++
        },

        /**
        * Stop recording and download the state history file
        */
        stopRecording() {
            if (!this.isRecording) { return }
            // dataChanged is debounced 500ms, capture anything still pending before closing out
            this.captureChange()
            if (unwatchProfile) { unwatchProfile(); unwatchProfile = null }
            this.isRecording = false
            this.recordingStarted = null
            lastSnapshotStr = null
            lastSnapshotObj = null
            const recording = recorder.finishSessionRecording()
            if (recording) { recorder.downloadRecording(recording) }
        },

        /**
        * Open a file picker for a state history file and start the replay
        */
        promptForHistoryFile() {
            if (this.isRecording) {
                alert('Stop the current recording before loading a state history.')
                return
            }
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json,application/json'
            input.onchange = () => {
                if (input.files && input.files[0]) { this.loadHistoryFile(input.files[0]) }
            }
            input.click()
        },

        async loadHistoryFile(file) {
            let recording
            try {
                recording = recorder.parseRecordingFile(await file.text())
            } catch (err) {
                alert('Could not load the state history file: ' + err.message)
                return
            }
            const who = (recording.meta && recording.meta.recordId) ? recording.meta.recordId : 'unknown record'
            if (!confirm(`Load the state history for "${who}" (${recording.events.length} changes)? Stepping through the replay will overwrite the record currently loaded in the editor.`)) {
                return
            }
            loadedHistory = recording
            replayCache = null
            this.replayTotal = recording.events.length
            this.replayMeta = Object.assign({ started: recording.started, ended: recording.ended }, recording.meta || {})
            this.replayEventTimes = recording.events.map((e) => e.t)
            this.replayPlaying = false
            this.replayActive = true
            this.replayIndex = 0
            this.applyReplayState(0)
        },

        replayGoTo(index) {
            if (!this.replayActive || !loadedHistory) { return }
            index = Math.max(0, Math.min(this.replayTotal, Number(index) || 0))
            this.replayIndex = index
            this.applyReplayState(index)
        },

        replayStep(delta) {
            this.replayGoTo(this.replayIndex + delta)
        },

        /**
        * Rebuild the state at the given position and swap it into the editor
        */
        applyReplayState(index) {
            // stepping forward continues from the cached state, anything else starts over from the initial snapshot
            if (!replayCache || replayCache.index > index) {
                replayCache = { index: 0, state: JSON.parse(JSON.stringify(loadedHistory.initialState)) }
            }
            try {
                while (replayCache.index < index) {
                    replayCache.state = applyOps(replayCache.state, loadedHistory.events[replayCache.index].ops)
                    replayCache.index++
                }
            } catch (err) {
                alert('Could not rebuild the state at this point in the history: ' + err.message)
                return
            }

            const profileStore = useProfileStore()
            profileStore.activeProfile = JSON.parse(JSON.stringify(replayCache.state))
            // same cleanup undo/redo does when swapping the whole profile
            profileStore.resetLocalComponentCache()
            profileStore.dataChangedTimestamp = Date.now()
            profileStore.activeProfileSaved = false
        },

        replayTogglePlay() {
            if (this.replayPlaying) {
                this.replayPause()
                return
            }
            if (!this.replayActive || !loadedHistory) { return }
            if (this.replayIndex >= this.replayTotal) { this.replayGoTo(0) }
            this.replayPlaying = true
            this.scheduleNextPlayStep()
        },

        scheduleNextPlayStep() {
            if (!this.replayPlaying) { return }
            if (this.replayIndex >= this.replayTotal) {
                this.replayPlaying = false
                return
            }
            // honor the recorded pacing, capped so long pauses don't stall the playback
            const nextEvent = loadedHistory.events[this.replayIndex]
            const prevTime = this.replayIndex === 0 ? loadedHistory.started : loadedHistory.events[this.replayIndex - 1].t
            const delay = Math.min(3000, Math.max(250, nextEvent.t - prevTime))
            playTimer = window.setTimeout(() => {
                if (!this.replayPlaying) { return }
                this.replayGoTo(this.replayIndex + 1)
                this.scheduleNextPlayStep()
            }, delay)
        },

        replayPause() {
            this.replayPlaying = false
            if (playTimer) {
                window.clearTimeout(playTimer)
                playTimer = null
            }
        },

        /**
        * Close the replay controls, the editor keeps whatever state was last applied
        */
        closeReplay() {
            this.replayPause()
            this.replayActive = false
            this.replayIndex = 0
            this.replayTotal = 0
            this.replayMeta = null
            this.replayEventTimes = []
            loadedHistory = null
            replayCache = null
        },

    }
})
