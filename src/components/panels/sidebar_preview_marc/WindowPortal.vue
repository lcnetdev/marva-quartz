<!-- https://stackoverflow.com/questions/49657462/open-a-vuejs-component-on-a-new-window -->
<template>
    <template v-if="open">
        <!-- <MarcDisplay :previewData="content" /> -->
         hello?
         <slot></slot>
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
        openPortal() {
            console.info("open portal: ", this.content)
            this.windowRef = window.open("", "", "width=600,height=400,left=200,top=200");
            this.windowRef.addEventListener('beforeunload', this.closePortal);
            // magic!
            this.windowRef.document.body.appendChild(this.$el);
        },
        closePortal() {
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
