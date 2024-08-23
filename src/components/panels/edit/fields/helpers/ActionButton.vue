<template>

<!--   <div>
        <button @mouseover="actionButtonShow" class="action-button"><span class="material-icons action-button-icon">{{preferenceStore.returnValue('--s-edit-general-action-button-icon')}}</span></button>
        <div @mouseout="startHideActionButton" @mousemove="actionButtonShow" ref="actionMenu" v-if="showActionButtonMenu" class="action-button-list-container">
            
            <template v-if="type == 'literal'">
              <a @mouseover.stop="" v-on:click.prevent.stop="actionClick('addNonLatinLiteral')" href="@">Add non-latin literal</a>
            </template>
        </div>
  </div>
 -->

  <VMenu ref="action-button-menu" :triggers="useOpenModes" @show="shortCutPressed" v-model:shown="isMenuShown"  @hide="menuClosed">
    <button tabindex="-1" :id="`action-button-${fieldGuid}`" :class="{'action-button':true,'small-mode': small }"><span class="material-icons action-button-icon">{{preferenceStore.returnValue('--s-edit-general-action-button-icon')}}</span></button>

    <template #popper>

      <div style="width: 250px;">

        <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-1`" @click="duplicateComponent()">
          <span class="button-shortcut-label">1</span>
          Add Another Component
        </button>     
        <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-2`" @click="insertDefaultValues()">
          <span class="button-shortcut-label">2</span>
          Insert Default Values
        </button>     

        <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-3`" @click="deleteComponent()">
          <span class="button-shortcut-label">3</span>
          Delete Component
        </button> 

        <hr>

        <template v-if="type=='literal'">

          <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-5`" @click="$emit('actionButtonCommand', 'addField')">
              <span class="button-shortcut-label">5</span>
              
              Additional Literal
            </button><br>

            <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-6`" @click="$emit('actionButtonCommand', 'setLiteralLang')">
              <span class="button-shortcut-label">6</span>
              Set Language
            </button><br>


            <template v-for="(lang,index) in scriptShifterOptionsForMenu">

                <button   style="width:100%"   class="" :id="`action-button-command-${fieldGuid}-${index + 7}`"  @click="$emit('actionButtonCommand', 'trans', {lang:lang.lang,dir:lang.dir, fieldGuid: fieldGuid} )">
                  <span v-if="index<3" class="button-shortcut-label">{{index + 7}}</span>
                  <span class="material-icons icon" style="font-size:95%; vertical-align: middle; padding-right: 5px;">translate</span><span>{{ lang.name }}</span>
                  
                </button>

                

<!--                 
              <button  v-if="scriptShifterOptions[lang].s2r"  style="width:100%"   class=""  @click="$emit('actionButtonCommand', 'trans', {lang:lang,dir:'s2r', fieldGuid: fieldGuid} )">

                <span class="material-icons icon" style="font-size:95%; vertical-align: middle; padding-right: 5px;">translate</span><span>{{scriptShifterOptions[lang].name}} S2R</span>
              </button>
              <button v-if="scriptShifterOptions[lang].r2s"  style="width:100%" class=""  @click="$emit('actionButtonCommand', 'trans', {lang:lang,dir:'r2s', fieldGuid: fieldGuid} )">
                <span class="material-icons icon" style="font-size:95%; vertical-align: middle; padding-right: 5px;">translate</span><span>{{scriptShifterOptions[lang].name}} R2S</span>
              </button> -->

            </template>




    
            
            <hr>

        </template>


        <template v-if="type=='lookupSimple'">

          
        </template>

        <template v-if="type=='lookupComplex'">


        </template>


        

        <button style="width:100%" :id="`action-button-command-${fieldGuid}-0`" class="" @click="showDebug()">
          <span class="button-shortcut-label">0</span>
          Debug
        </button>        

      </div>
      <!-- 
        <VDropdown
          v-for="n in 5"
          :key="n"
          placement="right-start"
          instant-move
        >
          <button class="rounded hover:bg-green-100 px-4 py-2">
            Sub menu >
          </button>
        </VDropdown> -->


    </template>
  </VMenu>



</template>

<script>

  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'


  import { mapStores, mapState, mapWritableState } from 'pinia'


  export default {
    props: {
      type: String,
      guid: String,
      clickmode: Boolean,
      small: Boolean,
      fieldGuid: String,
      structure: Object

    },
    data () {
      return {
        showActionButtonMenu: false,
        showActionButtonMenuTimer: null,

        popperKeyboardShortcutEvent: null,
        popperKeyboardShortcutElement: null,

        isMenuShown:false,

      }
    },
    computed: {
      ...mapStores(usePreferenceStore),
      ...mapStores(useProfileStore),
      ...mapState(usePreferenceStore, ['scriptShifterOptions']),

      ...mapWritableState(usePreferenceStore, ['debugModalData','showDebugModal']),

      scriptShifterOptionsForMenu(){


        let menuOptions = []
        for (let lang in this.scriptShifterOptions){

          if (this.scriptShifterOptions[lang].s2r){
            menuOptions.push({
              dir:'s2r',
              lang: lang,
              name:this.scriptShifterOptions[lang].name + ' S2R'
            })
          }
          if (this.scriptShifterOptions[lang].r2s){
            menuOptions.push({
              dir:'r2s',
              lang: lang,
              name:this.scriptShifterOptions[lang].name + ' R2S'

            })
          }

        }

        return menuOptions

      },

      useOpenModes(){

        // if (this.clickmode){
        //   return ['click','touch']
        // }else{
        //   return ['hover','focus','click','touch']
        // }
        return ['click','touch']

      },

    },

    methods: {

      shortCutPressed: function(){
        
        
        // start fishing for the popup div
        let popoverDetectTimeout
        popoverDetectTimeout = window.setInterval(()=>{
          if (document.activeElement && document.activeElement.getAttribute('id') && document.activeElement.getAttribute('id').indexOf('popper_')>-1){
            window.clearInterval(popoverDetectTimeout)
            this.popperKeyboardShortcutElement = document.activeElement
            this.popperKeyboardShortcutEvent = this.popperKeyboardShortcutElement.addEventListener('keyup',this.processShortcutKeypress)
          }
        },50)        
      },

      processShortcutKeypress(event){
        
        if (event && event.key && ['0','1','2','3','4','5','6','7','8','9'].indexOf(event.key) > -1){

          let buttonToClick = document.getElementById(`action-button-command-${this.fieldGuid}-${event.key}`)
          if (buttonToClick){
            buttonToClick.click()
            this.isMenuShown=false
            this.sendFocusHome()



          }

        }
      },

      sendFocusHome(){
        // send the focus back to where it came from
        if (document.querySelector(`[data-guid='${this.structure["@guid"]}']`)){
          document.querySelector(`[data-guid='${this.structure["@guid"]}']`).focus()
        }else if (document.querySelector(`[data-guid='${this.fieldGuid}']`)){
          document.querySelector(`[data-guid='${this.fieldGuid}']`).focus()

        }
      },


      menuClosed: function(){        
        if (this.popperKeyboardShortcutElement){
          this.popperKeyboardShortcutElement.removeEventListener('keyup',this.processShortcutKeypress)
        }

        
      },

      showDebug: function() {
        

        this.debugModalData= this.profileStore.returnStructureByComponentGuid(this.guid); 
        this.showDebugModal = true
        this.sendFocusHome()

      },

      duplicateComponent: function(){
        this.profileStore.duplicateComponent(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'])
        this.sendFocusHome()
      },

      insertDefaultValues: function(){
        this.profileStore.insertDefaultValuesComponent(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'],this.structure)
        this.sendFocusHome()
        
      },

      deleteComponent: function(){
        this.profileStore.deleteComponent(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'])
        
      },
    
      

      addComponent: function(){

      },

      // /**
      // * When the mouse moves over the relevant elements open the action menu
      // * if they move again it will clear any close timer
      // * @return {void}
      // */
      // actionButtonShow: function(){
      //   this.showActionButtonMenu=true
      //   window.clearTimeout(this.showActionButtonMenuTimer)
      // },
      // /**
      // * When the mouse moves out of the menu start the time to close it 
      // * @return {void}
      // */
      // startHideActionButton: function(){
      //   this.showActionButtonMenuTimer = window.setTimeout(()=>{
      //     this.showActionButtonMenu=false
      //   },500)
      // },

      // /**
      // * When they click on a command in the list, emit the command and clean up interface
      // * @return {void}
      // */
      // actionClick(cmd){
      //     this.$emit('actionButtonCommand', cmd)
      //     this.showActionButtonMenu=false
      // }

    },
    watch: {

    }
  }
</script>

<style scoped>
  button{
    margin-bottom: 5px;
    position: relative;

  }

  hr{
    margin-top: 0px;
    margin-bottom: 4px;
    height: 1px;
    border: none;
    background-color: white ;

  }

  .button-shortcut-label{
    position: absolute;
    left: 0;
    font-family: monospace;
    background-color:lightgoldenrodyellow;
    border: solid 1px lightslategray;
    padding-left: 2px;
    padding-right: 2px;
  }

  .action-button-icon{
    font-size: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-size')");
    color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-color')");
  }
  .action-button{
      background-color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-background-color')") !important;
      border-width: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-border-width')");
      border-color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-border-color')");
      border-radius: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-border-radius')");
      margin: 1px;
      display: inline-flex;
      align-items: center; 
  }

  .action-button-list-container{
    position: absolute;
    z-index: 1000;
    padding: 1em 0 1em 0;
    width: 250px;
    transform: translateX(-215px);
    border: solid;
    background-color: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-background-color')");
    border-width: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-border-width')");
    border-color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-continer-border-color')");
    border-radius: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-border-radius')");

  }
  .action-button-list-container a{
    text-decoration: none;
    color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-continer-color')") !important;
    font-size: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-font-size')");
    display: block;
    width: 100%;
    padding: 0 1em 0 1em;

  }
  .action-button-list-container a:hover{
    background-color: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-background-highlight-color')");
  }

  .action-enter-active,
  .action-leave-active {
    transition: opacity 0.25s ease;
  }

  .action-enter-from,
  .action-leave-to {
    opacity: 0;
  }

  .small-mode{
    height: 14px;
    background-color: red;
    margin-left: 5px;
  }

</style>