/**
 * Workflows: how a barcode scanner's typing is told apart from a person's.
 *
 * A scanner is a keyboard that types a whole barcode in a burst, usually ending with enter.
 * These numbers are shared by the page-wide scan detection (WorkflowSession.scannerKeydown)
 * and the grid, which holds off opening a selected cell for typing until it knows the
 * keystrokes are not the start of a scan.
 */

// the most time (ms) between two keys for them to count as coming from a scanner and not a person typing
export const SCANNER_MAX_KEY_GAP = 50

// the fewest characters that count as a scan
export const SCANNER_MIN_LENGTH = 6

// how long (ms) after the last fast key a scan is taken as finished when the scanner does not send an enter
export const SCANNER_END_WAIT = 150

/**
* Is this key one a scanner would type
* @param {KeyboardEvent} event
* @return {boolean}
*/
export function isScannerCharacter(event){
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && /[0-9A-Za-z-]/.test(event.key)
}
