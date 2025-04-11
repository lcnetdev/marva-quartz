<template>

  <splitpanes class="default-theme" horizontal>

    <pane class="header" :size="returnPixleAsPercent(preferenceStore.returnValue('--n-edit-main-splitpane-nav-height',true))">
      <Nav/>
    </pane>

    <pane>
      <div v-if="!copyCatMode">
        <splitpanes>
          <pane class="load" v-if="displayAllRecords">
            <button @click="displayAllRecords=false;displayDashboard=true">Close</button>
            <div id="all-records-table">
              <DataTable  :loading="isLoadingAllRecords" :rows="allRecords" striped hoverable>
                <!-- { "Id": "e1078432", "RTs": [ "lc:RT:bf2:Monograph:Work" ], "Type": "Monograph", "Status": "unposted", "Urls": [ "http://id.loc.gov/resources/works/e1078432", "http://id.loc.gov/resources/instances/e1078432" ], "Time": "2024-07-10:17:11:53", "User": "asdf (asdf)" } -->
                <template #tbody="{row}">
                  <td>
                    <a href="#" @click.prevent="loadFromAllRecord(row.Id)">{{ row.Id }}</a>
                  </td>
                  <td v-text="(row.RTs) ? row.RTs.join(', ') : row.RTs"/>
                  <td v-text="row.Type"/>
                  <td v-text="row.Title"/>
                  <td v-text="row.Status"/>
                  <td>
                    <div v-for="u in row.Urls">
                      <a v-if="u.indexOf('/works/') >-1" :href="u" target="_blank">Work</a>
                      <a v-else-if="u.indexOf('/instances/') >-1" :href="u" target="_blank">Instance</a>
                      <a v-else :href="u" target="_blank">{{ u }}</a>
                    </div>
                  </td>
                  <td v-text="row.Time"/>
                  <td v-text="row.User"/>
                </template>
              </DataTable>
            </div>
          </pane>

          <pane class="load" v-if="displayDashboard" >
            <div class="load-columns">
              <div class="load-test-data-column">
                <h1>
                  <span style="font-size: 1.15em; vertical-align: bottom; margin-right: 5px;" class="material-icons">cloud_download</span>
                  <span>Load</span></h1>
                <form ref="urlToLoadForm" v-on:submit.prevent="loadUrl">
                  <input placeholder="URL to resource or identifier to search" class="url-to-load" type="text" @input="loadSearch" v-model="urlToLoad" ref="urlToLoad">
                  <p>Need to search title or author? Use <a href="https://preprod-8230.id.loc.gov/lds/index.xqy" target="_blank">BFDB</a>.</p>
                </form>
                <ol>
                    <li v-if="searchByLccnResults && searchByLccnResults.length === 0">No results...</li>
                    <template v-if="searchByLccnResults && typeof searchByLccnResults === 'string'">
                      <li>Searching...</li>
                    </template>
                    <template v-else>
                      <li v-for="(r,idx) in searchByLccnResults" :key="r.idURL">
                          <div style="display:flex">
                              <div style="flex:2;">{{++idx}}. <span style="font-weight:bold">{{r.label}}</span></div>
                              <div style="flex:1">
                                <a :href="r.bfdbURL" style="padding-right: 10px;" target="_blank">View on BFDB</a>
                                <span v-if="searchByLccnResults.length == 1" style="display:none;">
                                  <label :for="'lccnsearch'+idx">Select</label><input type="radio" v-model="lccnLoadSelected" :value="r" name="lccnToLoad" :id="'lccnsearch'+idx" :name="'lccnsearch'+idx" checked="true" />
                                </span>
                                <span v-else>
                                  <label :for="'lccnsearch'+idx" style="font-weight:bold;">Select</label><input type="radio" v-model="lccnLoadSelected" :value="r" name="lccnToLoad" :id="'lccnsearch'+idx" :name="'lccnsearch'+idx" />
                                </span>
                              </div>
                            <!-- <div style="flex:1"><a href="#" target="_blank" @click.prevent="instanceEditorLink = r.bfdbPackageURL; testInstance()">Retrieve</a></div> -->
                          </div>
                        </li>

                    </template>

                </ol>
                <div v-if="(!urlToLoadIsHttp && !lccnLoadSelected)" style="font-weight: bold; margin-bottom: 1em;">
                  First Enter the URL or identifier for a resource above, then select a profile.
                </div>

                <h3>Load with profile:</h3>
                <div class="load-buttons">
                  <button class="load-button" @click="loadUrl(s.instance)" :disabled="(urlToLoadIsHttp || lccnLoadSelected ) ? false : true"  v-for="s in startingPointsFiltered">{{s.name}}</button>
                </div>
                <hr>

                <h2>Test Data:</h2>
                <table id="test-data-table">
                    <tr class="test-data" v-for="t in testData">
                      <td><a :href="t.idUrl">{{t.label}}</a></td>
                      <td><button @click="loadTestData(t)">Load with {{ t.profile }} </button></td>
                    </tr>
                  </table>
                <!-- <details>
                  <summary>Test Data</summary>
                </details> -->
              </div>

              <div>
                <h1>
                  <span style="font-size: 1.25em; vertical-align: bottom; margin-right: 3px;"  class="material-icons">edit_note</span>
                  <span>Your Records</span></h1>
                  <a href="#" @click="loadAllRecords" style="color: inherit;">Show All Records</a>
                  <div>
                    <div class="saved-records-empty" v-if="continueRecords.length==0">
                      No saved records found.
                    </div>
                    <ul class="continue-record-list">
                      <li class="continue-record" v-for="record in continueRecords" >
                        <router-link :to="{ name: 'Edit', params: { recordId: record.eid}}">
                          <div><span class="continue-record-title">{{record.title}}</span><span v-if="record.contributor"> by {{record.contributor}}</span><span> ({{record.lccn}})</span></div>
                          <div class="continue-record-lastedit"><span v-if="record.status=='posted'">Posted</span><span v-if="record.status=='unposted'">last edited</span> <span>{{ returnTimeAgo(record.timestamp) }}</span></div>
                        </router-link>
                        <div class="material-icons" v-if="record.status=='posted'" title="Posted record">check_box</div>
                      </li>
                    </ul>
                  </div>
              </div>

              <div>
                <h1 style="margin-bottom: 10px;">
                  <span style="font-size: 1.25em; vertical-align: bottom; margin-right: 3px;"  class="material-icons">edit_document</span>
                  <span>Create Blank Record</span></h1>
                  <div style="padding:5px;">
                    Use these blank templates to test, but any record that you want to post to Voyager must originate in Voyager. Marva cannot currently assign Voyager bib numbers, so you need to create a stub record in Voyager and then load it into Marva.
                  </div>
                  <details>
                    <summary><span style="text-decoration: underline;">Click Here</span> to access blank record templates. Currently these are only for testing input, and cannot be used for posting or in production.</summary>
                    <div>
                      <div class="load-buttons">
                        <button class="load-button" @click="loadUrl(s.instance)" v-for="s in startingPointsFiltered">{{s.name}}</button>
                      </div>
                    </div>
                  </details>
              </div>
            </div>
          </pane>
        </splitpanes>
      </div>

      <div v-else>
        <CopyCat />
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

  import { DataTable } from "@jobinsjp/vue3-datatable"
  import "@jobinsjp/vue3-datatable/dist/style.css"
  import CopyCat from './CopyCat.vue'

  if (TimeAgo.getDefaultLocale() != 'en'){TimeAgo.addDefaultLocale(en)}
  const timeAgo = new TimeAgo('en-US')

  const decimalTranslator = short("0123456789");

  export default {
    components: { Splitpanes, Pane, Nav, DataTable, CopyCat},
    data() {
      return {

        urlToLoad:'',

        continueRecords: [],

        urlToLoadIsHttp: false,

        searchByLccnResults: null,
        lccnToSearchTimeout: null,

        lccnLoadSelected:false,


        displayDashboard:true,
        displayAllRecords: false,
        isLoadingAllRecords:false,

        allRecords: [],

        wcIndex: "",
        wcType: "book",
        wcQuery: "",
        wcOffset: 1,
        wcLimit: 10,
        queryingWc: false,
        wcResults: [],
        // https://help.oclc.org/Librarian_Toolbox/Searching_WorldCat_Indexes/Bibliographic_records/Bibliographic_record_indexes/Bibliographic_record_index_lists/Alphabetical_list_of_available_WorldCat.org_bibliographic_record_indexes
        indexSelectOptions: [
          { label: 'Controll Number', value: '' },
          { label: 'ISBN', value: 'bn' },
          { label: 'ISSN', value: 'in' },
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
        currentPage: 1,
        posting: false,
        copyCatLccn: null,
        recordPriority: 3,
        jackphyCheck: false,
        ibcCheck: false,
        responseURL: null,
        existingLCCN: null,
        existingRecordUrl: "",
        hasLccn: false,


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useProfileStore),
      ...mapState(usePreferenceStore, ['styleDefault','panelDisplay']),
      ...mapState(useConfigStore, ['testData']),
      ...mapState(useProfileStore, ['startingPoints','profiles', 'copyCatMode']),
      ...mapWritableState(useProfileStore, ['activeProfile', 'emptyComponents','activeProfilePosted','activeProfilePostedTimestamp', 'copyCatMode']),


      // // gives read access to this.count and this.double
      // ...mapState(usePreferenceStore, ['profilesLoaded']),

      startingPointsFiltered(){
        let points = []
        for (let k in this.startingPoints){
          if (this.startingPoints[k].work && this.startingPoints[k].instance){
            points.push(this.startingPoints[k])
          }
        }

        points.push( { "name": "HUB", "work": null, "instance": "lc:RT:bf2:HubBasic:Hub", "item": null },)

        console.log(points)
        return points
      }


    },

    methods: {
      disableCopyCatButtons: function(){
        let recordSelected = (this.selectedWcRecord) ? true : false

        if (this.existingLCCN == null){ return true }
        if (this.checkRecordHasLccn(selectedWcRecord)) { return false }

        return !recordSelected
      },

      checkLccn: async function(){
        let resp = await utilsNetwork.checkLccn(this.urlToLoad)
        try {
          this.existingLCCN = resp.status != 404
          if (this.existingLCCN){
            this.existingRecordUrl = resp.url
          } else {
            this.existingRecordUrl = ""
          }
        } catch {
          this.existingLCCN = null
          this.existingRecordUrl = ""
        }
      },

      encodingLevel: function (value){
        if (this.oclcEncodingLevelsHigh.includes(value)){
          return 'High'
        }
        return 'Low'
      },

      catLevelToolTip: function(value){
        switch (value){
          case "PccAdapt":
            return "042 contains 'pcc' & Language = English"
          case "CopyCat":
            return "Encoding Level is 'high', Not PCC record, Language = English"
          case "OrigRes":
            return "Low level record, Not PCC, or not English"
          case "OrigCop":
            return "Cataloging Agency and Transcribing Agency are 'DLC'"
          default:
            return "You shouldn't be seeing this. Let someone know the value is '" + value  +"'"
        }
      },

      getMarcFieldAsString: function(record, target){
        try{
          let fields = record.marcRaw.fields.filter((f) => f[0] == target)

          for (let field of fields){
            let tag = field[0]
            let indicators = field[1]
            let subfields = field.slice(2).map((item, idx) => {
              if (idx%2 == 0 ){
                return "$" + item
              } else {
                return " " + item
              }
            }).join("")

            return tag + indicators + subfields
          }
        } catch(err) {
          console.error("err: ", err)
          return false
        }
      },

      isSerial: function(record){
        let leader = record.marcRaw.leader
        let bibLevel = leader.at(7)

        return ["b", "s"].includes(bibLevel)
      },

      checkRecordHasLccn: function(record){
        if (record){
          console.info(">> ", record.marcRaw.fields)
          let marc010 = this.getMarcFieldAsString(record, "010")
          if (!marc010) {return false}

          return marc010.includes('$a')
        }
      },

      isRdaRecord: function(record){
        const marc040   = record.marcRaw.fields.filter((f) => f[0] == '040').join()
        const rdaRecord = marc040.includes('e,rda')
        const leader = record.marcRaw.leader
        const aacr2 = leader.at(18) == 'a'
        const marc260 = record.marcRaw.fields.filter((f) => f[0] == '260').join()

        if (rdaRecord){
          return true
        } else if (marc260 == ""){
          return true
        } else if (!aacr2 && marc260 == ""){
          return true
        }
        return false
      },

      determineLevel: function(record){
        /**
         * PCCAdapt -- indicates that the record is a fuller-level record, and the language of cataloging is English. Process the record as full-level RDA.
         * Copycat  -- indicates that the record is a fuller-level record, and the language of cataloging is English. Process the record as RDA, with 042 = lccopycat. Exceptionally: process according to “encoding level 7 lccopycat” procedures (DCM B13, Appendix 7).
         * OrigRes  -- indicates that the record is a lower-level record, and/or that the language of cataloging is other than English.
         * OrigCop  -- indicates that an existing LC RDA record for another edition can be used to create a new full-level RDA record.
         */

        this.isRdaRecord(record)

        const catLang   = record.catalogingInfo.catalogingLanguage
        const isEng = catLang == "eng"
        const catEncodeLevel  = record.catalogingInfo.levelOfCataloging
        const catAgency = record.catalogingInfo.catalogingAgency
        const catTransAgency = record.catalogingInfo.transcribingAgency
        const marc042   = record.marcRaw.fields.filter((f) => f[0] == '042').join()
        const pccRecord = marc042.includes('pcc')

        let catLevel = false
        if (pccRecord && isEng) {
          catLevel = 'PccAdapt'
        } else if (this.oclcEncodingLevelsHigh.includes(catEncodeLevel) && !pccRecord && isEng){
          catLevel = 'CopyCat'
        } else if (catAgency == 'DLC' && catTransAgency == 'DLC'){
          catLevel = 'OrigCop'
        } else {
          catLevel = 'OrigRes'
        }

        return catLevel //catLang + " " + catEncodeLevel + " " + catAgency + " " + pccRecord

      },

      firstPage: function(){
        // if not the first page allow
        if (this.currentPage !== 1){
          this.currentPage = 1
          this.worldCatSearch()
        }
      },
      prevPage: function(){
        // if not the first page allow
        if (this.currentPage !== 1){
          this.currentPage--
          this.worldCatSearch()
        }
      },

      nextPage: function(){
        let max = Math.ceil(this.wcResults.results.numberOfRecords / this.wcLimit)

        if (max > this.currentPage){
          this.currentPage++
          this.worldCatSearch()
        }
      },
      lastPage: function(){
        let max = Math.ceil(this.wcResults.results.numberOfRecords / this.wcLimit)

        if (max > this.currentPage){
          this.currentPage = max
          this.worldCatSearch()
        }
      },

      worldCatSearch: async function(marc=false, pageReset=false){
        if (pageReset){
          this.currentPage = 1
        }

        this.selectedWcRecord = false

        this.queryingWc = true
        if (this.currentPage != 1){
          this.wcOffset = this.wcLimit * (this.currentPage - 1)
        } else {
          this.wcOffset = 1
        }

        if (this.wcIndex == ""){
          console.info("need to determine what this is: ", this.wcQuery)
          if (this.wcQuery.trim().startsWith("o")){
            console.info("oclc search")
            this.wcType = 'oclc'
          } else {
            this.wcIndex = 'bn'
          }
        } else {
          this.wcType = 'book'
        }

        const cleanQuery = this.wcQuery.trim()
        try{
          this.wcResults = await utilsNetwork.worldCatSearch(cleanQuery, this.wcIndex, this.wcType, this.wcOffset, this.wcLimit, marc)
          if (!Object.keys(this.wcResults.results).includes("numberOfRecords")){
            this.wcResults.results["numberOfRecords"] = 1
            this.wcResults.results["briefRecords"] = [this.wcResults.results]
          }
        } catch(err) {
          this.wcResults = {"error": err}
        }

        console.info("this.wcResults: ", this.wcResults)

        this.queryingWc = false
      },

      createSubField: function(code, value, parent){
        let subfield = document.createElementNS("http://www.loc.gov/MARC21/slim", "subfield")
        subfield.setAttribute("code", code)
        subfield.innerHTML = value
        parent.appendChild(subfield)
      },

      loadCopyCat: async function(profile){
        let continueWithLoad = true
        if (this.existingLCCN){
          continueWithLoad = confirm("There is a record with the LCCN already. If you continue, the Copy Cat record will be merged with it. Do you want to continue?")
        }
        if (!continueWithLoad) { return }

        let xml =  this.selectedWcRecord.marcXML.replace(/\n/g, '').replace(/>\s*</g, '><')
        this.existingLccn = false

        xml = xml.replace("<record>", "<record xmlns='http://www.loc.gov/MARC21/slim'>")

        // if (!this.copyCatLccn){
        if (!this.urlToLoad){
          alert("This needs an LCCN to continue.")
          return
        } else {
          if (this.urlToLoad.length != 10){
            alert("It looks like this LCCN is not correct. Try entering it again.")
            return
          }
        }

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

        if (this.existingLCCN){
          this.createSubField("e", "overlay bib", dummy999)
        }

        xml.documentElement.appendChild(dummy999)

        let strXmlBasic = (new XMLSerializer()).serializeToString(xml.documentElement)

        console.info("strXmlBasic: ", strXmlBasic)

        this.posting = true
        this.postResults = {}
        // this.postResults = await utilsNetwork.addCopyCat(strXmlBasic)
        this.posting = false

        // this.responseURL = this.postResults.postLocation
        // console.info(">>>>>>>", this.responseURL)
        // let recordId = this.responseURL.split("/").at(-1).replaceAll(/\.[^/.]+/g, '')
        // this.urlToLoad = "https://preprod-8230.id.loc.gov/resources/instances/"+ recordId +".convertedit-pkg.xml"           // production
        // this.urlToLoad = "https://preprod-8299.id.loc.gov/resources/instances/" + recordId + ".cbd.xml"                     // dev

        // https://preprod-8299.id.loc.gov/resources/works/ocm45532466.html <the URL that works>
        // load url: https://preprod-8230.id.loc.gov/resources/instances/<id>.convertedit-pkg.xml <what Marva loads>
        // https://preprod-8230.id.loc.gov/resources/instances/12243040.editor-pkg.xml            <what BFDB loads>


          // this.loadUrl(profile)
      },

      loadFromAllRecord: function(eId){


        this.profileStore.prepareForNewRecord()

        this.$router.push({ name: 'Edit', params: { recordId: eId } })


      },





      allRecordsRowClick: function(row){



      },

      loadAllRecords: async function(event){
        event.preventDefault()

        this.displayDashboard = false
        this.displayAllRecords = true
        this.isLoadingAllRecords=true

        let allRecordsRaw = await utilsNetwork.searchSavedRecords()

        this.allRecords = []
        for (let r of allRecordsRaw){

          let obj = {
            'Id': r.eid,

            'RTs': r.rstused,
            'Type': r.typeid,
            'Title': r.title,
            'Status': r.status,
            'Urls': r.externalid,
            'Time': r.time,
            'User': r.user,



          }
          this.allRecords.push(obj)


        }
        // let lccnLookup = {}


        this.isLoadingAllRecords=false
      },

      returnTimeAgo: function(timestamp){
        return timeAgo.format(timestamp*1000)
      },


      returnPixleAsPercent: function(pixles){
        return pixles/window.innerHeight*100
      },

      loadTestData: function(meta){


        let href = window.location.href.split("/")
        this.urlToLoad = `/${href[3]}/${href[4]}/test_files/${meta.lccn}.xml`
        this.urlToLoadIsHttp=true
        this.loadUrl(meta.profileId)
      },

      loadYourRecord: async function(){



      },

      loadSearch: function(){
        if (!this.urlToLoad){
          this.searchByLccnResults = []
        }

        this.lccnLoadSelected = null

        if (this.urlToLoad.startsWith("http://") || this.urlToLoad.startsWith("https://")){
          this.urlToLoadIsHttp = true
          return false
        }else{
          this.urlToLoadIsHttp = false

        }
        // lccns are not short
        if (this.urlToLoad.length < 8){ return false}

        window.clearTimeout(this.lccnToSearchTimeout)
          this.searchByLccnResults = 'Searching...'
          this.lccnToSearchTimeout = window.setTimeout(async ()=>{

          this.searchByLccnResults = await utilsNetwork.searchInstanceByLCCN(this.urlToLoad)

          // If there's only one result, load it so the user doesn't have to do any clicking
          if (this.searchByLccnResults.length == 1) {
            this.lccnLoadSelected = this.searchByLccnResults[0]
          }

        },500)


      },

      loadUrl: async function(useInstanceProfile,multiTestFlag){
        if (this.lccnLoadSelected){

          this.urlToLoad = this.lccnLoadSelected.bfdbPackageURL

        }

        if (this.urlToLoad.trim() !== ''){

          let xml = await utilsNetwork.fetchBfdbXML(this.urlToLoad)
          if (!xml){
            alert("There was an error retrieving that URL. Are you sure it is correct: " + this.urlToLoad)
            return false
          }
          // if (xml.indexOf('<rdf:RDF'))


          // check for XML problems here ?

          utilsParse.parseXml(xml)



        }

        // find the right profile to use from the instance profile name used
        let useProfile = null
        console.log("this.profiles",this.profiles)
        console.log("useInstanceProfile",useInstanceProfile)
        for (let key in this.profiles){
          if (this.profiles[key].rtOrder.indexOf(useInstanceProfile)>-1){
            useProfile = JSON.parse(JSON.stringify(this.profiles[key]))
          }
        }

        this.activeProfilePosted = false
        this.activeProfilePostedTimestamp = false

        // check if the input field is empty
        if (this.urlToLoad == "" && useProfile===null){
          alert("Please enter the URL or Identifier of the record you want to load.")
          return false
        }

        if (useProfile===null){
          alert('No profile selected. Select a profile under "Load with profile."')
          return false
        }

        if (this.urlToLoad.trim() !== ''){



          // we might need to load in a item
          if (utilsParse.hasItem>0){
            // loop the number of ITEMS there are in the XML
            Array.from(Array(utilsParse.hasItem)).map((_,i) => {
              let useItemRtLabel
              // look for the RT for this item
              useItemRtLabel = useInstanceProfile.replace(':Instance',':Item')

              let foundCorrectItemProfile = false
              for (let pkey in this.profiles){
                for (let rtkey in this.profiles[pkey].rt){
                  if (rtkey == useItemRtLabel){
                    let useRtLabel =  useItemRtLabel + '-' + (i+1)
                    let useItem = JSON.parse(JSON.stringify(this.profiles[pkey].rt[rtkey]))

                    // make the guids for all the properties unique
                    for (let ptk in useItem.pt){
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


              if (!foundCorrectItemProfile){
                console.warn('error: foundCorrectItemProfile not set ---------')
                console.warn(this.rtLookup[useItemRtLabel])
              }
            });
          }
        }

        if (!useProfile.log){
          useProfile.log = []
        }

        // setup the log and set the procinfo so the post process knows what to do with this record
        useProfile.log.push({action:'loadInstance',from:this.urlToLoad})
        useProfile.procInfo= "update instance"

        // also give it an ID for storage
        if (!useProfile.eId){
          let uuid = 'e' + decimalTranslator.new()
          uuid = uuid.substring(0,8)
          useProfile.eId= uuid
          useProfile.neweId = true
        }


        if (!useProfile.user){
          useProfile.user = this.preferenceStore.returnUserNameForSaving
        }

        if (!useProfile.status){
          useProfile.status = 'unposted'
        }




        if (this.urlToLoad.trim() !== ''){
          let profileDataMerge  = await utilsParse.transformRts(useProfile)
          this.activeProfile = profileDataMerge
        }else{
          // if there is not url they are making it from scratch, so we need to link the instances and work together
          useProfile = utilsParse.linkInstancesWorks(useProfile)

          this.activeProfile = useProfile

          // prime this for ad hoc mode
          for (let rt in this.activeProfile.rt){
            this.emptyComponents[rt] = []
            for (let element in this.activeProfile.rt[rt].pt){
              // const e = this.activeProfile.rt[rt].pt[element]
              // if (e.mandatory != 'true'){
              //   this.emptyComponents[rt].push(element)
              // }
              this.profileStore.addToAdHocMode(rt, element)
            }
          }
        }

        if (multiTestFlag){
          this.$router.push(`/multiedit/`)
          return true
        }

        this.$router.push(`/edit/${useProfile.eId}`)



      },


     async refreshSavedRecords(){



        let records = await utilsNetwork.searchSavedRecords(this.preferenceStore.returnUserNameForSaving)

          let lccnLookup = {}

          // in this view we want to remove any records that are repeats, so only show the latest LCCN being edited
          this.continueRecords = []
          for (let r of records){
            if (r.lccn && r.lccn != '' && r.lccn !== null){
              if (!lccnLookup[r.lccn]){
                this.continueRecords.push(r)
                lccnLookup[r.lccn]=true
              }
            }else{
              // no LCCN just add it
              this.continueRecords.push(r)
            }

          }


      },









    },

    mounted: async function(){
      this.refreshSavedRecords()

	  //reset the title
	  document.title = `Marva`;

    },



    created: async function(){

      this.refreshSavedRecords()

      // this is checking to see if the route is available to load the passed URL to it
      let intervalLoadUrl = window.setInterval(()=>{
          if (this.$route && this.$route.query && this.$route.query.url){

            this.urlToLoad = this.$route.query.url
            this.urlToLoadIsHttp=true
            window.clearInterval(intervalLoadUrl)

          }

        },500)

        let intervalLoadProfile = window.setInterval(()=>{
          if (this.$route && this.$route.query && this.$route.query.profile && this.startingPointsFiltered && this.startingPointsFiltered.length>0){
            console.log("Weerrr looookiinnn at the profile!", this.$route.query.profile)
            let possibleInstanceProfiles = this.startingPointsFiltered.map((v)=>v.instance)
            if (possibleInstanceProfiles.indexOf(this.$route.query.profile) >-1){
              this.loadUrl(this.$route.query.profile)
            }
            window.clearInterval(intervalLoadProfile)
            // loadUrl
          }

        },600)


    }
  }

</script>

<style>
  .dt-bg-gray-50{
    background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color-accent')")  !important;
    color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')")  !important;

  }
  .dt-bg-white{
    background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color')")  !important;
    color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')")  !important;



  }
</style>

<style scoped>


#test-data-table{
  width:100%;



}

#all-records-table{

  height: 90vh;
  overflow-y: auto;

}


.test-data:nth-child(odd) {

  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color')")  !important;
  color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')")  !important;

  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color-accent')")  !important;

}

.test-data a{
  color:inherit!important;
  text-decoration: none;

}
.test-data a:hover{
  text-decoration: underline;
}
.test-data button{
  width: 100%;
}
.saved-records-empty{
  margin-top: 2em;
  margin-left: 1em;
  font-style: italic;
}

label{
  cursor: pointer;
}

  ol{
    list-style: none;
    padding-left: 0;
    margin-bottom: 2em;
  }

  .continue-record .material-icons{
      position: absolute;
      right: 0;
      top: 0;
      color: limegreen;
    }

  .continue-record-list{
    margin-top: 1em;
    padding-left: 0.1em;
    list-style: none;
    height: 85vh;
    overflow-y: auto;

  }

  .continue-record a{
    text-decoration: none;
    color: inherit !important;
  }

  .continue-record:hover{
    box-shadow: 0px 0px 3px -1px rgba(0,0,0,0.46);
    background-color: whitesmoke;

  }

  .continue-record-list li:nth-of-type(1n+100) {
    display: none;
  }

  .continue-record-title{
    font-style: italic;
  }
  .continue-record{
    border: solid 1px lightgray;
    padding: 4px;
    position: relative;

  }
  .continue-record-lastedit{
    color: grey;
  }
  .load-columns{
    display: flex;
  }

  .load-columns > div{
    flex: 1;
  }
  .url-to-load{
    font-size: 1.25em;
    margin-bottom: 1em;
    margin-top: 1em;


    width: 80%;
  }
  .load-buttons{
    text-align: justify;
  }
  .load-button{
    font-size: 1.25em;
    margin: 0.25em;
    background-color: white;
    border: solid 1px var(--c-black-mute);
    border-radius: 2px;
    cursor: pointer;
  }
  .load-button:hover{
    border: solid 1px var(--c-black);
    background-color: var(--c-white-soft);
  }

  .header{
    background-color: white !important;
  }
  body{
    background-color: white;
  }

  .load{
    background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color')")  !important;
    color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')")  !important;

    padding: 1em;
  }
  hr{
    margin-bottom: 2em;
    margin-top: 2em;
  }
  summary{
    cursor: pointer;
  }
  .load-test-data-column{
    height: 95vh;
    overflow-y: auto;
    padding-bottom: 5em;
  }
  .header{
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-background-color')") !important;

  }

/****** Copy Cat ******/
*, *:before, *:after {
  box-sizing: border-box;
}

body {
  margin: 40px;
  font-family: 'Open Sans', 'sans-serif';
  background-color: #fff;
  color: #444;
}

h1, p {
  margin: 0 0 1em 0;
}

/* no grid support? */
.copy-cat-search {
  float: left;
  width: 20%;
}
.copy-cat-search{
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

.copy-cat-wrapper > * {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-components')");
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-font-color')");
  border-radius: 5px;
  padding: 20px;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-copy-cat-font-size')");
  /* needed for the floated layout*/
  margin-bottom: 10px;
}

/* , .copy-cat-marc  */
.copy-cat-header{
  font-size: 30px;
  grid-column: 1 / -1;
  /* needed for the floated layout */
  clear: both;
}

.marc-divider{
  margin: 5px;
}

/** MARC preview formatting */
:deep() .marc.record{
  font-family: monospace;
  height: 90%;
}

:deep() .marc.indicators {
  white-space: pre;
}


:deep() .marc.subfield.subfield-0 .subfield-value,
:deep() .marc.subfield.subfield-1 .subfield-value{
  width: 4.5em;
  display: inline-block;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.5);
  vertical-align: bottom;
}

:deep() div.marc.field{
  text-indent: 4em hanging;
}

:deep() span.marc.subfield:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-marc-hover')");
}

:deep() span.marc.subfield:hover > .subfield-label{
  font-weight: bold;
  font-style: italic;
}

.selected {
  background-color: antiquewhite !important;
  color: black;
}

/* Bootstrap card */
.card {
  position: relative;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-color:  v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color')");
  color: black;
  background-clip: border-box;
  border: 1px solid rgba(0,0,0,.125);
  border-radius: .25rem;

  margin-bottom: 5px;
}

.card:hover {
  cursor: pointer;
  background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
}

.card-body {
  -webkit-box-flex: 1;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  padding: 1.25rem;
}

.card-title {
  margin-bottom: .75rem;
  font-size: 1.25rem;
}

.card-subtitle {
  color: #6c757d !important;
  margin-bottom: .5rem !important;
  margin-top: -.375rem;
}

.card-text.border-bottom {
  border-bottom: solid gray;
}

.card-label {
  font-weight: bold;
}

.badge {
  display: inline-block;
  padding: .25em .4em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: .25rem;
  margin-right: 5px;
}

.badge-primary {
  color: #fff;
  background-color: #007bff;
}

.badge-secondary {
  color: white;
  background-color: #6c757d;;
}

.badge:hover {
  cursor: help;
  background-color: black;
  color: white;
}

.badge-success {
  color: #fff;
  background-color: #28a745;
}

.badge-warning {
  color: #212529;
  background-color: #ffc107;
}

.badge-danger {
  color: #fff;
  background-color: #dc3545;
}

.badge-info {
  color: #fff;
  background-color: #17a2b8;
}

.badge.badge-warning.no-hover:hover {
  cursor: unset;
  background-color: #ffc107;
  color: #212529;
}

.badge.badge-info.no-hover:hover {
  cursor: unset;
  background-color: #17a2b8;
  color: #fff;
}

.existing-lccn-note {
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-font-color')");
}

/* We need to set the widths used on floated items back to auto, and remove the bottom margin as when we have grid we have gaps. */
@supports (display: grid) {
  .copy-cat-wrapper > * {
    width: auto;
    margin: 0;
  }
}


</style>


