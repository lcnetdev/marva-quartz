<template>

  <div class="edit-minimal">

    <div class="edit-minimal-topbar">
      <span class="edit-minimal-title">{{ title }}</span>
      <button class="edit-minimal-post-button" :disabled="!ready || posting" @click="post()">{{ posting ? 'Posting...' : 'Post' }}</button>
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

    <div v-if="postError !== null" class="edit-minimal-error-overlay">
      <div class="edit-minimal-error-modal">
        <h2>There was an error posting</h2>
        <p>The record was not accepted by the system, this is the error it reported:</p>
        <pre class="edit-minimal-error-msg">{{ postError }}</pre>
        <button class="edit-minimal-error-close" @click="postError=null">Close</button>
      </div>
    </div>

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
    components: { EditPanel, Debug, LiteralLang },

    data() {
      return {
        ready: false,
        setupError: null,
        posting: false,
        postError: null,
      }
    },

    computed: {
      ...mapStores(usePreferenceStore, useProfileStore),
      ...mapState(useProfileStore, ['profilesLoaded', 'profiles']),

      ...mapWritableState(usePreferenceStore, ['showDebugModal']),
      ...mapWritableState(useProfileStore, ['activeProfile', 'emptyComponents', 'activeProfilePosted', 'activeProfilePostedTimestamp', 'literalLangShow']),

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

      post: async function(){

        const config = useConfigStore()
        if (!config.returnUrls.displayLCOnlyFeatures){
          alert("Sorry you cannot post in this Marva environment")
          return
        }

        this.posting = true
        let results = null
        try{
          results = await this.profileStore.publishRecord()
        }catch(err){
          console.error(err)
          results = { status: false, msg: String(err) }
        }
        this.posting = false

        if (results && results.status !== false){
          this.activeProfilePosted = true
          this.activeProfilePostedTimestamp = Date.now()

          // hand the created resource back to the parent window, it will insert it
          // into the field this editor was opened from and close the iframe
          let rtId = this.activeProfile.rtOrder[0]
          window.parent.postMessage({
            type: 'editMinimalPosted',
            profile: rtId,
            uri: this.activeProfile.rt[rtId].URI,
            label: this.returnResourceLabel(rtId),
            resourceLinks: results.resourceLinks || []
          }, window.location.origin)

        } else {
          let msg = (results && results.msg) ? results.msg : 'Unknown error, there was no response from the posting process.'
          // make the raw backend JSON a little more readable
          msg = msg.replace(/\\n|\\t/g, '').replace(/\\"/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
          this.postError = msg
        }
      },

      /**
       * Best effort label for the resource that was just created, used by the parent
       * window when it inserts the new resource into the field. Uses the title if one
       * was entered, otherwise falls back to the tail of the URI.
       * @param {string} rtId - the resource template id in the active profile
       * @return {string} the label
       */
      returnResourceLabel: function(rtId){
        try{
          for (let ptk of this.activeProfile.rt[rtId].ptOrder){
            let pt = this.activeProfile.rt[rtId].pt[ptk]
            if (pt.propertyURI == 'http://id.loc.gov/ontologies/bibframe/title' && pt.userValue['http://id.loc.gov/ontologies/bibframe/title']){
              let title = pt.userValue['http://id.loc.gov/ontologies/bibframe/title'][0]
              if (title && title['http://id.loc.gov/ontologies/bibframe/mainTitle']){
                let labels = title['http://id.loc.gov/ontologies/bibframe/mainTitle'].map((v) => v['http://id.loc.gov/ontologies/bibframe/mainTitle']).filter(Boolean)
                if (labels.length > 0){
                  return labels.join(' ')
                }
              }
            }
          }
        }catch(err){
          console.warn('Could not build a label from the title:', err)
        }
        return this.activeProfile.rt[rtId].URI.split('/').at(-1)
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

  .edit-minimal-error-overlay{
    position: fixed;
    inset: 0;
    z-index: 5000;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-minimal-error-modal{
    background-color: white;
    border: solid 1px black;
    border-radius: 6px;
    padding: 1em;
    max-width: 80%;
    max-height: 80%;
    display: flex;
    flex-direction: column;
  }

  .edit-minimal-error-msg{
    overflow: auto;
    background-color: #f5f5f5;
    border: solid 1px lightgray;
    padding: 0.5em;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .edit-minimal-error-close{
    align-self: flex-end;
    margin-top: 0.5em;
    cursor: pointer;
  }

</style>
