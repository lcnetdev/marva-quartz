<script>
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'


  import {  mapStores, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'


  export default {
    components: {
      VueFinalModal,
      VueDragResize,
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 100,
        left: 0,
        validationResults: {},
        validating: false,
        initalHeight: 400,
        initalLeft: (window.innerWidth /2 ) - 450,


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,useConfigStore),

      // ...mapState(usePreferenceStore, ['debugModalData']),
      ...mapWritableState(useProfileStore, ['showValidateModal']),
    },


    methods: {
        done : function(){
          this.showValidateModal = false
        },

        dragResize: function(newRect){
          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left
          this.$refs.errorHolder.style.height = newRect.height + 'px'

        },


        post: async function(){
          console.log("** validating **")
          const config = useConfigStore()

          this.$refs.errorHolder.style.height = this.initalHeight + 'px'
          this.validating = true
          console.log("Validating: ", this.validating)
          this.validationResults = {}
          try{
            this.validationResults = await this.profileStore.validateRecord()
          } catch(err) {
            this.validationResults = {"error": err}
          }

          this.validating = false

          if (this.validationResults.error) {
            this.status = "Error"
            this.results = null
          } else {
            this.status = Object.values(this.validationResults.status)[0]
            this.results = Object.values(this.validationResults.validation)
          }
        },
    },

    mounted() {}
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
        <VueDragResize
          :is-active="true"
          :w="900"
          :h="initalHeight"
          :x="initalLeft"
          class="login-modal"
          @resizing="dragResize"
          @dragging="dragResize"

          :sticks="['br']"
          :stickSize="22"
        >
          <div id="error-holder" ref="errorHolder" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            <h1 v-if="validating == true">Validating please wait...</h1>

            <div v-if="validating == false">
              <span v-if="!Object.keys(validationResults).includes('error')" >
                <span v-if="status === 'validated'">Validation found the following:</span>
                  <ul v-for="({level, message}) in results">
                    <li :class="'level-' + level">{{ level }}: {{ message }}</li>
                  </ul>
              </span>
              <span v-else>
                The validation failed.
                "{{ this.validationResults.error.message }}"
              </span>
            </div>

            <button @click="done">Close</button>
          </div>
        </VueDragResize>
    </VueFinalModal>
</template>

<style scoped>
  #error-holder{
    overflow-y: scroll;
  }

  .checkbox-option{
    width: 20px;
    height: 20px;
  }

  .option{
    display: flex;
  }
  .option-title{
    flex:2;
  }
  .option-title-header{
    font-weight: bold;
  }
  .option-title-desc{
    font-size: 0.8em;
    color:gray;
  }
  #debug-content{
    overflow: hidden;
    overflow-y: auto;
  }
  .menu-buttons{
    margin-bottom: 2em;
    position: relative;
  }
  .close-button{
    position: absolute;
    right: 5px;
    top: 5px;
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
  }
  .login-modal{
    background-color: white;
    -webkit-box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    border-radius: 1em;
    padding:1em;
    border: solid 1px black;
  }
  div{
    /* margin-top: 2em; */
  }

  input{
    font-size: 1.5em;
    margin-top: 0.5em;

  }
  strong{
    font-weight: bold
  }
  button{
    font-size: 1.5em;
  }

  .level-WARNING,
  .level-ERROR{
    list-style: none;
    width: fit-content;
    margin-bottom: 5px;
    padding: .75rem 1.25rem;
  }
  .level-WARNING {
    color: #856404;
    background-color: #fff3cd;
    border-color: #ffeeba;
  }
  .level-ERROR {
    color: #721c24;
    background-color: #f8d7da;
    border-color: #f5c6cb;
  }
</style>
