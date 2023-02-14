<template>
  <div> 

    <Teleport to="body">
      <div id="nav-holder">
        <vue-file-toolbar-menu :content="my_menu" />
      </div>
    </Teleport>

  </div>
</template>


<script>
  import { useProfileStore } from '@/stores/profile'
  import { usePreferenceStore } from '@/stores/preference'
  import { mapStores, mapState } from 'pinia'
  import VueFileToolbarMenu from 'vue-file-toolbar-menu'


  export default {
    components: { VueFileToolbarMenu },
    data() {
      return {
         happy: false,
         test:'testsss'
      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,usePreferenceStore),
      // // gives read access to this.count and this.double
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','rtLookup']),
      ...mapState(usePreferenceStore, ['styleDefault', 'showPrefModal', 'panelDisplay']),


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

      my_menu () {
        return [
            {
            html: `
                <svg width="25px" height="25px" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                 <g class="nav-icon-color" >
                  <path d="m55.5 34.398-20.199 63.102 11.898-1.1992 31.199-63.801z"/>
                  <path d="m59.898 4.5-3.1992 23.898 21.199-1.6992z"/>
                  <path d="m54.301 2.5-26.699 11.699 23.398 12.801z"/>
                  <path d="m24.102 18.898-2.5 69.301 8.0977 7.8008 20.102-63z"/>
                 </g>
                </svg>
                `,         
          },

          { text: "Menu",  menu: [
            { text: "Item 1", click: () => alert("Action 1") },
            { text: "Item 2", click: () => alert("Action 2") }
          ] },
          { text: "View",  menu: [     

            { text: 'Properties', click: () => this.preferenceStore.togglePanel('properties'), icon: this.panelTitleProperties },
            { text: 'Dual Edit', click: () => this.preferenceStore.togglePanel('dualEdit'), icon: this.panelTitleDualEdit },
            { text: 'Preview OPAC', click: () => this.preferenceStore.togglePanel('opac'), icon: this.panelTitleOpacEdit },

            { text: 'Preview XML', click: () => this.preferenceStore.togglePanel('xml'), icon: this.panelTitleXMLEdit },
            { text: 'Preview MARC', click: () => this.preferenceStore.togglePanel('marc'), icon: this.panelTitleMARCEdit },



            { is: 'separator'},


            { text: "Preferences", menu: [
              { text: 'Panels - Propert List', click: () => this.preferenceStore.togglePrefModal('Sidebars - Property')}




            ]},


          ] }



        ]
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
      }



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
