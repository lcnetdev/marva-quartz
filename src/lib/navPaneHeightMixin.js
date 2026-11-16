// Keeps the nav pane the same pixel height when the window is resized.
// Splitpanes sizes panes in percents, so the nav height (in pixels) is converted using the window height.
// window.innerHeight isn't reactive, so it's kept in data and updated on resize, which makes Vue recalculate the pane size.
export default {
  data() {
    return {
      windowHeight: window.innerHeight,
    }
  },
  methods: {
    onWindowResize: function () {
      this.windowHeight = window.innerHeight
    },
    // converts a pixel height to a percent of the window height
    returnPixleAsPercent: function (pixles) {
      return pixles / this.windowHeight * 100
    },
  },
  mounted() {
    window.addEventListener('resize', this.onWindowResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onWindowResize)
  },
}
