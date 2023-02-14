'use strict';

var shared = require('@vueuse/shared');
var Schema = require('async-validator');
var vueDemi = require('vue-demi');

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function useAsyncValidator(value, rules, options = {}) {
  const errorInfo = vueDemi.ref();
  const isFinished = vueDemi.ref(false);
  const pass = vueDemi.ref(false);
  const errors = vueDemi.computed(() => {
    var _a;
    return ((_a = errorInfo.value) == null ? void 0 : _a.errors) || [];
  });
  const errorFields = vueDemi.computed(() => {
    var _a;
    return ((_a = errorInfo.value) == null ? void 0 : _a.fields) || {};
  });
  const { validateOption = {} } = options;
  vueDemi.watchEffect(async () => {
    isFinished.value = false;
    pass.value = false;
    const validator = new Schema(shared.resolveUnref(rules));
    try {
      await validator.validate(shared.resolveUnref(value), validateOption);
      pass.value = true;
      errorInfo.value = null;
    } catch (err) {
      errorInfo.value = err;
    } finally {
      isFinished.value = true;
    }
  });
  const shell = {
    pass,
    isFinished,
    errorInfo,
    errors,
    errorFields
  };
  function waitUntilFinished() {
    return new Promise((resolve, reject) => {
      shared.until(isFinished).toBe(true).then(() => resolve(shell)).catch((error) => reject(error));
    });
  }
  return __spreadProps(__spreadValues({}, shell), {
    then(onFulfilled, onRejected) {
      return waitUntilFinished().then(onFulfilled, onRejected);
    }
  });
}

exports.useAsyncValidator = useAsyncValidator;
