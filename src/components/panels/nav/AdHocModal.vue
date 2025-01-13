<script>
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'


  import {  mapStores, mapState, mapWritableState } from 'pinia'
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
      ...mapState(useProfileStore, ['emptyComponents', 'activeProfile']),

      // ...mapState(usePreferenceStore, ['debugModalData']),
      ...mapWritableState(useProfileStore, ['showAdHocModal', 'emptyComponents']),
    },


    methods: {
        done : function(){
          this.showAdHocModal = false
        },

        dragResize: function(newRect){
          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left
          this.$refs.errorHolder.style.height = newRect.height + 'px'

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
            <div>
                <h1>Ad Hoc Mode Elements</h1>
                <div class="dewey-menu-button">
                    <button @click="done()" class="close-button">Close</button>
                </div>
            </div>
            <h3>Below you can select elements to display or hide in Marva.</h3>

            <div v-for="(value, key) in emptyComponents">
              <h2>{{ key }}</h2>
                <li v-for="item in value">
                  <div id="container">
                    <input type="checkbox" id="search-type" class="toggle" name="search-type" value="keyword" @click="changeSearchType($event)" ref="toggle">
                    <label for="search-type" class="toggle-container">
                      <div>Display</div>
                      <div>Hide</div>
                    </label>
                    {{ this.activeProfile.rt[key].pt[item].propertyLabel }}
                  </div>
                </li>
              </div>
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

  /* toggle */
  #container{
	margin-left: 5px;
}

.toggle {
	display: none;
}

.toggle-container {
   position: relative;
   display: grid;
   grid-template-columns: repeat(2, 1fr);
   width: fit-content;
   border: 3px solid lightskyblue;
   border-radius: 20px;
   background: lightskyblue;
   font-weight: bold;
   color: lightskyblue;
   cursor: pointer;
}

.toggle-container::before {
   content: '';
   position: absolute;
   width: 50%;
   height: 100%;
   left: 0%;
   border-radius:20px;
   background: black;
   transition: all 0.3s;
}

.toggle-container div {
   padding: 6px;
   text-align: center;
   z-index: 1;
}

.toggle:checked + .toggle-container::before {
   left: 50%;
}

.toggle:checked + .toggle-container div:first-child{
   color: black;
   transition: color 0.3s;
}
.toggle:checked + .toggle-container div:last-child{
   color: lightskyblue;
   transition: color 0.3s;
}
.toggle + .toggle-container div:first-child{
   color: lightskyblue;
   transition: color 0.3s;
}
.toggle + .toggle-container div:last-child{
   color: black;
   transition: color 0.3s;
}

.menu-buttons{
  right: 20px;
  top: 5px;
  position: absolute;
  z-index: 100000;

}
</style>
