/**
 * Workflows: how one record is laid out as lines of cells. Mixed into the two ways a
 * record is drawn, as a row of the sheet (WorkflowRecord) and as a page (WorkflowPage),
 * both take the record (`row`) and the components in the sheet (`visibleGroups`) as props.
 */

import { mapStores, mapState } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useProfileStore } from '@/stores/profile'
import { useConfigStore } from '@/stores/config'

import { findComponentPts, resolveComponentCells } from '@/lib/workflows/fields'
import { compareComponent, suggestedPtsFor, checkCallNumberYears, publicationYear, applyChecklistRules, checkIsbns, hasSeriesStatement, recordProtections, applyProtections, recordSeriesTitles, isSeriesAlreadyInRecord, applyReplacements, applyRequired, isAutoReplaced, isRequired, suggestionsHidden, componentIsEmpty, CIP_ENRICHMENT_ID } from '@/lib/workflows/cip'

const SUBJECT_URI = 'http://id.loc.gov/ontologies/bibframe/subject'
const CLASSIFICATION_URI = 'http://id.loc.gov/ontologies/bibframe/classification'

export default {
  props: {
    row: Object,
    visibleGroups: Array,
  },
  computed: {
    ...mapStores(useWorkflowStore),
    ...mapState(useProfileStore, ['rtLookup']),
    ...mapState(useConfigStore, ['lookupConfig']),

    /**
    * The components of this record with lines the editor's hide non-LC preferences keep off the
    * sheet: a note under the component says so, with a way to show them for this record only
    * @return {object} - group key -> { count, shown, label }
    */
    hiddenNotes(){
      let notes = {}
      if (this.row.status != 'ready' || !this.row.profile){ return notes }
      for (let group of this.visibleGroups){
        let shown = (this.row.showHidden || []).includes(group.key)
        // while shown, the lines are on the sheet so the layout hid nothing: count what it would hide
        let counts = shown ? this.wouldHide(group) : this.layout.hidden[group.key]
        if (!counts){ continue }
        let count = counts.record + counts.worldcat
        if (count == 0){ continue }
        let what = (group.component.propertyURI === SUBJECT_URI) ? 'non-LC heading' : 'non-LC class number'
        let label = (shown ? 'Showing ' : 'Hiding ') + count + ' ' + what + ((count == 1) ? '' : 's')
        if (counts.worldcat > 0){ label += (counts.record > 0) ? ' (' + counts.worldcat + ' from WorldCat)' : ' from WorldCat' }
        notes[group.key] = { count: count, shown: shown, label: label }
      }
      return notes
    },

    hasHiddenNote(){
      return Object.keys(this.hiddenNotes).length > 0
    },

    /**
    * Where each group's first column is, counting across all of the visible columns
    * @return {object} - group key -> column position
    */
    groupOffsets(){
      let offsets = {}
      let offset = 0
      for (let group of this.visibleGroups){
        offsets[group.key] = offset
        offset += group.columns.length
      }
      return offsets
    },

    /**
    * The protections (juvenile fiction, law) that apply to this record
    */
    protections(){
      if (!this.cipOn || this.row.status != 'ready' || !this.row.profile){ return [] }
      return recordProtections(this.row.profile)
    },

    // is the CIP enrichment on for this sheet
    cipOn(){
      let s = this.workflowStore.activeSession
      return !!(s && (s.definition.enrichments || []).includes(CIP_ENRICHMENT_ID))
    },

    /**
    * The WorldCat record to compare against, once it is there
    */
    suggested(){
      return (this.row.enrichment && this.row.enrichment.status == 'ready') ? this.row.enrichment.suggested : null
    },

    /**
    * What the WorldCat comparison came to for the whole record, with the cells that were replaced
    * from WorldCat on their own and the required fields that are empty
    * @return {object} - {open, verified, replaced, missing}
    */
    suggestionCount(){
      let open = 0, verified = 0, replaced = 0, missing = 0
      for (let line of this.lines){
        for (let key in line){
          let entry = line[key]
          if (!entry){ continue }
          if (entry.ghost){ open++; continue }
          if (entry.suggestion){ open += entry.suggestion.open; verified += entry.suggestion.verified; replaced += entry.suggestion.replaced || 0 }
          if (entry.missing){ missing++ }
        }
      }
      return { open: open, verified: verified, replaced: replaced, missing: missing }
    },

    /**
    * One record is one or more lines in the sheet. A component that is repeated in the record
    * (two contributors) puts each one on its own line, the lines a component
    * doesn't reach are left as grayed out cells. When WorldCat's record is there its components
    * are lined up with the record's: a matched line carries `suggestion` (per cell: match / add /
    * differs), an unmatched one becomes a `ghost` line offered under the record's.
    * @return {array} - of lines, each one is groupKey -> {pt, cells, suggestion} | {ghost: true, pt, cells, values, key}
    */
    lines(){
      return this.layout.lines
    },

    /**
    * The lines (above) along with what the editor's hide non-LC preferences kept off them: per
    * component, how many of the record's own lines and how many of WorldCat's unmatched (ghost)
    * lines. WorldCat's copy of a heading the record has is always compared, so the heading is
    * still verified; only the headings it would add are hidden.
    * @return {object} - { lines, hidden: groupKey -> {record, worldcat} }
    */
    layout(){
      if (this.row.status != 'ready' || !this.row.profile){ return { lines: [{}], hidden: {} } }

      let perGroup = {}
      let hidden = {}
      let lineCount = 1
      let dismissed = (this.row.enrichment && this.row.enrichment.dismissed) ? this.row.enrichment.dismissed : []
      let hide = (groupKey, what, pt) => {
        if (this.shownInEditor(pt, groupKey)){ return false }
        if (!hidden[groupKey]){ hidden[groupKey] = { record: 0, worldcat: 0 } }
        hidden[groupKey][what]++
        return true
      }
      for (let group of this.visibleGroups){
        perGroup[group.key] = findComponentPts(this.row.profile, group.component).filter((pt) => { return !hide(group.key, 'record', pt) }).map((pt) => {
          return { pt: pt, cells: resolveComponentCells(pt, this.rtLookup, this.lookupConfig) }
        })
        // the linked related work / series is never taken from WorldCat (cip.suggestionsHidden)
        if (this.suggested && !suggestionsHidden(group.component)){
          // a series can sit in the linked relation component or the transcribed one: one WorldCat
          // offers is not new when the record has it under the other component
          let seriesElsewhere = recordSeriesTitles(this.row.profile, group.component)
          let suggestedLines = suggestedPtsFor(this.suggested, group.component)
            .filter((pt) => { return !isSeriesAlreadyInRecord(pt, seriesElsewhere) })
            .map((pt) => {
              return { pt: pt, cells: resolveComponentCells(pt, this.rtLookup, this.lookupConfig) }
            })
          let compared = compareComponent(group.key, group.columns, perGroup[group.key], suggestedLines, dismissed)
          perGroup[group.key].forEach((line, i) => { line.suggestion = compared.suggestions[i] })
          for (let ghost of compared.ghosts){
            // a heading WorldCat would add that the preference hides (a FAST heading) is not offered
            if (hide(group.key, 'worldcat', ghost.pt)){ continue }
            perGroup[group.key].push({ ghost: true, pt: ghost.pt, cells: ghost.cells, values: ghost.values, key: ghost.key })
          }
        }
        lineCount = Math.max(lineCount, perGroup[group.key].length)
      }

      // the checklist's own checks, these don't need WorldCat
      if (this.cipOn){
        let context = { hasSeries: hasSeriesStatement(this.row.profile) }
        let pub = (this.suggested ? publicationYear(this.suggested) : null) || publicationYear(this.row.profile)
        let pubSource = (this.suggested && publicationYear(this.suggested)) ? 'WorldCat ' + (pub ? pub.from : '') : (pub ? pub.from : '')
        let enrichment = this.row.enrichment || {}
        let inHand = (enrichment.query && enrichment.query.isbn) || (enrichment.source && enrichment.source.query && enrichment.source.query.isbn) || null
        for (let group of this.visibleGroups){
          let lines = perGroup[group.key]
          applyChecklistRules(group.key, group, lines, context, dismissed)
          if (group.component.propertyURI === 'http://id.loc.gov/ontologies/bibframe/classification' && pub){
            // row 050: the call number's year against the publication date (WorldCat's when it is there)
            checkCallNumberYears(group.key, group.columns, lines, pub.year, pubSource, dismissed)
          }
          if (group.component.propertyURI === 'http://id.loc.gov/ontologies/bibframe/identifiedBy'){
            checkIsbns(group.key, group, lines, inHand, dismissed)
          }
          // juvenile fiction / law: some fields are not to be replaced, only added to
          applyProtections(group, lines, this.protections)
          // the fields the book settles were replaced from WorldCat when the lookup came back: say so on the cells
          if (isAutoReplaced(group.component)){
            applyReplacements(group.key, lines, this.row.replaced, dismissed)
          }
          // the fields a CIP record has to have. A record marked done is past that: the red marks go
          // (and come back if it is edited again, rowChanged takes the done mark off)
          if (isRequired(group.component) && !this.row.done){
            applyRequired(lines, enrichment.status == 'loading')
          }
        }
      }

      let lines = []
      for (let i = 0; i < lineCount; i++){
        let line = {}
        for (let group of this.visibleGroups){
          line[group.key] = perGroup[group.key][i] || null
        }
        lines.push(line)
      }
      return { lines: lines, hidden: hidden }
    },
  },
  methods: {
    /**
    * The editor's "Hide non-LC subjects" and "Hide non-LC class numbers" preferences hold on the
    * sheet too: a subject not from an LC thesaurus, a class number not LC's, is left off the
    * record's lines and off WorldCat's offers. The same decision as the editor's
    * (profileStore.displaySubject / displayClassNumber, which read the preferences and say yes
    * when they are off). An empty component is always shown, it is the line to type into.
    * @param {object} pt
    * @return {boolean}
    */
    shownInEditor(pt, groupKey){
      if ((this.row.showHidden || []).includes(groupKey)){ return true }
      return this.shownByPreference(pt)
    },

    // the preference's own say, without this record's "Show"
    shownByPreference(pt){
      if (!pt || componentIsEmpty(pt)){ return true }
      if (pt.propertyURI === SUBJECT_URI){ return !!useProfileStore().displaySubject(pt) }
      if (pt.propertyURI === CLASSIFICATION_URI){ return !!useProfileStore().displayClassNumber(pt) }
      return true
    },

    /**
    * What the preference would hide of a component whose lines are shown for this record: its own
    * lines, and WorldCat's ghost lines on the sheet (an unmatched offer, drawn as a ghost)
    * @param {object} group
    * @return {object} - {record, worldcat}
    */
    wouldHide(group){
      let counts = { record: 0, worldcat: 0 }
      for (let line of this.layout.lines){
        let entry = line[group.key]
        if (!entry || !entry.pt || this.shownByPreference(entry.pt)){ continue }
        counts[entry.ghost ? 'worldcat' : 'record']++
      }
      return counts
    },

    /**
    * Show (or hide again) the lines of a component the preference hides, for this record only,
    * for as long as the sheet is open
    * @param {string} groupKey
    */
    toggleHidden(groupKey){
      let list = this.row.showHidden || []
      this.row.showHidden = list.includes(groupKey) ? list.filter((k) => { return k !== groupKey }) : list.concat([groupKey])
    },
  },
}
