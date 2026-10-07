<template>
  <div class="wf-dialog-overlay">
    <div class="wf-dialog wf-builder">
      <h2>{{ draft.id ? 'Edit Workflow' : 'New Workflow' }}</h2>
      <p>Pick the profile the records will be loaded with and the fields to show for each record.</p>

      <label class="wf-builder-field">
        Name
        <input type="text" v-model="draft.name" ref="name" placeholder="Name of the workflow" />
      </label>

      <label class="wf-builder-field">
        Description
        <input type="text" v-model="draft.description" placeholder="Optional" />
      </label>

      <label class="wf-builder-field">
        Profile
        <select v-model="draft.profileId" @change="profileChanged()">
          <option v-for="s in startingPoints" :key="s.instance" :value="s.instance">{{ s.name }}</option>
        </select>
      </label>

      <div class="wf-builder-columns">
        <div>
          <h3>Available fields</h3>
          <div class="wf-builder-list">
            <template v-for="rt in availableRts" :key="rt">
              <div class="wf-builder-list-rt">{{ rt }}</div>
              <label v-for="c in available.filter((a) => a.rt === rt)" :key="c.rt + c.id">
                <input type="checkbox" :checked="isSelected(c)" @change="toggle(c)" />
                <span>{{ c.label }}</span>
              </label>
            </template>
            <div v-if="available.length == 0" class="wf-home-empty">Select a profile.</div>
          </div>
        </div>
        <div>
          <h3>In this workflow, in this order ({{ draft.components.length }})</h3>
          <div class="wf-builder-list">
            <template v-for="(c, idx) in draft.components" :key="c.rt + c.id">
              <div class="wf-builder-selected">
                <span class="wf-fields-menu-rt">{{ c.rt }}</span>
                <span class="wf-builder-selected-label" :title="c.label">{{ c.label }}</span>
                <!-- which of the component's subfields the sheet shows, all of them unless some are unchecked -->
                <button v-if="columnsOf(c).length > 1" class="wf-icon-button" :title="(isExpanded(c) ? 'Hide' : 'Choose') + ' the subfields to show'" @click="toggleExpanded(c)">
                  <span class="wf-fields-menu-count" v-if="(c.hiddenColumns || []).length > 0">{{ columnsOf(c).length - c.hiddenColumns.length }}/{{ columnsOf(c).length }}</span>
                  <span class="material-icons">{{ isExpanded(c) ? 'expand_less' : 'expand_more' }}</span>
                </button>
                <button class="wf-icon-button" :disabled="idx == 0" @click="move(idx, -1)" title="Move up"><span class="material-icons">arrow_upward</span></button>
                <button class="wf-icon-button" :disabled="idx == draft.components.length - 1" @click="move(idx, 1)" title="Move down"><span class="material-icons">arrow_downward</span></button>
                <button class="wf-icon-button" @click="toggle(c)" title="Remove"><span class="material-icons">close</span></button>
              </div>
              <div v-if="isExpanded(c)" class="wf-fields-menu-columns">
                <label v-for="column in columnsOf(c)" :key="column.key">
                  <input type="checkbox" :checked="!(c.hiddenColumns || []).includes(column.key)" @change="toggleColumn(c, column.key)" />
                  <span>{{ column.label }}</span>
                  <span v-if="columnHint(columnsOf(c), column)" class="wf-fields-menu-rt">{{ columnHint(columnsOf(c), column) }}</span>
                </label>
              </div>
            </template>
            <div v-if="draft.components.length == 0" class="wf-home-empty">Check the fields to include.</div>
          </div>
        </div>
      </div>

      <h3 style="margin-top: 1em;">Run on each record when it is loaded</h3>
      <label v-for="e in enrichments" :key="e.id" class="wf-builder-enrichment">
        <input type="checkbox" :value="e.id" v-model="draft.enrichments" :disabled="!e.available" />
        <span>{{ e.label }}</span>
        <small>{{ e.description }}<template v-if="!e.available"> (not available yet)</template></small>
      </label>

      <div class="wf-dialog-buttons">
        <button @click="$emit('close')">Cancel</button>
        <button class="wf-button-primary" :disabled="!canSave" @click="save()">Save Workflow</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores, mapState } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useProfileStore } from '@/stores/profile'

import workflowEnrichments from '@/lib/workflows/enrichments'
import { columnHint } from '@/lib/workflows/fields'

export default {
  name: "WorkflowBuilder",
  props: {
    // the definition to edit or to start from, null for a blank one
    definition: Object,
  },
  emits: ['close', 'saved'],
  data(){
    return {
      draft: {
        id: null,
        name: '',
        description: '',
        profileId: '',
        components: [],
        enrichments: [],
      },
      enrichments: workflowEnrichments,
      // the selected components that have their subfield list open, rt|id
      expanded: [],
    }
  },
  computed: {
    ...mapStores(useWorkflowStore),
    ...mapState(useProfileStore, { allStartingPoints: 'startingPoints' }),

    // only the starting points that are a work + instance can be loaded from a scan
    startingPoints(){
      return Object.values(this.allStartingPoints).filter((s) => { return s.work && s.instance })
    },

    available(){
      if (!this.draft.profileId){ return [] }
      return this.workflowStore.returnProfileComponents(this.draft.profileId)
    },

    availableRts(){
      return [...new Set(this.available.map((a) => { return a.rt }))]
    },

    canSave(){
      return this.draft.name.trim() != '' && this.draft.profileId != '' && this.draft.components.length > 0
    },
  },
  methods: {
    isSelected(c){
      return this.draft.components.some((s) => { return s.rt === c.rt && s.id === c.id })
    },

    toggle(c){
      if (this.isSelected(c)){
        this.draft.components = this.draft.components.filter((s) => { return !(s.rt === c.rt && s.id === c.id) })
      } else {
        this.draft.components.push(JSON.parse(JSON.stringify(c)))
      }
    },

    move(idx, dir){
      let item = this.draft.components.splice(idx, 1)[0]
      this.draft.components.splice(idx + dir, 0, item)
    },

    /**
    * The subfields (columns) a selected component spreads out into in the sheet
    */
    columnsOf(c){
      return this.workflowStore.returnComponentColumns(this.draft.profileId, c)
    },

    columnHint: columnHint,

    isExpanded(c){
      return this.expanded.includes(c.rt + '|' + c.id)
    },

    toggleExpanded(c){
      let key = c.rt + '|' + c.id
      if (this.isExpanded(c)){
        this.expanded = this.expanded.filter((k) => { return k !== key })
      } else {
        this.expanded.push(key)
      }
    },

    toggleColumn(c, columnKey){
      if (!c.hiddenColumns){ c.hiddenColumns = [] }
      if (c.hiddenColumns.includes(columnKey)){
        c.hiddenColumns = c.hiddenColumns.filter((k) => { return k !== columnKey })
      } else {
        c.hiddenColumns.push(columnKey)
      }
    },

    profileChanged(){
      // the fields belong to the profile, keep the ones the new profile also has (and which subfields they show)
      let available = this.available
      this.draft.components = this.draft.components.map((s) => {
        let match = available.filter((a) => { return a.rt === s.rt && a.id === s.id })[0]
        return match ? Object.assign({}, match, { hiddenColumns: s.hiddenColumns || [] }) : null
      }).filter((s) => { return s })
    },

    async save(){
      let saved = await this.workflowStore.saveDefinition({
        id: this.draft.id,
        name: this.draft.name.trim(),
        description: this.draft.description.trim(),
        profileId: this.draft.profileId,
        components: this.draft.components,
        enrichments: this.draft.enrichments,
        created: this.draft.created,
      })
      this.$emit('saved', saved)
    },
  },
  created(){
    if (this.definition){
      let source = JSON.parse(JSON.stringify(this.definition))
      this.draft.name = source.name || ''
      this.draft.description = source.description || ''
      this.draft.profileId = source.profileId || ''
      this.draft.enrichments = source.enrichments || []
      // a built in one is copied not edited
      if (!source.builtin){
        this.draft.id = source.id
        this.draft.created = source.created
      } else {
        this.draft.name = source.name + ' (copy)'
      }
      this.draft.components = source.components || []
      // fills in the labels and drops anything the profile doesn't have
      this.profileChanged()
    } else if (this.startingPoints.length > 0){
      let monograph = this.startingPoints.filter((s) => { return s.name == 'Monograph' })[0]
      this.draft.profileId = (monograph || this.startingPoints[0]).instance
    }
  },
  mounted(){
    this.$refs.name.focus()
  },
}
</script>
