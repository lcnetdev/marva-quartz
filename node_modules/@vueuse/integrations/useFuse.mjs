import Fuse from 'fuse.js';
import { ref, watch, computed, unref } from 'vue-demi';
import { resolveUnref } from '@vueuse/shared';

function useFuse(search, data, options) {
  const createFuse = () => {
    var _a, _b;
    return new Fuse((_a = resolveUnref(data)) != null ? _a : [], (_b = resolveUnref(options)) == null ? void 0 : _b.fuseOptions);
  };
  const fuse = ref(createFuse());
  watch(() => {
    var _a;
    return (_a = resolveUnref(options)) == null ? void 0 : _a.fuseOptions;
  }, () => {
    fuse.value = createFuse();
  }, { deep: true });
  watch(() => resolveUnref(data), (newData) => {
    fuse.value.setCollection(newData);
  }, { deep: true });
  const results = computed(() => {
    const resolved = resolveUnref(options);
    if ((resolved == null ? void 0 : resolved.matchAllWhenSearchEmpty) && !unref(search))
      return resolveUnref(data).map((item, index) => ({ item, refIndex: index }));
    const limit = resolved == null ? void 0 : resolved.resultLimit;
    return fuse.value.search(resolveUnref(search), limit ? { limit } : void 0);
  });
  return {
    fuse,
    results
  };
}

export { useFuse };
