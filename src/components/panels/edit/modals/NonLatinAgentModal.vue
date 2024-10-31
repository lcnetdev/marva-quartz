<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { useProfileStore } from '@/stores/profile'

  import utilsProfile from '@/lib/utils_profile'

  

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

        initalHeight: 700,
        initalLeft: 400,

        selectedScript:"",
        selectedLang:"",

        bulkOptions: [],
        nonLatinAgents:{},

        localMap: {},




      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),      
      ...mapStores(useProfileStore),      

      
      ...mapWritableState(useConfigStore, ['showNonLatinAgentModal']),     
      ...mapWritableState(useProfileStore, ['nonLatinScriptAgents']),     


      

      defaultScript(){

        try{
          return this.profileStore.setMostCommonNonLatinScript()
        }catch{
          return false
        }

      },


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
        bestScript(options){

          if (this.defaultScript){
            return utilsProfile.pickBestNonLatinScriptOption(this.defaultScript, options)  
          }else{
            return null
          }

          

        },

        scriptChange(event){
          //when they change update the profile storage of it
          this.nonLatinScriptAgents[event.target.dataset.key] = this.localMap[event.target.dataset.key]
          this.profileStore.dataChanged()
        }

    

    },


    created(){

       // this.$nextTick(()=>{

      // })

    },

    async mounted() {



      window.setTimeout(()=>{
        console.log(this.profileStore)
        console.log(this.profileStore.returnAllNonLatinLiterals())

        
        this.nonLatinAgents = this.profileStore.returnAllNonLatinAgentOptions()
        console.log(this.nonLatinAgents)

        for (let key in this.nonLatinAgents){
          console.log(key)
          if (this.nonLatinScriptAgents[key]){
            this.localMap[key] = this.nonLatinScriptAgents[key]
          }else{
            this.localMap[key] = utilsProfile.pickBestNonLatinScriptOption(this.defaultScript, this.nonLatinAgents[key].scripts)   
          }

        }


      },1000)



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
          :w="850"
          :h="initalHeight"
          :x="initalLeft"
          class="debug-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="non-latin-bulk-content" ref="nonLatinBulkContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            
            <div class="menu-buttons">
              <button class="close-button" @pointerup="showNonLatinAgentModal=false">X</button>
            </div>

            <div>
              The system will build Access Points using values found in the script: <span style="font-size: 1.25em;"> {{ defaultScript }}</span>
            </div>
            <div style="margin: 1em 0 1em;">
              You can override which script to use to build specific access points below:
            </div>

            <div v-if="Object.keys(nonLatinAgents).length == 0">No Non-Latin Agents/Headings Found.</div>
            
            <div v-for="nlA in nonLatinAgents" class="non-latin-access-point">
              <div>{{ nlA.nonLatin }}</div>
              Use script to build access points:<select @change="scriptChange" :data-key="nlA['@guid']" v-model="localMap[nlA['@guid']]">
                <option v-for="s in nlA.scripts">{{s}}</option>
              </select>
              <div v-if="!bestScript(nlA.scripts)" style="color:red">Could not find the correct script to use for this access point!</div>
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


.non-latin-access-point{
  border: solid 2px lightgray;
  border-radius: 1em;
  padding: 1em;
  margin: 1em 0 1em;
}

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
