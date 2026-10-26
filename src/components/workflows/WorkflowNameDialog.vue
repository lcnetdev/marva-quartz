<template>
  <div class="wf-dialog-overlay" @mousedown.self="$emit('cancel')">
    <form class="wf-dialog wf-name-dialog" @submit.prevent="ok" @keydown.esc.prevent="$emit('cancel')">
      <h2>{{ title }}</h2>
      <p v-if="message">{{ message }}</p>
      <label class="wf-builder-field">
        Name
        <input type="text" ref="input" v-model="name" :placeholder="placeholder" autocomplete="off" spellcheck="false" />
      </label>
      <div class="wf-dialog-buttons">
        <button type="button" @click="$emit('cancel')">Cancel</button>
        <button type="submit" class="wf-button-primary" :disabled="name.trim() === ''">{{ okLabel }}</button>
      </div>
    </form>
  </div>
</template>

<script>
/**
* Asks for a name: for a new sheet being opened from a workflow, or to rename one.
* Emits 'ok' with the trimmed name, or 'cancel'.
*/
export default {
  name: "WorkflowNameDialog",
  props: {
    title: { type: String, default: 'Name' },
    message: { type: String, default: '' },
    initial: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    okLabel: { type: String, default: 'OK' },
  },
  emits: ['ok', 'cancel'],
  data(){
    return {
      name: this.initial,
    }
  },
  methods: {
    ok(){
      let name = this.name.trim()
      if (name === ''){ return }
      this.$emit('ok', name)
    },
  },
  mounted(){
    this.$nextTick(() => {
      let input = this.$refs.input
      if (input){
        input.focus()
        input.select()
      }
    })
  },
}
</script>
