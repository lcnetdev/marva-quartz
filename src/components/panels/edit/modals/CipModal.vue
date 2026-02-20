<script>
// import { usePreferenceStore } from '@/stores/preference'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { usePreferenceStore } from '@/stores/preference'



import { mapStores, mapState, mapWritableState } from 'pinia'
import { VueFinalModal } from 'vue-final-modal'
import VueDragResize from 'vue3-drag-resize'

import short from 'short-uuid'


export default {
    components: {
        VueFinalModal,
        VueDragResize,

    },

    data() {
        return {
            width: 0,
            height: 0,
            top: 100,
            left: 0,
            initalHeight: 270,
            changedHeight: 650,
            initalLeft: 50,
            initalWidth: 600,
            initalTop: 10,

            updateDates: true,
            profile: {},
            zerozero8Date: '',
            copyrightDate: '',
            callNumberDate: '',
            two64Date: '',
            copyrightAsPub: false,
            ebookCip: false,
        }
    },

    computed: {
        ...mapStores(useConfigStore),
        ...mapStores(useProfileStore),
        ...mapStores(usePreferenceStore),
        ...mapWritableState(useProfileStore, ['showCipModal']),
    },

    watch: {
        updateDates(newValue, oldValue){
            if (this.updateDates){
                this.initalHeight = 270
            } else {
                this.initalHeight = 190
            }
        },

        copyrightAsPub(newValue, oldValue){
            if (this.copyrightAsPub){
                this.initalHeight = this.initalHeight + 40
            } else {
                this.initalHeight = this.initalHeight - 40
            }
        },

        ebookCip(){
            if (this.ebookCip){
                this.initalHeight = this.initalHeight + 16
            } else {
                this.initalHeight = this.initalHeight - 16
            }
        }
    },

    methods: {
        onSelectElement(event) {
            const tagName = event.target.tagName
            if (tagName === 'INPUT' || tagName === 'TD' || tagName === 'BUTTON' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
                event.stopPropagation()
            }
        },

        finishCip: function () {
            this.showCipModal = false

            // remove projected publication date
            let projDateComponent = this.profileStore.returnComponentByPropertyLabel('Projected publication date (YYMM)')
            this.profileStore.deleteComponent(projDateComponent['@guid'])

            // instance note, and check update when appropriate
            for (let rt in this.profile.rt){
                for (let pt in this.profile.rt[rt].pt){
                    if (this.profile.rt[rt].pt[pt]['propertyLabel'].toLowerCase() === 'Notes about the Instance'.toLowerCase()){
                        let instanceNoteComponent = this.profile.rt[rt].pt[pt]
                        console.info("instanceNoteComponent: ", instanceNoteComponent)
                        let instNoteCompUserValue = instanceNoteComponent.userValue
                        console.info("instNoteCompUserValue: ", instNoteCompUserValue)
                        if (instNoteCompUserValue["http://id.loc.gov/ontologies/bibframe/note"][0]){
                            let data = instNoteCompUserValue["http://id.loc.gov/ontologies/bibframe/note"][0]
                            let label = data["http://www.w3.org/2000/01/rdf-schema#label"][0]["http://www.w3.org/2000/01/rdf-schema#label"]
                            if (label == 'Description based on print version record and CIP data provided by publisher; resource not viewed.'){
                                label = 'Description based on print version record and CIP data provided by publisher.'

                                this.profileStore.setValueLiteral(
                                    instanceNoteComponent['@guid'], data["http://www.w3.org/2000/01/rdf-schema#label"][0]['@guid'],
                                    [{"level":0,"propertyURI":"http://id.loc.gov/ontologies/bibframe/note"},{"level":1,"propertyURI":"http://www.w3.org/2000/01/rdf-schema#label"}],
                                    label, null, null
                                )
                            }
                        }
                    }
                }
            }

            // change encoding level to `full`
            let adminComponent = false
            for (let rt in this.profile.rt) {
                if (rt.includes(":Instance")) {
                    for (let pt in this.profile.rt[rt].pt) {
                        let component = this.profile.rt[rt].pt[pt]
                        if (component.propertyLabel == 'Admin Metadata' && component.adminMetadataType == 'primary') {
                            adminComponent = component
                            break
                        }
                    }
                }
            }
            this.profileStore.setValueSimple(
                adminComponent['@guid'],
                null,
                [{ "level": 0, "propertyURI": "http://id.loc.gov/ontologies/bibframe/adminMetadata" }, { "level": 1, "propertyURI": "http://id.loc.gov/ontologies/bflc/encodingLevel" }],
                'http://id.loc.gov/vocabulary/menclvl/f',
                'full'
            )

            if (!this.updateDates){ return}
            if (this.copyrightAsPub){
                this.zerozero8Date = this.copyrightDate
            }
            if (this.zerozero8Date == '' && !this.copyrightAsPub){
                let confirmation = confirm("No 'Publication Year' provided. Continue without changes dates? [Ok], or go back and provide a year. [Cancel]")
                if (confirmation){
                    return
                } else {
                    this.showCipModal = true
                    return
                }
            }

            // -------------------------------- Date stuff below here --------------------------------
            let copyrightComponent = this.profileStore.returnComponentByPropertyLabel('Copyright date')
            let ccGuid = short.generate()
            if (copyrightComponent.userValue["http://id.loc.gov/ontologies/bibframe/copyrightDate"] && copyrightComponent.userValue["http://id.loc.gov/ontologies/bibframe/copyrightDate"][0]) {
                ccGuid = copyrightComponent.userValue["http://id.loc.gov/ontologies/bibframe/copyrightDate"][0]['@guid']
            }

            if (this.copyrightDate){
                this.profileStore.setValueLiteral(
                    copyrightComponent['@guid'], ccGuid,
                    [{ "level": 0, "propertyURI": "http://id.loc.gov/ontologies/bibframe/copyrightDate" }],
                    this.copyrightDate, null, null
                )
            }

            // call number
            let callNumComponent = this.profileStore.returnComponentByPropertyLabel('Classification numbers')
            let callNumValue = callNumComponent.userValue
            if (callNumValue["http://id.loc.gov/ontologies/bibframe/classification"] && callNumValue["http://id.loc.gov/ontologies/bibframe/classification"][0]["http://id.loc.gov/ontologies/bibframe/itemPortion"]) {
                let itemPortion = callNumValue["http://id.loc.gov/ontologies/bibframe/classification"][0]["http://id.loc.gov/ontologies/bibframe/itemPortion"][0]
                let itemValue = itemPortion["http://id.loc.gov/ontologies/bibframe/itemPortion"]
                // does it look like a year?
                let possibleYear = itemValue.slice(-5) // "<space>YYYY"
                if (/ \d{4}/.test(possibleYear)) {
                    let itemNumber = itemValue.slice(0, -5)
                    if (!possibleYear.includes(this.zerozero8Date)) {
                        this.profileStore.setValueLiteral(
                            callNumComponent['@guid'], itemPortion['@guid'],
                            [{ "level": 0, "propertyURI": "http://id.loc.gov/ontologies/bibframe/classification" }, { "level": 1, "propertyURI": "http://id.loc.gov/ontologies/bibframe/itemPortion" }],
                            itemNumber + " " + this.zerozero8Date, null, null
                        )
                    }
                } else {
                    this.profileStore.setValueLiteral(
                        callNumComponent['@guid'], itemPortion['@guid'],
                        [{ "level": 0, "propertyURI": "http://id.loc.gov/ontologies/bibframe/classification" }, { "level": 1, "propertyURI": "http://id.loc.gov/ontologies/bibframe/itemPortion" }],
                        itemValue + " " + this.zerozero8Date, null, null
                    )
                }
            }

            // provision activity
            let provActComponent = this.profileStore.returnComponentByPropertyLabel('Provision activity')
            let proveUserValue = provActComponent.userValue
            // 008 date/EDTF
            let zerozero8 = proveUserValue["http://id.loc.gov/ontologies/bibframe/provisionActivity"][0]["http://id.loc.gov/ontologies/bibframe/date"][0]
            if (this.zerozero8Date){
                this.profileStore.setValueLiteral(
                    provActComponent['@guid'], zerozero8['@guid'],
                    [{ "level": 0, "propertyURI": "http://id.loc.gov/ontologies/bibframe/provisionActivity" }, { "level": 1, "propertyURI": "http://id.loc.gov/ontologies/bibframe/date" }],
                    this.zerozero8Date, null, null
                )
            }
            // 264 $c
            let two64 = proveUserValue["http://id.loc.gov/ontologies/bibframe/provisionActivity"][0]["http://id.loc.gov/ontologies/bflc/simpleDate"][0]
            let two64Value = two64["http://id.loc.gov/ontologies/bflc/simpleDate"]
            // if it's in [brackets], keep it in brackets. Or if it matches the copy right date add them?
            if (two64Value.startsWith('[') || this.copyrightDate == this.zerozero8Date || this.copyrightAsPub){
                this.zerozero8Date = '[' + this.zerozero8Date + ']'
            }
            if (this.zerozero8Date){
                this.profileStore.setValueLiteral(
                    provActComponent['@guid'], two64['@guid'],
                    [{ "level": 0, "propertyURI": "http://id.loc.gov/ontologies/bibframe/provisionActivity" }, { "level": 1, "propertyURI": "http://id.loc.gov/ontologies/bflc/simpleDate" }],
                    this.zerozero8Date, null, null
                )
            }

            return
        },
    },

    changed(){},

    created() {},

    mounted() {
        this.profile = this.profileStore.activeProfile
        // Get the 008 date:
        let provActComponent = this.profileStore.returnComponentByPropertyLabel('Provision activity')
        let proveUserValue = provActComponent.userValue
        if (proveUserValue["http://id.loc.gov/ontologies/bibframe/provisionActivity"][0]["http://id.loc.gov/ontologies/bibframe/date"]){
            let zerozero8 = proveUserValue["http://id.loc.gov/ontologies/bibframe/provisionActivity"][0]["http://id.loc.gov/ontologies/bibframe/date"][0]
            this.zerozero8Date = zerozero8["http://id.loc.gov/ontologies/bibframe/date"]
        }

    }
}



</script>

<template>
    <VueFinalModal display-directive="show" :hide-overlay="false" :overlay-transition="'vfm-fade'">

        <VueDragResize :is-active="true" :w="initalWidth" :h="initalHeight" :x="initalLeft" :y="initalTop"
            class="cip-modal" @resizing="dragResize" @dragging="dragResize" :sticks="['br']" :stickSize="22">

            <div id="cip-content" ref="cipContent" @mousedown="onSelectElement($event)"
                @touchstart="onSelectElement($event)"
                :style="`${this.preferenceStore.styleModalBackgroundColor()} ${this.preferenceStore.styleModalTextColor()}`">
                <div class="shelflist-menu">
                    <div class="menu-buttons">
                        <button class="close-button" @pointerup="showCipModal = false">X</button>
                    </div>
                </div>

                <h1>Finish CIP Record</h1>
                <br>
                <label for="dateCheck">Update Dates: </label>
                <input type="checkbox" name="dateCheck" id="dateCheck" v-model="updateDates" />
                &nbsp;
                <label for="ebookCip">Ebook? </label>
                <input type="checkbox" name="ebookCip" id="ebookCip" v-model="ebookCip" />
                <br><br>
                <p>This will:</p>
                <ul>
                    <li>Remove the "Projected Publication Date"</li>
                    <li>Change the encoding level to "full"</li>
                    <template v-if="updateDates">
                        <li>Match the "Provision Activity" dates and call number date to the "Publication Year"</li>
                        <li>Insert the "Copyright Year" into the "Copyright date," if provided</li>
                        <li>Update the "Note about the Instance," if appropriate</li>
                        <template v-if="copyrightAsPub">
                            <li>Use the "Copyright Year" as the "Publication Year" and put [brackets] around 264 $c</li>
                        </template>
                        <template v-if="ebookCip">
                            <li>Set the "Note about the Instance."</li>
                        </template>
                    </template>
                </ul>

                <br></br>
                <div class="cip-form" v-if="updateDates">
                    <label for="pubYear">Publication Year: </label>
                    <input type="text" name="pubYear" id="pubYear" v-model="zerozero8Date" />(default value taken from 008)
                    <br>
                    <label for="copYear">Copyright Year: </label>
                    <input type="text" name="copYear" id="copYear" v-model="copyrightDate" />
                    &nbsp;
                    <input type="checkbox" name="copyPub" id="copyPub" v-model="copyrightAsPub" />
                    <label for="copyPub"> (Use CopyRight as Pub)</label>


                </div>

                <button @click="finishCip()">Finish CIP</button>
            </div>
        </VueDragResize>
    </VueFinalModal>


</template>
<style></style>

<style scoped>
#cip-content {
    padding: 5px;
}
.close-button {
    position: absolute;
    right: 0px;
    top: 0px;
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
    z-index: 999;
}
</style>
