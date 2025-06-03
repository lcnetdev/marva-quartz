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
      selected: null,
      open: false,
      content: {},
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

    async refreshMarc() {
      this.previewData = await this.profileStore.marcPreview()
    },

  },

  created() {

    // this.profileStore.$subscribe(async (mutation, state)=>{

    //   if (mutation && mutation.events && mutation.events.target && mutation.events.target['@guid'] ){

    //     window.clearTimeout(this.timeout)
    //     this.timeout = window.setTimeout(()=>{

    //       this.refreshMarc()

    //     },500)



    //   }


    // }, { detached: true })

    // build the XML on first load
    this.$nextTick(() => {
      window.setTimeout(() => {

        this.refreshMarc()

      }, 1000)
    })
  },

  updated() { }
}



</script>

<template>

  <div class="marc-preview-content">
    <input @click="open = !open" type="checkbox" />

    <WindowPortal :open="open" :content="previewData">
      <MarcDisplay :previewData="content" :selected="selected" />
    </WindowPortal>
    Popout this Panel?
    {{ open }}

    <ul>
      <li v-for="ver in previewData.versions">
        <button @click="selected = ver.version">{{ ver.version }} <span v-if="ver.error">(err)</span></button>
      </li>
    </ul>

    <MarcDisplay :previewData="previewData" :selected="selected" />
  </div>
</template>

<style scoped>
ul {
  padding: 0;
}

li {
  display: inline-block;
}

.marc-preview-content {
  padding: 0.25em;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;


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
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-marc-html-highlight-color')");
}
</style>
