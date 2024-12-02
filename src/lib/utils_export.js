import {useConfigStore} from "../stores/config";
import {useProfileStore} from "../stores/profile";
import {usePreferenceStore} from "../stores/preference";


// import short from 'short-uuid'
import utilsRDF from './utils_rdf';
import utilsMisc from './utils_misc';
import utilsNetwork from './utils_network';
import utilsProfile from './utils_profile';

import { parse as parseEDTF } from 'edtf'

import { md5 } from "hash-wasm";


const escapeHTML = str => str.replace(/[&<>'"]/g,
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag]));


const formatXML = function(xml, tab = '\t', nl = '\n') {
	if (!xml){
		return 'No XML'
	}
	let formatted = '', indent = '';
	const nodes = xml.slice(1, -1).split(/>\s*</);
	if (nodes[0][0] == '?') formatted += '<' + nodes.shift() + '>' + nl;
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (node[0] == '/') indent = indent.slice(tab.length); // decrease indent
		formatted += indent + '<' + node + '>' + nl;
		if (node[0] != '/' && node[node.length - 1] != '/' && node.indexOf('</') == -1) indent += tab; // increase indent
	}
	return formatted;
}

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




const utilsExport = {


  checkForEDTFDatatype: null,
  lastGoodXMLBuildProfile: null,
  lastGoodXMLBuildProfileTimestamp: null,

  // all the namespaces are stored in the utils_rdf
  namespace: utilsRDF.namespace,

	// ignore these beause they control the shape of the xml and we want to control that
	ignoreProperties: [

		'http://id.loc.gov/ontologies/bibframe/instanceOf',
		'http://id.loc.gov/ontologies/bibframe/hasItem',
		'http://id.loc.gov/ontologies/bibframe/itemOf',
		'http://id.loc.gov/ontologies/bibframe/hasInstance',
		'http://id.loc.gov/ontologies/bibframe/Work'

	],

  /**
  * if passed full uri like http://id.loc.gov/ontology/bibframe/xxx will convert to a prefixed bf:xxx
  *
  * @param {string} uri - the uri to convert
  * @return {string}
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
  * if passed a prefix like bf:xxx it will expand it to http://id.loc.gov/ontology/bibframe...
  *
  * @param {string} passedNS - the prefixed element/prop
  * @return {string}
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
  * creates a element with createElementNS using the correct namespace
  *
  * @param {string} elStr - the element to create
  * @return {element}
  */
  createElByBestNS: function(elStr){
		// HACK - bad marc2bf conversion
		if (elStr == 'http://www.loc.gov/mads/rdf/v1#'){
			elStr = 'http://www.loc.gov/mads/rdf/v1#Authority'
		}

		elStr=elStr.replace('https://','http://')
		// if the elString is not a expanded URI
		if (!elStr.startsWith('http')){
			elStr = this.UriNamespace(elStr)
		}
		for (let ns of Object.keys(this.namespace)){
			if (elStr.startsWith(this.namespace[ns])){
				return document.createElementNS(this.namespace[ns],this.namespaceUri(elStr))
			}
		}
		console.error('could not find namespace for ', elStr)
		return null
	},

  /**
  * A helper function that will build blank node based on userValue obj
  *
  * @param {obj} userValue - the uservalue to test
  * @param {string} property - the property uri
  * @return {boolean}
  */
	createBnode: function(userValue,property){
		// some special cases here
		if (property == 'http://id.loc.gov/ontologies/bibframe/agent'){
			// if it is an agent create the Agent bnode and just add the type to it as rdf:type
			let bnode = this.createElByBestNS('bf:Agent')
			if (userValue['@id']){
				bnode.setAttributeNS(this.namespace.rdf, 'rdf:about', userValue['@id'])
			}
			let rdftype = this.createElByBestNS('rdf:type')
			rdftype.setAttributeNS(this.namespace.rdf, 'rdf:resource', userValue['@type'])
			bnode.appendChild(rdftype)
			if (userValue['@parseType']){
				bnode.setAttribute('rdf:parseType', userValue['@parseType'])
			}
			return bnode
		}else if (userValue['@type'] && userValue['@type'].includes('id.loc.gov/vocabulary/mnotetype')){
			// if it is this specific note vocabulary type then create a bf:Note with a RDF type in it
			let bnode = this.createElByBestNS('bf:Note')
			let rdftype = this.createElByBestNS('rdf:type')
			rdftype.setAttributeNS(this.namespace.rdf, 'rdf:resource', userValue['@type'])
			bnode.appendChild(rdftype)
			return bnode
		}else{
			// just normally make it
			let bnode = this.createElByBestNS(userValue['@type'])
			if (userValue['@id']){
				bnode.setAttributeNS(this.namespace.rdf, 'rdf:about', userValue['@id'])
			}
			if (userValue['@parseType']){
				bnode.setAttribute('rdf:parseType', userValue['@parseType'])
			}
			return bnode
		}

	},

  /**
  * A helper function that will build a literal value element
  *
  * @param {string} property - the property uri
  * @param {obj} userValue - the uservalue to test
  * @return {boolean}
  */
	createLiteral: function(property,userValue){
        let p = this.createElByBestNS(property)


		// it should be stored under the same key
		if (userValue[property] && property != "http://id.loc.gov/ontologies/bibframe/electronicLocator"){
            // without this exception, an edit to an incoming URL in SupplementaryContentNote's "Electronic Location" will update the "rdf:resource"
            // but will also add it to the inside of the tag.

			// one last sanity check, don't make empty literals
			if (userValue[property].trim()==''){
				return false
			}
			p.innerHTML = escapeHTML(userValue[property])
		}
		// does it also have a URI?
		if (userValue['@id']){
			p.setAttributeNS(this.namespace.rdf, 'rdf:resource', userValue['@id'])
		}

		if (!this.checkForEDTFDatatype){ this.checkForEDTFDatatype = useConfigStore().checkForEDTFDatatype}

		if (userValue['@datatype']){
			p.setAttributeNS(this.namespace.rdf, 'rdf:datatype', userValue['@datatype'])
		}else if (this.checkForEDTFDatatype.indexOf(property) >-1)  {
			let dataType = false
			// try to parse the value if it parses use the edtf data type
			try { parseEDTF(userValue[property]); dataType = "http://id.loc.gov/datatypes/edtf" } catch { dataType = false }
			if (dataType){
				p.setAttributeNS(this.namespace.rdf, 'rdf:datatype', dataType)
			}

		}
		if (userValue['@language']){
			p.setAttribute('xml:lang', userValue['@language'])
		}
		if (userValue['@parseType']){
			p.setAttribute('rdf:parseType', userValue['@parseType'])
		}
		if (userValue['@gacs']){
			p.setAttribute('rdf:datatype', userValue['@gacs'])
		}


		// doesnt work :(
		// p.removeAttributeNS("http://www.w3.org/2000/xmlns/", 'xmlns:rdfs')
		return p
	},


  /**
  *
  *
  * @param {obj} userValue - the uservalue to test
  * @return {boolean}
  */
	isBnode: function(userValue){
		// if it has any nested data it is a bnode
		// for (let key in userValue){
		// 	if (Array.isArray(userValue[key])){
		// 		return true
		// 	}
		// }
    // if it has a type then it is a blank node
		if (userValue['@type']){
			return true
		}
		return false
	},

  /**
  * Some structures share the same predicate
  *
  * @param {string} key - the uri
  * @return {boolean}
  */
	needsNewPredicate: function(key) {
		if (key == 'http://www.loc.gov/mads/rdf/v1#componentList'){
			return false
		}
		return true
	},

  /**
  *
  *
  * @param {obj} userValue - the uservalue to test
  * @return {boolean}
  */
	hasUserValue: function(userValue){
		for (let key in userValue){
			if (key == '@id' || key.includes('http://') || key.includes('https://')){
				return true
			}
		}
		// this part looks to see if maybe it is an array of literals, like a top level propert like Statement of Work, etc.
		if (Array.isArray(userValue)){
			let allHaveCorrectKeys = true;
			for (let v of userValue){
				for (let key in v){
					if (!key.startsWith('@') && !key.startsWith('http://') && !key.startsWith('https://')){
						allHaveCorrectKeys = false
					}
				}
			}
			if (allHaveCorrectKeys){ return true }
		}

		return false
	},



  /**
  * returns the just the item portion of the profile
  *
  * @param {string} URI - the uri of the instance to look for it's items
  * @param {obj} profile - profile
  * @param {obj} tleLookup - the lookup created out of the export XML process
  * @return {obj}
  */
	returnHasItem: function(URI,profile,tleLookup){
		let results = []
		let parser = returnDOMParser()
		for (let rt in profile.rt){
			if (profile.rt[rt].itemOf && profile.rt[rt].itemOf == URI){
				if (tleLookup['Item'][profile.rt[rt].URI].getElementsByTagName('bf:itemOf').length==0){
					let hasItem = this.createElByBestNS('bf:itemOf')
					hasItem.setAttributeNS(this.namespace.rdf, 'rdf:resource', profile.rt[rt].itemOf)
					tleLookup['Item'][profile.rt[rt].URI].appendChild(hasItem)
				}
				let item = (new XMLSerializer()).serializeToString(tleLookup['Item'][profile.rt[rt].URI])
				item = parser.parseFromString(item, "text/xml").children[0]
				results.push(item)
			}
		}
		return results
	},
  /**
  * returns the just the work portion of the profile
  *
  * @param {string} instanceURI - the uri of the instance
  * @param {obj} profile - profile
  * @param {obj} tleLookup - the lookup created out of the export XML process
  * @return {obj}
  */
	returnWorkFromInstance: function(instanceURI,profile,tleLookup){
		let parser = returnDOMParser()
		let results = null

		for (let rt in profile.rt){
			if (profile.rt[rt].instanceOf && profile.rt[rt].URI == instanceURI){
				results = (new XMLSerializer()).serializeToString(tleLookup['Work'][profile.rt[rt].instanceOf])
				results = parser.parseFromString(results, "text/xml").children[0]
			}
		}

		// if that didnt work just pick the first work
		if (!results){
			for (let wUri in tleLookup['Work']){
				results = tleLookup['Work'][wUri]
				break
			}
		}
		return results
	},



  /**
  *
  *
  * @param {object} profile - the profile to convert to XML
  * @return {boolean}
  */
  buildXML: async function(profile){

	if (!profile || (profile && Object.keys(profile).length==0)){
		console.warn("Trying to build XML with bad profile:", profile)
		return false
	}



	// if we are in dev mode let the error bubble, but otherwise catch the error and try to recover
	if (useConfigStore().returnUrls.dev === true){

		return await this.buildXMLProcess(profile)

	}else{

		try{
			let xmlObj = await this.buildXMLProcess(profile)
			this.lastGoodXMLBuildProfile = JSON.parse(JSON.stringify(profile))
			this.lastGoodXMLBuildProfileTimestamp = Math.floor(Date.now() / 1000)

			return xmlObj
		} catch (error) {
			console.warn("XML Parsing Error:")
			console.warn(error)

			useProfileStore().triggerBadXMLBuildRecovery(this.lastGoodXMLBuildProfile, this.lastGoodXMLBuildProfileTimestamp)

			let profileAsJson
			try{
				profileAsJson = JSON.stringify(profile,null,2)
			}catch{
				profileAsJson = 'Error stringify-ing profile!'
			}

			let user = `${usePreferenceStore().catInitals}_${usePreferenceStore().catCode}`.replace("/\s/g",'_')
			const filename = `${Math.floor(Date.now() / 1000)}_${user}_` + `${new Date().toDateString()}_${new Date().toTimeString()}`.replaceAll(' ','_').replaceAll(':','-') + '.txt'

			let errorReport = `

			Error: ${error}

			----------------
			XML Creation Log
			----------------

			----End Creation Log----


			****************
			XML Source
			****************
			${(profile.xmlSource) ? profile.xmlSource : 'No Source Found'}
			***End Source***
			`

			utilsNetwork.sendErrorReportLog(errorReport,filename,profileAsJson)



			return false
		}

	}



  },



  /**
  *
  *
  * @param {object} profile - the profile to convert to XML
  * @return {object} multiple XML strings
  */
  buildXMLProcess: async function(profile){
    // console.log(profile)

    // keep track of the proces for later
	// let debugHistory = []
	let xmlLog = []

    let componentXmlLookup = {}

    // keep a copy of the org profile around
    let orginalProfile = profile
	// cut the ref to the orginal
	profile = JSON.parse(JSON.stringify(profile))

	let xmlParser = returnDOMParser()

    // these will store the top level elements
    let tleWork = []
	let tleInstance = []
	let tleItem = []

    // we are creating the xml in two formats, create the root node for both
    let rdf = document.createElementNS(this.namespace.rdf, "RDF");
	let rdfBasic = document.createElementNS(this.namespace.rdf, "RDF");

    // just add all the namespaces into the root element
	for (let ns of Object.keys(this.namespace)){
		rdf.setAttributeNS("http://www.w3.org/2000/xmlns/", `xmlns:${ns}`, this.namespace[ns])
		rdfBasic.setAttributeNS("http://www.w3.org/2000/xmlns/", `xmlns:${ns}`, this.namespace[ns])
	}

    // these are elements used to store metadata about the record in the backend
	let xmlVoidDataRtsUsed = []
	let xmlVoidDataType = []
	let xmlVoidExternalID = []
	let xmlVoidDataTitle = ""
	let xmlVoidDataContributor = ""
	let xmlVoidDataLccn = ""

    let tleLookup = {
		Work: {},
		Instance: {},
		Item: {},
		Hub:{}
	}

		for (let rt of profile.rtOrder){

			xmlLog.push(`Processing rt: ${rt}`)

			if (profile.rt[rt].noData){
				xmlLog.push(` - ${rt} has no data, skipping it.`)
				continue
			}

			let tleArray // eslint-disable-line
			let rootEl
			let rootElName

			if (rt.includes(':Work')){
				tleArray = tleWork
				rootEl = document.createElementNS(this.namespace.bf,"bf:Work");
				rootElName = "Work"
			}else if (rt.includes(':Instance')){
				tleArray = tleInstance
				rootEl = document.createElementNS(this.namespace.bf,"bf:Instance");
				rootElName = "Instance"
			}else if (rt.includes(':Item')){
				tleArray = tleItem
				rootEl = document.createElementNS(this.namespace.bf,"bf:Item");
				rootElName = "Item"
			}else if (rt.endsWith(':Hub')){
				tleArray = tleItem
				rootEl = document.createElementNS(this.namespace.bf,"bf:Hub");
				rootElName = "Hub"
			}else{
				// don't mess with anything that is not a top level entitiy in the profile, there can be other referenced RTs that we don't want to export they are just used in the main RT
				xmlLog.push(`Dunno what this part is, skipping ${rt}`)
				continue
			}

			xmlLog.push(`Building ${rootElName}`)


			// rdf.appendChild(rootEl,tleArray)


			if (profile.rt[rt].URI){
				rootEl.setAttributeNS(this.namespace.rdf, 'rdf:about', profile.rt[rt].URI)
				xmlLog.push(`Setting URI for this resource rdf:about to: ${profile.rt[rt].URI}`)
				xmlVoidExternalID.push(profile.rt[rt].URI)
			}
			if (profile.rt[rt]['@type']){
				let type = this.createElByBestNS('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
				type.setAttributeNS(this.namespace.rdf, 'rdf:resource', profile.rt[rt]['@type'])
				xmlLog.push(`Setting URI for this resource rdf:resource to: ${profile.rt[rt]['@type']}`)
				rootEl.appendChild(type)
			}


			xmlLog.push(`Looping through the PTs`)

			for (let pt of profile.rt[rt].ptOrder){
        		// extract the pt, this is the individual component like a <mainTitle>
				let ptObj = profile.rt[rt].pt[pt]
				if (ptObj.deleted){
					continue
				}

				if (ptObj.deepHierarchy){

					// just take our existing XML and plop it into the root element
					let orgNode = xmlParser.parseFromString(ptObj.xmlSource, "text/xml").children[0]
					rootEl.appendChild(orgNode)
					continue


				}

				xmlLog.push(`Working on: ${pt}`)
				// console.log('ptObj.userValue',ptObj.userValue)

				let userValue

        		// the uservalue could be stored in a few places depending on the nesting
				if (ptObj.userValue[ptObj.propertyURI] && ptObj.userValue[ptObj.propertyURI][0]){
					userValue = ptObj.userValue[ptObj.propertyURI][0]
					// it might be a top level literal, if so we don't want to exclude additonal literals that might be added
					// so look to see if the node we got only has a guid and literal value, and if so look if there are more of them as siblings
					// and select that if so
					let nonGuidProps = Object.keys(ptObj.userValue[ptObj.propertyURI][0]).filter(k => (!k.includes('@') ? true : false ))
					if (nonGuidProps.length==1){
						if (typeof ptObj.userValue[ptObj.propertyURI][0][nonGuidProps[0]] == 'string' || typeof ptObj.userValue[ptObj.propertyURI][0][nonGuidProps[0]] == 'number'){
							// console.log("It is a top level literal")
							// does it have more than one?
							if (ptObj.userValue[ptObj.propertyURI].length > 1){
								// console.log("It is a multi-top-level-literal!")
								// set it to the sibling group not the individual
								userValue = ptObj.userValue[ptObj.propertyURI]
								// console.log("SETTING userValue to the group!",userValue)
							}
						}
					}

				}else if (ptObj.userValue[ptObj.propertyURI]){
					userValue = ptObj.userValue[ptObj.propertyURI]
				}else{
					userValue = ptObj.userValue
				}

				// temp hack to clcean up bad data -- not perm required
				for (let k of Object.keys(userValue)){
					if (k === 'undefined'){
						delete userValue[k]
					}
				}

				let mostCommonScript = useProfileStore().setMostCommonNonLatinScript()

				// in bf->marc conversion it builds 880s and 600s based off of the presenece of
				// multiple auth labels one with no @lang tag and ones that do have it
				// check specific properties for now? (10/2024)
				if ([
					'http://id.loc.gov/ontologies/bibframe/contribution',
					'http://id.loc.gov/ontologies/bibframe/subject',
					'http://id.loc.gov/ontologies/bibframe/geographicCoverage'

				].indexOf(ptObj.propertyURI)>-1){

					// recusrive function to go through each key in the userValue and keep going till we find labels or marckeys
					// the two properties that make 880s work
					let process = function(obj, func) {
						if (Array.isArray(obj)){
							obj.forEach(function (child) {
							process(child, func);
							});
						}else if (typeof obj == 'object' && obj !== null){
							for (let k in obj){
							if (Array.isArray(obj[k])){
								// we only care about these properties
								if (k == 'http://www.w3.org/2000/01/rdf-schema#label' || k == 'http://id.loc.gov/ontologies/bflc/marcKey' || k == 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'){
									func(k,obj[k])
								}else{
									process(obj[k], func);
								}
							}
							}
						}
					}

					process(ptObj.userValue, function (property,ary) {
						// does it have multiple values?
						if (ary.length>1 && mostCommonScript){
							let nonLatinAgent = useProfileStore().returnAllNonLatinAgentOptions()[ptObj['@guid']]
							let keepLang = []
							if (nonLatinAgent){
								let useLang = utilsProfile.pickBestNonLatinScriptOption(mostCommonScript, nonLatinAgent.scripts)
								if (useLang){
									keepLang.push(useLang)
								}
							}
							// if we have a language then great, also check the manual setting
							if (profile.nonLatinScriptAgents){
								if (profile.nonLatinScriptAgents[ptObj['@guid']]){
									keepLang = [profile.nonLatinScriptAgents[ptObj['@guid']]]
								}
							}
							if (keepLang.length==0){
								console.warn("No non-latin agent access point was able to be selected for this agent!", ptObj)
							}

							let toRemove = []
							for (var i = 0; i < ary.length; i++) {
								let value = ary[i]
								// no lang tag? good, thats the authorized latin script one
								if (!value['@language']){
									continue
								}else{
									// it has a language tag? is it one of the ones we want to keep?
									let keepIt = false
									for (let l of keepLang){

										if (value['@language'].toLowerCase().indexOf('-' + l.toLowerCase()) >-1){
											keepIt = true
										}
									}
									if (!keepIt){
										toRemove.push(value['@language'])
									}
								}
							}
							for (let l of toRemove){
								let indexToDel = ary.map((v)=>{return v['@language']}).indexOf(l)
								ary.splice(indexToDel,1)
							}


						}else if (ary.length>1 && !mostCommonScript){

							// there isn't a non-latin script in the record, so remove all the non-latin properties
							let toRemove = []
							for (var i = 0; i < ary.length; i++) {
								let value = ary[i]
								if (value['@language']){
									toRemove.push(value['@language'])
								}
							}
							for (let l of toRemove){
								let indexToDel = ary.map((v)=>{return v['@language']}).indexOf(l)
								ary.splice(indexToDel,1)
							}


						}
					});
				}


				xmlLog.push(['Set userValue to:', JSON.parse(JSON.stringify(userValue)) ])

				if (this.ignoreProperties.indexOf(ptObj.propertyURI) > -1){
					xmlLog.push(`Skpping it because it is in the ignoreProperties list`)
					continue
				}


				// do some updates to the admin metadata
				if (pt.includes('http://id.loc.gov/ontologies/bibframe/adminMetadata')){
					let adminData = ptObj.userValue['http://id.loc.gov/ontologies/bibframe/adminMetadata'][0]
					// set the profile used
					adminData['http://id.loc.gov/ontologies/bflc/profile'] = [
						{
							'http://id.loc.gov/ontologies/bflc/profile' : rt
						}
					]
					// drop any existing changeDate and add our own
					try{
						delete adminData['http://id.loc.gov/ontologies/bibframe/changeDate']
					}catch (e){
						//
					}
					// add our own
					adminData['http://id.loc.gov/ontologies/bibframe/changeDate'] = [
						{
							'http://id.loc.gov/ontologies/bibframe/changeDate' : new Date().toISOString().split('.')[0]+"Z",
							'@datatype': 'http://www.w3.org/2001/XMLSchema#dateTime'
						}
					]
					// and make a creationdate if it doesn't yet exist
					if (!adminData['http://id.loc.gov/ontologies/bibframe/creationDate']){
						adminData['http://id.loc.gov/ontologies/bibframe/creationDate'] = [
							{
								'http://id.loc.gov/ontologies/bibframe/creationDate' : new Date().toISOString().split('.')[0]+"Z",
								'@datatype': 'http://www.w3.org/2001/XMLSchema#dateTime'
							}
						]
					}
					xmlLog.push(['Set adminData to:', JSON.parse(JSON.stringify(adminData)) ])
					// make sure if its an instance it has a localid
				}


				// does it even have any userValues?
				if (this.hasUserValue(userValue)){
					// keep track of what resource teplates we used in this record
					if (xmlVoidDataRtsUsed.indexOf(rt)==-1){
						xmlVoidDataRtsUsed.push(rt)
					}
					if (xmlVoidDataType.indexOf(rootElName)==-1){
						xmlVoidDataType.push(rootElName)
					}

					// is it a Blank node
					if (this.isBnode(userValue)){
						// this.debug(ptObj.propertyURI,'root level element, is bnode', userValue)
						xmlLog.push(`Root level bnode: ${ptObj.propertyURI}`)

						let pLvl1 = this.createElByBestNS(ptObj.propertyURI)

						let bnodeLvl1 = this.createBnode(userValue, ptObj.propertyURI)

						xmlLog.push(`Created lvl 1 predicate: ${pLvl1.tagName} and bnode: ${bnodeLvl1.tagName}`)

						// loop though the properties
						for (let key1 of Object.keys(userValue).filter(k => (!k.includes('@') ? true : false ) )){
							xmlLog.push(`Looking at property : ${key1} in the userValue`)
							// console.log('userValue',userValue)
							let pLvl2 = this.createElByBestNS(key1)
							if (key1 == 'http://www.loc.gov/mads/rdf/v1#componentList'){
								pLvl2.setAttribute('rdf:parseType', 'Collection')
							}
							xmlLog.push(`Created lvl 2 predicate: ${pLvl2.tagName}`)

							// if we have a rdf:type here build a stand alone type element and move on
							// TODO: add the label if present(?)

							if (key1 == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'){
								if (userValue[key1] && userValue[key1][0] && userValue[key1][0]['@id']){
									let rdftype = this.createElByBestNS(key1)
									rdftype.setAttributeNS(this.namespace.rdf, 'rdf:resource', userValue[key1][0]['@id'])

									bnodeLvl1.appendChild(rdftype)
									xmlLog.push(`This bnode just has a rdf:type : ${rdftype} setting it an continuing`)
									continue
								}else if (userValue[key1] && userValue[key1][0] && userValue[key1][0]['http://www.w3.org/2000/01/rdf-schema#label']){
									let rdftype = this.createElByBestNS(key1)
									rdftype.innerHTML=escapeHTML(userValue[key1][0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label'])
									xmlLog.push(`This bnode just has a rdf:type and label : ${rdftype} setting it an continuing`)

                                    bnodeLvl1.appendChild(rdftype)
									continue
								}
							}


							let value1FirstLoop = true
							// loop through the value array of each of them
							for (let value1 of userValue[key1]){

								if (!value1FirstLoop && this.needsNewPredicate(key1)){
									// we are going to make a new predicate, same type but not the same one as the last one was attached to
									pLvl2 = this.createElByBestNS(key1)
									xmlLog.push(`Creating lvl 2 property : ${pLvl2.tagName} for ${JSON.stringify(value1)}`)
								}


								// is it a bnode?  createElByBestNS
								if (this.isBnode(value1)){
									// yes
									let bnodeLvl2 = this.createBnode(value1,key1)

									pLvl2.appendChild(bnodeLvl2)
									bnodeLvl1.appendChild(pLvl2)
									xmlLog.push(`Creating bnode lvl 2 for it ${bnodeLvl2.tagName}`)

                  					// now loop through its properties and see whats nested
									for (let key2 of Object.keys(value1).filter(k => (!k.includes('@') ? true : false ) )){
										let pLvl3 = this.createElByBestNS(key2)

										xmlLog.push(`Creating lvl 3 property: ${pLvl3.tagName} for ${key2}`)

                                        for (let value2 of value1[key2]){
                                            if (this.isBnode(value2)){
                                                // more nested bnode
                                                // one more level
                                                let bnodeLvl3 = this.createBnode(value2,key2)
                                                pLvl3.appendChild(bnodeLvl3)
                                                bnodeLvl2.appendChild(pLvl3)
                                                xmlLog.push(`Creating lvl 3 bnode: ${bnodeLvl3.tagName} for ${key2}`)


                                                for (let key3 of Object.keys(value2).filter(k => (!k.includes('@') ? true : false ) )){
                                                    let pLvl4 = this.createElByBestNS(key2)
                                                    for (let value3 of value2[key3]){
                                                        if (this.isBnode(value3)){
                                                            // one more level
                                                            let bnodeLvl4 = this.createBnode(value3,key3)
                                                            pLvl4.appendChild(bnodeLvl4)
                                                            bnodeLvl3.appendChild(pLvl4)
                                                            xmlLog.push(`Creating lvl 4 bnode: ${bnodeLvl4.tagName} for ${key3}`)


                                                            for (let key4 of Object.keys(value3).filter(k => (!k.includes('@') ? true : false ) )){
                                                                for (let value4 of value3[key4]){
                                                                    if (this.isBnode(value4)){
                                                                        console.error("Max hierarchy depth reached, but there are more levels left:", key4, 'in', userValue )
                                                                        xmlLog.push(`Max hierarchy depth reached, but there are more levels left for ${key4}`)

                                                                    }else{

                                                                        for (let key5 of Object.keys(value4).filter(k => (!k.includes('@') ? true : false ) )){
                                                                            if (typeof value4[key5] == 'string' || typeof value4[key5] == 'number'){
                                                                                // its a label or some other literal
                                                                                let p5 = this.createLiteral(key5, value4)
                                                                                if (p5!==false) bnodeLvl4.appendChild(p5);
                                                                                xmlLog.push(`Added literal ${p5} for ${key5}`)
                                                                            }else{
                                                                                console.error('key5', key5, value4[key5], 'not a literal, should not happen')
                                                                                xmlLog.push(`Error not a literal but I thought it was at ${key5}`)
                                                                            }
                                                                        }

                                                                    }

                                                                }

                                                            }


                                                        }else{
                                                            for (let key4 of Object.keys(value3).filter(k => (!k.includes('@') ? true : false ) )){
                                                                if (typeof value3[key4] == 'string' || typeof value3[key4] == 'number'){
                                                                    // its a label or some other literal
                                                                    let p4 = this.createLiteral(key4, value3)
                                                                    if (p4!==false) bnodeLvl3.appendChild(p4)
                                                                    //xmlLog.push(`Added literal ${p4} for ${key4}`)
                                                                }else{
                                                                    console.error('key4', key4, value3[key4], 'not a literal, should not happen')
                                                                    xmlLog.push(`Error not a literal but I thought it was at ${key4}`)
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }else{
                                                for (let key3 of Object.keys(value2).filter(k => (!k.includes('@') ? true : false ) )){
                                                    if (typeof value2[key3] == 'string' || typeof value2[key3] == 'number'){
                                                        // its a label or some other literal
                                                        let p3 = this.createLiteral(key3, value2)
                                                        if (p3!==false) bnodeLvl2.appendChild(p3)
                                                        xmlLog.push(`Created Literal ${p3.innerHTML} for ${key3}`)
                                                    }else{
                                                        console.error('key3', key3, value2[key3], 'not a literal, should not happen')
                                                        xmlLog.push(`Error not a literal but I thought it was at ${key3}`)
                                                    }
                                                }
                                            }
                                        }
									}
								}else{
									xmlLog.push(`It's value at lvl is not a bnode, looping through and adding a literal value`)
									// no it is a literal or something else
									// loop through its keys and make the values
									let keys = Object.keys(value1).filter(k => (!k.includes('@') ? true : false ) )
									if (userValue['@type'] &&  key1 ===  userValue['@type']){
										// if the type of the bnode matches the bnode we are in
										// then it means its a ref template, if it has an id then
										// set the rdf about on it
										if (value1['@id']){
											xmlLog.push(`Setting its rdf:about to ${value1['@id']}`)
											bnodeLvl1.setAttributeNS(this.namespace.rdf, 'rdf:about', value1['@id'])
										}
									}

                                    if (keys.length>0){
										for (let key2 of keys){
											if (typeof value1[key2] == 'string' || typeof value1[key2] == 'number'){
                                                    let p2 = this.createLiteral(key2, value1)
                                                    xmlLog.push(`Creating literal ${JSON.stringify(value1)}`)
                                                    if (p2!==false) bnodeLvl1.appendChild(p2);
											}else if (Array.isArray(value1[key2])){
												for (let arrayValue of value1[key2]){
													let keysLevel2 = Object.keys(arrayValue).filter(k => (!k.includes('@') ? true : false ) )
													if (keysLevel2.length>0){

														for (let key22 of keysLevel2){
															if (typeof arrayValue[key22] == 'string' || typeof arrayValue[key22] == 'number'){
																// its a label or some other literal
																let p2 = this.createLiteral(key22, arrayValue)
																xmlLog.push(`Creating literal ${JSON.stringify(arrayValue[key22])}`)
																if (p2!==false) bnodeLvl1.appendChild(p2)
															}else{
																console.error('key22', key22, arrayValue[key22], 'not a literal, should not happen')
																xmlLog.push(`Error not a literal ${arrayValue[key22]}`)

															}


														}
													}
												}




											}else{

												console.error('key2', key2, value1[key2], 'not a literal, should not happen')
												xmlLog.push(`Key 2 (${key2}) error, not a literal ${value1[key2]}`)

											}

										}
									}else if (keys.length==0 && value1['@id']){
										let p2 = this.createLiteral(key1, value1)
										if (p2!==false) bnodeLvl1.appendChild(p2);


									}else{

										console.warn('Unhadled literal situtation')
										console.log("value1", value1, 'key1',key1)
										// just set it to an empty value
										value1[key1] = ""


									}




								}

								value1FirstLoop = false

							}
						}
						pLvl1.appendChild(bnodeLvl1)
						rootEl.appendChild(pLvl1)

						componentXmlLookup[`${rt}-${pt}`] = formatXML(pLvl1.outerHTML)

					}else{
						// this.debug(ptObj.propertyURI, 'root level element does not look like a bnode', userValue)
						xmlLog.push(`Root level does not look like a bnode: ${ptObj.propertyURI}`)
						let userValueArray = userValue
						if (!Array.isArray(userValue)){
							userValueArray = [userValue]
						}


						// but it might be a bnode, but with only a URI
						for (let userValue of userValueArray){

							// 2024 - Still needed?
							if (userValue['@flags'] && userValue['@flags'].indexOf('simpleLookupTopLevelMulti') > -1){

								// xmlLog.push(`Found special flag rule for ${ptObj.propertyURI}`)
								// // an edge case here where we wanted to allow multiple simple lookups in root level fields
								// // like carrierType, loop through the labels, build the properties, if it doesnt have a @id its because its at te root lvl

								// if (userValue['http://www.w3.org/2000/01/rdf-schema#label']){

								// 	let allXMLFragments = ''
								// 	for (let label of userValue['http://www.w3.org/2000/01/rdf-schema#label']){

								// 		let p = this.createElByBestNS(ptObj.propertyURI)
								// 		let bnode = this.createElByBestNS(await this.suggestType(ptObj.propertyURI))
								// 		xmlLog.push(`Created ${p.tagName} property and ${bnode.tagName} bnode`)
								// 		p.appendChild(bnode)
								// 		rootEl.appendChild(p)

								// 		if (label['http://www.w3.org/2000/01/rdf-schema#label']){
								// 			let lp = this.createElByBestNS('http://www.w3.org/2000/01/rdf-schema#label')
								// 			lp.innerHTML = label['http://www.w3.org/2000/01/rdf-schema#label']
								// 			bnode.appendChild(lp)
								// 		}

								// 		if (label['@id']){
								// 			xmlLog.push(`Set rdf:about from label bnode ${label['@id']}`)
								// 			bnode.setAttributeNS(this.namespace.rdf, 'rdf:about', label['@id'])

								// 		}else if (userValue['@id']){
								// 			xmlLog.push(`Set rdf:about from root userValue @id ${userValue['@id']}`)
								// 			bnode.setAttributeNS(this.namespace.rdf, 'rdf:about', userValue['@id'])
								// 		}

								// 		allXMLFragments = allXMLFragments + `\n${formatXML(p.outerHTML)}`


								// 	}
								// 	componentXmlLookup[`${rt}-${pt}`] = allXMLFragments



								// }



							}else if (userValue['@type'] && userValue['@id']){

								// this.debug(ptObj.propertyURI, 'But has @type, making bnode')

								let p = this.createElByBestNS(ptObj.propertyURI)
								let bnode = this.createElByBestNS(userValue['@type'])
								bnode.setAttributeNS(this.namespace.rdf, 'rdf:about', userValue['@id'])

								xmlLog.push(`Created ${p.tagName} property and ${bnode.tagName} bnode`)
								p.appendChild(bnode)
								rootEl.appendChild(p)
								componentXmlLookup[`${rt}-${pt}`] = formatXML(p.outerHTML)


							}else if (userValue['@type'] && !userValue['@id']){

								// this.debug(ptObj.propertyURI, 'Does not have URI, error', userValue)
								xmlLog.push(`Should have a URI in ${ptObj.propertyURI} but can't find one`)


								console.error("Does not have URI, ERROR")
							}else if (await utilsRDF.suggestTypeNetwork(ptObj.propertyURI) == 'http://www.w3.org/2000/01/rdf-schema#Literal'){
								// console.log("Top level literal HERE!",userValue)
								// its just a top level literal property
								// loop through its keys and make the values
								let allXMLFragments = ''
								for (let key1 of Object.keys(userValue).filter(k => (!k.includes('@') ? true : false ) )){
									// console.log('userValue',userValue)
									// console.log('key1',key1)
									// console.log("userValue[key1]",userValue[key1])
									// are we at the right level?
									if (typeof userValue[key1] === 'string' || typeof userValue[key1] === 'number'){

										let p1 = this.createLiteral(key1, userValue)
										// console.log("p1",p1)
										if (p1!==false) {
											rootEl.appendChild(p1);
											xmlLog.push(`Creating literal at root level for ${key1} with value ${p1.innerHTML}`)
											allXMLFragments = allXMLFragments + `\n${formatXML(p1.outerHTML)}`
										}
									}else{
										for (let value1 of userValue[key1]){
											for (let key2 of Object.keys(value1).filter(k => (!k.includes('@') ? true : false ) )){
												if (typeof value1[key2] == 'string' || typeof value1[key2] == 'number'){
													// its a label or some other literal
													let p1 = this.createLiteral(key2, value1)
													if (p1!==false) {
														rootEl.appendChild(p1);
														allXMLFragments = allXMLFragments + `\n${formatXML(p1.outerHTML)}`
														xmlLog.push(`Creating literal at root level for ${key2} with value ${value1}`)
													}
												}else{
													console.error('key2', key2, value1[key2], 'not a literal, should not happen')
													xmlLog.push(`Not a literal at root level ${key2} with value ${value1[key2]}`)
												}
											}
										}
									}
								}
								componentXmlLookup[`${rt}-${pt}`] = allXMLFragments
                            //Exception for electronicLocator so it is handled by in the next block, otherwise, it won't appear in the XML
							}else if (ptObj.propertyURI != "http://id.loc.gov/ontologies/bibframe/electronicLocator" && await utilsRDF.suggestTypeNetwork(ptObj.propertyURI) == 'http://www.w3.org/2000/01/rdf-schema#Resource'){
								// if it is a marked in the profile as a literal and has expected value of rdf:Resource flatten it to a string literal
								let allXMLFragments = ''
								for (let key1 of Object.keys(userValue).filter(k => (!k.includes('@') ? true : false ) )){

									for (let value1 of userValue[key1]){
										for (let key2 of Object.keys(value1).filter(k => (!k.includes('@') ? true : false ) )){
											if (typeof value1[key2] == 'string' || typeof value1[key2] == 'number'){
												// its a label or some other literal
												let p1 = this.createLiteral(key2, value1)
												if (p1!==false) {
													rootEl.appendChild(p1);
													allXMLFragments = allXMLFragments + `\n${formatXML(p1.outerHTML)}`
													xmlLog.push(`Listed as rdf:Resource but treating it a a literal, Creating literal for ${key2} with value ${p1.innerHTML}`)
												}
											}else{
												console.error('key2', key2, value1[key2], 'not a literal, should not happen')
												xmlLog.push(`Not a literal at root level ${key2} with value ${value1[key2]}`)
											}
										}
									}
								}
								componentXmlLookup[`${rt}-${pt}`] = allXMLFragments
							}else if (userValue['@id']){
								// it has a URI at least, so make that
								let p = this.createElByBestNS(ptObj.propertyURI)
								p.setAttributeNS(this.namespace.rdf, 'rdf:resource', userValue['@id'])
								rootEl.appendChild(p)
								componentXmlLookup[`${rt}-${pt}`] = formatXML(p.outerHTML)

							}else if (ptObj.propertyURI == 'http://www.w3.org/2000/01/rdf-schema#label'){

								// does it just have a label?
								let p = this.createElByBestNS(ptObj.propertyURI)
								p.innerHTML = userValue['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']
								rootEl.appendChild(p)
								componentXmlLookup[`${rt}-${pt}`] = formatXML(p.outerHTML)


							}else{
								// this.debug(ptObj.propertyURI, 'Does not have @type, something is wrong here', userValue)
								// console.log(ptObj.propertyURI, 'Does not have @type, something is wrong here', userValue)
								// console.log("suggest type is:",await this.suggestType(ptObj.propertyURI))
								console.warn("Should not be here")
								// alert("Not everything entered was serialized into XML, please report this record and check the output.")
							}

						}
					}
					// build the predicate
					// //
					// if (rootElName ==='Item'){
					// }
				}else{
					xmlLog.push(`Skpping it because hasUserValue == false`)
				}
			}


			// add in the admindata
			// if (orginalProfile.rt[rt].adminMetadataData){


			// 	let parser = new DOMParser();
			// 	let adm = parser.parseFromString(orginalProfile.rt[rt].adminMetadataData, "text/xml");

			// 	adm = adm.children[0]

			// 	if (adm.getElementsByTagName('bflc:procInfo').length>0){
			// 		adm.getElementsByTagName('bflc:procInfo')[0].remove()
			// 	}
			// 	let p = this.createElByBestNS('bflc:procInfo')
			// 	p.innerHTML = profile.rt[rt].procInfo


			// 	for (let el of adm.getElementsByTagName('bflc:generationProcess')){
			// 		for (let el2 of el.getElementsByTagName('rdfs:label')){

			// 			// remove it
			// 			if (el2.innerHTML.startsWith('BFE2')){
			// 				el.remove()
			// 			}

			// 		}
			// 	}

			// 	// add in new one
			// 	let gP = this.createElByBestNS('bf:generationProcess')
			// 	adm.appendChild(gP)
			// 	let GP = this.createElByBestNS('bf:GenerationProcess')
			// 	gP.appendChild(GP)

			// 	let GPD = this.createElByBestNS('bf:generationDate')
			// 	GPD.innerHTML = new Date().toISOString()
			// 	GPD.setAttributeNS(this.namespace.rdf, 'rdf:datatype', 'http://www.w3.org/2001/XMLSchema#dateTime')
			// 	GP.appendChild(GPD)


			// 	let GPL = this.createElByBestNS('rdfs:label')

			// 	GPL.innerHTML = `BFE2 v${config.versionMajor}.${config.versionMinor}.${config.versionPatch}`
			// 	GP.appendChild(GPL)




			// 	adm.getElementsByTagName('bf:AdminMetadata')[0].appendChild(p)



			// 	rootEl.appendChild(adm)
			// }



			if (orginalProfile.rt[rt].unusedXml){

				let unusedXmlNode = xmlParser.parseFromString(orginalProfile.rt[rt].unusedXml, "text/xml")
				unusedXmlNode = unusedXmlNode.children[0]
				for (let el of unusedXmlNode.children){
					// console.log("Looking at",el.tagName)
					if (el.tagName != 'rdfs:label'){
						// there is some strange behavior adding the element directly
						// so make a copy of it and insert the copy parsed from the string xml
						let newEl = (new XMLSerializer()).serializeToString(el)
						newEl = xmlParser.parseFromString(newEl, "text/xml")
						newEl = newEl.children[0]
						rootEl.appendChild(newEl)
					}
				}
			}

			// build the lookup
			tleLookup[rootElName][orginalProfile.rt[rt].URI] = rootEl
		}

		// console.log("tleLookup --- tleLookup")
		// console.log(tleLookup)


		// Add in a adminMetadata to the resources with this user id
		// catInitals.log(profile)
		//get user info from preferenceStore instead of the profile
		let userInitial = usePreferenceStore().catInitals
		let catCode = usePreferenceStore().catCode
		let user = `${userInitial} (${catCode})`
		profile.user = user
		// console.info("userInitial: ", userInitial)
		// console.info("userCode: ", userCode)
		// let catCode = profile.user.split(" (")
		// catCode = catCode[catCode.length-1]
		// catCode=catCode.split(")")[0]

		let bf_adminMetadata = this.createElByBestNS("bf:adminMetadata")
		let bf_AdminMetadtat = this.createElByBestNS("bf:AdminMetadata")
		let bf_status = this.createElByBestNS("bf:status")
		let bf_Status = this.createElByBestNS("bf:Status")

		bf_Status.setAttributeNS(this.namespace.rdf, 'rdf:about','http://id.loc.gov/vocabulary/mstatus/c')
		let bf_StatusLabel = this.createElByBestNS("rdfs:label")
		bf_StatusLabel.innerHTML="changed"

		let bf_catalogerId = this.createElByBestNS("bflc:catalogerId")
		bf_catalogerId.innerHTML = escapeHTML(catCode)

		let bf_date = this.createElByBestNS("bf:date")
		bf_date.innerHTML = new Date().toISOString()

		bf_AdminMetadtat.appendChild(bf_date)
		bf_AdminMetadtat.appendChild(bf_catalogerId)

		bf_Status.appendChild(bf_StatusLabel)
		bf_status.appendChild(bf_Status)
		bf_AdminMetadtat.appendChild(bf_status)
		bf_adminMetadata.appendChild(bf_AdminMetadtat)


		let adminMetadataText = (new XMLSerializer()).serializeToString(bf_adminMetadata)





		for (let URI in tleLookup['Work']){
			tleLookup['Work'][URI].appendChild(xmlParser.parseFromString(adminMetadataText, "text/xml").children[0])
		}
		for (let URI in tleLookup['Instance']){
			tleLookup['Instance'][URI].appendChild(xmlParser.parseFromString(adminMetadataText, "text/xml").children[0])
		}



		// also just build a basic version tosave
		for (let URI in tleLookup['Work']){
			let theWork = (new XMLSerializer()).serializeToString(tleLookup['Work'][URI])
			// theWork = theWork.replace(/\sxmlns:[a-z]+="http.*?"/g,'')
			theWork = xmlParser.parseFromString(theWork, "text/xml").children[0];
			rdfBasic.appendChild(theWork)
		}
		for (let URI in tleLookup['Hub']){
			let theHub = (new XMLSerializer()).serializeToString(tleLookup['Hub'][URI])
			// theHub = theHub.replace(/\sxmlns:[a-z]+="http.*?"/g,'')
			theHub = xmlParser.parseFromString(theHub, "text/xml").children[0];
			rdfBasic.appendChild(theHub)
		}

		for (let URI in tleLookup['Instance']){
			// let instance = tleLookup['Instance'][URI].cloneNode( true )
			let instance = (new XMLSerializer()).serializeToString(tleLookup['Instance'][URI])
			// instance = instance.replace(/\sxmlns:[a-z]+="http.*?"/g,'')
			instance = xmlParser.parseFromString(instance, "text/xml").children[0];
			let items = this.returnHasItem(URI,orginalProfile,tleLookup)
			// alert(items.length)s
			for (let item of items){
				let uri = null
				if (item.attributes['rdf:resource']){
					uri = item.attributes['rdf:resource'].value
				}else if(item.attributes['rdf:about']){
					uri = item.attributes['rdf:about'].value
				}
				if (uri){
					let hasItem = this.createElByBestNS('bf:hasItem')
					hasItem.setAttributeNS(this.namespace.rdf, 'rdf:resource', uri)
					instance.appendChild(hasItem)
				}
			}

			// there is only one work, so add it as the instanceOf
			for (let WorkURI in tleLookup['Work']){
				let instanceOf = this.createElByBestNS('bf:instanceOf')
				instanceOf.setAttributeNS(this.namespace.rdf, 'rdf:resource', WorkURI)
				instance.appendChild(instanceOf)
			}
			rdfBasic.appendChild(instance)
		}
		for (let URI in tleLookup['Item']){
			// rdfBasic.appendChild(tleLookup['Item'][URI].cloneNode( true ))
			let item = (new XMLSerializer()).serializeToString(tleLookup['Item'][URI])
			// item = item.replace(/\sxmlns:[a-z]+="http.*?"/g,'')
			item = xmlParser.parseFromString(item, "text/xml").children[0];
			rdfBasic.appendChild(item)
		}

		if (orginalProfile.procInfo.includes("update")){
			//build it cenered around the instance
			if (Object.keys(tleLookup['Instance']).length>0){
				for (let URI in tleLookup['Instance']){
					// let instance = tleLookup['Instance'][URI].cloneNode( true )
					let instance = (new XMLSerializer()).serializeToString(tleLookup['Instance'][URI])
					instance = xmlParser.parseFromString(instance, "text/xml").children[0];
					let items = this.returnHasItem(URI,orginalProfile,tleLookup)
					if (items.length > 0){
						for (let item of items){
							let p = this.createElByBestNS('bf:hasItem')
							p.appendChild(item)
							instance.appendChild(p)
						}
					}

					let work = this.returnWorkFromInstance(URI,orginalProfile,tleLookup)
					if (work){
						let p = this.createElByBestNS('bf:instanceOf')
						p.appendChild(work)
						instance.appendChild(p)
					}

					rdf.appendChild(instance)
				}
			}else{

				// no instances...then dont use instanceOf...
				// use the first work key TODO: multiple works....?
				let workKey = Object.keys(tleLookup['Work'])[0]
				let work = tleLookup['Work'][workKey]
				if (work){
				  rdf.appendChild(work)
				}
			}
		}else{
			// FIX CHANGE NOT RIGHT ECT!!
			for (let URI in tleLookup['Instance']){
			// let instance = tleLookup['Instance'][URI].cloneNode( true )
				let instance = (new XMLSerializer()).serializeToString(tleLookup['Instance'][URI])
				instance = xmlParser.parseFromString(instance, "text/xml").children[0];
				let items = this.returnHasItem(URI,orginalProfile,tleLookup)
				if (items.length > 0){
					for (let item of items){
						let p = this.createElByBestNS('bf:hasItem')
						p.appendChild(item)
						instance.appendChild(p)
					}
				}
				let work = this.returnWorkFromInstance(URI,orginalProfile,tleLookup)

				if (work){
					let p = this.createElByBestNS('bf:instanceOf')
					p.appendChild(work)
					instance.appendChild(p)
				}
				rdf.appendChild(instance)
			}
		}



		// are we just editing a single HUB?
		if (Object.keys(tleLookup['Work']).length==0 && Object.keys(tleLookup['Hub']).length == 1){


			let theHub = (new XMLSerializer()).serializeToString(rdfBasic)
			theHub = parser.parseFromString(theHub, "text/xml").children[0];

			rdf = theHub
		}

		if (rdfBasic.getElementsByTagName("bf:mainTitle").length>0){
			xmlVoidDataTitle = rdfBasic.getElementsByTagName("bf:mainTitle")[0].innerHTML

		}else if (rdfBasic.getElementsByTagName("bfsimple:prefTitle").length>0){
			xmlVoidDataTitle = rdfBasic.getElementsByTagName("bfsimple:prefTitle")[0].innerHTML

		}else{
			console.warn('no title found for db')
		}

		if (rdfBasic.getElementsByTagName("bf:PrimaryContribution").length>0){
			if (rdfBasic.getElementsByTagName("bf:PrimaryContribution")[0].getElementsByTagName("rdfs:label").length>0){
				xmlVoidDataContributor = rdfBasic.getElementsByTagName("bf:PrimaryContribution")[0].getElementsByTagName("rdfs:label")[0].innerHTML
			}
		}else{
			if (rdfBasic.getElementsByTagName("bf:Contribution").length>0){
				if (rdfBasic.getElementsByTagName("bf:Contribution")[0].getElementsByTagName("rdfs:label").length>0){
					xmlVoidDataContributor = rdfBasic.getElementsByTagName("bf:Contribution")[0].getElementsByTagName("rdfs:label")[0].innerHTML
				} else {
					console.warn('no PrimaryContribution or Contribution found for db')
				}
			} else{
				console.warn('no PrimaryContribution or Contribution found for db')
			}
		}



		if (rdfBasic.getElementsByTagName("bf:Instance").length>0){
			let i = rdfBasic.getElementsByTagName("bf:Instance")[0]

			// then find all the lccns and living in the bf:identifiedBy
			for (let c of i.children){
				if (c.tagName === 'bf:identifiedBy'){

					// grab the lccn bnode
					if (c.getElementsByTagName("bf:Lccn").length>0){
						let lccnEl = c.getElementsByTagName("bf:Lccn")[0]

						// does it have a status
						if (lccnEl.getElementsByTagName("bf:Status").length==0){
							// no status element, so this is it
							xmlVoidDataLccn = lccnEl.innerText || lccnEl.textContent
							//break
						}else if (lccnEl.getElementsByTagName("bf:Status").length>0){
							// it does have a status, if it is canceled then we dont wnat to use it
							// so check if it is NOT canceld and if so use it
							if (lccnEl.getElementsByTagName("bf:Status")[0].hasAttribute('rdf:about') && lccnEl.getElementsByTagName("bf:Status")[0].attributes['rdf:about'].value == 'http://id.loc.gov/vocabulary/mstatus/cancinv'){
								continue
							}
							// otherwise use this one, it has a status but thats fine
							for (let cc of lccnEl.children){
								if (cc.tagName == 'rdf:value'){
									xmlVoidDataLccn = cc.innerText || cc.textContent
								}
							}

						}
					}
				}

			}

		}

		// this was the old way we pulled out LCCN before above
		// if (rdfBasic.getElementsByTagName("bf:Lccn").length>0){
		// 	xmlVoidDataLccn = rdfBasic.getElementsByTagName("bf:Lccn")[0].innerText || rdfBasic.getElementsByTagName("bf:Lccn")[0].textContent
		// }else{
		// 	console.warn('no bf:Lccn found for db')
		// }


		// create the holder
		let datasetDescriptionEl = document.createElementNS(this.namespace.void,'void:DatasetDescription')

		datasetDescriptionEl.setAttributeNS("http://www.w3.org/2000/xmlns/", `xmlns:void`, this.namespace.void)
		datasetDescriptionEl.setAttributeNS("http://www.w3.org/2000/xmlns/", `xmlns:lclocal`, this.namespace.lclocal)
		let el


		for (let x of xmlVoidDataRtsUsed){
			el = document.createElementNS(this.namespace.lclocal, 'lclocal:rtsused')
			el.innerHTML = escapeHTML(x)
			datasetDescriptionEl.appendChild(el)
		}

		for (let x of xmlVoidDataType){
			el = document.createElementNS(this.namespace.lclocal, 'lclocal:profiletypes')
			el.innerHTML = escapeHTML(x)
			datasetDescriptionEl.appendChild(el)
		}


		el = document.createElementNS(this.namespace.lclocal, 'lclocal:title')
		el.innerHTML = escapeHTML(xmlVoidDataTitle)
		datasetDescriptionEl.appendChild(el)


		el = document.createElementNS(this.namespace.lclocal, 'lclocal:contributor')
		el.innerHTML = escapeHTML(xmlVoidDataContributor)
		datasetDescriptionEl.appendChild(el)

		el = document.createElementNS(this.namespace.lclocal, 'lclocal:lccn')
		el.innerHTML = escapeHTML(xmlVoidDataLccn)
		datasetDescriptionEl.appendChild(el)

		el = document.createElementNS(this.namespace.lclocal, 'lclocal:user')
		el.innerHTML = escapeHTML(profile.user)
		datasetDescriptionEl.appendChild(el)

		el = document.createElementNS(this.namespace.lclocal, 'lclocal:status')
		el.innerHTML = escapeHTML(profile.status)
		datasetDescriptionEl.appendChild(el)

		el = document.createElementNS(this.namespace.lclocal, 'lclocal:eid')
		el.innerHTML = escapeHTML(profile.eId)
		datasetDescriptionEl.appendChild(el)

		el = document.createElementNS(this.namespace.lclocal, 'lclocal:typeid')
		el.innerHTML = escapeHTML(profile.id)
		datasetDescriptionEl.appendChild(el)

		el = document.createElementNS(this.namespace.lclocal, 'lclocal:procinfo')
		el.innerHTML = escapeHTML(orginalProfile.procInfo)
		datasetDescriptionEl.appendChild(el)


		for (let x of xmlVoidExternalID){
			el = document.createElementNS(this.namespace.lclocal, 'lclocal:externalid')
			el.innerHTML = escapeHTML(x)
			datasetDescriptionEl.appendChild(el)
		}

		let strXmlFormatted = (new XMLSerializer()).serializeToString(rdf)

		strXmlFormatted = utilsMisc.prettifyXmlJS(strXmlFormatted, ' ')

		rdfBasic.appendChild(datasetDescriptionEl)

		let strXmlBasic = (new XMLSerializer()).serializeToString(rdfBasic)
		let strXml = (new XMLSerializer()).serializeToString(rdf)
		console.log(strXml)
    /*
        kefo note
        In FF, only strXmlBasic has any real content.  The other two -
        strXml and strXmlFormatted - contain only the root node, rdf:RDF,
        and all the namespaces.
        The below line fixes this in FF for me.
    */
    //strXmlFormatted = uiUtils.prettifyXmlJS(strXmlBasic, ' ')

    if (useConfigStore().postUsingAlmaXmlFormat){

      // console.log("strXmlBasic")
      // console.log(rdfBasic)

      // get the various pieces
      let almaWorksEl =  rdfBasic.getElementsByTagName("bf:Work")
      let almaInstancesEl =  rdfBasic.getElementsByTagName("bf:Instance")
      let almaItemsEl =  rdfBasic.getElementsByTagName("bf:Item") 
	  // There is not currently an API for bf:Item in Alma

      const doc = document.implementation.createDocument("", "", null);
      // make a new root element
      let almaXmlElBib = doc.createElement("bib");
      // <bib>

      let almaXmlElRecordFormat = doc.createElement("record_format");
      almaXmlElRecordFormat.innerHTML = "BIBFRAME"
      almaXmlElBib.appendChild(almaXmlElRecordFormat)
      // make a child element record of bib
      let almaXmlElRecord = doc.createElement("record");
      //rdf tag should be open
      let almaXmlElRdf = doc.createElement("rdf:RDF");
      almaXmlElRdf.setAttribute("xmlns:rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
      almaXmlElRecord.appendChild(almaXmlElRdf)
      almaXmlElBib.appendChild(almaXmlElRecord)

      for (let el of almaWorksEl){ almaXmlElRdf.appendChild(el) }
      for (let el of almaInstancesEl){ almaXmlElRdf.appendChild(el) }
      for (let el of almaItemsEl){ almaXmlElRdf.appendChild(el) }


      let strAlmaXmlElBib = (new XMLSerializer()).serializeToString(almaXmlElBib)

      // overwrite the existing string with with one
      // strXml is the one sent to the server
      strXml = strAlmaXmlElBib

    }


        // build the BF2MARC package

		let bf2MarcXmlElRdf = this.createElByBestNS('http://www.w3.org/1999/02/22-rdf-syntax-ns#RDF')
		// bf2MarcXmlElRdf.setAttribute("xmlns:rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");

		for (let el of rdfBasic.getElementsByTagName("bf:Work")){ bf2MarcXmlElRdf.appendChild(el) }
		for (let el of rdfBasic.getElementsByTagName("bf:Instance")){ bf2MarcXmlElRdf.appendChild(el) }
		for (let el of rdfBasic.getElementsByTagName("bf:Item")){ bf2MarcXmlElRdf.appendChild(el) }
		let strBf2MarcXmlElBib = (new XMLSerializer()).serializeToString(bf2MarcXmlElRdf)

		// console.log(strBf2MarcXmlElBib, strXmlFormatted, strXmlBasic, strXml)

		// console.log("-------componentXmlLookup",componentXmlLookup)
    // console.log(strXmlFormatted)
    // console.log("------")
    // console.log(strXmlBasic)

        // let newXML = this.splitComplexSubjects(strBf2MarcXmlElBib)
        // strBf2MarcXmlElBib = (new XMLSerializer()).serializeToString(newXML)

		return {
			xmlDom: rdf,
			xmlStringFormatted: strXmlFormatted,
			xlmString: strXml,
			bf2Marc: strBf2MarcXmlElBib,
			xlmStringBasic: strXmlBasic,
			voidTitle: xmlVoidDataTitle,
			voidContributor:xmlVoidDataContributor,
			componentXmlLookup:componentXmlLookup
		}
  },

    //This was handled in the `add()` of `SubjectEditor.vue`, but there are some situtations where that don't work as intended
    //  namely, complex subjects that have subdivisions
    // !! This is not being used, incase having the profile in Marva be different from the XML causes issues somewhere
    splitComplexSubjects: function(data){
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "application/xml")

        let subjects = xml.getElementsByTagName("bf:subject")

        for (let subject of subjects){
            // subject = parser.parseFromString(subject.innerHTML, "application/xml")

            let componentList = subject.getElementsByTagName("madsrdf:componentList")

            if (componentList.length > 0){
                const clone = componentList[0].cloneNode(true)

                let labels = []
                let marcKeys = []

                clone.getElementsByTagName("madsrdf:authoritativeLabel").forEach((label) => {
                    labels.push(label.innerHTML)
                })

                clone.getElementsByTagName("bflc:marcKey").forEach((key) => {
                    marcKeys.push(key.innerHTML)
                })

                for (let label in labels){
                    //save the element incase it needs to be re-added
                    const frozenElement = componentList[0].children[0] //clone.children[label]

                    //remove the existing element
                    componentList[0].children[0].remove()

                    if (labels[label].includes("--") && !marcKeys[label].includes("$z") ){

                        let newElements = []
                        let marcKey = marcKeys[label]

                        let tag = marcKey.slice(0, 3)
                        let subfields = marcKey.slice(5)
                        subfields = subfields.match(/\$[axyzv]{1}/g)

                        let terms = labels[label].split("--")
                        //Determine the tag for the new element
                        for (let term in terms){
                            if (term != 0){
                                switch(subfields[terms]){
                                    case("$v"):
                                    tag = "185"
                                    break
                                case("$y"):
                                    tag = "182"
                                    break
                                case("$z"):
                                    tag = "181"
                                    break
                                default:
                                    tag = "180"
                                }
                            }

                            //Get the type for the new element, this will be that parent element
                            let type
                            switch(subfields[term]){
                                case("$x"):
                                    type = "madsrdf:Topic"
                                    break
                                case("$v"):
                                    type = "madsrdf:GenreForm"
                                    break
                                case("$y"):
                                    type = "madsrdf:Temporal"
                                    break
                                case("$z"):
                                    type = "madsrdf:Geographic"
                                    break
                                case("$a"):
                                default:
                                    type = "madsrdf:Topic"
                            }
                            let typeElement = document.createElement(type)

                            //Add the auth label
                            let authLabelElement = document.createElementNS("http://www.loc.gov/mads/rdf/v1#", "madsrdf:authoritativeLabel")
                            authLabelElement.innerHTML = terms[term]

                            //Add the marcKey
                            let marcKeyElement = document.createElementNS("http://id.loc.gov/ontologies/bflc/", "bflc:marcKey")
                            marcKeyElement.innerHTML = tag + "  " + subfields[term] + terms[term]

                            typeElement.appendChild(authLabelElement)
                            typeElement.appendChild(marcKeyElement)

                            componentList[0].appendChild(typeElement)
                        }
                    } else {
                        //it's a term that doesn't need to be split, be we'll re-add it to ensure the pieces are in the correct order

                        componentList[0].appendChild(frozenElement)

                    }
                }
            }

        }

        return xml
    },


	/**
	 * Builds the Hub Stub XML to be sent off to post
	 *
	* @param {object} hubCreatorObj - obj with creator label, uri,marcKey
	* @param {string} title - title string
	* @param {string} langUri - uri to language
	 * @return {string}
	 */
	createHubStubXML: async function(hubCreatorObj,title,langUri){


		console.log(hubCreatorObj,title,langUri)


		// we are creating the xml in two formats, create the root node for both
		let rdf = document.createElementNS(this.namespace.rdf, "RDF");
		let rdfBasic = document.createElementNS(this.namespace.rdf, "RDF");

		// just add all the namespaces into the root element
		for (let ns of Object.keys(this.namespace)){
			rdf.setAttributeNS("http://www.w3.org/2000/xmlns/", `xmlns:${ns}`, this.namespace[ns])
			rdfBasic.setAttributeNS("http://www.w3.org/2000/xmlns/", `xmlns:${ns}`, this.namespace[ns])
		}

		if (!hubCreatorObj) return false
		if (!hubCreatorObj.label || !hubCreatorObj.marcKey ||!hubCreatorObj.uri) return false
		if (!title) return false

		console.log("hubCreatorObj",hubCreatorObj)

		let aap = utilsProfile.returnAap(hubCreatorObj.label,title)
		let aapHash = await md5(aap)
		aapHash = `${aapHash.slice(0, 8)}-${aapHash.slice(8, 12)}-${aapHash.slice(12, 16)}-${aapHash.slice(16, 20)}-${aapHash.slice(20, 32)}`
		let hubUri = `http://id.loc.gov/resources/hubs/${aapHash}`


		// da hub
		let elHub = document.createElementNS(this.namespace.bf ,'bf:Hub')

		// uri
		elHub.setAttributeNS(this.namespace.rdf, 'rdf:about', hubUri)
		let elTitleProperty = document.createElementNS(this.namespace.bf ,'bf:title')
		let elTitleClass = document.createElementNS(this.namespace.bf ,'bf:Title')
		let elMainTitle = document.createElementNS(this.namespace.bf ,'bf:mainTitle')
		elMainTitle.innerHTML = title

		// attach
		elTitleClass.appendChild(elMainTitle)
		elTitleProperty.appendChild(elTitleClass)
		elHub.appendChild(elTitleProperty)



		// the creator
		let elContributionProperty = document.createElementNS(this.namespace.bf ,'bf:contribution')
		let elContributionClass = document.createElementNS(this.namespace.bf ,'bf:Contribution')

		let rdftype = this.createElByBestNS('rdf:type')
		rdftype.setAttributeNS(this.namespace.rdf, 'rdf:resource', 'http://id.loc.gov/ontologies/bibframe/PrimaryContribution')

		elContributionClass.appendChild(rdftype)
		elContributionProperty.appendChild(elContributionClass)

		let elAgentProperty = document.createElementNS(this.namespace.bf ,'bf:agent')
		let elAgentClass = document.createElementNS(this.namespace.bf ,'bf:Agent')
		elAgentProperty.appendChild(elAgentClass)

		// let elAgentType = document.createElementNS(this.namespace.bf ,'bf:agent')
		let AgentRdftype = this.createElByBestNS('rdf:type')
		AgentRdftype.setAttributeNS(this.namespace.rdf, 'rdf:resource', hubCreatorObj.typeFull)

		elAgentClass.appendChild(AgentRdftype)
		let elAgentLabel = document.createElementNS(this.namespace.rdfs ,'rdfs:label')
		elAgentLabel.innerHTML = hubCreatorObj.label
		elAgentClass.appendChild(elAgentLabel)

		let elAgentMarcKey = document.createElementNS(this.namespace.bflc ,'bflc:marcKey')
		elAgentMarcKey.innerHTML = hubCreatorObj.marcKey
		elAgentClass.appendChild(elAgentMarcKey)

		elContributionClass.appendChild(elAgentProperty)

		elHub.appendChild(elContributionProperty)


		rdf.appendChild(elHub)





		// <bf:Hub >
		// 	<bflc:aap >Filosofia e scienza nell'età moderna</bflc:aap>
		// 	<bflc:aap-normalized >filosofiaescienzanell'etàmoderna</bflc:aap-normalized>
		// 	<rdf:type rdf:resource="http://id.loc.gov/ontologies/bibframe/Series" />
		// 	<bf:title >
		// 	<bf:Title >
		// 	<bf:mainTitle >Filosofia e scienza nell'età moderna</bf:mainTitle>
		// 	<bf:partNumber >1</bf:partNumber>
		// 	<bf:partName >Studi</bf:partName>
		// 	</bf:Title>
		// 	</bf:title>
		// 	<bflc:marcKey >440 0$aFilosofia e scienza nell'età moderna.$n1,$pStudi ;$v68</bflc:marcKey>
		// 	</bf:Hub>


{/* <bf:contribution>
<bf:Contribution>
<rdf:type rdf:resource="http://id.loc.gov/ontologies/bibframe/PrimaryContribution"/>
<bf:agent>
<bf:Agent rdf:about="http://id.loc.gov/rwo/agents/n79021164">
<rdf:type rdf:resource="http://id.loc.gov/ontologies/bibframe/Person"/>
<rdfs:label>Twain, Mark, 1835-1910</rdfs:label>
<bflc:marcKey>1001 $aTwain, Mark,$d1835-1910</bflc:marcKey>
</bf:Agent>
</bf:agent>
<bf:role>
<bf:Role rdf:about="http://id.loc.gov/vocabulary/relators/ctb">
<rdfs:label>contributor</rdfs:label>
<bf:code>ctb</bf:code>
</bf:Role>
</bf:role>
</bf:Contribution>
</bf:contribution> */}




		console.log(aap)
		console.log(aapHash)
		console.log(hubUri)
		let xml = (new XMLSerializer()).serializeToString(rdf)

		console.log(xml)
		return xml

	}
}


export default utilsExport;