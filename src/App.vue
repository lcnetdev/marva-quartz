<script>
import { RouterLink, RouterView } from "vue-router";

import LoadingModal from "@/components/general/LoadingModal.vue";
import PreferenceModal from "@/components/general/PreferenceModal.vue";
import LoginModal from "@/components/panels/nav/LoginModal.vue";
import ScriptshifterConfigModal from "@/components/panels/edit/modals/ScriptshifterConfigModal.vue";



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
    ...mapState(useProfileStore, ['profilesLoaded', 'showPostModal']),
    ...mapState(useProfileStore, ['profilesLoaded', 'showValidateModal']),
    ...mapState(usePreferenceStore, ['showPrefModal','catCode']),
    ...mapWritableState(usePreferenceStore, ['showLoginModal','showScriptshifterConfigModal']),


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
    console.log(this.configStore.versionMajor)    
//     const configStore = useConfigStore()
// const profileStore = useProfileStore()   

    this.preferenceStore.initalize()
    // this.profileStore.buildProfiles()
    //window.setTimeout(async ()=>{

    if (!this.catCode){
      this.showLoginModal = true
    }
    await this.profileStore.buildProfiles()
      //let profile =  this.profileStore.loadNewTemplate('Monograph','mattmatt')
      //this.profileStore.activeProfile = profile

      // console.log('profile',profile)

      // window.setInterval(()=>{
      //   this.profileStore.activeProfile.rt['lc:RT:bf2:Monograph:Work'].pt['id_loc_gov_ontologies_bibframe_title__title_information']['userValue']['@root'] = this.profileStore.activeProfile.rt['lc:RT:bf2:Monograph:Work'].pt['id_loc_gov_ontologies_bibframe_title__title_information']['userValue']['@root'] + ':)'
      // },1000)

    //},500)



  }
}




</script>

<template>
 <!--  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header> -->

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