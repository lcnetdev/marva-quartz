/**
 * Workflows: the keyboard on the selected cell, shared by the two views of a session, the
 * sheet (WorkflowGrid) and the pages (WorkflowPages). What is the same in both is here:
 * opening the cell (enter, F2, typing into it), clearing it, deselecting, and the handling of
 * enter while a cell is open, copying it (ctrl+c) and pasting onto it (the paste event). Moving
 * the selection around is the view's own, it implements `navigationKey(event)` and returns true
 * when it took the key.
 *
 * The component provides `columnCount`, and it is the element the cells are drawn in ($el).
 */

import { useWorkflowStore } from '@/stores/workflow'
import { SCANNER_MAX_KEY_GAP, SCANNER_MIN_LENGTH, isScannerCharacter } from '@/lib/workflows/scanner'

export default {
  methods: {

    /**
    * Is the keyboard talking to the sheet, and not to the scan box, a field or a modal
    */
    keyboardIsForSheet(){
      let ws = useWorkflowStore()
      if (!ws.activeSession || ws.editingCell || ws.busy || ws.prompts.length > 0 || ws.postError || ws.columnPaste){ return false }
      let el = document.activeElement
      if (el && el !== document.body && el.closest && el.closest('input, textarea, select, button, [contenteditable], .vfm, .v-popper__popper, .wf-dialog')){ return false }
      return true
    },

    /**
    * Enter in an open cell is done with the cell: it closes and goes back to being selected.
    * This runs on the capture phase, before the field in the cell sees the key, because the
    * fields handle enter themselves (and stop it going any further). The field still gets to do
    * its own enter work first (picking a suggestion, etc), the cell is closed right after.
    */
    keydownCapture(event){
      let ws = useWorkflowStore()
      if (!ws.editingCell || event.key !== 'Enter'){ return }
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey){ return }
      // only enter inside the open cell itself, not in a modal it opened
      let td = (event.target && event.target.closest) ? event.target.closest('td.wf-cell-editing') : null
      if (!td){ return }
      window.setTimeout(() => {
        if (!ws.editingCell){ return }
        ws.stopEditing()
        if (document.activeElement && document.activeElement.blur){ document.activeElement.blur() }
      }, 100)
    },

    keydown(event){
      let ws = useWorkflowStore()
      // a cell is open but the keyboard is not in its field (the focus got lost somewhere
      // along the way), enter and escape still close the cell
      if (ws.editingCell && (event.key === 'Enter' || event.key === 'Escape')){
        let el = document.activeElement
        if (!el || el === document.body || (el.closest && this.$el.contains(el) && !el.closest('.wf-cell-editing'))){
          event.preventDefault()
          ws.stopEditing()
          return
        }
      }
      // a cell is opening from typing but its field has not taken the focus yet, keep collecting the typing for it
      if (this.opening && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey){
        event.preventDefault()
        this.opening.text += event.key
        return
      }
      if (!this.keyboardIsForSheet()){ return }
      if (this.columnCount == 0){ return }

      let withModifier = event.ctrlKey || event.metaKey

      // escape: first stops a copy that is going, then lets go of the column or the cell
      if (event.key === 'Escape'){
        if (ws.copying){ ws.stopCopying(); return }
        if (ws.selectedColumn){ ws.selectedColumn = null; return }
      }
      // ctrl+c on a cell copies it, on a column it does nothing (the paste is what a column is selected for)
      if (withModifier && !event.altKey && (event.key === 'c' || event.key === 'C')){
        if (ws.selectedColumn){ event.preventDefault(); return }
        if (ws.selectedCell){
          event.preventDefault()
          let td = this.selectedCellElement()
          if (td){ td.dispatchEvent(new CustomEvent('wf-copy')) }
        }
        return
      }
      // ctrl+v arrives as the paste event, see paste below
      if (withModifier && !event.altKey && (event.key === 'v' || event.key === 'V')){ return }
      // ctrl+z / shift+ctrl+z (or ctrl+y): undo / redo the last change to a record
      if (withModifier && !event.altKey && (event.key === 'z' || event.key === 'Z' || event.key === 'y' || event.key === 'Y')){
        event.preventDefault()
        ws.undo(event.shiftKey || event.key === 'y' || event.key === 'Y')
        return
      }

      // moving around is the view's own
      if (this.navigationKey(event)){ return }
      if (!ws.selectedCell){ return }

      switch (event.key){
        case 'Enter':
        case 'F2':
          event.preventDefault()
          this.openSelected()
          return
        case 'Escape':
          ws.selectedCell = null
          return
        case 'Delete':
        case 'Backspace': {
          event.preventDefault()
          // the cell knows what is in it and how to take it out
          let td = this.selectedCellElement()
          if (td){ td.dispatchEvent(new CustomEvent('wf-clear')) }
          return
        }
      }

      // typing into a selected cell opens it and the typing goes into the field
      if (event.key.length === 1 && !withModifier && !event.altKey){
        event.preventDefault()
        this.typeOnSelected(event)
      }
    },

    /**
    * A character was typed with a cell selected but not open. It could be a person starting to type
    * into the cell, or a barcode scanner going off while the cell happens to be selected. The keys
    * are held for a moment: a run of them faster than anyone types, long enough to be a barcode,
    * is left to the scan detection (WorkflowSession), anything else opens the cell and goes into it.
    */
    typeOnSelected(event){
      let now = performance.now()
      let pending = this.pendingTyping
      if (pending && (now - pending.last) <= SCANNER_MAX_KEY_GAP && isScannerCharacter(event)){
        pending.text += event.key
        pending.last = now
      } else {
        if (pending){
          // what came before was slow typing by a person, it goes in first
          window.clearTimeout(pending.timer)
          this.flushTyping()
        }
        pending = this.pendingTyping = { text: event.key, last: now, timer: null }
      }
      window.clearTimeout(pending.timer)
      pending.timer = window.setTimeout(() => { this.flushTyping() }, SCANNER_MAX_KEY_GAP + 20)
    },

    flushTyping(){
      let pending = this.pendingTyping
      this.pendingTyping = null
      if (!pending){ return }
      if (pending.text.length >= SCANNER_MIN_LENGTH){
        // a scanner typed this, the scan detection loads the record
        return
      }
      this.openSelected(pending.text)
    },

    /**
    * Something was pasted while the sheet has the keyboard. If the text is a cell that was copied
    * here it goes into the selected cell, or down the selected column. Other text is left alone.
    */
    paste(event){
      let ws = useWorkflowStore()
      if (!this.keyboardIsForSheet()){ return }
      if (!ws.selectedCell && !ws.selectedColumn){ return }
      let text = (event.clipboardData) ? event.clipboardData.getData('text/plain') : ''
      let payload = ws.pastedPayload(text)
      if (!payload){
        if (text){ ws.notify('Only a cell copied from the sheet can be pasted here', 'info') }
        return
      }
      event.preventDefault()
      if (ws.selectedColumn){
        if (this.columnForPaste){
          let target = this.columnForPaste(ws.selectedColumn)
          if (target){ ws.askColumnPaste(target.group, target.column, payload) }
        }
        return
      }
      let td = this.selectedCellElement()
      if (td){ td.dispatchEvent(new CustomEvent('wf-paste', { detail: payload })) }
    },

    selectedCellElement(){
      return this.$el.querySelector('td.wf-cell-selected, td.wf-cell-editing')
    },

    /**
    * Open the selected cell for editing, the same as clicking on it, and type the key into it if there is one
    * @param {string} key - the character(s) that were typed to open the cell
    */
    openSelected(key){
      if (key){ this.opening = { text: key } }
      // the selection may have just moved, let it be drawn first
      this.$nextTick(() => {
        let td = this.selectedCellElement()
        if (!td){ this.opening = null; return }
        // a click on the selected cell is what opens it
        this.wasPanning = false
        td.click()
        if (key){ this.typeIntoOpenCell() }
      })
    },

    /**
    * Put what was typed (this.opening.text, which keeps growing while the cell opens) into the
    * field of the opening cell, once the field is there and has the focus
    */
    typeIntoOpenCell(){
      // the field shows up and takes the focus a moment later, then the typing can go in
      let tries = 0
      let typeIt = () => {
        let field = document.activeElement
        if (field && field.closest && field.closest('.wf-cell-editing') && (field.tagName == 'INPUT' || field.tagName == 'TEXTAREA')){
          let text = this.opening ? this.opening.text : ''
          this.opening = null
          if (text && (!document.execCommand || !document.execCommand('insertText', false, text))){
            field.setRangeText(text, field.selectionStart, field.selectionEnd, 'end')
            field.dispatchEvent(new Event('input', { bubbles: true }))
          }
        } else if (tries++ < 10){
          window.setTimeout(typeIt, 30)
        } else {
          this.opening = null
        }
      }
      window.setTimeout(typeIt, 30)
    },
  },
  mounted(){
    // not reactive, bookkeeping for typing on a selected cell (see typeOnSelected / openSelected)
    this.pendingTyping = null
    this.opening = null
    window.addEventListener('keydown', this.keydownCapture, true)
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('paste', this.paste)
  },
  beforeUnmount(){
    if (this.pendingTyping){ window.clearTimeout(this.pendingTyping.timer) }
    window.removeEventListener('keydown', this.keydownCapture, true)
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('paste', this.paste)
  },
}
