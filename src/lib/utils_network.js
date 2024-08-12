import {useConfigStore} from "../stores/config";
import short from 'short-uuid'
const translator = short();



const utilsNetwork = {

    // where to look for the string
    possibleLabelURIs: [
        'http://www.loc.gov/mads/rdf/v1#authoritativeLabel',
        'http://www.w3.org/2004/02/skos/core#prefLabel',
        'http://www.w3.org/2000/01/rdf-schema#label'
    ],


    // a cache to keep previosuly requested vocabularies and lookups in memory for use again
    lookupLibrary : {},


    /**
    * processes the data returned from id vocabularies
    *
    * @async
    * @param {array} uris - the id vocabulary to query
    * @return {object} - returns the results processing
    */
    loadSimpleLookup: async function(uris){
        // TODO make this better for multuple lookup list (might not be needed)
        if (!Array.isArray(uris)){
          uris=[uris]
        }
        for (let uri of uris){
          let url = uri

          // TODO more checks here
          if (!uri.includes('.json')){
              url = url + '.json'
          }

          if (!this.lookupLibrary[uri]){
              let data = await this.fetchSimpleLookup(url)
              data = this.simpleLookupProcess(data,uri)
              this.lookupLibrary[uri] = data
              return data
          }else{
              return this.lookupLibrary[uri]
          }

        }
    },


    /**
    * processes the data returned
    *
    * @async
    * @param {array} data - the results from the vocabulary data endpoint
    * @param {boolean} parentURI - the URI to look for in extacting the values
    * @return {object} - returns the results processing
    */

    simpleLookupProcess: function(data,parentURI){

        let dataProcessed = {

            // all the URIs will live here but also the metadata obj about the uris
            metadata : {
                uri: parentURI,
                values: {}
            }

        }

        if (Array.isArray(data)){
            // basic ID simple Lookup response
            // assume anything in this array is a possible value except
            // something that has the parent URI

            data.forEach((d)=>{

                let label = null
                let labelData = null                // it has a URI and that URI is not the parent uri
                // assume it is one of the values we want
                // also skip any blank nodes
                if (d['@id'] && d['@id'] != parentURI && !d['@id'].includes('_:') ){

                    this.possibleLabelURIs.forEach((labelURI)=>{
                        // if it has this label URI and does not yet have a label
                        if (d[labelURI] && !dataProcessed[d['@id']]){

                            label = this.returnValue(d[labelURI])

                            let labelWithCode = []
                            // build the metadata for each item that will go along it with structured fields
                            let metadata = {uri:d['@id'], label: [], code: [], displayLabel: [] }
                            label.forEach((l)=>{
                                labelWithCode.push(`${l} (${d['@id'].split('/').pop()})`)
                                metadata.displayLabel.push(`${l.trim()} (${d['@id'].split('/').pop()})`)

                                metadata.label.push(l.trim())
                                metadata.code.push(d['@id'].split('/').pop())

                            })
                            labelData = metadata
                            label = labelWithCode
                        }
                    })
                }else if (d['http://id.loc.gov/ontologies/RecordInfo#recordStatus']){
                    // this is just a record info blank node, skip it
                    return false
                }else{

                    // this is the parent uri obj in the response, skip it
                    return false
                }

                if (label === null){
                    console.error('lookupUtility: Was expecting this to have a label', d)
                    return false
                }

                dataProcessed[d['@id']] = label
                dataProcessed.metadata.values[d['@id']] = labelData
            })


        }else{

            // TODO more use cases
            dataProcessed = data
        }

        return dataProcessed
    },


    /**
    * Does a suggest2 lookup against ID provided the vocabulary to look into
    *
    * @async
    * @param {string} uris - the uri(s) to the ID vocabulary to search
    * @param {boolean} keyword - the query term
    * @return {object} - returns the result of the suggest search
    */

    loadSimpleLookupKeyword: async function(uris,keyword){

      if (!Array.isArray(uris)){
        uris=[uris]
      }

      let results = {metadata:{ uri:uris[0]+'KEYWORD', values:{}  }}
      console.log("results",results)
      for (let uri of uris){


        // let orignalURI = uri
        // build the url

        if (uri.at(-1) == '/'){
          uri[-1] = ''
        }


        let url = `${uri}/suggest2/?q=${keyword}&count=25`

        let r = await this.fetchSimpleLookup(url)

        if (r.hits && r.hits.length==0){
          url = `${uri}/suggest2/?q=${keyword}&count=25&searchtype=keyword`
          r = await this.fetchSimpleLookup(url)

        }


        if (r.hits && r.hits.length>0){
          for (let hit of r.hits){
            results.metadata.values[hit.uri] = {uri:hit.uri, label: [hit.suggestLabel], authLabel:hit.aLabel, code: [], displayLabel: [hit.suggestLabel] }
            results[hit.uri] = [hit.suggestLabel]
          }

        }

      }

      this.lookupLibrary[uris[0]+'KEYWORD'] = results

      return results
    },


    /**
    * The lower level function used by a lot of other fuctions to make fetch calls to pull in data
    *
    * fetches the profile data from supplied URL or from the config URL if empty
    * @async
    * @param {string} url - the URL to ask for, if left blank it just pulls in the profiles
    * @param {boolean} json - if defined and true will treat the call as a json request, addding some headers to ask for json
    * @return {object|string} - returns the JSON object parsed into JS Object or the text body of the response depending if it is json or not
    */
    fetchSimpleLookup: async function(url, json) {
      url = url || config.profileUrl
      if (url.includes("id.loc.gov")){
        url = url.replace('http://','https://')
      }

      // if we use the memberOf there might be a id URL in the params, make sure its not https
      url = url.replace('memberOf=https://id.loc.gov/','memberOf=http://id.loc.gov/')

      let options = {}
      if (json){
        options = {headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, mode: "cors"}
      }
      // console.log("url:",url)
      // console.log('options:',options)
      try{
        let response = await fetch(url,options);
        let data = null
        if (response.status == 404){
          return false
        }

        if (url.includes('.rdf') || url.includes('.xml')){
          data =  await response.text()
        }else{
          data =  await response.json()
        }
        return  data;
      }catch(err){
        //alert("There was an error retriving the record from:",url)
        console.error(err);
        return false
        // Handle errors here
      }
    },


    // returns the literal value based on the jsonld structure
    returnValue: function(input){
        let value = []
        if (Array.isArray(input)){
            input.forEach((v)=>{
                if (typeof v === 'object'){
                    if (v['@value']){
                        value.push(v['@value'])
                    }else{
                        console.warn('lookupUtility: lookup parse error, Was expecting a @value in this object:',v)
                    }
                }else if (typeof v === 'string' || typeof v === 'number'){
                    value.push(v)
                }else{
                    console.warn('lookupUtility: lookup parse error, Was expecting some sort of value here:',v)
                }
            })
        }
        return value
    },



    /**
    * Payload to pass to searchComplex
    * @typedef {searchPayload} searchPayload
    * @property {string} processor - flag to tell how to process the results, can be "lcAuthorities" or "wikidataAPI"
    * @property {string} searchValue - the search value being searched for
    * @property {array} url - array of urls to use
    */

    /**
    * A single result from searchComplex
    * @typedef {searchComplexResult} searchComplexResult
    * @property {string} label - the authorative label
    * @property {string} suggestLabel - the suggest label
    * @property {string} uri - the URI to the resource
    * @property {boolean} literal - if its a literal response or not, the literal is often added in there as an option
    * @property {boolean} depreciated - if true the term is depreciated according to the service
    * @property {string} extra - any other extra info to make available in the interface
    */


    /**
    * Looks for instances by LCCN against ID, returns into for them to be displayed and load the resource
    * @param {searchPayload} searchPayload - the {@link searchPayload} to look for
    * @return {array} - An array of {@link searchComplexResult} results
    */
    searchComplex: async function(searchPayload){


      // console.log("searchPayload",searchPayload)



        let returnUrls = useConfigStore().returnUrls

        let urlTemplate = searchPayload.url

        console.log("######################################")
        console.log("url ", urlTemplate)

        if (!Array.isArray(urlTemplate)){
            urlTemplate=[urlTemplate]
        }


        // if we're in lc authortities mode then check if we are doing a keyword search
        // searchtype=keyword

        if (searchPayload.processor == 'lcAuthorities'){
          for (let idx in urlTemplate){

            if (urlTemplate[idx].includes('q=?')){
              urlTemplate[idx] = urlTemplate[idx].replace('q=?','q=')+'&searchtype=keyword'
            }
          }

        }


        let results = []
        for (let url of urlTemplate) {

            // kind of hack, change to the public endpoint if we are in dev or public mode
            if (returnUrls.dev || returnUrls.publicEndpoints){
              url = url.replace('http://preprod.id.','https://id.')
              url = url.replace('https://preprod-8230.id.loc.gov','https://id.loc.gov')
              url = url.replace('https://test-8080.id.lctl.gov','https://id.loc.gov')
              url = url.replace('https://preprod-8080.id.loc.gov','https://id.loc.gov')
              url = url.replace('https://preprod-8288.id.loc.gov','https://id.loc.gov')
            }


            url = url + "&blastdacache=" + Date.now()

            // don't allow a ? in the keyword if it is already marked as keyword search
            if (url.includes('searchtype=keyword') && url.includes('q=?')){
              url = url.replace('q=?','q=')
            }


            let r = await this.fetchSimpleLookup(url)

            //Config only allows 25 results, this will add something to the results
            // to let the user know there are more names.
            let overflow = 0
            if (r.hits.length < r.count){
              // It looks like the count is 1 more than the number of hits, why?
              overflow = (r.count - r.hits.length)
            }

            if (searchPayload.processor == 'lcAuthorities'){
                // process the results as a LC suggest service
                // console.log("URL",url)
                // console.log("r",r)
                for (let hit of r.hits){


                  let hitAdd = {
                    label: hit.aLabel,
                    vlabel: hit.vLabel,
                    suggestLabel: hit.suggestLabel,
                    uri: hit.uri,
                    literal:false,
                    depreciated: false,
                    extra: '',
                    total: r.count
                  }

                  if (hitAdd.label=='' && hitAdd.suggestLabel.includes('DEPRECATED')){
                    hitAdd.label  = hitAdd.suggestLabel.split('(DEPRECATED')[0] + ' DEPRECATED'
                    hitAdd.depreciated = true
                  }


                  results.push(hitAdd)


                }


                // Old suggest service below

                // let labels = r[1]
                // let uris = r[3]
                // for (let i = 0; i <= labels.length; i++) {
                //   if (uris[i]!= undefined){
                //       results.push({
                //         label: labels[i],
                //         uri: uris[i],
                //         extra: ''

                //       })
                //   }
                // }

            }else if (searchPayload.processor == 'wikidataAPI'){

                for (let hit of r.search){
                  results.push({
                    label: hit.label,
                    uri: hit.concepturi,
                    literal:false,
                    extra: ''
                  })
                }
            }

        }

        // always add in the literal they searched for at the end
        // if it is not a hub or work

        if (!searchPayload.url[0].includes('/works/') && !searchPayload.url[0].includes('/hubs/')){
          results.push({
            label: searchPayload.searchValue,
            uri: null,
            literal:true,
            extra: ''
          })
        }

        // console.log(results,"<results")
        return results

    },




    /**
    * What is returned from the context request
    * @typedef {contextResult} contextResult
    * @property {boolean} contextValue - xxxxxxxxx
    * @property {array} source - xxxxxxxxx
    * @property {string} type - xxxxxxxxx
    * @property {string} typeFull - xxxxxxxxx
    * @property {string} aap - xxxxxxxxx
    * @property {array} variant - xxxxxxxxx
    * @property {string} uri - xxxxxxxxx
    * @property {string} title - xxxxxxxxx
    * @property {array} contributor - xxxxxxxxx
    * @property {string} date - xxxxxxxxx
    * @property {string} genreForm - xxxxxxxxx
    * @property {object} nodeMap - xxxxxxxxx
    */

    /**
    * Kicks off the main process to return details about a URI, this is used in the
    * complex lookup modal
    * @param {string} uri - The URI to use, probably a id.loc.gov link
    * @return {array} - An array of {@link contextResult} results
    */
    returnContext: async function(uri){

        let d = await this.fetchContextData(uri)
        d.uri = uri

        let results

        if (uri.includes('resources/works/') || uri.includes('resources/hubs/')){
          results = await this.extractContextDataWorksHubs(d)
        }else{
          results =  this.extractContextData(d)
        }

        return results

    },

    /**
    * Talks to the server, a lot of ID logic
    * @param {string} uri  - The URI to use, probably a id.loc.gov link
    * @return {object} - the data response
    */
    fetchContextData: async function(uri){



          let returnUrls = useConfigStore().returnUrls

          if ((uri.startsWith('http://id.loc.gov') || uri.startsWith('https://id.loc.gov')) && uri.match(/(authorities|vocabularies)/)) {
            var jsonuri = uri + '.madsrdf_raw.jsonld';




          }else if (uri.includes('resources/works/') || uri.includes('resources/hubs/')){

            jsonuri = uri + '.bibframe.json';

          }else if (uri.includes('http://www.wikidata.org/entity/')){
            jsonuri = uri.replace('http://www.wikidata.org/entity/','https://www.wikidata.org/wiki/Special:EntityData/')
            jsonuri = jsonuri + '.json';
          } else {
            jsonuri = uri + '.jsonld';
          }



          //if we are in production use preprod
          if (returnUrls.env == 'production' || returnUrls.env == 'staging'){
            jsonuri = jsonuri.replace('http://id.', 'https://preprod-8080.id.')
            jsonuri = jsonuri.replace('https://id.', 'https://preprod-8080.id.')

          }


          // unless we are in a dev or public mode

          if (returnUrls.dev || returnUrls.publicEndpoints){
            jsonuri = jsonuri.replace('http://preprod.id.','https://id.')
            jsonuri = jsonuri.replace('https://preprod-8230.id.loc.gov','https://id.loc.gov')
            jsonuri = jsonuri.replace('https://test-8080.id.lctl.gov','https://id.loc.gov')
            jsonuri = jsonuri.replace('https://preprod-8080.id.loc.gov','https://id.loc.gov')
            jsonuri = jsonuri.replace('https://preprod-8288.id.loc.gov','https://id.loc.gov')
          }



          if (jsonuri.includes('gpo_') && jsonuri.includes('preprod') ){
            jsonuri = jsonuri.replace('8080','8295')
            jsonuri = jsonuri.replace('8230','8295')
            jsonuri = jsonuri.replace('https://id.','https://preprod-8295.id.')
          }


          jsonuri = jsonuri.replace('http://id.loc.gov','https://id.loc.gov')

          try{
            let response = await fetch(jsonuri);
            let data =  await response.json()
            return  data;

          }catch(err){
            console.error(err);

            // Handle errors here
          }


    },


    /**
    * Extract data from the data for hubs
    * @param {object} data - The URI to use, probably a id.loc.gov link
    * @return {array} - An array of {@link contextResult} results
    */
    extractContextDataWorksHubs: async function(data){

      let returnUrls = useConfigStore().returnUrls


      var results = { contextValue: true, source: [], type: null, typeFull: null, aap:null, variant : [], uri: data.uri, title: null, contributor:[], date:null, genreForm: null, nodeMap:{}};

      if (data.uri.includes('/works/')){
        results.type = 'Work'
        results.typeFull='http://id.loc.gov/ontologies/bibframe/Work'
      }else{
        results.type = 'Hub'
        results.typeFull='http://id.loc.gov/ontologies/bibframe/Hub'
      }




      // let nodeLookup = {}

      // for (let key in data){

      // }


      let instances = []


      // grab the title
      for (let val of data){

        if (val['@id']){



          if (val['@id'] == data.uri){
            // this is the main graph

            for (let k in val){
              //find the title
              if (k == 'http://www.w3.org/2000/01/rdf-schema#label'){
                results.title = val[k][0]['@value']
              }

              if (k == 'http://id.loc.gov/ontologies/bflc/aap'){
                results.aap = val[k][0]['@value']
              }



              if (k == 'http://id.loc.gov/ontologies/bibframe/hasInstance'){


                let counter = 1
                for (let i of val['http://id.loc.gov/ontologies/bibframe/hasInstance']){

                  if (counter>4){
                    break
                  }
                  counter++


                  let url = i['@id']

                  if (url.includes('gpo_')  ){

                    url = url.replace('https://id.','https://preprod-8295.id.')
                    url = url.replace('http://id.','http://preprod-8295.id.')

                  }


                  if (url.includes('/instances/') || url.includes('/works/') || url.includes('/hubs/')){
                    if (returnUrls.env === 'production'){
                      url = url.replace('https://id.','https://preprod-8080.id.')
                      url = url.replace('http://id.','http://preprod-8080.id.')
                    }
                  }

                  if (returnUrls.dev || returnUrls.publicEndpoints){
                    url = url.replace('http://preprod.id.','https://id.')
                    url = url.replace('https://preprod-8230.id.loc.gov','https://id.loc.gov')
                    url = url.replace('https://test-8080.id.lctl.gov','https://id.loc.gov')
                    url = url.replace('https://preprod-8080.id.loc.gov','https://id.loc.gov')
                    url = url.replace('http://preprod-8080.id.loc.gov','https://id.loc.gov')
                    url = url.replace('https://preprod-8288.id.loc.gov','https://id.loc.gov')
                  }


                  console.log("URL is",url)

                  let response = await fetch(url.replace('http://','https://')+'.nt');
                  let text  = await response.text()

                  let instanceText = ""
                  for (let line of text.split('\n')){


                    if (line.includes(`<${i["@id"]}> <http://www.w3.org/2000/01/rdf-schema#label>`)){
                      let t = line.split('>')[2]
                      t= t.split('@')[0]
                      t = t.replaceAll('"','')
                      t= t.replace(' .','')
                      instanceText = instanceText + t
                    }
                    if (line.includes(`<${i["@id"]}> <http://id.loc.gov/ontologies/bibframe/provisionActivityStatement>`)){
                      let t = line.split('>')[2]
                      t= t.split('@')[0]
                      t = t.replaceAll('"','')
                      t= t.replace(' .','')
                      instanceText = instanceText + t
                    }



                  }
                  instances.push(instanceText)



                  // https://id.loc.gov/resources/instances/18109312.nt

                }


              }




            }

          }


          // subjects
          if (val['http://www.loc.gov/mads/rdf/v1#isMemberOfMADSScheme']){

            if (!results.nodeMap['Subjects']){
              results.nodeMap['Subjects'] = []
            }

            if (val['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']){
              results.nodeMap['Subjects'].push(val['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'][0]['@value'])
            }


          }



        }

      }


      if (!results.title){
        results.title = results.aap
      }


      if (instances.length>0){
        results.nodeMap['Instances'] = instances
      }



      return results
    },

    /**
    * Extract data from the data not hubs
    * @param {object} data - The URI to use, probably a id.loc.gov link
    * @return {array} - An array of {@link contextResult} results
    */
    extractContextData: function(data){
          var results = { contextValue: true, source: [], type: null, typeFull: null, variant : [], uri: data.uri, title: null, contributor:[], date:null, genreForm: null, nodeMap:{}};


          if (data.uri.includes('wikidata.org')){


            if (data.entities){
              let qid = Object.keys(data.entities)[0]



              if (data.entities[qid].labels.en){
                results.title = data.entities[qid].labels.en.value
              }
              if (data.entities[qid].descriptions.en){
                results.nodeMap['Description'] = [data.entities[qid].descriptions.en.value]
              }

              if (data.entities[qid].aliases.en){

                data.entities[qid].aliases.en.forEach((v)=>{
                  results.variant.push(v.value)
                })

              }
              // just hardcode it for now
              results.type = 'http://www.loc.gov/mads/rdf/v1#PersonalName'
              results.typeFull = 'http://www.loc.gov/mads/rdf/v1#PersonalName'

              // get the P31 instanceOf
              if (data.entities[qid].claims.P31){


                if (data.entities[qid].claims.P31[0].mainsnak){
                  if (data.entities[qid].claims.P31[0].mainsnak.datavalue){
                    if (data.entities[qid].claims.P31[0].mainsnak.datavalue.value){

                      results.type = this.rdfType(data.entities[qid].claims.P31[0].mainsnak.datavalue.value.id)
                    }
                  }
                }
              }







            }


          }else if(data.uri.includes('id.loc.gov/resources/works/') || data.uri.includes('id.loc.gov/resources/instances/')|| data.uri.includes('id.loc.gov/resources/hubs/')){




            let uriIdPart = data.uri.split('/').slice(-1)[0]



            //find the right graph
            for (let g of data){

              if (g && g['@id'] && (g['@id'].endsWith(`/works/${uriIdPart}`) || g['@id'].endsWith(`/instances/${uriIdPart}`) || g['@id'].endsWith(`/hubs/${uriIdPart}`)) ){


                if (
                  (g['@id'].endsWith(`/works/${uriIdPart}`) && data.uri.includes('id.loc.gov/resources/works/')) ||
                  (g['@id'].endsWith(`/instances/${uriIdPart}`) && data.uri.includes('id.loc.gov/resources/instances/')) ||
                  (g['@id'].endsWith(`/hubs/${uriIdPart}`) && data.uri.includes('id.loc.gov/resources/hubs/'))
                  ){



                  if (g['http://www.w3.org/2000/01/rdf-schema#label'] && g['http://www.w3.org/2000/01/rdf-schema#label'][0]){
                    results.title = g['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value']
                  }else if (g['http://id.loc.gov/ontologies/bflc/aap'] && g['http://id.loc.gov/ontologies/bflc/aap'][0]){
                    results.title = g['http://id.loc.gov/ontologies/bflc/aap'][0]['@value']

                  }



                  if (g['@type'] && g['@type'][0]){
                    results.type = this.rdfType(g['@type'][0])
                    results.typeFull = g['@type'][0]
                  }




                }


              }
            }
            // console.log(uriIdPart)









          }else{

            // if it is in jsonld format
            if (data['@graph']){
              data = data['@graph'];
            }


            var nodeMap = {};

            data.forEach(function(n){
              if (n['http://www.loc.gov/mads/rdf/v1#birthDate']){
                nodeMap['Birth Date'] = n['http://www.loc.gov/mads/rdf/v1#birthDate'].map(function(d){ return d['@value']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#birthPlace']){
                nodeMap['Birth Place'] = n['http://www.loc.gov/mads/rdf/v1#birthPlace'].map(function(d){ return d['@id']})
              }

              if (n['http://www.loc.gov/mads/rdf/v1#associatedLocale']){
                nodeMap['Associated Locale'] = n['http://www.loc.gov/mads/rdf/v1#associatedLocale'].map(function(d){ return d['@id']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#fieldOfActivity']){
                nodeMap['Field of Activity'] = n['http://www.loc.gov/mads/rdf/v1#fieldOfActivity'].map(function(d){ return d['@id']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#gender']){
                nodeMap['Gender'] = n['http://www.loc.gov/mads/rdf/v1#gender'].map(function(d){ return d['@id']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#occupation']){
                nodeMap['Occupation'] = n['http://www.loc.gov/mads/rdf/v1#occupation'].map(function(d){ return d['@id']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#associatedLanguage']){
                nodeMap['Associated Language'] = n['http://www.loc.gov/mads/rdf/v1#associatedLanguage'].map(function(d){ return d['@id']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#deathDate']){
                nodeMap['Death Date'] = n['http://www.loc.gov/mads/rdf/v1#deathDate'].map(function(d){ return d['@value']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#hasBroaderAuthority']){
                nodeMap['Has Broader Authority'] = n['http://www.loc.gov/mads/rdf/v1#hasBroaderAuthority'].map(function(d){ return d['@id']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#hasNarrowerAuthority']){
                nodeMap['Has Narrower Authority'] = n['http://www.loc.gov/mads/rdf/v1#hasNarrowerAuthority'].map(function(d){ return d['@id']})
              }
              if (n['http://www.loc.gov/mads/rdf/v1#isMemberOfMADSCollection']){
                nodeMap['MADS Collection'] = n['http://www.loc.gov/mads/rdf/v1#isMemberOfMADSCollection'].map(function(d){ return d['@id']})
              }

              if (n['http://www.loc.gov/mads/rdf/v1#code'] && n['http://www.loc.gov/mads/rdf/v1#code'][0]['@type'] == 'http://id.loc.gov/datatypes/codes/gac') {
                nodeMap['GAC(s)'] = n['http://www.loc.gov/mads/rdf/v1#code'].map(function(d){
                        if (d['@type'] == 'http://id.loc.gov/datatypes/codes/gac') {
                            return d['@value']
                        }
                    })
              }


              if ( n['@type'].includes('http://id.loc.gov/ontologies/lcc#ClassNumber') !== false ){
                if (!nodeMap['LC Classification']){
                  nodeMap['LC Classification'] = []
                }


                if (n['http://www.loc.gov/mads/rdf/v1#code'] && n['http://id.loc.gov/ontologies/bibframe/assigner']){
                  nodeMap['LC Classification'].push(`${n['http://www.loc.gov/mads/rdf/v1#code'][0]['@value']} (${n['http://id.loc.gov/ontologies/bibframe/assigner'][0]['@id'].split('/').pop()})`)
                }else if (n['http://www.loc.gov/mads/rdf/v1#code']){
                  nodeMap['LC Classification'].push(n['http://www.loc.gov/mads/rdf/v1#code'][0]['@value'])
                }

              }



              if (n['http://www.loc.gov/mads/rdf/v1#classification']){
                nodeMap['Classification'] = n['http://www.loc.gov/mads/rdf/v1#classification'].map(function(d){ return d['@value']})
                nodeMap['Classification'] = nodeMap['Classification'].filter((v)=>{(v)})
              }




            })
            // pull out the labels
            data.forEach(function(n){

              // loop through all the possible types of row
              Object.keys(nodeMap).forEach(function(k){
                if (!results.nodeMap[k]) { results.nodeMap[k] = [] }
                // loop through each uri we have for this type
                //console.log(nodeMap[k])
                nodeMap[k].forEach(function(uri){

                  if (k == 'MADS Collection'){
                    if (results.nodeMap[k].indexOf(uri.split('/').slice(-1)[0].replace('collection_',''))==-1){
                      results.nodeMap[k].push(uri.split('/').slice(-1)[0].replace('collection_',''))
                    }
                  }else if (k == 'Classification'){
                    if (nodeMap[k].length>0){
                      results.nodeMap[k]=nodeMap[k]
                    }
                  }else if (k == 'LC Classification'){
                    if (nodeMap[k].length>0){
                      results.nodeMap[k]=nodeMap[k]
                    }

                  } else if (k == 'GAC(s)'){
                    if (nodeMap[k].length>0){
                      results.nodeMap[k]=nodeMap[k]
                    }

                  } else if (n['@id'] && n['@id'] == uri){

                    if (n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']){
                      n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'].forEach(function(val){
                        if (val['@value']){
                          results.nodeMap[k].push(val['@value']);
                        }
                      })
                    }else if (n['http://www.w3.org/2000/01/rdf-schema#label']){
                      n['http://www.w3.org/2000/01/rdf-schema#label'].forEach(function(val){
                        if (val['@value']){
                          results.nodeMap[k].push(val['@value']);
                        }
                      })
                    }else{
                      console.log("NO label found for ",n)

                    }

                  }else if (uri.includes('id.loc.gov')){

                    // just add the uri slug if it is a ID uri, we don't want to look up in real time
                    let slug = uri.split('/').slice(-1)[0]
                    if (results.nodeMap[k].indexOf(slug)==-1){
                      results.nodeMap[k].push(slug)
                    }


                  }


                })
              })




            })


            data.forEach((n)=>{

              var citation = '';
              var variant = '';
              // var seeAlso = '';
              var title = '';

              if (n['http://www.loc.gov/mads/rdf/v1#citation-source']) {
                citation = citation + " Source: " + n['http://www.loc.gov/mads/rdf/v1#citation-source'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citation-note']) {
                citation = citation + " Note: " + n['http://www.loc.gov/mads/rdf/v1#citation-note'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citation-status']) {
                citation = citation + " Status: " + n['http://www.loc.gov/mads/rdf/v1#citation-status'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citationSource']) {
                citation = citation + " Source: " + n['http://www.loc.gov/mads/rdf/v1#citationSource'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citationNote']) {
                citation = citation + " Note: " + n['http://www.loc.gov/mads/rdf/v1#citationNote'].map(function (v) { return v['@value'] + ' '; })
              }
              if (n['http://www.loc.gov/mads/rdf/v1#citationStatus']) {
                citation = citation + " Status: " + n['http://www.loc.gov/mads/rdf/v1#citationStatus'].map(function (v) { return v['@value'] + ' '; })
              }



              if (n['http://www.loc.gov/mads/rdf/v1#variantLabel']) {
                variant = variant + n['http://www.loc.gov/mads/rdf/v1#variantLabel'].map(function (v) { return v['@value'] + ' '; })
              }

              // if (n['http://www.w3.org/2000/01/rdf-schema#seeAlso']) {
              //   seeAlso = seeAlso + n['http://www.w3.org/2000/01/rdf-schema#seeAlso'].map(function (v) { return v['@value'] + ' '; })
              // }




              if (n['@id'] && n['@id'] == data.uri && n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel']){
                title = title + n['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'].map(function (v) { return v['@value'] + ' '; })
              }

              if (n['@id'] && n['@id'] == data.uri && n['@type']){

                  n['@type'].forEach((t)=>{
                      if (results.type===null){
                          results.type = this.rdfType(t)
                          results.typeFull = t
                      }
                  })

                  if (n['@type'].includes("http://www.loc.gov/mads/rdf/v1#DeprecatedAuthority")){
                    results.depreciated = true

                  }

              }


              citation = citation.trim()
              variant = variant.trim()
              title = title.trim()

              if (variant != ''){ results.variant.push(variant)}
              if (citation != ''){ results.source.push(citation)}
              if (title != ''){ results.title = title }

              if (n['@type'] && n['@type'] == 'http://id.loc.gov/ontologies/bibframe/Title'){
                if (n['bibframe:mainTitle']){
                  results.title = n['bibframe:mainTitle']
                }
              }
              if (n['@type'] && (n['@type'] == 'http://id.loc.gov/ontologies/bibframe/Agent' || n['@type'].indexOf('http://id.loc.gov/ontologies/bibframe/Agent') > -1 )){
                if (n['bflc:name00MatchKey']){
                  results.contributor.push(n['bflc:name00MatchKey']);
                }
              }
              if (n['bibframe:creationDate'] && n['bibframe:creationDate']['@value']){
                results.date = n['bibframe:creationDate']['@value'];
              }
              if (n['@type'] && n['@type'] == 'http://id.loc.gov/ontologies/bibframe/GenreForm'){
                if (n['bibframe:mainTitle']){
                  results.genreForm = n['rdf-schema:label'];
                }
              }
            });


          }

          // clean up any empty ones so they don't display
          Object.keys(results.nodeMap).forEach((k)=>{
            if (results.nodeMap[k].length==0){
              delete results.nodeMap[k]
            }
          })



          return results;
        },


    /**
    * Returns a short version based on the RDF type
    * @param {string} type - the URI of the type
    * @return {string} - a MADSRDF type of the string
    */
    rdfType: function(type){
      var rdftype = null;

      if (type == 'http://www.loc.gov/mads/rdf/v1#PersonalName' || type == 'http://id.loc.gov/ontologies/bibframe/Person') {
        rdftype = 'PersonalName';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/Topic' || type == 'http://www.loc.gov/mads/rdf/v1#Topic') {
        rdftype = 'Topic';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Place' || type == 'http://id.loc.gov/ontologies/bibframe/Place' || type == 'http://www.loc.gov/mads/rdf/v1#Geographic') {
        rdftype = 'Geographic';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Temporal'){
        rdftype= 'Temporal';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Organization' || type == 'http://www.loc.gov/mads/rdf/v1#CorporateName' || type == 'http://id.loc.gov/ontologies/bibframe/Organization') {
        rdftype = 'CorporateName';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Family' || type == 'http://id.loc.gov/ontologies/bibframe/Family') {
        rdftype = "FamilyName";
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Meeting' || type == 'http://id.loc.gov/ontologies/bibframe/Meeting') {
        rdftype = 'ConferenceName';
      } else if (type == 'http://www.loc.gov/mads/rdf/v1#Jurisdiction' || type == 'http://id.loc.gov/ontologies/bibframe/Jurisdiction') {
        rdftype = 'Geographic';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/GenreForm' || type == 'http://www.loc.gov/mads/rdf/v1#GenreForm') {
        rdftype = 'GenreForm';
      } else if (type == 'http://id.loc.gov/ontologies/bibframe/Role') {
        rdftype = 'Role';
      }else if (type == 'http://id.loc.gov/ontologies/madsrdf/v1.html#ComplexSubject') {
        rdftype = 'ComplexSubject';
      }else if (type == 'http://www.loc.gov/mads/rdf/v1#NameTitle') {
        rdftype = 'NameTitle';
      }else if (type == 'http://www.loc.gov/mads/rdf/v1#Title') {
        rdftype = 'Title';
      }else if (type == 'http://www.loc.gov/mads/rdf/v1#ComplexSubject') {
        rdftype = 'ComplexSubject';
      }else if (type == 'Q5') {
        rdftype = 'PersonalName';
      }else if (type == 'http://id.loc.gov/ontologies/bibframe/Work') {
        rdftype = 'Work';
      }else if (type == 'http://id.loc.gov/ontologies/bibframe/Instance') {
        rdftype = 'Instance';
      }










      return rdftype;
    },



    fetchBfdbXML: async function(url){

        // bdfb quirk /works/ only serve xml at .rdf
        if (url.includes('/works/')){
          url = url.replace(/\.jsonld/,'.rdf')
        }

        url = url.replace(/\.jsonld/,'.xml')

        if (!url.includes('?')){
          url = url + '?nocache='+Date.now()
        }

        let r
        try{
          r = await this.fetchSimpleLookup(url)
        }catch (error) {
          r = 'ERROR: Error fetching record.'
        }
        return r
    },



    /**
    *
    * @typedef {subjectLinkModeResolveLCSHResult} subjectLinkModeResolveLCSHResult
    * @property {string} lccn - the lccn searched
    */

    /**
    *
    * @async
    * @param {string} lcsh - the LCSH string MARC encoded
    * @return {subjectLinkModeResolveLCSHResult} - A {@link subjectLinkModeResolveLCSHResult} result
    */

    subjectLinkModeResolveLCSH: async function(lcsh){

      let result = {
        resultType: '',
        msg: ''
      }

      let regexResults

      lcsh = lcsh.normalize()

      if (!lcsh){
        result.resultType = 'ERROR'
        result.msg = 'REGEX Error: That value doesn\'t look like a valid MARC encoded LCSH string (undefined)'
      }else if (lcsh && typeof lcsh != 'string'){
        result.resultType = 'ERROR'
        result.msg = 'REGEX Error: That value doesn\'t look like a valid MARC encoded LCSH string (not string)'
      }

      lcsh=lcsh.replace(/\$c/g,'').replace(/\$d/g,'').replace(/‡c/g,'').replace(/‡d/g,'').replace(/\s{2,}/g, ' ')

      // if it doesn't have a $a or ‡a in the start of the string add it
      // often times copying from a system they dont include the $a
      if (lcsh.substring(0,2) != '$a' && lcsh.substring(0,2) != '‡a'){
        lcsh = '$a' + lcsh
      }


      // check to see if there are two geographic headings in a row, if there is then
      // it is likely a indirect geographic so collapse the $zABCD$zXYZ into $zABCD--XYZ
      if (lcsh.match(/[$‡]z.*([$‡]z.*)/) && lcsh.match(/[$‡]z.*([$‡]z.*)/).length === 2){
        let secondDollarZ = lcsh.match(/[$‡]z.*([$‡]z.*)/)[1]
        let collapsedDollarZ
        if (lcsh.match(/[$]z.*([$]z.*)/)){
          collapsedDollarZ = secondDollarZ.replace('$z','--')
        }else{
          collapsedDollarZ = secondDollarZ.replace('‡z','--')
        }

        lcsh = lcsh.replace(secondDollarZ,collapsedDollarZ)

      }


      // first we have to test the encoded string to see if it is valid
      let dollarCount = lcsh.split(/[$‡]/).length-1

      if (dollarCount > 0){
        if (dollarCount == 1){
          regexResults = lcsh.match(/([$‡][avxyz].*)/)
        }else if (dollarCount == 2){
          regexResults = lcsh.match(/([$‡][avxyz].*)([$‡][avxyz].*)/)
        }else if (dollarCount == 3){
          regexResults = lcsh.match(/([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)/)
        }else if (dollarCount == 4){
          regexResults = lcsh.match(/([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)/)
        }else if (dollarCount == 5){
          regexResults = lcsh.match(/([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)/)
        }else if (dollarCount == 6){
          regexResults = lcsh.match(/([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)/)
        }else if (dollarCount == 7){
          regexResults = lcsh.match(/([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)/)
        }else if (dollarCount == 8){
          regexResults = lcsh.match(/([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)([$‡][avxyz].*)/)
        }else{
          result.resultType = 'ERROR'
          result.msg = 'REGEX Error: That value doesn\'t look like a valid MARC encoded LCSH string (too long? invalid format?)'
        }

        try{
          regexResults = regexResults.slice(1,regexResults.length)
          for (let r of regexResults){
            if (r.slice(0,2).toLowerCase() != '$v' &&
                r.slice(0,2).toLowerCase() != '$a' &&
                r.slice(0,2).toLowerCase() != '$x' &&
                r.slice(0,2).toLowerCase() != '$y' &&
                r.slice(0,2).toLowerCase() != '$z' &&
                r.slice(0,2).toLowerCase() != '‡v' &&
                r.slice(0,2).toLowerCase() != '‡a' &&
                r.slice(0,2).toLowerCase() != '‡x' &&
                r.slice(0,2).toLowerCase() != '‡y' &&
                r.slice(0,2).toLowerCase() != '‡z'){
              // console.log(r.slice(0,2).toLowerCase())
              result.resultType = 'ERROR'
              result.msg = 'REGEX Error: That value doesn\'t look like a valid MARC encoded LCSH string (error spliting into seperate values)'
            }
          }
        }catch{
          result.resultType = 'ERROR'
          result.msg = 'REGEX Error: That value doesn\'t look like a valid MARC encoded LCSH string (error spliting into seperate values)'
        }


      }else{
        result.resultType = 'ERROR'
        result.msg = 'REGEX Error: That value doesn\'t look like a valid MARC encoded LCSH string'
      }

      if (result.resultType == 'ERROR'){ return result}

      // it looks like its probably well formated marc lcsh heading
      let headings = regexResults.slice(0,regexResults.length).map((r)=>{
        return {
          type: r.slice(1,2),
          label: r.slice(2,r.length).trim().replace(/\.[$‡]/gu, '').replace(/\.$/,'') // remove any trailing periods
        }
      })


      // mark which ones are subdivisions
      for (const [i, r] of headings.entries()) {
        if (i > 0){
          r.subdivision = true
          r.primary = false
        }else{
          r.subdivision = false
          r.primary = true
        }

        // and their type if it is easily known, set it to default topic
        if (r.type == 'a'){
          r.rdfType = 'http://www.loc.gov/mads/rdf/v1#Topic'
        } else if (r.type == 'v'){
          r.rdfType = 'http://www.loc.gov/mads/rdf/v1#GenreForm'
        } else if (r.type == 'x'){
          r.rdfType = 'http://www.loc.gov/mads/rdf/v1#Topic'
        } else if (r.type == 'z'){
          r.rdfType = 'http://www.loc.gov/mads/rdf/v1#Geographic'
        } else if (r.type == 'y'){
          r.rdfType = 'http://www.loc.gov/mads/rdf/v1#Temporal'
        } else{
          r.rdfType = 'http://www.loc.gov/mads/rdf/v1#Topic'
        }


      }

      // the complex heading is just xyz--abc--mnl used to see if the full heading is already authorized
      let complexHeading = headings.map((r)=>{ return r.label }).join('--')
      let subjectUrlComplex = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',complexHeading).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&rdftype=ComplexType'
      let searchPayloadSubjectsComplex = {
        processor: 'lcAuthorities',
        url: [subjectUrlComplex],
        searchValue: complexHeading
      }

      for (let heading of headings){

        let foundHeading = false
        // console.log("---------------------\n",heading,"\n------------------------\n")

        // if after the first loop looking at the piramry if it hits a full authorized complex stop looping
        if (result && result.resultType && result.resultType=='COMPLEX'){
          break
        }

        let searchVal = heading.label


        // we'll define all this for each one but not nessisarly use all of them

        let namesUrl = useConfigStore().lookupConfig['http://preprod.id.loc.gov/authorities/names'].modes[0]['NAF All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")
        let namesUrlSubdivision = useConfigStore().lookupConfig['http://preprod.id.loc.gov/authorities/names'].modes[0]['NAF All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&memberOf=http://id.loc.gov/authorities/subjects/collection_Subdivisions'

        let subjectUrlSimple = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&rdftype=SimpleType'
        let subjectUrlSimpleSubdivison = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&rdftype=SimpleType&memberOf=http://id.loc.gov/authorities/subjects/collection_Subdivisions'
        let subjectUrlTemporal = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&memberOf=http://id.loc.gov/authorities/subjects/collection_TemporalSubdivisions'
        let subjectUrlGenre = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&rdftype=GenreForm'

        let worksUrlAnchored = useConfigStore().lookupConfig['https://preprod-8080.id.loc.gov/resources/works'].modes[0]['Works - Left Anchored'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")
        let hubsUrlAnchored = useConfigStore().lookupConfig['https://preprod-8080.id.loc.gov/resources/works'].modes[0]['Hubs - Left Anchored'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")

        let subjectUrlHierarchicalGeographic = useConfigStore().lookupConfig['HierarchicalGeographic'].modes[0]['All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")
        let subjectUrlHierarchicalGeographicLCSH = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+ '&rdftype=HierarchicalGeographic'

        let subjectUrlGeographicLCSH = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&rdftype=Geographic&memberOf=http://id.loc.gov/authorities/subjects/collection_Subdivisions'
        let subjectUrlGeographicLCNAF = useConfigStore().lookupConfig['http://preprod.id.loc.gov/authorities/names'].modes[0]['NAF All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&rdftype=Geographic&memberOf=http://id.loc.gov/authorities/subjects/collection_Subdivisions'

        // console.log('subjectUrlSimpleSubdivison',subjectUrlSimpleSubdivison)
        let searchPayloadNames = {
          processor: 'lcAuthorities',
          url: [namesUrl],
          searchValue: searchVal
        }
        let searchPayloadNamesSubdivision = {
          processor: 'lcAuthorities',
          url: [namesUrlSubdivision],
          searchValue: searchVal
        }

        let searchPayloadSubjectsSimple = {
          processor: 'lcAuthorities',
          url: [subjectUrlSimple],
          searchValue: searchVal
        }
        let searchPayloadSubjectsSimpleSubdivision = {
          processor: 'lcAuthorities',
          url: [subjectUrlSimpleSubdivison],
          searchValue: searchVal
        }
        let searchPayloadTemporal = {
          processor: 'lcAuthorities',
          url: [subjectUrlTemporal],
          searchValue: searchVal
        }

        let searchPayloadGenre = {
          processor: 'lcAuthorities',
          url: [subjectUrlGenre],
          searchValue: searchVal
        }




        let searchPayloadHierarchicalGeographic = {
          processor: 'lcAuthorities',
          url: [subjectUrlHierarchicalGeographic],
          searchValue: searchVal
        }
        let searchPayloadHierarchicalGeographicLCSH = {
          processor: 'lcAuthorities',
          url: [subjectUrlHierarchicalGeographicLCSH],
          searchValue: searchVal
        }


        let searchPayloadGeographicLCSH = {
          processor: 'lcAuthorities',
          url: [subjectUrlGeographicLCSH],
          searchValue: searchVal
        }
        let searchPayloadGeographicLCNAF = {
          processor: 'lcAuthorities',
          url: [subjectUrlGeographicLCNAF],
          searchValue: searchVal
        }

        let searchPayloadWorksAnchored = {
          processor: 'lcAuthorities',
          url: [worksUrlAnchored],
          searchValue: searchVal
        }
        let searchPayloadHubsAnchored = {
          processor: 'lcAuthorities',
          url: [hubsUrlAnchored],
          searchValue: searchVal
        }

        let resultsNames =[]
        let resultsNamesSubdivision =[]


        let resultsSubjectsSimple=[]
        let resultsSubjectsComplex=[]
        let resultsHierarchicalGeographic=[]
        let resultsHierarchicalGeographicLCSH=[]
        let resultsWorksAnchored=[]
        let resultsHubsAnchored=[]
        let resultsPayloadSubjectsSimpleSubdivision=[]
        let resultsPayloadSubjectsTemporal=[]

        let resultsGeographicLCNAF =[]
        let resultsGeographicLCSH =[]


        let resultsGenre=[]


        // if it is a primary heading then we need to search LCNAF, HUBS, WORKS, and simple subjects, and do the whole thing with complex subjects
        if (heading.primary){
          // resultsNames = await this.searchComplex(searchPayloadNames)
          [resultsNames, resultsNamesSubdivision, resultsSubjectsSimple, resultsPayloadSubjectsSimpleSubdivision, resultsSubjectsComplex, resultsHierarchicalGeographic,resultsHierarchicalGeographicLCSH, resultsWorksAnchored, resultsHubsAnchored] = await Promise.all([
              this.searchComplex(searchPayloadNames),
              this.searchComplex(searchPayloadNamesSubdivision),
              this.searchComplex(searchPayloadSubjectsSimple),
              this.searchComplex(searchPayloadSubjectsSimpleSubdivision),
              this.searchComplex(searchPayloadSubjectsComplex),
              this.searchComplex(searchPayloadHierarchicalGeographic),
              this.searchComplex(searchPayloadHierarchicalGeographicLCSH),
              this.searchComplex(searchPayloadWorksAnchored),
              this.searchComplex(searchPayloadHubsAnchored)
          ]);

          // console.log("searchPayloadSubjectsSimpleSubdivision",searchPayloadSubjectsSimpleSubdivision)
          // console.log("resultsPayloadSubjectsSimpleSubdivision",resultsPayloadSubjectsSimpleSubdivision)


          // take out the literal values that are automatically added
          resultsNames = resultsNames.filter((r)=>{ return (!r.literal) })
          resultsNamesSubdivision = resultsNamesSubdivision.filter((r)=>{ return (!r.literal) })
          resultsSubjectsSimple = resultsSubjectsSimple.filter((r)=>{ return (!r.literal) })
          resultsSubjectsComplex = resultsSubjectsComplex.filter((r)=>{ return (!r.literal) })
          resultsHierarchicalGeographic = resultsHierarchicalGeographic.filter((r)=>{ return (!r.literal) })
          resultsHierarchicalGeographicLCSH = resultsHierarchicalGeographicLCSH.filter((r)=>{ return (!r.literal) })
          resultsWorksAnchored = resultsWorksAnchored.filter((r)=>{ return (!r.literal) })
          resultsHubsAnchored = resultsHubsAnchored.filter((r)=>{ return (!r.literal) })
          resultsPayloadSubjectsSimpleSubdivision = resultsPayloadSubjectsSimpleSubdivision.filter((r)=>{ return (!r.literal) })

          // console.log("Yeeth")
          // console.log("resultsNames",resultsNames)
          // console.log("resultsSubjectsSimple",resultsSubjectsSimple)
          // console.log("resultsPayloadSubjectsSimpleSubdivision",resultsPayloadSubjectsSimpleSubdivision)
          // console.log("resultsSubjectsComplex",resultsSubjectsComplex)
          // console.log("resultsHierarchicalGeographic",resultsHierarchicalGeographic)
          // console.log("resultsWorksAnchored",resultsWorksAnchored)
          // console.log("resultsHubsAnchored",resultsHubsAnchored)

          // first see if we matched the whole thing
          // console.log("resultsSubjectsComplex",resultsSubjectsComplex)
          // console.log("heading",heading)
          if (resultsSubjectsComplex.length>0){
            for (let r of resultsSubjectsComplex){
              // console.log("r ",r)
              if (complexHeading.toLowerCase().trim().toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '')){
                result.resultType = 'COMPLEX'
                r.heading = heading
                result.hit = r
                // console.log("r",r)
                foundHeading=true
                break
              }
            }
            if (foundHeading){ break }
          }


          // // if not see if we matched a LCNAF for the first part
          // if (resultsNames.length>0){
          //   for (let r of resultsNames){
          //     if (heading.label.toLowerCase().trim() == r.label.toLowerCase().trim()){
          //       result.resultType = 'PRECOORD-LCNAF'
          //       result.hit = r
          //     }
          //   }
          //   if (result.resultType=='COMPLEX'){ break }
          // }


          // remove any sub divisions from the main one
          let subdivisionUris = resultsPayloadSubjectsSimpleSubdivision.map(  (r) => { return r.uri } )
          resultsSubjectsSimple = resultsSubjectsSimple.filter((r) => { return subdivisionUris.indexOf(r.uri) } )

          // do the same for names
          subdivisionUris = resultsNamesSubdivision.map(  (r) => { return r.uri } )
          resultsNames = resultsNames.filter((r) => { return subdivisionUris.indexOf(r.uri) } )

          // console.log("resultsSubjectsSimple",resultsSubjectsSimple)

          // if not see if we matched a simple subject that is not a subdivison
          if (resultsSubjectsSimple.length>0){
            for (let r of resultsSubjectsSimple){
              // lower case, remove end space, make double whitespace into one and remove any punctuation
              if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '') || heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.vlabel.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                result.resultType = 'PRECOORD-LCSH'
                if (!result.hit){ result.hit = [] }
                r.heading = heading
                result.hit.push(r)
                foundHeading = true
                break
              }
            }
            if (foundHeading){ continue }
          }

          // see if we matched a LCNAF name as primary compontant
          if (resultsNames.length>0){
            for (let r of resultsNames){
              // lower case, remove end space, make double whitespace into one and remove any punctuation
              if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                result.resultType = 'PRECOORD-NAF'
                if (!result.hit){ result.hit = [] }
                r.heading = heading
                result.hit.push(r)
                foundHeading = true
                break
              }
            }
            if (foundHeading){ continue }
          }

          // see if we matched a Work name as primary compontant
          if (resultsWorksAnchored.length>0){
            for (let r of resultsWorksAnchored){
              // lower case, remove end space, make double whitespace into one and remove any punctuation
              if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                result.resultType = 'PRECOORD-WORK'
                if (!result.hit){ result.hit = [] }
                r.heading = heading
                result.hit.push(r)
                foundHeading = true
                break
              }
            }
            if (foundHeading){ continue }
          }

          // see if we matched a Hub name as primary compontant
          if (resultsHubsAnchored.length>0){
            for (let r of resultsHubsAnchored){
              // lower case, remove end space, make double whitespace into one and remove any punctuation
              if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                result.resultType = 'PRECOORD-HUB'
                if (!result.hit){ result.hit = [] }
                r.heading = heading
                result.hit.push(r)
                foundHeading = true
                break
              }
            }
            if (foundHeading){ continue }
          }


          if (!foundHeading){
            if (!result.hit){ result.hit = [] }
            // wasn't found, we need to make it a literal
            result.hit.push(        {
              label: heading.label,
              suggestLabel: heading.label,
              uri: null,
              literal: true,
              depreciated: false,
              extra: '',
              heading: heading
            })
          }


        }else{ // is not primary


          // since it is not the primary it is going to be a subdivision
          // and we have some options that cannot happen like names/works/hubs
          // next we narrow it down furtrher to the type of subdivision
          //
          //

          if (heading.type === 'z'){ // geographic

            // we need to search both direct and indirect headings
            [resultsHierarchicalGeographic,resultsHierarchicalGeographicLCSH, resultsGeographicLCNAF, resultsGeographicLCSH] = await Promise.all([
                this.searchComplex(searchPayloadHierarchicalGeographic),
                this.searchComplex(searchPayloadHierarchicalGeographicLCSH),
                this.searchComplex(searchPayloadGeographicLCNAF),
                this.searchComplex(searchPayloadGeographicLCSH)

            ]);

            resultsHierarchicalGeographic = resultsHierarchicalGeographic.filter((r)=>{ return (!r.literal) })
            resultsHierarchicalGeographicLCSH = resultsHierarchicalGeographicLCSH.filter((r)=>{ return (!r.literal) })
            resultsGeographicLCNAF = resultsGeographicLCNAF.filter((r)=>{ return (!r.literal) })
            resultsGeographicLCSH = resultsGeographicLCSH.filter((r)=>{ return (!r.literal) })

            if (resultsHierarchicalGeographic.length>0){
              for (let r of resultsHierarchicalGeographic){
                // lower case, remove end space, make double whitespace into one and remove any punctuation
                if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                  r.heading = heading
                  result.hit.push(r)

                  foundHeading = true
                }
              }
              if (foundHeading){ continue }
            }
            if (resultsHierarchicalGeographicLCSH.length>0){
              for (let r of resultsHierarchicalGeographicLCSH){
                // lower case, remove end space, make double whitespace into one and remove any punctuation
                if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                  r.heading = heading
                  result.hit.push(r)

                  foundHeading = true
                }
              }
              if (foundHeading){ continue }
            }


            if (resultsGeographicLCNAF.length>0){

              for (let r of resultsGeographicLCNAF){
                // lower case, remove end space, make double whitespace into one and remove any punctuation
                if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                  r.heading = heading
                  result.hit.push(r)


                  foundHeading = true
                }
              }
              if (foundHeading){ continue }
            }
            if (resultsGeographicLCSH.length>0){
              for (let r of resultsGeographicLCSH){
                // lower case, remove end space, make double whitespace into one and remove any punctuation
                if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                  r.heading = heading
                  result.hit.push(r)


                  foundHeading = true
                }
              }
              if (foundHeading){ continue }
            }

            if (!foundHeading){
              // wasn't found, we need to make it a literal
              result.hit.push(        {
                label: heading.label,
                suggestLabel: heading.label,
                uri: null,
                literal: true,
                depreciated: false,
                extra: '',
                heading: heading
              })
            }


          } else if (heading.type === 'x' || heading.type === 'a'){ // general topical subdivision

            [resultsPayloadSubjectsSimpleSubdivision] = await Promise.all([
                this.searchComplex(searchPayloadSubjectsSimpleSubdivision)
            ]);

            // take out the literal values that are automatically added
            resultsPayloadSubjectsSimpleSubdivision = resultsPayloadSubjectsSimpleSubdivision.filter((r)=>{ return (!r.literal) })
            if (resultsPayloadSubjectsSimpleSubdivision.length>0){
              for (let r of resultsPayloadSubjectsSimpleSubdivision){
                // lower case, remove end space, make double whitespace into one and remove any punctuation
                if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                  r.heading = heading
                  result.hit.push(r)


                  foundHeading = true
                }
              }
              if (foundHeading){ continue }
            }

            if (!foundHeading){
              // wasn't found, we need to make it a literal
              result.hit.push(        {
                label: heading.label,
                suggestLabel: heading.label,
                uri: null,
                literal: true,
                depreciated: false,
                extra: '',
                heading: heading
              })
            }



          } else if (heading.type === 'y'){ // Temporal

            [resultsPayloadSubjectsTemporal] = await Promise.all([
                this.searchComplex(searchPayloadTemporal)
            ]);

            // take out the literal values that are automatically added
            resultsPayloadSubjectsTemporal = resultsPayloadSubjectsTemporal.filter((r)=>{ return (!r.literal) })
            if (resultsPayloadSubjectsTemporal.length>0){
              for (let r of resultsPayloadSubjectsTemporal){
                // lower case, remove end space, make double whitespace into one and remove any punctuation
                if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                  r.heading = heading
                  result.hit.push(r)


                  foundHeading = true
                }
              }
              if (foundHeading){ continue }
            }


            if (!foundHeading){
              // wasn't found, we need to make it a literal
              result.hit.push(        {
                label: heading.label,
                suggestLabel: heading.label,
                uri: null,
                literal: true,
                depreciated: false,
                extra: '',
                heading: heading
              })
            }


          } else if (heading.type === 'v'){ // Genre

            [resultsGenre] = await Promise.all([
                this.searchComplex(searchPayloadGenre)
            ]);

            // take out the literal values that are automatically added
            resultsGenre = resultsGenre.filter((r)=>{ return (!r.literal) })
            if (resultsGenre.length>0){
              for (let r of resultsGenre){
                // lower case, remove end space, make double whitespace into one and remove any punctuation
                if (heading.label.toLowerCase().trim().replace(/\s+/g,' ').replace(/[\p{P}$+<=>^`|~]/gu, '') == r.label.toLowerCase().trim().replace(/[\p{P}$+<=>^`|~]/gu, '')){
                  r.heading = heading
                  result.hit.push(r)


                  foundHeading = true
                }
              }
              if (foundHeading){ continue }
            }


            if (!foundHeading){
              // wasn't found, we need to make it a literal
              result.hit.push(        {
                label: heading.label,
                suggestLabel: heading.label,
                uri: null,
                literal: true,
                depreciated: false,
                extra: '',
                heading: heading
              })
            }


          }
        }
      }


      // we want to double check the rdfType heading to make sure if we need to ask id to get more clarity about the rdfType
      if (Array.isArray(result.hit)){
        // it wont be an array if its a complex heading
        for (let r of result.hit){
          if (!r.literal && r.uri.indexOf('id.loc.gov/authorities/names/')){
            let responseUri = await this.returnRDFType(r.uri)
            if (responseUri){
              r.heading.rdfType = responseUri
            }
          }
        }
      }
      // console.log("result",result)
      return result
    },

    /**
    * Send the URI it returns the URI to the MADS RDF type, mostly used for authoirties/names uris from id.loc.gov
    * @async
    * @param {string} uri - the URI to the authority we want to find the RDF type for
    * @return {string} - The URI of the likely MADSRDF rdf type
    */
    returnRDFType: async function(uri){

      uri=uri.trim()
      let uriToLookFor = uri

      // just clean up the URI a little we are probably asking for a id.loc.gov authority url
      if (uri.indexOf('id.loc.gov')>-1){

        // most uris in the id.loc.gov dataset do not have https in the data uris
        uriToLookFor = uriToLookFor.replace('https://','http://')

        // any trailing slashers
        if (uri[uri.length-1] === '/'){
          uri = uri.slice(0,-2)
        }

        uri=uri.replace('.html','.json')

        // add in the filetype for the request if not yet
        if (uri.indexOf('.json')===-1){
          uri=uri+'.json'
        }
      }

      let data = await this.fetchSimpleLookup(uri,true)

      if (uri.indexOf('id.loc.gov')>-1){

        for (let d of data){

          // loop through the graphs
          if (d && d['@id'] && d['@id'] == uriToLookFor){
            // this is the right graph
            if (d['@type']){
              for (let type of d['@type']){

                // for now we are looking for spefic mads types
                if (type == 'http://www.loc.gov/mads/rdf/v1#Temporal'){ return 'http://www.loc.gov/mads/rdf/v1#Temporal'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#ComplexSubject'){ return 'http://www.loc.gov/mads/rdf/v1#ComplexSubject'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#ConferenceName'){ return 'http://www.loc.gov/mads/rdf/v1#ConferenceName'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#CorporateName'){ return 'http://www.loc.gov/mads/rdf/v1#CorporateName'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#FamilyName'){ return 'http://www.loc.gov/mads/rdf/v1#FamilyName'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#Geographic'){ return 'http://www.loc.gov/mads/rdf/v1#Geographic'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#GenreForm'){ return 'http://www.loc.gov/mads/rdf/v1#GenreForm'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#Language'){ return 'http://www.loc.gov/mads/rdf/v1#Language'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#MainTitleElement'){ return 'http://www.loc.gov/mads/rdf/v1#MainTitleElement'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#Meeting'){ return 'http://www.loc.gov/mads/rdf/v1#Meeting'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#NameTitle'){ return 'http://www.loc.gov/mads/rdf/v1#NameTitle'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#PersonalName'){ return 'http://www.loc.gov/mads/rdf/v1#PersonalName'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#Temporal'){ return 'http://www.loc.gov/mads/rdf/v1#Temporal'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#Title'){ return 'http://www.loc.gov/mads/rdf/v1#Title'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#Topic'){ return 'http://www.loc.gov/mads/rdf/v1#Topic'}
                else if(type == 'http://www.loc.gov/mads/rdf/v1#SimpleType'){ return 'http://www.loc.gov/mads/rdf/v1#SimpleType'}
              }
            }
          }
        }
      }

      return false

    },


    /**
    *
    * @async
    * @param {string} searchVal - the value to search lcsh for
    * @param {string} complexVal - The orginal full string
    * @param {string} mode - the search mode LCSHNAF GEO WORKS HUBS
    * @return {} -
    */
    subjectSearch: async function(searchVal,complexVal,mode){

      console.log(useConfigStore().lookupConfig)

      let namesUrl = useConfigStore().lookupConfig['http://preprod.id.loc.gov/authorities/names'].modes[0]['NAF All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=4').replace("<OFFSET>", "1")
      let subjectUrlComplex = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',complexVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")+'&rdftype=ComplexType'
      let subjectUrlSimple = useConfigStore().lookupConfig['http://id.loc.gov/authorities/subjects'].modes[0]['LCSH All'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=4').replace("<OFFSET>", "1")+'&rdftype=SimpleType'

      let worksUrlKeyword = useConfigStore().lookupConfig['https://preprod-8080.id.loc.gov/resources/works'].modes[0]['Works - Keyword'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")
      let worksUrlAnchored = useConfigStore().lookupConfig['https://preprod-8080.id.loc.gov/resources/works'].modes[0]['Works - Left Anchored'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")


      let hubsUrlKeyword = useConfigStore().lookupConfig['https://preprod-8080.id.loc.gov/resources/works'].modes[0]['Hubs - Keyword'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")
      let hubsUrlAnchored = useConfigStore().lookupConfig['https://preprod-8080.id.loc.gov/resources/works'].modes[0]['Hubs - Left Anchored'].url.replace('<QUERY>',searchVal).replace('&count=25','&count=5').replace("<OFFSET>", "1")



      let searchValHierarchicalGeographic = searchVal.replaceAll('‑','-') //.split(' ').join('--')


      let subjectUrlHierarchicalGeographic = useConfigStore().lookupConfig['HierarchicalGeographic'].modes[0]['All'].url.replace('<QUERY>',searchValHierarchicalGeographic).replace('&count=25','&count=4').replace("<OFFSET>", "1")


      if (mode == 'GEO'){
        subjectUrlHierarchicalGeographic = subjectUrlHierarchicalGeographic.replace('&count=4','&count=12').replace("<OFFSET>", "1")
      }




      let searchPayloadNames = {
        processor: 'lcAuthorities',
        url: [namesUrl],
        searchValue: searchVal
      }

      let searchPayloadSubjectsSimple = {
        processor: 'lcAuthorities',
        url: [subjectUrlSimple],
        searchValue: searchVal
      }
      let searchPayloadSubjectsComplex = {
        processor: 'lcAuthorities',
        url: [subjectUrlComplex],
        searchValue: searchVal
      }


      let searchPayloadHierarchicalGeographic = {
        processor: 'lcAuthorities',
        url: [subjectUrlHierarchicalGeographic],
        searchValue: searchValHierarchicalGeographic
      }


      let searchPayloadWorksAnchored = {
        processor: 'lcAuthorities',
        url: [worksUrlAnchored],
        searchValue: searchVal
      }

      let searchPayloadWorksKeyword = {
        processor: 'lcAuthorities',
        url: [worksUrlKeyword],
        searchValue: searchVal
      }

      let searchPayloadHubsAnchored = {
        processor: 'lcAuthorities',
        url: [hubsUrlAnchored],
        searchValue: searchVal
      }

      let searchPayloadHubsKeyword = {
        processor: 'lcAuthorities',
        url: [hubsUrlKeyword],
        searchValue: searchVal
      }



      let resultsNames =[]
      let resultsSubjectsSimple=[]
      let resultsSubjectsComplex=[]
      let resultsHierarchicalGeographic=[]
      let resultsWorksAnchored=[]
      let resultsWorksKeyword=[]
      let resultsHubsAnchored=[]
      let resultsHubsKeyword=[]

      if (mode == "LCSHNAF"){
        [resultsNames, resultsSubjectsSimple, resultsSubjectsComplex, resultsHierarchicalGeographic] = await Promise.all([
            this.searchComplex(searchPayloadNames),
            this.searchComplex(searchPayloadSubjectsSimple),
            this.searchComplex(searchPayloadSubjectsComplex),
            this.searchComplex(searchPayloadHierarchicalGeographic)
        ]);

      }else if (mode == "GEO"){

        [resultsHierarchicalGeographic] = await Promise.all([
            this.searchComplex(searchPayloadHierarchicalGeographic)
        ]);

      }else if (mode == "WORKS"){

        [resultsWorksAnchored,resultsWorksKeyword ] = await Promise.all([
            this.searchComplex(searchPayloadWorksAnchored),
            this.searchComplex(searchPayloadWorksKeyword)
        ]);

      }else if (mode == "HUBS"){

        [resultsHubsAnchored,resultsHubsKeyword ] = await Promise.all([
            this.searchComplex(searchPayloadHubsAnchored),
            this.searchComplex(searchPayloadHubsKeyword)
        ]);

      }




      // drop the litearl value from names and complex
      if (resultsNames.length>0){
        resultsNames.pop()
      }
      if (resultsSubjectsComplex.length>0){
        resultsSubjectsComplex.pop()
      }


      if (resultsSubjectsSimple.length>0){
        resultsSubjectsSimple.push(resultsSubjectsSimple.pop())
        resultsSubjectsSimple.reverse()
      }


      resultsSubjectsComplex.reverse()


      // don't do literals

      let newresultsHierarchicalGeographic = []
      for (let x of resultsHierarchicalGeographic){
        if (!x.literal){
          newresultsHierarchicalGeographic.push(x)
        }
      }
      resultsHierarchicalGeographic = newresultsHierarchicalGeographic
      // resultsHierarchicalGeographic = [{
      //     "label": "Ohio--Cleveland",
      //     "suggestLabel": "Ohio--Cleveland",
      //     "uri": "http://id.loc.gov/authorities/names/n79086863",
      //     "literal": false,
      //     "extra": "",
      //     "labelOrginal": "Ohio--Cleveland",
      //     "picked": false
      // }]


      if (mode == "WORKS"){
        // over write the subjects if we are doing a work search
        resultsSubjectsSimple = resultsWorksAnchored
        resultsSubjectsComplex = resultsWorksKeyword
      }
      if (mode == "HUBS"){
        // over write the subjects if we are doing a work search
        resultsSubjectsSimple = resultsHubsAnchored
        resultsSubjectsComplex = resultsHubsKeyword
      }
      let results = {
        'subjectsSimple': resultsSubjectsSimple,
        'subjectsComplex': resultsSubjectsComplex,
        'names':resultsNames,
        'hierarchicalGeographic': resultsHierarchicalGeographic
      }


      return results

    },

    /**
    * Send the UNPOSTED record to the back end
    * @async
    * @param {string} xml - the XML from the export process
    * @param {string} eId - the editor id
    * @return {void} -
    */

    saveRecord: async function(xml, eId){
      const putMethod = {
        method: 'PUT', // Method itself
        headers: {
          'Content-type': 'application/xml', // Indicates the content
        },
        body: xml // We send data in JSON format
      }
      // console.log(putMethod)
      let url = useConfigStore().returnUrls.ldpjs +'ldp/' + eId

      await fetch(url, putMethod)
      .then(response => response.text())
      .then((responseText)=>{
        // console.log(responseText)
      })
      // .then(data => console.log(data)) // Manipulate the data retrieved back, if we want to do something with it
      .catch((err) => {
       console.log(err, " => ", url)
       alert("Error: Could not save the record!", err)
      }) // Do something with the error
     },

    /**
    * Retrive the UNPOSTED record from the back end
    * @async
    * @param {string} xml - the XML from the export process
    * @param {string} eId - the editor id
    * @return {void} -
    */
    loadSavedRecord: async function(id) {

       let url = useConfigStore().returnUrls.ldpjs +'ldp/' + id

       // let options = {}
       // if (json){
       //   options = {headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, mode: "cors"}
       // }
       // console.log('options:',options)
       try{
         let response = await fetch(url);

         let data =  await response.text()

         return  data;

       }catch(err){
         //alert("There was an error retriving the record from:",url)
         console.error(err);

         // Handle errors here
       }
     },

     searchSavedRecords: async function(user,search){

      let utilUrl = useConfigStore().returnUrls.util
      let utilPath = useConfigStore().returnUrls.env

      let url
      if (user && !search){
        url = `${utilUrl}myrecords/${utilPath}/${user}`
      }else if (user && search){
        url = `${utilUrl}allrecords/${utilPath}/${search}/${user}`
      }else{
        url = `${utilUrl}allrecords/${utilPath}/`
      }
      let r = await this.fetchSimpleLookup(url)

      if (r!==false){

        let rSorted = [];
        for (let id in r) {
            rSorted.push(r[id]);
        }
        rSorted.sort(function(a, b) {
            return b.timestamp - a.timestamp ;
        });

        return rSorted

      }

      return []

  },

  /**
   * Validate a record send to backend
   */
  validate: async function(xml){
    //console.log(">> Validating", xml)

    let url = useConfigStore().returnUrls.validate

    const rawResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      //signal: AbortSignal.timeout(5000),
      body: JSON.stringify({rdfxml: xml})
    });

    const content = await rawResponse.json();

    return content

  },

  /**
  * Send the record
  * @async
  * @param {string} xml - The xml string
  * @param {string} eid - the e12345678 number
  * @param {obj} activeProfile - the activeProfile we're posting
  * @return {obj} - {status:false, msg: ""}
  */

  publish: async function(xml,eid,activeProfile){

    // console.log("activeProfile",activeProfile)
    let postingHub = false

    // check if we are posting a HUB if so set that flag
    // activeProfile is not required but if it is check
    if (activeProfile){
      if (activeProfile.id && activeProfile.id === 'Hub'){
        postingHub = true
      }
    }

    let url = useConfigStore().returnUrls.publish

    let uuid = translator.toUUID(translator.new())

    const rawResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({name: uuid, rdfxml:xml, eid: eid, hub:postingHub})
    });
    const content = await rawResponse.json();

    // console.log(content);

    if (content && content.publish && content.publish.status && content.publish.status == 'published'){

      return {status:true}

    }else{

      // alert("Did not post, please report this error--" + JSON.stringify(content.publish,null,2))
      return {status:false, msg: JSON.stringify(content.publish,null,2)}
    }
  },


  /**
  * Send off a rdf bibframe xml files in the format <rdf:RDF><bf:Work/><bf:Instance/>...etc...</rdf:RDF>
  * @async
  * @param {string} xml - The xml string
  * @return {string} - the MARC in XML response
  */
  marcPreview: async function(xml){

    let url = useConfigStore().returnUrls.util + 'marcpreview'

    console.log(xml)
    const rawResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({rdfxml:xml})
    });
    const content = await rawResponse.json();

    return content

  },


    /**
    * A result from searching ID by LCCN
    * @typedef {lccnSearchResult} lccnSearchResult
    * @property {string} lccn - the lccn searched
    * @property {string} label - the label to display in a search result
    * @property {string} bfdbURL - the http url to the bfdb url\
    * @property {string} idURL - the http url to the id.loc.gov page for instance
    * @property {string} bfdbPackageURL - the http url to the data package for this instance
    */

    /**
    * Looks for instances by LCCN against ID, returns into for them to be displayed and load the resource
    * @param {string} lccn - the lccn to search for
    * @return {array} - An array of {@link lccnSearchResult} results
    */
    searchInstanceByLCCN: async function(lccn){
      lccn = lccn.replaceAll(' ','')

      // ID needs the lccn to have a space between letters and the numbers
      // If there isn't one, make the adjustment
      const re = /^[a-z]{2}/g          // not sure if it's only every 2 characters
      const found = lccn.match(re)
      if (found != null){
        lccn = lccn.slice(0,2) + " " + lccn.slice(2)
      }

      try{
        let req = await fetch(useConfigStore().returnUrls.id + `resources/instances/suggest2?q=${lccn}&searchtype=keyword` )
        let results = await req.json()

        let returnVal = []

        for (let r of results.hits){

          let bfdbPackageURL = useConfigStore().returnUrls.bfdb + r.uri.split('id.loc.gov/')[1] + '.convertedit-pkg.xml'

          if (useConfigStore().returnUrls.publicEndpoints){
            bfdbPackageURL = useConfigStore().returnUrls.id + r.uri.split('id.loc.gov/')[1] + '.cbd.rdf'
          }

          returnVal.push({
            lccn: lccn,
            label: r.aLabel,
            bfdbURL: useConfigStore().returnUrls.bfdb + r.uri.split('id.loc.gov/')[1],
            idURL: useConfigStore().returnUrls.id + r.uri.split('id.loc.gov/')[1],
            bfdbPackageURL: bfdbPackageURL
          })

        }


        return returnVal


      }catch{
        return ["Error searching LCCN"]
      }

    },

    /**
    * Send off a rdf bibframe xml files in the format <rdf:RDF><bf:Work/><bf:Instance/>...etc...</rdf:RDF>
    * @async
    * @param {string} xml - The xml string
    * @return {string} - the MARC in XML response
    */
    scriptShifterRequestTrans: async function(lang,text,capitalize,t_dir){


      let url = useConfigStore().returnUrls.scriptshifter + 'trans'

      let r = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lang: lang,
          text:text,
          capitalize:capitalize,
          t_dir:t_dir
        })

      })

      let results =  await r.text()
      if (r.status !== 200){
        alert(results)
        return false
      }else{
        return results
      }



      // const rawResponse = await fetch(url, {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({rdfxml:xml})
      // });
      // const content = await rawResponse.json();

      // console.log(content);

      // return content

    },


    /**
    * Do Shelflisting search against BFDB
    *
    * @param {string} search - the call number to search for
    * @param {string} dir - asc or desc
    * @return {array} - results from API
    */
    searchShelfList: async function(search,dir){

      // js-loc-callnumbers
      // A javascript class to normalize and perform various sorting options on
      // Library of Congress Call Numbers within a library institution.

      // constructor
      function locCallClass() {
        //define the regular expressions used in the normalization
        this.lc = /([A-Z]{1,3})\s*(\d{1,4})(\.\d+)*(.+)*/ig;
        this.punctuation  = /[.,\/#!$%\^&\*;:{}=\-_`~()]/ig;
        this.lett_num_group = /([A-Z]{1,}\d{1,})/ig;
        this.num_letter_groupings = /(\d{1,})([A-Z]{1,})/ig;
        this.v_dot = /(v\s)(\d{1,})/ig;
        this.no_dot = /(no\s)(\d{1,})/ig;

        //define and cache the padding lengths (max pad length is 9)
        this.cache = ['', ' ', '  ', '   ', '    ', '     ', '      ', '       ', '        ', '         '];

        // alias the function name for returnNormLcCall
        this.normalize = this.returnNormLcCall;
      }


      // locCallClass.returnNormLcCall(call_number)
      // returns a "normalized" call number
      locCallClass.prototype.returnNormLcCall = function(callnumber_string) {
        // this is our eventual return value
        var local_norm = '',
          test = [];

        //~ TODO
        //~ get cataloging to fix issues with non-normalizing call numbers
        //~ so we don't have to use this hack.
        //~ Call numbers like this "KBG .A1" should normalize to "kbg   0 a2"
        try{
          const exception = /(KBG)(\s*\.)(.+)*/i;
          test = exception.exec(callnumber_string);
          if (test != null) {
            //debugger;
            var new_callnumber_string = "";
            if( typeof test[1] !== "undefined" ) new_callnumber_string += test[1] + "0";
            if( typeof test[2] !== "undefined" ) new_callnumber_string += test[2];
            if( typeof test[3] !== "undefined" ) new_callnumber_string += test[3];
            test = [];
            return this.returnNormLcCall(new_callnumber_string);
          }

        }
        catch (e){
          // console.log('undefined call number ' + e);
        }
        //~ /TODO

        try{
          test = this.lc.exec(callnumber_string.toLowerCase());
        }
        catch (e){
          console.log('undefined call number ' + e);
        }

        // if input is not LC, return lower case, trimmed input string,
        // with certain characters removed
        if (test === null){
          console.log("\"" + callnumber_string + "\"" + " not lc");
          return callnumber_string
            .toLowerCase()
            .trim()
            .replace(/\/{1,}|-{1,}/gi, " "); //replaces "/" and "-" with spaces
        }

        // TODO :
        // remove try block?
        try {
          if(typeof test[1] !== "undefined"){
            local_norm = test[1];
          }

          local_norm += this.leftPad(test[2],7-test[1].length);

          // append the decimal, if there is one
          if(typeof test[3] !== "undefined"){
            local_norm += test[3];
          }

          // remove any leading or trailing whitespace
          local_norm = local_norm.trim();

          // normalize the rest of the call number
          var call_number_remainder = "";
          if (typeof test[4] !== 'undefined'){
            // step 4. i. convert any punctuation to spaces
            // append letter+number groups with spaces
            // step 4. remove instances of multiple spaces, leaving only one
            // remove any trailing (or starting) whitespace
            call_number_remainder += test[4]
              .replace(this.punctuation, " ")	//repalce punctuation with spaces
              .replace(this.lett_num_group, "$1 ") //append spaces to letter+number groups
              .replace(this.num_letter_groupings, "$1 $2") //place space between numbers and letters occuring next to eachother
              .replace(/\s{2,}/g," "); //instances of 2 or more consecutive spaces are replaced by one


            // TODO :
            // consider removing the lastIndex for the following?

            // pad out numbers occuring after "v." and "no."
            // note: this calls the helper function for replace "vol_pad()"
            call_number_remainder = call_number_remainder.replace(this.v_dot, this.vol_pad.bind(this));
            this.v_dot.lastIndex = 0;

            call_number_remainder = call_number_remainder.replace(this.no_dot, this.vol_pad.bind(this));
            this.no_dot.lastIndex = 0;

            // reset the lastIndex so the next regex exec doesn't fail on next try
            this.punctuation.lastIndex = 0;

          }

          // add a single space to the front of the call_number_remainder
          call_number_remainder = call_number_remainder.trim();
          call_number_remainder = " " + call_number_remainder;

          //append the begining of the callnumber to the remainder of the call number
          local_norm += call_number_remainder;

          //trim spaces from the end, or the begining of the string
          local_norm = local_norm.trim();

        } //end try

        catch (e){
          console.log(' no test ');
        }

        // reset the lastIndex so the next regex exec doesn't fail on next try
        this.lc.lastIndex = 0;

        return local_norm;


      } //end returnNormLcCall


      // locCallClass.localeCompare(b,a)
      // replicates functionality of the normal compare function
      // so that it may be used in external sorting operations:
      //
      // A negative number if the reference string (a) occurs before the
      // given string (b);
      // positive if the reference string (a) occurs after
      // the compare string (b);
      // 0 if they are equivalent.
      locCallClass.prototype.localeCompare = function (a, b) {
        try {
          var a_norm = this.returnNormLcCall(a),
            b_norm = this.returnNormLcCall(b);

            return ( a_norm < b_norm ? -1 : (a_norm > b_norm ? 1 : 0) );
        }
        catch (err) {
          // console.log("error")
        }
      }

      // locCallClass.sortCallNumbers()
      // takes an array of call numbers and returns a sorted array of call
      // numbers in their original format.
      // Using something like the following works to sort as well:
      // var loc = new locCallClass();
      // var sorted_array = loc.unsorted_callnumber_array.sort(function(a,b) {return loc.localeCompare(a,b)});
      locCallClass.prototype.sortCallNumbers = function (callnumbers) {
        // also bind the scope of this to the sort function to be able to call
        // this.localeCompare
        var sorted = callnumbers.sort(function (a,b) {
          return this.localeCompare(a,b);
        }.bind(this));

        return sorted;
      }

      // locCallClass.isBetween(a,b,c)
      // returns true if a <= c <= b
      locCallClass.prototype.isBetween = function (a,b,c) {
        //this.localeCompare(a, b) <= 0 if in sort order
        return ( (this.localeCompare(a,c) <= 0 && this.localeCompare(c,b) <=0) ? true : false );
      }

      // pad the string
      locCallClass.prototype.leftPad = function (string, pad_length) {
        // make sure that we're treating the string like a string
        string = string + '';
        pad_length = pad_length - string.length;
        // nothing to pad
        if (pad_length <= 0) {
          return string;
        }

        return this.cache[pad_length] + string;
      } // end leftPad

      //helper function for volume padding
      locCallClass.prototype.vol_pad = function (match, vol_string, num_string, offset, string) {
        // padding out number portion to 5 places
        return vol_string.trim() + this.leftPad(num_string, 5);
      }











      if (!dir){
        dir ='asc'
      }


      // try{
        let req = await fetch(useConfigStore().returnUrls.shelfListing + `browse/class/${dir}/${search}.json` )
        let results = await req.json()

        // let results = [{"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20C66%202016", "term":"TF148 C66 2016", "frequency":"", "creator":"", "title":"Trains", "pubdate":"2016", "subject":"Railroad trains--Juvenile literature", "altsubject":"Railroad trains"}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.A46%202021", "term":"TF148 .A46 2021", "frequency":"", "creator":"", "title":"Listen up!", "pubdate":"2021", "subject":"Railroad trains--Juvenile literature", "altsubject":"Trains--Ouvrages pour la jeunesse"}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.A47%201983", "term":"TF148 .A47 1983", "frequency":"", "creator":"", "title":"Going on a train", "pubdate":"1983", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.A5%201993", "term":"TF148 .A5 1993", "frequency":"", "creator":"", "title":"Trains at work", "pubdate":"1993", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B24%201999", "term":"TF148 .B24 1999", "frequency":"", "creator":"", "title":"The best book of trains", "pubdate":"1999", "subject":"Railroad trains--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B26%201998", "term":"TF148 .B26 1998", "frequency":"", "creator":"", "title":"Amazing trains", "pubdate":"1998", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B27%201986", "term":"TF148 .B27 1986", "frequency":"", "creator":"", "title":"Trains", "pubdate":"1986", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B3%201949", "term":"TF148 .B3 1949", "frequency":"", "creator":"", "title":"A book of trains", "pubdate":"1949", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B45%201984", "term":"TF148 .B45 1984", "frequency":"", "creator":"", "title":"Amazing trains of the world", "pubdate":"1984", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B4594%202018", "term":"TF148 .B4594 2018", "frequency":"", "creator":"", "title":"Trains", "pubdate":"2017", "subject":"Railroad trains--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B48%201990", "term":"TF148 .B48 1990", "frequency":"", "creator":"", "title":"The train book", "pubdate":"1990", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B49%201998", "term":"TF148 .B49 1998", "frequency":"", "creator":"", "title":"Big book of trains", "pubdate":"1998", "subject":"Railroad trains--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B49%202016", "term":"TF148 .B49 2016", "frequency":"", "creator":"", "title":"The big book of trains", "pubdate":"2016", "subject":"Locomotives--Juvenile literature", "altsubject":"Railroad trains--Juvenile literature"}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B55", "term":"TF148 .B55", "frequency":"", "creator":"", "title":"Great trains of the world", "pubdate":"1953", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B69%201995", "term":"TF148 .B69 1995", "frequency":"", "creator":"", "title":"Trains", "pubdate":"1995", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B692%202017", "term":"TF148 .B692 2017", "frequency":"", "creator":"", "title":"Trains", "pubdate":"2017", "subject":"Railroad trains--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B693%202003", "term":"TF148 .B693 2003", "frequency":"", "creator":"", "title":"Railroading", "pubdate":"2003", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B696%201996", "term":"TF148 .B696 1996", "frequency":"", "creator":"", "title":"Freight trains", "pubdate":"1996", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B7", "term":"TF148 .B7", "frequency":"", "creator":"", "title":"Richard learns about railroading", "pubdate":"1969", "subject":"Railroads--Juvenile literature", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20.B717%202016", "term":"TF148 .B717 2016", "frequency":"", "creator":"", "title":"Rolling down the Avenue", "pubdate":"2016", "subject":"Street-railroads--Juvenile literature", "altsubject":""}]
        // results = [{"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20H316%202005", "term":"TT820 H316 2005", "frequency":"", "creator":"", "title":"Decorative knitting", "pubdate":"2005", "subject":"Knitting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20H813145%202008", "term":"TT820 H813145 2008", "frequency":"", "creator":"", "title":"Knit aid", "pubdate":"2008", "subject":"Knitting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A115%201991", "term":"TT820 .A115 1991", "frequency":"", "creator":"", "title":"42 favorite crochet motifs", "pubdate":"1992", "subject":"Crocheting--Patterns", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A1155%202023", "term":"TT820 .A1155 2023", "frequency":"", "creator":"", "title":"60 quick crochet projects for beginners", "pubdate":"2023", "subject":"Crocheting--Patterns", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A1156%202024", "term":"TT820 .A1156 2024", "frequency":"", "creator":"", "title":"60 quick granny squares", "pubdate":"2024", "subject":"Crocheting--Patterns", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A1158%202012", "term":"TT820 .A1158 2012", "frequency":"", "creator":"", "title":"101 crochet stitch patterns & edgings", "pubdate":"2012", "subject":"Crocheting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A116%202002", "term":"TT820 .A116 2002", "frequency":"", "creator":"", "title":"101 double-ended hook stitches", "pubdate":"2002", "subject":"Crocheting--Patterns", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A117%201996", "term":"TT820 .A117 1996", "frequency":"", "creator":"", "title":"101 fun-to-crochet projects", "pubdate":"1996", "subject":"Crocheting--Patterns", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A119%201995", "term":"TT820 .A119 1995", "frequency":"", "creator":"", "title":"150 favorite crochet designs", "pubdate":"1995", "subject":"Crocheting--Patterns", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A11912%202017", "term":"TT820 .A11912 2017", "frequency":"", "creator":"", "title":"200 fun things to crochet", "pubdate":"2017", "subject":"Crocheting--Patterns", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A11913%202017", "term":"TT820 .A11913 2017", "frequency":"", "creator":"", "title":"200 fun things to knit", "pubdate":"2017", "subject":"Knitting--Patterns", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A1194%202015", "term":"TT820 .A1194 2015", "frequency":"", "creator":"", "title":"500 crochet stitches", "pubdate":"2015", "subject":"Crocheting--Technique", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A1196%202008", "term":"TT820 .A1196 2008", "frequency":"", "creator":"", "title":"A to Z of crochet", "pubdate":"2008", "subject":"Crocheting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A11968%202009", "term":"TT820 .A11968 2009", "frequency":"", "creator":"", "title":"A to Z of knitting", "pubdate":"2009", "subject":"Knitting--Handbooks, manuals, etc.", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A1197%202020", "term":"TT820 .A1197 2020", "frequency":"", "creator":"", "title":"A-Z of knitting", "pubdate":"2020", "subject":"Knitting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A19", "term":"TT820 .A19", "frequency":"", "creator":"", "title":"The complete book of knitting", "pubdate":"1971", "subject":"Knitting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A33%202019", "term":"TT820 .A33 2019", "frequency":"", "creator":"", "title":"Fair Isle mittens", "pubdate":"2019", "subject":"Crocheting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A42%202007", "term":"TT820 .A42 2007", "frequency":"", "creator":"", "title":"The natural knitter", "pubdate":"2007", "subject":"Knitting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A48", "term":"TT820 .A48", "frequency":"", "creator":"", "title":"Le Tricot", "pubdate":"1977", "subject":"Knitting", "altsubject":""}, {"lookup":"/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TT820%20.A5149%202020", "term":"TT820 .A5149 2020", "frequency":"", "creator":"", "title":"Knitting & crocheting all-in-one", "pubdate":"2020", "subject":"Knitting--Patterns", "altsubject":""}]

        let toSort = []

        for (let r of results){
          r['lookup'] = useConfigStore().returnUrls.shelfListing.slice(0, -1) + r['lookup']
          toSort.push(r.term)
        }
        console.log("search",search)
        toSort.push(search)
        console.log("toSort",JSON.parse(JSON.stringify(toSort)))

        var loc = new locCallClass
        toSort.sort(function(a,b){
          return loc.localeCompare(a,b)
        });
        console.log('toSort after',toSort);

        let previousL = null
        for (let l of toSort){
          if (l == search){
            break
          }

          previousL = l
        }
        console.log("previousL ==",previousL)

        let index = -1
        for (let r of results){
          index++
          if (r.term == previousL){
            break
          }

        }
        console.log('index',index)

        results.splice(index, 0, {
          term:'-----',
          title:'Would Appear Here',
          pubdate:"------",
          lookup:'#'
        })


        return results
        // let returnVal = []

        // for (let r of results.hits){

        //   let bfdbPackageURL = useConfigStore().returnUrls.bfdb + r.uri.split('id.loc.gov/')[1] + '.convertedit-pkg.xml'

        //   if (useConfigStore().returnUrls.publicEndpoints){
        //     bfdbPackageURL = useConfigStore().returnUrls.id + r.uri.split('id.loc.gov/')[1] + '.cbd.rdf'
        //   }

        //   returnVal.push({
        //     lccn: lccn,
        //     label: r.aLabel,
        //     bfdbURL: useConfigStore().returnUrls.bfdb + r.uri.split('id.loc.gov/')[1],
        //     idURL: useConfigStore().returnUrls.id + r.uri.split('id.loc.gov/')[1],
        //     bfdbPackageURL: bfdbPackageURL
        //   })

        // }


        // return returnVal


      // }catch{
      //   return ["Error searching Shelflist"]
      // }

    },


}


export default utilsNetwork;