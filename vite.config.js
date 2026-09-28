import { fileURLToPath, URL } from "node:url";
import { configDefaults } from 'vitest/config'

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/marva/',
  // build: {
  //   sourcemap: true,
  //   minify: false,
  // },  
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',


    },
  },
  test:{
    globals: true,
    environment: "jsdom",
    globalSetup: './src/lib/vitest_globalSetup.js',    
    // Node 22+ defines its own global localStorage, which shadows jsdom's and has no getItem
    // ("window.localStorage.getItem is not a function"); turn it off in the test workers
    poolOptions: {
      forks: { execArgv: ['--no-experimental-webstorage'] },
      threads: { execArgv: ['--no-experimental-webstorage'] },
    },
    // setupFiles: './lib/vitest_globalSetup.js',   
    exclude:[
      ...configDefaults.exclude,
      'tests-playwright/*'
    ]


    
  }
});
