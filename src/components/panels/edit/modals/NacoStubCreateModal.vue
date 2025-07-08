<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { useProfileStore } from '@/stores/profile'


  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'


  import utilsNetwork from '@/lib/utils_network';


  export default {
    components: {
      VueFinalModal,
      VueDragResize,

    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 200,
        left: 0,

        initalHeight: 650,
        initalLeft: 400,



        searching: false,

        postStatus: 'unposted',

        newNarUri: null,

        nextInputIsVoyagerModeDiacritics: false,



        
        oneXX: '',
        oneXXParts: {},
        oneXXErrors: [],
        oneXXResults: [],
        oneXXResultsTimeout: null,


        // scriptshifterLanguages: {},



        fourXX: '',
        fourXXParts: {},
        fourXXErrors: [],
        fourXXResults: [],
        fourXXResultsTimeout: null,


        mainTitle: null,
        mainTitleLccn: null,
        mainTitleDate: null,
        mainTitleNote: '',
        instanceURI: false,
        statementOfResponsibility: null,
        statementOfResponsibilityOptions: [],

        buildHyphenated4xx: false,
        hyphenated4xx: null,

        zero46: null,

        tmpXML:false,

        MARCXml:false,
        MARCText:false,
        MARClccn:false,

        populatedValue: null,

        showPreview: false,

        showAdvanced: false,

        extraMarcStatements: [],

        add667: false,


        scriptShifterOptions: {},

        tmpErrorMessage:false,

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),
      ...mapStores(useProfileStore),

      ...mapWritableState(useProfileStore, ['activeProfile','showNacoStubCreateModal','activeNARStubComponent','lastComplexLookupString','savedNARModalData']),

      ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse','diacriticPacks']),


      disableAddButton() {

        if (this.oneXXErrors.length > 0 || this.fourXXErrors.length > 0){
          return true
        }
        
        if (this.oneXX.trim() == ''){
          return true
        }

        return false
      }


    },

    watch: {
      // showDebugModal(newVal, oldVal) {
      //   console.log(newVal,oldVal)
      //   // if (newVal === true){
      //   //   this.loadPrefGroup()
      //   // }
      // }
    },

    methods: {

        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.narFieldsContent.style.height = newRect.height + 'px'

        },




        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD') {
            event.stopPropagation()
          }
          if (event.target.classList.contains('selectable')) {
            event.stopPropagation()
          }

        },

        async buildNacoStub(){
          if (this.instanceURI.indexOf('id.loc.gov') > -1){
            // lc thing, if we have preprod-XXXX server prfix in staging env.
            this.instanceURI = 'http://id.loc.gov' + this.instanceURI.split('id.loc.gov')[1]
          }

          let note = null
          if (this.mainTitleNote.trim().length > 0){
            note = this.mainTitleNote
          }
          let additonalFields = []
          if (this.hyphenated4xx && this.buildHyphenated4xx){

            let newField = {
              fieldTag: this.hyphenated4xx.fieldTag,
              indicators: this.hyphenated4xx.indicators
            }
            let counter = 0

            for (let subfield of Object.keys(this.hyphenated4xx)){
              if (subfield.length==1){
                newField[counter++] = [subfield, this.hyphenated4xx[subfield].trim()]
              }
            }

            additonalFields.push(newField)

          }

          // if we are in advanced mode buld the statmenents
          if (this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')){
            additonalFields=[]

            for (let field of this.extraMarcStatements){
              // console.log(field)
              let fieldTag = field.fieldTag
              let indicators = field.indicators.replace(/[#]/g,' ')

              // if they are adding a 046 dont add it automatically
              if (fieldTag == '046'){
                this.zero46 = {}
              }

              let newField = {
                fieldTag: fieldTag,
                indicators: indicators
              }
              let subfields = field.value.split(/[$‡|]/)

              for (let [idx, subfield] of subfields.entries()){
                let subfieldKey = subfield.slice(0,1)
                let value = subfield.slice(1)
                if (value && value.trim().length > 0){
                  // newField[subfieldKey] = value.trim()
                  newField[idx] = [subfieldKey, value.trim()] // use the index to maintain subfield order
                }
              }

              additonalFields.push(newField)
            }
          }


          let advMode = this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')
          // console.log("additonalFields",additonalFields)
          let results = await this.profileStore.buildNacoStub(this.oneXXParts,this.fourXXParts, this.mainTitle, this.instanceURI, this.mainTitleDate, this.mainTitleLccn, note, this.zero46,this.add667, additonalFields, advMode)

          this.MARCXml = results.xml
          this.MARCText = results.text
          this.MARClccn = results.lccn

          this.showPreview = true



        },

        toggleAdvancedNARMode(){
          if (this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')){
            this.preferenceStore.setValue('--b-edit-complex-nar-advanced-mode',false)
            this.extraMarcStatements = []
          }else{
            this.preferenceStore.setValue('--b-edit-complex-nar-advanced-mode',true)
            if (this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')){
              // we are going to add the 670 as an extrMarcStatements
              let f670 = {
                fieldTag: '670',
                indicators: '##',
                value: `$a ${this.mainTitle}, ${this.mainTitleDate}:`
              }
              if (this.mainTitleNote!=''){
                f670.value = f670.value + ` $b ${this.mainTitleNote}`
              }
              if (this.instanceURI){
                f670.u = this.instanceURI
                f670.value = f670.value + ` $u ${this.instanceURI}`
              }
              this.extraMarcStatements.push(f670)
            }

            if (this.add667){
              let f667 = {
                fieldTag: '667',
                indicators: '##',
                value: `$a Non-Latin script references not evaluated.`
              }
              this.extraMarcStatements.push(f667)
            }

            // console.log("extraMarcStatements",this.extraMarcStatements)
            // is there a 046 field already?
            let has046 = this.extraMarcStatements.some(field => field.fieldTag === '046')
            if (!has046) {
            if (this.zero46 !== null){
                let f046 = {
                  fieldTag: '046',
                  indicators: '##',
                  value: ''
                }
                if (this.zero46 && this.zero46.f ){
                  f046.value = `$f ${this.zero46.f}`
                }
                if (this.zero46 && this.zero46.g){              
                  f046.value = f046.value + ` $g ${this.zero46.g}`
                }
                if (f046.value != ''){              
                  f046.value = f046.value + ` $2 edtf`
                }
                this.extraMarcStatements.push(f046)
              }
            }

          }
        },

        resetButton(){



          
          this.oneXX = ''
          this.oneXXParts = {}
          this.oneXXErrors = []
          this.oneXXResults = []
          this.oneXXResultsTimeout = null
          this.fourXX = ''
          this.fourXXParts = {}
          this.fourXXErrors = []
          this.fourXXResults = []
          this.fourXXResultsTimeout = null
          this.mainTitle = null
          this.mainTitleLccn = null
          this.mainTitleDate = null
          this.mainTitleNote = ''
          this.instanceURI = false
          this.statementOfResponsibility = null
          this.statementOfResponsibilityOptions = []
          this.buildHyphenated4xx = false
          this.hyphenated4xx = null
          this.zero46 = null
          this.tmpXML =false
          this.MARCXml =false
          this.MARCText =false
          this.MARClccn =false
          this.populatedValue = null
          this.showPreview = false
          this.extraMarcStatements = []
          this.add667 = false
          this.savedNARModalData = {}
          this.init(true)



        },

        async postNacoStub(){

            this.postStatus='posting'
            let results = await this.profileStore.postNacoStub(this.MARCXml,this.MARClccn)

            results.xml = results.xml.replace(/<marcxml:leader>/g,"\n<marcxml:leader>")
            results.xml = results.xml.replace(/\<\/marcxml:controlfield>/g,"</marcxml:controlfield>\n")
            results.xml = results.xml.replace(/\<\/marcxml:leader>/g,"</marcxml:leader>\n")
            results.xml = results.xml.replace(/\<\/marcxml:datafield>/g,"</marcxml:datafield>\n")
            results.xml = results.xml.replace(/\<\/marcxml:subfield>/g,"</marcxml:subfield>\n")
            this.tmpXML=results.xml
            if (results && results.pubResuts && results.pubResuts.msgObj && results.pubResuts.msgObj.errorMessage){
              this.tmpErrorMessage = results.pubResuts.msgObj.errorMessage
            }
            if (results && results.pubResuts && results.pubResuts.status){
              let type = "http://www.loc.gov/mads/rdf/v1#Name"
              if (this.oneXXParts.fieldTag == "100"){
                type = "http://www.loc.gov/mads/rdf/v1#PersonalName"
              }else if (this.oneXXParts.fieldTag == "110"){
                type = "http://www.loc.gov/mads/rdf/v1#CorporateName"
              }else if (this.oneXXParts.fieldTag == "111"){
                type = "http://www.loc.gov/mads/rdf/v1#ConferenceName"
              }else if (this.oneXXParts.fieldTag == "130"){
                typer = "http://www.loc.gov/mads/rdf/v1#NameTitle"
              }else if (this.oneXXParts.fieldTag == "147"){
                type = "http://www.loc.gov/mads/rdf/v1#ConferenceName"
              }
              let useName = ''
              for (let key in this.oneXXParts){
                if (key.length==1){
                  useName = useName + this.oneXXParts[key] + ' '
                }
              }
              useName=useName.trim()
              // console.log(this.oneXXParts)
              // console.log(useName)
              let newUri = `http://id.loc.gov/authorities/names/n${results.lccn}`
              this.profileStore.setValueComplex(this.activeNARStubComponent.guid, null, this.activeNARStubComponent.propertyPath, newUri, useName, type, {}, this.oneXX)
              // componentGuid, fieldGuid, propertyPath, URI, label, type, nodeMap=null, marcKey=null
              this.newNarUri=results.pubResuts.postLocation
              this.postStatus='posted'
            }

        },

        close(event){


          if (this.postStatus != 'posted'){
            this.savedNARModalData.oneXX = this.oneXX
            this.savedNARModalData.fourXX = this.fourXX
            this.savedNARModalData.mainTitleNote = this.mainTitleNote
          }else{
            this.savedNARModalData = {}
            this.activeNARStubComponent = {}

            this.postStatus=='unposted'
            this.showPreview = false

          }

          this.showNacoStubCreateModal=false




        },

        async searchAuthLabel(authLabel,field){


          this.searching = true

          // clear results
          if (field=='4xx'){
            this.fourXXResults = []
          }else{
            this.oneXXResults = []
          }


          if (!authLabel){
            this.searching = false
            return false
          }else if (authLabel.length<=2){
            this.searching = false
            return false
          }
          let results = await utilsNetwork.loadSimpleLookupKeyword('https://preprod-8080.id.loc.gov/authorities/names',authLabel,true )

          let formatted = []
          for (let key of Object.keys(results)){
            if (key != 'metadata'){
              let toAdd = {name:results[key][0], uri:key}
              // console.log(results.metadata)
              // if they have a contribution count add that as well as more info just for future use
              if (results && results.metadata.values && results.metadata.values[key]&& results.metadata.values[key].contributions){
                toAdd.contributions = results.metadata.values[key].contributions
              }
              if (results && results.metadata.values && results.metadata.values[key]&& results.metadata.values[key].more){
                toAdd.more = results.metadata.values[key].more
              }

              // Dont add name titles
              if(toAdd.more && toAdd.more.rdftypes && toAdd.more.rdftypes.length>0 && toAdd.more.rdftypes.indexOf("NameTitle") >-1 ){
                continue
              }

              formatted.push(toAdd)

            }
          }

          if (field=='4xx'){
            this.fourXXResults = formatted
          }else{
            this.oneXXResults = formatted
          }

          this.searching = false


        },

        checkOneXX(){
          this.oneXXErrors = []
          
          if (this.oneXX.length<3){ return true}

          if (/[^0-9 #]/.test(this.oneXX.slice(3,5))){
            this.oneXXErrors.push("There's an invalid indicator for 1XX")
          }

          if (!/1[0-9]{2}/.test(this.oneXX.slice(0,3))){
            this.oneXXErrors.push(this.oneXX.slice(0,3) + " Invalid Tag")
            return false
          }

          let oneXXParts = this.oneXX.split(/[$‡|]/)
          if (oneXXParts.length>0){

            let fieldTag = oneXXParts[0].slice(0,3)

            let indicators = oneXXParts[0].slice(3,5)


            if (indicators.charAt(0) != ' ' && indicators.charAt(0) != '/' && indicators.charAt(0) != '#' && indicators.charAt(0) != '1' && indicators.charAt(0) != '2' && indicators.charAt(0) != '3' && indicators.charAt(0) != '0'){
              this.oneXXErrors.push("Invalid indicator character(s)")
            }
            if (indicators.charAt(1) != ' ' && indicators.charAt(1) != '/' && indicators.charAt(1) != '#' && indicators.charAt(1) != '1' && indicators.charAt(1) != '2' && indicators.charAt(1) != '3' && indicators.charAt(1) != '0'){
              if (this.oneXXErrors.indexOf("Invalid indicator character(s)") == -1){
                this.oneXXErrors.push("Invalid indicator character(s)")
              }
            }
            this.oneXXParts = {}
            let dollarParts = oneXXParts.slice(1)

            let dollarKey = {}

            for (let dp of dollarParts){

              let subfield = dp.slice(0,1)
              let value = dp.slice(1)
              dollarKey[subfield] = value.trim()

              // console.log(dollarKey)
            }
            dollarKey.fieldTag = fieldTag
            dollarKey.indicators = indicators.replace(/[#]/g,' ')

            this.oneXXParts = dollarKey
            let authLabel = ""
            if (dollarKey.a){
              authLabel = authLabel + dollarKey.a
            }
            if (dollarKey.b){
              authLabel = authLabel + ' ' + dollarKey.b
            }
            if (dollarKey.c){
              authLabel = authLabel + ' ' + dollarKey.c
            }
            if (dollarKey.q){
              authLabel = authLabel + ' ' + dollarKey.q
            }
            if (dollarKey.d){
              authLabel = authLabel + ' ' + dollarKey.d
            }
            if (dollarKey.g){
              authLabel = authLabel + ' ' + dollarKey.g
            }




            if (dollarKey.a){
              window.clearTimeout(this.oneXXResultsTimeout)
              this.oneXXResultsTimeout = window.setTimeout(()=>{
                this.searchAuthLabel(authLabel,'1xx')
              },500)
              
            }

            if (dollarKey.d){         

              let lifeDates  = dollarKey.d.split('-')
              if (lifeDates.length>1 && (fieldTag == '100' || fieldTag == 100)){
                this.zero46 = {}
                this.zero46.f = lifeDates[0]
                if (lifeDates[1].trim().length>0){
                  this.zero46.g = lifeDates[1]
                }

              }
              if (lifeDates.length==1 && (fieldTag == '100' || fieldTag == 100)){
                this.zero46 = {}
                this.zero46.f = lifeDates[0]
              }

            }

            if (dollarKey.a){
              if (/[A-Z][a-z]+\-[A-Z][a-z]+/.test(dollarKey.a)){
              //  console.log("found a hyphenated name")
               if (dollarKey.a.split(',')[0]){
                let hyphenated = dollarKey.a.split(',')[0].split('-')
                // console.log(hyphenated)
                if (hyphenated.length == 2){
                  let newDollarA = `${hyphenated[1]}, ${dollarKey.a.split(',')[1].trim()} ${hyphenated[0]}-`
                  let hyphenated4xx = {}
                  for (let partKey of Object.keys(dollarKey)){
                    hyphenated4xx[partKey] = dollarKey[partKey]
                  }
                  hyphenated4xx.a = newDollarA

                  // turn it into a 4xx
                  hyphenated4xx.fieldTag = hyphenated4xx.fieldTag.split('');
                  hyphenated4xx.fieldTag[0] = '4';
                  hyphenated4xx.fieldTag = hyphenated4xx.fieldTag.join('');
                  let subfields = ""
                  for (let key in hyphenated4xx){
                    if (key.length==1){
                      subfields = subfields + '$'+key+' '+hyphenated4xx[key] + ' '
                    }
                  }
                  hyphenated4xx.preview = `${hyphenated4xx.fieldTag} ${hyphenated4xx.indicators.replace(/\s/g,'#')} ${subfields}`
                  // console.log("hyphenated4xx",hyphenated4xx)
                  this.hyphenated4xx = hyphenated4xx
                  this.buildHyphenated4xx = true

                  if (this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')){
                    // if there isn't a 4xx field already in advanced mode
                    if (this.extraMarcStatements.length > 0){
                      let found4xx = false
                      for (let field of this.extraMarcStatements){
                        if (field.fieldTag.startsWith("4")){
                          found4xx = true
                          break
                        }
                      }
                      if (!found4xx){
                        this.extraMarcStatements.push({
                          fieldTag: hyphenated4xx.fieldTag,
                          indicators: hyphenated4xx.indicators.replace(/\s/g,'#'),
                          value: subfields
                        })
                      }
                    }
                  }
                }



               }



              }


            }





          }else{

            errors.push("Bad 1XX")
          }

          let count = (this.oneXX.match(/\$a/g) || []).length;
          if (count == 0){
            this.oneXXErrors.push("No Subfield $a entered for 1XX")
          }





        },

        checkFourXX(){

          

          this.fourXXErrors = []
          if (this.fourXX.length<3){ return true}          

          if (/[^0-9 #]/.test(this.fourXX.slice(3,5))){
            this.fourXXErrors.push("There's an invalid indicator for 4XX")
          }

          if (!/4[0-9]{2}/.test(this.fourXX.slice(0,3))){
            this.fourXXErrors.push(this.fourXX.slice(0,3) + " invalid tag")
            return false
          }

          let fourXXParts = this.fourXX.split(/[$‡|]/)
          if (fourXXParts.length>0){

            let fieldTag = fourXXParts[0].slice(0,3)

            let indicators = fourXXParts[0].slice(3,5)

            if (indicators.charAt(0) != ' ' && indicators.charAt(0) != '/' && indicators.charAt(0) != '#' && indicators.charAt(0) != '1' && indicators.charAt(0) != '2' && indicators.charAt(0) != '3' && indicators.charAt(0) != '0'){
              this.fourXXErrors.push("Invalid indicator character(s)")
            }
            if (indicators.charAt(1) != ' ' && indicators.charAt(1) != '/' && indicators.charAt(1) != '#' && indicators.charAt(1) != '1' && indicators.charAt(1) != '2' && indicators.charAt(1) != '3' && indicators.charAt(1) != '0'){
              if (this.fourXXErrors.indexOf("Invalid indicator character(s)") == -1){
                this.fourXXErrors.push("Invalid indicator character(s)")
              }
            }
            this.fourXXParts = {}
            let dollarParts = fourXXParts.slice(1)

            let dollarKey = {}

            for (let dp of dollarParts){

              let subfield = dp.slice(0,1)
              let value = dp.slice(1)
              dollarKey[subfield] = value.trim()

            }
            dollarKey.fieldTag = fieldTag
            dollarKey.indicators = indicators.replace(/[#]/g,' ')

            this.fourXXParts = dollarKey
            let authLabel = ""
            if (dollarKey.a){
              authLabel = authLabel + dollarKey.a
            }
            if (dollarKey.b){
              authLabel = authLabel + ' ' + dollarKey.b
            }
            if (dollarKey.c){
              authLabel = authLabel + ' ' + dollarKey.c
            }
            if (dollarKey.q){
              authLabel = authLabel + ' ' + dollarKey.q
            }
            if (dollarKey.d){
              authLabel = authLabel + ' ' + dollarKey.d
            }
            if (dollarKey.g){
              authLabel = authLabel + ' ' + dollarKey.g
            }



            if (dollarKey.a){
              window.clearTimeout(this.fourXXResultsTimeout)
              this.fourXXResultsTimeout = window.setTimeout(()=>{
                this.searchAuthLabel(authLabel,'4xx')
              },500)
              
            }


            if (this.fourXXParts && this.fourXXParts.a){
              if (this.profileStore.isLatin(this.fourXXParts.a) === false){
                this.add667 = true

                // if there isn't a 667 field already in advenced mode
                if (this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode') && this.extraMarcStatements.length > 0){
                  let found667 = false
                  for (let field of this.extraMarcStatements){
                    if (field.fieldTag == '667'){
                      found667 = true
                      break
                    }
                  }
                  if (!found667){
                    this.extraMarcStatements.push({
                      fieldTag: '667',
                      indicators: '##',
                      value: "$a Non-Latin script references not evaluated."
                    })
                  }
                }

              }else if (this.profileStore.isLatin(this.fourXXParts.a) === true){
                this.add667 = false
              }

            }



          }else{

            errors.push("Bad 4XX")
          }

          let count = (this.fourXX.match(/\$a/g) || []).length;
          if (count == 0){
            this.fourXXErrors.push("No Subfield a entered for 4XX")
          }






        },

        addRow(){

          this.extraMarcStatements.push({
            fieldTag: '',
            indicators: '##',
            value: '$a',
            subfields: {
              
            }
          })

          this.$nextTick(()=>{
            document.getElementsByClassName('extra-marc-tag')[document.getElementsByClassName('extra-marc-tag').length-1].focus()
          })

        },

        removeRow(event,row){
          this.extraMarcStatements.splice(row, 1);
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

        keyup(event){

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


          if (event.target.tagName.toLowerCase() === 'textarea') {
            // Reset height to 'auto' to ensure scrollHeight is calculated correctly,
            // allowing the textarea to shrink if content is removed.
            event.target.style.height = 'auto';
            event.target.style.height = (event.target.scrollHeight + 2) + 'px';
          }

        },

        keydown(event){

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


        async presetChange(event){
          if (event.target.value == 'home'){return true}
          let OnexxPart = null
          let FourxxPart = null
          if (event.target.value.indexOf("and")>-1){
            OnexxPart = event.target.value.split("and ")[0]
            FourxxPart = event.target.value.split("and ")[1]
          }else{
            OnexxPart = event.target.value
          }

          if (OnexxPart){
            if (this.oneXX.indexOf("$a")>-1){
              this.oneXX = OnexxPart + "$a"+ this.oneXX.split("$a")[1]
            }else if (this.oneXX.indexOf("‡a")>-1){
              this.oneXX = OnexxPart + "‡a"+ this.oneXX.split("‡a")[1]
            }else{
              this.oneXX = OnexxPart + "$a"
            }
            this.checkOneXX()
          }

          if (FourxxPart){
            if (this.fourXX.indexOf("$a")>-1){
              this.fourXX = FourxxPart + "$a"+ this.fourXX.split("$a")[1]
            }else if (this.fourXX.indexOf("‡a")>-1){
              this.fourXX = FourxxPart + "‡a"+ this.fourXX.split("‡a")[1]
            }else{
              this.fourXX = FourxxPart + "$a"
            }
            this.checkFourXX()
          }





          window.setTimeout(()=>{
            event.target.value = 'home'
          },500)

        },

        async transliterateChange(event){

          let reSetTimer = ()=>{
            window.setTimeout(()=>{
              event.target.value = 'home'
            },1000)
          }

          if (event.target.value == 'home'){return true}

          let lang = event.target.value.split("-")[0]
          let dir = event.target.value.split("-")[1]


          if (dir == 's2r'){
            let fourXXATrans = JSON.parse(JSON.stringify(this.fourXXParts))

            if (!fourXXATrans || !fourXXATrans.a){ reSetTimer(); return false }
            if (fourXXATrans.a && fourXXATrans.a.trim().length==0){ reSetTimer();  return false}

            if (fourXXATrans.a){
              fourXXATrans.a = await utilsNetwork.scriptShifterRequestTrans(lang,fourXXATrans.a,null,dir)
              if (fourXXATrans.a && fourXXATrans.a.output){
                fourXXATrans.a = fourXXATrans.a.output
              }
            }

            let oneXXString = ""
            if (fourXXATrans.fieldTag){
              oneXXString = "1" + fourXXATrans.fieldTag.charAt(1)+ fourXXATrans.fieldTag.charAt(2)
            }
            if (fourXXATrans.indicators){
              oneXXString = oneXXString + fourXXATrans.indicators.replace(/[\s]/g,'#')
            }

            let subfields = Object.keys(fourXXATrans).filter((v)=>{ return (v.length==1)}).sort()
            for (let field of subfields){
              oneXXString = oneXXString + '$'+field+fourXXATrans[field]
            }

            this.oneXX = oneXXString
          }else{

            let oneXXATrans = JSON.parse(JSON.stringify(this.oneXXParts))
            if (oneXXATrans.a && oneXXATrans.a.trim().length==0){
              // Don't do anything, there is nothing to transliterate
              return false
            }

            if (oneXXATrans.a){
              oneXXATrans.a = await utilsNetwork.scriptShifterRequestTrans(lang,oneXXATrans.a,null,dir)
              if (oneXXATrans.a && oneXXATrans.a.output){
                oneXXATrans.a = oneXXATrans.a.output
              }
            }

            let fourXXString = ""
            if (oneXXATrans.fieldTag){
              fourXXString = "4" + oneXXATrans.fieldTag.charAt(1)+ oneXXATrans.fieldTag.charAt(2)
            }
            if (oneXXATrans.indicators){
              fourXXString = fourXXString + oneXXATrans.indicators.replace(/[\s]/g,'#')
            }

            let subfields = Object.keys(oneXXATrans).filter((v)=>{ return (v.length==1)}).sort()
            for (let field of subfields){
              fourXXString = fourXXString + '$'+field+oneXXATrans[field]
            }

            this.fourXX = fourXXString


            this.checkOneXX()
            this.checkFourXX()
          }

          // 400  $a강민, 건$d1990
          // let transValue = await utilsNetwork.scriptShifterRequestTrans(options.lang,fieldValue[0].value,null,options.dir)



          // console.log(event.target.value)
          reSetTimer()



        },


        transliterateOptions(){

          let options = []
          for (let key in this.scriptShifterOptions){



            if (this.scriptShifterOptions[key].s2r){
              let label =  '4xx -> 1xx: '
              let dir='s2r'
              label = label + this.scriptShifterOptions[key].label
              options.push({
                label: label,
                dir: dir,
                key:key
              })

            }

            if (this.scriptShifterOptions[key].r2s){
              let label = '1xx -> 4xx: '
              let dir='r2s'
              label = label + this.scriptShifterOptions[key].label
              options.push({
                label: label,
                dir: dir,
                key:key
              })
            }
          }
          // console.log(options)
          return options

        },


        storeBeforeClosing(){
          // put the onexx and four xx into a var for next time if they havent posted it yet
          if (this.postStatus != 'posted'){
            this.savedNARModalData.oneXX = this.oneXX
            this.savedNARModalData.fourXX = this.fourXX
            this.savedNARModalData.mainTitleNote = this.mainTitleNote
            this.savedNARModalData.extraMarcStatements = this.extraMarcStatements
          }else{
            this.savedNARModalData = {}
          }
        },


        init(resetMode){

          this.tmpXML=false
          this.tmpErrorMessage=false
          this.mainTitle = this.profileStore.nacoStubReturnMainTitle()
          this.mainTitleLccn = this.profileStore.nacoStubReturnLCCN()
          this.mainTitleDate = this.profileStore.nacoStubReturnDate()
          this.statementOfResponsibility = this.profileStore.nacoStubReturnSoR()
          this.statementOfResponsibilityOptions = []
          this.instanceURI =  this.profileStore.nacoStubReturnInstanceURI()



          if (this.statementOfResponsibility){
            this.mainTitleNote = "title page (" + this.statementOfResponsibility  + ")"
          }

          if (this.statementOfResponsibility && this.statementOfResponsibility.split(",").length>1){
            this.statementOfResponsibilityOptions = this.statementOfResponsibility.split(",")
          }

          let addingDefaultExtraMarcStatements = false

          if (this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')){

            if (!this.savedNARModalData.extraMarcStatements){
              // we are going to add the 670 as an extrMarcStatements
              let f670 = {
                fieldTag: '670',
                indicators: '##',
                value: `$a ${this.mainTitle}, ${this.mainTitleDate}:`
              }
              if (this.mainTitleNote!=''){
                f670.value = f670.value + ` $b ${this.mainTitleNote}`
              }
              if (this.instanceURI){
                f670.u = this.instanceURI
                f670.value = f670.value + ` $u ${this.instanceURI}`
              }
              this.extraMarcStatements.push(f670)

              addingDefaultExtraMarcStatements = true

            }else{
              this.extraMarcStatements = this.savedNARModalData.extraMarcStatements
            }

          }

          if (this.savedNARModalData.oneXX){
            this.oneXX = this.savedNARModalData.oneXX
            this.checkOneXX()
          }
          if (this.savedNARModalData.fourXX){
            this.fourXX = this.savedNARModalData.fourXX
            this.checkFourXX()
          }
          if (this.savedNARModalData.mainTitleNote){
            this.mainTitleNote = this.savedNARModalData.mainTitleNote
          }


          if (this.lastComplexLookupString.trim() != ''){
            const yearMatch = this.lastComplexLookupString.match(/(\d{4})/)
            if (yearMatch) {
              // Only insert if not already preceded by $d
              const year = yearMatch[1]
              const idx = this.lastComplexLookupString.indexOf(year)
              if (idx > 0 && !/\$d\s*$/.test(this.lastComplexLookupString.slice(0, idx))) {
                this.lastComplexLookupString =
                  this.lastComplexLookupString.slice(0, idx) +
                  ' $d ' +
                  this.lastComplexLookupString.slice(idx)
              }
            }

            this.oneXX = '1XX##$a'+this.lastComplexLookupString
            this.checkOneXX()
          }


          this.populatedValue = this.profileStore.nacoStubReturnPopulatedValue(this.profileStore.activeNARStubComponent.guid)

          if (this.populatedValue && this.populatedValue.marcKey && !resetMode){

            // we never want 7xx so replace it
            if (this.populatedValue.marcKey.startsWith("7")){
              this.populatedValue.marcKey = this.populatedValue.marcKey.replace("7","1")
            }

            // strip out the $e or $4
            this.populatedValue.marcKey = this.populatedValue.marcKey.split("$e")[0]
            this.populatedValue.marcKey = this.populatedValue.marcKey.split("$4")[0]

            // Make sure the string doesn't end with a comma
            if (this.populatedValue.marcKey.at(-1) == ','){
              this.populatedValue.marcKey = this.populatedValue.marcKey.slice(0, -1)
            }
            this.oneXX = this.populatedValue.marcKey
            this.checkOneXX()
          }

          let current = window.localStorage.getItem('marva-scriptShifterOptions')

          if (current){
            current = JSON.parse(current)
          }else{
            current = {}
          }

          if (this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode') && addingDefaultExtraMarcStatements){

            // add the 046 if this is the first time we are populating the extraMarcStatements
            if (this.zero46 !== null){
              let f046 = {
                fieldTag: '046',
                indicators: '##',
                value: ''
              }
              if (this.zero46 && this.zero46.f ){
                f046.value = `$f ${this.zero46.f}`
              }
              if (this.zero46 && this.zero46.g){              
                f046.value = f046.value + ` $g ${this.zero46.g}`
              }
              if (f046.value != ''){              
                f046.value = f046.value + ` $2 edtf`
              }
              this.extraMarcStatements.push(f046)
            }


          }
            


          // for (let x in this.scriptshifterLanguages){
          //   if (this.scriptshifterLanguages[x].s2r || this.scriptshifterLanguages[x].r2s ){
          //     current[x] = this.scriptshifterLanguages[x]
          //     current[x].name = this.scriptshifterLanguages[x].label
          //     current[x].label = this.scriptshifterLanguages[x].label
          //   }else{
          //     if (current[x]){
          //       delete current[x]
          //     }
          //   }
          // }

          // window.localStorage.setItem('marva-scriptShifterOptions',JSON.stringify(current))
          this.scriptShifterOptions = JSON.parse(JSON.stringify(current))

          // console.log(this.scriptShifterOptions)


        }



    },


    created(){

       // this.$nextTick(()=>{
        // createNacoStubXML
      // })

      // this.getLangs()

    },


    async mounted() {

      this.init()




    }

  }



</script>

<template>


    <VueFinalModal
      display-directive="show"
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"

      @beforeClose="storeBeforeClosing"

    >
        <VueDragResize
          :is-active="true"
          :w="850"
          :h="initalHeight"
          :x="initalLeft"
          :y="50"
          class="debug-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="nar-fields-content" ref="narFieldsContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

            <div class="menu-buttons">
              <button class="close-button" @pointerup="close">X</button>
            </div>

            <template v-if="showPreview == false">

              <div style="display: flex; padding-top: 0.5em;">
                <div style="flex: 1;">
                  <h3 style="margin-bottom: 0.5em;">Create Name Authority Record</h3>
                </div>
                <div style="flex: 1; text-align: right;">
                  <button class="reset-button" @click="resetButton">Reset Form</button>
                </div>
              </div>

              <div style="display: flex; margin-bottom: 1em;">
                <div style="flex-grow: 1; position: relative;">
                  <button class="paste-from-search simptip-position-left" @click="oneXX = '1XX##$a'+lastComplexLookupString; checkOneXX() " v-if="lastComplexLookupString.trim() != ''" :data-tooltip="'Paste value: ' + lastComplexLookupString"><span class="material-icons">content_paste</span></button>
                  <input type="text" ref="nar-1xx" v-model="oneXX" @input="checkOneXX" @keydown="keydown" @keyup="keyup" class="title" placeholder="1XX##$aDoe, Jane$d19XX-">
                  <div v-if="populatedValue && populatedValue.marcKey">
                    (This value was found in the uncontrolled value of this component<span v-if="lastComplexLookupString"> Use your search value: <a href="#" @click.stop.prevent="oneXX = '1XX##$a'+lastComplexLookupString; checkOneXX()">{{ lastComplexLookupString }}</a> instead?</span>)
                  </div>
                </div>
              </div>
              <div v-if="hyphenated4xx && !preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')" style="margin-bottom: 0.75em;">
                <input type="checkbox" id="buildHyphenated4xx" name="buildHyphenated4xx" v-model="buildHyphenated4xx" style="margin-right: 1em;"/>
                <label for="buildHyphenated4xx" style="vertical-align: super;">Add Hyphenated 4XX: <span style="background-color: whitesmoke; font-family: 'Courier New', Courier, monospace;">{{ hyphenated4xx.preview }}</span></label>

              </div>
              <div style="display: flex; margin-bottom: 1em;">
                <div style="flex-grow: 1;">
                  <button class="paste-from-search simptip-position-left" @click="fourXX = '4XX##$a'+lastComplexLookupString; checkFourXX() " :data-tooltip="'Paste value: ' +lastComplexLookupString" v-if="lastComplexLookupString.trim() != ''"><span class="material-icons">content_paste</span></button>

                  <input type="text" ref="nar-4xx" v-model="fourXX" @input="checkFourXX" class="title" @keydown="keydown" @keyup="keyup" placeholder="4XX##$a....$d....">
                </div>
              </div>

              <div style="display: flex; margin-bottom: 1em;">
                <div style="flex: 1;">
                  <select @change="presetChange" class="preset-select">
                    <option class="preset-option" value="home">Presets</option>
                    <option class="preset-option" value="1001#">"1001 "</option>
                    <option class="preset-option" value="1001#and 4001#">"1001 " &amp; "4001 "</option>
                    <option class="preset-option" value="1101#">"1101 "</option>
                    <option class="preset-option" value="1101#and 4101#">"1101 " &amp; "4101 "</option>                    
                    <option class="preset-option" value="1102#">"1102 "</option>
                    <option class="preset-option" value="1102#and 4102#">"1102 " &amp; "4102 "</option>
                    <option class="preset-option" value="1112#">"1112 "</option>
                    <option class="preset-option" value="1112#and 4112#">"1112 " &amp; "4112 "</option>



                  </select>
                </div>
                <div style="flex: 1;">
                  <select @change="transliterateChange">
                  <option value="home">Transliterate</option>
                  <option value="home2" v-if="transliterateOptions().length == 0">You have no Scriptshifter languages set. Use Preferences->Scriptshifter</option>


                  <template v-for="ss in transliterateOptions()">

                    <option :value="ss.key+'-'+ss.dir">{{ ss.label }}</option>
                  </template>



                </select>


                </div>


              </div>






              <div id="error-info">

                <div>
                  <div class="error-info-title">Heading Uniqueness Check:</div>
                  <div class="error-info-display">

                    <template v-if="searching">


                      <div>
                        <span class="material-icons search-in-progress-icon">search</span>
                        <span class="search-in-progress-text">Searching...</span>
                      </div>

                    </template>
                    <template v-else>

                      <div v-if="oneXX.trim().length == 0">
                        <span class="error-info-display-field">Enter 1XX value to search</span>
                      </div>

                      <template v-if="oneXXResults.length>0">
                        <div>
                          <span class="material-icons not-unique-icon">cancel</span>
                          <span class="not-unique-text">1XX Heading FOUND in LCNAF file:</span>
                        </div>
                      </template>


                      <template v-if="oneXXResults.length==0 && oneXXParts && oneXXParts.a && searching==false">
                        <div>
                          <span class="material-icons unique-icon">check</span>
                          <span class="not-unique-text">1XX: Heading NOT found in LCNAF file:</span>
                        </div>
                      </template>

                      <template v-if="oneXXResults.length>0 && oneXXResults.length<=5">
                        <div v-for="r in oneXXResults" style="margin-bottom: 0.25em; padding-left: 2em;">
                          <a :href="r.uri" target="_blank">{{ r.name }}</a> <span v-if="r.contributions">({{ r.contributions  }} Contributions)</span>
                        </div>
                      </template>
                      <template v-else-if="oneXXResults.length>0 && oneXXResults.length>5">
                      <details style="margin-bottom: 1em; padding-left: 2em;">
                        <summary>There are {{ oneXXResults.length }} hits on that name.</summary>
                        <div v-for="r in oneXXResults">
                          <a :href="r.uri" target="_blank">{{ r.name }}</a> <span v-if="r.contributions">({{ r.contributions  }} Contributions)</span>
                        </div>
                      </details>
                      </template>


                      <template v-if="fourXXResults.length>0">
                        <div>
                          <span class="material-icons not-unique-icon">cancel</span>
                          <span class="not-unique-text">4XX Heading FOUND in LCNAF file:</span>
                        </div>
                      </template>


                      <template v-if="fourXXResults.length==0 && fourXXParts && fourXXParts.a && searching==false">
                        <div>
                          <span class="material-icons unique-icon">check</span>
                          <span class="not-unique-text">4XX: Heading NOT found in LCNAF file:</span>
                        </div>
                      </template>

                      <template v-if="fourXXResults.length>0 && fourXXResults.length<=5">
                        <div v-for="r in fourXXResults" style="margin-bottom: 0.25em; padding-left: 2em;">
                          <a :href="r.uri" target="_blank">{{ r.name }}</a> <span v-if="r.contributions">({{ r.contributions  }} Contributions)</span>
                        </div>
                      </template>
                      <template v-else-if="fourXXResults.length>0 && fourXXResults.length>5">
                      <details style="margin-bottom: 1em; padding-left: 2em;">
                        <summary>There are {{ fourXXResults.length }} hits on that name.</summary>
                        <div v-for="r in fourXXResults">
                          <a :href="r.uri" target="_blank">{{ r.name }}</a> <span v-if="r.contributions">({{ r.contributions  }} Contributions)</span>
                        </div>
                      </details>
                      </template>







                    </template>

                    <template v-if="oneXXErrors.length>0">
                      <div v-for="e in oneXXErrors">
                        <div><span class="material-icons warning">warning</span><span class="warning-text">{{ e }}</span></div>
                      </div>
                    </template>
                    <template v-if="fourXXErrors.length>0">
                      <div v-for="e in fourXXErrors">
                        <div><span class="material-icons warning">warning</span><span class="warning-text">{{ e }}</span></div>
                      </div>
                    </template>


                  </div>
                </div>


                <div v-if="!this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')">
                  <div class="error-info-title">Other Checks:</div>


                  <template v-if="mainTitle">
                        <div>
                          <span class="material-icons unique-icon">check</span>
                          <span class="not-unique-text">670 $a: Found</span>
                        </div>
                  </template>
                  <template v-else>
                    <div>
                          <span class="material-icons not-unique-icon">cancel</span>
                          <span class="not-unique-text">670 $a: NOT Found</span><span data-tooltip="Add main title to Work" class="simptip-position-left"><span class="material-icons help-icon">help</span></span>
                        </div>
                  </template>


                  <template v-if="mainTitleDate">
                        <div>
                          <span class="material-icons unique-icon">check</span>
                          <span class="not-unique-text">670 $a Date: <input v-model="mainTitleDate"/></span>
                        </div>
                  </template>
                  <template v-else>
                    <div>
                      <span class="material-icons not-unique-icon">cancel</span>
                      <span class="not-unique-text">670 $a Date: NOT Found</span><span data-tooltip="Add date to Instance Provision Activity" class="simptip-position-left"><span class="material-icons help-icon">help</span></span>
                    </div>
                  </template>


                  <template v-if="mainTitleLccn">
                        <div>
                          <span class="material-icons unique-icon">check</span>
                          <span class="not-unique-text">670 $w: Found</span>
                        </div>
                  </template>
                  <template v-else>
                    <div>
                          <span class="material-icons not-unique-icon">cancel</span>
                          <span class="not-unique-text">670 $w: NOT Found</span> <span data-tooltip="Add LCCN to Instance" class="simptip-position-left"><span class="material-icons help-icon">help</span></span>
                        </div>
                  </template>

                  <div style="white-space: nowrap; display: inline-block; width: 80%">
                    <span class="material-icons edit-icon">edit</span>
                    <label>670 $b: </label>
                    <input placeholder="(optional)" v-model="mainTitleNote" @keydown="keydown" @keyup="keyup" style="width:100%; margin-bottom:0.25em"/>

                    <template v-if="statementOfResponsibilityOptions && statementOfResponsibilityOptions.length>0">
                      <div style="padding: 0.2em;">
                        Multi SOR found:
                        <template v-for="(sor, index) in statementOfResponsibilityOptions">
                          <button style="font-size: 0.75em;" @click="mainTitleNote = 'title page (' + sor.trim() + ')'">{{ sor }}</button>
                        </template>
                      </div>

                    </template>
                  </div>

                  <template v-if="mainTitle && mainTitleDate && mainTitleLccn">
                    <div class="selectable" style="font-family: monospace; background-color: whitesmoke; padding: 0.2em;">670 $a{{ mainTitle }},{{ mainTitleDate }}: {{ (mainTitleNote!='') ? `$b${mainTitleNote}` : '' }}</div>
                  </template>
                  <template v-else>
                    <div class="selectable" style="font-family: monospace; background-color: whitesmoke; padding: 0.2em;">Missing 670 Date Field! Can't build 670</div>
                  </template>

                  <template v-if="zero46 && Object.keys(zero46).length>0">
                    <div class="selectable" style="font-family: monospace; background-color: whitesmoke; padding: 0.2em;">046  {{ (zero46.f) ? ("$f" + zero46.f) : "" }}{{ (zero46.g) ? ("$g" + zero46.g) : "" }}$2edtf</div>
                  </template>

                  <div class="selectable" style="font-family: monospace; padding: 0.2em;">

                    <input type="checkbox" v-model="add667" id="add-667"/>
                    <label for="add-667" style="vertical-align: super; padding-left: 1em;">Add 667 Note</label>

                  </div>




                </div>


              </div>

              <div v-if="this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')">
                <hr/>
                <!-- <details>
                  <summary>Help</summary>
                  Advanced mode allows you to add arbitrary MARC fields to the NAR. If you
                </details> -->
                <div>
                  <div v-for="(row, index) in this.extraMarcStatements" :key="index" class="advanced-row">
                    <input
                      type="text"
                      v-model="row.fieldTag"
                      maxlength="3"
                      placeholder="TAG"
                      class="extra-marc-tag"
                      style="margin-right: 1em; width: 50px;"
                    />
                    <input
                      type="text"
                      v-model="row.indicators"
                      maxlength="2"
                      placeholder="IND"
                      style="margin-right: 1em; width: 40px; font-family: 'Courier New', Courier, monospace;"
                    />

                    <textarea
                     v-model="row.value"
                      placeholder="$a xyz $b abc..."
                      style="margin-right: 1em; flex-grow: 1;"
                      @keydown="keydown" @keyup="keyup"
                    ></textarea>
                    


                    <button v-if="extraMarcStatements.length-1 != index" @click="removeRow($event,index)"  style="margin-left: 0.1em;" data-tooltip="Remove Row" class="simptip-position-left" > - </button>
                    <button v-if="extraMarcStatements.length-1 == index" @click="addRow" style="margin-left: 1em;">Add Row</button>
                  </div>
                </div>


              </div>

              <button @click="toggleAdvancedNARMode">
                <span v-if="!this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')">Use advanced NAR mode</span>
                <span v-if="this.preferenceStore.returnValue('--b-edit-complex-nar-advanced-mode')">Use regular mode</span>
              </button>

            </template>


            <template v-if="showPreview==true">

              <textarea class="preview" disabled>
                {{ MARCText }}
              </textarea>


            </template>



            <hr>

            <div v-if="populatedValue && populatedValue.marcKey && !populatedValue.URI" style="text-align: center;">
                    Adding this NAR will replace the uncontrolled value in this component.
            </div>
            <div v-if="populatedValue && populatedValue.marcKey && populatedValue.URI" style="text-align: center;">
                    WARNING: Adding this NAR will overwrite the controlled value already in this component.
            </div>


            <div style="display: flex; padding: 1.5em;" v-if="postStatus=='unposted' && showPreview == false">
              <div style="flex:1; text-align: center;"><button style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;" @click="buildNacoStub" :disabled="disableAddButton">Preview NAR</button></div>
              <div style="flex:1; text-align: center"><button @click="close" style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;">Cancel</button></div>
            </div>

            <div style="display: flex; padding: 1.5em;" v-if="postStatus=='unposted' && showPreview == true">
              <div style="flex:1; text-align: center;"><button class="post-nar-button" style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;" @click="postNacoStub" :disabled="disableAddButton">Post NAR</button></div>
              <div style="flex:1; text-align: center"><button @click="showPreview=false" style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;">Go Back</button></div>
            </div>


            <div style="display: flex; padding: 1.5em; font-size: 1.5em;" v-if="postStatus=='posting'">
              <div >Posting... Please wait...</div>
            </div>

            <textarea spellcheck="false" style="width: 100%; min-height: 200px;" v-if="tmpErrorMessage">{{ tmpErrorMessage }}</textarea>


            <div style="display: flex; padding: 0 1.5em 1.5em 1.5em;" v-if="postStatus=='posted'">
              <div >The NAR was created! If you would like to see it please click the link, it will open in new tab:</div>
              <div><a :href="newNarUri" target="_blank">{{ newNarUri }}</a></div>
            </div>
            <div v-if="postStatus=='posted'" style="text-align: center;">
              <button @click="close" style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;">Close</button>

            </div>


          </div>


        </VueDragResize>
    </VueFinalModal>




</template>
<style>


  .content-container{

    background-color: white;
  }

</style>

<style scoped>

.advanced-row{
  display: flex; align-items: center; margin-bottom: 0.5em;

}
.advanced-row input{
  font-family: monospace;
  font-size: 1.1em;
}
.post-nar-button{
  -webkit-box-shadow:0px 0px 53px 4px rgba(46,255,53,0.9);
  -moz-box-shadow: 0px 0px 53px 4px rgba(46,255,53,0.9);
  box-shadow: 0px 0px 53px 4px rgba(46,255,53,0.9);

}
.preview{
  background-color: whitesmoke;
  min-height: 350px;
  width: 100% !important;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1em;
}

.preset-select, .preset-option{
 font-family: monospace;
}

.paste-from-search{
  position: absolute;
  right: 2px;
  top:2px;
  z-index: 1000;
  padding: 0;

}

.paste-from-search .material-icons{
  font-size: 19px;

}

  #error-info{
    clear: both;
    display: flex;
    padding-top: 1em;
  }
  #error-info div{
    flex: 1;
  }
  .error-info-title{
    font-weight: bold;
  }
  .error-info-display{
    padding-left: 0.5em;
    padding-top: 0.25em;
  }
  .error-info-display-field{
    font-family: monospace;
    background-color: whitesmoke;

  }

  hr{
    margin-top: 2em;
    margin-bottom: 2em;
  }
select{
  font-size: 1.35em;
}

  .warning{
    padding-right: 5px;
    color:orangered;
    font-size: 20px;
  }
  .warning-text{
    vertical-align: bottom;
  }

  .creator-label{
    background-color: whitesmoke;
    font-family: monospace;
    padding: 0.2em;
    margin-right: 0.2em;
  }

  .title{
    font-size: 1.35em;
    font-family: monospace;
    width:100%;
  }
  .title-button{
    margin-left: 1em;
  }
  .title-button-copy{
    vertical-align: super;
  }

  .checkbox-option{
    width: 20px;
    height: 20px;
  }

  input[type=checkbox]{
    width: 25px;
    height: 25px;
  }
  input{
    font-family: monospace;
  }

  .help-icon{
    font-size: 20px;
  }


  .option{
    display: flex;
  }
  .option-title{
    flex:2;
  }
  .option-title-header{
    font-weight: bold;
  }
  .option-title-desc{
    font-size: 0.8em;
    color:gray;
  }
  #nar-fields-content{
    padding: 1em;

    overflow-y: scroll;

  }
  .menu-buttons{
    margin-bottom: 2em;
    position: relative;
  }
  .close-button{
    position: absolute;
    right: 5px;
    top: 5px;
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
  }

  .disable-voyager-container{
    margin-top: 1em;
    margin-bottom: 1em;
    display: flex;
    align-items: center;
  }


  .disable-voyager-container div{
    flex: 1;
  }
  .disable-voyager-container-check{
    flex: 0 !important;
    padding-right: 1em;
  }

  .search-in-progress-icon{
    animation: grow 1s infinite;
  }
  .search-in-progress-text{
    vertical-align: super;
  }

  .not-unique-icon{
    color: red;
    font-size: 20px;
    padding-right: 5px;
  }
  .not-unique-text{
    vertical-align: super;
  }

  .unique-icon{
    color: green;
    font-size: 20px;
    padding-right: 5px;
  }

  .edit-icon {
    color: black;
    font-size: 20px;
    padding-right: 5px;
  }


  @keyframes grow {
    0% { transform: scale(1); }
    50% { transform: scale(2); color: blue }
    100% { transform: scale(1); }
  }


</style>