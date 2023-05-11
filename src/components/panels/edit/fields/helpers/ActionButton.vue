<template>

<!--   <div>
        <button @mouseover="actionButtonShow" class="action-button"><span class="material-icons action-button-icon">{{preferenceStore.returnValue('--s-edit-general-action-button-icon')}}</span></button>
        <div @mouseout="startHideActionButton" @mousemove="actionButtonShow" ref="actionMenu" v-if="showActionButtonMenu" class="action-button-list-container">
            
            <template v-if="type == 'literal'">
              <a @mouseover.stop="" v-on:click.prevent.stop="actionClick('addNonLatinLiteral')" href="@">Add non-latin literal</a>
            </template>
        </div>
  </div>
 -->

  <VMenu @hide="menuClosed">
    <button class="action-button"><span class="material-icons action-button-icon">{{preferenceStore.returnValue('--s-edit-general-action-button-icon')}}</span></button>

    <template #popper>

      <template v-if="type=='literal'">

          <button class="" @click="$emit('actionButtonCommand', 'addField')">
            Add Additional Field
          </button><br>
          <button style="width:100%" class="">
            Transliterate
          </button>
          <hr/>

          <button style="width:100%" class="" @click="showDebug()">
            Debug
          </button>



      </template>


      <template v-if="type=='lookupSimple'">

          <button style="width:100%" class="" @click="showDebug()">
            Debug
          </button>
      </template>

      <template v-if="type=='lookupComplex'">

          <button style="width:100%" class="" @click="showDebug()">
            Debug
          </button>
      </template>


      





      <!-- 
        <VDropdown
          v-for="n in 5"
          :key="n"
          placement="right-start"
          instant-move
        >
          <button class="rounded hover:bg-green-100 px-4 py-2">
            Sub menu >
          </button>
        </VDropdown> -->


    </template>
  </VMenu>



</template>

<script>

  import { usePreferenceStore } from '@/stores/preference'
  import { useProfileStore } from '@/stores/profile'


  import { mapStores, mapState, mapWritableState } from 'pinia'


  export default {
    props: {
      type: String,
      guid: String,
    },
    data () {
      return {
        showActionButtonMenu: false,
        showActionButtonMenuTimer: null,
      }
    },
    computed: {
      ...mapStores(usePreferenceStore),
      ...mapStores(useProfileStore),
      ...mapWritableState(usePreferenceStore, ['debugModalData','showDebugModal']),


    },

    methods: {



      menuClosed: function(){
        console.log("CLOSED")
      },

      showDebug: function() {
        

        this.debugModalData= this.profileStore.returnStructureByComponentGuid(this.guid); 
        this.showDebugModal = true

      },

      // /**
      // * When the mouse moves over the relevant elements open the action menu
      // * if they move again it will clear any close timer
      // * @return {void}
      // */
      // actionButtonShow: function(){
      //   this.showActionButtonMenu=true
      //   window.clearTimeout(this.showActionButtonMenuTimer)
      // },
      // /**
      // * When the mouse moves out of the menu start the time to close it 
      // * @return {void}
      // */
      // startHideActionButton: function(){
      //   this.showActionButtonMenuTimer = window.setTimeout(()=>{
      //     this.showActionButtonMenu=false
      //   },500)
      // },

      // /**
      // * When they click on a command in the list, emit the command and clean up interface
      // * @return {void}
      // */
      // actionClick(cmd){
      //     this.$emit('actionButtonCommand', cmd)
      //     this.showActionButtonMenu=false
      // }

    },
    watch: {

    }
  }
</script>

<style scoped>
  .action-button-icon{
    font-size: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-size')");
    color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-color')");
  }
  .action-button{
      background-color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-background-color')") !important;
      border-width: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-border-width')");
      border-color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-border-color')");
      border-radius: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-border-radius')");
      margin: 1px;
      display: inline-flex;
      align-items: center; 
  }

  .action-button-list-container{
    position: absolute;
    z-index: 1000;
    padding: 1em 0 1em 0;
    width: 250px;
    transform: translateX(-215px);
    border: solid;
    background-color: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-background-color')");
    border-width: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-border-width')");
    border-color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-continer-border-color')");
    border-radius: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-border-radius')");

  }
  .action-button-list-container a{
    text-decoration: none;
    color: v-bind("preferenceStore.returnValue('--c-edit-general-action-button-continer-color')") !important;
    font-size: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-font-size')");
    display: block;
    width: 100%;
    padding: 0 1em 0 1em;

  }
  .action-button-list-container a:hover{
    background-color: v-bind("preferenceStore.returnValue('--n-edit-general-action-button-continer-background-highlight-color')");
  }

  .action-enter-active,
  .action-leave-active {
    transition: opacity 0.25s ease;
  }

  .action-enter-from,
  .action-leave-to {
    opacity: 0;
  }

</style>