<script>
  // import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'

  import utilsNetwork from '@/lib/utils_network';

  import short from 'short-uuid'


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
        initalLeft: 100,

        searching: false,

        classNumber: null,
        cutterNumber:null,
        contributor:null,
        title:null,
        subj:null,
        date:null,
        countParam:null,

        hitCount: 10,
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
        
        scrollTo: function() {
            this.$refs.moreButton.scrollIntoView({ behavior: 'smooth' });
        },


        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TD' || tagName === 'BUTTON'  || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },

        async save(){


          // using the

          if (this.classNumber && this.classNumber.trim() != ''){
            if (!this.activeShelfListData.classGuid){
              this.activeShelfListData.classGuid = short.generate()
            }

            // the open button lives in the item portion of the number so we don't have the class portion, but they will always be siblings so just modify the path
            // so it matches to where the class property path is
            let classPropertyPath = JSON.parse(JSON.stringify(this.activeShelfListData.componentPropertyPath))
            console.log(classPropertyPath)
            classPropertyPath = classPropertyPath.map((v) => {
              v.propertyURI = v.propertyURI.replace("itemPortion",'classificationPortion')
              return v
            })



            await this.profileStore.setValueLiteral(this.activeShelfListData.componentGuid,this.activeShelfListData.classGuid,classPropertyPath,this.classNumber)
          }

          if (this.cutterNumber && this.cutterNumber.trim() != ''){
            if (!this.activeShelfListData.cutterGuid){
              this.activeShelfListData.cutterGuid = short.generate()
            }
            await this.profileStore.setValueLiteral(this.activeShelfListData.componentGuid,this.activeShelfListData.cutterGuid,this.activeShelfListData.componentPropertyPath,this.cutterNumber)
          }



          this.showShelfListingModal=false


        },


        async search(){
          if (!this.classNumber){this.classNumber=''}
          if (!this.cutterNumber){this.cutterNumber=''}


          this.contributor= this.contributor ? "&sp-name="+this.contributor : ""
          this.title= this.title ? "&sp-title="+this.title  : ""
          this.subj= this.subj ? "&sp-subject="+this.subj  : ""
          this.date= this.date ? "&sp-date="+this.date : ""
          this.countParam = this.hitCount ? "&count="+this.hitCount : ""


          this.results = []
          this.searching=true
          this.results =  await utilsNetwork.searchShelfList(
            this.classNumber.trim() + '' + this.cutterNumber.trim(),
            this.contributor + this.title + this.subj + this.date + this.countParam
          )
          this.searching=false
          this.$nextTick(() => {
            this.scrollTo();
          });

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
      this.contributor = this.activeShelfListData.contributor
      this.title = this.activeShelfListData.title
      this.subj = this.activeShelfListData.firstSubject
      this.date = this.activeShelfListData.date
      if ((this.classNumber && this.classNumber != '') || (this.cutterNumber && this.cutterNumber != '')){
        this.search()
      }

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
          :w="950"
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
              <button class="close-button"   @pointerup="showShelfListingModal=false">X</button>
            </div>

            <div class="shelf-listing-work-area">
              <input v-model="classNumber" class="number-input" placeholder="Class" @keyup="search" type="text" />
              <input v-model="cutterNumber" class="number-input" @keyup="search" placeholder="Cutter" type="text" />
              <button class="number-input" @click="save" :disabled="(!activeShelfListData.componentGuid)">Save</button>

              <div class="serach-results-container">
                <h2 v-if="searching == true"><span class="material-icons icon">search</span>Searching...</h2>

                <h3 v-if="searching==false && results.length==0">No Results</h3>

                <table v-if="searching==false">
                  <thead v-if="results.length>0">
                    <tr>
                      <td>Number</td>
                      <td>Contributor</td>
                      <td>Uniform Title</td>
                      <td>Title</td>
                      <td>Date</td>
                      <td> </td>

                    </tr>
                  </thead>
                  <tbody>

                    <template v-for="r in results">
                      <template  v-if="r.selected == undefined">
                        <tr>
                          <td>{{ r.term }}</td>
                          <td>{{ r.creator }}</td>
                          <td>{{ r.uniformtitle }}</td>
                          <td>{{ r.title }}</td>
                          <td>{{ r.pubdate }}</td>
                          <td><a v-if="r.lookup.trim() != ''" style="color: inherit; text-decoration: none;" target="_blank" :href="r.lookup">view</a></td>
                        </tr>
                      </template>

                      <template  v-if="r.selected != undefined && r.selected.trim() == 'selected'">
                        <tr style="background-color: yellow;">
                          <td>{{ r.term }}</td>
                          <td>{{ r.creator }}</td>
                          <td>{{ r.uniformtitle }}</td>
                          <td>{{ r.title }}</td>
                          <td>{{ r.pubdate }}</td>
                          <td><a v-if="r.lookup.trim() != ''" style="color: inherit; text-decoration: none;" target="_blank" :href="r.lookup">view</a></td>
                        </tr>
                      </template>





                    </template>







                  </tbody>


                </table>
                <button v-if="searching==false && results.length > 0" class="number-input" ref="moreButton" @click="hitCount += 20; search()">More</button>
              </div>


            </div>


          </div>


        </VueDragResize>
    </VueFinalModal>




</template>
<style>


</style>

<style scoped>

  .serach-results-container{
    margin-top: 1em;
  }

  .number-input{
    font-size: 1.5em;
  }

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
    padding: 1em;
    background-color: white;
    overflow-y: scroll !important;
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
