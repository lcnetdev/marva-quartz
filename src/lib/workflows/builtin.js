/**
 * Workflows: the workflows that come preloaded.
 *
 * A component is matched to the profile by its id, any that the loaded profile
 * does not have are left out when the workflow is opened.
 *
 * `enrichments` are ids from enrichments.js. A component can have `hiddenColumns`, the
 * subfields (column keys, see fields.expandComponentColumns) the sheet does not show.
 */

// the subfields of Admin Metadata that are not on the CIP verification checklist
const ADMIN_NOT_ON_CIP_CHECKLIST = [
  'http://id.loc.gov/ontologies/bflc/catalogerId',
  'http://id.loc.gov/ontologies/bibframe/status',
  'http://id.loc.gov/ontologies/bibframe/date',
  'http://id.loc.gov/ontologies/bibframe/agent',
  'http://id.loc.gov/ontologies/bflc/profile',
  'http://id.loc.gov/ontologies/bibframe/identifiedBy|http://www.w3.org/1999/02/22-rdf-syntax-ns#value',
  'http://id.loc.gov/ontologies/bibframe/generationProcess|http://www.w3.org/2000/01/rdf-schema#label',
  'http://id.loc.gov/ontologies/bflc/procInfo',
]

// the subfields of Admin Metadata other than the two that get edited (encoding level, authentication code)
const ADMIN_NOT_COMMONLY_EDITED = ADMIN_NOT_ON_CIP_CHECKLIST.concat([
  'http://id.loc.gov/ontologies/bibframe/descriptionConventions',
  'http://id.loc.gov/ontologies/bibframe/descriptionLanguage',
])

const builtinWorkflows = [
  {
    // the fields that get edited most in monograph records, from an analysis of the editing
    // sessions in Marva's log, most often edited first (the share of sessions that touched the
    // field is noted on each). Fields under 5% are left out.
    id: 'builtin-monograph-common-fields',
    builtin: true,
    name: 'Monograph: Common Fields',
    description: 'The fields that are edited most often in monograph records, most frequently edited first.',
    profileId: 'lc:RT:bf2:Monograph:Instance',
    components: [
      // 56% classification (LCC, DDC)
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_classification__classification_numbers' },
      // 45% subjects
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_subject__subjects' },
      // 36% contribution (primary 25%, other 17%)
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_contribution__creator_of_work' },
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_contribution__contributors' },
      // 28% encoding level, 10% description authentication
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_adminmetadata', hiddenColumns: ADMIN_NOT_COMMONLY_EDITED },
      // 27% provision activity
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_provisionActivity__provision_activity' },
      // 18% instance notes
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_note__notes_about_the_instance' },
      // 18% genre/form
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_genreForm__genreform' },
      // 17% statement of responsibility
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_responsibilityStatement__statement_of_responsibility' },
      // 17% geographic coverage
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_geographicCoverage__geographic_coverage' },
      // 17% extent
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_extent__physical_description' },
      // 16% instance title, 11% work title
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_title__title_information' },
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_title__title_information' },
      // 9% supplementary content
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_supplementaryContent__supplementary_content' },
      // 9% illustrative content
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_illustrativeContent__illustrative_content' },
      // 8% summary
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_summary__summary' },
      // 8% color content
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_colorContent__color_content' },
      // 8% dimensions
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_dimensions__dimensions' },
      // 7% edition statement
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_editionStatement__edition_statement' },
      // 5% relation
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_relation__search_related_workseries' },
      // 5% identifiers (almost all ISBN)
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_identifiedBy__identifiers' },
    ],
    enrichments: [],
  },
  {
    // the fields of the RDA CIP VER checklist, in the checklist's order. The checklist rows that
    // have no component in the Monograph profile (906, 955, 963, holdings/item) are left out.
    id: 'builtin-monograph-cip-verification',
    builtin: true,
    name: 'Monograph: CIP Verification',
    description: 'The RDA CIP VER checklist: the fields to verify against the book in hand once it arrives, with the stub record filled in from the publisher\'s data.',
    profileId: 'lc:RT:bf2:Monograph:Instance',
    components: [
      // Ldr/17 encoding level, Ldr/18 + 040 $e description conventions, 040 $b language of cataloging, 042 authentication code
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_adminmetadata', hiddenColumns: ADMIN_NOT_ON_CIP_CHECKLIST },
      // 020 ISBN
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_identifiedBy__identifiers' },
      // 050 class number
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_classification__classification_numbers' },
      // 1XX creator
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_contribution__creator_of_work' },
      // 240 preferred title (expression of / work title), 246 variant titles of the work
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_expressionOf__expression_of_[search_for_a_hub]' },
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_title__title_information' },
      // 245 title proper, 246 variant titles (cover/spine)
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_title__title_information' },
      // 245 $c statement of responsibility
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_responsibilityStatement__statement_of_responsibility' },
      // 250 edition statement
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_editionStatement__edition_statement' },
      // 263 expected publication date (to delete)
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bflc_projectedProvisionDate__projected_publication_date_yymm' },
      // 264 publication information, 264 _4 copyright date
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_provisionActivity__provision_activity' },
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_copyrightDate__copyright_date' },
      // 300 $a $b extent and other physical details, 300 $c dimensions
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_extent__physical_description' },
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_dimensions__dimensions' },
      // 008/18-21 + 340 $p illustrative content
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_illustrativeContent__illustrative_content' },
      // 336 content type, 337 media type, 338 carrier type
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_content__content_type' },
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_media__media_type' },
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_carrier__carrier_type' },
      // 490 series statement
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_relation__search_related_workseries' },
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_relation__input_transcribed_series' },
      // 504 bibliography note, 500 general note
      { rt: 'Instance', id: 'id_loc_gov_ontologies_bibframe_note__notes_about_the_instance' },
      // 505 contents note
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_tableOfContents__contents' },
      // 520 summary
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_summary__summary' },
      // 7XX added access points
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_contribution__contributors' },
      // 7XX X2 / 775 / 776 related works
      { rt: 'Work', id: 'id_loc_gov_ontologies_bibframe_relation__related_work_not_held_by_lc' },
    ],
    enrichments: ['cip-lookup'],
  },
]

export default builtinWorkflows
