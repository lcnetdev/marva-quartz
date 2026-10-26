<template>
  <!-- the advanced builder: the workflow as a graph of nodes over the record's fields -->
  <div class="wf-graph-overlay">
    <div class="wf-graph-bar">
      <span class="material-icons wf-graph-bar-icon">account_tree</span>
      <input type="text" class="wf-graph-name" v-model="draft.name" placeholder="Name of the workflow" />
      <input type="text" class="wf-graph-desc" v-model="draft.description" placeholder="Description (optional)" />
      <select v-model="draft.profileId" @change="profileChanged()" title="The profile the records are loaded with">
        <option v-for="s in startingPoints" :key="s.instance" :value="s.instance">{{ s.name }}</option>
      </select>
      <span class="wf-graph-bar-space"></span>
      <button class="wf-button" @click="loadFile()" title="Load a workflow from a file"><span class="material-icons">upload_file</span> Load file</button>
      <button class="wf-button" @click="saveFile()" title="Save this workflow as a file"><span class="material-icons">download</span> Save as file</button>
      <button class="wf-button" @click="$emit('close')">Cancel</button>
      <button class="wf-button wf-button-primary" :disabled="!canSave" @click="save()">Save workflow</button>
      <input type="file" ref="file" accept=".json,application/json" style="display: none;" @change="fileChosen($event)" />
    </div>

    <div v-if="problems.length > 0" class="wf-graph-problems">
      <span class="material-icons">warning</span>
      <ul>
        <li v-for="(p, idx) in problems" :key="idx">{{ p }}</li>
      </ul>
      <button class="wf-icon-button" title="Dismiss" @click="problems = []"><span class="material-icons">close</span></button>
    </div>

    <div class="wf-graph-canvas" v-if="baklava">
      <BaklavaEditor :view-model="baklava">
        <template #node="p">
          <SourceNode v-if="p.node.type === SOURCE_NODE_TYPE" :node="p.node" :selected="p.selected" :dragging="p.dragging" :groups="groups" @select="p.onSelect" @start-drag="p.onStartDrag" />
          <TestNode v-else-if="p.node.type === TEST_NODE_TYPE" :node="p.node" :selected="p.selected" :dragging="p.dragging" :runner="runTest" @select="p.onSelect" @start-drag="p.onStartDrag" />
          <BaklavaNode v-else :node="p.node" :selected="p.selected" :dragging="p.dragging" @select="p.onSelect" @start-drag="p.onStartDrag" />
        </template>
      </BaklavaEditor>
    </div>

    <div class="wf-graph-foot">
      <span class="wf-graph-foot-hint">Drag from a field of the record to a node. A node runs once per line of the field (each contributor, each subject). Fields the sheet shows are set in the simple builder, this graph runs on each record as it is loaded, before it goes on the sheet.</span>
      <span class="wf-graph-foot-count">{{ summary.nodes }} nodes, {{ summary.wires }} wires</span>
    </div>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { mapStores, mapState } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useProfileStore } from '@/stores/profile'

import { BaklavaEditor, Components, useBaklava } from '@baklavajs/renderer-vue'
import '@baklavajs/themes/dist/classic.css'

import SourceNode from './SourceNode.vue'
import TestNode from './TestNode.vue'
import { buildNodeTypes, buildSourceNodeType, buildTestNodeType, prepareEditor, findSourceNode, enrichmentInputKey } from '@/lib/workflows/graph/baklava'
import { SOURCE_NODE_TYPE, TEST_NODE_TYPE, RECORD_ORIGIN, ENRICHMENT_ORIGINS, listSourcePorts } from '@/lib/workflows/graph/ports'
import { exportDefinition, exportFileName, importDefinition, checkGraphPorts, downloadText, readFileText, GRAPH_VERSION } from '@/lib/workflows/graph/file'
import { graphSummary } from '@/lib/workflows/graph/run'

export default {
  name: 'GraphBuilder',
  components: { BaklavaEditor, BaklavaNode: Components.Node, SourceNode, TestNode },
  props: {
    // the definition to edit, or a draft from the simple builder (id null for a new one)
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
        graph: null,
        created: null,
      },
      baklava: null,
      // the enrichments checked on the source node, kept here so the port groups follow them
      enrichmentsOn: [],
      problems: [],
      summary: { nodes: 0, wires: 0, ports: 0 },
      SOURCE_NODE_TYPE: SOURCE_NODE_TYPE,
      TEST_NODE_TYPE: TEST_NODE_TYPE,
    }
  },
  computed: {
    ...mapStores(useWorkflowStore),
    ...mapState(useProfileStore, { allStartingPoints: 'startingPoints' }),

    startingPoints(){
      return Object.values(this.allStartingPoints).filter((s) => { return s.work && s.instance })
    },

    components(){
      if (!this.draft.profileId){ return [] }
      return this.workflowStore.returnProfileComponents(this.draft.profileId)
    },

    /**
    * The ports of the source node, for the enrichments that are checked on it
    */
    groups(){
      return listSourcePorts(this.components, (c) => { return this.workflowStore.returnComponentColumns(this.draft.profileId, c) }, this.enrichmentsOn)
    },

    canSave(){
      return this.draft.name.trim() != '' && this.draft.profileId != ''
    },
  },
  methods: {
    /**
    * The record's fields a node can write to, for the Field select of Set value / Copy value
    */
    targetItems(){
      let items = []
      for (let group of listSourcePorts(this.components, (c) => { return this.workflowStore.returnComponentColumns(this.draft.profileId, c) }, [])){
        if (group.origin !== RECORD_ORIGIN || group.fact){ continue }
        for (let port of group.ports){
          items.push({ text: port.label, value: port.key, group: group.rt + ': ' + group.label })
        }
      }
      return items
    },

    /**
    * Build the canvas for the draft's profile and put the graph on it
    */
    setupEditor(){
      let viewModel = useBaklava()
      viewModel.settings.sidebar.enabled = false
      viewModel.settings.enableMinimap = false
      viewModel.settings.nodes.defaultWidth = 320
      // inputs and settings first, then what comes out, so a node reads top to bottom
      viewModel.settings.nodes.reverseY = true
      viewModel.settings.nodes.maxWidth = 520
      viewModel.settings.displayValueOnHover = false
      let columnsFor = (c) => { return this.workflowStore.returnComponentColumns(this.draft.profileId, c) }
      let editor = prepareEditor(viewModel, buildNodeTypes(this.targetItems()), buildSourceNodeType(this.components, columnsFor), buildTestNodeType())

      let warnings = []
      if (this.draft.graph && this.draft.graph.editor){
        try {
          warnings = editor.load(JSON.parse(JSON.stringify(this.draft.graph.editor))) || []
        } catch (e) {
          console.error('Workflows: could not load the graph', e)
          warnings = ['The graph could not be loaded: ' + ((e && e.message) ? e.message : String(e))]
        }
      }
      let source = findSourceNode(editor.graph)
      if (!source){
        source = new (buildSourceNodeType(this.components, columnsFor))()
        editor.graph.addNode(source)
        // to the right of the palette
        source.position = { x: 260, y: 90 }
      }
      // the check boxes follow the definition's enrichments, and the definition follows the check boxes
      for (let id in ENRICHMENT_ORIGINS){
        let intf = source.inputs[enrichmentInputKey(id)]
        if (intf){ intf.value = (this.draft.enrichments || []).includes(id) }
      }
      this.syncEnrichments(source)
      source.events.update.subscribe(this, () => { this.syncEnrichments(source) })
      editor.graphEvents.addConnection.subscribe(this, () => { this.refreshSummary() })
      editor.graphEvents.removeConnection.subscribe(this, () => { this.refreshSummary() })
      editor.graphEvents.addNode.subscribe(this, (node) => {
        this.refreshSummary()
        if (!editor.loading){ this.placeInView(node) }
      })
      editor.graphEvents.removeNode.subscribe(this, () => { this.refreshSummary() })

      this.baklava = markRaw(viewModel)
      this.refreshSummary()

      let missing = checkGraphPorts({ graph: this.draft.graph }, listSourcePorts(this.components, columnsFor, this.draft.enrichments))
      this.problems = warnings.concat(missing.map((m) => { return 'The profile does not have a field the graph uses: ' + m.description }))
    },

    /**
    * A node added from the palette lands where the pointer let go of it. A click without a drag
    * (or a drop under the palette, or off the visible canvas) would put it out of sight: then it
    * goes to the middle of what the user is looking at
    * @param {object} node - just added, the palette sets its position right after
    */
    placeInView(node){
      window.setTimeout(() => {
        if (!this.baklava){ return }
        // the component's root is a fragment (a comment before the overlay), so not $el
        let editorEl = document.querySelector('.wf-graph-overlay .baklava-editor')
        let palette = document.querySelector('.wf-graph-overlay .baklava-node-palette')
        if (!editorEl || !node.position){ return }
        let graph = this.baklava.displayedGraph
        let rect = editorEl.getBoundingClientRect()
        let paletteWidth = palette ? palette.getBoundingClientRect().width : 0
        let scale = graph.scaling || 1
        let toScreen = (x, y) => { return [(x + graph.panning.x) * scale, (y + graph.panning.y) * scale] }
        let [sx, sy] = toScreen(node.position.x, node.position.y)
        let width = (node.width || 260) * scale
        let inView = sx > paletteWidth && sy > 0 && sx + width < rect.width && sy < rect.height - 40
        if (inView){ return }
        let centerX = (paletteWidth + rect.width) / 2
        let centerY = rect.height / 2
        node.position.x = centerX / scale - graph.panning.x - (node.width || 260) / 2
        node.position.y = centerY / scale - graph.panning.y - 60
      }, 0)
    },

    syncEnrichments(source){
      let on = []
      for (let id in ENRICHMENT_ORIGINS){
        let intf = source.inputs[enrichmentInputKey(id)]
        if (intf && intf.value){ on.push(id) }
      }
      // the enrichments that have no fields on the source node (none yet) are kept as they were
      let others = (this.draft.enrichments || []).filter((id) => { return !ENRICHMENT_ORIGINS[id] })
      this.enrichmentsOn = on
      this.draft.enrichments = others.concat(on)
    },

    /**
    * The Test node's button: the graph as it stands on the canvas, on the record of the identifier
    * @param {string} identifier
    * @return {Promise<object>} - from workflowStore.testGraph
    */
    runTest(identifier){
      return this.workflowStore.testGraph(this.currentDefinition(), identifier)
    },

    refreshSummary(){
      if (!this.baklava){ return }
      this.summary = graphSummary(this.baklava.editor.save())
    },

    /**
    * What is on the canvas, as the definition keeps it
    */
    currentGraph(){
      if (!this.baklava){ return this.draft.graph }
      return { version: GRAPH_VERSION, editor: JSON.parse(JSON.stringify(this.baklava.editor.save())) }
    },

    currentDefinition(){
      return {
        id: this.draft.id,
        name: this.draft.name.trim(),
        description: this.draft.description.trim(),
        profileId: this.draft.profileId,
        components: this.draft.components,
        enrichments: this.draft.enrichments,
        graph: this.currentGraph(),
        created: this.draft.created,
      }
    },

    profileChanged(){
      // the ports belong to the profile, the graph is kept and checked against the new one
      this.draft.graph = this.currentGraph()
      let available = this.components
      this.draft.components = this.draft.components.map((s) => {
        let match = available.filter((a) => { return a.rt === s.rt && a.id === s.id })[0]
        return match ? Object.assign({}, match, { hiddenColumns: s.hiddenColumns || [] }) : null
      }).filter((s) => { return s })
      this.baklava = null
      this.$nextTick(() => { this.setupEditor() })
    },

    async save(){
      if (this.draft.components.length == 0){
        // the sheet needs something to show, the simple builder's job, give it a sensible start
        this.workflowStore.notify('The workflow has no fields for the sheet yet, add them with Edit on the workflow', 'warning')
      }
      let saved = await this.workflowStore.saveDefinition(this.currentDefinition())
      this.draft.id = saved.id
      this.draft.created = saved.created
      this.$emit('saved', saved)
    },

    saveFile(){
      downloadText(exportFileName(this.draft), exportDefinition(this.currentDefinition()))
    },

    loadFile(){
      this.$refs.file.value = ''
      this.$refs.file.click()
    },

    async fileChosen(event){
      let file = event.target.files && event.target.files[0]
      if (!file){ return }
      let text
      try {
        text = await readFileText(file)
      } catch (e) {
        this.problems = ['The file could not be read']
        return
      }
      let result = importDefinition(text)
      if (!result.definition){
        this.problems = result.problems
        return
      }
      let d = result.definition
      this.draft.name = d.name
      this.draft.description = d.description
      this.draft.profileId = d.profileId
      this.draft.enrichments = d.enrichments
      this.draft.graph = d.graph
      let available = this.workflowStore.returnProfileComponents(d.profileId)
      this.draft.components = d.components.map((c) => {
        let match = available.filter((a) => { return a.rt === c.rt && a.id === c.id })[0]
        return match ? Object.assign({}, match, { hiddenColumns: c.hiddenColumns || [] }) : null
      }).filter((c) => { return c })
      this.baklava = null
      this.$nextTick(() => {
        this.setupEditor()
        this.problems = result.problems.concat(this.problems)
      })
    },
  },
  created(){
    if (this.definition){
      let d = JSON.parse(JSON.stringify(this.definition))
      this.draft = {
        id: d.builtin ? null : (d.id || null),
        name: d.builtin ? d.name + ' (copy)' : (d.name || ''),
        description: d.description || '',
        profileId: d.profileId || '',
        components: d.components || [],
        enrichments: d.enrichments || [],
        graph: d.graph || null,
        created: d.builtin ? null : d.created,
      }
    }
    if (!this.draft.profileId && this.startingPoints.length > 0){
      this.draft.profileId = this.startingPoints[0].instance
    }
  },
  mounted(){
    this.setupEditor()
  },
}
</script>
