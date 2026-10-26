<template>
  <!-- a setting on a node that is picked from a list, with its name in front so the row reads
       "Into field: Summary / Summary note". Baklava's own select shows the value alone, and
       nothing at all until something is picked -->
  <label class="wf-graph-control" @pointerdown.stop @keydown.stop>
    <span class="wf-graph-control-label">{{ intf.name }}</span>
    <select class="wf-graph-control-select" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <template v-if="groups.length > 0">
        <option v-for="item in ungrouped" :key="String(item.value)" :value="item.value">{{ item.text }}</option>
        <optgroup v-for="group in groups" :key="group.label" :label="group.label">
          <option v-for="item in group.items" :key="String(item.value)" :value="item.value">{{ item.text }}</option>
        </optgroup>
      </template>
      <template v-else>
        <option v-for="item in items" :key="String(item.value)" :value="item.value">{{ item.text }}</option>
      </template>
    </select>
  </label>
</template>

<script>
export default {
  name: 'GraphSelect',
  props: {
    intf: Object,
    node: Object,
    modelValue: [String, Number, Boolean],
  },
  emits: ['update:modelValue'],
  computed: {
    // items are {text, value, group?} or plain strings
    items(){
      return (this.intf.items || []).map((i) => { return (typeof i === 'string') ? { text: i, value: i } : i })
    },
    ungrouped(){
      return this.items.filter((i) => { return !i.group })
    },
    groups(){
      let groups = []
      for (let item of this.items){
        if (!item.group){ continue }
        let group = groups.filter((g) => { return g.label === item.group })[0]
        if (!group){
          group = { label: item.group, items: [] }
          groups.push(group)
        }
        group.items.push(item)
      }
      return groups
    },
  },
}
</script>
