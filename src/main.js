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

app.config.errorHandler = (err, vm, info) => {
	// Handle the error
	console.error(err, vm, info);
  };
  



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

// testing: a list of identifiers to try in the workflows scan box
console.log(`9781534430990
9781839765841
9781839765841
0055220878A
00557855786
9780143138624
9781464246395
9781681379715
9781681379791
9781681379197
00552310019
00551991854
9781421452821
9781646023509
00552272134
00552351198
9780593954584
00552162523
9781250354990
00552351204
9780814259665
0055220878A
0055220878A
00540086138
00557855786
00557855233
00557855749
00557855774
9781496860217
9781032872032
00558044779
9781032749549
00546574064
9798337337050
9780802883162
00552350595
9780760399866
9781668072752
9781954276468
9781041032212
9781954276529
9783631935392
9781400349098
9798217044825
9780802167675
0055785292A
0055804181A
9780840706577
9781805398011
00545609745
00546137119
9781009447225
00538174579
9781540903570
9781009411677
9781009534567
9781009512923`)

app.mount("#app");


















