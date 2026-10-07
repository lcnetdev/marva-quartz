<template>
  <span class="wf-record-buttons">
    <!-- the buttons for one record: at the end of its row in the sheet, along the bottom of its page -->
    <template v-if="row.status == 'ready'">
      <button :class="['wf-action', {'wf-action-on': row.posted}]" :disabled="row.posting" @click="workflowStore.postRow(row.id)" :title="row.posted ? 'Posted, click to post again' : 'Post'">
        <span class="material-icons">{{ row.posted ? 'mark_email_read' : 'sailing' }}</span>Post
      </button>
      <button class="wf-action" @click="workflowStore.openLcap(row.id)" title="Open in LCAP">
        <span class="material-icons">open_in_new</span>LCAP
      </button>
      <button class="wf-action" @click="openFullEditor()" title="Open in the full editor in a new tab">
        <span class="material-icons">edit_note</span>Editor
      </button>
      <button :class="['wf-action', {'wf-action-on': row.done}]" @click="workflowStore.toggleDone(row.id)" :title="row.done ? 'Marked as done, click to undo' : 'Mark as done'">
        <span class="material-icons">{{ row.done ? 'check_circle' : 'radio_button_unchecked' }}</span>Done
      </button>
      <!-- hover for the MARC the record converts to -->
      <VMenu :delay="{ show: 250, hide: 150 }" :placement="marcPlacement" :distance="6" @show="loadMarc()">
        <button class="wf-action" title="Hover to see the MARC">
          <span class="material-icons">description</span>MARC
        </button>
        <template #popper>
          <div class="wf-marc-popover">
            <div v-if="!marc" class="wf-marc-loading"><span class="material-icons wf-spin">sync</span> Converting to MARC...</div>
            <div v-else-if="marc.error" class="wf-marc-error">{{ marc.error }}</div>
            <template v-else>
              <div class="wf-marc-version">{{ row.label }} &middot; converter {{ marc.version }}</div>
              <pre class="wf-marc-text">{{ marc.text }}</pre>
            </template>
          </div>
        </template>
      </VMenu>
    </template>
    <button class="wf-action wf-action-remove" @click="remove()" title="Remove from this workflow (the record is not deleted)">
      <span class="material-icons">close</span>
    </button>
  </span>
</template>

<script>
import { mapStores } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'

export default {
  name: "WorkflowRecordActions",
  props: {
    row: Object,
    // which side of the MARC button its popover opens on
    marcPlacement: { type: String, default: 'left' },
  },
  data(){
    return {
      // the MARC preview of the record, with the revision of the record it was made from
      marc: null,
      marcRevision: null,
    }
  },
  computed: {
    ...mapStores(useWorkflowStore),
  },
  methods: {
    /**
    * Get the MARC for the popover, kept until the record changes
    */
    async loadMarc(){
      let revision = this.row.revision || 0
      if (this.marc && this.marcRevision === revision){ return }
      this.marc = null
      this.marcRevision = revision
      let result = await this.workflowStore.marcPreviewRow(this.row.id)
      // the record may have changed while the conversion ran
      if (this.marcRevision === revision){ this.marc = result }
    },

    async openFullEditor(){
      // open the tab right away while we still have the click, a tab opened after the save finishes can get blocked as a popup
      let tab = window.open('', '_blank')
      let eId = await this.workflowStore.prepareForFullEditor(this.row.id)
      if (!eId){
        if (tab){ tab.close() }
        return
      }
      let href = this.$router.resolve({ name: 'Edit', params: { recordId: eId } }).href
      if (tab){
        tab.location = href
      } else {
        window.open(href, '_blank')
      }
    },

    remove(){
      if (this.row.dirty && !confirm('This record has changes that are not saved yet. Remove it from the workflow?')){ return }
      this.workflowStore.removeRow(this.row.id)
    },
  },
}
</script>
