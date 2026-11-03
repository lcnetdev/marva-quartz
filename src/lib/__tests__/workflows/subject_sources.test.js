import { describe, expect, test } from 'vitest'
import utils_parse from '@/lib/utils_parse'
import { useProfileStore } from '@/stores/profile'
import { impliedSubjectSources, fillSubjectSources, headingSchemeUnknown } from '@/lib/workflows/cip'
import { findComponentPts } from '@/lib/workflows/fields'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const fs = require('fs')

const pinia = createPinia()
const app = createApp()
app.use(pinia)

useProfileStore().profiles = JSON.parse(fs.readFileSync('public/profiles.json', 'utf8'))
useProfileStore().rtLookup = JSON.parse(fs.readFileSync('public/rtLookup.json', 'utf8'))

const SUBJECT = { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_subject__subjects', propertyURI: 'http://id.loc.gov/ontologies/bibframe/subject', label: 'Subjects' }
const SOURCE = 'http://id.loc.gov/ontologies/bibframe/source'
const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'

// the stub's own headings are three children's subject headings (sj URIs) with no thesaurus
const RECORD_SUBJECT = `    <bf:subject>
      <bf:Topic rdf:about="http://id.loc.gov/authorities/childrensSubjects/sj2021051091">
	<rdfs:label xml:lang="en">Rocks</rdfs:label>
	<bflc:marcKey>150  $aRocks</bflc:marcKey>
      </bf:Topic>
    </bf:subject>
`
// from LCCN 2021055410: an LCSH heading with its thesaurus, and one without; and a FAST heading, not LC's
const MORE = `    <bf:subject> <bf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh85033527"> <rdfs:label xml:lang="en">Courage</rdfs:label> <bflc:marcKey>150 $aCourage</bflc:marcKey> <bf:source> <bf:Source rdf:about="http://id.loc.gov/authorities/subjects"> <rdfs:label>LC Subject Headings</rdfs:label> </bf:Source> </bf:source> </bf:Topic> </bf:subject>
    <bf:subject> <bf:Topic rdf:about="http://id.loc.gov/authorities/subjects/sh85017225"> <rdfs:label xml:lang="en">Siblings</rdfs:label> <bflc:marcKey>150 $aSiblings</bflc:marcKey> </bf:Topic> </bf:subject>
    <bf:subject> <bf:Topic rdf:about="http://id.worldcat.org/fast/1095493"> <rdfs:label>Dinosaurs</rdfs:label> </bf:Topic> </bf:subject>
`

async function parse(xml){
  utils_parse.parseXml(xml)
  return await utils_parse.transformRts(JSON.parse(JSON.stringify(useProfileStore().profiles['lc:profile:bf2:Monograph'])))
}

const stubXml = fs.readFileSync('public/test_files/2019028142.xml', 'utf8')

describe('the thesaurus a heading\'s URI implies', () => {
  test('sh headings without one are LCSH, sj ones children\'s; headings with one, or not LC\'s, are left alone', async () => {
    expect(stubXml.includes(RECORD_SUBJECT)).toBe(true)
    let record = await parse(stubXml.replace(RECORD_SUBJECT, RECORD_SUBJECT + MORE))
    let headingOf = (f) => { return f.node[LABEL][0][LABEL] }
    let implied = impliedSubjectSources(record)
    expect(implied.map(headingOf)).toEqual(['Stories in rhyme', 'Dinosaurs', 'Rocks', 'Siblings'])
    expect(implied.map((f) => { return f.source.uri })).toEqual([
      'http://id.loc.gov/vocabulary/subjectSchemes/cyac', 'http://id.loc.gov/vocabulary/subjectSchemes/cyac', 'http://id.loc.gov/vocabulary/subjectSchemes/cyac',
      'http://id.loc.gov/vocabulary/subjectSchemes/lcsh',
    ])

    let filled = fillSubjectSources(record)
    expect(filled.length).toBe(4)
    // on the record, in the editor's form
    let siblings = findComponentPts(record, SUBJECT).map((pt) => { return pt.userValue[SUBJECT.propertyURI][0] }).filter((n) => { return n['@id'].endsWith('sh85017225') })[0]
    expect(siblings[SOURCE][0]['@id']).toBe('http://id.loc.gov/vocabulary/subjectSchemes/lcsh')
    expect(siblings[SOURCE][0]['@type']).toBe('http://id.loc.gov/ontologies/bibframe/Source')
    expect(siblings[SOURCE][0][LABEL][0][LABEL]).toBe('Library of Congress subject headings')
    // the one that had a thesaurus keeps the one it had
    let courage = findComponentPts(record, SUBJECT).map((pt) => { return pt.userValue[SUBJECT.propertyURI][0] }).filter((n) => { return n['@id'].endsWith('sh85033527') })[0]
    expect(courage[SOURCE][0][LABEL][0][LABEL]).toBe('LC Subject Headings')
    // nothing left to do
    expect(impliedSubjectSources(record)).toEqual([])

    // a heading that says nothing about its scheme: no URI, no thesaurus (a WorldCat heading taken
    // whole whose thesaurus was then cleared). Linked or sourced headings are not that
    let pts = findComponentPts(record, SUBJECT)
    expect(pts.some(headingSchemeUnknown)).toBe(false)
    let unknown = JSON.parse(JSON.stringify(pts[0]))
    delete unknown.userValue[SUBJECT.propertyURI][0]['@id']
    delete unknown.userValue[SUBJECT.propertyURI][0][SOURCE]
    expect(headingSchemeUnknown(unknown)).toBe(true)
    unknown.userValue[SUBJECT.propertyURI][0][SOURCE] = [{ '@id': 'http://id.worldcat.org/fast' }]
    expect(headingSchemeUnknown(unknown)).toBe(false)

    // the node is the one profileStore's own subject setter writes, which the export tests
    // (utils_export/buildXMLProcess_subject_components) show going out as bf:source / bf:Source
  })
})
