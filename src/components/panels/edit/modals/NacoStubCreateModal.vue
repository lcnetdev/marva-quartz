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

        initalHeight: 500,
        initalLeft: 400,


        hubTitle:"",
        hubCreator:{
          label: null,
          marcKey: null,
          uri: null
        },
        hubLang: null,

        langsLookup:[],
        selectedLang: 'na',

        searching: false,

        postStatus: 'unposted',

        newNarUri: null,

        nextInputIsVoyagerModeDiacritics: false,


        disableAddButton: true,

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
        workURI: false,
        statementOfResponsibility: null,

        tmpXML:false,

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

      ...mapWritableState(useProfileStore, ['activeProfile','showNacoStubCreateModal','activeNARStubComponent','lastComplexLookupString']),

      ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse','diacriticPacks']),





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

          this.$refs.nonLatinBulkContent.style.height = newRect.height + 'px'

        },




        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD') {
            event.stopPropagation()
          }
        },

        async buildNacoStub(){


          this.postStatus='posting'

          if (this.workURI.indexOf('id.loc.gov') > -1){
            // lc thing, if we have preprod-XXXX server prfix in staging env.
            this.workURI = 'http://id.loc.gov' + this.workURI.split('id.loc.gov')[1]
          }

          let note = null
          if (this.mainTitleNote.trim().length > 0){
            note = this.mainTitleNote
          }


          let results = await this.profileStore.buildPostNacoStub(this.oneXXParts,this.fourXXParts, this.mainTitle, this.workURI, this.mainTitleDate, this.mainTitleLccn, note)




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

          // console.log(results)

          // if (results && results.postLocation){
          //   results.postLocation = results.postLocation.replace("http://",'https://')
          //




          // }else{
          //   alert("Error posting!")
          //   this.postStatus='error'
          // }




          // console.log(results)


          // this.profileStore.setValueComplex(this.guid, null, this.propertyPath, contextValue.uri, contextValue.title, contextValue.typeFull, contextValue.nodeMap, contextValue.marcKey)



        },

        close(){
          this.activeNARStubComponent = {}
          this.showNacoStubCreateModal=false
          this.postStatus=='unposted'

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
          this.disableAddButton = true
          if (this.oneXX.length<3){ return true}

          if (/#|[^0-9 ]/.test(this.oneXX.slice(3,5))){
            this.oneXXErrors.push("There's an invalid indicator for 1XX")
          }

          if (!/1[0-9]{2}/.test(this.oneXX.slice(0,3))){
            this.oneXXErrors.push(this.oneXX.slice(0,3) + " Invalid Tag")
            return false
          }

          let oneXXParts = this.oneXX.split("$")
          if (oneXXParts.length>0){

            let fieldTag = oneXXParts[0].slice(0,3)

            let indicators = oneXXParts[0].slice(3,5)


            if (indicators.charAt(0) != ' ' && indicators.charAt(0) != '/' && indicators.charAt(0) != '1' && indicators.charAt(0) != '2' && indicators.charAt(0) != '3' && indicators.charAt(0) != '0'){
              this.oneXXErrors.push("Invalid indicator character(s)")
            }
            if (indicators.charAt(1) != ' ' && indicators.charAt(1) != '/' && indicators.charAt(1) != '1' && indicators.charAt(1) != '2' && indicators.charAt(1) != '3' && indicators.charAt(1) != '0'){
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
              dollarKey[subfield] = value

              // console.log(dollarKey)
            }
            dollarKey.fieldTag = fieldTag
            dollarKey.indicators = indicators

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
              this.disableAddButton=false
            }



          }else{

            errors.push("Bad 1XX")
          }

          let count = (this.oneXX.match(/\$a/g) || []).length;
          if (count == 0){
            this.oneXXErrors.push("No Subfield $a entered for 1XX")
          }

          if (!this.mainTitle || !this.mainTitleDate || !this.mainTitleLccn){
            this.disableAddButton = true

          }
          if (this.oneXXErrors.length>0){
            this.disableAddButton = true
          }




        },

        checkFourXX(){
          this.fourXXErrors = []
          this.disableAddButton = true
          if (this.fourXX.length<3){ return true}

          if (/#|[^0-9 ]/.test(this.fourXX.slice(3,5))){
            this.fourXXErrors.push("There's an invalid indicator for 1XX")
          }

          if (!/4[0-9]{2}/.test(this.fourXX.slice(0,3))){
            this.fourXXErrors.push(this.fourXX.slice(0,3) + " invalid tag")
            return false
          }

          let fourXXParts = this.fourXX.split("$")
          if (fourXXParts.length>0){

            let fieldTag = fourXXParts[0].slice(0,3)

            let indicators = fourXXParts[0].slice(3,5)

            if (indicators.charAt(0) != ' ' && indicators.charAt(0) != '/' && indicators.charAt(0) != '1' && indicators.charAt(0) != '2' && indicators.charAt(0) != '3' && indicators.charAt(0) != '0'){
              this.fourXXErrors.push("Invalid indicator character(s)")
            }
            if (indicators.charAt(1) != ' ' && indicators.charAt(1) != '/' && indicators.charAt(1) != '1' && indicators.charAt(1) != '2' && indicators.charAt(1) != '3' && indicators.charAt(1) != '0'){
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
              dollarKey[subfield] = value

            }
            dollarKey.fieldTag = fieldTag
            dollarKey.indicators = indicators

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
              this.disableAddButton=false
            }



          }else{

            errors.push("Bad 4XX")
          }

          let count = (this.fourXX.match(/\$a/g) || []).length;
          if (count == 0){
            this.fourXXErrors.push("No Subfield a entered for 4XX")
          }


          if (!this.mainTitle){
            this.disableAddButton = true
            // this.fourXXErrors.push("You need to add a bf:mainTitle to the work first")
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
            }else{
              this.oneXX = OnexxPart + "$a"
            }
          }
          if (FourxxPart){
            if (this.fourXX.indexOf("$a")>-1){
              this.fourXX = FourxxPart + "$a"+ this.fourXX.split("$a")[1]
            }else{
              this.fourXX = FourxxPart + "$a"

            }
          }




          window.setTimeout(()=>{

            event.target.value = 'home'

          },500)


        },

        async transliterateChange(event){

          if (event.target.value == 'home'){return true}

          let lang = event.target.value.split("-")[0]
          let dir = event.target.value.split("-")[1]


          if (dir == 's2r'){
            let fourXXATrans = JSON.parse(JSON.stringify(this.fourXXParts))
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
              oneXXString = oneXXString + fourXXATrans.indicators
            }

            let subfields = Object.keys(fourXXATrans).filter((v)=>{ return (v.length==1)}).sort()
            for (let field of subfields){
              oneXXString = oneXXString + '$'+field+fourXXATrans[field]
            }

            this.oneXX = oneXXString
          }else{

            let oneXXATrans = JSON.parse(JSON.stringify(this.oneXXParts))
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
              fourXXString = fourXXString + oneXXATrans.indicators
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

          window.setTimeout(()=>{

            event.target.value = 'home'

          },1000)


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





    },


    created(){

       // this.$nextTick(()=>{
        // createNacoStubXML
      // })

      // this.getLangs()

    },


    async mounted() {

      this.tmpXML=false
      this.tmpErrorMessage=false
      this.mainTitle = this.profileStore.nacoStubReturnMainTitle()
      this.mainTitleLccn = this.profileStore.nacoStubReturnLCCN()
      this.mainTitleDate = this.profileStore.nacoStubReturnDate()
      this.statementOfResponsibility = this.profileStore.nacoStubReturnSoR()

      if (this.statementOfResponsibility){
        this.mainTitleNote = "title page (" + this.statementOfResponsibility  + ")"
      }

      this.workURI =  this.profileStore.nacoStubReturnWorkURI()
      // console.log("this.workURIthis.workURIthis.workURI",this.workURI)
      if (!this.mainTitle){
        this.disableAddButton = true
        // this.oneXXErrors.push("You need to add a bf:mainTitle to the work first")
      }
      if (this.lastComplexLookupString.trim() != ''){
        this.oneXX = '1XX##$a'+this.lastComplexLookupString
        this.checkOneXX()

      }


      let current = window.localStorage.getItem('marva-scriptShifterOptions')

      if (current){
        current = JSON.parse(current)
      }else{
        current = {}
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

  }



</script>

<template>


    <VueFinalModal
      display-directive="show"
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"


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
          <div id="non-latin-bulk-content" ref="nonLatinBulkContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

            <div class="menu-buttons">
              <button class="close-button" @pointerup="close">X</button>
            </div>

            <h3 style="margin-bottom: 1em;">Create Provisional NAR</h3>
            <div style="display: flex; margin-bottom: 1em;">
              <div style="flex-grow: 1; position: relative;">
                <button class="paste-from-search simptip-position-left" @click="oneXX = '1XX##$a'+lastComplexLookupString; checkOneXX() " v-if="lastComplexLookupString.trim() != ''" :data-tooltip="'Paste value: ' + lastComplexLookupString"><span class="material-icons">content_paste</span></button>
                <input type="text" ref="hub-title" v-model="oneXX" @input="checkOneXX" @keydown="keydown" @keyup="keyup" class="title" placeholder="1XX##$aDoe, Jane$d19XX-">
              </div>
            </div>
            <div style="display: flex; margin-bottom: 1em;">
              <div style="flex-grow: 1;">
                <button class="paste-from-search simptip-position-left" @click="fourXX = '4XX##$a'+lastComplexLookupString; checkFourXX() " :data-tooltip="'Paste value: ' +lastComplexLookupString" v-if="lastComplexLookupString.trim() != ''"><span class="material-icons">content_paste</span></button>

                <input type="text" ref="hub-title" v-model="fourXX" @input="checkFourXX" class="title" @keydown="keydown" @keyup="keyup" placeholder="4XX##$a....$d....">
              </div>
            </div>

            <div style="display: flex; margin-bottom: 1em;">
              <div style="flex: 1;">
                <select @change="presetChange">
                  <option value="home">Presets</option>
                  <option value="1001 ">"1001 "</option>
                  <option value="1001 and 4001 ">"1001 " &amp; "4001 "</option>
                  <option value="1102 ">"1102 "</option>
                  <option value="1102 and 4102 ">"1102 " &amp; "4102 "</option>
                  <option value="1112 ">"1112 "</option>
                  <option value="1112 and 4112 ">"1112 " &amp; "4112 "</option>

                  

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
              <div>
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
                        <span class="not-unique-text">670 $a Date: Found</span>
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
                </div>

                <template v-if="mainTitle && mainTitleDate && mainTitleLccn">
                  <div style="font-family: monospace; background-color: whitesmoke;">670 $a{{ mainTitle }},{{ mainTitleDate }}{{ (mainTitleNote!='') ? `$b${mainTitleNote}` : '' }}$w(DLC){{ mainTitleLccn }}</div>
                </template>
                <template v-else>
                  <div style="font-family: monospace; background-color: whitesmoke;">Missing 670 Date Field! Can't build 670</div>
                </template>

              </div>


              <!-- <div v-for="e in oneXXErrors"><span class="material-icons warning">warning</span>{{ e }}</div>
              <div v-for="e in fourXXErrors"><span class="material-icons warning">warning</span>{{ e }}</div>


              <template v-if="oneXXResults.length>0 && oneXXResults.length<=5">
                <div v-for="r in oneXXResults" style="margin-bottom: 1em;">
                  <a :href="r.uri" target="_blank">{{ r.name }}</a> <span v-if="r.contributions">({{ r.contributions  }} Contributions)</span>
                </div>
              </template>
              <template v-else-if="oneXXResults.length>0 && oneXXResults.length>5">
               <details style="margin-bottom: 1em;">
                <summary>1XX: There are {{ oneXXResults.length }} hits on that name.</summary>
                <div v-for="r in oneXXResults">
                  <a :href="r.uri" target="_blank">{{ r.name }}</a> <span v-if="r.contributions">({{ r.contributions  }} Contributions)</span>
                </div>
               </details>
              </template>


              <template v-if="fourXXResults.length>0 && fourXXResults.length<=5">
                <div v-for="r in fourXXResults" style="margin-bottom: 1em;">
                  <a :href="r.uri" target="_blank">{{ r.name }}</a> <span v-if="r.contributions">({{ r.contributions  }} Contributions)</span>
                </div>
              </template>
              <template v-else-if="fourXXResults.length>0 && fourXXResults.length>5">
               <details style="margin-bottom: 1em;">
                <summary>4XX: There are {{ fourXXResults.length }} hits on that name.</summary>
                <div v-for="r in fourXXResults">
                  <a :href="r.uri" target="_blank">4ccc{{ r.name }}</a> <span v-if="r.contributions">({{ r.contributions  }} Contributions)</span>
                </div>
               </details>
              </template> -->

            </div>


            <!-- <div v-if="mainTitle">
              <span>Using title for 670:</span> <span style="font-family: monospace; background-color: aliceblue;">{{ mainTitle }}</span>
              <span>{{ mainTitleLccn }}</span>
              <span> {{ mainTitleDate }} </span>
            </div> -->


            <hr>
            <!-- <div v-if="postStatus!='posted'">
              Fill out the 1XX and optional 4XX field using MARC field notation.
            </div> -->

            <div style="display: flex; padding: 1.5em;" v-if="postStatus=='unposted'">
              <div style="flex:1; text-align: center;"><button style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;" @click="buildNacoStub" :disabled="disableAddButton">Generate Stub</button></div>
              <div style="flex:1; text-align: center"><button @click="close" style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;">Cancel</button></div>
            </div>

<!--
            <textarea spellcheck="false" style="width: 100%; min-height: 200px;" v-if="tmpXML">{{ tmpXML }}</textarea>
 -->

            <div style="display: flex; padding: 1.5em; font-size: 1.5em;" v-if="postStatus=='posting'">
              <div >Posting... Please wait...</div>



            </div>

            <textarea spellcheck="false" style="width: 100%; min-height: 200px;" v-if="tmpErrorMessage">{{ tmpErrorMessage }}</textarea>


            <div style="display: flex; padding: 1.5em;" v-if="postStatus=='posted'">
              <div >The Provisional NAR was created! If you would like to see it please click the link, it will open in new tab:</div>
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
  #non-latin-bulk-content{
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
