<template>
    <VueFinalModal
        display-directive="show"
        :hide-overlay="true"
        :overlay-transition="'vfm-fade'"
        @closed="closeModal()"
      >
        <VueDragResize
            :is-active="true"
            :w="900"
            :h="600"
            :x="150"
            :y="40"
            @resizing="dragResize"
            @dragging="dragResize"
            :sticks="['br']"
            :stickSize="22"
            style="background-color: whitesmoke"
            >

            <div class="yoshino-modal" ref="yoshinoContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
                <div>
                    <div class="yoshino-menu-button">
                        <button @click="closeModal()" class="close-button">Close</button>
                    </div>
                </div>
                <div ref="yoshinoModalContainer" class="yoshino-modal-container">
                    <h1 style="margin-left: 5px">Yoshino Subjects</h1>

                    <div v-if="!results && !loading && !error" class="yoshino-input-section">
                        <div class="yoshino-field">
                            <label>Title:</label>
                            <span class="yoshino-value">{{ title || '(not found)' }}</span>
                        </div>
                        <div class="yoshino-field">
                            <label>Summary:</label>
                            <span class="yoshino-value">{{ summaryTruncated || '(not found)' }}</span>
                        </div>
                        <div class="yoshino-field">
                            <label>Creator:</label>
                            <span class="yoshino-value">{{ creator || '(not found)' }}</span>
                        </div>
                        <div style="margin-top: 12px">
                            <button @click="runClassify()" :disabled="!title">Get Subject Recommendations</button>
                        </div>
                        <p v-if="!title" class="yoshino-warning">A title is required to get recommendations.</p>
                    </div>

                    <div v-if="loading" class="yoshino-loading">
                        <div class="yoshino-spinner"></div>
                        <p>{{ statusMessage }}</p>
                    </div>

                    <div v-if="error" class="yoshino-error">
                        <p>{{ error }}</p>
                        <button @click="reset()">Try Again</button>
                    </div>

                    <div v-if="results && !loading" class="yoshino-results">
                        <div class="yoshino-results-columns">
                            <div class="yoshino-recommended">
                                <h2>Recommended Subjects</h2>
                                <div v-if="results.recommended.length === 0" class="yoshino-empty">No recommended subjects found.</div>
                                <ul>
                                    <li v-for="(subj, idx) in results.recommended" :key="'rec-'+idx"
                                        :class="{'yoshino-inserted': insertedSubjects.has(subj)}">
                                        <div class="yoshino-subject-row">
                                            <div class="yoshino-subject-info">
                                                <span class="yoshino-subject-label">{{ subj }}</span>
                                                <span class="yoshino-subject-source" v-if="results.subjectSources[subj]">{{ results.subjectSources[subj] }}</span>
                                                <a v-if="results.subjectSourceMap[subj]"
                                                   :href="'https://preprod.id.loc.gov/resources/works/' + results.subjectSourceMap[subj]"
                                                   target="_blank"
                                                   class="yoshino-lccn-link">source</a>
                                            </div>
                                            <button v-if="!insertedSubjects.has(subj)"
                                                    @click="insertSubject(subj)"
                                                    class="yoshino-insert-btn">Insert</button>
                                            <span v-else class="yoshino-inserted-label">Inserted</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div class="yoshino-other">
                                <h2>Other Subjects</h2>
                                <div v-if="results.otherSubjects.length === 0" class="yoshino-empty">No additional subjects found.</div>
                                <ul>
                                    <li v-for="(subj, idx) in results.otherSubjects" :key="'other-'+idx"
                                        :class="{'yoshino-inserted': insertedSubjects.has(subj)}">
                                        <div class="yoshino-subject-row">
                                            <div class="yoshino-subject-info">
                                                <span class="yoshino-subject-label">{{ subj }}</span>
                                                <span class="yoshino-subject-source" v-if="results.subjectSources[subj]">{{ results.subjectSources[subj] }}</span>
                                                <a v-if="results.subjectSourceMap[subj]"
                                                   :href="'https://preprod.id.loc.gov/resources/works/' + results.subjectSourceMap[subj]"
                                                   target="_blank"
                                                   class="yoshino-lccn-link">source</a>
                                            </div>
                                            <button v-if="!insertedSubjects.has(subj)"
                                                    @click="insertSubject(subj)"
                                                    class="yoshino-insert-btn">Insert</button>
                                            <span v-else class="yoshino-inserted-label">Inserted</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="yoshino-actions">
                            <button @click="reset()">Search Again</button>
                            <button @click="closeModal()">Done</button>
                        </div>
                    </div>
                </div>
            </div>
        </VueDragResize>
    </VueFinalModal>
  </template>


  <style type="text/css" scoped>
    .yoshino-modal {
        background-color: whitesmoke;
        height: 100%;
    }

    .yoshino-modal-container {
        height: calc(100% - 10px);
        overflow-y: auto;
        padding: 0 10px 10px 0;
    }

    .yoshino-menu-button {
        float: right;
        margin: 5px;
    }

    .close-button {
        position: absolute;
        right: 5px;
        top: 5px;
        background-color: white;
        border-radius: 5px;
        border: solid 1px black;
        cursor: pointer;
        z-index: 100;
    }

    .yoshino-input-section {
        padding: 10px;
    }

    .yoshino-field {
        margin-bottom: 8px;
    }

    .yoshino-field label {
        font-weight: bold;
        margin-right: 8px;
        min-width: 70px;
        display: inline-block;
    }

    .yoshino-value {
        color: #333;
    }

    .yoshino-warning {
        color: #b71c1c;
        font-size: 0.85rem;
        margin-top: 6px;
    }

    .yoshino-loading {
        text-align: center;
        padding: 40px;
    }

    .yoshino-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #ccc;
        border-top-color: #1976d2;
        border-radius: 50%;
        animation: yoshino-spin 0.8s linear infinite;
        margin: 0 auto 12px;
    }

    @keyframes yoshino-spin {
        to { transform: rotate(360deg); }
    }

    .yoshino-error {
        padding: 20px;
        color: #b71c1c;
    }

    .yoshino-results {
        padding: 5px 10px;
        height: calc(100% - 60px);
        display: flex;
        flex-direction: column;
    }

    .yoshino-results-columns {
        display: flex;
        gap: 10px;
        flex: 1;
        overflow: hidden;
    }

    .yoshino-recommended, .yoshino-other {
        flex: 1;
        overflow-y: auto;
        background: white;
        border-radius: 5px;
        border: 1px solid #ccc;
        padding: 8px;
    }

    .yoshino-recommended h2, .yoshino-other h2 {
        font-size: 0.95rem;
        margin: 0 0 8px 0;
        padding-bottom: 4px;
        border-bottom: 1px solid #ddd;
    }

    .yoshino-recommended {
        border-left: 3px solid #1976d2;
    }

    .yoshino-results ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .yoshino-results li {
        padding: 6px 4px;
        border-bottom: 1px solid #eee;
    }

    .yoshino-results li:last-child {
        border-bottom: none;
    }

    .yoshino-subject-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
    }

    .yoshino-subject-info {
        flex: 1;
        min-width: 0;
    }

    .yoshino-subject-label {
        display: block;
        font-size: 0.9rem;
    }

    .yoshino-subject-source {
        display: inline-block;
        font-size: 0.75rem;
        color: #666;
        margin-top: 2px;
    }

    .yoshino-lccn-link {
        font-size: 0.75rem;
        margin-left: 6px;
        color: #1976d2;
    }

    .yoshino-insert-btn {
        background-color: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 10px;
        cursor: pointer;
        font-size: 0.8rem;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .yoshino-insert-btn:hover {
        background-color: #1565c0;
    }

    .yoshino-inserted {
        background-color: #e8f5e9;
    }

    .yoshino-inserted-label {
        color: #2e7d32;
        font-size: 0.8rem;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .yoshino-empty {
        color: #888;
        font-size: 0.85rem;
        padding: 10px;
    }

    .yoshino-actions {
        padding: 8px 0 0;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .yoshino-actions button {
        padding: 6px 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
    }

    .yoshino-actions button:hover {
        background: #f0f0f0;
    }
  </style>

  <script>
    import { VueFinalModal } from 'vue-final-modal'
    import VueDragResize from 'vue3-drag-resize'
    import { mapStores, mapState, mapWritableState } from 'pinia'
    import { useProfileStore } from '@/stores/profile'
    import { yoshinoClassify, yoshinoExtractTitle, yoshinoExtractSummary, yoshinoExtractCreator } from '@/lib/yoshino'

    export default {
    name: "YoshinoSubjectsModal",
    components: {
        VueFinalModal,
        VueDragResize,
    },

    data: function() {
        return {
            title: null,
            summary: null,
            creator: null,
            loading: false,
            error: null,
            statusMessage: '',
        }
    },

    computed: {
        ...mapStores(useProfileStore),
        ...mapState(useProfileStore, ['activeProfile']),
        ...mapWritableState(useProfileStore, ['showYoshinoSubjectsModal', 'yoshinoResults', 'yoshinoInsertedSubjects']),

        results: {
            get() { return this.yoshinoResults },
            set(val) { this.yoshinoResults = val },
        },

        insertedSubjects: {
            get() { return new Set(this.yoshinoInsertedSubjects) },
            set(val) { this.yoshinoInsertedSubjects = Array.from(val) },
        },

        summaryTruncated() {
            if (!this.summary) return null
            return this.summary.length > 200 ? this.summary.substring(0, 200) + '...' : this.summary
        },
    },

    methods: {
        dragResize: function(newRect) {
            this.width = newRect.width
            this.height = newRect.height
            this.top = newRect.top
            this.left = newRect.left
            this.$refs.yoshinoContent.style.height = newRect.height + 'px'
        },

        closeModal: function() {
            this.loading = false
            this.error = null
            this.statusMessage = ''
            this.showYoshinoSubjectsModal = false
        },

        reset: function() {
            this.loading = false
            this.error = null
            this.results = null
            this.insertedSubjects = new Set()
            this.statusMessage = ''
            this.extractProfileData()
        },

        extractProfileData: function() {
            this.title = yoshinoExtractTitle(this.activeProfile)
            this.summary = yoshinoExtractSummary(this.activeProfile)
            this.creator = yoshinoExtractCreator(this.activeProfile)
        },

        runClassify: async function() {
            this.loading = true
            this.error = null
            this.results = null
            this.insertedSubjects = new Set()

            try {
                this.results = await yoshinoClassify(
                    this.title,
                    this.summary || '',
                    this.creator || '',
                    (msg) => { this.statusMessage = msg }
                )
            } catch (e) {
                this.error = e.message || 'An error occurred during classification.'
            } finally {
                this.loading = false
            }
        },

        insertSubject: function(label) {
            const source = this.results?.subjectSources[label] || ''
            const components = this.results?.subjectComponentsMap[label] || []
            const uri = this.results?.subjectUriMap[label] || null
            const marcKey = this.results?.subjectMarcKeyMap[label] || null
            this.profileStore.yoshinoInsertSubject(label, source, components, uri, marcKey)
            this.insertedSubjects.add(label)
            // Force reactivity for the Set
            this.insertedSubjects = new Set(this.insertedSubjects)
        },

        onSelectElement(event) {
            const tagName = event.target.tagName
            if (tagName === 'INPUT' || tagName === 'TD' || tagName === 'BUTTON' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'A') {
                event.stopPropagation()
            }
        },
    },

    mounted: function() {
        this.extractProfileData()
    },
  };
  </script>
