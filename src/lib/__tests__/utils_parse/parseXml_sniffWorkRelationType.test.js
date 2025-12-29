import { expect, test } from 'vitest'
import utils_parse from "@/lib/utils_parse";


import { createPinia } from 'pinia'
import { createApp } from 'vue'


const pinia = createPinia()
const app = createApp()
app.use(pinia)


let transcribedSeriesXml = `
<rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <bf:Work rdf:about="http://id.loc.gov/resources/works/1111111">
        <bf:relation>
            <bf:Relation>
                <bf:associatedResource>
                    <bf:Series>
                        <rdf:type rdf:resource="http://id.loc.gov/ontologies/bflc/Uncontrolled"/>
                        <bf:title>
                            <bf:Title>
                                <bf:mainTitle>Troitskie listki</bf:mainTitle>
                            </bf:Title>
                        </bf:title>
                    </bf:Series>
                </bf:associatedResource>
            </bf:Relation>
        </bf:relation>
    </bf:Work>
</rdf:RDF>
`

let relatedWorkHubXml = `
<rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <bf:Work rdf:about="http://id.loc.gov/resources/works/21114633">
        <bf:relation>
            <bf:Relation>
                <bf:associatedResource>
                    <bf:Work rdf:about="http://id.loc.gov/resources/works/1568309">
                        <rdfs:label xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Russian and Ukrainian pamphlet and brochure collection, 1866-1949. Class B</rdfs:label>
                        <bf:title>
                            <bf:Title>
                                <bf:mainTitle>Russian and Ukrainian pamphlet and brochure collection, 1866-1949</bf:mainTitle>
                                <bf:partName>Class B</bf:partName>
                            </bf:Title>
                        </bf:title>
                    </bf:Work>
                </bf:associatedResource>
            </bf:Relation>
        </bf:relation>
    </bf:Work>
</rdf:RDF>
`

let parser = new DOMParser();
relatedWorkHubXml = parser.parseFromString(relatedWorkHubXml, 'application/xml');
let processedRelatedWorkHubXml = utils_parse.sniffWorkRelationType(relatedWorkHubXml.children[0].children[0])

transcribedSeriesXml = parser.parseFromString(transcribedSeriesXml, 'application/xml');
let processedTransSeriesXml = utils_parse.sniffWorkRelationType(transcribedSeriesXml.children[0].children[0])

describe("Relationship Sniffing", () => {
    describe("Related Work Hub Lookup", () => {
        test("Hint should be 'lc:RT:bf2:RelWorkLookup'", () =>
            expect(processedRelatedWorkHubXml.children[0].getAttribute('local:pthint')).toBe('lc:RT:bf2:RelWorkLookup')
        )
    })
    describe("Transcribed Series", () => {
        test("Hint should be 'lc:RT:bf2:SeriesHub'", () =>
            expect(processedTransSeriesXml.children[0].getAttribute('local:pthint')).toBe('lc:RT:bf2:SeriesHub')
        )
    })
})

