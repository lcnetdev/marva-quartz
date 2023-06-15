import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from 'vue-i18n'

import App from "./App.vue";
import router from "./router";
import i18nMessages from "./lib/i18n.js"
import { createVfm } from 'vue-final-modal'
import FloatingVue from 'floating-vue'

import "./assets/main.css";
import 'vue-final-modal/style.css'
import 'floating-vue/dist/style.css'

const i18n = createI18n({
	locale: 'en', // set locale
	// fallbackLocale: 'en', // set fallback locale
	messages: i18nMessages, // set locale messages
})


const app = createApp(App);




// import this one component globally since we use it recursively 
import Main from "./components/panels/edit/fields/Main.vue";
app.component('Main', Main)

// import MainInline from "./components/panels/edit/fields/MainInline.vue";
// app.component('MainInline', MainInline)






const vfm = createVfm()
app.use(vfm)


app.use(createPinia());
app.use(router);
app.use(i18n)
app.use(FloatingVue)

app.mount("#app");





















