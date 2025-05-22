<script>
  import { usePreferenceStore } from '@/stores/preference'
  // import { useConfigStore } from '@/stores/config'
  // import { useProfileStore } from '@/stores/profile'

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'



  export default {
    components: {
      VueFinalModal,
      VueDragResize
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,

        initalHeight: 700,
        initalLeft: 400,


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      // ...mapStores(usePreferenceStore),
      // ...mapStores(useConfigStore),
      // ...mapStores(useProfileStore),
      // ...mapState(useConfigStore, ['scriptShifterLangCodes', 'lccFeatureProperties']),

      // ...mapWritableState(useProfileStore, ['activeProfile','showHubStubCreateModal','activeHubStubData','activeHubStubComponent','literalLangInfo', 'savedHubModalData']),

      ...mapWritableState(usePreferenceStore, ['showPanelSizeModal']),





    },

    watch: {

      
    },

    methods: {

        dragResize: function(newRect){
          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left          
        },



        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD') {
            event.stopPropagation()
          }
        },

        close(){

          this.showPanelSizeModal=false


        },


    },


    created(){


    },

    async mounted() {



    }
  }



</script>

<template>


    <VueFinalModal
      display-directive="show"
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"

      @beforeClose="checkBeforeClosing"


    >
        <VueDragResize
          :is-active="true"
          :w="850"
          :h="initalHeight"
          :x="initalLeft"
          :y="50"
          class="debug-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="panel-resize-content" ref="panelResizeContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            <div class="menu-buttons">
              <button class="close-button" @pointerup="close">X</button>
            </div>



          </div>


        </VueDragResize>
    </VueFinalModal>




</template>
<style>

  .content-container{

    background-color: white;
  }

</style>

<style scoped>


  #panel-resize-content{
    padding: 1em;

    overflow-y: scroll;

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




</style>
