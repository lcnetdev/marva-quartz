<script>
  import { usePreferenceStore } from '@/stores/preference'

  import { mapStores, mapState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'
  import { ColorPicker } from "vue3-colorpicker";
  import "vue3-colorpicker/style.css";



  export default {
    components: {
      VueFinalModal,
      VueDragResize,
      ColorPicker,
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,

        initalHeight: 400,
        initalLeft: 400,

        renderProperties: [],
        rangeValue: {},
        fontValue: {},
        booleanValue: {},
        stringValue: {},

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      // // gives read access to this.count and this.double
      ...mapState(usePreferenceStore, ['showPrefModal','showPrefModalGroup','styleDefault', 'showPrefModalGroup', 'fontFamilies']),

      // array of the pssobile groups from the stlyes
      possilbleGroups() {
        // console.log([...new Set(Object.keys(this.styleDefault).map((v)=>{return this.styleDefault[v].group}))])
        return [...new Set(Object.keys(this.styleDefault).map((v)=>{return this.styleDefault[v].group}))]
      },





    },

    watch: {
      // whenever question changes, this function will run
      showPrefModal(newVal, oldVal) {

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

          this.$refs.preferenceContent.style.height = newRect.height + 'px'

        },


        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },


        colorChange: function(x){

          console.log(x)

        },


        loadPrefGroup: function(event){
          // properties for the OPAC and properties panel where interacting with each other
          // Clear the values s
          this.rangeValue = {}
          this.fontValue = {}
          this.booleanValue = {}
          this.stringValue = {}

          if (event){
            this.preferenceStore.setShowPrefModalGroup(event.target.value)
          }

          this.renderProperties = []
          this.allOptionsCounter++
          console.log(this.renderProperties)



          for (let k in this.styleDefault){
            if (this.styleDefault[k].group == this.showPrefModalGroup){
              let o = Object.assign({},this.styleDefault[k])
              o.id = k

              if (o.type == 'number'){
                this.rangeValue[o.id] = o.value
              }else if (o.type == 'font'){
                this.fontValue[o.id] = o.value
              }else if (o.type == 'boolean'){
                this.booleanValue[o.id] = o.value
              } else if (o.type == 'string'){
                this.stringValue[o.id] = o.value
              }
              this.renderProperties.push(o)
            }
          }
          console.log(this.renderProperties)
          console.log(this.rangeValue)
        },


        changeColor: function(color,id){

          console.log(color,id)

          this.preferenceStore.setValue(id,color)

        },



        rangeValueChange: function(){
          for (let id in this.rangeValue){
            this.preferenceStore.setValue(id,parseFloat(this.rangeValue[id]))
          }
        },
        fontValueChange: function(event){
          for (let id in this.fontValue){
            this.preferenceStore.setValue(id,event.target.value)
          }
          this.fontValue = {}
        },
        booleanValueChange: function(){
          for (let id in this.booleanValue){
            this.preferenceStore.setValue(id,this.booleanValue[id])
          }
        },
        stringValueChange: function(){
          for (let id in this.stringValue){
            this.preferenceStore.setValue(id, this.stringValue[id])
          }
        },








    },

    mounted() {

      this.$nextTick(()=>{
        this.loadPrefGroup()
        this.$nextTick(()=>{
          this.$refs.preferenceContent.style.height = this.initalHeight + 'px'
        })

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
          :w="600"
          :h="initalHeight"
          :x="initalLeft"
          class="preference-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="preference-content" ref="preferenceContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

            <h3>Preferences -   <select @change="loadPrefGroup($event)"><option v-for="group in possilbleGroups" :selected="showPrefModalGroup==group">{{group}}</option></select></h3>
            <button class="close-button" @pointerup="preferenceStore.togglePrefModal()">X</button>

            <div v-for="option in renderProperties" :key="showPrefModalGroup+ '_' +option.id">

              <div class="option">
                <div class="option-title">
                  <div class="option-title-header">{{option.descShort}}</div>
                  <div class="option-title-desc">{{option.desc}}</div>

                  <!-- <div style="font-style: italic; color:orange" v-if="option.id == '--b-edit-main-splitpane-edit-inline-mode'">This mode is disabled right now, we need to fix/improve it.</div> -->

                </div>
                <div class="option-control" >

                    <template v-if="option.type==='color'">

                        <color-picker :pureColor="option.value" :format="'hex8'" @update:pureColor="changeColor($event,option.id)" />

                    </template>
                    <template v-else-if="option.type==='number'">
                        {{rangeValue[option.id]}}
                        <input @input="rangeValueChange" type="range" v-model="rangeValue[option.id]" :min="option.range[0]" :max="option.range[1]" :step="option.step" />

                    </template>
                    <template v-else-if="option.type==='font'">

                        <select @input="fontValueChange($event)" v-model="fontValue[option.id]" >
                          <option v-for="font in fontFamilies" :selected="(font==option.value)">{{font}}</option>
                        </select>
                    </template>
                    <template v-else-if="option.type==='boolean'">
                      <input type="checkbox" class="checkbox-option" @change="booleanValueChange"  v-model="booleanValue[option.id]">
                    </template>
                    <template v-else-if="option.type==='string'">
                      <input type="text" @input="stringValueChange" v-model="stringValue[option.id]">
                    </template>





                </div>
              </div>



            </div>
<!--

              <input type="range" max="100" min="0.5" step="0.1" >
           -->



          </div>


        </VueDragResize>
    </VueFinalModal>




</template>

<style scoped>

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
  #preference-content{
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
