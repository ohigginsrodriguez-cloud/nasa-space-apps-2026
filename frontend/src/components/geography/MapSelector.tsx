import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { CircleHelp, MapPin } from 'lucide-react'
import { MapContainer, Rectangle, TileLayer, useMap } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import type { GeographicBounds } from '../../types'

interface MapSelectorProps {
  center: [number, number]
  value: GeographicBounds | null
  onChange: (bounds: GeographicBounds | null) => void
  onValidationChange?: (error: string | null) => void
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

function RectangleMoveHandle({ bounds, onChange }: { bounds: GeographicBounds; onChange: (bounds: GeographicBounds) => void }) {
  const map = useMap()
  const center: [number, number] = [(bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2]
  const [position, setPosition] = useState(() => map.latLngToContainerPoint(center))
  const dragRef = useRef<{ start: [number, number]; bounds: GeographicBounds } | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const updatePosition = () => setPosition(map.latLngToContainerPoint(center))
    updatePosition()
    map.on('move zoom resize', updatePosition)
    return () => { map.off('move zoom resize', updatePosition) }
  }, [map, center[0], center[1]])

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const rect = map.getContainer().getBoundingClientRect()
    const latLng = map.containerPointToLatLng([event.clientX - rect.left, event.clientY - rect.top])
    const [startLat, startLng] = dragRef.current.start
    const original = dragRef.current.bounds
    const height = original.north - original.south
    const width = original.east - original.west
    // Apply a small movement dampener so the rectangle does not feel too fast.
    const movementFactor = 0.8
    const south = Math.max(-90, Math.min(90 - height, original.south + (latLng.lat - startLat) * movementFactor))
    const west = Math.max(-180, Math.min(180 - width, original.west + (latLng.lng - startLng) * movementFactor))
    onChangeRef.current({ south, north: south + height, west, east: west + width })
  }

  return (
    <div
      className="rectangle-drag-handle"
      role="button"
      tabIndex={0}
      aria-label="Drag to move the entire area"
      title="Drag to move the entire area"
      style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = { start: center, bounds: { ...bounds } }
        map.dragging.disable()
      }}
      onPointerMove={move}
      onPointerUp={(event) => {
        event.stopPropagation()
        dragRef.current = null
        map.dragging.enable()
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onClick={(event) => event.stopPropagation()}
    >
      ↕
    </div>
  )
}

function DraggableRectangle({ bounds, onChange }: { bounds: GeographicBounds; onChange: (bounds: GeographicBounds) => void }) {
  const map = useMap()
  const dragRef = useRef<{ startLat: number; startLng: number; original: GeographicBounds } | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const move = useCallback((event: LeafletMouseEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const height = drag.original.north - drag.original.south
    const width = drag.original.east - drag.original.west
    const south = Math.max(-90, Math.min(90 - height, drag.original.south + event.latlng.lat - drag.startLat))
    const west = Math.max(-180, Math.min(180 - width, drag.original.west + event.latlng.lng - drag.startLng))
    onChangeRef.current({ south, north: south + height, west, east: west + width })
  }, [])

  const finish = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    map.off('mousemove', move)
    map.off('mouseup', finish)
    map.dragging.enable()
  }, [map, move])

  const start = useCallback((event: LeafletMouseEvent) => {
    event.originalEvent.preventDefault()
    event.originalEvent.stopPropagation()
    dragRef.current = {
      startLat: event.latlng.lat,
      startLng: event.latlng.lng,
      original: { ...bounds },
    }
    map.dragging.disable()
    map.on('mousemove', move)
    map.on('mouseup', finish)
  }, [bounds, finish, map, move])

  const stopClick = useCallback((event: LeafletMouseEvent) => {
    // A plain click selects nothing; only a held mouse drag may move the area.
    event.originalEvent.preventDefault()
    event.originalEvent.stopPropagation()
  }, [])

  useEffect(() => () => finish(), [finish])

  return (
    <Rectangle
      bounds={[[bounds.south, bounds.west], [bounds.north, bounds.east]]}
      pathOptions={{ color: '#1d4ed8', fillColor: '#1d4ed8', fillOpacity: 0.12, weight: 3, className: 'leaflet-area-draggable' }}
      eventHandlers={{ mousedown: start, click: stopClick }}
    />
  )
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

export function MapSelector({ center, value, onChange, onValidationChange }: MapSelectorProps) {
  const [draft, setDraft] = useState<GeographicBounds | null>(value)
  const [message, setMessage] = useState('A valid 5° × 5° area is ready. Drag the blue center handle to move it.')
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
    const bounds = createBounds(center, size)
    setDraft(bounds)
    onValidationChange?.(null)
    onChange(bounds)
    setMessage(`${size}° × ${size}° area applied. This size is valid for NASA POWER.`)
  }

  return (
    <section id="region" aria-labelledby="map-title" className="surface-panel scroll-mt-6 border-accent/20 bg-linear-to-br from-accent-soft/35 via-surface to-surface p-5 sm:p-6">
      <div className="mb-4">
        <h2 id="map-title" className="text-xl font-bold">Where should we investigate?</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">A valid NASA POWER rectangle is created for you. Click and hold the rectangle or its blue center handle, then drag to move it.</p>
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
        <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-72 w-full sm:h-96" aria-label="Map for selecting a research area">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTilesUnavailable(true) }} />
          <MapController center={center} bounds={value} />
          {value && <>
            <DraggableRectangle bounds={value} onChange={(bounds) => { setDraft(bounds); onChange(bounds); setMessage('Area moved. It remains a valid NASA POWER rectangle.') }} />
            <RectangleMoveHandle bounds={value} onChange={(bounds) => { setDraft(bounds); onChange(bounds); setMessage('Area moved. It remains a valid NASA POWER rectangle.') }} />
          </>}
        </MapContainer>
      </div>
      <p role="status" aria-live="polite" className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{message}</p>
      {tilesUnavailable && <p role="status" className="mt-2 text-sm text-muted">Map tiles could not be loaded. The predefined area remains usable.</p>}
      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted"><CircleHelp size={15} className="mt-0.5 shrink-0" aria-hidden="true" />The area moves only while you hold the mouse button and drag. Moving the cursor over it or clicking without dragging does not reset or move it. Choose a size above to change its dimensions. The map zoom stays where you set it.</p>
    </section>
  )
}
