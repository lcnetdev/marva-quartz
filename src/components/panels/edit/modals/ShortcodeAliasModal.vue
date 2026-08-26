<script>
  import { usePreferenceStore } from '@/stores/preference'

  import { mapStores } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'

  import utilsNetwork from '@/lib/utils_network'

  export default {
    name: "ShortcodeAliasModal",
    components: {
      VueFinalModal,
      VueDragResize,
    },

    props: {
      structure: Object,
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,

        initalHeight: 600,
        initalLeft: 400,

        shortcode: '',
        searchValue: '',

        // which item from the list the shortcode points at {uri,label,display}
        selectedValue: null,

        lookupItems: [],
        loading: false,
        usesSuggest: false,
        debounceTimeout: null,

        existingAliases: {},

      }
    },
    computed: {

      ...mapStores(usePreferenceStore),

      lookupUri(){
        if (this.structure && this.structure.valueConstraint && this.structure.valueConstraint.useValuesFrom && this.structure.valueConstraint.useValuesFrom[0]){
          return this.structure.valueConstraint.useValuesFrom[0]
        }
        return null
      },

      filteredItems(){
        // suggest2 sources get narrowed down server side using the search term, so no client filtering here
        if (this.usesSuggest){
          return this.lookupItems
        }
        let filter = this.searchValue.toLowerCase().trim()
        if (filter == ''){
          return this.lookupItems
        }
        return this.lookupItems.filter((item)=>{
          if (item.display && item.display.toLowerCase().includes(filter)){ return true }
          if (item.label && item.label.toLowerCase().includes(filter)){ return true }
          for (let code of item.codes){
            if (code.toLowerCase().startsWith(filter)){ return true }
          }
          return false
        })
      },

    },

    methods: {

        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.shortcodeAliasContent.style.height = newRect.height + 'px'

        },

        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || tagName === 'SPAN'|| tagName === 'TD' || tagName === 'LI') {
            event.stopPropagation()
          }
        },

        /**
        * Flatten whatever came back from lookupLibrary into a straightforward list to pick from
        */
        buildItemsFromLookup(data){
          let items = []
          if (data && data.metadata && data.metadata.values){
            for (let key of Object.keys(data.metadata.values)){
              let value = data.metadata.values[key]
              if (!value || !value.uri){ continue }

              let display = value.displayLabel
              if (Array.isArray(display)){ display = display[0] }
              if (display){ display = display.replace(/\s+/g,' ') }

              let authLabel = value.authLabel
              if (authLabel){ authLabel = authLabel.replace(/\s+/g,' ') }

              items.push({
                uri: value.uri,
                display: display,
                // match the label the field saves when you choose from the autocomplete
                label: (authLabel) ? authLabel : display,
                codes: (value.code) ? value.code : []
              })
            }
          }
          items.sort((a,b)=>{ return (a.display > b.display) ? 1 : -1 })
          return items
        },

        async loadLookup(){
          if (!this.lookupUri){ return false }
          this.loading = true

          if (this.lookupUri.includes('suggest2')){
            this.usesSuggest = true
            let uriParts = this.lookupUri.split("/suggest2?q=")
            let keyword = (this.searchValue.trim() != '') ? this.searchValue.trim() : uriParts[1]
            let results = await utilsNetwork.loadSimpleLookupKeyword(uriParts[0], keyword)
            this.lookupItems = this.buildItemsFromLookup(results)
          }else{
            let data = await utilsNetwork.loadSimpleLookup(this.lookupUri)
            this.lookupItems = this.buildItemsFromLookup(data)
          }

          this.loading = false
        },

        searchKeyUp(){
          // everything else is already in memory — filteredItems does the narrowing client side
          if (this.usesSuggest){
            window.clearTimeout(this.debounceTimeout)
            this.debounceTimeout = window.setTimeout(()=>{
              this.loadLookup()
            },500)
          }
        },

        selectItem(item){
          this.selectedValue = item
        },

        loadExistingAliases(){
          let allAliases = this.preferenceStore.returnValue('--o-edit-main-lookup-shortcode-aliases')
          if (allAliases && allAliases[this.lookupUri]){
            this.existingAliases = JSON.parse(JSON.stringify(allAliases[this.lookupUri]))
          }else{
            this.existingAliases = {}
          }
        },

        deleteAlias(shortcode){
          this.preferenceStore.removeShortcodeAlias(this.lookupUri, shortcode)
          this.loadExistingAliases()
        },

        save(){
          let shortcode = this.shortcode.trim()
          if (shortcode == ''){
            alert("Type the shortcode to use.")
            return false
          }
          if (!this.selectedValue){
            alert("Select the value the shortcode should map to.")
            return false
          }

          this.preferenceStore.saveShortcodeAlias(this.lookupUri, shortcode, this.selectedValue.uri, this.selectedValue.label)
          this.closeModal()
        },

        closeModal(){
          this.$emit('hideShortcodeAliasModal')
        },

        focusShortcodeInput(){
          if (this.$refs.shortcodeInput){
            this.$refs.shortcodeInput.focus()
          }
        },

    },


    mounted() {

      this.loadExistingAliases()
      this.loadLookup()

      // the modal's @opened event is supposed to grab focus; this is a safety net for when it doesn't
      window.setTimeout(()=>{
        this.focusShortcodeInput()
      },250)

    }
  }



</script>

<template>


    <VueFinalModal
      display-directive="show"
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"
      @opened="focusShortcodeInput()"

    >
        <VueDragResize
          :is-active="true"
          :w="650"
          :h="initalHeight"
          :x="initalLeft"
          class="debug-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="shortcode-alias-content" ref="shortcodeAliasContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

            <div class="menu-buttons">
              <button class="close-button" @pointerup="closeModal()">X</button>
            </div>

            <h3>Set Shortcode Alias</h3>
            <div v-if="structure && structure.propertyLabel" class="field-label">{{ structure.propertyLabel }}</div>

            <div class="shortcode-input-container">
              <input ref="shortcodeInput" v-model="shortcode" type="text" placeholder="Shortcode (for example: inv)">
            </div>

            <div class="map-to-label">Map to:</div>

            <div class="search-input-container">
              <input v-model="searchValue" type="text" placeholder="(type to filter the list)" @keyup="searchKeyUp">
            </div>

            <div class="lookup-list">
              <div v-if="loading" class="lookup-list-loading">Loading Data...</div>
              <ul v-else>
                <li v-for="item in filteredItems" :key="item.uri" @click="selectItem(item)" :class="{'selected-item': selectedValue && selectedValue.uri == item.uri}">
                  {{ item.display }}
                </li>
              </ul>
            </div>

            <div class="selected-display" v-if="selectedValue">
              "{{ shortcode.trim().toLowerCase() }}" will insert: <strong>{{ selectedValue.display }}</strong>
            </div>

            <div class="save-cancel-buttons">
              <button @click="save()">Save</button>
              <button @click="closeModal()">Cancel</button>
            </div>

            <template v-if="Object.keys(existingAliases).length>0">
              <hr>
              <h3>Existing Aliases</h3>
              <table>
                <thead>
                  <th>Shortcode</th>
                  <th>Maps To</th>
                  <th></th>
                </thead>
                <tbody>
                  <template v-for="(alias,code) in existingAliases">
                    <tr>
                      <td class="table-shortcode">{{ code }}</td>
                      <td>{{ alias.label }}</td>
                      <td class="table-delete">
                        <button @click="deleteAlias(code)"><span class="material-icons">delete</span></button>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </template>

          </div>


        </VueDragResize>
    </VueFinalModal>




</template>

<style scoped>

  h3{
    font-weight: bold;
  }

  .field-label{
    color: gray;
    margin-bottom: 1em;
  }

  .shortcode-input-container input, .search-input-container input{
    font-size: 1.25em;
    width: 95%;
  }

  .map-to-label{
    font-weight: bold;
    margin-top: 1em;
    margin-bottom: 0.5em;
  }

  .lookup-list{
    height: 200px;
    overflow-y: scroll;
    border: solid 1px lightgray;
    margin-top: 0.5em;
    padding: 0.25em;
  }
  .lookup-list-loading{
    padding: 1em;
  }
  .lookup-list li{
    cursor: pointer;
    list-style: none;
    padding: 2px;
  }
  .lookup-list li:hover{
    background-color: aliceblue;
  }
  .lookup-list li.selected-item{
    border:solid 4px lightblue;
    border-radius: 5px;
  }

  .selected-display{
    margin-top: 1em;
  }

  .save-cancel-buttons{
    text-align: center;
    padding: 1em;
  }
  .save-cancel-buttons button{
    font-size: 1.25em;
    margin: 0 0.5em;
  }

  table{
    width: 100%;
  }
  th{
    text-align: left;
    font-weight: bold;
  }
  tr:hover{
    background-color: aliceblue;
  }
  td{
    border-bottom: solid 1px whitesmoke;
  }
  .table-shortcode{
    font-family: monospace;
    background-color: whitesmoke;
    font-size: 1.25em;
    padding: 2px;
  }
  .table-delete{
    text-align: center;
  }

  hr{
    margin-top: 1em;
    margin-bottom: 1em;
  }

  #shortcode-alias-content{
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
  .debug-modal{
    background-color: white;
    -webkit-box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    border-radius: 1em;
    padding:1em;
    border: solid 1px black;
  }

</style>
