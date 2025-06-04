<!-- https://stackoverflow.com/questions/49657462/open-a-vuejs-component-on-a-new-window -->
<template>
    <template v-if="open">
        {{ styles }}
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
        }
    },
    computed: {
        ...mapStores(usePreferenceStore),
        ...mapState(usePreferenceStore, ['styleDefault']),
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
            Array.from(this.sourceDoc.styleSheets).forEach(styleSheet => {
                if (styleSheet.cssRules){
                    const newStyleEl = this.sourceDoc.createElement('style')
                    Array.from(styleSheet.cssRules).forEach(cssRule => {
                        newStyleEl.appendChild(this.sourceDoc.createTextNode(cssRule.cssText))
                    })

                    targetDoc.head.appendChild(newStyleEl)
                } else if (styleSheet.href){
                    const newLinkEl = this.sourceDoc.createElement('link')
                    newLinkEl.rel = 'stylesheet'
                    newLinkEl.href = styleSheet.href
                    targetDoc.head.appendChild(newLinkEl)
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
        },
        closePortal() {
            console.info("closing")
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
    },
    beforeDestroy() {
        console.info("destroy")
        if (this.windowRef) {
            this.closePortal();
        }
    }
}
</script>
