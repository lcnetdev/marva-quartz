<script>
  import { useProfileStore } from '@/stores/profile'
  import { usePreferenceStore } from '@/stores/preference'

  import { mapStores, mapState, mapWritableState } from 'pinia'

  export default {
    data() {
      return {
        
      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,usePreferenceStore),
      // // gives read access to this.count and this.double
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','rtLookup', 'activeComponent']),
      ...mapState(usePreferenceStore, ['styleDefault']),

      ...mapWritableState(useProfileStore, ['activeComponent']),


    },


    methods: {





    },

    mounted() {
     


    }
  }



</script>

<template>




</template>

<style scoped>





.sidebar-header-text{  
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size', true) + 0.25  + 'em'");
  font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-family')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;

}

.sidebar-opac-ul{

/*  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");*/
  margin-left: 0;
  padding-left: 0;
  font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-family')");
}
.sidebar-opac-li{
  cursor: pointer;
  padding-left: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size', true) / 2  + 'em'");
  list-style: none;
}

.sidebar-opac-li-value{
  padding-left:0.4em; 
  font-size:0.85em; 
  margin-bottom:0.5em;
}

.sidebar-opac-li-value a{

  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;

}
.sidebar-opac-li-value-text{
  font-weight:bold;
}

.sidebar-property-li:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-highlight-background-color')");
}

.sidebar-property-li-empty::before{
  content: "• ";
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-empty-indicator-color')") !important;

}

.sidebar-property-ul-alink{
  text-decoration: none;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;

}

.sidebar-property-ul-sub-ul{
  padding-left: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size', true) / 1  + 'em'");
}

.sidebar-property-li-sub-li::before{
  content: "\200B";

}
.sidebar-property-ul-alink-sublink{
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size', true) - 0.15  + 'em'") !important;
/*    font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");*/

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
