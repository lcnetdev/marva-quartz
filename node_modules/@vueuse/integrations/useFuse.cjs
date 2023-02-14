'use strict';

var Fuse = require('fuse.js');
var vueDemi = require('vue-demi');
var shared = require('@vueuse/shared');

function useFuse(search, data, options) {
  const createFuse = () => {
    var _a, _b;
    return new Fuse((_a = shared.resolveUnref(data)) != null ? _a : [], (_b = shared.resolveUnref(options)) == null ? void 0 : _b.fuseOptions);
  };
  const fuse = vueDemi.ref(createFuse());
  vueDemi.watch(() => {
    var _a;
    return (_a = shared.resolveUnref(options)) == null ? void 0 : _a.fuseOptions;
  }, () => {
    fuse.value = createFuse();
  }, { deep: true });
  vueDemi.watch(() => shared.resolveUnref(data), (newData) => {
    fuse.value.setCollection(newData);
  }, { deep: true });
  const results = vueDemi.computed(() => {
    const resolved = shared.resolveUnref(options);
    if ((resolved == null ? void 0 : resolved.matchAllWhenSearchEmpty) && !vueDemi.unref(search))
      return shared.resolveUnref(data).map((item, index) => ({ item, refIndex: index }));
    const limit = resolved == null ? void 0 : resolved.resultLimit;
    return fuse.value.search(shared.resolveUnref(search), limit ? { limit } : void 0);
  });
  return {
    fuse,
    results
  };
}

exports.useFuse = useFuse;
