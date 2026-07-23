<template>

  <div class="edit-minimal">

    <div class="edit-minimal-topbar">
      <span class="edit-minimal-title">{{ title }}</span>
      <button class="edit-minimal-post-button" :disabled="!ready" @click="post()">Post</button>
    </div>

    <div class="edit-minimal-fields">
      <template v-if="ready">
        <EditPanel :instanceMode="false" :dualEdit="false"/>
      </template>
      <template v-else-if="setupError">
        <div class="edit-minimal-loading">{{ setupError }}</div>
      </template>
      <template v-else>
        <div class="edit-minimal-loading">Loading profile...</div>
      </template>
    </div>

    <template v-if="showPostModal == true">
      <PostModal ref="postmodal" v-model="showPostModal" />
    </template>

    <template v-if="showDebugModal==true">
      <Debug v-model="showDebugModal" />
    </template>

    <template v-if="literalLangShow!==false">
      <LiteralLang v-model="literalLangShow" />
    </template>

  </div>

</template>


<script>

  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'

  import { mapStores, mapState, mapWritableState } from 'pinia'

  import EditPanel from "@/components/panels/edit/EditPanel.vue";
  import PostModal from "@/components/panels/nav/PostModal.vue";
  import Debug from "@/components/panels/edit/modals/DebugModal.vue";
  import LiteralLang from "@/components/panels/edit/modals/LiteralLang.vue";

  import short from 'short-uuid'
  const translator = short();

  /**
   * A stripped down version of the edit screen meant to be embedded in an IFRAME from
   * the full editor. It renders only the edit fields for a single resource template plus
   * a post button. Controlled via query parameters:
   *   ?profile=lc:RT:XXX  - (required) the resource template to build the editing form from
   *   &uri=http://...     - (optional) the URI to use for the resource being created
   *   &load=http://...    - (optional) a record URL to load into the profile (not implemented yet)
   */
  export default {
    components: { EditPanel, PostModal, Debug, LiteralLang },

    data() {
      return {
        ready: false,
        setupError: null,
      }
    },

    computed: {
      ...mapStores(usePreferenceStore, useProfileStore),
      ...mapState(useProfileStore, ['profilesLoaded', 'profiles']),

      ...mapWritableState(usePreferenceStore, ['showDebugModal']),
      ...mapWritableState(useProfileStore, ['activeProfile', 'emptyComponents', 'showPostModal', 'activeProfilePosted', 'activeProfilePostedTimestamp', 'literalLangShow']),

      title() {
        let rtId = this.$route.query.profile
        if (rtId && this.profileStore.rtLookup[rtId] && this.profileStore.rtLookup[rtId].resourceLabel){
          return this.profileStore.rtLookup[rtId].resourceLabel
        }
        return rtId || ''
      }

    },

    watch: {
      // the app loads the profiles on startup no matter the route, when that
      // finishes build the editing form
      profilesLoaded(newProfilesLoaded, oldProfilesLoaded) {
        if (oldProfilesLoaded == false && newProfilesLoaded == true){
          this.setupProfile()
        }
      }
    },

    methods: {

      setupProfile: function(){

        const config = useConfigStore()

        let rtId = this.$route.query.profile
        if (!rtId){
          this.setupError = 'No profile was requested, pass a ?profile= parameter with the resource template id to use.'
          return
        }
        rtId = this.profileStore.resolveTemplateId(rtId)

        // find the source profile that holds this resource template
        let sourceRt = null
        for (let key in this.profiles){
          if (this.profiles[key].rt && this.profiles[key].rt[rtId]){
            sourceRt = this.profiles[key].rt[rtId]
            break
          }
        }
        if (!sourceRt){
          this.setupError = `The profile template "${rtId}" is not defined in the loaded profiles.`
          console.warn(this.setupError)
          return
        }

        let useProfile = { id: rtId, rtOrder: [rtId], rt: {} }
        useProfile.rt[rtId] = JSON.parse(JSON.stringify(sourceRt))

        // fresh guids for all the properties
        for (let ptk in useProfile.rt[rtId].pt){
          useProfile.rt[rtId].pt[ptk]['@guid'] = short.generate()
        }

        let uuid = 'e' + Date.now().toString()
        useProfile.eId = uuid
        useProfile.log = [{ action: 'createMinimalEdit', profile: rtId }]
        useProfile.procInfo = config.procInfoNewWorkInstance
        useProfile.user = this.preferenceStore.returnUserNameForSaving
        useProfile.status = 'unposted'
        useProfile.newResource = true

        // the URI for the resource being created can be passed in, otherwise mint one
        if (this.$route.query.uri){
          useProfile.rt[rtId].URI = this.$route.query.uri
        } else {
          useProfile.rt[rtId].URI = config.baseURIWork + translator.toUUID(translator.new())
        }

        if (this.$route.query.load){
          // TODO: load the record at this URL into the profile
          console.warn('EditMinimal: the load parameter is not implemented yet:', this.$route.query.load)
        }

        this.activeProfilePosted = false
        this.activeProfilePostedTimestamp = false
        this.activeProfile = useProfile

        // prime ad hoc mode so the edit panel doesn't choke when it is enabled,
        // this reads from activeProfile so it has to happen after it is set
        this.emptyComponents[rtId] = []
        for (let element in useProfile.rt[rtId].pt){
          this.profileStore.addToAdHocMode(rtId, element)
        }

        this.ready = true
      },

      post: function(){
        this.showPostModal = true
        this.$nextTick(()=>{
          if (this.$refs.postmodal){
            this.$refs.postmodal.post()
          }
        })
      }

    },

    mounted: function(){
      this.profileStore.resetLocalComponentCache()
      if (this.profilesLoaded){
        this.setupProfile()
      }
    }

  }

</script>


<style scoped>

  .edit-minimal{
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: white;
  }

  .edit-minimal-topbar{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: solid 1px black;
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-nav-background-color')");
    flex: 0 0 auto;
  }

  .edit-minimal-title{
    font-weight: bold;
  }

  .edit-minimal-post-button{
    font-size: 1em;
    padding: 4px 16px;
    cursor: pointer;
  }

  .edit-minimal-fields{
    flex: 1 1 auto;
    overflow-y: scroll;
    padding: 0 8px 8px 8px;
  }

  .edit-minimal-loading{
    padding: 2em;
    text-align: center;
    color: gray;
  }

</style>
