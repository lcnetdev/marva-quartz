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
      <div class="search-heading">search heading</div>

      <!-- last row -->
      <div class="search-bar">
        <form autocomplete="off" style="height: 3em;">
          <input v-on:keydown.enter.prevent="navInput" placeholder="Enter Subject Headings Here" ref="subjectInput"
            autocomplete="off" type="text" v-model="subjectString" @input="subjectStringChanged" @keydown="navInput"
            @keyup="navString" @click="navStringClick" class="input-single-subject subject-input" id="subject-input">
        </form>

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
    buildComponents: function (searchString) {
      let subjectStringSplit = searchString.split('--')

      this.components = []
      let id = 0
      let activePosStart = 0
      let offset = 0

      for (let ss of subjectStringSplit) {
        let component = new Component(ss)
        component.posStart = activePosStart

        let tempSs = ss.replace("‑", "-")

        if (this.componetLookup[id + offset] && this.componetLookup[id + offset][tempSs]) {
          component.literal = this.componetLookup[id + offset][tempSs].literal
          component.uri = this.componetLookup[id + offset][tempSs].uri
          component.marcKey = this.componetLookup[id + offset][tempSs].marcKey
          component.nonLatinLabel = this.componetLookup[id + offset][tempSs].nonLatinTitle
          component.nonLatinMarcKey = this.componetLookup[id + offset][tempSs].nonLatinMarcKey
        } else if (this.componetLookup[id + offset] && this.componetLookup[id + offset][ss]) {
          component.literal = this.componetLookup[id + offset][ss].literal
          component.uri = this.componetLookup[id + offset][ss].uri
          component.marcKey = this.componetLookup[id + offset][ss].marcKey
          component.nonLatinLabel = this.componetLookup[id + offset][ss].nonLatinTitle
          component.nonLatinMarcKey = this.componetLookup[id + offset][ss].nonLatinMarcKey
        }

        if (this.typeLookup[id + offset]) {
          component.type = this.typeLookup[id + offset]
        }

        if (component.uri && component.uri.includes("/hubs/")) {
          component.type = "bf:Hub"
        }

        if (ss.includes('‑‑')) {
          component.complex(true)
        }
        component.posStart = activePosStart
        component.posEnd = activePosStart + ss.length

        this.components.push(component)

        activePosStart = activePosStart + ss.length + 2
        id++
      }

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

      let complexSub = []

      console.info("\n--------------searching")
      console.info("searchString: ", searchString)
      console.info("searchStringFull: ", searchStringFull)
      console.info("complexSub: ", complexSub)
      that.searchResults = await utilsNetwork.subjectSearch(searchString, searchStringFull, complexSub, that.searchMode)
      console.info("that.searchResults: ", that.searchResults, "\n-----------------------")

      // replace the true keyboard hypen with the werid hypen to prevent spliting on open lifedates
      for (let s of that.searchResults.names) {
        s.labelOrginal = s.label
        s.label = s.label.replaceAll('-', '‑')
      }

      // keep complex subjects as one piece
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
            if (that.activeComponent && that.pickLookup[k].label != that.activeComponent.label) {
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
        // that.checkToolBarHeight()

        // find out how small the smallest one is and then loop through and try to make all of them
        // that size so they fit on one line of the display
        let smallest_size = 1000;
        for (let el of document.getElementsByClassName("fake-option")) {

          if (el.offsetHeight < smallest_size && el.offsetHeight != 0) {
            smallest_size = el.offsetHeight
          }
        }
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
    },

    // Search String functions
    navStringClick: function (event) {
      // when clicked send it over to the navString func with fake key property to trigger if statement
      event.key = 'ArrowLeft'
      this.navString(event)
    },

    navString: function (event) {
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

        // keep track of where we were so that we don't do unessary refreshes
        if (this.oldActiveComponentIndex != this.activeComponentIndex) {
          // this.updateAvctiveTypeSelected()
          // this.subjectStringChanged(event)
          this.oldActiveComponentIndex = this.activeComponentIndex
        } else if (this.activeComponent.uri === null) {
          // this.updateAvctiveTypeSelected()
          // this.subjectStringChanged(event)
        }
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
              // this.subjectStringChanged()
              this.navString({ key: 'ArrowRight' })
            })
          }
        }
      }
    },
    subjectStringChanged: async function (event) {
      // Adjust for pasting from ClassWeb
      this.subjectString = this.subjectString.replace("—", "--")

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
        this.buildComponents(this.subjectString)
      }

      // this.renderHintBoxes()
      // if they are typing in the heading select it as we go
      if (event) {
        for (let c of this.components) {
          if (event.target.selectionStart >= c.posStart && event.target.selectionStart <= c.posEnd + 1) {
            this.activeComponent = c
            this.activeComponentIndex = c.id

            // it is not empty
            // it does not end with "-" so that '--' typing doesn't trigger a search
            if (c.label.trim() != '' && !c.label.endsWith('-')) {
              this.searchApis(c.label, event.target.value, this)

              // BUT if it ends with a number and - then it is a name with open life dates
              // so do look that one up
            } else if (/[0-9]{4}\??-/.test(c.label)) {
              this.searchApis(c.label, event.target.value, this)
            } else if (/,\s[0-9]{4}-/.test(c.label)) {
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

      // this.updateAvctiveTypeSelected()
      if (this.components.length == 1 && this.components[0].complex) {
        this.showTypes = false
      }

      // this.validateOkayToAdd()

      this.$nextTick(() => {
        // this.checkToolBarHeight()


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

          // this.updateAvctiveTypeSelected()
          // this.validateOkayToAdd()
        }, 400)
      })
    },

    navInput: function (event) {
      console.info("navInput")
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
                  inputV.focus()
                })

              })
            } else {
              this.$nextTick(() => {
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
    renderHintBoxes: function () { },

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


        if (this.componetLookup && !this.componetLookup[this.activeComponentIndex]) {
          this.componetLookup[this.activeComponentIndex] = {}
        }

        let _ = await this.getContext() //ensure the pickLookup has the marcKey
        this.componetLookup[this.activeComponentIndex][this.pickLookup[this.pickPostion].label.replaceAll('-', '‑')] = this.pickLookup[this.pickPostion]

        for (let k in this.pickLookup) {
          this.pickLookup[k].picked = false
        }

        this.pickLookup[this.pickPostion].picked = true

        let type = "Topic"
        try {
          if (this.pickLookup[this.pickPostion].extra.rdftypes.length > 0) {
            type = "madsrdf:" + this.pickLookup[this.pickPostion].extra.rdftypes[0]
          } else {
            let marcKey = this.pickLookup[this.pickPostion].marcKey
            type = marcKey.match(/\$[axyzv]{1}/g)
            type = this.getTypeFromSubfield(type[0])
          }
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

<style type="text/css">
#subject-builder-modal-container {
  background-color: white;
  height: 95vh;
  width: 95vw;
  margin-left: auto;
  margin-right: auto;
  display: grid;
  grid-gap: 2px;
  grid-template-columns: 50% 50%;
  grid-template-rows: 3% 87% 5% 5%;
}

/* first row */
.search-type {
  background-color: brown;
  grid-row: 1;
  grid-column: 1;
}

/* second row */
.search-results {
  background-color: aqua;
  grid-row: 2;
  grid-column: 1;
}

.detail-body {
  background-color: bisque;
  grid-row: 1/3;
  grid-column: 2;
  height: 100%;
  overflow-x: scroll;
}

/* third row */
.search-heading {
  background-color: burlywood;
  grid-row: 3;
  grid-column: 1/3;
}

/* last row */
.search-bar {
  background-color: coral;
  grid-row: 4;
  grid-column: 1/3;
}

.button-holder {
  background-color: darkgoldenrod;
  grid-row: 5;
  grid-column: 2;
}

/* Search type selection */
#search-in-holder button {
  font-size: 0.85em;
  background-color: white;
  color: black;
  border: solid 1px #c1c1c1;
}

#search-in-holder .active {
  background-color: whitesmoke;
  -webkit-box-shadow: inset 0px 0px 5px #c1c1c1;
  -moz-box-shadow: inset 0px 0px 5px #c1c1c1;
  box-shadow: inset 0px 0px 5px #c1c1c1;

}

/* Search bar */
.input-single-subject {
  width: 99%;
  border: none;
  font-size: 1.5em;
  min-height: 1.5em;
  max-height: 1.5em;
  background: none;
  background-color: #fff;
  border: 1px solid #9aa4a4;
  border-top-right-radius: 0.5em;
  border-bottom-right-radius: 0.5em;
}

.input-single-subject:focus {
  outline: 0;
}

/* Resource Type Selectiion */
.type-list-ol {
  padding-left: 0
}

.type-item {
  display: inline-block;
  border: solid 1px #9aa4a4;
  border-radius: 0.5em;
  padding: 0.1em;
  margin-left: 1em;
  cursor: pointer;
  background-color: transparent;
}

.type-item::before {
  content: " ";
}

.type-item-selected {
  background-color: #0080001f;
  border: solid 3px;
}

/* Details Panel */
.details-list {
  columns: 3;
  break-inside: avoid;
  padding-left: 20px;
}

.details-list:has(.details-details) {
  margin-top: 10px;
  padding-left: 0px;
  columns: 2;
  break-inside: avoid;
}

.details-details {
  list-style: none;
  break-inside: avoid;
}

.details-list>li {
  break-inside: avoid;
}

.see-search {
  width: 20px;
  height: 20px;
  font-size: x-small;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

ul:has(.modal-context-data-li) {
  padding-left: 20px;
}

.see-also {
  font-size: 12px;
  margin-right: 10px;
}

.expandable-class-label {
  cursor: help;
}

.expand {
  font-size: 14px;
}

.simptip-position-bottom::before,
.simptip-position-bottom::after {
  left: -30% !important;
}
</style>