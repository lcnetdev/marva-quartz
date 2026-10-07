<template>
  <div class="wf-root">

    <div class="wf-bar">
      <router-link :to="{ name: 'Workflows' }" title="Back to the list of workflows"><span class="material-icons">arrow_back</span><span class="wf-bar-back">Workflows</span></router-link>

      <template v-if="session">
        <button class="wf-bar-title wf-bar-title-button" :title="session.name + ' (click to rename)'" @click="renaming = true">{{ session.name }}</button>
        <span class="wf-bar-count">{{ doneCount }} / {{ session.rows.length }} done</span>

        <form class="wf-scan" @submit.prevent="scan">
          <span class="material-icons">qr_code_scanner</span>
          <input type="text" ref="scanInput" v-model="scanValue" @keydown.enter.prevent="scan" placeholder="Scan or type a LCCN, ISBN or barcode" autocomplete="off" spellcheck="false" />
        </form>

        <span class="wf-bar-spacer"></span>

        <VDropdown>
          <button class="wf-bar-button wf-bar-help" title="How to use the sheet"><span class="material-icons">help_outline</span></button>
          <template #popper>
            <div class="wf-help-menu">
              <div class="wf-fields-menu-heading">Mouse</div>
              <dl>
                <dt>Click</dt><dd>select a cell, click it again to edit</dd>
                <dt>Right click</dt><dd>the field's actions menu</dd>
                <template v-if="layout == 'sheet'"><dt>Drag</dt><dd>move around the sheet</dd></template>
                <dt>Ctrl / &#8984; + wheel</dt><dd>zoom</dd>
                <template v-if="layout == 'sheet'"><dt>Column edge</dt><dd>drag to resize, double click to reset</dd></template>
                <template v-if="layout == 'sheet'"><dt>Column header</dt><dd>select the column, then paste a copied cell down it</dd></template>
              </dl>
              <div class="wf-fields-menu-heading">Keyboard, with a cell selected</div>
              <dl v-if="layout == 'pages'">
                <dt>Arrows, Tab</dt><dd>move one cell</dd>
                <dt>A / D</dt><dd>previous / next field group</dd>
                <dt>W / S, Page Up / Down</dt><dd>previous / next record</dd>
                <dt>Home / End</dt><dd>start / end of the line</dd>
                <dt>Ctrl + Home / End</dt><dd>first / last cell of the page</dd>
                <dt>Enter, F2, typing</dt><dd>edit the cell</dd>
                <dt>Enter / Esc</dt><dd>finish editing</dd>
                <dt>Delete, Backspace</dt><dd>clear the cell</dd>
                <dt>Ctrl / &#8984; + C</dt><dd>copy the cell (its text, and the value for pasting into a cell of the same kind)</dd>
                <dt>Ctrl / &#8984; + V</dt><dd>paste the copied cell here, or on a grey line below a component as a new one</dd>
                <dt>Ctrl / &#8984; + Z</dt><dd>undo the last change to a record (Shift to redo)</dd>
                <dt>Esc</dt><dd>stop copying, deselect</dd>
              </dl>
              <dl v-else>
                <dt>Arrows, Tab</dt><dd>move one cell</dd>
                <dt>A / D</dt><dd>previous / next field group</dd>
                <dt>W / S</dt><dd>previous / next record</dd>
                <dt>Home / End</dt><dd>start of the row / the row's actions</dd>
                <dt>Page Up / Down</dt><dd>10 lines</dd>
                <dt>Ctrl + Home / End</dt><dd>first / last cell of the sheet</dd>
                <dt>Enter, F2, typing</dt><dd>edit the cell</dd>
                <dt>Enter / Esc</dt><dd>finish editing</dd>
                <dt>Delete, Backspace</dt><dd>clear the cell</dd>
                <dt>Ctrl / &#8984; + C</dt><dd>copy the cell (its text, and the value for pasting into a cell of the same kind)</dd>
                <dt>Ctrl / &#8984; + V</dt><dd>paste the copied cell here, or on a grey line below a component as a new one</dd>
                <dt>Ctrl / &#8984; + Z</dt><dd>undo the last change to a record (Shift to redo)</dd>
                <dt>Esc</dt><dd>stop copying, deselect</dd>
              </dl>
              <div class="wf-fields-menu-heading">Scanning</div>
              <p>Scan a barcode at any time, wherever the cursor is, or type a LCCN, ISBN or barcode in the box and press Enter.</p>
            </div>
          </template>
        </VDropdown>

        <VDropdown>
          <button class="wf-bar-button" title="Show or hide fields">
            <span class="material-icons">view_column</span>Fields<template v-if="hiddenCount > 0"> ({{ hiddenCount }} hidden)</template>
          </button>
          <template #popper>
            <div class="wf-fields-menu">
              <div class="wf-fields-menu-heading">In this sheet <span class="wf-fields-menu-hint">drag to reorder</span></div>
              <!-- the order here is the order of the columns in the sheet, drag a row by its handle to move it -->
              <template v-for="group in workflowStore.columnGroups" :key="group.key">
                <div :class="['wf-fields-menu-group', {'wf-drag-source': dragging === group.key, 'wf-drop-before': dropTarget === group.key && dropAfter === false, 'wf-drop-after': dropTarget === group.key && dropAfter === true}]"
                  :draggable="dragArmed === group.key"
                  @dragstart="dragStart($event, group.key)" @dragover.prevent="dragOver($event, group.key)" @drop.prevent="drop(group.key)" @dragend="dragEnd()">
                  <span class="material-icons wf-drag-handle" title="Drag to reorder" @mousedown="dragArmed = group.key" @mouseup="dragArmed = null">drag_indicator</span>
                  <label>
                    <input type="checkbox" :checked="!group.hidden" @change="workflowStore.toggleComponent(group.key)" />
                    <span>{{ group.component.label }}</span>
                    <span class="wf-fields-menu-rt">{{ group.component.rt }}</span>
                  </label>
                  <!-- which of the component's subfields are shown -->
                  <button v-if="group.allColumns.length > 1" class="wf-icon-button" :title="(expandedGroups.includes(group.key) ? 'Hide' : 'Show') + ' the subfields'" @click="toggleExpanded(group.key)">
                    <span class="wf-fields-menu-count" v-if="group.columns.length < group.allColumns.length">{{ group.columns.length }}/{{ group.allColumns.length }}</span>
                    <span class="material-icons">{{ expandedGroups.includes(group.key) ? 'expand_less' : 'expand_more' }}</span>
                  </button>
                </div>
                <div v-if="expandedGroups.includes(group.key)" class="wf-fields-menu-columns">
                  <label v-for="column in group.allColumns" :key="column.key">
                    <input type="checkbox" :checked="!(group.component.hiddenColumns || []).includes(column.key)" @change="workflowStore.toggleColumn(group.key, column.key)" />
                    <span>{{ column.label }}</span>
                    <span v-if="columnHint(group.allColumns, column)" class="wf-fields-menu-rt">{{ columnHint(group.allColumns, column) }}</span>
                  </label>
                </div>
              </template>

              <!-- the rest of the profile's components, click one to add it to the end of the sheet -->
              <div class="wf-fields-menu-heading wf-fields-menu-add">Add a field</div>
              <input type="search" class="wf-fields-menu-filter" v-model="fieldFilter" placeholder="Filter fields" autocomplete="off" spellcheck="false" @keydown.stop @keydown.enter.prevent="addFirstMatch" />
              <template v-for="rt in addableRts" :key="rt">
                <div class="wf-fields-menu-rt-heading">{{ rt }}</div>
                <a v-for="c in addableFiltered.filter((a) => a.rt === rt)" :key="c.rt + c.id" class="wf-fields-menu-item" :title="'Add ' + c.label + ' to the sheet'" @click="workflowStore.addComponent(c)">
                  <span class="material-icons">add</span><span>{{ c.label }}</span>
                </a>
              </template>
              <div v-if="addableFiltered.length == 0" class="wf-fields-menu-empty">
                <template v-if="fieldFilter">No fields match "{{ fieldFilter }}"</template>
                <template v-else>Every field of this profile is in the sheet</template>
              </div>
            </div>
          </template>
        </VDropdown>

        <VDropdown>
          <button class="wf-bar-button" title="Options for this workflow"><span class="material-icons">tune</span>Options</button>
          <template #popper>
            <div class="wf-options-menu">
              <div class="wf-fields-menu-heading">Layout</div>
              <div class="wf-layout-toggle">
                <button :class="['wf-button', {'wf-button-primary': layout == 'sheet'}]" @click="setLayout('sheet')" title="Every record is a row of one big sheet">
                  <span class="material-icons">grid_on</span>Spreadsheet
                </button>
                <button :class="['wf-button', {'wf-button-primary': layout == 'pages'}]" @click="setLayout('pages')" title="One record at a time, its fields stacked down the page">
                  <span class="material-icons">article</span>One record per page
                </button>
              </div>

              <div class="wf-fields-menu-heading wf-options-heading">When a scan matches several records</div>
              <template v-if="autoFormat">
                <p>The <strong>{{ autoFormat }}</strong> record is taken without asking (when exactly one of the matches is {{ autoFormat }}).</p>
                <button class="wf-button" @click="workflowStore.setAutoFormat(session.workflowId, null)">Ask me which record each time</button>
              </template>
              <p v-else>You are asked which record to load. Tick "Always select this version from now on" in that dialog to stop being asked.</p>
              <div class="wf-fields-menu-heading wf-options-heading">Colours</div>
              <p>The colours given to fields in the editor's Field Colors apply to the cells here too.</p>
              <button class="wf-button" @click="openFieldColors()" title="The editor's Field Colors, the same preference"><span class="material-icons">palette</span> Field colours...</button>
            </div>
          </template>
        </VDropdown>

        <span class="wf-bar-zoom">
          <button class="wf-bar-button" @click="$refs.grid.zoomOut()" title="Zoom out"><span class="material-icons">remove</span></button>
          <button class="wf-bar-button wf-bar-zoom-value" @click="$refs.grid.resetView()" title="Reset the view">{{ zoomPercent }}%</button>
          <button class="wf-bar-button" @click="$refs.grid.zoomIn()" title="Zoom in"><span class="material-icons">add</span></button>
        </span>

        <button class="wf-bar-button" :disabled="!!workflowStore.busy" @click="workflowStore.postAll()" title="Post every record that has not been posted, one after the other">
          <span class="material-icons">sailing</span>Post All
        </button>
        <button class="wf-bar-button" @click="workflowStore.openAllLcap()" title="Open every record in LCAP, each in its own tab">
          <span class="material-icons">open_in_new</span>Open All in LCAP
        </button>
      </template>
    </div>

    <div v-if="!workflowStore.enabled" class="wf-notice">Workflows are not turned on for your account.</div>
    <div v-else-if="notFound" class="wf-notice">That workflow session could not be found. <router-link :to="{ name: 'Workflows' }">Back to Workflows</router-link></div>
    <div v-else-if="!session" class="wf-notice">Loading...</div>
    <!-- the records as a spreadsheet, or one to a page (Options) -->
    <WorkflowPages v-else-if="layout == 'pages'" ref="grid" @click="gridClick" @scale="zoom = $event" />
    <WorkflowGrid v-else ref="grid" @click="gridClick" @scale="zoom = $event" />

    <!-- errors show up large in the middle of the page first so they are not missed, then settle into the corner with the rest -->
    <div class="wf-messages">
      <div v-for="m in workflowStore.messages" :key="m.id" :data-message-id="m.id" :class="['wf-message', 'wf-message-' + m.type]" title="Click to dismiss" @click="workflowStore.dismissMessage(m.id)">
        <span v-if="m.type == 'error'" class="material-icons">error</span>
        <span v-else-if="m.type == 'warning'" class="material-icons">warning</span>{{ m.text }}
      </div>
    </div>

    <!-- a scan matched more than one record -->
    <div v-if="prompt" class="wf-dialog-overlay">
      <div class="wf-dialog" ref="promptDialog" @keydown="promptKey">
        <h2>Which record?</h2>
        <p>"{{ prompt.scanned }}" matches {{ prompt.candidates.length }} records. <template v-if="workflowStore.prompts.length > 1">({{ workflowStore.prompts.length - 1 }} more scans are waiting)</template></p>
        <button v-for="(c, idx) in prompt.candidates" :key="c.bfdbPackageURL" :class="['wf-candidate', {'wf-candidate-recommended': c.recommended}]" @click="pickCandidate(c)">
          <span v-if="idx < 9" class="wf-candidate-key">{{ idx + 1 }}</span>
          <span class="wf-candidate-label">
            <span v-if="/\/in012/.test(c.bfdbURL)" class="wf-candidate-source">[Marva] </span>
            <span v-else-if="/\/in[0-9]/.test(c.bfdbURL)" class="wf-candidate-source">[FOLIO] </span>
            {{ c.label }}
            <!-- what was learned by looking inside the record -->
            <span class="wf-candidate-notes">
              <span v-if="c.format && c.format != 'unknown'" :class="['wf-candidate-format', 'wf-candidate-format-' + c.format]">{{ c.format == 'ebook' ? 'eBook' : 'Print' }}</span>
              <span v-if="c.inspection && c.inspection.carrier" class="wf-candidate-note">{{ c.inspection.carrier }}</span>
              <span v-if="c.inspection && c.inspection.lastModified" class="wf-candidate-note" :title="'Last modified ' + c.inspection.lastModified"><span class="material-icons">history</span>{{ c.inspection.lastModified.slice(0, 10) }}</span>
              <span v-if="c.inspection && c.inspection.size" class="wf-candidate-note" title="How much the record describes, the number of statements about the instance and its work"><span class="material-icons">density_medium</span>{{ c.inspection.size }} statements</span>
              <span v-if="c.scannedStatus == 'canceled'" class="wf-candidate-note wf-candidate-warn">{{ prompt.scanned }} is marked canceled in this record</span>
              <span v-else-if="c.scannedStatus == 'absent'" class="wf-candidate-note">{{ prompt.scanned }} is not an identifier of this record</span>
              <span v-if="c.recommended" class="wf-candidate-note wf-candidate-likely"><span class="material-icons">star</span>likely the one scanned<template v-if="prompt.reason">: {{ prompt.reason }}</template></span>
            </span>
          </span>
          <a :href="c.bfdbURL" target="_blank" @click.stop>BFDB</a>
        </button>
        <div class="wf-dialog-buttons wf-dialog-buttons-split">
          <!-- only when the records are different formats, otherwise there is nothing to remember -->
          <label v-if="promptFormats.length > 1" class="wf-always-pick" title="Whenever a scan matches several records of different formats, take the one with the same format as the record you pick now">
            <input type="checkbox" v-model="alwaysPick" /> Always select this version from now on (this workflow)
          </label>
          <span v-else></span>
          <button @click="workflowStore.answerPrompt(null)">Skip this scan</button>
        </div>
      </div>
    </div>

    <!-- renaming the sheet -->
    <WorkflowNameDialog v-if="renaming && session" title="Rename sheet" :initial="session.name" ok-label="Rename" @ok="rename" @cancel="renaming = false" />

    <!-- a post failed -->
    <div v-if="workflowStore.postError" class="wf-dialog-overlay">
      <div class="wf-dialog">
        <h2>There was an error posting. Please report error.</h2>
        <p>{{ workflowStore.postError.label }}</p>
        <pre>{{ cleanUpErrorResponse(workflowStore.postError.msg) }}</pre>
        <div class="wf-dialog-buttons">
          <button @click="copyPostError()">Copy error to clipboard</button>
          <button class="wf-button-primary" @click="workflowStore.postError = null">Close</button>
        </div>
      </div>
    </div>

    <!-- the modals the editor's field components expect the edit screen to provide -->
    <template v-if="showDebugModal == true">
      <Debug v-model="showDebugModal" />
    </template>
    <template v-if="session && literalLangShow !== false">
      <LiteralLang v-model="literalLangShow" />
    </template>

  </div>
</template>

<script>
import { mapStores, mapState, mapWritableState } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'
import { useConfigStore } from '@/stores/config'

import { workflowTheme, applyWorkflowTheme, removeWorkflowTheme } from '@/lib/workflows/theme'
import { columnHint } from '@/lib/workflows/fields'

import WorkflowGrid from "@/components/workflows/WorkflowGrid.vue";
import WorkflowPages from "@/components/workflows/WorkflowPages.vue";
import WorkflowNameDialog from "@/components/workflows/WorkflowNameDialog.vue";
import Debug from "@/components/panels/edit/modals/DebugModal.vue";
import LiteralLang from "@/components/panels/edit/modals/LiteralLang.vue";

import { SCANNER_MAX_KEY_GAP, SCANNER_MIN_LENGTH, SCANNER_END_WAIT, isScannerCharacter } from '@/lib/workflows/scanner'

import '@/assets/workflows.css'

export default {
  name: "WorkflowSession",
  components: { WorkflowGrid, WorkflowPages, WorkflowNameDialog, Debug, LiteralLang },
  data(){
    return {
      scanValue: '',
      // the rename dialog is up
      renaming: false,
      notFound: false,
      opened: false,
      // the error messages that have already had their moment in the middle of the page
      announced: [],
      zoom: 1,
      // what is typed in the Fields menu to narrow down the fields that can be added
      fieldFilter: '',
      // the groups in the Fields menu that have their subfield list open
      expandedGroups: [],
      // drag reordering in the Fields menu: the handle that was pressed, the row being dragged, where it would land
      dragArmed: null,
      dragging: null,
      dropTarget: null,
      dropAfter: false,
      // the "always select this version" box in the which-record dialog
      alwaysPick: false,
    }
  },
  computed: {
    ...mapStores(useWorkflowStore, useProfileStore, usePreferenceStore, useConfigStore),
    ...mapState(useProfileStore, ['profilesLoaded']),
    ...mapWritableState(useProfileStore, ['literalLangShow']),
    ...mapWritableState(usePreferenceStore, ['showDebugModal']),

    // the colors, from the editor's preferences, see lib/workflows/theme.js. Watched below and put on the document
    theme(){
      return workflowTheme(this.preferenceStore)
    },

    session(){
      return this.workflowStore.activeSession
    },

    prompt(){
      return this.workflowStore.prompts[0] || null
    },

    // the different (known) formats among the records of the open which-record dialog
    promptFormats(){
      if (!this.prompt){ return [] }
      return [...new Set(this.prompt.candidates.map((c) => { return c.format }).filter((f) => { return f && f !== 'unknown' }))]
    },

    // the format this workflow always takes, if the user chose one
    autoFormat(){
      return this.session ? this.workflowStore.returnAutoFormat(this.session.workflowId) : null
    },

    // 'sheet' (the spreadsheet) or 'pages' (one record at a time), chosen in Options
    layout(){
      return this.session ? this.workflowStore.returnLayout(this.session.workflowId) : 'sheet'
    },

    doneCount(){
      return this.session.rows.filter((r) => { return r.done }).length
    },

    hiddenCount(){
      return this.workflowStore.columnGroups.filter((g) => { return g.hidden }).length
    },

    zoomPercent(){
      return Math.round(this.zoom * 100)
    },

    /**
    * The fields that can be added to the sheet, narrowed down by what is typed in the filter box
    */
    addableFiltered(){
      let filter = this.fieldFilter.trim().toLowerCase()
      return this.workflowStore.addableComponents.filter((c) => {
        return !filter || c.label.toLowerCase().includes(filter) || c.rt.toLowerCase().includes(filter)
      })
    },

    addableRts(){
      let rts = []
      for (let c of this.addableFiltered){
        if (!rts.includes(c.rt)){ rts.push(c.rt) }
      }
      return rts
    },
  },
  watch: {
    // the user changed their colors in the preferences while the sheet is open
    theme(){ applyWorkflowTheme(this.preferenceStore) },
    // picking field colours goes through preferenceStore.setValue, which calls the profile store's dataChanged:
    // that is not an edit of the record
    'preferenceStore.showFieldColorsModal'(open){ this.workflowStore.ignoreChanges = open },
    prompt(){ this.alwaysPick = false },
    // the profiles are loaded by App.vue, the session can't be opened until they are there
    profilesLoaded: { immediate: true, handler(){ this.open() } },
    'workflowStore.enabled': function(){ this.open() },
    '$route.params.sessionId': function(){
      this.opened = false
      this.open()
    },
    // deep, messages are pushed onto the list
    'workflowStore.messages': {
      deep: true,
      handler(messages){
        for (let m of messages){
          if (m.type == 'error' && !this.announced.includes(m.id)){
            this.announced.push(m.id)
            this.$nextTick(() => { this.announceMessage(m.id) })
          }
        }
      },
    },
    prompt(newVal){
      if (newVal){
        this.$nextTick(() => {
          let first = this.$refs.promptDialog && this.$refs.promptDialog.querySelector('.wf-candidate')
          if (first){ first.focus() }
        })
      } else if (!this.workflowStore.selectedCell){
        this.focusScan()
      }
    },
  },
  methods: {

    /**
    * The sheet was given another name in the rename dialog
    */
    async rename(name){
      this.renaming = false
      let session = this.workflowStore.activeSession
      if (!session){ return }
      await this.workflowStore.renameSession(session.id, name)
      document.title = 'Marva | ' + session.name
      this.focusScan()
    },

    /**
    * Switch between the spreadsheet and one record per page, remembered for this workflow
    * @param {string} layout - 'sheet' | 'pages'
    */
    /**
    * The editor's Field Colors modal. It lists the components of the profile store's activeProfile,
    * so a record of the sheet is made active first (or the workflow's profile when there is none yet)
    */
    async openFieldColors(){
      if (!this.session){ return }
      let ready = this.session.rows.filter((r) => { return r.status == 'ready' })[0]
      if (ready){
        if (!(await this.workflowStore.activateRow(ready.id))){ return }
      } else if (this.profileStore.profiles[this.session.definition.profileId]){
        this.profileStore.activeProfile = JSON.parse(JSON.stringify(this.profileStore.profiles[this.session.definition.profileId]))
      } else {
        this.workflowStore.notify('Scan a record first, the colours are picked from its fields', 'info')
        return
      }
      this.preferenceStore.showFieldColorsModal = true
    },

    setLayout(layout){
      if (!this.session || layout === this.layout){ return }
      this.workflowStore.stopEditing()
      // a selected column is a sheet thing
      this.workflowStore.selectedColumn = null
      this.workflowStore.setLayout(this.session.workflowId, layout)
      this.zoom = 1
    },

    /**
    * Enter in the Fields menu's filter box adds the one field that matches it
    * @return {void}
    */
    addFirstMatch(){
      if (this.addableFiltered.length == 1){
        this.workflowStore.addComponent(this.addableFiltered[0])
        this.fieldFilter = ''
      }
    },

    columnHint: columnHint,

    dragStart(event, groupKey){
      if (this.dragArmed !== groupKey){ event.preventDefault(); return }
      this.dragging = groupKey
      event.dataTransfer.effectAllowed = 'move'
      // firefox needs some data for a drag to start
      event.dataTransfer.setData('text/plain', groupKey)
    },

    dragOver(event, groupKey){
      if (!this.dragging || groupKey === this.dragging){ this.dropTarget = null; return }
      event.dataTransfer.dropEffect = 'move'
      let box = event.currentTarget.getBoundingClientRect()
      this.dropTarget = groupKey
      this.dropAfter = (event.clientY - box.top) > box.height / 2
    },

    drop(groupKey){
      if (!this.dragging || groupKey === this.dragging){ this.dragEnd(); return }
      let groups = this.workflowStore.columnGroups
      let idx = groups.findIndex((g) => { return g.key === groupKey })
      let beforeKey = this.dropAfter ? ((groups[idx + 1]) ? groups[idx + 1].key : null) : groupKey
      this.workflowStore.moveComponent(this.dragging, beforeKey)
      this.dragEnd()
    },

    dragEnd(){
      this.dragging = null
      this.dragArmed = null
      this.dropTarget = null
    },

    toggleExpanded(groupKey){
      if (this.expandedGroups.includes(groupKey)){
        this.expandedGroups = this.expandedGroups.filter((k) => { return k !== groupKey })
      } else {
        this.expandedGroups.push(groupKey)
      }
    },

    async open(){
      if (this.opened || !this.profilesLoaded || !this.workflowStore.enabled){ return }
      this.opened = true
      this.notFound = false
      await this.workflowStore.init()
      let found = await this.workflowStore.openSession(this.$route.params.sessionId)
      this.notFound = !found
      if (found){
        document.title = 'Marva | ' + this.workflowStore.activeSession.name
        // an empty sheet starts in the scan box, one with records starts on the first cell (set as the record loads)
        if (this.workflowStore.activeSession.rows.length == 0){
          this.$nextTick(() => { this.focusScan() })
        }
      }
    },

    /**
    * Show a message blown up in the middle of the page for a second, then let it shrink
    * back to where it sits in the corner. The message never leaves its spot in the list,
    * it is only moved with a transform so it can slide back to it.
    */
    announceMessage(id){
      let el = this.$el.querySelector('[data-message-id="' + id + '"]')
      if (!el){ return }
      let rect = el.getBoundingClientRect()
      let scale = 1.8
      let dx = (window.innerWidth / 2) - (rect.left + rect.width / 2)
      let dy = (window.innerHeight * 0.4) - (rect.top + rect.height / 2)
      el.style.transition = 'none'
      el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')'
      window.setTimeout(() => {
        el.style.transition = 'transform 0.45s ease-in-out'
        el.style.transform = ''
      }, 1000)
    },

    focusScan(){
      if (this.$refs.scanInput){ this.$refs.scanInput.focus() }
    },

    scan(){
      // read it off the box itself, a scanner can press enter before the typed value has made it into scanValue
      let value = (this.$refs.scanInput) ? this.$refs.scanInput.value : this.scanValue
      this.scanValue = ''
      if (this.$refs.scanInput){ this.$refs.scanInput.value = '' }
      this.workflowStore.scan(value)
    },

    /**
    * A click on the sheet that is not on a cell closes the cell being edited
    */
    gridClick(event){
      if (this.$refs.grid.wasPanning){ return }
      // opening a cell swaps out what was in it, so the thing that was clicked can be gone from the page by now
      if (!event.target.isConnected){ return }
      if (event.target.closest && event.target.closest('.wf-cell')){ return }
      this.workflowStore.stopEditing()
    },

    /**
    * Barcode scanners type the value and press enter, send that to the
    * scan box when nothing else has the focus so the user doesn't have to click into it first
    */
    globalKeydown(event){
      if (!this.session || this.prompt){ return }
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1){ return }
      let el = document.activeElement
      if (el && el !== document.body && el.closest && el.closest('input, textarea, select, [contenteditable], .vfm, .v-popper__popper')){ return }
      if (this.workflowStore.editingCell || this.workflowStore.selectedCell){ return }
      this.focusScan()
    },

    /**
    * A barcode scanner is a keyboard that types very fast, and usually presses enter at the end. Watch all
    * of the typing on the page for that: a run of characters that came in faster than anyone can type is
    * taken as a scan no matter what has the focus, so the user does not have to be in the scan box. The
    * scan is finished by the enter, or, for scanners that don't send one, by the typing going quiet.
    */
    scannerKeydown(event){
      if (!this.session){ return }
      let now = performance.now()
      let fast = (now - this.scanner.last) <= SCANNER_MAX_KEY_GAP

      if (event.key === 'Enter'){
        window.clearTimeout(this.scanner.timer)
        let value = this.scanner.buffer
        this.scanner.buffer = ''
        if (fast && value.length >= SCANNER_MIN_LENGTH){
          // keep the enter away from whatever field the scanner was typing into
          event.preventDefault()
          event.stopImmediatePropagation()
          this.scanned(event.target, value)
        }
        return
      }

      if (isScannerCharacter(event)){
        // a pause means whatever came before was not part of this scan
        if (!fast){ this.scanner.buffer = '' }
        this.scanner.buffer += event.key
        this.scanner.last = now
        this.scanner.target = event.target
        // no enter and no more keys after this one means the scan is over
        window.clearTimeout(this.scanner.timer)
        this.scanner.timer = window.setTimeout(this.scannerQuiet, SCANNER_END_WAIT)
      } else if (event.key !== 'Shift'){
        window.clearTimeout(this.scanner.timer)
        this.scanner.buffer = ''
      }
    },

    /**
    * The fast typing stopped without an enter, if enough came in it was a scan
    */
    scannerQuiet(){
      let value = this.scanner.buffer
      this.scanner.buffer = ''
      if (value.length >= SCANNER_MIN_LENGTH){
        this.scanned(this.scanner.target, value)
      }
    },

    /**
    * A scan came in while the element had the focus
    * @param {Element} target - what the scanner typed into
    * @param {string} value - what it typed
    */
    scanned(target, value){
      if (target === this.$refs.scanInput){
        // it was scanned into the scan box, send whatever is in the box
        this.scan()
      } else {
        this.removeScannedText(target, value)
        this.workflowStore.scan(value)
      }
    },

    /**
    * By the time we know it was a scan the characters are already typed into the field that
    * had the focus, take them back out of it
    */
    removeScannedText(el, value){
      if (!el || (el.tagName != 'INPUT' && el.tagName != 'TEXTAREA') || typeof el.selectionStart !== 'number'){ return }
      let caret = el.selectionStart
      let before = el.value.slice(0, caret)
      // a field can move the focus on the first character (the lookups open their search
      // modal), so this field may only have the end of what was scanned
      for (let length = value.length; length > 0; length--){
        let piece = value.slice(value.length - length)
        if (before.endsWith(piece)){
          el.value = before.slice(0, before.length - length) + el.value.slice(caret)
          el.selectionStart = el.selectionEnd = caret - length
          // let the field's component know its value changed
          el.dispatchEvent(new Event('input', { bubbles: true }))
          return
        }
      }
    },

    /**
    * The user picked a record in the which-record dialog
    */
    pickCandidate(candidate){
      this.workflowStore.answerPrompt(candidate, this.alwaysPick)
      this.alwaysPick = false
    },

    promptKey(event){
      if (event.key == 'Escape'){
        this.workflowStore.answerPrompt(null)
        return
      }
      let number = parseInt(event.key, 10)
      if (!isNaN(number) && number > 0 && this.prompt.candidates[number - 1]){
        event.preventDefault()
        this.pickCandidate(this.prompt.candidates[number - 1])
      }
    },

    cleanUpErrorResponse(msg){
      msg = (typeof msg === 'string') ? msg : JSON.stringify(msg, null, 2)
      return msg.replace(/\\n|\\t/g, '').replace(/\\"/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    },

    copyPostError(){
      navigator.clipboard.writeText(this.cleanUpErrorResponse(this.workflowStore.postError.msg))
    },

    beforeUnload(event){
      let dirty = this.session && this.session.rows.some((r) => { return r.dirty })
      if (dirty && !this.profileStore.isTestEnv()){
        event.preventDefault()
        event.returnValue = ''
      }
    },
  },
  mounted(){
    applyWorkflowTheme(this.preferenceStore)
    // not reactive, it is only bookkeeping for the scanner detection
    this.scanner = { buffer: '', last: 0, target: null, timer: null }
    // on the capture phase so a scan is seen (and its enter stopped) before the field with the focus gets it
    window.addEventListener('keydown', this.scannerKeydown, true)
    window.addEventListener('keydown', this.globalKeydown)
    window.addEventListener('beforeunload', this.beforeUnload)
  },
  beforeUnmount(){
    window.clearTimeout(this.scanner.timer)
    window.removeEventListener('keydown', this.scannerKeydown, true)
    window.removeEventListener('keydown', this.globalKeydown)
    window.removeEventListener('beforeunload', this.beforeUnload)
    this.workflowStore.closeSession()
    removeWorkflowTheme()
  },
}
</script>
