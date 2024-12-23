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

    <InstanceSelectionModal ref="instanceSelectionModal" :currentRt="currentRt" :instances="instances" v-model="displayInstanceSelectionModal" @hideInstanceSelectionModal="hideInstanceSelectionModal()" @emitSetInstance="setInstance"/>

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

        <button v-if="isContribComponent()" style="width:100%" class="" :id="`action-button-command-${fieldGuid}-2`" @click="promoteContrib()">
          <span class="button-shortcut-label">2</span>
          De/promote Contributor
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

        <template v-if="['lc:RT:bf2:WorkTitle', 'lc:RT:bf2:InstanceTitle', 'lc:RT:bf2:Title:VarTitle', 'lc:RT:bf2:ParallelTitle'].includes(structure.parentId)">
          <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-4`" @click="sendToOtherProfile()">
            <span class="button-shortcut-label">4</span>
            Send to {{ this.profileStore.returnRtByGUID(this.guid) == "lc:RT:bf2:Monograph:Work" ? "Instance" : (Object.keys(this.profileStore.activeProfile.rt).length > 2 ? "Work/Instance" : "Work") }}
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

        <template v-if="showBuildHubStub()">
              <button style="width:100%" class="" :id="`action-button-command-${fieldGuid}-d`" @click="buildHubStub()">
                Create Hub
              </button>
        </template>

        <template v-if="this.structure.parentId == 'lc:RT:bf2:LCC'">
          <button style="width:100%" :id="`action-button-command-${fieldGuid}-0`" class="" @click="convertLcc2Dewey()">
            <span class="">🤖</span>AutoDewey
          </button>
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

  import AutoDewey from "@/components/panels/edit/modals/AutoDeweyModal.vue";
  import InstanceSelectionModal from "@/components/panels/edit/modals/InstanceSelectionModal.vue";
  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'
  import short from 'short-uuid'


  import { mapStores, mapState, mapWritableState } from 'pinia'

  export default {
    components: {
    AutoDewey,
    InstanceSelectionModal,
  },
    props: {
      type: String,
      guid: String,
      clickmode: Boolean,
      small: Boolean,
      fieldGuid: String,
      structure: Object,
      propertyPath: Array,

    },
    emit: {

    },
    data () {
      return {
        showActionButtonMenu: false,
        showActionButtonMenuTimer: null,

        popperKeyboardShortcutEvent: null,
        popperKeyboardShortcutElement: null,
        isMenuShown:false,
        displayDewey: false,

        lcCall: null,

        displayInstanceSelectionModal: false,
        instances: {},
        targetInstance: null,
        currentRt: null,

      }
    },
    computed: {
      ...mapStores(usePreferenceStore),
      ...mapStores(useProfileStore),
      ...mapState(usePreferenceStore, ['scriptShifterOptions','catInitals']),
      ...mapState(useProfileStore, ['activeProfile']),


      ...mapWritableState(usePreferenceStore, ['debugModalData','showDebugModal']),
      ...mapWritableState(useProfileStore, ['showAutoDeweyModal', 'deweyData']),

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
      hideInstanceSelectionModal: function(){
        this.instances = {}
        this.displayInstanceSelectionModal = false;
      },
      hideDeweyModal:function (){
        this.displayDewey = false
      },

      showBuildHubStub(){
        console.log("this.propertyPath",this.propertyPath)

        if (!this.propertyPath) return false;
        if (this.propertyPath && this.propertyPath.length==0) return false;

        let pt = this.profileStore.returnStructureByComponentGuid(this.guid)
        if (pt && pt.propertyURI && pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/relation"){
          return true
        }
        if (pt && pt.propertyURI && pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/expressionOf"){
          return true
        }



        return false
      },


      buildHubStub(){
        console.log(this.guid)
        let info = this.profileStore.returnLccInfo(this.guid)
        this.profileStore.activeHubStubData = info
        this.profileStore.activeHubStubComponent = {

          type: this.type,
          guid: this.guid,
          fieldGuid: this.fieldGuid,
          structure: this.structure,
          type: this.type,
          propertyPath:this.propertyPath





        }
        this.profileStore.showHubStubCreateModal = true
      },

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
        if (this.structure.parentId.includes("lc:RT:bf2:SeriesHub")){
          return false
        }
        //does this have defaults, or are the defaults higher up?
        let defaults = this.structure.valueConstraint.defaults

        if (defaults.length > 0){
          this.profileStore.insertDefaultValuesComponent(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'],this.structure)
        } else {
          // // look up one level & use the appropriate structure
          let parentStructure = this.profileStore.returnStructureByComponentGuid(this.guid)
          if (parentStructure.valueConstraint && parentStructure.valueConstraint.valueTemplateRefs && parentStructure.valueConstraint.valueTemplateRefs.length>0){
            for (let vRt of parentStructure.valueConstraint.valueTemplateRefs){
              if (this.profileStore.rtLookup[vRt]){
                for (let pt of this.profileStore.rtLookup[vRt].propertyTemplates){
                  if (pt.valueConstraint.defaults && pt.valueConstraint.defaults.length > 0){
                    this.profileStore.insertDefaultValuesComponent(this.profileStore.returnStructureByComponentGuid(this.guid)['@guid'], pt)
                  }
                }
              }
            }
          }
        }
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

        if (parentId.includes("_")){
            parentId = parentId.split("_")[0]
        }

        // try the next level up
        let parentStructure = this.profileStore.returnStructureByComponentGuid(this.guid)
        if (parentStructure.valueConstraint && parentStructure.valueConstraint.valueTemplateRefs && parentStructure.valueConstraint.valueTemplateRefs.length>0){
          for (let vRt of parentStructure.valueConstraint.valueTemplateRefs){
            if (this.profileStore.rtLookup[vRt]){
              if (this.structure.propertyURI == 'http://www.w3.org/2002/07/owl#sameAs'){
                // if its a #sameAs we kind of lose the connection, so select the first one and check
                if (this.profileStore.rtLookup[vRt].propertyTemplates && this.profileStore.rtLookup[vRt].propertyTemplates[0]){
                  if (this.profileStore.rtLookup[vRt].propertyTemplates[0].valueConstraint && this.profileStore.rtLookup[vRt].propertyTemplates[0].valueConstraint.defaults.length > 0){
                    return true
                  }
                }
              }else{
                for (let pt of this.profileStore.rtLookup[vRt].propertyTemplates){
                  if (pt.valueConstraint.defaults && pt.valueConstraint.defaults.length > 0){
                    return true
                  }
                }
              }
            }
          }
        }

        // if (!parentId.endsWith("Work") && !parentId.endsWith("Instance") && !parentId.endsWith("Hub") && !parentId.endsWith("Item")){
        //   for (let sibling of this.profileStore.rtLookup[parentId].propertyTemplates){
        //     if (sibling.valueConstraint.defaults.length > 0){
        //       return true
        //     }
        //   }
        // }

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

      convertLcc2Dewey: function(){
        const parent = this.profileStore.returnStructureByComponentGuid(this.guid)
        let lccn = null
        try{
          const data = parent.userValue["http://id.loc.gov/ontologies/bibframe/classification"][0]
          const classPortion = data["http://id.loc.gov/ontologies/bibframe/classificationPortion"][0]["http://id.loc.gov/ontologies/bibframe/classificationPortion"]
          lccn = classPortion
          try {
            const itemPortion = data["http://id.loc.gov/ontologies/bibframe/itemPortion"][0]["http://id.loc.gov/ontologies/bibframe/itemPortion"]
            lccn += itemPortion
          } catch {}
        } catch(e) {
          // alert("Couldn't generate an LC class number for auto dewey. Make sure all the pieces are present.")
          console.error("AutoDewey Error", e)
        }
        this.lcCall = lccn
        this.deweyData = {
          lcc: lccn,
          guid: this.guid,
          structure: this.structure
        }

        this.showAutoDeweyModal = true
      },

      // Pass the ids of the target instances to `sendToOtherProfile()`
      setInstance: function(data){
        this.targetInstance = data
        this.displayInstanceSelectionModal = false
        this.sendToOtherProfile(data)
      },

      //Send the information in a component between Work and Instances
      // Can be used in either direction.
      sendToOtherProfile: async function(target=null){
        const Rts = Object.keys(this.profileStore.activeProfile.rt)
        let thisRt = this.profileStore.returnRtByGUID(this.guid)
        this.currentRt = thisRt

        //get the structure that will be copied over
        let structure = this.profileStore.returnStructureByComponentGuid(this.guid)

        //Structure that will get the changes and be passed on
        const activeStructure = JSON.parse(JSON.stringify(structure))

        //This works when there is only 1 of each
        let oldRt = thisRt
        let newRt

        if (Rts.length == 2){
          newRt = Rts.filter((rt) => rt != thisRt)
        }

        // this doesn't need to be treated differently for multiple instances
        if (thisRt.includes(":Work")){
          activeStructure.preferenceId = activeStructure.preferenceId.replace(":Work", ":Instance")
        } else {
          activeStructure.preferenceId = activeStructure.preferenceId.replace(":Instance", ":Work")
        }

        if (Rts.length > 2 && target != null && target != "all"){
          newRt = target
        }
        if (Rts.length > 2 && target == "all"){
          newRt = Rts.filter((rt) => rt != thisRt)
        }

        // if there are multiple instance, but no target, get the target and restart
        if (Rts.length > 2 && target == null){
          for (let rt of Rts.filter((r) => r != thisRt)){
            this.instances[rt] = this.activeProfile.rt[rt]
          }
          this.displayInstanceSelectionModal = true
          return
        }

        if (!Array.isArray(newRt)){
          activeStructure.parent = activeStructure.parent.replace(oldRt, newRt)
          activeStructure.parentId = activeStructure.parentId.replace(oldRt, newRt)

          this.profileStore.changeGuid(activeStructure)

          //Moving Instance -> Work, cut out bf:subtitle
          let userValue = activeStructure.userValue
          if (thisRt.includes("lc:RT:bf2:Monograph:Instance")){
            let title = userValue["http://id.loc.gov/ontologies/bibframe/title"][0]
            if (Object.keys(title).includes("http://id.loc.gov/ontologies/bibframe/subtitle")){
              delete title["http://id.loc.gov/ontologies/bibframe/subtitle"]
            }
          }

          //do the change
          this.profileStore.parseActiveInsert(activeStructure, thisRt)
        } else {
          for (let rt of newRt){
            activeStructure.parent = activeStructure.parent.replace(oldRt, rt)
            activeStructure.parentId = activeStructure.parentId.replace(oldRt, rt) // when there's more than 1 instance this is the most important change.

            this.profileStore.changeGuid(activeStructure)

            //Moving Instance -> Work, cut out bf:subtitle
            let userValue = activeStructure.userValue
            if (thisRt.includes("lc:RT:bf2:Monograph:Instance")){
              let title = userValue["http://id.loc.gov/ontologies/bibframe/title"][0]
              if (Object.keys(title).includes("http://id.loc.gov/ontologies/bibframe/subtitle")){
                delete title["http://id.loc.gov/ontologies/bibframe/subtitle"]
              }
            }

            //do the change
            this.profileStore.parseActiveInsert(activeStructure, thisRt, rt)
          }
        }

        //Force XML update
        this.profileStore.dataChanged()
      },


      // show the button for de/promotion
      isContribComponent: function(){
        let parentStructure = this.profileStore.returnStructureByComponentGuid(this.guid)

        return parentStructure.id.includes("_contribution_")
      },

      /**
       * Update the contributor component to pro/demotion
       * @param contribStructure - the structure of the component that will be updated
       * @param contribType - the type of contributor
       */
      updateContrib: function(contribStructure, contribType){
        const primaryId = "id_loc_gov_ontologies_bibframe_contribution__creator_of_work"
        const primaryPrefId = "http://id.loc.gov/ontologies/bibframe/contribution|http://id.loc.gov/ontologies/bibframe/PrimaryContribution"
        const primaryType = "http://id.loc.gov/ontologies/bibframe/PrimaryContribution"
        const primaryLabel = "Creator of Work"
        const contributorId = "id_loc_gov_ontologies_bibframe_contribution__contributors"
        const contributorPrefId = "http://id.loc.gov/ontologies/bibframe/contribution|http://id.loc.gov/ontologies/bibframe/Contribution"
        const contributorType = "http://id.loc.gov/ontologies/bibframe/Contribution"
        const contributorLabel = "Contributors"

        let userValue = contribStructure.userValue
        if (contribType == contributorId){
          contribStructure.id = primaryId
          contribStructure.preferenceId = primaryPrefId
          contribStructure.propertyLabel = primaryLabel
          userValue["http://id.loc.gov/ontologies/bibframe/contribution"][0]["@type"] = primaryType
        } else {
          contribStructure.id = contributorId
          contribStructure.preferenceId = contributorPrefId
          contribStructure.propertyLabel = contributorLabel
          userValue["http://id.loc.gov/ontologies/bibframe/contribution"][0]["@type"] = contributorType
        }

        return contribStructure
      },

      promoteContrib: function(){
        const primaryId = "id_loc_gov_ontologies_bibframe_contribution__creator_of_work"
        const contributorId = "id_loc_gov_ontologies_bibframe_contribution__contributors"

        //get the current active primaryContributor, need to make sure there isn't already one
        let activePrimary
        let contributors = []
        for (let rt in this.activeProfile.rt){
          for (let pt in this.activeProfile.rt[rt].pt){
            if (pt.includes("creator_of_work")){
              const target = this.activeProfile.rt[rt].pt[pt]
              if (!target.deleted){
                activePrimary = target
              }
            }
          }
        }

        //Get a list of current contributors, need to update the contribtor id?
        let structure = this.profileStore.returnStructureByComponentGuid(this.guid)
        let activeStructure =  JSON.parse(JSON.stringify(structure))

        const currentType = activeStructure.id == primaryId ? primaryId : contributorId

        activeStructure["@guid"] = short.generate()
        if (currentType == contributorId){
          //check the active primary, if there is a value, create an alert for the user
          // and swap the two
          if (!this.profileStore.isEmptyComponent(activePrimary)){
            const swap = confirm("There is already a primary contributor. Continuing will swap the two.")
            if (swap){
              let activePrimaryStruct = this.profileStore.returnStructureByComponentGuid(JSON.parse(JSON.stringify(activePrimary))["@guid"])
              activePrimaryStruct = this.updateContrib(JSON.parse(JSON.stringify(activePrimaryStruct)), primaryId)
              this.profileStore.parseActiveInsert(activePrimaryStruct)
              this.profileStore.deleteComponent(activePrimary["@guid"])
            } else {
              return
            }
          }
        }

        //update, insert, and delete
        activeStructure = this.updateContrib(activeStructure, currentType)
        this.profileStore.parseActiveInsert(activeStructure)
        this.profileStore.deleteComponent(this.guid)
      },

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