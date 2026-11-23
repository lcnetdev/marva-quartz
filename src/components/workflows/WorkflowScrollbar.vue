<template>
  <!--
    mousedown is stopped so pressing on the bar does not start dragging the sheet, and prevented so the
    keyboard stays with the selected cell. The click is stopped so it is not taken as a click on the sheet.
  -->
  <div
    :class="['wf-scrollbar', {
      'wf-scrollbar-auto-hide': autoHide,
      'wf-scrollbar-active': !!dragging || moved,
      'wf-scrollbar-dragging': !!dragging,
      'wf-scrollbar-nothing': max <= 0,
    }]"
    :style="barStyle"
    role="scrollbar"
    aria-orientation="horizontal"
    aria-label="Move left and right through the sheet"
    aria-valuemin="0"
    :aria-valuemax="Math.round(Math.max(0, max))"
    :aria-valuenow="Math.round(position)"
    @mousedown.stop.prevent
    @click.stop
    @dblclick.stop
  >
    <div v-if="arrows" class="wf-scrollbar-arrow wf-scrollbar-arrow-left" title="Move left" @mousedown="arrowDown($event, -1)"></div>
    <div ref="track" class="wf-scrollbar-track" @mousedown="trackDown">
      <div class="wf-scrollbar-thumb" :style="{ left: thumbLeft + 'px', width: thumbLength + 'px' }" @mousedown.stop.prevent="thumbDown">
        <span class="wf-scrollbar-thumb-fill"></span>
      </div>
    </div>
    <div v-if="arrows" class="wf-scrollbar-arrow wf-scrollbar-arrow-right" title="Move right" @mousedown="arrowDown($event, 1)"></div>
  </div>
</template>

<script>
/**
 * Workflows: the scroll bar along the bottom of the sheet (WorkflowGrid).
 *
 * The sheet is not a scrolling element, it is moved around with a css transform (dragged, the wheel,
 * the keyboard), so the browser has no scroll bar to show for it. This one is drawn here and only
 * talks in numbers: it is told where the sheet is and how far it can go, and says where it should
 * go. Whether it is shown and all of how it looks are preferences (the Workflows group).
 */
import { mapStores } from 'pinia'
import { usePreferenceStore } from '@/stores/preference'

// the thumb is never drawn thinner than this, however large the margin around it is set
const MIN_THUMB_THICKNESS = 4
// an arrow button: how far a press moves the sheet, and while it is held down how far, how soon and how often
const ARROW_STEP = 80
const ARROW_REPEAT_STEP = 40
const ARROW_REPEAT_AFTER = 350
const ARROW_REPEAT_EVERY = 50
// a press on the track moves the sheet by this much of what is in view, the rest stays to keep your place
const PAGE_PART = 0.9
// with "hide when not in use", how long the bar stays after the sheet last moved
const STAY_VISIBLE = 1200

export default {
  name: "WorkflowScrollbar",
  props: {
    // how far the sheet has been moved to the left, in screen pixels
    offset: { type: Number, default: 0 },
    // the furthest it can be moved
    max: { type: Number, default: 0 },
    // how wide the part in view is
    view: { type: Number, default: 0 },
  },
  emits: ['scroll'],
  data(){
    return {
      // measured, see measure()
      trackLength: 0,
      // the thumb is being dragged: {mouseX, offset} as it was when the drag began
      dragging: null,
      // the sheet moved a moment ago
      moved: false,
    }
  },
  computed: {
    ...mapStores(usePreferenceStore),

    size(){ return this.number('--n-workflows-scrollbar-size', 14) },
    minThumb(){ return this.number('--n-workflows-scrollbar-thumb-min', 40) },
    arrows(){ return !!this.preferenceStore.returnValue('--b-workflows-scrollbar-arrows') },
    autoHide(){ return !!this.preferenceStore.returnValue('--b-workflows-scrollbar-auto-hide') },

    // the space around the thumb, a thin bar does not have room for all of a large one
    inset(){
      let inset = this.number('--n-workflows-scrollbar-thumb-inset', 2)
      return Math.max(0, Math.min(inset, Math.floor((this.size - MIN_THUMB_THICKNESS) / 2)))
    },

    barStyle(){
      let ps = this.preferenceStore
      return {
        '--wf-sb-size': this.size + 'px',
        '--wf-sb-inset': this.inset + 'px',
        '--wf-sb-radius': this.number('--n-workflows-scrollbar-radius', 6) + 'px',
        '--wf-sb-thumb': ps.returnValue('--c-workflows-scrollbar-thumb-color'),
        '--wf-sb-thumb-hover': ps.returnValue('--c-workflows-scrollbar-thumb-hover-color'),
        '--wf-sb-track': ps.returnValue('--c-workflows-scrollbar-track-color'),
        '--wf-sb-border': ps.returnValue('--c-workflows-scrollbar-border-color'),
      }
    },

    // where the sheet is, kept inside what the bar can show
    position(){
      return Math.min(Math.max(0, this.offset), Math.max(0, this.max))
    },

    // the thumb is as much of the track as the part in view is of the whole sheet
    thumbLength(){
      if (this.trackLength <= 0){ return 0 }
      let whole = this.view + Math.max(0, this.max)
      let length = (whole > 0) ? this.trackLength * this.view / whole : this.trackLength
      return Math.min(this.trackLength, Math.max(this.minThumb, length))
    },

    thumbLeft(){
      if (this.max <= 0){ return 0 }
      return (this.trackLength - this.thumbLength) * this.position / this.max
    },
  },
  watch: {
    offset(){
      if (!this.autoHide){ return }
      this.moved = true
      window.clearTimeout(this.movedTimer)
      this.movedTimer = window.setTimeout(() => { this.moved = false }, STAY_VISIBLE)
    },
  },
  methods: {
    /**
    * A number preference, without its unit
    * @param {string} name - the preference
    * @param {number} fallback - when it is not a number
    * @return {number}
    */
    number(name, fallback){
      let value = parseFloat(this.preferenceStore.returnValue(name, true))
      return isNaN(value) ? fallback : value
    },

    measure(){
      if (this.$refs.track){ this.trackLength = this.$refs.track.clientWidth }
    },

    /**
    * Ask for the sheet to be moved, the sheet itself keeps it within its limits
    * @param {number} offset - how far to the left the sheet should be
    */
    scrollTo(offset){
      this.$emit('scroll', Math.min(Math.max(0, offset), Math.max(0, this.max)))
    },

    thumbDown(event){
      if (event.button !== 0 || this.max <= 0){ return }
      this.dragging = { mouseX: event.clientX, offset: this.position }
      window.addEventListener('mousemove', this.dragMove)
      window.addEventListener('mouseup', this.dragEnd)
    },

    dragMove(event){
      if (!this.dragging){ return }
      // the thumb only has what is left of the track to travel, that stands for all the sheet can move
      let room = this.trackLength - this.thumbLength
      if (room <= 0){ return }
      this.scrollTo(this.dragging.offset + (event.clientX - this.dragging.mouseX) * this.max / room)
      event.preventDefault()
    },

    dragEnd(){
      window.removeEventListener('mousemove', this.dragMove)
      window.removeEventListener('mouseup', this.dragEnd)
      this.dragging = null
    },

    /**
    * A press on the track beside the thumb moves a screen's worth that way
    */
    trackDown(event){
      if (event.button !== 0 || this.max <= 0){ return }
      let at = event.clientX - this.$refs.track.getBoundingClientRect().left
      let direction = (at < this.thumbLeft) ? -1 : 1
      this.scrollTo(this.position + direction * this.view * PAGE_PART)
    },

    /**
    * An arrow button moves a step, and keeps moving while it is held down
    * @param {number} direction - -1 left, 1 right
    */
    arrowDown(event, direction){
      if (event.button !== 0 || this.max <= 0){ return }
      this.arrowUp()
      this.scrollTo(this.position + direction * ARROW_STEP)
      this.arrowTimer = window.setTimeout(() => {
        this.arrowTimer = window.setInterval(() => {
          this.scrollTo(this.position + direction * ARROW_REPEAT_STEP)
        }, ARROW_REPEAT_EVERY)
      }, ARROW_REPEAT_AFTER)
      window.addEventListener('mouseup', this.arrowUp)
    },

    arrowUp(){
      // the one id is a timeout first and an interval after, clearing either kind takes both
      window.clearTimeout(this.arrowTimer)
      window.clearInterval(this.arrowTimer)
      this.arrowTimer = null
      window.removeEventListener('mouseup', this.arrowUp)
    },
  },
  mounted(){
    // not reactive, bookkeeping
    this.movedTimer = null
    this.arrowTimer = null
    this.measure()
    // the track changes length with the window, and when the arrow buttons come and go
    if (typeof ResizeObserver !== 'undefined'){
      this.observer = new ResizeObserver(() => { this.measure() })
      this.observer.observe(this.$refs.track)
    }
  },
  beforeUnmount(){
    if (this.observer){ this.observer.disconnect() }
    window.clearTimeout(this.movedTimer)
    this.arrowUp()
    this.dragEnd()
  },
}
</script>
