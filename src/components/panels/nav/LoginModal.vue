<script>
  import { usePreferenceStore } from '@/stores/preference'

  import { mapStores, mapState, mapWritableState } from 'pinia'
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
        iDontHaveACode: false,

        initalHeight: 400,
        initalLeft: (window.innerWidth /2 ) - 450,


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      // ...mapStores(usePreferenceStore),

      // ...mapState(usePreferenceStore, ['debugModalData']),
      ...mapWritableState(usePreferenceStore, ['showLoginModal', 'catInitals','catCode']),

      

    },

    
    methods: {


        done : function(){

          if (!this.catInitals || this.catInitals.trim() == ''){
            alert("You must provide a name")
            return false
          }
          if (!this.catCode || this.catCode.trim() == ''){
            alert("You must provide a cataloging code id")
            return false
          }

          window.localStorage.setItem('marva-catInitals', this.catInitals)         
          if (this.catCode && this.catCode.trim() != ''){
            window.localStorage.setItem('marva-catCode', this.catCode )            
          }         

          this.showLoginModal = false

        },
        
        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.loginContent.style.height = newRect.height + 'px'

        },


        onSelectElement (event) {
          const tagName = event.target.tagName
          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },



    },

    mounted() {
      // If SSO user is already authenticated, auto-close the login modal
      const prefStore = usePreferenceStore()
      if (prefStore.ssoUser) {
        this.showLoginModal = false
        return
      }

      this.$nextTick(()=>{
        console.log(this.$refs.catInitals)
        window.setTimeout(()=>{
          if (this.$refs.catInitals) {
            this.$refs.catInitals.focus()
          }
        },10)
      })

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
          <div id="login-content" ref="loginContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
          

            <h1>Hello! Before you start...</h1>

            <div>Please enter a name to associate records with you, this is internal to Marva.</div>            
            <input placeholder="User Name" v-model="catInitals" @keyup.enter="done" ref="catInitals" type="text">

            <div>Please enter your unique cataloging code which will appear in distributed records .</div>            

            <input placeholder="Cataloging Code" @keyup.enter="done" v-model="catCode" ref="catCode"  type="text">
            <div style="margin-top: 0.4em; font-size: 0.9em;"><a href="#" @click="(event)=>{  iDontHaveACode=true; event.preventDefault() }">I don't have a code</a></div>
            <div style="margin-top: 0;" v-if="iDontHaveACode">If you don't have a Voyager ID and just want to test you can use your email username or makeup a unqiue identifier.</div>

            <div>
              <button @click="done">Done</button>
            </div>
          </div>


        </VueDragResize>
    </VueFinalModal>




</template>

<style scoped>

 

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
    margin-top: 2em;
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
