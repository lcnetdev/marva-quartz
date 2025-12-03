import {useConfigStore} from "../stores/config";
import {useProfileStore} from "../stores/profile";
import {usePreferenceStore} from "../stores/preference";

import short from 'short-uuid'

import utilsRDF from './utils_rdf';

const hashCode = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)


const unEscapeHTML = str => str.replace(/&amp;|&lt;|&gt;|&#39;|&quot;/g,
  tag => ({
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      "&#39;": "'",
      '&quot;': '"'
    }[tag]));



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
    if (uri.match(/lcc:[A-Z]/)){
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
   * Calculates the maximum depth of an XML string and maps node tags to their depth level.
   * This function is intended for a browser environment where DOMParser is available.
   *
   * @param {string} xmlString The XML structure as a string.
   * @returns {{count: number, nodeMap: object}|{error: string}} An object containing the
   *          max depth ('count') and a map of nodes at each level ('nodeMap'), or an
   *          error object if the XML is invalid.
   */
  getXmlDepth(xmlString) {
    // 1. Use the browser's built-in DOMParser to parse the XML string.
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // Check for parsing errors. The parser will insert a <parsererror> node on failure.
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      return {
        error: "Invalid XML string provided."
      };
    }

    // 2. Initialize variables for storing the results.
    let maxDepth = -1;
    // We use an intermediate map with Sets to automatically handle unique tag names per level.
    const tempNodeMap = {};

    // 3. Define a recursive function to traverse the DOM tree.
    const traverse = (node, currentDepth) => {
      // We only care about element nodes (nodeType 1), not text, comments, etc.
      if (node.nodeType !== 1) {
        return;
      }

      // Update the maximum depth found so far.
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }

      // Initialize a Set for the current depth level if it doesn't exist yet.
      if (!tempNodeMap[currentDepth]) {
        tempNodeMap[currentDepth] = new Set();
      }
      // Add the node's tag name to the Set for its level.
      tempNodeMap[currentDepth].add(node.tagName);

      // Recursively call traverse for all child *elements*.
      // 'node.children' conveniently contains only element nodes, ignoring text and comments.
      for (const child of node.children) {
        traverse(child, currentDepth + 1);
      }
    };

    // 4. Start the traversal from the document's root element.
    if (xmlDoc.documentElement) {
      traverse(xmlDoc.documentElement, 0);
    } else {
      // This handles cases where the XML string is empty or contains only comments.
      return { count: -1, nodeMap: {} };
    }

    // 5. Convert the temporary map (with Sets) to the final nodeMap object.
    // The example output shows a single string value per level. This code makes that happen
    // if there's only one tag type at a level, but uses an array if there are multiple.
    const finalNodeMap = {};
    for (const level in tempNodeMap) {
      const tags = Array.from(tempNodeMap[level]);
      finalNodeMap[level] = tags.length === 1 ? tags[0] : tags;
    }

    // 6. Return the final result object.
    return {
      count: maxDepth,
      nodeMap: finalNodeMap,
    };
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
    // if (window.DOMParser){
      let parser = new DOMParser();


      // this.activeDom = parser.parseFromString(xml, 'application/xml');
      // var xsltDoc = new DOMParser().parseFromString([
      //     // describes how we want to modify the XML - indent everything
      //     '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">',
      //     '  <xsl:strip-space elements="*"/>',
      //     '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
      //     '    <xsl:value-of select="normalize-space(.)"/>',
      //     '  </xsl:template>',
      //     '  <xsl:template match="node()|@*">',
      //     '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
      //     '  </xsl:template>',
      //     '  <xsl:output indent="yes"/>',
      //     '</xsl:stylesheet>',
      // ].join('\n'), 'application/xml');

      // var xsltProcessor = new XSLTProcessor();
      // xsltProcessor.importStylesheet(xsltDoc);
      // var resultDoc = xsltProcessor.transformToDocument(this.activeDom);
      // var resultXml = new XMLSerializer().serializeToString(resultDoc);
      // xml = resultXml


      // xml = xml.replace(/(<\/?.*?>)/g, '$1\n');
      console.log("THE XML IS",xml)
      this.activeDom = parser.parseFromString(xml, 'application/xml');
      this.testDom = parser.parseFromString(xml, 'application/xml');
      console.log(this.activeDom.children)

      let root = this.activeDom.getElementsByTagName('rdf:RDF')
      console.log("------",root.length)
      if (root.length > 0){ root = root[0]}
      console.log("root: ", root)

      this.hasInstance = 0
      for (let rdfChild of root.children){
        if (rdfChild.tagName == 'bf:Instance'){
          this.hasInstance++
        }
      }

      // test to see if there are any Items,
      this.hasItem = this.activeDom.getElementsByTagName('bf:Item').length


    // the library very much doesn't work on anything but chrome
    // }else{
    //  this.activeDom = new jsdom.JSDOM(xml, {
    //    contentType: "text/xml",
    //    storageQuota: 10000000
    //  })
    //  this.activeDom = this.dom.window.document
    // }
  },

  /**
  * Takes the XML marks any bf:relation properties with hints to use in the parsing of it
  *
  * @param {Node} xml - the XML payload
  * @return {Node}
  */
  sniffWorkRelationType(xml){
    for (let child of xml.children){
      if (child.tagName == 'bf:relation'){

        let hasUncontrolled = false
        if (child.innerHTML.indexOf("bflc:Uncontrolled")>-1||child.innerHTML.indexOf("bf:Uncontrolled")>-1){ hasUncontrolled = true }
        if (child.innerHTML.indexOf("bflc/Uncontrolled")>-1||child.innerHTML.indexOf("bibframe/Uncontrolled")>-1){ hasUncontrolled = true }

        let hasSeriesProperty = false
        if (child.innerHTML.indexOf("bf:hasSeries")>-1){ hasSeriesProperty = true }

        let hasWork = false
        if (child.innerHTML.indexOf("bf:Work")>-1) { hasWork = true}

        let hasHub = false
        if (child.innerHTML.indexOf("bf:Hub")>-1) { hasHub = true}

        let hasSeries = false
        if (child.innerHTML.indexOf("bf:Series")>-1){ hasSeries = true }

        let hasAssociatedResource = false
        if (child.innerHTML.indexOf("bf:associatedResource")>-1) { hasAssociatedResource = true}

        let hasExternalLcRel = false
        if (child.innerHTML.indexOf("bf:title")>-1 && child.innerHTML.indexOf("bf:contribution")>-1) {
          hasExternalLcRel = true
        }

        if ((hasSeriesProperty || hasSeries) && hasAssociatedResource){
          child.setAttribute('local:pthint', 'lc:RT:bf2:SeriesHub')
        }else if (hasAssociatedResource && (hasWork || hasHub)){
          child.setAttribute('local:pthint', 'lc:RT:bf2:RelWorkLookup')
        } else if (hasExternalLcRel){
          child.setAttribute('local:pthint', 'lc:RT:bf2:RelWorkInput')
        }

      }

    }
    return xml
  },

  /**
  * Takes the XML marks any bf:note properties with hints to use in the parsing of it
  *
  * @param {Node} xml - the XML payload
  * @return {Node}
  */
  sniffNoteType(xml){
    for (let child of xml.children){
      if (child.tagName == 'bf:note'){
        if ( child.innerHTML.indexOf("bf:language")>-1){
          child.setAttribute('local:pthint', 'lc:RT:bf2:LangNote')
        }else{
          // leave blank?
        }
      }
    }
    return xml
  },

  /**
  * For our hub profile we broke out the different title types, sniff for which profile to use
  *
  * @param {Node} xml - the XML payload
  * @return {Node}
  */
  sniffTitleType(xml){
    for (let child of xml.children){
      if (child.tagName == 'bf:title'){
        if ( child.innerHTML.indexOf("bf:VariantTitle")>-1){
          child.setAttribute('local:pthint', 'lc:RT:bf2:Title:VarTitle')
        }if ( child.innerHTML.indexOf("bf:TransliteratedTitle")>-1){
          child.setAttribute('local:pthint', 'lc:RT:bflc:TranscribedTitle')
        }else{
          // leave blank?
        }
      }
    }
    return xml
  },


  specialTransforms: {
    //not used currently
  },

  updateAdditionalInstanceParentValues: function(profile, instanceName, newRdId){
  // when a record comes in with multiple (secondary) instances, each instance will have the
  // same parent and parentId, so all of there components will match. This causes issues with
  // navigation, but not anywhere else?
  // adapted from `profile.createSecondaryInstance()` to have parent properties be unique and correct
        for (let pt in profile.pt){
            profile.pt[pt]['@guid'] = short.generate()
            // update the parentId
            profile.pt[pt].parentId = profile.pt[pt].parentId.replace(instanceName, newRdId)
            profile.pt[pt].parent = profile.pt[pt].parent.replace(instanceName, newRdId)
        }

        return profile
  },

  transformRts: async function(profile){
    let toDeleteNoData = []

    // before we start processing make sure we have enough instance rts for the number needed
    let totalInstanceRts = 0
    let useInstanceRt = null
    let useInstanceRtName = null
    for (const pkey in profile.rt) {
      if (pkey.includes(':Instance')){
        totalInstanceRts++
        useInstanceRtName = pkey
        useInstanceRt = JSON.parse(JSON.stringify(profile.rt[pkey]))
      }
    }

    if (this.hasInstance - totalInstanceRts>0){
      [...Array(this.hasInstance - totalInstanceRts)].forEach((_, i) => {
        let key = useInstanceRtName + '_'+(i+1)
        let updatedProfile = this.updateAdditionalInstanceParentValues(JSON.parse(JSON.stringify(useInstanceRt)), useInstanceRtName, key)

        profile.rt[key] = JSON.parse(JSON.stringify(updatedProfile))
        profile.rtOrder.push(useInstanceRtName + '_'+(i+1))
      });
    }

    let rtsToRemove = []

    for (const pkey in profile.rt) {
      let tle = ""
      let isHub = false
      if (pkey.includes(':Work')){
        tle = "bf:Work"
      }else if (pkey.includes(':Instance')){
        tle = "bf:Instance"
      }else if (pkey.includes(':Item')){
        tle = "bf:Item"
      }else if (pkey.endsWith(':Hub')){
        tle = "bf:Hub"
        isHub=true
      }else{
        rtsToRemove.push(pkey)
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

      if (xml === false && tle == 'bf:Hub'){
        tle = "bf:Work"
        isHub=true
        console.warn('No bf:Hub found, looking for bf:Work')
        xml = this.activeDom.getElementsByTagName(tle)
        xml = this.returnOneWhereParentIs(xml, "rdf:RDF")

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

      // is there admin metdata in the data? If so we need to insert that profile template into the pt

      let adminMetadataCount = xml.getElementsByTagName('bf:adminMetadata').length
      if (adminMetadataCount>0){
        let parent
        let parentId
        // find a sibling and grab their parent id so we can use it for this new property
        for (let k of Object.keys(pt)){
          if (pt[k].parent){
            parent = pt[k].parent
            parentId = pt[k].parentId
            break
          }
        }

        let targetTemplate = "lc:RT:bf2:AdminMetadata:BFDB"
        try {
          targetTemplate = pt.filter((obj) => obj.propertyLabel == 'Admin Metadata')[0].valueConstraint.valueTemplateRefs[0]
        } catch(err) {
          console.warn("Using default template for admin metadata: ", err)
          targetTemplate = "lc:RT:bf2:AdminMetadata:BFDB"
        }

        // adminMetadataCount
        pt['id_loc_gov_ontologies_bibframe_adminmetadata'] = {
          "mandatory": false,
          "parent": parent,
          "parentId": parentId,
          "id": 'id_loc_gov_ontologies_bibframe_adminmetadata',
          "propertyLabel": "Admin Metadata",
          "propertyURI": "http://id.loc.gov/ontologies/bibframe/adminMetadata",
          "repeatable": true,
          "resourceTemplates": [],
          '@guid': short.generate(),
          "type": "resource",
          "userValue": {"@root":"http://id.loc.gov/ontologies/bibframe/adminMetadata"},
          "valueConstraint": {
              "defaults": [],
              "useValuesFrom": [],
              "valueDataType": {},
            "valueTemplateRefs": [targetTemplate]
            }
        }

        profile.rt[pkey].ptOrder.push('id_loc_gov_ontologies_bibframe_adminmetadata')

      }
      // some more optional xml enrichment here to help the process
      // first try to give hints to which PT to use based on some rules we are using at LC
      if (tle == "bf:Work"){
        xml = this.sniffWorkRelationType(xml)
        xml = this.sniffNoteType(xml)
      }

      if (tle == "bf:Instance"){
        xml = this.sniffNoteType(xml)
      }

      if (isHub){
        xml = this.sniffTitleType(xml)

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

        // console.log("------xml--------Before  ",propertyURI)
        // // console.log((new XMLSerializer()).serializeToString(xml))
        // console.log(((new XMLSerializer()).serializeToString(xml).match(/German/g) || []).length)
        // console.log((new XMLSerializer()).serializeToString(xml))



        // we only want top level elements, not nested things like dupe notes etc.
        let el = []
        // let elHashOrder = []
        for (let e of xml.children){
          // console.info(propertyURI, ": ", e.tagName, "--", e)
          if (this.UriNamespace(e.tagName) == propertyURI){


            // elHashOrder.push(hashCode((new XMLSerializer()).serializeToString(e)))


            // if it has a hint then we need to check if we can find the right pt for it
            if (e.attributes['local:pthint'] && e.attributes['local:pthint'].value){
              // check to see if this pt has that hint value in the valueConstraint  valueTemplateRefs
              if (ptk.valueConstraint.valueTemplateRefs.indexOf(e.attributes['local:pthint'].value) > -1){
                // it matches, so use this one for sure
                // make sure to remove the hint attribute
                // console.log("Putting into ptk:",ptk)
                // console.log("This:", e)
                e.removeAttribute('local:pthint')
                el.push(e)
              }else{
                // if it doesn't match that might mean there is a better match further in the pts or it could mean it will never match
                // so look ahead and see, if there is a better match don't add it now and leave this el for that future pt
                let foundPtToUse = false
                for (let kCheck in pt){
                  if (pt[kCheck].valueConstraint.valueTemplateRefs.indexOf(e.attributes['local:pthint'].value) > -1){
                    // console.log("found a place for you in the future :)")
                    // console.log("here",pt[kCheck])
                    foundPtToUse = true
                  }
                }
                if (foundPtToUse){

                  // jump to the next el this one will get grabbed by the one it is suppose to use
                  continue
                }else{
                  // we did not find a place to put this el, so we need to add it here
                  // console.log("Putting into ptk:",ptk)
                  // console.log("This:", e)
                  e.removeAttribute('local:pthint')
                  el.push(e)
                }
              }
            }else{
              // just add it normally
              el.push(e)
            }


          }
        }

        // console.info("el: ", el)

        // for (let e of el){
        //   console.log((new XMLSerializer()).serializeToString(e))
        // }

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
          // console.log('------')
          // console.log(prefixURI)
          // console.log("Putting ", el)
          // console.log("Into ", ptk)

          // we have that element
          sucessfulProperties.push(prefixURI)

          ptk.hasData = true
          ptk.canBeHidden = false
          ptk.deepHierarchy = false

          // holds the ids of all the pts we are about to create so we can do some post processing on them
          let ptsCreatedThisLoop = []

          // loop through all of them
          let counter = 0
          for (let e of el){
            // console.log("------------")
            // console.log(e.innerHTML)
            // console.log((new XMLSerializer()).serializeToString(e))

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
            populateData.xmlHash = hashCode(populateData.xmlSource)

            populateData['@guid'] = short.generate()

            // console.log("-------------------------------- deepth")
            // console.log(this.getXmlDepth(populateData.xmlSource))
            // do a deepHierarchy check here to see if it is a very nested bf:relation property if so we will mark it here
            if (populateData.propertyURI == 'http://id.loc.gov/ontologies/bibframe/relation'){
              if (e.innerHTML.indexOf("bf:hasInstance")>-1){
                // console.log("Setting deepHierarchy to true for bf:relation", ptk)
                populateData.deepHierarchy=true
              }
            }

            if (['bf:extent', 'bf:note'].includes(e.tagName)){
              console.info("populateData: ", JSON.parse(JSON.stringify(populateData)))
            }



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
                  userValue[eProperty] = unEscapeHTML(e.innerHTML)

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

            if (['bf:extent', 'bf:note'].includes(e.tagName)){
              console.info("children: ", e.children.length, "--", e.children)
            }

              if (e.children.length > 1){
                console.error('---------------------------------------------')
                console.error('There are more than one 1st lvl bnodes!!!!!!!')
                console.error(e)
                console.error('---------------------------------------------')
              }


              // loop through.... though don't really need to loop,
              // this is the main bnode <bf:title><bf:Title>
              for (let child of e.children){

                if (['bf:extent', 'bf:note'].includes(e.tagName)){
                  console.info("child: ", child)
                }

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
                  if (['bf:extent', 'bf:note'].includes(e.tagName)){
                    console.info("gChild: ", gChild)
                  }
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
                            "http://www.w3.org/2000/01/rdf-schema#label": unEscapeHTML(gChild.innerHTML)
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
                        gChildData[gChildProperty] = unEscapeHTML(gChild.innerHTML)

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

                      if (['bf:extent', 'bf:note'].includes(e.tagName)){
                        console.info("\tggChild: ", ggChild)
                      }


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

                          if (['bf:extent', 'bf:note'].includes(e.tagName)){
                            console.info("\t\tgggChild: ", gggChild)
                          }

                          // not a bnode, just a one liner property of the bnode
                          if (this.UriNamespace(gggChild.tagName) == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){

                            // expception for bf:Hubs, so it sticks
                            if (gChildData['@type'] == 'http://id.loc.gov/ontologies/bibframe/Hub'){
                              continue
                            }

                            if (['bf:extent', 'bf:note'].includes(e.tagName)){
                              console.info("\t\t\tgChildData: ", gChildData)
                              console.info("\t\t\tgggAttributes: ", gggChild.attributes)
                            }

                            if (gggChild.attributes && gggChild.attributes['rdf:about']){
                              gChildData['@type'] = gggChild.attributes['rdf:about'].value
                            } else if (gChildData['@type'] == 'http://id.loc.gov/ontologies/bibframe/Note'){
                              gChildData['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = [
                                {
                                "@guid": short.generate(),
                                "@id" : gggChild.attributes['rdf:resource'].value
                                }
                              ]
                            }else if (gggChild.attributes && gggChild.attributes['rdf:resource']){
                              let value = gggChild.attributes['rdf:resource'].value
                              // gChildData['@type'] = value //gggChild.attributes['rdf:resource'].value
                              if (propertyURI == 'http://id.loc.gov/ontologies/bibframe/relation' && value == 'http://id.loc.gov/ontologies/bflc/Uncontrolled'){
                                gChildData['@type'] = this.UriNamespace(ggChild.tagName)
                              } else {
                                gChildData['@type'] = value
                              }

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
                                gggChildData[gggChildProperty] = unEscapeHTML(gggChild.innerHTML)
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
                            let lastClass = null

                            for (let ggggChild of gggChild.children){

                              if (this.isClass(ggggChild.tagName)){

                                if (lastClass == ggggChild.tagName){
                                  // in cases like so: <bf:status><bf:Status/><bf:Status/></bf:status>
                                  // but this is bad non-conformant XML :(
                                  // add the data and make a new one
                                  gChildData[gggChildProperty].push(gggData)
                                  gggData = {'@guid': short.generate()}

                                }
                                lastClass = ggggChild.tagName

                                // we will flag this as having a deep hiearcy to review later if we should let them be able to edit it
                                populateData.deepHierarchy = true
                                // console.log("Setting deepHierarchy to true for", populateData.propertyURI, populateData)



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


                                // now loop through this bnodes descendants
                                for (let gggggChild of ggggChild.children){
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
                                      let gggggChildProperty = this.UriNamespace(gggggChild.tagName)

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
                                        ggggChildData[gggggChildProperty] = unEscapeHTML(gggggChild.innerHTML)

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
                                    let g5ChildProperty = this.UriNamespace(gggggChild.tagName)
                                    // console.log("g5ChildProperty",g5ChildProperty)

                                    let g5ChildData = {'@guid': short.generate()}

                                    if (!gggData[g5ChildProperty]){
                                      gggData[g5ChildProperty] = []
                                    }

                                    populateData.deepHierarchy = true
                                  // console.log("Setting 2 deepHierarchy to true for", populateData.propertyURI, populateData)


                                    for (let g6Child of gggggChild.children){
                                      // console.log("Doing",g6Child.tagName)


                                      if (this.isClass(g6Child.tagName)){

                                        // console.log("Build resource for", g6Child.tagName)

                                        g5ChildData['@type'] = this.UriNamespace(g6Child.tagName)

                                        // check for URI
                                        if (g6Child.attributes && g6Child.attributes['rdf:about']){
                                          g5ChildData['@id'] = this.extractURI(g6Child.attributes['rdf:about'].value)
                                        }else if (g6Child.attributes && g6Child.attributes['rdf:resource']){
                                          g5ChildData['@id'] = this.extractURI(g6Child.attributes['rdf:resource'].value)
                                        }else{
                                          // console.log('No URI for this child property')
                                        }

                                        // now loop through this bnodes descendants
                                        for (let g7Child of g6Child.children){

                                          if (this.UriNamespace(g7Child.tagName) == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){

                                            if (g7Child.attributes && g7Child.attributes['rdf:about']){
                                              g5ChildData['@type'] = g7Child.attributes['rdf:about'].value
                                            }else if (g7Child.attributes && g7Child.attributes['rdf:resource']){
                                              g5ChildData['@type'] = g7Child.attributes['rdf:resource'].value
                                            }else{
                                              console.warn('---------------------------------------------')
                                              console.warn('There was a gggChild RDF Type node but could not extract the type')
                                              console.warn(g7Child)
                                              console.warn('---------------------------------------------')
                                            }


                                          }else if (g7Child.children.length ==0){

                                            // console.log("Build literal for:",g7Child)
                                            populateData.deepHierarchy = true
                                            // console.log("Setting 3 deepHierarchy to true for", populateData.propertyURI, populateData)


                                            let g7ChildProperty = this.UriNamespace(g7Child.tagName)
                                            // console.log(g7ChildProperty)

                                            if (!g5ChildData[g7ChildProperty]){
                                              g5ChildData[g7ChildProperty] = []
                                            }

                                            // it doesn't have any children, so it will be a literal or something like that
                                            let g6ChildData = {'@guid': short.generate()}

                                            if (g7Child.attributes && g7Child.attributes['rdf:about']){
                                              g6ChildData['@id'] = this.extractURI(g7Child.attributes['rdf:about'].value)
                                            }else if (g6ChildData.attributes && g7Child.attributes['rdf:resource']){
                                              g6ChildData['@id'] = this.extractURI(g7Child.attributes['rdf:resource'].value)
                                            }else{
                                              // console.log('No URI for this child property')
                                            }

                                            if (g7Child.innerHTML != null && g7Child.innerHTML.trim() != ''){
                                              g6ChildData[g7ChildProperty] = unEscapeHTML(g7Child.innerHTML)

                                              // does it have a data type or lang
                                              if (g7Child.attributes && g7Child.attributes['rdf:datatype']){
                                                g6ChildData['@datatype'] = g7Child.attributes['rdf:datatype'].value
                                              }
                                              if (g7Child.attributes && g7Child.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype']){
                                                g6ChildData['@datatype'] = g7Child.attributes['http://www.w3.org/1999/02/22-rdf-syntax-ns#datatype'].value
                                              }
                                              if (g7Child.attributes && g7Child.attributes['xml:lang']){
                                                g6ChildData['@language'] = g7Child.attributes['xml:lang'].value
                                              }
                                              if (g7Child.attributes && g7Child.attributes['rdf:parseType']){
                                                g6ChildData['@parseType'] = g7Child.attributes['rdf:parseType'].value
                                              }


                                            }

                                            g5ChildData[g7ChildProperty].push(g6ChildData)




                                          }else{

                                           // leaving the scaffloding to go deeper, but this is not designed to edit such deeply nested structures
                                           // make sure the component is flagged as un-editable populateData.deepHierarchy = true and just reuse the XML on export
                                           populateData.deepHierarchy = true



                                            // another level down
                                            // so create a new obj and load it into the structure
                                            let g7ChildProperty = this.UriNamespace(g7Child.tagName)
                                            if (!g5ChildData[g7ChildProperty]){
                                              g5ChildData[g7ChildProperty] = []
                                            }

                                            if (g7Child.children.length>0){

                                              // now loop through this bnodes descendants
                                              for (let g8Child of g7Child.children){

                                                // console.log("Looking at",g8Child)

                                                if (this.isClass(g8Child.tagName)){
                                                  // its a class build a blank node
                                                }else{

                                                }


                                              }

                                            }else{

                                              alert('Parsing issue, please report bug')


                                            }







                                            // if (!gChildData[gggChildProperty]){
                                            //   gChildData[gggChildProperty] = []
                                            // }

                                            // // new obj
                                            // let gggData = {'@guid': short.generate()}


                                            // for (let ggggChild of gggChild.children){



                                          }





                                        }


                                      }else{

                                        // console.log("Build literal for", g6Child.tagName)
                                        alert("Error in processing nested literal please report bug")

                                      }



                                    }


                                    gggData[g5ChildProperty].push(g5ChildData)


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
                                  ggggChildData[ggggChildProperty] = unEscapeHTML(ggggChild.innerHTML)

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
                              ggChildData[ggChildProperty] = unEscapeHTML(ggChild.innerHTML)
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


            // check if we marked this component deepHierarchy
            if (populateData.deepHierarchy){
              // check if it is a relation with a URI, if so it is okay
              if (populateData.userValue['http://id.loc.gov/ontologies/bibframe/relation'] && populateData.userValue['http://id.loc.gov/ontologies/bibframe/relation'][0]){
                if (populateData.userValue['http://id.loc.gov/ontologies/bibframe/relation'][0]['http://id.loc.gov/ontologies/bibframe/associatedResource'] && populateData.userValue['http://id.loc.gov/ontologies/bibframe/relation'][0]['http://id.loc.gov/ontologies/bibframe/associatedResource'][0]){
                  if (populateData.userValue['http://id.loc.gov/ontologies/bibframe/relation'][0]['http://id.loc.gov/ontologies/bibframe/associatedResource'][0]['@id']){
                    delete populateData.deepHierarchy
                  }
                }
              }

              // trying to turn it off for transcribed series
              if (populateData.id.indexOf('transcribed_series') >-1){
                populateData.deepHierarchy = false
              }


            }

            // since we created a brand new populateData we either need to
            // replace the orginal in the profile or if there is more than one we
            // need to make a new one and add it to the resource template list
            // since each piece of data in the property is its own resource template

            if (counter === 0){
              pt[k] = populateData
              ptsCreatedThisLoop.push(populateData.id)
            }else{
              // if (type == lookup), it's a simple lookup, keep the pieces together
              if (populateData.type == 'lookup'){
                pt[k].userValue[populateData['propertyURI']].push(populateData.userValue[populateData['propertyURI']][0])
              } else { // otherwise, create a new pt
                let newKey = `${k}_${counter}`
                let currentpos = profile.rt[pkey].ptOrder.indexOf(k)
                let newpos = currentpos + 1
                profile.rt[pkey].ptOrder.splice(newpos, 0, newKey);
                populateData.id = newKey
                ptsCreatedThisLoop.push(newKey)
                pt[newKey] = populateData
              }
            }




            // console.log("populateData", JSON.stringify(populateData, null, 2))


            // do a little sanity check here, loop through and
            userValue = this.removeEmptyBnodes(userValue)


            counter++

          }

          // we kept the order of the proerties we created in this array, so whatever order they ended up in the ptOrder rearrange them to match this order we maintained
          if (ptsCreatedThisLoop.length>1){
            let posOfFirst = 9999
            // we need to find the first occurance of the property to know where to start cutting and replacing
            for (let ptCreated of ptsCreatedThisLoop){
              if (profile.rt[pkey].ptOrder.indexOf(ptCreated)<posOfFirst){ posOfFirst = profile.rt[pkey].ptOrder.indexOf(ptCreated)}
            }
            if (posOfFirst != -1 && posOfFirst != 9999){
              // cut out the old ones and inset the new order
              profile.rt[pkey].ptOrder.splice(posOfFirst,ptsCreatedThisLoop.length,...ptsCreatedThisLoop)
            }
          }



        }



        // we did something with it, so remove it from the xml
        // doing this inside the loop because some PT use the same element (like primary contribuitor vs contributor)

        for (let p of sucessfulProperties){
          let els = xml.getElementsByTagName(p)
          // this is a strange loop here because we need to remvoe elements without changing the parent order which will mess up the dom tree and the loop
          for (let step = els.length-1; step >= 0; step=step-1) {

            if (sucessfulElements.indexOf(els[step].outerHTML)> -1){


              // make sure we are about to remove a property node that is the child of the main bf:Work/bf:Instance etc.. don't delete nested things
              if (xml === els[step].parentNode){
                els[step].remove()
              }
            }
          }
        }



      }

      // store the unused xml
      profile.rt[pkey].unusedXml = xml.outerHTML;
      if (xml.children.length == 0){
        profile.rt[pkey].unusedXml = false
      }

      // keep track of the value we need to add
      let groupTopLeveLiteralsToMerge = {}
      // loop through and check if there are any top level literals we want to group
      for (let key in profile.rt[pkey].pt){
        let pt = profile.rt[pkey].pt[key]
        // the list of props we allow to group are in the config
        if (useConfigStore().groupTopLeveLiterals.indexOf(pt.propertyURI) > -1){
          if (pt.userValue && pt.userValue[pt.propertyURI] && pt.userValue[pt.propertyURI][0]){
            if (!groupTopLeveLiteralsToMerge[pt.propertyURI]){
              groupTopLeveLiteralsToMerge[pt.propertyURI] = {mergeUnder: pt.id, toRemove: [], values: []}
            }else{
              groupTopLeveLiteralsToMerge[pt.propertyURI].toRemove.push(pt.id)
            }
            groupTopLeveLiteralsToMerge[pt.propertyURI].values.push(pt.userValue[pt.propertyURI][0])
          }
        }
      }
      // loop through the list of properties we found to see if we have multiple to merge
      for (let toGroupUri in groupTopLeveLiteralsToMerge){
        for (let key in profile.rt[pkey].pt){
          if (profile.rt[pkey].pt[key].propertyURI == toGroupUri){
            let pt = profile.rt[pkey].pt[key]
            if (pt.id == groupTopLeveLiteralsToMerge[toGroupUri].mergeUnder){
              pt.userValue[toGroupUri] = groupTopLeveLiteralsToMerge[toGroupUri].values
            }
          }
        }
        for (let toRemove of groupTopLeveLiteralsToMerge[toGroupUri].toRemove){
          if (profile.rt[pkey].ptOrder.indexOf(toRemove) > -1){
            delete profile.rt[pkey].pt[toRemove]
            profile.rt[pkey].ptOrder = profile.rt[pkey].ptOrder.filter((x) => { return x !== toRemove })
          }
        }
      }
      for (let toGroupUri in groupTopLeveLiteralsToMerge){
        if (groupTopLeveLiteralsToMerge[toGroupUri].mergeUnder){
          let ptToReOrder = profile.rt[pkey].pt[groupTopLeveLiteralsToMerge[toGroupUri].mergeUnder]
          if (ptToReOrder && ptToReOrder.userValue && ptToReOrder.userValue[toGroupUri]){

            if (usePreferenceStore().returnValue('--b-edit-main-literal-non-latin-first')){
              ptToReOrder.userValue[toGroupUri] = useProfileStore().sortObjectsByLatinMatch(ptToReOrder.userValue[toGroupUri],toGroupUri ).reverse()
            }else{
              ptToReOrder.userValue[toGroupUri] = useProfileStore().sortObjectsByLatinMatch(ptToReOrder.userValue[toGroupUri],toGroupUri )
            }
          }
        }
      }

      // we are going to go looking for literals inside bnodes that have two literals with one at least of them with a @language tag

      profile = this.reorderAllNonLatinLiterals(profile)
      profile = this.groupSubjects(profile)
      this.buildPairedLiteralsIndicators(profile)

      let adminMedtataPrimary = null
      let adminMedtataSecondary = []
      for (let key in profile.rt[pkey].pt){
        // populate the admin data
        if (profile.rt[pkey].pt[key].propertyURI == 'http://id.loc.gov/ontologies/bibframe/adminMetadata'){

          if (!profile.rt[pkey].pt[key].userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata']){
            profile.rt[pkey].pt[key].userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata'] = [{}]
          }
          let userValue = profile.rt[pkey].pt[key].userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata'][0]

          // // if it doesnt already have a cataloger id use ours
          if (!userValue['http://id.loc.gov/ontologies/bflc/catalogerId']){
            userValue['http://id.loc.gov/ontologies/bflc/catalogerId'] = [
              {
                "@guid": short.generate(),
                "http://id.loc.gov/ontologies/bflc/catalogerId": usePreferenceStore().catInitals
              }
            ]
          }

          // // we need to set the procInfo, so use whatever we have in the profile
          // userValue['http://id.loc.gov/ontologies/bflc/procInfo'] = [
          //   {
          //     "@guid": short.generate(),
          //     "http://id.loc.gov/ontologies/bflc/procInfo": profile.procInfo
          //   }
          // ]

          // using MARC2BF rules 2.6+ we need to find the admin metadata that does not have a status
          // that will be our primary adminMetadata that they edit. Except, we want the `primary` Admin field to stay primary
          // even after it gets a status. Most of the admin fields will be hidden, but the Primary field in the instance will
          // remain and should continue to be editable.
          if (userValue){

            if (profile.rt[pkey].pt[key].parentId.includes(":Instance") && (!userValue['http://id.loc.gov/ontologies/bibframe/status'] || Object.keys(userValue).length > 7)){
              profile.rt[pkey].pt[key].adminMetadataType = 'primary'
              adminMedtataPrimary = key
            } else if (profile.rt[pkey].pt[key].parentId.includes(":Hub") && Object.keys(userValue).length > 7){
              profile.rt[pkey].pt[key].adminMetadataType = 'primary'
              adminMedtataPrimary = key
            }else{
              profile.rt[pkey].pt[key].adminMetadataType = 'secondary'

              let useDate = "00000000"
              if (userValue['http://id.loc.gov/ontologies/bibframe/date'] && userValue['http://id.loc.gov/ontologies/bibframe/date'][0]){
                if (userValue['http://id.loc.gov/ontologies/bibframe/date'][0]['http://id.loc.gov/ontologies/bibframe/date']){
                  useDate = userValue['http://id.loc.gov/ontologies/bibframe/date'][0]['http://id.loc.gov/ontologies/bibframe/date']
                  // drop time part of the value if there
                  useDate = useDate.split('T')[0]


                }

              }


              try{
                useDate = parseInt(useDate.match(/\d|\./g).join(''))
              }catch{
                console.warn('Cant parse date',useDate)
                useDate = 0
              }

              adminMedtataSecondary.push({key:key,date:useDate})







            }
          }
        }

        // if we have multiple types of adminMetadata we want to reorder them
        if (adminMedtataPrimary && adminMedtataSecondary.length>0){
          // first remove all of them from the order
          profile.rt[pkey].ptOrder = profile.rt[pkey].ptOrder.filter((x) => { return ( x.indexOf('bibframe_adminmetadata') === -1 ) })
          // add in the primary first
          profile.rt[pkey].ptOrder.push(adminMedtataPrimary)

          // sort and add
          const naturalCollator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
          adminMedtataSecondary.sort((a, b) => naturalCollator.compare(a.date, b.date)).reverse();
          adminMedtataSecondary.forEach((v)=>{
            profile.rt[pkey].ptOrder.push(v.key)
          })

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

          // check if this could be a hidden subject
          let comp = profile.rt[pkey].pt[key]
          let display = useProfileStore().displaySubject(comp)
          if (!display && comp.propertyURI == "http://id.loc.gov/ontologies/bibframe/subject"){
            profile.rt[pkey].pt[key].hideSubject = true
          }
        }else{
          profile.rt[pkey].pt[key].dataLoaded=false
          // if there is no data loaded, add it to the list for ad hoc
          const e = profile.rt[pkey].pt[key]
          if (e.mandatory != 'true'){
            if (Object.keys(useProfileStore().emptyComponents).includes(pkey)){
              useProfileStore().emptyComponents[pkey].push(key)
            } else {
              useProfileStore().emptyComponents[pkey] = [key]
            }
          }


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

        // if we set any deepHiearchy then make sure that feature is allowed on that property
        if (profile.rt[pkey].pt[key].deepHierarchy){
          if (useConfigStore().exludeDeepHierarchy.indexOf(profile.rt[pkey].pt[key].propertyURI) >-1){
            // console.log("remoiving depthierarchy from",profile.rt[pkey].pt[key])
            profile.rt[pkey].pt[key].deepHierarchy=false
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

    for (let rt of rtsToRemove){
      delete profile.rt[rt]
      let index = profile.rtOrder.indexOf(rt);
      if (index !== -1) {
        profile.rtOrder.splice(index, 1);
      }
    }

    profile = this.extractISBN(profile)

    console.log("profileprofileprofileprofile",JSON.parse(JSON.stringify(profile)))

    return profile




  },


  extractISBN: function(profile){
    for (let rt of profile.rtOrder){
      for (let pt of profile.rt[rt].ptOrder){
        let ptObj = profile.rt[rt].pt[pt]
        if (ptObj.propertyURI == 'http://id.loc.gov/ontologies/bibframe/identifiedBy'){
          if (ptObj.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'] && ptObj.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]){
            let bnode = ptObj.userValue['http://id.loc.gov/ontologies/bibframe/identifiedBy'][0]
            if (bnode['@type'] && bnode['@type'] == 'http://id.loc.gov/ontologies/bibframe/Isbn'){
              if (bnode['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'] && bnode['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]){
                if (bnode['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value']){
                  if (!profile.linkedData){
                    profile.linkedData = {}
                  }
                  if (!profile.linkedData.isbn){
                    profile.linkedData.isbn = []
                  }
                  profile.linkedData.isbn.push(bnode['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'].trim())
                }
              }
            }
          }
        }
      }
    }
    return profile
  },


  /**
   * Sets up indicators for paired literals in a profile to manage UI presentation.
   *
   * For these paired literals, it marks each value
   * with a position indicator ('start', 'middle', or 'end') in the pairedLitearlIndicatorLookup.
   *
   * The indicators help the UI layer properly display multi-language text entries with
   * appropriate styling
   *
   * @param {Object} profile - The BibFrame profile object containing resource templates
   * @returns {void} - Updates the pairedLitearlIndicatorLookup in the ProfileStore
   */
  buildPairedLiteralsIndicators: function(profile){


    useProfileStore().pairedLitearlIndicatorLookup = {}

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


    for (let rt of profile.rtOrder){
      for (let pt of profile.rt[rt].ptOrder){
        let ptObj = profile.rt[rt].pt[pt]
        process(ptObj, function (obj,key,value) {
            // e.g.
            // only array > 1 make it here
            if (value.filter((v)=>{ return (v['@language'])}).length >= 1){
              // only arrays with @language in them make it here and only if they do nt all have it
              value.forEach((v, index)=>{
                // if (index == 0){
                if (index % 2 === 0){
                  useProfileStore().pairedLitearlIndicatorLookup[v['@guid']] = value.length
                }else if (index == value.length-1){
                  useProfileStore().pairedLitearlIndicatorLookup[v['@guid']] = -1
                }else{
                  useProfileStore().pairedLitearlIndicatorLookup[v['@guid']] = -1
                }
              })
            }
        });
      }
    }


  },

  /**
  * Will take a profile obj and make sure the Works have a hasInstance and the Instances have instanceOf
  *
  * @param {object} profile - profile object
  * @return {object} - the updated profile
  */

  linkInstancesWorks: function(useProfile){

    let workUri = null
    let instanceUris = []

    let instanceCount = 0
    for (let k of Object.keys(useProfile.rt)){
      if (k.indexOf(':Instance')>-1){
        if (useProfile.rt[k].URI){
          instanceUris.push(useProfile.rt[k].URI)
        }else{

          let iLabel = (instanceCount==0) ? `${useProfile.eId}` : `${useProfile.eId}-${instanceCount}`
          instanceUris.push(`http://id.loc.gov/resources/instances/${iLabel}`)
          useProfile.rt[k].URI = `http://id.loc.gov/resources/instances/${iLabel}`
        }
        instanceCount++
      }else if (k.indexOf(':Work')>-1){
        if (useProfile.rt[k].URI){
          workUri = useProfile.rt[k].URI
        }else{
          workUri = `http://id.loc.gov/resources/works/${useProfile.eId}`
          useProfile.rt[k].URI = workUri
        }
      }
    }


    // we now know the uris
    for (let k of Object.keys(useProfile.rt)){
      if (k.indexOf(':Instance')>-1){

        for (let pk in useProfile.rt[k].pt){

          if (useProfile.rt[k].pt[pk].propertyURI == 'http://id.loc.gov/ontologies/bibframe/instanceOf'){
            if (!useProfile.rt[k].pt[pk].userValue['http://id.loc.gov/ontologies/bibframe/instanceOf']){
              useProfile.rt[k].pt[pk].userValue['http://id.loc.gov/ontologies/bibframe/instanceOf'] = []
            }
            useProfile.rt[k].pt[pk].userValue['http://id.loc.gov/ontologies/bibframe/instanceOf'].push(
              {
                "@guid": short.generate(),
                "@id": workUri
              })
          }
        }

      }else if (k.indexOf(':Work')>-1){

        for (let pk in useProfile.rt[k].pt){

          if (useProfile.rt[k].pt[pk].propertyURI == 'http://id.loc.gov/ontologies/bibframe/hasInstance'){
            if (!useProfile.rt[k].pt[pk].userValue['http://id.loc.gov/ontologies/bibframe/hasInstance']){
              useProfile.rt[k].pt[pk].userValue['http://id.loc.gov/ontologies/bibframe/hasInstance'] = []
            }
            for (let i of instanceUris){


            useProfile.rt[k].pt[pk].userValue['http://id.loc.gov/ontologies/bibframe/hasInstance'].push(
              {
                "@guid": short.generate(),
                "@id": i
              })
            }
          }
        }


      }
    }



    return useProfile

  },


  removeEmptyBnodes: function(userValue){

    for (let key in userValue){
      if (Array.isArray(userValue[key])){
        let newArray = []
        for (let arrayObj of userValue[key]){
          if (typeof arrayObj === 'object' && !Array.isArray(arrayObj) && arrayObj !== null){
            if (Object.keys(arrayObj).length==1){
              console.log("Bad obj->",arrayObj)
            }else{
              newArray.push(arrayObj)
            }
            // console.log("Is arrayObj object ===>",arrayObj)
          }
        }
        userValue[key] = newArray
      }
    }

    let removeKeys = []
    for (let key in userValue){
      if (Array.isArray(userValue[key])){
        if (userValue[key].length==0){
          removeKeys.push(key)
        }
      }
    }
    if (removeKeys.length>0){
      for (let k of removeKeys){
        delete userValue[k]
      }
    }

    return  userValue

  },

  /**
   * Groups subjects by source, and have LCSH terms first
   *
   * @param {Object} profile  - The BibFrame profile object containing resource templates
   * @return {Object} - The profile with reordered subjects
   */
  groupSubjects: function(profile){
    // return profile
    // Find the subjects
    let subjects = []
    let subjectOrder = []
    let subjectSources = {}
    let rtTarget = ''
    for (let rt of profile.rtOrder){
      for (let pt of profile.rt[rt].ptOrder){
        if (pt.includes("id_loc_gov_ontologies_bibframe_subject__subjects")){
          rtTarget = rt
          let subjUserValue = profile.rt[rt].pt[pt].userValue
          subjects.push(subjUserValue)
          subjectOrder.push(pt)
          let source

          try {
            if (subjUserValue['http://id.loc.gov/ontologies/bibframe/subject'] && subjUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://id.loc.gov/ontologies/bibframe/source']){
              source = subjUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['http://id.loc.gov/ontologies/bibframe/source'][0]['@id']
              if (source == 'http://id.loc.gov/authorities/subjects'){
                source = 'lcsh'
              }
            } else if (subjUserValue['http://id.loc.gov/ontologies/bibframe/subject'] && subjUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['@id'] && subjUserValue['http://id.loc.gov/ontologies/bibframe/subject'][0]['@id'].includes("id.loc.gov")){
              source = "lcsh"
            } else {
              source = "unknown"
            }
          } catch{
            source = "unknown"
          }

          if (Object.keys(subjectSources).includes(source)){
            subjectSources[source].push({value: subjUserValue, id: pt})
          } else {
            subjectSources[source] = [{value: subjUserValue, id: pt}]
          }
        }
      }
    }

    // always have LCSH first and maintain the first subject
    let pos = 0
    for (let t of Object.keys(subjectSources).sort((a,b) => a == 'lcsh' ? -1 : a < b ? 1 : 0)){
      for (let sub of subjectSources[t]){
        profile.rt[rtTarget].pt[subjectOrder.at(pos)].userValue = sub.value
        pos++
      }
    }

    return profile
  },

  /**
   * Reorders all multi-lingual literal values throughout the profile based on script type and user preferences.
   *
   * This method recursively traverses the entire profile data structure searching for arrays of literal
   * values that contain at least one element with a language tag (@language). When found, it sorts these
   * arrays according to the user's preference for display order:
   *
   * - When "--b-edit-main-literal-non-latin-first" is true: Non-Latin literals appear first (reverse sort)
   * - When "--b-edit-main-literal-non-latin-first" is false: Latin literals appear first (standard sort)
   *
   * The sorting is performed using the ProfileStore's sortObjectsByLatinMatch method, which checks each
   * value against Latin character patterns to determine the appropriate ordering.
   *
   * @param {Object} profile - The BibFrame profile object containing resource templates
   * @return {Object} - The profile with reordered literal arrays
   */
   reorderAllNonLatinLiterals: function(profile){

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

    for (let rt of profile.rtOrder){
      for (let pt of profile.rt[rt].ptOrder){
        let ptObj = profile.rt[rt].pt[pt]

        process(ptObj, function (obj,key,value) {
            // e.g.
            // only array > 1 make it here

            // don't try to sort marcKey
            if (["http://id.loc.gov/ontologies/bibframe/contribution","http://id.loc.gov/ontologies/bibframe/subject", "http://id.loc.gov/ontologies/bibframe/geographicCoverage"].indexOf(ptObj.propertyURI)>-1){
              return null
            }

            if (value.length > 1 && value.filter((v)=>{ return (v['@language'])}).length >= 1){
              // only arrays with @language in them make it here and only if they do nt all have it
              if (usePreferenceStore().returnValue('--b-edit-main-literal-non-latin-first')){
                value = useProfileStore().sortObjectsByLatinMatch(value,key).reverse()
              }else{
                value = useProfileStore().sortObjectsByLatinMatch(value,key)
              }
            }
        });

      }
    }

    return profile


  },







}


export default utilsParse;