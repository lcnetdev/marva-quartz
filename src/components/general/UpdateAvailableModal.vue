<script>
  import { useConfigStore } from '@/stores/config'
  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'



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

        initalHeight: 400,
        initalLeft: 400,



      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useConfigStore),
      // // gives read access to this.count and this.double
      ...mapWritableState(useConfigStore, ['showUpdateAvailableModal']),


    },

    watch: {

    },

    methods: {

        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.updateAvailable.style.height = newRect.height + 'px'

        },


        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'P') {
            event.stopPropagation()
          }
        },

        systemType: function(){
        if (navigator.platform.indexOf('Mac') > -1){
          return 'mac'
        }else if (navigator.platform.indexOf('Win') > -1){
          return 'win'
        }else{
          return 'other'
        }


      }







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
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"

    >
        <VueDragResize
          :is-active="true"
          :w="600"
          :h="initalHeight"
          :x="initalLeft"
          class="preference-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="update-content" ref="updateAvailable" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            <div class="menu-buttons">
              <button class="close-button" @pointerup="showUpdateAvailableModal=false">X</button>
            </div>
            

            <h1><span class="material-icons celebration-icon">celebration</span> There is an update available!</h1><br>
            <div v-if="systemType()=='mac'">
            <div>This version of the editor is out of date.</div><div>Please do a hard refresh to use the latest version.</div><br>
            <div>On your keyboard press <strong>Cmd</strong> and <strong>Shift</strong> and the letter <strong>R</strong> </div>

          </div>
          <div v-if="systemType()=='win'">
            <div>This version of the editor is out of date.</div><div>Please do a hard refresh to use the latest version.</div><br>
            <div>On your keyboard press <strong>Ctrl</strong> and <strong>Shift</strong> and the letter <strong>R</strong> </div>

          </div>
          <div v-if="systemType()=='other'">
            <div>This version of the editor is out of date.</div><div>Please do a hard refresh to use the latest version.</div><br>


          </div>


          </div>


        </VueDragResize>
    </VueFinalModal>




</template>

<style scoped>

.celebration-icon{
  font-size: 2.5em;
}

strong{
  font-weight: bold;
}

  h3{
    margin-bottom: 2em;
  }

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
  #update-content{
    overflow: hidden;
    overflow-y: auto;
  }
  .close-button{
    position: absolute;
    right: 5px;
    top: 5px;
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
    z-index: 1000;
  }
  .preference-modal{
    background-color: white;
    -webkit-box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    border-radius: 1em;
    padding:1em;
    border: solid 1px black;
  }


</style>
