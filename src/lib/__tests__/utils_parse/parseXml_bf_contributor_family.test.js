import { expect, test } from 'vitest'
import utils_parse from "@/lib/utils_parse";

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


// reset
useProfileStore().prepareForNewRecord()



// Make it a Family and make sure the type is changed
// Test contributor
let xml = `
    <rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:bflc="http://id.loc.gov/ontologies/bflc/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:lclocal="http://id.loc.gov/ontologies/lclocal/" xmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#" xmlns:pmo="http://performedmusicontology.org/ontology/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:streams="info:lc/streams#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <bf:Work rdf:about="http://id.loc.gov/resources/works/1111111">
        <bf:contribution>
            <bf:Family>
                <bf:agent>
                    <bf:Agent rdf:about="http://id.loc.gov/authorities/names/no2021062575">
                        <rdf:type rdf:resource="http://www.loc.gov/mads/rdf/v1#FamilyName" />
                        <rdfs:label xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
Miller (Family : New Bern, N.C.)
                        </rdfs:label>
                        <bflc:marcKey xmlns:bflc="http://id.loc.gov/ontologies/bflc/">
1003 $aMiller (Family :$cNew Bern, N.C.)
                        </bflc:marcKey>
                    </bf:Agent>
                </bf:agent>
            </bf:Family>
        </bf:contribution>
    </bf:Work>
   
</rdf:RDF>
`
// parse the above
utils_parse.parseXml(xml)
// transform, passing the monograph profile
let profileTransformed = await utils_parse.transformRts(useProfileStore().profiles['lc:profile:bf2:Monograph'])
// pull out of the userValue from the expected location
let data = profileTransformed.rt['lc:RT:bf2:Monograph:Work'].pt.id_loc_gov_ontologies_bibframe_contribution__contributors.userValue

// Define some constants for URLs to make tests more readable
const BF_NS = "http://id.loc.gov/ontologies/bibframe/";
const BFLC_NS = "http://id.loc.gov/ontologies/bflc/";
const MADS_NS = "http://www.loc.gov/mads/rdf/v1#";
const RDFS_NS = "http://www.w3.org/2000/01/rdf-schema#";

describe('BIBFRAME Contribution Data Structure', () => {
    it('should have the correct @root property', () => {
        expect(data).toHaveProperty('@root');
        expect(data['@root']).toBe(`${BF_NS}contribution`);
    });

    it('should have a main contribution array matching @root', () => {
        const rootKey = data['@root'];
        expect(data).toHaveProperty(rootKey);
        expect(Array.isArray(data[rootKey])).toBe(true);
        expect(data[rootKey].length).toBeGreaterThanOrEqual(1);
    });

    describe('First Contribution Item', () => {
        const contributionItem = data[`${BF_NS}contribution`][0];

        it('should be an object', () => {
            expect(typeof contributionItem).toBe('object');
            expect(contributionItem).not.toBeNull();
        });

        it('should have a @guid property of type string', () => {
            expect(contributionItem).toHaveProperty('@guid');
            expect(typeof contributionItem['@guid']).toBe('string');
            // expect(contributionItem['@guid']).toBe('17Xy5bfFESj6XFbu6ZgAmn'); // If GUID is fixed
        });

        it('should have the correct @type', () => {
            expect(contributionItem).toHaveProperty('@type');
            expect(contributionItem['@type']).toBe(`${BF_NS}Family`);
        });

        it('should have a bibframe:agent property as an array with at least one item', () => {
            expect(contributionItem).toHaveProperty(`${BF_NS}agent`);
            expect(Array.isArray(contributionItem[`${BF_NS}agent`])).toBe(true);
            expect(contributionItem[`${BF_NS}agent`].length).toBeGreaterThanOrEqual(1);
        });

        describe('Agent Item within Contribution', () => {
            const agentItem = contributionItem[`${BF_NS}agent`][0];

            it('should be an object', () => {
                expect(typeof agentItem).toBe('object');
                expect(agentItem).not.toBeNull();
            });

            it('should have a @guid property of type string', () => {
                expect(agentItem).toHaveProperty('@guid');
                expect(typeof agentItem['@guid']).toBe('string');
                // expect(agentItem['@guid']).toBe('sU6qxGjgQDZTMLs1VMZvnb'); // If GUID is fixed
            });

            it('should have the correct @type', () => {
                expect(agentItem).toHaveProperty('@type');
                expect(agentItem['@type']).toBe(`${MADS_NS}FamilyName`);
            });

            it('should have the correct @id', () => {
                expect(agentItem).toHaveProperty('@id');
                expect(agentItem['@id']).toBe('http://id.loc.gov/authorities/names/no2021062575');
            });

            describe('rdfs:label within Agent', () => {
                it('should have rdfs:label property as an array with one item', () => {
                    expect(agentItem).toHaveProperty(`${RDFS_NS}label`);
                    expect(Array.isArray(agentItem[`${RDFS_NS}label`])).toBe(true);
                    expect(agentItem[`${RDFS_NS}label`].length).toBe(1);
                });

                const labelObject = agentItem[`${RDFS_NS}label`][0];

                it('label object should have a @guid and the correct label value', () => {
                    expect(labelObject).toHaveProperty('@guid');
                    expect(typeof labelObject['@guid']).toBe('string');
                    // expect(labelObject['@guid']).toBe('cQ5pgYKwJYRUnXqq5HzKmu'); // If GUID is fixed

                    expect(labelObject).toHaveProperty(`${RDFS_NS}label`);
                    expect(labelObject[`${RDFS_NS}label`]).toBe("\nMiller (Family : New Bern, N.C.)\n                        ");
                });

                it('label value (trimmed) should be correct', () => {
                    expect(labelObject[`${RDFS_NS}label`].trim()).toBe("Miller (Family : New Bern, N.C.)");
                });
            });

            describe('bflc:marcKey within Agent', () => {
                it('should have bflc:marcKey property as an array with one item', () => {
                    expect(agentItem).toHaveProperty(`${BFLC_NS}marcKey`);
                    expect(Array.isArray(agentItem[`${BFLC_NS}marcKey`])).toBe(true);
                    expect(agentItem[`${BFLC_NS}marcKey`].length).toBe(1);
                });

                const marcKeyObject = agentItem[`${BFLC_NS}marcKey`][0];

                it('marcKey object should have a @guid and the correct marcKey value', () => {
                    expect(marcKeyObject).toHaveProperty('@guid');
                    expect(typeof marcKeyObject['@guid']).toBe('string');
                    // expect(marcKeyObject['@guid']).toBe('b87bPAVQ56m8EmU8TkzpLL'); // If GUID is fixed

                    expect(marcKeyObject).toHaveProperty(`${BFLC_NS}marcKey`);
                    expect(marcKeyObject[`${BFLC_NS}marcKey`]).toBe("\n1003 $aMiller (Family :$cNew Bern, N.C.)\n                        ");
                });

                it('marcKey value (trimmed) should be correct', () => {
                    expect(marcKeyObject[`${BFLC_NS}marcKey`].trim()).toBe("1003 $aMiller (Family :$cNew Bern, N.C.)");
                });
            });
        });
    });
});