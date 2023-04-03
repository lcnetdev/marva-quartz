<template>


  <div 
    v-for="profileName in this.activeProfile.rtOrder" 
    :key="profileName"
    :class="{'edit-panel-work': (profileName.split(':').slice(-1)[0] == 'Work')}">



    <template v-if="instanceMode == true && profileName.indexOf(':Instance') > -1">

      <div v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" 
          :key="profileCompoent">
        <div style="font-weight: bold">{{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}</div>
        <Main       
          :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" 
          :level="0"/>   
      </div>

    </template>
    <template v-if="instanceMode == false">
      
      <div v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" 
          :key="profileCompoent">
        <div style="font-weight: bold">{{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}</div>
        <Main       
          :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" 
          :level="0"/>   
      </div>


    </template>


  </div>

</template>


<script>

  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'
  import { mapStores, mapState } from 'pinia'


  // import Main from "@/components/panels/edit/fields/Main.vue";



  export default {
    components: {  },
    props: {

      instanceMode: Boolean,

    },
    data() {
      return {
        
      }
    },    
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapState(usePreferenceStore, ['styleDefault']),
      
      // gives read access to this.count and this.double
      // ...mapState(usePreferenceStore, ['profilesLoaded']),
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile']),



    },

    methods: {




    },


    created: function(){

    }

  }

</script>
<style scoped>


.edit-panel-work{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-work')") !important;

}


</style>
