<template>
  <div>
    <Teleport to="body">
      <div id="nav-holder" :class="['bars', {'staging-warning': this.isStaging()}]">
        <!-- <vue-file-toolbar-menu v-if="!preferenceStore.copyMode" :content="my_menu[0]" />
        <vue-file-toolbar-menu v-else v-for="(content, index) in my_menu" :content="content" /> -->
        <vue-file-toolbar-menu v-for="(content, index) in my_menu" :content="content" />
      </div>
      <template v-if="showValidateModal == true">
        <ValidateModal ref="validatemodal" v-model="showValidateModal" />
      </template>
      <template v-if="showPostModal == true">
        <PostModal ref="postmodal" v-model="showPostModal" />
      </template>

      <template v-if="showRecoveryModal == true">
        <RecoveryModal ref="recoverymodal" v-model="showRecoveryModal" />
      </template>

      <template v-if="showItemInstanceSelection == true">
        <ItemInstanceSelectionModal ref="itemselectionmodal" v-model="showItemInstanceSelection" :instances="instances"
          @emitSetInstance="setInstance" @hideInstanceSelectionModal="hideInstanceSelectionModal()" />
      </template>

      <template v-if="showAdHocModal == true">
        <AdHocModal ref="adHocModal" v-model="showAdHocModal" />
      </template>

      <template v-if="showSelectionModal == true">
        <GenericSelectionModal @emitSelection="getImportSelection" @closeModal="closeImportSelection"
          :title="importTitle" :options="importOptions" :modalSettings="modalSettings" :multiple="true"
          v-model="showSelectionModal" />
      </template>
      <template v-if="showPanelSizeModal == true">
        <PanelSizeModal v-model="showPanelSizeModal" />
      </template>

      <template v-if="showFindReplaceModal == true">
        <FindReplaceModal v-model="showFindReplaceModal" />
      </template>


    </Teleport>

  </div>
</template>


<script>
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'
import { useConfigStore } from '@/stores/config'
import { useMarvaScanStore } from '@/stores/marvaScan'
import { useStateRecorderStore } from '@/stores/stateRecorder'

import { mapStores, mapState, mapWritableState } from 'pinia'
import VueFileToolbarMenu from 'vue-file-toolbar-menu'
import PostModal from "@/components/panels/nav/PostModal.vue";
import ValidateModal from "@/components/panels/nav/ValidateModal.vue";
import RecoveryModal from "@/components/panels/nav/RecoveryModal.vue";
import ItemInstanceSelectionModal from "@/components/panels/nav/ItemInstanceSelectionModal.vue";
import AdHocModal from "@/components/panels/nav/AdHocModal.vue";
import GenericSelectionModal from '../edit/modals/GenericSelectionModal.vue'

import PanelSizeModal from '../edit/modals/PanelSizeModal.vue'
import FindReplaceModal from '../edit/modals/FindReplaceModal.vue'

import StatusIndicator from './nav_components/StatusIndicator.vue'
import RecordHistory from './nav_components/RecordHistory.vue'
import SystemStatus from './nav_components/SystemStatus.vue'


import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
if (TimeAgo.getDefaultLocale() != 'en') { TimeAgo.addDefaultLocale(en) }
const timeAgo = new TimeAgo('en-US')




export default {
  components: { VueFileToolbarMenu, PostModal, ValidateModal, RecoveryModal, ItemInstanceSelectionModal, AdHocModal, GenericSelectionModal, PanelSizeModal, FindReplaceModal },

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
      windowWidth: window.innerWidth,
      menu: [],
      dancerWorkspaces: [],
      navOverflowCount: 0,
      fittingNav: false,
    }
  },
  props: {
    disable: {
      default: [],
      type: Array
    }

  },
  computed: {

    ...mapStores(useProfileStore, usePreferenceStore, useMarvaScanStore, useStateRecorderStore),

    ...mapState(useProfileStore, ['profilesLoaded', 'activeProfile', 'rtLookup', 'activeProfileSaved', 'isEmptyComponent', 'returnComponentLibrary']),
    ...mapState(usePreferenceStore, ['styleDefault', 'showPrefModal', 'panelDisplay', 'customLayouts', 'createLayoutMode', 'panelSizePresets']),
    ...mapState(useConfigStore, ['layouts', 'motdHeight']),
    ...mapWritableState(usePreferenceStore, ['showLoginModal', 'showLoginModalSSO', 'showScriptshifterConfigModal', 'showDiacriticConfigModal', 'showTextMacroModal', 'layoutActiveFilter', 'layoutActive', 'showFieldColorsModal', 'customLayouts', 'createLayoutMode', 'showPanelSizeModal', 'showFindReplaceModal']),
    ...mapWritableState(useProfileStore, ['showPostModal', 'showShelfListingModal', 'activeShelfListData', 'showValidateModal', 'showRecoveryModal', 'showAutoDeweyModal', 'showYoshinoSubjectsModal', 'showItemInstanceSelection', 'showAdHocModal', 'emptyComponents', 'activeProfilePosted', 'activeProfilePostedTimestamp', 'copyCatMode', 'showUserDirectoryModal', 'showFolioSyncModal']),
    ...mapWritableState(useConfigStore, ['showNonLatinBulkModal', 'showNonLatinAgentModal']),




    // color of the "Saved" button text: the original dark blue on light nav backgrounds,
    // a light blue on dark ones (like dark mode) so it stays readable
    savedTextColor() {
      let background = this.preferenceStore.returnValue('--c-edit-main-splitpane-nav-background-color')
      let ctx = document.createElement('canvas').getContext('2d')
      ctx.fillStyle = background // the canvas turns any CSS color (names, #rgb, #rrggbbaa, rgb()) into #rrggbb or rgba()
      let rgb = ctx.fillStyle.startsWith('#')
        ? [1, 3, 5].map((i) => parseInt(ctx.fillStyle.slice(i, i + 2), 16))
        : ctx.fillStyle.match(/\d+/g).slice(0, 3).map(Number)
      // relative luminance (WCAG)
      let [r, g, b] = rgb.map((c) => { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) })
      let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      return (luminance < 0.18) ? '#8ab4f8' : 'mediumblue'
    },
    // hides the nav button icons when "Show Icons" is off in the preferences
    navIconDisplay() {
      return this.preferenceStore.returnValue('--b-edit-main-splitpane-nav-show-icons') ? 'inline-block' : 'none'
    },
    panelTitleProperties() {
      return (this.panelDisplay.properties) ? 'done' : ''
    },
    panelTitleDualEdit() {
      return (this.panelDisplay.dualEdit) ? 'done' : ''
    },
    panelTitleOpacEdit() {
      return (this.panelDisplay.opac) ? 'done' : ''
    },
    panelTitleXMLEdit() {
      return (this.panelDisplay.xml) ? 'done' : ''
    },
    panelTitleMARCEdit() {
      return (this.panelDisplay.marc) ? 'done' : ''
    },
    panelTitleLinkedData() {
      return (this.panelDisplay.linkedData) ? 'done' : ''
    },

    yoshinoAllowed() {
      return this.preferenceStore.featureAvailable('subjectFinder', this.preferenceStore.featureFlags.includes('subject-suggest'))
    },

    marvaScanAllowed() {
      return this.preferenceStore.featureAvailable('marvaScan', this.preferenceStore.featureFlags.includes('marva-scan'))
    },

    linkedDataAllowed() {
      return this.preferenceStore.featureAvailable('linkedData')
    },

    yoshinoHasSummary() {
      if (!this.activeProfile || !this.activeProfile.rtOrder) return false
      for (let rt of this.activeProfile.rtOrder) {
        if (rt.indexOf(':Work') === -1) continue
        for (let ptId of this.activeProfile.rt[rt].ptOrder) {
          let pt = this.activeProfile.rt[rt].pt[ptId]
          if (pt.propertyURI === 'http://id.loc.gov/ontologies/bibframe/summary' &&
              pt.userValue?.['http://id.loc.gov/ontologies/bibframe/summary']?.[0]?.['http://www.w3.org/2000/01/rdf-schema#label']?.[0]?.['http://www.w3.org/2000/01/rdf-schema#label']) {
            return true
          }
        }
      }
      return false
    },

    userName() {
      let displayName = this.preferenceStore.catInitals
      if (this.preferenceStore.ssoUser && this.preferenceStore.ssoUser.email){
        displayName = this.preferenceStore.ssoUser.email.split('@')[0]
      }
      if (displayName && this.preferenceStore.catCode) {
        return `${displayName} (${this.preferenceStore.catCode})`
      } else if (displayName) {
        return displayName
      } else {
        ""
      }

    },





    my_menu() {

      let menu = []
      let botMenu = []

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

        if (this.$route.path.includes('edit')){
          menu.push({
            icon: "home",
            class: "panel-size-preset-button nav-home-button",
            click: () => {
              try {
                this.$nextTick(() => {
                  if (this.profileStore.copyCatMode) {
                    this.profileStore.copyCatMode = false
                  }
                  this.$router.push('/')
                })
              } catch {
                // expected error :(
              }
            }
          })
        }


      let menuButtonSubMenu = [
        {
          text: "Load Resource", click: () => {
            try {
              this.$nextTick(() => {
                if (this.profileStore.copyCatMode) {
                  this.profileStore.copyCatMode = false
                }
                this.$router.push('/')
              })
            } catch {
              // expected error :(
            }
          }, icon: "💾"
        },
      ]

      menuButtonSubMenu.push(
        {
          text: "Copy Cat.",
          click: () => {
            if (this.$route.path.includes('edit')) {
              this.$router.push('/load')
            }
            this.profileStore.copyCatMode = !this.profileStore.copyCatMode
          },
          emoji: this.profileStore.copyCatMode ? "heavy_check_mark" : "smile_cat"
        }
      )

      const config = useConfigStore()
      if (config.returnUrls.displayLCOnlyFeatures) {
          menuButtonSubMenu.push(
            {
              text: 'LC Marva Manual',
              click: () => {
                const routeData = window.open('https://bibframe.org/docs/view/documentation-marva-manual/index.md')
              },
              icon: "📄"
            }
          )
        }

      menuButtonSubMenu.push(
        {
          text: 'User Directory',
          click: () => {
            this.showUserDirectoryModal = true
          },
          icon: "👥"
        },
        {
          text: 'FOLIO Sync Info',
          click: () => {
            this.showFolioSyncModal = true
          },
          icon: "sync"
        }
      )

      if (this.$route.path.startsWith('/edit/')) {
        menuButtonSubMenu.push({ is: 'separator' })
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
          },
          {
            text: 'Edit', icon: 'access_time', menu: [
              //  if (this.activeProfile.id && this.$route.name == 'Edit') {
                // menu.push(
                  {
                    text:"Undo",
                    title: "Undo",
                    icon: "undo",
                    hotkey: "ctrl+z",

                    click: () => { this.profileStore.undoChange() }
                  },
                  {
                    text: "Redo",
                    title: "Redo",
                    icon: "redo",
                    hotkey: "ctrl+y",
                    // class: (this.profileStore.redoRecords.length > 0) ? "active" : "inactive",
                    click: () => { this.profileStore.redoChange() }
                  },
                  {
                    text: "Title Case",
                    title: "Title Case",
                    icon: "titlecase",
                    hotkey: "ctrl+shift+t",
                    click: () => { this.profileStore.getHighlightedText('title') }
                  },
                  {
                    text: "Lower Case",
                    title: "Lower Case",
                    icon: "lowercase",
                    hotkey: "ctrl+shift+l",
                    click: () => { this.profileStore.getHighlightedText('lower') }
                  },
                  {
                    text: "Find & Replace",
                    title: "find Replace",
                    icon: "find_replace",
                    hotkey: "ctrl+shift+h",
                    click: () => { this.showFindReplaceModal = true; }
                  }
                // )
              // }
            ]
          },
        )

        if (config.returnUrls.enableStateRecorder) {
          menuButtonSubMenu.push(
            { is: 'separator' },
            {
              text: 'Load State History',
              icon: 'movie',
              click: () => { this.stateRecorderStore.promptForHistoryFile() }
            }
          )
        }
      }

      if (this.windowWidth < 1500 && config.returnUrls.displayLCOnlyFeatures) {
        let statusMenu = []
        statusMenu.push(
          {
            text: "",
            is: SystemStatus,
            profile: this.activeProfile
          }
        )

        // menuButtonSubMenu.push(
        //   { is: "separator" },
        //   {
        //     chevron: true,
        //     text: "System Info",
        //     menu: statusMenu,
        //     menu_width: 200,
        //   },
        // )
      }

      if (this.windowWidth < 1500 && this.$route.path.startsWith('/edit/') && config.returnUrls.displayLCOnlyFeatures) {
        let recordMenu = []
        recordMenu.push(
          {
            text: "",
            is: RecordHistory,
            profile: this.activeProfile,
            class: "record-history",
          }
        )

        menuButtonSubMenu.push(
          {
            chevron: true,
            text: "Record Info",
            class: "record-info",
            menu: recordMenu,
            menu_width: 750,
          },
        )
      }

      if (!this.disable.includes('Menu')) {
        menu.push(
          { text: "Menu", icon: "apps", menu: menuButtonSubMenu }
        )
      }




      if (!this.disable.includes('Tools')) {
        menu.push(
          {
            text: "Tools",
            icon: "build",
            menu: [
              {
                text: "Shelf Listing Browser", click: () => {
                  this.activeShelfListData = {}
                  this.showShelfListingModal = true
                }, icon: "🗄️"
              },

              {
                text: "AutoDewey", click: () => {
                  this.deweyData = {}
                  this.showAutoDeweyModal = true
                }, icon: "smart_toy"
              },
              ...(this.yoshinoAllowed ? [{
                text: "Subject Finder", click: () => {
                  this.showYoshinoSubjectsModal = true
                }, icon: "radar"
              }] : (useConfigStore().returnUrls.isBibframeDotOrg ? [] : [{
                text: "Req Subject Finder Access", click: () => {
                  window.open('https://forms.office.com/g/uQ36p66yN9', '_blank')
                }, icon: "contact_support"
              }])),

              ...(this.marvaScanAllowed ? [{
                text: "Marva Scan", click: () => {
                  this.marvaScanStore.openModal()
                }, icon: "qr_code_scanner"
              }] : []),

              { is: 'separator' },
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

              { is: 'separator' },
              {
                text: 'Copy Mode [' + (this.preferenceStore.copyMode ? "on" : "off") + ']',
                hotkey: 'ctrl+alt+c',
                click: () => { this.preferenceStore.toggleCopyMode() },
                icon: this.preferenceStore.copyMode ? "content_copy" : "block"
              },
              {
                text: "Paste Content",
                icon: "content_paste",
                hotkey: "alt+v",
                click: () => {
                  this.$nextTick(() => {
                    this.profileStore.pasteSelected()
                  })
                }
              },
              { is: 'separator' },
              {
                text: 'Add All Defaults',
                click: () => { this.addAllDefaults() },
                icon: "clear_all"
              }
            ]
          }
        )
      }

      if (this.$route.path.startsWith('/edit/') && this.preferenceStore.returnValue('--c-general-ad-hoc')) {
        for (let sub in menu) {
          if (menu[sub].text == 'Tools') {
            menu[sub].menu.push(
              { is: 'separator' },
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



      if (!this.disable.includes('View')) {
        menu.push(
          {
            text: "View",
            icon: "visibility",
            class: "nav-view",
            menu: [

              { text: 'Properties', click: () => this.preferenceStore.togglePanel('properties'), icon: this.panelTitleProperties },
              { text: 'Dual Edit', click: () => this.preferenceStore.togglePanel('dualEdit'), icon: this.panelTitleDualEdit },
              { text: 'Preview OPAC', click: () => this.preferenceStore.togglePanel('opac'), icon: this.panelTitleOpacEdit },

              { text: 'Preview XML', click: () => this.preferenceStore.togglePanel('xml'), icon: this.panelTitleXMLEdit, class: "nav-view-xml" },
              { text: 'Preview MARC', click: () => this.preferenceStore.togglePanel('marc'), icon: this.panelTitleMARCEdit },
              ...(this.linkedDataAllowed ? [{ text: 'Linked Data', click: () => this.preferenceStore.togglePanel('linkedData'), icon: this.panelTitleLinkedData }] : []),



              { is: 'separator' },

              {
                text: 'Quick Views', click: () => {
                  this.showPanelSizeModal = true;

                }, icon: 'width_normal'
              },



            ]
          }
        )
      }

      if (this.panelSizePresets.length > 0 && this.$route.name == 'Edit') {

        menu.push({ is: 'separator' })
        for (let aPresetButton of this.panelSizePresets) {
          menu.push(
            {
              // style: `color: ${aPresetButton.color};`, // this doesn't work
              id: "panel-size-preset-button-" + aPresetButton.id,
              class: "panel-size-preset-button nav-quick-view",
              active: aPresetButton.id == this.preferenceStore.activePanelPresetId,
              title: this.quickViewTitle(aPresetButton),
              click: () => {
                this.preferenceStore.setPanelData(aPresetButton)
              },
              icon: aPresetButton.icon
            }
          )
          // this is how we gotta set the color I guess
          this.$nextTick(() => {
            try {
              document.querySelector(`#panel-size-preset-button-${aPresetButton.id} span`).style.color = aPresetButton.color
            } catch { }
          })
        }
        menu.push({ is: 'separator' })





      }


      if (!this.disable.includes('Preferences')) {
        menu.push(
          {
            text: "Preferences", icon: "tune", menu: [

              { text: 'Preferences', click: () => this.preferenceStore.togglePrefModal('General'), icon: 'settings' },
              { is: 'separator' },

              { text: 'Scriptshifter', click: () => this.showScriptshifterConfigModal = true, icon: 'translate' },
              { text: 'Diacritic Macros', click: () => this.showDiacriticConfigModal = true, icon: 'keyboard' },
              { text: 'Text Macros', click: () => this.showTextMacroModal = true, icon: 'abc' },

              { text: 'Field Colors', click: () => this.showFieldColorsModal = true, icon: '🌈' },

              {
                text: 'Themes', icon: '🎨', menu: [

                  { text: 'Default', click: () => this.preferenceStore.setTheme('default') },
                  { text: 'Dark', click: () => this.preferenceStore.setTheme('dark') },
                  { text: 'Gray', click: () => this.preferenceStore.setTheme('gray') },



                ]
              },





              { is: 'separator' },
              { text: 'Export Prefs', click: () => this.exportPreferences(), icon: 'download' },
              { text: 'Import Prefs', click: () => this.showImportSelectionModal(), icon: 'upload' },
              { is: 'separator' },

              {
                text: 'Save to DB', click: () => this.savePrefsToDb(), icon: 'save',
                class: !config.returnUrls.displayLCOnlyFeatures ? 'hide-option' : 'no-hide'
              },
              {
                text: 'Load from DB', click: () => this.loadPrefsFromDb(), icon: 'sync',
                class: !config.returnUrls.displayLCOnlyFeatures ? 'hide-option' : 'no-hide'
              },
              { is: 'separator' },
              { text: 'Reset Prefs', click: () => this.preferenceStore.resetPreferences(), icon: 'restart_alt' },




            ]
          }
        )
      }
      if (this.$route.path.startsWith('/edit/')) {
        menu.push({ is: "separator" })

        menu.push(
          {
            text: "",
            icon: "reorder",
            disabled: (this.layoutActive) ? false : true,
            class: (this.layoutActive) ? "layout-active" : "layout-not-active",
            title: "Turn off layout",
            hotkey: "ctrl+backspace",

            click: () => {
              this.layoutActive = false
              this.layoutActiveFilter = null
              this.layoutHash = null
              this.createLayoutMode = false

              //if ad hoc mode is on cycle on/off, otherwise an initially hidden component will remain hidden
              if (this.preferenceStore.returnValue('--c-general-ad-hoc')) {
                this.showAllElements()
                this.hideAllElements()
              }
            }
          }
        )


        let layoutsMenu = []
        // If there is a custom layout loaded, options should be edit & delete
        let layoutOptions

        if (!this.layoutHash) {
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
              if (window.confirm("Do you really want to delete this layout?")) {
                this.deleteLayout()
              }
            },
            icon: "delete",
            hotkey: "ctrl+shift+d"
          }]
        }

        for (let opt in layoutOptions) {
          layoutsMenu.push(layoutOptions[opt])
        }
        layoutsMenu.push({ is: "separator" })

        for (let l in this.layouts.all) {
          layoutsMenu.push({
            text: this.layouts.all[l].label,
            click: () => {
              this.activateLayout(this.layouts.all[l])
            },

          })
        }

        const customLayouts = this.preferenceStore.returnValue("--l-custom-layouts")
        if (customLayouts != {}) {

          layoutsMenu.push({ is: "separator" })
          const layoutList = Object.keys(customLayouts)

          if (this.activeProfile == null) { return }

          for (let idx in layoutList) {
            let layout = customLayouts[layoutList[idx]]
            layoutsMenu.push({
              text: layout.label,
              hotkey: "ctrl+" + idx,
              click: () => {
                this.layoutHash = layoutList[idx]
                this.activateLayout(layout)
              },
              emoji: layout.profileId == this.activeProfile.id ? "heavy_check_mark" : "x",
              title: layout.profileId == this.activeProfile.id ? "Layout Matches Profile." : "Can't use ''" + layout.profileId + "'' layout with ''" + this.activeProfile.id + "'' profile."
            })
          }
        }

        //  menu.push(
        //     !this.createLayoutMode ? { text: "Layouts",  menu: layoutsMenu } : { text: "Save Layout", click: () => { this.saveLayout() }}
        //   )

        if (!this.createLayoutMode) {
          menu.push(
            { text: "Layouts", icon: "dashboard", menu: layoutsMenu, menu_width: 250 }
          )
          if (this.layoutActive) {
            if (this.layoutActiveFilter) {
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
            {
              text: "Save Layout", icon: "save_as", click: (e) => {
                e.stopPropagation()
                this.saveLayout()
              }
            },
            {
              text: "Cancel Layout", icon: "close", click: (e) => {
                e.stopPropagation()
                this.cancelLayout()
              }
            },
          )
        }

      }


      if (this.$route.path.startsWith('/edit/')) {
        menu.push({ is: "separator" })
      }


      if (this.$route.path.startsWith('/edit/')) {
        menu.push(
          {
            text: (this.activeProfileSaved) ? "Saved" : "Save",
            disabled: (this.activeProfileSaved) ? true : false,
            // active: this.happy,
            icon: (this.activeProfileSaved) ? "turned_in" : "turned_in_not",
            class: (this.activeProfileSaved) ? "save-saved" : "save-not-saved",
            title: "Save locally",
            hotkey: "ctrl+s",
            id: "nav-save-button",


            click: () => {
              this.playSaveAnimation('nav-save-button')
              this.profileStore.saveRecord()
            }
          }
        )

        if (config.returnUrls.enableStateRecorder) {
          menu.push(
            {
              text: this.stateRecorderStore.isRecording ? "Recording (" + this.stateRecorderStore.eventCount + ")" : "Record",
              icon: this.stateRecorderStore.isRecording ? "stop_circle" : "radio_button_checked",
              title: this.stateRecorderStore.isRecording ? "Stop recording and download the state history" : "Start recording state changes for debugging",
              class: this.stateRecorderStore.isRecording ? "state-recorder-recording" : "state-recorder-idle",
              click: () => {
                if (this.stateRecorderStore.isRecording) {
                  this.stateRecorderStore.stopRecording()
                } else {
                  this.stateRecorderStore.startRecording()
                }
              }
            }
          )
        }

        if (config.returnUrls.displayLCOnlyFeatures) {
          menu.push(
            {
              text: "Validate",
              icon: "check",
              click: () => {
                this.showValidateModal = true;
                this.$nextTick(() => {
                  this.$refs.validatemodal.post()
                })
              }
            }
          )
          menu.push(
            {
              text: "Post",
              id: "post-button",
              ref: "test",
              icon: (this.activeProfilePosted) ? "mark_email_read" : "sailing",
              click: () => {
                let conf = true
                if (this.isStaging()){
                  conf = confirm('This is Marva STAGING. It should not be used for Production work. Do you want to continue?')
                }
                if (!conf){ return }
                this.playSaveAnimation('post-button')
                this.showPostModal = true;
                this.$nextTick(() => {

                  // can't assign a ref attr to the element here so do it old way
                  // only do this the first time
                  if (!this.activeProfilePosted) {
                    document.getElementById('post-button').addEventListener('mouseenter', () => {
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
              id: "send-lcap",
              ref: "lcap",
              icon: "open_in_new",
              click: () => {
                let conf = true
                if (this.isStaging()){
                  conf = confirm('This is Marva STAGING. It should not be used for Production work. Do you want to continue?')
                }
                if (!conf) { return }
                let url = useConfigStore().returnUrls.lcap // "https://c2vwscf01.loc.gov/cflsops/toolkit-training-lcsg/lcap-productivity/marva/bibId/"
                let bibId = null
                console.log("url", url)
                // get the bibID
                for (let rt in this.activeProfile.rt) {
                  let type = rt.split(':').slice(-1)[0]
                  let url = this.activeProfile.rt[rt].URI
                  // if (this.activeProfile.marvaLocalId){
                  //   url = url.replace(this.activeProfile.eId, this.activeProfile.marvaLocalId)
                  // }
                  bibId = url.split("/")[url.split('/').length - 1]
                  break
                }
                window.open(url + bibId)
              },
              class: (this.activeProfilePosted || this.isStaging() || (this.activeProfile && this.activeProfile.status && this.activeProfile.status == 'published')) ? "record-posted-folio-ok" : "record-unposted-folio-no",
            }
          )
        }
      }

      if (this.activeProfile.id && this.$route.name == 'Edit') {
        menu.push(
          {
            text: this.profileOrStaging() + this.activeProfile.id,
            icon: "description",
            class: "current-profile",

          }
        )
      }

      if (this.activeProfile.id && this.$route.name == 'Edit' && config.returnUrls.displayLCOnlyFeatures && this.windowWidth > 1500) {
        let recordMenu = []
        recordMenu.push(
          {
            text: "",
            is: RecordHistory,
            profile: this.activeProfile,
            class: "record-history",
          }
        )

        menu.push(
          { is: "separator" },
          {
            text: "Record Info",
            icon: "history",
            menu: recordMenu,
            menu_width: 750,
            menu_id: 'record-panel'
          }
        )
      }

      // anything after this point will  be on the right of nav menu
      menu.push({ is: "spacer" })


      if (config.returnUrls.dancerEnabled && !config.returnUrls.displayAsProduction) {
        let dancerMenuItems = []
        const currentWorkspace = window.localStorage.getItem('marva-dancerWorkspace')

        for (let workspace of this.dancerWorkspaces) {
          dancerMenuItems.push({
            text: workspace.name,
            icon: currentWorkspace === workspace.id ? 'check' : '',
            click: () => {
              window.localStorage.setItem('marva-dancerWorkspace', workspace.id)
              window.location.reload()
            }
          })
        }

        if (dancerMenuItems.length === 0) {
          dancerMenuItems.push({
            text: 'Loading workspaces...',
            disabled: true
          })
        }

        // Add Legacy Profiles option at the bottom
        // We dont add the legacy profiles anymore after a period of transition
        // if (!config.returnUrls.isBibframeDotOrg) {
        //   dancerMenuItems.push({
        //     text: 'Legacy Profiles',
        //     icon: !currentWorkspace ? 'check' : '',
        //     click: () => {
        //       window.localStorage.removeItem('marva-dancerWorkspace')
        //       window.location.reload()
        //     }
        //   })
        // }

        // Find the current workspace name
        let currentWorkspaceName = ''
        // if we are in staging try to find the staging workspace name and set it
        if (config.returnUrls.env === 'staging') {
          currentWorkspaceName = 'marva-stage'
        }
        if (config.returnUrls.isBibframeDotOrg){
          currentWorkspaceName = 'marva-prod'
        }

        // if it stored in the local storage find it by name
        const selectedWorkspace = this.dancerWorkspaces.find(w => w.id === currentWorkspace)
        if (selectedWorkspace) {
          currentWorkspaceName = selectedWorkspace.name.substring(0, 10)
        }



        menu.push({
          text: 'DCTap: ' + currentWorkspaceName,
          icon: "schema",
          class: "nav-dctap",
          title: 'DCTap environment: ' + currentWorkspaceName + ' (click to change)',
          menu: dancerMenuItems
        })
      }



      // anything after this point will  be on the right of nav menu
      menu.push({ is: "spacer" })

      if (useConfigStore().returnUrls.isBibframeDotOrg && this.$route.path.startsWith('/edit/')) {
        menu.push({ is: "separator" })
        menu.push(
          {
            text: 'MARC',
            icon: "download",
            title: 'Download MARC',
            class: "nav-download",
            click: (e) => {
              this.playDownloadAnimation(e)
              this.profileStore.downloadBFDotOrg('marc')

            }
          }
        )
        menu.push(
          {
            text: 'BIBFRAME',
            icon: "download",
            title: 'Download BIBFRAME',
            class: "nav-download",
            click: (e) => {
              this.playDownloadAnimation(e)
              this.profileStore.downloadBFDotOrg('bf')

            }
          }
        )
        // Put Copy Mode options below the main menu
        if (this.preferenceStore.copyMode && this.$route.path.startsWith('/edit/')) {
          botMenu.push(
            {
              text: "Copy Selected",
              icon: "content_copy",
              id: "copy-selected-button",
              hotkey: "alt+c",
              click: () => {
                this.$nextTick(() => {
                  this.profileStore.copySelected()
                })
              }
            },
            {
              text: "Paste Content",
              icon: "content_paste",
              hotkey: "alt+v",
              click: () => {
                this.$nextTick(() => {
                  this.profileStore.pasteSelected()
                })
              }
            },
            {
              text: "Cut Selected",
              icon: "content_cut",
              click: () => {
                this.$nextTick(() => {
                  this.profileStore.copySelected(true)
                })
              }
            },
          )

          botMenu.push(

          )

          botMenu.push(
            {
              text: !this.allSelected ? "Select All" : "Deselect All",
              icon: !this.allSelected ? "select_all" : "deselect",
              click: () => {
                this.$nextTick(() => {
                  this.selectAll()
                })
              }
            }
          )
        }

        if (this.preferenceStore.copyMode && this.$route.path.startsWith('/edit/')) {
          return [
            this.fitNavMenu(menu),
            botMenu
          ]
        }
        return [this.fitNavMenu(menu)]


      }

      if (false && config.returnUrls.displayLCOnlyFeatures && this.windowWidth > 1500) {
        let statusMenu = []
        statusMenu.push(
          {
            text: "",
            is: SystemStatus,
            profile: this.activeProfile
          }
        )
        menu.push(
          {
            text: "System Info",
            icon: "monitor_heart",
            menu: statusMenu,
            menu_width: 200,
          },
        )
      }

      // User account button — shows SSO account modal or login modal
      if (this.preferenceStore.ssoUser) {
        menu.push({
          text: this.userName,
          icon: "account_circle",
          click: () => { this.showLoginModalSSO = true }
        })
      } else {
        menu.push({
          text: this.userName,
          icon: "account_circle",
          click: () => { this.showLoginModal = true }
        })
      }

      // Put Copy Mode options below the main menu
      if (this.preferenceStore.copyMode) {
        botMenu.push(
          {
            text: "Copy Selected",
            icon: "content_copy",
            id: "copy-selected-button",
            click: () => {
              this.$nextTick(() => {
                this.profileStore.copySelected()
              })
            }
          },
          {
            text: "Paste Content",
            icon: "content_paste",
            click: () => {
              this.$nextTick(() => {
                this.profileStore.pasteSelected()
              })
            }
          },
          {
            text: "Cut Selected",
            icon: "content_cut",
            click: () => {
              this.$nextTick(() => {
                this.profileStore.copySelected(true)
              })
            }
          },
        )

        botMenu.push(

        )

        botMenu.push(
          {
            text: !this.allSelected ? "Select All" : "Deselect All",
            icon: !this.allSelected ? "select_all" : "deselect",
            hotkey: "alt+a",
            click: () => {
              this.$nextTick(() => {
                this.selectAll()
              })
            }
          }
        )
      }

      if (this.preferenceStore.copyMode && this.$route.path.startsWith('/edit/')) {
        return [
          this.fitNavMenu(menu),
          botMenu
        ]
      }
      return [this.fitNavMenu(menu)]
    }
  },

  // watch: {
  //   // // whenever question changes, this function will run
  //   // question(newVal, oldVal) {
  //   //   if(newVal===true){

  //   //   }
  //   // }
  // },

  methods: {

    // animates a nav button's icon (element.animate() keeps running even when Vue redraws the button's classes)
    playClickAnimation: function (button, keyframes) {
      let icon = button && button.querySelector(':scope > .icon')
      if (icon) icon.animate(keyframes, { duration: 450, easing: 'ease' })
    },

    // the download arrow dips down when MARC or BIBFRAME is clicked
    playDownloadAnimation: function (event) {
      this.playClickAnimation(event.currentTarget, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }])
    },

    // the Save or Post button pops its icon when clicked (or on Ctrl+S)
    playSaveAnimation: function (buttonId) {
      let button = document.getElementById(buttonId)
      this.playClickAnimation(button, [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(0.9)' }, { transform: 'scale(1)' }])
    },

    // dragging a panel divider changes the view, so no Quick View is applied anymore
    onPanelResizeStart: function (event) {
      if (event.target.closest('.splitpanes__splitter')) {
        this.preferenceStore.activePanelPresetId = null
      }
    },

    isQuickView: function (item) {
      return item.is != 'separator' && /\bnav-quick-view\b/.test(item.class || '')
    },

    // tooltip for a Quick View listing the panels it shows, e.g. "Quick View: Properties, OPAC, MARC"
    quickViewTitle: function (preset) {
      let names = { properties: 'Properties', dualEdit: 'Dual Edit', opac: 'OPAC', xml: 'XML', marc: 'MARC', linkedData: 'Linked Data' }
      let shown = Object.keys(names).filter((k) => preset.view && preset.view[k]).map((k) => names[k])
      return 'Quick View: ' + (shown.length ? shown.join(', ') : 'editor only')
    },

    // the left side of the nav has no dividers (each button has its own border),
    // except one after the Home button and one between the save buttons and the Profile label
    addNavDividers: function (menu) {
      let end = menu.findIndex((m) => m.is == 'spacer')
      if (end < 0) end = menu.length
      let left = menu.slice(0, end).filter((m) => m.is != 'separator')
      let profile = left.findIndex((m) => /current-profile/.test(m.class || ''))
      if (profile > 0) left.splice(profile, 0, { is: 'separator' })
      let home = left.findIndex((m) => /nav-home-button/.test(m.class || ''))
      if (home > -1 && home < left.length - 1) left.splice(home + 1, 0, { is: 'separator' })
      return left.concat(menu.slice(end))
    },

    // move the right-most items into a "More" menu so the nav stays on one row
    fitNavMenu: function (menu) {
      menu = this.addNavDividers(menu)
      if (!this.navOverflowCount) {
        return menu
      }
      let isItem = (m) => m.is != 'spacer' && m.is != 'separator'
      let visible = [...menu]
      let overflow = []
      let moved = 0
      while (moved < this.navOverflowCount && visible.some(isItem)) {
        let item = visible.pop()
        if (this.isQuickView(item)) {
          // View and its Quick Views move together: the Quick Views go at the top of View's sub menu
          let quickViews = [item]
          while (visible.length && this.isQuickView(visible.at(-1))) {
            quickViews.unshift(visible.pop())
          }
          while (visible.length && visible.at(-1).is == 'separator') {
            visible.pop()
          }
          let view = (visible.length && /\bnav-view\b/.test(visible.at(-1).class || '')) ? visible.pop() : null
          let rows = quickViews.map((q) => ({ ...q, text: 'Quick View' }))
          if (view) {
            overflow.unshift({ ...view, menu: [...rows, { is: 'separator' }, ...view.menu] })
          } else {
            overflow.unshift(...rows)
          }
          moved += quickViews.length + (view ? 1 : 0)
        } else if (isItem(item)) {
          overflow.unshift((!item.text && item.title) ? { ...item, text: item.title } : item)
          moved++
        } else if (item.is == 'separator' && overflow.length && overflow[0].is != 'separator') {
          overflow.unshift({ is: 'separator' })
        }
      }
      while (visible.length && visible.at(-1).is == 'separator') {
        visible.pop()
      }
      if (!visible.some((m) => m.is == 'spacer')) {
        visible.push({ is: 'spacer' })
      }
      visible.push({ icon: 'menu', title: 'More', class: 'nav-overflow-menu', menu_class: 'align-right', menu_width: 220, menu: overflow })
      return visible
    },

    navWraps: function () {
      let bar = document.querySelector('#nav-holder .bar')
      if (!bar) {
        return false
      }
      let items = [...bar.children].filter((el) => el.offsetHeight > 0)
      let firstButton = items.find((el) => el.classList.contains('bar-button'))
      if (!firstButton) {
        return false
      }
      // an item has wrapped if it starts below the bottom of the first row
      let rowBottom = firstButton.offsetTop + firstButton.offsetHeight - 1
      return items.some((el) => el.offsetTop >= rowBottom)
    },

    fitNav: async function (reset = false) {
      if (this.fittingNav) {
        return
      }
      this.fittingNav = true
      if (reset && this.navOverflowCount) {
        this.navOverflowCount = 0
        await this.$nextTick()
      }
      while (this.navWraps() && this.navOverflowCount < 50) {
        this.navOverflowCount++
        await this.$nextTick()
      }
      this.fittingNav = false
    },

    onNavResize: function () {
      window.cancelAnimationFrame(this.navResizeFrame)
      this.navResizeFrame = window.requestAnimationFrame(() => this.fitNav(true))
    },

    profileOrStaging(){ // TODO: get this back on the nav bar
      if (this.isStaging()) {
        return  "STAGING: "
      }
      return "Profile: "
    },

    isStaging: function () {
      if (useConfigStore().returnUrls.displayAsProduction) {
        return false
      }
      if (useConfigStore().returnUrls.env == "staging" || useConfigStore().returnUrls.dev == true) {
        return true
      } else {
        return false
      }
    },

    returnPixleAsPercent: function (pixles) {
      return pixles / window.innerHeight * 100
    },

    activateLayout(layout) {
      this.layoutActive = true
      this.layoutActiveFilter = layout
    },

    createLayout: function () {
      this.createLayoutMode = true
    },

    editLayout: function () {
      let target = this.layoutActiveFilter
      this.createLayoutMode = true
    },

    deleteLayout: function (hash = null) {
      let targetHash
      if (hash) {
        targetHash = hash
      } else {
        targetHash = this.layoutHash
      }
      this.preferenceStore.deleteLayout(targetHash)
      this.layoutActive = false
      this.layoutActiveFilter = null
      this.layoutHash = null
    },

    saveLayout: function () {
      let saved = this.preferenceStore.saveLayout()
      let l
      const customLayouts = this.preferenceStore.returnValue("--l-custom-layouts")
      this.layoutHash = saved
      l = customLayouts[this.layoutHash]
      // switch to the new layout
      this.activateLayout(l)
      if (saved) {
        this.createLayoutMode = false
      }
    },

    cancelLayout: function () {
      this.createLayoutMode = false
      this.layoutActive = false
      this.layoutActiveFilter = null
      this.layoutHash = null
    },

    selectAll: function () {
      let checkBoxes = document.getElementsByClassName("copy-selection")
      this.allSelected = !this.allSelected

      checkBoxes.forEach((el) => {
        if (this.allSelected) {
          el.checked = true
        } else {
          el.checked = false
        }
      })
    },

    exportPreferences: function () {
      let prefs = null
      let scriptShifterOptions = null
      let diacriticUse = null
      let marvaComponentLibrary = null

      let data = {}

      if (window.localStorage.getItem('marva-preferences')) {
        prefs = JSON.parse(window.localStorage.getItem('marva-preferences'))
        data["prefs"] = prefs
      } else {
        alert("Couldn't find preferences to export. :(")
      }
      if (window.localStorage.getItem('marva-scriptShifterOptions')) {
        scriptShifterOptions = JSON.parse(window.localStorage.getItem('marva-scriptShifterOptions'))
        data["scriptShifterOptions"] = scriptShifterOptions
      } else {
        console.warn("Couldn't find ScriptShifter preferences to export. :(")
      }
      if (window.localStorage.getItem('marva-diacriticUse')) {
        diacriticUse = JSON.parse(window.localStorage.getItem('marva-diacriticUse'))
        data["diacriticUse"] = diacriticUse
      } else {
        console.warn("Couldn't find Diacritic preferences to export. :(")
      }

      if (window.localStorage.getItem('marva-componentLibrary')) {
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

    getImportSelection: function (selection) {
      this.importSelection = selection

      if (this.importSelection.length > 0) {
        this.showSelectionModal = false
      } else {
        alert("Nothing is selected.")
      }

      this.importPreferences(this.importSelection)
    },

    closeImportSelection: function () {
      this.showSelectionModal = false
    },

    showImportSelectionModal: function () {
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

    loadPrefsFromDb: async function () {
      if (!useConfigStore().returnUrls.displayLCOnlyFeatures) { return }
      let user = this.userName
      let response = await this.preferenceStore.getPrefsFromDB(user)

      for (let key of Object.keys(response.result)) {
        if (key == 'prefs') {
          window.localStorage.setItem('marva-preferences', JSON.stringify(response.result[key]))
        } else if (key == 'marvaComponentLibrary') {
          window.localStorage.setItem('marva-componentLibrary', JSON.stringify(response.result[key]))
        } else {
          window.localStorage.setItem(key, JSON.stringify(response.result[key]))
        }
      }

      // reload preferences
      this.preferenceStore.loadPreferences()
    },

    savePrefsToDb: async function () {
      if (!useConfigStore().returnUrls.displayLCOnlyFeatures) { return }
      let overwrite = confirm("This will update your preferences saved in the database. Do you want to continue?")
      if (!overwrite) { return }

      let user = this.userName
      let response = await this.preferenceStore.setPrefsToDB(user)
      return response
    },

    importPreferences: function (selection = null) {
      const that = this

      var temp = document.createElement("input")
      temp.type = "file"
      temp.id = "file-input"
      temp.addEventListener('change', function (e) {
        var file = e.target.files[0]
        if (!file) { return }
        let reader = new FileReader()

        reader.onload = function (e) {
          var contents = JSON.parse(e.target.result)

          if (selection && selection.includes('all')) {
            that.preferenceStore.loadPreferences(contents["prefs"])
            window.localStorage.setItem('marva-preferences', JSON.stringify(contents["prefs"]))
          }

          if (contents["scriptShifterOptions"] && (selection && (selection.includes('scriptShifter') || selection.includes('all')))) {
            that.preferenceStore.scriptShifterOptions = contents["scriptShifterOptions"]
            window.localStorage.setItem('marva-scriptShifterOptions', JSON.stringify(contents["scriptShifterOptions"]))
          }

          if (contents["marvaComponentLibrary"] && (selection && (selection.includes('componentLibrary') || selection.includes('all')))) {
            that.preferenceStore.componentLibrary = contents["marvaComponentLibrary"]
            window.localStorage.setItem('marva-componentLibrary', JSON.stringify(contents["marvaComponentLibrary"]))
          }

          if (contents["diacriticUse"] && (selection && (selection.includes('diacriticMacro') || selection.includes('all')))) {
            that.preferenceStore.diacriticUse = contents["diacriticUse"]
            window.localStorage.setItem('marva-diacriticUse', JSON.stringify(contents["diacriticUse"]))
            that.preferenceStore.buildDiacriticSettings()

            const incoming = contents.prefs['styleDefault']['--c-diacritics-enabled-macros'].value
            that.preferenceStore.setValue('--c-diacritics-enabled-macros', incoming)
          }

          if (selection && (selection.includes('textMacro') || selection.includes('all'))) {
            const incoming = contents.prefs['styleDefault']['--o-diacritics-text-macros'].value
            that.preferenceStore.setValue('--o-diacritics-text-macros', incoming)
          }

          if (selection && (selection.includes('layouts') || selection.includes('all'))) {
            const incoming = contents.prefs['styleDefault']['--l-custom-layouts'].value
            that.preferenceStore.setValue('--l-custom-layouts', incoming)
          }

          if (selection && (selection.includes('style') || selection.includes('all'))) {
            for (let item in contents.prefs['styleDefault']) {
              if (!['--l-custom-layouts', '--o-diacritics-text-macros', '--c-diacritics-enabled-macros'].includes(item)) {
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

    addInstance: function (secondary = false) {
      let lccn = "" //prompt("Enter an LCCN for this Instance.")
      this.profileStore.createInstance(secondary, lccn)
    },

    addItem: function () {
      let lccn = "" //prompt("Enter an LCCN for this Item.")
      let instanceCount = 0
      let instance = null
      for (let p in this.activeProfile.rt) {
        if (p.includes(":Instance")) {
          this.instances.push(p)
          instanceCount++
        }
      }
      if (instanceCount == 0) {
        alert("There are no instances in the record. You need to crete one before you can add an item.")
        return
      }
      if (instanceCount > 1) {
        // show a modal to select which instance the item belongs too
        this.showItemInstanceSelection = true
      } else {
        this.profileStore.createItem(this.targetInstance, lccn)
      }
    },

    setInstance: function (data) {
      this.targetInstance = this.instances[data]
      this.showItemInstanceSelection = false
      this.instances = []
      this.profileStore.createItem(this.targetInstance)
    },

    hideInstanceSelectionModal: function () {
      this.instances = []
      this.showItemInstanceSelection = false;
    },

    // Show all hidden elements
    showAllElements: function () {
      for (let key in this.emptyComponents) {
        this.emptyComponents[key] = []
      }
    },

    // Hide all empty elements
    hideAllElements: function () {
      for (let rt in this.activeProfile.rt) {
        this.emptyComponents[rt] = []
        for (let element in this.activeProfile.rt[rt].pt) {
          this.profileStore.addToAdHocMode(rt, element)
        }
      }
    },

    fetchDancerWorkspaces: async function () {
      const config = useConfigStore()
      if (!config.returnUrls.dancerEnabled || !config.returnUrls.dancerWorkspaceList) {
        return
      }

      try {
        const response = await fetch(config.returnUrls.dancerWorkspaceList)
        const data = await response.json()
        if (data.success && data.data) {
          this.dancerWorkspaces = data.data
        }
      } catch (error) {
        console.error('Failed to fetch dancer workspaces:', error)
      }
    },

    addAllDefaults: function () {
      this.profileStore.addAllDefaults()

    }
  },

  mounted() {
    this.fetchDancerWorkspaces()
    window.addEventListener('resize', this.onNavResize)
    this.$nextTick(() => this.fitNav(true))
    document.addEventListener('pointerdown', this.onPanelResizeStart)
  },

  updated() {
    // menu contents change (record loaded, labels update), re-check without resetting open menus
    this.fitNav()
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.onNavResize)
    document.removeEventListener('pointerdown', this.onPanelResizeStart)
    window.cancelAnimationFrame(this.navResizeFrame)
  }
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
  /* hover, open and active backgrounds are see-through tints so they work on any nav background color
     (solid light colors here made the white text unreadable in dark mode) */
  --bar-button-hover-bkg: rgba(128, 128, 128, 0.1);
  --bar-button-active-color: rgb(26, 115, 232);
  --bar-button-active-bkg: rgba(26, 115, 232, 0.15);
  --bar-button-open-color: rgb(32, 33, 36);
  --bar-button-open-bkg: rgba(26, 115, 232, 0.15);
  --bar-menu-item-active-bkg: rgba(26, 115, 232, 0.25);
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

.bars>.bar:first-child {
  border-bottom: 1px solid rgb(218, 220, 224);
  /* margin-bottom: 3px; */
}

.bars>.bar:fist-child {
  border-bottom: 1px solid rgb(218, 220, 224);
  /* margin-bottom: 3px; */
}

.bar {
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-font-size')") !important;
  height: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-height', true) - 1 + 'px'") !important;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-font-color')") !important;
}

.bar-button {
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-font-color')") !important;
}

/* left and right padding of the top level dropdown menus */
#nav-holder .bar > .bar-button:has(> .menu):not(.nav-overflow-menu) {
  padding-left: 4px;
  padding-right: 4px;
}

/* nav button icon size, icon visibility and border color come from Preferences > Nav Bar (Home and Quick Views keep their own icon size) */
#nav-holder .bar {
  --bar-button-icon-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-icon-size')");
  --nav-button-border-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-button-border-color')");
}
#nav-holder .bar > .bar-button:not(.panel-size-preset-button):not(.nav-overflow-menu) > .icon {
  display: v-bind(navIconDisplay);
}


/* every top level button gets a light backdrop and a border so each section is easy to tell apart */
#nav-holder .bar > .bar-button:not(.nav-overflow-menu) {
  align-self: stretch;
  margin: 0 2px;
  background: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-button-color')");
  box-shadow: inset 0 0 0 1px var(--nav-button-border-color);
}
/* buttons get the same highlight on hover as the dropdown menus
   (not the Profile label, which isn't a button, disabled buttons like "Saved", the DCTap picker, which keeps its own colors,
   or an active Quick View, which keeps its stronger highlight) */
#nav-holder .bar > .bar-button:not(.nav-overflow-menu, .disabled, .current-profile, .nav-dctap, .active):hover {
  background: var(--bar-button-open-bkg);
}
/* buttons press in while clicked: a stronger highlight and a slight shrink
   (Save, Post and the downloads also animate their icon, see playClickAnimation;
   dropdowns don't shrink since their open menu is inside the button and would shrink with it) */
#nav-holder .bar > .bar-button {
  transition: transform 0.1s ease, background-color 0.1s ease;
}
#nav-holder .bar > .bar-button:not(.disabled, .current-profile, :has(> .menu)):active {
  transform: scale(0.94);
}
#nav-holder .bar > .bar-button:not(.nav-overflow-menu, .disabled, .current-profile, .nav-dctap):active {
  background: rgba(26, 115, 232, 0.3);
}
#nav-holder .bar > .bar-button.open:hover {
  background: var(--bar-button-open-bkg);
}
/* dropdown menus open on hover, so they get the same highlight on hover as when they're clicked open */
#nav-holder .bar > .bar-button:has(> .menu):hover {
  background: var(--bar-button-open-bkg);
}
#nav-holder .bar > .bar-button.active {
  background: var(--bar-button-active-bkg);
}

/* DCTap environment picker and the Profile label get their own border and text color (set in Preferences > Nav Bar) so they read as settings
   (the Profile label keeps its own background color from the theme) */
#nav-holder .bar > .bar-button.nav-dctap:has(> .menu),
#nav-holder .bar > .bar-button.current-profile {
  padding: 2px 10px;
  box-shadow: inset 0 0 0 1.5px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-setting-border-color')");
}
/* keep the Profile label's original space from the save buttons */
#nav-holder .bar > .bar-button.current-profile {
  margin-left: 100px;
}
#nav-holder .bar > .nav-dctap > span,
#nav-holder .bar > .current-profile > span {
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-setting-font-color')");
}
#nav-holder .bar > .bar-button.nav-dctap:has(> .menu) {
  background: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-setting-background-color')");
}
#nav-holder .bar > .bar-button.nav-dctap:has(> .menu):hover {
  background: linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05)), v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-setting-background-color')");
}
/* !important is needed here to replace the Profile label's own theme background color */
#nav-holder .bar > .bar-button.current-profile {
  background: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-setting-background-color')") !important;
}

/* the View dropdown and its Quick View icons join into one block with one outer border */
#nav-holder .bar > .bar-button.nav-view:has(+ .nav-quick-view),
#nav-holder .bar > .bar-button.nav-quick-view {
  border-radius: 0;
  margin-left: 0;
  margin-right: 0;
  box-shadow: inset 0 1px 0 var(--nav-button-border-color), inset 0 -1px 0 var(--nav-button-border-color);
}
#nav-holder .bar > .bar-button.nav-view:has(+ .nav-quick-view) {
  margin-left: 2px;
  border-radius: var(--bar-button-radius) 0 0 var(--bar-button-radius);
  box-shadow: inset 1px 0 0 var(--nav-button-border-color), inset 0 1px 0 var(--nav-button-border-color), inset 0 -1px 0 var(--nav-button-border-color);
}
#nav-holder .bar > .bar-button.nav-quick-view:not(:has(+ .nav-quick-view)) {
  margin-right: 2px;
  border-radius: 0 var(--bar-button-radius) var(--bar-button-radius) 0;
  box-shadow: inset -1px 0 0 var(--nav-button-border-color), inset 0 1px 0 var(--nav-button-border-color), inset 0 -1px 0 var(--nav-button-border-color);
}
/* the active Quick View gets a stronger background and a blue underline so it stands out from the others
   (its icon keeps the color set for that Quick View) */
#nav-holder .bar > .bar-button.nav-quick-view.active {
  background: rgba(26, 115, 232, 0.3);
}
#nav-holder .bar > .bar-button.nav-quick-view.active::after {
  content: "";
  position: absolute;
  left: 3px;
  right: 3px;
  bottom: 1px;
  height: 3px;
  border-radius: 2px;
  background: rgb(26, 115, 232);
}


.bar-menu-items {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-background-color')") !important;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-font-color')") !important;
}





.nav-icon-color {
  fill: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-font-color')") !important;
}

.panel-size-preset-button .icon {
  font-size: calc(v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-font-size')") * 1.25) !important;
}

/* slightly bigger home icon, still scales with the nav font size preference */
.panel-size-preset-button.nav-home-button .icon {
  font-size: calc(v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-font-size')") * 1.4) !important;
}

.bar-menu .current-profile {
  margin-left: 0;
}

/* keep the overflow button clear of the browser's scrollbar */
.bar .nav-overflow-menu {
  margin-right: 16px;
  --bar-button-icon-size: 20px;
}

/* the overflow menu sits at the right edge, so open its sub-menus to the left */
.bar .nav-overflow-menu .bar-menu-item > .menu {
  left: auto !important;
  right: 100%;
}

/* keep the menu's hover zone inside the window so opening it doesn't add scrollbars */
.bar .nav-overflow-menu > .menu > .extended-hover-zone {
  right: 0;
}

/* dropdown menus open on hover (plain buttons don't), so it's easy to tell a menu from a button */
#nav-holder .bar > .bar-button:hover > .menu {
  display: block;
}

/* the "More" menu stays open for a second after the mouse leaves it, so it's easy to move into */
#nav-holder .bar > .nav-overflow-menu > .menu {
  display: block;
  visibility: hidden;
  transition: visibility 0s linear 1s;
}
#nav-holder .bar > .nav-overflow-menu:hover > .menu {
  visibility: visible;
  transition-delay: 0s;
}
/* ...but it closes right away when another top level button is hovered */
#nav-holder .bar:has(> .bar-button:not(.nav-overflow-menu):hover) > .nav-overflow-menu > .menu {
  visibility: hidden;
  transition: none;
}

.current-profile {
  /* background: var(--bar-button-hover-bkg, #f1f3f4); */

  background-color: v-bind("preferenceStore.returnValue('--c-edit-modals-background-color-accent')") !important;

  margin-left: 100px;
}

.record-unposted-folio-ok {
  pointer-events: all;
}

.record-unposted-folio-no {
  pointer-events: none;
  opacity: .5;
}

.record-posted .icon {
  color: green !important;
}

.save-not-saved span {
  color: orangered !important;
}

.save-saved span {
  color: v-bind(savedTextColor) !important;
}

.layout-active {
  /* background-color: chartreuse !important; */
  cursor: pointer;
}

.layout-not-active {
  display: none !important;
}

.active-layout-label:hover,
.active-layout-label {
  background: rgb(30, 231, 57) !important;
}

.hide-option {
  display: none !important;
}

.state-recorder-recording,
.state-recorder-recording .icon {
  color: red !important;
}

.state-recorder-recording .icon {
  animation: state-recorder-pulse 1.2s infinite;
}

@keyframes state-recorder-pulse {
  50% {
    opacity: 0.35;
  }
}
</style>

<style scoped>
#nav-holder {
  position: absolute;
  /* sits below the message of the day banner when one is showing */
  top: v-bind("motdHeight + 'px'");
  left: 0;
  width: 100vw;
  height: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-height', true) - 1 + 'px'");
}

.bar :deep(.bar-menu) > .extended-hover-zone {
  top: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-nav-height', true) - 35 + 'px'")
}

.staging-warning {
  background-color: rgb(255, 196, 0) !important;
}

:deep() div.bar-button.inactive {
  pointer-events: none;
}


</style>
