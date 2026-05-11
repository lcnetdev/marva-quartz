<script>
  import { useProfileStore } from '@/stores/profile'
  import { mapStores, mapWritableState } from 'pinia'
  import { VueFinalModal } from 'vue-final-modal'
  import VueDragResize from 'vue3-drag-resize'

  export default {
    components: {
      VueFinalModal,
      VueDragResize,
    },

    data() {
      return {
        width: 0,
        height: 0,
        top: 50,
        left: 0,
        initalHeight: 500,
        initalLeft: (window.innerWidth / 2) - 450,
      }
    },

    computed: {
      ...mapStores(useProfileStore),
      ...mapWritableState(useProfileStore, ['showMarvaLogModal', 'marvaLogResults', 'marvaLogSearchValue', 'marvaLogLoading']),
      sortedResults(){
        return [...this.marvaLogResults].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      },
    },

    methods: {
      done: function(){
        this.showMarvaLogModal = false
      },

      dragResize: function(newRect){
        this.width = newRect.width
        this.height = newRect.height
        this.top = newRect.top
        this.left = newRect.left
        this.$refs.contentHolder.style.height = newRect.height + 'px'
      },

      onSelectElement(event){
        const tagName = event.target.tagName
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
          event.stopPropagation()
        }
      },

      formatTimestamp: function(ts){
        if (!ts) return ''
        let d = new Date(ts)
        return d.toLocaleString()
      },

      formatEid: function(eId){
        if (!eId) return ''
        return 'e' + eId
      },
    },
  }
</script>

<template>
  <VueFinalModal
    display-directive="show"
    :hide-overlay="false"
    :overlay-transition="'vfm-fade'"
    :click-to-close="false"
    :esc-to-close="true"
  >
    <VueDragResize
      :is-active="true"
      :w="900"
      :h="initalHeight"
      :x="initalLeft"
      class="marva-log-modal"
      @resizing="dragResize"
      @dragging="dragResize"
      :sticks="['br']"
      :stickSize="22"
    >
      <div class="marva-log-content" ref="contentHolder" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

        <div class="marva-log-header">
          <h2>Marva Log: {{ marvaLogSearchValue }}</h2>
          <button @click="done">Close</button>
        </div>

        <div v-if="marvaLogLoading" class="marva-log-loading">
          Loading...
        </div>

        <div v-else-if="marvaLogResults.length === 0" class="marva-log-empty">
          No events found for "{{ marvaLogSearchValue }}"
        </div>

        <div v-else class="marva-log-table-wrapper">
          <table class="marva-log-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Event</th>
                <th>eId</th>
                <th>LCCN</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in sortedResults" :key="event._id">
                <td>{{ formatTimestamp(event.timestamp) }}</td>
                <td>{{ event.name || event.username }}<span v-if="event.name && event.username"> ({{ event.username }})</span></td>
                <td>{{ event.eventType }}</td>
                <td>
                  <router-link v-if="event.eId" :to="{ name: 'Edit', params: { recordId: formatEid(event.eId) } }" @click="done">
                    {{ formatEid(event.eId) }}
                  </router-link>
                </td>
                <td>{{ event.lccn || '' }}</td>
                <td>{{ event.region || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </VueDragResize>
  </VueFinalModal>
</template>

<style scoped>
.marva-log-modal {
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  z-index: 1000;
}

.marva-log-content {
  padding: 1em;
  overflow-y: auto;
  height: 100%;
}

.marva-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
}

.marva-log-header h2 {
  margin: 0;
}

.marva-log-loading {
  padding: 2em;
  text-align: center;
  font-style: italic;
}

.marva-log-empty {
  padding: 2em;
  text-align: center;
  color: grey;
}

.marva-log-table-wrapper {
  overflow-y: auto;
}

.marva-log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.marva-log-table th {
  text-align: left;
  border-bottom: 2px solid #ccc;
  padding: 0.4em 0.6em;
  white-space: nowrap;
}

.marva-log-table td {
  padding: 0.4em 0.6em;
  border-bottom: 1px solid #eee;
}

.marva-log-table tbody tr:hover {
  background-color: #f5f5f5;
}

.marva-log-table a {
  color: inherit;
}
</style>
