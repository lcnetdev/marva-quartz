import { expect, test } from 'vitest'
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
let componentPersonSubject = [{"label":"Twain, David, 1929‑","uri":"http://id.loc.gov/authorities/names/n82164069","id":0,"type":"madsrdf:PersonalName","complex":false,"literal":false,"posStart":0,"posEnd":19,"marcKey":"10010$aTwain, David,$d1929-"}]
let expectedPersonSubect = [{"label":"Twain, David, 1929-","uri":"http://id.loc.gov/authorities/names/n82164069","id":0,"type":"madsrdf:PersonalName","complex":false,"literal":false,"posStart":0,"posEnd":19,"marcKey":"10010$aTwain, David,$d1929-"}]

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
        });
    })

    describe("Adding a person as subject to the record", () => {
        test('Component matches expected components', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                components: componentPersonSubject,
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })
            wrapper.vm.add()
            expect(wrapper.vm.components).toEqual(expectedPersonSubect)
        });
    })
})