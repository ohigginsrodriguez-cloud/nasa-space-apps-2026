import { useEffect, useRef, useState } from 'react'
import { CircleHelp, MapPin } from 'lucide-react'
import { CircleMarker, MapContainer, Rectangle, TileLayer, useMap } from 'react-leaflet'
import type { Rectangle as LeafletRectangle } from 'leaflet'
import type { GeographicBounds } from '../../types'

interface MapSelectorProps {
  center: [number, number]
  value: GeographicBounds | null
  onChange: (bounds: GeographicBounds | null) => void
  onValidationChange?: (error: string | null) => void
  id?: string
  title?: string
}

function MapController({ center, bounds }: { center: [number, number]; bounds: GeographicBounds | null }) {
  const map = useMap()
  const didInitialFit = useRef(false)

  useEffect(() => {
    // Fit the initial rectangle once. Subsequent bounds updates come from
    // dragging/resizing it and must not override the user's map zoom/pan.
    if (!bounds) {
      map.setView(center, 4)
      return
    }
    if (didInitialFit.current) return
    didInitialFit.current = true
    map.fitBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]], { padding: [24, 24] })
  }, [bounds, center, map])
  return null
}

function DraggableRectangle({ bounds, onChange }: { bounds: GeographicBounds; onChange: (bounds: GeographicBounds) => void }) {
  const map = useMap()
  const rectangleRef = useRef<LeafletRectangle | null>(null)
  const boundsRef = useRef(bounds)
  const onChangeRef = useRef(onChange)
  boundsRef.current = bounds
  onChangeRef.current = onChange

  useEffect(() => {
    const element = rectangleRef.current?.getElement() as SVGPathElement | undefined
    if (!element) return
    let drag: { pointerId: number; startX: number; startY: number; original: GeographicBounds } | null = null
    let mapWasDraggable = false

    const finish = () => {
      if (!drag) return
      const pointerId = drag.pointerId
      drag = null
      if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
      if (mapWasDraggable) map.dragging.enable()
      element.classList.remove('is-dragging')
    }
    const onDown = (event: globalThis.PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || drag) return
      event.preventDefault()
      event.stopPropagation()
      drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, original: { ...boundsRef.current } }
      mapWasDraggable = map.dragging.enabled()
      if (mapWasDraggable) map.dragging.disable()
      element.setPointerCapture(event.pointerId)
      element.classList.add('is-dragging')
    }
    const onMove = (event: globalThis.PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return
      // A release outside the map or a lost mouse-up must never leave a drag active.
      if (event.pointerType === 'mouse' && (event.buttons & 1) === 0) { finish(); return }
      const container = map.getContainer().getBoundingClientRect()
      const start = map.containerPointToLatLng([drag.startX - container.left, drag.startY - container.top])
      const current = map.containerPointToLatLng([event.clientX - container.left, event.clientY - container.top])
      const original = drag.original
      const height = original.north - original.south
      const width = original.east - original.west
      const south = Math.max(-90, Math.min(90 - height, original.south + current.lat - start.lat))
      const west = Math.max(-180, Math.min(180 - width, original.west + current.lng - start.lng))
      onChangeRef.current({ south, north: south + height, west, east: west + width })
    }
    const onUp = (event: globalThis.PointerEvent) => { if (drag?.pointerId === event.pointerId) finish() }
    const stopMouse = (event: MouseEvent) => event.stopPropagation()
    element.addEventListener('pointerdown', onDown)
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onUp)
    element.addEventListener('pointercancel', onUp)
    element.addEventListener('lostpointercapture', onUp)
    element.addEventListener('mousedown', stopMouse)
    element.addEventListener('click', stopMouse)
    window.addEventListener('blur', finish)
    return () => {
      finish()
      element.removeEventListener('pointerdown', onDown)
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', onUp)
      element.removeEventListener('lostpointercapture', onUp)
      element.removeEventListener('mousedown', stopMouse)
      element.removeEventListener('click', stopMouse)
      window.removeEventListener('blur', finish)
    }
  }, [map])

  return <>
    <Rectangle
      ref={rectangleRef}
      bounds={[[bounds.south, bounds.west], [bounds.north, bounds.east]]}
      pathOptions={{ color: '#1d4ed8', fillColor: '#1d4ed8', fillOpacity: 0.12, weight: 2, className: 'leaflet-area-draggable' }}
    />
    <CircleMarker center={[(bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2]}
      radius={3} interactive={false} pathOptions={{ color: '#fff', weight: 1, fillColor: '#1d4ed8', fillOpacity: 1 }} />
  </>
}

function createBounds(center: [number, number], size = 5): GeographicBounds {
  const half = size / 2
  const latitude = Math.max(-90 + half, Math.min(90 - half, center[0]))
  const longitude = Math.max(-180 + half, Math.min(180 - half, center[1]))
  return {
    south: latitude - half,
    north: latitude + half,
    west: longitude - half,
    east: longitude + half,
  }
}

export function MapSelector({ center, value, onChange, onValidationChange, id = 'region', title = 'Where should we investigate?' }: MapSelectorProps) {
  const [draft, setDraft] = useState<GeographicBounds | null>(value)
  const [message, setMessage] = useState('A valid 5° × 5° area is ready. Click and hold the rectangle to move it.')
  const [tilesUnavailable, setTilesUnavailable] = useState(false)
  const width = draft ? draft.east - draft.west : null
  const height = draft ? draft.north - draft.south : null
  const validPowerArea = width !== null && height !== null && width >= 2 && width <= 10 && height >= 2 && height <= 10

  useEffect(() => {
    if (value) {
      setDraft(value)
      return
    }
    const initialBounds = createBounds(center)
    setDraft(initialBounds)
    onChange(initialBounds)
    onValidationChange?.(null)
  }, [center, onChange, onValidationChange, value])

  function applyRectangle(size: number) {
    // Resizing changes only the dimensions. Keep the center of the current
    // selection, which may already have been moved away from the preset region.
    const currentBounds = draft ?? value
    const currentCenter: [number, number] = currentBounds
      ? [
          (currentBounds.south + currentBounds.north) / 2,
          (currentBounds.west + currentBounds.east) / 2,
        ]
      : center
    const bounds = createBounds(currentCenter, size)
    setDraft(bounds)
    onValidationChange?.(null)
    onChange(bounds)
    setMessage(`${size}° × ${size}° area applied. This size is valid for NASA POWER.`)
  }

  return (
    <section id={id} aria-labelledby={`${id}-map-title`} className="surface-panel scroll-mt-6 border-accent/20 bg-linear-to-br from-accent-soft/35 via-surface to-surface p-5 sm:p-6">
      <div className="mb-4">
        <h2 id={`${id}-map-title`} className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">A valid NASA POWER rectangle is created for you. Click and hold the rectangle, then drag to move it.</p>
      </div>
      <div className="mb-4">
        <p className="mb-2 text-sm font-semibold text-ink">Choose a valid rectangle size</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {[2, 3, 4, 5, 6, 8, 10].map((size) => (
            <button key={size} type="button" onClick={() => applyRectangle(size)} className="min-h-11 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent">
              {size}° × {size}°
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>{validPowerArea ? 'Valid NASA POWER area' : 'Select a valid area'}</strong>
          <span className="font-mono text-xs">{draft ? `${width?.toFixed(2)}° wide × ${height?.toFixed(2)}° high` : 'Preparing area'}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed">Every available size stays within NASA POWER’s 2°–10° limit on each axis.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-line shadow-inner">
          <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-72 w-full sm:h-96" aria-label={`Map for ${title}`}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTilesUnavailable(true) }} />
          <MapController center={center} bounds={value} />
          {value && <>
            <DraggableRectangle bounds={value} onChange={(bounds) => { setDraft(bounds); onChange(bounds); setMessage('Area moved. It remains a valid NASA POWER rectangle.') }} />
          </>}
        </MapContainer>
      </div>
      <p role="status" aria-live="polite" className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{message}</p>
      {tilesUnavailable && <p role="status" className="mt-2 text-sm text-muted">Map tiles could not be loaded. The predefined area remains usable.</p>}
      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted"><CircleHelp size={15} className="mt-0.5 shrink-0" aria-hidden="true" />The area moves only while you hold the mouse button and drag. Moving the cursor over it or clicking without dragging does not reset or move it. Choose a size above to change its dimensions. The map zoom stays where you set it.</p>
    </section>
  )
}
