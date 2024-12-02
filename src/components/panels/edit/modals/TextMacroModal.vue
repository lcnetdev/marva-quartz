<script>
  import { usePreferenceStore } from '@/stores/preference'
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

        initalHeight: 800,
        initalLeft: 400,

        editMode: false,
        editModeIndex: -1,

        newMacroLookFor: '',
        newMacroReplaceWith: '',

        textMacros: [],

        
      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),

      
      
      ...mapWritableState(usePreferenceStore, ['showTextMacroModal']),
      // ...mapWritableState(useConfigStore, ['scriptshifterLanguages']),



      
      
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

          this.$refs.textMacroContent.style.height = newRect.height + 'px'

        },


       

        
        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD') {
            event.stopPropagation()
          }
        },

        addMacro(){

          this.newMacroLookFor = this.newMacroLookFor.trim()
          this.newMacroReplaceWith = this.newMacroReplaceWith.trim()

          if (this.newMacroLookFor.length==0 || this.newMacroReplaceWith.length==0){
            alert("Look for or Replace With values are empty.")
            return false
          }

          this.textMacros.push({'lookFor':this.newMacroLookFor, 'replaceWith':this.newMacroReplaceWith})

          this.preferenceStore.setValue('--o-diacritics-text-macros',this.textMacros )

          this.newMacroLookFor=''
          this.newMacroReplaceWith=''


          

        },

        deleteMacro(index){
          this.textMacros.splice(index, 1);
          this.preferenceStore.setValue('--o-diacritics-text-macros',this.textMacros )
        },




        editMacro(index){

          this.editMode = true
          this.editModeIndex=index

          this.newMacroLookFor= this.textMacros[index].lookFor
          this.newMacroReplaceWith= this.textMacros[index].replaceWith

        },
        updateMacro(){



          this.textMacros[this.editModeIndex].lookFor = JSON.parse(JSON.stringify(this.newMacroLookFor))
          this.textMacros[this.editModeIndex].replaceWith = JSON.parse(JSON.stringify(this.newMacroReplaceWith))
          
          this.newMacroLookFor= ''
          this.newMacroReplaceWith= ''

          this.editModeIndex=-1

          this.editMode = false
          this.preferenceStore.setValue('--o-diacritics-text-macros',this.textMacros )

        },

        

        


    },


    created(){

       // this.$nextTick(()=>{

      // })

    },

    async mounted() {

      // this.disableVoyagerModeValue = this.preferenceStore.returnValue('--b-diacritics-disable-voyager-mode')


      this.textMacros = this.preferenceStore.returnValue('--o-diacritics-text-macros')

      

      // 

      // console.log("this.enabledMacros",this.enabledMacros)

      // for (let x of this.enabledMacros){
      //   this.enabledChecks[x] = true
      // }


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
          class="debug-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="text-macro-content" ref="textMacroContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            
            <div class="menu-buttons">
              <button class="close-button" @pointerup="showTextMacroModal=false">X</button>
            </div>

            <h3>Add New</h3>
            <div class="add-new-container">
              <div class="add-new-look-for"><input v-model="newMacroLookFor" type="text" placeholder="Look For"></div>
              <div class="add-new-replace-with"><input v-model="newMacroReplaceWith" type="text" placeholder="Replace With"></div>
              
            </div>

            <div v-if="editMode==false" class="add-new-button"><button title="Add Macro" @click="addMacro">Add</button></div>
            <div v-else class="add-new-button">
              <button @click="updateMacro" title="Update Macro">Update</button>
              <button @click="editMode=false; editModeIndex=-1" title="Cancel Update">Cancel</button>
            </div>
            <hr>

            <h3>Existing Macros</h3>

            <div class="no-macros-yet" v-if="textMacros && textMacros.length==0">
              No Text Macros Yet.
            </div>
            <table v-if="textMacros && textMacros.length>0">
              <thead>
                <th>Look For</th>
                <th>Replace With</th>
                <th></th>
              </thead>
              <tbody>
                
                <template v-for="(m,idx) in textMacros">
                  <tr>                    
                    <td class="table-look-for">{{ m.lookFor }}</td>
                    <td class="table-look-for">{{ m.replaceWith }}</td>
                    <td class="table-delete">
                      <button @click="deleteMacro(idx)"><span class="material-icons celebration-icon">delete</span></button>
                      <button @click="editMacro(idx)"><span class="material-icons edit-icon">edit</span></button>
                    </td>

                  </tr>
                </template>



              </tbody>
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

.no-macros-yet{
  padding: 2em;
  font-size: 1.5em;
}
.table-delete{
  text-align: center;
  font-weight: normal;

}
h3{
  font-weight: bold;
}
  table{
    width: 100%;
  }
  .table-look-for{
    font-family: monospace;
    background-color: whitesmoke;
    font-size: 1.25em;
    padding: 2px;
  }
  hr{
    margin-bottom: 1em;
  }

  .add-new-container{
    display: flex;
    margin-bottom: 1em;
  }

  .add-new-button{
    text-align: center;
    padding: 1em;
  }
  .add-new-button button{
    font-size: 1.5em;
  }

  .add-new-container > div{
    flex:1
  }
  .add-new-container input{
    font-size: 1.5em;
    width: 95%;
  }  
  th{
    text-align: left;
    font-weight: bold;

  }
  tr:hover{
    background-color: aliceblue;
  }
  td{
    border-bottom: solid 1px whitesmoke;

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
  #text-macro-content{
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
