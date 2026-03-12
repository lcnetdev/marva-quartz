<script>
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'

import { mapStores, mapState, mapWritableState } from 'pinia'
import WindowPortal from './WindowPortal.vue'
import MarcDisplay from './MarcDisplay.vue'

export default {
  components: {
    WindowPortal,
    MarcDisplay
  },

  data() {
    return {
      previewData: { default: null, versions: [] },
      timeout: null,
      firstLoad: true,
      selected: 0,
      open: false,
      content: {},
      sourceDoc: {},
      marcRecordIdx: 0,
      version: "",
    }
  },
  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(useProfileStore, usePreferenceStore),
    // // gives read access to this.count and this.double
    ...mapState(useProfileStore, ['activeProfile', 'dataChangedTimestamp']),
    ...mapState(usePreferenceStore, ['styleDefault']),

    ...mapWritableState(useProfileStore, ['activeComponent']),


  },
  watch: {
    // if this flips from false to true it means they are landing on this page so ask for the record from the backend
    dataChangedTimestamp(newDataChangedTimestamp, oldDataChangedTimestamp) {
      this.refreshMarc()
    }
  },

  methods: {
    closeWindow: function () {
      this.open = false
    },

    async refreshMarc() {
      this.previewData = await this.profileStore.marcPreview()
    },
  },

  created() {
    // build the XML on first load
    this.$nextTick(() => {
      window.setTimeout(() => {

        this.refreshMarc()
        this.version = this.previewData.default

      }, 1000)
    })

    this.sourceDoc = window.document
  },

  updated() { }
}



</script>

<template>

  <div class="marc-preview-content">
    <button class="popout-button" @click="open = !open">
      <span class="material-icons" style="font-size: 14px;">open_in_new</span>
    </button>
    <WindowPortal @close="closeWindow" :open="open" :content="previewData" type="marc" :sourceDoc="sourceDoc"
      :version="version" :selected="selected">
      <!-- <MarcDisplay :previewData="previewData" :selected="selected" /> why this doesn't work? -->
    </WindowPortal>

    <template v-for="key in Object.keys(previewData['versions'])">
      <div class="conversion-heading">Conversion {{ key }}:</div>
      <div class="toggle-btn-grp cssonly" v-if="previewData['versions'][key].record.length > 1">
        <div v-for="(r, idx) of previewData['versions'][key].record">
          <input type="radio" :value="idx" class="record-radio" v-model="selected" name="recordSelect" />
          <label onclick="" class="toggle-btn">Record {{ idx + 1 }}</label>
        </div>
      </div>

      <MarcDisplay :previewData="previewData['versions'][previewData.default].record[selected]" />

    </template>

  </div>
</template>

<style scoped>
body {
  --bg-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-background-color')");
}

ul {
  padding: 0;
}

li {
  display: inline-block;
}

.marc-preview-content {
  padding: 0.25em;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-background-color')");
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size')");
  font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-family')");
}

.version-number {
  font-size: 1.25em;
  font-weight: bold;
}


.sidebar-header-text {
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size', true) + 0.25 + 'em'");
  font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-family')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;

}


.sidebar-spacer {
  padding-top: 1em;
  margin-top: 1em;
  padding-bottom: 1em;
  border-top: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')");

}


.item-icon {
  fill: v-bind("preferenceStore.returnValue('--c-general-icon-item-color')");
  stroke-width: 0.5;
  stroke: rgb(0, 0, 0)
}

/** MARC preview formatting */
:deep() .marc.record {
  font-family: monospace;
}

:deep() .marc.indicators {
  white-space: pre;
}


:deep() .marc.subfield.subfield-0 .subfield-value,
:deep() .marc.subfield.subfield-1 .subfield-value {
  width: 4.5em;
  display: inline-block;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.5);
  vertical-align: bottom;
}

:deep() div.marc.field {
  text-indent: 4em hanging;
}

:deep() span.marc.subfield:hover {
  /* background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-marc-html-highlight-color')"); */
}

:deep().popout-button {
  float: right;
  z-index: 999;
}

:deep() .toggle-btn-grp div:focus{
  background-color: red;
}

:deep() .search-mode-radio:focus {
  background-color: red;
  outline: 1px solid black;
}

:deep() .toggle-btn-grp {
  margin: 3px 0;
}

:deep() .toggle-btn-grp.cssonly * {
  width: 110px;
  height: 30px;
  line-height: 30px;
}

:deep() .toggle-btn-grp.cssonly div {
  display: inline-block;
  position: relative;
  margin: 5px 2px;
}

:deep() .toggle-btn-grp.cssonly div label {
  position: absolute;
  z-index: 0;
  padding: 0;
  text-align: center;
}

:deep() .toggle-btn-grp.cssonly div input {
  position: absolute;
  z-index: 1;
  cursor: pointer;
  opacity: 0;
}

:deep() .toggle-btn-grp.cssonly div:hover label {
  border: solid 1px #a0d5dc !important;
  background: #f1fdfe;
}

:deep() .toggle-btn-grp.cssonly div input:checked+label {
  background: lightskyblue;
  border: solid 1px blue !important;
}

:deep() .toggle-btn {
  text-align: centre;
  padding: 0.1em 1em;
  color: #000;
  background-color: #FFF;
  border-radius: 10px;
  display: inline-block;
  border: solid 1px #CCC;
  cursor: pointer;
}
</style>
