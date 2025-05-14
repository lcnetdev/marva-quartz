import { expect, test } from 'vitest'
import utils_parse from "@/lib/utils_parse";

import { useProfileStore } from '@/stores/profile'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

const fs = require("fs")

const pinia = createPinia()
const app = createApp()
app.use(pinia)



let xml = ''

let processedXml = utils_parse.sniffWorkRelationType(xml)


// --Test--
