<template>
  <!-- try the graph on one record: type an identifier, Test, and what the graph did to the record is
       listed (before / after). Drawn the way Baklava draws a node so it drags and selects like one -->
  <div :id="node.id" :class="['baklava-node', 'wf-graph-test', {'--selected': selected, '--dragging': dragging}]" :style="styles" :data-node-type="node.type" @pointerdown="$emit('select')">
    <div class="__title" @pointerdown.self.stop="startDrag($event)">
      <div class="__title-label">{{ node.title }}</div>
    </div>
    <div class="__content wf-graph-test-content">
      <div class="wf-graph-source-hint">Loads the record as a sheet would, runs the graph on it and shows what changed. Nothing is saved.</div>
      <form class="wf-graph-test-form" @submit.prevent="run()" @pointerdown.stop @keydown.stop>
        <input type="text" class="wf-graph-control-text" v-model="identifier" placeholder="LCCN, ISBN or barcode" :disabled="running" />
        <button type="submit" class="wf-button wf-button-primary" :disabled="running || !identifier.trim()">
          <span v-if="running" class="material-icons wf-graph-test-spin">autorenew</span>
          <span v-else class="material-icons">play_arrow</span>
          {{ running ? 'Testing' : 'Test' }}
        </button>
      </form>

      <div v-if="result" class="wf-graph-test-result" @pointerdown.stop>
        <div v-if="result.label || result.lccn" class="wf-graph-test-record">
          <span class="material-icons">menu_book</span>
          <span>{{ result.label || 'Record' }}<span v-if="result.lccn" class="wf-graph-test-lccn"> · {{ result.lccn }}</span></span>
        </div>
        <div v-if="result.pickReason" class="wf-graph-test-line wf-graph-log-info">{{ result.pickReason }}</div>
        <div v-if="result.error" class="wf-graph-test-line wf-graph-log-error"><span class="material-icons">error_outline</span>{{ result.error }}</div>
        <div v-if="result.dropped" class="wf-graph-test-line wf-graph-log-drop"><span class="material-icons">block</span>Dropped: {{ result.reason }}</div>

        <template v-if="changes.length > 0">
          <div class="wf-graph-test-head">{{ changes.length }} {{ changes.length == 1 ? 'change' : 'changes' }}</div>
          <div v-for="(e, idx) in changes" :key="'c' + idx" class="wf-graph-test-change">
            <div class="wf-graph-test-where"><span class="wf-graph-log-node" v-if="e.title">{{ e.title }}:</span> {{ e.where || e.message }}</div>
            <div class="wf-graph-test-diff" v-if="e.where">
              <span class="wf-graph-test-before">{{ e.before || '(empty)' }}</span>
              <span class="material-icons">arrow_forward</span>
              <span class="wf-graph-test-after">{{ e.after }}</span>
            </div>
          </div>
        </template>
        <div v-else-if="!result.error && !result.dropped" class="wf-graph-test-line">The graph changed nothing on this record.</div>

        <template v-if="others.length > 0">
          <div class="wf-graph-test-head">Also</div>
          <div v-for="(e, idx) in others" :key="'o' + idx" :class="['wf-graph-test-line', 'wf-graph-log-' + e.level]">
            <span class="wf-graph-log-node" v-if="e.title">{{ e.title }}:</span> {{ e.message }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TestNode',
  props: {
    node: Object,
    selected: Boolean,
    dragging: Boolean,
    // (identifier) -> Promise of what workflowStore.testGraph gives back
    runner: Function,
  },
  emits: ['select', 'start-drag'],
  data(){
    return {
      // kept on the node (saved with the graph), so it is still there after a reload of the builder
      identifier: (this.node.inputs.identifier && this.node.inputs.identifier.value) || '',
      running: false,
      result: null,
    }
  },
  computed: {
    styles(){
      return {
        top: (this.node.position ? this.node.position.y : 0) + 'px',
        left: (this.node.position ? this.node.position.x : 0) + 'px',
        '--width': (this.node.width || 380) + 'px',
      }
    },
    changes(){
      return (this.result ? this.result.log : []).filter((e) => { return e.level === 'change' })
    },
    // what the graph did besides changing the record: warnings, problems, notes, the drop itself is shown above
    others(){
      return (this.result ? this.result.log : []).filter((e) => { return e.level !== 'change' && e.level !== 'drop' })
    },
  },
  watch: {
    identifier(value){
      if (this.node.inputs.identifier){ this.node.inputs.identifier.value = value }
    },
  },
  methods: {
    startDrag(ev){
      if (!this.selected){ this.$emit('select') }
      this.$emit('start-drag', ev)
    },
    async run(){
      if (this.running || !this.runner){ return }
      this.running = true
      this.result = null
      try {
        this.result = await this.runner(this.identifier)
      } catch (e) {
        this.result = { error: (e && e.message) ? e.message : String(e), log: [] }
      } finally {
        this.running = false
      }
    },
  },
}
</script>
