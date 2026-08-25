<template>
  <Teleport to="body">
    <div v-if="stateRecorderStore.replayActive" class="state-replay-controls">

      <div class="state-replay-info">
        <span class="state-replay-title">State Replay</span>
        <span class="state-replay-record" v-if="stateRecorderStore.replayMeta && stateRecorderStore.replayMeta.recordId">{{ stateRecorderStore.replayMeta.recordId }}</span>
        <span class="state-replay-position">{{ positionLabel }}</span>
      </div>

      <div class="state-replay-buttons">
        <button title="Jump to the initial state" @click="stateRecorderStore.replayGoTo(0)">⏮</button>
        <button title="Previous change" @click="stateRecorderStore.replayStep(-1)">‹ Prev</button>
        <button :title="stateRecorderStore.replayPlaying ? 'Pause' : 'Play the changes'" class="state-replay-play" @click="stateRecorderStore.replayTogglePlay()">{{ stateRecorderStore.replayPlaying ? '⏸ Pause' : '▶ Play' }}</button>
        <button title="Next change" @click="stateRecorderStore.replayStep(1)">Next ›</button>
        <button title="Jump to the final state" @click="stateRecorderStore.replayGoTo(stateRecorderStore.replayTotal)">⏭</button>
      </div>

      <input
        class="state-replay-slider"
        type="range"
        min="0"
        :max="stateRecorderStore.replayTotal"
        :value="stateRecorderStore.replayIndex"
        @input="stateRecorderStore.replayGoTo($event.target.value)"
      />

      <button class="state-replay-close" title="Close the replay controls" @click="stateRecorderStore.closeReplay()">✕</button>

    </div>
  </Teleport>
</template>

<script>
import { mapStores } from 'pinia'
import { useStateRecorderStore } from '@/stores/stateRecorder'

export default {
  name: 'StateReplayControls',
  computed: {
    ...mapStores(useStateRecorderStore),

    positionLabel() {
      const store = this.stateRecorderStore
      if (store.replayIndex === 0) {
        return `Initial state (${store.replayTotal} changes)`
      }
      let label = `Change ${store.replayIndex} of ${store.replayTotal}`
      const eventTime = store.replayEventTimes[store.replayIndex - 1]
      if (store.replayMeta && store.replayMeta.started && eventTime) {
        label += ` — +${((eventTime - store.replayMeta.started) / 1000).toFixed(1)}s`
      }
      return label
    }
  }
}
</script>

<style scoped>
.state-replay-controls {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background-color: rgb(32, 33, 36);
  color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  font-size: 0.85em;
  max-width: 95vw;
}

.state-replay-info {
  display: flex;
  flex-direction: column;
  white-space: nowrap;
}

.state-replay-title {
  font-weight: bold;
  color: rgb(255, 196, 0);
}

.state-replay-record {
  font-size: 0.85em;
  opacity: 0.8;
}

.state-replay-position {
  font-variant-numeric: tabular-nums;
}

.state-replay-buttons {
  display: flex;
  gap: 4px;
}

.state-replay-controls button {
  background-color: rgb(60, 64, 67);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
}

.state-replay-controls button:hover {
  background-color: rgb(95, 99, 104);
}

.state-replay-play {
  min-width: 70px;
}

.state-replay-slider {
  width: 220px;
  cursor: pointer;
}

.state-replay-close {
  margin-left: 4px;
}
</style>
