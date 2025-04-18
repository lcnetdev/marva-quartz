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


// Test contributor
let xml = `
    <rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:bflc="http://id.loc.gov/ontologies/bflc/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:lclocal="http://id.loc.gov/ontologies/lclocal/" xmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#" xmlns:pmo="http://performedmusicontology.org/ontology/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:streams="info:lc/streams#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <bf:Work rdf:about="http://id.loc.gov/resources/works/1111111">
            <bf:contribution>
                <bf:Contribution>
                    <bf:agent>
                        <bf:Agent rdf:about="http://id.loc.gov/rwo/agents/nr93029417">
                            <rdf:type rdf:resource="http://id.loc.gov/ontologies/bibframe/Person"/>
                            <rdfs:label>Kim, Kyŏng-il, 1956-</rdfs:label>
                            <bflc:marcKey>1001 $aKim, Kyŏng-il,$d1956-</bflc:marcKey>
                            <rdfs:label xml:lang="zxx-kore">김 경일, 1956-</rdfs:label>
                            <bflc:marcKey xml:lang="zxx-kore">4001 $a김 경일,$d1956-</bflc:marcKey>
                        </bf:Agent>
                    </bf:agent>
                    <bf:role>
                        <bf:Role rdf:about="http://id.loc.gov/vocabulary/relators/aut">
                            <rdfs:label>author</rdfs:label>
                            <bf:code>aut</bf:code>
                        </bf:Role>
                    </bf:role>
                </bf:Contribution>
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



// generated with gemini 2.5 pro
// --- Constants for Keys (improves readability) ---
const ROOT_KEY = "@root";
const CONTRIBUTION_KEY = "http://id.loc.gov/ontologies/bibframe/contribution";
const TYPE_KEY = "@type";
const ID_KEY = "@id";
const LANGUAGE_KEY = "@language";
const AGENT_KEY = "http://id.loc.gov/ontologies/bibframe/agent";
const ROLE_KEY = "http://id.loc.gov/ontologies/bibframe/role";
const LABEL_KEY = "http://www.w3.org/2000/01/rdf-schema#label";
const MARCKEY_KEY = "http://id.loc.gov/ontologies/bflc/marcKey";
const CODE_KEY = "http://id.loc.gov/ontologies/bibframe/code";

// --- Type Constants ---
const TYPE_CONTRIBUTION = "http://id.loc.gov/ontologies/bibframe/Contribution";
const TYPE_PERSON = "http://id.loc.gov/ontologies/bibframe/Person";
const TYPE_ROLE = "http://id.loc.gov/ontologies/bibframe/Role";

// --- ID Constants ---
const ID_AGENT = "http://id.loc.gov/rwo/agents/nr93029417";
const ID_ROLE = "http://id.loc.gov/vocabulary/relators/aut";


// --- Test Suite ---
describe('Contribution -- Person', () => {

  // Level 1: Root Object
  describe('Root Level', () => {
    it('should be an object', () => {
      expect(data).toBeInstanceOf(Object);
    });

    it('should have the @root property with the correct value', () => {
      expect(data).toHaveProperty(ROOT_KEY);
      expect(data[ROOT_KEY]).toBe(CONTRIBUTION_KEY);
    });

    it('should have the contribution key derived from @root', () => {
      expect(data).toHaveProperty(CONTRIBUTION_KEY);
    });
  });

  // Level 2: Contribution Array
  describe('Contribution Array Level', () => {
    const contributions = data[CONTRIBUTION_KEY];

    it('should be an array', () => {
      expect(contributions).toBeInstanceOf(Array);
    });

    it('should contain exactly one contribution object', () => {
      expect(contributions).toHaveLength(1);
    });
  });

  // Level 3: Contribution Object
  describe('Contribution Object Level', () => {
    const contribution = data[CONTRIBUTION_KEY][0];

    it('should be an object', () => {
      expect(contribution).toBeInstanceOf(Object);
    });

    it('should have the correct @type', () => {
      expect(contribution).toHaveProperty(TYPE_KEY);
      expect(contribution[TYPE_KEY]).toBe(TYPE_CONTRIBUTION);
    });

    it('should have the agent property which is an array', () => {
      expect(contribution).toHaveProperty(AGENT_KEY);
      expect(contribution[AGENT_KEY]).toBeInstanceOf(Array);
    });

     it('should have exactly one agent object in the array', () => {
      expect(contribution[AGENT_KEY]).toHaveLength(1);
    });

    it('should have the role property which is an array', () => {
      expect(contribution).toHaveProperty(ROLE_KEY);
      expect(contribution[ROLE_KEY]).toBeInstanceOf(Array);
    });

    it('should have exactly one role object in the array', () => {
      expect(contribution[ROLE_KEY]).toHaveLength(1);
    });

     it('should not have an unexpected @guid property tested directly', () => {
      // We are explicitly ignoring @guid, so we don't assert its presence/value
      // No assertion needed here, this comment serves as documentation
     });
  });

  // Level 4: Agent Object (inside Contribution)
  describe('Agent Object Level', () => {
      const agent = data[CONTRIBUTION_KEY][0][AGENT_KEY][0];

      it('should be an object', () => {
        expect(agent).toBeInstanceOf(Object);
      });

      it('should have the correct @type', () => {
        expect(agent).toHaveProperty(TYPE_KEY);
        expect(agent[TYPE_KEY]).toBe(TYPE_PERSON);
      });

      it('should have the correct @id', () => {
        expect(agent).toHaveProperty(ID_KEY);
        expect(agent[ID_KEY]).toBe(ID_AGENT);
      });

      it('should have the label property which is an array', () => {
        expect(agent).toHaveProperty(LABEL_KEY);
        expect(agent[LABEL_KEY]).toBeInstanceOf(Array);
      });

      it('should have exactly two label objects in the array', () => {
        expect(agent[LABEL_KEY]).toHaveLength(2);
      });

      it('should have the marcKey property which is an array', () => {
        expect(agent).toHaveProperty(MARCKEY_KEY);
        expect(agent[MARCKEY_KEY]).toBeInstanceOf(Array);
      });

      it('should have exactly two marcKey objects in the array', () => {
        expect(agent[MARCKEY_KEY]).toHaveLength(2);
      });
  });

  // Level 5: Agent's Label Objects
  describe("Agent's Label Objects Level", () => {
      const labels = data[CONTRIBUTION_KEY][0][AGENT_KEY][0][LABEL_KEY];

      it('should have label objects that are indeed objects', () => {
          expect(labels[0]).toBeInstanceOf(Object);
          expect(labels[1]).toBeInstanceOf(Object);
      });

      // First Label
      it('first label object should have the correct label value', () => {
          expect(labels[0]).toHaveProperty(LABEL_KEY);
          expect(labels[0][LABEL_KEY]).toBe("Kim, Kyŏng-il, 1956-");
      });

      it('first label object should not have a language property', () => {
          expect(labels[0]).not.toHaveProperty(LANGUAGE_KEY);
      });

      // Second Label
      it('second label object should have the correct label value', () => {
          expect(labels[1]).toHaveProperty(LABEL_KEY);
          expect(labels[1][LABEL_KEY]).toBe("김 경일, 1956-");
      });

      it('second label object should have the correct language property', () => {
          expect(labels[1]).toHaveProperty(LANGUAGE_KEY);
          expect(labels[1][LANGUAGE_KEY]).toBe("zxx-kore");
      });
  });

  // Level 5: Agent's MarcKey Objects
  describe("Agent's MarcKey Objects Level", () => {
      const marcKeys = data[CONTRIBUTION_KEY][0][AGENT_KEY][0][MARCKEY_KEY];

       it('should have marcKey objects that are indeed objects', () => {
          expect(marcKeys[0]).toBeInstanceOf(Object);
          expect(marcKeys[1]).toBeInstanceOf(Object);
      });

      // First MarcKey
      it('first marcKey object should have the correct marcKey value', () => {
          expect(marcKeys[0]).toHaveProperty(MARCKEY_KEY);
          expect(marcKeys[0][MARCKEY_KEY]).toBe("1001 $aKim, Kyŏng-il,$d1956-");
      });

      it('first marcKey object should not have a language property', () => {
          expect(marcKeys[0]).not.toHaveProperty(LANGUAGE_KEY);
      });

      // Second MarcKey
      it('second marcKey object should have the correct marcKey value', () => {
          expect(marcKeys[1]).toHaveProperty(MARCKEY_KEY);
          expect(marcKeys[1][MARCKEY_KEY]).toBe("4001 $a김 경일,$d1956-");
      });

      it('second marcKey object should have the correct language property', () => {
          expect(marcKeys[1]).toHaveProperty(LANGUAGE_KEY);
          expect(marcKeys[1][LANGUAGE_KEY]).toBe("zxx-kore");
      });
  });

  // Level 4: Role Object (inside Contribution)
  describe('Role Object Level', () => {
      const role = data[CONTRIBUTION_KEY][0][ROLE_KEY][0];

      it('should be an object', () => {
        expect(role).toBeInstanceOf(Object);
      });

       it('should have the correct @type', () => {
        expect(role).toHaveProperty(TYPE_KEY);
        expect(role[TYPE_KEY]).toBe(TYPE_ROLE);
      });

      it('should have the correct @id', () => {
        expect(role).toHaveProperty(ID_KEY);
        expect(role[ID_KEY]).toBe(ID_ROLE);
      });

      it('should have the label property which is an array', () => {
        expect(role).toHaveProperty(LABEL_KEY);
        expect(role[LABEL_KEY]).toBeInstanceOf(Array);
      });

      it('should have exactly one label object in the array', () => {
        expect(role[LABEL_KEY]).toHaveLength(1);
      });

      it('should have the code property which is an array', () => {
        expect(role).toHaveProperty(CODE_KEY);
        expect(role[CODE_KEY]).toBeInstanceOf(Array);
      });

      it('should have exactly one code object in the array', () => {
        expect(role[CODE_KEY]).toHaveLength(1);
      });
  });

  // Level 5: Role's Label Object
  describe("Role's Label Object Level", () => {
      const roleLabel = data[CONTRIBUTION_KEY][0][ROLE_KEY][0][LABEL_KEY][0];

      it('should be an object', () => {
        expect(roleLabel).toBeInstanceOf(Object);
      });

      it('should have the correct label value', () => {
          expect(roleLabel).toHaveProperty(LABEL_KEY);
          expect(roleLabel[LABEL_KEY]).toBe("author");
      });

      it('should not have a language property', () => {
          expect(roleLabel).not.toHaveProperty(LANGUAGE_KEY);
      });
  });

  // Level 5: Role's Code Object
  describe("Role's Code Object Level", () => {
      const roleCode = data[CONTRIBUTION_KEY][0][ROLE_KEY][0][CODE_KEY][0];

      it('should be an object', () => {
        expect(roleCode).toBeInstanceOf(Object);
      });

      it('should have the correct code value', () => {
          expect(roleCode).toHaveProperty(CODE_KEY);
          expect(roleCode[CODE_KEY]).toBe("aut");
      });

       it('should not have a language property', () => {
          expect(roleCode).not.toHaveProperty(LANGUAGE_KEY);
      });
  });

});


// reset
useProfileStore().prepareForNewRecord()



// Make it a Family and make sure the type is changed
// Test contributor
xml = `
    <rdf:RDF xmlns:bf="http://id.loc.gov/ontologies/bibframe/" xmlns:bflc="http://id.loc.gov/ontologies/bflc/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:lclocal="http://id.loc.gov/ontologies/lclocal/" xmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#" xmlns:pmo="http://performedmusicontology.org/ontology/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:streams="info:lc/streams#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <bf:Work rdf:about="http://id.loc.gov/resources/works/1111111">
            <bf:contribution>
                <bf:Contribution>
                    <bf:agent>
                        <bf:Agent rdf:about="http://id.loc.gov/rwo/agents/nr93029417">
                            <rdf:type rdf:resource="http://id.loc.gov/ontologies/bibframe/Person"/>
                            <rdfs:label>Kim, Kyŏng-il, 1956-</rdfs:label>
                            <bflc:marcKey>1001 $aKim, Kyŏng-il,$d1956-</bflc:marcKey>
                            <rdfs:label xml:lang="zxx-kore">김 경일, 1956-</rdfs:label>
                            <bflc:marcKey xml:lang="zxx-kore">4001 $a김 경일,$d1956-</bflc:marcKey>
                        </bf:Agent>
                    </bf:agent>
                    <bf:role>
                        <bf:Role rdf:about="http://id.loc.gov/vocabulary/relators/aut">
                            <rdfs:label>author</rdfs:label>
                            <bf:code>aut</bf:code>
                        </bf:Role>
                    </bf:role>
                </bf:Contribution>
            </bf:contribution>
        </bf:Work>
    </rdf:RDF>
`
// parse the above
utils_parse.parseXml(xml)
// transform, passing the monograph profile
profileTransformed = await utils_parse.transformRts(useProfileStore().profiles['lc:profile:bf2:Monograph'])
// pull out of the userValue from the expected location
data = profileTransformed.rt['lc:RT:bf2:Monograph:Work'].pt.id_loc_gov_ontologies_bibframe_contribution__contributors.userValue

console.log(data)