<template>
  <span>
    <!-- what a record that is not ready yet is up to -->
    <template v-if="row.status == 'error'">
      <span class="material-icons">error</span> {{ row.error }}
      <button @click="workflowStore.loadRow(row.id)">Try again</button>
    </template>
    <template v-else-if="row.status == 'searching'">Searching for {{ row.scanned }}...</template>
    <template v-else-if="row.status == 'checking'">More than one record matches {{ row.scanned }}, looking at them...</template>
    <template v-else-if="row.status == 'choosing'">More than one record matches {{ row.scanned }}, waiting for a selection...</template>
    <template v-else>Loading record...</template>
  </span>
</template>

<script>
import { mapStores } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'

export default {
  name: "WorkflowRecordStatus",
  props: {
    row: Object,
  },
  computed: {
    ...mapStores(useWorkflowStore),
  },
}
</script>
