<template>
    <div class="classification-tools">

        <div class="classweb-links">
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
                target="_blank">ClassWeb Search: {{ lccFeatureData.secondSubject }}</a><br />
        </div>



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
                                    parseInt(cutterCalcLength)) }}</span>
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
                            12) }}</span>
                        <input placeholder="Free Form Cutter Input" v-model="freeFormCutter">
                        <input type="text"
                            :value="usePeriodInCutter() + calculateCutter(freeFormCutter, parseInt(cutterCalcLength)).substring(0, parseInt(cutterCalcLength))">
                        <a style="font-size: 0.85em; padding-left: 0.5em;"
                            @click.prevent="setLccInfo(lccFeatureData.cutterGuid, calculateCutter(freeFormCutter, parseInt(cutterCalcLength)).substring(0, parseInt(cutterCalcLength)))"
                            href="#">Use</a>
                    </div>


                </template>

                <div>
                    <input type="range" v-model="cutterCalcLength" id="cutterCalcLength" name="cutterCalcLength" min="0"
                        max="6" step="1" />
                    <label for="cutterCalcLength" style="font-size: 0.8em; vertical-align: text-top;">Calc Length
                        ({{ cutterCalcLength
                        }})</label>
                </div>


            </fieldset>
        </div>



        <div class="doc-links">
            <ul>
                <template v-for="(item, idx) in preferences">
                    <li v-if="item[1] && preferenceStore.returnValue(item[1]) != ''">
                        <a :href="preferenceStore.returnValue(item[1])" target="_blank">
                            {{ preferenceStore.returnValue(item[0]) != "" ? preferenceStore.returnValue(item[0]) :
                                preferenceStore.returnValue(item[1]) }}
                            <span class="material-icons" style="font-size: 14px;">open_in_new</span>
                        </a>
                    </li>
                </template>
            </ul>
        </div>

        <div style="flex:1;     display: flex;justify-content: center;align-items: center;">
            <button @click="openShelfListSearch">Shelf List Search</button>
        </div>


    </div>
</template>

<script>

import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'

import { mapStores, mapState, mapWritableState } from 'pinia'


export default {
    name: "ClassTools",
    components: {},

    props: { },

    methods: { },

    computed: {
    ...mapStores(useProfileStore),
    ...mapStores(usePreferenceStore),

    // ...mapState(useConfigStore, ['scriptShifterLangCodes', 'lccFeatureProperties']),
    // ...mapWritableState(useProfileStore, ['showShelfListingModal','activeField','activeProfile', 'literalLangShow', 'literalLangInfo','dataChangedTimestamp','activeShelfListData','pairedLitearlIndicatorLookup']),
    // ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse','diacriticPacks', 'showPrefModal','showPrefModalgroup','styleDefault', 'showPrefModalGroup', 'fontFamilies', 'returnValue']),
    },

}

</script>