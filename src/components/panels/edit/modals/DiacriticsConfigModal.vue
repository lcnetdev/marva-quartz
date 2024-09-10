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

        showPack: 'macroExpress',


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      // ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),

      
      
      ...mapWritableState(usePreferenceStore, ['showDiacriticConfigModal','diacriticPacks','diacriticUse']),
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

          this.$refs.diacirticContent.style.height = newRect.height + 'px'

        },


        returnExampleChar(macro){
          if (macro.combining){
            let hex = "0x" + macro.unicode
            let char = String.fromCodePoint(parseInt(hex, 16))
            return "◌".concat(char)
          }else{

            let hex = "0x" + macro.unicode
            let char = String.fromCodePoint(parseInt(hex, 16))
            return char

          }
          
        },


         async getLangs(){


          // async function doAsync () {
          await this.configStore.getScriptShifterLanguages()
          for (let k in this.scriptshifterLanguages){
            if (this.scriptShifterOptions[k]){
              if (this.scriptShifterOptions[k].s2r){
                this.scriptshifterLanguages[k].s2r = true
              }
              if (this.scriptShifterOptions[k].r2s){
                this.scriptshifterLanguages[k].r2s = true
              }              
            }
          }


        },

        
        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN') {
            event.stopPropagation()
          }
        },


        updateLocalStorage(event){

          console.log(this.scriptshifterLanguages)


          let current = window.localStorage.getItem('marva-scriptShifterOptions')

          if (current){
            current = JSON.parse(current)
          }else{
            current = {}
          }

          for (let x in this.scriptshifterLanguages){
            if (this.scriptshifterLanguages[x].s2r || this.scriptshifterLanguages[x].r2s ){
              current[x] = this.scriptshifterLanguages[x]
            }else{
              if (current[x]){
                delete current[x]
              }
            }
          }

          window.localStorage.setItem('marva-scriptShifterOptions',JSON.stringify(current))
          this.scriptShifterOptions = JSON.parse(JSON.stringify(current))
        },  


        enabled: function(event,something){

          console.log()


        }

        


    },

    created(){

 

      // this.$nextTick(()=>{

      //   this.getLangs()

      // })

    },

    async mounted() {

     


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
          <div id="diacirtic-content" ref="diacirticContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            
            <div class="menu-buttons">
              <button class="close-button" @pointerup="showDiacriticConfigModal=false">X</button>
            </div>

            <fieldset>
              <legend>Diacritic Packs Available</legend>

              <div style="margin-bottom: 1em;">
                <input type="radio" id="macroExpress" v-model="showPack" name="usePack" value="macroExpress" checked />
                <label for="macroExpress">Voyager Macro Express Shortcuts</label>
                <div style="padding-left: 2em; font-style: italic">This mode mimics Macro Express in voyager. You need to select which macros you want to use.</div>
              </div>

              <div>
                <input type="radio" id="dewey" v-model="showPack" name="usePack" value="voyagerMode" />
                <label for="dewey">Voyager Diacritic Entry Mode Shortcuts</label>
                <div style="padding-left: 2em; font-style: italic;">This mode you press Control+e to put the input into diacritic mode, then press one of the short cuts. It is always activated</div>
              </div>

              
            </fieldset>

            
            

            <template v-if="showPack == 'macroExpress'">
              <table>
                <thead>
                  <th>Enabled</th>
                  <th></th>

                  <th>Key Combo</th>
                  <th>Description</th>
                </thead>
                <tbody>
                  <template v-for="(val,idx) in diacriticPacks.macroExpress">
                    <tr v-for="macro in val">
                      <td><input type="checkbox" :name="idx + '-' + macro.unicode" @change="enabled($event)"></td>
                      <td class="char-example"  v-html="returnExampleChar(macro)"></td>                      
                      <td><span class="char-combo">{{ macro.combo }}</span></td>
                      <td><span v-if="macro.name">{{ macro.name }}</span> <span v-if="macro.nick"> ({{ macro.nick }})</span></td>
                    </tr>
                  </template>
                </tbody>
              </table>

            </template>

            <template v-if="showPack == 'voyagerMode'">
              <table>
                <thead>

                  <th></th>

                  <th>Key Combo</th>
                  <th>Description</th>
                </thead>
                <tbody>

                  <template v-for="(val,idx) in diacriticPacks.voyager">
                    <tr v-for="macro in val">

                      <td class="char-example"  v-html="returnExampleChar(macro)"></td>                      
                      <td><span class="char-combo">{{ macro.combo }}</span></td>
                      <td><span v-if="macro.name">{{ macro.name }}</span> <span v-if="macro.nick"> ({{ macro.nick }})</span></td>
                    </tr>
                  </template>
                </tbody>
              </table>

            </template>

            

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

  .char-example{
    font-size: 3em;
    font-family: Arial, Helvetica, sans-serif;
  }

  .char-combo{
    background-color: whitesmoke;
    font-family: monospace;
    margin-right: 0.5em;
    margin-left: 0.5em;

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
  #diacirtic-content{
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
