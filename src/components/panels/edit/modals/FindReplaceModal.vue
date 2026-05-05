<script>
import { usePreferenceStore } from '@/stores/preference'
// import { useConfigStore } from '@/stores/config'
import { useProfileStore } from '@/stores/profile'

import { mapStores, mapState, mapWritableState } from 'pinia'
import { VueFinalModal } from 'vue-final-modal'
import VueDragResize from 'vue3-drag-resize'
import "vue3-colorpicker/style.css";

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

            initalHeight: 700,
            initalLeft: 400,

            iconColor: '#000000',

            customIcon: '',

            presetIcon: null,
            useAsDefault: false,


            findTarget: '',
            replaceTarget: '',
            activeMatch: 0,
            matches: [],
            matchCase: false,

        }
    },
    computed: {
        ...mapStores(useProfileStore, usePreferenceStore),
        ...mapWritableState(usePreferenceStore, ['showFindReplaceModal', 'panelDisplay', 'panelSizePresets']),
        ...mapWritableState(useProfileStore, ['activeProfile', 'findLiterals', 'setValueLiteral', 'buildPropertyPath', 'returnStructureByGUID', 'returnLiteralValueFromProfile']),





    },

    watch: {
        matchCase(newVal, oldVal){
            console.info("newVal: ", newVal)
            console.info("oldVal: ", oldVal)
            this.matchCase = newVal
            this.find()
        }

    },

    methods: {

        dragResize: function (newRect) {
            this.width = newRect.width
            this.height = newRect.height
            this.top = newRect.top
            this.left = newRect.left
        },

        onSelectElement(event) {
            const tagName = event.target.tagName
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'LABEL' || tagName === 'SELECT' || tagName === 'SPAN' || tagName == 'INPUT' || tagName === 'TD') {
                event.stopPropagation()
            }
        },

        close() {
            this.matches = []
            this.showFindReplaceModal = false
        },

        find() {
            this.matches = []
            console.info("finding: ", this.findTarget)
            console.info("\tactiveProfile: ", this.activeProfile)
            console.info("\tmatchCase? ", this.matchCase)
            console.info("\tmatches: ", this.matches)

            let literals = document.getElementsByTagName('textarea')
            for (let field of literals) {
                let value = field.value
                if (!this.matchCase) {
                    let reg = new RegExp(this.findTarget, "dig")
                    let matches = value.matchAll(reg)
                    for (let match of matches){
                        this.matches.push({'match': match, 'text': value, 'field': field})
                    }
                } else {
                    let reg = new RegExp(this.findTarget, "dg")
                    let matches = value.matchAll(reg)
                    for (let match of matches){
                        this.matches.push({'match': match, 'text': value, 'field': field})
                    }
                }
            }

            console.info("matches: ", this.matches)
        },

        replace(data){
            console.info("Replacing: ", data)
            let target = data.field
            let fieldGuid = target.getAttribute("data-guid")
            let targetGuid = target.getAttribute("data-parent")

            console.info("\ttarget: ", target.value)

            let newText = target.value.slice(0, data.match.indices[0][0]) + this.replaceTarget + target.value.slice(data.match.indices[0][1])

            let pp
            try {
                let structure = this.returnStructureByGUID(targetGuid)
                pp = this.buildPropertyPath(structure, [], fieldGuid)
            } catch(err){
                console.error("Error building PropertyPath: ", err)
                return
            }
            let currentValue = this.returnLiteralValueFromProfile(targetGuid, pp)
            console.info("\tcurrentValue: ", currentValue)
            console.info("\tnewText: ", newText)

            for (let val of currentValue){
                if (( val['@language'] && val['@language'].toLowerCase().includes('latn')) || val['@language'] == null){
                    // console.info("\tdo it")
                    // console.info("\t\t", targetGuid)
                    // console.info("\t\t", fieldGuid)
                    // console.info("\t\t", pp)
                    // console.info("\t\t", newText)
                    // console.info("\t\t", val['@language'])
                    this.setValueLiteral(targetGuid, fieldGuid, pp, newText, val['@language'], false)
                    target.value = newText
                }
            }
        },

        loopLiteralsToReplace(all = false) {

            /**
             * TODO:
             *   - [X] Case matching
             *   - [] How to handle mulitple matches in 1 textarea
             *   - [] Replace All
             *   - [] Handle non-Latin?
             */

            console.info("replacing")
            if (!this.replaceTarget){
                let cont = confirm("There's no replacement text. Continuing will delete text.")
                if (!cont){ return }
            }
            if (!all){
                let target = this.matches[this.activeMatch]
                this.replace(target)
                // if (this.activeMatch < this.matches.length){
                //     this.activeMatch++
                // }
            } else {
                for (let target of this.matches){
                    this.replace(target)
                }
            }


            setTimeout(()=>{
                this.find()
            }, 500)
        },

        buildDisplay(text, details){
            // wrap target text in HTML to style it
            let target = this.findTarget
            const tag = "<span class='match-bold'>"

            const idxStart = details.match.indices[0][0]
            const idxEnd = Number(idxStart) + target.length + tag.length

            if (idxStart >= 0 && idxEnd >= 0 ){
                text = text.slice(0, idxStart) + tag + text.slice(idxStart);
                text = text.slice(0, idxStart+tag.length + target.length) + "</span>" + text.slice(idxEnd)
            }

            return text
        },


    },


    created() {


    },

    async mounted() {
        this.panelSizePresets = this.preferenceStore.returnValue('--o-edit-main-splitpane-edit-panel-size-presets')
    }
}



</script>

<template>


    <VueFinalModal display-directive="show" :hide-overlay="false" :overlay-transition="'vfm-fade'">
        <VueDragResize :is-active="true" :w="850" :h="initalHeight" :x="initalLeft" :y="50" class="debug-modal"
            @resizing="dragResize" @dragging="dragResize" :sticks="['br']" :stickSize="22">
            <div id="panel-resize-content" ref="panelResizeContent" @mousedown="onSelectElement($event)"
                @touchstart="onSelectElement($event)">
                <div class="menu-buttons">
                    <button class="close-button" @pointerup="close">X</button>
                </div>
                <h2>Find & Replace</h2>

                <div class="container-search">
                    <label for="input-find" onclick="" class="toggle-btn">Find: </label>
                    <input id="input-find" type="text" class="search-mode-radio" v-model="findTarget"
                        name="inputFind" />

                    <label for="input-case" onclick="" class="toggle-btn">Match Case? </label>
                    <input id="input-case" type="checkbox" class="search-mode-radio" v-model="matchCase"
                        name="inputFind" />

                    <br>

                    <label for="input-replace" onclick="" class="toggle-btn">Replace: </label>
                    <input id="input-replace" type="text" class="search-mode-radio" v-model="replaceTarget"
                        name="inputReplace" />

                    <br>

                    <button @click="find">Find</button>
                </div>

                <div v-if="matches.length > 0" class="container-results">
                    <table>
                        <tbody>
                            <tr v-for="(match, idx) of matches">
                                <td :class="{ active: activeMatch === idx }" @click="activeMatch = idx" v-html="buildDisplay(match.text, match)">
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <button @click="loopLiteralsToReplace()">Replace</button>
                    <button @click="loopLiteralsToReplace(true)">Replace All</button>
                </div>

            </div>




        </VueDragResize>
    </VueFinalModal>




</template>
<style>

span.match-bold {
    font-weight: bolder;
    font-size: 16px;
}

</style>

<style scoped>
table {
    border-collapse: collapse;
    border: 2px solid rgb(140 140 140);
    font-family: sans-serif;
    font-size: 0.8rem;
    letter-spacing: 1px;
}

td {
    border: 1px solid rgb(160 160 160);
    padding: 8px 10px;
}

.active {
    background-color: rgb(131, 131, 255);
}
</style>
