import { expect, test } from 'vitest'
import utils_export from "@/lib/utils_export";
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'


import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { monograph_subject_simple, monograph_subject_simple_simple_sub, monograph_subject_personal_name } from './xml/monograph_subject_simple.json'

const pinia = createPinia()
const app = createApp()
app.use(pinia)



// buildXMLProcess calls a function that requires "this.activeProfile" to be populated

usePreferenceStore().catInitals = "test"
usePreferenceStore().catCode = "test"




const expectedSimpleSubjectXml = `<bf:subject><madsrdf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh85038796"><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Dogs</madsrdf:authoritativeLabel><rdfs:label>Dogs</rdfs:label><bflc:marcKey>150  $aDogs</bflc:marcKey><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:Topic></bf:subject>`
const expectedSimpleSubjectSimpleSubXml = `<bf:subject><madsrdf:ComplexSubject><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Dogs--History</madsrdf:authoritativeLabel><rdfs:label>Dogs--History</rdfs:label><madsrdf:componentList rdf:parseType="Collection"><madsrdf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh85038796"><madsrdf:authoritativeLabel>Dogs</madsrdf:authoritativeLabel><bflc:marcKey>150  $aDogs</bflc:marcKey></madsrdf:Topic><madsrdf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh99005024"><madsrdf:authoritativeLabel>History</madsrdf:authoritativeLabel><bflc:marcKey>180  $xHistory</bflc:marcKey></madsrdf:Topic></madsrdf:componentList><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:ComplexSubject></bf:subject>`
const expectedPersonalNameXml = `<bf:subject><madsrdf:PersonalName rdf:about="http://id.loc.gov/authorities/names/n79021164"><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Twain, Mark, 1835-1910</madsrdf:authoritativeLabel><rdfs:label>Twain, Mark, 1835-1910</rdfs:label><bflc:marcKey>1001 $aTwain, Mark,$d1835-1910</bflc:marcKey><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:PersonalName></bf:subject>`


describe('Subject XML is correct', () => {
    describe("Simple Subject", () => {
        test('should contain the expectedSimpleSubjectXml', async () => {
            let profile = monograph_subject_simple
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic  // xlmStringBasic is what is sent to ID

            expect(xmlString).toContain(expectedSimpleSubjectXml)
        });
    })

    describe("Simple Subject with simple subdivision", () => {
        test('should contain the expectedSimpleSubjectSimpleSubXml', async () => {
            let profile = monograph_subject_simple_simple_sub
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic                   // xlmStringBasic gives unbound namespace prefix "rdf"

            expect(xmlString).toContain(expectedSimpleSubjectSimpleSubXml)
        });
    })

    describe("Personal name", () => {
        test('should contain the expectedPersonalNameXml', async () => {
            let profile = monograph_subject_personal_name
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic
            expect(xmlString).toContain(expectedPersonalNameXml)
        });
    })
});