<template>

    <VueFinalModal :hide-overlay="false" :overlay-transition="'vfm-fade'" :content-transition="'vfm-fade'"
        :click-to-close="true" :esc-to-close="true" @closed="closeEditor()" :background="'non-interactive'"
        :lock-scroll="true" class="comparison-modal" content-class="comparison-modal-content">

        <div ref="compModalContainer" class="comp-modal-container">
            <div :style="`position: relative; ${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()}`"
                class="comp-container-outer">

                <div class="header">
                    <h1>CopyCat Ingest</h1>
                </div>

                <splitpanes class="default-theme" vertical>
                    <pane max-size="50">
                        <h3>CopyCat Record</h3>
                        <div class="marc-wrapper record-copycat">
                            <div class="marc" v-html="recordCopyCat" @mouseover="highlightTags" @mouseout="highlightTags"></div>
                            <!-- {{ recordCopyCat }} -->
                            <!-- .native.capture -->
                        </div>
                    </pane>
                    <pane max-size="50">
                        <span class="heading">
                            <h3>Existing BFDB Record</h3> <a :href="existingRecordUrl.replace('8080', '8230')" target="_blank">link to BFDB</a>
                        </span>
                        <div class="marc-wrapper record-existing">
                            <!-- <pre v-if="recordExisting.length > 0">
                                {{ recordExisting }}
                            </pre> -->
                            <div v-if="recordExisting.length > 0" class="marc" v-html="recordExisting" @mouseover="highlightTags" @mouseout="highlightTags"></div>
                            <div v-else>
                                No existing record in BFDB.
                            </div>
                        </div>
                    </pane>
                </splitpanes>

                <div v-if="!preview"
                    :style="`${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()}`"
                    class="footer">
                    <h1 v-if="Object.keys(recordExisting).length > 0">There is an existing record. If you continue, the copycat record will overlay the existing record.</h1>
                    <h1 v-else>There is no existing record. If you continue, you will create a new record.</h1>
                    <button @click="createCopyCat">Continue</button>
                    <button @click="cancelCopyCat">Cancel</button>
                </div>
                <div v-else
                    :style="`${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()}`"
                    class="footer">
                    <button @click="cancelCopyCat">Cancel</button>
                </div>
            </div>
        </div>

    </VueFinalModal>
</template>


<script>

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { usePreferenceStore } from '@/stores/preference'
import { useConfigStore } from '@/stores/config'
import { useProfileStore } from '@/stores/profile'
import { VueFinalModal } from 'vue-final-modal'

import { mapStores, mapState, mapWritableState } from 'pinia'

import Nav from "@/components/panels/nav/Nav.vue";
import utilsProfile from '@/lib/utils_profile';
import utilsNetwork from '@/lib/utils_network';
import utilsParse from '@/lib/utils_parse';




export default {
    name: 'RecordComparison',
    props: {
        recordCopyCat: String,
        recordExisting: String,
        preview: Boolean,
        existingRecordUrl: String,
    },
    components: { Splitpanes, Pane, Nav, VueFinalModal },

    data() {
        return {
            message: '',
        }
    },
    computed: {
        ...mapStores(usePreferenceStore),
        ...mapStores(useConfigStore),
    },

    watch: { },

    methods: {
        highlightTags: function(e){
            let name = e.target.className
            if (!name.includes("tag") && !name.includes("leader")){
                name =  e.target.parentNode.childNodes[0].className
                if (name && !name.includes("tag")){
                    name =  e.target.parentNode.parentNode.childNodes[0].className
                }
            }
            if (name){
                const els = document.getElementsByClassName(name)
                // for (let el of els){
                for (let i=els.length-1; i>=0; i--){
                    let target = els[i]
                    if (!name.includes('leader')){
                        target = target.parentNode
                    }
                    if (e.type == 'mouseover'){
                        target.classList.add("highlight-field")
                    } else {
                        target.classList.remove("highlight-field")
                    }
                }
            }
        },
        createCopyCat: function(){
            console.info("creating")
            this.$emit('createCopyCat')
        },

        cancelCopyCat: function(){
            console.info("canceling")
            this.$emit('cancelCopyCat')
        },

        closeEditor: function () {
            this.$emit('hideCompModal', true)
        },
    },

    mounted: async function () { },
    created: async function () { }
}

</script>


<style scoped>
.comp-container-outer {
    height: 80dvh;
}

.marc {
    /* float: right; */
    width: 97%;
    height: 100%;
    overflow-y: scroll;
}

.marc-wrapper {
    margin: 0 auto;
    display: grid;
    /* max-width: 45%; */
    /* grid-template-columns: 1fr 1fr 2fr; */
    grid-gap: 10px;
    /* width: inherit; */

    overflow-y: hidden;
    overflow: scroll;
    position: fixed;
    /* height: fit-content; */
    height: 75dvh;

    margin-top: 5px;
    margin-left: 1%;

    font-family: monospace, monospace;
    /* font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-marc-font-family')"); */
}

.record-existing,
.record-copycat {
    background-color: #e3ffd8;
    width: inherit;
    overflow-wrap: anywhere;
}

.record-existing {
    background-color: #fafad2;
    width: inherit;
    overflow-wrap: anywhere;
}

.heading h3{
    display: inline-block;
}

.footer {
    padding: 10px;
}
</style>

<style>


span.indicators{
    white-space: pre;
}

div.marc.field {
    text-indent: 4em hanging;
}


.highlight-field {
    background-color: rgb(209, 209, 209);
}

</style>
