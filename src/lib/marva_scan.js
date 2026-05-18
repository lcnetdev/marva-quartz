/**
 * marva-scan client library
 *
 * Computer side: connects to WebSocket, generates QR code, receives results
 * from a paired phone that captures and uploads book images for extraction.
 *
 * Adapted from the upstream tsundoku-scan client lib.
 */

import QRCodeStyling from 'qr-code-styling'

export const MARVA_SCAN_WS_URL = 'wss://0xwe3mmkea.execute-api.us-east-1.amazonaws.com/prod'
export const MARVA_SCAN_PROCESS_URL = 'https://xdcgxaq95i.execute-api.us-east-1.amazonaws.com/prod/process'
export const MARVA_SCAN_MOBILE_URL = 'https://thisismattmiller.github.io/tsundoku-scan-test/index.html'

export class MarvaScan {
  constructor(opts = {}) {
    this.wsUrl = opts.wsUrl || MARVA_SCAN_WS_URL
    this.resourceId = opts.resourceId || null
    this.ws = null
    this.connectionId = null
    this.endpoint = null
    this.onSession = opts.onSession || null
    this.onResult = opts.onResult || null
    this.onStatus = opts.onStatus || null
    this.onError = opts.onError || null
    this.onClose = opts.onClose || null
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        const msg = { action: 'init' }
        if (this.resourceId) msg.resourceId = this.resourceId
        this.ws.send(JSON.stringify(msg))
      }

      this.ws.onmessage = (evt) => {
        let data
        try { data = JSON.parse(evt.data) } catch { return }

        if (data.action === 'session') {
          this.connectionId = data.connectionId
          this.endpoint = data.endpoint
          if (this.onSession) this.onSession(data)
          resolve(data)
        } else if (data.action === 'result') {
          if (this.onResult) this.onResult(data)
        } else if (data.action === 'status') {
          if (this.onStatus) this.onStatus(data)
        } else if (data.action === 'error') {
          if (this.onError) this.onError(data)
        }
      }

      this.ws.onerror = (err) => {
        if (this.onError) this.onError(err)
        reject(err)
      }

      this.ws.onclose = (evt) => {
        if (this.onClose) this.onClose(evt)
      }
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /** Build the URL embedded in the QR code (mobile pairing link). */
  getQRUrl(mobileUrl) {
    const url = new URL(mobileUrl)
    url.searchParams.set('cid', this.connectionId)
    if (this.resourceId) url.searchParams.set('rid', this.resourceId)
    return url.toString()
  }

  /**
   * Render a styled QR into a container.
   */
  renderQR(container, mobileUrl, opts = {}) {
    const data = this.getQRUrl(mobileUrl)
    const qr = new QRCodeStyling({
      width: opts.width || 280,
      height: opts.height || 280,
      data,
      type: 'svg',
      dotsOptions: {
        type: opts.dotType || 'rounded',
        color: opts.dotColor || '#1a1a2e',
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        color: opts.cornerColor || '#16213e',
      },
      backgroundOptions: {
        color: opts.bgColor || '#ffffff',
      },
      ...opts,
    })
    container.innerHTML = ''
    qr.append(container)
    return qr
  }

  /**
   * Retrieve any previously-stored results for a resource ID.
   * @returns { resourceId, results: { copyright: {...}, ... } }
   */
  static async retrieve(resourceId, processUrl = MARVA_SCAN_PROCESS_URL) {
    const retrieveUrl = processUrl.replace(/\/process$/, '/retrieve') +
      '?rid=' + encodeURIComponent(resourceId)
    const resp = await fetch(retrieveUrl)
    return resp.json()
  }

  /**
   * Get a presigned URL for the original captured image.
   */
  static async imageUrl(resourceId, category, index, processUrl = MARVA_SCAN_PROCESS_URL) {
    let qs = '?rid=' + encodeURIComponent(resourceId) +
      '&category=' + encodeURIComponent(category)
    if (index) qs += '&index=' + encodeURIComponent(index)
    const url = processUrl.replace(/\/process$/, '/image') + qs
    const resp = await fetch(url)
    return resp.json()
  }

  /**
   * Send a single captured image (as a JPEG data URL) to the processing
   * endpoint. The result will come back over the WebSocket as an `onResult`
   * event, keyed by the same connectionId.
   */
  static async sendPhoto({ connectionId, resourceId, imageDataUrl, category }, processUrl = MARVA_SCAN_PROCESS_URL) {
    const payload = { connectionId, image: imageDataUrl, category }
    if (resourceId) payload.resourceId = resourceId
    const resp = await fetch(processUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return resp.json()
  }

  /**
   * Multi-page upload flow (used for TOC): request N presigned PUT URLs,
   * upload each JPEG blob, then trigger processing with the resulting s3 keys.
   * @param {{connectionId: string, resourceId: string, category: string,
   *          dataUrls: string[]}} opts
   */
  static async sendBundle({ connectionId, resourceId, category, dataUrls }, processUrl = MARVA_SCAN_PROCESS_URL) {
    const count = dataUrls.length
    const uploadEndpoint = processUrl.replace(/\/process$/, '/upload')
    const uploadResp = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rid: resourceId || '', category, count }),
    })
    const uploadData = await uploadResp.json()
    if (uploadData.error) throw new Error(uploadData.error)
    const uploads = uploadData.uploads

    await Promise.all(uploads.map((u, i) => {
      const blob = dataUrlToBlob(dataUrls[i])
      return fetch(u.url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      }).then((r) => {
        if (!r.ok) throw new Error('Upload failed: ' + r.status)
      })
    }))

    const procResp = await fetch(processUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId,
        s3_keys: uploads.map((u) => u.key),
        category,
        resourceId: resourceId || '',
      }),
    })
    return procResp.json()
  }
}

function dataUrlToBlob(dataUrl) {
  const [header, b64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
