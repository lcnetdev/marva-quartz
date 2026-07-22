import { expect, test } from 'vitest'
import utils_export from "@/lib/utils_export";
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'


import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { mono_work_note_xml } from './xml/note_type.json'


const pinia = createPinia()
const app = createApp()
app.use(pinia)

usePreferenceStore().catInitals = "test"
usePreferenceStore().catCode = "test"


// build a profile with a rdf:type picklist component (RdfTypeSelector) in the Work
// with two of the classes selected
const buildProfile = function(selectedUris){
    let profile = JSON.parse(JSON.stringify(mono_work_note_xml))
    let work = profile.rt['lc:RT:bf2:Monograph:Work']
    let ptKey = 'www_w3_org_1999_02_22_rdf_syntax_ns_type__work_type'
    work.pt[ptKey] = {
        mandatory: "false",
        repeatable: "false",
        type: "literal",
        resourceTemplates: [],
        propertyURI: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        propertyLabel: "Work Type",
        parentId: "lc:RT:bf2:Monograph:Work",
        "@guid": "TestRdfTypePicklistGuid1",
        id: ptKey,
        valueConstraint: {
            valueTemplateRefs: [],
            useValuesFrom: [],
            defaults: [],
            valueDataType: {},
            picklist: ["bf:NotatedMusic", "bf:NotatedMovement"]
        },
        userValue: {
            '@root': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
            '@guid': 'TestRdfTypePicklistGuid2',
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': selectedUris.map((uri, i) => {
                return { '@guid': 'TestRdfTypePicklistGuid3' + i, '@id': uri }
            })
        },
        hasData: selectedUris.length > 0,
        userModified: selectedUris.length > 0,
        dataLoaded: false
    }
    work.ptOrder.push(ptKey)
    return profile
}


describe('rdf:type picklist component (RdfTypeSelector) export', () => {
    test('selected classes become rdf:type children of the top level Work', async () => {
        let profile = buildProfile([
            'http://id.loc.gov/ontologies/bibframe/NotatedMusic',
            'http://id.loc.gov/ontologies/bibframe/NotatedMovement'
        ])
        useProfileStore().activeProfile = profile
        let xmlList = await utils_export.buildXMLProcess(profile)
        let xmlString = xmlList.xlmStringBasic

        expect(xmlString).toContain('<rdf:type rdf:resource="http://id.loc.gov/ontologies/bibframe/NotatedMusic"/>')
        expect(xmlString).toContain('<rdf:type rdf:resource="http://id.loc.gov/ontologies/bibframe/NotatedMovement"/>')
    });

    test('nothing is emitted when no classes are selected', async () => {
        let profile = buildProfile([])
        useProfileStore().activeProfile = profile
        let xmlList = await utils_export.buildXMLProcess(profile)
        let xmlString = xmlList.xlmStringBasic

        expect(xmlString).not.toContain('NotatedMusic')
        expect(xmlString).not.toContain('NotatedMovement')
    });
})
