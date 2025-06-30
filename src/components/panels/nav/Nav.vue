<template>
  <div>
    <Teleport to="body">
      <div id="nav-holder">
        <vue-file-toolbar-menu :content="my_menu" />
      </div>
      <template v-if="showValidateModal==true">
        <ValidateModal ref="validatemodal" v-model="showValidateModal" />
      </template>
      <template v-if="showPostModal==true">
        <PostModal ref="postmodal" v-model="showPostModal" />
      </template>

      <template v-if="showRecoveryModal==true">
        <RecoveryModal ref="recoverymodal" v-model="showRecoveryModal" />
      </template>

      <template v-if="showItemInstanceSelection==true">
        <ItemInstanceSelectionModal ref="itemselectionmodal" v-model="showItemInstanceSelection" :instances="instances" @emitSetInstance="setInstance" @hideInstanceSelectionModal="hideInstanceSelectionModal()" />
      </template>

      <template v-if="showAdHocModal==true">
        <AdHocModal ref="adHocModal" v-model="showAdHocModal" />
      </template>

      <template v-if="showSelectionModal==true">
        <GenericSelectionModal @emitSelection="getImportSelection" @closeModal="closeImportSelection" :title="importTitle" :options="importOptions" :modalSettings="modalSettings" :multiple="true" v-model="showSelectionModal" />
      </template>
      <template v-if="showPanelSizeModal==true">
        <PanelSizeModal  v-model="showPanelSizeModal" />
      </template>


    </Teleport>

  </div>
</template>


<script>
  import { useProfileStore } from '@/stores/profile'
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import VueFileToolbarMenu from 'vue-file-toolbar-menu'
  import PostModal from "@/components/panels/nav/PostModal.vue";
  import ValidateModal from "@/components/panels/nav/ValidateModal.vue";
  import RecoveryModal from "@/components/panels/nav/RecoveryModal.vue";
  import ItemInstanceSelectionModal from "@/components/panels/nav/ItemInstanceSelectionModal.vue";
  import AdHocModal from "@/components/panels/nav/AdHocModal.vue";
  import GenericSelectionModal from '../edit/modals/GenericSelectionModal.vue'

  import PanelSizeModal from '../edit/modals/PanelSizeModal.vue'


  import TimeAgo from 'javascript-time-ago'
  import en from 'javascript-time-ago/locale/en'
  if (TimeAgo.getDefaultLocale() != 'en'){TimeAgo.addDefaultLocale(en)}
  const timeAgo = new TimeAgo('en-US')




  export default {
    components: { VueFileToolbarMenu, PostModal, ValidateModal,RecoveryModal, ItemInstanceSelectionModal, AdHocModal, GenericSelectionModal, PanelSizeModal },
    data() {
      return {
        allSelected: false,
        instances: [],
        layoutHash: null,
        importTitle: "",
        importOptions: {},
        modalSettings: [],
        importSelection: [],
        showSelectionModal: false,
      }
    },
    props:{
      disable: {
        default: [],
        type: Array
      }

    },
    computed: {

      ...mapStores(useProfileStore,usePreferenceStore),

      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','rtLookup', 'activeProfileSaved', 'isEmptyComponent']),
      ...mapState(usePreferenceStore, ['styleDefault', 'showPrefModal', 'panelDisplay', 'customLayouts', 'createLayoutMode','panelSizePresets']),
      ...mapState(useConfigStore, ['layouts']),
      ...mapWritableState(usePreferenceStore, ['showLoginModal','showScriptshifterConfigModal','showDiacriticConfigModal','showTextMacroModal','layoutActiveFilter','layoutActive','showFieldColorsModal', 'customLayouts', 'createLayoutMode','showPanelSizeModal']),
      ...mapWritableState(useProfileStore, ['showPostModal', 'showShelfListingModal', 'activeShelfListData','showValidateModal', 'showRecoveryModal', 'showAutoDeweyModal', 'showItemInstanceSelection', 'showAdHocModal', 'emptyComponents', 'activeProfilePosted','activeProfilePostedTimestamp', 'copyCatMode']),
      ...mapWritableState(useConfigStore, ['showNonLatinBulkModal','showNonLatinAgentModal']),




      panelTitleProperties(){
        return (this.panelDisplay.properties) ? 'done' : ''
      },
      panelTitleDualEdit(){
        return (this.panelDisplay.dualEdit) ? 'done' : ''
      },
      panelTitleOpacEdit(){
        return (this.panelDisplay.opac) ? 'done' : ''
      },
      panelTitleXMLEdit(){
        return (this.panelDisplay.xml) ? 'done' : ''
      },
      panelTitleMARCEdit(){
        return (this.panelDisplay.marc) ? 'done' : ''
      },
      panelTitleLinkedData(){
        return (this.panelDisplay.linkedData) ? 'done' : ''
      },


      userName(){
        if (this.preferenceStore.catInitals && this.preferenceStore.catCode){
          return `${this.preferenceStore.catInitals} (${this.preferenceStore.catCode})`
        }else if (this.preferenceStore.catInitals){
          return this.preferenceStore.catInitals
        }else{
          ""
        }

      },





      my_menu () {

        let menu =  []

        // if (!this.disable.includes('logo')){
        //   menu.push({
        //       // html: `
        //       //     <svg width="25px" height="25px" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        //       //      <g class="nav-icon-color" >
        //       //       <path d="m55.5 34.398-20.199 63.102 11.898-1.1992 31.199-63.801z"/>
        //       //       <path d="m59.898 4.5-3.1992 23.898 21.199-1.6992z"/>
        //       //       <path d="m54.301 2.5-26.699 11.699 23.398 12.801z"/>
        //       //       <path d="m24.102 18.898-2.5 69.301 8.0977 7.8008 20.102-63z"/>
        //       //      </g>
        //       //     </svg>
        //       //     `,
        //       // html: `
        //       //     <span style="font-size:2em; font-weight:bold; position: absolute; width: 100px; left:0;">M</span>
        //       //     `,
        //   })
        // }





        let menuButtonSubMenu = [
          { text: "Load Resource", click: () => {
            try{
              this.$nextTick(()=>{
                if (this.profileStore.copyCatMode){
                  this.profileStore.copyCatMode = false
                }
                this.$router.push('/load')
              })
            }catch{
              // expected error :(
            }
            }, icon:"💾"
          },
        ]

        menuButtonSubMenu.push(
          {
            text: "Copy Cat.",
            click: () => {
              if (this.$route.path.includes('edit')){
                this.$router.push('/load')
              }
              this.profileStore.copyCatMode = !this.profileStore.copyCatMode
            },
            emoji: this.profileStore.copyCatMode ? "heavy_check_mark" : "smile_cat"
          }
        )

        const config = useConfigStore()
        if (config.returnUrls.displayLCOnlyFeatures){
          menuButtonSubMenu.push(
            {
              text: 'LC Marva Manual',
              click: () => {
                const routeData = window.open('https://libgov-my.sharepoint.com/personal/pfrank_lib_loc_gov/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fpfrank%5Flib%5Floc%5Fgov%2FDocuments%2FMarva%2DManual%2DShare%2FLibrary%2Dof%2DCongress%2DMarva%2DQuartz%2DUser%2DManual%2Epdf&parent=%2Fpersonal%2Fpfrank%5Flib%5Floc%5Fgov%2FDocuments%2FMarva%2DManual%2DShare')
               },
              icon:"📄"
            }
          )
        }


        if (this.$route.path.startsWith('/edit/')){
          menuButtonSubMenu.push({ is: 'separator'})
          menuButtonSubMenu.push(
            {
              text: 'Add Additional Instance',
              click: () => { this.addInstance(false) }
            },
            {
              text: 'Add Secondary Instance',
              click: () => { this.addInstance(true) }
            },
            {
              text: 'Add Item',
              click: () => { this.addItem() }
            }
          )
        }

        if (!this.disable.includes('Menu')){
          menu.push(
          { text: "Menu",  menu: menuButtonSubMenu }
          )
        }




        if (!this.disable.includes('Tools')){
          menu.push(
          { text: "Tools",
            menu: [
            { text: "Shelf Listing Browser", click: () => {
              this.activeShelfListData = {}
              this.showShelfListingModal = true
            }, icon:"🗄️" },

            { text: "AutoDewey", click: () => {
              this.deweyData = {}
              this.showAutoDeweyModal = true
            }, icon:"smart_toy" },

            { is: 'separator'},
            {
              text: "Non-Latin Literals",
              // active: this.happy,
              click: () => { this.showNonLatinBulkModal = true }
            },
            {
              text: "Non-Latin Agents",
              // active: this.happy,
              click: () => { this.showNonLatinAgentModal = true }
            },

            { is: 'separator'},
            {
              text: 'Copy Mode [' + (this.preferenceStore.copyMode ? "on" : "off") + ']',
              click: () => { this.preferenceStore.toggleCopyMode() },
              icon: this.preferenceStore.copyMode ? "content_copy" : "block"
            },
            {
              text: "Paste Content",
              icon: "content_paste",
              click: () => {
                this.$nextTick(()=>{
                  this.profileStore.pasteSelected()
                })
              }
            },
            { is: 'separator'},
            {
              text: 'Add All Defaults',
              click: () => { this.addAllDefaults() },
              icon: "clear_all"
            }
          ] }
          )
        }

        if(this.$route.path.startsWith('/edit/') && this.preferenceStore.returnValue('--c-general-ad-hoc')){
          for (let sub in menu){
            if (menu[sub].text == 'Tools'){
              menu[sub].menu.push(
                { is: 'separator'},
                {
                  text: 'Show/Hide Elements',
                  icon: 'menu',
                  click: () => { this.showAdHocModal = true },
                },
                {
                  text: 'Show Empty Elements',
                  click: () => this.showAllElements(),
                  icon: 'visibility'
                },
                {
                  text: 'Hide Empty Elements',
                  click: () => this.hideAllElements(),
                  icon: 'visibility_off'
                },
              )
            }
          }
        }



        if (!this.disable.includes('View')){
          menu.push(
            { text: "View",
              class: "nav-view",
            menu: [

              { text: 'Properties', click: () => this.preferenceStore.togglePanel('properties'), icon: this.panelTitleProperties },
              { text: 'Dual Edit', click: () => this.preferenceStore.togglePanel('dualEdit'), icon: this.panelTitleDualEdit },
              { text: 'Preview OPAC', click: () => this.preferenceStore.togglePanel('opac'), icon: this.panelTitleOpacEdit },

              { text: 'Preview XML', click: () => this.preferenceStore.togglePanel('xml'), icon: this.panelTitleXMLEdit, class:"nav-view-xml" },
              { text: 'Preview MARC', click: () => this.preferenceStore.togglePanel('marc'), icon: this.panelTitleMARCEdit },
              { text: 'Linked Data', click: () => this.preferenceStore.togglePanel('linkedData'), icon: this.panelTitleLinkedData },



              { is: 'separator'},

              { text: 'Quick Views', click: () => {
                this.showPanelSizeModal = true;

              } , icon: 'width_normal' },



            ] }
          )
        }

        if (this.panelSizePresets.length>0 && this.$route.name == 'Edit'){

          menu.push({ is: 'separator'})
          for (let aPresetButton of this.panelSizePresets){
            menu.push(
              {
                // style: `color: ${aPresetButton.color};`, // this doesn't work
                id:"panel-size-preset-button-" + aPresetButton.id,
                class: "panel-size-preset-button",
                click: () => {
                  this.preferenceStore.setPanelData(aPresetButton)
                },
                icon: aPresetButton.icon
              }
            )
            // this is how we gotta set the color I guess
            this.$nextTick(()=>{
              document.querySelector(`#panel-size-preset-button-${aPresetButton.id} span`).style.color = aPresetButton.color
            })
          }
          menu.push({ is: 'separator'})





        }


        if (!this.disable.includes('Preferences')){
          menu.push(
            { text: "Preferences",  menu: [

              { text: 'Scriptshifter', click: () => this.showScriptshifterConfigModal = true, icon: 'translate' },
              { text: 'Diacritic Macros', click: () => this.showDiacriticConfigModal = true, icon: 'keyboard' },
              { text: 'Text Macros', click: () => this.showTextMacroModal = true, icon: 'abc' },

              { text: 'Field Colors', click: () => this.showFieldColorsModal = true, icon: '🌈' },

              { text: 'Themes', icon: '🎨', menu: [

                { text: 'Default', click: () => this.preferenceStore.setTheme('default')},
                { text: 'Dark', click: () => this.preferenceStore.setTheme('dark')},
                { text: 'Gray', click: () => this.preferenceStore.setTheme('gray')},



              ] },





              { is: 'separator'},


              { text: 'General', click: () => this.preferenceStore.togglePrefModal('General')},
              { text: 'Edit Panel', click: () => this.preferenceStore.togglePrefModal('Edit Panel')},
              { text: 'Literal Field', click: () => this.preferenceStore.togglePrefModal('Literal Field')},
              { text: 'Lookup Field', click: () => this.preferenceStore.togglePrefModal('Lookup Field')},



              { text: 'Modals', click: () => this.preferenceStore.togglePrefModal('Modals')},

              { text: 'Complex Lookup', click: () => this.preferenceStore.togglePrefModal('Complex Lookup')},
              { text: 'Action Button', click: () => this.preferenceStore.togglePrefModal('Action Button')},
              { text: 'Nav Bar', click: () => this.preferenceStore.togglePrefModal('Nav Bar')},
              { text: 'Sidebars - Previews', click: () => this.preferenceStore.togglePrefModal('Sidebars - Previews')},
              { text: 'Sidebars - Property', click: () => this.preferenceStore.togglePrefModal('Sidebars - Property')},
              { text: 'Shelflisting', click: () => this.preferenceStore.togglePrefModal('Shelflisting')},
              // { text: 'CAMM Mode', click: () => this.preferenceStore.togglePrefModal('CAMM Mode')},

              { is: 'separator'},
              { text: 'Export Prefs', click: () => this.exportPreferences(), icon: 'download' },
              { text: 'Import Prefs', click: () => this.showImportSelectionModal(), icon: 'upload' },
              { is: 'separator'},
              { text: 'Reset Prefs', click: () => this.preferenceStore.resetPreferences(), icon: 'restart_alt' },




            ] }
          )
        }
        if (this.$route.path.startsWith('/edit/')){
          menu.push({ is: "separator" })

          menu.push(
            {
              text: "",
              icon: "reorder",
              disabled: (this.layoutActive) ? false : true,
              class: (this.layoutActive) ? "layout-active" : "layout-not-active",
              title: "Turn off layout",

              click: () => {
                this.layoutActive=false
                this.layoutActiveFilter=null
                this.layoutHash=null
                this.createLayoutMode=false

                //if ad hoc mode is on cycle on/off, otherwise an initially hidden component will remain hidden
                if (this.preferenceStore.returnValue('--c-general-ad-hoc')){
                  this.showAllElements()
                  this.hideAllElements()
                }
              }
            }
          )


           let layoutsMenu = []
           // If there is a custom layout loaded, options should be edit & delete
           let layoutOptions

           if (!this.layoutHash){
            layoutOptions = [{
              text: "Create Layout",
              click: (e) => {
                e.stopPropagation()
                this.createLayout()
              },
              icon: "add"
            }]
           } else {
            layoutOptions = [{
              text: "Edit Layout",
              click: (e) => {
                e.stopPropagation()
                this.editLayout()
              },
              icon: "edit",
              hotkey: "ctrl+shift+e"
            },
            {
              text: "Delete Layout",
              click: () => {
                if (window.confirm("Do you really want to delete this layout?")){
                  this.deleteLayout()
                }
              },
              icon: "delete",
              hotkey: "ctrl+shift+d"
            }]
           }

           for (let opt in layoutOptions){
            layoutsMenu.push(layoutOptions[opt])
           }
            layoutsMenu.push({ is: "separator" })

           for (let l in this.layouts.all ){
            layoutsMenu.push({
              text: this.layouts.all[l].label,
              click: () => {
                this.activateLayout(this.layouts.all[l])
              },

            })
           }

           const customLayouts = this.preferenceStore.returnValue("--l-custom-layouts")
           if (customLayouts != {}){
            layoutsMenu.push({ is: "separator" })
            const layoutList = Object.keys(customLayouts)
            for (let idx in layoutList){
              let layout = customLayouts[layoutList[idx]]
              layoutsMenu.push({
                text: layout.label,
                hotkey: "ctrl+" + idx,
                click: () => {
                  this.layoutHash = layoutList[idx]
                  this.activateLayout(layout)
                },
                emoji: layout.profileId == this.activeProfile.id ? "heavy_check_mark" : "x",
                title: layout.profileId == this.activeProfile.id ? "Layout Matches Profile." : "Can't use ''" + layout.profileId  + "'' layout with ''" + this.activeProfile.id + "'' profile."
              })
            }
           }

          //  menu.push(
          //     !this.createLayoutMode ? { text: "Layouts",  menu: layoutsMenu } : { text: "Save Layout", click: () => { this.saveLayout() }}
          //   )

           if (!this.createLayoutMode){
            menu.push(
              { text: "Layouts",  menu: layoutsMenu, menu_width: 250 }
            )
            if(this.layoutActive){
              if (this.layoutActiveFilter){
                menu.push(
                  {
                    text: this.layoutActiveFilter.label,
                    class: 'active-layout-label'
                  }
                )
              }
            }
           } else {
            menu.push(
              { text: "Save Layout", click: (e) => {
                e.stopPropagation()
                this.saveLayout()
               }},
              { text: "Cancel Layout", click: (e) => {
                e.stopPropagation()
                this.cancelLayout()
              }},
            )
           }

        }


        if (this.$route.path.startsWith('/edit/')){
          menu.push({ is: "separator" })
        }


        if (this.$route.path.startsWith('/edit/')){
          menu.push(
          {
            text: (this.activeProfileSaved) ? "Saved" : "Save",
            disabled: (this.activeProfileSaved) ? true : false,
            // active: this.happy,
            icon: (this.activeProfileSaved) ? "turned_in" : "turned_in_not",
            class: (this.activeProfileSaved) ? "save-saved" : "save-not-saved",


            click: () => { this.profileStore.saveRecord() }
          }
          )
          menu.push(
            {
              text: "Validate",
              icon: "check",
              click: () => {
                this.showValidateModal = true;
                this.$nextTick(()=>{
                  this.$refs.validatemodal.post()
                })
              }
            }
          )
          menu.push(
            {
              text: "Post",
              id:"post-button",
              ref:"test",
              icon: (this.activeProfilePosted) ? "mark_email_read" : "sailing",
              click: () => {
                this.showPostModal = true;
                this.$nextTick(()=>{

                  // can't assign a ref attr to the element here so do it old way
                  // only do this the first time
                  if (!this.activeProfilePosted){
                    document.getElementById('post-button').addEventListener('mouseenter',()=>{
                      document.getElementById('post-button').dataset.tooltip = "Posted: " + timeAgo.format(this.activeProfilePostedTimestamp) + "."
                    })
                  }
                  this.$refs.postmodal.post();
                  this.profileStore.saveRecord()

                })
              },
              class: (this.activeProfilePosted) ? "record-posted simptip-position-bottom" : "record-unposted simptip-position-bottom",
            }
          )

          menu.push(
            {
              text: "Open in LCAP",
              id:"send-lcap",
              ref:"lcap",
              icon: "open_in_new",
              click: () => {
                let url =  useConfigStore().returnUrls.lcap // "https://c2vwscf01.loc.gov/cflsops/toolkit-training-lcsg/lcap-productivity/marva/bibId/"
                let bibId = null
                console.log("url",url)
                // get the bibID
                for (let rt in this.activeProfile.rt){
                  let type = rt.split(':').slice(-1)[0]
                  let url = this.activeProfile.rt[rt].URI
                  if (type=='Instance'){
                    bibId =  url.split("/")[url.split('/').length - 1]
                  }
                }
                window.open(url + bibId)
              },
              class: (this.activeProfilePosted || this.isStaging() || (this.activeProfile && this.activeProfile.status && this.activeProfile.status == 'posted' )) ? "record-posted-folio-ok" : "record-unposted-folio-no",
            }
          )



          if (this.preferenceStore.copyMode){
              menu.push({ is: "separator" })
              menu.push(
                {
                  text: "Copy Selected",
                  icon: "content_copy",
                  id: "copy-selected-button",
                  click: () => {
                    this.$nextTick(()=>{
                      this.profileStore.copySelected()
                    })
                  }
                },
                {
                  text: "Paste Content",
                  icon: "content_paste",
                  click: () => {
                    this.$nextTick(()=>{
                      this.profileStore.pasteSelected()
                    })
                  }
                },
                {
                  text: "Cut Selected",
                  icon: "content_cut",
                  click: () => {
                    this.$nextTick(()=>{
                      this.profileStore.copySelected(true)
                    })
                  }
                },
              )

              menu.push(

              )

              menu.push(
                {
                  text: !this.allSelected ? "Select All" : "Deselect All",
                  icon: !this.allSelected ? "select_all" : "deselect",
                  click: () => {
                    this.$nextTick(()=>{
                      this.selectAll()
                    })
                  }
                }
              )
          }
        }

        if (this.activeProfile.id && this.$route.name == 'Edit'){
          menu.push(
            {
              text: "Profile: " + this.activeProfile.id,
              class: "current-profile",

            }
          )
          }

        // anything after this point will  be on the right of nav menu
        menu.push({ is: "spacer" })



        menu.push(
        {
            text: this.userName,
            // active: this.happy,
            icon: "account_circle",
            click: () => { this.showLoginModal = true }
        }
        )







        return menu


      }



    },

    // watch: {
    //   // whenever question changes, this function will run
    //   question(newVal, oldVal) {
    //     if(newVal===true){

    //     }
    //   }
    // },

    methods: {

      isStaging: function(){
        if (useConfigStore().returnUrls.env == "staging" || useConfigStore().returnUrls.dev == true){
          return true
        }else{
          return false
        }
      },

      returnPixleAsPercent: function(pixles){
        return pixles/window.innerHeight*100
      },

      activateLayout(layout){
        this.layoutActive = true
        this.layoutActiveFilter = layout
      },

      createLayout: function(){
        this.createLayoutMode = true
      },

      editLayout: function(){
        let target = this.layoutActiveFilter
        this.createLayoutMode = true
      },

      deleteLayout: function(hash=null){
        let targetHash
        if (hash){
          targetHash = hash
        } else {
          targetHash = this.layoutHash
        }
        this.preferenceStore.deleteLayout(targetHash)
        this.layoutActive = false
        this.layoutActiveFilter = null
        this.layoutHash = null
      },

      saveLayout: function(){
        let saved = this.preferenceStore.saveLayout()
        let l
        const customLayouts = this.preferenceStore.returnValue("--l-custom-layouts")
        this.layoutHash = saved
        l = customLayouts[this.layoutHash]
        // switch to the new layout
        this.activateLayout(l)
        if (saved){
          this.createLayoutMode = false
        }
      },

      cancelLayout: function(){
        this.createLayoutMode = false
        this.layoutActive = false
        this.layoutActiveFilter = null
        this.layoutHash = null
      },

      selectAll: function(){
          let checkBoxes = document.getElementsByClassName("copy-selection")
          this.allSelected = !this.allSelected

          checkBoxes.forEach((el) => {
              if (this.allSelected){
                  el.checked = true
              } else {
                  el.checked = false
              }
          })
      },

      exportPreferences: function(){
        let prefs = null
        let scriptShifterOptions = null
        let diacriticUse = null
        let marvaComponentLibrary = null

        let data = {}

        if (window.localStorage.getItem('marva-preferences')){
          prefs = JSON.parse(window.localStorage.getItem('marva-preferences'))
          data["prefs"] = prefs
        } else {
          alert("Couldn't find preferences to export. :(")
        }
        if (window.localStorage.getItem('marva-scriptShifterOptions')){
          scriptShifterOptions = JSON.parse(window.localStorage.getItem('marva-scriptShifterOptions'))
          data["scriptShifterOptions"] = scriptShifterOptions
        } else {
          console.warn("Couldn't find ScriptShifter preferences to export. :(")
        }
        if (window.localStorage.getItem('marva-diacriticUse')){
          diacriticUse = JSON.parse(window.localStorage.getItem('marva-diacriticUse'))
          data["diacriticUse"] = diacriticUse
        } else {
          console.warn("Couldn't find Diacritic preferences to export. :(")
        }

        if (window.localStorage.getItem('marva-componentLibrary')){
          marvaComponentLibrary = JSON.parse(window.localStorage.getItem('marva-componentLibrary'))
          data["marvaComponentLibrary"] = marvaComponentLibrary
        } else {
          console.warn("Couldn't find marva-componentLibrary preferences to export. :(")
        }


        let today = new Date()
        let dd = String(today.getDate()).padStart(2, '0')
        let mm = String(today.getMonth() + 1).padStart(2, '0')
        let yyyy = today.getFullYear()

        var temp = document.createElement('a')
        temp.setAttribute('href', 'data:text/plain; characterset=utf-8,' + encodeURIComponent(JSON.stringify(data)))
        temp.setAttribute('download', "MarvaPreferences_" + yyyy + mm + dd + ".json")
        temp.style.display = 'none'
        document.body.appendChild(temp)
        temp.click()
        document.body.removeChild(temp)
      },

      getImportSelection: function(selection){
        this.importSelection = selection

        if (this.importSelection.length > 0){
          this.showSelectionModal = false
        } else {
          alert("Nothing is selected.")
        }

        this.importPreferences(this.importSelection)
      },

      closeImportSelection: function(){
        this.showSelectionModal = false
      },

      showImportSelectionModal: function(){
        this.importTitle = "Which Preferences would you like to import?"
        this.importOptions = [
          {
            label: "Everything",
            value: "all"
          },
          {
            label: "Marva Styling",
            value: "style"
          },
          {
            label: "Script Shifter Settings",
            value: "scriptShifter"
          },
          {
            label: "Text Macro Settings",
            value: "textMacro"
          },
          {
            label: "Diacritic Macro Settings",
            value: "diacriticMacro"
          },
          {
            label: "Custom Layouts",
            value: "layouts"
          }
          ,
          {
            label: "Component Library",
            value: "componentLibrary"
          }
        ]
        this.modalSettings = {
          height: 300,
          width: 500,
          buttonText: "Import",
          initalLeft: 300,
          initalTop: 250
        }
        this.showSelectionModal = true
      },

      importPreferences: function(selection=null){
        const that = this

        var temp = document.createElement("input")
        temp.type = "file"
        temp.id = "file-input"
        temp.addEventListener('change', function(e){
          var file = e.target.files[0]
          if (!file){ return }
          let reader = new FileReader()

          reader.onload = function(e){
            var contents = JSON.parse(e.target.result)

            if (selection && selection.includes('all')){
              that.preferenceStore.loadPreferences(contents["prefs"])
              window.localStorage.setItem('marva-preferences', JSON.stringify(contents["prefs"]))
            }

            if (contents["scriptShifterOptions"] && (selection && (selection.includes('scriptShifter') || selection.includes('all')))){
              that.preferenceStore.scriptShifterOptions = contents["scriptShifterOptions"]
              window.localStorage.setItem('marva-scriptShifterOptions', JSON.stringify(contents["scriptShifterOptions"]))
            }

            if (contents["marvaComponentLibrary"] && (selection && (selection.includes('componentLibrary') || selection.includes('all')))){
              that.preferenceStore.componentLibrary = contents["marvaComponentLibrary"]
              window.localStorage.setItem('marva-componentLibrary', JSON.stringify(contents["marvaComponentLibrary"]))
            }

            if (contents["diacriticUse"] && (selection && (selection.includes('diacriticMacro') || selection.includes('all')))){
              that.preferenceStore.diacriticUse = contents["diacriticUse"]
              window.localStorage.setItem('marva-diacriticUse', JSON.stringify(contents["diacriticUse"]))
              that.preferenceStore.buildDiacriticSettings()

              const incoming = contents.prefs['styleDefault']['--c-diacritics-enabled-macros'].value
              that.preferenceStore.setValue('--c-diacritics-enabled-macros', incoming)
            }

            if (selection && (selection.includes('textMacro') || selection.includes('all'))){
              const incoming = contents.prefs['styleDefault']['--o-diacritics-text-macros'].value
              that.preferenceStore.setValue('--o-diacritics-text-macros', incoming)
            }

            if (selection && (selection.includes('layouts') || selection.includes('all'))){
              const incoming = contents.prefs['styleDefault']['--l-custom-layouts'].value
              that.preferenceStore.setValue('--l-custom-layouts', incoming)
            }

            if (selection && (selection.includes('style') || selection.includes('all'))){
              for (let item in contents.prefs['styleDefault']){
                if (!['--l-custom-layouts', '--o-diacritics-text-macros', '--c-diacritics-enabled-macros'].includes(item)){
                  const incoming = contents.prefs['styleDefault'][item].value
                  that.preferenceStore.setValue(item, incoming)
                }
              }
            }

          }

          reader.readAsText(file)
        }, false)
        document.body.appendChild(temp)
        temp.click()
        document.body.removeChild(temp)
      },

      addInstance: function(secondary=false){
        let lccn = "" //prompt("Enter an LCCN for this Instance.")
        this.profileStore.createInstance(secondary, lccn)
      },

      addItem: function(){
        let lccn = "" //prompt("Enter an LCCN for this Item.")
        let instanceCount = 0
        let instance = null
        for (let p in this.activeProfile.rt){
          if (p.includes(":Instance")){
            this.instances.push(p)
            instanceCount++
          }
        }
        if (instanceCount == 0){
          alert("There are no instances in the record. You need to crete one before you can add an item.")
          return
        }
        if (instanceCount>1){
          // show a modal to select which instance the item belongs too
          this.showItemInstanceSelection = true
        } else {
          this.profileStore.createItem(this.targetInstance, lccn)
        }
      },

      setInstance: function(data){
        this.targetInstance = this.instances[data]
        this.showItemInstanceSelection = false
        this.instances = []
        this.profileStore.createItem(this.targetInstance)
      },

      hideInstanceSelectionModal: function(){
        this.instances = []
        this.showItemInstanceSelection = false;
      },

      // Show all hidden elements
      showAllElements: function(){
        for (let key in this.emptyComponents){
          this.emptyComponents[key] = []
        }
      },

      // Hide all empty elements
      hideAllElements: function(){
        for (let rt in this.activeProfile.rt){
          this.emptyComponents[rt] = []
          for (let element in this.activeProfile.rt[rt].pt){
            this.profileStore.addToAdHocMode(rt, element)
          }
        }
      },

      addAllDefaults: function(){
        for (let rt in this.activeProfile.rt){
          for (let pt in this.activeProfile.rt[rt].pt){
            let component = this.activeProfile.rt[rt].pt[pt]
            let structure = this.profileStore.returnStructureByComponentGuid(component['@guid'])
            if (structure.propertyLabel != 'Admin Metadata' || structure.adminMetadataType == 'primary') {
              if ( component.valueConstraint.defaults.length > 0){
                // top level component
                if (Object.keys(component.userValue).every(k => k.startsWith("@"))){ // it's empty
                  this.profileStore.insertDefaultValuesComponent(component['@guid'], structure)
                  continue
                }
              }
              //go deeper
              for (let vRt of component.valueConstraint.valueTemplateRefs){
                for (let template of this.profileStore.rtLookup[vRt].propertyTemplates){
                  if (template.valueConstraint.defaults && template.valueConstraint.defaults.length > 0){
                    // for classifiction, we want to make sure we're only working on the currently selected template
                    if (structure.propertyURI == 'http://id.loc.gov/ontologies/bibframe/classification'){
                      let selection = document.getElementById(structure['@guid']+'-select')
                      let selected
                      let target
                      if (selection){
                        selected = selection.options[selection.selectedIndex].text
                        switch (selected){
                          case 'Dewey Decimal classification':
                            target = "lc:RT:bf2:DDC"
                            break
                          case 'National Library of Medicine classification':
                            target = "lc:RT:bf2:NLM"
                            break
                          case 'Other classification number':
                            target = "lc:RT:bf2:OtherClass"
                            break
                          default:
                            target = "lc:RT:bf2:LCC"
                        }
                        if (target == vRt){
                          this.profileStore.insertDefaultValuesComponent(structure['@guid'], template)
                        }
                      }
                    } else if (structure.propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject'){
                      let selection = document.getElementById(structure['@guid']+'-select')
                      let selected
                      let target
                      if (selection){
                        selected = selection.options[selection.selectedIndex].text
                        switch (selected){
                          case 'CYAC subject':
                            target = "lc:RT:bf2:Topic:Childrens:Components"
                            break
                          case 'Geographic subjects':
                            target = "lc:RT:bf2:Topic:Place:Components"
                            break
                          default:
                            target = "lc:RT:bf2:Components"
                        }
                        if (target == vRt){
                          this.profileStore.insertDefaultValuesComponent(structure['@guid'], template)
                        }
                      }
                    }else if (vRt != 'lc:RT:bf2:SeriesHub'){
                      this.profileStore.insertDefaultValuesComponent(structure['@guid'], template)
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    mounted() {}
  }



</script>



<style>
/*.sidebar{
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");
}
*/
    :root {
      --bar-font-color: rgb(32, 33, 36);
      --bar-font-family: Roboto, RobotoDraft, Helvetica, Arial, sans-serif;
      --bar-font-size: 15px;
      --bar-font-weight: 500;
      --bar-letter-spacing: 0.2px;
      --bar-padding: 3px;
      --bar-button-icon-size: 20px;
      --bar-button-padding: 3px 5px;
      --bar-button-radius: 4px;
      --bar-button-hover-bkg: rgb(244, 241, 242);



      --bar-button-hover-bkg: rgb(244, 241, 242);
      --bar-button-active-color: rgb(26, 115, 232);
      --bar-button-active-bkg: rgb(232, 240, 254);
      --bar-button-open-color: rgb(32, 33, 36);
      --bar-button-open-bkg: rgb(232, 240, 254);
      --bar-menu-bkg: white;
      --bar-menu-border-radius: 0 0 3px 3px;
      --bar-menu-item-chevron-margin: 0;
      /* --bar-menu-item-hover-bkg: rgb(241, 243, 244); */
      --bar-menu-item-hover-bkg: rgb(26, 115, 232);

      --bar-menu-item-padding: 5px 8px 5px 35px;
      --bar-menu-item-icon-size: 15px;
      --bar-menu-item-icon-margin: 0 9px 0 -25px;
      --bar-menu-padding: 6px 1px;
      --bar-menu-shadow: 0 2px 6px 2px rgba(60, 64, 67, 0.15);
      --bar-menu-separator-height: 1px;
      --bar-menu-separator-margin: 5px 0 5px 34px;
      --bar-menu-separator-color: rgb(227, 229, 233);
      --bar-separator-color: rgb(218, 220, 224);
      --bar-separator-width: 1px;
      --bar-sub-menu-border-radius: 3px;
    }
    .bars > .bar:first-child {
      border-bottom: 1px solid rgb(218, 220, 224);
      margin-bottom: 3px;
    }

    .bar{
      font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-font-size')") !important;
      height: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-height',true) - 1 + 'px'") !important;
      color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-font-color')") !important;
    }

    .bar-button{
      color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-font-color')") !important;
    }


    .bar-menu-items{
      background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-background-color')") !important;
      color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-font-color')") !important;
    }





    .nav-icon-color{
      fill: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-font-color')") !important;
    }

    .panel-size-preset-button .icon{
      font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-font-size')") !important;
    }

    .current-profile {
      /* background: var(--bar-button-hover-bkg, #f1f3f4); */

      background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color-accent')") !important;

      margin-left: 100px;
    }

    .record-unposted-folio-ok{
      pointer-events: all;
    }
    .record-unposted-folio-no{
      pointer-events: none;
      opacity: .5;
    }

    .record-posted .icon{
      color: green !important;
    }
    .save-not-saved span{
      color: orangered !important;
    }
    .save-saved span{
      color: mediumblue !important;
    }
    .layout-active{
      /* background-color: chartreuse !important; */
      cursor: pointer;
    }
    .layout-not-active{
      display: none !important;
    }

    .active-layout-label:hover,
    .active-layout-label {
      background: rgb(30, 231, 57) !important;
    }


</style>

<style scoped>



  #nav-holder{
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-height',true) - 1 + 'px'");
  }







</style>
