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
      ...mapWritableState(useProfileStore, ['showRecoveryModal']),

      

      
      

    },

    
    methods: {

        returnHref(){

          return window.location.href


        },


        done : function(){

          this.showRecoveryModal = false

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
            
            
           <div style="text-align: center;"> <span class="material-icons recovery-icon">sentiment_very_dissatisfied</span></div>

            <p>There was a build error preparing your record. </p>
            <p>Marva has reverted your record back to the state before the error happened.</p>
              <p>This should not happen and points to a critical bug that needs to be fixed. Please see if you are able to recreate and report this issue by:</p>
              <p>
               <ol>
                    <li>           Closing this pop-up</li>
                <li>Trying doing the same operation that caused this pop-up to happen the first time.</li>
                <li>Make sure to hit save and please share the url to this record:<input type="text" :value="returnHref()"></li>
                <li>And share the steps you did to make this error pop-up appear.</li>
                </ol>
                </p>
              <p>Thanks!</p>


            
            <button @click="done" class="done">Close</button>


            


          </div>


        </VueDragResize>
    </VueFinalModal>




</template>

<style scoped>

.done{
  display: block;
  margin-top: 1em;
}

  input{
    font-size: 1em;
    width: 100%
  }

  p{
    margin-bottom: 1em;
  }
  .recovery-icon{
    font-size: 5em;
  }

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
