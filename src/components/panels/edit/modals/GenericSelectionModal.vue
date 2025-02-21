<!--
 A modal that takes parameters as props to create a generic popup with a selection. The choosen values get returned with `emit`
-->

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
        :w="modalSettings.width"
        :h="modalSettings.height"
        :x="modalSettings.initalLeft"
        :y="modalSettings.initalTop"
        class="login-modal"
        @resizing="dragResize"
        @dragging="dragResize"

        :sticks="['br']"
        :stickSize="22"
        >
            <div class="modal-container">
                <div class="menu-buttons">
                    <button @click="$emit('closeModal')">x</button>
                </div>
                <h1>{{ title }}</h1>

                <template v-if="!multiple">
                    <select v-model="selected">
                        <option v-for="(item, idx) in options" :data-label="item.label" :value="item.value" :key="idx" :label="item.label"></option>
                    </select>
                </template>
                <template v-else>
                    <ul>
                        <li v-for="(item, idx) in options">
                            <input type="checkbox" :id="item.value" :value="item.value" v-model="selected">{{ item.label }}
                        </li>
                    </ul>
                </template>
                {{ preferenceStore.returnValue('--c-edit-modals-background-color') }}
                <button class="action-button" @click="$emit('emitSelection', gatherSelection())">{{ modalSettings.buttonText }}</button>
            </div>
        </VueDragResize>
    </VueFinalModal>
</template>

<script>
import { usePreferenceStore } from '../../../../stores/preference';
import { mapStores, mapState } from 'pinia'
import { VueFinalModal } from 'vue-final-modal'
import VueDragResize from 'vue3-drag-resize'

export default {
    components: {VueFinalModal, VueDragResize},
    props: {
        title: String,
        options: Array,
        multiple: Boolean, // Single/multiple options can be selected
        modalSettings: Object
    },
    watch: {},
    data(){
        return {
            test: "test",
            selected: [],
        }
    },
    computed: {
        ...mapStores(usePreferenceStore),
        ...mapState(usePreferenceStore, ['styleDefault','panelDisplay']),
    },
    methods: {
        gatherSelection: function(){
            console.info("selected: ", this.selected)
            return this.selected
        },
    },
    created() {},
    mounted() {},
    updated() {},

}

</script>

<style>
    .content-container {
        border-radius: 25px;
        /* background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color')")  !important;
        color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')")  !important; */
        background-color: white;
    }
</style>

<style scoped>
    h1 {
        width: 95%;
        padding: 10px;
    }
    ul {
        list-style: none;
    }
    li {
        margin: 5px;
    }
    .menu-buttons {
        right: 20px;
        top: 5px;
        position: absolute;
        z-index: 100000;
    }
    .action-button {
        margin: 5px;
        margin-top: 10px;
    }

</style>