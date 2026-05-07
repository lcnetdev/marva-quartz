import { defineStore } from 'pinia'
import { useProfileStore } from './profile'
import short from 'short-uuid'
import {
  MarvaScan,
  MARVA_SCAN_MOBILE_URL,
  MARVA_SCAN_PROCESS_URL,
  MARVA_SCAN_WS_URL,
} from '@/lib/marva_scan'

const translator = short()

const STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  CLOSED: 'closed',
}

const HUMAN_CATEGORY = {
  cover: 'Cover',
  copyright: 'Copyright page',
  title_page: 'Title page',
  toc: 'Table of contents',
  summary: 'Summary',
  back_cover: 'Back cover',
  ocr: 'OCR',
}

function humanCategory(cat) {
  return HUMAN_CATEGORY[cat] || (cat ? cat.replace(/_/g, ' ') : 'Page')
}

function humanStatus(status) {
  switch (status) {
    case 'received': return 'received'
    case 'processing': return 'processing'
    case 'ocr_fallback': return 'using OCR fallback'
    default: return status || ''
  }
}

let _scanner = null
const _titleProposalCache = { last: null }
const _sorProposalCache = { last: null }
const _editionProposalCache = { last: null }
const _primaryAuthorCache = { last: null }
const _otherContributorsCache = { last: null }
const _summaryProposalsCache = { last: null }
const _tocProposalCache = { last: null }
const _ocrProposalCache = { last: null }
const _provisionProposalCache = { last: null }

/**
 * Minimal MARC place-code → human label map for the codes we're likely to see
 * out of the scan pipeline. Anything not in this map falls back to the code as
 * its own label — the bnode is still well-formed and the user can edit it.
 */
const PLACE_CODE_LABELS = {
  // Countries
  xxu: 'United States', xxk: 'United Kingdom', xxc: 'Canada',
  enk: 'England', stk: 'Scotland', wlk: 'Wales', nik: 'Northern Ireland',
  fr: 'France', gw: 'Germany', it: 'Italy', sp: 'Spain', sz: 'Switzerland',
  ne: 'Netherlands', be: 'Belgium', dk: 'Denmark', sw: 'Sweden', no: 'Norway',
  fi: 'Finland', ja: 'Japan', cc: 'China', ko: 'Korea (South)', kn: 'Korea (North)',
  ii: 'India', as: 'Australia', nz: 'New Zealand', mx: 'Mexico', bl: 'Brazil',
  ag: 'Argentina', ru: 'Russia (Federation)', ur: 'Soviet Union', cl: 'Chile',
  // US states
  alu: 'Alabama', aku: 'Alaska', azu: 'Arizona', aru: 'Arkansas', cau: 'California',
  cou: 'Colorado', ctu: 'Connecticut', deu: 'Delaware', dcu: 'District of Columbia',
  flu: 'Florida', gau: 'Georgia', hiu: 'Hawaii', idu: 'Idaho', ilu: 'Illinois',
  inu: 'Indiana', iau: 'Iowa', ksu: 'Kansas', kyu: 'Kentucky', lau: 'Louisiana',
  meu: 'Maine', mdu: 'Maryland', mau: 'Massachusetts', miu: 'Michigan', mnu: 'Minnesota',
  msu: 'Mississippi', mou: 'Missouri', mtu: 'Montana', nbu: 'Nebraska', nvu: 'Nevada',
  nhu: 'New Hampshire', nju: 'New Jersey', nmu: 'New Mexico', nyu: 'New York (State)',
  ncu: 'North Carolina', ndu: 'North Dakota', ohu: 'Ohio', oku: 'Oklahoma',
  oru: 'Oregon', pau: 'Pennsylvania', riu: 'Rhode Island', scu: 'South Carolina',
  sdu: 'South Dakota', tnu: 'Tennessee', txu: 'Texas', utu: 'Utah', vtu: 'Vermont',
  vau: 'Virginia', wau: 'Washington (State)', wvu: 'West Virginia', wiu: 'Wisconsin', wyu: 'Wyoming',
  // Canadian provinces
  abc: 'Alberta', bcc: 'British Columbia', mbc: 'Manitoba', nkc: 'New Brunswick',
  nfc: 'Newfoundland and Labrador', ntc: 'Northwest Territories', nsc: 'Nova Scotia',
  nuc: 'Nunavut', onc: 'Ontario', pic: 'Prince Edward Island', quc: 'Québec',
  snc: 'Saskatchewan', ykc: 'Yukon Territory',
}

function placeLabelForCode(code) {
  if (!isMeaningfulText(code)) return ''
  const c = String(code).trim().toLowerCase()
  return PLACE_CODE_LABELS[c] || c
}

/** Pick the first meaningful value from an ordered list of candidates. */
function firstMeaningful(...vals) {
  for (const v of vals) {
    if (isMeaningfulText(v)) return String(v).trim()
  }
  return ''
}

/**
 * Normalize a scanned contributor object into our canonical shape, dropping
 * roles that don't have a matching code (since we can't build a relator URI).
 * Returns null if the name is empty/meaningless.
 */
function normalizeContributor(c) {
  if (!c || typeof c !== 'object') return null
  if (!isMeaningfulText(c.name)) return null
  const name = String(c.name).trim()
  const roles = Array.isArray(c.role) ? c.role : []
  const codes = Array.isArray(c.code) ? c.code : []
  const out = []
  // Role and code are positionally aligned in the upstream payload.
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i]
    const code = codes[i]
    if (!isMeaningfulText(role) || !isMeaningfulText(code)) continue
    out.push({
      label: String(role).trim(),
      code: String(code).trim(),
      uri: 'http://id.loc.gov/vocabulary/relators/' + String(code).trim(),
    })
  }
  return { name, roles: out }
}

/** Treat null, "null", "", "  ", "n/a", "none" etc. as empty. */
function isMeaningfulText(v) {
  if (v == null) return false
  const s = String(v).trim()
  if (!s) return false
  const lower = s.toLowerCase()
  if (lower === 'null' || lower === 'undefined' || lower === 'n/a' || lower === 'none') return false
  return true
}

export const useMarvaScanStore = defineStore('marvaScan', {
  state: () => ({
    showModal: false,
    status: STATUS.IDLE,
    statusMessage: '',
    connectionId: null,
    resourceId: null,
    qrUrl: null,
    qrReady: false,
    // Newest-first log of every status/result/error event (for the Debug tab).
    events: [],
    // Latest result data per category (cover, copyright, title_page, toc, summary, back_cover, ocr).
    resultsByCategory: {},
    // Sticks once any result/status/error arrives in this session — used to hide
    // the QR/pairing UI. Reset on close or restart.
    liveDataReceived: false,
    // Latest human-readable activity line, e.g. "Title page processing…"
    liveActivity: '',
    // category -> { error, message, at } error banners; cleared per category
    // when a fresh attempt comes in for that category.
    categoryErrors: {},
    // Result of the GET /retrieve probe done when the modal opens.
    retrievedResults: {},
    retrieveLookups: [],
    retrieveLoading: false,
    retrieveError: null,
  }),

  getters: {
    mobileUrl: () => MARVA_SCAN_MOBILE_URL,

    /**
     * Categories present (live wins per category) merged with anything we got
     * from /retrieve. Returns an object: category -> data shape.
     */
    mergedDataByCategory(state) {
      const out = {}
      // Retrieved first (across every resource ID) so live can overlay.
      for (const rid of Object.keys(state.retrievedResults)) {
        const cats = state.retrievedResults[rid] || {}
        for (const cat of Object.keys(cats)) {
          const entry = cats[cat]
          if (entry && entry.data && !(cat in out)) out[cat] = entry.data
        }
      }
      for (const cat of Object.keys(state.resultsByCategory)) {
        const entry = state.resultsByCategory[cat]
        if (entry && entry.data) out[cat] = entry.data
      }
      return out
    },

    /**
     * Categories for which we have *some* data (live or retrieved). Used by
     * the Images tab to know which thumbnails are even worth requesting.
     */
    availableCategories() {
      const live = Object.keys(this.resultsByCategory)
      const retrievedByCat = new Set()
      for (const rid of Object.keys(this.retrievedResults)) {
        for (const cat of Object.keys(this.retrievedResults[rid] || {})) {
          retrievedByCat.add(cat)
        }
      }
      const order = ['cover', 'title_page', 'copyright', 'toc', 'summary', 'back_cover', 'ocr']
      const all = new Set([...live, ...retrievedByCat])
      const ordered = order.filter((c) => all.has(c))
      // Tack on anything we don't know about (defensive).
      for (const c of all) if (!ordered.includes(c)) ordered.push(c)
      return ordered
    },

    /** True when the active profile has neither an ISBN nor an LCCN to key on. */
    needsIdentifierWarning() {
      const { isbns, lccns } = this.collectResourceIds()
      return isbns.length === 0 && lccns.length === 0
    },

    activeCategoryErrors(state) {
      // Only surface errors that don't have a successful result yet.
      const out = {}
      for (const cat of Object.keys(state.categoryErrors)) {
        if (!state.resultsByCategory[cat]) out[cat] = state.categoryErrors[cat]
      }
      return out
    },

    /**
     * Title proposal from the merged title_page payload, if any.
     * Returned reference is stable when the underlying strings haven't changed,
     * so Vue watchers on this getter don't re-fire every tick.
     */
    titleProposal() {
      const tp = this.mergedDataByCategory.title_page
      if (!tp) {
        if (_titleProposalCache.last) _titleProposalCache.last = null
        return null
      }
      const main = isMeaningfulText(tp.title) ? String(tp.title).trim() : ''
      const sub = isMeaningfulText(tp.subtitle) ? String(tp.subtitle).trim() : ''
      if (!main && !sub) {
        if (_titleProposalCache.last) _titleProposalCache.last = null
        return null
      }
      const cached = _titleProposalCache.last
      if (cached && cached.mainTitle === main && cached.subtitle === sub) return cached
      const next = { mainTitle: main, subtitle: sub }
      _titleProposalCache.last = next
      return next
    },

    /**
     * Statement-of-responsibility proposal from merged title_page, if any.
     * Reference-stable so watchers don't re-fire on every render.
     */
    sorProposal() {
      const tp = this.mergedDataByCategory.title_page
      const raw = tp && tp.statement_of_responsibility
      if (!isMeaningfulText(raw)) {
        if (_sorProposalCache.last) _sorProposalCache.last = null
        return null
      }
      const text = String(raw).trim()
      const cached = _sorProposalCache.last
      if (cached && cached.text === text) return cached
      const next = { text }
      _sorProposalCache.last = next
      return next
    },

    /** Edition statement from merged copyright payload. */
    editionProposal() {
      const cp = this.mergedDataByCategory.copyright
      const raw = cp && cp.edition_statement
      if (!isMeaningfulText(raw)) {
        if (_editionProposalCache.last) _editionProposalCache.last = null
        return null
      }
      const text = String(raw).trim()
      const cached = _editionProposalCache.last
      if (cached && cached.text === text) return cached
      const next = { text }
      _editionProposalCache.last = next
      return next
    },

    /** Primary author from merged title_page. Returns { name, roles[] } or null. */
    primaryAuthorProposal() {
      const tp = this.mergedDataByCategory.title_page
      const next = normalizeContributor(tp && tp.primary_author)
      if (!next) {
        if (_primaryAuthorCache.last) _primaryAuthorCache.last = null
        return null
      }
      const cached = _primaryAuthorCache.last
      if (cached && cached.name === next.name &&
          cached.roles.length === next.roles.length &&
          cached.roles.every((r, i) => r.code === next.roles[i].code && r.label === next.roles[i].label)) {
        return cached
      }
      _primaryAuthorCache.last = next
      return next
    },

    /**
     * Raw OCR text from merged ocr payload — for display/copy only, no insert.
     * The OCR shape is { raw_text: "..." } per the API.
     */
    ocrProposal() {
      const ocrCat = this.mergedDataByCategory.ocr
      const raw = ocrCat && ocrCat.raw_text
      if (!isMeaningfulText(raw)) {
        if (_ocrProposalCache.last) _ocrProposalCache.last = null
        return null
      }
      const text = String(raw)
      const cached = _ocrProposalCache.last
      if (cached && cached.text === text) return cached
      const next = { text }
      _ocrProposalCache.last = next
      return next
    },

    /**
     * Provision activity (publication) proposal. Combines copyright + title_page
     * per the per-field precedence rules:
     *   date         <- copyright.publication_date
     *   publisher    <- title_page.publisher_name || copyright.publisher_name
     *   placeCode    <- title_page.publisher_location_code || copyright.publisher_location_code
     *   city         <- copyright.city_of_publication || title_page.publisher_city
     *
     * Returns null if every field is empty.
     */
    provisionProposal() {
      const cp = this.mergedDataByCategory.copyright || {}
      const tp = this.mergedDataByCategory.title_page || {}
      const date = firstMeaningful(cp.publication_date)
      const publisher = firstMeaningful(tp.publisher_name, cp.publisher_name)
      const placeCode = firstMeaningful(tp.publisher_location_code, cp.publisher_location_code)
      const city = firstMeaningful(cp.city_of_publication, tp.publisher_city)
      const placeLabel = placeLabelForCode(placeCode)
      if (!date && !publisher && !placeCode && !city) {
        if (_provisionProposalCache.last) _provisionProposalCache.last = null
        return null
      }
      const next = { date, publisher, placeCode, placeLabel, city }
      const cached = _provisionProposalCache.last
      if (cached &&
          cached.date === next.date &&
          cached.publisher === next.publisher &&
          cached.placeCode === next.placeCode &&
          cached.placeLabel === next.placeLabel &&
          cached.city === next.city) {
        return cached
      }
      _provisionProposalCache.last = next
      return next
    },

    /** Table-of-contents proposal from merged toc payload. */
    tocProposal() {
      const tocCat = this.mergedDataByCategory.toc
      const raw = tocCat && tocCat.table_of_contents
      if (!isMeaningfulText(raw)) {
        if (_tocProposalCache.last) _tocProposalCache.last = null
        return null
      }
      const text = String(raw).trim()
      const cached = _tocProposalCache.last
      if (cached && cached.text === text) return cached
      const next = { text }
      _tocProposalCache.last = next
      return next
    },

    /**
     * Summary proposals — one entry per source category (`summary` and/or
     * `back_cover`) that has meaningful summary text.
     * Each entry: { source: 'summary'|'back_cover', text: string }
     */
    summaryProposals() {
      const merged = this.mergedDataByCategory
      const candidates = []
      const summary = merged.summary && merged.summary.summary
      if (isMeaningfulText(summary)) {
        candidates.push({ source: 'summary', text: String(summary).trim() })
      }
      const backCover = merged.back_cover && merged.back_cover.summary
      if (isMeaningfulText(backCover)) {
        candidates.push({ source: 'back_cover', text: String(backCover).trim() })
      }
      const cached = _summaryProposalsCache.last
      const sameLength = cached && cached.length === candidates.length
      const sameContents = sameLength && cached.every((c, i) =>
        c.source === candidates[i].source && c.text === candidates[i].text,
      )
      if (sameContents) return cached
      _summaryProposalsCache.last = candidates
      return candidates
    },

    /** Other contributors array from merged title_page. */
    otherContributorsProposal() {
      const tp = this.mergedDataByCategory.title_page
      const list = Array.isArray(tp && tp.other_contributors) ? tp.other_contributors : []
      const next = list.map(normalizeContributor).filter(Boolean)
      if (next.length === 0) {
        if (_otherContributorsCache.last) _otherContributorsCache.last = null
        return []
      }
      const cached = _otherContributorsCache.last
      const sameLength = cached && cached.length === next.length
      const sameContents = sameLength && cached.every((c, i) =>
        c.name === next[i].name &&
        c.roles.length === next[i].roles.length &&
        c.roles.every((r, j) => r.code === next[i].roles[j].code && r.label === next[i].roles[j].label),
      )
      if (sameContents) return cached
      _otherContributorsCache.last = next
      return next
    },
  },

  actions: {
    openModal() {
      this.showModal = true
    },

    closeModal() {
      this.disconnect()
      this.showModal = false
      this.resetSessionUI()
    },

    /**
     * Reset the per-session UI flags (live indicator, errors, etc) but keep the
     * modal-level retrieved data alone — that's repopulated on each modal open.
     */
    resetSessionUI() {
      this.liveDataReceived = false
      this.liveActivity = ''
      this.categoryErrors = {}
      this.events = []
      this.resultsByCategory = {}
      this.qrReady = false
      this.qrUrl = null
      this.connectionId = null
      this.status = STATUS.IDLE
      this.statusMessage = ''
    },

    /**
     * Pull live ISBN/LCCN values off the active profile. Walks every PT looking
     * for bf:identifiedBy bnodes typed bf:Isbn or bf:Lccn and reads the current
     * rdf:value (which reflects edits the user has made since load).
     *
     * Returns { isbns: [...], lccns: [...], all: [...] }.
     */
    collectResourceIds() {
      const profile = useProfileStore().activeProfile
      const isbns = []
      const lccns = []
      if (!profile || !profile.rt) return { isbns, lccns, all: [] }

      const ID_BY = 'http://id.loc.gov/ontologies/bibframe/identifiedBy'
      const ISBN_T = 'http://id.loc.gov/ontologies/bibframe/Isbn'
      const LCCN_T = 'http://id.loc.gov/ontologies/bibframe/Lccn'
      const RDF_VAL = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'

      const visit = (node) => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) { for (const c of node) visit(c); return }
        const t = node['@type']
        if (t === ISBN_T || t === LCCN_T) {
          const valArr = node[RDF_VAL]
          if (Array.isArray(valArr)) {
            for (const v of valArr) {
              const lit = v && v[RDF_VAL]
              if (typeof lit === 'string' && lit.trim()) {
                if (t === ISBN_T) {
                  const clean = lit.replace(/[^0-9Xx]/g, '')
                  if (clean) isbns.push(clean)
                } else {
                  lccns.push(lit.trim())
                }
              }
            }
          }
        }
        for (const k of Object.keys(node)) {
          if (k === '@type' || k === '@id' || k === '@guid' || k === '@language' || k === '@datatype') continue
          visit(node[k])
        }
      }

      for (const rtKey of Object.keys(profile.rt)) {
        const rt = profile.rt[rtKey]
        if (!rt || !rt.pt) continue
        for (const ptKey of Object.keys(rt.pt)) {
          const pt = rt.pt[ptKey]
          if (!pt || pt.propertyURI !== ID_BY) continue
          const uv = pt.userValue
          if (!uv) continue
          const arr = uv[ID_BY]
          if (Array.isArray(arr)) visit(arr)
        }
      }

      const dedupe = (arr) => Array.from(new Set(arr))
      const isbnsU = dedupe(isbns)
      const lccnsU = dedupe(lccns)
      return { isbns: isbnsU, lccns: lccnsU, all: dedupe([...isbnsU, ...lccnsU]) }
    },

    /**
     * On modal open: probe the backend for any pre-existing scan data keyed by
     * the profile's ISBN/LCCN values. Stores everything found into retrievedResults.
     */
    async probeExisting() {
      this.retrieveLoading = true
      this.retrieveError = null
      this.retrievedResults = {}
      this.retrieveLookups = []
      const ids = this.collectResourceIds().all
      try {
        for (const rid of ids) {
          let data
          try {
            data = await MarvaScan.retrieve(rid)
          } catch (e) {
            this.retrieveLookups.push({ rid, found: false, error: e.message || 'fetch failed' })
            continue
          }
          const found = data && data.results && Object.keys(data.results).length > 0
          this.retrieveLookups.push({ rid, found: !!found })
          if (found) {
            this.retrievedResults[rid] = data.results
          }
        }
      } catch (e) {
        this.retrieveError = e.message || 'probe failed'
      } finally {
        this.retrieveLoading = false
      }
    },

    /**
     * Open the WS session and (once we have a connectionId) render the QR.
     * @param {HTMLElement} qrContainer - DOM node the QR will be appended to.
     */
    async start(qrContainer) {
      this.disconnect()
      this.status = STATUS.CONNECTING
      this.statusMessage = 'Connecting…'
      this.qrReady = false
      this.qrUrl = null
      this.connectionId = null
      this.events = []
      this.resultsByCategory = {}
      this.liveDataReceived = false
      this.liveActivity = ''

      // Prefer LCCN as the WS resourceId (unique per record), fall back to
      // ISBN, then to the active profile's Marva eId as a last resort.
      const { isbns, lccns } = this.collectResourceIds()
      const eId = useProfileStore().activeProfile && useProfileStore().activeProfile.eId
      this.resourceId = lccns[0] || isbns[0] || (eId ? String(eId) : ('SCAN-' + Math.random().toString(36).slice(2, 10)))

      _scanner = new MarvaScan({
        wsUrl: MARVA_SCAN_WS_URL,
        resourceId: this.resourceId,
        onSession: (data) => {
          this.connectionId = data.connectionId
          this.status = STATUS.CONNECTED
          this.statusMessage = 'Ready — scan the QR code with your phone.'
          if (qrContainer) {
            try {
              _scanner.renderQR(qrContainer, MARVA_SCAN_MOBILE_URL)
              this.qrUrl = _scanner.getQRUrl(MARVA_SCAN_MOBILE_URL)
              this.qrReady = true
            } catch (e) {
              this.status = STATUS.ERROR
              this.statusMessage = 'QR render failed: ' + (e.message || e)
            }
          }
        },
        onStatus: (data) => {
          this.events.unshift({ kind: 'status', at: Date.now(), data })
          this.liveDataReceived = true
          this.liveActivity = humanCategory(data.category) + ' ' + humanStatus(data.status) + '…'
          // Any new attempt at this category clears any previous error banner.
          if (data.category && this.categoryErrors[data.category]) {
            const next = { ...this.categoryErrors }
            delete next[data.category]
            this.categoryErrors = next
          }
          this.writeToProfile()
        },
        onResult: (data) => {
          this.events.unshift({ kind: 'result', at: Date.now(), data })
          this.liveDataReceived = true
          if (data.category) {
            this.resultsByCategory = { ...this.resultsByCategory, [data.category]: data }
            // Result supersedes any prior error for this category.
            if (this.categoryErrors[data.category]) {
              const next = { ...this.categoryErrors }
              delete next[data.category]
              this.categoryErrors = next
            }
            this.liveActivity = humanCategory(data.category) + ' done.'
          }
          this.writeToProfile()
        },
        onError: (err) => {
          this.events.unshift({ kind: 'error', at: Date.now(), data: err })
          if (err && err.category) {
            this.liveDataReceived = true
            this.categoryErrors = {
              ...this.categoryErrors,
              [err.category]: {
                error: err.error || 'error',
                message: err.message || err.error || 'Unknown error',
                at: Date.now(),
              },
            }
            this.liveActivity = humanCategory(err.category) + ' failed.'
          } else {
            this.status = STATUS.ERROR
            this.statusMessage = 'Connection error: ' + (err && (err.message || err.error) || 'unknown')
          }
        },
        onClose: () => {
          if (this.status !== STATUS.ERROR) {
            this.status = STATUS.CLOSED
            this.statusMessage = 'Disconnected.'
          }
        },
      })

      try {
        await _scanner.connect()
      } catch (e) {
        this.status = STATUS.ERROR
        this.statusMessage = 'Failed to connect: ' + (e.message || e)
      }
    },

    disconnect() {
      if (_scanner) {
        try { _scanner.disconnect() } catch { /* ignore */ }
        _scanner = null
      }
    },

    /**
     * Fetch a presigned image URL for a given category. Tries every known
     * resource ID until one returns a real URL. For TOC pass an `index`
     * (1-based) for the page; otherwise omit.
     *
     * Returns { url } on success, { error } on miss.
     */
    async fetchImageUrl(category, index) {
      const tried = []
      const tryRid = async (rid) => {
        if (!rid || tried.includes(rid)) return null
        tried.push(rid)
        try {
          const res = await MarvaScan.imageUrl(rid, category, index)
          if (res && res.url) return res
        } catch { /* fall through to next rid */ }
        return null
      }

      // 1. Live session resource ID.
      let res = await tryRid(this.resourceId)
      if (res) return res

      // 2. Any rid the /retrieve probe found this category under.
      for (const rid of Object.keys(this.retrievedResults)) {
        const cats = this.retrievedResults[rid] || {}
        if (!cats[category]) continue
        res = await tryRid(rid)
        if (res) return res
      }

      // 3. Profile identifiers as a last resort.
      const ids = this.collectResourceIds().all
      for (const rid of ids) {
        res = await tryRid(rid)
        if (res) return res
      }

      return { error: 'image not found' }
    },

    /**
     * Persist the current scan snapshot onto the active profile under the
     * `marvaScan` key. Phase 2 will read from this to populate components.
     */
    writeToProfile() {
      const profile = useProfileStore().activeProfile
      if (!profile || !profile.id) return
      profile.marvaScan = {
        resourceId: this.resourceId,
        connectionId: this.connectionId,
        updatedAt: Date.now(),
        results: { ...this.resultsByCategory },
      }
    },

    /**
     * Insert Title information onto both the Instance and Work RTs.
     *
     * - Instance gets bf:mainTitle + (optional) bf:subtitle as separate fields.
     * - Work gets a single bf:mainTitle of "<main> : <subtitle>" when a subtitle
     *   is present, else just the main title.
     *
     * Mutates existing title PTs in place — preserves parent/parentId/preferenceId
     * created by the profile loader so we don't have to fabricate them.
     *
     * @param {{mainTitle: string, subtitle?: string}} payload
     * @returns {boolean} true if at least one title PT was written
     */
    async insertTitle(payload) {
      if (!payload || !payload.mainTitle) return false
      const profileStore = useProfileStore()
      const profile = profileStore.activeProfile
      if (!profile || !profile.rt) return false

      const main = String(payload.mainTitle).trim()
      const sub = payload.subtitle ? String(payload.subtitle).trim() : ''
      if (!main) return false

      let wrote = false

      // Instance: separate mainTitle + subtitle fields.
      const instanceRt = this._findRt(profile, ':Instance')
      if (instanceRt) {
        const ok = await this._writeTitleIntoRt(profileStore, profile, instanceRt, {
          mainTitle: main,
          subtitle: sub,
        })
        if (ok) wrote = true
      }

      // Work: single combined mainTitle, no subtitle field.
      const workRt = this._findRt(profile, ':Work')
      if (workRt) {
        const combined = sub ? `${main} : ${sub}` : main
        const ok = await this._writeTitleIntoRt(profileStore, profile, workRt, {
          mainTitle: combined,
        })
        if (ok) wrote = true
      }

      if (wrote) {
        try { profileStore.dataChanged() } catch { /* best-effort */ }
      }
      return wrote
    },

    /** Find the first RT whose key contains the given suffix (e.g. ':Instance', ':Work'). */
    _findRt(profile, suffix) {
      for (const rtKey of (profile.rtOrder || Object.keys(profile.rt))) {
        if (rtKey.indexOf(suffix) > -1) return rtKey
      }
      return null
    },

    /**
     * Find an empty PT in the given RT matching `propertyURI` (and optionally
     * filtered further by `predicate`), or duplicate an existing populated
     * matching PT to create a fresh empty slot. Returns the live PT to write
     * into (or null if no template PT exists at all).
     *
     * Never overwrites populated user data — duplication preserves it.
     */
    async _ensureEmptyPt(profileStore, profile, rtKey, propertyURI, predicate = null) {
      let emptyPt = null
      let lastPt = null
      for (const ptId of (profile.rt[rtKey].ptOrder || [])) {
        const pt = profile.rt[rtKey].pt[ptId]
        if (!pt || pt.propertyURI !== propertyURI || pt.deleted) continue
        if (predicate && !predicate(pt)) continue
        lastPt = pt
        const uv = pt.userValue
        const arr = uv && uv[propertyURI]
        const isEmpty = !uv || !arr || arr.length === 0
        if (isEmpty) emptyPt = pt
      }
      if (emptyPt) return emptyPt
      if (!lastPt) return null

      // All existing matching PTs are populated — duplicate the last one to get
      // a fresh empty slot. duplicateComponent inserts a new PT immediately
      // after the source and returns its @guid.
      const newGuid = await profileStore.duplicateComponent(
        lastPt['@guid'],
        profileStore.returnStructureByGUID(lastPt['@guid']),
      )
      if (!newGuid) return null

      for (const ptId of (profile.rt[rtKey].ptOrder || [])) {
        const pt = profile.rt[rtKey].pt[ptId]
        if (pt && pt['@guid'] === newGuid) return pt
      }
      return null
    },

    /**
     * Locate (or create via duplication) a bf:title PT inside the given RT and
     * write a fresh title bnode (mainTitle + optional subtitle) into it.
     */
    async _writeTitleIntoRt(profileStore, profile, rtKey, { mainTitle, subtitle }) {
      const TITLE = 'http://id.loc.gov/ontologies/bibframe/title'
      const MAIN = 'http://id.loc.gov/ontologies/bibframe/mainTitle'
      const SUB = 'http://id.loc.gov/ontologies/bibframe/subtitle'

      const targetPt = await this._ensureEmptyPt(profileStore, profile, rtKey, TITLE)
      if (!targetPt) return false

      const titleNode = {
        '@guid': translator.new(),
        '@type': 'http://id.loc.gov/ontologies/bibframe/Title',
        [MAIN]: [
          {
            '@guid': translator.new(),
            [MAIN]: mainTitle,
          },
        ],
      }
      if (subtitle) {
        titleNode[SUB] = [
          {
            '@guid': translator.new(),
            [SUB]: subtitle,
          },
        ]
      }

      targetPt.userValue = {
        '@guid': (targetPt.userValue && targetPt.userValue['@guid']) || translator.new(),
        '@root': TITLE,
        [TITLE]: [titleNode],
      }
      targetPt.hasData = true
      targetPt.userModified = true
      targetPt.dataLoaded = false
      return true
    },

    /**
     * Insert a Statement of Responsibility literal onto the Instance RT.
     *
     * @param {{text: string}} payload
     * @returns {boolean} true on success
     */
    /**
     * Insert the primary author (PrimaryContribution) onto the Work RT.
     * @param {{name: string, roles: Array<{label, code, uri}>}} payload
     */
    async insertPrimaryAuthor(payload) {
      return this._insertContribution(payload, {
        outerType: 'http://id.loc.gov/ontologies/bibframe/PrimaryContribution',
        agentInnerType: 'http://id.loc.gov/ontologies/bibframe/PrimaryContribution',
        preferenceSuffix: '|http://id.loc.gov/ontologies/bibframe/PrimaryContribution',
      })
    },

    /**
     * Insert one Contributor (Contribution) onto the Work RT.
     * @param {{name: string, roles: Array<{label, code, uri}>}} payload
     */
    async insertContributor(payload) {
      return this._insertContribution(payload, {
        outerType: 'http://id.loc.gov/ontologies/bibframe/Contribution',
        agentInnerType: 'http://id.loc.gov/ontologies/bibframe/Contribution',
        preferenceSuffix: '|http://id.loc.gov/ontologies/bibframe/Contribution',
      })
    },

    async _insertContribution(payload, opts) {
      if (!payload || !isMeaningfulText(payload.name)) return false
      const profileStore = useProfileStore()
      const profile = profileStore.activeProfile
      if (!profile || !profile.rt) return false

      const workRt = this._findRt(profile, ':Work')
      if (!workRt) return false

      const PROP = 'http://id.loc.gov/ontologies/bibframe/contribution'
      const ROLE = 'http://id.loc.gov/ontologies/bibframe/role'
      const AGENT = 'http://id.loc.gov/ontologies/bibframe/agent'
      const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'
      const CODE = 'http://id.loc.gov/ontologies/bibframe/code'
      const MARCKEY = 'http://id.loc.gov/ontologies/bflc/marcKey'
      const ROLE_TYPE = 'http://id.loc.gov/ontologies/bibframe/Role'

      const targetPt = await this._ensureEmptyPt(
        profileStore,
        profile,
        workRt,
        PROP,
        (pt) => typeof pt.preferenceId === 'string' && pt.preferenceId.endsWith(opts.preferenceSuffix),
      )
      if (!targetPt) return false

      const contribNode = {
        '@guid': translator.new(),
        '@type': opts.outerType,
        [AGENT]: [
          {
            '@guid': translator.new(),
            '@type': opts.agentInnerType,
            [LABEL]: [
              {
                '@guid': translator.new(),
                [LABEL]: String(payload.name).trim(),
              },
            ],
            [MARCKEY]: [],
          },
        ],
      }

      const roles = Array.isArray(payload.roles) ? payload.roles : []
      const validRoles = roles.filter((r) => r && isMeaningfulText(r.code))
      if (validRoles.length > 0) {
        contribNode[ROLE] = validRoles.map((r) => {
          const node = {
            '@guid': translator.new(),
            '@type': ROLE_TYPE,
            '@id': r.uri || ('http://id.loc.gov/vocabulary/relators/' + r.code),
          }
          if (isMeaningfulText(r.label)) {
            node[LABEL] = [{ '@guid': translator.new(), [LABEL]: String(r.label).trim() }]
          }
          node[CODE] = [{ '@guid': translator.new(), [CODE]: String(r.code).trim() }]
          return node
        })
      }

      targetPt.userValue = {
        '@guid': (targetPt.userValue && targetPt.userValue['@guid']) || translator.new(),
        '@root': PROP,
        [PROP]: [contribNode],
      }
      targetPt.hasData = true
      targetPt.userModified = true
      targetPt.dataLoaded = false

      try { profileStore.dataChanged() } catch { /* best-effort */ }
      return true
    },

    /**
     * Insert a Provision Activity (Publication) onto the Instance RT.
     * @param {{date?: string, publisher?: string, placeCode?: string,
     *          placeLabel?: string, city?: string}} payload
     */
    async insertProvisionActivity(payload) {
      if (!payload) return false
      const date = isMeaningfulText(payload.date) ? String(payload.date).trim() : ''
      const publisher = isMeaningfulText(payload.publisher) ? String(payload.publisher).trim() : ''
      const placeCode = isMeaningfulText(payload.placeCode) ? String(payload.placeCode).trim() : ''
      // Prefer an explicit non-code label; if the caller gave us nothing or
      // just the code itself, look it up again in the full MARC map.
      let placeLabel = isMeaningfulText(payload.placeLabel) ? String(payload.placeLabel).trim() : ''
      if (!placeLabel || placeLabel.toLowerCase() === placeCode.toLowerCase()) {
        placeLabel = placeLabelForCode(placeCode)
      }
      const city = isMeaningfulText(payload.city) ? String(payload.city).trim() : ''
      if (!date && !publisher && !placeCode && !city) return false

      const profileStore = useProfileStore()
      const profile = profileStore.activeProfile
      if (!profile || !profile.rt) return false

      const instanceRt = this._findRt(profile, ':Instance')
      if (!instanceRt) return false

      const PROP = 'http://id.loc.gov/ontologies/bibframe/provisionActivity'
      const PUB_TYPE = 'http://id.loc.gov/ontologies/bibframe/Publication'
      const DATE = 'http://id.loc.gov/ontologies/bibframe/date'
      const PLACE = 'http://id.loc.gov/ontologies/bibframe/place'
      const PLACE_TYPE = 'http://id.loc.gov/ontologies/bibframe/Place'
      const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'
      const CODE = 'http://id.loc.gov/ontologies/bibframe/code'
      const SIMPLE_AGENT = 'http://id.loc.gov/ontologies/bflc/simpleAgent'
      const SIMPLE_DATE = 'http://id.loc.gov/ontologies/bflc/simpleDate'
      const SIMPLE_PLACE = 'http://id.loc.gov/ontologies/bflc/simplePlace'
      const EDTF_DT = 'http://id.loc.gov/datatypes/edtf'
      const STR_DT = 'http://www.w3.org/2001/XMLSchema#string'

      // Filter PubInfoNew specifically (provisionActivity has 4 sibling templates).
      const targetPt = await this._ensureEmptyPt(
        profileStore,
        profile,
        instanceRt,
        PROP,
        (pt) => typeof pt.preferenceId === 'string' && pt.preferenceId.endsWith('|lc:RT:bf2:PubInfoNew'),
      )
      if (!targetPt) return false

      const pubNode = {
        '@guid': translator.new(),
        '@type': PUB_TYPE,
      }

      if (date) {
        pubNode[DATE] = [
          {
            '@guid': translator.new(),
            [DATE]: date,
            '@datatype': EDTF_DT,
          },
        ]
        pubNode[SIMPLE_DATE] = [
          {
            '@guid': translator.new(),
            [SIMPLE_DATE]: date,
          },
        ]
      }

      if (placeCode) {
        const placeNode = {
          '@guid': translator.new(),
          '@type': PLACE_TYPE,
          '@id': 'http://id.loc.gov/vocabulary/countries/' + placeCode,
          [CODE]: [
            {
              '@guid': translator.new(),
              [CODE]: placeCode,
              '@datatype': STR_DT,
            },
          ],
        }
        if (placeLabel) {
          placeNode[LABEL] = [
            {
              '@guid': translator.new(),
              [LABEL]: placeLabel,
              '@language': 'en',
            },
          ]
        }
        pubNode[PLACE] = [placeNode]
      }

      if (publisher) {
        pubNode[SIMPLE_AGENT] = [
          {
            '@guid': translator.new(),
            [SIMPLE_AGENT]: publisher,
          },
        ]
      }

      if (city) {
        pubNode[SIMPLE_PLACE] = [
          {
            '@guid': translator.new(),
            [SIMPLE_PLACE]: city,
          },
        ]
      }

      targetPt.userValue = {
        '@guid': (targetPt.userValue && targetPt.userValue['@guid']) || translator.new(),
        '@root': PROP,
        [PROP]: [pubNode],
      }
      targetPt.hasData = true
      targetPt.userModified = true
      targetPt.dataLoaded = false

      try { profileStore.dataChanged() } catch { /* best-effort */ }
      return true
    },

    /**
     * Insert a Summary onto the Work RT. Wraps the text in a bf:Summary bnode
     * with an rdfs:label literal.
     * @param {{text: string}} payload
     */
    async insertSummary(payload) {
      return this._insertLabelBnode(payload, {
        propertyURI: 'http://id.loc.gov/ontologies/bibframe/summary',
        typeURI: 'http://id.loc.gov/ontologies/bibframe/Summary',
        rtSuffix: ':Work',
      })
    },

    /**
     * Insert a Table of Contents onto the Work RT. Wraps the text in a
     * bf:TableOfContents bnode with an rdfs:label literal.
     * @param {{text: string}} payload
     */
    async insertToc(payload) {
      return this._insertLabelBnode(payload, {
        propertyURI: 'http://id.loc.gov/ontologies/bibframe/tableOfContents',
        typeURI: 'http://id.loc.gov/ontologies/bibframe/TableOfContents',
        rtSuffix: ':Work',
      })
    },

    /**
     * Generic insert: wrap text in a typed bnode with rdfs:label and write it
     * into the matching PT on the RT identified by `rtSuffix`.
     */
    async _insertLabelBnode(payload, opts) {
      const text = payload && typeof payload.text === 'string' ? payload.text.trim() : ''
      if (!text) return false
      const profileStore = useProfileStore()
      const profile = profileStore.activeProfile
      if (!profile || !profile.rt) return false

      const rtKey = this._findRt(profile, opts.rtSuffix)
      if (!rtKey) return false

      const PROP = opts.propertyURI
      const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'

      const targetPt = await this._ensureEmptyPt(profileStore, profile, rtKey, PROP)
      if (!targetPt) return false

      const bnode = {
        '@guid': translator.new(),
        '@type': opts.typeURI,
        [LABEL]: [
          {
            '@guid': translator.new(),
            [LABEL]: text,
          },
        ],
      }

      targetPt.userValue = {
        '@guid': (targetPt.userValue && targetPt.userValue['@guid']) || translator.new(),
        '@root': PROP,
        [PROP]: [bnode],
      }
      targetPt.hasData = true
      targetPt.userModified = true
      targetPt.dataLoaded = false

      try { profileStore.dataChanged() } catch { /* best-effort */ }
      return true
    },

    async insertEditionStatement(payload) {
      const text = payload && typeof payload.text === 'string' ? payload.text.trim() : ''
      if (!text) return false
      const profileStore = useProfileStore()
      const profile = profileStore.activeProfile
      if (!profile || !profile.rt) return false

      const instanceRt = this._findRt(profile, ':Instance')
      if (!instanceRt) return false

      const PROP = 'http://id.loc.gov/ontologies/bibframe/editionStatement'
      const targetPt = await this._ensureEmptyPt(profileStore, profile, instanceRt, PROP)
      if (!targetPt) return false

      targetPt.userValue = {
        '@guid': (targetPt.userValue && targetPt.userValue['@guid']) || translator.new(),
        '@root': PROP,
        [PROP]: [
          {
            '@guid': translator.new(),
            [PROP]: text,
          },
        ],
      }
      targetPt.hasData = true
      targetPt.userModified = true
      targetPt.dataLoaded = false

      try { profileStore.dataChanged() } catch { /* best-effort */ }
      return true
    },

    async insertResponsibilityStatement(payload) {
      const text = payload && typeof payload.text === 'string' ? payload.text.trim() : ''
      if (!text) return false
      const profileStore = useProfileStore()
      const profile = profileStore.activeProfile
      if (!profile || !profile.rt) return false

      const instanceRt = this._findRt(profile, ':Instance')
      if (!instanceRt) return false

      const PROP = 'http://id.loc.gov/ontologies/bibframe/responsibilityStatement'
      const targetPt = await this._ensureEmptyPt(profileStore, profile, instanceRt, PROP)
      if (!targetPt) return false

      targetPt.userValue = {
        '@guid': (targetPt.userValue && targetPt.userValue['@guid']) || translator.new(),
        '@root': PROP,
        [PROP]: [
          {
            '@guid': translator.new(),
            [PROP]: text,
          },
        ],
      }
      targetPt.hasData = true
      targetPt.userModified = true
      targetPt.dataLoaded = false

      try { profileStore.dataChanged() } catch { /* best-effort */ }
      return true
    },
  },
})

export const MARVA_SCAN_STATUS = STATUS
export const MARVA_SCAN_URLS = {
  ws: MARVA_SCAN_WS_URL,
  process: MARVA_SCAN_PROCESS_URL,
  mobile: MARVA_SCAN_MOBILE_URL,
}
