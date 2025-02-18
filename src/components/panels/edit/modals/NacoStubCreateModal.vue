<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { useProfileStore } from '@/stores/profile'  

  
  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'
  

  import utilsNetwork from '@/lib/utils_network';


  export default {
    components: {
      VueFinalModal,
      VueDragResize,     

    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 200,
        left: 0,

        initalHeight: 400,
        initalLeft: 400,


        hubTitle:"",
        hubCreator:{
          label: null,
          marcKey: null,
          uri: null
        },
        hubLang: null,

        langsLookup:[],
        selectedLang: 'na',

        displayModal:false,

        postStatus: 'unposted',

        newHubUrl: null,
        


        disableAddButton: true,

        oneXX: '',
        oneXXParts: {},
        oneXXErrors: [],
        oneXXResults: [],
        oneXXResultsTimeout: null,
        fourXX: '',
        mainTitle: '',
        workURI: false,

        tmpXML:false,


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),      
      ...mapStores(useProfileStore),      

      ...mapWritableState(useProfileStore, ['activeProfile','showNacoStubCreateModal','activeHubStubData','activeHubStubComponent']),

      

      
      

    },

    watch: {
      // showDebugModal(newVal, oldVal) {
      //   console.log(newVal,oldVal)
      //   // if (newVal === true){
      //   //   this.loadPrefGroup()
      //   // }
      // }
    },

    methods: {
        
        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.nonLatinBulkContent.style.height = newRect.height + 'px'

        },


   
        
        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD') {
            event.stopPropagation()
          }
        },

        async buildNacoStub(){


          this.postStatus='posting'

          let results = await this.profileStore.buildPostNacoStub(this.oneXXParts,this.fourXX, this.mainTitle, this.workURI)



          results = results.replace(/<marcxml:leader>/g,"\n<marcxml:leader>")

          results = results.replace(/\<\/marcxml:controlfield>/g,"</marcxml:controlfield>\n")
          results = results.replace(/\<\/marcxml:leader>/g,"</marcxml:leader>\n")
          results = results.replace(/\<\/marcxml:datafield>/g,"</marcxml:datafield>\n")
          results = results.replace(/\<\/marcxml:subfield>/g,"</marcxml:subfield>\n")


          this.tmpXML=results

          console.log(results)

          // if (results && results.postLocation){
          //   results.postLocation = results.postLocation.replace("http://",'https://')
          //   this.profileStore.setValueComplex(this.activeHubStubComponent.guid, null, this.activeHubStubComponent.propertyPath, results.postLocation, this.hubTitle, null, {}, null)

          //   this.newHubUrl=results.postLocation
          //   this.postStatus='posted'

          // }else{
          //   alert("Error posting!")
          //   this.postStatus='error'
          // }

          

          
          console.log(results)


          // this.profileStore.setValueComplex(this.guid, null, this.propertyPath, contextValue.uri, contextValue.title, contextValue.typeFull, contextValue.nodeMap, contextValue.marcKey)



        },

        close(){
          this.activeHubStubComponent = {}
          this.activeHubStubData = {}
          this.showNacoStubCreateModal=false
          this.postStatus=='unposed'

        },

        async searchAuthLabel(authLabel){



          this.oneXXResults = []

          let results = await utilsNetwork.loadSimpleLookupKeyword('https://id.loc.gov/authorities/names',authLabel )

          let formatted = []
          for (let key of Object.keys(results)){
            if (key != 'metadata'){
              formatted.push({name:results[key][0], uri:key})

            }
          }

          this.oneXXResults = formatted


        },

        checkOneXX(){
          this.oneXXErrors = []
          this.disableAddButton = true
          if (this.oneXX.length<3){ return true}

          

          let oneXXParts = this.oneXX.split("$")
          if (oneXXParts.length>0){
            
            let fieldTag = oneXXParts[0].slice(0,3)

            let indicators = oneXXParts[0].slice(3,5)

            console.log('fieldTag',fieldTag)
            console.log('indicators',`>${indicators}<`)

            if (indicators.charAt(0) != ' ' && indicators.charAt(0) != '/' && indicators.charAt(0) != '1' && indicators.charAt(0) != '2' && indicators.charAt(0) != '3' && indicators.charAt(0) != '0'){
              this.oneXXErrors.push("Ivalid indicator character(s)")
            }
            if (indicators.charAt(1) != ' ' && indicators.charAt(1) != '/' && indicators.charAt(1) != '1' && indicators.charAt(1) != '2' && indicators.charAt(1) != '3' && indicators.charAt(1) != '0'){
              this.oneXXErrors.push("Ivalid indicator character(s)")
            }
            this.oneXXParts = {}
            let dollarParts = oneXXParts.slice(1)
            console.log('dollarParts',dollarParts)
            
            let dollarKey = {}

            for (let dp of dollarParts){

              let subfield = dp.slice(0,1)
              let value = dp.slice(1)
              dollarKey[subfield] = value

              console.log(dollarKey)
            }
            dollarKey.fieldTag = fieldTag
            dollarKey.indicators = indicators

            this.oneXXParts = dollarKey
            let authLabel = ""
            if (dollarKey.a){
              authLabel = authLabel + dollarKey.a
            }
            if (dollarKey.b){
              authLabel = authLabel + ' ' + dollarKey.b
            }
            if (dollarKey.c){
              authLabel = authLabel + ' ' + dollarKey.c
            }
            if (dollarKey.q){
              authLabel = authLabel + ' ' + dollarKey.q
            }
            if (dollarKey.d){
              authLabel = authLabel + ' ' + dollarKey.d
            }
            if (dollarKey.g){
              authLabel = authLabel + ' ' + dollarKey.g
            }


            console.log(authLabel)
            if (dollarKey.a){
              window.clearTimeout(this.oneXXResultsTimeout)
              this.oneXXResultsTimeout = window.setTimeout(()=>{                
                this.searchAuthLabel(authLabel)
              },500)
              this.disableAddButton=false
            }



          }else{
            
            errors.push("Bad 1XX")
          }

          let count = (this.oneXX.match(/\$/g) || []).length;
          if (count == 0){
            this.oneXXErrors.push("No Subfields entered for 1XX")
          }


          if (!this.mainTitle){
            this.disableAddButton = true
            this.oneXXErrors.push("You need to add a bf:mainTitle to the work first")
          }
          

          

        }
       


    

    },


    created(){

       // this.$nextTick(()=>{
        // createNacoStubXML
      // })

    },

    async mounted() {

      this.tmpXML=false
      this.mainTitle = this.profileStore.nacoStubReturnMainTitle()
      this.workURI =  this.profileStore.nacoStubReturnWorkURI()
      console.log("this.workURIthis.workURIthis.workURI",this.workURI)
      if (!this.mainTitle){
        this.disableAddButton = true
        this.oneXXErrors.push("You need to add a bf:mainTitle to the work first")
      }

    }

  }



</script>

<template>


    <VueFinalModal
      display-directive="show"
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"

      
    >
        <VueDragResize
          :is-active="true"
          :w="850"
          :h="initalHeight"
          :x="initalLeft"
          :y="50"
          class="debug-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="non-latin-bulk-content" ref="nonLatinBulkContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            
            <div class="menu-buttons">
              <button class="close-button" @pointerup="close">X</button>
            </div>

            <h3 style="margin-bottom: 1em;">Create NACO Stub</h3>
            <div style="display: flex; margin-bottom: 1em;">
              <div style="flex-grow: 1;">
                <input type="text" ref="hub-title" v-model="oneXX" @input="checkOneXX" class="title" placeholder="1##//$aDoe, Jane$d19XX-">
              </div>
            </div>
            <div style="display: flex; margin-bottom: 1em;">
              <div style="flex-grow: 1;">
                <input type="text" ref="hub-title" v-model="fourXX" class="title" placeholder="4##//$a도위, 즈헤인$d19XX-">
              </div>
            </div>

            
            
            <!-- <div style="margin-bottom: 1em;">
              <span class="creator-label" v-if="!hubCreator.label">[No Hub Creator]</span>
              <span class="creator-label" v-if="hubCreator.label">{{hubCreator.label  }}</span>
              <button @click="displayModal=true" style="line-height: 1.75em;" v-if="!hubCreator.label">Select Creator</button>
              <button @click="hubCreator.label=null;hubCreator.uri=null;hubCreator.marcKey=null;" style="line-height: 1.75em;" v-if="hubCreator.label">Remove</button>

              <button v-if="!hubCreator.label && activeHubStubData && activeHubStubData.contributors && activeHubStubData.contributors[0]" class="title-button" @click="useWorkCreator()" style="vertical-align: bottom"><span class="material-icons" style="font-size: 20px;">arrow_back</span><span class="title-button-copy">Use Work Creator</span></button>

              <template v-if="displayModal">
                <ComplexLookupModal ref="complexLookupModal" :searchValue="''" :authorityLookup="''" @emitComplexValue="setPContributor" @hideComplexModal="searchValue='';displayModal=false;" :structure="{valueConstraint:{useValuesFrom:['http://preprod.id.loc.gov/authorities/names']}}" v-model="displayModal"/>
              </template>
              

            </div> -->

            <div id="error-info">
              <div v-for="e in oneXXErrors">{{ e }}</div>
              <template v-if="oneXXResults.length>0 && oneXXResults.length<=5">
                <div v-for="r in oneXXResults" style="margin-bottom: 1em;">
                  <a :href="r.uri" target="_blank">{{ r.name }}</a>
                </div>
              </template>
              <template v-else-if="oneXXResults.length>0 && oneXXResults.length>5">
               <details style="margin-bottom: 1em;">
                <summary>There are {{ oneXXResults.length }} hits on that name.</summary>
                <div v-for="r in oneXXResults">
                  <a :href="r.uri" target="_blank">{{ r.name }}</a>
                </div>
               </details>
              </template>

            </div>
            <div v-if="mainTitle">
              <span>Using title for 670:</span> <span style="font-family: monospace; background-color: aliceblue;">{{ mainTitle }}</span>
            </div>
            <hr>
            <div v-if="postStatus!='posted'">
              Fill out the 1XX and optional 4XX field using MARC field notation.
            </div>

            <div style="display: flex; padding: 1.5em;" v-if="postStatus=='unposted'">
              <div style="flex:1; text-align: center;"><button style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;" @click="buildNacoStub" :disabled="disableAddButton">Generate Stub</button></div>
              <div style="flex:1; text-align: center"><button @click="close" style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;">Cancel</button></div>
            </div>
            <textarea spellcheck="false" style="width: 100%; min-height: 200px;" v-if="tmpXML">{{ tmpXML }}</textarea>
            <div style="display: flex; padding: 1.5em; font-size: 1.5em;" v-if="postStatus=='posting'">
              <div >Posting... Please wait...</div>
              


            </div>
            <div style="display: flex; padding: 1.5em;" v-if="postStatus=='posted'">
              <div >The Hub was created! If you would like to edit it further please click the link, it will open in new tab:</div>
              <div><a :href="`../load?url=${newHubUrl}.rdf&profile=lc:RT:bf2:HubBasic:Hub`" target="_blank">{{ newHubUrl }}</a></div>
            </div>
            <div v-if="postStatus=='posted'" style="text-align: center;">
              <button @click="close" style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;">Close</button>

            </div>

            
          </div>


        </VueDragResize>
    </VueFinalModal>


    

</template>
<style>

  .content-container{

    background-color: white;
  }

</style>

<style scoped>


  hr{
    margin-top: 2em;
    margin-bottom: 2em;
  }
select{
  font-size: 1.35em;
}


  .creator-label{
    background-color: whitesmoke;
    font-family: monospace;
    padding: 0.2em;
    margin-right: 0.2em;
  }

  .title{
    font-size: 1.35em;
    width:100%;
  }
  .title-button{
    margin-left: 1em;
  }
  .title-button-copy{
    vertical-align: super;
  }

  .checkbox-option{
    width: 20px;
    height: 20px;
  }

  input[type=checkbox]{
    width: 25px;
    height: 25px;
  }
  input{
    font-family: monospace;
  }
  

  .option{
    display: flex;
  }
  .option-title{
    flex:2;
  }
  .option-title-header{
    font-weight: bold;
  }
  .option-title-desc{
    font-size: 0.8em;
    color:gray;
  }
  #non-latin-bulk-content{
    padding: 1em;

    overflow-y: scroll;

  }
  .menu-buttons{
    margin-bottom: 2em;
    position: relative;
  }
  .close-button{
    position: absolute;
    right: 5px;
    top: 5px;
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
  }

  .disable-voyager-container{
    margin-top: 1em;
    margin-bottom: 1em;
    display: flex;
    align-items: center;
  }


  .disable-voyager-container div{
    flex: 1;
  }
  .disable-voyager-container-check{
    flex: 0 !important;
    padding-right: 1em;
  }



  

</style>
