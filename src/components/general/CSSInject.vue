<script>
  // import { useProfileStore } from '@/stores/profile'

  // import { mapStores, mapState } from 'pinia'

  export default {
    data() {
      return {
        test: 'cyan'
      }
    },
    computed: {
      // // other computed properties
      // // ...
      // // gives access to this.counterStore and this.userStore
      // ...mapStores(useProfileStore),
      // // // gives read access to this.count and this.double
      // ...mapState(useProfileStore, ['profilesLoaded']),
    },

    // watch: {
    //   // whenever question changes, this function will run
    //   question(newVal, oldVal) {
    //     if(newVal===true){

    //     }
    //   }
    // },

    methods: {


      returnDefaultStyle: function(){
        return 'cyan'
      }
      

    },

    mounted() {
     

    }
  }



</script>

<template>
<h2>YOOOOOO</h2>
</template>

<style>

:root {

  --c-edit-main-splitpane-properties-background-color: v-bind('test'); 


}

body, h2{
  background: v-bind("test");
}



</style>
