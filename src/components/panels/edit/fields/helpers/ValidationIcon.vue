<template>

<span class="simptip-position-right" :data-tooltip="useIcon[1]">
    <span :class="['material-icons',useIcon[0]]"  >{{useIcon[0]}}</span>

  </span>
  <!-- <span>{{value}}</span>   -->
</template>

<script>

import { useProfileStore } from '@/stores/profile'
import { mapStores,  } from 'pinia'
import { usePreferenceStore } from '@/stores/preference'



export default {
  name: "ValidationIcon",
  components: {
  },

  props: {
    value: Object

  },

  data:function() {
    return {

    }
  },

  created: function(){


  },

  computed: {

    ...mapStores(useProfileStore),
    ...mapStores(usePreferenceStore),


    useIcon(){

      if (this.value && this.value.URI){
        return ['verified','Linked']
      }else{
        return this.profileStore.returnValidationType( this.value['@guid'])
      }

      return [null,null]

    }, 

    


  },



  methods:{


  }

};

</script>

<style>

.verified {
    color: v-bind("preferenceStore.returnValue('--c-edit-main-lookup-icon-linked-color')");
    font-size: 1.5em;
    font-weight: bold;
    vertical-align: middle;
    padding-left: 5px;
}
.warning {
    color: green;
    font-size: 1.5em;
    font-weight: bold;
    vertical-align: middle;
    padding-left: 5px;
}
.done_all {
    color: green;
    font-size: 1.5em;
    font-weight: bold;
    vertical-align: middle;
    padding-left: 5px;
}

.help{
  color: orange;
  font-size: 1.5em;
  font-weight: bold;
  vertical-align: middle;
  padding-left: 5px;
}
.report{
  color: rebeccapurple;
  font-size: 1.5em;
  font-weight: bold;
  vertical-align: middle;
  padding-left: 5px;
}


</style>

