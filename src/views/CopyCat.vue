<template>

  <splitpanes class="default-theme" horizontal>

    <pane class="header"
      :size="returnPixleAsPercent(preferenceStore.returnValue('--n-edit-main-splitpane-nav-height', true))">
      <Nav />
    </pane>

    <pane>

      <!-- source: https://gridbyexample.com/patterns/header-twocol-footer/ -->
      <div class="copy-cat-wrapper">
        <header class="copy-cat-header">
          Copy Cat Search
        </header>
        <div class="copy-cat-search">
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
          <hr>
          <label for="lccn">LCCN: </label>
          <input name="lccn" id="lccn" type="text" v-model="urlToLoad" @input="checkLccn"
            :disabled="loadLccnFromRecord(selectedWcRecord)" />
          <Badge v-if="loadLccnFromRecord(selectedWcRecord)" text="This LCCN is from the selected record."
            noHover="true" badgeType="primary" />
          <br>
          <template v-if="existingLCCN">
            <br>
            <Badge
              text="A record with this LCCN might exist. If you continue, the copy cat record will be merged with the existing record."
              badgeType="warning" :noHover="true" />
            <h4>
              <a class="existing-lccn-note" :href="existingRecordUrl" target="_blank">Existing Record with this LCCN</a>
            </h4>
            <br>
          </template>
          <template v-else-if="urlToLoad.length < 10 && urlToLoad.length != 0">
            <br>
            <Badge text="LCCNs should be 10 characters long." badgeType="warning" :noHover="true" />
            <br>
          </template>
          <br>
          <label for="prio">Priority: </label><input name="prio" type="text" v-model="recordPriority"
            :class="{ 'needs-input': !recordPriority }" /><br>
          <!-- <label for="ibc">Is there an IBC with the same LCCN? : </label><input name="ibc" id="ibc" type="checkbox" v-model="ibcCheck" /><br> -->
          <label for="jackphy">Does this record contain non-Latin script that should be retained? </label><input
            name="jackphy" id="jackphy" type="checkbox" v-model="jackphyCheck" /><br>
          <br>
          <h3>Load with profile:</h3>
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
        <div class="copy-cat-results">
          <h1>Results</h1>
          <div>
            <h2 v-if="wcResults?.results && Number(wcResults?.results?.numberOfRecords) === 0">
              No results :(
            </h2>
            <h2 v-else-if="wcResults.error && !queryingWc">
              There was an error getting the results: "{{ wcResults.error.message }}"
            </h2>
            <h2 v-else-if="wcResults?.results?.briefRecords && wcResults?.results?.numberOfRecords > 0 && !queryingWc">
              Showing {{ wcLimit < wcResults.results.numberOfRecords ? wcLimit : wcResults.results.numberOfRecords }} of
                {{ wcResults.results.numberOfRecords }} results </h2>
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
            Selected OCLC Number: {{ selectedWcRecord['oclcNumber'] }}
            <br>
            MARC Preview<br>
            <hr class="marc-divider">
            <div v-html="selectedWcRecord['marcHTML']"></div>
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
      wcOffset: 1,
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
      existingLCCN: null,
      existingRecordUrl: "",
      hasLccn: false,
      checkingLCCN: false,


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
    ...mapWritableState(useProfileStore, ['activeProfile', 'emptyComponents', 'activeProfilePosted', 'activeProfilePostedTimestamp', 'copyCatMode']),


    // // gives read access to this.count and this.double
    // ...mapState(usePreferenceStore, ['profilesLoaded']),

    startingPointsFiltered() {
      let points = []
      for (let k in this.startingPoints) {
        if (this.startingPoints[k].work && this.startingPoints[k].instance) {
          points.push(this.startingPoints[k])
        }
      }

      points.push({ "name": "HUB", "work": null, "instance": "lc:RT:bf2:HubBasic:Hub", "item": null },)

      return points
    }


  },

  watch: {},

  methods: {
    loadLccnFromRecord: function (record) {
      if (!record) { return false }
      let marc010 = this.getMarcFieldAsString(record, "010")
      if (!marc010) { return false }

      let idx = marc010.indexOf("$a")
      this.urlToLoad = marc010.slice(idx + 2).trim()
      this.checkLccn()
      return this.urlToLoad
    },

    setSelectedRecord: function (value) {
      this.selectedWcRecord = value

      // check if there's an LCCN in the record
      this.loadLccnFromRecord(value)
      this.checkLccn()
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
      if (!this.urlToLoad) { return true }
      if (this.checkingLCCN) { return true }

      return !recordSelected
    },

    checkLccn: async function () {
      console.info("checkLCCN")
      if (!this.urlToLoad) {
        this.existingRecordUrl = ""
        this.existingLCCN = false
        return false
      }

      this.checkingLCCN = true
      let resp = await utilsNetwork.checkLccn(this.urlToLoad)
      console.info("     >>>>> ", resp)
      this.checkingLCCN = false
      try {
        this.existingLCCN = resp.status != 404
        if (this.existingLCCN) {
          this.existingRecordUrl = resp.url
        } else {
          this.existingRecordUrl = ""
        }
      } catch {
        this.existingLCCN = null
        this.existingRecordUrl = ""
      }

    },

    encodingLevel: function (value) {
      if (this.oclcEncodingLevelsHigh.includes(value)) {
        return 'High'
      }
      return 'Low'
    },

    catLevelToolTip: function (value) {
      switch (value) {
        case "PccAdapt":
          return "042 contains 'pcc' & Language = English"
        case "CopyCat":
          return "Encoding Level is 'high', Not PCC record, Language = English"
        case "OrigRes":
          return "Low level record, Not PCC, or not English"
        case "OrigCop":
          return "Cataloging Agency and Transcribing Agency are 'DLC'"
        default:
          return "You shouldn't be seeing this. Let someone know the value is '" + value + "'"
      }
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
      if (record) {
        let marc010 = this.getMarcFieldAsString(record, "010")
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
      } else if (marc260 == "") {
        return true
      } else if (!aacr2 && marc260 == "") {
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
        this.wcOffset = this.wcLimit * (this.searchPage - 1)
      } else {
        this.wcOffset = 1
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
      parent.appendChild(subfield)
    },

    loadCopyCat: async function (profile) {
      let continueWithLoad = true
      if (this.existingLCCN) {
        continueWithLoad = confirm("There is a record with the LCCN already. If you continue, the Copy Cat record will be merged with it. Do you want to continue?")
      }
      if (!continueWithLoad) { return }

      let xml = this.selectedWcRecord.marcXML.replace(/\n/g, '').replace(/>\s*</g, '><')
      this.existingLccn = false

      xml = xml.replace("<record>", "<record xmlns='http://www.loc.gov/MARC21/slim'>")
      let continueWithLccn = true
      // if (!this.copyCatLccn){
      if (!this.urlToLoad) {
        alert("This needs an LCCN to continue.")
        return
      } else {
        if (this.urlToLoad.length != 10) {
          continueWithLccn = confirm("This LCCN is not the expected length. Do you want to continue with it?")
        }
      }

      if (!continueWithLccn) { return }

      let parser = new DOMParser()
      xml = parser.parseFromString(xml, "text/xml")

      // Create a dummy 999 to pass user values to processor
      let dummy999 = document.createElementNS("http://www.loc.gov/MARC21/slim", "datafield")
      dummy999.setAttribute("tag", "999")
      dummy999.setAttribute("ind1", " ")
      dummy999.setAttribute("ind2", " ")

      this.createSubField("a", this.urlToLoad, dummy999)
      this.createSubField("b", this.recordPriority, dummy999)
      this.createSubField("c", this.jackphyCheck, dummy999)
      this.createSubField("d", this.determineLevel(this.selectedWcRecord), dummy999)

      if (this.existingLCCN) {
        this.createSubField("e", "overlay bib", dummy999)
        if (this.existingRecordUrl != ""){
          let bibId = this.existingRecordUrl.split("/").at(-1).replace(".html", "")
          this.createSubField("f", bibId, dummy999)
        }
      }

      xml.documentElement.appendChild(dummy999)

      let strXmlBasic = (new XMLSerializer()).serializeToString(xml.documentElement)

      console.info("strXmlBasic: ", strXmlBasic)

      this.posting = true
      this.postResults = {}
      this.postResults = await utilsNetwork.addCopyCat(strXmlBasic)
      this.posting = false

      console.info("this.postResults: ", this.postResults)

      this.responseURL = this.postResults.postLocation

      if (!this.responseURL){
        alert("There was an issue sending the record.")
        console.error("Failed to send copy cat record: ", this.postResults)
        return
      }

      let recordId = this.responseURL.split("/").at(-1).replaceAll(/\.[^/.]+/g, '')

      console.info("recordId: ", recordId)

      // this.urlToLoad = "https://preprod-8230.id.loc.gov/resources/instances/"+ recordId +".convertedit-pkg.xml"           // production
      this.urlToLoad = "https://preprod-8287.id.loc.gov/resources/instances/" + recordId + ".cbd.xml"                     // dev

      // https://preprod-8299.id.loc.gov/resources/works/ocm45532466.html <the URL that works>
      // load url: https://preprod-8230.id.loc.gov/resources/instances/<id>.convertedit-pkg.xml <what Marva loads>
      // https://preprod-8230.id.loc.gov/resources/instances/12243040.editor-pkg.xml            <what BFDB loads>

      try {
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
        let uuid = 'e' + decimalTranslator.new()
        uuid = uuid.substring(0, 8)
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
  },
  created: async function () { }
}

</script>


<style scoped>
label {
  cursor: pointer;
}

.search-box{
  display: flex;
  flex-direction: row;
  border: 1px solid grey;
  padding: 1px;
  background-color: #fff;
}

.search-box:focus-within{
  outline: 2px solid v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')") ;
}

.url-to-load {
  font-size: 1.25em;
  width: 100%;
  border: none;
}

.url-to-load:focus{
  outline: none;
}

.search-button{
  display: block;
  height: 30px !important;
  width: 30px !important;
  padding: 0;
  border-radius: 50%;
  border: none;
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')") ;
}

.search-button:hover{
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

:deep() div.marc.field:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-marc-hover')");
}

:deep() span.marc.subfield:has(> .subfield-label):hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-marc-hover')");
  filter: saturate(3);
}
:deep() span.marc.subfield:hover > .subfield-label {
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

/* We need to set the widths used on floated items back to auto, and remove the bottom margin as when we have grid we have gaps. */
@supports (display: grid) {
  .copy-cat-wrapper>* {
    width: auto;
    margin: 0;
  }
}
</style>
