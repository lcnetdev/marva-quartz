

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

        if (url.includes('.rdf') || url.includes('.xml')){
          data =  await response.text()
        }else{
          data =  await response.json()
        }
        return  data;
      }catch(err){
        //alert("There was an error retriving the record from:",url)
        console.error(err);
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


}


export default utilsNetwork;