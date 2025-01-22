<script>
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'


  import {  mapStores, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'


  export default {
    components: {
      VueFinalModal,
      VueDragResize,
    },
    props: {
        instances: Object,
    },
    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,
        validationResults: {},
        validating: false,
        initalHeight: 400,
        initalLeft: (window.innerWidth /2 ) - 450,


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,useConfigStore),

      // ...mapState(usePreferenceStore, ['debugModalData']),
      ...mapWritableState(useProfileStore, ['showItemInstanceSelection']),
    },


    methods: {
        closeModal : function(){
            this.$emit('hideInstanceSelectionModal', true)
        },

        dragResize: function(newRect){
          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left
        },

        setInstance: async function(event){
            this.$emit('emitSetInstance', event.target.value)
        },

        updateLabel: function(currLabel){
            if (currLabel.includes(":Work")){
                return "Work"
            } else {
                if (currLabel.includes("_")){
                    let parts = currLabel.split("_")
                    return "Instance " + (parseInt(parts[1]) + 1)
                } else {
                    return "Instance 1"
                }
            }
        }
    },

    mounted() {}
  }



</script>

<template>
    <VueFinalModal
        display-directive="show"
        :hide-overlay="true"
        :overlay-transition="'vfm-fade'"
        :contentClass="instance-selection-modal-container"
      >
      <VueDragResize
            :is-active="true"
            :w="400"
            :h="250"
            :x="200"
            :y="50"
            @resizing="dragResize"
            @dragging="dragResize"
            :sticks="['br']"
            :stickSize="22"
            style="background-color: whitesmoke"
            >

            <div class="instance-selection-modal" ref="instanceSelection">
                <div>
                    <h3 style="width: 80%; float: left; padding: 5px;">Select Instance the Item belongs to</h3>
                    <div class="close-button">
                        <button @click="closeModal()">Close</button>
                    </div>
                </div>
                <div class="toggle-btn-grp cssonly">
                    <div v-for="(value, key, idx) in instances">
                        <input type="radio" :id="key" :value="key" class="instance-selection-radio" v-model="selectedInstance" name="instance-selection" @click="setInstance($event, idx)" />
                        <label onclick="setInstance($event, idx)" :for="key" class="dewey-toggle-btn">{{ updateLabel(value) }}</label>
                    </div>
                </div>
            </div>
        </VueDragResize>
    </VueFinalModal>
</template>

<style scoped>

.instance-selection-modal {
        height: inherit;
        background-color: whitesmoke;
        border: 1px solid black;
        overflow-y: scroll;
    }

    .close-button {
        float: right;
        width: 20%;
        padding: 5px;
    }

    .toggle-btn-grp.cssonly{
        width: 100%;
        /* height: inherit; */
        line-height: 30px;

        display: grid;
        flex-direction: row;
        flex-wrap: wrap
    }
    .toggle-btn-grp.cssonly div {
        margin: 5px 2px;
    }

    .toggle-btn-grp div {
        margin: 5px;
        padding: 5px;
        width: fit-content;
    }

    .instance-selection-radio {
        position: absolute;
        z-index: 100;
        cursor: pointer;
        opacity: 0;
    }

    .toggle-btn-grp.cssonly div input{
        padding: 5px;
    }

    .toggle-btn-grp.cssonly div label:hover {
        border: solid 1px #a0d5dc !important;
    }

    .toggle-btn-grp.cssonly div input + label{
        border: solid 1px black;
        border-radius: 5px;
        padding: 5px;
    }

    .toggle-btn-grp.cssonly div input:checked + label{
        background-color: lightblue;
        border: solid 1px blue;
        border-radius: 5px;
    }

    .toggle-btn {
        cursor: pointer;
    }
</style>
