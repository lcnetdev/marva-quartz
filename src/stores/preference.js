import { defineStore } from 'pinia'
import { useProfileStore } from './profile'
import { getCurrentInstance } from 'vue'
import diacrticsVoyagerMacroExpress from "@/lib/diacritics/diacritic_pack_voyager_macro_express.json"
import diacrticsVoyagerNative from "@/lib/diacritics/diacritic_pack_voyager_native.json"
import utilsProfile from '../lib/utils_profile'
import utilsParse from '../lib/utils_parse'
import short from 'short-uuid'

const translator = short();
const decimalTranslator = short("0123456789");

export const usePreferenceStore = defineStore('preference', {
  state: () => ({


    // controls showing the modal that is parked in the App.vue
    showPrefModal: false,
    // which group to display in the modal
    showPrefModalGroup: 'Sidebars - Property',

    showDebugModal: false,
    debugModalData: {},

    showPanelSizeModal: false,
    panelSizePresets: [],

    showScriptshifterConfigModal: false,
    scriptShifterOptions: {},

    // the cataloger initals, like abcd, often the username/email
    catInitals: null,
    // in LC we also have a secondary id that gets put into the distributed record
    // catRequireCode: false,
    catCode: null,

    // show the login box
    showLoginModal: false,

    fontFamilies: ['Avenir, Helvetica, Arial, sans-serif','serif','sans-serif','monospace','cursive','fantasy','system-ui','ui-serif','ui-sans-serif','ui-monospace','ui-rounded'],


    showDiacriticConfigModal:false,

    showFieldColorsModal: false,

    diacriticPacks: {
      macroExpress: diacrticsVoyagerMacroExpress,
      voyager: diacrticsVoyagerNative,
    },

    diacriticUse:[],
    diacriticUseValues:[],

    showTextMacroModal: false,

    layoutActive: false,
    layoutActiveFilter: null,
    customLayouts: {},
    createLayoutMode: false,

    // keeps a copy of the orginal values to be able to reset
    styleDefaultOrginal: {},
    panelDisplayOrginal: {},


    copyMode: false,

    panelDisplay:{

      properties:true,
      dualEdit: false,
      opac: true,
      xml:false,
      marc: false,
      linkedData: false,


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
      '--b-edit-main-splitpane-properties-component-library' : {
        desc: 'Display the Component Library in the Property Panel.',
        descShort: 'Component Library',
        value: true,
        type: 'boolean',
        unit: null,
        group: 'Sidebars - Property',
        range: [true,false]
      },
      '--b-edit-main-splitpane-properties-component-library-prompt-to-add' : {
        desc: 'Ask before adding a component from the library.',
        descShort: 'Prompt to add Library Component',
        value: true,
        type: 'boolean',
        unit: null,
        group: 'Sidebars - Property',
        range: [true,false]
      },
      '--c-edit-main-splitpane-slider-color' : {
          value:'#ffffff',
          desc: 'Color of the dividing line / resize line.',
          descShort: 'Resize Line Color',
          type: 'color',
          group: 'Sidebars - Property',
          range: null
      },
      '--c-edit-main-splitpane-slider-border-color' : {
        value:'#eee',
        desc: 'Color of the dividing line / resize line Border.',
        descShort: 'Resize Line Border Color',
        type: 'color',
        group: 'Sidebars - Property',
        range: null
      },
      '--b-edit-main-splitpane-properties-show-defaults' : {
        desc: 'Display the default Component Library in the Property Panel.',
        descShort: 'Default Component Library',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'Sidebars - Property',
        range: [true,false]
      },
      '--l-custom-order' : {
        desc: '',
        descShort: '',
        value: {},
        type: 'object',
        group: 'preferenes',
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

      // All previews -- wording used to suggest this only affects OPAC preview, but really changes all previews
      '--c-edit-main-splitpane-opac-background-color' : {
          value:'#f2f2f2',
          desc: 'The background color of the preview side bars on the edit screen.',
          descShort: 'Background Color',
          type: 'color',
          group: 'Sidebars - Previews',
          range: null
        },
      '--c-edit-main-splitpane-opac-highlight-background-color' : {
          value:'#6f6f6f',
          desc: 'The background color of the field when selected or hovered.',
          descShort: 'Highlight Color',
          type: 'color',
          group: 'Sidebars - Previews',
          range: null
       },

      '--n-edit-main-splitpane-opac-width' : {
          desc: 'The width of the property side bar on the edit screen.',
          descShort: 'Sidebar width',
          value: 5,
          type: 'number',
          step: 1,
          group: 'Sidebars - Previews',
          range: [5,100]
      },

      '--n-edit-main-splitpane-opac-font-size' : {
          desc: 'The fontsize of the text in the preview view side bars.',
          descShort: 'Font Size',
          value: 1,
          step: 0.01,
          type: 'number',
          unit: 'em',
          group: 'Sidebars - Previews',
          range: [1,2]
      },
      '--c-edit-main-splitpane-opac-font-family' : {
          value:'Avenir, Helvetica, Arial, sans-serif',
          desc: 'The font of the text in the preiveiws.',
          descShort: 'Font',
          type: 'font',
          group: 'Sidebars - Previews',
          range: null
      },

      '--c-edit-main-splitpane-opac-font-color' : {
          value:'#202124',
          desc: 'The font color of the text in the previews.',
          descShort: 'Text Color',
          type: 'color',
          group: 'Sidebars - Previews',
          range: null
      },
      '--b-edit-main-splitpane-opac-no-scrollbar' : {
          desc: 'Do not display a scroll bar in the preview side panels.',
          descShort: 'No Scrollbar',
          value: true,
          type: 'boolean',
          unit: null,
          group: 'Sidebars - Previews',
          range: [true,false]
      },
      '--b-edit-main-splitpane-opac-marc-html' : {
        desc: 'Display the MARC preview as HTML instead of plain text',
        descShort: 'MARC HTML',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'Sidebars - Previews',
        range: [true, false]
      },
      '--c-edit-main-splitpane-opac-marc-html-highlight-color' : {
          value:'transparent',
          desc: 'The background color of the subfield in the marc preview when hovering over it.',
          descShort: 'Subfield Highlight Color',
          type: 'color',
          group: 'Sidebars - Previews',
          range: null
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
          value: false,
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
      '--c-edit-main-splitpane-edit-background-color-instance' : {
          value:'#ffe2ff96',
          desc: 'The background color of the instance on edit screen panel.',
          descShort: 'Instance Background Color',
          type: 'color',
          group: 'Edit Panel',
          range: null
        },
        '--c-edit-main-splitpane-edit-background-color-item' : {
          value:'#ffe2ff96',
          desc: 'The background color of the item on edit screen panel.',
          descShort: 'Item Background Color',
          type: 'color',
          group: 'Edit Panel',
          range: null
        },
      '--c-edit-main-splitpane-edit-background-color-instance-secondary' : {
          value:'#f671f696',
          desc: 'The background color of the secondary instance on edit screen panel.',
          descShort: 'Secondary Instance Background Color',
          type: 'color',
          group: 'Edit Panel',
          range: null
        },

        '--c-edit-main-splitpane-edit-component-label-color' : {
          value:'black',
          desc: 'The of the text describing the component.',
          descShort: 'Component Label Color',
          type: 'color',
          group: 'Edit Panel',
          range: null
        },


      '--c-edit-main-splitpane-edit-focused-field-color' : {
          value:'#f2f6f6',
          desc: 'The background color of the field when it has the focus.',
          descShort: 'Field Focus Background Color',
          type: 'color',
          group: 'Edit Panel',
          range: null
        },

        '--c-edit-main-splitpane-edit-field-color' : {
          value:'transparent',
          desc: 'The background color of the field when no focus.',
          descShort: 'Field Background Color',
          type: 'color',
          group: 'Edit Panel',
          range: null
        },

        '--c-edit-main-splitpane-edit-field-border-color' : {
          value:'rgba(133, 133, 133,0.2)',
          desc: 'The color of the border between fields.',
          descShort: 'Field Border Color',
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

      '--c-edit-main-splitpane-edit-show-field-labels-color' : {
        value:'gray',
        desc: 'The color of the field labels that sit above the value.',
        descShort: 'Field Label color',
        type: 'color',
        group: 'Edit Panel',
        range: null
      },
      '--b-edit-main-splitpane-edit-show-field-labels-bold' : {
          desc: 'Make the field labels bold.',
          descShort: 'Bold Field Labels.',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'Edit Panel',
          range: [true,false]
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


      '--b-edit-main-splitpane-edit-adhoc-mode' : {
          desc: 'Add properties as needed using a drop down list.',
          descShort: 'Properties adhoc',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'Edit Panel',
          range: [true,false]
      },
      '--b-edit-main-splitpane-edit-switch-between-resource-button' : {
          desc: 'Lets you switch displaying work and instances in the edit panel.',
          descShort: 'Resource switch button',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'Edit Panel',
          range: [true,false]
      },
      '--b-edit-main-splitpane-edit-scroll-x' : {
          desc: 'The edit fields display does not wrap, a scroll bar appears at the bottom',
          descShort: 'Horizontal Edit Panel scroll',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'Edit Panel',
          range: [true,false]
      },


      // the field color object
      '--o-edit-general-field-colors' : {
        desc: 'Field Color Object',
        descShort: 'Field Color Object',
        value: {},
        step: null,
        type: 'object',
        unit: null,
        group: 'Edit Panel',
        hide: true,
        range: null
    },

    '--c-edit-main-splitpane-edit-scroll-bar-track-color' : {
      value:'#fafafa',
      desc: 'The color of the scroll bar track (background).',
      descShort: 'Scrollbar Track Color',
      type: 'color',
      group: 'Edit Panel',
      range: null
    },
    '--c-edit-main-splitpane-edit-scroll-bar-thumb-color' : {
      value:'#c7c7c7',
      desc: 'The color of the scroll bar thumb (the part you grab).',
      descShort: 'Scrollbar Thumb Color',
      type: 'color',
      group: 'Edit Panel',
      range: null
    },

      '--o-edit-main-splitpane-edit-panel-size-presets' : {
        desc: 'Panel Size Presets',
        descShort: 'Panel Size Presets',
        value: [],
        step: null,
        type: 'array',
        unit: null,
        group: 'Edit Panel',
        hide: true,
        range: null
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
      '--c-edit-main-literal-font-color' : {
        desc: 'The color of the text',
        descShort: 'Font Color',
        value: "black",
        type: 'color',
        group: 'Literal Field',
        range: null
      },
      '--c-edit-main-literal-lang-label-background-color' : {
        desc: 'The background color of the language indicator',
        descShort: 'Lang Label Background Color',
        value: "aliceblue",
        type: 'color',
        group: 'Literal Field',
        range: null
      },
      '--c-edit-main-literal-lang-label-font-color' : {
        desc: 'The font color of the language indicator',
        descShort: 'Lang Label Font Color',
        value: "#090909",
        type: 'color',
        group: 'Literal Field',
        range: null
      },
      '--n-edit-main-literal-lang-label-font-size' : {
        desc: 'The fontsize of the language indicator',
        descShort: 'Lang Label Font Size',
        value: 1,
        step: 0.1,
        type: 'number',
        unit: 'em',
        group: 'Literal Field',
        range: [1,2]
    },
    '--b-edit-main-literal-bold-font' : {
        desc: 'Literal Text Bold.',
        descShort: 'Make literals bold.',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'Literal Field',
        range: [true,false]
    },
    '--b-edit-main-literal-non-latin-first' : {
      desc: 'With paired literals values (transliteration) always show the non-Latin value first (otherwise the Latin value will be first)',
      descShort: 'Paired literals, show non-Latin First.',
      value: false,
      type: 'boolean',
      unit: null,
      group: 'Literal Field',
      range: [true,false]
    },

    '--b-edit-main-literal-display-paired-literal-line' : {
      desc: 'Display a line between the two paired literals. Indicates that the two values are related.',
      descShort: 'Display a line between the two paired literals.',
      value: true,
      type: 'boolean',
      unit: null,
      group: 'Literal Field',
      range: [true,false]
    },
    '--c-edit-main-literal-paired-literal-line-color' : {
      desc: 'Line color of the paired literal line',
      descShort: 'Paired literal line color',
      value: "#4b4b4b",
      type: 'color',
      group: 'Literal Field',
      range: null
    },


  // Lookup Field
  // Not sure what this is supposed to be
  // '--n-edit-main-lookup-background-color' : {
  //   desc: 'The background color of the entity badge',
  //   descShort: 'Lookup value background color',
  //   value: 1,
  //   step: 0.1,
  //   type: 'number',
  //   unit: 'em',
  //   group: 'Lookup Field',
  //   range: [1,2]
  // },
  '--c-edit-main-lookup-background-color' : {
    desc: 'The background color of the entity badge',
    descShort: 'Lookup value background color',
    value: "whitesmoke",
    type: 'color',
    group: 'Lookup Field',
    range: null
  },
  '--c-edit-main-lookup-border-color' : {
    desc: 'The border color of the entity badge',
    descShort: 'Lookup value border color',
    value: "#dedede",
    type: 'color',
    group: 'Lookup Field',
    range: null
  },
  '--c-edit-main-lookup-text-color' : {
    desc: 'The text color of the entity badge',
    descShort: 'Lookup value text color',
    value: "black",
    type: 'color',
    group: 'Lookup Field',
    range: null
  },
  '--c-edit-main-lookup-icon-linked-color' : {
    desc: 'Linked icon color',
    descShort: 'Linked Icon Color',
    value: "green",
    type: 'color',
    group: 'Lookup Field',
    range: null
  },
  '--c-edit-main-lookup-simple-lookup-autocomplete-background-color' : {
    desc: 'The lookup popup list background color',
    descShort: 'Simple Lookup Popup Background Color',
    value: "white",
    type: 'color',
    group: 'Lookup Field',
    range: null
  },
  '--c-edit-main-lookup-simple-lookup-autocomplete-text-color' : {
    desc: 'The lookup popup list text color',
    descShort: 'Simple Lookup Popup Text Color',
    value: "black",
    type: 'color',
    group: 'Lookup Field',
    range: null
  },
  '--n-edit-main-lookup-font-size' : {
      desc: 'The font size for the text in a lookup element.',
      descShort: 'Lookup font size',
      value: 0.75,
      step: 0.05,
      type: 'number',
      unit: 'em',
      group: 'Lookup Field',
      range: [0.75,2]
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
          descShort: 'Button Border Width',
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
          descShort: 'Action Border Color',
          type: 'color',
          group: 'Action Button',
          range: null
        },
      '--n-edit-general-action-button-border-radius' : {
          desc: 'The radius of the button border',
          descShort: 'Button Border Radius',
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
      '--c-edit-general-action-button-menu-background-color' : {
        value:'white',
        desc: 'Color of the Menu background',
        descShort: 'Menu background color',
        type: 'color',
        group: 'Action Button',
        range: null
      },
      '--c-edit-general-action-button-menu-button-background-color' : {
        value:'rgb(239, 239, 239)',
        desc: 'Menu Button background color',
        descShort: 'Menu Button Color',
        type: 'color',
        group: 'Action Button',
        range: null
      },
      '--c-edit-general-action-button-menu-button-border-color' : {
        value:'black',
        desc: 'Menu Button Border color',
        descShort: 'Menu Border Color',
        type: 'color',
        group: 'Action Button',
        range: null
      },
      '--c-edit-general-action-button-menu-button-text-color' : {
        value:'black',
        desc: 'Menu Button text color',
        descShort: 'Menu Text Color',
        type: 'color',
        group: 'Action Button',
        range: null
      },
      '--n-edit-general-action-button-menu-button-text-size' : {
        desc: 'Button text size',
        descShort: 'Button text size',
        value: 1,
        step: 0.1,
        type: 'number',
        unit: 'em',
        group: 'Action Button',
        range: [1,2]
    },


      // MODALS

      '--c-edit-modals-background-color' : {
        value:'white',
        desc: 'Background color of the popup modals',
        descShort: 'Background Color',
        type: 'color',
        group: 'Modals',
        range: null
      },
      '--c-edit-modals-background-color-accent' : {
        value:'whitesmoke',
        desc: 'Used for off background color accents',
        descShort: 'Background Accent Color',
        type: 'color',
        group: 'Modals',
        range: null
      },

      '--c-edit-modals-text-color' : {
        value:'black',
        desc: 'Text color of popup modals',
        descShort: 'Text Color',
        type: 'color',
        group: 'Modals',
        range: null
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
      '--b-edit-complex-use-value-icons' : {
        desc: 'Show icons in the value.',
        descShort: 'Show icons in value',
        value: true,
        type: 'boolean',
        unit: null,
        group: 'Complex Lookup',
        range: [true,false]
      },
      '--b-edit-complex-scroll-all' : {
        desc: 'Scroll all the results at the same time.',
        descShort: 'Scroll All Results',
        value: true,
        type: 'boolean',
        unit: null,
        group: 'Complex Lookup',
        range: [true,false]
      },
      '--b-edit-complex-scroll-independently' : {
        desc: 'Scroll the results of each section independently (LCNAF, CYAC, Complex headings...).',
        descShort: 'Scroll by Section',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'Complex Lookup',
        range: [true,false]
      },
      '--b-edit-complex-number-names' : {
        desc: 'Set the number of names that will appear in the subject builder. More results might be slower.',
        descShort: 'Number of Names',
        value: 5,
        type: 'number',
        group: 'Complex Lookup',
        range: [5, 100],
        step: 5,
      },
      '--b-edit-complex-number-complex' : {
        desc: 'Set the number of complex headings that will appear in the subject builder. More results might be slower.',
        descShort: 'Number of Complex Headings',
        value: 5,
        type: 'number',
        group: 'Complex Lookup',
        range: [5, 100],
        step: 5,
      },
      '--b-edit-complex-number-simple' : {
        desc: 'Set the number of simple headings that will appear in the subject builder. More results might be slower.',
        descShort: 'Number of Simple Headings',
        value: 5,
        type: 'number',
        group: 'Complex Lookup',
        range: [5, 100],
        step: 5,
      },
      '--b-edit-complex-number-cyac' : {
        desc: "Set the number of Children's headings that will appear in the subject builder. More results might be slower.",
        descShort: 'Number of CYAC Headings',
        value: 5,
        type: 'number',
        group: 'Complex Lookup',
        range: [5, 100],
        step: 5,
      },
      '--b-edit-complex-include-usage' : {
        desc: 'Include the usage numbers for subject headings. This might increase search time.',
        descShort: 'Include Usage',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'Complex Lookup',
        range: [true,false]
      },
      '--b-edit-complex-nar-advanced-mode' : {
        desc: 'Default to the advanced mode display when creating NARs.',
        descShort: 'Use NAR Advanced Mode by default',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'Complex Lookup',
        range: [true,false]
      },


      //general
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
          desc: 'The color of the work icon.',
          descShort: 'Work icon color',
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
      '--c-general-copy-mode' : {
          desc: 'Set if copy mode should be on or off by default.',
          descShort: 'Copy mode default',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'General',
          range: [true,false]
      },
      '--c-general-ad-hoc' : {
          desc: 'Turn on Ad Hoc Mode. Ad Hoc mode will only display populated and mandatory fields in Marva, other fields can be added as needed.',
          descShort: 'Ad Hoc Mode',
          value: false,
          type: 'boolean',
          unit: null,
          group: 'General',
          range: [true,false]
      },
      '--b-general-auto-save' : {
        desc: 'When On the record will be saved to the backend on every change.',
        descShort: 'Auto Save Mode',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'General',
        range: [true,false]
    },
      '--s-general-default-profile' : {
        desc: 'Default profile to use when pressing [ENTER].',
        descShort: 'Default profile',
        value: 'lc:RT:bf2:Monograph:Instance',
        type: 'string',
        hide: true,
        unit: null,
        group: 'General'
    },

      // diacritics

      '--b-diacritics-disable-voyager-mode' : {
        desc: 'Do not use Voyager Mode (crtl+e).',
        descShort: 'Do not use Voyager Mode (crtl+e)',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'Diacritics',
        range: [true,false]
      },

      '--c-diacritics-enabled-macros' : {
        value:[],
        desc: '',
        descShort: 'List of diacritic macros to use',
        type: 'other',
        group: 'Diacritics',
        range: null
      },
      '--o-diacritics-text-macros' : {
        value:[],
        desc: '',
        descShort: 'Text macros to use',
        type: 'other',
        group: 'Diacritics',
        range: null
      },
      '--o-literal-lang-bulk-options' : {
        value:[],
        desc: '',
        descShort: 'The lang-script options to use in the bulk tool',
        type: 'other',
        group: 'Diacritics',
        range: null
      },



      //Shelflisting
      '--b-shelflist-link-1-label' : {
        desc: 'Label for link 1.',
        descShort: 'Link 1 Label',
        value: "Cutter Table",
        type: 'string',
        group: 'Shelflisting',
        index: 0
      },
      '--b-shelflist-link-1' : {
        desc: 'Link to an outside resource to help with shelf listing.',
        descShort: 'Link 1 URL',
        value: "http://www.loc.gov/aba/pcc/053/table",
        type: 'string',
        group: 'Shelflisting',
        index: 0
      },

      '--b-shelflist-link-2-label' : {
        desc: 'Label for link 2.',
        descShort: 'Link 2 Label',
        value: "Biography Table",
        type: 'string',
        group: 'Shelflisting',
        index: 1
      },
      '--b-shelflist-link-2' : {
        desc: 'Link to an outside resource to help with shelf listing.',
        descShort: 'Link 2 URL',
        value: "https://www.loc.gov/aba/publications/FreeCSM/G320.pdf",
        type: 'string',
        group: 'Shelflisting',
        index: 1
      },

      '--b-shelflist-link-3-label' : {
        desc: 'Label for link 3.',
        descShort: 'Link 3 Label',
        value: "Translation Table",
        type: 'string',
        group: 'Shelflisting',
        index: 2
      },
      '--b-shelflist-link-3' : {
        desc: 'Link to an outside resource to help with shelf listing.',
        descShort: 'Link 3 URL',
        value: "https://www.loc.gov/aba/publications/FreeCSM/G150.pdf",
        type: 'string',
        group: 'Shelflisting',
        index: 2
      },

      '--b-shelflist-link-4-label' : {
        desc: 'Label for link 4.',
        descShort: 'Link 4 Label',
        value: "",
        type: 'string',
        group: 'Shelflisting',
        index: 3
      },
      '--b-shelflist-link-4' : {
        desc: 'Link to an outside resource to help with shelf listing.',
        descShort: 'Link 4 URL',
        value: "",
        type: 'string',
        group: 'Shelflisting',
        index: 3
      },

      '--b-shelflist-link-5-label' : {
        desc: 'Label for link 5.',
        descShort: 'Link 5 Label',
        value: "",
        type: 'string',
        group: 'Shelflisting',
        index: 4
      },
      '--b-shelflist-link-5' : {
        desc: 'Link to an outside resource to help with shelf listing.',
        descShort: 'Link 5 URL',
        value: "",
        type: 'string',
        group: 'Shelflisting',
        index: 4
      },

      '--b-shelflist-show-cutter-helpers' : {
        desc: 'Display cutter tools like author cutter and links',
        descShort: 'Display cutter tools.',
        value: true,
        type: 'boolean',
        unit: null,
        group: 'Shelflisting',
        range: [true,false]
    },


    '--b-edit-main-splitpane-edit-inline-mode' : {
      desc: 'Compact Advanced Modular Mode.',
      descShort: 'Use CAMM Mode',
      value: false,
      type: 'boolean',
      unit: null,
      group: 'CAMM Mode',
      range: [true,false]
    },
    '--b-edit-main-splitpane-camm-hide-action-button' : {
      desc: 'Hide action button in CAMM mode, only keyboard shortcut (Ctrl+\\).',
      descShort: 'Hide Action Button',
      value: true,
      type: 'boolean',
      unit: null,
      group: 'CAMM Mode',
      range: [true,false]
    },





      // scriptshifter
      '--b-scriptshifter-capitalize-first-letter' : {
        desc: 'Capitalize the first letter of the transliterated string.',
        descShort: 'Capitalize the first letter',
        value: false,
        type: 'boolean',
        unit: null,
        group: 'Scriptshifter',
        range: [true,false]
      },

      // Custom Layouts, isn't really a preference, but need to store it somewhere
      /**
       * The structure of a layout is
       * hash: {  // hash is made from the `user's label`
              "profileId": "Monograph",         // the id for the profile associated with the layout
              "label": "Monograph-Work-Title",  // user assigned lable
              "properties": {
                  "lc:RT:bf2:Monograph:Work": [ // ProfileName
                      "id_loc_gov_ontologies_bibframe_contribution__creator_of_work" // property id
                  ]
              }
          }
       * This allows greater granularity in the layouts, but also means layouts will only work for the profile they are created with.
       * Without this level of granuality, it's not possible to allows the user to differentiate between "Notes about the Work" & "Notes about the Instance."
       * Additionally, using the `propertyId` instead of the `propertyURI` allows "Notes about the Work" to be different from "Language Note"
       */
      '--l-custom-layouts' : {
        desc: '',
        descShort: '',
        value: {},
        type: 'object',
        group: 'layouts',
      },

      // CopyCat
      '--c-edit-copy-cat-components' : {
          value:'#d7d7d7',
          desc: 'The background color of Copy Cat components.',
          descShort: 'Copy Cat color',
          type: 'color',
          group: 'Copy Cat',
          range: null
       },
       '--c-edit-copy-cat-font-color' : {
          value:'black',
          desc: 'The font color of the text searching for a Copy Cat record.',
          descShort: 'Text Color',
          type: 'color',
          group: 'Copy Cat',
          range: null
      },
      '--c-edit-copy-cat-card-color' : {
          value:'white',
          desc: 'The color search results.',
          descShort: 'Results Color',
          type: 'color',
          group: 'Copy Cat',
          range: null
      },
      '--c-edit-copy-cat-card-color-selected' : {
          value:'antiquewhite',
          desc: 'The color selected result.',
          descShort: 'Selected Color',
          type: 'color',
          group: 'Copy Cat',
          range: null
      },
      '--c-edit-copy-cat-card-marc-hover' : {
          value:'transparent',
          desc: 'The color of the subfield when hovering over the MARC.',
          descShort: 'Marc Hover',
          type: 'color',
          group: 'Copy Cat',
          range: null
      },
      '--n-edit-copy-cat-font-size' : {
          desc: 'The fontsize of the text in the Copy Cat search.',
          descShort: 'Font Size',
          value: 1,
          step: 0.01,
          type: 'number',
          unit: 'em',
          group: 'Copy Cat',
          range: [1,2]
      },



    }
  }),

  // catInitals: null,
  // // in LC we also have a secondary id that gets put into the distributed record
  // // catRequireCode: false,
  // catCode:

  getters: {


    returnUserNameForSaving: function(){
      return `${this.catInitals} (${this.catCode})`
    },
    returnUserNameForPosting: function(){
      return this.catCode
    },




  },
  actions: {

    /**
    * Setup the preference store, access settings stored in localstorage, etc.
    * @return {void} -
    */
    initalize: function(){

      // check to see if we have the settings locally we can populate
      if (window.localStorage.getItem('marva-catInitals')){
        this.catInitals = window.localStorage.getItem('marva-catInitals')
      }
      if (window.localStorage.getItem('marva-catCode')){
        this.catCode = window.localStorage.getItem('marva-catCode')
      }
      if (window.localStorage.getItem('marva-scriptShifterOptions')){
        this.scriptShifterOptions = JSON.parse(window.localStorage.getItem('marva-scriptShifterOptions'))
      }
      if (window.localStorage.getItem('marva-diacriticUse')){
        this.diacriticUse = JSON.parse(window.localStorage.getItem('marva-diacriticUse'))
      }
      if (window.localStorage.getItem('marva-componentLibrary')){
        useProfileStore().componentLibrary = JSON.parse(window.localStorage.getItem('marva-componentLibrary'))
      }

      this.styleDefaultOrginal = JSON.parse(JSON.stringify(this.styleDefault))
      this.panelDisplayOrginal = JSON.parse(JSON.stringify(this.panelDisplay))
      this.loadPreferences()

      this.buildDiacriticSettings()

      //set copyMode from preferences
      this.copyMode = this.styleDefault['--c-general-copy-mode'].value

      this.panelSizePresets = this.styleDefault['--o-edit-main-splitpane-edit-panel-size-presets'].value
        // fetch(this.configStore.returnUrls.scriptshifter + 'languages', {
        //   method: 'GET'
        // })
        // .then((response) => { return response.json(); })
        // .then((json) => {

        //   for (let k in json){

        //     json[k].s2r = false
        //     json[k].r2s = false

        //     if (this.scriptShifterOptions[k]){
        //       if (this.scriptShifterOptions[k].s2r){
        //         json[k].s2r = true
        //       }
        //       if (this.scriptShifterOptions[k].r2s){
        //         json[k].r2s = true
        //       }
        //     }

        //   }

        //   this.allScriptShifterOptions = json




        // });






    },
    /**
    * Saves the current settings to be reused later
    * @return {void}
    */
    savePreferences: function(){
      let bfPrefs = {
        styleDefault: this.styleDefault,
        panelDisplay: this.panelDisplay
      }
      let prefs = JSON.stringify(bfPrefs)
      window.localStorage.setItem('marva-preferences',prefs)
    },
    /**
    * Loads the saved preferences into the current preferences
    * @param {obj} data - preference data from a file
    *
    * @return {void}
    */
    loadPreferences: function(data=null){
      if (window.localStorage.getItem('marva-preferences') || data){
        let prefs = null

        if (!data){
          prefs = JSON.parse(window.localStorage.getItem('marva-preferences'))
        } else {
          prefs = data
        }

        // TEMP - 10/24 remove eventually
        for (let k in prefs.styleDefault){
          if (prefs.styleDefault[k].group == "Sidebars - OPAC"){
            prefs.styleDefault[k].group = "Sidebars - Previews"
          }
          if (prefs.styleDefault[k].group == "Shelflisting"){
            prefs.styleDefault[k].group = "Shelflisting"
          }

          if (k == '--b-edit-main-splitpane-edit-inline-mode'){
            prefs.styleDefault[k].group = 'CAMM Mode'
            prefs.styleDefault[k].desc = 'Compact Advanced Modular Mode.'
            prefs.styleDefault[k].descShort = 'Use CAMM Mode'
            // prefs.styleDefault[k].value = false



          }


        }

        // if there is a new style in the defaults that is not in their saved prefs.
        for (let k in this.styleDefault){
          if (!prefs.styleDefault[k]){
            prefs.styleDefault[k] = this.styleDefault[k]
          }
        }


        this.styleDefault = prefs.styleDefault
        this.panelDisplay = prefs.panelDisplay
      }
    },
    /**
    * Changes the preferences back to the default values
    * @return {void}
    */
    resetPreferences: function(){
      this.styleDefault = this.styleDefaultOrginal
      this.panelDisplay = this.panelDisplayOrginal
      this.savePreferences()
    },

    styleModalBackgroundColor(){ return `background-color: ${this.returnValue('--c-edit-modals-background-color')};`},
    styleModalTextColor(){ return `color: ${this.returnValue('--c-edit-modals-text-color')};`},





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
        return false
      }

      //update
      useProfileStore ().dataChanged()

      this.styleDefault[propertyName].value = value
      this.savePreferences()

      // we can do any actions on specific preference changes here
      if (propertyName == '--b-edit-main-literal-non-latin-first'){
        useProfileStore().reorderAllNonLatinLiterals()
        utilsParse.buildPairedLiteralsIndicators(useProfileStore().activeProfile)
        useProfileStore ().dataChanged()
      }


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
      this.savePreferences()
    },


    /**
    * Builds the diacrtic settings to use in the edit panel
    * @return {void}
    */
    buildDiacriticSettings: function(){

      this.diacriticUse = this.returnValue('--c-diacritics-enabled-macros')
      this.diacriticUse = [...new Set(this.diacriticUse)];

      // console.log(this.diacriticUse)
      for (let d in this.diacriticPacks.macroExpress){

        let macros = this.diacriticPacks.macroExpress[d]
        for (let macro of macros ){
          let key = d + '-' + macro.unicode
          if (this.diacriticUse.indexOf(key)>-1){
            this.diacriticUseValues.push(macro)
          }
        }
      }
      // console.log(this.diacriticUseValues)
    },

    // turn copy mode on/off
    toggleCopyMode: function(){
        this.copyMode = !this.copyMode
    },

    saveOrder: function(newOrder){
      this.setValue('--l-custom-order', newOrder)
    },

    loadOrder: function(){
      let currentOrder = this.returnValue('--l-custom-order')
      return currentOrder
    },

    deleteLayout: function(target){
      let currentLayouts = this.returnValue('--l-custom-layouts')
      delete currentLayouts[target]
      this.setValue('--l-custom-layouts', currentLayouts)
    },

    saveLayout: function(){
      let currentLayouts = this.returnValue('--l-custom-layouts')
      let components = []
      let compontGuids = []
      let layout = {}
      const profileId =  useProfileStore().activeProfile.id

      let layoutTargets = document.querySelectorAll('input[class=layout-selection]:checked')
      if (layoutTargets.length == 0){
        alert("No elements are selected for the layout. Select some and try again.")
        return false
      }

      let currentName = ""
      //prepopulate the prompt with the current layout name when editing
      if (this.layoutActive){
        currentName = this.layoutActiveFilter.label
      }
      let layoutName = prompt("Save layout as", currentName)
      if (layoutName == ""){
        alert("Layout name can't be empty.")
        return false
      }

      const hashCode = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)
      let layoutHash = hashCode(layoutName)
      layoutTargets.forEach((item) => compontGuids.push(item.id))
      for (const guid of compontGuids){
        let component = utilsProfile.returnPt(useProfileStore().activeProfile, guid)
        components.push(component)
      }

      layout = {
        profileId: profileId,
        label: layoutName,
        properties: {}
      }

      for (let component of components){
        const parentId = component.parentId
        const propertyUri = component.propertyURI
        let propertyId = component.id

        //Reduce the propertyId down to the base incase an added component is used to create the layout
        let breakPoint = propertyId.lastIndexOf("_")
        let base = propertyId.substring(0, breakPoint)
        let number = propertyId.substring(breakPoint+1)
        if (!isNaN(parseInt(number))){ // if number is a number, use the base
          propertyId = base
        }

        if (Object.keys(layout.properties).includes(parentId)){
          layout.properties[parentId].push(propertyId)
        } else {
          layout.properties[parentId] = [propertyId]
          // this needed to be more granular(?) Adding "Note about the work" will also pick up "Language note"
          // if it uses the propertyURI
        }
      }
      currentLayouts[layoutHash] = layout
      this.setValue('--l-custom-layouts', currentLayouts)

      // return the layout hash value so we can correctly refresh the current layout when editing
      return layoutHash
    },

    setTheme(themeName){

      let doubleChk = confirm("You want to switch your theme? Your current color settings will be permanently changed. If you want to save your current color settings download your preferences with 'Export Prefs' Do you want to continue?")
      if (!doubleChk){ return false}
      // to make the default list below download your preferences and then and open your javascript console and this code will generate the data to put in here as a new theme
      // let prefs = xxx_paste_replace_it_herexxx
      // let themeColors = {}; for (let p in prefs.prefs.styleDefault){if (prefs.prefs.styleDefault[p].type == 'color'){themeColors[p] = prefs.prefs.styleDefault[p].value}}; console.log(JSON.stringify(themeColors))

      let darkMode = {"--c-edit-main-splitpane-properties-background-color":"#000000ff","--c-edit-main-splitpane-properties-highlight-background-color":"#6f6f6f","--c-edit-main-splitpane-properties-font-color":"#fff","--c-edit-main-splitpane-properties-empty-indicator-color":"#6f6f6f","--c-edit-main-splitpane-properties-populated-indicator-color":"green","--c-edit-main-splitpane-slider-color":"#353535ff","--c-edit-main-splitpane-slider-border-color":"#4b4b4bff","--c-edit-main-splitpane-opac-background-color":"#000000ff","--c-edit-main-splitpane-opac-highlight-background-color":"#ffffffff","--c-edit-main-splitpane-opac-font-color":"#ffffffff","--c-edit-main-splitpane-edit-background-color-work":"#202f32ff","--c-edit-main-splitpane-edit-background-color-instance":"#380038ff","--c-edit-main-splitpane-edit-background-color-item":"#5965c0ff","--c-edit-main-splitpane-edit-background-color-instance-secondary":"#4654b9ff","--c-edit-main-splitpane-edit-component-label-color":"#dededeff","--c-edit-main-splitpane-edit-focused-field-color":"#353535ff","--c-edit-main-splitpane-edit-field-color":"#000000ff","--c-edit-main-splitpane-edit-field-border-color":"#333333ff","--c-edit-main-splitpane-edit-show-field-labels-color":"#c9c9c9ff","--c-edit-main-splitpane-edit-scroll-bar-track-color":"#212121ff","--c-edit-main-splitpane-edit-scroll-bar-thumb-color":"#a9a9a9ff","--c-edit-main-splitpane-nav-background-color":"#000000ff","--c-edit-main-splitpane-nav-font-color":"#ffffffff","--c-edit-main-literal-font-color":"#ffffffff","--c-edit-main-literal-lang-label-background-color":"#4b4b4bff","--c-edit-main-literal-lang-label-font-color":"#ffffffff","--c-edit-main-lookup-background-color":"#353535ff","--c-edit-main-lookup-border-color":"#4b4b4bff","--c-edit-main-lookup-text-color":"#ffffffff","--c-edit-main-lookup-icon-linked-color":"#1c7d76ff","--c-edit-main-lookup-simple-lookup-autocomplete-background-color":"#000000ff","--c-edit-main-lookup-simple-lookup-autocomplete-text-color":"#ffffffff","--c-edit-general-action-button-color":"#ffffffff","--c-edit-general-action-button-background-color":"#353535ff","--c-edit-general-action-button-border-color":"#a9a9a9ff","--n-edit-general-action-button-continer-background-color":"#212121ff","--c-edit-general-action-button-continer-border-color":"#202124","--c-edit-general-action-button-continer-color":"#202124","--n-edit-general-action-button-continer-background-highlight-color":"whitesmoke","--c-edit-general-action-button-menu-background-color":"#4b4b4bff","--c-edit-general-action-button-menu-button-background-color":"#000000ff","--c-edit-general-action-button-menu-button-border-color":"#a9a9a9ff","--c-edit-general-action-button-menu-button-text-color":"#ffffffff","--c-edit-modals-background-color":"#212121ff","--c-edit-modals-background-color-accent":"#353535ff","--c-edit-modals-text-color":"#ffffffff","--c-general-icon-instance-color":"#8b588b","--c-general-icon-work-color":"#7badad","--c-general-icon-item-color":"#eaeaea"}
      let grayMode = {"--c-edit-main-splitpane-properties-background-color":"#353535ff","--c-edit-main-splitpane-properties-highlight-background-color":"#6f6f6f","--c-edit-main-splitpane-properties-font-color":"#fff","--c-edit-main-splitpane-properties-empty-indicator-color":"#6f6f6f","--c-edit-main-splitpane-properties-populated-indicator-color":"green","--c-edit-main-splitpane-slider-color":"#a9a9a9ff","--c-edit-main-splitpane-slider-border-color":"#808080ff","--c-edit-main-splitpane-opac-background-color":"#a9a9a9ff","--c-edit-main-splitpane-opac-highlight-background-color":"#6f6f6f","--c-edit-main-splitpane-opac-font-color":"#202124","--c-edit-main-splitpane-edit-background-color-work":"#a1a1a1ff","--c-edit-main-splitpane-edit-background-color-instance":"#b8a9b6ff","--c-edit-main-splitpane-edit-background-color-item":"#bda2baff","--c-edit-main-splitpane-edit-background-color-instance-secondary":"#ba95b7ff","--c-edit-main-splitpane-edit-component-label-color":"black","--c-edit-main-splitpane-edit-focused-field-color":"#dededeff","--c-edit-main-splitpane-edit-field-color":"#a9a9a9ff","--c-edit-main-splitpane-edit-field-border-color":"#969696ff","--c-edit-main-splitpane-edit-show-field-labels-color":"#000000ff","--c-edit-main-splitpane-edit-scroll-bar-track-color":"#a9a9a9ff","--c-edit-main-splitpane-edit-scroll-bar-thumb-color":"#c7c7c7","--c-edit-main-splitpane-nav-background-color":"#a9a9a9ff","--c-edit-main-splitpane-nav-font-color":"#202124","--c-edit-main-literal-font-color":"black","--c-edit-main-literal-lang-label-background-color":"#dededeff","--c-edit-main-literal-lang-label-font-color":"#090909","--c-edit-main-lookup-background-color":"#dededeff","--c-edit-main-lookup-border-color":"#353535ff","--c-edit-main-lookup-text-color":"black","--c-edit-main-lookup-icon-linked-color":"green","--c-edit-main-lookup-simple-lookup-autocomplete-background-color":"#dededeff","--c-edit-main-lookup-simple-lookup-autocomplete-text-color":"black","--c-edit-general-action-button-color":"#202124","--c-edit-general-action-button-background-color":"#dededeff","--c-edit-general-action-button-border-color":"#202124","--n-edit-general-action-button-continer-background-color":"#dededeff","--c-edit-general-action-button-continer-border-color":"#202124","--c-edit-general-action-button-continer-color":"#202124","--n-edit-general-action-button-continer-background-highlight-color":"whitesmoke","--c-edit-general-action-button-menu-background-color":"#dededeff","--c-edit-general-action-button-menu-button-background-color":"rgb(239, 239, 239)","--c-edit-general-action-button-menu-button-border-color":"black","--c-edit-general-action-button-menu-button-text-color":"black","--c-edit-modals-background-color":"#a9a9a9ff","--c-edit-modals-background-color-accent":"#dededeff","--c-edit-modals-text-color":"black","--c-general-icon-instance-color":"#ba95b7ff","--c-general-icon-work-color":"#a9a9a9ff","--c-general-icon-item-color":"#eaeaea"}

      const ignore = ["--l-custom-layouts", "--c-diacritics-enabled-macros", "--o-diacritics-text-macros"]

      if (themeName == 'default'){
        // just loop through the defaults and set all them to the default value
        //  Don't touch diacritic, layouts, etc.
        console.log(this.styleDefaultOrginal)
        for (let key in this.styleDefaultOrginal){
          this.setValue(key, this.styleDefaultOrginal[key].value)
        }

      }else if (themeName == 'dark'){
        for (let key in darkMode){
          this.setValue(key, darkMode[key])
        }
      }else if (themeName == 'gray'){
        for (let key in grayMode){
          this.setValue(key, grayMode[key])
        }
      }

      this.savePreferences()

    },


    isNarTester(){

      // pioneers
      let canTest = ["kevinford","pfrank","eram","ctur","trod","jowill","ntra","ddavis","nalf","fd07","cyea","fc80","smcc","tsod","fo","hhuh","yshi","cc33","amors","cd01","mnaz","cgir","pkho","cf31","stellier","test",'matt', 'n123']
      // Dev
      // let canTest = ["dev", "matt", "fo", "pfrank", "kevinford", "n123"]

      // Convert initials and code to lowercase if they exist
      const initials = this.catInitals ? this.catInitals.toLowerCase() : '';
      const code = this.catCode ? this.catCode.toLowerCase() : '';

      // Convert all test strings to lowercase
      const canTestLower = canTest.map(item => item.toLowerCase());

      // Check if initials or code match any of the test strings
      return canTestLower.some(testStr =>
        (initials && initials.includes(testStr)) ||
        (code && code.includes(testStr))
      );


    },



    getPanelData(){
      let data = {}
      data.view = JSON.parse(JSON.stringify(this.panelDisplay))
      data.percents = {}
      data.default = false
      data.icon = null
      data.color = null
      data.id = short.generate()
      let panels = ['edit-main-splitpane-opac','edit-main-splitpane-marc','edit-main-splitpane-xml','edit-main-splitpane-edit-combined','edit-main-splitpane-edit-work','edit-main-splitpane-edit-instance','edit-main-splitpane-properties']
      for (let p of panels){
        if (document.querySelector(`.${p}`)===null){
          data.percents[p] = null
        }else{
          data.percents[p] = document.querySelector(`.${p}`).style.width
        }
      }
      return data
    },

    setPanelData(data){
      for (let key of Object.keys(data.view)){
        this.panelDisplay[key] = data.view[key]
      }

      // anything not stored turn off
      for (let key of Object.keys(this.panelDisplay)){
        if (!data.view[key]){
          this.panelDisplay[key] = false
        }
      }

      window.setTimeout(() => {

        for (let key of Object.keys(data.percents)){
          if (document.querySelector(`.${key}`)!==null){
          document.querySelector(`.${key}`).style.width  =  data.percents[key];
          document.querySelector(`.${key}`).style.width  =  data.percents[key];
          }
        }


      },50);


    }





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


