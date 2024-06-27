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

        postResults: {},
        posting: false,

        
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
      ...mapWritableState(useProfileStore, ['showPostModal']),

      

      
      

    },

    
    methods: {


        done : function(){

          this.showPostModal = false

        },
        
        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.errorHolder.style.height = newRect.height + 'px'

        },


        post: async function(){

          const config = useConfigStore()
          
          if (!config.returnUrls.displayLCOnlyFeatures){
            this.showPostModal=false
            alert("Sorry you cannot post in this Marva environment")
            return false
          }





          this.$refs.errorHolder.style.height = this.initalHeight + 'px'
          this.posting = true
          this.postResults = {}
          this.postResults = await this.profileStore.publishRecord()
          this.posting = false
          console.log(this.postResults)

        },  

        onSelectElement (event) {
          const tagName = event.target.tagName
          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },

        copyErrorToClipboard: function(){

          var text = this.cleanUpErrorResponse(this.postResults.msg)
          navigator.clipboard.writeText(text).then(function() {
            console.log('Async: Copying to clipboard was successful!');
          }, function(err) {
            console.error('Async: Could not copy text: ', err);
          });



        },

        /** 
        * Helper to make the XML preview display nicer
        * @return {string} - the cleaned up string
        */
        cleanUpErrorResponse: function(msg){
            msg = JSON.stringify(msg,null,2)
            msg = msg.replace(/\\n|\\t/g, '').replace(/\\"/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
            return msg
        },


    },

    mounted() {

      

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
            

            <h1 v-if="posting">Posting please wait...</h1>
            
            <div v-if="posting == false && Object.keys(postResults).length == 0">
            
              <h2>There was an error posting. Please report error. </h2><button @click="copyErrorToClipboard">Copy error to clipboard</button>              <button @click="done">Close</button>

              <div>
                <code v-if="postResults.status === false">
                  {{ cleanUpErrorResponse(postResults.msg) }}
                </code>
              </div>
            
            </div>
            <div v-if="posting == false && Object.keys(postResults).length != 0">

              <div v-if="postResults.resourceLinks.length>0" style="margin: 0.5em 0 0.5em 0;background-color: #90ee9052;padding: 0.5em;border-radius: 0.25em;">
                The record was accepted by the system. To view the record follow these links:
                <div v-for="rl in postResults.resourceLinks" v-bind:key="rl.url">
                  <a :href="rl.url+'?blastdacache=' + Date.now()" target="_blank">View {{rl.type}} on {{rl.env}}</a>
                </div>
                
              </div>
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
</style>
