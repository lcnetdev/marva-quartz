<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'

  import { mapStores, mapWritableState } from 'pinia'
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

        initalHeight: 350,
        initalLeft: (window.innerWidth /2 ) - 450,
      }
    },
    computed: {
      ...mapStores(usePreferenceStore, useConfigStore),
      ...mapWritableState(usePreferenceStore, ['showLoginModalSSO', 'catCode']),

      catCodeRequired(){
        return !this.catCode || this.catCode.trim() == ''
      },
      ssoName(){
        let prefStore = usePreferenceStore()
        if (prefStore.ssoUser){
          return prefStore.ssoUser.name || ''
        }
        return ''
      },
      ssoEmail(){
        let prefStore = usePreferenceStore()
        if (prefStore.ssoUser){
          return prefStore.ssoUser.email || prefStore.ssoUser.sub || ''
        }
        return ''
      },
    },

    methods: {

        done : function(){

          if (!this.catCode || this.catCode.trim() == ''){
            alert("You must provide a cataloging code id")
            return false
          }

          window.localStorage.setItem('marva-catCode', this.catCode)

          this.showLoginModalSSO = false

        },

        logout: function(){
          const config = useConfigStore()
          usePreferenceStore().ssoLogout(config.returnUrls.util)
        },

        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.loginSSOContent.style.height = newRect.height + 'px'

        },

        onSelectElement (event) {
          const tagName = event.target.tagName
          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },

    },

    mounted() {
      this.$nextTick(()=>{
        window.setTimeout(()=>{
          if (this.$refs.catCode) {
            this.$refs.catCode.focus()
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
      :click-to-close="!catCodeRequired"
      :esc-to-close="!catCodeRequired"
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
          <div id="login-sso-content" ref="loginSSOContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

            <h1>Account</h1>

            <div class="sso-info">
              <div v-if="ssoName"><strong>Name:</strong> {{ ssoName }}</div>
              <div v-if="ssoEmail"><strong>Email:</strong> {{ ssoEmail }}</div>
            </div>

            <div>Please enter your unique cataloging code which will appear in distributed records.</div>
            <input placeholder="Cataloging Code" @keyup.enter="done" v-model="catCode" ref="catCode" type="text">

            <div class="button-row">
              <button @click="done">Done</button>
              <a href="#" class="logout-link" @click.prevent="logout">Logout</a>
            </div>
          </div>

        </VueDragResize>
    </VueFinalModal>

</template>

<style scoped>

  .login-modal{
    background-color: white;
    -webkit-box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    border-radius: 1em;
    padding:1em;
    border: solid 1px black;
  }
  div{
    margin-top: 1em;
  }
  .sso-info div{
    margin-top: 0.3em;
    font-size: 1.1em;
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
  .button-row{
    display: flex;
    align-items: center;
    gap: 1.5em;
  }
  .logout-link{
    font-size: 1em;
    color: #c00;
  }
</style>
