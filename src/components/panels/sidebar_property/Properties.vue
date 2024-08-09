<script>
  import { useProfileStore } from '@/stores/profile'
  import { usePreferenceStore } from '@/stores/preference'
  import { AccordionList, AccordionItem } from "vue3-rich-accordion";
  // import "vue3-rich-accordion/accordion-library-styles.css";
  import draggable from 'vuedraggable'


  import { mapStores, mapState, mapWritableState } from 'pinia'

  export default {
    data() {
      return {
        hideProps:[
          //'http://id.loc.gov/ontologies/bibframe/hasInstance',
          //'http://id.loc.gov/ontologies/bibframe/instanceOf',
          'http://id.loc.gov/ontologies/bibframe/hasItem'
        ]

      }
    },
    components: {
      AccordionList,
      AccordionItem,
      draggable


    },

    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,usePreferenceStore),
      // // gives read access to this.count and this.double
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','rtLookup', 'activeComponent']),
      ...mapState(usePreferenceStore, ['styleDefault']),

      ...mapWritableState(useProfileStore, ['activeComponent']),


    },


    methods: {

      returnTemplateTypes: function(templates){

          let titles = []
          for (let t of templates){
              if (this.rtLookup[t] && this.rtLookup[t].resourceLabel){
                  titles.push(this.rtLookup[t].resourceLabel)
              }
          }

          return titles


      },



    },

    mounted() {



    }
  }



</script>

<template>

  <template  v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-accordion') == true">


    <AccordionList  :open-multiple-items="false">

      <template v-for="profileName in activeProfile.rtOrder" :key="profileName">

      <!-- <div v-for="profileName in activeProfile.rtOrder" class="sidebar" :key="profileName"> -->

        <template v-if="activeProfile.rt[profileName].noData != true">
                <AccordionItem style="color: white;" :id="'accordion_'+profileName" default-closed>
                  <template #summary>

                    <div :class="{'container-type-icon': true }">
                            <svg v-if="profileName.split(':').slice(-1)[0] == 'Work'" width="1.5em" height="1.1em" version="1.1" xmlns="http://www.w3.org/2000/svg">
                              <circle :fill="preferenceStore.returnValue('--c-general-icon-work-color')" cx="0.55em" cy="0.6em" r="0.45em"/>
                            </svg>
                            <svg v-if="profileName.includes('Instance')" :fill="preferenceStore.returnValue('--c-general-icon-instance-color')" style="margin-right: 7px;" width="18px" height="18px" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                             <path  d="m5 50l45-45 45 45-45 45z"/>
                            </svg>
                            <svg v-if="profileName.includes(':Item')"  viewBox="0 -32 50 72" version="1.1" xmlns="http://www.w3.org/2000/svg">
                              <rect width="40px" height="40px" class="item-icon" />
                            </svg>
                            <svg  v-if="profileName.endsWith(':Hub')" version="1.1" viewBox="0 -20 100 100" xmlns="http://www.w3.org/2000/svg">
                              <path fill="royalblue" d="m62.113 24.66 1.9023-15.238 18.875 32.691-7.5469 20.004 15.238 1.9023-32.691 18.875-20.004-7.5469-1.9023 15.238-18.875-32.691 7.5469-20.004-15.238-1.9023 32.691-18.875zm-17.684 15.695-4.0781 15.215 15.215 4.0781 4.0781-15.215z" fill-rule="evenodd"/>
                            </svg>
                            <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Work'">{{$t("message.wordWork")}}</span>
                            <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0].indexOf('Instance') > -1">
                              <template v-if="activeProfile.rt[profileName]['@type'] && activeProfile.rt[profileName]['@type'] == 'http://id.loc.gov/ontologies/bflc/SecondaryInstance'">Secondary</template>
                              {{$t("message.wordInstance")}}
                            </span>
                            <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0].indexOf('Item')>-1">{{$t("message.wordItem")}}</span>
                            <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0].indexOf('Hub')>-1">{{$t("message.wordHub")}}</span>
                    </div>

                  </template>



                  <ul class="sidebar-property-ul" role="list">



                          <draggable
                            v-model="activeProfile.rt[profileName].ptOrder"
                            group="people"
                            @start="drag=true"
                            @end="drag=false"
                            item-key="id">
                            <template #item="{element}">
                              <template v-if="!activeProfile.rt[profileName].pt[element].deleted && !hideProps.includes(activeProfile.rt[profileName].pt[element].propertyURI)">
                                <li @click.stop="activeComponent = activeProfile.rt[profileName].pt[element]" class="sidebar-property-li sidebar-property-li-empty">
                                  <a href="#" @click.stop="activeComponent = activeProfile.rt[profileName].pt[element]" class="sidebar-property-ul-alink">
                                      <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-number-labels')">{{activeProfile.rt[profileName].ptOrder.indexOf(element)}}</template>
                                      {{activeProfile.rt[profileName].pt[element].propertyLabel}}
                                  </a>
                                  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-show-types')">
                                    <template v-if="activeProfile.rt[profileName].pt[element].valueConstraint.valueTemplateRefs.length>1">
                                        <ul class="sidebar-property-ul sidebar-property-ul-sub-ul">
                                            <li class="sidebar-property-li sidebar-property-li-sub-li" :key="t" v-for="t in returnTemplateTypes(activeProfile.rt[profileName].pt[element].valueConstraint.valueTemplateRefs)">
                                              <a tabindex="-1" href="#" class="sidebar-property-ul-alink sidebar-property-ul-alink-sublink" >{{t}}</a>
                                            </li>
                                        </ul>
                                    </template>
                                  </template>
                                </li>
                              </template>
                             </template>
                          </draggable>





<!--

                          <li v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" @click.stop="activeComponent = activeProfile.rt[profileName].pt[profileCompoent]" :key="profileCompoent" class="sidebar-property-li sidebar-property-li-empty" >
                                <a href="#" @click.stop="activeComponent = activeProfile.rt[profileName].pt[profileCompoent]" class="sidebar-property-ul-alink">
                                    <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-number-labels')">{{idx}}</template>
                                    {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                                </a>
                                <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-show-types')">
                                  <template v-if="activeProfile.rt[profileName].pt[profileCompoent].valueConstraint.valueTemplateRefs.length>1">
                                      <ul class="sidebar-property-ul sidebar-property-ul-sub-ul">
                                          <li class="sidebar-property-li sidebar-property-li-sub-li" :key="t" v-for="t in returnTemplateTypes(activeProfile.rt[profileName].pt[profileCompoent].valueConstraint.valueTemplateRefs)">
                                            <a tabindex="-1" href="#" class="sidebar-property-ul-alink sidebar-property-ul-alink-sublink" >{{t}}</a>
                                          </li>
                                      </ul>
                                  </template>
                                </template>
                        </li> -->



                    </ul>



                </AccordionItem>




        </template>
      </template>
    </AccordionList>






  </template>
  <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-accordion') == false">

    <div v-for="profileName in activeProfile.rtOrder" class="sidebar" :key="profileName">

      <div v-if="activeProfile.rt[profileName].noData != true">
          <div :class="{'container-type-icon': true, 'sidebar-spacer': (profileName.split(':').slice(-1)[0] == 'Instance' || profileName.split(':').slice(-1)[0] == 'Item')}">
                  <svg v-if="profileName.split(':').slice(-1)[0] == 'Work'" width="1.5em" height="1.1em" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <circle :fill="preferenceStore.returnValue('--c-general-icon-work-color')" cx="0.55em" cy="0.6em" r="0.45em"/>
                  </svg>
                  <svg v-if="profileName.includes('Instance')" :fill="preferenceStore.returnValue('--c-general-icon-instance-color')" width="20px" height="20px" version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                   <path  d="m5 50l45-45 45 45-45 45z"/>
                  </svg>
                  <svg v-if="profileName.includes(':Item')"  viewBox="0 -32 50 72" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40px" height="40px" class="item-icon" />
                  </svg>
                  <svg  v-if="profileName.endsWith(':Hub')" version="1.1" viewBox="0 -20 100 100" xmlns="http://www.w3.org/2000/svg">
                    <path fill="royalblue" d="m62.113 24.66 1.9023-15.238 18.875 32.691-7.5469 20.004 15.238 1.9023-32.691 18.875-20.004-7.5469-1.9023 15.238-18.875-32.691 7.5469-20.004-15.238-1.9023 32.691-18.875zm-17.684 15.695-4.0781 15.215 15.215 4.0781 4.0781-15.215z" fill-rule="evenodd"/>
                  </svg>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Work'">{{$t("message.wordWork")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Instance'">{{$t("message.wordInstance")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Item'">{{$t("message.wordItem")}}</span>
                  <span class="sidebar-header-text" v-if="profileName.split(':').slice(-1)[0] == 'Hub'">{{$t("message.wordHub")}}</span>
          </div>

          <ul class="sidebar-property-ul" role="list">

                          <draggable
                            v-model="activeProfile.rt[profileName].ptOrder"
                            group="people"
                            @start="drag=true"
                            @end="drag=false"
                            item-key="id">
                            <template #item="{element}">

                              <li @click.stop="activeComponent = activeProfile.rt[profileName].pt[element]" class="sidebar-property-li sidebar-property-li-empty">

                                <a href="#" @click.stop="activeComponent = activeProfile.rt[profileName].pt[element]" class="sidebar-property-ul-alink">
                                    <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-number-labels')">{{activeProfile.rt[profileName].ptOrder.indexOf(element)}}</template>
                                    {{activeProfile.rt[profileName].pt[element].propertyLabel}}
                                </a>
                                <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-show-types')">
                                  <template v-if="activeProfile.rt[profileName].pt[element].valueConstraint.valueTemplateRefs.length>1">
                                      <ul class="sidebar-property-ul sidebar-property-ul-sub-ul">
                                          <li class="sidebar-property-li sidebar-property-li-sub-li" :key="t" v-for="t in returnTemplateTypes(activeProfile.rt[profileName].pt[element].valueConstraint.valueTemplateRefs)">
                                            <a tabindex="-1" href="#" class="sidebar-property-ul-alink sidebar-property-ul-alink-sublink" >{{t}}</a>
                                          </li>
                                      </ul>
                                  </template>
                                </template>
                              </li>
                             </template>
                          </draggable>





<!--               <li v-for="(profileCompoent,idx) in activeProfile.rt[profileName].ptOrder" @click.stop="activeComponent = activeProfile.rt[profileName].pt[profileCompoent]" :key="profileCompoent" class="sidebar-property-li sidebar-property-li-empty" >
                    <a href="#" @click.stop="activeComponent = activeProfile.rt[profileName].pt[profileCompoent]" class="sidebar-property-ul-alink">
                        <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-number-labels')">{{idx}}</template>
                        {{activeProfile.rt[profileName].pt[profileCompoent].propertyLabel}}
                    </a>
                    <template v-if="preferenceStore.returnValue('--b-edit-main-splitpane-properties-show-types')">
                      <template v-if="activeProfile.rt[profileName].pt[profileCompoent].valueConstraint.valueTemplateRefs.length>1">
                          <ul class="sidebar-property-ul sidebar-property-ul-sub-ul">
                              <li class="sidebar-property-li sidebar-property-li-sub-li" :key="t" v-for="t in returnTemplateTypes(activeProfile.rt[profileName].pt[profileCompoent].valueConstraint.valueTemplateRefs)">
                                <a tabindex="-1" href="#" class="sidebar-property-ul-alink sidebar-property-ul-alink-sublink" >{{t}}</a>
                              </li>
                          </ul>
                      </template>
                    </template>
            </li>
 -->




        </ul>


      </div>
    </div>

  </template>









</template>

<style>
  .accordion-list {
    width: 100%;
    background: transparent !important;
  }
  .accordion-list .accordion-item {
    margin-top: 6px;
    --content-height: 0px;
    background-color: transparent !important;

    height: calc(0px + 26px);
    overflow: hidden;
    transition: height 300ms ease-in-out;
    border: none;
    font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");


  }
  .accordion-list .accordion-item > .accordion-item__summary {
    padding: 0px;
    cursor: pointer;
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-color')") !important;
    display: flex;
    justify-content: space-between;
    align-items: center;


    line-height: 24px;
    transition: color 300ms ease-in-out;


  }
  .accordion-list .accordion-item > .accordion-item__summary:hover {
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-color')") !important;
    transition: color 300ms ease-in-out;
  }
  .accordion-list .accordion-item > .accordion-item__summary > .accordion-item__summary-icon {
    transition: transform 300ms ease-in-out;
  }
  .accordion-list .accordion-item > .accordion-item__summary > .accordion-item__summary-icon--default::before {
    content: "▲";
    line-height: 22px;
  }
  .accordion-list .accordion-item--open {
    height: calc(var(--summary-height) + var(--content-height) + 51px);
    background: var(--acco-lightest);
  }
  .accordion-list .accordion-item--open > .accordion-item__summary > .accordion-item__summary-icon {
    transform: rotate(180deg);
  }
  .accordion-list .accordion-item--open > .accordion-item__summary {
    background: var(--acco-light);
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-color')") !important;
    border-bottom: 1px solid var(--acco-dark);
  }
  .accordion-list .accordion-item--disabled > .accordion-item__summary {
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-color')") !important;
    cursor: default;
  }
  .accordion-list .accordion-item--disabled > .accordion-item__summary:hover {
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-color')") !important;
  }
  .accordion-list .accordion-item > .accordion-item__content {
    background-color: var(--acco-lightest);
    border-top: none;
    padding: 12px;
  }
</style>

<style scoped>


.sidebar{
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");
}


.container-type-icon{
  color: #ffffff;
  width: inherit;
  text-align: left;
  display: flex;
}


.sidebar-header-text{
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size', true) + 0.25  + 'em'");
  font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-family')");
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-color')") !important;

}

.sidebar-property-ul{

  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");
  margin-left: 0;
  padding-left: 0;
  font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-family')");
}
.sidebar-property-li{
  cursor: pointer;
  padding-left: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size', true) / 2  + 'em'");
  list-style: none;
/*  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");*/
}

.sidebar-property-li:hover{
  background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-highlight-background-color')");
}

.sidebar-property-li-empty::before{
  content: "• ";
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-empty-indicator-color')") !important;

}

.sidebar-property-ul-alink{
  text-decoration: none;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-color')") !important;

}

.sidebar-property-ul-sub-ul{
  padding-left: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size', true) / 1  + 'em'");
}

.sidebar-property-li-sub-li::before{
  content: "\200B";

}
.sidebar-property-ul-alink-sublink{
  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size', true) - 0.15  + 'em'") !important;
/*  font-size: calc((v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')")) - (0.1em) );*/
/*  font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");*/



/*    font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-properties-font-size')");*/

}

.sidebar-spacer{
  padding-top: 1em;
  margin-top: 1em;
  padding-bottom: 1em;
  border-top: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-properties-font-color')");

}


.item-icon{
  fill:v-bind("preferenceStore.returnValue('--c-general-icon-item-color')");
  stroke-width:0.5;
  stroke:rgb(0,0,0)
}




</style>
