<template>


  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === true && !switchInBanner">

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
          <template v-if="panelInstanceMode == true && (profileName.indexOf(':Instance') > -1 || profileName.indexOf(':Item') > -1)">
          <template v-if="profileName.includes(':Instance') && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName))) && showResourceBanner(profileName)">
                <div class="instanceInfoWrapper" :title="instanceOfWork(profileName) ? 'Instance of: ' + instanceOfWork(profileName) : null">
                    <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                    <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Instance</button>
                </div>
          </template>
          <template v-if="profileName.includes(':Item') && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName))) && showResourceBanner(profileName)">
                <div class="instanceInfoWrapper">
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
                        <div class="component-label 1" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold'), 'component-label-instance-of': profileCompoent.includes('instanceOf')}">
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
      <template v-if="panelInstanceMode == false">
        <template v-if="profileName.includes(':Work') && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName))) && showResourceBanner(profileName)">
            <div class="instanceInfoWrapper">
                <span class="instanceIdentifer">Work: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                <label v-if="switchInBanner" class="resource-switch" title="Switch Resource">
                    <span class="material-icons">swap_horiz</span>
                    <span class="resource-switch-label">Switch Resource</span>
                    <span class="material-icons resource-switch-arrow">expand_more</span>
                    <select @change="switchResource($event)" aria-label="Switch Resource">
                        <option value="" disabled selected>Switch Resource</option>
                        <option v-for="switchName in activeProfile.rtOrder" :key="switchName" :value="switchName" :disabled="switchName == activeResourceName">{{ resourceTypeLabel(switchName) }}: {{ activeProfile.rt[switchName].URI.split("/").at(-1) }}</option>
                    </select>
                </label>
            </div>
        </template>
        <template v-if="profileName.includes(':Instance') && !panelDualEdit && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName))) && showResourceBanner(profileName)">
            <div class="instanceInfoWrapper" :title="instanceOfWork(profileName) ? 'Instance of: ' + instanceOfWork(profileName) : null">
                <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                <label v-if="switchInBanner" class="resource-switch" title="Switch Resource">
                    <span class="material-icons">swap_horiz</span>
                    <span class="resource-switch-label">Switch Resource</span>
                    <span class="material-icons resource-switch-arrow">expand_more</span>
                    <select @change="switchResource($event)" aria-label="Switch Resource">
                        <option value="" disabled selected>Switch Resource</option>
                        <option v-for="switchName in activeProfile.rtOrder" :key="switchName" :value="switchName" :disabled="switchName == activeResourceName">{{ resourceTypeLabel(switchName) }}: {{ activeProfile.rt[switchName].URI.split("/").at(-1) }}</option>
                    </select>
                </label>
                <button class="instanceDeleteButton" v-if="showDeleteInstanceButton(profileName)" @click="showDeleteInstanceModal(profileName)">Delete Instance</button>
            </div>
        </template>

        <template v-if="profileName.includes(':Item') && !panelDualEdit && (!layoutActiveFilter || (layoutActiveFilter && Object.keys(layoutActiveFilter['properties']).includes(profileName))) && showResourceBanner(profileName)">
            <div class="instanceInfoWrapper">
                <span class="instanceIdentifer">{{ instanceLabel(profileName) }}: {{ activeProfile.rt[profileName].URI.split("/").at(-1) }}</span>
                <label v-if="switchInBanner" class="resource-switch" title="Switch Resource">
                    <span class="material-icons">swap_horiz</span>
                    <span class="resource-switch-label">Switch Resource</span>
                    <span class="material-icons resource-switch-arrow">expand_more</span>
                    <select @change="switchResource($event)" aria-label="Switch Resource">
                        <option value="" disabled selected>Switch Resource</option>
                        <option v-for="switchName in activeProfile.rtOrder" :key="switchName" :value="switchName" :disabled="switchName == activeResourceName">{{ resourceTypeLabel(switchName) }}: {{ activeProfile.rt[switchName].URI.split("/").at(-1) }}</option>
                    </select>
                </label>
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
                      <div v-if="(!preferenceStore.returnValue('--c-general-ad-hoc') || (createLayoutMode && !layoutActive)) || (layoutActive || (preferenceStore.returnValue('--c-general-ad-hoc') && !profileStore.emptyComponents[profileName].includes(profileCompoent)))" :class="{ 'inline-mode' : (preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')), 'edit-panel-scroll-x-child': preferenceStore.returnValue('--b-edit-main-splitpane-edit-scroll-x'), 'read-only': isReadOnly(activeProfile.rt[profileName].pt[profileCompoent]), 'hide-component': ((preferenceStore.returnValue('--b-edit-main-hide-non-lc') && activeProfile.rt[profileName].pt[profileCompoent].hideSubject) || (preferenceStore.returnValue('--b-edit-main-hide-non-lc-class-numbers') && activeProfile.rt[profileName].pt[profileCompoent].hideClassNum))}">
                        <template v-if="panelDualEdit == false">
                          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false && preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == false">
                            <div class="component-label 2" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold'), 'component-label-instance-of': profileCompoent.includes('instanceOf')}">
                              <input v-if="!createLayoutMode && preferenceStore.copyMode && !activeProfile.rt[profileName].pt[profileCompoent].propertyLabel.includes('Admin')" type="checkbox" class="copy-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                              <input v-if="createLayoutMode" type="checkbox" class="layout-selection" :id="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" :value="profileName" :checked="layoutActiveFilter && layoutActiveFilter['properties'][profileName] && includeInLayout(activeProfile.rt[profileName].pt[profileCompoent].id, layoutActiveFilter['properties'][profileName])" />
                              {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                              <span v-if="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])"> (HISTORICAL - READ ONLY) <a style="color:black" href="#" @click="showDebug($event,activeProfile.rt[profileName].pt[profileCompoent])">debug</a></span>

                              <div class="icon-container">
                                <span v-if="preferenceStore.returnValue('--b-edit-main-hide-non-lc') && !displaySubject(activeProfile.rt[profileName].pt[profileCompoent])" class="material-icons inline-icon preview" @click="activeProfile.rt[profileName].pt[profileCompoent].hideSubject=!activeProfile.rt[profileName].pt[profileCompoent].hideSubject">visibility</span>
                                <span v-if="!profileCompoent.includes('adminmetadata') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')" :class="['material-icons','inline-icon', {'work': profileName.includes('Work'), 'instance': profileName.includes('Instance'), 'item': profileName.includes('Item'),}]" @click="removeComponent(profileName, profileCompoent)">delete</span>
                                <span v-if="!profileCompoent.includes('adminmetadata') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')" :class="['material-icons','inline-icon', {'work': profileName.includes('Work'), 'instance': profileName.includes('Instance'), 'item': profileName.includes('Item'),}]" @click="addComponent(profileName, profileCompoent)">add</span>
                              </div>

                            </div>

                          </template>
                        </template>
                        <template v-if="panelDualEdit == true">
                          <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-shortcode-display-mode') == false && preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode') == false && (profileName.indexOf(':Instance') == -1 && profileName.indexOf(':Item') == -1 )">
                            <div class="component-label 3" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold'), 'component-label-instance-of': profileCompoent.includes('instanceOf')}">
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
                        <Main v-if="panelDualEdit == false && (profileName.indexOf(':Instance') > -1 || profileName.indexOf(':Item') > -1)"
                          :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']"
                          :level="0"
                          :id="activeProfile.rt[profileName].pt[profileCompoent].id"
                          :parentId="activeProfile.rt[profileName].pt[profileCompoent].parentId"
                          :readOnly="isReadOnly(activeProfile.rt[profileName].pt[profileCompoent])" />
                            <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')">
                              <InlineModeAddField :guid="activeProfile.rt[profileName].pt[profileCompoent]['@guid']" />
                            </template>
                        </div>

                        <!-- There's a hidden subject -->
                        <template v-if="(preferenceStore.returnValue('--b-edit-main-hide-non-lc') && activeProfile.rt[profileName].pt[profileCompoent].hideSubject) || (preferenceStore.returnValue('--b-edit-main-hide-non-lc-class-numbers') && activeProfile.rt[profileName].pt[profileCompoent].hideClassNum)">
                          <div v-if="numberHiddenShown(activeProfile).hiddenSubject > 0 || numberHiddenShown(activeProfile).hiddenClassNumbers > 0"></div>
                        </template>

                      </template>
                    </template>
                  </template>
                </template>
            </template>
          </template>
        </template>
      </template>




      <select class="add-property-select" @change="addProperty($event,profileName)" v-if="showAddProperty(profileName)">
        <option value="home" selected>Add {{ resourceTypeLabel(profileName) }} Property</option>
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
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','activeComponent', 'dataChanged', 'returnComponentLibrary', 'displaySubject', 'numberHiddenShown', 'hiddenSubjects']),
      ...mapWritableState(usePreferenceStore, ['debugModalData','showDebugModal']),
      ...mapWritableState(useProfileStore, ['emptyComponents', 'copyCatMode']),

      // with the resource switch preference on, each panel (including both Dual Edit columns) shows one selected resource
      switchMode(){
        return this.preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') === true
      },
      panelDualEdit(){
        return this.dualEdit && !this.switchMode
      },
      panelInstanceMode(){
        return this.instanceMode && !this.switchMode
      },
      // in switch mode the Work/Instance toggle lives in the selected resource's banner
      switchInBanner(){
        if (!this.switchMode || this.panelDualEdit){
          return false
        }
        let name = this.activeResourceName
        if (!name || !/:(Work|Instance|Item)/.test(name)){
          return false
        }
        return !this.layoutActiveFilter || Object.keys(this.layoutActiveFilter['properties']).includes(name)
      },
      activeResourceName(){

        if (this.userActiveResourceName===null){
          if (this.activeProfile && this.activeProfile.rtOrder){
            // the Dual Edit instance column starts on the first instance
            if (this.instanceMode){
              let firstInstance = this.activeProfile.rtOrder.find((rt) => rt.includes(':Instance') || rt.includes(':Item'))
              if (firstInstance){
                return firstInstance
              }
            }
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

        // the ad hoc "Add Property" dropdown only belongs in the panel that shows this resource's fields
        showAddProperty: function(profileName){
          if (this.preferenceStore.returnValue('--b-edit-main-splitpane-edit-adhoc-mode') !== true){
            return false
          }
          if (!this.showResourceBanner(profileName)){
            return false
          }
          if (this.panelDualEdit){
            let isInstance = profileName.includes(':Instance') || profileName.includes(':Item')
            return this.panelInstanceMode ? isInstance : !isInstance
          }
          return true
        },
        switchResource: function(event){
          if (event.target.value){
            this.userActiveResourceName = event.target.value
          }
          // keep showing "Switch Resource" once the switch is made
          event.target.value = ''
        },
        resourceTypeLabel: function(profileName){
          if (profileName.includes(':Work')){
            return 'Work'
          }
          if (profileName.includes(':Hub')){
            return 'Hub'
          }
          return this.instanceLabel(profileName)
        },
        // with the resource switch preference on, only the selected resource shows its banner
        showResourceBanner: function(profileName){
          return this.preferenceStore.returnValue('--b-edit-main-splitpane-edit-switch-between-resource-button') !== true || profileName == this.activeResourceName
        },
        instanceOfWork: function(profileName){
          let pt = this.activeProfile.rt[profileName].pt
          let key = Object.keys(pt).find((k) => pt[k].propertyURI == 'http://id.loc.gov/ontologies/bibframe/instanceOf')
          let linked = key && pt[key].userValue ? pt[key].userValue['http://id.loc.gov/ontologies/bibframe/instanceOf'] : null
          let uri = linked && linked[0] ? linked[0]['@id'] : null
          if (!uri){
            // export links every instance to the record's work
            let workRt = this.activeProfile.rtOrder.find((rt) => rt.includes(':Work'))
            uri = workRt ? this.activeProfile.rt[workRt].URI : null
          }
          return uri ? uri.split('/').at(-1) : null
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

        // reset copycat
        this.copyCatMode = false
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
  --section-tint: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-work')");
  background-color: white !important;
  display: flow-root;
  border-radius: 4px;
}

.edit-panel-hub{
  --section-tint: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance')");
  background-color: white !important;
  display: flow-root;
  border-radius: 4px;
}

.edit-panel-instance{
  --section-tint: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance')");
  background-color: white !important;
  display: flow-root;
  border-radius: 4px;
}
.edit-panel-hub:last-child,
.edit-panel-instance:last-child,
.edit-panel-instance-secondary:last-child,
.edit-panel-item:last-child{
  margin-bottom: 5em;
}

.edit-panel-item{
  --section-tint: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-item')");
  background-color: white !important;
  display: flow-root;
  border-radius: 4px;
}
.edit-panel-instance-secondary{
  --section-tint: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance-secondary')");
  background-color: white !important;
  display: flow-root;
  border-radius: 4px;
}

.component-label{
  font-size: 0.85em;
  padding: 2px 5px;
  background-color: var(--section-tint);
  border: solid 1px oklch(from var(--section-tint) calc(l - 0.14) calc(c + 0.015) h / 1);
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
}
.label-bold{
  font-weight: bold;
}

div:has(> .instanceInfoWrapper) {
    padding: 0 6px;
    border: solid 1px var(--section-tint);
}

div:has(> .instanceInfoWrapper) + div:has(> .instanceInfoWrapper) {
    margin-top: 20px;
}

div.instanceInfoWrapper {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 6px 8px;
    padding: 7px 10px;
    margin: 0 -6px 8px;
    background-color: var(--section-tint);
}

.instanceIdentifer {
    /* shrink the title first; the button only shrinks once the title is at its minimum */
    flex-shrink: 1000;
    min-width: 3em;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: bold;
    white-space: nowrap;
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
}

@supports (color: oklch(from red l c h)) {
    div:has(> .instanceInfoWrapper) {
        border-color: oklch(from var(--section-tint) calc(l - 0.34) calc(c + 0.05) h / 1);
    }
    div.instanceInfoWrapper {
        background-color: oklch(from var(--section-tint) calc(l - 0.34) calc(c + 0.05) h / 1);
    }
    div.instanceInfoWrapper .instanceIdentifer {
        color: white;
    }
    div.instanceInfoWrapper .resource-switch {
        border-color: rgba(255, 255, 255, 0.6);
        color: white;
    }
    div.instanceInfoWrapper .resource-switch:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
}

.instanceDeleteButton {
    min-width: 4.5em;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: -2px 0 -2px auto;
    white-space: nowrap;
    font-size: 0.8em;
    font-weight: 600;
    line-height: 1.2;
    padding: 1px 8px;
    border: solid 1px rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    background-color: white;
    color: #b3261e;
    cursor: pointer;
  transition: background-color 0.1s, box-shadow 0.1s, transform 0.05s;
}

.instanceDeleteButton:hover {
  background-color: #b3261e;
  border-color: #baa8a8;
  color: white;
}

.instanceDeleteButton:active {
  background-color: #8e1b15;
  border-color: #8e1b15;
  color: white;
  transform: translateY(1px);
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.35);
}

.instanceDeleteButton:focus-visible {
  outline: solid 2px white;
  outline-offset: 1px;
  background-color: #8e1b15;
  border-color: #8e1b15;
  color: white;
  transform: translateY(1px);
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.35);
}


.resource-switch{
    position: relative;
    display: flex;
    align-items: center;
    gap: 3px;
    min-width: 0;
    margin: -2px 0 -2px auto;
    padding: 0 2px 0 6px;
    border: solid 1px rgba(0, 0, 0, 0.25);
    border-radius: 4px;
    cursor: pointer;
}

.resource-switch .material-icons{
    flex-shrink: 0;
    font-size: 1.1em;
}

.resource-switch-label{
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8em;
    font-weight: 600;
    line-height: 1.2;
    padding: 1px 0;
}

/* the real select sits invisibly over the whole pill, so any part of it opens the list */
.resource-switch select{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    font-size: 0.8em;
}

.resource-switch:focus-within{
    outline: solid 2px currentColor;
    outline-offset: 1px;
}

.resource-switch + .instanceDeleteButton{
    margin-left: 0;
}

.add-property-select{
    display: block;
    max-width: 100%;
    margin: 0 0 6px;
}

.component-label-instance-of{
    display: none;
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

.inline-icon.preview:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-work')");
}

.icon-container{
  float: right;
}
.preview {
  font-size: 1.2em;
}
.hide-component {
  margin-bottom: 4px;
  display: none;
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
