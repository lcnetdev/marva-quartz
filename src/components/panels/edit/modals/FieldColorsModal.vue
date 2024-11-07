<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { useProfileStore } from '@/stores/profile'
  import { ColorPicker } from "vue3-colorpicker";
  import "vue3-colorpicker/style.css";


  
  

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'


  export default {
    components: {
      VueFinalModal,
      VueDragResize,
      ColorPicker
      
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,

        initalHeight: 700,
        initalLeft: 400,

        updateCounnter: 0,



      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),      
      ...mapStores(useProfileStore),      

      ...mapState(useProfileStore, ['activeProfile']),

      ...mapWritableState(usePreferenceStore, ['showFieldColorsModal']),     
      

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

        changeColor(color, id, type){

          console.log(color, id, type)

          let colors = this.preferenceStore.returnValue('--o-edit-general-field-colors')

          if (!colors[id]){
            colors[id] ={}
          }
          if (!colors[id][type]){
            colors[id][type] = null
          }

          colors[id][type] = color

          this.preferenceStore.setValue('--o-edit-general-field-colors',colors)
          
        },


        returnColor(id, type){

          
          let colors = this.preferenceStore.returnValue('--o-edit-general-field-colors')

          if (colors[id] && colors[id][type]){ return colors[id][type]}
          
          
          return null

        },
        
        resetColor(id, type){

          
          let colors = this.preferenceStore.returnValue('--o-edit-general-field-colors')
          if (colors[id] && colors[id][type]){
            delete colors[id][type]
          }
          if (Object.keys(colors[id]).length==0){
            delete colors[id]
          }
          console.log(colors)
          this.preferenceStore.setValue('--o-edit-general-field-colors',colors)

          this.updateCounnter++
          return null

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
              <button class="close-button" @pointerup="showFieldColorsModal=false">X</button>
            </div>

            <table style="width: 100%;">
              <template v-for="rt in activeProfile.rtOrder">
                {{ }}
                <tr>
                  <td>{{ rt.split(":").slice(-1)[0]  }}</td>
                  <td>Default Color</td>
                  <td>Data Changed Color</td>
                </tr>
                <tr v-for="pt in activeProfile.rt[rt].pt">
                  <td>{{ pt.propertyLabel }}</td>
                  <td> 
                    <color-picker :key="updateCounnter + '--default-color'" :pureColor="returnColor(pt.preferenceId,'default')" :format="'hex8'" @update:pureColor="changeColor($event,pt.preferenceId,'default')" />
                    <!-- <color-picker :pureColor="'2c3e5023'" :format="'hex8'" @update:pureColor="" /> -->
                    <button alt="Reset Color" title="Reset Color" class="material-icons reset-icon" @click="resetColor(pt.preferenceId,'default')" v-if="returnColor(pt.preferenceId,'default') !== null">
                      restart_alt
                    </button>
                  </td>
                  <td>

                    <color-picker :key="updateCounnter + '--edited-color'" :pureColor="returnColor(pt.preferenceId,'edited')" :format="'hex8'" @update:pureColor="changeColor($event,pt.preferenceId,'edited')" />
                    <!-- <color-picker :pureColor="'2c3e5023'" :format="'hex8'" @update:pureColor="" /> -->
                    <button alt="Reset Color" title="Reset Color" class="material-icons reset-icon" @click="resetColor(pt.preferenceId,'edited')" v-if="returnColor(pt.preferenceId,'edited') !== null">
                      restart_alt
                    </button>

                  </td>
                </tr>

                <tr ><td style="padding: 1em 0 1em 0;" colspan="3"><hr></td></tr>
              </template>
              


            </table>



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

.reset-icon{
  display: inline-block;
  vertical-align: middle;
  background-color: transparent;
  border: none;
  cursor: pointer;
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
