import { expect, test } from 'vitest'
import utils_export from "@/lib/utils_export";
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'


import { createPinia } from 'pinia'
import { createApp } from 'vue'

import {
    mono_work_note_xml,
    mono_inst_note_xml,
    mono_inst_note_extent_xml,
    notated_music_notes_xml
    } from './xml/note_type.json'


const pinia = createPinia()
const app = createApp()
app.use(pinia)

const expectedMonoWorkNoteXml = `<bf:note><bf:Note><rdfs:label>Work Note</rdfs:label><rdf:type rdf:resource="http://id.loc.gov/vocabulary/mnotetype/citeas"/></bf:Note></bf:note>`
const expectedMonoInstNoteXml = `<bf:note><bf:Note><rdfs:label>inst note</rdfs:label><ns1:type ns1:resource="http://id.loc.gov/vocabulary/mnotetype/action"/></bf:Note></bf:note>`
const expectedMonoInstExtentNoteXml = `<bf:extent><bf:Extent><rdfs:label>Extent</rdfs:label><bf:note><bf:Note><rdfs:label>Physical Desc. Note</rdfs:label><ns1:type ns1:resource="http://id.loc.gov/vocabulary/mnotetype/citeas"/></bf:Note></bf:note></bf:Extent></bf:extent>`
const expectedNotatedNotePMOXml = `<bf:ensemble><bf:Ensemble><bflc:appliesTo><bflc:AppliesTo><rdfs:label>This</rdfs:label></bflc:AppliesTo></bflc:appliesTo><bf:mediumComponent><bf:MediumComponent><bf:mediumOfPerformance><madsrdf:Medium rdf:about="http://id.loc.gov/authorities/performanceMediums/mp2013015187"><rdfs:label>cowbell</rdfs:label><bflc:marcKey>162  $acowbell</bflc:marcKey></madsrdf:Medium></bf:mediumOfPerformance><bf:count>1</bf:count><bf:mediumComponentQualifier><bf:MediumComponentQualifer rdf:about="http://id.loc.gov/vocabulary/medcompqual/adlib"><rdfs:label>ad lib </rdfs:label></bf:MediumComponentQualifer></bf:mediumComponentQualifier><bf:note><bf:Note><rdfs:label>PMO Note</rdfs:label><rdf:type rdf:resource="http://id.loc.gov/vocabulary/mnotetype/action"/></bf:Note></bf:note><bf:numberOfHands>7</bf:numberOfHands></bf:MediumComponent></bf:mediumComponent><bf:ensembleSize><bf:EnsembleSize rdf:about="http://id.loc.gov/vocabulary/ensemblesize/soloind"><rdfs:label>solo or individual </rdfs:label></bf:EnsembleSize></bf:ensembleSize><bf:status><bf:Status rdf:about="http://id.loc.gov/vocabulary/mstatus/former"><rdfs:label>former </rdfs:label></bf:Status></bf:status></bf:Ensemble></bf:ensemble>`
const expectedNotatedNoteWorkXml = `<bf:note><bf:Note><rdfs:label>Work Note</rdfs:label><rdf:type rdf:resource="http://id.loc.gov/vocabulary/mnotetype/action"/></bf:Note></bf:note>`
const expectedNotatedNoteInstXml = `<bf:note><bf:Note><rdfs:label>Instance Note</rdfs:label><ns1:type ns1:resource="http://id.loc.gov/vocabulary/mnotetype/action"/></bf:Note></bf:note>`
const expectedNotatedNoteExtentXml = `<bf:extent><bf:Extent><rdfs:label>Extent</rdfs:label><bf:note><bf:Note><rdfs:label>Extent Note</rdfs:label><ns1:type ns1:resource="http://id.loc.gov/vocabulary/mnotetype/action"/></bf:Note></bf:note></bf:Extent></bf:extent>`

// buildXMLProcess calls a function that requires "this.activeProfile" to be populated

usePreferenceStore().catInitals = "test"
usePreferenceStore().catCode = "test"


describe('XML is correct', () => {
    describe("Monograph Work Note ", () => {
        test('should contain the expectedMonoWorkNoteXml', async () => {
            let profile = mono_work_note_xml
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic  // xlmStringBasic is what is sent to ID

            expect(xmlString).toContain(expectedMonoWorkNoteXml)
        });
    })

    describe("Monograph Instance Note ", () => {
        test('should contain the expectedMonoInstNoteXml', async () => {
            let profile = mono_inst_note_xml
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic  // xlmStringBasic is what is sent to ID

            expect(xmlString).toContain(expectedMonoInstNoteXml)
        });
    })

    describe("Monograph Instance Extent Note ", () => {
        test('should contain the expectedMonoInstExtentNoteXml', async () => {
            let profile = mono_inst_note_extent_xml
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic  // xlmStringBasic is what is sent to ID

            expect(xmlString).toContain(expectedMonoInstExtentNoteXml)
        });
    })

    describe("Notated Music Full Notes ", () => {
        test('should contain the expectedMonoInstExtentNoteXml', async () => {
            let profile = notated_music_notes_xml
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic  // xlmStringBasic is what is sent to ID

            expect(xmlString).toContain(expectedNotatedNotePMOXml)
            expect(xmlString).toContain(expectedNotatedNoteWorkXml)
            expect(xmlString).toContain(expectedNotatedNoteInstXml)
            expect(xmlString).toContain(expectedNotatedNoteExtentXml)
        });
    })
})