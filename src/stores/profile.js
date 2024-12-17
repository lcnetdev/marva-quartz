import { defineStore } from 'pinia'
import { useConfigStore } from './config'
import { usePreferenceStore } from './preference'

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
TimeAgo.addDefaultLocale(en)

import utilsNetwork from '@/lib/utils_network';
import utilsParse from '@/lib/utils_parse';
import utilsRDF from '@/lib/utils_rdf';
import utilsExport from '@/lib/utils_export';
// import utilsMisc from '@/lib/utils_misc';



import utilsProfile from '../lib/utils_profile'

import {unescape} from 'html-escaper';


import short from 'short-uuid'
const translator = short();
const decimalTranslator = short("0123456789");

const hashCode = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)

const LABEL_PREDICATES = [
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://www.loc.gov/mads/rdf/v1#authoritativeLabel',
  'http://id.loc.gov/ontologies/bibframe/code',
  'http://id.loc.gov/ontologies/bibframe/mainTitle',
  'http://id.loc.gov/ontologies/bibframe/title'
]

let cachePt = {}
let cacheGuid = {}
let dataChangedTimeout = null

// const nonLatinRegex = /^[A-z\u00C0-\u00ff\s'\.,-\/#!$%\^&\*;:{}=\-_`~()0-9]+$/;
// const latinRegex = /^[\u3040-\u309F\u30A0-\u30FF]+$/;
const latinRegex = /^[A-z\s'\.,-\/#!$%\^&\*;:{}=\-_`~()0-9\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u2C60-\u2C7F\uA720-\uA7FF]+$/

//https://stackoverflow.com/questions/49562546/how-to-get-all-properties-values-of-a-javascript-nested-objects-without-knowing
// clean cacheGuid of items that match the children of the PT that is insert default values too
function cleanCacheGuid(cache, obj, target){
  return Object.keys(obj).map(
    function(key){
      let value = obj[key]
      if (key == "@guid" && value == target){
        delete cache[value]
        return value
      } else if(Array.isArray(value)) {
        for (let el in value){
          return cleanCacheGuid( cache, value[el], target )
        }
      }else if (typeof value === "object"){
        return  cleanCacheGuid( cache, value, target )
      }
    }
  )
}

export const useProfileStore = defineStore('profile', {
  state: () => ({

    // flag if the profiles have been loaded and processed
    profilesLoaded: false,

    // holds all profiles
    profiles: {},

    // holds all rts, with its ID as the key
    rtLookup: {},

    // the starting points that display on the create new page
    startingPoints: {},

    // the current active profile
    activeProfile: {},

    activeProfileSaved: true,

    showPostModal: false,
    showRecoveryModal: false,
    showValidateModal: false,
    showHubStubCreateModal: false,
    activeHubStubData:{
    },
    activeHubStubComponent:{

    },
    showShelfListingModal: false,
    activeShelfListData:{
      class:null,
      cutter:null,
      classGuid:null,
      cutterGuid: null,
      componentGuid: null,
      componentPropertyPath:null
    },
    showAutoDeweyModal: false,
    deweyData: {
      lcc: null,
      guid: null,
      structure: null,
    },

    mostCommonNonLatinScript: null,
    nonLatinScriptAgents: {},

    // bf:title component/predicate for example, value will be the structure object for this component

    activeComponent: null,

    // bf:mainTitle for example, value will be the the structure object for this field
    // main thing we can use it for is to see which field is currently active in the interface via the @guid
    activeField: { '@guid' : null },

    dataChangedTimestamp: Date.now(),

    // the active guid of the literal field being assinged a @lang value
    // if it === false it hides the modal
    literalLangInfo: null,
    literalLangShow: false,



  }),
  getters: {

    /**
    * Can be used to return the structure of the component by passing the GUID
    * It doesn't care what profile it is in it will loop through all of them to find the unique GUID
    * @param {string} guid - the guid of the component
    * @return {object}
    */
    returnStructureByGUID: (state) => {
      return (guid) => {
        for (let rt in state.activeProfile.rt){
          for (let pt in state.activeProfile.rt[rt].pt){
            if (state.activeProfile.rt[rt].pt[pt]['@guid'] === guid){
              return state.activeProfile.rt[rt].pt[pt]
            }
          }
        }
      }
    },

    /**
    * Can be used to return the structure of the component by passing the GUID
    * It doesn't care what profile it is in it will loop through all of them to find the unique GUID
    * @param {string} guid - the guid of the component
    * @return {object}
    */
    returnPreferenceIdByGUID: (state) => {
      return (guid) => {
        for (let rt in state.activeProfile.rt){
          for (let pt in state.activeProfile.rt[rt].pt){
            if (state.activeProfile.rt[rt].pt[pt]['@guid'] === guid){
              return state.activeProfile.rt[rt].pt[pt].preferenceId
            }
          }
        }
      }
    },

    returnUserModifiedIdByGUID: (state) => {
      return (guid) => {
        for (let rt in state.activeProfile.rt){
          for (let pt in state.activeProfile.rt[rt].pt){
            if (state.activeProfile.rt[rt].pt[pt]['@guid'] === guid){
              return state.activeProfile.rt[rt].pt[pt].userModified
            }
          }
        }
      }
    },





  },
  actions: {


    resetLocalComponentCache(){
      cachePt = {}
      cacheGuid = {}
      dataChangedTimeout = null
    },


    /**
    * The main first process that takes the raw profiles and processes them for use
    *
    * @return {void}
    */
    async buildProfiles() {
      const config = useConfigStore()

      let profileData;

      try{
        let response = await fetch(config.returnUrls.profiles);
        profileData =  await response.json()
      }catch(err){
        alert('Could not download the profiles, unable to continue.')
        console.error(err);
      }


      let startingPointData;


      try{
        let response = await fetch(config.returnUrls.starting);
        startingPointData =  await response.json()
      }catch(err){
        alert('Could not download the starting points, unable to continue.')
        console.error(err);
      }





      // FLAG: NEEDS_PROFILE_ALIGNMENT
      // TEMP HACK ADD IN HUBS

      if (startingPointData[0]){
          startingPointData[0].json.push(
              {
                  "menuGroup": "Hub",
                  "menuItems": [
                      {
                          "label": "Hub",
                          "type": [
                              "http://id.loc.gov/ontologies/bibframe/Hub"
                          ],
                          "useResourceTemplates": [
                              "lc:RT:bf2:Hub:Hub"
                          ]
                      }
                  ]
              }
          )
      }else if (startingPointData.json){
          startingPointData.json.push(
              {
                  "menuGroup": "Hub",
                  "menuItems": [
                      {
                          "label": "Hub",
                          "type": [
                              "http://id.loc.gov/ontologies/bibframe/Hub"
                          ],
                          "useResourceTemplates": [
                              "lc:RT:bf2:Hub:Hub"
                          ]
                      }
                  ]
              }
          )
      }


      // FLAG: NEEDS_PROFILE_ALIGNMENT
      // TEMP HACK, striping RDA fields for some things for the new editor
      for (let p of profileData){

          if (p.json.Profile.id == 'lc:profile:bf2:Agents:Attributes'){

              for (let rt of p.json.Profile.resourceTemplates){
                  if (['lc:RT:bf2:Agent:Person','lc:RT:bf2:Agent:Family','lc:RT:bf2:Agent:CorporateBody','lc:RT:bf2:Agent:Conference','lc:RT:bf2:Agent:Jurisdiction'].indexOf(rt.id)>-1){
                      rt.propertyTemplates = [rt.propertyTemplates[0]]
                  }
              }

          }

          // remove certin properties from the RTs
          p.json.Profile.resourceTemplates = p.json.Profile.resourceTemplates.filter((rt)=>{
              rt.propertyTemplates = rt.propertyTemplates.filter((pt)=>{
                  if (pt.propertyLabel && (pt.propertyLabel.startsWith('Input RDA relationship designator ter') ||
                      pt.propertyLabel.startsWith('Input Geographic Coverage (if not on list)'))){
                      return false
                  }

                  if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/adminMetadata'){
                      return false
                  }

                  return true
              })

              if (rt){
                  return true
              }


          })

          // modify specific PT values
          for (let rt of p.json.Profile.resourceTemplates){


              if (config.profileHacks.profileParseFixLowerCaseContribution.enabled){
                  if (rt.id === 'lc:RT:bf2:Agents:contribution'){
                      rt.id = 'lc:RT:bf2:Agents:Contribution'
                  }
              }

              // modify the subject headings to match the new editor
              if (rt.id == 'lc:RT:bf2:Components'){
                  for (let pt of rt.propertyTemplates){
                      pt.valueConstraint.valueTemplateRefs = pt.valueConstraint.valueTemplateRefs.filter((ref)=>{if (ref == 'lc:RT:bf2:Topic:madsTopic'){ return true}})
                  }
              }
              if (rt.id == 'lc:RT:bf2:Topic:Place:Components'){
                  for (let pt of rt.propertyTemplates){
                      pt.valueConstraint.valueTemplateRefs = pt.valueConstraint.valueTemplateRefs.filter((ref)=>{if (ref == 'lc:RT:bf2:Topic:madsGeogHeading'){ return true}})
                  }
              }
              if (rt.id == 'lc:RT:bf2:Topic:Childrens:Components'){
                  for (let pt of rt.propertyTemplates){
                      pt.valueConstraint.valueTemplateRefs = pt.valueConstraint.valueTemplateRefs.filter((ref)=>{if (ref == 'lc:RT:bf2:Topic:Childrens:Topic'){ return true}})
                  }
              }


              if (rt.id == 'lc:RT:bf2:Brief:Work'){
                  rt.propertyTemplates = [
                          {
                              "mandatory": "false",
                              "propertyLabel": "Lookup",
                              "propertyURI": "http://id.loc.gov/ontologies/bibframe/Work",
                              "repeatable": "true",
                              "resourceTemplates": [],
                              "type": "lookup",
                              "valueConstraint": {
                                  "defaults": [],
                                  "useValuesFrom": [
                                      "https://preprod-8230.id.loc.gov/resources/works"
                                  ],
                                  "valueDataType": {
                                      "dataTypeURI": ""
                                  },
                                  "valueTemplateRefs": []
                              }
                          }]

              }

              if (rt.id == 'lc:RT:bf2:GPORelWorkBrief'){
                  rt.propertyTemplates = [
                          {
                              "mandatory": "false",
                              "propertyLabel": "Lookup",
                              "propertyURI": "http://id.loc.gov/ontologies/bibframe/Work",
                              "repeatable": "true",
                              "resourceTemplates": [],
                              "type": "lookup",
                              "valueConstraint": {
                                  "defaults": [],
                                  "useValuesFrom": [
                                      "https://preprod-8295.id.loc.gov/resources/works"
                                  ],
                                  "valueDataType": {
                                      "dataTypeURI": ""
                                  },
                                  "valueTemplateRefs": []
                              }
                          }]

              }

              if (rt.id == 'lc:RT:bf2:Brief:Instance'){
                  rt.propertyTemplates = [
                          {
                              "mandatory": "false",
                              "propertyLabel": "Lookup",
                              "propertyURI": "http://id.loc.gov/ontologies/bibframe/Instance",
                              "repeatable": "true",
                              "resourceTemplates": [],
                              "type": "lookup",
                              "valueConstraint": {
                                  "defaults": [],
                                  "useValuesFrom": [
                                      "https://preprod-8230.id.loc.gov/resources/instances"
                                  ],
                                  "valueDataType": {
                                      "dataTypeURI": ""
                                  },
                                  "valueTemplateRefs": []
                              }
                          }]

              }

              // add wikidata into any NAF lookup pt
              if (rt.id.includes(':Agent')){
                  for (let pt of rt.propertyTemplates){
                      if (pt.valueConstraint.useValuesFrom.indexOf('http://preprod.id.loc.gov/authorities/names')>-1){
                          if (pt.valueConstraint.useValuesFrom.indexOf('https://www.wikidata.org/w/api.php')==-1){
                              pt.valueConstraint.useValuesFrom.push('https://www.wikidata.org/w/api.php')
                          }
                      }
                  }
              }


              for (let pt of rt.propertyTemplates){

                  if (config.profileHacks.profileParseFixPropertyURIWhenUpperCase.enabled){

                      // something to think about...?
                      if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/Role'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/role'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/Frequency'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/frequency'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/ProductionMethod'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/productionMethod'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/GrooveCharacteristic'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/soundCharacteristic'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/MusicNotation'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/notation'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bflc/Relation'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bflc/relation'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/Scale'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/scale'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/Frequency'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/frequency'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/Place'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/place'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/Illustration'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/illustrativeContent'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/PlaybackChannels'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/soundCharacteristic'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/RecordingMethod'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/soundCharacteristic'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/BroadcastStandard'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/videoCharacteristic'
                      // }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bflc/CaptureStorage'){
                      //     pt.propertyURI = 'http://id.loc.gov/ontologies/bflc/captureStorage'

                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/ColorContent'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/colorContent'

                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/ColorContent'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/colorContent'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/EncodingFormat'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/digitalCharacteristic'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/FileType'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/digitalCharacteristic'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/IntendedAudience'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/intendedAudience'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/PresentationFormat'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/projectionCharacteristic'

                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/Language'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/language'
                      }else if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/SupplementaryContent'){
                          pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/supplementaryContent'

                      }

                      // others?
                      // "propertyURI": "http://id.loc.gov/ontologies/bflc/MovingImageTechnique",
                      // "propertyURI": "http://id.loc.gov/ontologies/bibframe/Generation",
                      // "propertyURI": "http://id.loc.gov/ontologies/bibframe/RecordingMedium",
                      // "propertyURI": "http://id.loc.gov/ontologies/bibframe/RegionalEncoding",
                      // "propertyURI": "http://id.loc.gov/ontologies/bibframe/SoundContent",
                      // "propertyURI": "http://id.loc.gov/ontologies/bibframe/PlaybackCharacteristic",
                      // "propertyURI": "http://id.loc.gov/ontologies/bibframe/MusicInstrument",
                      // "propertyURI": "http://id.loc.gov/ontologies/bibframe/MusicVoice",
                      // "propertyURI": "http://id.loc.gov/ontologies/bibframe/MusicEnsemble",
                  }
              }
          }
      }


      // -------- end HACKKCKCKCKCK
      profileData.forEach((p)=>{


          // build the first level profiles
          if (p.json && p.json.Profile){

              // for example monograph -> work
              this.profiles[p.json.Profile.id] = {
                  rtOrder: [],
                  rt: {},
                  id: p.json.Profile.id
              }
              // now make obj of all the properties in each top level
              // for example monograph -> work -> title
              if (p.json.Profile.resourceTemplates){

                  p.json.Profile.resourceTemplates.forEach((rt)=>{
                      this.profiles[p.json.Profile.id].rtOrder.push(rt.id)
                      this.profiles[p.json.Profile.id].rt[rt.id] = {ptOrder:[],pt:{}}
                      if (rt.propertyTemplates){
                          rt.propertyTemplates.forEach((pt)=>{
                              pt.parent = p.json.Profile.id + rt.id + p.id
                              pt.parentId = rt.id
                              pt.userValue =  {'@root':pt.propertyURI}
                              pt.valueConstraint.valueTemplateRefs = pt.valueConstraint.valueTemplateRefs.filter((v)=>{return (v.length>0)})
                              pt['@guid'] = short.generate()
                              pt.canBeHidden = true

                              if (pt.type === 'literal-lang'){
                                  this.profiles[p.json.Profile.id].rt[rt.id].hasLiteralLangFields = true
                              }

                              // try to make a profile wide unique identifier to hang preferences off of for that property
                              let propUniqueId = null
                              if (pt.propertyURI.includes("/note")){
                                propUniqueId = pt.propertyURI + "|" + pt.parentId
                              }else if (pt.valueConstraint && pt.valueConstraint.valueDataType && pt.valueConstraint.valueDataType.dataTypeURI){
                                propUniqueId = pt.propertyURI + "|" + pt.valueConstraint.valueDataType.dataTypeURI
                              }else if (pt.valueConstraint && pt.valueConstraint.valueTemplateRefs && pt.valueConstraint.valueTemplateRefs.length>0 ){
                                propUniqueId = pt.propertyURI + "|" + pt.valueConstraint.valueTemplateRefs[0]
                              }else if (pt.valueConstraint && pt.valueConstraint.useValuesFrom && pt.valueConstraint.useValuesFrom.length>0 ){
                                propUniqueId = pt.propertyURI + "|" + pt.valueConstraint.useValuesFrom[0]
                              }else{
                                propUniqueId = pt.propertyURI + "|" + pt.parentId
                              }

                              pt.preferenceId = propUniqueId
                              let key = pt.propertyURI.replace('http://','').replace('https://','').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"_") + '__' + ((pt.propertyLabel) ? pt.propertyLabel.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g,'_').toLowerCase() : "plabel")
                              this.profiles[p.json.Profile.id].rt[rt.id].ptOrder.push(key)
                              this.profiles[p.json.Profile.id].rt[rt.id].pt[key] = pt
                              this.profiles[p.json.Profile.id].rt[rt.id].pt[key].id = key

                          })
                      }
                  })
              }

          }

          // loop through each profile and extract the resource template, save them as their own look up for later use
          if (p.json && p.json.Profile && p.json.Profile.resourceTemplates){
              p.json.Profile.resourceTemplates.forEach((rt)=>{
                  this.rtLookup[rt.id] = rt
              })
          }
      })

      // make a copy of the obj to cut refs to the orginal
      // this.profiles = Object.assign({}, this.profiles)
      //this.profiles = JSON.parse(JSON.stringify(this.profiles))





      // make a lookup for just the profiles rts
      let plookup = {}
      for (let p of Object.keys(this.profiles)){
          this.profiles[p].rtOrder.forEach((rtname)=>{
              plookup[rtname] = this.profiles[p].rt[rtname]
          })
      }

      // we have starting points, generate those profiles based on their requirements
      // this is just converting the format of the old BFE starting points format
      if (Array.isArray(startingPointData)){
          startingPointData = startingPointData[0]
      }



      // HACKHACKHACKHACK
      if (config.returnUrls.env != 'production'){
          startingPointData.json.splice(2,0,{
              "menuGroup": "GPO Monograph",
              "menuItems": [
                  {
                      "label": "Instance",
                      "type": [
                          "http://id.loc.gov/ontologies/bibframe/Instance"
                      ],
                      "useResourceTemplates": [
                          "lc:RT:bf2:GPOMono:Instance"
                      ]
                  },
                  {
                      "label": "Work",
                      "type": [
                          "http://id.loc.gov/ontologies/bibframe/Work"
                      ],
                      "useResourceTemplates": [
                          "lc:RT:bf2:GPOMono:Work"
                      ]
                  }
              ]
          })
          startingPointData.json.splice(3,0,{
              "menuGroup": "GPO Serial",
              "menuItems": [
                  {
                      "label": "Instance",
                      "type": [
                          "http://id.loc.gov/ontologies/bibframe/Instance"
                      ],
                      "useResourceTemplates": [
                          "lc:RT:bf2:GPOSerial:Instance"
                      ]
                  },
                  {
                      "label": "Work",
                      "type": [
                          "http://id.loc.gov/ontologies/bibframe/Work"
                      ],
                      "useResourceTemplates": [
                          "lc:RT:bf2:GPOSerial:Work"
                      ]
                  }
              ]
          })
      }


      startingPointData.json.forEach((sp)=>{

          this.startingPoints[sp.menuGroup] = {name:sp.menuGroup, work: null, instance: null, item: null }
          sp.menuItems.forEach((mi)=>{

              if (mi.type.indexOf('http://id.loc.gov/ontologies/bibframe/Instance')>-1){

                  this.startingPoints[sp.menuGroup].instance = mi.useResourceTemplates[0]
              }
              if (mi.type.indexOf('http://id.loc.gov/ontologies/bibframe/Work')>-1){

                  this.startingPoints[sp.menuGroup].work = mi.useResourceTemplates[0]
              }
              if (mi.type.indexOf('http://id.loc.gov/ontologies/bibframe/Item')>-1){

                  this.startingPoints[sp.menuGroup].item = mi.useResourceTemplates[0]
              }
              if (mi.type.indexOf('http://id.loc.gov/ontologies/bibframe/Hub')>-1){

                  this.startingPoints[sp.menuGroup].hub = mi.useResourceTemplates[0]
              }


          })

          // create a "profile" for this starting point in our profiles
          this.profiles[sp.menuGroup] ={ id: sp.menuGroup, rt: {}, rtOrder : [] }
          if (this.startingPoints[sp.menuGroup].hub){
              this.profiles[sp.menuGroup].rt[this.startingPoints[sp.menuGroup].hub] = plookup[this.startingPoints[sp.menuGroup].hub]
              this.profiles[sp.menuGroup].rtOrder.push(this.startingPoints[sp.menuGroup].hub)
          }
          if (this.startingPoints[sp.menuGroup].work){
              this.profiles[sp.menuGroup].rt[this.startingPoints[sp.menuGroup].work] = plookup[this.startingPoints[sp.menuGroup].work]
              this.profiles[sp.menuGroup].rtOrder.push(this.startingPoints[sp.menuGroup].work)
          }


          if (this.startingPoints[sp.menuGroup].instance){
              this.profiles[sp.menuGroup].rt[this.startingPoints[sp.menuGroup].instance] = plookup[this.startingPoints[sp.menuGroup].instance]
              this.profiles[sp.menuGroup].rtOrder.push(this.startingPoints[sp.menuGroup].instance)
          }

          // if there is a hub and work and instance then always put the hub at the start
          if (this.startingPoints[sp.menuGroup].hub && this.startingPoints[sp.menuGroup].work && this.startingPoints[sp.menuGroup].instance){

              this.profiles[sp.menuGroup].rtOrder = []
              this.profiles[sp.menuGroup].rtOrder.push(this.startingPoints[sp.menuGroup].hub)
              this.profiles[sp.menuGroup].rtOrder.push(this.startingPoints[sp.menuGroup].work)
              this.profiles[sp.menuGroup].rtOrder.push(this.startingPoints[sp.menuGroup].instance)
          }





      })

      for (let p in this.profiles){
          this.profiles[p].hashRts = {}
          this.profiles[p].hashPts = {}

          for (let rt in this.profiles[p].rt){
              if (this.profiles[p].rt[rt]){
                  this.profiles[p].hashRts[rt] = this.hashRt(this.profiles[p].rt[rt])
              }

              if (this.profiles[p].rt[rt] && this.profiles[p].rt[rt].pt){
                  for (let pt in this.profiles[p].rt[rt].pt){
                      // build the key to the property
                      let id = rt + '|' + this.profiles[p].rt[rt].pt[pt].propertyURI
                      if (this.profiles[p].rt[rt].pt[pt].valueConstraint && this.profiles[p].rt[rt].pt[pt].valueConstraint.valueDataType && this.profiles[p].rt[rt].pt[pt].valueConstraint.valueDataType.dataTypeURI && this.profiles[p].rt[rt].pt[pt].valueConstraint.valueDataType.dataTypeURI.trim() != ''){
                          id = id + '|' + this.profiles[p].rt[rt].pt[pt].valueConstraint.valueDataType.dataTypeURI
                      }
                      // builds an id like this: lc:RT:bf2:35mmFeatureFilm:Work|http://id.loc.gov/ontologies/bibframe/contribution|http://id.loc.gov/ontologies/bflc/PrimaryContribution
                      let ptVal = JSON.parse(JSON.stringify(this.profiles[p].rt[rt].pt[pt]))
                      delete ptVal['@guid']
                      this.profiles[p].hashPts[id] = hashCode(JSON.stringify(ptVal))
                  }


              }
          }
      }
      console.log('this.profiles',this.profiles)
      this.profilesLoaded = true
      // return { profiles: this.profiles, lookup: this.rtLookup, startingPoints: this.startingPoints}


    },

    /**
    * Takes a resource template from the profile and creates a hash of the json-fied version of it to use as a fingerprint, to see if it changes later
    * For use in "template" functionality, to know if a resource template has changed since a template has used it
    *
    * @param {object} rt - the rt from the profile
    * @return {number} The fingerprint hash
    */
    hashRt: function(rt){
        rt = JSON.parse(JSON.stringify(rt))
        for (let pt in rt.pt){
            delete rt.pt[pt]['@guid']
        }
        return hashCode(JSON.stringify(rt))
    },




    /**
    * does all the work to setup a new profile read to be edited and posted as new resource
    *
    * @param {string} useStartingPoint - the name of the starting point to use to as the profile
    * @param {string} addAdmin - the caloger user id to use in the admin metadata, if undefined it will not add a adminMetadata
    * @param {object} userTemplateSupplied - a specific profile is being asked to be prepared, so don't look it up in the starting points, just use this one
    * @return {object} useProfile - the profile modified ready to bet set in the state and edited
    */
    loadNewTemplate(useStartingPoint,addAdmin,userTemplateSupplied){

      const config = useConfigStore()

      // should be the catinitals to insert into admin if being passed
      if (typeof addAdmin === 'undefined'){
        addAdmin=false
      }

      let useProfile

      if (userTemplateSupplied){
        useProfile = userTemplateSupplied
      }else{
        useProfile = JSON.parse(JSON.stringify(this.profiles[useStartingPoint]))
      }

      // some profiles have nested components at the root level used in that component
      // so if it doesn't end with one of the main type of resources we want to edit
      // then we don't want to render it, since it is probably being used in the main RT somewhere
      let toRemove = []
      let toKeep = []
      for (let rt of useProfile.rtOrder){

        let hasTLS = false
        for (let TLS of config.validTopLevelProfileSufixes){
          if (rt.includes(TLS)){
            hasTLS = true
          }
        }

        if (hasTLS === false){
          toRemove.push(rt)
        }else{
          toKeep.push(rt)
        }
      }


      for (let rt of toRemove){
        delete useProfile.rt[rt]
      }
      useProfile.rtOrder = toKeep


      if (!useProfile.log){
        useProfile.log=[]
      }
      useProfile.log.push({action:'createWorkInstance'})
      useProfile.procInfo= config.procInfoNewWorkInstance


      // also give it an ID for storage
      if (!useProfile.eId){
      let uuid = 'e' + decimalTranslator.new()
      uuid = uuid.substring(0,8)
      useProfile.eId= uuid

      }

      if (!useProfile.user){
        useProfile.user = usePreferenceStore().returnUserNameForSaving
      }

      if (!useProfile.status){
        useProfile.status = 'unposted'
      }

      let workUri = null
      let workUriId = translator.toUUID(translator.new())

      for (let rt in useProfile.rt){
        let uri = null

        // make a new uri for each one
        if (rt.endsWith(config.validTopLevelWork)){
          uri = config.baseURIWork + workUriId
          workUri = uri
        }else if (rt.endsWith(config.validTopLevelInstance)){

          // when making a new instance from scratch use the work URI Id peice as the instance ID piece
          uri = config.baseURIInstance + workUriId

        }else if (rt.endsWith(config.validTopLevelItem)){
          uri = config.baseURIItem + translator.toUUID(translator.new())
        }else if (rt.endsWith(config.validTopLevelHub)){
          uri = config.baseURIHub + translator.toUUID(translator.new())
        }else{
          // dunno what this is give it a random uri
          uri = 'http://id.loc.gov/resources/unknown/' + translator.toUUID(translator.new())
        }

        useProfile.rt[rt].URI = uri

        for (let pt in useProfile.rt[rt].pt){

          if (useProfile.rt[rt].pt[pt].propertyURI == "http://id.loc.gov/ontologies/bibframe/Work"){
            useProfile.rt[rt].pt[pt].userValue={
              '@root': 'http://id.loc.gov/ontologies/bibframe/Work',
              '@guid': short.generate() ,
              '@id': uri,
            }
          }
        }

      }


      // apply the data we gathered / created above
      for (let rt in useProfile.rt){
        if (rt.includes(config.validTopLevelWork)){
          // something
        }else if (rt.includes(config.validTopLevelInstance)){
          //something
          useProfile.rt[rt].instanceOf = workUri
        }else if (rt.includes(config.validTopLevelItem)){
          //something
        }
      }

      // console.log('------useProfile-------')
      // console.log(useProfile)

      if (addAdmin){
        for (let rt in useProfile.rt){
          let adminMetadataProperty = {
              "mandatory": false,
              "propertyLabel": "Admin Metadata",
              "propertyURI": "http://id.loc.gov/ontologies/bibframe/adminMetadata",
              "repeatable": false,
              "resourceTemplates": [],
              '@guid': short.generate(),
              "type": "resource",
              "userValue": {
                "@root":"http://id.loc.gov/ontologies/bibframe/adminMetadata",
                "http://id.loc.gov/ontologies/bibframe/adminMetadata":[{

                    "@type": "http://id.loc.gov/ontologies/bibframe/AdminMetadata",
                    '@guid': short.generate(),
                    "http://id.loc.gov/ontologies/bflc/catalogerId": [
                      {
                      "@guid": short.generate(),
                      "http://id.loc.gov/ontologies/bflc/catalogerId": addAdmin
                      }
                    ]
                }]
              },
              "valueConstraint": {
                "defaults": [],
                "useValuesFrom": [],
                "valueDataType": {},
                "valueTemplateRefs": [  (!rt.includes(':GPO')) ? 'lc:RT:bf2:AdminMetadata:BFDB' :   'lc:RT:bf2:GPOMono:AdminMetadata'   ]
              }
            }
          let adminMetadataPropertyLabel = 'http://id.loc.gov/ontologies/bibframe/adminMetadata'.replace('http://','').replace('https://','').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"_") + '__admin_metadata'

          if (useProfile.rt[rt].pt[adminMetadataPropertyLabel]){
            // console.log("Admin already exists for ", rt, 'chahhing userid')
            // it already exists, so update the catalogerId and use the existing userValue

            if (useProfile.rt[rt].pt[adminMetadataPropertyLabel].userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata'][0]["http://id.loc.gov/ontologies/bflc/catalogerId"]){
                useProfile.rt[rt].pt[adminMetadataPropertyLabel].userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata'][0]["http://id.loc.gov/ontologies/bflc/catalogerId"] =  [
                  {
                  "@guid": short.generate(),
                  "http://id.loc.gov/ontologies/bflc/catalogerId": addAdmin
                  }
                ]
            }
            // TODO remove local system number

          }else{
            // console.log("Admin does not exists for ", rt, 'adding it')
            // doesn't exist, add it to the ptOrder and pt
            useProfile.rt[rt].ptOrder.push(adminMetadataPropertyLabel)
            useProfile.rt[rt].pt[adminMetadataPropertyLabel] = JSON.parse(JSON.stringify(adminMetadataProperty))
          }

        }
      }





      // console.log(JSON.stringify(useProfile,null,2))


      return useProfile


    },


    /**
    * Keeps track of what field and component the user interface is currently working in
    *
    * @param {object} structure - the profile structure the field is being built with
    * @return {void}
    */
    setActiveField: function(structure){




    },



    /**
    * Prepares the data in the component for switch the ref template, for example going
    * from main title to variant title, it needs to change the userValue mostly
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {array} propertyPath - array of strings mapping the predicates to the blanknode for the value
    * @param {object} nextRef - the template object representing the template we are switching to
    * @param {object} thisRef - the template object representing the template we currently on

    * @return {void}
    */

    changeRefTemplate: function(componentGuid, propertyPath, nextRef, thisRef){
      // let lastProperty = propertyPath.at(-1).propertyURI
      // // locate the correct pt to work on in the activeProfile
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      //should be safe to delete the cache when swaping templates
      if (Object.keys(cachePt).includes(componentGuid)){
          delete cachePt[componentGuid]
      }
      for (let guid of Object.keys(cacheGuid)){
          cleanCacheGuid(cacheGuid,  JSON.parse(JSON.stringify(pt.userValue)), guid)
      }

      if (pt !== false){
        pt.activeType = nextRef.resourceURI
        let baseURI = pt.propertyURI

        // map to the first level
        if (!pt.userValue[baseURI]){
            pt.userValue[baseURI]=[{}]
        }
        let userValue = pt.userValue[baseURI][0]
        // always remove the @id, except for subjects. Without it, things won't be linked after swapping
        if (userValue['@id'] && !(thisRef.id.includes(":Components") || thisRef.id.includes("Topic"))){
            delete userValue['@id']
        }

        // keep PrimaryContribution
        if (!["http://id.loc.gov/ontologies/bibframe/PrimaryContribution"].includes(userValue['@type'])){
          userValue['@type'] = nextRef.resourceURI
        }

        // store the other properies as well
        if (!pt.refTemplateUserValueKeys){
            pt.refTemplateUserValueKeys = {}
        }

        if (!pt.refTemplateUserValueKeys[thisRef.id]){
            pt.refTemplateUserValueKeys[thisRef.id] = []
        }

        for (let key in pt.userValue){
            if (!key.startsWith('@')){
                pt.refTemplateUserValueKeys[thisRef.id].push(key)
            }
        }

        // if there are properties in the old template that are not in the new one then we need to remove them from the userValue
        let possibleProperties = nextRef.propertyTemplates.map((p) => {return p.propertyURI})

        // The subject properties need to be updated, or the data will be erased, is there a better way?
        if (thisRef.id.includes(":Components") || thisRef.id.includes("Topic")){
          possibleProperties = ["@id", "http://www.loc.gov/mads/rdf/v1#componentList", "http://www.w3.org/2000/01/rdf-schema#label", "http://id.loc.gov/ontologies/bibframe/source", "http://id.loc.gov/ontologies/bflc/marcKey", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel", "http://www.loc.gov/mads/rdf/v1#isMemberOfMADSScheme"]
        }

        if (!pt.refTemplateUserValue){
            pt.refTemplateUserValue = {}
        }

        for (let key in userValue){
          //For contributions, keep the keys for agent role so the data persists
          if (!key.startsWith('@') && !["http://id.loc.gov/ontologies/bibframe/agent", "http://id.loc.gov/ontologies/bibframe/role"].includes(key)){
            if (possibleProperties.indexOf(key) == -1){
                // this property has no place in the ref template we are about to switch to
                // so store them over in the refTemplateUserValue for later if needed
                pt.refTemplateUserValue[key] = JSON.parse(JSON.stringify(userValue[key]))
                delete userValue[key]
            }
          } else if (key == "@id"){ //for subjects, keep the "@id"
            pt.refTemplateUserValue[key] = JSON.parse(JSON.stringify(userValue[key]))
            delete userValue[key]
          }
        }

        // see if there are any properties stored in refTemplateUserValue that
        // can be filled into this template

        for (let pp of possibleProperties){
            if (pt.refTemplateUserValue[pp]){
                // don't use http://id.loc.gov/ontologies/bibframe/assigner aka source
                // kind of a hackish thing, but the source is really not transferable between
                // differnt types of classifications so leave it out, it will get populated with the default so
                // we shouldn't loose any data, only if they change it then cycle the options then it will be lost and need to re-add
                if (pp != 'http://id.loc.gov/ontologies/bibframe/assigner'){
                    userValue[pp]= JSON.parse(JSON.stringify(pt.refTemplateUserValue[pp]))
                }
                delete pt.refTemplateUserValue[pp]
            }
        }

        // also check to see if there are default values in the orignal profile that we might need to over write with if they are switching


        // for (let ptIdx of this.rtLookup[nextRef.id].propertyTemplates){
        //     if (ptIdx.valueConstraint.defaults && ptIdx.valueConstraint.defaults.length>0){
        //         // console.log("These fdautls:",ptIdx.valueConstraint.defaults && ptIdx.valueConstraint.defaults[0])
        //         // console.log(ptIdx.propertyURI)
        //         // if there is already this property in the uservalue remove it
        //         if (userValue[ptIdx.propertyURI]){
        //             userValue[ptIdx.propertyURI] = []
        //         }

        //         // popualte with the default

        //         if (ptIdx.valueConstraint.defaults[0].defaultLiteral){



        //             // if the default is for a label property, don't double nest it
        //             if (ptIdx.propertyURI === 'http://www.w3.org/2000/01/rdf-schema#label'){

        //                 userValue[ptIdx.propertyURI]= [
        //                     {
        //                         'http://www.w3.org/2000/01/rdf-schema#label':ptIdx.valueConstraint.defaults[0].defaultLiteral,
        //                         '@guid': short.generate(),
        //                     }
        //                 ]

        //             }else{
        //                 userValue[ptIdx.propertyURI]= [{
        //                     '@guid': short.generate(),
        //                     'http://www.w3.org/2000/01/rdf-schema#label': [
        //                         {
        //                             'http://www.w3.org/2000/01/rdf-schema#label':ptIdx.valueConstraint.defaults[0].defaultLiteral,
        //                             '@guid': short.generate(),
        //                         }
        //                     ]

        //                 }]

        //             }



        //         }

        //         if (ptIdx.valueConstraint.defaults[0].defaultURI && ptIdx.valueConstraint.defaults[0].defaultURI.trim() != ""){


        //             userValue[ptIdx.propertyURI][0]['@id'] = ptIdx.valueConstraint.defaults[0].defaultURI

        //             if (ptIdx.valueConstraint.valueDataType && ptIdx.valueConstraint.valueDataType.dataTypeURI){
        //                 userValue[ptIdx.propertyURI][0]['@type'] = ptIdx.valueConstraint.valueDataType.dataTypeURI
        //             }



        //         }




        //     }
        // }

        // they changed something
        this.dataChanged()
      }else{
        console.error('changeRefTemplate: Cannot locate the component by guid', componentGuid, this.activeProfile)
      }


    },




    /**
    * Sets a "Simple lookup" value, things from small controlled lists like role
    * this function only creates new values, does not modify (aka delete)
    * @async
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {string} fieldGuid - the guid of the field
    * @param {array} propertyPath - array of strings mapping the predicates to the blanknode for the value
    * @param {string} URI - the URI for the value
    * @param {string} label - the label to use

    * @return {void}
    */
    setValueSimple: async function(componentGuid, fieldGuid, propertyPath, URI, label){
      propertyPath = JSON.parse(JSON.stringify(propertyPath))
      propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.w3.org/2002/07/owl#sameAs')  })


      let lastProperty = propertyPath.at(-1).propertyURI
      // locate the correct pt to work on in the activeProfile
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      if (pt !== false){

        pt.hasData = true
        pt.userModified = true
        pt.dataLoaded = false

        // find the correct blank node to edit if possible, if we don't find it then we need to create it
        let blankNode = utilsProfile.returnGuidLocation(pt.userValue,fieldGuid)

        if (blankNode === false){
          // create the path to the blank node
          let buildBlankNodeResult = await utilsProfile.buildBlanknode(pt,propertyPath)


          pt = buildBlankNodeResult[0]

          // now we can make a link to the parent of where the literal value should live
          blankNode = utilsProfile.returnGuidLocation(pt.userValue,buildBlankNodeResult[1])

          // set the URI
          // if its null then we are adding a literal
          if (URI !== null){
            blankNode['@id'] = URI
          }else{
            // do nothing for now...
          }

          blankNode['http://www.w3.org/2000/01/rdf-schema#label'] = [
            {
              '@guid': short.generate(),
              'http://www.w3.org/2000/01/rdf-schema#label' : label
            }
          ]
        }else{

          let parent = utilsProfile.returnGuidParent(pt.userValue,fieldGuid)

          // make sure we can find where to put the new one
          if (parent[lastProperty]){
            // create a new node here
            let toadd = {
              '@id': URI,
              '@guid' : short.generate(),
              'http://www.w3.org/2000/01/rdf-schema#label' : [
                {
                  '@guid': short.generate(),
                  'http://www.w3.org/2000/01/rdf-schema#label' : label
                }
              ]
            }
            let type = utilsRDF.suggestTypeProfile(lastProperty,pt)
            if (type === false){
              // did not find it in the profile, look to the network
              type = await utilsRDF.suggestTypeNetwork(lastProperty)
            }
            if (type !== false){
              // first we test to see if the type is a literal, if so then we
              // don't need to set the type, as its not a blank node, just a nested property
              if (utilsRDF.isUriALiteral(type) === false){
                // if it doesn't yet have a type then go ahead and set it
                toadd['@type'] = type
              }else{
                // nothing to do, its a literal
              }
            }
            parent[lastProperty].push(toadd)
          }else{
            console.error("Could not find the parent[lastProperty] of the existing value", {'parent':parent,'pt.userValue':pt.userValue, 'fieldGuid':fieldGuid})
          }


        }
        // they changed something
        this.dataChanged()

      }else{
        console.error('setValueSimple: Cannot locate the component by guid', componentGuid, this.activeProfile)
      }


    },



    /**
    * This removes the values of a complex lookup field
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {string} fieldGuid - the guid of the field
    * @return {void}
    */
    removeValueComplex: async function(componentGuid, fieldGuid){



      // locate the correct pt to work on in the activeProfile
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      if (pt !== false){

        // find the correct blank node to edit if possible,

        let parent = utilsProfile.returnGuidParent(pt.userValue,fieldGuid)
        if (parent && parent.length === 1 && parent[0]['@guid'] === fieldGuid ){
          // console.log("The parent is the node we are looking for")
          parent = pt.userValue
        }

        // just look through all of the properties, if its an array filter it
        for (let p in parent){
          if (Array.isArray(parent[p])){
            parent[p] = parent[p].filter((v) => {

              if (v && v['@guid'] && v['@guid'] === fieldGuid){
                return false
              }else{
                return true
              }
            })
          }
        }

        // check to make sure that we didn't make an empty property
        // remove the property key if so
        for (let p in parent){
          if (Array.isArray(parent[p])){
            if (parent[p].length===0){
              delete parent[p]
            }
          }
        }


        // console.log("post filter:",parent)
        // console.log("The PT",pt)

        // make sure we don't leave any blank blank nodes behind
        pt.userValue = utilsProfile.pruneUserValue(pt.userValue)

        // they changed something
        this.dataChanged()

      }else{
        console.error('removeValueSimple: Cannot locate the component by guid', componentGuid, this.activeProfile)
      }


    },




    /**
    * This removes the values of a simple lookup field
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {string} fieldGuid - the guid of the field
    * @return {void}
    */
    removeValueSimple: async function(componentGuid, fieldGuid){


      // locate the correct pt to work on in the activeProfile
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      if (pt !== false){


        // is it a top level property, meaning there is no need to dig through the blank nodes of the userValue
        if (pt.valueConstraint.valueTemplateRefs.length === 0){

          // filter the entire uservalue
          for (let key in pt.userValue){

            if (Array.isArray(pt.userValue[key])){
              pt.userValue[key] = pt.userValue[key].filter((v) => {
                if (v && v['@guid'] && v['@guid'] === fieldGuid){
                  return false
                }else{
                  return true
                }
              })
            }
          }
          for (let key in pt.userValue){
            if (Array.isArray(pt.userValue[key])){
              if (pt.userValue[key].length===0){
                delete pt.userValue[key]
              }
            }
          }

          this.dataChanged()
          return true

        }



        // find the correct blank node to edit if possible, if we don't find it then we need to create it
        // console.log(pt)
        // console.log("fieldGuid",fieldGuid)

        let parent = utilsProfile.returnGuidParent(pt.userValue,fieldGuid)

        // just look through all of the properties, if its an array filter it
        for (let p in parent){
          if (Array.isArray(parent[p])){
            parent[p] = parent[p].filter((v) => {

              if (v && v['@guid'] && v['@guid'] === fieldGuid){
                return false
              }else{
                return true
              }
            })
          }if (['object'].includes(typeof parent[p]) && parent[p] !== null){

            // check the parent if there are only two keys this is a top level
            // simple lookup, blank out the non-root key and that should clear this value
            // if (Object.keys(pt.userValue).length==2){
            //   for (let k in pt.userValue){
            //     if (k != '@root'){
            //       pt.userValue[k] = []
            //     }
            //   }
            // }

            // // not an array just remove the values
            // for (let key in parent[p]){
            //   if (key !='@guid'){
            //     delete parent[p][key]
            //   }
            // }


          }
        }



        // check to make sure that we didn't make an empty property
        // remove the property key if so
        for (let p in parent){
          if (Array.isArray(parent[p])){
            if (parent[p].length===0){
              delete parent[p]
            }
          }
        }

        // see if we removed it from those actions
        parent = utilsProfile.returnGuidParent(pt.userValue,fieldGuid)


        if (parent !== false){

          for (let p in parent){
            if (['object'].includes(typeof parent[p]) && parent[p] !== null){

              // check the parent if there are only two keys this is a top level
              // simple lookup, blank out the non-root key and that should clear this value
              if (Object.keys(pt.userValue).length==2){

                // if they have a @type keep it around for later so it remains that type when the clear the value
                // so they dont need to change interface back to that reference component
                let oldType = null
                let oldTypeParent = null

                for (let k in pt.userValue){
                 if (pt.userValue[k] && pt.userValue[k][0] && pt.userValue[k][0]['@type']){
                  oldType = pt.userValue[k][0]['@type']
                  oldTypeParent = k
                 }
                }

                for (let k in pt.userValue){
                  if (k != '@root'){

                    delete pt.userValue[k]
                  }
                }

                // set the old type back so it doesn't change the reference select in the user interface
                if (oldType && oldTypeParent){
                  pt.userValue[oldTypeParent] = [
                    {
                      '@type': oldType
                    }
                  ]

                }

              }

              // // not an array just remove the values
              // for (let key in parent[p]){
              //   if (key !='@guid'){
              //     delete parent[p][key]
              //   }
              // }


            }
          }


        }

        // they changed something
        this.dataChanged()

        // console.log("psot filter em:",parent)


        // if (blankNode === false){


        // }else{



        // }
      }else{
        console.error('removeValueSimple: Cannot locate the component by guid', componentGuid, this.activeProfile)
      }


    },




    /**
    * Sets a literal value of field
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {string} fieldGuid - the guid of the field
    * @param {array} propertyPath - array of strings mapping the predicates to the blanknode for the value
    * @param {string} lang - the ISO rdf language value like 'en' to append to the literal 'xxxxx@en'
    * @return {void}
    */
    setValueLiteral: function(componentGuid, fieldGuid, propertyPath, value, lang, repeatedLiteral){
      // make a copy of the property path, dont modify the linked one passed
      propertyPath = JSON.parse(JSON.stringify(propertyPath))


      //The propertyPath for supplementaryContent's note is missing the note. It jumps straight to the label
      // so insert it so XML can get built
      if (propertyPath.some((pp) => pp.propertyURI.includes("supplementaryContent")) && propertyPath.at(-1).propertyURI == "http://www.w3.org/2000/01/rdf-schema#label"){
          propertyPath.splice(1, 0, { level: 1, propertyURI: "http://id.loc.gov/ontologies/bibframe/note" })
          propertyPath.at(-1).level = 2
      }

      // this needs to include a check for "supplementaryContent", so the note will populate in the form
      let isLocator = propertyPath.some((pp) => pp.propertyURI.includes("electronicLocator") || pp.propertyURI.includes("supplementaryContent"))

      // for the electronic locator, the path ends with `sameAs`, but it just gets in the way, toss it
      if (isLocator){
          propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.w3.org/2002/07/owl#sameAs')  })
      }

      let lastProperty = propertyPath.at(-1).propertyURI
      // locate the correct pt to work on in the activeProfile
      let pt
      if (cachePt[componentGuid]){
        pt = cachePt[componentGuid]
      }else{
        pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
        cachePt[componentGuid] = pt
      }

	  //clear the cache if the value was deleted
	  if (value.trim() == ""){
        if (Object.keys(cachePt).includes(componentGuid)){
          delete cachePt[componentGuid]
        }
        for (let guid of Object.keys(cacheGuid)){
          cleanCacheGuid(cacheGuid,  JSON.parse(JSON.stringify(pt.userValue)), guid)
        }
	  }

      // console.log("--------pt 1------------")
      // console.log(JSON.stringify(pt,null,2))
      // let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      // console.log(componentGuid, fieldGuid, propertyPath, value, lang, repeatedLiteral)
      if (pt !== false){
        pt.hasData = true
        pt.userModified = true
        pt.dataLoaded = false

        // find the correct blank node to edit if possible, if we don't find it then we need to create it
        let blankNode
        if (cacheGuid[fieldGuid]){
          blankNode = cacheGuid[fieldGuid]
        }else{
          blankNode = utilsProfile.returnGuidLocation(pt.userValue,fieldGuid)
          cacheGuid[fieldGuid] = blankNode
        }

        // console.log("--------pt 2------------")
        // console.log(JSON.stringify(pt,null,2))

        // let blankNode = utilsProfile.returnGuidLocation(pt.userValue,fieldGuid)

        if (blankNode === false){
          // create the path to the blank node
          let buildBlankNodeResult

          let currentValueCount = utilsProfile.countValues(pt,propertyPath)

          if (currentValueCount === 0){
            // this is the first value, we need to construct the hierarchy to the bnode
            buildBlankNodeResult = utilsProfile.buildBlanknode(pt,propertyPath, true)

            // console.log("buildBlankNodeResult",JSON.stringify(buildBlankNodeResult,null,2))
            pt = buildBlankNodeResult[0]

            // now we can make a link to the parent of where the literal value should live
            blankNode = utilsProfile.returnGuidLocation(pt.userValue,buildBlankNodeResult[1])

            // console.log("blankNode",JSON.stringify(blankNode,null,2))
            // this is a new node, so we want to overwrite the guid created in the build process
            // with the one that was already created in the userinterface
            blankNode['@guid'] = fieldGuid
            // set a temp value that will be over written below
            blankNode[lastProperty] = true
            // console.log("--------pt 3------------")
            // console.log(JSON.stringify(pt,null,2))

          }else{
            // there is already values here, so we need to insert a new value into the hiearchy

            let parent = utilsProfile.returnPropertyPathParent(pt,propertyPath)

            if (!parent){
              console.error("Trying to add second literal, could not find the property path parent", pt)
              return false
            }

            if (!parent[lastProperty]){
              console.error('Trying to find the value of this literal, unable to:',componentGuid, fieldGuid, propertyPath, value, lang, pt)
              return false
            }
            let newGuid = short.generate()

            // make a place for it
            parent[lastProperty].push(
              {
                '@guid': newGuid,
              }
            )

            // get a link to it we'll edit it below
            blankNode = utilsProfile.returnGuidLocation(pt.userValue,newGuid)
            // set a temp value that will be over written below
            blankNode[lastProperty] = true
            // console.log("--------pt 4------------")
            // console.log(JSON.stringify(pt,null,2))
          }
          // console.log("currentValueCount",currentValueCount)
        }

        if (!blankNode[lastProperty]){
          console.error('Trying to find the value of this literal, unable to:',componentGuid, fieldGuid, propertyPath, value, lang, pt)
        }
        if (lang == "REMOVE_COMMAND"){
          delete blankNode['@language']
          lang=null
        }

        if (lang){
          blankNode['@language'] = lang
        }

        // and now add in the literal value into the correct property
        blankNode[lastProperty] = value
        // for electronicLocators, update the ID, so the XML can get built correctly
        if (isLocator && Object.keys(blankNode).some((key) => key == "http://id.loc.gov/ontologies/bibframe/electronicLocator")){
            blankNode["@id"] = value
        }

        // if we just set an empty value, remove the value property, and if there are no other values, remvoe the entire property
        if (value.trim() === ''){
          delete blankNode[lastProperty]

          let parent = utilsProfile.returnPropertyPathParent(pt,propertyPath)

          if (parent && parent[lastProperty]){
            let keep = []
            if (parent[lastProperty].length>0){
              for (let value of parent[lastProperty]){
                // does it have a value?
                if (value[lastProperty] && value[lastProperty] != ''){
                  keep.push(value)
                }else{
                  // console.log("dumping",value)
                }
              }
            }

            parent[lastProperty] = keep

            if (parent[lastProperty].length==0){
              delete parent[lastProperty]
            }

            // console.log("--------pt 5------------")
            // console.log(JSON.stringify(pt,null,2))


          }

          // make sure the blank node is not empty either
          // loop through the property list and check the parents

          // if (parent && Object.keys(parent).length==2 && parent['@type'] && parent['@guid']) {

            propertyPath.pop()
            let uv = pt.userValue
            let oldUv = pt.userValue

            for (let p of propertyPath){
              uv = uv[p.propertyURI]
              if (Array.isArray(uv)){
                uv=uv[0]
              }
              if (Object.keys(uv).length == 2 && uv['@guid'] && uv['@type']){
                // it is an empty bnode, delete it
                delete oldUv[p.propertyURI]
              }else if (Object.keys(uv).length == 1 && uv['@guid']){
                delete oldUv[p.propertyURI]
              }

              console.log(p.propertyURI,'has',Object.keys(uv).length,'keys')

              // the oldUv so we have a references to where we will be in the next loop so we can delete from the parent obj
              oldUv = oldUv[p.propertyURI]
              if (Array.isArray(oldUv)){
                oldUv=oldUv[0]
              }

            }

          //   console.log("Delete this guy",propertyPath )
          // }


        }

        // console.log("Before prune")
        // console.log(JSON.stringify(pt.userValue))

        // pt.userValue = utilsProfile.pruneUserValue(pt.userValue)

        // console.log("affter prune")
        // console.log(JSON.stringify(pt.userValue))

        // they changed something
        this.dataChanged()

      }else{
        console.error('setValueLiteral: Cannot locate the component by guid', componentGuid, this.activeProfile)
      }
    },


    /**
    * returns a literal value of field
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {array} propertyPath - array of strings mapping the predicates to the blanknode for the value
    * @return {array} - an array of objs representing the literals
    */
    returnLiteralValueFromProfile: function(componentGuid, propertyPath){

        // for the electronic locator, the path ends with `sameAs`, but it just gets in the way, toss it
        let isLocator = propertyPath.some((pp) => pp.propertyURI.includes("electronicLocator") || pp.propertyURI.includes("supplementaryContent") )

        if (isLocator){
            // `sameAs` gets in the way for the electronicLocator, toss it
            propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.w3.org/2002/07/owl#sameAs')  })

            //The propertyPath for supplementaryContent's note is missing the note. It jumps straight to the label
            //  fix the propertyPath so the XML can get built correctly
            if (propertyPath.some((pp) => pp.propertyURI.includes("supplementaryContent")) && propertyPath.at(-1).propertyURI == "http://www.w3.org/2000/01/rdf-schema#label"){
                propertyPath.splice(1, 0, { level: 1, propertyURI: "http://id.loc.gov/ontologies/bibframe/note" })
                propertyPath.at(-1).level = 2
            }
        }

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      let valueLocation = utilsProfile.returnValueFromPropertyPath(pt,propertyPath)
      let deepestLevelURI = propertyPath[propertyPath.length-1].propertyURI

      // console.log(propertyPath[0], deepestLevelURI)
      // console.log('pt',pt)
      // console.log(valueLocation)

      if (valueLocation){

        let values = []



        for (let v of valueLocation){

          // console.log('v->',v)

          if (v[deepestLevelURI]){
            values.push({
              '@guid':v['@guid'],
              value: unescape(v[deepestLevelURI]),
              '@language' : (v['@language']) ? v['@language'] : null,
            })
          } else if (isLocator){ //for electronicLocator, incoming records have the value in `@id`
              values.push({
              '@guid':v['@guid'],
              value: unescape(v["@id"]),
              '@language' : (v['@language']) ? v['@language'] : null,
            })
          }else{
            return false
            //console.warn('While looking for ',deepestLevelURI, ' could not find in ', pt, 'valueLocation:',valueLocation)
          }
        }

        return values

      }

      // will return false if here
      return valueLocation


    },

    /**
    * returns a simple lookup value of field
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {array} propertyPath - array of strings mapping the predicates to the blanknode for the value
    * @return {array} - an array of objs representing the simple lookup values
    */
    returnSimpleLookupValueFromProfile: function(componentGuid, propertyPath){

      // TODO: reconcile this to how the profiles are built, or dont..
      // remove the sameAs from this property path, which will be the last one, we don't need it
      propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.w3.org/2002/07/owl#sameAs')  })

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      let valueLocation = utilsProfile.returnValueFromPropertyPath(pt,propertyPath)

      // let deepestLevelURI = propertyPath[propertyPath.length-1].propertyURI

      if (!valueLocation){
        // if we did not find it at that level then try removing any issues inthe property path
        propertyPath = propertyPath.filter((v)=> {
          // remove any classnames
          // like http://id.loc.gov/ontologies/bibframe/PlaybackCharacteristic
          if (!v.propertyURI.match(/http:\/\/id\.loc\.gov\/ontologies\/bibframe\/[A-Z][a-z]+/)){
            return true
          }else{
            return false
          }
        })
        if (propertyPath.length>0){
          valueLocation = utilsProfile.returnValueFromPropertyPath(pt,propertyPath)
        }
      }

      if (valueLocation){

        let values = []

        for (let v of valueLocation){

          let URI = null
          let label = null


          if (v['@id']){
            URI = v['@id']
          }
          for (let lP of LABEL_PREDICATES){
            if (v[lP] && v[lP][0][lP]){
              label = v[lP][0][lP]
              break
            }
          }

          let uneditable = false

          // if it is deepHierarchy then then we are copy pasting what came into the system and they cann change it anyway.
          if (pt.deepHierarchy){uneditable=true}


          if (URI && label){
            values.push({
              '@guid':v['@guid'],
              URI: URI,
              label: label,
              needsDereference: false,
              uneditable:uneditable,
              isLiteral: false,
            })
          }else if (URI && !label){
            values.push({
              '@guid':v['@guid'],
              URI: URI,
              label: label,
              needsDereference: true,
              uneditable:uneditable,
              isLiteral: false,
            })
          }else if (!URI && label){
            values.push({
              '@guid':v['@guid'],
              URI: URI,
              label: label,
              needsDereference: false,
              uneditable:uneditable,
              isLiteral: true,
            })
          }

        }

        return values

      }

      // if valueLocation is false then it did not find anytihng meaning its empty, return empty array
      return []


    },

    /**
    * returns a complex lookup value of field
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {array} propertyPath - array of strings mapping the predicates to the blanknode for the value
    * @return {array} - an array of objs representing the simple lookup values
    */
    returnComplexLookupValueFromProfile: function(componentGuid, propertyPath){

      // TODO: reconcile this to how the profiles are built, or dont..
      // remove the sameAs from this property path, which will be the last one, we don't need it
      propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.w3.org/2002/07/owl#sameAs')  })

      // TODOL reconcile this in the profiles (!!!)
      propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.loc.gov/mads/rdf/v1#componentList')  })
      propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.loc.gov/mads/rdf/v1#Topic')  })
      propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.loc.gov/mads/rdf/v1#Geographic')  })


      // console.log("propertyPath=",propertyPath)

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      let valueLocation = utilsProfile.returnValueFromPropertyPath(pt,propertyPath)
      let deepestLevelURI = propertyPath[propertyPath.length-1].propertyURI

      if (valueLocation){

        let values = []

        for (let v of valueLocation){

              let URI = null
              let label = null

              if (v['@id']){
                URI = v['@id']
              }

              for (let lP of LABEL_PREDICATES){
                  if (v[lP] && v[lP][0][lP]){
                      label = v[lP][0][lP]
                      break
                  }
              }

              // look for bf:title -> bf:mainTitle
              if (!label){
                for (let lP1 of LABEL_PREDICATES){
                  for (let lP2 of LABEL_PREDICATES){
                    if (v[lP1][0][lP2] && v[lP1][0][lP2][0][lP2]){
                      label = v[lP1][0][lP2][0][lP2]
                      break
                    }
                  }
                }
              }

              let source = null
              if (URI && URI.indexOf('/fast/') >1){
                source = 'FAST'
              }
              let uneditable = false

              // if we don't have a URI for a work don't let them edit it
              if (!URI && label && v['@type'] && v['@type'] == 'http://id.loc.gov/ontologies/bibframe/Work'){
                uneditable = true
              }
              if (!URI && label && v['@type'] && v['@type'] == 'http://id.loc.gov/ontologies/bflc/Uncontrolled'){
                uneditable = true
              }
              if (!URI && label && v['@type'] && v['@type'] == 'http://id.loc.gov/ontologies/bibframe/Uncontrolled'){
                uneditable = true
              }

              // if it is deepHierarchy then then we are copy pasting what came into the system and they cann change it anyway.
              if (pt.deepHierarchy){uneditable=true}

              if (URI && label){
                values.push({
                  '@guid':v['@guid'],
                  URI: URI,
                  label: label,
                  source: source,
                  needsDereference: false,
                  isLiteral: false,
                  uneditable: uneditable,
                  type:v['@type']
                })
              }else if (URI && !label){
                values.push({
                  '@guid':v['@guid'],
                  URI: URI,
                  label: label,
                  source: source,
                  needsDereference: true,
                  isLiteral: false,
                  uneditable: uneditable,
                  type:v['@type']
                })
              }else if (!URI && label){

                values.push({
                  '@guid':v['@guid'],
                  URI: URI,
                  label: label,
                  source: source,
                  needsDereference: false,
                  uneditable: uneditable,
                  isLiteral: true,
                  type:v['@type']
                })
              }

            }

            return values
        }


      // if valueLocation is false then it did not find anytihng meaning its empty, return empty array
      return []


    },


    /**
    * Sets a "Complex lookup" value, things from large lookups like NAF LCSH, etc
    * this function only creates new values, does not modify (aka delete)
    * @async
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {string} fieldGuid - the guid of the field
    * @param {array} propertyPath - array of strings mapping the predicates to the blanknode for the value
    * @param {string} URI - the URI for the value
    * @param {string} label - the label to use
    * @param {string} type - the URI of the type to use, like http://www.loc.gov/mads/rdf/v1#CorporateName

    * @return {void}
    */
    setValueComplex: async function(componentGuid, fieldGuid, propertyPath, URI, label, type, nodeMap=null, marcKey=null ){

      // TODO: reconcile this to how the profiles are built, or dont..
      // remove the sameAs from this property path, which will be the last one, we don't need it
      propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.w3.org/2002/07/owl#sameAs')  })
      // console.log("propertyPath=",propertyPath)

      let lastProperty = propertyPath.at(-1).propertyURI
      // locate the correct pt to work on in the activeProfile
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)


      if (!type && URI && !lastProperty.includes("intendedAudience")){
        // I regretfully inform you we will need to look this up
        let context = await utilsNetwork.returnContext(URI)
        type = context.typeFull

      }
      // literals don't have a type or a URI & intendedAudience has extra considerations
      // namely that the rdf:Type in BF is bf:Authority
      if ((!type && !URI) || lastProperty.includes("intendedAudience")){
        type = await utilsRDF.suggestTypeProfile(lastProperty, pt)
        if (type == false){
          type = await utilsRDF.suggestTypeNetwork(lastProperty)
        }
      }

      if (pt !== false){
        pt.hasData = true
        pt.userModified = true
        pt.dataLoaded = false

        // find the correct blank node to edit if possible, if we don't find it then we need to create it
        let blankNode = utilsProfile.returnGuidLocation(pt.userValue,fieldGuid)
        if (blankNode === false){
          // create the path to the blank node
          let buildBlankNodeResult = await utilsProfile.buildBlanknode(pt,propertyPath)
          pt = buildBlankNodeResult[0]

          // now we can make a link to the parent of where the literal value should live
          blankNode = utilsProfile.returnGuidLocation(pt.userValue,buildBlankNodeResult[1])

          //empty out the blankNode's existing data so it only has the new data
          for (let key of Object.keys(blankNode).filter((k) => !k.startsWith("@"))){
              blankNode[key] = []
          }

          // set the URI
          // if its null then we are adding a literal
          if (URI !== null){
            blankNode['@id'] = URI
          }else{
            // do nothing for now...
          }

          // overwrite whatever the helper methods set the type to for this one, we know the final
          // type and what it needs to be
          blankNode['@type'] = type


          if (!Array.isArray(label)){
            label = [label]
          }

          for (let aLabelNode of label){
            if (!blankNode['http://www.w3.org/2000/01/rdf-schema#label']){
              blankNode['http://www.w3.org/2000/01/rdf-schema#label'] = []
            }
            if (typeof aLabelNode == 'string'){
              blankNode['http://www.w3.org/2000/01/rdf-schema#label'].push(
                {
                  '@guid': short.generate(),
                  'http://www.w3.org/2000/01/rdf-schema#label' : aLabelNode
                }
              )
            }else if (aLabelNode['@value']){
              let aNode = {
                '@guid': short.generate(),
                'http://www.w3.org/2000/01/rdf-schema#label' : aLabelNode['@value']
              }
              if (aLabelNode['@language']){
                aNode['@language']=aLabelNode['@language']
              }
              blankNode['http://www.w3.org/2000/01/rdf-schema#label'].push(aNode)

            }else{
              console.error("Cannot understand response from context extaction for label:",label)
            }
          }

          //Add gacs code to user data
          if (nodeMap["GAC(s)"]){
            blankNode["http://www.loc.gov/mads/rdf/v1#code"] = []
            for (let code in nodeMap["GAC(s)"]){
                blankNode["http://www.loc.gov/mads/rdf/v1#code"].push(
                  {
                    '@guid': short.generate(),
                    "@gacs": "http://id.loc.gov/datatypes/codes/gac",
                    'http://www.loc.gov/mads/rdf/v1#code': nodeMap["GAC(s)"][code]
                  }
                )
            }
          }

          if (!Array.isArray(marcKey)){
            marcKey = [marcKey]
          }

          for (let aMarcKeyNode of marcKey){
            if (!blankNode['http://id.loc.gov/ontologies/bflc/marcKey']){
              blankNode['http://id.loc.gov/ontologies/bflc/marcKey'] = []
            }
            if (typeof aMarcKeyNode == 'string'){
              blankNode['http://id.loc.gov/ontologies/bflc/marcKey'].push(
                {
                  '@guid': short.generate(),
                  'http://id.loc.gov/ontologies/bflc/marcKey' : aMarcKeyNode
                }
              )
            }else if (aMarcKeyNode && aMarcKeyNode['@value']){
              let aNode = {
                '@guid': short.generate(),
                'http://id.loc.gov/ontologies/bflc/marcKey' : aMarcKeyNode['@value']
              }
              if (aMarcKeyNode['@language']){
                aNode['@language']=aMarcKeyNode['@language']
              }
              blankNode['http://id.loc.gov/ontologies/bflc/marcKey'].push(aNode)

            }else{
              console.error("Cannot understand response from context extaction for marcKey:",marcKey)
            }
          }


          // if (nodeMap["marcKey"]){
          //   blankNode["http://id.loc.gov/ontologies/bflc/marcKey"] = [
          //     {
          //       '@guid': short.generate(),
          //       'http://id.loc.gov/ontologies/bflc/marcKey': nodeMap["marcKey"][0]
          //     }
          //   ]
          // }




        }else{
          let parent = utilsProfile.returnGuidParent(pt.userValue,fieldGuid)

          // make sure we can find where to put the new one
          if (parent[lastProperty]){
            // create a new node here
            parent[lastProperty].push({
              '@id': URI,
              '@guid' : short.generate(),
              'http://www.w3.org/2000/01/rdf-schema#label' : [
                {
                  '@guid': short.generate(),
                  'http://www.w3.org/2000/01/rdf-schema#label' : label
                }
              ]
            })


          }else{
            console.error("Could not find the parent[lastProperty] of the existing value", {'parent':parent,'pt.userValue':pt.userValue, 'fieldGuid':fieldGuid})
          }


        }
        // they changed something
        this.dataChanged()

      }else{
        console.error('setValueComplex: Cannot locate the component by guid', componentGuid, this.activeProfile)
      }

      console.log("pt is ",pt)
    },

    /**
    * sets the uservalue when dealing with subject headings
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {array} subjectComponents - objects with the data to represent the component parts of subject heading
    * @param {array} propertyPath - the path of uris to get to this level
    * @return {void} -
    */
    setValueSubject: async function(componentGuid,subjectComponents,propertyPath){
        // we're just going to overwrite the whole userValue with the constructed headings


        let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

        // console.log('-----')
        // console.log(pt)
        // console.log(subjectComponents)
        // console.log(propertyPath)



        // find it
        if (pt){
            // build out the hiearchy
            let userValue = {}

            // build the hiearchy if it doesn't exist to place the data

            // we are adding the rdfs:label and the @id to this property
            // we just need to know where to put it

            // a reference to allow us to write to the end of the hierarchy
            let currentUserValuePos = userValue

            // used as a reference to the last postion's parent, so we can easily add a new sibling
            // let currentUserValuePosParent = null

            // keeps track of the @type, will be the last @type of the hiearchy when done looping
            let thisLevelType

            for (let p of propertyPath){
                // if the property is owl:sameAs it is the last field
                // of where we are building the entitiy, so we don't  want
                // bf:Agent -> owl:sameAs we just want the bf:Agent with values filed in there
                if (p.propertyURI=='http://www.w3.org/2002/07/owl#sameAs'){
                    break
                }
                // same with component list, we'll build that manually
                if (p.propertyURI=='http://www.loc.gov/mads/rdf/v1#componentList'){
                    break
                }



                if (!currentUserValuePos[p.propertyURI]){
                    currentUserValuePos[p.propertyURI] = []
                }

                let thisLevelType = utilsRDF.suggestTypeProfile(p.propertyURI,pt)
                if (thisLevelType === false){
                  // did not find it in the profile, look to the network
                  thisLevelType = await utilsRDF.suggestTypeNetwork(p.propertyURI)
                }


                let thisLevel = {'@guid':short.generate()}
                if (!utilsRDF.isUriALiteral(thisLevelType)){
                    thisLevel['@type'] = thisLevelType
                }
                if (currentUserValuePos[p.propertyURI].length==0){
                    currentUserValuePos[p.propertyURI].push(thisLevel)
                }
                // currentUserValuePosParent = currentUserValuePos[p.propertyURI]
                currentUserValuePos = currentUserValuePos[p.propertyURI][0]
            }

            pt.hasData = true
            pt.userModified = true
            pt.dataLoaded = false

            if (pt.userValue["http://id.loc.gov/ontologies/bibframe/subject"] &&
                pt.userValue["http://id.loc.gov/ontologies/bibframe/subject"][0] &&
                pt.userValue["http://id.loc.gov/ontologies/bibframe/subject"][0]["http://id.loc.gov/ontologies/bibframe/source"] &&
                pt.userValue["http://id.loc.gov/ontologies/bibframe/subject"][0]["http://id.loc.gov/ontologies/bibframe/source"][0]){

                userValue["http://id.loc.gov/ontologies/bibframe/subject"][0]["http://id.loc.gov/ontologies/bibframe/source"] = JSON.parse(JSON.stringify(pt.userValue["http://id.loc.gov/ontologies/bibframe/subject"][0]["http://id.loc.gov/ontologies/bibframe/source"]))
            }

            if (pt.userValue['@root']){
                userValue['@root'] = JSON.parse(JSON.stringify(pt.userValue['@root']))
            }
            if (pt.userValue['@guid']){
                userValue['@guid'] = JSON.parse(JSON.stringify(pt.userValue['@guid']))
            }

            currentUserValuePos["http://www.loc.gov/mads/rdf/v1#isMemberOfMADSScheme"] = [{
                "@guid": short.generate(),
                "@id": "http://id.loc.gov/authorities/subjects"
            }]



            // if it is a solo subject heading
            if (subjectComponents.length==1){

                currentUserValuePos['@id'] = subjectComponents[0].uri

                currentUserValuePos['@type'] = subjectComponents[0].type.replace('madsrdf:','http://www.loc.gov/mads/rdf/v1#')

                currentUserValuePos["http://www.loc.gov/mads/rdf/v1#authoritativeLabel"] = [{
                    "@guid": short.generate(),
                    "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": subjectComponents[0].label
                }]
                currentUserValuePos["http://www.w3.org/2000/01/rdf-schema#label"] = [{
                    "@guid": short.generate(),
                    "http://www.w3.org/2000/01/rdf-schema#label": subjectComponents[0].label
                }]

                if (subjectComponents[0].marcKey){
                  currentUserValuePos["http://id.loc.gov/ontologies/bflc/marcKey"] = [{
                    "@guid": short.generate(),
                    "http://id.loc.gov/ontologies/bflc/marcKey": subjectComponents[0].marcKey
                  }]

                }

                // add in the non latin if present
                if (subjectComponents[0].nonLatinLabel && subjectComponents[0].nonLatinLabel.length>0){
                  for (let nlL of subjectComponents[0].nonLatinLabel){

                    currentUserValuePos["http://www.loc.gov/mads/rdf/v1#authoritativeLabel"].push(
                      {
                        "@guid": short.generate(),
                        "@language": nlL['@language'],
                        "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": nlL['@value']
                      }
                    )
                    currentUserValuePos["http://www.w3.org/2000/01/rdf-schema#label"].push(
                      {
                        "@guid": short.generate(),
                        "@language": nlL['@language'],
                        "http://www.w3.org/2000/01/rdf-schema#label": nlL['@value']
                      }
                    )
                  }
                }

                if (subjectComponents[0].nonLatinMarcKey && subjectComponents[0].nonLatinMarcKey.length>0){
                  for (let nlMK of subjectComponents[0].nonLatinMarcKey){
                    currentUserValuePos["http://id.loc.gov/ontologies/bflc/marcKey"].push(
                      {
                        "@guid": short.generate(),
                        "@language": nlMK['@language'],
                        "http://id.loc.gov/ontologies/bflc/marcKey": nlMK['@value']
                      }
                    )
                  }
                }



                // store.state.activeUndoLog.push(`Added subject heading ${subjectComponents[0].label}`)


            }else if (subjectComponents.length>1){
                //userValue


                let fullLabel = subjectComponents.map((c)=>{return c.label}).join('--')

                // store.state.activeUndoLog.push(`Added subject heading ${fullLabel}`)

                currentUserValuePos["http://www.loc.gov/mads/rdf/v1#authoritativeLabel"] = [{
                    "@guid": short.generate(),
                    "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": fullLabel
                }]
                currentUserValuePos["http://www.w3.org/2000/01/rdf-schema#label"] = [{
                    "@guid": short.generate(),
                    "http://www.w3.org/2000/01/rdf-schema#label": fullLabel
                }]

                // we need to make the component list then


                currentUserValuePos["http://www.loc.gov/mads/rdf/v1#componentList"] = []

                for (let c of subjectComponents){
                    let compo = {
                            "@guid": short.generate(),
                            "@type": c.type.replace('madsrdf:','http://www.loc.gov/mads/rdf/v1#'),
                            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [{
                                "@guid": short.generate(),
                                "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": c.label
                            }]
                    }

                    if (c.uri){
                        compo['@id'] = c.uri
                    }

                    if (c.marcKey){
                      compo['http://id.loc.gov/ontologies/bflc/marcKey'] = [{
                        "@guid": short.generate(),
                        'http://id.loc.gov/ontologies/bflc/marcKey': c.marcKey
                      }]

                      if (c.nonLatinMarcKey && c.nonLatinMarcKey.length>0){
                        for (let nlMK of c.nonLatinMarcKey){
                          compo["http://id.loc.gov/ontologies/bflc/marcKey"].push(
                            {
                              "@guid": short.generate(),
                              "@language": nlMK['@language'],
                              "http://id.loc.gov/ontologies/bflc/marcKey": nlMK['@value']
                            }
                          )
                        }
                      }
                    }

                    if (c.nonLatinLabel && c.nonLatinLabel.length>0){
                      for (let nlL of c.nonLatinLabel){
                        compo["http://www.loc.gov/mads/rdf/v1#authoritativeLabel"].push(
                          {
                            "@guid": short.generate(),
                            "@language": nlL['@language'],
                            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": nlL['@value']
                          }
                        )
                      }
                    }

                    currentUserValuePos["http://www.loc.gov/mads/rdf/v1#componentList"].push(compo)


                }
            }

            // did they add a LCSH heading, if so add that automatically as a source
            for (let h of subjectComponents){
              if (h['uri'] && h['uri'].indexOf('id.loc.gov/authorities/subjects') >-1){
                if (!currentUserValuePos['http://id.loc.gov/ontologies/bibframe/source']){

                  currentUserValuePos['http://id.loc.gov/ontologies/bibframe/source'] =  [
                    {
                            "@guid": short.generate(),
                            "@type": "http://id.loc.gov/ontologies/bibframe/Source",
                            "@id": "http://id.loc.gov/vocabulary/subjectSchemes/lcsh",
                            "http://www.w3.org/2000/01/rdf-schema#label": [
                                {
                                    "@guid": short.generate(),
                                    "http://www.w3.org/2000/01/rdf-schema#label": "Library of Congress subject headings"
                                }
                            ]
                        }
                    ]
                }
                break
              } else if (h['uri'] && h['uri'].indexOf('id.loc.gov/authorities/names') >-1){
                if (!currentUserValuePos['http://id.loc.gov/ontologies/bibframe/source']){

                  currentUserValuePos['http://id.loc.gov/ontologies/bibframe/source'] =  [
                    {
                            "@guid": short.generate(),
                            "@type": "http://id.loc.gov/ontologies/bibframe/Source",
                            // "@id": "http://id.loc.gov/vocabulary/subjectSchemes/naf",
                            "@id": "http://id.loc.gov/vocabulary/subjectSchemes/lcsh",
                            "http://www.w3.org/2000/01/rdf-schema#label": [
                                {
                                    "@guid": short.generate(),
                                    // "http://www.w3.org/2000/01/rdf-schema#label": "NACO authority file"
                                    "http://www.w3.org/2000/01/rdf-schema#label": "Library of Congress subject headings"

                                }
                            ]
                        }
                    ]
                }
                break
              }

            }


            // double check the @type of the resource we want to be as specific as possible
            if (currentUserValuePos['@type'] == 'http://www.w3.org/2000/01/rdf-schema#Resource'){
              // this is very generic, try not to use that
              if (pt.activeType){
                currentUserValuePos['@type'] = pt.activeType
              }else{
                if (pt.valueConstraint && pt.valueConstraint.valueTemplateRefs && pt.valueConstraint.valueTemplateRefs.length>0){
                  let useTemplate = this.rtLookup[pt.valueConstraint.valueTemplateRefs[0]]
                  if (useTemplate && useTemplate.resourceURI){
                    currentUserValuePos['@type'] = useTemplate.resourceURI
                  }
                }
              }
            }

            // they changed something
            this.dataChanged()

            // console.log("USERVALUE IS",userValue)
            pt.userValue = userValue
        }

    },




    /**
    * returns the structure of the component, used in the debug modal
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @return {array} - an array of objs representing the simple lookup values
    */
    returnStructureByComponentGuid: function(componentGuid){


      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      return pt

    },



    /**
    * return the XML of the active editing record
    *

    * @return {string} - the XML string of output
    */
    buildExportXML: function(){
      return utilsExport.buildXML(this.activeProfile)
    },

    /**
    * return the MARC transformation from the back end
    *

    * @return {string} - the MARC string of output
    */
    marcPreview: async function(){
      let xml = await utilsExport.buildXML(this.activeProfile)
      let preview = null
      if (!usePreferenceStore().returnValue('--b-edit-main-splitpane-opac-marc-html')){
        preview = await utilsNetwork.marcPreview(xml.bf2Marc, false)
      } else {
        preview = await utilsNetwork.marcPreview(xml.bf2Marc, true)
      }

      // clean it up a bit for the component
      let versions = preview.map((v)=>{ return v.version}).sort().reverse()

      let results = []

      let newResults = []
      let selectedDefault = false


      for (let v of versions){
        let toAdd = preview.filter((p) => { return (p.version == v) })[0]
        if (toAdd.results && toAdd.results.stdout && selectedDefault == false){
          toAdd.default = true
          selectedDefault = true
        }else{
          toAdd.default = false
        }

        if (toAdd.results && !toAdd.results.stdout){
          toAdd.error = true
        }else{
          toAdd.error = false
        }
        newResults.push(toAdd)
      }



      let defaultVer = newResults.filter((p) => { return (p.default == true) })[0]
      if (defaultVer && defaultVer.default){
        defaultVer = defaultVer.version
      }else{
        defaultVer = null
      }
      return({
        default: defaultVer,
        versions: newResults,
      })


    },



    /**
    * Save the record to the Marva scratch-pad backend
    *

    * @return {boolean} - did it save
    */
    saveRecord: async function(){
      let xml = await utilsExport.buildXML(this.activeProfile)
      utilsNetwork.saveRecord(xml.xlmStringBasic, this.activeProfile.eId)
      this.activeProfileSaved = true
    },

    /**
    * Ask for a record and parse it to load it into the editor
    *

    * @return {boolean} - did it save
    */
    loadRecord: async function(eid, profile){
      let xml = await utilsExport.buildXML(this.activeProfile)
      // console.log("*****")
      // console.log(xml)
      utilsNetwork.saveRecord(xml.xlmStringBasic, this.activeProfile.eId)
      this.activeProfileSaved = true
    },

  /**
   * Validate the reocrd
  */
  validateRecord: async function(eid, profile){
    //console.log("Profile store: Validating?")
    let xml = await utilsExport.buildXML(this.activeProfile)
    let response = await utilsNetwork.validate(xml.xlmStringBasic)

    return response
  },

    /**
    * Publish record to backend
    *

    * @return {obj} - response from posting action
    */
    publishRecord: async function(eid, profile){



      let postingHub = false
      if (this.activeProfile && this.activeProfile.id && this.activeProfile.id.indexOf(':Hub')>-1){
        // ITS A HUB!
        // do other things if its a hub
        postingHub=true
      }

      let xml = await utilsExport.buildXML(this.activeProfile)


      let pubResuts

      if (postingHub){
        pubResuts = await utilsNetwork.publish(xml.xlmStringBasic, this.activeProfile.eId, {id: 'Hub'})
      }else{
        pubResuts = await utilsNetwork.publish(xml.xlmStringBasic, this.activeProfile.eId, this.activeProfile)
      }


      pubResuts.resourceLinks=[]
      // if it was accepted by the system send it to the marva backend to store as posted

      if (pubResuts.status){
        this.activeProfile.status = 'published'
        await this.saveRecord()



        const config = useConfigStore()

        for (let rt in this.activeProfile.rt){
          let type = rt.split(':').slice(-1)[0]
          let url = config.convertToRegionUrl(this.activeProfile.rt[rt].URI)
          let env = config.returnUrls.env

          // populate the title
          if (type=='Instance'){
            let bibId =  this.activeProfile.rt[rt].URI.split("/")[this.activeProfile.rt[rt].URI.split('/').length - 1]
            document.title = `Marva | ${bibId}`;
          }

          pubResuts.resourceLinks.push({
            'type':type,
            'url': url,
            'env': env
          })
        }
      }

      return pubResuts
    },






    /**
    * returns the label to use in bf code mode
    *
    * @param {object} structure - the structure value from the profile
    * @return {string} - the label
    */
    returnBfCodeLabel: function(structure){

      let code = utilsParse.namespaceUri(structure.propertyURI)
      // console.log(structure.propertyURI, code)

      // HACK HACK HAVK
      if (structure.propertyURI == 'http://www.loc.gov/mads/rdf/v1#Topic'){
        code = "bf:subject"
      }

      if (['rdfs:label', 'owl:sameAs'].includes(code)){
        // console.log(structure.propertyURI)
        code = utilsParse.namespaceUri(this.rtLookup[structure.parentId].resourceURI)
      }

      let orgCode = code

      code = code.replace('bflc:','lc:')

      // TODO - why are these classes?
      // bf:Note becomes bf:note
      if (code.charAt(3) === code.charAt(3).toUpperCase()){
        code = code.substring(0, 3) + code.charAt(3).toLowerCase() + code.substring(3 + 1);
      }
      // console.log("code=",code)
      let justProperty = code.split(':')[1]

      let numUpper = justProperty.length - justProperty.replace(/[A-Z]/g, '').length;

      if (numUpper == 2){
        code = code.split(':')[0] + ':' + justProperty.charAt(0) + justProperty.replace(/[a-z]/g, '')
      }else if (numUpper == 1){
        code = code.split(':')[0] + ':' + justProperty.charAt(0) + justProperty.charAt(1) + justProperty.replace(/[a-z]/g, '')
      }else if (numUpper == 0){
        code = code.split(':')[0] + ':' + justProperty.charAt(0) + justProperty.charAt(1) + justProperty.charAt(2)
      }
      // console.log("code=",code)

      // if its just a rdf value then replace it with the acutal text
      if (code == 'rdf:val'){
        let useLabel = structure.propertyLabel.split(' ')[0]
        if (useLabel.length <= 6){
          code = useLabel.toLowerCase()
        }else{
          code = `${useLabel.charAt(0)}${useLabel.charAt(1)}${useLabel.charAt(2)}${useLabel.charAt(3)}${useLabel.charAt(4)}${useLabel.charAt(5)}`.toLowerCase()
        }
        // console.log("HEY CODE IS",code)
      }


      // if (uri == '')

      // chop off the namespace
      if (code.includes(':')){
        code = code.split(':')[1]
      }

      console.log('****!',orgCode, ',', (orgCode.includes('bf:')) ? `https://id.loc.gov/ontologies/bibframe.html#p_${orgCode.split(':')[1]}` : 'bflc or other', ',',code)

      // console.log(code)
      // console.log(structure.propertyURI)
      // console.log(this.rtLookup[structure.parentId])

      return code

    },

    /**
    * returns if the request property is the "main" property of that component
    *
    * @param {string} componentGuid - the guid of the component
    * @param {array} propertyPath - the property path of the property in question
    * @return {boolean} -
    */
    inlineIsMainProperty: function(componentGuid, fieldStructure, propertyPath){

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      // let valueLocation = utilsProfile.returnValueFromPropertyPath(pt,propertyPath)
      // some hard coded hacks

      if (fieldStructure.propertyURI === 'http://id.loc.gov/ontologies/bflc/nonSortNum'){
        return false
      }
      if (fieldStructure.propertyURI === 'http://id.loc.gov/ontologies/bibframe/mainTitle'){
        return true
      }




      // if it doesn't have any valuetemplates then it is a single property component
      if (pt.valueConstraint.valueTemplateRefs.length==0){
        return true
      }

      // if the label matches the first label in one of the value templates then it is the first property and probably the most important?
      for (let ref of pt.valueConstraint.valueTemplateRefs){
        if (this.rtLookup[ref].propertyTemplates[0].propertyLabel === fieldStructure.propertyLabel){
          return true
        }
      }

      return false

    },
    /**
    * returns if the request property has a value in it
    *
    * @param {string} componentGuid - the guid of the component
    * @param {array} propertyPath - the property path of the property in question
    * @return {boolean} -
    */
    inlinePropertyHasValue: function(componentGuid, fieldStructure, propertyPath){

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      let valueLocation = utilsProfile.returnValueFromPropertyPath(pt,propertyPath)
      if (valueLocation !== false){
        return true
      }
      return false

    },
    /**
    * returns possible fields in that can be displayed in the component
    *
    * @return {array} - array of the fields
    */
    returnPossibleFieldsInComponent: function(componentGuid){

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      if (pt.valueConstraint.valueTemplateRefs.length==0){

        return []
      }
      let use = []

      if (pt.valueConstraint.valueTemplateRefs.length===1){
        use = this.rtLookup[pt.valueConstraint.valueTemplateRefs[0]].propertyTemplates
      }else{

        if (pt.activeType){

          for (let ref of pt.valueConstraint.valueTemplateRefs){

           if (this.rtLookup[ref].resourceURI === pt.activeType){

              use = this.rtLookup[ref].propertyTemplates
              break
           }
          }
        }else{
          // just use the first template
          use = this.rtLookup[pt.valueConstraint.valueTemplateRefs[0]].propertyTemplates
        }
      }


      // let codes = this.returnBfCodeLabel(pt)
      let useReturn = []
      for (let p of use){

        useReturn.push({'code':this.returnBfCodeLabel(p), 'label' : p.propertyLabel})

      }
      return useReturn

    },


    /**
    *
    *
    * @return {array} - array of the fields
    */
    setInlineDisplay: function(componentGuid, label){

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      if (!pt.inlineModeDisplay){
        pt.inlineModeDisplay = {}
      }

      pt.inlineModeDisplay[label] = true

    },

    /**
    *
    *
    * @return {array} - array of the fields
    */
    inlineFieldIsToggledForDisplay: function(componentGuid, structure){

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      if (!pt.inlineModeDisplay){
        return false
      }


      if (pt.inlineModeDisplay[structure.propertyLabel]){
        return true
      }


    },

    /**
    *
    *
    * @return {boolean} - true or false if the pt passed will have a ref component drop down selection
    */
    ptHasRefComponent: function(pt){

      if (pt.valueConstraint && pt.valueConstraint.valueTemplateRefs && pt.valueConstraint.valueTemplateRefs.length > 1){
        return true
      }else{

        // if it only has 1 reference template, that one might have multuple
        if (pt.valueConstraint && pt.valueConstraint.valueTemplateRefs && pt.valueConstraint.valueTemplateRefs.length == 1){
          // loop through all the pts and see if any of them have multi valuetemplates
          // for (let subPt of this.rtLookup[pt.valueConstraint.valueTemplateRefs[0]].propertyTemplates){
          //   if (subPt.valueConstraint && subPt.valueConstraint.valueTemplateRefs && subPt.valueConstraint.valueTemplateRefs.length > 1){
          //     return true
          //   }
          // }

          // acutally just look at the first one, we don't really care if a sub pt has multi
            let subPt = this.rtLookup[pt.valueConstraint.valueTemplateRefs[0]].propertyTemplates[0]
            if (subPt.valueConstraint && subPt.valueConstraint.valueTemplateRefs && subPt.valueConstraint.valueTemplateRefs.length > 1){
              return true
            }
        }
      }
      return false
    },


    /**
    * Flips the canBeHidden flag on a property and reordereds it to the the end of the property list
    * In adhoc mode this makes it look like its being added to the profile
    * @return {void} -
    */
    setPropertyVisible: function(profile,component){

      this.activeProfile.rt[profile].pt[component].canBeHidden = false




      this.activeProfile.rt[profile].ptOrder.push(this.activeProfile.rt[profile].ptOrder.splice(this.activeProfile.rt[profile].ptOrder.indexOf(component), 1)[0]);


    },

    /**
    * Loads the record from marva backend by E id
    *
    * @return {void} -
    */
    loadRecordFromBackend: async function(eid){

      this.activeProfile = await utilsProfile.loadRecordFromBackend(eid)

    },


    /**
    * If it is a LCC component info about the LCC numbers
    * used in the interface rendering
    * @return {boolean}
    */
    returnLccInfo: function(componentGuid){


      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      console.log(pt)
      let classNumber = null
      let classGuid = null

      let cutterNumber = null
      let cutterGuid = null

      let work = null
      let title = null
      let titleNonSort = null
      let firstSubject = null
      let contributors = []

      // find the work and pull out stuff
      for (let rtId in this.activeProfile.rt){

        if (rtId.indexOf(":Work") > -1){
          for (let ptId in this.activeProfile.rt[rtId].pt){
            if (this.activeProfile.rt[rtId].pt[ptId]['@guid'] == componentGuid){
              work = this.activeProfile.rt[rtId]
              break
            }
          }
          if (work){ break }
        }
      }
      console.log("work",work)
      if (work){

        for (let ptId in work.pt){

          let pt = work.pt[ptId]

          /*
          //
          {
            "@root": "http://id.loc.gov/ontologies/bibframe/title",
            "http://id.loc.gov/ontologies/bibframe/title": [
                {
                    "@guid": "dYC2wKS5RkmPcP6rB7DH8m",
                    "@type": "http://id.loc.gov/ontologies/bibframe/Title",
                    "http://id.loc.gov/ontologies/bibframe/mainTitle": [
                        {
                            "@guid": "th7wNkaXeBQxj4Gqc3PZKH",
                            "http://id.loc.gov/ontologies/bibframe/mainTitle": "Ch'ŏnggyech'ŏn Taehakch'ŏn ch'aekpang kŏri"
                        },
                        {
                            "@guid": "49g8LszgTg4d6GzN7fBFhK",
                            "http://id.loc.gov/ontologies/bibframe/mainTitle": "청계천 대학천 책방 거리",
                            "@language": "ko-hang"
                        }
                    ]
                }
            ]
        }
        */

          if (pt.propertyURI=='http://id.loc.gov/ontologies/bibframe/title'){
            let titleUserValue = pt.userValue
            if (titleUserValue && titleUserValue['http://id.loc.gov/ontologies/bibframe/title'] && titleUserValue['http://id.loc.gov/ontologies/bibframe/title'].length>0 && titleUserValue['http://id.loc.gov/ontologies/bibframe/title'][0]){
              titleUserValue = titleUserValue['http://id.loc.gov/ontologies/bibframe/title'][0]
              if (titleUserValue && titleUserValue["@type"]=="http://id.loc.gov/ontologies/bibframe/Title" && titleUserValue['http://id.loc.gov/ontologies/bibframe/mainTitle']){
                if (titleUserValue['http://id.loc.gov/ontologies/bibframe/mainTitle'].length > 0 && titleUserValue['http://id.loc.gov/ontologies/bibframe/mainTitle'][0] && titleUserValue['http://id.loc.gov/ontologies/bibframe/mainTitle'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']){
                  title = titleUserValue['http://id.loc.gov/ontologies/bibframe/mainTitle'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']
                }
              }
              if (titleUserValue && titleUserValue["@type"]=="http://id.loc.gov/ontologies/bibframe/Title" && titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum']){
                if (titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum'].length > 0 && titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum'][0] && titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum'][0]['http://id.loc.gov/ontologies/bflc/nonSortNum']){
                  titleNonSort = titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum'][0]['http://id.loc.gov/ontologies/bflc/nonSortNum']
                }
              }
            }
          }


          if (pt.propertyURI=='http://id.loc.gov/ontologies/bibframe/contribution'){
            let contributorUserValue = pt.userValue
            let type="normal"
            if (contributorUserValue && contributorUserValue['http://id.loc.gov/ontologies/bibframe/contribution'] &&
                contributorUserValue['http://id.loc.gov/ontologies/bibframe/contribution'].length > 0 &&
                contributorUserValue['http://id.loc.gov/ontologies/bibframe/contribution'][0] &&
                contributorUserValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['@type'] )
                {

                contributorUserValue = contributorUserValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]
                if (contributorUserValue && contributorUserValue["@type"] == "http://id.loc.gov/ontologies/bibframe/PrimaryContribution")
                {
                    type="PrimaryContribution"
                    if (contributorUserValue['http://id.loc.gov/ontologies/bibframe/agent'] &&
                        contributorUserValue['http://id.loc.gov/ontologies/bibframe/agent'][0])
                        {
                        let agent = contributorUserValue['http://id.loc.gov/ontologies/bibframe/agent'][0]
                        if (agent && agent['http://www.w3.org/2000/01/rdf-schema#label'] && agent['http://www.w3.org/2000/01/rdf-schema#label'].length > 0 && agent['http://www.w3.org/2000/01/rdf-schema#label'][0] && agent['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']){
                          console.log("agentagentagentagent",agent)
                          let agentData = {type:type,label:agent['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']}
                          if (agent['@id']){
                            agentData['@id'] = agent['@id']
                          }else{
                            agentData['@id'] = null
                          }
                          if (agent['@type']){
                            agentData['@type'] = agent['@type']
                          }else{
                            agentData['@type'] = null
                          }


                          if (agent['http://id.loc.gov/ontologies/bflc/marcKey']){
                            agentData['http://id.loc.gov/ontologies/bflc/marcKey'] = agent['http://id.loc.gov/ontologies/bflc/marcKey']
                          }else{
                            agentData['http://id.loc.gov/ontologies/bflc/marcKey'] = null
                          }

                          contributors.push(agentData)
                        }
                    }
                }
            }
          }

          if (pt.propertyURI=='http://id.loc.gov/ontologies/bibframe/subject' && firstSubject === null){
            let subjectUserValue = pt.userValue

            if (subjectUserValue && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'] && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'].length > 0 && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0] && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label']){
              if (subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'] && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'].length>0 && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0] && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']){

                firstSubject = subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']


              }

            }

          }



        }
      }



      if (pt && pt.userValue && pt.userValue['http://id.loc.gov/ontologies/bibframe/classification'] && pt.userValue['http://id.loc.gov/ontologies/bibframe/classification'].length>0){
        let uv = pt.userValue['http://id.loc.gov/ontologies/bibframe/classification'][0]

        if (uv && uv['@type'] && uv['@type'] == 'http://id.loc.gov/ontologies/bibframe/ClassificationLcc'){

        // this is a LCC field then
          // we need to gather info from the component and the rest of the work to build links/suggestions




          if (uv['http://id.loc.gov/ontologies/bibframe/classificationPortion'] && uv['http://id.loc.gov/ontologies/bibframe/classificationPortion'].length>0 && uv['http://id.loc.gov/ontologies/bibframe/classificationPortion'][0] && uv['http://id.loc.gov/ontologies/bibframe/classificationPortion'][0]['http://id.loc.gov/ontologies/bibframe/classificationPortion']){
            classNumber = uv['http://id.loc.gov/ontologies/bibframe/classificationPortion'][0]['http://id.loc.gov/ontologies/bibframe/classificationPortion']
            classGuid = uv['http://id.loc.gov/ontologies/bibframe/classificationPortion'][0]['@guid']

          }
          if (uv['http://id.loc.gov/ontologies/bibframe/itemPortion'] && uv['http://id.loc.gov/ontologies/bibframe/itemPortion'].length>0 && uv['http://id.loc.gov/ontologies/bibframe/itemPortion'][0] && uv['http://id.loc.gov/ontologies/bibframe/itemPortion'][0]['http://id.loc.gov/ontologies/bibframe/itemPortion']){
            cutterNumber = uv['http://id.loc.gov/ontologies/bibframe/itemPortion'][0]['http://id.loc.gov/ontologies/bibframe/itemPortion']
            cutterGuid = uv['http://id.loc.gov/ontologies/bibframe/itemPortion'][0]['@guid']

          }





          if (titleNonSort && titleNonSort.trim().length >0 && title){
            if (isNaN(parseInt(titleNonSort)) == false ){
              titleNonSort = parseInt(titleNonSort)
              title = title.substr(titleNonSort).trim()
            }
          }

          // console.log('classNumber',classNumber)
          // console.log('cutterNumber',cutterNumber)
          // console.log('work',work)
          // console.log('title',title)
          // console.log('titleNonSort',titleNonSort)
          // console.log("contributors",contributors)




          return {
            title: title,
            classNumber:classNumber,
            cutterNumber:cutterNumber,
            titleNonSort:titleNonSort,
            contributors:contributors,
            firstSubject:firstSubject,
            cutterGuid:cutterGuid,
            classGuid:classGuid
          }

        } else {
          // This is a LCC field, it shouldn't return `false`. False causes things to disappear

          return {
            title: null,
            classNumber:null,
            cutterNumber:null,
            titleNonSort:null,
            contributors:[],
            firstSubject:null,
            cutterGuid:null,
            classGuid:null
          }
        }


      }else{


        if (pt && (pt.userValue && pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/classification' || pt.userValue && pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/relation') && Object.keys(pt.userValue).length == 1){

          if (titleNonSort && titleNonSort.trim().length >0 && title){
            if (isNaN(parseInt(titleNonSort)) == false ){
              titleNonSort = parseInt(titleNonSort)
              title = title.substr(titleNonSort).trim()
            }
          }

          // it is a new record, so there is no info but the LCC classification is by default so populate the other stuff
          return {
            title: title,
            classNumber:null,
            cutterNumber:null,
            titleNonSort:titleNonSort,
            contributors:contributors,
            firstSubject:firstSubject,
            cutterGuid:null,
            classGuid:null
          }


        }





      }


      //ClassificationLcc
      return false

    },

    /**
    * Check if, and which, up down buttons should display in the action button
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @return {array} - the first value says if the "up" button should display, the second if the "down"
    */
    showUpDownButtons: function(componentGuid){
        let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

        let target
        let targetType

        let items
        let subjItems = []
        let contribItems = []
        let gfItems = []

        if (pt !== false){
            let workRtId = null
            for (let rtId in this.activeProfile.rt){
              if (rtId.indexOf(":Work") > -1){
                workRtId = rtId
                for (let ptId of this.activeProfile.rt[rtId].ptOrder){
                  if (this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject'){
                    subjItems.push(ptId)
                    if (this.activeProfile.rt[rtId].pt[ptId]["@guid"] == componentGuid){
                        target = ptId
                        targetType = "subject"
                    }
                  }
                  if (
                        this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/contribution' &&
                        this.activeProfile.rt[rtId].pt[ptId].propertyLabel != "Creator of Work"
                     ){
                    contribItems.push(ptId)
                    if (this.activeProfile.rt[rtId].pt[ptId]["@guid"] == componentGuid){
                        target = ptId
                        targetType = "contribution"
                    }
                  }
                  if (this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/genreForm'){
                    gfItems.push(ptId)
                    if (this.activeProfile.rt[rtId].pt[ptId]["@guid"] == componentGuid){
                        target = ptId
                        targetType = "gf"
                    }
                  }
                }
              }
            }
        }

        if (targetType == "subject"){
            items = subjItems
        } else if (targetType == "gf"){
            items = gfItems
        } else {
            items = contribItems
        }


        if (items.length <= 1){
            return [false, false]
        } else {
            let pos = items.indexOf(target)
            if (pos == 0){
                return [false, true]
            } else if (pos == items.length-1){
                return [true, false]
            } else if (pos < 0){
                return [false, false]
            }else {
                return [true, true]
            }
        }
    },

    //This is repurposed from `makeSubjectHeadingPrimary`
    /**
    * Moves the selected heading up or down
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {string} dir - which way the item should move `up` or `down`
    * @return {void}
    */
    moveUpDown: function(componentGuid, dir){
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      let target

      if (pt !== false){
        let firstHeading = null
        let workRtId = null
        for (let rtId in this.activeProfile.rt){
          if (rtId.indexOf(":Work") > -1){
            workRtId = rtId
            for (let ptId of this.activeProfile.rt[rtId].ptOrder){
              if (
                    this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject' ||
                    this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/contribution' ||
                    this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/genreForm'
                 ){
                if (this.activeProfile.rt[rtId].pt[ptId]["@guid"] == componentGuid){
                        target = ptId
                    }
              }
            }
          }
        }

        if (target){
          let currentPos = this.activeProfile.rt[workRtId].ptOrder.indexOf(target)
          let newPos
          if (dir == "up"){
              newPos = currentPos-1
          } else {
              newPos = currentPos+1
          }

          //swap the target with the element in the desired position
          //delete from current pos
           this.activeProfile.rt[workRtId].ptOrder.splice(currentPos, 1)
          //put in it's new position
           this.activeProfile.rt[workRtId].ptOrder.splice(newPos, 0, target)

          this.dataChanged()
        }
      }
    },

    /**
    * Moves the passed heading the first of the subjects in the PT order
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @return {void}
    */

    makeSubjectHeadingPrimary: async function(componentGuid){

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      if (pt !== false){



        // loop through all the headings and find the place the headings start
        let firstHeading = null
        let workRtId = null
        for (let rtId in this.activeProfile.rt){
          if (rtId.indexOf(":Work") > -1){
            workRtId = rtId
            for (let ptId of this.activeProfile.rt[rtId].ptOrder){
              if (this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject'){
                firstHeading=ptId
                break
              }
            }
          }
          if (firstHeading){break}
        }

        if (firstHeading){

          let firstHeadingPos = this.activeProfile.rt[workRtId].ptOrder.indexOf(firstHeading)
          let currentHeadingPos = this.activeProfile.rt[workRtId].ptOrder.indexOf(pt.id)

          // remove the current heading from its position
          this.activeProfile.rt[workRtId].ptOrder.splice(currentHeadingPos, 1);
          // insert where the first heading is
          this.activeProfile.rt[workRtId].ptOrder.splice(firstHeadingPos, 0, pt.id);

          this.dataChanged()
        }



      }

    },


  triggerBadXMLBuildRecovery: function(lastGoodBuild, lastGoodBuildTimetamp){
    this.showRecoveryModal = true
    const timeAgo = new TimeAgo('en-US')
    this.activeProfile = JSON.parse(JSON.stringify(lastGoodBuild))
    this.dataChanged()
  },


  breakRecord: async function(componentGuid, structure){

    let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

    if (pt !== false){

      let baseURI = pt.propertyURI
      if (!pt.userValue[baseURI]){
        pt.userValue[baseURI] = [{}]
      }
      let userValue = JSON.parse(JSON.stringify(pt.userValue[baseURI][0]))

      userValue['somting'] = {'@guid':'00000','hppts:sfsdfgfdsg.com':['helllerrlooo']}
      pt.userValue[baseURI][0] = JSON.parse(JSON.stringify(userValue))
      // they changed something
      this.dataChanged()

    }

  },

  /**
   * Replace a placeholder in the default value when appropriate.
   * Current replacements: `[$date]` with today's date
   *
   * @param {string} defaultString - the incoming string with a value that will be replaced. */
  replaceDefaultPlaceHolder: function(defaultString){
    if (!defaultString){ return defaultString }
    let target = defaultString.match(/\[\$(.*)\]/g)
    if (!target){return defaultString}

    if (target[0].includes("date")){
      let date = new Date()
      let dd = String(date.getDate()).padStart(2, '0')
      let mm = String(date.getMonth() + 1).padStart(2, '0')
      let yyyy = date.getFullYear()

      let today = yyyy + mm + dd

      return defaultString.replace("[$date]", today)
    } // else if (target[0].includes("..."))
  },

  /**
      * Set the default values of the component fields
      *
      * @param {string} componentGuid - the guid of the component (the parent of all fields)
      * @param {object} structure - passed from the UI, the structure object
      * @return {void}
      */

  insertDefaultValuesComponent: async function(componentGuid, structure){
    // console.log(componentGuid)
    // console.log("structure",structure)

    // locate the correct pt to work on in the activeProfile
    let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

    //Delete related items from the cache, loading from the cache
    // sometimes causes errors after inserting defaults
    if (Object.keys(cachePt).includes(componentGuid)){
      delete cachePt[componentGuid]
    }
    for (let guid of Object.keys(cacheGuid)){
      cleanCacheGuid(cacheGuid,  JSON.parse(JSON.stringify(pt.userValue)), guid)
    }


    let isParentTop = false

    if (pt !== false){
      let baseURI = pt.propertyURI
      if (!pt.userValue[baseURI]){
        pt.userValue[baseURI] = [{}]
      }
      let userValue = JSON.parse(JSON.stringify(pt.userValue[baseURI][0]))

      // find the default values for this template if they exist
      if (structure){

        if (structure.parentId){
          if (structure.parentId.endsWith("Work") || structure.parentId.includes("Instance") || structure.parentId.endsWith("Hub") || structure.parentId.endsWith("Item")){
            isParentTop = true
          }

          let defaultsProperty = false
          if (this.rtLookup[structure.parentId]){
              for (let p of this.rtLookup[structure.parentId].propertyTemplates){
                // dose it have a default value?
                if (p.valueConstraint.defaults && p.valueConstraint.defaults.length>0){
                  if (p.valueConstraint.valueTemplateRefs && p.valueConstraint.valueTemplateRefs.length>0){
                    // they are linking to another template in this template, so if we ant to populate the imformation we would need to know what predicate to use :(((((
                    if (this.rtLookup[p.valueConstraint.valueTemplateRefs[0]] && this.rtLookup[p.valueConstraint.valueTemplateRefs[0]].propertyTemplates && this.rtLookup[p.valueConstraint.valueTemplateRefs[0]].propertyTemplates.length==1){
                      let defaultPropertyToUse = this.rtLookup[p.valueConstraint.valueTemplateRefs[0]].propertyTemplates[0].propertyURI
                      // we know what to store in the value and we now know what property to use
                      userValue[p.propertyURI] = []
                      for (let d of p.valueConstraint.defaults){
                        let value = {
                          '@guid': short.generate(d.defaultLiteral, d.defaultURI)
                        }
                        // do we need to create a blank node for this value?
                        let useType = utilsRDF.suggestTypeProfile(p.propertyURI,pt)
                        if (useType === false){
                          // did not find it in the profile, look to the network
                          useType = await utilsRDF.suggestTypeNetwork(p.propertyURI)
                        }
                        if (useType && useType != 'http://www.w3.org/2000/01/rdf-schema#Literal'){
                          value['@type'] = useType
                          value[defaultPropertyToUse] = [{
                            '@guid': short.generate(d.defaultLiteral, d.defaultURI)
                          }]
                          if (d.defaultLiteral && d.defaultLiteral != ''){
                            value[defaultPropertyToUse][0][defaultPropertyToUse] = this.replaceDefaultPlaceHolder(d.defaultLiteral)
                          }
                          if (d.defaultURI && d.defaultURI != ''){
                            value['@id'] = d.defaultURI
                          }
                        }else{
                          if ((d.defaultLiteral && !d.defaultURI) || (d.defaultLiteral != '' && d.defaultURI == '') ){
                            value[defaultPropertyToUse] = this.replaceDefaultPlaceHolder(d.defaultLiteral)
                          }else{
                            value['@id'] = d.defaultURI
                          }
                        }

                        userValue[p.propertyURI].push(value)
                      }
                    }else{
                      console.warn("Nested default template trying to insert values but there are multiple propertyTemplates so no clue which proerpty to look into for the default value: ", this.rtLookup[p.valueConstraint.valueTemplateRefs[0]])
                    }
                  }else{
                    let blankNodeType = null
                    // we probably need to make a blank node, so find out what rdf type blank node is needed
                    if (p.valueConstraint && p.valueConstraint.valueDataType && p.valueConstraint.valueDataType.dataTypeURI){
                      blankNodeType = p.valueConstraint.valueDataType.dataTypeURI
                    }
                    // overwrite it if there is anything there already
                    userValue[p.propertyURI] = []
                    for (let d of p.valueConstraint.defaults){
                      let value = {
                        '@guid': short.generate(d.defaultLiteral, d.defaultURI)
                      }
                      // if it just has a literal value and not a URI then don't create a blank node, just insert it using that literal property
                      if ((d.defaultLiteral && !d.defaultURI) || (d.defaultLiteral != '' && d.defaultURI == '') ){
                        value[p.propertyURI] = this.replaceDefaultPlaceHolder(d.defaultLiteral)
                      }else{
                        // it is a blank node
                        if (d.defaultLiteral){
                          // console.log(newPt)
                          value['http://www.w3.org/2000/01/rdf-schema#label'] = [{
                              '@guid': short.generate(),
                              'http://www.w3.org/2000/01/rdf-schema#label': this.replaceDefaultPlaceHolder(d.defaultLiteral)
                          }]
                        }
                        if (d.defaultURI){
                          value['@id'] = d.defaultURI
                        }
                        if (blankNodeType){
                          value['@type'] = blankNodeType
                        }
                      }

                      // if we're not working at the top level, just add the default values
                      if (!isParentTop){
                        userValue[p.propertyURI].push(value)
                      //otherwise, make sure the propertyURI matches the baseURI
                      } else if (isParentTop && p.propertyURI == baseURI){
                        userValue[p.propertyURI].push(value)
                      }
                    }
                  }
                }
              }

          }
        }else{
          console.warn("No structure.parentId found")
        }
      }else{
        alert("Error: no structure found")
      }

      if (!isParentTop){
        pt.userValue[baseURI][0] = JSON.parse(JSON.stringify(userValue))
      } else {
        //We're not in a nested component, so we can just set the userValue
        pt.userValue = JSON.parse(JSON.stringify(userValue))
      }
      // they changed something
      this.dataChanged()

    }else{
      console.error('insertDefaultValuesComponent: Cannot locate the component by guid', componentGuid, this.activeProfile)
    }
  },


    /**
    * Duplicate / create new component
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {boolean} createEmpty - if true make the component have no pre-populated data, if false "duplicate" the data from the source component
    * @return {void}
    */
    duplicateComponent: async function(componentGuid, structure){
      let createEmpty = true

      // locate the correct pt to work on in the activeProfile
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      //Ensure that the component is going to the right place by checking the structure.parentID
      // the parentId of different kinds of titles don't include `work` or `instance`, so check the RT in the profile
      let rt = utilsProfile.getRtTypeFromGuid(this.activeProfile, componentGuid)
      let actionTarget = null
      if (structure.parentId.includes("Instance") || rt.includes("Instance")) {
        actionTarget = "Instance"
      } else if (structure.parentId.includes("Work") || rt.includes("Work")) {
        actionTarget = "Work"
      }

      if (pt !== false){
        let profile
        let propertyPosition
        for (let r of this.activeProfile.rtOrder){
          propertyPosition = this.activeProfile.rt[r].ptOrder.indexOf(pt.id)

          if (propertyPosition != -1 && (r.includes(rt) || actionTarget == null)){

            profile = r
            break
          }
        }

        let key = pt.propertyURI.replace('http://','').replace('https://','').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"_") + '__' + ((pt.propertyLabel) ? pt.propertyLabel.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g,'_').toLowerCase() : "plabel")
        let newPropertyId = key + '_'+ (+ new Date())


        let newPt = JSON.parse(JSON.stringify(pt))
        newPt.id = newPropertyId
        newPt['@guid'] = short.generate()


        // console.log("Lookign at this PT", pt)
        // console.log(this.activeProfile)
        // console.log(propertyPosition)
        // console.log(key,newPropertyId)
        if (createEmpty){


          // store.state.activeUndoLog.push(`Added another property ${exportXML.namespaceUri(activeProfile.rt[profile].pt[id].propertyURI)}`)

          // console.log(activeProfile.rt[profile].pt[newPropertyId])
          // console.log(profile,newPropertyId)
          newPt.userValue = {
              '@guid': short.generate(),
              '@root' : newPt.propertyURI

          }

          if (newPt.activeType){
            newPt.userValue[newPt.propertyURI] = [
              {
                '@type': newPt.activeType
              }
            ]
          }




          // we also want to add any default values in if it is just a empty new property and not duping
          let idPropertyId = newPt.propertyURI
          let baseURI = newPt.propertyURI
          // let defaults = null
          let defaultsProperty

          let useProfile = profile
          // if the profile is a multiple, like lc:RT:bf2:Monograph:Item-0 split off the -0 for it to find it in the RT lookup
          if (!this.rtLookup[useProfile]){
              if (useProfile.includes('-')){
                  useProfile = useProfile.split('-')[0]
              }
          }
          // first check the top level
          if (this.rtLookup[useProfile]){
              defaultsProperty = this.rtLookup[useProfile].propertyTemplates.filter((x)=>{ return (x.propertyURI === idPropertyId) ? true : false})
              if (defaultsProperty.length>0){
                  defaultsProperty=defaultsProperty[0]

              }
          }
        }else{
          // doesn't support duplicating components yet
        }


        this.activeProfile.rt[profile].pt[newPropertyId] = JSON.parse(JSON.stringify(newPt))
        this.activeProfile.rt[profile].ptOrder.splice(propertyPosition+1, 0, newPropertyId);


        if (structure){
          this.insertDefaultValuesComponent(newPt['@guid'], structure)
        }

        // they changed something
        this.dataChanged()

      }else{
        console.error('duplicateComponent: Cannot locate the component by guid', componentGuid, this.activeProfile)

      }
    },

    /**
    * Duplicate / create new component with a given userValue
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {object} structure - structure of the component(?)s
    * @param {object} incomingUserValue - the incoming userValue to set
    * @return {string} the id ofthe newPropertyId
    */
    duplicateComponentGetId: async function(componentGuid, structure, profileName, predecessor){

      let createEmpty = true

      // locate the correct pt to work on in the activeProfile
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      if (pt !== false){
        let profile
        let propertyPosition

        let key = pt.propertyURI.replace('http://','').replace('https://','').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"_") + '__' + ((pt.propertyLabel) ? pt.propertyLabel.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g,'_').toLowerCase() : "plabel")

        let lastPosition = 0

        for (let r of this.activeProfile.rtOrder){
            let tempPosition = JSON.parse(JSON.stringify(this.activeProfile.rt[r].ptOrder)).indexOf(predecessor)
            if (tempPosition > 0){
                propertyPosition = tempPosition
            }

          //find the last position in the order of related components so we can insert
          // the new components at the end of that list
          for (let idx in this.activeProfile.rt[r].ptOrder){
              let item = this.activeProfile.rt[r].ptOrder[idx]

              if (item.includes(key)){
                  lastPosition = idx
              }
          }
          profile = profileName

        }

        let newPropertyId = key + '_'+ (+ new Date())

        let newPt = JSON.parse(JSON.stringify(pt))
        newPt.id = newPropertyId
        newPt['@guid'] = short.generate()


        // console.log("Lookign at this PT", pt)
        // console.log(this.activeProfile)
        // console.log(propertyPosition)
        // console.log(key,newPropertyId)
        if (createEmpty){


          // store.state.activeUndoLog.push(`Added another property ${exportXML.namespaceUri(activeProfile.rt[profile].pt[id].propertyURI)}`)

          // console.log(activeProfile.rt[profile].pt[newPropertyId])
          // console.log(profile,newPropertyId)
          newPt.userValue = {
              '@guid': short.generate(),
              '@root' : newPt.propertyURI

          }

          if (newPt.activeType){
            newPt.userValue[newPt.propertyURI] = [
              {
                '@type': newPt.activeType
              }
            ]
          }

          // we also want to add any default values in if it is just a empty new property and not duping
          let idPropertyId = newPt.propertyURI
          let baseURI = newPt.propertyURI
          // let defaults = null
          let defaultsProperty

          let useProfile = profile
          // if the profile is a multiple, like lc:RT:bf2:Monograph:Item-0 split off the -0 for it to find it in the RT lookup
          if (!this.rtLookup[useProfile]){
              if (useProfile.includes('-')){
                  useProfile = useProfile.split('-')[0]
              }
          }
          // first check the top level
          if (this.rtLookup[useProfile]){
              defaultsProperty = this.rtLookup[useProfile].propertyTemplates.filter((x)=>{ return (x.propertyURI === idPropertyId) ? true : false})
              if (defaultsProperty.length>0){
                  defaultsProperty=defaultsProperty[0]

              }
          }
        }else{
          // doesn't support duplicating components yet
        }

        this.activeProfile.rt[profile].pt[newPropertyId] = JSON.parse(JSON.stringify(newPt))
        this.activeProfile.rt[profile].ptOrder.splice(Number(propertyPosition)+1, 0, newPropertyId);


        if (structure){
          this.insertDefaultValuesComponent(newPt['@guid'], structure)
        }

        // they changed something
        this.dataChanged()

        return newPropertyId

      }else{
        console.error('duplicateComponent: Cannot locate the component by guid', componentGuid, this.activeProfile)
        return false
      }
    },

    /**
    * Delete existing component
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @return {void}
    */
    deleteComponent: async function(componentGuid){



      // locate the correct pt to work on in the activeProfile
      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)

      if (pt !== false){
        if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/adminMetadata'){
          alert("Cannot delete Admin Metadata")
          return false
        }

        // the checklabel will be the URI and the label of the component, beceause there are some components that use the same property URI
        let checkLabel = pt.propertyLabel + pt.propertyURI

        // first see how many these properties exist in the resource
        let propertyCount = 0
        for (let k in this.activeProfile.rt[pt.parentId].pt){


          if (this.activeProfile.rt[pt.parentId].pt[k].propertyLabel + this.activeProfile.rt[pt.parentId].pt[k].propertyURI == checkLabel && !this.activeProfile.rt[pt.parentId].pt[k].deleted){
            propertyCount++
          }
        }

        // if the propertyCount is 1 then we are about to delete the only property
        // so instead just blank out the user value so it still exists if they need to add a value

        if (propertyCount>1){
          this.activeProfile.rt[pt.parentId].pt[pt.id].deleted = true
        }else{
          for (let key in this.activeProfile.rt[pt.parentId].pt[pt.id].userValue){
            if (!key.startsWith('@')){
               delete this.activeProfile.rt[pt.parentId].pt[pt.id].userValue[key]
                }
            }
        }

        this.dataChanged()


      }else{
        console.error('deleteComponent: Cannot locate the component by guid', componentGuid, this.activeProfile)
        console.log(JSON.stringify(this.activeProfile))
      }


    },

    /**
    * When they change something run this function to update things like autosave ect
    *
    * @return {void}
    */
    dataChanged:  function(){
      this.activeProfileSaved = false


      window.clearTimeout(dataChangedTimeout)
      dataChangedTimeout = window.setTimeout(()=>{
        this.setMostCommonNonLatinScript()
        // also store it in the active profile
        this.activeProfile.mostCommonNonLatinScript = this.mostCommonNonLatinScript
        this.activeProfile.nonLatinScriptAgents = this.nonLatinScriptAgents
        console.log("this.activeProfilethis.activeProfilethis.activeProfile",this.activeProfile)
        // this will trigger the preview rebuild
        this.dataChangedTimestamp = Date.now()
        // console.log("CHANGED 1!!!")
      },500)
    },


    /**
    * A helper that can be run before loading a new record to do any maintenance needed
    *
    * @return {void}
    */
    prepareForNewRecord:  function(){

      this.activeProfile = {}

    },




    /**
    * Build a new instance
    *
    * @param lccn {string} the lccn for the new instance. If there isn't one, this is a secondary instance
    * @return {void}
    */
    createInstance:  function(secondary=false){


      // find the RT for the instance of this profile orginally
      // get the work rt

      let instanceName
      let instanceRt
      let workUri

      for (let rtId in this.activeProfile.rt){
          if (rtId.includes(":Work")){
              workUri = this.activeProfile.rt[rtId].URI
              // now find the corosponding instance id
              for (let allRt in this.profiles){
                  if (this.profiles[allRt].rtOrder.indexOf(rtId)>-1){
                      instanceName = this.profiles[allRt].rtOrder.filter(i => i.includes(":Instance"))[0]
                      instanceRt = JSON.parse(JSON.stringify(this.profiles[allRt].rt[instanceName]))
                  }
              }
          }
      }
      let instanceCount = 0;

      // gather info to add it
      let instances = Object.keys(this.activeProfile.rt).filter(i => i.includes(":Instance"))
      if (instances.length>1){
        instanceCount = instances.length -1
      }
      // console.log('instances',instances)
      // for (let i of instances){
      //     if (i.includes('_')){
      //         let nid = parseInt(i.split('_')[1])
      //         if (nid > instances.length){
      //             instanceCount = nid
      //         }
      //     }
      // }

      instanceCount++
      // console.log('instanceCount',instanceCount)
      let newRtId = instanceName +'_'+instanceCount
      instanceRt.isNew = true
      this.activeProfile.rt[newRtId] = instanceRt
      this.activeProfile.rtOrder.push(newRtId)

      // give it all new guids
      for (let pt in this.activeProfile.rt[newRtId].pt){
        this.activeProfile.rt[newRtId].pt[pt]['@guid'] = short.generate()
        // update the parentId
        this.activeProfile.rt[newRtId].pt[pt].parentId = this.activeProfile.rt[newRtId].pt[pt].parentId.replace(instanceName, newRtId)
        this.activeProfile.rt[newRtId].pt[pt].parent = this.activeProfile.rt[newRtId].pt[pt].parent.replace(instanceName, newRtId)
      }



      // setup the new instance's properies
      // profile.rt[newRdId].URI = 'http://id.loc.gov/resources/instances/'+ translator.toUUID(translator.new())

      this.activeProfile.rt[newRtId].URI = utilsProfile.suggestURI(this.activeProfile,'bf:Instance',workUri)
      this.activeProfile.rt[newRtId].instanceOf = workUri

      if (secondary){
        this.activeProfile.rt[newRtId]['@type'] = 'http://id.loc.gov/ontologies/bflc/SecondaryInstance'
      }

      this.activeProfile.rt[newRtId].deletable = true

      //Add to rtLookup, with a copy of an instance as the value
      this.rtLookup[newRtId] = this.rtLookup[instanceName]

      this.dataChanged()

    },

    /**
    *
    *
    * @return {array}
    */
    returnAllNonLatinLiterals:  function(onlyAccessPoints=false){

      function process (obj, func) {

        if (obj && obj.userValue){
          obj = obj.userValue
        }

        if (Array.isArray(obj)){
          obj.forEach(function (child) {
            process(child, func);
          });
        }else if (typeof obj == 'object' && obj !== null){
          for (let k in obj){
            if (Array.isArray(obj[k])){
              process(obj[k], func);
            }else{
              if (!k.startsWith('@')){
                func(obj,k,obj[k]);
              }
            }
          }
        }

      }




      let nonLatinNodes = []
      for (let rt of this.activeProfile.rtOrder){
        for (let pt of this.activeProfile.rt[rt].ptOrder){
          let ptObj = this.activeProfile.rt[rt].pt[pt]

          // we don't care about literals inside specific types of properties
          // like agent or headings but we also use this function to grab the ones specificly for agents and headings
          if (onlyAccessPoints){

            if (useConfigStore().excludeFromNonLatinLiteralCheck.indexOf(ptObj.propertyURI) == -1){
              continue
            }

          }else{

            if (useConfigStore().excludeFromNonLatinLiteralCheck.indexOf(ptObj.propertyURI) >-1){
              continue
            }

          }




          process(ptObj, function (obj,key,value) {
              // e.g.
              // console.log(obj,key);
              if (!latinRegex.test(value)){
                nonLatinNodes.push({
                  ptObj:ptObj,
                  node: obj,
                  propertyURI: key,
                  value: value
                })
              }
          });



        }
      }

      // console.log("nonLatinNodes",nonLatinNodes)
      return nonLatinNodes
    },

    returnAllNonLatinAgentOptions: function(){

      let nonLatin = this.returnAllNonLatinLiterals(true)
      let nonLatinMap = {}

      for (let nl of nonLatin){
        let ptFound = null
        for (let rt of this.activeProfile.rtOrder){
          for (let pt of this.activeProfile.rt[rt].ptOrder){
            if ( JSON.stringify(this.activeProfile.rt[rt].pt[pt].userValue).indexOf(nl.node['@guid'])>-1){
              ptFound=this.activeProfile.rt[rt].pt[pt]
            }
            if (ptFound){break}
          }
          if (ptFound){break}
        }

        // grab the guid as the key
        if (ptFound){
            if (!nonLatinMap[ptFound['@guid']]){
              nonLatinMap[ptFound['@guid']] = {
                scripts: [],
                '@guid' : ptFound['@guid'],
                'propertyURI': ptFound.propertyURI,
                nonLatin: this.returnLatinLabelForPt(ptFound)
              }
           }
          if (nl && nl.node  && nl.node['@language']){
            nonLatinMap[ptFound['@guid']].scripts.push(nl.node['@language'].split("-")[1])
          }


        }
        // unique array
        nonLatinMap[ptFound['@guid']].scripts = [...new Set(nonLatinMap[ptFound['@guid']].scripts)];

      }


      return nonLatinMap


    },


    returnLatinLabelForPt: function(pt){

      let nonLatinFound = null

      function process (obj, func) {
        if (nonLatinFound){return}
        if (obj && obj.userValue){
          obj = obj.userValue
        }
        if (Array.isArray(obj)){
          obj.forEach(function (child) {
            process(child, func);
          });
        }else if (typeof obj == 'object' && obj !== null){
          for (let k in obj){
            if (Array.isArray(obj[k])){
              process(obj[k], func);
            }else{
              if (!k.startsWith('@')){
                func(obj,k,obj[k]);
              }
            }
          }
        }
      }

      process(pt, function (obj,key,value) {
        if (key == 'http://www.w3.org/2000/01/rdf-schema#label'){
          if (!obj['@language']){
            nonLatinFound = obj['http://www.w3.org/2000/01/rdf-schema#label']
          }
        }
      });

      return nonLatinFound
    },

    /**
    * Set lang of literal value
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {string} fieldGuid - the guid of the field
    * @param {string} lang - the ISO rdf language value like 'en' to append to the literal 'xxxxx@en'
    * @return {void}
    */
    setBulkLang: function(componentGuid, fieldGuid, lang){


      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      if (pt !== false){
        let blankNode = utilsProfile.returnGuidLocation(pt.userValue,fieldGuid)
        if (blankNode){

          console.log(blankNode)
          if (lang){
            blankNode['@language'] = lang
          }else{
            if (blankNode['@language']){
              delete blankNode['@language']
            }
          }


        }else{
          console.warn("Cannot find blankNode",pt)
        }
      }else{
        console.warn("Cannot find pt",componentGuid)
      }


    },

    /**
    * returns the validation status of the heading used
    *
    * @param {string} componentGuid - the guid of the component (the parent of all fields)
    * @param {string} fieldGuid - the guid of the field
    */
    returnValidationType: function(fieldGuid){

      let fieldValue=null

      for (let rt of this.activeProfile.rtOrder){
        for (let pt of this.activeProfile.rt[rt].ptOrder){
          fieldValue = utilsProfile.returnGuidLocation(this.activeProfile.rt[rt].pt[pt].userValue,fieldGuid)
          if (fieldValue){break}
        }
        if (fieldValue){break}
      }
      if (fieldValue){

        // if it has a component list then check all the components
        if (fieldValue['http://www.loc.gov/mads/rdf/v1#componentList'] && fieldValue['http://www.loc.gov/mads/rdf/v1#componentList'].length>0){

          let allHasURI = true
          let firstHasURI = false
          for (let c of fieldValue['http://www.loc.gov/mads/rdf/v1#componentList']){
            if (!c['@id']){ allHasURI=false}
          }
          if (fieldValue['http://www.loc.gov/mads/rdf/v1#componentList'][0] && fieldValue['http://www.loc.gov/mads/rdf/v1#componentList'][0]['@id']){
            firstHasURI=true
          }


          if (allHasURI){return ['done_all','Linked']}
          if (firstHasURI){return ['warning','Partially Linked']}

          return ['help','No Partial Link']
        }





      }

      return ['report','No Link']
    },

    copySelected: async function(){
        let components = []
        let compontGuids = []
        let copyTargets = document.querySelectorAll('input[class=copy-selection]:checked')

        if  (copyTargets.length == 0){
            console.warn("nothing to copy")
            alert("Nothing selected to copy. Select the fields you would like to copy.")

            return false
        }

        copyTargets.forEach((item) => compontGuids.push(item.id))

        for (const guid of compontGuids){
            let component = utilsProfile.returnPt(this.activeProfile, guid)
            let componentString = JSON.stringify(component)
            components.push(componentString)
        }

        //copy it
        let value = components.join(" ;;; ")
        const type = "text/plain"
        const blob = new Blob([value], {type})
        const data = [new ClipboardItem({[type]: blob})]

        await navigator.clipboard.write(data)

        //Add checkmark
        let button = document.getElementById("copy-selected-button")
        button.children[0].innerHTML = "check"

        //wait a few seconds and remove the check mark
        setTimeout(function(){
            button.children[0].innerHTML = "content_copy"
        }, 2000)

        return true
    },

    //loop through the copied data and change all the "@guid"s
    changeGuid: function(data){
        try{
            for (let key of Object.keys(data)){
                if (key == "@guid"){
                    data[key] = short.generate()
                } else if(Array.isArray(data[key])) {
                    this.changeGuid(data[key])
                } else if (typeof data[key] == "object"){
                    this.changeGuid(data[key])
                }
            }
        } catch {

        }
    },

    //parse the activeProfile and insert the copied data where appropriate
    parseActiveInsert: async function(newComponent){
        this.changeGuid(newComponent)
        let profile = this.activeProfile

        // handle pasting into a profileRT that doesn't exist in the new profile
        // This is for when the source is an additional Instance, that doesn't exist in
        // in the title
        let targetRt
        if (!profile.rtOrder.includes(newComponent.parentId)){
            if (newComponent.parentId.includes("_")){
                targetRt = newComponent.parentId.split("_").at(0)
            } else {
                targetRt = newComponent.parentId
            }
        } else {
            targetRt = newComponent.parentId
        }

        for (let rt in profile["rt"]){
            let frozenPts = profile["rt"][rt]["pt"]

            let order = profile["rt"][rt]["ptOrder"]

            for (let pt in frozenPts){
                let current = profile["rt"][rt]["pt"][pt]

                if (rt == targetRt){
                    let targetURI = newComponent.propertyURI
                    let targetLabel = newComponent.propertyLabel

                    if (!current.deleted && current.propertyURI.trim() == targetURI.trim() && current.propertyLabel.trim() == targetLabel.trim()){
                        if (Object.keys(current.userValue).length == 1){
                            current.userValue = newComponent.userValue
                            break
                        } else {
                            const guid = current["@guid"]
                            let structure = this.returnStructureByComponentGuid(guid)
                            let newPt = await this.duplicateComponentGetId(guid, structure, rt, newComponent.id)

                            profile["rt"][rt]["pt"][newPt].userValue = newComponent.userValue
                            profile["rt"][rt]["pt"][newPt].userModified = true
                            break
                        }
                    }
                }
            }
        }
    },

    pasteSelected: async function(){
        let data
        const clipboardContents = await navigator.clipboard.read();

        for (let item of clipboardContents){

              if (!item.types.includes("text/plain")) {
                throw new Error("Clipboard does not contain text data.");
              }

              let blob = await item.getType("text/plain")
              const incomingValue = await blob.text()

              data = incomingValue.split(";;;")
            }

        for (let item of data){
              const dataJson = JSON.parse(item)
              this.parseActiveInsert(dataJson)
        }
    },



    //Check if the component's userValue is empty

    isEmptyComponent: function(c){
      const component = c
      const emptyArray = new Array("@root")
      const userValue = JSON.parse(JSON.stringify(component["userValue"]))


      // if there is only a @root
      if (JSON.stringify(Object.keys(component.userValue)) == JSON.stringify(emptyArray)){
          return true
      } else {
          // if the children only have "@..." properties
          for (let key in component.userValue){
              if (!key.startsWith("@")){
                  let result = false
                  try{
                      // this makes sure that the propertiesPanel will have the correct symbol when the incoming data
                      //  has an populate electronicLocator
                      if (component.propertyURI != "http://id.loc.gov/ontologies/bibframe/electronicLocator"){
                          result = Object.keys(userValue[key][0]).every((childKey) => childKey.startsWith("@"))
                      } else {
                          result = !Object.keys(userValue[key][0]).some((childKey) => childKey.startsWith("@id"))
                      }
                  } catch(err) {
                      console.error("error: Checking if component is empty")
                  }

                  return result
              }
          }
      }

      return false
    },

    /**
    * Will look at the literals being used on the record and pick the most common script found
    * used to help pick the correct auth labels to include in the access points,
    * will set this.mostCommonNonLatinScript
    * @return {String}
    */
    setMostCommonNonLatinScript(){

      let literals = this.returnAllNonLatinLiterals()
      let allScriptsFound = []
      for (let l of literals){
        if (l.node && l.node['@language'] && l.node['@language'].indexOf('-')>-1){
          let lang = l.node['@language'].split("-")[1].toLowerCase()
          if (lang != 'latn'){
            allScriptsFound.push(lang)
          }
        }
      }

      if (allScriptsFound.length>0){
        // get mode
        let mostCommong = allScriptsFound.sort((a,b) => allScriptsFound.filter(v => v===a).length - allScriptsFound.filter(v => v===b).length).pop();
        // capitalize
        mostCommong = String(mostCommong).charAt(0).toUpperCase() + String(mostCommong).slice(1)
        this.mostCommonNonLatinScript=mostCommong
      }else{
        this.mostCommonNonLatinScript = null
      }

      return this.mostCommonNonLatinScript
    },

    /**
    * Return the URL to use for lookups for various types of lookups based on the active profile
    * A way to get a URL to a lookup without having to hardcode it
    * @param {string} property - the proerty short version name, like bf:language
    * @return {String}
    */
    returnProfileLookupUrl(property){

      for (let rt of this.activeProfile.rtOrder){
        for (let pt of this.activeProfile.rt[rt].ptOrder){
          let purl = utilsParse.namespaceUri(this.activeProfile.rt[rt].pt[pt].propertyURI)

          if (purl == property){
            console.log(this.activeProfile.rt[rt].pt[pt])
            if (this.activeProfile.rt[rt].pt[pt].valueConstraint && this.activeProfile.rt[rt].pt[pt].valueConstraint.useValuesFrom && this.activeProfile.rt[rt].pt[pt].valueConstraint.useValuesFrom.length>0){
              return this.activeProfile.rt[rt].pt[pt].valueConstraint.useValuesFrom[0]
            }
          }


        }
      }
      return false
    },

    /**
    * Builds and posts a Hub Stub
    *
    * @param {object} hubCreatorObj - obj with creator label, uri,marcKey
    * @param {string} title - title string
    * @param {string} langUri - uri to language
    * @return {String}
    */
    async buildPostHubStub(hubCreatorObj,title,langUri,catCode){

      console.log("hubCreatorObj",hubCreatorObj)
      let xml = await utilsExport.createHubStubXML(hubCreatorObj,title,langUri,catCode)

      console.log(xml)
      let eid = 'e' + decimalTranslator.new()
      eid = eid.substring(0,8)

      // pass a fake activeprofile with id == Hub to trigger hub protocols
      let pubResuts
      try{
        pubResuts = await utilsNetwork.publish(xml, eid, {id: 'Hub'})



      }catch (error){
        console.log(error)
        alert("There was an error creating your Hub. Please report this issue.")
      }

      // pubResuts = {'postLocation': 'https://id.loc.gov/resources/hubs/a07eefde-6522-9b99-e760-5c92f7d396eb'}


      return pubResuts



    },
    /** Add the DDC to marva
     *
     * @param {object} deweyInfo - The dewey information that will be inserted into Marva
     * @param {string} guid - The GUID of the LCC component that will be used to create the new component
     * @param {string} structure - the structure that will be used to create the new component
     */
    addDdc: async function(deweyInfo, guid, structure){
      //Look to see if there is a DDC component
      let activeProfile = this.activeProfile
      let hasEmptyDDC = false
      let ddcComponent = null
      let lastClassifiction = null
      for (let pt in activeProfile.rt["lc:RT:bf2:Monograph:Work"].pt){
        if (pt.includes("id_loc_gov_ontologies_bibframe_classification__classification_numbers")){
          const target = activeProfile.rt["lc:RT:bf2:Monograph:Work"].pt[pt]
          const userValue = target.userValue
          const classification = userValue["http://id.loc.gov/ontologies/bibframe/classification"][0]
          const type = classification["@type"]
          if (!pt.deleted){
            lastClassifiction = pt
            //type == "http://id.loc.gov/ontologies/bibframe/ClassificationDdc" &&
            if (!Object.keys(classification).includes("http://id.loc.gov/ontologies/bibframe/classificationPortion")){
              hasEmptyDDC = true
              ddcComponent = classification
            }
          }
        }
      }
      let newDDC
      // if no empty ddc, create one
      if (!hasEmptyDDC){
        newDDC = await this.duplicateComponentGetId(this.returnStructureByComponentGuid(guid)['@guid'], structure, "lc:RT:bf2:Monograph:Work", lastClassifiction)
        ddcComponent = activeProfile.rt["lc:RT:bf2:Monograph:Work"].pt[newDDC]
      }

      //add information to component
      let userValue = null
      try{
        userValue = ddcComponent.userValue["http://id.loc.gov/ontologies/bibframe/classification"][0]
      } catch {
        userValue = ddcComponent
      }

      let dewey = null
      if (Object.keys(deweyInfo).includes("DDC")){
        dewey = deweyInfo.DDC
      } else {
        dewey = deweyInfo.dewey
      }

      const newGuid = short.generate()
      userValue["@type"] = "http://id.loc.gov/ontologies/bibframe/ClassificationDdc"
      userValue["http://id.loc.gov/ontologies/bibframe/classificationPortion"] = [{ "@guid": newGuid, "http://id.loc.gov/ontologies/bibframe/classificationPortion": String(dewey) }]

      //Add the defaults:
      const newComponent = activeProfile.rt["lc:RT:bf2:Monograph:Work"].pt[newDDC]

      // look up one level & use the appropriate structure
      let parentStructure = this.returnStructureByComponentGuid(newComponent['@guid'])
      if (parentStructure.valueConstraint && parentStructure.valueConstraint.valueTemplateRefs && parentStructure.valueConstraint.valueTemplateRefs.length>0){
        for (let vRt of parentStructure.valueConstraint.valueTemplateRefs){
          if (this.rtLookup[vRt]){
            for (let pt of this.rtLookup[vRt].propertyTemplates){
              if (pt.valueConstraint.defaults && pt.valueConstraint.defaults.length > 0){
                this.insertDefaultValuesComponent(newComponent['@guid'], pt)
              }
            }
          }
        }
      }
    },


  },



})