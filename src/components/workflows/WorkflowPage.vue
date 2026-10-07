<template>
  <div :class="['wf-page', {'wf-record-done': row.done, 'wf-record-active': workflowStore.activeRowId === row.id}]" :data-row-id="row.id">
    <!-- one record as a page: the sheet's row stood on end, each component is a band with its fields across it -->

    <!-- the record line, across the top, with the page turning controls in front of it -->
    <div class="wf-page-nav">
      <slot name="nav"></slot>
      <WorkflowRecordLabel :row="row" :index="index" :protections="protections" :suggestionCount="suggestionCount" class="wf-page-record" />
    </div>

    <div class="wf-page-body" :style="{ fontSize: scale + 'em' }">
      <!-- a band per component: its own table, so each can have its own number of columns -->
      <div v-if="row.status == 'ready'" class="wf-page-groups">
        <table v-for="group in visibleGroups" :key="group.key" class="wf-table wf-page-table">
          <colgroup>
            <col class="wf-page-component-col" />
            <col v-for="column in group.columns" :key="group.key + column.key" />
          </colgroup>
          <tbody>
            <tr>
              <!-- the component, down the left, as narrow as it can be -->
              <th :rowspan="groupLines(group).length + 1" :class="['wf-head', 'wf-page-component', 'wf-head-' + group.component.rt.toLowerCase()]" :title="group.component.rt + ': ' + group.component.label">
                <span class="wf-head-rt">{{ group.component.rt }}</span>
                <span class="wf-page-component-label">{{ group.component.label }}</span>
              </th>
              <th v-for="column in group.columns" :key="group.key + column.key" class="wf-head wf-head-field" :title="column.label + (columnHint(group.allColumns, column) ? ' (' + columnHint(group.allColumns, column) + ')' : '')">
                {{ column.label }}<span v-if="columnHint(group.allColumns, column)" class="wf-head-hint">{{ columnHint(group.allColumns, column) }}</span>
              </th>
            </tr>
            <tr v-for="lineIdx in groupLines(group)" :key="lineIdx">
              <WorkflowCell
                v-for="(column, colIdx) in group.columns"
                :key="group.key + column.key"
                :row="row"
                :group="group"
                :pt="(lines[lineIdx][group.key] && !lines[lineIdx][group.key].ghost) ? lines[lineIdx][group.key].pt : null"
                :cell="lines[lineIdx][group.key] ? (lines[lineIdx][group.key].cells[column.key] || null) : null"
                :column="column"
                :firstInGroup="colIdx == 0"
                :line="lineIdx"
                :colIndex="groupOffsets[group.key] + colIdx"
                :lineSuggestion="(lines[lineIdx][group.key] && lines[lineIdx][group.key].suggestion) ? lines[lineIdx][group.key].suggestion : null"
                :ghost="(lines[lineIdx][group.key] && lines[lineIdx][group.key].ghost) ? lines[lineIdx][group.key] : null"
              />
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else :class="['wf-page-status', {'wf-record-status-error': row.status == 'error'}]">
        <WorkflowRecordStatus :row="row" />
      </div>
    </div>

    <!-- the record's buttons, along the bottom -->
    <div class="wf-page-actions">
      <WorkflowRecordActions :row="row" marc-placement="top" />
    </div>
  </div>
</template>

<script>
import recordLines from "@/components/workflows/recordLines";
import { columnHint } from '@/lib/workflows/fields'
import WorkflowCell from "@/components/workflows/WorkflowCell.vue";
import WorkflowRecordLabel from "@/components/workflows/WorkflowRecordLabel.vue";
import WorkflowRecordActions from "@/components/workflows/WorkflowRecordActions.vue";
import WorkflowRecordStatus from "@/components/workflows/WorkflowRecordStatus.vue";

export default {
  name: "WorkflowPage",
  // row and visibleGroups, and the lines the record spreads out into
  mixins: [recordLines],
  components: { WorkflowCell, WorkflowRecordLabel, WorkflowRecordActions, WorkflowRecordStatus },
  props: {
    index: Number,
    // the zoom, 1 is normal size
    scale: { type: Number, default: 1 },
  },
  methods: {
    columnHint: columnHint,

    /**
    * The lines of the record this component is on. In the sheet every component is stretched to the
    * longest one with greyed out cells, here each component only takes the lines it has (at least one)
    * @return {array} - of line indexes into this.lines
    */
    groupLines(group){
      let indexes = []
      this.lines.forEach((line, idx) => {
        if (line[group.key]){ indexes.push(idx) }
      })
      return (indexes.length > 0) ? indexes : [0]
    },
  },
}
</script>
