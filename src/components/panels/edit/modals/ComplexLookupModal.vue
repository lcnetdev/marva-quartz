<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'
  import { mapStores, mapState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'



  export default {
    components: {
      VueFinalModal,


    },
    props: {
      structure: Object,


    },
    data() {
      return {

        modeSelect: null

      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      // ...mapStores(usePreferenceStore),
      // // // gives read access to this.count and this.double
      // ...mapState(usePreferenceStore, ['showPrefModal','showPrefModalGroup','styleDefault', 'showPrefModalGroup', 'fontFamilies']),

      // array of the pssobile groups from the stlyes

      ...mapState(useConfigStore, ['lookupConfig']),





      

      modalSelectOptions(){
        let options = []
        // add in the the defaul search ALL of everything possible
        //options.push({label: 'All', urls:null, processor:null})
        this.structure.valueConstraint.useValuesFrom.forEach((l)=>{
          if (this.lookupConfig[l]){
            this.lookupConfig[l].modes.forEach((mode)=>{              
              Object.keys(mode).forEach((k)=>{
                options.push({label: k, urls:mode[k].url, processor:this.lookupConfig[l].processor, minCharBeforeSearch: (this.lookupConfig[l].minCharBeforeSearch ? this.lookupConfig[l].minCharBeforeSearch : false), all:mode[k].all })
                // mark the first All one we find as the first one
                if (!this.modeSelect && mode[k].all){
                  this.modeSelect = k
                }
              })
            })
          }
        })        
        return options
      },
      modalSelectOptionsLabels(){
        return this.modalSelectOptions.map((o)=>{return o.label})
      },
    },

    watch: {
      // whenever question changes, this function will run
      showPrefModal(newVal, oldVal) {
        
        console.log(newVal,oldVal)
        // if (newVal === true){
        //   this.loadPrefGroup()
        // }
      }
    },

    methods: {
      
        



    },

    mounted() {
      console.log("mounted")
      // this.$nextTick(()=>{
      //   this.loadPrefGroup()
      //   this.$nextTick(()=>{
      //     this.$refs.preferenceContent.style.height = this.initalHeight + 'px'
      //   })

      // })

    }
  }



</script>

<template>


    <VueFinalModal
      :hide-overlay="false"
      :overlay-transition="'vfm-fade'"
      :content-transition="'vfm-fade'"
      :click-to-close="true"
      :esc-to-close="true"
      :background="'non-interactive'"
      :lock-scroll="true"
      class="complex-lookup-modal"
      content-class="complex-lookup-modal-content"
      >

        <div class="complex-lookup-modal-container">

          <div class="complex-lookup-modal-container-parts">

            <div>
              <div class="toggle-btn-grp cssonly">
                <div v-for="opt in modalSelectOptions"><input type="radio" class="search-mode-radio" name="searchMode"/><label onclick="" class="toggle-btn">{{opt.label}}</label></div>
              </div>
              <select>
                <option v-for="opt in modalSelectOptions">{{opt.label}}</option>
              </select>
              <input type="text" />

            </div>
            <div>
              
              Hello
            </div>

          </div>

        </div>

      
          
    </VueFinalModal>




</template>

<style>

.complex-lookup-modal-container{
  margin-left: auto;
  margin-right: auto;
  background-color: white;
  width: 85vw;
  height: 95vh;
}

.complex-lookup-modal-content{
  
}


@media all and (max-width: 1024px) {
  /* CSS rules here for screens lower than 750px */
  .complex-lookup-modal-container{

    width: 99vw;
    height: 95vh;
  }

}


</style>

<style scoped>

  .toggle-btn-grp div:focus{
    background-color: red;
  }

  .search-mode-radio:focus {
    background-color: red;
    outline: 1px solid black;
  }

  .complex-lookup-modal-container-parts{
    display: flex;
  }
  .complex-lookup-modal-container-parts div{
    flex:1;

  }
  label {

    font-size: 0.75em;
    white-space: nowrap;
  }

  .toggle-btn-grp {
    margin: 3px 0;
  }

  .toggle-btn {
    text-align: centre;
    padding: 0.1em 1em;
    color: #000;
    background-color: #FFF;
    border-radius: 10px;
    display: inline-block;
    border: solid 1px #CCC;
    cursor: pointer;
  }

  /* CSS only version */
  .toggle-btn-grp.cssonly * {
    width: 110px;
    height: 30px;
    line-height: 30px;
  }

  .toggle-btn-grp.cssonly div {
    display: inline-block;
    position: relative;
    margin: 5px 2px;
  }

  .toggle-btn-grp.cssonly div label {
    position: absolute;
    z-index: 0;
    padding: 0;
    text-align: center;
  }

  .toggle-btn-grp.cssonly div input {
    position: absolute;
    z-index: 1;
    cursor: pointer;
    opacity: 0;
  }

  .toggle-btn-grp.cssonly div:hover label {
    border: solid 1px #a0d5dc !important;
    background: #f1fdfe;
  }

  .toggle-btn-grp.cssonly div input:checked + label {
    background: lightskyblue;
    border: solid 1px blue !important;
  }


</style>
