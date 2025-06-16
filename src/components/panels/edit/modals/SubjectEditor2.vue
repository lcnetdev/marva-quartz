<template>
  <VueFinalModal :hide-overlay="false" :overlay-transition="'vfm-fade'" :content-transition="'vfm-fade'"
    :click-to-close="true" :esc-to-close="true" @closed="closeSubjectBuilder()" :background="'non-interactive'"
    :lock-scroll="true" class="subject-builder-modal" content-class="subject-builder-modal-content">
    <div ref="subjectBuilderModalContainer" id="subject-builder-modal-container">

      <!-- First row -->
      <div class="search-type" id="search-in-holder">
        <span>Search In:</span>
        <button @click="searchModeSwitch('LCSHNAF')" :data-tooltip="'Shortcut: CTRL+ALT+1'"
          :class="['simptip-position-bottom', { 'active': (searchMode === 'LCSHNAF') }]">LCSH/NAF</button>
        <button @click="searchModeSwitch('CHILD')" :data-tooltip="'Shortcut: CTRL+ALT+2'"
          :class="['simptip-position-bottom', { 'active': (searchMode === 'CHILD') }]">Children's Subjects</button>
        <button @click="searchModeSwitch('GEO')" :data-tooltip="'Shortcut: CTRL+ALT+3'"
          :class="['simptip-position-bottom', { 'active': (searchMode === 'GEO') }]">Indirect Geo</button>
        <!-- <button @click="searchModeSwitch('WORKS')" :data-tooltip="'Shortcut: CTRL+ALT+4'" :class="['simptip-position-bottom',{'active':(searchMode==='WORKS')}]">Works</button> -->
        <button @click="searchModeSwitch('HUBS')" :data-tooltip="'Shortcut: CTRL+ALT+4'"
          :class="['simptip-position-bottom', { 'active': (searchMode === 'HUBS') }]">Hubs</button>
      </div>


      <!-- second row -->
      <template v-if="activeSearch !== false">
        {{ activeSearch }}
      </template>
      <template v-else>
        <ComplexSearchResultsDisplay :searchResults="searchResults" :pickLookup="pickLookup" :searchMode="searchMode"
          @loadContext="loadContext" @selectContext="selectContext" />
      </template>
      <div class="detail-body">
        <DetailsPanel :contextData="contextData" :contextRequestInProgress="contextRequestInProgress"
          @addClassNumber="addClassNumber" @newSearch="newSearch" />
      </div>

      <!-- third row -->
      <div class="search-heading">
        search heading<br>
        {{ components }}

      </div>

      <!-- last row -->
      <div class="search-bar">
        <form autocomplete="off" style="height: 3em;" class="search-box">
          <input v-on:keydown.enter.prevent="navInput" placeholder="Enter Subject Headings Here" ref="subjectInput"
            autocomplete="off" type="text" v-model="subjectString" @input="subjectStringChanged" @keydown="navInput"
            @keyup="navString" @click="navStringClick" class="input-single-subject subject-input" id="subject-input">
        </form>
        <div v-for="(c, idx) in components" :ref="'cBackground' + idx"
          :class="['color-holder', { 'color-holder-okay': (c.uri !== null || c.literal) }, { 'color-holder-type-okay': (c.type !== null || showTypes === false) }]"
          v-bind:key="idx">??
          {{ c.label }}
        </div>


        <!-- type selection -->
        <div ref="toolbar" style="display: flex;">
          <div>
            <ol v-if="showTypes" :class="['type-list-ol', { 'type-list-ol-lowres': lowResMode }]">
              <li :class="['type-item', { 'type-item-selected': (type.selected) }]" v-for="type in activeTypes"
                :key="type.value" @click="setTypeClick($event, type.value)"
                :style="`${this.preferenceStore.styleModalTextColor()}`">{{ type.label }}</li>
            </ol>
          </div>
        </div>
      </div>

      <div class="button-holder">
        <button @click="closeEditor"
          style="float: right;margin: 0.6em; background-color: white; border: solid 1px rgb(42,42,42); color: rgb(42,42,42);"
          :class="[{ 'add-button-lowres': lowResMode }]">Close</button>
        <button v-if="okayToAdd == true" style="float: right;margin: 0.6em; z-index: 100" @click="add"
          :class="[{ 'add-button-lowres': lowResMode }]">Add [SHIFT+Enter]</button>
        <button v-else-if="okayToAdd == false && subjectString.length == 0" disabled
          style="float: right;margin: 0.6em; display: none;" :class="[{ 'add-button-lowres': lowResMode }]">Can't
          Add</button>
        <button v-else-if="okayToAdd == false" disabled style="float: right;margin: 0.6em;"
          :class="[{ 'add-button-lowres': lowResMode }]">Can't Add</button>

        <div v-if="this.pickCurrent != null">
          <div class="clear-selected">
            <button class="clear-selected-button" @click="clearSelected()"
              title="Clear selection & re-enable update on hover">Remove selected</button>
          </div>
        </div>
      </div>
    </div>
  </VueFinalModal>
</template>


<script>

import { usePreferenceStore } from '@/stores/preference'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { mapStores, mapState, mapWritableState } from 'pinia'
import { VueFinalModal } from 'vue-final-modal'
import short from 'short-uuid'

import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";

import utilsNetwork from '@/lib/utils_network';

import { AccordionList, AccordionItem } from "vue3-rich-accordion";
import ComplexSearchResultsDisplay from './helpers/ComplexSearchResultsDisplay.vue'

import Component from './helpers/LookupComponent.js'
import DetailsPanel from './helpers/DetailsPanel.vue'

const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}





export default {
  name: "SubjectEditor2",
  components: {
    VueFinalModal,
    AuthTypeIcon,
    AccordionList,
    AccordionItem,
    ComplexSearchResultsDisplay,
    DetailsPanel
  },
  props: {
    structure: Object,
    searchValue: String,
    authorityLookup: String,
    isLiteral: Boolean,
    profileData: Object,
    searchType: String,
    fromPaste: Boolean,
  },

  watch: {
    searchValue: function () {
      console.info("watch: ", this.searchValue)
      this.subjectString = this.searchValue
    },
  },

  data: function () {
    return {
      lowResMode: false,
      okayToAdd: false,
      searchMode: "LCSHNAF",
      activeTypes: {
        'madsrdf:Topic': { label: 'Topic / Heading ($a $x)', value: 'madsrdf:Topic', selected: false },
        'madsrdf:GenreForm': { label: 'Genre ($v)', value: 'madsrdf:GenreForm', selected: false },
        'madsrdf:Geographic': { label: 'Geographic ($z)', value: 'madsrdf:Geographic', selected: false },
        'madsrdf:Temporal': { label: 'Chronological ($y)', value: 'madsrdf:Temporal', selected: false },
      },
      showTypes: true,

      heading: {},

      components: [],
      activeComponent: null,
      activeComponentIndex: 0,
      oldActiveComponent: null,
      oldActiveComponentIndex: 99,
      componetLookup: {},

      subjectString: '',
      nextInputIsTypeSelection: false,
      typeLookup: {},
      searchResults: null,
      localContextCache: null,
      activeSearch: false,
      contextRequestInProgress: false,
      searchPos: 0,

      pickLookup: {},
      pickCurrent: null,
      localContextCache: {},
      contextData: {},

    }
  },

  computed: {
    ...mapStores(usePreferenceStore),
    ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse', 'diacriticPacks']),
    ...mapState(useProfileStore, ['returnComponentByPropertyLabel']),
    ...mapWritableState(useProfileStore, ['activeProfile', 'setValueLiteral', 'subjectEditor2']),
  },

  methods: {
    newSearch: function (v) {
      this.subjectString = v
      this.subjectStringChanged()
      this.searchApis(v, v, this)
    },
    addClassNumber: function (classNum) {
      let profile = this.activeProfile

      let targetComponent = this.returnComponentByPropertyLabel('Classification numbers')

      let propertyPath = [
        { level: 0, propertyURI: "http://id.loc.gov/ontologies/bibframe/classification" },
        { level: 1, propertyURI: "http://id.loc.gov/ontologies/bibframe/classificationPortion" }
      ]

      let fieldGuid = null
      try {
        fieldGuid = targetComponent.userValue["http://id.loc.gov/ontologies/bibframe/classification"][0]["http://id.loc.gov/ontologies/bibframe/classificationPortion"][0]["@guid"]
      } catch (err) {
        fieldGuid = short.generate()
      }
      this.setValueLiteral(targetComponent['@guid'], fieldGuid, propertyPath, classNum, null, null)
    },
    clearSelected: function () {
      this.pickLookup[this.pickCurrent].picked = false
      this.pickCurrent = null
    },

    /**
     * When loading from an existing subject, the component lookup
     * needs to be build, so the components will have URIs, types,
     * and be flaged as literals or not
     *
     * @param {obj} incomingSubjects - the existing subject data
     */
    buildLookupComponents: function (incomingSubjects) {
      this.typeLookup = {}

      if (!incomingSubjects || typeof incomingSubjects == "undefined") {
        return
      }

      let lookUp

      // The subject is made of multiple parts
      if (Array.isArray(incomingSubjects)) {
        for (let subjIdx in incomingSubjects) {
          this.componetLookup[subjIdx] = {}
          let type = incomingSubjects[subjIdx]["@type"]

          if (type.includes("http://www.loc.gov/mads/rdf/v1#Topic") || type.includes("http://id.loc.gov/ontologies/bibframe/Topic")) {
            this.typeLookup[subjIdx] = 'madsrdf:Topic'
          }
          if (type.includes("http://www.loc.gov/mads/rdf/v1#GenreForm")) {
            this.typeLookup[subjIdx] = 'madsrdf:GenreForm'
          }
          if (type.includes("http://www.loc.gov/mads/rdf/v1#Geographic") || type.includes("http://www.loc.gov/mads/rdf/v1#HierarchicalGeographic")) {
            this.typeLookup[subjIdx] = 'madsrdf:Geographic'
          }
          if (type.includes("http://www.loc.gov/mads/rdf/v1#Temporal")) {
            this.typeLookup[subjIdx] = 'madsrdf:Temporal'
          }
          if (type.includes("Hub") || type.includes("Work")) {
            this.typeLookup[subjIdx] = type
          }


          if (Object.keys(incomingSubjects[subjIdx]).includes("http://www.loc.gov/mads/rdf/v1#authoritativeLabel")) {
            lookUp = "http://www.loc.gov/mads/rdf/v1#authoritativeLabel"
          } else {
            lookUp = "http://www.w3.org/2000/01/rdf-schema#label"
          }
          try {
            let label = incomingSubjects[subjIdx][lookUp][0][lookUp].replaceAll("--", "‑‑")

            //Set up componentLookup, so the component builder can give them URIs
            this.componetLookup[subjIdx][label] = {
              label: incomingSubjects[subjIdx][lookUp][0][lookUp],
              literal: incomingSubjects[subjIdx]["@id"] ? false : true,
              uri: incomingSubjects[subjIdx]["@id"] ? incomingSubjects[subjIdx]["@id"] : null,
              type: this.typeLookup[subjIdx],
              marcKey: incomingSubjects[subjIdx]["http://id.loc.gov/ontologies/bflc/marcKey"] ? incomingSubjects[subjIdx]["http://id.loc.gov/ontologies/bflc/marcKey"][0]["http://id.loc.gov/ontologies/bflc/marcKey"] : ""
            }

          } catch (err) {
            console.error(err)
          }
        }
      } else {
        // dealing with a complex subject
        this.componetLookup[0] = {}
        let type = incomingSubjects["@type"] ? incomingSubjects["@type"] : ""

        if (type.includes("http://www.loc.gov/mads/rdf/v1#Topic") || type.includes("http://id.loc.gov/ontologies/bibframe/Topic")) {
          this.typeLookup[0] = 'madsrdf:Topic'
        }
        if (type.includes("http://www.loc.gov/mads/rdf/v1#GenreForm")) {
          this.typeLookup[0] = 'madsrdf:GenreForm'
        }
        if (type.includes("http://www.loc.gov/mads/rdf/v1#Geographic" || type.includes("http://www.loc.gov/mads/rdf/v1#HierarchicalGeographic"))) {
          this.typeLookup[0] = 'madsrdf:Geographic'
        }
        if (type.includes("http://www.loc.gov/mads/rdf/v1#Temporal")) {
          this.typeLookup[0] = 'madsrdf:Temporal'
        }
        if (type.includes("Hub") || type.includes("Work")) {
          this.typeLookup[0] = type
        }

        if (Object.keys(incomingSubjects).includes("http://www.loc.gov/mads/rdf/v1#authoritativeLabel")) {
          lookUp = "http://www.loc.gov/mads/rdf/v1#authoritativeLabel"
        } else {
          lookUp = "http://www.w3.org/2000/01/rdf-schema#label"
        }
        try {
          let label = incomingSubjects[lookUp][0][lookUp].replaceAll("--", "‑‑")
          //Set up componentLookup, so the component builder can give them URIs
          this.componetLookup[0][label] = {
            label: incomingSubjects[lookUp][0][lookUp],
            literal: incomingSubjects["@id"] ? false : true,
            uri: incomingSubjects["@id"] ? incomingSubjects["@id"] : null,
            type: this.typeLookup[0],
            marcKey: incomingSubjects["http://id.loc.gov/ontologies/bflc/marcKey"] ? incomingSubjects["http://id.loc.gov/ontologies/bflc/marcKey"][0]["http://id.loc.gov/ontologies/bflc/marcKey"] : ""
          }
        } catch (err) {
          console.error(err)
        }
      }

    },

    checkToolBarHeight: function () {
      // also check to see if the toolbar is off the screen,
      // in very very low res setups sometimes this area gets clipped
      if (this.$refs.toolbar && this.$refs.toolbar.getBoundingClientRect().bottom > window.innerHeight) {
        this.lowResMode = true
        this.$emit('lowResModeActivate', true)
      }
    },

    /**
     * Creates components from the search string
     *
     * If the subject is loaded from an existing record, there will be a search string
     * but there won't be components.
     */
    buildComponents: function (searchString) {
      // searchString = searchString.replace("—", "--") // when copying a heading from class web

      let subjectStringSplit = searchString.split('--')

      let targetIndex = []
      let componentLookUpCount = Object.keys(this.componetLookup).length

      if (componentLookUpCount > 0) { //We might be dealing with something that needs to stitch some terms together
        if (componentLookUpCount < subjectStringSplit.length) {
          let target = false
          let targetType = null
          let splitTarget = false
          for (let i in this.componetLookup) {
            for (let j in this.componetLookup[i]) {
              targetType = this.componetLookup[i][j].type

              if (this.componetLookup[i][j].label.includes("--")) {
                target = this.componetLookup[i][j].label.replaceAll("--", "‑‑")
                targetIndex = i  // needs this to ensure the target will go into the search string in the right place
                splitTarget = target.split('‑‑')
              }

              let matchIndx = []
              if (target) {  // && targetType == 'madsrdf:Geographic'
                for (let i in subjectStringSplit) {
                  if (target == subjectStringSplit[i]) { matchIndx.push(i); break } // if there is an exact match, keep it and move on
                  if (target.includes(subjectStringSplit[i])) {  //&& subjectStringSplit[i].length > 3
                    matchIndx.push(i)
                  }
                }

                //remove them
                for (let i = matchIndx.length - 1; i >= 0; i--) {
                  subjectStringSplit.splice(matchIndx[i], 1)
                }
                // add the combined terms
                // subjectStringSplit.push(target)
                subjectStringSplit.splice(targetIndex, 0, target)
              }
            }
          }
        }
      }

      console.info("building the components: ", searchString)
      console.info("componetLookup: ", this.componetLookup)
      // clear the current
      this.components = []
      let id = 0

      let activePosStart = 0

      /**
       * When a string in the middle of a heading changes, the typeLookup will get thrown off.
       * Need a way to track this.
       */
      let diff = []
      // if (subjectStringSplit.length < Object.keys(this.componetLookup).length){
      //   diff = Object.keys(this.componetLookup).filter(x => !subjectStringSplit.includes( Object.keys(this.componetLookup[x])[0]))
      // }

      let offset = 0
      for (let ss of subjectStringSplit) {
        console.info("\n\n--------------", ss)
        if (subjectStringSplit.length < Object.keys(this.componetLookup).length) {
          diff = Object.keys(this.componetLookup).filter(x => !subjectStringSplit.includes(Object.keys(this.componetLookup[x])[0]))
        }

        if (diff.length > 0) {
          if (diff.includes(id.toString()) && id.toString() == diff.at(-1)) {
            offset = Object.keys(this.componetLookup).length - subjectStringSplit.length
          }
        }

        // check the lookup to see if we have the data for this label
        let uri = null
        let type = null
        let literal = null
        let marcKey = null
        let nonLatinLabel = null
        let nonLatinMarcKey = null

        let tempSs = ss.replace("‑", "-")


        if (this.componetLookup[id + offset] && this.componetLookup[id + offset][tempSs]) {
          literal = this.componetLookup[id + offset][tempSs].literal
          uri = this.componetLookup[id + offset][tempSs].uri
          marcKey = this.componetLookup[id + offset][tempSs].marcKey
          nonLatinLabel = this.componetLookup[id + offset][tempSs].nonLatinTitle
          nonLatinMarcKey = this.componetLookup[id + offset][tempSs].nonLatinMarcKey
        } else if (this.componetLookup[id + offset] && this.componetLookup[id + offset][ss]) {
          literal = this.componetLookup[id + offset][ss].literal
          uri = this.componetLookup[id + offset][ss].uri
          marcKey = this.componetLookup[id + offset][ss].marcKey
          nonLatinLabel = this.componetLookup[id + offset][ss].nonLatinTitle
          nonLatinMarcKey = this.componetLookup[id + offset][ss].nonLatinMarcKey
        }

        if (this.typeLookup[id + offset]) {
          type = this.typeLookup[id + offset]
        }

        if (uri && uri.includes("/hubs/")) {
          type = "bf:Hub"
        }

        console.info("adding component for ", ss)
        this.components.push({
          label: ss,
          uri: uri,
          id: id,
          type: type, //this.componetLookup && this.componetLookup[id+offset] && this.componetLookup[id+offset][ss] && this.componetLookup[id+offset][ss].extra ? this.componetLookup[id+offset][ss].extra.type : type,
          complex: ss.includes('‑‑'),
          literal: literal,
          posStart: activePosStart,
          posEnd: activePosStart + ss.length,
          marcKey: marcKey,
          nonLatinLabel: nonLatinLabel,
          nonLatinMarcKey: nonLatinMarcKey,
        })

        // increase the start length by the length of the string and also add 2 for the "--"
        activePosStart = activePosStart + ss.length + 2

        id++
      }

      //make sure the searchString matches the components
      this.subjectString = this.components.map((component) => component.label).join("--")

      console.info("final components: ", this.components)

    },

    focusInput: function () {
      this.$nextTick(() => {

        let timeoutFocus = window.setTimeout(() => {
          if (this.$refs.subjectInput) {
            console.info("focus 2")
            this.$refs.subjectInput.focus()
            window.clearTimeout(timeoutFocus)
          }
        }, 10)
      })
    },


    // some context messing here, pass the debounce func a ref to the vue "this" as that to ref in the function callback
    searchApis: debounce(async (searchString, searchStringFull, that) => {
      that.pickCurrent = null //reset the current selection when the search changes

      that.searchResults = null
      that.x = 'Seaching...'
      that.pickPostion = 0

      searchString = searchString.trim().normalize()
      searchStringFull = searchStringFull.trim().normalize()

      // make the "searching..." text grow
      let ti = window.setInterval(() => { that.activeSearch = ((!that.activeSearch) ? '' : that.activeSearch) + '.' }, 100)

      // a backup here just in case the search times out or takes forever
      let tiBackup = window.setTimeout(() => {
        window.clearInterval(ti)
        that.activeSearch = false

      }, 10000)

      let searchStringFullPieces = searchStringFull.split('--')
      let currentPos = searchStringFullPieces.indexOf(searchString)

      searchString = searchString.replaceAll('‑', '-')
      searchStringFull = searchStringFull.replaceAll('‑', '-')

      that.searchStringPos = currentPos

      let complexSub = []

      // to search for complex subdivisions, we'll look that come after the first term

      if (currentPos > 1) {
        //this will search `s1--s2`
        let newTerm = searchStringFullPieces.slice(currentPos - 1, currentPos + 1).join("--")
        if (newTerm.includes("--")) {
          complexSub.push(newTerm)
        }
      }

      if (currentPos == 1) {
        //this will search `s1--s2`
        let newTerm = searchStringFullPieces[1]
        complexSub.push(newTerm)
      }

      if (searchStringFull.includes("---")) {
        searchStringFull = searchStringFull.replace("---", "‑--")
      }

      that.searchResults = await utilsNetwork.subjectSearch(searchString, searchStringFull, complexSub, that.searchMode)
      // that.searchResults = await utilsNetwork.subjectSearch(searchString, searchStringFull, that.searchMode)

      // if they clicked around while it was doing this lookup bail out
      // if (that.activeSearchInterrupted){



      //   window.clearInterval(ti)
      //   window.clearTimeout(tiBackup)
      //   that.activeSearch = false
      //   that.activeSearchInterrupted = false

      //   console.log("that.activeSearchInterrupted",that.activeSearchInterrupted)

      //   return false

      // }



      // replace the true keyboard hypen with the werid hypen to prevent spliting on open lifedates
      for (let s of that.searchResults.names) {
        s.labelOrginal = s.label
        s.label = s.label.replaceAll('-', '‑')
      }


      for (let s of that.searchResults.subjectsComplex) {
        s.labelOrginal = s.label
        s.complex = true
        s.label = s.label.replaceAll('-', '‑')
      }

      for (let s of that.searchResults.subjectsSimple) {
        if (s.suggestLabel && s.suggestLabel.includes('(DEPRECATED')) {
          s.suggestLabel = s.suggestLabel.split('(DEPRECATED')[0] + "(DEPRECATED)"
        }
      }

      for (let s of that.searchResults.hierarchicalGeographic) {
        if (s.suggestLabel && s.suggestLabel.includes(' (USE ')) {
          s.suggestLabel = s.label
        }
      }
      if (that.searchMode == 'WORKS' || that.searchMode == 'HUBS') {
        for (let s of that.searchResults.subjectsSimple) {
          if (s.suggestLabel && s.suggestLabel.includes(' (USE ')) {
            s.suggestLabel = s.label + " (USE FOR " + s.vlabel + ")"
          }
        }
        for (let s of that.searchResults.subjectsComplex) {
          if (s.suggestLabel && s.suggestLabel.includes(' (USE ')) {
            s.suggestLabel = s.label + " (USE FOR " + s.vlabel + ")"
          }
        }
      }

      for (let s of that.searchResults.hierarchicalGeographic) {
        s.labelOrginal = s.label
        s.hierarchicalGeographic = true
        s.label = s.label.replaceAll('-', '‑')
      }

      if (that.searchResults.hierarchicalGeographic.length > 0 && that.searchResults.subjectsComplex.length == 0) {
        that.searchResults.subjectsComplex = that.searchResults.hierarchicalGeographic
      }

      that.pickLookup = {}

      that.pickPostion = that.searchResults.subjectsSimple.length + that.searchResults.subjectsComplex.length - 1

      that.buildPickLookup()

      for (let k in that.pickLookup) {
        that.pickLookup[k].picked = false
        if (searchString.toLowerCase() == that.pickLookup[k].label.toLowerCase() && !that.pickLookup[k].literal) {
          // if the labels are the same for the current one selected don't overide it
          if (that.activeComponent && that.pickLookup[k].label.replaceAll('‑', '-') == that.activeComponent.label.replaceAll('‑', '-') && that.activeComponent.uri) {
            if (that.activeComponent.uri == that.pickLookup[k].uri) {
              that.pickPostion = k
              that.pickLookup[k].picked = true
              that.selectContext()
            }
          } else {
            // if they started typing the next word already then stop this
            if (that.subjectString.replaceAll('‑', '-') != searchStringFull.replaceAll('‑', '-')) {
              break
            }
            // do they even have the same label currently, they might be clicking around in the interface
            // so at this point with the async lookup this is not even the right componen
            if (that.pickLookup[k].label != that.activeComponent.label) {
              break
            }
          }
        }
      }

      // that.contextData.dispatch("clearContext", { self: that})
      if (that.pickLookup[that.pickPostion] && !that.pickLookup[that.pickPostion].literal) {
        that.contextRequestInProgress = true
        // that.contextData = await utilsNetwork.returnContext(that.pickLookup[that.pickPostion].uri)
        that.contextData = that.getContext()

        // keep a local copy of it for looking up subject type
        if (that.contextData) {
          that.localContextCache[that.contextData.uri] = JSON.parse(JSON.stringify(that.contextData))
        }
      }

      window.clearInterval(ti)
      window.clearTimeout(tiBackup)
      that.activeSearch = false

      that.$nextTick(() => {
        that.checkToolBarHeight()



        // window.setTimeout(()=> {

        // find out how small the smallest one is and then loop through and try to make all of them
        // that size so they fit on one line of the display
        let smallest_size = 1000;
        for (let el of document.getElementsByClassName("fake-option")) {

          if (el.offsetHeight < smallest_size && el.offsetHeight != 0) {
            smallest_size = el.offsetHeight
          }
        }
        // alert(smallest_size)
        // for (let el of document.getElementsByClassName("fake-option")){
        //   if (el.offsetHeight > smallest_size){
        //     let startFontSize = 1.25
        //     while (el.offsetHeight >smallest_size){
        //       startFontSize=startFontSize-0.01
        //       el.style.fontSize = startFontSize + 'em';
        //       if (startFontSize<=0.01){
        //         el.style.fontSize = "1.25em"
        //         break
        //       }
        //     }
        //   }
        // }
        // },100)
      })

    }, 500),

    /**
   * Build the pick lookup so we can adjust the sorting here.
   *
   * Without rebuilding the picklookup list, selectiong will be off.
   * We do it here so that we can adjust the current search results without
   * needing to do another search.
   *
   */
    buildPickLookup: function () {
      for (let x in this.searchResults.subjectsComplex) {
        this.pickLookup[x] = this.searchResults.subjectsComplex[x]
      }

      for (let x in this.searchResults.subjectsChildrenComplex) {
        this.pickLookup[x] = this.searchResults.subjectsChildrenComplex[x]
      }

      for (let x in this.searchResults.subjectsSimple) {
        this.pickLookup[parseInt(x) + parseInt(this.searchResults.subjectsComplex.length)] = this.searchResults.subjectsSimple[x]
      }

      for (let x in this.searchResults.subjectsChildren) {
        this.pickLookup[parseInt(x) + parseInt(this.searchResults.subjectsChildrenComplex.length)] = this.searchResults.subjectsChildren[x]
      }

      for (let x in this.searchResults.names) {
        this.pickLookup[(this.searchResults.names.length - x) * -1] = this.searchResults.names[x]
      }

      for (let x in this.searchResults.exact) {
        this.pickLookup[(this.searchResults.names.length - x) * -1 - 2] = this.searchResults.exact[x]
      }
    },


    closeSubjectBuilder: function () {
      this.$emit('hideSubjectModal', true)
      // TODO: reset values
    },

    searchModeSwitch: function (mode) {
      this.searchMode = mode

      /**
       * If it's in GEO mode look at all the components and build the
       * subject string based on the ones with out URIs.
       * How does this affect literals
       *
       * (c.uri !== null || c.literal)
       */

      if (mode == "GEO") {
        // if the User selected the first part of an indirect geo from the LCSH/LCNAF
        // search and then swaps to GEO to finish, replace the `--` between the two
        // to ease the process
        // if there is a component that is != literal and uri == null, get the index
        let potentialGeoIdx = this.components.findIndex((i) => i.literal == null && i.uri == null)
        let prevComponent
        if (potentialGeoIdx > 1) {
          prevComponent = JSON.parse(JSON.stringify(this.components.at(potentialGeoIdx - 1)))
          // if the previous component is geographic, swap the -- for not `‑‑` between
          if (prevComponent.type == 'madsrdf:Geographic') {
            let posEnd = this.subjectString.indexOf(this.components[potentialGeoIdx].label)
            let posStart = posEnd - 2
            this.subjectString = this.subjectString.slice(0, posStart) + '‑‑' + this.subjectString.slice(posEnd)
            this.subjectStringChanged()
            this.navStringClick({})
          }
        }


        /**
         * When dealing with a switch to GEO, we need to combine the "loose" components
         * into 1 so the search will work.
         */
        //get the loose components
        let looseComponents = []
        let indx = []
        let componentMap = []
        for (let c in this.components) {
          if (this.components[c].uri == null && this.components[c].literal != true) {
            looseComponents.push(this.components[c])
            indx.push(c)
            componentMap.push("-")
          } else {
            componentMap.push(c)
          }
        }

        //only stitch the loose components togethere if there are 2 next to each other
        if (indx.length == 2 && indx[1] - 1 == indx[0]) {
          /** !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
           *  !! the `not` hyphens are very important !!
           *  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
           */
          // Update the id of the active component to indx[0] so we're working with the first component of the looseComponents
          this.activeComponentIndex = Number(indx[0])

          //this.activeComponent = looseComponents.map((comp) => {return comp.id == this.activeComponentIndex})
          this.activeComponent = looseComponents.filter((comp) => comp.id == this.activeComponentIndex)[0]
          //this.activeComponent = looseComponents[this.activeComponentIndex]

          this.activeComponent.id = this.activeComponentIndex

          //update the active component with the loose components
          for (let c in looseComponents) {
            if (c != 0) {
              let part1 = ""
              if (c == 1) {
                part1 = looseComponents[0].label
              } else {
                part1 = this.activeComponent.label
              }
              const part2 = looseComponents[c].label
              this.activeComponent.label = part1 + "‑‑" + part2
              this.activeComponent.posEnd = looseComponents[c].posEnd
            }
          }
          this.activeComponent.posStart = looseComponents[0].posStart

          // we need to make sure the order is maintained
          // use the component map to determine maintain order
          let final = []
          for (let el in componentMap) {
            let good = componentMap[el] != '-'
            if (good) {
              final.push(this.components[el].label)
            } else {
              final.push(this.activeComponent.label)
            }
          }

          final = new Set(final)
          final = Array.from(final)

          this.subjectString = final.join("--")

          //Splice the components from the first looseComponet to the end and add the new activeComponent to the end
          this.components.splice(indx[0], indx.length, this.activeComponent)

          // need to make sure postStart and posEnd are correct, and the id
          this.adjustStartEndPos(this.components)
          for (let x in this.components) {
            let prev = null
            let current = this.components[x]

            if (x > 0) {
              prev = this.components[x] - 1
            } else if (x == 0) {
              current.posStart = 0
            } else {
              current.posStart = prev.posEnd + 2
            }
            current.posEnd = current.posStart + current.label.length

            current.id = x
          }

          // get the boxes lined up correctly
          try {
            this.renderHintBoxes()
          } catch (err) { }

          // hacky, but without this `this.componentLooks` won't match in `subjectStringChanged`
          for (let i in this.components) {
            for (let j in this.componetLookup) {
              const key = Object.keys(this.componetLookup[j])[0]
              if (this.components[i].label == key) {
                this.componetLookup[i] = this.componetLookup[j]
              }
            }
          }
        }
      } else {
        // Above we took loose components and combined them,
        // here we undo that incase someone made a mistake and the geo
        // term has a subject in it that needs to be split out.
        let unApproved = []
        let unApprovedIdx = []
        let approved = []
        for (let c in this.components) {
          if (this.components[c].uri == null && this.components[c].literal != true) {
            unApproved.push(this.components[c])
            unApprovedIdx.push(c)
          } else {
            approved.push(this.components[c])
          }
        }

        //remove the terms that have been exploded
        for (let i in unApprovedIdx) {
          if (this.components[unApprovedIdx[i]].label.includes("‑‑")) {
            this.components.splice(unApprovedIdx[i], 1)
          }
        }

        for (let c in unApproved) {
          let target = unApproved[c]
          let id = target.id

          if (target.label.includes("‑‑")) {
            let needComponents = target.label.split("‑‑")
            //build and add the exploded components
            for (let idx in needComponents) {
              let start = 0
              let end = 0

              let previous = null
              if (idx == 0) {
                start = 0
              } else {
                previous = this.components.at(-1)
                start = previous.posEnd + 2 //for the hyphens
              }
              end = start + needComponents[idx].length
              this.components.splice(id, 0, {
                label: needComponents[idx],
                uri: null,
                id: idx,
                type: mode == "GEO" ? 'madsrdf:Geographic' : 'madsrdf:Topic',
                complex: false,
                literal: null,
                posStart: start,
                posEnd: end,
              })

              id++
            }


          }

          let final = this.components.map((component) => component.label)

          this.adjustStartEndPos(this.components)
          this.subjectString = final.join("--")
        }

        // get the boxes lined up correctly
        this.renderHintBoxes()
      }

      if (this.activeComponent && this.activeComponent.label) {
        this.searchApis(this.activeComponent.label, this.subjectString, this)
      }
      console.info("focus 4")
      this.$refs.subjectInput.focus()
    },

    updateAvctiveTypeSelected: function () {
      //set them all false
      for (let k in this.activeTypes) {
        this.activeTypes[k].selected = false
      }

      if (this.activeComponent && this.activeComponent.type) {
        if (this.activeTypes[this.activeComponent.type]) {
          this.activeTypes[this.activeComponent.type].selected = true
        } else if (this.activeComponent.type == 'madsrdf:HierarchicalGeographic') {
          this.activeTypes["madsrdf:Geographic"].selected = true
        } else {
          this.activeTypes["madsrdf:Topic"].selected = true
        }
      } else if (this.activeComponent.type == null && this.activeComponent.marcKey != null) { //fall back on the marcKey, this can be null if the selection is too fast?
        let subfield = this.activeComponent.marcKey.slice(5, 7)
        switch (subfield) {
          case ("$v"):
            subfield = "madsrdf:GenreForm"
            break
          case ("$y"):
            subfield = "madsrdf:Temporal"
            break
          case ("$z"):
            subfield = "madsrdf:Geographic"
            break
          default:
            subfield = "madsrdf:Topic"
        }

        this.activeTypes[subfield].selected = true
        this.activeComponent.type = subfield
      }

    },

    // Search String functions
    navStringClick: function (event) {
      console.info("click")
      // when clicked send it over to the navString func with fake key property to trigger if statement
      event.key = 'ArrowLeft'
      this.navString(event)
    },

    navString: function (event) {
      console.info("nav string")
      // find the term the cursor is in
      let searchStringPieces = this.subjectString.split("--")
      let input = this.$refs.subjectInput
      let cursorPos = input.selectionStart;
      for (let idx in searchStringPieces) {
        if (idx == 0 && cursorPos <= searchStringPieces[idx].length) {
          this.searchPos = idx
          break
        } else if (cursorPos <= searchStringPieces[idx].length + 2) {
          this.searchPos = idx
          break
        }
      }

      if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
        if (!event.target) {
          event = { target: this.$refs.subjectInput }
        }

        for (let c of this.components) {
          if (event.target.selectionStart >= c.posStart && event.target.selectionStart <= c.posEnd + 1) {
            this.activeComponent = c
            this.activeComponentIndex = c.id
            break
          }
        }

        this.subjectStringChanged(event)

        // // keep track of where we were so that we don't do unessary refreshes
        // if (this.oldActiveComponentIndex != this.activeComponentIndex) {
        //   this.updateAvctiveTypeSelected()
        //   this.subjectStringChanged(event)
        //   this.oldActiveComponentIndex = this.activeComponentIndex
        // } else if (this.activeComponent.uri === null) {
        //   this.updateAvctiveTypeSelected()
        //   this.subjectStringChanged(event)
        // }
      }

      // text macros
      let useTextMacros = this.preferenceStore.returnValue('--o-diacritics-text-macros')
      if (useTextMacros && useTextMacros.length > 0) {
        for (let m of useTextMacros) {
          if (event.target.value.indexOf(m.lookFor) > -1) {
            event.target.value = event.target.value.replace(m.lookFor, m.replaceWith)
            // manually change the v-model var and force a update
            this.$nextTick(() => {
              this.subjectString = event.target.value
              this.subjectStringChanged()
              this.navString({ key: 'ArrowRight' })
            })
          }
        }
      }
    },

    validateOkayToAdd: function () {
      this.okayToAdd = false
      let allHaveURI = true
      let allHaveType = true

      for (let c of this.components) {
        if (!c.uri && !c.literal) {
          allHaveURI = false
        }
        if (!c.type) {
          allHaveType = false
        }
      }

      if (allHaveURI && allHaveType) {
        this.okayToAdd = true
      }
      if (allHaveURI && !allHaveType && this.components.length == 1) {
        this.okayToAdd = true
      }
    },

    subjectStringChanged: async function (event) {
      this.subjectString = this.subjectString.replace("—", "--")
      this.validateOkayToAdd()

      //fake the "click" so the results panel populates
      if (this.initialLoad == true) {
        let pieces = this.$refs.subjectInput.value.replace("—", "--").split("--")
        let lastPiece = pieces.at(-1)
        this.searchApis(lastPiece, this.$refs.subjectInput.value.replace("—", "--"), this)
        this.initialLoad = false
      }

      // they are setting the type, next key inputed is important
      if (event && event.data === '$') {
        this.nextInputIsTypeSelection = true
        return false
      }

      // if the event coming in is the keystroke after a '$' then check to change the type
      if (event && this.nextInputIsTypeSelection) {
        if (event.data.toLowerCase() === 'a' || event.data.toLowerCase() === 'x') {
          this.typeLookup[this.activeComponentIndex] = 'madsrdf:Topic'
          this.subjectString = this.subjectString.replace('$' + event.data, '')
        }
        if (event.data.toLowerCase() === 'v') {
          this.typeLookup[this.activeComponentIndex] = 'madsrdf:GenreForm'
          this.subjectString = this.subjectString.replace('$' + event.data, '')
        }
        if (event.data.toLowerCase() === 'z') {
          this.typeLookup[this.activeComponentIndex] = 'madsrdf:Geographic'
          this.subjectString = this.subjectString.replace('$' + event.data, '')
        }
        if (event.data.toLowerCase() === 'y') {
          this.typeLookup[this.activeComponentIndex] = 'madsrdf:Temporal'
          this.subjectString = this.subjectString.replace('$' + event.data, '')
        }

        this.nextInputIsTypeSelection = false
        this.subjectStringChanged()

      } else {
        // its a normal keystroke not after '$' but check to see if it was a keyboard event
        // if not then event will be null and was just evoked from code, if its a event then they are typeing in a search value, clear out the old
        if (event) {
          this.searchResults = null
        }
      }

      this.showTypes = true

      // if they erase everything remove the components
      if (this.subjectString.length == 0) {
        this.activeComponent = null
        this.activeComponentIndex = 0
        this.componetLookup = {}
        this.typeLookup = {}
        this.components = []

        //search for nothing. Otherwise, if the user deletes their search
        // quickly, it will end up searcing on the last letter to be deleted
        this.searchApis("", "", this)
      }
      if (!this.subjectString.endsWith("--")) {
        console.info("buildComponents: ", this.subjectString)
        this.buildComponents(this.subjectString)
      }

      this.renderHintBoxes()


      // if they are typing in the heading select it as we go
      if (event) {


        for (let c of this.components) {
          console.info("c: ", c)
          if (event.target.selectionStart >= c.posStart && event.target.selectionStart <= c.posEnd + 1) {
            this.activeComponent = c
            this.activeComponentIndex = c.id

            // it is not empty
            // it dose not end with "-" so it the '--' typing doesn't trigger
            if (c.label.trim() != '' && !c.label.endsWith('-')) {
              console.info("search1")
              this.searchApis(c.label, event.target.value, this)

              // BUT if it ends with a number and - then it is a name with open life dates
              // so do look that one up
            } else if (/[0-9]{4}\??-/.test(c.label)) {
              console.info("search2")
              this.searchApis(c.label, event.target.value, this)
            } else if (/,\s[0-9]{4}-/.test(c.label)) {
              console.info("search3")
              this.searchApis(c.label, event.target.value, this)
            }
            //            // BUT if it starts with

            break
          }

        }
      } else {

        // if there is no event this was triggered from code
        // so the current active component is the one we need to update with anything changed
        // which would likely be the type if not a keyboard event

        this.activeComponent = this.components[this.activeComponentIndex]


      }

      this.updateAvctiveTypeSelected()

      if (this.components.length == 1 && this.components[0].complex) {
        this.showTypes = false

      }

      this.validateOkayToAdd()

      this.$nextTick(() => {
        this.checkToolBarHeight()


        // there are some senarios where we can safly assume the type, this is invoked when
        // we want to try that, often delayed after something has been selected

        window.setTimeout(() => {
          for (let x of this.components) {
            if (this.localContextCache[x.uri]) {
              if (this.activeComponent.type || this.localContextCache[x.uri].type) {
                // don't do anything
              } else {
                if (this.localContextCache[x.uri].nodeMap && this.localContextCache[x.uri].nodeMap['MADS Collection'] && this.localContextCache[x.uri].nodeMap['MADS Collection'].includes('GeographicSubdivisions')) {
                  x.type = 'madsrdf:Geographic'
                }

                if (this.localContextCache[x.uri].type === 'GenreForm') {
                  x.type = 'madsrdf:GenreForm'
                } else if (this.localContextCache[x.uri].type === 'Temporal') {
                  x.type = 'madsrdf:Temporal'
                } else if (this.localContextCache[x.uri].type === 'Geographic') {
                  x.type = 'madsrdf:Geographic'
                } else if (this.localContextCache[x.uri].type === 'Topic') {
                  x.type = 'madsrdf:Topic'
                } else {
                  x.type = 'madsrdf:Topic'
                }
              }
            }

          }

          this.updateAvctiveTypeSelected()
          this.validateOkayToAdd()
        }, 400)
      })

      // if (event === null){
      //   console.log(event)
      // }

    },

    navInput: function (event) {
      if (event.key == 'ArrowUp') {
        if (parseInt(this.pickPostion) <= this.searchResults.names.length * -1) {
          return false
        }

        this.pickCurrent = null //allows keyboard selection
        this.loadContext(parseInt(this.pickPostion) - 1)
        this.pickCurrent = parseInt(this.pickPostion)
        event.preventDefault()
        return false
      } else if (event.key == 'ArrowDown') {

        if (parseInt(this.pickPostion) >= this.searchResults.subjectsSimple.length - 1 + this.searchResults.subjectsComplex.length) {
          return false
        }

        this.pickCurrent = null //allows keyboard selection
        this.loadContext(parseInt(this.pickPostion) + 1)
        this.pickCurrent = parseInt(this.pickPostion)
        event.preventDefault()
        return false
      } else if (event.key == 'Enter') {
        if (event.shiftKey) {
          this.add()
          return
        }
        this.selectContext()

      } else if (event.ctrlKey && event.key == "1") {
        this.searchModeSwitch("LCSHNAF")
      } else if (event.ctrlKey && event.key == "2") {
        this.searchModeSwitch("CHILD")
      } else if (event.ctrlKey && event.key == "3") {
        this.searchModeSwitch("GEO")
      } else if (event.ctrlKey && event.key == "4") {
        this.searchModeSwitch("HUBS")
      } else if (this.searchMode == 'GEO' && event.key == "-") {
        if (this.components.length > 0) {
          let lastC = this.components[this.components.length - 1]

          // if the last component has a URI then it was just selected
          // so we are not in the middle of a indirect heading, we are about to type it
          // so let them put in normal --. Unless the last piece was geographic. Then they
          // may have selected the first part from LCSH/LCNAF
          if (lastC.uri && this.activeComponentIndex == this.components.length - 1 && lastC.type != 'madsrdf:Geographic') {
            return true
          }

          // if the last string is a normal "-" then make this one normal too
          if (this.subjectString.slice(-1) == '-') {
            return true
          }

        }

        let start = event.target.selectionStart
        let end = event.target.selectionEnd
        // console.log(this.subjectString.substring(0,start),'|',this.subjectString.substring(end,this.subjectString.length))

        this.subjectString = this.subjectString.substring(0, start) + '‑' + this.subjectString.substring(end, this.subjectString.length)
        this.subjectString = this.subjectString.trim()

        this.$nextTick(() => {
          // console.log(start,end)
          if (end - start > 0) {
            event.target.setSelectionRange(start + 1, start + 1)
          } else {
            event.target.setSelectionRange(start + 1, end + 1)
          }

        })

        this.subjectStringChanged(event)

        event.preventDefault()
        return false

      } else {
        // they might be trying to insert a diacritic here

        // This mode is they press Crtl+e to enter diacritic macro mode, so they did that on the last kedown and now we need to act on the next keystroke and interpret it as a macro code
        if (this.nextInputIsVoyagerModeDiacritics) {
          // they are pressing shift in about to press antoher macro shrotcut
          if (event.key == 'Shift') {
            return false
          }

          if (this.diacriticPacks.voyager[event.code]) {
            let useMacro
            for (let macro of this.diacriticPacks.voyager[event.code]) {
              if (macro.shiftKey == event.shiftKey) {
                useMacro = macro
                break
              }
            }

            let inputV = event.target
            let insertAt = event.target.value.length
            if (event.target && event.target.selectionStart) {
              insertAt = event.target.selectionStart
            }

            if (!useMacro.combining) {
              // it is not a combining unicode char so just insert it into the value
              if (inputV.value) {
                // inputV.value=inputV.value+useMacro.codeEscape
                inputV.value = inputV.value.substring(0, insertAt) + useMacro.codeEscape + inputV.value.substring(insertAt);
              } else {
                inputV.value = useMacro.codeEscape
              }
              // this.searchValueLocal = inputV.value

            } else {
              // inputV.value=inputV.value+useMacro.codeEscape
              inputV.value = inputV.value.substring(0, insertAt) + useMacro.codeEscape + inputV.value.substring(insertAt);
              // this.searchValueLocal = inputV.value

            }

            if (insertAt) {
              this.$nextTick(() => {
                inputV.setSelectionRange(insertAt + 1, insertAt + 1)
                // this.searchValueLocal = inputV.value

                this.$nextTick(() => {
                  console.info("focus 11")
                  inputV.focus()
                })

              })
            } else {
              this.$nextTick(() => {
                console.info("focus 12")
                inputV.focus()
              })
            }

            // manually change the v-model var and force a update
            this.$nextTick(() => {
              this.subjectString = inputV.value
              this.subjectStringChanged()
              this.navString({ key: 'ArrowRight' })
            })


          }
          // turn off mode
          this.nextInputIsVoyagerModeDiacritics = false
          event.target.style.removeProperty('background-color')
          event.preventDefault()
          return false
        }
        // all macros use the ctrl key
        if (event.ctrlKey == true) {
          if (this.diacriticUse.length > 0) {
            for (let macro of this.diacriticUseValues) {
              if (event.code == macro.code && event.ctrlKey == macro.ctrlKey && event.altKey == macro.altKey && event.shiftKey == macro.shiftKey) {
                // console.log("run this macro", macro)
                event.preventDefault()
                this.runMacroExpressMacro(event)

                // manually change the v-model var and force a update
                this.$nextTick(() => {
                  this.subjectString = event.target.value
                  this.subjectStringChanged()
                  this.navString({ key: 'ArrowRight' })
                })
                //

                return false

              }
            }
          }

          // they are entering into voyager diacritic mode
          if (event.code == 'KeyE') {
            if (!this.preferenceStore.returnValue('--b-diacritics-disable-voyager-mode')) {
              event.target.style.backgroundColor = "chartreuse"
              this.nextInputIsVoyagerModeDiacritics = true
              event.preventDefault()
              return false
            }

          }
          //
        }
      }



    },
    renderHintBoxes: function () {
      console.info("hintbox")
      // wait for the UI to render
      this.$nextTick(() => {
        // loop through the current components
        let activeLeft = 0
        for (let com of this.components) {
          // set the left
          this.$nextTick(() => {
            if (this.$refs['cBackground' + com.id] && this.$refs['cBackground' + com.id][0]) {
              this.$refs['cBackground' + com.id][0].style.left = `${activeLeft}px`
              // add the width of all the existing components to the var
              // add 12 to accomodate the "--" seperator
              activeLeft = activeLeft + this.$refs['cBackground' + com.id][0].offsetWidth + 11
            }
          })
        }
      })

    },

    selectContext: async function (pickPostion, update = true) {
      if (pickPostion != null) {
        this.pickPostion = pickPostion
        this.pickCurrent = pickPostion
        this.getContext()
        //Science—Experiments
      }

      if (this.pickLookup[this.pickPostion].complex) {
        // if it is a complex authorized heading then just replace the whole things with it, sometimes
        let splitString = this.subjectString.split('--')
        let splitStringLower = this.subjectString.toLowerCase().split('--')


        // if the selected heading is made of parts of the search string
        let replacePos = []

        if (this.searchStringPos > 0) { // we're looking at a subdivision and we've got a complex heading. Figure out if the pieces
          replacePos = [this.searchStringPos]
          let incomingPieces = this.pickLookup[this.pickPostion].label.toLowerCase().split("‑‑")

          let looksLikeMatch = (set1, set2) => {
            let matches = []
            if (set1.length != set2.length) {
              return false
            } else {
              for (let idx in set1) {
                if (set2[idx].includes(set1[idx])) {
                  matches.push(true)
                }
              }
            }

            return matches.every(v => v === true)

          }

          // Figure out how the select term fits into the existing term.
          if (splitStringLower.length != incomingPieces.length) {
            for (let termIdx in incomingPieces) {

              //check if the next piece is in the incoming
              if (incomingPieces[termIdx].includes(splitStringLower[this.searchStringPos + 1])) {
                replacePos.push(this.searchStringPos + 1)
              }
              //check if the prev piece is in the incoming
              else if (incomingPieces[termIdx].includes(splitStringLower[this.searchStringPos - 1])) {
                replacePos.unshift(this.searchStringPos - 1)
              }
            }
          } else if (splitStringLower.length == incomingPieces.length) {
            if (splitStringLower.at(-1) == incomingPieces.at(0)) {
              // we're appending, so we just want to replace the last piece of the current string
              replacePos.push(splitStringLower.length - 1)
            } else if (looksLikeMatch(splitStringLower, incomingPieces)) {
              replacePos = []
            } else { // same length, first and last don't match, and the arrays don't last.
              //should something happen?
            }

          } else {
            replacePos = []
          }
        }

        if (splitStringLower.includes(this.pickLookup[this.pickPostion].label.replaceAll('-', '‑').toLowerCase())) {
          let idx = splitStringLower.indexOf(this.pickLookup[this.pickPostion].label.replaceAll('-', '‑').toLowerCase())
          if (idx == this.activeComponentIndex) {
            splitString[this.activeComponentIndex] = this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')
            this.subjectString = splitString.join('--')
          }
        } if (replacePos.length > 0) {
          splitString.splice(replacePos[0], replacePos.length, this.pickLookup[this.pickPostion].label)
          this.subjectString = splitString.join('--')
          this.activeComponentIndex = replacePos[0]
        } else {
          // Replace the whole thing
          this.subjectString = this.pickLookup[this.pickPostion].label
          this.componetLookup = {}
          this.activeComponentIndex = 0
        }

        this.componetLookup[this.activeComponentIndex] = {}

        this.componetLookup[this.activeComponentIndex][this.pickLookup[this.pickPostion].label] = this.pickLookup[this.pickPostion]

        for (let k in this.pickLookup) {
          this.pickLookup[k].picked = false
        }
        // complex headings are all topics (...probably)
        this.typeLookup[this.activeComponentIndex] = 'madsrdf:Topic'
        this.pickLookup[this.pickPostion].picked = true

        //This check is needed to prevent falling into recursive loop when loading
        // existing data.
        if (update == true) {
          this.subjectStringChanged()
        }

        try {
          this.$refs.subjectInput.focus()
        } catch (err) {
          console.log("working with existing data: $refs")
        }

      } else {
        // console.log('1',JSON.parse(JSON.stringify(this.componetLookup)))
        // take the subject string and split
        let splitString = this.subjectString.split('--')

        // replace the string with what we selected
        splitString[this.activeComponentIndex] = this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')

        this.subjectString = splitString.join('--')


        if (!this.componetLookup[this.activeComponentIndex]) {
          this.componetLookup[this.activeComponentIndex] = {}
        }

        let _ = await this.getContext() //ensure the pickLookup has the marcKey
        this.componetLookup[this.activeComponentIndex][this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')] = this.pickLookup[this.pickPostion]

        for (let k in this.pickLookup) {
          this.pickLookup[k].picked = false
        }

        this.pickLookup[this.pickPostion].picked = true

        try {
          let marcKey = this.pickLookup[this.pickPostion].marcKey
          let type = marcKey.match(/\$[axyzv]{1}/g)
          type = this.getTypeFromSubfield(type[0])
          this.setTypeClick(null, type)
        } catch (err) {
          console.error("Error getting the type. ", err)
        }

        // console.log('2',JSON.parse(JSON.stringify(this.componetLookup)))
        //Need something to prevent recursion
        if (update == true) {
          this.subjectStringChanged()
        }
      }



    },

    //TODO get this working with mouseover
    loadContext: function (pickPostion) {
      if (this.pickCurrent == null) {
        this.pickPostion = pickPostion
      } else {
        return null
      }

      if (this.pickLookup[this.pickPostion].literal) {
        return false
      }

      this.getContext()

      if (this.contextData) {
        this.localContextCache[this.contextData.uri] = JSON.parse(JSON.stringify(this.contextData))
      }
    },

    getContext: async function () {
      if (this.pickLookup[this.pickPostion].literal) {
        this.contextData = this.pickLookup[this.pickPostion]
        return false
      }
      //let temp = await utilsNetwork.returnContext(this.pickLookup[this.pickPostion].uri)
      this.contextData = this.pickLookup[this.pickPostion].extra

      if (this.pickLookup[this.pickPostion].uri) {
        this.contextData.literal = false
        this.contextData.title = this.pickLookup[this.pickPostion].label
        this.contextData.uri = this.pickLookup[this.pickPostion].uri
        if (Object.keys(this.contextData).includes("marcKeys")) {
          this.pickLookup[this.pickPostion].marcKey = this.contextData.marcKeys[0]
        } else if (Object.keys(this.contextData).includes("marcKey")) {
          this.pickLookup[this.pickPostion].marcKey = this.contextData.marcKey
        }
        let types = this.pickLookup[this.pickPostion].extra['rdftypes']

        this.contextData.type = types.includes("Hub") ? "bf:Hub" : types.includes("Work") ? "bf:Work" : "madsrdf:" + types[0]
        this.contextData.typeFull = this.contextData.type.replace('madsrdf:', 'http://www.loc.gov/mads/rdf/v1#')

        //Check if it's a Jurisdiction, and overwrite
        if (this.pickLookup[this.pickPostion].extra['collections'].includes("http://id.loc.gov/authorities/names/collection_Jurisdictions")) {
          this.contextData.type = "bf:Jursidiction"
          this.contextData.typeFull = "http://id.loc.gov/ontologies/bibframe/Jurisdiction"
        }

        this.contextData.gacs = this.pickLookup[this.pickPostion].extra.gacs

      } else {
        this.contextData.literal = true
      }

      console.info("contextData: ", this.contextData)
      this.contextRequestInProgress = false
    },

    getTypeFromSubfield: function (subfield) {
      switch (subfield) {
        case ("$a"):
          subfield = "madsrdf:Topic"
          break
        case ("$x"):
          subfield = "madsrdf:Topic"
          break
        case ("$v"):
          subfield = "madsrdf:GenreForm"
          break
        case ("$y"):
          subfield = "madsrdf:Temporal"
          break
        case ("$z"):
          subfield = "madsrdf:Geographic"
          break
        default:
          subfield = false
      }

      return subfield
    },

    setTypeClick: function (event, type) {
      this.activeComponent.type = type
      this.typeLookup[this.activeComponentIndex] = type
      this.subjectStringChanged()
      this.$refs.subjectInput.focus()
    },

  },

  created: function () {
    console.info("created")
  },
  before: function () { },
  mounted: function () {
    console.info("mounted")
  },
  updated: function () { }
};

</script>

