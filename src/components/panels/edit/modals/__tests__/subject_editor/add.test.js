import { expect, test, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import utils_export from "@/lib/utils_export";
import { useProfileStore } from '@/stores/profile'
import SubjectEditor from  "@/components/panels/edit/modals/SubjectEditor.vue";


import { createPinia } from 'pinia'
import { createApp } from 'vue'

const pinia = createPinia()
const app = createApp()
app.use(pinia)


let expectedSimpleSubect = [{"label":"Dogs","uri":"http://id.loc.gov/authorities/subjects/sh85038796","id":0,"type":"madsrdf:Topic","complex":false,"literal":false,"posStart":0,"posEnd":4,"marcKey":"150  $aDogs"}]
let componentComplexHeading = [{"label":"Food","uri":"http://id.loc.gov/authorities/subjects/sh85050184","id":0,"type":"madsrdf:Topic","complex":false,"literal":false,"posStart":0,"posEnd":4,"marcKey":"150  $aFood"},{"label":"History‑‑20th century","uri":"http://id.loc.gov/authorities/subjects/sh2002006165","id":1,"type":"madsrdf:Topic","complex":true,"literal":false,"posStart":6,"posEnd":27,"marcKey":"180  $xHistory$y20th century"}]
let expectedComplexHeading = [{"label":"Food","uri":"http://id.loc.gov/authorities/subjects/sh85050184","id":0,"type":"madsrdf:Topic","complex":false,"literal":false,"posStart":0,"posEnd":4,"marcKey":"150  $aFood"},{"complex":false,"id":1,"label":"History","literal":false,"posEnd":7,"posStart":0,"type":"madsrdf:Topic","uri":"http://id.loc.gov/authorities/subjects/sh99005024","marcKey":"180  $xHistory","fromComplex":true,"complexMarcKey":"180  $xHistory$y20th century"},{"complex":false,"id":2,"label":"20th century","literal":false,"posEnd":12,"posStart":0,"type":"madsrdf:Temporal","uri":"http://id.loc.gov/authorities/subjects/sh2002012476","marcKey":"182  $y20th century","fromComplex":true,"complexMarcKey":"180  $xHistory$y20th century"}]

describe('SubjectEditor add()', () => {
    // Dogs
    describe("Adding a simple subject to the record", () => {
        test('Components should match before and after adding', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                components: expectedSimpleSubect,
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })
            wrapper.vm.add()
            expect(wrapper.vm.components).toEqual(expectedSimpleSubect)
            expect(wrapper.emitted().subjectAdded).toEqual([[expectedSimpleSubect]])
        });
    })

    describe("Break up a complex heading", () => {
        test('Component matches expected components', async () => {
            const wrapper = shallowMount(SubjectEditor)

            wrapper.setData({
                components: componentComplexHeading,
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })
            await wrapper.vm.add()
            expect(wrapper.vm.components).toEqual(expectedComplexHeading)
        });
    })
})