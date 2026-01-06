<script>
  import { usePreferenceStore } from '@/stores/preference'
  // import { useConfigStore } from '@/stores/config'
  // import { useProfileStore } from '@/stores/profile'

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'
  import { ColorPicker } from "vue3-colorpicker";
  import "vue3-colorpicker/style.css";

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

        iconColor: '#000000',

        customIcon: '',

        presetIcon: null,
        useAsDefault: false,



      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      // ...mapStores(useConfigStore),
      // ...mapStores(useProfileStore),
      // ...mapState(useConfigStore, ['scriptShifterLangCodes', 'lccFeatureProperties']),

      // ...mapWritableState(useProfileStore, ['activeProfile','showHubStubCreateModal','activeHubStubData','activeHubStubComponent','literalLangInfo', 'savedHubModalData']),

      ...mapWritableState(usePreferenceStore, ['showPanelSizeModal','panelDisplay','panelSizePresets']),





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

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'LABEL' || tagName === 'SELECT' || tagName === 'SPAN' || tagName == 'INPUT' || tagName === 'TD') {
            event.stopPropagation()
          }
        },


        close(){

          this.showPanelSizeModal=false


        },
        add(){

          let panelData = this.preferenceStore.getPanelData()
          if (this.presetIcon == null && (this.customIcon == null || this.customIcon.trim() == '')){
            alert("Please select an icon")
            return
          }
          let useIcon = this.presetIcon
          if (this.customIcon){
            useIcon = this.customIcon
          }

          panelData.icon = useIcon
          panelData.color = this.iconColor
          panelData.default = this.useAsDefault

          this.panelSizePresets.push(panelData)

          this.preferenceStore.setValue('--o-edit-main-splitpane-edit-panel-size-presets',this.panelSizePresets)


        },

        saveViews(){

          this.preferenceStore.setValue('--o-edit-main-splitpane-edit-panel-size-presets',this.panelSizePresets)

        },


    },


    created(){


    },

    async mounted() {




      this.panelSizePresets = this.preferenceStore.returnValue('--o-edit-main-splitpane-edit-panel-size-presets')




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
          <div id="panel-resize-content" ref="panelResizeContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            <div class="menu-buttons">
              <button class="close-button" @pointerup="close">X</button>
            </div>
            <h2>Add Quick View</h2>
          <p style="padding-bottom: 1em;">A new button will be added to the tool bar using the current arrangement and sizing of your panels. Select the icon. </p>
          <div style="display: flex; width: 100%; height: 50px;">
            <div style="flex: 1; border-right: 1px solid #eee; display: flex; flex-direction: column; align-items: center; justify-content: center;">
             <label for="radio1"> <span :style="`color:${iconColor};`" class="material-icons icon icon-size">edit</span></label>
              <input v-model="presetIcon" type="radio" id="radio1" name="panelRadio" value="edit">
            </div>
            <div style="flex: 1; border-right: 1px solid #eee; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <label for="radio2"><span :style="`color:${iconColor};`" class="material-icons icon icon-size">preview</span></label>
              <input v-model="presetIcon" type="radio" id="radio2" name="panelRadio" value="preview">
            </div>
            <div style="flex: 1; border-right: 1px solid #eee; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <label for="radio3"><span :style="`color:${iconColor};`" class="material-icons icon icon-size">code</span></label>
              <input v-model="presetIcon" type="radio" id="radio3" name="panelRadio" value="code">
            </div>
            <div style="flex: 1; border-right: 1px solid #eee; display: flex; flex-direction: column; align-items: center; justify-content: center;">
             <label for="radio4"><span :style="`color:${iconColor};`" class="material-icons icon icon-size">auto_awesome</span></label>
              <input v-model="presetIcon" type="radio" id="radio4" name="panelRadio" value="auto_awesome">
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
             <label for="radio5"> <span :style="`color:${iconColor};`" class="material-icons icon icon-size">mood</span></label>
              <input v-model="presetIcon" type="radio" id="radio5" name="panelRadio" value="mood">
            </div>
            </div>

            <div style="display: flex; width: 100%; height: 50px; align-items: center;">
              <span style="padding-right: 10px;">OR use any <a href="https://marella.github.io/material-icons/demo/#filled" target="_blank">icons from this list</a></span><input type="text" id="icon-input" placeholder="airplanemode_active" v-model="customIcon" @focus="presetIcon=null" @input="presetIcon=null" /><span :style="`color:${iconColor};`" class="material-icons icon">{{ customIcon }}</span>
            </div>
            <div style="display: flex; width: 100%; height: 50px; align-items: center;">
              <color-picker :pureColor="iconColor" :format="'hex8'" @update:pureColor="iconColor = $event" />
              <span>Use icon color</span>
            </div>
            <div style="display: flex; width: 100%; height: 50px; align-items: center;">
              <input type="checkbox" id="use-default" v-model="useAsDefault" style="height: 20px; width: 20px;"  />
              <label for="use-default" style="padding-left: 10px;">Use as default when editor opens a record.</label>
            </div>




            <div style="text-align:center">
              <button @click="add" style="margin-top: 1em; font-size: 1.25em;">Add Button</button>
            </div>

            <hr style="margin:1em 0 1em 0;">
            <h2>Delete Quick View</h2>


            <div v-for="view in panelSizePresets" :key="view.icon" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5em 0; background-color: whitesmoke; margin-top: 0.25em;">
              <div style="display: flex; align-items: center;">
                <span :style="`color:${view.color}; margin-left:0.1em;`" class="material-icons icon icon-size">{{ view.icon }}</span>
                <span style="padding-left: 10px;">{{ view.name }}</span>
              </div>
              <button @click="panelSizePresets.splice(panelSizePresets.indexOf(view), 1); saveViews()" style="background-color: red; color: white; border: none; padding: 0.5em; margin-right: 1em;">Delete</button>

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

  .icon-size{
    font-size: 2.5em;
  }

  label{
    cursor: pointer;
  }

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
