<script>
  import { usePreferenceStore } from '@/stores/preference'
  import { useConfigStore } from '@/stores/config'

  import { mapStores, mapState, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'


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

        initalHeight: 800,
        initalLeft: 400,

        allLanguages: {
         
        }


      }
    },
    computed: {
      // other computed properties
      // ...
      // gives access to this.counterStore and this.userStore
      // ...mapStores(usePreferenceStore),
      ...mapStores(useConfigStore),

      
      
      ...mapWritableState(usePreferenceStore, ['showScriptshifterConfigModal','scriptShifterOptions']),


    },

    watch: {
      // showDebugModal(newVal, oldVal) {
      //   console.log(newVal,oldVal)
      //   // if (newVal === true){
      //   //   this.loadPrefGroup()
      //   // }
      // }
    },

    methods: {
        
        dragResize: function(newRect){

          this.width = newRect.width
          this.height = newRect.height
          this.top = newRect.top
          this.left = newRect.left

          this.$refs.debugContent.style.height = newRect.height + 'px'

        },


        onSelectElement (event) {
          const tagName = event.target.tagName

          if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            event.stopPropagation()
          }
        },

        updateLocalStorage(event){

          console.log(this.allLanguages)


          let current = window.localStorage.getItem('marva-scriptShifterOptions')

          if (current){
            current = JSON.parse(current)
          }else{
            current = {}
          }

          for (let x in this.allLanguages){
            if (this.allLanguages[x].s2r || this.allLanguages[x].r2s ){
              current[x] = this.allLanguages[x]
            }else{
              if (current[x]){
                delete current[x]
              }
            }
          }

          window.localStorage.setItem('marva-scriptShifterOptions',JSON.stringify(current))
          this.scriptShifterOptions = JSON.parse(JSON.stringify(current))
        },  

        


    },

    async created(){

      // let req = await fetch(this.configStore.returnUrls.scriptshifter + 'languages')
      // let json = await req.json()
      // for (let k in json){

      //   json[k].s2r = false
      //   json[k].r2s = false

      //   if (this.scriptShifterOptions[k]){
      //     if (this.scriptShifterOptions[k].s2r){
      //       json[k].s2r = true
      //     }
      //     if (this.scriptShifterOptions[k].r2s){
      //       json[k].r2s = true
      //     }              
      //   }

      // }
      this.allLanguages = await this.configStore.getScriptShifterLanguages()

      for (let k in this.allLanguages){
        if (this.scriptShifterOptions[k]){
          if (this.scriptShifterOptions[k].s2r){
            this.allLanguages[k].s2r = true
          }
          if (this.scriptShifterOptions[k].r2s){
            this.allLanguages[k].r2s = true
          }              
        }
      }

      // this.allLanguages = {"abkhaz_cyrillic":{"name":"Abkhaz (Cyrillic)"},"altai_cyrillic":{"name":"Altai (Cyrillic)"},"arabic":{"description":"Arabic-to-Roman transliterator using the ArabicTransliterator external library.","name":"Arabic (S2R)"},"armenian":{"name":"Armenian"},"asian_cyrillic":{"description":"Multi-purpose transliteration for non-Slavic Cyrillic scripts: Abaza, Abkhaz, Adygei, Aisor, Altai, Avar, Azeri, Balkar, Bashkir, Buryat, Chechen, Chukchi, Chuvash, Dargwa, Dungan, Eskimo, Even, Evenki, Gagauz, Ingush, Inuit, Kabardian, Kalmyk, Karachay, Karachay-Balkar, Karakalpak, Karelian, Khakass, Khanty, Komi, Komi-Permyak, Koryak, Kumyk, Lak, Lapp, Lezghian, Lithuanian, Mansi, Mari, Moldovan, Molodstov, Mordvin, Nanai, Nenets, Nivkh, Nogai, Ossetic, Permyak, Romanian, Romany, Selkup, Shor, Tabasaran, Tat, Tuva, Udekhe, Udmurt, Yakut.\n","name":"Asian Cyrillic"},"azerbaijani_cyrillic":{"name":"Azerbaijani (Cyrillic)"},"bashkir_cyrillic":{"name":"Bashkir (Cyrillic)"},"belarusian":{"name":"Belarusian"},"bengali":{"name":"Bengali"},"bulgarian":{"name":"Bulgarian"},"buriat":{"name":"Buriat (Cyrillic)"},"burmese":{"name":"Burmese (Myanmar)"},"chinese":{"name":"Chinese (Hanzi)"},"chukchi_cyrillic":{"name":"Chukchi (Cyrillic)"},"church_slavonic":{"name":"Church Slavonic"},"chuvash_cyrillic":{"name":"Chuvash (Cyrillic)"},"devanagari":{"name":"Devanagari"},"divehi_thaana":{"name":"Divehi (Thaana)"},"dogri_devanagari":{"name":"Dogri (Devanagari)"},"dungan_cyrillic":{"name":"Dungan (Cyrillic)"},"ethiopic":{"name":"Ethiopic (Amharic)"},"even-evenki_cyrillic":{"name":"Even/Evenki (Cyrillic)"},"gagauz_cyrillic":{"name":"Gagauz (Cyrillic)"},"georgian":{"name":"Georgian"},"greek_classical":{"name":"Greek (classical)"},"greek_modern":{"name":"Greek (modern)"},"gujarati":{"name":"Gujarati"},"gurmukhi":{"name":"Punjabi (Gurmukhi)"},"hebrew":{"name":"Hebrew"},"hindi":{"name":"Hindi (Devanagari)"},"hiragana":{"name":"Japanese (Hiragana)"},"kalmyk_cyrillic":{"name":"Kalmyk (Cyrillic)"},"kannada":{"name":"Kannada"},"kara-kalpak_cyrillic":{"name":"Kara-Kalpak (Cyrillic)"},"karachai-balkar_cyrillic":{"name":"Karachay-Balkar  (Cyrillic)"},"karelian_cyrillic":{"name":"Karelian  (Cyrillic)"},"katakana":{"name":"Japanese (Katakana)"},"kazakh_cyrillic":{"name":"Kazakh (Cyrillic)"},"khakass_cyrillic":{"name":"Khakass (Cyrillic)"},"khanty_cyrillic":{"name":"Khanty (Cyrillic)"},"khmer":{"name":"Khmer"},"komi_cyrillic":{"name":"Komi (Cyrillic)"},"korean_names":{"description":"Korean S2R for strings ONLY containing personal names formatted as last + first name. Separate multiple names with a comma or a center-dot (U+00B7).","name":"Korean (last + first names only)"},"korean_nonames":{"description":"Korean S2R for strings NOT containing any personal names.","name":"Korean"},"koryak_cyrillic":{"name":"Koryak (Cyrillic)"},"kurdish":{"name":"Kurdish"},"kyrgyz_cyrillic":{"name":"Kyrgyz (Cyrillic)"},"lithuanian_cyrillic":{"name":"Lithuanian (Cyrillic)"},"macedonian":{"name":"Macedonian"},"malayalam":{"name":"Malayalam"},"mansi_cyrillic":{"name":"Mansi (Cyrillic)"},"marathi_devanagari":{"name":"Marathi (Devanagari)"},"moldovan_cyrillic":{"name":"Moldovan (Cyrillic)"},"mongolian_cyrillic":{"name":"Mongolian (Cyrillic)"},"mongolian_mongol_bichig":{"name":"Mongolian (Mongol bichig)"},"mordvin_cyrillic":{"name":"Mordvin (Cyrillic)"},"nenets_cyrillic":{"name":"Nenets (Cyrillic)"},"nepali_devanagari":{"name":"Nepali (Devanagari)"},"newari_devanagari":{"name":"Newari (Devanagari)"},"oriya":{"name":"Oriya"},"ossetic_cyrillic":{"name":"Ossetic (Cyrillic)"},"pali":{"name":"Pali"},"panjabi":{"name":"Panjabi"},"persian":{"name":"Persian"},"prakrit_devanagari":{"name":"Prakrit (Devanagari)"},"pulaar":{"name":"Pulaar (Adlam)"},"pushto":{"name":"Pushto"},"rajasthani_devanagari":{"name":"Rajasthani (Devanagari)"},"romani_cyrillic":{"name":"Romani (Cyrillic)"},"russian":{"name":"Russian"},"sanskrit_devanagari":{"name":"Sanskrit (Devanagari)"},"serbian":{"name":"Serbian"},"shor_cyrillic":{"name":"Shor (Cyrillic)"},"sinhalese":{"name":"Sinhalese"},"syriac_cyrillic":{"name":"Syriac (Cyrillic)"},"tajik_cyrillic":{"name":"Tajik (Cyrillic)"},"tamil":{"name":"Tamil"},"tamil_brahmi":{"name":"Tamil Brahmi"},"tamil_extended":{"name":"Tamil (extended)"},"tatar-kryashen_cyrillic":{"name":"Tatar-Kryashen (Cyrillic)"},"tatar_cyrillic":{"name":"Tatar (Cyrillic)"},"telugu":{"name":"Telugu"},"thai":{"name":"Thai"},"tibetan":{"name":"Tibetan"},"turkmen_cyrillic":{"name":"Turkmen (Cyrillic)"},"tuvinian_cyrillic":{"name":"Tuvinian (Cyrillic)"},"udmurt_cyrillic":{"name":"Udmurt (Cyrillic)"},"uighur_cyrillic":{"name":"Uighur (Cyrillic)"},"ukrainian":{"name":"Ukrainian"},"urdu":{"name":"Urdu"},"uzbek_cyrillic":{"name":"Uzbek (Cyrillic)"},"yakut_cyrillic":{"name":"Yakut (Cyrillic)"},"yiddish":{"name":"Yiddish"},"yuit_cyrillic":{"name":"Yuit (Cyrillic)"}}

    },

    async mounted() {

      console.log("Mounted")



      

      // let req = await fetch(this.configStore.returnUrls.scriptshifter + 'languages')
      // let json = await req.json()
      // for (let k in json){

      //   json[k].s2r = false
      //   json[k].r2s = false

      //   if (this.scriptShifterOptions[k]){
      //     if (this.scriptShifterOptions[k].s2r){
      //       json[k].s2r = true
      //     }
      //     if (this.scriptShifterOptions[k].r2s){
      //       json[k].r2s = true
      //     }              
      //   }

      // }

      // this.allLanguages = json

      // this.$nextTick(()=>{

      //   fetch(this.configStore.returnUrls.scriptshifter + 'languages', { 
      //     method: 'GET'
      //   })
      //   .then((response) => { return response.json(); })
      //   .then((json) => {
          
      //     for (let k in json){

      //       json[k].s2r = false
      //       json[k].r2s = false

      //       if (this.scriptShifterOptions[k]){
      //         if (this.scriptShifterOptions[k].s2r){
      //           json[k].s2r = true
      //         }
      //         if (this.scriptShifterOptions[k].r2s){
      //           json[k].r2s = true
      //         }              
      //       }

      //     }
          
      //     this.allLanguages = json

          
          

      //   });


        
     
      // })


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
          :w="800"
          :h="initalHeight"
          :x="initalLeft"
          class="debug-modal"
          @resizing="dragResize"
          @dragging="dragResize"
          :sticks="['br']"
          :stickSize="22"
        >
          <div id="debug-content" ref="debugContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
            <div class="menu-buttons">
              <button class="close-button" @pointerup="showScriptshifterConfigModal=false">X</button>
            </div>
            <p>Visit <a href="https://bibframe.org/scriptshifter" target="_blank">bibframe.org/scriptshifter</a> to test these languages.</p>
            
            <hr style="margin-top: 1em; margin-bottom: 1em;"/>

            <table>
              <!-- <tr v-for=""></tr> -->
              <thead>
                <th>Name</th>
                <th>Script to Roman</th>
                <th>Roman to Script</th>
              </thead>
            
              <tr  v-for="l in allLanguages">
                <td style="width: 66%;">
                  {{ l.name }}
                  <template v-if="l.description">
                    <br/>
                    <span style="font-size: 90%;">{{ l.description }}</span>
                  </template>
                </td>
                <td style="text-align: center;">
                  <input type="checkbox" @change="updateLocalStorage" v-model="l.s2r"/>
                </td>
                <td style="text-align: center;"> 
                  <input type="checkbox" @change="updateLocalStorage" v-model="l.r2s"/>
                </td>              
              </tr>
              <!-- <input type="checkbox" v-model="optionChecks[z']"> -->
            </table>

          </div>


        </VueDragResize>
    </VueFinalModal>




</template>
<style>

  .content-container{
    overflow: hidden
  }

</style>

<style scoped>


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
  #debug-content{
    overflow: hidden;
    overflow-y: auto;
  }
  .menu-buttons{
    margin-bottom: 2em;
    position: relative;
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
  .debug-modal{
    background-color: white;
    -webkit-box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27); 
    box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgba(0,0,0,0.27);
    border-radius: 1em;
    padding:1em;
    border: solid 1px black;
  }


</style>
