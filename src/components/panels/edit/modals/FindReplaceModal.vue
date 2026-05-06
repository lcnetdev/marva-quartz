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

            initialWidth: 900,
            initalHeight: 500,
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
        ...mapWritableState(useProfileStore, ['activeComponent', 'activeProfile', 'findLiterals', 'setValueLiteral', 'buildPropertyPath', 'returnStructureByGUID', 'returnLiteralValueFromProfile']),



    },

    watch: {
        matchCase(newVal, oldVal) {
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
            let literals = document.getElementsByTagName('textarea')
            for (let field of literals) {
                let fieldGuid = field.getAttribute("data-guid")
                let targetGuid = field.getAttribute("data-parent")

                let value = field.value
                if (!this.matchCase) {
                    let reg = new RegExp(this.findTarget, "dig")
                    let matches = value.matchAll(reg)
                    for (let match of matches) {
                        let structure = this.returnStructureByGUID(targetGuid)
                        this.matches.push({ 'match': match, 'text': value, 'field': field, 'component': structure })
                    }
                } else {
                    let reg = new RegExp(this.findTarget, "dg")
                    let matches = value.matchAll(reg)
                    for (let match of matches) {
                        let structure = this.returnStructureByGUID(targetGuid)
                        this.matches.push({ 'match': match, 'text': value, 'field': field, 'component': structure })
                    }
                }
            }
        },

        replace(data) {
            let target = data.field
            let fieldGuid = target.getAttribute("data-guid")
            let targetGuid = target.getAttribute("data-parent")
            let newText = target.value.slice(0, data.match.indices[0][0]) + this.replaceTarget + target.value.slice(data.match.indices[0][1])

            let pp
            try {
                let structure = this.returnStructureByGUID(targetGuid)
                pp = this.buildPropertyPath(structure, [], fieldGuid)
            } catch (err) {
                console.error("Error building PropertyPath: ", err)
                return
            }
            let currentValue = this.returnLiteralValueFromProfile(targetGuid, pp)

            for (let val of currentValue) {
                if ((val['@language'] && val['@language'].toLowerCase().includes('latn')) || val['@language'] == null) {
                    this.setValueLiteral(targetGuid, fieldGuid, pp, newText, val['@language'], false)
                    target.value = newText
                }
            }
        },

        loopLiteralsToReplace(all = false) {
            if (!this.replaceTarget) {
                let cont = confirm("There's no replacement text. Continuing will delete text.")
                if (!cont) { return }
            }
            if (!all) {
                let target = this.matches[this.activeMatch]
                this.replace(target)
                if (this.activeMatch < this.matches.length-1){
                    this.activeMatch++
                }
            } else {
                for (let target of this.matches) {
                    this.replace(target)
                }
            }


            setTimeout(() => {
                this.find()
            }, 500)
        },

        buildDisplay(text, details) {
            // wrap target text in HTML to style it
            let target = this.findTarget
            const tag = "<span class='match-bold'>"

            const idxStart = details.match.indices[0][0]
            const idxEnd = Number(idxStart) + target.length + tag.length

            if (idxStart >= 0 && idxEnd >= 0) {
                text = text.slice(0, idxStart) + tag + text.slice(idxStart);
                text = text.slice(0, idxStart + tag.length + target.length) + "</span>" + text.slice(idxEnd)
            }

            return text
        },

        jumpToComponent(pName, eName){
            this.showFindReplaceModal = false
            this.activeComponent = this.activeProfile.rt[pName].pt[eName]
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
        <div
            >
            <VueDragResize :is-active="true" :w="initialWidth" :h="initalHeight" :x="initalLeft" :y="50" class="debug-modal"
                @resizing="dragResize" @dragging="dragResize" :sticks="['br']" :stickSize="22"
                :style="`${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()}`"
                >
                <div id="panel-resize-content" ref="panelResizeContent" @mousedown="onSelectElement($event)"
                    @touchstart="onSelectElement($event)">
                    <div class="menu-buttons">
                        <button class="close-button" @pointerup="close">X</button>
                    </div>
                    <h2>Find & Replace</h2>
                    <div class="container-search">
                        <form ref="urlToLoadForm" v-on:submit.prevent="">
                            <div class="search-fields">
                                <label for="input-find" onclick="" class="toggle-btn">Find: </label>
                                <input id="input-find" type="text" class="search-mode-radio" v-model="findTarget"
                                    name="inputFind" autofocus />
                                &nbsp;&nbsp;&nbsp;
                                <label for="input-case" onclick="" class="toggle-btn">Match Case? </label>
                                <input id="input-case" type="checkbox" class="search-mode-radio" v-model="matchCase"
                                    name="inputFind" />
                            </div>

                            <div class="search-fields">
                                <label for="input-replace" onclick="" class="toggle-btn">Replace: </label>
                                <input id="input-replace" type="text" class="search-mode-radio" v-model="replaceTarget"
                                    name="inputReplace" />
                            </div>
                            <br>
                            <button @click="find">Find</button>
                        </form>

                    </div>

                    <div v-if="matches.length >= 0" class="container-results">
                        <table>
                            <thead>
                                <tr>
                                    <th>Source</th>
                                    <th>Component</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(match, idx) of matches">
                                    <td>{{ match.component.parentId.split(":").at(-1) }}</td>
                                    <td class="component-label" @click="jumpToComponent(match.component.parentId, match.component.id)">{{ match.component.propertyLabel }}</td>
                                    <td :class="{ active: activeMatch === idx }" @click="activeMatch = idx"
                                        v-html="buildDisplay(match.text, match)">
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <button @click="loopLiteralsToReplace()">Replace</button>
                        <button @click="loopLiteralsToReplace(true)">Replace All</button>
                    </div>

                </div>




            </VueDragResize>
        </div>
    </VueFinalModal>




</template>
<style>
span.match-bold {
    font-weight: bolder;
    font-size: 16px;
}

.content-container {
    padding: 10px;
    background-color: unset;
}

.container-results {
    padding-top: 15px;
    max-height: 50%;
    width: 100%;
    overflow: scroll;
}

.component-label {
    cursor: pointer;
}
</style>

<style scoped>


.container-search {
    display: table;
}
.search-fields {
    display: table-row;
}

label,
input{
    display: table-cell
}

.container-search {
    padding-top: 5px;
}

.menu-buttons {
    margin-right: 5px;
    padding-top: 5px;
    padding-left: 15px;
    float: right;
    z-index: 99;
}

table {
    border-collapse: collapse;
    border: 2px solid rgb(140 140 140);
    font-family: sans-serif;
    font-size: 0.8rem;
    letter-spacing: 1px;

    width: 100%;
    margin-bottom: 15px;
}

th {
    font-weight: bold;
    font-size: 14px;
}

th,
td {
    border: 1px solid rgb(160 160 160);
    padding: 8px 10px;
    text-align: center;
}

.active {
    background-color: rgb(131, 131, 255);
}
</style>
