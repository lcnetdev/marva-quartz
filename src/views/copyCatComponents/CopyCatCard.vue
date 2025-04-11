<template>
  {{ selectedWcRecord['oclcNumber'] }} -- {{ record['oclcNumber'] }}!!
    <div class="card" :class="['wc-row', {'selected': selectedWcRecord['oclcNumber'] == record['oclcNumber']}, {'serial': isSerial(record)}]" @click="$emit('selectedCard', record)">
        <div class="card-body">
            <div class="card-icon"></div>
            <div class="card-title">
                <span :class="['badge', 'simptip-position-top', {'badge-success': determineLevel(record) == 'PccAdapt', 'badge-warning': determineLevel(record) == 'OrigRes', 'badge-info': determineLevel(record) == 'CopyCat', 'badge-danger': determineLevel(record) == 'OrigCop'}]"
                :data-tooltip="catLevelToolTip(determineLevel(record))">
                {{ determineLevel(record) }}
                </span>
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
                <span :class="['badge badge-secondary', 'simptip-position-top', {'badge-success': isRdaRecord(record), 'badge-warning': !isRdaRecord(record)}]" data-tooltip="RDA: 040 $e = RDA and leader/18!='a' and 260 is not present">{{ isRdaRecord(record) ? "RDA" : "Not RDA" }}</span>
                <span :class="['badge badge-secondary', 'simptip-position-top', {'badge-success': encodingLevel(record.catalogingInfo.levelOfCataloging) == 'High', 'badge-warning': encodingLevel(record.catalogingInfo.levelOfCataloging) == 'Low'}]" :data-tooltip="'Encoding Level: \'' + record.catalogingInfo.levelOfCataloging + '\''" v-if="record.catalogingInfo.levelOfCataloging">{{ encodingLevel(record.catalogingInfo.levelOfCataloging) }}</span>
                <span class="badge badge-secondary simptip-position-top" data-tooltip="Cataloging Agency" v-if="record.catalogingInfo.catalogingAgency">{{ record.catalogingInfo.catalogingAgency }}</span>
                <span class="badge badge-secondary simptip-position-top" data-tooltip="Cataloging Language" v-if="record.catalogingInfo.catalogingLanguage">{{ record.catalogingInfo.catalogingLanguage }}</span>
            </div>
        </div>
    </div>
</template>


<script>

import { usePreferenceStore } from '@/stores/preference'
import { mapStores, mapState, mapWritableState } from 'pinia'


export default{
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
    background-color: antiquewhite !important;
    color: black;
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
    background-color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-card-color-selected')");
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

  .badge {
    display: inline-block;
    padding: .25em .4em;
    font-size: 75%;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: .25rem;
    margin-right: 5px;
  }

  .badge-primary {
    color: #fff;
    background-color: #007bff;
  }

  .badge-secondary {
    color: white;
    background-color: #6c757d;;
  }

  .badge:hover {
    cursor: help;
    background-color: black;
    color: white;
  }

  .badge-success {
    color: #fff;
    background-color: #28a745;
  }

  .badge-warning {
    color: #212529;
    background-color: #ffc107;
  }

  .badge-danger {
    color: #fff;
    background-color: #dc3545;
  }

  .badge-info {
    color: #fff;
    background-color: #17a2b8;
  }

  .badge.badge-warning.no-hover:hover {
    cursor: unset;
    background-color: #ffc107;
    color: #212529;
  }

  .badge.badge-info.no-hover:hover {
    cursor: unset;
    background-color: #17a2b8;
    color: #fff;
  }

  .existing-lccn-note {
    color: v-bind("preferenceStore.returnValue('--c-edit-copy-cat-font-color')");
  }
</style>