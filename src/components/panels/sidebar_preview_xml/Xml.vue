<script>
  import { useProfileStore } from '@/stores/profile'
  import { usePreferenceStore } from '@/stores/preference'
  import XmlViewer from 'vue3-xml-viewer'

  import { mapStores, mapState, mapWritableState } from 'pinia'

  export default {
    components: {
        XmlViewer
    },

    data() {
      return {
        xml : "",
        timeout: null,
        firstLoad: true,
      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,usePreferenceStore),
      // // gives read access to this.count and this.double
      ...mapState(useProfileStore, ['activeProfile']),
      ...mapState(usePreferenceStore, ['styleDefault']),

      ...mapWritableState(useProfileStore, ['activeComponent']),


    },
    watch: {    

      
    },

    methods: {

      async refreshXml() {


        let exportResult = await this.profileStore.buildExportXML()

        this.xml = exportResult.xlmStringBasic

        if (this.firstLoad){
          this.$nextTick(()=>{
            for (let el of document.querySelectorAll('.element-name')){                
                if (el.innerText == 'bf:Work' || el.innerText == 'bf:Instance' || el.innerText == 'void:DatasetDescription'){
                  el.click()
                  this.firstLoad = false
                }
            }            
          })
        }

      }
      




    },

    created() {

      this.profileStore.$subscribe(async (mutation, state)=>{

        if (mutation && mutation.events && mutation.events.target && mutation.events.target['@guid'] ){
          
          window.clearTimeout(this.timeout)
          this.timeout = window.setTimeout(()=>{

            this.refreshXml()

          },500)


          
        }


        // if (state.profilesLoaded && Object.keys(state.activeProfile).length == 0){  
        //   // the profilesLoaded flipped and there is no active profile, so load the data
        //   this.profileStore.loadRecordFromBackend(this.$route.params.recordId)
        // }else{
        //   //console.error("profilesLoaded is never true, cannot load into data")
        // }


      }, { detached: true })

      // build the XML on first load
      this.$nextTick(()=>{
        window.setTimeout(()=>{

          this.refreshXml()

         },1000)
      })
    },

    mounted() {
     

      
    }
  }



</script>

<template>

  <div>
    
    <XmlViewer ref="xmlviewer" :xml="xml" />



  </div>


</template>

<style scoped>





.sidebar-header-text{  
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size', true) + 0.25  + 'em'");
  font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-family')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;

}


.sidebar-spacer{
  padding-top: 1em;
  margin-top: 1em;
  padding-bottom: 1em;
  border-top: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')");

}


.item-icon{
  fill:v-bind("preferenceStore.returnValue('--c-general-icon-item-color')");
  stroke-width:0.5;
  stroke:rgb(0,0,0)
}




</style>
