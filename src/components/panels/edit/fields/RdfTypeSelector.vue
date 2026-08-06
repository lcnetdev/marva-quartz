<template>

  <div class="lookup-fake-input rdf-type-selector">

    <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels')" class="lookup-fake-input-label" :class="{'label-bold': preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-field-labels-bold')}">{{structure.propertyLabel}}</div>

    <div class="rdf-type-selector-options">
      <label v-for="option in options" :key="option.uri" class="rdf-type-selector-option" :title="option.uri">
        <input
          type="checkbox"
          :checked="selectedUris.indexOf(option.uri) > -1"
          :disabled="readOnly"
          @change="toggleOption(option.uri)"
        />
        <span>{{option.label}}</span>
      </label>
    </div>

  </div>

</template>

<script>

import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'

import { mapStores } from 'pinia'

import utilsRDF from '@/lib/utils_rdf'

export default {
  name: "RdfTypeSelector",
  props: {
    guid: String,
    propertyPath: Array,
    level: Number,
    structure: Object,
    readOnly: Boolean,
  },

  computed: {

    ...mapStores(useProfileStore),
    ...mapStores(usePreferenceStore),

    // the picklist from the profile definition, expanded into full URIs
    // with a human friendly label made from the class name
    options() {
      let options = []
      if (this.structure && this.structure.valueConstraint && Array.isArray(this.structure.valueConstraint.picklist)){
        for (let prefixed of this.structure.valueConstraint.picklist){
          let uri = utilsRDF.expandPrefixedClass(prefixed)
          if (uri === false){
            console.warn('RdfTypeSelector: unknown namespace prefix for picklist value', prefixed)
            continue
          }
          // "bf:NotatedMusic" -> "Notated Music"
          let label = prefixed.split(':')[1].replace(/([a-z])([A-Z])/g, '$1 $2')
          options.push({prefixed: prefixed, uri: uri, label: label})
        }
      }
      return options
    },

    // the currently selected class URIs from the component's userValue
    selectedUris() {
      const typeURI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
      if (this.structure && this.structure.userValue && Array.isArray(this.structure.userValue[typeURI])){
        return this.structure.userValue[typeURI].map((v) => { return v['@id'] }).filter((v) => { return v })
      }
      return []
    },

  },

  methods: {

    toggleOption(uri){
      if (this.readOnly){ return }
      let uris = this.selectedUris.slice()
      if (uris.indexOf(uri) > -1){
        uris = uris.filter((v) => { return v !== uri })
      }else{
        uris.push(uri)
      }
      // keep the order of the picklist, not the click order
      uris.sort((a, b) => {
        return this.options.findIndex((o) => { return o.uri === a }) - this.options.findIndex((o) => { return o.uri === b })
      })
      this.profileStore.setValueRdfTypePicklist(this.guid, uris)
    },

  },

};
</script>

<style scoped>

.rdf-type-selector{
  position: relative;
  padding: 4px 4px 2px 4px;
}

.lookup-fake-input-label{
  position: absolute;
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-edit-show-field-labels-size')");
  z-index: 1;
  top: -4px;
  left: 2px;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-show-field-labels-color')");
  pointer-events: none;
  margin-top: 1px;
}

.label-bold{
  font-weight: bold;
}

.rdf-type-selector-options{
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25em 1.25em;
  padding-top: 0.9em;
  padding-left: 2px;
}

.rdf-type-selector-option{
  display: flex;
  align-items: center;
  gap: 0.35em;
  cursor: pointer;
  white-space: nowrap;
}

.rdf-type-selector-option input[type="checkbox"]{
  cursor: pointer;
}

.rdf-type-selector-option input[type="checkbox"]:disabled{
  cursor: default;
}

</style>
