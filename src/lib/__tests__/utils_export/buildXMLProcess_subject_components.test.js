import { expect, test } from 'vitest'
import utils_export from "@/lib/utils_export";
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'


import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { 
    monograph_subject_simple, 
    monograph_subject_simple_simple_sub, 
    monograph_subject_personal_name, 
    monograph_subject_geo, 
    monograph_subject_hub, 
    monograph_subject_complex,
    monograph_subject_personal_name_sub_gf,
    monograph_subject_hub_subdivision
    } from './xml/monograph_subject_simple.json'

const pinia = createPinia()
const app = createApp()
app.use(pinia)



// buildXMLProcess calls a function that requires "this.activeProfile" to be populated

usePreferenceStore().catInitals = "test"
usePreferenceStore().catCode = "test"


const expectedSimpleSubjectXml = `<bf:subject><madsrdf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh85038796"><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Dogs</madsrdf:authoritativeLabel><rdfs:label>Dogs</rdfs:label><bflc:marcKey>150  $aDogs</bflc:marcKey><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:Topic></bf:subject>`
const expectedSimpleSubjectSimpleSubXml = `<bf:subject><madsrdf:ComplexSubject><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Dogs--History</madsrdf:authoritativeLabel><rdfs:label>Dogs--History</rdfs:label><madsrdf:componentList rdf:parseType="Collection"><madsrdf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh85038796"><madsrdf:authoritativeLabel>Dogs</madsrdf:authoritativeLabel><bflc:marcKey>150  $aDogs</bflc:marcKey></madsrdf:Topic><madsrdf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh99005024"><madsrdf:authoritativeLabel>History</madsrdf:authoritativeLabel><bflc:marcKey>180  $xHistory</bflc:marcKey></madsrdf:Topic></madsrdf:componentList><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:ComplexSubject></bf:subject>`
const expectedPersonalNameXml = `<bf:subject><madsrdf:PersonalName rdf:about="http://id.loc.gov/authorities/names/n79021164"><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Twain, Mark, 1835-1910</madsrdf:authoritativeLabel><rdfs:label>Twain, Mark, 1835-1910</rdfs:label><bflc:marcKey>1001 $aTwain, Mark,$d1835-1910</bflc:marcKey><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:PersonalName></bf:subject>`
const expectedGeoXml = `<bf:subject><madsrdf:Geographic rdf:about="http://id.loc.gov/authorities/names/n79006971"><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Spain</madsrdf:authoritativeLabel><rdfs:label>Spain</rdfs:label><bflc:marcKey>151  $aSpain</bflc:marcKey><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:Geographic></bf:subject>`
const expectedHubXml = `<bf:subject><bf:Hub rdf:about="http://id.loc.gov/resources/hubs/7b8475be-4aeb-83dc-7bf7-18a0dc7eae58"><madsrdf:authoritativeLabel>Euripides. Medea</madsrdf:authoritativeLabel><rdfs:label>Euripides. Medea</rdfs:label><bflc:marcKey>1000 $aEuripides.$tMedea</bflc:marcKey></bf:Hub></bf:subject>`
const expectedComplexXml = `<bf:subject><madsrdf:ComplexSubject><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Food--Portugal--Porto--History--20th century</madsrdf:authoritativeLabel><rdfs:label>Food--Portugal--Porto--History--20th century</rdfs:label><madsrdf:componentList rdf:parseType="Collection"><madsrdf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh85050184"><madsrdf:authoritativeLabel>Food</madsrdf:authoritativeLabel><bflc:marcKey>150  $aFood</bflc:marcKey></madsrdf:Topic><madsrdf:HierarchicalGeographic rdf:about="http://id.loc.gov/authorities/names/n50006403-781"><madsrdf:authoritativeLabel>Portugal--Porto</madsrdf:authoritativeLabel><bflc:marcKey>181  $zPortugal$zPorto</bflc:marcKey></madsrdf:HierarchicalGeographic><madsrdf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh99005024"><madsrdf:authoritativeLabel>History</madsrdf:authoritativeLabel><bflc:marcKey>180  $xHistory</bflc:marcKey></madsrdf:Topic><madsrdf:Temporal rdf:about="http://id.loc.gov/authorities/subjects/sh2002012476"><madsrdf:authoritativeLabel>20th century</madsrdf:authoritativeLabel><bflc:marcKey>182  $y20th century</bflc:marcKey></madsrdf:Temporal></madsrdf:componentList><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:ComplexSubject></bf:subject>`
const expectedPersonGFXml = `<bf:subject><madsrdf:ComplexSubject><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Twain, David, 1929---Interviews</madsrdf:authoritativeLabel><rdfs:label>Twain, David, 1929---Interviews</rdfs:label><madsrdf:componentList rdf:parseType="Collection"><madsrdf:PersonalName rdf:about="http://id.loc.gov/authorities/names/n82164069"><madsrdf:authoritativeLabel>Twain, David, 1929-</madsrdf:authoritativeLabel><bflc:marcKey>10010$aTwain, David,$d1929-</bflc:marcKey></madsrdf:PersonalName><madsrdf:GenreForm rdf:about="http://id.loc.gov/authorities/subjects/sh99001682"><madsrdf:authoritativeLabel>Interviews</madsrdf:authoritativeLabel><bflc:marcKey>185  $vInterviews</bflc:marcKey></madsrdf:GenreForm></madsrdf:componentList><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:ComplexSubject></bf:subject>`
const expectedHubSubdivXml = `<bf:subject><madsrdf:ComplexSubject><madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects"/><madsrdf:authoritativeLabel>Euripides. Medea--Commentaries</madsrdf:authoritativeLabel><rdfs:label>Euripides. Medea--Commentaries</rdfs:label><madsrdf:componentList rdf:parseType="Collection"><bf:Hub rdf:about="http://id.loc.gov/resources/hubs/7b8475be-4aeb-83dc-7bf7-18a0dc7eae58"><madsrdf:authoritativeLabel>Euripides. Medea</madsrdf:authoritativeLabel><bflc:marcKey>1000 $aEuripides.$tMedea</bflc:marcKey></bf:Hub><madsrdf:GenreForm rdf:about="http://id.loc.gov/authorities/subjects/sh99001404"><madsrdf:authoritativeLabel>Commentaries</madsrdf:authoritativeLabel><bflc:marcKey>185  $vCommentaries</bflc:marcKey></madsrdf:GenreForm></madsrdf:componentList><bf:source><bf:Source rdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:label>Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:ComplexSubject></bf:subject>`



describe('Subject XML is correct', () => {
    // Dogs
    describe("Simple Subject", () => {
        test('should contain the expectedSimpleSubjectXml', async () => {
            let profile = monograph_subject_simple
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic  // xlmStringBasic is what is sent to ID

            expect(xmlString).toContain(expectedSimpleSubjectXml)
        });
    })

    // Dogs--History
    describe("Simple Subject with simple subdivision", () => {
        test('should contain the expectedSimpleSubjectSimpleSubXml', async () => {
            let profile = monograph_subject_simple_simple_sub
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic

            expect(xmlString).toContain(expectedSimpleSubjectSimpleSubXml)
        });
    })

    // Twain, mark
    describe("Personal name", () => {
        test('should contain the expectedPersonalNameXml', async () => {
            let profile = monograph_subject_personal_name
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic
            expect(xmlString).toContain(expectedPersonalNameXml)
        });
    })

    // Geographic - Spain
    describe("Geogephic Subject", () => {
        test('should contain the expectedGeoXml', async () => {
            let profile = monograph_subject_geo
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic
            expect(xmlString).toContain(expectedGeoXml)
        });
    })

    // Hub - Euripides. Medea
    describe("Hub Subject", () => {
        test('should contain the expectedHubXml', async () => {
            let profile = monograph_subject_hub
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic
            expect(xmlString).toContain(expectedHubXml)
        });
    })

    // Complex topic Food--Portugal--Porto--History--20th century
    describe("Complex Subject", () => {
        test('should contain the expectedHubXml', async () => {
            let profile = monograph_subject_complex
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic
            expect(xmlString).toContain(expectedComplexXml)
        });
    })


    // person subdivision gf
    describe("Personal name subject with genre/form subdivision", () => {
        test('should contain the expectedHubXml', async () => {
            let profile = monograph_subject_personal_name_sub_gf
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic
            expect(xmlString).toContain(expectedPersonGFXml)
        });
    })
    
    // Hub subdivision
    describe("Hub Subject with subdivision", () => {
        test('should contain the expectedHubSubdivXml', async () => {
            let profile = monograph_subject_hub_subdivision
            useProfileStore().activeProfile = profile
            let xmlList = await utils_export.buildXMLProcess(profile)
            let xmlString = xmlList.xlmStringBasic
            expect(xmlString).toContain(expectedHubSubdivXml)
        });
    })


});