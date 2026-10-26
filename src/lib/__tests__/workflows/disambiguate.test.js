import { describe, expect, test } from 'vitest'
import { recommendCandidate, scannedIdentifierStatus } from '@/lib/workflows/disambiguate'

const ISBN_PRINT = '9780000000654'
const ISBN_EBOOK = '9780000000661'
const printRecord = () => { return { label: 'print', inspection: { format: 'print', isbns: [{ value: ISBN_PRINT, canceled: false }, { value: ISBN_EBOOK, canceled: true }], lastModified: '2025-01-01T00:00:00', size: 10 } } }
const ebookRecord = () => { return { label: 'ebook', inspection: { format: 'ebook', isbns: [{ value: ISBN_PRINT, canceled: true }, { value: ISBN_EBOOK, canceled: false }], lastModified: '2025-06-01T00:00:00', size: 20 } } }

describe('recommendCandidate', () => {
  test('the record where the scanned ISBN is not canceled is certain, whichever format it is', () => {
    let candidates = [ebookRecord(), printRecord()]
    let advice = recommendCandidate(candidates, ISBN_PRINT)
    expect(advice.certain).toBe(true)
    expect(advice.recommended.label).toBe('print')
    expect(advice.reason).toContain('canceled in the ebook record')

    let other = recommendCandidate([ebookRecord(), printRecord()], ISBN_EBOOK)
    expect(other.certain).toBe(true)
    expect(other.recommended.label).toBe('ebook')
  })

  test('a hint from the format, date or size is not certain', () => {
    // two records that both list the ISBN as valid: nothing settles it
    let both = [printRecord(), printRecord()]
    both[1].inspection.lastModified = '2025-02-01T00:00:00'
    let advice = recommendCandidate(both, ISBN_PRINT)
    expect(advice.certain).toBe(false)
    expect(advice.recommended).toBe(both[1])

    // the scan is in neither record (the search matched on something else)
    let neither = [printRecord(), ebookRecord()]
    let byFormat = recommendCandidate(neither, '2024012345')
    expect(byFormat.certain).toBe(false)
    expect(byFormat.recommended.label).toBe('print')
  })

  test('scannedIdentifierStatus reads the status of the scan in a record', () => {
    expect(scannedIdentifierStatus(printRecord().inspection, ISBN_PRINT)).toBe('valid')
    expect(scannedIdentifierStatus(printRecord().inspection, '978-0-00-000066-1')).toBe('canceled')
    expect(scannedIdentifierStatus(printRecord().inspection, '1234')).toBe('absent')
    expect(scannedIdentifierStatus(null, ISBN_PRINT)).toBe('absent')
  })
})
