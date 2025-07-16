<template>

  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == true">

    <template v-if="inlineModeShouldDisplay">


      <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
      <input class="input-inline-mode can-select" @keyup="navKey" v-on:keydown.enter.prevent="submitField" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" @input="textInputEvent($event)" :data-field-guid="guid" :data-guid="structure['@guid']" :disabled="readOnly" />



      <!-- <template v-if="complexLookupValues.length===0">

          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
          <input class="input-inline-mode can-select" @keyup="navKey" v-on:keydown.enter.prevent="submitField" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" @input="textInputEvent($event)" :data-guid="structure['@guid']" :disabled="readOnly" />


      </template>
      <template v-else>

        <template v-for="(avl,idx) in complexLookupValues" class="">
          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>

          <a href="#" class="inline-auth-link" @click="searchValue = avl.label; textInputEvent()">
            <span v-if="avl.type" class="complex-lookup-inline-mode">
              <span v-if="preferenceStore.returnValue('--b-edit-complex-use-value-icons')" class="complex-lookup-inline-mode-icon"><AuthTypeIcon  :small="true" :type="avl.type"/></span>
            </span>
            <span v-if="!avl.needsDereference" style="">{{avl.label}}<span class="uncontrolled" v-if="avl.isLiteral">(uncontrolled)</span><span v-if="!avl.isLiteral" title="Controlled Term" class="" style=""><span class="material-icons check-mark inline-mode-validation-icon">check_circle_outline</span></span></span>
            <span v-else style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class=""><span class="material-icons check-mark inline-mode-validation-icon">check_circle_outline</span></span></span>
          </a>


        <a href="#" @click="removeValue(idx)" style="padding: 0 0 0 2.5px; text-decoration: none; font-size: 1em; cursor: pointer; color: gray;">x</a>

        </template>
        <input class="input-inline-mode can-select" style="width: 20px;" @keyup="navKey" v-on:keydown.enter.prevent="submitField" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" :data-guid="structure['@guid']" @input="textInputEvent($event)" :disabled="readOnly" />


      </template> -->


    </template>


  </template>

  <template v-else>
  <!-- <div>Complext Lookup ({{propertyPath.map((x)=>{return x.propertyURI}).join('->')}})</div> -->
      <form autocomplete="off" v-on:submit.prevent >

        <div class="lookup-fake-input" @click="focusClick()">

          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
            <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels') && complexLookupValues.length==0"  class="lookup-fake-input-label" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold')}">{{structure.propertyLabel}}</div>
          </template>

          <!-- SHORT CODE DISPLAY MODE -->
          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == true">
            <div class="lookup-fake-input-text">
                <div class="bfcode-display-mode-holder">
                  <div class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}</div>
                  <div class="bfcode-display-mode-holder-value">
                    <div class="lookup-fake-input-entities" style="display: inline; padding-left: 5px;">
                      <div v-for="(avl,idx) in complexLookupValues" class="selected-value-container">
                        <div class="selected-value-container-auth">
                          <AuthTypeIcon passClass="complex-lookup-inline" v-if="avl.type && preferenceStore.returnValue('--b-edit-complex-use-value-icons')" " :type="avl.type"/>
                        </div>
                        <div class="selected-value-container-title">
                          <!-- <span class="material-icons check-mark">check_circle_outline</span> -->
                          <span v-if="!avl.needsDereference" style="padding-right: 0.3em; font-weight: bold">{{avl.label}}<span class="uncontrolled" v-if="avl.isLiteral">(uncontrolled)</span><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style=""></span></span>
                          <span v-else style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"><span class="material-icons check-mark">check_circle_outline</span></span></span>
                        </div>
                        <div class="selected-value-container-action">
                          <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
                        </div>
                      </div>
                    </div>

                    <input style="width:auto" @keyup="navKey" class="can-select" :data-field-guid="guid" :data-guid="structure['@guid']" v-on:keydown.enter.prevent="submitField" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" @input="textInputEvent($event)" :disabled="readOnly" />
                    <!-- @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)"  -->
                  </div>
                </div>
            </div>
          </template>




          <!-- NORMAL DISPLAY MODE -->
          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
            <div class="lookup-fake-input-entities" v-if="marcDeliminatedLCSHMode == false">


              <div v-for="(avl,idx) in complexLookupValues" :class="['selected-value-container']">
                <div class="selected-value-container-auth">
                  <AuthTypeIcon passClass="complex-lookup-inline" v-if="avl.type && preferenceStore.returnValue('--b-edit-complex-use-value-icons')"  :type="avl.type"/>
                </div>

                <div class="selected-value-container-title">
                  <span v-if="!avl.needsDereference && !avl.uneditable " style="padding-right: 0.3em; font-weight: bold">
                    <a href="#" :class="['entity-link']" @click="openAuthority()" ref="el">{{avl.label}}</a>
                    <ValidationIcon :value="avl" />
                  </span>
                  <span v-else-if="avl.needsDereference" style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/></span>
                  <span v-else-if="avl.uneditable" style="padding-right: 0.3em; font-weight: bold">{{ avl.label }} (Uneditable)</span>
                </div>
                <div class="selected-value-container-action" v-if="!avl.uneditable">
                  <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
                </div>
              </div>
            </div>

            <div class="lookup-fake-input-text">
              <input   v-on:keydown.enter.prevent="submitField" @keyup="navKey" class="can-select" :data-guid="structure['@guid']" :data-field-guid="guid" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" @input="textInputEvent($event)" :disabled="readOnly" />
                <!-- @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)"  -->
            </div>
          </template>

          <Transition name="action">
            <div class="lookup-action" v-if="showActionButton && myGuid == activeField">
              <action-button :type="'lookupComplex'" :id="`action-button-${structure['@guid']}`" :structure="structure" :guid="guid" :propertyPath="propertyPath" @action-button-command="actionButtonCommand" />
            </div>
          </Transition>

        </div>


        <!-- SUBJECT MODE -->
        <template v-if="configStore.useSubjectEditor.includes(structure.propertyURI)">

          <div class="marc-deliminated-lcsh-mode-container" v-if="marcDeliminatedLCSHModeResults && marcDeliminatedLCSHModeResults.hit && Array.isArray(marcDeliminatedLCSHModeResults.hit)">
            <template v-for="heading in marcDeliminatedLCSHModeResults.hit">
              <span v-if="heading.literal==false" class="marc-deliminated-lcsh-mode-entity"> <span class="material-icons marc-deliminated-lcsh-mode-icon">check_circle</span> <a :href="heading.uri" target="_blank">{{ heading.label }}</a></span>
              <span v-if="heading.literal==true" class="marc-deliminated-lcsh-mode-entity"> <span class="material-icons marc-deliminated-lcsh-mode-icon-warning">warning</span> {{ heading.label }} </span>
            </template>
          </div>

          <div class="marc-deliminated-lcsh-mode-container" v-else-if="marcDeliminatedLCSHModeResults && marcDeliminatedLCSHModeResults.resultType == 'COMPLEX'">
            <span class="marc-deliminated-lcsh-mode-entity"> <span class="material-icons marc-deliminated-lcsh-mode-icon">check_circle</span> <a :href="marcDeliminatedLCSHModeResults.hit.uri" target="_blank">{{ marcDeliminatedLCSHModeResults.hit.label }}</a></span>
          </div>

          <div class="marc-deliminated-lcsh-mode-container" v-else-if="marcDeliminatedLCSHModeResults && marcDeliminatedLCSHModeResults.resultType == 'ERROR'">

            <span v-if="marcDeliminatedLCSHModeResults && marcDeliminatedLCSHModeResults.resultType == 'ERROR'">
                !! Could Not Parse Heading !!
            </span>
          </div>
          <div class="marc-deliminated-lcsh-mode-container" v-else-if="marcDeliminatedLCSHModeSearching == true">

            Searching...

          </div>




        </template>

      </form>


  </template>

  <ComplexLookupModal ref="complexLookupModal" :searchValue="searchValue" :guid="guid" :propertyPath="propertyPath" :authorityLookup="authorityLookup" @emitComplexValue="setComplexValue" @hideComplexModal="searchValue='';displayModal=false;" :structure="structure" v-model="displayModal" :searchType="searchType" />
  <SubjectEditor ref="subjectEditorModal" :fromPaste="fromPaste" :profileData="profileData" :searchValue="searchValue" :authorityLookup="authorityLookup" :isLiteral="isLiteral"  @subjectAdded="subjectAdded" @hideSubjectModal="hideSubjectModal()" :structure="structure" v-model="displaySubjectModal" :searchType="searchType" />
  <!-- <SubjectEditor2 ref="subjectEditorModal2"    :searchValue="searchValue" v-model="displaySubjectModal" @hideSubjectModal="hideSubjectModal()" :searchType="searchType" /> -->

</template>




<script>


import ComplexLookupModal from "@/components/panels/edit/modals/ComplexLookupModal.vue";
import SubjectEditor from  "@/components/panels/edit/modals/SubjectEditor.vue";

import LabelDereference from "@/components/panels/edit/fields/helpers/LabelDereference.vue";
import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";
import ActionButton from "@/components/panels/edit/fields/helpers/ActionButton.vue";
import ValidationIcon from "@/components/panels/edit/fields/helpers/ValidationIcon.vue";


import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'

import { usePreferenceStore } from '@/stores/preference'

import { mapStores, mapState, mapWritableState } from 'pinia'

import utilsMisc from '@/lib/utils_misc'
import utilsNetwork from '@/lib/utils_network'


export default {
  name: "LookupComplex",
  components: {
    ComplexLookupModal,
    SubjectEditor,
    LabelDereference,
    AuthTypeIcon,
    ActionButton,
    ValidationIcon,

    // Keypress: () => import('vue-keypress'),
    // EditSubjectEditor,
    // // EditLabelRemark,
    // EditLabelDereference

  },
  props: {
    structure: Object,
    // parentStructure: Array,
    // profileCompoent: String,
    // parentStructureObj: Object,
    // profileName: String,
    // activeTemplate: Object,
    // parentURI: String,
    // isMini: Boolean,
    // bnodeProperty: String,


    guid: String,
    nested: Boolean,
    propertyPath: Array,
    level: Number,
    readOnly: Boolean
  },
  data: function() {
    return {

      displayModal: false,
      displaySubjectModal: false,
      fromPaste: false,

      showActionButton: false,

      profileData: null,
      searchValue: null,
      authorityLookup: null,
      isLiteral: null,

      // when they are just using strings in the itnerface not building a heading don't show the heading as a entity
      marcDeliminatedLCSHMode: false,
      marcDeliminatedLCSHModeSearching: false,
      marcDeliminatedLCSHModeTimeout: null,
      marcDeliminatedLCSHModeResults: [],

      searchType: "", // the type of search this is



    }
  },

  watch: {

    // // watch when the undoindex changes, means they are undoing redoing, so refresh the
    // // value in the acutal input box
    // undoCounter: function(){
    //     this.checkForUserData()
    // }


  },

  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(useProfileStore),
    ...mapStores(useConfigStore),
    ...mapStores(usePreferenceStore),

    ...mapWritableState(useProfileStore, ['activeField','activeProfile']),



    complexLookupValues(){
      try{
          let values = this.profileStore.returnComplexLookupValueFromProfile(this.guid,this.propertyPath)
          return values
      } catch(err) {
          // this can run into an error when populating an empty complexValue field
          // It mostly doesn't seem to matter, but might as well catch
          console.error("Error getting complex lookup value from profile: ", err)
          return []
      }

    },

    myGuid(){
      return `${this.structure['@guid']}--${this.guid}`
    },
    inlineModeShouldDisplay(){

      return true

      if (this.profileStore.inlinePropertyHasValue(this.guid, this.structure,this.propertyPath)){
        return true
      } else if (this.profileStore.inlineFieldIsToggledForDisplay(this.guid, this.structure)){
        return true

      }else{
        // no value in it, but maybe its the "main" property, so display it anyway
        if (this.profileStore.inlineIsMainProperty(this.guid, this.structure,this.propertyPath)){
          return true
        }
      }

      return false

    },

    cammBehaviorDisplayEntities(){



      if (this.configStore.useSubjectEditor.includes(this.structure.propertyURI)){
        return 'text'
      }
      if (this.structure.propertyURI == "http://id.loc.gov/ontologies/bibframe/contribution"){
        return 'text'
      }
      if (this.structure.propertyURI == "http://www.w3.org/2002/07/owl#sameAs"){
        return 'text'
      }




      if (this.structure.propertyURI == "http://id.loc.gov/ontologies/bibframe/relation"){
        return 'entity'
      }

      return 'entity'
    },




  },
  mounted: async function(){
    if (this.preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')){
      if (this.cammBehaviorDisplayEntities == 'text'){
        if (this.complexLookupValues.length>0){
          this.searchValue = await this.profileStore.returnCammComplexLabel(this.guid, this.complexLookupValues[0])
        }
      }
    }

  },

  created: function(){

    // this.checkForUserData()



    // if (this.structure.propertyURI==='http://id.loc.gov/ontologies/bibframe/Work' || this.structure.propertyURI==='http://id.loc.gov/ontologies/bibframe/expressionOf'){
    //   this.allowHubCreation=true
    // }


  },


  methods:{



    focusClick: function(){
      this.$refs.lookupInput.focus()
    },

    navKey: function(event){


      if (event && event.keyCode == 220 && event.ctrlKey == true){
        let id = `action-button-${event.target.dataset.guid}`
        document.getElementById(id).click()
        // the acutal clickable button might be inside the popper interface at this point
        if (document.getElementById(id).children && document.getElementById(id).children[0]){
          document.getElementById(id).children[0].click()
        }
        return false
      }


      if (event && event.code === 'ArrowUp'){
        utilsMisc.globalNav('up',event.target)
      }
      if (event && event.code === 'ArrowDown'){
        utilsMisc.globalNav('down',event.target)
      }

    },


    actionButtonCommand: function(cmd){
      this.$refs.lookupInput.focus()

    },

    focused: function(){

      // set the state active field
      this.activeField = this.myGuid

      // if enabled show the action button

      if (this.preferenceStore.returnValue('--b-edit-general-action-button-display')){
        this.showActionButton=true
      }else{
        this.showActionButton=false
      }


    },


    /**
    * emited from the modal to set the value
    * @return {object} profile
    */
    setComplexValue: function(contextValue){
      if (contextValue.literal){
        this.profileStore.setValueComplex(
            this.guid,
            null,
            this.propertyPath,
            null,
            contextValue.title,
            null, //contextValue.type,
            {},
            null,
          )
      } else if (Object.keys(contextValue.extra).length == 0){
        // Intended audience mixes simple and complex lookups, so do check
        this.profileStore.setValueSimple(this.guid, null, this.propertyPath, contextValue.uri, contextValue.title[0])
      } else {
        if (contextValue.uri && contextValue.uri.includes('/works/')){
          contextValue.type = 'Work'
          contextValue.typeFull='http://id.loc.gov/ontologies/bibframe/Work'
        } else if (contextValue.uri && contextValue.uri.includes('/hubs/')){
          contextValue.type = 'Hub'
          contextValue.typeFull='http://id.loc.gov/ontologies/bibframe/Hub'
        }

        // if we are adding a hub to a subject field build the component and send it off to the setValueSubject instead
        // you are able to add hubs as complex values in other fields, subject is just a special case we don't want to add it this way
        if (this.propertyPath[0].propertyURI === "http://id.loc.gov/ontologies/bibframe/subject"){
          this.profileStore.setValueSubject(
              this.guid,
              // make a component
              [
                {
                    "label": contextValue.title,
                    "uri": contextValue.uri,
                    "id": 0,
                    "type": contextValue.typeFull,
                    "complex": false,
                    "literal": false,
                    "marcKey": contextValue.extra.marcKeys[0]
                }
              ],
              // fake the path to make the subject as we need it to be
              [
                  {
                      "level": 0,
                      "propertyURI": "http://id.loc.gov/ontologies/bibframe/subject"
                  },
                  {
                      "level": 1,
                      "propertyURI": "http://www.loc.gov/mads/rdf/v1#componentList"
                  },
                  {
                      "level": 2,
                      "propertyURI": "http://www.loc.gov/mads/rdf/v1#Topic"
                  }
              ]
          )
        }else{
          delete contextValue.typeFull

          let type = (contextValue.type && (contextValue.type.includes("Hub") || contextValue.type.includes("Work")) ) ? contextValue.type : contextValue.extra.rdftypes[0]
          if (type == 'Authority'){
            let struct = this.profileStore.returnStructureByGUID(this.guid)
            if (struct.valueConstraint.valueDataType.dataTypeURI){
              type = struct.valueConstraint.valueDataType.dataTypeURI
            }
          }

          this.profileStore.setValueComplex(
            this.guid,
            null,
            this.propertyPath,
            contextValue.uri,
            contextValue.title,
            type,
            contextValue.extra,
            (contextValue.extra && contextValue.extra.marcKeys) ? contextValue.extra.marcKeys[0] : null,
          )
        }
      }
        this.searchValue=''
        this.displayModal=false
        this.$nextTick(() => {
          window.setTimeout(()=>{
            this.$refs.lookupInput.focus()
          },10)
        })
    },




    removeValue: function(){
      this.profileStore.removeValueComplex(this.guid, this.complexLookupValues[0]['@guid'])
    },

    textInputEvent: function(event){
      // remove the existing value if it was deleted
      if (this.$refs.lookupInput.innerHTML.trim() == ""){
        this.authorityLookup = null
      }

      // if there is already a value abort
      if (this.complexLookupValues.length > 0 && this.marcDeliminatedLCSHMode == false){
        this.searchValue = ""
        return false
      }

      if (this.configStore.useSubjectEditor.includes(this.structure.propertyURI)){

          if (this.searchValue.match(/[$‡|]/)){

            window.clearTimeout(this.marcDeliminatedLCSHModeTimeout)
            this.marcDeliminatedLCSHModeSearching = true
            this.marcDeliminatedLCSHModeResults = {}

            this.marcDeliminatedLCSHModeTimeout = window.setTimeout(async ()=>{

              this.marcDeliminatedLCSHMode = true

              //Get the type of search
              try{
                let selection = document.getElementById(this.guid+"-select")
                let selected = selection.options[selection.selectedIndex].value
                this.searchType = selected
              } catch {}

              this.marcDeliminatedLCSHModeResults = await utilsNetwork.subjectLinkModeResolveLCSH(this.searchValue, this.searchType)
              this.marcDeliminatedLCSHModeSearching = false
              let sendResults = []
              if (this.marcDeliminatedLCSHModeResults.resultType != 'ERROR'){
                if (this.marcDeliminatedLCSHModeResults.resultType && this.marcDeliminatedLCSHModeResults.resultType==='COMPLEX'){
                  sendResults.push({
                    complex: true,
                    id: 0,
                    label: this.marcDeliminatedLCSHModeResults.hit.label,
                    literal: false,
                    posEnd: 0,
                    posStart: 0,
                    marcKey: this.marcDeliminatedLCSHModeResults.hit.extra.marcKeys[0],
                    type:  "madsrdf:Topic",
                    uri: this.marcDeliminatedLCSHModeResults.hit.uri
                  })

                }else{
                  for (const [i, v] of this.marcDeliminatedLCSHModeResults.hit.entries()) {
                    sendResults.push({
                      complex: false,
                      id: i,
                      label: v.label,
                      literal: v.literal,
                      posEnd: 0,
                      posStart: 0,
                      marcKey: v.extra.marcKeys ? v.extra.marcKeys[0] : "",
                      type: v.heading.rdfType.replace('http://www.loc.gov/mads/rdf/v1#','madsrdf:'),
                      uri: v.uri
                    })
                  }
                }

                // console.log(this.marcDeliminatedLCSHModeResults)
                this.subjectAdded(sendResults)
                // console.log(sendResults)
              }




            },500)

          }else if (this.searchValue.trim() == ''){

            this.removeValue()
            this.marcDeliminatedLCSHModeResults = {}


          }else{
            // we're opening the subject builder, turn this off
            this.marcDeliminatedLCSHMode = false
            this.marcDeliminatedLCSHModeSearching = false
            this.marcDeliminatedLCSHModeTimeout = null
            this.marcDeliminatedLCSHModeResults = []

            this.authorityLookup = this.searchValue.trim()
            this.searchValue = this.searchValue.trim()

            try{
              let selection = document.getElementById(this.guid+"-select")
              let selected = selection.options[selection.selectedIndex].value
              this.searchType = selected
            } catch {}

            this.fromPaste = event.inputType == 'insertFromPaste' ? true : false
            this.displaySubjectModal=true

            this.$nextTick(() => {
              try {
                this.$refs.subjectEditorModal.focusInput()
              } catch(err) {
              }
            })
          }




      }else{
        this.displayModal=true
      }


    },




    hideSubjectModal: function(){
      this.displaySubjectModal = false;
      if (this.marcDeliminatedLCSHMode==false){
        this.searchValue = ""
      }
      this.$nextTick(() => {
        window.setTimeout(()=>{
          this.$refs.lookupInput.focus()
        },10)
      })
    },



    subjectAdded: function(components){
      this.profileStore.setValueSubject(this.guid,components,this.propertyPath)
      this.hideSubjectModal()


    },

    // Open the authority `panel` for an given authority
    openAuthority: function() {
      //Get the type of search
      try{
        let selection = document.getElementById(this.guid+"-select")
        let selected = selection.options[selection.selectedIndex].value
        this.searchType = selected
      } catch {}

      let label = this.$refs.el[0].innerHTML
      this.profileData = this.profileStore.returnStructureByGUID(this.guid)

      // store the label to pass as a prop
      this.authorityLookup = label
      this.searchValue = label

      if (!this.configStore.useSubjectEditor.includes(this.structure.propertyURI)) {
        this.displayModal = true
      } else {
        // we're opening the subject builder, turn this off
        this.marcDeliminatedLCSHMode = false
        this.marcDeliminatedLCSHModeSearching = false
        this.marcDeliminatedLCSHModeTimeout = null
        this.marcDeliminatedLCSHModeResults = []

        // try {
        //   let selection = document.getElementById(this.guid)
        //   let selected = selection.options[selection.selectedIndex].value
        //   this.searchType = selected
        // } catch{

        // }

        this.displaySubjectModal = true
      }
    },
  }
};
</script>

<style scoped>

.marc-deliminated-lcsh-mode-container{
  background-color: whitesmoke;
  padding: 10px;
  border-left: solid 1px black;
  border-right: solid 1px black;
}
.marc-deliminated-lcsh-mode-icon{
  font-size: 0.9em;
  vertical-align: middle;
  color:green;
}
.marc-deliminated-lcsh-mode-icon-warning{
  color: orange;
    font-size: 1.1em;
    vertical-align: bottom;

}
.marc-deliminated-lcsh-mode-entity{
  background-color: white;
  padding: 3px;
  margin: 1px;
  border-radius: 1em;
  border: dashed lightgray 1px;
  font-family: Helvetica, Arial, sans-serif;
}
.marc-deliminated-lcsh-mode-container a{
  color: inherit !important;
}

.input-inline-mode{
  border: none;
  outline: none;
}

.input-inline-mode:focus-within {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.input-inline-mode:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}


.bfcode-display-mode-holder{
  display: flex;
  align-items: center;
}
.bfcode-display-mode-holder-label{
  flex-shrink: 1;
  max-width: 100px;
  font-family: monospace;
  padding-right: 10px;
  color:gray;
}
.bfcode-display-mode-holder-value{
  flex-grow: 1;
}



.label-bold {
  font-weight: bold;
}
.lookup-fake-input-label{

  position: absolute;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-edit-show-field-labels-size')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-show-field-labels-color')");
  pointer-events: none;
  z-index: 1;
  top: -4px;
  left: 2px;


}

.lookup-action{
  flex-shrink: 1;

}



.lookup-fake-input{
  display: flex;
  background-color: transparent;

  padding: 0.1em;
}

.lookup-fake-input:focus-within{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.lookup-fake-input:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.lookup-fake-input:hover input{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}

.lookup-fake-input-entities{
  flex-shrink: 1;
  padding: 0.1em;
}

.lookup-fake-input-text{
  margin-top: 0.5em;
  flex-grow: 1;
}
.lookup-fake-input-text input{
  width: 100%;
  border: none;
  outline:none;
  background-color: transparent;
}




.selected-value-container{

  border: solid 1px;
  border-radius: 0.5em;
  padding: 0.35em;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-lookup-font-size')");
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-lookup-background-color')");
  border: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-lookup-border-color')");
  color:  v-bind("preferenceStore.returnValue('--c-edit-main-lookup-text-color')");

  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2em;

}
.selected-value-container a{
  color:  v-bind("preferenceStore.returnValue('--c-edit-main-lookup-text-color')") !important;
  text-decoration: none;

}
.selected-value-container a:hover{
  text-decoration: underline;
  cursor: pointer;
}


.selected-value-icon{
/*  font-family: "validation-icons", "fontello", Avenir, Helvetica, Arial, sans-serif;*/
  padding-right: 0.3em;
  margin-left: 5px;
  border-left: 1px solid black;
  padding: 0px 7px;
  font-size: 1em;
}


.inline-mode-validation-icon{
  font-size: 15px;

  display: inline-block;
  height: 15px;
  vertical-align: text-bottom;
  padding-left: 2px;

  color: inherit;
}

.complex-lookup-inline-mode{

  position: relative;
  padding-left: 2px;
  display: inline-block;
  width: 30px;

}

.complex-lookup-inline-mode-icon{
  position: absolute;
  top: -16px;


}

.inline-auth-link{
  color: inherit !important;
  text-decoration: none !important;
}

.inline-auth-link:hover{
  background-color: whitesmoke;
}

.component .lookup-fake-input{
  border-top:solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')") !important;
}

.entity-link {
  text-wrap: wrap;
}

.selected-value-container:has(> .selected-value-container-title > span > .entity-link){
  height: fit-content;
  padding: unset;
}


</style>
