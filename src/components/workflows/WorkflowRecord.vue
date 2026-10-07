<template>
  <tbody :class="['wf-record', {'wf-record-done': row.done, 'wf-record-active': workflowStore.activeRowId === row.id, 'wf-record-flash': row.flash}]" :data-row-id="row.id">
    <tr v-for="(line, lineIdx) in lines" :key="lineIdx" :class="{'wf-line-first': lineIdx == 0}">

      <!-- the frozen column that says what record this is -->
      <th v-if="lineIdx == 0" :rowspan="lines.length" class="wf-record-header wf-stick-left" scope="row">
        <div class="wf-record-line" :title="(row.label || row.scanned) + (row.lccn ? ' (' + row.lccn + ')' : '')">
          <span class="wf-record-number">{{ index + 1 }}</span>
          <span class="wf-record-title">{{ row.label || row.scanned }}</span>
          <span class="wf-record-id">{{ row.lccn || row.scanned }}</span>
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
            <span :class="['wf-cip-badge', row.enrichment.source.lccnConfirmed ? 'wf-cip-confirmed' : 'wf-cip-unconfirmed']" :title="cipTitle">
              <span class="material-icons">{{ row.enrichment.source.lccnConfirmed ? 'fact_check' : 'help_outline' }}</span>
              WorldCat {{ row.enrichment.source.oclcNumber }}
            </span>
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
      </th>

      <template v-if="row.status == 'ready'">
        <template v-for="group in visibleGroups" :key="group.key">
          <WorkflowCell
            v-for="(column, colIdx) in group.columns"
            :key="group.key + column.key"
            :row="row"
            :group="group"
            :pt="(line[group.key] && !line[group.key].ghost) ? line[group.key].pt : null"
            :cell="line[group.key] ? (line[group.key].cells[column.key] || null) : null"
            :column="column"
            :firstInGroup="colIdx == 0"
            :line="lineIdx"
            :colIndex="groupOffsets[group.key] + colIdx"
            :lineSuggestion="(line[group.key] && line[group.key].suggestion) ? line[group.key].suggestion : null"
            :ghost="(line[group.key] && line[group.key].ghost) ? line[group.key] : null"
          />
        </template>
      </template>
      <td v-else-if="lineIdx == 0" :colspan="columnCount" :class="['wf-record-status', {'wf-record-status-error': row.status == 'error'}]">
        <template v-if="row.status == 'error'">
          <span class="material-icons">error</span> {{ row.error }}
          <button @click="workflowStore.loadRow(row.id)">Try again</button>
        </template>
        <template v-else-if="row.status == 'searching'">Searching for {{ row.scanned }}...</template>
        <template v-else-if="row.status == 'checking'">More than one record matches {{ row.scanned }}, looking at them...</template>
        <template v-else-if="row.status == 'choosing'">More than one record matches {{ row.scanned }}, waiting for a selection...</template>
        <template v-else>Loading record...</template>
      </td>

      <td v-if="lineIdx == 0" :rowspan="lines.length" class="wf-record-actions">
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
          <VMenu :delay="{ show: 250, hide: 150 }" placement="left" :distance="6" @show="loadMarc()">
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
      </td>
    </tr>
  </tbody>
</template>

<script>
import { mapStores, mapState } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'

import { findComponentPts, resolveComponentCells } from '@/lib/workflows/fields'
import { compareComponent, suggestedPtsFor, checkCallNumberYears, publicationYear, applyChecklistRules, checkIsbns, hasSeriesStatement, recordProtections, applyProtections, recordSeriesTitles, isSeriesAlreadyInRecord, CIP_ENRICHMENT_ID } from '@/lib/workflows/cip'

import WorkflowCell from "@/components/workflows/WorkflowCell.vue";

export default {
  name: "WorkflowRecord",
  components: { WorkflowCell },
  props: {
    row: Object,
    index: Number,
    visibleGroups: Array,
    columnCount: Number,
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
    ...mapState(useProfileStore, ['rtLookup']),
    ...mapState(useConfigStore, ['lookupConfig']),

    /**
    * Where each group's first column is, counting across all of the visible columns
    * @return {object} - group key -> column position
    */
    groupOffsets(){
      let offsets = {}
      let offset = 0
      for (let group of this.visibleGroups){
        offsets[group.key] = offset
        offset += group.columns.length
      }
      return offsets
    },

    /**
    * The protections (juvenile fiction, law) that apply to this record
    */
    protections(){
      if (!this.cipOn || this.row.status != 'ready' || !this.row.profile){ return [] }
      return recordProtections(this.row.profile)
    },

    // is the CIP enrichment on for this sheet
    cipOn(){
      let s = this.workflowStore.activeSession
      return !!(s && (s.definition.enrichments || []).includes(CIP_ENRICHMENT_ID))
    },

    /**
    * The WorldCat record to compare against, once it is there
    */
    suggested(){
      return (this.row.enrichment && this.row.enrichment.status == 'ready') ? this.row.enrichment.suggested : null
    },

    /**
    * What the WorldCat comparison came to for the whole record
    * @return {object} - {open, verified}
    */
    suggestionCount(){
      let open = 0, verified = 0
      for (let line of this.lines){
        for (let key in line){
          let entry = line[key]
          if (!entry){ continue }
          if (entry.ghost){ open++ }
          else if (entry.suggestion){ open += entry.suggestion.open; verified += entry.suggestion.verified }
        }
      }
      return { open: open, verified: verified }
    },

    cipTitle(){
      let src = this.row.enrichment.source
      let parts = ['WorldCat record ' + src.oclcNumber]
      parts.push(src.lccnConfirmed ? 'its LCCN matches this record' : 'its LCCN does NOT match, the match was made on the ISBN only')
      if (src.otherCandidates > 0){ parts.push(src.otherCandidates + ' other WorldCat record(s) were passed over') }
      for (let m of src.messages){ parts.push(m) }
      return parts.join('\n')
    },

    /**
    * One record is one or more lines in the sheet. A component that is repeated in the record
    * (two contributors) puts each one on its own line, the lines a component
    * doesn't reach are left as greyed out cells. When WorldCat's record is there its components
    * are lined up with the record's: a matched line carries `suggestion` (per cell: match / add /
    * differs), an unmatched one becomes a `ghost` line offered under the record's.
    * @return {array} - of lines, each one is groupKey -> {pt, cells, suggestion} | {ghost: true, pt, cells, values, key}
    */
    lines(){
      if (this.row.status != 'ready' || !this.row.profile){ return [{}] }

      let perGroup = {}
      let lineCount = 1
      let dismissed = (this.row.enrichment && this.row.enrichment.dismissed) ? this.row.enrichment.dismissed : []
      for (let group of this.visibleGroups){
        perGroup[group.key] = findComponentPts(this.row.profile, group.component).map((pt) => {
          return { pt: pt, cells: resolveComponentCells(pt, this.rtLookup, this.lookupConfig) }
        })
        if (this.suggested){
          // a series can sit in the linked relation component or the transcribed one: one WorldCat
          // offers is not new when the record has it under the other component
          let seriesElsewhere = recordSeriesTitles(this.row.profile, group.component)
          let suggestedLines = suggestedPtsFor(this.suggested, group.component)
            .filter((pt) => { return !isSeriesAlreadyInRecord(pt, seriesElsewhere) })
            .map((pt) => {
              return { pt: pt, cells: resolveComponentCells(pt, this.rtLookup, this.lookupConfig) }
            })
          let compared = compareComponent(group.key, group.columns, perGroup[group.key], suggestedLines, dismissed)
          perGroup[group.key].forEach((line, i) => { line.suggestion = compared.suggestions[i] })
          for (let ghost of compared.ghosts){
            perGroup[group.key].push({ ghost: true, pt: ghost.pt, cells: ghost.cells, values: ghost.values, key: ghost.key })
          }
        }
        lineCount = Math.max(lineCount, perGroup[group.key].length)
      }

      // the checklist's own checks, these don't need WorldCat
      if (this.cipOn){
        let context = { hasSeries: hasSeriesStatement(this.row.profile) }
        let pub = (this.suggested ? publicationYear(this.suggested) : null) || publicationYear(this.row.profile)
        let pubSource = (this.suggested && publicationYear(this.suggested)) ? 'WorldCat ' + (pub ? pub.from : '') : (pub ? pub.from : '')
        let enrichment = this.row.enrichment || {}
        let inHand = (enrichment.query && enrichment.query.isbn) || (enrichment.source && enrichment.source.query && enrichment.source.query.isbn) || null
        for (let group of this.visibleGroups){
          let lines = perGroup[group.key]
          applyChecklistRules(group.key, group, lines, context, dismissed)
          if (group.component.propertyURI === 'http://id.loc.gov/ontologies/bibframe/classification' && pub){
            // row 050: the call number's year against the publication date (WorldCat's when it is there)
            checkCallNumberYears(group.key, group.columns, lines, pub.year, pubSource, dismissed)
          }
          if (group.component.propertyURI === 'http://id.loc.gov/ontologies/bibframe/identifiedBy'){
            checkIsbns(group.key, group, lines, inHand, dismissed)
          }
          // juvenile fiction / law: some fields are not to be replaced, only added to
          applyProtections(group, lines, this.protections)
        }
      }

      let lines = []
      for (let i = 0; i < lineCount; i++){
        let line = {}
        for (let group of this.visibleGroups){
          line[group.key] = perGroup[group.key][i] || null
        }
        lines.push(line)
      }
      return lines
    },
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
