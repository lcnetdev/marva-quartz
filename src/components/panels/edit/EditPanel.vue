<template>



  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === true">

      <div style="text-align: right;">
        <button @click="userActiveResourceName = profileName" v-for="profileName in this.activeProfile.rtOrder" :class="{'activeResourceButton': (activeResourceName === profileName)}">
          {{profileName.split(':').slice(-1)[0]}}
        </button>
      </div>

  </template>
  <div

    v-for="profileName in this.activeProfile.rtOrder"
    :key="profileName"
    :class="{'edit-panel-work': (profileName.split(':').slice(-1)[0] == 'Work'), 'edit-panel-instance': (profileName.split(':').slice(-1)[0] == 'Instance'), 'edit-panel-item': (profileName.split(':').slice(-1)[0].includes('Item')), 'edit-panel-instance-secondary': (profileName.split(':').slice(-1)[0].indexOf('_') > -1 && !profileName.split(':').slice(-1)[0].includes('Item')), 'edit-panel-scroll-x-parent': preferenceStore.returnValue('--b-edit-main-splitpane-edit-scroll-x')}">
          <template v-if="instanceMode == true && (profileName.indexOf(':Instance') > -1 || profileName.indexOf(':Item') > -1)">
          <template v-if="profileName.includes(':Instance')">
                <div>
                    <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                    <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Instance</button>
                </div>
          </template>
          <template v-if="profileName.includes(':Item')">
                <div>
                    <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                    <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Item</button>
                </div>
          </template>
            <template v-if="((preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === false) || (preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === true && profileName == activeResourceName ))">
                <div v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder"
                    :key="profileCompoent">
                  <template v-if="!preferenceStore.returnValue('--c-general-ad-hoc') || (layoutActive || (preferenceStore.returnValue('--c-general-ad-hoc') && profileStore.emptyComponents[profileName] && !profileStore.emptyComponents[profileName].includes(profileCompoent) ))">
                  <template v-if="!activeProfile.rt[profileName].pt[profileCompoent].deleted">
                    <template v-if="layoutActive == false || (layoutActive == true && layoutActiveFilter.properties.indexOf(activeProfile.rt[profileName].pt[profileCompoent].propertyURI) > -1) ">

                      <template v-if="(preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === true && activeProfile.rt[profileName].pt[profileCompoent].canBeHidden === false) || preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === false">
                        <div class="component-label 1" >
                            <input v-if="preferenceStore.copyMode && !activeProfile.rt[profileName].pt[profileCompoent].propertyLabel.includes('Admin')" type="checkbox" class="copy-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            <input v-if="createLayoutMode" type="checkbox" class="layout-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                        </div>
                        <Main
                          :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']"
                          :level="0"
                          :id="activeProfile.rt[profileName].pt[profileCompoent].id"
                          :parentId="activeProfile.rt[profileName].pt[profileCompoent].parentId"
                          :readOnly="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])" />
                      </template>
                    </template>
                  </template>

                  </template>
                </div>
            </template>


          </template>
      <template v-if="instanceMode == false">
        <template v-if="profileName.includes(':Instance') && !this.dualEdit">
            <div class="instanceInfoWrapper">
                <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Instance</button>
            </div>
        </template>

        <template v-if="profileName.includes(':Item') && !this.dualEdit">
            <div class="instanceInfoWrapper">
                <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Item</button>
            </div>
        </template>

        <template v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" :key="profileCompoent">

          <template v-if="layoutActive == false || (layoutActive == true && layoutActiveFilter.properties.indexOf(activeProfile.rt[profileName].pt[profileCompoent].propertyURI) > -1) ">

            <template v-if="!hideProps.includes(activeProfile.rt[profileName].pt[profileCompoent].propertyURI)">

              <template v-if="(preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === true && activeProfile.rt[profileName].pt[profileCompoent].canBeHidden === false) || preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === false">

                <template v-if="((preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === false) || (preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === true && profileName == activeResourceName ))">

                  <template v-if="!activeProfile.rt[profileName].pt[profileCompoent].deleted">
                    <div v-if="!preferenceStore.returnValue('--c-general-ad-hoc') || (layoutActive || (preferenceStore.returnValue('--c-general-ad-hoc') && !profileStore.emptyComponents[profileName].includes(profileCompoent)))" :class="{ 'inline-mode' : (preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')), 'edit-panel-scroll-x-child': preferenceStore.returnValue('--b-edit-main-splitpane-edit-scroll-x'), 'read-only': isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])}">
                      <template v-if="this.dualEdit == false">
                        <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false && preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == false">
                          <div class="component-label 2" >
                            <input v-if="preferenceStore.copyMode && !activeProfile.rt[profileName].pt[profileCompoent].propertyLabel.includes('Admin')" type="checkbox" class="copy-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            <input v-if="createLayoutMode" type="checkbox" class="layout-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                            <span v-if="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])"> (HISTORICAL - READ ONLY) <a style="color:black" href="#" @click="showDebug($event,activeProfile.rt[profileName].pt[profileCompoent])">debug</a></span>
                          </div>
                        </template>
                    </template>
                    <template v-if="this.dualEdit == true">
                        <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false && preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == false && (profileName.indexOf(':Instance') == -1 && profileName.indexOf(':Item') == -1 )">
                          <div class="component-label 3" >
                          <input v-if="preferenceStore.copyMode && !activeProfile.rt[profileName].pt[profileCompoent].propertyLabel.includes('Admin')" type="checkbox" class="copy-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                          <input v-if="createLayoutMode" type="checkbox" class="layout-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                          {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                            <span v-if="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])"> (HISTORICAL - READ ONLY) <a style="color:black" href="#" @click="showDebug($event,activeProfile.rt[profileName].pt[profileCompoent])">debug</a></span>
                          </div>
                        </template>
                    </template>

                      <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')">
                        <div v-if="profileName.split(':').slice(-1)[0] == 'Work'" class="inline-mode-resource-color-work">&nbsp;</div>
                        <div v-if="profileName.indexOf(':Instance') > -1 && profileName.indexOf(':Item') == -1" class="inline-mode-resource-color-instance">&nbsp;</div>
                        <button @mouseenter="inlineRowButtonMouseEnter" :class="{'inline-mode-mian-button': true, 'inline-mode-mian-button-has-ref' : profileStore.ptHasRefComponent(activeProfile.rt[profileName].pt[profileCompoent]) }"></button>
                      </template>

                      <!-- index == -1 means it's the work, so just add the work -->
                      <Main v-if="profileName.indexOf(':Instance') == -1 && profileName.indexOf(':Item') == -1"
                        :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']"
                        :level="0"
                        :id="activeProfile.rt[profileName].pt[profileCompoent].id"
                        :parentId="activeProfile.rt[profileName].pt[profileCompoent].parentId"
                        :readOnly="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])" />

                      <!-- If it's not in dual mode add the instances too -->
                      <Main v-if="this.dualEdit == false && (profileName.indexOf(':Instance') > -1 || profileName.indexOf(':Item') > -1)"
                        :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']"
                        :level="0"
                        :id="activeProfile.rt[profileName].pt[profileCompoent].id"
                        :parentId="activeProfile.rt[profileName].pt[profileCompoent].parentId"
                        :readOnly="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])" />

                          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')">
                            <InlineModeAddField :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                          </template>

                      </div>
                    </template>
                  </template>
                </template>
              </template>
            </template>
        </template>
      </template>




      <select style="margin-left:40px; margin-bottom:0px" @change="addProperty($event,profileName)" v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === true">
        <option value="home" selected>Add Property</option>
        <template v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder">
          <option :value="profileCompoent" v-if="activeProfile.rt[profileName].pt[profileCompoent].canBeHidden == true" >{{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}</option>
        </template>
      </select>
  </div>

</template>


<script>

  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'
  import { mapStores, mapState, mapWritableState } from 'pinia'

  import InlineModeAddField from "@/components/panels/edit/fields/helpers/InlineModeAddField.vue";



  // import Main from "@/components/panels/edit/fields/Main.vue";



  export default {
    components: {InlineModeAddField  },
    props: {

      instanceMode: Boolean,
      dualEdit: Boolean,

    },
    data() {
      return {
        userActiveResourceName: null,
        hideProps:[
          'http://id.loc.gov/ontologies/bibframe/hasInstance',
          'http://id.loc.gov/ontologies/bibframe/instanceOf',
          'http://id.loc.gov/ontologies/bibframe/hasItem'
        ]

      }
    },
    computed: {
      // other computed properties
      // ...
      ...mapStores(usePreferenceStore),
      ...mapStores(useProfileStore),


      ...mapState(usePreferenceStore, ['styleDefault', 'layoutActive', 'layoutActiveFilter', 'createLayoutMode']),

      // gives read access to this.count and this.double
      // ...mapState(usePreferenceStore, ['profilesLoaded']),
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','activeComponent', 'dataChanged']),
      ...mapWritableState(usePreferenceStore, ['debugModalData','showDebugModal']),
      ...mapWritableState(useProfileStore, ['emptyComponents']),

      activeResourceName(){

        if (this.userActiveResourceName===null){
          if (this.activeProfile && this.activeProfile.rtOrder){
            return this.activeProfile.rtOrder[0]
          }
        }else{
          return this.userActiveResourceName
        }

      },


    },

    methods: {


        showDebug: function(event,data){


          this.debugModalData= this.profileStore.returnStructureByComponentGuid(data['@guid']);
          this.showDebugModal=true

          event.preventDefault()
          return false

        },

        isReadOnly: function(component){

          if (component.adminMetadataType && component.adminMetadataType == 'secondary'){
            return true
          }

          return false

        },

        inlineRowButtonMouseEnter: function(event){
          console.log(event)

        },

        addProperty: function(event,profile){


          this.profileStore.setPropertyVisible(profile,event.target.value)
          event.target.value = "home"
        },


        getBibId: function(){
            for (let rt in this.activeProfile.rt){
              let type = rt.split(':').slice(-1)[0]
              let url = this.activeProfile.rt[rt].URI

              // populate the title
              if (type=='Instance'){
                let bibId =  url.split("/")[url.split('/').length - 1]
                return bibId
              }
            }

            return false
        },

        //Add the BibId to the title
        populateTitle: function(){
            let eId = this.activeProfile.eId
            let bibId = this.getBibId()

            if (bibId && eId != bibId){
                document.title = `Marva | ${bibId}`;
            }
        },

        //only able to delete the instances they create
        showDeleteInstanceButton: function(profileName){
          //return this.activeProfile.rt[profileName].deletable // this property is removed when the record is saved
          return true
        },

        showDeleteInstanceModal: function(profileName){
          let resourceType = profileName.includes("Item") ? "Item" : "Instance"
            if (window.confirm("Do you really want to delete this " + resourceType + "?")){
                // remove from rtOrder
                const targetIndex = this.activeProfile.rtOrder.indexOf(profileName)
                this.activeProfile.rtOrder.splice(targetIndex, 1)

                // Remove from ad hoc
                if (Object.keys(this.emptyComponents).includes(profileName)){
                  delete this.emptyComponents[profileName]
                }

                // remove the profile
                delete this.activeProfile.rt[profileName]
                this.profileStore.dataChanged()
            }
        },

        instanceLabel: function(profileName){
          if (profileName.includes(":Item")){
            return "Item"
          }
          try{
              if (this.activeProfile.rt[profileName]["@type"].includes("Secondary")){
                  return "Secondary Instance"
              }
              return "Instance"
          } catch(err){
              return "Instance"
          }
        }
    },

    watch:{

      activeComponent(newVal){



            this.$nextTick(() => {
              window.setTimeout(()=> {
                document.getElementById(`edit_${newVal.parentId}_${newVal.id}`).scrollIntoView({behavior: "smooth", block:"start"});


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


    mounted: function(){
        //populate when loading from a search
        this.populateTitle()
    },

    updated: function(){
        let bibId = this.getBibId()
		// Add the ID to the title when loading from "Your Records"

        if (!document.title.includes(bibId)){
            this.populateTitle()
        }
    }

  }

</script>
<style scoped>


.read-only{
  padding-left: 2em;
}
.edit-panel-scroll-x-parent{
  overflow-x: scroll;
}
.edit-panel-scroll-x-child{
  width:1500px;
}



.activeResourceButton{
  background-color: skyblue;
}
.inline-mode-resource-color-work{
  display: inline-block;
  width: 5px;
  margin-right: 5px;
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-work')");
  content: ' ';
}
.inline-mode-resource-color-instance{
  display: inline-block;
  width: 5px;
  margin-right: 5px;
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance')");
  content: ' ';
}
.inline-mode-mian-button{
  height: 15px;
  background-color: transparent;
  border: solid 1px #dcdcdc;
  margin-right: 19px;
}

.inline-mode-mian-button-has-ref{
  margin-right: 0;
}
.inline-mode-mian-button:hover{
  background-color: cornflowerblue;
  cursor: pointer;
}
.inline-mode{
  background-color: white;
  border-top: solid 1px whitesmoke;
}

.edit-panel-work{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-work')") !important;
}

.edit-panel-instance{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance')") !important;
}
.edit-panel-item{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-item')") !important;
}
.edit-panel-instance-secondary{

  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance-secondary')") !important;

}

.component-label{
  font-size: 0.85em;
}

div.instanceInfoWrapper {
    padding: 5px;
}

.instanceIdentifer {
    font-weight: bold;
}

.instanceDeleteButton {
    float: right;
    margin-right: 5px;
}


</style>
