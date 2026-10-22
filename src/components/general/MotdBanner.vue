<script>
/**
* Message of the day banner.
*
* Shows the `motd` string from the current region's config (configStore.returnUrls.motd)
* as a dismissable bar across the top of the page. Dismissing it is remembered in
* sessionStorage for DISMISS_FOR_MS; a changed message shows again straight away.
*
* Emits `height` with the banner's pixel height (0 when hidden) so the layout can
* make room for it.
*/
import { useConfigStore } from '@/stores/config'
import { mapStores } from 'pinia'

const STORAGE_KEY = 'marva-motd-dismissed'
const DISMISS_FOR_MS = 4 * 60 * 60 * 1000

function readDismissal() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    return null
  }
}

export default {
  name: 'MotdBanner',
  emits: ['height'],
  data() {
    return {
      dismissal: readDismissal(),
      resizeObserver: null,
    }
  },
  computed: {
    ...mapStores(useConfigStore),
    message() {
      const motd = this.configStore.returnUrls.motd
      return typeof motd === 'string' ? motd.trim() : ''
    },
    visible() {
      if (!this.message) { return false }
      const d = this.dismissal
      if (d && d.message === this.message && (Date.now() - d.at) < DISMISS_FOR_MS) {
        return false
      }
      return true
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler() {
        this.$nextTick(() => this.reportHeight())
      },
    },
  },
  methods: {
    dismiss() {
      this.dismissal = { message: this.message, at: Date.now() }
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.dismissal))
      } catch (err) {
        console.warn('MOTD: could not remember dismissal', err)
      }
    },
    reportHeight() {
      const el = this.$refs.banner
      this.$emit('height', el ? el.offsetHeight : 0)
    },
    observe() {
      if (this.resizeObserver) { this.resizeObserver.disconnect() }
      const el = this.$refs.banner
      if (el && typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.reportHeight())
        this.resizeObserver.observe(el)
      }
    },
  },
  mounted() {
    this.observe()
  },
  updated() {
    this.observe()
  },
  beforeUnmount() {
    if (this.resizeObserver) { this.resizeObserver.disconnect() }
    this.$emit('height', 0)
  },
}
</script>

<template>
  <div v-if="visible" ref="banner" class="motd-banner" role="status">
    <span class="motd-banner-text" v-html="message"></span>
    <button class="motd-banner-close" type="button" title="Dismiss for 4 hours" aria-label="Dismiss message" @click="dismiss">&times;</button>
  </div>
</template>

<style scoped>
.motd-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px 6px 16px;
  background: #2b5797;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
  box-sizing: border-box;
}
.motd-banner-text {
  flex: 1;
  min-width: 0;
}
.motd-banner-text :deep(a) {
  color: #ffffff;
  text-decoration: underline;
}
.motd-banner-close {
  flex: none;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: #ffffff;
  border-radius: 4px;
  width: 26px;
  height: 26px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}
.motd-banner-close:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>
