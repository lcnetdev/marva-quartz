<template>
  <td :class="cellClass" :style="cellStyle" :data-line="line" :data-col="colIndex" :title="cellTitle" @click="click" @contextmenu.prevent="contextMenu" @wf-clear="clearValue" @wf-copy="copy" @wf-paste="paste($event.detail)" ref="cell">

    <!-- a line WorldCat has and the record doesn't: shown faintly, the first cell offers to add the whole component -->
    <template v-if="ghost">
      <div v-if="firstInGroup" class="wf-ghost-actions">
        <button class="wf-suggest-accept" :disabled="!!workflowStore.busy" title="Add this to the record from WorldCat" @click.stop="acceptGhost()"><span class="material-icons">add_task</span>Add</button>
        <button class="wf-suggest-dismiss" title="Not this one" @click.stop="dismiss(ghost.key)"><span class="material-icons">close</span></button>
      </div>
      <template v-if="cell">
        <div v-if="cell.kind == 'type'" class="wf-value wf-ghost-value">{{ cell.active.resourceLabel }}</div>
        <div v-else v-for="(v, idx) in (ghost.values[column.key] || [])" :key="idx" class="wf-value wf-ghost-value" :title="v.label">
          <span class="wf-value-text"><LabelDereference v-if="needsLabel(v)" :URI="v.uri" /><template v-else>{{ v.label }}</template></span>
        </div>
      </template>
    </template>

    <!-- the record has nothing here and WorldCat has a whole line: offered in one go -->
    <template v-else-if="wholeLine && cell">
      <div v-if="firstInGroup" class="wf-ghost-actions">
        <button class="wf-suggest-accept" :disabled="!!workflowStore.busy" title="Fill this in from WorldCat" @click.stop="acceptWholeLine()"><span class="material-icons">add_task</span>Add</button>
        <button class="wf-suggest-dismiss" title="Leave it empty" @click.stop="dismiss(lineSuggestion.key)"><span class="material-icons">close</span></button>
      </div>
      <div v-if="cell.kind == 'type'" class="wf-value wf-ghost-value">{{ (lineSuggestion.values[column.key] || [{label: ''}])[0].label }}</div>
      <div v-else v-for="(v, idx) in (lineSuggestion.values[column.key] || [])" :key="idx" class="wf-value wf-ghost-value" :title="v.label">
        <span class="wf-value-text"><LabelDereference v-if="needsLabel(v)" :URI="v.uri" /><template v-else>{{ v.label }}</template></span>
      </div>
    </template>


    <!-- no component on this line of the record, or the field isn't part of the template the component is using -->
    <template v-else-if="!pt || !cell"></template>

    <!-- which template the component is using: Person / Corporate, LCC / DDC, etc -->
    <template v-else-if="cell.kind == 'type'">
      <select v-if="cell.editable" class="wf-type-select" :class="{'wf-type-unset': !cell.matched}" @change="changeType($event)" :disabled="!!workflowStore.busy">
        <option v-for="o in cell.options" :key="o.id" :value="o.id" :selected="o.id === cell.active.id">{{ o.label }}</option>
      </select>
      <span v-else :class="{'wf-type-unset': !cell.matched}">{{ cell.active.resourceLabel }}</span>
    </template>

    <!-- the field being edited, these are the same components the full editor uses -->
    <template v-else-if="isEditing">
      <div class="wf-editor" @keydown.esc.stop="workflowStore.stopEditing()">
        <component
          :is="editorComponent"
          ref="editor"
          :propertyPath="cell.propertyPath"
          :level="cell.level"
          :structure="cell.structure"
          :guid="cell.guid"
          :readOnly="false"
        />
      </div>
    </template>

    <template v-else>
      <!-- only the first line of a value is shown so the rows stay short, the whole value shows when the cell is opened -->
      <div v-for="(v, idx) in values" :key="idx" class="wf-value" :title="v.label + (v.validation ? ' (' + v.validation.title + ')' : '')">
        <!-- a value with a URI but no label (a note type) gets its label looked up, as the full editor does -->
        <span class="wf-value-text"><LabelDereference v-if="needsLabel(v)" :URI="v.uri" /><template v-else>{{ v.label }}</template></span><span v-if="v.lang" class="wf-value-lang">{{ v.lang }}</span>
        <!-- the editor's link status icon: linked, all/first/no subdivisions linked, not linked -->
        <span v-if="v.validation" :class="['material-icons', 'wf-value-status', 'wf-value-status-' + v.validation.icon]" :title="v.validation.title">{{ v.validation.icon }}</span>
        <span v-else-if="v.uri" class="material-icons wf-value-status wf-value-status-controlled" title="Controlled Term">check_circle_outline</span>
      </div>
      <!-- what WorldCat has for this cell, when it is not what the record has: a click takes it -->
      <div v-if="suggestion && suggestion.status != 'match'" :class="['wf-suggest', 'wf-suggest-' + suggestion.status, {'wf-suggest-check': suggestion.check}]" :title="suggestionTitle">
        <span class="material-icons wf-suggest-icon">{{ suggestionIcon }}</span>
        <span class="wf-suggest-values">
          <template v-if="suggestion.status == 'warn' || suggestion.status == 'remove'">{{ suggestion.note }}</template>
          <template v-else><template v-for="(v, idx) in suggestion.values" :key="idx"><template v-if="idx > 0"> ; </template><LabelDereference v-if="needsLabel(v)" :URI="v.uri" /><template v-else>{{ v.label }}</template></template></template>
        </span>
        <button v-if="suggestion.status != 'warn'" class="wf-suggest-accept" :disabled="!!workflowStore.busy" :title="acceptTitle" @click.stop="acceptSuggestion()"><span class="material-icons">{{ suggestion.status == 'remove' ? 'delete' : 'check' }}</span></button>
        <button class="wf-suggest-dismiss" :title="suggestion.status == 'warn' ? 'Noted' : 'Keep what the record has'" @click.stop="dismiss(suggestion.key)"><span class="material-icons">close</span></button>
      </div>
    </template>

  </td>
</template>

<script>
import { mapStores, mapState } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'

import { readCellValues } from '@/lib/workflows/fields'

import Literal from "@/components/panels/edit/fields/Literal.vue";
import LookupSimple from "@/components/panels/edit/fields/LookupSimple.vue";
import LookupComplex from "@/components/panels/edit/fields/LookupComplex.vue";
import RdfTypeSelector from "@/components/panels/edit/fields/RdfTypeSelector.vue";
import LabelDereference from "@/components/panels/edit/fields/helpers/LabelDereference.vue";

export default {
  name: "WorkflowCell",
  components: { Literal, LookupSimple, LookupComplex, RdfTypeSelector, LabelDereference },
  // the grid tells us if the mouse up was the end of dragging the sheet around and not a click
  inject: ['wfGridWasPanning'],
  props: {
    row: Object,
    // the component of the record this cell belongs to, null if the record has nothing on this line
    pt: Object,
    // the resolved cell from resolveComponentCells, null if the column does not apply
    cell: Object,
    // all the cells of the component on this line, to say which template it is using when this column is not part of it
    lineCells: Object,
    column: Object,
    firstInGroup: Boolean,
    // where the cell is in the sheet, for the selection and keyboard movement
    line: Number,
    colIndex: Number,
    // the column group this cell is in
    group: Object,
    // the WorldCat comparison for this line of the component: {pt, cells: {colKey: {status, values, key}}, wholeLine, key, values}, or null
    lineSuggestion: Object,
    // set when this is a ghost line: {pt, cells, values, key}
    ghost: Object,
  },
  computed: {
    ...mapStores(useWorkflowStore, useProfileStore, usePreferenceStore),
    ...mapState(useProfileStore, ['rtLookup']),

    /**
    * The tooltip of the cell: why a grey cell can't be used, or that a value matches WorldCat
    * @return {string|null}
    */
    cellTitle(){
      if (this.suggestion && this.suggestion.status == 'match'){ return this.suggestion.note || 'Matches WorldCat' }
      // the column is a field of another template of this component (Other title information on a Work title)
      if (!this.ghost && this.pt && !this.cell && this.lineCells){
        let typeCell = Object.values(this.lineCells).filter((c) => { return c.kind == 'type' && c.depth == 0 })[0]
        let label = typeCell ? typeCell.active.resourceLabel : null
        return label ? ('"' + this.column.label + '" is not a field of "' + label + '", change the Type to use it') : ('"' + this.column.label + '" is not a field of the template this component is using')
      }
      return null
    },

    isEditing(){
      let e = this.workflowStore.editingCell
      if (!e || !this.cell || !this.pt){ return false }
      // the row has to be the profile store's active record for the field components to work
      return e.rowId === this.row.id && e.guid === this.cell.guid && e.key === this.column.key && this.workflowStore.activeRowId === this.row.id
    },

    editorComponent(){
      return { LITERAL: 'Literal', SIMPLE: 'LookupSimple', COMPLEX: 'LookupComplex', RDFTYPE: 'RdfTypeSelector' }[this.cell.fieldType]
    },

    values(){
      return readCellValues(this.pt, this.cell)
    },

    isSelected(){
      return this.workflowStore.isSelected(this.row.id, this.line, this.colIndex)
    },

    cellClass(){
      return {
        'wf-cell': true,
        'wf-cell-group-start': this.firstInGroup,
        'wf-cell-na': !this.ghost && (!this.pt || !this.cell),
        'wf-cell-ghost': !!this.ghost,
        'wf-cell-type': this.cell && this.cell.kind == 'type',
        'wf-cell-editing': this.isEditing,
        'wf-cell-selected': this.isSelected && !this.isEditing,
        'wf-cell-verified': !this.ghost && this.suggestion && this.suggestion.status == 'match',
        'wf-cell-suggested': !this.ghost && this.suggestion && this.suggestion.status != 'match',
        'wf-cell-wholeline': this.wholeLine && !this.isEditing,
        'wf-cell-colored': !!this.fieldColor,
        'wf-cell-copying': this.isCopying,
        'wf-cell-in-column': this.workflowStore.isColumnSelected(this.group.key, this.column.key),
      }
    },

    /**
    * The colour the user gave this field in the editor's Field Colors (the --o-edit-general-field-colors
    * preference, keyed by the component's preferenceId): the same decision as the editor's Main.returnBackgroundColor
    * @return {string|null}
    */
    fieldColor(){
      if (!this.pt || !this.cell || this.ghost){ return null }
      let colors = this.preferenceStore.returnValue('--o-edit-general-field-colors')
      if (!colors || typeof colors !== 'object'){ return null }
      if (this.pt.mandatory == 'true' && colors.req && colors.req.req){ return colors.req.req }
      let mine = colors[this.pt.preferenceId]
      if (!mine){ return null }
      if (this.pt.userModified && mine.edited){ return mine.edited }
      return mine.default || null
    },

    cellStyle(){
      return this.fieldColor ? { '--wf-cell-color': this.fieldColor } : null
    },

    // this cell was copied (ctrl+c) and is shown with the moving outline until escape
    isCopying(){
      let c = this.workflowStore.copying
      return !!c && !!this.cell && !!this.pt && c.rowId === this.row.id && c.guid === this.cell.guid && c.key === this.column.key
    },

    // the template (Type) the component on this line uses, if it has a choice
    templateId(){
      if (!this.lineCells){ return null }
      let typeCell = Object.values(this.lineCells).filter((c) => { return c.kind == 'type' && c.depth == 0 })[0]
      return typeCell ? typeCell.active.id : null
    },

    // the comparison for this cell alone, not when the whole line is offered as one
    suggestion(){
      if (!this.lineSuggestion || this.lineSuggestion.wholeLine){ return null }
      return this.lineSuggestion.cells[this.column.key] || null
    },

    suggestedPt(){
      return this.lineSuggestion ? this.lineSuggestion.pt : null
    },

    // the record has nothing on this line and WorldCat does: offered as one thing, like a ghost line
    wholeLine(){
      return !!(this.lineSuggestion && this.lineSuggestion.wholeLine)
    },

    suggestionIcon(){
      let s = this.suggestion
      if (s.check == 'year'){ return 'event' }
      if (s.status == 'warn'){ return 'report_problem' }
      if (s.status == 'remove'){ return 'delete_outline' }
      if (s.check){ return 'checklist' }
      return (s.status == 'add') ? 'add_circle_outline' : 'swap_horiz'
    },

    acceptTitle(){
      let s = this.suggestion
      if (s.status == 'remove'){ return 'Delete it, as the checklist says' }
      if (s.check){ return 'Set it to what the checklist expects' }
      return (s.status == 'add') ? 'Add this from WorldCat' : 'Replace with WorldCat\'s value'
    },

    suggestionTitle(){
      if (!this.suggestion){ return '' }
      if (this.suggestion.note){ return this.suggestion.note }
      let what = this.suggestion.values.map((v) => { return v.label }).join('; ')
      return (this.suggestion.status == 'add' ? 'WorldCat has: ' : 'WorldCat has instead: ') + what
    },
  },
  watch: {
    isEditing(newVal){
      if (newVal){
        this.$nextTick(() => { this.focusEditor() })
      }
    }
  },
  methods: {

    focusEditor(){
      if (!this.$refs.cell){ return null }
      let input = this.$refs.cell.querySelector('.wf-editor textarea, .wf-editor input[type="text"], .wf-editor input:not([type]), .wf-editor select, .wf-editor input')
      if (input){ input.focus() }
      return input
    },

    /**
    * Delete / backspace on the selected cell: take out whatever is in the field
    */
    /**
    * Ctrl+c: the cell's text onto the clipboard, what it holds kept for a paste (see workflowStore.copyCell)
    */
    copy(){
      if (this.ghost || !this.pt || !this.cell || this.cell.kind != 'field' || this.isEditing){ return }
      let values = this.values
      if (values.length == 0){ return }
      let text = values.map((v) => { return v.label }).join('; ')
      this.workflowStore.copyCell(this.row.id, this.pt, this.cell, this.column, text, this.templateId)
    },

    /**
    * Ctrl+v with a copied cell: into this cell, or onto a grey line below the component as a new one
    * @param {object} payload - the kept copy
    */
    paste(payload){
      if (this.ghost || this.isEditing || !payload){ return }
      if (this.cell && this.cell.kind == 'type'){
        this.workflowStore.notify('The Type is chosen from its list, not pasted', 'info')
        return
      }
      this.workflowStore.pasteIntoCell(this.row.id, this.pt, this.cell, this.group, this.column, payload)
    },

    async clearValue(){
      if (!this.pt || !this.cell || this.cell.kind != 'field' || this.isEditing){ return }
      let values = this.values
      if (values.length == 0){ return }
      if (!(await this.workflowStore.activateRow(this.row.id))){ return }
      let store = this.profileStore
      try {
        if (this.cell.fieldType == 'RDFTYPE'){
          store.setValueRdfTypePicklist(this.cell.guid, [])
          return
        }
        for (let v of values){
          if (!v.guid){ continue }
          if (this.cell.fieldType == 'LITERAL'){
            // an empty value is how the editor removes a literal
            await store.setValueLiteral(this.cell.guid, v.guid, this.cell.propertyPath, '', v.lang)
          } else if (this.cell.fieldType == 'SIMPLE'){
            await store.removeValueSimple(this.cell.guid, v.guid)
          } else if (this.cell.fieldType == 'COMPLEX'){
            await store.removeValueComplex(this.cell.guid, v.guid)
          }
        }
      } catch (e) {
        console.error('Workflows: could not clear the cell', e)
      }
    },

    /**
    * @param {boolean} openModal - for a complex lookup that has a value, go straight into its search modal
    */
    async startEditing(openModal = false){
      if (!this.pt || !this.cell || this.cell.kind != 'field'){ return false }
      if (this.isEditing){ return true }
      let opened = await this.workflowStore.editCell(this.row.id, this.cell.guid, this.column.key)
      if (opened && openModal && this.cell.fieldType == 'COMPLEX' && this.values.length > 0){
        await this.$nextTick()
        this.openLookupModal()
      }
      return opened
    },

    /**
    * Open the search modal (name search, subject editor...) of a complex lookup that has a value,
    * the same one the field opens in the full editor when the value is clicked
    */
    openLookupModal(){
      let field = this.$refs.editor
      if (!field || !this.isEditing){ return }
      try {
        // a value that can't be edited has no link to click so there is nothing to open for it
        if (field.complexLookupValues && field.complexLookupValues.length > 0 && field.$refs.el && field.$refs.el[0]){
          field.openAuthority()
        }
      } catch (e) {
        console.warn('Workflows: could not open the lookup modal', e)
      }
    },

    /**
    * The first click selects the cell, a click on the selected cell opens it
    */
    /**
    * A value that has a URI but no label of its own (a note type) has its label looked up
    */
    needsLabel(v){
      return !!(v.uri && (!v.label || v.label === v.uri))
    },

    /**
    * After a click on one of the suggestion buttons the keyboard goes to this cell, not the button
    */
    keyboardHere(){
      if (document.activeElement && document.activeElement.blur){ document.activeElement.blur() }
      this.workflowStore.selectCell(this.row.id, this.line, this.colIndex)
    },

    dismiss(key){
      this.workflowStore.dismissSuggestion(this.row.id, key)
      this.keyboardHere()
    },

    async acceptSuggestion(){
      if (!this.suggestion || !this.pt || !this.cell){ return }
      this.keyboardHere()
      if (this.suggestion.status == 'remove'){
        await this.clearValue()
        return
      }
      if (this.suggestion.simple){
        // a checklist expectation: a lookup value to set (replacing the one there, or beside the others)
        await this.workflowStore.setSuggestedSimple(this.row.id, this.pt['@guid'], this.cell, this.suggestion.simple, this.suggestion.replaceGuid || null, this.suggestion.siblingGuid || null)
        return
      }
      if (typeof this.suggestion.literal === 'string'){
        // a check with a corrected value (the call number year), set like typing it
        await this.workflowStore.setSuggestedLiteral(this.row.id, this.pt['@guid'], this.cell, this.suggestion.literal, this.suggestion.valueGuid)
        return
      }
      if (!this.suggestedPt){ return }
      await this.workflowStore.acceptSuggestedCell(this.row.id, this.pt['@guid'], this.suggestedPt, this.cell)
    },

    async acceptGhost(){
      if (!this.ghost || !this.group){ return }
      this.keyboardHere()
      await this.workflowStore.acceptSuggestedComponent(this.row.id, this.group.component, this.ghost.pt)
    },

    async acceptWholeLine(){
      if (!this.lineSuggestion || !this.group){ return }
      this.keyboardHere()
      // the record line is blank so acceptSuggestedComponent fills it rather than adding one
      await this.workflowStore.acceptSuggestedComponent(this.row.id, this.group.component, this.lineSuggestion.pt)
    },

    click(event){
      if (this.wfGridWasPanning() || this.isEditing){ return }
      if (this.ghost){
        // nothing to edit on a ghost line, but selecting it shows the offered values in full
        this.workflowStore.selectCell(this.row.id, this.line, this.colIndex)
        return
      }
      if (this.isSelected){
        // entering a populated complex lookup on purpose opens its search modal
        this.startEditing(true)
      } else {
        this.workflowStore.selectCell(this.row.id, this.line, this.colIndex)
      }
    },

    /**
    * The right mouse button opens the same action menu the action button does in the full editor
    */
    async contextMenu(){
      if (this.ghost){ return }
      this.workflowStore.selectCell(this.row.id, this.line, this.colIndex)
      if (!(await this.startEditing())){ return }
      // the field has to be focused before it will show its action button
      await this.$nextTick()
      this.focusEditor()
      let tries = 0
      let openMenu = () => {
        if (!this.$refs.cell || !this.isEditing){ return }
        let button = this.$refs.cell.querySelector('button.action-button')
        if (button){
          button.click()
        } else if (tries++ < 10){
          window.setTimeout(openMenu, 50)
        }
      }
      window.setTimeout(openMenu, 50)
    },

    async changeType(event){
      let nextRef = this.rtLookup[event.target.value]
      if (!nextRef){ return }
      if (!(await this.workflowStore.activateRow(this.row.id))){
        return
      }
      this.workflowStore.stopEditing()
      if (this.cell.depth > 0){
        // nested inside the component (an agent's Person/Corporate...), the editor has nothing for this
        await this.workflowStore.setNestedType(this.row.id, this.cell, nextRef)
        return
      }
      try {
        this.profileStore.changeRefTemplate(this.cell.guid, this.cell.propertyPath, JSON.parse(JSON.stringify(nextRef)), JSON.parse(JSON.stringify(this.cell.active)))
      } catch (e) {
        console.warn("Workflows: couldn't change the template", e)
      }
    },

  },
}
</script>
