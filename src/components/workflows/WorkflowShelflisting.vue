<template>
  <div class="wf-shelflist">
    <button v-if="closable" class="wf-shelflist-close" title="Close the shelflisting tools" @click.stop="$emit('close')"><span class="material-icons">close</span></button>
    <ClassTools
      :guid="pt['@guid']"
      :propertyPath="propertyPath"
      :structure="pt"
      :profile="row.profile"
      :beforeEdit="activate"
    />
  </div>
</template>

<script>
/**
 * Workflows: the editor's shelflisting tools (the Cutter Calculator, the ClassWeb links, the links
 * from the Shelflisting preferences and Shelf List Search) for one LC class number of a record.
 *
 * It is the editor's own component (ClassificationTools.vue), so what it shows follows the same
 * Shelflisting preferences. The editor draws it from the active profile, here it is given the
 * row's record to draw from, so it can be on screen for a record that is not being edited. The
 * record is made the active one (workflowStore.activateRow) only when the tools are about to
 * change it: "Use" on a cutter, or opening the Shelf List Search.
 *
 * Where it goes: under the class number in the one record per page layout (WorkflowPage), in a
 * row opened with an icon in the spreadsheet layout (WorkflowRecord). Which lines get it is
 * recordLines.shelflistApplies, whether at all is the --b-workflows-shelflisting preference.
 */
import { mapStores } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'

import ClassTools from "@/components/panels/edit/modals/helpers/ClassificationTools.vue";

export default {
  name: "WorkflowShelflisting",
  components: { ClassTools },
  props: {
    row: Object,
    // the classification component the tools are for
    pt: Object,
    // the sheet: it was opened and can be closed again
    closable: Boolean,
  },
  emits: ['close'],
  data(){
    return {
      // where a cutter goes, the same path the editor gives the tools
      propertyPath: [
        { level: 0, propertyURI: 'http://id.loc.gov/ontologies/bibframe/classification' },
        { level: 1, propertyURI: 'http://id.loc.gov/ontologies/bibframe/itemPortion' },
      ],
    }
  },
  computed: {
    ...mapStores(useWorkflowStore),
  },
  methods: {
    /**
    * The tools are about to change the record (or hand it to the Shelf List Search, which does):
    * it has to be the profile store's active record first
    * @return {boolean} - is it
    */
    async activate(){
      let ws = this.workflowStore
      if (ws.busy){ return false }
      // a cell left open on another record does not belong to the active record any more
      if (ws.editingCell && ws.editingCell.rowId !== this.row.id){ ws.stopEditing() }
      return await ws.activateRow(this.row.id)
    },
  },
}
</script>
