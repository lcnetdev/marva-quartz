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

// a relation whose associatedResource is only a rdf:resource reference, no typed element to sniff
let bareHubRefXml = `
<rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
    <bf:Work rdf:about="http://id.loc.gov/resources/works/in01260004730">
        <bf:relation>
            <bf:Relation>
                <bf:relationship>
                    <bf:Relationship rdf:about="http://id.loc.gov/vocabulary/relationship/part">
                        <rdfs:label>part</rdfs:label>
                        <bf:code>part</bf:code>
                    </bf:Relationship>
                </bf:relationship>
                <bf:associatedResource rdf:resource="http://id.loc.gov/resources/hubs/1e23eb63-b7b6-d7c2-66e8-87f678bd3503"/>
            </bf:Relation>
        </bf:relation>
    </bf:Work>
</rdf:RDF>
`

let bareWorkRefXml = `
<rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <bf:Work rdf:about="http://id.loc.gov/resources/works/1111111">
        <bf:relation>
            <bf:Relation>
                <bf:associatedResource rdf:resource="http://id.loc.gov/resources/works/21114633"/>
            </bf:Relation>
        </bf:relation>
    </bf:Work>
</rdf:RDF>
`

let bareHyphenatedWorkRefXml = `
<rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <bf:Work rdf:about="http://id.loc.gov/resources/works/in01260004730">
        <bf:relation>
            <bf:Relation>
                <bf:associatedResource rdf:resource="http://id.loc.gov/resources/works/in01260004730-001"/>
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

bareHubRefXml = parser.parseFromString(bareHubRefXml, 'application/xml');
let processedBareHubRefXml = utils_parse.sniffWorkRelationType(bareHubRefXml.children[0].children[0])

bareWorkRefXml = parser.parseFromString(bareWorkRefXml, 'application/xml');
let processedBareWorkRefXml = utils_parse.sniffWorkRelationType(bareWorkRefXml.children[0].children[0])

bareHyphenatedWorkRefXml = parser.parseFromString(bareHyphenatedWorkRefXml, 'application/xml');
let processedBareHyphenatedWorkRefXml = utils_parse.sniffWorkRelationType(bareHyphenatedWorkRefXml.children[0].children[0])

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
    describe("Bare hub reference (no typed element)", () => {
        test("Hint should be 'lc:RT:bf2:RelWorkLookup'", () =>
            expect(processedBareHubRefXml.children[0].getAttribute('local:pthint')).toBe('lc:RT:bf2:RelWorkLookup')
        )
    })
    describe("Bare work reference (no typed element)", () => {
        test("Hint should be 'lc:RT:bf2:RelWorkLookup'", () =>
            expect(processedBareWorkRefXml.children[0].getAttribute('local:pthint')).toBe('lc:RT:bf2:RelWorkLookup')
        )
    })
    describe("Bare hyphenated work reference (related work expression)", () => {
        test("Hint should be 'lc:RT:RelWorkExpressionLookup'", () =>
            expect(processedBareHyphenatedWorkRefXml.children[0].getAttribute('local:pthint')).toBe('lc:RT:RelWorkExpressionLookup')
        )
    })
})

