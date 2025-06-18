import { expect, test } from 'vitest'
import utils_export from "@/lib/utils_export";
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'


import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { monograph_subject_simple_complex_sub } from './xml/monograph_subject_simple_complex_sub.json'

const pinia = createPinia()
const app = createApp()
app.use(pinia)

let profile = monograph_subject_simple_complex_sub

// buildXMLProcess calls a function that requires "this.activeProfile" to be populated
useProfileStore().activeProfile = profile
usePreferenceStore().catInitals = "test"
usePreferenceStore().catCode = "test"

let simpleComplexSubXml = await utils_export.buildXMLProcess(profile)

describe('Subject XML is correct', () => {
    describe("Simple Subject with complex subdivision", () => {
        it('should have..?', () => {
            expect(simpleComplexSubXml).toBe("x")
        });
    })
});