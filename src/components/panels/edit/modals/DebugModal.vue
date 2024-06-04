<script>
  import { usePreferenceStore } from '@/stores/preference'

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'


  import VueJsonPretty from 'vue-json-pretty'
  import 'vue-json-pretty/lib/styles.css';


  export default {
    components: {
      VueFinalModal,
      VueDragResize,
      VueJsonPretty,
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,

        initalHeight: 800,
        initalLeft: 400,

        renderProperties: [],
        rangeValue: {},
        fontValue: {},
        booleanValue: {},

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      // // gives read access to this.count and this.double
      ...mapState(usePreferenceStore, ['debugModalData']),
      ...mapWritableState(usePreferenceStore, ['showDebugModal']),


    },

    watch: {
      showDebugModal(newVal, oldVal) {
        console.log(newVal,oldVal)
        // if (newVal === true){
        //   this.loadPrefGroup()
        // }
      }
    },

    methods: {
        
        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.debugContent.style.height = newRect.height + 'px'

        },


        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },



    },

    mounted() {
      this.$nextTick(()=>{
     
      })

    }
  }



</script>

<template>


    <VueFinalModal
      display-directive="show"
      :hide-overlay="true"
      :overlay-transition="'vfm-fade'"

      
    >
        <VueDragResize
          :is-active="true"
          :w="800"
          :h="initalHeight"
          :x="initalLeft"
          class="debug-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="debug-content" ref="debugContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            <div class="menu-buttons">
              <button class="close-button" @pointerup="showDebugModal=false">X</button>
            </div>

            <vue-json-pretty 
              :path="'res'"
              :highlightMouseoverNode="true"
              :collapsedOnClickBrackets="true"
              :data="debugModalData"      
              >
            </vue-json-pretty>


          </div>


        </VueDragResize>
    </VueFinalModal>




</template>

<style scoped>

 

  .checkbox-option{
    width: 20px;
    height: 20px;
  }

  .option{
    display: flex;
  }
  .option-title{
    flex:2;
  }
  .option-title-header{
    font-weight: bold;
  }
  .option-title-desc{
    font-size: 0.8em;
    color:gray;
  }
  #debug-content{
    overflow: hidden;
    overflow-y: auto;
  }
  .menu-buttons{
    margin-bottom: 2em;
    position: relative;
  }
  .close-button{
    position: absolute;
    right: 5px;
    top: 5px;
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
  }
  .debug-modal{
    background-color: white;
    -webkit-box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27); 
    box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    border-radius: 1em;
    padding:1em;
    border: solid 1px black;
  }


</style>
