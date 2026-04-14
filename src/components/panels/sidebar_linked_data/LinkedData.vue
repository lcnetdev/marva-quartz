<script>
  import { useProfileStore } from '@/stores/profile'
  import { usePreferenceStore } from '@/stores/preference'
  import { AccordionList, AccordionItem } from "vue3-rich-accordion";

  import { mapStores, mapState, mapWritableState } from 'pinia'

  import utilsParse from '@/lib/utils_parse';
  import utilsProfile from '@/lib/utils_profile';
  import utilsNetwork from '@/lib/utils_network';


  export default {
    components: {
      AccordionList,
      AccordionItem
    },
    data() {
      return {

        currentThumbnailIndex: 0,
        selectedIsbn: null,
        loadingSellers: {},
        failedSellers: {},
        booksellerResults: [],

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

      availableIsbns(){
        let originalIsbns = (this.activeProfile && this.activeProfile.linkedData && this.activeProfile.linkedData.originalIsbns) ? this.activeProfile.linkedData.originalIsbns : []
        let linkedIsbns = (this.linkedData && this.linkedData.isbn) ? this.linkedData.isbn : []
        return [...new Set([...originalIsbns, ...linkedIsbns])]
      },
      defaultIsbn(){
        let originalIsbns = (this.activeProfile && this.activeProfile.linkedData && this.activeProfile.linkedData.originalIsbns) ? this.activeProfile.linkedData.originalIsbns : []
        if (originalIsbns.length > 0){
          return originalIsbns.reduce((a, b) => a.length >= b.length ? a : b)
        }
        return this.availableIsbns.length > 0 ? this.availableIsbns[0] : null
      },
      activeIsbn(){
        return this.selectedIsbn || this.defaultIsbn
      },

    },


    methods: {

      booksellers(){
        let isbn = this.activeIsbn

        return [
          { group: 'CN', sellers: [
            { key: 'baidu_baike', label: 'Baidu Baike', url: isbn ? `https://baike.baidu.com/search?word=${isbn}` : null },
            { key: 'books_tw', label: 'Books TW', url: isbn ? `https://search.books.com.tw/search/query/key/${isbn}` : null },
            { key: 'bookschina', label: 'Books China', url: isbn ? `https://www.bookschina.com/search/?keyword=${isbn}` : null },
          ]},
          { group: 'JP', sellers: [
            { key: 'amazon_jp', label: 'Amazon JP', url: isbn ? `https://www.amazon.co.jp/dp/${isbn}` : null },
            { key: 'ndlsearch', label: 'NDL Search', url: isbn ? `https://ndlsearch.ndl.go.jp/search?cs=bib&keyword=${isbn}` : null },
            { key: 'kinokuniya', label: 'Kinokuniya', url: isbn ? `https://www.kinokuniya.com/us/bw/${isbn}` : null },
          ]},
          { group: 'KO', sellers: [
            { key: 'yes24', label: 'Yes24', url: isbn ? `https://www.yes24.com/product/search?query=${isbn}` : null },
            { key: 'kyobobook', label: 'Kyobobook', url: isbn ? `https://search.kyobobook.co.kr/search?keyword=${isbn}` : null },
            { key: 'aladin', label: 'Aladin', url: isbn ? `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${isbn}` : null },
          ]},
          { group: 'RO/Other', sellers: [
            { key: 'carturesti', label: 'Carturesti', url: isbn ? `https://carturesti.ro/cautare?q=${isbn}` : null },
            { key: 'amazon_uk', label: 'Amazon UK', url: isbn ? `https://www.amazon.co.uk/dp/${isbn}` : null },
            { key: 'amazon_us', label: 'Amazon US', url: isbn ? `https://www.amazon.com/dp/${isbn}` : null },
          ]},
        ]
      },

      refreshIsbns(){
        let profile = utilsParse.extractISBN(JSON.parse(JSON.stringify(this.activeProfile)))
        let freshIsbns = (profile.linkedData && profile.linkedData.isbn) ? profile.linkedData.isbn : []
        // update originalIsbns on the active profile to match current state
        if (!this.activeProfile.linkedData){ this.activeProfile.linkedData = {} }
        this.activeProfile.linkedData.isbn = freshIsbns
        this.activeProfile.linkedData.originalIsbns = JSON.parse(JSON.stringify(freshIsbns))
        // if the selected isbn was removed, reset to default
        if (this.selectedIsbn && !this.availableIsbns.includes(this.selectedIsbn)){
          this.selectedIsbn = this.defaultIsbn
        }
      },

      async scrapeBooksellerData(site){
        delete this.failedSellers[site]
        let isbn = this.activeIsbn || ''
        let lccn = (this.activeProfile && this.activeProfile.linkedData && this.activeProfile.linkedData.lccn && this.activeProfile.linkedData.lccn.length > 0) ? this.activeProfile.linkedData.lccn[0] : ''
        let maxAttempts = 3
        let succeeded = false
        for (let attempt = 1; attempt <= maxAttempts; attempt++){
          this.loadingSellers[site] = 'attempt ' + attempt
          try {
            let result = await utilsNetwork.linkedDataBooksellerScrape(isbn, site, lccn)
            console.log('scrapeBooksellerData', site, 'attempt', attempt, result)
            if (result.status === 503){
              if (attempt < maxAttempts) continue
              break
            }
            let data = result.data
            if (data && data['@meta'] && !data['@meta'].success){
              break
            }
            if (data && data['@meta'] && data['@meta'].success && data.sections){
              let hasContent = (data.sections.description && data.sections.description.length > 0) || (data.sections.table_of_contents && data.sections.table_of_contents.length > 0)
              if (hasContent){
                this.booksellerResults = this.booksellerResults.filter(r => r.site !== site)
                this.booksellerResults.push({
                  site: site,
                  meta: data['@meta'],
                  title: data.title,
                  cover_image_url: data.cover_image_url,
                  sections: data.sections
                })
                this.linkedData.booksellerResults = this.booksellerResults
                succeeded = true
                break
              }
              // success but no description/toc, retry once more
              if (attempt < 2) continue
            }
            break
          } catch(e) {
            console.error('scrapeBooksellerData error', site, e)
            break
          }
        }
        delete this.loadingSellers[site]
        if (!succeeded){
          this.failedSellers[site] = true
        }

        window.setInterval(() => {
            console.log("profileStore.linkedData", this.profileStore.linkedData)  

          }, 1000)
      },

      addBooksellerItem(site, sectionKey, value){
        let dataTypeMap = {
          'description': 'description',
          'table_of_contents': 'toc',
          'about_author': 'description'
        }
        let dataType = dataTypeMap[sectionKey] || sectionKey
        this.add({ id: site, type: 'bookseller', dataType: dataType, value: value })
      },

      booksellerSectionLabel(key){
        let labels = {
          'description': 'Description',
          'table_of_contents': 'Table of Contents',
          'about_author': 'About Author'
        }
        return labels[key] || key
      },

      openBookseller(url){
        if (url){
          window.open(url, '_blank')
        }
      },

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
        this.failedSellers = {}
        this.booksellerResults = []
        this.linkedData.booksellerResults = []
        this.requestLinkedDataBuild()
      },
      activeIsbn() {
        this.failedSellers = {}
      },
      defaultIsbn(newVal) {
        if (newVal && !this.selectedIsbn) {
          this.selectedIsbn = newVal
        }
      }
    },

    mounted() {
        if (this.defaultIsbn) { this.selectedIsbn = this.defaultIsbn }
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

      <template v-for="result in booksellerResults" :key="result.site">
        <div class="bookseller-result">
          <div class="bookseller-result-header">
            <strong>{{ result.site }}</strong>
            <template v-if="result.title"> &mdash; {{ result.title }}</template>
            <a v-if="result.meta && result.meta.url_to_item" :href="result.meta.url_to_item" target="_blank" class="external-link" style="margin-left: 0.5em;">open</a>
          </div>
          <div v-if="result.cover_image_url" style="text-align: center; margin: 0.5em 0;">
            <img :src="result.cover_image_url" alt="Cover" style="max-width: 120px; height: auto;"/>
          </div>
          <AccordionList :open-multiple-items="false">
            <template v-for="(items, sectionKey) in result.sections" :key="sectionKey">
              <AccordionItem style="height: auto" :default-closed="true" v-if="items && items.length > 0">
                <template #summary>
                  <div class="title">{{ booksellerSectionLabel(sectionKey) }}</div>
                </template>
                <template v-for="(item, itemIndex) in items" :key="itemIndex">
                  <div class="accordion-item">
                    <div class="value" v-html="item"></div>
                    <div class="controls">
                      <button @click="addBooksellerItem(result.site, sectionKey, item)">Add</button>
                      <a v-if="result.meta && result.meta.url_to_item" target="_blank" class="external-link" :href="result.meta.url_to_item">{{ result.site }}</a>
                    </div>
                  </div>
                </template>
              </AccordionItem>
            </template>
          </AccordionList>
        </div>
      </template>

      <div v-if="linkedData.isbn && linkedData.isbn.length > 0">
        <!-- <div>Amazon Links</div>
        <button style="margin-left: 1em;" @click="allAmazonLinks(linkedData.isbn)">Open All</button>
        <template v-for="(isbn, index) in linkedData.isbn">
          <div class="value" v-if="isbn.length==10">
            <a :href="'https://www.amazon.com/dp/' + isbn +'/'" target="_blank">{{ isbn }}</a>
          </div>

        </template> -->

      </div>

      <div class="booksellers-section">
        <div>Booksellers</div>
        <div v-if="availableIsbns.length > 0" class="bookseller-isbn-select">
          <label>Use ISBN: </label>
          <select v-model="selectedIsbn">
            <option v-for="isbn in availableIsbns" :key="isbn" :value="isbn">{{ isbn }}</option>
          </select>
          <button @click="refreshIsbns" class="refresh-isbn-btn" title="Refresh ISBNs from record">
            <span class="material-icons-outlined">refresh</span>
          </button>
        </div>
        <div v-for="group in booksellers()" :key="group.group" class="bookseller-group">
          <div class="bookseller-group-label">{{ group.group }}</div>
          <div class="booksellers-grid">
            <button v-for="seller in group.sellers" :key="seller.key" :disabled="!seller.url || loadingSellers[seller.key]" @click="scrapeBooksellerData(seller.key)" :class="['bookseller-btn', { loading: loadingSellers[seller.key], failed: failedSellers[seller.key] }]">
              <template v-if="loadingSellers[seller.key]">
                <span class="btn-spinner"></span> {{ loadingSellers[seller.key] }}
              </template>
              <span v-else>{{ seller.label }}</span>
            </button>
          </div>
        </div>
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

.bookseller-result{
  margin-top: 1em;
  border: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-edit-field-border-color')");
  border-radius: 4px;
  padding: 0.5em;
}
.bookseller-result-header{
  margin-bottom: 0.5em;
}
.booksellers-section{
  margin-top: 1em;
}
.bookseller-isbn-select{
  margin-top: 0.5em;
  display: flex;
  align-items: center;
  gap: 0.3em;
}
.refresh-isbn-btn{
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  vertical-align: middle;
}
.refresh-isbn-btn span{
  font-size: 1.3em;
}
.bookseller-group{
  margin-top: 0.5em;
}
.bookseller-group-label{
  font-weight: bold;
  font-size: 0.85em;
  margin-bottom: 0.3em;
}
.booksellers-grid{
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
}
.bookseller-btn{
  padding: 0.3em 0.6em;
  border-radius: 4px;
  cursor: pointer;
}
.bookseller-btn:disabled{
  opacity: 0.4;
  cursor: not-allowed;
}
.bookseller-btn:disabled.loading{
  opacity: 1;
}
.bookseller-btn.failed{
  opacity: 0.6;
  text-decoration: line-through;
}
.btn-spinner{
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}
@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

</style>
