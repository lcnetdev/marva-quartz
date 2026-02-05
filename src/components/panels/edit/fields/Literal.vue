<template>
  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == true">
    <template v-if="inlineModeShouldDisplay">

      <template v-if="literalValues.length===1 && literalValues[0].value === ''">

        <span class="bfcode-display-mode-holder-label simptip-position-top" :data-tooltip="structure.propertyLabel"  :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>
          <!-- <span @focus="inlineEmptyFocus" contenteditable="true" class="inline-mode-editable-span" ><span class="inline-mode-editable-span-space-maker">&nbsp;</span></span>         -->
          <input type="text" @focusin="focused" @keyup="navKey"  @input="valueChanged($event,true)" class="inline-mode-editable-span-input can-select" :ref="'input_' + literalValues[0]['@guid']" :data-guid="literalValues[0]['@guid']" />


          <Transition name="action">
              <div :class="{'literal-action-inline-mode':true, 'literal-action-inline-mode-hidden': preferenceStore.returnValue('--b-edit-main-splitpane-camm-hide-action-button')}" v-if="showActionButton && myGuid == activeField">
                <action-button :clickmode="true" :structure="structure" @keyup="navKey" @focusin="focused"  :small="true" :fieldGuid="literalValues[0]['@guid']" :type="'literal'" :guid="guid"  @action-button-command="actionButtonCommand" />
            </div>
          </Transition>


      </template>
      <template v-else>

        <template v-for="lValue in literalValues">

          <span class="bfcode-display-mode-holder-label simptip-position-top" :data-tooltip="structure.propertyLabel"   :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}:</span>

          <span contenteditable="plaintext-only" @focusin="focused" @blur="blured" @keydown="keyDown" class="inline-mode-editable-span can-select" @keyup="navKey" @input="valueChanged" :ref="'input_' + lValue['@guid']" :data-guid="lValue['@guid']">{{lValue.value}}{{(lValue['@language'] != null) ? '@'+lValue['@language'] : ''}}</span>

          <Transition name="action">
              <div :class="{'literal-action-inline-mode':true, 'literal-action-inline-mode-hidden': preferenceStore.returnValue('--b-edit-main-splitpane-camm-hide-action-button')}" v-if="showActionButton && myGuid == activeField">
                <action-button :clickmode="true" :structure="structure"  :small="true" :fieldGuid="lValue['@guid']" :type="'literal'" :guid="guid"  @action-button-command="actionButtonCommand" />
            </div>
          </Transition>

        </template>


      </template>



    </template>


  </template>

  <template v-else>
    <div class="lookup-fake-input" v-if="showField" >
      <div class="literal-holder" @click="focusClick(lValue)" v-for="lValue in literalValues" @focusin="focused">

        <div v-if="pairedLitearlIndicatorLookup[lValue['@guid']] && preferenceStore.returnValue('--b-edit-main-literal-display-paired-literal-line')" class="literal-paired-indicator" :key="'line-holder-'+preferenceStore.returnValue('--c-edit-main-literal-paired-literal-line-color')">

            <div v-if="pairedLitearlIndicatorLookup[lValue['@guid']] >0"  v-html="drawIndicator(pairedLitearlIndicatorLookup[lValue['@guid']],lValue['@guid'])">

            </div>


        </div>



        <!-- <div>Literal ({{propertyPath.map((x)=>{return x.propertyURI}).join('>')}})</div> -->
        <div :class="['literal-field', {'read-only': structure.propertyLabel=='Local identifier'}]">
          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
            <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels')"  class="lookup-fake-input-label" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold')}">{{structure.propertyLabel}}</div>
          </template>
          <form autocomplete="off" >
            <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == true">

              <div class="bfcode-display-mode-holder">
                <div class="bfcode-display-mode-holder-label" :title="structure.propertyLabel">{{profileStore.returnBfCodeLabel(structure)}}</div>
                <div class="bfcode-display-mode-holder-value">
                  <textarea
                    :class="['literal-textarea', 'can-select',{'bfcode-textarea': preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode'), 'literal-bold': preferenceStore.returnValue('--b-edit-main-literal-bold-font')}]"
                    :spellcheck="preferenceStore.returnValue('--b-edit-main-spellcheck')"
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
              <template v-if="structure.propertyURI == 'http://id.loc.gov/ontologies/bflc/nonSortNum'">
                <select id="nonSort-selection" @change="valueChanged" :ref="'input_' + lValue['@guid']" :data-guid="lValue['@guid']" style="margin-top: .5em;">
                  <option v-for="(n, opt) in 10" :value="opt" :selected="opt == lValue['value']">{{ opt }}</option>
                </select>
              </template>
              <template v-else>
                <textarea
                  :class="['literal-textarea', 'can-select',{'literal-bold': preferenceStore.returnValue('--b-edit-main-literal-bold-font'), 'script-text': preferenceStore.returnValue('--n-edit-main-literal-font-size-script') != '1em'}]"
                  :spellcheck="preferenceStore.returnValue('--b-edit-main-spellcheck')"
                  v-model="lValue.value"
                  v-on:keydown.enter.prevent="submitField"
                  autocomplete="off"
                  @focusin="focused"
                  @focus="expandHeightToContent"
                  @blur="blured"
                  @input="valueChanged"
                  @keyup="navKey"
                  @keydown="keyDown"
                  :ref="'input_' + lValue['@guid']"
                  :data-guid="lValue['@guid']"
                  :disabled="readOnly"
                  :readonly="structure.propertyLabel=='Local identifier'"
                  ></textarea>
              </template>

            </template>





          </form>
        </div>
        <span class="lang-display" v-if="lValue['@language'] && lValue['@language'] !== null">{{ lValue['@language'] }}</span>
        <span v-if="structure.propertyLabel == 'ISBN'" :data-tooltip="isValidIsbn(lValue.value) ? 'VALID ISBN' : 'INVALID ISBN'" :class="['simptip-position-left', 'material-icons', 'isbn-check', {'isbn-valid': isValidIsbn(lValue.value)}, {'isbn-invalid': !isValidIsbn(lValue.value)}]">{{ isValidIsbn(lValue.value) ? 'check_circle' : 'cancel' }}</span>

        <Transition name="action">
          <div class="literal-action" v-if="showActionButton && myGuid == activeField">
            <action-button :type="'literal'" :structure="structure" :fieldGuid="lValue['@guid']"  :guid="guid"  @action-button-command="actionButtonCommand" />
          </div>
        </Transition>
      </div>
    </div>
    <!-- {{ lccFeatureData }} -->
    <div class="lcc-action-zone" v-if="lccFeatureData !== false && preferenceStore.returnValue('--b-shelflist-show-cutter-helpers')">

      <div v-if="structure.propertyURI=='http://id.loc.gov/ontologies/bibframe/classificationPortion'">

        <a style="color:black" v-if="lccFeatureData.classNumber" :href="'https://' + classWebURL() + '/min/minaret?app=Class&mod=Search&look=1&query=&index=id&cmd2=&auto=1&Fspan='+lccFeatureData.classNumber+'&Fcaption=&Fkeyword=&Fterm=&Fcap_term=&count=75&display=1&table=schedules&logic=0&style=0&cmd=Search'">ClassWeb Search: {{ lccFeatureData.classNumber }}</a><br/>
        <a style="color:black" v-if="lccFeatureData.classNumber" :href="'https://' + classWebURL() + '/min/minaret?app=Class&auto=1&mod=Search&table=schedules&table=tables&tid=1&menu=/Menu/&iname=span&ilabel=Class%20number&iterm='+lccFeatureData.classNumber" target="_blank">ClassWeb Browse: {{ lccFeatureData.classNumber }}</a><br/>

        <a style="color:black" v-if="lccFeatureData.firstSubject" :href="'https://' + classWebURL() + '/min/minaret?app=Corr&mod=Search&count=75&auto=1&close=1&display=1&menu=/Auto/&iname=nh2l&iterm='+lccFeatureData.firstSubject" target="_blank">ClassWeb Search: {{ lccFeatureData.firstSubject }}</a><br/>
        <a style="color:black" v-if="lccFeatureData.secondSubject" :href="'https://' + classWebURL() + '/min/minaret?app=Corr&mod=Search&count=75&auto=1&close=1&display=1&menu=/Auto/&iname=nh2l&iterm='+lccFeatureData.secondSubject" target="_blank">ClassWeb Search: {{ lccFeatureData.secondSubject }}</a><br/>
      </div>

      <div v-if="structure.propertyURI=='http://id.loc.gov/ontologies/bibframe/itemPortion'">
        <!-- { "title": "knitter's handy book of patterns", "classNumber": "TT820", "cutterNumber": ".B877 2002", "titleNonSort": 4, "contributors": [ { "type": "PrimaryContribution", "label": "Budd, Ann, 1956-" } ], "firstSubject": "Knitting--Patterns" } -->
        <div style="display: flex;">
          <div style="flex:1">
          <fieldset v-if="(lccFeatureData.contributors && lccFeatureData.contributors.length>0) || lccFeatureData.title || lccFeatureData.firstSubject" >
            <legend>Cutter Calculator</legend>
            <template v-if="lccFeatureData.contributors">

              <template v-if="lccFeatureData.contributors[0]">
                <div>
                  <span style="font-weight: bold;">{{lccFeatureData.contributors[0].label.substring(0,parseInt(cutterCalcLength))}}</span>
                  <span>{{lccFeatureData.contributors[0].label.substring(parseInt(cutterCalcLength))}}</span>
                  <input type="text" :value="usePeriodInCutter() + calculateCutter(lccFeatureData.contributors[0].label,cutterCalcLength).substring(0,cutterCalcLength)">
                  <a style="font-size: 0.85em; padding-left: 0.5em;" @click.prevent="setLccInfo(lccFeatureData.cutterGuid,calculateCutter(lccFeatureData.contributors[0].label,cutterCalcLength).substring(0,cutterCalcLength))" href="#">Use</a>
                </div>

                <div>
                  <span style="font-weight: bold;">{{lccFeatureData.contributors[0].secondLetterLabel.substring(0,parseInt(cutterCalcLength))}}</span>
                  <span>{{lccFeatureData.contributors[0].secondLetterLabel.substring(parseInt(cutterCalcLength))}}</span>
                  <input type="text" :value="usePeriodInCutter() + calculateCutter(lccFeatureData.contributors[0].secondLetterLabel,cutterCalcLength).substring(0,cutterCalcLength)">
                  <a style="font-size: 0.85em; padding-left: 0.5em;" @click.prevent="setLccInfo(lccFeatureData.cutterGuid,calculateCutter(lccFeatureData.contributors[0].secondLetterLabel,cutterCalcLength).substring(0,cutterCalcLength))" href="#">Use</a>
                </div>




              </template>
              <template v-if="lccFeatureData.contributors[1]">
                <div>
                  <span style="font-weight: bold;">{{lccFeatureData.contributors[1].label.substring(0,cutterCalcLength)}}</span>
                  <span>{{lccFeatureData.contributors[1].label.substring(parseInt(cutterCalcLength))}}</span>
                  <input type="text" :value="usePeriodInCutter() + calculateCutter(lccFeatureData.contributors[1].label,parseInt(cutterCalcLength)).substring(0,parseInt(cutterCalcLength))">
                  <a style="font-size: 0.85em; padding-left: 0.5em;" @click.prevent="setLccInfo(lccFeatureData.cutterGuid,calculateCutter(lccFeatureData.contributors[1].label,parseInt(cutterCalcLength)).substring(0,parseInt(cutterCalcLength)))" href="#">Use</a>
                </div>
              </template>
              <template v-if="lccFeatureData.title">
                <div>
                  <span style="font-weight: bold;">{{lccFeatureData.title.substring(0,parseInt(cutterCalcLength))}}</span>
                  <span>{{lccFeatureData.title.substring(parseInt(cutterCalcLength),parseInt(cutterCalcLength)+12)}}</span>
                  <input type="text" :value="usePeriodInCutter() + calculateCutter(lccFeatureData.title,parseInt(cutterCalcLength)).substring(0,parseInt(cutterCalcLength))">
                  <a style="font-size: 0.85em; padding-left: 0.5em;" @click.prevent="setLccInfo(lccFeatureData.cutterGuid,calculateCutter(lccFeatureData.title,parseInt(cutterCalcLength)).substring(0,parseInt(cutterCalcLength)))" href="#">Use</a>
                </div>
              </template>

              <div>
                  <span style="font-weight: bold;">{{freeFormCutter.substring(0,parseInt(cutterCalcLength))}}</span>
                  <span>{{freeFormCutter.substring(parseInt(cutterCalcLength),parseInt(cutterCalcLength)+12)}}</span>
                  <input placeholder="Free Form Cutter Input" v-model="freeFormCutter">
                  <input type="text" :value="usePeriodInCutter() + calculateCutter(freeFormCutter,parseInt(cutterCalcLength)).substring(0,parseInt(cutterCalcLength))">
                  <a style="font-size: 0.85em; padding-left: 0.5em;" @click.prevent="setLccInfo(lccFeatureData.cutterGuid,calculateCutter(freeFormCutter,parseInt(cutterCalcLength)).substring(0,parseInt(cutterCalcLength)))" href="#">Use</a>
                </div>


            </template>

            <div>
              <input type="range" v-model="cutterCalcLength" id="cutterCalcLength" name="cutterCalcLength" min="0" max="6" step="1" />
              <label for="cutterCalcLength" style="font-size: 0.8em; vertical-align: text-top;">Calc Length ({{ cutterCalcLength }})</label>
            </div>


          </fieldset>
          </div>
          <div>
            <ul>
              <template v-for="(item, idx) in preferences">
                <li v-if="item[1] && preferenceStore.returnValue(item[1]) != ''">
                  <a :href="preferenceStore.returnValue(item[1])" target="_blank">
                    {{ preferenceStore.returnValue(item[0]) != "" ? preferenceStore.returnValue(item[0]) : preferenceStore.returnValue(item[1])}}
                    <span class="material-icons" style="font-size: 14px;">open_in_new</span>
                  </a>
                </li>
              </template>
            </ul>
          </div>
          <div style="flex:1;     display: flex;justify-content: center;align-items: center;">
              <button @click="openShelfListSearch">Shelf List Search</button>
          </div>
        </div>
      </div>
    </div>


  </template>


</template>

<script>


import short from 'short-uuid'


import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'
import { useConfigStore } from '@/stores/config'

import { mapStores, mapState, mapWritableState } from 'pinia'

import utilsMisc from '@/lib/utils_misc'
import utilsNetwork from '@/lib/utils_network'


import ActionButton from "@/components/panels/edit/fields/helpers/ActionButton.vue";
import { readonly } from 'vue'

import isoLangLib from "@/lib/iso_lang.json"



function createRange(node, chars, range) {
    if (!range) {
        range = document.createRange()
        range.selectNode(node);
        range.setStart(node, 0);
    }

    if (chars.count === 0) {
        range.setEnd(node, chars.count);
    } else if (node && chars.count >0) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.length < chars.count) {
                chars.count -= node.textContent.length;
            } else {
                range.setEnd(node, chars.count);
                chars.count = 0;
            }
        } else {
           for (var lp = 0; lp < node.childNodes.length; lp++) {
                range = createRange(node.childNodes[lp], chars, range);

                if (chars.count === 0) {
                    break;
                }
            }
        }
    }

    return range;
};


function setCurrentCursorPosition(chars,el) {
    if (chars >= 0) {
        var selection = window.getSelection();

        let range = createRange(el, { count: chars });

        if (range) {
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
};














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

    classWebURL(){
      let url = "classweb.org"

      if (useConfigStore().returnUrls.env == 'staging'){
        url = "test." + url
      }

      return url
    },

    isValidIsbn(isbn) {
        const result = this.profileStore.isValidIsbn(isbn)
        this.validIsbn = result
        return result
    },

    usePeriodInCutter(){

      if (this.lccFeatureData && this.lccFeatureData.classNumber && this.lccFeatureData.classNumber.indexOf(".") > -1){
        return ''
      }else{
        return '.'
      }


    },

    openShelfListSearch(){
      this.activeShelfListData = {
        class: this.lccFeatureData.classNumber,
        cutter:this.lccFeatureData.cutterNumber,
        classGuid:this.lccFeatureData.classGuid,
        cutterGuid: this.lccFeatureData.cutterGuid,
        componentPropertyPath: this.propertyPath,
        componentGuid: this.guid,
        contributor: this.lccFeatureData.contributors.length > 0 ? this.lccFeatureData.contributors[0].label : "",
        title: this.lccFeatureData.title,
        subj: this.lccFeatureData.firstSubject,
        date: ""  //not in `lccFeatureData`
      }
      this.showShelfListingModal = true


    },


    async setLccInfo(fieldGuid,lccVal){

      this.lccFeatureDataCounter++
      if (fieldGuid == null){
        fieldGuid = short.generate()
      }
      lccVal = `${this.usePeriodInCutter()}${lccVal}`
      await this.profileStore.setValueLiteral(this.guid,fieldGuid,this.propertyPath,lccVal,null)
    },

    async tempCutterCalcLength(){
      return await this.preferenceStore.returnValue('--b-shelflist-cutter-length')
    },

    calculateCutter(toCut,howLong){
      return utilsMisc.calculateCutter(toCut,howLong)
    },

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


      if (event && event.keyCode == 220 && event.ctrlKey == true){
        let id = `action-button-${event.target.dataset.guid}`
        document.getElementById(id).click()
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
      window.setTimeout(()=>{
        for (let key of Object.keys(this.$refs)){
          if (key.startsWith('input_')){
            if (this.$refs[key] && this.$refs[key][0]){
              this.$refs[key][0].style.height =  this.$refs[key][0].scrollHeight + "px"
            }
          }
        }
      }, 50)

    },

    runMacroExpressMacro(event){

      for (let macro of this.diacriticUseValues){
            if (event.code == macro.code && event.ctrlKey == macro.ctrlKey && event.altKey == macro.altKey && event.shiftKey == macro.shiftKey){
              // console.log("run this macro", macro)


              // if we are in CAMM mode then the fields will be editable SPANs which do not have .value they have .innerText
              // so we temporarly put .innerText into the .value attr to work on it then pull it back out into .innerText at the end of the editing
              let insertAt
              if (event.target.tagName === 'SPAN'){
                event.target.value = event.target.innerText
                insertAt = this.getCaretCharOffset(event.target)
              }else{
                insertAt = event.target.value.length
              }


              if (event.target && event.target.selectionStart){
                insertAt=event.target.selectionStart
              }
              console.log("insertAt",insertAt)
              let inputV
              if (event.target){
                inputV = event.target
              }else{
                console.warn("ERROR: Field not found")
                return false
              }



              if (!macro.combining){

                // there is behavior where if it is a digit shortcut the numerial is still sent
                // so if thats the case remove the last digit from the value
                if (event.code.includes('Digit')){
                  // if it is in fact a digit char then remove it
                  if (inputV.value.charAt(insertAt) == event.code.replace('Digit','')){
                    // remove the last char
                    // inputV.value = inputV.value.slice(0, -1);
                    inputV.value = inputV.value.slice(0,insertAt) + inputV.value.slice(insertAt)

                  }
                }

                // same for euqal key
                if (event.code == 'Equal'){
                  if (inputV.value.charAt(inputV.value.length-1) == '='){
                    // remove the last char
                    // inputV.value = inputV.value.slice(0, -1);
                    inputV.value = inputV.value.slice(0,insertAt) + inputV.value.slice(insertAt)

                  }
                }
                // same for Backquote key

                if (event.code == 'Backquote'){

                  if (inputV.value.charAt(inputV.value.length-1) == '`'){
                    // remove the last char
                    // inputV.value = inputV.value.slice(0, -1);
                    inputV.value = inputV.value.slice(0,insertAt) + inputV.value.slice(insertAt)
                  }

                }


                // it is not a combining unicode char so just insert it into the value
                if (inputV.value){
                  // inputV.value=inputV.value+macro.codeEscape

                  inputV.value = inputV.value.substring(0, insertAt) + macro.codeEscape + inputV.value.substring(insertAt);


                  if (insertAt){
                    this.$nextTick(()=>{

                      if (event.target.tagName === 'SPAN'){
                        // Here we put it back in to .innerText and we need to use a
                        // special setRange fucntion as well because contenteditabl dont have .setSelectionRange either
                        event.target.innerText = event.target.value
                        setCurrentCursorPosition(insertAt+1,event.target)
                      }else{
                        inputV.setSelectionRange(insertAt+1,insertAt+1)
                      }


                      this.$nextTick(()=>{
                        inputV.focus()
                      })

                    })
                  }else{

                      this.$nextTick(()=>{
                        inputV.focus()
                      })

                  }




                  }else{
                    inputV.value = macro.codeEscape
                  }

                }else{


                  // same for Backquote key

                  if (event.code == 'Backquote'){
                    if (inputV.value.charAt(inputV.value.length-1) == '`'){
                      // remove the last char
                      inputV.value = inputV.value.slice(0, -1);
                    }
                  }


                  // little cheap hack here, on macos the Alt+9 makes ª digits 1-0 do this with Alt+## but we only
                  // have one short cut that uses Alt+9 so just remove that char for now
                  inputV.value=inputV.value.replace('ª','')

                  inputV.value = inputV.value.substring(0, insertAt) + macro.codeEscape + inputV.value.substring(insertAt);
                  // inputV.value=inputV.value+macro.codeEscape

                  if (event.target.tagName === 'SPAN'){
                    // Here we put it back in to .innerText and we need to use a
                    // special setRange fucntion as well because contenteditabl dont have .setSelectionRange either
                    event.target.innerText = event.target.value
                    setCurrentCursorPosition(insertAt+1,event.target)
                  }else{
                    inputV.setSelectionRange(insertAt+1,insertAt+1)
                  }


                  inputV.focus()


                  if (insertAt){
                    this.$nextTick(()=>{

                      if (event.target.tagName === 'SPAN'){
                        setCurrentCursorPosition(insertAt+1,event.target)
                      }else{
                        inputV.setSelectionRange(insertAt+1,insertAt+1)
                      }



                      this.$nextTick(()=>{
                        inputV.focus()
                      })

                    })
                  }else{

                    this.$nextTick(()=>{
                      inputV.focus()
                    })

                  }
                }

                event.preventDefault()
                event.stopPropagation()
                return false
            }
          }



      },




    // we need to check to see if they are attempting to do a couple different types of macros, if they are then stop the event but kick off the macro action
    keyDown: function(event){

      if (this.nextInputIsVoyagerModeDiacritics){



        // they are pressing shift in about to press antoher macro shrotcut
        if (event.key == 'Shift'){
          return false
        }

        if (this.diacriticPacks.voyager[event.code]){


          let useMacro
          for (let macro of this.diacriticPacks.voyager[event.code]){
            if (macro.shiftKey == event.shiftKey){
              useMacro = macro
              break
            }
          }

          let inputV = event.target
          let insertAt
          if (event.target.tagName === 'SPAN'){
            insertAt = this.getCaretCharOffset(event.target)
          }else{
            insertAt = event.target.value.length
          }

          if (event.target && event.target.selectionStart){
            insertAt=event.target.selectionStart
          }

          if (!useMacro.combining){

            if (event.target.tagName === 'SPAN'){
              inputV.innerText = inputV.innerText.substring(0, insertAt) + useMacro.codeEscape + inputV.innerText.substring(insertAt);
            }else{
              // it is not a combining unicode char so just insert it into the value
              if (inputV.value){
                // inputV.value=inputV.value+useMacro.codeEscape
                inputV.value = inputV.value.substring(0, insertAt) + useMacro.codeEscape + inputV.value.substring(insertAt);
              }else{
                inputV.value = useMacro.codeEscape
              }
            }
          }else{
            if (event.target.tagName === 'SPAN'){
              inputV.innerText = inputV.innerText.substring(0, insertAt) + useMacro.codeEscape + inputV.innerText.substring(insertAt);
            }else{
              if (inputV.value){
                  inputV.value = inputV.value.substring(0, insertAt) + useMacro.codeEscape + inputV.value.substring(insertAt);
                }else{

                }
            }
          }

          if (insertAt){
          this.$nextTick(()=>{
            if (event.target.tagName === 'SPAN'){
              setCurrentCursorPosition(insertAt+1,event.target)
            }else{
              inputV.setSelectionRange(insertAt+1,insertAt+1)
            }


            this.$nextTick(()=>{
              inputV.focus()
            })

          })
          }else{

            this.$nextTick(()=>{
              inputV.focus()
            })

          }



        }


        // turn off mode
        this.nextInputIsVoyagerModeDiacritics  =false
        this.valueChanged(event)
        event.target.style.removeProperty('background-color')
        event.preventDefault()
        return false
      }



        if (event.ctrlKey == true){
          if (this.diacriticUse.length>0){
            for (let macro of this.diacriticUseValues){
              if (event.code == macro.code && event.ctrlKey == macro.ctrlKey && event.altKey == macro.altKey && event.shiftKey == macro.shiftKey){
                // console.log("run this macro", macro)
                event.preventDefault()

                this.runMacroExpressMacro(event)
                this.valueChanged(event)
                return false

              }
            }
          }

          if (event.code == 'KeyE'){
            if (!this.preferenceStore.returnValue('--b-diacritics-disable-voyager-mode')){

              event.target.style.backgroundColor="chartreuse"
              this.nextInputIsVoyagerModeDiacritics = true
              event.preventDefault()
              return false
            }

          }

          //

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
        v=v.replace(/\n/g,' ').trim()
      }

      let useTextMacros=this.preferenceStore.returnValue('--o-diacritics-text-macros')
      let addedTextMacroIncreasedSizeBy = 0

      if (useTextMacros && useTextMacros.length>0){
        for (let m of useTextMacros){
          let oldV = v
          v = v.replace(m.lookFor,m.replaceWith)
          // if we acutally did replace something keep track of the length so we can reposition the cursor later if needed
          if (oldV != v){
            addedTextMacroIncreasedSizeBy=addedTextMacroIncreasedSizeBy+m.replaceWith.length-m.lookFor.length
          }

        }
      }
      // if the value is empty then wait 2 seconds and check if it is empty again, if it is then continue with the removal
      if (v == ''){
        await new Promise(r => setTimeout(r, 2000));
        if (event && event.target && event.target.value != ''){
          return false
        }
      }

      let useLang = event.target.dataset.lang

      if (this.preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == true){

        // this is used in CAMM mode you can add @en-latn language and script via text
        if (/@[A-z-]{2,}$/.test(v)){
          let foundLang = v.match(/@[A-z-]{2,}$/)
          if (foundLang){
            // pull it out of the regex match
            foundLang = foundLang[0]
            // remove it from the value
            v = v.replace(foundLang,'')
            useLang = foundLang.toLowerCase().replace("@",'')


          }
        }else{
          // there is no language now, but was there before? and they are removing it or there never was
          for (let l of this.literalValues){
            if (l['@guid'] == event.target.dataset.guid && l['@language'] !== null){
              // they currently have a language on this string and are removing it
              // set the value to the remove command so setValueLiteral knows to remove it
              useLang = 'REMOVE_COMMAND'
            }
          }
        }

        // double check that the language and script about to be added is acutally a valid lang tag
        // this can be manually changed in camm mode, so if it itsn't set the error but don't stop them
        if (useLang && useLang != 'REMOVE_COMMAND'){

          let lang = useLang.split("-")[0]
          let script = useLang.split("-")[1]

          let validLang = false
          let validScript = false
          if (lang){
            lang=lang.trim()
            for (let l of isoLangLib.iso639_1){
              if (lang == l.code){
                validLang=true
                break
              }
            }
            if (!validLang){
                for (let l of isoLangLib.iso639_2){
                if (lang == l.alpha_3){
                  validLang=true
                  break
                }
              }
            }
          }


          if (script){
            script=script.trim().toLowerCase()
            for (let l of isoLangLib.iso15924){
              if (script == l.alpha_4.toLowerCase()){
                validScript=true
                break
              }
            }


          }else{
            // no script found, its fine then
            validScript=true
          }

          if (!validScript || !validLang){
            // if they are typing it in we don't want to flash the warning with each keystroke, so wait
            // until after they are done typing and trigger the validation warning if needed
            window.clearTimeout(this.cammModeLangScriptValidationTimeout)
            this.cammModeLangScriptValidationTimeout = window.setTimeout(()=>{
              this.profileStore.addCammModeError(this.guid,'Invalid Language or Script code, needs to use ISO639 & ISO15924: ' + useLang )

            },1000)

          }else{
            window.clearTimeout(this.cammModeLangScriptValidationTimeout)
            this.profileStore.clearCammModeError(this.guid)
          }

        }
      }



      let currentPos = 0
      if (event.target.tagName === 'SPAN'){
        currentPos = this.getCaretCharOffset(event.target)
      }
      // console.log("3 v:",v)
      await this.profileStore.setValueLiteral(this.guid,event.target.dataset.guid,this.propertyPath,v,useLang)

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

      // make sure the cursor is in the right place
      // it seems like when the content editable span is updated via the vue variable the cursor pos is lost
      // so reset it back to where it was before the content was updated
      if (event.target.tagName === 'SPAN'){


        if (addedTextMacroIncreasedSizeBy>0){
          setCurrentCursorPosition(currentPos+addedTextMacroIncreasedSizeBy,event.target)
        }else{
          if (currentPos > event.target.innerText.length){
            currentPos= event.target.innerText.length
          }
          setCurrentCursorPosition(currentPos,event.target)
        }


      }

      window.setTimeout(()=>{
        this.expandHeightToContent()
      }, 100)
      // this.expandHeightToContent()
    },



    actionButtonCommand: async function(cmd,options){
      if (cmd == 'addField'){
        this.profileStore.setValueLiteral(this.guid,short.generate(),this.propertyPath,"new value",null,true)
      }

      if (cmd == 'trans'){

        let fieldValue = this.literalValues.filter((v)=>{ return (v['@guid'] == options.fieldGuid) })
        if (options.event && options.event?.target?.dataset?.shortcutActivated == 'true'){
          // check if the string value (fieldValue[0].value) ends with a single digit number
          if (/[0-9]$/.test(fieldValue[0].value)){
            // check if it is the same number used as the shortcut (options.actionButtonIndex)
            if (fieldValue[0].value.endsWith('' + options.actionButtonIndex)){
              // remove the last digit from the string
              fieldValue[0].value = fieldValue[0].value.slice(0, -1);
            }
          }
        }

        let useTextToTrans = fieldValue[0].value

        // check if any text is highlighted in the textarea
        let textarea = document.querySelector(`textarea[data-guid="${fieldValue[0]['@guid']}"]`)        
        let highlightTemplate = null
        if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
          let highlightedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)


          // if there is multiple values in the literalValues and they have @language meaning they are transliterated already
          if (this.literalValues.length > 1){
            let hasLatin = false
            let hasNonLatin = false

            for (let lv of this.literalValues){
              if (lv['@language'] && lv['@language'].toLowerCase().includes('latn')){
                hasLatin=true
              }else if (lv['@language'] && !lv['@language'].toLowerCase().includes('latn')){
                hasNonLatin=true
              } 
            }
            if (hasLatin && hasNonLatin){
              
              // get the script information from the other field that is not this one
              let otherFieldValue = this.literalValues.filter((v)=>{ return (v['@guid'] != options.fieldGuid) })

              if (otherFieldValue){

                // get the transliterated value from the highlited text

                  // let transValue = await utilsNetwork.scriptShifterRequestTrans(options.lang,highlightedText,null,options.dir)
  
                  // console

                // loop through all of this.scriptShifterLangCodes and see if we can find the code == the other field
                let otherScriptCodes = []
                for (let key in this.scriptShifterLangCodes){
                  let codeObj = this.scriptShifterLangCodes[key]
                  // console.log("codeObj", codeObj)
                  // console.log("otherFieldValue[0]['@language']", otherFieldValue[0]['@language'])
                  if (fieldValue[0]['@language'] && codeObj.code.toLowerCase() == fieldValue[0]['@language'].toLowerCase()){
                    otherScriptCodes.push(key)                  

                  }else{
                    console.log(codeObj.code.toLowerCase(), "!= ", otherFieldValue[0]['@language'].toLowerCase())
                  }
                }
          

                // remove the current req from the otherScriptCodes
                otherScriptCodes = otherScriptCodes.filter((code)=>{ return code != options.lang })
                let didReplaceTransliteration = false
                // send a utilsNetwork.scriptShifterRequestTrans for each otherScriptCodes
                for (let osc of otherScriptCodes){
                  let transValue = await utilsNetwork.scriptShifterRequestTrans(osc,highlightedText,null,options.dir)
                  // now replace the highlighted text in the otherField
                  console.log("transliterated text highlightedText:", osc, transValue)
                  // see if we can find transValue text in the other field value
                  if (otherFieldValue[0].value.indexOf(transValue.output) > -1){
                    
                    // okay we found it then do the transliteration for this value highleted text and get the results
                    let thisTransValue = await utilsNetwork.scriptShifterRequestTrans(options.lang,highlightedText,null,options.dir)
                    if (thisTransValue.warnings && thisTransValue.warnings.length > 0){
                      alert("Warning from transliteration: " + thisTransValue.warnings.join(", "))
                      break
                    }
                    // and replce the transValue.output text in the other field with thisTransValue.output using this.profileStore.setValueLiteral
                    let newOtherValue = otherFieldValue[0].value.replace(transValue.output, thisTransValue.output)
                    this.profileStore.setValueLiteral(this.guid,otherFieldValue[0]['@guid'],this.propertyPath,newOtherValue,otherFieldValue[0]['@language'] )
                    
                    didReplaceTransliteration = true
                    break

                  }
                }
                if (didReplaceTransliteration){
                  return false
                }



              }else{
                alert("Error: Could not find the other field value for this literal, cannot do transliteration overwrite.")
              }
              // and they are currently in the 

            }
          }

          useTextToTrans = highlightedText
          highlightTemplate = fieldValue[0].value.replace(highlightedText, '<TRANSLITERATED_TEXT_HERE>')
        }



        let transValue = await utilsNetwork.scriptShifterRequestTrans(options.lang,useTextToTrans,null,options.dir)

        if (highlightTemplate){
          transValue.output = highlightTemplate.replace('<TRANSLITERATED_TEXT_HERE>', transValue.output)
        }


        let toLang = null
        let fromLang = null
        if (this.scriptShifterLangCodes[options.lang]){
          fromLang = this.scriptShifterLangCodes[options.lang].code
          toLang = this.scriptShifterLangCodes[options.lang].code.split("-")[0] + "-Latn"
          if (options.dir && options.dir.toLowerCase() == 'r2s'){
            toLang = this.scriptShifterLangCodes[options.lang].code
            fromLang = this.scriptShifterLangCodes[options.lang].code.split("-")[0] + "-Latn"
          }

        }

        console.log("index number pressed is:", options.actionButtonIndex)

        // add the new string
        this.profileStore.setValueLiteral(this.guid,short.generate(),this.propertyPath,transValue.output,toLang,true)

        // but also make sure the old string has the language tag
        this.profileStore.setValueLiteral(this.guid,fieldValue[0]['@guid'],this.propertyPath,fieldValue[0]['value'],fromLang)

        // make sure the new literal fits
        this.$nextTick().then(() => {
          this.expandHeightToContent()
        })



      }

      if (cmd == 'setLiteralLang'){


        this.literalLangInfo={
          propertyPath: this.propertyPath,
          componentGuid: this.guid,
          values: this.profileStore.returnLiteralValueFromProfile(this.guid,this.propertyPath)
        }
        this.literalLangShow=true
      }

      try{
        // this will fail when adding an additional literal and the current field is empty
        this.$refs['input_' + this.literalValues[0]['@guid']][0].focus()
      }catch(err){
        console.error("Adding a field from an empty field: ", err)
      }
    },

    getCaretCharOffset(element) {
      var caretOffset = 0;

      if (window.getSelection) {
        var range = window.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      }

      else if (document.selection && document.selection.type != "Control") {
        var textRange = document.selection.createRange();
        var preCaretTextRange = document.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
      }

      return caretOffset;
    },

    drawIndicator(count, elGuid){


      let color = this.preferenceStore.returnValue('--c-edit-main-literal-paired-literal-line-color')


      // this will fire off after the element has been rendrered so we know how large it is
      this.$nextTick().then(() => {


        let textEl = document.querySelector('[data-guid="' + elGuid + '"]')
        let elementSize = null
        if (textEl){
          elementSize = textEl.getBoundingClientRect()
        }

        let literalSize = this.preferenceStore.returnValue('--n-edit-main-literal-font-size',true)

        let svgHeight = 175
        let svgWidth = 30

        let length = 100
        let start = 5

        // ratio up the distance of the line and start of the line when the font-size is set bigger
        if (elementSize){
          if (elementSize.height > 30){
            length =  elementSize.height * 4
          }
          if (elementSize.height > 50){
            length =  elementSize.height * 3
          }

          // if (elementSize.height > 90){
          //   length =  elementSize.height * 4
          // }

          // if (elementSize.height > 100){
          //   length =  elementSize.height * 3
          // }
        }


        let svgEl = document.getElementById('literal-lines-' + elGuid)

        if (svgEl){
          svgEl.parentNode.innerHTML = `

            <style scoped>
              svg.paired-line {
                position: absolute;
                z-index: 50;
                top: -5px;
                left: -10px;
                pointer-events: none;
              }
            </style>

            <svg xmlns:dc="http://purl.org/dc/elements/1.1/" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xl="http://www.w3.org/1999/xlink" viewBox="-2 -7.417834 70 480" width="${svgWidth}" height="${svgHeight}" class="paired-line">
              <defs>
                <marker orient="auto" overflow="visible" markerUnits="strokeWidth" id="FilledArrow_Marker" stroke-linejoin="miter" stroke-miterlimit="10" viewBox="-1 -3 6 6" markerWidth="6" markerHeight="6" color="black">
                  <g>
                    <path d="M 3.2 0 L 0 -1.2 L 0 1.2 Z" fill="${color}" stroke="${color}" stroke-width="1"/>
                  </g>
                </marker>
                <marker orient="auto" overflow="visible" markerUnits="strokeWidth" id="FilledArrow_Marker_2" stroke-linejoin="miter" stroke-miterlimit="10" viewBox="-5 -3 6 6" markerWidth="6" markerHeight="6" color="black">
                  <g>
                    <path d="M -3.2 0 L 0 1.2 L 0 -1.2 Z" fill="${color}" stroke="${color}" stroke-width="1"/>
                  </g>
                </marker>
              </defs>
              <g id="Canvas_1" stroke-opacity="1" stroke-dasharray="none" fill="none" fill-opacity="1" stroke="none">
                <title>Canvas 1</title>
                <g id="Canvas_1_Layer_1">
                  <title>Layer 1</title>
                  <g id="Line_5">
                    <path d="M 21 ${start} L 0 ${start} L 0 ${length} L 21 ${length}" marker-end="url(#FilledArrow_Marker)" marker-start="url(#FilledArrow_Marker_2)" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
                  </g>
                </g>
              </g>
            </svg>
            `


        }







      });

      return `<svg id="literal-lines-${elGuid}"/>`



    },
  },
  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(useProfileStore),
    ...mapStores(usePreferenceStore),

    ...mapState(useConfigStore, ['scriptShifterLangCodes', 'lccFeatureProperties']),
    ...mapWritableState(useProfileStore, ['showShelfListingModal','activeField','activeProfile', 'literalLangShow', 'literalLangInfo','dataChangedTimestamp','activeShelfListData','pairedLitearlIndicatorLookup']),
    ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse','diacriticPacks', 'showPrefModal','showPrefModalgroup','styleDefault', 'showPrefModalGroup', 'fontFamilies', 'returnValue']),

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

      // if (preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')){

      //   values = values.map((v) = > {if (v['@lang']){  v.l  }else{ }})
      // }


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

    lccFeatureData(){
      this.lccFeatureDataCounter
      if (this.lccFeatureProperties.indexOf(this.propertyPath[this.propertyPath.length-1].propertyURI)>-1){

        let data = this.profileStore.returnLccInfo(this.guid, this.structure)
        // console.log("HERE for LCC data", data,  this.guid, this.structure)
        if (data.contributors && data.contributors.length>0){
          data.contributors[0].secondLetterLabel = data.contributors[0].label.substring(1)
        }

        return data
      }
      return false
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

    },

  },


  watch: {


    // literalValues(newliteralValues, oldliteralValues) {
    //   console.log(newliteralValues, this.guid, this.structure)
    //   if (this.lccFeatureProperties.indexOf(this.propertyPath[this.propertyPath.length-1].propertyURI)>-1){
    //     this.lccFeatureData = this.profileStore.returnLccInfo(this.guid, this.structure)
    //   }
    // }
    dataChangedTimestamp(newVal, oldVal) {
      this.lccFeatureDataCounter++
    }



  },

  data: function() {
    return {

      activeGuid: this.guid,

      freeFormCutter: '',

      // used as toggle to show the button when field is focused
      showActionButton: false,

      lccFeatureDataCounter: 0,

      hasNoData: false,
      showField: true,

      cutterCalcLength: 3, //this.styleDefault['--b-shelflist-cutter-length'],
      nextInputIsVoyagerModeDiacritics: false,

      preferences: {},

      cammModeLangScriptValidationTimeout: null,

    }
  },

  mounted: function(){
    this.$nextTick().then(() => {
      this.expandHeightToContent()

      window.setTimeout(()=>{
        this.expandHeightToContent()
      },100)

    })



    //get the preferences to load into the page
    for (let k in this.styleDefault){
      if (k.includes("shelflist-link")){
        let o = Object.assign({}, this.styleDefault[k])
        if (o.index in this.preferences){
          //save `k` so the information in the page will match the preferences in real time
          this.preferences[o.index].push(k)
        } else {
          this.preferences[o.index] = [k]
        }
      }
    }
  },
  created: function(){
    this.cutterCalcLength = this.preferenceStore.returnValue('--b-shelflist-cutter-length')

    this.$nextTick().then(() => {
      this.expandHeightToContent()
    })
  },
};
</script>

<style scoped>





.literal-paired-indicator{
  width: 1em;
  position: relative;
  margin-left: 1em;
}

fieldset{
  border: solid 1px rgb(133, 133, 133);
}
.literal-textarea{
  background-color: transparent;
}

.lcc-action-zone{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color-accent')");
  padding: 0.55em;
  border-left: solid 1px rgb(133, 133, 133);
  border-right: solid 1px rgb(133, 133, 133);
  color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')");
}
.lcc-action-zone a{
  color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')") !important;

}
.lcc-action-zone input{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color')");
  border: solid 1px;
  color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')") !important;

}


.lang-display{
  border-radius: 1em;
  padding: 2px;

  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-lang-label-font-size')");

  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-literal-lang-label-background-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-literal-lang-label-font-color')");
}

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
  display: inline-block;
  /* padding: 0.2em; */
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size')");
  outline: none;
  margin-right: 15px;
  padding-right: 1em;
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

.literal-field:has( + .lang-display) > form > textarea.script-text{
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size-script')");
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
  color: v-bind("preferenceStore.returnValue('--c-edit-main-literal-font-color')");

  height: 1.25em;
  line-height: 1.25em;
  margin-top: 0.5em;
}

.lookup-fake-input{
  min-height: 2em;
  /* background-color: transparent; */
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
  width: 100%;
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
.literal-action-inline-mode-hidden{
  width: 1px;


}

#nonSort-selection{
  margin-top: .5em;
  margin-bottom: .25em;
  height: auto !important;
  background-color: transparent;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-literal-font-color')");
}
.component .lookup-fake-input{
  border-top:solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')") !important;
}

.read-only,
.read-only form textarea{
  background: lightgray;
  cursor: no-drop;
}

.literal-bold{
  font-weight: bold;
}


.isbn-invalid {
    color: red;
}

.isbn-valid {
    color: green;
}

</style>
