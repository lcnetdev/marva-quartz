<script>
  // import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'

  import utilsNetwork from '@/lib/utils_network';


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

        initalHeight: 550,
        initalLeft: 500,

        classNumber: null,
        cutterNumber:null,

        results: [],




      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      // ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),
      ...mapStores(useProfileStore),

      
      
      // ...mapWritableState(usePreferenceStore, ['literalLangGuid']),
      ...mapWritableState(useProfileStore, ['showShelfListingModal','activeShelfListData']),


      /**
      * Returns the current scripts defined in th embdeded data
      * @return {array} results - array of scripts
      */  
      xxxxx(){


      },
    


    },

    watch: {

      
    },

    methods: {
        
        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.shelfListingContent.style.height = newRect.height + 'px'

        },



        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TD' || tagName === 'BUTTON'  || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },


        async search(){


          
          this.results = []

          this.results =  await utilsNetwork.searchShelfList(this.classNumber.trim() + ' ' + this.cutterNumber.trim())
          console.log("this.results",this.results)

          //       altsubject
          // : 
          // "Railroad trains"
          // creator
          // : 
          // ""
          // frequency
          // : 
          // ""
          // lookup
          // : 
          // "/lds/search.xqy?count=10&sort=score-desc&pg=1&precision=exact&qname=idx:lcclass&q=TF148%20C66%202016"
          // pubdate
          // : 
          // "2016"
          // subject
          // : 
          // "Railroad trains--Juvenile literature"
          // term
          // : 
          // "TF148 C66 2016"
          // title
          // : 
          // "Trains"



        },

       


    },

    async created(){


    },

    async mounted() {

      this.classNumber = this.activeShelfListData.class
      this.cutterNumber = this.activeShelfListData.cutter
      this.search()
    }
  }



</script>

<template>


    <VueFinalModal
      display-directive="show"
      :hide-overlay="true"
      :overlay-transition="'vfm-fade'"

      
    >
        <VueDragResize
          :is-active="true"
          :w="900"
          :h="initalHeight"
          :x="initalLeft"
          class="shelf-listing-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="shelf-listing-content" ref="shelfListingContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

            <div class="menu-buttons">
              <button class="close-button" @pointerup="showShelfListingModal=false">X</button>
            </div>

            <div class="shelf-listing-work-area">
              <input v-model="classNumber" @keyup="search" type="text" />
              <input v-model="cutterNumber" @keyup="search" type="text" />
              <button>Save</button>
              <table>
                <thead>
                  <tr>
                    <td>Number</td>
                    <td>Title</td>
                    <td>Date</td>
                    <td> </td>

                  </tr>
                </thead>
                <tbody>

                  <template v-for="r in results">
                    <template  v-if="r.title != 'Would Appear Here'">
                      <tr>
                        <td>{{ r.term }}</td>
                        <td>{{ r.title }}</td>
                        <td>{{ r.pubdate }}</td>
                        <td><a style="color: inherit; text-decoration: none;" target="_blank" :href="r.lookup">view</a></td>
                      </tr>
                    </template>

                    <template  v-if="r.title == 'Would Appear Here'">
                      <tr style="background-color: yellow;">
                        <td>{{ r.term }}</td>
                        <td>{{ r.title }}</td>
                        <td>{{ r.pubdate }}</td>
                        <td></td>
                      </tr>
                    </template>

                 
                                  


                  </template>


                  




                </tbody>


              </table>
              

            </div>

            
          </div>


        </VueDragResize>
    </VueFinalModal>




</template>
<style>


</style>

<style scoped>


  iframe{
    display: block;
  }
  .shelf-listing-work-area{
    clear: both;
    
  }
  .shelf-listing-modal{
    background-color: white;

  }
  select{
    max-width: 50%;
  }
  .value-display-holder{
    padding: 1em;
    font-size: 1.25em;
  }
  .value-display{
    background-color: whitesmoke;
    padding: 0.5em 0.5em 0.5em 2em;
    border:dashed 1px black;
  }

  th{
    text-align: left;
    font-weight: bold;

  }
  tr:hover{
    background-color: aliceblue;
  }
  td{
    border-bottom: solid 1px whitesmoke;

  }
  #shelf-listing-content{
    background-color: white;
    overflow-y: scroll;
  }

  .checkbox-option{
    width: 20px;
    height: 20px;
  }

  input[type=checkbox]{
    width: 25px;
    height: 25px;
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
  
  .menu-buttons{
    
    position: relative;
    z-index: 100;
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



</style>
