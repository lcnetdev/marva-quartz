/**
 * Workflows: the automatic operations that can be run on each record as it is
 * loaded into a workflow.
 *
 * An enrichment is { id, label, description, available, run }
 *   run(profile, context) is called after the record is parsed, with the record made the
 *   profile store's activeProfile so the store's functions can be used on it. It should
 *   return true if it changed the record.
 *
 * `cip-lookup` is different: it does not change the record, it fetches WorldCat's version of
 * it and the sheet offers the differences cell by cell (lib/workflows/cip.js,
 * workflowStore.enrichRow). `worldcat-suggest` is that same lookup and overlay on its own,
 * without the CIP checklist's rules and without anything taken into the record automatically.
 * `excludes` lists the enrichments one makes redundant (the builder unchecks them).
 * `available: false` keeps an entry from being run (none are at the moment).
 */

import { CIP_ENRICHMENT_ID, WORLDCAT_SUGGEST_ENRICHMENT_ID } from './cip'

const workflowEnrichments = [
  {
    id: WORLDCAT_SUGGEST_ENRICHMENT_ID,
    label: 'Suggest from WorldCat',
    description: 'Looks the book up in WorldCat by its barcode or ISBN and shows what it has that is missing or different, for a click to accept. No CIP checklist, nothing is changed without a click.',
    available: true,
    excludes: [CIP_ENRICHMENT_ID],
    // nothing to run on the record itself, the store fetches the suggestions after the record is loaded
    run: async function(profile, context){ return false },
  },
  {
    id: CIP_ENRICHMENT_ID,
    label: 'CIP verification: suggest from WorldCat',
    description: 'Looks the book up in WorldCat by its barcode or ISBN and marks the fields that match, offering what is missing or different for a click to accept.',
    available: true,
    excludes: [WORLDCAT_SUGGEST_ENRICHMENT_ID],
    // same as above, the lookup is the store's
    run: async function(profile, context){ return false },
  },
]

/**
* Run the enrichments of a workflow against a record
* @param {array} ids - the enrichment ids from the workflow definition
* @param {object} profile - the record
* @param {object} context - {row, definition}
* @return {boolean} - did any of them change the record
*/
export async function runEnrichments(ids, profile, context){
  let changed = false
  for (let id of (ids || [])){
    let enrichment = workflowEnrichments.filter((e) => { return e.id === id && e.available })[0]
    if (!enrichment){ continue }
    try {
      if (await enrichment.run(profile, context)){
        changed = true
      }
    } catch (e) {
      console.error('Workflows: enrichment failed', id, e)
    }
  }
  return changed
}

export default workflowEnrichments
