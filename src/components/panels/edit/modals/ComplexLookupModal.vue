<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'

  import { useConfigStore } from '@/stores/config'
  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'

  import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";


  import utilsNetwork from '@/lib/utils_network';

  import { AccordionList, AccordionItem } from "vue3-rich-accordion";
  import short from 'short-uuid'

  export default {
    components: {
      VueFinalModal,
      AuthTypeIcon,
      AccordionList,
      AccordionItem
    },
    props: {
      // structure of the field that owns this modal
      structure: Object,
      // the inital search value starting the search
      searchValue: String,
      guid: String,
      propertyPath: Array,


      // If this is populate, we want to pull up the authority record
      // without the user doing anything
      authorityLookup: String
    },
    data() {
      return {

        modeSelect: null,
        searchValueLocal: null,
        authorityLookupLocal: null,

        searchTimeout: null,

        activeComplexSearch: [],
        activeComplexSearchInProgress: false,
        controller: new AbortController(),

        initalSearchState: true,

        // These help paging the results when needed
        offsetStart: 0,
        offsetStep: 30,
        currentPage: 1,
        maxPage: 0,
        activeContext: null,
        nextInputIsVoyagerModeDiacritics: false,
		    searchType: "left",


        labelMap: {
          "notes": "Notes",
          "nonlatinLabels": "Non-Latin Authoritative Labels",
          "variantLabels": "Variants",
          "varianttitles": "Varants Titles",
          "birthdates": "Date of Birth",
          "deathdates": "Date of Death",
          "establishDates":"Established",
          "terminateDates":"Terminated",
          "birthplaces": "Place of Birth",
          "locales": "Associated Locales",
          "activityfields": "Fields of Activity",
          "occupations": "Occupations",
          "languages": "Associated Languages",
          "lcclasss": "LC Classification",
          "lcclasses": "LC Classification",
          "broaders": "Has Broader Authority",
          "gacs": "GAC(s)",
          "collections": "MADS Collections",
          "sources": "Sources",
          "marcKeys": "MARC Key",
          "contributors": "Contributors",
          "identifiers": "Identifiers",
          "subjects": "Subjects",
          "sees": "See Also",
          "genres": "Genre/Form",
          "pubDate": "Publication Date",
          "vernacularMarcKeys": "Variant MARC Key",
          "vernacularLabels": "Vernacular Labels",
          "relateds": "Related",
          "hasRelatedAuthoritys": "Has Related Authorities",
          "hasEarlierEstablishedForms": "Earlier Established Forms",
          "hasLaterEstablishedForms": "Later Established Forms",
          "useFors": "Use For"

        },
        panelDetailOrder: [
            "birthdates","deathdates", "pubDate", "notes", "gacs", "nonlatinLabels", "variantLabels", "varianttitles", "hasEarlierEstablishedForms", "hasLaterEstablishedForms",
            "contributors", "relateds","establishDates","terminateDates",
            "sources", "lcclasses", "lcclasss", "birthplaces",  "locales",
            "activityfields","occupations","languages", "sees",
            "identifiers","broaders",
            "collections", "genres", "subjects", "marcKeys", "vernacularMarcKeys", "vernacularLabels", "rdftypes", "hasRelatedAuthoritys", "useFors"
        ],

        // editing 4XX
        showEdit4xxPanel: false,
        associatedLang: null,
        bcpCodes: {},
        marcData: [{}],
        activeIndex: 0,
        xmlTarget: [],
        refEval: false,
        originalMarc: null,
        updatedRecord: null,
        diffRecord: [],
        oneXXdollarD: false,
        validating: false,
        validationResult: {},

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      // // // gives read access to this.count and this.double
      // ...mapState(usePreferenceStore, ['showPrefModal','showPrefModalGroup','styleDefault', 'showPrefModalGroup', 'fontFamilies']),

      // array of the pssobile groups from the stlyes

      ...mapState(useConfigStore, ['lookupConfig']),
      ...mapState(useProfileStore, ['returnComponentByPropertyLabel', 'duplicateComponentGetId', 'isEmptyComponent', 'isLatin', 'adjustAuthRecord', 'compareAuthRecords']),

      ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse','diacriticPacks', 'lastComplexLookupString']),

      ...mapWritableState(useProfileStore, ['lastComplexLookupString','showNacoStubCreateModal', 'activeNARStubComponent', 'activeProfile', 'setValueLiteral']),




      modalSelectOptions(){
        let options = []
        // add in the the defaul search ALL of everything possible
        //options.push({label: 'All', urls:null, processor:null})

        this.structure.valueConstraint.useValuesFrom.forEach((l)=>{
          if (this.lookupConfig[l]){
            this.lookupConfig[l].modes.forEach((mode)=>{
              Object.keys(mode).forEach((k)=>{
                options.push({label: k, urls:mode[k].url, processor:this.lookupConfig[l].processor, minCharBeforeSearch: (this.lookupConfig[l].minCharBeforeSearch ? this.lookupConfig[l].minCharBeforeSearch : false), all:mode[k].all })
                // mark the first All one we find as the first one
                if (!this.modeSelect && mode[k].all){
                  this.modeSelect = k
                }
              })
            })
          }
        })
        return options
      },
      modalSelectOptionsLabels(){
        return this.modalSelectOptions.map((o)=>{return o.label})
      },







    },

    watch: {


      // watching the search input, when it changes kick off a search
      searchValueLocal: async function(){
        this.doSearch()
      },


      modeSelect: async function(){
        this.activeComplexSearch = []
        this.doSearch()
      },
    },

    methods: {
      setCharAt: function(str, index, chr) {
          if(index > str.length-1) return str;
          return str.substring(0,index) + chr + str.substring(index+1);
      },

      resetBcp: function(){
        this.showEdit4xxPanel =  false
        this.associatedLang =  null
        this.bcpCodes =  {}
        this.marcData =  [{}]
        this.activeIndex =  0
        this.xmlTarget =  []
        this.refEval =  false
        this.originalMarc =  null
        this.updatedRecord =  null
        this.diffRecord =  []
        this.oneXXdollarD =  false
      },

      // initial 4XX
      edit4XX: async function(data, idx){
        this.resetBcp()
        // Get MarcKey for 1XX
        let marcKey = data.extra.marcKeys[0]
        this.tag = marcKey.slice(0,3)
        this.indicators = marcKey.slice(3,5)
        if (this.tag != 430){
          //ind 2 = 1
          this.indicators = this.setCharAt(this.indicators, 1, '1')
        }else{
          //ind 1 = 1
          this.indicators = this.setCharAt(this.indicators, 0, '1')
        }

        // get the MARCxml
        let marcXML = await this.fetchAuthXML(data.uri.split('/').at(-1))
        let parser = new DOMParser()
        this.xmlDoc = parser.parseFromString(marcXML, "text/xml")
        this.originalMarc = this.xmlDoc.cloneNode(true)
        this.associatedLang = this.xmlDoc.querySelectorAll('[tag="377"]')

        if (this.associatedLang.length == 1){
          this.associatedLang = this.associatedLang[0].textContent.trim()
        }
        let variants = data.extra.variantLabels
        let targetTag = "4" + this.tag.slice(1,3)

        this.tag = targetTag
        this.marcData[0].tag = targetTag
        this.marcData[0].indicators = this.indicators

        let targetNameXML = this.xmlDoc.querySelectorAll('[tag="' + targetTag +'"]')[idx]
        this.xmlTarget = [targetTag, idx, targetNameXML.children[0].innerHTML]

        let marc667List = this.xmlDoc.querySelectorAll('[tag="667"]')
        console.info("marc667List: ", marc667List)

        // get the $d for the 1XX, as long as there is no $t
        let childFields = [].slice.call(targetNameXML.children).map(field => field.getAttribute('code'))
        for (let child of targetNameXML.children){
          if (child.getAttribute('code') == 'd' && !childFields.includes('t')){
            this.oneXXdollarD = child.innerHTML
          }
        }

        for (let sub of targetNameXML.children){
          let subfield = sub.getAttribute("code")
          let value = sub.innerHTML
          this.marcData[0]["subfield_" + subfield] = value
        }

        // BCP suggestions
        this.bcpCodes = await utilsNetwork.fetchBCP47Codes(this.marcData[0]["subfield_a"], this.associatedLang)
        this.marcData[this.activeIndex].bcpSelection = [0]
        for (let c of this.marcData[this.activeIndex].bcpSelection){
          this.marcData[0]['subfield_7'] = "(bcp47)" + this.bcpCodes[c].bcp47code
        }

        this.marcData[0].displayName = ''
        for (let sf of Object.keys(this.marcData[0])){
          if (sf.startsWith('subfield_')){
            this.marcData[0].displayName = this.marcData[0].displayName + "$" + sf.split("_")[1] + this.marcData[0][sf]
          }
        }

        this.buildNewMarcKey()

        // swap out left panel for form
        this.showEdit4xxPanel = true

      },

      hideBCP: function(){
        this.showEdit4xxPanel = false
      },
      submitEdit: async function(){
        if (this.marcData.some(d => {return d.bcpSelection.length == 0})){
          alert("A name is missing a language Selection. Add one before continuing.")
          return
        }
        this.marcData[this.activeIndex].refEval = this.refEval

        const marcXML = this.xmlDoc
        let updates = this.marcData
        let target = this.xmlTarget

        console.info("this.marcData: ", this.marcData)

        this.updatedRecord = this.adjustAuthRecord(this.xmlDoc, this.marcData, this.xmlTarget)

        console.info("updatedRecord: ", this.updatedRecord)

        let xmlUpdated = new XMLSerializer().serializeToString(this.updatedRecord)

        // validate the update
        this.validating = true
        this.validationResult = await utilsNetwork.validateNar(xmlUpdated)
        this.validating = false

        if (this.validationResult.validation[0].level == 'ERROR'){
          return
        }

        console.info("update: ", xmlUpdated)
        console.info("marcXML: ", marcXML)
        let comparison = this.compareAuthRecords(this.originalMarc, this.updatedRecord, target, updates)
        this.diffRecord = comparison
        console.info("comparison: ", comparison)
      },

      addBcpCode: function(idx){
        // activeIndex
        if (!this.marcData[this.activeIndex].bcpSelection){
          this.marcData[this.activeIndex].bcpSelection = []
        }
        if (this.marcData[this.activeIndex].bcpSelection.includes(idx)){ // remove it
          this.marcData[this.activeIndex].bcpSelection = this.marcData[this.activeIndex].bcpSelection.filter(item => item != idx)
        } else {
          this.marcData[this.activeIndex].bcpSelection.push(idx)
        }
      },

      buildNewMarcKey: function(){
        this.marcData[this.activeIndex] = { // reset to make deletions easier to handle
          'tag': this.tag,
          'indicators': this.indicators,
          'bcpSelection': this.marcData[this.activeIndex].bcpSelection,
          'marcKey': this.marcData[this.activeIndex].marcKey,
          'displayName': this.marcData[this.activeIndex].displayName
        }

        let key = ''
        let marcKey = this.marcData[this.activeIndex].tag + this.marcData[this.activeIndex].indicators
        let userInput = this.marcData[this.activeIndex].displayName

        // split up the user input and use to populate the marcData
        let subfields = userInput.match(/.+?(?=\$[a-z0-9]|$|\n)/g)
        if (!subfields){
          subfields = ['']
          this.marcData[this.activeIndex].delete = true
        } else {
          this.marcData[this.activeIndex].delete = false
        }

        for (let sub of subfields){
          let field = sub.slice(1,2)
          let value = sub.slice(2)
          this.marcData[this.activeIndex]["subfield_" + field] = value
        }

        // this.marcData[this.activeIndex]['subfield_7'] = ''
        this.marcData[this.activeIndex]['subfield_7'] = []
        for (let c of this.marcData[this.activeIndex].bcpSelection){
          //this.marcData[this.activeIndex]['subfield_7'] = this.marcData[this.activeIndex]['subfield_7'] + "(bcp47)" + this.bcpCodes[c].bcp47code
          this.marcData[this.activeIndex]['subfield_7'].push("(bcp47)" + this.bcpCodes[c].bcp47code)
        }

        for (let sub of Object.keys(this.marcData[this.activeIndex])) {
          if (sub.startsWith("subfield_") && sub != "subfield_7"){
            key = key + "$" + sub.split("_")[1] + this.marcData[this.activeIndex][sub]
          }
        }

        if (this.marcData[this.activeIndex]['subfield_7'].length > 1){
          marcKey = marcKey + key + this.marcData[this.activeIndex]['subfield_7'].join(" $7 ")
        } else {
          marcKey = marcKey + key + " $7 " + this.marcData[this.activeIndex]['subfield_7']
        }

        this.marcData[this.activeIndex]['displayName'] = key
        this.marcData[this.activeIndex]['marcKey'] = marcKey

        console.info("this.marcData: ", this.marcData)
      },

      addBcpRow: function(){
        this.marcData.push({
          'tag': this.tag,
          'indicators': this.indicators,
          'bcpSelection': [0],
          'marcKey': '',
          'displayName': '$a',
        })
      },
      dupeBcpRow: function(idx){
        this.marcData.push(
          JSON.parse(JSON.stringify(this.marcData[idx]))
        )
      },

      addDateFromOneXX: function(){
        this.marcData[this.activeIndex].displayName += "$d" + this.oneXXdollarD
        this.buildNewMarcKey()
      },

      removeBcpRow: function(row){
        this.marcData.splice(row, 1);
        this.activeIndex = 0
      },

      fetchAuthXML: async function(lccn){
        let r = await utilsNetwork.fetchAuthMarc(lccn)
        return r
      },

      handleInput: function(event){
        this.marcData[this.activeIndex].displayName = event.target.value
        this.buildNewMarcKey()
      },

      sortResults: function(a,b){
        if (a.label.includes('Literal')){
        return -1
        } else if (a.label > b.label){
        return 1
        } else if(a.label < b.label){
        return -1
        } else {
        return 0
        }
      },
      checkLcOnly: function(){
        let config = useConfigStore()

        return config.returnUrls.displayLCOnlyFeatures
      },
      /**
       * Add class number to the work
       *
       * @param classNum - number to add
       */
      addClassNumber: async function(classNum, idx){
        // remove any paranthetical
        if (classNum.match(/\(.*\)/)){
          classNum = classNum.replace(/\(.*\)/, "")
        }
        // 2025454279
        let profile = this.activeProfile

        let label = "Classification numbers"
        let targetComponent = null //this.returnComponentByPropertyLabel('Classification numbers')
        let lastClassifiction

        for (let rt in profile.rt){
          for (let pt in profile.rt[rt].pt){
            if (profile.rt[rt].pt[pt]['propertyLabel'].toLowerCase() == label.toLowerCase()){
              if (rt.includes("lc:RT:bf2:Monograph:Work")){
                let temp = profile.rt[rt].pt[pt]
                let userValue = temp.userValue
                let type = false
                try {
                  type = userValue["http://id.loc.gov/ontologies/bibframe/classification"][0]["@type"]
                } catch{
                  // empty component
                }
                lastClassifiction = pt
                if (type == "http://id.loc.gov/ontologies/bibframe/ClassificationLcc" && !temp.deleted){
                  targetComponent = temp
                  break
                } else if (!type){
                  targetComponent = temp
                  break
                }
              }
            }
          }
        }

        let newClass
        // If no match, need to add component
        if (!targetComponent || !this.isEmptyComponent(targetComponent)){
          let structure = this.returnComponentByPropertyLabel('Classification numbers')
          newClass = await this.duplicateComponentGetId(structure['@guid'], structure, "lc:RT:bf2:Monograph:Work", lastClassifiction)
          targetComponent = profile.rt["lc:RT:bf2:Monograph:Work"].pt[newClass[0]]
        }

        let propertyPath = [
          { level: 0, propertyURI: "http://id.loc.gov/ontologies/bibframe/classification" },
          { level: 1, propertyURI: "http://id.loc.gov/ontologies/bibframe/classificationPortion" }
        ]

        let fieldGuid = null
        try {
          fieldGuid = targetComponent.userValue["http://id.loc.gov/ontologies/bibframe/classification"][0]["http://id.loc.gov/ontologies/bibframe/classificationPortion"][0]["@guid"]
        } catch(err){
          fieldGuid = short.generate()
        }

        try {
          this.setValueLiteral(targetComponent['@guid'], fieldGuid, propertyPath, classNum, null, null)
          // Give user some feedback
          let button = this.$refs.addClass[idx]
          button.innerText = "check"
        } catch(err) {
          console.error("Couldn't add the class number: ", err)
        }

      },
      checkUsable: function(data){
        let notes = data.extra.notes || []
        if (notes.includes("THIS 1XX FIELD CANNOT BE USED UNDER RDA UNTIL THIS RECORD HAS BEEN REVIEWED AND/OR UPDATED")){
          return false
        }
        return true
      },

      checkFromRda: function(data){
        let notes = data.extra.notes || []
        let isRda = false

        for (let note of notes){
          if (note.includes("$erda")){
            isRda = true
          }
        }

        return isRda
      },

      checkFromAuth: function(data){
        let notes = data.extra.notes || []
        let identifiers = data.extra.identifiers || []

        let looksLikeLccn = identifiers.filter((i) => i.startsWith("n")).length > 0 ? true : false

        return looksLikeLccn
      },

      hasPubDate: function(data){
        let dates = data.extra.pubdates

        if (dates && dates.length > 0){
          return dates[0]
        }

        return false
      },

      isSuppressed: function(data){
        let suppressed = false

        if (data.extra.status && data.extra.status == 'suppressed'){
          suppressed = true
        }

        return suppressed
      },

      generateLabel: function(data){
        let label = !data.literal ? data.suggestLabel : data.label + ((data.literal) ? ' [Literal]' : '')

        if (label.includes("(USE ")){
          label = data.label + " (USE FOR " + data.suggestLabel.replace(/\(USE.*\)/mg, "") + ")"
        }

        // let re = new RegExp(String.raw`(${this.searchValueLocal})`, "ig")
        // let match = re.exec(label)
        // if (match){
        //   let start = re.lastIndex - match[0].length
        //   let end =   re.lastIndex - 1
        //   label = label.slice(0, start) + "<span class='highlight-search-string'>" + label.slice(start, end+1) + "</span>" + label.slice(end+1)
        // }

        return label
      },
      truncate: function(string){
        let stg = string
        if (string.length > 80){
          stg = stg.slice(0, 80) + "..."
        }
        return string
      },
      // Reset stored values
      // This is for when the modal is closed, we want to reset things so nothing is preloaded
      // and the user starts from zero
      reset: function(){
        this.activeContext = null
        this.activeComplexSearch = []
        this.searchValueLocal = null
        this.authorityLookupLocal = null
        this.offsetStep = 30

        this.showEdit4xxPanel = false
      },

      // watching the search input, when it changes kick off a search
      doSearch: async function(){
        //if there is an ongoing search, abort it
        if (this.activeComplexSearchInProgress){
          this.controller.abort()
          this.controller = new AbortController()
        }

        if (!this.searchValueLocal){ return false}
        if (this.searchValueLocal.trim()==''){
          return false
        }

        if (this.searchValueLocal.length<3){
          // if it is non-latin
          if (this.searchValueLocal.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/)){
            // if it is a CJK language don't impose that limit
          }else{
            // check the config, some vocabs have very short codes, like the marc geo
            // so if it is configed to allow short search overtide the < 3 rule
            let minCharBeforeSearch = 3
            this.modalSelectOptions.forEach((a)=>{
              if (a.minCharBeforeSearch && a.minCharBeforeSearch < minCharBeforeSearch){
                minCharBeforeSearch = a.minCharBeforeSearch
              }
            })

            if (this.searchValueLocal.length<minCharBeforeSearch){
              return false
            }
          }
        }
        window.clearTimeout(this.searchTimeout)

		    let searchType = this.searchType
        let offset = this.offsetStart
        if (this.activeComplexSearch != []) {
          offset = this.offsetStep * (this.currentPage - 1)
        }

        let searchPayload = {
          processor: null,
          url: [],
          searchValue: this.searchValueLocal,   //This changed from searchValueLocal, to match what is expected in `utils_network.js`
          signal: this.controller.signal,        //Allows canceling the correct call
          type: 'simple'
        }
        // if (this.modeSelect == 'All'){
        //   this.modalSelectOptions.forEach((a)=>{
        //     // use the ones in the config marked as "all"
        //     if(a.all===true){
        //       searchPayload.processor=a.processor
        //       searchPayload.url.push(a.urls.replace('<QUERY>',this.searchValue))
        //     }
        //   })

        // }else{
          this.modalSelectOptions.forEach((a)=>{
            if (a.label==this.modeSelect){
              searchPayload.processor=a.processor
              searchPayload.type = 'complex'
              searchPayload.url.push(
                a.urls
                  .replace('<QUERY>', this.searchValueLocal)
                  .replace('<OFFSET>', offset)
                  .replace('<TYPE>', searchType)
                  .replace(/count=[0-9]+/ig, "count="+this.offsetStep)
              )
            }
          })

        // wrapping this in setTimeout might not be needed anymore
        this.searchTimeout = window.setTimeout(async ()=>{
          this.activeComplexSearchInProgress = true
          this.activeComplexSearch = []
          this.activeComplexSearch = await utilsNetwork.searchComplex(searchPayload)

          // 2025-03 // there is currently an issue with ID suggest2/ that if you search with SOME diacritics it will fail
          // so there is now a flag that enables it searching it. So if they get NO results at all then try again with the flag
          // There will always be 1 result which is the literal

          if (this.activeComplexSearch.length == 1 && this.activeComplexSearch[0].literal){
            // modify the payload to include the flag in the url
            searchPayload.url[0] = searchPayload.url[0] + '&keepdiacritics=true'
            this.activeComplexSearch = await utilsNetwork.searchComplex(searchPayload)
          }

          this.activeComplexSearchInProgress = false
          this.initalSearchState =false

          if (this.activeComplexSearch.length == 0 && offset > 0){
            // reset offset, set the page back one
            // this can happen because the "total" given from the suggest service reflects the number before deduping.
            offset = 0
            this.currentPage--
            this.doSearch()
            alert("You've reached last page with results. The other pages are empty.")
          }
        }, 100)

      },



      inputKeyup: function(event){

        // text macros
        let useTextMacros=this.preferenceStore.returnValue('--o-diacritics-text-macros')
        if (useTextMacros && useTextMacros.length>0){
          for (let m of useTextMacros){
            if (event.target.value.indexOf(m.lookFor) > -1){
              event.target.value = event.target.value.replace(m.lookFor,m.replaceWith)
              this.searchValueLocal = event.target.value
            }
          }
        }

        // only store for agents
        if (this.structure && this.structure.parentId && this.structure.parentId.toLowerCase().indexOf("agent") >-1){
          this.lastComplexLookupString = event.target.value
        }


      },





      inputKeydown: function(event){
        if (event.key==='ArrowDown'){
          this.$refs.selectOptions.focus()
          try {
            this.$refs.selectOptions.value=this.activeComplexSearch[0].uri
          } catch {}
          this.selectChange()
          return true
        }

        // do a bunch of diacritic checks to see if they are trying to trigger a diacrtiic macro




        // This mode is they press Crtl+e to enter diacritic macro mode, so they did that on the last kedown and now we need to act on the next keystroke and interpret it as a macro code
        if (this.nextInputIsVoyagerModeDiacritics){
            // they are pressing shift in about to press antoher macro shrotcut
            if (event.key == 'Shift'){
              return false
            }

            if (this.diacriticPacks.voyager[event.code]){
              let useMacro
              for (let macro of this.diacriticPacks.voyager[event.code]){
                if (macro.shiftKey == event.shiftKey){
                  useMacro = macro
                  break
                }
              }

              let inputV = event.target
              let insertAt = event.target.value.length
              if (event.target && event.target.selectionStart){
                insertAt=event.target.selectionStart
              }

              if (!useMacro.combining){
              // it is not a combining unicode char so just insert it into the value
                if (inputV.value){
                  // inputV.value=inputV.value+useMacro.codeEscape
                  inputV.value = inputV.value.substring(0, insertAt) + useMacro.codeEscape + inputV.value.substring(insertAt);
                }else{
                  inputV.value = useMacro.codeEscape
                }
                this.searchValueLocal = inputV.value
              }else{
                    // inputV.value=inputV.value+useMacro.codeEscape
                    inputV.value = inputV.value.substring(0, insertAt) + useMacro.codeEscape + inputV.value.substring(insertAt);
                    this.searchValueLocal = inputV.value
              }

              if (insertAt){
              this.$nextTick(()=>{
                inputV.setSelectionRange(insertAt+1,insertAt+1)
                this.searchValueLocal = inputV.value
                this.$nextTick(()=>{
                  inputV.focus()
                })

              })
              }else{
                this.$nextTick(()=>{
                  inputV.focus()
                })
              }
            }
            // turn off mode
            this.nextInputIsVoyagerModeDiacritics  =false
            event.target.style.removeProperty('background-color')
            event.preventDefault()
            return false
        }
        // all macros use the ctrl key
        if (event.ctrlKey == true){
          if (this.diacriticUse.length>0){
            for (let macro of this.diacriticUseValues){
              if (event.code == macro.code && event.ctrlKey == macro.ctrlKey && event.altKey == macro.altKey && event.shiftKey == macro.shiftKey){
                // console.log("run this macro", macro)
                event.preventDefault()
                this.runMacroExpressMacro(event)
                return false

              }
            }
          }

         // they are entering into voyager diacritic mode
          if (event.code == 'KeyE'){
            if (!this.preferenceStore.returnValue('--b-diacritics-disable-voyager-mode')){
              event.target.style.backgroundColor="chartreuse"
              this.nextInputIsVoyagerModeDiacritics = true
              event.preventDefault()
              return false
            }

          }

          //

        }







      },


      runMacroExpressMacro(event){

        for (let macro of this.diacriticUseValues){
              if (event.code == macro.code && event.ctrlKey == macro.ctrlKey && event.altKey == macro.altKey && event.shiftKey == macro.shiftKey){
                // console.log("run this macro", macro)
                let insertAt = event.target.value.length

                if (event.target && event.target.selectionStart){
                  insertAt=event.target.selectionStart
                }
                let inputV
                if (event.target){
                  inputV = event.target
                }else{
                  console.warn("ERROR: Field not found")
                  return false
                }
                if (!macro.combining){
                  // there is behavior where if it is a digit shortcut the numerial is still sent
                  // so if thats the case remove the last digit from the value
                  if (event.code.includes('Digit')){
                    // if it is in fact a digit char then remove it
                    if (inputV.value.charAt(insertAt) == event.code.replace('Digit','')){
                      // remove the last char
                      // inputV.value = inputV.value.slice(0, -1);
                      inputV.value = inputV.value.slice(0,insertAt) + inputV.value.slice(insertAt)
                      this.searchValueLocal = inputV.value
                      // this.doSearch()

                    }
                  }
                  // same for euqal key
                  if (event.code == 'Equal'){
                    if (inputV.value.charAt(inputV.value.length-1) == '='){
                      // remove the last char
                      // inputV.value = inputV.value.slice(0, -1);
                      inputV.value = inputV.value.slice(0,insertAt) + inputV.value.slice(insertAt)
                      this.searchValueLocal = inputV.value
                      // this.doSearch()
                    }
                  }
                  // same for Backquote key

                  if (event.code == 'Backquote'){
                    if (inputV.value.charAt(inputV.value.length-1) == '`'){
                      // remove the last char
                      // inputV.value = inputV.value.slice(0, -1);
                      inputV.value = inputV.value.slice(0,insertAt) + inputV.value.slice(insertAt)
                      this.searchValueLocal = inputV.value
                      // this.doSearch()
                    }
                  }
                  // it is not a combining unicode char so just insert it into the value
                  if (inputV.value){
                    // inputV.value=inputV.value+macro.codeEscape
                    inputV.value = inputV.value.substring(0, insertAt) + macro.codeEscape + inputV.value.substring(insertAt);
                    this.searchValueLocal = inputV.value
                    if (insertAt){
                      this.$nextTick(()=>{
                        inputV.setSelectionRange(insertAt+1,insertAt+1)
                        this.$nextTick(()=>{
                          inputV.focus()
                          // this.doSearch()
                        })
                      })
                    }else{
                        this.$nextTick(()=>{
                          inputV.focus()
                        })
                    }
                  }else{
                    inputV.value = macro.codeEscape
                    this.searchValueLocal = inputV.value
                  }


                }else{


                  // same for Backquote key

                  if (event.code == 'Backquote'){

                    if (inputV.value.charAt(inputV.value.length-1) == '`'){
                      // remove the last char
                      inputV.value = inputV.value.slice(0, -1);
                      this.searchValueLocal = inputV.value
                      // this.doSearch()
                    }

                    }


                    // little cheap hack here, on macos the Alt+9 makes ª digits 1-0 do this with Alt+## but we only
                    // have one short cut that uses Alt+9 so just remove that char for now
                    inputV.value=inputV.value.replace('ª','')

                    inputV.value = inputV.value.substring(0, insertAt) + macro.codeEscape + inputV.value.substring(insertAt);
                    // inputV.value=inputV.value+macro.codeEscape

                    inputV.setSelectionRange(insertAt+1,insertAt+1)
                    inputV.focus()


                    if (insertAt){
                    this.$nextTick(()=>{
                      inputV.setSelectionRange(insertAt+1,insertAt+1)
                      this.searchValueLocal = inputV.value
                      this.$nextTick(()=>{
                        inputV.focus()
                      })

                    })
                    }else{

                      this.$nextTick(()=>{
                        inputV.focus()
                      })

                    }
                }

                event.preventDefault()
                event.stopPropagation()
                return false
              }
            }



        },



      returnContextTitle(title){
        if (!Array.isArray(title)){
          title=[title]
        }
        if (title[0] && typeof title[0] == 'string'){ return title[0]}

        //let noLang = title.filter((v)=>{ if (v['@language']){return false}else{return true} })
        //GenreForm seem to have the lang tag even when there is only English values
        let noLang = title.filter((v)=> typeof v['@language'] == "undefined" || (v['@language'] && v['@language'] == "en") )
        if (noLang && noLang[0] && noLang[0]['@value']){ return noLang[0]['@value']}

        return 'ERROR - Cannot find label'

      },
      returnNonLatinAuthLabels(title){

        if (!Array.isArray(title)){
          title=[title]
        }
        if (title[0] && typeof title[0] == 'string'){ return []}

        let hasLang = title.filter((v)=>{ if (v['@language'] && v['@language'] != "en"){return true}else{return false} })

        let results = []
        for (let l of hasLang){
          results.push(`${l['@value']} @ ${l['@language']}`)
        }


        return results

      },




      selectNav: function(event){
        if (event.target.selectedIndex == 0){
          // pop back up into the search field
          if (event.key==='ArrowUp'){
            if (this.$refs.inputLookup){
              this.$refs.inputLookup.focus()
              this.$nextTick(() => {
                window.setTimeout(()=> {
                  // put the cursor at the end
                  this.$refs.inputLookup.setSelectionRange(1000,1000);
                },10);
              });
            }
          }
        }
        if (event.key==='Enter' && event.shiftKey){
          console.log("emitComplexValue",this.activeContext)
          this.$emit('emitComplexValue', this.activeContext)
        }

      },

      selectChange: async function(){
        let toLoad = null
        if (this.authorityLookupLocal == null && this.$refs.selectOptions != null ){
          toLoad = this.activeComplexSearch[this.$refs.selectOptions.selectedIndex]
        } else {
          // We're loading existing data and want to preselect the search result
          // that matches that value
          for (const idx in this.activeComplexSearch){
            let label = this.activeComplexSearch[idx].label
            if (label == this.authorityLookupLocal){
              toLoad = this.activeComplexSearch[idx]
              try{
                this.$refs.selectOptions.selectedIndex = idx
                break
              } catch(err) {
                console.log("")
              }
            }
          }
          this.authorityLookupLocal = null // zero this out
        }

        console.log("toLoad: ", toLoad)

        if (!toLoad){ return false }

        this.activeContext = {
          "contextValue": true,
          "source": [],
          "type": (toLoad && toLoad.literal) ? "Literal Value" : null,
          "variant": [],
          "uri": (toLoad == null || toLoad.literal) ? null : toLoad.uri,
          "title": (toLoad)  ? toLoad.label : "",
          "contributor": [],
          "date": null,
          "genreForm": null,
          "nodeMap": {},
          "precoordinated" : false,
          "literal": (toLoad && toLoad.literal) ? true : false,
          "loading":true,
          "extra": toLoad.extra ? toLoad.extra : {},
          "gacs": toLoad.extra ? toLoad.extra.gacs : [],
          "marcKey": (toLoad.extra && toLoad.extra.marcKeys) ? toLoad.extra.marcKeys[0] : ''
        }

        // filter the Authorized NonLatin from the variants
        // if (this.activeContext && this.activeContext.extra && this.activeContext.extra['variantLabels'] && this.activeContext.extra['nonlatinLabels']){
        //   this.activeContext.extra['variantLabels'] = this.activeContext.extra['variantLabels'].filter(n => !this.activeContext.extra['nonlatinLabels'].includes(n))
        // }
        // Filter earlier/later forms of name from releated
        if (this.activeContext && this.activeContext.extra && this.activeContext.extra['relateds'] && this.activeContext.extra['hasEarlierEstablishedForms']){
          this.activeContext.extra['relateds'] = this.activeContext.extra['relateds'].filter(n => !this.activeContext.extra['hasEarlierEstablishedForms'].includes(n))
        }
        if (this.activeContext && this.activeContext.extra && this.activeContext.extra['relateds'] && this.activeContext.extra['hasLaterEstablishedForms']){
          this.activeContext.extra['relateds'] = this.activeContext.extra['relateds'].filter(n => !this.activeContext.extra['hasLaterEstablishedForms'].includes(n))
        }

        if (toLoad && toLoad.literal){
          return false
        }

        let results = null
        results = this.activeContext
        // results = await utilsNetwork.returnContext(toLoad.uri)

        if (toLoad.uri.includes('/works/')){
          results.type = 'Work'
          results.typeFull='http://id.loc.gov/ontologies/bibframe/Work'
        } else if (toLoad.uri.includes('/hubs/')){
          results.type = 'Hub'
          results.typeFull='http://id.loc.gov/ontologies/bibframe/Hub'
        }

        // try {
        //   let r = await utilsNetwork.returnContext(toLoad.uri)
        //   // r = this.activeContext
        // } catch(err) {
        //     // r = this.activeContext
        // }
        results.loading = false

        // if this happens it means they selected something else very quickly
        // so don't go on and set it to this context, because its no longer the one they have selected
        try{
          if (toLoad.uri != this.activeComplexSearch[this.$refs.selectOptions.selectedIndex].uri){
            return false
          }
        } catch(err){

        }

        this.activeContext = results
      },

      isStaging(){
        if (useConfigStore().returnUrls.env == "staging" || useConfigStore().returnUrls.dev == true){
          return true
        }else{
          return false
        }
      },

      displayProvisonalNAR(){


        if (this.structure && this.structure.valueConstraint && this.structure.valueConstraint.useValuesFrom && this.structure.valueConstraint.useValuesFrom.length>0 && this.structure.valueConstraint.useValuesFrom.join(' ').indexOf('id.loc.gov/authorities/names')>-1){
          return true
        }
        return false
      },

      loadNacoStubModal(){
        // Set the current value for NAR creation
        this.lastComplexLookupString = this.searchValueLocal
        // store the info needed to pass to the process
        this.activeNARStubComponent = {
          type: 'lookupComplex',
          guid: this.guid,
          fieldGuid: null,
          structure: this.structure,
          propertyPath:this.propertyPath,
          source: "contribution"
        }



        this.$emit('hideComplexModal')

        this.$nextTick(() => {

          this.showNacoStubCreateModal = true

        })


        // this.displayCo/

      },

      editHub: function(uri){
        let editUrl = "https://editor.id.loc.gov/bfe2/quartz/?action=loadhub&url=" + this.rewriteURI(uri) + ".decomposed.rdf&profile=lc:RT:bf2:HubBasic:Hub"
        return editUrl
      },

      rewriteURI: function(uri, forBFDB=false){
        let returnUrls = useConfigStore().returnUrls

        if (!uri){
          return false
        }

        if (uri.includes('bibframe.example.org')){
          return false
        }

        if (
                forBFDB &&
                (
                    uri.includes('/resources/hubs/') ||
                    uri.includes('/resources/works/') ||
                    uri.includes('/resources/instances/') ||
                    uri.includes('/resources/items/')
                )
            ) {
            uri = uri.replace('https://id.loc.gov/', returnUrls.bfdb )
            uri = uri.replace('http://id.loc.gov/', returnUrls.bfdb )
        }


        // use internal links for prodcution
        if (returnUrls.dev || returnUrls.publicEndpoints){
          uri = uri.replace('http://preprod.id.','https://id.')
          uri = uri.replace('https://preprod-8230.id.loc.gov','https://id.loc.gov')
          uri = uri.replace('https://test-8080.id.lctl.gov','https://id.loc.gov')
          uri = uri.replace('https://preprod-8080.id.loc.gov','https://id.loc.gov')
          uri = uri.replace('https://preprod-8288.id.loc.gov','https://id.loc.gov')
        } else { // if it's not dev or public make sure we're using 8080
          uri = uri.replace('https://id.loc.gov', 'https://preprod-8080.id.loc.gov')
          uri = uri.replace('http://id.loc.gov', 'https://preprod-8080.id.loc.gov')
        }

        return uri
      },


      firstPage: function(){
        // if not the first page allow
        if (this.currentPage !== 1){
          this.currentPage = 1
          this.doSearch()
        }
      },
      prevPage: function(){
        // if not the first page allow
        if (this.currentPage !== 1){
          this.currentPage--
          this.doSearch()
        }
      },

      nextPage: function(){
        let max = Math.ceil(this.activeComplexSearch[0].total / this.offsetStep)

        if (max > this.currentPage){
          this.currentPage++
          this.doSearch()
        }
      },
      lastPage: function(){
        let max = Math.ceil(this.activeComplexSearch[0].total / this.offsetStep)

        if (max > this.currentPage){
          this.currentPage = max
          this.doSearch()
        }
      },

      updateStep: function(event){
        let val = event.target.value
        if (!isNaN(val)){
          this.preferenceStore.setValue('--b-edit-complex-number-jump', val)
        }
      },
      adjustNumResults: function(dir){
        this.currentPage = 1
        let step = Number(this.preferenceStore.returnValue('--b-edit-complex-number-jump'))

        if (dir == 'down'){
          this.offsetStep -= step
          if (this.offsetStep < 10){
            this.offsetStep = 10
          }
        } else {
          this.offsetStep += step
        }
        this.doSearch()
      },

      forceSearch: function(){
        //reset the search and do it again
        this.currentPage = 1
        this.doSearch()
      },

      changeSearchType: function(event){
        if (event.target.checked){
          this.searchType = "keyword"
        } else {
          this.searchType = "left"
        }
        this.doSearch()
      },
    },

    updated: function(event){
      if (this.authorityLookup == null){
        //Reset this so the input field isn't loaded with the old data
        this.activeComplexSearch = []
      }

      this.$nextTick(() => {
        this.$nextTick(() => {
          if (this.$refs.inputLookup){
            this.$refs.inputLookup.focus()
          }
          this.authorityLookupLocal = this.authorityLookup

          // We're loading existing data
          if (this.authorityLookupLocal != null){
            this.searchValueLocal = this.authorityLookupLocal
            this.doSearch()

            // search needs to complete, so selectChange has something to loop through
            setTimeout(() => {
              this.selectChange()
            }, (2 * 1000)
            )
          } else {
            this.searchValueLocal = this.searchValue
          }

          if (this.$refs.complexLookupModalContainer){
            let modalStopsAt = this.$refs.complexLookupModalContainer.getBoundingClientRect().height + this.$refs.complexLookupModalContainer.getBoundingClientRect().top
            let selectHeight =  modalStopsAt - this.$refs.selectOptions.getBoundingClientRect().y
            this.$refs.selectOptions.style.height = selectHeight - 1 + 'px'


            this.$refs.complexLookupModalDisplay.style.height = this.$refs.complexLookupModalContainer.getBoundingClientRect().height + 'px'
          }

		  if (this.$refs.toggle){
			if (this.$refs.toggle.checked){
				this.searchType = "keyword"
			}  else {
				this.searchType = "left"
			}
		  }
        })
      })



    },

    mounted() {
      // console.log("mounted yeah", this.structure)

      if (this.modeSelect === null){

        this.modeSelect = this.modalSelectOptions[0].label
      }
      // this.$nextTick(()=>{
      //   this.loadPrefGroup()
      //   this.$nextTick(()=>{
      //     this.$refs.preferenceContent.style.height = this.initalHeight + 'px'
      //   })

      // })

    }
  }



</script>

<template>


    <VueFinalModal
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"
      :content-transition="'vfm-fade'"
      :click-to-close="true"
      :esc-to-close="true"
      :background="'non-interactive'"
      :lock-scroll="true"
      class="complex-lookup-modal"
      content-class="complex-lookup-modal-content"
      @before-close="$emit('hideComplexModal'); reset();"
      >

      <div ref="complexLookupModalContainer" class="complex-lookup-modal-container" :style="`${this.preferenceStore.styleModalBackgroundColor()}`">
			<div class="menu-buttons">
				<button @click="reset(); $emit('hideComplexModal')">x</button>
			</div>
          <div class="complex-lookup-modal-container-parts">

            <template v-if="!showEdit4xxPanel">
              <div class="complex-lookup-modal-search">
                <template v-if="preferenceStore.returnValue('--b-edit-complex-use-select-dropdown') === false">
                  <div class="toggle-btn-grp cssonly">
                    <div v-for="opt in modalSelectOptions"><input type="radio" :value="opt.label" class="search-mode-radio" v-model="modeSelect" name="searchMode"/>
                      <label onclick="" class="toggle-btn">{{opt.label}}</label>
                    </div>
                  </div>

                  <div style="height: 22px; min-height: 22px;">
                    <div style="z-index: 100; float: left; margin-left: 10px;">
                      Jump by <input type="text" @input="updateStep" :value="preferenceStore.returnValue('--b-edit-complex-number-jump')" style="width: 30px">
                      Showing "<={{ offsetStep }}" results
                      <button @click="adjustNumResults('down')" v-if="offsetStep > 10" style="margin-right: 5px;">Fewer</button>
                      <button @click="adjustNumResults('up')">More</button>
                    </div>
                    <div v-if="(activeComplexSearch && activeComplexSearch[0] && ((activeComplexSearch[0].total % offsetStep) > 0 || activeComplexSearch.length > 0))" class="complex-lookup-paging">
                      <span :style="`${this.preferenceStore.styleModalTextColor()}`">
                        <a href="#" title="first page" class="first" :class="{off: this.currentPage == 1}" @click="firstPage()">
                          <span class="material-icons pagination" :style="`${this.preferenceStore.styleModalTextColor()}`">keyboard_double_arrow_left</span>
                        </a>
                        <a href="#" title="previous page" class="prev" :class="{off: this.currentPage == 1}" @click="prevPage()">
                          <span class="material-icons pagination" :style="`${this.preferenceStore.styleModalTextColor()}`">chevron_left</span>
                        </a>

                        <span class="pagination-label" > {{ this.currentPage }} of {{ !isNaN(Math.ceil(this.activeComplexSearch[0].total / this.offsetStep)) ? Math.ceil(this.activeComplexSearch[0].total / this.offsetStep) : "Last"}} </span>

                        <a href="#" title="next page" class="next" :class="{off: Math.ceil(this.activeComplexSearch[0].total / this.offsetStep) == this.currentPage}" @click="nextPage()">
                          <span class="material-icons pagination" :style="`${this.preferenceStore.styleModalTextColor()}`">chevron_right</span>
                        </a>
                        <a href="#" title="last page" class="last" :class="{off: Math.ceil(this.activeComplexSearch[0].total / this.offsetStep) == this.currentPage}" @click="lastPage()">
                          <span class="material-icons pagination" :style="`${this.preferenceStore.styleModalTextColor()}`">keyboard_double_arrow_right</span>
                        </a>
                      </span>

                    </div>
                    <div v-else style="min-height: 27px;"></div>
                  </div>

            <div id="container" v-if="modalSelectOptions.length >= 6">
              <span v-if="activeComplexSearch && activeComplexSearch[0]">

              </span>
              <input type="checkbox" id="search-type" class="toggle" name="search-type" value="keyword" @click="changeSearchType($event)" ref="toggle">
              <label for="search-type" class="toggle-container">
                <div>Left Anchored</div>
                <div>Keyword</div>
              </label>
            </div>

                </template>
                <template v-if="preferenceStore.returnValue('--b-edit-complex-use-select-dropdown') === true">
                  <select v-model="modeSelect">
                    <option  v-for="opt in modalSelectOptions">{{opt.label}}</option>
                  </select>
                </template>
                <input class="lookup-input" v-model="searchValueLocal" ref="inputLookup" @keydown="inputKeydown($event)" @keyup="inputKeyup($event)" type="text" :style="`${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()}`" />
                <button @click="forceSearch()">Search</button>

                <!-- REMOVE v-if BEFORE PROD USAGE -->
                <button @click="loadNacoStubModal" style="float: right;" v-if="displayProvisonalNAR() == true">Create NAR</button>

                <hr style="margin-top: 5px;">
                <div>
                    <select size="100" ref="selectOptions" class="modal-entity-select" @change="selectChange($event)"  @keydown="selectNav($event)" :style="`${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()}`">
                      <option v-if="activeComplexSearch.length == 0 && activeComplexSearchInProgress == false && initalSearchState != true">
                        No results found.
                      </option>
                      <option v-if="activeComplexSearchInProgress == true">
                        Searching...
                      </option>

                      <option v-for="(r,idx) in activeComplexSearch" :data-label="r.label" :value="r.uri" v-bind:key="idx" :style="(r.depreciated || r.undifferentiated) ? 'color:red' : isSuppressed(r) ? 'background-color:yellow' : ''" class="complex-lookup-result">  <!-- this.isSuppressed(r) ? 'color:yellow' :  -->
                        {{ generateLabel(r) }}
                        {{ checkFromAuth(r) ? ' (Auth)' : '' }}
                        {{ checkFromRda(r) ? ' [RDA]' : '' }}
                        {{ hasPubDate(r) ? ' [' + hasPubDate(r) + ']' : '' }}
                      </option>

                    </select>
                    <br>

                </div>



              </div>
            </template>
            <template v-else>
              <div class="authority-edit">

                  <h2>Update BCP47 Language</h2>
                  <!-- <input class="bcp-input" type="text" v-model="targetName" /> -->
                  <!-- <div v-for="(row, index) in this.newMarcKeys" :key="index" class="advanced-row"> -->
                  <div v-for="(row, index) in this.marcData" :key="index" class="advanced-row">
                    <!-- {{ row }} -->
                    {{ tag }}{{ indicators }}: <input class="bcp-input"
                      type="text"
                      v-model="row.displayName"
                      @input="handleInput"
                      @click="activeIndex = index"
                      :class="{'active-bcp': this.activeIndex == index}"
                    />

                    <button @click="addBcpRow" class="material-icons bcp-icon">add</button>
                    <button @click="dupeBcpRow(index)" class="material-icons bcp-icon">content_copy</button>
                    <button @click="addDateFromOneXX()" class="material-icons bcp-icon" v-if="oneXXdollarD">date_range</button>
                    <button v-if="index > 0" @click="removeBcpRow(index)" class="material-icons bcp-icon">delete</button>

                  </div>

                  <div class="bcp-selection-table">
                    <table>
                      <thead>
                          <tr>
                              <th>BCP47</th>
                              <th>Language</th>
                              <th>Score</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="(code, idx) of bcpCodes"  @click="addBcpCode(idx); buildNewMarcKey()" :class="{ active: marcData[activeIndex].bcpSelection.includes(idx) }">
                            <td>
                              {{ code["bcp47code"] }}
                            </td>
                            <td>
                              {{ code["name"] }}
                            </td>
                            <td>
                              {{ code["score"] }}
                            </td>
                          </tr>
                      </tbody>
                    </table>
                  </div>

                  <div class="new-value-container">
                    New Value(s):<br></br>
                    <div v-for="row in marcData" class="new-marc-data">{{ row.marcKey }}</div>

                    <template v-if="validationResult.validation">
                      <div v-if="validationResult.validation[0].level == 'ERROR'" class="validation-error">
                        Validation Error: {{ validationResult.validation[0].message }}
                      </div>
                      <div v-else class="validation-success">
                        Validation: {{ validationResult.validation[0].message }}
                      </div>
                    </template>
                  </div>

                <div class="button-container">
                  <label for="refEval">References Evaluated?</label>
                  <input type="checkbox" id="refEval" name="refEval" value="false" v-model="refEval">
                  <br><br>
                  <button @click="submitEdit()">Submit</button>
                  <button @click="hideBCP()">Cancel</button>
                </div>


                <div class="record-comp">
                  <div class="old-data">
                    Original
<pre v-for="data in diffRecord.old" class="record-data">
  {{ data.replace('xmlns:marcxml="http://www.loc.gov/MARC21/slim"', "") }}
</pre>
                  </div>
                  <div class="new-data">
                    Updated
<pre v-for="data in diffRecord.new" class="record-data">
  {{ data.replace('xmlns:marcxml="http://www.loc.gov/MARC21/slim"', "")  }}
</pre>
                  </div>
                </div>

              </div>
            </template>


            <div ref="complexLookupModalDisplay" class="complex-lookup-modal-display" :style="`${this.preferenceStore.styleModalTextColor()};`">

              <template v-if="activeContext !== null && Object.keys(activeContext.extra).length > 0">
                  <h3>
                    <span class="modal-context-icon simptip-position-top" :data-tooltip="'Type: ' + activeContext.extra.rdftypes.includes('Hub') ? 'Hub' : activeContext.extra.rdftypes[0] ">
                      <AuthTypeIcon v-if="activeContext.extra.rdftypes" :type="activeContext.extra.rdftypes.includes('Hub') ? 'Hub' : activeContext.extra.rdftypes[0]">
                      </AuthTypeIcon>
                    </span>
                    {{ activeContext.title }}<br>
                    <span v-if="!activeContext.uri.includes('hubs')" style="margin-left: 2em;">{{ activeContext.uri.split("/").at(-1) }}</span>
                  </h3>
                  <div class="complex-lookup-modal-display-type-buttons">
                    <div>
                        <div class="modal-context-data-title">{{activeContext.extra.rdftypes.includes('Hub') ? 'Hub' : activeContext.extra.rdftypes[0]}}</div>
                        <div v-if="activeContext.depreciated" style="background: pink;">
                          DEPRECATED AUTHORITY
                        </div>
                        <div v-if="activeContext.extra && activeContext.extra.status && activeContext.extra.status == 'suppressed'" style="background: yellow;">
                          SUPPRESSED
                        </div>
                        <div v-if="activeContext.extra.collections && activeContext.extra.collections.includes('http://id.loc.gov/authorities/names/collection_NamesUndifferentiated')" style="background: pink;">
                          THIS 1XX FIELD CANNOT BE USED UNDER RDA UNTIL THIS UNDIFFERENTIATED RECORD HAS BEEN HANDLED FOLLOWING THE GUIDELINES IN <a href="https://www.loc.gov/aba/pcc/rda/PCC%20RDA%20guidelines/Z01%20008%2032%202014rfeb.pdf" target="_blank">DCM Z1 008/32</a>.
                        </div>
                        <template v-if="activeContext.uri.includes('/resources/')">
                          <a style="color:#2c3e50; float: none;    border: none;border-radius: 0;background-color: transparent;font-size: 1em;padding: 0;" v-if="activeContext.type!='Literal Value'" :href="rewriteURI(activeContext.uri, true)" target="_blank" :style="`${this.preferenceStore.styleModalTextColor()}`">view on BFDB</a>
                          <a class="edit-hub" v-if="activeContext.uri.includes('/hubs/') && checkLcOnly()"  :href="editHub(activeContext.uri)" target="_blank">Edit</a>
                          <br />
                        </template>
                        <a style="color:#2c3e50; float: none;    border: none;border-radius: 0;background-color: transparent;font-size: 1em;padding: 0;" v-if="activeContext.type!='Literal Value'" :href="rewriteURI(activeContext.uri)" target="_blank" :style="`${this.preferenceStore.styleModalTextColor()}`">view on ID</a>

                        <br>
                        <a v-if="activeContext.type!='Literal Value'" href="#" @click="fetchAuthXML(activeContext.uri.split('/').at(-1))" :style="`${this.preferenceStore.styleModalTextColor()}`">view MARCXML</a>
                    </div>
                    <div class="complex-lookup-modal-display-buttons">
                      <button @click="$emit('emitComplexValue', activeContext)">Add [Shift+Enter]</button>
                      <button @click=" reset(); $emit('hideComplexModal')">Cancel [ESC]</button>

                    </div>
                  </div>

                    <!-- Dates -->
                    <template v-if="(Object.keys(activeContext.extra).includes('birthdates') && activeContext.extra['birthdates'].length > 0)
                    || (Object.keys(activeContext.extra).includes('deathdates') && activeContext.extra['deathdates'].length > 0)
                    || (Object.keys(activeContext.extra).includes('pubdates') && activeContext.extra['pubdates'].length > 0)">

                      <span class="dates-container" style="padding-bottom: 10px;">
                        <span v-if="activeContext.extra['birthdates'] && activeContext.extra['birthdates'].length > 0 " style="margin-right: 15px;">
                          <span class="modal-context-data-title">Date of Birth: </span>
                          <span>{{ activeContext.extra['birthdates'][0] }}</span>
                        </span>
                        <span v-if="activeContext.extra['deathdates'] && activeContext.extra['deathdates'].length > 0 ">
                          <span class="modal-context-data-title">Date of Death: </span>
                          <span>{{ activeContext.extra['deathdates'][0] }}</span>
                        </span>
                        <span v-if="activeContext.extra['pubdates'] && activeContext.extra['pubdates'].length > 0 ">
                          <span class="modal-context-data-title">Publication Date: </span>
                          <span>{{ activeContext.extra['pubdates'][0] }}</span>
                        </span>
                      </span>
                      <br>
                    </template>
                    <template v-else-if="(Object.keys(activeContext.extra).includes('establishDates') && activeContext.extra['establishDates'].length > 0)
                    || (Object.keys(activeContext.extra).includes('terminateDates') && activeContext.extra['terminateDates'].length > 0)">

                      <span class="dates-container" style="padding-bottom: 10px;">
                        <span v-if="activeContext.extra['establishDates'] && activeContext.extra['establishDates'].length > 0 " style="margin-right: 15px;">
                          <span class="modal-context-data-title">Established: </span>
                          <span>{{ activeContext.extra['establishDates'][0] }}</span>
                        </span>
                        <span v-if="activeContext.extra['terminateDates'] && activeContext.extra['terminateDates'].length > 0 ">
                          <span class="modal-context-data-title">Terminated: </span>
                          <span>{{ activeContext.extra['terminateDates'][0] }}</span>
                        </span>
                      </span>
                      <br>
                    </template>

                    <!-- Labels & Relationships -->
                    <template v-for="key in panelDetailOrder">
                      <div v-if="activeContext.extra[key] && activeContext.extra[key].length>0">
                        <template v-if="activeContext.extra[key] && activeContext.extra[key].length>0 && ['gacs', 'nonlatinLabels', 'notes', 'variantLabels', 'varianttitles', 'contributors', 'relateds', 'sees', 'subjects'].includes(key)">
                          <div class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ? this.labelMap[key] : key }}:</div>
                          <ul :class="['details-list', {'note-data': key == 'notes'}]">
                            <li class="modal-context-data-li" v-if="Array.isArray(activeContext.extra[key])" v-for="(v, idx) in activeContext.extra[key] " v-bind:key="'var' + idx">
                              <span v-if="key !='sees' && key !='relateds'">{{v}}
                                <template v-if="key == 'variantLabels' && !isLatin(v)">
                                  <button class="material-icons variant-edit" @click="edit4XX(activeContext, idx)">edit</button>
                                </template>
                              </span>
                              <div v-else-if="key == 'relateds'">
                                {{v}}<button class="material-icons see-search" @click="searchValueLocal = v">search</button>
                              </div>
                              <div v-else>
                                <a target="_blank" :href="'https://id.loc.gov/authorities/label/'+v">{{v}}</a>
                                <button class="material-icons see-search" @click="searchValueLocal = v">search</button>
                              </div>
                            </li>
                          </ul>
                        </template>
                        <!-- <template v-else-if="key == 'notes' && !activeContext.extra.rdftypes.includes('Name') && !activeContext.extra.rdftypes.includes('Work')">
                          <div class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ? this.labelMap[key] : key }}:</div>
                          <ul>
                            <li class="modal-context-data-li" v-if="Array.isArray(activeContext.extra[key])" v-for="(v, idx) in activeContext.extra[key] " v-bind:key="'var' + idx">
                              <span :class="{unusable: v.includes('CANNOT BE USED UNDER RDA')}">{{ v }}</span>
                            </li>
                          </ul>
                        </template> -->
                        <template v-else-if="['hasEarlierEstablishedForms', 'hasLaterEstablishedForms', 'sources'].includes(key)">
                          <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ? this.labelMap[key] : key }}:</span>
                          <ul>
                            <li class="modal-context-data-li" v-if="Array.isArray(activeContext.extra[key])" v-for="(v, idx) in activeContext.extra[key] " v-bind:key="'var' + idx">
                              {{v}}
                            </li>
                          </ul>
                        </template>
                      </div>
                    </template>

                    <!-- Primary -->
                    <ul class="details-list">
                      <template v-for="key in panelDetailOrder">
                        <template v-if="['birthplaces','locales','activityfields','occupations', 'genres', 'languages'].includes(key) && activeContext.extra[key] && activeContext.extra[key].length>0">
                          <li class="details-details">
                            <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ? this.labelMap[key] : key }}:</span>
                            {{ activeContext.extra[key].join(" ; ")}}
                          </li>
                        </template>
                      </template>
                    </ul>

                    <!-- Secondary -->
                    <template v-for="key in panelDetailOrder">
                      <div v-if="activeContext.extra[key] && activeContext.extra[key].length>0">
                        <template v-if="key != 'sources'">
                          <template v-if="key=='lcclasses'">
                            <span  class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ? this.labelMap[key] : key }}:</span>
                            <ul class="">
                              <li class="" v-if="key=='lcclasses'" v-for="(v, idx) in activeContext.extra['lcclasses']">
                                  <template v-if="v.assigner">({{ v.assigner }}) </template>
                                  <a :href="'https://classweb.org/min/minaret?app=Class&mod=Search&auto=1&table=schedules&table=tables&tid=1&menu=/Menu/&iname=span&ilabel=Class%20number&iterm='+v.code" target="_blank">{{ v.code }}</a>
                                <button class="material-icons see-search add-class" @click="addClassNumber(v.code, idx)" ref="addClass">add</button>
                                <template v-if="v.label">
                                  <span v-if="v.label.split('--').length == 1">
                                    --{{ v.label.split("--").at(-1) }}
                                  </span>
                                  <span v-else :data-tooltip="v.label" class="expandable-class-label simptip-position-bottom">
                                    --{{ v.label.split("--").at(-1) }}<span class="expand material-icons">help</span>
                                  </span>
                                </template>
                              </li>
                            </ul>
                          </template>

                          <template v-else-if="key == 'lcclasss' && activeContext.extra['lcclasses'].length < 1">
                            <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ?
                                this.labelMap[key] : key }}:</span>
                            <ul class="">
                                <li class="" v-if="key == 'lcclasss'" v-for="(v, idx) in activeContext.extra[key]">
                                    <template v-if="typeof v == 'string'">
                                        <a :href="'https://classweb.org/min/minaret?app=Class&mod=Search&auto=1&table=schedules&table=tables&tid=1&menu=/Menu/&iname=span&ilabel=Class%20number&iterm=' + v"
                                            target="_blank">{{ v }}</a>
                                        <button class="material-icons see-search add-class"
                                            ref="addClass"
                                            @click="addClassNumber(v, idx)">add</button>
                                    </template>
                                    <template v-else>
                                        {{ v }}
                                    </template>
                                </li>
                            </ul>
                        </template>

                          <template v-else>
                            <ul>
                            <li class="details-details" v-if='["identifiers","broaders",].includes(key)'>
                              <span class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ? this.labelMap[key] : key }}:</span>
                              {{ activeContext.extra[key].join(" ; ") }}
                            </li>
                          </ul>
                          </template>
                        </template>
                      </div>
                    </template>

                    <!-- Admin -->
                    <div class="admin-fields">
                        <br>
                        <hr>
                        <AccordionList  :open-multiple-items="true">
                          <AccordionItem id="admin-fields" default-closed>
                            <template #summary>
                              <div>Extra Details</div>
                            </template>
                            <template v-for="key in panelDetailOrder">
                              <template v-if='activeContext.extra[key] && activeContext.extra[key].length>0 && ["notes", "collections", "marcKeys", "vernacularMarcKeys", "vernacularLabels", "rdftypes", "lcclasss", "hasRelatedAuthoritys", "useFors"].includes(key)'>
                                <div class="modal-context-data-title">{{ Object.keys(this.labelMap).includes(key) ? this.labelMap[key] : key }}:</div>
                                <ul>
                                  <li class="modal-context-data-li" v-if="Array.isArray(activeContext.extra[key])" v-for="(v, idx) in activeContext.extra[key] " v-bind:key="'var' + idx">
                                    <template v-if="typeof v == 'string' && v.startsWith('http')">
                                      <a target="_blank" :href="v">{{ v.split("/").at(-1).split("_").at(-1) }}</a>
                                    </template>
                                    <template v-else-if="key == 'lcclasss'">
                                      {{ v.code }}
                                    </template>
                                    <template v-else-if="key == 'notes'">
                                      <span :class="{unusable: v.includes('CANNOT BE USED UNDER RDA')}">{{ v }}</span>
                                    </template>
                                    <template v-else>
                                      {{v}}
                                    </template>
                                  </li>
                                  <li class="modal-context-data-li" v-else v-bind:key="'var' + key">{{ activeContext.extra[key] }}</li>
                                </ul>
                              </template>
                            </template>
                          </AccordionItem>
                        </AccordionList>
                    </div>
              </template>

              <template v-else-if="activeContext !== null">
                <h3>
                  {{ Array.isArray(activeContext.title) ? activeContext.title[0] : activeContext.title }}
                  <span v-if="activeContext.literal">[Literal]</span>
                </h3>

                <a style="color:#2c3e50; float: none;    border: none;border-radius: 0;background-color: transparent;font-size: 1em;padding: 0;" v-if="activeContext.type!='Literal Value'" :href="rewriteURI(activeContext.uri)" target="_blank" :style="`${this.preferenceStore.styleModalTextColor()}`">view on id.loc.gov</a>

                <br>

                <div v-if="activeContext.uri">
                  <div class="modal-context-data-title modal-context-data-title-add-gap">MADS Collections:</div>
                  <ul>
                    <li class="modal-context-data-li">
                     <a :href="activeContext.uri" target="_blank">
                      {{ activeContext.uri.split("/").at(-2) }}
                     </a>
                    </li>
                  </ul>
                </div>

                <div class="complex-lookup-modal-display-type-buttons">
                  <div class="complex-lookup-modal-display-type-buttons">
                    <div class="complex-lookup-modal-display-buttons">
                      <button @click="$emit('emitComplexValue', activeContext)">Add [Shift+Enter]</button>
                      <button @click=" reset(); $emit('hideComplexModal')">Cancel [ESC]</button>
                    </div>
                  </div>
                </div>

              </template>




              <div>
<!--                 <div class="load-wraper" style="height: 100px; width: 100px;">
                    <div class="activity" ></div>
                </div>      -->

              </div>
            </div>

          </div>

        </div>



    </VueFinalModal>




</template>

<style>

.pagination-label{
  vertical-align: super;
}

.complex-lookup-modal-container{
  margin-left: auto;
  margin-right: auto;

  width: 95vw;
  height: 95vh;
}

.complex-lookup-modal-content{

}


@media all and (max-width: 1024px) {
  /* CSS rules here for screens lower than 750px */
  .complex-lookup-modal-container{


    width: 99vw;
    height: 95vh;
  }

}


</style>

<style scoped>

  .complex-lookup-modal-display-buttons{
    align-items: center;
    justify-content: center;
  }

  .complex-lookup-modal-display-buttons button{
    font-size: 1em;
    margin-right: 1em;
  }

  .complex-lookup-modal-display-type-buttons{
    display: flex;
  }
  .complex-lookup-modal-display-type-buttons div{
    flex:1;
  }
  .modal-context-data-title{
    font-weight: bold;

  }
  .modal-context-data-title-add-gap{
    margin-top: 1em;
  }
  .modal-context ul{
    margin-top: 0;
    margin-bottom: 0;
  }

  .modal-context-data-li{
    /* list-style: none; */
  }

  h3{
    margin-bottom:.5em;
  }

  .modal-context  h3{
    margin: 0;
    padding: 0;

  }



  .modal-entity-select{
    width: 100%;
    border:none;
    overflow-x: none;
    overflow-y: auto;
    outline:none;
  }

  .complex-lookup-results{
    padding: 0 1em 0 1em;
    height: 73%;
    margin-top: 1.25em;
  }

  .lookup-input{
    width: 100%;
    margin: 3px;
    font-size: 1.5em;
    font-family: Avenir, Helvetica, Arial, sans-serif;
  }

  .toggle-btn-grp div:focus{
    background-color: red;
  }

  .search-mode-radio:focus {
    background-color: red;
    outline: 1px solid black;
  }

  .complex-lookup-modal-container-parts{
    display: flex;
  }
  .complex-lookup-modal-container-parts div{
    flex:1;

  }
  .complex-lookup-modal-search{
    padding-right: 1em;
  }

  .complex-lookup-modal-display{
        overflow-y: auto;
        font-size: 1em;
  }
  label {

    font-size: 0.75em;
    white-space: nowrap;
  }

  .toggle-btn-grp {
    margin: 3px 0;
  }

  .toggle-btn {
    text-align: centre;
    padding: 0.1em 1em;
    color: #000;
    background-color: #FFF;
    border-radius: 10px;
    display: inline-block;
    border: solid 1px #CCC;
    cursor: pointer;
  }

  /* CSS only version */
  .toggle-btn-grp.cssonly * {
    width: 110px;
    height: 30px;
    line-height: 30px;
  }

  .toggle-btn-grp.cssonly div {
    display: inline-block;
    position: relative;
    margin: 5px 2px;
  }

  .toggle-btn-grp.cssonly div label {
    position: absolute;
    z-index: 0;
    padding: 0;
    text-align: center;
  }

  .toggle-btn-grp.cssonly div input {
    position: absolute;
    z-index: 1;
    cursor: pointer;
    opacity: 0;
  }

  .toggle-btn-grp.cssonly div:hover label {
    border: solid 1px #a0d5dc !important;
    background: #f1fdfe;
  }

  .toggle-btn-grp.cssonly div input:checked + label {
    background: lightskyblue;
    border: solid 1px blue !important;
  }

  .complex-lookup-paging {
    display: unset;
    float: right;
    width: auto !important;
	z-index: 1;
  }

  .material-icons.pagination{
    width: auto;
  }

  .off {
    color: #666;
    text-decoration: none;
    cursor: text;
  }

  .icon-chevron-left:before {
    content: "\f053";
  }
  .icon-chevron-right:before {
    content: "\f054";
  }

/* toggle */
/* https://hudecz.medium.com/how-to-create-a-pure-css-toggle-button-2fcc955a8984 */
#container{
	margin-left: 5px;
}

.toggle {
	display: none;
}

.toggle-container {
   position: relative;
   display: grid;
   grid-template-columns: repeat(2, 1fr);
   width: fit-content;
   border: 3px solid lightskyblue;
   border-radius: 20px;
   background: lightskyblue;
   font-weight: bold;
   color: lightskyblue;
   cursor: pointer;
}

.toggle-container::before {
   content: '';
   position: absolute;
   width: 50%;
   height: 100%;
   left: 0%;
   border-radius:20px;
   background: black;
   transition: all 0.3s;
}

.toggle-container div {
   padding: 6px;
   text-align: center;
   z-index: 1;
}

.toggle:checked + .toggle-container::before {
   left: 50%;
}

.toggle:checked + .toggle-container div:first-child{
   color: black;
   transition: color 0.3s;
}
.toggle:checked + .toggle-container div:last-child{
   color: lightskyblue;
   transition: color 0.3s;
}
.toggle + .toggle-container div:first-child{
   color: lightskyblue;
   transition: color 0.3s;
}
.toggle + .toggle-container div:last-child{
   color: black;
   transition: color 0.3s;
}

.menu-buttons{
  right: 20px;
  top: 5px;
  position: absolute;
  z-index: 100000;
}

.option-text {
  text-wrap: wrap;
}

:deep() .highlight-search-string{
  font-weight: bold;
}

.from-rda,
.from-auth {
  font-weight: bold;
}

.unusable {
  color: red;
}

.details-list {
  columns: 3;
  break-inside: avoid;
}
.details-list:has(.details-details){
  margin-top: 10px;
  padding-left: 0px;
  columns: 2;
  break-inside: avoid;
}

.details-details {
  list-style: none;
  break-inside: avoid;
}

.see-search{
  width: 20px;
  height: 20px;
  font-size: x-small;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.expandable-class-label{
  cursor: help;
}

.expand {
  font-size: 14px;
}

.simptip-position-bottom::before,
.simptip-position-bottom::after{
  left: -30% !important;
}

.literal-input {
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-literal-font-size')");
}

.note-data {
  columns: 1;
}

.pub-date {
  font-style: italic;
}

.edit-hub {
  margin-left: 5px;
}

.variant-edit {
  font-size: 12px;
}

/* BCP Stuff */
.authority-edit {
  padding: 8px;
}
.bcp-selection-table {
  height: 250px;
  overflow: scroll;
  display: block;
}


table {
    border-collapse: collapse;
    border: 2px solid rgb(140 140 140);
    font-family: sans-serif;
    font-size: 0.8rem;
    letter-spacing: 1px;

    width: 100%;
    margin-bottom: 15px;
}

th {
    font-weight: bold;
    font-size: 14px;
}

th,
td {
    border: 1px solid rgb(160 160 160);
    padding: 8px 10px;
    text-align: center;
}

.active {
    background-color: rgb(131, 131, 255);
}
.bcp-input{
  width: 75%;
  font-size: 1.3em;
}
.bcp-icon {
  font-size: 14px;
  height: 25px;
  width: 25px;
  margin-left: 5px;
}
.active-bcp{
  border: 5px solid #28cd28;
}

.record-comp {
  /* max-width: 80%; */
  height: 200px;
}

.old-data {
  /* width: 45%; */
  height: 100px;
  /* float: left; */
}

.new-data {
  /* width: 45%; */
  /* margin-left: 5%; */
  height: 200px;
  /* float: right; */
}

.record-data {
  background: whitesmoke;
}

pre {
    /* white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;      */

    overflow: scroll;
    margin-bottom: 5px;
    /* max-width: 80%; */
    line-height: 20px;
}

.new-marc-data{

  width: fit-content;
  padding: 5px;
  border-radius: 25px;
  background-color: whitesmoke;
  margin-bottom: 5px;
}

.validation-error,
.validation-success {
  list-style: none;
  width: fit-content;
  margin-bottom: 5px;
  padding: .75rem 1.25rem;
  border-radius: 25px;
}

.validation-error{
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.validation-success{
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.button-container,
.new-value-container {
  margin-top: 5px;
  background-color: rgb(201, 199, 199);
  padding: 5px;
}

</style>
