<template>
  <!-- a text setting on a node, with its name in front so it still says what it is once something is typed -->
  <label class="wf-graph-control" @pointerdown.stop @keydown.stop>
    <span class="wf-graph-control-label">{{ intf.name }}</span>
    <input type="text" class="wf-graph-control-text" :value="modelValue" :placeholder="intf.placeholder || ''" @input="$emit('update:modelValue', $event.target.value)" />
    <!-- a URI for a linked field: look it up against the field's own authorities instead of typing it -->
    <button v-if="linkedField" type="button" class="wf-graph-control-lookup" :title="'Look up a value for ' + linkedField.label + ' (' + linkedField.sources + ')'" @click.prevent.stop="lookup()">
      <span class="material-icons">search</span>
    </button>
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
  // from GraphBuilder: what field a target port is, and the lookup modal (absent anywhere else a node might be drawn)
  inject: {
    wfGraphLinkedField: { default: null },
    wfGraphLookupLinked: { default: null },
  },
  computed: {
    /**
    * The linked field the node writes to, when this is a URI setting and the node's "into field"
    * is a complex lookup field (a contributor, a subject...): then a search can fill it
    * @return {object|null} - {label, sources} from GraphBuilder.linkedField
    */
    linkedField(){
      if (!this.intf || !this.intf.lookup || !this.wfGraphLinkedField || !this.node || !this.node.inputs){ return null }
      let target = this.node.inputs.target
      if (!target || !target.value){ return null }
      return this.wfGraphLinkedField(target.value)
    },
  },
  methods: {
    /**
    * Open the lookup on the target field's authorities. What is picked goes into this URI setting
    * and its label into the node's text setting (what the record will show for it)
    */
    async lookup(){
      if (!this.wfGraphLookupLinked || !this.linkedField){ return }
      let textIntf = this.node.inputs.text
      let picked = await this.wfGraphLookupLinked(this.node.inputs.target.value, textIntf ? textIntf.value : '')
      if (!picked){ return }
      if (picked.uri){
        this.$emit('update:modelValue', picked.uri)
        if (textIntf){ textIntf.value = picked.label || '' }
      } else if (picked.label){
        // a literal was picked: it is text, not a link
        this.$emit('update:modelValue', '')
        if (textIntf){ textIntf.value = picked.label }
      }
    },
  },
}
</script>
