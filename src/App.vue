<script>
import { RouterLink, RouterView } from "vue-router";

import LoadingModal from "@/components/general/LoadingModal.vue";
import PreferenceModal from "@/components/general/PreferenceModal.vue";
import LoginModal from "@/components/panels/nav/LoginModal.vue";
import ScriptshifterConfigModal from "@/components/panels/edit/modals/ScriptshifterConfigModal.vue";
import DiacriticsConfigModal from "@/components/panels/edit/modals/DiacriticsConfigModal.vue";
import TextMacroModal from "@/components/panels/edit/modals/TextMacroModal.vue";
import NonLatinBulkModal from "@/components/panels/edit/modals/NonLatinBulkModal.vue";
import NonLatinAgentModal from "@/components/panels/edit/modals/NonLatinAgentModal.vue";
import FieldColorsModal from "@/components/panels/edit/modals/FieldColorsModal.vue";
import HubStubCreateModal from "@/components/panels/edit/modals/HubStubCreateModal.vue";
import NacoStubCreateModal from "@/components/panels/edit/modals/NacoStubCreateModal.vue";





import ShelfListingModal from "@/components/panels/edit/modals/ShelfListing.vue";
import AutoDeweyModal from "./components/panels/edit/modals/AutoDeweyModal.vue";
import UpdateAvailableModal from "@/components/general/UpdateAvailableModal.vue";



import { useConfigStore } from '@/stores/config'
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'


import { mapStores, mapState, mapWritableState } from 'pinia'



export default {
  components: {

    LoadingModal,
    PreferenceModal,
    LoginModal,
    ScriptshifterConfigModal,
    ShelfListingModal,
    DiacriticsConfigModal,
    UpdateAvailableModal,
    AutoDeweyModal,
    TextMacroModal,
    NonLatinBulkModal,
    NonLatinAgentModal,
    FieldColorsModal,
    HubStubCreateModal,
    NacoStubCreateModal

  },
  data() {
    return {
      count: 0,
    }
  },
  computed: {
    // other computed properties
    // ...
    // gives access to this.counterStore and this.userStore
    ...mapStores(useConfigStore, useProfileStore, usePreferenceStore),
    // // gives read access to this.count and this.double
    ...mapState(useProfileStore, ['profilesLoaded', 'showValidateModal','profilesLoaded', 'showPostModal', 'showItemInstanceSelection', 'isTestEnv']),
    ...mapWritableState(useProfileStore, ['showShelfListingModal','showHubStubCreateModal', 'showAutoDeweyModal', 'showNacoStubCreateModal']),

    ...mapState(usePreferenceStore, ['showPrefModal','catCode']),
    ...mapWritableState(usePreferenceStore, ['showLoginModal','showScriptshifterConfigModal','showDiacriticConfigModal','showTextMacroModal','showFieldColorsModal']),
    ...mapWritableState(useConfigStore, ['showUpdateAvailableModal','showNonLatinBulkModal','showNonLatinAgentModal']),


    showLocalPreferenceModal: {
      get() {
        return this.showPrefModal
      },
      set() {
        this.preferenceStore.togglePrefModal()
      }
    }


  },


  methods: {
    increment() {
      this.count++
    }
  },

  async mounted() {
    console.log("??", this.configStore.versionMajor)
//     const configStore = useConfigStore()
// const profileStore = useProfileStore()

    console.log("starting preferenceStore")
    this.preferenceStore.initalize()
    console.log("finished preferenceStore")
    // this.profileStore.buildProfiles()
    //window.setTimeout(async ()=>{

    if (!this.catCode){
      this.showLoginModal = true
    }
    console.log("buildingProfiles")
    await this.profileStore.buildProfiles()
      //let profile =  this.profileStore.loadNewTemplate('Monograph','mattmatt')
      //this.profileStore.activeProfile = profile

      // console.log('profile',profile)

      // window.setInterval(()=>{
      //   this.profileStore.activeProfile.rt['lc:RT:bf2:Monograph:Work'].pt['id_loc_gov_ontologies_bibframe_title__title_information']['userValue']['@root'] = this.profileStore.activeProfile.rt['lc:RT:bf2:Monograph:Work'].pt['id_loc_gov_ontologies_bibframe_title__title_information']['userValue']['@root'] + ':)'
      // },1000)

    //},500)


    this.configStore.checkVersionOutOfDate()



  }
}




</script>

<template>
  <RouterView />
  <LoadingModal/>

  <!-- Prevents it from complaining when loading and not displaying -->
  <template v-if="showLocalPreferenceModal==true">
    <PreferenceModal v-model="showLocalPreferenceModal" />
  </template>
  <template v-if="showLoginModal==true">
    <LoginModal v-model="showLoginModal" />
  </template>
  <template v-if="showScriptshifterConfigModal==true">
    <ScriptshifterConfigModal v-model="showScriptshifterConfigModal" />
  </template>
  <template v-if="showDiacriticConfigModal==true">
    <DiacriticsConfigModal v-model="showDiacriticConfigModal" />
  </template>


  <template v-if="showShelfListingModal==true">
    <ShelfListingModal v-model="showShelfListingModal"  />
  </template>
  <template v-if="showUpdateAvailableModal==true && !isTestEnv()"> <!-- Ignore for testing-->
    <UpdateAvailableModal v-model="showUpdateAvailableModal"  />
  </template>
  <template v-if="showTextMacroModal==true">
    <TextMacroModal v-model="showTextMacroModal"  />
  </template>

  <template v-if="showNonLatinBulkModal==true">
    <NonLatinBulkModal v-model="showNonLatinBulkModal"  />
  </template>

  <template v-if="showNonLatinAgentModal==true">
    <NonLatinAgentModal v-model="showNonLatinAgentModal"  />
  </template>

  <template v-if="showFieldColorsModal==true">
    <FieldColorsModal v-model="showFieldColorsModal"  />
  </template>
  <template v-if="showHubStubCreateModal==true">
    <HubStubCreateModal v-model="showHubStubCreateModal"  />
  </template>

  <template v-if="showNacoStubCreateModal==true">
    <NacoStubCreateModal v-model="showNacoStubCreateModal"  />
  </template>

  <template v-if="showAutoDeweyModal==true">
    <AutoDeweyModal v-model="showAutoDeweyModal"  />
  </template>

</template>




<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
<!-- <style>
  @import './assets/main.css';
</style> -->