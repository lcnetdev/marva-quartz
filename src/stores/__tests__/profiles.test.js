import { describe, expect, test } from 'vitest'
import { useProfileStore } from '@/stores/profile'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const fs = require("fs")
const pinia = createPinia()
const app = createApp()
app.use(pinia)


// we generated this data in the globalSetup, because it requires a network call, so just want to do it once
useProfileStore().profiles = JSON.parse(fs.readFileSync("public/profiles.json", "utf8"))
useProfileStore().rtLookup = JSON.parse(fs.readFileSync("public/rtLookup.json", "utf8"))



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

  describe('setValueCOmplex', () => {
    it('should have type bf:Place', () => {
      expect(true).toBe(false)
    });
  })

})

