<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { useProfileStore } from '@/stores/profile'  

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
        top: 200,
        left: 0,

        initalHeight: 400,
        initalLeft: 400,



      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),      
      ...mapStores(useProfileStore),      

      ...mapWritableState(useProfileStore, ['activeProfile','showHubStubCreateModal','activeHubStubData']),

      
      

    },

    watch: {
      // showDebugModal(newVal, oldVal) {
      //   console.log(newVal,oldVal)
      //   // if (newVal === true){
      //   //   this.loadPrefGroup()
      //   // }
      // }
    },

    methods: {
        
        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.nonLatinBulkContent.style.height = newRect.height + 'px'

        },

        xxxxx(){

          // this.profileStore.setBulkLang(nl.ptObj['@guid'],nl.node['@guid'],lang)

        },

      

           

        
        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD') {
            event.stopPropagation()
          }
        },
       


    

    },


    created(){

       // this.$nextTick(()=>{

      // })

    },

    async mounted() {



      // window.setTimeout(()=>{
        
        
      //   this.nonLatinAgents = this.profileStore.returnAllNonLatinAgentOptions()
        

      //   for (let key in this.nonLatinAgents){
        
      //     if (this.nonLatinScriptAgents[key]){
      //       this.localMap[key] = this.nonLatinScriptAgents[key]
      //     }else{
      //       this.localMap[key] = utilsProfile.pickBestNonLatinScriptOption(this.defaultScript, this.nonLatinAgents[key].scripts)   
      //     }

      //   }


      // },100)



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
          <div id="non-latin-bulk-content" ref="nonLatinBulkContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            
            <div class="menu-buttons">
              <button class="close-button" @pointerup="showHubStubCreateModal=false">X</button>
            </div>
            <h3>Create Quick Hub</h3>
            <input type="title" placeholder="Title">

            {{activeHubStubData}}
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


  .checkbox-option{
    width: 20px;
    height: 20px;
  }

  input[type=checkbox]{
    width: 25px;
    height: 25px;
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
  #non-latin-bulk-content{
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

  .disable-voyager-container{
    margin-top: 1em;
    margin-bottom: 1em;
    display: flex;
    align-items: center;
  }


  .disable-voyager-container div{
    flex: 1;
  }
  .disable-voyager-container-check{
    flex: 0 !important;
    padding-right: 1em;
  }



  

</style>
