<template>
  <tbody :class="['wf-record', {'wf-record-done': row.done, 'wf-record-active': workflowStore.activeRowId === row.id, 'wf-record-flash': row.flash}]" :data-row-id="row.id">
    <tr v-for="(line, lineIdx) in lines" :key="lineIdx" :class="{'wf-line-first': lineIdx == 0}">

      <!-- the frozen column that says what record this is, with the record's buttons so they stay in view too -->
      <th v-if="lineIdx == 0" :rowspan="lines.length + (hasHiddenNote ? 1 : 0)" class="wf-record-header wf-stick-left" scope="row">
        <WorkflowRecordLabel :row="row" :index="index" :protections="protections" :suggestionCount="suggestionCount" />
        <div class="wf-record-actions">
          <WorkflowRecordActions :row="row" marc-placement="right" />
        </div>
      </th>

      <template v-if="row.status == 'ready'">
        <template v-for="group in visibleGroups" :key="group.key">
          <WorkflowCell
            v-for="(column, colIdx) in group.columns"
            :key="group.key + column.key"
            :row="row"
            :group="group"
            :pt="(line[group.key] && !line[group.key].ghost) ? line[group.key].pt : null"
            :cell="line[group.key] ? (line[group.key].cells[column.key] || null) : null"
            :lineCells="line[group.key] ? line[group.key].cells : null"
            :column="column"
            :firstInGroup="colIdx == 0"
            :line="lineIdx"
            :colIndex="groupOffsets[group.key] + colIdx"
            :lineSuggestion="(line[group.key] && line[group.key].suggestion) ? line[group.key].suggestion : null"
            :ghost="(line[group.key] && line[group.key].ghost) ? line[group.key] : null"
            :missing="!!(line[group.key] && line[group.key].missing)"
          />
        </template>
      </template>
      <td v-else-if="lineIdx == 0" :colspan="columnCount" :class="['wf-record-status', {'wf-record-status-error': row.status == 'error'}]">
        <WorkflowRecordStatus :row="row" />
      </td>
    </tr>

    <!-- under the lines: a note for a component whose non-LC subjects / class numbers the editor's preference hides -->
    <tr v-if="row.status == 'ready' && hasHiddenNote" class="wf-note-line">
      <template v-for="group in visibleGroups" :key="group.key">
        <td :colspan="group.columns.length" :class="{'wf-hidden-note': hiddenNotes[group.key]}">
          <template v-if="hiddenNotes[group.key]">
            {{ hiddenNotes[group.key].label }}
            <a class="wf-hidden-note-toggle" @click.stop="toggleHidden(group.key)" :title="hiddenNotes[group.key].shown ? 'Hide them again' : 'Show them for this record'">{{ hiddenNotes[group.key].shown ? 'Hide' : 'Show' }}</a>
          </template>
        </td>
      </template>
    </tr>
  </tbody>
</template>

<script>
import recordLines from "@/components/workflows/recordLines";
import WorkflowCell from "@/components/workflows/WorkflowCell.vue";
import WorkflowRecordLabel from "@/components/workflows/WorkflowRecordLabel.vue";
import WorkflowRecordActions from "@/components/workflows/WorkflowRecordActions.vue";
import WorkflowRecordStatus from "@/components/workflows/WorkflowRecordStatus.vue";

export default {
  name: "WorkflowRecord",
  // row and visibleGroups, and the lines the record spreads out into
  mixins: [recordLines],
  components: { WorkflowCell, WorkflowRecordLabel, WorkflowRecordActions, WorkflowRecordStatus },
  props: {
    index: Number,
    columnCount: Number,
  },
}
</script>
