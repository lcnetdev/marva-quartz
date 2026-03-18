<script>
  import { useProfileStore } from '@/stores/profile'
  import utilsNetwork from '@/lib/utils_network'
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
        initalLeft: (window.innerWidth / 2) - 350,
      }
    },

    computed: {
      ...mapStores(useProfileStore),
      ...mapWritableState(useProfileStore, ['showUserDirectoryModal', 'userDirectoryResults', 'userDirectoryLoading']),
    },

    methods: {
      done: function(){
        this.showUserDirectoryModal = false
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
    },

    async mounted(){
      this.userDirectoryLoading = true
      this.userDirectoryResults = await utilsNetwork.queryUsers()
      this.userDirectoryLoading = false
    },
  }
</script>

<template>
  <VueFinalModal
    display-directive="show"
    :hide-overlay="false"
    :overlay-transition="'vfm-fade'"
    :click-to-close="true"
    :esc-to-close="true"
  >
    <VueDragResize
      :is-active="true"
      :w="700"
      :h="initalHeight"
      :x="initalLeft"
      class="user-directory-modal"
      @resizing="dragResize"
      @dragging="dragResize"
      :sticks="['br']"
      :stickSize="22"
    >
      <div class="user-directory-content" ref="contentHolder" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

        <div class="user-directory-header">
          <h2>User Directory</h2>
          <button @click="done">Close</button>
        </div>

        <div v-if="userDirectoryLoading" class="user-directory-loading">
          Loading...
        </div>

        <div v-else-if="userDirectoryResults.length === 0" class="user-directory-empty">
          No users found.
        </div>

        <div v-else class="user-directory-table-wrapper">
          <table class="user-directory-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Cat ID</th>
                <th>Previous Cat IDs</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userDirectoryResults" :key="user.username">
                <td class="selectable">{{ user.name || '' }}</td>
                <td class="selectable">{{ user.username }}</td>
                <td class="selectable">{{ user.catId || '' }}</td>
                <td class="selectable">{{ user.catIdHistory && user.catIdHistory.length > 0 ? user.catIdHistory.join(', ') : '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </VueDragResize>
  </VueFinalModal>
</template>

<style scoped>
.user-directory-modal {
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  z-index: 1000;
}

.user-directory-content {
  padding: 1em;
  overflow-y: auto;
  height: 100%;
}

.user-directory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
}

.user-directory-header h2 {
  margin: 0;
}

.user-directory-loading {
  padding: 2em;
  text-align: center;
  font-style: italic;
}

.user-directory-empty {
  padding: 2em;
  text-align: center;
  color: grey;
}

.user-directory-table-wrapper {
  overflow-y: auto;
}

.user-directory-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.user-directory-table th {
  text-align: left;
  border-bottom: 2px solid #ccc;
  padding: 0.4em 0.6em;
  white-space: nowrap;
}

.user-directory-table td {
  padding: 0.4em 0.6em;
  border-bottom: 1px solid #eee;
}

.user-directory-table tbody tr:hover {
  background-color: #f5f5f5;
}

.selectable {
  user-select: text;
  cursor: text;
}
</style>
