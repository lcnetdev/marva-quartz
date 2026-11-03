import { describe, expect, test } from 'vitest'
import utils_parse from '@/lib/utils_parse'
import { useProfileStore } from '@/stores/profile'
import { usePreferenceStore } from '@/stores/preference'
import { findComponentPts } from '@/lib/workflows/fields'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const fs = require('fs')

const pinia = createPinia()
const app = createApp()
app.use(pinia)

useProfileStore().profiles = JSON.parse(fs.readFileSync('public/profiles.json', 'utf8'))
useProfileStore().rtLookup = JSON.parse(fs.readFileSync('public/rtLookup.json', 'utf8'))

const SUBJECT = { rt: 'Work', propertyURI: 'http://id.loc.gov/ontologies/bibframe/subject', label: 'Subjects' }

// the record's own headings, linked to id.loc.gov
const RECORD_SUBJECT = `    <bf:subject>
      <bf:Topic rdf:about="http://id.loc.gov/authorities/childrensSubjects/sj2021051091">
	<rdfs:label xml:lang="en">Rocks</rdfs:label>
	<bflc:marcKey>150  $aRocks</bflc:marcKey>
      </bf:Topic>
    </bf:subject>
`
// a heading the way a converted WorldCat record carries it (the example.org URI is scrubbed before it is
// offered): unlinked, the scheme named by URI alone on bf:source, no label on the source
const WORLDCAT_LCSH = `    <bf:subject>
      <bf:Topic>
        <rdf:type rdf:resource="http://www.loc.gov/mads/rdf/v1#ComplexSubject" />
        <rdfs:label>Dinosaurs--Juvenile fiction</rdfs:label>
        <madsrdf:authoritativeLabel>Dinosaurs--Juvenile fiction</madsrdf:authoritativeLabel>
        <madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects" />
        <madsrdf:componentList rdf:parseType="Collection">
          <madsrdf:Topic>
            <madsrdf:authoritativeLabel>Dinosaurs</madsrdf:authoritativeLabel>
          </madsrdf:Topic>
          <madsrdf:GenreForm>
            <madsrdf:authoritativeLabel>Juvenile fiction</madsrdf:authoritativeLabel>
          </madsrdf:GenreForm>
        </madsrdf:componentList>
        <bf:source rdf:resource="http://id.loc.gov/authorities/subjects" />
      </bf:Topic>
    </bf:subject>
`
// the same from FAST
const WORLDCAT_FAST = WORLDCAT_LCSH.replace('<bf:source rdf:resource="http://id.loc.gov/authorities/subjects" />', '<bf:source rdf:resource="http://id.worldcat.org/fast" />').replace('<madsrdf:isMemberOfMADSScheme rdf:resource="http://id.loc.gov/authorities/subjects" />', '')

async function parse(xml){
  // the stub does not declare the MADS namespace WorldCat's headings use
  xml = xml.replace('xmlns:rdf=', 'xmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#" xmlns:rdf=')
  utils_parse.parseXml(xml)
  return await utils_parse.transformRts(JSON.parse(JSON.stringify(useProfileStore().profiles['lc:profile:bf2:Monograph'])))
}

const stubXml = fs.readFileSync('public/test_files/2019028142.xml', 'utf8')

describe('the editor\'s hide non-LC subjects preference, as the sheet applies it', () => {
  test('keeps an LCSH heading from WorldCat whose scheme is given by URI alone, hides a FAST one', async () => {
    expect(stubXml.includes(RECORD_SUBJECT)).toBe(true)
    let profile = await parse(stubXml.replace(RECORD_SUBJECT, RECORD_SUBJECT + WORLDCAT_LCSH + WORLDCAT_FAST))
    let pts = findComponentPts(profile, SUBJECT)
    let labelOf = (pt) => { return JSON.stringify(pt.userValue) }
    let own = pts.find((pt) => { return labelOf(pt).includes('sj2021051091') })
    let lcsh = pts.find((pt) => { return labelOf(pt).includes('authorities/subjects') })
    let fast = pts.find((pt) => { return labelOf(pt).includes('worldcat.org/fast') })
    expect(own).toBeDefined()
    expect(lcsh).toBeDefined()
    expect(fast).toBeDefined()

    let prefs = usePreferenceStore()
    prefs.styleDefault['--b-edit-main-hide-non-lc'].value = true
    try {
      expect(useProfileStore().displaySubject(own)).toBe(true)
      expect(useProfileStore().displaySubject(lcsh)).toBe(true)
      expect(useProfileStore().displaySubject(fast)).toBe(false)
    } finally {
      prefs.styleDefault['--b-edit-main-hide-non-lc'].value = false
    }
    expect(useProfileStore().displaySubject(fast)).toBe(true)
  })
})
