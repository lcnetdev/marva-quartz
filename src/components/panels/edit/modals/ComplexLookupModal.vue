<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'

  import { useConfigStore } from '@/stores/config'
  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'

  import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";


  import utilsNetwork from '@/lib/utils_network';


  export default {
    components: {
      VueFinalModal,
      AuthTypeIcon,

    },
    props: {
      // structure of the field that owns this modal
      structure: Object,
      // the inital search value starting the search
      searchValue: String,

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
        activeSimpleLookup: [],
        controller: new AbortController(),

        initalSearchState: true,

        // These help paging the results when needed
        offsetStart: 0,
        offsetStep: 25,
        currentPage: 1,
        maxPage: 0,

        activeContext: null,


        nextInputIsVoyagerModeDiacritics: false,

		    searchType: "left",
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

      ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse','diacriticPacks', 'lastComplexLookupString']),

      ...mapWritableState(useProfileStore, ['lastComplexLookupString','showNacoStubCreateModal']),




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
        this.activeSimpleLookup = []
        this.doSearch()

      }



    },

    methods: {
      // Reset stored values
      // This is for when the modal is closed, we want to reset things so nothing is preloaded
      // and the user starts from zero
      reset: function(){
        this.activeContext = null
        this.activeComplexSearch = []
        this.activeSimpleLookup = []
        this.activeSimpleLookupCache = []
        this.searchValueLocal = null
        this.authorityLookupLocal = null
      },

      // watching the search input, when it changes kick off a search
      doSearch: async function(){
        //if there is an ongoing search, abort it
        if (this.activeComplexSearchInProgress){
          this.controller.abort()
          this.controller = new AbortController()
        }

        if (!this.isSimpleLookup()){
          if (!this.searchValueLocal){ return false}

          if (this.searchValueLocal.trim()==''){
            return false
          }
        } else {
          if (!this.searchValueLocal){
            this.searchValueLocal = ""
          }
        }
        if (this.searchValueLocal.length<3){
          // if it is non-latin
          if (this.searchValueLocal.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/)){
            // if it is a CJK language don't impose that limit
          }else{
            // check the config, some vocabs have very short codes, like the marc geo
            // so if it is configed to allow short search overtide the < 3 rule
            let minCharBeforeSearch = 3
            if (this.isSimpleLookup()){
              minCharBeforeSearch = -1
            }
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
              if (a.urls.includes("<QUERY>")){
                searchPayload.type = 'complex'
                searchPayload.url.push(
                  a.urls
                    .replace('<QUERY>', this.searchValueLocal)
                    .replace('<OFFSET>', offset)
                    .replace('<TYPE>', searchType)
                )
              } else { // we're mixing a simple lookup and a complex one
                searchPayload.url.push(a.urls)
              }
            }
          })

        // wrapping this in setTimeout might not be needed anymore
        if (searchPayload.type == 'complex'){
          this.searchTimeout = window.setTimeout(async ()=>{
            this.activeComplexSearchInProgress = true
            this.activeComplexSearch = []
            this.activeComplexSearch = await utilsNetwork.searchComplex(searchPayload)
            this.activeComplexSearchInProgress = false
            this.initalSearchState =false
          }, 400)
        } else {
          let filter = function(obj, target){
            let result = []
            for (let key in obj){
              if (key != target[0].replace(".html", "").replace("https", "http")){
                result.push(obj[key])
              }
            }

            return result
          }

          let results = await utilsNetwork.loadSimpleLookup(searchPayload.url)
          utilsNetwork.lookupLibrary[searchPayload.url] = results
          this.activeSimpleLookup = filter(results.metadata.values, searchPayload.url).sort((a,b) => (a.label[0] > b.label[0]) ? 1 : (a.label[0] < b.label[0]) ? -1 : 0)

          if (this.searchValueLocal.length > 0){
            this.activeSimpleLookup.push({
              uri: "",
              label: [this.searchValueLocal],
              code: [],
              displayLabel: [this.searchValueLocal + " [Literal]"]
            })
          }
          if (this.searchValueLocal && this.searchValueLocal.length > 1){
            this.activeSimpleLookup = this.activeSimpleLookup.filter((term) => term.label[0].includes(this.searchValueLocal))
          }
          // this.selectChange()
        }
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
          } catch {
            this.$refs.selectOptions.value=this.activeSimpleLookup[0].uri
          }
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
          if (!toLoad){
            let label = this.activeSimpleLookup[this.$refs.selectOptions.selectedIndex].label
            let uri = this.$refs.selectOptions.value
            toLoad = {label: label, uri: uri, literal: false, undifferentiated: false}
          }
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
        console.info("toLoad: ", toLoad)

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
            "extra": toLoad.extra
          }

        if (toLoad && toLoad.literal){
          return false
        }

        let results = null
        try {
            // results = await utilsNetwork.returnContext(toLoad.uri)
            // console.info("results: ", results)


            results = this.activeContext
        } catch(err) {
            results = this.activeContext
        }
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

        console.info("activeContext: ", this.activeContext)
      },

      isStaging(){
        if (useConfigStore().returnUrls.env == "staging"){
          return true
        }else{
          return false
        }
      },

      loadNacoStubModal(){

        this.$emit('hideComplexModal')

        this.$nextTick(() => {

          this.showNacoStubCreateModal = true

        })


        // this.displayCo/

      },

      rewriteURI: function(uri){

        if (!uri){
          return false
        }

        if (uri.includes('bibframe.example.org')){
          return false
        }

        if (uri.includes('/resources/hubs/') || uri.includes('/resources/works/') || uri.includes('/resources/instances/') || uri.includes('/resources/items/')){
          let returnUrls = useConfigStore().returnUrls
          uri = uri.replace('https://id.loc.gov/', returnUrls.bfdb )
          uri = uri.replace('http://id.loc.gov/', returnUrls.bfdb )
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

      isSimpleLookup: function(){
        const mode = this.modeSelect
        const options = this.modalSelectOptions
        const activeMode = options.filter((opt) => opt.label == mode)[0]

        return !activeMode.urls.includes("<QUERY>")
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
          } else if (this.isSimpleLookup()){
            this.searchValueLocal = this.searchValue
            this.doSearch()
          }else {
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
      @before-close="reset();"
      >

      <div ref="complexLookupModalContainer" class="complex-lookup-modal-container" :style="`${this.preferenceStore.styleModalBackgroundColor()}`">
			<div class="menu-buttons">
				<button @click="reset(); $emit('hideComplexModal')">x</button>
			</div>
          <div class="complex-lookup-modal-container-parts">

            <div class="complex-lookup-modal-search">
              <template v-if="preferenceStore.returnValue('--b-edit-complex-use-select-dropdown') === false">
                <div class="toggle-btn-grp cssonly">
                  <div v-for="opt in modalSelectOptions"><input type="radio" :value="opt.label" class="search-mode-radio" v-model="modeSelect" name="searchMode"/><label onclick="" class="toggle-btn">{{opt.label}}</label></div>
				  </div>

                  <div v-if="(activeComplexSearch && activeComplexSearch[0] && ((activeComplexSearch[0].total % 25 ) > 0 || activeComplexSearch.length > 0))" class="complex-lookup-paging">
                    <span :style="`${this.preferenceStore.styleModalTextColor()}`">
                      <a href="#" title="first page" class="first" :class="{off: this.currentPage == 1}" @click="firstPage()">
                        <span class="material-icons pagination" :style="`${this.preferenceStore.styleModalTextColor()}`">keyboard_double_arrow_left</span>
                      </a>
                      <a href="#" title="previous page" class="prev" :class="{off: this.currentPage == 1}" @click="prevPage()">
                        <span class="material-icons pagination" :style="`${this.preferenceStore.styleModalTextColor()}`">chevron_left</span>
                      </a>
                      <span class="pagination-label" > Page {{ this.currentPage }} of {{ !isNaN(Math.ceil(this.activeComplexSearch[0].total / this.offsetStep)) ? Math.ceil(this.activeComplexSearch[0].total / this.offsetStep) : "Last Page"}} </span>
                      <a href="#" title="next page" class="next" :class="{off: Math.ceil(this.activeComplexSearch[0].total / this.offsetStep) == this.currentPage}" @click="nextPage()">
                        <span class="material-icons pagination" :style="`${this.preferenceStore.styleModalTextColor()}`">chevron_right</span>
                      </a>
                      <a href="#" title="last page" class="last" :class="{off: Math.ceil(this.activeComplexSearch[0].total / this.offsetStep) == this.currentPage}" @click="lastPage()">
                        <span class="material-icons pagination" :style="`${this.preferenceStore.styleModalTextColor()}`">keyboard_double_arrow_right</span>
                      </a>
                    </span>
                  </div>

				  <div id="container" v-if="modalSelectOptions.length == 10 && modalSelectOptions[8].label == 'NAF Geo SubDiv'">
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
              <button @click="loadNacoStubModal" style="float: right;" v-if="isStaging() == true">Create NACO Stub</button>

              <hr style="margin-top: 5px;">
              <div>
                  <select size="100" ref="selectOptions" class="modal-entity-select" @change="selectChange($event)"  @keydown="selectNav($event)" :style="`${this.preferenceStore.styleModalBackgroundColor()}; ${this.preferenceStore.styleModalTextColor()}`">
                    <option v-if="(activeComplexSearch.length == 0 && activeSimpleLookup.length == 0)&& activeComplexSearchInProgress == false && initalSearchState != true">
                      No results found.
                    </option>
                    <option v-if="activeComplexSearchInProgress == true">
                      Searching...
                    </option>
                    <template v-if="!isSimpleLookup()">
                      <option v-for="(r,idx) in activeComplexSearch" :data-label="r.label" :value="r.uri" v-bind:key="idx" :style="(r.depreciated || r.undifferentiated) ? 'color:red' : ''" class="complex-lookup-result" v-html="' ' + (!r.literal ? r.suggestLabel : r.label) + ((r.literal) ? ' [Literal]' : '')">
                      </option>
                    </template>
                    <template v-else-if="activeSimpleLookup && Object.keys(activeSimpleLookup).length > 0">
                      <option v-for="(r, idx) in activeSimpleLookup" @click="selectChange()" :data-label="r.label" :value="r.uri" v-bind:key="idx" class="complex-lookup-result" v-html="r.displayLabel">
                      </option>
                    </template>
                  </select>
                  <br>

              </div>



            </div>


            <div ref="complexLookupModalDisplay" class="complex-lookup-modal-display" :style="`${this.preferenceStore.styleModalTextColor()};`">

              <template v-if="activeContext !== null">
                  <h3><span class="modal-context-icon simptip-position-top" :data-tooltip="'Type: ' + activeContext.extra.rdftypes[0]"><AuthTypeIcon v-if="activeContext.extra.rdftypes" :type="activeContext.extra.rdftypes[0]"></AuthTypeIcon></span>{{returnContextTitle(activeContext.title)}}</h3>
                  <div class="complex-lookup-modal-display-type-buttons">
                    <div>
                        <div class="modal-context-data-title">{{activeContext.extra.rdftypes[0]}}</div>
                        <div v-if="activeContext.depreciated" style="background: pink;">
                          DEPRECIATED AUTHORITY
                        </div>
                        <div v-if="activeContext.extra.collections && activeContext.extra.collections.includes('http://id.loc.gov/authorities/names/collection_NamesUndifferentiated')" style="background: pink;">
                          THIS 1XX FIELD CANNOT BE USED UNDER RDA UNTIL THIS UNDIFFERENTIATED RECORD HAS BEEN HANDLED FOLLOWING THE GUIDELINES IN <a href="https://www.loc.gov/aba/pcc/rda/PCC%20RDA%20guidelines/Z01%20008%2032%202014rfeb.pdf" target="_blank">DCM Z1 008/32</a>.
                        </div>
                        <a style="color:#2c3e50; float: none;    border: none;border-radius: 0;background-color: transparent;font-size: 1em;padding: 0;" v-if="activeContext.type!='Literal Value'" :href="rewriteURI(activeContext.uri)" target="_blank" :style="`${this.preferenceStore.styleModalTextColor()}`">view on id.loc.gov</a>

                    </div>
                    <div class="complex-lookup-modal-display-buttons">

                      <button @click="$emit('emitComplexValue', activeContext)">Add [Shift+Enter]</button>
                      <button @click=" reset(); $emit('hideComplexModal')">Cancel [ESC]</button>

                    </div>


                  </div>

                  <div v-if="activeContext.extra.notes && activeContext.extra.notes.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Notes:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.notes" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.nonlatinLabels.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Non-Latin Authoritative Labels:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.nonlatinLabels" v-bind:key="'auth' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.variantLabels && activeContext.extra.variantLabels.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Variants:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.variantLabels" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.birthdates && activeContext.extra.birthdates.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Birth Date:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.birthdates" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.birthplaces && activeContext.extra.birthplaces.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Birth Place:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.birthplaces" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.locales && activeContext.extra.locales.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Associated Locales:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.locales" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.activityfields && activeContext.extra.activityfields.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Fields of Activity:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.activityfields" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.occupations && activeContext.extra.occupations.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Occupations:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.occupations" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.languages && activeContext.extra.languages.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Associated Languages:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.languages" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.lcclasss && activeContext.extra.lcclasss.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">LC Classification:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.lcclasss" v-bind:key="v + idx">
                        <a :href="'https://classweb.org/min/minaret?app=Class&mod=Search&table=schedules&table=tables&tid=1&menu=/Menu/&iname=span&ilabel=Class%20number&iterm='+v" target="_blank">{{v}}</a>
                      </li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.broaders && activeContext.extra.broaders.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Broader Headings:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.broaders" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.gacs && activeContext.extra.gacs.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">GAC(s):</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.gacs" v-bind:key="'var' + idx">{{v}}</li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.collections && activeContext.extra.collections.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">MADS Collections:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.collections" v-bind:key="v + idx">
                        <a target="_blank" :href="v">{{ v.split("/").at(-1).split("_").at(-1) }}</a>
                      </li>
                    </ul>
                  </div>

                  <div v-if="activeContext.extra.sources && activeContext.extra.sources.length>0">
                    <div class="modal-context-data-title modal-context-data-title-add-gap">Sources:</div>
                    <ul>
                      <li class="modal-context-data-li" v-for="(v,idx) in activeContext.extra.sources" v-bind:key="'sources-'+idx">{{v}}</li>
                    </ul>


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




  width: 85vw;
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

  }

  h3{
    margin-bottom:1em;
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

</style>
