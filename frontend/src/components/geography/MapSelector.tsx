import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { CircleHelp, MapPin } from 'lucide-react'
import { CircleMarker, MapContainer, Rectangle, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { GeographicBounds, GeographicPoint } from '../../types'

interface MapSelectorProps {
  center: [number, number]
  value: GeographicBounds | null
  point: GeographicPoint | null
  onChange: (bounds: GeographicBounds | null) => void
  onPointChange: (point: GeographicPoint | null) => void
  onValidationChange?: (error: string | null) => void
}

function MapController({ center, bounds, point }: { center: [number, number]; bounds: GeographicBounds | null; point: GeographicPoint | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]], { padding: [24, 24] })
    else if (point) map.setView([point.latitude, point.longitude], 6)
    else map.setView(center, 4)
  }, [bounds, center, map, point])
  return null
}

function PointPicker({ enabled, onPoint }: { enabled: boolean; onPoint: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) {
      if (enabled) onPoint(event.latlng.lat, event.latlng.lng)
    },
  })
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
    const south = Math.max(-90, Math.min(90 - height, original.south + latLng.lat - startLat))
    const west = Math.max(-180, Math.min(180 - width, original.west + latLng.lng - startLng))
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

function createBounds(center: [number, number], size = 5): GeographicBounds {
  const half = size / 2
  return {
    south: Math.max(-90, center[0] - half),
    north: Math.min(90, center[0] + half),
    west: center[1] - half,
    east: center[1] + half,
  }
}

export function MapSelector({ center, value, point, onChange, onPointChange, onValidationChange }: MapSelectorProps) {
  const [selectionMode, setSelectionMode] = useState<'rectangle' | 'point'>('rectangle')
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
    if (!point) {
      const initialBounds = createBounds(center)
      setDraft(initialBounds)
      onChange(initialBounds)
      onValidationChange?.(null)
    }
  }, [center, onChange, onValidationChange, point, value])

  function applyRectangle(size: number) {
    const bounds = createBounds(center, size)
    setSelectionMode('rectangle')
    setDraft(bounds)
    onPointChange(null)
    onValidationChange?.(null)
    onChange(bounds)
    setMessage(`${size}° × ${size}° area applied. This size is valid for NASA POWER.`)
  }

  function selectPoint(latitude: number, longitude: number) {
    const normalizedLongitude = ((longitude + 180) % 360 + 360) % 360 - 180
    setSelectionMode('point')
    setDraft(null)
    onValidationChange?.(null)
    onChange(null)
    onPointChange({ latitude, longitude: normalizedLongitude })
    setMessage(`Point selected: ${latitude.toFixed(4)}, ${normalizedLongitude.toFixed(4)}.`)
  }

  return (
    <section id="region" aria-labelledby="map-title" className="surface-panel scroll-mt-6 border-accent/20 bg-linear-to-br from-accent-soft/35 via-surface to-surface p-5 sm:p-6">
      <div className="mb-4">
        <h2 id="map-title" className="text-xl font-bold">Where should we investigate?</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">A valid NASA POWER rectangle is created for you. Move it to focus on another area.</p>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={selectionMode === 'rectangle'} onClick={() => applyRectangle(5)} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold transition-all ${selectionMode === 'rectangle' ? 'border-accent bg-accent text-white' : 'border-line text-muted hover:border-accent hover:text-accent'}`}>Use 5° × 5° area</button>
        <button type="button" aria-pressed={selectionMode === 'point'} onClick={() => { setSelectionMode('point'); onValidationChange?.(null); setMessage('Click the map to select a point for a smaller location.') }} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold transition-all ${selectionMode === 'point' ? 'border-accent bg-accent text-white' : 'border-line text-muted hover:border-accent hover:text-accent'}`}>Use a point instead</button>
        <button type="button" onClick={() => applyRectangle(2)} className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-muted hover:border-accent hover:text-accent">Use 2° × 2°</button>
      </div>
      <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${point ? 'border-teal-300 bg-teal-50 text-teal-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>{point ? 'Point selection' : validPowerArea ? 'Valid NASA POWER area' : 'Select a valid area'}</strong>
          <span className="font-mono text-xs">{point ? `${point.latitude.toFixed(2)}°, ${point.longitude.toFixed(2)}°` : draft ? `${width?.toFixed(2)}° wide × ${height?.toFixed(2)}° high` : 'Preparing area'}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed">{point ? 'A point is useful for locations smaller than the regional rectangle.' : 'The rectangle stays within NASA POWER’s 2°–10° limit on each axis.'}</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-line shadow-inner">
        <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-72 w-full sm:h-96" aria-label="Map for selecting a research area">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTilesUnavailable(true) }} />
          <MapController center={center} bounds={value} point={point} />
          <PointPicker enabled={selectionMode === 'point'} onPoint={selectPoint} />
          {point && <CircleMarker center={[point.latitude, point.longitude]} radius={7} pathOptions={{ color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.9 }} />}
          {value && <><Rectangle bounds={[[value.south, value.west], [value.north, value.east]]} pathOptions={{ color: '#1d4ed8', fillOpacity: 0.12 }} /><RectangleMoveHandle bounds={value} onChange={(bounds) => { setDraft(bounds); onPointChange(null); onChange(bounds); setMessage('Area moved. It remains a valid NASA POWER rectangle.') }} /></>}
        </MapContainer>
      </div>
      <p role="status" aria-live="polite" className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{message}</p>
      {tilesUnavailable && <p role="status" className="mt-2 text-sm text-muted">Map tiles could not be loaded. The predefined area remains usable.</p>}
      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted"><CircleHelp size={15} className="mt-0.5 shrink-0" aria-hidden="true" />The area starts at a valid size. Drag the blue center handle to move it; choose a point for a smaller location.</p>
    </section>
  )
}
