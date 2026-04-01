/**
 * Yoshino Subject Recommendation Service
 *
 * 3-step pipeline:
 *   1. Vector search API -> returns IDs of similar records
 *   2. Client-side enrich -> fetches BIBFRAME RDF from id.loc.gov, parses subjects
 *   3. LLM judge API -> ranks subjects by relevance
 */

const LAMBDA_URL = 'https://abeniabvmaysz2npcr3sr47fxq0xgoes.lambda-url.us-east-1.on.aws/'

const NS = {
  rdf:     'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  bf:      'http://id.loc.gov/ontologies/bibframe/',
  rdfs:    'http://www.w3.org/2000/01/rdf-schema#',
  madsrdf: 'http://www.loc.gov/mads/rdf/v1#',
  bflc:    'http://id.loc.gov/ontologies/bflc/',
}

let _baseUrl = null

/**
 * Probe preprod vs public id.loc.gov. Caches result for session.
 */
async function yoshinoResolveBaseUrl() {
  if (_baseUrl) return _baseUrl
  try {
    const test = await fetch('https://preprod.id.loc.gov/', {
      signal: AbortSignal.timeout(3000)
    })
    if (test.status !== 403) {
      _baseUrl = 'https://preprod.id.loc.gov'
      return _baseUrl
    }
  } catch {
    // preprod not available
  }
  _baseUrl = 'https://id.loc.gov'
  return _baseUrl
}

/**
 * Fetch BIBFRAME RDF for an instance ID, with one retry on 503.
 */
async function yoshinoFetchRdf(instanceId, base, retried = false) {
  const url = `${base}/resources/instances/${encodeURIComponent(instanceId)}.cbd.rdf`
  try {
    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/rdf+xml',
        'User-Agent': 'LC Yoshino',
      },
    })
    if (resp.status === 503 && !retried) {
      return yoshinoFetchRdf(instanceId, base, true)
    }
    if (!resp.ok) return null
    return await resp.text()
  } catch {
    return null
  }
}

/**
 * Process items in batches of `size`, running each batch concurrently.
 */
async function yoshinoProcessBatches(items, size, fn) {
  const out = []
  for (let i = 0; i < items.length; i += size) {
    out.push(...await Promise.all(items.slice(i, i + size).map(fn)))
  }
  return out
}

/**
 * Parse BIBFRAME RDF XML to extract subjects and classifications.
 */
function yoshinoParseRdf(xmlText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')
  const subjects = []
  const classifications = []

  const works = Array.from(doc.getElementsByTagNameNS(NS.bf, 'Work'))
  if (works.length === 0) return { subjects, classifications }
  const work = works[0]

  // Extract subjects
  for (const subjEl of Array.from(work.getElementsByTagNameNS(NS.bf, 'subject'))) {
    // Get the label from the direct child element's rdfs:label or madsrdf:authoritativeLabel
    // Must avoid picking up nested labels inside componentList
    const topChild = subjEl.children[0]
    if (!topChild) continue

    // Prefer rdfs:label directly on the top child (not nested)
    let labelEls = []
    for (const el of Array.from(topChild.getElementsByTagNameNS(NS.rdfs, 'label'))) {
      if (el.parentElement === topChild) { labelEls.push(el); break }
    }
    // Fall back to madsrdf:authoritativeLabel directly on the top child
    if (!labelEls.length) {
      for (const el of Array.from(topChild.getElementsByTagNameNS(NS.madsrdf, 'authoritativeLabel'))) {
        if (el.parentElement === topChild) { labelEls.push(el); break }
      }
    }
    if (!labelEls.length || !labelEls[0].textContent) continue

    let isBisac = false
    let sourceName = null
    for (const src of Array.from(subjEl.getElementsByTagNameNS(NS.bf, 'Source'))) {
      const about = src.getAttributeNS(NS.rdf, 'about') || ''
      const srcLabel = src.getElementsByTagNameNS(NS.rdfs, 'label')[0]?.textContent?.trim() || ''
      if (about.includes('bisacsh') || srcLabel.toLowerCase().includes('bisacsh')) {
        isBisac = true
        break
      }
      if (!sourceName && srcLabel) sourceName = srcLabel
    }
    if (isBisac) continue

    const label = labelEls[0].textContent.trim()
    const xml = new XMLSerializer().serializeToString(subjEl)

    // Extract top-level subject URI and marcKey from the direct child element (e.g. <bf:Topic rdf:about="...">)
    let topUri = null
    let topMarcKey = null
    if (topChild) {
      topUri = topChild.getAttributeNS(NS.rdf, 'about') || null
      // Get the direct marcKey on the top-level element (not nested inside componentList)
      for (const mk of Array.from(topChild.getElementsByTagNameNS(NS.bflc, 'marcKey'))) {
        // Only take marcKey that is a direct child of the top element, not inside componentList
        if (mk.parentElement === topChild) {
          topMarcKey = mk.textContent?.trim() || null
          break
        }
      }
    }

    // Extract component list details (URIs, types, marcKeys)
    const components = []
    const compListEls = subjEl.getElementsByTagNameNS(NS.madsrdf, 'componentList')
    if (compListEls.length > 0) {
      for (const child of Array.from(compListEls[0].children)) {
        const compUri = child.getAttributeNS(NS.rdf, 'about') || null
        let compLabel = child.getElementsByTagNameNS(NS.madsrdf, 'authoritativeLabel')[0]?.textContent?.trim()
          || child.getElementsByTagNameNS(NS.rdfs, 'label')[0]?.textContent?.trim()
          || null
        // Determine type from element local name (Topic, Geographic, Temporal, GenreForm, etc.)
        const compType = child.namespaceURI === NS.madsrdf
          ? 'http://www.loc.gov/mads/rdf/v1#' + child.localName
          : child.localName
        const marcKeyEl = child.getElementsByTagNameNS(NS.bflc, 'marcKey')[0]
        const compMarcKey = marcKeyEl?.textContent?.trim() || null

        // For HierarchicalGeographic, build full label from marcKey subfields (e.g. "181 $zNew York (State)$zNew York" -> "New York (State)--New York")
        if (compMarcKey && child.localName === 'HierarchicalGeographic') {
          const subfields = compMarcKey.replace(/^\d+\s*/, '').split('$').filter(Boolean)
          const parts = subfields.map(sf => sf.substring(1).trim()).filter(Boolean)
          if (parts.length > 1) {
            compLabel = parts.join('--')
          }
        }

        if (compLabel) {
          components.push({
            label: compLabel,
            uri: compUri,
            type: compType,
            marcKey: compMarcKey,
          })
        }
      }
    } else if (topChild) {
      // Simple subject - use top-level data as the single component
      const topType = topChild.namespaceURI === NS.madsrdf
        ? 'http://www.loc.gov/mads/rdf/v1#' + topChild.localName
        : topChild.namespaceURI === NS.bf
          ? 'http://id.loc.gov/ontologies/bibframe/' + topChild.localName
          : topChild.localName
      components.push({
        label,
        uri: topUri,
        type: topType,
        marcKey: topMarcKey,
      })
    }

    const subjectData = {
      label,
      xml,
      source: sourceName || 'Library of Congress Subject Headings',
      components,
      uri: topUri,
      marcKey: topMarcKey,
    }
    console.log('--- Yoshino: Parsed Subject ---')
    console.log('Subject XML:', xml)
    console.log('Parsed data:', JSON.parse(JSON.stringify(subjectData)))
    subjects.push(subjectData)
  }

  // Extract LCC classifications
  for (const classEl of Array.from(work.getElementsByTagNameNS(NS.bf, 'classification'))) {
    const lccEls = Array.from(classEl.getElementsByTagNameNS(NS.bf, 'ClassificationLcc'))
    if (!lccEls.length) continue
    const portionEl = lccEls[0].getElementsByTagNameNS(NS.bf, 'classificationPortion')
    if (!portionEl.length || !portionEl[0].textContent) continue
    const portion = portionEl[0].textContent.trim()
    classifications.push({ portion, xml: new XMLSerializer().serializeToString(classEl) })
  }

  return { subjects, classifications }
}

/**
 * Extract title from the Instance record in activeProfile.
 * Combines mainTitle + subtitle if both are present.
 */
function yoshinoExtractTitle(activeProfile) {
  for (let rt of activeProfile.rtOrder) {
    if (rt.indexOf(':Instance') === -1) continue
    for (let ptId of activeProfile.rt[rt].ptOrder) {
      let pt = activeProfile.rt[rt].pt[ptId]
      if (pt.propertyURI === 'http://id.loc.gov/ontologies/bibframe/title') {
        let titleObj = pt.userValue?.['http://id.loc.gov/ontologies/bibframe/title']?.[0]
        if (!titleObj) continue

        let mainTitleEntries = titleObj['http://id.loc.gov/ontologies/bibframe/mainTitle']
        if (!mainTitleEntries || !mainTitleEntries[0]) continue

        // Find best mainTitle: prefer Latin script, then no language tag, then first
        let mainTitle = null
        for (let entry of mainTitleEntries) {
          if (entry['@language'] && entry['@language'].toLowerCase().indexOf('latn') > -1) {
            mainTitle = entry['http://id.loc.gov/ontologies/bibframe/mainTitle']
            break
          }
        }
        if (!mainTitle) {
          for (let entry of mainTitleEntries) {
            if (!entry['@language']) {
              mainTitle = entry['http://id.loc.gov/ontologies/bibframe/mainTitle']
              break
            }
          }
        }
        if (!mainTitle) {
          mainTitle = mainTitleEntries[0]['http://id.loc.gov/ontologies/bibframe/mainTitle']
        }
        if (!mainTitle) continue

        // Check for subtitle
        let subtitle = null
        let subtitleEntries = titleObj['http://id.loc.gov/ontologies/bibframe/subtitle']
        if (subtitleEntries && subtitleEntries[0] && subtitleEntries[0]['http://id.loc.gov/ontologies/bibframe/subtitle']) {
          subtitle = subtitleEntries[0]['http://id.loc.gov/ontologies/bibframe/subtitle']
        }

        return subtitle ? `${mainTitle}: ${subtitle}` : mainTitle
      }
    }
  }
  return null
}

/**
 * Extract Work Summary literal from activeProfile.
 */
function yoshinoExtractSummary(activeProfile) {
  for (let rt of activeProfile.rtOrder) {
    if (rt.indexOf(':Work') === -1) continue
    for (let ptId of activeProfile.rt[rt].ptOrder) {
      let pt = activeProfile.rt[rt].pt[ptId]
      if (pt.propertyURI === 'http://id.loc.gov/ontologies/bibframe/summary') {
        if (pt.userValue &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/summary'] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/summary'][0] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/summary'][0]['http://www.w3.org/2000/01/rdf-schema#label'] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/summary'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/summary'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']
        ) {
          return pt.userValue['http://id.loc.gov/ontologies/bibframe/summary'][0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']
        }
      }
    }
  }
  return null
}

/**
 * Extract Primary Creator label from activeProfile.
 */
function yoshinoExtractCreator(activeProfile) {
  for (let rt of activeProfile.rtOrder) {
    if (rt.indexOf(':Work') === -1) continue
    for (let ptId of activeProfile.rt[rt].ptOrder) {
      let pt = activeProfile.rt[rt].pt[ptId]
      if (pt.propertyURI === 'http://id.loc.gov/ontologies/bibframe/contribution') {
        if (pt.userValue &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['@type'] === 'http://id.loc.gov/ontologies/bibframe/PrimaryContribution' &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['http://id.loc.gov/ontologies/bibframe/agent'] &&
            pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['http://id.loc.gov/ontologies/bibframe/agent'][0]
        ) {
          let agent = pt.userValue['http://id.loc.gov/ontologies/bibframe/contribution'][0]['http://id.loc.gov/ontologies/bibframe/agent'][0]
          if (agent['http://www.w3.org/2000/01/rdf-schema#label'] &&
              agent['http://www.w3.org/2000/01/rdf-schema#label'][0] &&
              agent['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']) {
            return agent['http://www.w3.org/2000/01/rdf-schema#label'][0]['http://www.w3.org/2000/01/rdf-schema#label']
          }
        }
      }
    }
  }
  return null
}

/**
 * Run the full Yoshino classification pipeline.
 *
 * @param {string} title - Work title
 * @param {string} summary - Work summary
 * @param {string} creator - Primary creator label (optional)
 * @param {function} onStatus - Callback for status updates: onStatus(message)
 * @returns {object} { recommended, allSubjects, subjectSources, subjectSourceMap, enrichResult }
 */
async function yoshinoClassify(title, summary, creator = '', onStatus = () => {}, topK = 10) {
  // Step 1: Vector search
  onStatus('Searching for similar records...')
  const classifyRes = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'classify',
      title,
      summary,
      creator,
      top_k: topK,
      ids_only: true,
    }),
  }).then(r => r.json())

  const ids = classifyRes.search_results
    .map(r => r.metadata?.['001'] || r.lc_001)
    .filter(Boolean)

  if (ids.length === 0) {
    throw new Error('No similar records found.')
  }

  // Step 2: Client-side enrich
  onStatus(`Fetching BIBFRAME data for ${ids.length} records...`)
  const base = await yoshinoResolveBaseUrl()
  const rdfResults = await yoshinoProcessBatches(ids, 2, async (id) => {
    const xml = await yoshinoFetchRdf(id, base)
    return { id, xml }
  })

  const allSubjects = []
  const subjectSources = {}
  const subjectSourceMap = {}
  const subjectXmlMap = {}
  const subjectComponentsMap = {}
  const subjectUriMap = {}
  const subjectMarcKeyMap = {}

  for (const { id, xml } of rdfResults) {
    if (!xml) continue
    const parsed = yoshinoParseRdf(xml)
    for (const s of parsed.subjects) {
      if (!subjectSources[s.label]) {
        allSubjects.push(s.label)
        subjectSources[s.label] = s.source
        subjectXmlMap[s.label] = s.xml
        subjectComponentsMap[s.label] = s.components
        if (s.uri) subjectUriMap[s.label] = s.uri
        if (s.marcKey) subjectMarcKeyMap[s.label] = s.marcKey
        subjectSourceMap[s.label] = id
      }
    }
  }

  if (allSubjects.length === 0) {
    throw new Error('No subjects found in the retrieved records.')
  }

  // Step 3: LLM judge
  onStatus('Ranking subjects by relevance...')
  const judgeRes = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'judge_subjects',
      subjects: allSubjects,
      text: `${title}. ${summary}`,
      top_n: Math.min(allSubjects.length, 10),
    }),
  }).then(r => r.json())

  const recommended = judgeRes.subjects || []
  const otherSubjects = allSubjects.filter(s => !new Set(recommended).has(s))

  onStatus('Done.')
  return {
    recommended,
    otherSubjects,
    allSubjects,
    subjectSources,
    subjectSourceMap,
    subjectXmlMap,
    subjectComponentsMap,
    subjectUriMap,
    subjectMarcKeyMap,
  }
}

export {
  yoshinoClassify,
  yoshinoExtractTitle,
  yoshinoExtractSummary,
  yoshinoExtractCreator,
}
