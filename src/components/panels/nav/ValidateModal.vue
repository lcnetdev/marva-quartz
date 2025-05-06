<script>
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'


  import {  mapStores, mapWritableState, mapState } from 'pinia'
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
        validationMessage: []


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,useConfigStore),
      ...mapState(useProfileStore, ['activeProfile', 'activeComponent']),
      // ...mapState(usePreferenceStore, ['debugModalData']),
      ...mapWritableState(useProfileStore, ['showValidateModal', 'activeComponent']),

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

        validateForm: function(){
          let elements = document.getElementsByClassName("validation-error")
          return elements
        },

        post: async function(){
          //console.log("** validating **")
          const config = useConfigStore()

          this.$refs.errorHolder.style.height = this.initalHeight + 'px'
          this.validating = true
          //console.log("Validating: ", this.validating)
          this.validationResults = {}
          try{
            this.validationResults = await this.profileStore.validateRecord()
          } catch(err) {
            this.validationResults = {"error": err}
          }

          let internalErrors = this.validateForm()
          for (let error of internalErrors){
            let guid = error.id.replace("-select", "")
            let classes = [...error.classList]
            let issue = String(classes[classes.indexOf("validation-error") + 1])
            let target = this.profileStore.returnStructureByGUID(guid)
            this.validationResults.validation.push({
              level: "WARNING",
              message: target.propertyLabel + " has an issue '" + issue + "'<<" + guid + ">>"
            })
          }

          this.validating = false

          if (this.validationResults.error) {
            this.status = "Error"
            this.results = null
          } else {
            this.status = Object.values(this.validationResults.status)[0]
            this.results = Object.values(this.validationResults.validation)
          }

          for (let r of this.results){
            this.validationMessage.push({
              level: r.level,
              message: this.processMessage(r.message)
            })
          }
        },

        processMessage: function(msg){
          if (msg.includes("**")){
            let matchComponent = msg.match(/(\*\*(.*)\*\*)/)
            let matchRt = msg.match(/@(.*)@/)
            if (matchComponent.length > 0){
              msg = msg.replace(matchComponent[0], matchComponent.at(-1))
              if (matchRt){
                msg = msg.replace(matchRt[0], matchRt.at(-1))
                return [msg, matchComponent.at(-1), matchRt.at(-1)]
              }
              return [msg, matchComponent.at(-1), null]
            }
          } else if (msg.includes("<<") && msg.includes(">>")){
            let matchGuid = msg.match(/<<(.*)>>/)
            msg = msg.replace(matchGuid[0],"")
            return [msg, matchGuid[1], null]
          } else {
            return [msg, null, null]
          }
        },

        jumpToComponent:function(processedMessage){
          let jumpTarget = this.profileStore.returnComponentByPropertyLabel(processedMessage[1], processedMessage[2])
          if (!jumpTarget){
            jumpTarget = this.profileStore.returnStructureByGUID(processedMessage[1])
          }
          if (jumpTarget){
            this.done()
            this.activeComponent = jumpTarget
          } else {
            console.warn("Couldn't jump to component: ", processedMessage[1])
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
      :click-to-close="true"
      :esc-to-close="true"

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
          <div id="error-holder" ref="errorHolder">
            <h1 v-if="validating == true">Validating please wait...</h1>

            <div v-if="validating == false">
              <span v-if="!Object.keys(validationResults).includes('error')" >
                <span v-if="status === 'validated'">Validation found the following:</span>
                  <ul v-for="({level, message}) in validationMessage">
                    <template v-if="level == 'SUCCESS' && validationMessage.length > 1">
                      <!-- Don't show the success message when there's a message from Marvas -->
                    </template>
                    <template v-else>
                      <li :class="['level-' + level, {'action-jump': message[1]}]" @click="jumpToComponent(message)">
                        <span v-if="message[1]" :class="['material-icons']">move_down</span>
                        {{ level }}: {{ message[0] }}
                      </li>
                    </template>
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

  .level-INFO,
  .level-SUCCESS,
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

  .level-SUCCESS {
    color: #155724;
    background-color: #d4edda;
    border-color: #c3e6cb;
  }

  .level-INFO {
    color: #0c5460;
    background-color: #d1ecf1;
    border-color: #bee5eb;
  }

  .action-jump:hover{
    color: #004085;
    background-color: #cce5ff;
    border-color: #b8daff;
  }
  .action-jump {
    cursor: pointer;
  }
</style>
