<template>


  <div v-if="componentType != 'META'" :style="'background-color: ' + returnBackgroundColor + ';'" :class="[{'component': (level == 0), 'inline-mode': (preferenceStore.returnValue('--b-edit-main-splitpane-edit-inline-mode'))}]" :id="`edit_${parentId}_${id}`">
    
    
    <!-- {{guid}} -- {{componentType}} ({{level}}) {{propertyPath}} id: {{id}} -->
     <!-- {{ structure.preferenceId }} {{ guid }} -->
     <!-- {{ preferenceId }} -->
       <!-- {{ userModified }} -->
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

    <!-- {{structure}} -->

  </div>


</template>

<script>


//   <div class="main-component-container">



//     <div v-if="nested == false" :id="profileName+'|'+profileCompoent" style="display: flex; position: relative;">

//       <div style="flex:15;">


//           <template v-else>


//             <EditMetaComponent v-if="returnLookupType(structure) == 'meta'"
//               :isMini="isMini"
//               :ptGuid="ptGuid"
//               :parentURI="parentURI"
//               :nested="nested"
//               :structure="structure"
//               :profileName="profileName"
//               :level="levelPlusOne"
//               :propertyPath="buildPropertyPath(propertyPath)"

//               :profileCompoent="profileCompoent"
//               :parentStructureObj="parentStructureObj"
//               :parentStructure="parentStructure"
//               :activeTemplate="activeTemplate" >
//             </EditMetaComponent>
//             <!-- <EditAdminComponent v-else-if="returnLookupType(structure) == 'admin'" :ptGuid="ptGuid" :parentURI="parentURI" :nested="nested" :structure="structure" :profileName="profileName" :profileCompoent="profileCompoent" :parentStructureObj="parentStructureObj" :parentStructure="parentStructure" :activeTemplate="activeTemplate" ></EditAdminComponent> -->
//             <EditLiteralComponent v-else-if="structure.type == 'literal' || structure.type == 'literal-lang'"
//               :key="useKey"
//               :isMini="isMini"
//               :ptGuid="ptGuid"
//               :parentURI="parentURI"
//               :nested="nested"
//               :structure="structure"
//               :level="levelPlusOne"
//               :propertyPath="buildPropertyPath(propertyPath)"

//               :profileName="profileName"
//               :profileCompoent="profileCompoent"
//               :parentStructureObj="parentStructureObj"
//               :parentStructure="parentStructure"
//               :activeTemplate="activeTemplate" >
//             </EditLiteralComponent>

//             <EditSimpleLookupComponent v-else-if="returnLookupType(structure) == 'simple'"
//               :ptGuid="ptGuid"
//               :key="useKey"
//               :isMini="isMini"
//               :parentURI="parentURI"
//               :structure="structure"
//               :parentStructureObj="parentStructureObj"
//               :parentStructure="parentStructure"
//               :nested="nested"
//               :level="levelPlusOne"
//               :propertyPath="buildPropertyPath(propertyPath)"

//               :profileName="profileName"
//               :profileCompoent="profileCompoent"
//               :activeTemplate="activeTemplate" >
//             </EditSimpleLookupComponent>

//             <EditComplexLookupComponent v-on="$listeners" v-else-if="returnLookupType(structure) == 'complex'"
//               :key="useKey"
//               :isMini="isMini"
//               @updated="forceUpdate"
//               :ptGuid="ptGuid"
//               :parentURI="parentURI"
//               :structure="structure"
//               :parentStructureObj="parentStructureObj"
//               :parentStructure="parentStructure"
//               :nested="nested"
//               :level="levelPlusOne"
//               :propertyPath="buildPropertyPath(propertyPath)"

//               :profileName="profileName"
//               :profileCompoent="profileCompoent"
//               :activeTemplate="activeTemplate"  >
//             </EditComplexLookupComponent>

//            <EditTemplateRefComponent v-on="$listeners" v-else-if="structure.valueConstraint.valueTemplateRefs.length > 0"
//               :isMini="isMini"
//               :key="useKey"
//               :ptGuid="ptGuid"
//               :parentURI="parentURI"
//               :structure="structure"
//               :parentStructureObj="parentStructureObj"
//               :parentStructure="parentStructure"
//               :nested="nested"
//               :level="levelPlusOne"
//               :propertyPath="buildPropertyPath(propertyPath)"

//               :profileName="profileName"
//               :profileCompoent="profileCompoent"
//               :activeTemplate="activeTemplate">
//             </EditTemplateRefComponent>



//           </template>





//       </div>

//       <template v-if="settingsLeftMenuEnriched==false">
//         <div class="property-button-container" v-if="showDupeRemove()">

//           <button tabindex="-1" class="property-button property-duplicate simptip-position-left" :data-tooltip="labels.propertyDuplicateTip" @click="duplicateProperty">{{labels.propertyDuplicateSymbol}}</button>
//           <button tabindex="-1" class="property-button property-remove" @click="removeProperty">{{labels.propertyRemoveSymbol}}</button>

//         </div>
//       </template>

//       <div v-if="settingsDisplayMode!='compact'" class="debug-toggle" style="position: relative; visibility: hidden; color:red; left: -26%;font-size: 0.85em;font-family: monospace;top: 8px; cursor: pointer; height: 0.85em;" @click="toggleDebug">debug</div>



//     </div>



//     <!-- This block renders the recursive componets being sent in from the TemplateRefComponent -->
//     <div v-else>

//         <EditLiteralComponent v-if="structure.type == 'literal' || structure.type == 'literal-lang'"
//           :key="useKey"
//           :isMini="isMini"
//           :ptGuid="ptGuid"
//           :parentURI="parentURI"
//           :activeTemplate="activeTemplate"
//           :nested="nested"
//           :level="levelPlusOne"
//           :propertyPath="buildPropertyPath(propertyPath)"

//           :structure="structure"
//           :profileName="profileName"
//           :profileCompoent="profileCompoent"
//           :parentStructureObj="parentStructureObj"
//           :parentStructure="parentStructure" >

//         </EditLiteralComponent>
//         <EditSimpleLookupComponent v-else-if="returnLookupType(structure) == 'simple'"
//           :key="useKey"
//           :ptGuid="ptGuid"
//           :isMini="isMini"
//           :parentURI="parentURI"
//           :activeTemplate="activeTemplate"
//           :structure="structure"
//           :parentStructureObj="parentStructureObj"
//           :parentStructure="parentStructure"
//           :nested="nested"
//           :level="levelPlusOne"
//           :propertyPath="buildPropertyPath(propertyPath)"

//           :profileName="profileName"
//           :profileCompoent="profileCompoent"  >
//         </EditSimpleLookupComponent>
//         <EditComplexLookupComponent v-on="$listeners" v-else-if="returnLookupType(structure) == 'complex'"
//           :key="useKey"
//           :isMini="isMini" @updated="forceUpdate"
//           :ptGuid="ptGuid"
//           :parentURI="parentURI"
//           :activeTemplate="activeTemplate"
//           :structure="structure"
//           :parentStructureObj="parentStructureObj"
//           :parentStructure="parentStructure"
//           :nested="nested"
//           :level="levelPlusOne"
//           :propertyPath="buildPropertyPath(propertyPath)"

//           :profileName="profileName"
//           :profileCompoent="profileCompoent"   >
//         </EditComplexLookupComponent>
//         <EditTemplateRefComponent v-on="$listeners" v-else-if="structure.valueConstraint.valueTemplateRefs.length > 0"
//           :isMini="isMini"
//           :key="useKey"
//           :ptGuid="ptGuid"
//           :parentURI="parentURI"
//           :activeTemplate="activeTemplate"
//           :structure="structure"
//           :level="levelPlusOne"
//           :propertyPath="buildPropertyPath(propertyPath)"

//           :parentStructureObj="parentStructureObj"
//           :parentStructure="parentStructure"
//           :profileName="profileName"
//           :profileCompoent="profileCompoent" :nested="nested">
//         </EditTemplateRefComponent>



//     </div>


//     <div v-if="nested == false && displayDebug" style="font-family: monospace;width: 69%; background-color: whitesmoke; margin-left: 5%;">

//       <code v-if="structure.xmlSource"><pre>{{prettifyXml(structure.xmlSource)}}</pre></code>
//       <vue-json-pretty
//         :path="'res'"
//         :highlightMouseoverNode="true"
//         :collapsedOnClickBrackets="true"
//         :data="structure"
//         >
//       </vue-json-pretty>

//     </div>




//   </div>



// <!--   <pre>{{JSON.stringify(structure,null,2)}}</pre>
//   <h1>{{nested}}-{{nestedOrder}}-{{nestedOrderType}}</h1>
//   <h1>{{nestedOrderParentType}}</h1> -->



// import EditLiteralComponent from "@/components/EditLiteralComponent.vue";
// import EditSimpleLookupComponent from "@/components/EditSimpleLookupComponent.vue";

// import EditComplexLookupComponent from "@/components/EditComplexLookupComponent.vue";
// import EditMetaComponent from "@/components/EditMetaComponent.vue";
// import EditAdminComponent from "@/components/EditAdminComponent.vue";




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

import short from 'short-uuid'
// const translator = short();
// const short = require('short-uuid');


import Ref from "@/components/panels/edit/fields/Ref.vue";
import LookupComplex from "@/components/panels/edit/fields/LookupComplex.vue";
import LookupSimple from "@/components/panels/edit/fields/LookupSimple.vue";
import Literal from "@/components/panels/edit/fields/Literal.vue";




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



    // ...mapState(useProfileStore, ['returnStructureByGUID2']),



    // ...mapState(usePreferenceStore, ['styleDefault']),

    // gives read access to this.count and this.double
    // ...mapState(usePreferenceStore, ['profilesLoaded']),
    // ...mapState(useProfileStore, ['profilesLoaded','activeProfile']),

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


      let id = this.preferenceId
      
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


      
      return 'white'

    }




  },



  // computed: mapState({

  //   settingsDisplayMode: 'settingsDisplayMode',
  //   settingsLeftMenuEnriched: 'settingsLeftMenuEnriched',

  // }),


  methods: {

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


</style>
