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
      ...mapState(useProfileStore, ['emptyComponents', 'activeProfile', 'isEmptyComponent']),

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

        changeVisibility: function(rt, pt){
          // if it's hidden, display it
          if (this.emptyComponents[rt].includes(pt)){
            let idx = this.emptyComponents[rt].indexOf(pt)
            this.emptyComponents[rt].splice(idx, 1)
          } else {
            this.emptyComponents[rt].push(pt)
          }
        }
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
            <div v-for="(v, rt) in activeProfile.rt">
              <h2 style="margin-top: 5px;">{{ rt }}</h2>
              <div v-for="(obj, pt) in activeProfile.rt[rt].pt">
                <li style="margin-bottom: 2px;">
                  <div id="container" v-if="obj.mandatory!='true' && isEmptyComponent(obj)">
                    <input type="checkbox" :id="`${rt}--${pt}`" class="toggle" name="search-type" value="keyword" @click="changeVisibility(rt, pt)" ref="toggle" :checked="emptyComponents[rt].includes(pt)" readonly>
                    <label :for="`${rt}--${pt}`" class="toggle-container">
                      <div>Display</div>
                      <div>Hide</div>
                    </label>
                    <div>{{ obj.propertyLabel }}</div>
                  </div>
                  <div v-else>
                    <div class="mandatory-container" v-if="obj.mandatory == 'true'">
                      <div class="mandatory">MANDATORY</div>
                      <div>{{ obj.propertyLabel }}</div>
                    </div>
                    <div class="mandatory-container" v-else>
                      <div class="mandatory">Populated</div>
                      <div>{{ obj.propertyLabel }}</div>
                    </div>
                  </div>
                </li>
              </div>
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

/* toggle */
#container{
  display: table;
}

#container div {
  display: table-cell;
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
   border-radius: 10px;
   background: lightskyblue;
   font-weight: bold;
   color: lightskyblue;
   cursor: pointer;
}

.mandatory-container {
  display: table;
}
.mandatory {
  position: relative;
   display: table-cell;
   width: fit-content;
   border: 3px solid slategray;
   border-radius: 10px;
   background: lightgray;
   font-weight: bold;
   color: black;
   padding: 2px;
}

.toggle-container::before {
   content: '';
   position: absolute;
   width: 50%;
   height: 100%;
   left: 0%;
   border-radius:10px;
   background: black;
   transition: all 0.3s;
}

.toggle-container div {
   padding: 1px;
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
