<template>
  <!-- the record on the canvas: its fields grouped by component, collapsed until needed, drawn the
       way Baklava draws a node so the wires find the ports (ids on the node and each interface) -->
  <div :id="node.id" :class="['baklava-node', 'wf-graph-source', {'--selected': selected, '--dragging': dragging}]" :style="styles" :data-node-type="node.type" @pointerdown="$emit('select')">
    <div class="__title" @pointerdown.self.stop="startDrag($event)">
      <div class="__title-label">{{ node.title }}</div>
    </div>
    <div class="__content wf-graph-source-content">
      <div class="wf-graph-source-options">
        <div class="wf-graph-source-hint">Run on each record when it is loaded</div>
        <NodeInterface v-for="intf in enrichmentInputs" :key="intf.id" :node="node" :intf="intf" />
      </div>
      <div class="wf-graph-source-search">
        <span class="material-icons">search</span>
        <input type="text" v-model="search" placeholder="Find a field" @pointerdown.stop @keydown.stop />
        <button v-if="search" class="wf-icon-button" title="Clear" @click="search = ''"><span class="material-icons">close</span></button>
      </div>
      <div class="__outputs wf-graph-source-groups">
        <template v-for="origin in origins" :key="origin.origin">
          <!-- a whole origin (WorldCat's fields) folds away, a wire in it keeps it open -->
          <div v-if="origins.length > 1" class="wf-graph-source-origin" @click="toggleOrigin(origin)" @pointerdown.stop :title="(originOpen(origin) ? 'Hide' : 'Show') + ' the fields of ' + origin.label">
            <span class="material-icons">{{ originOpen(origin) ? 'expand_more' : 'chevron_right' }}</span>
            <span>{{ origin.label }}</span>
            <span v-if="originWired(origin) > 0" class="wf-graph-source-wired" :title="originWired(origin) + ' connected'">{{ originWired(origin) }}</span>
          </div>
          <div v-for="group in (originOpen(origin) ? origin.groups : [])" :key="group.id" :class="['wf-graph-source-group', {'wf-graph-source-group-open': isOpen(group)}]">
            <div class="wf-graph-source-group-head" @click="toggle(group)" @pointerdown.stop :title="(isOpen(group) ? 'Hide' : 'Show') + ' the fields of ' + group.label">
              <span class="material-icons">{{ isOpen(group) ? 'expand_more' : 'chevron_right' }}</span>
              <span :class="['wf-graph-source-rt', 'wf-graph-source-rt-' + group.rt.toLowerCase()]" v-if="group.rt">{{ group.rt }}</span>
              <span class="wf-graph-source-group-label">{{ group.label }}</span>
              <span v-if="wiredCount(group) > 0" class="wf-graph-source-wired" :title="wiredCount(group) + ' connected'">{{ wiredCount(group) }}</span>
            </div>
            <div v-if="isOpen(group)" class="wf-graph-source-ports">
              <NodeInterface v-for="port in visiblePorts(group)" :key="port.key" :node="node" :intf="node.outputs[port.key]" />
            </div>
          </div>
        </template>
        <div v-if="origins.length == 0" class="wf-graph-source-hint">No fields: the profile is not loaded.</div>
      </div>
    </div>
  </div>
</template>

<script>
import { Components } from '@baklavajs/renderer-vue'
import { enrichmentInputKey } from '@/lib/workflows/graph/baklava'
import { ENRICHMENT_ORIGINS, RECORD_ORIGIN } from '@/lib/workflows/graph/ports'

export default {
  name: 'SourceNode',
  components: { NodeInterface: Components.NodeInterface },
  props: {
    node: Object,
    selected: Boolean,
    dragging: Boolean,
    // from ports.listSourcePorts, for the enrichments that are checked
    groups: Array,
    // the node's position is kept by Baklava on the node itself
  },
  emits: ['select', 'start-drag'],
  data(){
    return {
      search: '',
      // the groups the user opened, origin + group key
      opened: [],
      // the origins (WorldCat) the user opened, the record's own fields are always open
      openedOrigins: [],
      // bumped when a wire is added or taken off, the connection counts are not reactive on their own
      tick: 0,
    }
  },
  computed: {
    styles(){
      return {
        top: (this.node.position ? this.node.position.y : 0) + 'px',
        left: (this.node.position ? this.node.position.x : 0) + 'px',
        '--width': (this.node.width || 360) + 'px',
      }
    },

    enrichmentInputs(){
      return Object.keys(ENRICHMENT_ORIGINS).map((id) => { return this.node.inputs[enrichmentInputKey(id)] }).filter((i) => { return i })
    },

    /**
    * The groups by origin (the record, then WorldCat), only those whose ports the node has
    */
    origins(){
      let byOrigin = []
      let needle = this.search.trim().toLowerCase()
      for (let group of (this.groups || [])){
        let ports = group.ports.filter((p) => { return this.node.outputs[p.key] })
        if (ports.length == 0){ continue }
        if (needle && !group.label.toLowerCase().includes(needle) && !ports.some((p) => { return p.label.toLowerCase().includes(needle) })){ continue }
        let origin = byOrigin.filter((o) => { return o.origin === group.origin })[0]
        if (!origin){
          origin = { origin: group.origin, label: group.originLabel, groups: [] }
          byOrigin.push(origin)
        }
        origin.groups.push({ id: group.origin + '|' + (group.groupKey || group.label), label: group.label, rt: group.fact ? null : group.rt, ports: ports, fact: group.fact })
      }
      return byOrigin
    },
  },
  methods: {
    /**
    * Dragging by the title: the node has to be the selected one first, the editor drags whatever is
    * selected (the same as Baklava's own node does)
    */
    startDrag(ev){
      if (!this.selected){ this.$emit('select') }
      this.$emit('start-drag', ev)
    },

    wiredCount(group){
      this.tick
      return group.ports.filter((p) => { let i = this.node.outputs[p.key]; return i && i.connectionCount > 0 }).length
    },

    /**
    * A group is open when the user opened it, when the search matches it, when one of its ports has a wire
    * (a wire needs its port on the screen), and a fact (one port) is always shown
    */
    isOpen(group){
      if (group.fact){ return true }
      if (this.search.trim()){ return true }
      if (this.wiredCount(group) > 0){ return true }
      return this.opened.includes(group.id)
    },

    originWired(origin){
      let n = 0
      for (let group of origin.groups){ n += this.wiredCount(group) }
      return n
    },

    originOpen(origin){
      if (origin.origin === RECORD_ORIGIN){ return true }
      if (this.search.trim()){ return true }
      if (this.originWired(origin) > 0){ return true }
      return this.openedOrigins.includes(origin.origin)
    },

    toggleOrigin(origin){
      if (origin.origin === RECORD_ORIGIN || this.search.trim() || this.originWired(origin) > 0){ return }
      if (this.openedOrigins.includes(origin.origin)){
        this.openedOrigins = this.openedOrigins.filter((k) => { return k !== origin.origin })
      } else {
        this.openedOrigins.push(origin.origin)
      }
    },

    toggle(group){
      if (group.fact || this.search.trim() || this.wiredCount(group) > 0){ return }
      if (this.opened.includes(group.id)){
        this.opened = this.opened.filter((k) => { return k !== group.id })
      } else {
        this.opened.push(group.id)
      }
    },

    visiblePorts(group){
      let needle = this.search.trim().toLowerCase()
      if (!needle || group.label.toLowerCase().includes(needle)){ return group.ports }
      return group.ports.filter((p) => { return p.label.toLowerCase().includes(needle) })
    },
  },
  mounted(){
    // the connection counts change under the node, redraw the wired counts when they do
    let graph = this.node.graph
    if (graph){
      this.unsubscribe = []
      graph.events.addConnection.subscribe(this, () => { this.tick++ })
      graph.events.removeConnection.subscribe(this, () => { this.tick++ })
    }
  },
  beforeUnmount(){
    let graph = this.node.graph
    if (graph){
      graph.events.addConnection.unsubscribe(this)
      graph.events.removeConnection.unsubscribe(this)
    }
  },
}
</script>
