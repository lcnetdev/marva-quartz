<template>

  <splitpanes class="default-theme" horizontal>

    <pane class="header"
      :size="returnPixleAsPercent(preferenceStore.returnValue('--n-edit-main-splitpane-nav-height', true))">
      <Nav />
    </pane>

    <pane>


      <div v-if="!copyCatMode">
        <splitpanes>
          <pane class="load" v-if="displayAllRecords">
            <button style="float: right; z-index: 1000;"
              @click="displayAllRecords = false; displayDashboard = true">Close</button>
            <div v-if="dashBoard && dashBoard.totalDays">
              <h1>
                <span style="font-size: 1.25em; vertical-align: bottom; margin-right: 3px;"
                  class="material-icons">edit_note</span>
                <span>Dashboard</span>
              </h1>
              <div style="display:flex; padding: 1em;">
                <div style="flex:2;">
                  <h2>Last 24 Hours</h2>
                  <p>Unique Users: {{ Object.keys(dashBoard.byTimePeriod.last24Hours.uniqueUsers).length }}</p>
                  <p>Worked Records: {{ dashBoard.byTimePeriod.last24Hours.workedRecords }}</p>
                  <p>Posted Records: {{ dashBoard.byTimePeriod.last24Hours.postedRecords }}</p>
                </div>
                <div style="flex:2;">
                  <h2>Last 7 Days</h2>
                  <p>Unique Users: {{ Object.keys(dashBoard.byTimePeriod.last7Days.uniqueUsers).length }}</p>
                  <p>Worked Records: {{ dashBoard.byTimePeriod.last7Days.workedRecords }}</p>
                  <p>Posted Records: {{ dashBoard.byTimePeriod.last7Days.postedRecords }}</p>
                </div>
                <div style="flex:2;">
                  <h2>Last {{ dashBoard.totalDays }} Days</h2>
                  <p>Unique Users: {{ Object.keys(dashBoard.byTimePeriod.all.uniqueUsers).length }}</p>
                  <p>Worked Records: {{ dashBoard.byTimePeriod.all.workedRecords }}</p>
                  <p>Posted Records: {{ dashBoard.byTimePeriod.all.postedRecords }}</p>
                </div>
              </div>
            </div>

            <div id="all-records-table">
              <div style="text-align: right;" v-if="dataTableRecords.length == dataTableInitalLimit">
                <button @click="dataTableRecords = allRecords">Only showing the latest {{ dataTableInitalLimit }}
                  records.
                  Show all {{ allRecords.length }}?</button>
              </div>
              <DataTable :loading="isLoadingAllRecords" :rows="dataTableRecords" striped hoverable>

                <!-- { "Id": "e1078432", "RTs": [ "lc:RT:bf2:Monograph:Work" ], "Type": "Monograph", "Status": "unposted", "Urls": [ "http://id.loc.gov/resources/works/e1078432", "http://id.loc.gov/resources/instances/e1078432" ], "Time": "2024-07-10:17:11:53", "User": "asdf (asdf)" } -->

                <template #tbody="{ row }">

                  <td>
                    <a :href="'/bfe2/quartz/edit/' + row.Id" @click.prevent="loadFromAllRecord(row.Id)">{{ row.Id }}</a>
                  </td>

                  <td v-text="(row.RTs) ? row.RTs.join(', ') : row.RTs" />
                  <td v-text="row.Type" />
                  <td v-text="row.Title" />
                  <td v-text="row.Status" />
                  <td>
                    <div v-for="u in row.Urls">
                      <a v-if="u.indexOf('/works/') > -1" :href="u" target="_blank">Work</a>
                      <a v-else-if="u.indexOf('/instances/') > -1" :href="u" target="_blank">Instance</a>
                      <a v-else :href="u" target="_blank">{{ u }}</a>

                    </div>

                  </td>
                  <td v-text="row.Time" />
                  <td v-text="row.User" />

                </template>

              </DataTable>

            </div>



          </pane>

          <pane class="load" v-if="displayDashboard">



            <div class="load-columns">

              <div class="load-test-data-column">
                <h1>
                  <span style="font-size: 1.15em; vertical-align: bottom; margin-right: 5px;"
                    class="material-icons">cloud_download</span>
                  <span>Load</span>
                </h1>

                <form ref="urlToLoadForm" v-on:submit.prevent="loadUrl">
                  <input placeholder="URL to resource or identifier to search" class="url-to-load" type="text"
                    @input="loadSearch" v-model="urlToLoad" ref="urlToLoad">

                  <div v-if="loadingRecord" class="loading-record">L<span class="infinite-spin">O</span>ADING REC<span
                      class="infinite-spin">O</span>RD...</div>

                  <p>Need to search title or author? Use <a href="https://preprod-8230.id.loc.gov/lds/index.xqy"
                      target="_blank">BFDB</a>.</p>
                </form>

                <ol>

                  <li v-if="searchByLccnResults && searchByLccnResults.length === 0">
                    <div>No results...</div>

                    <div><button @click="openLCAPSyncURL()">Click to Request LCAP Sync for this LCCN</button></div>
                    <div>and then</div>
                    <div><button @click="loadSearch()">Click to Run Search Again</button></div>
                  </li>

                  <template v-if="searchByLccnResults && typeof searchByLccnResults === 'string'">

                    <li>Searching...</li>

                  </template>
                  <template v-else>

                    <table>
                        <thead>
                          <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(r, idx) in searchByLccnResults" :key="r.idURL">
                            <td  v-if="searchByLccnResults.length > 1">
                              <input type="radio"
                                v-model="lccnLoadSelected" :value="r" name="lccnToLoad" :id="'lccnsearch' + idx"
                                :name="'lccnsearch' + idx" checked="true" />
                            </td>

                            <td>
                              <label  v-if="searchByLccnResults.length > 1" style="cursor: pointer;" :for="'lccnsearch' + idx">{{ r.label }}</label>
                              <span v-else>{{ r.label }}</span>
                            </td>
                            <td><a :href="r.bfdbURL" style="padding-right: 10px;" target="_blank">BFDB</a></td>
                            <td> </td>
                          </tr>
                        </tbody>
                      </table>


<!-- 
                    <li v-for="(r, idx) in searchByLccnResults" :key="r.idURL">




                      <div style="display:flex">

                        <div style="flex:2;">{{+ + idx }}. <span style="font-weight:bold">{{ r.label }}</span></div>
                        <div style="flex:1">
                          <a :href="r.bfdbURL" style="padding-right: 10px;" target="_blank">View on BFDB</a>
                          <span v-if="searchByLccnResults.length == 1" style="display:none;">
                            <label :for="'lccnsearch' + idx">Select</label><input type="radio"
                              v-model="lccnLoadSelected" :value="r" name="lccnToLoad" :id="'lccnsearch' + idx"
                              :name="'lccnsearch' + idx" checked="true" />
                          </span>
                          <span v-else>
                            <label :for="'lccnsearch' + idx" style="font-weight:bold;">Select</label><input type="radio"
                              v-model="lccnLoadSelected" :value="r" name="lccnToLoad" :id="'lccnsearch' + idx"
                              :name="'lccnsearch' + idx" />
                          </span>
                        </div>

                        

                      </div>
                    </li> -->





                  </template>


                </ol>
                <div v-if="(!urlToLoadIsHttp && !lccnLoadSelected)" style="font-weight: bold; margin-bottom: 1em;">
                  First Enter the URL or identifier for a resource above, then select a profile.
                </div>

                <template v-if="showLoadTypeSelection()">
                  <h3>Load Type:</h3>
                  <div id="container">
                    <input
                      type="checkbox"
                      id="search-type"
                      class="toggle"
                      name="search-type"
                      value="keyword"
                      @click="changeLoadType($event)"
                      ref="toggle"
                      :checked="this.preferenceStore.returnValue('--b-general-default-load-tupe')">
                    <label for="search-type" class="toggle-container">
                      <div>Reconvert from MARC</div>
                      <div>Continue Editing BF</div>
                    </label>
                  </div>
                  <br>
                </template>

                <h3>Load with profile:</h3>
                <div class="load-buttons">
                  <button class="load-button" @click="loadUrl(s.instance)"
                    :disabled="(urlToLoadIsHttp || lccnLoadSelected) ? false : true"
                    v-for="s in startingPointsFiltered">{{ s.name
                    }}</button>
                </div>

                <div class="default-profile-container">
                  <span>Default profile to use on [Enter] key</span>
                  <select v-model="defaultProfile"
                    @change="preferenceStore.setValue('--s-general-default-profile', defaultProfile)">
                    <option v-for="s in startingPointsFiltered" :value="s.instance" :key="s.instance">{{ s.name }}
                    </option>
                  </select>
                </div>

                <hr>

                <h2>Test Data:</h2>
                <table id="test-data-table">
                  <tr class="test-data" v-for="t in testData">
                    <td><a :href="t.idUrl">{{ t.label }}</a></td>
                    <td><button @click="loadTestData(t)">Load with {{ t.profile }} </button></td>
                  </tr>
                </table>
                <!-- <details>
                  <summary>Test Data</summary>
                </details> -->
              </div>

              <div>
                <h1>
                  <span style="font-size: 1.25em; vertical-align: bottom; margin-right: 3px;"
                    class="material-icons">edit_note</span>
                  <span>Your Records</span>
                </h1>
                <a href="#" @click="loadAllRecords" style="color: inherit;">Show All Records</a>
                <div>
                  <div class="saved-records-empty" v-if="continueRecords.length == 0">
                    No saved records found.
                  </div>
                  <ul class="continue-record-list">
                    <li class="continue-record" v-for="record in continueRecords">
                      <router-link :to="{ name: 'Edit', params: { recordId: record.eid } }">
                        <div><span class="continue-record-title">{{ record.title }}</span><span
                            v-if="record.contributor">
                            by
                            {{ record.contributor }}</span><span> ({{ record.lccn }})</span></div>
                        <div class="continue-record-lastedit"><span v-if="record.status == 'published'">Posted</span><span
                            v-if="record.status == 'unposted'">last edited</span> <span>{{
                              returnTimeAgo(record.timestamp)
                            }}</span>
                        </div>
                      </router-link>
                      <div class="material-icons" v-if="record.status == 'published'" title="Posted record">check_box
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 style="margin-bottom: 10px;">
                  <span style="font-size: 1.25em; vertical-align: bottom; margin-right: 3px;"
                    class="material-icons">edit_document</span>
                  <span>Create Original BIBFRAME (origbf) Descriptions</span>
                </h2>
                <div style="padding:5px;">
                  Use these templates for original BIBFRAME descriptions in Marva and then sent to Folio as Modern MARC records.
                </div>
                <div @click="hideOptions = !hideOptions">
                  <summary><span style="text-decoration: underline;">Click Here</span> to access blank record
                    templates.</summary>
                  <div :class="{ 'hide-options': hideOptions }">
                    <div class="load-buttons">
                      <button class="load-button" @click="urlToLoad = 'new'; loadUrl(s.instance)"
                        v-for="s in startingPointsFiltered">{{
                          s.name
                        }}</button>
                    </div>
                  </div>
                </div>
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
import CopyCat from './CopyCat.vue'

import { DataTable } from "@jobinsjp/vue3-datatable"
import "@jobinsjp/vue3-datatable/dist/style.css"



if (TimeAgo.getDefaultLocale() != 'en') { TimeAgo.addDefaultLocale(en) }
const timeAgo = new TimeAgo('en-US')

const decimalTranslator = short("0123456789");



export default {
  components: { Splitpanes, Pane, Nav, DataTable, CopyCat },
  data() {
    return {

      urlToLoad: '',
      urlToLoadTimer: null,

      continueRecords: [],

      urlToLoadIsHttp: false,

      searchByLccnResults: null,
      lccnToSearchTimeout: null,

      lccnLoadSelected: false,

      dataTableInitalLimit: 1000,

      defaultProfile: '',

      displayDashboard: true,
      displayAllRecords: false,
      isLoadingAllRecords: false,

      dashBoard: {},

      allRecords: [],
      dataTableRecords: [],
      hideOptions: true,

      loadingRecord: false,
      loadType: "loadMarc",

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

      // console.log(points)
      return points
    }


  },

  methods: {
    showLoadTypeSelection: function () {
      let config = useConfigStore()
      return config.returnUrls.displayLCOnlyFeatures
    },

    openLCAPSyncURL(){

      window.open(`http://c2vlpndmsojump01.loc.gov/foliar/api/fetch_and_load/bib?lccn=${this.urlToLoad}&serialization=json`, '_blank')

    },

    
    changeLoadType: function (event) {
      if (event.target.checked) {
        this.loadType = "loadBf"
      } else {
        this.loadType = "loadMarc"
      }
    },

    loadFromAllRecord: function (eId) {


      this.profileStore.prepareForNewRecord()

      this.$router.push({ name: 'Edit', params: { recordId: eId } })


    },





    allRecordsRowClick: function (row) {



    },

    loadAllRecords: async function (event) {
      if (event) { event.preventDefault() }

      this.displayDashboard = false
      this.displayAllRecords = true
      this.isLoadingAllRecords = true

      let allRecordsRaw = await utilsNetwork.searchSavedRecords()
      let dashBoard = {
        byTimePeriod: {
          'last24Hours': {
            uniqueUsers: {},
            workedRecords: 0,
            postedRecords: 0,
          },
          'last7Days': {
            uniqueUsers: {},
            workedRecords: 0,
            postedRecords: 0,
          },
          'all': {
            uniqueUsers: {},
            workedRecords: 0,
            postedRecords: 0,
          }
        },
        totalDays: 0,

      }
      let oldestDate = 10000000000000
      let last24Hours = Math.floor(new Date().getTime() / 1000 - 86400)
      let last7Days = Math.floor(new Date().getTime() / 1000 - 604800)

      let postedByAgo = {}
      this.allRecords = []

      for (let r of allRecordsRaw) {
        // console.log("r", r)
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

        let date = new Date(r.time);
        // firefox doesn't like this format, add a space instead of a colon
        if (isNaN(date.getTime())) {
          r.time = r.time.replace(":", " ")
          date = new Date(r.time);
        }

        let timestamp = date.getTime() / 1000;

        dashBoard.byTimePeriod.all.uniqueUsers[r.user] = true
        dashBoard.byTimePeriod.all.workedRecords++
        if (r.status == 'published') {
          dashBoard.byTimePeriod.all.postedRecords++
        }
        if (timestamp > last24Hours) {
          dashBoard.byTimePeriod.last24Hours.uniqueUsers[r.user] = true
          dashBoard.byTimePeriod.last24Hours.workedRecords++
          if (r.status == 'published') {
            dashBoard.byTimePeriod.last24Hours.postedRecords++
          }
        }
        if (timestamp > last7Days) {
          dashBoard.byTimePeriod.last7Days.uniqueUsers[r.user] = true
          dashBoard.byTimePeriod.last7Days.workedRecords++
          if (r.status == 'published') {
            dashBoard.byTimePeriod.last7Days.postedRecords++
          }
        }
        if (timestamp < oldestDate) {
          oldestDate = timestamp
        }
        this.allRecords.push(obj)
      }

      dashBoard.totalDays = Math.floor((new Date().getTime() / 1000 - oldestDate) / 86400)
      // console.log(dashBoard)
      this.dashBoard = dashBoard

      this.dataTableRecords = this.allRecords.slice(0, this.dataTableInitalLimit)


      this.isLoadingAllRecords = false


    },

    returnTimeAgo: function (timestamp) {
      return timeAgo.format(timestamp * 1000)
    },


    returnPixleAsPercent: function (pixles) {
      return pixles / window.innerHeight * 100
    },

    loadTestData: function (meta) {


      let href = window.location.href.split("/")
      this.urlToLoad = `/${href[3]}/${href[4]}/test_files/${meta.lccn}.xml`
      this.urlToLoadIsHttp = true
      this.loadUrl(meta.profileId)
    },

    loadYourRecord: async function () {



    },

    loadSearch: function () {
      this.lccnLoadSelected = null
      console.log("this.urlToLoad", this.urlToLoad)
      console.log("this.urlToLoad.indexOf('BFDB URI')", this.urlToLoad.indexOf('BFDB URI'))
      console.log("this.urlToLoad.indexOf('Status')", this.urlToLoad.indexOf('Status'))
      if (this.urlToLoad.startsWith("http://") || this.urlToLoad.startsWith("https://")) {
        this.urlToLoadIsHttp = true
        return false
      } else if (this.urlToLoad.indexOf('BFDB URI') > -1 && this.urlToLoad.indexOf('Status') > -1) {

        let urlMatch = this.urlToLoad.match(/:\/\/[^\s\/]+\/.*?\/instances\/[^\s]+/g);
        if (urlMatch && urlMatch.length > 0) {
          urlMatch = urlMatch[0].split(' ')
          urlMatch = urlMatch[urlMatch.length - 1]
          urlMatch = urlMatch + '.convertedit-pkg.xml'
          this.urlToLoad = urlMatch
          this.urlToLoadIsHttp = true
          // this will tigger using the default profile
          this.loadUrl(new Event('click'), null)

          return false;
        } else {
          this.urlToLoadIsHttp = false
        }

      } else {
        this.urlToLoadIsHttp = false

      }
      // lccns are not short
      if (this.urlToLoad.length < 8) { return false }

      window.clearTimeout(this.lccnToSearchTimeout)
      this.searchByLccnResults = 'Searching...'
      this.lccnToSearchTimeout = window.setTimeout(async () => {

        this.searchByLccnResults = await utilsNetwork.searchInstanceByLCCN(this.urlToLoad)

        // If there's only one result, load it so the user doesn't have to do any clicking
        if (this.searchByLccnResults.length == 1) {
          this.lccnLoadSelected = this.searchByLccnResults[0]
        }

        console.log("searchByLccnResults", this.searchByLccnResults)

      }, 500)


    },

    loadUrl: async function (useInstanceProfile, multiTestFlag) {
      console.log("useInstanceProfile", useInstanceProfile)
      let useLoadUrl = ''
      if (this.lccnLoadSelected) {
        useLoadUrl = this.lccnLoadSelected.bfdbPackageURL
        if (this.loadType == 'loadBf') {
          useLoadUrl = useLoadUrl.replace("convertedit-pkg", "editor-pkg")
        }
      } else if (this.urlToLoad.startsWith("http://") || this.urlToLoad.startsWith("https://") || this.urlToLoad.startsWith("/")) {
        useLoadUrl = this.urlToLoad
      } else if (this.urlToLoad == 'new') {
        // continue on with a empty profile
      } else {
        alert("Please enter a valid URL or identifier to load.")
      }

      // did they just hit enter and the record is loading, and not ready to go yet
      if (useLoadUrl.trim() === '' && this.searchByLccnResults && typeof this.searchByLccnResults === 'string') {
        if (this.urlToLoadTimer) {
          return false
        }
        this.urlToLoadTimer = window.setTimeout(() => {
          this.urlToLoadTimer = null
          this.loadUrl(useInstanceProfile, multiTestFlag)
        }, 250)
        return false
      }

      if (useLoadUrl.trim() !== '') {
        this.loadingRecord = true
        let xml = await utilsNetwork.fetchBfdbXML(useLoadUrl)
        if (!xml) {
          alert("There was an error retrieving that URL. Are you sure it is correct: " + this.urlToLoad)
          this.loadingRecord = false
          return false
        }
        // if (xml.indexOf('<rdf:RDF'))
        // check for XML problems here ?
        utilsParse.parseXml(xml)
      }

      // find the right profile to use from the instance profile name used
      let useProfile = null
      // console.log("this.profiles", this.profiles)
      // console.log("useInstanceProfile", useInstanceProfile)

      // if it is an event it means they did not click the profile button but pressed ENTER
      if (useInstanceProfile instanceof Event) {
        // check to see if there is a default profile set
        if (this.defaultProfile && this.defaultProfile != '') {
          useInstanceProfile = this.defaultProfile
        }
        // don't keep going if there was no search result
        if (this.searchByLccnResults && this.searchByLccnResults.length === 0) {
          return false
        }
      }

      for (let key in this.profiles) {
        if (this.profiles[key].rtOrder.indexOf(useInstanceProfile) > -1) {
          useProfile = JSON.parse(JSON.stringify(this.profiles[key]))
        }
      }

      this.activeProfilePosted = false
      this.activeProfilePostedTimestamp = false

      // check if the input field is empty
      if (useLoadUrl == "" && useProfile === null) {
        this.loadingRecord = false
        alert("Please enter the URL or Identifier of the record you want to load.")
        return false
      }

      if (useProfile === null) {
        this.loadingRecord = false
        alert('No profile selected. Select a profile under "Load with profile."')
        return false
      }

      if (useLoadUrl.trim() !== '') {



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
      useProfile.log.push({ action: 'loadInstance', from: useLoadUrl })
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




      if (useLoadUrl.trim() !== '') {
        let profileDataMerge = await utilsParse.transformRts(useProfile)
        this.activeProfile = profileDataMerge
      } else {
        // if there is not url they are making it from scratch, so we need to link the instances and work together
        useProfile = utilsParse.linkInstancesWorks(useProfile)

        useProfile.newResource = true
        this.activeProfile = useProfile

        // prime this for ad hoc mode
        for (let rt in this.activeProfile.rt) {
          this.emptyComponents[rt] = []
          for (let element in this.activeProfile.rt[rt].pt) {
            // const e = this.activeProfile.rt[rt].pt[element]
            // if (e.mandatory != 'true'){
            //   this.emptyComponents[rt].push(element)
            // }
            this.profileStore.addToAdHocMode(rt, element)
          }
        }

        //For IBCs add the admin metadata
        for (let rt in this.activeProfile.rt) {
          if (rt.includes(":Instance")) {  // :Ibc:Instance
            let pt = this.activeProfile.rt[rt].pt
            let parent
            let parentId
            for (let k of Object.keys(pt)) {
              if (pt[k].parent) {
                parent = pt[k].parent
                parentId = pt[k].parentId
                break
              }
            }

            // Look up the profile's admin metadata
            const config = useConfigStore()
            let profileData;
            try {
              let response = await fetch(config.returnUrls.profiles);
              profileData = await response.json()
            } catch (err) {
              console.error('Could not download the profiles, unable to continue.')
              console.error(err);
            }

            let targetTemplate = "lc:RT:bf2:AdminMetadata:BFDB"
            try {
              targetTemplate = profileData.filter((obj) => obj.json.Profile.resourceTemplates.some((l) => l.id == useInstanceProfile))[0]
              targetTemplate = targetTemplate.json.Profile.resourceTemplates.filter((obj) => obj.id == useInstanceProfile)[0]
              targetTemplate = targetTemplate.propertyTemplates.filter((obj) => obj.propertyLabel == 'Admin Metadata')[0].valueConstraint.valueTemplateRefs[0]
            } catch (err) {
              console.warn("Using default template for admin metadata: ", err)
              targetTemplate = "lc:RT:bf2:AdminMetadata:BFDB"
            }

            // Add the Admin Metadata with the eNumber
            pt['id_loc_gov_ontologies_bibframe_adminmetadata'] = {
              "mandatory": false,
              "parent": parent,
              "parentId": parentId,
              "id": 'id_loc_gov_ontologies_bibframe_adminmetadata',
              "propertyLabel": "Admin Metadata",
              "propertyURI": "http://id.loc.gov/ontologies/bibframe/adminMetadata",
              "repeatable": true,
              "resourceTemplates": [],
              '@guid': short.generate(),
              "type": "resource",
              "userValue": {
                "@root": "http://id.loc.gov/ontologies/bibframe/adminMetadata",
                "http://id.loc.gov/ontologies/bibframe/adminMetadata": [
                  {
                    "@guid": short.generate(),
                    "@type": "http://id.loc.gov/ontologies/bibframe/AdminMetadata",
                    "http://id.loc.gov/ontologies/bibframe/identifiedBy": [
                      {
                        "@guid": short.generate(),
                        "@type": "http://id.loc.gov/ontologies/bibframe/Local",
                        "http://www.w3.org/1999/02/22-rdf-syntax-ns#value": [
                          {
                            "@guid": "8wJoYGrC8ut67SxhnXMEQp",
                            "http://www.w3.org/1999/02/22-rdf-syntax-ns#value": useProfile.eId
                          }
                        ],
                        "http://id.loc.gov/ontologies/bibframe/assigner": [
                          {
                            "@guid": short.generate(),
                            "@type": "http://id.loc.gov/ontologies/bibframe/Organization",
                            "@id": "http://id.loc.gov/vocabulary/organizations/dlcmrc",
                            "http://www.w3.org/2000/01/rdf-schema#label": [
                              {
                                "@guid": short.generate(),
                                "http://www.w3.org/2000/01/rdf-schema#label": "LC, NDMSO"
                              }
                            ],
                            "http://id.loc.gov/ontologies/bibframe/code": [
                              {
                                "@guid": short.generate(),
                                "http://id.loc.gov/ontologies/bibframe/code": "DLC-MRC",
                                "@datatype": "http://id.loc.gov/datatypes/orgs/code"
                              },
                              {
                                "@guid": short.generate(),
                                "http://id.loc.gov/ontologies/bibframe/code": "dlcmrc",
                                "@datatype": "http://id.loc.gov/datatypes/orgs/normalized"
                              },
                              {
                                "@guid": short.generate(),
                                "http://id.loc.gov/ontologies/bibframe/code": "US-dlcmrc",
                                "@datatype": "http://id.loc.gov/datatypes/orgs/iso15511"
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              "valueConstraint": {
                "defaults": [],
                "useValuesFrom": [],
                "valueDataType": {},
                "valueTemplateRefs": [targetTemplate]
              }
            }

            // Add the eNumber to the instance identifier
            if (Object.keys(pt).includes("id_loc_gov_ontologies_bibframe_identifiedBy__identifiers")) {
              pt['id_loc_gov_ontologies_bibframe_identifiedBy__identifiers'].userValue = {
                "http://id.loc.gov/ontologies/bibframe/identifiedBy": [
                  {
                    "@guid": short.generate(),
                    "@type": "http://id.loc.gov/ontologies/bibframe/Local",
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#value": [
                      {
                        "@guid": short.generate(),
                        "http://www.w3.org/1999/02/22-rdf-syntax-ns#value": useProfile.eId
                      }
                    ],
                    "http://id.loc.gov/ontologies/bibframe/assigner": [{
                      "@guid": short.generate(),
                      "@id": "http://id.loc.gov/vocabulary/organizations/dlcmrc",
                      "@type": "http://id.loc.gov/ontologies/bibframe/Organization",
                      "http://www.w3.org/2000/01/rdf-schema#label": [{
                        "@guid": short.generate(),
                        "http://www.w3.org/2000/01/rdf-schema#label": "LC, NDMSO"
                      }]
                    }]
                  }
                ]
              }
            }

            this.activeProfile.rt[rt].ptOrder.push('id_loc_gov_ontologies_bibframe_adminmetadata')
          }
        }
      }
      this.loadingRecord = false
      if (multiTestFlag) {
        this.$router.push(`/multiedit/`)
        return true
      }

      this.$router.push(`/edit/${useProfile.eId}`)



    },


    async refreshSavedRecords() {



      let records = await utilsNetwork.searchSavedRecords(this.preferenceStore.returnUserNameForSaving)

      let lccnLookup = {}

      // in this view we want to remove any records that are repeats, so only show the latest LCCN being edited
      this.continueRecords = []
      for (let r of records) {
        if (r.lccn && r.lccn != '' && r.lccn !== null) {
          if (!lccnLookup[r.lccn]) {
            this.continueRecords.push(r)
            lccnLookup[r.lccn] = true
          }
        } else {
          // no LCCN just add it
          this.continueRecords.push(r)
        }

      }


    },









  },

  mounted: async function () {
    this.loadingRecord = false
    this.refreshSavedRecords()
    if (window.location.hash && window.location.hash == '#stats') {
      // console.log("showing stats")
      this.loadAllRecords()
    }
    //reset the title
    document.title = `Marva`;

    // this.defaultProfile = 'lc:RT:bf2:Monograph:Instance'
    this.defaultProfile = this.preferenceStore.returnValue('--s-general-default-profile')

  },



  created: async function () {

    this.refreshSavedRecords()

    // this is checking to see if the route is available to load the passed URL to it
    let intervalLoadUrl = window.setInterval(() => {
      if (this.$route && this.$route.query && this.$route.query.url) {

        this.urlToLoad = this.$route.query.url
        this.urlToLoadIsHttp = true
        window.clearInterval(intervalLoadUrl)

      }

    }, 500)

    let intervalLoadProfile = window.setInterval(() => {
      if (this.$route && this.$route.query && this.$route.query.profile && this.startingPointsFiltered && this.startingPointsFiltered.length > 0) {
        // console.log("Weerrr looookiinnn at the profile!", this.$route.query.profile)
        let possibleInstanceProfiles = this.startingPointsFiltered.map((v) => v.instance)
        if (possibleInstanceProfiles.indexOf(this.$route.query.profile) > -1) {
          this.loadUrl(this.$route.query.profile)
        }
        window.clearInterval(intervalLoadProfile)
        // loadUrl
      }

    }, 600)


  }
}

</script>

<style>
.loading-record {
  text-align: center;
  font-size: 1.5em;
  margin-bottom: 1em;
}

.dt-bg-gray-50 {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color-accent')") !important;
  color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')") !important;

}

.dt-bg-white {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color')") !important;
  color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')") !important;



}
</style>

<style scoped>
#test-data-table {
  width: 100%;



}

#all-records-table {

  height: 90vh;
  overflow-y: auto;

}


.test-data:nth-child(odd) {

  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color')") !important;
  color: v-bind("preferenceStore.returnValue('--c-edit-modals-text-color')") !important;

  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color-accent')") !important;

}

.test-data a {
  color: inherit !important;
  text-decoration: none;

}

.test-data a:hover {
  text-decoration: underline;
}

.test-data button {
  width: 100%;
}

.saved-records-empty {
  margin-top: 2em;
  margin-left: 1em;
  font-style: italic;
}

label {
  cursor: pointer;
}

ol {
  list-style: none;
  padding-left: 0;
  margin-bottom: 2em;
}

.continue-record .material-icons {
  position: absolute;
  right: 0;
  top: 0;
  color: limegreen;
}

.continue-record-list {
  margin-top: 1em;
  padding-left: 0.1em;
  list-style: none;
  height: 85vh;
  overflow-y: auto;

}

.continue-record a {
  text-decoration: none;
  color: inherit !important;
}

.continue-record:hover {
  box-shadow: 0px 0px 3px -1px rgba(0, 0, 0, 0.46);
  background-color: whitesmoke;

}

.continue-record-list li:nth-of-type(1n+100) {
  display: none;
}

.continue-record-title {
  font-style: italic;
}

.continue-record {
  border: solid 1px lightgray;
  padding: 4px;
  position: relative;

}

.continue-record-lastedit {
  color: grey;
}

.load-columns {
  display: flex;
}

.load-columns>div {
  flex: 1;
}

.url-to-load {
  font-size: 1.25em;
  margin-bottom: 1em;
  margin-top: 1em;


  width: 80%;
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

summary {
  cursor: pointer;
}

.load-test-data-column {
  height: 95vh;
  overflow-y: auto;
  padding-bottom: 5em;
}

.hide-options {
  display: none;
}

.header {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-background-color')") !important;

}

.default-profile-container {
  padding: 0.25em;
  margin-top: 1em
}

.default-profile-container select {
  margin-left: 1em;
  font-size: 1em;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.infinite-spin {
  display: inline-block;
  /* don't do it :( */
  /* animation: spin 2s linear infinite; */
}

/* toggle */
/* https://hudecz.medium.com/how-to-create-a-pure-css-toggle-button-2fcc955a8984 */
#container {
  margin-left: 5px;
}

.toggle {
  display: none;
}

.toggle-container {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  width: fit-content;
  border: 3px solid v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
  border-radius: 20px;
  background: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
  font-weight: bold;
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
  cursor: pointer;
}

.toggle-container::before {
  content: '';
  position: absolute;
  width: 50%;
  height: 100%;
  left: 0%;
  border-radius: 20px;
  background: black;
  transition: all 0.3s;
}

.toggle-container div {
  padding: 6px;
  text-align: center;
  z-index: 1;
}

.toggle:checked+.toggle-container::before {
  left: 50%;
}

.toggle:checked+.toggle-container div:first-child {
  color: black;
  transition: color 0.3s;
}

.toggle:checked+.toggle-container div:last-child {
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
  transition: color 0.3s;
}

.toggle+.toggle-container div:first-child {
  color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
  transition: color 0.3s;
}

.toggle+.toggle-container div:last-child {
  color: black;
  transition: color 0.3s;
}
</style>
