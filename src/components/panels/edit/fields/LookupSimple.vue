<template>


  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == true">

    <template v-if="inlineModeShouldDisplay">

      <template v-if="simpleLookupValues.length===0">

          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
          <input v-model="activeValue" class="inline-lookup-input can-select 1" ref="lookupInput" @focusin="focused" @blur="blur" type="text" @keydown="keyDownEvent($event, true)" @keyup="keyUpEvent($event)" :disabled="readOnly" />


      </template>
      <template v-else>

          <template v-for="(avl,idx) in simpleLookupValues" >
              <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>




              <span v-if="!avl.needsDereference" style="">
                <!-- <span class="material-icons icon inline-icon">playlist_add_check</span> -->
                {{avl.label}}
                <span class="uncontrolled" v-if="avl.isLiteral"> (uncontrolled)</span></span>
              <!-- <span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style=""><span class="material-icons check-mark">check_circle_outline</span></span></span> -->

              <span v-else style=""><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"></span></span>

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

        <div class="lookup-fake-input" @click="focusClick()" v-if="showField">



          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
            <!-- <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels') && simpleLookupValues.length==0"  class="lookup-fake-input-label">{{structure.propertyLabel}}</div> -->
            <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels')"  class="lookup-fake-input-label">{{structure.propertyLabel}}</div>
          </template>



          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == true">

            <div class="bfcode-display-mode-holder">
              <div class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}</div>
              <div class="bfcode-display-mode-holder-value">

                <div class="lookup-fake-input-entities" style="display:inline-block;">
                  <div v-for="(avl,idx) in simpleLookupValues" class="selected-value-container">
                      <span v-if="!avl.needsDereference" style="padding-right: 0.3em; font-weight: bold">{{avl.label}}<span class="uncontrolled" v-if="avl.isLiteral">(uncontrolled)</span><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style=""></span></span>

                      <span v-else style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"></span></span>

                      <span @click="removeValue(idx)" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
                  </div>
                </div>
                <div class="lookup-fake-input-text" style="display: inline-block;">
                  <input v-model="activeValue" class="inline-lookup-input can-select 2" ref="lookupInput" @blur="blur" @focusin="focused" type="text" @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)" :data-guid="structure['@guid']" :disabled="readOnly" />
                </div>

              </div>
            </div>

          </template>

          <template v-else>

            <div class="lookup-fake-input-entities">
              <div v-for="(avl,idx) in simpleLookupValues" class="selected-value-container">

                <span v-if="!avl.needsDereference" style="padding-right: 0.3em; font-weight: bold">{{avl.label}}<span class="uncontrolled" v-if="avl.isLiteral">(uncontrolled)</span><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon" style=""></span></span>
                  <span v-else style="padding-right: 0.3em; font-weight: bold"><LabelDereference :URI="avl.URI"/><span v-if="!avl.isLiteral" title="Controlled Term" class="selected-value-icon"></span></span>
                  <span @click="removeValue(idx)" v-if="!avl.uneditable" style="border-left: solid 1px black; padding: 0 0.5em; font-size: 1em; cursor: pointer;">x</span>
                  <span v-else>(uneditable)</span>
              </div>
            </div>
            <div class="lookup-fake-input-text">
              <input v-model="activeValue" class="inline-lookup-input can-select 3" ref="lookupInput" :data-guid="structure['@guid']" @blur="blur" @focusin="focused" type="text" @keydown="keyDownEvent($event)" @keyup="keyUpEvent($event)" :disabled="readOnly" />
            </div>


          </template>







          <Transition name="action">
            <div class="lookup-action" v-if="showActionButton && myGuid == activeField">

              <action-button :type="'lookupSimple'" :structure="structure" :guid="guid" wtf="wft" :id="`action-button-${structure['@guid']}`" @action-button-command="actionButtonCommand" />
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
    readOnly: Boolean

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

      showField: true,

      
      activeValue: '',


      
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
      let values = this.profileStore.returnSimpleLookupValueFromProfile(this.guid, this.propertyPath)
      if (this.readOnly && values.length==0){
        this.showField=false
      }

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

    focused: async function(){

      // set the state active field
      this.activeField = this.myGuid

      // if enabled show the action button

      if (this.preferenceStore.returnValue('--b-edit-general-action-button-display')){
        this.showActionButton=true
      }else{
        this.showActionButton=false
      }
      this.uri = this.structure.valueConstraint.useValuesFrom[0]

      if (!this.uri.includes("suggest2")){
        utilsNetwork.loadSimpleLookup(this.uri)
      } else {
        let uriParts = this.uri.split("/suggest2?q=")
        let results = await utilsNetwork.loadSimpleLookupKeyword(uriParts[0], uriParts[1])
        utilsNetwork.lookupLibrary[this.uri] = results
      }
    },

    actionButtonCommand: function(cmd){
      this.$refs.input.focus()
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
      // console.log(`"${addKeyword}"`)
      // console.log(this.uri)
      // console.log(utilsNetwork.lookupLibrary)
      // console.log(utilsNetwork.lookupLibrary[this.uri+addKeyword])



      if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
        this.displayList.push("Loading Data.")
        // if the data isn't loaded yet we will wait a few times
        await new Promise(r => setTimeout(r, 1000));
        this.displayList=[]

        if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
          this.displayList.push("Loading Data..")
          await new Promise(r => setTimeout(r, 1000));
          this.displayList=[]


          if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
            this.displayList.push("Loading Data...")
            await new Promise(r => setTimeout(r, 1000));
            this.displayList=[]

            if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
              this.displayList.push("Loading Data....")
              await new Promise(r => setTimeout(r, 1000));
              this.displayList=[]

              if (!utilsNetwork.lookupLibrary[this.uri+addKeyword]){
                this.activeValue="🙀ERROR WITH LOOKUP"


              }

            }
          }

        }

      }
      let exactMatches = []
      Object.keys(utilsNetwork.lookupLibrary[this.uri+addKeyword]).forEach((v)=>{
        // the list has a special key metdata that contains more info
        if (v==='metadata'){return false}
        // no filter yet show first 25
        let tempDisplayList=[]
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
            }else if (x.toLowerCase().includes(' (' +this.activeFilter.toLowerCase())){
                if (this.displayList.indexOf(x)==-1){
                  this.displayList.push(x)
                }
            }else if (utilsNetwork.lookupLibrary[this.uri+addKeyword] && utilsNetwork.lookupLibrary[this.uri+addKeyword].metadata && utilsNetwork.lookupLibrary[this.uri+addKeyword].metadata.values && utilsNetwork.lookupLibrary[this.uri+addKeyword].metadata.values[v]){
             // check for the code as well

              let addCode = false
              let exactMatch = false
              for (let code of utilsNetwork.lookupLibrary[this.uri+addKeyword].metadata.values[v].code){
                if (code.toLowerCase().startsWith(this.activeFilter.toLowerCase())){
                  addCode=true
                  if (code.toLowerCase().trim()==this.activeFilter.toLowerCase().trim()){
                    exactMatch=true
                  }
                }
              }
              if (addCode){
                if (exactMatch){
                  // put exact matches at the top
                  exactMatches.push(x)
                }else{
                  this.displayList.push(x)
                }               
              }
            }else{
              console.warn('Could not find the metadata in the simple lookup response, this should not happen.')
            }
            
          })
        }


      })

      // sometimes you'll find code hacks circumvents ontology
      this.displayList = this.displayList.filter((v)=>{ return (v === 'Englisch (eng)') ? false : true})



      this.displayList.sort()
      // put exact matches at the top after sort
      this.displayList = exactMatches.concat(this.displayList)



      // take the first hit and make it the autocomplete text
      if (this.displayList.length>0 && this.activeFilter.length>0){
        this.activeSelect = this.displayList[0]
        this.displayAutocomplete = true
      }
      if (this.displayList.length==0){


        if (!recursive){
          if (this.uri.includes('id.loc.gov/vocabulary/')){

            if (this.activeFilter.length>2){

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
      if (event && event.keyCode == 220 && event.ctrlKey == true){
        let id = `action-button-${event.target.dataset.guid}`
        document.getElementById(id).click()
        // the acutal clickable button might be inside the popper interface at this point
        if (document.getElementById(id).children && document.getElementById(id).children[0]){
          document.getElementById(id).children[0].click()
        }
        return false
      }



      if (reposLeft){
        this.findSelectListTime = window.setInterval(()=>{
          if (this.$refs.selectlist && this.$refs.selectlist.style){
            window.clearTimeout(this.findSelectListTime)
            var rect = event.target.getBoundingClientRect();
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
        
        for (let key of Object.keys(metadata)){
          // let idx = metadata[key].displayLabel.indexOf(this.activeSelect)
          // // a dumb bug here where depending on the vocab the label has extra spaces in it....
          // if (idx==-1){
          //   idx = metadata[key].displayLabel.indexOf(this.activeSelect.replace(/\s+/g,' '))
          // }


          let displayLabel = metadata[key].displayLabel
          if (Array.isArray(displayLabel)){displayLabel = displayLabel[0]}
          displayLabel = displayLabel.replace(/\s+/g,' ')

          // if we don't see it in the display label it might be in the authLabel becase the display label will be sometihng like "dlc (USE United States, Library of Congress)"
          let authLabel = metadata[key].authLabel
          if (authLabel){ authLabel = authLabel.replace(/\s+/g,' ')}

          let isMatch = (this.activeSelect == displayLabel)
          if (!isMatch){
            isMatch = (this.activeSelect == authLabel)       
          }

          // if it is an array then try to match up to it
          if (!isMatch){
            if (Array.isArray(metadata[key].displayLabel)){
              for (let dlValue of metadata[key].displayLabel){
                if (this.activeSelect == dlValue){
                  isMatch = true
                  displayLabel = dlValue
                }
              }
            }
          }




          if (isMatch){
            // this.activeLookupValue.push({'http://www.w3.org/2000/01/rdf-schema#label':metadata[key].label[idx],URI:metadata[key].uri})
            this.activeFilter = ''
            this.activeValue = ''
            this.activeSelect = ''
            this.displayAutocomplete=false
            event.target.value = ''
            let useLabel = (authLabel) ? authLabel : displayLabel
            this.profileStore.setValueSimple(this.guid,this.existingGuid,this.propertyPath,metadata[key].uri,useLabel)
            break
          }
        }


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


      } else if (event.target.value == '') {
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




    },

    removeValue: function(idx){
        if (this.readOnly){
          return false
        }


        if (idx===-1){

          idx = this.simpleLookupValues.length - 1
        }

        let removeGuid = this.simpleLookupValues[idx]['@guid']
        this.profileStore.removeValueSimple(this.guid, removeGuid)
        // No clue what this is refering to about hasSeries...
        // // TODO unhack this, put it in the tempalte or put it in the config :(
        // if (this.structure.valueConstraint && this.structure.valueConstraint.defaults && this.structure.valueConstraint.defaults[0] && this.structure.valueConstraint.defaults[0].defaultURI && this.structure.valueConstraint.defaults[0].defaultURI === 'http://id.loc.gov/ontologies/bibframe/hasSeries'){
        //   this.refreshInputDisplay()
        //   return false
        // }
      },


    clickAdd: function(item){
      this.displayAutocomplete=false

      this.activeSelect = item
      console.log("this.activeSelect", this.activeSelect)
      let metadata = utilsNetwork.lookupLibrary[this.uri].metadata.values

      if (this.activeKeyword){
        metadata = utilsNetwork.lookupLibrary[this.uri+'KEYWORD'].metadata.values
      }
      // console.log("looking forrrrr",this.activeSelect)
      // console.log("META",JSON.stringify(metadata,null,2))

      // find the active selected in the data
      
      for (let key of Object.keys(metadata)){

        let displayLabel = metadata[key].displayLabel
        if (Array.isArray(displayLabel)){displayLabel = displayLabel[0]}
        displayLabel = displayLabel.replace(/\s+/g,' ')

        console.log(metadata[key])

        // if we don't see it in the display label it might be in the authLabel becase the display label will be sometihng like "dlc (USE United States, Library of Congress)"
        let authLabel = metadata[key].authLabel
        if (authLabel){ authLabel = authLabel.replace(/\s+/g,' ')}

        let isMatch = (this.activeSelect == displayLabel)

        if (!isMatch){
          isMatch = (this.activeSelect == authLabel)       
        }
        
        // if it is an array then try to match up to it
        if (!isMatch){
          if (Array.isArray(metadata[key].displayLabel)){
            for (let dlValue of metadata[key].displayLabel){
              if (this.activeSelect == dlValue){
                isMatch = true
                displayLabel = dlValue
              }
            }
          }
        }


        // console.log("looking for ",this.activeSelect,' in ', displayLabel, 'or',  authLabel)


        
        if (isMatch){
          this.activeFilter = ''
          this.activeValue = ''
          this.activeSelect = ''
          this.displayAutocomplete=false
          event.target.value = ''
          let useLabel = (authLabel) ? authLabel : displayLabel
          this.profileStore.setValueSimple(this.guid,this.existingGuid,this.propertyPath,metadata[key].uri,useLabel)
          // refocus
          this.$refs.lookupInput.focus()
          break
        }
      }


    },

  }
};
</script>


<style scoped>





.inline-lookup-input{
  outline: none;
  border: none;
  background-color: transparent;


}
.inline-lookup-input:focus-within{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.inline-lookup-input:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.lookup-fake-input:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.lookup-fake-input:hover input{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.lookup-fake-input:focus-within{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.lookup-fake-input:focus-within input{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
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
  background-color: transparent;

}


.lookup-fake-input-entities{
  flex-shrink: 1;
  padding: 0.2em;
  margin-top: 5px;
}

.lookup-fake-input-label{
  position: absolute;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-edit-show-field-labels-size')");
  z-index: 1;
  top: -4px;
  left: 2px;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-show-field-labels-color')");
  pointer-events: none;
  margin-top: 1px;
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
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-literal-font-color')");


}

.lookup-action{
  flex-shrink: 1;

}



.selected-value-container{

  border: solid 1px;
  border-radius: 0.5em;
  padding: 0.35em;
  font-size: 0.75em;

  white-space: nowrap;
  display: inline-block;
  height: 2em;
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-lookup-background-color')");
  border: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-lookup-border-color')");
  color:  v-bind("preferenceStore.returnValue('--c-edit-main-lookup-text-color')");


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

  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-lookup-simple-lookup-autocomplete-background-color')");
  color:  v-bind("preferenceStore.returnValue('--c-edit-main-lookup-simple-lookup-autocomplete-text-color')");



  border-radius: 15px;
  -webkit-box-shadow: 0px 5px 7px -1px rgba(150,150,150,1);
  -moz-box-shadow: 0px 5px 7px -1px rgba(150,150,150,1);
  box-shadow: 0px 5px 7px -1px rgba(150,150,150,1);
}
.autocomplete-container li{
  cursor: pointer;
}
.autocomplete-container li:hover span{
  border:solid 4px lightblue;
  border-radius: 5px;
}

.component .lookup-fake-input{
  border-top:solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')");
} 
</style>
