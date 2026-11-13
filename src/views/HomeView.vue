<template>
  
  <splitpanes class="default-theme" horizontal>

    <pane class="header"  :size="returnPixleAsPercent(preferenceStore.returnValue('--n-edit-main-splitpane-nav-height',true))">
      <Nav :disable="['View']" />
    </pane>

    <pane> 
    </pane>
  </splitpanes>


</template>



<script>

  import { Splitpanes, Pane } from 'splitpanes'
  import 'splitpanes/dist/splitpanes.css'
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { useProfileStore } from '@/stores/profile'

  import { mapStores, mapState, mapWritableState } from 'pinia'

  import Nav from "@/components/panels/nav/Nav.vue";
  import navPaneHeightMixin from '@/lib/navPaneHeightMixin'


  export default {
    components: { Splitpanes, Pane, Nav },
    mixins: [navPaneHeightMixin], // keeps the nav pane height right when the window is resized
    data() {
      return {

      

      }
    },    
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(usePreferenceStore),

    },
    methods: {

    },
    props: {

    }  


  }

</script>

