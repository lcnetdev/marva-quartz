import objectScan from 'object-scan';
import utilsRDF from './utils_rdf';
import utilsNetwork from './utils_network';
import utilsParse from './utils_parse';

import short from 'short-uuid'

import { useProfileStore } from '@/stores/profile'


const utilsProfile = {

  /**
  * Returns the piece of the the userValue passed that contains the given @guid
  *
  * @param {object} obj - the object, most likely the userValue
  * @param {string} guid - the guid to search for
  * @return {object|boolean} - will return the obj or false if not found
  */
  returnGuidLocation: function(obj,guid){
    // use a pattern that looks at many possible levels down for a @guid
    let foundPos = objectScan(['*.**.@guid,*.**.@guid.**.@guid,*.**.@guid.**.@guid.**.@guid,*.**.@guid.**.@guid.**.@guid.**.@guid'])(obj);

    for (let fp of foundPos){
      // eventuall pointer will point to the @guid value
      let pointer = obj
      // and pointerParent will be the object containing that @guid
      let pointerParent = null
      for (let pos of fp){

        pointerParent = pointer
        // if the guid was not in the hiearchy at some point this pointer will be undefined and we can kick back a false
        if (typeof pointer ==='undefined'){
          // return false
          break
        }
        pointer = pointer[pos]
        if (pointer===guid){
          return pointerParent
        }

      }
    }
    // if it can't find it at all, like a new userValue return false
    return false
  },


  /**
  * Returns the parent of the node with that guid
  *
  * @param {object} obj - the object, most likely the userValue
  * @param {string} guid - the guid to search for
  * @return {object|boolean} - will return the obj or false if not found
  */
  returnGuidParent: function(obj,guid){
    // use a pattern that looks at many possible levels down for a @guid
    let foundPos = objectScan(['*.**.@guid,*.**.@guid.**.@guid,*.**.@guid.**.@guid.**.@guid,*.**.@guid.**.@guid.**.@guid.**.@guid'])(obj);

    for (let fp of foundPos){
      // eventuall pointer will point to the @guid value
      let pointer = obj
      // // and pointerParent will be the object containing that @guid
      // let pointerParent = null
      // // and  pointerGrandParent will be the object containing the parent
      // let pointerGrandParent = null
      let pointerHistory = []
      for (let pos of fp){

        // pointerGrandParent = pointerParent
        // pointerParent = pointer
        // if the guid was not in the hiearchy at some point this pointer will be undefined and we can kick back a false
        if (typeof pointer ==='undefined'){
          // return false
          break
        }


        if (pointer[pos]===guid){
          // if we just hit the guid it means the index -1 is the blank node of the value
          // then it's index -2 would be the array containing the blank node
          // and it index -3 would be object holding the property with the array value that contains the blank node
          // so return index -3 from the end
          // unless it is a top level component, meaning it doesn't have a blank node
          if (pointerHistory[pointerHistory.length-3]){
            return pointerHistory[pointerHistory.length-3]
          }else{
            return pointerHistory[0]
          }

          // else if (pointerHistory[pointerHistory.length-1]){
          //   // if (Array.isArray(pointerHistory[pointerHistory.length-2]) == true){
          //   //   pointerHistory[pointerHistory.length-2] = pointerHistory[pointerHistory.length-2][0]
          //   // }
          //   return pointerHistory[pointerHistory.length-1]
          // }


        }else{
          // add it to the history if we didn't just find it
          pointerHistory.push(pointer[pos])
          pointer = pointer[pos]
        }




      }

    }
    // if it can't find it at all, like a new userValue return false
    return false
  },




  /**
  * Returns the piece profile passed to find the sepcific PT requested regardless of RT
  *
  * @param {object} prfoile - the object, most likely the activeProfile
  * @param {string} guid - the guid to search for
  * @return {object|boolean} - will return the obj or false if not found
  */
  returnPt: function(profile,guid){
      for (let rt in profile.rt){
        for (let pt in profile.rt[rt].pt){
          if (profile.rt[rt].pt[pt]['@guid'] === guid){
            return profile.rt[rt].pt[pt]
          }
        }
      }

      return false
  },


  /**
  * Will return the number of values in a given property path for a uservalue
  * Useful to know when dealing with repeated literal values in a something like a mainTitle
  * @async
  * @param {object} pt - the pt field for that component
  * @param {array} propertyPath - the array of URI strings that points to the place to build the blank node obj
  * @return {number} - will return the count
  */
  countValues: function(pt,propertyPath){
      // link to the base userValue
      let pointer = pt.userValue
      let counter = 0
      for (let p of propertyPath){
        p = p.propertyURI
        if (!pointer[p]){
          return counter
        }else{
          // if this is the last property in the list then take the count at the end of it
          if (p === propertyPath[propertyPath.length-1].propertyURI){
            counter = pointer[p].length
          }else{
            if (pointer[p][0]){
              pointer = pointer[p][0]
            }else{
              return counter
            }
          }
        }
      }

      return counter

  },



  /**
  * Will return the postion at the end of the property hiearchy but not the specific value blank node
  * Used to get to the parent of a value
  * @async
  * @param {object} pt - the pt field for that component
  * @param {array} propertyPath - the array of URI strings that points to the place to build the blank node obj
  * @return {object|boolean} - the position in the pt hiearchy or false
  */
  returnPropertyPathParent: function(pt,propertyPath){
      // link to the base userValue
      let pointer = pt.userValue

      for (let p of propertyPath){
        p = p.propertyURI
        if (!pointer[p]){
          return false
        }else{
          // if this is the last property in the list then take the count at the end of it
          if (p === propertyPath[propertyPath.length-1].propertyURI){
            return pointer
          }else{
            if (pointer[p][0]){
              pointer = pointer[p][0]
            }else{
              return false
            }
          }
        }
      }



  },


  /**
  * creates a path to the blank node supplied, there mgiht be some special rules around
  * the propertes and how we represent them in the userValue
  * @async
  * @param {object} pt - the pt field for that component
  * @param {array} propertyPath - the array of URI strings that points to the place to build the blank node obj
  * @return {array} - will return an array with the pt as 0 and the new @guid of the blanknode as 1
  */
  buildBlanknode: function(pt,propertyPath){
      // link to the base userValue
      let pointer = pt.userValue

      for (let p of propertyPath){
        // the property path has two parts
        // {level: 0, propertyURI: 'http://id.loc.gov/ontologies/bibframe/title'}
        // we don't care about the level number so just overwrite it
        p = p.propertyURI

        // if the property doesn't exist then create it
        if (!pointer[p]){
          pointer[p] = [{
            // always create a guid for it
            '@guid' : short.generate()
          }]

          // relink to the first blank node
          pointer = pointer[p][0]

        }else{
          // console.log("dont need to create this level", p, pointer[p])
          // if we don't need to create this level, so just link to it

          if (pointer[p][0]){
            // make sure it has a guid
            if (!pointer[p][0]['@guid']){
              pointer[p][0]['@guid'] = short.generate()
            }
            // console.log("Linink to",pointer[p][0])
            pointer = pointer[p][0]
          }else{
            console.error("Trying to link to a level in userValue and unable to find it", p, 'of', propertyPath, 'in', pt)
          }
        }

      }
      // console.log("pointer is",pointer)
      if (!pointer || !pointer['@guid']){
        console.error("There was an unknown error trying to create a blank node in", propertyPath, ' in ', pt)
      }

      this.setTypesForBlankNode(pt,propertyPath)
      return [pt, pointer['@guid']]
  },


  /**
  * Called from buildBlanknode to build the @types for a userValue it is a seperate function to allow it to run
  * without blocking the creation of the blanknode which lags data input if we had to wait around why deciding the @types for the node
  * @async
  * @param {object} pt - the pt field for that component
  * @param {array} propertyPath - the array of URI strings that points to the place to build the blank node obj
  * @return {void} - doesn't return anything it works on the reference to the pt.userValue updating the orginal
  */
  setTypesForBlankNode: async function(pt, propertyPath){
    let pointer = pt.userValue
    let pointerParent = null
    let parentP = null
    for (let p of propertyPath){

      p = p.propertyURI

      if (pointer[p][0]){
        // we may or maynot need to create a @type for this level, depending on what type of property it is,
        // so test first the property info in the profile
        let type = utilsRDF.suggestTypeProfile(p,pt)
        if (type === false){
          // did not find it in the profile, look to the network
          type = await utilsRDF.suggestTypeNetwork(p)
        }
        if (type !== false){

          // first we test to see if the type is a literal (the type returned, not the property of the value), if so then we
          // don't need to set the type, as its not a blank node, just a nested property
          if (utilsRDF.isUriALiteral(type) === false){
            // if it doesn't yet have a type then go ahead and set it
			// OR if the suggested type is PrimaryContribution, override the existing type
            if (!pointer[p][0]['@type'] || type.includes("PrimaryContribution")){
              pointer[p][0]['@type'] = type
            }
          }else{
            // if it is a literal the profiles may in a covoluated way hold the @type for its parent blank node so check that
            let possibleParentType = utilsRDF.suggestTypeProfileForLiteralParent(p,pt)

            // console.log("But its parent is probably a", possibleParentType)
            // console.log(pointerParent)
            // console.log(parentP)

            if (possibleParentType && pointerParent && pointerParent[parentP] && pointerParent[parentP][0] ){
              if (pointerParent[parentP][0]['@type']){
                // if it does have a type then check to see if they are different than what this process suggests
                if (pointerParent[parentP][0]['@type'] != possibleParentType){
                  // they are different so check if one is sub classed of the other
                  let isSubClassOf = await utilsRDF.isSubClassOf(possibleParentType,pointerParent[parentP][0]['@type'])
                  if (isSubClassOf){

                    // overwrite the parent with the more specific class
                    pointerParent[parentP][0]['@type'] = possibleParentType

                  }else{
                    // if it is here it means that the process doesn't think the parent node is the correct @type, but it might not be right, so warn for now
                    console.warn("-------------------------")
                    console.warn("It looks like ", JSON.stringify(pointerParent[parentP][0]['@type'],null,2))
                    console.warn("Should not have the type ",pointerParent[parentP][0]['@type'])
                    console.warn("But instead it should have", possibleParentType)
                    console.warn("-------------------------")  
                  }
                }
              }
              
            }
          }

      


        }else{
          console.error("Could not find type for this property", p, 'of', propertyPath, 'in', pt)
        }
        pointerParent = pointer
        parentP = p
        pointer = pointer[p][0]
      }else{
        console.error("Trying to link to a level in userValue and unable to find it", p, 'of', propertyPath, 'in', pt)
      }
    }
  },


  /**
  * returns the value array that is at the end of the property path hierachy
  * @param {object} pt - the pt field for that component
  * @param {array} propertyPath - the array of URI strings that points to the place to build the blank node obj
  * @return {array} - will return the value array at the end of the property path if it exists
  */
  returnValueFromPropertyPath: function(pt,propertyPath){
        
      let isLocator = propertyPath.some((pp) => pp.propertyURI.includes("electronicLocator") || pp.propertyURI.includes("supplementaryContent"))
        
      let deepestLevel
      if (propertyPath[propertyPath.length-1]){
        deepestLevel = propertyPath[propertyPath.length-1].level
      }else{
        return false
      }

      let pointer = pt.userValue
      
      if (isLocator){
          console.info("    returnValueFromPropertyPath")
          console.info("        pointer 1: ", pointer)
      }
      
      // The note in the supplementaryContent is not in the propertyPath
      //    
      for (let p of propertyPath){
          
          if (isLocator){ console.info("        looking at ", p) }

        // the property path has two parts
        // {level: 0, propertyURI: 'http://id.loc.gov/ontologies/bibframe/title'}

        // navigates the property
        if (pointer[p.propertyURI]){

          if (Array.isArray(pointer[p.propertyURI])){

            if (pointer[p.propertyURI].length === 0){
              console.warn("Expecting there to be at least one value here: ", pt, p, propertyPath)
            }
            
            if (isLocator){ console.info("        pointer 2: ", pointer) }

            // if this is the last level then return the whole array, if we are continuing
            // down the hiearchy then just select the first element, as we don't support multiple values at the early levels
            if (p.level !== deepestLevel){
              pointer = pointer[p.propertyURI][0]
            }else{
              pointer = pointer[p.propertyURI]
            }

          }else{

            console.error("Expecting Array in this userValue property:",pt,p,propertyPath)
            if (isLocator){ console.info("        returning false 1") }
            return false

          }

        }else{
          // the level doesn't exist here, we were unable to traverse the whole hierachy
          // whihch means the value is not set, so we retun false to say it failed
          if (isLocator){ console.info("        returning false 2") }
          return false

        }


      }

        if (isLocator){ console.info("        returning: ", JSON.parse(JSON.stringify(pointer))) }
      return pointer


  },


  /**
  * Loops through a uservalue and looks for properties that have children that
  * only have a @guid and/or a @type but no other data, an empty blank node
  * @param {object} userValue - the userValue
  * @return {object} - will return the userValue pruned
  */
  pruneUserValue: function(userValue){
    for (let key in userValue){

      if (Array.isArray(userValue[key])){
        console.log(key)
        let hasData = false
        for (let value of userValue[key]){
          for (let key2 in value){
            console.log(key2)
            if (!['@guid','@type'].includes(key2)){
              hasData=true
            }


            // // go one level deeper
            // if (Array.isArray(value[key2])){
            //   for (let value2 of value[key2]){
            //     let hasData2 = false
            //     for (let key3 in value){
            //       console.log(key3)
            //       if (!['@guid','@type'].includes(key3)){
            //         hasData2=true
            //       }
            //     }
            //   }

            // }



          }
        }
        if (!hasData){
          console.log(key,'does not have data')
          delete userValue[key]
        }
      }
    }
      return userValue
  },


  /**
  * Loads a record from the marva backend store and parses the XML into the profile
  *
  * @param {string} recordId - the userValue
  * @return {object} - the profile
  */
  loadRecordFromBackend: async function(recordId){
    let xml = await utilsNetwork.loadSavedRecord(recordId)
    let meta = this.returnMetaFromSavedXML(xml)



    utilsParse.parseXml(meta.xml)

    // alert(parseBfdb.hasItem)

    let useProfile = null


    if (useProfileStore().profiles[meta.profile]){
      useProfile = JSON.parse(JSON.stringify(useProfileStore().profiles[meta.profile]))
    }else{
      alert('Cannot find that profile:',meta.profile)
    }

    // we might need to load in a item
    if (utilsParse.hasItem>0){
      let useItemRtLabel
      // look for the RT for this item
      let instanceId = meta.rts.filter((id)=>{ return id.includes(':Instance')  })
      if (instanceId.length>0){
        useItemRtLabel = instanceId[0].replace(':Instance',':Item')
      }
      if (!useItemRtLabel){
        let instanceId = meta.rts.filter((id)=>{ return id.includes(':Work')  })
        if (instanceId.length>0){
          useItemRtLabel = instanceId[0].replace(':Work',':Item')
        }

      }
      for (let step = 0; step < utilsParse.hasItem; step++) {
          for (let pkey in useProfileStore().profiles){
            for (let rtkey in useProfileStore().profiles[pkey].rt){
              if (rtkey == useItemRtLabel){
                let useItem = JSON.parse(JSON.stringify(useProfileStore().profiles[pkey].rt[rtkey]))
                useProfile.rtOrder.push(useItemRtLabel+'-'+step)
                useProfile.rt[useItemRtLabel+'-'+step] = useItem
              }
            }
          }



      }




    }



    if (!useProfile.log){
      useProfile.log = []

    }
    useProfile.log.push({action:'loadInstanceFromSave',from:meta.eid})
    // useProfile.procInfo= "update instance"


    useProfile.procInfo = meta.procInfo

    // console.log('meta',meta)

    // also give it an ID for storage
    useProfile.eId= meta.eid
    useProfile.user = meta.user
    useProfile.status = meta.status


    let transformResults  = await utilsParse.transformRts(useProfile)

    transformResults = this.reorderRTOrder(transformResults)


    return transformResults



  },


  /**
  * Pass it a profile and it will reorder the rtOrder array abased on how it should flow
  * Work->Instance1->Item1,Item2->Instance2-Item2-1,etc..
  *
  * @param {object} profile - the profile
  * @return {object} - the profile
  */
  reorderRTOrder: function(profile){
      //build an item lookup
      let itemLookup = {}

      for (let rt of profile.rtOrder){

          if (rt.includes(':Item')){
              if (profile.rt[rt] && profile.rt[rt].itemOf){
                  itemLookup[rt] = profile.rt[rt].itemOf
              }else{
                  console.warn('Cannot find the itemOf of this item',rt)
              }
          }
      }

      let newOrder = []
      let theWork = null

      for (let rt of profile.rtOrder){
          if (rt.includes(':Work')){
              theWork = rt
          }

          if (rt.includes(':Instance')){


              // add itself in
              newOrder.push(rt)
              let thisInstanceURI = profile.rt[rt].URI

              // then look for its items
              for (let k in itemLookup){
                  if (itemLookup[k] == thisInstanceURI){

                      newOrder.push(k)
                  }
              }
          }
      }

      // add the work first
      if (theWork){
          newOrder.unshift(theWork)
      }


      // as a backup if there is anything in the old order than is not present just toss it in
      for (let rt of profile.rtOrder){
          if (newOrder.indexOf(rt)===-1){

              // if its a hub put it up front
              if (rt.includes(':Hub')){
                  newOrder.unshift(rt);
              }else{
                  newOrder.push(rt)
              }


          }


      }


      profile.rtOrder = JSON.parse(JSON.stringify(newOrder))


      return profile
  },



  returnMetaFromSavedXML: function(xml){

      let parser = new DOMParser();
      xml = parser.parseFromString(xml, "text/xml");
      let voidData = xml.getElementsByTagName('void:DatasetDescription')[0]

      let rts = []

      for (let rt of voidData.getElementsByTagName('lclocal:rtsused')){
          rts.push(rt.innerHTML)
      }

      let eid = null
      for (let el of voidData.getElementsByTagName('lclocal:eid')){
          eid = el.innerHTML
      }

      let status = null
      for (let el of voidData.getElementsByTagName('lclocal:status')){
          status = el.innerHTML
      }

      let profile = null
      for (let el of voidData.getElementsByTagName('lclocal:typeid')){
          profile = el.innerHTML
      }
      let procInfo = null
      for (let el of voidData.getElementsByTagName('lclocal:procinfo')){
          procInfo = el.innerHTML
      }


      let user = null
      for (let el of voidData.getElementsByTagName('lclocal:user')){
          user = el.innerHTML
      }

      voidData.remove()

      xml = (new XMLSerializer()).serializeToString(xml)

      return {
          rts:rts,
          xml:xml,
          eid: eid,
          status:status,
          profile:profile,
          procInfo:procInfo,
          user:user
      }
  },


  suggestURI: function(profile,type,URI){
    // for items find the instance URI and then count up the items and add it as a suffix to the instance URI pattern
    if (type === 'bf:Item'){
        for (let rtId in profile.rt){
            if (profile.rt[rtId].URI == URI){
                let newURI = profile.rt[rtId].URI.replace('/instances/','/items/')
                let itemCount = 0
                for (let rtId2 in profile.rt){
                    if (rtId2.includes(":Item")){
                        itemCount++
                    }
                }
                let itemCountLabel = String(itemCount).padStart(4, '0');
                newURI = newURI + '-' + itemCountLabel
                return newURI
            }
        }
    }


    if (type === 'bf:Instance'){
        let instanceURIbasedOnWork = URI.replace('/works/','/instances/')
        // let workID = URI.split('/').slice(-1)[0]
        // if there are no instances yet, make a new instance and just use the work's URI
        let instanceCount = 0
        // let workUriUsed = false
        for (let rtId2 in profile.rt){
            if (rtId2.includes(":Instance")){
                instanceCount++
                if (profile.rt.URI == instanceURIbasedOnWork){
                    // workUriUsed=true
                }
            }
        }
        // if there are no instances yet use the instanceURIbasedOnWork
        if (instanceCount==0){
            return instanceURIbasedOnWork
        }else{
            // there are already instances, so use the work id but append a suffix to it
            return instanceURIbasedOnWork + '-' + String(instanceCount).padStart(4, '0');
        }
    }
  },


  // Get the RT type that a component ID is in
  getRtTypeFromGuid: function(profile, target){
        for (let rt in profile["rt"]){
            for (let pt in profile["rt"][rt]["pt"]){
                if (profile["rt"][rt]["pt"][pt]["@guid"] == target){
                    return rt
                }
            }
        }
        
        return false
  },

  

  /**
  * This will select the best possbile script to use based on the ones avaiable to use
  * It does some logic around things like Kore or Japn etc.
  *
  * @param {string} scriptWanted - requested script
  * @param {array} scriptOptions - array of script strings
  * @return {object} - the profile
  */

  pickBestNonLatinScriptOption: function(scriptWanted, scriptOptions){

    // if we have that script then tell them to use it
    for (let sO of scriptOptions){
      if (scriptWanted.toLowerCase().trim() == sO.toLowerCase().trim()){
        return sO
      }
    }


    // if we don't check some logic here
    // from https://en.wikipedia.org/wiki/ISO_15924
    if (scriptWanted.toLowerCase() == 'kore'){
        // if it is korean and we have Hani or Hang then use those
        if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('hani') > -1){ return 'Hani'}
        if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('hang') > -1){ return 'Hang'}
    }
    if (scriptWanted.toLowerCase() == 'hanb'){
      if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('hani') > -1){ return 'Hani'}
      if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('bopo') > -1){ return 'Bopo'}
    }
    if (scriptWanted.toLowerCase() == 'hrkt'){
      if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('hira') > -1){ return 'Hira'}
      if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('kana') > -1){ return 'Kana'}
    }
    if (scriptWanted.toLowerCase() == 'jamo'){
      if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('hang') > -1){ return 'Hang'}
    }

    if (scriptWanted.toLowerCase() == 'jpan'){
      if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('hani') > -1){ return 'Hani'}
      if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('hira') > -1){ return 'Hira'}
      if (scriptOptions.map((v)=>{return v.toLowerCase()}).indexOf('kana') > -1){ return 'Kana'}
    }

    return false
  },





}


export default utilsProfile;