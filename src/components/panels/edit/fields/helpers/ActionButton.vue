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
        <button v-if="hasDefaultValues()" style="width:100%" class="" :id="`action-button-command-${fieldGuid}-2`" @click="insertDefaultValues()">
          <span class="button-shortcut-label">2</span>
          Insert Default Values
        </button>

        <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-3`" @click="deleteComponent()">
          <span class="button-shortcut-label">3</span>
          Delete Component
        </button>

        <template v-if="structure.propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject' || structure.propertyURI == 'http://www.loc.gov/mads/rdf/v1#Topic'">
          <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-4`" @click="makeSubjectHeadingPrimary()">
            <span class="button-shortcut-label">4</span>
            Make Primary Heading
          </button>
        </template>

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
                  <span class="material-icons icon" style="font-size:95%; vertical-align: middle; padding-right: 5px;">translate</span><span>{{ lang.label||lang.name }}</span>

                </button>

            </template>
            <hr>
        </template>
        
        <template v-if="type=='lookupSimple'">


        </template>

        <template v-if="type=='lookupComplex'">
            <!-- template v-if="(structure.propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject' || structure.parent.includes(':Agents:') || structure.parentId.includes(':Form') || structure.propertyURI == 'http://www.loc.gov/mads/rdf/v1#Topic') && showUpDownButtons()[0]" -->
            <template v-if="showUpDownButtons()[0]">
              <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-u`" @click="moveUp()">
                <span class="button-shortcut-label">u</span>
                Move Up
              </button>
            </template>
            
            <!-- <template v-if="(structure.propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject' || structure.parent.includes(':Agents:') || structure.parentId.includes(':Form') || structure.propertyURI == 'http://www.loc.gov/mads/rdf/v1#Topic') && showUpDownButtons()[1]"> -->
            <template v-if="showUpDownButtons()[1]">
              <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-d`" @click="moveDown()">
                <span class="button-shortcut-label">d</span>
                Move Down
              </button>
            </template>
        </template>

        <button style="width:100%" :id="`action-button-command-${fieldGuid}-0`" class="" @click="showDebug()">
          <span class="button-shortcut-label">0</span>
          Debug
        </button>
        <template v-if="this.returnRemark()">
          <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}--`" @click="openRemark()">
            <span class="button-shortcut-label">-</span>
            View Documentation<span class="material-icons action-button-icon">open_in_new</span>
          </button>
        </template>

        <template v-if="catInitals.toLowerCase().indexOf('matt') > -1">
          <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-2`" @click="breakRecord()">
          <span class="button-shortcut-label">2</span>
          💀 Break Record 💀
          </button>
        </template>
        
        <template v-if="preferenceStore.copyMode && showCopyPasteButtons()">
            <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-c`" @click="copyComponent()">
                <span class="button-shortcut-label">c</span>
                Copy<span class="material-icons action-button-icon">content_copy</span>
            </button>
              
            <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-p`" @click="pasteComponent()">
                <span class="button-shortcut-label">p</span>
                Paste<span class="material-icons action-button-icon">content_paste</span>
            </button>
            
            <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-r`" @click="repeatComponent()">
                <span class="button-shortcut-label">r</span>
                Repeat Component<span class="material-icons action-button-icon">repeat</span>
            </button>
        </template>

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
      ...mapState(usePreferenceStore, ['scriptShifterOptions','catInitals']),
      ...mapState(useProfileStore, ['activeProfile']),


      ...mapWritableState(usePreferenceStore, ['debugModalData','showDebugModal']),

      scriptShifterOptionsForMenu(){


        let menuOptions = []
        for (let lang in this.scriptShifterOptions){

          if (this.scriptShifterOptions[lang].s2r){
            menuOptions.push({
              dir:'s2r',
              lang: lang,
              name:this.scriptShifterOptions[lang].label + ' S2R'
            })
          }
          if (this.scriptShifterOptions[lang].r2s){
            menuOptions.push({
              dir:'r2s',
              lang: lang,
              name:this.scriptShifterOptions[lang].label + ' R2S'

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

        if (event && event.key && ['0','1','2','3','4','5','6','7','8','9','-','u','d','c','p','r'].indexOf(event.key) > -1){

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
        this.profileStore.duplicateComponent(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'],this.structure)
        this.sendFocusHome()
      },

      insertDefaultValues: function(){
        this.profileStore.insertDefaultValuesComponent(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'],this.structure)
        this.sendFocusHome()
      },

      breakRecord: function(){
        this.profileStore.breakRecord(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'],this.structure)
        this.sendFocusHome()

      },



      deleteComponent: function(){
        this.profileStore.deleteComponent(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'])

      },
      makeSubjectHeadingPrimary: function(){
        this.profileStore.makeSubjectHeadingPrimary(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'])

      },
      
      moveUp: function(){
        this.profileStore.moveUpDown(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'], "up") 
      },
      moveDown: function(){
        this.profileStore.moveUpDown(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'], "down") 
      },
      
      showUpDownButtons: function(){
        let show = this.profileStore.showUpDownButtons(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'])

        return show
      },

      openRemark(){
        let remark = this.returnRemark()
        if (remark && (remark.indexOf('http://') > -1 || remark.indexOf('https://') > -1)){
          window.open(this.returnRemark(), '_blank').focus()
        }else{
          alert(remark)
        }

      },

      returnRemark: function(){

        // check the lowest level first
        if (this.profileStore.rtLookup[this.structure.parentId] && this.profileStore.rtLookup[this.structure.parentId].propertyTemplates){
          for (let pt of this.profileStore.rtLookup[this.structure.parentId].propertyTemplates){
            if (pt.propertyURI == this.structure.propertyURI && pt.remark){
              return pt.remark
            }
          }
        }

        // try the next level up 
        let parentStructure = this.profileStore.returnStructureByComponentGuid(this.guid)
        if (parentStructure.valueConstraint && parentStructure.valueConstraint.valueTemplateRefs && parentStructure.valueConstraint.valueTemplateRefs.length>0){
          for (let vRt of parentStructure.valueConstraint.valueTemplateRefs){
            if (this.profileStore.rtLookup[vRt]){
              if (this.structure.propertyURI == 'http://www.w3.org/2002/07/owl#sameAs'){
                // if its a #sameAs we kind of lose the connection, so select the first one and check
                if (this.profileStore.rtLookup[vRt].propertyTemplates && this.profileStore.rtLookup[vRt].propertyTemplates[0]){
                  if (this.profileStore.rtLookup[vRt].propertyTemplates[0].remark && this.profileStore.rtLookup[vRt].propertyTemplates[0].remark  != ''){
                    return this.profileStore.rtLookup[vRt].propertyTemplates[0].remark
                  }
                } 
              }else{
                for (let pt of this.profileStore.rtLookup[vRt].propertyTemplates){
                  if (pt.propertyURI == this.structure.propertyURI && pt.remark && pt.remark != ''){
                    return pt.remark
                  }
                }
              }              
            }
          }
        }

        // maybe it is in the parent structure
        if (this.profileStore.rtLookup[parentStructure.parentId] && this.profileStore.rtLookup[parentStructure.parentId].propertyTemplates){
          for (let pt of this.profileStore.rtLookup[parentStructure.parentId].propertyTemplates){
            if (pt.propertyURI == parentStructure.propertyURI && pt.remark){
              return pt.remark
            }
          }
        }
        // if this fails then check to see if there happens to be a remark on the structure
        if (this.structure.remark && this.structure.remark != ''){
          return this.structure.remark
        }

        // no remark
        return false

      },

      hasDefaultValues: function(){
        // if the selected item has defaults
        if (this.structure.valueConstraint.defaults.length > 0){
          return true
        }

        // if it's part of a group with members that have defaults, and that group isn't the whole thing
        let parentId = this.structure.parentId

        if (!parentId.endsWith("Work") && !parentId.endsWith("Instance") && !parentId.endsWith("Hub") && !parentId.endsWith("Item")){
          for (let sibling of this.profileStore.rtLookup[parentId].propertyTemplates){
            if (sibling.valueConstraint.defaults.length > 0){
              return true
            }
          }
        }

        return false
      },




      addComponent: function(){

      },
      
      showCopyPasteButtons: function(){
          let structure = this.profileStore.returnStructureByComponentGuid(this.guid)
          let label = structure.propertyLabel
          
          if (label.includes("Admin")){
              return false
          }
          return true
      },
      
      copyComponent: async function(){
          let structure = this.profileStore.returnStructureByComponentGuid(this.guid)
          let propertyUri = structure.propertyURI
          
          let value = JSON.stringify(structure)
          
          const type = "text/plain"
          const blob = new Blob([value], {type})
          const data = [new ClipboardItem({[type]: blob})]
          
          await navigator.clipboard.write(data)
      },
      
      
      pasteComponent: async function(){
          let structure = this.profileStore.returnStructureByComponentGuid(this.guid)
          
          const clipboardContents = await navigator.clipboard.read();
          
          for (let item of clipboardContents){
              if (!item.types.includes("text/plain")) {
                throw new Error("Clipboard does not contain text data.");
              }
              
              let blob = await item.getType("text/plain")
              const incomingValue = await blob.text()
              const incomingData = JSON.parse(incomingValue)
              
              structure.userValue = incomingData.userValue
              structure.userModified = true
              
              
              this.profileStore.dataChanged()
          }
      },
      
      repeatComponent: async function(){
          await this.copyComponent()
          await this.profileStore.pasteSelected()
          
          this.profileStore.dataChanged()
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