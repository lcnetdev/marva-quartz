<template>

  <splitpanes class="default-theme" horizontal>

    <pane class="header"
      :size="returnPixleAsPercent(preferenceStore.returnValue('--n-edit-main-splitpane-nav-height', true))">
      <Nav />
    </pane>

    <pane>

      <!-- source: https://gridbyexample.com/patterns/header-twocol-footer/ -->
      <div class="copy-cat-wrapper">
        <header class="copy-cat-header no-print">
          Copy Cat Search
        </header>
        <div class="copy-cat-search no-print">
          <h1>Search OCLC</h1>
          <form ref="urlToLoadForm" v-on:submit.prevent="">
            <div class="search-box" style="display: flex; flex-direction: row;">
              <input placeholder="Enter Value to Search" class="url-to-load" type="text" v-model="wcQuery"
                ref="urlToLoad">
              <button class="material-icons search-button" @click="worldCatSearch(false, true)">search</button>
            </div>
            <br>
            <div class="toggle-btn-grp cssonly">
              <h3>Field to Search on</h3>
              <div v-for="opt in indexSelectOptions">
                <input :id="opt.label" type="radio" :value="opt.value" class="search-mode-radio" v-model="wcIndex"
                  name="searchIndex" />
                <label :for="opt.label" onclick="" class="toggle-btn">{{ opt.label }}</label>
                <a v-if="opt.value == 'sn'"
                  href="https://help.oclc.org/Librarian_Toolbox/Searching_WorldCat_Indexes/Bibliographic_records/Bibliographic_record_indexes/Indexes_S_to_Z/Standard_Number"
                  target="_blank" class="material-icons index-help">help</a>
              </div>
            </div>

            <br>
            <label for="target-type">What are you looking for </label>
            <select name="target-type" v-model="wcType">
              <option value="book">Book (Print)</option>
              <option value="ebook">Book (Digital)</option>
              <option value="audiobook">Audio Book</option>
              <option value="music">Music</option>
            </select>

          </form>

          <hr style="margin-bottom: 10px;;">
          Check for existing record using:
          <div id="container">
            <div class="match-selection">
              <form class="match-form">
                <input type="radio" name="match" id="lccn-match" class="lccn" value="lccn" @click="changeSearchType($event)" checked>
                <label for="lccn-match" class="lccn">LCCN</label>

                <input type="radio" name="match" id="bib-match"class="bib" value="bibid" @click="changeSearchType($event)">
                <label for="bib-match" class="bib">Bib ID</label>

                <input type="radio" name="match" id="other-match" class="other" value="other" @click="changeSearchType($event)">
                <label for="other-match" class="other">Other ID</label>
              </form>
            </div>
          </div>

          <br>
          <template v-if="searchType != 'lccn'">
            <label for="matchPoint">Match on: </label>
            <input name="matchPoint" id="matchPoint" type="text" v-model="isbn" @input="checkLccn" />
          </template>

          <template v-if="existingLCCN || existingISBN">
            <Badge v-if="existingLCCN"
              text="A record with this LCCN might exist. If you continue, the copy cat record will be merged with the existing record."
              badgeType="warning" :noHover="true" />
            <Badge v-if="existingISBN"
              text="A record with this identifier might exist. If you continue, the copy cat record will be merged with the existing record."
              badgeType="warning" :noHover="true" />
            <h4>
              <a class="existing-lccn-note" :href="existingRecordUrl" target="_blank">Existing Record with this {{
                existingLCCN ? 'LCCN' : 'identifier' }}: "{{ matchTitle }}"</a>
            </h4>
          </template>
          <template v-else>
            <Badge v-if="urlToLoad != '' && !checkingLCCN && !existingLCCN && searchType == 'lccn' && wcIndex == 'sn'"
              text="No matches for this LCCN, try searching for on another identifier like the ISBN." badgeType="warning" :noHover="true" />
          </template>

          <br>
          <label for="lccn">LCCN: </label>
          <input name="lccn" id="lccn" type="text" v-model="urlToLoad" @input="checkLccn"
            :disabled="selectedRecordUrl" />
          <Badge v-if="selectedRecordUrl" text="This LCCN is from the selected record." noHover="true"
            badgeType="primary" />
          <br>
          <label for="override">Overlay known BibId? </label>
          <input name="oveerrid" id="overrid" type="checkbox" v-model="overrideAllow" /><br>
          <template v-if="overrideAllow">
            <label for="matchPoint">Known BibId (001): </label>
            <input name="matchPoint" id="overrideBibid" type="text" v-model="overrideBibid" @input="checkLccn" />
          </template>
          <br><br>

          <label for="prio">Priority: </label><input name="prio" type="text" v-model="recordPriority"
            :class="{ 'needs-input': !recordPriority }" /><br>
          <label for="jackphy">Does this record contain non-Latin script that should be retained? </label>
          <input name="jackphy" id="jackphy" type="checkbox" v-model="jackphyCheck" /><br>
          <br>
          <h3>Load with profile:</h3>
          <Badge v-if="!this.selectedWcRecord" text="(select a record to continue)" badgeType="secondary" :noHover="true" />
          <template v-if="(!existingLCCN && !existingISBN && !overrideAllow) && selectedWcRecord">
            <Badge text="No record to overlay. This will create a new record." badgeType="warning" :noHover="true" />
          </template>
          <template v-if="posting">
            <Badge text="Sending record for processing. This may take a moment." badgeType="info" :noHover="true" />
          </template>
          <template></template>
          <div class="load-buttons">
            <button :class="['load-button', { 'disabled-button': disableCopyCatButtons() }]"
              @click="loadCopyCat(s.instance)" v-for="s in startingPointsFiltered">
              {{ s.name }}
            </button>
          </div>

        </div>
        <div class="copy-cat-results no-print">
          <h1>Results</h1>
          <div>
            <h2 v-if="wcResults?.results && Number(wcResults?.results?.numberOfRecords) === 0">
              No results :(
            </h2>
            <h2 v-else-if="wcResults.error && !queryingWc">
              There was an error getting the results: "{{ wcResults.error.message }}"
            </h2>
            <h2 v-else-if="wcResults?.results?.briefRecords && wcResults?.results?.numberOfRecords > 0 && !queryingWc">
              Showing 10 of {{ wcResults.results.numberOfRecords }} results </h2>
                <!-- Pagination -->
                <div v-if="(wcResults.results && wcResults.results.numberOfRecords > wcLimit) && !queryingWc"
                  class="wc-search-paging">
                  <Pagination :wcResults="wcResults" :wcLimit="wcLimit" :currentPage="searchPage"
                    @emitCurrentPage="setSearchPage" />
                </div>
          </div>
          <template v-if="queryingWc">
            <li>Searching...</li>
          </template>
          <template v-else-if="!queryingWc && wcResults.results && wcResults.results.numberOfRecords > 0">
            <template v-for="(row) in wcResults.results.briefRecords">
              <CopyCatCard :record="row" :selectedWcRecord="selectedWcRecord" @selectedCard="setSelectedRecord" />
            </template>
          </template>
          <div v-if="(wcResults.results && wcResults.results.numberOfRecords > wcLimit) && !queryingWc"
            class="wc-search-paging">
            <Pagination :wcResults="wcResults" :wcLimit="wcLimit" :currentPage="searchPage"
              @emitCurrentPage="setSearchPage" />
          </div>
        </div>

        <div class="copy-cat-marc">
          <div v-if="Object.keys(selectedWcRecord).length > 0">
            <button @click="printMarc" id="button-print-marc">Print</button>
            <div id="printArea">
              Selected OCLC Number: {{ selectedWcRecord['oclcNumber'] }}
              <br>
              MARC Preview<br>
              <hr class="marc-divider">
              <div v-html="selectedWcRecord['marcHTML']"></div>
            </div>
          </div>
        </div>
      </div>

    </pane>
  </splitpanes>

</template>


<script>

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { usePreferenceStore } from '@/stores/preference'
import { useConfigStore } from '@/stores/config'
import { useProfileStore } from '@/stores/profile'

import { mapStores, mapState, mapWritableState } from 'pinia'

import Nav from "@/components/panels/nav/Nav.vue";

import utilsProfile from '@/lib/utils_profile';
import utilsNetwork from '@/lib/utils_network';
import utilsParse from '@/lib/utils_parse';
import short from 'short-uuid'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

import CopyCatCard from './copyCatComponents/CopyCatCard.vue'
import Pagination from './copyCatComponents/Pagination.vue'
import Badge from './copyCatComponents/Badge.vue'

import { DataTable } from "@jobinsjp/vue3-datatable"
import "@jobinsjp/vue3-datatable/dist/style.css"

if (TimeAgo.getDefaultLocale() != 'en') { TimeAgo.addDefaultLocale(en) }
const timeAgo = new TimeAgo('en-US')

const decimalTranslator = short("0123456789");

export default {
  components: { Splitpanes, Pane, Nav, DataTable, CopyCatCard, Pagination, Badge },
  data() {
    return {

      urlToLoad: '',
      selectedRecordUrl: false,
      continueRecords: [],

      urlToLoadIsHttp: false,

      searchByLccnResults: null,
      lccnToSearchTimeout: null,

      lccnLoadSelected: false,


      displayDashboard: true,
      displayAllRecords: false,
      isLoadingAllRecords: false,

      allRecords: [],

      wcIndex: "sn",
      wcType: "book",
      wcQuery: "",
      wcOffset: 0,
      wcLimit: 10,
      queryingWc: false,
      wcResults: [],
      // https://help.oclc.org/Librarian_Toolbox/Searching_WorldCat_Indexes/Bibliographic_records/Bibliographic_record_indexes/Bibliographic_record_index_lists/Alphabetical_list_of_available_WorldShare_and_WorldCat_Discovery_bibliographic_record_indexes
      indexSelectOptions: [
        { label: 'Standard Numbers', value: 'sn' },
        { label: 'Title', value: 'ti' },
        { label: 'Name', value: 'au' },
        { label: 'Keyword', value: 'kw' },
      ],
      wcLoadSelected: false,
      wcLabels: [
        'CatLevel', 'title', 'creator', 'date', 'language', 'generalFormat',
        'publisher', 'publicationPlace', 'isbns', 'issns'
      ],
      wcLabelMap: {
        "title": "Title",
        "creator": "Creator",
        "date": "Date",
        "language": "Language",
        "generalFormat": "Format",
        "publisher": "Publisher",
        "publicationPlace": "Place of Publication",
        "isbns": "ISBNs",
        "issns": "ISSNs",
        "CatLevel": "CatLevel"
      },
      oclcEncodingLevelsHigh: [' ', '1', 'I'],
      oclcEncodingLevelsLow: ['K', 'M', '3', '4', '5', '7', '8'],
      selectedWcRecord: false,
      searchPage: 1,
      posting: false,
      copyCatLccn: null,
      recordPriority: 3,
      jackphyCheck: false,
      ibcCheck: false,
      responseURL: null,
      existingLCCN: false,
      existingISBN: false,
      existingRecordUrl: "",
      hasLccn: false,
      checkingLCCN: false,
      searchType: 'lccn',
      isbn: '',
      matchTitle: '',
      overrideAllow: false,
      overrideBibid: "",

    }
  },
  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(usePreferenceStore),
    ...mapStores(useProfileStore),
    ...mapState(usePreferenceStore, ['styleDefault', 'panelDisplay']),
    ...mapState(useConfigStore, ['testData']),
    ...mapState(useProfileStore, ['startingPoints', 'profiles', 'copyCatMode']),
    ...mapWritableState(useProfileStore, ['activeProfile', 'emptyComponents', 'activeProfilePosted', 'activeProfilePostedTimestamp', 'copyCatMode', 'copyCatSearch']),


    // // gives read access to this.count and this.double
    // ...mapState(usePreferenceStore, ['profilesLoaded']),

    startingPointsFiltered() {
      let points = []
      for (let k in this.startingPoints) {
        if (this.startingPoints[k].work && this.startingPoints[k].instance && k != 'IBC description') {
          points.push(this.startingPoints[k])
        }
      }

      points.push({ "name": "HUB", "work": null, "instance": "lc:RT:bf2:HubBasic:Hub", "item": null },)

      return points
    },

  },

  watch: {},

  methods: {
    changeSearchType: function (event) {
      this.searchType = event.target.value

      this.checkLccn()
    },

    printMarc: function () {
      var printContents = document.getElementById('printArea').innerHTML

      // load the printable content into a new window and print that.
      this.windowRef = window.open("", "", "width=600,height=400,left=200,top=200");
      this.windowRef.addEventListener('beforeunload', this.closePortal);
      this.windowRef.document.body.innerHTML = printContents
      this.windowRef.print()
      this.windowRef.close()

    },
    loadLccnFromRecord: function (record) {
      if (!record) { return false }
      let marc010 = this.getMarcFieldAsString(record, "010")
      if (!marc010) { return false }

      let idx = marc010.indexOf("$a")
      this.urlToLoad = marc010.slice(idx + 2).trim()

      this.checkLccn()
      return true
    },

    setSelectedRecord: function (value) {
      this.urlToLoad = ''
      this.selectedWcRecord = value

      // check if there's an LCCN in the record
      let existingLccn = this.loadLccnFromRecord(value)
      this.selectedRecordUrl = existingLccn
      this.checkLccn()
      console.info("load: ", existingLccn)
      console.info("this.selectedRecordUrl: ", this.selectedRecordUrl)
    },

    setSearchPage: function (value) {
      this.searchPage = value
      this.worldCatSearch()
    },

    /**
     * Enabled when:
     *    Record is selected
     *    LCCN is present
     *    Priority is given
     *    Not sending record to BFDB
     */
    disableCopyCatButtons: function () {
      if (this.posting) { return true }
      if (!this.recordPriority) { return true }

      let recordSelected = (this.selectedWcRecord) ? true : false

      if (this.checkRecordHasLccn(this.selectedWcRecord)) { return false }
      //if (!this.urlToLoad) { return true }
      if (this.checkingLCCN) { return true }

      return !recordSelected
    },

    /**
     * TODO: make sure, the xml is building correctl
     * - override match [good]
     * - bib match [good]
     * - other match [good]
     * - lccn matc
     */

    checkLccn: async function () {
      console.info("checkLCCN: ", this.searchType)
      // if (this.urlToLoad.length < 3){ return }
      if(this.overrideAllow && this.overrideBibid !=''){
        console.info("override: ", this.overrideBibid)
        console.info("checking override: ", this.overrideBibid)
        this.existingRecordUrl = "https://preprod-8080.id.loc.gov/resources/instances/" + this.overrideBibid + ".html"
        this.searchType = 'bibid'
      } else {
        this.existingLCCN = false
        this.existingISBN = false
      }

      let recordData = null

      if (this.searchType == 'bibid'){
        this.checkingLCCN = true
        let url = "https://preprod-8080.id.loc.gov/resources/instances/" + this.isbn + ".html"
        let resp = await utilsNetwork.searchBibId(this.isbn)
        this.checkingLCCN = false
        if (resp.status == 200){
          this.existingISBN = true
          this.existingRecordUrl = url
          recordData = await resp.text()
        }
      } else if (this.searchType == 'lccn') {
        this.checkingLCCN = true
        let resp = await utilsNetwork.searchLccn(this.urlToLoad)
        this.checkingLCCN = false
        try {
          this.existingLCCN = resp.status != 404

          //9789975865623
          //2024387549
          console.info("     >>>>> ", typeof resp)
          console.info("     status ", resp.status)
          console.info("     headers ", resp.headers)
          console.info("     headers ", Object.keys(resp.headers))
          console.info("     x-uri ", resp.headers.get('x-uri'))
          console.info("     x-preflabel ", resp.headers.get('x-preflabel'))
          console.info("headers: ", ...resp.headers)

          if (this.existingLCCN) {
            this.existingRecordUrl = resp.url
            this.existingISBN = false
          } else {
            this.existingRecordUrl = ""
          }
        } catch {
          this.existingLCCN = null
          this.existingRecordUrl = ""
        }
      }

      // check the ISBN
      // else if (!this.existingLCCN && this.wcIndex == "sn"){
      else if (this.searchType == 'other') {
        this.checkingLCCN = true
        let potentialISBN = this.isbn
        let resp = await utilsNetwork.searchLccn(potentialISBN)
        this.checkingLCCN = false
        try {
          this.existingISBN = resp.status != 404
          if (this.existingISBN) {
            this.existingRecordUrl = resp.url
            this.existingLCCN = false
          } else {
            this.existingRecordUrl = ""
          }
        } catch {
          this.existingISBN = false
          this.existingRecordUrl = ""
        }
      }

      console.info("this.existingRecordUrl: ", this.existingRecordUrl)
      if (this.existingRecordUrl) {
        if (!recordData){
          recordData = await utilsNetwork.fetchSimpleLookup(this.existingRecordUrl)
        }
        const parser = new DOMParser()
        const doc = parser.parseFromString(recordData, "text/html")
        let title = doc.querySelectorAll('[name="dc.title"]')
        this.matchTitle = title[0].content.split("(Instance)")[0]
      }
    },

    encodingLevel: function (value) {
      if (this.oclcEncodingLevelsHigh.includes(value)) {
        return 'High'
      }
      return 'Low'
    },

    getMarcFieldAsString: function (record, target) {
      try {
        let fields = record.marcRaw.fields.filter((f) => f[0] == target)

        for (let field of fields) {
          let tag = field[0]
          let indicators = field[1]
          let subfields = field.slice(2).map((item, idx) => {
            if (idx % 2 == 0) {
              return "$" + item
            } else {
              return " " + item.trim()
            }
          }).join("")

          return tag + indicators + subfields
        }
      } catch (err) {
        console.error("err: ", err)
        return false
      }
    },

    checkRecordHasLccn: function (record) {
      console.info("hasLCCN?: ", record)
      if (record) {
        let marc010 = this.getMarcFieldAsString(record, "010")
        console.info("marc010: ", marc010)
        if (!marc010) { return false }

        if (marc010.includes('$a')) { return true }
      }
    },

    isRdaRecord: function (record) {
      const marc040 = record.marcRaw.fields.filter((f) => f[0] == '040').join()
      const rdaRecord = marc040.includes('e,rda')
      const leader = record.marcRaw.leader
      const aacr2 = leader.at(18) == 'a'
      const marc260 = record.marcRaw.fields.filter((f) => f[0] == '260').join()

      if (rdaRecord) {
        return true
      } else if (!aacr2 && marc260 == "") {
        return true
      } else if (marc260 == "") {
        return true
      }
      return false
    },

    determineLevel: function (record) {
      /**
       * PCCAdapt -- indicates that the record is a fuller-level record, and the language of cataloging is English. Process the record as full-level RDA.
       * Copycat  -- indicates that the record is a fuller-level record, and the language of cataloging is English. Process the record as RDA, with 042 = lccopycat. Exceptionally: process according to “encoding level 7 lccopycat” procedures (DCM B13, Appendix 7).
       * OrigRes  -- indicates that the record is a lower-level record, and/or that the language of cataloging is other than English.
       * OrigCop  -- indicates that an existing LC RDA record for another edition can be used to create a new full-level RDA record.
       */

      this.isRdaRecord(record)

      const catLang = record.catalogingInfo.catalogingLanguage
      const isEng = catLang == "eng"
      const catEncodeLevel = record.catalogingInfo.levelOfCataloging
      const catAgency = record.catalogingInfo.catalogingAgency
      const catTransAgency = record.catalogingInfo.transcribingAgency
      const marc042 = record.marcRaw.fields.filter((f) => f[0] == '042').join()
      const pccRecord = marc042.includes('pcc')

      let catLevel = false
      if (pccRecord && isEng) {
        catLevel = 'PccAdapt'
      } else if (this.oclcEncodingLevelsHigh.includes(catEncodeLevel) && !pccRecord && isEng) {
        catLevel = 'CopyCat'
      } else if (catAgency == 'DLC' && catTransAgency == 'DLC') {
        catLevel = 'OrigCop'
      } else {
        catLevel = 'OrigRes'
      }

      return catLevel //catLang + " " + catEncodeLevel + " " + catAgency + " " + pccRecord

    },


    worldCatSearch: async function (marc = false, pageReset = false) {
      if (pageReset) {
        this.searchPage = 1
      }

      this.selectedWcRecord = false

      this.queryingWc = true
      if (this.searchPage != 1) {
        this.wcOffset = 10 * (this.searchPage -1) + 1
        this.wcLimit = 10
      } else {
        this.wcOffset = 1
        this.wcLimit = 10
      }

      const cleanQuery = this.wcQuery.trim()

      if (this.wcIndex == 'sn') {
        this.wcIndex = "sn: " + cleanQuery + " OR " + "no: "
      }

      try {
        this.wcResults = await utilsNetwork.worldCatSearch(cleanQuery, this.wcIndex, this.wcType, this.wcOffset, this.wcLimit, marc)
        console.info("this.wcResults", this.wcResults)
        if (!Object.keys(this.wcResults.results).includes("numberOfRecords")) {
          this.wcResults.results["numberOfRecords"] = 1
          this.wcResults.results["briefRecords"] = [this.wcResults.results]
        }
      } catch (err) {
        this.wcResults = { "error": err }
      }

      if (this.wcIndex.includes("sn")) {
        this.wcIndex = 'sn'
      }

      this.queryingWc = false
    },

    createSubField: function (code, value, parent) {
      let subfield = document.createElementNS("http://www.loc.gov/MARC21/slim", "subfield")
      subfield.setAttribute("code", code)
      subfield.innerHTML = value
      if (value != ''){
        parent.appendChild(subfield)
      }
    },

    loadCopyCat: async function (profile) { // load into BFDB/ID
      let continueWithLoad = true
      if (this.existingLCCN) {
        continueWithLoad = confirm("There is a record with the LCCN already. If you continue, the Copy Cat record will be merged with it. Do you want to continue?")
      }
      if (this.existingISBN) {
        continueWithLoad = confirm("There is a record that matches this ISBN. If you continue, the Copy Cat record will be merged with it. Do you want to continue?")
      }
      if (!continueWithLoad) { return }

      let xml = this.selectedWcRecord.marcXML.replace(/\n/g, '').replace(/>\s*</g, '><')

      xml = xml.replace("<record>", "<record xmlns='http://www.loc.gov/MARC21/slim'>")
      let continueWithLccn = true
      // if (!this.copyCatLccn){
      if (this.urlToLoad.length != 10) {
        continueWithLccn = confirm("This LCCN is not the expected length. Do you want to continue with it?")
      }


      if (!continueWithLccn) { return }

      let parser = new DOMParser()
      xml = parser.parseFromString(xml, "text/xml")

      // Create a dummy field to pass user values to processor
      let dummyField = document.createElementNS("http://www.loc.gov/MARC21/slim", "datafield")
      dummyField.setAttribute("tag", "998")
      dummyField.setAttribute("ind1", " ")
      dummyField.setAttribute("ind2", " ")

      /*
      * 998:
      * $a: LCCN
      * $b: Priority
      * $c: JACKPHY
      * $d: Record Quality
      * $e: Overlay
      * $f: BibID for Overlay
      * $x: Local ID
      * $z: Cataloger Code
      */


      this.createSubField("a", this.urlToLoad, dummyField)
      this.createSubField("b", this.recordPriority, dummyField)
      this.createSubField("c", this.jackphyCheck, dummyField)
      this.createSubField("d", this.determineLevel(this.selectedWcRecord), dummyField)

      console.info("setting up overlay: ", this.existingLCCN, "--", this.existingISBN)
      let bibId = ""
      let marva001 = false
      if (this.existingLCCN || this.existingISBN || (this.overrideAllow && this.overrideBibid != '')) {
        this.createSubField("e", "overlay bib", dummyField)
        if (this.existingRecordUrl != "") {
          if (this.overrideAllow && this.overrideBibid != ''){
            this.createSubField("f", this.overrideBibid, dummyField)
          } else {
            bibId = this.existingRecordUrl.split("/").at(-1).replace(".html", "")
            this.createSubField("f", bibId, dummyField)
          }
        }
      } else {
        marva001 = await utilsNetwork.getMarva001()
        this.createSubField("x", marva001, dummyField)
      }

      // cataloger code
      let catCode = "??"
      try {
        catCode = this.preferenceStore.catCode
      } catch (err) {
        console.error("Couldn't get cataloger code")
      }

      this.createSubField("z", catCode, dummyField)

      xml.documentElement.appendChild(dummyField)

      let strXmlBasic = (new XMLSerializer()).serializeToString(xml.documentElement)

      console.info("strXmlBasic: ", strXmlBasic)

      this.posting = true
      this.postResults = {}

      this.postResults = await utilsNetwork.addCopyCat(strXmlBasic)
      this.posting = false

      console.info("this.postResults: ", this.postResults)

      this.responseURL = this.postResults.postLocation

      if (!this.responseURL) {
        alert("There was an issue sending the record.")
        console.error("Failed to send copy cat record: ", this.postResults)
        return
      }

      let recordId = ''
      if (this.existingLCCN || this.existingISBN) {
        recordId = bibId
      } else {
        if (useConfigStore().returnUrls.env != 'production'){
          recordId = marva001
          console.info("eNumber: ", this.responseURL.split("/").at(-1).replaceAll(/\.[^/.]+/g, ''))
        } else {
          recordId = this.responseURL.split("/").at(-1).replaceAll(/\.[^/.]+/g, '')
        }
      }

      console.info("recordId: ", recordId)
      if(useConfigStore().returnUrls.env == 'staging'){
        this.urlToLoad = "https://preprod-8299.id.loc.gov/resources/instances/" + recordId + ".cbd.xml"
      } else {
        this.urlToLoad = "https://preprod-8080.id.loc.gov/resources/instances/" + recordId + ".cbd.xml"
      }
      this.existingLCCN = false
      this.existingISBN = false

      try {
        console.info("loading URL to Marva: ", this.urlToLoad)
        this.loadUrl(profile)
      } catch (err) {
        alert("Couldn't load the record with the selected profile.")
        console.error("Failed to load CopyCat record: ", err)
        return
      }
    },

    returnPixleAsPercent: function (pixles) {
      return pixles / window.innerHeight * 100
    },

    loadUrl: async function (useInstanceProfile, multiTestFlag) {
      if (this.lccnLoadSelected) {

        this.urlToLoad = this.lccnLoadSelected.bfdbPackageURL

      }

      if (this.urlToLoad.trim() !== '') {

        let xml = await utilsNetwork.fetchBfdbXML(this.urlToLoad)
        if (!xml) {
          alert("There was an error retrieving that URL. Are you sure it is correct: " + this.urlToLoad)
          return false
        }
        // check for XML problems here ?
        utilsParse.parseXml(xml)
      }

      // find the right profile to use from the instance profile name used
      let useProfile = null
      for (let key in this.profiles) {
        if (this.profiles[key].rtOrder.indexOf(useInstanceProfile) > -1) {
          useProfile = JSON.parse(JSON.stringify(this.profiles[key]))
        }
      }

      this.activeProfilePosted = false
      this.activeProfilePostedTimestamp = false

      if (this.urlToLoad.trim() !== '') {
        // we might need to load in a item
        if (utilsParse.hasItem > 0) {
          // loop the number of ITEMS there are in the XML
          Array.from(Array(utilsParse.hasItem)).map((_, i) => {
            let useItemRtLabel
            // look for the RT for this item
            useItemRtLabel = useInstanceProfile.replace(':Instance', ':Item')

            let foundCorrectItemProfile = false
            for (let pkey in this.profiles) {
              for (let rtkey in this.profiles[pkey].rt) {
                if (rtkey == useItemRtLabel) {
                  let useRtLabel = useItemRtLabel + '-' + (i + 1)
                  let useItem = JSON.parse(JSON.stringify(this.profiles[pkey].rt[rtkey]))

                  // make the guids for all the properties unique
                  for (let ptk in useItem.pt) {
                    useItem.pt[ptk]['@guid'] = short.generate()
                  }

                  // console.log('using',this.profiles[pkey].rt[rtkey])
                  foundCorrectItemProfile = true
                  useProfile.rtOrder.push(useRtLabel)
                  useProfile.rt[useRtLabel] = useItem
                  // console.log(JSON.parse(JSON.stringify(useProfile)))
                }
              }
            }

            if (!foundCorrectItemProfile) {
              console.warn('error: foundCorrectItemProfile not set ---------')
              console.warn(this.rtLookup[useItemRtLabel])
            }
          });
        }
      }

      if (!useProfile.log) {
        useProfile.log = []
      }

      // setup the log and set the procinfo so the post process knows what to do with this record
      useProfile.log.push({ action: 'loadInstance', from: this.urlToLoad })
      useProfile.procInfo = "update instance"

      // also give it an ID for storage
      if (!useProfile.eId) {
        // let uuid = 'e' + decimalTranslator.new()
        // uuid = uuid.substring(0, 8)
        let uuid = 'e' + Date.now().toString()
        useProfile.eId = uuid
        useProfile.neweId = true
      }

      if (!useProfile.user) {
        useProfile.user = this.preferenceStore.returnUserNameForSaving
      }

      if (!useProfile.status) {
        useProfile.status = 'unposted'
      }

      if (this.urlToLoad.trim() !== '') {
        let profileDataMerge = await utilsParse.transformRts(useProfile)
        this.activeProfile = profileDataMerge
      } else {
        // if there is not url they are making it from scratch, so we need to link the instances and work together
        useProfile = utilsParse.linkInstancesWorks(useProfile)

        this.activeProfile = useProfile

        // prime this for ad hoc mode
        for (let rt in this.activeProfile.rt) {
          this.emptyComponents[rt] = []
          for (let element in this.activeProfile.rt[rt].pt) {
            this.profileStore.addToAdHocMode(rt, element)
          }
        }
      }

      if (multiTestFlag) {
        this.$router.push(`/multiedit/`)
        return true
      }

      this.$router.push(`/edit/${useProfile.eId}`)
    },
  },

  mounted: async function () {
    //reset the title
    document.title = `Marva`;

    this.jackphyCheck = this.preferenceStore.returnValue("--b-edit-copy-cat-non-latin")
	this.recordPriority = this.preferenceStore.returnValue("--n-edit-copyt-cat-prio")

    if (this.copyCatSearch !== null){
      this.wcQuery = this.copyCatSearch
      this.worldCatSearch(false, true)

      this.copyCatSearch = null
    }
  },
  created: async function () { }
}

</script>


<style scoped>
label {
  cursor: pointer;
}

.search-box {
  display: flex;
  flex-direction: row;
  border: 1px solid grey;
  padding: 1px;
  background-color: #fff;
}

.search-box:focus-within {
  outline: 2px solid v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
}

.url-to-load {
  font-size: 1.25em;
  width: 100%;
  border: none;
}

.url-to-load:focus {
  outline: none;
}

.search-button {
  display: block;
  height: 30px !important;
  width: 30px !important;
  padding: 0;
  border-radius: 50%;
  border: none;
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
}

.search-button:hover {
  filter: saturate(3);
}


.load-buttons {
  text-align: justify;
}

.load-button {
  font-size: 1.25em;
  margin: 0.25em;
  background-color: white;
  border: solid 1px var(--c-black-mute);
  border-radius: 2px;
  cursor: pointer;
}

.load-button:hover {
  border: solid 1px var(--c-black);
  background-color: var(--c-white-soft);
}

.header {
  background-color: white !important;
}

body {
  background-color: white;
}

.load {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color')") !important;
  color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')") !important;

  padding: 1em;
}

hr {
  margin-bottom: 2em;
  margin-top: 2em;
}

.header {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-background-color')") !important;

}

/****** Copy Cat ******/
*,
*:before,
*:after {
  box-sizing: border-box;
}

body {
  margin: 40px;
  font-family: 'Open Sans', 'sans-serif';
  background-color: #fff;
  color: #444;
}

h1,
p {
  margin: 0 0 1em 0;
}

/* no grid support? */
.copy-cat-search {
  float: left;
  width: 20%;
}

.copy-cat-search {
  max-height: 1000px;
  overflow-y: scroll;
}

.copy-cat-results {
  float: left;
  width: 20%;
  max-height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
}

.copy-cat-marc {
  float: right;
  width: 45%;
  height: 100%;
  overflow-y: scroll;
}

/* make a grid */
.copy-cat-wrapper {
  max-width: 98%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  grid-gap: 10px;

  overflow-y: hidden;
  position: fixed;
  height: 90%;

  margin-top: 5px;
  margin-left: 1%;
}

.copy-cat-wrapper>* {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-components')");
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-font-color')");
  border-radius: 5px;
  padding: 20px;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-copy-cat-font-size')");
  /* needed for the floated layout*/
  margin-bottom: 10px;
}

/* , .copy-cat-marc  */
.copy-cat-header {
  font-size: 30px;
  grid-column: 1 / -1;
  /* needed for the floated layout */
  clear: both;
}

.marc-divider {
  margin: 5px;
}

/** MARC preview formatting */
:deep() .marc.record {
  font-family: monospace;
  height: 90%;
}

:deep() .marc.indicators {
  white-space: pre;
}


:deep() .marc.subfield.subfield-0 .subfield-value,
:deep() .marc.subfield.subfield-1 .subfield-value {
  width: 4.5em;
  display: inline-block;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.5);
  vertical-align: bottom;
}

:deep() div.marc.field {
  text-indent: 4em hanging;
}

:deep() div.marc.field:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-marc-hover')");
}

:deep() span.marc.subfield:has(> .subfield-label):hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-marc-hover')");
  filter: saturate(3);
}

:deep() span.marc.subfield:hover>.subfield-label {
  font-weight: bold;
  font-style: italic;
}

.existing-lccn-note {
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-font-color')");
}

.index-help {
  font-size: 14px;
  text-decoration: none;
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-font-color')");
}

.disabled-button {
  pointer-events: none;
  background-color: grey;
}

.needs-input {
  border: 2px solid red;
}

#button-print-marc {
  float: right;
  z-index: 999;
}

/* We need to set the widths used on floated items back to auto, and remove the bottom margin as when we have grid we have gaps. */
@supports (display: grid) {
  .copy-cat-wrapper>* {
    width: auto;
    margin: 0;
  }
}

/* toggle */
/* https://hudecz.medium.com/how-to-create-a-pure-css-toggle-button-2fcc955a8984 */
#container {
  width: fit-content;
  display: flex;
  justify-content: center;

}

.match-selection{
  padding: 8px 5px 8px 5px !important;
  align-self: center;
  padding-top: 10px;
  padding-bottom: 10px;
}


.match-form > label {
  margin-left: 10px;
  border: 2px solid grey;
  border-radius: 5px;
  padding: 1px;
}

.match-form > label:last-child {
  margin-right: 10px;
}

.match-selection {
  background-color: rgba(0, 0, 16, 0.8);
  padding: 0.4rem 0.4rem 0.1rem 0.4rem;
  border-radius: 2.2rem;
}

.match-form > input[type="radio"] {
  position: absolute;
  opacity: 0;
}

label[class="lccn"],
label[class="bib"],
label[class="other"]{
  font-weight: bold;
  color: grey;
}

label[class="lccn"]:hover,
input[class="lccn"]:checked + label,
label[class="lccn"]:focus,
label[class="bib"]:hover,
input[class="bib"]:checked + label,
label[class="bib"]:focus,
label[class="other"]:hover,
input[class="other"]:checked + label,
label[class="other"]:focus {
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");;
  border: 2px solid v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");;

}

</style>
