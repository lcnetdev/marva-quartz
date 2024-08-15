<template>

  <splitpanes class="default-theme" horizontal>

    <pane class="header" :size="returnPixleAsPercent(preferenceStore.returnValue('--n-edit-main-splitpane-nav-height',true))">
      <Nav/>
    </pane>

    <pane>

      <splitpanes>



        <pane class="load" v-if="displayAllRecords">
          <button @click="displayAllRecords=false;displayDashboard=true">Close</button>
          <div id="all-records-table">
            <DataTable  :loading="isLoadingAllRecords" :rows="allRecords" striped hoverable>

              <!-- { "Id": "e1078432", "RTs": [ "lc:RT:bf2:Monograph:Work" ], "Type": "Monograph", "Status": "unposted", "Urls": [ "http://id.loc.gov/resources/works/e1078432", "http://id.loc.gov/resources/instances/e1078432" ], "Time": "2024-07-10:17:11:53", "User": "asdf (asdf)" } -->

              <template #tbody="{row}">


                <td>
                  <router-link :to="{ name: 'Edit', params: { recordId: row.Id }}">
                    {{ row.Id }}
                  </router-link>
                </td>

                <td v-text="(row.RTs) ? row.RTs.join(', ') : row.RTs"/>
                <td v-text="row.Type"/>
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

        <pane class="load" v-if="displayDashboard">



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
                <div>
                  <div class="load-buttons">
                    <button class="load-button" @click="loadUrl(s.instance)" v-for="s in startingPointsFiltered">{{s.name}}</button>


                  </div>
                </div>



            </div>

          </div>



        </pane>



      </splitpanes>

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


  TimeAgo.addDefaultLocale(en)
  const timeAgo = new TimeAgo('en-US')

  const decimalTranslator = short("0123456789");



  export default {
    components: { Splitpanes, Pane, Nav, DataTable },
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

        allRecords: []


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapState(usePreferenceStore, ['styleDefault','panelDisplay']),
      ...mapState(useConfigStore, ['testData']),
      ...mapState(useProfileStore, ['startingPoints','profiles']),
      ...mapWritableState(useProfileStore, ['activeProfile']),





      // // gives read access to this.count and this.double
      // ...mapState(usePreferenceStore, ['profilesLoaded']),

      startingPointsFiltered(){
        let points = []
        for (let k in this.startingPoints){

          if (this.startingPoints[k].work && this.startingPoints[k].instance){
            points.push(this.startingPoints[k])
          }


        }

        return points
      }


    },

    methods: {

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
        for (let key in this.profiles){
          if (this.profiles[key].rtOrder.indexOf(useInstanceProfile)>-1){
            useProfile = JSON.parse(JSON.stringify(this.profiles[key]))
          }
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
        }


        if (multiTestFlag){
          this.$router.push(`/multiedit/`)
          return true
        }

        this.$router.push(`/edit/${useProfile.eId}`)



      },









    },
    created: async function(){



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

      let inerval = window.setInterval(()=>{

          if (this.$route && this.$route.query && this.$route.query.url){

            this.urlToLoad = this.$route.query.url
            this.urlToLoadIsHttp=true
            window.clearInterval(inerval)

          }



          // if (this.$router.currentRoute && this.$router.currentRoute.query && this.$router.currentRoute.query.url){
          //   let url = this.$router.currentRoute.query.url
          //   if (this.$router.currentRoute && this.$router.currentRoute.query && this.$router.currentRoute.query.action && this.$router.currentRoute.query.action == 'loadwork'){
          //     url = url.replace('.jsonld','.rdf')
          //   }
          //   if (this.$router.currentRoute && this.$router.currentRoute.query && this.$router.currentRoute.query.action && this.$router.currentRoute.query.action == 'loadibc'){
          //     url = url.replace('.jsonld','.xml')
          //   }
          //   this.instanceEditorLink = url
          //   this.testInstance()
          //   window.clearInterval(inerval)
          // }
        },500)


    }
  }

</script>

<style scoped>
#test-data-table{
  width:100%;
}

#all-records-table{

  height: 90vh;
  overflow-y: auto;

}
.test-data:nth-child(odd) {

  background-color: whitesmoke;
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
    background-color: white !important;
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




</style>
