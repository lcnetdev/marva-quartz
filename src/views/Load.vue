<template>

  <splitpanes class="default-theme" horizontal>

    <pane class="header" :size="returnPixleAsPercent(preferenceStore.returnValue('--n-edit-main-splitpane-nav-height',true))">
      <Nav/>
    </pane>

    <pane> 

      <splitpanes>
        <pane class="load">
          
          <h1>Load</h1>

          
          <form ref="urlToLoadForm" v-on:submit.prevent="loadUrl">
            <input placeholder="URL to resource" class="url-to-load" type="text" v-model="urlToLoad" ref="urlToLoad">
          </form>

          <h3>Profiles:</h3>

          <div class="load-buttons"> 
            <button class="load-button" @click="loadUrl(s.instance)" v-for="s in startingPointsFiltered">{{s.name}}</button>
            <button class="load-button" @click="loadUrl(startingPointsFiltered[0].instance,true)">test</button>

          </div>
          <hr>

          <details>
            <summary>Test Data</summary>
            <table>
              <tr v-for="t in testData">
                <td>{{t.desc}}</td>
                <td><button @click="loadTestData(t.filename)">Set URL</button></td>
              </tr>
            </table>
          </details>


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

  const decimalTranslator = short("0123456789");



  export default {
    components: { Splitpanes, Pane, Nav },
    data() {
      return {

        urlToLoad:''
        

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

      returnPixleAsPercent: function(pixles){
        return pixles/window.innerHeight*100
      },

      loadTestData: function(filename){
        this.urlToLoad = '/bfe2/quartz/test_files/' + filename
        // this.loadUrl()
      },

      loadUrl: async function(useInstanceProfile,multiTestFlag){
        console.log(this.urlToLoad)

       



        if (this.urlToLoad.trim() !== ''){

          let xml = await utilsNetwork.fetchBfdbXML(this.urlToLoad)
          console.log(xml)

          // check for XML problems here ?

          utilsParse.parseXml(xml)

          console.log(utilsParse.hasItem)

        }

        // find the right profile to use from the instance profile name used
        let useProfile = null
        for (let key in this.profiles){
          if (this.profiles[key].rtOrder.indexOf(useInstanceProfile)>-1){
            useProfile = JSON.parse(JSON.stringify(this.profiles[key]))
          }
        }       
        
        if (useProfile===null){
          alert('Cannot find profile.')
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
        }

        // TODO
        if (!useProfile.user){
          useProfile.user = 'TODO'
        }

        if (!useProfile.status){
          useProfile.status = 'unposted'
        }


        if (this.urlToLoad.trim() !== ''){
          let profileDataMerge  = await utilsParse.transformRts(useProfile)
          this.activeProfile = profileDataMerge
        }else{
          this.activeProfile = useProfile
        }
        
        console.log("this.activeProfile",this.activeProfile)

        if (multiTestFlag){
          this.$router.push(`/multiedit/`)          
          return true
        }

        this.$router.push(`/edit/${useProfile.eId}`)


        
      },









    },
    created: function(){

    }
  }

</script>

<style scoped>

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


</style>
