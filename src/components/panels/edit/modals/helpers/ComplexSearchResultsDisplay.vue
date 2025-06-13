<template>
    <div class="search-results" v-if="searchResults">
        <div v-if="searchResults !== null" style="height: 95%">

            <div v-if="searchResults && searchResults.exact.length > 0" class="subject-section"
                :class="{ 'scrollable-subjects': preferenceStore.returnValue('--b-edit-complex-scroll-independently') }">
                <span class="subject-results-heading">Known Label</span>
                <div v-for="(subject, idx) in searchResults.exact"
                    @click="$emit('selectContext', (searchResults.names.length - idx) * -1 - 2)"
                    @mouseover="setPickPosition((searchResults.names.length - idx) * -1 - 2)"
                    :data-id="((searchResults.names.length - idx) * -1 - 2)" :key="subject.uri"
                    :class="['fake-option', { 'unselected': (pickPostion != (searchResults.names.length - idx) * -1 - 2), 'selected': (pickPostion == (searchResults.names.length - idx) * -1 - 2), 'picked': (pickLookup[(searchResults.names.length - idx) * -1 - 2] && pickLookup[(searchResults.names.length - idx) * -1 - 2].picked) }]">
                    <template v-if="subject.label == activeComponent.label.replaceAll('‑', '-')">
                        {{ subject.label }}
                    </template>
                    <template v-else>
                        {{ subject.label }}
                        <span class="subject-variant">
                            ((VARIANT))
                        </span>
                    </template>
                    <span v-if="subject.collections && subject.collections.includes('LCNAF')"> [LCNAF]</span>
                    <span v-if="subject.collections">
                        {{ this.buildAddtionalInfo(subject.collections) }}
                    </span>
                    <div class="may-sub-container" style="display: inline;">
                        <AuthTypeIcon
                            v-if="subject.collections && subject.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')"
                            :type="'may subd geog'"></AuthTypeIcon>
                    </div>
                </div>
            </div>


            <SearchResultOption
                searchType="names"
                label="LCNAF"
                index="(searchResults.names.length - ix) * - 1"
                :searchResults="searchResults"
                :pickLookup="pickLookup"
                @selectContext="selectContext"
                @emitLoadContext="loadContext"
            />
            <SearchResultOption
                searchType="subjectsComplex"
                :label="searchMode == 'HUBS' ? 'Keyword' : 'Complex'"
                index="ix"
                :searchResults="searchResults"
                :pickLookup="pickLookup"
                @selectContext="selectContext"
                @emitLoadContext="loadContext"
            />
            <SearchResultOption
                searchType="subjectsSimple"
                :label="searchMode == 'HUBS' ? 'Left Anchored' : 'Simple'"
                index="searchResults.subjectsComplex.length + ix"
                :searchResults="searchResults"
                :pickLookup="pickLookup"
                @selectContext="selectContext"
                @emitLoadContext="loadContext"
            />
            <SearchResultOption
                searchType="subjectsChildrenComplex"
                label="CYAC Complex"
                index="ix"
                :searchResults="searchResults"
                :pickLookup="pickLookup"
                @selectContext="selectContext"
                @emitLoadContext="loadContext"
            />
            <SearchResultOption
                searchType="subjectsChildren"
                label="CYAC Simple"
                index="searchResults.subjectsChildrenComplex.length + ix"
                :searchResults="searchResults"
                :pickLookup="pickLookup"
                @selectContext="selectContext"
                @emitLoadContext="loadContext"
            />
        </div>
    </div>
</template>


<script>

import { usePreferenceStore } from '@/stores/preference'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { mapStores, mapState, mapWritableState } from 'pinia'
import { VueFinalModal } from 'vue-final-modal'
import short from 'short-uuid'

import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";

import utilsNetwork from '@/lib/utils_network';

import { AccordionList, AccordionItem } from "vue3-rich-accordion";
import SearchResultOption from './SearchResultOption.vue'

const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
}





export default {
    name: "SubjectEditor2",
    components: {
        VueFinalModal,
        AuthTypeIcon,
        AccordionList,
        AccordionItem,
        SearchResultOption
    },
    props: {
        searchResults: Object,
        pickLookup: Object,
        searchMode: String,
    },

    watch: {},

    data: function () {
        return {
            pickPostion: 0,
            pickCurrent: null,
        }
    },

    computed: {
        ...mapStores(usePreferenceStore),
        ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse', 'diacriticPacks']),
        ...mapState(useProfileStore, ['returnComponentByPropertyLabel']),
        ...mapWritableState(useProfileStore, ['activeProfile', 'setValueLiteral', 'subjectEditor2']),
    },

    methods: {
        selectContext: function(idx){
            this.$emit('selectContext', idx)
        },
        loadContext:function(pickPosition){
            if (this.pickCurrent == null) {
                this.pickPostion = pickPosition
            }
            this.$emit('loadContext', pickPosition)
        },
        // Functions for searchResults

        // Return the number of search results that are populated.
        // Used to determine how tall to make each set of search results
        numPopulatedResults: function () {
            let count = 0
            for (let key of Object.keys(this.searchResults)) {
                if (this.searchResults[key].length >= 1) {
                    count++
                }
            }
            return count
        },

        checkUsable: function (data) {
            let notes = data.extra.notes || []
            if (notes.includes("THIS 1XX FIELD CANNOT BE USED UNDER RDA UNTIL THIS RECORD HAS BEEN REVIEWED AND/OR UPDATED")) {
                return false
            }
            return true
        },
        checkFromRda: function (data) {
            let notes = data.extra.notes || []
            let isRda = false

            for (let note of notes) {
                if (note.includes("$erda")) {
                    isRda = true
                }
            }

            return isRda
        },
        checkFromAuth: function (data) {
            let notes = data.extra.notes || []
            let identifiers = data.extra.identifiers || []

            let looksLikeLccn = identifiers.filter((i) => i.startsWith("n")).length > 0 ? true : false

            return looksLikeLccn
        },

        activeSearchInd: function () {
            let ti = window.setInterval(() => { that.activeSearch = ((!that.activeSearch) ? '' : that.activeSearch) + '.' }, 100)

            // a backup here just in case the search times out or takes forever
            let tiBackup = window.setTimeout(() => {
                window.clearInterval(ti)
                that.activeSearch = false

            }, 10000)
        },

        setPickPosition: function(pickPosition){
            if (this.pickCurrent == null) {
                this.pickPostion = pickPosition
            }

            this.$emit('emitLoadContext', pickPosition)
        },
    },

    created: function () { },
    before: function () { },
    mounted: function () { },
    updated: function () { }
}
</script>


<style>
.subject-section {
    border-top: solid black;
    border-bottom: solid-black;
}

.scrollable-subjects {
    overflow-y: scroll;
}

.small-container {
    height: 33%;
}

.medium-container {
    height: 50%;
}

.large-container {
    height: 90%;
}

/* document.documentElement.clientHeight */
.scroll-all {
    overflow-y: scroll;
}

.subject-container-outer {
    /* height: v-bind('returnBrowserHeight()'); */
    height: 100%;
}

.subject-variant {
    color: #ffc107;
    font-weight: bold;
}


.usage-count {
    /* color: white;
  text-shadow: black 0px 0px 10px; */
}

.from-rda,
.from-auth {
    font-weight: bold;
}

.unusable {
    color: red;
}

.fake-option {
    font-size: 1em;
    cursor: pointer;
    text-indent: 2em hanging;
}

.fake-option:hover {
    background-color: whitesmoke;
}

.literal-option {
    font-style: italic;
}

.unselected::before {
    content: "• ";
    color: #999999;
}

.selected {
    background-color: whitesmoke;
}

.selected::before {
    content: "> ";
    color: #999999;
}

.picked {
    font-weight: bold;
}

.picked::before {
    content: "✓ " !important;
    transition-property: all;
    transition-duration: 500ms;
    font-weight: bold;
    color: green;
    font-size: larger;
}
</style>