<template>
    <!-- <div class="cutter-container"
        v-if="Object.keys(structure.userValue['http://id.loc.gov/ontologies/bibframe/classification'][0]).includes('http://id.loc.gov/ontologies/bibframe/itemPortion')"> -->
    <div class="component-container" :style="'background-color: ' + returnBackgroundColor + ';'">
        <div class="classweb-links" v-if="showClassWebLinksTop">
            <div v-html="buildLinkHtml()"></div>
        </div>

        <div class="cutter-container" :style="'background-color: ' + returnBackgroundColor + ';'"
            v-if="lccFeatureData && structure.propertyURI == 'http://id.loc.gov/ontologies/bibframe/classification' && (!structure.activeType || structure.activeType == 'http://id.loc.gov/ontologies/bibframe/ClassificationLcc')">
            <div class="cutter-calc">
                <fieldset
                    v-if="(lccFeatureData.contributors && lccFeatureData.contributors.length > 0) || lccFeatureData.title || lccFeatureData.firstSubject">
                    <legend>Cutter Calculator</legend>
                    <template v-if="lccFeatureData.contributors">

                        <template v-if="lccFeatureData.contributors[0]">
                            <div>
                                <span style="font-weight: bold;">{{ lccFeatureData.contributors[0].label.substring(0,
                                    parseInt(cutterCalcLength)) }}</span>
                                <span>{{ lccFeatureData.contributors[0].label.substring(parseInt(cutterCalcLength))
                                    }}</span>
                                <input type="text"
                                    :value="usePeriodInCutter() + calculateCutter(lccFeatureData.contributors[0].label, cutterCalcLength).substring(0, cutterCalcLength)">
                                <a style="font-size: 0.85em; padding-left: 0.5em;"
                                    @click.prevent="setLccInfo(lccFeatureData.cutterGuid, calculateCutter(lccFeatureData.contributors[0].label, cutterCalcLength).substring(0, cutterCalcLength))"
                                    href="#">Use</a>
                            </div>

                            <div>
                                <span style="font-weight: bold;">{{
                                    lccFeatureData.contributors[0].secondLetterLabel.substring(0,
                                        parseInt(cutterCalcLength))
                                    }}</span>
                                <span>{{
                                    lccFeatureData.contributors[0].secondLetterLabel.substring(parseInt(cutterCalcLength))
                                    }}</span>
                                <input type="text"
                                    :value="usePeriodInCutter() + calculateCutter(lccFeatureData.contributors[0].secondLetterLabel, cutterCalcLength).substring(0, cutterCalcLength)">
                                <a style="font-size: 0.85em; padding-left: 0.5em;"
                                    @click.prevent="setLccInfo(lccFeatureData.cutterGuid, calculateCutter(lccFeatureData.contributors[0].secondLetterLabel, cutterCalcLength).substring(0, cutterCalcLength))"
                                    href="#">Use</a>
                            </div>

                        </template>
                        <template v-if="lccFeatureData.contributors[1]">
                            <div>
                                <span style="font-weight: bold;">{{ lccFeatureData.contributors[1].label.substring(0,
                                    cutterCalcLength) }}</span>
                                <span>{{ lccFeatureData.contributors[1].label.substring(parseInt(cutterCalcLength))
                                    }}</span>
                                <input type="text"
                                    :value="usePeriodInCutter() + calculateCutter(lccFeatureData.contributors[1].label, parseInt(cutterCalcLength)).substring(0, parseInt(cutterCalcLength))">
                                <a style="font-size: 0.85em; padding-left: 0.5em;"
                                    @click.prevent="setLccInfo(lccFeatureData.cutterGuid, calculateCutter(lccFeatureData.contributors[1].label, parseInt(cutterCalcLength)).substring(0, parseInt(cutterCalcLength)))"
                                    href="#">Use</a>
                            </div>
                        </template>
                        <template v-if="lccFeatureData.title">
                            <div>
                                <span style="font-weight: bold;">{{ lccFeatureData.title.substring(0,
                                    parseInt(cutterCalcLength)) }}</span>
                                <span>{{ lccFeatureData.title.substring(parseInt(cutterCalcLength),
                                    parseInt(cutterCalcLength) + 12) }}</span>
                                <input type="text"
                                    :value="usePeriodInCutter() + calculateCutter(lccFeatureData.title, parseInt(cutterCalcLength)).substring(0, parseInt(cutterCalcLength))">
                                <a style="font-size: 0.85em; padding-left: 0.5em;"
                                    @click.prevent="setLccInfo(lccFeatureData.cutterGuid, calculateCutter(lccFeatureData.title, parseInt(cutterCalcLength)).substring(0, parseInt(cutterCalcLength)))"
                                    href="#">Use</a>
                            </div>
                        </template>

                        <div>
                            <span style="font-weight: bold;">{{ freeFormCutter.substring(0, parseInt(cutterCalcLength))
                                }}</span>
                            <span>{{ freeFormCutter.substring(parseInt(cutterCalcLength), parseInt(cutterCalcLength) +
                                12)
                                }}</span>
                            <input placeholder="Free Form Cutter Input" v-model="freeFormCutter">
                            <input type="text"
                                :value="usePeriodInCutter() + calculateCutter(freeFormCutter, parseInt(cutterCalcLength)).substring(0, parseInt(cutterCalcLength))">
                            <a style="font-size: 0.85em; padding-left: 0.5em;"
                                @click.prevent="setLccInfo(lccFeatureData.cutterGuid, calculateCutter(freeFormCutter, parseInt(cutterCalcLength)).substring(0, parseInt(cutterCalcLength)))"
                                href="#">Use</a>
                        </div>
                    </template>

                    <div>
                        <input type="range" v-model="cutterCalcLength" id="cutterCalcLength" name="cutterCalcLength"
                            min="0" max="6" step="1" />
                        <label for="cutterCalcLength" style="font-size: 0.8em; vertical-align: text-top;">Calc Length
                            ({{
                                cutterCalcLength
                            }})</label>
                    </div>


                </fieldset>
            </div>

            <div class="links">
                <div class="classweb-links" v-if="!showClassWebLinksTop" v-html="buildLinkHtml()"></div>
                <!-- div class="classweb-links">
                    <a style="color:black" v-if="lccFeatureData.classNumber"
                        :href="'https://' + classWebURL() + '/min/minaret?app=Class&mod=Search&look=1&query=&index=id&cmd2=&auto=1&Fspan=' + lccFeatureData.classNumber + '&Fcaption=&Fkeyword=&Fterm=&Fcap_term=&count=75&display=1&table=schedules&logic=0&style=0&cmd=Search'"
                        target="_blank">ClassWeb Search: {{ lccFeatureData.classNumber }}</a><br />
                    <a style="color:black" v-if="lccFeatureData.classNumber"
                        :href="'https://' + classWebURL() + '/min/minaret?app=Class&auto=1&mod=Search&table=schedules&table=tables&tid=1&menu=/Menu/&iname=span&ilabel=Class%20number&iterm=' + lccFeatureData.classNumber"
                        target="_blank">ClassWeb Browse: {{ lccFeatureData.classNumber }}</a><br />
                    <a style="color:black" v-if="lccFeatureData.firstSubject"
                        :href="'https://' + classWebURL() + '/min/minaret?app=Corr&mod=Search&count=75&auto=1&close=1&display=1&menu=/Auto/&iname=nh2l&iterm=' + lccFeatureData.firstSubject"
                        target="_blank">ClassWeb Search: {{ lccFeatureData.firstSubject }}</a><br />
                    <a style="color:black" v-if="lccFeatureData.secondSubject"
                        :href="'https://' + classWebURL() + '/min/minaret?app=Corr&mod=Search&count=75&auto=1&close=1&display=1&menu=/Auto/&iname=nh2l&iterm=' + lccFeatureData.secondSubject"
                        target="_blank">ClassWeb Search: {{ lccFeatureData.secondSubject }}</a>
                </div -->
                <hr v-if="!showClassWebLinksTop">
                <div class="external-links">
                    <ul>
                        <template v-for="(item, idx) in preferences">
                            <li v-if="item[1] && preferenceStore.returnValue(item[1]) != ''">
                                <a :href="preferenceStore.returnValue(item[1])" target="_blank">
                                    {{ preferenceStore.returnValue(item[0]) != "" ? preferenceStore.returnValue(item[0])
                                        :
                                    preferenceStore.returnValue(item[1]) }}
                                    <span class="material-icons" style="font-size: 14px;">open_in_new</span>
                                </a>
                            </li>
                        </template>
                    </ul>
                </div>
            </div>

            <div class="shelflist-search">
                <button @click="openShelfListSearch">Shelf List Search</button>
            </div>
        </div>
    </div>

</template>


<script>

import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'
import { useConfigStore } from '@/stores/config'

import { mapStores, mapState, mapWritableState } from 'pinia'

import short from 'short-uuid'

import utilsMisc from '@/lib/utils_misc'
import utilsNetwork from '@/lib/utils_network'


export default {
    name: "ClassTools",
    components: {},

    props: {
        guid: String,
        propertyPath: Array,
        structure: Object,
    },


    methods: {

        buildLinkHtml(){
            let urlClassSearch = `https://${this.classWebURL()}/min/minaret?app=Class&mod=Search&look=1&query=&index=id&cmd2=&auto=1&Fspan=${this.lccFeatureData.classNumber}&Fcaption=&Fkeyword=&Fterm=&Fcap_term=&count=75&display=1&table=schedules&logic=0&style=0&cmd=Search'`
            let urlClassBrowse = `https://${this.classWebURL()}/min/minaret?app=Class&auto=1&mod=Search&table=schedules&table=tables&tid=1&menu=/Menu/&iname=span&ilabel=Class%20number&iterm=${this.lccFeatureData.classNumber}`
            let urlSubj1 = `https://${this.classWebURL()}/min/minaret?app=Corr&mod=Search&count=75&auto=1&close=1&display=1&menu=/Auto/&iname=nh2l&iterm=${this.lccFeatureData.firstSubject}`
            let urlSubj2 = `https://${this.classWebURL()}/min/minaret?app=Corr&mod=Search&count=75&auto=1&close=1&display=1&menu=/Auto/&iname=nh2l&iterm=${this.lccFeatureData.secondSubject}`


            let linkClassSearch = '<span></span>'
            let linkSubj1 = '<span></span>'
            let linkSubj2 = '<span></span>'

            if (this.lccFeatureData.classNumber){
                linkClassSearch = `
                    <a style="color:black" href=${urlClassSearch} target="_blank">ClassWeb Search: ${this.lccFeatureData.classNumber}</a><br />
                    <a style="color:black" href=${urlClassBrowse} target="_blank">ClassWeb Browse: ${this.lccFeatureData.classNumber}</a><br />
                `
            }
            if (this.lccFeatureData.firstSubject){
                linkSubj1 = `<a style="color:black" href=${urlSubj1} target="_blank">ClassWeb Search: ${this.lccFeatureData.firstSubject }</a><br />`
            }
            if (this.lccFeatureData.secondSubject){
                linkSubj2 = `<a style="color:black" href=${urlSubj2} target="_blank">ClassWeb Search: ${this.lccFeatureData.secondSubject }</a>`
            }

            let links = `
                ${linkClassSearch}
                ${linkSubj1}
                ${linkSubj2}
            `

            return links
        },

        classWebURL() {
            let url = "classweb.org"
            if (useConfigStore().returnUrls.env == 'staging') {
                url = "test." + url
            }
            return url
        },

        usePeriodInCutter() {
            if (this.lccFeatureData && this.lccFeatureData.classNumber && this.lccFeatureData.classNumber.indexOf(".") > -1) {
                return ''
            } else {
                return '.'
            }
        },

        calculateCutter(toCut, howLong) {
            return utilsMisc.calculateCutter(toCut, howLong)
        },

        async setLccInfo(fieldGuid, lccVal) {

            this.lccFeatureDataCounter++
            if (fieldGuid == null) {
                fieldGuid = short.generate()
            }
            lccVal = `${this.usePeriodInCutter()}${lccVal}`
            await this.profileStore.setValueLiteral(this.guid, fieldGuid, this.propertyPath, lccVal, null)
        },

        openShelfListSearch() {
            this.activeShelfListData = {
                class: this.lccFeatureData.classNumber,
                cutter: this.lccFeatureData.cutterNumber,
                classGuid: this.lccFeatureData.classGuid,
                cutterGuid: this.lccFeatureData.cutterGuid,
                componentPropertyPath: this.propertyPath,
                componentGuid: this.guid,
                contributor: this.lccFeatureData.contributors.length > 0 ? this.lccFeatureData.contributors[0].label : "",
                title: this.lccFeatureData.title,
                subj: this.lccFeatureData.firstSubject,
                date: ""  //not in `lccFeatureData`
            }
            this.showShelfListingModal = true


        },
    },
    computed: {
        // other computed properties
        // ...
        // gives access to this.counterStore and this.userStore
        ...mapStores(useProfileStore),
        ...mapStores(usePreferenceStore),

        ...mapState(useConfigStore, ['scriptShifterLangCodes', 'lccFeatureProperties']),
        ...mapWritableState(useProfileStore, ['showShelfListingModal', 'activeField', 'activeProfile', 'literalLangShow', 'literalLangInfo', 'dataChangedTimestamp', 'activeShelfListData', 'pairedLitearlIndicatorLookup']),
        ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse', 'diacriticPacks', 'showPrefModal', 'showPrefModalgroup', 'styleDefault', 'showPrefModalGroup', 'fontFamilies', 'returnValue']),


        lccFeatureData() {
            this.lccFeatureDataCounter
            if (this.lccFeatureProperties.indexOf(this.propertyPath[this.propertyPath.length - 1].propertyURI) > -1) {
                let data = this.profileStore.returnLccInfo(this.guid, this.structure)
                // console.log("HERE for LCC data", data,  this.guid, this.structure)
                // if it is a MLC number we dont need to show the extra interface
                if (data && data.classNumber && data.classNumber.startsWith("MLC")) { return false }

                if (data.contributors && data.contributors.length > 0) {
                    data.contributors[0].secondLetterLabel = data.contributors[0].label.substring(1)
                }

                return data
            }
            return false
        },

        returnBackgroundColor() {
            let colors = this.preferenceStore.returnValue('--o-edit-general-field-colors')
            let id = this.structure.preferenceId

            if (colors[id]) {
                if (colors[id]['default']) {
                    return colors[id]['default']
                }
            }

            return 'white'
        },

        showClassWebLinksTop(){
            let showTop = !this.preferenceStore.returnValue('--b-shelflist-show-classweb-links-inline')
            return showTop
        },

    },


    watch: {},

    data: function () {
        return {
            activeGuid: this.guid,
            freeFormCutter: '',
            lccFeatureDataCounter: 0,
            hasNoData: false,
            showField: true,
            preferences: {},
            cutterCalcLength: 3,
        }
    },

    mounted: function () {
        //get the preferences to load into the page
        for (let k in this.styleDefault) {
            if (k.includes("shelflist-link")) {
                let o = Object.assign({}, this.styleDefault[k])
                if (o.index in this.preferences) {
                    //save `k` so the information in the page will match the preferences in real time
                    this.preferences[o.index].push(k)
                } else {
                    this.preferences[o.index] = [k]
                }
            }
        }
    },
    created: function () {
        this.cutterCalcLength = this.preferenceStore.returnValue('--b-shelflist-cutter-length')
    },
};
</script>

<style scoped>
.external-links a:hover,
.classweb-links a:hover,
a:hover {
    color: blue !important;
}

.external-links a,
.classweb-links a {
    color: v-bind("preferenceStore.returnValue('--c-edit-main-literal-font-color')") !important;
}


.component-container {
    color: v-bind("preferenceStore.returnValue('--c-edit-main-literal-font-color')") !important;
    position: relative;
    top: -6px;
}
.cutter-container {
    display: flex;
}

.classweb-links{
    padding: 5px;
}

.cutter-calc {}

.links {
    padding: 5px;
}

.external-links>ul>li {
    list-style: none;
}

.external-links>ul {
    padding: 0px;
}

.shelflist-search {
    flex: 1 1 0%;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>