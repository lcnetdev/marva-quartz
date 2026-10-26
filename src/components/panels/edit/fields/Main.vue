<template>


  <div v-if="componentType != 'META'" :style="'background-color: ' + returnBackgroundColor + ';'" :class="[componentType, 'level-'+level, {'component': (level == 0 || (componentType=='REF' && preferenceStore.returnValue('--b-edit-main-compact'))), 'child-component': (level != 0), 'inline-mode': (preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode')), 'expand-left': preferenceStore.returnValue('--b-edit-main-compact') &&  !(preferenceStore.returnValue('--b-edit-main-compact') && compactSizeCheckLeft), 'compact-left': (preferenceStore.returnValue('--b-edit-main-compact') && compactSizeCheckLeft && structure.parentId.includes(':Work')), 'expand-right': preferenceStore.returnValue('--b-edit-main-compact') &&  !(preferenceStore.returnValue('--b-edit-main-compact') && compactSizeCheckRight), 'compact-right': (preferenceStore.returnValue('--b-edit-main-compact') && compactSizeCheckRight && structure.parentId.includes(':Instance'))}]" :id="`edit_${parentId}_${id}`">
    <!-- {{ level }} {{structure}} -->
    <!-- {{guid}} -- {{componentType}} ({{level}}) {{propertyPath}} id: {{id}} -->
    <!-- {{ structure.preferenceId }} {{ guid }} -->
    <!-- {{ preferenceId }} -->
    <!-- {{ userModified }} -->
    <!-- {{ id }} -->

    <!-- {{ Object.keys(structure) }}<br>
      {{ structure.parent }}<br>
      {{ structure.parentId }}<br>
      {{ guid }} -->

    <Ref
      v-if="componentType === 'REF'"
      :propertyPath="buildPropertyPath(propertyPath)"
      :level="level+1"
      :structure="structure"
      :guid="guid"
      :readOnly="readOnly"
    />
    <LookupComplex
      v-if="componentType === 'COMPLEX'"
      :propertyPath="buildPropertyPath(propertyPath)"
      :level="level+1"
      :structure="structure"
      :guid="guid"
      :readOnly="readOnly"
    />
    <LookupSimple
      v-if="componentType === 'SIMPLE'"
      :propertyPath="buildPropertyPath(propertyPath)"
      :level="level+1"
      :structure="structure"
      :guid="guid"
      :readOnly="readOnly"
    />
    <Literal
      v-if="componentType === 'LITERAL'"
      :propertyPath="buildPropertyPath(propertyPath)"
      :level="level+1"
      :structure="structure"
      :guid="guid"
      :readOnly="readOnly"
    />
    <RdfTypeSelector
      v-if="componentType === 'RDFTYPE'"
      :propertyPath="buildPropertyPath(propertyPath)"
      :level="level+1"
      :structure="structure"
      :guid="guid"
      :readOnly="readOnly"
    />
    <!-- {{ Object.keys(structure) }} -->
    <div v-if="level == 0 && preferenceStore.returnValue('--b-edit-main-compact')" class="button-holder">
      <input v-if="!createLayoutMode && preferenceStore.copyMode && !structure.parentId.includes('AdminMetadata')" type="checkbox" class="copy-selection" :id="guid" />
      <input v-if="createLayoutMode" type="checkbox" class="layout-selection" :id="guid" />
      <span v-if="!id.includes('_adminmetadata ') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')  && preferenceStore.returnValue('--b-edit-main-compact')" :class="['material-icons','inline-icon', {'work': parentId.includes('Work'), 'instance': parentId.includes('Instance'), 'item': parentId.includes('Item'),}]" @click="removeComponent(parentId, id)">delete</span>
      <span v-if="!id.includes('_adminmetadata ') && preferenceStore.returnValue('--b-edit-main-splitpane-edit-show-add-delete')  && preferenceStore.returnValue('--b-edit-main-compact')" :class="['material-icons','inline-icon', {'work': parentId.includes('Work'), 'instance': parentId.includes('Instance'), 'item': parentId.includes('Item'),}]" @click="addComponent(parentId, id)">add</span>
    </div>

    <!-- {{structure}} -->
  </div>

</template>

<script>

///////////// import VueJsonPretty from 'vue-json-pretty'
// <template>
//   <div>
//     <vue-json-pretty :data="{ key: 'value' }" />
//   </div>
// </template>

// <scr>
// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

// export default {
//   components: {
//     VueJsonPretty,
//   },
// };
// </scr>

import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { usePreferenceStore } from '@/stores/preference'



import { mapStores, mapState } from 'pinia'

// import short from 'short-uuid'
// const translator = short();
// const short = require('short-uuid');


import utilsRDF from '@/lib/utils_rdf'

import Ref from "@/components/panels/edit/fields/Ref.vue";
import LookupComplex from "@/components/panels/edit/fields/LookupComplex.vue";
import LookupSimple from "@/components/panels/edit/fields/LookupSimple.vue";
import Literal from "@/components/panels/edit/fields/Literal.vue";
import RdfTypeSelector from "@/components/panels/edit/fields/RdfTypeSelector.vue";


export default {
  name: "Main",
  components: {
    // EditLiteralComponent,
    // EditSimpleLookupComponent,
    // EditTemplateRefComponent,
    // EditComplexLookupComponent,
    // EditMetaComponent,
    // // EditAdminComponent,
    // VueJsonPretty

    Ref,
    LookupComplex,
    LookupSimple,
    Literal,
    RdfTypeSelector,

  },
  props: {
    guid: String,
    level: Number,
    propertyPath: Array,
    inheritedStructure: Object,   // this is the sturcture passed to it from its parents, we use this one if it is not the first level of the hierarchy
    nested: Boolean,
    id: String,
    parentId: String,
    readOnly: Boolean,

    // structure: Object,
    // parentStructure: Array,
    // parentStructureObj: Object,

    // isMini: Boolean,
    // profileCompoent: String,
    // profileName: String,
    // activeTemplate: Object,
    // parentURI: String,
    // ptGuid: String,
    // dynamic: String,

  },
  data: function() {
    return {


      displayDebug: false,
      showCompactButtons: true,
      rObserver: null,
      lObserver: null,
      compactSizeCheckLeft: true,
      compactSizeCheckRight: true,


      // useKey: short.generate(),
      // levelPlusOne: this.plusOne(this.level),

      // is a lookup url require a simple or complex lookup interface, and its options
      // lookupType:config.lookupConfig
    }
  },
  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(useProfileStore),
    ...mapStores(usePreferenceStore),



    // returns the structure from the state
    ...mapState(useProfileStore, {
      structure(store) {
        if (typeof this.inheritedStructure === 'undefined'){
          return store.returnStructureByGUID(this.guid);
        }else{
          return this.inheritedStructure
        }
      },
      preferenceId(store) {
        return store.returnPreferenceIdByGUID(this.guid);
      },
      userModified(store) {
        return store.returnUserModifiedIdByGUID(this.guid);
      }
    }),


    ...mapState(useConfigStore, ['lookupConfig']),
    ...mapState(usePreferenceStore, ['layoutActive', 'layoutActiveFilter', 'createLayoutMode']),



    // ...mapState(useProfileStore, ['returnStructureByGUID2']),



    // ...mapState(usePreferenceStore, ['styleDefault']),

    // gives read access to this.count and this.double
    // ...mapState(usePreferenceStore, ['profilesLoaded']),
    ...mapState(useProfileStore, ['activeProfile']),

    componentType() {
      // these meta componets are structural things, like add new instances/items. etc
      if (this.structure.propertyURI == "http://id.loc.gov/ontologies/bibframe/hasInstance"){
        return "META"
      }
      if (this.structure.propertyURI == "http://id.loc.gov/ontologies/bibframe/instanceOf"){
        return "META"
      }
      // we handle this structural thing elsewhere
      if (this.structure.propertyURI == "http://id.loc.gov/ontologies/bibframe/hasItem"){
        return "HIDE"
      }

      // a rdf:type property with a picklist of classes, only at the top level of a Work/Instance/Item/Hub
      if (utilsRDF.isRdfTypePicklist(this.structure)){
        return 'RDFTYPE'
      }

      if (this.structure.valueConstraint.valueTemplateRefs.length > 0){
        return 'REF'
      }
      if (this.structure.type === 'literal'){
        return 'LITERAL'
      }

      let type = 'SIMPLE'
      if (this.structure.valueConstraint.useValuesFrom.length==0) return null
      this.structure.valueConstraint.useValuesFrom.forEach((cs)=>{
        if (this.lookupConfig[cs] && this.lookupConfig[cs].type.toLowerCase() == 'complex'){
          type='COMPLEX'
        }
      })
      return type
    },

    returnBackgroundColor(){

      let colors = this.preferenceStore.returnValue('--o-edit-general-field-colors')

      const mandatory = this.structure.mandatory

      let id = this.preferenceId

      //If the mandatory color is set, it overrides everything
      if (mandatory == "true" && Object.keys(colors).includes('req')){
        return colors['req']['req']
      }

      if (colors[id]){
        if (this.userModified){
          if (colors[id]['edited']){
            return colors[id]['edited']
          }
        }
        if (colors[id]['default']){
            return colors[id]['default']
          }
      }



      if (this.preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-color')){
        if (this.preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-color') == 'transparent'){
          return 'white'
        }else{
          return this.preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-color')
        }

      }


      return 'white'
    },





  },

  watch :{ },

  created(){ },

  mounted(){
    this.rObserver = new ResizeObserver(this.onResize)
    this.lObserver = new ResizeObserver(this.onResize)

    let targetElementLeft = null
    if (this.preferenceStore.panelDisplay.dualEdit){
      targetElementLeft = document.getElementsByClassName('edit-main-splitpane-edit-work')[0]
      let targetElementRight = document.getElementsByClassName('edit-main-splitpane-edit-instance')[0]
      this.rObserver.observe(targetElementRight)
    } else {
      targetElementLeft = document.getElementsByClassName('edit-main-splitpane-edit-combined')[0]
    }

    this.rObserver.observe(targetElementLeft)

  },

  // beforeMount(){
  //   let targetElement = document.getElementsByClassName('edit-panel-work')[0]
  //   this.rObserver.unobserve(targetElement)
  // },

  methods: {
    onResize: function(){
      if (!this.preferenceStore.returnValue('--b-edit-main-compact')){
        this.compactSizeCheckLeft = true
        this.compactSizeCheckRight = true
        return
      }
      // compactSizeCheckRight
      let targetElementLeft = null
      if (this.preferenceStore.panelDisplay.dualEdit){
        targetElementLeft = document.getElementsByClassName('edit-main-splitpane-edit-work')[0]
        let targetElementRight = document.getElementsByClassName('edit-main-splitpane-edit-instance')[0]
        if (targetElementRight.offsetWidth < this.preferenceStore.returnValue('--b-edit-main-compact-threshold')){
          this.compactSizeCheckRight = false
        } else {
          this.compactSizeCheckRight = true
        }
      } else {
        targetElementLeft = document.getElementsByClassName('edit-main-splitpane-edit-combined')[0]
      }


      if (targetElementLeft.offsetWidth < this.preferenceStore.returnValue('--b-edit-main-compact-threshold')){
        this.compactSizeCheckLeft = false
      } else {
        this.compactSizeCheckLeft = true
      }
      if (!this.preferenceStore.panelDisplay.dualEdit){
        this.compactSizeCheckRight = this.compactSizeCheckLeft
      }
    },
    addComponent: function(profileName, profileCompoent){
      let guid = this.activeProfile.rt[profileName].pt[profileCompoent]['@guid']
      let structure = this.activeProfile.rt[profileName].pt[profileCompoent]
      this.profileStore.duplicateComponent(guid, structure)
      // this.sendFocusHome()
    },

    removeComponent: function(profileName, profileCompoent){
      let guid = this.activeProfile.rt[profileName].pt[profileCompoent]['@guid']
      this.profileStore.deleteComponent(guid)
    },

    buildPropertyPath: function(currentPath){
      if (!currentPath){
        currentPath = []
      }
      // if it is at level one it is a new bnode, but we might have
      // already had other bnodes in this tree, so go through an delete eveything
      // that isn't level zero
      if (this.level==1){
        currentPath = currentPath.filter((v) => { return (v.level==0) })
      }

      // we also want to remove any properties at the current level of THIS property
      // since it is a sibling and unrelated to the structure of this hierarchy
      // so only keep things with a lower level
      currentPath = currentPath.filter((v) => { return (v.level<this.level) })

      let currentUris = currentPath.map((v) => { return v.propertyURI })

      // don't duplicate property levels, if that is possible
      if (currentUris.indexOf(this.structure.propertyURI) == -1){
        currentPath.push({level: this.level, propertyURI: this.structure.propertyURI})
      }


      return currentPath
    },

    plusOne: function(val){
     return val + 1
   },




    // prettifyXml: uiUtils.prettifyXml,



    // showDupeRemove: function(){

    //   let noControls = [
    //     'http://id.loc.gov/ontologies/bibframe/hasInstance',
    //     'http://id.loc.gov/ontologies/bibframe/instanceOf',
    //     'http://id.loc.gov/ontologies/bibframe/hasItem'
    //   ]

    //   if (noControls.indexOf(this.structure.propertyURI)>-1){
    //     return false
    //   }

    //   return true


    // },


    // toggleDebug: function(){

    //   if (this.displayDebug){this.displayDebug=false}else{this.displayDebug=true}

    // },

    // duplicateProperty: function(){

    //   this.$store.dispatch("duplicateProperty", { self: this, id: this.profileCompoent, profile:this.profileName }).then(() => {

    //   })

    // },


    // removeProperty: function(){


    //   const answer = window.confirm('Are you sure you want to remove the property?')
    //   if (answer) {
    //     this.$store.dispatch("removeProperty", { self: this, id: this.profileCompoent, profile:this.profileName }).then(() => {

    //     })

    //   } else {

    //     return false

    //   }






    // },





  }



};
</script>

<style scoped>
.inline-mode{
  background-color: white;
  display: inline;
  border: none !important;

}


div.SIMPLE.level-0,
div.LITERAL.level-0,
div.COMPLEX.level-0,
[class*="compact-"].component.level-0{
  width: 100%;
  display: flex;
}

.child-component {
  margin-bottom: 0px;
}

div.LITERAL.level-0 :deep(div.lookup-fake-input) {
  flex: 1 1 auto;
}

div.REF[class*="compact-"],
div.REF[class*="compact-"] > :deep(*),
div.REF[class*="compact-"] > * > :deep(*),
div.REF[class*="compact-"] > * > * > :deep(*)
{
  border: none;
}


div.REF.level-0[class*="compact-"],
div.REF.level-0[class*="compact-"] div {
  outline: solid 1px oklch(from var(--section-tint, rgb(210, 210, 210)) calc(l - 0.05) c h / 1);
}
div[class*="compact-"] > .child-component:not(:first-child)
{
  outline: solid 1px oklch(from var(--section-tint, rgb(210, 210, 210)) calc(l - 0.05) c h / 1);
}

div.RDFTYPE.level-0[class*="compact-"] > div.rdf-type-selector {
  flex: 1 1 auto;
}

div.component[class*="compact-"] > * > :deep(select) ,
div.component[class*="compact-"] > :deep(select) {
  max-width: 100%;
  min-width: fit-content;
  flex: 0 1 20% !important;
}


/* MARC input results visible */
div.REF.component[class*="compact-"]  > div.level-1 > .COMPLEX.level-2 > :deep(form) {
  height: unset;
}

div.REF[class*="compact-"] div.REF {
  display: flex;
  flex: 1 1 auto;
}

div.REF[class*="compact-"]  div.COMPLEX {
  flex: 1 1 48%;
}
div.REF[class*="compact-"]  div.SIMPLE {
  flex: 1 1 32%;
}

div.REF[class*="compact-"]  div.LITERAL {
  flex: 1 1 auto;
}

div.REF[class*="compact-"]  select + div.LITERAL {
  flex: 1 1 50%;
}

div[class*="compact-"].LITERAL.level-1:has(+ div.REF.level-1){
  flex: 1 1 30%;
}

div.LITERAL[class*="compact-"].level-1 + div.REF.level-1:has(> div.LITERAL.level-2):nth-child(2) {
  flex: 1 1 50%;
}

/* non-sort */
div[class*="compact-"] > div.REF.level-1 > div.REF.level-2 > :deep(div.LITERAL:has( > div > div > div > form > select)),
div.component[class*="compact-"] > :deep(div.LITERAL:nth-child(2):has( > div > div > div > form > select)),
div[class*="compact-"] > div.LITERAL.level-1:first-child:has( > div > div > div > form > select){
  flex: 0 1 20% !important;
}

/* complex titles */
div.component[class*="compact-"]:has(> :nth-child(5)){
  flex-wrap: wrap;
}
div.component[class*="compact-"] > div.level-1:nth-child(n+3) {
  flex: 1 1 45%;
  min-width: 0;
  /* overflow-x: auto; */
}


:deep() .lookup-fake-input-entities {
  align-content: center;
}


/* Classification & provision activity, drop down and literals on one line, simple on the next */
div[id*="id_loc_gov_ontologies_bibframe_provisionActivity__provision_activity"].component[class*="compact-"] > :deep(select),
div[id*="Work_id_loc_gov_ontologies_bibframe_classification__classification_numbers"].component[class*="compact-"] > :deep(select){
  width: 100% !important;
}
div[id*="id_loc_gov_ontologies_bibframe_provisionActivity__provision_activity"].component[class*="compact-"] > :deep(div.LITERAL),
div[id*="Work_id_loc_gov_ontologies_bibframe_classification__classification_numbers"].REF.level-0[class*="compact-"] > :deep(div.LITERAL) {
  flex: 1 0 48%;
}
div[id*="id_loc_gov_ontologies_bibframe_provisionActivity__provision_activity"].component[class*="compact-"] > :deep(div.level-1:nth-child(n+4)),
div[id*="Work_id_loc_gov_ontologies_bibframe_classification__classification_numbers"].REF.level-0[class*="compact-"] > :deep(div.level-1:nth-child(n+4))
{
  flex: 1 1 30%;
}

/* contents. Literal is on it's own line, other's share line */
div[id*="Work_id_loc_gov_ontologies_bibframe_tableOfContents__contents"][class*="compact-"]{
  flex-wrap: wrap;
}
div[id*="Work_id_loc_gov_ontologies_bibframe_tableOfContents__contents"][class*="compact-"] > div.LITERAL.level-1.child-component {
  flex: 1 1 100% !important;
}
div[id*="Work_id_loc_gov_ontologies_bibframe_tableOfContents__contents"].component[class*="compact-"] > div.SIMPLE.level-1.child-component,
div[id*="Work_id_loc_gov_ontologies_bibframe_tableOfContents__contents"][class*="compact-"] > div.level-1.child-component {
  flex: 1 1 45%;
}

/* input transcribed series */
div[id*="Work_id_loc_gov_ontologies_bibframe_relation__input_transcribed_series"][class*="compact-"] > div.REF.level-1:first-child{
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

div[id*="Work_id_loc_gov_ontologies_bibframe_relation__input_transcribed_series"].level-0[class*="compact-"]  > div.REF.level-1:nth-child(2),
div[id*="Work_id_loc_gov_ontologies_bibframe_relation__input_transcribed_series"][class*="compact-"] > div.LITERAL.level-1.child-component,
div[id*="Work_id_loc_gov_ontologies_bibframe_relation__input_transcribed_series"][class*="compact-"] > div.REF.level-1.child-component > div.LITERAL.level-2 {
  flex: 1 1 32%;
}


div[id*="Work_id_loc_gov_ontologies_bibframe_relation__input_transcribed_series"][class*="compact-"] > div.REF.level-1 > div.REF.level-2:nth-child(1) {
  width: 100%;
}
div[id*="Work_id_loc_gov_ontologies_bibframe_relation__input_transcribed_series"][class*="compact-"] > div.REF.level-1 > div.REF.level-2.component.child-component:nth-child(3) {
  width: 48%;
}

/* Related work not held by LC  */
div[id*="Work_id_loc_gov_ontologies_bibframe_relation__related_work_not_held_by_lc"][class*="compact-"] {
  flex-wrap: wrap;
}
div[id*="Work_id_loc_gov_ontologies_bibframe_relation__related_work_not_held_by_lc"][class*="compact-"] > div.REF {
  width: 100%;
}
div[id*="Work_id_loc_gov_ontologies_bibframe_relation__related_work_not_held_by_lc"][class*="compact-"] > div.REF:nth-child(n+1) {
  width: 48%;
}
div[id*="Work_id_loc_gov_ontologies_bibframe_relation__related_work_not_held_by_lc"][class*="compact-"] > div.REF > div.LITERAL {
  flex: 1 1 48%;
}
/* Event/Capture & dissertation */
div[id*="Work_id_loc_gov_ontologies_bibframe_dissertation__dissertation"][class*="compact-"],
div[id*="Work_id_loc_gov_ontologies_bibframe_capture__eventcapture"][class*="compact-"] {
  flex-wrap: wrap;
}
div[id*="Work_id_loc_gov_ontologies_bibframe_dissertation__dissertation"][class*="compact-"] > div.child-component,
div[id*="Work_id_loc_gov_ontologies_bibframe_capture__eventcapture"][class*="compact-"] > div.child-component {
  flex: 1 1 48%;
}

div.LITERAL.level-0[class*="compact-"] > :deep(div.lookup-fake-input) {
  width: 100%;
}

div.level-0[class*="expand"] > div:nth-last-child(2){
  width: 97%;
  display: inline-block;
}

div.level-0[class*="expand"]> div.button-holder{
  width: 3%;
  display: inline-block;
  outline: unset !important;
  vertical-align: top;
  border-top: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')") !important;
}

div.HIDE {
  display: none !important;
}

/* @container edit-panel-work (width < 500px) {
  div.REF.compact,
  div.REF.compact > *:not(.button-holder),
  .component.level-0.compact,
  div.REF.level-0.component.compact,
  div.REF.component.level-0.compact {
    display: inline-block !important;
    flex: unset !important;
    width: 100% !important;
    outline: unset !important;
  }

  div.component.compact > div.REF.level-1 > select {
    width: 100% !important;
  }

  .child-component.compact {
    border-left: none;
  }

  div.REF.compact{
    border-top: none;
  }
  .button-holder {
    border: none;
  }

  div.compact.level-0 > :deep(form),
  div.compact.level-0 > div:nth-last-child(2){
    width: 97% !important;
  }

  div.compact.level-0 > div.button-holder{
    width: 3% !important;
    outline: unset !important;
    display: inline-block;
    vertical-align: top;
    border-top: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')") !important;
  }
  div.compact.level-0:not(:nth-child(n+3)){
    display:flex !important;
  }

  .component {
    border: solid 1px oklch(from var(--section-tint, rgb(210, 210, 210)) calc(l - 0.05) c h / 1) !important;
    border-top: none !important;
  }
  .component > :deep(select),
  .component :deep(.lookup-fake-input) {
    border-top: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')") !important;
  }

} */

:deep() .lookup-fake-input{
  height: 100%;
}

.button-holder {
  /* height: fit-content; */
  display: inline-grid;
  place-items: center;
  /* border-top: solid 1px oklch(from var(--section-tint, rgb(210, 210, 210)) calc(l - 0.05) c h / 1) !important;
  border-left: solid 1px oklch(from var(--section-tint, rgb(210, 210, 210)) calc(l - 0.05) c h / 1) !important;
  margin-top: -1px;
  margin-left: -1px; */
  outline: solid 1px oklch(from var(--section-tint, rgb(210, 210, 210)) calc(l - 0.05) c h / 1) !important;

}
.button-holder > span{
  margin: 0px;
}


.inline-icon {
  font-size: 15px;
  cursor: pointer;
  margin-right: 15px;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  opacity: .4;
}

.inline-icon.work:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-work')");
}

.inline-icon.instance:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-instance')");
}

.inline-icon.item:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-item')");
}

.inline-icon.preview:hover {
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-component-label-color')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-background-color-work')");
}

</style>

<style>

div.component > form,
div.component > * > form {
  height: 100%;
  width: 100%;
  align-content: center;
}

</style>
