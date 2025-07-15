<template>
    <div v-if="searchResults && searchResults[searchType].length > 0" class="subject-section"
        :class="{ 'scrollable-subjects': preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'small-container': this.numPopulatedResults() == 3 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'medium-container': this.numPopulatedResults() == 2 && preferenceStore.returnValue('--b-edit-complex-scroll-independently'), 'large-container': this.numPopulatedResults() == 1 && preferenceStore.returnValue('--b-edit-complex-scroll-independently') }">
        <span class="subject-results-heading">{{ label }}</span>
        <div v-for="(value, ix) in searchResults[searchType]" @click="$emit('selectContext', calculateIndex(ix))"
            @mouseover="setPickPosition(calculateIndex(ix))" :data-id="calculateIndex(ix)" :key="value.uri"
            :class="['fake-option', {'not-usable': !checkIsUsable(value), 'unselected': (pickPostion != calculateIndex(ix)), 'selected': (pickPostion == calculateIndex(ix)), 'picked': (pickLookup[calculateIndex(ix)] && pickLookup[calculateIndex(ix)].picked) }]">
            <span class='label' v-if="value.suggestLabel && value.suggestLabel.length > 100">{{ value.suggestLabel.substring(0, 100)
            }}...</span>
            <span class='label' v-else-if="value.literal">
                {{ value.label }} [Literal]
            </span>
            <span v-else class="label">{{ value.suggestLabel }}</span>
            <span v-if="searchType == 'names'"> [LCNAF]</span>
            <span v-if="value.collections">
                {{ buildAddtionalInfo(value.collections) }}
                <!-- :style="{'background-color': setBackgroundColor(name.count, searchResults.names)}" -->
                <span class="from-auth" v-if="checkFromAuth(value)"> (Auth)</span>
                <span class="from-rda" v-if="checkFromRda(value)"> [RDA]</span>
                <span v-if="value.count && value.count > 0" class="usage-count">
                    {{ buildCount(value) }}
                </span>
            </span>
            <div class="may-sub-container" style="display: inline;">
                <AuthTypeIcon
                    v-if="value.collections && value.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')"
                    :type="'may subd geog'"></AuthTypeIcon>
            </div>
        </div>
    </div>
</template>

<script>

import { usePreferenceStore } from '@/stores/preference'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { mapStores, mapState, mapWritableState } from 'pinia'
import short from 'short-uuid'

import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";
import utilsNetwork from '@/lib/utils_network';


export default {
    name: "SubjectEditor2",
    components: {
        AuthTypeIcon,
    },
    props: {
        searchType: String,
        label: String,
        index: String,
        searchResults: Object,
        pickLookup: Object

    },

    watch: {},

    data: function () {
        return {
            pickPostion: 0,
        }
    },

    computed: {
        ...mapStores(usePreferenceStore),
        ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse', 'diacriticPacks']),
        ...mapState(useProfileStore, ['returnComponentByPropertyLabel']),
        ...mapWritableState(useProfileStore, ['activeProfile', 'setValueLiteral', 'subjectEditor2']),
    },

    methods: {
        checkFromRda: function (data) {
            let notes = data.extra.notes || []
            let isRda = false

            for (let note of notes) {
                if (note.includes("$erda")) {
                    isRda = true
                }
            }

            return isRda && this.checkIsUsable(data)
        },
        checkFromAuth: function (data) {
            let identifiers = data.extra.identifiers || []
            let looksLikeLccn = identifiers.filter((i) => i.startsWith("n")).length > 0 ? true : false
            return looksLikeLccn && this.checkIsUsable(data)
        },
        checkIsUsable: function(data) {
            let notes = data.extra.notes || []
            let needsUpdate = notes.filter((i) => i.includes("CANNOT BE USED") ? true : false).length > 0
            return !needsUpdate
        },
        calculateIndex: function (i) {
            const searchResults = this.searchResults
            try {
                let f = new Function('searchResults', "return " + this.index.replace('ix', i))
                return f(searchResults)
            } catch (err) {
                return i
            }
        },
        numPopulatedResults: function () {
            let count = 0
            for (let key of Object.keys(this.searchResults)) {
                if (this.searchResults[key].length >= 1) {
                    count++
                }
            }
            return count
        },
        setPickPosition: function (pickPosition) {
            this.pickPostion = pickPosition
            this.$emit('emitLoadContext', pickPosition)
        },
        buildCount: function (subject) {
            if (subject.count) {
                return "[" + subject.count + "]"
            }
            return ""

        },
        buildAddtionalInfo: function (collections) {
            if (collections) {
                let out = []
                if (collections.includes("http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings") || collections.includes("http://id.loc.gov/authorities/subjects/collection_NamesAuthorizedHeadings")) {
                    out.push(" (Auth Hd)")
                } else if (collections.includes("http://id.loc.gov/authorities/subjects/collection_GenreFormSubdivisions")) {
                    out.push(" (GnFrm)")
                } else if (collections.includes("http://id.loc.gov/authorities/subjects/collection_GeographicSubdivisions")) {
                    out.push(" (GeoSubDiv)")
                } else if (collections.includes("http://id.loc.gov/authorities/subjects/collection_LCSH_Childrens")) {
                    out.push(" (ChldSubj)")
                } else if (collections.includes("http://id.loc.gov/authorities/subjects/collection_Subdivisions")) {
                    out.push(" (SubDiv)")
                }

                // favor SubDiv over GnFrm
                if (out.includes("(GnFrm)") && collections.includes("http://id.loc.gov/authorities/subjects/collection_Subdivisions")) {
                    out = [" (SubDiv)"]
                }

                // if (collections.includes("LCNAF")){
                //     out.push("[LCNAF]")
                // }

                return out.join(" ")
            } else {
                return " "
            }
        },
    },

    created: function () { },
    before: function () { },
    mounted: function () { },
    updated: function () { }
}
</script>


<style>
.picked .label{
    font-weight: bold;
}

.not-usable{
    color: red;
}
</style>