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
            <EditPanel :instanceMode="false"/>
          </pane>
       
          <pane 
            :class="{'edit-main-splitpane-edit': true, 'edit-main-splitpane-edit-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-edit-no-scrollbar')}" 
            :size="preferenceStore.returnValue('--n-edit-main-splitpane-edit-width')">
            <EditPanel :instanceMode="true"/>
          </pane>




        </template>
        <template v-else>
          
            <pane 
              :class="{'edit-main-splitpane-edit': true, 'edit-main-splitpane-edit-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-edit-no-scrollbar')}" 
              :size="preferenceStore.returnValue('--n-edit-main-splitpane-edit-width')">
              <EditPanel :instanceMode="false"/>
            </pane>


        </template>


        <pane v-if="panelDisplay.opac"
          :class="{'edit-main-splitpane-opac': true, 'edit-main-splitpane-no-scrollbar': preferenceStore.returnValue('--b-edit-main-splitpane-opac-no-scrollbar')}" 
          :size="preferenceStore.returnValue('--n-edit-main-splitpane-opac-width')" 

        >
          <Opac/>
        </pane>

      </splitpanes>

    </pane>


  <template v-if="showDebugModal==true">
    <Debug v-model="showDebugModal" />
  </template>

  </splitpanes>


</template>


<script>

  import { Splitpanes, Pane } from 'splitpanes'
  import 'splitpanes/dist/splitpanes.css'
  import { usePreferenceStore } from '@/stores/preference'

  import { mapStores, mapState, mapWritableState } from 'pinia'

 

  import Properties from "@/components/panels/sidebar_property/Properties.vue";
  import EditPanel from "@/components/panels/edit/EditPanel.vue";
  import Nav from "@/components/panels/nav/Nav.vue";
  import Opac from "@/components/panels/sidebar_preview_opac/Opac.vue";
  import Debug from "@/components/panels/edit/modals/DebugModal.vue";



  export default {
    components: { Splitpanes, Pane, Properties, EditPanel, Nav, Opac, Debug },
    data() {
      return {
        color: 'blue',

      }
    },    
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapState(usePreferenceStore, ['styleDefault','panelDisplay']),
      ...mapWritableState(usePreferenceStore, ['showDebugModal']),


      // // gives read access to this.count and this.double
      // ...mapState(usePreferenceStore, ['profilesLoaded']),
    },

    methods: {


      returnPixleAsPercent: function(pixles){
        return pixles/window.innerHeight*100
      }



    },
    created: function(){

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
    overflow-y: scroll;
}

.edit-main-splitpane-opac{
    height: 100%;
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-background-color')") !important;
    
    overflow-y: scroll;
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
