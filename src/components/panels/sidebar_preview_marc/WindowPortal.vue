<!-- https://stackoverflow.com/questions/49657462/open-a-vuejs-component-on-a-new-window -->
<template>
        <template v-if="open">
            <MarcDisplay :previewData="content" selected="" v-if="type == 'marc'"/>
        </template>
</template>

<script>
import { usePreferenceStore } from '@/stores/preference'
import { mapStores, mapState } from 'pinia'

import MarcDisplay from './MarcDisplay.vue'

export default {
    components: {
      MarcDisplay
    },
    name: 'window-portal',
    props: {
        open: {
            type: Boolean,
            default: true,
        },
        content: {
            type: Object,
            default: {}
        },
        type: {
            type: String,
            default: ''
        },
        sourceDoc: {
            type: Object,
            default: {}
        }
    },
    data() {
        return {
            windowRef: null,
            currentPanels: null,
        }
    },
    computed: {
        ...mapStores(usePreferenceStore),
        ...mapState(usePreferenceStore, ['styleDefault', 'panelSizePresets']),
    },
    watch: {
        open(newOpen) {
            console.info("???")
            if (newOpen) {
                this.openPortal();
            } else {
                this.closePortal();
            }
        }
    },
    methods: {
        copyStyles(targetDoc) {
            console.info('source: ', this.sourceDoc)
            console.info('styleSheets: ', this.sourceDoc.styleSheets)
            console.info("targetDoc: ", targetDoc)
            console.info("this: ", window.document)

            // Copy the style from the component we are duplicating
            Array.from(this.sourceDoc.styleSheets).forEach(styleSheet => {
                if (styleSheet.cssRules){
                    const newStyleEl = this.sourceDoc.createElement('style')
                    Array.from(styleSheet.cssRules).forEach(cssRule => {
                        newStyleEl.appendChild(this.sourceDoc.createTextNode(cssRule.cssText))
                    })

                    targetDoc.head.appendChild(newStyleEl)
                }
            })

            //Copy the style from there
            Array.from(window.document.styleSheets).forEach(styleSheet => {
                if (styleSheet.cssRules){
                    const newStyleEl = window.document.createElement('style')
                    Array.from(styleSheet.cssRules).forEach(cssRule => {
                        newStyleEl.appendChild(window.document.createTextNode(cssRule.cssText))
                    })

                    targetDoc.head.appendChild(newStyleEl)
                }
            })
        },
        openPortal() {
            console.info("open portal: ", this.content)
            this.windowRef = window.open("", "", "width=700,height=600,left=200,top=200");
            this.windowRef.addEventListener('beforeunload', this.closePortal);
            // magic!
            this.windowRef.document.body.appendChild(this.$el);
            this.copyStyles(this.windowRef.document)

            //adjust the panel sizes
            //get the current info and store it
            this.currentPanels = this.preferenceStore.getPanelData()

            // adjust the sizes to hide the one being popped out
            let newPanels = JSON.parse(JSON.stringify(this.currentPanels))
            let previewPanelSizes = Object.keys(newPanels.percents).filter((panel) => !panel.includes('-edit-') && !panel.includes('properties'))
            let previewEditSizes = Object.keys(newPanels.percents).filter((panel) => panel.includes('-edit-'))
            let previewSize = 0
            let nullPanels = []
            let adjustedPanels = []

            // get the size of the panel we're going to dup
            for (let panel of previewPanelSizes){
                if (panel.includes(this.type) && newPanels.percents[panel]){
                    previewSize += Number(newPanels.percents[panel].slice(0,2))
                }
            }

            // find the edit panels that have a size (in dual edit or not)
            for (let panel of previewEditSizes){
                if (newPanels.percents[panel]){
                    adjustedPanels.push(panel)
                } else {
                    nullPanels.push(panel)
                }
            }

            for (let key in newPanels.percents){
                if (key.includes(this.type)){
                    newPanels.percents[key] = "1%" // shrink the panel we are duping in a new window
                } else if (adjustedPanels.includes(key)){ // add the space to the form panels
                    let size = Number(newPanels.percents[key].slice(0,2))
                    if (adjustedPanels.length == 1){
                        newPanels.percents[key] = size + previewSize + "%"
                    } else {
                        newPanels.percents[key] = size + (previewSize/2) + "%"
                    }
                }
            }

            // move to adjusted panels
            this.preferenceStore.setPanelData(newPanels)
        },
        closePortal() {
            console.info("closing")
            this.preferenceStore.setPanelData(this.currentPanels)
            if (this.windowRef) {
                this.windowRef.close();
                this.windowRef = null;
                this.$emit('close');
            }
        }
    },
    mounted() {
        if (this.open) {
            this.openPortal();
        }

        this.panelSizePresets = this.preferenceStore.returnValue('--o-edit-main-splitpane-edit-panel-size-presets')
    },
    beforeDestroy() {
        if (this.windowRef) {
            this.closePortal();
        }
    }
}
</script>

<!--  -->

<style scoped>
body {
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-background-color')") !important;
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;
}
</style>