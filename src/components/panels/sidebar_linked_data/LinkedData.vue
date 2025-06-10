<script>
  import { useProfileStore } from '@/stores/profile'
  import { usePreferenceStore } from '@/stores/preference'
  import { AccordionList, AccordionItem } from "vue3-rich-accordion";

  import { mapStores, mapState, mapWritableState } from 'pinia'

  import utilsParse from '@/lib/utils_parse';
  import utilsProfile from '@/lib/utils_profile';


  export default {
    components: {
      AccordionList,
      AccordionItem
    },
    data() {
      return {

        currentThumbnailIndex: 0,

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,usePreferenceStore),
      // // gives read access to this.count and this.double
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','rtLookup', 'activeComponent']),
      ...mapState(usePreferenceStore, ['styleDefault']),

      ...mapWritableState(useProfileStore, ['activeComponent','linkedData']),

    },


    methods: {

      allAmazonLinks(isbnList) {
        let links=[]
        for (let i = 0; i < isbnList.length; i++) {
          if (isbnList[i].length == 10) {
            links.push(`https://www.amazon.com/dp/${isbnList[i]}/`);
          }
        }

        for (let l of links){
          window.open(l, '_blank');
        }
        

      },
      add(item){

//         this.profileStore.addLinkedData({id: 'hSJ0zwEACAAJ', type: 'googleBooks', dataType: 'subtitle', value: 'The Origins of Public Education in Imperial Austria 1769-1869'})
//         this.profileStore.addLinkedData({
//     "id": "hSJ0zwEACAAJ",
//     "type": "googleBooks",
//     "dataType": "description",
//     "value": "Tomás Cvrček offers a re-evaluation of the Theresian school reform of 1774 and its consequences using statistical data on schooling produced by the public administration. As the most comprehensive examination of this vast body of statistical material to date, the book assesses the reliability of these sources, their proper interpretation, and their limitations in order to shed light on questions such as the extent of the school network, the degree of enforcement of compulsory schooling, the rate of enrolment and attendance, the level of financing, the social and economic position of teachers, and the political economy of schooling provision. Covering a period from the reform's inception to the liberal overhaul in 1869, the statistical analysis reveals that, by most measures, the introduction of universal elementary schooling was much less successful than has been thought. Even the most advanced crown lands did not see ninety percent of their school-age children in classrooms until fifty years after the reform and there were many areas where schooling made no inroads until shortly before the First World War. In contrast to much of the previous literature that blamed incompetence and half-hearted implementation of the policy for these shortcomings, the author argues that the fundamental flaw lay in the policy's design and, specifically, in the imperial government's insistence on control and enforced uniformity of schooling throughout the realm. The slow development of Austrian schooling thus resulted from the inflexibility of the very policy that was supposed to speed it up."
// })
        this.profileStore.addLinkedData(item)
      },

      buildLink(item){
        if (item.type == 'googleBooks') {
          return `https://books.google.com/books?id=${item.id}`
        }else if (item.type == 'oclc') {
          return `https://www.worldcat.org/oclc/${item.id}`
        }
      },

      requestLinkedDataBuild(){
        // this.linkedData = {
        //   done: false,
        //   isbn:  []
        // }
        if (this.activeProfile.linkedData && this.activeProfile.linkedData.isbn){ this.linkedData.isbn = this.activeProfile.linkedData.isbn }
        
        let hasContributors = (utilsProfile.returnContributorUris(this.activeProfile).length > 0)

        
        
        if ( (this.activeProfile && this.activeProfile.linkedData && this.activeProfile.linkedData.isbn && this.activeProfile.linkedData.isbn.length > 0 && !this.activeProfile.linkedData.done) || (hasContributors ) ) {
          this.profileStore.buildLinkedData()
          // let interval = window.setInterval(() => {
          //   console.log("Checking if linked data is done", this.linkedData)
          //   if (this.linkedData.done){                     
          //     console.log("Linked Data Done", this.linkedData)  
          //     clearInterval(interval)              
          //   }
          // }, 100)

        }else{
          // no isbn to work with just set done to true
          this.linkedData.done = true
          console.log("No ISBNs found, we should check from time tot totomfmemefmejmf")


        }
      },

      tryAgain() {
        let profile = utilsParse.extractISBN(JSON.parse(JSON.stringify(this.activeProfile)))
        if (profile.linkedData && profile.linkedData.isbn && profile.linkedData.isbn.length > 0) {
          this.activeProfile.linkedData = {
            done: false,
            isbn: profile.linkedData.isbn
          }
          this.requestLinkedDataBuild()
        }

          
      },

      prevThumbnail() {
        if (this.currentThumbnailIndex > 0) {
          this.currentThumbnailIndex--;
        }
      },
      nextThumbnail() {
        if (this.currentThumbnailIndex < this.linkedData.thumbnail.length - 1) {
          this.currentThumbnailIndex++;
        }
      }



    },
    watch: {
      // if the page loads directly to the /edit/e#### route this will wait for the profile to be ready to kick of the api requests
      // it doesn't fire on deep changes so really only the first time the profile is built
      activeProfile(newVal, oldVal) {
        this.requestLinkedDataBuild()
      }
    },

    mounted() {

        this.requestLinkedDataBuild()



    }
  }



</script>

<template>


    <template v-if="linkedData && linkedData.done && linkedData.isbn">
      <template v-if="linkedData && linkedData.thumbnail && linkedData.thumbnail.length > 0">        
      
        <div style="text-align: center; margin-bottom: 1em;">
          <img :src="linkedData.thumbnail[currentThumbnailIndex].value" alt="Thumbnail" style="width:25%; height: auto; margin-left: auto; margin-right: auto; display: block; max-width: 400px;"/>
          <div v-if="linkedData.thumbnail.length > 1" style="margin-top: 0.5em;">
            <button @click="prevThumbnail" :disabled="currentThumbnailIndex === 0" class="thumbnails-arrows">
              <span data-v-f813a490="" class="material-icons-outlined">arrow_circle_left</span>

            </button>
            <span>{{ currentThumbnailIndex + 1 }} / {{ linkedData.thumbnail.length }}</span>
            <button @click="nextThumbnail" :disabled="currentThumbnailIndex === linkedData.thumbnail.length - 1" class="thumbnails-arrows">
              <span data-v-f813a490="" class="material-icons-outlined">arrow_circle_right</span>

            </button>
          </div>
        </div>
      
      </template>

        
        <AccordionList  :open-multiple-items="false">

          <template v-for="(value, index) in linkedData">
            
            <AccordionItem style="height: auto" :default-closed="true" v-if="index != 'thumbnail' && index != 'done' && index != 'isbn' && index != 'contributors' && linkedData[index].length>0">
              <template #summary>

                <div class="title" >
                  <template v-if="index=='subtitle'">Subtitle</template>
                  <template v-if="index=='noteContent'">Summary Note</template>
                  <template v-if="index=='noteTOC'">Table of Contents</template>
                  <template v-if="index=='lcsh'">Subject Heading</template>
                  <template v-if="index=='genre'">Genre/Form</template>

                </div>
              </template>

              <template v-for="(item, itemIndex) in linkedData[index]">
                <div class="accordion-item" >

                  <div class="value" v-if="item.dataType != '6xx'" >{{ item.value }}</div>
                  <div class="value" v-else >
                    <span v-for="x in item.value" class="subject-heading">${{ Object.keys(x)[0] }}&nbsp;{{ x[Object.keys(x)[0]] }} </span>
                  </div>

                  <div class="controls">
                    <button  @click="add(item)">Add</button>

                    <a target="_blank" class="external-link" :href="buildLink(item)">{{ item.type }}</a>
                  
                  </div>

                  
                </div>
              </template>

            </AccordionItem>
          </template>

        </AccordionList>

      <div v-if="linkedData.isbn && linkedData.isbn.length > 0">
        <div>Amazon Links</div>
        <button style="margin-left: 1em;" @click="allAmazonLinks(linkedData.isbn)">Open All</button>
        <template v-for="(isbn, index) in linkedData.isbn">
          <div class="value" v-if="isbn.length==10">
            <a :href="'https://www.amazon.com/dp/' + isbn +'/'" target="_blank">{{ isbn }}</a>
          </div>

        </template>

      </div>

    </template>
    <template v-else-if ="linkedData && !linkedData.done">
      <div style="text-align: center; padding: 1em; font-size: 1.2em;">
        <span class="loader"></span>  
      </div>
    </template>
    <template v-else-if ="linkedData && linkedData.done && !linkedData.isbn">
      <div style="text-align: center; padding: 1em; font-size: 1.2em;">
        <span>No linked data found for this record.</span><br/>
        <button @click="tryAgain">Try Again</button>

      </div>
    </template>
    <template v-else>
      <div style="text-align: center; padding: 1em; font-size: 1.2em;">
        <span>No linked data found for this record.</span><br/>
        <button @click="tryAgain">Try Again</button>
      </div>
    </template>

</template>

<style scoped>


.subject-heading{
  font-family: 'Courier New', Courier, monospace;
  padding-right: 0.2em;
}
.external-link{
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;
  text-decoration: none;
  background-color:v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')") !important;
  border-radius: 10px;
  border: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')") !important;
  padding-left: 4px;
  padding-right: 4px;
  float: right;


}
.value{
  padding: 10px;
  background-color:v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-focused-field-color')") !important;

  
}
.controls{
  /* border-top: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')") !important; */
  border-bottom: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')") !important;
  padding: 2px;
  margin-top: 5px;
}
.thumbnails-arrows{
  background-color: transparent;
  border: none;
  vertical-align: middle;
}
.thumbnails-arrows span{
  font-size: 2em;
  color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;

}
.thumbnails-arrows:disabled span{
  color: rgba(0,0,0,0.2) !important;
}

/* https://cssloaders.github.io/ */
.loader {
  width: 48px;
  height: 48px;
  display: inline-block;
  position: relative;
}
.loader::after,
.loader::before {
  content: '';  
  box-sizing: border-box;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #7dbeff;
  position: absolute;
  left: 0;
  top: 0;
  animation: animloader 2s linear infinite;
}
.loader::after {
  animation-delay: 1s;
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
    

details{
  border: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-literal-font-color')") !important;
  margin:0.2em;
  padding:0.2em;
  border-radius: 0.2em;
}

.accordion-item:hover {

}
.accordion-item{
  height: auto;
}

.accordion-list{
  color: v-bind("preferenceStore.returnValue('--c-edit-main-literal-font-color')") !important;

}

.title{
}

</style>
