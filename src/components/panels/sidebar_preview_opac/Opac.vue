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

      returnTemplateTypes: function(templates){

          let titles = []
          for (let t of templates){
              if (this.rtLookup[t] && this.rtLookup[t].resourceLabel){
                  titles.push(this.rtLookup[t].resourceLabel)
              }
          }
          
          return titles


      },


      buildDisplayObjects: function(userValue){


        let ignore = [
          'http://id.loc.gov/ontologies/bflc/aap-normalized',
          'http://www.loc.gov/mads/rdf/v1#isMemberOfMADSScheme',
        ]

        let results = []

        console.log('userValueuserValueuserValueuserValue',userValue)
        for (let k1 in userValue){

          if (!k1.startsWith('@')){

            for (let value of userValue[k1]){
              let textAdded = []
              let toAdd = {
                uri: null,
                label: [],
                children:[]
              }

              for (let k2 in value){
                console.log('doing k2',k2)

                if (k2 == '@id'){
                  toAdd.uri = value['@id']
                }
                else if (k2.startsWith('@')){
                  // do nothing if not id
                  console.log('@')
                }
                else if (ignore.includes(k2)){
                  // do nothing
                  console.log('ignore')
                }
                else{
                  console.log('value[k2]',value[k2])
                  if (Array.isArray(value[k2])){
                    console.log('is arrat')
                    for (let value2 of value[k2]){
                      console.log('value2',value2, 'k2',k2)
                      //if there is a literal value with the same property then possibly add that
                      if (value2[k2]){
                        console.log("yeah", value2[k2])
                        if (!textAdded.includes(value2[k2])){
                          textAdded.push(value2[k2])
                          toAdd.label.push(value2[k2])
                        }
                      }


                    }

                  }else{
                    // what is it?
                  }


                }

              }


              console.log('toAdd',toAdd)
              if (toAdd.uri!== null || toAdd.label.length>0){
                results.push(toAdd)
              }
            }

          }


        }

        return results

      }




    },

    mounted() {
     


    }
  }



</script>

<template>


  <div v-for="profileName in activeProfile.rtOrder" class="sidebar" :key="profileName">

      <div v-if="activeProfile.rt[profileName].noData != true">
          <div :class="{'container-type-icon': true, 'sidebar-spacer': (profileName.split(':').slice(-1)[0] == 'Instance' || profileName.split(':').slice(-1)[0] == 'Item')}">
                  <svg v-if="profileName.split(':').slice(-1)[0] == 'Work'" width="1.5em" height="1.1em" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <circle :fill="preferenceStore.returnValue('--c-general-icon-work-color')" cx="0.55em" cy="0.6em" r="0.45em"/>
                  </svg>
                  <svg v-if="profileName.includes('Instance')" :fill="preferenceStore.returnValue('--c-general-icon-instance-color')" width="20px" height="20px" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                   <path  d="m5 50l45-45 45 45-45 45z"/>
                  </svg>
                  <svg v-if="profileName.includes(':Item')"  viewBox="0 -32 50 72" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40px" height="40px" class="item-icon" />
                  </svg>
                  <svg  v-if="profileName.endsWith(':Hub')" version="1.1" viewBox="0 -20 100 100" xmlns="http://www.w3.org/2000/svg">
                    <path fill="royalblue" d="m62.113 24.66 1.9023-15.238 18.875 32.691-7.5469 20.004 15.238 1.9023-32.691 18.875-20.004-7.5469-1.9023 15.238-18.875-32.691 7.5469-20.004-15.238-1.9023 32.691-18.875zm-17.684 15.695-4.0781 15.215 15.215 4.0781 4.0781-15.215z" fill-rule="evenodd"/>
                  </svg>                        
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Work'">{{$t("message.wordWork")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Instance'">{{$t("message.wordInstance")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Item'">{{$t("message.wordItem")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Hub'">{{$t("message.wordHub")}}</span>
          </div>

      </div>

      <ul class="sidebar-opac-ul" role="list">
          <template  v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" :key="profileCompoent">
              <li v-if="activeProfile.rt[profileName].pt[profileCompoent].hasData"  @click.stop="activeComponent = activeProfile.rt[profileName].pt[profileCompoent]"  class="sidebar-opac-li sidebar-opac-li-empty" >
                    <a style="font-size:0.95em" href="#" @click.stop="activeComponent = activeProfile.rt[profileName].pt[profileCompoent]" class="sidebar-property-ul-alink">
                        {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                    </a>
                    <div style="padding-left:0.4em; font-size:0.85em; margin-bottom:0.5em" v-for="value in buildDisplayObjects(activeProfile.rt[profileName].pt[profileCompoent].userValue)">
                        
                        <template v-if="value.uri !== null">
                          <a :href="value.uri" target="_blank">
                            <span v-for="l in value.label">{{l}}</span>
                          </a>
                        </template>
                        <template v-else>
                          <span v-for="l in value.label">{{l}}</span>

                        </template>

                    </div>
            </li>
          </template>
        </ul>


  <!-- 
      <div v-if="activeProfile.rt[profileName].noData != true">
          <div :class="{'container-type-icon': true, 'sidebar-spacer': (profileName.split(':').slice(-1)[0] == 'Instance' || profileName.split(':').slice(-1)[0] == 'Item')}">
                  <svg v-if="profileName.split(':').slice(-1)[0] == 'Work'" width="1.5em" height="1.1em" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <circle :fill="preferenceStore.returnValue('--c-general-icon-work-color')" cx="0.55em" cy="0.6em" r="0.45em"/>
                  </svg>
                  <svg v-if="profileName.includes('Instance')" :fill="preferenceStore.returnValue('--c-general-icon-instance-color')" width="20px" height="20px" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                   <path  d="m5 50l45-45 45 45-45 45z"/>
                  </svg>
                  <svg v-if="profileName.includes(':Item')"  viewBox="0 -32 50 72" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40px" height="40px" class="item-icon" />
                  </svg>
                  <svg  v-if="profileName.endsWith(':Hub')" version="1.1" viewBox="0 -20 100 100" xmlns="http://www.w3.org/2000/svg">
                    <path fill="royalblue" d="m62.113 24.66 1.9023-15.238 18.875 32.691-7.5469 20.004 15.238 1.9023-32.691 18.875-20.004-7.5469-1.9023 15.238-18.875-32.691 7.5469-20.004-15.238-1.9023 32.691-18.875zm-17.684 15.695-4.0781 15.215 15.215 4.0781 4.0781-15.215z" fill-rule="evenodd"/>
                  </svg>                        
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Work'">{{$t("message.wordWork")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Instance'">{{$t("message.wordInstance")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Item'">{{$t("message.wordItem")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Hub'">{{$t("message.wordHub")}}</span>
          </div>

         


      </div> -->
  </div>



</template>

<style scoped>
.sidebar{
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size')");
}


.container-type-icon{
  color: #ffffff; 
  width: inherit; 
  text-align: left;  
  display: flex;
}


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
