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
import { compareComponent, suggestedPtsFor, checkCallNumberYears, publicationYear, applyChecklistRules, checkIsbns, hasSeriesStatement, recordProtections, applyProtections, recordSeriesTitles, isSeriesAlreadyInRecord, CIP_ENRICHMENT_ID } from '@/lib/workflows/cip'

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
    * What the WorldCat comparison came to for the whole record
    * @return {object} - {open, verified}
    */
    suggestionCount(){
      let open = 0, verified = 0
      for (let line of this.lines){
        for (let key in line){
          let entry = line[key]
          if (!entry){ continue }
          if (entry.ghost){ open++ }
          else if (entry.suggestion){ open += entry.suggestion.open; verified += entry.suggestion.verified }
        }
      }
      return { open: open, verified: verified }
    },

    /**
    * One record is one or more lines in the sheet. A component that is repeated in the record
    * (two contributors) puts each one on its own line, the lines a component
    * doesn't reach are left as greyed out cells. When WorldCat's record is there its components
    * are lined up with the record's: a matched line carries `suggestion` (per cell: match / add /
    * differs), an unmatched one becomes a `ghost` line offered under the record's.
    * @return {array} - of lines, each one is groupKey -> {pt, cells, suggestion} | {ghost: true, pt, cells, values, key}
    */
    lines(){
      if (this.row.status != 'ready' || !this.row.profile){ return [{}] }

      let perGroup = {}
      let lineCount = 1
      let dismissed = (this.row.enrichment && this.row.enrichment.dismissed) ? this.row.enrichment.dismissed : []
      for (let group of this.visibleGroups){
        perGroup[group.key] = findComponentPts(this.row.profile, group.component).map((pt) => {
          return { pt: pt, cells: resolveComponentCells(pt, this.rtLookup, this.lookupConfig) }
        })
        if (this.suggested){
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
      return lines
    },
  },
}
