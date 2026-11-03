import { describe, expect, test } from 'vitest'
import utils_parse from '@/lib/utils_parse'
import { useProfileStore } from '@/stores/profile'
import { impliedColorContent, physicalDescriptionSaysColor } from '@/lib/workflows/cip'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const fs = require('fs')

const pinia = createPinia()
const app = createApp()
app.use(pinia)

// the profiles come from the globalSetup, which downloads them once
useProfileStore().profiles = JSON.parse(fs.readFileSync('public/profiles.json', 'utf8'))
useProfileStore().rtLookup = JSON.parse(fs.readFileSync('public/rtLookup.json', 'utf8'))

const ONT = 'http://id.loc.gov/ontologies/bibframe/'
const LABEL = 'http://www.w3.org/2000/01/rdf-schema#label'

// public/test_files/2019028142.xml is the CIP stub of LCCN 2019028142 (Dinosong, a picture book):
// the physical description before the book is in hand, no color content. This is what WorldCat's
// record has for the physical description.
const STUB_EXTENT = `    <bf:extent>
      <bf:Extent>
	<rdfs:label>pages</rdfs:label>
      </bf:Extent>
    </bf:extent>
    <bf:dimensions>cm</bf:dimensions>
`
const WORLDCAT_EXTENT = `    <bf:extent>
      <bf:Extent>
	<rdfs:label>1 volume (unpaged)</rdfs:label>
	<bf:note>
	  <bf:Note>
	    <rdf:type rdf:resource="http://id.loc.gov/vocabulary/mnotetype/physical"/>
	    <rdfs:label>color illustrations</rdfs:label>
	  </bf:Note>
	</bf:note>
      </bf:Extent>
    </bf:extent>
    <bf:dimensions>27 cm</bf:dimensions>
`

async function parse(xml){
  utils_parse.parseXml(xml)
  return await utils_parse.transformRts(JSON.parse(JSON.stringify(useProfileStore().profiles['lc:profile:bf2:Monograph'])))
}

const stubXml = fs.readFileSync('public/test_files/2019028142.xml', 'utf8')

describe('the CIP stub test record 2019028142', () => {
  test('parses with the stub physical description and an empty Work color content', async () => {
    expect(stubXml.includes(STUB_EXTENT)).toBe(true)
    let profile = await parse(stubXml)
    let extent = profile.rt['lc:RT:bf2:Monograph:Instance'].pt.id_loc_gov_ontologies_bibframe_extent__physical_description
    expect(extent.userValue[ONT + 'extent'][0][LABEL][0][LABEL]).toBe('pages')
    let color = profile.rt['lc:RT:bf2:Monograph:Work'].pt.id_loc_gov_ontologies_bibframe_colorContent__color_content
    expect(color).toBeDefined()
    expect(color.userValue[ONT + 'colorContent']).toBeUndefined()
    expect(physicalDescriptionSaysColor(profile)).toBe(false)
    expect(impliedColorContent(profile)).toBeNull()
  })

  test('once WorldCat\'s physical description is in, the color content is implied', async () => {
    let profile = await parse(stubXml.replace(STUB_EXTENT, WORLDCAT_EXTENT))
    expect(physicalDescriptionSaysColor(profile)).toBe(true)
    let implied = impliedColorContent(profile)
    expect(implied).not.toBeNull()
    expect(implied.pt.propertyURI).toBe(ONT + 'colorContent')
    expect(implied.pt).toBe(profile.rt['lc:RT:bf2:Monograph:Work'].pt.id_loc_gov_ontologies_bibframe_colorContent__color_content)
    expect(implied.value).toEqual({ uri: 'http://id.loc.gov/vocabulary/mcolor/mul', label: 'color' })
  })
})
