<template>
  <div class="wf-pages" @wheel="wheel" @contextmenu.prevent>
    <!-- the session one record at a time: the sheet's rows as pages that are turned -->

    <WorkflowPage v-if="currentRow" :key="currentRow.id" :row="currentRow" :index="currentIndex" :visibleGroups="visibleGroups" :scale="scale">
      <template #nav>
        <button class="wf-page-turn" :disabled="currentIndex <= 0" @click="goTo(currentIndex - 1)" title="Previous record (W, Page Up)"><span class="material-icons">chevron_left</span></button>
        <select class="wf-page-jump" :value="currentRow.id" @change="goTo($event.target.selectedIndex)" title="Jump to a record">
          <option v-for="(r, idx) in rows" :key="r.id" :value="r.id">{{ idx + 1 }}. {{ r.done ? '✓ ' : '' }}{{ r.label || r.scanned }}</option>
        </select>
        <button class="wf-page-turn" :disabled="currentIndex >= rows.length - 1" @click="goTo(currentIndex + 1)" title="Next record (S, Page Down)"><span class="material-icons">chevron_right</span></button>
        <span class="wf-page-count">{{ currentIndex + 1 }} / {{ rows.length }}</span>
      </template>
    </WorkflowPage>

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
import WorkflowPage from "@/components/workflows/WorkflowPage.vue";

const MIN_SCALE = 0.5
const MAX_SCALE = 2

export default {
  name: "WorkflowPages",
  // enter / typing / delete / escape on the selected cell, the moving around is navigationKey below
  mixins: [sheetKeyboard],
  components: { WorkflowPage },
  emits: ['scale'],
  provide(){
    return {
      // the cells ask the sheet if a click was really the end of a drag, pages are not dragged
      wfGridWasPanning: () => { return false },
    }
  },
  data(){
    return {
      // the record whose page is open
      pageRowId: null,
      // where that page was in the list, to land somewhere sensible when the record is removed
      lastIndex: 0,
      scale: 1,
      // the session view asks this after a click, see WorkflowSession.gridClick
      wasPanning: false,
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

    currentRow(){
      return this.rows.filter((r) => { return r.id === this.pageRowId })[0] || null
    },

    currentIndex(){
      return this.currentRow ? this.rows.indexOf(this.currentRow) : -1
    },
  },
  watch: {
    scale(newVal){
      this.$emit('scale', newVal)
    },
    currentIndex(newVal){
      if (newVal >= 0){ this.lastIndex = newVal }
    },
    // the page's record was removed (or the sheet filled up from empty), turn to the nearest one
    'rows.length': function(){
      if (!this.currentRow){ this.pageRowId = this.rows.length > 0 ? this.rows[Math.min(this.lastIndex, this.rows.length - 1)].id : null }
    },
    // the selection lands on another record (a scan came in, or it was moved from the keyboard), that is the page to show
    'workflowStore.selectedCell'(newVal){
      if (!newVal){ return }
      if (newVal.rowId !== this.pageRowId && this.rows.some((r) => { return r.id === newVal.rowId })){
        this.pageRowId = newVal.rowId
      }
      this.$nextTick(() => {
        let td = this.selectedCellElement()
        if (td){ td.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
      })
    },
  },
  methods: {

    /**
    * Turn to the record at this position in the list, and put the keyboard on its first cell
    * @param {number} index
    * @return {void}
    */
    goTo(index){
      if (isNaN(index) || index < 0 || index >= this.rows.length){ return }
      let row = this.rows[index]
      this.workflowStore.stopEditing()
      this.pageRowId = row.id
      if (row.status == 'ready'){
        let sel = this.workflowStore.selectedCell
        if (!sel || sel.rowId !== row.id){ this.workflowStore.selectCell(row.id, 0, 0) }
      } else {
        this.workflowStore.selectedCell = null
      }
      // the keyboard was on the arrow button or the dropdown, give it back to the page
      if (document.activeElement && document.activeElement.blur){ document.activeElement.blur() }
      this.$el.querySelector('.wf-page-body')?.scrollTo(0, 0)
    },

    /**
    * The cells of the page as drawn, in reading order, with the table row each one is on
    * @return {array} - of {line, col, tr}
    */
    cellsOnPage(){
      let tds = this.$el.querySelectorAll('td.wf-cell')
      return Array.from(tds).map((td) => {
        return { line: parseInt(td.dataset.line, 10), col: parseInt(td.dataset.col, 10), tr: td.parentElement }
      })
    },

    /**
    * The cell of the table row nearest to the column, the one that lines up with it if it has one
    * @param {array} cells - from cellsOnPage
    * @param {Element} tr
    * @param {number} col
    * @return {object|null}
    */
    cellInRow(cells, tr, col){
      let inRow = cells.filter((c) => { return c.tr === tr })
      if (inRow.length == 0){ return null }
      let exact = inRow.filter((c) => { return c.col === col })[0]
      if (exact){ return exact }
      return inRow.reduce((best, c) => { return (Math.abs(c.col - col) < Math.abs(best.col - col)) ? c : best })
    },

    select(cell){
      if (!cell || !this.currentRow){ return }
      this.workflowStore.selectCell(this.currentRow.id, cell.line, cell.col)
    },

    /**
    * The keys that move the selection around the page, and from page to page
    * @return {boolean} - was the key taken
    */
    navigationKey(event){
      let ws = this.workflowStore
      let withModifier = event.ctrlKey || event.metaKey

      // turning the page does not need a selection
      switch (event.key){
        case 'PageUp':
          event.preventDefault()
          this.goTo(this.currentIndex - 1)
          return true
        case 'PageDown':
          event.preventDefault()
          this.goTo(this.currentIndex + 1)
          return true
        case 'w':
        case 's':
          if (withModifier || event.altKey){ return false }
          event.preventDefault()
          this.goTo(this.currentIndex + ((event.key === 'w') ? -1 : 1))
          return true
      }

      let cells = this.cellsOnPage()
      // nothing to move around on, the record is still loading or the sheet is empty
      if (cells.length == 0){ return true }

      let sel = ws.selectedCell
      let index = (sel && this.currentRow && sel.rowId === this.currentRow.id) ? cells.findIndex((c) => { return c.line === sel.line && c.col === sel.col }) : -1

      // nothing selected yet (or it went away), the arrow keys start at the top
      if (index == -1){
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)){
          event.preventDefault()
          this.select(cells[0])
        }
        return true
      }

      let current = cells[index]
      // the table rows of the page in order, each one is a line of a component
      let trs = []
      for (let c of cells){ if (!trs.includes(c.tr)){ trs.push(c.tr) } }
      let trIndex = trs.indexOf(current.tr)

      switch (event.key){
        case 'ArrowUp':
          event.preventDefault()
          if (trIndex > 0){ this.select(this.cellInRow(cells, trs[trIndex - 1], current.col)) }
          return true
        case 'ArrowDown':
          event.preventDefault()
          if (trIndex < trs.length - 1){ this.select(this.cellInRow(cells, trs[trIndex + 1], current.col)) }
          return true
        case 'ArrowLeft':
          event.preventDefault()
          if (index > 0 && cells[index - 1].tr === current.tr){ this.select(cells[index - 1]) }
          return true
        case 'ArrowRight':
          event.preventDefault()
          if (index < cells.length - 1 && cells[index + 1].tr === current.tr){ this.select(cells[index + 1]) }
          return true
        case 'Tab':
          // tab reads on through the page, line after line, component after component
          event.preventDefault()
          if (event.shiftKey){
            if (index > 0){ this.select(cells[index - 1]) }
          } else if (index < cells.length - 1){
            this.select(cells[index + 1])
          }
          return true
        case 'Home':
          event.preventDefault()
          // ctrl + home goes to the top of the page, home to the start of the line
          this.select(withModifier ? cells[0] : cells.filter((c) => { return c.tr === current.tr })[0])
          return true
        case 'End': {
          event.preventDefault()
          let inRow = cells.filter((c) => { return c.tr === current.tr })
          this.select(withModifier ? cells[cells.length - 1] : inRow[inRow.length - 1])
          return true
        }
        // a / d jump a whole component up / down the page, to its first line
        case 'a':
        case 'd': {
          if (withModifier || event.altKey){ return false }
          event.preventDefault()
          // each component is its own table, see WorkflowPage
          let table = current.tr.closest('table')
          let firstLine = table.querySelector('td.wf-cell').parentElement
          let target
          if (event.key === 'a'){
            // to the first line of this component, or of the one before when already on it
            target = (current.tr !== firstLine) ? table : table.previousElementSibling
          } else {
            target = table.nextElementSibling
          }
          if (target && target.querySelector('td.wf-cell')){
            this.select(this.cellInRow(cells, target.querySelector('td.wf-cell').parentElement, current.col))
          }
          return true
        }
      }
      return false
    },

    wheel(event){
      // pinch on a trackpad comes through as ctrl + wheel, plain scrolling is the page's own
      if (!event.ctrlKey && !event.metaKey){ return }
      event.preventDefault()
      this.zoomTo(this.scale * Math.exp(-event.deltaY * 0.01))
    },

    zoomTo(scale){
      this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
    },

    zoomIn(){ this.zoomTo(this.scale * 1.2) },
    zoomOut(){ this.zoomTo(this.scale / 1.2) },
    resetView(){ this.scale = 1 },
  },
  mounted(){
    // open on the record the keyboard is on, otherwise the first one
    let sel = this.workflowStore.selectedCell
    if (sel && this.rows.some((r) => { return r.id === sel.rowId })){
      this.pageRowId = sel.rowId
    } else if (this.rows.length > 0){
      this.pageRowId = this.rows[0].id
    }
  },
}
</script>
