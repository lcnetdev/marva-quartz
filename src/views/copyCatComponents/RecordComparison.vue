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
                            <div class="marc" v-html="recordCopyCat"></div>
                            <!-- {{ recordCopyCat }} -->
                        </div>
                    </pane>
                    <pane max-size="50">
                        <h3>Existing BFDB Record</h3><a href="">link to BFDB</a>
                        <div class="marc-wrapper record-existing">
                            <pre>
                                {{ recordExisting }}
                            </pre>
                        </div>
                    </pane>
                </splitpanes>

                <div class="footer">
                    <h1>Buttons here</h1>
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
    },
    components: { Splitpanes, Pane, Nav, VueFinalModal },

    data() {
        return {}
    },
    computed: {
        ...mapStores(usePreferenceStore),
        ...mapStores(useConfigStore),
    },

    watch: {},

    methods: {
        closeEditor: function () {
            this.$emit('hideCompModal', true)
        },
    },

    mounted: async function () { },
    created: async function () {
        this.recordCopyCat = this.recordCopyCat.replace("> <", ">&nbsp;<")
    }
}

</script>


<style scoped>
.comp-container-outer {
    height: 90dvh;
}

.marc {
    /* float: right; */
    width: 90%;
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
    height: 80%;

    margin-top: 5px;
    margin-left: 1%;

    font-family: monospace, monospace;
}

.record-copycat {
    background-color: #efefef;
    width: inherit;
    overflow-wrap: anywhere;
}

.record-existing {
    background-color: #fafad2;
    width: inherit;
    overflow-wrap: anywhere;
}

</style>

<style>
span.indicators{
    white-space: pre;
}
</style>
