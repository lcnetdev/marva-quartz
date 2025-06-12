<template>
    <VueFinalModal
    :hide-overlay="false"
    :overlay-transition="'vfm-fade'"
    :content-transition="'vfm-fade'"
    :click-to-close="true"
    :esc-to-close="true"
    @closed="closeSubjectBuilder()"

    :background="'non-interactive'"
    :lock-scroll="true"
    class="subject-builder-modal"
    content-class="subject-builder-modal-content"
    >
        <!-- Rows and columns for the Grid
                        |RESULTS 75% |DETAILS 25%|
            |HEADER 10% |||
            |BODY   80% |||
            |FOOTER 10% |||
         -->
        <div ref="subjectBuilderModalContainer" id="subject-builder-modal-container">
            <div class="header">H
                <div class="search-type"></div>
                <div class="detail-head"></div>
            </div>
            <div class="body">B
                <div class="search-results"></div>
                <div class="detail-body"></div>
            </div>
            <div class="search">S
                <div class="search-heading"></div>
                <div class="search-bar"></div>
            </div>
        </div>
    </VueFinalModal>
</template>


<style type="text/css">
#subject-builder-modal-container {
    background-color: white;
    height: 80%;
    width: 95%;
    display: grid;
    grid-template-columns: [results] 75% [details] 25%;
    grid-template-rows: [header] 10% [body] 80% [footer] 10%;
}

.header{
    background-color: red;
}
.body{
    background-color: blue;
}
.search{
    background-color: green;
}

</style>

<script>

import { usePreferenceStore } from '@/stores/preference'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'
import { mapStores, mapState, mapWritableState } from 'pinia'
import { VueFinalModal } from 'vue-final-modal'
import short from 'short-uuid'

import AuthTypeIcon from "@/components/panels/edit/fields/helpers/AuthTypeIcon.vue";

import utilsNetwork from '@/lib/utils_network';

import { AccordionList, AccordionItem } from "vue3-rich-accordion";

const debounce = (callback, wait) => {
let timeoutId = null;
return (...args) => {
  window.clearTimeout(timeoutId);
  timeoutId = window.setTimeout(() => {
    callback.apply(null, args);
  }, wait);
};
}





export default {
name: "SubjectEditor2",
components: {
  VueFinalModal,
  AuthTypeIcon,
  AccordionList,
  AccordionItem
},
props: {
  structure: Object,
  searchValue: String,
  authorityLookup: String,
  isLiteral: Boolean,
  profileData: Object,
  searchType: String,
  fromPaste: Boolean,
},

watch: {},

data: function() {
  return {}
},

computed: {
  ...mapStores(usePreferenceStore),
  ...mapState(usePreferenceStore, ['diacriticUseValues', 'diacriticUse','diacriticPacks']),
  ...mapState(useProfileStore, ['returnComponentByPropertyLabel']),
  ...mapWritableState(useProfileStore, ['activeProfile', 'setValueLiteral', 'subjectEditor2']),
},

methods: {
    closeSubjectBuilder: function(){
        console.info("closing?")
        this.$emit('hideSubjectModal', true)
    }
},

created: function() {},
before:  function() {},
mounted: function() {},
updated: function() {}
};

</script>
