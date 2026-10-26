<template>
  <!-- a text setting on a node, with its name in front so it still says what it is once something is typed -->
  <label class="wf-graph-control" @pointerdown.stop @keydown.stop>
    <span class="wf-graph-control-label">{{ intf.name }}</span>
    <input type="text" class="wf-graph-control-text" :value="modelValue" :placeholder="intf.placeholder || ''" @input="$emit('update:modelValue', $event.target.value)" />
  </label>
</template>

<script>
export default {
  name: 'GraphText',
  props: {
    intf: Object,
    node: Object,
    modelValue: [String, Number],
  },
  emits: ['update:modelValue'],
}
</script>
