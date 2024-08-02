<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { mapStores, mapState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'

  import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";


  import utilsNetwork from '@/lib/utils_network';


  export default {
    components: {
      VueFinalModal,
      AuthTypeIcon,

    },
    props: {

    },

    data() {
      return {
        modeSelect: null,
        searchValueLocal: null,
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

    },

    methods: {
        updated: function(){
        },
    },

    mounted() {
      console.log("mounted")
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
      class="authority-modal"
      content-class="authority-modal-content"
      >

    </VueFinalModal>
</template>