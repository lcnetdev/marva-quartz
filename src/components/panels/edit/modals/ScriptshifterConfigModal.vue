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


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),

      
      
      ...mapWritableState(usePreferenceStore, ['showScriptshifterConfigModal','scriptShifterOptions']),
      ...mapWritableState(useConfigStore, ['scriptshifterLanguages']),

      // 

      capitalizeFirstWord: {
      // getter
        get() {
          return this.preferenceStore.returnValue('--b-scriptshifter-capitalize-first-letter')
        },
        // setter
        set(newValue) {
          // Note: we are using destructuring assignment syntax here.
          this.preferenceStore.setValue('--b-scriptshifter-capitalize-first-letter',newValue)
        }
      }

      
      
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

          this.$refs.debugContent.style.height = newRect.height + 'px'

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

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
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
              current[x].name = this.scriptshifterLanguages[x].label
              current[x].label = this.scriptshifterLanguages[x].label
            }else{
              if (current[x]){
                delete current[x]
              }
            }
          }

          window.localStorage.setItem('marva-scriptShifterOptions',JSON.stringify(current))
          this.scriptShifterOptions = JSON.parse(JSON.stringify(current))
        },  

        


    },

    created(){

      // let req = await fetch(this.configStore.returnUrls.scriptshifter + 'languages')
      // let json = await req.json()
      // for (let k in json){

      //   json[k].s2r = false
      //   json[k].r2s = false

      //   if (this.scriptShifterOptions[k]){
      //     if (this.scriptShifterOptions[k].s2r){
      //       json[k].s2r = true
      //     }
      //     if (this.scriptShifterOptions[k].r2s){
      //       json[k].r2s = true
      //     }              
      //   }

      // }

      this.$nextTick(()=>{

        this.getLangs()

      })

    },

    async mounted() {

      // console.log("Mounted")



      

      // let req = await fetch(this.configStore.returnUrls.scriptshifter + 'languages')
      // let json = await req.json()
      // for (let k in json){

      //   json[k].s2r = false
      //   json[k].r2s = false

      //   if (this.scriptShifterOptions[k]){
      //     if (this.scriptShifterOptions[k].s2r){
      //       json[k].s2r = true
      //     }
      //     if (this.scriptShifterOptions[k].r2s){
      //       json[k].r2s = true
      //     }              
      //   }

      // }

      // this.scriptshifterLanguages = json

      // this.$nextTick(()=>{

      //   fetch(this.configStore.returnUrls.scriptshifter + 'languages', { 
      //     method: 'GET'
      //   })
      //   .then((response) => { return response.json(); })
      //   .then((json) => {
          
      //     for (let k in json){

      //       json[k].s2r = false
      //       json[k].r2s = false

      //       if (this.scriptShifterOptions[k]){
      //         if (this.scriptShifterOptions[k].s2r){
      //           json[k].s2r = true
      //         }
      //         if (this.scriptShifterOptions[k].r2s){
      //           json[k].r2s = true
      //         }              
      //       }

      //     }
          
      //     this.scriptshifterLanguages = json

          
          

      //   });


        
     
      // })


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
              <button class="close-button" @pointerup="showScriptshifterConfigModal=false">X</button>
            </div>
            <p>Visit <a href="https://bibframe.org/scriptshifter" target="_blank">bibframe.org/scriptshifter</a> to test these languages.</p>
            
            <hr style="margin-top: 1em; margin-bottom: 1em;">
            <div style="display: flex; align-items: center;">
              <div style="flex: 0;"><input type="checkbox" v-model="capitalizeFirstWord" id="capitalizeFirstWord"></div>
              <div style="flex:1; padding-left: 1em;"><label for="capitalizeFirstWord"> Capitalize first letter of transliteration</label></div>
          


            </div>


            <hr style="margin-top: 1em; margin-bottom: 1em;"/>
            <table>
              <!-- <tr v-for=""></tr> -->
              <thead>
                <th>Name</th>
                <th>Script to Roman</th>
                <th>Roman to Script</th>
              </thead>
            
              <tr  v-for="l in scriptshifterLanguages">
                <td style="width: 66%;">
                  {{ l.label }}
                  <template v-if="l.description">
                    <br/>
                    <span style="font-size: 90%;">{{ l.description }}</span>
                  </template>
                </td>
                <td style="text-align: center;">
                  <input :disabled="l.has_s2r==false" type="checkbox" @change="updateLocalStorage" v-model="l.s2r"/>
                </td>
                <td style="text-align: center;"> 
                  <input :disabled="l.has_r2s==false" type="checkbox" @change="updateLocalStorage" v-model="l.r2s"/>
                </td>              
              </tr>
              <!-- <input type="checkbox" v-model="optionChecks[z']"> -->
            </table>

          </div>


        </VueDragResize>
    </VueFinalModal>




</template>
<style>

  .content-container{
    overflow: hidden
  }

</style>

<style scoped>


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
