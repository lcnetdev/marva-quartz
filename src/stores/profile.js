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

import shortCodesOverrides from "@/lib/shortCodesOverrides.json"
import defaultComponents from "@/lib/defaults/default_components.json"

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
    copyCatMode: false,
    copyCatSearch: null,

    // the current active profile
    activeProfile: {},

    activeProfileSaved: false,
    activeProfilePosted: false,
    activeProfilePostedTimestamp: false,

    showPostModal: false,
    showRecoveryModal: false,
    showValidateModal: false,
    showHubStubCreateModal: false,
    showNacoStubCreateModal: false,
    lastComplexLookupString: "", // used in the naco stub process to paste what you were working on in the complex lookup

    showItemInstanceSelection: false,
    activeHubStubData:{
    },
    activeHubStubComponent:{},

    activeNARStubComponent:{},

    savedNARModalData:{},
    savedHubModalData:{},

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
    showAdHocModal: false,
    deweyData: {
      lcc: null,
      guid: null,
      structure: null,
    },

    cammModeErrors: {


    },

    linkedData: {},

    componentLibrary : {
      profiles:{

      }
    },

    mostCommonNonLatinScript: null,
    nonLatinScriptAgents: {},

    pairedLitearlIndicatorLookup: {},

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

    // List of empty components for ad hoc mode
    emptyComponents: {},
    hiddenSubjects: false,

    localMarva: false,
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
    * Can be used to return the rt of the component by passing the GUID
    * It doesn't care what profile it is in it will loop through all of them to find the unique GUID
    * @param {string} guid - the guid of the component
    * @return {object}
    */
    returnRtByGUID: (state) => {
      return (guid) => {
        for (let rt in state.activeProfile.rt){
          for (let pt in state.activeProfile.rt[rt].pt){
            if (state.activeProfile.rt[rt].pt[pt]['@guid'] === guid){
              return rt
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

    returnComponentByPropertyLabel: (state) => {
      return (label, profile) => {
        for (let rt in state.activeProfile.rt){
          for (let pt in state.activeProfile.rt[rt].pt){
            if (state.activeProfile.rt[rt].pt[pt]['propertyLabel'].toLowerCase() === label.toLowerCase()){
              if (profile && rt.includes(profile)){
                return state.activeProfile.rt[rt].pt[pt]
              } else if (!profile){
                return state.activeProfile.rt[rt].pt[pt]
              }
            }
          }
        }
      }
    },


     /** Groups the library components into a array ready to render
     *
     * @return {array}
     */
     returnComponentLibrary: (state) => {
      // limit to the current profiles being used
      // console.log(state.activeProfile)
      // console.log(state.componentLibrary)
      // return () => {
      //   return [state.componentLibrary]

      // }
      let results = []
      for (let key in state.activeProfile.rt){
        // Items have something added to the end of the key
        if (key && key.includes(":Item")){
            if (key.includes("-") || key.includes("_")){
                let idx
                idx = key.indexOf("_")
                if (idx < 0){
                    idx = key.indexOf("-")
                }
                key = key.slice(0, idx)
            }
        }
        // ther are components saved for this profile
        if (state.componentLibrary.profiles[key]){
          let groups = {}
          let groupsOrder = []
          // loop through all the components sorted by position order
          for (let group of state.componentLibrary.profiles[key].groups.sort(({position:a}, {position:b}) => a-b)){

            if (group.groupId === null){
              groups[group.id] = [group]
              groupsOrder.push(group.id)
            }else{
                if (!groups[group.groupId]){groups[group.groupId]=[]}
                groups[group.groupId].push(group)
                if (groupsOrder.indexOf(group.groupId)==-1){
                  groupsOrder.push(group.groupId)
                }
            }
          }
          results.push({groups:groups, groupsOrder:groupsOrder, profileId: key, label: key.split(":").slice(-1)[0]})
        }

        if (usePreferenceStore().returnValue('--b-edit-main-splitpane-properties-show-defaults')){
          let groups = {}
          let groupsOrder = []
          for (let dKey in defaultComponents.DefaultComponentLibrary.profiles){
            if (dKey.includes(key)){
              for (let group of defaultComponents.DefaultComponentLibrary.profiles[dKey].groups.sort(({position:a}, {position:b}) => a-b)){
                if (group.groupId === null){
                  groups[group.id] = [group]
                  groupsOrder.push(group.id)
                }else{
                    if (!groups[group.groupId]){groups[group.groupId]=[]}
                    groups[group.groupId].push(group)
                    if (groupsOrder.indexOf(group.groupId)==-1){
                      groupsOrder.push(group.groupId)
                    }
                }
              }
              results.push({type: "default", groups:groups, groupsOrder:groupsOrder, profileId: dKey, label: key.split(":").slice(-1)[0]})
            }
          }
        }
      }

      // now go through and see if there are the the same group being used in multiple profiles if so
      // that means they have cross profile components (2 fields in Work 1 in instance for exmaple)


      let groupsCount = {}
      let groupsCountDefault = {}
      for (let profileComponents of results){

        let type = profileComponents.type

        for (let groupKey in profileComponents.groups){
          if (profileComponents.groups[groupKey].groupId !== null){
            for (let groupItem of profileComponents.groups[groupKey]){
              let group = groupsCount
              if (type == 'default'){
                group = groupsCountDefault
              }
              if (groupItem.groupId !== null){
                if (!group[groupItem.groupId]){
                  group[groupItem.groupId]=[]
                }
                if (group[groupItem.groupId].indexOf(groupItem.structure.parentId)==-1){
                  group[groupItem.groupId].push(groupItem.structure.parentId)
                }
              }
            }
          }
        }
      }

      let groupsToMerge = []
      let groupsToMergeDefault = []
      for (let groupKey in groupsCount){
        if (groupsCount[groupKey].length>1){
          groupsToMerge.push(groupKey)
        }
      }
      for (let groupKey in groupsCountDefault){
        if (groupsCountDefault[groupKey].length>1){
          groupsToMergeDefault.push(groupKey)
        }
      }

      let mergeComponents = function (results, groupsToMerge, title){
        if (groupsToMerge.length>0){
          // we have to MERGE
          let multiProfile = {
            groups: {},
            groupsOrder: [],
            label: title,
            profileId: title,
            type: title.includes("Default") ? 'default' : null
          }

          for (let groupName of groupsToMerge){
            let tmpGroupComponents = []
            // remove them from the orginal group/profile and them to the multi profile
            for (let profileComponents of results){
              if (profileComponents.groups[groupName]){
                tmpGroupComponents=tmpGroupComponents.concat( JSON.parse(JSON.stringify(profileComponents.groups[groupName])) )
                delete profileComponents.groups[groupName]
              }
              profileComponents.groupsOrder = profileComponents.groupsOrder.filter((v) => {return (v !== groupName)})
            }

            // put them into the multi profile
            multiProfile.groups[groupName] = tmpGroupComponents
            multiProfile.groupsOrder.push(groupName)

            // add a label to denote if the individual component is a work or instance whatever component.
            for (let groupKey in multiProfile.groups){
              for (let component of multiProfile.groups[groupKey]){
                if (component.label.indexOf("(i)")>-1){ continue}
                if (component.label.indexOf("(w)")>-1){ continue}
                let initial = component.structure.parentId.split(':').slice(-1)[0].charAt(0).toLowerCase();

                component.label = `(${initial}) ${component.label}`
              }
            }
          }
          results.push(multiProfile)
        }

        return results
      }

      let r = mergeComponents(results, groupsToMerge, 'Multi')
      results.concat(r)
      r = mergeComponents(results, groupsToMergeDefault, 'Multi Default')
      results.concat(r)

      //merge the defaults into 1 list
      if (usePreferenceStore().returnValue('--b-edit-main-splitpane-properties-show-defaults')){
        let defaultIdx = []
        let defaults = []
        let defaultObj = {type: "default", groups:{}, groupsOrder:[], profileId: 'defaults', label: 'Defaults'}
        // Get the defaults
        for (let item in results){
          if (results[item].type == 'default'){
            defaultIdx.push(Number(item))
            defaults.push(results[item])
          }
        }
        //merge into 1
        for (let item of defaults){
          defaultObj.groups = Object.assign({}, defaultObj.groups, item.groups)
          defaultObj.groupsOrder = defaultObj.groupsOrder.concat(item.groupsOrder)
        }
        //rebuild results
        for (let i = results.length-1; i>=0; i--){
          if (defaultIdx.includes(i)){
            results.splice(i, 1)
          }
        }
        let sortFn = function(a, b){
          let targetA = !defaultObj.groups[a][0].label.startsWith("(") ? defaultObj.groups[a][0].label : a
          let targetB = !defaultObj.groups[b][0].label.startsWith("(") ? defaultObj.groups[b][0].label : b

          let val = targetA < targetB ? -1 : targetA > targetB ? 1 : 0

          return val
        }
        defaultObj.groupsOrder.sort(sortFn)

        results.push(defaultObj)
      }

      // remove any empty ones that may have shifted fully into the multi profile
      results = results.filter((g) => {return (g.groupsOrder.length>0)})

      results = results.sort((a,b) => {
        if (!a.type || a.type == null) { return -1}
        if (!b.type || b.type == null) { return 1}
        return (a.type < b.type) ? 1 : (a.type > b.type) ? -1 : 0
      })
      return results
    },




  },
  actions: {
    resetLocalComponentCache(){
      cachePt = {}
      cacheGuid = {}
      dataChangedTimeout = null
    },

    /** Load the default component order */
    useDefaultComponentOrder(){
      let profileName = this.activeProfile.id
      let profile = this.profiles[profileName]

      for (let profileName in profile.rt){
        let currentOrder = this.activeProfile.rt[profileName].ptOrder
        let defaultOrder = profile.rt[profileName].ptOrder
        let tempOrder = []
        for (let el of defaultOrder){
          // These should all be base level names, no `_ + new Date()`
          let matchingComponents = currentOrder.filter(i => i.includes(el)) // keep like components together
          tempOrder = tempOrder.concat(matchingComponents.sort())
        }

        //Need to get the admin fields
        let components = Object.keys(this.activeProfile.rt[profileName].pt)
        for (let c of components){
          if (!tempOrder.includes(c)){
            tempOrder.push(c)
          }
        }

        this.activeProfile.rt[profileName].ptOrder = tempOrder
      }
    },

    /** Save the cataloger's current component order */
    saveCustomComponentOrder(){
      let order = {}

      let profileName = this.activeProfile.id
      let profile = this.profiles[profileName]

      for (let rt in this.activeProfile.rt){
        let activeOrder = this.activeProfile.rt[rt].ptOrder
        let frozenDefaultOrder = JSON.parse(JSON.stringify(profile.rt[rt].ptOrder))
        // the order should only have base names for components
        // They'll be grouped together if there is more than 1
        let tempArray = []
        for (let el of activeOrder){
          if (!frozenDefaultOrder.includes(el)){
            let defaultMatch = frozenDefaultOrder.filter(item => el == item)
            if (!tempArray.includes(defaultMatch[0])){
              tempArray.push(defaultMatch[0])
            }
          } else {
            tempArray.push(el)
          }
        }

        order[rt] = tempArray
      }

      usePreferenceStore().saveOrder(order)
      this.useCustomComponentOrder()
    },

    /** Load the saved custom component order */
    useCustomComponentOrder(){
      let profileName = this.activeProfile.id
      let profile = this.profiles[profileName]

      let order = usePreferenceStore().loadOrder()

      for (let profileName in order){
        if (!Object.keys(this.activeProfile.rt).includes(profileName)){ continue }
        let currentOrder = this.activeProfile.rt[profileName].ptOrder
        let customOrder = order[profileName]
        let tempOrder = []

        // if there's a change to the profile, adjust the order accordingly
        let profileOrder = profile.rt[profileName].ptOrder

        let additionalToCustomOrder = customOrder.filter(el => !profileOrder.includes(el))
        let missingFromCustomOrder = profileOrder.filter(el => !customOrder.includes(el))

        // remove the extra pieces
        customOrder = customOrder.filter(el => !additionalToCustomOrder.includes(el))
        // customOrder = customOrder.concat(missingFromCustomOrder)

        // add the missing peices in the same index from the default
        for (let el of missingFromCustomOrder){
          let idx = profileOrder.indexOf(el)
          customOrder.splice(idx, 0, el)
        }

        for (let el of customOrder){
          // These should all be base level names, no `_ + new Date()`
          let matchingComponents = currentOrder.filter(i => i.includes(el)) // keep like components together
          tempOrder = tempOrder.concat(matchingComponents) //.sort()
        }

        //Need to get the admin fields
        let components = Object.keys(this.activeProfile.rt[profileName].pt)
        for (let c of components){
          if (!tempOrder.includes(c)){
            tempOrder.push(c)
          }
        }

        this.activeProfile.rt[profileName].ptOrder = tempOrder
      }
    },

    /**
    * The main first process that takes the raw profiles and processes them for use
    *
    * @return {void}
    */
    async buildProfiles() {
      const config = useConfigStore()

      let profilesURL = config.returnUrls.profiles
      let startingURL = config.returnUrls.starting

      // if dancer is enabled check to see if they have a custom workspace set
      if (config.returnUrls.dancerEnabled){
        // does the local storage have a custom workspace set
        console.log("localStorage.getItem('marva-dancerWorkspace')",localStorage.getItem('marva-dancerWorkspace'))
        if (localStorage.getItem('marva-dancerWorkspace') && localStorage.getItem('marva-dancerWorkspace') != "null"){
          let dancerWorkspace = localStorage.getItem('marva-dancerWorkspace')
          // dancerWorkspace is now the UUID of the workspace, so we need to build the URI
          let dancerBaseUrl = config.returnUrls.dancerWorkspaceList.split('workspaces')[0]
          profilesURL = dancerBaseUrl + dancerWorkspace + '/profile'
          startingURL = dancerBaseUrl + dancerWorkspace + '/starting-points'
        }
      }


      let profileData;
      try{
        let response = await fetch(profilesURL);
        profileData =  await response.json()
      }catch(err){
        console.log("Error Downloading profiles from:", config.returnUrls.profiles)

        alert('Could not download the profiles, unable to continue.')
        console.error(err);
      }


      let startingPointData;


      try{
        let response = await fetch(startingURL);
        startingPointData =  await response.json()
      }catch(err){
        console.log("Error Downloading Starting Points from:", config.returnUrls.starting)
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
                      this.profiles[p].rt[rt].pt[pt].hashCode = hashCode(JSON.stringify(ptVal))
                      this.profiles[p].rt[rt].pt[pt].hashCodeId = id
                  }


              }
          }
      }
      // console.log('this.profiles',this.profiles)
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
      // let uuid = 'e' + decimalTranslator.new()
      // uuid = uuid.substring(0,8)
      let uuid = 'e' + Date.now().toString()
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
      console.log("componentGuid, fieldGuid, propertyPath, URI, label")
      console.log(componentGuid, fieldGuid, propertyPath, URI, label)
      propertyPath = JSON.parse(JSON.stringify(propertyPath))
      propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=='http://www.w3.org/2002/07/owl#sameAs')  })

      // if there's a code in the label, take it out
      if (!URI){ URI = '' }
      const code = URI.split("/").at(-1)  // is this reliable?
      if (label.match("(" + code + ")")){
        label = label.replace("(" + code + ")", "")
      }

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
          }else if (propertyPath.length==1){

            // this is a top level component, like bf:content
            // there will be no lastProperty, just add it to the parent directly
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
            parent.push(toadd)
          }else{
            console.log("lastProperty",lastProperty)
            console.log('propertyPath',propertyPath)

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
          } if (['object'].includes(typeof parent[p]) && parent[p] !== null){

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
      //Save
      //  componentGuid:  aiPuH4YsetZ9xmcv7rqisJ
      //  fieldGuid:  pdtUXGpNDJ9mz33JM3uxje

      // from NAR, fieldGuid is null

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

      // used later to sort the literal order if needed
      let checkLiteralOrder = null

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

            checkLiteralOrder = parent[lastProperty]

            // get a link to it we'll edit it below
            blankNode = utilsProfile.returnGuidLocation(pt.userValue,newGuid)
            // set a temp value that will be over written below
            blankNode[lastProperty] = true
            // console.log("--------pt 4------------")
            // console.log(JSON.stringify(pt,null,2))
          }

          // They used "Additional literal" on an empty field, add the new field
          // without this, the user needs to run the action twice to the the additional field
          if (currentValueCount === 0 && value=='new value'){
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
            checkLiteralOrder = parent[lastProperty]
            // get a link to it we'll edit it below
            blankNode = utilsProfile.returnGuidLocation(pt.userValue,newGuid)
            // set a temp value that will be over written below
            blankNode[lastProperty] = true
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

              // console.log(p.propertyURI,'has',Object.keys(uv).length,'keys')

              // the oldUv so we have a references to where we will be in the next loop so we can delete from the parent obj
              oldUv = oldUv[p.propertyURI]
              if (Array.isArray(oldUv)){
                oldUv=oldUv[0]
              }

            }

          //   console.log("Delete this guy",propertyPath )
          // }


          // also remove the paired literal lines if needed
          console.log("Building lines")
          utilsParse.buildPairedLiteralsIndicators(this.activeProfile)


        }


        // this will only trigger on adding new literal events, like scriptshifter, not editing
        if (checkLiteralOrder && Array.isArray(checkLiteralOrder) && checkLiteralOrder.length>1){
          if (pt.userValue){
            let propsFirstLevel = Object.keys(pt.userValue).filter(v => { return !v.startsWith('@') })
            for (let p1 of propsFirstLevel){
              for (let bnode of pt.userValue[p1]){
                let propsSecondLevel = Object.keys(bnode).filter(v => { return !v.startsWith('@') })
                for (let p2 of propsSecondLevel){
                  if (Array.isArray(bnode[p2]) && bnode[p2].length>1){
                    if (bnode[p2].filter((v)=>{ return (v['@language'])}).length>0){
                      // sort the array of literals so the latin one is first
                      if (usePreferenceStore().returnValue('--b-edit-main-literal-non-latin-first')){
                        bnode[p2] = this.sortObjectsByLatinMatch(bnode[p2],p2 ).reverse()
                      }else{
                        bnode[p2] = this.sortObjectsByLatinMatch(bnode[p2],p2 )
                      }
                    }
                  }
                }
              }
            }
          }

          // also build the paired literal lines
          this.reorderAllNonLatinLiterals()
          utilsParse.buildPairedLiteralsIndicators(this.activeProfile)
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



      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      let valueLocation = utilsProfile.returnValueFromPropertyPath(pt,propertyPath)
      let deepestLevelURI = propertyPath[propertyPath.length-1].propertyURI

      // console.log(pt.propertyURI)
      // console.log("propertyPath=",propertyPath)

      // working with Hubs as subjects breaks a few things.
      // rewrite the property Path if we are working with them
      if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject'){

        if (pt.userValue &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/subject'] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/subject'][0] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['@type'] &&
            (pt.userValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['@type'] == "http://id.loc.gov/ontologies/bibframe/Hub" || pt.userValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['@type'] == "http://id.loc.gov/ontologies/bibframe/Work")
        )


        //  it is a subject remove label properties
        propertyPath = propertyPath.filter((v)=> { return (v.propertyURI!=="http://www.loc.gov/mads/rdf/v1#authoritativeLabel")  })
        valueLocation = utilsProfile.returnValueFromPropertyPath(pt,propertyPath)

        // console.log("NEW propertyPath=",propertyPath)

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

              // look for bf:title -> bf:mainTitle
              if (!label){
                for (let lP1 of LABEL_PREDICATES){
                  for (let lP2 of LABEL_PREDICATES){
                    if (v[lP1] && v[lP1][0][lP2] && v[lP1][0][lP2][0][lP2]){
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

              // always allow editing subjects
              if (pt && pt.propertyURI && pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/subject"){
                uneditable = false
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

      // if (!type && URI && !lastProperty.includes("intendedAudience")){
      //   // I regretfully inform you we will need to look this up
      //   let context = await utilsNetwork.returnContext(URI)
      //   type = context.typeFull
      //   if (!marcKey){
      //     marcKey = context.marcKey
      //   }
      // }

      if (['Work', 'Hub', 'GenreForm'].includes(type)){
        type = "http://id.loc.gov/ontologies/bibframe/" + type
      }
      if (type && !type.startsWith("http")){
        type = "http://www.loc.gov/mads/rdf/v1#" + type
      }

      // literals don't have a type or a URI & intendedAudience has extra considerations
      // namely that the rdf:Type in BF is bf:Authority
      if ((!type && !URI) || lastProperty.includes("intendedAudience")){
        type = await utilsRDF.suggestTypeProfile(lastProperty, pt)
        if (type == false){
          type = await utilsRDF.suggestTypeNetwork(lastProperty)
        }
      }

      // More granual typing for Geographic
      if (type == "http://www.loc.gov/mads/rdf/v1#Geographic"){
        if (propertyPath.filter((v) => { return v.propertyURI == 'http://id.loc.gov/ontologies/bibframe/geographicCoverage' }).length > 0){
          type = "http://id.loc.gov/ontologies/bibframe/GeographicCoverage"
        } else {
          type = "http://id.loc.gov/ontologies/bibframe/Place"
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
          // don't do this for subjects, Subjects as complexValues will add extra nesting that doesn't match a subject's XML
          if (!propertyPath.some((pp) => pp.propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject')){
            blankNode['@type'] = type
          }


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

          // add in the venacular labels
          if (nodeMap && nodeMap.vernacularLabels){
            for (let l of nodeMap.vernacularLabels){
              // make sure there really is a non-latin label
              if (l.indexOf("@") == -1){
                continue
              }
              // the api returns it as "label@language"
              let lLabel = l.split("@")[0]
              let lLanguage = l.split("@")[1]
              // make sure there is a label field for it
              if (!blankNode['http://www.w3.org/2000/01/rdf-schema#label']){
                blankNode['http://www.w3.org/2000/01/rdf-schema#label'] = []
              }

              blankNode['http://www.w3.org/2000/01/rdf-schema#label'].push(
                {
                  '@guid': short.generate(),
                  'http://www.w3.org/2000/01/rdf-schema#label' : lLabel,
                  '@language': lLanguage
                }
              )
            }
          }



          // if (URI.indexOf('n2010057779') > -1){
          //   nodeMap.vernacularMarcKeys = ["4001 $a玄 武岩,$d1969-@zxx-Hani","4001 $a현 무암,$d1969-@zxx-Hang"]
          // }

          // console.log("nodeMap",nodeMap)

          //Add gacs code to user data
          if (nodeMap["gacs"]){
            blankNode["http://www.loc.gov/mads/rdf/v1#code"] = []
            for (let code in nodeMap["gacs"]){
                blankNode["http://www.loc.gov/mads/rdf/v1#code"].push(
                  {
                    '@guid': short.generate(),
                    "@gacs": "http://id.loc.gov/datatypes/codes/gac",
                    'http://www.loc.gov/mads/rdf/v1#code': nodeMap["gacs"][code]
                  }
                )
            }
          }

          if (!Array.isArray(marcKey)){
            marcKey = [marcKey]
          }

          for (let aMarcKeyNode of marcKey){

            // console.log("aMarcKeyNode",aMarcKeyNode)

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
            }else if (aMarcKeyNode && aMarcKeyNode.marcKey){

              let aNode = {
                '@guid': short.generate(),
                'http://id.loc.gov/ontologies/bflc/marcKey' : aMarcKeyNode.marcKey
              }
              if (aMarcKeyNode['@language']){
                aNode['@language']=aMarcKeyNode['@language']
              }

              blankNode['http://id.loc.gov/ontologies/bflc/marcKey'].push(aNode)

            }else{
              console.error("Cannot understand response from context extaction for marcKey:",marcKey)
            }
          }

          // add in the venacular marckeys
          if (nodeMap && nodeMap.vernacularMarcKeys){
            for (let l of nodeMap.vernacularMarcKeys){
              // make sure there really is a non-latin label
              if (l.indexOf("@") == -1){
                continue
              }
              // the api returns it as "label@language"
              let lLabel = l.split("@")[0]
              let lLanguage = l.split("@")[1]
              // make sure there is a label field for it
              if (!blankNode['http://id.loc.gov/ontologies/bflc/marcKey']){
                blankNode['http://id.loc.gov/ontologies/bflc/marcKey'] = []
              }

              blankNode['http://id.loc.gov/ontologies/bflc/marcKey'].push(
                {
                  '@guid': short.generate(),
                  'http://id.loc.gov/ontologies/bflc/marcKey' : lLabel,
                  '@language': lLanguage
                }
              )
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

          // add the source for Genre/Form
          if (propertyPath.map((obj) => obj.propertyURI).includes("http://id.loc.gov/ontologies/bibframe/genreForm")){
            let objId = blankNode['@id']
            if (nodeMap.collections.includes('http://id.loc.gov/authorities/genreForms/collection_LCGFT_General')){
              blankNode['http://id.loc.gov/ontologies/bibframe/source'] =  [
                {
                      "@guid": short.generate(),
                      "@type": "http://id.loc.gov/ontologies/bibframe/Source",
                      "@id": "http://id.loc.gov/authorities/genreForms/collection_LCGFT_General",
                      "http://www.w3.org/2000/01/rdf-schema#label": [
                          {
                              "@guid": short.generate(),
                              "http://www.w3.org/2000/01/rdf-schema#label": "Library of Congress genre/form terms for library and archival materials"
                          }
                      ]
                  }
              ]
            } if (nodeMap.collections.includes('http://id.loc.gov/vocabulary/rbms/collection_rbmscv')){
              blankNode['http://id.loc.gov/ontologies/bibframe/source'] =  [
                {
                      "@guid": short.generate(),
                      "@type": "http://id.loc.gov/ontologies/bibframe/Source",
                      "@id": "http://id.loc.gov/vocabulary/genreFormSchemes/rbmscv",
                      "http://www.w3.org/2000/01/rdf-schema#label": [
                          {
                              "@guid": short.generate(),
                              "http://www.w3.org/2000/01/rdf-schema#label": "RBMS Controlled Vocabularies"
                          }
                      ]
                  }
              ]
            }
          }



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

      console.log("pt is ", JSON.stringify(pt.userValue))
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

                // if it's a complexSubject, replace bf:Topic with madsrdf:ComplexSubject -- the conversion expects this
                if (thisLevelType == "http://id.loc.gov/ontologies/bibframe/Topic" && propertyPath.some((obj) => obj.propertyURI == "http://www.loc.gov/mads/rdf/v1#componentList")){
                  thisLevelType = 'madsrdf:ComplexSubject'
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
                // it might be a literal.
                if (subjectComponents[0].uri){
                  currentUserValuePos['@id'] = subjectComponents[0].uri
                }else{
                  delete currentUserValuePos["http://www.loc.gov/mads/rdf/v1#isMemberOfMADSScheme"]
                }

                // it might be a Hub if so its not a isMemberOfMADSScheme subject
                if (subjectComponents[0].type && subjectComponents[0].type.toLowerCase().indexOf("hub")>-1){
                  delete currentUserValuePos["http://www.loc.gov/mads/rdf/v1#isMemberOfMADSScheme"]
                }

                if (subjectComponents[0].type){
                  currentUserValuePos['@type'] = subjectComponents[0].type.replace('madsrdf:','http://www.loc.gov/mads/rdf/v1#')
                }else{
                  currentUserValuePos['@type'] = 'madsrdf:Topic'
                }

                // if there is a URI add authorized label
                if (currentUserValuePos['@id']){

                  currentUserValuePos["http://www.loc.gov/mads/rdf/v1#authoritativeLabel"] = [{
                      "@guid": short.generate(),
                      "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": subjectComponents[0].label
                  }]
                }

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


    downloadBFDotOrg: async function(format='marc'){

      let xml = await utilsExport.buildXML(this.activeProfile)
      let marc = await utilsNetwork.marcPreview(xml.bf2Marc, false)

      xml = xml.xmlStringFormatted
      marc =marc[0].results.stdout
      let use = marc
      let filename = `${this.activeProfile.eId}.marcxml.xml`
      if (format=='marc'){
        use = marc
      }else{
        use = xml
        filename = `${this.activeProfile.eId}.rdfxml.xml`
      }

      const blob = new Blob([use], { type: "text/xml" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;

      // Append to body and trigger click (some browsers might require this for reliable click event)
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a); // Clean up

      URL.revokeObjectURL(url);


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
      let saved = false
      if (!this.isTestEnv()){  //Don't try to save if in test env
        saved = await utilsNetwork.saveRecord(xml.xlmStringBasic, this.activeProfile.eId)
      }

      if (saved){
        this.activeProfileSaved = true
      }
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
      let saved = await utilsNetwork.saveRecord(xml.xlmStringBasic, this.activeProfile.eId)
      if (saved){
        this.activeProfileSaved = true
      }
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
      let marva001

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
          // this.localMarva = false
          let url = config.convertToRegionUrl(this.activeProfile.rt[rt].URI)
          if (this.activeProfile.marvaLocalId){
            url = url.replace(this.activeProfile.eId, this.activeProfile.marvaLocalId)
          }
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
    * @param {boolean} title - return the title text not the short code
    * @return {string} - the label
    */
    returnBfCodeLabel: function(structure, returntitle, componentGuid){

      if (returntitle){
        let pt = utilsProfile.returnPt(this.activeProfile,structure['@guid'])
        if (pt){
          return utilsExport.namespaceUri(pt.propertyURI)
        }else{
          return utilsExport.namespaceUri(structure.propertyURI)
        }

      }

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

      // if we have it customized then just return that
      if (shortCodesOverrides[code]){
        return shortCodesOverrides[code]
      }


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

      // console.log('****!',orgCode, ',', (orgCode.includes('bf:')) ? `https://id.loc.gov/ontologies/bibframe.html#p_${orgCode.split(':')[1]}` : 'bflc or other', ',',code)

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
        useReturn.push({'code':this.returnBfCodeLabel(p), 'label' : p.propertyLabel, 'uri': p.propertyURI})

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
    inlineFieldIsToggledForDisplay: function(componentGuid, label){

      let pt = utilsProfile.returnPt(this.activeProfile,componentGuid)
      if (!pt.inlineModeDisplay){
        return false
      }

      if (pt.inlineModeDisplay[label]){
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

      // if it is empty and brand new dont do the next check it wont have any data
      if (Object.keys(pt.userValue).length > 1){ // this means it doesn't only have @root in the userValue and has data populated

        // maybe it it is a dewy or other classifciation, only proceed if it is LCC
        if (pt.userValue?.['http://id.loc.gov/ontologies/bibframe/classification']?.[0]?.['@type'] !== 'http://id.loc.gov/ontologies/bibframe/ClassificationLcc'){
          // console.log("RETURN FALSE 1")

          return false

        }

      }


      let classNumber = null
      let classGuid = null

      let cutterNumber = null
      let cutterGuid = null

      let work = null
      let title = null
      let titleNonSort = null
      let firstSubject = null
      let secondSubject = null
      let contributors = []

      let titleNonLatin = null

      // find the work and pull out stuff
      for (let rtId in this.activeProfile.rt){
        let target = false

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
      // console.log("work",work)
      if (work){
        for (let ptId of work.ptOrder){
          let pt = JSON.parse(JSON.stringify(work.pt[ptId]))
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

          if (pt && pt.propertyURI=='http://id.loc.gov/ontologies/bibframe/title'){
            let titleUserValue = pt.userValue
            if (titleUserValue && titleUserValue['http://id.loc.gov/ontologies/bibframe/title'] && titleUserValue['http://id.loc.gov/ontologies/bibframe/title'].length>0 && titleUserValue['http://id.loc.gov/ontologies/bibframe/title'][0]){
              titleUserValue = titleUserValue['http://id.loc.gov/ontologies/bibframe/title'][0]
              if (titleUserValue && titleUserValue["@type"]=="http://id.loc.gov/ontologies/bibframe/Title" && titleUserValue['http://id.loc.gov/ontologies/bibframe/mainTitle']){

                let titleBnodeSorted = titleUserValue

                if (titleUserValue['http://id.loc.gov/ontologies/bibframe/mainTitle'].length > 1){
                  // there are multiple titles, we want to make sure to pick the latin one
                  titleBnodeSorted['http://id.loc.gov/ontologies/bibframe/mainTitle'] = this.sortObjectsByLatinMatch(titleUserValue['http://id.loc.gov/ontologies/bibframe/mainTitle'],'http://id.loc.gov/ontologies/bibframe/mainTitle')
                }

                if (titleBnodeSorted['http://id.loc.gov/ontologies/bibframe/mainTitle'].length > 0 && titleBnodeSorted['http://id.loc.gov/ontologies/bibframe/mainTitle'][0] && titleBnodeSorted['http://id.loc.gov/ontologies/bibframe/mainTitle'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']){
                  title = titleBnodeSorted['http://id.loc.gov/ontologies/bibframe/mainTitle'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']
                  // there could be a non-latin title
                  if (titleBnodeSorted['http://id.loc.gov/ontologies/bibframe/mainTitle'].length > 1){
                    for (let temp of titleBnodeSorted['http://id.loc.gov/ontologies/bibframe/mainTitle']){
                      if (temp["@language"]){
                        let lang = temp["@language"]
                        if (!lang.includes("-latin") && lang != "en"){
                          titleNonLatin = temp["http://id.loc.gov/ontologies/bibframe/mainTitle"]
                        }
                      }
                    }
                  }
                }

              }
              if (titleUserValue && titleUserValue["@type"]=="http://id.loc.gov/ontologies/bibframe/Title" && titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum']){
                if (titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum'].length > 0 && titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum'][0] && titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum'][0]['http://id.loc.gov/ontologies/bflc/nonSortNum']){
                  titleNonSort = titleUserValue['http://id.loc.gov/ontologies/bflc/nonSortNum'][0]['http://id.loc.gov/ontologies/bflc/nonSortNum']
                }
              }
            }
          }


          if (pt && pt.propertyURI=='http://id.loc.gov/ontologies/bibframe/contribution'){
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
                          // console.log("agentagentagentagent",agent)
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

          if (pt && pt.propertyURI=='http://id.loc.gov/ontologies/bibframe/subject' && (firstSubject === null || secondSubject === null) && !pt.deleted){
            let subjectUserValue = pt.userValue
            if (subjectUserValue && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'] && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'].length > 0 && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0] && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label']){
              if (subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'] && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'].length>0 && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0] && subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']){
                if (firstSubject === null){
                  firstSubject = subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']
                } else {
                  secondSubject = subjectUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']
                }
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
            titleNonLatin: titleNonLatin,
            classNumber:classNumber,
            cutterNumber:cutterNumber,
            titleNonSort:titleNonSort,
            contributors:contributors,
            firstSubject:firstSubject,
            secondSubject:secondSubject,
            cutterGuid:cutterGuid,
            classGuid:classGuid
          }

        } else {
          // This is a LCC field, it shouldn't return `false`. False causes things to disappear
          // console.log("RETRUN FA:LSE 2")
          return {
            title: null,
            titleNonLatin: null,
            classNumber:null,
            cutterNumber:null,
            titleNonSort:null,
            contributors:[],
            firstSubject:null,
            secondSubject:null,
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
            titleNonLatin: titleNonLatin,
            classNumber:null,
            cutterNumber:null,
            titleNonSort:titleNonSort,
            contributors:contributors,
            firstSubject:firstSubject,
            secondSubject:secondSubject,
            cutterGuid:null,
            classGuid:null
          }


        } else if (pt && (pt.userValue && pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/expressionOf')){
          return {
            title: title,
            titleNonLatin: titleNonLatin,
            classNumber:null,
            cutterNumber:null,
            titleNonSort:null,
            contributors:contributors,
            firstSubject:null,
            secondSubject:null,
            cutterGuid:null,
            classGuid:null
          }
        }





      }


      //ClassificationLcc
      // console.log("RETRUN FA:LSE 3")
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
        let idItems = []

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
              if (rtId.indexOf(":Instance") > -1){
                for (let ptId of this.activeProfile.rt[rtId].ptOrder){
                  if (this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/identifiedBy'){
                      idItems.push(ptId)
                      if (this.activeProfile.rt[rtId].pt[ptId]["@guid"] == componentGuid){
                          target = ptId
                          targetType = "identifier"
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
        } else if (targetType == "identifier"){
            items = idItems
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
        let instRtId = null
        for (let rtId in this.activeProfile.rt){
          if (rtId.indexOf(":Work") > -1){
            for (let ptId of this.activeProfile.rt[rtId].ptOrder){
              if (
                    this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/subject' ||
                    this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/contribution' ||
                    this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/genreForm'
                 ){
                if (this.activeProfile.rt[rtId].pt[ptId]["@guid"] == componentGuid){
                        target = ptId
                        workRtId = rtId
                    }
              }
            }
          }

          if (rtId.indexOf(":Instance") > -1){
            for (let ptId of this.activeProfile.rt[rtId].ptOrder){
              if (
                    this.activeProfile.rt[rtId].pt[ptId].propertyURI == 'http://id.loc.gov/ontologies/bibframe/identifiedBy'
                 ){
                if (this.activeProfile.rt[rtId].pt[ptId]["@guid"] == componentGuid){
                        target = ptId
                        instRtId = rtId
                    }
              }
            }
          }
        }

        if (target){
          let targetRt = null
          if (workRtId){
            targetRt = workRtId
          } else if (instRtId){
            targetRt = instRtId
          }
          let currentPos = this.activeProfile.rt[targetRt].ptOrder.indexOf(target)
          let newPos
          if (dir == "up"){
              newPos = currentPos-1
          } else {
              newPos = currentPos+1
          }

          //swap the target with the element in the desired position
          //delete from current pos
           this.activeProfile.rt[targetRt].ptOrder.splice(currentPos, 1)
          //put in it's new position
           this.activeProfile.rt[targetRt].ptOrder.splice(newPos, 0, target)

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
      try {
        cleanCacheGuid(cacheGuid,  JSON.parse(JSON.stringify(pt.userValue)), guid)
      } catch {
        console.warn("Couldn't clear the CacheGuid")
      }
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
        const oldValues = Object.keys(pt.userValue[baseURI][0])
        const newValues = Object.keys(JSON.parse(JSON.stringify(userValue)))

        // don't overwrite existing values
        let matches = newValues.filter((nV) => !oldValues.includes(nV))

        Object.filter = (obj, predicate) =>
          Object.keys(obj)
                .filter( key => predicate(key) )
                .reduce( (res, key) => Object.assign(res, { [key]: obj[key] }), {} );

        let filtered = Object.filter(JSON.parse(JSON.stringify(userValue)), key => matches.includes(key))

        Object.assign(pt.userValue[baseURI][0], JSON.parse(JSON.stringify(filtered)))
      } else {
        //We're not in a nested component, so we can just set the userValue
        //   But don't overwrite an existing value
        for (let key in pt.userValue){
          if (!key.startsWith('@') && typeof pt.userValue[key][0] == 'object' && Object.keys(pt.userValue[key][0]).length == 0){
            pt.userValue = JSON.parse(JSON.stringify(userValue))
          }
        }
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

      if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/adminMetadata'){
          alert("Cannot create Admin Metadata")
          return false
        }

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

        // cleanout the newPt
        newPt.xmlSource = ""
        newPt.dataLoaded = false
        newPt.hasData = false
        delete newPt.deleted
        delete newPt.hideSubject
        delete newPt.hide

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

        // reset this, otherwise it can cause unwanted behavior in the XML
        this.activeProfile.rt[profile].pt[newPropertyId].deepHierarchy = false
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
    * @param {object} structure - structure of the component being copied
    * @param {string} profileName - name of the target profile
    * @param {string} predecessor - id of componenet comes before in the order
    * @return {array} the id and guid of the newPropertyId
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
          if (r == profileName){ // does this have any sideffects?!
            for (let idx in this.activeProfile.rt[r].ptOrder){
                let item = this.activeProfile.rt[r].ptOrder[idx]
                //TODO: fix order when there's a deleted element? Can't reproduce now
                if (item.includes(key)){
                  lastPosition = idx
                }
            }
            profile = profileName
          }

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

          // If it's deleted, flip it
          if (newPt.deleted){
            newPt.deleted = false
          }

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
        // For moving titles between work/instance, we want to use the last postion, otherwise
        //    should be after the predecessor
        if (predecessor == 'last'){
          this.activeProfile.rt[profile].ptOrder.splice(Number(lastPosition)+1, 0, newPropertyId)
        } else {
          this.activeProfile.rt[profile].ptOrder.splice(Number(propertyPosition)+1, 0, newPropertyId)
        }


        if (structure){
          this.insertDefaultValuesComponent(newPt['@guid'], structure)
        }

        // they changed something
        this.dataChanged()

        return [newPropertyId, newPt['@guid']]

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

        //adjust for items
        if (pt.parentId.includes(":Item")){
          for (let rt in this.activeProfile.rt){
              if (rt.includes(pt.parentId)){
                  pt.parentId = rt
                  break
              }
          }
        }

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

                // Cleanup for components that are uneditable
                if (Object.keys(this.activeProfile.rt[pt.parentId].pt[pt.id]).includes("xmlSource")){
                  delete this.activeProfile.rt[pt.parentId].pt[pt.id].xmlSource
                  this.activeProfile.rt[pt.parentId].pt[pt.id].hasData = false
                  this.activeProfile.rt[pt.parentId].pt[pt.id].deepHierarchy = false
                  this.activeProfile.rt[pt.parentId].pt[pt.id].dataLoaded = false
                  this.activeProfile.rt[pt.parentId].pt[pt.id].xmlHash = ""
                }
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

      // this is a debounce so it doesn't run on every key stroke
      window.clearTimeout(dataChangedTimeout)
      dataChangedTimeout = window.setTimeout(()=>{
        this.setMostCommonNonLatinScript()
        // also store it in the active profile
        this.activeProfile.mostCommonNonLatinScript = this.mostCommonNonLatinScript
        this.activeProfile.nonLatinScriptAgents = this.nonLatinScriptAgents
        // console.log("this.activeProfilethis.activeProfilethis.activeProfile",this.activeProfile)
        // this will trigger the preview rebuild
        this.dataChangedTimestamp = Date.now()
        // console.log("Data changed, this.activeProfile", this.activeProfile)
        // if they have auto save on then save it also
        if (usePreferenceStore().returnValue('--b-general-auto-save')){

          this.saveRecord()


        }

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
    * @param secondary {bool} whether this should an instance or a secondary instance
    * @param lccn {string} the lccn for the record
    * @return {void}
    */
    createInstance:  function(secondary=false, lccn=null){
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

        // If it's not mandatory, add it to ad hoc mode's emptyComponents list
        this.addToAdHocMode(newRtId, pt)
      }



      // setup the new instance's properies
      // profile.rt[newRdId].URI = 'http://id.loc.gov/resources/instances/'+ translator.toUUID(translator.new())

      if (lccn != ""){
        this.activeProfile.rt[newRtId].URI = "http://id.loc.gov/resources/instances/" + lccn
      } else {
        this.activeProfile.rt[newRtId].URI = utilsProfile.suggestURI(this.activeProfile,'bf:Instance', workUri)
      }
      this.activeProfile.rt[newRtId].instanceOf = workUri

      if (secondary && secondary != "item"){
        this.activeProfile.rt[newRtId]['@type'] = 'http://id.loc.gov/ontologies/bflc/SecondaryInstance'
      }

      this.activeProfile.rt[newRtId].deletable = true

      //Add to rtLookup, with a copy of an instance as the value
      this.rtLookup[newRtId] = this.rtLookup[instanceName]

      this.dataChanged()

    },

    /**
    * Create a new item for the record
    * @param instance {string} position of the rt for the instance that the item belongs to, when there is more than 1 instance
    * @param lccn {string} the lccn for the record
    *
    * @return {void}
    */
    createItem: async function(instance, lccn=null){
      // find the RT for the instance of this profile orginally
      // get the work rt

      let itemName
      let itemRt
      let workUri
      let instanceUri

      for (let rtId in this.activeProfile.rt){
          if (rtId.includes(":Work")){
            workUri = this.activeProfile.rt[rtId].URI
            // now find the corresponding item id
            for (let allRt in this.profiles){
              if (this.profiles[allRt].rtOrder.indexOf(rtId)>-1){
                if (this.profiles[allRt].rtOrder.filter(i => i.includes(":Item"))[0]){
                  itemName = this.profiles[allRt].rtOrder.filter(i => i.includes(":Item"))[0]
                  itemRt = JSON.parse(JSON.stringify(this.profiles[allRt].rt[itemName]))
                }
              }
            }
          }
          if (instance && rtId == instance){
            instanceUri = this.activeProfile.rt[rtId].URI
            break
          }else if (rtId.includes(":Instance")){
            instanceUri = this.activeProfile.rt[rtId].URI
          }
      }
      let itemCount = 0;
      // gather info to add it
      let items = Object.keys(this.activeProfile.rt).filter(i => i.includes(":Item"))
      if (items.length >= 1){
        itemCount = items.length
      }



      // console.log('itemCount',itemCount)
      let newRtId = itemName +'_'+itemCount
      itemRt.isNew = true
      this.activeProfile.rt[newRtId] = itemRt
      this.activeProfile.rtOrder.push(newRtId)

      // give it all new guids
      for (let pt in this.activeProfile.rt[newRtId].pt){
        this.activeProfile.rt[newRtId].pt[pt]['@guid'] = short.generate()
        // update the parentId
        this.activeProfile.rt[newRtId].pt[pt].parentId = this.activeProfile.rt[newRtId].pt[pt].parentId.replace(itemName, newRtId)
        this.activeProfile.rt[newRtId].pt[pt].parent = this.activeProfile.rt[newRtId].pt[pt].parent.replace(itemName, newRtId)

        // If it's not mandatory, add it to ad hoc mode's emptyComponents list
        this.addToAdHocMode(newRtId, pt)
      }

      // setup the new instance's properies
      // profile.rt[newRdId].URI = 'http://id.loc.gov/resources/instances/'+ translator.toUUID(translator.new())

      //this.activeProfile.rt[newRtId].URI = utilsProfile.suggestURI(this.activeProfile,'bf:Item', instanceUri)
      if (lccn && lccn != ""){
        this.activeProfile.rt[newRtId].URI = "http://id.loc.gov/resources/items/" + lccn
      } else {
        this.activeProfile.rt[newRtId].URI = utilsProfile.suggestURI(this.activeProfile,'bf:Item', instanceUri)
      }

      this.activeProfile.rt[newRtId].itemOf = instanceUri

      //Add to rtLookup, with a copy of an instance as the value
      this.rtLookup[newRtId] = this.rtLookup[itemName]

      this.dataChanged()

    },

    /**
     * Scans the entire active profile for paired literals where some have language tags and others don't.
     *
     * This method looks for instances where a property contains multiple literal values,
     * and at least one value has a language tag (@language) while at least one other value
     * does not.
     *
     * used for non-latin literals tool
     *
     * The method examines:
     * 1. All nested literals inside blank nodes
     * 2. Top-level literals in properties specified in the config's groupTopLeveLiterals
     *
     * @returns {Array<Object>} An array of objects containing:
     *   - ptObj: The property template object containing the literal
     *   - node: The node containing the untagged literal
     *   - propertyURI: The URI of the property
     *   - value: The literal value without a language tag
     */
    returnPairedLiteralsWithNoLang(){

        let results = []
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
                if (!k.startsWith('@') && obj[k].length>1){
                  func(obj,k,obj[k]);
                }
                process(obj[k], func);

              }
            }
          }

        }


        for (let rt of this.activeProfile.rtOrder){
          for (let pt of this.activeProfile.rt[rt].ptOrder){
            let ptObj = this.activeProfile.rt[rt].pt[pt]
            process(ptObj, function (obj,key,value) {
                // e.g.
                // only array > 1 make it here
                if (value.filter((v)=>{ return (v['@language'])}).length >= 1 && value.filter((v)=>{ return (v['@language'])}).length != value.length){
                  // only arrays with @language in them make it here and only if they do nt all have it

                  for (let n of value){
                    if (!n['@language']){
                      // some properties we don't care about
                      if (useConfigStore().excludeFromNonLatinLiteralCheck.indexOf(ptObj.propertyURI) !== -1){
                        continue
                      }
                      // sepcial for paired check
                      if (['http://id.loc.gov/ontologies/bibframe/expressionOf'].indexOf(ptObj.propertyURI) !== -1){
                        continue
                      }
                      results.push({
                        ptObj:ptObj,
                        node: n,
                        propertyURI: key,
                        value: n[key]
                      })
                    }
                  }
                }
            });
          }
        }
        return results
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

            if (ptObj && useConfigStore().excludeFromNonLatinLiteralCheck.indexOf(ptObj.propertyURI) >-1){
              continue
            }

          }


          process(ptObj, function (obj,key,value) {
              // e.g.



              if (!latinRegex.test(value)){
                nonLatinNodes.push({
                  ptObj:ptObj,
                  node: obj,
                  propertyURI: key,
                  value: value,
                  lang: obj['@language'],
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
      // console.log("nonLatin",nonLatin)
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
            let script = nl.node['@language'].split("-")[1]
            if (script){
              nonLatinMap[ptFound['@guid']].scripts.push(script)
            }
          }


        }
        // unique array
        nonLatinMap[ptFound['@guid']].scripts = [...new Set(nonLatinMap[ptFound['@guid']].scripts)];

      }
      // console.log("nonLatinMap",nonLatinMap)

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
          fieldValue = this.activeProfile.rt[rt].pt[pt] ? utilsProfile.returnGuidLocation(this.activeProfile.rt[rt].pt[pt].userValue,fieldGuid) : false
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

    copySelected: async function(deleteSelected=false){
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
          if (deleteSelected){
            this.deleteComponent(guid)
          }
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
        } catch(e) {
          console.error("Error in changeGuid: ", e)
        }
    },

    //parse the activeProfile and insert the copied data where appropriate
    /**
     *
     * @param {Object} newComponent - The new component
     * @param {String} sourceRt - RT it came from
     * @param {String} incomingTargetRt - RT it's going to
     */
    parseActiveInsert: async function(newComponent, sourceRt=null, incomingTargetRt=null){
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

      if (incomingTargetRt){
        targetRt = incomingTargetRt
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
                      let currentPos = order.indexOf(current.id)
                      let newPos = order.indexOf(newComponent.id)

                      // if (Object.keys(current.userValue).length == 1){
                      if (this.isEmptyComponent(current)){
                          current.userValue = newComponent.userValue
                          break
                      } else {
                          const guid = current["@guid"]
                          let structure = this.returnStructureByComponentGuid(guid)

                          let newPt
                          if ((sourceRt && sourceRt != targetRt) || (!sourceRt && !incomingTargetRt)){
                            newPt = await this.duplicateComponentGetId(guid, structure, rt, "last")
                          } else {
                            if (newPos < 0){
                              newPt = await this.duplicateComponentGetId(guid, structure, rt, current.id)
                            } else {
                              newPt = await this.duplicateComponentGetId(guid, structure, rt, newComponent.id)
                            }
                          }

                          newPt = newPt[0]

                          profile["rt"][rt]["pt"][newPt].userValue = newComponent.userValue
                          profile["rt"][rt]["pt"][newPt].userModified = true
                          break
                      }
                  }
              }
          }
      }
    },

    pasteSelected: async function(sourceRt=null){

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
        if (!sourceRt){
          sourceRt = this.returnRtByGUID(dataJson['@guid'])
        }
        this.parseActiveInsert(JSON.parse(JSON.stringify(dataJson)), sourceRt)
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
                    if (userValue[key].length == 0){ return }
                    // this makes sure that the propertiesPanel will have the correct symbol when the incoming data
                    //  has an populate electronicLocator
                    if (component.propertyURI != "http://id.loc.gov/ontologies/bibframe/electronicLocator"){
                        result = Object.keys(userValue[key][0]).every((childKey) => childKey.startsWith("@"))
                    } else {
                        result = !Object.keys(userValue[key][0]).some((childKey) => childKey.startsWith("@id"))
                    }
                  } catch(err) {
                      console.debug("error: Checking if component is empty, ", err)
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

      // if (literals.length == 0){
      //   literals = this.returnAllNonLatinLiterals(true)
      // }

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
            if (this.activeProfile.rt[rt].pt[pt].valueConstraint && this.activeProfile.rt[rt].pt[pt].valueConstraint.useValuesFrom && this.activeProfile.rt[rt].pt[pt].valueConstraint.useValuesFrom.length>0){
              return this.activeProfile.rt[rt].pt[pt].valueConstraint.useValuesFrom[0]
            }
          }


        }
      }


      // we didn't find it see if it has instead a templateref value
      for (let rt of this.activeProfile.rtOrder){
        for (let pt of this.activeProfile.rt[rt].ptOrder){
          let purl = utilsParse.namespaceUri(this.activeProfile.rt[rt].pt[pt].propertyURI)
          if (purl == property){
            if (this.activeProfile.rt[rt].pt[pt].valueConstraint && this.activeProfile.rt[rt].pt[pt].valueConstraint.valueTemplateRefs && this.activeProfile.rt[rt].pt[pt].valueConstraint.valueTemplateRefs.length>0){
              let lookForTemplate = this.activeProfile.rt[rt].pt[pt].valueConstraint.valueTemplateRefs[0]
              for (let pName in this.profiles){
                if (this.profiles[pName].rtOrder.includes(lookForTemplate)){
                  for (let p of this.profiles[pName].rt[lookForTemplate].ptOrder){
                    let purl2 = utilsParse.namespaceUri(this.profiles[pName].rt[lookForTemplate].pt[p].propertyURI)
                    if (purl2 == property || purl2 == 'owl:sameAs'){
                      if (this.profiles[pName].rt[lookForTemplate].pt[p].valueConstraint && this.profiles[pName].rt[lookForTemplate].pt[p].valueConstraint.useValuesFrom && this.profiles[pName].rt[lookForTemplate].pt[p].valueConstraint.useValuesFrom.length>0){
                        return this.profiles[pName].rt[lookForTemplate].pt[p].valueConstraint.useValuesFrom[0]
                      }
                    }
                  }
                }
              }
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
    * @param {string} langObj - {uri:"",label:""}
    * @return {String}
    */
    async buildPostHubStub(hubCreatorObj,title,variant,variantLanguage,langObj,catCode){

      // console.log("hubCreatorObj",hubCreatorObj)
      let xml = await utilsExport.createHubStubXML(hubCreatorObj,title,variant,variantLanguage,langObj,catCode)

      console.log(xml)
      // let eid = 'e' + decimalTranslator.new()
      let eid = 'e' + Date.now().toString()
      // eid = eid.substring(0,8)

      // pass a fake activeprofile with id == Hub to trigger hub protocols
      let pubResuts
      try{
        pubResuts = await utilsNetwork.publish(xml, eid, {id: 'Hub'})

      }catch (error){
        console.log(error)
        alert("There was an error creating your Hub. Please report this issue.")
      }

      // // to simulate a post
      // alert("Fake Hub Requesting")
      // pubResuts = {
      //     "name": "bc331009-aa60-48b3-ba17-865fc7389f23",
      //     "publish": {
      //         "status": "published"
      //     },
      //     "postLocation": "http://preprod-8299.id.loc.gov/resources/hubs/bf110051-532b-c50c-5d5c-baa4ea6d2044"
      // }




      return pubResuts



    },

    /**
     * Look for the Statement of Responsibility in the record to add to the 670 $b
     *
     */
    nacoStubReturnSoR(){
      for (let rt of this.activeProfile.rtOrder){
        if (rt.indexOf(":Instance")>-1){
          for (let pt of this.activeProfile.rt[rt].ptOrder){
            pt = this.activeProfile.rt[rt].pt[pt]
            if (pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/responsibilityStatement"){
              if (pt.userValue
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/responsibilityStatement']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/responsibilityStatement'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/responsibilityStatement'][0]['http://id.loc.gov/ontologies/bibframe/responsibilityStatement']
                ){
                let sor = pt.userValue['http://id.loc.gov/ontologies/bibframe/responsibilityStatement'][0]['http://id.loc.gov/ontologies/bibframe/responsibilityStatement']

                if (sor.endsWith(".")) {
                  sor = sor.slice(0, -1);
                }

                return sor
              }
            }
          }
        }
      }
      return false
    },

    /**
     * Retrieves the main title from the NACO stub work profile by traversing the resource template structure.
     * Looks for a property with URI "http://id.loc.gov/ontologies/bibframe/title" and extracts its main title value.
     *
     * @returns {(string|false)} The main title string if found, false otherwise
     * @access public
     * @requires activeProfile - Profile must be loaded with valid RT structure
     */
    nacoStubReturnMainTitle(){

      for (let rt of this.activeProfile.rtOrder){
        if (rt.indexOf(":Work")>-1){
          for (let pt of this.activeProfile.rt[rt].ptOrder){
            pt = this.activeProfile.rt[rt].pt[pt]
            if (pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/title"){
              if (pt.userValue
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/title']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/title'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']
                )
                {

                  // look for the one that is set as latin first, if we can find it
                  for (let aTitle of pt.userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']){
                    if (aTitle['@language'] && aTitle['@language'].toLowerCase().indexOf('latn')>-1){
                      return aTitle['http://id.loc.gov/ontologies/bibframe/mainTitle']
                    }
                  }

                  // otherwise look for the first one that doesn't have a language tag
                  for (let aTitle of pt.userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']){
                    if (!aTitle['@language']){
                      return aTitle['http://id.loc.gov/ontologies/bibframe/mainTitle']
                    }
                  }

                  // if we can't find one without a language tag, just return the first one
                  return pt.userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']
                }
            }
          }
        }
      }
      return false
    },

    /**
     * Retrieves the Library of Congress Control Number (LCCN) from the NACO stub profile.
     * Searches through Instance resource templates for bibframe:identifiedBy property
     * with type bibframe:Lccn.
     *
     * @returns {(string|false)} The LCCN string if found, false otherwise
     * @access public
     * @requires activeProfile - Profile must be loaded with valid RT structure
     */
    nacoStubReturnLCCN(){

      for (let rt of this.activeProfile.rtOrder){
        if (rt.indexOf(":Instance")>-1){
          for (let pt of this.activeProfile.rt[rt].ptOrder){
            pt = this.activeProfile.rt[rt].pt[pt]
            if (pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/identifiedBy"){
              if (pt.userValue
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]['@type']
                  &&  pt.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]['@type'] == "http://id.loc.gov/ontologies/bibframe/Lccn"
                )
                return pt.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'].trim()
            }
          }
        }
      }
      return false
    },
    /**
     * Retrieves the date from the profile by searching multiple date fields.
     * Searches in order:
     * 1. Instance provision activity simple date
     * 2. Instance provision activity EDTF date
     * 3. Work origin date
     *
     * @returns {(string|false)} The date string if found in any of the searched fields, false otherwise
     * @access public
     * @requires activeProfile - Profile must be loaded with valid RT structure
     */
    nacoStubReturnDate(){

      let provisionActivityEDTFDate = null
      let provisionActivitySimpleDate = null
      let originDate = null

      for (let rt of this.activeProfile.rtOrder){
        // look in the instance first for provision activity
        if (rt.indexOf(":Instance")>-1){
          for (let pt of this.activeProfile.rt[rt].ptOrder){
            pt = this.activeProfile.rt[rt].pt[pt]
            if (pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/provisionActivity"){
              if (pt.userValue
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]['http://id.loc.gov/ontologies/bflc/simpleDate']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]['http://id.loc.gov/ontologies/bflc/simpleDate'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]['http://id.loc.gov/ontologies/bflc/simpleDate'][0]['http://id.loc.gov/ontologies/bflc/simpleDate']
                ){
                  provisionActivitySimpleDate = pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]['http://id.loc.gov/ontologies/bflc/simpleDate'][0]['http://id.loc.gov/ontologies/bflc/simpleDate']
                }
            }
            if (pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/provisionActivity"){
              if (pt.userValue
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]['http://id.loc.gov/ontologies/bibframe/date']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]['http://id.loc.gov/ontologies/bibframe/date'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]['http://id.loc.gov/ontologies/bibframe/date'][0]['http://id.loc.gov/ontologies/bibframe/date']
                ){
                  provisionActivityEDTFDate = pt.userValue['http://id.loc.gov/ontologies/bibframe/provisionActivity'][0]['http://id.loc.gov/ontologies/bibframe/date'][0]['http://id.loc.gov/ontologies/bibframe/date']
                }
            }

          }
        }
        if (rt.indexOf(":Work")>-1){
          for (let pt of this.activeProfile.rt[rt].ptOrder){
            pt = this.activeProfile.rt[rt].pt[pt]
            if (pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/originDate"){
              if (pt.userValue
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/originDate']
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/originDate'][0]
                  && pt.userValue['http://id.loc.gov/ontologies/bibframe/originDate'][0]['http://id.loc.gov/ontologies/bibframe/originDate']
                ){
                  originDate = pt.userValue['http://id.loc.gov/ontologies/bibframe/originDate'][0]['http://id.loc.gov/ontologies/bibframe/originDate']
                }
            }
          }

        }
      }

      let useDate = false
      if (provisionActivitySimpleDate){
        useDate = provisionActivitySimpleDate
      }else if(provisionActivityEDTFDate){
        useDate = provisionActivityEDTFDate
      }else if (originDate){
        useDate = originDate
      }else{
        useDate = false
      }
      if (useDate){
        useDate = useDate.replace(/\[/g, '').replace(/\]/g, '') // remove brackets if they exist
        useDate = useDate.replace(/{/g, '').replace(/}/g, '') // remove brackets if they exist

        useDate = useDate.trim()
      }



      return useDate

    },





    /**
     * Retrieves the Work URI from the NACO stub profile by searching through resource templates.
     * Returns the first URI found in a resource template containing ":Work" in its name.
     *
     * @returns {(string|false)} The Work URI if found, false otherwise
     * @access public
     * @requires activeProfile - Profile must be loaded with valid RT structure
     */
    nacoStubReturnWorkURI(){
      for (let rt of this.activeProfile.rtOrder){
        if (rt.indexOf(":Work")>-1){
          if (this.activeProfile.rt[rt].URI){
            return this.activeProfile.rt[rt].URI
          }
        }
      }
      return false
    },
    /**
     * Retrieves the Work Instance from the NACO stub profile by searching through resource templates.
     * Returns the first URI found in a resource template containing ":Work" in its name.
     *
     * @returns {(string|false)} The Work URI if found, false otherwise
     * @access public
     * @requires activeProfile - Profile must be loaded with valid RT structure
     */
    nacoStubReturnInstanceURI(){
      for (let rt of this.activeProfile.rtOrder){
        if (rt.indexOf(":Instance")>-1){
          if (this.activeProfile.rt[rt].URI){
            return this.activeProfile.rt[rt].URI
          }
        }
      }
      return false
    },

    nacoStubReturnPopulatedValue(guid){
      let pt = utilsProfile.returnPt(this.activeProfile,guid)
      let URI = null
      let marcKey = null

      if (pt &&
          pt.userValue &&
          pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'] &&
          pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0] &&
          pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['http://id.loc.gov/ontologies/bibframe/agent'] &&
          pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['http://id.loc.gov/ontologies/bibframe/agent'][0]){

            let agent = pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['http://id.loc.gov/ontologies/bibframe/agent'][0]
            if (agent && agent['@id']){
              URI = agent['@id']
            }
            if (agent && agent['http://id.loc.gov/ontologies/bflc/marcKey'] &&
                agent['http://id.loc.gov/ontologies/bflc/marcKey'][0] &&
                agent['http://id.loc.gov/ontologies/bflc/marcKey'][0]['http://id.loc.gov/ontologies/bflc/marcKey']
              ){
                marcKey = agent['http://id.loc.gov/ontologies/bflc/marcKey'][0]['http://id.loc.gov/ontologies/bflc/marcKey']
            }

          }

      if (pt &&
          pt.userValue &&
          pt.userValue['http://id.loc.gov/ontologies/bibframe/subject'] &&
          pt.userValue['http://id.loc.gov/ontologies/bibframe/subject'][0]){

            let agent = pt.userValue['http://id.loc.gov/ontologies/bibframe/subject'][0]
            if (agent && agent['@id']){
              URI = agent['@id']
            }
            if (agent && agent['http://id.loc.gov/ontologies/bflc/marcKey'] &&
                agent['http://id.loc.gov/ontologies/bflc/marcKey'][0] &&
                agent['http://id.loc.gov/ontologies/bflc/marcKey'][0]['http://id.loc.gov/ontologies/bflc/marcKey']
              ){
                marcKey = agent['http://id.loc.gov/ontologies/bflc/marcKey'][0]['http://id.loc.gov/ontologies/bflc/marcKey']
            }

          }

      return {
        URI: URI,
        marcKey: marcKey,
      }

    },

    nacoStubReturn245(guid){
      let subfieldA = ""
      let subfieldB = ""
      let subfieldC = ""

      for (let rt of this.activeProfile.rtOrder){
        if (rt.indexOf(":Instance")>-1){
          for (let pt of this.activeProfile.rt[rt].ptOrder){
            pt = this.activeProfile.rt[rt].pt[pt]
            if (pt.propertyLabel == "Title information"){
              let userValue = pt.userValue
              if (
                  userValue['http://id.loc.gov/ontologies/bibframe/title'] &&
                  userValue['http://id.loc.gov/ontologies/bibframe/title'][0] &&
                  userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']
                ){
                  let titleComp = userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/mainTitle']
                  subfieldA = titleComp[0]["http://id.loc.gov/ontologies/bibframe/mainTitle"]
              }

              if (
                  userValue['http://id.loc.gov/ontologies/bibframe/title'] &&
                  userValue['http://id.loc.gov/ontologies/bibframe/title'][0] &&
                  userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/subtitle']
                ){
                  let titleComp = userValue['http://id.loc.gov/ontologies/bibframe/title'][0]['http://id.loc.gov/ontologies/bibframe/subtitle']
                  subfieldB = titleComp[0]["http://id.loc.gov/ontologies/bibframe/subtitle"]
              }
            }
          }
        }
      }

      subfieldC = this.nacoStubReturnSoR()

      return {
        subA: subfieldA,
        subB: subfieldB,
        subC: subfieldC
      }

    },



    /**
      * Builds and posts a NACO Stub
      *
      * @param {object} hubCreatorObj - obj with creator label, uri,marcKey
      * @param {string} title - title string
      * @param {string} langObj - {uri:"",label:""}
      * @return {String}
      */
    async buildNacoStub(oneXX,fourXX,mainTitle,workURI, mainTitleDate, mainTitleLccn, mainTitleNote,zero46,add667,extraMarcStatements,useAdvancedMode){
      console.log(oneXX,fourXX,mainTitle,workURI,zero46)
      let lccn = await utilsNetwork.nacoLccn()
      let NARData = await utilsExport.createNacoStubXML(oneXX,fourXX,mainTitle,lccn,workURI, mainTitleDate, mainTitleLccn, mainTitleNote,zero46,add667,extraMarcStatements,useAdvancedMode)
      NARData.lccn = lccn
      return NARData
    },

    async postNacoStub(xml,lccn){

      let pubResuts

      try{
        pubResuts = await utilsNetwork.publishNar(xml)
      }catch (error){
        console.log(error)
        alert("There was an error creating your NAR. Please report this issue.")
      }

      // pubResuts = {'postLocation': 'https://id.loc.gov/authorities/names/n83122656', status: 'published'}
      console.log('pubResuts')
      console.log(pubResuts)
      return {
        xml: xml,
        pubResuts: pubResuts,
        lccn: lccn
      }

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
      let newDDC

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
            // if (type == "http://id.loc.gov/ontologies/bibframe/ClassificationDdc"){
              hasEmptyDDC = true
              ddcComponent = classification
              newDDC = [target.id]
            }
          }
        }
      }

      // if no empty ddc, create one
      if (!hasEmptyDDC){
        newDDC = await this.duplicateComponentGetId(this.returnStructureByComponentGuid(guid)['@guid'], structure, "lc:RT:bf2:Monograph:Work", lastClassifiction)
        ddcComponent = activeProfile.rt["lc:RT:bf2:Monograph:Work"].pt[newDDC[0]]
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
      const newComponent = activeProfile.rt["lc:RT:bf2:Monograph:Work"].pt[newDDC[0]]

      // look up one level & use the appropriate structure
      let parentStructure = this.returnStructureByComponentGuid(newComponent['@guid'])
      if (parentStructure.valueConstraint && parentStructure.valueConstraint.valueTemplateRefs && parentStructure.valueConstraint.valueTemplateRefs.length>0){
        for (let vRt of parentStructure.valueConstraint.valueTemplateRefs){
          if (this.rtLookup[vRt] && vRt == "lc:RT:bf2:DDC"){
            for (let pt of this.rtLookup[vRt].propertyTemplates){
              if (pt.valueConstraint.defaults && pt.valueConstraint.defaults.length > 0){
                this.insertDefaultValuesComponent(newComponent['@guid'], pt)
              }
            }
          }
        }
      }
    },

    /** Add a component to the library
     *
     * @param {string} guid - The GUID of the component
     */
    addToComponentLibrary: async function(guid){
      let structure = JSON.parse(JSON.stringify(this.returnStructureByComponentGuid(guid)))

      // clean up component property values for storage
      structure['@guid'] = null
      // does the id end with a number, if so it is a duplicated component, or one of multiple, so remove that value
      let lastIdPart = structure['id'].split("_").slice(-1)[0]
      if (lastIdPart >= '0' && lastIdPart <= '9') {
        // it is a number
        let newId = structure['id'].split("_")
        newId=newId.slice(0, -1)
        newId=newId.join("_")
        structure['id'] = newId
      }

      let label = prompt("What to call this component?", structure.propertyLabel)
      if (!label){
        return false
      }

      if (structure['parentId'].includes(":Item")){
        let key = structure['parentId']
        if (key && key.includes(":Item")){
          if (key.includes("-") || key.includes("_")){
              let idx
              idx = key.indexOf("_")
              if (idx < 0){
                  idx = key.indexOf("-")
              }
              key = key.slice(0, idx)
          }
        }
        structure['parentId'] = key
      }


      if (!this.componentLibrary.profiles[structure['parentId']]){
        this.componentLibrary.profiles[structure['parentId']] = {
          groups:[]
        }
      }

      this.componentLibrary.profiles[structure['parentId']].groups.push({
        id: short.generate(),
        groupId: null,
        position: this.componentLibrary.profiles[structure['parentId']].groups.length,
        structure: structure,
        label: label
      })

      this.saveComponentLibrary()

    },

    /** Writes the component library to the local storage
     *
     */
    saveComponentLibrary(){
      window.localStorage.setItem('marva-componentLibrary',JSON.stringify(this.componentLibrary))
    },

    /** Changes the group property in the storged component library data
     *
     */
    changeGroupComponentLibrary(id,groupId){

      for (let key in this.componentLibrary.profiles){
        for (let group of this.componentLibrary.profiles[key].groups){
          if (group.id == id){
            group.groupId = groupId
            this.saveComponentLibrary()
            return true
          }
        }

      }

    },

    /** Changes the group property in the storged component library data
     *
     */
    addFromComponentLibrary(id){
      let defaultLibrary = null
      if (usePreferenceStore().returnValue('--b-edit-main-splitpane-properties-show-defaults')){
        defaultLibrary = defaultComponents.DefaultComponentLibrary.profiles
        this.componentLibrary.profiles = Object.assign({}, this.componentLibrary.profiles, defaultLibrary)
      }
      for (let key in this.componentLibrary.profiles){
        for (let group of this.componentLibrary.profiles[key].groups){
          if (group.id == id){

            // we are adding a sigle one here so groups are individual (group of 1) in this case
            console.log("Adding thisone",group)
            let component = JSON.parse(JSON.stringify(group.structure))

            // For item's the parent ID won't match anything in the RTs because we've stripped it down
            if (component.parentId.includes(":Item")){
                for (let rt in this.activeProfile.rt){
                    if (rt.includes(component.parentId)){
                        component.parentId = rt
                        break
                    }
                }
            }

            // see if we can find its counter part in the acutal profile
            if (this.activeProfile.rt[component.parentId]){

              // see if we can find the component
              let ptObjFound = false

              // if it is an admin metadata do something special
              if (component.propertyURI == "http://id.loc.gov/ontologies/bibframe/adminMetadata"){
                for (let pt in this.activeProfile.rt[component.parentId].pt){
                  if (this.activeProfile.rt[component.parentId].pt[pt].propertyURI == component.propertyURI && this.activeProfile.rt[component.parentId].pt[pt].adminMetadataType && this.activeProfile.rt[component.parentId].pt[pt].adminMetadataType == 'primary' ){
                    ptObjFound = this.activeProfile.rt[component.parentId].pt[pt]
                  }
                }

                // we are going to perform a quick replace here, saving the local identifier and local 040 note from the
                let localId=null
                let local040=null
                if (ptObjFound &&
                    ptObjFound.userValue &&
                    ptObjFound.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"] &&
                    ptObjFound.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0] &&
                    ptObjFound.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/identifiedBy"]){
                      for (let lId of ptObjFound.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/identifiedBy"] ){
                        if (lId['@type'] == "http://id.loc.gov/ontologies/bibframe/Local"){
                          localId = JSON.parse(JSON.stringify(lId))
                          break
                        }
                      }
                    }

                if (ptObjFound &&
                    ptObjFound.userValue &&
                    ptObjFound.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"] &&
                    ptObjFound.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0] &&
                    ptObjFound.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/note"]){
                      for (let n of ptObjFound.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/note"] ){
                        if (JSON.stringify(n).indexOf("040") > -1){
                          local040 = JSON.parse(JSON.stringify(n))
                          break
                        }
                      }
                    }
                    console.log("localId",localId)
                    console.log("local040",local040)

                // okay now do the same on the component we are about to use, but replace the two values with the ones we just extracted
                if (component &&
                  component.userValue &&
                  component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"] &&
                  component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0] &&
                  component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/identifiedBy"]){
                    let to_replace_with = []
                    if (localId){ to_replace_with.push(JSON.parse(JSON.stringify(localId)))}

                    for (let lId of component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/identifiedBy"] ){
                      if (lId['@type'] == "http://id.loc.gov/ontologies/bibframe/Local"){
                        // this is the localid from the saved component, we don't want it so don't do anything
                      }else{
                        // this isn't one, dunno what it is? but add it to the new one
                        to_replace_with.push(lId)
                      }
                    }

                    // replace it with what we have, if it did not find the thing then it will be [] and blank in the new data otherwise it will be replaced
                    component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/identifiedBy"] = to_replace_with

                }


                if (component &&
                  component.userValue &&
                  component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"] &&
                  component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0] &&
                  component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/note"]){
                    let to_replace_with = []
                    if (local040){ to_replace_with.push(JSON.parse(JSON.stringify(local040)))}

                    for (let n of component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/note"] ){
                      if (JSON.stringify(n).indexOf("040") > -1){
                        // this is the local040 from the saved component, we don't want it so don't do anything
                      }else{
                        // this isn't one, dunno what it is? but add it to the new one
                        to_replace_with.push(n)
                      }
                    }
                    // replace it with what we have, if it did not find the thing then it will be [] and blank in the new data otherwise it will be replaced
                    component.userValue["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["http://id.loc.gov/ontologies/bibframe/note"] = to_replace_with

                }


                // we are going to zero out the userValue of the found AdminMetadata here so the process below replaces it with the new one and not add it as another
                ptObjFound.userValue = {'@root': "http://id.loc.gov/ontologies/bibframe/adminMetadata"}


              }else{
                // loop till we find the first one
                for (let pt in this.activeProfile.rt[component.parentId].pt){
                  if (this.activeProfile.rt[component.parentId].pt[pt].id == component.id){
                    ptObjFound = this.activeProfile.rt[component.parentId].pt[pt]
                  }
                }


              }


              if (ptObjFound != false){
                console.log("Found orignal here:",ptObjFound)
                if (ptObjFound.hashCode == component.hashCode){

                  // if the component we found in the system already has data in it then we are going to add a new component
                  // if it doesn't then just overwrite it completely with the one from the library

                  // regardless we need to set the id
                  component['@guid'] = short.generate()

                  // we also need to create new @guid valuse inside the userValue in case they add multiple versions of the same
                  component = this.componentLibraryUpdateUserValueGuid(component)

                  if (Object.keys(ptObjFound.userValue).length <= 1 || ptObjFound.id.includes("id_loc_gov_ontologies_bibframe_adminmetadata")){
                    // if this is 1 or 0 then the userdata is empty, with just a @root property
                    // there is no user data added yet
                    // we can just overwrite whats there with our component
                    // we don't need to adjust the order, its 1-for-1
                    // find it again and overwrite

                    // Admin metadata should overwrite the existing values, otherwise we create a new Admin field, which we shouldn't do
                    if (!ptObjFound.id.includes("id_loc_gov_ontologies_bibframe_adminmetadata")){
                      for (let pt in this.activeProfile.rt[component.parentId].pt){
                        if (this.activeProfile.rt[component.parentId].pt[pt].id == component.id){
                          this.activeProfile.rt[component.parentId].pt[pt] = JSON.parse(JSON.stringify(component))
                          this.dataChanged()
                          return [component.parentId,pt]
                        }
                      }
                    } else {
                      // Need an exception for Admin to ensure we're not making changes to a different admin field
                      for (let pt in this.activeProfile.rt[component.parentId].pt){
                        if (this.activeProfile.rt[component.parentId].pt[pt].id == ptObjFound.id){
                          component.id = ptObjFound.id
                          this.activeProfile.rt[component.parentId].pt[pt] = JSON.parse(JSON.stringify(component))
                          this.dataChanged()
                          return [component.parentId,pt]
                        }
                      }
                    }


                  }else{
                    // we can't replace the one that is there, already has data, so construct a new place for it

                    // first find out how many of these components there are
                    let total_components = 0
                    for (let pt in this.activeProfile.rt[component.parentId].pt){
                      if (this.activeProfile.rt[component.parentId].pt[pt].id.startsWith(component.id)){
                        total_components++
                      }
                    }
                    let newId = component.id + "_" + (total_components+1)
                    let oldId = JSON.parse(JSON.stringify(component.id))

                    // rename it
                    component.id = newId
                    // add it to the pt
                    this.activeProfile.rt[component.parentId].pt[newId] = JSON.parse(JSON.stringify(component))
                    // add it to the order
                    // find the position of the last one
                    let insertAt = 0
                    for (const [i, p] of this.activeProfile.rt[component.parentId].ptOrder.entries()){
                      if (p.startsWith(oldId)){
                        insertAt = i
                      }
                    }
                    this.activeProfile.rt[component.parentId].ptOrder.splice(insertAt+1, 0, newId);
                    this.dataChanged()
                    return [component.parentId,newId]
                  }



                }else{

                  alert("ERROR: There seems to be mismatch between the component you are trying to add and the components in the profile. Please delete this component from your library and recreate it")

                }


              }else{
                alert("ERRROR: Could not find the orginal profile template this component was built from.",component.id)
              }


            }else{
              alert("ERRROR: Trying to add a component but could not find the profile:", component.parentId)
            }

          }
        }

      }

    },


    componentLibraryUpdateUserValueGuid(component){
      function traverse(target) {
        for (const key in target) {
          if (typeof target[key] === 'object') {
            traverse(target[key]);
          } else if (key === '@guid'){
            target[key] = short.generate()
          } else {
            // nothing
          }
        }
      }
      traverse(component.userValue);

      return component
    },

    /** Removes a component from the library
     *
     */
    delComponentLibrary(id){
      for (let key in this.componentLibrary.profiles){
        this.componentLibrary.profiles[key].groups = this.componentLibrary.profiles[key].groups.filter((c) => { return (c.id != id) })
      }
      this.saveComponentLibrary()
    },

    /** Renames a component's label in the library
     *
     */
    renameComponentLibrary(id,newLabel){

      for (let key in this.componentLibrary.profiles){
        for (let group of this.componentLibrary.profiles[key].groups){
          if (group.id == id){
            group.label = newLabel
            this.saveComponentLibrary()
            return true
          }
        }
      }
    },

    /**
    * Set or unset the default nature of the component
    */
    makeComponentDefault(id){
      for (let key in this.componentLibrary.profiles){
        for (let group of this.componentLibrary.profiles[key].groups){
          if (group.id == id){
            if (Object.keys(group).includes("useDefault")){
              group.useDefault = !group.useDefault
            } else {
              group["useDefault"] = true
            }

            this.saveComponentLibrary()
            return true
          }
        }
      }
    },

    /**
     *
     * @param {string} profileName - name of the profile the element belongs to
     * @param {string} element - the id of the element that will be added
     */
    addToAdHocMode: function(profileName, element){
      let target = this.activeProfile.rt[profileName].pt[element]
      let empty = this.isEmptyComponent(this.activeProfile.rt[profileName].pt[element])
      if (empty && target.mandatory != 'true'){
        if (Object.keys(this.emptyComponents).includes(profileName)){
          this.emptyComponents[profileName].push(element)
        } else {
          this.emptyComponents[profileName] = [element]
        }
      } else {
        console.warn(element, " is mandatory or populated. Didn't hide it.")
      }
    },

    /**
     *
     * @param {string} profileName - name of the profile the element belongs to
     * @param {string} element - the id of the element that will be removed
     */
    removeFromAdHocMode: function(profileName, element){
      if (this.emptyComponents[profileName].includes(element)){
        let idx = this.emptyComponents[profileName].indexOf(element)
        this.emptyComponents[profileName].splice(idx, 1)
        return true
      } else {
        console.warn("Couldn't find ", element, " in Ad Hoc mode: ", this.emptyComponents)
        return false
      }
    },

    /**
     *
     * @param {string} guid - guid of the component
     * @param {string} error - the error message
     */
    addCammModeError: function(guid, error){

      if (!this.cammModeErrors[guid]){
        this.cammModeErrors[guid]=[]
      }

      this.cammModeErrors[guid].push(error)

    },
    /**
     *
     * @param {string} guid - guid of the component
     */
    clearCammModeError: function(guid){
      if (this.cammModeErrors[guid]){
        delete this.cammModeErrors[guid]
      }
    },

    /**
     * Returns the marc label or auth label of the entitiy
     *
     * @param {object} guid - the guid of the component
     */
    async returnCammComplexLabel(guid,complexValue){

      console.log("guidguidguidguidguidguid",guid)
      let pt = utilsProfile.returnPt(this.activeProfile,guid)

      // just look for the expected place to fidn the MARC key first

      if (pt && pt.userValue && pt.userValue[pt.propertyURI] && pt.userValue[pt.propertyURI][0]){
        for (let key of Object.keys(pt.userValue[pt.propertyURI][0])){
          let x = pt.userValue[pt.propertyURI][0][key]
          if (x && x[0] && x[0]['http://id.loc.gov/ontologies/bflc/marcKey']){
            if (x[0]['http://id.loc.gov/ontologies/bflc/marcKey']){
              let marcKey = x[0]['http://id.loc.gov/ontologies/bflc/marcKey']
              if (marcKey[0] && marcKey[0]['http://id.loc.gov/ontologies/bflc/marcKey']){
                marcKey=marcKey[0]['http://id.loc.gov/ontologies/bflc/marcKey']
              }
              if (marcKey.indexOf("$")>-1){
                marcKey = marcKey.slice(marcKey.indexOf("$"))
              }
              console.log("marcKeymarcKeymarcKeymarcKey",marcKey)
              // return marcKey
            }
          }
        }
      }

      if (complexValue && complexValue.URI){
        console.log("complexValuecomplexValuecomplexValuecomplexValue",complexValue)
        // ask the internet
        if (complexValue.URI.indexOf("id.loc.gov")>-1){

          let marcKey = await utilsNetwork.returnMARCKey(complexValue.URI + '.madsrdf_raw.jsonld')
          if (marcKey && marcKey['marcKey']){
            marcKey = marcKey['marcKey']
            if (marcKey.indexOf("$")>-1){
              marcKey = marcKey.slice(marcKey.indexOf("$"))
            }
            return marcKey
          }



        }


      }

      console.log(complexValue)


      return "Errr"




    },

    /**
     * Sorts an array of objects based on whether a specified key's value matches the latinRegex pattern.
     * It sorts the array with the latin objects first, followed by the non-Latin objects.
     *
     * @param {Object[]} arr - Array of objects to sort
     * @param {string} key - Object key whose value should be tested against latinRegex
     * @return {Object[]} - Sorted array with non-Latin objects first
     */
    sortObjectsByLatinMatch(arr, key) {

      // let toSort = JSON.parse(JSON.stringify(arr))
      // if they have language tags in them then we know how to sort
      // console.log(JSON.stringify(arr,null,2))
      // console.log(arr.filter((v)=>{ return (v['@language'])}).length)
      // let sortedArry = []
      if (arr.filter((v)=>{ return (v['@language'])}).length >= 1){
      //   // sort by language tags
        arr.sort((a, b) => {
          let aLang = a['@language'] || '';
          let bLang = b['@language'] || '';


          aLang = aLang.toLowerCase()
          bLang = bLang.toLowerCase()
          let aIsLatin = true
          let bIsLatin = true

          if (aLang.length > 0 && aLang.indexOf("-latn") == -1){
            aIsLatin = false
          }else if (aLang.length > 0 && aLang.indexOf("-latn") > -1){
            aIsLatin = true
          }else if (aLang.length == 0){
            aIsLatin = true
          }

          if (bLang.length > 0 && bLang.indexOf("-latn") == -1){
            bIsLatin = false
          }else if (bLang.length > 0 && bLang.indexOf("-latn") > -1){
            bIsLatin = true
          }else if (bLang.length == 0){
            bIsLatin = true
          }

          if (!bIsLatin && aIsLatin) return -1;

          if (bIsLatin && !aIsLatin) return 1;
          return 0;
        });



      }else{

        // no tags, try the regex
        arr.sort((a, b) => {
          // Handle cases where key doesn't exist
          const aValue = a[key] || '';
          const bValue = b[key] || '';
          const aIsLatin = latinRegex.test(aValue);
          const bIsLatin = latinRegex.test(bValue);

          if (!bIsLatin && aIsLatin) return -1;
          if (bIsLatin && !aIsLatin) return 1;
          return 0;
        });

      }

      // if the array is larger than 2, we need to interleave the results
      if (arr.length == 6){
        arr.splice(1, 0, arr.splice(3, 1)[0]);
        arr.splice(3, 0, arr.splice(4, 1)[0]);
      }
      if (arr.length == 4){
        arr.splice(1, 0, arr.splice(2, 1)[0]);
      }
      //   let fiftyPercent = Math.floor(sortedArry.length / 2)
      //   let largeAryOrder = []
      //   console.log("sortedArry",sortedArry)
      //   console.log("fiftyPercent",fiftyPercent)
      //   for (let i = 0; i < fiftyPercent; i++) {
      //     console.log("i",i)
      //     console.log("i + fiftyPercent",i + fiftyPercent)

      //     largeAryOrder.push(JSON.parse(JSON.stringify(sortedArry[i])));
      //     largeAryOrder.push(JSON.parse(JSON.stringify(sortedArry[i + fiftyPercent])));
      //     console.log("largeAryOrder ->",JSON.parse(JSON.stringify(largeAryOrder)))
      //   }


      //   console.log("sortedArry!!!",sortedArry)

      //   console.log("Returning largeAryOrder:", largeAryOrder)
      //   return largeAryOrder

      // }else{
      //   console.log("Returning sortedArry",sortedArry)
      //   return sortedArry

      // }




      return arr


    },


    /**
     * Extracts Library of Congress Classification (LCC) data from the active profile and updates the activeShelfListData state
     *
     * This function:
     * 1. Searches through all resource templates (rt) and property templates (pt) in the active profile
     * 2. Looks for classification properties of type ClassificationLcc
     * 3. Extracts the classification portion (class number) and item portion (cutter number)
     * 4. Updates the activeShelfListData state with:
     *    - class: The LCC class number
     *    - classGuid: GUID for the class number component
     *    - cutter: The cutter number
     *    - cutterGuid: GUID for the cutter number component
     *    - componentGuid: GUID of the parent classification component
     *    - componentPropertyPath: Path to locate the item portion property
     *
     * Used by the shelf listing functionality to locate and modify LCC numbers.
     *
     *
     * @return {void} Updates the activeShelfListData state directly
     */
    buildActiveShelfListDataFromProfile(){
      // look through the active profile for the LCC data
      let classificationCount = 0
      let foundLCC = false
      for (let rt in this.activeProfile.rt){
        for (let pt in this.activeProfile.rt[rt].pt){
          pt = this.activeProfile.rt[rt].pt[pt]
          if (pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/classification"){
            classificationCount++
          }
        }
      }
      // console.log("classificationCount ===",classificationCount)

      for (let rt in this.activeProfile.rt){
        for (let pt in this.activeProfile.rt[rt].pt){
          pt = this.activeProfile.rt[rt].pt[pt]
          if (pt.propertyURI == "http://id.loc.gov/ontologies/bibframe/classification"){
            // console.log(pt)
            if (pt.userValue &&
                pt.userValue['http://id.loc.gov/ontologies/bibframe/classification'] &&
                pt.userValue['http://id.loc.gov/ontologies/bibframe/classification'][0] &&
                pt.userValue['http://id.loc.gov/ontologies/bibframe/classification'][0]['@type']){

                  // if it is a LCC node good, and it is not deleted:
                  if (pt.userValue['http://id.loc.gov/ontologies/bibframe/classification'][0]['@type'] == "http://id.loc.gov/ontologies/bibframe/ClassificationLcc" && !pt.deleted){



                    let classObj = pt.userValue['http://id.loc.gov/ontologies/bibframe/classification'][0]

                    if (
                      classObj['http://id.loc.gov/ontologies/bibframe/classificationPortion'] &&
                      classObj['http://id.loc.gov/ontologies/bibframe/classificationPortion'][0] &&
                      classObj['http://id.loc.gov/ontologies/bibframe/classificationPortion'][0]['http://id.loc.gov/ontologies/bibframe/classificationPortion']
                    ){
                      this.activeShelfListData.class = classObj['http://id.loc.gov/ontologies/bibframe/classificationPortion'][0]['http://id.loc.gov/ontologies/bibframe/classificationPortion']
                      this.activeShelfListData.classGuid = classObj['http://id.loc.gov/ontologies/bibframe/classificationPortion'][0]['@guid']
                    }
                    if (
                      classObj['http://id.loc.gov/ontologies/bibframe/itemPortion'] &&
                      classObj['http://id.loc.gov/ontologies/bibframe/itemPortion'][0] &&
                      classObj['http://id.loc.gov/ontologies/bibframe/itemPortion'][0]['http://id.loc.gov/ontologies/bibframe/itemPortion']
                    ){
                      this.activeShelfListData.cutter = classObj['http://id.loc.gov/ontologies/bibframe/itemPortion'][0]['http://id.loc.gov/ontologies/bibframe/itemPortion']
                      this.activeShelfListData.cutterGuid = classObj['http://id.loc.gov/ontologies/bibframe/itemPortion'][0]['@guid']
                    }

                    this.activeShelfListData.componentGuid = pt['@guid']
                    this.activeShelfListData.componentPropertyPath = [
                      {level: 0, propertyURI: 'http://id.loc.gov/ontologies/bibframe/classification'},
                      {level: 1, propertyURI: 'http://id.loc.gov/ontologies/bibframe/itemPortion'}
                    ]

                    console.log("Found LCC data:",this.activeShelfListData)
                    console.log(JSON.stringify(pt,null,2))
                    foundLCC = true
                  }else{
                    // not LCC
                    // continue

                  }

                }else{

                  // if it is only one classification and it is empty then we can use it
                  // console.log(Object.keys(pt.userValue).length)
                  if (classificationCount == 1 && Object.keys(pt.userValue).length == 1){
                    // console.log("Using empty classification for shelf list",pt)
                    this.activeShelfListData.componentGuid = pt['@guid']
                    this.activeShelfListData.componentPropertyPath = [
                      {level: 0, propertyURI: 'http://id.loc.gov/ontologies/bibframe/classification'},
                      {level: 1, propertyURI: 'http://id.loc.gov/ontologies/bibframe/itemPortion'}
                    ]
                    foundLCC = true

                  }else if (foundLCC == false && pt?.preferenceId.toLowerCase().indexOf(":lcc") > -1){
                  // if we dont have one but we found a LCC template use it
                   this.activeShelfListData.componentGuid = pt['@guid']
                    this.activeShelfListData.componentPropertyPath = [
                      {level: 0, propertyURI: 'http://id.loc.gov/ontologies/bibframe/classification'},
                      {level: 1, propertyURI: 'http://id.loc.gov/ontologies/bibframe/itemPortion'}
                    ]
                    foundLCC = true

                  }


                }


          }
        }
      }


    },


    reorderAllNonLatinLiterals(){
      this.activeProfile = utilsParse.reorderAllNonLatinLiterals(this.activeProfile)

    },

    /**
     * Tests if the passed string contains only Latin characters or includes non-Latin characters.
     *
     * @param {string} inputString - The string to test.
     * @returns {boolean} - True if the string contains only Latin characters, false otherwise.
     */
    isLatin(inputString) {
      // Regex to match common Latin characters, numbers, punctuation, and extended Latin ranges.
      return latinRegex.test(inputString);
    },

    isTestEnv(){
      return window.location.href.includes("localhost:5555")
    },


    async buildLinkedData(){


      let linkedData = {
        subtitle: [],
        noteContent: [],
        noteTOC: [],
        thumbnail: [],
        lcsh: [],
        genre: [],
        contributors: utilsProfile.returnContributorUris(this.activeProfile),
        isbn: (this.activeProfile.linkedData && this.activeProfile.linkedData.isbn) ? this.activeProfile.linkedData.isbn : [],
      }
      console.log(":linkedDatalinkedData",linkedData)

      for (let isbn of linkedData.isbn){

        let baseData = await utilsNetwork.linkedDataBaseRelated(isbn)
        console.log("baseData",baseData)

        let oclcMarcData = utilsNetwork.linkedDataExtractOclcMarc(baseData.results)
        console.log("oclcMarcData",oclcMarcData)
        linkedData.subtitle = linkedData.subtitle.concat(oclcMarcData.filter((v) => (v.dataType == 'subtitle')));
        linkedData.noteContent = linkedData.noteContent.concat(oclcMarcData.filter((v) => (v.dataType == 'description')));
        linkedData.noteTOC = linkedData.noteTOC.concat(oclcMarcData.filter((v) => (v.dataType == 'toc')));
        linkedData.thumbnail = linkedData.thumbnail.concat(oclcMarcData.filter((v) => (v.dataType == 'thumbnail')));
        linkedData.lcsh = linkedData.lcsh.concat(oclcMarcData.filter((v) => (v.dataType == '6xx')));
        linkedData.genre = linkedData.genre.concat(oclcMarcData.filter((v) => (v.dataType == 'genre')));

        linkedData.isbn = linkedData.isbn.concat(baseData.results.isbns);

        linkedData.isbn.map((v)=>{
          if (v.length > 10){
            linkedData.isbn.push(utilsProfile.isbn13to10(v))
          }
        })
        linkedData.isbn = [...new Set(linkedData.isbn)];




        if (baseData.results.isbns && baseData.results.isbns.length > 0){
          let googleBookData = await utilsNetwork.linkedDataAllGoogleBooksByIsbns(baseData.results.isbns)
          googleBookData = utilsNetwork.linkedDataExtractGoogleBooks(googleBookData)
          console.log("googleBookData",googleBookData)

          googleBookData.filter((v) => (v.dataType == 'toc'))

          linkedData.subtitle = linkedData.subtitle.concat(googleBookData.filter((v) => (v.dataType == 'subtitle')));
          linkedData.noteContent = linkedData.noteContent.concat(googleBookData.filter((v) => (v.dataType == 'description')));
          linkedData.noteTOC = linkedData.noteTOC.concat(googleBookData.filter((v) => (v.dataType == 'toc')));
          linkedData.thumbnail = linkedData.thumbnail.concat(googleBookData.filter((v) => (v.dataType == 'thumbnail')));
          linkedData.lcsh = linkedData.lcsh.concat(googleBookData.filter((v) => (v.dataType == 'subject')));


        }

        // if we got a hit on one of the isbns we can stop
        if (baseData.results.records.length > 0){
          break
        }


      }
      // remove the $1 or $0
      for (let lcsh of linkedData.lcsh){
        lcsh.value = lcsh.value.filter((v) => (Object.keys(v)[0] != '1' && Object.keys(v)[0] != '0') )
      }

      // remove trailing punctuation from genreForm
      for (let genre of linkedData.genre){
        if (genre.value && genre.value.length > 0){
          genre.value = genre.value.replace(/[\.]$/, '')
        }
      }

      // unique the lcsh
      let addedLCSH = []
      let keepLCSH = []
      for (let lcsh of linkedData.lcsh){
        let v = JSON.stringify(lcsh.value)
        if (addedLCSH.indexOf(v) == -1){
          addedLCSH.push(v)
          keepLCSH.push(lcsh)
        }
      }

      linkedData.lcsh=keepLCSH

      for (let key in linkedData) {
        if (Array.isArray(linkedData[key])) {
          const uniqueValues = new Set();
          linkedData[key] = linkedData[key].filter(item => {
        if (item && typeof item.value !== 'undefined') {
          if (!uniqueValues.has(item.value)) {
            uniqueValues.add(item.value);
            return true;
          }
          return false;
        }
        // Keep items that don't have a 'value' property or are not objects
        return true;
          });
        }
      }

      // ask for contributor LCSH possbilbities
      if (linkedData.contributors && linkedData.contributors.length > 0){
        let lcshContributors = await utilsNetwork.linkedDataLCSHContributors(linkedData.contributors)
        // console.log("lcshContributors",lcshContributors)
        // kick this off but don't wait for it to finish
        utilsNetwork.linkedDataLCSHContributorsExtract(lcshContributors).then((colabResults)=>{
          console.log("colabResults",colabResults)
        })
        // if (lcshContributors && lcshContributors.length > 0){
      }

      console.log("linkedData",linkedData)
      this.linkedData = linkedData
      this.linkedData.done = true

    },


    addLinkedData(toAdd){

      if (toAdd.dataType == 'subtitle'){
        toAdd.PropertyPath = ["http://id.loc.gov/ontologies/bibframe/title", "http://id.loc.gov/ontologies/bibframe/subtitle"]
        toAdd.addNew = false
        toAdd.resourceType = "instance"
      }
      if (toAdd.dataType == 'description' || toAdd.dataType == 'note'){
        toAdd.PropertyPath = ["http://id.loc.gov/ontologies/bibframe/summary", "http://www.w3.org/2000/01/rdf-schema#label"]
        toAdd.typeOf = "http://id.loc.gov/ontologies/bibframe/Summary"
        toAdd.addNew = true
        toAdd.resourceType = "work"
      }
      if (toAdd.dataType == 'toc' ){
        toAdd.PropertyPath = ["http://id.loc.gov/ontologies/bibframe/tableOfContents", "http://www.w3.org/2000/01/rdf-schema#label"]
        toAdd.typeOf = "http://id.loc.gov/ontologies/bibframe/TableOfContents"
        toAdd.addNew = true
        toAdd.resourceType = "work"
      }

      if (toAdd.dataType == '6xx' ){
        toAdd.PropertyPath = ["http://id.loc.gov/ontologies/bibframe/subject", "http://www.w3.org/2000/01/rdf-schema#label"]
        toAdd.typeOf = "http://id.loc.gov/ontologies/bibframe/Subject"
        toAdd.addNew = true
        toAdd.resourceType = "work"
      }

      if (toAdd.dataType == 'genre' ){
        toAdd.PropertyPath = ["http://id.loc.gov/ontologies/bibframe/genreForm", "http://www.w3.org/2000/01/rdf-schema#label"]
        toAdd.typeOf = "http://id.loc.gov/ontologies/bibframe/GenreForm"
        toAdd.addNew = true
        toAdd.resourceType = "work"
      }
      console.log("toAdd",toAdd)
      for (let rt of Object.keys(this.activeProfile.rt)){
        if (rt.toLowerCase().includes(toAdd.resourceType)){
          for (let pt of Object.keys(this.activeProfile.rt[rt].pt)){
            pt = this.activeProfile.rt[rt].pt[pt]
            if (pt.propertyURI == toAdd.PropertyPath[0]){

              if (toAdd.addNew){

                // find the matching property to copy from
                let copyFrom = null
                for (let ptLookingFor of Object.keys(this.activeProfile.rt[rt].pt)){
                  if (this.activeProfile.rt[rt].pt[ptLookingFor].propertyURI == toAdd.PropertyPath[0]){
                    copyFrom = this.activeProfile.rt[rt].pt[ptLookingFor]
                    copyFrom = JSON.parse(JSON.stringify(copyFrom))
                    copyFrom['@guid'] = short.generate()
                    copyFrom.id = copyFrom.id + "_" + short.generate()


                    if (toAdd.PropertyPath[0] != "http://id.loc.gov/ontologies/bibframe/subject" && toAdd.PropertyPath[0] != "http://id.loc.gov/ontologies/bibframe/genreForm"){
                      copyFrom.userValue = {'@root': toAdd.PropertyPath[0]}
                      copyFrom.userValue[toAdd.PropertyPath[0]] = [{
                        '@guid': short.generate(),
                        '@type': toAdd.typeOf,
                        [toAdd.PropertyPath[1]]: [{
                          '@guid': short.generate(),
                          [toAdd.PropertyPath[1]]: toAdd.value
                        }]
                      }]

                      let newIndex = this.activeProfile.rt[rt].ptOrder.indexOf(this.activeProfile.rt[rt].pt[ptLookingFor].id)
                      if (newIndex){
                          newIndex++
                          this.activeProfile.rt[rt].ptOrder.splice(newIndex, 0, copyFrom.id);
                          this.activeProfile.rt[rt].pt[copyFrom.id] = copyFrom;
                          this.dataChanged()
                          this.activeComponent = this.activeProfile.rt[rt].pt[copyFrom.id]
                      }
                      break
                    }else{

                      // do something special for subjects
                      console.log("copyFrom",copyFrom)
                      copyFrom.userValue = {'@root': toAdd.PropertyPath[0], '@guid': short.generate()}

                      // insert the new one and then look for it
                      let newIndex = this.activeProfile.rt[rt].ptOrder.indexOf(this.activeProfile.rt[rt].pt[ptLookingFor].id)
                      if (newIndex){
                          newIndex++
                          this.activeProfile.rt[rt].ptOrder.splice(newIndex, 0, copyFrom.id);
                          this.activeProfile.rt[rt].pt[copyFrom.id] = copyFrom;
                          this.dataChanged()
                          this.activeComponent = this.activeProfile.rt[rt].pt[copyFrom.id]

                            setTimeout(()=>{

                              let foundEl = document.querySelector(`[data-field-guid="${copyFrom['@guid']}"]`)
                              foundEl.focus()
                              console.log("toAdd.value",toAdd.value)

                              let toAddString
                              if (toAdd.PropertyPath[0] == "http://id.loc.gov/ontologies/bibframe/subject"){
                                toAddString = toAdd.value.map((v)=>{ return '$' + Object.keys(v)[0] + v[Object.keys(v)[0]] }).join("")
                              }else if (toAdd.PropertyPath[0] == "http://id.loc.gov/ontologies/bibframe/genreForm"){
                                toAddString = toAdd.value
                              }


                              setTimeout(()=>{

                                  // const eventA = new Event('input', {
                                  //     data:'helloo',
                                  //     bubbles: true,

                                  // });
                                  // console.log("Sending eventA",eventA)
                                  // foundEl.dispatchEvent(eventA);
                                  // foundEl.value="Hellooo"
                                  const event = new Event('input', { bubbles: true });
                                  foundEl.value = toAddString;
                                  foundEl.dispatchEvent(event);


                              },500)



                              console.log("foundEl",foundEl)

                            },250)

                      }

                      break
                    }
                  }
                }





              }else{



                // does it already have the property
                if (pt.userValue
                  && pt.userValue[toAdd.PropertyPath[0]]
                  && pt.userValue[toAdd.PropertyPath[0]][0]
                  && !pt.userValue[toAdd.PropertyPath[0]][0][toAdd.PropertyPath[1]]
                  ){
                    console.log("it does not has the property",pt.userValue[toAdd.PropertyPath[0]][0][toAdd.PropertyPath[1]])
                    // doesn't have the prperty so create it wholelly

                    let uv = {
                      '@guid': short.generate()
                    }
                    uv[toAdd.PropertyPath[1]] = toAdd.value
                    pt.userValue[toAdd.PropertyPath[0]][0][toAdd.PropertyPath[1]] = [uv]

                  }else if (pt.userValue
                  && pt.userValue[toAdd.PropertyPath[0]]
                  && pt.userValue[toAdd.PropertyPath[0]][0]
                  && pt.userValue[toAdd.PropertyPath[0]][0][toAdd.PropertyPath[1]]
                  ){

                    let uv = {
                      '@guid': short.generate(),
                      'http://id.loc.gov/ontologies/bibframe/subtitle': toAdd.value
                    }
                    pt.userValue[toAdd.PropertyPath[0]][0][toAdd.PropertyPath[1]].push(uv)
                  }
                  this.dataChanged()
              }
              break
            }
          }
        }
        // for (let pt in state.activeProfile.rt[rt].pt){
        //   if (state.activeProfile.rt[rt].pt[pt]['@guid'] === guid){
        //     return state.activeProfile.rt[rt].pt[pt]
        //   }
        // }
      }



    },

    isValidIsbn(isbn){
        // source: https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
        // Checks for ISBN-10 or ISBN-13 format
        var regex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

        if (regex.test(isbn)) {
            // Remove non ISBN digits, then split into an array
            var chars = isbn.replace(/[- ]|^ISBN(?:-1[03])?:?/g, "").split("");
            // Remove the final ISBN digit from `chars`, and assign it to `last`
            var last = chars.pop();
            var sum = 0;
            var check, i;

            if (chars.length == 9) {
                // Compute the ISBN-10 check digit
                chars.reverse();
                for (i = 0; i < chars.length; i++) {
                    sum += (i + 2) * parseInt(chars[i], 10);
                }
                check = 11 - (sum % 11);
                if (check == 10) {
                    check = "X";
                } else if (check == 11) {
                    check = "0";
                }
            } else {
                // Compute the ISBN-13 check digit
                for (i = 0; i < chars.length; i++) {
                    sum += (i % 2 * 2 + 1) * parseInt(chars[i], 10);
                }
                check = 10 - (sum % 10);
                if (check == 10) {
                    check = "0";
                }
            }

            if (check == last) {
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    },

    checkIsRepeatable(comp){
      // if the field is not repeatable and they are adding something, prevent it.
      let currentValue = this.returnSimpleLookupValueFromProfile(comp.guid, comp.propertyPath)
      if (comp.structure.repeatable == 'false'  && currentValue.length > 0){
        return false
      }
      return true
    },

    displaySubject: function(comp){
      // if the preference is set to only show LCSH terms, return true/false based on the source
      // how to handle if everything is hidden??
      //    need to show something, or show that things are hidden and
      // should it be like when ad hoc hides components?
      let pref = usePreferenceStore().returnValue("--b-edit-main-hide-non-lc")
      if (!pref){ return true }

      try {
        if (comp.propertyURI == "http://id.loc.gov/ontologies/bibframe/subject"){
          let userValue = comp.userValue
          let data = userValue["http://id.loc.gov/ontologies/bibframe/subject"] ? userValue["http://id.loc.gov/ontologies/bibframe/subject"][0] : {}
          if (data["http://id.loc.gov/ontologies/bibframe/source"]){
            let source = data["http://id.loc.gov/ontologies/bibframe/source"][0]
            let code   = source["http://id.loc.gov/ontologies/bibframe/code"] ? source["http://id.loc.gov/ontologies/bibframe/code"][0]["http://id.loc.gov/ontologies/bibframe/code"] : ""
            let label  = source["http://www.w3.org/2000/01/rdf-schema#label"] ? source["http://www.w3.org/2000/01/rdf-schema#label"][0]["http://www.w3.org/2000/01/rdf-schema#label"] : ""
            let sourceURI = source["@id"] ? source["@id"] : ""

            if (!label.includes("Library of Congress") ){
              return false
            }
          }
        }

        return true
      } catch(err){
        console.error("Error with displaySubject preference: ", err)
        return true
      }
    },

    numberHiddenShown: function(profile){
      let subjectCount = 0
      let subjectHidden = 0
      let subjectLast = null
      for (let rt in profile.rt){
        for (let pt in profile.rt[rt].pt){
          if (pt.includes("id_loc_gov_ontologies_bibframe_subject__subjects")){
            let comp =  profile.rt[rt].pt[pt]
            if (comp.deleted === undefined || (Object.keys(comp).includes('deleted') && comp.deleted != true)){
              subjectCount++
            }
            if (comp.hideSubject){
              subjectHidden++
            }
            subjectLast = comp
          }
        }
      }

      let showing = subjectCount - subjectHidden
      if (showing == 0){
        // add an empty subject component
        // componentGuid, structure
        this.duplicateComponent(subjectLast["@guid"], this.returnStructureByGUID(subjectLast["@guid"]))
      }
      if (subjectHidden > 0){
        this.hiddenSubjects = true
      }

      let results = {'subjects': subjectCount, 'hidden': subjectHidden, 'showing': showing}

      return results
    },















  },




})
