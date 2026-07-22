import { expect, test, describe } from 'vitest'
// utils_parse needs to load before utils_rdf, importing utils_rdf first trips the
// circular import between utils_rdf -> stores/profile -> utils_parse -> utils_rdf
import utils_parse from "@/lib/utils_parse"; // eslint-disable-line
import utilsRDF from "@/lib/utils_rdf";


const picklistPt = {
    propertyURI: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    propertyLabel: "Work Type",
    type: "literal",
    valueConstraint: {
        valueTemplateRefs: [],
        useValuesFrom: [],
        defaults: [],
        valueDataType: {},
        picklist: ["bf:NotatedMusic", "bf:NotatedMovement"]
    }
}


describe("expandPrefixedClass", () => {
    test("expands bf: prefixed class names", () =>
        expect(utilsRDF.expandPrefixedClass('bf:NotatedMusic')).toBe('http://id.loc.gov/ontologies/bibframe/NotatedMusic')
    )
    test("returns false for unknown prefixes", () =>
        expect(utilsRDF.expandPrefixedClass('nope:NotatedMusic')).toBe(false)
    )
    test("returns false for non prefixed values", () =>
        expect(utilsRDF.expandPrefixedClass('NotatedMusic')).toBe(false)
    )
})

describe("isRdfTypePicklist", () => {
    test("detects a rdf:type property with a class picklist", () =>
        expect(utilsRDF.isRdfTypePicklist(picklistPt)).toBe(true)
    )
    test("rejects other propertyURIs", () => {
        let pt = JSON.parse(JSON.stringify(picklistPt))
        pt.propertyURI = 'http://id.loc.gov/ontologies/bibframe/note'
        expect(utilsRDF.isRdfTypePicklist(pt)).toBe(false)
    })
    test("rejects a rdf:type property without a picklist", () => {
        let pt = JSON.parse(JSON.stringify(picklistPt))
        delete pt.valueConstraint.picklist
        expect(utilsRDF.isRdfTypePicklist(pt)).toBe(false)
    })
    test("rejects an empty picklist", () => {
        let pt = JSON.parse(JSON.stringify(picklistPt))
        pt.valueConstraint.picklist = []
        expect(utilsRDF.isRdfTypePicklist(pt)).toBe(false)
    })
    test("rejects picklist values that are not prefixed class names", () => {
        let pt = JSON.parse(JSON.stringify(picklistPt))
        pt.valueConstraint.picklist = ["bf:NotatedMusic", "not a class"]
        expect(utilsRDF.isRdfTypePicklist(pt)).toBe(false)
    })
})
