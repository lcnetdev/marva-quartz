<template>

  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == true">
    <template v-if="inlineModeShouldDisplay">

      <template v-if="literalValues.length===1 && literalValues[0].value === ''">
          
          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
          <!-- <span @focus="inlineEmptyFocus" contenteditable="true" class="inline-mode-editable-span" ><span class="inline-mode-editable-span-space-maker">&nbsp;</span></span>         -->
          <input type="text" @focusin="focused" @keyup="navKey"  @input="valueChanged($event,true)" class="inline-mode-editable-span-input can-select" :ref="'input_' + literalValues[0]['@guid']" :data-guid="literalValues[0]['@guid']" />     

      </template>
      <template v-else>

        <template v-for="lValue in literalValues">
          <span class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
          <span contenteditable="true" @focusin="focused" @blur="blured" class="inline-mode-editable-span can-select" @keyup="navKey" @input="valueChanged" :ref="'input_' + lValue['@guid']" :data-guid="lValue['@guid']">{{lValue.value}}</span>        
        </template>


      </template>

      <Transition name="action">
        <div class="literal-action-inline-mode" v-if="showActionButton && myGuid == activeField">
          <action-button :clickmode="true"  :small="true" :type="'literal'" :guid="guid"  @action-button-command="actionButtonCommand" />
      </div>
    </Transition>

    </template>


  </template>

  <template v-else>

    <div class="lookup-fake-input" v-if="showField" >
      <div class="literal-holder" @click="focusClick(lValue)" v-for="lValue in literalValues">
        <!-- <div>Literal ({{propertyPath.map((x)=>{return x.propertyURI}).join('>')}})</div> -->
        <div class="literal-field">


          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
            <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels')"  class="lookup-fake-input-label">{{structure.propertyLabel}}</div>       
          </template>
          <form autocomplete="off" >

            <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == true">

              <div class="bfcode-display-mode-holder">
                <div class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}</div>
                <div class="bfcode-display-mode-holder-value">
                    <textarea 
                    :class="['literal-textarea', 'can-select',{'bfcode-textarea': preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode')}]" 
                    v-model="lValue.value"
                    v-on:keydown.enter.prevent="submitField"
                    autocomplete="off"
                    @focusin="focused" 
                    @blur="blured"
                    @input="valueChanged" 
                    @keyup="navKey"         
                    :ref="'input_' + lValue['@guid']"
                    :data-guid="lValue['@guid']"
                    :disabled="readOnly"
                    ></textarea>


                </div>
              </div>


            </template>
            <template v-else>

              <textarea 
                :class="['literal-textarea', 'can-select',{}]" 
                v-model="lValue.value"
                v-on:keydown.enter.prevent="submitField"
                autocomplete="off"
                @focusin="focused" 
                @blur="blured"
                @input="valueChanged"
                @keyup="navKey"           
                :ref="'input_' + lValue['@guid']"
                :data-guid="lValue['@guid']"
                :disabled="readOnly"
                ></textarea>

            </template>





          </form>
        </div>
          <Transition name="action">
            <div class="literal-action" v-if="showActionButton && myGuid == activeField">
              <action-button :type="'literal'" :fieldGuid="lValue['@guid']"  :guid="guid"  @action-button-command="actionButtonCommand" />
          </div>
        </Transition>
      </div>
    </div>
  </template>


</template>

<script>


import short from 'short-uuid'


import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'

import { mapStores, mapState, mapWritableState } from 'pinia'

import utilsMisc from '@/lib/utils_misc'
import utilsNetwork from '@/lib/utils_network'


import ActionButton from "@/components/panels/edit/fields/helpers/ActionButton.vue";

export default {
  name: "Literal",
  components: {
    ActionButton,
    // EditLiteralEditor,
    // EditLabelRemark,
    // Keypress: () => import('vue-keypress')    
  },

  props: {
    guid: String,
    nested: Boolean,
    propertyPath: Array,
    level: Number,
    structure: Object,
    readOnly: Boolean
  },

  methods: {

    inlineEmptyFocus: function(event){
      if (event.target.innerText.trim() === ''){
        event.target.innerText=''
      }
    },

    navKey: function(event){

      if (event && event.code === 'ArrowUp'){
        utilsMisc.globalNav('up',event.target)
      }
      if (event && event.code === 'ArrowDown'){
        utilsMisc.globalNav('down',event.target)
      }

    },
  
    focusClick: function(lValue){

      this.$refs['input_' + lValue['@guid']][0].focus()
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

      // does annoying height change when moving into field
      // this.expandHeightToContent()

    },
    blured: function(){
      // this.$nextTick(()=>{
      //   this.showActionButton=false
      // });
    },

    expandHeightToContent: function(){

      for (let key of Object.keys(this.$refs)){
        if (key.startsWith('input_')){
          this.$refs[key][0].style.height =  this.$refs[key][0].scrollHeight + "px"
        }      
      }

    },
    valueChanged: async function(event,setFocus){

      let v = event.target.value
      
      if (event.target.tagName === 'SPAN'){
        v = event.target.innerText
        if (event.data && event.data === '|'){
          event.target.innerText = event.target.innerText.slice(0,-1)
          event.preventDefault()
          return false
        }
      }
      
      await this.profileStore.setValueLiteral(this.guid,event.target.dataset.guid,this.propertyPath,v,event.target.dataset.lang)
      
      if (setFocus){

        let r = 'input_' + this.literalValues[0]['@guid']
        let el = this.$refs[r][0]

        el.focus();
        if (typeof window.getSelection != "undefined"
                && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange != "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }


        



      }      
    },



    actionButtonCommand: async function(cmd,options){


      

      if (cmd == 'addField'){
        this.profileStore.setValueLiteral(this.guid,short.generate(),this.propertyPath,"new value",null,true)
      }
      
      if (cmd == 'trans'){
        // this.profileStore.setValueLiteral(this.guid,short.generate(),this.propertyPath,"new value",null,true)

        let fieldValue = this.literalValues.filter((v)=>{ return (v['@guid'] == options.fieldGuid) })
        console.log(options,fieldValue[0].value)



        let transValue = await utilsNetwork.scriptShifterRequestTrans(options.lang,fieldValue[0].value,null,options.dir)
        transValue = JSON.parse(transValue)

        this.profileStore.setValueLiteral(this.guid,short.generate(),this.propertyPath,transValue.output,null,true)


        
      }


      this.$refs['input_' + this.literalValues[0]['@guid']][0].focus()



    },



  },
  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(useProfileStore),
    ...mapStores(usePreferenceStore),

    ...mapWritableState(useProfileStore, ['activeField','activeProfile']),


    myGuid(){
      return `${this.structure['@guid']}--${this.guid}`
    },

    literalValues(){
      // profileStore.setActiveField()
      let values = this.profileStore.returnLiteralValueFromProfile(this.guid,this.propertyPath)
      if (values === false){
        values = [{
          value: '',
          '@lang': null,
          '@guid': short.generate()
        }]
      }

      if (values.length == 0){
        this.hasNoData=true
        if (this.readOnly){
          this.showField=false
        }

      }else if(values.length > 0 && values.filter((v) => { return (v.value.length>0) }).length == 0 ){
        this.hasNoData=true
        if (this.readOnly){
          this.showField=false
        }        
      }else{
        this.hasNoData=false
      }


      return values

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


  watch: {



  },

  data: function() {
    return {  

      // used as toggle to show the button when field is focused
      showActionButton: false,    

      hasNoData: false,
      showField: true,
      
    }
  },

  mounted: function(){
    this.$nextTick().then(() => {
      this.expandHeightToContent()
    })
  },
  created: function(){

    this.$nextTick().then(() => {
      this.expandHeightToContent()
    })





  },
};
</script>

<style scoped>

.inline-mode-editable-span-input{
  display: inline;
  outline: none;
  border: none;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size')");
  height: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size')");


}
.inline-mode-editable-span-input:focus-within {
  background-color: #dfe5f1;
}
.inline-mode-editable-span-input:hover {
  background-color: #dfe5f1;
}
.inline-mode-editable-span{
  display: inline;
  padding: 0.2em;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size')");
  outline: none;
  margin-right: 15px;
}
.inline-mode-editable-span-space-maker{
  display: inline-block;
  background-color: red;
  min-width: 250px;
}
.inline-mode-editable-span:focus-within {
  background-color: #dfe5f1;
}


.bfcode-textarea{
  margin-top: 0 !important;
  margin-left: 5px;
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


/*translate fade (top to down)*/
.translate-fade-down-enter-active, .translate-fade-down-leave-active {
    transition: all 250ms;
    transition-timing-function: cubic-bezier(.53,2,.36,.85);
}
.translate-fade-down-enter, .translate-fade-down-leave-active {
    opacity: 0;
}
.translate-fade-down-enter, .translate-fade-down-leave-to {
    position: absolute;
}
.translate-fade-down-enter {
    transform: translateY(-10px);
}
.translate-fade-down-leave-active {
    transform: translateY(10px);
}



.lookup-fake-input-label{
  position: absolute;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-edit-show-field-labels-size')");


  z-index: 1;
  top: -4px;
  left: 2px;
  color: gray;
}



textarea{
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
  margin-top: 0.5em;
}

.lookup-fake-input{
  min-height: 2em;
}

textarea:focus-within{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}

.literal-holder:focus-within{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.literal-holder:focus-within textarea{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
textarea:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}

.literal-holder:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}
.literal-holder:hover textarea{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')");
}

.literal-holder{
  display: flex;
  align-items: center;
}

.literal-field{
  flex-grow:1;
  position: relative;
}
.literal-action{
  flex-shrink:1;
}

.literal-action-inline-mode{
  display: inline-block;
}


</style>
