/**
 * Workflows: telling apart the records a scan matched.
 *
 * A print book and its ebook are two instances that both carry both ISBNs, so searching the
 * ISBN on the barcode finds both. In the record, the ISBN of the *other* format is marked
 * canceled/invalid (MARC 020 $z), e.g. the print record has:
 *      <bf:Isbn><rdf:value>978...654</rdf:value><bf:qualifier>paperback</bf:qualifier></bf:Isbn>
 *      <bf:Isbn><rdf:value>978...661</rdf:value><bf:qualifier>ebook</bf:qualifier>
 *               <bf:status><bf:Status rdf:about=".../mstatus/cancinv">...</bf:Status></bf:status></bf:Isbn>
 * and the ebook record has the same two with the statuses swapped. So the record to load is
 * the one where the scanned ISBN is NOT canceled. The carrier (volume / online resource)
 * says which format each record is, for the user's benefit when it still needs asking.
 *
 * These functions are pure, they work on the record XML as text.
 */

const CANCELED_STATUS = /mstatus\/cancinv|canceled|cancelled|invalid/i
const EBOOK_CARRIER = /carriers\/cr\b|online resource/i
const EBOOK_WORDS = /\be-?book\b|electronic/i

function localName(el){
  return el.localName || el.nodeName.split(':').pop()
}

function children(el, name){
  return Array.from(el.childNodes).filter((n) => { return n.nodeType === 1 && localName(n) === name })
}

function text(el){
  return (el && el.textContent) ? el.textContent.trim() : ''
}

/**
* ISBNs and such are compared without hyphens or spaces
*/
export function normalizeIdentifier(value){
  return String(value || '').replace(/[\s-]/g, '').toLowerCase()
}

/**
* Find the instance the record is about, not one it refers to (the other format is often
* embedded in the same RDF as a related instance)
* @param {Document} doc
* @param {string} uri - the instance uri from the search result
* @return {Element|null}
*/
function findInstance(doc, uri){
  let instances = Array.from(doc.getElementsByTagNameNS('*', 'Instance'))
  if (instances.length == 0){ return null }
  let wanted = (uri || '').split('/').pop()
  if (wanted){
    let match = instances.filter((el) => {
      let about = el.getAttributeNS('http://www.w3.org/1999/02/22-rdf-syntax-ns#', 'about') || el.getAttribute('rdf:about') || ''
      return about.split('/').pop() === wanted
    })[0]
    if (match){ return match }
  }
  // otherwise the top most one
  return instances.filter((el) => { return localName(el.parentNode) === 'RDF' })[0] || instances[0]
}

/**
* Read the ISBNs and the format of the instance a record is about
* @param {string} xml - the record
* @param {string} uri - the instance uri (bfdbURL/idURL of the search result)
* @return {object|null} - { isbns:[{value, qualifier, canceled}], format:'print'|'ebook'|'unknown', carrier }
*   or null if the xml could not be read
*/
export function inspectRecord(xml, uri){
  if (!xml || typeof xml !== 'string'){ return null }
  let doc
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml')
  } catch (e) {
    return null
  }
  if (doc.getElementsByTagName('parsererror').length > 0){ return null }
  let instance = findInstance(doc, uri)
  if (!instance){ return null }

  let isbns = []
  for (let identifiedBy of children(instance, 'identifiedBy')){
    for (let isbn of children(identifiedBy, 'Isbn')){
      let value = normalizeIdentifier(text(children(isbn, 'value')[0]))
      if (!value){ continue }
      let statusText = children(isbn, 'status').map((s) => {
        let about = ''
        for (let st of children(s, 'Status')){ about = st.getAttribute('rdf:about') || '' }
        return about + ' ' + text(s)
      }).join(' ')
      isbns.push({
        value: value,
        qualifier: children(isbn, 'qualifier').map(text).join(' '),
        canceled: CANCELED_STATUS.test(statusText),
      })
    }
  }

  let carrier = ''
  let carrierAbout = ''
  for (let c of children(instance, 'carrier')){
    for (let el of children(c, 'Carrier')){
      carrierAbout += ' ' + (el.getAttribute('rdf:about') || '')
      carrier += ' ' + children(el, 'label').map(text).join(' ')
    }
  }
  let format = 'unknown'
  if (EBOOK_CARRIER.test(carrier + carrierAbout)){
    format = 'ebook'
  } else if (/carriers\/nc\b|\bvolume\b/i.test(carrier + carrierAbout)){
    format = 'print'
  } else {
    // no carrier, go by what the record's own (not canceled) isbn says it is
    let own = isbns.filter((i) => { return !i.canceled && i.qualifier })
    if (own.length > 0){
      format = own.some((i) => { return EBOOK_WORDS.test(i.qualifier) }) ? 'ebook' : 'print'
    }
  }

  // when it was last touched: the latest admin metadata date on the instance or its work
  let work = findWork(doc, instance)
  let lastModified = null
  for (let el of [instance, work]){
    if (!el){ continue }
    for (let d of Array.from(el.getElementsByTagNameNS('*', 'date'))){
      if (!isInsideAdminMetadata(d, el)){ continue }
      let value = text(d)
      if (!/^\d{4}-\d{2}-\d{2}T/.test(value)){ continue }
      if (!lastModified || value > lastModified){ lastModified = value }
    }
  }
  // how much is in it: the statements describing the instance and its work
  let size = countStatements(instance) + (work ? countStatements(work) : 0)

  return { isbns: isbns, format: format, carrier: carrier.replace(/\s+/g, ' ').trim(), lastModified: lastModified, size: size }
}

/**
* The Work element an instance says it is an instance of, if it is in the same document
*/
function findWork(doc, instance){
  let uri = null
  for (let io of children(instance, 'instanceOf')){
    uri = io.getAttribute('rdf:resource') || null
    if (!uri){
      for (let w of children(io, 'Work')){ return w }
    }
  }
  if (!uri){ return null }
  for (let w of Array.from(doc.getElementsByTagNameNS('*', 'Work'))){
    if ((w.getAttribute('rdf:about') || '') === uri){ return w }
  }
  return null
}

function isInsideAdminMetadata(el, stopAt){
  let p = el.parentNode
  while (p && p !== stopAt){
    if (localName(p) === 'adminMetadata'){ return true }
    p = p.parentNode
  }
  return false
}

function countStatements(el){
  let n = 0
  for (let child of Array.from(el.childNodes)){
    if (child.nodeType !== 1){ continue }
    // a nested Instance / Work is another resource, not part of this one's description
    if (['Instance', 'Work'].includes(localName(child))){ continue }
    n += 1 + countStatements(child)
  }
  return n
}

/**
* How a record relates to what was scanned
* @param {object} info - from inspectRecord
* @param {string} scanned
* @return {string} - 'valid' the scanned identifier is one of the record's own,
*   'canceled' the record lists it as canceled/invalid (it belongs to the other format),
*   'absent' the record doesn't list it (the search matched on something else)
*/
export function scannedIdentifierStatus(info, scanned){
  if (!info){ return 'absent' }
  let value = normalizeIdentifier(scanned)
  let matches = info.isbns.filter((i) => { return i.value === value })
  if (matches.length == 0){ return 'absent' }
  return matches.some((i) => { return !i.canceled }) ? 'valid' : 'canceled'
}

/**
* Work out which of the records a scan matched is most likely the thing scanned, once each one
* has been inspected. This only marks it, the user still picks.
* @param {array} candidates - search results, each with .inspection (from inspectRecord, or null) set
* @param {string} scanned
* @return {object} - { recommended: candidate|null, reason: string } reason says why, for the user
*/
export function recommendCandidate(candidates, scanned){
  for (let c of candidates){
    c.format = c.inspection ? c.inspection.format : 'unknown'
    c.scannedStatus = scannedIdentifierStatus(c.inspection, scanned)
    c.recommended = false
  }
  // the records that list the scan as one of their own identifiers
  let valid = candidates.filter((c) => { return c.scannedStatus === 'valid' })
  let canceled = candidates.filter((c) => { return c.scannedStatus === 'canceled' })

  if (valid.length == 1 && canceled.length > 0){
    valid[0].recommended = true
    let other = canceled.map((c) => { return formatLabel(c.format) }).join(', ')
    return { recommended: valid[0], reason: '"' + scanned + '" is canceled in the ' + other + ' record' }
  }
  if (valid.length == 1){
    valid[0].recommended = true
    return { recommended: valid[0], reason: 'the only record with "' + scanned + '" as its own identifier' }
  }
  // can't tell by the identifiers, the print one is what gets scanned off a shelf
  let print = candidates.filter((c) => { return c.format === 'print' })
  if (print.length == 1){
    print[0].recommended = true
    return { recommended: print[0], reason: 'the only print record' }
  }
  // still several (two print records of the same book): the one worked on most recently, then the fuller one
  let pool = (print.length > 1) ? print : candidates
  let dated = pool.filter((c) => { return c.inspection && c.inspection.lastModified })
  if (dated.length > 0){
    dated.sort((a, b) => { return (a.inspection.lastModified < b.inspection.lastModified) ? 1 : -1 })
    if (dated.length == 1 || dated[0].inspection.lastModified !== dated[1].inspection.lastModified){
      dated[0].recommended = true
      return { recommended: dated[0], reason: 'the most recently modified record (' + dated[0].inspection.lastModified.slice(0, 10) + ')' }
    }
  }
  let sized = pool.filter((c) => { return c.inspection && c.inspection.size })
  if (sized.length > 1){
    sized.sort((a, b) => { return b.inspection.size - a.inspection.size })
    if (sized[0].inspection.size !== sized[1].inspection.size){
      sized[0].recommended = true
      return { recommended: sized[0], reason: 'the fuller record (' + sized[0].inspection.size + ' statements)' }
    }
  }
  return { recommended: null, reason: '' }
}

export function formatLabel(format){
  return (format === 'ebook') ? 'ebook' : (format === 'print') ? 'print' : 'unknown format'
}
