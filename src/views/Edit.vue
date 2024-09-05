<template>

  <splitpanes class="default-theme" horizontal>

    <pane class="header" :size="returnPixleAsPercent(preferenceStore.returnValue('--n-edit-main-splitpane-nav-height',true))">
      <Nav/>
    </pane>


    <pane>

      <splitpanes>
        <pane  v-if="panelDisplay.properties"
          :class="{'edit-main-splitpane-properties': true, 'edit-main-splitpane-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-properties-no-scrollbar')}"
          :size="preferenceStore.returnValue('--n-edit-main-splitpane-properties-width')"
          min-size="5">
          <Properties/>

        </pane>


        <template v-if="panelDisplay.dualEdit">

          <pane
            :class="{'edit-main-splitpane-edit': true, 'edit-main-splitpane-edit-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-edit-no-scrollbar')}"
            :size="preferenceStore.returnValue('--n-edit-main-splitpane-edit-width')">
            <EditPanel :instanceMode="false" :dualEdit="true" />
          </pane>

          <pane
            :class="{'edit-main-splitpane-edit': true, 'edit-main-splitpane-edit-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-edit-no-scrollbar')}"
            :size="preferenceStore.returnValue('--n-edit-main-splitpane-edit-width')">
            <EditPanel :instanceMode="true" :dualEdit="true"/>
          </pane>




        </template>
        <template v-else>

            <pane
              :class="{'edit-main-splitpane-edit': true, 'edit-main-splitpane-edit-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-edit-no-scrollbar')}"
              :size="preferenceStore.returnValue('--n-edit-main-splitpane-edit-width')">

              <EditPanel :key="test" :instanceMode="false" :dualEdit="false"/>
            </pane>


        </template>


        <pane v-if="panelDisplay.opac"
          :class="{'edit-main-splitpane-opac': true, 'edit-main-splitpane-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-opac-no-scrollbar')}"
          :size="preferenceStore.returnValue('--n-edit-main-splitpane-opac-width')"
        >
          <Opac/>
        </pane>

        <pane v-if="panelDisplay.xml"
          :class="{'edit-main-splitpane-xml': true, 'edit-main-splitpane-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-opac-no-scrollbar')}"
          :size="preferenceStore.returnValue('--n-edit-main-splitpane-opac-width')"
        >
          <Xml/>

        </pane>
        <pane v-if="panelDisplay.marc"
          :class="{'edit-main-splitpane-marc': true, 'edit-main-splitpane-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-opac-no-scrollbar')}"
          :size="preferenceStore.returnValue('--n-edit-main-splitpane-opac-width')"
        >
          <Marc/>

        </pane>




      </splitpanes>

    </pane>


  <template v-if="showDebugModal==true">
    <Debug v-model="showDebugModal" />
  </template>

  <template v-if="literalLangShow!==false">
    <LiteralLang v-model="literalLangShow" />
  </template>


  </splitpanes>


</template>


<script>

  import { Splitpanes, Pane } from 'splitpanes'
  import 'splitpanes/dist/splitpanes.css'
  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'


  import { mapStores, mapState, mapWritableState } from 'pinia'

  import utilsProfile from '@/lib/utils_profile';


  import Properties from "@/components/panels/sidebar_property/Properties.vue";
  import EditPanel from "@/components/panels/edit/EditPanel.vue";
  import Nav from "@/components/panels/nav/Nav.vue";
  import Opac from "@/components/panels/sidebar_preview_opac/Opac.vue";
  import Debug from "@/components/panels/edit/modals/DebugModal.vue";
  import Xml from "@/components/panels/sidebar_preview_xml/Xml.vue";
  import Marc from "@/components/panels/sidebar_preview_marc/Marc.vue";
  import LiteralLang from "@/components/panels/edit/modals/LiteralLang.vue";



  export default {
    components: { Splitpanes, Pane, Properties, EditPanel, Nav, Opac, Debug, Xml, Marc, LiteralLang },


    data() {
      return {

        test: 1,
        profileLoadedTimer: null,

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore,useProfileStore),
      ...mapState(usePreferenceStore, ['styleDefault','panelDisplay']),
      ...mapState(useProfileStore, ['profilesLoaded','activeProfileSaved']),


      ...mapWritableState(usePreferenceStore, ['showDebugModal']),

      ...mapWritableState(useProfileStore, ['literalLangGuid','literalLangShow','activeProfile']),

      // // gives read access to this.count and this.double
      // ...mapState(usePreferenceStore, ['profilesLoaded']),
    },
    watch: {
      // if this flips from false to true it means they are landing on this page so ask for the record from the backend
      profilesLoaded(newProfilesLoaded, oldProfilesLoaded) {
        if (oldProfilesLoaded == false && newProfilesLoaded == true){
          this.profileStore.loadRecordFromBackend(this.$route.params.recordId)
        }
      }
    },


    methods: {


      returnPixleAsPercent: function(pixles){
        return pixles/window.innerHeight*100
      },
      confirmLeaving (event) {

        if (this.activeProfileSaved == false){
          event.preventDefault()
          return false
        }

      }



    },


    mounted: function(){

      console.log("Mounted called", this.$route.params.action, this.$route.params.recordId )
      console.log(this.$route.params)
      if (this.profilesLoaded && this.activeProfile){

        if (this.activeProfile.neweId){
          // if they just created a new record then we should save the record to back end first thing so it is recorded
          this.profileStore.saveRecord()
          this.activeProfile.neweId = false
        }else if( this.$route.params.action && this.$route.params.action == 'load' ){
          // they are loading a record from the all record screen
          this.profileStore.loadRecordFromBackend(this.$route.params.recordId)
        }else{
          console.log("Should load record from backend now",this.$route.params.recordId)
          // otherwise they just got kicked over to the edit screen with an existing record id, load it from the back end to edit
          this.profileStore.loadRecordFromBackend(this.$route.params.recordId)
        }




      }



      // this.profileLoadedTimer = window.setInterval(()=>{

      //   if (this.activeProfile){
      //     window.clearInterval(this.profileLoadedTimer)
      //     if (this.activeProfile.neweId){
      //       console.log("New record just created.")
      //     }
      //   }


      // },100)

      // if (this.profilesLoaded){
      //   console.log('this.activeProfile', this.activeProfile)
      //   this.profileStore.loadRecordFromBackend(this.$route.params.recordId)
      // }else{
      //   // console.error("Somehow profiles are not loaded at this point")
      // }



    },
    created: function(){


      // this.profileStore.$subscribe(async (mutation, state)=>{
      //   console.log(state.profilesLoaded, Object.keys(state.activeProfile).length)

      //   if (state.profilesLoaded && Object.keys(state.activeProfile).length == 0){
      //     // the profilesLoaded flipped and there is no active profile, so load the data
      //     this.profileStore.loadRecordFromBackend(this.$route.params.recordId)
      //   }else{
      //     //console.error("profilesLoaded is never true, cannot load into data")
      //   }


      // }, { detached: true })



      window.addEventListener('beforeunload', this.confirmLeaving)




    },

    beforeRouteLeave (to, from , next) {
      if (this.activeProfileSaved == false){

        const answer = window.confirm('Do you really want to leave? you have unsaved changes!')
        if (answer) {
          next()
        } else {
          next(false)
        }

      }else{
        next()
      }


    }
  }

</script>
<style>
.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 2px;
  max-height: 2px;
  height: 2px;
  background-color: black !important;

}

.default-theme.splitpanes--horizontal>.splitpanes__splitter:before{
  width: 0;
  height: 0;
}
.default-theme.splitpanes--horizontal>.splitpanes__splitter:after{
  width: 0;
  height: 0;
}
</style>
<style scoped>


.header{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-background-color')") !important;

}

.edit-main-splitpane-properties{
    height: 100%;
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-background-color')") !important;
    overflow: scroll;
}

.edit-main-splitpane-opac{
    height: 100%;
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-background-color')") !important;

    overflow: scroll;
}
.edit-main-splitpane-xml{
    height: 100%;
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-background-color')") !important;

    overflow: scroll;
}
.edit-main-splitpane-marc{
    height: 100%;
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-background-color')") !important;

    overflow: scroll;
}





.edit-main-splitpane-no-scrollbar{
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* Internet Explorer 10+ */

}
.edit-main-splitpane-no-scrollbar::-webkit-scrollbar { /* WebKit */
    width: 0;
    height: 0;
}






.edit-main-splitpane-edit{
    height: 100%;
/*    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color')") !important;*/
    overflow-y: scroll;
}

.edit-main-splitpane-edit-no-scrollbar{
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* Internet Explorer 10+ */

}
.edit-main-splitpane-edit-no-scrollbar::-webkit-scrollbar { /* WebKit */
    width: 0;
    height: 0;
}









/*--c-edit-main-splitpane-properties-background-color*/



/*.splitpanes {

}
.splitpanes__pane {
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2) inset;
  justify-content: center;
  align-items: center;
  display: flex;
}
.splitpanes--vertical > .splitpanes__splitter {
  min-width: 17px;
  background: linear-gradient(90deg, #ccc, #111);
}
.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 17px;
  background: linear-gradient(#ccc, #111);
}*/
/*.splitpanes__pane {
  box-shadow: 0 0 3px rgba(0, 0, 0, .2) inset;
  justify-content: center;
  align-items: center;
  display: flex;
  position: relative;
}
*/

</style>
