<template>
  <VueFinalModal
    display-directive="show"
    :hide-overlay="true"
    :overlay-transition="'vfm-fade'"
    @closed="closeModal()"
  >
    <VueDragResize
      :is-active="true"
      :w="900"
      :h="640"
      :x="150"
      :y="40"
      @resizing="dragResize"
      @dragging="dragResize"
      :sticks="['br']"
      :stickSize="22"
      style="background-color: whitesmoke; box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);"
    >
      <div class="ms-modal" ref="msContent" @mousedown="onSelectElement($event)" @touchstart="onSelectElement($event)">
        <div>
          <div class="ms-menu-button">
            <button @click="closeModal()" class="close-button">Close</button>
          </div>
        </div>

        <div class="ms-container">
          <div class="ms-header">
            <h1 class="ms-title">Marva Scan</h1>
            <span v-if="liveActivity" class="ms-live-activity">
              <span class="ms-live-dot"></span>
              <i>{{ liveActivity }}</i>
            </span>
          </div>

          <div class="ms-tabs" role="tablist">
            <button
              v-for="t in tabs"
              :key="t.id"
              :class="['ms-tab', { active: activeTab === t.id }]"
              @click="activeTab = t.id"
              role="tab"
              :aria-selected="activeTab === t.id"
            >{{ t.label }}</button>
          </div>

          <div v-if="needsIdentifierWarning" class="ms-warn-banner">
            <strong>No LCCN or ISBN found in record</strong> — will use Marva E number instead
            <span class="ms-warn-hint">(likely want to add LCCN or ISBN)</span>
          </div>

          <div v-if="hasErrors" class="ms-errors">
            <div v-for="(err, cat) in activeCategoryErrors" :key="cat" class="ms-error-banner">
              <strong>{{ humanCategory(cat) }} scan failed:</strong>
              {{ err.message || err.error }}
              <span class="ms-error-hint">— try again</span>
            </div>
          </div>

          <!-- ============ SCAN TAB ============ -->
          <div v-if="activeTab === 'scan'" class="ms-tabpanel">
            <!-- Pairing card: hidden once any live data has arrived this session,
                 but kept visible in webcam mode so the camera controls remain usable. -->
            <div v-if="!liveDataReceived || captureSource === 'webcam'" class="ms-grid">
              <div class="ms-card ms-qr-card">
                <div class="ms-source-toggle">
                  <label class="ms-source-radio">
                    <input type="radio" value="phone" v-model="captureSource" />
                    <span>Phone</span>
                  </label>
                  <label class="ms-source-radio">
                    <input type="radio" value="webcam" v-model="captureSource" />
                    <span>Webcam</span>
                  </label>
                </div>

                <div v-show="captureSource === 'phone'">
                  <h2>Scan with your phone</h2>
                  <div :class="['ms-status', statusClass]">
                    <span>{{ statusMessage || 'Idle' }}</span>
                  </div>
                  <div class="ms-qr-container">
                    <span v-if="!qrReady" class="ms-muted">Waiting for connection…</span>
                    <!-- Vue-opaque mount point: qr-code-styling appends raw SVG nodes
                         here and Vue must never try to diff those children. -->
                    <div v-once ref="qrContainer" class="ms-qr-mount"></div>
                  </div>
                  <div class="ms-qr-meta">
                    <div v-if="connectionId">
                      <span class="ms-label">Connection</span>
                      <code>{{ connectionId }}</code>
                    </div>
                    <div v-if="resourceId">
                      <span class="ms-label">Resource ID</span>
                      <code>{{ resourceId }}</code>
                    </div>
                    <div v-if="qrUrl" class="ms-qrurl">
                      <a :href="qrUrl" target="_blank" rel="noopener">Open mobile link</a>
                    </div>
                  </div>
                  <div class="ms-actions">
                    <button @click="restart()" :disabled="isConnecting">Reconnect</button>
                  </div>
                </div>

                <div v-show="captureSource === 'webcam'">
                  <div class="ms-webcam-device-row">
                    <label class="ms-webcam-device-label">
                      <span>Camera</span>
                      <select v-model="webcamDeviceId" @change="onWebcamDeviceChanged()">
                        <option v-if="webcamDevices.length === 0" value="">(no cameras found)</option>
                        <option v-for="d in webcamDevices" :key="d.deviceId" :value="d.deviceId">
                          {{ d.label || 'Camera ' + d.deviceId.slice(0, 6) }}
                        </option>
                      </select>
                    </label>
                    <button class="ms-webcam-refresh" @click="enumerateWebcams()" title="Refresh device list">↻</button>
                  </div>

                  <div class="ms-webcam-stage">
                    <video
                      ref="webcamVideo"
                      class="ms-webcam-video"
                      autoplay
                      playsinline
                      muted
                    ></video>
                    <div v-if="webcamError" class="ms-webcam-error">{{ webcamError }}</div>
                    <div v-else-if="!webcamReady" class="ms-webcam-overlay">
                      <span class="ms-muted">{{ webcamStarting ? 'Starting camera…' : 'No camera active' }}</span>
                    </div>
                    <div v-if="webcamFlashing" class="ms-webcam-flash"></div>
                    <div v-if="webcamToast" class="ms-webcam-toast">{{ webcamToast }}</div>
                  </div>

                  <div class="ms-webcam-categories">
                    <button
                      v-for="cat in webcamCategoryButtons"
                      :key="'wc-'+cat.id"
                      class="ms-webcam-cat-btn"
                      :class="{ active: webcamSelectedCategory === cat.id }"
                      :disabled="!webcamReady || webcamCapturing"
                      @click="captureWebcam(cat.id, cat.multi)"
                    >{{ cat.label }}</button>
                  </div>

                  <div v-if="webcamTocPages.length > 0" class="ms-webcam-toc-bar">
                    <button
                      class="ms-webcam-toc-reset"
                      :disabled="webcamCapturing"
                      @click="resetWebcamToc()"
                    >Reset</button>
                    <span class="ms-webcam-toc-count">
                      {{ webcamTocPages.length }} {{ webcamTocPages.length === 1 ? 'page' : 'pages' }}
                    </span>
                    <button
                      class="ms-webcam-toc-send"
                      :disabled="webcamCapturing"
                      @click="sendWebcamTocBundle()"
                    >Send All</button>
                  </div>

                  <div class="ms-qr-meta">
                    <div v-if="connectionId">
                      <span class="ms-label">Connection</span>
                      <code>{{ connectionId }}</code>
                    </div>
                    <div v-if="resourceId">
                      <span class="ms-label">Resource ID</span>
                      <code>{{ resourceId }}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ms-card ms-side-card">
                <h2>Existing data</h2>
                <div v-if="retrieveLoading" class="ms-muted">Checking server for prior scans…</div>
                <div v-else-if="retrieveError" class="ms-error">{{ retrieveError }}</div>
                <div v-else-if="retrieveLookups.length === 0" class="ms-muted">
                  No ISBN or LCCN found on this profile to look up.
                </div>
                <ul v-else class="ms-lookup-list">
                  <li v-for="(l, idx) in retrieveLookups" :key="idx" :class="{ found: l.found }">
                    <code>{{ l.rid }}</code>
                    <span v-if="l.found" class="ms-found">found</span>
                    <span v-else-if="l.error" class="ms-error-inline">error: {{ l.error }}</span>
                    <span v-else class="ms-muted">no data</span>
                  </li>
                </ul>

                <template v-if="hasRetrieved">
                  <h3>Retrieved categories</h3>
                  <ul class="ms-cat-list">
                    <li v-for="(cats, rid) in retrievedResults" :key="rid">
                      <code>{{ rid }}</code>: {{ Object.keys(cats).join(', ') || '—' }}
                    </li>
                  </ul>
                </template>
              </div>
            </div>

            <!-- Insertable components, surfaced from merged (live + retrieved) data. -->
            <div class="ms-card ms-inserts-card">
              <h2>Insert from scanned data</h2>
              <p class="ms-muted" v-if="!titleProposal && !sorProposal && !editionProposal && !provisionProposal && !primaryAuthorProposal && otherContributorsProposal.length === 0 && summaryProposals.length === 0 && !tocProposal && !ocrProposal && !isbnProposal">
                Capture a title page, copyright page, summary, back cover, table of contents, or OCR to enable insertions.
              </p>

              <div v-if="titleProposal" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>Title <span class="ms-source-badge">{{ titleSourceLabel }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertTitle()">Insert into Instance and Work</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Main title</span>
                    <input type="text" :value="titleMainValue" @input="titleMainOverride = $event.target.value" />
                  </label>
                  <label>
                    <span>Subtitle</span>
                    <input type="text" :value="titleSubValue" @input="titleSubOverride = $event.target.value" placeholder="(optional)" />
                  </label>
                </div>
                <div v-if="titleInsertedAt" class="ms-insert-confirm">
                  Inserted {{ formatTime(titleInsertedAt) }}
                </div>
              </div>

              <div v-if="sorProposal" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>Statement of responsibility <span class="ms-source-badge">{{ sorSourceLabel }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertSor()">Insert into Instance</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Statement</span>
                    <input type="text" :value="sorValue" @input="sorOverride = $event.target.value" />
                  </label>
                </div>
                <div v-if="sorInsertedAt" class="ms-insert-confirm">
                  Inserted {{ formatTime(sorInsertedAt) }}
                </div>
              </div>

              <div v-if="editionProposal" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>Edition statement <span class="ms-source-badge">{{ editionSourceLabel }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertEdition()">Insert into Instance</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Statement</span>
                    <input type="text" :value="editionValue" @input="editionOverride = $event.target.value" />
                  </label>
                </div>
                <div v-if="editionInsertedAt" class="ms-insert-confirm">
                  Inserted {{ formatTime(editionInsertedAt) }}
                </div>
              </div>

              <div v-if="isbnProposal" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>ISBN <span class="ms-source-badge">{{ isbnSourceLabel }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertIsbn()">Insert into Instance</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Number</span>
                    <input type="text" :value="isbnValue" @input="isbnOverride = $event.target.value" />
                  </label>
                </div>
                <div v-if="isbnInsertedAt" class="ms-insert-confirm">
                  Inserted {{ formatTime(isbnInsertedAt) }}
                </div>
              </div>

              <div v-if="provisionProposal" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>Publication info <span class="ms-source-badge">{{ provisionSourceLabel }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertProvision()">Insert into Instance</button>
                </div>
                <div class="ms-insert-fields ms-insert-fields-grid">
                  <label>
                    <span>Date</span>
                    <input type="text" :value="provisionDateValue" @input="provisionDateOverride = $event.target.value" />
                  </label>
                  <label>
                    <span>Publisher</span>
                    <input type="text" :value="provisionPublisherValue" @input="provisionPublisherOverride = $event.target.value" />
                  </label>
                  <label>
                    <span>Place code</span>
                    <input type="text" :value="provisionPlaceCodeValue" @input="provisionPlaceCodeOverride = $event.target.value" placeholder="MARC code, e.g. xxu" />
                    <span v-if="provisionPlaceLabelDerived && provisionPlaceLabelDerived !== provisionPlaceCodeValue" class="ms-place-label-hint">→ {{ provisionPlaceLabelDerived }}</span>
                  </label>
                  <label>
                    <span>City</span>
                    <input type="text" :value="provisionCityValue" @input="provisionCityOverride = $event.target.value" />
                  </label>
                </div>
                <div v-if="provisionInsertedAt" class="ms-insert-confirm">
                  Inserted {{ formatTime(provisionInsertedAt) }}
                </div>
              </div>

              <div v-if="primaryAuthorProposal" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>Primary author <span class="ms-source-badge">{{ titlePageSourceLabel }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertPrimaryAuthor()">Insert into Work</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Name</span>
                    <input type="text" :value="primaryAuthorNameValue" @input="primaryAuthorNameOverride = $event.target.value" />
                  </label>
                  <div class="ms-role-meta">
                    <span class="ms-label">Role(s)</span>
                    <span>{{ formatRoles(primaryAuthorProposal.roles) }}</span>
                  </div>
                </div>
                <div v-if="primaryAuthorInsertedAt" class="ms-insert-confirm">
                  Inserted {{ formatTime(primaryAuthorInsertedAt) }}
                </div>
              </div>

              <div v-for="(c, idx) in otherContributorsProposal" :key="'contrib-'+idx" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>Contributor <span class="ms-source-badge">{{ titlePageSourceLabel }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertContributor(idx)">Insert into Work</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Name</span>
                    <input type="text" :value="contributorNameValue(idx)" @input="setContributorName(idx, $event.target.value)" />
                  </label>
                  <div class="ms-role-meta">
                    <span class="ms-label">Role(s)</span>
                    <span>{{ formatRoles(c.roles) }}</span>
                  </div>
                </div>
                <div v-if="contributorInsertedAt[idx]" class="ms-insert-confirm">
                  Inserted {{ formatTime(contributorInsertedAt[idx]) }}
                </div>
              </div>

              <div v-for="(s, idx) in summaryProposals" :key="'summary-'+s.source+'-'+idx" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>Summary <span class="ms-source-sub">from {{ summarySourceTitle(s.source) }}</span> <span class="ms-source-badge">{{ summarySourceLabel(s.source) }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertSummary(s.source)">Insert into Work</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Text</span>
                    <textarea class="ms-summary-text" rows="5" :value="summaryValue(s.source)" @input="setSummary(s.source, $event.target.value)"></textarea>
                  </label>
                </div>
                <div v-if="summaryInsertedAt[s.source]" class="ms-insert-confirm">
                  Inserted {{ formatTime(summaryInsertedAt[s.source]) }}
                </div>
              </div>

              <div v-if="tocProposal" class="ms-insert-block">
                <div class="ms-insert-head">
                  <h3>Table of contents <span class="ms-source-badge">{{ tocSourceLabel }}</span></h3>
                  <button class="ms-insert-btn" @click="doInsertToc()">Insert into Work</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Contents</span>
                    <textarea class="ms-summary-text" rows="8" :value="tocValue" @input="tocOverride = $event.target.value"></textarea>
                  </label>
                </div>
                <div v-if="tocInsertedAt" class="ms-insert-confirm">
                  Inserted {{ formatTime(tocInsertedAt) }}
                </div>
              </div>

              <div v-if="ocrProposal" class="ms-insert-block ms-ocr-block">
                <div class="ms-insert-head">
                  <h3>OCR text <span class="ms-source-badge">{{ ocrSourceLabel }}</span></h3>
                  <button class="ms-copy-clip-btn" @click="copyOcr()">{{ ocrCopyLabel }}</button>
                </div>
                <div class="ms-insert-fields">
                  <label>
                    <span>Raw text (read-only)</span>
                    <textarea class="ms-summary-text ms-ocr-text" rows="10" :value="ocrProposal.text" readonly></textarea>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- ============ IMAGES TAB ============ -->
          <div v-else-if="activeTab === 'images'" class="ms-tabpanel">
            <div class="ms-card ms-images-card">
              <div class="ms-images-header">
                <h2>Captured images</h2>
                <p v-if="availableCategories.length === 0" class="ms-muted">
                  No image categories available yet — capture a page or wait for the existing-data probe.
                </p>
              </div>

              <div v-if="availableCategories.length > 0" class="ms-image-tabs">
                <button
                  v-for="cat in availableCategories"
                  :key="'img-tab-'+cat"
                  :class="['ms-image-tab', { active: activeImageCategory === cat }]"
                  @click="loadImageCategory(cat)"
                >{{ humanCategory(cat) }}</button>
              </div>

              <div
                v-if="activeImageCategory === 'toc' && tocPageCount > 1"
                class="ms-toc-pages"
              >
                <span class="ms-toc-pages-label">TOC pages:</span>
                <button
                  v-for="n in tocPageCount"
                  :key="'toc-page-'+n"
                  :class="['ms-toc-page-btn', { active: imageIndex === n }]"
                  @click="loadTocPage(n)"
                >{{ n }}</button>
                <span v-if="tocProbing" class="ms-muted">probing…</span>
              </div>

              <div v-if="activeImageCategory" class="ms-image-stage">
                <div v-if="imageLoading" class="ms-muted">Loading image…</div>
                <div v-else-if="imageError" class="ms-error">{{ imageError }}</div>
                <div
                  v-else-if="imageUrl"
                  class="ms-image-frame"
                  @mousemove="onImageMouseMove($event)"
                  @mouseenter="magnifierVisible = true"
                  @mouseleave="magnifierVisible = false"
                >
                  <img
                    ref="scanImage"
                    :src="imageUrl"
                    class="ms-scan-image"
                    @load="onImageLoad()"
                    alt="Scanned page"
                  />
                  <div
                    v-show="magnifierVisible && imageNaturalWidth"
                    class="ms-magnifier"
                    :style="magnifierStyle"
                  ></div>
                </div>
                <div v-else class="ms-muted">No image available for this page.</div>
              </div>
            </div>
          </div>

          <!-- ============ DEBUG TAB ============ -->
          <div v-else-if="activeTab === 'debug'" class="ms-tabpanel">
            <div class="ms-card ms-debug-card">
              <div class="ms-debug-header">
                <h2>Debug — all data</h2>
                <button class="ms-copy-btn" @click="copyDebug()">{{ copyLabel }}</button>
              </div>

              <h3>Live results (this session)</h3>
              <pre class="ms-debug-pre">{{ formatJson(resultsByCategory) }}</pre>

              <h3>Retrieved results</h3>
              <pre class="ms-debug-pre">{{ formatJson(retrievedResults) }}</pre>

              <h3>Merged (live overlays retrieved)</h3>
              <pre class="ms-debug-pre">{{ formatJson(mergedDataByCategory) }}</pre>

              <h3>Event log (newest first)</h3>
              <div class="ms-events-list">
                <div v-for="(ev, idx) in events" :key="idx" :class="['ms-event', ev.kind]">
                  <div class="ms-event-head">
                    <span class="ms-event-kind">{{ ev.kind }}</span>
                    <span class="ms-event-cat" v-if="ev.data && ev.data.category">{{ ev.data.category }}</span>
                    <span class="ms-event-time">{{ formatTime(ev.at) }}</span>
                  </div>
                  <pre class="ms-event-body">{{ formatEvent(ev) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VueDragResize>
  </VueFinalModal>
</template>

<script>
import { VueFinalModal } from 'vue-final-modal'
import VueDragResize from 'vue3-drag-resize'
import { mapStores, mapState, mapWritableState } from 'pinia'
import { useMarvaScanStore, MARVA_SCAN_STATUS } from '@/stores/marvaScan'
import { MarvaScan } from '@/lib/marva_scan'

const HUMAN_CATEGORY = {
  cover: 'Cover',
  copyright: 'Copyright page',
  title_page: 'Title page',
  toc: 'Table of contents',
  summary: 'Summary',
  back_cover: 'Back cover',
  ocr: 'OCR',
}

const WEBCAM_CATEGORIES = [
  { id: 'cover',      label: 'Cover',         multi: false },
  { id: 'summary',    label: 'Summary',       multi: false },
  { id: 'title_page', label: 'Title Page',    multi: false },
  { id: 'copyright',  label: 'Copyright',     multi: false },
  { id: 'ocr',        label: 'Just OCR',      multi: false },
  { id: 'llm_ocr',    label: 'Non-Latin OCR', multi: false },
  { id: 'toc',        label: 'TOC',           multi: true  },
  { id: 'back_cover', label: 'Back Cover',    multi: false },
]

const WEBCAM_PREF_KEY = 'marvaScan.webcam.preferences.v1'

export default {
  name: 'MarvaScanModal',
  components: { VueFinalModal, VueDragResize },

  data() {
    return {
      activeTab: 'scan',
      tabs: [
        { id: 'scan', label: 'Scan' },
        { id: 'images', label: 'Images' },
        { id: 'debug', label: 'Debug' },
      ],
      // User-edit overrides; null means "show whatever the live proposal has".
      titleMainOverride: null,
      titleSubOverride: null,
      titleInsertedAt: null,
      sorOverride: null,
      sorInsertedAt: null,
      editionOverride: null,
      editionInsertedAt: null,
      // Primary author: single override (name only — roles aren't editable in the prototype).
      primaryAuthorNameOverride: null,
      primaryAuthorInsertedAt: null,
      // Per-contributor name overrides keyed by index, plus inserted timestamps.
      contributorNameOverrides: {},
      contributorInsertedAt: {},
      // Summary text overrides keyed by source ('summary' / 'back_cover'), plus
      // inserted timestamps so the user can confirm each insertion separately.
      summaryOverrides: {},
      summaryInsertedAt: {},
      tocOverride: null,
      tocInsertedAt: null,
      // ISBN: editable override + inserted timestamp, same pattern as the others.
      isbnOverride: null,
      isbnInsertedAt: null,
      // Provision activity per-field overrides; null means "follow the proposal".
      provisionDateOverride: null,
      provisionPublisherOverride: null,
      provisionPlaceCodeOverride: null,
      provisionCityOverride: null,
      provisionInsertedAt: null,
      ocrCopyLabel: 'Copy to Clipboard',
      copyLabel: 'Copy JSON',

      // Images tab state.
      activeImageCategory: null,
      imageUrl: null,
      imageLoading: false,
      imageError: null,
      imageNaturalWidth: 0,
      imageNaturalHeight: 0,
      magnifierVisible: false,
      magnifierX: 0,
      magnifierY: 0,
      magnifierZoom: 2.5,
      magnifierSize: 180,
      // For multi-page categories (TOC). 1-based.
      imageIndex: 1,
      tocPageCount: 0,
      tocProbing: false,
      // Bumped per request so loadImageCategory can ignore stale fetches.
      imageRequestId: 0,

      // ---- Webcam capture (alternative to phone QR pairing) ----
      // 'phone' or 'webcam'. Initialized from localStorage on mount.
      captureSource: 'phone',
      // List of MediaDeviceInfo (videoinput only) discovered via enumerateDevices.
      webcamDevices: [],
      // Currently selected device id; falls back to first device when the saved
      // one isn't available anymore.
      webcamDeviceId: '',
      // Active MediaStream; null when stopped.
      webcamStream: null,
      webcamReady: false,
      webcamStarting: false,
      webcamError: null,
      // Default category — clicking a category button captures immediately.
      webcamSelectedCategory: 'title_page',
      webcamCapturing: false,
      webcamFlashing: false,
      webcamToast: '',
      // Accumulated TOC pages waiting to be sent as a bundle.
      webcamTocPages: [],
    }
  },

  computed: {
    ...mapStores(useMarvaScanStore),
    ...mapState(useMarvaScanStore, [
      'status',
      'statusMessage',
      'connectionId',
      'resourceId',
      'qrUrl',
      'qrReady',
      'events',
      'resultsByCategory',
      'retrievedResults',
      'retrieveLookups',
      'retrieveLoading',
      'retrieveError',
      'liveDataReceived',
      'liveActivity',
      'activeCategoryErrors',
      'needsIdentifierWarning',
      'availableCategories',
      'mergedDataByCategory',
      'titleProposal',
      'sorProposal',
      'editionProposal',
      'primaryAuthorProposal',
      'otherContributorsProposal',
      'summaryProposals',
      'tocProposal',
      'ocrProposal',
      'provisionProposal',
      'isbnProposal',
    ]),
    ...mapWritableState(useMarvaScanStore, ['showModal']),

    isConnecting() {
      return this.status === MARVA_SCAN_STATUS.CONNECTING
    },

    statusClass() {
      return 'ms-status-' + (this.status || 'idle')
    },

    hasRetrieved() {
      return Object.keys(this.retrievedResults || {}).length > 0
    },

    hasErrors() {
      return Object.keys(this.activeCategoryErrors || {}).length > 0
    },

    titleSourceLabel() {
      // If live title_page has data, it wins; otherwise it's from /retrieve.
      if (this.resultsByCategory && this.resultsByCategory.title_page) return 'live scan'
      return 'retrieved'
    },

    titleMainValue() {
      if (this.titleMainOverride !== null) return this.titleMainOverride
      return (this.titleProposal && this.titleProposal.mainTitle) || ''
    },

    titleSubValue() {
      if (this.titleSubOverride !== null) return this.titleSubOverride
      return (this.titleProposal && this.titleProposal.subtitle) || ''
    },

    sorValue() {
      if (this.sorOverride !== null) return this.sorOverride
      return (this.sorProposal && this.sorProposal.text) || ''
    },

    sorSourceLabel() {
      if (this.resultsByCategory && this.resultsByCategory.title_page) return 'live scan'
      return 'retrieved'
    },

    editionValue() {
      if (this.editionOverride !== null) return this.editionOverride
      return (this.editionProposal && this.editionProposal.text) || ''
    },

    editionSourceLabel() {
      if (this.resultsByCategory && this.resultsByCategory.copyright) return 'live scan'
      return 'retrieved'
    },

    titlePageSourceLabel() {
      if (this.resultsByCategory && this.resultsByCategory.title_page) return 'live scan'
      return 'retrieved'
    },

    primaryAuthorNameValue() {
      if (this.primaryAuthorNameOverride !== null) return this.primaryAuthorNameOverride
      return (this.primaryAuthorProposal && this.primaryAuthorProposal.name) || ''
    },

    tocValue() {
      if (this.tocOverride !== null) return this.tocOverride
      return (this.tocProposal && this.tocProposal.text) || ''
    },

    isbnValue() {
      if (this.isbnOverride !== null) return this.isbnOverride
      return (this.isbnProposal && this.isbnProposal.value) || ''
    },

    isbnSourceLabel() {
      if (this.resultsByCategory && this.resultsByCategory.back_cover) return 'live scan'
      return 'retrieved'
    },

    tocSourceLabel() {
      if (this.resultsByCategory && this.resultsByCategory.toc) return 'live scan'
      return 'retrieved'
    },

    ocrSourceLabel() {
      // Match the source the ocrProposal getter actually chose, so the badge
      // tells the user which extractor produced the text shown above it.
      const src = this.ocrProposal && this.ocrProposal.source
      const live = this.resultsByCategory && this.resultsByCategory[src || 'ocr']
      if (src === 'llm_ocr') return live ? 'live scan (non-Latin)' : 'retrieved (non-Latin)'
      return live ? 'live scan' : 'retrieved'
    },

    provisionSourceLabel() {
      // "live scan" if either copyright or title_page came in this session.
      if (this.resultsByCategory && (this.resultsByCategory.copyright || this.resultsByCategory.title_page)) return 'live scan'
      return 'retrieved'
    },

    provisionDateValue() {
      if (this.provisionDateOverride !== null) return this.provisionDateOverride
      return (this.provisionProposal && this.provisionProposal.date) || ''
    },

    provisionPublisherValue() {
      if (this.provisionPublisherOverride !== null) return this.provisionPublisherOverride
      return (this.provisionProposal && this.provisionProposal.publisher) || ''
    },

    provisionPlaceCodeValue() {
      if (this.provisionPlaceCodeOverride !== null) return this.provisionPlaceCodeOverride
      return (this.provisionProposal && this.provisionProposal.placeCode) || ''
    },

    provisionCityValue() {
      if (this.provisionCityOverride !== null) return this.provisionCityOverride
      return (this.provisionProposal && this.provisionProposal.city) || ''
    },

    provisionPlaceLabelDerived() {
      // The store's `provisionProposal` already resolved a human label via the
      // full MARC code map; show that whenever the user hasn't overridden the code.
      const codeOverride = this.provisionPlaceCodeOverride
      if (codeOverride === null) {
        return (this.provisionProposal && this.provisionProposal.placeLabel) || ''
      }
      // User edited the code — leave the label empty here; the store will
      // re-derive it via placeLabelForCode() when we call insertProvisionActivity().
      return ''
    },

    webcamCategoryButtons() {
      return WEBCAM_CATEGORIES
    },

    /**
     * Style for the magnifier circle. Centered on the cursor, with the source
     * image as background, scaled by `magnifierZoom`, positioned so the area
     * under the cursor is centered in the lens.
     */
    magnifierStyle() {
      if (!this.imageUrl || !this.imageNaturalWidth) return { display: 'none' }
      const half = this.magnifierSize / 2
      // Image is rendered with its natural aspect ratio fit to the frame width.
      // We need the rendered dimensions to compute the right background-size.
      const img = this.$refs.scanImage
      const renderedW = img ? img.clientWidth : this.imageNaturalWidth
      const renderedH = img ? img.clientHeight : this.imageNaturalHeight
      const bgW = renderedW * this.magnifierZoom
      const bgH = renderedH * this.magnifierZoom
      const bgX = -(this.magnifierX * this.magnifierZoom - half)
      const bgY = -(this.magnifierY * this.magnifierZoom - half)
      return {
        width: this.magnifierSize + 'px',
        height: this.magnifierSize + 'px',
        left: (this.magnifierX - half) + 'px',
        top: (this.magnifierY - half) + 'px',
        backgroundImage: `url('${this.imageUrl}')`,
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
      }
    },
  },

  // No watchers on store getters — they are surprisingly expensive here because
  // the modal is wrapped in VueDragResize, which re-renders 60×/s during drag.
  // The only watcher is a local one for the capture-source toggle (cheap: just
  // a string equality check) so we can start/stop the webcam on switch.
  watch: {
    captureSource(next, prev) {
      if (next === prev) return
      this.persistWebcamPreferences()
      if (next === 'webcam') {
        this.startWebcam()
      } else {
        this.stopWebcam()
      }
    },

    // Switching tabs unmounts the scan panel and destroys the <video> element.
    // When we come back to scan in webcam mode, the stream is still alive but
    // detached from any DOM node — re-attach it (or restart if it was lost).
    activeTab(next) {
      if (next !== 'scan' || this.captureSource !== 'webcam') return
      this.$nextTick(() => {
        if (this._unmounted) return
        const video = this.$refs.webcamVideo
        if (!video) return
        if (this.webcamStream && this.webcamStream.active) {
          video.srcObject = this.webcamStream
          video.play().catch(() => { /* autoplay may be blocked */ })
          this.webcamReady = true
        } else {
          this.startWebcam()
        }
      })
    },
  },

  methods: {
    dragResize(newRect) {
      if (this.$refs.msContent) {
        this.$refs.msContent.style.height = newRect.height + 'px'
      }
    },

    closeModal() {
      this.marvaScanStore.closeModal()
    },

    async restart() {
      this.titleInsertedAt = null
      this.titleMainOverride = null
      this.titleSubOverride = null
      this.sorOverride = null
      this.sorInsertedAt = null
      this.editionOverride = null
      this.editionInsertedAt = null
      this.primaryAuthorNameOverride = null
      this.primaryAuthorInsertedAt = null
      this.contributorNameOverrides = {}
      this.contributorInsertedAt = {}
      this.summaryOverrides = {}
      this.summaryInsertedAt = {}
      this.tocOverride = null
      this.tocInsertedAt = null
      this.isbnOverride = null
      this.isbnInsertedAt = null
      this.provisionDateOverride = null
      this.provisionPublisherOverride = null
      this.provisionPlaceCodeOverride = null
      this.provisionCityOverride = null
      this.provisionInsertedAt = null
      this.activeImageCategory = null
      this.imageUrl = null
      this.imageError = null
      this.imageLoading = false
      this.magnifierVisible = false
      this.imageIndex = 1
      this.tocPageCount = 0
      await this.marvaScanStore.start(this.$refs.qrContainer)
    },

    humanCategory(cat) { return HUMAN_CATEGORY[cat] || cat },

    formatTime(ts) {
      try { return new Date(ts).toLocaleTimeString() } catch { return '' }
    },

    formatJson(obj) {
      try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
    },

    formatEvent(ev) {
      if (!ev || !ev.data) return ''
      if (ev.kind === 'status') return ev.data.status || JSON.stringify(ev.data)
      if (ev.kind === 'error') {
        return (ev.data.error || 'error') + ': ' + (ev.data.message || ev.data.error || JSON.stringify(ev.data))
      }
      const out = { data: ev.data.data }
      if (ev.data.meta) out.meta = ev.data.meta
      return JSON.stringify(out, null, 2)
    },

    async doInsertTitle() {
      const ok = await this.marvaScanStore.insertTitle({
        mainTitle: (this.titleMainValue || '').trim(),
        subtitle: (this.titleSubValue || '').trim(),
      })
      if (ok) this.titleInsertedAt = Date.now()
    },

    async doInsertSor() {
      const ok = await this.marvaScanStore.insertResponsibilityStatement({
        text: (this.sorValue || '').trim(),
      })
      if (ok) this.sorInsertedAt = Date.now()
    },

    async doInsertEdition() {
      const ok = await this.marvaScanStore.insertEditionStatement({
        text: (this.editionValue || '').trim(),
      })
      if (ok) this.editionInsertedAt = Date.now()
    },

    contributorNameValue(idx) {
      if (Object.prototype.hasOwnProperty.call(this.contributorNameOverrides, idx)) {
        return this.contributorNameOverrides[idx]
      }
      const c = this.otherContributorsProposal[idx]
      return (c && c.name) || ''
    },

    setContributorName(idx, value) {
      this.contributorNameOverrides = { ...this.contributorNameOverrides, [idx]: value }
    },

    formatRoles(roles) {
      if (!Array.isArray(roles) || roles.length === 0) return '(no role)'
      return roles.map((r) => `${r.label} (${r.code})`).join(', ')
    },

    async doInsertPrimaryAuthor() {
      const proposal = this.primaryAuthorProposal
      if (!proposal) return
      const ok = await this.marvaScanStore.insertPrimaryAuthor({
        name: (this.primaryAuthorNameValue || '').trim(),
        roles: proposal.roles,
      })
      if (ok) this.primaryAuthorInsertedAt = Date.now()
    },

    summaryValue(source) {
      if (Object.prototype.hasOwnProperty.call(this.summaryOverrides, source)) {
        return this.summaryOverrides[source]
      }
      const p = this.summaryProposals.find((s) => s.source === source)
      return (p && p.text) || ''
    },

    setSummary(source, value) {
      this.summaryOverrides = { ...this.summaryOverrides, [source]: value }
    },

    summarySourceLabel(source) {
      // Each summary's badge: "live scan" if the source category came in live this session,
      // otherwise "retrieved".
      if (this.resultsByCategory && this.resultsByCategory[source]) return 'live scan'
      return 'retrieved'
    },

    summarySourceTitle(source) {
      return source === 'back_cover' ? 'Back cover' : 'Summary page'
    },

    async doInsertSummary(source) {
      const ok = await this.marvaScanStore.insertSummary({
        text: (this.summaryValue(source) || '').trim(),
      })
      if (ok) this.summaryInsertedAt = { ...this.summaryInsertedAt, [source]: Date.now() }
    },

    async doInsertToc() {
      const ok = await this.marvaScanStore.insertToc({
        text: (this.tocValue || '').trim(),
      })
      if (ok) this.tocInsertedAt = Date.now()
    },

    async doInsertIsbn() {
      // Strip whitespace and dashes the same way as the store proposal getter,
      // so a user-edited value still gets normalized before insert.
      const cleaned = (this.isbnValue || '').replace(/[\s-]/g, '').toUpperCase().replace(/[^0-9X]/g, '')
      if (!cleaned) return
      const ok = await this.marvaScanStore.insertIsbn({ value: cleaned })
      if (ok) this.isbnInsertedAt = Date.now()
    },

    async doInsertProvision() {
      const ok = await this.marvaScanStore.insertProvisionActivity({
        date: (this.provisionDateValue || '').trim(),
        publisher: (this.provisionPublisherValue || '').trim(),
        placeCode: (this.provisionPlaceCodeValue || '').trim(),
        placeLabel: (this.provisionPlaceLabelDerived || '').trim(),
        city: (this.provisionCityValue || '').trim(),
      })
      if (ok) this.provisionInsertedAt = Date.now()
    },

    async loadImageCategory(category) {
      if (!category) return
      this.activeImageCategory = category
      this.imageIndex = 1
      this.tocPageCount = 0

      if (category === 'toc') {
        // Load page 1 immediately, then probe for additional pages in the background.
        await this.loadImageAt(category, 1)
        if (this.imageUrl) this.probeTocPages()
      } else {
        await this.loadImageAt(category, undefined)
      }
    },

    async loadImageAt(category, index) {
      this.imageLoading = true
      this.imageError = null
      this.imageUrl = null
      this.imageNaturalWidth = 0
      this.imageNaturalHeight = 0
      this.magnifierVisible = false
      const reqId = ++this.imageRequestId
      const res = await this.marvaScanStore.fetchImageUrl(category, index)
      if (reqId !== this.imageRequestId) return
      this.imageLoading = false
      if (res && res.url) {
        this.imageUrl = res.url
      } else {
        this.imageError = (res && res.error) || 'Image not available.'
      }
    },

    async loadTocPage(n) {
      if (this.activeImageCategory !== 'toc') return
      this.imageIndex = n
      await this.loadImageAt('toc', n)
    },

    /**
     * Walk forward from page 2 looking for additional TOC pages. Stops at the
     * first 404. Capped at 20 pages to bound the worst case if the backend ever
     * misbehaves.
     */
    async probeTocPages() {
      if (this.tocProbing) return
      this.tocProbing = true
      // Page 1 already exists by the time this runs, so start the count there.
      let count = 1
      try {
        for (let n = 2; n <= 20; n++) {
          if (this.activeImageCategory !== 'toc') break
          const res = await this.marvaScanStore.fetchImageUrl('toc', n)
          if (!res || !res.url) break
          count = n
          this.tocPageCount = count
        }
      } finally {
        this.tocProbing = false
        if (this.tocPageCount === 0) this.tocPageCount = count
      }
    },

    onImageLoad() {
      const img = this.$refs.scanImage
      if (!img) return
      this.imageNaturalWidth = img.naturalWidth
      this.imageNaturalHeight = img.naturalHeight
    },

    onImageMouseMove(event) {
      const img = this.$refs.scanImage
      if (!img) return
      const rect = img.getBoundingClientRect()
      // Coordinates relative to the rendered image. The magnifier is positioned
      // inside the frame which uses the image rect as its bounding context.
      this.magnifierX = event.clientX - rect.left
      this.magnifierY = event.clientY - rect.top
    },

    async copyOcr() {
      const text = (this.ocrProposal && this.ocrProposal.text) || ''
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        this.ocrCopyLabel = 'Copied!'
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try { document.execCommand('copy'); this.ocrCopyLabel = 'Copied!' }
        catch { this.ocrCopyLabel = 'Copy failed' }
        document.body.removeChild(ta)
      }
      window.setTimeout(() => { this.ocrCopyLabel = 'Copy to Clipboard' }, 1500)
    },

    async doInsertContributor(idx) {
      const proposal = this.otherContributorsProposal[idx]
      if (!proposal) return
      const ok = await this.marvaScanStore.insertContributor({
        name: (this.contributorNameValue(idx) || '').trim(),
        roles: proposal.roles,
      })
      if (ok) this.contributorInsertedAt = { ...this.contributorInsertedAt, [idx]: Date.now() }
    },

    async copyDebug() {
      const payload = {
        live: this.resultsByCategory,
        retrieved: this.retrievedResults,
        merged: this.mergedDataByCategory,
        events: this.events,
      }
      const text = this.formatJson(payload)
      try {
        await navigator.clipboard.writeText(text)
        this.copyLabel = 'Copied!'
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try { document.execCommand('copy'); this.copyLabel = 'Copied!' }
        catch { this.copyLabel = 'Copy failed' }
        document.body.removeChild(ta)
      }
      window.setTimeout(() => { this.copyLabel = 'Copy JSON' }, 1500)
    },

    // ---- Webcam capture ----

    loadWebcamPreferences() {
      try {
        const raw = window.localStorage.getItem(WEBCAM_PREF_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          if (parsed.captureSource === 'webcam' || parsed.captureSource === 'phone') {
            this.captureSource = parsed.captureSource
          }
          if (typeof parsed.deviceId === 'string') {
            this.webcamDeviceId = parsed.deviceId
          }
        }
      } catch { /* ignore corrupted prefs */ }
    },

    persistWebcamPreferences() {
      try {
        window.localStorage.setItem(WEBCAM_PREF_KEY, JSON.stringify({
          captureSource: this.captureSource,
          deviceId: this.webcamDeviceId || '',
        }))
      } catch { /* localStorage might be disabled */ }
    },

    async enumerateWebcams() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        this.webcamError = 'This browser does not support enumerateDevices.'
        return
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        this.webcamDevices = devices.filter((d) => d.kind === 'videoinput')
        // Browsers withhold device labels until the user has granted camera
        // access at least once; the stream-start flow below triggers a
        // re-enumerate so the dropdown can fill in real names.
        if (this.webcamDevices.length === 0) return
        const known = this.webcamDevices.some((d) => d.deviceId === this.webcamDeviceId)
        if (!known) this.webcamDeviceId = this.webcamDevices[0].deviceId
      } catch (e) {
        this.webcamError = 'Could not list cameras: ' + (e.message || e)
      }
    },

    async onWebcamDeviceChanged() {
      this.persistWebcamPreferences()
      if (this.captureSource !== 'webcam') return
      await this.startWebcam()
    },

    async startWebcam() {
      if (this._unmounted) return
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.webcamError = 'This browser does not support camera access.'
        return
      }
      this.stopWebcam()
      this.webcamError = null
      this.webcamStarting = true
      this.webcamReady = false

      try {
        if (this.webcamDevices.length === 0) await this.enumerateWebcams()
        const constraints = { audio: false, video: {} }
        if (this.webcamDeviceId) {
          constraints.video.deviceId = { ideal: this.webcamDeviceId }
        }
        // Ask for a high-res capture frame — book pages are detail-dense.
        constraints.video.width = { ideal: 3840 }
        constraints.video.height = { ideal: 2160 }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (this._unmounted || this.captureSource !== 'webcam') {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        this.webcamStream = stream
        // After permission, labels become available — refresh the list so the
        // dropdown shows real device names.
        await this.enumerateWebcams()
        // The stream's actual device may differ from the requested one (browser
        // chose a fallback). Reflect the real one in the dropdown so persistence
        // round-trips correctly next time.
        const track = stream.getVideoTracks()[0]
        if (track) {
          const settings = track.getSettings && track.getSettings()
          if (settings && settings.deviceId && settings.deviceId !== this.webcamDeviceId) {
            this.webcamDeviceId = settings.deviceId
          }
        }
        this.persistWebcamPreferences()

        await this.$nextTick()
        const video = this.$refs.webcamVideo
        if (video) {
          video.srcObject = stream
          try { await video.play() } catch { /* autoplay may be blocked; user will retry */ }
        }
        this.webcamReady = true
      } catch (e) {
        const name = e && e.name
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          this.webcamError = 'Camera permission denied. Allow access and try again.'
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          this.webcamError = 'No matching camera found.'
        } else {
          this.webcamError = 'Camera error: ' + (e && (e.message || e.name) || 'unknown')
        }
      } finally {
        this.webcamStarting = false
      }
    },

    stopWebcam() {
      if (this.webcamStream) {
        try { this.webcamStream.getTracks().forEach((t) => t.stop()) } catch { /* ignore */ }
        this.webcamStream = null
      }
      const video = this.$refs.webcamVideo
      if (video) {
        try { video.pause() } catch { /* ignore */ }
        video.srcObject = null
      }
      this.webcamReady = false
    },

    flashWebcam() {
      this.webcamFlashing = true
      window.setTimeout(() => { this.webcamFlashing = false }, 120)
    },

    showWebcamToast(msg, duration = 1800) {
      this.webcamToast = msg
      if (this._toastTimer) window.clearTimeout(this._toastTimer)
      this._toastTimer = window.setTimeout(() => { this.webcamToast = '' }, duration)
    },

    captureWebcamFrame(quality = 0.95) {
      const video = this.$refs.webcamVideo
      if (!video || !video.videoWidth || !video.videoHeight) return null
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      return canvas.toDataURL('image/jpeg', quality)
    },

    async captureWebcam(category, multi) {
      if (this.webcamCapturing || !this.webcamReady) return
      if (!this.connectionId) {
        this.showWebcamToast('Still connecting — try again in a moment.', 2500)
        return
      }
      this.webcamSelectedCategory = category
      this.webcamCapturing = true
      this.flashWebcam()

      const dataUrl = this.captureWebcamFrame()
      if (!dataUrl) {
        this.webcamCapturing = false
        this.showWebcamToast('Capture failed — camera not ready.', 2500)
        return
      }

      if (multi) {
        this.webcamTocPages.push(dataUrl)
        this.showWebcamToast('Page ' + this.webcamTocPages.length + ' captured')
        this.webcamCapturing = false
        return
      }

      this.showWebcamToast('Sending…', 3000)
      try {
        await MarvaScan.sendPhoto({
          connectionId: this.connectionId,
          resourceId: this.resourceId,
          imageDataUrl: dataUrl,
          category,
        })
        this.showWebcamToast('Sent!')
      } catch (e) {
        this.showWebcamToast('Failed: ' + (e.message || e), 3000)
      } finally {
        this.webcamCapturing = false
      }
    },

    resetWebcamToc() {
      this.webcamTocPages = []
      this.showWebcamToast('Reset')
    },

    async sendWebcamTocBundle() {
      if (this.webcamCapturing || this.webcamTocPages.length === 0) return
      if (!this.connectionId) {
        this.showWebcamToast('Still connecting — try again in a moment.', 2500)
        return
      }
      this.webcamCapturing = true
      const count = this.webcamTocPages.length
      this.showWebcamToast('Uploading ' + count + ' pages…', 4000)
      try {
        await MarvaScan.sendBundle({
          connectionId: this.connectionId,
          resourceId: this.resourceId,
          category: 'toc',
          dataUrls: this.webcamTocPages,
        })
        this.showWebcamToast('Sent ' + count + ' pages!')
        this.webcamTocPages = []
      } catch (e) {
        this.showWebcamToast('Failed: ' + (e.message || e), 3000)
      } finally {
        this.webcamCapturing = false
      }
    },

    onSelectElement(event) {
      const tagName = event.target.tagName
      if (['INPUT', 'TD', 'BUTTON', 'TEXTAREA', 'SELECT', 'A', 'CODE', 'PRE'].includes(tagName)) {
        event.stopPropagation()
      }
    },
  },

  async mounted() {
    this._unmounted = false
    this.activeTab = 'scan'
    this.titleMainOverride = null
    this.titleSubOverride = null
    this.titleInsertedAt = null
    this.sorOverride = null
    this.sorInsertedAt = null
    this.editionOverride = null
    this.editionInsertedAt = null
    this.primaryAuthorNameOverride = null
    this.primaryAuthorInsertedAt = null
    this.contributorNameOverrides = {}
    this.contributorInsertedAt = {}
    this.summaryOverrides = {}
    this.summaryInsertedAt = {}
    this.tocOverride = null
    this.tocInsertedAt = null
    this.provisionDateOverride = null
    this.provisionPublisherOverride = null
    this.provisionPlaceCodeOverride = null
    this.provisionCityOverride = null
    this.provisionInsertedAt = null
    this.activeImageCategory = null
    this.imageUrl = null
    this.imageError = null
    this.imageLoading = false
    this.magnifierVisible = false
    this.imageIndex = 1
    this.tocPageCount = 0
    this.webcamTocPages = []
    this.webcamToast = ''
    this.webcamError = null
    this.loadWebcamPreferences()
    // Best-effort device enumeration before the user picks webcam — labels
    // come back blank until permission is granted, but the list is enough to
    // populate the dropdown.
    this.enumerateWebcams()
    await this.marvaScanStore.probeExisting()
    if (this._unmounted) return
    this.$nextTick(async () => {
      if (this._unmounted) return
      // Container only exists when the Scan tab is active and pairing is visible.
      const c = this.$refs.qrContainer || null
      this.marvaScanStore.start(c)
      if (this.captureSource === 'webcam') {
        // Wait one more tick so the <video> element is mounted under the webcam
        // template branch before grabbing it.
        await this.$nextTick()
        if (!this._unmounted) this.startWebcam()
      }
    })
  },

  beforeUnmount() {
    this._unmounted = true
    if (this._toastTimer) window.clearTimeout(this._toastTimer)
    this.stopWebcam()
    this.marvaScanStore.disconnect()
  },
}
</script>

<style scoped>
.ms-modal {
  background-color: whitesmoke;
  height: 100%;
  overflow: hidden;
}

.ms-menu-button {
  float: right;
  margin: 5px;
}

.close-button {
  position: absolute;
  right: 5px;
  top: 5px;
  background-color: white;
  border-radius: 5px;
  border: solid 1px black;
  cursor: pointer;
  z-index: 100;
  padding: 4px 10px;
}

.ms-container {
  height: calc(100% - 10px);
  overflow-y: auto;
  padding: 0 14px 14px;
}

.ms-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 4px 0 6px;
}

.ms-title {
  font-size: 1.3rem;
  margin: 0;
}

.ms-live-activity {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1565c0;
  font-size: 0.9rem;
}

.ms-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1976d2;
  animation: ms-pulse 1.1s ease-in-out infinite;
}

@keyframes ms-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.7); }
}

.ms-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 10px;
}

.ms-tab {
  background: #eee;
  border: 1px solid #ccc;
  border-bottom: none;
  border-radius: 5px 5px 0 0;
  padding: 5px 14px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #333;
}

.ms-tab.active {
  background: white;
  font-weight: bold;
  color: #111;
  position: relative;
  top: 1px;
}

.ms-tabpanel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ms-errors {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.ms-error-banner {
  background: #fef2f2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
  border-left: 3px solid #ef4444;
  padding: 8px 10px;
  border-radius: 0 5px 5px 0;
  font-size: 0.85rem;
}

.ms-error-hint { color: #b91c1c; font-style: italic; }

.ms-warn-banner {
  background: #fffbeb;
  color: #78350f;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  padding: 8px 10px;
  border-radius: 0 5px 5px 0;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.ms-warn-hint { color: #92400e; font-style: italic; margin-left: 4px; }

.ms-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(260px, 1fr);
  gap: 10px;
}

.ms-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid #ddd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.ms-card h2 {
  font-size: 1rem;
  margin: 0 0 8px;
}

.ms-card h3 {
  font-size: 0.85rem;
  margin: 12px 0 4px;
  color: #555;
}

.ms-status {
  font-size: 0.85rem;
  padding: 6px 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.ms-status-idle, .ms-status-connecting { background: #fff3cd; color: #856404; }
.ms-status-connected { background: #d4edda; color: #155724; }
.ms-status-error { background: #f8d7da; color: #721c24; }
.ms-status-closed { background: #e2e3e5; color: #383d41; }

.ms-qr-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 6px;
  min-height: 280px;
  padding: 12px;
}

.ms-qr-meta {
  margin-top: 10px;
  font-size: 0.8rem;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ms-qr-meta code {
  background: #f4f4f4;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.78rem;
}

.ms-label {
  display: inline-block;
  font-weight: bold;
  margin-right: 6px;
  min-width: 90px;
  color: #333;
}

.ms-qrurl a { color: #1976d2; font-size: 0.78rem; }

.ms-source-toggle {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.ms-source-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #333;
}

.ms-source-radio input[type="radio"] {
  cursor: pointer;
  margin: 0;
}

.ms-webcam-device-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.ms-webcam-device-label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.78rem;
  color: #555;
  flex: 1;
}

.ms-webcam-device-label select {
  font-size: 0.85rem;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  background: #fff;
}

.ms-webcam-refresh {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 30px;
  height: 28px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #555;
}

.ms-webcam-refresh:hover { background: #f5f5f5; }

.ms-webcam-stage {
  position: relative;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ms-webcam-video {
  width: 100%;
  height: auto;
  max-height: 320px;
  display: block;
  background: #000;
}

.ms-webcam-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  color: #ddd;
  font-size: 0.85rem;
}

.ms-webcam-overlay .ms-muted { color: #ddd; }

.ms-webcam-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(127, 29, 29, 0.85);
  color: #fff;
  font-size: 0.85rem;
  padding: 10px;
  text-align: center;
}

.ms-webcam-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0.6;
  pointer-events: none;
  animation: ms-webcam-flash-fade 0.18s ease-out;
}

@keyframes ms-webcam-flash-fade {
  0% { opacity: 0.7; }
  100% { opacity: 0; }
}

.ms-webcam-toast {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 5;
}

.ms-webcam-categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  margin-top: 8px;
}

.ms-webcam-cat-btn {
  background: #eef2f7;
  color: #1a1a2e;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 4px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
  min-height: 38px;
  transition: background 0.1s, transform 0.05s;
}

.ms-webcam-cat-btn:hover:not(:disabled) {
  background: #dde6f1;
}

.ms-webcam-cat-btn.active {
  background: #1976d2;
  color: #fff;
  border-color: #1565c0;
}

.ms-webcam-cat-btn:active:not(:disabled) { transform: scale(0.96); }

.ms-webcam-cat-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ms-webcam-toc-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px;
  background: #f0f7ff;
  border-radius: 6px;
}

.ms-webcam-toc-count {
  font-size: 0.8rem;
  color: #1565c0;
  font-weight: 500;
}

.ms-webcam-toc-reset {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.78rem;
  color: #555;
}

.ms-webcam-toc-send {
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.78rem;
}

.ms-webcam-toc-send:disabled,
.ms-webcam-toc-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ms-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.ms-actions button {
  background: #1a1a2e;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 0.85rem;
}

.ms-actions button:disabled { background: #999; cursor: not-allowed; }

.ms-lookup-list, .ms-cat-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.85rem;
}

.ms-lookup-list li, .ms-cat-list li {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
  align-items: center;
}

.ms-lookup-list li.found { background: #f0fff4; }

.ms-found {
  background: #d4edda;
  color: #155724;
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: bold;
}

.ms-muted { color: #888; font-size: 0.85rem; }
.ms-error { color: #b71c1c; font-size: 0.85rem; }
.ms-error-inline { color: #b71c1c; font-size: 0.78rem; }

.ms-inserts-card .ms-insert-block {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fbfdff;
}

.ms-inserts-card .ms-insert-block + .ms-insert-block {
  margin-top: 10px;
}

.ms-role-meta {
  display: flex;
  gap: 8px;
  font-size: 0.78rem;
  color: #555;
  margin-top: 2px;
}

.ms-role-meta .ms-label {
  font-weight: bold;
  min-width: 60px;
  color: #555;
  margin-right: 0;
}

.ms-source-sub {
  font-size: 0.78rem;
  font-weight: normal;
  color: #666;
  margin-left: 4px;
}

.ms-summary-text {
  width: 100%;
  font-size: 0.85rem;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.ms-ocr-block { background: #f6fbf6; }

.ms-ocr-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  background: #fafafa;
}

.ms-copy-clip-btn {
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 14px;
  cursor: pointer;
  font-size: 0.82rem;
  white-space: nowrap;
}

.ms-copy-clip-btn:hover { background: #1b5e20; }

.ms-images-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ms-images-header h2 { margin: 0; }

.ms-image-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

.ms-image-tab {
  background: #eee;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.82rem;
  color: #333;
}

.ms-image-tab.active {
  background: #1a1a2e;
  color: #fff;
  border-color: #1a1a2e;
}

.ms-toc-pages {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  flex-wrap: wrap;
}

.ms-toc-pages-label {
  color: #555;
  font-weight: bold;
  margin-right: 4px;
}

.ms-toc-page-btn {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 9px;
  cursor: pointer;
  font-size: 0.82rem;
  min-width: 28px;
}

.ms-toc-page-btn.active {
  background: #1976d2;
  color: #fff;
  border-color: #1565c0;
}

.ms-image-stage {
  position: relative;
  display: flex;
  justify-content: center;
  background: #fafafa;
  border-radius: 6px;
  padding: 10px;
  min-height: 200px;
}

.ms-image-frame {
  position: relative;
  display: inline-block;
  max-width: 100%;
  cursor: crosshair;
}

.ms-scan-image {
  display: block;
  max-width: 100%;
  max-height: 65vh;
  height: auto;
  border-radius: 4px;
  user-select: none;
  -webkit-user-drag: none;
}

.ms-magnifier {
  position: absolute;
  pointer-events: none;
  border: 2px solid #1a1a2e;
  border-radius: 50%;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  background-color: #fff;
  z-index: 5;
}

.ms-insert-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.ms-insert-head h3 { margin: 0; font-size: 0.95rem; color: #111; }

.ms-source-badge {
  font-size: 0.7rem;
  font-weight: normal;
  background: #e8eef5;
  color: #1565c0;
  border-radius: 3px;
  padding: 1px 6px;
  margin-left: 6px;
}

.ms-insert-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ms-insert-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
}

.ms-place-label-hint {
  font-size: 0.75rem;
  color: #1565c0;
  margin-top: 2px;
  font-style: italic;
}

.ms-insert-fields label {
  display: flex;
  flex-direction: column;
  font-size: 0.78rem;
  color: #555;
  gap: 3px;
}

.ms-insert-fields input {
  font-size: 0.9rem;
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

.ms-insert-btn {
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 14px;
  cursor: pointer;
  font-size: 0.82rem;
  white-space: nowrap;
}

.ms-insert-btn:hover { background: #1565c0; }

.ms-insert-confirm {
  margin-top: 8px;
  font-size: 0.78rem;
  color: #2e7d32;
}

.ms-debug-card { font-size: 0.8rem; }

.ms-debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ms-copy-btn {
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 3px 10px;
  cursor: pointer;
  font-size: 0.8rem;
}

.ms-debug-pre {
  background: #f8f8f8;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
  max-height: 200px;
  overflow: auto;
  margin: 4px 0 8px;
}

.ms-events-list {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ms-event {
  border-left: 3px solid #ccc;
  background: #fafafa;
  border-radius: 0 4px 4px 0;
  padding: 6px 10px;
}

.ms-event.status { border-left-color: #f59e0b; background: #fffbeb; }
.ms-event.result { border-left-color: #3b82f6; background: #eff6ff; }
.ms-event.error  { border-left-color: #ef4444; background: #fef2f2; }

.ms-event-head {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 3px;
  align-items: center;
}

.ms-event-kind {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.ms-event-cat {
  background: #e8eef5;
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 0.7rem;
}

.ms-event-time { margin-left: auto; }

.ms-event-body {
  margin: 0;
  font-size: 0.78rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #222;
}
</style>
