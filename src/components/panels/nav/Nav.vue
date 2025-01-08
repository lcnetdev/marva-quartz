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


  export default {
    components: { VueFileToolbarMenu, PostModal, ValidateModal,RecoveryModal },
    data() {
      return {
        allSelected: false,
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

      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','rtLookup', 'activeProfileSaved']),
      ...mapState(usePreferenceStore, ['styleDefault', 'showPrefModal', 'panelDisplay']),
      ...mapState(useConfigStore, ['layouts']),
      ...mapWritableState(usePreferenceStore, ['showLoginModal','showScriptshifterConfigModal','showDiacriticConfigModal','showTextMacroModal','layoutActiveFilter','layoutActive','showFieldColorsModal']),
      ...mapWritableState(useProfileStore, ['showPostModal', 'showShelfListingModal', 'activeShelfListData','showValidateModal', 'showRecoveryModal']),
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
                this.$router.push('/load')
              })
            }catch{
              // expected error :(
            }
            }, icon:"💾" }
        ]


        if (this.$route.path.startsWith('/edit/')){
          menuButtonSubMenu.push({ is: 'separator'})            
          menuButtonSubMenu.push(
            {
              text: 'Add Additional Instance',
              click: () => { this.profileStore.createInstance(false) }
            },
            {
              text: 'Add Secondary Instance',
              click: () => { this.profileStore.createInstance(true) }
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
            }
          ] }
          )
          


        }



        if (!this.disable.includes('View')){
          menu.push(
            { text: "View",  menu: [

              { text: 'Properties', click: () => this.preferenceStore.togglePanel('properties'), icon: this.panelTitleProperties },
              { text: 'Dual Edit', click: () => this.preferenceStore.togglePanel('dualEdit'), icon: this.panelTitleDualEdit },
              { text: 'Preview OPAC', click: () => this.preferenceStore.togglePanel('opac'), icon: this.panelTitleOpacEdit },

              { text: 'Preview XML', click: () => this.preferenceStore.togglePanel('xml'), icon: this.panelTitleXMLEdit },
              { text: 'Preview MARC', click: () => this.preferenceStore.togglePanel('marc'), icon: this.panelTitleMARCEdit },



              { is: 'separator'},


            ] }
          )
        }

        if (!this.disable.includes('Preferences')){
          menu.push(
            { text: "Preferences",  menu: [

              { text: 'Scriptshifter', click: () => this.showScriptshifterConfigModal = true, icon: 'translate' },
              { text: 'Diacritic Macros', click: () => this.showDiacriticConfigModal = true, icon: 'keyboard' },
              { text: 'Text Macros', click: () => this.showTextMacroModal = true, icon: 'abc' },

              { text: 'Field Colors', click: () => this.showFieldColorsModal = true, icon: '🌈' },


              



              { is: 'separator'},


              { text: 'General', click: () => this.preferenceStore.togglePrefModal('General')},
              { text: 'Edit Panel', click: () => this.preferenceStore.togglePrefModal('Edit Panel')},
              { text: 'Literal Field', click: () => this.preferenceStore.togglePrefModal('Literal Field')},
              { text: 'Complex Lookup', click: () => this.preferenceStore.togglePrefModal('Complex Lookup')},
              { text: 'Action Button', click: () => this.preferenceStore.togglePrefModal('Action Button')},
              { text: 'Nav Bar', click: () => this.preferenceStore.togglePrefModal('Nav Bar')},
              { text: 'Sidebars - Previews', click: () => this.preferenceStore.togglePrefModal('Sidebars - Previews')},
              { text: 'Sidebars - Property', click: () => this.preferenceStore.togglePrefModal('Sidebars - Property')},
              { text: 'Shelflisting', click: () => this.preferenceStore.togglePrefModal('Shelflisting')},


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

              click: () => {
                this.layoutActive=false
                this.layoutActiveFilter=null
              }
            }
          )            

           let layoutsMenu = []
           
           for (let l in this.layouts.all ){

            layoutsMenu.push({
              text: this.layouts.all[l].label,              
              click: () => {
                this.activateLayout(this.layouts.all[l])
              }

            })
           }

            menu.push(
              { text: "Layouts",  menu: layoutsMenu }
            )

        }
        

        if (this.$route.path.startsWith('/edit/')){
          menu.push({ is: "separator" })
        }


        if (this.$route.path.startsWith('/edit/')){
          menu.push(
          {
            text: (this.activeProfileSaved) ? "Saved" : "Save",
            disabled: (this.activeProfileSaved) ? true : false,
            icon: (this.activeProfileSaved) ? "turned_in" : "turned_in_not",
            class: (this.activeProfileSaved) ? "save-saved" : "save-not-saved",
            click: () => { this.profileStore.saveRecord() }
          }
          )
          menu.push(
            {
              text: "Post",
              icon: "sailing",
              click: () => {
                this.showPostModal = true;
                this.$nextTick(()=>{
                  this.$refs.postmodal.post();
                  this.profileStore.saveRecord()
                })
              }
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
                }
              )
              
              menu.push(
                {
                  text: "Paste Content",
                  icon: "content_paste",
                  click: () => {
                    this.$nextTick(()=>{
                      this.profileStore.pasteSelected()
                    })
                  }
                }
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



        
          

        menu.push(

        {
            text: this.userName,
            // active: this.happy,
            icon: "account_circle",
            class: "login-menu",
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

      returnPixleAsPercent: function(pixles){
        return pixles/window.innerHeight*100
      },

      activateLayout(layout){


        
        this.layoutActive = true
        this.layoutActiveFilter = layout


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
      
    },

    created() {




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
      --bar-button-hover-bkg: rgb(241, 243, 244);
      --bar-button-active-color: rgb(26, 115, 232);
      --bar-button-active-bkg: rgb(232, 240, 254);
      --bar-button-open-color: rgb(32, 33, 36);
      --bar-button-open-bkg: rgb(232, 240, 254);
      --bar-menu-bkg: white;
      --bar-menu-border-radius: 0 0 3px 3px;
      --bar-menu-item-chevron-margin: 0;
      --bar-menu-item-hover-bkg: rgb(241, 243, 244);
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

    .login-menu{

      position: absolute !important;
      right: 0;
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
