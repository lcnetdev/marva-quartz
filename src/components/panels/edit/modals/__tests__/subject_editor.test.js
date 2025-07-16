import { expect, test, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import utils_export from "@/lib/utils_export";
import { utilsNetwork } from "@/lib/utils_network";
import { useProfileStore } from '@/stores/profile'
import SubjectEditor from "@/components/panels/edit/modals/SubjectEditor.vue";

import { createPinia } from 'pinia'
import { createApp } from 'vue'

const pinia = createPinia()
const app = createApp()
app.use(pinia)


const expectedSimpleSubect = [{ "label": "Dogs", "uri": "http://id.loc.gov/authorities/subjects/sh85038796", "id": 0, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aDogs" }]
const componentComplexHeading = [{ "label": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "id": 0, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aFood" }, { "label": "History‑‑20th century", "uri": "http://id.loc.gov/authorities/subjects/sh2002006165", "id": 1, "type": "madsrdf:Topic", "complex": true, "literal": false, "posStart": 6, "posEnd": 27, "marcKey": "180  $xHistory$y20th century" }]
const expectedComplexHeading = [{ "label": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "id": 0, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aFood" }, { "complex": false, "id": 1, "label": "History", "literal": false, "posEnd": 7, "posStart": 0, "type": "madsrdf:Topic", "uri": "http://id.loc.gov/authorities/subjects/sh99005024", "marcKey": "180  $xHistory", "fromComplex": true, "complexMarcKey": "180  $xHistory$y20th century" }, { "complex": false, "id": 2, "label": "20th century", "literal": false, "posEnd": 12, "posStart": 0, "type": "madsrdf:Temporal", "uri": "http://id.loc.gov/authorities/subjects/sh2002012476", "marcKey": "182  $y20th century", "fromComplex": true, "complexMarcKey": "180  $xHistory$y20th century" }]
const expectedHeadingDogsHistory = [{ "label": "Dogs", "uri": "http://id.loc.gov/authorities/subjects/sh85038796", "id": 0, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aDogs" }, { "label": "History", "uri": "http://id.loc.gov/authorities/subjects/sh99005024", "id": 1, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 6, "posEnd": 13, "marcKey": "180  $xHistory" }]
const expectedHeadingFoodItalyHistory = [{ "label": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "id": 0, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aFood" }, { "label": "Italy", "uri": "http://id.loc.gov/authorities/names/n79021783-781", "id": 1, "type": "madsrdf:Geographic", "complex": false, "literal": false, "posStart": 6, "posEnd": 11, "marcKey": "181  $zItaly" }, { "label": "History", "uri": "http://id.loc.gov/authorities/subjects/sh99005024", "id": 2, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 13, "posEnd": 20, "marcKey": "180  $xHistory" }]

const splitComplexHeading = [{ "label": "Korea", "uri": "http://id.loc.gov/authorities/subjects/sh85073008", "id": 0, "type": "madsrdf:Geographic", "complex": false, "literal": false, "posStart": 0, "posEnd": 5, "marcKey": "151 0$aKorea" }, { "label": "Fiction", "uri": "http://id.loc.gov/authorities/subjects/sh99001562", "id": 1, "type": "madsrdf:GenreForm", "complex": false, "literal": false, "posStart": 7, "posEnd": 14, "marcKey": "185  $vFiction" }]
const expectedStitchedHeading = [{ "complex": true, "id": 0, "label": "Korea‑‑Fiction", "literal": false, "posEnd": 14, "posStart": 0, "type": "madsrdf:Topic", "uri": "http://id.loc.gov/authorities/subjects/sh2008122923", "marcKey": "151  $aKorea$vFiction" }]

const startingComponentsFoodSpainHistory = [{ "label": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "id": 0, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aFood" }, { "label": "Spain", "uri": "http://id.loc.gov/authorities/names/n79006971-781", "id": 1, "type": "madsrdf:Geographic", "complex": false, "literal": false, "posStart": 6, "posEnd": 11, "marcKey": "181  $zSpain" }, { "label": "History", "uri": "http://id.loc.gov/authorities/subjects/sh99005024", "id": 2, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 13, "posEnd": 20, "marcKey": "180  $xHistory" }]

const componentLookupDogs = { "0": { "Dogs": { "type": "madsrdf:Topic", "collections": ["http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically"], "label": "Dogs", "vlabel": "", "suggestLabel": "Dogs", "uri": "http://id.loc.gov/authorities/subjects/sh85038796", "literal": false, "depreciated": false, "extra": { "nonlatinLabels": [], "vernacularLabels": [], "rdftypes": ["Topic", "SimpleType", "Authority"], "collections": ["http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically"], "genres": [], "variantLabels": ["Canis canis", "Canis domesticus", "Canis familiarus", "Canis familiarus domesticus", "Canis lupus familiaris", "Dog", "Domestic dog"], "languages": [], "relateds": ["Domestic animals", "Gray wolf"], "occupations": [], "activityfields": [], "sources": ["found : ITIS, Mar. 20, 2008 (Canis lupus familiaris - domestic dog. Synonyms: Canis familiaris, Canis familiarus domesticus)", "found : NCBI taxonomy browser, via WWW, Mar. 20, 2008 (Canis lupus familiaris (dog). Synonyms: Canis familiaris, Canis domesticus, Canis canis. Common name: dogs)", "found : Mammal species of the world, 3rd ed., via WWW, Mar. 20, 2008 (Canis lupus familiaris - Domestic dog; comments under Canis lupus: Includes the domestic dog as a subspecies, with the dingo provisionally separate--artificial variants created by domestication and selective breeding)", "found : Wikipedia, Mar. 20, 2008 (under Gray wolf: DNA sequencing and genetic drift studies indicate that the gray wolf shares a common ancestry with the domestic dog (Canis lupus familiaris); the domestic dog is now normally classified as a subspecies of the wolf: Canis lupus familiaris)"], "locales": [], "birthplaces": [], "birthdates": [], "deathdates": [], "lcclasss": [], "lcclasses": [{ "classuri": "http://id.loc.gov/authorities/classification/QL737.C22", "code": "QL737.C22", "label": "Science--Zoology--Chordates. Vertebrates--Mammals--Systematic divisions. By order and family, A-Z--Carnivora--Canidae (Dogs)", "assigner": "DLC" }, { "classuri": "http://id.loc.gov/authorities/classification/SF421-SF440.2", "code": "SF421-SF440.2", "label": "Agriculture--Animal culture--Pets--Dogs", "assigner": "DLC" }], "hasRelatedAuthoritys": [], "broaders": ["Domestic animals", "Gray wolf"], "sees": [], "hasEarlierEstablishedForms": [], "hasLaterEstablishedForms": [], "useFors": [], "marcKeys": ["150  $aDogs"], "gacs": [], "literal": false, "title": "Dogs", "uri": "http://id.loc.gov/authorities/subjects/sh85038796", "type": "madsrdf:Topic", "typeFull": "http://www.loc.gov/mads/rdf/v1#Topic" }, "total": 33, "undifferentiated": false, "subdivision": false, "count": 0, "picked": false, "marcKey": "150  $aDogs" } } }
const componentLookupDogsHistory = { "0": { "Dogs": { "type": "madsrdf:Topic", "collections": ["http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically"], "label": "Dogs", "vlabel": "", "suggestLabel": "Dogs", "uri": "http://id.loc.gov/authorities/subjects/sh85038796", "literal": false, "depreciated": false, "extra": { "nonlatinLabels": [], "vernacularLabels": [], "rdftypes": ["Topic", "SimpleType", "Authority"], "collections": ["http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically"], "genres": [], "variantLabels": ["Canis canis", "Canis domesticus", "Canis familiarus", "Canis familiarus domesticus", "Canis lupus familiaris", "Dog", "Domestic dog"], "languages": [], "relateds": ["Domestic animals", "Gray wolf"], "occupations": [], "activityfields": [], "sources": ["found : ITIS, Mar. 20, 2008 (Canis lupus familiaris - domestic dog. Synonyms: Canis familiaris, Canis familiarus domesticus)", "found : NCBI taxonomy browser, via WWW, Mar. 20, 2008 (Canis lupus familiaris (dog). Synonyms: Canis familiaris, Canis domesticus, Canis canis. Common name: dogs)", "found : Mammal species of the world, 3rd ed., via WWW, Mar. 20, 2008 (Canis lupus familiaris - Domestic dog; comments under Canis lupus: Includes the domestic dog as a subspecies, with the dingo provisionally separate--artificial variants created by domestication and selective breeding)", "found : Wikipedia, Mar. 20, 2008 (under Gray wolf: DNA sequencing and genetic drift studies indicate that the gray wolf shares a common ancestry with the domestic dog (Canis lupus familiaris); the domestic dog is now normally classified as a subspecies of the wolf: Canis lupus familiaris)"], "locales": [], "birthplaces": [], "birthdates": [], "deathdates": [], "lcclasss": [], "lcclasses": [{ "classuri": "http://id.loc.gov/authorities/classification/QL737.C22", "code": "QL737.C22", "label": "Science--Zoology--Chordates. Vertebrates--Mammals--Systematic divisions. By order and family, A-Z--Carnivora--Canidae (Dogs)", "assigner": "DLC" }, { "classuri": "http://id.loc.gov/authorities/classification/SF421-SF440.2", "code": "SF421-SF440.2", "label": "Agriculture--Animal culture--Pets--Dogs", "assigner": "DLC" }], "hasRelatedAuthoritys": [], "broaders": ["Domestic animals", "Gray wolf"], "sees": [], "hasEarlierEstablishedForms": [], "hasLaterEstablishedForms": [], "useFors": [], "marcKeys": ["150  $aDogs"], "gacs": [], "literal": false, "title": "Dogs", "uri": "http://id.loc.gov/authorities/subjects/sh85038796", "type": "madsrdf:Topic", "typeFull": "http://www.loc.gov/mads/rdf/v1#Topic" }, "total": 33, "undifferentiated": false, "subdivision": false, "count": 0, "picked": true, "marcKey": "150  $aDogs", "type": "madsrdf:Topic" } }, "1": { "History": { "type": "madsrdf:Topic", "collections": ["http://id.loc.gov/authorities/subjects/collection_Subdivisions", "http://id.loc.gov/authorities/subjects/collection_TopicSubdivisions", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1095", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1100", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1103", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1105", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1140", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1149.5", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1154", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1159", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1187", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1188"], "label": "History", "vlabel": "", "suggestLabel": "History", "uri": "http://id.loc.gov/authorities/subjects/sh99005024", "literal": false, "depreciated": false, "extra": { "nonlatinLabels": [], "vernacularLabels": [], "rdftypes": ["Topic", "SimpleType", "Authority"], "collections": ["http://id.loc.gov/authorities/subjects/collection_Subdivisions", "http://id.loc.gov/authorities/subjects/collection_TopicSubdivisions", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1095", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1100", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1103", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1105", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1140", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1149.5", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1154", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1159", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1187", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1188"], "notes": ["Use as a topical subdivision under names of countries, cities, etc., and individual corporate bodies, uniform titles of sacred works, and under classes of persons, ethnic groups, and topical headings."], "genres": [], "variantLabels": ["Frontier troubles", "Frontier troubles"], "languages": [], "relateds": ["Frontier troubles"], "occupations": [], "activityfields": [], "locales": [], "birthplaces": [], "birthdates": [], "deathdates": [], "lcclasss": [], "lcclasses": [], "hasRelatedAuthoritys": [], "broaders": [], "sees": [], "hasEarlierEstablishedForms": [], "hasLaterEstablishedForms": [], "useFors": [], "marcKeys": ["180  $xHistory"], "gacs": [], "literal": false, "title": "History", "uri": "http://id.loc.gov/authorities/subjects/sh99005024", "type": "madsrdf:Topic", "typeFull": "http://www.loc.gov/mads/rdf/v1#Topic" }, "total": 11, "undifferentiated": false, "subdivision": true, "count": 0, "picked": false, "marcKey": "180  $xHistory" } } }
const componentLookupFoodItalyHistory = { "0": { "Food": { "collections": ["http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically"], "label": "Food", "vlabel": "Foods", "suggestLabel": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "literal": false, "depreciated": false, "extra": { "nonlatinLabels": [], "vernacularLabels": [], "rdftypes": ["Topic", "SimpleType", "Authority"], "collections": ["http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_SubdivideGeographically"], "notes": ["subdivision [Food] under ethnic groups, and individual animals and groups of animals, e.g. [Fishes--Food;] also headings beginning with the word [Food;] and individual foods and beverages, e.g. [Bread; Milk]"], "genres": [], "variantLabels": ["Foods", "Primitive societies--Food", "Primitive societies--Food"], "languages": [], "relateds": ["Primitive societies--Food", "Dinners and dining", "Home economics", "Table", "Cooking", "Diet", "Dietaries", "Gastronomy", "Nutrition"], "occupations": [], "activityfields": [], "locales": [], "birthplaces": [], "birthdates": [], "deathdates": [], "lcclasss": [], "lcclasses": [{ "classuri": "http://id.loc.gov/authorities/classification/GN407-GN411.5", "code": "GN407-GN411.5", "label": "Geography. Anthropology. Recreation--Anthropology--Ethnology. Social and cultural anthropology--Cultural traits, customs, and institutions--Technology. Material culture--Food and food production. Subsistence. Nutritional anthropology", "assigner": "DLC" }, { "classuri": "http://id.loc.gov/authorities/classification/RA601-RA602", "code": "RA601-RA602", "label": "Medicine--Public aspects of medicine--Public health. Hygiene. Preventive medicine--Food and food supply in relation to public health", "assigner": "DLC" }, { "classuri": "http://id.loc.gov/authorities/classification/TX341-TX641", "code": "TX341-TX641", "label": "Technology--Home economics--Nutrition. Foods and food supply", "assigner": "DLC" }], "hasRelatedAuthoritys": [], "broaders": ["Dinners and dining", "Home economics", "Table"], "sees": [], "hasEarlierEstablishedForms": [], "hasLaterEstablishedForms": [], "useFors": [], "marcKeys": ["150  $aFood"], "gacs": [], "literal": false, "title": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "type": "madsrdf:Topic", "typeFull": "http://www.loc.gov/mads/rdf/v1#Topic" }, "total": 111, "undifferentiated": false, "subdivision": false, "count": 0, "picked": true, "marcKey": "150  $aFood", "type": "madsrdf:Topic" } }, "1": { "Spain": { "type": "madsrdf:Geographic", "collections": ["http://id.loc.gov/authorities/subjects/collection_Subdivisions", "http://id.loc.gov/authorities/subjects/collection_GeographicSubdivisions", "http://id.loc.gov/authorities/names/collection_LCNAF"], "label": "Spain", "vlabel": "", "suggestLabel": "Spain", "uri": "http://id.loc.gov/authorities/names/n79006971-781", "literal": false, "depreciated": false, "extra": { "nonlatinLabels": [], "vernacularLabels": [], "rdftypes": ["Geographic", "SimpleType", "Authority"], "collections": ["http://id.loc.gov/authorities/subjects/collection_Subdivisions", "http://id.loc.gov/authorities/subjects/collection_GeographicSubdivisions", "http://id.loc.gov/authorities/names/collection_LCNAF"], "notes": ["[Resource automatically generated from LCCN n79006971]"], "genres": [], "variantLabels": [], "languages": [], "relateds": [], "occupations": [], "activityfields": [], "sources": ["found : Source:  http://id.loc.gov/authorities/names/n79006971"], "locales": [], "birthplaces": [], "birthdates": [], "deathdates": [], "lcclasss": [], "lcclasses": [], "hasRelatedAuthoritys": [], "broaders": [], "sees": [], "hasEarlierEstablishedForms": [], "hasLaterEstablishedForms": [], "useFors": [], "marcKeys": ["181  $zSpain"], "gacs": [], "literal": false, "title": "Spain", "uri": "http://id.loc.gov/authorities/names/n79006971-781", "type": "madsrdf:Geographic", "typeFull": "http://www.loc.gov/mads/rdf/v1#Geographic" }, "total": 66, "undifferentiated": false, "subdivision": true, "count": 0, "labelOrginal": "Spain", "picked": true, "marcKey": "181  $zSpain", "type": "madsrdf:Geographic" }, "Italy": { "type": "madsrdf:Geographic", "collections": ["http://id.loc.gov/authorities/subjects/collection_Subdivisions", "http://id.loc.gov/authorities/subjects/collection_GeographicSubdivisions", "http://id.loc.gov/authorities/names/collection_LCNAF"], "label": "Italy", "vlabel": "", "suggestLabel": "Italy", "uri": "http://id.loc.gov/authorities/names/n79021783-781", "literal": false, "depreciated": false, "extra": { "nonlatinLabels": [], "vernacularLabels": [], "rdftypes": ["Geographic", "SimpleType", "Authority"], "collections": ["http://id.loc.gov/authorities/subjects/collection_Subdivisions", "http://id.loc.gov/authorities/subjects/collection_GeographicSubdivisions", "http://id.loc.gov/authorities/names/collection_LCNAF"], "notes": ["[Resource automatically generated from LCCN n79021783]"], "genres": [], "variantLabels": [], "languages": [], "relateds": [], "occupations": [], "activityfields": [], "sources": ["found : Source:  http://id.loc.gov/authorities/names/n79021783"], "locales": [], "birthplaces": [], "birthdates": [], "deathdates": [], "lcclasss": [], "lcclasses": [], "hasRelatedAuthoritys": [], "broaders": [], "sees": [], "hasEarlierEstablishedForms": [], "hasLaterEstablishedForms": [], "useFors": [], "marcKeys": ["181  $zItaly"], "gacs": [], "literal": false, "title": "Italy", "uri": "http://id.loc.gov/authorities/names/n79021783-781", "type": "madsrdf:Geographic", "typeFull": "http://www.loc.gov/mads/rdf/v1#Geographic" }, "total": 215, "undifferentiated": false, "subdivision": true, "count": 0, "labelOrginal": "Italy", "picked": false, "marcKey": "181  $zItaly" } }, "2": { "History": { "collections": ["http://id.loc.gov/authorities/subjects/collection_Subdivisions", "http://id.loc.gov/authorities/subjects/collection_TopicSubdivisions", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1095", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1100", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1103", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1105", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1140", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1149.5", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1154", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1159", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1187", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1188"], "label": "History", "vlabel": "", "suggestLabel": "History", "uri": "http://id.loc.gov/authorities/subjects/sh99005024", "literal": false, "depreciated": false, "extra": { "nonlatinLabels": [], "vernacularLabels": [], "rdftypes": ["Topic", "SimpleType", "Authority"], "collections": ["http://id.loc.gov/authorities/subjects/collection_Subdivisions", "http://id.loc.gov/authorities/subjects/collection_TopicSubdivisions", "http://id.loc.gov/authorities/subjects/collection_LCSH_General", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1095", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1100", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1103", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1105", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1140", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1149.5", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1154", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1159", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1187", "http://id.loc.gov/authorities/subjects/collection_PatternHeadingH1188"], "notes": ["Use as a topical subdivision under names of countries, cities, etc., and individual corporate bodies, uniform titles of sacred works, and under classes of persons, ethnic groups, and topical headings."], "genres": [], "variantLabels": ["Frontier troubles", "Frontier troubles"], "languages": [], "relateds": ["Frontier troubles"], "occupations": [], "activityfields": [], "locales": [], "birthplaces": [], "birthdates": [], "deathdates": [], "lcclasss": [], "lcclasses": [], "hasRelatedAuthoritys": [], "broaders": [], "sees": [], "hasEarlierEstablishedForms": [], "hasLaterEstablishedForms": [], "useFors": [], "marcKeys": ["180  $xHistory"], "gacs": [], "literal": false, "title": "History", "uri": "http://id.loc.gov/authorities/subjects/sh99005024", "type": "madsrdf:Topic", "typeFull": "http://www.loc.gov/mads/rdf/v1#Topic" }, "total": 11, "undifferentiated": false, "subdivision": true, "count": 0, "picked": true, "marcKey": "180  $xHistory", "type": "madsrdf:Topic" } } }

const componentIncoming = { "@guid": "bmZDTEpHpmZ88SxYg4pv3E", "@type": "http://id.loc.gov/ontologies/bibframe/Topic", "@id": "http://id.loc.gov/authorities/subjects/sh85072708", "http://www.w3.org/2000/01/rdf-schema#label": [{ "@guid": "4GgyD8ku5HM7hsZJhH6UEi", "http://www.w3.org/2000/01/rdf-schema#label": "Knitting--Patterns", "@language": "en" }], "http://id.loc.gov/ontologies/bflc/marcKey": [{ "@guid": "gdRxbz1JNAhahgTWiLfQxj", "http://id.loc.gov/ontologies/bflc/marcKey": "150  $aKnitting$vPatterns" }], "http://www.loc.gov/mads/rdf/v1#componentList": [{ "@guid": "vBv2z7ZszcJuE4sx5Fj5mj", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [{ "@guid": "6XvhKKsPiKoX3WrCXfWE1w", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Knitting", "@language": "en" }], "http://www.loc.gov/mads/rdf/v1#elementList": [{ "@guid": "csBKNBoXCvSHkL1zRxZZwt", "@type": "http://www.loc.gov/mads/rdf/v1#TopicElement", "http://www.loc.gov/mads/rdf/v1#elementValue": [{ "@guid": "xsBYkrCcugME5Vb1DEemth", "http://www.loc.gov/mads/rdf/v1#elementValue": "Knitting", "@language": "en" }] }] }, { "@guid": "enmSZqTFFdUZChFgrumBWY", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": [{ "@guid": "3cN6hsHWRDPiRAYZoBbAPe", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Patterns", "@language": "en" }], "http://www.loc.gov/mads/rdf/v1#elementList": [{ "@guid": "akWcfUQ3bFW6SqUUkiN57T", "@type": "http://www.loc.gov/mads/rdf/v1#GenreFormElement", "http://www.loc.gov/mads/rdf/v1#elementValue": [{ "@guid": "snjBZrMnBwcTjpX18iAuos", "http://www.loc.gov/mads/rdf/v1#elementValue": "Patterns", "@language": "en" }] }] }] }
const componentLookupStitch = { "0": { "Knitting‑‑Patterns": { "label": "Knitting--Patterns", "literal": false, "uri": "http://id.loc.gov/authorities/subjects/sh85072708", "type": "madsrdf:Topic", "marcKey": "150  $aKnitting$vPatterns" } } }
const expectedSubjectComponent = [{ "label": "Knitting‑‑Patterns", "uri": "http://id.loc.gov/authorities/subjects/sh85072708", "id": 0, "type": "madsrdf:Topic", "complex": true, "literal": false, "posStart": 0, "posEnd": 18, "marcKey": "150  $aKnitting$vPatterns" }]

const geoComponentsBeforeSwitch = [{ "label": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "id": 0, "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aFood" }, { "label": "portugal", "uri": null, "id": 1, "type": "", "complex": false, "literal": null, "posStart": 6, "posEnd": 14, "marcKey": null, "nonLatinLabel": null, "nonLatinMarcKey": null }, { "label": "porto", "uri": null, "id": 2, "type": "", "complex": false, "literal": null, "posStart": 16, "posEnd": 21, "marcKey": null, "nonLatinLabel": null, "nonLatinMarcKey": null }]
const geoComponentsAfterSwitchTogether = [{ "label": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "id": "0", "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aFood" }, { "label": "portugal‑‑porto", "uri": null, "id": "1", "type": "", "complex": false, "literal": null, "posStart": 6, "posEnd": 21, "marcKey": null, "nonLatinLabel": null, "nonLatinMarcKey": null }]
const geoComponentsAfterSwitchSplit = [{ "label": "Food", "uri": "http://id.loc.gov/authorities/subjects/sh85050184", "id": "0", "type": "madsrdf:Topic", "complex": false, "literal": false, "posStart": 0, "posEnd": 4, "marcKey": "150  $aFood" }, { "label": "portugal", "uri": null, "id": "1", "type": "madsrdf:Topic", "complex": false, "literal": null, "posStart": 6, "posEnd": 14 }, { "label": "porto", "uri": null, "id": "2", "type": "madsrdf:Topic", "complex": false, "literal": null, "posStart": 16, "posEnd": 21 }]

describe('SubjectEditor add()', () => {
    // Dogs
    describe("Adding a simple subject to the record", () => {
        test('Components should match before and after adding', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                components: expectedSimpleSubect,
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })
            wrapper.vm.add()
            expect(wrapper.vm.components).toEqual(expectedSimpleSubect)
            expect(wrapper.emitted().subjectAdded).toEqual([[expectedSimpleSubect]])
        });
    })

    describe("Break up a complex heading", () => {
        test('Component matches expected components, complex piece should be broken up', async () => {
            let mockData = {"components":[{"@list":[{"@id":"http://id.loc.gov/authorities/subjects/sh99005024"},{"@id":"http://id.loc.gov/authorities/subjects/sh2002012476"}]}],"subfields":["$x","$y"],"marcKey":"180  $xHistory$y20th century"}

            const wrapper = shallowMount(SubjectEditor)

            // so we don't have to do the fetch
            const spy = vi.spyOn(wrapper.vm, 'parseComplexSubject')
            spy.mockImplementation(() => mockData)

            wrapper.setData({
                components: componentComplexHeading,
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })
            await wrapper.vm.add()
            expect(wrapper.vm.components).toEqual(expectedComplexHeading)
        });
    })

    describe("Stitch together multiple components that could be 1 complex subject", () => {
        test('`Korea`--`Fiction` > `Korea--Fiction`', async () => {
            const wrapper = shallowMount(SubjectEditor)

            wrapper.setData({
                components: splitComplexHeading,
                searchResults: {
                    subjectsComplex: [{ "collections": ["http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings", "http://id.loc.gov/authorities/subjects/collection_LCSH_General"], "label": "Korea‑‑Fiction", "vlabel": "", "suggestLabel": "Korea--Fiction", "uri": "http://id.loc.gov/authorities/subjects/sh2008122923", "literal": false, "depreciated": false, "extra": { "nonlatinLabels": [], "vernacularLabels": [], "rdftypes": ["ComplexSubject", "ComplexType", "Authority"], "collections": ["http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings", "http://id.loc.gov/authorities/subjects/collection_LCSH_General"], "notes": ["[Record generated for validation purposes.]"], "genres": ["Fiction"], "variantLabels": [], "languages": [], "relateds": [], "occupations": [], "activityfields": [], "sources": ["found : Work cat.: One thousand chestnut trees, 1998"], "locales": [], "birthplaces": [], "birthdates": [], "deathdates": [], "lcclasss": [], "lcclasses": [], "hasRelatedAuthoritys": [], "broaders": [], "sees": [], "hasEarlierEstablishedForms": [], "hasLaterEstablishedForms": [], "useFors": [], "marcKeys": ["151  $aKorea$vFiction"], "gacs": [] }, "total": 1, "undifferentiated": false, "subdivision": false, "count": 0, "labelOrginal": "Korea--Fiction", "complex": true, "picked": false }],
                    subjectsChildrenComplex: []
                }
            })
            await wrapper.vm.add()
            expect(wrapper.vm.components).toEqual(expectedStitchedHeading)
        });
    })
})


describe('SubjectEditor buildComponents()', () => {
    // Dogs
    describe("Initial select of a simple subject for the heading.", () => {
        test('Components should match expected', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                subjectString: '',
                componetLookup: componentLookupDogs,
                components: {},
                pickLookup: {},
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })

            wrapper.vm.buildComponents('Dogs')
            expect(wrapper.vm.components).toEqual(expectedSimpleSubect)
            expect(wrapper.vm.subjectString).toEqual('Dogs')
        });
    })

    describe("Add subdivision to existing component list.", () => {
        test('Components should match expected', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                subjectString: '',
                componetLookup: componentLookupDogsHistory,
                components: expectedSimpleSubect,
                pickLookup: {},
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })

            wrapper.vm.buildComponents('Dogs--History')
            expect(wrapper.vm.components).toEqual(expectedHeadingDogsHistory)
            expect(wrapper.vm.subjectString).toEqual('Dogs--History')
        });
    })

    describe("Change the middle component in an existing component list. Spain > Italy", () => {
        test('Components should match expected', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                subjectString: 'Food--Spain--History',
                componetLookup: componentLookupFoodItalyHistory,
                components: startingComponentsFoodSpainHistory,
                pickLookup: {},
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })

            wrapper.vm.buildComponents('Food--Italy--History')
            expect(wrapper.vm.components).toEqual(expectedHeadingFoodItalyHistory)
            expect(wrapper.vm.subjectString).toEqual('Food--Italy--History')
        });
    })


    describe("Build the components when an authority is opened after creation", () => {
        test('Components should match expected', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                subjectString: '',
                componetLookup: componentLookupStitch,
                components: [],
                pickLookup: {},
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                }
            })

            wrapper.vm.buildComponents('Knitting--Patterns')
            expect(wrapper.vm.components).toEqual(expectedSubjectComponent)
            expect(wrapper.vm.subjectString).toEqual('Knitting‑‑Patterns')
        });
    })
})


describe('SubjectEditor searchModeSwitch()', () => {
    describe("Switching to geo should change -- to `‑‑` between unverified components.", () => {
        test('Components should match expected', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                subjectString: 'Food--portugal--porto',
                componetLookup: {},
                components: geoComponentsBeforeSwitch,
                pickLookup: {},
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: []
                },
                $refs: { subjectInput: {} }
            })

            wrapper.vm.searchModeSwitch('GEO')
            expect(wrapper.vm.components).toEqual(geoComponentsAfterSwitchTogether)
            expect(wrapper.vm.subjectString).toEqual('Food--portugal‑‑porto')
        });
    })

    describe("Switching away from geo should change `‑‑` to -- between unverified components.", () => {
        test('Components should match expected', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                subjectString: 'Food--portugal‑‑porto',
                componetLookup: {},
                components: geoComponentsAfterSwitchTogether,
                pickLookup: {},
                searchResults: {
                    subjectsComplex: [],
                    subjectsChildrenComplex: [],
                    subjectsSimple: [],
                    subjectsChildren: [],
                    names: []
                },
                $refs: { subjectInput: {} }
            })

            wrapper.vm.searchModeSwitch('LCSH')

            expect(wrapper.vm.components).toEqual(geoComponentsAfterSwitchSplit)
            expect(wrapper.vm.subjectString).toEqual('Food--portugal--porto')
        });
    })
})

describe('SubjectEditor buildPickLookup()', () => {
    describe("pickLookup is built correctly.", () => {
        test('Order should match expectations', async () => {
            const wrapper = shallowMount(SubjectEditor)
            wrapper.setData({
                subjectString: '',
                componetLookup: {},
                components: geoComponentsAfterSwitchTogether,
                pickLookup: {},
                searchResults: {
                    subjectsComplex: [{ "label": "Dogs‑‑Abnormalities" }, { "label": "Dogs‑‑Abnormalities‑‑Bibliography" }, { "label": "Dogs‑‑Age" }, { "label": "Dogs‑‑Age determination" }, { "label": "Dogs‑‑Agility trials" }],
                    subjectsChildrenComplex: [],
                    subjectsSimple: [{ "label": "Dogs" }, { "label": "Dog adoption" }, { "label": "Dogs as carriers of disease" }, { "label": "Dogs as laboratory animals" }, { "label": "Dog breeds" }, { "label": "dogs" }],
                    subjectsChildren: [],
                    names: [{ "label": "Dog's Best Friend (Firm)" }, { "label": "Dog's Breath Productions" }, { "label": "Dogs Die in Hot Cars (Musical group)" }, { "label": "Dogs d'Amour (Musical group)" }, { "label": "Blank Dogs" }]
                }
            })

            wrapper.vm.buildPickLookup()

            expect(wrapper.vm.pickLookup[-5].label).toEqual("Dog's Best Friend (Firm)")
            expect(wrapper.vm.pickLookup[0].label).toEqual("Dogs‑‑Abnormalities")
            expect(wrapper.vm.pickLookup[5].label).toEqual("Dogs")
            expect(wrapper.vm.pickLookup[9].label).toEqual("Dog breeds")
        });
    })
})

