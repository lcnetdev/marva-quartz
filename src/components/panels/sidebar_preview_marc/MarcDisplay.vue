<script>
import { usePreferenceStore } from '@/stores/preference'
import { useProfileStore } from '@/stores/profile'

import { mapStores, mapState, mapWritableState } from 'pinia'

export default {
    components: {},
    data() {
        return {
        }
    },
    props: {
        previewData: {
            type: Object,
            default: {}
        },
        selected: String
    },
    computed: {
        ...mapStores(useProfileStore, usePreferenceStore),
        ...mapState(useProfileStore, ['activeProfile', 'dataChangedTimestamp']),
        ...mapState(usePreferenceStore, ['styleDefault']),
        ...mapWritableState(useProfileStore, ['activeComponent']),
    },
    watch: {},
    methods: {},
    created() {},
    updated() { }
}



</script>


<template>
    <template v-if="!selected">
        <template v-for="ver in previewData.versions">
            <div v-if="ver.default">
                <div class="version-number">{{ ver.version }}</div>
                <div v-if="preferenceStore.returnValue('--b-edit-main-splitpane-opac-marc-html')"
                    v-html="ver.marcRecord"></div>
                <pre v-else>
            <code>
              {{ ver.marcRecord }}
            </code>
          </pre>
                <hr>
                <pre>
            <code>
              {{ ver.results.stdout.trim() }}
            </code>
          </pre>
            </div>
        </template>

    </template>
    <template v-else>
        <template v-for="ver in previewData.versions">
            <div v-if="selected == ver.version">
                <div class="version-number">{{ ver.version }}</div>
                <template v-if="ver.error">

                    <pre>
              <code>
{{ ver.results }}
              </code>
            </pre>
                </template>
                <template v-else>
                    <pre>
              <code>
{{ ver.marcRecord }}
              </code>
            </pre>
                    <hr>
                    <pre>
              <code>
{{ ver.results.stdout.trim() }}
              </code>
            </pre>
                </template>
            </div>
        </template>



    </template>
</template>



<style scoped>
ul {
    padding: 0;
}

li {
    display: inline-block;
}

.marc-preview-content {
    padding: 0.25em;
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;


}

.version-number {
    font-size: 1.25em;
    font-weight: bold;
}


.sidebar-header-text {
    font-size: v-bind("preferenceStore.returnValue('--n-edit-main-splitpane-opac-font-size', true) + 0.25 + 'em'");
    font-family: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-family')");
    color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')") !important;

}


.sidebar-spacer {
    padding-top: 1em;
    margin-top: 1em;
    padding-bottom: 1em;
    border-top: solid 1px v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-font-color')");

}


.item-icon {
    fill: v-bind("preferenceStore.returnValue('--c-general-icon-item-color')");
    stroke-width: 0.5;
    stroke: rgb(0, 0, 0)
}

/** MARC preview formatting */
:deep() .marc.record {
    font-family: monospace;
}

:deep() .marc.indicators {
    white-space: pre;
}


:deep() .marc.subfield.subfield-0 .subfield-value,
:deep() .marc.subfield.subfield-1 .subfield-value {
    width: 4.5em;
    display: inline-block;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    color: rgba(0, 0, 0, 0.5);
    vertical-align: bottom;
}

:deep() div.marc.field {
    text-indent: 4em hanging;
}

:deep() span.marc.subfield:hover {
    background-color: v-bind("preferenceStore.returnValue('--c-edit-main-splitpane-opac-marc-html-highlight-color')");
}
</style>