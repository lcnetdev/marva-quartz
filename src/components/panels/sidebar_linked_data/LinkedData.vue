<script>
  import { useProfileStore } from '@/stores/profile'
  import { usePreferenceStore } from '@/stores/preference'
  import { AccordionList, AccordionItem } from "vue3-rich-accordion";

  import { mapStores, mapState, mapWritableState } from 'pinia'



  export default {
    components: {
      AccordionList,
      AccordionItem
    },
    data() {
      return {

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      ...mapStores(useProfileStore,usePreferenceStore),
      // // gives read access to this.count and this.double
      ...mapState(useProfileStore, ['profilesLoaded','activeProfile','rtLookup', 'activeComponent','linkedData']),
      ...mapState(usePreferenceStore, ['styleDefault']),

      ...mapWritableState(useProfileStore, ['activeComponent']),

    },


    methods: {

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
      }


    },
    watch: {
      // whenever question changes, this function will run
      activeProfile(newVal, oldVal) {
        // console.log('activeProfile changed from', oldVal, 'to', newVal)
        
        if (newVal && newVal.linkedData && newVal.linkedData.isbn && newVal.linkedData.isbn.length > 0 && !newVal.linkedData.done ) {
          
          console.log("BUILD LINBKED DATA ASDFASDFDSAF")
          this.profileStore.buildLinkedData()
        }



      }
    },

    mounted() {


        if (this.activeProfile && this.activeProfile.linkedData && this.activeProfile.linkedData.isbn && this.activeProfile.linkedData.isbn.length > 0 && !this.activeProfile.linkedData.done ) {
          
          console.log("BUILD LINBKED DATA ASDFASDFDSAF mounted")
          this.profileStore.buildLinkedData()
        }


    }
  }



</script>

<template>


<template v-if="linkedData && linkedData.thumbnail && linkedData.thumbnail.length > 0">
  
  <img :src="linkedData.thumbnail[0].value" alt="Thumbnail" style="width:25%; height: auto; margin-left: auto; margin-right: auto; display: block; max-width: 400px;"/>
</template>

  
  <AccordionList  :open-multiple-items="false">

    <template v-for="(value, index) in linkedData">

      <AccordionItem style="height: auto"    :default-closed="true" v-if="index != 'thumbnail'">
        <template #summary>
          <div >{{ index }}</div>
        </template>

        <template v-for="(item, itemIndex) in linkedData[index]">
          <div class="accordion-item" >
            <div style="background-color: whitesmoke;">{{ item.value }}</div>
            <div>From <a target="_blank" :href="buildLink(item)">{{ item.type }}</a></div>

            <div><button v-if="item.dataType != '6xx'" @click="add(item)">Add</button></div>
          </div>
        </template>

      </AccordionItem>
    </template>

  </AccordionList>


</template>

<style scoped>

.accordion-item:hover {
  background-color: antiquewhite;
}
.accordion-item{
  height: auto;
}

</style>
