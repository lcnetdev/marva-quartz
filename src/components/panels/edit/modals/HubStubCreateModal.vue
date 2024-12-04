<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { useProfileStore } from '@/stores/profile'  
  import ComplexLookupModal from "@/components/panels/edit/modals/ComplexLookupModal.vue";

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'
  

  import utilsNetwork from '@/lib/utils_network';


  export default {
    components: {
      VueFinalModal,
      VueDragResize,     
      ComplexLookupModal,
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





      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),      
      ...mapStores(useProfileStore),      

      ...mapWritableState(useProfileStore, ['activeProfile','showHubStubCreateModal','activeHubStubData','activeHubStubComponent']),

      

      
      

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


        useWorkCreator(){
          
          if (this.activeHubStubData && this.activeHubStubData.contributors && this.activeHubStubData.contributors[0]){
            let c = this.activeHubStubData.contributors[0]

            this.hubCreator.label = c.label
            if (c['http://id.loc.gov/ontologies/bflc/marcKey'] && c['http://id.loc.gov/ontologies/bflc/marcKey'][0]&& c['http://id.loc.gov/ontologies/bflc/marcKey'][0]['http://id.loc.gov/ontologies/bflc/marcKey']){
              this.hubCreator.marcKey = c['http://id.loc.gov/ontologies/bflc/marcKey'][0]['http://id.loc.gov/ontologies/bflc/marcKey']
            }
            this.hubCreator.uri = c['@id']
            this.hubCreator.typeFull = c['@type']

          }

        },

        setPContributor(value){


          this.displayModal=false

          this.hubCreator.label = null
          this.hubCreator.marcKey = null
          this.hubCreator.uri = null
          this.hubCreator.typeFull = null
          
          console.log("value",value)

          if (value.title){
            if (Array.isArray(value.title)){
              this.hubCreator.label = value.title.filter((v)=> {return (!v['@language'])})[0]
              if (typeof this.hubCreator.label == 'object' && this.hubCreator.label['@value']){
                this.hubCreator.label = this.hubCreator.label['@value']
              }
            }else{
              this.hubCreator.label = value.title
            }
          }
          
          if (value.marcKey){
            if (Array.isArray(value.marcKey)){
              this.hubCreator.marcKey = value.marcKey.filter((v)=> {return (!v['@language'])})[0]
              if (typeof this.hubCreator.marcKey == 'object' && this.hubCreator.marcKey['@value']){
                this.hubCreator.marcKey = this.hubCreator.marcKey['@value']
              }

            }else{
              this.hubCreator.marcKey = value.marcKey
            }
          }
          if (value.typeFull){
            if (Array.isArray(value.typeFull)){
              this.hubCreator.typeFull = value.typeFull.filter((v)=> {return (!v['@language'])})[0]
              if (typeof this.hubCreator.typeFull == 'object' && this.hubCreator.typeFull['@value']){
                this.hubCreator.typeFull = this.hubCreator.typeFull['@value']
              }

            }else{
              this.hubCreator.typeFull = value.typeFull
            }
          }            
          
          this.hubCreator.uri = value.uri



          console.log(this.hubCreator)
          
        },

      

           

        
        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD') {
            event.stopPropagation()
          }
        },

        async buildHub(){

          

          let results = await this.profileStore.buildPostHubStub(this.hubCreator,this.hubTitle,this.hubLang,this.preferenceStore.catCode)


          // this.profileStore.setValueComplex(this.guid, null, this.propertyPath, contextValue.uri, contextValue.title, contextValue.typeFull, contextValue.nodeMap, contextValue.marcKey)

          
          console.log(results)


          // this.profileStore.setValueComplex(this.guid, null, this.propertyPath, contextValue.uri, contextValue.title, contextValue.typeFull, contextValue.nodeMap, contextValue.marcKey)



        },
       


    

    },


    created(){

       // this.$nextTick(()=>{

      // })

    },

    async mounted() {

      // ask for the url to use from the active profile for the bf:language property then request it and load the results
      let useLookupUrl = this.profileStore.returnProfileLookupUrl("bf:language") 
      let langs = await utilsNetwork.loadSimpleLookup(useLookupUrl)
      this.langsLookup=[]
      for (let langUri in langs){
        if (langUri != 'metadata'){
          this.langsLookup.push({
            uri:langUri,
            label:langs[langUri][0]
          })
        }
      } 

      
      this.$nextTick(()=>{

        this.$refs['hub-title'].focus()
        this.$refs['hub-title'].focus()
      })
      


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
              <button class="close-button" @pointerup="showHubStubCreateModal=false">X</button>
            </div>
            <h3 style="margin-bottom: 1em;">Create Quick Hub</h3>
            <div style="display: flex; margin-bottom: 1em;">
              <div style="flex-grow: 1;">
                <input type="text" ref="hub-title" v-model="hubTitle" class="title" placeholder="Hub Title">
              </div>
              <div style="flex-shrink: 1;">
               <button v-if="activeHubStubData && activeHubStubData.title" class="title-button" @click="hubTitle=activeHubStubData.title"><span class="material-icons" style="font-size: 20px;">arrow_back</span><span class="title-button-copy">Use Work Title</span></button>
  
              </div>
              <template v-if="activeHubStubData && activeHubStubData.title && activeHubStubData.title.trim() != ''">
              </template>
            </div>


            <div style="margin-bottom: 1em;">
              <span class="creator-label" v-if="!hubCreator.label">[No Hub Creator]</span>
              <span class="creator-label" v-if="hubCreator.label">{{hubCreator.label  }}</span>
              <button @click="displayModal=true" style="line-height: 1.75em;" v-if="!hubCreator.label">Select Creator</button>
              <button @click="hubCreator.label=null;hubCreator.uri=null;hubCreator.marcKey=null;" style="line-height: 1.75em;" v-if="hubCreator.label">Remove</button>

              <button v-if="!hubCreator.label && activeHubStubData && activeHubStubData.contributors && activeHubStubData.contributors[0]" class="title-button" @click="useWorkCreator()" style="vertical-align: bottom"><span class="material-icons" style="font-size: 20px;">arrow_back</span><span class="title-button-copy">Use Work Creator</span></button>

              <template v-if="displayModal">
                <ComplexLookupModal ref="complexLookupModal" :searchValue="''" :authorityLookup="''" @emitComplexValue="setPContributor" @hideComplexModal="searchValue='';displayModal=false;" :structure="{valueConstraint:{useValuesFrom:['http://preprod.id.loc.gov/authorities/names']}}" v-model="displayModal"/>
              </template>
              

            </div>
            <select v-model="hubLang">
              <option value="na">No Hub Language Selected</option>
              <option v-for="l in langsLookup" :value="l.uri">{{ l.label }}</option>
            </select>

            <hr>
            <div>
              Fill out the above information to create a Hub Stub. You would create a Hub for resources that you would not normally create a MARC Authority record for. Once you click create you will be provided a link to further edit the Hub if you wish.
            </div>

            <div style="display: flex; padding: 1.5em;">
              <div style="flex:1; text-align: center;"><button style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;" @click="buildHub">Create Hub</button></div>
              <div style="flex:1; text-align: center"><button style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;">Cancel</button></div>

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
