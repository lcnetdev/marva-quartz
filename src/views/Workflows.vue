<template>
  <div class="wf-root">

    <div class="wf-bar">
      <router-link :to="{ name: 'Load' }" title="Back to the load screen"><span class="material-icons">arrow_back</span><span class="wf-bar-back">Marva</span></router-link>
      <span class="wf-bar-title">Workflows</span>
    </div>

    <div v-if="!workflowStore.enabled" class="wf-notice">Workflows are not turned on for your account.</div>
    <div v-else-if="!profilesLoaded || !workflowStore.initialized" class="wf-notice">Loading...</div>

    <div v-else class="wf-home">

      <div class="wf-home-column wf-home-column-wide">
        <h1>
          <span class="material-icons">view_list</span>
          <span>Workflows</span>
          <button class="wf-button" @click="openBuilder(null)">New Workflow</button>
          <button class="wf-button" @click="$refs.importFile.click()" title="Load a workflow from a file saved with Save as file"><span class="material-icons" style="font-size: 1.2em; vertical-align: -0.25em;">upload_file</span> Load file</button>
          <input type="file" ref="importFile" accept=".json,application/json" style="display: none;" @change="importFile($event)" />
        </h1>
        <div v-for="d in workflowStore.allDefinitions" :key="d.id" class="wf-card">
          <div class="wf-card-main" @click="start(d)" title="Open a new blank sheet with this workflow">
            <div class="wf-card-name">{{ d.name }}<span v-if="d.builtin" class="wf-card-tag">Built in</span><span v-if="d.graph && d.graph.editor" class="wf-card-tag" title="This workflow has a graph that runs on each record as it is loaded">Graph</span></div>
            <div v-if="d.description" class="wf-card-desc">{{ d.description }}</div>
            <div class="wf-card-fields">{{ returnFieldLabels(d) }}</div>
          </div>
          <div class="wf-card-actions">
            <button class="wf-button wf-button-primary" @click="start(d)">Open</button>
            <button v-if="d.builtin" class="wf-icon-button" @click="openBuilder(d)" title="Make your own copy of this workflow"><span class="material-icons">content_copy</span></button>
            <template v-else>
              <button class="wf-icon-button" @click="openBuilder(d)" title="Edit"><span class="material-icons">edit</span></button>
              <button class="wf-icon-button" @click="openGraph(d)" title="Edit as a graph (advanced)"><span class="material-icons">account_tree</span></button>
              <button class="wf-icon-button" @click="removeDefinition(d)" title="Delete"><span class="material-icons">delete</span></button>
            </template>
            <button class="wf-icon-button" @click="exportFile(d)" title="Save this workflow as a file"><span class="material-icons">download</span></button>
          </div>
        </div>
      </div>

      <div class="wf-home-column">
        <h1>
          <span class="material-icons">history</span>
          <span>Continue</span>
        </h1>
        <div v-if="workflowStore.sessions.length == 0" class="wf-home-empty">Sheets you have opened will be listed here.</div>
        <div v-for="s in workflowStore.sessions" :key="s.id" class="wf-card">
          <router-link class="wf-card-main" :to="{ name: 'WorkflowSession', params: { sessionId: s.id } }" style="color: inherit; text-decoration: none;">
            <div class="wf-card-name">{{ s.name }}</div>
            <div class="wf-card-meta">
              {{ s.rows.length }} record{{ s.rows.length == 1 ? '' : 's' }},
              {{ s.rows.filter((r) => r.done).length }} done &middot;
              {{ returnDate(s.updated) }}
            </div>
          </router-link>
          <div class="wf-card-actions">
            <button class="wf-icon-button" @click="renameSession(s)" title="Rename this sheet"><span class="material-icons">drive_file_rename_outline</span></button>
            <button class="wf-icon-button" @click="removeSession(s)" title="Delete this sheet (the records are not deleted)"><span class="material-icons">delete</span></button>
          </div>
        </div>
      </div>

    </div>

    <WorkflowBuilder v-if="showBuilder" :definition="builderDefinition" @close="showBuilder = false" @saved="showBuilder = false" @graph="openGraph($event)" />
    <GraphBuilder v-if="showGraph" :definition="graphDefinition" @close="showGraph = false" @saved="showGraph = false" />

    <!-- naming a new sheet, or renaming one -->
    <WorkflowNameDialog v-if="nameDialog" :title="nameDialog.title" :message="nameDialog.message" :initial="nameDialog.initial" :ok-label="nameDialog.okLabel" @ok="nameDialog.ok" @cancel="nameDialog = null" />

  </div>
</template>

<script>
import { mapStores, mapState } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'

import { workflowTheme, applyWorkflowTheme, removeWorkflowTheme } from '@/lib/workflows/theme'

import WorkflowBuilder from "@/components/workflows/WorkflowBuilder.vue";
import GraphBuilder from "@/components/workflows/graph/GraphBuilder.vue";
import { exportDefinition, exportFileName, importDefinition, downloadText, readFileText } from '@/lib/workflows/graph/file'
import WorkflowNameDialog from "@/components/workflows/WorkflowNameDialog.vue";

import '@/assets/workflows.css'
import '@/assets/workflows-graph.css'

export default {
  name: "Workflows",
  components: { WorkflowBuilder, GraphBuilder, WorkflowNameDialog },
  data(){
    return {
      showBuilder: false,
      builderDefinition: null,
      // the graph (advanced) builder, with the definition or draft it opened on
      showGraph: false,
      graphDefinition: null,
      // {title, message, initial, okLabel, ok(name)} while the name dialog is up
      nameDialog: null,
    }
  },
  computed: {
    ...mapStores(useWorkflowStore, usePreferenceStore),
    ...mapState(useProfileStore, ['profilesLoaded']),

    // the colors, from the editor's preferences, see lib/workflows/theme.js. Watched below and put on the document
    theme(){
      return workflowTheme(this.preferenceStore)
    },
  },
  watch: {
    theme(){ applyWorkflowTheme(this.preferenceStore) },
  },
  methods: {

    /**
    * Open a new sheet with a workflow, after asking what to call it
    */
    start(definition){
      this.nameDialog = {
        title: 'Name this sheet',
        message: 'A new sheet will be opened with the "' + definition.name + '" workflow. Give it a name so you can find it again under Continue.',
        initial: definition.name + ' - ' + new Date().toLocaleDateString([], { dateStyle: 'medium' }),
        okLabel: 'Open',
        ok: async (name) => {
          this.nameDialog = null
          let sessionId = await this.workflowStore.startSession(definition.id, name)
          if (sessionId){
            this.$router.push({ name: 'WorkflowSession', params: { sessionId: sessionId } })
          }
        },
      }
    },

    renameSession(session){
      this.nameDialog = {
        title: 'Rename sheet',
        message: '',
        initial: session.name,
        okLabel: 'Rename',
        ok: async (name) => {
          this.nameDialog = null
          await this.workflowStore.renameSession(session.id, name)
        },
      }
    },

    openBuilder(definition){
      this.builderDefinition = definition
      this.showBuilder = true
    },

    /**
    * The graph builder, on a saved workflow or on the simple builder's draft
    */
    openGraph(definition){
      this.showBuilder = false
      this.graphDefinition = definition
      this.showGraph = true
    },

    exportFile(definition){
      downloadText(exportFileName(definition), exportDefinition(definition))
    },

    /**
    * A workflow file picked with Load file: checked, matched to the profile and saved as one of the user's
    */
    async importFile(event){
      let file = event.target.files && event.target.files[0]
      event.target.value = ''
      if (!file){ return }
      let text
      try {
        text = await readFileText(file)
      } catch (e) {
        alert('The file could not be read.')
        return
      }
      let result = importDefinition(text)
      if (!result.definition){
        alert('That file can not be loaded as a workflow: ' + result.problems.join('; '))
        return
      }
      let resolved = this.workflowStore.resolveDefinition(result.definition)
      if (!resolved){
        alert('The profile this workflow uses (' + result.definition.profileId + ') is not available.')
        return
      }
      let saved = await this.workflowStore.saveDefinition(resolved)
      if (result.problems.length > 0){
        alert('Loaded "' + saved.name + '" with warnings:\n' + result.problems.join('\n'))
      }
      // straight into the builder it belongs in
      if (saved.graph && saved.graph.editor){
        this.openGraph(saved)
      } else {
        this.openBuilder(saved)
      }
    },

    removeDefinition(definition){
      if (!confirm('Delete the workflow "' + definition.name + '"? Sheets already opened with it are kept.')){ return }
      this.workflowStore.deleteDefinition(definition.id)
    },

    removeSession(session){
      if (!confirm('Delete "' + session.name + '" with ' + session.rows.length + ' records? The records themselves are not deleted.')){ return }
      this.workflowStore.deleteSession(session.id)
    },

    returnFieldLabels(definition){
      let resolved = this.workflowStore.resolveDefinition(definition)
      if (!resolved){ return 'The profile for this workflow is not available.' }
      return resolved.components.map((c) => { return c.label }).join(', ')
    },

    returnDate(timestamp){
      if (!timestamp){ return '' }
      return new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    },
  },
  mounted(){
    document.title = 'Marva | Workflows'
    applyWorkflowTheme(this.preferenceStore)
    this.workflowStore.init()
  },
  beforeUnmount(){
    removeWorkflowTheme()
  },
}
</script>
