<template>
    <div class="card" :class="['wc-row', {'selected': selectedWcRecord['oclcNumber'] == record['oclcNumber']}, {'serial': isSerial(record)}]" @click="$emit('selectedCard', record)">
        <div class="card-body">
            <div class="card-icon"></div>
            <div class="card-title">
                <Badge
                  :text="determineLevel(record)"
                  :badgeType="badgeLevel(record)"
                  :noHover="false"
                  tipPos="top"
                  :toolTip="catLevelToolTip(determineLevel(record))"
                />
                {{ record['title'] }} ({{ record['language'] }})
            </div>
            <div class="card-subtitle">{{ record['creator'] }}</div>
            <div class="card-text border-bottom">
                <labe class="card-label">Format: </labe>
                <span v-if="record['specificFormat'] == 'Digital'" data-tooltip="This is a digital resource. Make sure that's what you want." :class="['badge badge-secondary', 'simptip-position-top', {'badge-info': true}]">
                    {{ record['specificFormat'] }}
                </span>
                <span v-else>{{ record['specificFormat'] }}</span>
                <br>
                <label class="card-label">Publisher:</label> {{ record['publisher'] }} ({{record['publicationPlace']}})<br>
                <label class="card-label">008 Date:</label> {{ record['date'] }}<br>
                <span v-if="getMarcFieldAsString(record, '300')">
                <label class="card-label">Marc 300: </label>{{ getMarcFieldAsString(record, '300') }}
                </span>
            </div>
            <div class="card-text border-bottom" v-if="record['isbns'] && record['isbns'].length > 0">
                <label class="card-label">ISBNs:</label>
                <ul>
                <li v-for="(item) in record['isbns']">{{ item }}</li>
                </ul>
            </div>
            <div class="card-text border-bottom" v-if="record['issns'] && record['issns'].length > 0">
                <label class="card-label">ISSNs:</label>
                <ul>
                <li v-for="(item) in record['issns']">{{ item }}</li>
                </ul>
            </div>
            <div class="card-text">
                <Badge :text="isRdaRecord(record) ? 'RDA' : 'Not RDA'" :badgeType="isRdaRecord(record) ? 'success' : 'warning'" :noHover="false" tipPos="top" toolTip="DA: 040 $e = RDA and leader/18!='a' and 260 is not present" />
                <Badge :text="encodingLevel(record.catalogingInfo.levelOfCataloging)" :badgeType="encodingLevel(record.catalogingInfo.levelOfCataloging) == 'High' ? 'success' : 'warning'" :noHover="false" tipPos="top" :toolTip="'Encoding Level: \'' + record.catalogingInfo.levelOfCataloging + '\''" />
                <Badge :text="record.catalogingInfo.catalogingAgency" badgeType="secondary" :noHover="false" tipPos="top" toolTip="Cataloging Agency" />
                <Badge v-if="record.catalogingInfo.catalogingLanguage" :text="record.catalogingInfo.catalogingLanguage" badgeType="secondary" :noHover="false" tipPos="top" toolTip="Cataloging Language" />
            </div>
        </div>
    </div>
</template>


<script>

import { usePreferenceStore } from '@/stores/preference'
import { mapStores, mapState, mapWritableState } from 'pinia'

import Badge from './Badge.vue'

export default{
    components: { Badge },
    name: 'CopyCatCard',
    props: {
        record: Object,
        selectedWcRecord: Object,
    },
    data(){
      return {
        oclcEncodingLevelsHigh: [' ', '1', 'I'],
        oclcEncodingLevelsLow: ['K', 'M', '3', '4', '5', '7', '8'],
      }
    },
    computed: {
      ...mapStores(usePreferenceStore),
      ...mapState(usePreferenceStore, ['styleDefault','panelDisplay']),
    },
    methods:{
        badgeLevel: function(record){
          if (this.determineLevel(record) == 'PccAdapt') { return 'success' }
          else if (this.determineLevel(record) == 'OrigRes') { return 'warning' }
          else if (this.determineLevel(record) == 'CopyCat') { return 'info' }
          else if (this.determineLevel(record) == 'OrigCop') { return 'danger' }
        },
        determineLevel: function(record){
          /**
           * PCCAdapt -- indicates that the record is a fuller-level record, and the language of cataloging is English. Process the record as full-level RDA.
           * Copycat  -- indicates that the record is a fuller-level record, and the language of cataloging is English. Process the record as RDA, with 042 = lccopycat. Exceptionally: process according to “encoding level 7 lccopycat” procedures (DCM B13, Appendix 7).
           * OrigRes  -- indicates that the record is a lower-level record, and/or that the language of cataloging is other than English.
           * OrigCop  -- indicates that an existing LC RDA record for another edition can be used to create a new full-level RDA record.
           */

          this.isRdaRecord(record)

          const catLang   = record.catalogingInfo.catalogingLanguage
          const isEng = catLang == "eng"
          const catEncodeLevel  = record.catalogingInfo.levelOfCataloging
          const catAgency = record.catalogingInfo.catalogingAgency
          const catTransAgency = record.catalogingInfo.transcribingAgency
          const marc042   = record.marcRaw.fields.filter((f) => f[0] == '042').join()
          const pccRecord = marc042.includes('pcc')

          let catLevel = false
          if (pccRecord && isEng) {
            catLevel = 'PccAdapt'
          } else if (this.oclcEncodingLevelsHigh.includes(catEncodeLevel) && !pccRecord && isEng){
            catLevel = 'CopyCat'
          } else if (catAgency == 'DLC' && catTransAgency == 'DLC'){
            catLevel = 'OrigCop'
          } else {
            catLevel = 'OrigRes'
          }

          return catLevel //catLang + " " + catEncodeLevel + " " + catAgency + " " + pccRecord

        },

        isRdaRecord: function(record){
          const marc040   = record.marcRaw.fields.filter((f) => f[0] == '040').join()
          const rdaRecord = marc040.includes('e,rda')
          const leader = record.marcRaw.leader
          const aacr2 = leader.at(18) == 'a'
          const marc260 = record.marcRaw.fields.filter((f) => f[0] == '260').join()

          if (rdaRecord){
            return true
          } else if (marc260 == ""){
            return true
          } else if (!aacr2 && marc260 == ""){
            return true
          }
          return false
        },

        getMarcFieldAsString: function(record, target){
          try{
            let fields = record.marcRaw.fields.filter((f) => f[0] == target)

            for (let field of fields){
              let tag = field[0]
              let indicators = field[1]
              let subfields = field.slice(2).map((item, idx) => {
                if (idx%2 == 0 ){
                  return "$" + item
                } else {
                  return " " + item
                }
              }).join("")

              return tag + indicators + subfields
            }
          } catch(err) {
            console.error("err: ", err)
            return false
          }
        },

        isSerial: function(record){
          let leader = record.marcRaw.leader
          let bibLevel = leader.at(7)

          return ["b", "s"].includes(bibLevel)
        },

        encodingLevel: function (value){
          if (this.oclcEncodingLevelsHigh.includes(value)){
            return 'High'
          }
          return 'Low'
        },

        catLevelToolTip: function(value){
          switch (value){
            case "PccAdapt":
              return "042 contains 'pcc' & Language = English"
            case "CopyCat":
              return "Encoding Level is 'high', Not PCC record, Language = English"
            case "OrigRes":
              return "Low level record, Not PCC, or not English"
            case "OrigCop":
              return "Cataloging Agency and Transcribing Agency are 'DLC'"
            default:
              return "You shouldn't be seeing this. Let someone know the value is '" + value  +"'"
          }
        },
    }

}

</script>

<style>
.selected {
    background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')") !important;
    color: black;
    filter: saturate(.75);
  }

  /* Bootstrap card */
  .card {
    position: relative;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color:  v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color')");
    color: black;
    background-clip: border-box;
    border: 1px solid rgba(0,0,0,.125);
    border-radius: .25rem;

    margin-bottom: 5px;
  }

  .card:hover {
    cursor: pointer;
    background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')") ;
  }

  .card-body {
    -webkit-box-flex: 1;
    -ms-flex: 1 1 auto;
    flex: 1 1 auto;
    padding: 1.25rem;
  }

  .card-title {
    margin-bottom: .75rem;
    font-size: 1.25rem;
  }

  .card-subtitle {
    color: #6c757d !important;
    margin-bottom: .5rem !important;
    margin-top: -.375rem;
  }

  .card-text.border-bottom {
    border-bottom: solid gray;
  }

  .card-label {
    font-weight: bold;
  }


  .existing-lccn-note {
    color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-font-color')");
  }

  .serial{
    pointer-events: none;
  }

  .badge.simptip-position-top::after {
    margin-left: -55px;
  }

</style>