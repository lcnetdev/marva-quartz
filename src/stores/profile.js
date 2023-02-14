import { defineStore } from 'pinia'
import { useConfigStore } from './config'


import short from 'short-uuid'
const translator = short();
const decimalTranslator = short("0123456789");

const hashCode = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)



export const useProfileStore = defineStore('profile', {
  state: () => ({
   
    // flag if the profiles have been loaded and processed
    profilesLoaded: false,

    // holds all profiles
    profiles: [],

    // holds all rts, with its ID as the key
    rtLookup: {},

    // the starting points that display on the create new page
    startingPoints: {},

    // the current active profile
    activeProfile: {},



  }),
  getters: {
    // doubleCount: (state) => state.count * 2,

    // returnStructureByGUID: (state) => {

    //   return "yessssssss"

    // }
    // returnStructureByGUID2: (state) => (id) => {

    //   return "OMG -_- " + id 
    // },

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
      };


    },


  },
  actions: {


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
                              pt.canBeHidden = false
                              
                              if (pt.type === 'literal-lang'){
                                  this.profiles[p.json.Profile.id].rt[rt.id].hasLiteralLangFields = true
                              }

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

      console.log("useProfile",useProfile)
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
        useProfile.user = this.catInitials
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


    // increment() {
    //   this.count++
    // },
  },
})