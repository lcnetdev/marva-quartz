<template>
  <!-- what the workflow's graph did to a record, under its label on the sheet (workflowStore.runGraphOnRow) -->
  <div v-if="entries && entries.length > 0" :class="['wf-validation', 'wf-graph-log', 'wf-validation-' + tone]" @click.stop>
    <div class="wf-validation-line">
      <button class="wf-validation-summary" @click="open = !open" :title="open ? 'Hide what the workflow did' : 'Show what the workflow did'">
        <span class="material-icons">account_tree</span>
        <span>{{ summary }}</span>
        <span class="material-icons wf-validation-caret">{{ open ? 'expand_less' : 'expand_more' }}</span>
      </button>
      <button v-if="rerun" class="wf-validation-dismiss" title="Run the workflow on this record again" @click="$emit('rerun')"><span class="material-icons">replay</span></button>
    </div>
    <ul v-if="open" class="wf-validation-list">
      <li v-for="(e, idx) in entries" :key="idx" :class="['wf-graph-log-' + e.level]">
        <span class="wf-graph-log-node" v-if="e.title">{{ e.title }}:</span> {{ e.message }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'GraphLog',
  props: {
    // [{nodeId, title, message, level: info|change|flag|error|drop}]
    entries: Array,
    // show the run again button
    rerun: Boolean,
  },
  emits: ['rerun'],
  data(){
    return { open: false }
  },
  computed: {
    counts(){
      let c = { change: 0, flag: 0, error: 0 }
      for (let e of (this.entries || [])){ if (c[e.level] !== undefined){ c[e.level]++ } }
      return c
    },
    tone(){
      if (this.counts.error > 0){ return 'bad' }
      if (this.counts.flag > 0){ return 'warn' }
      return 'good'
    },
    summary(){
      let parts = []
      if (this.counts.change > 0){ parts.push(this.counts.change + (this.counts.change == 1 ? ' change' : ' changes')) }
      if (this.counts.flag > 0){ parts.push(this.counts.flag + (this.counts.flag == 1 ? ' warning' : ' warnings')) }
      if (this.counts.error > 0){ parts.push(this.counts.error + (this.counts.error == 1 ? ' problem' : ' problems')) }
      return parts.length > 0 ? 'Workflow: ' + parts.join(', ') : 'Workflow ran, nothing to do'
    },
  },
}
</script>
