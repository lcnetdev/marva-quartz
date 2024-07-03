import {useConfigStore} from "../stores/config";
import {useProfileStore} from "../stores/profile";

import short from 'short-uuid'

import utilsRDF from './utils_rdf';



const utilsParse = {

  data: {   
    work: [],
    instance: [],
    item:[]
  },

  activeDom: null,
  hasItem: false,


  namespace: utilsRDF.namespace,


  /**
  * Tests if a URI string is likely an RDF Class
  * 
  * @param {string} uri - the URI to test
  * @return {boolean}
  */
  isClass: function(uri){

    // just testing a few name spaces here
    if (uri.match(/bf:[A-Z]/)){
      return true
    }
    if (uri.match(/bflc:[A-Z]/)){
      return true
    }
    if (uri.match(/madsrdf:[A-Z]/)){
      return true
    }
    if (uri.match(/rdfs:[A-Z]/)){
      return true
    }
    if (uri.match(/rdf:[A-Z]/)){
      return true
    }
    if (uri.match(/lclocal:[A-Z]/)){
      return true
    }

    // for (let nsKey of Object.keys(this.namespace)){

    //  let pattern = `${nsKey}:[A-Z]/`
    //  let re = new RegExp(pattern,"g");

    //  if (re.match(uri)){
    //    return true
    //  }

    // }
    return false

  },

  /**
  * Takes a URI and turns it into the shortened namespaced version bf:whatever
  * 
  * @param {string} uri - the URI to convert
  * @return {string} - the namespaced version
  */
  namespaceUri: function(uri){  
    for (let ns in this.namespace){
      let nsuri = this.namespace[ns]
      if (uri.includes(nsuri)){
        return uri.replace(nsuri,`${ns}:`)
      }
    }
  },


  /**
  * Takes a shortened namespaced version bf:whatever and turns it into the full URI
  * 
  * @param {string} uri - the URI to convert
  * @return {string} - the full version
  */
  UriNamespace: function(passedNS){
    for (let ns in this.namespace){
      let nsuri = this.namespace[ns]
      if (passedNS.startsWith(`${ns}:`)){
        return passedNS.replace(`${ns}:`,nsuri)
      }
    }
  },

  /**
  * Small helper to add a modifer to URIs being pulled from the data
  * 
  * @param {string} uri - the URI to extract
  * @return {string} - the modified URI
  */
  extractURI: function(uri){
    uri=uri.replace('https://id.loc.gov','http://id.loc.gov')
    return uri
  },

  /**
  * Returns the first child of where the parent is a spefific XML node
  * 
  * @param {dom} selection - XML dom tree to parse
  * @param {string} requiredParent - the tagName of parent that is requreid
  * @return {dom} - the dom xml of the result
  */
  returnOneWhereParentIs: function(selection, requiredParent){  
    if (selection.length == 1){
      if (selection[0].parentNode.tagName === requiredParent){
        return selection[0]
      }else{
        return false
      }     
    }
    for (let el of selection){
      
      if (el.parentNode.tagName === requiredParent){
        return el
      }
    }
    return false
  },

  /**
  * For ID uris, return the code from the uri 
  * 
  * @param {string} uri - the URI to test
  * @return {string} - the trailing part of the uri
  */
  returnLookupListFromURI: function(uri){

    // its an ID vocab, just split off the end and use that 
    if (uri.includes('http://id.loc.gov/vocabulary/') || uri.includes('https://id.loc.gov/vocabulary/')){
      uri = uri.split('/')
      uri.splice(-1,1)
      uri = uri.join('/')
      return uri
    }    
    return false
  },



  testSeperateRdfTypeProperty: function(pt){
    if (pt.valueConstraint && pt.valueConstraint.valueTemplateRefs){
      for (let id of pt.valueConstraint.valueTemplateRefs){
        if (useProfileStore().rtLookup[id]){          
          for (let p of useProfileStore().rtLookup[id].propertyTemplates){
            if (p.propertyURI === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){
              return true
            }
          }
        }
      }
    }   
    return false
  },



  /**
  * Takes the XML and parses it
  * 
  * @param {string} xml - the XML payload
  * @return {void}
  */
  parseXml: function(xml){

    // if (!xml){
    //   xml = this.testXml
    // } 

    this.xmlSource = xml
    // use the browser if we can, should be faster, fall back to the library if not running in the browser
    if (window.DOMParser){
      let parser = new DOMParser();

      this.activeDom = parser.parseFromString(xml, "text/xml");
      this.testDom = parser.parseFromString(xml, "text/xml");

      // test to see if there are any Items,
      this.hasItem = this.activeDom.getElementsByTagName('bf:Item').length
      this.hasInstance = this.activeDom.getElementsByTagName('bf:Instance').length

    // the library very much doesn't work on anything but chrome
    // }else{
    //  this.activeDom = new jsdom.JSDOM(xml, {
    //    contentType: "text/xml",
    //    storageQuota: 10000000
    //  })
    //  this.activeDom = this.dom.window.document
    }
  },


  specialTransforms: {
    // not currently used
  },


  transformRts: async function(profile){

    let toDeleteNoData = []

    for (const pkey in profile.rt) {

      let tle = ""      
      if (pkey.includes(':Work')){
        tle = "bf:Work"
      }else if (pkey.includes(':Instance')){
        tle = "bf:Instance"
      }else if (pkey.includes(':Item')){
        tle = "bf:Item"
      }else if (pkey.endsWith(':Hub')){
        tle = "bf:Hub"
      }else{
        // don't mess with anything other than top level entities in the profile, remove them from the profile
        continue
      }

      // select the right part of the profile
      let pt = profile.rt[pkey].pt
      let xml = this.activeDom.getElementsByTagName(tle)

      // store this here for easy access to the error report
      profile.xmlSource = this.xmlSource
      
      
      // only return the top level, no nested related things
      xml = this.returnOneWhereParentIs(xml, "rdf:RDF")
      console.log('selecting to process:',xml)

      if (xml === false && tle == 'bf:Hub'){
        tle = "bf:Work"
        console.warn('No bf:Hub found, looking for bf:Work')
        if (testRun){
          xml = this.testDom.getElementsByTagName(tle)
        }else{
          xml = this.activeDom.getElementsByTagName(tle)
        }
        xml = this.returnOneWhereParentIs(xml, "rdf:RDF")
        console.log('selecting to process:',xml)
      }
      if (xml===false){
        console.warn(tle,'was not processed because it failed the top level test, must be a nested resource?')
        toDeleteNoData.push(pkey)
        continue
      }

      // for whatever reason
      if (!xml){
        console.warn('Could not find the requested XML fragment, looking for ', tle)
        toDeleteNoData.push(pkey)
        continue
      }


      // does this tle have a URI or a type?
      if (xml.attributes['rdf:resource']){
        profile.rt[pkey].URI = xml.attributes['rdf:resource'].value
      }else if(xml.attributes['rdf:about']){
        profile.rt[pkey].URI = xml.attributes['rdf:about'].value
      }



      //let rdftype = xml.getElementsByTagName('rdf:type')
      for (let child of xml.children){ 
        if (child.tagName == 'rdf:type'){
          if (child.attributes['rdf:resource']){
            profile.rt[pkey]['@type'] = child.attributes['rdf:resource'].value
            // remove it from the XML since we haev the data
            child.parentNode.removeChild(child)
          }
        }
      }


      // find the instanceOfs
      if (tle == 'bf:Instance'){
        if (xml.getElementsByTagName('bf:instanceOf').length>0){
          let instanceOf = xml.getElementsByTagName('bf:instanceOf')[0]
          if (instanceOf.attributes['rdf:resource']){
            profile.rt[pkey].instanceOf = instanceOf.attributes['rdf:resource'].value
          }else if(instanceOf.attributes['rdf:about']){
            profile.rt[pkey].instanceOf = instanceOf.attributes['rdf:about'].value
          }         


        }
        
      }

      // find itemOf
      if (tle == 'bf:Item'){
        if (xml.getElementsByTagName('bf:itemOf').length>0){
          let itemOf = xml.getElementsByTagName('bf:itemOf')[0]
          if (itemOf.attributes['rdf:resource']){
            profile.rt[pkey].itemOf = itemOf.attributes['rdf:resource'].value
          }else if(itemOf.attributes['rdf:about']){
            profile.rt[pkey].itemOf = itemOf.attributes['rdf:about'].value
          }     
          // delete it
          itemOf.remove()
        }
      }

      let sucessfulProperties  = []
      let sucessfulElements  = []

      // at this point we have the main piece of the xml tree that has all our data
      // loop through properties we are looking for and build out the the profile
      for (let k in pt){

        let ptk = JSON.parse(JSON.stringify(pt[k]))
        // make sure each new one has a unique guid
        ptk['@guid'] = short.generate()

        // remove any default values since we will be populating from the record
        // ptk.valueConstraint.defaultsBackup = JSON.parse(JSON.stringify(ptk.valueConstraint.defaults))
        ptk.valueConstraint.defaults=[]

        let propertyURI = ptk.propertyURI
        let prefixURI = this.namespaceUri(propertyURI)

        // we only want top level elements, not nested things like dupe notes etc.
        let el = []
        for (let e of xml.children){
          if (this.UriNamespace(e.tagName) == propertyURI){
            el.push(e)
          }
        }
        

        // Some structural things here to hardcode
        if (propertyURI==='http://id.loc.gov/ontologies/bibframe/Work'){
          // did we find a URI for it?
          if (profile.rt[pkey].URI){
            ptk.userValue={
              '@root': 'http://id.loc.gov/ontologies/bibframe/Work',
              '@guid': short.generate() ,
              '@id': profile.rt[pkey].URI,
            }            
          }          
          pt[k] = ptk
          continue
        }



        // sometimes the profile has a rdf:type selectable in the profile itself, we probably 
        // took that piece of data out eariler and set it at the RT level, so fake that userValue for this piece of
        // data in the properties because el will be empty
        if (profile.rt[pkey]['@type'] && propertyURI == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){
          ptk.userValue={
            '@root': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
            '@guid': short.generate() ,
            '@id': profile.rt[pkey]['@type'],
          }
          pt[k] = ptk
          continue
        }



        if (el.length>0){

          // console.log("Putting ", el)
          // console.log("Into ", ptk)

          // we have that element
          sucessfulProperties.push(prefixURI)

          ptk.hasData = true
          ptk.canBeHidden = false
          
          // loop through all of them
          let counter = 0
          for (let e of el){

            // some special checks here first
            // differentiate between creator and contributor
            if (ptk.propertyURI == 'http://id.loc.gov/ontologies/bibframe/contribution'){
              // console.log("Found contributor")
              let isPrimaryContribXML = false


              if (useConfigStore().profileHacks.removeExtraFieldsInContributor.enabled){
                for (let aEl of e.getElementsByTagName('bflc:name00MatchKey')){
                  aEl.remove()
                }
                for (let aEl of e.getElementsByTagName('bflc:primaryContributorName00MatchKey')){
                  aEl.remove()
                }
                for (let aEl of e.getElementsByTagName('bflc:name00MarcKey')){
                  aEl.remove()
                }

              }


              // does it have a rdf type of that 
              for (let typeEl of e.getElementsByTagName('rdf:type')){
                if (typeEl.attributes['rdf:resource']){
                  console.log(typeEl.attributes['rdf:resource'])
                }
                if (typeEl.attributes['rdf:resource'] && typeEl.attributes['rdf:resource'].value == 'http://id.loc.gov/ontologies/bflc/PrimaryContribution'){
                  isPrimaryContribXML = true
                }
                if (typeEl.attributes['rdf:resource'] && typeEl.attributes['rdf:resource'].value == 'http://id.loc.gov/ontologies/bibframe/PrimaryContribution'){
                  isPrimaryContribXML = true
                }                
              }

              // or is using the <bflc:PrimaryContribution> element
              if (e.getElementsByTagName('bflc:PrimaryContribution').length>0){
                isPrimaryContribXML = true
              }
              if (e.getElementsByTagName('bf:PrimaryContribution').length>0){
                isPrimaryContribXML = true
              }
              // console.log("isPrimaryContribXML",isPrimaryContribXML)

              if (ptk.valueConstraint.valueDataType.dataTypeURI && (ptk.valueConstraint.valueDataType.dataTypeURI == "http://id.loc.gov/ontologies/bflc/PrimaryContribution" || ptk.valueConstraint.valueDataType.dataTypeURI == "http://id.loc.gov/ontologies/bibframe/PrimaryContribution")){
                // the ptk says yes, if the xml doesn't jump to next
                if (!isPrimaryContribXML){
                  console.log("Skipping the ptk says yes, if the xml doesn't jump to next")
                  continue
                }
              }else{
                // the ptk says no, if the xml says yesh jump to next
                if (isPrimaryContribXML){
                  console.log("Skipping the ptk says no, if the xml says yesh jump to next",ptk.valueConstraint.valueDataType.dataTypeURI)
                  continue
                }
              }
            }

            // start populating the data
            let populateData = null
            populateData = JSON.parse(JSON.stringify(ptk))
            // save the source xml for later display
            populateData.xmlSource = e.outerHTML

            populateData['@guid'] = short.generate()
          
            // if (this.tempTemplates[hashCode(populateData.propertyURI + populateData.xmlSource)]){
            //   populateData.valueConstraint.valueTemplateRefs.push(this.tempTemplates[hashCode(populateData.propertyURI + populateData.xmlSource)])              
            // }


            // we want all userValues to includ the root predicate property
            // we will map that to the base level to make things cleaner below
            // so populateData.userValue['http://id.loc.gov/bibframe/title'] becomes userValue              
            populateData.userValue[populateData.propertyURI] = [{}]
            let userValue = populateData.userValue[populateData.propertyURI][0]

            
            // we have some special functions to deal with tricky elements
            if (this.specialTransforms[prefixURI]){
              // make sure to pass the current 'this' context to the functions that use helper functions at this level like this.UriNamespace
              populateData = this.specialTransforms[prefixURI].call(this,e,populateData)  
              

            }else if (e.children.length == 0){          

              
              // if (!populateData.userValue){
                userValue['@guid'] = short.generate()
              // }

              let eProperty = this.UriNamespace(e.tagName)

              // could be a first level bnode with no children
              console.log(e.tagName,this.isClass(e.tagName))
              if (this.isClass(e.tagName)){
                
                userValue['@type'] = this.UriNamespace(e.tagName)

                // check for URI
                if (e.attributes && e.attributes['rdf:about']){
                  userValue['@id'] = this.extractURI(e.attributes['rdf:about'].value)
                }else if (e.attributes && e.attributes['rdf:resource']){
                  userValue['@id'] = this.extractURI(e.attributes['rdf:resource'].value)
                }else{
                  // console.log('No URI for this child property')
                }

              }else if (this.UriNamespace(e.tagName) == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){
                
                if (this.testSeperateRdfTypeProperty(populateData)){
                  console.warn("Need to account for rdf:type at this level.")
                }
                // if there is a RDF type node here it is the parent's type
                // overwrite the basic type that was set via the bnode type
                if (e.attributes && e.attributes['rdf:about']){
                  userValue['@type'] = e.attributes['rdf:about'].value
                }else if (e.attributes && e.attributes['rdf:resource']){
                  userValue['@type'] = e.attributes['rdf:resource'].value
                }else{
                  console.warn('---------------------------------------------')
                  console.warn('There was a e RDF Type node but could not extract the type')
                  console.warn(e)
                  console.warn('---------------------------------------------')
                }



              }else if (e.attributes['rdf:resource'] && e.innerHTML.trim() == ''){
                
                // it is a property pointing to another resource with no label or anything
                userValue['@guid'] = short.generate()
                userValue['@id'] = this.extractURI(e.attributes['rdf:resource'].value)

                // for now since there is no label make a basic lable for it with the URI slug
                // userValue['http://www.w3.org/2000/01/rdf-schema#label'] = [
                //  {
                //  "http://www.w3.org/2000/01/rdf-schema#label": userValue['@id'].split('/').slice(-1)[0],
                //  "@guid": short.generate()
                //  }               
                // ]

              }else{
                


                if (!userValue[eProperty]){
                  userValue[eProperty] = []
                }

                // it doesn't have any children, so it will be a literal or something like that
                // let eData = {'@guid': short.generate()}

                if (e.attributes && e.attributes['rdf:about']){
                  userValue['@id'] = this.extractURI(e.attributes['rdf:about'].value)
                }else if (e.attributes && e.attributes['rdf:resource']){
                  userValue['@id'] = this.extractURI(e.attributes['rdf:resource'].value)
                }else{
                  // console.log('No URI for this child property')
                }

                if (e.innerHTML != null && e.innerHTML.trim() != ''){
                  userValue[eProperty] = e.innerHTML

                  // does it have a data type or lang                 
                  if (e.attributes && e.attributes['rdf:datatype']){
                    userValue['@datatype'] = e.attributes['rdf:datatype'].value
                  }
                  if (e.attributes && e.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype']){
                    userValue['@datatype'] = e.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype'].value
                  }
                  if (e.attributes && e.attributes['xml:lang']){
                    userValue['@language'] = e.attributes['xml:lang'].value
                  }
                  if (e.attributes && e.attributes['rdf:parseType']){
                    userValue['@parseType'] = e.attributes['rdf:parseType'].value
                  }                 


                }

                
                // console.log(userValue)


              }





                    
            }else{



              if (e.children.length > 1){
                console.error('---------------------------------------------')
                console.error('There are more than one 1st lvl bnodes!!!!!!!')
                console.error(e)
                console.error('---------------------------------------------')
              }


              // loop through.... though don't really need to loop, 
              // this is the main bnode <bf:title><bf:Title> 
              for (let child of e.children){

                // the inital bnode
                userValue['@guid'] = short.generate()

                // set the type of this bnode
                userValue['@type'] = this.UriNamespace(child.tagName)

                // does this thing have a URI?
                // <bf:title><bf:Title rdf:about="http://...."> 

                if (child.attributes && child.attributes['rdf:about']){
                  userValue['@id'] = this.extractURI(child.attributes['rdf:about'].value)
                }else if (child.attributes && child.attributes['rdf:resource']){
                  userValue['@id'] = this.extractURI(child.attributes['rdf:resource'].value)
                }else{


                  // console.warn(this.UriNamespace(child.tagName), 'Does not have a RDF Type')
                  // this is okay, it mostly won't
                }

                // now loop through all the children 
                for (let gChild of child.children){


                  if (this.UriNamespace(gChild.tagName) == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){
                    
                    if (this.testSeperateRdfTypeProperty(populateData)){

                      // we have a patern, in notes for example, where we are storing the type in a single rdftype 
                      // predicate and the don't want to change the orginal type. so look through the templates and see
                      // if that pt has a standalone rdf:type predicate defined, if so populate just that and don't overwrite
                      let rdfTypeUri = null
                      if (gChild.attributes && gChild.attributes['rdf:resource']){
                        rdfTypeUri = gChild.attributes['rdf:resource'].value
                      }else if (gChild.attributes && gChild.attributes['rdf:about']){
                        rdfTypeUri = gChild.attributes['rdf:about'].value
                      }
                      // if they used a uncontrolled value then there is no uri, just a literal
                      // normally we don't care about the literal even if it exists because we can just load the label
                      if (rdfTypeUri){
                        userValue['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = [
                          {
                          "@guid": short.generate(),
                          "@id" : rdfTypeUri
                          }
                        ]
                      }else if (gChild.innerHTML && gChild.innerHTML.trim() != ''){
                        // but if there is no uri but there is a label in there build it out so it renders correctly in the interface
                        userValue['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = [
                          {
                          "@guid": short.generate(),
                          "http://www.w3.org/2000/01/rdf-schema#label": [
                            {
                            "@guid": short.generate(),
                            "http://www.w3.org/2000/01/rdf-schema#label": gChild.innerHTML
                            }
                          ]
                          }
                        ]
                      }

                    }else{

                      // if there is a RDF type node here it is the parent's type
                      // overwrite the basic type that was set via the bnode type
                      if (gChild.attributes && gChild.attributes['rdf:about']){
                        userValue['@type'] = gChild.attributes['rdf:about'].value
                      }else if (gChild.attributes && gChild.attributes['rdf:resource']){
                        userValue['@type'] = gChild.attributes['rdf:resource'].value
                      }else{
                        console.warn('---------------------------------------------')
                        console.warn('There was a gChild RDF Type node but could not extract the type')
                        console.warn(gChild)
                        console.warn('---------------------------------------------')
                      }

                    }
                  }else if (gChild.children.length ==0){

                    let gChildProperty = this.UriNamespace(gChild.tagName)


                    // if it a one liner Class w/ no children add it in as its own obj otherwise it is a 
                    // literal or something
                    if (this.isClass(gChild.tagName)){
                      let gChildData = {'@guid': short.generate()}
                      userValue[gChildProperty].push(gChildData)

                    }else{


                      if (!userValue[gChildProperty]){
                        userValue[gChildProperty] = []
                      }

                      // it doesn't have any children, so it will be a literal or something like that
                      let gChildData = {'@guid': short.generate()}

                      if (gChild.attributes && gChild.attributes['rdf:about']){
                        gChildData['@id'] = this.extractURI(gChild.attributes['rdf:about'].value)
                      }else if (gChild.attributes && gChild.attributes['rdf:resource']){
                        gChildData['@id'] = this.extractURI(gChild.attributes['rdf:resource'].value)
                      }else{
                        // console.log('No URI for this child property')
                      }

                      if (gChild.innerHTML != null && gChild.innerHTML.trim() != ''){
                        gChildData[gChildProperty] = gChild.innerHTML
                        
                        // does it have a data type or lang                 
                        if (gChild.attributes && gChild.attributes['rdf:datatype']){
                          gChildData['@datatype'] = gChild.attributes['rdf:datatype'].value
                        }
                        if (gChild.attributes && gChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype']){
                          gChildData['@datatype'] = gChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype'].value
                        }
                        if (gChild.attributes && gChild.attributes['xml:lang']){
                          gChildData['@language'] = gChild.attributes['xml:lang'].value
                        }
                        if (gChild.attributes && gChild.attributes['rdf:parseType']){
                          gChildData['@parseType'] = gChild.attributes['rdf:parseType'].value
                        } 

                      }

                      userValue[gChildProperty].push(gChildData)


                    }


                  

                  }else{

                    // example > <bf:title><bf:Title> <bf:mainTitle>

                    // if we dont have that property yet add it
                    let gChildProperty = this.UriNamespace(gChild.tagName)

                    if (!userValue[gChildProperty]){
                      userValue[gChildProperty] = []
                    }

                    let gChildData = {'@guid': short.generate()}




                    for (let ggChild of gChild.children){



                      // if its a bnode then loop through the children, 
                      if (this.isClass(ggChild.tagName)){

                        // mint a new one for this iteration, since there could be multiple classes nested
                        gChildData = {'@guid': short.generate()}

                        // <bf:genreForm xmlns:bf="http://id.loc.gov/ontologies/bibframe/">
                        //   <bf:GenreForm xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" rdf:about="https://id.loc.gov/authorities/genreForms/gf2014026639">
                        //     <rdf:type rdf:resource="http://www.loc.gov/mads/rdf/v1#Topic"/>
                        //     <rdfs:label xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Art music.</rdfs:label>
                        //     <madsrdf:authoritativeLabel xmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#">Art music.</madsrdf:authoritativeLabel>
                        //     <bf:source>
                        //       <bf:Source rdf:about="http://id.loc.gov/vocabulary/genreFormSchemes/fast">
                        //         <bf:code>fast</bf:code>
                        //       </bf:Source>
                        //     </bf:source>
                        //     <bf:identifiedBy>
                        //       <bf:Identifier> ~~~~~~~~~~~~~YOU ARE HERE ~~~~~~~~~~~~
                        //         <rdf:value>fst01920007</rdf:value>
                        //         <bf:source>
                        //           <bf:Source> 
                        //             <bf:code>OCoLC</bf:code>
                        //           </bf:Source>
                        //         </bf:source>
                        //       </bf:Identifier>
                        //     </bf:identifiedBy>
                        //   </bf:GenreForm>
                        // </bf:genreForm>




                        gChildData['@type'] = this.UriNamespace(ggChild.tagName)

                        // check for URI
                        if (ggChild.attributes && ggChild.attributes['rdf:about']){
                          gChildData['@id'] = this.extractURI(ggChild.attributes['rdf:about'].value)
                        }else if (ggChild.attributes && ggChild.attributes['rdf:resource']){
                          gChildData['@id'] = this.extractURI(ggChild.attributes['rdf:resource'].value)
                        }else{
                          // console.log('No URI for this child property')
                        }



                        // now loop through these ggchildren, they are properties of this bnode
                        for (let gggChild of ggChild.children){



                          // not a bnode, just a one liner property of the bnode      
                          if (this.UriNamespace(gggChild.tagName) == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){


                            if (gggChild.attributes && gggChild.attributes['rdf:about']){
                              gChildData['@type'] = gggChild.attributes['rdf:about'].value
                            }else if (gggChild.attributes && gggChild.attributes['rdf:resource']){
                              gChildData['@type'] = gggChild.attributes['rdf:resource'].value
                            }else{
                              console.warn('---------------------------------------------')
                              console.warn('There was a gggChild RDF Type node but could not extract the type')
                              console.warn(gggChild)
                              console.warn('---------------------------------------------')
                            }


                          }else if (gggChild.children.length ==0){


                              let gggChildProperty = this.UriNamespace(gggChild.tagName)

                              if (!gChildData[gggChildProperty]){
                                gChildData[gggChildProperty] = []
                              }

                              // it doesn't have any children, so it will be a literal or something like that
                              let gggChildData = {'@guid': short.generate()}
                              if (gggChild.attributes && gggChild.attributes['rdf:about']){
                                gggChildData['@id'] = this.extractURI(gggChild.attributes['rdf:about'].value)
                              }else if (gggChild.attributes && gggChild.attributes['rdf:resource']){
                                gggChildData['@id'] = this.extractURI(gggChild.attributes['rdf:resource'].value)
                              }else{
                                // console.log('No URI for this child property')
                              }

                              if (gggChild.innerHTML != null && gggChild.innerHTML.trim() != ''){
                                gggChildData[gggChildProperty] = gggChild.innerHTML
                                // does it have a data type or lang                 
                                if (gggChild.attributes && gggChild.attributes['rdf:datatype']){
                                  gggChildData['@datatype'] = gggChild.attributes['rdf:datatype'].value
                                }
                                if (gggChild.attributes && gggChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype']){
                                  gggChildData['@datatype'] = gggChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype'].value
                                }
                                if (gggChild.attributes && gggChild.attributes['xml:lang']){
                                  gggChildData['@language'] = gggChild.attributes['xml:lang'].value
                                }
                                if (gggChild.attributes && gggChild.attributes['rdf:parseType']){
                                  gggChildData['@parseType'] = gggChild.attributes['rdf:parseType'].value
                                } 


                              }

                              gChildData[gggChildProperty].push(gggChildData)



                          }else{


                            // if it has children then it means it is a predicate to another nested
                            // bnode

                            // so create a new obj and load it into the structure
                            let gggChildProperty = this.UriNamespace(gggChild.tagName)


                            if (!gChildData[gggChildProperty]){
                              gChildData[gggChildProperty] = []
                            }

                            // new obj
                            let gggData = {'@guid': short.generate()}


                            for (let ggggChild of gggChild.children){


                              if (this.isClass(ggggChild.tagName)){


                                // <bf:genreForm xmlns:bf="http://id.loc.gov/ontologies/bibframe/">
                                //   <bf:GenreForm xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" rdf:about="https://id.loc.gov/authorities/genreForms/gf2014026639">
                                //     <rdf:type rdf:resource="http://www.loc.gov/mads/rdf/v1#Topic"/>
                                //     <rdfs:label xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Art music.</rdfs:label>
                                //     <madsrdf:authoritativeLabel xmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#">Art music.</madsrdf:authoritativeLabel>
                                //     <bf:source>
                                //       <bf:Source rdf:about="http://id.loc.gov/vocabulary/genreFormSchemes/fast">
                                //         <bf:code>fast</bf:code>
                                //       </bf:Source>
                                //     </bf:source>
                                //     <bf:identifiedBy>
                                //       <bf:Identifier>
                                //         <rdf:value>fst01920007</rdf:value>
                                //         <bf:source>
                                //           <bf:Source> ~~~~~~~~~~~~~YOU ARE HERE ~~~~~~~~~~~~
                                //             <bf:code>OCoLC</bf:code>
                                //           </bf:Source>
                                //         </bf:source>
                                //       </bf:Identifier>
                                //     </bf:identifiedBy>
                                //   </bf:GenreForm>
                                // </bf:genreForm>


                                gggData['@type'] = this.UriNamespace(ggggChild.tagName)


                                // check for URI
                                if (ggggChild.attributes && ggggChild.attributes['rdf:about']){
                                  gggData['@id'] = this.extractURI(ggggChild.attributes['rdf:about'].value)
                                }else if (ggggChild.attributes && ggggChild.attributes['rdf:resource']){
                                  gggData['@id'] = this.extractURI(ggggChild.attributes['rdf:resource'].value)
                                }else{
                                  // console.log('No URI for this child property')
                                }




                                // now loop through this bnodes decendents, this is the limit tho

                                for (let gggggChild of ggggChild.children){


                                  let gggggChildProperty = this.UriNamespace(gggggChild.tagName)

                                  if (this.UriNamespace(gggggChild.tagName) == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){


                                    if (gggggChild.attributes && gggggChild.attributes['rdf:about']){
                                      gggData['@type'] = gggggChild.attributes['rdf:about'].value
                                    }else if (gggggChild.attributes && gggggChild.attributes['rdf:resource']){
                                      gggData['@type'] = gggggChild.attributes['rdf:resource'].value
                                    }else{
                                      console.warn('---------------------------------------------')
                                      console.warn('There was a gggChild RDF Type node but could not extract the type')
                                      console.warn(gggggChild)
                                      console.warn('---------------------------------------------')
                                    }


                                  }else if (gggggChild.children.length ==0){



                                      if (!gggData[gggggChildProperty]){
                                        gggData[gggggChildProperty] = []
                                      }

                                      // it doesn't have any children, so it will be a literal or something like that
                                      let ggggChildData = {'@guid': short.generate()}

                                      if (gggggChild.attributes && gggggChild.attributes['rdf:about']){
                                        gggData['@id'] = this.extractURI(gggggChild.attributes['rdf:about'].value)
                                      }else if (gggggChild.attributes && gggggChild.attributes['rdf:resource']){
                                        gggData['@id'] = this.extractURI(gggggChild.attributes['rdf:resource'].value)
                                      }else{
                                        // console.log('No URI for this child property')
                                      }

                                      if (gggggChild.innerHTML != null && gggggChild.innerHTML.trim() != ''){
                                        ggggChildData[gggggChildProperty] = gggggChild.innerHTML
                                        
                                        // does it have a data type or lang                 
                                        if (gggggChild.attributes && gggggChild.attributes['rdf:datatype']){
                                          ggggChildData['@datatype'] = gggggChild.attributes['rdf:datatype'].value
                                        }
                                        if (gggggChild.attributes && gggggChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype']){
                                          ggggChildData['@datatype'] = gggggChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype'].value
                                        }
                                        if (gggggChild.attributes && gggggChild.attributes['xml:lang']){
                                          ggggChildData['@language'] = gggggChild.attributes['xml:lang'].value
                                        }
                                        if (gggggChild.attributes && gggggChild.attributes['rdf:parseType']){
                                          ggggChildData['@parseType'] = gggggChild.attributes['rdf:parseType'].value
                                        } 


                                      }

                                      gggData[gggggChildProperty].push(ggggChildData)



                                  }else{
                                      console.warn('---------------------------------------------')
                                      console.warn('Reached the max depth for hiearchy, cannot read the properties nested below')
                                      console.warn(gggggChild)
                                      console.warn(ggggChild)
                                      console.warn('---------------------------------------------')
                                  }





                                }



                              }else{


                                let ggggChildProperty = this.UriNamespace(ggggChild.tagName)

                                if (!gggData[ggggChildProperty]){
                                  gggData[ggggChildProperty] = []
                                }

                                // it doesn't have any children, so it will be a literal or something like that

                                if (ggggChild.attributes && ggggChild.attributes['rdf:about']){
                                  gggData['@id'] = this.extractURI(ggggChild.attributes['rdf:about'].value)
                                }else if (ggggChild.attributes && ggggChild.attributes['rdf:resource']){
                                  gggData['@id'] = this.extractURI(ggggChild.attributes['rdf:resource'].value)
                                }else{
                                  // console.log('No URI for this child property')
                                }
                                
                                let ggggChildData = {'@guid': short.generate()}

                                if (ggggChild.innerHTML != null && ggggChild.innerHTML.trim() != ''){
                                  ggggChildData[ggggChildProperty] = ggggChild.innerHTML

                                  // does it have a data type or lang                 
                                  if (ggggChild.attributes && ggggChild.attributes['rdf:datatype']){
                                    ggggChildData['@datatype'] = ggggChild.attributes['rdf:datatype'].value
                                  }
                                  if (ggggChild.attributes && ggggChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype']){
                                    ggggChildData['@datatype'] = ggggChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype'].value
                                  }
                                  if (ggggChild.attributes && ggggChild.attributes['xml:lang']){
                                    ggggChildData['@language'] = ggggChild.attributes['xml:lang'].value
                                  }
                                  if (ggggChild.attributes && ggggChild.attributes['rdf:parseType']){
                                    ggggChildData['@parseType'] = ggggChild.attributes['rdf:parseType'].value
                                  } 


                                }

                                gggData[ggggChildProperty].push(ggggChildData)

                              }

                            }

                            // last thing is add it to the lat structure
                            gChildData[gggChildProperty].push(gggData)

                          }

                        }

                        userValue[gChildProperty].push(gChildData)
                        gChildData = false

                      }else{

                        // its something else
                        if (this.UriNamespace(ggChild.tagName) == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){
                          if (ggChild.attributes && ggChild.attributes['rdf:about']){
                            gChildData['@type'] = ggChild.attributes['rdf:about'].value
                          }else if (ggChild.attributes && ggChild.attributes['rdf:resource']){
                            gChildData['@type'] = ggChild.attributes['rdf:resource'].value
                          }else{
                            console.warn('---------------------------------------------')
                            console.warn('There was a ggChild RDF Type node but could not extract the type')
                            console.warn(ggChild)
                            console.warn('---------------------------------------------')
                          }


                        }else if (ggChild.children.length ==0){


                            let ggChildProperty = this.UriNamespace(ggChild.tagName)

                            if (!gChildData[ggChildProperty]){
                              gChildData[ggChildProperty] = []
                            }

                            // it doesn't have any children, so it will be a literal or something like that
                            let ggChildData = {'@guid': short.generate()}
                            if (ggChild.attributes && ggChild.attributes['rdf:about']){
                              ggChildData['@id'] = this.extractURI(ggChild.attributes['rdf:about'].value)
                            }else if (ggChild.attributes && ggChild.attributes['rdf:resource']){
                              ggChildData['@id'] = this.extractURI(ggChild.attributes['rdf:resource'].value)
                            }else{
                              // console.log('No URI for this child property')
                            }

                            if (ggChild.innerHTML != null && ggChild.innerHTML.trim() != ''){
                              ggChildData[ggChildProperty] = ggChild.innerHTML
                              // does it have a data type or lang                 
                              if (ggChild.attributes && ggChild.attributes['rdf:datatype']){
                                ggChildData['@datatype'] = ggChild.attributes['rdf:datatype'].value
                              }
                              if (ggChild.attributes && ggChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype']){
                                ggChildData['@datatype'] = ggChild.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype'].value
                              }
                              if (ggChild.attributes && ggChild.attributes['xml:lang']){
                                ggChildData['@language'] = ggChild.attributes['xml:lang'].value
                              }
                              if (ggChild.attributes && ggChild.attributes['rdf:parseType']){
                                ggChildData['@parseType'] = ggChild.attributes['rdf:parseType'].value
                              } 


                            }

                            gChildData[ggChildProperty].push(ggChildData)



                        }else{

                          console.warn('---------------------------------------------')
                          console.warn('There was a ggChild that was not a class, but has children')
                          console.warn(ggChild)
                          console.warn(gChild)
                          console.warn(this.isClass(ggChild.tagName))
                          console.warn(ggChild.tagName)
                          console.warn('---------------------------------------------')

                        }
                      }

                    }
                    // when there are multiple nested bnodes we take 
                    // care of adding them to the structure above
                    // and then set the last one to false
                    // so dont add 
                    if (gChildData !== false){
                      userValue[gChildProperty].push(gChildData)  
                    }
                    

                  }
                }

              }
            }

            sucessfulElements.push(e.outerHTML)          

            // since we created a brand new populateData we either need to 
            // replace the orginal in the profile or if there is more than one we 
            // need to make a new one and add it to the resource template list
            // since each piece of data in the property is its own resource template

            if (counter === 0){
              pt[k] = populateData
            }else{

              let newKey = `${k}_${counter}`
              let currentpos = profile.rt[pkey].ptOrder.indexOf(k)
              profile.rt[pkey].ptOrder.splice(currentpos+1, 0, newKey);
              pt[newKey] = populateData


            }

            counter++

          }


        }        
        
        // we did something with it, so remove it from the xml
        // doing this inside the loop because some PT use the same element (like primary contribuitor vs contributor)

        for (let p of sucessfulProperties){
          let els = xml.getElementsByTagName(p)
          // this is a strange loop here because we need to remvoe elements without changing the parent order which will mess up the dom tree and the loop
          for (let step = els.length-1; step >= 0; step=step-1) {            
            
            if (sucessfulElements.indexOf(els[step].outerHTML)> -1){
              els[step].remove()
            }
          }
        }




      }

      // store the unused xml
      profile.rt[pkey].unusedXml = xml.outerHTML;
      if (xml.children.length == 0){
        profile.rt[pkey].unusedXml = false
      }


      for (let key in profile.rt[pkey].pt){

        // populate the admin data
        if (profile.rt[pkey].pt[key].propertyURI == 'http://id.loc.gov/ontologies/bibframe/adminMetadata'){

          if (!profile.rt[pkey].pt[key].userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata']){
            profile.rt[pkey].pt[key].userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata'] = [{}]
          }         
          let userValue = profile.rt[pkey].pt[key].userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata'][0]

          // if it doesnt already have a cataloger id use ours
          if (!userValue['http://id.loc.gov/ontologies/bflc/catalogerId']){
            userValue['http://id.loc.gov/ontologies/bflc/catalogerId'] = [
              {
                "@guid": short.generate(),
                "http://id.loc.gov/ontologies/bflc/catalogerId": useProfileStore().catInitials
              }
            ]
          }

          // we need to set the procInfo, so use whatever we have in the profile
          userValue['http://id.loc.gov/ontologies/bflc/procInfo'] = [
            {
              "@guid": short.generate(),
              "http://id.loc.gov/ontologies/bflc/procInfo": profile.procInfo
            }
          ]

        }


        // we can potentailly prevent some xml errors from propagating further here


        // // like empty RDF types
        // if (profile.rt[pkey].pt[key].userValue['@type']){

        //  if (namespaceValues.indexOf(profile.rt[pkey].pt[key].userValue['@type'])>-1){

        //    // delete profile.rt[pkey].pt[key].userValue['@type']
        //    console.log('----------x_x-----------')
        //    console.log(profile.rt[pkey].pt[key].userValue)
        //    console.log('---------------------')            


        //  }
        // }
        // check the first level bnodes as well
        // for (let key in profile.rt[pkey].pt[key].userValue){
        //  if (!key.includes('@')){




        //  }
        // }



      }
      

      let uniquePropertyURIs  = {}
      // we are now going to do some ananlyis on profile, see how many properties are acutally used, what is not used, etc
      // also do some post-load data cleanup (like &amp; -> &)
      for (let key in profile.rt[pkey].pt){
        
        if (Object.keys(uniquePropertyURIs).indexOf(profile.rt[pkey].pt[key].propertyURI)===-1){
          uniquePropertyURIs[profile.rt[pkey].pt[key].propertyURI] = {status:false,data:[],resourceTemplates:{},unAssingedProperties:[]}
        }
        // mark if we have loaded data from the source for this properity
        if (Object.keys(profile.rt[pkey].pt[key].userValue).length>1){
          // there could be one property for all components, the @root id
          profile.rt[pkey].pt[key].dataLoaded=true
        }else{
          profile.rt[pkey].pt[key].dataLoaded=false


          for (let k in profile.rt[pkey].pt[key].userValue){

            if (k == 'http://www.w3.org/2000/01/rdf-schema#label'){

              if (Array.isArray(profile.rt[pkey].pt[key].userValue[k])){
                for (let kValue of profile.rt[pkey].pt[key].userValue[k]){

                  for (let kValueKey in kValue){
                    if (kValueKey == 'http://www.w3.org/2000/01/rdf-schema#label'){
                      kValue[kValueKey] = cleanXmlEscapes(kValue[kValueKey])
                    }
                  }


                }
              }

              // profile.rt[pkey].pt[key].userValue[k] = cleanXmlEscapes(profile.rt[pkey].pt[key].userValue[k])
            }

            if (Array.isArray(profile.rt[pkey].pt[key].userValue[k])){
              for (let kItem of profile.rt[pkey].pt[key].userValue[k]){

                
                for (let kItemKey in kItem){
                  

                  if (kItemKey == 'http://www.w3.org/2000/01/rdf-schema#label'){

                    if (Array.isArray(kItem[kItemKey])){
                      for (let kValue of kItem[kItemKey]){

                        for (let kValueKey in kValue){
                          if (kValueKey == 'http://www.w3.org/2000/01/rdf-schema#label'){
                            kValue[kValueKey] = cleanXmlEscapes(kValue[kValueKey])
                          }
                        }

                      }
                    }

                    
                  }


                }


              }
            }


          }

          uniquePropertyURIs[profile.rt[pkey].pt[key].propertyURI].status = true

          uniquePropertyURIs[profile.rt[pkey].pt[key].propertyURI].data.push({'json':profile.rt[pkey].pt[key].userValue,'propertyLabel': profile.rt[pkey].pt[key].propertyLabel, 'xml':profile.rt[pkey].pt[key].xmlSource})

          uniquePropertyURIs[profile.rt[pkey].pt[key].propertyURI].resourceTemplates[key] = profile.rt[pkey].pt[key]

          // now look into the rt of this propertiy to see what properties we have sucuessfully mapped and things we did not map
          let allUris = [profile.rt[pkey].pt[key].propertyURI]
          profile.rt[pkey].pt[key].valueConstraint.valueTemplateRefs.forEach((rtName)=>{
            // console.log('----')
            // console.log(profile.rt[pkey].pt[key])
            // console.log(pkey,key)
            // console.log(profile.rt[pkey].pt[key].valueConstraint.valueTemplateRefs)
            // console.log(rtName)
            useProfileStore().rtLookup[rtName].propertyTemplates.forEach((ptObj)=>{
              if (allUris.indexOf(ptObj.propertyURI)==-1){
                allUris.push(ptObj.propertyURI)
              }

            })  
          })

          
          profile.rt[pkey].pt[key].missingProfile = []
          // loop though the URIs we have
          Object.keys(profile.rt[pkey].pt[key].userValue).forEach((userURI)=>{
            if (!userURI.includes('@')){
              if (allUris.indexOf(userURI)===-1){
                
                profile.rt[pkey].pt[key].missingProfile.push(userURI)

                uniquePropertyURIs[profile.rt[pkey].pt[key].propertyURI].unAssingedProperties.push(userURI)
              }
            }

          })

          if (uniquePropertyURIs[profile.rt[pkey].pt[key].propertyURI].unAssingedProperties.length>0){
            uniquePropertyURIs[profile.rt[pkey].pt[key].propertyURI].status='mixed'
          }

        }
      }

      



      profile.rt[pkey].propertyLoadReport = uniquePropertyURIs

      profile.rt[pkey].propertyLoadRatio = parseInt(Object.keys(uniquePropertyURIs).filter((k)=>uniquePropertyURIs[k].status).length /Object.keys(uniquePropertyURIs).length * 100)

      
      
      // remove it for the next item if there is one
      if (tle == 'bf:Item' || tle == 'bf:Instance'){
        console.log('Done processing XML fragment, removing',xml)
        xml.remove()
      }



    }

    // these RTs did not have any data parsed into them, because they were not present
    for (let x of toDeleteNoData){
      profile.rt[x].noData=true     
    }
    console.log("profileprofileprofileprofile",JSON.parse(JSON.stringify(profile)))

    return profile




  },








}


export default utilsParse;