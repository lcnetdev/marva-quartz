import {useConfigStore} from "../stores/config";
import {useProfileStore} from "../stores/profile";


// we will use the built in DOMParser() in the browser
const returnDOMParser = function(){
  let p
  try{
    p = new DOMParser();
  }catch(error){
    // const jsdom = require("jsdom");
    // const { JSDOM } = jsdom;
    // const { window } = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
    p = new window.DOMParser();
  }
  return p
}

const XMLParser = returnDOMParser()

// will be set below when used, so we only need to set it once
let rtLookup = null

import utilsNetwork from './utils_network';


const utilsRDF = {

  namespace: {
    'bflc': 'http://id.loc.gov/ontologies/bflc/',
    'bf':'http://id.loc.gov/ontologies/bibframe/',
    'bfsimple':'http://id.loc.gov/ontologies/bfsimple/',
    'madsrdf': 'http://www.loc.gov/mads/rdf/v1#',
    'rdfs':'http://www.w3.org/2000/01/rdf-schema#',
    'rdf' : 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'lclocal':'http://id.loc.gov/ontologies/lclocal/',
    'pmo' :'http://performedmusicontology.org/ontology/',
    'datatypes': 'http://id.loc.gov/datatypes/',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',
    'mstatus': 'https://id.loc.gov/vocabulary/mstatus/',
    'mnotetype': 'http://id.loc.gov/vocabulary/mnotetype/',
    'dcterms': 'http://purl.org/dc/terms/',
    'owl': 'http://www.w3.org/2002/07/owl#',
		'void':'http://rdfs.org/ns/void#',
    'lcc': 'http://id.loc.gov/ontologies/lcc#',
    'vartitletype': 'http://id.loc.gov/vocabulary/vartitletype/',
  },



  // these are the RDF:Types that are considered literals in the system
  LITERAL_TYPES: [
    'http://www.w3.org/2000/01/rdf-schema#Literal'
  ],




  /**
  * a convience function to say if a sepcific type of URI is a literal
  * this allows a single place to change what qualifies as a literal
  * @param {string} URI - the string URI to test
  * @return {bolean}
  */
  isUriALiteral: function(URI){
      if (URI && this.LITERAL_TYPES.map((v) => {return v.toLowerCase()}).indexOf(URI.toLowerCase()) > -1){
          return true
      }
      return false
  },


  /**
  * returns a Class type basedon the predicate from the the profiles
  * @param {string} propertyURI - the string URI to test
  * @param {obj} pt - the pt template from the profile
  * @return {string} URI - the uri of the type
  */
  suggestTypeProfile: function(propertyURI,pt){
      // grab the rtLookup from the profile store
      if (!rtLookup){
        rtLookup= useProfileStore().rtLookup
      }

      // if the component itself has it set then just return it we dont need to dig around
      if (propertyURI == pt.propertyURI){
          if (pt.valueConstraint &&
              pt.valueConstraint.valueDataType &&
              pt.valueConstraint.valueDataType.dataTypeURI &&
              pt.valueConstraint.valueDataType.dataTypeURI.trim() != ''){
              return pt.valueConstraint.valueDataType.dataTypeURI.trim()
          }
      }

      // find a template name to use
      if (pt && pt.valueConstraint && pt.valueConstraint && pt.valueConstraint.valueTemplateRefs && pt.valueConstraint.valueTemplateRefs.length>0){
          let possibleTypes = []
          for (let rtKey of pt.valueConstraint.valueTemplateRefs){
              if (rtLookup[rtKey]){
                  for (let p of rtLookup[rtKey].propertyTemplates){
                      if (p.propertyURI == propertyURI){
                          if (p.valueConstraint &&
                              p.valueConstraint.valueDataType &&
                              p.valueConstraint.valueDataType.dataTypeURI &&
                              p.valueConstraint.valueDataType.dataTypeURI.trim() != ''){
                              possibleTypes.push(p.valueConstraint.valueDataType.dataTypeURI.trim())
                          }
                      }
                  }
              }else{
                  console.warn("Did not find the requested template name", rtKey)
              }
          }

          possibleTypes = [...new Set(possibleTypes)];
          if (possibleTypes.length == 1){
              return possibleTypes[0]
          }

          // however if is brand NEW like they are just creating it now
          // meaning there is no @type on it yet then just look at the very first ref template and use that val
          let lookForResourceURI = false

          if (!pt.userValue[pt.propertyURI]){
              lookForResourceURI = true
          }else{
              if (pt.userValue[pt.propertyURI] && pt.userValue[pt.propertyURI][0]){
                  if (!pt.userValue[pt.propertyURI][0]['@type']){
                      lookForResourceURI = true
                  }
              }else{
                  lookForResourceURI = true
              }
          }

          if (lookForResourceURI){
              if (pt && pt.valueConstraint && pt.valueConstraint && pt.valueConstraint.valueTemplateRefs && pt.valueConstraint.valueTemplateRefs.length>0){
                  let rtKey = pt.valueConstraint.valueTemplateRefs[0]
                  if (rtLookup[rtKey]){
                      // suggest the resource
                      return rtLookup[rtKey].resourceURI
                  }else{
                      console.warn("Did not find the requested template name", rtKey)
                  }
              }
          }
      }

      return false

  },

  /**
  *
  *
  * @param {string} propertyURI - the string URI to test
  * @param {obj} pt - the pt template from the profile
  * @return {string} URI - the uri of the type
  */
  suggestTypeProfileForLiteralParent: function(propertyURI,pt){
      // grab the rtLookup from the profile store
      if (!rtLookup){
        rtLookup= useProfileStore().rtLookup
      }
      // only do this on templates that have one reference templates for now (may need to expand)
      if (pt.valueConstraint && pt.valueConstraint.valueTemplateRefs && pt.valueConstraint.valueTemplateRefs.length==1){
        let valueTemplateRef = pt.valueConstraint.valueTemplateRefs[0]
        // look through the pts of that template for the property, this will keep going recursivly if there are nested templates in the valueTemplateRefs
        let possibleTypePt = this.searchForProperty(valueTemplateRef,propertyURI)
        if (possibleTypePt && possibleTypePt.template.resourceURI){
          return possibleTypePt.template.resourceURI
        }
      }



  },

  /**
  * Searches through rtLookup recursivly looking for a property that matches in the resource template hierarchy at some level
  * once it it finds it at whatever level return that template to see if it has resourceURI on it to help @type things
  * @param {string} valueTemplateRef - the resource tempalte names like lc:bf2:something:else
  * @param {string} propertyUri - the property we are looking for
  * @return {object}  - an obj with the template from rtLookup and the pt from rtLookup of the match
  */
  searchForProperty: function(valueTemplateRef,propertyUri){
      // grab the rtLookup from the profile store
      if (!rtLookup){
        rtLookup= useProfileStore().rtLookup
      }

      let template = rtLookup[valueTemplateRef]
      let foundProperty = null
      let foundValueTemplateRefs = []
      if (template && template.propertyTemplates){
        for (let t of template.propertyTemplates){
          if (t.propertyURI == propertyUri){
            foundProperty = {template:template,pt:t}
            break
          }
          if (t.valueConstraint && t.valueConstraint.valueTemplateRefs){
            foundValueTemplateRefs = foundValueTemplateRefs.concat(t.valueConstraint.valueTemplateRefs)
          }
        }
      }
      if (foundProperty){
        return foundProperty
      }else{
        for (let lookfor of foundValueTemplateRefs){
          foundProperty = this.searchForProperty(lookfor,propertyUri)
          if (foundProperty){
            return foundProperty
          }
        }
      }




  },


  /**
  * returns a Class type basedon the range returned from the ontology
  * @param {string} propertyURI - the string URI to test
  * @return {string|boolean} URI - the uri of the type or false
  */
  suggestTypeNetwork: async function(propertyURI){
    let result = false

    // some very common hardcoded options
    if (propertyURI==='http://www.w3.org/2000/01/rdf-schema#label'){
      return 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }
    if (propertyURI==='http://www.loc.gov/mads/rdf/v1#authoritativeLabel'){
      return 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }

    if (propertyURI==='http://www.w3.org/1999/02/22-rdf-syntax-ns#value'){
      return 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }
    if (propertyURI==='http://www.loc.gov/mads/rdf/v1#componentList'){
      return 'http://www.w3.org/1999/02/22-rdf-syntax-ns#List'
    }
    if (propertyURI==='http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){
      return 'http://www.w3.org/2000/01/rdf-schema#Resource'
    }
    // If a subject gets edited, we can end up here and it'll return "rdfs:Resource" instead of "bf:Topic"
    if (propertyURI === 'http://id.loc.gov/ontologies/bibframe/subject'){
      return 'http://id.loc.gov/ontologies/bibframe/Topic'
    }




    // at this point we have a well cached lookup of the whole onotlogy in localstorage
    // ask for this one, if it idoesnt have it, it will relookup (or if it is expired)
    let propXml = await this.fetchOntology(propertyURI)
    let prop = XMLParser.parseFromString(propXml, "text/xml");
    let range = prop.getElementsByTagName("rdfs:range")

    let objProp = prop.getElementsByTagName("owl:ObjectProperty")
    let dataProp = prop.getElementsByTagName("owl:DatatypeProperty")

    // console.log("propXml",propXml)

    // if it has a range return it
    if (range.length>0){
      range=range[0]
      if (range.attributes['rdf:resource']){
        result = range.attributes['rdf:resource'].value
        return result
      }
    }else{
      // check if it has a rdfs:subPropertyOf, if it does then we can ask for that
      let subPropertyOf = prop.getElementsByTagName("rdfs:subPropertyOf")
      if (subPropertyOf.length>0){
        if (subPropertyOf[0].attributes['rdf:resource']){
          let subPropertyResult = await this.suggestTypeNetwork(subPropertyOf[0].attributes['rdf:resource'].value)
          if (subPropertyResult){
            return subPropertyResult
          }
        }
      }
    }

    // let profileLookup = parseProfile.suggestType(propertyURI,resourceTemplateId)
    // if (profileLookup != false){
    //   result = profileLookup
    // }

    // some try something else
    // TODO if needed


    // some properties being used are not available yet....
    if (propertyURI==='http://id.loc.gov/ontologies/bfsimple/prefTitle'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }
    if (propertyURI==='http://id.loc.gov/ontologies/bfsimple/variantTitle'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }
    if (propertyURI==='http://id.loc.gov/ontologies/bfsimple/transTitle'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }

    if (propertyURI==='http://id.loc.gov/ontologies/bflc/date'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }
    if (propertyURI==='http://id.loc.gov/ontologies/bflc/aap-normalized'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }
    if (propertyURI==='http://id.loc.gov/ontologies/bflc/aap'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }

    if (result==='http://id.loc.gov/ontologies/bflc/date'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }

    // EDTF Switch here

    if (result=='http://www.loc.gov/standards/datetime/pre-submission.html'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }



    // Remove these when BFLC ontology is updated
    if (propertyURI==='http://id.loc.gov/ontologies/bflc/simplePlace'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }
    if (propertyURI==='http://id.loc.gov/ontologies/bflc/simpleAgent'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }
    if (propertyURI==='http://id.loc.gov/ontologies/bflc/simpleDate'){
      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'
    }

    if (objProp.length > 0){
      // at least we know it is a resource

      result = 'http://www.w3.org/2000/01/rdf-schema#Resource'

    }
    if (dataProp.length > 0){
      // at least we know it is a literal

      result = 'http://www.w3.org/2000/01/rdf-schema#Literal'

    }







    if (result===false){
      console.warn('Could not @type this ',propertyURI)
    }



    // if fails
    return result





  },

  /**
  * Takes care of calling and storing in the local storage the response a URI
  * used to figure out the @type for blanknodes
  * @param {string} url - the string URI to test
  * @return {obj} - the objext response from the server, also stores it in the localstorage
  */

  fetchOntology: async function(url){

    // we are going to look into the local storage to see if we have a cache version of this URI from
    // less than 24 hours ago
    let currentTS = Math.floor(Date.now() / 1000)

    if (window.localStorage && window.localStorage.getItem('ontology_'+url+'.rdf')){
      let response = JSON.parse(window.localStorage.getItem('ontology_'+url+'.rdf'))
      // make sure it is valid
      if (response && response.response && response.ts){
        if (currentTS - response.ts < (86400*1)){
          // we have a fresh catch less than 1 day old, use that instead of asking the srver
          return response.response
        }
      }
    }

    if (url.endsWith('.rdf')===false){
      url = url + '.rdf'
    }

    let r

    try{
      r = await utilsNetwork.fetchSimpleLookup(url)
    }catch{
      return false
    }



    // if we got here set that localstorage for next time
    if (window.localStorage){
      let toset = {response: r, ts: currentTS}
      window.localStorage.setItem('ontology_'+url, JSON.stringify(toset))
    }

    return r
  },

  /**
  * Gose through all URIs used in the profiles and stores their info, used to figure out the @type for blanknodes
  * @param {string} url - the string URI to test
  * @return {obj} - the objext response from the server, also stores it in the localstorage
  */

  fetchAllOntology: async function(profiles){

    let allData = {}

    for (let key of Object.keys(profiles.lookup)){

      if (profiles.lookup[key].resourceURI.includes('id.loc.gov/ontologies/')){
        // console.log(profiles.lookup[key])
        let r = await this.fetchOntology(profiles.lookup[key].resourceURI)
        allData[profiles.lookup[key].resourceURI] = r
      }

      for (let pt of profiles.lookup[key].propertyTemplates){
        if (pt.propertyURI.includes('id.loc.gov/ontologies/')){
          // console.log(pt.propertyURI)
          let r = await this.fetchOntology(pt.propertyURI)
          allData[pt.propertyURI] = r
        }
      }


    }

    return allData

  },


  /**
  * Ask it if the first param URI is a subclass of the second param URI
  * @param {string} propertyURI - the string URI to test
  * @param {string} possibleParentClassPropertyURI - the string URI to test if propertyURI is a subclass of it
  * @return {boolean} - true it is or false it isn't
  */
  isSubClassOf: async function(propertyURI,possibleParentClassPropertyURI){
    // ask for the property
    let propXml = await this.fetchOntology(propertyURI)
    let prop = XMLParser.parseFromString(propXml, "text/xml");
    let subclassOf = prop.getElementsByTagName("rdfs:subClassOf")
    let result = null
    if (subclassOf.length>0){
      subclassOf=subclassOf[0]
      if (subclassOf.attributes['rdf:resource']){
        result = subclassOf.attributes['rdf:resource'].value
      }
    }
    if (result == possibleParentClassPropertyURI){
      return true
    }
    return false
  }





}


export default utilsRDF;
