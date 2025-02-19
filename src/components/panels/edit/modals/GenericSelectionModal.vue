<!-- A modal that takes parameters as props to create a generic popup with a selection. The chooses values get returned with `emit` -->

<template>
    <VueFinalModal
    :hide-overlay="false"
    :overlay-transition="'vfm-fade'"
    :content-transition="'vfm-fade'"
    :click-to-close="true"
    :esc-to-close="true"
    :background="'non-interactive'"
    :lock-scroll="true"
    class="generic-selection-modal"
    content-class="generic-selection-modal"
    >
        <VueDragResize
        :is-active="true"
        :w="200"
        :h="200"
        :x="initalLeft"
        class="login-modal"
        @resizing="dragResize"
        @dragging="dragResize"

        :sticks="['br']"
        :stickSize="22"
        >
            <div class="container">
                <h1>{{ title }}</h1>

                <template v-if="!multiple">
                    <select>
                        <option v-for="(item, idx) in options" :data-label="item.label" :value="item.value" :key="idx" :label="item.label"></option>
                    </select>
                </template>
                <template v-else>
                    <ul>
                        <li v-for="(item, idx) in options">
                            <input type="checkbox" :value="item.value">{{ item.label }}
                        </li>
                    </ul>
                </template>
            </div>
        </VueDragResize>
    </VueFinalModal>
</template>

<script>
import { usePreferenceStore } from '@/stores/preference'
import { useConfigStore } from '@/stores/config'
import { mapStores, mapState } from 'pinia'
import { VueFinalModal } from 'vue-final-modal'
import VueDragResize from 'vue3-drag-resize'

export default {
    components: {VueFinalModal, VueDragResize},
    props: {
        title: String,
        options: Array,
        multiple: Boolean, // Single/multiple options can be selected
    },
    watch: {},
    data(){
        return {
            test: "test"
        }
    },
    computed: {},
    methods: {},
    created() {},
    mounted() {},
    updated() {},

}

</script>

<style>
    .generic-selection-modal {
        background: white;
    }
</style>