import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import '../App.css'

const ERROR_CORRECTION_LEVEL = 'H'
const QR_VERSIONS = Array.from({ length: 40 }, (_, i) => i + 1)

const SPLIT_PATTERNS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'diagonal', label: 'Diagonal' },
]

function renderPatternIcon(pattern) {
  if (pattern === 'vertical') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="1" width="7" height="14" fill="currentColor" opacity="0.4" />
      </svg>
    )
  }
  if (pattern === 'horizontal') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="1" width="14" height="7" fill="currentColor" opacity="0.4" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="1,1 15,1 15,15" fill="currentColor" opacity="0.4" />
      <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function findMinVersion(text) {
  for (let version = 1; version <= 40; version++) {
    try {
      QRCode.create(text, { errorCorrectionLevel: ERROR_CORRECTION_LEVEL, version })
      return version
    } catch (err) {
      if (err.message.includes('cannot contain')) continue
      if (err.message.includes('too big')) return null
      throw err
    }
  }
  return null
}

function getMinVersionForUrls(url1, url2) {
  const versions = [url1, url2].filter(Boolean).map(findMinVersion)
  if (versions.length === 0) return undefined
  if (versions.some((v) => v === null)) return null
  return Math.max(...versions)
}

function resolveQrVersion(url1, url2, requestedVersion) {
  const minVersion = getMinVersionForUrls(url1, url2)
  if (minVersion === null) return null
  return Math.max(requestedVersion, minVersion)
}

const HOME_TITLE = 'Dual-Link QR Code Generator | Two URLs in One QR Code'

export default function Home() {
  const [url1, setUrl1] = useState('')
  const [url2, setUrl2] = useState('')
  const [qrCodeData, setQrCodeData] = useState('')
  const [error, setError] = useState('')
  const [splitPattern, setSplitPattern] = useState('vertical')
  const [invertUrls, setInvertUrls] = useState(false)
  const [qrVersion, setQrVersion] = useState(4)

  useEffect(() => {
    document.title = HOME_TITLE
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const minVersion = getMinVersionForUrls(url1, url2)
      if (minVersion !== undefined) {
        setQrVersion(minVersion)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [url1, url2])

  const downloadQr = () => {
    const a = document.createElement('a')
    a.href = qrCodeData
    a.download = 'dual-qrcode.png'
    a.click()
  }

  const loadDemo = () => {
    const demoUrl1 = 'https://google.com'
    const demoUrl2 = 'https://youtube.com'
    setUrl1(demoUrl1)
    setUrl2(demoUrl2)
    generateDualQRCode({ overrideUrl1: demoUrl1, overrideUrl2: demoUrl2 })
  }

  const generateDualQRCode = async ({ overrideUrl1, overrideUrl2 } = {}) => {
    try {
      const inputUrl1 = overrideUrl1 ?? url1
      const inputUrl2 = overrideUrl2 ?? url2

      if (!inputUrl1 || !inputUrl2) {
        setError('Please enter both URLs')
        return
      }
      setError('')

      const version = resolveQrVersion(inputUrl1, inputUrl2, qrVersion)
      if (version === null) {
        setError('URLs are too long to fit in any QR code version')
        return
      }
      setQrVersion(version)

      const qrOptions = { errorCorrectionLevel: ERROR_CORRECTION_LEVEL, version }
      const qr1Data = await QRCode.create(inputUrl1, qrOptions)
      const qr2Data = await QRCode.create(inputUrl2, qrOptions)

      const moduleCount = qr1Data.modules.size
      const cellSize = 10
      const margin = 4 * cellSize
      const size = moduleCount * cellSize + 2 * margin

      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = size * scale
      canvas.height = size * scale
      const ctx = canvas.getContext('2d', { alpha: false })

      ctx.imageSmoothingEnabled = false
      ctx.scale(scale, scale)

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, size, size)

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          const cell1 = invertUrls ? qr2Data.modules.get(row, col) : qr1Data.modules.get(row, col)
          const cell2 = invertUrls ? qr1Data.modules.get(row, col) : qr2Data.modules.get(row, col)

          const x = col * cellSize + margin
          const y = row * cellSize + margin

          if (cell1 === cell2) {
            ctx.fillStyle = cell1 ? '#000000' : '#FFFFFF'
            ctx.fillRect(x, y, cellSize, cellSize)
          } else {
            if (splitPattern === 'diagonal') {
              ctx.fillStyle = cell1 ? '#000000' : '#FFFFFF'
              ctx.beginPath()
              ctx.moveTo(x, y)
              ctx.lineTo(x + cellSize, y)
              ctx.lineTo(x + cellSize, y + cellSize)
              ctx.fill()

              ctx.fillStyle = cell2 ? '#000000' : '#FFFFFF'
              ctx.beginPath()
              ctx.moveTo(x, y)
              ctx.lineTo(x, y + cellSize)
              ctx.lineTo(x + cellSize, y + cellSize)
              ctx.fill()
            } else if (splitPattern === 'horizontal') {
              ctx.fillStyle = cell1 ? '#000000' : '#FFFFFF'
              ctx.fillRect(x, y, cellSize, cellSize / 2)

              ctx.fillStyle = cell2 ? '#000000' : '#FFFFFF'
              ctx.fillRect(x, y + cellSize / 2, cellSize, cellSize / 2)
            } else {
              ctx.fillStyle = cell1 ? '#000000' : '#FFFFFF'
              ctx.fillRect(x, y, cellSize / 2, cellSize)

              ctx.fillStyle = cell2 ? '#000000' : '#FFFFFF'
              ctx.fillRect(x + cellSize / 2, y, cellSize / 2, cellSize)
            }
          }
        }
      }

      const dataUrl = canvas.toDataURL('image/png')
      setQrCodeData(dataUrl)
    } catch (err) {
      setError('Error generating QR code: ' + err.message)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      generateDualQRCode()
    }
  }

  return (
    <main className="app-main">
      <section className="controls-panel panel">
        <div className="panel-header">
          <h2 className="panel-title">Configuration</h2>
          <button type="button" className="btn-demo" onClick={loadDemo}>
            Try Demo
          </button>
        </div>

        <div className="field">
          <label htmlFor="url1" className="field-label">URL 1</label>
          <input
            id="url1"
            type="url"
            placeholder="https://example.com"
            value={url1}
            onChange={(e) => setUrl1(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="field">
          <label htmlFor="url2" className="field-label">URL 2</label>
          <input
            id="url2"
            type="url"
            placeholder="https://example.org"
            value={url2}
            onChange={(e) => setUrl2(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="field">
          <span className="field-label">Pixel split</span>
          <div className="pattern-segmented" role="group" aria-label="Pixel split pattern">
            {SPLIT_PATTERNS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`pattern-btn ${splitPattern === value ? 'active' : ''}`}
                onClick={() => setSplitPattern(value)}
                aria-pressed={splitPattern === value}
              >
                {renderPatternIcon(value)}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field field-row">
          <label htmlFor="qr-version" className="field-label">QR version</label>
          <select
            id="qr-version"
            value={qrVersion}
            onChange={(e) => setQrVersion(Number(e.target.value))}
          >
            {QR_VERSIONS.map((v) => (
              <option key={v} value={v}>
                v{v}
              </option>
            ))}
          </select>
        </div>

        <div className="field field-checkbox">
          <input
            type="checkbox"
            checked={invertUrls}
            onChange={(e) => setInvertUrls(e.target.checked)}
            id="invert-checkbox"
          />
          <label htmlFor="invert-checkbox">Invert pixel splitting</label>
        </div>

        {error && (
          <div className="error-alert" role="alert">
            {error}
          </div>
        )}

        <button type="button" className="btn-primary" onClick={() => generateDualQRCode()}>
          Generate QR Code
        </button>
      </section>

      <section className="preview-panel panel">
        <h2 className="panel-title">Preview</h2>

        <div className="preview-content">
          {qrCodeData ? (
            <div className="qr-code-mat">
              <img
                src={qrCodeData}
                alt="Generated dual-link QR code with two encoded URLs"
              />
            </div>
          ) : (
            <div className="preview-empty">
              <span>awaiting input…</span>
            </div>
          )}
        </div>

        {qrCodeData && (
          <button type="button" className="btn-secondary" onClick={downloadQr}>
            Download PNG
          </button>
        )}

        <p className="preview-hint">Try scanning from different angles</p>
      </section>
    </main>
  )
}
