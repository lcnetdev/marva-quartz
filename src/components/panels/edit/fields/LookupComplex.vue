<template>

  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == true">

    <template v-if="inlineModeShouldDisplay">

      <template v-if="complexLookupValues.length===0">

          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
          <input class="input-inline-mode can-select" @keyup="navKey" v-on:keydown.enter.prevent="submitField" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" @input="textInputEvent($event)" :data-guid="structure['@guid']" :disabled="readOnly" />


      </template>
      <template v-else>

        <template v-for="(avl,idx) in complexLookupValues" class="">
          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>

          <a href="#" class="inline-auth-link" @click="searchValue = avl.label; textInputEvent()">
            <span v-if="avl.type" class="complex-lookup-inline-mode">
              <span class="complex-lookup-inline-mode-icon"><AuthTypeIcon  :small="true" :type="avl.type"/></span>
            </span>
            <span v-if="!avl.needsDereference" style="">{{avl.label}}<span class="uncontrolled" v-if="avl.isLiteral">(uncontrolled)</span><span v-if="!avl.isLiteral" title="Controlled Term" class="" style=""><span class="material-icons check-mark inline-mode-validation-icon">check_circle_outline</span></span></span>
            <span v-else style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class=""><span class="material-icons check-mark inline-mode-validation-icon">check_circle_outline</span></span></span>
          </a>

<!--           <div class="selected-value-container-auth">
            <AuthTypeIcon passClass="complex-lookup-inline" v-if="avl.type" :type="avl.type"/>
          </div>
          <div class="selected-value-container-title">

            <span v-if="!avl.needsDereference" style="padding-right: 0.3em; font-weight: bold">{{avl.label}}<span class="uncontrolled" v-if="avl.isLiteral">(uncontrolled)</span><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style=""></span></span>
            <span v-else style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"><span class="material-icons check-mark">check_circle_outline</span></span></span>
          </div>
          <div class="selected-value-container-action">
            <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
          </div> -->
        <a href="#" @click="removeValue(idx)" style="padding: 0 0 0 2.5px; text-decoration: none; font-size: 1em; cursor: pointer; color: gray;">x</a>

        </template>
        <input class="input-inline-mode can-select" style="width: 20px;" @keyup="navKey" v-on:keydown.enter.prevent="submitField" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" :data-guid="structure['@guid']" @input="textInputEvent($event)" :disabled="readOnly" />

<!--
        <template v-for="lValue in literalValues">
          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
          <span contenteditable="true" class="inline-mode-editable-span" @input="valueChanged" :ref="'input_' + lValue['@guid']" :data-guid="lValue['@guid']">{{lValue.value}}</span>
        </template>
 -->

      </template>


    </template>


  </template>

  <template v-else>
  <!-- <div>Complext Lookup ({{propertyPath.map((x)=>{return x.propertyURI}).join('->')}})</div> -->
      <form autocomplete="off" v-on:submit.prevent >

        <div class="lookup-fake-input" @click="focusClick()">

          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
            <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels') && complexLookupValues.length==0"  class="lookup-fake-input-label">{{structure.propertyLabel}}</div>
          </template>


          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == true">
            <div class="lookup-fake-input-text">
                <div class="bfcode-display-mode-holder">
                  <div class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}</div>
                  <div class="bfcode-display-mode-holder-value">
                    <div class="lookup-fake-input-entities" style="display: inline; padding-left: 5px;">
                      <div v-for="(avl,idx) in complexLookupValues" class="selected-value-container">
                        <div class="selected-value-container-auth">
                          <AuthTypeIcon passClass="complex-lookup-inline" v-if="avl.type" :type="avl.type"/>
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

                    <input style="width:auto" @keyup="navKey" class="can-select" :data-guid="structure['@guid']" v-on:keydown.enter.prevent="submitField" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" @input="textInputEvent($event)" :disabled="readOnly" />
                    <!-- @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)"  -->
                  </div>
                </div>
            </div>
          </template>





          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
            <div class="lookup-fake-input-entities" v-if="marcDeliminatedLCSHMode == false">
              <div v-for="(avl,idx) in complexLookupValues" class="selected-value-container">
                <div class="selected-value-container-auth">
                  <AuthTypeIcon passClass="complex-lookup-inline" v-if="avl.type" :type="avl.type"/>
                </div>
                <div class="selected-value-container-title">
                  <!-- <span class="material-icons check-mark">check_circle_outline</span> -->
                  <span v-if="!avl.needsDereference && !avl.uneditable " style="padding-right: 0.3em; font-weight: bold">
                    <!-- <a v-if="!this.configStore.useSubjectEditor.includes(this.structure.propertyURI)" href="#" @click="openAuthority()" ref="el">{{avl.label}}</a>
                    <span v-else>{{avl.label}}</span> -->
                    <span v-if="avl.source && avl.source=='FAST'" style="font-weight: bold;">(FAST) </span>
                    <a href="#" @click="openAuthority()" ref="el">{{avl.label}}</a>
                    <span class="uncontrolled" v-if="avl.isLiteral">
                      (uncontrolled)
                    </span>
                    <span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style="">
                    </span>
                  </span>
                  <span v-else-if="avl.needsDereference" style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"><span class="material-icons check-mark">check_circle_outline</span></span></span>
                  <span v-else-if="avl.uneditable" style="padding-right: 0.3em; font-weight: bold">{{ avl.label }} (Uneditable)</span>
                </div>
                <div class="selected-value-container-action" v-if="!avl.uneditable">
                  <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
                </div>
              </div>
            </div>

            <div class="lookup-fake-input-text">
                <input   v-on:keydown.enter.prevent="submitField" @keyup="navKey" class="can-select" :data-guid="structure['@guid']" v-model="searchValue" ref="lookupInput" @focusin="focused" type="text" @input="textInputEvent($event)" :disabled="readOnly" />
                <!-- @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)"  -->
            </div>
          </template>

          <Transition name="action">
            <div class="lookup-action" v-if="showActionButton && myGuid == activeField">
              <action-button :type="'lookupComplex'" :id="`action-button-${structure['@guid']}`" :structure="structure" :guid="guid" @action-button-command="actionButtonCommand" />
            </div>
          </Transition>

        </div>


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

  <ComplexLookupModal ref="complexLookupModal" :searchValue="searchValue" :authorityLookup="authorityLookup" @emitComplexValue="setComplexValue" @hideComplexModal="searchValue='';displayModal=false;" :structure="structure" v-model="displayModal"/>
  <SubjectEditor ref="subjectEditorModal" :profileData="profileData" :searchValue="searchValue" :authorityLookup="authorityLookup" :isLiteral="isLiteral"  @subjectAdded="subjectAdded" @hideSubjectModal="hideSubjectModal()" :structure="structure" v-model="displaySubjectModal"/>

</template>




<script>


import ComplexLookupModal from "@/components/panels/edit/modals/ComplexLookupModal.vue";
import SubjectEditor from "@/components/panels/edit/modals/SubjectEditor.vue";

import LabelDereference from "@/components/panels/edit/fields/helpers/LabelDereference.vue";
import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";
import ActionButton from "@/components/panels/edit/fields/helpers/ActionButton.vue";


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
    ActionButton

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

      showActionButton: false,

      profileData: null,
      searchValue: null,
      authorityLookup: null,
      isLiteral: null,

      // when they are just using strings in the itnerface not building a heading don't show the heading as a entity
      marcDeliminatedLCSHMode: false,
      marcDeliminatedLCSHModeSearching: false,
      marcDeliminatedLCSHModeTimeout: null,
      marcDeliminatedLCSHModeResults: []


      // lookups: this.structure.valueConstraint.useValuesFrom,
      // lookupConfig: config.lookupConfig,
      // modeSelect: null,
      // searchValue: "",
      // searchTimeout: null,
      // selectLastIndex: null,
      // initalSearchState: true,
      // selectNavTimeout: null,
      // componentKey: 0,
      // displaySelectedDetails: false,
      // doubleDelete: false,
      // precoordinated: [],
      // displayPreCoordinated: false,

      // displayLabel: null,
      // displayLabelDreferenced: null,
      // displayType: null,
      // displayGuid: null,
      // displayContext: {},

      // editLabelDereferenceKey: Date.now(),

      // contextRequestInProgress: false,
      // validated: false,
      // validationMessage: "",

      // lowResMode:false,

      // displayMini: false,

      // allowHubCreation: false,

      // userData: {},

      // internalAssignID: false,


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


      let values = this.profileStore.returnComplexLookupValueFromProfile(this.guid,this.propertyPath)
      return values

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

    }


  },

  updated: function(){
		//this.profileStore.dataChanged()
		// this.setComplexValue("test") //causes a loop
  },

  created: function(){

    // this.checkForUserData()



    // if (this.structure.propertyURI==='http://id.loc.gov/ontologies/bibframe/Work' || this.structure.propertyURI==='http://id.loc.gov/ontologies/bibframe/expressionOf'){
    //   this.allowHubCreation=true
    // }


  },
  // computed:  mapState({

  //   lookupLibrary: 'lookupLibrary',
  //   activeInput: 'activeInput',
  //   activeProfile: 'activeProfile',
  //   activeProfileMini: 'activeProfileMini',
  //   workingOnMiniProfile: 'workingOnMiniProfile',
  //   settingsDisplayMode: 'settingsDisplayMode',

  //   activeProfileName: 'activeProfileName',
  //   activeComplexSearch: 'activeComplexSearch',
  //   activeComplexSearchInProgress: 'activeComplexSearchInProgress',
  //   settingsLookupsUseTextSubjectEditor:'settingsLookupsUseTextSubjectEditor',
  //   contextData: 'contextData',

  //   undoCounter: 'undoCounter',

  //   assignedId (){
  //     if (this.internalAssignID){
  //       return this.internalAssignID
  //     }else{
  //       this.internalAssignID = uiUtils.assignID(this.structure,this.parentStructure,config)
  //       return this.internalAssignID
  //     }
  //     // return uiUtils.assignID(this.structure,this.parentStructure,config)
  //   },

  //   modalSelectOptions(){

  //     let options = []


  //     // add in the the defaul search ALL of everything possible
  //     //options.push({label: 'All', urls:null, processor:null})
  //     this.structure.valueConstraint.useValuesFrom.forEach((l)=>{
  //       if (this.lookupConfig[l]){
  //         this.lookupConfig[l].modes.forEach((mode)=>{

  //           Object.keys(mode).forEach((k)=>{
  //             options.push({label: k, urls:mode[k].url, processor:this.lookupConfig[l].processor, minCharBeforeSearch: (this.lookupConfig[l].minCharBeforeSearch ? this.lookupConfig[l].minCharBeforeSearch : false), all:mode[k].all })
  //             // mark the first All one we find as the first one
  //             if (!this.modeSelect && mode[k].all){
  //               this.modeSelect = k
  //             }

  //           })
  //         })
  //       }
  //     })

  //     return options
  //   },

  //   modalSelectOptionsLabels(){
  //     return this.modalSelectOptions.map((o)=>{return o.label})
  //   },





  //   // to access local state with `this`, a normal function must be used
  //   lookupVocab (state) {
  //     // let uri = this.structure.valueConstraint.useValuesFrom[0]

  //     // let returnVal = []
  //     // Object.keys(state.lookupLibrary).forEach((s)=>{
  //     //
  //     // })
  //     //
  //     // if (state.lookupLibrary[this.structure.valueConstraint.useValuesFrom[0]]){
  //     //
  //     //   return state.lookupLibrary[this.structure.valueConstraint.useValuesFrom[0]]
  //     // }else{
  //     //   return []
  //     // }

  //     return state.lookupLibrary[this.structure.valueConstraint.useValuesFrom[0]]


  //   }
  // }),


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


    // showComplexModal: function(){
    //   console.log(configStore.useSubjectEditor)
    //   if (configStore.useSubjectEditor.contains(this.structure.propertyURI)){
    //     this.displaySubjectModal=true
    //   }else{
    //     this.displayModal=true
    //   }

    // },

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
      delete contextValue.typeFull
      this.profileStore.setValueComplex(this.guid,null, this.propertyPath, contextValue.uri, contextValue.title, contextValue.typeFull, contextValue.nodeMap)
      this.searchValue=''
      this.displayModal=false

      this.$nextTick(() => {
        window.setTimeout(()=>{
          this.$refs.lookupInput.focus()
        },10)
      })
    },


    // /**
    // * emited from the modal to set the value
    // * @return {object} profile
    // */
    // setComplexSubjectValue: function(contextValue){
    //   delete contextValue.typeFull
    //   this.profileStore.setComplexSubjectValue(this.guid,null, this.propertyPath, contextValue.uri, contextValue.title, contextValue.typeFull)
    //   this.searchValue=''
    //   this.displaySubjectModal=false

    //   this.$nextTick(() => {
    //     window.setTimeout(()=>{
    //       this.$refs.lookupInput.focus()
    //     },10)
    //   })
    // },



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
        // this.displaySubjectModal=true
        // this.$nextTick(() => {
        //   this.$refs.subjectEditorModal.focusInput()
        // })

        // check if it is a string with a lcsh delimiters in it if so skip the modal and just process the heading now









          if (this.searchValue.match(/[$‡|]/)){

            window.clearTimeout(this.marcDeliminatedLCSHModeTimeout)
            this.marcDeliminatedLCSHModeSearching = true
            this.marcDeliminatedLCSHModeResults = {}

            this.marcDeliminatedLCSHModeTimeout = window.setTimeout(async ()=>{

              this.marcDeliminatedLCSHMode = true


              this.marcDeliminatedLCSHModeResults = await utilsNetwork.subjectLinkModeResolveLCSH(this.searchValue)
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
                    marcKey: this.marcDeliminatedLCSHModeResults.hit.marcKey,
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
                      marcKey: v.marcKey,
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
			
            this.displaySubjectModal=true
            this.$nextTick(() => {
              this.$refs.subjectEditorModal.focusInput()
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
      // this.profileStore.setComplexSubjectValue(this.guid,null, this.propertyPath, contextValue.uri, contextValue.title, contextValue.typeFull)


      // this.$store.dispatch("setValueSubject", { self: this, profileComponet: this.profileCompoent, subjectComponents: components, propertyPath: this.propertyPath }).then(() => {
      //   this.componentKey++
      //   this.displayModal = false
      //   this.checkForUserData()
      //   this.$emit('updated', null)

      //   this.validated = false
      //   this.validateHeading()

      //   // put the focus back on the input
      //   setTimeout(()=>{
      //       document.getElementById(this.assignedId).focus()
      //         this.$store.dispatch("enableMacroNav", { self: this})

      //   },0)

      //   this.$store.dispatch("setSubjectList")

      // })

    },

    // Open the authority `panel` for an given authority
    openAuthority: function() {
      let label = this.$refs.el[0].innerHTML
      this.profileData = this.profileStore.returnStructureByGUID(this.guid)

      let sibling = this.$refs.el[0].parentNode.childNodes[2]
      if (sibling.className == "uncontrolled") {
        this.isLiteral = true
      } else {
        this.isLiteral = false
      }

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



.lookup-fake-input-label{

  position: absolute;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-edit-show-field-labels-size')");

  z-index: 1;
  top: -4px;
  left: 2px;
  color: gray;


}

.lookup-action{
  flex-shrink: 1;

}



.lookup-fake-input{
  display: flex;
  background-color: white;
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
  font-size: 0.75em;
  background-color: whitesmoke;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2em;




}
.selected-value-container-nested{
  margin: 0.25em;
  border: solid 1px;
  border-radius: 0.5em;
  padding: 0.35em;
  font-size: 0.75em;
  background-color: whitesmoke;
  white-space: nowrap;
  display: inline;
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
/*
li::before{
  content: '';
}

li{
  padding:0.1em;
}

li span{
  padding:0.1em;
}
input{
  outline: none;
}

.modal-entity-select{
  width: 100%;
  border:none;
  overflow-x: none;
  overflow-y: auto;
  outline:none;

}
.modal-context{
  height: 75%;
  overflow-y: auto;
  padding: 0.5em;
}
.modal-context-add-menu{
  text-align: center;
    width: 100%;
    height: 3em;
    background: white;

}
.modal-context-add-menu button{
  border: none;
  border-radius: 0.5em;
  color: white;
  background-color: #2c3e50;
  font-size: 1.25em;
   padding: 0.3em;
}

.modal-context-build-manual-buttons button{
  font-size: .85em;
  background-color: whitesmoke;
  color: #2c3e50 !important;
  border: solid 1px #2c3e50;
}

.modal-context-data-title{
  font-size: 0.9em;
  font-weight: bold;
}

.modal-context ul{
  margin-top: 0;
  margin-bottom: 0;
}
.modal-context-data-li{
  font-size: 0.85em;
}

.modal-context  h3{
  margin: 0;
  padding: 0;
}

.modal-context-icon{
  font-family: "fontello", Avenir, Helvetica, Arial, sans-serif;
  font-size: 1.25em;
  padding-right: 0.25em;

}
.modal-entity-select option{
  font-family: "fontello", Avenir, Helvetica, Arial, sans-serif;
  font-size: 1.25em;
  white-space: pre-wrap;

}
.selected-value-icon{
  font-family: "validation-icons", "fontello", Avenir, Helvetica, Arial, sans-serif;
  padding-right: 0.3em;
}
.selected-value-container{
  margin: 0.95em;
  border: solid 1px;
  border-radius: 0.5em;
  padding: 0.35em;
  font-size: 0.75em;
  background-color: whitesmoke;
  white-space: nowrap;

}
.selected-value-container-nested{
  margin: 0.25em;
  border: solid 1px;
  border-radius: 0.5em;
  padding: 0.35em;
  font-size: 0.75em;
  background-color: whitesmoke;
  white-space: nowrap;
  display: inline;
  cursor: pointer;
}

.selected-value-details button, a{
  float: right;
  border: none;
  border-radius: 0.5em;
  color: white;
  background-color: #2c3e50 ;
  font-size: 1.25em;
   padding: 0.3em;
}
.selected-value-details-close{
  color: #2c3e50 !important;
  border: none !important;
  background: white !important;
  border: solid 2px #2c3e50 !important;
  margin-left: 0.75em;
}

.selected-value-details-edit{
  color: #2c3e50 !important;
  border: none !important;
  background: white !important;
  border: solid 2px #2c3e50 !important;
  margin-left: 0.75em;

}
.selected-value-details{
    position: relative;
    z-index: 100;
    width: 90%;
    background: white;
    border: solid 1px black;
    margin-top: 0.5em;
    border-radius: 0.5em;
    height: 14em;
    margin-left: 0.2em;
    overflow-y: auto;
-webkit-box-shadow: 10px 10px 15px -5px rgba(0,0,0,0.37);
-moz-box-shadow: 10px 10px 15px -5px rgba(0,0,0,0.37);
box-shadow: 10px 10px 15px -5px rgba(0,0,0,0.37);
  padding: 0.5em;
}
.input-single{
  width: 95%;
  border:none;
  font-size: 1.5em;
  min-height: 2em;
  max-height: 2em;
  background:none;
}
.input-nested{
  width: 95%;
  border: none;
  font-size: 1.5em;
  padding: 0.1em;
  background: none;

}

.complex-lookup-results{
  padding: 0 1em 0 1em;
  height: 73%;
  margin-top: 1.25em;

}

.complex-lookup-result{
  border-bottom: 1px lightgray solid;
  cursor: pointer;
}
.complex-lookup-results-complex{
  height: 75%;
}

.modal-entity-select option[value=""]{

  font-weight: bold;
  font-style: oblique;
}


.fake-real-button{
  height: 4em;
  min-width: 4em;
  background-color: transparent;
  border: none;
  outline: none;
  margin: 0.15em;
}

.modal-switch-values-container{
  width: 70%;
  margin:auto !important;
}
.component-container-fake-input:focus-within {
  border: solid 1px #a6acb7;
  background-color: #dfe5f1;

}
.selected-value-container{
  margin: 0.65em;
  border: solid 1px;
  border-radius: 0.5em;
  padding: 0.35em;
  font-size: 0.85em;
  background-color: whitesmoke;
}
.selected{
  border:solid 4px lightblue;
  border-radius: 5px;
}
.autocomplete-container{
  padding: 0.45em;
  position: absolute;
  z-index: 100;
  background-color: white;
  border-radius: 15px;
  -webkit-box-shadow: 0px 5px 7px -1px rgba(150,150,150,1);
  -moz-box-shadow: 0px 5px 7px -1px rgba(150,150,150,1);
  box-shadow: 0px 5px 7px -1px rgba(150,150,150,1);
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 0 10px;
}
a {
  color: #42b983;
}
form{
  height: 100%;
}*/
</style>
