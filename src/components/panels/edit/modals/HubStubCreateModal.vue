<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { useProfileStore } from '@/stores/profile'
  import ComplexLookupModal from "@/components/panels/edit/modals/ComplexLookupModal.vue";
  import LiteralLang from "@/components/panels/edit/modals/LiteralLang.vue";

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'


  import utilsNetwork from '@/lib/utils_network';


  export default {
    components: {
      VueFinalModal,
      VueDragResize,
      ComplexLookupModal,
      LiteralLang
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,

        initalHeight: 700,
        initalLeft: 400,


        hubTitle:"",
        hubTitleVariant:"",
        hubTitleVariantLang:null,

        hubCreator:{
          label: null,
          marcKey: null,
          uri: null
        },
        hubLang: "",


        langsLookup:[],
        selectedLang: 'na',

        displayModal:false,

        postStatus: 'unposted',

        newHubUrl: null,

        showLitLangModal: false,
        useLang: null,

        scriptShifterOptions: {}

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),
      ...mapStores(useProfileStore),
      ...mapState(useConfigStore, ['scriptShifterLangCodes', 'lccFeatureProperties']),

      ...mapWritableState(useProfileStore, ['activeProfile','showHubStubCreateModal','activeHubStubData','activeHubStubComponent','literalLangInfo', 'savedHubModalData']),

      ...mapWritableState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse','diacriticPacks']),





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

        resetButton(){
          
          this.hubTitle = ""
          this.hubTitleVariant = ""
          this.hubTitleVariantLang = null
          this.hubLang = ""
          this.hubCreator = {
            label: null,
            marcKey: null,
            uri: null
          }

        },

        transliterateOptions(){

        let options = []
        for (let key in this.scriptShifterOptions){



          if (this.scriptShifterOptions[key].s2r){
            let label =  'Variant -> Main: '
            let dir='s2r'
            label = label + this.scriptShifterOptions[key].label
            options.push({
              label: label,
              dir: dir,
              key:key
            })

          }

          if (this.scriptShifterOptions[key].r2s){
            let label = 'Main -> Variant: '
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

        async transliterateChange(event){

          if (event.target.value == 'home'){return true}

          let lang = event.target.value.split("-")[0]
          let dir = event.target.value.split("-")[1]


          if (dir == 's2r'){

            let response = await utilsNetwork.scriptShifterRequestTrans(lang,this.hubTitleVariant,null,dir)
            if (response && response.output){
              this.hubTitle = response.output
            }
          }else{
            let response =  await utilsNetwork.scriptShifterRequestTrans(lang,this.hubTitle,null,dir)
            if (response && response.output){
              this.hubTitleVariant = response.output
            }
          }

          let toLang = null
          let fromLang = null
          if (this.scriptShifterLangCodes[lang]){
            fromLang = this.scriptShifterLangCodes[lang].code
            toLang = this.scriptShifterLangCodes[lang].code.split("-")[0] + "-Latn"
            if (dir == 'r2s'){
              toLang = this.scriptShifterLangCodes[lang].code
              fromLang = this.scriptShifterLangCodes[lang].code.split("-")[0] + "-Latn"
            }

          }

          if (dir == 's2r'){
            // variant title to main title, set the varaint title to fromlang
            this.hubTitleVariantLang = fromLang
          }else{
            this.hubTitleVariantLang = toLang
          }

          // console.log("toLang",toLang)
          // console.log("fromLang",fromLang)


          // 400  $a강민, 건$d1990
          // let transValue = await utilsNetwork.scriptShifterRequestTrans(options.lang,fieldValue[0].value,null,options.dir)

          // console.log(event.target.value)

          window.setTimeout(()=>{
            event.target.value = 'home'
          },1000)


          },






        setVariantLang(){


          this.literalLangInfo={
            propertyPath: false,
            componentGuid: false,
            values: [
              {
                '@language':null,
                value: this.hubTitleVariant,
                '@guid':'fake',
              }
            ]
          }

          this.showLitLangModal=true



        },

        setVariantLangReturn(value){
          this.hubTitleVariantLang = value
          console.log(value,value,value,value,value)
          this.showLitLangModal=false

        },

        useWorkCreator(){

          if (this.activeHubStubData && this.activeHubStubData.contributors && this.activeHubStubData.contributors[0]){
            let c = this.activeHubStubData.contributors[0]

            this.hubCreator.label = c.label
            if (c['http://id.loc.gov/ontologies/bflc/marcKey'] && c['http://id.loc.gov/ontologies/bflc/marcKey'][0]&& c['http://id.loc.gov/ontologies/bflc/marcKey'][0]['http://id.loc.gov/ontologies/bflc/marcKey']){
              this.hubCreator.marcKey = c['http://id.loc.gov/ontologies/bflc/marcKey'][0]['http://id.loc.gov/ontologies/bflc/marcKey']
            }
            this.hubCreator.uri = c['@id']
            this.hubCreator.typeFull = c['@type']

          }

        },

        setPContributor(value){


          this.displayModal=false

          this.hubCreator.label = null
          this.hubCreator.marcKey = null
          this.hubCreator.uri = null
          this.hubCreator.typeFull = null



          if (value.title){
            if (Array.isArray(value.title)){
              this.hubCreator.label = value.title.filter((v)=> {return (!v['@language'])})[0]
              if (typeof this.hubCreator.label == 'object' && this.hubCreator.label['@value']){
                this.hubCreator.label = this.hubCreator.label['@value']
              }
            }else{
              this.hubCreator.label = value.title
            }
          }

          if (value.marcKey){
            if (Array.isArray(value.marcKey)){
              this.hubCreator.marcKey = value.marcKey.filter((v)=> {return (!v['@language'])})[0]
              if (typeof this.hubCreator.marcKey == 'object' && this.hubCreator.marcKey['@value']){
                this.hubCreator.marcKey = this.hubCreator.marcKey['@value']
              }

            }else{
              this.hubCreator.marcKey = value.marcKey
            }
          }

          if (value.typeFull){
            if (Array.isArray(value.typeFull)){
              this.hubCreator.typeFull = value.typeFull.filter((v)=> {return (!v['@language'])})[0]
              if (typeof this.hubCreator.typeFull == 'object' && this.hubCreator.typeFull['@value']){
                this.hubCreator.typeFull = this.hubCreator.typeFull['@value']
              }

            }else{
              this.hubCreator.typeFull = value.typeFull
            }
          }else{


            if (value.extra && value.extra.rdftypes && value.extra.rdftypes[0] ){
              if (value.extra.rdftypes[0].indexOf("http")==-1){
                this.hubCreator.typeFull = "http://www.loc.gov/mads/rdf/v1#" + value.extra.rdftypes[0]
              }else{
                this.hubCreator.typeFull = value.extra.rdftypes[0]
              }
            }
          }

          this.hubCreator.uri = value.uri





        },






        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD') {
            event.stopPropagation()
          }
        },

        async buildHub(){


          let langObj
          if (this.hubLang && this.hubLang != ""){
            langObj = {
              uri: this.hubLang,
              label:    this.langsLookup.filter((v)=> { return (v.uri == this.hubLang)  } )[0].label
            }

            // if there is (eng) code in the label
            if (langObj.label){
              langObj.label = langObj.label .split('(')[0].trim()
            }

          }else{
            langObj = null
          }

          this.postStatus='posting'
          let results = await this.profileStore.buildPostHubStub(this.hubCreator,this.hubTitle,this.hubTitleVariant,this.hubTitleVariantLang,langObj,this.preferenceStore.catCode)

          if (results && results.postLocation){


            let extra = {
              collections: [],
              genres: [],
              rdftypes: ['Work', 'Hub'],
              subjects: [],
            }

            results.postLocation = results.postLocation.replace("http://",'https://')

            let hubUri = results.postLocation.replace(/https:\/\/preprod[-0-9]*\.id/i,'http://id')
            hubUri = hubUri.replace(/http:\/\/preprod[-0-9]*\.id/i,'http://id')

            // we need to ask for the MARCKey from ID since we don't know it locally

            let MARCKey = await utilsNetwork.returnMARCKey(results.postLocation)


            if (!MARCKey){
              alert("Could not retrieve MARC Key for Hub: " + hubUri )
            }

            if (MARCKey && MARCKey.marcKey){
              MARCKey = MARCKey.marcKey
            }

            // if we are adding a hub to a subject field build the component and send it off to the setValueSubject instead
            // you are able to add hubs as complex values in other fields, subject is just a special case we don't want to add it this way
            if (this.activeHubStubComponent.propertyPath[0].propertyURI === "http://id.loc.gov/ontologies/bibframe/subject"){
              this.profileStore.setValueSubject(
                this.activeHubStubComponent.guid,
                  // make a component
                  [
                    {
                        "label": this.hubTitle,
                        "uri": hubUri,
                        "id": 0,
                        "type": "http://id.loc.gov/ontologies/bibframe/Hub",
                        "complex": false,
                        "literal": false,
                        "marcKey": MARCKey
                    }
                  ],
                  // fake the path to make the subject as we need it to be
                  [
                      {
                          "level": 0,
                          "propertyURI": "http://id.loc.gov/ontologies/bibframe/subject"
                      },
                      {
                          "level": 1,
                          "propertyURI": "http://www.loc.gov/mads/rdf/v1#componentList"
                      },
                      {
                          "level": 2,
                          "propertyURI": "http://www.loc.gov/mads/rdf/v1#Topic"
                      }
                  ]
              )

            }else{

              // add it as normal
              this.profileStore.setValueComplex(this.activeHubStubComponent.guid, null, this.activeHubStubComponent.propertyPath, hubUri, this.hubTitle, 'Hub', extra, MARCKey)



            }






            this.newHubUrl=results.postLocation


            this.postStatus='posted'

          }else{
            alert("Error posting!")
            this.postStatus='error'
          }




          // console.log(results)


          // this.profileStore.setValueComplex(this.guid, null, this.propertyPath, contextValue.uri, contextValue.title, contextValue.typeFull, contextValue.nodeMap, contextValue.marcKey)



        },

        close(){

          if (this.postStatus == 'posted'){
            this.postStatus=='unposed'
            this.savedHubModalData={}
          }else{

            // save the data
            this.savedHubModalData = {
              hubTitle: this.hubTitle,
              hubTitleVariant: this.hubTitleVariant,
              hubTitleVariantLang: this.hubTitleVariantLang,
              hubCreator: this.hubCreator,
              hubLang: this.hubLang
            }

          }

          this.activeHubStubComponent = {}
          this.activeHubStubData = {}
          this.showHubStubCreateModal=false


          
        



        },



        // diacritic intergration

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

        checkBeforeClosing(event){
          
          this.close()
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

      createPreview: function(){
        let preview = ""
        let creator = false
        let title = false
        let lang = false

        if (this.hubCreator.label){
          creator = this.hubCreator.label
        }

        if (this.hubTitle){
          title = this.hubTitle
        }

        if (this.hubLang){
          try{
            lang = this.langsLookup.filter(ll => ll.uri == this.hubLang)[0].label.replace(/ \(.*\)/, "")
          } catch {
            lang = false
          }
        }

        if (creator && title){
          preview = creator + ". " + title
        } else if (title){
          preview = title
        }
        if (lang){
          preview = preview + ". " + lang
        }

        return preview
        // {{ hubCreator.label }}. {{ hubTitle }}. {{ langsLookup.filter(ll => ll.uri == hubLang)[0].label.replace(/ \(.*\)/, "") }}.
      },




    },


    created(){

       // this.$nextTick(()=>{

      // })

    },

    async mounted() {

      this.useLang = null
      this.hubTitleVariantLang = null

      // ask for the url to use from the active profile for the bf:language property then request it and load the results
      let useLookupUrl = this.profileStore.returnProfileLookupUrl("bf:language")
      let langs = await utilsNetwork.loadSimpleLookup(useLookupUrl)
      this.langsLookup=[]
      for (let langUri in langs){
        if (langUri != 'metadata'){
          this.langsLookup.push({
            uri:langUri,
            label:langs[langUri][0]
          })
        }
      }

      this.langsLookup.sort((a,b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0))

      if (this.savedHubModalData && this.savedHubModalData.hubTitle){
        this.hubTitle = this.savedHubModalData.hubTitle
      }
      if (this.savedHubModalData && this.savedHubModalData.hubTitleVariant){
        this.hubTitleVariant = this.savedHubModalData.hubTitleVariant
      } 
      if (this.savedHubModalData && this.savedHubModalData.hubTitleVariantLang){
        this.hubTitleVariantLang = this.savedHubModalData.hubTitleVariantLang
      }
      if (this.savedHubModalData && this.savedHubModalData.hubLang){
        this.hubLang = this.savedHubModalData.hubLang
      } 
      if (this.savedHubModalData && this.savedHubModalData.hubCreator){
        this.hubCreator = this.savedHubModalData.hubCreator
      }


      

      this.$nextTick(()=>{

        this.$refs['hub-title'].focus()
        this.$refs['hub-title'].focus()
      })



      let current = window.localStorage.getItem('marva-scriptShifterOptions')
      if (current){
        current = JSON.parse(current)
      }else{
        current = {}
      }
      this.scriptShifterOptions = JSON.parse(JSON.stringify(current))




    }
  }



</script>

<template>


    <VueFinalModal
      display-directive="show"
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"

      @beforeClose="checkBeforeClosing"


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

            <div style="display: flex; padding-top: 0.5em; padding-bottom: 0.5em;">
              <div style="flex: 1;">
                <h3 style="margin-bottom: 0.5em;">Create Quick Hub</h3>
              </div>
              <div style="flex: 1; text-align: right;">
                <button class="reset-button" @click="resetButton">Reset Form</button>
              </div>
            </div>            

            <div style="margin-bottom: 1em;">
              <span class="creator-label" v-if="!hubCreator.label">[No Hub Creator]</span>
              <span class="creator-label" v-if="hubCreator.label">{{hubCreator.label  }}</span>
              <button @click="displayModal=true" style="line-height: 1.75em;" v-if="!hubCreator.label">Select Creator</button>
              <button @click="hubCreator.label=null;hubCreator.uri=null;hubCreator.marcKey=null;" style="line-height: 1.75em;" v-if="hubCreator.label">Remove</button>

              <button v-if="!hubCreator.label && activeHubStubData && activeHubStubData.contributors && activeHubStubData.contributors[0]" class="title-button" @click="useWorkCreator()" style="vertical-align: bottom"><span class="material-icons" style="font-size: 20px;">arrow_back</span><span class="title-button-copy">Use Work Creator</span></button>

              <template v-if="displayModal">
                <ComplexLookupModal ref="complexLookupModal" :searchValue="''" :authorityLookup="''" @emitComplexValue="setPContributor" @hideComplexModal="searchValue='';displayModal=false;" :structure="{valueConstraint:{useValuesFrom:['http://preprod.id.loc.gov/authorities/names']}}" v-model="displayModal"/>
              </template>
            </div>

            <div style="display: flex; margin-bottom: 1em;">
              <div style="flex-grow: 1;">
                <input type="text" ref="hub-title" v-model="hubTitle" class="title" placeholder="Hub Title" @keydown="keydown" @keyup="keyup">
              </div>
              <div style="flex-shrink: 1;">
               <button v-if="activeHubStubData && activeHubStubData.title" class="title-button" @click="hubTitle=activeHubStubData.title"><span class="material-icons" style="font-size: 20px;">arrow_back</span><span class="title-button-copy">Use Work Title</span></button>

              </div>
              <template v-if="activeHubStubData && activeHubStubData.title && activeHubStubData.title.trim() != ''">
              </template>
            </div>

            <div style="clear: both;">
              <div style="float: right;">

                <select  @change="transliterateChange" style="font-size: 0.9em;">
                  <option value="home">Transliterate</option>
                  <template v-for="ss in transliterateOptions()">

                    <option :value="ss.key+'-'+ss.dir">{{ ss.label }}</option>
                  </template>



                </select>
              </div>
            </div>


            <div style="display: flex; margin-bottom: 1em; clear: both; padding-top: 1em;">
              <div style="flex-grow: 1;">
                <input type="text" ref="hub-title-variant" v-model="hubTitleVariant" class="title" placeholder="Hub Variant Title" @keydown="keydown" @keyup="keyup">
              </div>
              <div style="flex-shrink: 1;">
                <button style="height: 29px;" @click="setVariantLang">{{ (hubTitleVariantLang) ? '@' + hubTitleVariantLang : 'Set Lang'}}</button>

                <template v-if="showLitLangModal">
                  <LiteralLang v-model="showLitLangModal" @langStrSet="setVariantLangReturn"/>

                </template>
              </div>
            </div>

            <p>If this is a translation, set the language.</p>
            <select v-model="hubLang" >
              <option value="" disabled selected>Select Language</option>
              <option value="na">No Hub Language Selected</option>
              <option v-for="l in langsLookup" :value="l.uri">{{ l.label }}</option>
            </select>

            <hr>
            <div v-if="postStatus!='posted'">
              Fill out the above information to create a Hub Stub. You would create a Hub for resources that you would not normally create a MARC Authority record for. Once you click create you will be provided a link to further edit the Hub if you wish.
            </div>

            <hr>
            <div class="hub-preview">
              <span class="label">Preview:</span> {{ createPreview() }}
            </div>
            <hr>

            <div style="display: flex; padding: 1.5em;" v-if="postStatus=='unposted'">
              <div style="flex:1; text-align: center;"><button style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;" @click="buildHub">Create Hub</button></div>
              <div style="flex:1; text-align: center"><button @click="close" style="line-height: 1.75em;font-weight: bold;font-size: 1.05em;">Cancel</button></div>
            </div>
            <div style="display: flex; padding: 1.5em; font-size: 1.5em;" v-if="postStatus=='posting'">
              <div >Posting... Please wait...</div>
            </div>
            <div style="display: flex; padding: 1.5em;" v-if="postStatus=='posted'">
              <div >The Hub was created! If you would like to edit it further please click the link, it will open in new tab:</div>
              <div>
                <div v-if="configStore.returnUrls.env == 'staging'">NOT IN PRODUCTION, THE URI BELOW WILL NEED TO BE ADJUSTED TO WORK WITH STAGING PORT</div>
                <a :href="`../load?url=${newHubUrl}.rdf&profile=lc:RT:bf2:HubBasic:Hub`" target="_blank">{{ newHubUrl }}</a>
              </div>
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


  hr{
    margin-top: 2em;
    margin-bottom: 2em;
  }
select{
  font-size: 1.35em;
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

  .hub-preview {
    font-size: 1.5em;
  }
  .hub-preview .label{
    font-weight: bold;
  }



</style>
