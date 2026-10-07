<template>
  <div class="wf-record-label">
    <!-- what record this is, and where it stands: in the sheet's frozen column, or across the top of a page -->
    <div class="wf-record-line" :title="(row.label || row.scanned) + (row.lccn ? ' (' + row.lccn + ')' : '')">
      <span class="wf-record-number">{{ index + 1 }}</span>
      <!-- the title and the id copy themselves with a click -->
      <span :class="['wf-record-title', 'wf-copyable', {'wf-copied': copied == 'title'}]" title="Click to copy the title" @click.stop="copy('title', row.label || row.scanned)" data-copied="Title copied">{{ row.label || row.scanned }}</span>
      <span :class="['wf-record-id', 'wf-copyable', {'wf-copied': copied == 'id'}]" :title="'Click to copy ' + (row.lccn ? 'the LCCN' : 'this')" @click.stop="copy('id', row.lccn || row.scanned)" data-copied="Copied">{{ row.lccn || row.scanned }}</span>
      <span v-if="row.posted" class="material-icons wf-record-state wf-state-posted" title="Posted">mark_email_read</span>
      <span v-else-if="row.postFailed" class="material-icons wf-record-state wf-state-error" title="The last post failed">error</span>
      <span v-if="row.saving" class="material-icons wf-record-state" title="Saving...">sync</span>
      <span v-else-if="row.dirty" class="material-icons wf-record-state wf-state-dirty" title="Unsaved changes">edit</span>
    </div>
    <!-- the record is of a kind whose fields are not to be replaced from WorldCat, only added to -->
    <div v-if="protections.length > 0" class="wf-cip">
      <span v-for="p in protections" :key="p.id" class="wf-cip-badge wf-cip-protected" :title="'Protected: ' + p.reason"><span class="material-icons">shield</span>{{ p.label }}</span>
    </div>
    <!-- the WorldCat lookup for the CIP checklist -->
    <div v-if="row.enrichment" class="wf-cip">
      <template v-if="row.enrichment.status == 'loading'">
        <span class="material-icons wf-spin">sync</span> Looking up WorldCat...
      </template>
      <template v-else-if="row.enrichment.status == 'ready'">
        <a :class="['wf-cip-badge', 'wf-cip-link', row.enrichment.source.lccnConfirmed ? 'wf-cip-confirmed' : 'wf-cip-unconfirmed']" :title="cipTitle + '\n\nClick to open in WorldCat'" :href="'https://worldcat.org/oclc/' + row.enrichment.source.oclcNumber" target="_blank" rel="noopener" @click.stop="worldcatClick($event)">
          <span class="material-icons">{{ row.enrichment.source.lccnConfirmed ? 'fact_check' : 'help_outline' }}</span>
          WorldCat {{ row.enrichment.source.oclcNumber }}
        </a>
        <span v-if="suggestionCount.open > 0" class="wf-cip-count" :title="suggestionCount.open + ' suggestions to look at, ' + suggestionCount.verified + ' fields match'">{{ suggestionCount.open }} to review</span>
        <span v-else class="wf-cip-count wf-cip-count-done" :title="suggestionCount.verified + ' fields match WorldCat'">{{ suggestionCount.verified }} match</span>
      </template>
      <template v-else-if="row.enrichment.status == 'error'">
        <span class="wf-cip-badge wf-cip-error" :title="row.enrichment.message"><span class="material-icons">error_outline</span> WorldCat lookup failed</span>
        <button class="wf-cip-retry" @click="workflowStore.enrichRow(row.id, true)">Try again</button>
      </template>
      <template v-else>
        <span class="wf-cip-badge wf-cip-none" :title="row.enrichment.message"><span class="material-icons">search_off</span> Not in WorldCat</span>
      </template>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'

export default {
  name: "WorkflowRecordLabel",
  // in the sheet the label is in the frozen column, a click that ends a drag of the sheet is not a click on it
  inject: { wfGridWasPanning: { default: () => { return () => { return false } } } },
  props: {
    row: Object,
    index: Number,
    // the protections (juvenile fiction, law) that apply to the record, see recordLines
    protections: Array,
    // {open, verified} what the WorldCat comparison came to, see recordLines
    suggestionCount: Object,
  },
  data(){
    return {
      // which of the title / id was just copied, for the "copied" animation
      copied: null,
      copiedTimer: null,
    }
  },
  computed: {
    ...mapStores(useWorkflowStore),

    cipTitle(){
      let src = this.row.enrichment.source
      let parts = ['WorldCat record ' + src.oclcNumber]
      parts.push(src.lccnConfirmed ? 'its LCCN matches this record' : 'its LCCN does NOT match, the match was made on the ISBN only')
      if (src.otherCandidates > 0){ parts.push(src.otherCandidates + ' other WorldCat record(s) were passed over') }
      for (let m of src.messages){ parts.push(m) }
      return parts.join('\n')
    },
  },
  methods: {
    /**
    * Put the text on the clipboard and say so for a moment
    * @param {string} what - 'title' | 'id'
    * @param {string} text
    * @return {void}
    */
    async copy(what, text){
      if (this.wfGridWasPanning() || !text){ return }
      try {
        await navigator.clipboard.writeText(text)
      } catch (e) {
        this.workflowStore.notify('Could not copy to the clipboard', 'error')
        return
      }
      window.clearTimeout(this.copiedTimer)
      this.copied = what
      this.copiedTimer = window.setTimeout(() => { this.copied = null }, 1400)
    },

    worldcatClick(event){
      // the link opens in a new tab on its own, unless the click was the end of a drag
      if (this.wfGridWasPanning()){ event.preventDefault() }
    },
  },
  beforeUnmount(){
    window.clearTimeout(this.copiedTimer)
  },
}
</script>
