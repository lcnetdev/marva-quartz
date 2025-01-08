<script>
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'
  import { mapStores, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'

  export default {
    components: {
      VueFinalModal
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,
        postResults: {},
        posting: false,
        initalHeight: 400,
        initalLeft: (window.innerWidth / 2) - 450,
      }
    },
    computed: {
      // ...existing code...
      ...mapStores(useProfileStore, useConfigStore),
      ...mapWritableState(useProfileStore, ['showPostModal']),
      activeProfile() {
        return this.profileStore.activeProfile
      }
    },

    methods: {
      done: function() {
        this.showPostModal = false
      },

      post: async function() {
        const config = useConfigStore()
        
        this.$refs.errorHolder.style.height = this.initalHeight + 'px'
        this.posting = true
        const profile = this.activeProfile

        if (!profile) {
          console.error('Profile is not defined')
          this.postResults = {
            publish: {
              status: 'error',
              message: 'Profile is not defined'
            }
          }
          this.posting = false
          return
        }

        if (!profile.eId) {
          console.error('EID is not defined', profile)
          this.postResults = {
            publish: {
              status: 'error',
              message: 'EID is not defined'
            }
          }
          this.posting = false
          return
        }

        // Generate or retrieve xmlString here
        const xmlString = this.generateXML(profile) // Implement generateXML accordingly

        try {
          const response = await this.profileStore.publishRecord(xmlString, profile) // Pass xmlString
          this.postResults = response // Assign raw response directly
          if (response.publish.status !== 'published') {
            console.error('Error response:', response)
          }
        } catch (error) {
          console.error('Error during post:', error)
          this.postResults = {
            publish: {
              status: 'error',
              message: error.message || 'An unknown error occurred'
            }
          }
        } finally {
          this.posting = false
        }
      },

      // Add this method to reliably get EID from the active profile
      getEID: function() {
        return this.activeProfile?.eId || '';
      },

      async handlePublish() {
        const profile = this.profileStore.activeProfile;

        if (!profile?.eId) { // Ensure EID is available if needed elsewhere
          this.showError('EID is not available.');
          return;
        }

        const result = await this.profileStore.publishRecord(profile); // Removed 'eid'

        if (result.publish.status === 'published') {
          this.showSuccess(result.name.instance_mms_id, result.name.work_mms_id);
        } else {
          this.showError(result.publish.message);
        }
      },

      // onSelectElement(event) {
      //   const tagName = event.target.tagName
      //   if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      //     event.stopPropagation()
      //   }
      // },

      cleanUpErrorResponse: function(msg) {
        if (!msg) return ''
        msg = JSON.stringify(msg, null, 2)
        msg = msg.replace(/\\n|\\t/g, '').replace(/\\"/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
        return msg
      },

      // Implement a method to generate XML from the profile
      generateXML(profile) {
        // Your logic to convert profile to RDF XML string
        // For example:
        // return someXMLGenerationFunction(profile)
        return profile.rdfxml || '' // Adjust based on your data structure
      },
    },

    mounted() {
      // ...existing code...
    }
  }
</script>

<template>
  <VueFinalModal
    display-directive="show"
    :hide-overlay="false"
    :overlay-transition="'vfm-fade'"
    :click-to-close="false"
    :esc-to-close="false"
  >
    <div class="login-modal" id="error-holder" ref="errorHolder">
      <h1 v-if="posting">Posting please wait...</h1>

      <div v-if="!posting && Object.keys(postResults).length !== 0">
        <div v-if="postResults.publish && postResults.publish.status === 'published'" style="margin: 0.5em 0; background-color: #90ee9052; padding: 0.5em; border-radius: 0.25em;">
          The record was accepted by the system.
          <div v-if="postResults.name.instance_mms_id.length || postResults.name.work_mms_id.length">
            Here are the MMS IDs:
            <ul>
              <li>Instance MMS ID(s):
                <ul>
                  <li v-for="id in postResults.name.instance_mms_id" :key="id">{{ id }}</li>
                </ul>
              </li>
              <li>Work MMS ID(s):
                <ul>
                  <li v-for="id in postResults.name.work_mms_id" :key="id">{{ id }}</li>
                </ul>
              </li>
            </ul>
          </div>
          <div v-else>
            MMS IDs are not available.
          </div>
        </div>
        <div v-else-if="postResults.publish && postResults.publish.status !== 'published' && postResults.publish.status" style="margin: 0.5em 0; background-color: #ffcccb; padding: 0.5em; border-radius: 0.25em;">
          <h2>There was an error posting: {{ postResults.publish.message }}</h2>
          <pre>{{ cleanUpErrorResponse(postResults.publish.message) }}</pre>
          <button @click="done">Close</button>
        </div>
        <div v-else style="margin: 0.5em 0; background-color: #ffcccb; padding: 0.5em; border-radius: 0.25em;">
          <h2>An unknown error occurred.</h2>
          <pre>{{ JSON.stringify(postResults, null, 2) }}</pre>
          <button @click="done">Close</button>
        </div>
      </div>

      <button @click="done">Close</button>
    </div>
  </VueFinalModal>
</template>

<style scoped>
  #error-holder {
    overflow-y: scroll;
  }

  .checkbox-option {
    width: 20px;
    height: 20px;
  }

  .option {
    display: flex;
  }
  .option-title {
    flex: 2;
  }
  .option-title-header {
    font-weight: bold;
  }
  .option-title-desc {
    font-size: 0.8em;
    color: gray;
  }
  #debug-content {
    overflow: hidden;
    overflow-y: auto;
  }
  .menu-buttons {
    margin-bottom: 2em;
    position: relative;
  }
  .close-button {
    position: absolute;
    right: 5px;
    top: 5px;
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
  }
  .login-modal {
    background-color: white;
    -webkit-box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27); 
    box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    border-radius: 1em;
    padding: 1em;
    border: solid 1px black;
  }
  div {
    /* margin-top: 2em; */
  }

  input {
    font-size: 1.5em;
    margin-top: 0.5em;
  }
  strong {
    font-weight: bold;
  }
  button {
    font-size: 1.5em;
  }
</style>
