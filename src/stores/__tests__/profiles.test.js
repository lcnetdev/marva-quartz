import { describe, expect, test } from 'vitest'
import { useProfileStore } from '@/stores/profile'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { mockMonographProfile } from './xml/mockProfile.json'


const fs = require("fs")
const pinia = createPinia()
const app = createApp()
app.use(pinia)


// we generated this data in the globalSetup, because it requires a network call, so just want to do it once
useProfileStore().profiles = JSON.parse(fs.readFileSync("public/profiles.json", "utf8"))
useProfileStore().rtLookup = JSON.parse(fs.readFileSync("public/rtLookup.json", "utf8"))
const twainXml = fs.readFileSync("public/twain.xml", "utf8")

describe('methods', () => {
  describe('isEmptyComponent', () => {

    let notEmpty = {"mandatory":"false","repeatable":"true","type":"resource","resourceTemplates":[],"valueConstraint":{"valueTemplateRefs":["lc:RT:bf2:Agents:Contribution"],"useValuesFrom":[],"defaults":[],"valueDataType":{"dataTypeURI":"http://id.loc.gov/ontologies/bibframe/Contribution"}},"propertyURI":"http://id.loc.gov/ontologies/bibframe/contribution","propertyLabel":"Contributors","remark":"","parent":"lc:profile:bf2:Monographlc:RT:bf2:Monograph:Workdaaecaf9-6802-4881-9fd3-f8cb900ed605","parentId":"lc:RT:bf2:Monograph:Work","userValue":{"@root":"http://id.loc.gov/ontologies/bibframe/contribution","http://id.loc.gov/ontologies/bibframe/contribution":[{"@guid":"17Xy5bfFESj6XFbu6ZgAmn","@type":"http://id.loc.gov/ontologies/bibframe/Family","http://id.loc.gov/ontologies/bibframe/agent":[{"@guid":"sU6qxGjgQDZTMLs1VMZvnb","@type":"http://www.loc.gov/mads/rdf/v1#FamilyName","@id":"http://id.loc.gov/authorities/names/no2021062575","http://www.w3.org/2000/01/rdf-schema#label":[{"@guid":"cQ5pgYKwJYRUnXqq5HzKmu","http://www.w3.org/2000/01/rdf-schema#label":"\nMiller (Family : New Bern, N.C.)\n                        "}],"http://id.loc.gov/ontologies/bflc/marcKey":[{"@guid":"b87bPAVQ56m8EmU8TkzpLL","http://id.loc.gov/ontologies/bflc/marcKey":"\n1003 $aMiller (Family :$cNew Bern, N.C.)\n                        "}]}]}]},"@guid":"xhsrN76GjEBJDP4GWaZv6s","canBeHidden":false,"preferenceId":"http://id.loc.gov/ontologies/bibframe/contribution|http://id.loc.gov/ontologies/bibframe/Contribution","id":"id_loc_gov_ontologies_bibframe_contribution__contributors","hashCode":-1158362988,"hashCodeId":"lc:RT:bf2:Monograph:Work|http://id.loc.gov/ontologies/bibframe/contribution|http://id.loc.gov/ontologies/bibframe/Contribution","hasData":true,"deepHierarchy":false,"xmlSource":"<bf:contribution xmlns:bf=\"http://id.loc.gov/ontologies/bibframe/\">\n            <bf:Family>\n                <bf:agent>\n                    <bf:Agent xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" rdf:about=\"http://id.loc.gov/authorities/names/no2021062575\">\n                        <rdf:type rdf:resource=\"http://www.loc.gov/mads/rdf/v1#FamilyName\"/>\n                        <rdfs:label xmlns:rdfs=\"http://www.w3.org/2000/01/rdf-schema#\">\nMiller (Family : New Bern, N.C.)\n                        </rdfs:label>\n                        <bflc:marcKey xmlns:bflc=\"http://id.loc.gov/ontologies/bflc/\">\n1003 $aMiller (Family :$cNew Bern, N.C.)\n                        </bflc:marcKey>\n                    </bf:Agent>\n                </bf:agent>\n            </bf:Family>\n        </bf:contribution>","xmlHash":-1833430515,"dataLoaded":true}
    let emtpy = {"mandatory":"false","repeatable":"true","type":"resource","resourceTemplates":[],"valueConstraint":{"valueTemplateRefs":["lc:RT:bf2:Note"],"useValuesFrom":[],"valueDataType":{},"defaults":[]},"propertyURI":"http://id.loc.gov/ontologies/bibframe/note","propertyLabel":"Notes about the Work","parent":"lc:profile:bf2:Monographlc:RT:bf2:Monograph:Workdaaecaf9-6802-4881-9fd3-f8cb900ed605","parentId":"lc:RT:bf2:Monograph:Work","userValue":{"@root":"http://id.loc.gov/ontologies/bibframe/note"},"@guid":"kLxvqoDuJ53Sr9bCRFtZho","canBeHidden":true,"preferenceId":"http://id.loc.gov/ontologies/bibframe/note|lc:RT:bf2:Monograph:Work","id":"id_loc_gov_ontologies_bibframe_note__notes_about_the_work","hashCode":1203075139,"hashCodeId":"lc:RT:bf2:Monograph:Work|http://id.loc.gov/ontologies/bibframe/note","dataLoaded":false,"missingProfile":[]}
    it('should be empty', () => {
      expect(useProfileStore().isEmptyComponent(emtpy)).toBe(true);
    });
    it('should be not empty', () => {
      expect(useProfileStore().isEmptyComponent(notEmpty)).toBe(false);
    });
  })

  describe('setValueComplex for a Geographic', () => {
    it('GeographicCoverage should have type "bf:GeographicCoverage"', async () => {
      let profile = mockMonographProfile
      useProfileStore().activeProfile = profile

      const componentGuid = 'm9HyRzL4zc9Z9MgwNKHYZa'
      const fieldGuid = null
      const propertyPath = [{ level: 0, propertyURI: "http://id.loc.gov/ontologies/bibframe/geographicCoverage" }]
      const URI = 'http://id.loc.gov/authorities/names/n79006971'
      const label = 'Spain'
      const type = 'Geographic'
      const nodeMap = {"gacs": [ "e-sp---" ]}
      const marcKey = '151  $aSpain'

      await useProfileStore().setValueComplex(componentGuid, fieldGuid, propertyPath, URI, label, type, nodeMap, marcKey)

      const userValue = profile.rt['lc:RT:bf2:Monograph:Work'].pt['id_loc_gov_ontologies_bibframe_geographicCoverage__geographic_coverage'].userValue
      const target = userValue['http://id.loc.gov/ontologies/bibframe/geographicCoverage'][0]['@type']

      expect(target).toBe('http://id.loc.gov/ontologies/bibframe/GeographicCoverage')
    });

    it('Geo PrimaryContributor should have type "bf:Place"', async () => {
      let profile = mockMonographProfile
      useProfileStore().activeProfile = profile

      const componentGuid = 'egcQykPR8xGwXEoNBU2kLE'
      const fieldGuid = null
      const propertyPath = [
        { level: 0, propertyURI: "http://id.loc.gov/ontologies/bibframe/contribution" },
        { level: 1, propertyURI: "http://id.loc.gov/ontologies/bibframe/agent" },
        { level: 2, propertyURI: "http://www.w3.org/2002/07/owl#sameAs" }]
      const URI = 'http://id.loc.gov/authorities/names/n79006971'
      const label = 'Spain'
      const type = 'Geographic'
      const nodeMap = {"gacs": [ "e-sp---" ]}
      const marcKey = '151  $aSpain'

      await useProfileStore().setValueComplex(componentGuid, fieldGuid, propertyPath, URI, label, type, nodeMap, marcKey)

      const userValue = profile.rt['lc:RT:bf2:Monograph:Work'].pt['id_loc_gov_ontologies_bibframe_contribution__creator_of_work'].userValue
      const target = userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['http://id.loc.gov/ontologies/bibframe/agent'][0]['@type']

      expect(target).toBe('http://id.loc.gov/ontologies/bibframe/Place')
    });

    it('Geo Contributor should have type "bf:Place"', async () => {
      let profile = mockMonographProfile
      useProfileStore().activeProfile = profile

      const componentGuid = 'iB79j8NG29kvNzyGfYd6Nt'
      const fieldGuid = null
      const propertyPath = [
        { level: 0, propertyURI: "http://id.loc.gov/ontologies/bibframe/contribution" },
        { level: 1, propertyURI: "http://id.loc.gov/ontologies/bibframe/agent" },
        { level: 2, propertyURI: "http://www.w3.org/2002/07/owl#sameAs" }]
      const URI = 'http://id.loc.gov/authorities/names/n79006971'
      const label = 'Spain'
      const type = 'Geographic'
      const nodeMap = {
        "gacs": [ "e-sp---" ],
        "collections": [ "http://id.loc.gov/authorities/names/collection_NamesAuthorizedHeadings", "http://id.loc.gov/authorities/names/collection_LCNAF" ],
        "locales": ["Europe","Europe, Western", "European Union countries","OECD countries", "Spanish-speaking countries"],
        "nonlatinLabels": [ "イスパニア", "ראינו דה איספאנײה" ],
        "rdftypes": [ "Geographic", "SimpleType", "Authority" ],
        "vernacularLabels": [ "イスパニア@zxx-Jpan", "ראינו דה איספאנײה@zxx-Hebr" ],
        "vernacularMarcKeys": [ "451 $aイスパニア@zxx-Jpan", "451 $aראינו דה איספאנײה@zxx-Hebr" ]
      }
      const marcKey = '151  $aSpain'

      await useProfileStore().setValueComplex(componentGuid, fieldGuid, propertyPath, URI, label, type, nodeMap, marcKey)

      const userValue = profile.rt['lc:RT:bf2:Monograph:Work'].pt['id_loc_gov_ontologies_bibframe_contribution__contributors'].userValue
      const target = userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['http://id.loc.gov/ontologies/bibframe/agent'][0]['@type']

      expect(target).toBe('http://id.loc.gov/ontologies/bibframe/Place')
    });
  })


  describe('Adding BCP Codes', () => {
    it('Update NAR for BCP Code addition', async () => {
      let marcXML = twainXml
      let parser = new DOMParser()
      marcXML = parser.parseFromString(marcXML, "text/xml")
      const updates = {'13': {"tag":"400","indicators":"11","bcpSelection":[0],"marcKey":"40011$aטבןַ, מרק,$d1835-1910(bcp47)he","displayName":"$aטבןַ, מרק,$d1835-1910","delete":false,"subfield_a":"טבןַ, מרק,","subfield_d":"1835-1910","subfield_7":["(bcp47)he"]}}
      const target = [["400",13,"טבןַ, מרק,"]]
      let update = await useProfileStore().adjustAuthRecord(marcXML, updates, target)
      update = new XMLSerializer().serializeToString(update)

      expect(update).toContain('<marcxml:datafield tag=\"400\" ind1=\"1\" ind2=\"1\">')
      expect(update).toContain('<marcxml:subfield code=\"a\">טבןַ, מרק,</marcxml:subfield>')
      expect(update).toContain('<marcxml:subfield code=\"d\">1835-1910</marcxml:subfield>')
      expect(update).toContain('<marcxml:subfield code=\"7\">(bcp47)he</marcxml:subfield>')
    });

    it('Update NAR for BCP Code addition with update to 008/29', async () => {
      let marcXML = twainXml
      let parser = new DOMParser()
      marcXML = parser.parseFromString(marcXML, "text/xml")
      const updates = {"13": {"tag":"400","indicators":"11","bcpSelection":[0],"marcKey":"40011$aטבןַ, מרק,$d1835-1910(bcp47)he","displayName":"$aטבןַ, מרק,$d1835-1910","delete":false,"subfield_a":"טבןַ, מרק,","subfield_d":"1835-1910","subfield_7":["(bcp47)he"]}, "refEval":true}
      const target = [["400",13,"טבןַ, מרק,"]]
      let update = await useProfileStore().adjustAuthRecord(marcXML, updates, target)
      update = new XMLSerializer().serializeToString(update)

      expect(update).toContain('<marcxml:datafield tag=\"400\" ind1=\"1\" ind2=\"1\">')
      expect(update).toContain('<marcxml:subfield code=\"a\">טבןַ, מרק,</marcxml:subfield>')
      expect(update).toContain('<marcxml:subfield code=\"d\">1835-1910</marcxml:subfield>')
      expect(update).toContain('<marcxml:subfield code=\"7\">(bcp47)he</marcxml:subfield>')
      expect(update).toContain('<marcxml:controlfield tag="008">790418n| azannaabn          |a aaa      </marcxml:controlfield>')

      expect(update).not.toContain('<marcxml:datafield ind1=" " ind2=" " tag="667"><marcxml:subfield code="a">Machine-derived non-Latin script reference project.')});

    it('Update NAR delete $d', async () => {
      let marcXML = twainXml
      let parser = new DOMParser()
      marcXML = parser.parseFromString(marcXML, "text/xml")
      const updates = {"13": {"tag":"400","indicators":"11","bcpSelection":[0],"marcKey":"40011$aטבןַ, מרק,(bcp47)he","displayName":"$aטבןַ, מרק,","delete":false,"subfield_a":"טבןַ, מרק,","subfield_7":["(bcp47)he"],"refEval":false}}
      const target = [["400",13,"טבןַ, מרק,"]]
      let update = await useProfileStore().adjustAuthRecord(marcXML, updates, target)
      update = new XMLSerializer().serializeToString(update)
      update = update.replace(/[\n\r\s\s]+/g, ' ')

      expect(update).toContain('<marcxml:datafield tag="400" ind1="1" ind2="1">')
      expect(update).toContain('<marcxml:subfield code="a">טבןַ, מרק,</marcxml:subfield> <marcxml:subfield code="7">(bcp47)he</marcxml:subfield>')
    });

    it('Update NAR DELETE 4XX', async () => {
      let marcXML = twainXml
      let parser = new DOMParser()
      marcXML = parser.parseFromString(marcXML, "text/xml")
      const updates = {"13": {"tag":"400","indicators":"11","bcpSelection":[0],"marcKey":"40011$(bcp47)he","displayName":"$","delete":true,"subfield_":"","subfield_7":["(bcp47)he"],"refEval":false}}
      const target = [["400",13,"טבןַ, מרק,"]]
      let update = await useProfileStore().adjustAuthRecord(marcXML, updates, target)
      update = new XMLSerializer().serializeToString(update)
      update = update.replace(/[\n\r\s\s]+/g, ' ')

      expect(update).not.toContain('<marcxml:datafield tag="400" ind1="1" ind2="1">')
      expect(update).not.toContain('<marcxml:subfield code=\"a\">טבןַ, מרק,</marcxml:subfield> <marcxml:subfield code=\"d\">1835-1910</marcxml:subfield>')
      expect(update).not.toContain('<marcxml:subfield code=\"7\">(bcp47)he</marcxml:subfield>')
    });

    it('Update NAR for mulitple BCP Code additions', async () => {
      let marcXML = twainXml
      let parser = new DOMParser()
      marcXML = parser.parseFromString(marcXML, "text/xml")
      const updates = {"27": {"tag":"400","indicators":"11","bcpSelection":[0,1],"marcKey":"40011$a트웨인, 마크,$d1835-1910(bcp47)ko $7 (bcp47)ko-jamo","displayName":"$a트웨인, 마크,$d1835-1910","delete":false,"subfield_a":"트웨인, 마크,","subfield_d":"1835-1910","subfield_7":["(bcp47)ko","(bcp47)ko-jamo"],"refEval":false}}
      const target = [["400",27,"트웨인, 마크,"]]
      let update = await useProfileStore().adjustAuthRecord(marcXML, updates, target)
      update = new XMLSerializer().serializeToString(update)
      update = update.replace(/[\n\r\s\s]+/g, ' ')

      expect(update).toContain('<marcxml:datafield tag=\"400\" ind1=\"1\" ind2=\"1\">')
      expect(update).toContain('<marcxml:subfield code=\"a\">트웨인, 마크,</marcxml:subfield>')
      expect(update).toContain('<marcxml:subfield code=\"d\">1835-1910</marcxml:subfield>')
      expect(update).toContain('<marcxml:subfield code=\"7\">(bcp47)ko</marcxml:subfield> <marcxml:subfield code=\"7\">(bcp47)ko-jamo</marcxml:subfield>')
    });

    it('Update NAR with BCP plus an additional form', async () => {
      let marcXML = twainXml
      let parser = new DOMParser()
      marcXML = parser.parseFromString(marcXML, "text/xml")
      const updates = {"27": {"tag":"400","indicators":"11","bcpSelection":[0,1],"marcKey":"40011$a트웨인, 마크,$d1835-1910(bcp47)ko $7 (bcp47)ko-jamo","displayName":"$a트웨인, 마크,$d1835-1910","delete":false,"subfield_a":"트웨인, 마크,","subfield_d":"1835-1910","subfield_7":["(bcp47)ko","(bcp47)ko-jamo"],"refEval":false},"##28": {"tag":"400","indicators":"11","bcpSelection":[3],"marcKey":"40011$aTest(bcp47)oko-hang","displayName":"$aTest","delete":false,"subfield_a":"Test","subfield_7":["(bcp47)oko-hang"],"refEval":false}}
      const target = [["400",27,"트웨인, 마크,"], ["400", "##28","Test"]]
      let update = await useProfileStore().adjustAuthRecord(marcXML, updates, target)
      update = new XMLSerializer().serializeToString(update)
      update = update.replace(/[\n\r\s\s]+/g, ' ')

      expect(update).toContain('<marcxml:datafield tag=\"400\" ind1=\"1\" ind2=\"1\">')
      expect(update).toContain('<marcxml:subfield code=\"a\">트웨인, 마크,</marcxml:subfield>')
      expect(update).toContain('<marcxml:subfield code=\"d\">1835-1910</marcxml:subfield>')
      expect(update).toContain('<marcxml:subfield code=\"7\">(bcp47)ko</marcxml:subfield>')

      expect(update).toContain('<marcxml:subfield code=\"a\">Test</marcxml:subfield> <marcxml:subfield code=\"7\">(bcp47)oko-hang</marcxml:subfield>')
    });


  })


})

