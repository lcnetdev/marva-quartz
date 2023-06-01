import { defineStore } from 'pinia'
import { getCurrentInstance } from 'vue'


export const usePreferenceStore = defineStore('preference', {
  state: () => ({


    // controls showing the modal that is parked in the App.vue
    showPrefModal: false,
    // which group to display in the modal
    showPrefModalGroup: 'Sidebars - Property',

    showDebugModal: false,
    debugModalData: {},

    fontFamilies: ['Avenir, Helvetica, Arial, sans-serif','serif','sans-serif','monospace','cursive','fantasy','system-ui','ui-serif','ui-sans-serif','ui-monospace','ui-rounded'],
   


    panelDisplay:{

      properties:true,
      dualEdit: false,
      opac: true,
      xml:false,
      marc: false


    },


    styleDefault: {




      // the left properties panel

      '--c-edit-main-splitpane-properties-background-color' : {
          value:'#2a2a2a',
          desc: 'The background color of the properties side bar on the edit screen.',
          descShort: 'Background Color',
          type: 'color',
          group: 'Sidebars - Property',
          range: null
        },
      '--c-edit-main-splitpane-properties-highlight-background-color' : {
          value:'#6f6f6f',
          desc: 'The background color of the field when selected or hovered.',
          descShort: 'Highlight Color',
          type: 'color',
          group: 'Sidebars - Property',
          range: null
       },

      '--n-edit-main-splitpane-properties-width' : {
          desc: 'The width of the property side bar on the edit screen.',
          descShort: 'Sidebar width',
          value: 5,
          type: 'number',
          step: 1,
          group: 'Sidebars - Property',
          range: [5,100]
      },

      '--n-edit-main-splitpane-properties-font-size' : {
          desc: 'The fontsize of the text in the property list side bar.',
          descShort: 'Font Size',
          value: 1,
          step: 0.01,
          type: 'number',
          unit: 'em',
          group: 'Sidebars - Property',
          range: [1,2]
      },
      '--c-edit-main-splitpane-properties-font-family' : {
          value:'Avenir, Helvetica, Arial, sans-serif',
          desc: 'The font of the text in the property list.',
          descShort: 'Font',
          type: 'font',
          group: 'Sidebars - Property',
          range: null
      },

      '--c-edit-main-splitpane-properties-font-color' : {
          value:'#fff',
          desc: 'The font color of the text in the property list.',
          descShort: 'Text Color',
          type: 'color',
          group: 'Sidebars - Property',
          range: null
      },
      '--c-edit-main-splitpane-properties-empty-indicator-color' : {
          value:'#6f6f6f',
          desc: 'Color of the dot indicating the field is empty.',
          descShort: 'Empty indicator color',
          type: 'color',
          group: 'Sidebars - Property',
          range: null
      },
      '--c-edit-main-splitpane-properties-populated-indicator-color' : {
          value:'green',
          desc: 'Color of the checkmark indicating the field is populated.',
          descShort: 'Populated indicator color',
          type: 'color',
          group: 'Sidebars - Property',
          range: null
      },
      '--c-edit-main-splitpane-properties-populated-indicator-color' : {
          value:'green',
          desc: 'Color of the checkmark indicating the field is populated.',
          descShort: 'Populated indicator color',
          type: 'color',
          group: 'Sidebars - Property',
          range: null
      },

      '--b-edit-main-splitpane-properties-no-scrollbar' : {
          desc: 'Do not display a scroll bar in the property side panel.',
          descShort: 'No Scrollbar',
          value: true,
          type: 'boolean',
          unit: null,
          group: 'Sidebars - Property',
          range: [true,false]
      },
      '--b-edit-main-splitpane-properties-show-types' : {
          desc: 'Show all type labels, such as "Variant Title" under "Title".',
          descShort: 'Type Labels',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'Sidebars - Property',
          range: [true,false]
      },
      '--b-edit-main-splitpane-properties-number-labels' : {
          desc: 'Add a number to the labels of the properties',
          descShort: 'Number Labels',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'Sidebars - Property',
          range: [true,false]
      },


      '--b-edit-main-splitpane-properties-accordion' : {
          desc: 'The property list expands and contracts.',
          descShort: 'Accordion List',
          value: true,
          type: 'boolean',
          unit: null,
          group: 'Sidebars - Property',
          range: [true,false]
      },

      // not implemented
      // '--b-edit-main-splitpane-properties-accordion-autoclose' : {
      //     desc: 'The accordion closes by itself.',
      //     descShort: 'Accordion List - Autoclose',
      //     value: true,
      //     type: 'boolean',
      //     unit: null,
      //     group: 'Sidebars - Property',
      //     range: [true,false]
      // },

      // preview - opac

      '--c-edit-main-splitpane-opac-background-color' : {
          value:'#f2f2f2',
          desc: 'The background color of the opac side bar on the edit screen.',
          descShort: 'Background Color',
          type: 'color',
          group: 'Sidebars - OPAC',
          range: null
        },
      '--c-edit-main-splitpane-opac-highlight-background-color' : {
          value:'#6f6f6f',
          desc: 'The background color of the field when selected or hovered.',
          descShort: 'Highlight Color',
          type: 'color',
          group: 'Sidebars - OPAC',
          range: null
       },

      '--n-edit-main-splitpane-opac-width' : {
          desc: 'The width of the property side bar on the edit screen.',
          descShort: 'Sidebar width',
          value: 5,
          type: 'number',
          step: 1,
          group: 'Sidebars - OPAC',
          range: [5,100]
      },

      '--n-edit-main-splitpane-opac-font-size' : {
          desc: 'The fontsize of the text in the property list side bar.',
          descShort: 'Font Size',
          value: 1,
          step: 0.01,
          type: 'number',
          unit: 'em',
          group: 'Sidebars - OPAC',
          range: [1,2]
      },
      '--c-edit-main-splitpane-opac-font-family' : {
          value:'Avenir, Helvetica, Arial, sans-serif',
          desc: 'The font of the text in the property list.',
          descShort: 'Font',
          type: 'font',
          group: 'Sidebars - OPAC',
          range: null
      },

      '--c-edit-main-splitpane-opac-font-color' : {
          value:'#202124',
          desc: 'The font color of the text in the property list.',
          descShort: 'Text Color',
          type: 'color',
          group: 'Sidebars - OPAC',
          range: null
      },      
      '--b-edit-main-splitpane-opac-no-scrollbar' : {
          desc: 'Do not display a scroll bar in the opac preview side panel.',
          descShort: 'No Scrollbar',
          value: true,
          type: 'boolean',
          unit: null,
          group: 'Sidebars - OPAC',
          range: [true,false]
      },



      
      // the edit panel

      '--n-edit-main-splitpane-edit-width' : {
          desc: 'The width of the edit screen panel.',
          descShort: 'Edit panel width',
          value: 50,
          step: 1,
          type: 'number',
          group: 'Edit Panel',
          range: [5,100]
      },
      '--b-edit-main-splitpane-edit-no-scrollbar' : {
          desc: 'Do not display a scroll bar in the edit panel.',
          descShort: 'No Scrollbar',
          value: true,
          type: 'boolean',
          unit: null,
          group: 'Edit Panel',
          range: [true,false]
      },

      '--c-edit-main-splitpane-edit-background-color-work' : {
          value:'#deeaea',
          desc: 'The background color of the work on edit screen panel.',
          descShort: 'Work Background Color',
          type: 'color',
          group: 'Edit Panel',
          range: null
        },



      '--b-edit-main-splitpane-edit-show-field-labels' : {
          desc: 'Display  labels in the field.',
          descShort: 'Display field labels',
          value: true,
          type: 'boolean',
          unit: null,
          group: 'Edit Panel',
          range: [true,false]
      },

      '--n-edit-main-splitpane-edit-show-field-labels-size' : {
          desc: 'Field Label font size.',
          descShort: 'Field Label font size',
          value: 0.65,
          step: 0.01,
          type: 'number',
          unit: 'em',
          group: 'Edit Panel',
          range: [0,1]
      },

      '--b-edit-main-splitpane-edit-shortcode-display-mode' : {
          desc: 'Display abbrivated BF tags instead of natural language labels.',
          descShort: 'BF display tags',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'Edit Panel',
          range: [true,false]
      },




      // the NAV panel
      '--n-edit-main-splitpane-nav-height' : {
          desc: 'The default height of the nav menu',
          descShort: 'Height',
          value: 35,
          type: 'number',
          unit: 'px',
          group: 'Nav Bar',
          range: [5,50]
      },

      '--n-edit-main-splitpane-nav-font-size' : {
          desc: 'The fontsize of the text in the nav menu',
          descShort: 'Font Size',
          value: 1,
          step: 0.1,
          type: 'number',
          unit: 'em',
          group: 'Nav Bar',
          range: [1,2]
      },
      '--c-edit-main-splitpane-nav-background-color' : {
          desc: 'The background color of the nav menu',
          descShort: 'Background Color',
          value: 'white',
          type: 'color',
          unit: null,
          group: 'Nav Bar',
          range: null
      },
      '--c-edit-main-splitpane-nav-font-color' : {
          value:'#202124',
          desc: 'The font color of the text in the nav bar',
          descShort: 'Text Color',
          type: 'color',
          group: 'Nav Bar',
          range: null
      },




      // the LITERAL field
      '--n-edit-main-literal-font-size' : {
          desc: 'The fontsize of the text in the literal field',
          descShort: 'Font Size',
          value: 1,
          step: 0.1,
          type: 'number',
          unit: 'em',
          group: 'Literal Field',
          range: [1,2]
      },









      // General Edit things
      '--s-edit-general-action-button-icon' : {
          desc: 'What icon to use on the field action button, such as "bolt" look up the Material Icon name (https://marella.me/material-icons/demo/)',
          descShort: 'Action button icon',
          value: 'bolt',
          type: 'string',
          unit: null,
          group: 'Action Button',
          range: [1,2]
      },
      '--c-edit-general-action-button-color' : {
          value:'#202124',
          desc: 'The color of the icon on the action button.',
          descShort: 'Action button color',
          type: 'color',
          group: 'Action Button',
          range: null
        },

      '--c-edit-general-action-button-background-color' : {
          value:'#fff',
          desc: 'The color of background on the action button.',
          descShort: 'Action Button background color',
          type: 'color',
          group: 'Action Button',
          range: null
        },
      '--n-edit-general-action-button-size' : {
          desc: 'The size of the icon on the action button',
          descShort: 'Button Icon Size',
          value: 1.25,
          step: 0.1,
          type: 'number',
          unit: 'em',
          group: 'Action Button',
          range: [1,2]
      },
      '--n-edit-general-action-button-border-width' : {
          desc: 'The width of the button border',
          descShort: 'Button Border width',
          value: 1,
          step: 0.1,
          type: 'number',
          unit: 'px',
          group: 'Action Button',
          range: [0,10]
      },
      '--c-edit-general-action-button-border-color' : {
          value:'#202124',
          desc: 'The color of background on the action button.',
          descShort: 'Action background color',
          type: 'color',
          group: 'Action Button',
          range: null
        },
      '--n-edit-general-action-button-border-radius' : {
          desc: 'The radius of the button border',
          descShort: 'Button Border radius',
          value: 5,
          step: 0.1,
          type: 'number',
          unit: 'px',
          group: 'Action Button',
          range: [0,10]
      },




      '--n-edit-general-action-button-continer-background-color' : {
          value:'#fff',
          desc: 'Background color of the action button menu.',
          descShort: 'Action btn menu color',
          type: 'color',
          group: 'Action Button',
          range: null
        },

      '--n-edit-general-action-button-continer-font-size' : {
          desc: 'The size of the text in the action button menu',
          descShort: 'Icon Size',
          value: 1.25,
          step: 0.1,
          type: 'number',
          unit: 'em',
          group: 'Action Button',
          range: [1,2]
      },
      '--n-edit-general-action-button-continer-border-width' : {
          desc: 'The width of the action button menu border',
          descShort: 'Action btn menu Border width',
          value: 1,
          type: 'number',
          step: 0.1,
          unit: 'px',
          group: 'Action Button',
          range: [0,10]
      },
      '--c-edit-general-action-button-continer-border-color' : {
          value:'#202124',
          desc: 'The color of background on the action button.',
          descShort: 'Action btn menu border color',
          type: 'color',
          group: 'Action Button',
          range: null
        },
      '--n-edit-general-action-button-continer-border-radius' : {
          desc: 'The radius of the button menu border',
          descShort: 'Action btn menu Border radius',
          value: 5,
          step: 0.1,
          type: 'number',
          unit: 'px',
          group: 'Action Button',
          range: [0,10]
      },
      '--c-edit-general-action-button-continer-color' : {
          value:'#202124',
          desc: 'The color of the text in the action button menu.',
          descShort: 'Action btn menu font color',
          type: 'color',
          group: 'Action Button',
          range: null
        },
      '--n-edit-general-action-button-continer-background-highlight-color' : {
          value:'whitesmoke',
          desc: 'Background color of the action button menu item when selected.',
          descShort: 'Action btn menu highlight color',
          type: 'color',
          group: 'Action Button',
          range: null
        },

      '--b-edit-general-action-button-display' : {
          desc: 'Display action button.',
          descShort: 'Display Button',
          value: true,
          type: 'boolean',
          unit: null,
          group: 'Action Button',
          range: [true,false]
      },





      // COMPLEX LOOKUP

      '--b-edit-complex-use-select-dropdown' : {
          desc: 'Use dropdown select instead of buttons.',
          descShort: 'Use lookup dropdown',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'Complex Lookup',
          range: [true,false]
      },




      '--c-general-icon-instance-color' : {
          desc: 'The color of the instance icon.',
          descShort: 'Instance icon color',
          value: '#8b588b',
          type: 'color',
          unit: null,
          group: 'General',
          range: null
      },
      '--c-general-icon-work-color' : {
          desc: 'The color of the instance icon.',
          descShort: 'Instance icon color',
          value: '#7badad',
          type: 'color',
          unit: null,
          group: 'General',
          range: null
      },
      '--c-general-icon-item-color' : {
          desc: 'The color of the item icon.',
          descShort: 'Item icon color',
          value: '#eaeaea',
          type: 'color',
          unit: null,
          group: 'General',
          range: null
      },


    }



  }),
  getters: {

    

    
    // /**
    // * Returns the part of the config based on the current URL (or enviornment)
    // * @return {object} - The url config object
    // */       
    // returnUrls: (state) => {
    //   // testing for window here because of running unit tests in node
    //   if (typeof window !== 'undefined'){
    //     if (window && (window.location.href.startsWith('http://localhost') || window.location.href.startsWith('http://127.0.0.1'))){
    //       return state.regionUrls.dev
    //     }else if (window && window.location.href.startsWith('https://preprod-3001')){
    //       return state.regionUrls.staging
    //     }else if (window && window.location.href.startsWith('https://editor.id')){
    //       return state.regionUrls.production
    //     }else if (window && window.location.href.includes('bibframe.org/marva')){
    //       return state.regionUrls.bibframeDotOrg
    //     }
    //   }else{
    //     return state.regionUrls.dev
    //   }
    // }



  },
  actions: {

    /**
    * returns the value of the preference property requested
    * @param {string} propertyName - the name of the styleDefault to send
    * @param {boolean} excludeUnitType - if true do not include the unit in the reply if present
    * @return {string|number} - The value of the property
    */  
    returnValue: function(propertyName,excludeUnitType){
      if (!this.styleDefault[propertyName]){
        console.warn("Trying to return", propertyName, ' but does not exist.')
        return ""
      }

      if (this.styleDefault[propertyName].unit && excludeUnitType){
        return this.styleDefault[propertyName].value
      }else if (this.styleDefault[propertyName].unit){
        return this.styleDefault[propertyName].value + this.styleDefault[propertyName].unit
      }else{
        return this.styleDefault[propertyName].value      
      }
    },


    /**
    * sets the value preference property requested
    * @param {string} propertyName - the name of the styleDefault to send
    * @param {string|number} value - the value to use
    * @return {boolean} - Did it work
    */  
    setValue: function(propertyName,value){
      if (!this.styleDefault[propertyName]){
        console.warn("Trying to return", propertyName, ' but does not exist.')
        return false
      }

      this.styleDefault[propertyName].value = value
      return true
    },

    /**
    * Dispalys the debug modal
    * @return {void}
    */  
    togglePrefModal: function(){
      if (this.showDebugModal){
        this.showDebugModal = false
      }else{
        
        this.showDebugModal = true    
      }
    },

    /**
    * Dispalys the preference modal
    * @param {string} group - the name of option group to dispay in the preference modal    
    * @return {void}
    */  
    togglePrefModal: function(group){
      if (this.showPrefModal){
        this.showPrefModal = false
      }else{
        
        if (group){
          this.showPrefModalGroup = group    
        }
        this.showPrefModal = true    
      }

    },

    /**
    * Set showPrefModalGroup
    * @param {string} group - the name of option group to dispay in the preference modal    
    * @return {void}
    */  
    setShowPrefModalGroup: function(group){
      this.showPrefModalGroup = group
    },

    /**
    * Truns a panel on or off
    * @param {string} panel - the name of the panel to toggle
    * @return {void}
    */  
    togglePanel: function(panel){
      if (this.panelDisplay[panel]){
        this.panelDisplay[panel] = false
      }else{
        this.panelDisplay[panel] = true    
      }
      console.log(this.panelDisplay)
      console.log(this.panelDisplay.properties)
      const instance = getCurrentInstance();
      instance?.proxy?.$forceUpdate();

    },



    /**
    * Take a url and rewrites it to match the url pattern of the current enviornment
    * @param {string} url - the url to modfidfy
    * @return {string} - the url modified to the match the env
    */   
    // convertToRegionUrl(url) {
    //   let urls = this.returnUrls
    //   if ((url.includes('/works/') || url.includes('/instances/') || url.includes('/items/') || url.includes('/hubs/') ) && url.includes('http://id.loc.gov') ){
    //     url = url.replace('http://id.loc.gov/',urls.bfdb)
    //   }    
    //   return url
    // }


  },
})