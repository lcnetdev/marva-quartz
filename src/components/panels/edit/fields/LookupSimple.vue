<template>

  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == true">

    <template v-if="inlineModeShouldDisplay">
      
      <template v-if="simpleLookupValues.length===0">
          
          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
          <input v-model="activeValue" class="inline-lookup-input can-select" ref="lookupInput" @focusin="focused" @blur="blur" type="text" @keydown="keyDownEvent($event, true)" @keyup="keyUpEvent($event)" />


      </template>
      <template v-else>


          <template v-for="(avl,idx) in simpleLookupValues" >
              <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>


              
              
              <span v-if="!avl.needsDereference" style="">
                <!-- <span class="material-icons icon inline-icon">playlist_add_check</span> -->
                {{avl.label}}
                <span class="uncontrolled" v-if="avl.isLiteral"> (uncontrolled)</span></span>
              <!-- <span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style=""><span class="material-icons check-mark">check_circle_outline</span></span></span> -->
              
              <span v-else style=""><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"><span class="material-icons check-mark">check_circle_outline</span></span></span>

              <a href="#" class="inline-remove-x" @click="removeValue(idx)" style="">x</a>
          </template>


      </template>


    </template>


        <!-- 
    <template v-if="inlineModeShouldDisplay">
      
      {{structure}}
      {{guid}}

    </template>
     -->



  </template>

  <template v-else>


      <form autocomplete="off" @submit.prevent="null" >

        <div class="lookup-fake-input" @click="focusClick()">

          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
            <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels') && simpleLookupValues.length==0"  class="lookup-fake-input-label">{{structure.propertyLabel}}</div>
          </template>



          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == true">

            <div class="bfcode-display-mode-holder">
              <div class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}</div>
              <div class="bfcode-display-mode-holder-value">
                  
                <div class="lookup-fake-input-entities" style="display:inline-block;">
                  <div v-for="(avl,idx) in simpleLookupValues" class="selected-value-container">
                      <span v-if="!avl.needsDereference" style="padding-right: 0.3em; font-weight: bold">{{avl.label}}<span class="uncontrolled" v-if="avl.isLiteral">(uncontrolled)</span><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style=""><span class="material-icons check-mark">check_circle_outline</span></span></span>
                      
                      <span v-else style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"><span class="material-icons check-mark">check_circle_outline</span></span></span>

                      <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
                  </div>
                </div>
                <div class="lookup-fake-input-text" style="display: inline-block;">
                  <input v-model="activeValue" class="can-select" ref="lookupInput" @blur="blur" @focusin="focused" type="text" @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)" />
                </div>   

              </div>
            </div>

          </template>

          <template v-else>
          
            <div class="lookup-fake-input-entities">
              <div v-for="(avl,idx) in simpleLookupValues" class="selected-value-container">
                  <span v-if="!avl.needsDereference" style="padding-right: 0.3em; font-weight: bold">{{avl.label}}<span class="uncontrolled" v-if="avl.isLiteral">(uncontrolled)</span><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style=""><span class="material-icons check-mark">check_circle_outline</span></span></span>
                  
                  <span v-else style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"><span class="material-icons check-mark">check_circle_outline</span></span></span>

                  <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
              </div>
            </div>
            <div class="lookup-fake-input-text">
              <input v-model="activeValue" class="can-select" ref="lookupInput" @blur="blur" @focusin="focused" type="text" @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)" />
            </div>     


          </template>







          <Transition name="action">
            <div class="lookup-action" v-if="showActionButton && myGuid == activeField">
              <action-button :type="'lookupSimple'" :guid="guid" @action-button-command="actionButtonCommand" />
            </div>
          </Transition>



          

        </div>

      </form>

  </template>
    <div v-if="displayAutocomplete==true" ref="selectlist" class="autocomplete-container">
      <ul>
        <li v-for="(item, idx) in displayList" :data-idx="idx" v-bind:key="idx" @click="clickAdd(item)">
            <span v-if="item==activeSelect"  :data-idx="idx" class="selected">{{item}}</span>
            <span v-else  :data-idx="idx">{{item}}</span>
        </li>
      </ul>
    </div>


</template>

<script>

/*

  <!-- <div>Simple Lookup ({{propertyPath.map((x)=>{return x.propertyURI}).join('->')}})</div> -->


  <div v-if="nested == false" :class="'component-container' + ' component-container-' + settingsDisplayMode">

    <div :class="'component-container-title' + ' component-container-title-' + settingsDisplayMode ">{{structure.propertyLabel}}</div>
    <div :class="'component-container-input-container' + ' component-container-input-container-' + settingsDisplayMode">



        <div class="component-container-fake-input no-upper-right-border-radius no-lower-right-border-radius no-upper-border temp-icon-search">          
          <form autocomplete="off" v-on:submit.prevent>

                <div style="position: absolute; left: 13px;" v-if="settingsDisplayMode=='compact'" class="component-nested-container-title">
                  <span>{{structure.propertyLabel}}<EditLabelRemark :remark="structure.remark" /></span>                  
                </div>


            <div style=" display: flex; height: 100%">
            <!-- <input autocomplete="off" v-bind:value="activeSelect"  type="text" disabled style="width: 95%; border:none; height: 90%; font-size: 1.5em; padding: 0.1em; position: relative; background: none; color: lightgray"> -->
              
              <div v-for="(avl,idx) in activeLookupValue" ref="added-value" :key="idx" class="selected-value-container">
                  
                  <span v-if="!avl['http://www.w3.org/2000/01/rdf-schema#label'].startsWith('http')" style="padding-right: 0.3em; font-weight: bold">{{avl['http://www.w3.org/2000/01/rdf-schema#label']}}<span class="uncontrolled" v-if="!avl.uri">(uncontrolled)</span><span v-if="avl.uri" title="Controlled Term" class="selected-value-icon" style="margin-left: 5px; border-left: 1px solid black; padding: 0px 5px; font-size: 1em;"></span></span>
                  <span v-else style="padding-right: 0.3em; font-weight: bold"><EditLabelDereference :URI="avl['http://www.w3.org/2000/01/rdf-schema#label']"/><span v-if="avl.uri" title="Controlled Term" class="selected-value-icon" style="margin-left: 5px; border-left: 1px solid black; padding: 0px 5px; font-size: 1em;"></span></span>

                  <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
              </div>
              <input bfeType="EditSimpleLookupComponent-unnested" ref="lookupInput"  :id="assignedId" autocomplete="off" v-on:blur="blur" v-bind:value="activeValue"  type="text" @focus="autoFocus($event)" @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)" :class="['input-single',{'selectable-input': (isMini==false), 'selectable-input-mini':(isMini==true)}]">
            </div>
          </form>
        </div>
      <div v-if="displayAutocomplete==true" class="autocomplete-container">
        <ul>
          <li v-for="(item, idx) in displayList" :data-idx="idx" v-bind:key="idx" @click="clickAdd">
              <span v-if="item==activeSelect" :data-idx="idx" class="selected">{{item}}</span>
              <span v-else :data-idx="idx">{{item}}</span>
          </li>
        </ul>
      </div>
    </div>


  </div>


  <div v-else style="position: relative;">


      <div  v-bind:class="['component-container-fake-input no-upper-right-border-radius no-lower-right-border-radius no-upper-border temp-icon-search']" :style="{'background-color': (structure.dynamic) ? 'auto' : 'auto' }">          
        <form autocomplete="off" v-on:submit.prevent style="">
          <div style="">
          <!-- <input autocomplete="off" v-bind:value="activeSelect"  type="text" disabled style="width: 95%; border:none; height: 90%; font-size: 1.5em; padding: 0.1em; position: relative; background: none; color: lightgray"> -->
            <div class="component-nested-container-title component-nested-container-title-simple-lookup" >
              <span v-if="settingsDisplayMode=='compact'">{{parentStructureObj.propertyLabel}} -- </span>

              <span>{{structure.propertyLabel}}</span>

            </div>            


            <div style="display: flex">
              <div v-for="(avl,idx) in activeLookupValue" ref="added-value" :key="idx" class="selected-value-container-nested">
                  


                  <span v-if="!avl['http://www.w3.org/2000/01/rdf-schema#label'].startsWith('http')" style="padding-right: 0.3em; font-weight: bold">{{avl['http://www.w3.org/2000/01/rdf-schema#label']}}<span class="uncontrolled" v-if="!avl.uri">(uncontrolled)</span><span v-if="avl.uri" title="Controlled Term" class="selected-value-icon" style="margin-left: 5px; border-left: 1px solid black; padding: 0px 5px; font-size: 1em;"></span></span>
                  <span v-else style="padding-right: 0.3em; font-weight: bold"><EditLabelDereference :URI="avl['http://www.w3.org/2000/01/rdf-schema#label']"/><span v-if="avl.uri" title="Controlled Term" class="selected-value-icon" style="margin-left: 5px; border-left: 1px solid black; padding: 0px 5px; font-size: 1em;"></span></span>


                  <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>


              </div>




              <input bfeType="EditSimpleLookupComponent-nested" ref="lookupInput"  :id="assignedId" autocomplete="off" v-on:blur="blur" v-bind:value="activeValue"  type="text" @focus="autoFocus($event)" @keydown="keyDownEvent($event)"  @keyup="keyUpEvent($event)"  :class="['input-nested', {'selectable-input': (isMini==false), 'selectable-input-mini':(isMini==true)}]">
            </div>              

          </div>
          

        </form>
      </div>
    <div v-if="displayAutocomplete==true" class="autocomplete-container">
      <ul>
        <li v-for="(item, idx) in displayList" :data-idx="idx" v-bind:key="idx" @click="clickAdd">
            <span v-if="item==activeSelect" :data-idx="idx" class="selected">{{item}}</span>
            <span v-else :data-idx="idx">{{item}}</span>
        </li>
      </ul>
    </div>



  </div>
*/


// import { mapState } from 'vuex'
// import uiUtils from "@/lib/uiUtils"
// import EditLabelDereference from "@/components/EditLabelDereference.vue";
// import EditLabelRemark from "@/components/EditLabelRemark.vue";

import ActionButton from "@/components/panels/edit/fields/helpers/ActionButton.vue";
import LabelDereference from "@/components/panels/edit/fields/helpers/LabelDereference.vue";

import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'

import { mapStores, mapState, mapWritableState } from 'pinia'

import utilsNetwork from '@/lib/utils_network';

import utilsMisc from '@/lib/utils_misc'


export default {
  name: "LookupSimple",
  props: {
    structure: Object,
    level: Number,
    nested: Boolean,
    propertyPath: Array,
    guid: String,

    // parentStructure: Array,
    // isMini: Boolean,
    // profileName: String,
    // activeTemplate: Object,
    // parentStructureObj: Object,
    // profileCompoent: String,
    // bnodeProperty: String,

  },
  components: {    
    ActionButton,
    LabelDereference,
    // EditLabelRemark
  }, 



  data: function() {
    return {

      showActionButton: false,
      
      // helps populate the autocomplete list
      displayAutocomplete: false,
      displayList: [],
      activeSelect: '', 
      activeKeyword: false,           
      uri: this.structure.valueConstraint.useValuesFrom[0],
      useValuesFrom: this.structure.valueConstraint.useValuesFrom,
      debounceTimeout: null,

      doubleDelete: false,

      // activeLookupValue: [],

      // stores the guid to the place to add more if there is already a value
      

      // displayAutocomplete: false,
      // 
      // 
      // activeFilter: '',
      // 
      activeValue: '',


      // 
      // internalAssignID:false,

    }
  },

  // watch: {

  // },



  created: function(){

   
    // this.refreshInputDisplay()    

    // console.log("this.structure.valueConstraint.useValuesFrom[0]",this.structure.valueConstraint.useValuesFrom[0])


  },

  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(useProfileStore),
    ...mapStores(usePreferenceStore),

    ...mapWritableState(useProfileStore, ['activeField','activeProfile']),
   
    simpleLookupValues(){

      // profileStore.setActiveField()
      let values = this.profileStore.returnSimpleLookupValueFromProfile(this.guid,this.propertyPath)
      return values

    }, 

    // if there is already a value we just need one of them so we can find its parent to put new ones into
    existingGuid(){
      let values = this.profileStore.returnSimpleLookupValueFromProfile(this.guid,this.propertyPath)
      if (values && values[0] && values[0]['@guid']){
        return values[0]['@guid']
      }
      return null
    },

    myGuid(){
      return `${this.structure['@guid']}--${this.guid}`
    },

    inlineModeShouldDisplay(){


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




  // computed: mapState({
  //   lookupLibrary: 'lookupLibrary',
  //   activeInput: 'activeInput',
  //   activeProfile: 'activeProfile',
  //   activeProfileMini: 'activeProfileMini',
  //   workingOnMiniProfile: 'workingOnMiniProfile',
  //   settingsDisplayMode: 'settingsDisplayMode',
  //   undoCounter: 'undoCounter',

  //   assignedId (){
  //     // return uiUtils.assignID(this.structure,this.parentStructure)
  //     if (this.internalAssignID){
  //       return this.internalAssignID
  //     }else{
  //       this.internalAssignID = uiUtils.assignID(this.structure,this.parentStructure)
  //       return this.internalAssignID
  //     }     

  //   },  
  //   // to access local state with `this`, a normal function must be used
  //   lookupVocab (state) {
  //     // let uri = this.structure.valueConstraint.useValuesFrom[0]

  //     // let returnVal = []
  //     // Object.keys(state.lookupLibrary).forEach((s)=>{
      
  //     // })
      
  //     // if (state.lookupLibrary[this.structure.valueConstraint.useValuesFrom[0]]){
      
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

    blur: function(){

      // when we blur they may be clicking a value in the list
      // so wait a bit before we close to register the click event
      window.setTimeout(()=>{
        this.displayAutocomplete = false
      },250)
      
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
      this.uri = this.structure.valueConstraint.useValuesFrom[0]
      utilsNetwork.loadSimpleLookup(this.uri)


    },

    actionButtonCommand: function(cmd){
      this.$refs.input.focus()
      console.log(this.$refs.input)
    },

    // Takes the list of values from this lookup uri and filters it based on the input
  
    filter: async function(recursive){

      this.displayList = []
      this.activeSelect = ''
      this.activeKeyword = false
      // console.log("this.activeFilter",this.activeFilter)
      
      let addKeyword = ''
      if (recursive){
        addKeyword = 'KEYWORD'
        this.activeKeyword = true
      }
      console.log(`"${addKeyword}"`)
      console.log(this.uri)
      console.log(utilsNetwork.lookupLibrary)
      console.log(utilsNetwork.lookupLibrary[this.uri+addKeyword])

      

      if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
        this.displayList.push("Loading Data.")
        // if the data isn't loaded yet we will wait a few times 
        await new Promise(r => setTimeout(r, 1000));
        this.displayList=[]
        console.log(utilsNetwork.lookupLibrary,this.uri+addKeyword)
        if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
          this.displayList.push("Loading Data..")
          await new Promise(r => setTimeout(r, 1000));
          this.displayList=[]

          console.log(utilsNetwork.lookupLibrary,this.uri+addKeyword)
          if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
            this.displayList.push("Loading Data...")
            await new Promise(r => setTimeout(r, 1000));
            this.displayList=[]
            console.log(utilsNetwork.lookupLibrary,this.uri+addKeyword)
            if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
              this.displayList.push("Loading Data....")
              await new Promise(r => setTimeout(r, 1000));
              this.displayList=[]
              console.log(utilsNetwork.lookupLibrary,this.uri+addKeyword)
              if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
                this.activeValue="🙀ERROR WITH LOOKUP"

                
              }

            }
          }

        }
        
      }
      Object.keys(utilsNetwork.lookupLibrary[this.uri+addKeyword]).forEach((v)=>{
        console.log(v)
        // the list has a special key metdata that contains more info
        if (v==='metadata'){return false}
        // no filter yet show first 25
        if (this.activeFilter.trim()===''){
          utilsNetwork.lookupLibrary[this.uri+addKeyword][v].forEach((x)=>{

            // if (this.displayList.length<=25){
              if (this.displayList.indexOf(x)==-1){
                this.displayList.push(x)  
              }
            // }
          })          
        }else{

          // loop through each one, each is a array, so each element of array
          utilsNetwork.lookupLibrary[this.uri+addKeyword][v].forEach((x)=>{
            
            // simple includes value check
            if (x.toLowerCase().startsWith(this.activeFilter.toLowerCase())){
                if (this.displayList.indexOf(x)==-1){
                  this.displayList.push(x)    
                }
            }       

            if (x.toLowerCase().includes(' (' +this.activeFilter.toLowerCase())){
                if (this.displayList.indexOf(x)==-1){
                  this.displayList.push(x)    
                }
            }  



          })
        }


      })
      console.log("this.activeFilter",this.activeFilter)
      // sometimes you'll find code hacks circumvents ontology
      this.displayList = this.displayList.filter((v)=>{ return (v === 'Englisch (eng)') ? false : true})

      console.log("this.displayList",this.displayList)

      this.displayList.sort()

      
      // take the first hit and make it the autocomplete text
      if (this.displayList.length>0 && this.activeFilter.length>0){
        this.activeSelect = this.displayList[0]
        this.displayAutocomplete = true
      }
      if (this.displayList.length==0){
        

        if (!recursive){



          if (this.uri.includes('id.loc.gov/vocabulary/')){

            if (this.activeFilter.length>3){

              this.displayList.push('Searching...')

              window.clearTimeout(this.debounceTimeout)
              this.debounceTimeout = window.setTimeout(async ()=>{
                // kick off antoher search, then do the filter again
                await utilsNetwork.loadSimpleLookupKeyword(this.structure.valueConstraint.useValuesFrom, this.activeFilter)
                this.filter(true)
              },500)
            }else{
              this.displayList.push('No local match, enter more of the search term')
            }            
          }

        }else{
          this.displayList.push('No Match - Press [Enter] to add uncontrolled value')
        }
                
        this.displayAutocomplete = true
      }
      if (this.activeFilter.length==0){
        this.displayAutocomplete = true
      }
      console.log(this.displayAutocomplete)
      if (this.displayAutocomplete){        
        // this.$store.dispatch("disableMacroNav")
      }else{
        // this.$store.dispatch("enableMacroNav")
      }

    },

    keyUpEvent: function(event){


      if (event && event.key && (event.key!=='ArrowUp' && event.key !=='ArrowDown' && event.key!=='Escape' && event.key!=='Backspace' && event.key!=='Enter' && event.key!=='PageUp' && event.key!=='PageDown' && event.ctrlKey == false)){

        // if we already have a value, do not let it add another
        // if (this.activeLookupValue != null){
        //   event.target.value = ''
        //   event.preventDefault()
        //   return false
        // }
        // console.log(this.nested,this.activeLookupValue)
        // if (!this.nested && this.activeLookupValue.length>0){


        // if (this.activeLookupValue.length>0){
        //   this.$refs['added-value'][0].classList.add('ani-shake');
        //   window.setTimeout(()=>{this.$refs['added-value'][0].classList.remove('ani-shake');},500)
        //   event.target.value = ""
        //   return false
        // }





        this.activeValue = event.target.value.trimStart()
        this.doubleDelete = false
        this.activeValue = event.target.value.trimStart()
        this.activeFilter = event.target.value.trimStart()
        this.displayAutocomplete = true
        // this.$store.dispatch("disableMacroNav")
        this.filter()




      }else if (event && event.key && event.key==='Backspace'){

        if (!this.doubleDelete && this.activeValue === ''){          
          this.doubleDelete = true          
          return false
        }
        if (this.activeValue == '' && this.doubleDelete){
          this.doubleDelete = false
          // were gonna delete the last one          
          if (this.simpleLookupValues.length>0){                       
            this.removeValue(-1)
          }
          
          this.doubleDelete = false
          this.displayAutocomplete = false
        }else if (this.activeValue == ''){
          this.activeValue
        }

        this.doubleDelete = false
        this.activeValue = event.target.value.trimStart()
        this.activeFilter = event.target.value.trimStart()

        this.displayAutocomplete = true
        // this.$store.dispatch("disableMacroNav")
        this.filter()

      }




      if (event && event.code === 'ArrowUp' && this.displayAutocomplete == false){
        utilsMisc.globalNav('up',event.target)
      }
      if (event && event.code === 'ArrowDown' && this.displayAutocomplete == false){
        utilsMisc.globalNav('down',event.target)
      }



    },    
    keyDownEvent: function(event, reposLeft){
      
      if (reposLeft){

        this.findSelectListTime = window.setInterval(()=>{

          if (this.$refs.selectlist && this.$refs.selectlist.style){
            window.clearTimeout(this.findSelectListTime)
            console.log(this.$refs.selectlist)
            var rect = event.target.getBoundingClientRect();
            console.log(rect.top, rect.right, rect.bottom, rect.left);
            this.$refs.selectlist.style.left = rect.left + 'px'

          }




        },100)


      }


      this.activeValue = event.target.value

      if (event && event.key && this.displayAutocomplete == true && (event.key==='ArrowUp' || event.key==='ArrowDown')){
        this.doubleDelete = false
        if (this.displayList.length<=1){
          return false
        }
        if (!this.displayAutocomplete) this.displayAutocomplete = true

        this.activeFilter =''
        this.activeValue = ''
        // if there is nothing selected yet then pick the first one
        if (this.activeSelect.trim()=='' && this.displayList.length>0){
          this.activeSelect = this.displayList[0]
          this.activeValue = this.displayList[0]


        }else{

          // check if there is one further from the actively selected item
          for (let step=0; step<this.displayList.length;step++){
            if (this.displayList[step]===this.activeSelect){

              if (event.key==='ArrowDown'){
                if (step+1 < this.displayList.length){
                  this.activeSelect = this.displayList[step+1]
                  this.activeValue = this.displayList[step+1]
                  break
                }
              }
              if (event.key==='ArrowUp'){
                if (step-1 >= 0){
                  this.activeSelect = this.displayList[step-1]
                  this.activeValue = this.displayList[step-1]
                  break
                }
              }

            }

          }
        }

        return false
      // }else if (event && event.key && this.displayAutocomplete == false && (event.key==='ArrowUp' || event.key==='ArrowDown')){

      }else if (event && event.key && event.key==='Escape'){
        this.doubleDelete = false
        this.activeFilter = ''
        this.activeValue = ''
        this.displayAutocomplete = false
      


      }else if (event && event.key && event.key==='Enter'){
        this.doubleDelete = false

        let metadata = utilsNetwork.lookupLibrary[this.uri].metadata.values

        if (this.activeKeyword){
          metadata = utilsNetwork.lookupLibrary[this.uri+'KEYWORD'].metadata.values          
        }



        // find the active selected in the data
        Object.keys(metadata).forEach((key)=>{
          let idx = metadata[key].displayLabel.indexOf(this.activeSelect)
          // a dumb bug here where depending on the vocab the label has extra spaces in it....
          if (idx==-1){
            idx = metadata[key].displayLabel.indexOf(this.activeSelect.replace(/\s+/g,' '))
          }


          if (idx >-1){
            // this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':metadata[key].label[idx],URI:metadata[key].uri})
            this.activeFilter = ''
            this.activeValue = ''
            this.activeSelect = ''
            this.displayAutocomplete=false
            event.target.value = ''     
            // let parentURI = (this.parentStructureObj) ? this.parentStructureObj.propertyURI : null 
            let useLabel = (metadata[key].authLabel) ? metadata[key].authLabel : metadata[key].label[idx]

            // this.$store.dispatch("setValueSimple", { self: this, ptGuid: this.ptGuid, propertyPath: this.propertyPath, valueURI: metadata[key].uri, valueLabel:useLabel}).then((resultData) => {
            //   this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':resultData.valueLabel, uri: resultData.valueURI, uriGuid: resultData.guid, labelGuid:resultData.guid})
            // })
            // not passing a field guid since this is adding a new one
            this.profileStore.setValueSimple(this.guid,this.existingGuid,this.propertyPath,metadata[key].uri,useLabel)

          }
          // let data = utilsNetwork.lookupLibrary[this.uri].metadata[v]
          
          // let idx = data.defaultsisplayLabel.indexOf(this.activeSelect)
          // if (idx > -1){
          //   this.structure.valueConstraint.defaults.push({defaultLiteral:data.label[idx],defaultURI:data.uri[idx]})
          // }
        })


        // if (event.target.value == ''){
        //   this.submitField()
        // }

        // if there is a value still that means the value did not match a item in the list
        // so add the value as a uncontrolled value
        if (event.target.value !== ''){  
          
          this.activeFilter = ''
          this.activeValue = ''
          this.activeSelect = ''
          this.displayAutocomplete=false


          // let parentURI = (this.parentStructureObj) ? this.parentStructureObj.propertyURI : null 

          // this.$store.dispatch("setValueSimple", { self: this, ptGuid: this.ptGuid, propertyPath: this.propertyPath, valueURI: null, valueLabel:event.target.value}).then((resultData) => {
          //   this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':resultData.valueLabel, uriGuid: resultData.guid, labelGuid:resultData.guid})
          // })
          this.profileStore.setValueSimple(this.guid,this.existingGuid,this.propertyPath,null,event.target.value)
  

          // this.submitField()

        }


        event.preventDefault()


      }else if (event.target.value == ''){


            this.activeFilter = ''
            this.activeValue = ''
            this.activeSelect = ''
            this.displayAutocomplete=false



      }


      if (this.displayAutocomplete){        
        // this.$store.dispatch("disableMacroNav")
      }else{
        // this.$store.dispatch("enableMacroNav")
      }




    },

    mouseSelectValue: function(val){

      console.log(val)


    },

    removeValue: function(idx){

        
        if (idx===-1){
          
          idx = this.simpleLookupValues.length - 1
        }

        let removeGuid = this.simpleLookupValues[idx]['@guid']


        console.log(removeGuid)

        this.profileStore.removeValueSimple(this.guid,removeGuid)

        // No clue what this is refering to about hasSeries...        
        // // TODO unhack this, put it in the tempalte or put it in the config :(        
        // if (this.structure.valueConstraint && this.structure.valueConstraint.defaults && this.structure.valueConstraint.defaults[0] && this.structure.valueConstraint.defaults[0].defaultURI && this.structure.valueConstraint.defaults[0].defaultURI === 'http://id.loc.gov/ontologies/bibframe/hasSeries'){
        //   this.refreshInputDisplay()
        //   return false
        // }
      },  





    // refreshInputDisplay: function(){

    //   this.activeLookupValue = []

    //   let userValue

    //   if (this.isMini){
    //     userValue = this.activeProfileMini.rt[this.profileName].pt[this.profileCompoent].userValue
    //   }else{
    //     userValue = this.activeProfile.rt[this.profileName].pt[this.profileCompoent].userValue  
    //   }
      
    //   // get the length of the properties, for our case we can filter out sameAs properties
    //   // as in simple lookups they are place holders and don't really need to be accounted for in the hierearchy of the properties
    //   let propertyPathLength = this.propertyPath.filter((p)=>{ return (p.propertyURI != 'http://www.w3.org/2002/07/owl#sameAs') ? true : false }).length     


    //   let possibleLiteralProperties = ['http://www.w3.org/1999/02/22-rdf-syntax-ns#value', 'http://www.w3.org/2000/01/rdf-schema#label', 'http://id.loc.gov/ontologies/bibframe/code','http://www.loc.gov/mads/rdf/v1#authoritativeLabel']
      

    //   // filter out any bnodes with that guid starting from the bottom of the hiearchy
    //   // then go through and check if we left an empty bnode hiearchy and if so delete it
    //   if (propertyPathLength==4){
    //       let L0URI = this.propertyPath[0].propertyURI
    //       let L1URI = this.propertyPath[1].propertyURI
    //       let L2URI = this.propertyPath[2].propertyURI
    //       let L3URI = this.propertyPath[3].propertyURI
    //       if (userValue[L0URI] && userValue[L0URI][0] && userValue[L0URI][0][L1URI] && userValue[L0URI][0][L1URI][0] && userValue[L0URI][0][L1URI][0][L2URI] && userValue[L0URI][0][L1URI][0][L2URI][0] && userValue[L0URI][0][L1URI][0][L2URI][0][L3URI]){
    //         for (let v of userValue[L0URI][0][L1URI][0][L2URI][0][L3URI]){
    //           let label = null 
    //           let labelGuid = null
    //           let uri = null
    //           let uriGuid = null 

    //           for (let aKey in v){


    //             if (v['@id']){
    //               uri = v['@id']
    //               uriGuid = v['@guid']
    //             }


    //             if (possibleLiteralProperties.indexOf(aKey)>-1){
    //               if (v[aKey] && v[aKey][0][aKey]){
    //                 label = v[aKey][0][aKey]
    //                 labelGuid = v['@guid']
    //               }

    //               if (v[aKey] && v[aKey][0]['@id']){
    //                 uri = v[aKey][0]['@id']
    //                 // if the URI is stored at this level, we still want to point to the parent's guid
    //                 uriGuid = v['@guid']

    //               }

    //             }

    //           }
    //           if (!label){
    //             // no label was found, just use the URI and it will get dereferenced by the componet
    //             if (uri){
    //               label = uri
    //             }
    //           }
    //           this.activeLookupValue.push({
    //             'http://www.w3.org/2000/01/rdf-schema#label' : label,
    //             uri : uri,
    //             uriGuid: uriGuid,
    //             labelGuid: labelGuid
    //           })
    //         }
    //       }
    //   }

    //   if (propertyPathLength==3){
    //       let L0URI = this.propertyPath[0].propertyURI
    //       let L1URI = this.propertyPath[1].propertyURI
    //       let L2URI = this.propertyPath[2].propertyURI


    //       if (userValue[L0URI] && userValue[L0URI][0] && userValue[L0URI][0][L1URI] && userValue[L0URI][0][L1URI][0] && userValue[L0URI][0][L1URI][0][L2URI]){
    //         for (let v of userValue[L0URI][0][L1URI][0][L2URI]){
    //           let label = null 
    //           let labelGuid = null
    //           let uri = null
    //           let uriGuid = null 

    //           for (let aKey in v){

    //             if (v['@id']){
    //               uri = v['@id']
    //               uriGuid = v['@guid']
    //             }


    //             if (possibleLiteralProperties.indexOf(aKey)>-1){
    //               if (v[aKey] && v[aKey][0][aKey]){
    //                 label = v[aKey][0][aKey]
    //                 labelGuid = v['@guid']
    //               }

    //               if (v[aKey] && v[aKey][0]['@id']){
    //                 uri = v[aKey][0]['@id']
    //                 // if the URI is stored at this level, we still want to point to the parent's guid
    //                 uriGuid = v['@guid']

    //               }

    //             }

    //           }
    //           if (!label){
    //             // no label was found, just use the URI and it will get dereferenced by the componet
    //             if (uri){
    //               label = uri
    //             }
    //           }
    //           this.activeLookupValue.push({
    //             'http://www.w3.org/2000/01/rdf-schema#label' : label,
    //             uri : uri,
    //             uriGuid: uriGuid,
    //             labelGuid: labelGuid
    //           })
    //         }
    //       }
    //   }
    //   if (propertyPathLength==2){

    //       let L0URI = this.propertyPath[0].propertyURI
    //       let L1URI = this.propertyPath[1].propertyURI
    //       if (userValue[L0URI] && userValue[L0URI][0] && userValue[L0URI][0][L1URI]){
    //         for (let v of userValue[L0URI][0][L1URI]){
    //           let label = null 
    //           let labelGuid = null
    //           let uri = null
    //           let uriGuid = null 

    //           for (let aKey in v){

    //             if (v['@id']){
    //               uri = v['@id']
    //               uriGuid = v['@guid']
    //             }


    //             if (possibleLiteralProperties.indexOf(aKey)>-1){
    //               if (v[aKey] && v[aKey][0][aKey]){
    //                 label = v[aKey][0][aKey]
    //                 labelGuid = v['@guid']
    //               }
    //               if (v[aKey] && v[aKey][0]['@id']){
    //                 uri = v[aKey][0]['@id']
    //                 // if the URI is stored at this level, we still want to point to the parent's guid
    //                 uriGuid = v['@guid']

    //               }


    //             }

    //           }
    //           if (!label){
    //             // no label was found, just use the URI and it will get dereferenced by the componet
    //             if (uri){
    //               label = uri
    //             }
    //           }
    //           this.activeLookupValue.push({
    //             'http://www.w3.org/2000/01/rdf-schema#label' : label,
    //             uri : uri,
    //             uriGuid: uriGuid,
    //             labelGuid: labelGuid
    //           })
              
    //         }
    //       }
    //   }
    //   if (propertyPathLength==1){
    //       let L0URI = this.propertyPath[0].propertyURI

    //       console.log("!!!!!! HERE", L0URI, userValue,userValue[L0URI])

    //       if (userValue[L0URI]){
    //         for (let v of userValue[L0URI]){
    //           let label = null 
    //           let labelGuid = null
    //           let uri = null
    //           let uriGuid = null 

    //           for (let aKey in v){


    //             if (v['@id']){
    //               uri = v['@id']
    //               uriGuid = v['@guid']
    //             }


    //             if (possibleLiteralProperties.indexOf(aKey)>-1){
    //               if (v[aKey] && v[aKey][0][aKey]){
    //                 label = v[aKey][0][aKey]
    //                 labelGuid = v['@guid']
    //               }
    //               if (v[aKey] && v[aKey][0]['@id']){
    //                 uri = v[aKey][0]['@id']
    //                 // if the URI is stored at this level, we still want to point to the parent's guid
    //                 uriGuid = v['@guid']
    //               }
    //             }

    //           }
    //           if (!label){
    //             // no label was found, just use the URI and it will get dereferenced by the componet
    //             if (uri){
    //               label = uri
    //             }
    //           }

    //           if (label !== null || uri !== null){
    //             this.activeLookupValue.push({
    //               'http://www.w3.org/2000/01/rdf-schema#label' : label,
    //               uri : uri,
    //               uriGuid: uriGuid,
    //               labelGuid: labelGuid
    //             })
    //           }
    //         }
    //       }
    //   }


      




    // },



    // fakeContainerFocus: function(event){

    //     // 

    //     return event
    // },

    // removeValue: function(idx){


    //   let toRemove = this.activeLookupValue.splice(idx,1)
    //   toRemove = toRemove[0]


    //   // TODO unhack this, put it in the tempalte or put it in the config :(
    //   if (this.structure.valueConstraint && this.structure.valueConstraint.defaults && this.structure.valueConstraint.defaults[0] && this.structure.valueConstraint.defaults[0].defaultURI && this.structure.valueConstraint.defaults[0].defaultURI === 'http://id.loc.gov/ontologies/bibframe/hasSeries'){
    //     this.refreshInputDisplay()
    //     return false
    //   }

    //   this.$store.dispatch("removeValueSimple", { self: this, ptGuid: this.ptGuid, idGuid: toRemove.uriGuid, labelGuid: toRemove.labelGuid, propertyPath: this.propertyPath }).then(() => {
        
    //     this.$refs.lookupInput.focus()


    //   })  



    //   // if (this.activeLookupValue.length>1){
    //   //   this.activeLookupValue.splice(-1,1)
    //   // }else{
    //   //   this.activeLookupValue = []
    //   // }

    // },  


    // autoFocus: function(event){



    //   // let the rest of the app know what is the active input right now
    //   this.$store.dispatch("setActiveInput", { self: this, id: event.target.id, profileCompoent: this.profileCompoent, profileName: this.profileName }).then(()=>{
    //     // now focus the side bars
    //     this.$nextTick(()=>{
    //       uiUtils.focusSidebars()
    //     })


    //   })
    //   // assing the input value to the filter value
    //   this.activeFilter = event.target.value;
    //   // tell the store to load this specific lookup table into memory
    //   this.$store.dispatch("fetchLookupValues", { self: this, url: this.structure.valueConstraint.useValuesFrom[0] }).then(() => {
        
    //     this.uri = this.structure.valueConstraint.useValuesFrom[0]
    //     // if there is already a value don't open up the full list, they can type ahead but dont open everything
    //     // if (this.activeLookupValue.length==0){
    //       // this.filter()
    //     // }
    //   })    
      
      
      

    // },

    // blur: function(){

    //  // we want to hide the menu on deblur but not if they just click an item in the list

    //  this.$store.dispatch("enableMacroNav") 
    //  setTimeout(()=>{ 
    //   this.displayAutocomplete=false 
    // },500)


    // },


    clickAdd: function(item){
      this.displayAutocomplete=false
      console.log(item)
      this.activeSelect = item

      let metadata = utilsNetwork.lookupLibrary[this.uri].metadata.values

      if (this.activeKeyword){
        metadata = utilsNetwork.lookupLibrary[this.uri+'KEYWORD'].metadata.values          
      }
      console.log(metadata)
      // find the active selected in the data
      Object.keys(metadata).forEach((key)=>{
        let idx = metadata[key].displayLabel.indexOf(this.activeSelect)
        if (idx >-1){          
          this.activeFilter = ''
          this.activeValue = ''
          this.activeSelect = ''
          this.displayAutocomplete=false
          event.target.value = ''     
          let useLabel = (metadata[key].authLabel) ? metadata[key].authLabel : metadata[key].label[idx]
          this.profileStore.setValueSimple(this.guid,this.existingGuid,this.propertyPath,metadata[key].uri,useLabel)

          // refocus
          this.$refs.lookupInput.focus()

        }
      })


    },

    // clickAdd: function(event){

    //   this.displayAutocomplete=false


    //   if (event && event.target && event.target.innerText){
    //     this.activeSelect = event.target.innerText
    //   }

    //   let metadata = utilsNetwork.lookupLibrary[this.uri].metadata.values

    //   if (this.activeKeyword){
    //     metadata = utilsNetwork.lookupLibrary[this.uri+'KEYWORD'].metadata.values          
    //   }
    //   // find the active selected in the data
    //   Object.keys(metadata).forEach((key)=>{
    //     let idx = metadata[key].displayLabel.indexOf(this.activeSelect)
    //     if (idx >-1){
    //       // this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':metadata[key].label[idx],URI:metadata[key].uri})
    //       this.activeFilter = ''
    //       this.activeValue = ''
    //       this.activeSelect = ''
    //       this.displayAutocomplete=false
    //       event.target.value = ''     
    //       // let parentURI = (this.parentStructureObj) ? this.parentStructureObj.propertyURI : null 
    //       let useLabel = (metadata[key].authLabel) ? metadata[key].authLabel : metadata[key].label[idx]

    //       this.$store.dispatch("setValueSimple", { self: this, ptGuid: this.ptGuid, propertyPath: this.propertyPath, valueURI: metadata[key].uri, valueLabel:useLabel}).then((resultData) => {
    //         this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':resultData.valueLabel, uri: resultData.valueURI, uriGuid: resultData.guid, labelGuid:resultData.guid})
    //       })
    //     }
    //     // let data = utilsNetwork.lookupLibrary[this.uri].metadata[v]
        
    //     // let idx = data.defaultsisplayLabel.indexOf(this.activeSelect)
    //     // if (idx > -1){
    //     //   this.structure.valueConstraint.defaults.push({defaultLiteral:data.label[idx],defaultURI:data.uri[idx]})
    //     // }
    //   })


    //   // let label = this.displayList[event.target.dataset.idx]

    //   // let metadata = utilsNetwork.lookupLibrary[this.uri].metadata.values

    //   // // find the active selected in the data
    //   // Object.keys(metadata).forEach((key)=>{

    //   //   let idx = metadata[key].displayLabel.indexOf(label)
    //   //   if (idx >-1){
    //   //     // this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':,URI:})
    //   //     // this.activeFilter = ''
    //   //     // this.activeValue = ''
    //   //     // this.activeSelect = ''
    //   //     // this.displayAutocomplete=false
    //   //     // // this.$store.dispatch("addValueLiteral", { self: this, profileComponet: this.profileCompoent, structure: this.structure, template:this.activeTemplate, value:this.activeLookupValue }).then(() => {
           
    //   //     // // })        

    //   //     // this.$store.dispatch("setValueSimple", { self: this, ptGuid: this.ptGuid, parentURI: this.parentStructureObj.propertyURI, URI: this.structure.propertyURI, valueURI: metadata[key].uri, valueLabel:metadata[key].label[idx]}).then((resultData) => {
    //   //     //   this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':resultData.valueLabel, uri: resultData.valueURI, uriGuid: resultData.guid, labelGuid:resultData.guid})
    //   //     // })



    //   //     this.activeFilter = ''
    //   //     this.activeValue = ''
    //   //     this.activeSelect = ''
    //   //     this.displayAutocomplete=false
    //   //     event.target.value = ''
    //   //     // this.$store.dispatch("addValueLiteral", { self: this, profileComponet: this.profileCompoent, structure: this.structure, template:this.activeTemplate, value:this.activeLookupValue }).then(() => {
           
    //   //     // })               
    //   //     let parentURI = (this.parentStructureObj) ? this.parentStructureObj.propertyURI : null 


    //   //     this.$store.dispatch("setValueSimple", { self: this, ptGuid: this.ptGuid, parentURI: parentURI, URI: this.structure.propertyURI, valueURI: metadata[key].uri, valueLabel:metadata[key].label[idx]}).then((resultData) => {
    //   //       this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':resultData.valueLabel, uri: resultData.valueURI, uriGuid: resultData.guid, labelGuid:resultData.guid})
    //   //     })



    //   //     this.$store.dispatch("enableMacroNav")    



    //   //   }


    //   // })

    //   // refocus
    //   this.$refs.lookupInput.focus()



    // },

    // submitField: uiUtils.globalMoveDown  


  }
};
</script>


<style scoped>
.inline-lookup-input{
  outline: none;
  border: none;

}
.inline-lookup-input:focus-within{
  background-color: #dfe5f1;
}
.inline-lookup-input:hover{
  background-color: #dfe5f1;
}
.inline-icon{
  display: inline-block;
  height: 15px;
  vertical-align: sub;
}
.inline-remove-x{

  margin-left: 5px;
  text-decoration: none;
  color: gray !important;
  margin-right: 15px;

}

.bfcode-display-mode-holder{
  display: flex;
  align-items: center;
  width: 100%;
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



.check-mark{
  color: green;
  font-size: 1.25em;
  position: absolute;
  display: inline-block;
  left: 1px;
  font-weight: bold;  
}

.lookup-fake-input{
  display: flex;
}


.lookup-fake-input-entities{
  flex-shrink: 1;
  padding: 0.2em;
}

.lookup-fake-input-label{
  position: absolute;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-edit-show-field-labels-size')");
  z-index: 1;
  top: -4px;
  left: 2px;
  color: gray;

}

.lookup-fake-input-text{
  flex-grow: 1;
}
.lookup-fake-input-text input{
  width: 100%;
  outline: none;
  border: none;
  padding: 0;
  margin: 0;
  margin-top: 0.5em;
}

.lookup-action{
  flex-shrink: 1;

}



.selected-value-container{
 
  border: solid 1px;
  border-radius: 0.5em;
  padding: 0.35em;
  font-size: 0.75em;
  background-color: whitesmoke;
  white-space: nowrap;
  display: inline-block;
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
.autocomplete-container li{
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


/*textarea{
  border: none;
  overflow: hidden;
  outline: none;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  box-shadow: none;  
  resize: none;
  width: 100%;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size')");

  height: 1.25em;
  line-height: 1.25em;
}
*/




/*
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
.uncontrolled{
  margin-left: 0.25em;
  color: darkred;
}
.component-container-fake-input:focus-within {
  border: solid 1px #a6acb7;
  background-color: #dfe5f1;

  
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
.autocomplete-container li{
  cursor: pointer;
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
}

.ani-shake{
  animation: shake 1s 1;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  10%,
  30%,
  50%,
  70% {
    transform: translateX(-10px);
  }

  20%,
  40%,
  60% {
    transform: translateX(10px);
  }

  80% {
    transform: translateX(8px);
  }

  90% {
    transform: translateX(-8px);
  }
}

*/



</style>
