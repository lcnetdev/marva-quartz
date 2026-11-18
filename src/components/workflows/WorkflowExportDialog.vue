<template>
  <div class="wf-dialog-overlay" @mousedown.self="$emit('close')">
    <div class="wf-dialog wf-export" ref="dialog" tabindex="-1" @keydown.esc.prevent.stop="$emit('close')">
      <h2>Export to CSV</h2>

      <div class="wf-export-options">
        <label class="wf-export-check" :title="doneCount == 0 ? 'No record of this sheet is marked done yet' : ''">
          <input type="checkbox" v-model="doneOnly" :disabled="doneCount == 0" />
          Only the records marked done <span class="wf-export-muted">({{ doneCount }} of {{ session.rows.length }})</span>
        </label>
        <span class="wf-export-mode" title="What to export of a value that is linked to an authority or a vocabulary. Each field can be set on its own below.">
          <span>Linked values as</span>
          <span class="wf-export-chips">
            <button type="button" :class="{'wf-export-chip-on': mode == 'label'}" @click="setMode('label')">Label</button>
            <button type="button" :class="{'wf-export-chip-on': mode == 'uri'}" @click="setMode('uri')">URI</button>
            <button type="button" :class="{'wf-export-chip-on': mode == 'both'}" @click="setMode('both')" title="Two columns, the label and the URI">Both</button>
          </span>
        </span>
        <!-- a component the record has more than once: two contributors, three subjects -->
        <span class="wf-export-mode wf-export-repeats">
          <span>A field that repeats goes</span>
          <span class="wf-export-chips">
            <button type="button" :class="{'wf-export-chip-on': repeats == 'cell'}" @click="repeats = 'cell'" title="One line per record, the repeats share the cell">In one cell</button>
            <button type="button" :class="{'wf-export-chip-on': repeats == 'columns'}" @click="repeats = 'columns'" title="One line per record, each repeat gets columns of its own">In more columns</button>
            <button type="button" :class="{'wf-export-chip-on': repeats == 'rows'}" @click="repeats = 'rows'" title="Each repeat gets a line of its own under the record's first">On the rows below</button>
          </span>
          <span class="wf-export-muted wf-export-repeats-hint">{{ repeatsHint }}</span>
        </span>
      </div>

      <div class="wf-export-toolbar">
        <input type="search" class="wf-fields-menu-filter" v-model="filter" placeholder="Filter fields" autocomplete="off" spellcheck="false" />
        <button type="button" class="wf-text-link" title="The identifiers, and the fields shown on the sheet now" @click="reset()">Reset to the sheet's fields</button>
        <button type="button" class="wf-text-link" @click="clear()">Deselect all</button>
      </div>

      <div class="wf-export-list">

        <!-- what the record goes by, always the first columns of the file -->
        <template v-if="recordColumns.length > 0">
          <div class="wf-export-heading">
            <span>Identifiers</span>
            <button type="button" class="wf-text-link" @click="toggleAllRecord()">{{ allRecordOn ? 'Deselect all' : 'Select all' }}</button>
          </div>
          <div class="wf-export-record">
            <label v-for="rc in recordColumns" :key="rc.key" :title="rc.hint || ''">
              <input type="checkbox" :checked="record.includes(rc.key)" @change="toggleRecord(rc.key)" />
              <span>{{ rc.label }}</span>
            </label>
          </div>
        </template>

        <template v-for="section in sections" :key="section.key">
          <div class="wf-export-heading">
            <span>{{ section.label }}</span>
            <button type="button" class="wf-text-link" @click="toggleSection(section)">{{ sectionAllOn(section) ? 'Deselect all' : 'Select all' }}</button>
          </div>
          <template v-for="group in section.groups" :key="group.key">
            <div class="wf-export-group">
              <label>
                <input type="checkbox" :checked="groupState(group) == 'all'" :indeterminate.prop="groupState(group) == 'some'" @change="toggleGroup(group)" />
                <span>{{ group.component.label }}</span>
                <span class="wf-fields-menu-rt">{{ group.component.rt }}</span>
              </label>
              <!-- a component that is one field: its link choice is on the same line -->
              <span v-if="group.allColumns.length == 1 && isLinked(group.allColumns[0])" class="wf-export-chips">
                <button type="button" :class="{'wf-export-chip-on': has(labels, group, group.allColumns[0])}" title="Export the label" @click="toggle(labels, group, group.allColumns[0])">Label</button>
                <button type="button" :class="{'wf-export-chip-on': has(uris, group, group.allColumns[0])}" title="Export the URI" @click="toggle(uris, group, group.allColumns[0])">URI</button>
              </span>
              <button v-if="group.allColumns.length > 1" type="button" class="wf-icon-button" :title="(isExpanded(group) ? 'Hide' : 'Show') + ' the subfields'" @click="toggleExpanded(group.key)">
                <span class="wf-fields-menu-count" v-if="groupState(group) == 'some'">{{ onCount(group) }}/{{ group.allColumns.length }}</span>
                <span class="material-icons">{{ isExpanded(group) ? 'expand_less' : 'expand_more' }}</span>
              </button>
            </div>
            <div v-if="group.allColumns.length > 1 && isExpanded(group)" class="wf-export-columns">
              <div v-for="column in group.allColumns" :key="column.key" class="wf-export-column">
                <label>
                  <input type="checkbox" :checked="columnOn(group, column)" @change="toggleColumn(group, column)" />
                  <span>{{ column.label }}</span>
                  <span v-if="columnHint(group.allColumns, column)" class="wf-fields-menu-rt">{{ columnHint(group.allColumns, column) }}</span>
                </label>
                <span v-if="isLinked(column)" class="wf-export-chips">
                  <button type="button" :class="{'wf-export-chip-on': has(labels, group, column)}" title="Export the label" @click="toggle(labels, group, column)">Label</button>
                  <button type="button" :class="{'wf-export-chip-on': has(uris, group, column)}" title="Export the URI" @click="toggle(uris, group, column)">URI</button>
                </span>
              </div>
            </div>
          </template>
        </template>

        <div v-if="sections.length == 0 && recordColumns.length == 0" class="wf-fields-menu-empty">No fields match "{{ filter }}"</div>
      </div>

      <p v-if="notLoadedCount > 0" class="wf-export-warning">
        <span class="material-icons">warning</span>
        {{ notLoadedCount }} record{{ notLoadedCount == 1 ? ' is' : 's are' }} not loaded (still loading, or could not be loaded): only {{ notLoadedCount == 1 ? 'its' : 'their' }} identifiers will be in the file.
      </p>

      <div class="wf-dialog-buttons wf-dialog-buttons-split">
        <span class="wf-export-muted">{{ columns.length }} column{{ columns.length == 1 ? '' : 's' }}{{ repeats == 'columns' ? ' (and more for the repeats)' : '' }}, {{ rows.length }} record{{ rows.length == 1 ? '' : 's' }}</span>
        <span class="wf-export-buttons">
          <button type="button" @click="$emit('close')">Cancel</button>
          <button type="button" class="wf-button-primary" :disabled="columns.length == 0 || rows.length == 0" @click="download()">Download CSV</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
/**
* Pick what goes into a CSV file of the open sheet's records, and download it. Every field of the
* sheet's profile can be exported, not only the ones on the sheet. What was picked is remembered
* for the workflow (workflowStore.preferences[workflowId].export).
* Emits 'close'.
*/
import { mapStores } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'

import { columnHint } from '@/lib/workflows/fields'
import { RECORD_COLUMNS, REPEAT_SEPARATOR, REPEAT_MODES, isLinkedColumn, buildExportColumns, buildExportTable, toCsv, exportFileName, downloadCsv } from '@/lib/workflows/exportCsv'

export default {
  name: "WorkflowExportDialog",
  emits: ['close'],
  data(){
    return {
      // the keys of the RECORD_COLUMNS picked
      record: [],
      // the fields picked, group key -> [column keys]: `labels` is the value itself (the label of a
      // linked one), `uris` the URI of a linked value. A linked field can be in one or both.
      labels: {},
      uris: {},
      // what checking a linked field picks of it: 'label' | 'uri' | 'both'
      mode: 'label',
      // where the repeats of a component go: 'cell' | 'columns' | 'rows', see lib/workflows/exportCsv.js
      repeats: 'cell',
      doneOnly: false,
      filter: '',
      // the components with their subfield list open
      expanded: [],
    }
  },
  computed: {
    ...mapStores(useWorkflowStore, useProfileStore, useConfigStore),

    session(){
      return this.workflowStore.activeSession
    },

    doneCount(){
      return this.session.rows.filter((r) => { return r.done }).length
    },

    // what the choice for the repeats does to the file, shown under it
    repeatsHint(){
      if (this.repeats == 'columns'){ return 'One line per record. Each repeat gets its own columns, numbered: "Contributors: Agent (1)", "Contributors: Agent (2)".' }
      if (this.repeats == 'rows'){ return 'A record takes a line for each repeat. The identifiers are on every one of its lines, the other fields on the line of their repeat.' }
      return 'One line per record. The repeats share the cell, split with "' + REPEAT_SEPARATOR.trim() + '".'
    },

    // the records that go in the file
    rows(){
      return this.session.rows.filter((r) => { return !this.doneOnly || r.done })
    },

    notLoadedCount(){
      return this.rows.filter((r) => { return !r.profile }).length
    },

    /**
    * Every component of the profile: the ones on the sheet in its order, then the rest
    * @return {array} - of {key, component, allColumns, inSheet, shownColumns}
    */
    groups(){
      return this.workflowStore.returnExportGroups()
    },

    needle(){
      return this.filter.trim().toLowerCase()
    },

    recordColumns(){
      return RECORD_COLUMNS.filter((rc) => { return !this.needle || rc.label.toLowerCase().includes(this.needle) })
    },

    allRecordOn(){
      return this.recordColumns.every((rc) => { return this.record.includes(rc.key) })
    },

    /**
    * The components under their headings, narrowed down by the filter: the sheet's own first,
    * then the rest of the profile by resource (Work, Instance...)
    * @return {array} - of {key, label, groups}
    */
    sections(){
      let groups = this.groups.filter((g) => {
        if (!this.needle){ return true }
        return g.component.label.toLowerCase().includes(this.needle) || g.component.rt.toLowerCase().includes(this.needle)
          || g.allColumns.some((c) => { return (c.label || '').toLowerCase().includes(this.needle) })
      })
      let sections = []
      let onSheet = groups.filter((g) => { return g.inSheet })
      if (onSheet.length > 0){ sections.push({ key: 'sheet', label: 'Fields on this sheet', groups: onSheet }) }
      for (let g of groups.filter((g) => { return !g.inSheet })){
        let section = sections.filter((s) => { return s.key === 'rt-' + g.component.rt })[0]
        if (!section){
          section = { key: 'rt-' + g.component.rt, label: 'Other ' + g.component.rt + ' fields', groups: [] }
          sections.push(section)
        }
        section.groups.push(g)
      }
      return sections
    },

    // the columns of the file as picked now
    columns(){
      return buildExportColumns(this.groups, { record: this.record, labels: this.labels, uris: this.uris })
    },
  },
  methods: {
    columnHint: columnHint,
    isLinked: isLinkedColumn,

    has(set, group, column){
      return (set[group.key] || []).includes(column.key)
    },

    /**
    * Put a field in, or take it out of, the labels or the uris
    * @param {object} set - this.labels | this.uris
    * @param {object} group
    * @param {object} column
    * @param {boolean} on - leave out to flip it
    */
    toggle(set, group, column, on){
      let keys = set[group.key] || []
      let isOn = keys.includes(column.key)
      if (on === undefined){ on = !isOn }
      if (on === isOn){ return }
      set[group.key] = on ? keys.concat([column.key]) : keys.filter((k) => { return k !== column.key })
    },

    columnOn(group, column){
      return this.has(this.labels, group, column) || this.has(this.uris, group, column)
    },

    /**
    * Pick a field, a linked one the way the "Linked values as" choice says, or take it out
    */
    setColumn(group, column, on){
      let linked = isLinkedColumn(column)
      this.toggle(this.labels, group, column, on && (!linked || this.mode != 'uri'))
      this.toggle(this.uris, group, column, on && linked && this.mode != 'label')
    },

    toggleColumn(group, column){
      this.setColumn(group, column, !this.columnOn(group, column))
    },

    onCount(group){
      return group.allColumns.filter((c) => { return this.columnOn(group, c) }).length
    },

    // 'all' | 'some' | 'none' of the component's fields are picked
    groupState(group){
      let on = this.onCount(group)
      return (on == 0) ? 'none' : (on == group.allColumns.length) ? 'all' : 'some'
    },

    setGroup(group, on){
      for (let column of group.allColumns){
        // a field already picked keeps the label / URI choice made for it
        if (on && this.columnOn(group, column)){ continue }
        this.setColumn(group, column, on)
      }
    },

    toggleGroup(group){
      this.setGroup(group, this.groupState(group) != 'all')
    },

    sectionAllOn(section){
      return section.groups.every((g) => { return this.groupState(g) == 'all' })
    },

    toggleSection(section){
      let on = !this.sectionAllOn(section)
      for (let group of section.groups){ this.setGroup(group, on) }
    },

    toggleRecord(key){
      this.record = this.record.includes(key) ? this.record.filter((k) => { return k !== key }) : this.record.concat([key])
    },

    toggleAllRecord(){
      let keys = this.recordColumns.map((rc) => { return rc.key })
      if (this.allRecordOn){
        this.record = this.record.filter((k) => { return !keys.includes(k) })
      } else {
        this.record = this.record.concat(keys.filter((k) => { return !this.record.includes(k) }))
      }
    },

    /**
    * Label, URI or both: for the linked fields picked now, and the ones picked from here on
    */
    setMode(mode){
      this.mode = mode
      for (let group of this.groups){
        for (let column of group.allColumns){
          if (isLinkedColumn(column) && this.columnOn(group, column)){ this.setColumn(group, column, true) }
        }
      }
    },

    // while a filter is typed the subfields are shown, they may be what matched
    isExpanded(group){
      return this.expanded.includes(group.key) || (this.needle != '' && !group.component.label.toLowerCase().includes(this.needle) && !group.component.rt.toLowerCase().includes(this.needle))
    },

    toggleExpanded(key){
      this.expanded = this.expanded.includes(key) ? this.expanded.filter((k) => { return k !== key }) : this.expanded.concat([key])
    },

    clear(){
      this.record = []
      this.labels = {}
      this.uris = {}
    },

    /**
    * The identifiers and what the sheet shows now: its fields, with the subfields each one shows
    */
    reset(){
      this.clear()
      this.record = RECORD_COLUMNS.filter((rc) => { return rc.on }).map((rc) => { return rc.key })
      for (let group of this.groups){
        for (let column of group.allColumns){
          if (group.shownColumns.includes(column.key)){ this.setColumn(group, column, true) }
        }
      }
    },

    /**
    * What was picked the last time this workflow was exported, without the fields that are gone
    * @param {object} saved - { record, labels, uris, mode, repeats, doneOnly }
    */
    restore(saved){
      this.mode = ['label', 'uri', 'both'].includes(saved.mode) ? saved.mode : 'label'
      this.repeats = REPEAT_MODES.includes(saved.repeats) ? saved.repeats : 'cell'
      this.doneOnly = !!saved.doneOnly && this.doneCount > 0
      this.record = (saved.record || []).filter((k) => { return RECORD_COLUMNS.some((rc) => { return rc.key === k }) })
      for (let group of this.groups){
        for (let column of group.allColumns){
          if (((saved.labels || {})[group.key] || []).includes(column.key)){ this.toggle(this.labels, group, column, true) }
          if (isLinkedColumn(column) && ((saved.uris || {})[group.key] || []).includes(column.key)){ this.toggle(this.uris, group, column, true) }
        }
      }
    },

    download(){
      if (this.columns.length == 0 || this.rows.length == 0){ return }
      let table = buildExportTable(this.rows, this.columns, this.profileStore.rtLookup, this.configStore.lookupConfig, this.repeats)
      downloadCsv(toCsv(table), exportFileName(this.session.name))
      this.workflowStore.setWorkflowPreference(this.session.workflowId, 'export', JSON.parse(JSON.stringify({
        record: this.record, labels: this.labels, uris: this.uris, mode: this.mode, repeats: this.repeats, doneOnly: this.doneOnly,
      })))
      this.workflowStore.notify('Exported ' + this.rows.length + ' record' + (this.rows.length == 1 ? '' : 's') + ' to a CSV file', 'success')
      this.$emit('close')
    },
  },
  created(){
    let pref = this.workflowStore.preferences[this.session.workflowId]
    if (pref && pref.export){ this.restore(pref.export) } else { this.reset() }
  },
  mounted(){
    // the keyboard is the dialog's, not the sheet's behind it
    this.$nextTick(() => { if (this.$refs.dialog){ this.$refs.dialog.focus() } })
  },
}
</script>
