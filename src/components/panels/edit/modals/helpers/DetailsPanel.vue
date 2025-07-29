<template>
    <div :style="`${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()};`"
        :class="['subject-editor-container-right', { 'subject-editor-container-right-lowres': lowResMode }]">
        <div v-if="contextRequestInProgress" style="font-weight: bold;">Retrieving data...</div>
        <div class="modal-context" :style="{}" v-if="Object.keys(contextData).length > 0">
            <h3 v-if="contextData.title">
                <span class="modal-context-icon simptip-position-top" v-if="contextData.rdftypes"
                    :data-tooltip="'Type: ' + contextData.rdftypes.includes('Hub') ? 'Hub' : contextData.rdftypes[0]">
                    <AuthTypeIcon :type="contextData.rdftypes.includes('Hub') ? 'Hub' : contextData.rdftypes[0]">
                    </AuthTypeIcon>
                </span>
                <span style="font-weight: bold !important;">{{ Array.isArray(contextData.title) ?
                    contextData.title[0]["@value"] :
                    contextData.title }}</span>
                <!-- <AuthTypeIcon v-if="contextData.collections && contextData.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')" :type="'may subd geog'"></AuthTypeIcon> -->
                <!-- <sup style="font-size: .5em;" v-if="contextData.collections && contextData.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')">(may subd geog)</sup> -->
                <span
                    v-if="contextData.collections && contextData.collections.includes('http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically')"
                    style="font-weight: 200 !important;">
                    &nbsp;&nbsp;&nbsp;[May Subd Geog]
                </span>
                <br>
                <span v-if="!checkIsUsable(contextData)" class="not-usable">{{ getUsabilityNote(contextData) }}</span>
                <br>
                <span>{{ contextData.uri.split("/").at(-1) }}</span>
            </h3>
            <h3 v-if="contextData.literal">
                {{ contextData.label }} [Literal]
            </h3>

            <div class="modal-context-data-title" v-if="contextData.rdftypes">
                {{ contextData.rdftypes.includes('Hub') ? 'Hub' :
                    contextData.rdftypes[0] }}</div>
            <a style="color:#2c3e50" :href="rewriteURI(contextData.uri)" target="_blank"
                v-if="contextData.literal != true">view
                on id.loc.gov</a>

            <!-- Dates -->
            <template v-if="(Object.keys(contextData).includes('birthdates') && contextData['birthdates'].length > 0)
                || (Object.keys(contextData).includes('deathdates') && contextData['deathdates'].length > 0)">
                <br>
                <span class="dates-container" style="padding-bottom: 10px;">
                    <span v-if="contextData['birthdates'] && contextData['birthdates'].length > 0"
                        style="margin-right: 15px;">
                        <span class="modal-context-data-title">Date of Birth: </span>
                        <span>{{ contextData['birthdates'][0] }}</span>
                    </span>
                    <span v-if="contextData['deathdates'] && contextData['deathdates'].length > 0">
                        <span class="modal-context-data-title">Date of Death: </span>
                        <span>{{ contextData['deathdates'][0] }}</span>
                    </span>
                </span>
            </template>
            <br>

            <!-- Labels & Relationships -->
            <template v-for="key in panelDetailOrder">
                <div v-if="contextData[key] && contextData[key].length > 0">
                    <template
                        v-if="contextData[key] && contextData[key].length > 0 && ['nonlatinLabels', 'variantLabels', 'varianttitles', 'contributors', 'relateds'].includes(key)">
                        <div class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                            this.labelMap[key] : key }}:</div>
                        <ul class="details-list">
                            <li class="modal-context-data-li" v-if="Array.isArray(contextData[key])"
                                v-for="(v, idx) in contextData[key]" v-bind:key="'var' + idx">
                                <span v-if="key != 'sees' && key != 'relateds'">{{ v }}</span>
                                <div v-else-if="key == 'relateds'">
                                    {{ v }}<button class="material-icons see-search"
                                        @click="newSearch(v)">search</button>
                                </div>
                                <div v-else>
                                    <a target="_blank" :href="'https://id.loc.gov/authorities/label/' + v">{{ v }}</a>
                                    <button class="material-icons see-search" @click="newSearch(v)">search</button>
                                </div>
                            </li>
                        </ul>
                    </template>
                    <template
                        v-else-if="key == 'notes' && (!contextData.collections.includes('http://id.loc.gov/authorities/names/collection_LCNAF') && !contextData.rdftypes.includes('Hub'))">
                        <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                            this.labelMap[key] : key }}:</span>
                        <ul>
                            <li class="modal-context-data-li" v-if="Array.isArray(contextData[key])"
                                v-for="(v, idx) in contextData[key]" v-bind:key="'var' + idx">
                                {{ v }}
                            </li>
                        </ul>
                    </template>
                    <template v-else-if="key == 'sources'">
                        <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                            this.labelMap[key] : key }}:</span>
                        <ul>
                            <li class="modal-context-data-li" v-if="Array.isArray(contextData[key])"
                                v-for="(v, idx) in contextData[key]" v-bind:key="'var' + idx">
                                {{ v }}
                            </li>
                        </ul>
                    </template>
                    <template v-else-if="key == 'sees'">
                        <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                            this.labelMap[key] : key }}:</span>


                        <ul class="details-list">
                            <li class="modal-context-data-li" v-if="Array.isArray(contextData[key])"
                                v-for="(v, idx) in contextData[key]" v-bind:key="'var' + idx">
                                <a target="_blank" :href="'https://id.loc.gov/authorities/label/' + v">{{ v }}</a>
                                <button class="material-icons see-search" @click="newSearch(v)">search</button>
                            </li>
                        </ul>
                    </template>
                    <template v-else-if="key == 'gacs'">
                        <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                            this.labelMap[key] : key }}:</span>
                        {{ contextData[key].join(" ; ") }}
                    </template>
                </div>
            </template>

            <!-- Primary -->
            <ul class="details-list">
                <template v-for="key in panelDetailOrder">
                    <template
                        v-if="['birthplaces', 'locales', 'activityfields', 'occupations', 'languages'].includes(key) && contextData[key] && contextData[key].length > 0">
                        <li class="details-details">
                            <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                                this.labelMap[key] : key }}:</span>
                            {{ contextData[key].join(" ; ") }}
                        </li>
                    </template>
                </template>
            </ul>

            <!-- Secondary -->
            <template v-for="key in panelDetailOrder">
                <div v-if="contextData[key] && contextData[key].length > 0">
                    <template v-if="key != 'sources'">

                        <template v-if="key == 'lcclasses'">
                            <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                                this.labelMap[key] : key }}:</span>
                            <ul class="">
                                <li class="" v-if="key == 'lcclasses'" v-for="v in contextData['lcclasses']">
                                    <template v-if="typeof v != 'string'">
                                        ({{ v.assigner }})
                                        <a :href="'https://classweb.org/min/minaret?app=Class&mod=Search&auto=1&table=schedules&table=tables&tid=1&menu=/Menu/&iname=span&ilabel=Class%20number&iterm=' + v.code"
                                            target="_blank">{{ v.code }}</a>
                                        <button class="material-icons see-search"
                                            @click="addClassNumber(v.code)">add</button>
                                    </template>
                                    <template v-else>
                                        {{ v }}
                                    </template>
                                    <template v-if="v.label">
                                        <span v-if="v.label.split('--').length == 1">
                                            --{{ getClassLabel(v.label) }}
                                        </span>
                                        <span v-else :data-tooltip="v.label"
                                            class="expandable-class-label simptip-position-bottom">
                                            --{{ getClassLabel(v.label) }}<span
                                                class="expand material-icons">help</span>
                                        </span>
                                    </template>
                                </li>
                            </ul>
                        </template>

                        <template v-else-if="key == 'lcclasss' && contextData['lcclasses'].length < 1">
                            <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                                this.labelMap[key] : key }}:</span>
                            <ul class="">
                                <li class="" v-if="key == 'lcclasss'" v-for="v in contextData[key]">
                                    <template v-if="typeof v == 'string'">
                                        <a :href="'https://classweb.org/min/minaret?app=Class&mod=Search&auto=1&table=schedules&table=tables&tid=1&menu=/Menu/&iname=span&ilabel=Class%20number&iterm=' + v"
                                            target="_blank">{{ v }}</a>
                                        <button class="material-icons see-search"
                                            @click="addClassNumber(v)">add</button>
                                    </template>
                                    <template v-else>
                                        {{ v }}
                                    </template>
                                </li>
                            </ul>
                        </template>

                        <template v-else-if="['broaders', 'identifiers'].includes(key)">
                            <div class="modal-context-data-title" v-if="key != 'identifiers'">{{
                                Object.keys(this.labelMap).includes(key) ? this.labelMap[key] : key }}:</div>
                            <ul class="details-list">
                                <template v-for="v in contextData[key]">
                                    <li class="modal-context-data-li" v-if="key == 'broaders'">
                                        {{ v }}
                                        <button class="material-icons see-search" @click="newSearch(v)">search</button>
                                    </li>
                                </template>
                                <li class="details-details" v-if="key == 'identifiers'">
                                    <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                                        this.labelMap[key] : key
                                        }}:</span>
                                    {{ contextData[key].join(" ; ") }}
                                </li>
                            </ul>
                        </template>
                    </template>
                </div>
            </template>

            <!-- Admin -->
            <div class="admin-fields">
                <br>
                <hr>
                <AccordionList :open-multiple-items="true">
                    <AccordionItem id="admin-fields" default-closed>
                        <template #summary>
                            <div>Extra Details</div>
                        </template>
                        <template v-for="key in panelDetailOrder">
                            <template
                                v-if='contextData[key] && contextData[key].length > 0 && ["notes", "collections", "subjects", "marcKeys", "lcclasss"].includes(key)'>
                                <div class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                                    this.labelMap[key] : key }}:</div>
                                <ul>
                                    <li class="modal-context-data-li" v-if="Array.isArray(contextData[key])"
                                        v-for="(v, idx) in contextData[key]" v-bind:key="'var' + idx">
                                        <template v-if="v.startsWith('http')">
                                            <a target="_blank" :href="v">{{ v.split("/").at(-1).split("_").at(-1) }}</a>
                                        </template>
                                        <template v-else-if="key == 'notes'">
                                            <span :class="{ unusable: v.includes('CANNOT BE USED UNDER RDA') }">{{ v
                                                }}</span>
                                        </template>
                                        <template v-else>
                                            {{ v }}
                                        </template>
                                    </li>
                                    <li class="modal-context-data-li" v-else v-bind:key="'var' + key">{{
                                        contextData[key] }}
                                    </li>
                                </ul>
                            </template>
                        </template>
                    </AccordionItem>
                </AccordionList>
            </div>
        </div>
    </div>
</template>

<script>

import { usePreferenceStore } from '@/stores/preference'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { mapStores, mapState, mapWritableState } from 'pinia'
import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";
import { AccordionList, AccordionItem } from "vue3-rich-accordion";

import short from 'short-uuid'

import utilsNetwork from '@/lib/utils_network';


export default {
    name: "DetailsPanel",
    components: {
        AuthTypeIcon,
        AccordionList,
        AccordionItem,
    },
    props: {
        contextData: Object,
        contextRequestInProgress: Boolean
    },

    watch: {},

    data: function () {
        return {
            lowResMode: true,
            labelMap: {
                "notes": "Notes",
                "nonlatinLabels": "Non-Latin Authoritative Labels",
                "variantLabels": "Variants",
                "varianttitles": "Varants Titles",
                "birthdates": "Date of Birth",
                "deathdates": "Date of Death",
                "birthplaces": "Place of Birth",
                "locales": "Associated Locales",
                "activityfields": "Fields of Activity",
                "occupations": "Occupations",
                "languages": "Associated Languages",
                "lcclasss": "LC Classification",
                "lcclasses": "LC Classification",
                "broaders": "Has Broader Authority",
                "gacs": "GAC(s)",
                "collections": "MADS Collections",
                "sources": "Sources",
                "subjects": "Subjects",
                "marcKeys": "MARC Key",
                "relateds": "Related",
                "contributors": "Contributors",
                "identifiers": "Identifiers",
                "sees": "See Also",
                "countSubj": "Subject ff",
                "countName": "Contributor to",
            },

            panelDetailOrder: [
                "notes", "gacs", "nonlatinLabels", "variantLabels", "varianttitles", "contributors", "relateds", "birthdates", "deathdates", "birthplaces",
                "locales", "activityfields", "occupations", "languages",
                "sources", "sees", "lcclasses", "lcclasss", "identifiers", "broaders",
                "collections", "subjects", "marcKeys"
            ],
        }
    },

    computed: {
        ...mapStores(usePreferenceStore),
        ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse', 'diacriticPacks']),
        ...mapState(useProfileStore, ['returnComponentByPropertyLabel']),
        ...mapWritableState(useProfileStore, ['activeProfile', 'setValueLiteral', 'subjectEditor2']),
    },

    methods: {
        getUsabilityNote: function(data){
            let notes = data.notes || []
            let needsNote = notes.filter((i) => i.includes("CANNOT BE USED") ? true : false)
            return needsNote[0]
        },
        checkIsUsable: function(data){
            let notes = data.notes || []
            let needsUpdate = notes.filter((i) => i.includes("CANNOT BE USED") ? true : false).length > 0
            return !needsUpdate
        },
        newSearch: function (term) {
            this.$emit('newSearch', term)
        },
        addClassNumber: function (code) {
            this.$emit('addClassNumber', code)
        },
        getClassLabel: function (label) {
            let pieces = label.split("--")

            if (pieces.length == 1) {
                return label
            }

            let posSpecialTopic = pieces.indexOf('Special topics, A-Z')
            if (posSpecialTopic != -1) {
                return pieces.at(posSpecialTopic - 1)
            }

            return pieces.at(-1)
        },
        rewriteURI: function (uri) {
            if (!uri) { return false }
            let returnUrls = useConfigStore().returnUrls

            // use internal links for prodcution
            if (returnUrls.dev || returnUrls.publicEndpoints) {
                uri = uri.replace('http://preprod.id.', 'https://id.')
                uri = uri.replace('https://preprod-8230.id.loc.gov', 'https://id.loc.gov')
                uri = uri.replace('https://test-8080.id.lctl.gov', 'https://id.loc.gov')
                uri = uri.replace('https://preprod-8080.id.loc.gov', 'https://id.loc.gov')
                uri = uri.replace('https://preprod-8288.id.loc.gov', 'https://id.loc.gov')
            } else { // if it's not dev or public make sure we're using 8080
                uri = uri.replace('https://id.loc.gov', 'https://preprod-8080.id.loc.gov')
                uri = uri.replace('http://id.loc.gov', 'https://preprod-8080.id.loc.gov')
            }


            return uri
        },
    },

    created: function () { },
    before: function () { },
    mounted: function () { },
    updated: function () { }
}

</script>

<style>
.details-list {
    columns: 3;
    break-inside: avoid;
    padding-left: 20px;
}

.details-list:has(.details-details) {
    margin-top: 10px;
    padding-left: 0px;
    columns: 2;
    break-inside: avoid;
}

.details-details {
    list-style: none;
    break-inside: avoid;
}

.details-list>li {
    break-inside: avoid;
}

.see-search {
    width: 20px;
    height: 20px;
    font-size: x-small;
    border-radius: 50%;
    border: none;
    cursor: pointer;
}

ul:has(.modal-context-data-li) {
    padding-left: 20px;
}

.see-also {
    font-size: 12px;
    margin-right: 10px;
}

.expandable-class-label {
    cursor: help;
}

.expand {
    font-size: 14px;
}

.simptip-position-bottom::before,
.simptip-position-bottom::after {
    left: -30% !important;
}

.modal-context-data-title {
    font-size: 1em;
    font-weight: bold;
}

.modal-context-data-li {
    font-size: .85em;
}

.not-usable {
    color: red;
}

</style>