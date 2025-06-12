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
            <div v-if="searchResults && searchResults.names.length > 0 && !this.searching" class="subject-section"
                :class="{ 'scrollable-subjects': preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'small-container': this.numPopulatedResults() == 3 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'medium-container': this.numPopulatedResults() == 2 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'large-container': this.numPopulatedResults() == 1 && preferenceStore.returnValue('--b-edit-complex-scroll-independently') }">
                <span class="subject-results-heading">LCNAF</span>
                <div v-for="(name, idx) in searchResults.names"
                    @click="$emit('selectContext', (searchResults.names.length - idx) * -1)"
                    @mouseover="setPickPosition((searchResults.names.length - idx) * -1)"
                    :data-id="(searchResults.names.length - idx) * -1" :key="name.uri"
                    :class="['fake-option', { 'unselected': (pickPostion != (searchResults.names.length - idx) * -1), 'selected': (pickPostion == (searchResults.names.length - idx) * -1), 'picked': (pickLookup[(searchResults.names.length - idx) * -1] && pickLookup[(searchResults.names.length - idx) * -1].picked) }]">
                    <span v-if="name.suggestLabel && name.suggestLabel.length > 100">{{ name.suggestLabel.substring(0,
                        100) }}...</span>
                    <span v-else>{{ name.suggestLabel }}</span>
                    <span> [LCNAF]</span>
                    <span v-if="name.collections">
                        {{ this.buildAddtionalInfo(name.collections) }}
                        <!-- :style="{'background-color': setBackgroundColor(name.count, searchResults.names)}" -->
                        <span v-if="name.count && name.count > 0" class="usage-count">
                            {{ buildCount(name) }}
                        </span>
                    </span>
                    <div class="may-sub-container" style="display: inline;">
                        <AuthTypeIcon
                            v-if="name.collections && name.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')"
                            :type="'may subd geog'"></AuthTypeIcon>
                    </div>
                </div>
            </div>

            <!-- LCSH -->
            <div v-if="searchResults && searchResults.subjectsComplex.length > 0" class="subject-section"
                :class="{ 'scrollable-subjects': preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'small-container': this.numPopulatedResults() >= 3 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'medium-container': this.numPopulatedResults() == 2 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'large-container': this.numPopulatedResults() == 1 && preferenceStore.returnValue('--b-edit-complex-scroll-independently') }">
                <span class="subject-results-heading">{{ searchMode == "HUBS" ? 'Keyword' : 'Complex' }}</span>
                <div v-for="(subjectC, idx) in searchResults.subjectsComplex" @click="selectContext(idx)"
                    @mouseover="setPickPosition(idx)" :data-id="idx" :key="subjectC.uri"
                    :class="['fake-option', { 'unselected': (pickPostion != idx), 'selected': (pickPostion == idx), 'picked': (pickLookup[idx] && pickLookup[idx].picked) }]">
                    {{ subjectC.suggestLabel }}<span></span>
                    <span v-if="subjectC.collections">
                        {{ this.buildAddtionalInfo(subjectC.collections) }}
                        <!-- :style="{'background-color': setBackgroundColor(subjectC.count, searchResults.subjectsComplex)}" -->
                        <span v-if="subjectC.count && subjectC.count > 0" class="usage-count">{{ buildCount(subjectC)
                            }}</span>
                    </span>
                    <div class="may-sub-container" style="display: inline;">
                        <AuthTypeIcon
                            v-if="subjectC.collections && subjectC.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')"
                            :type="'may subd geog'"></AuthTypeIcon>
                    </div>
                </div>
            </div>

            <!-- TODO: get mouseover and contextSelecting emiting the components to the parent -->

            <div v-if="searchResults && searchResults.subjectsSimple.length > 0" class="subject-section"
                :class="{ 'scrollable-subjects': preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'small-container': this.numPopulatedResults() == 3 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'medium-container': this.numPopulatedResults() == 2 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'large-container': this.numPopulatedResults() == 1 && preferenceStore.returnValue('--b-edit-complex-scroll-independently') }">
                <span class="subject-results-heading">{{ searchMode == "HUBS" ? 'Left Anchored' : 'Simple' }}</span>
                <div v-for="(subject, idx) in searchResults.subjectsSimple"
                    @click="$emit('selectContext', searchResults.subjectsComplex.length + idx)"
                    @mouseover="setPickPosition(searchResults.subjectsComplex.length + idx)"
                    :data-id="searchResults.subjectsComplex.length + idx" :key="subject.uri"
                    :class="['fake-option', { 'unselected': (pickPostion != searchResults.subjectsComplex.length + idx), 'selected': (pickPostion == searchResults.subjectsComplex.length + idx), 'picked': (pickLookup[searchResults.subjectsComplex.length + idx] && pickLookup[searchResults.subjectsComplex.length + idx].picked), 'literal-option': (subject.literal), unusable: !checkUsable(subject) }]">
                    {{ subject.suggestLabel }}
                    <span v-if="subject.literal">
                        {{ subject.label }}
                    </span>
                    <span v-if="subject.literal">[Literal]</span>
                    <span v-if="!subject.literal">
                        {{ this.buildAddtionalInfo(subject.collections) }}
                        <span class="from-auth" v-if="checkFromAuth(subject)"> (Auth)</span>
                        <span class="from-rda" v-if="checkFromRda(subject)"> [RDA]</span>
                        <!-- :style="{'background-color': setBackgroundColor(subject.count, searchResults.subjectsSimple)}" -->
                        <span v-if="subject.count && subject.count > 0" class="usage-count">{{ buildCount(subject)
                            }}</span>
                    </span>
                    <div class="may-sub-container" style="display: inline;">
                        <AuthTypeIcon
                            v-if="subject.collections && subject.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')"
                            :type="'may subd geog'"></AuthTypeIcon>
                    </div>
                </div>
            </div>


            <!-- ChildrenSubjects -->
            <div v-if="searchResults && searchResults.subjectsChildrenComplex.length > 0" class="subject-section"
                :class="{ 'scrollable-subjects': preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'small-container': this.numPopulatedResults() == 3 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'medium-container': this.numPopulatedResults() == 2 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'large-container': this.numPopulatedResults() == 1 && preferenceStore.returnValue('--b-edit-complex-scroll-independently') }">
                <span class="subject-results-heading">CYAC Complex</span>
                <div v-for="(subjectC, idx) in searchResults.subjectsChildrenComplex" @click="selectContext(idx)"
                    @mouseover="setPickPosition(idx)" :data-id="idx" :key="subjectC.uri"
                    :class="['fake-option', { 'unselected': (pickPostion != idx), 'selected': (pickPostion == idx), 'picked': (pickLookup[idx] && pickLookup[idx].picked) }]">
                    {{ subjectC.suggestLabel }}<span></span>
                    <span v-if="subjectC.collections">
                        {{ this.buildAddtionalInfo(subjectC.collections) }}
                        <!-- :style="{'background-color': setBackgroundColor(subjectC.count, searchResults.subjectsChildrenComplex)}" -->
                        <span v-if="subjectC.count && subjectC.count > 0" class="usage-count">{{ buildCount(subjectC)
                            }}</span>
                    </span>
                    <div class="may-sub-container" style="display: inline;">
                        <AuthTypeIcon
                            v-if="subjectC.collections && subjectC.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')"
                            :type="'may subd geog'"></AuthTypeIcon>
                    </div>
                </div>
            </div>

            <div v-if="searchResults && searchResults.subjectsChildren.length > 0" class="subject-section"
                :class="{ 'scrollable-subjects': preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'small-container': this.numPopulatedResults() == 3 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'medium-container': this.numPopulatedResults() == 2 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'large-container': this.numPopulatedResults() == 1 && preferenceStore.returnValue('--b-edit-complex-scroll-independently') }">
                <span class="subject-results-heading">CYAC Simple</span>
                <div v-for="(subject, idx) in searchResults.subjectsChildren"
                    @click="$emit('selectContext', searchResults.subjectsChildrenComplex.length + idx)"
                    @mouseover="setPickPosition(searchResults.subjectsChildrenComplex.length + idx)"
                    :data-id="searchResults.subjectsChildrenComplex.length + idx" :key="subject.uri"
                    :class="['fake-option', { 'unselected': (pickPostion != searchResults.subjectsChildrenComplex.length + idx), 'selected': (pickPostion == searchResults.subjectsChildrenComplex.length + idx), 'picked': (pickLookup[searchResults.subjectsChildrenComplex.length + idx] && pickLookup[searchResults.subjectsChildrenComplex.length + idx].picked), 'literal-option': (subject.literal) }]">
                    {{ subject.suggestLabel }}<span v-if="subject.literal">
                        {{ subject.label }}</span> <span v-if="subject.literal">[Literal]</span>
                    <span v-if="!subject.literal">
                        {{ this.buildAddtionalInfo(subject.collections) }}
                        <!-- :style="{'background-color': setBackgroundColor(subjectC.count, searchResults.subjectsChildrenComplex)}" -->
                        <span v-if="subject.count && subject.count > 0" class="usage-count">{{ buildCount(subject)
                            }}</span>
                    </span>
                    <div class="may-sub-container" style="display: inline;">
                        <AuthTypeIcon
                            v-if="subject.collections && subject.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')"
                            :type="'may subd geog'"></AuthTypeIcon>
                    </div>
                </div>
            </div>
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
        AccordionItem
    },
    props: {
        searchResults: Object,
        pickLookup: Object,
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
        buildAddtionalInfo: function (collections) {
            if (collections) {
                let out = []
                if (collections.includes("http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings") || collections.includes("http://id.loc.gov/authorities/subjects/collection_NamesAuthorizedHeadings")) {
                    out.push("(Auth Hd)")
                } else if (collections.includes("http://id.loc.gov/authorities/subjects/collection_GenreFormSubdivisions")) {
                    out.push("(GnFrm)")
                } else if (collections.includes("http://id.loc.gov/authorities/subjects/collection_GeographicSubdivisions")) {
                    out.push("(GeoSubDiv)")
                } else if (collections.includes("http://id.loc.gov/authorities/subjects/collection_LCSH_Childrens")) {
                    out.push("(ChldSubj)")
                } else if (collections.includes("http://id.loc.gov/authorities/subjects/collection_Subdivisions")) {
                    out.push("(SubDiv)")
                }

                // favor SubDiv over GnFrm
                if (out.includes("(GnFrm)") && collections.includes("http://id.loc.gov/authorities/subjects/collection_Subdivisions")) {
                    out = ["(SubDiv)"]
                }

                // if (collections.includes("LCNAF")){
                //     out.push("[LCNAF]")
                // }

                return out.join(" ")
            } else {
                return ""
            }
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