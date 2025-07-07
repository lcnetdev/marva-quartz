<script>
  // import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'
  import { usePreferenceStore } from '@/stores/preference'



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
        changedHeight: 550,
        initalLeft: 50,
        initalWidth:950,
        initalTop:10,
        searching: false,

        classNumber: null,
        cutterNumber:null,
        displaySubjects: true,
        contributor:null,
        title:null,
        subj:null,
        date:null,
        countParam:null,

        hitCount: 10,
        results: [],

        loadingMore: false,
        loadingMoreDescending: false,


        searchDebounce: null,

        oldInterface: false,

        idbase: useConfigStore().returnUrls.id,
        preserveSpace: false,


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      // ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),
      ...mapStores(useProfileStore),
      ...mapStores(usePreferenceStore),





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

          this.changedHeight = newRect.height
          // this.initalLeft = newRect.left

          this.$refs.shelfListingContent.style.height = newRect.height + 'px'
          this.$refs.shelfListingDisplay.style.height = newRect.height - 44 + 'px'



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

        async search(){



          window.clearTimeout(this.searchDebounce)
          this.searchDebounce = window.setTimeout(async () =>{
            this.searching=true
            this.results = []
            if (!this.classNumber){this.classNumber=''}
            if (!this.cutterNumber){this.cutterNumber=''}

            let contributor = this.contributor ? "&sp-name="+this.contributor : ""
            let title = this.title ? "&sp-title="+this.title  : ""
            let subj = this.subj ? "&sp-subject="+this.subj  : ""
            let date = this.date ? "&sp-date="+this.date : ""
            let countParam = "&count=201"

            let cutter = this.preserveSpace ? this.cutterNumber : this.cutterNumber.trim()
            let initalResult =  await utilsNetwork.searchShelfList(
              this.classNumber.trim() + '' + cutter,
              contributor + title + subj + date + countParam
            )
            let initalFirstClass = initalResult[0].term
            let initalLastClass = initalResult[initalResult.length-1].term

            let initalIds = initalResult.map((v) => {return v.bibid})


            // PS3603.R
            // browse-order=ascending&browse=class&count=200&mime=json
            const initalFirstClassPromise = utilsNetwork.searchShelfList(initalFirstClass, "&count=201&browse-order=descending&browse=class&mime=json")
            const initalLastClassPromise = utilsNetwork.searchShelfList(initalLastClass, "&count=201&browse-order=ascending&browse=class&mime=json")


            let firstExpand = await Promise.all([initalFirstClassPromise, initalLastClassPromise]);

            // const initalFirstClassPos = firstExpand[0].map(e => e.selected).indexOf('selected');
            // const initalLastClassPos = firstExpand[1].map(e => e.selected).indexOf('selected');

            for (let toAdd of firstExpand[0].reverse()){
              if (!toAdd.selected && initalIds.indexOf(toAdd.bibid) == -1){
                initalResult.unshift(toAdd)
              }
            }
            for (let toAdd of firstExpand[1]){
              if (!toAdd.selected && initalIds.indexOf(toAdd.bibid) == -1){
                initalResult.push(toAdd)
              }
            }





            this.results=initalResult
            this.searching=false
            // this.dragResize()

            this.$refs.shelfListingContent.style.height = this.changedHeight + 'px'
            this.$refs.shelfListingDisplay.style.height = this.changedHeight - 44 + 'px'



            this.$nextTick(async () => {
              this.$refs.selected[0].scrollIntoView({
                behavior: 'auto',
                block: 'center',
                inline: 'center'
               });


               // load up some more results while they start looking
               await this.searchLoadMore()
              //  await this.searchLoadMore()

            });

          },750)



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

            classPropertyPath = classPropertyPath.map((v) => {
              v.propertyURI = v.propertyURI.replace("itemPortion",'classificationPortion')
              return v
            })



            await this.profileStore.setValueLiteral(this.activeShelfListData.componentGuid,this.activeShelfListData.classGuid,classPropertyPath,this.classNumber)
          }

          if (this.cutterNumber && this.cutterNumber != ''){  //.trim()
            if (!this.activeShelfListData.cutterGuid){
              this.activeShelfListData.cutterGuid = short.generate()
            }
            await this.profileStore.setValueLiteral(this.activeShelfListData.componentGuid,this.activeShelfListData.cutterGuid,this.activeShelfListData.componentPropertyPath,this.cutterNumber)
          }



          this.showShelfListingModal=false


        },


        async searchOld(){
          if (!this.classNumber){this.classNumber=''}
          if (!this.cutterNumber){this.cutterNumber=''}

          const contributor = this.contributor ? "&sp-name="+this.contributor : ""
          const title = this.title ? "&sp-title="+this.title  : ""
          const subj = this.subj ? "&sp-subject="+this.subj  : ""
          const date = this.date ? "&sp-date="+this.date : ""
          const countParam = this.hitCount ? "&count="+this.hitCount : ""

          this.results = []
          this.searching=true
          let cutter = this.preserveSpace ? this.cutterNumber : this.cutterNumber.trim()
          this.results =  await utilsNetwork.searchShelfList(
            this.classNumber.trim() + '' + cutter,
            contributor + title + subj + date + countParam
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

        async searchLoadMore(){

          if (this.loadingMore){ return false}
          if (!this.results){return false}
          if (!this.results[this.results.length-1]){ return false}
          this.loadingMore = true

          let lastTerm = this.results[this.results.length-1].term
          let ids = this.results.map((v) => {return v.bibid})

          const initalLastClassPromise = await utilsNetwork.searchShelfList(lastTerm, "&count=201&browse-order=ascending&browse=class&mime=json")
          for (let toAdd of initalLastClassPromise){
              if (!toAdd.selected && ids.indexOf(toAdd.bibid) == -1){
                this.results.push(toAdd)
              }
            }

          this.loadingMore = false

        },
        async searchLoadMoreDescending(){

        if (this.loadingMore){ return false}
        if (!this.results){return false}
        if (!this.results[0]){ return false}
        this.loadingMore = true

        let firstTerm = this.results[0].term
        let ids = this.results.map((v) => {return v.bibid})

        const initalFirstClassPromise = await utilsNetwork.searchShelfList(firstTerm, "&count=201&browse-order=descending&browse=class&mime=json")


        for (let toAdd of initalFirstClassPromise.reverse()){
            if (!toAdd.selected && ids.indexOf(toAdd.bibid) == -1){
              this.results.unshift(toAdd)
            }
          }


        this.loadingMore = false

        },

        async watchScroll(event){

          let element = event.target

          let percentScrolled = (element.scrollTop + element.offsetHeight) / element.scrollHeight


          if (percentScrolled>=0.8){
            this.searchLoadMore()

          }else if (element.scrollTop <= 1){

            if (this.loadingMoreDescending){return false}

            let firstBibid = JSON.parse(JSON.stringify(this.results[0].bibid))

            this.loadingMoreDescending=true
            await this.searchLoadMoreDescending()

            let el = document.querySelector(`[data-bibid="${firstBibid}"]`)

            el.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
            el.style.transitionDuration = '5s';
            el.style.backgroundColor = 'cornflowerblue';
            window.setTimeout(()=>{
              el.style.removeProperty('background-color')
            },5000)



            this.loadingMoreDescending=false
            // element.scrollTop = 100
          }

        }




    },

    async created(){

      // this.width=50
      this.initalWidth=window.innerWidth/1.25
    },

    async mounted() {
      // If they launched the shefllist from the tools menu then it does not have the
      // context of launching from the component, so fake it via the profile
      if (Object.keys(this.activeShelfListData)==0){
        this.profileStore.buildActiveShelfListDataFromProfile()
      }
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
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"


    >
        <VueDragResize
          :is-active="true"
          :w="initalWidth"
          :h="initalHeight"
          :x="initalLeft"
          :y="initalTop"
          class="shelf-listing-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="shelf-listing-content" ref="shelfListingContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)" :style="`${this.preferenceStore.styleModalBackgroundColor()} ${this.preferenceStore.styleModalTextColor()}`">

              <div class="shelflist-menu">
                <input v-model="classNumber" class="number-input" placeholder="Class" @input="search()" type="text" />
                <input v-model="cutterNumber" class="number-input" @input="search()" placeholder="Cutter" type="text" />
                <button class="number-input" @click="save" :disabled="(!activeShelfListData.componentGuid)">Save</button>
                <input name="preserveSpace" type="checkbox" v-model="preserveSpace" @click="search()" />
                <label for="preserveSpace">Preserve Spaces</label>

                <div class="menu-buttons">
                  <button class="close-button"   @pointerup="showShelfListingModal=false">X</button>
                </div>



              </div>
              <div id="listing-display" ref="shelfListingDisplay" @scroll="watchScroll">

                <div class="loader" v-if="searching"></div>
                <h3 v-if="searching==false && results.length==0">No Results</h3>

                <table v-if="searching==false">
                  <thead v-if="results.length>0" :style="`${this.preferenceStore.styleModalTextColor()} ${this.preferenceStore.styleModalBackgroundColor()}`">
                    <tr>
                      <th :style="`${this.preferenceStore.styleModalBackgroundColor()}`">Number</th>
                      <th :style="`${this.preferenceStore.styleModalBackgroundColor()}`">Main Author, Creator, etc.</th>
                      <th :style="`${this.preferenceStore.styleModalBackgroundColor()}`">Uniform Title</th>
                      <th :style="`${this.preferenceStore.styleModalBackgroundColor()}`">Title</th>
                      <th v-if="displaySubjects" :style="`${this.preferenceStore.styleModalBackgroundColor()}`">Subject</th>
                      <th :style="`${this.preferenceStore.styleModalBackgroundColor()}`">Date</th>
                      <th :style="`${this.preferenceStore.styleModalBackgroundColor()}`"> </th>

                    </tr>
                  </thead>
                  <tbody>

                    <template v-for="r in results">
                      <template  v-if="r.selected == undefined">
                        <tr :class="[{nuba: r.notused == 'nuba'}]" :data-bibid="r.bibid">
                          <td>{{ r.term }}</td>
                          <td>{{ r.creator }}</td>
                          <td>{{ r.uniformtitle }}</td>
                          <td>{{ r.title }}</td>
                          <td v-if="displaySubjects">{{ r.subject }}</td>
                          <td>{{ r.pubdate }}</td>
                          <td><a v-if="r.bibid.trim() != ''" style="color: inherit; text-decoration: none;" target="_blank" :href="this.idbase + 'resources/works/' + r.bibid">view</a></td>
                        </tr>
                      </template>

                      <template  v-if="r.selected != undefined && r.selected.trim() == 'selected'">
                        <tr style="background-color: yellow;" ref="selected" :data-bibid="r.bibid">
                          <td>{{ r.term }}</td>
                          <td>{{ r.creator }}</td>
                          <td>{{ r.uniformtitle }}</td>
                          <td>{{ r.title }}</td>
                          <td v-if="displaySubjects">{{ r.subject }}</td>
                          <td>{{ r.pubdate }}</td>
                          <td><a v-if="r.bibid.trim() != ''" style="color: inherit; text-decoration: none;" target="_blank" :href="this.idbase + 'resources/works/' + r.bibid">view</a></td>
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

  table{
    width: 100%;
  }

  thead th {
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 100;
    border-bottom: solid 1px whitesmoke;

  }

  #listing-display{
    overflow-y: scroll !important;
  }
  .shelflist-menu{
    padding: 0.5em;
    width: 100%;
    height: 43px;
    position: relative;

  }

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

  thead tr td{
    text-align: left;
    font-weight: bolder;

  }
  th{
    text-align: left;
    font-weight: bold;

  }
  tr:hover{
    background-color: aliceblue;
    color:black
  }
  td{
    border-bottom: solid 1px whitesmoke;
    /* font-family: Avenir, Helvetica, Arial, sans-serif; */

  }
  #shelf-listing-content{
    padding: 0.2em;
    background-color: white;

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

    position: absolute;
    z-index: 200;
    right: 10px;
    top: 12px;

  }
  .close-button{
    position: absolute;
    right: 0px;
    top: 0px;
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
  }

  .nuba {
      background-color: lightgray;
  }

  .loader {
  width: 100px;
  height: 100px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  margin-top: 10%;
}
.loader::after,
.loader::before {
  content: '';
  box-sizing: border-box;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #99a4f0;
  position: absolute;
  left: 0;
  top: 0;
  animation: animloader 2s linear infinite;
}
.loader::after {
  animation-delay: 0s;
}

@keyframes animloader {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}


</style>
