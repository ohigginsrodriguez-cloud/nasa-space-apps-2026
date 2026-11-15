import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { CircleHelp, MapPin, RotateCcw } from 'lucide-react'
import { CircleMarker, MapContainer, Marker, Rectangle, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { GeographicBounds, GeographicPoint } from '../../types'

interface MapSelectorProps {
  center: [number, number]
  value: GeographicBounds | null
  point: GeographicPoint | null
  onChange: (bounds: GeographicBounds | null) => void
  onPointChange: (point: GeographicPoint | null) => void
  onValidationChange?: (error: string | null) => void
}

type CoordinateDraft = Partial<GeographicBounds>

function MapController({ center, bounds, point }: { center: [number, number]; bounds: GeographicBounds | null; point: GeographicPoint | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]], { padding: [24, 24] })
    else if (point) map.setView([point.latitude, point.longitude], 6)
    else map.setView(center, 4)
  }, [bounds, center, map, point])
  return null
}

function ClickToBounds({ onCorner }: { onCorner: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) {
      const target = event.originalEvent.target as Element
      if (target.closest('.rectangle-drag-handle')) return
      onCorner(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function ResizeHandles({ bounds, onChange }: { bounds: GeographicBounds; onChange: (bounds: GeographicBounds) => void }) {
  const handles = [
    { key: 'south-west', latitude: bounds.south, longitude: bounds.west },
    { key: 'south-east', latitude: bounds.south, longitude: bounds.east },
    { key: 'north-west', latitude: bounds.north, longitude: bounds.west },
    { key: 'north-east', latitude: bounds.north, longitude: bounds.east },
  ]

  function moveHandle(key: string, latitude: number, longitude: number) {
    const next = { ...bounds }
    if (key.includes('south')) next.south = Math.min(latitude, bounds.north - 0.01)
    if (key.includes('north')) next.north = Math.max(latitude, bounds.south + 0.01)
    if (key.includes('west')) next.west = Math.min(longitude, bounds.east - 0.01)
    if (key.includes('east')) next.east = Math.max(longitude, bounds.west + 0.01)
    onChange(next)
  }

  return <>
    {handles.map((handle) => <Marker
      key={handle.key}
      position={[handle.latitude, handle.longitude]}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const position = event.target.getLatLng()
          moveHandle(handle.key, position.lat, position.lng)
        },
      }}
    />)}
  </>
}

function DraggableRectangle({ bounds, onChange }: { bounds: GeographicBounds; onChange: (bounds: GeographicBounds) => void }) {
  const map = useMap()
  const boundsRef = useRef(bounds)
  const onChangeRef = useRef(onChange)
  boundsRef.current = bounds
  onChangeRef.current = onChange
  const center: [number, number] = [(bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2]

  return (
    <>
      <Rectangle
        bounds={[[bounds.south, bounds.west], [bounds.north, bounds.east]]}
        pathOptions={{ color: '#1d4ed8', fillOpacity: 0.12 }}
      />
      <RectangleMoveHandle center={center} bounds={bounds} map={map} onChange={onChangeRef.current} />
    </>
  )
}

function RectangleMoveHandle({
  center,
  bounds,
  map,
  onChange,
}: {
  center: [number, number]
  bounds: GeographicBounds
  map: ReturnType<typeof useMap>
  onChange: (bounds: GeographicBounds) => void
}) {
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

const coordinateFields: Array<{ key: keyof GeographicBounds; label: string }> = [
  { key: 'south', label: 'South latitude' },
  { key: 'north', label: 'North latitude' },
  { key: 'west', label: 'West longitude' },
  { key: 'east', label: 'East longitude' },
]

export function MapSelector({ center, value, point, onChange, onPointChange, onValidationChange }: MapSelectorProps) {
  const [firstCorner, setFirstCorner] = useState<[number, number] | null>(null)
  const [draft, setDraft] = useState<CoordinateDraft>(value ?? {})
  const [selectionMode, setSelectionMode] = useState<'rectangle' | 'point'>('rectangle')
  const [message, setMessage] = useState('Click twice on the map to define opposite corners.')
  const [tilesUnavailable, setTilesUnavailable] = useState(false)
  const width = draft.west !== undefined && draft.east !== undefined ? draft.east - draft.west : null
  const height = draft.south !== undefined && draft.north !== undefined ? draft.north - draft.south : null
  const validPowerArea = width !== null && height !== null && width >= 2 && width <= 10 && height >= 2 && height <= 10

  useEffect(() => { setDraft(value ?? {}) }, [value])
  useEffect(() => {
    if (point) {
      setSelectionMode('point')
        setMessage(`Point selected: ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}.`)
    }
  }, [point])

  function applyPreset(size: number) {
    const half = size / 2
    const bounds = {
      south: Math.max(-90, center[0] - half),
      north: Math.min(90, center[0] + half),
      west: center[1] - half,
      east: center[1] + half,
    }
    setSelectionMode('rectangle')
    setFirstCorner(null)
    setDraft(bounds)
    onPointChange(null)
    onValidationChange?.(null)
    onChange(bounds)
    setMessage(`${size}° × ${size}° area applied. This size is valid for NASA POWER.`)
  }

  function setCorner(latitude: number, longitude: number) {
    longitude = ((longitude + 180) % 360 + 360) % 360 - 180
    if (selectionMode === 'point') {
      onValidationChange?.(null)
      onChange(null)
      onPointChange({ latitude, longitude })
       setMessage(`Point selected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}.`)
      return
    }
    if (!firstCorner) {
       onValidationChange?.('Complete the rectangle by selecting the second corner.')
      setFirstCorner([latitude, longitude])
       setMessage('First corner selected. Click the opposite corner.')
      return
    }
    const bounds = {
      south: Math.min(firstCorner[0], latitude),
      north: Math.max(firstCorner[0], latitude),
      west: Math.min(firstCorner[1], longitude),
      east: Math.max(firstCorner[1], longitude),
    }
    setFirstCorner(null)
    onValidationChange?.(null)
    setDraft(bounds)
    onPointChange(null)
    onChange(bounds)
      setMessage('Area defined. Drag the blue corners or edit the coordinates to adjust its size.')
  }

  function updateCoordinate(key: keyof GeographicBounds, rawValue: string) {
    const parsed = rawValue === '' ? undefined : Number(rawValue)
    const next = { ...draft, [key]: parsed }
    setDraft(next)
    const coordinates = [next.south, next.north, next.west, next.east]
    if (coordinates.some((coordinate) => coordinate === undefined || !Number.isFinite(coordinate))) {
       onValidationChange?.('Complete all four coordinates to continue.')
       setMessage('Complete all four coordinates to apply the rectangle.')
      return
    }
    if (next.south! < -90 || next.south! > 90 || next.north! < -90 || next.north! > 90 || next.west! < -180 || next.west! > 180 || next.east! < -180 || next.east! > 180) {
       onValidationChange?.('Latitudes: −90 to 90. Longitudes: −180 to 180.')
       setMessage('Latitudes: −90 to 90. Longitudes: −180 to 180.')
      return
    }
    if (next.south! >= next.north! || next.west! >= next.east!) {
       onValidationChange?.('South must be less than north and west less than east.')
       setMessage('Check that south is less than north and west is less than east.')
      return
    }
    onPointChange(null)
    onValidationChange?.(null)
    onChange({ south: next.south!, north: next.north!, west: next.west!, east: next.east! })
      setMessage('Coordinates applied. Drag the blue corners or edit them to adjust the size.')
  }

  function clearSelection() {
    onValidationChange?.(null)
    setDraft({})
    setFirstCorner(null)
    onPointChange(null)
    onChange(null)
    setMessage('Area cleared. Click twice on the map to begin.')
  }

  return (
    <section id="region" aria-labelledby="map-title" className="surface-panel scroll-mt-6 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="map-title" className="text-base font-semibold">Define an area of interest</h2><p className="mt-1 text-sm leading-relaxed text-muted">Select two corners or enter geographic coordinates.</p></div>
         <button type="button" onClick={clearSelection} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"><RotateCcw size={15} aria-hidden="true" />Clear area</button>
      </div>
       <div className="mb-3 flex flex-wrap items-center gap-2">
           <button type="button" aria-pressed={selectionMode === 'rectangle'} onClick={() => { setSelectionMode('rectangle'); setFirstCorner(null); onValidationChange?.('Select two corners to complete the rectangle.'); setMessage('Click twice on the map to define opposite corners.') }} className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition-all ${selectionMode === 'rectangle' ? 'border-accent bg-accent text-white' : 'border-line text-muted hover:border-accent hover:text-accent'}`}>Draw rectangle</button>
           <button type="button" aria-pressed={selectionMode === 'point'} onClick={() => { setSelectionMode('point'); setFirstCorner(null); onValidationChange?.('Select a point on the map to continue.'); setMessage('Click the map to select a point.') }} className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition-all ${selectionMode === 'point' ? 'border-accent bg-accent text-white' : 'border-line text-muted hover:border-accent hover:text-accent'}`}>Select point</button>
           {selectionMode === 'rectangle' && (
             <>
               <span className="ml-1 text-sm text-muted">Quick size:</span>
               <button type="button" onClick={() => applyPreset(2)} className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent">2° × 2°</button>
               <button type="button" onClick={() => applyPreset(5)} className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent">5° × 5°</button>
             </>
           )}
       </div>
       <div className={`mb-4 rounded-lg border px-3 py-2.5 text-sm ${validPowerArea ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
         <div className="flex flex-wrap items-center justify-between gap-2">
           <strong>{validPowerArea ? 'Valid NASA POWER area' : 'NASA POWER area requirement'}</strong>
           <span className="font-mono text-xs">
             {width !== null && height !== null ? `${width.toFixed(2)}° wide × ${height.toFixed(2)}° high` : 'Waiting for four coordinates'}
           </span>
         </div>
         <p className="mt-1 text-xs leading-relaxed">Regional queries require each side to measure between 2° and 10°. Use a quick size above if you do not want to adjust the rectangle manually.</p>
       </div>
       <div className="overflow-hidden rounded-lg border border-line shadow-inner">
         <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-72 w-full sm:h-96" aria-label="Map for defining a geographic rectangle">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTilesUnavailable(true) }} />
          <MapController center={center} bounds={value} point={point} />
          <ClickToBounds onCorner={setCorner} />
          {firstCorner && <CircleMarker center={firstCorner} radius={6} pathOptions={{ color: '#1d4ed8' }} />}
          {point && <CircleMarker center={[point.latitude, point.longitude]} radius={7} pathOptions={{ color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.9 }} />}
             {value && <><DraggableRectangle bounds={value} onChange={(bounds) => { onValidationChange?.(null); setFirstCorner(null); onPointChange(null); onChange(bounds); setDraft(bounds); setMessage('Area moved. Drag its corners to resize it.') }} /><ResizeHandles bounds={value} onChange={(bounds) => { onValidationChange?.(null); setFirstCorner(null); onPointChange(null); onChange(bounds); setDraft(bounds); setMessage('Area resized. Drag its center to move it.') }} /></>}
        </MapContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
         {coordinateFields.map(({ key, label }) => <label key={key} className="text-sm font-semibold">{label}<input type="number" step="any" min={key === 'south' || key === 'north' ? -90 : -180} max={key === 'south' || key === 'north' ? 90 : 180} value={draft[key] ?? ''} onChange={(event) => updateCoordinate(key, event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15" /></label>)}
      </div>
       <p role="status" aria-live="polite" className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{message}</p>
       {point && <p className="mt-1 text-sm text-muted">Point: {point.latitude.toFixed(4)}° lat, {point.longitude.toFixed(4)}° lon.</p>}
       {value && <p className="mt-1 text-sm text-muted">Area: {value.south.toFixed(3)}° to {value.north.toFixed(3)}° lat; {value.west.toFixed(3)}° to {value.east.toFixed(3)}° lon.</p>}
       {tilesUnavailable && <p role="status" className="mt-2 text-sm text-muted">Map tiles could not be loaded. You can continue by entering coordinates manually.</p>}
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted"><CircleHelp size={15} className="mt-0.5 shrink-0" aria-hidden="true" />Drag the blue center handle to move the entire area, drag a corner to resize it, or use the coordinate fields. NASA POWER accepts rectangles from 2° to 10° on each axis; use a point for smaller areas.</p>
    </section>
  )
}
