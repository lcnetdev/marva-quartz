<template>


  <div 
    v-for="profileName in this.activeProfile.rtOrder" 
    :key="profileName"
    :class="{'edit-panel-work': (profileName.split(':').slice(-1)[0] == 'Work')}">



    <template v-if="instanceMode == true && profileName.indexOf(':Instance') > -1">

      <div v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" 
          :key="profileCompoent">
        <div class="component-label" >{{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}</div>
        <Main       
          :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" 
          :level="0"
          :id="activeProfile.rt[profileName].pt[profileCompoent].id"
          :parentId="activeProfile.rt[profileName].pt[profileCompoent].parentId"/>   
      </div>

    </template>
    <template v-if="instanceMode == false">
      
      <div v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" 
          :key="profileCompoent">

        <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false">
          <div class="component-label" >{{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}</div>
        </template>
        
        <Main       
          :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" 
          :level="0"
          :id="activeProfile.rt[profileName].pt[profileCompoent].id"
          :parentId="activeProfile.rt[profileName].pt[profileCompoent].parentId"/>   

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
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','activeComponent']),



    },

    watch:{

      activeComponent(newVal){

        console.log(newVal)

        console.log(document.getElementById('edit_' + newVal.id))


            this.$nextTick(() => {
              window.setTimeout(()=> {
                document.getElementById(`edit_${newVal.parentId}_${newVal.id}`).scrollIntoView({behavior: "smooth", block:"start"});
                console.log(document.getElementById(`edit_${newVal.parentId}_${newVal.id}`))

                document.getElementById(`edit_${newVal.parentId}_${newVal.id}`).querySelector('input,textarea').focus()

                for (let el of document.getElementById(`edit_${newVal.parentId}_${newVal.id}`).querySelectorAll('input,textarea')){
                  el.style.transition = "background 500ms"
                  el.style.background='yellow'
                }
                window.setTimeout(()=> {
                  for (let el of document.getElementById(`edit_${newVal.parentId}_${newVal.id}`).querySelectorAll('input,textarea')){
                    el.style.background='transparent'
                  }
                },500);


              },10);             
            });



      }


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

.component-label{
  font-size: 0.85em;
}



</style>
