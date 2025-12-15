import { expect, test } from 'vitest'
import utils_parse from "@/lib/utils_parse";


import { createPinia } from 'pinia'
import { createApp } from 'vue'


const pinia = createPinia()
const app = createApp()
app.use(pinia)


let workNoteXml = `
<rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <bf:Work rdf:about="http://id.loc.gov/resources/works/21114633">
        <bf:note>
            <bf:Note>
                <rdfs:label xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
                    Work Note
                </rdfs:label>
                <rdf:type rdf:resource="http://id.loc.gov/vocabulary/mnotetype/action" />
            </bf:Note>
        </bf:note>
    </bf:Work>
</rdf:RDF>
`

let languageNoteXml = `
<rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <bf:Work rdf:about="http://id.loc.gov/resources/works/1111111">
        <bf:note>
            <bf:Note>
                <rdf:type rdf:resource="http://id.loc.gov/vocabulary/resourceComponents/aud">
                    </rdf:type>
                <bf:language>
                    <bf:Language rdf:about="http://id.loc.gov/vocabulary/languages/eng">
                    <rdfs:label xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
                        English
                    </rdfs:label>
                    </bf:Language>
                </bf:language>
            </bf:Note>
        </bf:note>
    </bf:Work>
</rdf:RDF>
`

let parser = new DOMParser();
workNoteXml = parser.parseFromString(workNoteXml, 'application/xml');
let processedWorkNoteXml = utils_parse.sniffNoteType(workNoteXml.children[0].children[0])

languageNoteXml = parser.parseFromString(languageNoteXml, 'application/xml');
let processedLanguageNoteXml = utils_parse.sniffNoteType(languageNoteXml.children[0].children[0])

describe("Relationship Sniffing", () => {
    describe("Work Note Type", () => {
        test("Hint should be 'lc:RT:bf2:LangNote'", () =>
            expect(processedWorkNoteXml.children[0].getAttribute('local:pthint')).toBe('lc:RT:bf2:Note')
        )
    })

    describe("Language Note Type", () => {
        test("Hint should be 'lc:RT:bf2:Note'", () =>
            expect(processedLanguageNoteXml.children[0].getAttribute('local:pthint')).toBe('lc:RT:bf2:LangNote')
        )
    })
})

