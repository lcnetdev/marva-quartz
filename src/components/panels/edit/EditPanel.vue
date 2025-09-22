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
    :class="{'edit-panel-work': (profileName.split(':').slice(-1)[0] == 'Work'), 'edit-panel-instance': (profileName.split(':').slice(-1)[0] == 'Instance'), 'edit-panel-hub': (profileName.split(':').slice(-1)[0] == 'Hub'), 'edit-panel-item': (profileName.split(':').slice(-1)[0].includes('Item')), 'edit-panel-instance-secondary': (profileName.split(':').slice(-1)[0].indexOf('_') > -1 && !profileName.split(':').slice(-1)[0].includes('Item')), 'edit-panel-scroll-x-parent': preferenceStore.returnValue('--b-edit-main-splitpane-edit-scroll-x')}">
          <template v-if="instanceMode == true && (profileName.indexOf(':Instance') > -1 || profileName.indexOf(':Item') > -1)">
          <template v-if="profileName.includes(':Instance') && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName)))">
                <div>
                    <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                    <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Instance?</button>
                </div>
          </template>
          <template v-if="profileName.includes(':Item') && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName)))">
                <div>
                    <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                    <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Item</button>
                </div>
          </template>
            <template v-if="((preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === false) || (preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === true && profileName == activeResourceName ) )">
                <div v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder"
                    :key="profileCompoent">
                  <template v-if="(!preferenceStore.returnValue('--c-general-ad-hoc') || (createLayoutMode && !layoutActive)) || (layoutActive || (preferenceStore.returnValue('--c-general-ad-hoc') && profileStore.emptyComponents[profileName] && !profileStore.emptyComponents[profileName].includes(profileCompoent) ))">
                  <template v-if="!activeProfile.rt[profileName].pt[profileCompoent].deleted && !hideAdminField(activeProfile.rt[profileName].pt[profileCompoent], profileName)">
                    <template v-if="(createLayoutMode && layoutActive) || layoutActive == false || (layoutActive == true && layoutActiveFilter.properties[profileName] && includeInLayout(activeProfile.rt[profileName].pt[profileCompoent].id, layoutActiveFilter['properties'][profileName])) ">

                      <template v-if="(preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === true && activeProfile.rt[profileName].pt[profileCompoent].canBeHidden === false) || preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === false">
                        <div class="component-label 1" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold')}">
                            <input v-if="!createLayoutMode && preferenceStore.copyMode && !activeProfile.rt[profileName].pt[profileCompoent].propertyLabel.includes('Admin')" type="checkbox" class="copy-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            <input v-if="createLayoutMode" type="checkbox" class="layout-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}

                            <div class="icon-container">
                              <span v-if="!profileCompoent.includes('adminmetadata') && !profileCompoent.includes('instanceOf') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')" :class="['material-icons','inline-icon', {'work': profileName.includes('Work'), 'instance': profileName.includes('Instance'), 'item': profileName.includes('Item'),}]" @click="removeComponent(profileName, profileCompoent)">delete</span>
                              <span v-if="!profileCompoent.includes('adminmetadata') && !profileCompoent.includes('instanceOf') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')" :class="['material-icons','inline-icon', {'work': profileName.includes('Work'), 'instance': profileName.includes('Instance'), 'item': profileName.includes('Item'),}]" @click="addComponent(profileName, profileCompoent)">add</span>
                            </div>

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
        <template v-if="profileName.includes(':Instance') && !this.dualEdit && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName)))">
            <div class="instanceInfoWrapper">
                <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Instance!</button>
            </div>
        </template>

        <template v-if="profileName.includes(':Item') && !this.dualEdit && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName)))">
            <div class="instanceInfoWrapper">
                <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Item</button>
            </div>
        </template>


        <template v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" :key="profileCompoent">
          <!-- <template v-if="(displaySubject(activeProfile.rt[profileName].pt[profileCompoent]))"> -->
          <!-- <template v-if="!preferenceStore.returnValue('--b-edit-main-hide-non-lc') || ( preferenceStore.returnValue('--b-edit-main-hide-non-lc') && profileStore.hiddenComponents[profileName] && !profileStore.hiddenComponents[profileName].includes(profileCompoent)  )"> -->
          <template v-if="true">
            <template v-if="(createLayoutMode && layoutActive) || layoutActive == false || (layoutActive == true && layoutActiveFilter.properties[profileName] && includeInLayout(activeProfile.rt[profileName].pt[profileCompoent].id, layoutActiveFilter['properties'][profileName])) ">
              <template v-if="activeProfile.rt[profileName].pt[profileCompoent] && !hideProps.includes(activeProfile.rt[profileName].pt[profileCompoent].propertyURI)">

                <template v-if="(preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === true && activeProfile.rt[profileName].pt[profileCompoent].canBeHidden === false) || preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') === false">

                  <template v-if="((preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === false) || (preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === true && profileName == activeResourceName ))">

                    <template v-if="!activeProfile.rt[profileName].pt[profileCompoent].deleted && !hideAdminField(activeProfile.rt[profileName].pt[profileCompoent], profileName)">
                      <!-- if createLayoutMode is active, and there is an active layout, show everything -->
                      <div v-if="(!preferenceStore.returnValue('--c-general-ad-hoc') || (createLayoutMode && !layoutActive)) || (layoutActive || (preferenceStore.returnValue('--c-general-ad-hoc') && !profileStore.emptyComponents[profileName].includes(profileCompoent)))" :class="{ 'inline-mode' : (preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')), 'edit-panel-scroll-x-child': preferenceStore.returnValue('--b-edit-main-splitpane-edit-scroll-x'), 'read-only': isReadOnly(activeProfile.rt[profileName].pt[profileCompoent]), 'hide-component': preferenceStore.returnValue('--b-edit-main-hide-non-lc') && activeProfile.rt[profileName].pt[profileCompoent].hideSubject}">
                        <template v-if="this.dualEdit == false">
                          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false && preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == false">
                            <div class="component-label 2" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold')}">
                              <input v-if="!createLayoutMode && preferenceStore.copyMode && !activeProfile.rt[profileName].pt[profileCompoent].propertyLabel.includes('Admin')" type="checkbox" class="copy-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                              <input v-if="createLayoutMode" type="checkbox" class="layout-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" :value="profileName" :checked="layoutActiveFilter && layoutActiveFilter['properties'][profileName] && includeInLayout(activeProfile.rt[profileName].pt[profileCompoent].id, layoutActiveFilter['properties'][profileName])" />
                              {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                              <span v-if="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])"> (HISTORICAL - READ ONLY) <a style="color:black" href="#" @click="showDebug($event,activeProfile.rt[profileName].pt[profileCompoent])">debug</a></span>

                              <div class="icon-container">
                                <span v-if="preferenceStore.returnValue('--b-edit-main-hide-non-lc') && !displaySubject(activeProfile.rt[profileName].pt[profileCompoent])" class="material-icons inline-icon preview" @click="activeProfile.rt[profileName].pt[profileCompoent].hideSubject=!activeProfile.rt[profileName].pt[profileCompoent].hideSubject">preview</span>
                                <span v-if="!profileCompoent.includes('adminmetadata') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')" :class="['material-icons','inline-icon', {'work': profileName.includes('Work'), 'instance': profileName.includes('Instance'), 'item': profileName.includes('Item'),}]" @click="removeComponent(profileName, profileCompoent)">delete</span>
                                <span v-if="!profileCompoent.includes('adminmetadata') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')" :class="['material-icons','inline-icon', {'work': profileName.includes('Work'), 'instance': profileName.includes('Instance'), 'item': profileName.includes('Item'),}]" @click="addComponent(profileName, profileCompoent)">add</span>
                              </div>

                            </div>

                          </template>
                      </template>
                      <template v-if="this.dualEdit == true">
                          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false && preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == false && (profileName.indexOf(':Instance') == -1 && profileName.indexOf(':Item') == -1 )">
                            <div class="component-label 3" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold')}">
                            <input v-if="!createLayoutMode && preferenceStore.copyMode && !activeProfile.rt[profileName].pt[profileCompoent].propertyLabel.includes('Admin')" type="checkbox" class="copy-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            <input v-if="createLayoutMode" type="checkbox" class="layout-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                              <span v-if="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])"> (HISTORICAL - READ ONLY) <a style="color:black" href="#" @click="showDebug($event,activeProfile.rt[profileName].pt[profileCompoent])">debug</a></span>

                              <div class="icon-container">
                                <span v-if="!profileCompoent.includes('adminmetadata') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')" :class="['material-icons','inline-icon', {'work': profileName.includes('Work'), 'instance': profileName.includes('Instance'), 'item': profileName.includes('Item'),}]" @click="removeComponent(profileName, profileCompoent)">delete</span>
                                <span v-if="!profileCompoent.includes('adminmetadata') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')" :class="['material-icons','inline-icon', {'work': profileName.includes('Work'), 'instance': profileName.includes('Instance'), 'item': profileName.includes('Item'),}]" @click="addComponent(profileName, profileCompoent)">add</span>
                              </div>

                            </div>
                          </template>
                      </template>

                        <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')">
                          <div v-if="profileName.split(':').slice(-1)[0] == 'Work'" class="inline-mode-resource-color-work">&nbsp;</div>
                          <div v-if="profileName.indexOf(':Instance') > -1 && profileName.indexOf(':Item') == -1" class="inline-mode-resource-color-instance">&nbsp;</div>
                          <template v-if="profileStore.cammModeErrors[activeProfile.rt[profileName].pt[profileCompoent]['@guid']]">

                            <span :class="{'material-icons' : true, 'inline-mode-error-icon': true, 'simptip-position-right':true, 'inline-mode-mian-button-has-ref' : profileStore.ptHasRefComponent(activeProfile.rt[profileName].pt[profileCompoent])}" @click="showErrors(activeProfile.rt[profileName].pt[profileCompoent]['@guid'])">warning</span>

                          </template>
                          <template v-else>
                            <button @mouseenter="inlineRowButtonMouseEnter" :class="{'inline-mode-mian-button': true, 'inline-mode-mian-button-has-ref' : profileStore.ptHasRefComponent(activeProfile.rt[profileName].pt[profileCompoent]) }"></button>
                          </template>

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
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','activeComponent', 'dataChanged', 'returnComponentLibrary', 'displaySubject']),
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
        addComponent: function(profileName, profileCompoent){
          let guid = this.activeProfile.rt[profileName].pt[profileCompoent]['@guid']
          let structure = this.activeProfile.rt[profileName].pt[profileCompoent]
          this.profileStore.duplicateComponent(guid, structure)
          // this.sendFocusHome()
        },

        removeComponent: function(profileName, profileCompoent){
          let guid = this.activeProfile.rt[profileName].pt[profileCompoent]['@guid']
          this.profileStore.deleteComponent(guid)
        },

        showErrors(guid){

          console.log(guid)
          let msg = this.profileStore.cammModeErrors[guid].join("\n")
          alert(msg)


        },

        showDebug: function(event,data){


          this.debugModalData= this.profileStore.returnStructureByComponentGuid(data['@guid']);
          this.showDebugModal=true

          event.preventDefault()
          return false

        },

        // Whether or not a component that isn't explicitly in that layout should be included
        // this is important for adding components when a layout is open
        includeInLayout: function(checkId, targets){
          if (!targets){ return false }
          if (targets.includes(checkId)){ return true}
          //otherwise, get the base of the checkId to compare
          let breakPoint = checkId.lastIndexOf("_")
          let base = checkId.slice(0, breakPoint)
          if (targets.includes(base)){ return true}

          return false

        },

        isReadOnly: function(component){
          if (component.adminMetadataType && component.adminMetadataType == 'secondary'){
            return true
          }

          if (component.propetyLabel == 'Local identifier'){
            return true
          }

          return false

        },

        //We only want the editable admin field under instances to show up
        // Don't show READONLY ADMIN fields in the instance, Don't show any admin fields in the work
        hideAdminField: function(component, profileName){
          let readOnly = this.isReadOnly(component)
          let isWork = profileName.includes(':Work')
          let isAdminField = component.propertyURI.includes('adminMetadata')

          return (readOnly) || (isWork && isAdminField )
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
                },1000);


              },10);
            });



      }


    },


    mounted: function(){
        //populate when loading from a search
        this.populateTitle()
        this.profileStore.useCustomComponentOrder()
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

.inline-mode-error-icon{
  font-size: 16px;
  color:red;
  animation-name: grow;
  animation-duration: 1s;
  animation-iteration-count: infinite;
  z-index: 1000;
  margin-right: 17px;
}

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

.edit-panel-hub{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance')") !important;
  padding-bottom: 5em;
}

.edit-panel-instance{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance')") !important;
  padding-bottom: 5em;
}
.edit-panel-item{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-item')") !important;
}
.edit-panel-instance-secondary{

  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance-secondary')") !important;

}

.component-label{
  font-size: 0.85em;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
}
.label-bold{
  font-weight: bold;
}

div.instanceInfoWrapper {
    padding: 5px;
}

.instanceIdentifer {
    font-weight: bold;
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");

}

.instanceDeleteButton {
    float: right;
    margin-right: 5px;
}

.inline-icon {
  font-size: 1.25em;
  cursor: pointer;
  margin-right: 15px;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  opacity: .4;
}

.inline-icon.work:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-work')");
}

.inline-icon.instance:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance')");
}

.inline-icon.item:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-item')");
}

.icon-container{
  float: right;
}
.preview {
  font-size: 1.2em;
}
.hide-component {
  margin-bottom: 4px;
}
.hide-component > *:not(:first-child) {
  display: none;
}



@keyframes grow {
    from {
        transform: scale(1);
    }
    to {
        transform: scale(1.5);
    }
}


</style>
