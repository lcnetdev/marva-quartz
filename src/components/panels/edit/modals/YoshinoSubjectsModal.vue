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
            style="background-color: whitesmoke; box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);"
            >

            <div class="yoshino-modal" ref="yoshinoContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
                <div>
                    <div class="yoshino-menu-button">
                        <button @click="closeModal()" class="close-button">Close</button>
                    </div>
                </div>
                <button @click="preferenceStore.togglePanel('linkedData')" class="yoshino-toggle-ld-button">Toggle LD Panel</button>
                <div ref="yoshinoModalContainer" class="yoshino-modal-container">
                    <h1 style="margin-left: 5px">Subject Finder</h1>

                    <div v-if="!results && !loading && !error" class="yoshino-input-section">
                        <div class="yoshino-field">
                            <label>Title:</label>
                            <span class="yoshino-value">{{ title || '(not found)' }}</span>
                        </div>
                        <div class="yoshino-field" :class="{'yoshino-disabled': useUserDescription}">
                            <label>Summary:</label>
                            <div v-if="summaryAlternatives.length > 0" class="yoshino-radio-group">
                                <label class="yoshino-radio-option">
                                    <input type="radio" name="summary-source" value="record" v-model="summarySource" @change="summary = recordSummary" :disabled="useUserDescription">
                                    <span class="yoshino-radio-source">Record</span>
                                    <span class="yoshino-radio-text">{{ recordSummary ? (recordSummary.length > 200 ? recordSummary.substring(0, 200) + '...' : recordSummary) : '(not found)' }}</span>
                                    <span v-if="recordSummary" class="yoshino-word-count">({{ recordSummary.split(/\s+/).length }} words)</span>
                                </label>
                                <label v-for="(alt, idx) in summaryAlternatives" :key="'sum-alt-'+idx" class="yoshino-radio-option">
                                    <input type="radio" name="summary-source" :value="'alt-sum-'+idx" v-model="summarySource" @change="summary = alt.value" :disabled="useUserDescription">
                                    <span class="yoshino-radio-source">{{ alt.label }}</span>
                                    <span class="yoshino-radio-text">{{ alt.value.length > 200 ? alt.value.substring(0, 200) + '...' : alt.value }}</span>
                                    <span class="yoshino-word-count">({{ alt.value.split(/\s+/).length }} words)</span>
                                </label>
                            </div>
                            <span v-else class="yoshino-value">{{ summaryTruncated || '(not found)' }}</span>
                        </div>
                        <div class="yoshino-field">
                            <label>Creator:</label>
                            <span class="yoshino-value">{{ creator || '(not found)' }}</span>
                        </div>
                        <div class="yoshino-field" :class="{'yoshino-disabled': useUserDescription}">
                            <label>Contents:</label>
                            <div v-if="contentsAlternatives.length > 0" class="yoshino-radio-group">
                                <label class="yoshino-radio-option">
                                    <input type="radio" name="contents-source" value="record" v-model="contentsSource" @change="contents = recordContents" :disabled="useUserDescription">
                                    <span class="yoshino-radio-source">Record</span>
                                    <span class="yoshino-radio-text">{{ recordContents ? (recordContents.length > 200 ? recordContents.substring(0, 200) + '...' : recordContents) : '(not found)' }}</span>
                                    <span v-if="recordContents" class="yoshino-word-count">({{ recordContents.split(/\s+/).length }} words)</span>
                                </label>
                                <label v-for="(alt, idx) in contentsAlternatives" :key="'toc-alt-'+idx" class="yoshino-radio-option">
                                    <input type="radio" name="contents-source" :value="'alt-toc-'+idx" v-model="contentsSource" @change="contents = alt.value" :disabled="useUserDescription">
                                    <span class="yoshino-radio-source">{{ alt.label }}</span>
                                    <span class="yoshino-radio-text">{{ alt.value.length > 200 ? alt.value.substring(0, 200) + '...' : alt.value }}</span>
                                    <span class="yoshino-word-count">({{ alt.value.split(/\s+/).length }} words)</span>
                                </label>
                            </div>
                            <span v-else class="yoshino-value">{{ contents ? (contents.length > 200 ? contents.substring(0, 200) + '...' : contents) : '(not found)' }}</span>
                        </div>
                        <div class="yoshino-field">
                            <label>Or describe:</label>
                            <textarea v-model="userDescription"
                                      class="yoshino-user-description"
                                      rows="3"
                                      placeholder="Optional. Type a description of the work to use instead of Summary/Contents."></textarea>
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
                        <button v-if="noSubjectsFound && topK < 20" @click="increaseAndRetry()">Increase number of resources returned</button>
                        <button v-else @click="reset()">Try Again</button>
                    </div>

                    <div v-if="results && !loading" class="yoshino-results">
                        <div class="yoshino-tabs">
                            <button :class="{'yoshino-tab': true, 'yoshino-tab-active': resultsTab === 'subjects'}" @click="resultsTab = 'subjects'">Subjects</button>
                            <button :class="{'yoshino-tab': true, 'yoshino-tab-active': resultsTab === 'classifications'}" @click="resultsTab = 'classifications'">Classifications<span v-if="results.classifications && results.classifications.length" class="yoshino-tab-count">{{ results.classifications.length }}</span></button>
                        </div>
                        <div v-if="resultsTab === 'subjects'" class="yoshino-results-columns">
                            <div class="yoshino-recommended">
                                <h2>Recommended Subjects</h2>
                                <div v-if="results.recommended.length === 0" class="yoshino-empty">No recommended subjects found.</div>
                                <ul>
                                    <li v-for="(subj, idx) in sortedRecommended" :key="'rec-'+idx"
                                        :class="{'yoshino-inserted': insertedSubjects.has(subj)}">
                                        <div class="yoshino-subject-row">
                                            <div class="yoshino-subject-info">
                                                <span class="yoshino-subject-label">{{ subj }}</span>
                                                <span class="yoshino-subject-source" v-if="subjectSourceLabel(subj)">{{ subjectSourceLabel(subj) }}</span>
                                                <a v-if="results.subjectSourceMap[subj]"
                                                   :href="'https://preprod.id.loc.gov/resources/works/' + results.subjectSourceMap[subj]"
                                                   target="_blank"
                                                   class="yoshino-lccn-link">source</a>
                                                <span v-if="subjectUsageCounts[subj] !== undefined" class="yoshino-usage-badge">{{ subjectUsageCounts[subj] }} usage</span>
                                            </div>
                                            <button v-if="!insertedSubjects.has(subj)"
                                                    @click="insertSubject(subj)"
                                                    :class="insertButtonClass(subj)">{{ insertButtonLabel(subj) }}</button>
                                            <span v-else class="yoshino-inserted-label">Inserted</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div class="yoshino-other">
                                <h2>Other Subjects</h2>
                                <div v-if="results.otherSubjects.length === 0" class="yoshino-empty">No additional subjects found.</div>
                                <ul>
                                    <li v-for="(subj, idx) in sortedOtherSubjects" :key="'other-'+idx"
                                        :class="{'yoshino-inserted': insertedSubjects.has(subj)}">
                                        <div class="yoshino-subject-row">
                                            <div class="yoshino-subject-info">
                                                <span class="yoshino-subject-label">{{ subj }}</span>
                                                <span class="yoshino-subject-source" v-if="subjectSourceLabel(subj)">{{ subjectSourceLabel(subj) }}</span>
                                                <a v-if="results.subjectSourceMap[subj]"
                                                   :href="'https://preprod.id.loc.gov/resources/works/' + results.subjectSourceMap[subj]"
                                                   target="_blank"
                                                   class="yoshino-lccn-link">source</a>
                                                <span v-if="subjectUsageCounts[subj] !== undefined" class="yoshino-usage-badge">{{ subjectUsageCounts[subj] }} usage</span>
                                            </div>
                                            <button v-if="!insertedSubjects.has(subj)"
                                                    @click="insertSubject(subj)"
                                                    :class="insertButtonClass(subj)">{{ insertButtonLabel(subj) }}</button>
                                            <span v-else class="yoshino-inserted-label">Inserted</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div v-if="resultsTab === 'classifications'" class="yoshino-classifications">
                            <div v-if="!sortedClassifications.length" class="yoshino-empty">No classifications found.</div>
                            <ul v-else>
                                <li v-for="(c, idx) in sortedClassifications" :key="'cls-'+idx"
                                    :class="{'yoshino-inserted': insertedClassifications.has(c.key)}">
                                    <div class="yoshino-subject-row">
                                        <div class="yoshino-subject-info">
                                            <span class="yoshino-classification-type">{{ classificationLabel(c.type) }}<span v-if="c.edition"> ({{ c.edition }})</span></span>
                                            <span class="yoshino-subject-label">{{ c.portion }}</span>
                                            <a v-if="results.classificationSourceMap && results.classificationSourceMap[c.key]"
                                               :href="'https://preprod.id.loc.gov/resources/works/' + results.classificationSourceMap[c.key]"
                                               target="_blank"
                                               class="yoshino-lccn-link">source</a>
                                            <span v-if="results.classificationCounts && results.classificationCounts[c.key] > 1"
                                                  class="yoshino-usage-badge"
                                                  :title="'Used on ' + results.classificationCounts[c.key] + ' of the retrieved similar records'">{{ results.classificationCounts[c.key] }}×</span>
                                        </div>
                                        <button v-if="!insertedClassifications.has(c.key)"
                                                @click="insertClassification(c)"
                                                class="yoshino-insert-btn">Insert</button>
                                        <span v-else class="yoshino-inserted-label">Inserted</span>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div class="yoshino-actions">
                            <button v-if="topK < 20" @click="moreSuggestions()">More Suggestions</button>
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

    .yoshino-toggle-ld-button {
        position: absolute;
        left: 5px;
        bottom: 5px;
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

    .yoshino-radio-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 2px;
    }

    .yoshino-radio-option {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 4px 6px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: normal;
        min-width: 0;
    }

    .yoshino-radio-option:hover {
        background: #f0f0f0;
    }

    .yoshino-radio-option input[type="radio"] {
        margin-top: 3px;
        flex-shrink: 0;
    }

    .yoshino-radio-source {
        font-size: 0.78rem;
        font-weight: bold;
        color: #1976d2;
        white-space: nowrap;
        flex-shrink: 0;
        min-width: 60px;
    }

    .yoshino-radio-text {
        font-size: 0.82rem;
        color: #444;
        line-height: 1.3;
    }

    .yoshino-word-count {
        font-size: 0.75rem;
        color: #888;
        white-space: nowrap;
        flex-shrink: 0;
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

    .yoshino-usage-badge {
        font-size: 0.75rem;
        margin-left: 6px;
        color: #555;
        background: #e8eef5;
        border-radius: 3px;
        padding: 1px 5px;
    }

    .yoshino-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 8px;
        border-bottom: 1px solid #ccc;
    }

    .yoshino-tab {
        background: #eee;
        border: 1px solid #ccc;
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        padding: 4px 12px;
        cursor: pointer;
        font-size: 0.85rem;
    }

    .yoshino-tab-active {
        background: white;
        font-weight: bold;
    }

    .yoshino-tab-count {
        margin-left: 6px;
        font-size: 0.75rem;
        color: #666;
        background: #ddd;
        border-radius: 8px;
        padding: 0 6px;
    }

    .yoshino-classifications {
        flex: 1;
        overflow-y: auto;
        background: white;
        border-radius: 5px;
        border: 1px solid #ccc;
        padding: 8px;
    }

    .yoshino-classifications ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .yoshino-disabled {
        opacity: 0.45;
        pointer-events: none;
    }

    .yoshino-user-description {
        width: 100%;
        max-width: 700px;
        font-size: 0.85rem;
        padding: 6px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
        font-family: inherit;
        box-sizing: border-box;
    }

    .yoshino-classification-type {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: bold;
        background: #1976d2;
        color: white;
        border-radius: 3px;
        padding: 1px 6px;
        margin-right: 6px;
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

    .yoshino-insert-btn-uncontrolled {
        background-color: #e65100;
    }

    .yoshino-insert-btn-uncontrolled:hover {
        background-color: #bf360c;
    }

    .yoshino-insert-btn-nar {
        background-color: #6a1b9a;
    }

    .yoshino-insert-btn-nar:hover {
        background-color: #4a148c;
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
    import { usePreferenceStore } from '@/stores/preference'
    import { yoshinoClassify, yoshinoExtractTitle, yoshinoExtractSummary, yoshinoExtractCreator, yoshinoExtractContents } from '@/lib/yoshino'

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
            contents: null,
            recordSummary: null,
            recordContents: null,
            summarySource: 'record',
            contentsSource: 'record',
            loading: false,
            error: null,
            noSubjectsFound: false,
            topK: 10,
            statusMessage: '',
            subjectUsageCounts: {},
            enrichmentRunId: 0,
            resultsTab: 'subjects',
            insertedClassifications: new Set(),
            userDescription: '',
        }
    },

    computed: {
        ...mapStores(useProfileStore, usePreferenceStore),
        ...mapState(useProfileStore, ['activeProfile', 'linkedData']),
        ...mapWritableState(useProfileStore, ['showYoshinoSubjectsModal', 'yoshinoResults', 'yoshinoInsertedSubjects']),

        summaryAlternatives() {
            let alts = []
            if (this.linkedData && this.linkedData.noteContent) {
                for (let item of this.linkedData.noteContent) {
                    alts.push({ label: item.type + ' (' + item.id + ')', value: item.value })
                }
            }
            if (this.linkedData && this.linkedData.booksellerResults) {
                for (let result of this.linkedData.booksellerResults) {
                    if (result.sections && result.sections.description) {
                        for (let desc of result.sections.description) {
                            alts.push({ label: result.site, value: desc })
                        }
                    }
                }
            }
            return alts
        },

        contentsAlternatives() {
            let alts = []
            if (this.linkedData && this.linkedData.noteTOC) {
                for (let item of this.linkedData.noteTOC) {
                    alts.push({ label: item.type + ' (' + item.id + ')', value: item.value })
                }
            }
            if (this.linkedData && this.linkedData.booksellerResults) {
                for (let result of this.linkedData.booksellerResults) {
                    if (result.sections && result.sections.table_of_contents) {
                        for (let toc of result.sections.table_of_contents) {
                            alts.push({ label: result.site, value: toc })
                        }
                    }
                }
            }
            return alts
        },

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

        sortedRecommended() {
            if (!this.results || !this.results.recommended) return []
            return [...this.results.recommended].sort((a, b) => a.localeCompare(b))
        },

        sortedOtherSubjects() {
            if (!this.results || !this.results.otherSubjects) return []
            return [...this.results.otherSubjects].sort((a, b) => a.localeCompare(b))
        },

        useUserDescription() {
            return !!(this.userDescription && this.userDescription.trim())
        },

        sortedClassifications() {
            if (!this.results || !this.results.classifications) return []
            const order = {
                'http://id.loc.gov/ontologies/bibframe/ClassificationLcc': 1,
                'http://id.loc.gov/ontologies/bibframe/ClassificationDdc': 2,
                'http://id.loc.gov/ontologies/bibframe/ClassificationNlm': 3,
                'http://id.loc.gov/ontologies/bibframe/ClassificationNal': 4,
                'http://id.loc.gov/ontologies/bibframe/ClassificationOther': 5,
                'http://id.loc.gov/ontologies/bibframe/Classification': 6,
            }
            return [...this.results.classifications].sort((a, b) => {
                const oa = order[a.type] || 99
                const ob = order[b.type] || 99
                if (oa !== ob) return oa - ob
                return a.portion.localeCompare(b.portion)
            })
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
            this.enrichmentRunId++
            this.showYoshinoSubjectsModal = false
        },

        reset: function() {
            this.loading = false
            this.error = null
            this.noSubjectsFound = false
            this.topK = 10
            this.results = null
            this.insertedSubjects = new Set()
            this.insertedClassifications = new Set()
            this.subjectUsageCounts = {}
            this.enrichmentRunId++
            this.resultsTab = 'subjects'
            this.statusMessage = ''
            this.userDescription = ''
            this.extractProfileData()
        },

        extractProfileData: function() {
            this.title = yoshinoExtractTitle(this.activeProfile)
            this.summary = yoshinoExtractSummary(this.activeProfile)
            this.creator = yoshinoExtractCreator(this.activeProfile)
            this.contents = yoshinoExtractContents(this.activeProfile)
            this.recordSummary = this.summary
            this.recordContents = this.contents
            this.summarySource = this.summary ? 'record' : (this.summaryAlternatives.length > 0 ? 'alt-sum-0' : 'record')
            this.contentsSource = this.contents ? 'record' : (this.contentsAlternatives.length > 0 ? 'alt-toc-0' : 'record')
            if (!this.summary && this.summaryAlternatives.length > 0) this.summary = this.summaryAlternatives[0].value
            if (!this.contents && this.contentsAlternatives.length > 0) this.contents = this.contentsAlternatives[0].value
        },

        runClassify: async function() {
            this.loading = true
            this.error = null
            this.noSubjectsFound = false
            this.results = null
            this.insertedSubjects = new Set()
            this.insertedClassifications = new Set()
            this.subjectUsageCounts = {}
            this.enrichmentRunId++
            this.resultsTab = 'subjects'

            this.profileStore.logEvent('SUBJECT_FINDER_START')
            try {
                const usingUserDesc = this.useUserDescription
                this.results = await yoshinoClassify(
                    this.title,
                    usingUserDesc ? '' : (this.summary || ''),
                    this.creator || '',
                    (msg) => { this.statusMessage = msg },
                    this.topK,
                    usingUserDesc ? '' : (this.contents || ''),
                    usingUserDesc ? this.userDescription.trim() : ''
                )
                console.log("Classification results:", this.results)
                this.enrichRecommendedUsage(this.results, this.enrichmentRunId)
            } catch (e) {
                this.error = e.message || 'An error occurred during classification.'
                if (this.error.toLowerCase().includes('no subjects found')) {
                    this.noSubjectsFound = true
                }
            } finally {
                this.loading = false
            }
        },

        enrichRecommendedUsage: async function(results, runId) {
            if (!results) return
            const seen = new Set()
            const subjects = []
            for (const subj of [...(results.recommended || []), ...(results.otherSubjects || [])]) {
                if (seen.has(subj)) continue
                seen.add(subj)
                subjects.push(subj)
            }
            const batchSize = 2
            for (let i = 0; i < subjects.length; i += batchSize) {
                if (runId !== this.enrichmentRunId) return
                const batch = subjects.slice(i, i + batchSize)
                await Promise.all(batch.map(subj => this.fetchSubjectUsage(subj, results, runId)))
            }
        },

        fetchSubjectUsage: async function(subj, results, runId) {
            try {
                const uri = results.subjectUriMap && results.subjectUriMap[subj]
                let url
                if (uri) {
                    const id = uri.substring(uri.lastIndexOf('/') + 1)
                    url = `https://preprod-8080.id.loc.gov/authorities/subjects/suggest2?q=${encodeURIComponent(id)}&usage=2`
                } else {
                    url = `https://preprod-8080.id.loc.gov/entities/subjects/suggest2/?q=${encodeURIComponent(subj)}&searchtype=left&count=250&usage=true`
                }
                const resp = await fetch(url)
                if (!resp.ok) return
                const data = await resp.json()
                if (runId !== this.enrichmentRunId) return
                const hit = data && data.hits && data.hits[0]
                if (!hit) return
                if (uri) {
                    if (hit.uri !== uri) return
                } else {
                    if (hit.aLabel !== subj) return
                }
                const count = hit['subject-of']
                if (typeof count !== 'number') return
                this.subjectUsageCounts = { ...this.subjectUsageCounts, [subj]: count }
            } catch (e) {
                // silent — enrichment is best-effort
            }
        },

        increaseAndRetry: function() {
            this.topK = 20
            this.error = null
            this.noSubjectsFound = false
            this.runClassify()
        },

        moreSuggestions: function() {
            this.topK = 20
            this.runClassify()
        },

        insertSubject: function(label) {
            const source = this.results?.subjectSources[label] || ''
            const components = this.results?.subjectComponentsMap[label] || []
            const uri = this.results?.subjectUriMap[label] || null
            const marcKey = this.results?.subjectMarcKeyMap[label] || null
            this.profileStore.yoshinoInsertSubject(label, source, components, uri, marcKey)
            this.profileStore.logEvent('SUBJECT_FINDER_INSERT', { metadata: [label] })
            this.insertedSubjects.add(label)
            // Force reactivity for the Set
            this.insertedSubjects = new Set(this.insertedSubjects)
        },

        // A name authority record (NAR) used as a subject (e.g. a Person/Org/Place heading).
        // These carry a name-authority URI rather than a subject-thesaurus source, so detect them
        // by the URI pattern (/rwo/agents/ or /authorities/names/) instead of the source label.
        isNarSubject: function(subj) {
            const uri = this.results?.subjectUriMap?.[subj] || ''
            return uri.includes('/rwo/agents/') || uri.includes('/authorities/names/')
        },

        // A subject that is NOT a Library of Congress subject heading. LC subject sources end with
        // "Subject Headings" (e.g. "Library of Congress Subject Headings", "LC Subject Headings"),
        // but Medical Subject Headings (MeSH) also matches that suffix while not being LC, so it is
        // treated as non-LC explicitly.
        isNonLcSubject: function(subj) {
            const source = this.results?.subjectSources?.[subj]
            if (!source) return false
            if (source.includes('Medical Subject Headings')) return true
            return !source.endsWith('Subject Headings')
        },

        // Source text shown beside each subject. NAR subjects have no bf:Source, so their raw value
        // is the "Unknown" fallback — show a meaningful label for them instead.
        subjectSourceLabel: function(subj) {
            if (this.isNarSubject(subj)) return 'Name authority record'
            return this.results?.subjectSources?.[subj] || ''
        },

        insertButtonLabel: function(subj) {
            if (this.results?.subjectUncontrolledMap?.[subj]) return 'Insert Uncontrolled'
            if (this.isNarSubject(subj)) return 'Insert NAR Subject'
            if (this.isNonLcSubject(subj)) return 'Insert non-LC'
            return 'Insert'
        },

        insertButtonClass: function(subj) {
            if (this.results?.subjectUncontrolledMap?.[subj]) return 'yoshino-insert-btn yoshino-insert-btn-uncontrolled'
            if (this.isNarSubject(subj)) return 'yoshino-insert-btn yoshino-insert-btn-nar'
            if (this.isNonLcSubject(subj)) return 'yoshino-insert-btn yoshino-insert-btn-uncontrolled'
            return 'yoshino-insert-btn'
        },

        classificationLabel(type) {
            switch (type) {
                case 'http://id.loc.gov/ontologies/bibframe/ClassificationLcc': return 'LCC'
                case 'http://id.loc.gov/ontologies/bibframe/ClassificationDdc': return 'DDC'
                case 'http://id.loc.gov/ontologies/bibframe/ClassificationNlm': return 'NLM'
                case 'http://id.loc.gov/ontologies/bibframe/ClassificationNal': return 'NAL'
                case 'http://id.loc.gov/ontologies/bibframe/ClassificationOther': return 'Other'
                default: return 'Class'
            }
        },

        insertClassification: function(c) {
            this.profileStore.yoshinoInsertClassification(c)            
            this.profileStore.logEvent('SUBJECT_FINDER_INSERT_CLASSIFICATION', { metadata: [c.portion] })
            this.insertedClassifications.add(c.key)
            this.insertedClassifications = new Set(this.insertedClassifications)
        },

        onSelectElement(event) {
            const tagName = event.target.tagName
            if (tagName === 'INPUT' || tagName === 'TD' || tagName === 'BUTTON' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'A') {
                event.stopPropagation()
            }
        },
    },

    mounted: function() {
        this.results = null
        this.insertedSubjects = new Set()
        this.insertedClassifications = new Set()
        this.subjectUsageCounts = {}
        this.enrichmentRunId++
        this.topK = 10
        this.error = null
        this.noSubjectsFound = false
        this.statusMessage = ''
        this.resultsTab = 'subjects'
        this.userDescription = ''
        const ldStaleForActiveProfile = this.linkedData &&
            this.linkedData.eId !== undefined &&
            this.activeProfile &&
            this.linkedData.eId !== this.activeProfile.eId
        if (ldStaleForActiveProfile) {
            this.profileStore.linkedData = {}
        }
        this.extractProfileData()
    },
  };
  </script>
