import objectScan from 'object-scan';
import utilsRDF from './utils_rdf';
import short from 'short-uuid'



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
          return pointerHistory[pointerHistory.length-3]
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
  buildBlanknode: async function(pt,propertyPath){
      
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

          // we may or maynot need to create a @type for this level, depending on what type of property it is,
          // so test first the property info in the profile
          let type = utilsRDF.suggestTypeProfile(p,pt)
          if (type === false){
            // did not find it in the profile, look to the network
            type = await utilsRDF.suggestTypeNetwork(p)

          } 

          if (type !== false){
            // first we test to see if the type is a literal, if so then we 
            // don't need to set the type, as its not a blank node, just a nested property
            if (utilsRDF.isUriALiteral(type) === false){
              pointer[p][0]['@type'] = type  
            }else{
              // nothing to do, its a literal
            }
          }else{
            console.error("Could not find type for this property", p, 'of', propertyPath, 'in', pt)  
          }

          // relink to the first blank node
          pointer = pointer[p][0]

        }else{
          // if we don't need to create this level, so just link to it
          if (pointer[p][0]){
            console.log("Linink to",pointer[p][0])
            pointer = pointer[p][0]
          }else{
            console.error("Trying to link to a level in userValue and unable to find it", p, 'of', propertyPath, 'in', pt)  
          }
        }


        

      }

      if (!pointer || !pointer['@guid']){
        console.error("There was an unknown error trying to create a blank node in", propertyPath, ' in ', pt)
      }
      
      return [pt, pointer['@guid']]
  },


  /**
  * returns the value array that is at the end of the property path hierachy
  * @param {object} pt - the pt field for that component
  * @param {array} propertyPath - the array of URI strings that points to the place to build the blank node obj
  * @return {array} - will return the value array at the end of the property path if it exists
  */    
  returnValueFromPropertyPath: function(pt,propertyPath){

      let deepestLevel = propertyPath[propertyPath.length-1].level

      let pointer = pt.userValue
      for (let p of propertyPath){

        // the property path has two parts 
        // {level: 0, propertyURI: 'http://id.loc.gov/ontologies/bibframe/title'}
        
        // navigates the property
        if (pointer[p.propertyURI]){

          if (Array.isArray(pointer[p.propertyURI])){

            if (pointer[p.propertyURI].length === 0){
              console.warn("Expecting there to be at least one value here: ", pt, p, propertyPath)
            }

            // if this is the last level then return the whole array, if we are continuing 
            // down the hiearchy then just select the first element, as we don't support multiple values at the early levels
            if (p.level !== deepestLevel){
              pointer = pointer[p.propertyURI][0]
            }else{
              pointer = pointer[p.propertyURI]
            }

          }else{

            console.error("Expecting Array in this userValue property:",pt,p,propertyPath)
            return false

          }

        }else{
          // the level doesn't exist here, we were unable to traverse the whole hierachy
          // whihch means the value is not set, so we retun false to say it failed
          return false

        }


      }

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





}


export default utilsProfile;