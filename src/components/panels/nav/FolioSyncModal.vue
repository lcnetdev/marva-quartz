<script>
  import { useProfileStore } from '@/stores/profile'
  import { useConfigStore } from '@/stores/config'
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
        initalHeight: 550,
        initalLeft: (window.innerWidth / 2) - 300,
        bibLccn: '',
        authLccn: '',
        loading: false,
        error: null,
        result: null,
        bibSyncConfirm: false,
        authSyncConfirm: false,
      }
    },

    computed: {
      ...mapStores(useProfileStore, useConfigStore),
      ...mapWritableState(useProfileStore, ['showFolioSyncModal']),

      env() {
        return this.configStore.returnUrls.env === 'production' ? 'production' : 'staging'
      },

      baseUrl() {
        return this.configStore.returnUrls.util
      },

      authLccnValid() {
        return this.authLccn.trim().toLowerCase().startsWith('n')
      },

      canLookup() {
        let bib = this.bibLccn.trim()
        let auth = this.authLccn.trim()
        if (!bib && !auth) return false
        if (auth && !this.authLccnValid) return false
        return true
      },
    },

    methods: {
      done: function() {
        this.showFolioSyncModal = false
      },

      dragResize: function(newRect) {
        this.width = newRect.width
        this.height = newRect.height
        this.top = newRect.top
        this.left = newRect.left
        this.$refs.contentHolder.style.height = newRect.height + 'px'
      },

      onSelectElement(event) {
        const tagName = event.target.tagName
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
          event.stopPropagation()
        }
      },

      async lookup() {
        if (!this.canLookup) return

        let bib = this.bibLccn.trim()
        let auth = this.authLccn.trim()

        this.loading = true
        this.error = null
        this.result = null
        this.bibSyncConfirm = false
        this.authSyncConfirm = false

        let params = new URLSearchParams()
        if (bib) params.set('bibLccn', bib)
        if (auth) params.set('authLccn', auth)

        let url = `${this.baseUrl}folio/last-updated/${this.env}?${params.toString()}`

        try {
          let resp = await fetch(url)
          if (!resp.ok) {
            let text = await resp.text()
            throw new Error(text || `HTTP ${resp.status}`)
          }
          this.result = await resp.json()
        } catch (e) {
          this.error = e.message || 'Request failed'
        } finally {
          this.loading = false
        }
      },

      bibFolioUrl(lccn) {
        return `https://lcsg.catalog.lcap.loc.gov/inventory/view/32c88d0b-a4b5-49e0-90ef-941d7fe640b7?filters=staffSuppress.false&qindex=lccn&query=${encodeURIComponent(lccn)}&sort=title`
      },

      bibIdUrl(lccn) {
        return `http://preprod-8080.id.loc.gov/resources/instances/identifier/${encodeURIComponent(lccn)}`
      },

      authFolioUrl(lccn) {
        return `https://lcsg.catalog.lcap.loc.gov/marc-authorities?qindex=lccn&query=${encodeURIComponent(lccn)}&segment=search`
      },

      authIdUrl(lccn) {
        return `http://preprod-8080.id.loc.gov/authorities/${encodeURIComponent(lccn)}`
      },

      forceBibSync() {
        let lccn = this.result.bib.lccn
        window.open(`http://c2vlpndmsojump01.loc.gov/foliar/api/fetch_and_load/bib?lccn=${encodeURIComponent(lccn)}&serialization=json`, '_blank')
        this.bibSyncConfirm = false
      },

      forceAuthSync() {
        let lccn = this.result.authority.lccn
        window.open(`http://c2vlpndmsojump01.loc.gov/foliar/api/fetch_and_load/name?lccn=${encodeURIComponent(lccn)}&serialization=json`, '_blank')
        this.authSyncConfirm = false
      },

      newerClass(newerIn) {
        if (newerIn === 'FOLIO') return 'folio-newer-folio'
        if (newerIn === 'ID') return 'folio-newer-id'
        return 'folio-newer-same'
      },
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
      :w="600"
      :h="initalHeight"
      :x="initalLeft"
      :y="50"
      class="folio-sync-modal"
      @resizing="dragResize"
      @dragging="dragResize"
      :sticks="['br']"
      :stickSize="22"
    >
      <div class="folio-sync-content" ref="contentHolder" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">

        <div class="folio-sync-header">
          <h2>FOLIO Sync</h2>
          <button @click="done()" class="folio-close-btn">Close</button>
        </div>

        <div class="folio-sync-env">Environment: <strong>{{ env }}</strong></div>

        <div class="folio-sync-inputs">
          <div class="folio-input-row">
            <input type="text" v-model="bibLccn" placeholder="Bib Normalized LCCN" @keyup.enter="lookup()" />
          </div>
          <div class="folio-input-row">
            <input type="text" v-model="authLccn" placeholder="Auth LCCN (must start with n)" @keyup.enter="lookup()" />
            <div v-if="authLccn.trim() && !authLccnValid" class="folio-input-warn">Auth LCCN must start with "n"</div>
          </div>
          <button @click="lookup()" :disabled="loading || !canLookup">
            {{ loading ? 'Looking up...' : 'Look Up' }}
          </button>
        </div>

        <div v-if="error" class="folio-sync-error">{{ error }}</div>

        <div v-if="result" class="folio-sync-results">

          <!-- Bib section -->
          <div v-if="result.bib" class="folio-sync-section">
            <h3>Bib: {{ result.bib.lccn }}</h3>
            <table class="folio-sync-table">
              <thead>
                <tr><th></th><th>FOLIO</th><th>ID</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td class="folio-label">Record ID</td>
                  <td>{{ result.bib.folio?.hrid || '—' }}</td>
                  <td>{{ result.bib.id?.instanceId || '—' }}</td>
                </tr>
                <tr>
                  <td class="folio-label">Last Updated</td>
                  <td>{{ result.bib.comparison?.folio?.ago || '—' }}</td>
                  <td>{{ result.bib.comparison?.id?.ago || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="folio-sync-links">
              <a :href="bibFolioUrl(result.bib.lccn)" target="_blank">View in FOLIO</a>
              <a :href="bibIdUrl(result.bib.lccn)" target="_blank">View in ID</a>
            </div>

            <div class="folio-sync-action">
              <button v-if="!bibSyncConfirm" @click="bibSyncConfirm = true" class="folio-force-btn">Force FOLIO to Marva Bib Sync</button>
              <div v-if="bibSyncConfirm" class="folio-confirm">
                <span>Are you sure? It will overwrite what is currently in Marva.</span>
                <div class="folio-confirm-btns">
                  <button @click="forceBibSync()" class="folio-yes-btn">Yes</button>
                  <button @click="bibSyncConfirm = false" class="folio-cancel-btn">Cancel</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Authority section -->
          <div v-if="result.authority" class="folio-sync-section">
            <h3>Authority: {{ result.authority.lccn }}</h3>
            <table class="folio-sync-table">
              <thead>
                <tr><th></th><th>FOLIO</th><th>ID</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td class="folio-label">Record ID</td>
                  <td>{{ result.authority.folio?.hrid || '—' }}</td>
                  <td>{{ result.authority.id?.instanceId || '—' }}</td>
                </tr>
                <tr>
                  <td class="folio-label">Last Updated</td>
                  <td>{{ result.authority.comparison?.folio?.ago || '—' }}</td>
                  <td>{{ result.authority.comparison?.id?.ago || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="folio-sync-links">
              <a :href="authFolioUrl(result.authority.lccn)" target="_blank">View in FOLIO</a>
              <a :href="authIdUrl(result.authority.lccn)" target="_blank">View in ID</a>
            </div>

            <div class="folio-sync-action">
              <button v-if="!authSyncConfirm" @click="authSyncConfirm = true" class="folio-force-btn">Force Marva/ID NAR to FOLIO Sync</button>
              <div v-if="authSyncConfirm" class="folio-confirm">
                <span>Are you sure you want to send the NAR ID to FOLIO?</span>
                <div class="folio-confirm-btns">
                  <button @click="forceAuthSync()" class="folio-yes-btn">Yes</button>
                  <button @click="authSyncConfirm = false" class="folio-cancel-btn">Cancel</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </VueDragResize>
  </VueFinalModal>
</template>

<style scoped>
  .folio-sync-modal {
    background-color: whitesmoke;
  }

  .folio-sync-content {
    background-color: whitesmoke;
    padding: 10px;
    height: 100%;
    overflow-y: auto;
  }

  .folio-sync-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .folio-sync-header h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .folio-close-btn {
    background-color: white;
    border-radius: 5px;
    border: solid 1px black;
    cursor: pointer;
    padding: 4px 12px;
  }

  .folio-sync-env {
    font-size: 0.85rem;
    color: #555;
    margin-bottom: 12px;
  }

  .folio-sync-inputs {
    margin-bottom: 15px;
  }

  .folio-input-row {
    margin-bottom: 8px;
  }

  .folio-input-row input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
    box-sizing: border-box;
  }

  .folio-input-warn {
    color: #b71c1c;
    font-size: 0.8rem;
    margin-top: 3px;
  }

  .folio-sync-inputs > button {
    padding: 8px 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #1976d2;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .folio-sync-inputs > button:disabled {
    background: #aaa;
    cursor: default;
  }

  .folio-sync-inputs > button:hover:not(:disabled) {
    background: #1565c0;
  }

  .folio-sync-error {
    color: #b71c1c;
    padding: 10px;
    margin-bottom: 10px;
    background: #ffebee;
    border-radius: 4px;
  }

  .folio-sync-results {
    margin-top: 5px;
  }

  .folio-sync-section {
    margin-bottom: 20px;
  }

  .folio-sync-section h3 {
    font-size: 1rem;
    margin: 0 0 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #ddd;
  }

  .folio-sync-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .folio-sync-table th {
    text-align: left;
    padding: 4px 8px;
    border-bottom: 2px solid #ddd;
    font-weight: 600;
  }

  .folio-sync-table td {
    padding: 5px 8px;
    border-bottom: 1px solid #eee;
  }

  .folio-label {
    font-weight: 600;
    color: #555;
    width: 110px;
  }

  .folio-sync-links {
    margin-top: 8px;
    display: flex;
    gap: 16px;
  }

  .folio-sync-links a {
    color: #1976d2;
    font-size: 0.85rem;
    text-decoration: none;
  }

  .folio-sync-links a:hover {
    text-decoration: underline;
  }

  .folio-sync-action {
    margin-top: 10px;
  }

  .folio-force-btn {
    padding: 6px 14px;
    border: 1px solid #c62828;
    border-radius: 4px;
    background: #e53935;
    color: white;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .folio-force-btn:hover {
    background: #c62828;
  }

  .folio-confirm {
    background: #fff3e0;
    border: 1px solid #ef6c00;
    border-radius: 4px;
    padding: 10px;
    font-size: 0.85rem;
  }

  .folio-confirm-btns {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }

  .folio-yes-btn {
    padding: 5px 16px;
    background: #e53935;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .folio-yes-btn:hover {
    background: #c62828;
  }

  .folio-cancel-btn {
    padding: 5px 16px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .folio-cancel-btn:hover {
    background: #f0f0f0;
  }

  .folio-newer-folio {
    color: #e65100;
    font-weight: bold;
  }

  .folio-newer-id {
    color: #1b5e20;
    font-weight: bold;
  }

  .folio-newer-same {
    color: #555;
  }

  .folio-diff {
    font-weight: normal;
    font-size: 0.8rem;
    color: #777;
    margin-left: 4px;
  }
</style>
