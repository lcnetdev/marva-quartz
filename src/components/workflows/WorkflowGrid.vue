<template>
  <div
    ref="viewport"
    :class="['wf-viewport', {'wf-panning': panning}]"
    @mousedown="mouseDown"
    @wheel="wheel"
    @contextmenu.prevent
  >
    <div class="wf-canvas" :style="canvasStyle">
      <table class="wf-table" :style="{ width: tableWidth + 'px' }">
        <colgroup>
          <col :style="{ width: recordWidth + 'px' }" />
          <template v-for="group in visibleGroups" :key="group.key">
            <col v-for="column in group.columns" :key="group.key + column.key" :style="{ width: columnWidth(group, column) + 'px' }" />
          </template>
          <col :style="{ width: widths.actions + 'px' }" />
        </colgroup>

        <thead>
          <tr>
            <th rowspan="2" class="wf-head wf-head-record wf-stick-top wf-stick-left">
              Record
              <span class="wf-col-resize" title="Drag to resize, double click to reset" @mousedown.stop.prevent="startResize($event, RECORD_COLUMN, recordWidth)" @dblclick.stop="workflowStore.setColumnWidth(RECORD_COLUMN, null)"></span>
            </th>
            <th v-for="group in visibleGroups" :key="group.key" :colspan="group.columns.length" :class="['wf-head', 'wf-head-group', 'wf-stick-top', 'wf-head-' + group.component.rt.toLowerCase()]">
              <span class="wf-head-rt">{{ group.component.rt }}</span>
              <span class="wf-head-group-label">{{ group.component.label }}</span>
              <button class="wf-head-hide" title="Hide these fields" @click.stop="workflowStore.toggleComponent(group.key)"><span class="material-icons">visibility_off</span></button>
            </th>
            <th rowspan="2" class="wf-head wf-head-actions wf-stick-top">Actions</th>
          </tr>
          <tr>
            <template v-for="group in visibleGroups" :key="group.key">
              <th v-for="(column, colIdx) in group.columns" :key="group.key + column.key" :class="['wf-head', 'wf-head-field', 'wf-stick-top', {'wf-cell-group-start': colIdx == 0}]" :title="column.label + (columnHint(group.allColumns, column) ? ' (' + columnHint(group.allColumns, column) + ')' : '')">
                {{ column.label }}<span v-if="columnHint(group.allColumns, column)" class="wf-head-hint">{{ columnHint(group.allColumns, column) }}</span>
                <span class="wf-col-resize" title="Drag to resize, double click to reset" @mousedown.stop.prevent="startResize($event, widthKey(group, column), columnWidth(group, column))" @dblclick.stop="workflowStore.setColumnWidth(widthKey(group, column), null)"></span>
              </th>
            </template>
          </tr>
        </thead>

        <WorkflowRecord
          v-for="(row, idx) in rows"
          :key="row.id"
          :row="row"
          :index="idx"
          :visibleGroups="visibleGroups"
          :columnCount="columnCount"
        />
      </table>
    </div>

    <div v-if="rows.length == 0" class="wf-empty">
      <span class="material-icons">qr_code_scanner</span>
      <div>Scan a LCCN, ISBN or item barcode to add a record.</div>
    </div>

    <div v-if="workflowStore.busy" class="wf-busy">
      <div>{{ workflowStore.busy }}</div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'

import sheetKeyboard from "@/components/workflows/sheetKeyboard";
import WorkflowRecord from "@/components/workflows/WorkflowRecord.vue";
import { countRecordLines, columnHint } from '@/lib/workflows/fields'

const MIN_SCALE = 0.3
const MAX_SCALE = 2
const MIN_COLUMN_WIDTH = 50
// how many lines page up / page down move the selection
const PAGE_LINES = 10
// the key the width of the frozen record column is remembered under
const RECORD_COLUMN = '@record'

export default {
  name: "WorkflowGrid",
  // enter / typing / delete / escape on the selected cell, the moving around is navigationKey below
  mixins: [sheetKeyboard],
  components: { WorkflowRecord },
  emits: ['scale'],
  provide(){
    return {
      wfGridWasPanning: () => { return this.wasPanning },
    }
  },
  data(){
    return {
      // where the sheet is, like a map it gets dragged around and zoomed
      x: 0,
      y: 0,
      scale: 1,

      panning: false,
      // true for the click that comes right after dragging the sheet, so it doesn't open a cell
      wasPanning: false,
      dragStart: null,

      // the column edge being dragged {key, mouseX, width}
      resizing: null,
      RECORD_COLUMN: RECORD_COLUMN,

      widths: {
        record: 230,
        type: 150,
        field: 240,
        actions: 370,
      },
    }
  },
  computed: {
    ...mapStores(useWorkflowStore),

    rows(){
      return (this.workflowStore.activeSession) ? this.workflowStore.activeSession.rows : []
    },

    visibleGroups(){
      return this.workflowStore.columnGroups.filter((g) => { return !g.hidden && g.columns.length > 0 })
    },

    columnCount(){
      return this.visibleGroups.reduce((total, g) => { return total + g.columns.length }, 0)
    },

    recordWidth(){
      return this.workflowStore.columnWidths[RECORD_COLUMN] || this.widths.record
    },

    tableWidth(){
      let width = this.recordWidth + this.widths.actions
      for (let group of this.visibleGroups){
        for (let column of group.columns){
          width += this.columnWidth(group, column)
        }
      }
      return width
    },

    canvasStyle(){
      return {
        transform: `translate(${this.x}px, ${this.y}px) scale(${this.scale})`,
        // how far the frozen header row / record column have to be pushed back to stay in view
        '--wf-stick-x': (Math.max(0, -this.x) / this.scale) + 'px',
        '--wf-stick-y': (Math.max(0, -this.y) / this.scale) + 'px',
      }
    },
  },
  watch: {
    scale(newVal){
      this.$emit('scale', newVal)
    },
    // the store selects a cell when a record comes in, bring it into view like a keyboard move would.
    // Not when the grid's own select() made the change, that one pans itself (with an alignment)
    'workflowStore.selectedCell'(newVal){
      if (this.selectingHere){ this.selectingHere = false; return }
      if (newVal){ this.$nextTick(() => { this.scrollSelectedIntoView() }) }
    },
  },
  methods: {
    columnHint: columnHint,

    /**
    * A width is remembered for the kind of column (the component + the field in it) not for this
    * one sheet, so the same column is that wide in any workflow it is used in
    */
    widthKey(group, column){
      return group.component.id + '|' + column.key
    },

    // ------------------------------------------------------------ keyboard movement of the selected cell

    /**
    * Every line of the sheet that can be selected, in order
    * @return {array} - of {rowId, line}
    */
    selectableLines(){
      let lines = []
      let components = this.visibleGroups.map((g) => { return g.component })
      for (let row of this.rows){
        if (row.status != 'ready' || !row.profile){ continue }
        // the lines as drawn: the record's own, plus any WorldCat ghost lines under them
        let count = countRecordLines(row.profile, components)
        let tbody = this.$refs.viewport ? this.$refs.viewport.querySelector('tbody[data-row-id="' + row.id + '"]') : null
        if (tbody){ count = Math.max(count, tbody.querySelectorAll('tr').length) }
        for (let line = 0; line < count; line++){
          lines.push({ rowId: row.id, line: line })
        }
      }
      return lines
    },

    /**
    * The keys that move the selection around the sheet
    * @return {boolean} - was the key taken
    */
    navigationKey(event){
      let ws = this.workflowStore
      let lines = this.selectableLines()
      // nothing to move around on an empty sheet
      if (lines.length == 0){ return true }

      let sel = ws.selectedCell
      let index = sel ? lines.findIndex((l) => { return l.rowId === sel.rowId && l.line === sel.line }) : -1
      let col = sel ? sel.col : 0

      // nothing selected yet (or it went away), the arrow keys start at the top
      if (index == -1){
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)){
          event.preventDefault()
          this.select(lines[0], 0)
        }
        return true
      }

      let lastCol = this.columnCount - 1
      let withModifier = event.ctrlKey || event.metaKey

      switch (event.key){
        case 'ArrowUp':
          event.preventDefault()
          this.select(lines[Math.max(0, index - 1)], col)
          return true
        case 'ArrowDown':
          event.preventDefault()
          this.select(lines[Math.min(lines.length - 1, index + 1)], col)
          return true
        case 'ArrowLeft':
          event.preventDefault()
          this.select(lines[index], Math.max(0, col - 1))
          return true
        case 'ArrowRight':
          event.preventDefault()
          this.select(lines[index], Math.min(lastCol, col + 1))
          return true
        case 'Tab':
          event.preventDefault()
          if (event.shiftKey){
            if (col > 0){ this.select(lines[index], col - 1) }
            else if (index > 0){ this.select(lines[index - 1], lastCol) }
          } else {
            if (col < lastCol){ this.select(lines[index], col + 1) }
            else if (index < lines.length - 1){ this.select(lines[index + 1], 0) }
          }
          return true
        case 'PageUp':
          event.preventDefault()
          this.select(lines[Math.max(0, index - PAGE_LINES)], col)
          return true
        case 'PageDown':
          event.preventDefault()
          this.select(lines[Math.min(lines.length - 1, index + PAGE_LINES)], col)
          return true
        case 'Home':
          event.preventDefault()
          // ctrl + home goes to the very first cell
          this.select(withModifier ? lines[0] : lines[index], 0, 'start')
          return true
        case 'End':
          event.preventDefault()
          // the point of End is to get at the row's action buttons, bring the end of the sheet into view
          this.select(withModifier ? lines[lines.length - 1] : lines[index], lastCol, 'end')
          return true
        // w / s jump a whole record up / down, to its first line, staying in the same column
        case 'w':
        case 's': {
          if (withModifier || event.altKey){ return false }
          event.preventDefault()
          let current = lines[index].rowId
          let target = null
          if (event.key === 'w'){
            // the first line of the record before this one (or of this one when not on its first line)
            let firstOfThis = lines.findIndex((l) => { return l.rowId === current })
            if (firstOfThis < index){
              target = firstOfThis
            } else {
              for (let i = index - 1; i >= 0; i--){
                if (lines[i].rowId !== current){ target = lines.findIndex((l) => { return l.rowId === lines[i].rowId }); break }
              }
            }
          } else {
            for (let i = index + 1; i < lines.length; i++){
              if (lines[i].rowId !== current){ target = i; break }
            }
          }
          if (target !== null){ this.select(lines[target], col) }
          return true
        }
        // a / d jump a whole component (group of columns) left / right on the same row
        case 'a':
        case 'd': {
          if (withModifier || event.altKey){ return false }
          event.preventDefault()
          let starts = this.groupStarts()
          // the group lands at the left of the view so the whole component can be read
          if (event.key === 'a'){
            // to the start of this group, or of the one before when already at its start
            let before = starts.filter((c) => { return c < col })
            this.select(lines[index], (before.length > 0) ? before[before.length - 1] : 0, 'left')
          } else {
            let after = starts.filter((c) => { return c > col })
            if (after.length > 0){
              this.select(lines[index], after[0], 'left')
            } else {
              this.select(lines[index], lastCol, 'end')
            }
          }
          return true
        }
      }
      return false
    },

    /**
    * The column position each visible component's first column is at
    * @return {array} - of column indexes
    */
    groupStarts(){
      let starts = []
      let offset = 0
      for (let group of this.visibleGroups){
        starts.push(offset)
        offset += group.columns.length
      }
      return starts
    },

    /**
    * @param {object} line - from selectableLines
    * @param {number} col
    * @param {string|null} align - how to pan: null just keeps the cell in view, 'left' puts the cell at the
    *   left edge of the view, 'start' pans to the start of the sheet, 'end' brings the end of the row (its action buttons) into view
    */
    select(line, col, align = null){
      if (!line){ return }
      // the watcher on selectedCell leaves the panning to us
      this.selectingHere = !this.workflowStore.isSelected(line.rowId, line.line, col)
      this.workflowStore.selectCell(line.rowId, line.line, col)
      this.$nextTick(() => { this.scrollSelectedIntoView(align) })
    },

    /**
    * Move the sheet so the selected cell is in view, past the frozen header and record column
    */
    scrollSelectedIntoView(align = null){
      let td = this.selectedCellElement()
      let viewport = this.$refs.viewport
      if (!td || !viewport){ return }
      let cell = td.getBoundingClientRect()
      let view = viewport.getBoundingClientRect()
      // the header and record column are frozen by translating their cells (not the thead), so
      // measure a cell to find where they really are on screen
      let recordColumn = viewport.querySelector('th.wf-head-record')
      let top = recordColumn ? recordColumn.getBoundingClientRect().bottom : view.top
      let left = recordColumn ? recordColumn.getBoundingClientRect().right : view.left

      let x = this.x
      let y = this.y
      if (align === 'start'){
        x = 0
      } else if (align === 'left'){
        x += left - cell.left
      } else if (align === 'end'){
        // the row's action buttons sit after the last column, show up to the end of the table
        let table = viewport.querySelector('.wf-table').getBoundingClientRect()
        x += view.right - table.right
      } else if (cell.left < left){ x += left - cell.left }
      else if (cell.right > view.right){ x -= Math.min(cell.right - view.right, cell.left - left) }
      if (cell.top < top){ y += top - cell.top }
      else if (cell.bottom > view.bottom){ y -= Math.min(cell.bottom - view.bottom, cell.top - top) }
      if (x !== this.x || y !== this.y){
        this.moveTo(x, y)
      }
    },

    columnWidth(group, column){
      let remembered = this.workflowStore.columnWidths[this.widthKey(group, column)]
      if (remembered){ return remembered }
      return (column.kind == 'type') ? this.widths.type : this.widths.field
    },

    startResize(event, key, width){
      this.resizing = { key: key, mouseX: event.clientX, width: width }
      window.addEventListener('mousemove', this.resizeMove)
      window.addEventListener('mouseup', this.resizeEnd)
    },

    resizeMove(event){
      if (!this.resizing){ return }
      // the sheet might be zoomed, a pixel of mouse is not a pixel of column
      let width = this.resizing.width + (event.clientX - this.resizing.mouseX) / this.scale
      this.workflowStore.setColumnWidth(this.resizing.key, Math.max(MIN_COLUMN_WIDTH, width), false)
      event.preventDefault()
    },

    resizeEnd(){
      window.removeEventListener('mousemove', this.resizeMove)
      window.removeEventListener('mouseup', this.resizeEnd)
      if (this.resizing && this.workflowStore.columnWidths[this.resizing.key]){
        this.workflowStore.setColumnWidth(this.resizing.key, this.workflowStore.columnWidths[this.resizing.key], true)
      }
      this.resizing = null
    },

    /**
    * Things you click on or type in, the sheet should not be dragged from them
    */
    isInteractive(target){
      if (!target || !target.closest){ return false }
      return !!target.closest('input, textarea, select, button, a, label, [contenteditable], .wf-cell-editing, .wf-col-resize')
    },

    mouseDown(event){
      this.wasPanning = false
      if (event.button !== 0 || this.isInteractive(event.target)){ return }
      this.dragStart = { mouseX: event.clientX, mouseY: event.clientY, x: this.x, y: this.y }
      window.addEventListener('mousemove', this.mouseMove)
      window.addEventListener('mouseup', this.mouseUp)
    },

    mouseMove(event){
      if (!this.dragStart){ return }
      let dx = event.clientX - this.dragStart.mouseX
      let dy = event.clientY - this.dragStart.mouseY
      // a little slop so a click that moves a pixel is still a click
      if (!this.panning && Math.abs(dx) < 4 && Math.abs(dy) < 4){ return }
      this.panning = true
      this.wasPanning = true
      this.moveTo(this.dragStart.x + dx, this.dragStart.y + dy)
      event.preventDefault()
    },

    mouseUp(){
      window.removeEventListener('mousemove', this.mouseMove)
      window.removeEventListener('mouseup', this.mouseUp)
      this.dragStart = null
      this.panning = false
      // the click event fires right after this, wasPanning is cleared on the next mouse down
    },

    wheel(event){
      // let lists and text boxes inside the cell being edited scroll on their own
      if (!event.ctrlKey && !event.metaKey && event.target.closest && event.target.closest('.wf-cell-editing')){ return }
      event.preventDefault()
      if (event.ctrlKey || event.metaKey){
        // pinch on a trackpad comes through as ctrl + wheel
        let rect = this.$refs.viewport.getBoundingClientRect()
        this.zoomTo(this.scale * Math.exp(-event.deltaY * 0.01), event.clientX - rect.left, event.clientY - rect.top)
      } else {
        this.moveTo(this.x - event.deltaX, this.y - event.deltaY)
      }
    },

    /**
    * Keep the sheet from being dragged completely out of view
    */
    moveTo(x, y){
      let viewport = this.$refs.viewport
      let canvas = viewport.querySelector('.wf-table')
      // how much empty space can be dragged into view past the end of the sheet
      let margin = 120
      let minX = Math.min(0, viewport.clientWidth - canvas.offsetWidth * this.scale - margin)
      let minY = Math.min(0, viewport.clientHeight - canvas.offsetHeight * this.scale - margin)
      // the top left corner stays put, the frozen header and record column sit there
      this.x = Math.min(0, Math.max(minX, x))
      this.y = Math.min(0, Math.max(minY, y))
    },

    /**
    * Zoom keeping the point under the mouse (or the middle of the view) where it is
    */
    zoomTo(scale, originX, originY){
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
      let viewport = this.$refs.viewport
      if (typeof originX === 'undefined'){
        originX = viewport.clientWidth / 2
        originY = viewport.clientHeight / 2
      }
      let ratio = scale / this.scale
      let x = originX - (originX - this.x) * ratio
      let y = originY - (originY - this.y) * ratio
      this.scale = scale
      this.moveTo(x, y)
    },

    zoomIn(){ this.zoomTo(this.scale * 1.2) },
    zoomOut(){ this.zoomTo(this.scale / 1.2) },
    resetView(){
      this.scale = 1
      this.x = 0
      this.y = 0
    },

  },
  mounted(){
    // not reactive, bookkeeping for select()
    this.selectingHere = false
  },
  beforeUnmount(){
    window.removeEventListener('mousemove', this.resizeMove)
    window.removeEventListener('mouseup', this.resizeEnd)
    window.removeEventListener('mousemove', this.mouseMove)
    window.removeEventListener('mouseup', this.mouseUp)
  },
}
</script>
